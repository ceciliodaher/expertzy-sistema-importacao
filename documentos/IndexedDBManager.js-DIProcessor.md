<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Analise agora IndexedDBManager.js e Construa uma tabela comparativa entre os nomes utilizados por este arquivo e os criados pelo DIProcessor.js.

A interface IndexedDBManager salva, em suas object-stores, quase todos os campos gerados pelo DIProcessor, porém adota nomenclaturas ligeiramente diferentes em alguns casos. Os quadros abaixo mostram, para cada store, o campo persistido e o nome correspondente na estrutura do DIProcessor.

### Declarações (store `declaracoes`)

| IndexedDBManager            | DIProcessor                 | Observação                                  |
|:--------------------------- |:--------------------------- |:------------------------------------------- |
| `numero_di`                 | `numero_di`                 | número da DI [^1][^2]                       |
| `importador_cnpj`           | `importador.cnpj`           | CNPJ formatado [^1][^2]                     |
| `importador_nome`           | `importador.nome`           | razão social [^1][^2]                       |
| `importador_endereco_uf`    | `importador.endereco_uf`    | UF do endereço [^1][^2]                     |
| `data_registro`             | `data_registro`             | data da DI [^1][^2]                         |
| `data_processamento`        | `data_processamento`        | gerada no salvamento [^2]                   |
| `urf_despacho`              | `urf_despacho_nome`         | nome da URF; código não persistido [^1][^2] |
| `modalidade`                | `modalidade_nome`           | descrição; código não persistido [^1][^2]   |
| `situacao`                  | `situacao_entrega`          | status da carga [^1][^2]                    |
| `total_adicoes`             | `total_adicoes`             | contagem oficial [^1][^2]                   |
| `taxa_cambio`               | `taxa_cambio`               | média ponderada global [^1][^2]             |
| `informacao_complementar`   | `informacao_complementar`   | texto livre [^1][^2]                        |
| `valor_total_fob_usd`       | `valor_total_fob_usd`       | somado no DIProcessor [^2]                  |
| `valor_total_fob_brl`       | `valor_total_fob_brl`       | idem em BRL [^2]                            |
| `valor_total_frete_usd`     | `valor_total_frete_usd`     | idem [^2]                                   |
| `valor_total_frete_brl`     | `valor_total_frete_brl`     | idem [^2]                                   |
| `valor_aduaneiro_total_brl` | `valor_aduaneiro_total_brl` | cálculo final [^2]                          |
| `ncms`                      | `adicoes[].ncm`             | lista p/ buscas [^1][^2]                    |
| `xml_hash`                  | `xml_hash`                  | SHA-256 do XML [^1][^2]                     |

### Adições (store `adicoes`)

| IndexedDBManager          | DIProcessor                           | Observação                     |
|:------------------------- |:------------------------------------- |:------------------------------ |
| `numero_adicao`           | `numero_adicao`                       | valor extraído do XML [^1][^2] |
| `ncm`                     | `ncm`                                 | código de 8 dígitos [^1][^2]   |
| `descricao_ncm`           | `descricao_ncm`                       | descrição da NCM [^1][^2]      |
| `valor_moeda_negociacao`  | `valor_moeda_negociacao`              | FOB moeda original [^1][^2]    |
| `valor_reais`             | `valor_reais`                         | FOB em BRL [^1][^2]            |
| `ii_aliquota`             | `tributos.ii_aliquota_ad_valorem`     | alíquota ad valorem [^1][^2]   |
| `ii_valor_devido`         | `tributos.ii_valor_devido`            | montante devido [^1][^2]       |
| `ipi_aliquota`            | `tributos.ipi_aliquota_ad_valorem`    | % IPI [^1][^2]                 |
| `ipi_valor_devido`        | `tributos.ipi_valor_devido`           | valor IPI [^1][^2]             |
| `pis_aliquota`            | `tributos.pis_aliquota_ad_valorem`    | % PIS [^1][^2]                 |
| `pis_valor_devido`        | `tributos.pis_valor_devido`           | valor PIS [^1][^2]             |
| `cofins_aliquota`         | `tributos.cofins_aliquota_ad_valorem` | % COFINS [^1][^2]              |
| `cofins_valor_devido`     | `tributos.cofins_valor_devido`        | valor COFINS [^1][^2]          |
| `icms_aliquota`           | `tributos.icms_aliquota`              | % ICMS (calculada) [^1][^2]    |
| `frete_valor_reais`       | `frete_valor_reais`                   | frete em BRL [^1][^2]          |
| `seguro_valor_reais`      | `seguro_valor_reais`                  | seguro em BRL [^1][^2]         |
| `peso_liquido`            | `peso_liquido`                        | kg líquidos [^1][^2]           |
| `condicao_venda_incoterm` | `condicao_venda_incoterm`             | INCOTERM [^1][^2]              |
| `fornecedor_nome`         | `fornecedor_nome`                     | exportador [^1][^2]            |
| `fabricante_nome`         | `fabricante_nome`                     | fabricante real [^1][^2]       |

