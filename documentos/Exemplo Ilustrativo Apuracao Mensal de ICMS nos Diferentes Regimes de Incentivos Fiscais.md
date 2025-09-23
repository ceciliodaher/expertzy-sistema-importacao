# Exemplo Ilustrativo: Apuração Mensal de ICMS nos Diferentes Regimes de Incentivos Fiscais

A análise comparativa dos benefícios fiscais à importação nos estados de Santa Catarina e Goiás ficaria incompleta sem uma demonstração prática da apuração mensal do ICMS em cada um dos regimes estudados. Para proporcionar uma compreensão mais aplicada e operacional, desenvolvi exemplos ilustrativos de apuração para cada modalidade de incentivo, considerando um mix de operações que reflete a realidade de empresas importadoras com operações diversificadas.

## Premissas Metodológicas

Para garantir a comparabilidade entre os diferentes regimes, adotarei as seguintes premissas comuns para todos os exemplos:

O período de apuração corresponde a um mês fiscal típico, com as seguintes operações:

- **Importações realizadas no período:** 3 processos totalizando US$ 150.000,00 (equivalente a R\$ 900.000,00 de valor FOB)
- **Operações de saída no período:**
  - Vendas interestaduais para contribuintes: R$ 750.000,00
  - Vendas internas para contribuintes normais: R$ 300.000,00
  - Vendas internas para empresas do Simples Nacional sem ST: R$ 200.000,00
  - Vendas internas para empresas do Simples Nacional com ST: R$ 150.000,00
  - Vendas internas para consumidores finais (pessoas físicas): R$ 100.000,00

Os custos logísticos aduaneiros seguem os parâmetros documentados: R$ 15,70/TEU para Santa Catarina e R\$ 22,30/TEU para Goiás.

Por simplificação, consideraremos que todas as mercadorias foram vendidas no mesmo período fiscal em que ocorreram as importações, embora na prática exista defasagem temporal entre entrada e saída dos produtos.

## 1. Apuração Mensal - TTD 409 (Fase 1)

A primeira modalidade a ser analisada é o TTD 409 em sua fase inicial (primeiros 36 meses de operação), caracterizado pela aplicação de alíquota de 2,6% sobre o valor aduaneiro na importação e tributação diferenciada nas saídas.

### 1.1 Operações de Entrada (Importações)

O processo de apuração inicia-se com o registro das importações realizadas no período:

| Processo  | Valor FOB (R$) | Valor Aduaneiro (SC) | Alíquota Antecipação | ICMS a Recolher |
| --------- | -------------- | -------------------- | -------------------- | --------------- |
| IMP-001   | 300.000,00     | 304.710,00           | 2,6%                 | 7.922,46        |
| IMP-002   | 300.000,00     | 304.710,00           | 2,6%                 | 7.922,46        |
| IMP-003   | 300.000,00     | 304.710,00           | 2,6%                 | 7.922,46        |
| **Total** | **900.000,00** | **914.130,00**       | **-**                | **23.767,38**   |

O recolhimento do ICMS de antecipação ocorre individualmente para cada processo, mediante guias específicas emitidas no momento do desembaraço aduaneiro.

### 1.2 Operações de Saída

As operações de saída no período fiscal seguem a estrutura de tributação característica do TTD 409 em sua fase inicial:

| Tipo de Operação                        | Valor Total      | Alíquota Destaque | ICMS Destacado | Alíquota Efetiva | ICMS Efetivo  | Fundos (0,4%) |
| --------------------------------------- | ---------------- | ----------------- | -------------- | ---------------- | ------------- | ------------- |
| Vendas interestaduais                   | 750.000,00       | 4%                | 30.000,00      | 2,6%             | 19.500,00     | 3.000,00      |
| Vendas internas (contribuintes normais) | 300.000,00       | 4%                | 12.000,00      | 2,6%             | 7.800,00      | 1.200,00      |
| Vendas internas (Simples sem ST)        | 200.000,00       | 12%               | 24.000,00      | 7,6%             | 15.200,00     | 800,00        |
| Vendas internas (Simples com ST)        | 150.000,00       | 4%                | 6.000,00       | 2,6%             | 3.900,00      | 600,00        |
| Vendas internas (pessoas físicas)       | 100.000,00       | 17%               | 17.000,00      | 17,0%            | 17.000,00     | 0,00          |
| **Total**                               | **1.500.000,00** | **-**             | **89.000,00**  | **-**            | **63.400,00** | **5.600,00**  |

