# Sistema Expertzy de Importação e Precificação

Sistema brasileiro completo de tributação e precificação de importação com análise de incentivos fiscais estaduais.

## Visão Geral

O Sistema Expertzy processa Declarações de Importação (DI) em formato XML, calcula impostos de importação conforme legislação brasileira e otimiza estratégias de precificação considerando diferentes regimes tributários e incentivos fiscais estaduais.

### Características Principais

- ✅ **Processamento de DI**: Parser completo para XML de Declarações de Importação
- ✅ **Cálculo de Impostos**: II, IPI, PIS, COFINS, ICMS conforme legislação
- ✅ **Incentivos Fiscais**: Análise de benefícios por estado (GO, SC, ES, MG, etc.)
- ✅ **Múltiplos Regimes**: Lucro Real, Presumido, Simples Nacional
- ✅ **Precificação Inteligente**: Estratégias otimizadas por estado e cliente
- ✅ **Exportação Profissional**: Excel, PDF, JSON com formatação avançada

## Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Armazenamento**: IndexedDB (Dexie.js)
- **Exportação**: ExcelJS, jsPDF
- **Testes**: Playwright (E2E)
- **Visualização**: Chart.js

## Estrutura do Projeto

```
src/
├── core/                 # Módulos centrais
│   ├── processors/       # Processamento de DI
│   ├── calculators/      # Cálculo de impostos
│   └── engines/          # Motores de precificação
├── modules/              # Módulos funcionais
│   ├── compliance/       # Conformidade fiscal
│   ├── pricing/          # Estratégias de preços
│   └── memory/           # Gestão de dados
├── shared/               # Recursos compartilhados
│   ├── data/            # Configurações JSON
│   ├── styles/          # Temas e CSS
│   └── utils/           # Utilitários
└── tests/               # Testes E2E Playwright
```

## Status de Implementação

### ✅ Fase 0: Documentação e Planejamento
- [x] PRD v3 completo
- [x] Análise de requisitos
- [x] Arquitetura definida
- [x] Plano de fases detalhado

### 🔄 Fase 1: Foundation & Migration (Em andamento)
- [x] Repositório criado
- [x] Estrutura inicial
- [ ] Migração de módulos existentes
- [ ] IndexedDB com Dexie.js
- [ ] Configuração Playwright

### ⏳ Próximas Fases
- **Fase 2**: Sistema de Incentivos Fiscais
- **Fase 3**: Motor de Precificação por Regime
- **Fase 4**: Dashboard e Analytics
- **Fase 5**: Testes E2E e Validação
- **Fase 6**: Otimizações e Deploy

## Desenvolvimento

### Pré-requisitos
- Node.js 18+
- Navegador moderno (Chrome, Firefox, Safari)

### Instalação
```bash
git clone https://github.com/ceciliodaher/expertzy-sistema-importacao.git
cd expertzy-sistema-importacao
npm install
npm run dev
```

### Testes
```bash
# Testes E2E com Playwright
npm run test:e2e

# Testes específicos
npm run test:compliance
npm run test:pricing
```

## Conformidade

- ✅ **Legislação Brasileira**: Conforme RFB, CONFAZ, COTEPE
- ✅ **Zero Fallbacks**: Política rigorosa sem valores padrão
- ✅ **Validação Fiscal**: Verificação completa de cálculos
- ✅ **Incentivos Atualizados**: Base 2025 com todos os estados

## Contribuição

Este projeto segue padrões rigorosos de desenvolvimento:

1. **Zero Fallbacks**: Nunca usar `value || 0`
2. **Fail-Fast**: Lançar exceções explícitas
3. **Testes Obrigatórios**: E2E com logs limpos
4. **Documentação Completa**: Código auto-documentado

## Licença

Proprietary - Expertzy System © 2025

## Suporte

Para dúvidas técnicas ou suporte, consulte a documentação completa no diretório `/docs`.