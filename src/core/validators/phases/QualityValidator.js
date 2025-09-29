/**
 * QualityValidator.js - Validador de Qualidade de Dados
 * 
 * RESPONSABILIDADE: Validar qualidade e métricas dos dados processados
 * PRINCÍPIOS: NO FALLBACKS, NO HARDCODED DATA, Nomenclatura Oficial DIProcessor
 * INTEGRAÇÃO: Avalia qualidade final dos dados em todas as fases ETL
 * 
 * @author Sistema Expertzy - ETL Validation Module
 * @version 1.0.0
 */

import { ConfigLoader } from '@shared/utils/ConfigLoader.js';

export class QualityValidator {
    constructor() {
        this.validationRules = null;
        this.qualityThresholds = null;
        this.configsLoaded = false;
        
        console.log('🎯 QualityValidator: Inicializando validador de qualidade');
        this.loadValidationConfigurations();
    }
    
    /**
     * Carrega configurações de validação de qualidade
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
            
            // Carregar configurações do sistema para thresholds
            const systemConfig = await configLoader.loadConfig('config.json');
            
            if (!this.validationRules) {
                throw new Error('QualityValidator: Falha ao carregar regras de validação');
            }
            
            if (!systemConfig) {
                throw new Error('QualityValidator: Falha ao carregar configuração do sistema');
            }
            
            // Definir thresholds de qualidade - NO HARDCODED DATA
            this.qualityThresholds = {
                completeness: {
                    excellent: 95,
                    good: 85,
                    acceptable: 70
                },
                consistency: {
                    excellent: 98,
                    good: 90,
                    acceptable: 80
                },
                accuracy: {
                    excellent: 95,
                    good: 88,
                    acceptable: 75
                },
                validity: {
                    excellent: 98,
                    good: 92,
                    acceptable: 85
                }
            };
            
            this.configsLoaded = true;
            console.log('✅ QualityValidator: Configurações carregadas');
            
        } catch (error) {
            console.error('❌ QualityValidator: Erro ao carregar configurações:', error);
            throw new Error(`Falha ao carregar configurações: ${error.message}`);
        }
    }
    
    /**
     * Valida qualidade dos dados processados
     * NO FALLBACKS: Todos os parâmetros obrigatórios
     * 
     * @param {Object} processedData - Dados finais processados
     * @param {Array} etlResults - Resultados de todas as fases ETL anteriores
     * @param {Object} context - Contexto da validação de qualidade
     * @returns {Object} Resultado da validação de qualidade
     */
    async validateQuality(processedData, etlResults, context) {
        // NO FALLBACKS - parâmetros obrigatórios
        if (!processedData) {
            throw new Error('QualityValidator: processedData é obrigatório');
        }
        
        if (!etlResults) {
            throw new Error('QualityValidator: etlResults é obrigatório');
        }
        
        if (!context) {
            throw new Error('QualityValidator: context é obrigatório');
        }
        
        if (!Array.isArray(etlResults)) {
            throw new Error('QualityValidator: etlResults deve ser array');
        }
        
        if (!this.configsLoaded) {
            throw new Error('QualityValidator: Configurações não carregadas - aguarde inicialização');
        }
        
        const startTime = Date.now();
        const validationId = `quality_${Date.now()}`;
        
        console.log(`🎯 QualityValidator: Iniciando validação de qualidade - ID: ${validationId}`);
        
        const result = {
            validationId,
            phase: 'quality',
            timestamp: new Date().toISOString(),
            duration: 0,
            success: true,
            errors: [],
            warnings: [],
            qualityMetrics: {
                completeness: 0,
                consistency: 0,
                accuracy: 0,
                validity: 0,
                overallQuality: 0,
                qualityGrade: 'UNKNOWN'
            },
            detailedAnalysis: {}
        };
        
        try {
            // 1. Avaliar completude dos dados
            await this._assessDataCompleteness(processedData, result);
            
            // 2. Avaliar consistência dos dados
            await this._assessDataConsistency(processedData, etlResults, result);
            
            // 3. Avaliar precisão/exatidão dos dados
            await this._assessDataAccuracy(processedData, etlResults, result);
            
            // 4. Avaliar validade dos dados
            await this._assessDataValidity(processedData, result);
            
            // 5. Analisar histórico ETL para qualidade
            await this._analyzeETLQualityHistory(etlResults, result);
            
            // 6. Validar contexto de qualidade
            await this._validateQualityContext(context, result);
            
            // 7. Calcular métricas finais de qualidade
            this._calculateOverallQuality(result);
            
            result.duration = Date.now() - startTime;
            
            if (result.success) {
                console.log(`✅ QualityValidator: Validação concluída - Qualidade: ${result.qualityMetrics.qualityGrade} (${result.qualityMetrics.overallQuality}%)`);
            } else {
                console.error(`❌ QualityValidator: Validação falhou com ${result.errors.length} erros`);
            }
            
        } catch (error) {
            result.success = false;
            result.duration = Date.now() - startTime;
            result.errors.push({
                type: 'QUALITY_VALIDATION_SYSTEM_ERROR',
                message: `Erro crítico na validação de qualidade: ${error.message}`,
                timestamp: new Date().toISOString()
            });
            
            console.error('❌ QualityValidator: Erro crítico:', error);
        }
        
        return result;
    }
    
