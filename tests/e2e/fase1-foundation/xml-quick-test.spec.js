/**
 * Teste E2E Rápido - Upload XML Real
 * Sistema Expertzy - Validação básica funcional
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { ConsoleMonitor } from '../helpers/console-monitor.js';

test.describe('Teste Rápido XML Real', () => {
    let consoleMonitor;
    let xmlFilePath;

    test.beforeEach(async ({ page }) => {
        consoleMonitor = new ConsoleMonitor(page);
        xmlFilePath = path.join(__dirname, '../fixtures/real-xml/2518173187.xml');
        
        // Navegar para interface
        await page.goto('/di-interface.html');
        await page.waitForLoadState('networkidle');
    });

    test('deve fazer upload do XML sem erros críticos', async ({ page }) => {
        // Aguardar inicialização do sistema
        await page.waitForFunction(() => window.diProcessor && window.dbManager, { timeout: 15000 });
        
        // Fazer upload do arquivo
        await page.setInputFiles('#xmlFile', xmlFilePath);
        
        // Aguardar botão de processamento estar habilitado
        await page.waitForSelector('#processarBtn:not([disabled])', { timeout: 10000 });
        
        // Clicar para processar
        await page.click('#processarBtn');
        
        // Aguardar processamento (máximo 30 segundos)
        await page.waitForFunction(() => {
            const step2 = document.querySelector('#step2');
            return step2 && !step2.classList.contains('hidden');
        }, { timeout: 30000 });
        
        // Verificar se passou para step 2
        const step2Visible = await page.isVisible('#step2');
        expect(step2Visible).toBe(true);
        
        // Validar logs limpos
        const logValidation = consoleMonitor.validateCleanLogs();
        
        // Não deve haver erros críticos
        expect(logValidation.summary.criticalIssues).toBe(0);
        
        console.log('✅ Upload e processamento XML realizado com sucesso');
        console.log('Resumo logs:', logValidation.summary);
    });

    test('deve inicializar sistema corretamente', async ({ page }) => {
        // Aguardar inicialização
        await page.waitForFunction(() => {
            return window.diProcessor && 
                   window.complianceCalculator && 
                   window.dbManager &&
                   window.exportManager;
        }, { timeout: 15000 });
        
        // Verificar que elementos da interface estão presentes
        await expect(page.locator('#step1')).toBeVisible();
        await expect(page.locator('#xmlFile')).toBeVisible();
        await expect(page.locator('#processarBtn')).toBeVisible();
        
        // Verificar logs de inicialização
        const logValidation = consoleMonitor.validateCleanLogs();
        
        // Sistema deve inicializar sem erros críticos
        expect(logValidation.summary.criticalIssues).toBe(0);
        
        console.log('✅ Sistema inicializado corretamente');
    });

    test.afterEach(async ({ page }) => {
        if (test.info().status === 'failed') {
            const logs = consoleMonitor.exportLogs();
            console.log('=== LOGS DE FALHA ===');
            console.log(JSON.stringify(logs.summary, null, 2));
        }
    });
});