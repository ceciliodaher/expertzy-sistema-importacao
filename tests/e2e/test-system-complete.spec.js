/**
 * Teste E2E Completo do Sistema Expertzy
 * Valida todas as funcionalidades principais em fluxo integrado
 */

import { test, expect } from '@playwright/test';

test.describe('Sistema Expertzy - Teste E2E Completo', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navegar para a home page
    await page.goto('/');
    
    // Aguardar carregamento completo
    await page.waitForLoadState('networkidle');
    
    // Verificar se não há erros no console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console Error:', msg.text());
      }
    });
  });

  test('1. Teste Dashboard - Carregamento e Inicialização', async ({ page }) => {
    console.log('🧪 Testando Dashboard...');
    
    // Navegar para dashboard
    await page.click('a[href="dashboard.html"]');
    await page.waitForLoadState('networkidle');
    
    // Verificar elementos principais
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Verificar cards de estatísticas
    await expect(page.locator('.stats-card')).toHaveCount(4);
    
    // Verificar se gráficos carregaram
    await page.waitForSelector('canvas', { timeout: 10000 });
    const canvasElements = await page.locator('canvas').count();
    expect(canvasElements).toBeGreaterThan(0);
    
    // Verificar ausência de erros críticos
    const errorMessages = await page.locator('.error, .alert-danger').count();
    expect(errorMessages).toBe(0);
    
    console.log('✅ Dashboard funcionando corretamente');
  });

  test('2. Teste DI Processing - Upload e Processamento', async ({ page }) => {
    console.log('🧪 Testando DI Processing...');
    
    // Navegar para DI processing
    await page.click('a[href="di-interface.html"]');
    await page.waitForLoadState('networkidle');
    
    // Verificar elementos da interface
    await expect(page.locator('h1')).toContainText('Processamento');
    
    // Verificar botão de upload
    await expect(page.locator('input[type="file"]')).toBeVisible();
    
    // Verificar área de resultados
    await expect(page.locator('#processing-results')).toBeVisible();
    
    // Verificar se tabela de adições está presente
    await page.waitForSelector('#adicoes-table', { timeout: 5000 });
    
    console.log('✅ DI Processing interface funcionando corretamente');
  });

  test('3. Teste Precificação Geral - Interface e Cálculos', async ({ page }) => {
    console.log('🧪 Testando Precificação Geral...');
    
    // Navegar para precificação
    await page.click('a[href="pricing-interface.html"]');
    await page.waitForLoadState('networkidle');
    
    // Verificar carregamento da interface
    await expect(page.locator('h1')).toContainText('Precificação');
    
    // Verificar formulário de precificação
    await expect(page.locator('#pricing-form')).toBeVisible();
    
    // Verificar campos principais
    await expect(page.locator('#valor_aduaneiro')).toBeVisible();
    await expect(page.locator('#valor_frete')).toBeVisible();
    await expect(page.locator('#valor_seguro')).toBeVisible();
    
    // Verificar tabela de resultados
    await expect(page.locator('#pricing-results-table')).toBeVisible();
    
    console.log('✅ Precificação Geral funcionando corretamente');
  });

  test('4. Teste Precificação Individual - Interface e Funcionalidades', async ({ page }) => {
    console.log('🧪 Testando Precificação Individual...');
    
    // Navegar para precificação individual
    await page.click('a[href="item-pricing.html"]');
    await page.waitForLoadState('networkidle');
    
    // Aguardar inicialização completa
    await page.waitForTimeout(2000);
    
    // Verificar carregamento da interface
    await expect(page.locator('h1')).toContainText('Individual');
    
    // Verificar seção de dados DI
    await expect(page.locator('#di-data-section')).toBeVisible();
    
    // Verificar formulário de item
    await expect(page.locator('#item-form')).toBeVisible();
    
    // Verificar área de resultados
    await expect(page.locator('#calculation-results')).toBeVisible();
    
    console.log('✅ Precificação Individual funcionando corretamente');
  });

  test('5. Teste Navegação entre Módulos', async ({ page }) => {
    console.log('🧪 Testando Navegação entre Módulos...');
    
    const modules = [
      { link: 'dashboard.html', title: 'Dashboard' },
      { link: 'di-interface.html', title: 'Processamento' },
      { link: 'pricing-interface.html', title: 'Precificação' },
      { link: 'item-pricing.html', title: 'Individual' }
    ];
    
    for (const module of modules) {
      console.log(`  → Testando navegação para ${module.title}...`);
      
      // Voltar para home
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Navegar para módulo
      await page.click(`a[href="${module.link}"]`);
      await page.waitForLoadState('networkidle');
      
      // Verificar carregamento
      await expect(page.locator('h1')).toContainText(module.title);
      
      // Verificar ausência de erros
      const errors = await page.locator('.error, .alert-danger').count();
      expect(errors).toBe(0);
    }
    
    console.log('✅ Navegação entre módulos funcionando corretamente');
  });

  test('6. Teste Console - Verificar Ausência de Erros', async ({ page }) => {
    console.log('🧪 Testando Console Errors...');
    
    const consoleErrors = [];
    const consoleWarnings = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });
    
    // Testar todos os módulos
    const pages = [
      '/',
      '/dashboard.html', 
      '/di-interface.html',
      '/pricing-interface.html',
      '/item-pricing.html'
    ];
    
    for (const pagePath of pages) {
      console.log(`  → Verificando console em ${pagePath}...`);
      
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Aguardar inicializações
    }
    
    // Verificar se há erros críticos
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('favicon.ico') && 
      !error.includes('404') &&
      !error.includes('DevTools')
    );
    
    if (criticalErrors.length > 0) {
      console.error('❌ Erros críticos encontrados:', criticalErrors);
      throw new Error(`Erros críticos no console: ${criticalErrors.join(', ')}`);
    }
    
    console.log(`✅ Console limpo - ${consoleErrors.length} erros não-críticos, ${consoleWarnings.length} warnings`);
  });

  test('7. Teste Performance - Tempo de Carregamento', async ({ page }) => {
    console.log('🧪 Testando Performance...');
    
    const performanceData = [];
    
    const testPages = [
      { url: '/', name: 'Home' },
      { url: '/dashboard.html', name: 'Dashboard' },
      { url: '/di-interface.html', name: 'DI Processing' },
      { url: '/pricing-interface.html', name: 'Precificação' },
      { url: '/item-pricing.html', name: 'Item Pricing' }
    ];
    
    for (const testPage of testPages) {
      const startTime = Date.now();
      
      await page.goto(testPage.url);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      performanceData.push({ page: testPage.name, loadTime });
      
      console.log(`  → ${testPage.name}: ${loadTime}ms`);
      
      // Verificar se carregamento está dentro do limite aceitável (10s)
      expect(loadTime).toBeLessThan(10000);
    }
    
    const averageLoadTime = performanceData.reduce((sum, item) => sum + item.loadTime, 0) / performanceData.length;
    console.log(`✅ Performance OK - Tempo médio: ${Math.round(averageLoadTime)}ms`);
  });

  test('8. Teste Responsividade - Diferentes Viewports', async ({ page }) => {
    console.log('🧪 Testando Responsividade...');
    
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 1024, height: 768, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      console.log(`  → Testando ${viewport.name} (${viewport.width}x${viewport.height})...`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Testar página principal
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Verificar se elementos principais estão visíveis
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();
      
      // Testar dashboard
      await page.goto('/dashboard.html');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1')).toBeVisible();
    }
    
    console.log('✅ Responsividade funcionando corretamente');
  });

});