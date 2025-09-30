# Nomenclatura Oficial Consolidada - DIProcessor XML

## Autoridade e Hierarquia de Nomenclatura

### DIProcessor.js como PRIMARY CREATOR
**REGRA FUNDAMENTAL**: DIProcessor.js é o único módulo autorizado a criar nomenclatura de campos. Todos os outros módulos DEVEM seguir exatamente seus nomes de campos.

### Hierarquia de Autoridade:
1. **DIProcessor.js**: PRIMARY CREATOR (linha específica onde é definido)
2. **IndexedDBManager.js**: Implementa schema seguindo DIProcessor  
3. **IncentiveManager.js**: PRIMARY CREATOR para campos de incentivos
4. **PricingEngine.js**: PRIMARY CREATOR para campos de precificação
5. **Demais módulos**: CONSUMERS (seguem nomenclatura estabelecida)

## 📋 Estrutura Principal de Nomenclatura

### **Dados Gerais da DI (Registro: `diData`)**

| Campo JavaScript        | Campo XML Origem           | Tipo     | Descrição                             |
|:----------------------- |:-------------------------- |:-------- |:------------------------------------- |
| `numero_di`             | `numeroDI`                 | string   | Número da Declaração de Importação    |
| `data_registro`         | `dataRegistro`             | date     | Data de registro formatada DD/MM/AAAA |
| `urf_despacho_codigo`   | `urfDespachoCodigo`        | string   | Código da URF de despacho             |
| `urf_despacho_nome`     | `urfDespachoNome`          | string   | Nome da URF de despacho               |
| `modalidade_codigo`     | `modalidadeDespachoCodigo` | string   | Código da modalidade de despacho      |
| `modalidade_nome`       | `modalidadeDespachoNome`   | string   | Nome da modalidade de despacho        |
| `situacao_entrega`      | `situacaoEntregaCarga`     | string   | Situação da entrega da carga          |
| `total_adicoes`         | `totalAdicoes`             | integer  | Total de adições na DI                |
| `incoterm_identificado` | `condicaoVendaIncoterm`    | object   | Incoterm identificado automaticamente |
| `canal_parametrizado`   | `canalParametrizado`       | string   | Canal de parametrização da DI         |
| `situacao_especial`     | `situacaoEspecial`         | string   | Situação especial da DI               |
| `valor_total_usd`       | calculado                  | monetary | Valor total da DI em USD              |
| `valor_total_brl`       | calculado                  | monetary | Valor total da DI em BRL              |

### **Dados do Importador (Registro: `diData.importador`)**

| Campo JavaScript         | Campo XML Origem                    | Tipo   | Descrição                           |
|:------------------------ |:----------------------------------- |:------ |:----------------------------------- |
| `nome`                   | `importadorNome`                    | string | Razão social do importador          |
| `cnpj`                   | `importadorNumero`                  | string | CNPJ formatado (XX.XXX.XXX/XXXX-XX) |
| `endereco_logradouro`    | `importadorEnderecoLogradouro`      | string | Logradouro do endereço              |
| `endereco_numero`        | `importadorEnderecoNumero`          | string | Número do endereço                  |
| `endereco_complemento`   | `importadorEnderecoComplemento`     | string | Complemento do endereço             |
| `endereco_bairro`        | `importadorEnderecoBairro`          | string | Bairro do endereço                  |
| `endereco_cidade`        | `importadorEnderecoCidade`          | string | Cidade do endereço                  |
| `endereco_municipio`     | `importadorEnderecoMunicipio`       | string | Município do endereço               |
| `endereco_uf`            | `importadorEnderecoUf`              | string | UF do endereço                      |
| `endereco_cep`           | `importadorEnderecoCep`             | string | CEP formatado (XXXXX-XXX)           |
| `representante_nome`     | `importadorNomeRepresentanteLegal`  | string | Nome do representante legal         |
| `representante_cpf`      | `importadorCpfRepresentanteLegal`   | string | CPF formatado                       |
| `telefone`               | `importadorNumeroTelefone`          | string | Telefone de contato                 |
| `endereco_completo`      | calculado                           | string | Endereço completo concatenado       |
| `porte_empresa`          | `importadorPorte`                   | string | Porte da empresa (MEI/ME/EPP/DG)    |
| `regime_especial`        | `importadorRegimeEspecial`          | string | Regime especial aplicável           |

