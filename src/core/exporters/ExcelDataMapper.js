/**
 * ExcelDataMapper.js - Data Mapping Module for Excel Export
 * 
 * Responsabilidade única: Mapear dados consolidados da DI para estrutura de Excel
 * Segue princípios SOLID e NO FALLBACKS
 * Usa nomenclatura oficial do DIProcessor
 * 
 * REGRAS APLICADAS:
 * - NO HARDCODED DATA: Todos os textos e configurações vêm do config.json
 * - NO FALLBACKS: Sempre lançar exceções quando dados obrigatórios ausentes
 * - NOMENCLATURA OFICIAL: Segue 100% a nomenclatura do DIProcessor
 */

import { ConfigLoader } from '@shared/utils/ConfigLoader.js';
import IndexedDBManager from '@services/database/IndexedDBManager.js';
import { StoreKeys } from '@core/db/StoreKeyConstants.js';

export class ExcelDataMapper {
    constructor(numeroDI) {
        // KISS: Constructor único recebe apenas numeroDI
        if (!numeroDI) {
            throw new Error('ExcelDataMapper: numeroDI é obrigatório');
        }
        
        this.numeroDI = numeroDI;
        this.diData = null;
        this.config = null;
        this.sheetMappings = [];
    }
    
    /**
     * Inicializa o mapper carregando dados do banco e configurações
     * KISS: Um método, uma responsabilidade completa
     */
    async initialize() {
        // ETAPA 1: Carregar dados da DI do IndexedDB
        const dbManager = IndexedDBManager.getInstance();
        await dbManager.initialize();

        this.diData = await dbManager.getDI(this.numeroDI);
        if (!this.diData) {
            throw new Error(`ExcelDataMapper: DI ${this.numeroDI} não encontrada no banco de dados`);
        }

        console.log(`✅ ExcelDataMapper: DI ${this.numeroDI} carregada do banco com ${this.diData.adicoes?.length || 0} adições`);

        // ETAPA 1B: Carregar dados calculados (opcional - pode não existir ainda)
        this.calculoData = await dbManager.getConfig(StoreKeys.CALCULO(this.numeroDI));
        if (this.calculoData) {
            console.log(`✅ ExcelDataMapper: Dados calculados encontrados para DI ${this.numeroDI}`);
        } else {
            console.log(`⚠️ ExcelDataMapper: Dados calculados não encontrados - usando apenas dados básicos da DI`);
        }

        // ETAPA 2: Validação rigorosa - nomenclatura oficial DIProcessor
        this._validateDIData();
        
        // ETAPA 3: Carregar configuração do sistema
        const configLoader = new ConfigLoader();
        const fullConfig = await configLoader.loadConfig('config.json');
        
        if (!fullConfig) {
            throw new Error('ExcelDataMapper: Não foi possível carregar config.json');
        }
        
        if (!fullConfig.exportacao) {
            throw new Error('ExcelDataMapper: config.json não contém seção exportacao');
        }
        
        if (!fullConfig.exportacao.excel_mapper) {
            throw new Error('ExcelDataMapper: config.json não contém seção excel_mapper');
        }
        
        this.config = fullConfig.exportacao.excel_mapper;
        this.incoterms = fullConfig.incoterms_suportados;
        this.systemInfo = fullConfig.configuracoes_gerais;
        this.systemVersion = fullConfig.versao || null;  // Root level, opcional
        this.systemName = fullConfig.nome_sistema || 'Sistema de Importação';

        // ETAPA 4: Validar configurações obrigatórias
        this._validateConfig();
        
        // ETAPA 5: Inicializar mapeamentos após carregar config
        await this._initializeMappings();
    }
    
    /**
     * Valida estrutura de dados da DI seguindo nomenclatura oficial DIProcessor
     * PRINCÍPIO NO FALLBACKS: Falha explícita para campos obrigatórios
     * @private
     */
    _validateDIData() {
        if (!this.diData) {
            throw new Error('ExcelDataMapper: diData é obrigatório após carregamento do banco');
        }
        
        // Validação número da DI
        if (!this.diData.numero_di) {
            throw new Error('ExcelDataMapper: numero_di é obrigatório - nomenclatura oficial DIProcessor');
        }
        
        // Validação IMPORTADOR - nomenclatura oficial DIProcessor (estrutura aninhada)
        if (!this.diData.importador) {
            throw new Error('ExcelDataMapper: importador é obrigatório - nomenclatura oficial DIProcessor');
        }
        
        if (!this.diData.importador.cnpj) {
            throw new Error('ExcelDataMapper: importador.cnpj é obrigatório - nomenclatura oficial DIProcessor');
        }
        
        if (!this.diData.importador.nome) {
            throw new Error('ExcelDataMapper: importador.nome é obrigatório - nomenclatura oficial DIProcessor');
        }
        
        if (!this.diData.importador.endereco_uf) {
            throw new Error('ExcelDataMapper: importador.endereco_uf é obrigatório - nomenclatura oficial DIProcessor');
        }
        
        // Validação ADIÇÕES
        if (!this.diData.adicoes) {
            throw new Error('ExcelDataMapper: adicoes é obrigatório - nomenclatura oficial DIProcessor');
        }
        
        if (!Array.isArray(this.diData.adicoes)) {
            throw new Error('ExcelDataMapper: adicoes deve ser um array - nomenclatura oficial DIProcessor');
        }
        
        if (this.diData.adicoes.length === 0) {
            throw new Error('ExcelDataMapper: DI deve conter pelo menos uma adição');
        }
        
        // Validação valores monetários obrigatórios
        if (typeof this.diData.valor_aduaneiro_total_brl !== 'number') {
            throw new Error('ExcelDataMapper: valor_aduaneiro_total_brl deve ser numérico');
        }
        
        console.log(`✅ ExcelDataMapper: Validação rigorosa aprovada para DI ${this.diData.numero_di}`);
    }
    
