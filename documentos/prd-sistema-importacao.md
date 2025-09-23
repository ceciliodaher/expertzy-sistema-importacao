# Product Requirements Document
## Sistema de Importação e Precificação Expertzy

---

### 1. Visão Geral do Produto

O Sistema de Importação e Precificação da Expertzy constitui uma solução web integrada para processamento de Declarações de Importação (DI) e cálculo de custos de mercadorias importadas. O sistema visa automatizar o processo de análise tributária e precificação, oferecendo suporte completo desde a importação do XML da DI até a definição de preços de venda para diferentes categorias de clientes.

A arquitetura proposta prioriza simplicidade e eficiência, considerando as limitações de infraestrutura disponível, especificamente o ambiente de hospedagem compartilhada em PHP. O sistema será desenvolvido com foco na usabilidade e precisão dos cálculos tributários, atendendo às necessidades específicas de consultores tributários e empresas importadoras.

### 2. Objetivos do Sistema

O sistema busca centralizar e automatizar os processos de análise de importação, eliminando a necessidade de planilhas manuais e reduzindo significativamente o tempo de processamento de informações. A solução deve proporcionar maior precisão nos cálculos tributários e facilitar a tomada de decisões estratégicas relacionadas à precificação de produtos importados.

A implementação visa atender especificamente às demandas de profissionais que lidam com complexidades tributárias de importação, oferecendo ferramentas robustas para análise de custos e definição de estratégias de preços adequadas aos diferentes regimes tributários brasileiros.

### 3. Funcionalidades Principais

#### 3.1 Módulo de Importação de DI

O módulo principal responsabiliza-se pela importação e processamento de arquivos XML de Declarações de Importação. O sistema deve realizar a leitura automatizada do XML, extraindo informações essenciais como dados das adições, produtos, classificação fiscal (NCM), pesos, quantidades e valores FOB.

O processamento inclui a validação da estrutura do XML, verificação de integridade dos dados e organização das informações em formato estruturado para posterior análise. O sistema deve suportar diferentes versões de layout de DI, garantindo compatibilidade com as variações encontradas na prática.

#### 3.2 Gestão de Despesas Extra-DI

Esta funcionalidade permite ao usuário incluir despesas adicionais não contempladas diretamente na DI, mas que compõem o custo final da mercadoria. O sistema deve solicitar informações sobre despesas como armazenagem, movimentação portuária, despesas bancárias e outros custos incorridos no processo de nacionalização.

A interface deve permitir a configuração de quais despesas serão incluídas na base de cálculo do ICMS, oferecendo flexibilidade para diferentes estratégias tributárias. O sistema deve manter histórico dessas configurações para facilitar operações futuras similares.

#### 3.3 Apresentação e Análise de Dados

<<<<<<< HEAD
O sistema apresenta os dados processados em formato de tabela expansível, organizando as informações conforme estrutura real das DIs brasileiras. Baseando-se no exemplo da DI 2300120746, a interface exibe:

**Nível 1 - Dados Gerais:**
- Número da DI, data de registro, URF de despacho
- Importador: WPX IMPORTACAO E EXPORTACAO DE PECAS LTDA
- Situação: ENTREGA NAO AUTORIZADA
- Total de adições: 16

**Nível 2 - Resumo por Adição:**
- Adição 001: NCM 73181500 (Parafusos)
- Peso líquido: 213.480 kg
- Valor FOB: USD 6.346,13 / R$ 33.112,20
- Tributos: II R$ 5.297,95, IPI R$ 2.496,74

**Nível 3 - Detalhamento por Item:**
- Item 01: PARAFUSO PHILIPS 5X16 PARA MOTOCICLETA
- Quantidade: 1.000 caixas
- Valor unitário: USD 53,125
- Fabricante: JINKAIDA AUTO MOTOR PARTS CO.,LTD

A interface permite navegação intuitiva entre diferentes níveis de detalhamento, facilitando a análise granular dos custos reais extraídos da DI.
=======
O sistema apresenta os dados processados em formato de tabela expansível, organizando as informações por adição e item. A estrutura de apresentação inclui dados detalhados como NCM, pesos por adição e item, unidades de medida, quantidades por caixa, valores CFR unitários e totais, além de informações sobre incidência de capatazia.

