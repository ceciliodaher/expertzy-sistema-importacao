/**
 * Teste E2E - Inicialização do Sistema
 * Sistema Expertzy - Fase 1 Foundation
 * 
 * Valida inicialização correta do sistema, carregamento de módulos
 * e disponibilidade de funcionalidades essenciais
 */

import { test, expect } from '@playwright/test';
import { ConsoleMonitor } from '../helpers/console-monitor.js';
import { DIInterfaceHelper } from '../helpers/di-interface-helper.js';

test.describe('Inicialização do Sistema', () => {
    let consoleMonitor;
    let diHelper;

    test.beforeEach(async ({ page }) => {
        consoleMonitor = new ConsoleMonitor(page);
        diHelper = new DIInterfaceHelper(page);
    });

    test('deve carregar página principal corretamente', async ({ page }) => {
        await test.step('Verificar carregamento da landing page', async () => {
            await page.goto('/');
            await page.waitForLoadState('networkidle');
            
            // Verificar elementos essenciais da landing
            await expect(page.locator('.expertzy-navbar')).toBeVisible();
            await expect(page.locator('h1')).toContainText('Sistema Expertzy');
            
            // Verificar links funcionais - usar primeiro link específico
            const diLink = page.locator('a[href*="di-interface"]').first();
            await expect(diLink).toBeVisible();
        });

        await test.step('Validar navegação para interface DI', async () => {
            await page.click('a[href*="di-interface"]', { force: true });
            await page.waitForLoadState('networkidle');
            
            // Verificar URL correta
            expect(page.url()).toContain('di-interface.html');
            
            // Verificar elementos da interface carregados
            await expect(page.locator('.process-indicator')).toHaveCount(4);
            await expect(page.locator('#step1')).toBeVisible();
        });
    });

    test('deve carregar módulos JavaScript essenciais', async ({ page }) => {
        await diHelper.navigateToInterface();
        
        await test.step('Verificar disponibilidade de módulos principais', async () => {
            // Aguardar carregamento completo e inicialização do sistema
            await page.waitForLoadState('networkidle');
            
            // Aguardar log de sistema inicializado
            await page.waitForFunction(() => {
                return window.diProcessor && window.complianceCalculator && window.dbManager;
            }, { timeout: 15000 });
            
            // Verificar instâncias dos módulos principais
            const moduleStatus = await page.evaluate(() => {
                return {
                    // Instâncias criadas pelo sistema
                    hasDBManager: typeof window.dbManager !== 'undefined',
                    hasDIProcessor: typeof window.diProcessor !== 'undefined',
                    hasComplianceCalculator: typeof window.complianceCalculator !== 'undefined',
                    hasExportManager: typeof window.exportManager !== 'undefined',
                    hasItemCalculator: typeof window.ItemCalculator !== 'undefined',
                    
                    // Classes disponíveis
                    hasIndexedDBClass: typeof window.IndexedDBManager !== 'undefined'
                };
            });
            
            // Verificar instâncias essenciais estão disponíveis
            expect(moduleStatus.hasDBManager).toBe(true);
            expect(moduleStatus.hasDIProcessor).toBe(true);
            expect(moduleStatus.hasComplianceCalculator).toBe(true);
            expect(moduleStatus.hasExportManager).toBe(true);
            expect(moduleStatus.hasItemCalculator).toBe(true);
        });

        await test.step('Verificar inicialização dos módulos', async () => {
            // Verificar se não há erros de inicialização
            const logValidation = consoleMonitor.validateCleanLogs();
            
            // Buscar por erros específicos de módulo
            const moduleErrors = [
                'module not found',
                'failed to load',
                'initialization failed',
                'constructor error',
                'import error'
            ];
            
            moduleErrors.forEach(pattern => {
                const found = consoleMonitor.findLogsByPattern(pattern, 'error');
                expect(found.length).toBe(0);
            });
            
            expect(logValidation.summary.criticalIssues).toBe(0);
        });
    });

    test('deve inicializar IndexedDB corretamente', async ({ page }) => {
        await diHelper.navigateToInterface();
        
        await test.step('Verificar disponibilidade do IndexedDB', async () => {
            // Aguardar inicialização completa primeiro
            await page.waitForFunction(() => window.dbManager, { timeout: 10000 });
            
            const indexedDBStatus = await page.evaluate(async () => {
                try {
                    // Verificar se IndexedDB está disponível no navegador
                    if (!window.indexedDB) {
                        return { available: false, error: 'IndexedDB not supported' };
                    }
                    
                    // Verificar se dbManager foi inicializado
                    if (!window.dbManager) {
                        return { available: true, manager: false, error: 'dbManager not initialized' };
                    }
                    
                    // Verificar se dbManager tem métodos essenciais (nomes corretos)
                    const hasEssentialMethods = typeof window.dbManager.saveDI === 'function' &&
                                               typeof window.dbManager.getDI === 'function';
                    
                    return {
                        available: true,
                        manager: true,
                        initialized: hasEssentialMethods,
                        error: null
                    };
                } catch (error) {
                    return {
                        available: !!window.indexedDB,
                        manager: !!window.dbManager,
                        initialized: false,
                        error: error.message
                    };
                }
            });
            
            expect(indexedDBStatus.available).toBe(true);
            expect(indexedDBStatus.manager).toBe(true);
            expect(indexedDBStatus.initialized).toBe(true);
            
            if (indexedDBStatus.error) {
                console.error('IndexedDB initialization error:', indexedDBStatus.error);
            }
            expect(indexedDBStatus.error).toBeNull();
        });

        await test.step('Verificar ausência de DataMigration', async () => {
            // Aguardar um tempo para possíveis execuções automáticas
            await page.waitForTimeout(3000);
            
            // Verificar que DataMigration NÃO está sendo executada
            const migrationLogs = consoleMonitor.findLogsByPattern('DataMigration');
            expect(migrationLogs.length).toBe(0);
            
            // Verificar especificamente por tentativas de execução
            const executionLogs = consoleMonitor.findLogsByPattern('executing migration');
            expect(executionLogs.length).toBe(0);
        });
    });

    test('deve carregar configurações necessárias', async ({ page }) => {
        await diHelper.navigateToInterface();
        
        await test.step('Verificar carregamento de configurações ICMS', async () => {
            // Aguardar inicialização completa primeiro
            await page.waitForFunction(() => window.complianceCalculator, { timeout: 10000 });
            
            const configStatus = await page.evaluate(() => {
                // window.icmsConfig é criado apenas quando necessário
                // Vamos verificar se o ComplianceCalculator tem acesso às configurações
                const calculator = window.complianceCalculator;
                
                if (!calculator) {
                    return { loaded: false, error: 'ComplianceCalculator not found' };
                }
                
                // Verificar se o calculator tem acesso às configurações de alíquotas
                const hasAliquotasData = !!calculator.aliquotasData;
                
                return {
                    loaded: hasAliquotasData,
                    hasComplianceCalculator: true,
                    hasAliquotasData: hasAliquotasData,
                    // window.icmsConfig pode ou não existir (criado dinamicamente)
                    hasIcmsConfig: typeof window.icmsConfig !== 'undefined',
                    error: null
                };
            });
            
            expect(configStatus.loaded).toBe(true);
            expect(configStatus.hasComplianceCalculator).toBe(true);
            expect(configStatus.hasAliquotasData).toBe(true);
            
            // window.icmsConfig é opcional (criado apenas quando necessário)
            console.log('window.icmsConfig status:', configStatus.hasIcmsConfig);
        });

        await test.step('Verificar configurações de regime tributário', async () => {
            const regimeStatus = await page.evaluate(() => {
                // Verificar se DIProcessor tem configurações carregadas
                const processor = window.diProcessor;
                return {
                    hasDIProcessor: !!processor,
                    hasConfigsLoaded: processor ? processor.configsLoaded : false
                };
            });
            
            expect(regimeStatus.hasDIProcessor).toBe(true);
            expect(regimeStatus.hasConfigsLoaded).toBe(true);
        });
    });

    test('deve validar interface responsiva', async ({ page }) => {
        await diHelper.navigateToInterface();
        
        await test.step('Verificar responsividade em diferentes tamanhos', async () => {
            // Desktop
            await page.setViewportSize({ width: 1200, height: 800 });
            await page.waitForTimeout(500);
            
            const processIndicators = page.locator('.process-indicator');
            await expect(processIndicators).toHaveCount(4);
            await expect(processIndicators.first()).toBeVisible();
            
            // Tablet
            await page.setViewportSize({ width: 768, height: 1024 });
            await page.waitForTimeout(500);
            
            // Mobile
            await page.setViewportSize({ width: 375, height: 667 });
            await page.waitForTimeout(500);
            
            // Verificar que elementos principais ainda estão visíveis
            await expect(page.locator('.expertzy-navbar')).toBeVisible();
            await expect(page.locator('#step1')).toBeVisible();
        });
    });

    test('deve validar performance de carregamento', async ({ page }) => {
        await test.step('Medir tempo de carregamento', async () => {
            const startTime = Date.now();
            
            await diHelper.navigateToInterface();
            
            // Aguardar carregamento completo
            await page.waitForLoadState('networkidle');
            
            const loadTime = Date.now() - startTime;
            
            // Sistema deve carregar em menos de 10 segundos
            expect(loadTime).toBeLessThan(10000);
            
            console.log(`Tempo de carregamento: ${loadTime}ms`);
        });

        await test.step('Verificar recursos carregados', async () => {
            // Aguardar um tempo adicional para recursos assíncronos
            await page.waitForTimeout(2000);
            
            // Verificar se não há recursos que falharam ao carregar
            const logValidation = consoleMonitor.validateCleanLogs();
            
            const loadingErrors = consoleMonitor.findLogsByPattern('failed to load', 'error');
            const networkErrors = consoleMonitor.findLogsByPattern('net::', 'error');
            
            expect(loadingErrors.length).toBe(0);
            expect(networkErrors.length).toBe(0);
        });
    });

    test('deve validar acessibilidade básica', async ({ page }) => {
        await diHelper.navigateToInterface();
        
        await test.step('Verificar elementos acessíveis', async () => {
            // Verificar se botões têm texto ou aria-label
            const buttons = page.locator('button');
            const buttonCount = await buttons.count();
            
            for (let i = 0; i < buttonCount; i++) {
                const button = buttons.nth(i);
                const text = await button.textContent();
                const ariaLabel = await button.getAttribute('aria-label');
                const title = await button.getAttribute('title');
                
                // Botão deve ter pelo menos uma forma de identificação
                const hasIdentification = text?.trim() || ariaLabel || title;
                if (!hasIdentification) {
                    const outerHTML = await button.innerHTML();
                    console.warn('Botão sem identificação:', outerHTML);
                }
            }
        });

        await test.step('Verificar navegação por teclado', async () => {
            // Testar navegação Tab
            await page.keyboard.press('Tab');
            const focusedElement = await page.evaluate(() => document.activeElement.tagName);
            
            // Algum elemento deve estar focado
            expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElement);
        });
    });

    test.afterEach(async ({ page }) => {
        // Capturar métricas de performance
        const metrics = await page.evaluate(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            return navigation ? {
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
                loadComplete: navigation.loadEventEnd - navigation.navigationStart,
                responseTime: navigation.responseEnd - navigation.requestStart
            } : null;
        });
        
        if (metrics) {
            console.log('Métricas de performance:', metrics);
        }
    });
});