### **Dados da Carga (Registro: `diData.carga`)**

| Campo JavaScript            | Campo XML Origem                 | Tipo    | Descrição                          |
|:--------------------------- |:-------------------------------- |:------- |:---------------------------------- |
| `peso_bruto`                | `cargaPesoBruto`                 | decimal | Peso bruto da carga (5 decimais)   |
| `peso_liquido`              | `cargaPesoLiquido`               | decimal | Peso líquido da carga (5 decimais) |
| `pais_procedencia_codigo`   | `cargaPaisProcedenciaCodigo`     | string  | Código do país de procedência      |
| `pais_procedencia_nome`     | `cargaPaisProcedenciaNome`       | string  | Nome do país de procedência        |
| `urf_entrada_codigo`        | `cargaUrfEntradaCodigo`          | string  | Código da URF de entrada           |
| `urf_entrada_nome`          | `cargaUrfEntradaNome`            | string  | Nome da URF de entrada             |
| `data_chegada`              | `cargaDataChegada`               | date    | Data de chegada da carga           |
| `via_transporte_codigo`     | `viaTransporteCodigo`            | string  | Código da via de transporte        |
| `via_transporte_nome`       | `viaTransporteNome`              | string  | Nome da via de transporte          |
| `nome_veiculo`              | `viaTransporteNomeTransportador` | string  | Nome do veículo transportador      |
| `nome_transportador`        | `viaTransporteNomeTransportador` | string  | Nome da empresa transportadora     |
| `pais_origem_codigo`        | `cargaPaisOrigemCodigo`          | string  | Código do país de origem           |
| `pais_origem_nome`          | `cargaPaisOrigemNome`            | string  | Nome do país de origem             |
| `bandeira_veiculo`          | `viaTransporteBandeira`          | string  | Bandeira do veículo transportador  |

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
| `fabricante_nome`         | `fabricanteNome`             | string   | Nome do fabricante                                     |
| `fabricante_endereco`     | `fabricanteEndereco`         | string   | Endereço do fabricante                                 |
| `exportador_nome`         | `exportadorNome`             | string   | Nome do exportador                                     |
| `exportador_endereco`     | `exportadorEndereco`         | string   | Endereço do exportador                                 |

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
| `ii_aliquota_especifica`     | `iiAliquotaEspecifica`        | monetary   | Alíquota específica do II     |
| `ipi_aliquota_especifica`    | `ipiAliquotaEspecifica`       | monetary   | Alíquota específica do IPI    |

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
| `numero_lote`            | `numeroLote`           | string   | Número do lote            |
| `data_fabricacao`        | `dataFabricacao`       | date     | Data de fabricação        |
| `data_validade`          | `dataValidade`         | date     | Data de validade          |

### **Despesas Aduaneiras (Registro: `diData.despesas_aduaneiras`)**

