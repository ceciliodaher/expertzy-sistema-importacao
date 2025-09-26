/**
 * Teste E2E - Validação da Arquitetura do Sistema
 * Valida apenas que o sistema carrega sem erros críticos de arquitetura
 */

import { test, expect } from '@playwright/test';

test.describe('Sistema Expertzy - Validação de Arquitetura', () => {
  
  test.beforeEach(async ({ page }) => {
    // Interceptar erros de console críticos
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Apenas falhar em erros de arquitetura críticos
        if (text.includes('is not a constructor') || 
            text.includes('is not a function') ||
            text.includes('Cannot import') ||
            text.includes('Dexie is not defined') ||
            text.includes('IndexedDBManager não está disponível')) {
          console.error('❌ ERRO CRÍTICO DE ARQUITETURA:', text);
          throw new Error(`Erro crítico de arquitetura: ${text}`);
        }
      }
    });
    
    // Navegar para a home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('1. Validação Arquitetura - Home Page', async ({ page }) => {
    console.log('🏗️ Validando arquitetura da Home Page...');
    
    // Verificar que a página carregou
    await expect(page.locator('body')).toBeVisible();
    
    // Verificar elementos de navegação
    await expect(page.locator('nav')).toBeVisible();
    
    console.log('✅ Home Page: Arquitetura válida');
  });

  test('2. Validação Arquitetura - Dashboard', async ({ page }) => {
    console.log('🏗️ Validando arquitetura do Dashboard...');
    
    await page.click('a[href="dashboard.html"]');
    await page.waitForLoadState('networkidle');
    
    // Aguardar um tempo para inicializações
    await page.waitForTimeout(3000);
    
    // Verificar que a página carregou
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    console.log('✅ Dashboard: Arquitetura válida');
  });

  test('3. Validação Arquitetura - DI Processing', async ({ page }) => {
    console.log('🏗️ Validando arquitetura do DI Processing...');
    
    await page.click('a[href="di-interface.html"]');
    await page.waitForLoadState('networkidle');
    
    // Aguardar inicializações
    await page.waitForTimeout(3000);
    
    // Verificar que a página carregou
    await expect(page.locator('h1')).toContainText('Processamento');
    
    console.log('✅ DI Processing: Arquitetura válida');
  });

  test('4. Validação Arquitetura - Precificação', async ({ page }) => {
    console.log('🏗️ Validando arquitetura da Precificação...');
    
    await page.click('a[href="pricing-interface.html"]');
    await page.waitForLoadState('networkidle');
    
    // Aguardar inicializações
    await page.waitForTimeout(3000);
    
    // Verificar que a página carregou
    await expect(page.locator('h1')).toContainText('Precificação');
    
    console.log('✅ Precificação: Arquitetura válida');
  });

  test('5. Validação Arquitetura - Item Pricing', async ({ page }) => {
    console.log('🏗️ Validando arquitetura do Item Pricing...');
    
    await page.click('a[href="item-pricing.html"]');
    await page.waitForLoadState('networkidle');
    
    // Aguardar inicializações
    await page.waitForTimeout(3000);
    
    // Verificar que a página carregou
    await expect(page.locator('h1')).toContainText('Individual');
    
    console.log('✅ Item Pricing: Arquitetura válida');
  });

  test('6. Validação ES6 Modules - Import/Export', async ({ page }) => {
    console.log('🏗️ Validando imports ES6...');
    
    const moduleErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('Failed to load module') ||
            text.includes('Cannot resolve module') ||
            text.includes('Unexpected token')) {
          moduleErrors.push(text);
        }
      }
    });
    
    // Testar todos os módulos
    const pages = [
      '/dashboard.html',
      '/di-interface.html', 
      '/pricing-interface.html',
      '/item-pricing.html'
    ];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
    
    // Verificar se houve erros de módulo
    if (moduleErrors.length > 0) {
      throw new Error(`Erros de ES6 modules: ${moduleErrors.join(', ')}`);
    }
    
    console.log('✅ ES6 Modules: Todos funcionando corretamente');
  });

  test('7. Validação Singleton IndexedDBManager', async ({ page }) => {
    console.log('🏗️ Validando singleton IndexedDBManager...');
    
    const singletonErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('IndexedDBManager') && 
            (text.includes('constructor') || text.includes('initialize'))) {
          singletonErrors.push(text);
        }
      }
    });
    
    // Testar inicialização em diferentes módulos
    await page.goto('/di-interface.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    await page.goto('/dashboard.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Verificar se houve erros de singleton
    if (singletonErrors.length > 0) {
      throw new Error(`Erros de singleton: ${singletonErrors.join(', ')}`);
    }
    
    console.log('✅ Singleton IndexedDBManager: Funcionando corretamente');
  });

});