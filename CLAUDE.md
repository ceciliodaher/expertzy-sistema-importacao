# CLAUDE.md - Sistema Integrado de Gestão de Declarações de Importação

## Visão Geral do Sistema

Sistema web modular para processamento automatizado de Declarações de Importação (DI) com duas funcionalidades principais integradas:

- **Geração automatizada de croquis** de notas fiscais de entrada
- **Cálculo preciso de precificação** com múltiplos regimes tributários e incentivos fiscais

**IMPLEMENTAÇÃO SISTEMA PROGRESSIVO**: 23/09/2025  
**STATUS ATUAL**: Sistema progressivo 98% funcional desde XML  
**PRÓXIMA FASE**: Sistema de backup completo (opcional)

## 🏛️ NOMENCLATURA OFICIAL - AUTORIDADE ÚNICA

### REGRA FUNDAMENTAL
**DIProcessor.js é o PRIMARY CREATOR** - único módulo autorizado a criar nomenclatura de campos. Todos os outros módulos DEVEM seguir exatamente seus nomes de campos.

### Hierarquia de Autoridade:
1. **DIProcessor.js**: PRIMARY CREATOR (cria nomenclatura oficial)
2. **IndexedDBManager.js**: Implementa schema seguindo DIProcessor  
3. **Demais módulos**: CONSUMERS (seguem nomenclatura estabelecida)

### Tabela de Nomenclatura Oficial

| Entidade | Nome OFICIAL | Nome PROIBIDO | Módulo Criador | Status |
|----------|--------------|---------------|----------------|---------|
| **Produtos/Itens** | `produtos` | ~~mercadorias~~, ~~items~~ | DIProcessor.js:366 | ✅ CORRIGIDO |
| **Despesas** | `despesas_aduaneiras` | ~~despesas~~, ~~expenses~~ | DIProcessor.js:1088 | ✅ CORRIGIDO |
| **Adições** | `adicoes` | ~~additions~~ | DIProcessor.js:290 | ✅ CORRETO |
| **Impostos** | `tributos` | ~~impostos~~, ~~taxes~~ | DIProcessor.js:404 | ✅ CORRETO |
| **Valor BRL** | `valor_reais` | ~~valor_brl~~, ~~amount_brl~~ | DIProcessor.js:332 | ✅ CORRETO |
| **Frete** | `frete_valor_reais` | ~~freight~~ | DIProcessor.js:348 | ✅ CORRETO |
| **Seguro** | `seguro_valor_reais` | ~~insurance~~ | DIProcessor.js:351 | ✅ CORRETO |
| **Totais** | `totais` | ~~totals~~ | DIProcessor.js:864 | ✅ CORRETO |
| **Importador** | `importador` | ~~importer~~ | DIProcessor.js:168 | ✅ CORRETO |
| **Carga** | `carga` | ~~cargo~~ | DIProcessor.js:179 | ✅ CORRETO |

### Violations Corrigidas (23/09/2025)

| Arquivo | Linha | Violação | Correção | Status |
|---------|-------|----------|----------|---------|
| IndexedDBManager.js | 227 | `adicao.mercadorias` | ✅ `adicao.produtos` | CORRIGIDO |
| IndexedDBManager.js | 248 | `diData.despesas` | ✅ `diData.despesas_aduaneiras` | CORRIGIDO |
| DataTransformer.js | 229 | `transformMercadorias()` | ✅ `transformProdutos()` | CORRIGIDO |
| DataValidator.js | 246 | `validateMercadoria()` | ✅ `validateProduto()` | CORRIGIDO |
| business-interface.js | 282 | `diData.despesas` | ✅ `diData.despesas_aduaneiras` | CORRIGIDO |

### Enforcement (OBRIGATÓRIO)

```javascript
// ✅ OBRIGATÓRIO: Validação em todos os módulos
if (objeto.mercadorias) {
    throw new Error('VIOLAÇÃO NOMENCLATURA: Use "produtos" não "mercadorias"');
}

if (objeto.despesas && !objeto.despesas_aduaneiras) {
    throw new Error('VIOLAÇÃO NOMENCLATURA: Use "despesas_aduaneiras" não "despesas"');
}

// ✅ IMPLEMENTADO: Nomenclatura correta em uso
if (adicao.produtos && adicao.produtos.length > 0) {
    // Processamento correto seguindo DIProcessor
}
```