### Produtos (store `produtos`)

| IndexedDBManager | DIProcessor              | Observação                   |
|:---------------- |:------------------------ |:---------------------------- |
| `codigo`         | `numero_sequencial_item` | sequencial do item [^1][^2]  |
| `descricao`      | `descricao_mercadoria`   | descrição comercial [^1][^2] |
| `ncm`            | herda `adicao.ncm`       | redundância p/ busca [^2]    |
| `quantidade`     | `quantidade`             | número de unidades [^1][^2]  |
| `unidade_medida` | `unidade_medida`         | sigla UN [^1][^2]            |
| `valor_unitario` | `valor_unitario`         | preço unitário BRL [^1][^2]  |
| `valor_total`    | `valor_total`            | total item BRL [^1][^2]      |

### Dados de carga (store `dados_carga`)

| IndexedDBManager     | DIProcessor                   | Observação                    |
|:-------------------- |:----------------------------- |:----------------------------- |
| `peso_bruto`         | `carga.peso_bruto`            | kg brutos [^1][^2]            |
| `peso_liquido`       | `carga.peso_liquido`          | kg líquidos [^1][^2]          |
| `via_transporte`     | `carga.via_transporte_nome`   | ex.: Marítima [^1][^2]        |
| `nome_veiculo`       | `carga.nome_veiculo`          | navio/avião [^1][^2]          |
| `nome_transportador` | `carga.nome_transportador`    | armador ou cia aérea [^1][^2] |
| `pais_procedencia`   | `carga.pais_procedencia_nome` | país origem [^1][^2]          |
| `data_chegada`       | `carga.data_chegada`          | DD/MM/AAAA [^1][^2]           |

### Despesas aduaneiras (store `despesas_aduaneiras`)

| IndexedDBManager | DIProcessor                                    | Observação                    |
|:---------------- |:---------------------------------------------- |:----------------------------- |
| `tipo`           | chave em `despesas_aduaneiras` (ex.: SISCOMEX) | categoria da despesa [^1][^2] |
| `valor`          | valor correspondente                           | montante BRL [^1][^2]         |
| `codigo_receita` | código calculado                               | mapeado via JSON [^2]         |

Esses quadros mostram que a persistência preserva quase todos os nomes originais, mudando apenas quando:

1. Precisa separar dados em tabelas planas (ex.: tributos agregados viram colunas simples).
2. Simplifica nomes longos (ex.: `urf_despacho_nome` ➜ `urf_despacho`).[^2]
   
   ```
   <div style="text-align: center">⁂</div>
   ```

[^1]: DIProcessor.js

[^2]: IndexedDBManager.js

Com base na análise dos dois arquivos, identifiquei várias discrepâncias na nomenclatura que precisam ser corrigidas no **IndexedDBManager.js** para seguir exatamente os nomes criados pelo **DIProcessor.js**:

## Correções Necessárias

## **1. Tabela `declaracoes`**

**Campos que precisam ser renomeados:**

- `urf_despacho` → `urf_despacho_nome`

- `modalidade` → `modalidade_nome`