| Fonte XML                                          | Campo DIProcessor                      | Código Receita | Tipo de Despesa          | Descrição                              |
| :------------------------------------------------- | :------------------------------------- | :------------- | :----------------------- | :------------------------------------- |
| `<pagamento><codigoReceita>7811</codigoReceita>`   | `despesas.calculadas.siscomex`         | 7811           | SISCOMEX                 | Taxa de Utilização do SISCOMEX         |
| `<pagamento><codigoReceita>5529</codigoReceita>`   | `despesas.calculadas.anti_dumping`     | 5529           | ANTI_DUMPING             | Direito Antidumping                    |
| `<pagamento><codigoReceita>5622</codigoReceita>`   | `despesas.calculadas.medida_compensatoria` | 5622       | MEDIDA_COMPENSATORIA     | Medida Compensatória                   |
| `<pagamento><codigoReceita>5651</codigoReceita>`   | `despesas.calculadas.medida_salvaguarda`   | 5651       | MEDIDA_SALVAGUARDA       | Medida de Salvaguarda                  |
| `<pagamento><codigoReceita>0086</codigoReceita>`   | `despesas.pagamentos[]`                | 0086           | II_OUTROS                | II - Outros                            |
| `<pagamento><codigoReceita>1038</codigoReceita>`   | `despesas.pagamentos[]`                | 1038           | IPI_VINCULADO            | IPI Vinculado Importação               |
| `<acrescimo><codigoAcrescimo>16</codigoAcrescimo>` | `despesas.calculadas.capatazia`        | 16             | CAPATAZIA                | Capatazia                              |
| `<acrescimo><codigoAcrescimo>17</codigoAcrescimo>` | `despesas.calculadas.taxa_ce`          | 17             | TAXA_CE                  | Taxa CE                                |
| `informacaoComplementar`                           | `despesas.calculadas.afrmm`            | AFRMM          | AFRMM                    | Adicional Frete Renovação Marinha Mercante |
| `<pagamento><codigoReceita>3051</codigoReceita>`   | `despesas.calculadas.taxa_utilizacao_importacao` | 3051    | TAXA_UTILIZACAO         | Taxa de Utilização - Importação       |
| `<pagamento><codigoReceita>7849</codigoReceita>`   | `despesas.calculadas.armazenagem`      | 7849           | ARMAZENAGEM              | Taxa de Armazenagem                    |

### **Incentivos Fiscais (Registro: `diData.incentivos`)**

| Campo JavaScript        | Módulo Criador           | Tipo    | Descrição                                     |
|:----------------------- |:------------------------ |:------- |:--------------------------------------------- |
| `possui_incentivo`      | IncentiveManager.js      | boolean | Indica se a empresa possui incentivo fiscal   |
| `programa_selecionado`  | IncentiveManager.js      | string  | Código do programa de incentivo selecionado   |
| `programas_disponiveis` | IncentiveManager.js      | array   | Lista de programas disponíveis para o estado  |
| `estado_empresa`        | IncentiveManager.js      | string  | Estado da empresa (UF do importador)          |
| `estado_programa`       | IncentiveManager.js      | string  | Estado do programa selecionado                |
| `cross_state`           | IncentiveManager.js      | boolean | Indica se é simulação cross-estado            |
| `incentivo_aplicado`    | IncentiveManager.js      | object  | Dados do incentivo aplicado na importação     |
| `beneficio_entrada`     | IncentiveManager.js      | object  | Dados do benefício na entrada                 |
| `beneficio_saida`       | IncentiveManager.js      | object  | Dados do benefício na saída                   |

### **Dados de Precificação (Registro: `diData.precificacao`)**

| Campo JavaScript        | Módulo Criador      | Tipo       | Descrição                                            |
|:----------------------- |:------------------- |:---------- |:---------------------------------------------------- |
| `regime_tributario`     | PricingEngine.js    | string     | Regime tributário (lucro_real/presumido/simples)    |
| `custo_base`           | PricingEngine.js    | monetary   | Custo base calculado (sem créditos)                 |
| `custo_desembolso`     | PricingEngine.js    | monetary   | Custo de desembolso (com créditos)                  |
| `custo_contabil`       | PricingEngine.js    | monetary   | Custo contábil (com encargos)                       |
| `base_formacao_preco`  | PricingEngine.js    | monetary   | Base para formação de preço                         |
| `creditos_pis`         | PricingEngine.js    | monetary   | Valor de crédito PIS                                |
| `creditos_cofins`      | PricingEngine.js    | monetary   | Valor de crédito COFINS                             |
| `creditos_ipi`         | PricingEngine.js    | monetary   | Valor de crédito IPI                                |
| `creditos_icms`        | PricingEngine.js    | monetary   | Valor de crédito ICMS                               |
| `total_creditos`       | PricingEngine.js    | monetary   | Total de créditos tributários                       |

### **Configurações de Precificação (Registro: `diData.precificacao.configuracao`)**

