# Especificação Técnica e Workflow
## Sistema de Importação e Precificação Expertzy

---

### 1. Arquitetura Técnica Detalhada

#### 1.1 Stack Tecnológico

**Backend PHP (Versão 7.4+)**
O sistema utiliza PHP puro com arquitetura MVC simplificada, evitando frameworks pesados que possam comprometer a performance em ambiente compartilhado. A estrutura modular permite escalabilidade gradual e facilita manutenção.

**Bibliotecas Essenciais:**
- **XMLReader/DOMDocument:** Para processamento de XMLs de DI
- **PhpSpreadsheet:** Para geração de arquivos Excel e leitura de templates
- **TCPDF/mPDF:** Para geração de relatórios em PDF
- **SimpleXML:** Para validação e extração de dados XML

**Frontend Responsivo:**
- **HTML5/CSS3:** Interface responsiva com Bootstrap 4.x
- **JavaScript ES6:** Funcionalidades interativas e AJAX
- **jQuery 3.x:** Manipulação DOM e componentes visuais

#### 1.2 Estrutura de Diretórios

```
/sistema-expertzy/
├── /config/
│   ├── database.php         # Configurações opcionais de BD
│   ├── app_config.php       # Configurações gerais
│   └── tributos.json        # Base de alíquotas tributárias
├── /core/
│   ├── /models/
│   │   ├── DiProcessor.php  # Processamento de DI
│   │   ├── TributaryCalculator.php # Cálculos tributários
│   │   ├── PricingEngine.php # Engine de precificação
│   │   └── ReportGenerator.php # Geração de relatórios
│   ├── /controllers/
│   │   ├── ImportController.php # Controle de importação
│   │   ├── AnalysisController.php # Análise de dados
│   │   └── PricingController.php # Precificação
│   └── /services/
│       ├── XmlParser.php    # Parser de XML
│       ├── CostManager.php  # Gestão de custos
│       └── TaxService.php   # Serviços tributários
├── /views/
│   ├── /templates/          # Templates HTML
│   ├── /components/         # Componentes reutilizáveis
│   └── /assets/            # CSS, JS, imagens
├── /data/
│   ├── /uploads/           # XMLs importados
│   ├── /sessions/          # Dados de sessão
│   ├── /templates/         # Templates Excel/PDF
│   └── /exports/           # Arquivos gerados
├── /database/              # Scripts SQL opcionais
└── index.php              # Entrada principal
```

### 2. Workflow Operacional Detalhado

#### 2.1 Fase 1: Importação e Validação

**Etapa 1.1 - Upload de XML**
O usuário acessa a interface principal e realiza upload do arquivo XML da DI através de componente drag-and-drop. O sistema valida o formato, tamanho e estrutura do arquivo antes de prosseguir.

**Etapa 1.2 - Processamento Inicial**
O parser XML extrai automaticamente todas as informações da DI, incluindo dados do importador, adições, produtos, classificações fiscais, valores FOB/CFR, pesos e quantidades. O sistema organiza os dados em estrutura hierárquica para análise.

**Etapa 1.3 - Validação de Dados**
Verificação automática de consistência dos dados extraídos, validação de NCMs, conferência de somatórias e identificação de possíveis inconsistências que necessitem intervenção manual.

#### 2.2 Fase 2: Configuração de Custos

**Etapa 2.1 - Despesas Extra-DI**
Interface para inclusão de despesas adicionais organizadas por categoria: portuárias (capatazia, armazenagem), bancárias (câmbio, remessas), logísticas (frete interno, seguro) e administrativas (despachante, honorários).

**Etapa 2.2 - Rateio de Custos**
Sistema automatizado de rateio proporcional de despesas entre adições, baseado em critérios configuráveis: valor FOB, peso líquido, peso bruto ou quantidade. O usuário pode ajustar manualmente quando necessário.

**Etapa 2.3 - Composição ICMS**
Definição de quais despesas integrarão a base de cálculo do ICMS, considerando a legislação específica de cada estado e as estratégias tributárias da empresa.

#### 2.3 Fase 3: Cálculos Tributários

**Etapa 3.1 - Base de Cálculo**
Determinação automática das bases de cálculo para cada tributo, considerando valor aduaneiro, agregação de fretes e seguros, e despesas acessórias conforme legislação.

**Etapa 3.2 - Aplicação de Alíquotas**
Consulta automática à base de dados tributários para aplicação das alíquotas corretas de II, IPI, PIS/COFINS e ICMS, considerando regimes especiais e reduções aplicáveis.

**Etapa 3.3 - Cálculo de Tributos**
Execução sequencial dos cálculos tributários respeitando a ordem de incidência e interdependência entre os tributos, incluindo tratamento de direitos antidumping quando aplicável.

