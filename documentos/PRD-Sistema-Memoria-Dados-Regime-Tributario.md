# PRD: Sistema de Memória de Dados com Regime Tributário

## Visão Geral

Criar um sistema de armazenamento estruturado (preparado para migração futura para banco de dados) que:
1. Armazene dados processados da DI de forma estruturada
2. Permita configuração do regime tributário pelo usuário
3. Calcule custos líquidos baseados no regime configurado
4. Mantenha histórico e auditoria completa

## Estrutura de Dados Proposta (Database-Ready)

### **1. ImportedProductsMemory.json** - Dados Base dos Produtos Importados
```javascript
{
  "products": [
    {
      "id": "uuid-123", // Chave única para referência
      "di_number": "2300120746",
      "addition_number": 1,
      "ncm": "8517621100",
      "description": "Telefone celular",
      "quantity": 200,
      "unit": "UN",
      "weight_kg": 40,
      
      // Custos Base (antes de créditos)
      "base_costs": {
        "cif_brl": 24096.10,
        "ii": 2856.50,
        "ipi": 1205.40,
        "pis_import": 1567.89,
        "cofins_import": 1205.45,
        "cofins_adicional": 240.96, // 1% quando aplicável
        "icms_import": 8950.20,
        "icms_st": 0,
        "expenses": {
          "siscomex": 185.00,
          "afrmm": 6024.03,
          "capatazia": 450.00,
          "armazenagem": 300.00,
          "outras": 150.00
        },
        "total_base_cost": 47281.53
      },
      
      // Flags especiais
      "special_cases": {
        "is_monofasico": false,
        "has_icms_st": false,
        "has_cofins_adicional": false,
        "industrial_use": false
      },
      
      // Metadados
      "metadata": {
        "exchange_rate": 5.39,
        "import_date": "2025-01-15",
        "state": "GO",
        "created_at": "2025-09-04T10:30:00Z"
      }
    }
  ]
}
```

### **2. TaxRegimeConfig.json** - Configuração do Regime Tributário do Usuário
```javascript
{
  "company_settings": {
    "regime_tributario": "lucro_real", // lucro_real | lucro_presumido | simples_nacional
    "tipo_empresa": "comercio", // comercio | industria | servicos | misto
    "estado_sede": "GO",
    "inscricao_estadual": true,
    "substituto_tributario": true,
    "contribuinte_ipi": false, // Só true se indústria
    
    // Configurações específicas por regime
    "regime_details": {
      // Para Lucro Real
      "lucro_real": {
        "credito_pis_cofins": true,
        "credito_icms": true,
        "credito_ipi": false, // Só true se indústria
        "pis_saida": 1.65,
        "cofins_saida": 7.60
      },
      
      // Para Lucro Presumido
      "lucro_presumido": {
        "credito_pis_cofins": false,
        "credito_icms": true,
        "credito_ipi": false,
        "pis_saida": 0.65,
        "cofins_saida": 3.00
      },
      
      // Para Simples Nacional
      "simples_nacional": {
        "credito_pis_cofins": false,
        "credito_icms": false,
        "credito_ipi": false,
        "anexo": "I",
        "faixa_faturamento": 3,
        "aliquota_das": 6.0
      }
    }
  },
  
  "updated_at": "2025-09-04T10:00:00Z",
  "updated_by": "user@expertzy.com"
}
```

### **3. CalculatedCosts.json** - Custos Calculados por Regime
```javascript
{
  "calculations": [
    {
      "product_id": "uuid-123",
      "di_number": "2300120746",
      "regime": "lucro_real",
      
      // Créditos aplicáveis neste regime
      "tax_credits": {
        "icms": 8950.20,
        "ipi": 0, // Comércio não credita
        "pis": 1567.89,
        "cofins": 965.49, // Sem o adicional 1%
        "total_credits": 11483.58
      },
      
      // Custo líquido após créditos
      "net_cost": {
        "base_cost": 47281.53,
        "credits": 11483.58,
        "final_cost": 35797.95,
        "unit_cost": 178.99
      },
      
      // Impostos na saída (venda)
      "sales_taxes": {
        "pis_rate": 1.65,
        "cofins_rate": 7.60,
        "icms_rate": 19.00,
        "cumulative": false
      },
      
      "calculated_at": "2025-09-04T11:00:00Z"
    },
    {
      "product_id": "uuid-123", 
      "regime": "lucro_presumido",
      "tax_credits": {
        "icms": 8950.20,
        "ipi": 0,
        "pis": 0, // Não credita no Presumido
        "cofins": 0,
        "total_credits": 8950.20
      },
      "net_cost": {
        "base_cost": 47281.53,
        "credits": 8950.20,
        "final_cost": 38331.33,
        "unit_cost": 191.66
      }
    },
    {
      "product_id": "uuid-123",
      "regime": "simples_nacional",
      "tax_credits": {
        "icms": 0, // Não credita no Simples
        "ipi": 0,
        "pis": 0,
        "cofins": 0,
        "total_credits": 0
      },
      "net_cost": {
        "base_cost": 47281.53,
        "credits": 0,
        "final_cost": 47281.53,
        "unit_cost": 236.41
      }
    }
  ]
}
```

### **4. PricingScenarios.json** - Cenários de Precificação
```javascript
{
  "scenarios": [
    {
      "id": "scenario-001",
      "product_id": "uuid-123",
      "regime": "lucro_real",
      "target_state": "GO",
      "customer_type": "B2B",
      
      "cost_foundation": {
        "net_cost": 35797.95, // Do CalculatedCosts
        "unit_cost": 178.99
      },
      
      "pricing": {
        "markup": 30,
        "suggested_price": 232.69,
        "gross_margin": 23.08,
        "net_margin": 12.45 // Após impostos na saída
      },
      
      "competitiveness": {
        "market_average": 245.00,
        "position": "competitive",
        "discount_potential": 5.02
      }
    }
  ]
}
```

