/**
 * Logger - Sistema estruturado de logging
 * Conforme especificado no CLAUDE.md
 * 
 * REGRAS APLICADAS:
 * - Logs limpos em operação normal (apenas INFO/DEBUG)
 * - Logs de erro apenas para problemas reais
 * - Auditoria obrigatória para operações críticas
 * - Estrutura padronizada para facilitar análise
 */

// IndexedDBManager será importado dinamicamente para evitar dependência circular

class Logger {
    constructor() {
        this.levels = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3
        };
        
        this.currentLevel = this.levels.INFO; // Nível padrão
        this.auditEnabled = true;
    }

    /**
     * Log de informação - operação normal
     * @param {string} module - Módulo que está logando
     * @param {string} operation - Operação sendo executada
     * @param {Object} details - Detalhes da operação
     */
    static info(module, operation, details = {}) {
        const instance = Logger.getInstance();
        
        if (instance.currentLevel <= instance.levels.INFO) {
            const logEntry = instance.createLogEntry('INFO', module, operation, details);
            console.log(`[${logEntry.timestamp}] INFO [${module}] ${operation}:`, logEntry.details);
        }
    }

    /**
     * Log de debug - informações detalhadas para desenvolvimento
     * @param {string} module - Módulo que está logando
     * @param {string} operation - Operação sendo executada
     * @param {Object} details - Detalhes da operação
     */
    static debug(module, operation, details = {}) {
        const instance = Logger.getInstance();
        
        if (instance.currentLevel <= instance.levels.DEBUG) {
            const logEntry = instance.createLogEntry('DEBUG', module, operation, details);
            console.debug(`[${logEntry.timestamp}] DEBUG [${module}] ${operation}:`, logEntry.details);
        }
    }

    /**
     * Log de warning - situações que merecem atenção mas não são erros
     * @param {string} module - Módulo que está logando
     * @param {string} operation - Operação sendo executada
     * @param {string} warning - Mensagem de warning
     * @param {Object} context - Contexto adicional
     */
    static warn(module, operation, warning, context = {}) {
        const instance = Logger.getInstance();
        
        if (instance.currentLevel <= instance.levels.WARN) {
            const logEntry = instance.createLogEntry('WARN', module, operation, {
                warning: warning,
                context: context
            });
            console.warn(`[${logEntry.timestamp}] WARN [${module}] ${operation}:`, logEntry.details);
        }

        // Warnings também vão para auditoria
        if (instance.auditEnabled) {
            instance.saveToAudit(module, operation, null, { warning, context }, 'WARNING');
        }
    }

    /**
     * Log de erro - apenas para problemas reais
     * @param {string} module - Módulo que está logando
     * @param {string} operation - Operação sendo executada
     * @param {Error} error - Erro ocorrido
     * @param {Object} context - Contexto adicional
     */
    static error(module, operation, error, context = {}) {
        const instance = Logger.getInstance();
        
        const logEntry = instance.createLogEntry('ERROR', module, operation, {
            error: error.message,
            stack: error.stack,
            context: context
        });

        console.error(`[${logEntry.timestamp}] ERROR [${module}] ${operation}:`, logEntry.details);

        // Erros sempre vão para auditoria
        if (instance.auditEnabled) {
            instance.saveToAudit(module, operation, error, context, 'ERROR');
        }
    }

    /**
     * Log de operação crítica - para auditoria obrigatória
     * @param {string} module - Módulo que está logando
     * @param {string} operation - Operação crítica
     * @param {Object} data - Dados da operação
     * @param {Object} resultado - Resultado da operação
     */
    static critical(module, operation, data, resultado) {
        const instance = Logger.getInstance();
        
        const logEntry = instance.createLogEntry('CRITICAL', module, operation, {
            operation_data: data,
            result: resultado,
            user_session: instance.getCurrentSession(),
            verification_token: instance.generateVerificationToken()
        });

        console.log(`[${logEntry.timestamp}] CRITICAL [${module}] ${operation}:`, logEntry.details);

        // Operações críticas sempre vão para auditoria
        if (instance.auditEnabled) {
            instance.saveToAudit(module, operation, null, { data, resultado }, 'CRITICAL');
        }
    }

    /**
     * Log de performance - métricas de tempo
     * @param {string} module - Módulo que está logando
     * @param {string} operation - Operação medida
     * @param {number} startTime - Timestamp de início
     * @param {number} endTime - Timestamp de fim
     * @param {Object} metrics - Métricas adicionais
     */
    static performance(module, operation, startTime, endTime, metrics = {}) {
        const duration = endTime - startTime;
        const instance = Logger.getInstance();

        const performanceData = {
            duration_ms: duration,
            start_time: startTime,
            end_time: endTime,
            ...metrics
        };

        Logger.info(module, `${operation}_performance`, performanceData);

        // Log performance crítica (> 10 segundos) como warning
        if (duration > 10000) {
            Logger.warn(module, operation, `Operação lenta detectada: ${duration}ms`, performanceData);
        }
    }

    /**
     * Cria entrada de log estruturada
     * @param {string} level - Nível do log
     * @param {string} module - Módulo
     * @param {string} operation - Operação
     * @param {Object} details - Detalhes
     * @returns {Object} Entrada de log estruturada
     */
    createLogEntry(level, module, operation, details) {
        return {
            timestamp: new Date().toISOString(),
            level: level,
            module: module,
            operation: operation,
            details: details,
            session_id: this.getCurrentSession(),
            user_agent: navigator?.userAgent || 'unknown'
        };
    }

    /**
     * Salva log na auditoria (IndexedDB)
     * @param {string} module - Módulo
     * @param {string} operation - Operação
     * @param {Error|null} error - Erro (se aplicável)
     * @param {Object} context - Contexto
     * @param {string} resultado - Resultado da operação
     */
    async saveToAudit(module, operation, error, context, resultado) {
        try {
            // Por enquanto, apenas loga no console
            // IndexedDB será implementado posteriormente para evitar dependência circular
            console.info(`[AUDIT] ${module}.${operation}:`, {
                error: error?.message,
                context,
                resultado,
                timestamp: new Date().toISOString()
            });

        } catch (auditError) {
            console.error('[Logger] Erro ao salvar auditoria:', auditError.message);
        }
    }

    /**
     * Obtém ID da sessão atual
     * @returns {string} ID da sessão
     */
    getCurrentSession() {
        if (!this.sessionId) {
            this.sessionId = this.generateSessionId();
        }
        return this.sessionId;
    }

    /**
     * Gera ID único para a sessão
     * @returns {string} ID da sessão
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Gera token de verificação para operações críticas
     * @returns {string} Token de verificação
     */
    generateVerificationToken() {
        return `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Define nível de log
     * @param {string} level - Nível (DEBUG, INFO, WARN, ERROR)
     */
    static setLevel(level) {
        const instance = Logger.getInstance();
        const upperLevel = level.toUpperCase();
        
        if (instance.levels[upperLevel] !== undefined) {
            instance.currentLevel = instance.levels[upperLevel];
            Logger.info('Logger', 'setLevel', { new_level: upperLevel });
        } else {
            throw new Error(`Nível de log inválido: ${level}`);
        }
    }

    /**
     * Habilita/desabilita auditoria
     * @param {boolean} enabled - Se auditoria está habilitada
     */
    static setAuditEnabled(enabled) {
        const instance = Logger.getInstance();
        instance.auditEnabled = enabled;
        Logger.info('Logger', 'setAuditEnabled', { audit_enabled: enabled });
    }

    /**
     * Busca logs de auditoria
     * @param {Object} filters - Filtros de busca
     * @returns {Promise<Array>} Lista de logs
     */
    static async getAuditLogs(filters = {}) {
        // Implementação simplificada - retorna array vazio
        // IndexedDB será implementado posteriormente
        console.info('[Logger] getAuditLogs chamado com filtros:', filters);
        return [];
    }

    /**
     * Limpa logs antigos de auditoria
     * @param {number} daysToKeep - Dias para manter
     * @returns {Promise<number>} Quantidade de logs removidos
     */
    static async cleanOldAuditLogs(daysToKeep = 30) {
        // Implementação simplificada
        console.info(`[Logger] Limpeza de logs solicitada (${daysToKeep} dias)`);
        return 0;
    }

    /**
     * Exporta logs para análise
     * @param {Object} filters - Filtros de busca
     * @returns {Promise<string>} Logs em formato JSON
     */
    static async exportLogs(filters = {}) {
        try {
            const logs = await Logger.getAuditLogs(filters);
            
            const exportData = {
                export_date: new Date().toISOString(),
                filters_applied: filters,
                total_logs: logs.length,
                logs: logs
            };

            Logger.info('Logger', 'exportLogs', {
                total_exported: logs.length,
                filters: filters
            });

            return JSON.stringify(exportData, null, 2);

        } catch (error) {
            Logger.error('Logger', 'exportLogs', error, { filters });
            throw error;
        }
    }

    /**
     * Singleton pattern
     * @returns {Logger} Instância única do Logger
     */
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
}

// Helper functions para medição de performance
Logger.time = function(module, operation) {
    const key = `${module}_${operation}`;
    Logger.timers = Logger.timers || {};
    Logger.timers[key] = performance.now();
};

Logger.timeEnd = function(module, operation, metrics = {}) {
    const key = `${module}_${operation}`;
    Logger.timers = Logger.timers || {};
    
    if (Logger.timers[key]) {
        const endTime = performance.now();
        const startTime = Logger.timers[key];
        delete Logger.timers[key];
        
        Logger.performance(module, operation, startTime, endTime, metrics);
        return endTime - startTime;
    } else {
        Logger.warn('Logger', 'timeEnd', `Timer não encontrado para ${key}`);
        return 0;
    }
};

export { Logger };