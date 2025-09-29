/**
 * TransformationValidator.js - Validador de Fase de Transformação de Dados
 * 
 * RESPONSABILIDADE: Validar precisão da conversão/transformação de dados DI
 * PRINCÍPIOS: NO FALLBACKS, NO HARDCODED DATA, Nomenclatura Oficial DIProcessor
 * INTEGRAÇÃO: Valida transformações após processamento dos dados extraídos
 * 
 * @author Sistema Expertzy - ETL Validation Module
 * @version 1.0.0
 */

import { ConfigLoader } from '@shared/utils/ConfigLoader.js';

export class TransformationValidator {
    constructor() {
        this.validationRules = null;
        this.aliquotasConfig = null;
        this.configsLoaded = false;
        
        console.log('🔄 TransformationValidator: Inicializando validador de transformação');
        this.loadValidationConfigurations();
    }
    
    /**
     * Carrega configurações de validação de transformação
     * NO HARDCODED DATA: Todas as regras vêm de arquivos JSON
     */
    async loadValidationConfigurations() {
        try {
            const configLoader = new ConfigLoader();
            
            // Carregar regras de validação ETL
            const validationRulesResponse = await fetch(new URL('../../../shared/data/etl-validation/validation-rules.json', import.meta.url));
            if (!validationRulesResponse.ok) {
                throw new Error(`Erro ao carregar validation-rules.json: ${validationRulesResponse.status}`);
            }
            this.validationRules = await validationRulesResponse.json();
            
            // Carregar configurações de alíquotas para validação fiscal
            this.aliquotasConfig = await configLoader.loadConfig('aliquotas.json');
            
            if (!this.validationRules) {
                throw new Error('TransformationValidator: Falha ao carregar regras de validação');
            }
            
            if (!this.aliquotasConfig) {
                throw new Error('TransformationValidator: Falha ao carregar configuração de alíquotas');
            }
            
            this.configsLoaded = true;
            console.log('✅ TransformationValidator: Configurações carregadas');
            
        } catch (error) {
            console.error('❌ TransformationValidator: Erro ao carregar configurações:', error);
            throw new Error(`Falha ao carregar configurações: ${error.message}`);
        }
    }
    
    /**
     * Valida transformações de dados
     * NO FALLBACKS: Todos os parâmetros obrigatórios
     * 
     * @param {Object} originalData - Dados originais extraídos
     * @param {Object} transformedData - Dados após transformação
     * @param {Object} context - Contexto da transformação
     * @returns {Object} Resultado da validação
     */
    async validateTransformation(originalData, transformedData, context) {
        // NO FALLBACKS - parâmetros obrigatórios
        if (!originalData) {
            throw new Error('TransformationValidator: originalData é obrigatório');
        }
        
        if (!transformedData) {
            throw new Error('TransformationValidator: transformedData é obrigatório');
        }
        
        if (!context) {
            throw new Error('TransformationValidator: context é obrigatório');
        }
        
        if (!this.configsLoaded) {
            throw new Error('TransformationValidator: Configurações não carregadas - aguarde inicialização');
        }
        
        const startTime = Date.now();
        const validationId = `transformation_${Date.now()}`;
        
        console.log(`🔄 TransformationValidator: Iniciando validação de transformação - ID: ${validationId}`);
        
        const result = {
            validationId,
            phase: 'transformation',
            timestamp: new Date().toISOString(),
            duration: 0,
            success: true,
            errors: [],
            warnings: [],
            metrics: {
                fieldsCompared: 0,
                calculationsValidated: 0,
                conversionsValidated: 0,
                transformationAccuracy: 0
            }
        };
        
        try {
            // 1. Validar integridade estrutural pós-transformação
            await this._validateStructuralIntegrity(originalData, transformedData, result);
            
            // 2. Validar conversões monetárias
            await this._validateMonetaryConversions(originalData, transformedData, result);
            
            // 3. Validar cálculos tributários
            await this._validateTaxCalculations(transformedData, result);
            
            // 4. Validar transformações de campos
            await this._validateFieldTransformations(originalData, transformedData, result);
            
            // 5. Validar agregações e totalizações
            await this._validateAggregations(transformedData, result);
            
            // 6. Validar preservação de dados críticos
            await this._validateCriticalDataPreservation(originalData, transformedData, result);
            
            // 7. Validar contexto de transformação
            await this._validateTransformationContext(context, result);
            
            // Calcular métricas finais
            this._calculateTransformationMetrics(result);
            
            result.duration = Date.now() - startTime;
            
            if (result.success) {
                console.log(`✅ TransformationValidator: Validação concluída com sucesso em ${result.duration}ms`);
            } else {
                console.error(`❌ TransformationValidator: Validação falhou com ${result.errors.length} erros`);
            }
            
        } catch (error) {
            result.success = false;
            result.duration = Date.now() - startTime;
            result.errors.push({
                type: 'TRANSFORMATION_VALIDATION_SYSTEM_ERROR',
                message: `Erro crítico na validação de transformação: ${error.message}`,
                timestamp: new Date().toISOString()
            });
            
            console.error('❌ TransformationValidator: Erro crítico:', error);
        }
        
        return result;
    }
    