## Implementação Proposta

### **Fase 1: Criar Módulos de Memória**

#### **1.1 ProductMemoryManager.js** (Novo)
- Gerenciar dados base dos produtos importados
- CRUD operations (Create, Read, Update, Delete)
- Validação de estrutura de dados
- Preparação para migração SQL

#### **1.2 RegimeConfigManager.js** (Novo)
- Interface para configuração do regime tributário
- Validação de regras por regime
- Cálculo automático de créditos aplicáveis

#### **1.3 CostCalculationEngine.js** (Novo)
- Motor de cálculo de custos por regime
- Aplicação de créditos conforme configuração
- Tratamento de casos especiais (monofásico, ST)

### **Fase 2: Integração com Sistema Atual**

#### **2.1 Modificar ComplianceCalculator.js**
- Salvar dados estruturados em ProductMemoryManager
- Calcular custos base sem aplicar créditos
- Marcar casos especiais (flags)

#### **2.2 Criar Interface de Configuração**
- Tela para usuário configurar regime tributário
- Salvar em RegimeConfigManager
- Validação de consistência

#### **2.3 Atualizar PricingEngine.js**
- Buscar custos líquidos do CostCalculationEngine
- Aplicar markup sobre custo correto por regime
- Calcular impostos na saída conforme regime

### **Fase 3: Interface de Visualização**

#### **3.1 Dashboard de Custos**
- Comparativo de custos por regime
- Visualização de créditos aplicados
- Análise de economia fiscal

#### **3.2 Relatórios Comparativos**
- Custo Real vs Presumido vs Simples
- Impacto dos créditos por regime
- Análise de viabilidade

## Benefícios da Arquitetura

1. **Preparado para Banco de Dados**: Estrutura normalizada, pronta para migração para PostgreSQL/MySQL
2. **Cálculos Precisos**: Custos líquidos corretos por regime tributário
3. **Flexibilidade**: Usuário configura seu regime e vê impacto imediato
4. **Auditoria**: Todos os cálculos rastreáveis e documentados
5. **Performance**: Dados calculados uma vez e reutilizados
6. **Escalabilidade**: Estrutura suporta múltiplas empresas/regimes

## Cronograma de Implementação

- **Sprint 1**: ProductMemoryManager + RegimeConfigManager
- **Sprint 2**: CostCalculationEngine + Integração
- **Sprint 3**: Interface de configuração + Dashboard
- **Sprint 4**: Relatórios + Testes

## Exemplo de Uso

```javascript
// 1. Usuário configura regime
regimeConfig.set({
  regime_tributario: 'lucro_real',
  tipo_empresa: 'comercio'
});

// 2. Sistema processa DI e salva produtos
productMemory.save(diProducts);

// 3. Engine calcula custos por regime
const costs = costEngine.calculateForAllRegimes(productId);

// 4. Pricing usa custo correto
const price = pricingEngine.calculate(productId, 'lucro_real');
```

## Dados de Exemplo Baseados no Documento de Custos

### Cálculo Base (Conforme documento)
Para uma importação com:
- Valor Aduaneiro (VA): R$ 100.000
- II (12%): R$ 12.000
- IPI (10%): R$ 11.200
- PIS-Import (2,1%): R$ 2.100
- COFINS-Import (9,65%): R$ 9.650
- Despesas: R$ 3.000
- ICMS (17%): R$ 28.357,23
- **Desembolso Total**: R$ 166.307,23

### Custos Líquidos por Regime:

#### **Lucro Real**
- Créditos: ICMS (R$ 28.357,23) + PIS (R$ 2.100) + COFINS (R$ 9.650)
- Total Créditos: R$ 40.107,23
- **Custo Líquido: R$ 126.200**

#### **Lucro Presumido**
- Créditos: ICMS (R$ 28.357,23)
- Total Créditos: R$ 28.357,23  
- **Custo Líquido: R$ 137.950**

#### **Simples Nacional**
- Créditos: R$ 0
- Total Créditos: R$ 0
- **Custo Líquido: R$ 166.307,23**

## Casos Especiais a Considerar

### **1. Produtos Monofásicos PIS/COFINS**
- Importador/fabricante paga alíquotas concentradas
- Revendas posteriores com alíquota zero
- No Lucro Real, créditos de importação podem ser mantidos

### **2. ICMS-ST (Substituição Tributária)**
- Se importador é substituto, recolhe ST na DI
- Valor integra custo do estoque
- Nas saídas não há débito próprio de ICMS

### **3. Adicional 1% COFINS-Importação**
- Quando aplicável, não gera crédito
- Integra custo de aquisição em todos os regimes

### **4. IPI para Comércio vs Indústria**
- Comércio puro não credita IPI
- Industrial/equiparado pode creditar IPI de insumos

## Validações Críticas

1. **Regime Lucro Real**: Verificar se empresa está habilitada para créditos não-cumulativos
2. **Regime Presumido**: Confirmar que PIS/COFINS não geram créditos
3. **Simples Nacional**: Validar anexo e faixa de faturamento para DAS correto
4. **Casos Especiais**: Identificar NCMs com tratamento diferenciado

## Métricas de Sucesso

- Redução de 40% no tempo de cálculo de custos
- 100% de precisão nos cálculos por regime
- Comparativo instantâneo entre regimes
- Zero retrabalho em mudança de regime
- Preparação completa para migração DB