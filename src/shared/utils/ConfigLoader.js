/**
 * ConfigLoader.js - Simple Configuration Loader
 * 
 * Loads only essential configuration files that change with legislation
 * Maintains KISS principle - don't over-engineer what works
 */


class ConfigLoader {
    constructor() {
        this.cache = {};
        this.loaded = false;
    }

    /**
     * Load all essential configuration files
     */
    async loadAll() {
        if (this.loaded) {
            return this.cache;
        }

        try {
            console.log('📂 ConfigLoader: Carregando configurações essenciais...');

            // Load existing working configurations + estados e moedas + tributacao-monofasica
            const configs = await Promise.all([
                fetch(new URL('../data/aliquotas.json', import.meta.url)).then(r => r.json()),
                fetch(new URL('../data/beneficios.json', import.meta.url)).then(r => r.json()),
                fetch(new URL('../data/config.json', import.meta.url)).then(r => r.json()),
                fetch(new URL('../data/import-fees.json', import.meta.url)).then(r => r.json()),
                fetch(new URL('../data/estados-brasil.json', import.meta.url)).then(r => r.json()),
                fetch(new URL('../data/moedas-siscomex.json', import.meta.url)).then(r => r.json()),
                fetch(new URL('../data/tributacao-monofasica.json', import.meta.url)).then(r => r.json())
            ]);

            this.cache = {
                aliquotas: configs[0],
                beneficios: configs[1], 
                config: configs[2],
                importFees: configs[3],
                estados: configs[4],
                moedas: configs[5],
                tributacaoMonofasica: configs[6]
            };

            this.loaded = true;
            console.log('✅ ConfigLoader: Configurações carregadas com sucesso');
            return this.cache;

        } catch (error) {
            console.error('❌ ConfigLoader: Erro ao carregar configurações:', error);
            throw new Error(`Falha ao carregar configurações: ${error.message}`);
        }
    }

    /**
     * Get ICMS rate for specific state
     */
    getICMSRate(estado) {
        if (!this.loaded) {
            throw new Error('ConfigLoader não inicializado - chame loadAll() primeiro');
        }

        const estadoConfig = this.cache.aliquotas.aliquotas_icms_2025[estado];
        if (!estadoConfig) {
            throw new Error(`Estado ${estado} não encontrado nas configurações ICMS`);
        }

        return estadoConfig.aliquota_interna;
    }

    /**
     * Get AFRMM rate
     */
    getAFRMMRate() {
        if (!this.loaded) {
            throw new Error('ConfigLoader não inicializado - chame loadAll() primeiro');
        }

        return this.cache.importFees.afrmm.rate;
    }

    /**
     * Get fiscal benefits for state and NCM
     */
    getBenefits(estado, ncm) {
        if (!this.loaded) {
            throw new Error('ConfigLoader não inicializado - chame loadAll() primeiro');
        }

        return this.cache.beneficios[estado] || null;
    }

    /**
     * Get SISCOMEX fees
     */
    getSISCOMEXFees() {
        if (!this.loaded) {
            throw new Error('ConfigLoader não inicializado - chame loadAll() primeiro');
        }

        return this.cache.importFees.siscomex;
    }

    /**
     * Get import fees configuration
     */
    getImportFees() {
        if (!this.loaded) {
            throw new Error('ConfigLoader não inicializado - chame loadAll() primeiro');
        }

        return this.cache.importFees;
    }

    /**
     * Check if configuration is loaded
     */
    isLoaded() {
        return this.loaded;
    }

    /**
     * Validate if state code is valid
     * @param {string} uf - State code to validate
     * @returns {boolean} True if valid state
     */
    isValidState(uf) {
        if (!this.loaded) {
            throw new Error('ConfigLoader não inicializado - chame loadAll() primeiro');
        }
        
        if (!uf) {
            throw new Error('Estado obrigatório não fornecido para validação');
        }
        
        return this.cache.estados.estados.some(e => e.codigo === uf.toUpperCase());
    }

    /**
     * Get state information
     * @param {string} uf - State code
     * @returns {Object} State data
     */
    getStateInfo(uf) {
        if (!this.loaded) {
            throw new Error('ConfigLoader não inicializado - chame loadAll() primeiro');
        }
        
        if (!uf) {
            throw new Error('Estado obrigatório não fornecido');
        }
        
        const estado = this.cache.estados.estados.find(e => e.codigo === uf.toUpperCase());
        
        if (!estado) {
            throw new Error(`Estado ${uf} não encontrado - verifique sigla UF válida`);
        }
        
        return estado;
    }

    /**
     * Get all states list
     * @returns {Array} Array of state objects
     */
    getAllStates() {
        if (!this.loaded) {
            throw new Error('ConfigLoader não inicializado - chame loadAll() primeiro');
        }
        
        return this.cache.estados.estados;
    }