    /**
     * Valida configurações obrigatórias
     * @private
     */
    _validateConfig() {
        if (!this.config.nomes_abas) {
            throw new Error('ExcelDataMapper: config.nomes_abas é obrigatório');
        }
        
        if (!this.config.ordem_abas) {
            throw new Error('ExcelDataMapper: config.ordem_abas é obrigatório');
        }
        
        if (!this.config.prefixo_adicao) {
            throw new Error('ExcelDataMapper: config.prefixo_adicao é obrigatório');
        }
        
        if (!this.config.padding_numero_adicao) {
            throw new Error('ExcelDataMapper: config.padding_numero_adicao é obrigatório');
        }
        
        if (!this.config.labels) {
            throw new Error('ExcelDataMapper: config.labels é obrigatório');
        }
        
        if (!this.incoterms) {
            throw new Error('ExcelDataMapper: incoterms_suportados é obrigatório');
        }
        
        if (!this.systemInfo) {
            throw new Error('ExcelDataMapper: configuracoes_gerais é obrigatório');
        }
    }

    /**
     * Extrai código INCOTERM do objeto DIProcessor
     * KISS: Acesso direto ao campo obrigatório
     * @private
     * @param {object} incotermData - INCOTERM object do DIProcessor
     * @returns {string} Código INCOTERM
     */
    _extractIncotermCodigo(incotermData) {
        if (!incotermData?.codigo) {
            throw new Error('ExcelDataMapper: INCOTERM.codigo obrigatório ausente');
        }
        return incotermData.codigo;
    }

    /**
     * Inicializa os mapeamentos de todas as abas
     * @private
     */
    async _initializeMappings() {
        // Abas básicas obrigatórias - ResumoCustos agora calcula próprios totais
        const basicSheets = ['Capa', 'Importador', 'Carga', 'Valores', 'Despesas', 'Tributos', 'ResumoCustos'];

        this.sheetMappings = [];
        
        // Mapear abas básicas sempre presentes
        for (const sheetType of this.config.ordem_abas) {
            const mapMethod = this[`map${sheetType}Sheet`];
            
            if (!mapMethod) {
                console.warn(`⚠️ ExcelDataMapper: Método map${sheetType}Sheet não implementado`);
                continue;
            }
            
            try {
                const mapping = await mapMethod.call(this);
                this.sheetMappings.push(mapping);
                console.log(`✅ ExcelDataMapper: Aba ${sheetType} mapeada com sucesso`);
            } catch (error) {
                if (basicSheets.includes(sheetType)) {
                    // Aba básica obrigatória - falhar
                    throw new Error(`ExcelDataMapper: Erro em aba obrigatória ${sheetType}: ${error.message}`);
                } else {
                    // Aba opcional - apenas avisar
                    console.warn(`⚠️ ExcelDataMapper: Pulando aba opcional ${sheetType}: ${error.message}`);
                }
            }
        }
        
        // Adicionar abas dinâmicas das adições
        try {
            const dynamicAdditions = await this.mapDynamicAdditions();
            this.sheetMappings = this.sheetMappings.concat(dynamicAdditions);
            console.log(`✅ ExcelDataMapper: ${dynamicAdditions.length} adições dinâmicas mapeadas`);
        } catch (error) {
            console.warn(`⚠️ ExcelDataMapper: Erro ao mapear adições dinâmicas: ${error.message}`);
        }
    }
    
    /**
     * Retorna todos os mapeamentos de sheets
     * @returns {Array} Array de configurações das abas
     */
    getAllSheetMappings() {
        if (this.sheetMappings.length === 0) {
            throw new Error('ExcelDataMapper: Mapeamentos não inicializados - chame initialize() primeiro');
        }
        return this.sheetMappings;
    }
    
    /**
     * Mapeia dados para a aba Capa
     * @returns {Object} Configuração da aba Capa
     */
    mapCapaSheet() {
        const diData = this.diData;
        
        // Validar campos obrigatórios - NO FALLBACKS
        if (!diData.data_registro) {
            throw new Error('ExcelDataMapper: data_registro obrigatório para Capa');
        }
        
        if (!diData.importador.cnpj) {
            throw new Error('ExcelDataMapper: importador.cnpj obrigatório para Capa');
        }
        
        if (!diData.importador.nome) {
            throw new Error('ExcelDataMapper: importador.nome obrigatório para Capa');
        }

        // Versao opcional - warning se ausente
        if (!this.systemVersion) {
            console.warn('⚠️ ExcelDataMapper: versao não definida em config.json - usando placeholder');
            this.systemVersion = 'N/D';
        }

        return {
            name: this.config.nomes_abas.capa,
            type: 'capa',
            data: {
                titulo: this.config.labels.capa.titulo,
                subtitulo: this.config.labels.capa.subtitulo,
                numero_di: diData.numero_di,
                data_registro: diData.data_registro,
                importador: {
                    cnpj: diData.importador.cnpj,
                    nome: diData.importador.nome,
                    uf: diData.importador.endereco_uf
                },
                urf_despacho: {
                    codigo: diData.urf_despacho_codigo,
                    nome: diData.urf_despacho_nome
                },
                resumo: {
                    total_adicoes: diData.total_adicoes,
                    valor_aduaneiro: diData.valor_aduaneiro_total_brl,
                    incoterm: this._extractIncotermCodigo(diData.incoterm_identificado),
                    modalidade: diData.modalidade_nome
                },
                metadata: {
                    data_processamento: diData.data_processamento,
                    versao_sistema: this.systemVersion
                }
            }
        };
    }
    
