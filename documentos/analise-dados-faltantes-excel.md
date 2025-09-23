# Análise de Dados Faltantes - Excel Export vs Outros Relatórios

## Visão Geral

Esta análise identifica as inconsistências de referenciamento de dados entre o sistema de exportação Excel e os demais relatórios (PDF, JSON) que funcionam corretamente. O problema central é que **os dados estão disponíveis e processados corretamente**, mas o ExcelExporter.js usa referências incorretas para acessá-los.

## Tabela Comparativa - Dados Faltantes vs Relatórios Gerados

| **Dado Faltante** | **Excel Export** | **PDF Reports** | **JSON Reports** | **Origem do Dado por Relatório** |
|---|---|---|---|---|
| **Descrição da Adição** | ❌ N/D (`descricao_mercadoria` inexistente) | ✅ Funciona (`descricao_ncm`) | ✅ Funciona (`descricao_ncm`) | DIProcessor: `adicao.descricao_ncm` |
| **Valor Moeda Negociação** | ❌ N/D (`valor_moeda_negociacao`) | ✅ Funciona (`condicao_venda_valor_moeda`) | ✅ Funciona (`condicao_venda_valor_moeda`) | DIProcessor: `adicao.condicao_venda_valor_moeda` |
| **INCOTERM** | ❌ N/D (`condicao_venda_incoterm`) | ✅ Funciona (`incoterm`) | ✅ Funciona (`incoterm`) | DIProcessor: `adicao.incoterm` |
| **Endereço Importador** | ❌ N/D (campos separados não mapeados) | ✅ Funciona (endereço completo) | ✅ Funciona (campos individuais) | DIProcessor: `importador.endereco_*` |
| **URF Despacho** | ❌ N/D (`urf_despacho`) | ✅ Funciona (`urf_despacho_nome`) | ✅ Funciona (`urf_despacho_nome`) | DIProcessor: `urf_despacho_nome` |
| **Modalidade Despacho** | ❌ N/D (`modalidade_despacho`) | ✅ Funciona (`modalidade_despacho_nome`) | ✅ Funciona (`modalidade_despacho_nome`) | DIProcessor: `modalidade_despacho_nome` |
| **Produtos Individuais** | ❌ N/D (estrutura incorreta) | ✅ Funciona (`produtos_individuais`) | ✅ Funciona (`produtos_individuais`) | ComplianceCalculator: `produtos_individuais` |
| **Impostos por Item** | ❌ N/D (acesso direto a `produto.ii_item`) | ✅ Funciona (via `produtos_individuais`) | ✅ Funciona (via `produtos_individuais`) | ComplianceCalculator: `produtos_individuais[].ii_item` |
| **Despesas Rateadas** | ❌ N/D (`despesas_rateadas` opcional) | ✅ Funciona (com fallback) | ✅ Funciona (com fallback) | ComplianceCalculator: `adicoes_detalhes[].despesas_rateadas` |
| **Total ICMS** | ❌ N/D (campo não encontrado) | ✅ Funciona (`icms.valor_devido`) | ✅ Funciona (`icms.valor_devido`) | ComplianceCalculator: `impostos.icms.valor_devido` |
| **Situação DI** | ❌ N/D (`situacao`) | ✅ Funciona (`situacao_nome`) | ✅ Funciona (`situacao_nome`) | DIProcessor: `situacao_nome` |
| **Cidade Importador** | ❌ N/D (`endereco_cidade`) | ✅ Funciona (`cidade`) | ✅ Funciona (`cidade`) | DIProcessor: `importador.cidade` |
| **CEP Importador** | ❌ N/D (`endereco_cep`) | ✅ Funciona (`cep`) | ✅ Funciona (`cep`) | DIProcessor: `importador.cep` |
| **Via Transporte** | ❌ N/D (`via_transporte`) | ✅ Funciona (`via_transporte_nome`) | ✅ Funciona (`via_transporte_nome`) | DIProcessor: `via_transporte_nome` |
| **País Origem** | ❌ N/D (`pais_origem`) | ✅ Funciona (`pais_origem_nome`) | ✅ Funciona (`pais_origem_nome`) | DIProcessor: `pais_origem_nome` |
| **Descrição Mercadoria (Produto)** | ❌ N/D (`descricao_mercadoria`) | ✅ Funciona (`descricao`) | ✅ Funciona (`descricao`) | ComplianceCalculator: `produtos_individuais[].descricao` |

## Análise por Tipo de Relatório