    /**
     * Get ISO code from SISCOMEX currency code
     * @param {string} codigoSiscomex - SISCOMEX currency code
     * @returns {string} ISO currency code
     */
    getCurrencyISO(codigoSiscomex) {
        if (!this.loaded) {
            throw new Error('ConfigLoader não inicializado - chame loadAll() primeiro');
        }
        
        if (!codigoSiscomex) {
            throw new Error('Código SISCOMEX da moeda obrigatório não fornecido');
        }
        
        const codigoISO = this.cache.moedas.mapeamento_rapido[codigoSiscomex];
        
        if (!codigoISO) {
            throw new Error(`Código de moeda SISCOMEX ${codigoSiscomex} não reconhecido no sistema`);
        }
        
        return codigoISO;
    }

    /**
     * Get currency information
     * @param {string} codigoSiscomex - SISCOMEX currency code
     * @returns {Object} Currency data
     */
    getCurrencyInfo(codigoSiscomex) {
        if (!this.loaded) {
            throw new Error('ConfigLoader não inicializado - chame loadAll() primeiro');
        }
        
        if (!codigoSiscomex) {
            throw new Error('Código SISCOMEX obrigatório não fornecido');
        }
        
        const moeda = this.cache.moedas.moedas.find(m => m.codigo_siscomex === codigoSiscomex);
        
        if (!moeda) {
            throw new Error(`Moeda com código SISCOMEX ${codigoSiscomex} não cadastrada no sistema`);
        }
        
        return moeda;
    }

    /**
     * Get all currency mappings
     * @returns {Object} SISCOMEX to ISO mapping object
     */
    getCurrencyMappings() {
        if (!this.loaded) {
            throw new Error('ConfigLoader não inicializado - chame loadAll() primeiro');
        }
        
        return this.cache.moedas.mapeamento_rapido;
    }

    /**
     * Check if currency code is valid
     * @param {string} codigoSiscomex - SISCOMEX currency code
     * @returns {boolean} True if valid currency
     */
    isValidCurrency(codigoSiscomex) {
        if (!this.loaded) {
            throw new Error('ConfigLoader não inicializado - chame loadAll() primeiro');
        }
        
        if (!codigoSiscomex) {
            return false;
        }
        
        return this.cache.moedas.mapeamento_rapido.hasOwnProperty(codigoSiscomex);
    }

    /**
     * Métodos de compatibilidade para manter API esperada pelos módulos
     * Segue princípio DRY - reutiliza dados já carregados por loadAll()
     */
    
    /**
     * Load aliquotas data - compatibility wrapper
     * @returns {Promise<Object>} Aliquotas configuration
     */
    async loadAliquotas() {
        if (!this.loaded) await this.loadAll();
        return this.cache.aliquotas;
    }

    /**
     * Load tributacao monofasica data - compatibility wrapper
     * @returns {Promise<Object>} Tributacao monofasica configuration
     */
    async loadTributacaoMonofasica() {
        if (!this.loaded) await this.loadAll();
        return this.cache.tributacaoMonofasica;
    }

    /**
     * Load beneficios fiscais data - compatibility wrapper
     * @returns {Promise<Object>} Beneficios configuration
     */
    async loadBeneficios() {
        if (!this.loaded) await this.loadAll();
        return this.cache.beneficios;
    }

    /**
     * Load estados do Brasil data - compatibility wrapper
     * @returns {Promise<Object>} Estados configuration
     */
    async loadEstadosBrasil() {
        if (!this.loaded) await this.loadAll();
        return this.cache.estados;
    }

    /**
     * Load specific configuration file by name
     * @param {string} filename - Configuration filename to load
     * @returns {Promise<Object>} Configuration data
     */
    async loadConfig(filename) {
        if (!this.loaded) {
            await this.loadAll();
        }
        
        switch (filename) {
            case 'config.json':
                return this.cache.config;
            case 'aliquotas.json':
                return this.cache.aliquotas;
            case 'beneficios.json':
                return this.cache.beneficios;
            case 'import-fees.json':
                return this.cache.importFees;
            case 'estados-brasil.json':
                return this.cache.estados;
            case 'moedas-siscomex.json':
                return this.cache.moedas;
            case 'tributacao-monofasica.json':
                return this.cache.tributacaoMonofasica;
            case 'ncms-vedados.json':
                return this.cache.ncmsVedados;
            case 'unidades-medida.json':
                return this.cache.unidadesMedida;
            case 'codigos-receita.json':
                return this.cache.codigosReceita;
            case 'validacao-campos.json':
                return this.cache.validacaoCampos;
            case 'patterns-codigo-produto.json':
                return this.cache.patternsCodigo;
            case 'regime-aliquotas.json':
                return this.cache.regimeAliquotas;
            case 'reforma-tributaria.json':
                return this.cache.reformaTributaria;
            default:
                throw new Error(`ConfigLoader: Configuration file ${filename} not supported. Available files: config.json, aliquotas.json, beneficios.json, import-fees.json, estados-brasil.json, moedas-siscomex.json, tributacao-monofasica.json, ncms-vedados.json, unidades-medida.json, codigos-receita.json, validacao-campos.json, patterns-codigo-produto.json, regime-aliquotas.json, reforma-tributaria.json`);
        }
    }
}

export { ConfigLoader };