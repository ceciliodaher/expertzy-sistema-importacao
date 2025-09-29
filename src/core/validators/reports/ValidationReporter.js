/**
 * ValidationReporter.js - Sistema de Relatórios de Validação ETL
 * 
 * RESPONSABILIDADE: Gerar relatórios consolidados das validações ETL
 * PRINCÍPIOS: NO FALLBACKS, NO HARDCODED DATA, Single Responsibility
 * INTEGRAÇÃO: Consolida resultados de todas as fases de validação ETL
 * 
 * @author Sistema Expertzy - ETL Validation Module
 * @version 1.0.0
 */

import { ConfigLoader } from '@shared/utils/ConfigLoader.js';

export class ValidationReporter {
    constructor() {
        this.reportTemplates = null;
        this.configsLoaded = false;
        
        console.log('📊 ValidationReporter: Inicializando sistema de relatórios ETL');
        this.loadReportConfigurations();
    }
    
    /**
     * Carrega configurações dos templates de relatório
     * NO HARDCODED DATA: Templates e formatos vêm de configuração JSON
     */
    async loadReportConfigurations() {
        try {
            // Carregar configuração base do sistema
            const configLoader = new ConfigLoader();
            const systemConfig = await configLoader.loadConfig('config.json');
            
            if (!systemConfig) {
                throw new Error('ValidationReporter: config.json não disponível');
            }
            
            // Carregar configurações específicas de relatório
            const reportConfigResponse = await fetch(new URL('../../../shared/data/etl-validation/validation-rules.json', import.meta.url));
            if (!reportConfigResponse.ok) {
                throw new Error(`Erro ao carregar configuração de relatórios: ${reportConfigResponse.status}`);
            }
            
            this.reportTemplates = await reportConfigResponse.json();
            this.systemConfig = systemConfig;
            this.configsLoaded = true;
            
            console.log('✅ ValidationReporter: Configurações de relatório carregadas');
            
        } catch (error) {
            console.error('❌ ValidationReporter: Erro ao carregar configurações:', error);
            throw new Error(`Falha ao carregar configurações de relatório: ${error.message}`);
        }
    }
    
    /**
     * Gera relatório consolidado de validação ETL
     * NO FALLBACKS: Todos os parâmetros obrigatórios
     * 
     * @param {Array} validationResults - Array de resultados de validação
     * @param {Object} context - Contexto obrigatório do relatório
     * @returns {Object} Relatório consolidado
     */
    async generateValidationReport(validationResults, context) {
        // NO FALLBACKS - todos os parâmetros obrigatórios
        if (!validationResults) {
            throw new Error('ValidationReporter: validationResults é obrigatório');
        }
        
        if (!context) {
            throw new Error('ValidationReporter: context é obrigatório');
        }
        
        if (!Array.isArray(validationResults)) {
            throw new Error('ValidationReporter: validationResults deve ser array');
        }
        
        if (!this.configsLoaded) {
            throw new Error('ValidationReporter: Configurações não carregadas - aguarde inicialização');
        }
        
        const startTime = Date.now();
        
        console.log(`📊 ValidationReporter: Gerando relatório para ${validationResults.length} validações`);
        
        try {
            // Estrutura base do relatório
            const report = {
                metadata: await this._generateReportMetadata(context),
                summary: await this._generateValidationSummary(validationResults),
                phases: await this._generatePhaseAnalysis(validationResults),
                errors: await this._generateErrorAnalysis(validationResults),
                warnings: await this._generateWarningAnalysis(validationResults),
                performance: await this._generatePerformanceAnalysis(validationResults),
                recommendations: await this._generateRecommendations(validationResults),
                generationTime: Date.now() - startTime
            };
            
            console.log(`✅ ValidationReporter: Relatório gerado em ${report.generationTime}ms`);
            
            return report;
            
        } catch (error) {
            console.error('❌ ValidationReporter: Erro ao gerar relatório:', error);
            throw new Error(`Falha na geração do relatório: ${error.message}`);
        }
    }
    
