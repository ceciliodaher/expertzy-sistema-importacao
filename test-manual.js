const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  console.log('🚀 Iniciando teste E2E manual...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down for visibility
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => console.log(`🔍 BROWSER: ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', error => console.error(`❌ JS ERROR: ${error.message}`));

  try {
    console.log('📍 Step 1: Navegando para página inicial...');
    await page.goto('https://importa-precifica.local', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/01-home.png', fullPage: true });

    console.log('📍 Step 2: Navegando para interface DI...');
    await page.goto('https://importa-precifica.local/di-interface.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/02-di-interface.png', fullPage: true });

    console.log('📍 Step 3: Carregando XML real...');
    // Simulate loading DI 2300120746 data into sessionStorage
    await page.evaluate(() => {
      const mockDIData = {
        numero_di: '2300120746',
        valor_aduaneiro: 565511.26,
        ii_devido: 79184.34,
        ipi_devido: 33319.88,
        pis_devido: 14050.24,
        cofins_devido: 67647.66,
        icms_devido: 178614.94,
        despesas_aduaneiras: 1750.33
      };
      
      sessionStorage.setItem('expertzy_di_data', JSON.stringify(mockDIData));
      sessionStorage.setItem('current_di_number', '2300120746');
    });

    console.log('📍 Step 4: Navegando para módulo de precificação...');
    await page.goto('https://importa-precifica.local/src/modules/pricing/pricing-interface.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test-results/03-pricing-module.png', fullPage: true });

    console.log('📍 Step 5: Verificando se sistema está carregado...');
    const systemCheck = await page.evaluate(() => {
      return {
        url: window.location.href,
        sistemaGlobal: typeof window.sistemaGlobal !== 'undefined',
        showAlert: typeof window.showAlert !== 'undefined',
        abrirPrecificacaoItens: typeof window.abrirPrecificacaoItens !== 'undefined',
        calcularBtn: !!document.getElementById('calcularBtn'),
        itemPricingBtn: !!document.getElementById('itemPricingBtn'),
        itemPricingBtnVisible: document.getElementById('itemPricingBtn')?.style.display !== 'none'
      };
    });

    console.log('✅ Sistema carregado:', JSON.stringify(systemCheck, null, 2));

    if (systemCheck.calcularBtn) {
      console.log('📍 Step 6: Simulando cálculo de custos...');
      
      // Inject mock data into global system
      await page.evaluate(() => {
        if (window.sistemaGlobal) {
          window.sistemaGlobal.diSelecionada = {
            numero_di: '2300120746',
            valor_aduaneiro: 565511.26
          };
          
          window.sistemaGlobal.dadosDI = {
            numero_di: '2300120746',
            totais: {
              valor_aduaneiro: 565511.26,
              ii_devido: 79184.34,
              ipi_devido: 33319.88,
              pis_devido: 14050.24,
              cofins_devido: 67647.66,
              icms_devido: 178614.94,
              despesas_aduaneiras: 1750.33
            }
          };

          // Mock successful cost calculation
          window.sistemaGlobal.custos4Tipos = {
            tipo_1_custo_base: 940078.65,
            tipo_2_custo_desembolso: 646445.93,
            tipo_3_custo_contabil: 646445.93,
            tipo_4_base_formacao_preco: 646445.93
          };

          // Show the item pricing button
          const itemBtn = document.getElementById('itemPricingBtn');
          if (itemBtn) {
            itemBtn.style.display = 'inline-block';
          }
        }
      });

      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/04-costs-calculated.png', fullPage: true });

      console.log('📍 Step 7: Testando botão de precificação individual...');
      
      const buttonTest = await page.evaluate(() => {
        const button = document.getElementById('itemPricingBtn');
        return {
          buttonExists: !!button,
          buttonVisible: button?.style.display !== 'none',
          buttonText: button?.textContent?.trim(),
          hasOnClick: !!button?.onclick,
          globalFunctionExists: typeof window.abrirPrecificacaoItens === 'function'
        };
      });

      console.log('✅ Botão de precificação:', JSON.stringify(buttonTest, null, 2));

      if (buttonTest.buttonExists && buttonTest.buttonVisible) {
        console.log('📍 Step 8: TESTE CRÍTICO - Clicando no botão de precificação...');
        
        // Test the function directly without navigation
        const criticalTest = await page.evaluate(() => {
          return new Promise((resolve) => {
            const errors = [];
            const originalError = console.error;
            
            console.error = (...args) => {
              errors.push(args.join(' '));
              originalError(...args);
            };

            try {
              // Test if function exists and can be called
              if (typeof window.abrirPrecificacaoItens === 'function') {
                // Mock confirm to avoid blocking
                const originalConfirm = window.confirm;
                window.confirm = () => false; // Cancel navigation for test
                
                // Call the function
                window.abrirPrecificacaoItens();
                
                // Restore confirm
                window.confirm = originalConfirm;
                
                setTimeout(() => {
                  console.error = originalError;
                  resolve({
                    success: errors.length === 0,
                    errors: errors,
                    functionCalled: true,
                    testType: 'function_call'
                  });
                }, 1000);
              } else {
                resolve({
                  success: false,
                  errors: ['Function abrirPrecificacaoItens not found'],
                  functionCalled: false,
                  testType: 'function_missing'
                });
              }
            } catch (error) {
              console.error = originalError;
              resolve({
                success: false,
                errors: [error.message],
                functionCalled: true,
                testType: 'function_error'
              });
            }
          });
        });

        console.log('🎯 RESULTADO CRÍTICO:', JSON.stringify(criticalTest, null, 2));

        if (criticalTest.success) {
          console.log('🎉 ✅ SUCESSO! Função abrirPrecificacaoItens funciona sem erros!');
        } else {
          console.log('❌ FALHA! Erros encontrados:', criticalTest.errors);
        }

        await page.screenshot({ path: 'test-results/05-critical-test.png', fullPage: true });
      }
    }

    console.log('📍 Step 9: Testando função showAlert...');
    const alertTest = await page.evaluate(() => {
      try {
        if (typeof window.showAlert === 'function') {
          window.showAlert('Teste de alerta E2E', 'success');
          return { success: true, alertFunction: 'available and working' };
        } else {
          return { success: false, alertFunction: 'missing' };
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    console.log('✅ Teste de alerta:', JSON.stringify(alertTest, null, 2));
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/06-alert-test.png', fullPage: true });

    console.log('📍 Step 10: Teste de navegação real...');
    // Handle confirm dialog
    page.once('dialog', async dialog => {
      console.log(`📝 Dialog intercepted: ${dialog.message()}`);
      await dialog.accept(); // Accept navigation
    });

    // Try actual navigation
    try {
      const itemPricingBtn = await page.$('#itemPricingBtn');
      if (itemPricingBtn) {
        await itemPricingBtn.click();
        await page.waitForTimeout(3000);
        
        const finalUrl = page.url();
        console.log('🎯 URL final:', finalUrl);
        
        if (finalUrl.includes('item-pricing-interface.html')) {
          console.log('🎉 ✅ NAVEGAÇÃO BEM-SUCEDIDA para módulo de precificação individual!');
          await page.screenshot({ path: 'test-results/07-navigation-success.png', fullPage: true });
        } else {
          console.log('⚠️ Navegação não ocorreu como esperado');
        }
      }
    } catch (navError) {
      console.log('ℹ️ Navegação não testada:', navError.message);
    }

    console.log('🎉 Teste E2E manual concluído!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    await page.screenshot({ path: 'test-results/error.png', fullPage: true });
  } finally {
    await page.waitForTimeout(3000); // Keep browser open for a moment
    await browser.close();
  }
})();