<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# Sistema de Emissão de Nota Fiscal de Importação a partir da DI: Passo a Passo Completo

Para desenvolver um sistema robusto de emissão de nota fiscal de importação utilizando o XML da DI como fonte de dados, é necessário compreender toda a arquitetura do processo, desde a estrutura dos dados até a integração com os órgãos fiscalizadores. Apresento abaixo um guia completo com todas as etapas necessárias.

## Análise da Estrutura do XML da DI

### Estrutura Hierárquica Principal

O XML da Declaração de Importação possui uma estrutura complexa organizada hierarquicamente[^1][^2]:

- **ListaDeclaracoesTransmissao** (elemento raiz)
    - **declaracaoImportacaoTransmissao** (declaração principal)
        - **adicao** (adições - itens da importação)
        - **armazem** (informações de armazenagem)
        - Campos gerais da DI (pesos, códigos, datas)


### Campos Principais do XML da DI

Com base no dicionário de dados oficial da Receita Federal[^1], os principais campos incluem:

**Informações Gerais da DI:**

- `numeroDI` - Número da Declaração de Importação
- `dataRegistro` - Data de registro da DI
- `dataDesembaraco` - Data do desembaraço aduaneiro
- `cargaPesoBruto/cargaPesoLiquido` - Pesos da carga
- `codigoUrfDespacho` - URF de despacho
- `nomeImportador/numeroImportador` - Dados do importador

**Informações por Adição:**

- `numeroAdicao` - Número sequencial da adição
- `codigoMercadoriaNCM` - Código NCM do produto
- `textoDetalhamentoMercadoria` - Descrição da mercadoria
- `quantidadeMercadoriaUnidadeComercializada` - Quantidade
- `valorMercadoriaVendaMoedaNacional` - Valor em reais
- `pesoLiquidoMercadoria` - Peso líquido por item

**Informações Tributárias:**

- `valorImpostoDevido` - Valores de impostos (II, IPI, PIS, COFINS)
- `valorAliquotaIcms` - Alíquota do ICMS
- `valorBaseCalculoAdval` - Base de cálculo


## Arquitetura do Sistema

### 1. Módulo de Importação e Validação do XML

```python
# Exemplo de estrutura para processamento do XML da DI
class ProcessadorXMLDI:
    def __init__(self):
        self.schema_xsd = self.carregar_schema_xsd()
    
    def validar_xml(self, xml_content):
        # Validação contra o schema XSD da Receita Federal
        return self.validar_contra_schema(xml_content)
    
    def extrair_dados_di(self, xml_content):
        # Extração dos dados estruturados da DI
        dados_di = {
            'informacoes_gerais': self.extrair_cabecalho(xml_content),
            'adicoes': self.extrair_adicoes(xml_content),
            'tributacao': self.extrair_impostos(xml_content)
        }
        return dados_di
```


### 2. Mapeamento de Dados DI para NF-e

O sistema deve mapear os campos da DI para os campos correspondentes da NF-e[^3][^4]:

**Mapeamento Principal:**

- DI → NF-e Cabeçalho: Importador, datas, URF
- Adições → Itens da NF-e: Produtos, quantidades, valores
- Impostos DI → Tributação NF-e: II, IPI, PIS, COFINS, ICMS


### 3. Estrutura de Dados para NF-e de Importação

```python
class NotaFiscalImportacao:
    def __init__(self, dados_di):
        self.identificacao = self.mapear_identificacao(dados_di)
        self.emitente = self.definir_emitente_importador(dados_di)
        self.destinatario = self.definir_fornecedor_exterior(dados_di)
        self.itens = self.mapear_itens_di_para_nfe(dados_di['adicoes'])
        self.totais = self.calcular_totais(dados_di)
        self.impostos = self.mapear_impostos(dados_di['tributacao'])
        self.declaracao_importacao = self.mapear_di_para_nfe(dados_di)
```


## Campos Obrigatórios da NF-e de Importação

### Identificação da Nota (Grupo ide)

- Modelo: 55 (NF-e)
- Série e número da nota
- Data e hora de emissão
- Tipo: 0 (Entrada)
- CFOP: Iniciado com 3 (ex: 3.101, 3.102)[^5][^6]
- Natureza da operação: "Importação"


### Emitente (Grupo emit)