- `situacao` → `situacao_entrega`

**Campos que precisam ser adicionados:**

- `urf_despacho_codigo` (atualmente não persistido)

- `modalidade_codigo` (atualmente não persistido)

- `incoterm_identificado` (estrutura completa do incoterm)

**Campos do importador que precisam ser adicionados:**

- `importador_endereco_logradouro`

- `importador_endereco_numero`

- `importador_endereco_complemento`

- `importador_endereco_bairro`

- `importador_endereco_cidade`

- `importador_endereco_municipio`

- `importador_endereco_cep`

- `importador_representante_nome`

- `importador_representante_cpf`

- `importador_telefone`

- `importador_endereco_completo`

## **2. Tabela `adicoes`**

**Campos que precisam ser renomeados:**

- `ii_aliquota` → `ii_aliquota_ad_valorem`

- `ipi_aliquota` → `ipi_aliquota_ad_valorem`

- `pis_aliquota` → `pis_aliquota_ad_valorem`

- `cofins_aliquota` → `cofins_aliquota_ad_valorem`

**Campos que precisam ser adicionados:**

- `codigo_naladi_sh`

- `codigo_naladi_ncca`

- `quantidade_estatistica`

- `unidade_estatistica`

- `aplicacao_mercadoria`

- `condicao_mercadoria`

- `condicao_venda_local`

- `moeda_negociacao_codigo`

- `moeda_negociacao_nome`

- `metodo_valoracao_codigo`

- `metodo_valoracao_nome`

- `ii_valor_recolher`, `ii_base_calculo`

- `ipi_valor_recolher`

- `pis_valor_recolher`

- `cofins_valor_recolher`

- `cide_valor_devido`, `cide_valor_recolher`

- `pis_cofins_base_calculo`

## **3. Tabela `produtos`**

**Campos que precisam ser renomeados:**

- `codigo` → `numero_sequencial_item`

- `descricao` → `descricao_mercadoria`

- `valor_unitario` → `valor_unitario_brl` (para clareza)

- `valor_total` → `valor_total_brl` (para clareza)

**Campos que precisam ser adicionados:**

- `valor_unitario_usd`

- `valor_total_usd`

- `taxa_cambio`

## **4. Tabela `dados_carga`**

**Campos que precisam ser renomeados/expandidos:**

- `via_transporte` → dividir em `via_transporte_codigo` e `via_transporte_nome`

- `pais_procedencia` → dividir em `pais_procedencia_codigo` e `pais_procedencia_nome`

**Campos que precisam ser adicionados:**

- `urf_entrada_codigo`

- `urf_entrada_nome`

## **5. Estrutura de Fornecedor e Fabricante**

**Criar tabelas separadas ou expandir campos na tabela `adicoes`:**

- `fornecedor_logradouro`, `fornecedor_numero`, `fornecedor_complemento`

- `fornecedor_cidade`, `fornecedor_estado`

- `fabricante_logradouro`, `fabricante_numero`

- `fabricante_cidade`, `fabricante_estado`

## **6. Ajustes no método `saveDI()`**

**Corrigir os acessos aos campos aninhados:**

javascript

`// ATUAL (incorreto): urf_despacho: diData.urf_despacho, // CORRETO: urf_despacho_codigo: diData.urf_despacho_codigo, urf_despacho_nome: diData.urf_despacho_nome,`

**Corrigir acesso aos tributos:**

javascript

`// ATUAL (incorreto): ii_aliquota: adicao.tributos?.ii_aliquota_ad_valorem, // MANTER (já correto, mas renomear campo): ii_aliquota_ad_valorem: adicao.tributos?.ii_aliquota_ad_valorem,`

## **7. Ajustes no método `getDI()`**

**Corrigir a reconstrução da estrutura de tributos** para usar os nomes corretos dos campos do banco.

Essas correções garantirão que o IndexedDBManager.js preserve exatamente a nomenclatura e estrutura de dados criada pelo DIProcessor.js, mantendo a consistência e rastreabilidade completa entre o processamento XML e a persistência no banco de dados.
