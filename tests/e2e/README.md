# Testes E2E - Sistema Expertzy

## Estrutura de Testes

```
tests/e2e/
├── fase1-foundation/           # Testes fundamentais do sistema
│   ├── xml-real-processing.spec.js    # Processamento XML real completo
│   ├── log-validation.spec.js          # Validação de logs limpos
│   └── system-initialization.spec.js   # Inicialização do sistema
├── fixtures/
│   └── real-xml/
│       └── 2518173187.xml             # XML real para testes
└── helpers/
    ├── console-monitor.js             # Monitor de console logs
    └── di-interface-helper.js         # Helper para interface DI
```

## Fase 1 - Foundation Tests

### xml-real-processing.spec.js

**Objetivo**: Validar processamento completo de DI real com XML autêntico

**XML Testado**: `2518173187.xml`
- **Importador**: EQUIPLEX INDUSTRIA FARMACEUTICA LTDA (GO)
- **Incoterm**: CPT
- **NCM**: 29420000 (Outros compostos orgânicos)
- **CNPJ**: 01.784.792/0001-03

**Cenários de Teste**:
- ✅ Upload e processamento sem erros
- ✅ Dados extraídos corretamente do XML
- ✅ Navegação pelos 4 steps da interface
- ✅ Cálculos tributários sem valores NaN/undefined
- ✅ Exportação de relatórios funcionando
- ✅ Logs limpos durante todo o processo

### log-validation.spec.js

**Objetivo**: Garantir logs limpos seguindo padrões rigorosos Expertzy

**Validações Críticas**:
- ❌ Zero menções a DataMigration
- ❌ Zero erros de propriedades null/undefined
- ❌ Zero fallbacks implícitos
- ❌ Zero vazamentos de memória
- ✅ Configurações carregadas corretamente
- ✅ Módulos inicializados sem erros

### system-initialization.spec.js

**Objetivo**: Validar inicialização completa e correta do sistema

**Verificações**:
- ✅ Carregamento de módulos JavaScript essenciais
- ✅ IndexedDB disponível e funcional
- ✅ Configurações ICMS carregadas
- ✅ Interface responsiva
- ✅ Performance de carregamento < 10s
- ✅ Acessibilidade básica

## Helpers

### ConsoleMonitor

Monitor especializado para captura e validação de logs do console.

**Funcionalidades**:
- Captura automática de logs por tipo (error, warning, info, debug)
- Validação de logs limpos conforme padrões Expertzy
- Detecção de padrões críticos proibidos
- Export de logs para debugging
- Aguardar por logs específicos

**Padrões Críticos Detectados**:
```javascript
const criticalErrors = [
    'DataMigration',
    'Cannot read properties of null',
    'Cannot read properties of undefined',
    'is not a function',
    'is not defined',
    'ReferenceError',
    'TypeError',
    'SyntaxError'
];
```

### DIInterfaceHelper

Helper para interação com a interface principal do sistema.

**Funcionalidades**:
- Navegação automática para interface
- Upload de arquivos XML
- Navegação pelos steps do processo
- Validação de dados extraídos
- Execução de cálculos
- Validação de resultados
- Exportação de relatórios

## Execução dos Testes

### Comandos Disponíveis

```bash
# Executar todos os testes da fase 1
npm run test:e2e:fase1

# Executar testes específicos
npx playwright test xml-real-processing
npx playwright test log-validation
npx playwright test system-initialization

# Executar com debug
npx playwright test --debug

# Executar com UI mode
npx playwright test --ui

# Gerar relatório HTML
npx playwright show-report
```

### Pré-requisitos

1. **Servidor local rodando**: `npm run serve` (porta 8000)
2. **XML real disponível**: `/fixtures/real-xml/2518173187.xml`
3. **Playwright instalado**: `npx playwright install`

## Critérios de Sucesso

### ✅ Logs Limpos (OBRIGATÓRIO)

```javascript
// ❌ NUNCA deve aparecer
console.error('Valor não encontrado, usando padrão');
console.warn('Fallback aplicado para campo X');

// ✅ CORRETO
if (!valor) {
    throw new Error('Valor obrigatório não fornecido');
}
```

### ✅ Processamento XML Real

- Upload bem-sucedido de XML real 2518173187.xml
- Dados extraídos corretamente (importador GO, incoterm CPT, NCM 29420000)
- Cálculos sem valores inválidos (NaN, undefined, null)
- Navegação completa pelos 4 steps

### ✅ Performance

- Carregamento inicial < 10 segundos
- Processamento XML < 30 segundos
- Interface responsiva em todos os breakpoints

## Debugging

### Console Logs

Os testes capturam automaticamente todos os logs do console. Em caso de falha:

```javascript
// Logs são exportados automaticamente
console.log('Console logs for failed test:', JSON.stringify(logs, null, 2));
```

### Screenshots e Videos

Configurados para capturar apenas em falhas:
- Screenshots: `test-results/`
- Videos: `test-results/`
- Traces: `test-results/`

### Análise de Falhas

1. **Verificar logs exportados** no console
2. **Analisar screenshots** do momento da falha
3. **Revisar trace** para entender sequência de eventos
4. **Validar se servidor está rodando** na porta 8000

## Dados de Teste

### XML Real 2518173187.xml

```xml
<importadorNome>EQUIPLEX INDUSTRIA FARMACEUTICA LTDA -</importadorNome>
<importadorEnderecoUf>GO</importadorEnderecoUf>
<condicaoVendaIncoterm>CPT</condicaoVendaIncoterm>
<dadosMercadoriaCodigoNcm>29420000</dadosMercadoriaCodigoNcm>
```

**Valores Esperados**:
- Taxa de câmbio calculada: ~5.39 (BRL/USD)
- Peso líquido: 20kg
- Valor FOB: USD 893.64
- Valor CIF: BRL 4.819,22

## Próximas Fases

- **Fase 2**: Testes de incentivos fiscais de entrada
- **Fase 3**: Testes de incentivos fiscais de saída  
- **Fase 4**: Testes de dashboard e analytics
- **Fase 5**: Testes de regimes tributários expandidos
- **Fase 6**: Testes de integração final

---

*Documentação atualizada para refletir migração completa para IndexedDB e remoção da DataMigration*