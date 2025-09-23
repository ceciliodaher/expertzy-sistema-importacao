# Product Requirements Document (PRD)
## Sistema de Importação e Precificação - Expertzy

### Documento Técnico Versão 1.0
**Data:** Agosto 2025  
**Responsável:** Engenharia de Software Expertzy  
**Aprovação:** Professor Cecílio - Consultor Tributário

---

## 1. Visão Geral do Produto

O Sistema de Importação e Precificação da Expertzy representa uma solução tecnológica integrada desenvolvida especificamente para otimizar e automatizar os processos complexos de gestão tributária em operações de importação. O sistema foi concebido para atender às demandas crescentes de empresas que necessitam de precisão absoluta nos cálculos tributários e agilidade na determinação de preços competitivos para diferentes segmentos de mercado.

A plataforma centraliza o processamento de Declarações de Importação (DI), automatiza cálculos tributários complexos e oferece funcionalidades avançadas de precificação que consideram múltiplas variáveis fiscais e regionais. Esta abordagem integrada elimina a necessidade de sistemas dispersos e reduz significativamente a margem de erro em operações críticas para a competitividade empresarial.

O desenvolvimento do sistema baseia-se na experiência consolidada da Expertzy em consultoria tributária e na necessidade identificada no mercado de uma ferramenta que combine precisão técnica com usabilidade intuitiva, permitindo que profissionais de diferentes níveis de especialização possam operar o sistema com eficiência.

## 2. Objetivos Estratégicos

### 2.1 Objetivos Primários

O sistema busca revolucionar a gestão tributária de importações através da automatização completa do fluxo de trabalho, desde a importação inicial dos dados da DI até a geração final dos preços de venda. A plataforma deve reduzir o tempo de processamento das operações em pelo menos 75% comparado aos métodos manuais tradicionais, mantendo simultaneamente um nível de precisão superior a 99,5% nos cálculos tributários.

A integração de funcionalidades de precificação dinâmica permitirá às empresas responder rapidamente às mudanças de mercado e aproveitar oportunidades competitivas. O sistema deve calcular automaticamente preços otimizados para diferentes perfis de clientes e regimes tributários, considerando benefícios fiscais estaduais e federais aplicáveis a cada operação específica.

### 2.2 Objetivos Secundários

A plataforma deve estabelecer um novo padrão de transparência e rastreabilidade em operações de importação, fornecendo documentação completa e auditável de todos os cálculos realizados. Cada etapa do processo deve ser registrada com timestamps e justificativas técnicas, criando um histórico completo que atenda aos mais rigorosos requisitos de conformidade fiscal.

O sistema também deve funcionar como uma ferramenta educativa e de capacitação, oferecendo explicações detalhadas dos cálculos e fundamentos legais aplicados, contribuindo para o desenvolvimento técnico das equipes que o utilizam.

## 3. Análise de Requisitos Funcionais

### 3.1 Módulo de Importação e Processamento de DI

O núcleo do sistema consiste no módulo de importação e processamento de Declarações de Importação, responsável por extrair, validar e estruturar todas as informações contidas nos arquivos XML fornecidos pelo Sistema Integrado de Comércio Exterior (Siscomex). Este módulo deve ser capaz de processar diferentes versões e layouts de XML de DI, adaptando-se automaticamente às mudanças estruturais que possam ocorrer nos formatos oficiais.

O processo de importação inicia-se com a validação da integridade e autenticidade do arquivo XML, verificando assinaturas digitais e checksums quando disponíveis. Após a validação inicial, o sistema extrai dados críticos incluindo informações do importador, detalhes da carga, valores alfandegários, dados de adições e mercadorias, além de informações sobre tributos já calculados pelo Siscomex.

Durante o processamento, o sistema deve identificar automaticamente inconsistências ou dados faltantes, alertando o usuário e solicitando complementação manual quando necessário. Esta funcionalidade é essencial para garantir a integridade dos cálculos subsequentes e evitar erros que possam comprometer a conformidade fiscal da operação.

A estruturação dos dados extraídos segue um modelo padronizado que facilita o acesso e manipulação por outros módulos do sistema. Informações sobre NCM (Nomenclatura Comum do Mercosul), pesos, quantidades, valores unitários e totais são organizadas em formato hierárquico que espelha a estrutura de adições da DI original.