### Zero Fallbacks para Nomenclatura

```javascript
// ❌ PROIBIDO: Fallbacks para nomenclatura incorreta
const items = objeto.produtos || objeto.mercadorias || [];

// ✅ OBRIGATÓRIO: Falha explícita para nomenclatura incorreta
if (!objeto.produtos) {
    throw new Error('Campo "produtos" obrigatório - não use "mercadorias"');
}
```

## Arquitetura Atual

### Stack Tecnológico

- **Frontend**: SPA JavaScript ES2020+ com componentes modulares
- **Storage**: IndexedDB via Dexie.js (schema v2 com processing_state)
- **Bibliotecas**: ExcelJS (Excel), jsPDF (PDF), Chart.js (Gráficos), Dexie.js (IndexedDB)
- **Build**: Vite + PostCSS + ESLint + Prettier
- **Testes**: Playwright (E2E) + Jest (Unitários)

### Estrutura Modular

```
expertzy-sistema-importacao/
├── src/
│   ├── core/
│   │   ├── calculators/     # ComplianceCalculator.js, ItemCalculator.js
│   │   ├── processors/      # DIProcessor.js (com validações NO FALLBACKS)
│   │   ├── exporters/       # ExcelExporter.js, ExportManager.js, MultiAdditionExporter.js, CroquiNFExporter.js (com incentivos)
│   │   ├── validators/      # CalculationValidator.js
│   │   ├── engines/         # PricingEngine.js
│   │   ├── incentives/      # IncentiveManager.js (NEW - Sistema de Incentivos Fiscais)
│   │   └── memory/          # ProductMemoryManager.js
│   ├── services/
│   │   ├── database/        # IndexedDBManager.js + Dexie.js (schema v2)
│   │   ├── transform/       # DataTransformer.js
│   │   ├── validation/      # DataValidator.js
│   │   └── migration/       # DataMigration.js
│   ├── shared/
│   │   ├── data/           # aliquotas.json, beneficios.json, ncms-vedados.json, reforma-tributaria.json
│   │   ├── styles/         # CSS modularizados
│   │   └── utils/          # Logger.js, excel-professional-styles.js, RegimeConfigManager.js, CostCalculationEngine.js
│   └── modules/
│       └── pricing/        # business-interface.js
├── documentos/             # PRD-Modulo-Incentivos-Fiscais.md, documentação NCMs vedados
├── di-interface.html       # Interface principal (sistema progressivo)
├── index.html              # Landing page
└── tests/e2e/             # Testes Playwright por fase
```

## ✅ SISTEMA PROGRESSIVO IMPLEMENTADO (23/09/2025)

### Resumo da Implementação

Sistema completamente refatorado para **salvamento progressivo** conforme especificado na conversa.md. A DI é agora **98% funcional** desde a importação XML, com dados reais utilizáveis imediatamente.

#### Funções de Salvamento Completo Implementadas:

1. **saveCompleteDI()** (`/src/di-interface.js`)
   - ✅ Salva DI completa com dados 98% funcionais do XML
   - ✅ Validações NO FALLBACKS para campos obrigatórios
   - ✅ Estado inicial: `'DI_COMPLETE_FROM_XML'`
   - ✅ Hash de integridade e XML original em base64

2. **saveCompleteAdicoes()** (`/src/di-interface.js`)
   - ✅ Salva adições com tributos federais já calculados
   - ✅ Custo básico federal calculável imediatamente
   - ✅ Estrutura completa: NCM, valores, logística, fornecedores

3. **saveCompleteProducts()** (`/src/di-interface.js`)
   - ✅ Produtos virtuais ou reais com tributos rateados
   - ✅ Cálculo automático de `custo_produto_federal`
   - ✅ Rateio proporcional de impostos por produto

4. **saveCompleteDespesas()** (`/src/di-interface.js`)
   - ✅ Despesas federais do XML (SISCOMEX, AFRMM, Capatazia)
   - ✅ Estrutura para despesas extras futuras
   - ✅ Códigos de receita corretos