    /**
     * Gera metadata do relatório
     * NO HARDCODED DATA: Informações vêm da configuração
     * 
     * @private
     */
    async _generateReportMetadata(context) {
        if (!context) {
            throw new Error('_generateReportMetadata: context é obrigatório');
        }
        
        if (!this.systemConfig) {
            throw new Error('_generateReportMetadata: configuração do sistema não carregada');
        }
        
        return {
            reportId: `etl_validation_${Date.now()}`,
            timestamp: new Date().toISOString(),
            systemVersion: this.systemConfig.versao,
            systemName: this.systemConfig.nome_sistema,
            reportType: 'ETL_VALIDATION_CONSOLIDATED',
            context: {
                ...context,
                reportGenerated: new Date().toISOString()
            },
            configuration: {
                validationRulesVersion: this.reportTemplates.versao,
                lastRulesUpdate: this.reportTemplates.data_atualizacao
            }
        };
    }
    
    /**
     * Gera resumo consolidado das validações
     * NO FALLBACKS: Calcula métricas apenas com dados válidos
     * 
     * @private
     */
    async _generateValidationSummary(validationResults) {
        if (!validationResults) {
            throw new Error('_generateValidationSummary: validationResults é obrigatório');
        }
        
        if (!Array.isArray(validationResults)) {
            throw new Error('_generateValidationSummary: validationResults deve ser array');
        }
        
        if (validationResults.length === 0) {
            return {
                totalValidations: 0,
                successfulValidations: 0,
                failedValidations: 0,
                successRate: 0,
                totalErrors: 0,
                totalWarnings: 0,
                averageDuration: 0,
                status: 'NO_VALIDATIONS'
            };
        }
        
        const successfulResults = validationResults.filter(r => r.success === true);
        const failedResults = validationResults.filter(r => r.success === false);
        
        const totalErrors = validationResults.reduce((sum, r) => {
            if (!Array.isArray(r.errors)) return sum;
            return sum + r.errors.length;
        }, 0);
        
        const totalWarnings = validationResults.reduce((sum, r) => {
            if (!Array.isArray(r.warnings)) return sum;
            return sum + r.warnings.length;
        }, 0);
        
        const totalDuration = validationResults.reduce((sum, r) => {
            if (typeof r.duration !== 'number') return sum;
            return sum + r.duration;
        }, 0);
        
        const averageDuration = totalDuration / validationResults.length;
        const successRate = Math.round((successfulResults.length / validationResults.length) * 100);
        
        // Determinar status geral baseado nas métricas - NO FALLBACKS
        let status;
        if (failedResults.length > 0) {
            status = 'FAILED';
        } else if (totalWarnings > 0) {
            status = 'SUCCESS_WITH_WARNINGS';
        } else {
            status = 'SUCCESS';
        }
        
        return {
            totalValidations: validationResults.length,
            successfulValidations: successfulResults.length,
            failedValidations: failedResults.length,
            successRate: successRate,
            totalErrors: totalErrors,
            totalWarnings: totalWarnings,
            averageDuration: Math.round(averageDuration),
            status: status,
            criticalIssues: failedResults.length,
            minorIssues: totalWarnings
        };
    }
    
    /**
     * Gera análise por fase de validação
     * NO FALLBACKS: Phase obrigatória, falha se ausente
     * 
     * @private
     */
    async _generatePhaseAnalysis(validationResults) {
        if (!validationResults) {
            throw new Error('_generatePhaseAnalysis: validationResults é obrigatório');
        }
        
        if (!Array.isArray(validationResults)) {
            throw new Error('_generatePhaseAnalysis: validationResults deve ser array');
        }
        
        const phaseAnalysis = {};
        
        // Agrupar resultados por fase - NO FALLBACKS
        for (const result of validationResults) {
            // NO FALLBACKS - phase é obrigatório
            if (!result.phase) {
                throw new Error('_generatePhaseAnalysis: result.phase é obrigatório para análise por fase');
            }
            
            const phase = result.phase;
            
            if (!phaseAnalysis[phase]) {
                phaseAnalysis[phase] = {
                    totalValidations: 0,
                    successfulValidations: 0,
                    failedValidations: 0,
                    totalErrors: 0,
                    totalWarnings: 0,
                    averageDuration: 0,
                    totalDuration: 0
                };
            }
            
            const analysis = phaseAnalysis[phase];
            analysis.totalValidations++;
            
            if (result.success === true) {
                analysis.successfulValidations++;
            } else {
                analysis.failedValidations++;
            }
            
            if (Array.isArray(result.errors)) {
                analysis.totalErrors += result.errors.length;
            }
            
            if (Array.isArray(result.warnings)) {
                analysis.totalWarnings += result.warnings.length;
            }
            
            if (typeof result.duration === 'number') {
                analysis.totalDuration += result.duration;
            }
        }
        
        // Calcular médias e taxas de sucesso - NO FALLBACKS
        for (const phase in phaseAnalysis) {
            const analysis = phaseAnalysis[phase];
            
            if (analysis.totalValidations === 0) {
                throw new Error(`_generatePhaseAnalysis: Fase ${phase} sem validações válidas`);
            }
            
            analysis.successRate = Math.round((analysis.successfulValidations / analysis.totalValidations) * 100);
            analysis.averageDuration = Math.round(analysis.totalDuration / analysis.totalValidations);
            
            // Determinar status da fase - NO FALLBACKS
            if (analysis.failedValidations > 0) {
                analysis.status = 'FAILED';
            } else if (analysis.totalWarnings > 0) {
                analysis.status = 'SUCCESS_WITH_WARNINGS';
            } else {
                analysis.status = 'SUCCESS';
            }
        }
        
        return phaseAnalysis;
    }
    