- Dados completos da empresa importadora
- CNPJ, IE, endereço
- Regime tributário


### Destinatário/Remetente (Grupo dest)

- Fornecedor estrangeiro
- Nome e endereço do país de origem
- Dados do país (código do país)[^4]


### Produtos (Grupo det)

Para cada adição da DI:

- Código do produto (interno)
- Descrição: idêntica à da DI[^4]
- NCM: mesmo código da DI[^7]
- Quantidade e unidade
- Valores unitário e total
- Peso líquido[^7]


### Impostos por Item

**Imposto de Importação (Grupo II):**[^7]

- Base de cálculo
- Alíquota
- Valor do imposto
- Despesas aduaneiras

**ICMS (Grupo ICMS):**[^7]

- CST adequado para importação
- Base de cálculo
- Alíquota
- Valor do ICMS

**IPI, PIS, COFINS:**[^7]

- Bases de cálculo específicas
- Alíquotas
- Valores dos impostos


### Declaração de Importação (Grupo DI)

**Obrigatório para NF-e de importação:**[^3][^7]

- Número da DI
- Data de registro
- Local de desembaraço
- URF de despacho
- Adições com detalhamento por item


## Algoritmos de Cálculo de Impostos

### Base de Cálculo dos Impostos na Importação

**Imposto de Importação (II):**[^8][^9]

```
Base II = Valor Aduaneiro (CIF em R$)
Valor II = Base II × Alíquota II
```

**IPI:**[^9][^10]

```
Base IPI = Valor Aduaneiro + II
Valor IPI = Base IPI × Alíquota IPI
```

**PIS e COFINS:**[^10]

```
Base PIS/COFINS = Valor Aduaneiro + II + IPI
Valor PIS = Base × Alíquota PIS
Valor COFINS = Base × Alíquota COFINS
```

**ICMS:**[^11][^12]

```
Base ICMS = (Valor Aduaneiro + II + IPI + PIS + COFINS + ICMS) / (1 - Alíquota ICMS)
Valor ICMS = Base ICMS × Alíquota ICMS
```


### Implementação do Cálculo

```python
class CalculadoraImpostosImportacao:
    def calcular_impostos(self, valor_aduaneiro, aliquotas):
        # II - Imposto de Importação
        valor_ii = valor_aduaneiro * aliquotas['ii']
        
        # IPI
        base_ipi = valor_aduaneiro + valor_ii
        valor_ipi = base_ipi * aliquotas['ipi']
        
        # PIS/COFINS
        base_pis_cofins = base_ipi + valor_ipi
        valor_pis = base_pis_cofins * aliquotas['pis']
        valor_cofins = base_pis_cofins * aliquotas['cofins']
        
        # ICMS (cálculo por dentro)
        base_icms = (valor_aduaneiro + valor_ii + valor_ipi + 
                    valor_pis + valor_cofins) / (1 - aliquotas['icms'])
        valor_icms = base_icms * aliquotas['icms']
        
        return {
            'ii': valor_ii,
            'ipi': valor_ipi,
            'pis': valor_pis,
            'cofins': valor_cofins,
            'icms': valor_icms,
            'total': base_icms
        }
```


## Validação e Conformidade

### Validação do XML da NF-e

O sistema deve implementar validação rigorosa contra o schema XSD da NF-e[^13][^14]:

```python
def validar_nfe_importacao(xml_nfe):
    validacoes = [
        validar_schema_xsd(xml_nfe),
        validar_campos_obrigatorios_importacao(xml_nfe),
        validar_consistencia_valores(xml_nfe),
        validar_cfop_importacao(xml_nfe),
        validar_declaracao_importacao(xml_nfe)
    ]
    return all(validacoes)
```


### Regras de Validação Específicas

1. **CFOP deve iniciar com 3** (operações de entrada)[^6]
2. **NCM deve ter 8 dígitos**[^7]
3. **Valores em reais** com conversão pela taxa da DI[^4]
4. **Descrição idêntica à da DI**[^4]
5. **Declaração de Importação obrigatória**[^3]

## Integração com SEFAZ

### Processo de Transmissão

1. **Geração do XML** com assinatura digital
2. **Validação local** contra schema XSD
3. **Transmissão para SEFAZ** do estado
4. **Processamento** e retorno do protocolo
5. **Tratamento** de autorizações/rejeições

### Tratamento de Erros Comuns

