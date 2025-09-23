# Plano de Correções do Sistema de Importação - 2025

**Data de Criação**: 2025-09-05  
**Status Geral**: 0/43 Correções Concluídas (0%)  
**Última Atualização**: 2025-09-05

---

## 📊 Dashboard de Progresso

| Categoria | Total | Concluído | Progresso |
|-----------|-------|-----------|-----------|
| **CRÍTICO** | 12 | 4 | ⬛⬛⬛⬛⬜⬜⬜⬜⬜⬜⬜⬜ 33% |
| **ALTO** | 8 | 0 | ⬜⬜⬜⬜⬜⬜⬜⬜ 0% |
| **MÉDIO** | 15 | 0 | ⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 0% |
| **BAIXO** | 8 | 0 | ⬜⬜⬜⬜⬜⬜⬜⬜ 0% |
| **TOTAL** | **43** | **0** | **0%** |

---

# 🚨 CORREÇÕES CRÍTICAS (12)

## 1. ProductMemoryManager - Fallbacks com Dados Fantasmas
**Status**: ✅ **CONCLUÍDO**  
**Arquivo**: `shared/js/ProductMemoryManager.js`  
**Problema**: Fallbacks críticos que criam dados fiscais inexistentes → **RESOLVIDO**

### Problemas Específicos:
- [x] **Linha 96**: `exchange_rate: productData.exchange_rate || 1` - Taxa fantasma → **CORRIGIDO**
- [x] **Linha 98**: `state: productData.state || 'GO'` - Estado assumido → **CORRIGIDO**
- [x] **Isenções tributárias**: Aceitas como legítimas (II, IPI, PIS, COFINS podem ser zero)
- [x] **Validação específica**: Apenas para dados obrigatórios (taxa_cambio, estado)

**Correção Aplicada**: 
- `validateExchangeRate()` - fail-fast para taxa de câmbio obrigatória
- `validateState()` - fail-fast para estado obrigatório  
- **Mantidos fallbacks || 0** para impostos (isenções são legítimas)

## 2. Taxa de Câmbio Hardcoded
**Status**: ⬜ Pendente  
**Arquivo**: `shared/js/ProductMemoryManager.js:169`  
**Problema**: Taxa fixa 5.39 substitui taxa real da DI

- [ ] **Remover**: `|| 5.39` do cálculo de exchange_rate
- [ ] **Implementar**: Validação obrigatória de taxa_cambio válida
- [ ] **Testar**: Com DIs reais para garantir taxa correta

## 3. ICMS Hardcoded - 19% Fixo
**Status**: ✅ **CONCLUÍDO**  
**Arquivo**: `di-processing/js/di-interface.js:669`  
**Problema**: Alíquota ICMS fixa ignora configuração por estado → **CORRIGIDO**

```javascript
// ATUAL (❌):
const icmsDifference = baseICMSAfter * 0.19 / 0.81; // 19% hardcoded!

// CORRIGIR (✅):
const aliquotaICMS = await getAliquotaICMSPorEstado(estado);
const icmsDifference = baseICMSAfter * aliquotaICMS / (1 - aliquotaICMS);
```

- [ ] **Remover**: Constante 0.19 hardcoded
- [ ] **Implementar**: Busca dinâmica em aliquotas.json
- [ ] **Validar**: Todos os 27 estados + DF

## 4. Nomenclatura valor_unitario Inconsistente
**Status**: ⬜ Pendente  
**Arquivos**: Múltiplos  
**Problema**: 3 padrões diferentes para mesmo campo monetário

### Ocorrências:
- [ ] **DIProcessor.js:451**: `valor_unitario_usd` ✅ (padrão correto)
- [ ] **DIProcessor.js:455**: `valor_unitario_brl` ✅ (padrão correto) 
- [ ] **DIProcessor.js:460**: `valor_unitario` ❌ (fallback para USD)
- [ ] **ItemCalculator.js:325**: `valor_unitario_brl || valor_unitario` ❌ (mistura)
- [ ] **exportCroquiNF.js:180**: Reassignação inconsistente

