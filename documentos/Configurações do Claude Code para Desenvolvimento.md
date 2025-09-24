# Configurações do Claude Code para Desenvolvimento Cooperativo

## Alterações Essenciais no Claude Code

Com base na pesquisa realizada, você precisa fazer várias configurações no Claude Code para otimizar o trabalho cooperativo no seu sistema Expertzy. Aqui estão as modificações necessárias:

## Configuração de Múltiplos Ambientes

### Estrutura de Arquivos CLAUDE.md por Ambiente

Crie arquivos CLAUDE.md específicos para diferentes contextos de trabalho:[^1][^2]

**CLAUDE.md (Principal - para todo o time)**

```markdown
# Sistema Expertzy - Configuração de Equipe

## Visão Geral do Projeto
Sistema brasileiro completo de tributação e precificação de importação com análise de incentivos fiscais estaduais.

## Stack Tecnológica
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Armazenamento**: IndexedDB (Dexie.js)
- **Exportação**: ExcelJS, jsPDF
- **Testes**: Playwright (E2E)
- **Versionamento**: Git com GitFlow

## Padrões de Código - CRÍTICO
### Política Zero Fallbacks (OBRIGATÓRIA)
❌ NUNCA usar: `value || 0`, `data?.field || "default"`
✅ SEMPRE usar: Validação explícita com throw Error
// ❌ PROIBIDO
const icms = importacao.icms || 0;

// ✅ OBRIGATÓRIO
if (!importacao.icms || importacao.icms < 0) {
throw new ValidationError('ICMS inválido na DI');
}
const icms = importacao.icms;

## Convenções de Nomenclatura Tributária
- `calcularICMSImportacao()` não `calculateTax()`
- `DI_XML_Processor` não `XMLParser`
- `incentivos_fiscais_sc` não `state_benefits`

## Workflow de Desenvolvimento
- **Branch Strategy**: GitFlow (main/develop/feature/hotfix)
- **Commits**: Conventional Commits (feat:, fix:, docs:)
- **PRs**: Template obrigatório + 2 aprovações para main
- **Testes**: Playwright E2E obrigatório antes do merge

## Processo de Review Obrigatório
Antes de qualquer commit:
1. ✅ Executar `npm run lint`
2. ✅ Executar `npm run test:e2e`
3. ✅ Validar conformidade fiscal
4. ✅ Verificar política zero-fallbacks
5. ✅ Documentar cálculos tributários

## Comandos Essenciais
- `npm run test:e2e` - Testes Playwright
- `npm run lint` - ESLint + Prettier
- `npm run validate:fiscal` - Validação RFB/CONFAZ
- `npm run check:no-fallbacks` - Verificar política
```

### Configuração Multi-Diretório

Configure Claude Code para trabalhar com múltiplos diretórios:[^3][^4]

```bash
# Iniciar Claude Code com múltiplos diretórios
claude --add-dir ../documentacao-fiscal \
       --add-dir ../testes-conformidade \
       --add-dir ../dados-rfb

# Durante a sessão, adicionar diretórios conforme necessário
/add-dir ../modelos-calculo-tributario
/add-dir ../base-incentivos-estaduais
```

## Configuração de MCP para Colaboração

### Arquivo .claude.json para o Projeto

Crie configuração MCP específica para o projeto tributário:[^5][^4]

```json
{
  "projects": {
    "/caminho/para/expertzy-sistema-importacao": {
      "mcpServers": {
        "github-integration": {
          "command": "npx",
          "args": ["-y", "@anthropic-ai/claude-code-mcp-github"]
        },
        "filesystem-tributario": {
          "command": "npx", 
          "args": ["-y", "@modelcontextprotocol/server-filesystem", 
                   "./src", "./docs", "./tests", "./data"]
        },
        "memory-fiscal": {
          "command": "npx",
          "args": ["-y", "@modelcontextprotocol/server-memory"]
        },
        "web-scraper-rfb": {
          "command": "npx",
          "args": ["-y", "@modelcontextprotocol/server-fetch"]
        }
      },
      "allowedTools": [
        "edit_file",
        "create_file", 
        "run_command",
        "search_files",
        "git_*"
      ]
    }
  }
}
```

## Comandos Slash Customizados para Tributação

### Arquivo .claude/commands.json

Crie comandos específicos para o sistema tributário:[^6][^7]

```json
{
  "commands": {
    "/test-fiscal": {
      "description": "Executar todos os testes de conformidade fiscal",
      "steps": [
        "npm run test:compliance",
        "npm run validate:rfb-rules", 
        "npm run check:confaz-standards",
        "npm run verify:icms-calculations"
      ]
    },
    "/validate-di": {
      "description": "Validar processamento de DI XML",
      "prompt": "Analisar se o processamento de DI XML está conforme especificações da RFB. Verificar: 1) Parser XML, 2) Validação de campos obrigatórios, 3) Cálculos de impostos, 4) Conformidade com layouts oficiais"
    },
    "/review-incentivos": {
      "description": "Revisar implementação de incentivos fiscais estaduais",
      "prompt": "Revisar conformidade da implementação de incentivos fiscais. Verificar: 1) Legislação estadual atualizada, 2) Cálculos corretos, 3) Condições de elegibilidade, 4) Documentação fiscal adequada"
    },
    "/deploy-check": {
      "description": "Verificações antes do deploy",
      "steps": [
        "npm run lint",
        "npm run test:e2e", 
        "npm run validate:fiscal",
        "npm run check:no-fallbacks",
        "npm run build",
        "npm run test:production"
      ]
    }
  }
}
```

