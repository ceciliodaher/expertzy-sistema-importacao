/**
 * Testes E2E para o IncentiveManager
 * Sistema Expertzy - Módulo de Incentivos Fiscais
 */

const { test, expect } = require('@playwright/test');

test.describe('IncentiveManager - Sistema de Incentivos Fiscais', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navegar para a página principal
    await page.goto('/');
    
    // Aguardar carregamento do sistema
    await page.waitForLoadState('networkidle');
  });

  test('deve carregar configurações de incentivos corretamente', async ({ page }) => {
    // Verificar se o IncentiveManager está disponível
    const incentiveManagerExists = await page.evaluate(() => {
      return typeof IncentiveManager !== 'undefined';
    });
    
    expect(incentiveManagerExists).toBe(true);
    
    // Inicializar IncentiveManager
    const stats = await page.evaluate(async () => {
      const manager = new IncentiveManager();
      
      // Aguardar carregamento das configurações
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return manager.getStats();
    });
    
    expect(stats.programas_disponiveis).toContain('SC_TTD_409');
    expect(stats.programas_disponiveis).toContain('MG_CORREDOR');
    expect(stats.programas_disponiveis).toContain('GO_COMEXPRODUZIR');
    expect(stats.programas_disponiveis).toContain('ES_INVEST');
    expect(stats.status).toBe('active');
  });

  test('deve validar elegibilidade para Santa Catarina TTD 409', async ({ page }) => {
    const resultado = await page.evaluate(async () => {
      const manager = new IncentiveManager();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Testar elegibilidade com NCMs válidos
      return manager.validateEligibility('SC', 'SC_TTD_409', ['8517', '9013']);
    });
    
    expect(resultado.elegivel).toBe(true);
    expect(resultado.motivo).toContain('Programa elegível');
  });

  test('deve rejeitar NCMs vedados para Santa Catarina', async ({ page }) => {
    const resultado = await page.evaluate(async () => {
      const manager = new IncentiveManager();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Testar com NCMs restritos (combustíveis)
      return manager.validateEligibility('SC', 'SC_TTD_409', ['2710', '7005']);
    });
    
    expect(resultado.elegivel).toBe(false);
    expect(resultado.motivo).toContain('NCMs restritos');
    expect(resultado.ncms_restritos).toContain('2710');
    expect(resultado.ncms_restritos).toContain('7005');
  });

  test('deve rejeitar NCMs vedados para Goiás COMEXPRODUZIR', async ({ page }) => {
    const resultado = await page.evaluate(async () => {
      const manager = new IncentiveManager();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Testar com NCMs da lista negativa do GO (vestuário)
      return manager.validateEligibility('GO', 'GO_COMEXPRODUZIR', ['6101', '6201']);
    });
    
    expect(resultado.elegivel).toBe(false);
    expect(resultado.motivo).toContain('NCMs restritos');
    expect(resultado.ncms_restritos).toContain('6101');
    expect(resultado.ncms_restritos).toContain('6201');
  });

  test('deve listar programas disponíveis por estado', async ({ page }) => {
    const programasSC = await page.evaluate(async () => {
      const manager = new IncentiveManager();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return manager.getAvailablePrograms('SC');
    });
    
    expect(programasSC.length).toBeGreaterThan(0);
    expect(programasSC.some(p => p.codigo === 'SC_TTD_409')).toBe(true);
    expect(programasSC.some(p => p.codigo === 'SC_TTD_410')).toBe(true);
    expect(programasSC.some(p => p.codigo === 'SC_TTD_411')).toBe(true);
    
    const programasMG = await page.evaluate(async () => {
      const manager = new IncentiveManager();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return manager.getAvailablePrograms('MG');
    });
    
    expect(programasMG.length).toBeGreaterThan(0);
    expect(programasMG.some(p => p.codigo === 'MG_CORREDOR')).toBe(true);
  });

  test('deve calcular campos de NF com diferimento para TTD 409', async ({ page }) => {
    // Mock de uma DI simples
    const diMock = {
      numero_di: '25/1234567-8',
      importador: { estado: 'SC' },
      adicoes: [{
        numero_adicao: 1,
        valor_aduaneiro: 100000,
        tributos: { ii: 2000, ipi: 1500, pis: 1650, cofins: 7600 },
        ncm: '8517'
      }]
    };
    
    const nfFields = await page.evaluate(async (di) => {
      const manager = new IncentiveManager();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return manager.calculateNFFields(di, 'SC_TTD_409');
    }, diMock);
    
    expect(nfFields.nf_fields.cst).toBe('51');
    expect(nfFields.nf_fields.vBC).toBeGreaterThan(0);
    expect(nfFields.nf_fields.vICMSOp).toBeGreaterThan(0);
    expect(nfFields.nf_fields.vICMSDif).toBeGreaterThan(0);
    expect(nfFields.nf_fields.pDif).toBeGreaterThan(80); // Deve ser > 80%
    expect(nfFields.nf_fields.cBenef).toBe('SC830015');
  });

  test('deve projetar cenários da reforma tributária', async ({ page }) => {
    const cenarios = await page.evaluate(async () => {
      const manager = new IncentiveManager();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return manager.projectReformScenarios(2025);
    });
    
    expect(cenarios.length).toBe(9); // 2025 a 2033
    
    // Verificar anos específicos
    const ano2025 = cenarios.find(c => c.ano === 2025);
    expect(ano2025.beneficios_icms_percentual).toBe(100);
    expect(ano2025.fase).toBe('atual');
    
    const ano2029 = cenarios.find(c => c.ano === 2029);
    expect(ano2029.beneficios_icms_percentual).toBe(90);
    expect(ano2029.fase).toBe('reducao_gradual');
    
    const ano2033 = cenarios.find(c => c.ano === 2033);
    expect(ano2033.beneficios_icms_percentual).toBe(0);
    expect(ano2033.fase).toBe('sistema_novo');
  });

  test('deve falhar com estado inválido (NO FALLBACKS)', async ({ page }) => {
    await expect(page.evaluate(async () => {
      const manager = new IncentiveManager();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Tentar usar estado inexistente
      return manager.validateEligibility('ZZ', 'SC_TTD_409', []);
    })).rejects.toThrow();
  });

  test('deve falhar com programa inválido (NO FALLBACKS)', async ({ page }) => {
    await expect(page.evaluate(async () => {
      const manager = new IncentiveManager();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Tentar usar programa inexistente
      return manager.validateEligibility('SC', 'PROGRAMA_INEXISTENTE', []);
    })).rejects.toThrow();
  });

  test('deve integrar com CroquiNFExporter', async ({ page }) => {
    // Verificar se a integração está funcionando
    const integracaoFunciona = await page.evaluate(async () => {
      try {
        // Mock de dados básicos
        const diData = {
          numero_di: '25/1234567-8',
          importador: { nome: 'Teste SA', cnpj: '12345678000123', estado: 'SC' },
          adicoes: [{ numero_adicao: 1, valor_aduaneiro: 100000, ncm: '8517' }]
        };
        
        const calculosData = {
          impostos: { icms: { aliquota: 17 } },
          produtos_individuais: [{
            adicao_numero: 1,
            descricao: 'Produto Teste',
            ncm: '8517',
            quantidade: 1,
            valor_unitario_brl: 100000,
            valor_total_brl: 100000,
            base_icms_item: 117647,
            icms_item: 20000,
            ipi_item: 2000,
            ii_item: 2000,
            pis_item: 1650,
            cofins_item: 7600
          }]
        };
        
        const manager = new IncentiveManager();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Verificar se CroquiNFExporter aceita incentiveManager
        const exporter = new CroquiNFExporter(diData, calculosData, manager);
        
        return exporter.incentiveManager !== null;
      } catch (error) {
        console.log('Erro na integração:', error.message);
        return false;
      }
    });
    
    expect(integracaoFunciona).toBe(true);
  });
});