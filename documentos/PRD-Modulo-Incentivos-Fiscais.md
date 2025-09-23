# PRD - Módulo de Incentivos Fiscais e Reforma Tributária
## Sistema Expertzy de Importação e Precificação
### Versão 1.0 - Janeiro 2025

---

## 1. VISÃO GERAL

### 1.1 Objetivo
Desenvolver módulo integrado de incentivos fiscais que:
- Adapte croquis de NF para CST 51 (diferimento) conforme incentivos estaduais
- Calcule custos reais das mercadorias considerando benefícios fiscais
- Prepare o sistema para a Reforma Tributária (2026-2033)
- Mantenha princípios KISS (Keep It Simple, Stupid) e DRY (Don't Repeat Yourself)
- Implemente política NO FALLBACKS com validações explícitas

### 1.2 Escopo

#### Estados Prioritários
- **Santa Catarina**: TTD 409/410/411
- **Minas Gerais**: Corredor de Importação
- **Espírito Santo**: INVEST-ES e FUNDAP
- **Goiás**: COMEXPRODUZIR

#### Regimes Tributários Suportados
- Lucro Real
- Lucro Presumido
- Simples Nacional (com restrições específicas)

#### Timeline de Implementação
- **Sistema Atual**: 2025-2028 (benefícios mantidos integralmente)
- **Período de Transição**: 2029-2032 (redução gradual dos benefícios)
- **Sistema CBS/IBS**: 2033+ (novo modelo tributário)

### 1.3 Stakeholders
- **Usuários Primários**: Importadores, contadores, analistas fiscais
- **Usuários Secundários**: Gestores, consultores tributários
- **Mantenedores**: Equipe de desenvolvimento Expertzy

---

## 2. ARQUITETURA TÉCNICA (KISS)

### 2.1 Módulo Central Único

```javascript
IncentiveManager.js (≈500 linhas)
├── detectProgram(estado)                    // Detecção automática de incentivo
├── calculateNFFields(di, program)           // Cálculo campos NF com diferimento
├── calculateCostImpact(products, program)   // Impacto nos custos dos produtos
├── projectReformScenarios(2025-2033)        // Projeções reforma tributária
├── validateEligibility(cnpj, estado, ncm)   // Validação de elegibilidade
└── calculateCounterparts(benefit)           // Cálculo de contrapartidas
```

### 2.2 Integrações Mínimas (DRY)

```javascript
// CroquiNFExporter.js - Adicionar apenas 5 linhas
if (this.di.importador_estado) {
    const incentiveManager = new IncentiveManager();
    this.nfData = incentiveManager.adaptNFFields(this.nfData);
}

// ComplianceCalculator.js - Adicionar 10 linhas para benefícios
const incentive = incentiveManager.getActiveIncentive(di);
if (incentive) {
    calculations = this.applyIncentive(calculations, incentive);
}

// PricingEngine.js - Adicionar 15 linhas para cenários
const reformScenarios = incentiveManager.projectReformScenarios();
pricing.futureProjections = reformScenarios;
```

---

## 3. FUNCIONALIDADES CORE

### 3.1 Adaptação de Croquis de NF com Diferimento

#### Requisitos Funcionais
- Aplicar automaticamente CST 51 para estados com diferimento (SC, MG, ES)
- Calcular campos obrigatórios: vICMSOp, vICMSDif, pDif, vICMS
- Implementar lógica específica por programa:
  - **Santa Catarina TTD 409**: Base 4% por dentro, antecipação 2,6% (36 meses) ou 1% (após)
  - **Santa Catarina TTD 410**: Diferimento total sem antecipação após 24 meses
  - **Santa Catarina TTD 411**: Diferimento total com garantia
  - **Minas Gerais**: Diferimento total (100%)
  - **Espírito Santo**: Diferimento total com estorno na saída
- Incluir observações legais obrigatórias na NF

#### Exemplo de Cálculo - TTD 409 SC
```javascript
// Base para escrituração (17%)
const base17 = subtotal / 0.83;  // R$ 1.707.892,80

// Base para cálculo do imposto devido (4%)
const base4 = subtotal / 0.96;   // R$ 1.476.708,35

// Campos da NF
vBC: base17,                      // R$ 1.707.892,80
pICMS: 17.00,                     // 17%
vICMSOp: base17 * 0.17,          // R$ 290.341,78
vICMS: base4 * 0.01,             // R$ 14.767,08 (1% após 36 meses)
vICMSDif: vICMSOp - vICMS,       // R$ 275.574,70
pDif: 94.91,                     // 94,91%
cBenef: 'SC830015'               // Código do benefício
```

#### Exemplo de Cálculo - TTD 410 SC
```javascript
// TTD 410 - Após 24 meses, sem antecipação
vBC: base17,                      // R$ 1.707.892,80
pICMS: 17.00,                     // 17%
vICMSOp: base17 * 0.17,          // R$ 290.341,78
vICMS: 0,                        // Sem antecipação
vICMSDif: vICMSOp,               // R$ 290.341,78
pDif: 100.00,                    // 100%
cBenef: 'SC830015'               // Código do benefício
```

### 3.2 Cálculo de Custos com Incentivos Fiscais

#### Componentes do Cálculo
1. **Aplicação de Crédito Presumido**
   - Redução percentual do ICMS devido
   - Varia conforme programa e tipo de operação

2. **Cálculo de Contrapartidas**
   - FUNPRODUZIR (GO): 5% sobre benefício
   - PROTEGE (GO): 15% sobre benefício
   - Taxa administrativa (ES): 0,5% sobre ICMS diferido

3. **Comparação entre Estados**
   - Análise de carga tributária efetiva
   - ROI dos benefícios vs contrapartidas
   - Simulação de diferentes cenários

#### Fórmula Geral de Custo
```
Custo Final = Custo Base + Impostos - Benefícios + Contrapartidas
```

### 3.3 Preparação para Reforma Tributária

#### Timeline Configurável (2025-2033)
- **2025-2028**: Manutenção integral dos benefícios
- **2029**: Redução de 10% nos benefícios
- **2030**: Redução de 20% nos benefícios
- **2031**: Redução de 30% nos benefícios
- **2032**: Redução de 40% nos benefícios
- **2033+**: Extinção total - Sistema CBS+IBS (26,5-28%)

#### Funcionalidades de Projeção
- Cálculo automático da alíquota futura CBS+IBS
- Estimativa do Fundo de Compensação
- Alertas de mudanças por ano
- Comparativo situação atual vs futura

---

## 4. ESTRUTURA DE DADOS E CONFIGURAÇÃO

### 4.1 Estrutura Expandida do beneficios.json

```json
{
  "programas": {
    "SC_TTD_409": {
      "nome": "TTD 409 Santa Catarina",
      "tipo": "diferimento_parcial",
      "nf_config": {
        "cst": "51",
        "base_calculo": "4_porcento_por_dentro",
        "cBenef": "SC830015"
      },
      "fases": [
        {
          "ate_mes": 36,
          "aliquota_antecipacao": 0.026,
          "descricao": "Primeiros 36 meses - 2,6%"
        },
        {
          "apos_mes": 36,
          "aliquota_antecipacao": 0.01,
          "descricao": "Após 36 meses - 1%"
        }
      ],
      "contrapartidas": [],
      "requisitos": {
        "desembaraco_local": true,
        "estados_elegiveis": ["SC"],
        "sem_garantia": true
      },
      "reforma_tributaria": {
        "2025-2028": {"mantido": 1.0},
        "2029": {"mantido": 0.9},
        "2030": {"mantido": 0.8},
        "2031": {"mantido": 0.7},
        "2032": {"mantido": 0.6},
        "2033": {"mantido": 0.0}
      }
    },
    "SC_TTD_410": {
      "nome": "TTD 410 Santa Catarina",
      "tipo": "diferimento_total",
      "nf_config": {
        "cst": "51",
        "base_calculo": "4_porcento_por_dentro",
        "cBenef": "SC830015"
      },
      "requisitos": {
        "desembaraco_local": true,
        "estados_elegiveis": ["SC"],
        "tempo_minimo_meses": 24,
        "faturamento_minimo_anual": 24000000,
        "sem_garantia": true
      },
      "beneficios": {
        "diferimento_total": true,
        "dispensa_antecipacao": true
      },
      "reforma_tributaria": {
        "2025-2028": {"mantido": 1.0},
        "2029": {"mantido": 0.9},
        "2030": {"mantido": 0.8},
        "2031": {"mantido": 0.7},
        "2032": {"mantido": 0.6},
        "2033": {"mantido": 0.0}
      }
    },
    "SC_TTD_411": {
      "nome": "TTD 411 Santa Catarina",
      "tipo": "diferimento_total_com_garantia",
      "nf_config": {
        "cst": "51",
        "base_calculo": "4_porcento_por_dentro",
        "cBenef": "SC830015"
      },
      "requisitos": {
        "desembaraco_local": true,
        "estados_elegiveis": ["SC"],
        "garantia": {
          "tipo": ["real", "fidejussoria"],
          "obrigatoria": true
        }
      },
      "beneficios": {
        "diferimento_total": true,
        "sem_antecipacao": true,
        "maior_flexibilidade": true
      },
      "reforma_tributaria": {
        "2025-2028": {"mantido": 1.0},
        "2029": {"mantido": 0.9},
        "2030": {"mantido": 0.8},
        "2031": {"mantido": 0.7},
        "2032": {"mantido": 0.6},
        "2033": {"mantido": 0.0}
      }
    },
    "MG_CORREDOR": {
      "nome": "Corredor de Importação MG",
      "tipo": "diferimento_total",
      "nf_config": {
        "cst": "51",
        "diferimento": "total"
      },
      "credito_saida": {
        "com_similar": 0.03,
        "sem_similar": 0.025
      },
      "contrapartidas": [],
      "requisitos": {
        "desembaraco_local": true,
        "estados_elegiveis": ["MG"]
      }
    },
    "ES_INVEST": {
      "nome": "INVEST-ES Importação",
      "tipo": "diferimento_total",
      "nf_config": {
        "cst": "51",
        "diferimento": "total"
      },
      "estorno_saida": 0.75,
      "contrapartidas": [
        {
          "tipo": "taxa_administrativa",
          "percentual": 0.005,
          "base": "icms_diferido"
        }
      ],
      "requisitos": {
        "desembaraco_local": true,
        "centro_distribuicao": true,
        "area_minima_m2": 1000,
        "estados_elegiveis": ["ES"]
      }
    },
    "GO_COMEXPRODUZIR": {
      "nome": "COMEXPRODUZIR Goiás",
      "tipo": "credito_outorgado",
      "credito": 0.65,
      "aliquota_interna": 0.04,
      "contrapartidas": [
        {
          "fundo": "FUNPRODUZIR",
          "percentual": 0.05,
          "base": "beneficio"
        },
        {
          "fundo": "PROTEGE",
          "percentual": 0.15,
          "base": "beneficio"
        }
      ],
      "requisitos": {
        "desembaraco": "Porto Seco Anápolis",
        "estados_elegiveis": ["GO"],
        "percentual_comercio_exterior": 0.95
      }
    }
  }
}
```

### 4.2 Tabelas IndexedDB Utilizadas

```javascript
// Tabela: incentivos_entrada
{
  id: auto_increment,
  di_id: foreign_key,
  programa: 'SC_TTD_409',
  data_inicio: '2025-01-01',
  fase_atual: 1,
  economia_calculada: 39000.00
}

// Tabela: reform_projections
{
  id: auto_increment,
  di_id: foreign_key,
  ano: 2029,
  aliquota_atual: 0.17,
  aliquota_futura: 0.265,
  impacto_percentual: 0.56
}

// Tabela: cost_comparisons
{
  id: auto_increment,
  produto_id: foreign_key,
  custo_sem_incentivo: 1000.00,
  custo_com_incentivo: 860.00,
  economia: 140.00,
  percentual_economia: 0.14
}
```

---

## 5. INTERFACE DO USUÁRIO (Simplicidade)

### 5.1 Componente de Seleção de Incentivo

```html
<div class="incentive-selector">
  <label for="incentive-select">Programa de Incentivo Fiscal:</label>
  <select id="incentive-select" class="form-control">
    <option value="auto">Detectar automaticamente pelo estado</option>
    <optgroup label="Santa Catarina">
      <option value="SC_TTD_409">TTD 409 - Antecipação 2,6%/1%</option>
      <option value="SC_TTD_410">TTD 410 - Sem antecipação (24+ meses)</option>
      <option value="SC_TTD_411">TTD 411 - Com garantia</option>
    </optgroup>
    <option value="MG_CORREDOR">Minas Gerais - Corredor de Importação</option>
    <option value="ES_INVEST">Espírito Santo - INVEST-ES</option>
    <option value="GO_COMEXPRODUZIR">Goiás - COMEXPRODUZIR</option>
    <option value="none">Sem incentivo fiscal</option>
  </select>
  
  <div id="incentive-info" class="info-box mt-2">
    <!-- Informações dinâmicas do incentivo selecionado -->
  </div>
  
  <div id="reform-alert" class="alert alert-warning mt-3" style="display: none;">
    <i class="fas fa-exclamation-triangle"></i>
    <span id="reform-message"></span>
  </div>
</div>
```

### 5.2 Dashboard Comparativo

```html
<div class="dashboard-comparativo">
  <div class="row">
    <div class="col-md-4">
      <div class="metric-card">
        <h4>Custo Atual</h4>
        <p class="value">R$ 250.000</p>
        <small>Sem incentivo</small>
      </div>
    </div>
    <div class="col-md-4">
      <div class="metric-card success">
        <h4>Custo com Incentivo</h4>
        <p class="value">R$ 211.000</p>
        <small>Economia: R$ 39.000 (15,6%)</small>
      </div>
    </div>
    <div class="col-md-4">
      <div class="metric-card warning">
        <h4>Projeção 2033</h4>
        <p class="value">R$ 317.500</p>
        <small>CBS+IBS: 27%</small>
      </div>
    </div>
  </div>
  
  <div class="chart-container mt-4">
    <canvas id="reform-timeline-chart"></canvas>
  </div>
</div>
```

---

## 6. VALIDAÇÕES E REGRAS DE NEGÓCIO

### 6.1 Política NO FALLBACKS

```javascript
// Sempre lançar exceções para dados obrigatórios ausentes
validateIncentiveData(di, program) {
  if (!di.importador_estado) {
    throw new Error('Estado do importador obrigatório para aplicar incentivos');
  }
  
  if (!program.aliquota && !program.credito) {
    throw new Error(`Configuração de benefício incompleta para ${program.nome}`);
  }
  
  if (!di.numero_di) {
    throw new Error('Número da DI obrigatório para rastreabilidade');
  }
}
```

### 6.2 Regras de Elegibilidade

1. **Validação Estado-Programa**
   - Importador de SP não pode usar incentivo de GO
   - Verificar lista de estados elegíveis do programa

2. **Restrições por Regime Tributário**
   - Simples Nacional excluído de alguns benefícios
   - Lucro Real/Presumido com acesso completo

3. **Validação Temporal**
   - Verificar vigência do programa de incentivo
   - Aplicar fase correta (ex: TTD 409 antes/depois 36 meses)
   - TTD 410 requer 24 meses de operação

4. **Validação de NCM**
   - Alguns produtos excluídos (lista negativa)
   - Verificar elegibilidade por NCM quando aplicável

5. **Requisitos Específicos por TTD (SC)**
   - **TTD 409**: Sem garantia, antecipação obrigatória
   - **TTD 410**: 24 meses operação + R$ 24mi faturamento
   - **TTD 411**: Garantia real ou fidejussória obrigatória

---

## 7. CRONOGRAMA DE IMPLEMENTAÇÃO

### Fase 1: Core do Sistema (2 dias)
- [ ] Criar IncentiveManager.js com funções principais
- [ ] Expandir beneficios.json com todos os programas (incluindo TTDs 409/410/411)
- [ ] Implementar detectProgram() e validateEligibility()
- [ ] Criar testes unitários básicos

### Fase 2: Integração com NF (1 dia)
- [ ] Integrar com CroquiNFExporter.js
- [ ] Implementar cálculo de campos CST 51
- [ ] Adicionar lógica específica para cada TTD
- [ ] Adicionar observações obrigatórias
- [ ] Testar geração de croquis

### Fase 3: Cálculo de Custos (1 dia)
- [ ] Implementar calculateCostImpact()
- [ ] Adicionar cálculo de contrapartidas
- [ ] Criar comparação entre estados
- [ ] Integrar com ComplianceCalculator

### Fase 4: Reforma Tributária (1 dia)
- [ ] Criar reforma-tributaria.json
- [ ] Implementar projectReformScenarios()
- [ ] Adicionar alertas por ano
- [ ] Criar visualizações de projeção

### Fase 5: Testes e Documentação (1 dia)
- [ ] Testes E2E por estado
- [ ] Validação de cálculos com casos reais
- [ ] Documentação técnica
- [ ] Atualizar CLAUDE.md

---

## 8. MÉTRICAS DE SUCESSO

### KPIs Técnicos
- ✅ **Precisão dos Cálculos**: Margem de erro < 0,1%
- ✅ **Performance**: Processamento < 2 segundos por DI
- ✅ **Cobertura de Testes**: > 90% do código crítico
- ✅ **Zero Fallbacks**: 100% validações explícitas

### KPIs de Negócio
- ✅ **Compliance Fiscal**: 100% aderência às regras estaduais
- ✅ **Economia Identificada**: Visualização clara dos benefícios
- ✅ **Preparação Reforma**: Projeções para todos os anos até 2033
- ✅ **Adoção**: 80% dos usuários usando detecção automática

### Indicadores de Qualidade
- ✅ **Manutenibilidade**: Configuração via JSON sem código
- ✅ **Extensibilidade**: Novo estado em < 1 hora
- ✅ **Documentação**: 100% das funções documentadas
- ✅ **User Experience**: < 3 cliques para configurar incentivo

---

## 9. ANÁLISE DE RISCOS

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Mudança na legislação tributária | Alta | Alto | Configuração via JSON permite atualizações rápidas |
| Complexidade do cálculo TTD SC | Média | Médio | Fórmulas documentadas e validadas com contadores |
| Performance com muitos produtos | Baixa | Baixo | Cache de resultados e cálculo assíncrono |
| Interpretação incorreta de regras | Média | Alto | Revisão com especialistas tributários |
| Incompatibilidade futura | Baixa | Médio | Arquitetura modular e versionamento |
| Transição entre TTDs (409→410→411) | Média | Médio | Sistema de fases e validação temporal |

---

## 10. PLANO DE FOLLOW-UP

### Sprint 1 - Janeiro 2025 (MVP)
**Objetivo**: Sistema funcional para SC (TTDs), MG, ES

**Entregáveis**:
- IncentiveManager.js operacional
- Suporte completo TTD 409/410/411
- Integração com croquis de NF
- Cálculo de custos com incentivos
- Testes dos 3 estados prioritários

**Métricas de Aceite**:
- Croquis gerando CST 51 corretamente
- Cálculos validados por contador
- Zero erros em produção
- Transição entre TTDs funcional

### Sprint 2 - Fevereiro 2025 (Expansão)
**Objetivo**: Adicionar mais estados e dashboard

**Entregáveis**:
- Suporte para GO, RO, AL, MT
- Dashboard comparativo de incentivos
- Relatórios gerenciais
- API para integrações externas

**Métricas de Aceite**:
- 7 estados funcionais
- Dashboard com 3 visualizações
- Documentação API completa

### Sprint 3 - Março 2025 (Reforma)
**Objetivo**: Sistema completo com reforma tributária

**Entregáveis**:
- Simulador completo 2025-2033
- Alertas automáticos de mudanças
- Cálculo do Fundo de Compensação
- Treinamento para usuários

**Métricas de Aceite**:
- Projeções para todos os anos
- 95% precisão nas simulações
- 100% usuários treinados

---

## 11. DECISÕES TÉCNICAS E JUSTIFICATIVAS

### 11.1 Arquitetura Monolítica
**Decisão**: Um único módulo IncentiveManager.js

**Justificativa**:
- KISS: Simplicidade de manutenção
- Facilita testes e debugging
- Reduz complexidade de dependências
- Performance otimizada (menos overhead)

### 11.2 Configuração via JSON
**Decisão**: Todas as regras em beneficios.json

**Justificativa**:
- Atualizações sem deploy de código
- Versionamento independente
- Facilita auditoria de mudanças
- Permite configuração por ambiente

### 11.3 Reutilização de Código (DRY)
**Decisão**: Máximo reuso de módulos existentes

**Justificativa**:
- 95% do código já existe e funciona
- Reduz bugs de nova implementação
- Mantém consistência do sistema
- Acelera time-to-market

### 11.4 Zero Fallbacks Policy
**Decisão**: Sempre exceções explícitas

**Justificativa**:
- Evita cálculos incorretos silenciosos
- Facilita debugging
- Aumenta confiabilidade
- Compliance com padrões Expertzy

### 11.5 Preparação para 2033
**Decisão**: Implementar reforma desde já

**Justificativa**:
- Diferencial competitivo
- Evita retrabalho futuro
- Permite planejamento de longo prazo
- Agrega valor imediato ao cliente

---

## 12. DEPENDÊNCIAS E INTEGRAÇÕES

### Dependências Internas
- **DIProcessor.js**: Dados da DI processados
- **ComplianceCalculator.js**: Cálculos tributários base
- **CroquiNFExporter.js**: Geração de croquis
- **IndexedDBManager.js**: Persistência de dados
- **RegimeConfigManager.js**: Configuração de regime tributário

### Dependências Externas
- **beneficios.json**: Configuração de programas
- **reforma-tributaria.json**: Timeline da reforma
- **aliquotas.json**: Alíquotas por estado

### APIs e Serviços
- Nenhuma dependência de API externa (sistema offline-first)
- Possibilidade futura de integração com:
  - Receita Federal (validação CNPJ)
  - SEFAZ estaduais (consulta benefícios)
  - Serviços de CEP (validação endereços)

---

## 13. CONSIDERAÇÕES DE SEGURANÇA

### Validação de Dados
- Sanitização de todos os inputs
- Validação de tipos e ranges
- Prevenção de injection em cálculos

### Auditoria
- Log de todas as aplicações de incentivo
- Rastreabilidade de mudanças
- Histórico de cálculos por DI

### Compliance
- Aderência às regras fiscais
- Documentação de decisões
- Backup de configurações

---

## 14. DOCUMENTAÇÃO E TREINAMENTO

### Documentação Técnica
- JSDoc em todas as funções
- README.md com setup
- Diagramas de arquitetura
- Exemplos de uso

### Documentação Usuário
- Manual de configuração
- FAQ de incentivos fiscais
- Guia de transição TTDs (409→410→411)
- Vídeos tutoriais
- Casos de uso comuns

### Treinamento
- Workshop inicial (2 horas)
- Material de autoaprendizagem
- Suporte via chat/email
- Atualizações mensais

---

## 15. CONCLUSÃO

Este PRD define um sistema robusto, simples e preparado para o futuro, que atende às necessidades imediatas de gestão de incentivos fiscais enquanto prepara a empresa para as mudanças da reforma tributária.

A abordagem KISS/DRY garante manutenibilidade e rapidez de implementação, enquanto a política NO FALLBACKS assegura confiabilidade e precisão nos cálculos tributários.

O sistema contempla todos os três TTDs de Santa Catarina (409, 410 e 411), permitindo que empresas migrem progressivamente entre os programas conforme sua evolução e necessidades.

O sistema está projetado para ser implementado em 6 dias úteis, com entrega faseada que permite valor incremental a cada sprint.

---

**Documento criado em**: Janeiro 2025  
**Última atualização**: Janeiro 2025  
**Versão**: 1.0  
**Status**: Aprovado para implementação