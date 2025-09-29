/**
 * LoadingValidator.js - Validador de Fase de Carregamento/Armazenamento
 * 
 * RESPONSABILIDADE: Validar integridade do armazenamento de dados no IndexedDB
 * PRINCÍPIOS: NO FALLBACKS, NO HARDCODED DATA, Nomenclatura Oficial DIProcessor
 * INTEGRAÇÃO: Valida persistência após LoadingValidator armazenar dados
 * 
 * @author Sistema Expertzy - ETL Validation Module
 * @version 1.0.0
 */

import { ConfigLoader } from '@shared/utils/ConfigLoader.js';

export class LoadingValidator {
    constructor() {
        this.validationRules = null;
        this.configsLoaded = false;
        
        console.log('💾 LoadingValidator: Inicializando validador de carregamento');
        this.loadValidationConfigurations();
    }
    
    /**
     * Carrega configurações de validação de carregamento
     * NO HARDCODED DATA: Todas as regras vêm de arquivos JSON
     */
    async loadValidationConfigurations() {
        try {
            // Carregar regras de validação ETL
            const validationRulesResponse = await fetch(new URL('../../../shared/data/etl-validation/validation-rules.json', import.meta.url));
            if (!validationRulesResponse.ok) {
                throw new Error(`Erro ao carregar validation-rules.json: ${validationRulesResponse.status}`);
            }
            this.validationRules = await validationRulesResponse.json();
            
            if (!this.validationRules) {
                throw new Error('LoadingValidator: Falha ao carregar regras de validação');
            }
            
            this.configsLoaded = true;
            console.log('✅ LoadingValidator: Configurações carregadas');
            
        } catch (error) {
            console.error('❌ LoadingValidator: Erro ao carregar configurações:', error);
            throw new Error(`Falha ao carregar configurações: ${error.message}`);
        }
    }
    
    /**
     * Valida carregamento/armazenamento de dados
     * NO FALLBACKS: Todos os parâmetros obrigatórios
     * 
     * @param {Object} dataToStore - Dados que devem ser armazenados
     * @param {Object} storedData - Dados efetivamente armazenados
     * @param {Object} context - Contexto do carregamento
     * @returns {Object} Resultado da validação
     */
    async validateLoading(dataToStore, storedData, context) {
        // NO FALLBACKS - parâmetros obrigatórios
        if (!dataToStore) {
            throw new Error('LoadingValidator: dataToStore é obrigatório');
        }
        
        if (!storedData) {
            throw new Error('LoadingValidator: storedData é obrigatório');
        }
        
        if (!context) {
            throw new Error('LoadingValidator: context é obrigatório');
        }
        
        if (!this.configsLoaded) {
            throw new Error('LoadingValidator: Configurações não carregadas - aguarde inicialização');
        }
        
        const startTime = Date.now();
        const validationId = `loading_${Date.now()}`;
        
        console.log(`💾 LoadingValidator: Iniciando validação de carregamento - ID: ${validationId}`);
        
        const result = {
            validationId,
            phase: 'loading',
            timestamp: new Date().toISOString(),
            duration: 0,
            success: true,
            errors: [],
            warnings: [],
            metrics: {
                fieldsStored: 0,
                integrityChecks: 0,
                dataConsistencyChecks: 0,
                storageEfficiency: 0
            }
        };
        
        try {
            // 1. Validar integridade dos dados armazenados
            await this._validateStorageIntegrity(dataToStore, storedData, result);
            
            // 2. Validar preservação de campos críticos
            await this._validateCriticalFieldPreservation(dataToStore, storedData, result);
            
            // 3. Validar estrutura de dados no armazenamento
            await this._validateStoredDataStructure(storedData, result);
            
            // 4. Validar metadata de armazenamento
            await this._validateStorageMetadata(storedData, context, result);
            
            // 5. Validar consistência de índices (se aplicável)
            await this._validateIndexConsistency(storedData, result);
            
            // 6. Validar limites de armazenamento
            await this._validateStorageLimits(storedData, result);
            
            // 7. Validar contexto de carregamento
            await this._validateLoadingContext(context, result);
            
            // Calcular métricas de eficiência
            this._calculateStorageMetrics(dataToStore, storedData, result);
            
            result.duration = Date.now() - startTime;
            
            if (result.success) {
                console.log(`✅ LoadingValidator: Validação concluída com sucesso em ${result.duration}ms`);
            } else {
                console.error(`❌ LoadingValidator: Validação falhou com ${result.errors.length} erros`);
            }
            
        } catch (error) {
            result.success = false;
            result.duration = Date.now() - startTime;
            result.errors.push({
                type: 'LOADING_VALIDATION_SYSTEM_ERROR',
                message: `Erro crítico na validação de carregamento: ${error.message}`,
                timestamp: new Date().toISOString()
            });
            
            console.error('❌ LoadingValidator: Erro crítico:', error);
        }
        
        return result;
    }
    