A interface permite navegação intuitiva entre diferentes níveis de detalhamento, facilitando a análise granular dos custos e a identificação de oportunidades de otimização tributária.
>>>>>>> 7d3bba78094df4422d2bd74265553fe6ba0e419b

#### 3.4 Cálculos Tributários Automatizados

O sistema executa automaticamente os cálculos de todos os tributos incidentes na importação, incluindo Imposto de Importação (II), Imposto sobre Produtos Industrializados (IPI), Programa de Integração Social (PIS), Contribuição para o Financiamento da Seguridade Social (COFINS) e Imposto sobre Circulação de Mercadorias e Serviços (ICMS).

<<<<<<< HEAD
Os cálculos consideram as alíquotas reais de ICMS por estado conforme legislação 2025, incluindo:
- Alíquotas internas específicas por UF (variando de 17% a 23%)
- FCP (Fundo de Combate à Pobreza) conforme regras específicas por estado
- Aplicação da regra de limite mínimo para FCP (entre X e Y = usar X; até X = usar zero)
- Campos editáveis de alíquotas por item individual
- Alíquotas diferenciadas para produtos específicos
- Regimes especiais e reduções de base de cálculo
- Direitos antidumping quando aplicáveis

#### 3.5 Sistema de Precificação Avançado com Benefícios Fiscais Reais

O módulo de precificação oferece cálculo automatizado considerando os benefícios fiscais reais dos estados:

**Goiás (COMEXPRODUZIR):**
- Crédito outorgado de 65% em operações interestaduais
- Alíquota efetiva de 4% para vendas internas
- Contrapartidas: 5% FUNPRODUZIR + 15% PROTEGE
- Carga tributária efetiva: 1,92% (interestadual) / 4,00% (interna)

**Santa Catarina (TTDs):**
- TTD 409 Fase 1: 2,6% efetivo (primeiros 36 meses)
- TTD 409 Fase 2: 1,0% efetivo (após 36 meses)
- TTD 410: 0,6% efetivo com diferimento integral
- Fundo de Educação: 0,4% sobre operações

**Minas Gerais (Corredor de Importação):**
- Diferimento integral na importação
- Crédito presumido: 2,5% a 3% (com similar nacional)
- Crédito presumido: 2,5% a 5% (sem similar nacional)
- Sem contrapartidas financeiras

**Outros Estados:**
- Rondônia: Crédito presumido 85% (carga efetiva 0,6%)
- Espírito Santo: INVEST-ES com redução 75% + taxa 0,5%
- Alagoas: Compensação via precatórios (economia até 90%)
- Mato Grosso: Diferimento total

O sistema permite simulações comparativas entre estados, considerando todas as contrapartidas e condicionantes específicas.

#### 3.6 Sistema de Campos Editáveis por Item

O sistema permite edição granular de parâmetros tributários por item individual:

**Alíquotas ICMS Editáveis:**
- Alíquota interna por estado (respeitando limites legais)
- Alíquota interestadual específica
- Percentual de redução de base de cálculo
- Alíquota reduzida resultante

**FCP (Fundo de Combate à Pobreza) Editável:**
- Alíquota editável por item respeitando limites por estado
- Aplicação da regra de limite mínimo automática
- Estados sem FCP: campos desabilitados
- Validação em tempo real dos limites estaduais

**Substituição Tributária por Item:**
- Checkbox editável para aplicação de ST
- MVA (Margem de Valor Agregado) editável
- Base de cálculo de ST ajustável
- Valor de ST calculado automaticamente

**Benefícios Fiscais Específicos:**
- Dropdown de seleção de benefício aplicável
- Parâmetros editáveis conforme programa selecionado
- Cálculo automático de contrapartidas
- Validação de elegibilidade por NCM/estado

#### 3.7 Exportação e Relatórios

O sistema disponibiliza funcionalidades de exportação em formatos Excel e PDF, permitindo a geração do espelho da DI e croqui da nota fiscal. Os relatórios mantêm formatação profissional consistente com o padrão Expertzy.

