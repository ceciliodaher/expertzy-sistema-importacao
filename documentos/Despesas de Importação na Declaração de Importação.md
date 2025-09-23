<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Despesas de Importação na Declaração de Importação (DI)

## **Principais Despesas Constantes na DI**

As despesas de importação normalmente presentes em uma Declaração de Importação (DI) incluem diversos custos relacionados ao processo aduaneiro e logístico. Estas despesas são fundamentais para o cálculo correto dos tributos e para a formação da base de cálculo do ICMS na importação.[^1][^2][^3][^4]

### **Taxa de Utilização do Siscomex (TUS)**

A **Taxa Siscomex** é obrigatória para todas as operações de importação e é identificada no XML da DI pelo código de receita **7811**. Esta taxa é paga diretamente no momento do registro da DI e é rateada proporcionalmente ao valor da mercadoria (VMLE) quando há múltiplas adições.[^2][^3][^4][^5]

### **Adicional ao Frete da Marinha Mercante (AFRMM)**

O **AFRMM** é calculado sobre o valor do frete internacional marítimo, correspondendo a **25% do valor do frete**. Esta taxa é fundamental para operações que utilizem transporte marítimo e deve ser informada quando a via de transporte internacional for marítima.[^6][^3][^7][^2]

### **Despesas Aduaneiras Específicas**

As despesas aduaneiras incluem diversos custos relacionados ao desembaraço aduaneiro:[^8][^1]

- **Capatazia**: Serviços de movimentação de carga no porto, identificada pelo código de acréscimo **16**[^9][^2]
- **Taxa CE (Conhecimento de Embarque)**: Identificada pelo código de acréscimo **17**[^2]
- **Honorários de despachante aduaneiro**: Valores entre R\$ 800 e R\$ 1.500 por operação[^1]
- **Multas e diferenças**: Por infrações, diferenças de peso ou classificação fiscal[^10][^9]


### **Taxas Comerciais**

- **Taxa Anti-Dumping**: Aplicada a produtos específicos conforme regulamentação, identificada pelo código de receita **5529**[^11][^5]
- **Direitos Compensatórios**: Aplicados conforme medidas de defesa comercial em vigor[^11]


## **Identificação no XML da DI**

### **Estrutura das Tags XML**

As despesas de importação são organizadas no XML da DI em diferentes seções, cada uma com tags específicas para identificação e valoração:[^12]

#### **Seção de Pagamentos**

```xml
<pagamento>
    <codigoReceita>7811</codigoReceita>
    <valorReceita>215.00</valorReceita>
    <dataPagamento>2024-08-15</dataPagamento>
</pagamento>
```


#### **Seção de Acréscimos**

```xml
<acrescimo>
    <codigoAcrescimo>16</codigoAcrescimo>
    <valorReais>150.00</valorReais>
    <valorMoedaNegociada>30.00</valorMoedaNegociada>
</acrescimo>
```


#### **Seção de Dados da Carga**

```xml
<collect>0.00</collect>
<prepaid>2500.00</prepaid>
<freteValorReais>800.50</freteValorReais>
<seguroValorReais>125.75</seguroValorReais>
```


### **Campos de Identificação no Sistema Siscomex**

O XML da DI contém campos específicos que correspondem diretamente aos dados preenchidos no Siscomex:[^13][^12]

- **CD-RECEITA-PGTO**: Código da receita/tributo
- **VL-TRIBUTO-PAGO**: Valor do tributo pago
- **CD-MET-ACRES-VALOR**: Código do método de acréscimo
- **VL-ACRESCIMO-MN**: Valor do acréscimo em reais


## **Tabela Consolidada das Despesas de Importação**

## **Considerações para Rateio e Cálculo**

### **Base de Cálculo do ICMS**

As despesas aduaneiras integram a base de cálculo do ICMS na importação, sendo composta por:[^3][^4]
**Base ICMS = VMLD + II + IPI + PIS + COFINS + Siscomex + AFRMM + Multas + ICMS**

### **Critérios de Rateio**

- **Taxa Siscomex**: Rateada proporcionalmente ao valor da mercadoria (VMLE)[^4][^3]
- **AFRMM**: Rateada com base no peso líquido da mercadoria[^4]
- **Frete**: Rateado proporcionalmente ao peso da mercadoria[^3]
- **Seguro**: Rateado proporcionalmente ao valor da mercadoria[^3]


### **Despesas Não Aduaneiras**

Algumas despesas **não integram** a base de cálculo do ICMS por não serem consideradas despesas aduaneiras:[^9][^10]

- Comissões de despachante não demonstradas na DI
- Corretagem de câmbio
- Frete interno
- Armazenagem não alfandegada
- Remoção de mercadorias pós-desembaraço

A correta identificação e tratamento dessas despesas no XML da DI é essencial para o adequado preenchimento da nota fiscal de importação e para o cumprimento das obrigações tributárias relacionadas ao processo de importação.[^7][^14]
<span style="display:none">[^15][^16][^17][^18][^19][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^30][^31]</span>

<div style="text-align: center">⁂</div>