    /**
     * Valida integridade geral do armazenamento
     * NO FALLBACKS: Dados devem ser idênticos após armazenamento
     * 
     * @private
     */
    async _validateStorageIntegrity(dataToStore, storedData, result) {
        if (!dataToStore) {
            throw new Error('_validateStorageIntegrity: dataToStore é obrigatório');
        }
        
        if (!storedData) {
            throw new Error('_validateStorageIntegrity: storedData é obrigatório');
        }
        
        if (!result) {
            throw new Error('_validateStorageIntegrity: result é obrigatório');
        }
        
        result.metrics.integrityChecks++;
        
        // Validar que dados básicos foram preservados
        if (typeof dataToStore !== typeof storedData) {
            result.success = false;
            result.errors.push({
                type: 'STORAGE_TYPE_MISMATCH',
                message: 'Tipo de dados alterado no armazenamento',
                expectedType: typeof dataToStore,
                storedType: typeof storedData
            });
            return;
        }
        
        // Validar estrutura básica
        if (typeof dataToStore === 'object' && dataToStore !== null) {
            const originalKeys = Object.keys(dataToStore);
            const storedKeys = Object.keys(storedData);
            
            // Verificar chaves perdidas
            const lostKeys = originalKeys.filter(key => !storedKeys.includes(key));
            if (lostKeys.length > 0) {
                result.success = false;
                result.errors.push({
                    type: 'STORAGE_KEYS_LOST',
                    message: `Chaves perdidas no armazenamento: ${lostKeys.join(', ')}`,
                    lostKeys: lostKeys
                });
            }
            
            // Verificar chaves adicionadas inesperadamente
            const addedKeys = storedKeys.filter(key => !originalKeys.includes(key) && !key.startsWith('_')); // Ignorar campos internos
            if (addedKeys.length > 0) {
                result.warnings.push({
                    type: 'UNEXPECTED_STORAGE_KEYS',
                    message: `Chaves adicionadas no armazenamento: ${addedKeys.join(', ')}`,
                    addedKeys: addedKeys
                });
            }
        }
    }
    
    /**
     * Valida preservação de campos críticos
     * NO FALLBACKS: Campos críticos não podem ser perdidos ou alterados
     * 
     * @private
     */
    async _validateCriticalFieldPreservation(dataToStore, storedData, result) {
        if (!dataToStore) {
            throw new Error('_validateCriticalFieldPreservation: dataToStore é obrigatório');
        }
        
        if (!storedData) {
            throw new Error('_validateCriticalFieldPreservation: storedData é obrigatório');
        }
        
        if (!result) {
            throw new Error('_validateCriticalFieldPreservation: result é obrigatório');
        }
        
        // Campos críticos que devem ser preservados exatamente
        const criticalFields = ['numero_di', 'importador_cnpj', 'data_registro'];
        
        for (const field of criticalFields) {
            if (dataToStore[field] !== undefined) {
                result.metrics.fieldsStored++;
                
                if (storedData[field] === undefined) {
                    result.success = false;
                    result.errors.push({
                        type: 'CRITICAL_FIELD_NOT_STORED',
                        message: `Campo crítico não foi armazenado: ${field}`,
                        field: field,
                        originalValue: dataToStore[field]
                    });
                } else if (dataToStore[field] !== storedData[field]) {
                    // Para datas, validar com tolerância
                    if (field === 'data_registro' && this._areDatesEquivalent(dataToStore[field], storedData[field])) {
                        continue; // Datas são equivalentes
                    }
                    
                    result.success = false;
                    result.errors.push({
                        type: 'CRITICAL_FIELD_ALTERED_IN_STORAGE',
                        message: `Campo crítico alterado no armazenamento: ${field}`,
                        field: field,
                        originalValue: dataToStore[field],
                        storedValue: storedData[field]
                    });
                }
            }
        }
        
        // Validar adições foram preservadas
        if (dataToStore.adicoes && Array.isArray(dataToStore.adicoes)) {
            result.metrics.dataConsistencyChecks++;
            
            if (!storedData.adicoes || !Array.isArray(storedData.adicoes)) {
                result.success = false;
                result.errors.push({
                    type: 'ADDITIONS_NOT_STORED_PROPERLY',
                    message: 'Adições não foram armazenadas como array',
                    originalCount: dataToStore.adicoes.length,
                    storedType: typeof storedData.adicoes
                });
            } else if (dataToStore.adicoes.length !== storedData.adicoes.length) {
                result.success = false;
                result.errors.push({
                    type: 'ADDITIONS_COUNT_MISMATCH_STORAGE',
                    message: 'Número de adições alterado no armazenamento',
                    originalCount: dataToStore.adicoes.length,
                    storedCount: storedData.adicoes.length
                });
            }
        }
    }
    