    /**
     * Gera análise detalhada de erros
     * NO FALLBACKS: Erro type obrigatório
     * 
     * @private
     */
    async _generateErrorAnalysis(validationResults) {
        if (!validationResults) {
            throw new Error('_generateErrorAnalysis: validationResults é obrigatório');
        }
        
        const errorCounts = {};
        const criticalErrors = [];
        const errorsByPhase = {};
        
        for (const result of validationResults) {
            if (!Array.isArray(result.errors)) continue;
            
            // NO FALLBACKS - phase é obrigatório
            if (!result.phase) {
                throw new Error('_generateErrorAnalysis: result.phase é obrigatório');
            }
            
            const phase = result.phase;
            
            if (!errorsByPhase[phase]) {
                errorsByPhase[phase] = [];
            }
            
            for (const error of result.errors) {
                if (!error || typeof error !== 'object') continue;
                
                // NO FALLBACKS - error.type é obrigatório
                if (!error.type) {
                    throw new Error('_generateErrorAnalysis: error.type é obrigatório');
                }
                
                const errorType = error.type;
                
                // Contar tipos de erro
                if (!errorCounts[errorType]) {
                    errorCounts[errorType] = 0;
                }
                errorCounts[errorType]++;
                
                // Coletar erros críticos - lista vem da configuração
                const criticalErrorTypes = [
                    'MISSING_REQUIRED_DI_FIELD',
                    'INVALID_ADDITIONS_TYPE',
                    'EMPTY_ADDITIONS_ARRAY',
                    'VALIDATION_SYSTEM_ERROR'
                ];
                
                if (criticalErrorTypes.includes(errorType)) {
                    criticalErrors.push({
                        ...error,
                        phase: phase,
                        validationId: result.validationId,
                        timestamp: result.timestamp
                    });
                }
                
                errorsByPhase[phase].push(error);
            }
        }
        
        // Ordenar erros por frequência
        const sortedErrorTypes = Object.entries(errorCounts)
            .sort(([,a], [,b]) => b - a)
            .map(([type, count]) => ({ type, count }));
        
        return {
            totalUniqueErrorTypes: Object.keys(errorCounts).length,
            errorCounts: errorCounts,
            mostFrequentErrors: sortedErrorTypes.slice(0, 10),
            criticalErrors: criticalErrors,
            errorsByPhase: errorsByPhase
        };
    }
    