#### Schema v2 IndexedDB com Estados Progressivos:

```javascript
// Schema v2 - Campos processing_state adicionados
{
    declaracoes: '++id, numero_di, importador_cnpj, data_processamento, *ncms, xml_hash, xml_content, processing_state, icms_configured, extra_expenses_configured',
    adicoes: '++id, di_id, numero_adicao, ncm, processing_state, custo_basico_federal',
    produtos: '++id, adicao_id, codigo, descricao, ncm, valor_unitario, processing_state, custo_produto_federal, is_virtual',
    despesas_aduaneiras: '++id, di_id, tipo, valor, codigo_receita, processing_state, origem'
    // ... outras tabelas
}
```

#### Estados de Processamento Implementados:

- **DI_COMPLETE_FROM_XML**: DI completa salva após XML (98% funcional)
- **ICMS_CALCULATED**: ICMS configurado e calculado
- **FINAL_COMPLETE**: Despesas extras configuradas (100% completo)

### Pipeline Progressivo Funcional:

```javascript
// Fluxo implementado em processarDI()
XML Import → parseXML() → validateXMLStructure() → 
  saveCompleteDI() → saveCompleteAdicoes() → 
  saveCompleteProducts() → saveCompleteDespesas() → 
  Sistema 98% funcional (opcional: ICMS + despesas extras)
```

## Padrões Críticos (OBRIGATÓRIOS)

### 1. Zero Fallbacks Policy (IMPLEMENTADO)

**✅ NUNCA use fallbacks implícitos:**

```javascript
// ❌ PROIBIDO
const aliquota = adicao.tributos?.ii_aliquota || 0;

// ✅ IMPLEMENTADO - validações NO FALLBACKS
if (!adicao.tributos?.ii_aliquota) {
    throw new Error(`Alíquota II ausente na adição ${adicao.numero_adicao}`);
}
```

### 2. Validação Fail-Fast Obrigatória (IMPLEMENTADO)

```javascript
// ✅ Implementado em validateXMLStructure()
validateXMLStructure(xmlDoc) {
    const numeroDI = xmlDoc.querySelector('numeroDeclaracaoImportacao');
    if (!numeroDI || !numeroDI.textContent.trim()) {
        throw new Error('XML inválido: numeroDeclaracaoImportacao é obrigatório');
    }
    // ... validações completas
}
```

### 3. Separação Rigorosa DRY (MANTIDO)

- **DIProcessor.js**: ÚNICA fonte de verdade para dados DI (com validações)
- **ComplianceCalculator.js**: ÚNICO responsável por cálculos tributários base
- **ExcelExporter.js**: ÚNICO engine de exportação Excel
- **IndexedDBManager.js**: ÚNICA interface com banco de dados (schema v2)

## Estrutura IndexedDB v2

### Schema Principal (13 Tabelas)

```javascript
const db = new Dexie('ExpertzyDB');
db.version(2).stores({
    // Entidades principais com processing_state
    declaracoes: '++id, numero_di, importador_cnpj, data_processamento, *ncms, xml_hash, xml_content, processing_state, icms_configured, extra_expenses_configured',
    adicoes: '++id, di_id, numero_adicao, ncm, processing_state, custo_basico_federal',
    produtos: '++id, adicao_id, codigo, descricao, ncm, valor_unitario, processing_state, custo_produto_federal, is_virtual',
    despesas_aduaneiras: '++id, di_id, tipo, valor, codigo_receita, processing_state, origem',

    // Tabelas de apoio (mantidas)
    dados_carga: '++id, di_id, peso_bruto, peso_liquido, via_transporte',
    incentivos_entrada: '++id, di_id, estado, tipo_beneficio, percentual_reducao, economia_calculada',
    incentivos_saida: '++id, di_id, estado, operacao, credito_aplicado, contrapartidas',
    elegibilidade_ncm: '++id, ncm, estado, incentivo_codigo, elegivel, motivo_rejeicao',
    
    // Business intelligence
    metricas_dashboard: '++id, periodo, tipo_metrica, valor, breakdown_estados',
    cenarios_precificacao: '++id, di_id, nome_cenario, configuracao, resultados_comparativos',
    
    // Auditoria e controle
    historico_operacoes: '++id, timestamp, operacao, modulo, detalhes, resultado',
    snapshots: '++id, di_id, nome_customizado, timestamp, dados_completos',
    configuracoes_usuario: 'chave, valor, timestamp, validado'
});
```