## Configuração de Perfis para Diferentes Desenvolvedores

### Sistema de Perfis Multi-Usuário

Embora o Claude Code não suporte nativamente múltiplas contas simultâneas, você pode criar perfis de trabalho:[^8]

```bash
# Estrutura de perfis de trabalho
~/.claude/profiles/
├── lead-developer.json
├── frontend-specialist.json  
├── backend-specialist.json
└── fiscal-specialist.json
```

**lead-developer.json**

```json
{
  "role": "Tech Lead",
  "permissions": ["all"],
  "focus_areas": ["architecture", "code_review", "deployment"],
  "claude_instructions": "Atuar como tech lead. Focar em arquitetura, padrões de código e coordenação de equipe. Sempre validar conformidade fiscal antes de aprovar mudanças."
}
```

**fiscal-specialist.json**

```json
{
  "role": "Especialista Fiscal", 
  "permissions": ["read", "review", "validate"],
  "focus_areas": ["tax_calculations", "compliance", "rfb_rules"],
  "claude_instructions": "Especializar em conformidade tributária brasileira. Validar todos os cálculos contra legislação RFB/CONFAZ. Não aprovar código sem validação fiscal completa."
}
```

## Integração com GitHub Actions

### Configuração Automatizada de Review

Configure Claude Code para trabalhar com GitHub Actions:[^9][^10]

```yaml
# .github/workflows/claude-review.yml
name: Claude Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  claude-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Claude Fiscal Review
        uses: anthropic-ai/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
          prompt: |
            Revisar este PR focando em:
            1. Conformidade fiscal brasileira (RFB/CONFAZ)
            2. Política zero-fallbacks
            3. Cálculos tributários corretos
            4. Testes E2E adequados
            5. Documentação de mudanças fiscais
```

## Configuração de Workspace Colaborativo

### Estrutura de Diretórios Otimizada

Organize seu workspace para colaboração eficiente:[^11]

```
expertzy-workspace/
├── expertzy-sistema-importacao/        # Repositório principal
│   ├── CLAUDE.md                      # Configuração principal
│   └── .claude/
│       ├── settings.local.json        # Configurações do projeto
│       └── commands.json              # Comandos customizados
├── expertzy-documentacao/             # Documentação fiscal
│   └── CLAUDE.md                      # Foco em documentação
├── expertzy-testes-conformidade/      # Testes específicos
│   └── CLAUDE.md                      # Foco em testes
└── expertzy-dados-tributarios/        # Dados e configurações
    └── CLAUDE.md                      # Foco em dados fiscais
```

## Configurações de Sessão para Colaboração

### Preparação de Contexto Colaborativo

Configure Claude Code para manter contexto entre sessões:[^12][^13]

```bash
# Iniciar sessão colaborativa
claude --add-dir ../expertzy-documentacao \
       --add-dir ../expertzy-testes-conformidade \
       --profile fiscal-team

# Comando para sincronizar contexto entre desenvolvedores
/sync-team-context
```

### Arquivo HISTORY.md para Contexto Contínuo

Mantenha histórico compartilhado entre sessões:[^12]

```markdown
# HISTORY.md - Contexto de Desenvolvimento Colaborativo

## Última Sessão: 2025-09-24
**Desenvolvedor**: João (Tech Lead)
**Foco**: Implementação cálculo DIFAL importação
**Status**: Em desenvolvimento - feature/calculo-difal-importacao
**Próximos Passos**: 
1. Finalizar validação de alíquotas interestaduais
2. Implementar testes E2E para cenários SC/GO
3. Documentar regras específicas para beneficiários

## Decisões Técnicas Recentes
- ✅ Adotado padrão de validação explícita (zero-fallbacks)
- ✅ Implementado parser DI v3.1 conforme RFB
- 🔄 Em análise: otimização de performance para DIs grandes
- ⏳ Pendente: integração com base CEST atualizada

## Conformidade Fiscal Atual
- ✅ ICMS importação: Conforme IN RFB 2.055/2021
- ✅ Incentivos SC: Atualizado Dec. 1.980/2013
- ✅ DIFAL: Implementado EC 87/2015
- 🔄 Em validação: Novos critérios ProGoiás 2025
```

## Comandos de Colaboração Específicos

### Scripts de Sincronização

Crie scripts para sincronizar trabalho entre desenvolvedores:

```bash
#!/bin/bash
# sync-team-work.sh

echo "🔄 Sincronizando trabalho da equipe Expertzy..."

# Atualizar todas as branches
git fetch --all

# Sincronizar contexto fiscal
npm run sync:fiscal-data

# Verificar conformidade antes da sincronização  
npm run validate:all-compliance

# Atualizar documentação colaborativa
npm run update:team-docs

echo "✅ Sincronização completa!"
```

