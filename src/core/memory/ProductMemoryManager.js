/**
 * ProductMemoryManager.js - Gerenciador de Memória de Produtos Importados
 * 
 * Sistema de armazenamento estruturado para produtos importados
 * Utiliza IndexedDBManager para persistência - NO FALLBACKS
 * 
 * @version 2.0.0
 * @author Expertzy System
 */

import IndexedDBManager from '@services/database/IndexedDBManager.js';

class ProductMemoryManager {
    constructor() {
        this.storageKey = 'expertzy_products_memory';
        this.products = [];
        this.lastSyncTime = null;
        this.initialized = false;
        this.indexedDBManager = new IndexedDBManager();
        this.initializeStorage();
    }

    /**
     * Inicializa o storage IndexedDB e carrega dados existentes
     */
    async initializeStorage() {
        try {
            if (!this.indexedDBManager) {
                throw new Error('IndexedDBManager não disponível - obrigatório para ProductMemoryManager');
            }
            
            await this.indexedDBManager.initialize();
            
            const stored = await this.indexedDBManager.getConfig(this.storageKey);
            if (stored) {
                this.products = stored.products || [];
                this.lastSyncTime = stored.lastSyncTime || null;
                console.log(`✅ ProductMemoryManager: ${this.products.length} produtos carregados`);
            } else {
                this.products = [];
                await this.saveToStorage();
                console.log('🆕 ProductMemoryManager: Storage inicializado');
            }
            
            this.initialized = true;
        } catch (error) {
            console.error('❌ Erro ao inicializar ProductMemoryManager:', error);
            throw new Error(`ProductMemoryManager initialization failed: ${error.message}`);
        }
    }

