/**
 * Teste E2E - Validação de Logs Limpos
 * Sistema Expertzy - Fase 1 Foundation
 * 
 * Foca na validação de que o sistema opera com logs limpos
 * seguindo os padrões rigorosos do sistema Expertzy
 */

import { test, expect } from '@playwright/test';
import { ConsoleMonitor } from '../helpers/console-monitor.js';
import { DIInterfaceHelper } from '../helpers/di-interface-helper.js';

test.describe('Validação de Logs Limpos', () => {
    let consoleMonitor;
    let diHelper;

    test.beforeEach(async ({ page }) => {
        consoleMonitor = new ConsoleMonitor(page);
        diHelper = new DIInterfaceHelper(page);
    });

    test('sistema deve inicializar sem erros críticos', async ({ page }) => {
        await test.step('Navegar para interface principal', async () => {
            await diHelper.navigateToInterface();
        });

        await test.step('Validar logs de inicialização', async () => {
            // Aguardar sistema estabilizar
            await page.waitForTimeout(2000);
            
            const logValidation = consoleMonitor.validateCleanLogs();
            
            // Padrões específicos que NUNCA devem aparecer
            const criticalPatterns = [
                'DataMigration execution failed',
                'DataMigration is not defined',
                'Cannot read properties of null',
                'Cannot read properties of undefined',
                'ReferenceError',
                'TypeError: Cannot read',
                'SyntaxError',
                'is not a function',
                'is not defined'
            ];

            // Verificar cada padrão crítico
            criticalPatterns.forEach(pattern => {
                const found = consoleMonitor.findLogsByPattern(pattern, 'error');
                if (found.length > 0) {
                    console.error(`Erro crítico encontrado: "${pattern}"`, found);
                }
                expect(found.length).toBe(0);
            });

            // Log de resumo
            console.log('Resumo de logs de inicialização:', logValidation.summary);
            
            // Sistema deve estar limpo
            expect(logValidation.summary.criticalIssues).toBe(0);
        });
    });

    test('deve manter logs limpos durante navegação', async ({ page }) => {
        await diHelper.navigateToInterface();
        
        await test.step('Navegar entre sections da interface', async () => {
            // Limpar logs anteriores
            consoleMonitor.clearLogs();
            
            // Interagir com diferentes elementos da interface
            await page.click('a[href="index.html"]'); // Home
            await page.waitForLoadState('networkidle');
            
            await page.click('a[href="di-interface.html"]'); // Voltar para DI
            await page.waitForLoadState('networkidle');
            
            // Clicar nos steps
            const steps = await page.$$('.process-indicator');
            for (let i = 0; i < Math.min(steps.length, 3); i++) {
                try {
                    await steps[i].click();
                    await page.waitForTimeout(500);
                } catch (error) {
                    // Alguns steps podem não ser clicáveis ainda
                }
            }
        });

        await test.step('Validar logs após navegação', async () => {
            const logValidation = consoleMonitor.validateCleanLogs();
            
            // Não deve haver novos erros críticos
            expect(logValidation.summary.criticalIssues).toBe(0);
            
            // Verificar especificamente por logs de fallback
            const fallbackLogs = consoleMonitor.findLogsByPattern('fallback');
            const defaultLogs = consoleMonitor.findLogsByPattern('using default');
            const assumingLogs = consoleMonitor.findLogsByPattern('assuming');
            
            expect(fallbackLogs.length).toBe(0);
            expect(defaultLogs.length).toBe(0);
            expect(assumingLogs.length).toBe(0);
        });
    });

    test('deve manter logs limpos durante operações de arquivo', async ({ page }) => {
        await diHelper.navigateToInterface();
        
        await test.step('Simular operações com file input', async () => {
            consoleMonitor.clearLogs();
            
            // Interagir com input de arquivo (sem fazer upload real)
            await page.click('#xmlFile');
            await page.waitForTimeout(500);
            
            // Clicar no botão de upload (deve ficar disabled)
            try {
                await page.click('#uploadButton');
            } catch (error) {
                // Esperado estar disabled
            }
            
            await page.waitForTimeout(1000);
        });

        await test.step('Validar logs após operações de arquivo', async () => {
            const logValidation = consoleMonitor.validateCleanLogs();
            
            // Não deve haver erros relacionados a arquivos
            const fileErrors = consoleMonitor.findLogsByPattern('file', 'error');
            const uploadErrors = consoleMonitor.findLogsByPattern('upload', 'error');
            
            expect(fileErrors.length).toBe(0);
            expect(uploadErrors.length).toBe(0);
            expect(logValidation.summary.criticalIssues).toBe(0);
        });
    });

    test('deve validar ausência de logs DataMigration', async ({ page }) => {
        await test.step('Verificar ausência completa de DataMigration', async () => {
            await diHelper.navigateToInterface();
            
            // Aguardar sistema completamente carregado
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(3000);
            
            // Buscar qualquer menção a DataMigration
            const dataMigrationLogs = consoleMonitor.findLogsByPattern('DataMigration');
            
            // NÃO deve haver nenhum log relacionado a DataMigration
            expect(dataMigrationLogs.length).toBe(0);
            
            // Verificar especificamente por mensagens de erro de migração
            const migrationErrors = [
                'migration failed',
                'migration error',
                'DataMigration.execute',
                'migration not found',
                'migration undefined'
            ];
            
            migrationErrors.forEach(pattern => {
                const found = consoleMonitor.findLogsByPattern(pattern);
                expect(found.length).toBe(0);
            });
        });
    });

    test('deve validar configurações carregadas corretamente', async ({ page }) => {
        await diHelper.navigateToInterface();
        
        await test.step('Verificar carregamento de configurações', async () => {
            // Aguardar carregamento completo
            await page.waitForLoadState('networkidle');
            
            // Verificar se window.icmsConfig foi carregado
            const icmsConfigLoaded = await page.evaluate(() => {
                return typeof window.icmsConfig !== 'undefined' && window.icmsConfig !== null;
            });
            
            expect(icmsConfigLoaded).toBe(true);
            
            // Verificar se ConfigLoader funcionou
            const configLoaderLogs = consoleMonitor.findLogsByPattern('ConfigLoader');
            
            // Não deve haver erros do ConfigLoader
            const configErrors = configLoaderLogs.filter(log => log.type === 'error');
            expect(configErrors.length).toBe(0);
        });

        await test.step('Validar estrutura de configurações', async () => {
            // Verificar estrutura básica das configurações
            const configStructure = await page.evaluate(() => {
                const config = window.icmsConfig;
                return {
                    hasAliquotaPadrao: !!config?.aliquotaPadrao,
                    hasNcmConfigs: !!config?.ncmConfigs,
                    hasEstados: !!config?.aliquotaPadrao && Object.keys(config.aliquotaPadrao).length > 0
                };
            });
            
            expect(configStructure.hasAliquotaPadrao).toBe(true);
            expect(configStructure.hasEstados).toBe(true);
            
            // Não deve haver logs de configuração ausente
            const configMissingLogs = consoleMonitor.findLogsByPattern('config not found', 'error');
            expect(configMissingLogs.length).toBe(0);
        });
    });

    test('deve detectar vazamentos de memória em logs', async ({ page }) => {
        await test.step('Monitorar logs por indicadores de vazamento', async () => {
            await diHelper.navigateToInterface();
            
            // Aguardar carregamento e estabilização
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            
            // Buscar indicadores de problemas de memória
            const memoryWarnings = [
                'memory leak',
                'excessive listeners',
                'not cleaned up',
                'circular reference',
                'detached DOM',
                'retained objects'
            ];
            
            memoryWarnings.forEach(pattern => {
                const found = consoleMonitor.findLogsByPattern(pattern, 'warning');
                expect(found.length).toBe(0);
            });
        });
    });

    test.afterEach(async ({ page }) => {
        // Sempre exportar relatório de logs para análise
        const logReport = consoleMonitor.exportLogs();
        
        if (test.info().status === 'failed') {
            console.log('=== RELATÓRIO DETALHADO DE LOGS ===');
            console.log(JSON.stringify(logReport, null, 2));
        } else {
            // Mesmo em sucessos, mostrar resumo
            console.log('Resumo de logs:', logReport.summary);
        }
    });
});