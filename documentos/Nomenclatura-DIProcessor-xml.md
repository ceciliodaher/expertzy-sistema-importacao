# Nomenclatura criada para cada registro e campo.

Com base na análise do arquivo **DIProcessor.js**, identifiquei a nomenclatura completa utilizada para processar XMLs de Declaração de Importação (DI). O sistema cria uma estrutura hierárquica de dados organizados em registros principais e sub-registros. Aqui está a tabela exaustiva da nomenclatura:

## Estrutura Principal de Nomenclatura

### **Dados Gerais da DI (Registro: `diData`)**

| Campo JavaScript        | Campo XML Origem           | Tipo    | Descrição                             |
|:----------------------- |:-------------------------- |:------- |:------------------------------------- |
| `numero_di`             | `numeroDI`                 | string  | Número da Declaração de Importação    |
| `data_registro`         | `dataRegistro`             | date    | Data de registro formatada DD/MM/AAAA |
| `urf_despacho_codigo`   | `urfDespachoCodigo`        | string  | Código da URF de despacho             |
| `urf_despacho_nome`     | `urfDespachoNome`          | string  | Nome da URF de despacho               |
| `modalidade_codigo`     | `modalidadeDespachoCodigo` | string  | Código da modalidade de despacho      |
| `modalidade_nome`       | `modalidadeDespachoNome`   | string  | Nome da modalidade de despacho        |
| `situacao_entrega`      | `situacaoEntregaCarga`     | string  | Situação da entrega da carga          |
| `total_adicoes`         | `totalAdicoes`             | integer | Total de adições na DI                |
| `incoterm_identificado` | `condicaoVendaIncoterm`    | object  | Incoterm identificado automaticamente |

### **Dados do Importador (Registro: `diData.importador`)**

| Campo JavaScript       | Campo XML Origem                   | Tipo   | Descrição                           |
|:---------------------- |:---------------------------------- |:------ |:----------------------------------- |
| `nome`                 | `importadorNome`                   | string | Razão social do importador          |
| `cnpj`                 | `importadorNumero`                 | string | CNPJ formatado (XX.XXX.XXX/XXXX-XX) |
| `endereco_logradouro`  | `importadorEnderecoLogradouro`     | string | Logradouro do endereço              |
| `endereco_numero`      | `importadorEnderecoNumero`         | string | Número do endereço                  |
| `endereco_complemento` | `importadorEnderecoComplemento`    | string | Complemento do endereço             |
| `endereco_bairro`      | `importadorEnderecoBairro`         | string | Bairro do endereço                  |
| `endereco_cidade`      | `importadorEnderecoCidade`         | string | Cidade do endereço                  |
| `endereco_municipio`   | `importadorEnderecoMunicipio`      | string | Município do endereço               |
| `endereco_uf`          | `importadorEnderecoUf`             | string | UF do endereço                      |
| `endereco_cep`         | `importadorEnderecoCep`            | string | CEP formatado (XXXXX-XXX)           |
| `representante_nome`   | `importadorNomeRepresentanteLegal` | string | Nome do representante legal         |
| `representante_cpf`    | `importadorCpfRepresentanteLegal`  | string | CPF formatado                       |
| `telefone`             | `importadorNumeroTelefone`         | string | Telefone de contato                 |
| `endereco_completo`    | calculado                          | string | Endereço completo concatenado       |

### **Dados da Carga (Registro: `diData.carga`)**

| Campo JavaScript          | Campo XML Origem                 | Tipo    | Descrição                          |
|:------------------------- |:-------------------------------- |:------- |:---------------------------------- |
| `peso_bruto`              | `cargaPesoBruto`                 | decimal | Peso bruto da carga (5 decimais)   |
| `peso_liquido`            | `cargaPesoLiquido`               | decimal | Peso líquido da carga (5 decimais) |
| `pais_procedencia_codigo` | `cargaPaisProcedenciaCodigo`     | string  | Código do país de procedência      |
| `pais_procedencia_nome`   | `cargaPaisProcedenciaNome`       | string  | Nome do país de procedência        |
| `urf_entrada_codigo`      | `cargaUrfEntradaCodigo`          | string  | Código da URF de entrada           |
| `urf_entrada_nome`        | `cargaUrfEntradaNome`            | string  | Nome da URF de entrada             |
| `data_chegada`            | `cargaDataChegada`               | date    | Data de chegada da carga           |
| `via_transporte_codigo`   | `viaTransporteCodigo`            | string  | Código da via de transporte        |
| `via_transporte_nome`     | `viaTransporteNome`              | string  | Nome da via de transporte          |
| `nome_veiculo`            | `viaTransporteNomeTransportador` | string  | Nome do veículo transportador      |
| `nome_transportador`      | `viaTransporteNomeTransportador` | string  | Nome da empresa transportadora     |

### **Dados das Adições (Registro: `diData.adicoes[i]`)**