**Falhas de Schema mais frequentes:**[^14][^15]

- Tags não fechadas corretamente
- Valores inválidos em campos
- Campos obrigatórios ausentes
- Formatação incorreta de datas/números
- Estrutura XML malformada


## Considerações de Segurança e Performance

### Segurança

- Certificado digital A1 obrigatório para assinatura
- Validação de origem dos XMLs da DI
- Log de auditoria completo
- Backup dos XMLs gerados


### Performance

- Cache de schemas XSD
- Processamento assíncrono para grandes volumes
- Otimização de consultas de alíquotas
- Compressão de arquivos XML


## Fluxo Completo do Sistema

1. **Recepção** do XML da DI
2. **Validação** contra schema da Receita Federal
3. **Extração** e mapeamento dos dados
4. **Configuração** automática de CFOP e tributação
5. **Cálculo** automático dos impostos
6. **Geração** do XML da NF-e
7. **Validação** da NF-e gerada
8. **Assinatura** digital do XML
9. **Transmissão** para SEFAZ
10. **Processamento** do retorno
11. **Armazenamento** e auditoria

Este sistema proporcionará automação completa do processo de emissão de notas fiscais de importação, garantindo conformidade fiscal e reduzindo significativamente o trabalho manual necessário para nacionalização de mercadorias importadas.

<div style="text-align: center">⁂</div>

[^1]: https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/despacho-de-importacao/sistemas/siscomex-importacao-web/declaracao-de-importacao/funcionalidades/links-para-arquivos/dicionario-de-dados-do-xml-da-solicitacao-transmissao

[^2]: https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/despacho-de-importacao/sistemas/siscomex-importacao-web/declaracao-de-importacao/funcionalidades/links-para-arquivos/esquema-xsd-do-xml-da-solicitacao-transmissao.pdf/view

[^3]: https://suporte.totalerp.com.br/portal/pt/kb/articles/como-emitir-nf-e-de-importação

[^4]: https://conexoscloud.com.br/como-preencher-corretamente-a-nota-fiscal-de-importacao/

[^5]: https://firstsa.com.br/cfop-na-importacao/

[^6]: https://www.fazcomex.com.br/npi/cfop-na-importacao/

[^7]: https://flexdocs.net/guiaNFe/NFe.importacaoRPA.html

[^8]: https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/remessas-postal-e-expressa/preciso-pagar-impostos-nas-compras-internacionais/quanto-pagarei-de-imposto

[^9]: https://guelcos.com.br/conteudo/importacao/calculo-de-importacao-como-fazer/

[^10]: https://afianci.com/tributos-importacao/

[^11]: https://blog.maino.com.br/icms-na-importacao-entenda-como-funciona/

[^12]: https://www.migalhas.com.br/depeso/377903/icms-importacao-quando-e-cobrado-e-qual-sua-base-de-calculo

[^13]: https://futura.atlassian.net/wiki/spaces/SPT/pages/2909339758/Valida+o+do+Schema+Esquema+do+XML+da+NFe+CTe+MDFe

[^14]: https://blog.tecnospeed.com.br/como-resolver-falha-no-schema-xml-da-nf-e-nfc-e/

[^15]: https://atendimento.tecnospeed.com.br/hc/pt-br/articles/360010715554-Como-identificar-e-corrigir-uma-Falha-de-Schema-no-XML-da-NFe

[^16]: https://www37.receita.fazenda.gov.br/exportacao/others/Ajuda/Download/ManualExportacaoWebV1.0.pdf

[^17]: https://confluence.korp.com.br/pages/viewpage.action?pageId=1346830428

[^18]: https://meajuda.moveresoftware.com/support/solutions/articles/27000032874-geracão-de-nota-fiscal-de-importacão-via-arquivo-xml-do-siscomex

[^19]: http://docs.portalunico.siscomex.gov.br/pages/exemplos/duex/mensagens-erro-due/

[^20]: https://www.prosyst.com.br/wiki/enduser/erp/suprimentos/recebimento/di/montagemdi/importacao

[^21]: https://blog.maino.com.br/como-emitir-o-xml-da-di/

[^22]: https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/despacho-de-importacao/sistemas/siscomex-importacao-web/declaracao-de-importacao/funcionalidades/links-para-arquivos/esquema-xsd-do-xml-da-consulta-diagnostico.pdf/view

