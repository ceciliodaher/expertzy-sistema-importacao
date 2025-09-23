# 📋 DOCUMENTO DE PROCEDIMENTOS - CORREÇÃO DE VALORES DI 2518173187

## 🎯 OBJETIVO
Corrigir o processamento de valores da Declaração de Importação, garantindo que todos os valores sejam calculados corretamente conforme documentos oficiais.

## 📊 ANÁLISE DETALHADA DOS PROBLEMAS

### **PROBLEMA 1: Interpretação de Valores do XML**

#### Valores no XML (formato centavos):
```xml
<peso_liquido>000000000020000</peso_liquido>           <!-- 20.000 = 0,200 kg -->
<valor_moeda_negociacao>000000000089364</valor_moeda_negociacao> <!-- 89.364 = 893,64 USD -->
<valor_reais>000000003311220</valor_reais>             <!-- 3.311.220 = 33.112,20 -->
<pis_valor_devido>000000000010120</pis_valor_devido>   <!-- 10.120 = 101,20 -->
<cofins_valor_devido>000000000046505</cofins_valor_devido> <!-- 46.505 = 465,05 -->
```

#### Interpretação Correta:
- **Peso**: 20.000 → 0,200 kg (divisão por 100.000)
- **Valores monetários**: 89.364 → 893,64 (divisão por 100)
- **Tributos**: 10.120 → 101,20 (divisão por 100)

### **PROBLEMA 2: Múltiplas Conversões Desnecessárias**

#### Fluxo Atual (INCORRETO):
```
XML (centavos) → XMLParser (divide por 100) → CroquiNF (converte para reais) → Resultado incorreto
```

#### Fluxo Correto:
```
XML (centavos) → XMLParser (divide corretamente) → CroquiNF (usa valores já convertidos) → Resultado correto
```

## 🔧 PROCEDIMENTOS DE CORREÇÃO

### **ETAPA 1: Corrigir XMLParser.js**

#### 1.1 Função de Conversão de Valores
```javascript
// ANTES (incorreto):
valor_moeda_negociacao: parseInt(node.textContent) / 100

// DEPOIS (correto):
convertValue(rawValue, type) {
    const value = parseInt(rawValue);
    switch(type) {
        case 'monetary': return value / 100;        // centavos para reais
        case 'weight': return value / 100000;       // 5 decimais para kg
        case 'percentage': return value / 100;      // centésimos para %
        default: return value;
    }
}
```

#### 1.2 Aplicação Correta por Campo
```javascript
// Valores monetários
valor_moeda_negociacao: this.convertValue(nodeValue, 'monetary'),
valor_reais: this.convertValue(nodeValue, 'monetary'),
pis_valor_devido: this.convertValue(nodeValue, 'monetary'),
cofins_valor_devido: this.convertValue(nodeValue, 'monetary'),

// Pesos
peso_liquido: this.convertValue(nodeValue, 'weight'),

// Alíquotas  
pis_aliquota_ad_valorem: this.convertValue(nodeValue, 'percentage'),
ipi_aliquota_ad_valorem: this.convertValue(nodeValue, 'percentage'),
```

### **ETAPA 2: Corrigir CroquiNFExporter.js**

#### 2.1 Remover Conversões Duplas
```javascript
// ANTES (incorreto - converte duas vezes):
valor_pis: (adicao.tributos?.pis_valor_devido || 0) / 100,

// DEPOIS (correto - usa valor já convertido):
valor_pis: adicao.tributos?.pis_valor_devido || 0,
```

#### 2.2 Corrigir Cálculos de Base
```javascript
calculateBaseICMS(adicao, valorMercadoria) {
    let base = valorMercadoria;
    
    // Adicionar tributos já convertidos (não dividir novamente)
    base += adicao.tributos?.ii_valor_devido || 0;
    base += adicao.tributos?.ipi_valor_devido || 0;
    base += adicao.tributos?.pis_valor_devido || 0;
    base += adicao.tributos?.cofins_valor_devido || 0;
    
    return base;
}
```

### **ETAPA 3: Validação de Dados**

#### 3.1 Valores Esperados para DI 2518173187
```javascript
const VALORES_ESPERADOS = {
    peso_liquido: 0.200,           // kg
    valor_moeda_negociacao: 893.64, // USD
    valor_reais: 4819.22,         // BRL (após conversão completa)
    pis_valor_devido: 101.20,     // BRL
    cofins_valor_devido: 465.05,  // BRL
    base_icms: 6839.14,           // BRL (4819.22 + 101.20 + 465.05 + outras despesas)
    valor_icms: 1299.44,          // BRL (se não exonerado)
    valor_total_nota: 6839.14     // BRL
};
```

#### 3.2 Função de Validação
```javascript
validateProcessedValues(processedData) {
    const errors = [];
    
    if (Math.abs(processedData.peso_liquido - 0.200) > 0.001) {
        errors.push(`Peso incorreto: ${processedData.peso_liquido}, esperado: 0.200`);
    }
    
    if (Math.abs(processedData.valor_reais - 4819.22) > 0.01) {
        errors.push(`Valor em reais incorreto: ${processedData.valor_reais}, esperado: 4819.22`);
    }
    
    // ... outras validações
    
    return errors;
}
```

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### **Fase 1: Análise**
- [x] Mapear todos os campos que usam formato centavos
- [x] Identificar campos que usam formato com 5 decimais (peso)
- [x] Documentar conversões necessárias por tipo de campo