### 3.2 Gestão de Despesas Extra-DI

O sistema incorpora um módulo dedicado ao gerenciamento de despesas complementares que não estão incluídas na DI original mas que impactam significativamente o custo final das mercadorias importadas. Este módulo permite o registro e categorização de despesas como frete interno adicional, seguros complementares, taxas portuárias específicas, custos de desembaraço e outras despesas operacionais.

Cada categoria de despesa extra-DI pode ser configurada para ter tratamento tributário específico, determinando se deve ou não compor a base de cálculo do ICMS na entrada das mercadorias. Esta funcionalidade é crucial para o cumprimento das obrigações fiscais estaduais e para a otimização da carga tributária da operação.

O sistema oferece templates pré-configurados para os tipos mais comuns de despesas extra-DI, baseados na experiência prática da Expertzy, mas mantém flexibilidade total para criação de categorias customizadas conforme necessidades específicas de cada importador. Todas as despesas registradas são documentadas com justificativas e documentos de suporte, mantendo trilha de auditoria completa.

### 3.3 Apresentação e Análise de Dados de Importação

A interface de apresentação de dados constitui um dos elementos mais críticos do sistema, organizando informações complexas de forma intuitiva e permitindo análise rápida e precisa pelos usuários. Os dados são apresentados em formato de tabela expansível que reproduz a estrutura hierárquica das adições da DI, permitindo navegação eficiente entre diferentes níveis de detalhamento.

Cada linha da tabela principal representa uma adição específica, com colunas detalhando informações essenciais: número da adição, código do item, descrição do produto, NCM correspondente, peso da adição total, peso específico do item, unidade de medida, quantidade declarada, quantidade por caixa quando aplicável, valor CFR unitário e total, indicadores de incidência de capatazia, valores de capatazia, frete internacional e seguro.

A expansão de cada linha revela informações tributárias detalhadas, incluindo valor aduaneiro CIF, taxas do Siscomex aplicáveis, despesas de nacionalização para fins de ICMS, alíquotas percentuais de II, IPI, PIS, COFINS e ICMS, informações sobre redução de base quando aplicável, valores absolutos dos tributos calculados, impostos antidumping quando existentes, base de cálculo do ICMS e ICMS devido, culminando no custo total e unitário final de cada item.

Esta apresentação permite aos usuários compreender rapidamente a composição de custos de cada mercadoria e identificar oportunidades de otimização tributária ou correções necessárias nos dados processados.

### 3.4 Geração de Documentos de Saída

O sistema produz automaticamente dois tipos principais de documentos de saída: o espelho da DI e o croqui da nota fiscal de entrada. O espelho da DI constitui um relatório completo e formatado que reproduz de forma organizada e legível todas as informações processadas, servindo como documento de referência para auditorias internas e externas.

O croqui da nota fiscal representa um dos outputs mais valiosos do sistema, fornecendo um layout pré-formatado que especifica exatamente como as mercadorias importadas devem ser escrituradas na nota fiscal de entrada. Este documento inclui valores unitários e totais das mercadorias, bases de cálculo de todos os impostos aplicáveis, valores de ICMS normal e por substituição tributária quando aplicável, e códigos fiscais apropriados para cada situação.

Ambos os documentos podem ser exportados em formatos Excel e PDF, mantendo formatação profissional e permitindo fácil distribuição e arquivo. A geração destes documentos segue templates padronizados da Expertzy, garantindo consistência visual e conformidade com as melhores práticas do mercado.

## 4. Sistema de Precificação Avançada

### 4.1 Arquitetura do Módulo de Precificação

O módulo de precificação representa a evolução natural do processamento da DI, transformando custos de importação em preços competitivos de venda através de algoritmos sofisticados que consideram múltiplas variáveis tributárias e comerciais. A arquitetura deste módulo foi desenvolvida para suportar cenários complexos onde um mesmo produto pode ter preços diferenciados dependendo do perfil do cliente, localização geográfica, regime tributário aplicável e benefícios fiscais disponíveis.