[^23]: https://meajuda.moveresoftware.com/support/solutions/articles/27000064170-geracão-de-nf-de-importacão-via-xml-siscomex

[^24]: https://docs.portalunico.siscomex.gov.br/introducao-api-publica/

[^25]: http://sped.rfb.gov.br/item/show/59

[^26]: https://ajuda.maino.com.br/pt-BR/articles/3156881-como-emitir-uma-nf-e-de-entrada-de-importacao-a-partir-do-xml-di

[^27]: https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/despacho-de-importacao/sistemas/siscomex-importacao-web/declaracao-de-importacao/funcionalidades/links-para-arquivos

[^28]: https://dfe-portal.svrs.rs.gov.br/Schemas/PRNFE/leiauteNFe_v3.00.xsd

[^29]: https://aprendo.iob.com.br/ajudaonline/artigo.aspx?artigo=9155

[^30]: https://doc-siscomex-sapi.estaleiro.serpro.gov.br/integracomex/documentacao/declaracao-importacao/

[^31]: http://sped.rfb.gov.br/item/show/2270

[^32]: https://ajuda.sankhya.com.br/hc/pt-br/articles/360043796574-Importar-dados-da-DI-Declaração-da-Importação-via-XML-Nota-de-Nacionalização

[^33]: https://www.nfe.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=d%2FNN9SSgick%3D

[^34]: https://atendimento.inventsoftware.info/kb/pt-br/article/287223/como-funciona-a-configuracao-de-layout-de-importacao-do-xml-da-n

[^35]: https://tdn.totvs.com/pages/viewpage.action?pageId=837858455

[^36]: https://www.athenas.com.br/faq/manual-importacao-xml-de-nfse-por-layout/

[^37]: https://www.digisan.com.br/blog/nota-fiscal-de-importacao

[^38]: https://suporte.dominioatendimento.com/central/faces/solucao.html?codigo=2095

[^39]: https://autoatendimento.e-contab.com.br/books/vendasne-documentos-eletronicos/page/nota-fiscal-eletronica-nfe-de-importacao-de-produtos

[^40]: https://emitirnotafiscal.com/integracoes/melhor-api-para-emissao-de-notas-fiscais-top-5-solucoes/

[^41]: https://wiki-erp.ixcsoft.com.br/artigos/artigos-fiscais/arquivo-xml-das-nota-fiscal-eletronica-(nf-e-nfc-e)---validacao-e-informacoes-importantes

[^42]: https://nfe.io

[^43]: https://www.votorantim.sp.gov.br/instarenv/assets/uploads/file/75ngseoa.pdf

[^44]: https://atendimento.receita.rs.gov.br/das-notas-fiscais-de-importacao

[^45]: https://focusnfe.com.br

[^46]: https://www.nfe.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=gv5XFF3hh0Y%3D

[^47]: https://webmaniabr.com/docs/rest-api-nfe/

[^48]: https://www.nfe.fazenda.gov.br/portal/listaConteudo.aspx?tipoConteudo=BMPFMBoln3w%3D

[^49]: https://aprendo.iob.com.br/ajudaonline/artigo.aspx?artigo=3800

[^50]: https://conexoscloud.com.br/nota-fiscal-eletronica-de-importacao/

[^51]: https://sebraepr.com.br/comunidade/artigo/como-utilizar-o-simulador-de-impostos-na-importacao

[^52]: https://ajuda.webmaniabr.com/hc/pt-br/articles/360013596171-Emissão-de-NF-e-Importação

[^53]: https://opentrade.com.br/2025/02/13/ola-mundo/

[^54]: https://ajuda.wk.com.br/78/wk/Processos/DF/Notas_Fiscais_de_Importa%C3%A7%C3%A3o.htm

[^55]: https://atendimento.tecnospeed.com.br/hc/pt-br/articles/14446850424855-Como-emitir-NF-e-de-Importação-com-o-PlugNotas

[^56]: https://www.estrategiaconcursos.com.br/blog/imposto-de-importacao-caracteristicas-jurisprudencia/

[^57]: https://ajuda.bling.com.br/hc/pt-br/articles/31663309457175-Treinamento-sobre-Nota-de-Importação-no-Bling

[^58]: https://www.fazcomex.com.br/importacao/nota-fiscal-de-importacao/

