# PRD - Refatoração do Sistema de Processamento de DIs (ATUALIZADO)

## Documento de Requisitos do Produto (PRD)
**Sistema Importa Precifica - Mudança Arquitetural Completa**

---

## 1. Visão Geral

### 1.1 Contexto ATUALIZADO
O Sistema Importa Precifica passou por uma migração arquitetural onde:
- **ANTES:** DIProcessor.js processava XML diretamente (dados brutos → processados)
- **AGORA:** Module 1 processa XML para banco + Module 2 deve trabalhar APENAS com dados processados

### 1.2 Descoberta Crítica da Análise
**DADOS JÁ ESTÃO PROCESSADOS NA API:**
- API retorna `valor_reais: "4819.22"` (não 481922 centavos)  
- API retorna `data_registro_formatada: "18/08/2025"` (já formatada)
- API retorna tributos já calculados e formatados
- **CONCLUSÃO**: Module 2 NÃO DEVE processar XML - deve ser um SELETOR + CALCULADOR

### 1.3 Problema Real Identificado
**ARQUITETURA DESATUALIZADA** causando confusão de responsabilidades:
- Module 2 ainda tem interface de "upload XML" (desnecessária)
- DIProcessor.js tem lógica de conversão que não é mais usada
- Interface espera processamento mas dados já vêm processados
- Erro `formatarData` é sintoma de arquitetura incorreta

### 1.4 Impacto
- ❌ Interface confusa com dois módulos fazendo upload
- ❌ Código morto (conversões desnecessárias)
- ❌ Arquitetura não reflete realidade dos dados
- ❌ User experience ruim (dois lugares para fazer a mesma coisa)

---

## 2. Objetivos ATUALIZADOS

### 2.1 Objetivo Principal
Refatorar completamente o Module 2 para refletir sua verdadeira função: **Seletor de DI + Calculador de Impostos ICMS**, eliminando toda lógica de processamento XML.

### 2.2 Objetivos Específicos
1. **Eliminar interface XML** do Module 2 (já existe no Module 1)
2. **Transformar em seletor** de DIs do banco de dados
3. **Focar apenas em cálculo ICMS** (único imposto não na DI)
4. **Simplificar arquitetura** seguindo princípio KISS
5. **Melhorar UX** com fluxo claro e sem duplicação

---

## 3. Análise Técnica Atual

### 3.1 Fluxo de Dados Atual (Problemático)
```
XML Bruto → Module 1 → [CONVERSÃO] → Banco (Dados Processados)
                                        ↓
Banco → API → [FORMATAÇÃO] → Module 2 → [CONVERSÃO NOVAMENTE] ❌
```

### 3.2 Evidências do Problema

#### No Module 1 (XMLImportProcessor.php):
```php
case 'monetary': return $numeric / 100;     // Converte 10120 → 101.20
case 'weight': return $numeric / 100000;    // Converte 20000 → 0.20000
```

#### No Module 2 (DIProcessor.js):
```javascript
case 'monetary': return value / 100;        // ❌ Reconverte 101.20 → 1.01
case 'weight': return value / 100000;       // ❌ Reconverte 0.20000 → 0.000002
```

#### Na API (buscar-di.php):
```php
$adicao['valor_reais'] = number_format($adicao['valor_reais'], 2, '.', '');
// Dados já processados sendo formatados para string
```

### 3.3 Estado dos Dados no Banco
**CONFIRMADO:** Dados no MySQL são **PROCESSADOS**, não brutos:
- `valor_reais: 101.20` (não `10120`)
- `peso_liquido: 0.20000` (não `20000`)
- `ii_aliquota_ad_valorem: 15.50` (não `1550`)

---

## 4. Nova Solução Proposta (KISS)

### 4.1 Nova Arquitetura de Responsabilidades

#### Module 1 (XML Import) - MANTÉM TUDO
```
✅ Upload e parser XML
✅ Conversão de dados (centavos → reais, etc.)
✅ Validação e normalização  
✅ Persistência no banco
✅ Interface visual com logs
```

#### API Layer - MANTÉM
```
✅ Serve dados já processados
✅ Formatação para exibição
✅ Paginação e filtros de busca
```

#### Module 2 (DI Processing) - REFATORA COMPLETA
```
✅ Seletor de DI do banco (lista com filtros)
✅ Carregamento de DI escolhida via API
✅ Cálculo ICMS por estado (único imposto não na DI)
✅ Interface de configuração de despesas manuais
✅ Exportação de compliance e relatórios
❌ REMOVE TUDO: Upload XML, conversões, processamento
```

### 4.2 Novo Fluxo de Dados KISS
```
Module 1: Upload XML → Processamento → Banco (✅ Já funciona)
                                        ↓
Module 2: Selecionar DI → API → Calcular ICMS → Compliance Report
```