    /**
     * Valida integridade estrutural após transformação
     * NO FALLBACKS: Estruturas obrigatórias devem ser preservadas
     * 
     * @private
     */
    async _validateStructuralIntegrity(originalData, transformedData, result) {
        if (!originalData) {
            throw new Error('_validateStructuralIntegrity: originalData é obrigatório');
        }
        
        if (!transformedData) {
            throw new Error('_validateStructuralIntegrity: transformedData é obrigatório');
        }
        
        if (!result) {
            throw new Error('_validateStructuralIntegrity: result é obrigatório');
        }
        
        result.metrics.fieldsCompared++;
        
        // Validar que campos críticos foram preservados
        const criticalFields = ['numero_di', 'importador_cnpj', 'adicoes'];
        
        for (const field of criticalFields) {
            if (originalData[field] !== undefined && transformedData[field] === undefined) {
                result.success = false;
                result.errors.push({
                    type: 'CRITICAL_FIELD_LOST_IN_TRANSFORMATION',
                    message: `Campo crítico perdido na transformação: ${field}`,
                    field: field,
                    originalValue: originalData[field]
                });
            }
        }
        
        // Validar estrutura de adições foi preservada
        if (originalData.adicoes && Array.isArray(originalData.adicoes)) {
            if (!transformedData.adicoes || !Array.isArray(transformedData.adicoes)) {
                result.success = false;
                result.errors.push({
                    type: 'ADDITIONS_STRUCTURE_CORRUPTED',
                    message: 'Estrutura de adições foi corrompida na transformação',
                    originalCount: originalData.adicoes.length,
                    transformedType: typeof transformedData.adicoes
                });
            } else if (originalData.adicoes.length !== transformedData.adicoes.length) {
                result.success = false;
                result.errors.push({
                    type: 'ADDITIONS_COUNT_MISMATCH',
                    message: 'Número de adições alterado na transformação',
                    originalCount: originalData.adicoes.length,
                    transformedCount: transformedData.adicoes.length
                });
            }
        }
    }
    