A exportação inclui todas as informações processadas da DI real, cálculos realizados com alíquotas corretas por estado, análises de benefícios fiscais aplicáveis e simulações de precificação geradas, proporcionando documentação completa para fins de auditoria e apresentação a clientes.

Os relatórios incorporam dados extraídos do campo `<informacaoComplementar>` formatados adequadamente, incluindo responsáveis legais, detalhes de containers e informações logísticas essenciais.
=======
Os cálculos consideram as diferentes alíquotas aplicáveis, regimes especiais, reduções de base de cálculo e eventuais direitos antidumping. O sistema deve manter base atualizada de alíquotas e permitir ajustes manuais quando necessário.

#### 3.5 Sistema de Precificação Avançado

O módulo de precificação oferece cálculo automatizado de preços de venda considerando diferentes perfis de clientes: consumidor final, revenda e indústria. O sistema contempla os diversos regimes tributários brasileiros, incluindo Lucro Real, Lucro Presumido e Simples Nacional.

A funcionalidade inclui análise específica para ICMS normal e substituição tributária, considerando os benefícios fiscais disponíveis nos estados de Goiás, Santa Catarina, Minas Gerais e Espírito Santo. O sistema deve permitir simulações de cenários e comparação de resultados.

#### 3.6 Exportação e Relatórios

O sistema disponibiliza funcionalidades de exportação em formatos Excel e PDF, permitindo a geração do espelho da DI e croqui da nota fiscal. Os relatórios devem manter formatação profissional consistente com o padrão Expertzy.

A exportação deve incluir todas as informações processadas, cálculos realizados e análises geradas, proporcionando documentação completa para fins de auditoria e apresentação a clientes.
>>>>>>> 7d3bba78094df4422d2bd74265553fe6ba0e419b

#### 3.7 Dashboard de Estatísticas e Análise Pós-Importação

Sistema visual dinâmico para análise completa dos dados importados, preparado para expansão futura com cálculos avançados de custos e análises preditivas.

**Estrutura em 3 Camadas:**

##### **Camada 1: Dados Extraídos (Implementada)**
Apresentação visual de todos os dados extraídos do XML e salvos no banco:
- **Estatísticas por DI**: numero_di, data_registro, importador (nome/CNPJ/UF)
- **Valores totalizados**: valor_reais, valor_moeda_negociacao
- **Taxa de câmbio calculada**: valor_reais ÷ valor_moeda_negociacao (NUNCA hardcoded)
- **Totais agregados**: total_adicoes, total de mercadorias
- **Tributos extraídos**: ii_valor_devido, ipi_valor_devido, pis_valor_devido, cofins_valor_devido
- **Frete e Seguro**: frete_valor_reais, seguro_valor_reais, frete_valor_moeda_negociada, seguro_valor_moeda_negociada

##### **Camada 2: Cálculos Dinâmicos (Preparada para Implementação)**
Sistema preparado para receber cálculos futuros:
- **Despesas extras configuráveis**: armazenagem, transporte_interno, despachante
- **Classificação tributária**: despesas tributáveis ICMS vs apenas custeio
- **Rateio proporcional**: distribuição de despesas por adição/item
- **Base ICMS recalculada**: inclusão de despesas tributáveis
- **Custo por item individual**: valor CIF + despesas + tributos

##### **Camada 3: Análises Preditivas (Infraestrutura Futura)**
Dashboard preparado para expansões analíticas:
- **Simulador de cenários**: comparação entre estados
- **Análise de regimes**: Lucro Real vs Presumido vs Simples Nacional
- **Score de competitividade**: índice 0-100 por estado
- **Indicadores financeiros**: ROI, break-even, margem ideal

**Regras Críticas de Implementação:**
- **PROIBIDO fallbacks em dados obrigatórios**: Sempre throw Error se dados críticos faltarem
- **Taxa câmbio SEMPRE calculada**: Nunca extraída ou hardcoded
- **Despesas extras OPCIONAIS**: Podem ter default 0
- **Nomenclatura convergente**: Usar EXATAMENTE os nomes do sistema (numero_di, valor_reais, etc.)
- **Validação rigorosa**: Verificar integridade antes de cálculos

