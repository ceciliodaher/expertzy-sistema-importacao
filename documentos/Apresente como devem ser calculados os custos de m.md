<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Apresente como devem ser calculados os custos de mercadorias importadas, desde a nacionalização das mercadorias e de acordo com o regime tributário, real, presumido ou simples. construa uma tabela comparativa bastante detalhada, apresentando os impostos que são creditados por imposto, tipo de regime e os impostos na saída por tipo de regime.

As alíquotas de PIS e COFINS podem ser diferentes das gerais, incluindo o adicional de alíquota. Há casos, também, de mercadorias sujeitas ao sistema monofásico do pis e cofins e ainda mercadorias sujeitas à substituição tributária do icms. é preciso considerar todas essas possibilidades. Na importação, gera crédito de PIS e COFINS, mesmo no caso de mercadorias sujeitas ao regime monofásico. Até mesmo porque na saída irá haver nova incidência, desta vez realmente monofásica.
Seja didático.

Resumo direto: O cálculo do custo de mercadorias importadas parte do valor aduaneiro (CIF) e soma os tributos do desembaraço (II, IPI, PIS/COFINS‑Importação, ICMS “por dentro” e despesas aduaneiras), e depois desconta os créditos permitidos conforme o regime (Lucro Real, Presumido ou Simples) e a natureza do produto (comum, regime **monofásico** de PIS/COFINS e/ou ICMS‑ST) para chegar ao **custo nacionalizado** efetivo por regime. As saídas são tributadas de modo distinto por regime (alíquotas e cumulatividade), com regras específicas para monofásico de PIS/COFINS e para ICMS‑ST, inclusive quando o importador é o substituto tributário.

## Escopo e premissas

- As alíquotas de PIS/COFINS‑Importação mais usuais sobre bens são, em regra geral, PIS 2,1% e COFINS 9,65% sobre o valor aduaneiro; podem variar por NCM, e a COFINS‑Importação pode ter adicional de 1 p.p. conforme lista legal; valide a NCM e a vigência atual do adicional antes do cálculo.
- O ICMS na importação é calculado “por dentro”; a base inclui VA, II, IPI, PIS/COFINS‑Import, despesas aduaneiras etc.; muitos estados também incluem o AFRMM, capatazia, taxa Siscomex e outras despesas efetivas.
- Para PIS/COFINS monofásico: a carga concentra-se no fabricante/importador; revendas posteriores, em regra, têm alíquota zero; no caso do importador, há incidência monofásica na receita de venda além do PIS/COFINS‑Importação, e a apropriação/manutenção de créditos segue regras específicas do regime adotado.


## Passo a passo — nacionalização

1) Valor Aduaneiro (VA): mercadoria + frete internacional + seguro.
2) Imposto de Importação (II): \$ II = VA \times a_{II} \$.
3) IPI na importação: \$ IPI = (VA+II) \times a_{IPI} \$.
4) PIS/COFINS‑Importação (bens):
    - \$ PIS-Imp = VA \times a_{PIS} \$
    - \$ COFINS-Imp = VA \times a_{COFINS} \$
    - Adicional COFINS‑Imp (quando aplicável): \$ Adic = VA \times 1\% \$ (verifique vigência e NCM).
5) Despesas aduaneiras: AFRMM, capatazia, Siscomex, armazenagem, etc.
6) ICMS “por dentro”: com \$ a_{ICMS} \$ interna do estado de desembaraço,
    - Base antes do ICMS: \$ S = VA + II + IPI + PIS-Imp + COFINS-Imp + Despesas \$.
    - Base ICMS “por dentro”: \$ Base_{ICMS} = \dfrac{S}{1 - a_{ICMS}} \$.
    - ICMS próprio: \$ ICMS = Base_{ICMS} \times a_{ICMS} \$.