### 1.3 Apuração Consolidada

A apuração consolidada do período exige o registro do ICMS devido nas saídas, o cálculo do crédito presumido conforme regras do TTD 409, e a compensação dos pagamentos antecipados na importação:

```
APURAÇÃO DE ICMS - TTD 409 (FASE 1)
Período: MM/AAAA

1. DÉBITOS DO REGIME
   1.1 ICMS nas saídas (efetivo) ........................... R$ 63.400,00
   1.2 Contribuição ao Fundo de Educação ................... R$ 5.600,00
   1.3 Total de débitos .................................... R$ 69.000,00

2. CRÉDITOS DO REGIME
   2.1 ICMS pago na importação (antecipação) ............... R$ 23.767,38
   2.2 Total de créditos ................................... R$ 23.767,38

3. SALDO APURADO
   3.1 Saldo devedor (1.3 - 2.2) ........................... R$ 45.232,62

4. OBRIGAÇÕES A RECOLHER
   4.1 ICMS a recolher ..................................... R$ 39.632,62
   4.2 Fundo de Educação ................................... R$ 5.600,00
   4.3 Total a recolher .................................... R$ 45.232,62
```

### 1.4 Considerações Específicas do TTD 409 (Fase 1)

A apuração do TTD 409 em sua fase inicial apresenta características operacionais específicas que merecem destaque:

O recolhimento das antecipações na importação ocorre de forma desvinculada da apuração mensal, mediante guias individuais por processo de importação.

A contribuição ao Fundo de Educação (0,4%) é calculada sobre o valor total das operações de saída, independentemente do tipo de destinatário, e constitui obrigação distinta do ICMS, com código de recolhimento específico.

A carga tributária efetiva varia conforme o tipo de operação, sendo mais favorável para vendas interestaduais e para contribuintes normais (3% efetivo), intermediária para vendas a optantes do Simples Nacional sem ST (8% efetivo) e sem benefício para vendas a consumidores finais (17% integral).

As guias de recolhimento possuem datas de vencimento distintas: o ICMS a recolher vence até o 10º dia do mês subsequente, enquanto a contribuição ao Fundo de Educação vence até o 20º dia.

## 2. Apuração Mensal - TTD 409 (Fase 2)

Na segunda fase do TTD 409, após 36 meses de operação, verifica-se redução significativa nas alíquotas efetivas, tanto na importação quanto nas saídas, alterando substancialmente a estrutura da apuração.

### 2.1 Operações de Entrada (Importações)

| Processo  | Valor FOB (R$) | Valor Aduaneiro (SC) | Alíquota Antecipação | ICMS a Recolher |
| --------- | -------------- | -------------------- | -------------------- | --------------- |
| IMP-001   | 300.000,00     | 304.710,00           | 1,0%                 | 3.047,10        |
| IMP-002   | 300.000,00     | 304.710,00           | 1,0%                 | 3.047,10        |
| IMP-003   | 300.000,00     | 304.710,00           | 1,0%                 | 3.047,10        |
| **Total** | **900.000,00** | **914.130,00**       | **-**                | **9.141,30**    |

### 2.2 Operações de Saída