    /**
     * Valida estrutura dos dados armazenados
     * NO FALLBACKS: Estrutura deve estar conforme esperado
     * 
     * @private
     */
    async _validateStoredDataStructure(storedData, result) {
        if (!storedData) {
            throw new Error('_validateStoredDataStructure: storedData é obrigatório');
        }
        
        if (!result) {
            throw new Error('_validateStoredDataStructure: result é obrigatório');
        }
        
        result.metrics.integrityChecks++;
        
        // Validar que dados armazenados são objeto
        if (typeof storedData !== 'object' || storedData === null) {
            result.success = false;
            result.errors.push({
                type: 'INVALID_STORED_DATA_STRUCTURE',
                message: 'Dados armazenados devem ser objeto não-nulo',
                storedType: typeof storedData
            });
            return;
        }
        
        // Validar campos obrigatórios do IndexedDB
        const requiredStoredFields = this.validationRules.campos_obrigatorios.di_basica;
        
        for (const field of requiredStoredFields) {
            if (storedData[field] === undefined || storedData[field] === null) {
                result.success = false;
                result.errors.push({
                    type: 'REQUIRED_FIELD_NOT_STORED',
                    message: `Campo obrigatório não armazenado: ${field}`,
                    field: field
                });
            }
        }
        
        // Validar estrutura de adições no armazenamento
        if (storedData.adicoes) {
            if (!Array.isArray(storedData.adicoes)) {
                result.success = false;
                result.errors.push({
                    type: 'STORED_ADDITIONS_INVALID_TYPE',
                    message: 'Adições armazenadas devem ser array',
                    storedType: typeof storedData.adicoes
                });
            } else {
                // Validar cada adição armazenada
                for (let i = 0; i < storedData.adicoes.length; i++) {
                    const adicao = storedData.adicoes[i];
                    
                    if (!adicao || typeof adicao !== 'object') {
                        result.success = false;
                        result.errors.push({
                            type: 'STORED_ADDITION_INVALID_STRUCTURE',
                            message: `Adição ${i + 1} armazenada com estrutura inválida`,
                            additionIndex: i,
                            storedType: typeof adicao
                        });
                    }
                }
            }
        }
    }
    