O sistema mantém bases de dados atualizadas com informações tributárias de todos os estados brasileiros, incluindo alíquotas de ICMS por NCM, regras de substituição tributária, reduções de base de cálculo, benefícios fiscais específicos e características do Fundo de Combate à Pobreza (FCP) de cada unidade federativa. Esta base é atualizada automaticamente sempre que possível e permite atualizações manuais para incorporar mudanças regulamentares recentes.

### 4.2 Segmentação de Clientes e Precificação Diferenciada

O sistema reconhece três categorias principais de clientes, cada uma com características tributárias e comerciais específicas: consumidor final, empresas de revenda e indústrias. Para cada categoria, o sistema aplica lógicas diferenciadas de precificação que consideram as peculiaridades tributárias aplicáveis às operações subsequentes que estes clientes realizarão com as mercadorias adquiridas.

Para vendas destinadas ao consumidor final, o sistema calcula preços que consideram a carga tributária total aplicável à operação de venda, incluindo ICMS na alíquota cheia, IPI quando aplicável, PIS e COFINS nas alíquotas de saída, além de margem comercial apropriada. Quando o produto está sujeito à substituição tributária, o sistema calcula automaticamente os valores de ICMS-ST devido e incorpora estes custos ao preço final.

Para operações de revenda, o sistema ajusta os cálculos considerando que o adquirente aproveitará os créditos de ICMS, IPI, PIS e COFINS, focalizando a precificação na margem comercial desejada e nos custos específicos da operação de venda. Para vendas industriais, algoritmos específicos consideram a natureza da operação e o aproveitamento de créditos pelo adquirente, frequentemente resultando em preços mais competitivos devido à menor carga tributária efetiva.

### 4.3 Regimes Tributários e Otimização Fiscal

O sistema suporta cálculos específicos para os três principais regimes tributários brasileiros: Lucro Real, Lucro Presumido e Simples Nacional. Cada regime possui características específicas de apuração de PIS e COFINS que impactam significativamente a formação de preços, especialmente em operações com margens reduzidas.

Para empresas enquadradas no Lucro Real, o sistema considera o regime não-cumulativo de PIS e COFINS, calculando o impacto dos créditos disponíveis na operação de importação sobre o custo efetivo das mercadorias. Esta funcionalidade permite precificação mais agressiva ao considerar a recuperação de créditos tributários.

Empresas do Lucro Presumido enfrentam o regime cumulativo de PIS e COFINS, resultando em carga tributária efetivamente maior que deve ser incorporada aos preços de venda. O sistema ajusta automaticamente os cálculos para refletir esta realidade tributária, mantendo competitividade sem comprometer margens.

Para o Simples Nacional, o sistema aplica as alíquotas unificadas correspondentes à faixa de faturamento da empresa, considerando as diferentes naturezas de atividade (indústria, comércio ou serviços) e seus impactos específicos na tributação das operações de venda.

### 4.4 Benefícios Fiscais Estaduais

O sistema incorpora funcionalidades avançadas para identificação e aplicação de benefícios fiscais estaduais, com foco específico nos programas de incentivo de Goiás, Santa Catarina, Minas Gerais e Espírito Santo. Estes estados oferecem programas robustos de atração de investimentos que podem resultar em reduções significativas da carga tributária, desde que determinadas condições sejam atendidas.

Para Goiás, o sistema considera os benefícios do FOMENTAR e programas correlatos, aplicando automaticamente as reduções de ICMS cabíveis conforme o NCM das mercadorias e o tipo de operação realizada. Em Santa Catarina, o PRODEC e outros programas são mapeados no sistema, permitindo cálculo automático dos benefícios aplicáveis.

Minas Gerais possui uma matriz complexa de benefícios fiscais que variam conforme região do estado, tipo de atividade e características específicas da empresa. O sistema mantém esta matriz atualizada e aplica automaticamente os benefícios cabíveis, sempre alertando o usuário sobre documentação necessária para fruição dos incentivos.

O Espírito Santo, através do INVEST-ES e programas correlatos, oferece benefícios que o sistema identifica e aplica automaticamente, sempre com documentação completa das bases legais utilizadas para cada cálculo.

## 5. Especificações Técnicas

### 5.1 Arquitetura da Solução

