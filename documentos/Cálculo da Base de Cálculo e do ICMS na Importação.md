<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# Cálculo da Base de Cálculo e do ICMS na Importação

**Principais conclusões:**
Ao importar mercadorias, a **base de cálculo** do ICMS (BC ICMS) incorpora todos os tributos e despesas aduaneiras incidentes até o desembaraço, e o imposto é apurado multiplicando-se essa base pela alíquota estadual aplicável.

## 1. Composição da Base de Cálculo do ICMS

A legislação estadual (art. 37, IV do RICMS/2000) estabelece que, no desembaraço aduaneiro, a base de cálculo do ICMS é:

$$
\text{BC ICMS} = \frac{\text{VDI} + \text{II} + \text{IPI} + \text{PIS} + \text{COFINS} + \text{Demais taxas e despesas}}{1 - \text{alíquota ICMS}}
$$

Onde:

- **VDI (Valor Aduaneiro)**
= valor da mercadoria (FOB) + frete internacional + seguro + despesas aduaneiras pré-desembaraço
- **II (Imposto de Importação)**
- **IPI (Imposto sobre Produtos Industrializados)**
- **PIS/COFINS de importação**
- **Demais taxas e despesas aduaneiras** (Siscomex, AFRMM, multas, armazenagem, etc.)

A divisão por $1 - \text{alíquota ICMS}$ “insere” o próprio ICMS na base, pois o imposto incide sobre si mesmo[^1].

## 2. Exemplo Prático

Suponha importação com os seguintes valores e alíquota de 18%:


| Item | Valor (R\$) |
| :-- | --: |
| Mercadoria (FOB) | 10.000,00 |
| Frete Internacional | 2.000,00 |
| Seguro Internacional | 500,00 |
| Despesas Aduaneiras | 300,00 |
| **Valor Aduaneiro (VDI)** | 12.800,00 |
| II (10% sobre VDI) | 1.280,00 |
| PIS/COFINS (9,65% sobre VDI) | 1.236,00 |
| **Somatório antes da inclusão do ICMS** | 15.316,00 |

Cálculo da base com inserção do ICMS:

$$
\text{BC ICMS} = \frac{15.316,00}{1 - 0{,}18} 
              = \frac{15.316,00}{0{,}82} 
              = 18.680,49
$$

Valor do ICMS:

$$
\text{ICMS} = 18{,}680,49 \times 0{,}18 
            = 3.362,49
$$

## 3. Apuração do ICMS

Após determinar a BC ICMS, basta aplicar a **alíquota interna** do estado de destino:

$$
\text{ICMS a pagar} = \text{BC ICMS} \times \text{alíquota}
$$

- Para importações diretas, a alíquota interna varia de 7% a 18% (cada UF tem sua tabela).
- Em operações interestaduais, aplica-se 4% para todos os produtos importados (convênio Senadº 13/2012), restando o **DIFAL** (diferença entre alíquota interna e 4%) quando houver substituição tributária[^2].


## 4. Responsabilidade e Momento de Ocorrência

- **Fato gerador:** desembaraço aduaneiro.
- **Responsável:** importador (pessoa física ou jurídica) no desembaraço[^3].


## 5. Resumo do Procedimento

1. Calcular o **Valor Aduaneiro** (mercadoria + frete + seguro + despesas).
2. Apurar **II**, **IPI**, **PIS/COFINS** e demais encargos.
3. Somar todos os itens do passo 1 e 2.
4. Dividir pelo fator $(1 - \text{alíquota ICMS})$ para obter a **BC ICMS**.
5. Multiplicar a BC ICMS pela alíquota interna para obter o **ICMS** devido.

Este método garante o correto enquadramento tributário das importações, evitando omissões na base de cálculo e autuações fiscais.

<div style="text-align: center">⁂</div>

[^1]: https://legislacao.fazenda.sp.gov.br/Paginas/RC21794_2020.aspx

[^2]: https://contaazul.com/blog/aprenda-a-fazer-o-calculo-do-icms-para-importacao/

[^3]: https://blog.maino.com.br/icms-na-importacao-entenda-como-funciona/

[^4]: https://ajuda.maino.com.br/pt-BR/articles/6136490-como-calcular-a-base-de-calculo-do-icms-na-importacao

[^5]: https://metodo12p.com.br/2024/09/20/calcular-o-icms-na-importacao/

[^6]: https://cr.inf.br/blog/icms-importacao-como-calcular-o-icms-na-importacao/

[^7]: https://www.remessaonline.com.br/blog/icms-na-importacao/

[^8]: https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/remessas-postal-e-expressa/calculadora-versao-iii/calculadora.html

[^9]: https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/remessas-postal-e-expressa/preciso-pagar-impostos-nas-compras-internacionais/quanto-pagarei-de-imposto

[^10]: https://www.fazcomex.com.br/importacao/icms-na-importacao/

[^11]: https://qive.com.br/blog/icms-na-importacao/

[^12]: https://atendimento.receita.rs.gov.br/calculo-do-icms-importacao

[^13]: https://internet.sefaz.es.gov.br/informacoes/tributacao/detalharParecer.php?tipo=7\&numero=201502693