    /**
     * Valida metadata de armazenamento
     * NO FALLBACKS: Metadata deve conter informações de auditoria
     * 
     * @private
     */
    async _validateStorageMetadata(storedData, context, result) {
        if (!storedData) {
            throw new Error('_validateStorageMetadata: storedData é obrigatório');
        }
        
        if (!context) {
            throw new Error('_validateStorageMetadata: context é obrigatório');
        }
        
        if (!result) {
            throw new Error('_validateStorageMetadata: result é obrigatório');
        }
        
        // Validar presença de metadata de armazenamento
        if (!storedData._metadata) {
            result.warnings.push({
                type: 'STORAGE_METADATA_MISSING',
                message: 'Metadata de armazenamento ausente - dificulta auditoria'
            });
            return;
        }
        
        const metadata = storedData._metadata;
        
        // Validar timestamp de armazenamento
        if (!metadata.storedAt) {
            result.warnings.push({
                type: 'STORAGE_TIMESTAMP_MISSING',
                message: 'Timestamp de armazenamento ausente no metadata'
            });
        } else {
            const storedDate = new Date(metadata.storedAt);
            if (isNaN(storedDate.getTime())) {
                result.errors.push({
                    type: 'INVALID_STORAGE_TIMESTAMP',
                    message: 'Timestamp de armazenamento inválido',
                    timestamp: metadata.storedAt
                });
            }
        }
        
        // Validar versão do sistema no metadata
        if (!metadata.systemVersion) {
            result.warnings.push({
                type: 'SYSTEM_VERSION_NOT_STORED',
                message: 'Versão do sistema não registrada no metadata'
            });
        }
        
        // Validar contexto foi preservado
        if (context.storageId && metadata.storageId !== context.storageId) {
            result.errors.push({
                type: 'STORAGE_ID_MISMATCH',
                message: 'ID de armazenamento não corresponde ao contexto',
                contextId: context.storageId,
                metadataId: metadata.storageId
            });
        }
    }
    
    /**
     * Valida consistência de índices (se aplicável)
     * NO FALLBACKS: Índices devem estar consistentes
     * 
     * @private
     */
    async _validateIndexConsistency(storedData, result) {
        if (!storedData) {
            throw new Error('_validateIndexConsistency: storedData é obrigatório');
        }
        
        if (!result) {
            throw new Error('_validateIndexConsistency: result é obrigatório');
        }
        
        result.metrics.integrityChecks++;
        
        // Validar que campos indexáveis estão presentes
        const indexedFields = ['numero_di', 'importador_cnpj', 'data_registro'];
        
        for (const field of indexedFields) {
            if (storedData[field] !== undefined) {
                // Validar formato para indexação
                if (field === 'numero_di' && typeof storedData[field] !== 'string') {
                    result.warnings.push({
                        type: 'INDEX_FIELD_TYPE_WARNING',
                        message: `Campo indexado com tipo inesperado: ${field}`,
                        field: field,
                        expectedType: 'string',
                        actualType: typeof storedData[field]
                    });
                }
                
                if (field === 'importador_cnpj' && typeof storedData[field] !== 'string') {
                    result.warnings.push({
                        type: 'INDEX_FIELD_TYPE_WARNING',
                        message: `Campo indexado com tipo inesperado: ${field}`,
                        field: field,
                        expectedType: 'string',
                        actualType: typeof storedData[field]
                    });
                }
            }
        }
        
        // Validar que não há valores duplicados em campos únicos
        if (storedData.numero_di && typeof storedData.numero_di === 'string') {
            if (storedData.numero_di.trim() === '') {
                result.errors.push({
                    type: 'UNIQUE_INDEX_FIELD_EMPTY',
                    message: 'Campo de índice único está vazio: numero_di',
                    field: 'numero_di'
                });
            }
        }
    }
    
    /**
     * Valida limites de armazenamento
     * NO HARDCODED DATA: Limites vêm da configuração
     * 
     * @private
     */
    async _validateStorageLimits(storedData, result) {
        if (!storedData) {
            throw new Error('_validateStorageLimits: storedData é obrigatório');
        }
        
        if (!result) {
            throw new Error('_validateStorageLimits: result é obrigatório');
        }
        
        // Estimar tamanho dos dados armazenados
        const dataSize = JSON.stringify(storedData).length;
        const maxSize = this.validationRules.limites_processamento.tamanho_maximo_dados;
        const warningSize = this.validationRules.limites_processamento.tamanho_aviso_dados;
        
        if (dataSize > maxSize) {
            result.success = false;
            result.errors.push({
                type: 'STORAGE_SIZE_LIMIT_EXCEEDED',
                message: this.validationRules.mensagens_erro.limite_dados_excedido
                    .replace('{tamanho}', Math.round(dataSize / 1024) + 'KB')
                    .replace('{limite}', Math.round(maxSize / 1024) + 'KB'),
                dataSize: dataSize,
                maxSize: maxSize
            });
        } else if (dataSize > warningSize) {
            result.warnings.push({
                type: 'STORAGE_SIZE_WARNING',
                message: this.validationRules.mensagens_erro.dados_grandes_aviso
                    .replace('{tamanho}', Math.round(dataSize / (1024 * 1024))),
                dataSize: dataSize
            });
        }
        
        // Validar limite de adições
        if (storedData.adicoes && Array.isArray(storedData.adicoes)) {
            const maxAdditions = this.validationRules.limites_processamento.max_adicoes_por_di;
            
            if (storedData.adicoes.length > maxAdditions) {
                result.warnings.push({
                    type: 'STORED_ADDITIONS_LIMIT_WARNING',
                    message: `Número de adições armazenadas próximo do limite: ${storedData.adicoes.length}/${maxAdditions}`,
                    storedCount: storedData.adicoes.length,
                    maxAllowed: maxAdditions
                });
            }
        }
    }
    
