# Manual de Desenvolvimento Cooperativo para o Sistema Expertzy

## Preparação Inicial do Repositório

### Configuração da Estrutura de Colaboração

**Organização do Repositório**

Antes de iniciar o desenvolvimento cooperativo, você deve estruturar seu repositório para facilitar a colaboração:[^1][^2]

- **Criar branch `develop`**: Estabeleça uma branch separada da `main` para desenvolvimento contínuo
- **Definir branch `main` como produção**: Reserve a branch principal apenas para código estável e testado
- **Configurar `.github/` directory**: Crie templates e configurações para padronização

**Templates de Documentação**

Crie templates padronizados na pasta `.github/`:[^3][^4]

```markdown
# .github/PULL_REQUEST_TEMPLATE.md
## Descrição das Alterações
Descreva brevemente o que foi implementado ou modificado.

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova funcionalidade
- [ ] Melhoria de performance
- [ ] Refatoração
- [ ] Atualização de documentação
- [ ] Testes

## Impacto no Sistema
- [ ] Afeta cálculos de impostos
- [ ] Modifica processamento de DI
- [ ] Altera interface do usuário
- [ ] Impacta incentivos fiscais estaduais

## Testes Realizados
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Testes E2E com Playwright
- [ ] Validação manual

## Checklist
- [ ] Código segue padrões do projeto
- [ ] Zero fallbacks implementados
- [ ] Documentação atualizada
- [ ] Testes passando
- [ ] Conformidade fiscal validada
```

```markdown
# .github/ISSUE_TEMPLATE/bug_report.md
---
name: Relatório de Bug
about: Criar um relatório para nos ajudar a melhorar
title: '[BUG] '
labels: 'bug'
assignees: ''
---

## Descrição do Bug
Descrição clara e concisa do problema.

## Passos para Reproduzir
1. Vá para '...'
2. Clique em '....'
3. Vá até '....'
4. Veja o erro

## Comportamento Esperado
O que você esperava que acontecesse.

## Comportamento Atual
O que realmente aconteceu.

## Screenshots/Logs
Se aplicável, adicione screenshots ou logs.

## Ambiente
- Navegador: [Chrome, Firefox, Safari, etc.]
- Versão: [versão do sistema]
- DI XML: [se relacionado ao processamento]
```

## Configuração de Proteção de Branches

### Regras de Proteção Essenciais

Configure regras rigorosas para as branches principais:[^2][^5][^6]

**Branch `main` (Produção)**

- ✅ Require pull request reviews (mínimo 2 aprovações)
- ✅ Require status checks to pass (CI/CD obrigatório)
- ✅ Require conversation resolution
- ✅ Do not allow force pushes
- ✅ Do not allow deletions
- ✅ Include administrators (aplica regras para todos)

**Branch `develop` (Desenvolvimento)**

- ✅ Require pull request reviews (mínimo 1 aprovação)
- ✅ Require status checks to pass
- ✅ Allow force pushes (apenas para maintainers)

### Implementação das Regras

```bash
# No GitHub, navegue até:
# Repository → Settings → Branches → Add rule

# Para branch main:
Branch name pattern: main
✓ Restrict pushes that create files larger than 100MB
✓ Require a pull request before merging
  ✓ Require approvals: 2
  ✓ Dismiss stale PR reviews when new commits are pushed
✓ Require status checks to pass before merging
  ✓ Require branches to be up to date before merging
  ✓ Status checks: ci-tests, lint-check, playwright-tests
✓ Require conversation resolution before merging
✓ Include administrators
```

## Estratégia de Branching

### GitFlow Adaptado para o Sistema Expertzy

Adote uma versão simplificada do GitFlow adaptada para desenvolvimento tributário:[^7][^8]

**Estrutura de Branches**

```
main (produção estável)
├── develop (integração contínua)
├── feature/nome-funcionalidade (desenvolvimento de features)
├── hotfix/nome-correcao (correções urgentes)
└── release/versao (preparação de releases)
```

**Convenções de Nomenclatura**

```bash
# Features
feature/processamento-di-xml
feature/incentivos-fiscais-sc
feature/calculadora-icms-importacao

# Hotfixes
hotfix/correcao-calculo-ipi
hotfix/bug-exportacao-excel

# Releases
release/v1.2.0
release/v1.3.0-beta
```

## Processo de Code Review

### Padrões de Revisão de Código

Estabeleça critérios rigorosos para revisões:[^9][^10][^11]

**Checklist para Revisores**