O sistema será desenvolvido utilizando arquitetura web moderna baseada em microserviços, garantindo escalabilidade, manutenibilidade e performance adequada para operações simultâneas de múltiplos usuários. A escolha tecnológica prioriza Python como linguagem principal para o backend, devido à sua robustez em processamento de dados, cálculos matemáticos complexos e disponibilidade de bibliotecas especializadas em manipulação de documentos XML e Excel.

O frontend será implementado em React.js, oferecendo interface responsiva e interativa que suporta as funcionalidades complexas de visualização e manipulação de dados requeridas pelo sistema. Esta combinação tecnológica garante desenvolvimento ágil, manutenção simplificada e experiência de usuário moderna.

A arquitetura de microserviços permite isolamento de funcionalidades críticas, facilitando atualizações e manutenções sem impacto sistêmico. Serviços específicos serão dedicados ao processamento de XML, cálculos tributários, gerenciamento de bases de dados fiscais e geração de relatórios, permitindo otimização individual de cada componente.

### 5.2 Estrutura de Dados e Persistência

O sistema utilizará PostgreSQL como banco de dados principal, aproveitando suas capacidades avançadas de processamento de dados estruturados e não-estruturados, bem como sua robustez em operações transacionais complexas. A estrutura de dados será organizada em módulos específicos que espelham as funcionalidades do sistema: módulo de DI, módulo de precificação, módulo de tributos e módulo de configurações.

Para otimização de performance em consultas complexas, o sistema implementará cache distribuído utilizando Redis, especialmente para dados fiscais frequentemente acessados como tabelas de NCM, alíquotas por estado e configurações de benefícios fiscais. Esta estratégia reduzirá significativamente os tempos de resposta em operações de cálculo intensivo.

O versionamento de dados fiscais será implementado nativamente no banco, permitindo rastreamento histórico de mudanças regulamentares e garantindo que cálculos realizados em datas passadas possam ser reproduzidos com exatidão, requisito fundamental para conformidade fiscal.

### 5.3 Integração e APIs

O sistema será desenvolvido com arquitetura API-first, expondo endpoints RESTful que permitam integração futura com sistemas ERP, contábeis e de gestão utilizados pelos clientes. Esta abordagem garante flexibilidade para desenvolvimento de integrações customizadas conforme necessidades específicas de cada usuário.

APIs específicas serão desenvolvidas para importação de dados de sistemas externos, exportação de resultados para sistemas terceiros e sincronização de bases de dados fiscais com fontes oficiais. A documentação completa das APIs seguirá padrões OpenAPI, facilitando desenvolvimento de integrações por equipes técnicas dos clientes.

### 5.4 Segurança e Conformidade

A implementação de segurança seguirá as melhores práticas da indústria, incluindo autenticação multifator, criptografia de dados em trânsito e em repouso, audit trail completo de todas as operações e controles de acesso baseados em perfis de usuário. Dados sensíveis como informações fiscais de clientes serão protegidos com camadas adicionais de segurança.

O sistema será desenvolvido considerando conformidade com a Lei Geral de Proteção de Dados (LGPD), implementando controles específicos para tratamento de dados pessoais e empresariais, com funcionalidades para exportação, anonimização e exclusão de dados conforme requerido pela legislação.

## 6. Workflow Operacional

### 6.1 Fluxo Principal de Operação

O workflow operacional do sistema inicia-se com o upload do arquivo XML da DI pelo usuário através de interface web intuitiva. O sistema imediatamente processa o arquivo, validando sua estrutura e extraindo dados essenciais para apresentação inicial ao usuário. Esta etapa inclui verificação de integridade do XML, validação de esquemas quando disponíveis e identificação de possíveis inconsistências nos dados.

Após processamento inicial, o sistema apresenta resumo executivo da DI importada, destacando informações críticas como valor total da importação, quantidade de adições, principais NCMs envolvidos e impostos calculados pelo Siscomex. Esta visão permite ao usuário confirmar que o arquivo correto foi processado antes de prosseguir com etapas subsequentes.

A próxima fase consiste na coleta de informações sobre despesas extra-DI através de formulário estruturado que orienta o usuário na categorização correta de cada tipo de despesa. O sistema oferece sugestões baseadas em padrões históricos e permite salvamento de templates personalizados para agilizar operações futuras similares.