    /**
     * Valida contexto de carregamento
     * NO FALLBACKS: Context deve conter informações sobre armazenamento
     * 
     * @private
     */
    async _validateLoadingContext(context, result) {
        if (!context) {
            throw new Error('_validateLoadingContext: context é obrigatório');
        }
        
        if (!result) {
            throw new Error('_validateLoadingContext: result é obrigatório');
        }
        
        // Validar que contexto indica operação de carregamento
        if (!context.operation || context.operation !== 'loading') {
            result.warnings.push({
                type: 'LOADING_OPERATION_NOT_SPECIFIED',
                message: 'Operação de carregamento não especificada no contexto',
                operation: context.operation
            });
        }
        
        // Validar se carregamento foi bem-sucedido no contexto
        if (context.loadingSuccess !== undefined && context.loadingSuccess === false) {
            result.success = false;
            result.errors.push({
                type: 'LOADING_CONTEXT_FAILURE',
                message: 'Context indica falha no carregamento de dados',
                context: context
            });
        }
        
        // Validar origem do armazenamento
        if (!context.storageTarget) {
            result.warnings.push({
                type: 'STORAGE_TARGET_NOT_SPECIFIED',
                message: 'Target de armazenamento não especificado no contexto'
            });
        }
    }
    
    /**
     * Calcula métricas de eficiência de armazenamento
     * NO FALLBACKS: Métricas baseadas apenas em dados válidos
     * 
     * @private
     */
    _calculateStorageMetrics(dataToStore, storedData, result) {
        if (!dataToStore) {
            throw new Error('_calculateStorageMetrics: dataToStore é obrigatório');
        }
        
        if (!storedData) {
            throw new Error('_calculateStorageMetrics: storedData é obrigatório');
        }
        
        if (!result) {
            throw new Error('_calculateStorageMetrics: result é obrigatório');
        }
        
        // Calcular eficiência de armazenamento
        const originalSize = JSON.stringify(dataToStore).length;
        const storedSize = JSON.stringify(storedData).length;
        
        if (originalSize === 0) {
            result.metrics.storageEfficiency = 0;
        } else {
            // Eficiência = quão próximo o tamanho armazenado está do original (100% = igual)
            result.metrics.storageEfficiency = Math.round((Math.min(originalSize, storedSize) / Math.max(originalSize, storedSize)) * 100);
        }
        
        // Métricas adicionais
        result.metrics.originalSize = originalSize;
        result.metrics.storedSize = storedSize;
        result.metrics.compressionRatio = originalSize > 0 ? Math.round((storedSize / originalSize) * 100) : 100;
    }
    
    /**
     * Verifica se duas datas são equivalentes (tolerância para formatos diferentes)
     * NO FALLBACKS: Validação rigorosa de equivalência
     * 
     * @private
     */
    _areDatesEquivalent(date1, date2) {
        if (!date1 || !date2) return false;
        
        try {
            const d1 = new Date(date1);
            const d2 = new Date(date2);
            
            if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
                return false;
            }
            
            // Tolerância de 1 segundo para diferenças de serialização
            return Math.abs(d1.getTime() - d2.getTime()) < 1000;
            
        } catch (error) {
            return false;
        }
    }
}

export default LoadingValidator;