- **Funcionalidade**: Código atende aos requisitos tributários brasileiros?
- **Conformidade Fiscal**: Cálculos seguem legislação RFB/CONFAZ?
- **Zero Fallbacks**: Nenhum `valor || 0` ou similar implementado?
- **Testes**: Cobertura adequada com Playwright E2E?
- **Documentação**: Código auto-documentado e claro?
- **Performance**: Não há regressões de performance?
- **Segurança**: Dados tributários protegidos adequadamente?

**Processo de Revisão**

1. **Autor cria PR** usando template padronizado
2. **Reviewers designados** analisam mudanças
3. **Discussões técnicas** através de comentários
4. **Aprovação condicional** ou solicitação de mudanças
5. **Merge** após todas as condições atendidas

### Ferramentas de Automação

Implemente automações para garantir qualidade:[^12][^13]

**Pre-commit Hooks**

```bash
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-merge-conflict
      - id: check-json

  - repo: https://github.com/eslint/eslint
    rev: v8.0.0
    hooks:
      - id: eslint
        files: \.(js|jsx)$

  - repo: local
    hooks:
      - id: playwright-tests
        name: Run Playwright Tests
        entry: npm run test:e2e
        language: node
        pass_filenames: false
```

## Gerenciamento de Permissões e Papéis

### Estrutura de Acesso

Configure papéis adequados para cada tipo de colaborador:[^14][^15]

**Papéis Sugeridos**

- **Owner**: Você (controle total)
- **Maintainers**: Desenvolvedores sênior (pode fazer merge na main)
- **Contributors**: Desenvolvedores (pode criar PRs, trabalhar em features)
- **Reviewers**: Especialistas tributários (foco em conformidade fiscal)

**Configuração de Permissões**

```bash
# Maintainers
- Write access to repository
- Can merge PRs to develop
- Can create releases
- Can manage issues and labels

# Contributors  
- Write access to repository
- Can create feature branches
- Can open PRs
- Cannot merge to main/develop

# Reviewers
- Read access to repository
- Can review and approve PRs
- Can create and manage issues
- Focus on tax compliance validation
```

## Workflow de Desenvolvimento Cooperativo

### Fluxo Padrão para Novas Features

**1. Planejamento**

```bash
# Criar issue detalhada
Título: [FEATURE] Implementar cálculo DIFAL para importações
Labels: enhancement, tax-calculation, difal
Milestone: v1.3.0
Assignee: desenvolvedor-responsavel
```

**2. Desenvolvimento**

```bash
# Criar branch a partir de develop
git checkout develop
git pull origin develop
git checkout -b feature/calculo-difal-importacao

# Desenvolvimento seguindo padrões
# - Zero fallbacks policy
# - Fail-fast approach
# - Comprehensive E2E tests
```

**3. Preparação para Review**

```bash
# Antes de criar PR
npm run lint
npm run test:e2e
npm run validate:fiscal-compliance

# Criar PR usando template
# Adicionar reviewers apropriados
```

**4. Process de Review**

- **Review técnico**: Foco em código, arquitetura, testes
- **Review fiscal**: Validação de conformidade tributária
- **Review UX**: Usabilidade e interface (se aplicável)

**5. Merge e Deploy**

```bash
# Após aprovações
# Merge para develop via squash commit
# Deploy automático para ambiente de teste
# Validação final antes da release
```

### Workflow para Hotfixes

Para correções urgentes em produção:[^7]

```bash
# Criar hotfix a partir de main
git checkout main
git pull origin main
git checkout -b hotfix/correcao-critica-icms

# Desenvolver correção
# Testar exaustivamente
# Criar PR para main E develop
# Review acelerado mas rigoroso
# Merge e deploy imediato
```

## Padrões de Desenvolvimento

### Coding Standards Específicos

Estabeleça padrões rigorosos para o projeto tributário:[^16][^17]

**Padrões JavaScript/ES6+**

```javascript
// ❌ NUNCA usar fallbacks
const valor = data.imposto || 0; // PROIBIDO

// ✅ SEMPRE validação explícita
if (!data.imposto || data.imposto < 0) {
  throw new ValidationError('Imposto inválido na DI');
}
const valor = data.imposto;

// ✅ Nomenclatura tributária clara
const icmsImportacao = calcularICMSImportacao(valorAduaneiro, aliquota);
const ipiImportacao = calcularIPIImportacao(valorBase, aliquotaIPI);
```

**Estrutura de Arquivos**