### 4. Especificações Técnicas

#### 4.1 Arquitetura do Sistema

Considerando as limitações de infraestrutura, o sistema será desenvolvido utilizando arquitetura web simples baseada em PHP puro, sem frameworks complexos que possam comprometer a performance em ambiente compartilhado. A estrutura seguirá o padrão Model-View-Controller (MVC) simplificado, garantindo organização do código e facilidade de manutenção.

O sistema utilizará predominantemente armazenamento em arquivos para dados temporários e sessões, minimizando a dependência de banco de dados e reduzindo a complexidade de deployment em ambientes compartilhados.

<<<<<<< HEAD
#### 4.1.1 Extração Completa de Dados XML

O sistema extrairá TODOS os dados disponíveis no XML da DI, incluindo:
- Informações complementares completas (campo `<informacaoComplementar>`)
- Dados de pagamentos realizados (seção `<pagamento>`)
- Taxa SISCOMEX extraída automaticamente
- Valores de AFRMM identificados
- Dados de capatazia e despesas portuárias
- Taxas de câmbio específicas por operação
- Responsáveis legais autorizados
- Detalhes de containers e transporte
- Dados completos de fabricantes e fornecedores

=======
>>>>>>> 7d3bba78094df4422d2bd74265553fe6ba0e419b
#### 4.2 Tecnologias Utilizadas

**Backend:** PHP 7.4+ com suporte a XML parsing e manipulação de arrays multidimensionais para processamento dos dados da DI. Utilização de bibliotecas nativas para leitura de XML e geração de arquivos Excel.

**Frontend:** HTML5, CSS3 e JavaScript vanilla para interface responsiva e interativa. Implementação de componentes de tabela expansível utilizando técnicas de DOM manipulation sem dependência de frameworks externos.

**Armazenamento:** Sistema híbrido utilizando arquivos JSON para configurações e dados temporários, com opção de integração com banco de dados MySQL simples para empresas que desejarem persistência de dados históricos.

#### 4.3 Estrutura de Arquivos

O sistema será organizado em estrutura modular, facilitando manutenção e evolução. A organização contempla separação clara entre lógica de negócio, interface de usuário e recursos estáticos.

```
/sistema-importacao/
├── /core/
│   ├── /models/          # Classes para processamento de DI e cálculos
│   ├── /controllers/     # Controladores das funcionalidades
│   └── /services/        # Serviços de negócio e utilitários
├── /views/               # Templates e interfaces
├── /assets/              # CSS, JavaScript e imagens
├── /uploads/             # Diretório para XMLs importados
├── /exports/             # Arquivos gerados para download
├── /config/              # Configurações do sistema
└── index.php             # Ponto de entrada principal
```

#### 4.4 Padrões de Desenvolvimento e Qualidade

##### 4.4.1 Política Zero Fallbacks (OBRIGATÓRIA)

O sistema deve falhar explicitamente quando dados obrigatórios estiverem ausentes, garantindo integridade e confiabilidade dos cálculos tributários.

**❌ PROIBIDO em módulos fiscais:**
```javascript
const valor = adicao.valor_reais || 0; // NUNCA fazer isso
const ncm = adicao.ncm || "00000000"; // PROIBIDO
```

**✅ OBRIGATÓRIO:**
```javascript
const valor = adicao.valor_reais;
if (valor === undefined || valor === null) {
    throw new Error(`Valor reais obrigatório ausente na adição ${adicao.numero_adicao}`);
}

const ncm = adicao.ncm;
if (!ncm) {
    throw new Error(`NCM obrigatório ausente na adição ${adicao.numero_adicao}`);
}
```

##### 4.4.2 Dados Dinâmicos (SEM HARDCODE)

Todos os valores devem ser calculados dinamicamente a partir dos dados reais, nunca usando valores fixos no código.