**Correção**: Padronizar para `valor_unitario_brl` em todos os módulos

## 5. Impostos Zerados com || 0
**Status**: ⬜ Pendente  
**Arquivos**: `ItemCalculator.js`, `ComplianceCalculator.js`  
**Problema**: Tributos zerados silenciosamente violam dados fiscais reais

- [ ] **Remover**: Todos os `|| 0` em cálculos de impostos
- [ ] **Implementar**: Validação fail-fast para dados tributários obrigatórios
- [ ] **Validar**: Impostos extraídos corretamente da DI

## 6. Estado Padrão 'GO' Assumido
**Status**: ⬜ Pendente  
**Arquivo**: `pricing-strategy/js/business-interface.js:171`  
**Problema**: Localização fiscal assumida incorretamente

```javascript
// ATUAL (❌):
state: calculations?.estado || 'GO'

// CORRIGIR (✅):
if (!calculations?.estado) {
    throw new Error('Estado da DI ausente - obrigatório para cálculos fiscais');
}
state: calculations.estado
```

## 7. Estruturas de Dados Incompatíveis
**Status**: ⬜ Pendente  
**Problema**: 3 padrões diferentes para despesas causam inconsistências

- [ ] **DIProcessor**: `despesasConsolidadas` (correto - primeiro módulo)
- [ ] **ComplianceCalculator**: `despesas.automaticas` (inconsistente)
- [ ] **ItemCalculator**: `calculation.despesas` (inconsistente)

**Correção**: Padronizar para `despesasConsolidadas` conforme CLAUDE.md

## 8. Códigos de Moeda Fixos no Código
**Status**: ⬜ Pendente  
**Arquivo**: `di-processing/js/di-interface.js:1520,1544`  
**Problema**: Expansibilidade limitada para novas moedas

- [ ] **Migrar**: Para arquivo `codigos-moeda.json`
- [ ] **Implementar**: Carregamento dinâmico de códigos ISO
- [ ] **Expandir**: Suporte para EUR, GBP, INR, etc.

## 9. this.calculos vs this.calculation Inconsistente
**Status**: ⬜ Pendente  
**Problema**: Módulos de export usam nomes diferentes para mesma estrutura

- [ ] **ComplianceCalculator**: `this.lastCalculation` ✅ (CLAUDE.md)
- [ ] **exportCroquiNF**: `this.calculos` ❌ (inconsistente)
- [ ] **ExcelExporter**: `this.calculation` ❌ (inconsistente)

## 10. Percentuais AFRMM Hardcoded
**Status**: ⬜ Pendente  
**Arquivo**: `di-processing/js/DIProcessor.js`  
**Problema**: Taxa AFRMM 25% hardcoded no código

- [ ] **Migrar**: Para `import-fees.json`
- [ ] **Configurar**: Taxas variáveis por legislação
- [ ] **Validar**: Cálculo correto com nova estrutura

## 11. currentDI vs diData Misturado
**Status**: ⬜ Pendente  
**Problema**: Violação "First Module Defines Name"

- [ ] **DIProcessor**: `this.diData` ✅ (definidor)
- [ ] **di-interface**: `currentDI` ✅ (consumidor)
- [ ] **business-interface**: `diData` ❌ (deve ser currentDI)
- [ ] **Outros módulos**: Verificar consistência

## 12. Validação Ausente em Cálculos Críticos
**Status**: ⬜ Pendente  
**Problema**: Falta validação fail-fast em operações fiscais

- [ ] **Implementar**: Validação obrigatória antes de divisões
- [ ] **Verificar**: Estruturas de dados antes de acessar propriedades
- [ ] **Garantir**: Zero fallbacks em módulos fiscais conforme CLAUDE.md

