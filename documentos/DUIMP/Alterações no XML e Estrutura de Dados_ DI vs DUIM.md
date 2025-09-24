<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Alterações no XML e Estrutura de Dados: DI vs DUIMP

## **Mudança Fundamental: Não Existe XML Oficial da DUIMP**

A principal e mais impactante alteração é que **a DUIMP não possui XML oficial disponível para download**, diferentemente da DI que oferecia um arquivo XML estruturado. Esta mudança representa uma ruptura significativa no ecossistema de sistemas de gestão que dependiam do XML da DI para integração.[^1][^2][^3][^4]

## Estrutura de Dados e Organização

### Eliminação do Conceito de Adições

A DUIMP eliminou completamente a estrutura de **adições**, que era fundamental na DI. Enquanto a DI organizava mercadorias em adições (agrupamentos), a DUIMP trabalha exclusivamente com **itens individuais**.[^5][^1]

**Impacto prático**: Cada produto deve ser lançado separadamente na DUIMP, mesmo que tenham a mesma NCM. Na DI, produtos similares eram agrupados em uma única adição.[^1]

### Limites e Capacidades

A DUIMP permite até **99.999 itens por declaração**, um limite significativamente maior que a estrutura de adições da DI. Esta mudança facilita operações com grande quantidade de SKUs diferentes.[^5]

## Formato de Dados Disponível

### API REST em Formato JSON

Em substituição ao XML, a DUIMP disponibiliza dados através de **API REST retornando arquivos JSON**. Os desenvolvedores devem utilizar as APIs públicas do Portal Único Siscomex para acessar os dados.[^6][^7][^8]

**Dados disponibilizados via JSON**:[^7]

- Identificação do importador
- Situação da DUIMP
- Equipe de trabalho (análise e desembaraço)
- Resultado da análise de risco
- Dados da carga e valores de frete
- Documentos de instrução do despacho
- Tributos (valores totais)
- Pagamentos e controle
- Tratamento administrativo por item
- **Itens DUIMP** com dados completos incluindo memória de cálculo, alíquotas e fundamentos legais


## Comparação de Estrutura de Dados

## Impactos nos Campos e Informações

### Granularidade dos Dados

A DUIMP oferece **granularidade muito maior** que a DI:[^1][^5]

**Tributos**: Agora são calculados e apresentados **item por item** com memória de cálculo completa, incluindo alíquotas específicas e fundamentos legais detalhados. Na DI, os tributos eram apresentados por adição.[^9][^1]

**Peso e Medidas**: O sistema realiza **rateio automático** entre itens quando necessário. O peso bruto pode não estar disponível no JSON, sendo preenchido automaticamente com o valor do peso líquido.[^10]

**Valoração**: Cada item possui valor detalhado individualmente, permitindo controle mais preciso para fins de nota fiscal de entrada.[^1]

### Novos Campos Obrigatórios

**Catálogo de Produtos**: Campo obrigatório que não existia na DI. Todo item deve estar previamente cadastrado no Catálogo de Produtos.[^5][^11]

**Atributos Estruturados**: Sistema padronizado de atributos por NCM, substituindo os antigos "destaques".[^5]

**Operador Estrangeiro**: Cadastro completo e estruturado do exportador/fabricante.[^5]

## Comparação XML/JSON

## Taxa SISCOMEX

Para fins de cobrança da Taxa SISCOMEX, o sistema cria **"Adições de DUIMP" virtuais**, agrupando itens com características similares:[^5]

- Mesmo exportador
- Mesmo fabricante
- Mesmo ex-tarifário
- Mesma aplicação e condição da mercadoria
- Mesmo método de valoração
- Mesmo Incoterm
- Mesmo fundamento legal


## Extrato da DUIMP

Atualmente disponível apenas um **extrato PDF simplificado** que **não contém informações tributárias completas**. O extrato não serve para buscar dados utilizados na emissão de nota fiscal de entrada.[^7][^12]

## Impacto na Nota Fiscal de Entrada

### Desafios de Integração

A ausência do XML oficial da DUIMP criou desafios significativos para a emissão de notas fiscais de entrada:[^3][^9]

**Sistemas ERPs**: Precisam ser adaptados para consumir APIs REST em vez de importar arquivos XML.[^4][^13]

**Certificação Digital**: Requer certificado **e-CPF** do usuário cadastrado no Portal, não mais certificado e-CNPJ.[^14]

**Desenvolvimento**: Empresas precisam desenvolver integrações específicas com as APIs do Portal Único.[^14][^7]

### Mudanças no Layout da NFe

Foi realizada atualização no layout do XML da NFe para tornar o campo **"nAdicao" (Número da Adição) opcional**, adequando-se à nova estrutura da DUIMP que não utiliza adições.[^15]

## Controle de Versões

A DUIMP implementa um **sistema automatizado de controle de versões**. Cada retificação gera uma nova versão com rastreabilidade total de mudanças, permitindo transparência completa no histórico de alterações.[^16]

## Status de Desenvolvimento

Segundo especialistas, **não está previsto o desenvolvimento de XML oficial da DUIMP**. O governo optou pela arquitetura de APIs REST como padrão para integração, exigindo adaptação de toda a cadeia de fornecedores de software.[^17][^18]

