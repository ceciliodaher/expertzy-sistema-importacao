# Incentivos Fiscais de ICMS para Importação em Santa Catarina: TTD 409, 410 e 411 (**Versão Corrigida – Cálculo Diferimento TTD 409**)

## Esclarecimentos Preliminares

Os principais incentivos fiscais para importação em SC são os **TTD 409, 410 e 411**, previstos no **Art. 246 do Anexo 02 do RICMS/SC**. Proporcionam **diferimento do ICMS na importação** e impactam profundamente a emissão das notas fiscais e o fluxo de caixa das empresas importadoras.

***

## Tratamentos Tributários Diferenciados em Santa Catarina

### TTD 409

- **Diferimento do ICMS** na importação de mercadorias para comercialização
- **Antecipação de 2,6%** nos primeiros 36 meses, reduzindo para **1%** após este prazo
- **Dispensa de garantia**
- **Crédito presumido** nas operações de saída

### TTD 410

- Possibilidade de migração após **24 meses** e faturamento mínimo de R\$ 24 milhões anuais
- **Diferimento total** do ICMS na importação
- **Dispensa de antecipação**
- **Sem exigência de garantia**

### TTD 411

- **Exige garantia real ou fidejussória**
- **Diferimento total** do ICMS, sem antecipação
- **Maior flexibilidade** operacional

***

## Impactos na Emissão da Nota Fiscal de Importação

### Situação Normal

- **ICMS devido integralmente** no desembaraço aduaneiro (17%)
- **Destaque normal** do ICMS na NF-e
- **Pagamento imediato**

### Com TTD 409/410/411

Empresas beneficiárias possuem regime diferenciado de emissão e cálculo:

#### **1. Como destacar ICMS com Diferimento Parcial TTD 409**

- **CST 51 (Diferimento)**
- **Base de cálculo**: valor integral (por dentro)
- **ICMS destacado**: valor integral (vICMSOp) como se não houvesse diferimento
- **Percentual de diferimento**: calculado conforme valor efetivamente recolhido
- **Valor ICMS devido**: apenas a antecipação (2,6%/1%) calculada CORRETAMENTE sobre a base **por dentro de 4%**
- **Campo cBenef**: SC830015 (obrigatório)

#### **IMPORTANTE:** O valor **efetivamente recolhido** (“ICMS antecipado/diferido”) **é calculado conforme base por dentro e alíquota de 4%**, conforme determina o Termo do benefício.

***

## **Tabela Comparativa Corrigida**

| **Aspecto**            | **Situação Normal** | **TTD 409**                                           | **TTD 410**            | **TTD 411**           |
|:---------------------- |:------------------- |:----------------------------------------------------- |:---------------------- |:--------------------- |
| **ICMS na Importação** | 17% integral        | 2,6% (36m) / 1% (após 36m) sobre base por dentro a 4% | 0% (diferimento total) | 0% (dif. c/ garantia) |
| **CST NF-e**           | 00                  | 51                                                    | 51                     | 51                    |
| **Destaque ICMS NF-e** | Sim (17%)           | Sim, mas diferido                                     | Sim, mas diferido      | Sim, mas diferido     |
| **Valor ICMS Devido**  | Total (17%)         | Antecipação (2,6%/1%)*                                | R\$ 0,00               | R\$ 0,00              |
| **Campo cBenef**       | Não                 | SC830015                                              | SC830015               | SC830015              |
| **Garantia**           | Não                 | Não                                                   | Não                    | Sim                   |
| **Diferimento ICMS**   | Não                 | Parcial                                               | Total                  | Total                 |
| **Crédito Presumido**  | Não                 | Sim (ex: 30% ou 70%)                                  | Sim (variável)         | Sim (variável)        |

*Obs: O "Valor ICMS Devido" é **calculado sobre a base por dentro de 4%** e não de 17%.

***

## **Exemplo Detalhado de Cálculo CORRETO — TTD 409**

### Valores Baseados em DI Simulada:

- CIF (C/ Frete, Seguro, etc.): R\$ 1.042.894,01
- II: R\$ 187.720,92
- IPI: R\$ 61.530,75
- PIS: R\$ 21.900,77
- COFINS: R\$ 100.639,27
- Seguro: R\$ 1.800,07
- Siscomex: R\$ 154,23

**Subtotal =** R\$ 1.416.640,02

### **Base para escrituração ICMS (por dentro, antes do benefício, para vBC na NF-e):**

$$
\text{Base ICMS 17} = \frac{1.416.640,02}{0,83} = R\$ 1.707.892,80
$$

- **vBC:** R\$ 1.707.892,80

