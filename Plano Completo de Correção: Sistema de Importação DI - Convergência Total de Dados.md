# Plano Completo de Correção: Sistema de Importação DI - Convergência Total de Dados

Com base na análise detalhada realizada e nas diretrizes estabelecidas, apresento um plano abrangente para corrigir todas as inconsistências identificadas no sistema.

## 1. Padronização Total do Armazenamento de Dados

### **1.1 Migração Completa para IndexedDB**

- **Eliminar todas as variáveis em memória** dos módulos
- Implementar padrão **"IndexedDB First"** onde cada módulo:
  - Busca dados exclusivamente no IndexedDB
  - Salva resultados imediatamente no IndexedDB
  - Nunca mantém estado local

### **1.2 Schema IndexedDB Unificado**

Reestruturar o schema seguindo rigorosamente a nomenclatura do `DIProcessor.js`:

```javascript
// Schema principal seguindo nomenclatura oficial
declaracoes: {
  numero_di: string,
  data_processamento: timestamp,
  importador_cnpj: string,
  importador_nome: string,
  // ... todos os campos conforme DIProcessor
}

adicoes_calculadas: {
  di_numero: string,
  adicao_numero: string,
  impostos_calculados: object,
  incentivos_aplicados: array,
  fcp_aplicado: number,
  timestamp_calculo: timestamp
}

incentivos_selecionados: {
  di_numero: string,
  adicao_numero: string,
  ncm: string,
  incentivos_ids: array,
  personalizacoes: object
}
```

## 2. Correção do Sistema FCP

### **2.1 Implementação da Regra FCP-Piso**

- **Regra padrão**: Sempre utilizar o valor mínimo (piso) do FCP por UF
- **Personalização**: Interface para ajuste manual por item ou NCM
- **Armazenamento**: Persistir escolhas no IndexedDB

### **2.2 Estrutura FCP Configurável**

```javascript
fcp_configuracoes: {
  uf: string,
  aliquota_piso: number,
  aliquota_teto: number,
  personalizacoes_ncm: {
    ncm: string,
    aliquota_customizada: number
  }
}
```

## 3. Refatoração dos Módulos de Cálculo

### **3.1 ItemCalculator - Integração IndexedDB**

- **Buscar configurações** de alíquotas direto do IndexedDB
- **Aplicar incentivos** baseado nos dados armazenados
- **Salvar resultados** imediatamente após cálculo

### **3.2 IncentiveManager - Aplicação Efetiva**

- **Carregar incentivos selecionados** do IndexedDB por adição
- **Aplicar reduções** nos impostos calculados
- **Validar elegibilidade** por NCM e regime
- **Persistir memória** de aplicação de incentivos

### **3.3 DIProcessor - Fonte Única de Nomenclatura**

- **Manter como PRIMARY CREATOR** de nomenclatura
- **Integrar com IncentiveManager** no processo de cálculo
- **Salvar estado consolidado** no IndexedDB

## 4. Correção dos Exportadores

### **4.1 ExcelExporter - Fonte Única de Dados**

- **Buscar APENAS do IndexedDB** todos os dados necessários
- **Implementar validação** de integridade dos dados
- **Gerar log detalhado** de valores utilizados
- **Corrigir template** ExtratoDI_COMPLETO

### **4.2 Validação de Convergência**

```javascript
async validateExportData(diNumero) {
  const diData = await indexedDB.getDI(diNumero);
  const calculatedData = await indexedDB.getCalculatedData(diNumero);
  const memoryData = await indexedDB.getMemoryData(diNumero);

  // Validar convergência entre todas as fontes
  return convergenceValidator.validate(diData, calculatedData, memoryData);
}
```

## 5. Implementação da Arquitetura "NO FALLBACKS"

### **5.1 Validações Obrigatórias**

- **Dados ausentes**: Sempre lançar exceções específicas
- **Configurações faltantes**: Interromper processamento
- **Estados inconsistentes**: Alertar e corrigir

### **5.2 Pipeline Sequencial Obrigatório**

1. **DIProcessor**: Processa XML → salva no IndexedDB
2. **IncentiveManager**: Aplica incentivos → atualiza IndexedDB
3. **ItemCalculator**: Calcula impostos finais → salva no IndexedDB
4. **Exportadores**: Buscam dados finais → geram relatórios

## 6. Cronograma de Implementação

### **Fase 1: Fundação (2-3 dias)**

- Reestruturar schema IndexedDB
- Migrar ProductMemoryManager para IndexedDB puro
- Implementar regras FCP-piso
- Corrigir nomenclatura em todos os módulos

### **Fase 2: Integração de Cálculos (2-3 dias)**

- Refatorar ItemCalculator para IndexedDB
- Integrar IncentiveManager efetivamente
- Corrigir aplicação de incentivos
- Implementar validações "NO FALLBACKS"

### **Fase 3: Exportadores (1-2 dias)**

- Corrigir ExcelExporter
- Implementar validação de convergência
- Testar todos os formatos de export
- Corrigir inconsistências de template

### **Fase 4: Validação Total (1-2 dias)**

- Testes com DI real (2300120746)
- Validar convergência de todos os relatórios
- Documentar interface para módulo de custeio
- Implementar auditoria de dados

## 7. Estrutura de Dados Padronizada

### **7.1 Estado Consolidado Final**

```javascript
const estadoConsolidado = {
  di_numero: "2300120746",
  timestamp_processamento: "2025-09-27T12:00:00.000Z",
  adicoes: [{
    adicao_numero: "001",
    ncm: "73181500",
    impostos_originais: { /* sem incentivos */ },
    incentivos_aplicados: [{
      codigo_incentivo: "SC_PRODEC_001",
      tipo: "reducao_ii",
      percentual_reducao: 75,
      valor_economia: 3973.46
    }],
    impostos_finais: { /* com incentivos aplicados */ },
    fcp_aplicado: 0.00, // piso para GO
    custo_total_final: 51458.70
  }],
  status_convergencia: "VALIDADO",
  pronto_para_custeio: true
};
```

## 8. Interface para Módulo de Custeio

### **8.1 Dados Garantidos**

O módulo de custeio receberá dados **100% consistentes**:

- Valores de impostos finais (com incentivos aplicados)
- Custos consolidados por item
- Rastreabilidade completa de cálculos
- Validação de integridade confirmada

### **8.2 API Padronizada**

```javascript
// Interface para módulo de custeio
const custingInterface = {
  async getDIConsolidatedData(diNumero),
  async getItemCosts(diNumero, adicaoNumero),
  async validateDataIntegrity(diNumero),
  async getCalculationMemory(diNumero)
};
```

Este plano resolve completamente as inconsistências identificadas, estabelece uma única fonte de verdade no IndexedDB, implementa a regra FCP-piso conforme solicitado, e garante que o módulo de custeio receberá dados íntegros e confiáveis. A implementação seguirá rigorosamente a nomenclatura oficial e as regras de codificação estabelecidas no sistema.

Sources