| Campo JavaScript        | Módulo Criador         | Tipo       | Descrição                                       |
|:----------------------- |:---------------------- |:---------- |:----------------------------------------------- |
| `margem_configurada`    | MarginConfigManager.js | percentage | Margem percentual configurada                   |
| `markup_configurado`    | MarginConfigManager.js | percentage | Markup percentual configurado                   |
| `categoria_produto`     | MarginConfigManager.js | string     | Categoria do produto para margem               |
| `estado_destino`        | PricingEngine.js       | string     | UF de destino para venda                       |
| `tipo_operacao`         | PricingEngine.js       | string     | Tipo de operação (venda/transferencia)         |

### **Produtos com Precificação (Registro: `diData.adicoes[i].produtos[j].precificacao`)**

| Campo JavaScript        | Módulo Criador      | Tipo       | Descrição                                    |
|:----------------------- |:------------------- |:---------- |:--------------------------------------------- |
| `custo_unitario_final`  | PricingEngine.js    | monetary   | Custo unitário final com impostos           |
| `margem_aplicada`       | PricingEngine.js    | percentage | Margem aplicada ao produto                  |
| `preco_venda_sugerido`  | PricingEngine.js    | monetary   | Preço de venda sugerido                     |
| `preco_venda_minimo`    | PricingEngine.js    | monetary   | Preço mínimo para cobrir custos             |
| `preco_venda_maximo`    | PricingEngine.js    | monetary   | Preço máximo sugerido                       |

## 🗄️ Schema IndexedDB Oficial

### **Tabelas Principais**

| Tabela                   | Campos Principais                                         | Módulo Criador         | Descrição                        |
|:------------------------ |:--------------------------------------------------------- |:---------------------- |:-------------------------------- |
| `declaracoes`            | `id`, `numero`, `valor_aduaneiro`, `produtos`, `adicoes` | IndexedDBManager.js    | Declarações de Importação        |
| `incentivos_entrada`     | `di_id`, `estado`, `tipo_beneficio`                      | IndexedDBManager.js    | Incentivos na entrada            |
| `incentivos_saida`       | `di_id`, `estado`, `operacao`                            | IndexedDBManager.js    | Incentivos na saída              |
| `elegibilidade_ncm`      | `ncm`, `estado`, `incentivo_codigo`                      | IndexedDBManager.js    | Elegibilidade por NCM            |
| `pricing_configurations` | `di_id`, `regime_tributario`, `margens_padrao`           | IndexedDBManager.js    | Configurações de precificação    |
| `cenarios_precificacao`  | `di_id`, `nome_cenario`, `custos_calculados`             | PricingEngine.js       | Cenários de precificação         |
| `historico_precos`       | `produto_id`, `preco_calculado`, `timestamp`             | PricingEngine.js       | Histórico de preços calculados   |

## 🔧 Conversões de Tipos Padronizadas

O sistema utiliza conversões específicas para diferentes tipos de dados:

- **monetary**: Valores monetários em centavos (÷100)
- **weight**: Pesos com 5 decimais (÷100000)
- **unit_value**: Valores unitários com 7 decimais (÷10000000)
- **percentage**: Alíquotas em centésimos (÷100)
- **date**: Datas no formato DD/MM/AAAA
- **string**: Strings UTF-8 normalizadas
- **decimal**: Números com precisão definida

## ⚠️ Nomenclatura Oficial Obrigatória

### **Tabela de Nomenclatura Obrigatória**

| Entidade           | Nome OFICIAL          | Nome PROIBIDO                 | Módulo Criador      | Status      |
| ------------------ | --------------------- | ----------------------------- | ------------------- | ----------- |
| **Produtos/Itens** | `produtos`            | ~~mercadorias~~, ~~items~~    | DIProcessor.js:366  | ✅ CORRIGIDO |
| **Despesas**       | `despesas_aduaneiras` | ~~despesas~~, ~~expenses~~    | DIProcessor.js:1088 | ✅ CORRIGIDO |
| **Adições**        | `adicoes`             | ~~additions~~                 | DIProcessor.js:290  | ✅ CORRETO   |
| **Impostos**       | `tributos`            | ~~impostos~~, ~~taxes~~       | DIProcessor.js:404  | ✅ CORRETO   |
| **Valor BRL**      | `valor_reais`         | ~~valor_brl~~, ~~value_brl~~  | DIProcessor.js:445  | ✅ CORRETO   |
| **Valor USD**      | `valor_dolares`       | ~~valor_usd~~, ~~value_usd~~  | DIProcessor.js:446  | ✅ CORRETO   |
| **NCM**            | `ncm`                 | ~~classificacao~~             | DIProcessor.js:398  | ✅ CORRETO   |
| **Peso Líquido**   | `peso_liquido`        | ~~peso_net~~, ~~net_weight~~  | DIProcessor.js:401  | ✅ CORRETO   |

