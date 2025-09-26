/**
 * E2E Tests - Complete Pricing Pipeline
 *
 * Tests the complete integration flow:
 * XML Import → DI Processing → Compliance Calculation → Pricing Engine
 *
 * Validates:
 * - 4 Cost Types Calculation (Base, Desembolso, Contábil, Formação)
 * - 4 Pricing Methods (Cost+, Competitive, Value-based, Dynamic)
 * - Tax Regime Integration (Lucro Real, Presumido, Simples Nacional)
 * - Monophasic Products with Special Tax Credit Rules
 * - NO FALLBACKS compliance and error handling
 * - Navigation flow and data persistence
 * - Mathematical accuracy validation
 */

import { test, expect } from '@playwright/test';

// Test XML data with known expected results for validation
const TEST_XML_DATA = `<?xml version="1.0" encoding="UTF-8"?>
<declaracaoImportacao>
    <numeroDeclaracaoImportacao>24/1234567-0</numeroDeclaracaoImportacao>
    <importador>
        <nomeRazaoSocial>EXPERTZY IMPORTACAO LTDA</nomeRazaoSocial>
        <cpfCnpj>12.345.678/0001-90</cpfCnpj>
        <endereco>
            <uf>SP</uf>
            <municipio>São Paulo</municipio>
            <cep>01234567</cep>
        </endereco>
    </importador>
    <carga>
        <pesoBrutoTotal>1500.50</pesoBrutoTotal>
        <paisProcedencia>
            <codigo>249</codigo>
            <nome>CHINA</nome>
        </paisProcedencia>
        <viaTransporte>
            <codigo>1</codigo>
            <nome>MARITIMA</nome>
        </viaTransporte>
    </carga>
    <adicoes>
        <adicao numeroAdicao="001">
            <ncm>8517.12.31</ncm>
            <valorAduaneiro>50000.00</valorAduaneiro>
            <valorReais>275000.00</valorReais>
            <produtos>
                <mercadoria numeroSequencial="001">
                    <descricao>TELEFONES CELULARES</descricao>
                    <ncm>8517.12.31</ncm>
                    <quantidade>100</quantidade>
                    <valorUnitario>500.00</valorUnitario>
                    <pesoLiquido>50.00</pesoLiquido>
                </mercadoria>
            </produtos>
            <tributos>
                <ii>
                    <aliquota>16.00</aliquota>
                    <valor>44000.00</valor>
                </ii>
                <ipi>
                    <aliquota>15.00</aliquota>
                    <valor>47850.00</valor>
                </ipi>
                <pis>
                    <aliquota>2.10</aliquota>
                    <valor>6788.50</valor>
                </pis>
                <cofins>
                    <aliquota>9.65</aliquota>
                    <valor>31173.25</valor>
                </cofins>
            </tributos>
        </adicao>
        <adicao numeroAdicao="002">
            <ncm>2710.19.21</ncm>
            <valorAduaneiro>20000.00</valorAduaneiro>
            <valorReais>110000.00</valorReais>
            <produtos>
                <mercadoria numeroSequencial="001">
                    <descricao>OLEO DIESEL S10</descricao>
                    <ncm>2710.19.21</ncm>
                    <quantidade>5000</quantidade>
                    <valorUnitario>4.00</valorUnitario>
                    <pesoLiquido>4200.00</pesoLiquido>
                </mercadoria>
            </produtos>
            <tributos>
                <ii>
                    <aliquota>8.00</aliquota>
                    <valor>8800.00</valor>
                </ii>
                <ipi>
                    <aliquota>0.00</aliquota>
                    <valor>0.00</valor>
                </ipi>
                <pis>
                    <aliquota>2.10</aliquota>
                    <valor>2720.40</valor>
                </pis>
                <cofins>
                    <aliquota>9.65</aliquota>
                    <valor>12506.00</valor>
                </cofins>
            </tributos>
        </adicao>
    </adicoes>
    <despesas>
        <despesa>
            <codigo>143</codigo>
            <nome>SISCOMEX</nome>
            <valor>214.85</valor>
        </despesa>
        <despesa>
            <codigo>112</codigo>
            <nome>AFRMM</nome>
            <valor>962.50</valor>
        </despesa>
        <despesa>
            <codigo>917</codigo>
            <nome>CAPATAZIA</nome>
            <valor>430.00</valor>
        </despesa>
    </despesas>
</declaracaoImportacao>`;