    /**
     * Valida conversões monetárias
     * NO FALLBACKS: Usa tolerâncias da configuração
     * 
     * @private
     */
    async _validateMonetaryConversions(originalData, transformedData, result) {
        if (!originalData) {
            throw new Error('_validateMonetaryConversions: originalData é obrigatório');
        }
        
        if (!transformedData) {
            throw new Error('_validateMonetaryConversions: transformedData é obrigatório');
        }
        
        if (!result) {
            throw new Error('_validateMonetaryConversions: result é obrigatório');
        }
        
        const tolerance = this.validationRules.tolerancias.conversao_monetaria.absoluta;
        
        // Validar conversões USD/BRL
        if (originalData.valor_total_fob_usd && transformedData.valor_total_fob_brl && transformedData.taxa_cambio) {
            result.metrics.conversionsValidated++;
            
            const expectedBRL = originalData.valor_total_fob_usd * transformedData.taxa_cambio;
            const actualBRL = transformedData.valor_total_fob_brl;
            const difference = Math.abs(actualBRL - expectedBRL);
            
            if (difference > tolerance) {
                result.success = false;
                result.errors.push({
                    type: 'CURRENCY_CONVERSION_ERROR',
                    message: this.validationRules.mensagens_erro.inconsistencia_conversao
                        .replace('{moeda1}', 'USD')
                        .replace('{moeda2}', 'BRL')
                        .replace('{esperado}', expectedBRL.toFixed(2))
                        .replace('{recebido}', actualBRL.toFixed(2)),
                    originalUSD: originalData.valor_total_fob_usd,
                    expectedBRL: expectedBRL,
                    actualBRL: actualBRL,
                    exchangeRate: transformedData.taxa_cambio,
                    difference: difference
                });
            }
        }
        
        // Validar preservação de valores monetários
        const monetaryFields = ['valor_total_frete_usd', 'valor_total_seguro_usd'];
        
        for (const field of monetaryFields) {
            if (originalData[field] !== undefined) {
                result.metrics.fieldsCompared++;
                
                if (transformedData[field] === undefined) {
                    result.warnings.push({
                        type: 'MONETARY_FIELD_MISSING_POST_TRANSFORMATION',
                        message: `Campo monetário ausente após transformação: ${field}`,
                        field: field,
                        originalValue: originalData[field]
                    });
                } else if (Math.abs(originalData[field] - transformedData[field]) > tolerance) {
                    result.warnings.push({
                        type: 'MONETARY_VALUE_CHANGED_IN_TRANSFORMATION',
                        message: `Valor monetário alterado na transformação: ${field}`,
                        field: field,
                        originalValue: originalData[field],
                        transformedValue: transformedData[field],
                        difference: Math.abs(originalData[field] - transformedData[field])
                    });
                }
            }
        }
    }
    
    /**
     * Valida cálculos tributários
     * NO HARDCODED DATA: Usa configurações de alíquotas
     * 
     * @private
     */
    async _validateTaxCalculations(transformedData, result) {
        if (!transformedData) {
            throw new Error('_validateTaxCalculations: transformedData é obrigatório');
        }
        
        if (!result) {
            throw new Error('_validateTaxCalculations: result é obrigatório');
        }
        
        // Validar apenas se há dados de cálculo tributário
        if (!transformedData.adicoes || !Array.isArray(transformedData.adicoes)) {
            return;
        }
        
        for (let i = 0; i < transformedData.adicoes.length; i++) {
            const adicao = transformedData.adicoes[i];
            
            if (!adicao || typeof adicao !== 'object') {
                continue;
            }
            
            result.metrics.calculationsValidated++;
            
            // Validar cálculo de II (Imposto de Importação)
            if (adicao.ii_valor_calculado !== undefined && adicao.ii_aliquota_aplicada !== undefined && adicao.valor_aduaneiro !== undefined) {
                const expectedII = adicao.valor_aduaneiro * (adicao.ii_aliquota_aplicada / 100);
                const actualII = adicao.ii_valor_calculado;
                const tolerance = this.validationRules.tolerancias.conversao_monetaria.absoluta;
                
                if (Math.abs(actualII - expectedII) > tolerance) {
                    result.errors.push({
                        type: 'II_CALCULATION_ERROR',
                        message: `Erro no cálculo do II na adição ${i + 1}`,
                        additionIndex: i,
                        expected: expectedII,
                        actual: actualII,
                        baseValue: adicao.valor_aduaneiro,
                        rate: adicao.ii_aliquota_aplicada
                    });
                }
            }
            
            // Validar cálculo de IPI
            if (adicao.ipi_valor_calculado !== undefined && adicao.ipi_aliquota_aplicada !== undefined) {
                // Base de cálculo IPI = Valor Aduaneiro + II
                const baseIPI = (adicao.valor_aduaneiro || 0) + (adicao.ii_valor_calculado || 0);
                const expectedIPI = baseIPI * (adicao.ipi_aliquota_aplicada / 100);
                const actualIPI = adicao.ipi_valor_calculado;
                const tolerance = this.validationRules.tolerancias.conversao_monetaria.absoluta;
                
                if (Math.abs(actualIPI - expectedIPI) > tolerance) {
                    result.errors.push({
                        type: 'IPI_CALCULATION_ERROR',
                        message: `Erro no cálculo do IPI na adição ${i + 1}`,
                        additionIndex: i,
                        expected: expectedIPI,
                        actual: actualIPI,
                        baseValue: baseIPI,
                        rate: adicao.ipi_aliquota_aplicada
                    });
                }
            }
        }
    }
    