### **Fase 2: Correção XMLParser**
- [ ] Implementar função `convertValue()`
- [ ] Aplicar conversão correta por tipo de campo
- [ ] Adicionar logs de debug para cada conversão
- [ ] Testar com XML 2518173187

### **Fase 3: Correção CroquiNFExporter**
- [ ] Remover divisões desnecessárias por 100
- [ ] Corrigir cálculo de base ICMS
- [ ] Corrigir conversão de moedas (se necessário)
- [ ] Atualizar formatação de display

### **Fase 4: Validação**
- [ ] Implementar função de validação
- [ ] Comparar valores com documentos oficiais
- [ ] Testar com múltiplas DIs
- [ ] Verificar conformidade com NF oficial

### **Fase 5: Testes**
- [ ] DI 2518173187: Valores devem conferir com NF 0128720
- [ ] DI 2300120746: Testar cenário com IPI
- [ ] Verificar múltiplas moedas e adições
- [ ] Validar exportação Excel/PDF

## 🎯 RESULTADOS ESPERADOS

### **Antes da Correção:**
- Valor Total: R$ 4,82 ❌
- PIS: R$ 1,01 ❌  
- COFINS: R$ 4,65 ❌
- Base ICMS: R$ 10,48 ❌
- Peso: 0,00 kg ❌

### **Após a Correção:**
- Valor Total: R$ 4.819,22 ✅
- PIS: R$ 101,20 ✅
- COFINS: R$ 465,05 ✅  
- Base ICMS: R$ 6.839,14 ✅
- Peso: 0,200 kg ✅

## 🚨 PONTOS CRÍTICOS

1. **NÃO** aplicar múltiplas divisões por 100
2. **SEMPRE** validar contra documentos oficiais
3. **MANTER** unidades consistentes (kg para peso, BRL para valores)
4. **PRESERVAR** precisão decimal nos cálculos
5. **DOCUMENTAR** cada conversão aplicada

## 📋 ARQUIVOS A MODIFICAR

1. **`js/xmlParser.js`**
   - Adicionar função `convertValue()`
   - Corrigir processamento de todos os campos monetários
   - Corrigir processamento de peso

2. **`js/exportCroquiNF.js`**
   - Remover conversões duplas
   - Corrigir cálculos de base de impostos
   - Adicionar validações

3. **Testes**
   - Criar função de validação
   - Comparar com valores oficiais
   - Documentar casos de teste

## 📊 TABELA COMPARATIVA DE VALORES - DI 2518173187

| **Campo** | **XML Original** | **JSON Processado** | **Croqui Sistema** | **NF Oficial** | **DI Oficial** | **Status** |
|-----------|------------------|---------------------|-------------------|----------------|---------------|------------|
| **VALORES BASE** |
| VMLE (USD) | 847,54 | 0.89364 | R$ 4,82 | R$ 6.839,14 | 847,53 | ❌ **ERRO CRÍTICO** |
| VMLD (USD) | 893,64 | 893.64 | - | - | 893,64 | ✅ Correto |
| Taxa Câmbio | 5.392800 | - | 5.39280000 | - | 5,392800 | ✅ Correto |
| Valor Aduaneiro (R$) | 4.819,22 | 4819.22 | R$ 4,82 | R$ 6.839,14 | 4.819,22 | ❌ **DIVISÃO POR 1000** |
| **QUANTIDADES** |
| Peso Líquido | 0,20000 kg | 0.02 | 0.00 kg | 0,200 kg | 0,20000 kg | ❌ **DIVIDIDO POR 10** |
| Quantidade | 0,20000 | 0.2 | 0.2 | 200,00 MG | 0,20000 kg | ⚠️ Unidades diferentes |
| **VALORES UNITÁRIOS** |
| V. Unit (USD) | 4.468,20 | 4468.2 | R$ 24.096,11 | R$ 34,1957 | 4.468,20 | ❌ **ERRO MULTIPLICAÇÃO** |
| V. Total (USD) | 893,64 | 893.64 | R$ 4,82 | R$ 6.839,14 | 893,64 | ❌ **DIVISÃO POR 1000** |
| **BASE CÁLCULO IMPOSTOS** |
| Base PIS/COFINS | 4.819,22 | - | R$ 10,48 | - | 4.819,22 | ❌ **DOBROU O VALOR** |
| Base ICMS | 6.839,14 | - | R$ 10,48 | R$ 6.839,14 | 6.839,14 | ❌ **ERRO GRAVE** |
| **TRIBUTOS** |
| PIS (R$) | 101,20 | 101.2 | R$ 1,01 | - | 101,20 | ❌ **DIVIDIDO POR 100** |
| COFINS (R$) | 465,05 | 465.05 | R$ 4,65 | - | 465,05 | ❌ **DIVIDIDO POR 100** |
| ICMS Valor | 1.299,44 | - | R$ 1,99 | R$ 1.299,44 | 0,00 (exonerado) | ❌ **CÁLCULO INCORRETO** |
| ICMS Alíquota | 19,00% | - | 19.00% | 19,00% | 19,00% | ✅ Correto |
| IPI Valor | 0,00 | 0 | R$ 0,00 | 0,00 | 0,00 | ✅ Correto |
| IPI Alíquota | 0,00% | 0 | 0.00% | 0,00% | 0,00% | ✅ Correto |

Este procedimento deve ser seguido rigorosamente para garantir que todos os valores sejam processados corretamente e confiram com os documentos oficiais da Receita Federal e Nota Fiscal emitida.