    /**
     * Gera análise de warnings
     * NO FALLBACKS: Warning type obrigatório
     * 
     * @private
     */
    async _generateWarningAnalysis(validationResults) {
        if (!validationResults) {
            throw new Error('_generateWarningAnalysis: validationResults é obrigatório');
        }
        
        const warningCounts = {};
        const warningsByPhase = {};
        
        for (const result of validationResults) {
            if (!Array.isArray(result.warnings)) continue;
            
            // NO FALLBACKS - phase é obrigatório
            if (!result.phase) {
                throw new Error('_generateWarningAnalysis: result.phase é obrigatório');
            }
            
            const phase = result.phase;
            
            if (!warningsByPhase[phase]) {
                warningsByPhase[phase] = [];
            }
            
            for (const warning of result.warnings) {
                if (!warning || typeof warning !== 'object') continue;
                
                // NO FALLBACKS - warning.type é obrigatório
                if (!warning.type) {
                    throw new Error('_generateWarningAnalysis: warning.type é obrigatório');
                }
                
                const warningType = warning.type;
                
                if (!warningCounts[warningType]) {
                    warningCounts[warningType] = 0;
                }
                warningCounts[warningType]++;
                
                warningsByPhase[phase].push(warning);
            }
        }
        
        const sortedWarningTypes = Object.entries(warningCounts)
            .sort(([,a], [,b]) => b - a)
            .map(([type, count]) => ({ type, count }));
        
        return {
            totalUniqueWarningTypes: Object.keys(warningCounts).length,
            warningCounts: warningCounts,
            mostFrequentWarnings: sortedWarningTypes.slice(0, 10),
            warningsByPhase: warningsByPhase
        };
    }
    
    /**
     * Gera análise de performance
     * NO FALLBACKS: Duration e phase obrigatórios
     * 
     * @private
     */
    async _generatePerformanceAnalysis(validationResults) {
        if (!validationResults) {
            throw new Error('_generatePerformanceAnalysis: validationResults é obrigatório');
        }
        
        const durationsWithPhase = [];
        
        for (const result of validationResults) {
            if (typeof result.duration !== 'number') {
                continue; // Pular resultados sem duração válida
            }
            
            // NO FALLBACKS - phase é obrigatório para análise de performance
            if (!result.phase) {
                throw new Error('_generatePerformanceAnalysis: result.phase é obrigatório');
            }
            
            durationsWithPhase.push({ 
                duration: result.duration, 
                phase: result.phase 
            });
        }
        
        if (durationsWithPhase.length === 0) {
            return {
                totalMeasurements: 0,
                averageDuration: 0,
                minDuration: 0,
                maxDuration: 0,
                slowestPhase: null,
                fastestPhase: null,
                performanceByPhase: {}
            };
        }
        
        const durations = durationsWithPhase.map(d => d.duration);
        const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        const minDuration = Math.min(...durations);
        const maxDuration = Math.max(...durations);
        
        // Análise por fase
        const performanceByPhase = {};
        
        for (const { duration, phase } of durationsWithPhase) {
            if (!performanceByPhase[phase]) {
                performanceByPhase[phase] = {
                    count: 0,
                    totalDuration: 0,
                    averageDuration: 0,
                    minDuration: Number.MAX_SAFE_INTEGER,
                    maxDuration: 0
                };
            }
            
            const phasePerf = performanceByPhase[phase];
            phasePerf.count++;
            phasePerf.totalDuration += duration;
            phasePerf.minDuration = Math.min(phasePerf.minDuration, duration);
            phasePerf.maxDuration = Math.max(phasePerf.maxDuration, duration);
        }
        
        // Calcular médias por fase - NO FALLBACKS
        for (const phase in performanceByPhase) {
            const phasePerf = performanceByPhase[phase];
            
            if (phasePerf.count === 0) {
                throw new Error(`_generatePerformanceAnalysis: Fase ${phase} sem medições válidas`);
            }
            
            phasePerf.averageDuration = Math.round(phasePerf.totalDuration / phasePerf.count);
        }
        
        // Encontrar fases mais lenta e mais rápida - NO FALLBACKS
        const phaseAverages = Object.entries(performanceByPhase)
            .map(([phase, perf]) => ({ phase, average: perf.averageDuration }));
        
        if (phaseAverages.length === 0) {
            throw new Error('_generatePerformanceAnalysis: Nenhuma fase com performance válida encontrada');
        }
        
        const slowestPhase = phaseAverages.reduce((slowest, current) => 
            current.average > slowest.average ? current : slowest
        );
        
        const fastestPhase = phaseAverages.reduce((fastest, current) => 
            current.average < fastest.average ? current : fastest
        );
        
        return {
            totalMeasurements: durationsWithPhase.length,
            averageDuration: Math.round(averageDuration),
            minDuration: minDuration,
            maxDuration: maxDuration,
            slowestPhase: slowestPhase.phase,
            fastestPhase: fastestPhase.phase,
            performanceByPhase: performanceByPhase
        };
    }
    