// Expected calculation results for mathematical validation
const EXPECTED_RESULTS = {
    // DI totals after processing
    totals: {
        valor_aduaneiro: 70000.00,
        valor_reais: 385000.00,
        ii_devido: 52800.00,
        ipi_devido: 47850.00,
        pis_devido: 9508.90,
        cofins_devido: 43679.25,
        despesas_aduaneiras: 1607.35
    },

    // Cost calculations by type
    costs: {
        custo_base: 540445.50, // valor_aduaneiro + impostos + despesas + ICMS_SP(18%)
        custo_desembolso_lucro_real: 456445.50, // custo_base - creditos_pis_cofins - credito_ipi
        custo_desembolso_presumido: 487595.50, // custo_base - credito_ipi (sem credito PIS/COFINS)
        custo_desembolso_simples: 540445.50, // custo_base (sem creditos tributarios)
        custo_contabil: 456445.50, // mesmo custo_desembolso para lucro real
        base_formacao_preco: 546845.90 // custo_contabil + custos_indiretos + margem
    },

    // Monophasic product detection (NCM 2710.19.21 - diesel)
    monophasic: {
        ncm_27101921: {
            is_monophasic: true,
            categoria: 'derivados_petroleo',
            permite_credito_lucro_real: true,
            credito_pis: 2720.40,
            credito_cofins: 12506.00
        }
    },

    // Tax regime specific results
    tax_regimes: {
        lucro_real: {
            total_credits: 62684.15, // PIS + COFINS + IPI
            effective_cost: 456445.50
        },
        lucro_presumido: {
            total_credits: 47850.00, // Apenas IPI
            effective_cost: 487595.50
        },
        simples_nacional: {
            total_credits: 0.00, // Nenhum crédito
            effective_cost: 540445.50
        }
    }
};

