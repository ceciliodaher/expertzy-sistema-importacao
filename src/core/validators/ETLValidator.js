/**
 * ETLValidator.js - Sistema de Validação ETL para Declarações de Importação
 * 
 * ARQUITETURA: Base Orchestrator seguindo princípios SOLID
 * RESPONSABILIDADE: Coordenar validações ETL em todas as fases do pipeline
 * PRINCÍPIOS: NO FALLBACKS, Single Source of Truth, Fail-Fast
 * 
 * INTEGRAÇÃO: Sistema expertzy-sistema-importacao
 * NOMENCLATURA: Usa EXCLUSIVAMENTE campos do DIProcessor.js (PRIMARY CREATOR)
 * 
 * @author Sistema Expertzy - ETL Validation Module
 * @version 1.0.0
 */

import { ConfigLoader } from '@shared/utils/ConfigLoader.js';

export class ETLValidator {
    constructor() {
        this.validationResults = new Map();
        this.configsLoaded = false;
        this.validationHooks = new Map();
        this.phases = [
            'pre_processing',
            'post_extraction', 
            'pre_transformation',
            'post_transformation',
            'pre_storage',
            'post_storage',
            'post_calculation',
            'pre_export'
        ];
        
        console.log('🔍 ETLValidator: Inicializando sistema de validação ETL');
        this.initializeValidator();
    }
    
    /**
     * Inicializa o validador carregando configurações
     * PRINCÍPIO: NO HARDCODED DATA - todas as regras vêm de configuração
     */
    async initializeValidator() {
        try {
            const configLoader = new ConfigLoader();
            
            // Carregar configurações básicas do sistema
            this.systemConfig = await configLoader.loadConfig('config.json');
            
            if (!this.systemConfig) {
                throw new Error('ETLValidator: config.json não disponível - obrigatório para inicialização');
            }
            
            this.configsLoaded = true;
            console.log('✅ ETLValidator: Configurações carregadas com sucesso');
            
        } catch (error) {
            console.error('❌ ETLValidator: Erro ao carregar configurações:', error);
            throw new Error(`ETLValidator: Falha na inicialização - ${error.message}`);
        }
    }
    
    /**
     * Registra um hook de validação para uma fase específica
     * ARQUITETURA: Strategy Pattern para validadores intercambiáveis
     * NO FALLBACKS: Todos os parâmetros são obrigatórios
     * 
     * @param {string} phase - Fase do ETL (pre_processing, post_extraction, etc.)
     * @param {Function} validator - Função de validação
     */
    registerValidationHook(phase, validator) {
        // NO FALLBACKS - todos os parâmetros obrigatórios
        if (!phase) {
            throw new Error('ETLValidator: phase é obrigatório para registrar hook');
        }
        
        if (!validator) {
            throw new Error('ETLValidator: validator é obrigatório para registrar hook');
        }
        
        if (!this.phases.includes(phase)) {
            throw new Error(`ETLValidator: phase '${phase}' inválida. Fases válidas: ${this.phases.join(', ')}`);
        }
        
        if (typeof validator !== 'function') {
            throw new Error('ETLValidator: validator deve ser uma função');
        }
        
        // Garantir que existe array para a fase - NO FALLBACKS
        if (!this.validationHooks.has(phase)) {
            this.validationHooks.set(phase, []);
        }
        
        this.validationHooks.get(phase).push(validator);
        console.log(`✅ ETLValidator: Hook registrado para fase '${phase}'`);
    }
    