7) ICMS‑ST na importação (se a NCM estiver no regime de ST e o importador atuar como substituto):
    - Base presumida: \$ Base_{ST} = S \times (1 + MVA) \$.
    - ICMS devido na cadeia: \$ ICMS_{cadeia} = Base_{ST} \times a_{ICMS} \$.
    - ICMS‑ST a recolher: \$ ICMS-ST = ICMS_{cadeia} - ICMS próprio \$.

Cálculo bruto de desembolso na DI: \$ Desembolso = S + ICMS + ICMS-ST (se houver) \$. O custo contábil líquido dependerá dos créditos permitidos por regime.

## Créditos na entrada por tributo x regime

| Tributo/Encargo | Lucro Real (não cumulativo) | Lucro Presumido (cumulativo) | Simples Nacional |
| :-- | :-- | :-- | :-- |
| II | Não creditável; compõe custo | Não creditável | Não creditável |
| IPI | Creditável apenas se estabelecimento industrial/equiparado e o insumo for aplicado na industrialização; comércio puro não credita | Idem Real | Em geral não creditável no DAS; compõe custo |
| PIS‑Import | Em regra creditável como contribuição não cumulativa (na forma legal), inclusive em importações de bens para revenda ou insumo; adicional de 1 p.p. da COFINS‑Imp não é creditável e integra custo | Não há créditos de PIS/COFINS no regime cumulativo; integra custo | Não há créditos; integra custo |
| COFINS‑Import | Idem PIS‑Import (exceto adicional de 1 p.p., que não gera crédito) | Sem créditos; integra custo | Sem créditos; integra custo |
| ICMS próprio (DI) | Creditável integralmente se contribuinte do ICMS e a mercadoria for para revenda/industrialização | Idem Real (é regime do IR que muda, não o do ICMS) | Em regra não aproveita crédito no DAS; integra custo |
| ICMS‑ST (DI) | Não creditável; integra custo (é imposto da cadeia futura) | Não creditável; integra custo | Não creditável; integra custo |
| Despesas aduaneiras | Integram custo; algumas podem compor base de créditos de PIS/COFINS conforme natureza (ex.: insumos), respeitando vedações | Integram custo | Integram custo |

Observações-chaves:

- Em Lucro Real, a manutenção/ressarcimento de créditos de PIS/COFINS‑Import é possível nas hipóteses legais, inclusive quando a posterior venda tem alíquota zero/desoneração típica (p.ex., itens com monofásico nas etapas seguintes), exceto o adicional de 1 p.p. da COFINS‑Import, que não gera crédito e vai a custo.
- O ICMS‑ST recolhido na importação não gera crédito ao substituto e forma custo do estoque; o ICMS próprio da DI é creditável.


## Tributação na saída por regime

| Imposto nas saídas | Lucro Real | Lucro Presumido | Simples Nacional |
| :-- | :-- | :-- | :-- |
| PIS/COFINS “normal” | Não cumulativos: alíq. usuais 1,65% e 7,6% sobre receita, com abatimento de créditos (inclusive dos pagos na importação, quando cabíveis) | Cumulativos: alíq. usuais 0,65% e 3% sobre receita bruta, sem créditos | Incidência via DAS conforme Anexo/atividade e faixa; sem créditos; destaque apenas contábil |
| PIS/COFINS “monofásico” | Importador/fabricante: paga alíquotas monofásicas sobre a receita de venda; revendas subsequentes: alíquota zero; mantêm-se créditos permitidos na lei (monofásico não impede manutenção dos créditos de entrada em hipóteses legais) | Importador/fabricante: recolhe monofásico; revendedor: alíquota zero; sem créditos | Receita monofásica deve ser segregada; parcela de PIS/COFINS no DAS fica reduzida/nula conforme regras do Simples |
| ICMS próprio | Débito normal nas saídas internas, com crédito do ICMS da DI | Idem Real | ICMS via DAS; particularidades com sublimite; sem crédito da DI |
| ICMS‑ST | Se atuou como substituto na DI, não há débito próprio nas saídas subsequentes do mesmo produto; indica “ICMS‑ST retido”; custo já embute ST | Idem Real | Receita com ICMS‑ST deve ser segregada para apuração correta do DAS (reduz impacto do ICMS no DAS) |
| IPI (se industrial) | Débito na saída industrial; créditos dos insumos permitidos | Idem (se equiparado) | Em geral fora do DAS; se devido, recolhe-se à parte |

