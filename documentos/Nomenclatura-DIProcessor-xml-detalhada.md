# Nomenclatura Oficial - DIProcessor XML

## Autoridade e Hierarquia

### DIProcessor.js como PRIMARY CREATOR
**REGRA FUNDAMENTAL**: DIProcessor.js é o único módulo autorizado a criar nomenclatura de campos. Todos os outros módulos DEVEM seguir exatamente seus nomes de campos.

### Hierarquia de Autoridade:
1. **DIProcessor.js**: PRIMARY CREATOR (linha específica onde é definido)
2. **IndexedDBManager.js**: Implementa schema seguindo DIProcessor  
3. **Demais módulos**: CONSUMERS (seguem nomenclatura estabelecida)

## Tabela de Nomenclatura Oficial

| Entidade           | Nome OFICIAL          | Nome PROIBIDO                 | Módulo Criador      | Status      |
| ------------------ | --------------------- | ----------------------------- | ------------------- | ----------- |
| **Produtos/Itens** | `produtos`            | ~~mercadorias~~, ~~items~~    | DIProcessor.js:366  | ✅ CORRIGIDO |
| **Despesas**       | `despesas_aduaneiras` | ~~despesas~~, ~~expenses~~    | DIProcessor.js:1088 | ✅ CORRIGIDO |
| **Adições**        | `adicoes`             | ~~additions~~                 | DIProcessor.js:290  | ✅ CORRETO   |
| **Impostos**       | `tributos`            | ~~impostos~~, ~~taxes~~       | DIProcessor.js:404  | ✅ CORRETO   |
| **Valor BRL**      | `valor_reais`         | ~~valor_brl~~, ~~value_brl~~  | DIProcessor.js:445  | ✅ CORRETO   |
| **Valor USD**      | `valor_dolares`       | ~~valor_usd~~, ~~value_usd~~  | DIProcessor.js:446  | ✅ CORRETO   |
| **NCM**            | `ncm`                 | ~~classificacao~~             | DIProcessor.js:398  | ✅ CORRETO   |
| **Peso Líquido**   | `peso_liquido`        | ~~peso_net~~, ~~net_weight~~  | DIProcessor.js:401  | ✅ CORRETO   |

### Campos Numéricos Obrigatórios

| Campo             | Tipo     | Validação                    | Exemplo    |
| ----------------- | -------- | ---------------------------- | ---------- |
| `valor_aduaneiro` | Number   | parseFloat() + isNaN check   | 15000.50   |
| `valor_frete`     | Number   | parseFloat() + isNaN check   | 500.00     |
| `valor_seguro`    | Number   | parseFloat() + isNaN check   | 150.00     |
| `peso_liquido`    | Number   | parseFloat() + isNaN check   | 1250.75    |

## Mapeamento XML → IndexedDB

### Estrutura de DI
```xml
<!-- XML Original -->
<DI>
    <valorAduaneiro>15000.50</valorAduaneiro>
    <valorFrete>500.00</valorFrete>
    <valorSeguro>150.00</valorSeguro>
</DI>
```

```javascript
// Nomenclatura DIProcessor (OFICIAL)
{
    valor_aduaneiro: 15000.50,  // Number, não String!
    valor_frete: 500.00,
    valor_seguro: 150.00
}
```

### Validação Fail-Fast
```javascript
// Implementação correta em validarDadosDI()
if (typeof dados.valor_aduaneiro !== 'number' || isNaN(dados.valor_aduaneiro)) {
    throw new Error('Campo total obrigatório inválido: valor_aduaneiro deve ser numérico');
}
```

## Exemplos de Uso Correto

### ✅ CORRETO - Seguindo DIProcessor
```javascript
// Em qualquer módulo CONSUMER
const produtos = await indexedDB.getAll('produtos');  // DIProcessor name
const valorTotal = di.valor_aduaneiro + di.valor_frete; // DIProcessor fields
```

### ❌ INCORRETO - Nomenclatura própria
```javascript
// NUNCA fazer isso
const items = await indexedDB.getAll('items');        // Nome inglês proibido
const totalValue = di.aduaneiro_valor + di.frete;     // Campo inexistente
```

## Conversão de Tipos