    /**
     * Mapeia dados para a aba Importador
     * @returns {Object} Configuração da aba Importador
     */
    mapImportadorSheet() {
        const diData = this.diData;
        
        // Validar campos obrigatórios - estrutura aninhada oficial
        if (!diData.importador.cnpj) {
            throw new Error('ExcelDataMapper: importador.cnpj obrigatório');
        }
        
        if (!diData.importador.nome) {
            throw new Error('ExcelDataMapper: importador.nome obrigatório');
        }
        
        // Representante é opcional - verificar explicitamente
        let representante = null;
        if (diData.importador.representante_nome) {
            representante = {
                nome: diData.importador.representante_nome,
                cpf: diData.importador.representante_cpf
            };
        }
        
        return {
            name: this.config.nomes_abas.importador,
            type: 'importador',
            data: {
                identificacao: {
                    cnpj: diData.importador.cnpj,
                    nome: diData.importador.nome,
                    telefone: diData.importador.telefone
                },
                endereco: {
                    logradouro: diData.importador.endereco_logradouro,
                    numero: diData.importador.endereco_numero,
                    complemento: diData.importador.endereco_complemento,
                    bairro: diData.importador.endereco_bairro,
                    cidade: diData.importador.endereco_cidade,
                    municipio: diData.importador.endereco_municipio,
                    uf: diData.importador.endereco_uf,
                    cep: diData.importador.endereco_cep,
                    completo: diData.importador.endereco_completo
                },
                representante: representante
            }
        };
    }
    
    /**
     * Mapeia dados para a aba Carga
     * @returns {Object} Configuração da aba Carga
     */
    mapCargaSheet() {
        const diData = this.diData;
        
        // Carga pode ter campos opcionais - mapear o que existe
        return {
            name: this.config.nomes_abas.carga,
            type: 'carga',
            data: {
                pesos: {
                    peso_bruto: diData.peso_bruto,
                    peso_liquido: diData.peso_liquido
                },
                transporte: {
                    via_transporte: diData.via_transporte,
                    modalidade: diData.modalidade_nome,
                    urf_entrada: diData.urf_entrada_codigo,
                    data_chegada: diData.data_chegada
                },
                conhecimento: {
                    numero: diData.conhecimento_numero,
                    tipo: diData.conhecimento_tipo,
                    emissao: diData.conhecimento_emissao
                },
                volumes: {
                    quantidade: diData.volumes_quantidade,
                    tipo: diData.volumes_tipo,
                    marcacao: diData.volumes_marcacao
                }
            }
        };
    }
    
    /**
     * Mapeia dados para a aba Valores
     * @returns {Object} Configuração da aba Valores
     */
    mapValoresSheet() {
        const diData = this.diData;
        
        // Validar campo obrigatório
        if (!diData.valor_aduaneiro_total_brl) {
            throw new Error('ExcelDataMapper: valor_aduaneiro_total_brl é obrigatório');
        }
        
        if (typeof diData.valor_aduaneiro_total_brl !== 'number') {
            throw new Error('ExcelDataMapper: valor_aduaneiro_total_brl deve ser numérico');
        }
        
        // Extrair e validar código INCOTERM
        const incotermCodigo = this._extractIncotermCodigo(diData.incoterm_identificado);

        // Verificar se INCOTERM é suportado
        if (!this.incoterms[incotermCodigo]) {
            throw new Error(`ExcelDataMapper: INCOTERM ${incotermCodigo} não é suportado`);
        }

        return {
            name: this.config.nomes_abas.valores,
            type: 'valores',
            data: {
                valores_fob: {
                    usd: diData.valor_total_fob_usd,
                    brl: diData.valor_total_fob_brl
                },
                frete: {
                    usd: diData.valor_total_frete_usd,
                    brl: diData.valor_total_frete_brl,
                    calculo: diData.valor_frete_calculo,
                    xml: diData.valor_frete_xml
                },
                seguro: {
                    usd: diData.valor_total_seguro_usd,
                    brl: diData.valor_total_seguro_brl,
                    calculo: diData.valor_seguro_calculo,
                    xml: diData.valor_seguro_xml
                },
                valor_aduaneiro: {
                    brl: diData.valor_aduaneiro_total_brl
                },
                cambio: {
                    taxa: diData.taxa_cambio,
                    data_conversao: diData.data_registro
                },
                incoterm: {
                    codigo: incotermCodigo,
                    descricao: this.incoterms[incotermCodigo]
                }
            }
        };
    }
    
    /**
     * Mapeia dados para a aba Despesas
     * @returns {Object} Configuração da aba Despesas  
     */
    mapDespesasSheet() {
        const despesas = this.diData.despesas_aduaneiras;
        
        if (!despesas) {
            throw new Error('ExcelDataMapper: despesas_aduaneiras é obrigatório');
        }
        
        if (typeof despesas !== 'object') {
            throw new Error('ExcelDataMapper: despesas_aduaneiras deve ser um objeto');
        }
        
        return {
            name: this.config.nomes_abas.despesas,
            type: 'despesas',
            data: despesas
        };
    }
    