## Como montar o custo por regime

Defina o custo base nacionalizado antes de créditos:
\$ C_{base} = VA + II + IPI + PIS-Imp + COFINS-Imp + Despesas + ICMS + ICMS-ST \$

- Lucro Real:
    - \$ C_{líquido} = C_{base} - Crédito ICMS - Crédito IPI (se industrial) - Crédito PIS-Imp - Crédito COFINS-Imp \$
    - Observação: excluir do crédito o adicional de 1 p.p. da COFINS‑Import (vai a custo).
- Lucro Presumido:
    - \$ C_{líquido} = C_{base} - Crédito ICMS - Crédito IPI (se industrial/equiparado) \$
    - PIS/COFINS‑Import e despesas permanecem em custo; não há crédito de PIS/COFINS.
- Simples Nacional:
    - \$ C_{líquido} = C_{base} \$ (em regra, sem créditos); controle de segregações afeta a apuração do DAS nas saídas, não o custo de entrada.


## Casos especiais que mudam o custo/saída

- Produtos no regime **monofásico** de PIS/COFINS:
    - No importador/fabricante, há incidência concentrada sobre a receita de venda; nas etapas seguintes, alíquota zero; em Lucro Real, os créditos de PIS/COFINS da importação podem ser mantidos nas hipóteses legais; no Presumido e no Simples não há créditos, e o PIS/COFINS‑Import compõe custo.
- Produtos com **ICMS‑ST**:
    - Se o importador é substituto e recolhe ST na DI, esse valor integra o custo do estoque; nas saídas subsequentes não há débito próprio de ICMS daquele item; atenção à MVA e à alíquota interna do estado.
- Adicional de 1 p.p. da **COFINS‑Importação**:
    - Quando aplicável por NCM e vigência, não gera crédito de COFINS e integra o custo de aquisição; monitore alterações legislativas.
- IPI:
    - Comércio puro não credita IPI; industrial/equiparado pode creditar o IPI de insumos e debitar na saída, afetando o custo líquido.


## Exemplo numérico simplificado

Premissas: VA = 100.000; II 12%; IPI 10% (sobre VA+II); PIS‑Imp 2,1%; COFINS‑Imp 9,65%; sem adicional; Despesas = 3.000; ICMS 17%; produto sem ST.

- II = $100.000 \times 12\% = 12.000$.
- IPI = $(100.000 + 12.000) \times 10\% = 11.200$.
- PIS‑Imp = $100.000 \times 2{,}1\% = 2.100$.
- COFINS‑Imp = $100.000 \times 9{,}65\% = 9.650$.
- Soma antes do ICMS: \$ S = 100.000 + 12.000 + 11.200 + 2.100 + 9.650 + 3.000 = 137.950 \$.
- Base ICMS: \$ Base_{ICMS} = \dfrac{137.950}{1 - 0{,}17} = 166.807{,}23 \$.
- ICMS: \$ 166.807{,}23 \times 17\% = 28.357{,}23 \$.
- Desembolso DI: \$ 137.950 + 28.357{,}23 = 166.307{,}23 \$.

Custo líquido por regime:

- Lucro Real (com ICMS crédito integral; PIS/COFINS‑Imp creditáveis; sem IPI crédito para comércio):
    - Créditos: ICMS 28.357,23; PIS 2.100; COFINS 9.650.
    - \$ C_{líquido} \approx 166.307{,}23 - 28.357{,}23 - 2.100 - 9.650 = 126.200 \$.
