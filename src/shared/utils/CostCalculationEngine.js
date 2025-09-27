/**
 * CostCalculationEngine.js - Motor de Cálculo de Custos por Regime Tributário
 * 
 * Calcula custos líquidos aplicando créditos conforme regime tributário
 * Integra com IndexedDBManager (single source of truth) e RegimeConfigManager
 * Utiliza IndexedDBManager para persistência - NO FALLBACKS
 * 
 * @version 2.0.0
 * @author Expertzy System
 */

import IndexedDBManager from '@services/database/IndexedDBManager.js';

class CostCalculationEngine {
    constructor() {
        this.indexedDBManager = null;
        this.regimeConfig = null;
        this.calculatedCosts = [];
        this.storageKey = 'expertzy_calculated_costs';
        this.initialized = false;
        this.indexedDBManager = new IndexedDBManager();
        this.initializeEngine();
    }

    /**
     * Inicializa o motor de cálculo
     */
    async initializeEngine() {
        try {
            if (!this.indexedDBManager) {
                throw new Error('IndexedDBManager não disponível - obrigatório para CostCalculationEngine');
            }
            
            await this.indexedDBManager.initialize();
            
            // Instanciar manager singleton
            this.indexedDBManager = IndexedDBManager.getInstance();
            
            this.regimeConfig = new RegimeConfigManager();
            await this.regimeConfig.initializeConfig();
            
            // Aguardar carregamento das alíquotas
            await this.regimeConfig.loadRegimeAliquotas();
            
            // Carregar cálculos salvos
            await this.loadCalculatedCosts();
            
            this.initialized = true;
            console.log('✅ CostCalculationEngine inicializado');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar CostCalculationEngine:', error);
            throw new Error(`CostCalculationEngine initialization failed: ${error.message}`);
        }
    }