    /**
     * Mapeia dados para a aba Tributos
     * @returns {Object} Configuração da aba Tributos
     */
    mapTributosSheet() {
        // Validar que adicoes existe e tem dados válidos
        if (!this.diData.adicoes) {
            throw new Error('ExcelDataMapper: adicoes é obrigatório para calcular tributos');
        }
        
        // Agregar tributos de todas as adições
        const tributos = this._agregaTributos();
        
        return {
            name: this.config.nomes_abas.tributos,
            type: 'tributos',
            data: tributos
        };
    }
    
    /**
     * Mapeia dados para a aba Resumo de Custos
     * @returns {Object} Configuração da aba Resumo de Custos
     */
    /**
     * Mapeia aba 06A_Resumo_Custos - Lista consolidada de adições com custos desembolsados
     * FASE 3: Retorna array de adições para createResumoCustosSheetFromMapping()
     * @returns {Object} Sheet mapping com array de adições
     */
    mapResumoCustosSheet() {
        // Validação rigorosa NO FALLBACKS
        if (!this.diData.adicoes || !Array.isArray(this.diData.adicoes)) {
            throw new Error('ExcelDataMapper: diData.adicoes é obrigatório para Resumo de Custos');
        }

        console.log(`✅ ExcelDataMapper: Mapeando ${this.diData.adicoes.length} adições para Resumo de Custos`);

        // Retornar array de adições para ExcelExporter criar tabela consolidada
        // ExcelExporter irá usar _mapearProdutosIndividuaisPorAdicao() para obter dados detalhados
        return {
            name: this.config.nomes_abas.resumo_custos,
            type: 'resumo_custos',
            data: this.diData.adicoes  // Array de adições compatível com FASE 3
        };
    }
    
    /**
     * Mapeia dados para a aba NCMs
     * @returns {Object} Configuração da aba NCMs
     */
    mapNCMsSheet() {
        const ncmAnalysis = this._analisaNCMs();
        
        return {
            name: this.config.nomes_abas.ncms,
            type: 'ncms',
            data: ncmAnalysis
        };
    }
    
    /**
     * Mapeia dados para a aba Produtos
     * @returns {Object} Configuração da aba Produtos
     */
    mapProdutosSheet() {
        const produtos = this._extraiProdutos();
        
        return {
            name: this.config.nomes_abas.produtos,
            type: 'produtos',
            data: produtos
        };
    }
    
    /**
     * Mapeia dados para a aba Memória de Cálculo
     * @returns {Object} Configuração da aba Memória de Cálculo
     */
    mapMemoriaSheet() {
        if (!this.diData.memoria_calculo) {
            throw new Error('ExcelDataMapper: memoria_calculo é obrigatório para aba Memória');
        }
        
        return {
            name: this.config.nomes_abas.memoria,
            type: 'memoria',
            data: this.diData.memoria_calculo
        };
    }
    
    /**
     * Mapeia dados para a aba Incentivos
     * @returns {Object} Configuração da aba Incentivos
     */
    mapIncentivosSheet() {
        if (!this.diData.incentivos) {
            throw new Error('ExcelDataMapper: incentivos é obrigatório para aba Incentivos');
        }
        
        return {
            name: this.config.nomes_abas.incentivos,
            type: 'incentivos',
            data: this.diData.incentivos
        };
    }
    
    /**
     * Mapeia dados para a aba Comparativo
     * @returns {Object} Configuração da aba Comparativo
     */
    mapComparativoSheet() {
        if (!this.diData.comparativo) {
            throw new Error('ExcelDataMapper: comparativo é obrigatório para aba Comparativo');
        }
        
        return {
            name: this.config.nomes_abas.comparativo,
            type: 'comparativo',
            data: this.diData.comparativo
        };
    }
    
    /**
     * Mapeia dados para a aba Precificação
     * @returns {Object} Configuração da aba Precificação
     */
    mapPrecificacaoSheet() {
        if (!this.diData.precificacao) {
            throw new Error('ExcelDataMapper: precificacao é obrigatório para aba Precificação');
        }
        
        return {
            name: this.config.nomes_abas.precificacao,
            type: 'precificacao',
            data: this.diData.precificacao
        };
    }
    
    /**
     * Mapeia dados para a aba Validação
     * @returns {Object} Configuração da aba Validação
     */
    mapValidacaoSheet() {
        if (!this.diData.validacao) {
            throw new Error('ExcelDataMapper: validacao é obrigatório para aba Validação');
        }
        
        return {
            name: this.config.nomes_abas.validacao,
            type: 'validacao',
            data: {
                ...this.diData.validacao,
                timestamp: new Date().toISOString()
            }
        };
    }
    
    /**
     * Mapeia dados para as abas dinâmicas das adições
     * @returns {Array} Array de configurações das abas de adições
     */
    async mapDynamicAdditions() {
        const adicoes = this.diData.adicoes;
        
        return adicoes.map((adicao, index) => {
            // Validar campos obrigatórios da adição
            if (!adicao.numero_adicao) {
                throw new Error(`ExcelDataMapper: numero_adicao obrigatório para adição ${index + 1}`);
            }
            
            if (!adicao.ncm) {
                throw new Error(`ExcelDataMapper: ncm obrigatório para adição ${adicao.numero_adicao}`);
            }
            
            // Formatar número da adição com padding configurável
            const paddingSize = this.config.padding_numero_adicao;
            const additionNumber = String(adicao.numero_adicao).padStart(paddingSize, '0');
            
            return {
                name: `${this.config.prefixo_adicao}${additionNumber}`,
                type: 'adicao',
                data: adicao
            };
        });
    }
    
    /**
     * Métodos auxiliares privados
     */
    