### 6.2 Processamento e Cálculos

Com dados completos disponíveis, o sistema executa bateria completa de cálculos tributários, aplicando legislação vigente para cada NCM identificado e considerando características específicas da importação. Esta etapa envolve cálculos complexos que consideram bases de cálculo escalonadas, reduções aplicáveis, regimes especiais e tratamentos diferenciados conforme natureza das mercadorias.

O processamento inclui validação cruzada entre dados da DI e cálculos realizados pelo sistema, identificando divergências que possam indicar erros de classificação fiscal, aplicação incorreta de alíquotas ou outras inconsistências que demandem revisão manual.

Resultados são apresentados em interface tabular expansível que permite análise detalhada de cada adição e item, com drill-down completo até o nível de cálculo individual de cada tributo. Usuários podem revisar e ajustar cálculos quando necessário, com o sistema mantendo log completo de todas as modificações realizadas.

### 6.3 Geração de Outputs

Finalizada a fase de cálculos e validações, o sistema procede à geração automática de documentos de saída configurados conforme padrões da Expertzy. O espelho da DI é formatado incluindo todas as informações processadas, cálculos realizados e justificativas técnicas aplicáveis, resultando em documento profissional adequado para apresentação a clientes ou auditores.

O croqui da nota fiscal de entrada é gerado considerando legislação estadual aplicável à localização do importador, incluindo configurações específicas de ICMS, substituição tributária quando aplicável e códigos fiscais apropriados para cada situação. Este documento serve como guia preciso para escrituração contábil e fiscal das mercadorias importadas.

### 6.4 Precificação Dinâmica

Para operações que requerem precificação, o sistema acessa seu módulo especializado aplicando parâmetros configurados pelo usuário: tipo de cliente, localização geográfica, regime tributário aplicável e margem comercial desejada. Algoritmos específicos calculam preços otimizados considerando todas as variáveis tributárias relevantes.

Resultados de precificação são apresentados em formato comparativo que permite análise simultânea de cenários alternativos, facilitando tomada de decisão comercial. O sistema destaca oportunidades de otimização fiscal e alerta sobre riscos tributários específicos quando identificados.

## 7. Interface de Usuário e Experiência

### 7.1 Design Responsivo e Acessibilidade

A interface será desenvolvida seguindo princípios de design responsivo que garantem experiência consistente em dispositivos desktop, tablets e smartphones. Esta abordagem reconhece que profissionais da área tributária frequentemente necessitam acessar informações e realizar cálculos em diferentes contextos e localizações.

O design visual seguirá identidade corporativa da Expertzy, mantendo consistência com outros produtos da empresa e reforçando posicionamento de marca. Cores, tipografia e elementos gráficos serão otimizados para sessões prolongadas de trabalho, reduzindo fadiga visual e mantendo produtividade elevada.

Funcionalidades de acessibilidade serão implementadas nativamente, incluindo suporte a leitores de tela, navegação por teclado, contrastes ajustáveis e tamanhos de fonte configuráveis. Esta abordagem garante que o sistema seja utilizável por profissionais com diferentes necessidades e preferências.

### 7.2 Navegação Intuitiva e Workflow Guiado

A estrutura de navegação priorizará clareza e eficiência, organizando funcionalidades em módulos lógicos que espelham o fluxo natural de trabalho dos usuários. Menus contextuais e breadcrumbs facilitarão orientação dentro do sistema, especialmente importante considerando a complexidade das operações realizadas.

O sistema implementará wizards guiados para operações complexas, orientando usuários através de sequências de etapas com validações automáticas e sugestões contextuais. Esta abordagem reduz curva de aprendizado e minimiza erros operacionais, especialmente importante para novos usuários ou operações infrequentes.

### 7.3 Dashboards e Relatórios Visuais

Dashboards executivos fornecerão visão consolidada de operações em andamento, estatísticas de performance e alertas sobre situações que demandem atenção. Gráficos interativos permitirão análise de tendências em carga tributária, distribuição de custos por tipo de mercadoria e impacto de benefícios fiscais aplicados.

Relatórios customizáveis permitirão aos usuários criar visões específicas conforme necessidades operacionais, com funcionalidades de filtro, agrupamento e exportação que suportem diferentes cenários de análise e apresentação de resultados.