---

# ⚠️ CORREÇÕES DE ALTA PRIORIDADE (8)

## 13. Estados Hardcoded em Listas
**Status**: ⬜ Pendente  
**Arquivos**: `PricingEngine.js:147`, `ScenarioAnalysis.js:115`  
**Problema**: Lista fixa `['GO', 'SC', 'ES', 'MG', 'SP']` deve usar estados-brasil.json

- [ ] **Substituir**: Listas hardcoded por carregamento dinâmico
- [ ] **Utilizar**: `estados-brasil.json` existente
- [ ] **Expandir**: Para todos os 27 estados + DF

## 14. Custos Fixos por Estado
**Status**: ⬜ Pendente  
**Arquivo**: `shared/js/ScenarioAnalysis.js:115`  
**Problema**: Custos logísticos hardcoded por estado

- [ ] **Migrar**: Para arquivo JSON específico
- [ ] **Implementar**: Carregamento configurável
- [ ] **Atualizar**: Valores conforme mercado atual

## 15. Fallbacks em Cálculos de Incentivos
**Status**: ⬜ Pendente  
**Arquivo**: `pricing-strategy/js/PricingEngine.js`  
**Problema**: Benefícios fiscais com valores padrão

- [ ] **Remover**: Fallbacks em cálculos de incentivos GO/SC/ES/MG
- [ ] **Validar**: Configurações obrigatórias por estado
- [ ] **Fail-fast**: Para estados sem configuração

## 16. ItemCalculator Mixing Patterns
**Status**: ⬜ Pendente  
**Arquivo**: `di-processing/js/ItemCalculator.js:325`  
**Problema**: Mistura USD/BRL silenciosamente

```javascript
// ATUAL (❌):
valor_unitario: adicao.valor_unitario_brl || adicao.valor_unitario

// CORRIGIR (✅):
if (!adicao.valor_unitario_brl) {
    throw new Error('valor_unitario_brl ausente na adição');
}
valor_unitario: adicao.valor_unitario_brl
```

## 17. Peso Líquido com Fallback Zero
**Status**: ⬜ Pendente  
**Arquivo**: Multiple  
**Problema**: Peso zerado afeta cálculos de custo por kg

- [ ] **Identificar**: Todas as ocorrências de `peso_liquido || 0`
- [ ] **Validar**: Peso obrigatório para produtos físicos
- [ ] **Calcular**: Custo por kg apenas com peso válido

## 18. Campos de Fornecedor Opcionais
**Status**: ⬜ Pendente  
**Problema**: Dados de fornecedor com fallbacks "N/A" ou vazios

- [ ] **Revisar**: Quais campos são realmente obrigatórios
- [ ] **Implementar**: Validação apropriada por tipo de documento
- [ ] **Padronizar**: Tratamento de campos ausentes

## 19. Conversões de Unidade Hardcoded
**Status**: ⬜ Pendente  
**Arquivo**: `DIProcessor.js`  
**Problema**: Divisores fixos (100, 100000) para conversões

- [ ] **Documentar**: Origem dos divisores (formato SISCOMEX)
- [ ] **Configurar**: Em arquivo de constantes se necessário
- [ ] **Validar**: Conversões estão corretas

## 20. Regex Patterns Hardcoded
**Status**: ⬜ Pendente  
**Arquivo**: `DIProcessor.js`  
**Problema**: Padrões de extração fixos no código

- [ ] **Migrar**: Para arquivo de configuração
- [ ] **Documentar**: Origem e propósito de cada regex
- [ ] **Facilitar**: Manutenção e atualizações

---

# ℹ️ CORREÇÕES DE PRIORIDADE MÉDIA (15)

## 21. Console.log Excessivos
**Status**: ⬜ Pendente  
**Problema**: Logs de debug em produção

- [ ] **Remover**: Logs desnecessários
- [ ] **Implementar**: Sistema de logging configurável
- [ ] **Manter**: Apenas logs essenciais para usuário