    /**
     * Valida transformações de campos específicos
     * NO FALLBACKS: Validação rigorosa de cada transformação
     * 
     * @private
     */
    async _validateFieldTransformations(originalData, transformedData, result) {
        if (!originalData) {
            throw new Error('_validateFieldTransformations: originalData é obrigatório');
        }
        
        if (!transformedData) {
            throw new Error('_validateFieldTransformations: transformedData é obrigatório');
        }
        
        if (!result) {
            throw new Error('_validateFieldTransformations: result é obrigatório');
        }
        
        // Validar transformação de data_registro
        if (originalData.data_registro && transformedData.data_registro) {
            result.metrics.fieldsCompared++;
            
            // Se original é string e transformado é Date, validar conversão
            if (typeof originalData.data_registro === 'string' && transformedData.data_registro instanceof Date) {
                const originalDate = new Date(originalData.data_registro);
                if (isNaN(originalDate.getTime())) {
                    result.errors.push({
                        type: 'INVALID_DATE_TRANSFORMATION_SOURCE',
                        message: 'Data original inválida para transformação',
                        field: 'data_registro',
                        originalValue: originalData.data_registro
                    });
                } else if (Math.abs(originalDate.getTime() - transformedData.data_registro.getTime()) > 86400000) { // 1 dia
                    result.errors.push({
                        type: 'DATE_TRANSFORMATION_ERROR',
                        message: 'Erro na transformação de data - diferença maior que 1 dia',
                        field: 'data_registro',
                        originalValue: originalData.data_registro,
                        transformedValue: transformedData.data_registro.toISOString()
                    });
                }
            }
        }
        
        // Validar transformações em adições
        if (originalData.adicoes && transformedData.adicoes && Array.isArray(originalData.adicoes) && Array.isArray(transformedData.adicoes)) {
            const minLength = Math.min(originalData.adicoes.length, transformedData.adicoes.length);
            
            for (let i = 0; i < minLength; i++) {
                const origAdicao = originalData.adicoes[i];
                const transAdicao = transformedData.adicoes[i];
                
                if (!origAdicao || !transAdicao) continue;
                
                // Validar que NCM não foi alterado
                if (origAdicao.ncm && transAdicao.ncm && origAdicao.ncm !== transAdicao.ncm) {
                    result.warnings.push({
                        type: 'NCM_CHANGED_IN_TRANSFORMATION',
                        message: `NCM alterado na transformação da adição ${i + 1}`,
                        additionIndex: i,
                        originalNCM: origAdicao.ncm,
                        transformedNCM: transAdicao.ncm
                    });
                }
                
                // Validar preservação do valor em moeda de negociação
                if (origAdicao.valor_moeda_negociacao !== undefined && transAdicao.valor_moeda_negociacao !== undefined) {
                    const tolerance = this.validationRules.tolerancias.conversao_monetaria.absoluta;
                    if (Math.abs(origAdicao.valor_moeda_negociacao - transAdicao.valor_moeda_negociacao) > tolerance) {
                        result.warnings.push({
                            type: 'ADDITION_VALUE_CHANGED_IN_TRANSFORMATION',
                            message: `Valor em moeda de negociação alterado na adição ${i + 1}`,
                            additionIndex: i,
                            originalValue: origAdicao.valor_moeda_negociacao,
                            transformedValue: transAdicao.valor_moeda_negociacao
                        });
                    }
                }
            }
        }
    }
    