#### 2.4 Fase 4: Análise e Visualização

**Etapa 4.1 - Apresentação Tabular**
Exibição dos resultados em tabela expansível multi-nível, permitindo navegação entre visão geral da DI, detalhamento por adição e análise granular por item.

**Etapa 4.2 - Análise de Custos**
Interface de análise comparativa mostrando composição percentual de custos, impacto tributário por categoria e oportunidades de otimização fiscal.

**Etapa 4.3 - Simulações**
Funcionalidade de simulação para análise de cenários alternativos, permitindo modificar parâmetros como regime tributário, estado de destino e margens comerciais.

#### 2.5 Fase 5: Precificação Estratégica

**Etapa 5.1 - Configuração de Clientes**
Definição de perfis de cliente (consumidor final, revenda, indústria) com parâmetros específicos como regime tributário, estado de localização e margens pretendidas.

**Etapa 5.2 - Cálculo de Preços**
Engine de precificação que considera custo total de importação, tributos de saída (ICMS, PIS/COFINS), benefícios fiscais estaduais e margens comerciais definidas.

**Etapa 5.3 - Análise Competitiva**
Comparação automática entre diferentes cenários de precificação, considerando impactos da substituição tributária e benefícios fiscais por estado.

### 3. Módulos Funcionais Específicos

#### 3.1 Módulo de Processamento XML

**Classe DiProcessor**
```php
class DiProcessor {
    private $xmlData;
    private $additions = [];
    private $generalInfo = [];
    
    public function parseXml($xmlFile) {
        // Validação e extração de dados da DI
        // Organização hierárquica das informações
        // Validação de consistência
    }
    
    public function extractAdditions() {
        // Extração de adições com produtos
        // Classificação por NCM
        // Cálculo de ratios e proporções
    }
    
    public function validateData() {
        // Verificação de integridade
        // Identificação de inconsistências
        // Sugestões de correção
    }
}
```

#### 3.2 Módulo de Cálculos Tributários

**Classe TributaryCalculator**
```php
class TributaryCalculator {
    private $taxRates;
    private $calculations = [];
    
    public function calculateImportTaxes($addition) {
        // Cálculo de II, IPI, PIS/COFINS
        // Aplicação de regimes especiais
        // Tratamento de antidumping
    }
    
    public function calculateICMS($state, $addition) {
        // ICMS normal e substituição tributária
        // Benefícios fiscais estaduais
        // Reduções de base
    }
    
    public function applyStateBenefits($state, $ncm) {
        // Benefícios específicos por estado
        // Condições de elegibilidade
        // Cálculo de economia fiscal
    }
}
```

#### 3.3 Módulo de Precificação

**Classe PricingEngine**
```php
class PricingEngine {
    private $costStructure;
    private $clientProfiles;
    
    public function calculateSalePrice($item, $clientType, $state) {
        // Composição de custo total
        // Aplicação de margens
        // Cálculo de tributos de saída
    }
    
    public function simulateScenarios($parameters) {
        // Múltiplos cenários de precificação
        // Análise de sensibilidade
        // Otimização de margens
    }
    
    public function compareStates($item, $states) {
        // Comparativo entre estados
        // Vantagens competitivas
        // Recomendações estratégicas
    }
}
```

### 4. Interface de Usuário

#### 4.1 Dashboard Principal

**Componentes Visuais:**
- **Card de Status:** Informações da DI processada (número, data, URF, situação)
- **Resumo Financeiro:** Valor total, tributos, custo final por item
- **Indicadores Gráficos:** Composição percentual de custos e tributos
- **Ações Rápidas:** Botões para exportação, nova análise e configurações

#### 4.2 Tabela de Resultados Expansível

**Estrutura Hierárquica:**
```javascript
// Exemplo de estrutura de dados para tabela expansível
const tableStructure = {
    level1: "DI Geral",
    level2: "Adições",
    level3: "Itens por Adição",
    columns: [
        "adição", "item", "produto", "ncm", "peso", 
        "quantidade", "cfr_unit", "cfr_total", "custos_extras",
        "base_icms", "ii", "ipi", "pis", "cofins", "icms",
        "custo_total", "custo_unitario"
    ]
};
```

#### 4.3 Configurador de Despesas

**Interface Responsiva:**
- **Seções Categorizadas:** Portuárias, Bancárias, Logísticas, Administrativas
- **Cálculo Automático:** Rateio proporcional em tempo real
- **Templates Salvos:** Configurações reutilizáveis por tipo de operação
- **Validação Dinâmica:** Verificação de valores e percentuais

### 5. Sistema de Relatórios

#### 5.1 Espelho da DI