    /**
     * Carrega custos calculados do IndexedDB
     */
    async loadCalculatedCosts() {
        try {
            if (!this.indexedDBManager) {
                throw new Error('IndexedDBManager não disponível - obrigatório para carregar custos');
            }
            
            const stored = await this.indexedDBManager.getConfig(this.storageKey);
            if (stored) {
                this.calculatedCosts = stored.calculations || [];
                console.log(`✅ ${this.calculatedCosts.length} custos calculados carregados`);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar custos calculados:', error);
            throw new Error(`Falha ao carregar custos calculados: ${error.message}`);
        }
    }

    /**
     * Salva custos calculados no IndexedDB
     */
    async saveCalculatedCosts() {
        try {
            if (!this.indexedDBManager) {
                throw new Error('IndexedDBManager não disponível - obrigatório para salvar custos');
            }
            
            if (!this.initialized) {
                throw new Error('CostCalculationEngine não inicializado - chame initializeEngine() primeiro');
            }
            
            const data = {
                calculations: this.calculatedCosts,
                lastUpdated: new Date().toISOString(),
                version: '2.0.0'
            };
            
            await this.indexedDBManager.saveConfig(this.storageKey, data);
            
        } catch (error) {
            console.error('❌ Erro ao salvar custos calculados:', error);
            throw new Error(`Falha ao salvar custos calculados: ${error.message}`);
        }
    }

    /**
     * Calcula custos para um produto específico em um regime
     */
    async calculateProductCost(productId, regime = null) {
        if (!this.initialized) {
            throw new Error('CostCalculationEngine não inicializado - chame initializeEngine() primeiro');
        }
        try {
            // Obter produto da memória
            const product = await this.indexedDBManager.getProductById(productId);
            if (!product) {
                throw new Error(`Produto ${productId} não encontrado`);
            }

            // Usar regime atual se não especificado
            const targetRegime = regime || this.regimeConfig.getCurrentRegime();
            
            // Obter créditos aplicáveis
            const applicableCredits = this.regimeConfig.getApplicableCredits(targetRegime);
            
            // Calcular créditos
            const credits = this.calculateApplicableCredits(product, applicableCredits);
            
            // Calcular custo líquido
            const netCost = this.calculateNetCost(product, credits);
            
            // Obter alíquotas de saída
            const salesTaxRates = this.regimeConfig.getSalesTaxRates(targetRegime);
            
            // Criar objeto de custo calculado
            const calculatedCost = {
                product_id: productId,
                di_number: product.di_number,
                regime: targetRegime,
                
                // Créditos aplicáveis
                tax_credits: {
                    icms: credits.icms,
                    ipi: credits.ipi,
                    pis: credits.pis,
                    cofins: credits.cofins,
                    total_credits: credits.total
                },
                
                // Custo líquido
                net_cost: {
                    base_cost: product.base_costs.total_base_cost,
                    credits: credits.total,
                    final_cost: netCost.total,
                    unit_cost: netCost.unit
                },
                
                // Impostos na saída
                sales_taxes: salesTaxRates,
                
                // Detalhes especiais
                special_cases: {
                    monofasico: product.special_cases.is_monofasico,
                    icms_st: product.special_cases.has_icms_st,
                    cofins_adicional: product.special_cases.has_cofins_adicional,
                    industrial_use: product.special_cases.industrial_use
                },
                
                calculated_at: new Date().toISOString()
            };

            // Salvar cálculo
            await this.saveCalculation(calculatedCost);
            
            console.log(`✅ Custo calculado para ${productId} no regime ${targetRegime}`);
            return calculatedCost;
            
        } catch (error) {
            console.error('❌ Erro ao calcular custo do produto:', error);
            throw error;
        }
    }

    /**
     * Calcula créditos aplicáveis para um produto
     */
    calculateApplicableCredits(product, applicableCredits) {
        const credits = {
            icms: 0,
            ipi: 0,
            pis: 0,
            cofins: 0,
            total: 0
        };

        // ICMS - Sempre creditável se regime permite
        if (applicableCredits.icms) {
            credits.icms = product.base_costs.icms_import;
        }

        // IPI - Só para indústria ou insumo industrial
        if (applicableCredits.ipi) {
            credits.ipi = product.base_costs.ipi;
        }

        // PIS - Regime não cumulativo
        if (applicableCredits.pis) {
            credits.pis = product.base_costs.pis_import;
        }

        // COFINS - Regime não cumulativo (exceto adicional 1%)
        if (applicableCredits.cofins) {
            credits.cofins = product.base_costs.cofins_import;
            // IMPORTANTE: Adicional de 1% nunca gera crédito
            // (já está excluído do cofins_import no ProductMemoryManager)
        }

        // Tratamento especial para casos específicos
        this.applySpecialCaseCredits(product, credits, applicableCredits);

        // Total de créditos
        credits.total = credits.icms + credits.ipi + credits.pis + credits.cofins;

        return credits;
    }

    /**
     * Aplica regras especiais para casos específicos
     */
    applySpecialCaseCredits(product, credits, applicableCredits) {
        // Produtos monofásicos de PIS/COFINS
        if (product.special_cases.is_monofasico) {
            // No Lucro Real, créditos podem ser mantidos mesmo com saída monofásica
            if (applicableCredits.regime === 'lucro_real') {
                // Manter créditos PIS/COFINS da importação
                console.log('ℹ️ Produto monofásico - créditos mantidos (Lucro Real)');
            } else {
                // Nos outros regimes, normalmente não há créditos mesmo
                console.log('ℹ️ Produto monofásico identificado');
            }
        }

        // ICMS-ST - Valor pago não gera crédito
        if (product.special_cases.has_icms_st) {
            console.log('ℹ️ ICMS-ST identificado - não gera crédito ao substituto');
        }

        // COFINS adicional - Nunca gera crédito
        if (product.special_cases.has_cofins_adicional) {
            // Crédito de COFINS já deve excluir o adicional
            console.log('ℹ️ COFINS adicional identificado - não gera crédito');
        }
    }

    /**
     * Calcula custo líquido após aplicação de créditos
     */
    calculateNetCost(product, credits) {
        const baseCost = product.base_costs.total_base_cost;
        const totalCredits = credits.total;
        const finalCost = baseCost - totalCredits;
        
        const quantity = product.quantity || 1;
        const unitCost = quantity > 0 ? finalCost / quantity : finalCost;

        return {
            base: baseCost,
            credits: totalCredits,
            total: finalCost,
            unit: unitCost
        };
    }

    /**
     * Calcula custos para todos os regimes de um produto
     */
    async calculateForAllRegimes(productId) {
        if (!this.initialized) {
            throw new Error('CostCalculationEngine não inicializado - chame initializeEngine() primeiro');
        }
        const regimes = ['lucro_real', 'lucro_presumido', 'simples_nacional'];
        const results = {};

        for (const regime of regimes) {
            try {
                results[regime] = await this.calculateProductCost(productId, regime);
            } catch (error) {
                console.error(`❌ Erro ao calcular ${regime} para produto ${productId}:`, error);
                results[regime] = null;
            }
        }

        return results;
    }

    /**
     * Calcula custos para todos os produtos de uma DI
     */
    async calculateDICosts(diNumber, regime = null) {
        if (!this.initialized) {
            throw new Error('CostCalculationEngine não inicializado - chame initializeEngine() primeiro');
        }
        try {
            const products = await this.indexedDBManager.getProductsByDI(diNumber);
            if (!products || products.length === 0) {
                throw new Error(`Nenhum produto encontrado para DI ${diNumber}`);
            }

            const results = [];
            for (const product of products) {
                try {
                    const calculation = await this.calculateProductCost(product.id, regime);
                    results.push(calculation);
                } catch (error) {
                    console.error(`❌ Erro no produto ${product.id}:`, error);
                }
            }

            console.log(`✅ ${results.length} produtos calculados para DI ${diNumber}`);
            return results;

        } catch (error) {
            console.error('❌ Erro ao calcular custos da DI:', error);
            throw error;
        }
    }

    /**
     * Salva cálculo realizado
     */
    async saveCalculation(calculation) {
        if (!this.initialized) {
            throw new Error('CostCalculationEngine não inicializado - chame initializeEngine() primeiro');
        }
        // Remover cálculo anterior para o mesmo produto/regime
        this.calculatedCosts = this.calculatedCosts.filter(
            c => !(c.product_id === calculation.product_id && c.regime === calculation.regime)
        );

        // Adicionar novo cálculo
        this.calculatedCosts.push(calculation);
        
        // Salvar no IndexedDB
        await this.saveCalculatedCosts();
    }

    /**
     * Obtém custo calculado por produto e regime
     */
    getCalculatedCost(productId, regime) {
        return this.calculatedCosts.find(
            c => c.product_id === productId && c.regime === regime
        );
    }

    /**
     * Obtém todos os custos de um produto
     */
    getProductCosts(productId) {
        return this.calculatedCosts.filter(c => c.product_id === productId);
    }

    /**
     * Obtém custos por DI
     */
    getDICosts(diNumber) {
        return this.calculatedCosts.filter(c => c.di_number === diNumber);
    }

    /**
     * Compara custos entre regimes
     */
    compareRegimeCosts(productId) {
        const regimeCosts = ['lucro_real', 'lucro_presumido', 'simples_nacional']
            .map(regime => {
                const cost = this.getCalculatedCost(productId, regime);
                return cost ? {
                    regime: regime,
                    final_cost: cost.net_cost.final_cost,
                    unit_cost: cost.net_cost.unit_cost,
                    credits: cost.tax_credits.total_credits,
                    base_cost: cost.net_cost.base_cost
                } : null;
            })
            .filter(Boolean);

        // Ordenar por menor custo
        regimeCosts.sort((a, b) => a.final_cost - b.final_cost);

        const best = regimeCosts[0];
        const worst = regimeCosts[regimeCosts.length - 1];
        const savings = worst ? worst.final_cost - best.final_cost : 0;
        const savingsPercent = worst && worst.final_cost > 0 ? 
            (savings / worst.final_cost) * 100 : 0;

        return {
            regimes: regimeCosts,
            best_regime: best?.regime,
            worst_regime: worst?.regime,
            potential_savings: savings,
            savings_percent: savingsPercent
        };
    }

    /**
     * Obtém estatísticas dos cálculos
     */
    getStatistics() {
        const totalCalculations = this.calculatedCosts.length;
        const uniqueProducts = new Set(this.calculatedCosts.map(c => c.product_id)).size;
        const uniqueDIs = new Set(this.calculatedCosts.map(c => c.di_number)).size;

        const regimeBreakdown = {};
        this.calculatedCosts.forEach(c => {
            regimeBreakdown[c.regime] = (regimeBreakdown[c.regime] || 0) + 1;
        });

        const totalCredits = this.calculatedCosts.reduce(
            (sum, c) => sum + c.tax_credits.total_credits, 0
        );

        return {
            total_calculations: totalCalculations,
            unique_products: uniqueProducts,
            unique_dis: uniqueDIs,
            regime_breakdown: regimeBreakdown,
            total_credits_applied: totalCredits,
            average_credits: totalCalculations > 0 ? totalCredits / totalCalculations : 0
        };
    }

    /**
     * Limpa todos os cálculos
     */
    async clearAllCalculations() {
        if (!this.initialized) {
            throw new Error('CostCalculationEngine não inicializado - chame initializeEngine() primeiro');
        }
        
        this.calculatedCosts = [];
        await this.saveCalculatedCosts();
        console.log('✅ Todos os cálculos foram limpos');
    }

    /**
     * Exporta cálculos para JSON
     */
    exportCalculations() {
        const data = {
            calculations: this.calculatedCosts,
            statistics: this.getStatistics(),
            export_time: new Date().toISOString(),
            version: '1.0.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `calculated_costs_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`✅ ${this.calculatedCosts.length} cálculos exportados`);
    }
}

// Export ES6 para compatibilidade com importação IndexedDBManager
export default CostCalculationEngine;

// Exportar para uso global se não estiver em ambiente de módulos (backward compatibility)
export { CostCalculationEngine };