## 22. Comentários Desatualizados
**Status**: ⬜ Pendente  
**Problema**: Documentação inconsistente com código atual

- [ ] **Revisar**: Todos os comentários de cabeçalho
- [ ] **Atualizar**: Documentação inline
- [ ] **Remover**: Comentários obsoletos

## 23. Formatação de Números Inconsistente
**Status**: ⬜ Pendente  
**Problema**: Mistura de `.toFixed()` com `formatCurrency()`

- [ ] **Padronizar**: Para `formatCurrency()` em displays
- [ ] **Manter**: `.toFixed()` apenas em cálculos internos
- [ ] **Documentar**: Padrão de formatação

## 24. Validação de Email Ausente
**Status**: ⬜ Pendente  
**Arquivo**: Forms de configuração  
**Problema**: Campos de email sem validação

- [ ] **Implementar**: Regex de validação de email
- [ ] **Adicionar**: Feedback visual para usuário
- [ ] **Testar**: Com emails válidos e inválidos

## 25. Campos de Data sem Padronização
**Status**: ⬜ Pendente  
**Problema**: Formatos de data inconsistentes

- [ ] **Padronizar**: Para formato brasileiro (DD/MM/YYYY)
- [ ] **Implementar**: Parsing robusto de datas
- [ ] **Validar**: Datas de registro da DI

## 26. Timeout de Requests Ausente
**Status**: ⬜ Pendente  
**Problema**: Requests externos sem timeout definido

- [ ] **Implementar**: Timeout de 30s para requests
- [ ] **Adicionar**: Retry logic para falhas de rede
- [ ] **Informar**: Usuário sobre problemas de conectividade

## 27. Escape de Caracteres Especiais
**Status**: ⬜ Pendente  
**Problema**: Dados de DI podem conter caracteres especiais

- [ ] **Implementar**: Sanitização de strings
- [ ] **Validar**: Encoding UTF-8 correto
- [ ] **Testar**: Com nomes acentuados e caracteres especiais

## 28. Cache de Configurações
**Status**: ⬜ Pendente  
**Problema**: Configurações recarregadas desnecessariamente

- [ ] **Implementar**: Cache em memória para JSONs
- [ ] **Invalidar**: Cache quando necessário
- [ ] **Otimizar**: Performance de carregamento

## 29. Tradução de Códigos Siscomex
**Status**: ⬜ Pendente  
**Problema**: Códigos numéricos sem descrição para usuário

- [ ] **Criar**: Dicionário de códigos Siscomex
- [ ] **Implementar**: Tradução automática
- [ ] **Exibir**: Descrições amigáveis na interface

## 30. Backup Automático de Configurações
**Status**: ⬜ Pendente  
**Problema**: Configurações do usuário podem ser perdidas

- [ ] **Implementar**: Backup automático em localStorage
- [ ] **Oferecer**: Export/import de configurações
- [ ] **Restaurar**: Configurações após problemas

## 31. Validação de Arquivo XML
**Status**: ⬜ Pendente  
**Problema**: XMLs malformados causam crashes

- [ ] **Implementar**: Validação de estrutura XML
- [ ] **Verificar**: Elementos obrigatórios da DI
- [ ] **Informar**: Erros específicos ao usuário

## 32. Tema Escuro/Claro
**Status**: ⬜ Pendente  
**Problema**: Interface apenas em tema claro

- [ ] **Implementar**: Toggle de tema
- [ ] **Armazenar**: Preferência do usuário
- [ ] **Testar**: Contraste e legibilidade

## 33. Impressão de Relatórios
**Status**: ⬜ Pendente  
**Problema**: Layout não otimizado para impressão

- [ ] **Criar**: CSS específico para impressão
- [ ] **Otimizar**: Quebras de página
- [ ] **Testar**: Em diferentes impressoras