### **✅ JSON Reports** (100% Dados Completos)
- **Arquivos**: `memoria_calculo_2300120746.json`, `relatorio_impostos_2300120746.json`
- **Origem**: Usa dados diretamente do `currentDI` e `currentCalculation`  
- **Mapeamento**: Correto em todos os campos
- **Estrutura**: Preserva hierarquia original dos dados
- **Sistema**: Acessa dados via referências diretas aos objetos processados

### **✅ PDF Reports** (95% Dados Completos)  
- **Arquivo**: `Croqui_NF_2300120746_20250909.pdf`
- **Origem**: `exportCroquiNF.js` usa `produtos_individuais` corretamente
- **Mapeamento**: Usa nomes de campos corretos do DIProcessor e ComplianceCalculator
- **Fallbacks**: Implementa tratamento gracioso para dados opcionais
- **Sistema**: Usa `this.calculationData.produtos_individuais` corretamente

### **❌ Excel Export** (60% Dados Completos)
- **Arquivo**: `ExtratoDI_COMPLETO_2300120746_02-01-2023_WPX_IMPORTACAO_E_EXP.xlsx`
- **Origem**: `ExcelExporter.js` tenta acessar campos com nomes incorretos
- **Problemas Críticos**: 
  - Campo `descricao_mercadoria` → deve ser `descricao_ncm`
  - Campo `valor_moeda_negociacao` → deve ser `condicao_venda_valor_moeda`  
  - Campo `condicao_venda_incoterm` → deve ser `incoterm`
  - Acesso direto a `adicao.produtos` → deve usar `produtos_individuais` calculados

## Estrutura de Dados Correta

### **DIProcessor.js Output Structure (this.diData)**
```javascript
{
  numero_di: "2300120746",
  situacao_nome: "Desembaraçado",
  urf_despacho_nome: "Porto de Santos",
  modalidade_despacho_nome: "Normal",
  via_transporte_nome: "Marítima",
  pais_origem_nome: "China",
  importador: {
    nome: "WPX IMPORTACAO E EXPORTACAO LTDA",
    cnpj: "05.346.351/0001-08",
    endereco: "Endereço completo",
    cidade: "SAO PAULO",
    endereco_uf: "SP",
    cep: "04038-001"
  },
  adicoes: [{
    numero_adicao: "1",
    descricao_ncm: "Descrição da mercadoria conforme NCM",
    ncm: "8517.12.31",
    condicao_venda_valor_moeda: 12345.67,
    incoterm: "CFR",
    produtos: [...]
  }]
}
```

### **ComplianceCalculator.js Output Structure (this.calculationData)**
```javascript
{
  impostos: {
    ii: { valor_devido: 1234.56 },
    icms: { valor_devido: 2345.67, aliquota: 18 }
  },
  produtos_individuais: [{
    adicao_numero: "1",
    codigo: "PROD001",
    descricao: "Produto específico",
    ii_item: 123.45,
    ipi_item: 234.56,
    pis_item: 34.56,
    cofins_item: 167.89,
    icms_item: 345.67
  }],
  adicoes_detalhes: [{
    numero_adicao: "1",
    despesas_rateadas: {
      frete: 100.00,
      seguro: 50.00,
      afrmm: 25.00,
      siscomex: 493.56
    }
  }]
}
```

## Mapeamento de Correções Necessárias

### **1. Correções Críticas por Arquivo/Linha**

| **Arquivo** | **Linha Aprox.** | **Código Atual (Incorreto)** | **Código Correto** | **Prioridade** |
|---|---|---|---|---|
| ExcelExporter.js | ~102 | `this.diData.situacao` | `this.diData.situacao_nome` | Alta |
| ExcelExporter.js | ~99 | `this.diData.urf_despacho` | `this.diData.urf_despacho_nome` | Alta |
| ExcelExporter.js | ~100 | `this.diData.modalidade_despacho` | `this.diData.modalidade_despacho_nome` | Alta |
| ExcelExporter.js | ~130 | `importador.endereco_cidade` | `importador.cidade` | Alta |
| ExcelExporter.js | ~132 | `importador.endereco_cep` | `importador.cep` | Alta |
| ExcelExporter.js | ~354 | `adicao.descricao_mercadoria` | `adicao.descricao_ncm` | Crítica |
| ExcelExporter.js | ~356 | `adicao.valor_moeda_negociacao` | `adicao.condicao_venda_valor_moeda` | Crítica |
| ExcelExporter.js | ~355 | `adicao.condicao_venda_incoterm` | `adicao.incoterm` | Crítica |
| ExcelExporter.js | ~681 | Acesso direto a `adicao.produtos` | Usar `this.calculationData.produtos_individuais` | Crítica |
| ExcelExporter.js | ~686-697 | `produto.descricao_mercadoria` | `produto.descricao` (de produtos_individuais) | Crítica |