[^1]: https://www.remessaonline.com.br/blog/custos-da-importacao/

[^2]: https://meajuda.moveresoftware.com/support/solutions/articles/27000064170-geracão-de-nf-de-importacão-via-xml-siscomex

[^3]: https://www.taxpratico.com.br/pagina/nota-fiscal-de-importacao-veja-o-que-e-e-como-emitir

[^4]: http://legislacao.sef.sc.gov.br/Consulta/Views/Publico/DocumentoLegalViewer.ashx?id=8B18A048-415E-4B2E-956D-112B478A65BE

[^5]: https://www.fazcomex.com.br/siscomex/codigos-de-pagamento-de-receita/

[^6]: https://blog.logcomex.com/custos-de-importacao-o-que-sao-e-como-controla-los

[^7]: https://ajuda.maino.com.br/pt-BR/articles/3156881-como-emitir-uma-nf-e-de-entrada-de-importacao-a-partir-do-xml-di

[^8]: https://www.fazcomex.com.br/importacao/como-controlar-as-despesas-no-processo-de-importacao/

[^9]: https://www.legisweb.com.br/legislacao/?id=336446

[^10]: https://legislacao.fazenda.sp.gov.br/Paginas/RC4060_2014.aspx

[^11]: https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/despacho-de-importacao/sistemas/siscomex-importacao-web/declaracao-de-importacao/funcionalidades/elaborar-uma-nova-solicitacao-de-di/preenchimento-da-di-1/formularios-de-dados-especificos-da-adicao/aba-tributos-1/principais-campos-relativos-aos-direitos-antidumping-ou-compensatorios

[^12]: https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/despacho-de-importacao/sistemas/siscomex-importacao-web/declaracao-de-importacao/funcionalidades/links-para-arquivos/dicionario-de-dados-do-xml-da-consulta

[^13]: https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/despacho-de-importacao/sistemas/siscomex-importacao-web/declaracao-de-importacao/funcionalidades/links-para-arquivos/dicionario-de-dados-do-xml-da-solicitacao-transmissao

[^14]: https://confluence.korp.com.br/pages/viewpage.action?pageId=1346830428

[^15]: https://blog.maino.com.br/como-emitir-o-xml-da-di/

[^16]: https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/despacho-de-importacao/topicos-1/conceitos-e-definicoes/tipos-de-declaracao-de-importacao/declaracao-de-importacao-di

[^17]: https://ajuda.sankhya.com.br/hc/pt-br/articles/360043796574-Importar-dados-da-DI-Declaração-da-Importação-via-XML-Nota-de-Nacionalização

[^18]: https://ajuda.maino.com.br/pt-BR/articles/3156866-como-gerar-o-extrato-da-di-em-xml

[^19]: https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/despacho-de-importacao/sistemas/siscomex-importacao-web/declaracao-de-importacao/funcionalidades/links-para-arquivos

[^20]: http://memoria.cnpq.br/widget/web/tip/perguntas-frequentes/-/101_INSTANCE_3n8J

[^21]: https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/despacho-de-importacao/sistemas/pagamento-centralizado/20180905-manual-de-preenchimento-do-pagamento-centralizado-do-comercio-exterior-v3.pdf

[^22]: https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/despacho-de-importacao/sistemas/siscomex-importacao-web/declaracao-de-importacao/funcionalidades/links-para-arquivos/dicionario-de-dados-da-di.doc

[^23]: https://eur-lex.europa.eu/legal-content/PT/TXT/HTML/?uri=CELEX%3A32022R0433

[^24]: https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/despacho-de-importacao/sistemas/siscomex-importacao-web/declaracao-de-importacao/funcionalidades/elaborar-uma-nova-solicitacao-de-di/preenchimento-da-di-1/formularios-de-dados-especificos-da-adicao/aba-tributos-1/principais-campos-relativos-ao-imposto-de-importacao-2013-ii

[^25]: https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/despacho-de-importacao/sistemas/siscomex-importacao-web/declaracao-de-importacao/funcionalidades/elaborar-uma-nova-solicitacao-de-di/preenchimento-da-di-1/formularios-de-dados-especificos-da-adicao/aba-valor-aduaneiro-1/perguntas-e-respostas-in-2090-valoracao.pdf

[^26]: https://www.nfe.fazenda.gov.br/portal/exibirArquivo.aspx?conteudo=5W9aeeSeghM%3D

[^27]: https://www.prosyst.com.br/wiki/enduser/erp/suprimentos/recebimento/di/montagemdi/importacao

[^28]: https://ajuda.omie.com.br/pt-BR/articles/1515271-emitindo-uma-nf-e-de-importacao-com-arquivos-xml-ou-txt

[^29]: https://notafiscal.cnt.br/tags-xml-nfe/

[^30]: https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/66e5868f929356509429f7539f6dee86/e068ec27-8c07-482b-918f-2420eb5c7e39/a9fafb6e.csv

[^31]: https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/66e5868f929356509429f7539f6dee86/36cfb8a0-b9aa-4cc8-9fd5-6948a56215a0/c8570631.csv