| Tipo de Operação                        | Valor Total      | Alíquota Destaque | ICMS Destacado | Alíquota Efetiva | ICMS Efetivo  | Fundos (0,4%) |
| --------------------------------------- | ---------------- | ----------------- | -------------- | ---------------- | ------------- | ------------- |
| Vendas interestaduais                   | 750.000,00       | 4%                | 30.000,00      | 1,0%             | 7.500,00      | 3.000,00      |
| Vendas internas (contribuintes normais) | 300.000,00       | 4%                | 12.000,00      | 1,0%             | 3.000,00      | 1.200,00      |
| Vendas internas (Simples sem ST)        | 200.000,00       | 12%               | 24.000,00      | 3,6%             | 7.200,00      | 800,00        |
| Vendas internas (Simples com ST)        | 150.000,00       | 4%                | 6.000,00       | 1,0%             | 1.500,00      | 600,00        |
| Vendas internas (pessoas físicas)       | 100.000,00       | 17%               | 17.000,00      | 17,0%            | 17.000,00     | 0,00          |
| **Total**                               | **1.500.000,00** | **-**             | **89.000,00**  | **-**            | **36.200,00** | **5.600,00**  |

### 2.3 Apuração Consolidada

```
APURAÇÃO DE ICMS - TTD 409 (FASE 2)
Período: MM/AAAA

1. DÉBITOS DO REGIME
   1.1 ICMS nas saídas (efetivo) ........................... R$ 36.200,00
   1.2 Contribuição ao Fundo de Educação ................... R$ 5.600,00
   1.3 Total de débitos .................................... R$ 41.800,00

2. CRÉDITOS DO REGIME
   2.1 ICMS pago na importação (antecipação) ............... R$ 9.141,30
   2.2 Total de créditos ................................... R$ 9.141,30

3. SALDO APURADO
   3.1 Saldo devedor (1.3 - 2.2) ........................... R$ 32.658,70

4. OBRIGAÇÕES A RECOLHER
   4.1 ICMS a recolher ..................................... R$ 27.058,70
   4.2 Fundo de Educação ................................... R$ 5.600,00
   4.3 Total a recolher .................................... R$ 32.658,70
```

### 2.4 Comparação entre Fases do TTD 409

A redução da alíquota efetiva da Fase 1 para a Fase 2 resulta em economia significativa:

| Componente da Apuração    | TTD 409 (Fase 1) | TTD 409 (Fase 2) | Economia         | Percentual |
| ------------------------- | ---------------- | ---------------- | ---------------- | ---------- |
| ICMS na importação        | R$ 23.767,38     | R$ 9.141,30      | R$ 14.626,08     | 61,5%      |
| ICMS nas saídas (efetivo) | R$ 63.400,00     | R$ 36.200,00     | R$ 27.200,00     | 42,9%      |
| Fundo de Educação         | R$ 5.600,00      | R$ 5.600,00      | R$ 0,00          | 0,0%       |
| **Total a recolher**      | **R$ 45.232,62** | **R$ 32.658,70** | **R$ 12.573,92** | **27,8%**  |

A economia total de 27,8% no valor a recolher demonstra a vantagem significativa da maturação do benefício fiscal após 36 meses de operação.

## 3. Apuração Mensal - TTD 410

O TTD 410 destaca-se pelo diferimento integral do ICMS na importação e pela aplicação de alíquotas reduzidas nas operações de saída, resultando em uma estrutura de apuração substancialmente distinta das anteriores.

### 3.1 Operações de Entrada (Importações)

| Processo  | Valor FOB (R$) | Valor Aduaneiro (SC) | Diferimento | ICMS a Recolher |
| --------- | -------------- | -------------------- | ----------- | --------------- |
| IMP-001   | 300.000,00     | 304.710,00           | 100%        | 0,00            |
| IMP-002   | 300.000,00     | 304.710,00           | 100%        | 0,00            |
| IMP-003   | 300.000,00     | 304.710,00           | 100%        | 0,00            |
| **Total** | **900.000,00** | **914.130,00**       | **-**       | **0,00**        |