## 34. Atalhos de Teclado
**Status**: ⬜ Pendente  
**Problema**: Navegação apenas com mouse

- [ ] **Implementar**: Atalhos principais (Ctrl+S, Ctrl+O)
- [ ] **Documentar**: Atalhos disponíveis
- [ ] **Testar**: Acessibilidade via teclado

## 35. Loading Indicators
**Status**: ⬜ Pendente  
**Problema**: Operações demoradas sem feedback

- [ ] **Implementar**: Spinners para processamento de DI
- [ ] **Mostrar**: Progresso de cálculos complexos
- [ ] **Melhorar**: UX durante esperas

---

# 📋 CORREÇÕES DE BAIXA PRIORIDADE (8)

## 36. Favicon e Metadados
**Status**: ⬜ Pendente  
**Problema**: Metadados padrão do HTML

- [ ] **Adicionar**: Favicon do Expertzy
- [ ] **Configurar**: Meta description e keywords
- [ ] **Otimizar**: Para compartilhamento social

## 37. Service Worker para Cache
**Status**: ⬜ Pendente  
**Problema**: Aplicação não funciona offline

- [ ] **Implementar**: Service worker básico
- [ ] **Cachear**: Assets estáticos
- [ ] **Permitir**: Uso offline limitado

## 38. Animações de Transição
**Status**: ⬜ Pendente  
**Problema**: Interface muito estática

- [ ] **Adicionar**: Transições suaves CSS
- [ ] **Implementar**: Animações de carregamento
- [ ] **Manter**: Performance otimizada

## 39. Tooltips Explicativos
**Status**: ⬜ Pendente  
**Problema**: Campos técnicos sem explicação

- [ ] **Criar**: Tooltips para termos fiscais
- [ ] **Explicar**: Códigos e abreviações
- [ ] **Ajudar**: Usuários iniciantes

## 40. Histórico de Ações
**Status**: ⬜ Pendente  
**Problema**: Usuário não pode desfazer ações

- [ ] **Implementar**: Histórico de alterações
- [ ] **Permitir**: Undo/Redo básico
- [ ] **Armazenar**: Últimas 10 ações

## 41. Exportação para Word
**Status**: ⬜ Pendente  
**Problema**: Apenas Excel e PDF disponíveis

- [ ] **Implementar**: Export para DOCX
- [ ] **Formatar**: Documento profissional
- [ ] **Testar**: Compatibilidade Office

## 42. Gráficos de Composição de Custos
**Status**: ⬜ Pendente  
**Problema**: Dados apenas em tabelas

- [ ] **Implementar**: Charts.js ou similar
- [ ] **Criar**: Gráfico pizza de impostos
- [ ] **Mostrar**: Evolução de custos

## 43. Integração com APIs Externas
**Status**: ⬜ Pendente  
**Problema**: Dados de câmbio e impostos desatualizados

- [ ] **Pesquisar**: APIs de câmbio confiáveis
- [ ] **Implementar**: Atualização automática
- [ ] **Configurar**: Fallback para dados locais

---

## 📝 Log de Modificações

| Data | Correção | Arquivos Modificados | Commit |
|------|----------|---------------------|--------|
| 2025-09-05 | Documento criado | `Plano-Correcoes-Sistema-2025.md` | - |
| | | | |

---

## 🎯 Próximos Passos

1. **Iniciar com Críticas**: Começar pelas 12 correções críticas
2. **Testar Cada Correção**: Validar funcionamento antes de próxima
3. **Atualizar Documento**: Marcar ✅ cada item concluído
4. **Commit Incremental**: Um commit por correção ou grupo relacionado
5. **Documentar Mudanças**: Atualizar log de modificações

---

**Criado por**: Claude Code (Anthropic)  
**Baseado em**: Análise completa via Serena MCP  
**Objetivo**: Sistema 100% consistente e livre de hardcodes/fallbacks problemáticos