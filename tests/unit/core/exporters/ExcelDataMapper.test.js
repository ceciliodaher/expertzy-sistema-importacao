/**
 * ExcelDataMapper Unit Tests
 * Testa o mapeamento de dados DI para estrutura Excel
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExcelDataMapper } from '@core/exporters/ExcelDataMapper.js';

// Mock ConfigLoader
vi.mock('@shared/utils/ConfigLoader.js', () => ({
  ConfigLoader: vi.fn().mockImplementation(() => ({
    loadConfig: vi.fn().mockResolvedValue({
      exportacao: {
        excel_mapper: {
          nomes_abas: {
            capa: '01_Capa',
            importador: '02_Importador',
            carga: '03_Carga',
            valores: '04_Valores',
            despesas: '05_Despesas',
            tributos: '06_Tributos',
            resumo_custos: '06A_Resumo_Custos',
            ncms: '07_NCMs',
            produtos: '08_Produtos',
            memoria: '09_Memoria_Calculo',
            incentivos: '10_Incentivos',
            comparativo: '11_Comparativo',
            precificacao: '12_Precificacao',
            validacao: '13_Validacao'
          },
          ordem_abas: [
            'Capa',
            'Importador',
            'Carga',
            'Valores',
            'Despesas',
            'Tributos',
            'ResumoCustos',
            'NCMs',
            'Produtos'
          ],
          prefixo_adicao: 'Add_',
          padding_numero_adicao: 3,
          labels: {
            capa: {
              titulo: 'EXTRATO DE DECLARAÇÃO DE IMPORTAÇÃO',
              subtitulo: 'Sistema Expertzy - Análise Completa'
            },
            comum: {
              numero_di: 'Número da DI'
            }
          }
        }
      },
      incoterms_suportados: {
        FOB: 'Free on Board',
        CIF: 'Cost, Insurance and Freight'
      },
      configuracoes_gerais: {
        versao: '2025.1'
      }
    })
  }))
}));

describe('ExcelDataMapper', () => {
  let validDIData;

  beforeEach(() => {
    validDIData = {
      numero_di: '2518173187',
      data_registro: '2025-01-15',
      importador_cnpj: '12345678000199',
      importador_nome: 'EMPRESA TESTE LTDA',
      importador_endereco_uf: 'SP',
      urf_despacho_codigo: '0810500',
      urf_despacho_nome: 'SRF/SANTOS',
      total_adicoes: 2,
      valor_aduaneiro_total_brl: 50000.00,
      incoterm_identificado: 'FOB',
      modalidade_nome: 'MARITIMA',
      data_processamento: '2025-01-15T10:30:00Z',
      adicoes: [
        {
          numero_adicao: 1,
          ncm: '84219999',
          descricao_ncm: 'OUTRAS MAQUINAS',
          valor_reais: 25000.00,
          peso_liquido: 100.5
        },
        {
          numero_adicao: 2,
          ncm: '85176299',
          descricao_ncm: 'EQUIPAMENTOS ELETRONICOS',
          valor_reais: 25000.00,
          peso_liquido: 50.2
        }
      ],
      despesas_aduaneiras: {
        total: 1500.00,
        detalhes: {}
      },
      totais_relatorio: {
        total_impostos_federais: 5000.00,
        total_impostos_estaduais: 3000.00,
        total_despesas_aduaneiras: 1500.00,
        custo_total_sem_incentivos: 59500.00,
        custo_total_com_incentivos: 57000.00,
        economia_total_incentivos: 2500.00,
        analise_percentual: {
          impostos_sobre_valor: 16.0,
          despesas_sobre_valor: 3.0
        }
      }
    };
  });

  describe('Constructor e Validação', () => {
    it('deve criar instância com dados válidos', () => {
      expect(() => new ExcelDataMapper(validDIData)).not.toThrow();
    });

    it('deve falhar sem diData (NO FALLBACKS)', () => {
      expect(() => new ExcelDataMapper()).toThrow('ExcelDataMapper: diData é obrigatório');
    });

    it('deve falhar sem numero_di', () => {
      const invalidData = { ...validDIData };
      delete invalidData.numero_di;
      
      expect(() => new ExcelDataMapper(invalidData)).toThrow('ExcelDataMapper: numero_di é obrigatório');
    });

    it('deve falhar sem adicoes', () => {
      const invalidData = { ...validDIData };
      delete invalidData.adicoes;
      
      expect(() => new ExcelDataMapper(invalidData)).toThrow('ExcelDataMapper: adicoes é obrigatório');
    });

    it('deve falhar com adicoes vazio', () => {
      const invalidData = { ...validDIData, adicoes: [] };
      
      expect(() => new ExcelDataMapper(invalidData)).toThrow('ExcelDataMapper: DI deve conter pelo menos uma adição');
    });

    it('deve falhar com adicoes não array', () => {
      const invalidData = { ...validDIData, adicoes: 'not-array' };
      
      expect(() => new ExcelDataMapper(invalidData)).toThrow('ExcelDataMapper: adicoes deve ser um array');
    });
  });

  describe('Inicialização e Configuração', () => {
    it('deve inicializar com configurações carregadas', async () => {
      const mapper = new ExcelDataMapper(validDIData);
      await mapper.initialize();
      
      expect(mapper.config).toBeDefined();
      expect(mapper.config.nomes_abas).toBeDefined();
      expect(mapper.incoterms).toBeDefined();
      expect(mapper.systemInfo).toBeDefined();
    });

    it('deve validar configurações obrigatórias', async () => {
      const mapper = new ExcelDataMapper(validDIData);
      await mapper.initialize();
      
      expect(mapper.config.nomes_abas).toBeDefined();
      expect(mapper.config.ordem_abas).toBeDefined();
      expect(mapper.config.prefixo_adicao).toBeDefined();
      expect(mapper.config.padding_numero_adicao).toBeDefined();
      expect(mapper.config.labels).toBeDefined();
    });
  });

  describe('Mapeamento de Abas', () => {
    let mapper;

    beforeEach(async () => {
      mapper = new ExcelDataMapper(validDIData);
      await mapper.initialize();
    });

    it('deve mapear aba Capa corretamente', () => {
      const capaMapping = mapper.mapCapaSheet();
      
      expect(capaMapping.name).toBe('01_Capa');
      expect(capaMapping.type).toBe('capa');
      expect(capaMapping.data.numero_di).toBe('2518173187');
      expect(capaMapping.data.importador.cnpj).toBe('12345678000199');
      expect(capaMapping.data.importador.nome).toBe('EMPRESA TESTE LTDA');
    });

    it('deve mapear aba Importador corretamente', () => {
      const importadorMapping = mapper.mapImportadorSheet();
      
      expect(importadorMapping.name).toBe('02_Importador');
      expect(importadorMapping.type).toBe('importador');
      expect(importadorMapping.data.identificacao.cnpj).toBe('12345678000199');
      expect(importadorMapping.data.identificacao.nome).toBe('EMPRESA TESTE LTDA');
    });

    it('deve mapear aba Valores corretamente', () => {
      const valoresMapping = mapper.mapValoresSheet();
      
      expect(valoresMapping.name).toBe('04_Valores');
      expect(valoresMapping.type).toBe('valores');
      expect(valoresMapping.data.valor_aduaneiro.brl).toBe(50000.00);
      expect(valoresMapping.data.incoterm.codigo).toBe('FOB');
    });

    it('deve mapear aba Despesas corretamente', () => {
      const despesasMapping = mapper.mapDespesasSheet();
      
      expect(despesasMapping.name).toBe('05_Despesas');
      expect(despesasMapping.type).toBe('despesas');
      expect(despesasMapping.data).toEqual(validDIData.despesas_aduaneiras);
    });
  });

  describe('Mapeamento de Adições Dinâmicas', () => {
    let mapper;

    beforeEach(async () => {
      mapper = new ExcelDataMapper(validDIData);
      await mapper.initialize();
    });

    it('deve mapear adições dinâmicas corretamente', () => {
      const dynamicMappings = mapper.mapDynamicAdditions();
      
      expect(dynamicMappings).toHaveLength(2);
      expect(dynamicMappings[0].name).toBe('Add_001');
      expect(dynamicMappings[1].name).toBe('Add_002');
      expect(dynamicMappings[0].type).toBe('adicao');
      expect(dynamicMappings[0].data.numero_adicao).toBe(1);
    });

    it('deve aplicar padding correto no número da adição', () => {
      const dynamicMappings = mapper.mapDynamicAdditions();
      
      expect(dynamicMappings[0].name).toBe('Add_001');
      expect(dynamicMappings[1].name).toBe('Add_002');
    });
  });

  describe('Validações NO FALLBACKS', () => {
    let mapper;

    beforeEach(async () => {
      mapper = new ExcelDataMapper(validDIData);
      await mapper.initialize();
    });

    it('deve falhar na aba Capa sem data_registro', () => {
      const invalidData = { ...validDIData };
      delete invalidData.data_registro;
      
      const invalidMapper = new ExcelDataMapper(invalidData);
      invalidMapper.config = mapper.config;
      invalidMapper.systemInfo = mapper.systemInfo;
      
      expect(() => invalidMapper.mapCapaSheet()).toThrow('ExcelDataMapper: data_registro obrigatório para Capa');
    });

    it('deve falhar na aba Valores sem valor_aduaneiro_total_brl', () => {
      const invalidData = { ...validDIData };
      delete invalidData.valor_aduaneiro_total_brl;
      
      const invalidMapper = new ExcelDataMapper(invalidData);
      invalidMapper.config = mapper.config;
      invalidMapper.incoterms = mapper.incoterms;
      
      expect(() => invalidMapper.mapValoresSheet()).toThrow('ExcelDataMapper: valor_aduaneiro_total_brl é obrigatório');
    });

    it('deve falhar na aba Valores com INCOTERM não suportado', () => {
      const invalidData = { ...validDIData, incoterm_identificado: 'INVALID' };
      
      const invalidMapper = new ExcelDataMapper(invalidData);
      invalidMapper.config = mapper.config;
      invalidMapper.incoterms = mapper.incoterms;
      
      expect(() => invalidMapper.mapValoresSheet()).toThrow('ExcelDataMapper: INCOTERM INVALID não é suportado');
    });

    it('deve falhar na aba Despesas sem despesas_aduaneiras', () => {
      const invalidData = { ...validDIData };
      delete invalidData.despesas_aduaneiras;
      
      const invalidMapper = new ExcelDataMapper(invalidData);
      invalidMapper.config = mapper.config;
      
      expect(() => invalidMapper.mapDespesasSheet()).toThrow('ExcelDataMapper: despesas_aduaneiras é obrigatório');
    });

    it('deve falhar em adições dinâmicas sem numero_adicao', () => {
      const invalidData = { ...validDIData };
      invalidData.adicoes[0] = { ...invalidData.adicoes[0] };
      delete invalidData.adicoes[0].numero_adicao;
      
      const invalidMapper = new ExcelDataMapper(invalidData);
      invalidMapper.config = mapper.config;
      
      expect(() => invalidMapper.mapDynamicAdditions()).toThrow('ExcelDataMapper: numero_adicao obrigatório para adição 1');
    });

    it('deve falhar em adições dinâmicas sem ncm', () => {
      const invalidData = { ...validDIData };
      invalidData.adicoes[0] = { ...invalidData.adicoes[0] };
      delete invalidData.adicoes[0].ncm;
      
      const invalidMapper = new ExcelDataMapper(invalidData);
      invalidMapper.config = mapper.config;
      
      expect(() => invalidMapper.mapDynamicAdditions()).toThrow('ExcelDataMapper: ncm obrigatório para adição 1');
    });
  });

  describe('Mapeamentos Completos', () => {
    let mapper;

    beforeEach(async () => {
      mapper = new ExcelDataMapper(validDIData);
      await mapper.initialize();
    });

    it('deve retornar todos os mapeamentos de sheets', () => {
      const allMappings = mapper.getAllSheetMappings();
      
      expect(allMappings).toBeDefined();
      expect(Array.isArray(allMappings)).toBe(true);
      expect(allMappings.length).toBeGreaterThan(0);
      
      // Deve incluir abas fixas + adições dinâmicas
      const sheetNames = allMappings.map(mapping => mapping.name);
      expect(sheetNames).toContain('01_Capa');
      expect(sheetNames).toContain('Add_001');
      expect(sheetNames).toContain('Add_002');
    });

    it('deve falhar getAllSheetMappings se não inicializado', () => {
      const uninitializedMapper = new ExcelDataMapper(validDIData);
      
      expect(() => uninitializedMapper.getAllSheetMappings()).toThrow('ExcelDataMapper: Mapeamentos não inicializados - chame initialize() primeiro');
    });
  });
});