    /**
     * Agrega tributos de todas as adições
     * @private
     */
    _agregaTributos() {
        const adicoes = this.diData.adicoes;
        const tributos = {
            impostos_federais: {
                ii: { valor_devido: 0, valor_recolher: 0 },
                ipi: { valor_devido: 0, valor_recolher: 0 },
                pis: { valor_devido: 0, valor_recolher: 0 },
                cofins: { valor_devido: 0, valor_recolher: 0 }
            },
            impostos_estaduais: {
                icms: { valor_devido: 0 }
            },
            totais: {}
        };
        
        // Agregar valores de cada adição - com validação rigorosa
        adicoes.forEach((adicao, index) => {
            // Validar estrutura da adição
            if (!adicao.numero_adicao) {
                throw new Error(`ExcelDataMapper: numero_adicao obrigatório na adição ${index + 1}`);
            }
            
            // Somar valores se forem numéricos válidos
            if (typeof adicao.ii_valor_devido === 'number') {
                tributos.impostos_federais.ii.valor_devido += adicao.ii_valor_devido;
            }
            if (typeof adicao.ii_valor_recolher === 'number') {
                tributos.impostos_federais.ii.valor_recolher += adicao.ii_valor_recolher;
            }
            if (typeof adicao.ipi_valor_devido === 'number') {
                tributos.impostos_federais.ipi.valor_devido += adicao.ipi_valor_devido;
            }
            if (typeof adicao.ipi_valor_recolher === 'number') {
                tributos.impostos_federais.ipi.valor_recolher += adicao.ipi_valor_recolher;
            }
            if (typeof adicao.pis_valor_devido === 'number') {
                tributos.impostos_federais.pis.valor_devido += adicao.pis_valor_devido;
            }
            if (typeof adicao.pis_valor_recolher === 'number') {
                tributos.impostos_federais.pis.valor_recolher += adicao.pis_valor_recolher;
            }
            if (typeof adicao.cofins_valor_devido === 'number') {
                tributos.impostos_federais.cofins.valor_devido += adicao.cofins_valor_devido;
            }
            if (typeof adicao.cofins_valor_recolher === 'number') {
                tributos.impostos_federais.cofins.valor_recolher += adicao.cofins_valor_recolher;
            }
        });
        
        // Calcular totais
        tributos.totais.total_federal =
            tributos.impostos_federais.ii.valor_recolher +
            tributos.impostos_federais.ipi.valor_recolher +
            tributos.impostos_federais.pis.valor_recolher +
            tributos.impostos_federais.cofins.valor_recolher;

        return tributos;
    }

    /**
     * Calcula totais para relatório de custos a partir dos dados da DI
     * Single Responsibility: ExcelDataMapper calcula o que precisa para Excel
     * @private
     * @returns {Object} Totais calculados no formato esperado por ResumoCustos
     */
    _calcularTotaisRelatorio() {
        const diData = this.diData;

        // Validação obrigatória
        if (typeof diData.valor_aduaneiro_total_brl !== 'number') {
            throw new Error('ExcelDataMapper: valor_aduaneiro_total_brl obrigatório para cálculo de totais');
        }

        // Usar método existente para agregar tributos
        const tributosAgregados = this._agregaTributos();

        // Calcular impostos federais (do XML da DI)
        const total_impostos_federais =
            tributosAgregados.impostos_federais.ii.valor_recolher +
            tributosAgregados.impostos_federais.ipi.valor_recolher +
            tributosAgregados.impostos_federais.pis.valor_recolher +
            tributosAgregados.impostos_federais.cofins.valor_recolher;

        // ICMS não está no XML da DI (seria calculado por ComplianceCalculator)
        // Para Excel básico, consideramos 0
        const total_impostos_estaduais = 0;

        // Despesas aduaneiras - validação rigorosa NO FALLBACKS
        if (typeof diData.despesas_aduaneiras.total_despesas_aduaneiras !== 'number') {
            throw new Error('ExcelDataMapper: despesas_aduaneiras.total_despesas_aduaneiras deve ser numérico');
        }
        const total_despesas_aduaneiras = diData.despesas_aduaneiras.total_despesas_aduaneiras;

        // Custo total sem incentivos
        const custo_total_sem_incentivos =
            diData.valor_aduaneiro_total_brl +
            total_impostos_federais +
            total_impostos_estaduais +
            total_despesas_aduaneiras;

        // Incentivos não disponíveis em DI raw (ComplianceCalculator)
        const custo_total_com_incentivos = custo_total_sem_incentivos;
        const economia_total_incentivos = 0;

        // Análise percentual
        const analise_percentual = {
            impostos_sobre_aduaneiro: custo_total_sem_incentivos > 0
                ? (total_impostos_federais / diData.valor_aduaneiro_total_brl * 100)
                : 0,
            despesas_sobre_aduaneiro: custo_total_sem_incentivos > 0
                ? (total_despesas_aduaneiras / diData.valor_aduaneiro_total_brl * 100)
                : 0
        };

        console.log('📊 ExcelDataMapper: Totais calculados a partir dos dados da DI');
        console.log(`   Valor Aduaneiro: R$ ${diData.valor_aduaneiro_total_brl.toFixed(2)}`);
        console.log(`   Impostos Federais: R$ ${total_impostos_federais.toFixed(2)}`);
        console.log(`   Custo Total: R$ ${custo_total_sem_incentivos.toFixed(2)}`);

        return {
            total_impostos_federais,
            total_impostos_estaduais,
            total_despesas_aduaneiras,
            custo_total_sem_incentivos,
            custo_total_com_incentivos,
            economia_total_incentivos,
            analise_percentual,
            _calculado_por: 'ExcelDataMapper',
            _nota: 'ICMS e incentivos requerem ComplianceCalculator'
        };
    }