- Lucro Presumido (ICMS crédito; sem crédito de PIS/COFINS; comércio sem crédito de IPI):
    - Créditos: ICMS 28.357,23.
    - \$ C_{líquido} \approx 166.307{,}23 - 28.357{,}23 = 137.950 \$.
- Simples (sem créditos):
    - \$ C_{líquido} \approx 166.307{,}23 \$.

Se houver ICMS‑ST com MVA de 40% (exemplo):

- Base ST: \$ 137.950 \times 1{,}40 = 193.130 \$.
- ICMS da cadeia: \$ 193.130 \times 17\% = 32.832{,}10 \$.
- ICMS‑ST: \$ 32.832{,}10 - 28.357{,}23 = 4.474{,}87 \$ (acresce ao custo em todos os regimes).


## Boas práticas de apuração

- Amarrar DI/DUIMP à NF‑e de importação, parametrizando bases e tributos conforme NCM e regras estaduais (ICMS e ST).
- Manter cadastros por NCM com flags de monofásico PIS/COFINS, adicional de COFINS‑Imp, e sujeição a ICMS‑ST (com MVA por UF).
- Separar contabilmente custo base e créditos recuperáveis por tributo e regime, com memória de cálculo por item/lote.
- No Simples, segregar receitas monofásicas e sujeitas a ST para correta apuração do DAS (reduzindo a parcela de PIS/COFINS ou ICMS conforme o caso).


## Observação sobre fontes

Para esta resposta, não houve acesso a repositórios oficiais em tempo real; antes de aplicar alíquotas, confirme no TIPI/TAB NCM, legislação do PIS/COFINS‑Importação vigente (incluindo regras do adicional de 1 p.p.) e no regulamento do ICMS da UF de desembaraço, além de verificar atos recentes que possam ter alterado percentuais e listas de NCM.
<span style="display:none">[^1][^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^2][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^3][^30][^31][^32][^33][^34][^35][^36][^37][^38][^39][^4][^40][^41][^42][^43][^44][^45][^46][^47][^48][^49][^5][^50][^51][^52][^53][^54][^55][^56][^57][^58][^59][^6][^60][^61][^62][^63][^64][^65][^66][^67][^68][^69][^7][^70][^71][^72][^73][^8][^9]</span>

<div style="text-align: center">⁂</div>

[^1]: https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2004/lei/l10.865.htm

[^2]: https://www.gov.br/pgfn/pt-br/cidadania-tributaria/por-assunto/indice-assuntos-portal/pis-cofins-2/pis-cofins-importacao

[^3]: https://www.lefisc.com.br/boletins/2014/fevereiro_semana_2/base_de_calculo_do_imposto/index.asp

[^4]: https://consulcamp.com.br/2025/01/09/alteracao-da-aliquota-da-cofins-importacao/

[^5]: https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/declaracoes-e-demonstrativos/ecf/perguntas-e-respostas-pessoa-juridica-2021-arquivos/capitulo-xxiii-contribuicao-para-o-pis-pasep-importacao-e-a-cofins-importacao-2021.pdf

[^6]: https://www.thomsonreuters.com.br/pt/tax-accounting/comercio-exterior/blog/o-adicional-de-1-sobre-cofins-importacao-teratologias-legislativas-em-torno-de-sua-exigibilidade.html

[^7]: https://ajuda.maino.com.br/pt-BR/articles/6136490-como-calcular-a-base-de-calculo-do-icms-na-importacao

[^8]: https://anttlegis.antt.gov.br/action/ActionDatalegis.php?acao=detalharAto\&tipo=LEI\&numeroAto=00010865\&seqAto=000\&valorAno=2004\&orgao=NI\&nomeTitulo=codigos\&desItem=\&desItemFim=\&cod_modulo=420\&cod_menu=7145

[^9]: https://smagalhaes.com.br/noticias/noticia?n=2300351

[^10]: https://blog.maino.com.br/icms-na-importacao-entenda-como-funciona/

[^11]: https://blbescoladenegocios.com.br/blog/aliquotas-de-importacao-e-gerais-de-pis-e-cofins-no-brasil-uma-analise-dos-impactos-economico-tributarios/