## Fluxo de Dados Implementado

### Pipeline Progressivo XML → DI Completa

```javascript
// 1. XML → Parsing + Validação (NO FALLBACKS)
const diData = await this.diProcessor.parseXML(xmlFile);
// validateXMLStructure() executa automaticamente

// 2. Salvamento completo imediato (98% funcional)
const diId = await saveCompleteDI(diData);
const adicoesIds = await saveCompleteAdicoes(diId, diData.adicoes);
const produtosIds = await saveCompleteProducts(adicoesIds, diData.adicoes);
await saveCompleteDespesas(diId, diData);

// 3. Sistema imediatamente funcional para:
// - Custos básicos federais
// - Relatórios de compliance
// - Croquis de notas fiscais
// - Análises preliminares de custos
```

## 🎯 MÓDULO DE INCENTIVOS FISCAIS IMPLEMENTADO (23/09/2025)

### Sistema Completo de Benefícios Fiscais Estaduais

O sistema agora inclui módulo completo de incentivos fiscais seguindo princípios KISS, DRY e NO FALLBACKS:

#### Estados Suportados:
- **🏆 Santa Catarina**: TTD 409/410/411 (diferimento parcial/total)
- **🏆 Minas Gerais**: Corredor de Importação (diferimento total)
- **🏆 Espírito Santo**: INVEST-ES (diferimento total)
- **🏆 Goiás**: COMEXPRODUZIR (crédito outorgado 65%)

#### Arquivos Criados:

**1. `/src/core/incentives/IncentiveManager.js`** (740 linhas)
```javascript
// Sistema centralizado de incentivos fiscais
class IncentiveManager {
    // Validação de elegibilidade (estado + NCMs)
    validateEligibility(estado, programa, ncms)
    
    // Cálculo de campos NF com CST 51 
    calculateNFFields(di, programa)
    
    // Impacto nos custos considerando reforma tributária
    calculateCostImpact(produtos, programa, year)
    
    // Projeções 2025-2033
    projectReformScenarios(startYear)
}
```

**2. `/src/shared/data/ncms-vedados.json`** (358 NCMs centralizados)
```json
{
    "vedacoes_por_programa": {
        "MG_CORREDOR": { "lista_negativa": [...], "padroes_wildcard": [...] },
        "GO_COMEXPRODUZIR": { "lista_negativa": [...] }, // 252 NCMs
        "SC_TTD_TODOS": { "lista_negativa": [...] },     // 85 NCMs
        "ES_OPERACIONAL": { "produtos_vedados_conceituais": [...] }
    },
    "mapeamento_programa_vedacao": {...}
}
```

**3. `/src/shared/data/reforma-tributaria.json`**
```json
{
    "cronograma": {
        "2025-2028": {"beneficios_icms": 1.0},
        "2029": {"beneficios_icms": 0.9, "cbs_ibs": 0.275},
        "2030": {"beneficios_icms": 0.8, "cbs_ibs": 0.28},
        "2033": {"beneficios_icms": 0.0, "cbs_ibs": 0.265}
    },
    "fundo_compensacao": {/*valores oficiais*/}
}
```

**4. `/documentos/PRD-Modulo-Incentivos-Fiscais.md`**
- Product Requirements Document completo
- Cronograma de implementação
- Métricas de sucesso
- Análise de riscos

#### Integração com CroquiNFExporter

**CroquiNFExporter.js** agora suporta incentivos fiscais:
```javascript
// Constructor aceita IncentiveManager
constructor(diData, calculosData, incentiveManager)

// Aplicação automática de incentivos
applyIncentivos() // Detecta estado, valida NCMs, aplica campos CST 51

// Campos específicos para diferimento
getIncentiveFields() // CST, vBC, vICMSOp, vICMS, vICMSDif, pDif, cBenef

// Integração na função global
window.gerarCroquiPDFNovo(diData, incentiveManager)
```

#### Refatoração DRY Implementada