    /**
     * Executa validação para uma fase específica do ETL
     * PRINCÍPIO: Fail-Fast - primeira falha interrompe o processo
     * NO FALLBACKS: context é obrigatório
     * 
     * @param {string} phase - Fase do ETL a validar
     * @param {Object} data - Dados a serem validados
     * @param {Object} context - Contexto obrigatório (metadata, timing, etc.)
     * @returns {Object} Resultado da validação
     */
    async validatePhase(phase, data, context) {
        // NO FALLBACKS - todos os parâmetros obrigatórios
        if (!phase) {
            throw new Error('ETLValidator: phase é obrigatório para validação');
        }
        
        if (!data) {
            throw new Error('ETLValidator: data é obrigatório para validação');
        }
        
        if (!context) {
            throw new Error('ETLValidator: context é obrigatório para validação');
        }
        
        if (!this.phases.includes(phase)) {
            throw new Error(`ETLValidator: phase '${phase}' inválida`);
        }
        
        if (!this.configsLoaded) {
            throw new Error('ETLValidator: Configurações não carregadas - chame initializeValidator() primeiro');
        }
        
        const startTime = Date.now();
        const validationId = `${phase}_${startTime}`;
        
        console.log(`🔍 ETLValidator: Iniciando validação fase '${phase}' - ID: ${validationId}`);
        
        const result = {
            validationId,
            phase,
            timestamp: new Date().toISOString(),
            duration: 0,
            success: true,
            errors: [],
            warnings: [],
            metrics: {},
            context: {
                ...context,
                dataKeys: Object.keys(data),
                dataSize: JSON.stringify(data).length
            }
        };
        
        try {
            // Validação estrutural básica
            await this._validateDataStructure(data, phase, result);
            
            // Executar hooks registrados para a fase - NO FALLBACKS
            if (this.validationHooks.has(phase)) {
                const phaseHooks = this.validationHooks.get(phase);
                
                for (const hook of phaseHooks) {
                    try {
                        const hookResult = await hook(data, context);
                        
                        // NO FALLBACKS - validar estrutura do resultado
                        if (!hookResult) {
                            throw new Error('Hook de validação deve retornar resultado válido');
                        }
                        
                        if (hookResult.success === false) {
                            result.success = false;
                            
                            // NO FALLBACKS - errors deve existir se success é false
                            if (!hookResult.errors) {
                                throw new Error('Hook com success=false deve incluir array de errors');
                            }
                            
                            result.errors.push(...hookResult.errors);
                            
                            // warnings é opcional, mas se existir deve ser array
                            if (hookResult.warnings) {
                                if (!Array.isArray(hookResult.warnings)) {
                                    throw new Error('hookResult.warnings deve ser array quando presente');
                                }
                                result.warnings.push(...hookResult.warnings);
                            }
                        }
                        
                        // Merge metrics - opcional mas validado se presente
                        if (hookResult.metrics) {
                            if (typeof hookResult.metrics !== 'object') {
                                throw new Error('hookResult.metrics deve ser objeto quando presente');
                            }
                            result.metrics = { ...result.metrics, ...hookResult.metrics };
                        }
                        
                    } catch (hookError) {
                        result.success = false;
                        result.errors.push({
                            type: 'HOOK_EXECUTION_ERROR',
                            message: `Erro no hook de validação: ${hookError.message}`,
                            hook: hook.name ? hook.name : 'anonymous'
                        });
                        console.error(`❌ ETLValidator: Erro no hook '${phase}':`, hookError);
                    }
                }
            }
            
            // Armazenar resultado da validação
            result.duration = Date.now() - startTime;
            this.validationResults.set(validationId, result);
            
            if (result.success) {
                console.log(`✅ ETLValidator: Validação '${phase}' concluída com sucesso em ${result.duration}ms`);
            } else {
                console.error(`❌ ETLValidator: Validação '${phase}' falhou com ${result.errors.length} erros`);
                
                // FAIL-FAST: Lançar erro para interromper pipeline ETL
                const errorMessages = result.errors.map(e => e.message);
                throw new Error(`ETL validation failed for phase '${phase}': ${errorMessages.join('; ')}`);
            }
            
            return result;
            
        } catch (error) {
            result.success = false;
            result.duration = Date.now() - startTime;
            result.errors.push({
                type: 'VALIDATION_SYSTEM_ERROR',
                message: error.message,
                stack: error.stack
            });
            
            this.validationResults.set(validationId, result);
            
            console.error(`❌ ETLValidator: Falha crítica na validação '${phase}':`, error);
            throw error; // Re-throw para manter fail-fast behavior
        }
    }
    
    /**
     * Validação estrutural básica dos dados
     * NOMENCLATURA: Valida usando nomes oficiais do DIProcessor.js
     * NO FALLBACKS: Falha explícita para dados inválidos
     * 
     * @private
     */
    async _validateDataStructure(data, phase, result) {
        if (!data) {
            throw new Error('ETLValidator: data é obrigatório para validação estrutural');
        }
        
        if (!phase) {
            throw new Error('ETLValidator: phase é obrigatório para validação estrutural');
        }
        
        if (!result) {
            throw new Error('ETLValidator: result é obrigatório para validação estrutural');
        }
        
        // Validações específicas por fase
        switch (phase) {
            case 'post_extraction':
                await this._validateExtractionStructure(data, result);
                break;
                
            case 'post_transformation':
                await this._validateTransformationStructure(data, result);
                break;
                
            case 'post_storage':
                await this._validateStorageStructure(data, result);
                break;
                
            default:
                // Validação genérica para outras fases - NO FALLBACKS
                if (typeof data !== 'object' || data === null) {
                    throw new Error(`ETLValidator: Dados inválidos para fase '${phase}' - deve ser objeto não-nulo`);
                }
        }
    }
    
    /**
     * Valida estrutura após extração XML
     * NOMENCLATURA: Campos obrigatórios do DIProcessor.js
     * NO FALLBACKS: Falha explícita para campos ausentes
     * 
     * @private
     */
    async _validateExtractionStructure(data, result) {
        if (!data) {
            throw new Error('ETLValidator: data é obrigatório para validação de extração');
        }
        
        if (!result) {
            throw new Error('ETLValidator: result é obrigatório para validação de extração');
        }
        
        const requiredFields = [
            'numero_di',
            'data_registro', 
            'adicoes',
            'importador_cnpj',
            'importador_nome'
        ];
        
        for (const field of requiredFields) {
            if (data[field] === undefined || data[field] === null) {
                result.errors.push({
                    type: 'MISSING_REQUIRED_FIELD',
                    message: `Campo obrigatório ausente: ${field}`,
                    field,
                    phase: 'post_extraction'
                });
            }
        }
        
        // Validar estrutura de adições - NO FALLBACKS
        if (data.adicoes !== undefined) {
            if (!Array.isArray(data.adicoes)) {
                result.errors.push({
                    type: 'INVALID_ADDITIONS_STRUCTURE',
                    message: 'adicoes deve ser um array',
                    field: 'adicoes'
                });
            } else if (data.adicoes.length === 0) {
                result.errors.push({
                    type: 'EMPTY_ADDITIONS',
                    message: 'DI deve conter pelo menos uma adição',
                    field: 'adicoes'
                });
            }
        }
    }
    