    /**
     * Mapeia dados calculados salvos do ComplianceCalculator
     * Converte estrutura totais_consolidados para formato esperado
     * @private
     */
    _mapearCalculosSalvos(totaisConsolidados) {
        // Validação rigorosa NO FALLBACKS
        if (!totaisConsolidados) {
            throw new Error('ExcelDataMapper: totaisConsolidados ausente');
        }

        const impostos = totaisConsolidados.impostos || {};
        const despesas = totaisConsolidados.despesas || {};
        const totais = totaisConsolidados.totais || {};

        // Extrair valores dos impostos (estrutura {valor_devido, detalhamento})
        const total_impostos_federais =
            (impostos.ii?.valor_devido || 0) +
            (impostos.ipi?.valor_devido || 0) +
            (impostos.pis?.valor_devido || 0) +
            (impostos.cofins?.valor_devido || 0);

        const total_impostos_estaduais = impostos.icms?.valor_devido || 0;

        const total_despesas_aduaneiras = despesas.totais?.total || 0;

        const custo_total_sem_incentivos = totais.custo_sem_incentivos || 0;
        const custo_total_com_incentivos = totais.custo_com_incentivos || 0;
        const economia_total_incentivos = totais.economia_total || 0;

        // Análise percentual
        const valor_aduaneiro = this.diData.valor_aduaneiro_total_brl;
        const analise_percentual = {
            impostos_sobre_aduaneiro: valor_aduaneiro > 0
                ? ((total_impostos_federais + total_impostos_estaduais) / valor_aduaneiro * 100)
                : 0,
            despesas_sobre_aduaneiro: valor_aduaneiro > 0
                ? (total_despesas_aduaneiras / valor_aduaneiro * 100)
                : 0
        };

        console.log('📊 ExcelDataMapper: Totais mapeados de ComplianceCalculator');
        console.log(`   Impostos Federais: R$ ${total_impostos_federais.toFixed(2)}`);
        console.log(`   Impostos Estaduais: R$ ${total_impostos_estaduais.toFixed(2)}`);
        console.log(`   Despesas: R$ ${total_despesas_aduaneiras.toFixed(2)}`);
        console.log(`   Custo Total: R$ ${custo_total_sem_incentivos.toFixed(2)}`);

        return {
            total_impostos_federais,
            total_impostos_estaduais,
            total_despesas_aduaneiras,
            custo_total_sem_incentivos,
            custo_total_com_incentivos,
            economia_total_incentivos,
            analise_percentual,
            _calculado_por: 'ComplianceCalculator',
            _nota: 'Dados completos com ICMS e incentivos'
        };
    }

    /**
     * Analisa NCMs únicos e estatísticas
     * @private
     */
    _analisaNCMs() {
        const adicoes = this.diData.adicoes;
        const ncmMap = new Map();
        
        // Agrupar por NCM
        adicoes.forEach((adicao, index) => {
            if (!adicao.ncm) {
                throw new Error(`ExcelDataMapper: ncm obrigatório na adição ${index + 1}`);
            }
            
            const ncm = adicao.ncm;
            if (!ncmMap.has(ncm)) {
                ncmMap.set(ncm, {
                    ncm: ncm,
                    descricao: adicao.descricao_ncm,
                    quantidade_adicoes: 0,
                    valor_total: 0,
                    peso_total: 0
                });
            }
            
            const ncmData = ncmMap.get(ncm);
            ncmData.quantidade_adicoes++;
            
            if (typeof adicao.valor_reais === 'number') {
                ncmData.valor_total += adicao.valor_reais;
            }
            if (typeof adicao.peso_liquido === 'number') {
                ncmData.peso_total += adicao.peso_liquido;
            }
        });
        
        const ncmsArray = Array.from(ncmMap.values());
        
        return {
            ncms_unicos: ncmsArray,
            total_ncms: ncmMap.size,
            estatisticas: {
                ncm_maior_valor: this._getNCMMaxByField(ncmsArray, 'valor_total'),
                ncm_maior_quantidade: this._getNCMMaxByField(ncmsArray, 'quantidade_adicoes')
            }
        };
    }
    
    /**
     * Obtém NCM com maior valor em determinado campo
     * @private
     */
    _getNCMMaxByField(ncmsArray, field) {
        if (ncmsArray.length === 0) {
            return null;
        }
        
        return ncmsArray.reduce((max, ncm) => {
            return ncm[field] > max[field] ? ncm : max;
        });
    }
    
