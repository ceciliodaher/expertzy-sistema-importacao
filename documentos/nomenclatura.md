<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Qual é a nomenclatura utilizada pelo sistema de importação e processamento do xml? Construa uma tabela de referência, relacionando o xml com o sistema.

Baseando-me na análise do código DIProcessor.js, construí uma tabela de referência completa da nomenclatura utilizada pelo sistema de importação e processamento de XML da DI (Declaração de Importação).

## Tabela de Referência: XML → Sistema DIProcessor

### **Dados Gerais da DI**

| Tag XML | Variável do Sistema | Descrição | Tipo de Conversão |
| :-- | :-- | :-- | :-- |
| `numeroDI` | `diData.numero_di` | Número da Declaração de Importação | String |
| `dataRegistro` | `diData.data_registro` | Data do registro (formato DD/MM/AAAA) | Date (AAAAMMDD → DD/MM/AAAA) |
| `urfDespachoCodigo` | `diData.urf_despacho_codigo` | Código da URF de despacho | String |
| `urfDespachoNome` | `diData.urf_despacho_nome` | Nome da URF de despacho | String |
| `modalidadeDespachoCodigo` | `diData.modalidade_codigo` | Código da modalidade de despacho | String |
| `modalidadeDespachoNome` | `diData.modalidade_nome` | Nome da modalidade de despacho | String |
| `situacaoEntregaCarga` | `diData.situacao_entrega` | Situação da entrega da carga | String |
| `totalAdicoes` | `diData.total_adicoes` | Total de adições na DI | Integer |

### **Dados do Importador**

| Tag XML | Variável do Sistema | Descrição | Tipo de Conversão |
| :-- | :-- | :-- | :-- |
| `importadorNome` | `diData.importador.nome` | Nome do importador | String |
| `importadorNumero` | `diData.importador.cnpj` | CNPJ do importador | CNPJ formatado (XX.XXX.XXX/XXXX-XX) |
| `importadorEnderecoLogradouro` | `diData.importador.endereco_logradouro` | Logradouro do endereço | String |
| `importadorEnderecoNumero` | `diData.importador.endereco_numero` | Número do endereço | String |
| `importadorEnderecoComplemento` | `diData.importador.endereco_complemento` | Complemento do endereço | String |
| `importadorEnderecoBairro` | `diData.importador.endereco_bairro` | Bairro do endereço | String |
| `importadorEnderecoCidade` | `diData.importador.endereco_cidade` | Cidade do endereço | String |
| `importadorEnderecoMunicipio` | `diData.importador.endereco_municipio` | Município do endereço | String |
| `importadorEnderecoUf` | `diData.importador.endereco_uf` | UF do endereço | String |
| `importadorEnderecoCep` | `diData.importador.endereco_cep` | CEP do endereço | CEP formatado (XXXXX-XXX) |
| `importadorNomeRepresentanteLegal` | `diData.importador.representante_nome` | Nome do representante legal | String |
| `importadorCpfRepresentanteLegal` | `diData.importador.representante_cpf` | CPF do representante | CPF formatado (XXX.XXX.XXX-XX) |
| `importadorNumeroTelefone` | `diData.importador.telefone` | Telefone do importador | String |

### **Dados da Carga**

