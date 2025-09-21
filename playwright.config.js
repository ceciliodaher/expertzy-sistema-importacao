import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração Playwright para Sistema Expertzy
 * Testes E2E organizados por fases de desenvolvimento
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Execução em paralelo com limite para estabilidade */
  fullyParallel: true,
  workers: process.env.CI ? 1 : 2,
  
  /* Configuração de timeout por fase */
  timeout: 60000, // 1 minuto por teste
  expect: {
    timeout: 10000 // 10 segundos para assertions
  },
  
  /* Falhar em primeiro erro em CI */
  forbidOnly: !!process.env.CI,
  
  /* Retry apenas em CI */
  retries: process.env.CI ? 2 : 0,
  
  /* Reporter configurado para desenvolvimento */
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  
  /* Configuração global para todos os testes */
  use: {
    /* URL base do sistema */
    baseURL: 'http://localhost:8000',
    
    /* Screenshots apenas em falha */
    screenshot: 'only-on-failure',
    
    /* Video apenas em retry */
    video: 'retain-on-failure',
    
    /* Trace para debugging */
    trace: 'retain-on-failure',
    
    /* Headers personalizados */
    extraHTTPHeaders: {
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
    }
  },

  /* Projetos por navegador e fase */
  projects: [
    {
      name: 'fase1-foundation',
      testDir: './tests/e2e/fase1-foundation',
      use: { ...devices['Desktop Chrome'] },
    },
    
    {
      name: 'fase2-incentivos-entrada',
      testDir: './tests/e2e/fase2-incentivos-entrada',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['fase1-foundation']
    },
    
    {
      name: 'fase3-incentivos-saida',
      testDir: './tests/e2e/fase3-incentivos-saida',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['fase2-incentivos-entrada']
    },
    
    {
      name: 'fase4-dashboard',
      testDir: './tests/e2e/fase4-dashboard',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['fase3-incentivos-saida']
    },
    
    {
      name: 'fase5-regimes',
      testDir: './tests/e2e/fase5-regimes',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['fase4-dashboard']
    },
    
    {
      name: 'fase6-integracao',
      testDir: './tests/e2e/fase6-integracao',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['fase5-regimes']
    },

    /* Testes cross-browser para validação final */
    {
      name: 'cross-browser-firefox',
      testDir: './tests/e2e/fase6-integracao',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['fase6-integracao']
    },
    
    {
      name: 'cross-browser-safari',
      testDir: './tests/e2e/fase6-integracao',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['fase6-integracao']
    }
  ],

  /* Servidor de desenvolvimento */
  webServer: {
    command: 'npm run serve',
    url: 'http://localhost:8000',
    reuseExistingServer: !process.env.CI,
    timeout: 30000
  },
});