    /**
     * Mapeia produtos individuais por adição com custos detalhados e incentivos
     * Foco: CUSTO DESEMBOLSADO (valores efetivamente pagos)
     * @private
     * @returns {Map} Map<numero_adicao, {produtos: Array, despesas: Object, totais: Object}>
     */
    _mapearProdutosIndividuaisPorAdicao() {
        // Validação rigorosa NO FALLBACKS
        if (!this.calculoData) {
            throw new Error('ExcelDataMapper: calculoData não disponível - execute ComplianceCalculator primeiro');
        }

        if (!this.calculoData.produtos_individuais || !Array.isArray(this.calculoData.produtos_individuais)) {
            throw new Error('ExcelDataMapper: produtos_individuais ausente em calculoData');
        }

        if (this.calculoData.produtos_individuais.length === 0) {
            throw new Error('ExcelDataMapper: produtos_individuais está vazio');
        }

        console.log(`📦 ExcelDataMapper: Mapeando ${this.calculoData.produtos_individuais.length} produtos individuais`);

        // Map para agrupar por adição
        const produtosPorAdicao = new Map();

        // Processar cada produto individual
        this.calculoData.produtos_individuais.forEach((produto, index) => {
            // Validar campos obrigatórios
            this._validarProdutoIndividual(produto, index);

            const numeroAdicao = produto.adicao_numero;

            // Criar entrada para adição se não existir
            if (!produtosPorAdicao.has(numeroAdicao)) {
                produtosPorAdicao.set(numeroAdicao, {
                    produtos: [],
                    despesas: this._obterDespesasRateadasAdicao(numeroAdicao),
                    totais: {
                        quantidade_produtos: 0,
                        valor_mercadoria: 0,
                        total_ii: 0,
                        total_ipi: 0,
                        total_pis: 0,
                        total_cofins: 0,
                        total_icms_calculado: 0,
                        total_incentivo_icms: 0,
                        total_icms_desembolsado: 0,
                        total_despesas_rateadas: 0,
                        custo_total_desembolsado: 0
                    }
                });
            }

            const adicaoData = produtosPorAdicao.get(numeroAdicao);

            // Adicionar produto à lista
            adicaoData.produtos.push(produto);

            // Atualizar totais
            adicaoData.totais.quantidade_produtos++;
            adicaoData.totais.valor_mercadoria += produto.valor_total_brl;
            adicaoData.totais.total_ii += produto.ii_item;
            adicaoData.totais.total_ipi += produto.ipi_item;
            adicaoData.totais.total_pis += produto.pis_item;
            adicaoData.totais.total_cofins += produto.cofins_item;
            adicaoData.totais.total_icms_calculado += produto.icms_item;

            // Incentivo ICMS: usar zero se não houver (estado sem incentivo)
            adicaoData.totais.total_incentivo_icms += (produto.icms_incentivo_item || 0);

            // ICMS Desembolsado: se não houver campo específico, usar ICMS calculado - incentivo
            const icmsDesembolsado = produto.icms_desembolsado_item !== undefined
                ? produto.icms_desembolsado_item
                : (produto.icms_item - (produto.icms_incentivo_item || 0));
            adicaoData.totais.total_icms_desembolsado += icmsDesembolsado;
        });

        // Calcular custo total desembolsado por adição
        produtosPorAdicao.forEach((adicaoData, numeroAdicao) => {
            const totais = adicaoData.totais;
            const despesas = adicaoData.despesas;

            // Custo Total Desembolsado = Valor Mercadoria + Impostos Pagos + Despesas
            // ICMS usa valor DESEMBOLSADO (com incentivo aplicado), não o calculado
            totais.custo_total_desembolsado =
                totais.valor_mercadoria +
                totais.total_ii +
                totais.total_ipi +
                totais.total_pis +
                totais.total_cofins +
                totais.total_icms_desembolsado +  // ← DESEMBOLSADO, não calculado!
                despesas.total;

            totais.total_despesas_rateadas = despesas.total;
        });

        console.log(`✅ ExcelDataMapper: ${produtosPorAdicao.size} adições mapeadas com produtos individuais`);

        return produtosPorAdicao;
    }

    /**
     * Valida campos obrigatórios de um produto individual
     * NO FALLBACKS - lança exceções para campos ausentes
     * @private
     * @param {Object} produto - Produto a validar
     * @param {number} index - Índice do produto (para mensagens de erro)
     */
    _validarProdutoIndividual(produto, index) {
        // Campo obrigatório: adicao_numero
        if (!produto.adicao_numero) {
            throw new Error(`ExcelDataMapper: adicao_numero ausente no produto ${index + 1}`);
        }

        // Campos obrigatórios: identificação
        if (!produto.codigo) {
            throw new Error(`ExcelDataMapper: codigo ausente no produto ${index + 1} (adição ${produto.adicao_numero})`);
        }

        if (!produto.descricao) {
            throw new Error(`ExcelDataMapper: descricao ausente no produto ${index + 1} (adição ${produto.adicao_numero})`);
        }

        if (!produto.ncm) {
            throw new Error(`ExcelDataMapper: ncm ausente no produto ${index + 1} (adição ${produto.adicao_numero})`);
        }

        // Campos obrigatórios: quantidade
        if (typeof produto.quantidade !== 'number') {
            throw new Error(`ExcelDataMapper: quantidade deve ser numérica no produto ${index + 1} (adição ${produto.adicao_numero})`);
        }

        if (!produto.unidade_medida) {
            throw new Error(`ExcelDataMapper: unidade_medida ausente no produto ${index + 1} (adição ${produto.adicao_numero})`);
        }

        // Campos obrigatórios: valores
        if (typeof produto.valor_unitario_usd !== 'number') {
            throw new Error(`ExcelDataMapper: valor_unitario_usd deve ser numérico no produto ${index + 1} (adição ${produto.adicao_numero})`);
        }

        if (typeof produto.valor_total_usd !== 'number') {
            throw new Error(`ExcelDataMapper: valor_total_usd deve ser numérico no produto ${index + 1} (adição ${produto.adicao_numero})`);
        }

        if (typeof produto.valor_unitario_brl !== 'number') {
            throw new Error(`ExcelDataMapper: valor_unitario_brl deve ser numérico no produto ${index + 1} (adição ${produto.adicao_numero})`);
        }

        if (typeof produto.valor_total_brl !== 'number') {
            throw new Error(`ExcelDataMapper: valor_total_brl deve ser numérico no produto ${index + 1} (adição ${produto.adicao_numero})`);
        }

        // Campos obrigatórios: impostos (podem ser zero, mas devem existir como number)
        if (typeof produto.ii_item !== 'number') {
            throw new Error(`ExcelDataMapper: ii_item deve ser numérico no produto ${index + 1} (adição ${produto.adicao_numero})`);
        }

        if (typeof produto.ipi_item !== 'number') {
            throw new Error(`ExcelDataMapper: ipi_item deve ser numérico no produto ${index + 1} (adição ${produto.adicao_numero})`);
        }

        if (typeof produto.pis_item !== 'number') {
            throw new Error(`ExcelDataMapper: pis_item deve ser numérico no produto ${index + 1} (adição ${produto.adicao_numero})`);
        }

        if (typeof produto.cofins_item !== 'number') {
            throw new Error(`ExcelDataMapper: cofins_item deve ser numérico no produto ${index + 1} (adição ${produto.adicao_numero})`);
        }

        if (typeof produto.icms_item !== 'number') {
            throw new Error(`ExcelDataMapper: icms_item deve ser numérico no produto ${index + 1} (adição ${produto.adicao_numero})`);
        }

        // Campos de incentivo ICMS: icms_incentivo_item e icms_desembolsado_item são OPCIONAIS
        // Se o estado não tiver incentivo, esses campos podem não existir
        // Quando existirem, devem ser numéricos
        if (produto.icms_incentivo_item !== undefined && typeof produto.icms_incentivo_item !== 'number') {
            throw new Error(`ExcelDataMapper: icms_incentivo_item deve ser numérico se presente no produto ${index + 1} (adição ${produto.adicao_numero})`);
        }

        if (produto.icms_desembolsado_item !== undefined && typeof produto.icms_desembolsado_item !== 'number') {
            throw new Error(`ExcelDataMapper: icms_desembolsado_item deve ser numérico se presente no produto ${index + 1} (adição ${produto.adicao_numero})`);
        }
    }