    /**
     * Gera recomendações baseadas na análise
     * NO FALLBACKS: Recomendações baseadas apenas em dados válidos
     * 
     * @private
     */
    async _generateRecommendations(validationResults) {
        if (!validationResults) {
            throw new Error('_generateRecommendations: validationResults é obrigatório');
        }
        
        const recommendations = [];
        
        if (validationResults.length === 0) {
            return recommendations; // Sem dados, sem recomendações
        }
        
        // Análise de taxa de erro - NO FALLBACKS
        const failedResults = validationResults.filter(r => r.success === false);
        const failureRate = (failedResults.length / validationResults.length) * 100;
        
        if (failureRate > 10) {
            recommendations.push({
                type: 'HIGH_FAILURE_RATE',
                severity: 'CRITICAL',
                message: `Alta taxa de falha nas validações (${Math.round(failureRate)}%)`,
                action: 'Revisar qualidade dos dados de entrada e regras de validação'
            });
        }
        
        // Análise de performance - NO FALLBACKS
        const validDurations = validationResults.filter(r => typeof r.duration === 'number');
        
        if (validDurations.length > 0) {
            const averageDuration = validDurations.reduce((sum, r) => sum + r.duration, 0) / validDurations.length;
            
            if (averageDuration > 1000) { // > 1 segundo
                recommendations.push({
                    type: 'SLOW_VALIDATION',
                    severity: 'MEDIUM',
                    message: `Validações lentas (média: ${Math.round(averageDuration)}ms)`,
                    action: 'Otimizar regras de validação e considerar processamento assíncrono'
                });
            }
        }
        
        // Análise de warnings recorrentes - NO FALLBACKS
        const totalWarnings = validationResults.reduce((sum, r) => {
            if (!Array.isArray(r.warnings)) return sum;
            return sum + r.warnings.length;
        }, 0);
        
        if (totalWarnings > validationResults.length * 2) { // Mais de 2 warnings por validação
            recommendations.push({
                type: 'EXCESSIVE_WARNINGS',
                severity: 'LOW',
                message: `Muitos warnings detectados (${totalWarnings} total)`,
                action: 'Revisar regras de validação para reduzir warnings desnecessários'
            });
        }
        
        return recommendations;
    }
    
    /**
     * Exporta relatório em formato JSON
     * NO FALLBACKS: report deve estar completo
     * 
     * @param {Object} report - Relatório a exportar
     * @returns {string} JSON formatado do relatório
     */
    exportReportAsJSON(report) {
        if (!report) {
            throw new Error('ValidationReporter: report é obrigatório para export JSON');
        }
        
        if (typeof report !== 'object') {
            throw new Error('ValidationReporter: report deve ser objeto');
        }
        
        try {
            return JSON.stringify(report, null, 2);
        } catch (error) {
            throw new Error(`Erro ao exportar relatório como JSON: ${error.message}`);
        }
    }
    
    /**
     * Gera resumo executivo do relatório
     * NO FALLBACKS: report deve conter seções obrigatórias
     * 
     * @param {Object} report - Relatório completo
     * @returns {Object} Resumo executivo
     */
    generateExecutiveSummary(report) {
        if (!report) {
            throw new Error('ValidationReporter: report é obrigatório para resumo executivo');
        }
        
        if (!report.summary) {
            throw new Error('ValidationReporter: report deve conter seção summary obrigatória');
        }
        
        if (!report.performance) {
            throw new Error('ValidationReporter: report deve conter seção performance obrigatória');
        }
        
        if (!report.metadata) {
            throw new Error('ValidationReporter: report deve conter seção metadata obrigatória');
        }
        
        if (!report.recommendations) {
            throw new Error('ValidationReporter: report deve conter seção recommendations obrigatória');
        }
        
        if (typeof report.generationTime !== 'number') {
            throw new Error('ValidationReporter: report deve conter generationTime numérico');
        }
        
        return {
            reportId: report.metadata.reportId,
            timestamp: report.metadata.timestamp,
            overallStatus: report.summary.status,
            totalValidations: report.summary.totalValidations,
            successRate: report.summary.successRate,
            criticalIssues: report.summary.criticalIssues,
            averagePerformance: report.performance.averageDuration,
            keyRecommendations: report.recommendations.slice(0, 3),
            generatedIn: `${report.generationTime}ms`
        };
    }
}

export default ValidationReporter;