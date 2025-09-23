# Estrutura de Moedas e Cálculo de Câmbio em Declarações de Importação Brasileiras

## Resumo Executivo

Este documento técnico descreve a estrutura de moedas e o cálculo de taxa de câmbio em Declarações de Importação (DI) brasileiras, baseado na análise de casos reais do sistema SISCOMEX.

**Descoberta Principal**: A taxa de câmbio NÃO é expressa diretamente no XML da DI - ela deve ser CALCULADA dinamicamente a partir dos valores em moeda estrangeira e seus equivalentes em reais.

## 1. Estrutura de Moedas no XML

### 1.1 Campos Principais de Moeda

Cada DI contém múltiplos campos relacionados a moedas:

#### Nível da Declaração (Global)
```xml
<localEmbarqueTotalDolares>000000010573233</localEmbarqueTotalDolares>  <!-- USD 105.732,33 -->
<localEmbarqueTotalReais>000000055168375</localEmbarqueTotalReais>      <!-- BRL 551.683,75 -->
<localDescargaTotalDolares>000000010838326</localDescargaTotalDolares>  <!-- USD 108.383,26 -->
<localDescargaTotalReais>000000056551126</localDescargaTotalReais>      <!-- BRL 565.511,26 -->
```

#### Nível da Adição
```xml
<condicaoVendaMoedaCodigo>220</condicaoVendaMoedaCodigo>               <!-- Código ISO da moeda -->
<condicaoVendaMoedaNome>DOLAR DOS EUA</condicaoVendaMoedaNome>
<condicaoVendaValorMoeda>000000000634613</condicaoVendaValorMoeda>     <!-- Valor em moeda estrangeira -->
<condicaoVendaValorReais>000000003311220</condicaoVendaValorReais>     <!-- Valor em BRL -->
```

### 1.2 Códigos de Moeda

Os códigos seguem o padrão SISCOMEX:
- `220` = USD (Dólar dos EUA)
- `540` = EUR (Euro)
- `978` = EUR (novo código)
- `000` = Sem moeda definida (fretes/seguros nacionais)

## 2. Casos de Múltiplas Moedas

### 2.1 DI com Moeda Única (2300120746.xml)

**Características**:
- Todas as adições em USD (código 220)
- Frete e seguro também em USD
- Taxa de câmbio única para toda a DI

**Cálculo da Taxa**:
```javascript
// Valores globais da DI
const totalUSD = 105732.33;  // localEmbarqueTotalDolares / 100
const totalBRL = 551683.75;  // localEmbarqueTotalReais / 100
const taxaCambio = totalBRL / totalUSD; // 5.2163
```

### 2.2 DI com Múltiplas Moedas (2518173187.xml)

**Características**:
- Adições com diferentes moedas (USD, INR, etc.)
- Cada adição tem sua própria taxa de câmbio implícita
- Frete/seguro podem ter moedas diferentes ou código "000"

**Exemplo de Adição com Moeda Diferente**:
```xml
<!-- Adição em Rúpia Indiana -->
<condicaoVendaMoedaCodigo>860</condicaoVendaMoedaCodigo>
<condicaoVendaMoedaNome>RUPIA - INDIA</condicaoVendaMoedaNome>
<condicaoVendaValorMoeda>000000003678072</condicaoVendaValorMoeda>  <!-- INR 36.780,72 -->
<condicaoVendaValorReais>000000002524488</condicaoVendaValorReais>  <!-- BRL 25.244,88 -->
<!-- Taxa implícita: 25244.88 / 36780.72 = 0.6863 BRL/INR -->
```

## 3. Estratégia de Cálculo de Taxa de Câmbio

### 3.1 Taxa Global da DI

A taxa de câmbio global DEVE ser calculada usando os valores totais:

```javascript
function calcularTaxaCambioGlobal(di) {
    const vmleDolares = di.localEmbarqueTotalDolares / 100;
    const vmleReais = di.localEmbarqueTotalReais / 100;
    
    if (vmleDolares <= 0 || vmleReais <= 0) {
        throw new Error("Valores inválidos para cálculo de taxa de câmbio");
    }
    
    return vmleReais / vmleDolares;
}
```

### 3.2 Taxa por Adição

Cada adição pode ter sua própria taxa quando há múltiplas moedas:

```javascript
function calcularTaxaCambioAdicao(adicao) {
    const valorMoeda = adicao.condicaoVendaValorMoeda / 100;
    const valorReais = adicao.condicaoVendaValorReais / 100;
    
    if (valorMoeda <= 0 || valorReais <= 0) {
        throw new Error(`Taxa de câmbio não calculável para adição ${adicao.numero}`);
    }
    
    return valorReais / valorMoeda;
}
```

## 4. Validação e Casos Especiais

### 4.1 Moedas com Código "000"

Quando `freteMoedaNegociadaCodigo` = "000":
- Indica frete/seguro nacional (já em BRL)
- Não requer conversão de câmbio
- Usar valor direto de `freteValorReais`

### 4.2 Validação de Consistência

```javascript
function validarTaxaCambio(di) {
    // Para DIs com moeda única, todas as taxas devem ser próximas
    const taxaGlobal = calcularTaxaCambioGlobal(di);
    
    for (const adicao of di.adicoes) {
        const taxaAdicao = calcularTaxaCambioAdicao(adicao);
        const diferenca = Math.abs(taxaAdicao - taxaGlobal) / taxaGlobal;
        
        if (diferenca > 0.01) { // Tolerância de 1%
            console.warn(`Taxa de câmbio divergente na adição ${adicao.numero}`);
        }
    }
}
```

## 5. Implementação Recomendada

### 5.1 Estrutura de Dados

```javascript
class DIProcessor {
    processarDI(xml) {
        const di = {
            // Taxa global calculada
            taxa_cambio: null,
            
            // Estrutura detalhada de moedas
            moedas: {
                lista: [],           // Todas as moedas encontradas
                vmle_vmld: {        // Moeda principal (VMLE)
                    codigo: '220',
                    nome: 'DOLAR DOS EUA',
                    taxa: null       // Calculada dinamicamente
                }
            },
            
            // Adições com suas taxas individuais
            adicoes: []
        };
        
        // Calcular taxa global
        di.taxa_cambio = this.calcularTaxaCambioGlobal(xml);
        
        // Processar cada adição
        for (const adicao of xml.adicoes) {
            adicao.taxa_cambio = this.calcularTaxaCambioAdicao(adicao);
        }
        
        return di;
    }
}
```

### 5.2 Ordem de Prioridade para Taxa de Câmbio

1. **Taxa global da DI**: Calculada de `localEmbarqueTotalReais / localEmbarqueTotalDolares`
2. **Taxa da primeira adição**: Como fallback se não houver totais globais
3. **Taxa média ponderada**: Para casos com múltiplas moedas

## 6. Conclusões

1. **Taxa de câmbio SEMPRE calculada**: Não existe campo direto de taxa no XML
2. **Suporte a múltiplas moedas é essencial**: DIs reais podem ter diferentes moedas por adição
3. **Validação é crítica**: Sempre verificar divisão por zero e valores inconsistentes
4. **Código "000" é especial**: Indica valores já em BRL, sem necessidade de conversão

## 7. Referências

- SISCOMEX - Sistema Integrado de Comércio Exterior
- Instrução Normativa RFB nº 680/2006
- Manual de Preenchimento da Declaração de Importação (DI)
- Análise de casos reais: DIs 2300120746 e 2518173187

---

*Documento técnico criado em 2025-09-05 baseado em análise de DIs reais do SISCOMEX*