---

## 5. Especificação de Mudanças COMPLETA

### 5.1 di-processor.html - Refatoração da Interface
```html
<!-- ❌ REMOVER COMPLETAMENTE: Step 1 com upload XML -->
<div id="step1-old">Upload XML e Processamento</div>

<!-- ✅ NOVO Step 1: Seleção de DI -->
<div id="step1-new">
    <h3>Selecionar DI para Cálculo de Impostos</h3>
    <div id="diSelectorTable">
        <!-- Lista de DIs com filtros e busca -->
    </div>
    <button onclick="loadSelectedDI()">Processar DI Selecionada</button>
</div>
```

### 5.2 DIProcessor.js → DataLoader.js
```javascript
// ❌ REMOVER TODAS: Funções de conversão XML
class DIProcessor {
    extractDadosGerais() { /* DELETE */ }
    extractAdicoes() { /* DELETE */ }
    convertValue() { /* DELETE */ }
    processXMLContent() { /* DELETE */ }
}

// ✅ NOVA CLASSE: Apenas carregamento de dados
class DataLoader {
    async loadDIFromAPI(numeroDI) {
        // Carrega dados já processados
        const response = await databaseConnector.buscarDI(numeroDI);
        return response.data; // Usar diretamente
    }
}
```

### 5.3 ComplianceCalculator.js - Trabalhar com Dados Processados
```javascript
// ✅ MODIFICAR: Receber dados processados diretamente
calcularICMS(diData, estadoDestino) {
    // diData.adicoes[0].valor_reais já é number
    const valorCIF = parseFloat(diData.adicoes[0].valor_reais);
    
    // Não converter - usar diretamente
    // ❌ const valorCIF = this.convertValue(rawValue, 'monetary');
}
```

### 5.4 Interface Step Flow - Simplificação
```
❌ FLUXO ANTIGO:
Step 1: Upload XML → Step 2: Review → Step 3: Calculate → Step 4: Export

✅ NOVO FLUXO:
Step 1: Select DI → Step 2: Configure ICMS → Step 3: Results → Step 4: Export
```

---

## 6. Casos de Teste

### 6.1 Teste de Consistência de Valores
```
Cenário: Valor no XML = "10120" (centavos)
- Module 1 processa: 10120 ÷ 100 = 101.20
- Banco armazena: 101.20
- API retorna: "101.20" (string formatada)
- Module 2 exibe: R$ 101,20 (formatação brasileira)
```

### 6.2 Teste de Funções de Formatação
```
formatarData("2025-09-11") → "11/09/2025"
formatarMoeda(101.20) → "R$ 101,20"
```

### 6.3 Teste de Carregamento de DI
```
1. Importar XML via Module 1
2. Carregar mesma DI via Module 2
3. Verificar valores idênticos
4. Executar cálculos e verificar consistência
```

---

## 7. Critérios de Aceitação

### 7.1 Funcionalidade
- [ ] Module 2 carrega sem erros JavaScript
- [ ] Valores monetários exibidos corretamente
- [ ] Datas formatadas no padrão brasileiro
- [ ] Cálculos de impostos corretos
- [ ] Exportações funcionais

### 7.2 Consistência
- [ ] Mesmos valores em Module 1 e Module 2
- [ ] Dados persistem corretamente entre sessões
- [ ] Não há dupla conversão de valores

### 7.3 Compatibilidade
- [ ] Dados já armazenados continuam funcionando
- [ ] APIs mantêm contratos existentes
- [ ] Exportações mantêm formato

---

## 8. Riscos e Mitigações

### 8.1 Risco: Quebrar Dados Existentes
**Mitigação:** Testar com dados reais já armazenados

### 8.2 Risco: Inconsistência Durante Migração
**Mitigação:** Implementar verificações de integridade

### 8.3 Risco: Regressão em Cálculos
**Mitigação:** Testes comparativos com sistema antigo

---

## 9. Cronograma de Implementação

### Fase 1: Correções Críticas (Imediato)
- Adicionar funções `formatarData` e `formatarMoeda`
- Corrigir carregamento de DIs

### Fase 2: Refatoração de Processamento (1-2 horas)
- Remover dupla conversão no DIProcessor.js
- Ajustar lógica de carregamento de dados

### Fase 3: Testes e Validação (30min)
- Testes com XMLs reais
- Validação de consistência end-to-end

---

## 10. Definição de Sucesso

**O sistema será considerado corrigido quando:**
1. Module 2 carregar sem erros JavaScript
2. Valores exibidos coincidirem com valores armazenados  
3. Workflow completo funcionar sem inconsistências
4. Todos os testes de regressão passarem

---

*Este PRD define a correção arquitetural necessária para eliminar a dupla conversão de dados e restaurar a funcionalidade completa do sistema.*