## Recomendações para Adequação

1. **Desenvolver integração via API**: Investir em soluções que consumam as APIs do Portal Único
2. **Certificação e-CPF**: Providenciar certificados adequados para consultas
3. **Capacitação técnica**: Treinar equipes em JSON e APIs REST
4. **Teste em ambiente de treinamento**: Utilizar ambiente de homologação antes da produção[^14]
5. **Parceria com fornecedores**: Trabalhar com desenvolvedores especializados nas novas tecnologias[^7]

A transição representa uma **modernização significativa** na arquitetura tecnológica do comércio exterior brasileiro, exigindo adaptação tanto de processos quanto de sistemas para aproveitamento das novas funcionalidades oferecidas pela DUIMP.
<span style="display:none">[^19][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^30][^31][^32][^33][^34][^35]</span>

```
<div style="text-align: center">⁂</div>
```

[^1]: https://www.youtube.com/watch?v=ikG23m16B0o

[^2]: https://www.fazcomex.com.br/npi/duimp-xml-como-gerar/

[^3]: https://smagalhaes.com.br/noticias/noticia?n=2400314

[^4]: https://maino.com.br/nota-fiscal-de-importacao/

[^5]: https://www.gov.br/siscomex/pt-br/informacoes/perguntas-frequentes/perguntas-frequentes-importacao

[^6]: http://docs.portalunico.siscomex.gov.br

[^7]: https://www.linkedin.com/posts/despachantes-aduaneiros-com_%F0%9D%97%97%F0%9D%97%A8%F0%9D%97%9C%F0%9D%97%A0%F0%9D%97%A3-%F0%9D%97%94%F0%9D%97%A5%F0%9D%97%A4%F0%9D%97%A8%F0%9D%97%9C%F0%9D%97%A9%F0%9D%97%A2-%F0%9D%97%9D%F0%9D%97%A6%F0%9D%97%A2%F0%9D%97%A1-%F0%9D%97%97-activity-7265569984301432832-rDaR

[^8]: https://pt.linkedin.com/posts/nilo-michetti-72699524_duimp-consultaduimp-jsonduimp-activity-7265070954500784130-OYWR

[^9]: https://www.fazcomex.com.br/npi/como-gerar-nota-fiscal-de-importacao-duimp/

[^10]: https://www.athenas.com.br/faq/manual-importacao-de-duimp/

[^11]: https://www.gov.br/siscomex/pt-br/informacoes/manual-importador-catalogo-oper-estrang-classif-v15.pdf

[^12]: https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/despacho-de-importacao/sistemas/duimp/extrato-da-duimp

[^13]: https://gett.com.br/notas-fiscais-de-importacao-checklist-para-emissao-correta/

[^14]: https://ajuda.maino.com.br/pt-BR/articles/9922907-como-utilizar-a-duimp-pelo-maino

[^15]: https://pt.linkedin.com/pulse/o-que-muda-na-nota-fiscal-de-importação-com-duimp-conexoscloud-ky18f

[^16]: https://www.fazcomex.com.br/npi/na-retificacao-da-duimp-a-forma-de-identificar-e-pelo-numero-da-versao/

[^17]: https://www.youtube.com/watch?v=ULkgKdXPshw

[^18]: https://www.youtube.com/watch?v=zY72V7W2-Og

[^19]: https://www.gov.br/siscomex/pt-br/informacoes/manual-de-preenchimento-du-e-v24.pdf

[^20]: https://www.nfe.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=vcqS7b0oTnU%3D

[^21]: https://www.nfe.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=eWTd1q6pRMM%3D

[^22]: https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/despacho-de-importacao/sistemas/duimp

[^23]: http://idealsoftwares.com.br/tabelas/tabela.php?id=1503

[^24]: https://conexoscloud.com.br/como-se-preparar-para-a-duimp/

[^25]: https://dja.adv.br/novoprocessodeimportacao-catalogodeprodutos-atributos/

[^26]: https://guelcos.com.br/conteudo/importacao/duimp-x-di-entenda-a-diferenca-das-declaracoes-de-importacao/

[^27]: https://conexoscloud.com.br/duvidas-sobre-a-migracao-para-a-duimp/

[^28]: https://community.sap.com/t5/enterprise-resource-planning-blog-posts-by-sap/nota-técnica-2020-005-documento-de-importação-e-campos-para-código-de/ba-p/13497598

[^29]: https://www.instagram.com/p/DG3O08KxHXE/

[^30]: https://libraport.com.br/blog/implementacao-duimp/

[^31]: http://docs.portalunico.siscomex.gov.br/api/dimp/sefaz/

[^32]: https://documentacao.senior.com.br/seniorxplatform/manual-do-usuario/erp/suprimentos/recebimentos/nota-importacao.htm

[^33]: https://ajuda.maino.com.br/pt-BR/articles/9736369-duimp-quando-comeca-a-valer

[^34]: https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/42f588549ddc13a93aba14597f7309f7/fe4ea5fe-ddda-4c07-8699-a9ac954b492d/3e717bde.csv

[^35]: https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/42f588549ddc13a93aba14597f7309f7/fe4ea5fe-ddda-4c07-8699-a9ac954b492d/362a9d1c.csv