No regime TTD 410, o pagamento do ICMS é completamente diferido para o momento da saída das mercadorias, resultando em ausência de recolhimento na etapa de importação.

### 3.2 Operações de Saída

| Tipo de Operação                        | Valor Total      | Alíquota Destaque | ICMS Destacado | Alíquota Efetiva | ICMS Efetivo  | Fundos (0,4%) |
| --------------------------------------- | ---------------- | ----------------- | -------------- | ---------------- | ------------- | ------------- |
| Vendas interestaduais                   | 750.000,00       | 4%                | 30.000,00      | 0,6%             | 4.500,00      | 3.000,00      |
| Vendas internas (contribuintes normais) | 300.000,00       | 4%                | 12.000,00      | 0,6%             | 1.800,00      | 1.200,00      |
| Vendas internas (Simples sem ST)        | 200.000,00       | 12%               | 24.000,00      | 3,6%             | 7.200,00      | 800,00        |
| Vendas internas (Simples com ST)        | 150.000,00       | 4%                | 6.000,00       | 0,6%             | 900,00        | 600,00        |
| Vendas internas (pessoas físicas)       | 100.000,00       | 17%               | 17.000,00      | 17,0%            | 17.000,00     | 0,00          |
| **Total**                               | **1.500.000,00** | **-**             | **89.000,00**  | **-**            | **31.400,00** | **5.600,00**  |

### 3.3 Apuração Consolidada

```
APURAÇÃO DE ICMS - TTD 410
Período: MM/AAAA

1. DÉBITOS DO REGIME
   1.1 ICMS nas saídas (efetivo) ........................... R$ 31.400,00
   1.2 Contribuição ao Fundo de Educação ................... R$ 5.600,00
   1.3 Total de débitos .................................... R$ 37.000,00

2. CRÉDITOS DO REGIME
   2.1 ICMS diferido na importação ......................... R$ 0,00
   2.2 Total de créditos ................................... R$ 0,00

3. SALDO APURADO
   3.1 Saldo devedor (1.3 - 2.2) ........................... R$ 37.000,00

4. OBRIGAÇÕES A RECOLHER
   4.1 ICMS a recolher ..................................... R$ 31.400,00
   4.2 Fundo de Educação ................................... R$ 5.600,00
   4.3 Total a recolher .................................... R$ 37.000,00
```

### 3.4 Considerações Específicas do TTD 410

O TTD 410 apresenta características que o distinguem significativamente dos demais regimes:

O diferimento integral do ICMS na importação elimina o desembolso inicial, proporcionando vantagem significativa de fluxo de caixa, embora resulte em valores superiores a recolher no momento da apuração mensal.

A alíquota efetiva de 0,6% para operações interestaduais e vendas internas a contribuintes normais representa a menor carga tributária entre todos os regimes analisados, resultando em economia de 85% em relação à alíquota de destaque (4%).

A exigência de histórico operacional mínimo de 24 meses com o TTD 409 e faturamento anual de importação superior a R$ 24 milhões restringe o acesso a este benefício, tornando-o seletivo para operações de maior volume.

A economia no ICMS a recolher nas operações de saída, quando comparado com o TTD 409 Fase 2, é de aproximadamente 13,3% (R\$ 31.400,00 versus R$ 36.200,00).

## 4. Apuração Mensal - COMEXPRODUZIR (Goiás)

O programa COMEXPRODUZIR, do estado de Goiás, apresenta estrutura substancialmente distinta dos regimes catarinenses, com mecanismos específicos de crédito outorgado e aplicação de alíquota efetiva mediante redução da base de cálculo.

### 4.1 Operações de Entrada (Importações)