    /**
     * Valida estrutura após transformação
     * NO FALLBACKS: Validação rigorosa de tipos
     * 
     * @private
     */
    async _validateTransformationStructure(data, result) {
        if (!data) {
            throw new Error('ETLValidator: data é obrigatório para validação de transformação');
        }
        
        if (!result) {
            throw new Error('ETLValidator: result é obrigatório para validação de transformação');
        }
        
        // Validações específicas para dados transformados - NO FALLBACKS
        if (data.valor_aduaneiro_total_brl !== undefined) {
            if (typeof data.valor_aduaneiro_total_brl !== 'number') {
                result.errors.push({
                    type: 'INVALID_VALUE_TYPE',
                    message: 'valor_aduaneiro_total_brl deve ser numérico',
                    field: 'valor_aduaneiro_total_brl'
                });
            }
        }
    }
    
    /**
     * Valida estrutura após armazenamento
     * NO FALLBACKS: Validação rigorosa de integridade
     * 
     * @private
     */
    async _validateStorageStructure(data, result) {
        if (!data) {
            throw new Error('ETLValidator: data é obrigatório para validação de armazenamento');
        }
        
        if (!result) {
            throw new Error('ETLValidator: result é obrigatório para validação de armazenamento');
        }
        
        // Validar que dados persistidos mantêm integridade - NO FALLBACKS
        if (data.timestamp === undefined && data.data_processamento === undefined) {
            result.warnings.push({
                type: 'MISSING_TIMESTAMP',
                message: 'Dados armazenados sem timestamp de processamento',
                recommendation: 'Adicionar timestamp para auditoria'
            });
        }
    }
    
    /**
     * Retorna resultados de validação consolidados
     * NO FALLBACKS: Calcula métricas apenas com dados válidos
     * 
     * @returns {Object} Relatório consolidado de validações
     */
    getValidationSummary() {
        const results = Array.from(this.validationResults.values());
        
        if (results.length === 0) {
            return {
                totalValidations: 0,
                successfulValidations: 0,
                failedValidations: 0,
                totalErrors: 0,
                totalWarnings: 0,
                averageDuration: 0,
                phases: {},
                lastValidation: null
            };
        }
        
        const successfulResults = results.filter(r => r.success);
        const failedResults = results.filter(r => !r.success);
        
        // NO FALLBACKS - calcular métricas apenas se temos dados
        const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
        const averageDuration = Math.round(totalDuration / results.length);
        
        const phasesAnalysis = {};
        for (const phase of this.phases) {
            const phaseResults = results.filter(r => r.phase === phase);
            if (phaseResults.length > 0) {
                const phaseSuccessful = phaseResults.filter(r => r.success);
                phasesAnalysis[phase] = {
                    count: phaseResults.length,
                    successRate: Math.round((phaseSuccessful.length / phaseResults.length) * 100)
                };
            }
        }
        
        return {
            totalValidations: results.length,
            successfulValidations: successfulResults.length,
            failedValidations: failedResults.length,
            totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
            totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0),
            averageDuration: averageDuration,
            phases: phasesAnalysis,
            lastValidation: results[results.length - 1].timestamp
        };
    }
    
    /**
     * Limpa resultados de validação antigos (garbage collection)
     * NO FALLBACKS: maxAge é obrigatório
     * 
     * @param {number} maxAge - Idade máxima em milissegundos (obrigatório)
     */
    cleanupValidationResults(maxAge) {
        if (!maxAge) {
            throw new Error('ETLValidator: maxAge é obrigatório para cleanup');
        }
        
        if (typeof maxAge !== 'number' || maxAge <= 0) {
            throw new Error('ETLValidator: maxAge deve ser número positivo');
        }
        
        const cutoff = Date.now() - maxAge;
        let removedCount = 0;
        
        for (const [id, result] of this.validationResults.entries()) {
            const resultTime = new Date(result.timestamp).getTime();
            if (resultTime < cutoff) {
                this.validationResults.delete(id);
                removedCount++;
            }
        }
        
        if (removedCount > 0) {
            console.log(`🧹 ETLValidator: Removidos ${removedCount} resultados antigos de validação`);
        }
    }
}

// Singleton instance para uso global
let etlValidatorInstance = null;

/**
 * Factory function para obter instância singleton do ETLValidator
 * PADRÃO: Singleton para evitar múltiplas instâncias conflitantes
 * 
 * @returns {ETLValidator} Instância singleton do ETLValidator
 */
export function getETLValidator() {
    if (!etlValidatorInstance) {
        etlValidatorInstance = new ETLValidator();
    }
    return etlValidatorInstance;
}

export default ETLValidator;