```
src/
├── core/
│   ├── processors/
│   │   ├── DI_XML_Processor.js
│   │   ├── NCM_Validator.js
│   │   └── Fiscal_Compliance_Checker.js
│   ├── calculators/
│   │   ├── ICMS_Calculator.js
│   │   ├── IPI_Calculator.js
│   │   └── Incentivos_Fiscais_Calculator.js
│   └── engines/
│       ├── Pricing_Engine.js
│       └── Tax_Optimization_Engine.js
├── modules/
│   ├── compliance/
│   │   ├── RFB_Validator.js
│   │   ├── CONFAZ_Rules.js
│   │   └── State_Incentives_Validator.js
│   └── pricing/
│       ├── Regime_Calculator.js
│       └── Margin_Optimizer.js
└── tests/
    ├── e2e/
    │   ├── DI_Processing.spec.js
    │   ├── Tax_Calculation.spec.js
    │   └── State_Incentives.spec.js
    └── unit/
        ├── calculators/
        └── processors/
```

## Automação e CI/CD

### Pipeline de Integração Contínua

Configure automações robustas:[^10][^18]

```yaml
# .github/workflows/ci.yml
name: Expertzy CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run unit tests
        run: npm run test:unit

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Validate fiscal compliance
        run: npm run validate:fiscal

      - name: Check for zero-fallbacks policy
        run: npm run check:no-fallbacks

  security-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run security audit
        run: npm audit --audit-level high
```

## Comunicação e Documentação

### Ferramentas de Colaboração

**Issues e Project Boards**

- Use GitHub Issues para tracking de features e bugs
- Configure Project Boards para visualização de progresso
- Labels padronizadas: `enhancement`, `bug`, `tax-calculation`, `urgent`, `documentation`

**Documentação Colaborativa**

```markdown
# docs/CONTRIBUTING.md
## Guia de Contribuição - Sistema Expertzy

### Antes de Contribuir
1. Leia toda documentação fiscal relevante
2. Entenda a política Zero Fallbacks
3. Configure ambiente local com Playwright
4. Revise padrões de código estabelecidos

### Processo de Contribuição
1. Fork ou clone o repositório
2. Crie branch a partir de develop
3. Implemente seguindo coding standards
4. Adicione testes E2E obrigatórios
5. Valide conformidade fiscal
6. Crie PR usando template
7. Aguarde reviews e aprove mudanças solicitadas
```

## Monitoramento e Métricas

### KPIs de Desenvolvimento Cooperativo

Monitore a saúde do projeto colaborativo:

**Métricas de Código**

- Cobertura de testes (mínimo 90%)
- Tempo médio de review (máximo 48h)
- Taxa de rejeição de PRs (máximo 20%)
- Conformidade fiscal (100% dos PRs validados)

**Métricas de Colaboração**

- Número de contributors ativos
- Distribuição de commits por desenvolvedor
- Tempo de resolução de issues
- Qualidade de documentação

## Próximos Passos

### Implementação Gradual

**Fase 1: Configuração Básica (Semana 1)**

- Configurar branch protection rules
- Criar templates de PR e Issues
- Estabelecer coding standards
- Configurar pre-commit hooks

**Fase 2: Automação (Semana 2)**

- Implementar CI/CD pipeline
- Configurar testes automatizados
- Estabelecer process de review
- Treinar equipe nos novos processos

**Fase 3: Otimização (Semana 3-4)**

- Refinar workflows baseado no feedback
- Implementar métricas de monitoramento
- Otimizar tempos de review
- Documentar lições aprendidas

### Recomendações Finais

1. **Comece pequeno**: Implemente mudanças gradualmente para não sobrecarregar a equipe
2. **Seja consistente**: Aplique padrões rigorosamente desde o início
3. **Documente tudo**: Mantenha documentação atualizada e acessível
4. **Monitore continuamente**: Use métricas para identificar pontos de melhoria
5. **Mantenha foco fiscal**: Nunca comprometa a conformidade tributária por velocidade

Este manual fornece a base sólida para transformar seu desenvolvimento individual em um processo colaborativo eficiente, mantendo a alta qualidade e conformidade fiscal que caracterizam o Sistema Expertzy.
<span style="display:none">[^19][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^30][^31][^32][^33][^34][^35][^36][^37][^38][^39][^40][^41][^42][^43][^44][^45][^46][^47][^48][^49][^50][^51][^52][^53][^54][^55][^56][^57][^58][^59][^60][^61]</span>



```
<div style="text-align: center">⁂</div>
```

[^1]: https://devot.team/blog/git-collaboration

[^2]: https://graphite.dev/guides/how-to-set-up-branch-protection-rules-in-github

[^3]: https://axolo.co/blog/p/part-3-github-pull-request-template

[^4]: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests

[^5]: https://graphite.dev/guides/how-to-set-up-branch-protection-rules-github

[^6]: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule

[^7]: https://newsletter.techworld-with-milan.com/p/git-branching-strategies

[^8]: https://www.gitkraken.com/learn/git/best-practices/git-branch-strategy