| Processo  | Valor FOB (R$) | Valor Aduaneiro (GO) | Diferimento | ICMS a Recolher |
| --------- | -------------- | -------------------- | ----------- | --------------- |
| IMP-001   | 300.000,00     | 306.690,00           | 100%        | 0,00            |
| IMP-002   | 300.000,00     | 306.690,00           | 100%        | 0,00            |
| IMP-003   | 300.000,00     | 306.690,00           | 100%        | 0,00            |
| **Total** | **900.000,00** | **920.070,00**       | **-**       | **0,00**        |

Assim como no TTD 410, o COMEXPRODUZIR proporciona diferimento integral do ICMS na importação, resultando em ausência de recolhimento nesta etapa.

### 4.2 Operações de Saída

| Tipo de Operação                  | Valor Total      | Alíquota Nominal | ICMS Nominal   | Crédito Outorgado (65%) | ICMS Efetivo  | Contrib. FUNPRODUZIR (5%) | Contrib. PROTEGE (15%) |
| --------------------------------- | ---------------- | ---------------- | -------------- | ----------------------- | ------------- | ------------------------- | ---------------------- |
| Vendas interestaduais             | 750.000,00       | 4%               | 30.000,00      | 19.500,00               | 10.500,00     | 975,00                    | 2.925,00               |
| Vendas internas (contribuintes)   | 650.000,00       | 19%              | 123.500,00     | 0,00                    | 26.000,00     | 0,00                      | 0,00                   |
| Vendas internas (pessoas físicas) | 100.000,00       | 19%              | 19.000,00      | 0,00                    | 19.000,00     | 0,00                      | 0,00                   |
| **Total**                         | **1.500.000,00** | **-**            | **172.500,00** | **19.500,00**           | **55.500,00** | **975,00**                | **2.925,00**           |

As vendas internas para contribuintes beneficiam-se da aplicação de alíquota efetiva de 4% através de redução da base de cálculo, resultando em ICMS efetivo de 26.000,00 ao invés do nominal de 123.500,00.

### 4.3 Apuração Consolidada

```
APURAÇÃO DE ICMS - COMEXPRODUZIR
Período: MM/AAAA

1. DÉBITOS DO REGIME
   1.1 ICMS nas saídas (nominal) ........................... R$ 172.500,00
   1.2 Total de débitos .................................... R$ 172.500,00

2. CRÉDITOS DO REGIME
   2.1 Crédito outorgado (65% sobre interestadual) ......... R$ 19.500,00
   2.2 Redução de base de cálculo (vendas internas) ........ R$ 97.500,00
   2.3 Total de créditos ................................... R$ 117.000,00

3. SALDO APURADO
   3.1 Saldo devedor (1.2 - 2.3) ........................... R$ 55.500,00

4. OBRIGAÇÕES A RECOLHER
   4.1 ICMS a recolher ..................................... R$ 55.500,00
   4.2 Contribuição ao FUNPRODUZIR (5% do crédito) ......... R$ 975,00
   4.3 Contribuição ao PROTEGE (15% do crédito) ............ R$ 2.925,00
   4.4 Total a recolher .................................... R$ 59.400,00
```

### 4.4 Considerações Específicas do COMEXPRODUZIR

O programa COMEXPRODUZIR apresenta características operacionais distintas:

O mecanismo de crédito outorgado de 65% aplica-se exclusivamente às operações interestaduais, resultando em alíquota efetiva de 1,92% após consideradas as contribuições obrigatórias.

As vendas internas para contribuintes beneficiam-se de redução da base de cálculo, resultando em alíquota efetiva de 4%, sem incidência das contribuições ao FUNPRODUZIR e PROTEGE sobre este benefício específico.

As contribuições ao FUNPRODUZIR (5%) e ao PROTEGE (15%) incidem exclusivamente sobre o valor do crédito outorgado concedido nas operações interestaduais, representando contrapartida significativa ao benefício.

A carga tributária efetiva para vendas internas a consumidores finais (19%) é superior à verificada nos regimes catarinenses (17%), impactando operações B2C.

## 5. Análise Comparativa Consolidada