### **ICMS Integral "de Referência" (para escrituração/destaque):**

$$
vICMSOp = 1.707.892,80 \times 17\% = R\$ 290.341,78
$$

***

#### **Cálculo do valor devido (TTD 409) — ALÍQUOTA POR DENTRO DE 4%**

1. **Base calc 4%:**

$$
\frac{1.416.640,02}{0,96} = R\$ 1.476.708,35
$$

2. **ICMS devido (1% por dentro):**

$$
1.476.708,35 \times 1\% = R\$ 14.767,08
$$

    - Para os 36 primeiros meses, calcule 2,6%:

$$
1.476.708,35 \times 2,6\% = R\$ 38.394,42
$$

***

#### **Diferimento**

$$
vICMSDif = vICMSOp - vICMS_{TTD409}
$$

$$
vICMSDif = 290.341,78 - 14.767,08 = R\$ 275.574,70
$$

$$
pDif = \frac{vICMSDif}{vICMSOp} \times 100\% = 94,91\%
$$

***

### **Exemplo de Preenchimento — Bloco ICMS51 da NF-e**

```xml
<ICMS>
  <ICMS51>
    <orig>1</orig>
    <CST>51</CST>
    <modBC>3</modBC>
    <vBC>1707892.80</vBC>         <!-- Base integral 17% -->
    <pICMS>17.00</pICMS>
    <vICMSOp>290341.78</vICMSOp>
    <pDif>94.91</pDif>
    <vICMSDif>275574.70</vICMSDif>
    <vICMS>14767.08</vICMS>       <!-- Valor antecipação 1% -->
    <cBenef>SC830015</cBenef>
  </ICMS51>
</ICMS>
```

- **A estrutura é igual para 2,6%; apenas ajuste vICMS, vICMSDif e pDif.**

***

## **Resumo das Operações de Saída**

- **Interna (SC):**
  - Alíquota: 4%
  - Crédito presumido: 30%
  - Alíquota efetiva: 2,8%
- **Interestadual:**
  - Alíquota: 12%
  - Crédito presumido: 70%
  - Alíquota efetiva: 3,6%

***

## **SPED Fiscal — Campos Obrigatórios**

| Campo    | Valor        |
|:-------- |:------------ |
| vBC      | 1.707.892,80 |
| vICMSOp  | 290.341,78   |
| pDif     | 94,91%       |
| vICMSDif | 275.574,70   |
| vICMS    | 14.767,08    |
| cBenef   | SC830015     |
| CST      | 51           |

***

## **Considerações Finais e Compliance**

- **Destacar ICMS integral** na nota, informando corretamente o diferencial de percentuais e valores diferidos
- **Calcular o ICMS devido sobre 4% por dentro**, não sobre 17%
- **Preencher obrigatoriamente** o cBenef SC830015
- **Cumprir todas as obrigações acessórias** (DIME, EFD, recolhimento fundos estaduais)
- **Cuidado na escrituração do SPED Fiscal** (ajustes de diferimento/antecipação)

***

**NOTA IMPORTANTE:**
A correta aplicação do TTD 409 exige separar a apuração para escrituração (17%) do imposto efetivamente recolhido, que será calculado **por dentro sobre alíquota de 4% e com porcentual do benefício**. O valor destacado de ICMS na nota deve sempre refletir o ICMS total para fins de aproveitamento de crédito no destinatário (quando aplicável), enquanto o recolhimento acompanha o regime especial do benefício.

***

Segue a **memória de cálculo passo a passo** e estrutura de **planilha** para apurar corretamente o ICMS com TTD 409/SC em qualquer DI. O modelo abaixo é parametrizado, permitindo aplicar a outros processos bastando substituir os valores.

---

## **Memória de cálculo detalhada – ICMS Importação com TTD 409 (SC)**

Considere sempre os seguintes campos, a serem extraídos da DI:

- **Valor CIF (com frete, seguro etc)**

- **II (Imposto de Importação)**

- **IPI (Imposto sobre Produtos Industrializados)**

- **PIS-Importação**

- **COFINS-Importação**

- **Outras despesas aduaneiras (AFRMM, capatazia se aplicável, Siscomex, etc.)**

As fórmulas seguem rigorosamente o modelo de SC e parametrização do TTD 409.

---

## **1. Subtotal da base “por fora”**

Subtotal=CIF+II+IPI+PIS+COFINS+Despesas

---

## **2. Base de ICMS por dentro (campo vBC na NF-e), considerando 17% (vBC "cheia" para escrituração)**

BaseICMS17=1−0,17Subtotal

---