[^12]: https://akashatax.com.br/cofins-cobranca-adicional-de-1-prorrogada-ate-2027-importante-a-cobranca-esta-suspensa-ate-31-03-2024/

[^13]: https://www.fazcomex.com.br/importacao/icms-na-importacao/

[^14]: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12546.htm

[^15]: https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/manuais/remessas-postal-e-expressa/preciso-pagar-impostos-nas-compras-internacionais/quanto-pagarei-de-imposto

[^16]: https://www.garciaemoreno.com.br/artigo/15541/o_fim_da_cobranca_do_adicional_da_cofins-importacao.html

[^17]: https://atendimento.receita.rs.gov.br/calculo-do-icms-importacao

[^18]: https://www.ibet.com.br/adicional-de-1-da-cofins-importacao-afronta-as-disposicoes-do-gatt-inexistencia/

[^19]: https://contaazul.com/blog/aprenda-a-fazer-o-calculo-do-icms-para-importacao/

[^20]: https://mgcontecnica.com.br/2024/09/23/extincao-gradual-do-adicional-de-aliquota-da-cofins-importacao/

[^21]: https://www.gov.br/pt-br/servicos/conceder-certificado-de-registro-pessoa-fisica-colecionador-atirador-desportivo-e-cac

[^22]: https://legalmentearmado.com.br/blog/como-tirar-o-cr-na-policia-federal

[^23]: https://www.gov.br/pt-br/servicos/conceder-certificado-de-registro-de-pessoa-fisica-2013-cacador-excepcional-atirador-desportivo-e-colecionador-cac

[^24]: https://www.clubeorion.com.br/atirador-desportivo-cr/

[^25]: https://www.confederacaocacbrasil.com.br/policia-federal-esclarece-30-duvidas-sobre-cr-craf-habitualidade-e-transferencias-de-armas-confira/

[^26]: https://www.legisweb.com.br/legislacao/?id=394723

[^27]: https://www.youtube.com/watch?v=MY8EJx5j8hE

[^28]: https://www.clubedetirobrasilia.com.br/passos-para-aquisicao-de-cr/

[^29]: https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm

[^30]: https://parceriaarmas.com.br/publicacao/CUIDADOS_PARA_NAO_PERDER_CERTIFICADO_DE_REGISTRO

[^31]: https://itcnet.com.br/anexos/lei_complementar123.html

[^32]: https://www.cttmexicanos.com.br/as-principais-duvidas-sobre-o-cr/

[^33]: https://modeloinicial.com.br/lei/LCP-123-2006/estatuto-nacional-microempresa-da-empresa-pequeno-porte/art-13

[^34]: https://krcsports.com.br/como-tirar-cr-no-exercito/

[^35]: https://www8.receita.fazenda.gov.br/simplesnacional/arquivos/manual/perguntaosn.pdf

[^36]: https://www.legjur.com/legislacao/art/lec_00001232006-13

[^37]: https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm

[^38]: https://legislacao.fazenda.sp.gov.br/Paginas/RC6183_2015.aspx

[^39]: https://www.legisweb.com.br/legislacao/?id=375787

[^40]: https://www.comprasnet.gov.br/legislacao/leis/lei123_2006.htm

[^41]: https://modeloinicial.com.br/lei/L-10865-2004/lei-10865/art-15

[^42]: https://www.ibet.com.br/cofins-importacao-majoracao-da-aliquota-em-um-ponto-percentual-aproveitamento-integral-dos-creditos-obtidos-com-o-pagamento-do-tributo-vedacao-constitucionalidade-do-art-8o-§-21-da-lei-10/

[^43]: https://legislacao.presidencia.gov.br/ficha/?%2Flegisla%2FLegislacao.nsf%2F8b6939f8b38f377a03256ca200686171%2F52c70fc0e224f60e03256e8900445220\&OpenDocument