## Configuração de Hooks para Colaboração

### Pre-commit Hooks Específicos

Configure hooks que executem validações colaborativas:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: fiscal-compliance-check
        name: Verificar Conformidade Fiscal
        entry: npm run validate:fiscal
        language: node
        pass_filenames: false

      - id: zero-fallbacks-check  
        name: Verificar Política Zero Fallbacks
        entry: npm run check:no-fallbacks
        language: node
        pass_filenames: false

      - id: team-context-update
        name: Atualizar Contexto da Equipe
        entry: ./scripts/update-team-context.sh
        language: script
        pass_filenames: false
```

## Resumo das Alterações Necessárias

### Configurações Imediatas

1. **Criar CLAUDE.md específico** para o projeto tributário
2. **Configurar MCP servers** para GitHub e filesystem
3. **Implementar comandos slash customizados** para validações fiscais
4. **Estruturar workspace multi-diretório** para documentação e testes
5. **Configurar GitHub Actions** para review automatizado

### Configurações Avançadas

1. **Sistema de perfis** para diferentes especialidades
2. **HISTORY.md compartilhado** para contexto contínuo
3. **Scripts de sincronização** entre desenvolvedores
4. **Hooks personalizados** para conformidade fiscal
5. **Integração com CI/CD** para validação automática

Essas configurações transformarão seu Claude Code de uma ferramenta individual em uma plataforma de desenvolvimento colaborativo otimizada para o sistema tributário Expertzy, mantendo a conformidade fiscal e os padrões rigorosos que você estabeleceu.
<span style="display:none">[^14][^15][^16][^17][^18][^19][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^30][^31][^32][^33][^34][^35]</span>

```
<div style="text-align: center">⁂</div>
```

[^1]: https://www.maxitect.blog/posts/maximising-claude-code-building-an-effective-claudemd

[^2]: https://www.mintlify.com/docs/guides/claude-code

[^3]: https://apidog.com/blog/claude-code-multi-directory-support/

[^4]: https://www.claudelog.com/configuration/

[^5]: https://docs.claude.com/en/docs/claude-code/mcp

[^6]: https://www.eesel.ai/blog/claude-code-workflow-automation

[^7]: https://github.com/feiskyer/claude-code-settings

[^8]: https://github.com/anthropics/claude-code/issues/261

[^9]: https://stevekinney.com/courses/ai-development/integrating-with-github-actions

[^10]: https://apidog.com/blog/claude-code-github-actions/

[^11]: https://www.linkedin.com/posts/valokafor_how-to-set-up-claude-code-the-right-way-for-activity-7353146981034201089-dhdX

[^12]: https://www.maxitect.blog/posts/beyond-solo-ai-how-pair-programming-with-claude-code-transforms-team-development

[^13]: https://dev.to/martinrojas/claude-code-a-developers-guide-to-ai-powered-terminal-workflows-17ai

[^14]: https://milvus.io/ai-quick-reference/can-i-collaborate-with-teammates-using-claude-code

[^15]: https://support.claude.com/en/articles/10167454-using-the-github-integration

[^16]: https://www.reddit.com/r/ClaudeAI/comments/1hnizic/using_mcp_for_a_collaborative_development/

[^17]: https://www.anthropic.com/engineering/claude-code-best-practices

[^18]: https://claude.ai

[^19]: https://www.eesel.ai/blog/claude-code-github-integration

[^20]: https://www.anthropic.com/news/how-anthropic-teams-use-claude-code

[^21]: https://www.builder.io/blog/claude-code

[^22]: https://dev.to/robmarshall/turning-claude-code-into-a-development-powerhouse-1njl

[^23]: https://www-cdn.anthropic.com/58284b19e702b49db9302d5b6f135ad8871e7658.pdf

[^24]: https://www.reddit.com/r/ClaudeAI/comments/1l47qf3/adding_github_integration_to_claude/

[^25]: https://newsletter.pragmaticengineer.com/p/how-claude-code-is-built

[^26]: https://www.reddit.com/r/ClaudeAI/comments/1m8qgpe/how_staff_at_anthropic_use_claude_code/

[^27]: https://github.com/steipete/claude-code-mcp

[^28]: https://github.com/ruvnet/claude-flow/wiki/CLAUDE-MD-Small-Team

[^29]: https://chrisfrew.in/blog/how-to-manage-multiple-environments-with-mcp/

[^30]: https://generect.com/blog/claude-mcp/

[^31]: https://www.reddit.com/r/ClaudeAI/comments/1ljvkqy/claude_code_max_can_i_share_it_between_2_people/

[^32]: https://www.reddit.com/r/ClaudeAI/comments/1jf4hnt/setting_up_mcp_servers_in_claude_code_a_tech/

[^33]: https://www.reddit.com/r/ClaudeAI/comments/1md9xsj/make_claude_code_less_agreeable_and_more/

[^34]: https://anthropic.com/engineering/claude-code-best-practices

[^35]: https://www.youtube.com/watch?v=Bz5fyyCa2-0