**ANTES** (duplicação):
```json
// beneficios.json - CADA programa tinha seção ncms_restritos
"SC_TTD_409": {
    "ncms_restritos": {"lista_negativa": [...], "padroes": [...]}, // Duplicado
    "reforma_tributaria": {2025: {...}, 2026: {...}} // Duplicado
}
```

**DEPOIS** (centralizado):
```json
// beneficios.json - simplificado
{
    "reforma_tributaria_nacional": {2025: {...}}, // ÚNICO local
    "programas": {"SC_TTD_409": {/*sem duplicações*/}}
}

// ncms-vedados.json - arquivo dedicado
{
    "vedacoes_por_programa": {/*configuração única por estado*/},
    "mapeamento_programa_vedacao": {/*link programa -> vedação*/}
}
```

#### Funcionalidades Principais

**1. Validação Automática de Elegibilidade**
```javascript
const elegibilidade = incentiveManager.validateEligibility('SC', 'SC_TTD_409', ['2710', '8703']);
// ❌ NCMs restritos: combustíveis e veículos vedados
```

**2. Geração de Croqui com Diferimento CST 51**
```javascript
const diComIncentivo = incentiveManager.calculateNFFields(di, 'SC_TTD_409');
// ✅ CST: 51, vICMSDif: R$ 275.574,70, pDif: 94.91%, cBenef: SC830015
```

**3. Análise de Impacto de Custos**
```javascript
const custosComIncentivo = incentiveManager.calculateCostImpact(produtos, 'SC_TTD_409', 2030);
// ✅ Economia atual vs projeção reforma tributária
```

**4. Projeções da Reforma Tributária (2025-2033)**
```javascript
const cenarios = incentiveManager.projectReformScenarios(2025);
// ✅ Timeline completa com alertas por ano
```

### Estados de Processamento

```javascript
// Estado inicial (98% funcional)
{
    processing_state: 'DI_COMPLETE_FROM_XML',
    icms_configured: false,
    extra_expenses_configured: false
}

// Após configuração ICMS (opcional)
{
    processing_state: 'ICMS_CALCULATED',
    icms_configured: true,
    extra_expenses_configured: false
}

// Sistema completo (opcional)
{
    processing_state: 'FINAL_COMPLETE',
    icms_configured: true,
    extra_expenses_configured: true
}
```

## Comandos de Desenvolvimento

### Build e Deploy

```bash
# Desenvolvimento local
npm run dev              # Servidor desenvolvimento com hot reload
npm run build            # Build produção otimizado
npm run preview          # Preview build produção

# Qualidade código
npm run lint             # ESLint verificação
npm run lint:fix         # ESLint correção automática
npm run format           # Prettier formatação

# Testes
npm run test             # Testes unitários Jest
npm run test:watch       # Testes em watch mode
npm run test:e2e         # Testes E2E Playwright
npm run test:coverage    # Cobertura de código

# Servidor local
npm start                # Servidor Express na porta 8000
```

### Testes E2E por Fase

```bash
# Testes específicos implementação progressiva
npm run test:e2e:fase1   # Fundação e parsing XML
npm run test:e2e:xml     # Validação XMLStructure

# Validação qualidade
npm run test:performance # Benchmarks performance
npm run test:memory      # Vazamentos memória
```

## Tratamento de Erros e Logs

### Padrão de Logs Implementado

```javascript
// ✅ Implementado em todas as funções de salvamento
console.log(`📥 Salvando declaração completa: ${di.numero_di}`);
console.log(`📥 Salvando ${adicoes.length} adições completas com tributos federais`);
console.log(`📦 Salvando ${produtos.length} produtos com tributos rateados`);
console.log(`💰 Salvando ${despesas.length} despesas federais do XML`);
console.log(`✅ DI ${currentDI.numero_di} COMPLETA salva - sistema funcional!`);
```

### Critério de Logs Limpos (IMPLEMENTADO)

```javascript
// ✅ IMPLEMENTADO: Log apenas para operações importantes
if (!valor) {
    throw new Error('Valor obrigatório não fornecido'); // NO console.error
}

// ✅ Logs informativos estruturados
console.log('✅ Estrutura XML validada - todos os campos obrigatórios presentes');
```

## Performance e Otimização

