# ***PLANO FASE 2: Motor de Cálculo - PricingEngine (DEFINITIVO)***

     **📋 REGRAS TRIBUTÁRIAS DEFINITIVAS (baseado nos documentos lidos)**

     ✅ **CRÉDITOS DE PIS/COFINS NA IMPORTAÇÃO**

     **Lucro Real** **- Mercadorias Normais:**

     - ✅ **PIS-Importação**: 2,10% (creditável integral)

     - ✅ **COFINS-Importação**: 9,65% (creditável integral)

     **Lucro Real** **- Mercadorias Monofásicas:**

     - ✅ **PIS**: Crédito com **mesmas alíquotas** de 2,10%

     - ✅ **COFINS**: Crédito com **mesmas alíquotas** de 9,65%

     - ❌ **Adicional COFINS** (§21 art.8º): **NÃO gera crédito**

     **Lucro Real** **- Serviços:**

     - ✅ **PIS-Importação**: 1,65% (creditável integral)

     - ✅ **COFINS-Importação**: 7,60% (creditável integral)

     **Base de Cálculo dos Créditos****:**

     - ✅ Valor aduaneiro

     - ✅ IPI capitalizado no custo

     - ✅ Tributos que compõem valor aduaneiro

     - ❌ Gastos com desembaraço aduaneiro

     - ❌ Adicional COFINS-Importação

     **🎯 IMPLEMENTAÇÃO CORRIGIDA DO PricingEngine.js**

     1. **Identificação do Tipo de Importação:**

     identifyImportationType(engineData) {

         // Verificar se há produtos monofásicos

         const hasMonofasicProducts = engineData.adicoes.some(adicao => 

             this.isMonofasicNCM(adicao.ncm)

         );

         // Determinar alíquotas corretas

         if (hasMonofasicProducts) {

             return {

                 type: 'monofasic',

                 pis_aliquota: 2.10,      // Mesmas alíquotas para monofásicos

                 cofins_aliquota: 9.65    // Mesmas alíquotas para monofásicos

             };

         }

         return {

             type: 'normal',

             pis_aliquota: 2.10,          // Mercadorias normais

             cofins_aliquota: 9.65        // Mercadorias normais  

         };

     }

     2. **Cálculo de Créditos CORRETO:**

     async calculateCreditos(custoBase, regimeTributario, engineData) {

         let totalCreditos = 0;

         const detalhes = {};

         let observacoes = [];

         switch (regimeTributario) {

             case 'lucro_real':

                 const importType = this.identifyImportationType(engineData);

                 // Base de cálculo para créditos (valor aduaneiro + IPI capitalizado)

                 const baseCreditos = custoBase.valor_aduaneiro + custoBase.ipi_devido;

                 // PIS - Crédito integral sobre base

                 detalhes.pis_credito = baseCreditos * (importType.pis_aliquota / 100);

                 // COFINS - Crédito integral sobre base (sem adicional)

                 detalhes.cofins_credito = baseCreditos * (importType.cofins_aliquota / 100);

                 // Separar adicional COFINS que não gera crédito

                 detalhes.cofins_adicional_nao_creditavel = this.calculateAdicionalCOFINS(engineData);

                 // IPI - Crédito integral (importadora = indústria)

                 detalhes.ipi_credito = custoBase.ipi_devido;

                 // ICMS - Crédito integral

                 detalhes.icms_credito = custoBase.icms_devido;

                 totalCreditos = detalhes.pis_credito + detalhes.cofins_credito + 

                               detalhes.ipi_credito + detalhes.icms_credito;

                 observacoes.push(`Lucro Real: PIS ${importType.pis_aliquota}% + COFINS ${importType.cofins_aliquota}%`);

                 observacoes.push("Base de crédito: valor aduaneiro + IPI capitalizado");

                 observacoes.push("Adicional COFINS NÃO gera crédito (§21 art.8º Lei 10.865/2004)");

                 break;

             case 'lucro_presumido':

                 // PIS/COFINS cumulativo - SEM crédito

                 detalhes.pis_credito = 0;

                 detalhes.cofins_credito = 0;

                 // IPI - Crédito integral (importadora = indústria)

                 detalhes.ipi_credito = custoBase.ipi_devido;

                 // ICMS - Crédito integral

                 detalhes.icms_credito = custoBase.icms_devido;

                 totalCreditos = detalhes.ipi_credito + detalhes.icms_credito;

                 observacoes.push("Lucro Presumido: PIS/COFINS cumulativo - SEM crédito");

                 observacoes.push("IPI/ICMS: Crédito integral");

                 break;

             case 'simples_nacional':

                 // ZERO créditos em todos os impostos

                 detalhes.pis_credito = 0;

                 detalhes.cofins_credito = 0;

                 detalhes.ipi_credito = 0;

                 detalhes.icms_credito = 0;

                 totalCreditos = 0;

                 observacoes.push("Simples Nacional: SEM créditos em nenhum imposto");

                 observacoes.push("Tributação unificada via DAS");

                 break;

         }

         return {

             total: totalCreditos,

             detalhes,

             observacoes,

             base_calculo_creditos: regimeTributario === 'lucro_real' ? 

                 custoBase.valor_aduaneiro + custoBase.ipi_devido : null

         };

     }

     3. **Verificação de NCMs Monofásicos:**

     isMonofasicNCM(ncm) {

         // Lista de NCMs sujeitos ao regime monofásico

         // Baseado no documento de tributação monofásica lido anteriormente

         const monofasicNCMs = [

             // Combustíveis

             '27', '2710', '2711',

             // Fármacos

             '30', '3001', '3003', '3004',

             // Perfumarias

             '33', '3303', '3304', '3305', '3306', '3307',

             // Autopeças e veículos

             '87', '8701', '8702', '8703', '8704', '8705',

             // Máquinas

             '84', '8429', '8430', '8432', '8433',

             // Pneus

             '4011', '4013'

         ];

         return monofasicNCMs.some(prefix => ncm.startsWith(prefix));

     }

     4. **Cálculo do Adicional COFINS:**

     calculateAdicionalCOFINS(engineData) {

         // Verificar se há adicional COFINS no XML

         // Normalmente vem identificado separadamente

         let adicionalTotal = 0;

         // Se não vier separado no XML, calcular baseado em produtos específicos

         engineData.adicoes.forEach(adicao => {

             if (this.hasAdicionalCOFINS(adicao.ncm)) {

                 adicionalTotal += adicao.valor_reais * 0.01; // 1% adicional

             }

         });

         return adicionalTotal;

     }

     hasAdicionalCOFINS(ncm) {

         // NCMs sujeitos ao adicional COFINS

         const adicionalNCMs = [

             '27', '2710', '2711', // Derivados petróleo

             '22'  // Bebidas

         ];

         return adicionalNCMs.some(prefix => ncm.startsWith(prefix));

     }

     5. **Estrutura de Resposta Completa:**

     async calculatePricing(engineData) {

         // Validações

         this.validateEngineData(engineData);

         const regime = engineData.regime_tributario;

         // Calcular 4 tipos de custos

         const custoBase = this.calculateCustoBase(engineData);

         const custoDesembolso = await this.calculateCustoDesembolso(custoBase, regime, engineData);

         const custoContabil = this.calculateCustoContabil(custoDesembolso, engineData.parametros_gerenciais);

         const baseFormacaoPreco = this.calculateBaseFormacaoPreco(custoContabil, engineData.parametros_gerenciais);

         return {

             di_id: engineData.di_id,

             numero_di: engineData.numero_di,

             regime_tributario: regime,

             // 4 tipos de custos

             custo_base: custoBase.total,

             custo_desembolso: custoDesembolso.custo_desembolso,  

             custo_contabil: custoContabil.custo_contabil,

             base_formacao_preco: baseFormacaoPreco.base_formacao_preco,

             // Detalhamento completo

             total_creditos: custoDesembolso.creditos_tributarios,

             economia_creditos: custoBase.total - custoDesembolso.custo_desembolso,

             percentual_economia: ((custoBase.total - custoDesembolso.custo_desembolso) / custoBase.total) * 100,

             // Análises

             import_type: custoDesembolso.import_type,

             base_calculo_creditos: custoDesembolso.base_calculo_creditos,

             // Detalhamento técnico

             detalhamento_completo: {

                 custoBase,

                 custoDesembolso, 

                 custoContabil,

                 baseFormacaoPreco

             },

             timestamp: new Date().toISOString(),

             versao_calculo: "2.0.0"

         };

     }

     **📊 EXEMPLO PRÁTICO CORRETO**

     Dados de Entrada:

     const engineData = {

         regime_tributario: "lucro_real",

         totais: {

             valor_aduaneiro: 100000,      // Base principal

             ii_devido: 12000,

             ipi_devido: 15000,            // Integra base de crédito

             pis_devido: 2100,             // 2.10% sobre base

             cofins_devido: 10650,         // 9.65% + adicional se houver

             icms_devido: 18000,

             despesas_aduaneiras: 3000     // NÃO integra base de crédito

         },

         adicoes: [

             { ncm: "85171231", valor_reais: 100000 } // Produto normal

         ]

     };

     Cálculo de Créditos (Lucro Real):

     base_creditos = 100000 + 15000 = 115000  // Valor aduaneiro + IPI

     creditos = {

         pis: 115000 * 2.10% = 2415,          // Sobre base completa

         cofins: 115000 * 9.65% = 11097.5,    // Sobre base completa

         ipi: 15000,                           // Integral

         icms: 18000                           // Integral

     }

     total_creditos = 2415 + 11097.5 + 15000 + 18000 = 46512.5

     custo_desembolso = 158650 - 46512.5 = 112137.5

     **⚡ VALIDAÇÕES CRÍTICAS**

     ✅ Base de Crédito Correta

     base_creditos = valor_aduaneiro + ipi_capitalizado

     // NÃO incluir despesas aduaneiras nem adicional COFINS

     ✅ Alíquotas por Tipo de Produto

     // Mercadorias normais E monofásicas: mesmas alíquotas

     pis_credito = 2.10%

     cofins_credito = 9.65%

     // Serviços: PIS 1.65% + COFINS 7.60%

     ✅ Adicional COFINS

     // Apenas para produtos específicos, NÃO gera crédito

     adicional_cofins = valor * 0.01  // 1% não creditável

     **🎯 RESULTADO FINAL**

     Sistema que:

     - **Calcula créditos corretamente** conforme Lei 10.865/2004

     - **Identifica produtos monofásicos** e aplica mesmas alíquotas

     - **Separa adicional COFINS** não creditável

     - **Usa base de cálculo correta** (valor aduaneiro + IPI)

     - **Mantém nomenclatura oficial** DIProcessor

     - **Fornece 4 tipos de custos** com precisão fiscal