[^44]: https://dootax.com.br/pis-e-cofins/

[^45]: https://www.legisweb.com.br/legislacao/?id=360152

[^46]: https://www.normaslegais.com.br/legislacao/parcecer-normativo-cosit-10-2014.htm

[^47]: https://www.migalhas.com.br/depeso/375314/pis-pasep-e-cofins-como-funciona-a-tributacao-nas-importacoes

[^48]: http://normas.receita.fazenda.gov.br/sijut2consulta/consulta.action?termoBusca=lu

[^49]: https://blog.maino.com.br/impostos-sobre-importacao-conheca-os-e-aprenda-a-calcular/

[^50]: http://normas.receita.fazenda.gov.br/sijut2consulta/consulta.action?facetsExistentes=\&orgaosSelecionados=\&tiposAtosSelecionados=59\&lblTiposAtosSelecionados=PN\&tipoAtoFacet=\&siglaOrgaoFacet=\&anoAtoFacet=\&termoBusca=\&numero_ato=\&tipoData=2\&dt_inicio

[^51]: https://acordaos.economia.gov.br/acordaos2/pdfs/processados/10314720248201767_6008663.pdf

[^52]: https://www.gov.br/pgfn/pt-br/cidadania-tributaria/por-assunto/indice-assuntos-portal/comercio-exterior-aduaneiro/pis-cofins-importacao

[^53]: https://pesquisa.in.gov.br/imprensa/servlet/INPDFViewer?jornal=515\&pagina=75\&data=08%2F09%2F2021\&captchafield=firstAccess

[^54]: https://validcertificadora.com.br/blogs/contabilidade/entenda-as-regras-para-solicitar-restituicao-do-pis-e-cofins-de-importacao

[^55]: https://www.legisweb.com.br/legislacao/?id=336267

[^56]: https://www.lefisc.com.br/materias/3102006ir2.htm

[^57]: https://www.legisweb.com.br/noticia/?id=13555

[^58]: https://acordaos.economia.gov.br/acordaos2/pdfs/processados/19515002468200822_7185608.pdf

[^59]: https://loja.implemis.com.br/motor-monof-20-cv-4p-60hz-110220v

[^60]: https://www.lefisc.com.br/perguntasRespostas/resposta/5486

[^61]: https://www.lefisc.com.br/perguntasRespostas/resposta/6704

[^62]: https://loja.tron-ce.com.br/produto/3qpbm2206-qpb-ca-partida-direta-monof-220vca-0-6a-5122

[^63]: https://www.martinelli.adv.br/o-que-muda-com-a-publicacao-da-in-2121-para-pis-e-cofins/

[^64]: https://www.magazineluiza.com.br/busca/motor+monof/

[^65]: https://www.normaslegais.com.br/legislacao/instrucao-normativa-rfb-2121-2022.htm

[^66]: https://www.ecocomprasonline.com.br/climatizadores-evaporativos/partes-e-pecas/motores/motor-weg-monof-15-cv-4p-42-220v-60hz-ip21-10002386234ac-3-veloc

[^67]: https://www.in.gov.br/en/web/dou/-/instrucao-normativa-rfb-n-2.121-de-15-de-dezembro-de-2022-452045866

[^68]: https://www.nade.com.br/filtros-e-bombas/bombas/bomba-agua-periferica-be80-monof-1-0-cv-127220v-60hz-wdm

[^69]: https://www.legisweb.com.br/legislacao/?legislacao=439816

[^70]: https://www.cordeiromaquinas.com.br/ferramentas-manuais/motobomba-mult-estagio-monof-2hp-110220v-4estag-ecm200m

[^71]: http://normas.receita.fazenda.gov.br/sijut2consulta/link.action?idAto=127905

[^72]: https://agismedical.com.br/product/fa88905-steel-monof-5-4x45cm-mtr48/

[^73]: https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2022/dezembro/receita-federal-atualiza-legislacao-sobre-pis-pasep-e-cofins