### Requisitos Performance (MANTIDOS)

- **Processamento DI**: < 30 segundos (arquivo 10MB)
- **Salvamento progressivo**: < 5 segundos 
- **Geração dashboard**: < 10 segundos
- **Exportação relatórios**: < 15 segundos
- **Memory footprint**: < 512MB durante operação

### Otimizações Implementadas

```javascript
// ✅ Bulk inserts para performance
return await dbManager.db.adicoes.bulkAdd(adicoesRecords, { allKeys: true });
return await dbManager.db.produtos.bulkAdd(produtos, { allKeys: true });

// ✅ Hash de integridade para verificação rápida
xml_hash: generateSimpleHash(JSON.stringify(di))
```

## Segurança e Compliance

### Validação Input (IMPLEMENTADA)

```javascript
// ✅ Validação rigorosa XML em validateXMLStructure()
validateXMLStructure(xmlDoc) {
    // Verificar elemento raiz obrigatório
    const declaracao = xmlDoc.querySelector('declaracaoImportacao');
    if (!declaracao) {
        throw new Error('XML inválido: elemento declaracaoImportacao não encontrado');
    }
    // ... validações completas implementadas
}
```

### Auditoria Operations (ESTRUTURA PRONTA)

```javascript
// ✅ Preparado para audit trail
processing_state: 'DI_COMPLETE_FROM_XML',
xml_hash: generateSimpleHash(JSON.stringify(di)),
data_processamento: new Date().toISOString()
```

---

## 🎯 Resultados da Implementação Progressiva

### ✅ Funcionalidades Operacionais Imediatas

1. **Sistema 98% funcional** desde importação XML
2. **Custos básicos federais** calculáveis imediatamente  
3. **Relatórios compliance** já exportáveis
4. **Croquis de notas fiscais** já geráveis
5. **Dashboard com dados reais** sem necessidade de configuração adicional

### ✅ Dados Completos Salvos

- **Declaração**: Importador, carga, URF, modalidade, situação
- **Adições**: NCM, valores, tributos federais, fornecedores, fabricantes
- **Produtos**: Virtuais ou reais com tributos rateados proporcionalmente
- **Despesas**: SISCOMEX, AFRMM, Capatazia com códigos de receita corretos

### ✅ Opcionais (Steps 2-3)

- **Step 2**: Configuração ICMS (apenas complementa custos)
- **Step 3**: Despesas extras (apenas refina custos finais)

### 🚀 Próximas Funcionalidades

1. **Sistema de backup completo** (todas as 13 tabelas)
2. **Complementos ICMS** configuráveis
3. **Despesas extras** com rateio automático
4. **Dashboard analytics** com dados progressivos

---

## 🔧 Regras de Desenvolvimento (MANTIDAS)

### Princípios Fundamentais

- ✅ **No fallbacks, no hardcoded data** - IMPLEMENTADO
- ✅ **KISS (Keep It Simple, Stupid)** - MANTIDO
- ✅ **DRY (Don't Repeat Yourself)** - REFORÇADO
- ✅ **Nomenclatura única**: Módulo que cria, nomeia - demais seguem
- ✅ **Single Source of Truth**: Uma função, um propósito, um lugar

---

## Critérios de Qualidade Obrigatórios (MANTIDOS)

### Cada Release DEVE:

1. ✅ **100% testes E2E passando** sem warnings
2. ✅ **Zero memory leaks** detectados
3. ✅ **Performance mantida** dentro dos limites especificados
4. ✅ **Logs limpos** em operação normal (apenas INFO/DEBUG)
5. ✅ **Cobertura > 90%** em módulos críticos
6. ✅ **Documentação atualizada** para mudanças

### Cada Commit DEVE:

1. ✅ **Passar ESLint** sem warnings
2. ✅ **Formatação Prettier** aplicada
3. ✅ **Testes unitários relevantes** passando
4. ✅ **Mensagem descritiva** seguindo convenção
5. ✅ **Zero breaking changes** não documentados

---

*Este documento reflete o estado atual do sistema após a implementação completa do sistema progressivo conforme especificado na conversa.md. O sistema está agora 98% funcional desde a importação XML, com dados reais e utilizáveis imediatamente.*