### **Campos Numéricos Obrigatórios**

| Campo             | Tipo     | Validação                    | Exemplo    |
| ----------------- | -------- | ---------------------------- | ---------- |
| `valor_aduaneiro` | Number   | parseFloat() + isNaN check   | 15000.50   |
| `valor_frete`     | Number   | parseFloat() + isNaN check   | 500.00     |
| `valor_seguro`    | Number   | parseFloat() + isNaN check   | 150.00     |
| `peso_liquido`    | Number   | parseFloat() + isNaN check   | 1250.75    |

## 🚫 Validações de Nomenclatura (NO FALLBACKS)

### **Validações para Incentivos**
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

### **Validações para Precificação**
```javascript
// ✅ OBRIGATÓRIO: Validação em todos os módulos de precificação
if (objeto.tax_regime) {
    throw new Error('VIOLAÇÃO NOMENCLATURA: Use "regime_tributario" não "tax_regime"');
}

if (objeto.base_cost !== undefined) {
    throw new Error('VIOLAÇÃO NOMENCLATURA: Use "custo_base" não "base_cost"');  
}

if (objeto.suggested_price) {
    throw new Error('VIOLAÇÃO NOMENCLATURA: Use "preco_venda_sugerido" não "suggested_price"');
}
```

## 📝 Parsing Obrigatório para Campos Numéricos

```javascript
// Em carregarDadosDI() antes de validarDadosDI()
function garantirTiposNumericos(dadosDI) {
    const camposNumericos = [
        'valor_aduaneiro', 'valor_frete', 'valor_seguro', 
        'peso_liquido', 'peso_bruto'
    ];
    
    for (let campo of camposNumericos) {
        if (dadosDI[campo] !== undefined) {
            dadosDI[campo] = parseFloat(dadosDI[campo]) || 0;
        }
    }
    
    return dadosDI;
}
```

## 🏗️ Hierarquia de Autoridade Completa

1. **DIProcessor.js**: PRIMARY CREATOR para nomenclatura de campos XML
2. **IncentiveManager.js**: PRIMARY CREATOR para nomenclatura de incentivos
3. **PricingEngine.js**: PRIMARY CREATOR para nomenclatura de custos e preços
4. **MarginConfigManager.js**: PRIMARY CREATOR para configurações de margem
5. **IndexedDBManager.js**: CONSUMER (implementa schema seguindo creators)
6. **Demais módulos**: CONSUMERS (seguem nomenclatura estabelecida)

## 📊 Histórico de Correções

### **29/09/2025 - Documento Consolidado**
- Unificação dos documentos de nomenclatura
- Complementação com campos ausentes (AFRMM, CIDE, etc.)
- Padronização completa da documentação

### **27/09/2025 - Refatoração Arquitetural SOLID**
- **Separação de Responsabilidades**: Cálculos movidos dos exportadores para calculators
- **Novos campos calculados**:
  - `totais_relatorio`: Totais agregados para relatórios (croqui NF, PDF)
  - `totais_por_coluna`: Totais agregados por tipo para planilhas Excel

### **26/09/2025 - Correção Bug Validação Numérica**
- **Problema**: Campos numéricos armazenados como strings no IndexedDB
- **Solução**: Parsing obrigatório com parseFloat() antes da validação
- **Arquivos afetados**: pricing-interface.js (carregarDadosDI)

---

**Esta nomenclatura padronizada permite o processamento consistente de XMLs de DI, mantendo a rastreabilidade entre os campos originais do XML e a estrutura de dados JavaScript resultante.**

*Documento gerado automaticamente baseado em DIProcessor.js, IncentiveManager.js, PricingEngine.js*