**❌ PROIBIDO:**
```javascript
const taxaCambio = 5.20; // NUNCA hardcode
const aliquotaICMS = 18; // PROIBIDO valores fixos
```

**✅ OBRIGATÓRIO:**
```javascript
// Taxa de câmbio SEMPRE calculada
const taxaCambio = totalReais / totalMoedaEstrangeira;
if (!isFinite(taxaCambio) || taxaCambio <= 0) {
    throw new Error('Taxa de câmbio inválida - verificar valores da DI');
}

// Alíquotas sempre de configuração ou banco
const aliquotaICMS = obterAliquotaICMS(estado);
if (!aliquotaICMS) {
    throw new Error(`Alíquota ICMS não configurada para o estado ${estado}`);
}
```

##### 4.4.3 Tratamento de Despesas Opcionais

Despesas extras são opcionais e podem ter valores padrão, diferentemente dos dados obrigatórios da DI.

```javascript
// Despesas extras PODEM ter fallback
const armazenagem = despesasExtras?.armazenagem || 0; // OK
const transporte = despesasExtras?.transporte_interno || 0; // OK

// Mas despesas da DI são obrigatórias
const siscomex = despesas.siscomex;
if (siscomex === undefined) {
    throw new Error('Taxa SISCOMEX não encontrada na DI');
}
```

### 5. Workflow Operacional

#### 5.1 Processo de Importação

<<<<<<< HEAD
O fluxo operacional inicia-se com o upload do arquivo XML da DI através de interface web segura. O sistema valida o arquivo, verifica sua estrutura conforme schema oficial da Receita Federal e extrai automaticamente TODAS as informações disponíveis, incluindo:

- Dados gerais da DI (número, data, URF, modalidade, situação)
- Informações completas do importador e representantes legais
- Dados detalhados por adição (NCM, valores, pesos, tributos)
- Produtos individuais com descrições completas
- Informações de transporte e logística
- Valores de frete, seguro e despesas acessórias
- Taxa SISCOMEX e AFRMM extraídos automaticamente
- Dados de pagamentos realizados por código de receita
- Informações complementares parseadas (responsáveis, containers, etc.)
- Taxas de câmbio específicas por operação

Após o processamento inicial, o sistema valida a consistência matemática dos valores, verifica a coerência entre somatórias e identifica automaticamente despesas que devem ser incluídas no cálculo de custos.
=======
O fluxo operacional inicia-se com o upload do arquivo XML da DI através de interface web segura. O sistema valida o arquivo, verifica sua estrutura e extrai automaticamente todas as informações relevantes. Após o processamento inicial, o usuário é direcionado para a tela de configuração de despesas extra-DI.

Na etapa de configuração, o sistema apresenta formulário intuitivo para inclusão de despesas adicionais, permitindo especificar valores, natureza da despesa e se deve compor a base de cálculo do ICMS. O usuário pode salvar configurações como templates para uso futuro.
>>>>>>> 7d3bba78094df4422d2bd74265553fe6ba0e419b

#### 5.2 Análise e Cálculos

Concluída a configuração de despesas, o sistema executa automaticamente todos os cálculos tributários, apresentando resultados em interface tabular expansível. O usuário pode navegar entre diferentes níveis de detalhamento, analisar custos por item e verificar a composição dos valores.

O sistema oferece funcionalidades de simulação, permitindo alterações em parâmetros específicos e recálculo automático dos resultados. Esta funcionalidade é especialmente útil para análise de cenários e otimização tributária.

#### 5.3 Precificação e Finalização

Após validação dos cálculos de importação, o usuário acessa o módulo de precificação, onde define margens de lucro, regime tributário aplicável e tipo de cliente. O sistema calcula automaticamente os preços sugeridos, considerando todos os fatores tributários e comerciais configurados.

O processo finaliza com a geração de relatórios e exportação dos dados em formatos adequados para arquivo ou apresentação a clientes.

### 6. Interface de Usuário

#### 6.1 Design e Usabilidade

A interface seguirá os padrões visuais da Expertzy, priorizando clareza e funcionalidade. O design responsivo garantirá adequada visualização em diferentes dispositivos, mantendo foco na experiência desktop dada a natureza analítica do sistema.

