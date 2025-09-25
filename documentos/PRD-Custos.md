# **PRD - Módulo de Cálculo de Custos por Regime Tributário**

### **Objetivos e Escopo**

O módulo deve calcular diferentes tipos de custos para mercadorias importadas, considerando o regime tributário da empresa e benefícios fiscais aplicáveis, integrando-se ao sistema existente que processa Declarações de Importação.

### **Requisitos Funcionais**

#### **1. Identificação do Regime Tributário**

- Interface para seleção/identificação do regime tributário da empresa:
  - Lucro Real
  - Lucro Presumido
  - Simples Nacional
- Armazenamento da configuração no IndexedDB seguindo nomenclatura oficial

#### **2. Tipos de Custos Calculados**

Seguindo a estrutura do Manual de Custos:

**2.1 Custo Base**

- Valor FOB + Frete + Seguro + Tributos obrigatórios
- Cálculo automático baseado nos dados da DI

**2.2 Custo de Desembolso**

- Custo Base + Despesas aduaneiras - Créditos tributários (por regime)
- Aplicação automática de créditos conforme regime tributário

**2.3 Custo Contábil**

- Custo de Desembolso + Encargos financeiros - Tributos recuperáveis

**2.4 Base para Formação de Preço**

- Custo Contábil + Custos indiretos + Margem operacional

#### **3. Tratamento de Créditos Tributários por Regime**

**3.1 Lucro Real (Regime Não-Cumulativo)**

- **PIS/COFINS normais**: Crédito integral (2,10% PIS + 9,65% COFINS)
- **PIS/COFINS monofásicos**: Crédito integral nas mesmas alíquotas
- **Adicional COFINS**: SEM direito a crédito
- **IPI**: Crédito integral para empresas equiparadas à indústria

**3.2 Lucro Presumido/Simples Nacional**

- **PIS/COFINS**: SEM crédito (regime cumulativo)
- **IPI**: Crédito apenas para Lucro Presumido (equiparação à indústria)

#### **4. Incentivos Fiscais Estaduais**

- Interface para configuração de benefícios por UF
- Aplicação automática conforme tipo de benefício:
  - Diferimento de ICMS
  - Redução de base de cálculo
  - Crédito presumido
  - Isenção parcial/total

### **Especificações Técnicas**

#### **Nomenclatura Oficial (seguindo DIProcessor.js)**

```javascript
// Estrutura de dados obrigatória
regimeTributario: {
    tipo: "lucro_real" | "lucro_presumido" | "simples_nacional",
    creditosPIS: boolean,
    creditosCOFINS: boolean, 
    creditosIPI: boolean,
    adicionalCOFINS: boolean
}

custosCalculados: {
    custo_base: Number,
    custo_desembolso: Number, 
    custo_contabil: Number,
    base_formacao_preco: Number
}

incentivos_fiscais: [{
    uf: String,
    tipo_beneficio: String,
    percentual_reducao: Number,
    vigencia: Date
}]
```

## **Workflow de Implementação**

### **Fase 1: Configuração Base (Semana 1)**

1. **Criar RegimeTributarioManager.js**
   - Seguir autoridade do DIProcessor.js
   - Implementar identificação e armazenamento de regimes
   - Configurar schema no IndexedDBManager
2. **Estruturar CustoCalculator.js**
   - Módulo principal para cálculos
   - Implementar os 4 tipos de custos
   - Integração com dados existentes da DI

### **Fase 2: Lógica de Créditos (Semana 2)**

1. **Implementar CreditoTributarioProcessor.js**
   - Regras específicas por regime tributário
   - Tratamento do adicional de COFINS sem crédito
   - Validação de créditos IPI para equiparados à indústria
2. **Criar TributosMonofasicosHandler.js**
   - Identificação automática de produtos monofásicos
   - Cálculo de créditos específicos
   - Tratamento de alíquotas majoradas na saída

### **Fase 3: Incentivos Fiscais (Semana 3)**

1. **Desenvolver IncentivosFiscaisManager.js**
   - Base de dados de incentivos por estado
   - Aplicação automática de benefícios
   - Cálculo de impacto no custo final
2. **Interface de Configuração**
   - Telas para cadastro/edição de incentivos
   - Validação de vigência e aplicabilidade

### **Fase 4: Integração e Testes (Semana 4)**

1. **Integração com sistema existente**
   - Conexão com DIProcessor.js
   - Atualização do fluxo principal
   - Testes de compatibilidade
2. **Validações e Relatórios**
   - Relatório comparativo de custos
   - Validação de cálculos
   - Documentação técnica

## **Estrutura de Interface**

### **Tela Principal - Configuração de Regime**

```
┌─────────────────────────────────────┐
│ REGIME TRIBUTÁRIO DA EMPRESA        │
├─────────────────────────────────────┤
│ ⚪ Lucro Real (Créditos Integrais)   │
│ ⚪ Lucro Presumido (Créditos IPI)    │
│ ⚪ Simples Nacional (Sem Créditos)   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ INCENTIVOS FISCAIS ATIVOS           │
├─────────────────────────────────────┤
│ Estado: [Dropdown]                  │
│ Programa: [Dropdown]                │
│ Vigência: [Data início] - [Data fim]│
│ [+ Adicionar Incentivo]             │
└─────────────────────────────────────┘
```

### **Dashboard de Custos**

```
┌─────────────────────────────────────┐
│ ANÁLISE DE CUSTOS POR PRODUTO       │
├─────────────────────────────────────┤
│ Custo Base:           R$ XXX.XXX,XX │
│ Créditos Tributários: R$  XX.XXX,XX │
│ Custo Desembolso:     R$ XXX.XXX,XX │
│ Incentivos Aplicados: R$  XX.XXX,XX │
│ Custo Final:          R$ XXX.XXX,XX │
└─────────────────────────────────────┘
```

## **Considerações de Desenvolvimento**

### **Tratamento Especial de Tributos**

1. **Adicional de COFINS**: Implementar flag específico para não gerar crédito
2. **PIS/COFINS Monofásico**: Manter registro para cálculo de alíquotas majoradas na saída
3. **IPI para Importadores**: Validar automaticamente equiparação à indústria

### **Performance e Armazenamento**

- Cache de configurações no IndexedDB
- Cálculos em tempo real sem impacto na UX
- Backup de configurações de regime tributário

Este PRD garante uma implementação robusta e integrada ao sistema existente, respeitando as complexidades tributárias brasileiras e a arquitetura modular já estabelecida no projeto.

# WorkFlow

![file:///Users/ceciliodaher/Documents/git/expertzy-sistema-importacao/documentos/generated-image.png](file:///Users/ceciliodaher/Documents/git/expertzy-sistema-importacao/documentos/generated-image.png)
