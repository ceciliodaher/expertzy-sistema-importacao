<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

## Fluxo de trabalho até a emissão da Nota Fiscal

**Visão-geral**
A planilha “ENTRA-DI-Detalhado-v-4.1.xlsx” funciona como um roteiro completo que começa com os dados de importação e termina com a formação de preços e impostos que alimentam a emissão da Nota Fiscal brasileira (NF-e). Cada aba representa uma etapa sequencial e, em várias delas, as fórmulas já automatizam cálculos de peso, custo, tributos e margens. O percurso resumido é o seguinte:


| Ordem | Aba | Propósito principal | Saída que alimenta a etapa seguinte |
| :-- | :-- | :-- | :-- |
| 1 | ADMIN_INVOICE-PL | Carga do Packing List e dos itens da fatura comercial (descrição, NCM, quantidade, peso bruto/liquido). | Base de itens para DI e cálculo de custos. |
| 2 | ADMIN_FACTURA | Replica a fatura, mas já com campos para adição (nº Adição do Siscomex) e unitização de frete; serve como “espelho” que será importado pelo despachante. | Alimenta a aba **ADMIN_Adições**. |
| 3 | ADMIN_ESPELHO DI | Consolida valores aduaneiros (VML E, frete, seguro), tributos federais (II, IPI, PIS, Cofins) e ICMS estimado. | Gera totais para o despachante registrar a DI. |
| 4 | ADMIN_Adições | Aplica alíquotas por NCM, divide peso líquido, calcula BC-ICMS, MVA, ST, Siscomex e despesas internas. | Traz para **ADMIN_Detalhamento** o custo real por item. |
| 5 | ADMIN_Detalhamento | Explode cada item por caixa, calcula custo unitário CIF+despesas+impostos e gera “custo contábil” unitário. | Entrega custos para precificação. |
| 6 | ADMIN_Câmbio | Guarda cotações de fechamento de câmbio US$/R$ e registra contratos de câmbio vinculados. | Ajusta valores em real usados nas abas de preço. |
| 7 | ADMIN_Impostos / ADMIN_Alíq Estados / ADMIN_Fundo-Pobreza | Tabelas-base com alíquotas II, IPI, PIS, Cofins, ICMS interno, MVA, DIFAL e FCP por estado. | Fórmulas de preço buscam esses percentuais. |
| 8 | Preço Venda (UF-CONSUMIDOR / UF-REVENDA) | Para cada destino (ex.: GO-CONSUMIDOR, SP-CONSUMIDOR, GO-REVENDA) calcula: custo+IPI, créditos, comissão, frete, margem desejada, ST/DIFAL e gera preço sugerido c/-s/ IPI. | Resultado final para emissão da NF-e. |
| 9 | ADMIN_Tributos | Estrutura comparativa de regimes (Lucro Real, Presumido, Simples) usada para simular carga tributária pós-venda. | Ajusta margens se a empresa for Simples Nacional. |
| 10 | **Emissão da NF-e** | Os preços, NCM, CFOP, ICMS, FCP, ST e totais de cada cliente (revenda ou consumidor final) são exportados ao ERP para gerar a NF-e. | NF-e pronta com todos tributos destacados e base para escrituração. |

### Etapas detalhadas

1. **Cadastro inicial**
    - Importação automática do XML da fatura ou digitação manual em ADMIN_INVOICE-PL.
    - Checagem de NCM e pesos; conferência de volumes.
2. **Espelho da fatura para DI**
    - ADMIN_FACTURA acrescenta número da adição, atribui frete unitário e já calcula “TOTAL US\$”.
    - Planilha entrega arquivo CSV/Excel ao despachante que fará o upload no Siscomex.
3. **Simulação aduaneira**
    - No ESPELHO DI a empresa insere o número de DI, data de registro e confirma os valores “baixados” pelo Siscomex.
    - Tributos federais são recalculados para conferir diferenças antes do pagamento dos DARFs.
4. **Custo por adição e por item**
    - ADMIN_Adições aplica alíquotas obtidas de ADMIN_Impostos; cada linha vira “adição.NCM”.
    - Despesas de nacionalização (capatazia, armazenagem, despachante) são rateadas.
5. **Custo contábil unitário**
    - ADMIN_Detalhamento quebra o custo por unidade/caixa, aplicando crédito presumido de ICMS quando o estado concede (ex.: PE-PRODEPE).
    - Resultado: “CUSTO UNIT” que já inclui impostos recuperáveis.
6. **Fechamento de câmbio**
    - Cotações reais (aba ADMIN_Câmbio) substituem estimativas; diferenças cambiais são lançadas contra cada adição.
7. **Precificação**
    - Usuário escolhe destino (estado e tipo de cliente).
    - Planilha puxa ICMS interno, MVA ou DIFAL + FCP da aba de alíquotas.
    - Campos editáveis: comissão, frete, margem desejada.
    - Fórmulas devolvem:
    - Preço venda **s/IPI** (base do DANFE)
    - Preço venda **c/IPI** (para consumidor final)
    - ST/DIFAL calculado, quando aplicável.
    - Colunas de carga tributária mostram % total de impostos na operação.
8. **Exportação ao ERP**
    - Preços e impostos aprovados são exportados (macro ou copiar-colAR) para o módulo de faturamento.
    - O ERP gera a NF-e, destacando ICMS, IPI, PIS/Cofins e, se for o caso, ST ou DIFAL com FCP.

### Controles adicionais

- **Validação tributária** – as abas de Impostos cruzam NCM x UF e sinalizam quando não há alíquota cadastrada.
- **Fundos estaduais (FCP)** – a aba ADMIN_Fundo-Pobreza determina o adicional do ICMS para DIFAL.
- **Regime tributário** – ADMIN_Tributos permite simular margens diferentes se a empresa migrar de Lucro Presumido para Simples, ajustando PIS/Cofins.


### Resultado

Quando a última aba de preço mostra “MARGEM OBTIDA” ≥ “MARGEM DESEJADA” e não há diferença de câmbio pendente, a planilha está pronta para alimentar o ERP. A NF-e emitida refletirá exatamente:

- Código NCM e CFOP corretos.
- Base ICMS, ICMS próprio, ICMS ST/DIFAL e FCP (quando houver).
- IPI destacado ou incluso, conforme cliente.
- PIS/Cofins destacados.
- Valor total de mercadorias com a margem aprovada.

Assim, o fluxo planilha → DI → custo → preço → ERP garante que todas as variáveis de importação e tributação estejam validadas antes da emissão da Nota Fiscal.

<div style="text-align: center">⁂</div>

[^1]: ENTRA-DI-Detalhado-v-4.1.xlsx