| Tag XML | Variável do Sistema | Descrição | Tipo de Conversão |
| :-- | :-- | :-- | :-- |
| `cargaPesoBruto` | `diData.carga.peso_bruto` | Peso bruto da carga | Weight (÷ 100.000) |
| `cargaPesoLiquido` | `diData.carga.peso_liquido` | Peso líquido da carga | Weight (÷ 100.000) |
| `cargaPaisProcedenciaCodigo` | `diData.carga.pais_procedencia_codigo` | Código do país de procedência | String |
| `cargaPaisProcedenciaNome` | `diData.carga.pais_procedencia_nome` | Nome do país de procedência | String |
| `cargaUrfEntradaCodigo` | `diData.carga.urf_entrada_codigo` | Código da URF de entrada | String |
| `cargaUrfEntradaNome` | `diData.carga.urf_entrada_nome` | Nome da URF de entrada | String |
| `cargaDataChegada` | `diData.carga.data_chegada` | Data de chegada da carga | Date (AAAAMMDD → DD/MM/AAAA) |
| `viaTransporteCodigo` | `diData.carga.via_transporte_codigo` | Código da via de transporte | String |
| `viaTransporteNome` | `diData.carga.via_transporte_nome` | Nome da via de transporte | String |
| `viaTransporteNomeVeiculo` | `diData.carga.nome_veiculo` | Nome do veículo transportador | String |
| `viaTransporteNomeTransportador` | `diData.carga.nome_transportador` | Nome do transportador | String |

### **Dados das Adições**

| Tag XML | Variável do Sistema | Descrição | Tipo de Conversão |
| :-- | :-- | :-- | :-- |
| `dadosMercadoriaCodigoNcm` | `adicao.ncm` | Código NCM da mercadoria | String |
| `dadosMercadoriaNomeNcm` | `adicao.descricao_ncm` | Descrição NCM da mercadoria | String |
| `dadosMercadoriaPesoLiquido` | `adicao.peso_liquido` | Peso líquido da adição | Weight (÷ 100.000) |
| `dadosMercadoriaMedidaEstatisticaQuantidade` | `adicao.quantidade_estatistica` | Quantidade estatística | Weight (÷ 100.000) |
| `dadosMercadoriaMedidaEstatisticaUnidade` | `adicao.unidade_estatistica` | Unidade de medida estatística | String |
| `condicaoVendaIncoterm` | `adicao.condicao_venda_incoterm` | Código do Incoterm | String |
| `condicaoVendaLocal` | `adicao.condicao_venda_local` | Local da condição de venda | String |
| `condicaoVendaMoedaCodigo` | `adicao.moeda_negociacao_codigo` | Código da moeda de negociação | String |
| `condicaoVendaMoedaNome` | `adicao.moeda_negociacao_nome` | Nome da moeda de negociação | String |
| `condicaoVendaValorMoeda` | `adicao.valor_moeda_negociacao` | Valor na moeda de negociação | Monetary (÷ 100) |
| `condicaoVendaValorReais` | `adicao.valor_reais` | Valor em reais | Monetary (÷ 100) |

### **Tributos Federais**

| Tag XML | Variável do Sistema | Descrição | Tipo de Conversão |
| :-- | :-- | :-- | :-- |
| `iiRegimeTributacaoCodigo` | `tributos.ii_regime_codigo` | Código do regime tributário II | String |
| `iiAliquotaAdValorem` | `tributos.ii_aliquota_ad_valorem` | Alíquota II ad valorem | Percentage (÷ 100) |
| `iiBaseCalculo` | `tributos.ii_base_calculo` | Base de cálculo II | Monetary (÷ 100) |
| `iiAliquotaValorCalculado` | `tributos.ii_valor_calculado` | Valor calculado II | Monetary (÷ 100) |
| `iiAliquotaValorDevido` | `tributos.ii_valor_devido` | Valor devido II | Monetary (÷ 100) |
| `iiAliquotaValorRecolher` | `tributos.ii_valor_recolher` | Valor a recolher II | Monetary (÷ 100) |
| `ipiAliquotaAdValorem` | `tributos.ipi_aliquota_ad_valorem` | Alíquota IPI ad valorem | Percentage (÷ 100) |
| `ipiAliquotaValorDevido` | `tributos.ipi_valor_devido` | Valor devido IPI | Monetary (÷ 100) |
| `pisPasepAliquotaAdValorem` | `tributos.pis_aliquota_ad_valorem` | Alíquota PIS ad valorem | Percentage (÷ 100) |
| `pisPasepAliquotaValorDevido` | `tributos.pis_valor_devido` | Valor devido PIS | Monetary (÷ 100) |
| `cofinsAliquotaAdValorem` | `tributos.cofins_aliquota_ad_valorem` | Alíquota COFINS ad valorem | Percentage (÷ 100) |
| `cofinsAliquotaValorDevido` | `tributos.cofins_valor_devido` | Valor devido COFINS | Monetary (÷ 100) |