A navegação será intuitiva, com breadcrumbs claros e indicadores de progresso nas operações de processamento. O sistema incluirá tooltips explicativos e help contextual para facilitar a utilização por usuários menos experientes.

#### 6.2 Componentes Principais

**Dashboard Principal:** Visão geral das DIs processadas recentemente, atalhos para funções principais e indicadores de status do sistema.

**Interface de Upload:** Área de drag-and-drop para XMLs com validação em tempo real e feedback visual do progresso de processamento.

**Tabela de Resultados:** Componente expansível com capacidade de drill-down nos dados, filtros dinâmicos e recursos de ordenação.

**Configurador de Despesas:** Formulário responsivo com validação de dados e capacidade de salvar templates personalizados.

**Módulo de Precificação:** Interface de simulação com sliders para margens, seletores de regime tributário e comparativos visuais de cenários.

### 7. Considerações de Segurança

#### 7.1 Proteção de Dados

O sistema implementará medidas de segurança adequadas ao ambiente de hospedagem compartilhada, incluindo validação rigorosa de uploads, sanitização de dados de entrada e proteção contra ataques comuns como XSS e SQL injection.

Os arquivos temporários serão automaticamente removidos após processamento, e dados sensíveis serão tratados com criptografia adequada quando necessário armazenamento temporário.

#### 7.2 Controle de Acesso

Sistema simples de autenticação baseado em sessões PHP, com diferentes níveis de acesso conforme perfil do usuário. Implementação de timeout automático e log de atividades críticas.

### 8. Implementação e Deploy

#### 8.1 Fases de Desenvolvimento

**Fase 1:** Desenvolvimento do módulo de importação e processamento de XML, incluindo validação e extração de dados básicos.

**Fase 2:** Implementação dos cálculos tributários e interface de apresentação de resultados.

**Fase 3:** Desenvolvimento do sistema de precificação e funcionalidades de simulação.

**Fase 4:** Implementação de exportação, relatórios e refinamentos de interface.

#### 8.2 Testes e Validação

Cada fase incluirá testes rigorosos com dados reais de DIs, validação de cálculos através de conferência manual e testes de usabilidade com usuários finais.

O sistema será testado em diferentes ambientes de hospedagem compartilhada para garantir compatibilidade e performance adequada.

### 9. Manutenção e Evolução

#### 9.1 Atualizações Tributárias

O sistema será estruturado para facilitar atualizações de alíquotas e regras tributárias, com arquivos de configuração separados e procedimentos documentados para modificações.

<<<<<<< HEAD
#### 9.2 Considerações Finais sobre Precisão dos Dados

O sistema foi especificado com base em dados reais extraídos da DI 2300120746 e incorpora as alíquotas oficiais de ICMS por estado vigentes em 2025, incluindo as recentes alterações no Maranhão (23%), Piauí (22,5%) e Rio Grande do Norte (20%).

A implementação considera as regras específicas do FCP por estado, aplicando corretamente os limites mínimos conforme orientação técnica: para faixas "entre X e Y", utilizar X; para limites "até X", utilizar zero.

Os benefícios fiscais incorporados refletem os programas reais de incentivo à importação, com cálculos precisos de contrapartidas e condicionantes específicas de cada estado, baseados na documentação oficial fornecida.

#### 9.3 Suporte e Documentação

Desenvolvimento de documentação técnica completa e manual do usuário, além de sistema de suporte integrado para resolução de dúvidas e problemas operacionais.

A documentação incluirá guias específicos sobre:
- Configuração de alíquotas por estado
- Aplicação correta de benefícios fiscais
- Interpretação de dados extraídos do XML
- Procedimentos de validação e auditoria
- Troubleshooting de cálculos complexos

=======
#### 9.2 Suporte e Documentação

Desenvolvimento de documentação técnica completa e manual do usuário, além de sistema de suporte integrado para resolução de dúvidas e problemas operacionais.

>>>>>>> 7d3bba78094df4422d2bd74265553fe6ba0e419b
---

*© 2025 Expertzy Inteligência Tributária*