A comparação dos resultados de apuração mensal entre os diferentes regimes fiscais revela impactos significativos na carga tributária efetiva e no fluxo de caixa das operações:

| Componente da Apuração              | TTD 409 (Fase 1) | TTD 409 (Fase 2) | TTD 410          | COMEXPRODUZIR    |
| ----------------------------------- | ---------------- | ---------------- | ---------------- | ---------------- |
| ICMS na importação                  | R$ 23.767,38     | R$ 9.141,30      | R$ 0,00          | R$ 0,00          |
| ICMS nas saídas (efetivo)           | R$ 63.400,00     | R$ 36.200,00     | R$ 31.400,00     | R$ 55.500,00     |
| Fundos/Contribuições específicas    | R$ 5.600,00      | R$ 5.600,00      | R$ 5.600,00      | R$ 3.900,00      |
| **Total a recolher**                | **R$ 45.232,62** | **R$ 32.658,70** | **R$ 37.000,00** | **R$ 59.400,00** |
| **Carga efetiva sobre faturamento** | **3,02%**        | **2,18%**        | **2,47%**        | **3,96%**        |

A análise da carga tributária efetiva sobre o faturamento total revela que:

1. O TTD 409 (Fase 2) apresenta a menor carga tributária efetiva (2,18%), seguido pelo TTD 410 (2,47%), pelo TTD 409 Fase 1 (3,02%) e pelo COMEXPRODUZIR (3,96%).

2. O desembolso inicial com ICMS na importação, presente apenas no TTD 409, impacta significativamente o fluxo de caixa, embora seja compensado parcialmente na apuração mensal.

3. A tributação das vendas internas para consumidores finais, sem benefício em nenhum dos regimes, representa porção significativa da carga tributária total, especialmente no COMEXPRODUZIR (devido à alíquota de 19% versus 17% em SC).

4. As contribuições específicas de cada estado (Fundo de Educação em SC, FUNPRODUZIR e PROTEGE em GO) apresentam impacto percentual semelhante, em torno de 0,3% a 0,4% do faturamento.

5. O mix de clientes e operações impacta significativamente a carga tributária efetiva, tornando a decisão estratégica fortemente dependente do perfil operacional da empresa.

## 6. Considerações Finais sobre a Apuração Mensal

A demonstração prática da apuração mensal do ICMS nos diferentes regimes fiscais revela a complexidade operacional e a diversidade de impactos financeiros e tributários associados a cada modalidade de incentivo.

A escolha do regime mais adequado deve considerar não apenas o valor total a recolher mensalmente, mas também os impactos no fluxo de caixa, as exigências operacionais específicas, os requisitos para fruição do benefício e a estrutura de mercado-alvo da empresa.

A apuração mensal do TTD 409 (Fase 2) apresentou a menor carga tributária efetiva para o mix de operações simulado, mas sua fruição depende do cumprimento do prazo mínimo de 36 meses de operação com o TTD 409, evidenciando a estratégia de maturação progressiva adotada pelo estado de Santa Catarina.

O TTD 410, embora apresente carga tributária ligeiramente superior ao TTD 409 (Fase 2) na apuração mensal, proporciona vantagem significativa de fluxo de caixa ao eliminar o desembolso inicial com ICMS na importação, benefício compartilhado pelo COMEXPRODUZIR.

O programa COMEXPRODUZIR, apesar da maior carga tributária efetiva total, apresenta vantagens para operações voltadas ao mercado interno goiano (alíquota efetiva de 4% versus 19% nominal) e para empresas em fase inicial de operação, sem os requisitos temporais dos regimes catarinenses.

Os exemplos ilustrativos desenvolvidos demonstram, portanto, a necessidade de análise integrada e personalizada, considerando o perfil específico de cada empresa, seu horizonte operacional, seu mix de clientes e produtos, e sua estratégia de mercado para determinação do regime fiscal mais adequado às suas necessidades e objetivos estratégicos.