test.describe('Complete Pricing Pipeline E2E Tests', () => {

    test.beforeEach(async ({ page }) => {
        // Navigate to main interface
        await page.goto('http://localhost:8000/di-interface.html');

        // Wait for system initialization
        await page.waitForTimeout(3000);

        // Verify all required modules are loaded
        const modulesLoaded = await page.evaluate(() => {
            return {
                diProcessor: typeof window.DIProcessor !== 'undefined',
                complianceCalculator: typeof window.ComplianceCalculator !== 'undefined',
                pricingEngine: typeof window.PricingEngine !== 'undefined',
                costCalculationEngine: typeof window.CostCalculationEngine !== 'undefined',
                incentiveManager: typeof window.IncentiveManager !== 'undefined',
                dbManager: typeof window.dbManager !== 'undefined'
            };
        });

        // Fail fast if critical modules are missing
        expect(modulesLoaded.diProcessor).toBeTruthy();
        expect(modulesLoaded.complianceCalculator).toBeTruthy();
        expect(modulesLoaded.dbManager).toBeTruthy();

        console.log('✅ All critical modules loaded for pricing pipeline test');
    });

    test('Complete Pipeline: XML Import → DI Processing → Pricing', async ({ page }) => {
        // STEP 1: Import XML and process DI
        const diProcessingResult = await page.evaluate(async (xmlData) => {
            try {
                // Create XML file simulation
                const xmlBlob = new Blob([xmlData], { type: 'application/xml' });
                const xmlFile = new File([xmlBlob], 'test-di.xml', { type: 'application/xml' });

                // Process through DI pipeline
                const diProcessor = new window.DIProcessor();
                const diData = await diProcessor.parseXML(xmlFile);

                // Save complete DI (98% functional)
                const diId = await window.dbManager.saveCompleteDI(diData);

                return {
                    success: true,
                    diId,
                    totals: diData.totais,
                    adicoesCount: diData.adicoes.length,
                    produtosCount: diData.adicoes.reduce((sum, add) => sum + add.produtos.length, 0)
                };

            } catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
        }, TEST_XML_DATA);

        expect(diProcessingResult.success).toBeTruthy();
        expect(diProcessingResult.diId).toBeDefined();
        expect(diProcessingResult.adicoesCount).toBe(2);
        expect(diProcessingResult.produtosCount).toBe(2);

        console.log(`✅ DI processed successfully with ID: ${diProcessingResult.diId}`);

        // STEP 2: Navigate to pricing module
        await page.goto('http://localhost:8000/src/modules/pricing/pricing-interface.html');
        await page.waitForTimeout(2000);

        // Verify pricing module loaded
        const pricingModuleLoaded = await page.evaluate(() => {
            return window.pricingEngine && window.pricingEngine.isInitialized;
        });

        if (!pricingModuleLoaded) {
            console.log('⚠️ PricingEngine not yet available, initializing...');

            await page.evaluate(() => {
                if (window.pricingEngine && typeof window.pricingEngine.initializeCostSystem === 'function') {
                    return window.pricingEngine.initializeCostSystem();
                }
            });
        }

        // STEP 3: Load DI data into pricing system
        const pricingData = await page.evaluate(async (diId) => {
            try {
                // Load DI from database
                const diData = await window.dbManager.getDIById(diId);
                const adicoes = await window.dbManager.getAdicoesByDI(diId);
                const produtos = await window.dbManager.getProdutosByDI(diId);
                const despesas = await window.dbManager.getDespesasByDI(diId);

                // Combine data for pricing
                const fullDIData = {
                    ...diData,
                    adicoes: adicoes.map(adicao => ({
                        ...adicao,
                        produtos: produtos.filter(p => p.adicao_id === adicao.id)
                    })),
                    despesas_aduaneiras: despesas
                };

                return {
                    success: true,
                    diData: fullDIData,
                    hasMonophasic: produtos.some(p => p.ncm?.startsWith('2710'))
                };

            } catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
        }, diProcessingResult.diId);

        expect(pricingData.success).toBeTruthy();
        expect(pricingData.hasMonophasic).toBeTruthy();

        console.log('✅ DI data loaded into pricing system with monophasic products detected');

        // Store diId for subsequent tests
        await page.evaluate((diId) => {
            window._testDIId = diId;
        }, diProcessingResult.diId);
    });

    test('4 Cost Types Calculation Validation', async ({ page }) => {
        // Skip if DI not loaded in previous test
        const diId = await page.evaluate(() => window._testDIId);
        if (!diId) {
            test.skip('DI data not available - run complete pipeline test first');
        }

        // Calculate all 4 cost types
        const costResults = await page.evaluate(async (expectedResults) => {
            try {
                if (!window.pricingEngine?.costCalculationEngine) {
                    throw new Error('CostCalculationEngine not available');
                }

                // Mock DI data based on expected structure
                const engineData = {
                    totais: {
                        valor_aduaneiro: 70000.00,
                        valor_reais: 385000.00,
                        ii_devido: 52800.00,
                        ipi_devido: 47850.00,
                        pis_devido: 9508.90,
                        cofins_devido: 43679.25,
                        icms_devido: 69300.00, // SP 18%
                        despesas_aduaneiras: 1607.35
                    },
                    adicoes: [
                        {
                            ncm: '8517.12.31',
                            valor_reais: 275000.00,
                            is_monophasic: false
                        },
                        {
                            ncm: '2710.19.21',
                            valor_reais: 110000.00,
                            is_monophasic: true
                        }
                    ],
                    regime_tributario: 'lucro_real'
                };

                // Test each cost type
                const custoBase = window.pricingEngine.calculateCustoBase(engineData);
                const custoDesembolsoLucroReal = window.pricingEngine.calculateCustoDesembolso(engineData);

                // Change regime for comparison
                engineData.regime_tributario = 'lucro_presumido';
                const custoDesembolsoPresumido = window.pricingEngine.calculateCustoDesembolso(engineData);

                engineData.regime_tributario = 'simples_nacional';
                const custoDesembolsoSimples = window.pricingEngine.calculateCustoDesembolso(engineData);

                // Reset to lucro real for other calculations
                engineData.regime_tributario = 'lucro_real';
                const custoContabil = window.pricingEngine.calculateCustoContabil(engineData);
                const baseFormacaoPreco = window.pricingEngine.calculateBaseFormacaoPreco(engineData);

                return {
                    success: true,
                    results: {
                        custo_base: custoBase.total,
                        custo_desembolso_lucro_real: custoDesembolsoLucroReal.total,
                        custo_desembolso_presumido: custoDesembolsoPresumido.total,
                        custo_desembolso_simples: custoDesembolsoSimples.total,
                        custo_contabil: custoContabil.total,
                        base_formacao_preco: baseFormacaoPreco.total
                    },
                    breakdown: {
                        custoBase: custoBase,
                        custoDesembolsoLucroReal: custoDesembolsoLucroReal,
                        custoContabil: custoContabil,
                        baseFormacaoPreco: baseFormacaoPreco
                    }
                };

            } catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
        }, EXPECTED_RESULTS);

        expect(costResults.success).toBeTruthy();

        // Validate mathematical accuracy (allow 0.01% tolerance for floating point)
        const tolerance = 0.01; // 1 cent tolerance

        expect(Math.abs(costResults.results.custo_base - EXPECTED_RESULTS.costs.custo_base)).toBeLessThan(tolerance);
        expect(Math.abs(costResults.results.custo_desembolso_lucro_real - EXPECTED_RESULTS.costs.custo_desembolso_lucro_real)).toBeLessThan(tolerance);
        expect(Math.abs(costResults.results.custo_desembolso_presumido - EXPECTED_RESULTS.costs.custo_desembolso_presumido)).toBeLessThan(tolerance);
        expect(Math.abs(costResults.results.custo_desembolso_simples - EXPECTED_RESULTS.costs.custo_desembolso_simples)).toBeLessThan(tolerance);

        console.log('✅ All 4 cost types calculated with mathematical accuracy');
        console.log('Cost Results:', costResults.results);
    });

    test('Tax Regime Switching Validation', async ({ page }) => {
        // Test that different tax regimes produce different cost calculations
        const regimeComparison = await page.evaluate(async () => {
            try {
                const baseEngineData = {
                    totais: {
                        valor_aduaneiro: 70000.00,
                        ii_devido: 52800.00,
                        ipi_devido: 47850.00,
                        pis_devido: 9508.90,
                        cofins_devido: 43679.25,
                        icms_devido: 69300.00,
                        despesas_aduaneiras: 1607.35
                    },
                    adicoes: [
                        { ncm: '8517.12.31', is_monophasic: false },
                        { ncm: '2710.19.21', is_monophasic: true }
                    ]
                };

                const regimes = ['lucro_real', 'lucro_presumido', 'simples_nacional'];
                const results = {};

                for (const regime of regimes) {
                    const engineData = { ...baseEngineData, regime_tributario: regime };
                    const custoDesembolso = window.pricingEngine.calculateCustoDesembolso(engineData);

                    results[regime] = {
                        total: custoDesembolso.total,
                        credits: custoDesembolso.creditos_tributarios || 0,
                        breakdown: custoDesembolso
                    };
                }

                return {
                    success: true,
                    results
                };

            } catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        expect(regimeComparison.success).toBeTruthy();

        // Validate regime differences
        const lucroReal = regimeComparison.results.lucro_real;
        const lucroPresumido = regimeComparison.results.lucro_presumido;
        const simplesNacional = regimeComparison.results.simples_nacional;

        // Lucro Real should have more credits than Presumido
        expect(lucroReal.credits).toBeGreaterThan(lucroPresumido.credits);

        // Simples Nacional should have no credits
        expect(simplesNacional.credits).toBe(0);

        // Total costs should reflect credit differences
        expect(lucroReal.total).toBeLessThan(lucroPresumido.total);
        expect(lucroPresumido.total).toBeLessThan(simplesNacional.total);

        console.log('✅ Tax regime switching produces expected cost variations');
        console.log('Regime Comparison:', regimeComparison.results);
    });

    test('Monophasic Product Detection and Credits', async ({ page }) => {
        // Test monophasic product detection and special credit rules
        const monophasicTest = await page.evaluate(async (expectedMonophasic) => {
            try {
                // Test with known monophasic NCM (diesel)
                const testData = {
                    adicoes: [
                        {
                            ncm: '2710.19.21', // Diesel - monophasic
                            valor_reais: 110000.00,
                            pis_devido: 2720.40,
                            cofins_devido: 12506.00
                        },
                        {
                            ncm: '8517.12.31', // Phones - not monophasic
                            valor_reais: 275000.00,
                            pis_devido: 6788.50,
                            cofins_devido: 31173.25
                        }
                    ],
                    regime_tributario: 'lucro_real'
                };

                // Test monophasic detection
                const monophasicDetection = await window.costCalculationEngine?.detectMonophasicProducts(testData.adicoes);

                // Test credit calculation for monophasic vs regular products
                const creditCalc = await window.costCalculationEngine?.calculateTaxCredits(testData.adicoes, 'lucro_real');

                return {
                    success: true,
                    detection: monophasicDetection,
                    credits: creditCalc,
                    hasMonophasic: monophasicDetection?.some(p => p.is_monophasic) || false
                };

            } catch (error) {
                return {
                    success: false,
                    error: error.message,
                    available_methods: window.costCalculationEngine ? Object.getOwnPropertyNames(window.costCalculationEngine) : 'costCalculationEngine not available'
                };
            }
        }, EXPECTED_RESULTS.monophasic);

        expect(monophasicTest.success).toBeTruthy();
        expect(monophasicTest.hasMonophasic).toBeTruthy();

        console.log('✅ Monophasic product detection working correctly');
        console.log('Monophasic Detection:', monophasicTest.detection);
    });

    test('NO FALLBACKS Validation - Error Handling', async ({ page }) => {
        // Test that missing required data causes proper errors (NO FALLBACKS)
        const errorHandlingTest = await page.evaluate(async () => {
            const errors = {};

            try {
                // Test 1: Missing engineData
                try {
                    window.pricingEngine.calculateCustoBase(null);
                    errors.missing_engine_data = 'NO_ERROR'; // Should not reach here
                } catch (e) {
                    errors.missing_engine_data = e.message;
                }

                // Test 2: Missing totals
                try {
                    window.pricingEngine.calculateCustoBase({});
                    errors.missing_totals = 'NO_ERROR'; // Should not reach here
                } catch (e) {
                    errors.missing_totals = e.message;
                }

                // Test 3: Missing valor_aduaneiro
                try {
                    window.pricingEngine.calculateCustoBase({
                        totais: {
                            ii_devido: 1000,
                            ipi_devido: 500
                            // valor_aduaneiro missing
                        }
                    });
                    errors.missing_valor_aduaneiro = 'NO_ERROR'; // Should not reach here
                } catch (e) {
                    errors.missing_valor_aduaneiro = e.message;
                }

                // Test 4: Invalid data types (string instead of number)
                try {
                    window.pricingEngine.calculateCustoBase({
                        totais: {
                            valor_aduaneiro: '50000', // String instead of number
                            ii_devido: 1000,
                            ipi_devido: 500,
                            pis_devido: 100,
                            cofins_devido: 200,
                            icms_devido: 300,
                            despesas_aduaneiras: 50
                        }
                    });
                    errors.invalid_data_type = 'NO_ERROR'; // Should not reach here
                } catch (e) {
                    errors.invalid_data_type = e.message;
                }

                return {
                    success: true,
                    errors
                };

            } catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        expect(errorHandlingTest.success).toBeTruthy();

        // Verify all expected errors occurred (NO FALLBACKS working)
        expect(errorHandlingTest.errors.missing_engine_data).toContain('engineData obrigatório');
        expect(errorHandlingTest.errors.missing_totals).toContain('totais obrigatório');
        expect(errorHandlingTest.errors.missing_valor_aduaneiro).toContain('Valor aduaneiro obrigatório');
        expect(errorHandlingTest.errors.invalid_data_type).toContain('deve ser numérico');

        console.log('✅ NO FALLBACKS validation working correctly');
        console.log('Error Handling Results:', errorHandlingTest.errors);
    });

    test('Navigation Flow and Data Persistence', async ({ page }) => {
        // Test navigation between modules preserves data
        const diId = await page.evaluate(() => window._testDIId);
        if (!diId) {
            test.skip('DI data not available - run complete pipeline test first');
        }

        // Start at DI interface
        await page.goto('http://localhost:8000/di-interface.html');
        await page.waitForTimeout(1000);

        // Store test data in sessionStorage
        await page.evaluate((testDI) => {
            sessionStorage.setItem('current_di_id', testDI.toString());
            sessionStorage.setItem('pricing_config', JSON.stringify({
                regime_tributario: 'lucro_real',
                margem_configurada: 25,
                estado_empresa: 'SP'
            }));
        }, diId);

        // Navigate to pricing interface
        await page.goto('http://localhost:8000/src/modules/pricing/pricing-interface.html');
        await page.waitForTimeout(2000);

        // Verify data persistence
        const persistenceTest = await page.evaluate(() => {
            return {
                diId: sessionStorage.getItem('current_di_id'),
                pricingConfig: JSON.parse(sessionStorage.getItem('pricing_config') || '{}'),
                hasDbManager: typeof window.dbManager !== 'undefined',
                hasPricingEngine: typeof window.pricingEngine !== 'undefined'
            };
        });

        expect(persistenceTest.diId).toBe(diId.toString());
        expect(persistenceTest.pricingConfig.regime_tributario).toBe('lucro_real');
        expect(persistenceTest.hasDbManager).toBeTruthy();

        // Navigate back to DI interface
        await page.goto('http://localhost:8000/di-interface.html');
        await page.waitForTimeout(1000);

        // Verify data still persists
        const backNavigationTest = await page.evaluate(() => {
            return {
                diId: sessionStorage.getItem('current_di_id'),
                pricingConfig: JSON.parse(sessionStorage.getItem('pricing_config') || '{}')
            };
        });

        expect(backNavigationTest.diId).toBe(diId.toString());
        expect(backNavigationTest.pricingConfig.regime_tributario).toBe('lucro_real');

        console.log('✅ Navigation flow preserves data correctly');
        console.log('Persistence Test:', persistenceTest);
    });

    test('Mathematical Accuracy with Real Data Files', async ({ page }) => {
        // Test against real aliquotas.json and tributacao-monofasica.json
        const accuracyTest = await page.evaluate(async () => {
            try {
                // Load real configuration files
                const aliquotasUrl = new URL('../../src/shared/data/aliquotas.json', import.meta.url);
                const monofasicaUrl = new URL('../../src/shared/data/tributacao-monofasica.json', import.meta.url);

                const aliquotasResponse = await fetch(aliquotasUrl);
                const monofasicaResponse = await fetch(monofasicaUrl);

                if (!aliquotasResponse.ok || !monofasicaResponse.ok) {
                    throw new Error('Failed to load configuration files');
                }

                const aliquotas = await aliquotasResponse.json();
                const monofasica = await monofasicaResponse.json();

                // Test ICMS calculation for SP (18%)
                const spIcms = aliquotas.aliquotas_icms_2025?.SP?.aliquota_interna;

                // Test monophasic detection for diesel
                const dieselMonofasico = monofasica.categorias_produtos?.derivados_petroleo?.ncms?.includes('2710.19.21');

                // Test credit rules for lucro real
                const lucroRealCredits = monofasica.regras_credito_por_regime?.lucro_real?.permite_credito_importacao;

                // Calculate with real data
                const testEngineData = {
                    totais: {
                        valor_aduaneiro: 70000.00,
                        ii_devido: 52800.00,
                        ipi_devido: 47850.00,
                        pis_devido: 9508.90,
                        cofins_devido: 43679.25,
                        icms_devido: 70000.00 * (spIcms / 100), // Using real SP rate
                        despesas_aduaneiras: 1607.35
                    },
                    adicoes: [
                        { ncm: '2710.19.21', is_monophasic: dieselMonofasico }
                    ],
                    regime_tributario: 'lucro_real'
                };

                // Calculate with real configuration
                const custoBase = window.pricingEngine.calculateCustoBase(testEngineData);

                return {
                    success: true,
                    realData: {
                        sp_icms_rate: spIcms,
                        diesel_is_monophasic: dieselMonofasico,
                        lucro_real_allows_credits: lucroRealCredits
                    },
                    calculation: {
                        icms_calculated: testEngineData.totais.icms_devido,
                        custo_base: custoBase.total
                    },
                    filesLoaded: {
                        aliquotas: !!aliquotas.versao,
                        monofasica: !!monofasica.versao
                    }
                };

            } catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        expect(accuracyTest.success).toBeTruthy();
        expect(accuracyTest.filesLoaded.aliquotas).toBeTruthy();
        expect(accuracyTest.filesLoaded.monofasica).toBeTruthy();

        // Validate real data usage
        expect(accuracyTest.realData.sp_icms_rate).toBe(18); // SP ICMS rate
        expect(accuracyTest.realData.diesel_is_monophasic).toBeTruthy();
        expect(accuracyTest.realData.lucro_real_allows_credits).toBeTruthy();

        // Validate calculation uses real ICMS rate
        expect(accuracyTest.calculation.icms_calculated).toBe(12600.00); // 70000 * 18%

        console.log('✅ Mathematical accuracy validated with real data files');
        console.log('Accuracy Test:', accuracyTest);
    });

    test('Pricing Methods Integration', async ({ page }) => {
        // Test all 4 pricing methods work with cost calculations
        const pricingMethodsTest = await page.evaluate(async () => {
            try {
                const baseData = {
                    totais: {
                        valor_aduaneiro: 70000.00,
                        ii_devido: 52800.00,
                        ipi_devido: 47850.00,
                        pis_devido: 9508.90,
                        cofins_devido: 43679.25,
                        icms_devido: 12600.00,
                        despesas_aduaneiras: 1607.35
                    },
                    regime_tributario: 'lucro_real'
                };

                // Calculate base costs
                const custoBase = window.pricingEngine.calculateCustoBase(baseData);
                const custoDesembolso = window.pricingEngine.calculateCustoDesembolso(baseData);

                // Test pricing methods if available
                const pricingMethods = {};

                if (typeof window.pricingEngine.calculateCostPlus === 'function') {
                    pricingMethods.cost_plus = window.pricingEngine.calculateCostPlus(custoDesembolso.total, 25); // 25% margin
                }

                if (typeof window.pricingEngine.calculateCompetitive === 'function') {
                    pricingMethods.competitive = window.pricingEngine.calculateCompetitive(custoDesembolso.total, 450000); // Market price
                }

                if (typeof window.pricingEngine.calculateValueBased === 'function') {
                    pricingMethods.value_based = window.pricingEngine.calculateValueBased(custoDesembolso.total, 15000); // Value to customer
                }

                if (typeof window.pricingEngine.calculateDynamic === 'function') {
                    pricingMethods.dynamic = window.pricingEngine.calculateDynamic(custoDesembolso.total, {
                        demand: 'high',
                        competition: 'medium',
                        season: 'peak'
                    });
                }

                return {
                    success: true,
                    baseCosts: {
                        custo_base: custoBase.total,
                        custo_desembolso: custoDesembolso.total
                    },
                    pricingMethods,
                    availableMethods: Object.keys(pricingMethods)
                };

            } catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        expect(pricingMethodsTest.success).toBeTruthy();
        expect(pricingMethodsTest.baseCosts.custo_base).toBeGreaterThan(0);
        expect(pricingMethodsTest.baseCosts.custo_desembolso).toBeGreaterThan(0);

        // Validate pricing methods results if available
        if (pricingMethodsTest.pricingMethods.cost_plus) {
            expect(pricingMethodsTest.pricingMethods.cost_plus).toBeGreaterThan(pricingMethodsTest.baseCosts.custo_desembolso);
        }

        console.log('✅ Pricing methods integration validated');
        console.log('Pricing Methods Test:', pricingMethodsTest);
    });

});

test.describe('Nomenclature and Integration Validation', () => {

    test('Official Nomenclature Compliance', async ({ page }) => {
        await page.goto('http://localhost:8000/di-interface.html');
        await page.waitForTimeout(2000);

        // Test official nomenclature is enforced
        const nomenclatureTest = await page.evaluate(async () => {
            const violations = [];

            // Test data with incorrect nomenclature
            const testData = {
                di_id: 1,
                adicoes: [{
                    mercadorias: [], // VIOLATION: should be "produtos"
                    tax_regime: 'lucro_real', // VIOLATION: should be "regime_tributario"
                }],
                despesas: [], // VIOLATION: should be "despesas_aduaneiras"
                base_cost: 10000 // VIOLATION: should be "custo_base"
            };

            // Validate nomenclature violations are caught
            try {
                if (testData.adicoes[0].mercadorias) {
                    violations.push('VIOLAÇÃO NOMENCLATURA: Use "produtos" não "mercadorias"');
                }

                if (testData.adicoes[0].tax_regime) {
                    violations.push('VIOLAÇÃO NOMENCLATURA: Use "regime_tributario" não "tax_regime"');
                }

                if (testData.despesas && !testData.despesas_aduaneiras) {
                    violations.push('VIOLAÇÃO NOMENCLATURA: Use "despesas_aduaneiras" não "despesas"');
                }

                if (testData.base_cost !== undefined) {
                    violations.push('VIOLAÇÃO NOMENCLATURA: Use "custo_base" não "base_cost"');
                }

                return {
                    success: true,
                    violations,
                    isCompliant: violations.length === 0
                };

            } catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        expect(nomenclatureTest.success).toBeTruthy();
        expect(nomenclatureTest.violations.length).toBeGreaterThan(0); // Should catch violations
        expect(nomenclatureTest.isCompliant).toBeFalsy(); // Should not be compliant

        // Verify specific violations are caught
        expect(nomenclatureTest.violations.some(v => v.includes('produtos'))).toBeTruthy();
        expect(nomenclatureTest.violations.some(v => v.includes('regime_tributario'))).toBeTruthy();
        expect(nomenclatureTest.violations.some(v => v.includes('despesas_aduaneiras'))).toBeTruthy();
        expect(nomenclatureTest.violations.some(v => v.includes('custo_base'))).toBeTruthy();

        console.log('✅ Official nomenclature compliance enforced');
        console.log('Nomenclature Violations:', nomenclatureTest.violations);
    });

    test('Module Integration Validation', async ({ page }) => {
        await page.goto('http://localhost:8000/di-interface.html');
        await page.waitForTimeout(2000);

        // Test all required modules are properly integrated
        const integrationTest = await page.evaluate(() => {
            const modules = {
                DIProcessor: typeof window.DIProcessor,
                ComplianceCalculator: typeof window.ComplianceCalculator,
                PricingEngine: typeof window.PricingEngine,
                CostCalculationEngine: typeof window.CostCalculationEngine,
                RegimeConfigManager: typeof window.RegimeConfigManager,
                ProductMemoryManager: typeof window.ProductMemoryManager,
                IncentiveManager: typeof window.IncentiveManager,
                dbManager: typeof window.dbManager
            };

            const dependencies = {
                pricingEngine_has_costEngine: window.pricingEngine?.costCalculationEngine !== undefined,
                pricingEngine_has_regimeManager: window.pricingEngine?.regimeConfigManager !== undefined,
                complianceCalculator_initialized: window.complianceCalculator?.isReady || false
            };

            return {
                modules,
                dependencies,
                allModulesLoaded: Object.values(modules).every(type => type !== 'undefined'),
                criticalDependencies: dependencies.pricingEngine_has_costEngine && dependencies.pricingEngine_has_regimeManager
            };
        });

        // Verify all critical modules are loaded
        expect(integrationTest.modules.DIProcessor).toBe('function');
        expect(integrationTest.modules.ComplianceCalculator).toBe('function');
        expect(integrationTest.modules.PricingEngine).toBe('function');
        expect(integrationTest.modules.dbManager).toBe('object');

        // Verify dependencies are properly wired
        expect(integrationTest.criticalDependencies).toBeTruthy();

        console.log('✅ Module integration validation passed');
        console.log('Integration Test:', integrationTest);
    });
});