    /**
     * Valida agregações e totalizações
     * NO FALLBACKS: Soma deve ser precisa conforme configuração
     * 
     * @private
     */
    async _validateAggregations(transformedData, result) {
        if (!transformedData) {
            throw new Error('_validateAggregations: transformedData é obrigatório');
        }
        
        if (!result) {
            throw new Error('_validateAggregations: result é obrigatório');
        }
        
        if (!transformedData.adicoes || !Array.isArray(transformedData.adicoes)) {
            return;
        }
        
        const tolerance = this.validationRules.tolerancias.conversao_monetaria.absoluta;
        
        // Validar agregação do valor FOB BRL
        if (transformedData.valor_total_fob_brl !== undefined) {
            result.metrics.calculationsValidated++;
            
            const somaAdicoesBRL = transformedData.adicoes.reduce((sum, adicao) => {
                if (typeof adicao.valor_reais === 'number') {
                    return sum + adicao.valor_reais;
                }
                return sum;
            }, 0);
            
            if (somaAdicoesBRL > 0) {
                const difference = Math.abs(transformedData.valor_total_fob_brl - somaAdicoesBRL);
                
                if (difference > tolerance) {
                    result.errors.push({
                        type: 'FOB_BRL_AGGREGATION_ERROR',
                        message: `Inconsistência na agregação do valor FOB BRL`,
                        totalDeclared: transformedData.valor_total_fob_brl,
                        calculatedSum: somaAdicoesBRL,
                        difference: difference,
                        tolerance: tolerance
                    });
                }
            }
        }
        
        // Validar agregação de impostos se disponível
        if (transformedData.total_impostos_calculados !== undefined) {
            result.metrics.calculationsValidated++;
            
            const somaImpostos = transformedData.adicoes.reduce((sum, adicao) => {
                let impostoAdicao = 0;
                if (typeof adicao.ii_valor_calculado === 'number') impostoAdicao += adicao.ii_valor_calculado;
                if (typeof adicao.ipi_valor_calculado === 'number') impostoAdicao += adicao.ipi_valor_calculado;
                if (typeof adicao.pis_valor_calculado === 'number') impostoAdicao += adicao.pis_valor_calculado;
                if (typeof adicao.cofins_valor_calculado === 'number') impostoAdicao += adicao.cofins_valor_calculado;
                return sum + impostoAdicao;
            }, 0);
            
            const difference = Math.abs(transformedData.total_impostos_calculados - somaImpostos);
            
            if (difference > tolerance) {
                result.errors.push({
                    type: 'TAX_AGGREGATION_ERROR',
                    message: `Inconsistência na agregação de impostos`,
                    totalDeclared: transformedData.total_impostos_calculados,
                    calculatedSum: somaImpostos,
                    difference: difference
                });
            }
        }
    }
    