## 8. Considerações de Performance e Escalabilidade

### 8.1 Otimização de Performance

O sistema será otimizado para processamento eficiente de DIs com grandes quantidades de adições, situação comum em importações de empresas de maior porte. Algoritmos de processamento paralelo serão implementados para cálculos tributários complexos, aproveitando recursos computacionais modernos para reduzir tempos de processamento.

Cache inteligente manterá em memória dados fiscais frequentemente acessados, como tabelas de NCM e alíquotas tributárias, reduzindo necessidade de consultas repetitivas ao banco de dados. Estratégias de pré-carregamento anteciparão necessidades de dados baseadas em padrões de uso identificados.

### 8.2 Arquitetura Escalável

A arquitetura de microserviços permite escalabilidade horizontal conforme crescimento da base de usuários, com cada serviço podendo ser dimensionado independentemente conforme demanda específica. Load balancers distribuirão requisições otimizando utilização de recursos e garantindo disponibilidade elevada.

Monitoramento proativo identificará gargalos de performance e utilizará alertas automáticos para situações que demandem intervenção. Métricas detalhadas de uso orientarão decisões de otimização e expansão de infraestrutura.

## 9. Estratégia de Implementação

### 9.1 Fases de Desenvolvimento

O desenvolvimento seguirá abordagem incremental com entregas funcionais em fases que permitam feedback contínuo e ajustes baseados em experiência real de uso. A primeira fase focalizará no módulo de importação e processamento de DI, estabelecendo base sólida para funcionalidades subsequentes.

A segunda fase introduzirá o módulo de precificação básica, seguida por implementação progressiva de funcionalidades avançadas como benefícios fiscais estaduais e otimizações específicas por regime tributário. Esta abordagem permite validação incremental de funcionalidades e reduz riscos de desenvolvimento.

### 9.2 Testes e Validação

Estratégia abrangente de testes incluirá validação de cálculos tributários através de comparação com casos reais processados manualmente, garantindo precisão absoluta dos algoritmos implementados. Testes de carga simularão operações simultâneas de múltiplos usuários para validar performance sob demanda elevada.

Testes de usabilidade com profissionais experientes da área tributária validarão adequação da interface e fluxos de trabalho, garantindo que o sistema atenda efetivamente às necessidades práticas dos usuários finais.

## 10. Critérios de Sucesso e Métricas

### 10.1 Indicadores de Performance Técnica

O sucesso técnico do sistema será medido através de métricas objetivas incluindo tempo médio de processamento de DI (meta: inferior a 30 segundos para DIs com até 50 adições), precisão de cálculos tributários (meta: 99,5% de conformidade com cálculos manuais de referência) e disponibilidade do sistema (meta: 99,5% uptime mensal).

Métricas de usabilidade incluirão tempo médio para completar operações típicas, taxa de erros de usuário e satisfaction scores coletados através de pesquisas regulares com usuários ativos.

### 10.2 Impacto Operacional

O impacto operacional será avaliado através da redução no tempo total necessário para processar importações completas (meta: redução de 75% comparado a métodos manuais), aumento na capacidade de processamento de operações simultâneas por profissional e redução na taxa de erros em documentação fiscal gerada.

Indicadores comerciais incluirão adoção do sistema por clientes existentes da Expertzy, satisfação medida através de Net Promoter Score (NPS) e impacto na capacidade de atendimento da consultoria através da automação de processos rotineiros.

---

**Conclusão**

Este PRD estabelece as bases técnicas e funcionais para o desenvolvimento do Sistema de Importação e Precificação da Expertzy, representando evolução significativa na digitalização de processos tributários complexos. A implementação bem-sucedida desta solução posicionará a Expertzy na vanguarda da consultoria tributária tecnológica, oferecendo aos clientes ferramentas que combinam expertise técnica consolidada com inovação tecnológica de ponta.

O sistema proposto não apenas automatiza processos existentes, mas reimagina a forma como profissionais tributários interagem com dados complexos, transformando informações densas em insights acionáveis que suportam decisões comerciais estratégicas. Esta transformação digital fortalecerá a proposta de valor da Expertzy e estabelecerá novos padrões de excelência no mercado de consultoria tributária especializada.