## **3. ICMS integral (campo vICMSOp, escrituração/fiscalização)**

vICMSOp=BaseICMS17×0,17

---

## **4. Cálculo da base por dentro 4% para apuração do valor devido (TTD 409)**

BaseICMS4=1−0,04Subtotal

---

## **5. ICMS devido – aplique a alíquota “TTD” (2,6% ou 1%)**

vICMSTTD=BaseICMS4×Alıˊquota TTD

- Alíquota TTD: 2,6% nos 36 primeiros meses, 1% depois.

---

## **6. ICMS Diferido (vICMSDif), Percentual Diferido (pDif)**

vICMSDif=vICMSOp−vICMSTTD pDif=(vICMSOpvICMSDif)×100

---

## **7. Resumo – Preenchimento dos campos da NF-e**

| Campo    | Fórmula/Descrição          | Valor (Exemplo) |
| -------- | -------------------------- | --------------- |
| vBC      | BaseICMS17                 | 1.707.892,80    |
| vICMSOp  | vBC x 17%                  | 290.341,78      |
| vICMS    | BaseICMS4 x Alíquota TTD   | 14.767,08 (1%)  |
| vICMSDif | vICMSOp – vICMS            | 275.574,70      |
| pDif     | (vICMSDif / vICMSOp) x 100 | 94,91           |
| cBenef   | SC830015                   | —               |
| CST      | 51                         | —               |

---

## **Planilha Modelo (Excel/Sheets)**

Copie o seguinte para sua planilha:

| Nome           | Valor          | Fórmula (Excel/Sheets)                        | Observações                         |
| -------------- | -------------- | --------------------------------------------- | ----------------------------------- |
| Valor CIF      | =A2            |                                               | Informe o valor CIF (Reais)         |
| II             | =A3            |                                               | Informe valor II                    |
| IPI            | =A4            |                                               | Informe valor IPI                   |
| PIS            | =A5            |                                               | Informe valor PIS                   |
| COFINS         | =A6            |                                               | Informe valor COFINS                |
| Outras desp.   | =A7            |                                               | Inclua Siscomex, AFRMM, seguro, etc |
| **Subtotal**   | =SUM(A2:A7)    |                                               |                                     |
| **BaseICMS17** | =A8/(1-0,17)   |                                               | vBC à 17% “por dentro”              |
| **vICMSOp**    | =A9*0,17       |                                               | ICMS integral NF-e                  |
| **BaseICMS4**  | =A8/(1-0,04)   |                                               | Base cálculo p/ 4% por dentro       |
| **vICMSTTD**   | =A11*A13       | Informe em A13 a alíquota TTD (0,026 ou 0,01) |                                     |
| **vICMSDif**   | =A10-A12       |                                               | Valor diferido no xml               |
| **pDif**       | =(A14/A10)*100 |                                               | Percentual de diferimento           |

**Atenção**:

- Sempre ajuste a alíquota TTD (1% ou 2,6%) na célula definida.

- Se usar colunas diferentes na sua planilha, atualize os endereçamentos conforme.

- Inclua uma coluna para "Observações" para sempre informar, por exemplo, início da vigência do benefício TTD, número do termo, etc.

---

## **Exemplo prático real (com seus documentos)**

Considerando:

- CIF: 1.042.894,01

- II: 187.720,92

- IPI: 61.530,75

- PIS: 21.900,77

- COFINS: 100.639,27

- Outras despesas: 1.800,07 + 154,23 = 1.954,30

Subtotal=1.042.894,01+187.720,92+61.530,75+21.900,77+100.639,27+1.954,30=1.416.640,02 BaseICMS17=1.416.640,02/0,83=1.707.892,80 vICMSOp=1.707.892,80×0,17=290.341,78 BaseICMS4=1.416.640,02/0,96=1.476.708,35 vICMSTTD (1%)=1.476.708,35×0,01=14.767,08 vICMSTTD (2,6%)=1.476.708,35×0,026=38.394,42 vICMSDif=290.341,78−14.767,08=275.574,70 pDif=(275.574,70/290.341,78)×100=94,91

---

## **Bloco ICMS51 para XML**

xml

`<ICMS>   <ICMS51>     <orig>1</orig>     <CST>51</CST>     <modBC>3</modBC>     <vBC>1707892.80</vBC>     <pICMS>17.00</pICMS>     <vICMSOp>290341.78</vICMSOp>     <pDif>94.91</pDif>     <vICMSDif>275574.70</vICMSDif>     <vICMS>14767.08</vICMS>     <cBenef>SC830015</cBenef>   </ICMS51> </ICMS>`

---