| Campo JavaScript          | Campo XML Origem             | Tipo     | Descrição                                              |
|:------------------------- |:---------------------------- |:-------- |:------------------------------------------------------ |
| `numero_adicao`           | `numeroAdicao`               | string   | Número da adição extraído do XML (001, 002, 003, etc.) |
| `ncm`                     | `dadosMercadoriaCodigoNcm`   | string   | Código NCM da mercadoria                               |
| `descricao_ncm`           | `dadosMercadoriaNomeNcm`     | string   | Descrição da NCM                                       |
| `peso_liquido`            | `dadosMercadoriaPesoLiquido` | decimal  | Peso líquido da adição                                 |
| `condicao_venda_incoterm` | `condicaoVendaIncoterm`      | string   | Código do INCOTERM                                     |
| `moeda_negociacao_codigo` | `condicaoVendaMoedaCodigo`   | string   | Código da moeda de negociação                          |
| `valor_moeda_negociacao`  | `condicaoVendaValorMoeda`    | monetary | Valor FOB em moeda negociada                           |
| `valor_reais`             | `condicaoVendaValorReais`    | monetary | Valor FOB em reais                                     |
| `frete_valor_reais`       | `freteValorReais`            | monetary | Valor do frete em reais                                |
| `seguro_valor_reais`      | `seguroValorReais`           | monetary | Valor do seguro em reais                               |
| `taxa_cambio`             | calculado                    | decimal  | Taxa de câmbio calculada                               |

### **Dados dos Tributos (Registro: `diData.adicoes[i].tributos`)**

| Campo JavaScript             | Campo XML Origem              | Tipo       | Descrição                     |
|:---------------------------- |:----------------------------- |:---------- |:----------------------------- |
| `ii_aliquota_ad_valorem`     | `iiAliquotaAdValorem`         | percentage | Alíquota ad valorem do II     |
| `ii_valor_devido`            | `iiAliquotaValorDevido`       | monetary   | Valor devido do II            |
| `ii_valor_recolher`          | `iiAliquotaValorRecolher`     | monetary   | Valor a recolher do II        |
| `ipi_aliquota_ad_valorem`    | `ipiAliquotaAdValorem`        | percentage | Alíquota ad valorem do IPI    |
| `ipi_valor_devido`           | `ipiAliquotaValorDevido`      | monetary   | Valor devido do IPI           |
| `pis_aliquota_ad_valorem`    | `pisPasepAliquotaAdValorem`   | percentage | Alíquota ad valorem do PIS    |
| `pis_valor_devido`           | `pisPasepAliquotaValorDevido` | monetary   | Valor devido do PIS           |
| `cofins_aliquota_ad_valorem` | `cofinsAliquotaAdValorem`     | percentage | Alíquota ad valorem da COFINS |
| `cofins_valor_devido`        | `cofinsAliquotaValorDevido`   | monetary   | Valor devido da COFINS        |
| `cide_valor_devido`          | `cideValorDevido`             | monetary   | Valor devido da CIDE          |

### **Produtos (Registro: `diData.adicoes[i].produtos[j]`)**

| Campo JavaScript         | Campo XML Origem       | Tipo     | Descrição                 |
|:------------------------ |:---------------------- |:-------- |:------------------------- |
| `numero_sequencial_item` | `numeroSequencialItem` | string   | Número sequencial do item |
| `descricao_mercadoria`   | `descricaoMercadoria`  | string   | Descrição da mercadoria   |
| `quantidade`             | `quantidade`           | decimal  | Quantidade do produto     |
| `unidade_medida`         | `unidadeMedida`        | string   | Unidade de medida         |
| `valor_unitario_usd`     | `valorUnitario`        | monetary | Valor unitário em USD     |
| `valor_unitario_brl`     | calculado              | monetary | Valor unitário em BRL     |
| `valor_total_brl`        | calculado              | monetary | Valor total em BRL        |

### **Despesas Aduaneiras (Registro: `diData.despesas_aduaneiras`)**

| **Fonte XML**                                      | **Campo DIProcessor**                      | **Método de Extração**          | **Código Receita** | **Tipo de Despesa**  | **Descrição**                              |
| -------------------------------------------------- | ------------------------------------------ | ------------------------------- | ------------------ | -------------------- | ------------------------------------------ |
| `<pagamento><codigoReceita>7811</codigoReceita>`   | `despesas.calculadas.siscomex`             | `extractPagamentos()`           | 7811               | SISCOMEX             | Taxa de Utilização do SISCOMEX             |
| `<pagamento><codigoReceita>5529</codigoReceita>`   | `despesas.calculadas.anti_dumping`         | `extractPagamentos()`           | 5529               | ANTI_DUMPING         | Direito Antidumping                        |
| `<pagamento><codigoReceita>5622</codigoReceita>`   | `despesas.calculadas.medida_compensatoria` | `extractPagamentos()`           | 5622               | MEDIDA_COMPENSATORIA | Medida Compensatória                       |
| `<pagamento><codigoReceita>5651</codigoReceita>`   | `despesas.calculadas.medida_salvaguarda`   | `extractPagamentos()`           | 5651               | MEDIDA_SALVAGUARDA   | Medida de Salvaguarda                      |
| `<pagamento><codigoReceita>0086</codigoReceita>`   | `despesas.pagamentos[]`                    | `extractPagamentos()`           | 0086               | II_OUTROS            | II - Outros                                |
| `<pagamento><codigoReceita>1038</codigoReceita>`   | `despesas.pagamentos[]`                    | `extractPagamentos()`           | 1038               | IPI_VINCULADO        | IPI Vinculado Importação                   |
| `<acrescimo><codigoAcrescimo>16</codigoAcrescimo>` | `despesas.calculadas.capatazia`            | `extractAcrescimos()`           | 16                 | CAPATAZIA            | Capatazia                                  |
| `<acrescimo><codigoAcrescimo>17</codigoAcrescimo>` | `despesas.calculadas.taxa_ce`              | `extractAcrescimos()`           | 17                 | TAXA_CE              | Taxa CE                                    |
| `informacaoComplementar`                           | `despesas.calculadas.afrmm`                | `calcularDespesasAutomaticas()` | AFRMM              | AFRMM                | Adicional Frete Renovação Marinha Mercante |