**Características:**
- Formatação oficial compatível com padrões da Receita Federal
- Detalhamento completo de custos e tributos por adição
- Assinatura digital e watermark da Expertzy
- Exportação em PDF e Excel

#### 5.2 Croqui de Nota Fiscal

**Componentes:**
- Layout padronizado para entrada de mercadorias
- Detalhamento de produtos com NCM e valores
- Bases de cálculo e tributos destacados
- Formatação preparada para emissão de NFe

#### 5.3 Relatório de Precificação

**Análises Incluídas:**
- Comparativo multi-cliente e multi-estado
- Análise de sensibilidade de margens
- Recomendações estratégicas por produto
- Projeções de rentabilidade

### 6. Configurações Avançadas

#### 6.1 Base de Dados Tributários

**Estrutura JSON:**
```json
{
    "ncm_rates": {
        "84099118": {
            "ii": 0.16,
            "ipi": 0.0325,
            "pis": 0.0312,
            "cofins": 0.1437,
            "icms_states": {
                "GO": {"rate": 0.17, "benefits": true},
                "SC": {"rate": 0.17, "benefits": false},
                "MG": {"rate": 0.18, "benefits": true}
            }
        }
    },
    "state_benefits": {
        "GO": {
            "prodepe": {"eligible_ncms": [], "reduction": 0.75},
            "industrial": {"icms_reduction": 0.30}
        }
    }
}
```

#### 6.2 Templates Personalizáveis

**Configurações por Cliente:**
- Layouts de relatório customizados
- Parâmetros de cálculo específicos
- Margens padrão por categoria de produto
- Critérios de rateio preferenciais

### 7. Performance e Otimização

#### 7.1 Estratégias de Cache

**Cache de Sessão:**
- Dados processados mantidos em memória durante a sessão
- Evita reprocessamento desnecessário
- Cleanup automático após timeout

**Cache de Alíquotas:**
- Base tributária carregada uma vez por dia
- Atualização automática via webservice quando disponível
- Fallback para dados locais em caso de indisponibilidade

#### 7.2 Otimização para Ambiente Compartilhado

**Gestão de Recursos:**
- Processamento assíncrono para arquivos grandes
- Limitação de tempo de execução por operação
- Cleanup automático de arquivos temporários

**Monitoramento:**
- Log de performance das operações principais
- Alertas para operações que excedam limites
- Estatísticas de uso por funcionalidade

### 8. Segurança e Compliance

#### 8.1 Proteção de Dados

**Validação de Entrada:**
- Sanitização rigorosa de uploads
- Validação de estrutura XML contra XSD
- Prevenção de ataques de injeção

**Gestão de Arquivos:**
- Isolamento de uploads em diretório protegido
- Remoção automática após processamento
- Controle de extensões permitidas

#### 8.2 Auditoria

**Log de Operações:**
- Registro de todas as importações processadas
- Histórico de modificações em configurações
- Rastreabilidade de cálculos realizados

**Backup de Configurações:**
- Versionamento de templates e configurações
- Recuperação automática em caso de erro
- Sincronização com repositório externo quando disponível

### 9. Plano de Implementação

#### 9.1 Sprint 1 (4 semanas)
**Módulo Core de Processamento**
- Parser XML para DI
- Estrutura básica de dados
- Interface de upload
- Validação inicial de dados

#### 9.2 Sprint 2 (3 semanas)
**Cálculos Tributários**
- Engine de cálculo de tributos
- Base de dados de alíquotas
- Interface de configuração de custos
- Rateio automático de despesas

#### 9.3 Sprint 3 (3 semanas)
**Interface de Análise**
- Tabela expansível de resultados
- Dashboards informativos
- Funcionalidades de simulação
- Exportação básica (Excel)

#### 9.4 Sprint 4 (4 semanas)
**Sistema de Precificação**
- Engine de precificação multi-cliente
- Análise por estado
- Benefícios fiscais
- Relatórios de precificação

#### 9.5 Sprint 5 (2 semanas)
**Relatórios e Finalização**
- Geração de PDFs
- Croqui de nota fiscal
- Refinamentos de interface
- Testes finais e documentação

### 10. Manutenção e Evolução

#### 10.1 Atualizações Regulares

**Base Tributária:**
- Atualização mensal de alíquotas
- Incorporação de mudanças legislativas
- Validação com especialistas tributários

**Funcionalidades:**
- Melhorias baseadas em feedback dos usuários
- Otimizações de performance
- Novas funcionalidades de análise

#### 10.2 Suporte Técnico

**Documentação:**
- Manual completo do usuário
- Guia de configuração avançada
- FAQ com casos comuns

**Canais de Suporte:**
- Sistema de tickets integrado
- Chat de suporte em horário comercial
- Base de conhecimento online

---

*© 2025 Expertzy Inteligência Tributária*