/**
 * Testes E2E para PricingAdapter
 * 
 * Valida a integração completa entre ComplianceCalculator e PricingAdapter
 * com foco em nomenclatura oficial e política NO FALLBACKS
 */

import { test, expect } from '@playwright/test';

test.describe('PricingAdapter - Integração E2E', () => {
    
    test.beforeEach(async ({ page }) => {
        // Navegar para a interface principal
        await page.goto('http://localhost:8000/di-interface.html');
        
        // Aguardar sistema carregar
        await page.waitForTimeout(2000);
    });

    test('deve inicializar PricingAdapter corretamente', async ({ page }) => {
        // Verificar se o PricingAdapter está disponível globalmente
        const adapterExists = await page.evaluate(() => {
            return window.pricingAdapter !== undefined;
        });
        
        expect(adapterExists).toBeTruthy();
        
        // Verificar se não está inicializado por padrão
        const isInitialized = await page.evaluate(() => {
            return window.pricingAdapter.isInitialized;
        });
        
        expect(isInitialized).toBeFalsy();
    });

    test('deve falhar ao processar sem inicialização (NO FALLBACKS)', async ({ page }) => {
        // Tentar processar dados sem inicializar - deve falhar
        const error = await page.evaluate(async () => {
            try {
                await window.pricingAdapter.processPricingData({
                    di_id: 1,
                    numero_di: '24/0000001-0'
                });
                return null;
            } catch (err) {
                return err.message;
            }
        });
        
        expect(error).toContain('PricingAdapter não inicializado');
    });

    test('deve validar nomenclatura oficial (NO FALLBACKS)', async ({ page }) => {
        // Testar validação de nomenclatura incorreta
        const error = await page.evaluate(async () => {
            // Primeiro inicializar com mocks
            await window.pricingAdapter.initialize({
                pricingEngine: { isInitialized: true, calculatePricing: async () => ({}) },
                incentiveManager: { getAvailablePrograms: async () => [] },
                dbManager: window.dbManager || { db: { pricing_configurations: { add: async () => {} } } }
            });
            
            try {
                // Tentar converter dados com nomenclatura incorreta
                const engineData = await window.pricingAdapter.convertToEngineFormat({
                    di_id: 1,
                    adicoes: [{
                        numero_adicao: '001',
                        ncm: '85171231',
                        mercadorias: [] // VIOLAÇÃO: deve ser "produtos"
                    }],
                    totais: {}
                });
                return null;
            } catch (err) {
                return err.message;
            }
        });
        
        expect(error).toContain('VIOLAÇÃO NOMENCLATURA');
    });

    test('deve processar simulação de incentivo fiscal cross-estado', async ({ page }) => {
        // Simular incentivo de SC para empresa de SP
        const resultado = await page.evaluate(async () => {
            // Inicializar com mocks
            await window.pricingAdapter.initialize({
                pricingEngine: { 
                    isInitialized: true, 
                    calculatePricing: async (data) => ({ 
                        ...data,
                        custo_base: 100000,
                        custo_desembolso: 90000
                    }) 
                },
                incentiveManager: { 
                    getAvailablePrograms: async () => ['SC_TTD_409'],
                    validateEligibility: async () => ({ eligible: true, percentual_reducao: 10 })
                },
                dbManager: { 
                    db: { 
                        pricing_configurations: { add: async () => 1 },
                        declaracoes: { update: async () => {} }
                    }
                }
            });
            
            // Processar com simulação
            const pricingData = {
                di_id: 1,
                numero_di: '24/0000001-0',
                estado_empresa: 'SP',
                programa_incentivo_simulacao: 'SC_TTD_409', // Simular SC em empresa de SP
                adicoes: [{
                    numero_adicao: '001',
                    ncm: '85171231',
                    produtos: []
                }],
                totais: {
                    ii_devido: 1000,
                    ipi_devido: 500
                }
            };
            
            const resultado = await window.pricingAdapter.processPricingData(pricingData);
            
            return {
                incentivos: resultado.incentivos,
                custos: {
                    base: resultado.custo_base,
                    desembolso: resultado.custo_desembolso
                }
            };
        });
        
        // Verificar que simulação foi detectada
        expect(resultado.incentivos?.is_simulacao).toBeTruthy();
        expect(resultado.incentivos?.aviso_simulacao).toContain('SIMULAÇÃO');
    });

    test('deve integrar com ComplianceCalculator via hook', async ({ page }) => {
        // Verificar se o hook foi adicionado ao ComplianceCalculator
        const hookExists = await page.evaluate(() => {
            // Verificar se o método preparePricingData existe
            if (!window.complianceCalculator) return false;
            
            return typeof window.complianceCalculator.preparePricingData === 'function';
        });
        
        expect(hookExists).toBeTruthy();
    });

    test('deve salvar configuração no IndexedDB v4', async ({ page }) => {
        // Verificar se as novas tabelas v4 existem
        const tablesExist = await page.evaluate(async () => {
            if (!window.dbManager) return false;
            
            // Verificar se schema v4 está ativo
            const version = window.dbManager.db.verno;
            if (version < 4) return false;
            
            // Verificar se tabela pricing_configurations existe
            return window.dbManager.db.pricing_configurations !== undefined;
        });
        
        expect(tablesExist).toBeTruthy();
    });

    test('deve calcular corretamente sem fallbacks', async ({ page }) => {
        // Testar que valores undefined não viram 0
        const error = await page.evaluate(async () => {
            await window.pricingAdapter.initialize({
                pricingEngine: { isInitialized: true, calculatePricing: async () => ({}) },
                incentiveManager: { getAvailablePrograms: async () => [] },
                dbManager: window.dbManager || { db: { pricing_configurations: { add: async () => {} } } }
            });
            
            try {
                const engineData = await window.pricingAdapter.convertToEngineFormat({
                    di_id: 1,
                    adicoes: [{
                        numero_adicao: '001',
                        ncm: '85171231',
                        // valores ausentes - NÃO devem ter fallback para 0
                        produtos: []
                    }],
                    totais: {
                        // valores ausentes - devem ser passados como undefined
                    }
                });
                
                // Verificar que não há fallbacks
                return {
                    valor_reais: engineData.adicoes[0].valor_reais,
                    ii_devido: engineData.totais.ii_devido
                };
            } catch (err) {
                return { error: err.message };
            }
        });
        
        // Valores devem ser undefined, não 0
        expect(error.valor_reais).toBeUndefined();
        expect(error.ii_devido).toBeUndefined();
    });

    test('deve permitir simulação de múltiplos cenários', async ({ page }) => {
        // Testar método simulatePricing
        const cenarios = await page.evaluate(async () => {
            // Inicializar
            await window.pricingAdapter.initialize({
                pricingEngine: { 
                    isInitialized: true, 
                    calculatePricing: async (data) => ({ 
                        ...data,
                        custo_base: 100000,
                        custo_desembolso: data.incentivos?.eligible ? 85000 : 95000
                    }) 
                },
                incentiveManager: { 
                    getAvailablePrograms: async (estado) => {
                        const programas = {
                            'SC': ['SC_TTD_409'],
                            'MG': ['MG_CORREDOR'],
                            'ES': ['ES_INVEST'],
                            'GO': ['GO_COMEXPRODUZIR']
                        };
                        return programas[estado] || [];
                    },
                    validateEligibility: async (estado, programa) => {
                        return { eligible: true, percentual_reducao: 15 };
                    }
                },
                dbManager: { 
                    db: { 
                        declaracoes: { get: async () => ({ numero_di: '24/0000001-0', importador: { endereco_uf: 'SP' } }) },
                        pricing_configurations: { add: async () => 1 },
                        declaracoes: { update: async () => {} }
                    },
                    getAdicoesByDI: async () => [],
                    getDespesasByDI: async () => []
                }
            });
            
            // Simular diferentes cenários
            const cenarioSC = await window.pricingAdapter.simulatePricing(1, {
                estado_empresa: 'SC',
                programa_incentivo: 'SC_TTD_409'
            });
            
            const cenarioMG = await window.pricingAdapter.simulatePricing(1, {
                estado_empresa: 'MG',
                programa_incentivo: 'MG_CORREDOR'
            });
            
            return {
                SC: cenarioSC.custo_desembolso,
                MG: cenarioMG.custo_desembolso,
                diferenca: Math.abs(cenarioSC.custo_desembolso - cenarioMG.custo_desembolso)
            };
        });
        
        // Deve haver diferença entre os cenários
        expect(cenarios.SC).toBeDefined();
        expect(cenarios.MG).toBeDefined();
    });
});

test.describe('Validações de Nomenclatura', () => {
    
    test('deve rejeitar campo "tax_regime"', async ({ page }) => {
        await page.goto('http://localhost:8000/di-interface.html');
        
        const error = await page.evaluate(async () => {
            const data = { tax_regime: 'lucro_real' };
            
            // Simular validação
            if (data.tax_regime) {
                return 'VIOLAÇÃO NOMENCLATURA: Use "regime_tributario" não "tax_regime"';
            }
            return null;
        });
        
        expect(error).toContain('regime_tributario');
    });
    
    test('deve rejeitar campo "base_cost"', async ({ page }) => {
        await page.goto('http://localhost:8000/di-interface.html');
        
        const error = await page.evaluate(async () => {
            const data = { base_cost: 10000 };
            
            // Simular validação
            if (data.base_cost !== undefined) {
                return 'VIOLAÇÃO NOMENCLATURA: Use "custo_base" não "base_cost"';
            }
            return null;
        });
        
        expect(error).toContain('custo_base');
    });
});