    /**
     * Valida preservação de dados críticos
     * NO FALLBACKS: Dados críticos não podem ser perdidos
     * 
     * @private
     */
    async _validateCriticalDataPreservation(originalData, transformedData, result) {
        if (!originalData) {
            throw new Error('_validateCriticalDataPreservation: originalData é obrigatório');
        }
        
        if (!transformedData) {
            throw new Error('_validateCriticalDataPreservation: transformedData é obrigatório');
        }
        
        if (!result) {
            throw new Error('_validateCriticalDataPreservation: result é obrigatório');
        }
        
        // Dados que nunca devem ser perdidos ou alterados
        const immutableFields = ['numero_di', 'importador_cnpj'];
        
        for (const field of immutableFields) {
            if (originalData[field] !== undefined) {
                result.metrics.fieldsCompared++;
                
                if (transformedData[field] === undefined) {
                    result.success = false;
                    result.errors.push({
                        type: 'CRITICAL_IMMUTABLE_FIELD_LOST',
                        message: `Campo imutável crítico perdido na transformação: ${field}`,
                        field: field,
                        originalValue: originalData[field]
                    });
                } else if (originalData[field] !== transformedData[field]) {
                    result.success = false;
                    result.errors.push({
                        type: 'CRITICAL_IMMUTABLE_FIELD_CHANGED',
                        message: `Campo imutável crítico alterado na transformação: ${field}`,
                        field: field,
                        originalValue: originalData[field],
                        transformedValue: transformedData[field]
                    });
                }
            }
        }
        
        // Validar preservação de metadados críticos se presentes
        if (originalData.metadata && transformedData.metadata) {
            const criticalMetadata = ['extractionTimestamp', 'xmlSource'];
            
            for (const metaField of criticalMetadata) {
                if (originalData.metadata[metaField] !== undefined && transformedData.metadata[metaField] === undefined) {
                    result.warnings.push({
                        type: 'CRITICAL_METADATA_LOST',
                        message: `Metadata crítico perdido na transformação: ${metaField}`,
                        field: metaField
                    });
                }
            }
        }
    }
    
    /**
     * Valida contexto de transformação
     * NO FALLBACKS: Context deve conter informações sobre transformação
     * 
     * @private
     */
    async _validateTransformationContext(context, result) {
        if (!context) {
            throw new Error('_validateTransformationContext: context é obrigatório');
        }
        
        if (!result) {
            throw new Error('_validateTransformationContext: result é obrigatório');
        }
        
        // Validar que contexto indica transformação específica
        if (!context.transformationType) {
            result.warnings.push({
                type: 'TRANSFORMATION_TYPE_NOT_SPECIFIED',
                message: 'Tipo de transformação não especificado no contexto'
            });
        }
        
        // Validar se transformação foi bem-sucedida no contexto
        if (context.transformationSuccess !== undefined && context.transformationSuccess === false) {
            result.success = false;
            result.errors.push({
                type: 'TRANSFORMATION_CONTEXT_FAILURE',
                message: 'Context indica falha na transformação de dados',
                context: context
            });
        }
        
        // Validar timestamp da transformação
        if (context.transformationTimestamp && typeof context.transformationTimestamp === 'string') {
            const transformationDate = new Date(context.transformationTimestamp);
            if (isNaN(transformationDate.getTime())) {
                result.warnings.push({
                    type: 'INVALID_TRANSFORMATION_TIMESTAMP',
                    message: 'Timestamp de transformação inválido no contexto',
                    timestamp: context.transformationTimestamp
                });
            }
        }
    }
    
    /**
     * Calcula métricas de precisão da transformação
     * NO FALLBACKS: Métricas baseadas apenas em dados válidos
     * 
     * @private
     */
    _calculateTransformationMetrics(result) {
        if (!result) {
            throw new Error('_calculateTransformationMetrics: result é obrigatório');
        }
        
        const totalValidations = result.metrics.fieldsCompared + result.metrics.calculationsValidated + result.metrics.conversionsValidated;
        const totalErrors = result.errors.length;
        
        if (totalValidations === 0) {
            result.metrics.transformationAccuracy = 0;
        } else {
            result.metrics.transformationAccuracy = Math.round(((totalValidations - totalErrors) / totalValidations) * 100);
        }
        
        // Adicionar métricas de qualidade
        result.metrics.errorRate = totalValidations > 0 ? Math.round((totalErrors / totalValidations) * 100) : 0;
        result.metrics.warningRate = totalValidations > 0 ? Math.round((result.warnings.length / totalValidations) * 100) : 0;
    }
}

export default TransformationValidator;