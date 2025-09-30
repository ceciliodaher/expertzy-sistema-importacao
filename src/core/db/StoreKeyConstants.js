/**
 * StoreKeyConstants.js - Centralized Store Key Management
 *
 * Padroniza nomenclatura de chaves para IndexedDB stores
 * Elimina strings hardcoded e inconsistências entre módulos
 *
 * PRINCÍPIO: Single Source of Truth para chaves de store
 */

export const StoreKeys = {
    /**
     * Chave para DI básica no store 'dis'
     * @param {string} numeroDI - Número da DI (ex: "2300120746")
     * @returns {string} numeroDI (sem prefixo - usada diretamente)
     */
    DI: (numeroDI) => {
        if (!numeroDI) {
            throw new Error('StoreKeys.DI: numeroDI é obrigatório');
        }
        return numeroDI;
    },

    /**
     * Chave para cálculos do ComplianceCalculator no store 'configs'
     * @param {string} numeroDI - Número da DI
     * @returns {string} "calculo_{numeroDI}"
     */
    CALCULO: (numeroDI) => {
        if (!numeroDI) {
            throw new Error('StoreKeys.CALCULO: numeroDI é obrigatório');
        }
        return `calculo_${numeroDI}`;
    },

    /**
     * Chave para DI processada no store 'configs'
     * @param {string} numeroDI - Número da DI
     * @returns {string} "di_processed_{numeroDI}"
     */
    DI_PROCESSADA: (numeroDI) => {
        if (!numeroDI) {
            throw new Error('StoreKeys.DI_PROCESSADA: numeroDI é obrigatório');
        }
        return `di_processed_${numeroDI}`;
    },

    /**
     * Chave para configuração geral do sistema no store 'configs'
     * @returns {string} "expertzy_config"
     */
    CONFIG_SISTEMA: 'expertzy_config',

    /**
     * Chave para produtos salvos no store 'produtos'
     * @param {string} productId - ID do produto
     * @returns {string} productId (sem prefixo)
     */
    PRODUTO: (productId) => {
        if (!productId) {
            throw new Error('StoreKeys.PRODUTO: productId é obrigatório');
        }
        return productId;
    },

    /**
     * Chave para NCM no store 'ncms'
     * @param {string} ncm - Código NCM (8 dígitos)
     * @returns {string} ncm (sem prefixo)
     */
    NCM: (ncm) => {
        if (!ncm) {
            throw new Error('StoreKeys.NCM: ncm é obrigatório');
        }
        return ncm;
    }
};

/**
 * Validador de chaves
 * Garante que as chaves geradas seguem padrões esperados
 */
export class StoreKeyValidator {
    /**
     * Valida formato de chave de cálculo
     * @param {string} key - Chave a validar
     * @returns {boolean} true se válida
     */
    static isCalculoKey(key) {
        return /^calculo_\d+$/.test(key);
    }

    /**
     * Valida formato de chave de DI processada
     * @param {string} key - Chave a validar
     * @returns {boolean} true se válida
     */
    static isDIProcessadaKey(key) {
        return /^di_processed_\d+$/.test(key);
    }

    /**
     * Extrai numeroDI de uma chave
     * @param {string} key - Chave (ex: "calculo2300120746")
     * @returns {string|null} numeroDI ou null se não encontrado
     */
    static extractNumeroDI(key) {
        const match = key.match(/(\d{10})/);
        return match ? match[1] : null;
    }
}

export default StoreKeys;