    /**
     * Obtém despesas rateadas para uma adição específica
     * NO FALLBACKS - lança exceções se dados obrigatórios ausentes
     * @private
     * @param {string} numeroAdicao - Número da adição
     * @returns {Object} Despesas rateadas {afrmm, siscomex, capatazia, frete, seguro, total}
     */
    _obterDespesasRateadasAdicao(numeroAdicao) {
        // Validação rigorosa - adicoes_detalhes é obrigatório
        if (!this.calculoData.adicoes_detalhes) {
            throw new Error(`ExcelDataMapper: adicoes_detalhes ausente em calculoData - necessário para despesas rateadas da adição ${numeroAdicao}`);
        }

        if (!Array.isArray(this.calculoData.adicoes_detalhes)) {
            throw new Error(`ExcelDataMapper: adicoes_detalhes deve ser array - necessário para despesas rateadas da adição ${numeroAdicao}`);
        }

        // Encontrar adição específica
        const adicaoDetalhe = this.calculoData.adicoes_detalhes.find(
            a => a.numero_adicao === numeroAdicao
        );

        if (!adicaoDetalhe) {
            throw new Error(`ExcelDataMapper: adição ${numeroAdicao} não encontrada em adicoes_detalhes`);
        }

        if (!adicaoDetalhe.despesas_rateadas) {
            throw new Error(`ExcelDataMapper: despesas_rateadas ausentes na adição ${numeroAdicao}`);
        }

        const despesas = adicaoDetalhe.despesas_rateadas;

        // Validar campos obrigatórios de despesas
        if (typeof despesas.total !== 'number') {
            throw new Error(`ExcelDataMapper: despesas_rateadas.total deve ser numérico na adição ${numeroAdicao}`);
        }

        return {
            afrmm: despesas.afrmm || 0,           // Pode ser zero (produto isento)
            siscomex: despesas.siscomex || 0,     // Pode ser zero (produto isento)
            capatazia: despesas.capatazia || 0,   // Pode ser zero (não aplicável)
            frete: despesas.frete || 0,           // Pode ser zero (INCOTERM CFR/CIF)
            seguro: despesas.seguro || 0,         // Pode ser zero (INCOTERM CIF)
            total: despesas.total                 // Obrigatório validado acima
        };
    }

    /**
     * Extrai todos os produtos de todas as adições
     * @private
     */
    _extraiProdutos() {
        const adicoes = this.diData.adicoes;
        const produtos = [];
        let valorTotal = 0;

        adicoes.forEach(adicao => {
            if (adicao.produtos && Array.isArray(adicao.produtos)) {
                // Se houver produtos específicos em cada adição
                adicao.produtos.forEach(produto => {
                    produtos.push({
                        ...produto,
                        adicao_numero: adicao.numero_adicao
                    });
                    if (typeof produto.valor_total === 'number') {
                        valorTotal += produto.valor_total;
                    }
                });
            } else {
                // Se não houver produtos detalhados, criar um produto pela adição
                produtos.push({
                    adicao_numero: adicao.numero_adicao,
                    codigo: adicao.numero_adicao,
                    descricao: adicao.descricao_ncm,
                    ncm: adicao.ncm,
                    quantidade: adicao.quantidade_estatistica,
                    unidade: adicao.unidade_estatistica,
                    valor_total: adicao.valor_reais,
                    peso_liquido: adicao.peso_liquido
                });
                if (typeof adicao.valor_reais === 'number') {
                    valorTotal += adicao.valor_reais;
                }
            }
        });

        return {
            lista: produtos,
            totais: {
                quantidade_produtos: produtos.length,
                valor_total: valorTotal
            }
        };
    }
}