**Códigos de Receita Mapeados:**

- `7811` → `SISCOMEX` (Taxa de Utilização do SISCOMEX)
- `5529` → `ANTI_DUMPING` (Direito Antidumping)
- `5622` → `MEDIDA_COMPENSATORIA` (Medida Compensatória)
- `0086` → `II_OUTROS` (Imposto de Importação - Outros)
- `1038` → `IPI_VINCULADO` (IPI - Vinculado Importação)

**Códigos de Acréscimo:**

- `16` → `CAPATAZIA` (Capatazia)
- `17` → `TAXA_CE` (Taxa CE - Conhecimento Embarque)

### **Incentivos Fiscais (Registro: `diData.incentivos`)**

| Campo JavaScript       | Módulo Criador           | Tipo    | Descrição                                     |
|:---------------------- |:------------------------ |:------- |:--------------------------------------------- |
| `possui_incentivo`     | IncentiveManager.js      | boolean | Indica se a empresa possui incentivo fiscal   |
| `programa_selecionado` | IncentiveManager.js      | string  | Código do programa de incentivo selecionado   |
| `programas_disponiveis`| IncentiveManager.js      | array   | Lista de programas disponíveis para o estado  |
| `estado_empresa`       | IncentiveManager.js      | string  | Estado da empresa (UF do importador)          |
| `estado_programa`      | IncentiveManager.js      | string  | Estado do programa selecionado                |
| `cross_state`          | IncentiveManager.js      | boolean | Indica se é simulação cross-estado            |
| `incentivo_aplicado`   | IncentiveManager.js      | object  | Dados do incentivo aplicado na importação     |

### **IndexedDB - Tabelas de Incentivos (Schema v3)**

| Tabela                 | Campos Principais                      | Módulo Criador      | Descrição                    |
|:---------------------- |:-------------------------------------- |:------------------- |:---------------------------- |
| `incentivos_entrada`   | `di_id`, `estado`, `tipo_beneficio`    | IndexedDBManager.js | Incentivos na entrada        |
| `incentivos_saida`     | `di_id`, `estado`, `operacao`          | IndexedDBManager.js | Incentivos na saída          |
| `elegibilidade_ncm`    | `ncm`, `estado`, `incentivo_codigo`    | IndexedDBManager.js | Elegibilidade por NCM        |

### **Validações de Nomenclatura (NO FALLBACKS)**

```javascript
// ✅ OBRIGATÓRIO: Validação em todos os módulos que usam incentivos
if (objeto.selected_incentive) {
    throw new Error('VIOLAÇÃO NOMENCLATURA: Use "programa_selecionado" não "selected_incentive"');
}

if (objeto.has_incentive !== undefined) {
    throw new Error('VIOLAÇÃO NOMENCLATURA: Use "possui_incentivo" não "has_incentive"');  
}

if (objeto.available_programs) {
    throw new Error('VIOLAÇÃO NOMENCLATURA: Use "programas_disponiveis" não "available_programs"');
}
```

### **Hierarquia de Autoridade para Incentivos**

1. **IncentiveManager.js**: PRIMARY CREATOR para nomenclatura de incentivos
2. **di-interface.js**: CONSUMER (deve seguir nomenclatura do IncentiveManager)
3. **IndexedDBManager.js**: CONSUMER (implementa schema seguindo IncentiveManager)
4. **CroquiNFExporter.js**: CONSUMER (usa dados de incentivos para CST 51)

### **Conversões de Tipos**

O sistema utiliza conversões específicas para diferentes tipos de dados:

- **monetary**: Valores monetários em centavos (÷100)
- **weight**: Pesos com 5 decimais (÷100000)
- **unit_value**: Valores unitários com 7 decimais (÷10000000)
- **percentage**: Alíquotas em centésimos (÷100)

Esta nomenclatura padronizada permite o processamento consistente de XMLs de DI, mantendo a rastreabilidade entre os campos originais do XML e a estrutura de dados JavaScript resultante.[^1]

```
<div style="text-align: center">⁂</div>
```

[^1]: DIProcessor.js