### **2. Padrão de Correções**

#### **A. Campos DIProcessor (this.diData)**
```javascript
// ❌ Incorreto
this.diData.situacao
this.diData.urf_despacho
this.diData.modalidade_despacho

// ✅ Correto  
this.diData.situacao_nome
this.diData.urf_despacho_nome
this.diData.modalidade_despacho_nome
```

#### **B. Campos de Adição (DIProcessor)**
```javascript
// ❌ Incorreto
adicao.descricao_mercadoria
adicao.valor_moeda_negociacao
adicao.condicao_venda_incoterm

// ✅ Correto
adicao.descricao_ncm
adicao.condicao_venda_valor_moeda
adicao.incoterm
```

#### **C. Produtos Individuais (ComplianceCalculator)**
```javascript
// ❌ Incorreto - Acesso direto aos produtos da DI
adicao.produtos.forEach(produto => {
  produto.descricao_mercadoria
  produto.ii_item // Não existe
})

// ✅ Correto - Usar produtos pré-calculados
this.calculationData.produtos_individuais.forEach(produto => {
  produto.descricao
  produto.ii_item // Calculado pelo ComplianceCalculator
})
```

## Plano de Implementação

### **Fase 1: Correções de Campo Critical (Alta Prioridade)**
1. **Corrigir referências de campos básicos da DI**
   - `situacao` → `situacao_nome`
   - `urf_despacho` → `urf_despacho_nome` 
   - `modalidade_despacho` → `modalidade_despacho_nome`

2. **Corrigir referências de importador**
   - `endereco_cidade` → `cidade`
   - `endereco_cep` → `cep`

3. **Corrigir referências de adições**
   - `descricao_mercadoria` → `descricao_ncm`
   - `valor_moeda_negociacao` → `condicao_venda_valor_moeda`
   - `condicao_venda_incoterm` → `incoterm`

### **Fase 2: Reestruturação de Produtos (Prioridade Crítica)**
1. **Converter acesso direto a produtos**
   - Eliminar uso de `adicao.produtos` no Croqui NFe
   - Usar exclusivamente `this.calculationData.produtos_individuais`

2. **Validar estrutura de dados calculados**
   - Verificar existência de `produtos_individuais` 
   - Adicionar validações sem fallbacks (conforme CLAUDE.md)

### **Fase 3: Teste e Validação**
1. **Testar cada sheet individualmente**
   - Verificar eliminação de valores N/D
   - Confirmar exibição correta dos dados

2. **Comparar com relatórios funcionais**
   - Usar JSON reports como referência
   - Validar consistência com PDF exports

### **Fase 4: Documentação e Manutenção**
1. **Atualizar documentação de estrutura de dados**
2. **Criar checklist de validação para novos campos**
3. **Documentar padrões de nomeação corretos**

## Observações Importantes

### **Política Zero Fallbacks**
Conforme `CLAUDE.md`, o sistema deve:
- **NUNCA usar fallbacks** como `|| 'N/D'` ou `|| 0`
- **SEMPRE lançar erro explícito** se dados obrigatórios não existirem
- **Falhar com mensagem clara** quando componentes não estão disponíveis

### **Princípio KISS**
- Os dados **já foram calculados** pelo ComplianceCalculator
- O ExcelExporter deve **apenas consumir** dados processados
- **Não deve haver cálculos locais** ou reprocessamento

### **Estrutura de Dados como Fonte de Verdade**
- **DIProcessor.js**: Única fonte para dados extraídos da DI
- **ComplianceCalculator.js**: Única fonte para cálculos e produtos individuais
- **ExcelExporter.js**: Apenas consumidor, não processador

## Checklist de Validação

- [ ] Eliminar todos os valores N/D desnecessários
- [ ] Usar nomes de campos corretos do DIProcessor
- [ ] Acessar produtos via `produtos_individuais` calculados
- [ ] Implementar validações explícitas sem fallbacks
- [ ] Testar consistência com relatórios JSON e PDF
- [ ] Validar formatação ExcelJS aplicada corretamente
- [ ] Confirmar que dados calculados aparecem no Excel
- [ ] Verificar estrutura dinâmica de adições funcionando

---

**Status**: 🔄 Pronto para implementação
**Próximos Passos**: Aplicar correções de campo por prioridade
**Meta**: Excel export com 100% dos dados disponíveis nos outros relatórios