### Parsing Obrigatório (Correção 26/09/2025)
```javascript
// Em carregarDadosDI() antes de validarDadosDI()
function garantirTiposNumericos(dadosDI) {
    const camposNumericos = [
        'valor_aduaneiro', 'valor_frete', 'valor_seguro', 
        'peso_liquido', 'peso_bruto'
    ];
    
    for (let campo of camposNumericos) {
        if (dadosDI[campo] !== undefined) {
            dadosDI[campo] = parseFloat(dadosDI[campo]) || 0;
        }
    }
    
    return dadosDI;
}
```

## Schema IndexedDB Oficial

### Object Store: declaracoes
```javascript
{
    id: "DI123456789",              // String
    numero: "123456789",            // String  
    valor_aduaneiro: 15000.50,      // Number
    valor_frete: 500.00,            // Number
    valor_seguro: 150.00,           // Number
    produtos: [...],                // Array
    adicoes: [...],                 // Array
    tributos: [...],                // Array
    despesas_aduaneiras: [...]      // Array
}
```

## CAMPOS CALCULADOS (ComplianceCalculator - SECONDARY CREATOR)

### Hierarquia de Autoridade
1. **DIProcessor.js**: PRIMARY CREATOR (dados XML)
2. **ComplianceCalculator.js**: SECONDARY CREATOR (dados calculados)
3. **IndexedDBManager.js**: Implementa schema seguindo ambos
4. **Demais módulos**: CONSUMERS (seguem nomenclatura estabelecida)

### Campos Criados pelo ComplianceCalculator

| Campo | Tipo | Criador | Uso | Status |
|-------|------|---------|-----|--------|
| `totais_relatorio` | Object | ComplianceCalculator.js:367 | CroquiNF exports | ✅ DOCUMENTADO |
| `totais_por_coluna` | Object | ComplianceCalculator.js:368 | Excel exports | ✅ DOCUMENTADO |
| `produtos_individuais` | Array | ComplianceCalculator.js:363 | Ambos exports | ✅ DOCUMENTADO |

### Estrutura dos Campos Calculados

```javascript
// totais_relatorio - Para CroquiNF e relatórios PDF
{
    impostos_consolidados: { ii: 1000, ipi: 500, pis: 100, cofins: 400, icms: 2000 },
    totais_gerais: { total_impostos: 4000, custo_total: 24000 },
    breakdown_por_adicao: [ /* detalhes por adição */ ]
}

// totais_por_coluna - Para Excel multi-sheet
{
    colunas_impostos: { ii: [...], ipi: [...], pis: [...] },
    colunas_totais: { custos: [...], pesos: [...] },
    metadados: { total_adicoes: 16, total_produtos: 45 }
}

// produtos_individuais - Para detalhamento granular
[
    {
        adicao_numero: "001",
        produto_index: 1,
        impostos_calculados: { ii: 50, ipi: 25, ... },
        custo_total: 1200
    }
]
```

## Histórico de Correções

### 28/09/2025 - Correção Pipeline Excel/PDF
- **Problema**: Campos calculados não salvos no IndexedDB
- **Solução**: Incluir `totais_relatorio`, `totais_por_coluna`, `produtos_individuais` em `calculos_compliance`
- **Validação**: NO FALLBACKS - falha explícita se campos ausentes

### 27/09/2025 - Refatoração Arquitetural SOLID
- **Separação de Responsabilidades**: Cálculos movidos dos exportadores para calculators
- **Implementação Single Source of Truth**: IndexedDB como única fonte para exporters
- **Origem**: ComplianceCalculator (métodos calcularTotaisRelatorio e calcularTotaisPorColuna)
- **Consumidores**: CroquiNFExporter, ExcelExporter (read-only, sem cálculos)

### 26/09/2025 - Correção Bug Validação Numérica
- **Problema**: Campos numéricos armazenados como strings no IndexedDB
- **Solução**: Parsing obrigatório com parseFloat() antes da validação
- **Arquivos afetados**: pricing-interface.js (carregarDadosDI)

### 25/09/2025 - Padronização Completa
- Todos os módulos alinhados com nomenclatura DIProcessor
- Sistema de precificação 100% compatível
- Pipeline DI → Custos → Preços funcionando

### 24/09/2025 - Migração new URL()
- Eliminação do PathResolver em todos os módulos
- Sistema universal compatível com qualquer ambiente