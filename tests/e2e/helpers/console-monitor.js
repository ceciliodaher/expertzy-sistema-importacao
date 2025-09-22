/**
 * Console Monitor - Helper para captura e validação de logs
 * Sistema Expertzy - Fase 1 Foundation
 */

class ConsoleMonitor {
    constructor(page) {
        this.page = page;
        this.logs = {
            errors: [],
            warnings: [],
            info: [],
            debug: []
        };
        this.setupConsoleCapture();
    }

    setupConsoleCapture() {
        this.page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            const timestamp = new Date().toISOString();

            const logEntry = {
                type,
                text,
                timestamp,
                location: msg.location()
            };

            // Categorizar logs
            if (type === 'error') {
                this.logs.errors.push(logEntry);
            } else if (type === 'warning') {
                this.logs.warnings.push(logEntry);
            } else if (type === 'info') {
                this.logs.info.push(logEntry);
            } else if (type === 'debug' || type === 'log') {
                this.logs.debug.push(logEntry);
            }
        });

        // Capturar erros não tratados
        this.page.on('pageerror', error => {
            this.logs.errors.push({
                type: 'pageerror',
                text: error.message,
                timestamp: new Date().toISOString(),
                stack: error.stack
            });
        });

        // Capturar falhas de request
        this.page.on('requestfailed', request => {
            this.logs.errors.push({
                type: 'requestfailed',
                text: `Failed to load: ${request.url()}`,
                timestamp: new Date().toISOString(),
                failure: request.failure()?.errorText
            });
        });
    }

    /**
     * Validar se há logs limpos conforme padrões Expertzy
     */
    validateCleanLogs() {
        const issues = [];

        // Erros críticos que NUNCA devem aparecer
        const criticalErrors = [
            'DataMigration',
            'Cannot read properties of null',
            'Cannot read properties of undefined',
            'is not a function',
            'is not defined',
            'ReferenceError',
            'TypeError',
            'SyntaxError'
        ];

        this.logs.errors.forEach(error => {
            criticalErrors.forEach(pattern => {
                if (error.text.includes(pattern)) {
                    issues.push({
                        type: 'CRITICAL_ERROR',
                        pattern,
                        log: error
                    });
                }
            });
        });

        // Warnings que indicam problemas
        const suspiciousWarnings = [
            'deprecated',
            'fallback',
            'default value',
            'assuming',
            'not found, using'
        ];

        this.logs.warnings.forEach(warning => {
            suspiciousWarnings.forEach(pattern => {
                if (warning.text.includes(pattern)) {
                    issues.push({
                        type: 'SUSPICIOUS_WARNING',
                        pattern,
                        log: warning
                    });
                }
            });
        });

        return {
            isClean: issues.length === 0,
            issues,
            summary: {
                totalErrors: this.logs.errors.length,
                totalWarnings: this.logs.warnings.length,
                totalInfo: this.logs.info.length,
                criticalIssues: issues.filter(i => i.type === 'CRITICAL_ERROR').length,
                suspiciousWarnings: issues.filter(i => i.type === 'SUSPICIOUS_WARNING').length
            }
        };
    }

    /**
     * Buscar logs específicos
     */
    findLogsByPattern(pattern, type = 'all') {
        const allLogs = [];
        
        if (type === 'all' || type === 'error') {
            allLogs.push(...this.logs.errors);
        }
        if (type === 'all' || type === 'warning') {
            allLogs.push(...this.logs.warnings);
        }
        if (type === 'all' || type === 'info') {
            allLogs.push(...this.logs.info);
        }
        if (type === 'all' || type === 'debug') {
            allLogs.push(...this.logs.debug);
        }

        return allLogs.filter(log => 
            log.text.toLowerCase().includes(pattern.toLowerCase())
        );
    }

    /**
     * Aguardar por log específico
     */
    async waitForLog(pattern, timeout = 5000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const found = this.findLogsByPattern(pattern);
            if (found.length > 0) {
                return found[0];
            }
            await this.page.waitForTimeout(100);
        }
        
        throw new Error(`Log pattern "${pattern}" not found within ${timeout}ms`);
    }

    /**
     * Exportar logs para arquivo
     */
    exportLogs() {
        return {
            timestamp: new Date().toISOString(),
            summary: this.validateCleanLogs().summary,
            logs: this.logs
        };
    }

    /**
     * Reset logs para novo teste
     */
    clearLogs() {
        this.logs = {
            errors: [],
            warnings: [],
            info: [],
            debug: []
        };
    }
}

module.exports = { ConsoleMonitor };