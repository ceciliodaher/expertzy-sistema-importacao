# Plano de Implementação: Dashboard de Estatísticas com Subagentes

## Visão Geral

Este documento define a estrutura de implementação do Dashboard de Estatísticas Pós-Importação utilizando subagentes especializados para cada fase do desenvolvimento.

## Princípios Fundamentais

### Regras Invioláveis
1. **NO FALLBACKS**: Dados obrigatórios devem falhar explicitamente se ausentes
2. **NO HARDCODE**: Taxa de câmbio sempre calculada, nunca fixa
3. **NOMENCLATURA CONVERGENTE**: Usar exatos nomes do sistema (numero_di, valor_reais, etc.)
4. **VALIDAÇÃO RIGOROSA**: Verificar integridade antes de qualquer cálculo

## Fases de Implementação com Subagentes

### Fase 1: Análise e Mapeamento
**Subagente: comprehensive-researcher**

```yaml
Objetivo: Mapear estrutura completa de dados e APIs necessárias
Tarefas:
  - Analisar tabelas MySQL existentes
  - Identificar campos disponíveis vs futuros
  - Mapear fluxo de dados XML → Banco → Dashboard
  - Documentar endpoints API necessários
  
Output:
  - Documento técnico com estrutura de dados
  - Lista de queries SQL necessárias
  - Especificação de APIs RESTful
```

### Fase 2: Backend - Desenvolvimento de APIs
**Subagente: backend-architect**

```yaml
Objetivo: Criar endpoints robustos para o dashboard
Arquivos a criar:
  - /api/endpoints/statistics/di-summary.php
  - /api/endpoints/statistics/tributos-analysis.php
  - /api/endpoints/statistics/despesas-manager.php
  - /api/endpoints/statistics/export-data.php

Regras críticas:
  - NUNCA usar fallbacks em dados obrigatórios
  - Taxa câmbio = valor_reais / valor_moeda_negociacao
  - Validar todos os dados antes de retornar
  - Usar nomenclatura exata do sistema

Exemplo de validação:
```php
// di-summary.php
if (!isset($di['numero_di'])) {
    throw new Exception('DI sem número - dados corrompidos');
}
if (!isset($di['valor_reais']) || !isset($di['valor_moeda_negociacao'])) {
    throw new Exception('Valores obrigatórios ausentes na DI ' . $di['numero_di']);
}
$taxa_cambio = $di['valor_reais'] / $di['valor_moeda_negociacao'];
if (!is_finite($taxa_cambio) || $taxa_cambio <= 0) {
    throw new Exception('Taxa de câmbio inválida calculada');
}
```

### Fase 3: Frontend - Interface Visual
**Subagente: frontend-developer**

```yaml
Objetivo: Criar dashboard visual dinâmico e responsivo
Arquivos a criar:
  - /sistema-expertzy-local/statistics/import-statistics.html
  - /sistema-expertzy-local/statistics/js/StatisticsDashboard.js
  - /sistema-expertzy-local/statistics/js/ChartRenderer.js
  - /sistema-expertzy-local/statistics/css/statistics.css

Componentes principais:
  - Cards de KPIs (total DIs, valores, taxa câmbio média)
  - Tabela expansível multi-nível (DI → Adições → Produtos)
  - Gráficos Chart.js (evolução temporal, distribuição NCM)
  - Sistema de filtros (período, importador, NCM)

Validações no frontend:
```javascript
// StatisticsDashboard.js
class StatisticsDashboard {
    validateDIData(di) {
        if (!di.numero_di) {
            throw new Error('DI sem número identificador');
        }
        if (di.valor_reais === undefined || di.valor_reais === null) {
            throw new Error(`Valor reais obrigatório ausente na DI ${di.numero_di}`);
        }
        if (di.valor_moeda_negociacao === undefined || di.valor_moeda_negociacao === null) {
            throw new Error(`Valor moeda negociação ausente na DI ${di.numero_di}`);
        }
        
        // Taxa câmbio sempre calculada
        const taxaCambio = di.valor_reais / di.valor_moeda_negociacao;
        if (!isFinite(taxaCambio) || taxaCambio <= 0) {
            throw new Error(`Taxa câmbio inválida para DI ${di.numero_di}`);
        }
        
        return { ...di, taxa_cambio: taxaCambio };
    }
}
```

### Fase 4: Sistema de Despesas Extras
**Subagente: database-optimizer**