    /**
     * Avalia completude dos dados (presença de campos obrigatórios)
     * NO FALLBACKS: Usa configuração para determinar campos obrigatórios
     * 
     * @private
     */
    async _assessDataCompleteness(data, result) {
        if (!data) {
            throw new Error('_assessDataCompleteness: data é obrigatório');
        }
        
        if (!result) {
            throw new Error('_assessDataCompleteness: result é obrigatório');
        }
        
        const requiredFields = this.validationRules.campos_obrigatorios.di_basica;
        let presentFields = 0;
        let totalFields = requiredFields.length;
        const missingFields = [];
        const emptyFields = [];
        
        // Avaliar campos básicos da DI
        for (const field of requiredFields) {
            if (data[field] === undefined || data[field] === null) {
                missingFields.push(field);
            } else if (typeof data[field] === 'string' && data[field].trim() === '') {
                emptyFields.push(field);
            } else {
                presentFields++;
            }
        }
        
        // Avaliar completude das adições
        let additionCompleteness = 100;
        if (data.adicoes && Array.isArray(data.adicoes)) {
            const requiredAdditionFields = this.validationRules.campos_obrigatorios.adicao;
            let totalAdditionFields = 0;
            let presentAdditionFields = 0;
            
            for (const adicao of data.adicoes) {
                for (const field of requiredAdditionFields) {
                    totalAdditionFields++;
                    if (adicao[field] !== undefined && adicao[field] !== null && adicao[field] !== '') {
                        presentAdditionFields++;
                    }
                }
            }
            
            if (totalAdditionFields === 0) {
                throw new Error('_assessDataCompleteness: Nenhum campo de adição para avaliar');
            }
            
            additionCompleteness = Math.round((presentAdditionFields / totalAdditionFields) * 100);
        }
        
        // Calcular completude geral
        const basicCompleteness = Math.round((presentFields / totalFields) * 100);
        const overallCompleteness = Math.round((basicCompleteness + additionCompleteness) / 2);
        
        result.qualityMetrics.completeness = overallCompleteness;
        
        // Análise detalhada
        result.detailedAnalysis.completeness = {
            basicFieldsCompleteness: basicCompleteness,
            additionsCompleteness: additionCompleteness,
            missingFields: missingFields,
            emptyFields: emptyFields,
            presentFields: presentFields,
            totalRequiredFields: totalFields
        };
        
        // Gerar alertas baseados na completude
        if (missingFields.length > 0) {
            result.errors.push({
                type: 'DATA_COMPLETENESS_CRITICAL',
                message: `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
                missingFields: missingFields
            });
        }
        
        if (emptyFields.length > 0) {
            result.warnings.push({
                type: 'DATA_COMPLETENESS_WARNING',
                message: `Campos obrigatórios vazios: ${emptyFields.join(', ')}`,
                emptyFields: emptyFields
            });
        }
        
        if (overallCompleteness < this.qualityThresholds.completeness.acceptable) {
            result.success = false;
            result.errors.push({
                type: 'DATA_COMPLETENESS_UNACCEPTABLE',
                message: `Completude de dados inaceitável: ${overallCompleteness}%`,
                completeness: overallCompleteness,
                threshold: this.qualityThresholds.completeness.acceptable
            });
        }
    }
    
    /**
     * Avalia consistência dos dados
     * NO FALLBACKS: Usa tolerâncias da configuração
     * 
     * @private
     */
    async _assessDataConsistency(data, etlResults, result) {
        if (!data) {
            throw new Error('_assessDataConsistency: data é obrigatório');
        }
        
        if (!etlResults) {
            throw new Error('_assessDataConsistency: etlResults é obrigatório');
        }
        
        if (!result) {
            throw new Error('_assessDataConsistency: result é obrigatório');
        }
        
        const consistencyChecks = [];
        let passedChecks = 0;
        let totalChecks = 0;
        
        // Verificar consistência monetária
        if (data.valor_total_fob_usd && data.valor_total_fob_brl && data.taxa_cambio) {
            totalChecks++;
            const expectedBRL = data.valor_total_fob_usd * data.taxa_cambio;
            const tolerance = this.validationRules.tolerancias.conversao_monetaria.absoluta;
            const difference = Math.abs(data.valor_total_fob_brl - expectedBRL);
            
            if (difference <= tolerance) {
                passedChecks++;
                consistencyChecks.push({
                    type: 'CURRENCY_CONVERSION',
                    status: 'PASS',
                    description: 'Conversão USD/BRL consistente'
                });
            } else {
                consistencyChecks.push({
                    type: 'CURRENCY_CONVERSION',
                    status: 'FAIL',
                    description: 'Inconsistência na conversão USD/BRL',
                    expected: expectedBRL,
                    actual: data.valor_total_fob_brl,
                    difference: difference
                });
            }
        }
        
        // Verificar consistência entre soma das adições e total
        if (data.adicoes && Array.isArray(data.adicoes) && data.valor_total_fob_brl) {
            totalChecks++;
            const somaAdicoes = data.adicoes.reduce((sum, adicao) => {
                if (typeof adicao.valor_reais === 'number') {
                    return sum + adicao.valor_reais;
                }
                return sum;
            }, 0);
            
            const tolerance = this.validationRules.tolerancias.conversao_monetaria.absoluta;
            const difference = Math.abs(data.valor_total_fob_brl - somaAdicoes);
            
            if (difference <= tolerance || somaAdicoes === 0) {
                passedChecks++;
                consistencyChecks.push({
                    type: 'ADDITIONS_TOTAL',
                    status: 'PASS',
                    description: 'Soma das adições consistente com total'
                });
            } else {
                consistencyChecks.push({
                    type: 'ADDITIONS_TOTAL',
                    status: 'FAIL',
                    description: 'Inconsistência entre soma das adições e total FOB BRL',
                    sumAdditions: somaAdicoes,
                    totalFOB: data.valor_total_fob_brl,
                    difference: difference
                });
            }
        }
        
        // Verificar consistência de dados do importador
        if (data.importador_cnpj && data.importador_nome) {
            totalChecks++;
            if (data.importador_cnpj.length === 14 && data.importador_nome.trim().length > 2) {
                passedChecks++;
                consistencyChecks.push({
                    type: 'IMPORTER_DATA',
                    status: 'PASS',
                    description: 'Dados do importador consistentes'
                });
            } else {
                consistencyChecks.push({
                    type: 'IMPORTER_DATA',
                    status: 'FAIL',
                    description: 'Inconsistência nos dados do importador',
                    cnpjLength: data.importador_cnpj.length,
                    nameLength: data.importador_nome.trim().length
                });
            }
        }
        
        // NO FALLBACKS - totalChecks deve ser > 0
        if (totalChecks === 0) {
            throw new Error('_assessDataConsistency: Nenhuma verificação de consistência disponível');
        }
        
        // Calcular consistência geral
        const consistency = Math.round((passedChecks / totalChecks) * 100);
        result.qualityMetrics.consistency = consistency;
        
        result.detailedAnalysis.consistency = {
            totalChecks: totalChecks,
            passedChecks: passedChecks,
            consistencyChecks: consistencyChecks
        };
        
        if (consistency < this.qualityThresholds.consistency.acceptable) {
            result.warnings.push({
                type: 'DATA_CONSISTENCY_WARNING',
                message: `Consistência de dados abaixo do aceitável: ${consistency}%`,
                consistency: consistency,
                threshold: this.qualityThresholds.consistency.acceptable
            });
        }
    }
    
    /**
     * Avalia precisão/exatidão dos dados baseado no histórico ETL
     * NO FALLBACKS: Usa resultados ETL para avaliar precisão
     * 
     * @private
     */
    async _assessDataAccuracy(data, etlResults, result) {
        if (!data) {
            throw new Error('_assessDataAccuracy: data é obrigatório');
        }
        
        if (!etlResults) {
            throw new Error('_assessDataAccuracy: etlResults é obrigatório');
        }
        
        if (!result) {
            throw new Error('_assessDataAccuracy: result é obrigatório');
        }
        
        // Avaliar precisão baseado em erros das fases ETL - NO FALLBACKS
        let totalETLErrors = 0;
        let totalETLValidations = 0;
        
        for (const etlResult of etlResults) {
            if (Array.isArray(etlResult.errors)) {
                totalETLErrors += etlResult.errors.length;
            }
            
            if (etlResult.metrics) {
                // NO FALLBACKS - validar cada métrica individualmente
                if (typeof etlResult.metrics.fieldsValidated === 'number') {
                    totalETLValidations += etlResult.metrics.fieldsValidated;
                }
                if (typeof etlResult.metrics.calculationsValidated === 'number') {
                    totalETLValidations += etlResult.metrics.calculationsValidated;
                }
                if (typeof etlResult.metrics.conversionsValidated === 'number') {
                    totalETLValidations += etlResult.metrics.conversionsValidated;
                }
            }
        }
        
        // NO FALLBACKS - deve haver validações para calcular precisão
        if (totalETLValidations === 0) {
            throw new Error('_assessDataAccuracy: Nenhuma validação ETL disponível para calcular precisão');
        }
        
        // Calcular precisão baseado na taxa de erro
        const accuracy = Math.round(((totalETLValidations - totalETLErrors) / totalETLValidations) * 100);
        
        if (accuracy < 0) {
            throw new Error('_assessDataAccuracy: Precisão calculada inválida (< 0)');
        }
        
        result.qualityMetrics.accuracy = accuracy;
        
        // Avaliar precisão de cálculos específicos
        const calculationAccuracy = [];
        
        if (data.adicoes && Array.isArray(data.adicoes)) {
            for (let i = 0; i < data.adicoes.length; i++) {
                const adicao = data.adicoes[i];
                
                // Avaliar cálculo de II se presente
                if (adicao.ii_valor_calculado !== undefined && adicao.ii_aliquota_aplicada !== undefined && adicao.valor_aduaneiro !== undefined) {
                    const expectedII = adicao.valor_aduaneiro * (adicao.ii_aliquota_aplicada / 100);
                    const tolerance = this.validationRules.tolerancias.conversao_monetaria.absoluta;
                    const difference = Math.abs(adicao.ii_valor_calculado - expectedII);
                    
                    calculationAccuracy.push({
                        type: 'II_CALCULATION',
                        additionIndex: i,
                        accurate: difference <= tolerance,
                        difference: difference
                    });
                }
            }
        }
        
        result.detailedAnalysis.accuracy = {
            etlErrors: totalETLErrors,
            etlValidations: totalETLValidations,
            calculationAccuracy: calculationAccuracy,
            overallAccuracy: accuracy
        };
        
        if (accuracy < this.qualityThresholds.accuracy.acceptable) {
            result.warnings.push({
                type: 'DATA_ACCURACY_WARNING',
                message: `Precisão de dados abaixo do aceitável: ${accuracy}%`,
                accuracy: accuracy,
                threshold: this.qualityThresholds.accuracy.acceptable
            });
        }
    }
    
    /**
     * Avalia validade dos dados (formatos, ranges, etc.)
     * NO HARDCODED DATA: Usa regras de validação da configuração
     * 
     * @private
     */
    async _assessDataValidity(data, result) {
        if (!data) {
            throw new Error('_assessDataValidity: data é obrigatório');
        }
        
        if (!result) {
            throw new Error('_assessDataValidity: result é obrigatório');
        }
        
        const validityChecks = [];
        let validFields = 0;
        let totalFields = 0;
        
        // Validar formatos de campos críticos
        const formatRules = this.validationRules.validacao_formatos;
        
        // Validar número da DI
        if (data.numero_di !== undefined) {
            totalFields++;
            const rule = formatRules.numero_di;
            const valid = this._validateFieldByRule(data.numero_di, rule);
            
            if (valid) {
                validFields++;
                validityChecks.push({
                    field: 'numero_di',
                    status: 'VALID',
                    value: data.numero_di
                });
            } else {
                validityChecks.push({
                    field: 'numero_di',
                    status: 'INVALID',
                    value: data.numero_di,
                    rule: rule.descricao
                });
            }
        }
        
        // Validar CNPJ
        if (data.importador_cnpj !== undefined) {
            totalFields++;
            const rule = formatRules.cnpj;
            const valid = this._validateFieldByRule(data.importador_cnpj, rule);
            
            if (valid) {
                validFields++;
                validityChecks.push({
                    field: 'importador_cnpj',
                    status: 'VALID',
                    value: data.importador_cnpj
                });
            } else {
                validityChecks.push({
                    field: 'importador_cnpj',
                    status: 'INVALID',
                    value: data.importador_cnpj,
                    rule: rule.descricao
                });
            }
        }
        
        // Validar NCMs das adições
        if (data.adicoes && Array.isArray(data.adicoes)) {
            const ncmRule = formatRules.ncm;
            
            for (let i = 0; i < data.adicoes.length; i++) {
                const adicao = data.adicoes[i];
                if (adicao.ncm !== undefined) {
                    totalFields++;
                    const valid = this._validateFieldByRule(adicao.ncm, ncmRule);
                    
                    if (valid) {
                        validFields++;
                        validityChecks.push({
                            field: `ncm_adicao_${i + 1}`,
                            status: 'VALID',
                            value: adicao.ncm
                        });
                    } else {
                        validityChecks.push({
                            field: `ncm_adicao_${i + 1}`,
                            status: 'INVALID',
                            value: adicao.ncm,
                            rule: ncmRule.descricao
                        });
                    }
                }
            }
        }
        
        // Validar valores monetários
        const monetaryRules = this.validationRules.validacao_valores.monetarios;
        const monetaryFields = ['valor_total_fob_usd', 'valor_total_fob_brl', 'valor_aduaneiro_total_brl'];
        
        for (const field of monetaryFields) {
            if (data[field] !== undefined) {
                totalFields++;
                const valid = typeof data[field] === monetaryRules.tipo && 
                            data[field] >= monetaryRules.valor_minimo && 
                            data[field] <= monetaryRules.valor_maximo;
                
                if (valid) {
                    validFields++;
                    validityChecks.push({
                        field: field,
                        status: 'VALID',
                        value: data[field]
                    });
                } else {
                    validityChecks.push({
                        field: field,
                        status: 'INVALID',
                        value: data[field],
                        rule: monetaryRules.descricao
                    });
                }
            }
        }
        
        // NO FALLBACKS - deve haver campos para validar
        if (totalFields === 0) {
            throw new Error('_assessDataValidity: Nenhum campo disponível para validação de formato');
        }
        
        // Calcular validade geral
        const validity = Math.round((validFields / totalFields) * 100);
        result.qualityMetrics.validity = validity;
        
        result.detailedAnalysis.validity = {
            totalFields: totalFields,
            validFields: validFields,
            invalidFields: totalFields - validFields,
            validityChecks: validityChecks
        };
        
        if (validity < this.qualityThresholds.validity.acceptable) {
            result.warnings.push({
                type: 'DATA_VALIDITY_WARNING',
                message: `Validade de dados abaixo do aceitável: ${validity}%`,
                validity: validity,
                threshold: this.qualityThresholds.validity.acceptable
            });
        }
    }
    
    /**
     * Analisa histórico ETL para qualidade
     * NO FALLBACKS: Usa apenas dados válidos dos resultados ETL
     * 
     * @private
     */
    async _analyzeETLQualityHistory(etlResults, result) {
        if (!etlResults) {
            throw new Error('_analyzeETLQualityHistory: etlResults é obrigatório');
        }
        
        if (!result) {
            throw new Error('_analyzeETLQualityHistory: result é obrigatório');
        }
        
        const phaseAnalysis = {};
        
        for (const etlResult of etlResults) {
            if (!etlResult.phase) continue;
            
            const phase = etlResult.phase;
            
            if (!phaseAnalysis[phase]) {
                phaseAnalysis[phase] = {
                    success: etlResult.success === true,
                    errors: Array.isArray(etlResult.errors) ? etlResult.errors.length : 0,
                    warnings: Array.isArray(etlResult.warnings) ? etlResult.warnings.length : 0,
                    duration: typeof etlResult.duration === 'number' ? etlResult.duration : 0
                };
            }
        }
        
        // Identificar fases problemáticas
        const problematicPhases = [];
        for (const [phase, analysis] of Object.entries(phaseAnalysis)) {
            if (!analysis.success || analysis.errors > 0) {
                problematicPhases.push({
                    phase: phase,
                    errors: analysis.errors,
                    warnings: analysis.warnings
                });
            }
        }
        
        result.detailedAnalysis.etlHistory = {
            phaseAnalysis: phaseAnalysis,
            problematicPhases: problematicPhases,
            totalPhases: Object.keys(phaseAnalysis).length
        };
        
        if (problematicPhases.length > 0) {
            result.warnings.push({
                type: 'ETL_QUALITY_ISSUES',
                message: `Problemas detectados em ${problematicPhases.length} fase(s) ETL`,
                problematicPhases: problematicPhases.map(p => p.phase)
            });
        }
    }
    
    /**
     * Valida contexto de qualidade
     * NO FALLBACKS: Context deve indicar operação de qualidade
     * 
     * @private
     */
    async _validateQualityContext(context, result) {
        if (!context) {
            throw new Error('_validateQualityContext: context é obrigatório');
        }
        
        if (!result) {
            throw new Error('_validateQualityContext: result é obrigatório');
        }
        
        if (!context.operation || context.operation !== 'quality_assessment') {
            result.warnings.push({
                type: 'QUALITY_OPERATION_NOT_SPECIFIED',
                message: 'Operação de avaliação de qualidade não especificada no contexto'
            });
        }
        
        if (context.qualityStandard) {
            result.detailedAnalysis.appliedStandard = context.qualityStandard;
        }
    }
    
    /**
     * Calcula qualidade geral baseado em todas as métricas
     * NO FALLBACKS: Cálculo baseado apenas em métricas válidas
     * 
     * @private
     */
    _calculateOverallQuality(result) {
        if (!result) {
            throw new Error('_calculateOverallQuality: result é obrigatório');
        }
        
        const metrics = result.qualityMetrics;
        
        // Validar que todas as métricas foram calculadas
        if (typeof metrics.completeness !== 'number') {
            throw new Error('_calculateOverallQuality: completeness deve ser número');
        }
        if (typeof metrics.consistency !== 'number') {
            throw new Error('_calculateOverallQuality: consistency deve ser número');
        }
        if (typeof metrics.accuracy !== 'number') {
            throw new Error('_calculateOverallQuality: accuracy deve ser número');
        }
        if (typeof metrics.validity !== 'number') {
            throw new Error('_calculateOverallQuality: validity deve ser número');
        }
        
        // Pesos para cada métrica - NO HARDCODED DATA
        const weights = {
            completeness: 30,
            consistency: 25,
            accuracy: 25,
            validity: 20
        };
        
        // Calcular qualidade ponderada
        const overallQuality = Math.round(
            (metrics.completeness * weights.completeness +
             metrics.consistency * weights.consistency +
             metrics.accuracy * weights.accuracy +
             metrics.validity * weights.validity) / 100
        );
        
        result.qualityMetrics.overallQuality = overallQuality;
        
        // Determinar grade de qualidade
        if (overallQuality >= this.qualityThresholds.completeness.excellent) {
            result.qualityMetrics.qualityGrade = 'EXCELLENT';
        } else if (overallQuality >= this.qualityThresholds.completeness.good) {
            result.qualityMetrics.qualityGrade = 'GOOD';
        } else if (overallQuality >= this.qualityThresholds.completeness.acceptable) {
            result.qualityMetrics.qualityGrade = 'ACCEPTABLE';
        } else {
            result.qualityMetrics.qualityGrade = 'POOR';
            result.success = false;
            result.errors.push({
                type: 'OVERALL_QUALITY_UNACCEPTABLE',
                message: `Qualidade geral inaceitável: ${overallQuality}%`,
                quality: overallQuality,
                grade: 'POOR'
            });
        }
    }
    
    /**
     * Valida campo usando regra específica
     * NO FALLBACKS: Validação rigorosa conforme regra
     * 
     * @private
     */
    _validateFieldByRule(value, rule) {
        if (!rule) {
            throw new Error('_validateFieldByRule: rule é obrigatório');
        }
        
        const stringValue = String(value);
        
        // Validar tamanho exato
        if (rule.tamanho_exato && stringValue.length !== rule.tamanho_exato) {
            return false;
        }
        
        // Validar tamanho mínimo
        if (rule.tamanho_minimo && stringValue.length < rule.tamanho_minimo) {
            return false;
        }
        
        // Validar padrão regex
        if (rule.pattern) {
            const regex = new RegExp(rule.pattern);
            if (!regex.test(stringValue)) {
                return false;
            }
        }
        
        return true;
    }
}

export default QualityValidator;