### **Frete e Seguro**

| Tag XML | Variável do Sistema | Descrição | Tipo de Conversão |
| :-- | :-- | :-- | :-- |
| `freteValorMoedaNegociada` | `adicao.frete_valor_moeda_negociada` | Valor frete moeda negociada | Monetary (÷ 100) |
| `freteValorReais` | `adicao.frete_valor_reais` | Valor frete em reais | Monetary (÷ 100) |
| `seguroValorMoedaNegociada` | `adicao.seguro_valor_moeda_negociada` | Valor seguro moeda negociada | Monetary (÷ 100) |
| `seguroValorReais` | `adicao.seguro_valor_reais` | Valor seguro em reais | Monetary (÷ 100) |

### **Despesas Aduaneiras**

| Tag XML | Variável do Sistema | Descrição | Tipo de Conversão |
| :-- | :-- | :-- | :-- |
| `codigoReceita` | `pagamento.codigo_receita` | Código da receita federal | String |
| `valorReceita` | `pagamento.valor` | Valor do pagamento | Monetary (÷ 100) |
| `dataPagamento` | `pagamento.data_pagamento` | Data do pagamento | String |
| `codigoAcrescimo` | `acrescimo.codigo_acrescimo` | Código do acréscimo | String |
| `valorReais` | `acrescimo.valor_reais` | Valor em reais | Monetary (÷ 100) |

### **Produtos da Adição**

| Tag XML | Variável do Sistema | Descrição | Tipo de Conversão |
| :-- | :-- | :-- | :-- |
| `numeroSequencialItem` | `produto.numero_sequencial_item` | Número sequencial do item | String |
| `descricaoMercadoria` | `produto.descricao_mercadoria` | Descrição da mercadoria | String |
| `quantidade` | `produto.quantidade` | Quantidade do produto | Weight (÷ 100.000) |
| `unidadeMedida` | `produto.unidade_medida` | Unidade de medida | String |
| `valorUnitario` | `produto.valor_unitario_usd` | Valor unitário USD | Unit Value (÷ 10.000.000) |

## **Tipos de Conversão Utilizados**

| Tipo | Divisor | Descrição | Exemplo |
| :-- | :-- | :-- | :-- |
| `monetary` | ÷ 100 | Valores monetários em centavos | 10120 → 101,20 |
| `weight` | ÷ 100.000 | Pesos com 5 decimais | 20000 → 0,20000 kg |
| `unit_value` | ÷ 10.000.000 | Valores unitários com 7 decimais | 44682000000 → 4468,20 |
| `percentage` | ÷ 100 | Alíquotas em centésimos | 650 → 6,50% |
| `integer` | Sem divisão | Valores inteiros | 123 → 123 |

## **Mapeamentos Especiais**

### **Códigos de Receita → Tipos de Despesa**

- `7811`: SISCOMEX
- `5529`: Anti-Dumping
- `5622`: Medida Compensatória
- `0086`: Imposto de Importação
- `1038`: IPI Vinculado
- `5602`: PIS Importação
- `5629`: COFINS Importação


### **Códigos de Acréscimo → Tipos**

- `16`: Capatazia
- `17`: Taxa CE (Conhecimento de Embarque)

Esta nomenclatura permite ao sistema DIProcessor extrair, converter e estruturar automaticamente todos os dados fiscais da DI, mantendo compatibilidade com os cálculos de impostos e compliance tributário.
<span style="display:none">[^1][^2][^3][^4]</span>

<div style="text-align: center">⁂</div>

[^1]: DIProcessor.js

[^2]: di-interface.js

[^3]: di-processor.html

[^4]: 2300120746.xml