```yaml
Objetivo: Implementar gestão de despesas extras opcionais
Funcionalidades:
  - Interface para adicionar despesas extras
  - Classificação: tributável ICMS vs custeio
  - Templates de despesas recorrentes
  - Rateio proporcional por adição

Tratamento de opcionais:
```javascript
// DespesasManager.js
class DespesasManager {
    processDespesas(despesasDI, despesasExtras = {}) {
        // Despesas da DI são obrigatórias
        if (despesasDI.siscomex === undefined) {
            throw new Error('Taxa SISCOMEX obrigatória não encontrada');
        }
        if (despesasDI.afrmm === undefined && despesasDI.tipo_transporte === 'maritimo') {
            throw new Error('AFRMM obrigatório para transporte marítimo');
        }
        
        // Despesas extras são opcionais (podem ter fallback)
        const processadas = {
            // Obrigatórias (sem fallback)
            siscomex: despesasDI.siscomex,
            afrmm: despesasDI.afrmm,
            capatazia: despesasDI.capatazia,
            
            // Opcionais (com fallback para 0)
            armazenagem: despesasExtras.armazenagem || 0,
            transporte_interno: despesasExtras.transporte_interno || 0,
            despachante: despesasExtras.despachante || 0,
            outros: despesasExtras.outros || 0
        };
        
        return processadas;
    }
}
```

### Fase 5: Testes e Validação
**Subagente: test-automator**

```yaml
Objetivo: Garantir integridade e conformidade do sistema
Testes a implementar:
  - Validação de nomenclatura convergente
  - Testes de falha para dados obrigatórios
  - Verificação de cálculo de taxa câmbio
  - Testes com dados reais de DIs

Casos de teste críticos:
```javascript
// tests/dashboard.test.js
describe('Dashboard Validation', () => {
    test('Deve falhar sem numero_di', () => {
        const di = { valor_reais: 1000 };
        expect(() => dashboard.validateDI(di)).toThrow('DI sem número');
    });
    
    test('Deve calcular taxa câmbio corretamente', () => {
        const di = {
            numero_di: '2300120746',
            valor_reais: 240961.09,
            valor_moeda_negociacao: 48192.22
        };
        const result = dashboard.processaDI(di);
        expect(result.taxa_cambio).toBeCloseTo(5.0020, 4);
    });
    
    test('Deve usar nomenclatura exata', () => {
        // Verificar que usa valor_reais, não valorReais
        const fields = Object.keys(dashboard.getData());
        expect(fields).toContain('valor_reais');
        expect(fields).not.toContain('valorReais');
    });
});
```

### Fase 6: Documentação e Deploy
**Subagente: technical-researcher**

```yaml
Objetivo: Documentar sistema completo e preparar deploy
Documentação a criar:
  - README do dashboard
  - Documentação de APIs
  - Guia de troubleshooting
  - Changelog de versões

Deploy checklist:
  - Verificar conexão MySQL
  - Validar permissões de arquivos
  - Testar em ambiente staging
  - Backup antes de deploy
```

## Estrutura de Arquivos Final

```
/sistema-expertzy-local/statistics/
├── import-statistics.html          # Dashboard principal
├── calculation-dashboard.html      # Dashboard de cálculos (futuro)
├── js/
│   ├── StatisticsDashboard.js     # Controller principal
│   ├── DespesasManager.js         # Gerenciador de despesas
│   ├── ChartRenderer.js           # Renderizador de gráficos
│   └── DataValidator.js           # Validações rigorosas
├── css/
│   └── statistics.css              # Estilos do dashboard
└── tests/
    └── dashboard.test.js           # Testes automatizados

/api/endpoints/statistics/
├── di-summary.php                  # Resumo por DI
├── tributos-analysis.php          # Análise de tributos
├── despesas-manager.php           # Gestão de despesas
└── export-data.php                # Exportação Excel/PDF
```

## Cronograma Estimado

| Fase | Subagente | Duração | Status |
|------|-----------|---------|--------|
| 1. Análise | comprehensive-researcher | 2h | Pendente |
| 2. Backend | backend-architect | 4h | Pendente |
| 3. Frontend | frontend-developer | 6h | Pendente |
| 4. Despesas | database-optimizer | 3h | Pendente |
| 5. Testes | test-automator | 3h | Pendente |
| 6. Deploy | technical-researcher | 2h | Pendente |

## Comandos de Execução com Subagentes

```bash
# Fase 1: Análise
claude-code --agent comprehensive-researcher --task "Analisar estrutura de dados para dashboard"

# Fase 2: Backend
claude-code --agent backend-architect --task "Criar APIs /api/statistics com validações rigorosas"

# Fase 3: Frontend
claude-code --agent frontend-developer --task "Implementar dashboard visual com Chart.js"

# Fase 4: Testes
claude-code --agent test-automator --task "Criar testes para validar nomenclatura e cálculos"

# Fase 5: Deploy
claude-code --agent technical-researcher --task "Documentar e preparar deploy do dashboard"
```

## Garantias de Qualidade

✅ **Nomenclatura**: 100% convergente com sistema existente
✅ **No Fallbacks**: Dados obrigatórios sempre com throw Error
✅ **No Hardcode**: Taxa câmbio sempre calculada dinamicamente
✅ **Validações**: Rigorosas em todos os níveis (backend e frontend)
✅ **Subagentes**: Especialista adequado para cada fase
✅ **Testes**: Cobertura completa de casos críticos

---

*Documento criado para garantir implementação consistente e confiável do Dashboard de Estatísticas*