[^9]: https://graphite.dev/guides/set-up-code-review-guidelines

[^10]: https://axify.io/blog/code-review-checklist

[^11]: https://www.holycode.com/blog/code-review-best-practices-and-techniques/

[^12]: https://dev.to/ethancarlsson/using-git-hooks-to-run-your-tests-andor-linter-2e34

[^13]: https://pre-commit.com

[^14]: https://www.conductorone.com/guides/everything_you_wanted_to_know_about_github_access_control/

[^15]: https://docs.github.com/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/managing-teams-and-people-with-access-to-your-repository

[^16]: https://graphite.dev/guides/creating-coding-style-guide

[^17]: https://blog.codacy.com/coding-standards

[^18]: https://interrupt.memfault.com/blog/pre-commit

[^19]: https://github.com/ceciliodaher/expertzy-sistema-importacao

[^20]: https://confluence.atlassian.com/spaces/BitbucketServer/pages/808488540/Reviewing+a+pull+request

[^21]: https://rainsworth.github.io/intro-to-github/06_Collaboration.html

[^22]: https://gearset.com/blog/choosing-the-right-git-branching-strategy-for-your-team/

[^23]: https://developer.mozilla.org/en-US/docs/MDN/Community/Pull_requests

[^24]: https://github.blog/enterprise-software/devops/how-to-build-a-consistent-workflow-for-development-and-operations-teams/

[^25]: https://docs.github.com/articles/reviewing-proposed-changes-in-a-pull-request

[^26]: https://docs.github.com/en/get-started/using-github/github-flow

[^27]: https://dev.to/juniourrau/6-types-of-git-branching-strategy-g54

[^28]: https://docs.github.com/articles/about-pull-request-reviews

[^29]: https://dev.to/vishad_patel_f54e007e16e5/mastering-github-best-practices-for-seamless-team-collaboration-and-workflow-efficiency-34cb

[^30]: https://learn.microsoft.com/en-us/azure/devops/repos/git/git-branching-guidance?view=azure-devops

[^31]: https://jimbobbennett.dev/blogs/how-to-review-a-pr/

[^32]: https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/getting-started/about-collaborative-development-models

[^33]: https://www.reddit.com/r/git/comments/1m7dfyb/the_ultimate_guide_to_git_branching_strategies/

[^34]: https://www.reddit.com/r/cscareerquestions/comments/za2ill/how_do_you_review_a_pull_request/

[^35]: https://www.deployhq.com/blog/the-perfect-pull-request-best-practices-for-collaborative-development

[^36]: https://www.atlassian.com/agile/software-development/branching

[^37]: https://entro.security/blog/github-access-management-best-practices/

[^38]: https://stackoverflow.com/questions/44420219/how-do-i-add-linting-to-pre-commit-hook

[^39]: https://docs.github.com/en/issues/planning-and-tracking-with-projects/managing-your-project/managing-access-to-your-projects

[^40]: https://dev.to/balrajola/best-practices-for-code-reviews-that-foster-team-collaboration-1l4e

[^41]: https://docs.github.com/get-started/learning-about-github/access-permissions-on-github

[^42]: https://miro.com/agile/what-is-code-review/

[^43]: https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks

[^44]: https://docs.github.com/en/organizations/managing-peoples-access-to-your-organization-with-roles/roles-in-an-organization

[^45]: https://google.github.io/eng-practices/review/reviewer/standard.html

[^46]: https://www.reddit.com/r/devops/comments/yo0y5i/precommit_vs_prepush_vs_cicd_for_linting_and/

[^47]: https://docs.github.com/en/account-and-profile/reference/permission-levels-for-a-personal-account-repository

[^48]: https://www.swarmia.com/blog/a-complete-guide-to-code-reviews/

[^49]: https://cloud.google.com/secure-source-manager/docs/configure-branch-protection

[^50]: https://philippe.bourgau.net/3-good-and-bad-ways-to-write-team-coding-standards-and-conventions/

[^51]: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository

[^52]: https://www.qodo.ai/blog/mastering-coding-standards-and-best-practices-for-software-development/

[^53]: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/about-issue-and-pull-request-templates

[^54]: https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches

[^55]: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository

[^56]: https://www.reddit.com/r/dataengineering/comments/wqoqcx/how_to_write_up_some_coding_standards_for_my_team/

[^57]: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/manually-creating-a-single-issue-template-for-your-repository

[^58]: https://www.youtube.com/watch?v=hQZ2Bm1GhTE

[^59]: https://www.browserstack.com/guide/coding-standards-best-practices

[^60]: https://github.com/stevemao/github-issue-templates

[^61]: https://docs.gitlab.com/user/project/repository/branches/protected/