    /**
     * Gera ID único para produto (UUID v4 simplificado)
     */
    generateProductId() {
        return 'prod_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Salva produto na memória
     * @param {Object} productData - Dados do produto da DI
     * @returns {Object} Produto salvo com ID
     */
    async saveProduct(productData) {
        if (!this.initialized) {
            throw new Error('ProductMemoryManager não inicializado - chame initializeStorage() primeiro');
        }
        try {
            // Estrutura database-ready
            const product = {
                id: this.generateProductId(),
                di_number: productData.di_number || null,
                addition_number: productData.addition_number || null,
                ncm: productData.ncm || null,
                description: productData.description || '',
                quantity: productData.quantity || 0,
                unit: productData.unit || 'UN',
                weight_kg: productData.weight_kg || 0,
                
                // Custos Base (antes de créditos)
                base_costs: {
                    cif_brl: this.validateCost(productData.cif_brl, 'CIF BRL'),
                    ii: this.validateCost(productData.ii, 'II'),
                    ipi: this.validateCost(productData.ipi, 'IPI'),
                    pis_import: this.validateCost(productData.pis_import, 'PIS'),
                    cofins_import: this.validateCost(productData.cofins_import, 'COFINS'),
                    cofins_adicional: productData.cofins_adicional || 0, // Opcional
                    icms_import: this.validateCost(productData.icms_import, 'ICMS'),
                    icms_st: productData.icms_st || 0, // Opcional
                    expenses: {
                        siscomex: productData.expenses?.siscomex || 0,
                        afrmm: productData.expenses?.afrmm || 0,
                        capatazia: productData.expenses?.capatazia || 0,
                        armazenagem: productData.expenses?.armazenagem || 0,
                        outras: productData.expenses?.outras || 0
                    },
                    total_base_cost: 0 // Calculado abaixo
                },
                
                // Flags especiais
                special_cases: {
                    is_monofasico: productData.is_monofasico || false,
                    has_icms_st: productData.has_icms_st || false,
                    has_cofins_adicional: productData.has_cofins_adicional || false,
                    industrial_use: productData.industrial_use || false
                },
                
                // Metadados
                metadata: {
                    exchange_rate: this.validateExchangeRate(productData.exchange_rate),
                    import_date: productData.import_date || new Date().toISOString(),
                    state: this.validateState(productData.state),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            };

            // Calcular custo base total
            product.base_costs.total_base_cost = this.calculateTotalBaseCost(product.base_costs);

            // Adicionar à lista
            this.products.push(product);
            await this.saveToStorage();

            console.log(`✅ Produto salvo: ${product.id} - NCM ${product.ncm}`);
            return product;

        } catch (error) {
            console.error('❌ Erro ao salvar produto:', error);
            throw error;
        }
    }

    /**
     * Salva múltiplos produtos de uma DI
     * @param {String} diNumber - Número da DI
     * @param {Array} additions - Adições da DI com produtos
     * @param {Object} calculations - Cálculos realizados
     */
    async saveProductsFromDI(diNumber, additions, calculations) {
        if (!this.initialized) {
            throw new Error('ProductMemoryManager não inicializado - chame initializeStorage() primeiro');
        }
        const savedProducts = [];
        
        try {
            for (const [index, addition] of additions.entries()) {
                // Para cada produto na adição
                const products = addition.produtos || [addition]; // Se não tiver produtos, usa a própria adição
                
                for (const [prodIndex, product] of products.entries()) {
                    const productData = {
                        di_number: diNumber,
                        addition_number: addition.numero_adicao || index + 1,
                        ncm: addition.ncm || product.ncm,
                        description: product.descricao || addition.descricao || '',
                        quantity: product.quantidade || 0,
                        unit: product.unidade || 'UN',
                        weight_kg: product.peso_liquido || 0,
                        
                        // Custos da adição (rateados se múltiplos produtos)
                        cif_brl: product.valor_unitario_brl * product.quantidade || 0,
                        ii: this.extractTaxValue(calculations, 'ii', index),
                        ipi: this.extractTaxValue(calculations, 'ipi', index),
                        pis_import: this.extractTaxValue(calculations, 'pis', index),
                        cofins_import: this.extractTaxValue(calculations, 'cofins', index),
                        cofins_adicional: this.extractTaxValue(calculations, 'cofins_adicional', index),
                        icms_import: this.extractTaxValue(calculations, 'icms', index),
                        icms_st: this.extractTaxValue(calculations, 'icms_st', index),
                        
                        expenses: {
                            siscomex: this.extractExpense(calculations, 'siscomex', index),
                            afrmm: this.extractExpense(calculations, 'afrmm', index),
                            capatazia: this.extractExpense(calculations, 'capatazia', index),
                            armazenagem: this.extractExpense(calculations, 'armazenagem', index),
                            outras: this.extractExpense(calculations, 'outras', index)
                        },
                        
                        // Flags especiais (detectar automaticamente)
                        is_monofasico: this.checkMonofasico(addition.ncm),
                        has_icms_st: calculations?.icms_st?.valor > 0,
                        has_cofins_adicional: calculations?.cofins_adicional?.valor > 0,
                        industrial_use: false, // Definido pelo usuário depois
                        
                        // Metadados
                        exchange_rate: this.validateExchangeRate(addition.taxa_cambio),
                        import_date: addition.data_registro || new Date().toISOString(),
                        state: this.validateState(calculations?.estado)
                    };
                    
                    const saved = await this.saveProduct(productData);
                    savedProducts.push(saved);
                }
            }

            console.log(`✅ ${savedProducts.length} produtos salvos da DI ${diNumber}`);
            return savedProducts;

        } catch (error) {
            console.error('❌ Erro ao salvar produtos da DI:', error);
            throw error;
        }
    }

    /**
     * Calcula custo base total
     */
    calculateTotalBaseCost(costs) {
        const taxes = costs.cif_brl + costs.ii + costs.ipi + 
                     costs.pis_import + costs.cofins_import + 
                     costs.cofins_adicional + costs.icms_import + costs.icms_st;
        
        const expenses = Object.values(costs.expenses).reduce((sum, val) => sum + val, 0);
        
        return taxes + expenses;
    }

    /**
     * Extrai valor de imposto dos cálculos
     */
    extractTaxValue(calculations, taxType, additionIndex) {
        try {
            if (calculations?.calculos_individuais?.[additionIndex]) {
                const calc = calculations.calculos_individuais[additionIndex];
                
                switch(taxType) {
                    case 'ii': return calc.impostos?.ii?.valor_devido || 0;
                    case 'ipi': return calc.impostos?.ipi?.valor_devido || 0;
                    case 'pis': return calc.impostos?.pis?.valor_devido || 0;
                    case 'cofins': return calc.impostos?.cofins?.valor_devido || 0;
                    case 'cofins_adicional': return calc.impostos?.cofins?.adicional || 0;
                    case 'icms': return calc.impostos?.icms?.valor_devido || 0;
                    case 'icms_st': return calc.impostos?.icms?.st_valor || 0;
                    default: return 0;
                }
            }
            return 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Extrai valor de despesa dos cálculos
     */
    extractExpense(calculations, expenseType, additionIndex) {
        try {
            if (calculations?.despesas) {
                const proporcao = 1 / (calculations.numero_adicoes || 1);
                
                switch(expenseType) {
                    case 'siscomex': 
                        return (calculations.despesas.automaticas?.siscomex || 0) * proporcao;
                    case 'afrmm': 
                        return (calculations.despesas.automaticas?.afrmm || 0) * proporcao;
                    case 'capatazia': 
                        return (calculations.despesas.automaticas?.capatazia || 0) * proporcao;
                    case 'armazenagem': 
                        return (calculations.despesas.extras?.armazenagem || 0) * proporcao;
                    case 'outras': 
                        return (calculations.despesas.extras?.outras || 0) * proporcao;
                    default: 
                        return 0;
                }
            }
            return 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Verifica se NCM é monofásico (simplificado - deve ser expandido)
     */
    checkMonofasico(ncm) {
        // Lista simplificada - deve ser expandida com NCMs reais
        const monofasicoNCMs = [
            '2207', // Álcool
            '2710', // Combustíveis
            '3303', // Perfumes
            '3304', // Cosméticos
        ];
        
        if (!ncm) return false;
        const ncm4 = ncm.substring(0, 4);
        return monofasicoNCMs.includes(ncm4);
    }

    /**
     * Busca produto por ID
     */
    getProductById(productId) {
        return this.products.find(p => p.id === productId);
    }

    /**
     * Busca produtos por DI
     */
    getProductsByDI(diNumber) {
        return this.products.filter(p => p.di_number === diNumber);
    }

    /**
     * Busca produtos por NCM
     */
    getProductsByNCM(ncm) {
        return this.products.filter(p => p.ncm === ncm);
    }

    /**
     * Atualiza produto existente
     */
    async updateProduct(productId, updates) {
        if (!this.initialized) {
            throw new Error('ProductMemoryManager não inicializado - chame initializeStorage() primeiro');
        }
        const index = this.products.findIndex(p => p.id === productId);
        if (index === -1) {
            throw new Error(`Produto ${productId} não encontrado`);
        }

        this.products[index] = {
            ...this.products[index],
            ...updates,
            metadata: {
                ...this.products[index].metadata,
                updated_at: new Date().toISOString()
            }
        };

        await this.saveToStorage();
        console.log(`✅ Produto ${productId} atualizado`);
        return this.products[index];
    }

    /**
     * Remove produto
     */
    async deleteProduct(productId) {
        if (!this.initialized) {
            throw new Error('ProductMemoryManager não inicializado - chame initializeStorage() primeiro');
        }
        const index = this.products.findIndex(p => p.id === productId);
        if (index === -1) {
            throw new Error(`Produto ${productId} não encontrado`);
        }

        const deleted = this.products.splice(index, 1)[0];
        await this.saveToStorage();
        console.log(`✅ Produto ${productId} removido`);
        return deleted;
    }

    /**
     * Limpa todos os produtos
     */
    async clearAll() {
        if (!this.initialized) {
            throw new Error('ProductMemoryManager não inicializado - chame initializeStorage() primeiro');
        }
        
        this.products = [];
        await this.saveToStorage();
        console.log('✅ Todos os produtos foram removidos');
    }

    /**
     * Salva no IndexedDB
     */
    async saveToStorage() {
        try {
            if (!this.indexedDBManager) {
                throw new Error('IndexedDBManager não disponível - obrigatório para salvar dados');
            }
            
            const data = {
                products: this.products,
                lastSyncTime: new Date().toISOString(),
                version: '2.0.0'
            };
            
            await this.indexedDBManager.saveConfig(this.storageKey, data);
            this.lastSyncTime = data.lastSyncTime;
            
        } catch (error) {
            console.error('❌ Erro ao salvar no IndexedDB:', error);
            throw new Error(`Falha ao salvar produtos: ${error.message}`);
        }
    }

    /**
     * Exporta dados para JSON (preparação para DB)
     */
    exportToJSON() {
        const data = {
            products: this.products,
            exportTime: new Date().toISOString(),
            totalProducts: this.products.length,
            version: '1.0.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `products_memory_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`✅ ${this.products.length} produtos exportados`);
    }

    /**
     * Importa dados de JSON
     */
    async importFromJSON(jsonData) {
        if (!this.initialized) {
            throw new Error('ProductMemoryManager não inicializado - chame initializeStorage() primeiro');
        }
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            
            if (!data.products || !Array.isArray(data.products)) {
                throw new Error('Formato de dados inválido');
            }

            this.products = data.products;
            await this.saveToStorage();
            
            console.log(`✅ ${this.products.length} produtos importados`);
            return this.products;
            
        } catch (error) {
            console.error('❌ Erro ao importar dados:', error);
            throw error;
        }
    }

    /**
     * Estatísticas dos produtos em memória
     */
    getStatistics() {
        const stats = {
            totalProducts: this.products.length,
            totalDIs: new Set(this.products.map(p => p.di_number)).size,
            totalNCMs: new Set(this.products.map(p => p.ncm)).size,
            totalValue: this.products.reduce((sum, p) => sum + p.base_costs.total_base_cost, 0),
            averageCost: 0,
            productsByState: {},
            specialCases: {
                monofasico: this.products.filter(p => p.special_cases.is_monofasico).length,
                icms_st: this.products.filter(p => p.special_cases.has_icms_st).length,
                cofins_adicional: this.products.filter(p => p.special_cases.has_cofins_adicional).length,
                industrial_use: this.products.filter(p => p.special_cases.industrial_use).length
            }
        };

        if (stats.totalProducts > 0) {
            stats.averageCost = stats.totalValue / stats.totalProducts;
        }

        // Agrupar por estado
        this.products.forEach(p => {
            const state = p.metadata.state;
            stats.productsByState[state] = (stats.productsByState[state] || 0) + 1;
        });

        return stats;
    }

    /**
     * Valida taxa de câmbio - FAIL-FAST conforme CLAUDE.md
     */
    validateExchangeRate(taxa_cambio) {
        if (typeof taxa_cambio !== 'number' || taxa_cambio <= 0) {
            throw new Error('Taxa de câmbio deve ser numérica e positiva - obrigatória para salvar produto');
        }
        return taxa_cambio;
    }

    /**
     * Valida estado - FAIL-FAST conforme CLAUDE.md  
     */
    validateState(estado) {
        if (!estado || typeof estado !== 'string') {
            throw new Error('Estado da DI ausente - obrigatório para salvar produto');
        }
        return estado;
    }

    /**
     * Valida custos obrigatórios - FAIL-FAST conforme CLAUDE.md
     */
    validateCost(cost, costName) {
        if (typeof cost !== 'number' || cost < 0) {
            throw new Error(`${costName} deve ser numérico e não-negativo - obrigatório para salvar produto`);
        }
        return cost;
    }
}

// Export ES6 para compatibilidade com importação IndexedDBManager
export default ProductMemoryManager;

// Exportar para uso global se não estiver em ambiente de módulos (backward compatibility)
// ES6 Module Export
export { ProductMemoryManager };