/**
 * DIProcessor - Parser XML para Declarações de Importação (DI)
 * Migrated from legacy system to new ES6 module architecture
 */

import { ConfigLoader } from '@shared/utils/ConfigLoader.js';
import { IncentiveManager } from '@core/incentives/IncentiveManager.js';

export class DIProcessor {
    constructor() {
        this.diData = {};
        this.originalXmlContent = null;
        this.incotermIdentificado = null;
        this.configsLoaded = false;
        this.incentiveManager = new IncentiveManager();
        this.loadConfigurations();
    }
    
    /**
     * Carrega configurações necessárias
     */
    async loadConfigurations() {
        try {
            // Carrega códigos de receita
            const codigosResponse = await fetch(new URL('../../shared/data/codigos-receita.json', import.meta.url));
            this.codigosReceita = await codigosResponse.json();
            
            this.configsLoaded = true;
            console.log('[DIProcessor] Configurações carregadas com sucesso');
        } catch (error) {
            console.error('[DIProcessor] Erro ao carregar configurações:', error);
            throw new Error('Configurações obrigatórias não disponíveis - sistema não pode prosseguir');
        }
    }

    /**
     * Ensure configurations are loaded before using them
     */
    async ensureConfigsLoaded() {
        if (!this.configsLoaded) {
            await this.loadConfigurations();
        }
    }

    /**
     * Converte valores do XML respeitando formato específico de cada tipo
     * @param {string} rawValue - Valor bruto do XML
     * @param {string} type - Tipo de conversão (monetary, weight, percentage, integer)
     * @returns {number} Valor convertido
     */
    convertValue(rawValue, type = 'integer') {
        if (!rawValue || rawValue === '0'.repeat(rawValue.length)) {
            return 0;
        }
        
        const value = parseInt(rawValue);
        
        switch(type) {
            case 'monetary':
                // Valores monetários em centavos: 10120 → 101.20
                return value / 100;
                
            case 'weight':
                // Pesos com 5 decimais: 20000 → 0.20000 kg (conforme DI oficial)
                return value / 100000;
                
            case 'unit_value':
                // Valor unitário com 7 decimais: 44682000000 → 4468.20
                return value / 10000000;
                
            case 'percentage':
                // Alíquotas em centésimos: 650 → 6.50%
                return value / 100;
                
            case 'integer':
            default:
                return value;
        }
    }

    /**
     * Método principal para parsing do XML
     * @param {string} xmlContent - Conteúdo do arquivo XML
     * @returns {Object} Dados estruturados da DI
     */
    async parseXML(xmlContent) {
        try {
            this.originalXmlContent = xmlContent;
            
            // Parse do XML usando DOMParser
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
            
            // Verificar se houve erros no parsing
            const parseError = xmlDoc.querySelector("parsererror");
            if (parseError) {
                throw new Error("Erro ao fazer parse do XML: " + parseError.textContent);
            }

            // Identificar incoterm automaticamente
            this.identifyIncoterm(xmlDoc);

            // Extrair dados gerais da DI
            this.extractDadosGerais(xmlDoc);
            
            // Extrair informações do importador
            this.extractImportador(xmlDoc);
            
            // Extrair dados da carga
            this.extractDadosCarga(xmlDoc);
            
            // Extrair adições
            this.extractAdicoes(xmlDoc);
            
            // Extrair informações complementares
            this.extractInformacoesComplementares(xmlDoc);
            
            // ===== CORREÇÃO CRÍTICA: Extrair despesas aduaneiras =====
            await this.extractDespesasAduaneiras(xmlDoc);
            
            // Processar múltiplas moedas e taxas de câmbio
            await this.processarMultiplasMoedas(xmlDoc);
            
            // Calcular totais
            this.calculateTotals();
            
            // Adicionar incoterm identificado aos dados gerais
            this.diData.incoterm_identificado = this.incotermIdentificado;
            
            return this.diData;
            
        } catch (error) {
            console.error('Erro no parsing XML:', error);
            throw new Error(`Erro ao processar XML: ${error.message}`);
        }
    }

    /**
     * Identifica automaticamente o incoterm da DI
     * Verifica a primeira adição para determinar o incoterm padrão
     */
    identifyIncoterm(xmlDoc) {
        const primeiraAdicao = xmlDoc.querySelector('adicao');
        
        if (primeiraAdicao) {
            const incoterm = this.getTextContent(primeiraAdicao, 'condicaoVendaIncoterm');
            
            if (incoterm) {
                this.incotermIdentificado = {
                    codigo: incoterm,
                    descricao: this.getIncotermDescription(incoterm),
                    frete_incluido: this.isFreteIncluidoIncoterm(incoterm),
                    seguro_incluido: this.isSeguroIncluidoIncoterm(incoterm),
                    responsabilidade_importador: this.getResponsabilidadeImportador(incoterm)
                };
                
                console.log(`Incoterm identificado: ${incoterm} - ${this.incotermIdentificado.descricao}`);
            }
        }
    }

    /**
     * Retorna descrição do incoterm
     */
    getIncotermDescription(incoterm) {
        const incoterms = {
            'EXW': 'Ex Works - Na fábrica',
            'FCA': 'Free Carrier - Transportador livre',
            'CPT': 'Carriage Paid To - Transporte pago até',
            'CIP': 'Carriage and Insurance Paid - Transporte e seguro pagos',
            'DAT': 'Delivered at Terminal - Entregue no terminal',
            'DAP': 'Delivered at Place - Entregue no local',
            'DDP': 'Delivered Duty Paid - Entregue com direitos pagos',
            'FAS': 'Free Alongside Ship - Livre ao lado do navio',
            'FOB': 'Free on Board - Livre a bordo',
            'CFR': 'Cost and Freight - Custo e frete',
            'CIF': 'Cost, Insurance and Freight - Custo, seguro e frete'
        };
        
        return incoterms[incoterm] || `Incoterm ${incoterm}`;
    }

    /**
     * Verifica se o frete está incluído no incoterm
     */
    isFreteIncluidoIncoterm(incoterm) {
        const incotermComFrete = ['CPT', 'CIP', 'DAT', 'DAP', 'DDP', 'CFR', 'CIF'];
        return incotermComFrete.includes(incoterm);
    }

    /**
     * Verifica se o seguro está incluído no incoterm
     */
    isSeguroIncluidoIncoterm(incoterm) {
        const incotermComSeguro = ['CIP', 'DDP', 'CIF'];
        return incotermComSeguro.includes(incoterm);
    }

    /**
     * Retorna responsabilidades do importador baseado no incoterm
     */
    getResponsabilidadeImportador(incoterm) {
        const responsabilidades = {
            'EXW': 'Máxima responsabilidade - Importador assume todos os custos e riscos',
            'FCA': 'Alta responsabilidade - Importador assume custos de transporte principal',
            'CPT': 'Responsabilidade moderada - Frete pago pelo exportador',
            'CIP': 'Responsabilidade moderada - Frete e seguro pagos pelo exportador',
            'DAT': 'Baixa responsabilidade - Entrega no terminal de destino',
            'DAP': 'Baixa responsabilidade - Entrega no local acordado',
            'DDP': 'Mínima responsabilidade - Exportador assume praticamente tudo',
            'FAS': 'Alta responsabilidade - Importador assume frete marítimo e seguros',
            'FOB': 'Responsabilidade moderada-alta - Importador assume frete e seguro marítimo',
            'CFR': 'Responsabilidade moderada - Frete pago pelo exportador, seguro por conta do importador',
            'CIF': 'Responsabilidade moderada - Frete e seguro básico pagos pelo exportador'
        };
        
        return responsabilidades[incoterm] || 'Responsabilidade conforme acordo';
    }

    /**
     * Extrai dados gerais da DI
     */
    extractDadosGerais(xmlDoc) {
        const diNode = xmlDoc.querySelector('declaracaoImportacao');
        
        if (!diNode) {
            throw new Error('Estrutura XML inválida: não foi encontrado o nó declaracaoImportacao');
        }

        this.diData.numero_di = this.getTextContent(diNode, 'numeroDI');
        this.diData.data_registro = this.formatDate(this.getTextContent(diNode, 'dataRegistro'));
        this.diData.urf_despacho_codigo = this.getTextContent(diNode, 'urfDespachoCodigo');
        this.diData.urf_despacho_nome = this.getTextContent(diNode, 'urfDespachoNome');
        this.diData.modalidade_codigo = this.getTextContent(diNode, 'modalidadeDespachoCodigo');
        this.diData.modalidade_nome = this.getTextContent(diNode, 'modalidadeDespachoNome');
        this.diData.situacao_entrega = this.getTextContent(diNode, 'situacaoEntregaCarga');
        this.diData.total_adicoes = parseInt(this.getTextContent(diNode, 'totalAdicoes')) || 0;
    }

    /**
     * Extrai dados do importador
     */
    extractImportador(xmlDoc) {
        const diNode = xmlDoc.querySelector('declaracaoImportacao');
        
        this.diData.importador = {
            nome: this.getTextContent(diNode, 'importadorNome'),
            cnpj: this.formatCNPJ(this.getTextContent(diNode, 'importadorNumero')),
            endereco_logradouro: this.getTextContent(diNode, 'importadorEnderecoLogradouro'),
            endereco_numero: this.getTextContent(diNode, 'importadorEnderecoNumero'),
            endereco_complemento: this.getTextContent(diNode, 'importadorEnderecoComplemento'),
            endereco_bairro: this.getTextContent(diNode, 'importadorEnderecoBairro'),
            endereco_cidade: this.getTextContent(diNode, 'importadorEnderecoCidade'),
            endereco_municipio: this.getTextContent(diNode, 'importadorEnderecoMunicipio'),
            endereco_uf: this.getTextContent(diNode, 'importadorEnderecoUf'),
            endereco_cep: this.formatCEP(this.getTextContent(diNode, 'importadorEnderecoCep')),
            representante_nome: this.getTextContent(diNode, 'importadorNomeRepresentanteLegal'),
            representante_cpf: this.formatCPF(this.getTextContent(diNode, 'importadorCpfRepresentanteLegal')),
            telefone: this.getTextContent(diNode, 'importadorNumeroTelefone')
        };

        // Montar endereço completo
        this.diData.importador.endereco_completo = this.buildEnderecoCompleto(this.diData.importador);
    }

    /**
     * Extrai dados da carga
     */
    extractDadosCarga(xmlDoc) {
        const diNode = xmlDoc.querySelector('declaracaoImportacao');
        
        this.diData.carga = {
            peso_bruto: this.parseNumber(this.getTextContent(diNode, 'cargaPesoBruto'), 100000),
            peso_liquido: this.convertValue(this.getTextContent(diNode, 'cargaPesoLiquido'), 'weight'),
            pais_procedencia_codigo: this.getTextContent(diNode, 'cargaPaisProcedenciaCodigo'),
            pais_procedencia_nome: this.getTextContent(diNode, 'cargaPaisProcedenciaNome'),
            urf_entrada_codigo: this.getTextContent(diNode, 'cargaUrfEntradaCodigo'),
            urf_entrada_nome: this.getTextContent(diNode, 'cargaUrfEntradaNome'),
            data_chegada: this.formatDate(this.getTextContent(diNode, 'cargaDataChegada')),
            via_transporte_codigo: this.getTextContent(diNode, 'viaTransporteCodigo'),
            via_transporte_nome: this.getTextContent(diNode, 'viaTransporteNome'),
            nome_veiculo: this.getTextContent(diNode, 'viaTransporteNomeTransportador'), // Corrigido: campo era incorreto
            nome_transportador: this.getTextContent(diNode, 'viaTransporteNomeTransportador')
        };
    }

    /**
     * Extrai todas as adições
     */
    extractAdicoes(xmlDoc) {
        const adicaoNodes = xmlDoc.querySelectorAll('adicao');
        this.diData.adicoes = [];

        adicaoNodes.forEach((adicaoNode, index) => {
            const adicao = this.extractAdicao(adicaoNode, index + 1);
            this.diData.adicoes.push(adicao);
        });
    }

    /**
     * Extrai uma adição específica
     */
    extractAdicao(adicaoNode, numeroAdicao) {
        const incoterm = this.getTextContent(adicaoNode, 'condicaoVendaIncoterm');
        
        const adicao = {
            numero_adicao: numeroAdicao.toString().padStart(3, '0'),
            
            // Classificação fiscal
            ncm: this.getTextContent(adicaoNode, 'dadosMercadoriaCodigoNcm'),
            descricao_ncm: this.getTextContent(adicaoNode, 'dadosMercadoriaNomeNcm'),
            codigo_naladi_sh: this.getTextContent(adicaoNode, 'dadosMercadoriaCodigoNaladiSH'),
            codigo_naladi_ncca: this.getTextContent(adicaoNode, 'dadosMercadoriaCodigoNaladiNCCA'),
            
            // Medidas e quantidades
            peso_liquido: this.convertValue(this.getTextContent(adicaoNode, 'dadosMercadoriaPesoLiquido'), 'weight'),
            quantidade_estatistica: this.convertValue(this.getTextContent(adicaoNode, 'dadosMercadoriaMedidaEstatisticaQuantidade'), 'weight'),
            unidade_estatistica: this.getTextContent(adicaoNode, 'dadosMercadoriaMedidaEstatisticaUnidade'),
            aplicacao_mercadoria: this.getTextContent(adicaoNode, 'dadosMercadoriaAplicacao'),
            condicao_mercadoria: this.getTextContent(adicaoNode, 'dadosMercadoriaCondicao'),
            
            // Valores comerciais e incoterm
            condicao_venda_incoterm: incoterm,
            incoterm_detalhes: {
                codigo: incoterm,
                descricao: this.getIncotermDescription(incoterm),
                frete_incluido: this.isFreteIncluidoIncoterm(incoterm),
                seguro_incluido: this.isSeguroIncluidoIncoterm(incoterm)
            },
            condicao_venda_local: this.getTextContent(adicaoNode, 'condicaoVendaLocal'),
            moeda_negociacao_codigo: this.getTextContent(adicaoNode, 'condicaoVendaMoedaCodigo'),
            moeda_negociacao_nome: this.getTextContent(adicaoNode, 'condicaoVendaMoedaNome'),
            valor_moeda_negociacao: this.convertValue(this.getTextContent(adicaoNode, 'condicaoVendaValorMoeda'), 'monetary'),
            valor_reais: this.convertValue(this.getTextContent(adicaoNode, 'condicaoVendaValorReais'), 'monetary'),
            
            // Método de valoração
            metodo_valoracao_codigo: this.getTextContent(adicaoNode, 'condicaoVendaMetodoValoracaoCodigo'),
            metodo_valoracao_nome: this.getTextContent(adicaoNode, 'condicaoVendaMetodoValoracaoNome'),
            
            // Dados do fornecedor
            fornecedor: this.extractFornecedor(adicaoNode),
            
            // Dados do fabricante  
            fabricante: this.extractFabricante(adicaoNode),
            
            // Tributos federais
            tributos: this.extractTributos(adicaoNode),
            
            // Frete e seguro (com análise baseada no incoterm)
            frete_valor_moeda_negociada: this.convertValue(this.getTextContent(adicaoNode, 'freteValorMoedaNegociada'), 'monetary'),
            frete_valor_reais: this.convertValue(this.getTextContent(adicaoNode, 'freteValorReais'), 'monetary'),
            frete_responsabilidade: this.isFreteIncluidoIncoterm(incoterm) ? 'Exportador' : 'Importador',
            seguro_valor_moeda_negociada: this.convertValue(this.getTextContent(adicaoNode, 'seguroValorMoedaNegociada'), 'monetary'),
            seguro_valor_reais: this.convertValue(this.getTextContent(adicaoNode, 'seguroValorReais'), 'monetary'),
            seguro_responsabilidade: this.isSeguroIncluidoIncoterm(incoterm) ? 'Exportador' : 'Importador',
            
            // Relacionamento comercial
            codigo_relacao_comprador_vendedor: this.getTextContent(adicaoNode, 'codigoRelacaoCompradorVendedor'),
            codigo_vinculo_comprador_vendedor: this.getTextContent(adicaoNode, 'codigoVinculoCompradorVendedor'),
            
            // DCR (Drawback)
            dcr_identificacao: this.getTextContent(adicaoNode, 'dcrIdentificacao'),
            dcr_valor_devido: this.parseNumber(this.getTextContent(adicaoNode, 'dcrValorDevido'), 100),
            dcr_valor_recolher: this.parseNumber(this.getTextContent(adicaoNode, 'dcrValorRecolher'), 100)
        };

        // Extrair produtos após ter os dados da adição
        adicao.produtos = this.extractProdutos(adicaoNode, numeroAdicao, adicao);

        // NOVO: Detectar incentivos fiscais para esta adição
        adicao.incentivos_detectados = this.detectIncentivosParaAdicao(adicao);

        return adicao;
    }

    /**
     * Detecta incentivos fiscais aplicáveis para uma adição
     * @param {object} adicao - Dados da adição processada
     * @returns {object} Incentivos detectados e aplicabilidade
     */
    detectIncentivosParaAdicao(adicao) {
        try {
            if (!this.incentiveManager || !adicao.ncm) {
                return {
                    aplicaveis: [],
                    detectados: false,
                    motivo: 'IncentiveManager não disponível ou NCM ausente'
                };
            }

            // Estado de destino vem da DI (importador)
            const estadoDestino = this.diData.importador_endereco_uf;
            if (!estadoDestino) {
                return {
                    aplicaveis: [],
                    detectados: false,
                    motivo: 'Estado de destino não identificado na DI'
                };
            }

            // Obter programas disponíveis para o estado (método existente)
            const programasDisponiveis = this.incentiveManager.getAvailablePrograms(estadoDestino);
            
            const incentivosAplicaveis = [];
            for (const programa of programasDisponiveis) {
                try {
                    // Usar método existente validateEligibility
                    const validacao = this.incentiveManager.validateEligibility(estadoDestino, programa.codigo, [adicao.ncm]);
                    if (validacao.elegivel) {
                        incentivosAplicaveis.push({
                            programa: programa.codigo,
                            nome: programa.nome,
                            elegivel: true,
                            beneficios: validacao.beneficios_estimados
                        });
                    }
                } catch (error) {
                    console.warn(`Erro ao validar programa ${programa.codigo} para NCM ${adicao.ncm}:`, error.message);
                }
            }
            
            return {
                aplicaveis: incentivosAplicaveis,
                detectados: incentivosAplicaveis.length > 0,
                estado_destino: estadoDestino,
                ncm_analisado: adicao.ncm,
                motivo: incentivosAplicaveis.length > 0 ? 'Incentivos disponíveis' : 'Nenhum incentivo aplicável'
            };

        } catch (error) {
            console.error('Erro ao detectar incentivos para adição:', error);
            return {
                aplicaveis: [],
                detectados: false,
                motivo: `Erro na detecção: ${error.message}`
            };
        }
    }

    /**
     * Extrai dados do fornecedor
     */
    extractFornecedor(adicaoNode) {
        return {
            nome: this.getTextContent(adicaoNode, 'fornecedorNome'),
            logradouro: this.getTextContent(adicaoNode, 'fornecedorLogradouro'),
            numero: this.getTextContent(adicaoNode, 'fornecedorNumero'),
            complemento: this.getTextContent(adicaoNode, 'fornecedorComplemento'),
            cidade: this.getTextContent(adicaoNode, 'fornecedorCidade'),
            estado: this.getTextContent(adicaoNode, 'fornecedorEstado'),
            endereco_completo: `${this.getTextContent(adicaoNode, 'fornecedorLogradouro')}, ${this.getTextContent(adicaoNode, 'fornecedorNumero')} - ${this.getTextContent(adicaoNode, 'fornecedorCidade')}, ${this.getTextContent(adicaoNode, 'fornecedorEstado')}`
        };
    }

    /**
     * Extrai dados do fabricante
     */
    extractFabricante(adicaoNode) {
        return {
            nome: this.getTextContent(adicaoNode, 'fabricanteNome'),
            logradouro: this.getTextContent(adicaoNode, 'fabricanteLogradouro'),
            numero: this.getTextContent(adicaoNode, 'fabricanteNumero'),
            cidade: this.getTextContent(adicaoNode, 'fabricanteCidade'),
            estado: this.getTextContent(adicaoNode, 'fabricanteEstado'),
            endereco_completo: `${this.getTextContent(adicaoNode, 'fabricanteLogradouro')} - ${this.getTextContent(adicaoNode, 'fabricanteCidade')}, ${this.getTextContent(adicaoNode, 'fabricanteEstado')}`
        };
    }

    /**
     * Extrai tributos da adição usando campos diretos do XML real
     * Substitui estrutura XSD array por extração direta compatível com ComplianceCalculator
     */
    extractTributos(adicaoNode) {
        const tributos = {
            // II - Imposto de Importação
            ii_aliquota_ad_valorem: this.convertValue(this.getTextContent(adicaoNode, 'iiAliquotaAdValorem'), 'percentage'),
            ii_valor_devido: this.convertValue(this.getTextContent(adicaoNode, 'iiAliquotaValorDevido'), 'monetary'),
            ii_valor_recolher: this.convertValue(this.getTextContent(adicaoNode, 'iiAliquotaValorRecolher'), 'monetary'),
            ii_base_calculo: this.convertValue(this.getTextContent(adicaoNode, 'iiBaseCalculo'), 'monetary'),
            ii_regime_nome: this.getTextContent(adicaoNode, 'iiRegimeTributacaoNome'),
            ii_aliquota_reduzida: this.convertValue(this.getTextContent(adicaoNode, 'iiAliquotaReduzida'), 'percentage'),
            
            // IPI - Imposto sobre Produtos Industrializados
            ipi_aliquota_ad_valorem: this.convertValue(this.getTextContent(adicaoNode, 'ipiAliquotaAdValorem'), 'percentage'),
            ipi_valor_devido: this.convertValue(this.getTextContent(adicaoNode, 'ipiAliquotaValorDevido'), 'monetary'),
            ipi_valor_recolher: this.convertValue(this.getTextContent(adicaoNode, 'ipiAliquotaValorRecolher'), 'monetary'),
            ipi_regime_nome: this.getTextContent(adicaoNode, 'ipiRegimeTributacaoNome'),
            ipi_aliquota_reduzida: this.convertValue(this.getTextContent(adicaoNode, 'ipiAliquotaReduzida'), 'percentage'),
            
            // PIS/PASEP
            pis_aliquota_ad_valorem: this.convertValue(this.getTextContent(adicaoNode, 'pisPasepAliquotaAdValorem'), 'percentage'),
            pis_valor_devido: this.convertValue(this.getTextContent(adicaoNode, 'pisPasepAliquotaValorDevido'), 'monetary'),
            pis_valor_recolher: this.convertValue(this.getTextContent(adicaoNode, 'pisPasepAliquotaValorRecolher'), 'monetary'),
            pis_aliquota_reduzida: this.convertValue(this.getTextContent(adicaoNode, 'pisPasepAliquotaReduzida'), 'percentage'),
            
            // COFINS
            cofins_aliquota_ad_valorem: this.convertValue(this.getTextContent(adicaoNode, 'cofinsAliquotaAdValorem'), 'percentage'),
            cofins_valor_devido: this.convertValue(this.getTextContent(adicaoNode, 'cofinsAliquotaValorDevido'), 'monetary'),
            cofins_valor_recolher: this.convertValue(this.getTextContent(adicaoNode, 'cofinsAliquotaValorRecolher'), 'monetary'),
            cofins_aliquota_reduzida: this.convertValue(this.getTextContent(adicaoNode, 'cofinsAliquotaReduzida'), 'percentage'),
            
            // CIDE (Contribuição de Intervenção no Domínio Econômico)
            cide_valor_devido: this.convertValue(this.getTextContent(adicaoNode, 'cideValorDevido'), 'monetary'),
            cide_valor_recolher: this.convertValue(this.getTextContent(adicaoNode, 'cideValorRecolher'), 'monetary'),
            cide_valor_aliquota_especifica: this.convertValue(this.getTextContent(adicaoNode, 'cideValorAliquotaEspecifica'), 'monetary'),
            
            // Base cálculo compartilhada PIS/COFINS
            pis_cofins_base_calculo: this.convertValue(this.getTextContent(adicaoNode, 'pisCofinsBaseCalculoValor'), 'monetary')
        };
        
        // NO FALLBACKS validation - verificar se pelo menos II tem dados básicos
        if (tributos.ii_aliquota_ad_valorem === null && tributos.ii_valor_devido === null) {
            throw new Error('Dados básicos de II obrigatórios não encontrados na DI - verificar estrutura XML');
        }
        
        return tributos;
    }

    /**
     * Extrai produtos de uma adição
     */
    extractProdutos(adicaoNode, numeroAdicao, adicaoData) {
        const produtoNodes = adicaoNode.querySelectorAll('mercadoria');
        const produtos = [];

        // Calcular taxa de câmbio da adição atual
        const valorMoedaNegociacao = adicaoData.valor_moeda_negociacao;
        const valorReais = adicaoData.valor_reais;
        
        if (!valorMoedaNegociacao || !valorReais || valorMoedaNegociacao <= 0) {
            throw new Error(`Taxa de câmbio não pode ser calculada para adição ${numeroAdicao}: valorMoedaNegociacao=${valorMoedaNegociacao}, valorReais=${valorReais}`);
        }
        
        const taxa_cambio = valorReais / valorMoedaNegociacao;
        
        // Adicionar taxa de câmbio aos dados da adição
        adicaoData.taxa_cambio = taxa_cambio;

        produtoNodes.forEach(produtoNode => {
            // Extrair dados originais da DI
            const quantidadeOriginal = this.convertValue(this.getTextContent(produtoNode, 'quantidade'), 'weight');
            const unidadeOriginal = this.getTextContent(produtoNode, 'unidadeMedida').trim();
            const valorUnitarioUSD = this.convertValue(this.getTextContent(produtoNode, 'valorUnitario'), 'unit_value');
            
            const produto = {
                adicao_numero: numeroAdicao.toString().padStart(3, '0'),
                numero_sequencial_item: this.getTextContent(produtoNode, 'numeroSequencialItem'),
                descricao_mercadoria: this.getTextContent(produtoNode, 'descricaoMercadoria').trim(),
                
                // Quantidade e unidade
                quantidade: quantidadeOriginal,
                unidade_medida: unidadeOriginal,
                
                // Valores em USD (moeda original da DI)
                valor_unitario_usd: valorUnitarioUSD,
                valor_total_usd: quantidadeOriginal * valorUnitarioUSD,
                
                // Valores em BRL (convertidos pela taxa de câmbio da DI)
                valor_unitario_brl: valorUnitarioUSD * taxa_cambio,
                valor_total_brl: quantidadeOriginal * valorUnitarioUSD * taxa_cambio,
                taxa_cambio: taxa_cambio,
                
                // Campos para compatibilidade (USD por padrão)
                valor_unitario: valorUnitarioUSD,
                valor_total_item: quantidadeOriginal * valorUnitarioUSD
            };

            produtos.push(produto);
        });

        return produtos;
    }

    /**
     * Extrai informações complementares
     */
    extractInformacoesComplementares(xmlDoc) {
        const infoComplementar = this.getTextContent(xmlDoc, 'informacaoComplementar');
        
        this.diData.informacoes_complementares = {
            texto_completo: infoComplementar,
            dados_extraidos: this.parseInformacoesComplementares(infoComplementar)
        };
    }

    /**
     * Extrai taxas de câmbio do campo informação complementar
     * Procura padrão "TAXA CAMBIAL.....: valor1 valor2 ..." 
     */
    extrairTaxasCambio(infoComplementar) {
        const taxas = [];
        
        if (!infoComplementar) return taxas;
        
        // Procurar padrão "TAXA CAMBIAL.....: valor1 valor2 ..."
        const padraoTaxa = /TAXA\s+CAMBIAL[^:]*:\s*([\d,.\s]+)/i;
        const match = infoComplementar.match(padraoTaxa);
        
        if (match) {
            const valoresStr = match[1].trim();
            // Extrair números decimais válidos
            const valores = valoresStr.match(/\d+[,.]?\d*/g) || [];
            
            valores.forEach(valor => {
                const valorLimpo = valor.replace(',', '.');
                const taxa = parseFloat(valorLimpo);
                if (taxa > 0) {
                    taxas.push(taxa);
                }
            });
        }
        
        return taxas;
    }

    /**
     * Identifica moedas usadas na DI e associa com taxas de câmbio
     */
    identificarMoedasETaxas(xmlDoc, taxas) {
        const moedas = new Map();
        const diNode = xmlDoc.querySelector('declaracaoImportacao');
        
        // Coletar moedas em ordem de aparição
        const moedasEncontradas = [];
        
        // 1. Moeda da condição de venda (VCMV)
        const primeiraAdicao = diNode.querySelector('adicao');
        if (primeiraAdicao) {
            const codVcmv = this.getTextContent(primeiraAdicao, 'condicaoVendaMoedaCodigo');
            if (codVcmv && codVcmv !== '000') {
                moedasEncontradas.push(codVcmv);
            }
        }
        
        // 2. Moeda do frete
        const codFrete = this.getTextContent(diNode, 'freteMoedaNegociadaCodigo');
        if (codFrete && codFrete !== '000' && !moedasEncontradas.includes(codFrete)) {
            moedasEncontradas.push(codFrete);
        }
        
        // 3. Moeda do seguro
        const codSeguro = this.getTextContent(diNode, 'seguroMoedaNegociadaCodigo');
        if (codSeguro && codSeguro !== '000' && !moedasEncontradas.includes(codSeguro)) {
            moedasEncontradas.push(codSeguro);
        }
        
        // 4. Se não encontrou moedas explícitas mas tem taxas, erro - moeda obrigatória
        if (moedasEncontradas.length === 0 && taxas.length > 0) {
            throw new Error('Taxa de câmbio encontrada mas código de moeda não identificado na DI');
        }
        
        // Associar taxas às moedas usando ConfigLoader
        moedasEncontradas.forEach((codigo, index) => {
            // Obter info da moeda via ConfigLoader (fail-fast se não cadastrada)
            let info;
            try {
                // Usar o ConfigLoader criado anteriormente
                const configLoader = new ConfigLoader();
                const moedaInfo = configLoader.isLoaded() ? 
                    configLoader.getCurrencyInfo(codigo) : 
                    { codigo_iso: `MOEDA_${codigo}`, nome: `Moeda código ${codigo}` };
                    
                info = {
                    nome: moedaInfo.nome,
                    sigla: moedaInfo.codigo_iso
                };
            } catch (error) {
                console.warn(`Moeda ${codigo} não cadastrada no sistema, usando fallback`);
                info = {
                    sigla: `MOEDA_${codigo}`,
                    nome: `Moeda código ${codigo}`
                };
            }
            
            moedas.set(codigo, {
                codigo,
                nome: info.nome,
                sigla: info.sigla,
                taxa: taxas[index] || 0,
                ordem: index
            });
        });
        
        return moedas;
    }

    /**
     * Obtem dados da moeda VMLE/VMLD direto da DI (DATA-DRIVEN)
     * A DI é a fonte da verdade - não validamos, apenas processamos
     */
    obterMoedaVmleVmld(xmlDoc) {
        const diNode = xmlDoc.querySelector('declaracaoImportacao');
        
        // DADOS DIRETOS DA DI - FONTE DA VERDADE
        const vmleDolares = this.parseNumber(this.getTextContent(diNode, 'localEmbarqueTotalDolares'), 100);
        const vmleReais = this.parseNumber(this.getTextContent(diNode, 'localEmbarqueTotalReais'), 100);
        
        // Obter código da moeda da primeira adição (padrão das DIs brasileiras)
        const primeiraAdicao = diNode.querySelector('adicao');
        const codigoMoeda = this.getTextContent(primeiraAdicao, 'condicaoVendaMoedaCodigo');
        
        // FAIL-FAST apenas se dados estruturais obrigatórios ausentes
        if (!vmleDolares || !vmleReais || !codigoMoeda) {
            throw new Error('Dados estruturais VMLE/VMLD ausentes na DI - DI mal formada');
        }
        
        // Taxa calculada = FONTE DA VERDADE (não há "validação", apenas cálculo)
        const taxaCalculada = vmleReais / vmleDolares;
        
        console.log(`📊 Moeda VMLE/VMLD: ${codigoMoeda}, Taxa: ${taxaCalculada.toFixed(4)} BRL`);
        
        return {
            codigo: codigoMoeda,
            taxa: taxaCalculada,
            vmle_usd: vmleDolares,
            vmle_brl: vmleReais
        };
    }

    /**
     * Converte valor de uma moeda específica para reais
     */
    converterParaReais(valor, codigoMoeda, moedas) {
        if (!valor || valor === 0 || codigoMoeda === '000') {
            return 0;
        }
        
        const moeda = moedas.get(codigoMoeda);
        if (!moeda || !moeda.taxa) {
            console.warn(`Taxa de câmbio não encontrada para moeda ${codigoMoeda}`);
            return 0;
        }
        
        return valor * moeda.taxa;
    }

    /**
     * Processa moedas da DI de forma DATA-DRIVEN
     */
    async processarMultiplasMoedas(xmlDoc) {
        // MÉTODO DATA-DRIVEN: Obter dados direto da DI
        const moedaVmle = this.obterMoedaVmleVmld(xmlDoc);
        
        // Obter informações detalhadas da moeda via ConfigLoader
        let moedaDetalhada;
        try {
            const configLoader = new ConfigLoader();
            await configLoader.loadAll(); // Inicializar ConfigLoader corretamente
            
            const moedaInfo = configLoader.getCurrencyInfo(moedaVmle.codigo);
            moedaDetalhada = {
                codigo: moedaVmle.codigo,
                nome: moedaInfo.nome,
                sigla: moedaInfo.codigo_iso,
                taxa: moedaVmle.taxa
            };
        } catch (error) {
            console.warn(`ConfigLoader não disponível ou moeda ${moedaVmle.codigo} não cadastrada:`, error.message);
            moedaDetalhada = {
                codigo: moedaVmle.codigo,
                nome: `Moeda ${moedaVmle.codigo}`,
                sigla: moedaVmle.codigo,
                taxa: moedaVmle.taxa
            };
        }
        
        // Estruturar dados da moeda (DATA-DRIVEN - SEM VALIDAÇÕES ARTIFICIAIS)
        this.diData.moedas = {
            lista: [moedaDetalhada], // Por enquanto, só VMLE/VMLD
            total: 1,
            vmle_vmld: moedaDetalhada
        };
        
        // Taxa de câmbio global = taxa calculada da DI
        this.diData.taxa_cambio = moedaVmle.taxa;
        
        console.log(`✅ Moeda processada DATA-DRIVEN: ${moedaDetalhada.sigla} (${moedaVmle.taxa.toFixed(4)})`);
    }

    /**
     * Valida conversões de moeda comparando com valores do XML
     */
    validarConversoes(xmlDoc, moedas) {
        const validacao = {
            testes: [],
            aprovado: true
        };
        
        const diNode = xmlDoc.querySelector('declaracaoImportacao');
        
        // Validar VMLE
        const vmleDolares = this.parseNumber(this.getTextContent(diNode, 'localEmbarqueTotalDolares'), 100);
        const vmleReais = this.parseNumber(this.getTextContent(diNode, 'localEmbarqueTotalReais'), 100);
        
        if (vmleDolares > 0 && vmleReais > 0) {
            const codigoMoedaVmle = this.diData.moedas?.vmle_vmld?.codigo;
            if (!codigoMoedaVmle) {
                throw new Error('Código de moeda VMLE/VMLD não identificado');
            }
            const valorCalculado = this.converterParaReais(vmleDolares, codigoMoedaVmle, moedas);
            const diferenca = Math.abs(valorCalculado - vmleReais);
            const tolerancia = vmleReais * 0.01; // 1%
            
            const testeVmle = {
                campo: 'VMLE',
                valor_moeda_original: vmleDolares,
                moeda: codigoMoedaVmle,
                valor_xml_reais: vmleReais,
                valor_calculado: valorCalculado,
                diferenca: diferenca,
                aprovado: diferenca <= tolerancia
            };
            
            validacao.testes.push(testeVmle);
            if (!testeVmle.aprovado) {
                validacao.aprovado = false;
            }
        }
        
        // Validar frete se em moeda diferente
        const codFrete = this.getTextContent(diNode, 'freteMoedaNegociadaCodigo');
        const freteValorMoeda = this.convertValue(this.getTextContent(diNode, 'freteTotalMoeda'), 'monetary');
        const freteReais = this.convertValue(this.getTextContent(diNode, 'freteTotalReais'), 'monetary');
        
        if (codFrete && codFrete !== '000' && freteValorMoeda > 0 && freteReais > 0) {
            const valorCalculadoFrete = this.converterParaReais(freteValorMoeda, codFrete, moedas);
            const diferencaFrete = Math.abs(valorCalculadoFrete - freteReais);
            const toleranciaFrete = freteReais * 0.01;
            
            const testeFrete = {
                campo: 'Frete',
                valor_moeda_original: freteValorMoeda,
                moeda: codFrete,
                valor_xml_reais: freteReais,
                valor_calculado: valorCalculadoFrete,
                diferenca: diferencaFrete,
                aprovado: diferencaFrete <= toleranciaFrete
            };
            
            validacao.testes.push(testeFrete);
            if (!testeFrete.aprovado) {
                validacao.aprovado = false;
            }
        }
        
        return validacao;
    }

    /**
     * Faz parsing das informações complementares para extrair dados estruturados
     */
    parseInformacoesComplementares(texto) {
        const dados = {};

        if (!texto) return dados;

        // Extrair taxa SISCOMEX
        const siscomexMatch = texto.match(/TAXA DE UTILIZACAO DO SISCOMEX.*?R\$\s*([\d.,]+)/i);
        if (siscomexMatch) {
            dados.siscomex_valor = this.parseValueFromString(siscomexMatch[1]);
        }

        // Extrair AFRMM
        const afrmmMatch = texto.match(/AFRMM.*?R\$\s*([\d.,]+)/i);
        if (afrmmMatch) {
            dados.afrmm_valor = this.parseValueFromString(afrmmMatch[1]);
        }

        // As taxas de câmbio são processadas em processarMultiplasMoedas()
        // e ficam disponíveis em this.diData.moedas_multiplas

        // Extrair responsáveis legais
        const responsaveisMatches = texto.matchAll(/(\w+\s+[\w\s]+)\s+CPF:\s*([\d.-]+)/g);
        dados.responsaveis_legais = [];
        for (const match of responsaveisMatches) {
            dados.responsaveis_legais.push({
                nome: match[1].trim(),
                cpf: match[2]
            });
        }

        // Extrair informações do container
        const containerMatch = texto.match(/CONTAINER[.\s]+(\w+).*?PESO BRUTO\s*([\d.,]+)/i);
        if (containerMatch) {
            dados.container_numero = containerMatch[1];
            dados.container_peso_bruto = this.parseValueFromString(containerMatch[2]);
        }

        return dados;
    }

    /**
     * Calcula totais da DI
     */
    calculateTotals() {
        let totals = {
            valor_total_fob_usd: 0,
            valor_total_fob_brl: 0,
            valor_total_mercadorias: 0
        };

        this.diData.adicoes.forEach(adicao => {
            // Validar estrutura tributos (objeto com impostos diretos)
            if (!adicao.tributos || typeof adicao.tributos !== 'object') {
                throw new Error(`Estrutura tributos inválida na adição ${adicao.numero_adicao} - deve ser objeto com impostos`);
            }
            
            // NO FALLBACKS - valores obrigatórios
            if (adicao.valor_moeda_negociacao === undefined || adicao.valor_moeda_negociacao === null) {
                throw new Error(`Valor moeda negociação obrigatório ausente na adição ${adicao.numero_adicao}`);
            }
            if (adicao.valor_reais === undefined || adicao.valor_reais === null) {
                throw new Error(`Valor reais obrigatório ausente na adição ${adicao.numero_adicao}`);
            }
            
            totals.valor_total_fob_usd += adicao.valor_moeda_negociacao;
            totals.valor_total_fob_brl += adicao.valor_reais;
            
            // Ratear frete e seguro pelos produtos desta adição
            this.ratearFreteSeguroPorItens(adicao);
            
            // Somar valor total dos produtos após rateio
            if (adicao.produtos && adicao.produtos.length > 0) {
                adicao.produtos.forEach(produto => {
                    if (produto.valor_total_brl === undefined || produto.valor_total_brl === null) {
                        throw new Error(`Valor total BRL obrigatório ausente no produto ${produto.numero_sequencial_item} da adição ${adicao.numero_adicao}`);
                    }
                    totals.valor_total_mercadorias += produto.valor_total_brl;
                });
            }
        });

        this.diData.totais = totals;
    }

    /**
     * Rateia frete e seguro pelos produtos de uma adição baseado no incoterm
     * Incoterm determina se frete/seguro já estão inclusos ou devem ser rateados
     */
    ratearFreteSeguroPorItens(adicao) {
        if (!adicao.produtos || adicao.produtos.length === 0) {
            return; // Não há produtos para ratear
        }

        // Validar incoterm obrigatório
        if (!adicao.condicao_venda_incoterm) {
            throw new Error(`Incoterm obrigatório ausente na adição ${adicao.numero_adicao} - necessário para rateio frete/seguro`);
        }

        const incoterm = adicao.condicao_venda_incoterm;
        
        // Verificar se frete está incluso no preço (baseado no incoterm)
        const freteIncluso = this.isFreteIncluidoIncoterm(incoterm);
        const seguroIncluso = this.isSeguroIncluidoIncoterm(incoterm);

        // Validar valores obrigatórios se precisam ser rateados
        if (!freteIncluso) {
            if (adicao.frete_valor_reais === undefined || adicao.frete_valor_reais === null) {
                throw new Error(`Valor frete reais obrigatório ausente na adição ${adicao.numero_adicao} - incoterm ${incoterm} exige rateio`);
            }
        }
        
        if (!seguroIncluso) {
            if (adicao.seguro_valor_reais === undefined || adicao.seguro_valor_reais === null) {
                throw new Error(`Valor seguro reais obrigatório ausente na adição ${adicao.numero_adicao} - incoterm ${incoterm} exige rateio`);
            }
        }

        const valorTotalAdicao = adicao.valor_reais;
        if (valorTotalAdicao <= 0) {
            throw new Error(`Valor total da adição ${adicao.numero_adicao} deve ser maior que zero para rateio`);
        }

        // Processar cada produto
        adicao.produtos.forEach(produto => {
            if (produto.valor_total_brl === undefined || produto.valor_total_brl === null) {
                throw new Error(`Valor total BRL obrigatório ausente no produto ${produto.numero_sequencial_item} da adição ${adicao.numero_adicao}`);
            }

            const percentualProduto = produto.valor_total_brl / valorTotalAdicao;
            
            // Ratear frete conforme incoterm
            if (freteIncluso) {
                produto.frete_rateado_brl = 0; // Já incluso no preço FOB
                produto.frete_status = 'incluso_preco';
            } else {
                produto.frete_rateado_brl = adicao.frete_valor_reais * percentualProduto;
                produto.frete_status = 'rateado';
            }
            
            // Ratear seguro conforme incoterm
            if (seguroIncluso) {
                produto.seguro_rateado_brl = 0; // Já incluso no preço FOB
                produto.seguro_status = 'incluso_preco';
            } else {
                produto.seguro_rateado_brl = adicao.seguro_valor_reais * percentualProduto;
                produto.seguro_status = 'rateado';
            }
            
            // Valor CIF do produto (FOB + frete + seguro rateados)
            produto.valor_cif_brl = produto.valor_total_brl + produto.frete_rateado_brl + produto.seguro_rateado_brl;
            
            // Registrar incoterm para auditoria
            produto.incoterm_aplicado = incoterm;
        });
    }

    // ========== HELPER METHODS FOR TRIBUTOS ARRAY ACCESS ==========
    
    /**
     * Encontra tributo por código de receita - NO FALLBACKS
     * @param {Array} tributos - Array de tributos
     * @param {string} codigoReceita - Código de receita a procurar
     * @returns {Object} Tributo encontrado
     * @throws {Error} Se tributo não for encontrado
     */
    getTributoByCodigoReceita(tributos, codigoReceita) {
        if (!Array.isArray(tributos)) {
            throw new Error('Tributos deve ser um array - estrutura inválida');
        }
        
        if (!codigoReceita) {
            throw new Error('Código de receita obrigatório para busca');
        }
        
        const tributo = tributos.find(t => t.codigoReceitaImposto === codigoReceita);
        if (!tributo) {
            throw new Error(`Tributo com código ${codigoReceita} não encontrado nos tributos da adição`);
        }
        
        return tributo;
    }
    
    /**
     * Obtém valor específico de um tributo - NO FALLBACKS
     * @param {Array} tributos - Array de tributos
     * @param {string} tipoImposto - Tipo do imposto
     * @param {string} campo - Campo a extrair (valorImpostoDevido, percentualAliquotaNormalAdval, etc.)
     * @returns {number} Valor do campo
     * @throws {Error} Se tributo não for encontrado
     */
    getTributoValue(tributos, tipoImposto, campo) {
        const tributo = this.getTributoByTipo(tributos, tipoImposto);
        
        if (tributo[campo] === undefined || tributo[campo] === null) {
            throw new Error(`Campo ${campo} não encontrado no tributo ${tipoImposto}`);
        }
        
        return tributo[campo];
    }

    // ========== MÉTODOS AUXILIARES ==========

    /**
     * Obtém texto de um elemento XML
     */
    getTextContent(node, tagName) {
        const element = node.querySelector(tagName);
        return element ? element.textContent.trim() : '';
    }

    /**
     * Converte string numérica do XML para número decimal
     */
    parseNumber(value, divisor = 1) {
        if (!value || value === '0'.repeat(value.length)) return 0;
        return parseInt(value) / divisor;
    }

    /**
     * Parse de valor monetário de string
     */
    parseValueFromString(valueString) {
        const cleanValue = valueString.replace(/\./g, '').replace(',', '.');
        return parseFloat(cleanValue);
    }

    /**
     * Formata data de AAAAMMDD para DD/MM/AAAA
     */
    formatDate(dateString) {
        if (!dateString || dateString.length !== 8) return dateString;
        return `${dateString.substring(6,8)}/${dateString.substring(4,6)}/${dateString.substring(0,4)}`;
    }

    /**
     * Formata CNPJ
     */
    formatCNPJ(cnpj) {
        if (!cnpj) return '';
        const clean = cnpj.replace(/\D/g, '');
        return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }

    /**
     * Formata CPF
     */
    formatCPF(cpf) {
        if (!cpf) return '';
        const clean = cpf.replace(/\D/g, '');
        return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    }

    /**
     * Formata CEP
     */
    formatCEP(cep) {
        if (!cep) return '';
        const clean = cep.replace(/\D/g, '');
        return clean.replace(/^(\d{5})(\d{3})$/, '$1-$2');
    }

    /**
     * Monta endereço completo
     */
    buildEnderecoCompleto(endereco) {
        const partes = [
            endereco.endereco_logradouro,
            endereco.endereco_numero,
            endereco.endereco_complemento,
            endereco.endereco_bairro,
            endereco.endereco_cidade,
            endereco.endereco_uf,
            endereco.endereco_cep
        ].filter(parte => parte && parte.trim());

        return partes.join(', ');
    }

    /**
     * ===== MÉTODO CRÍTICO: Extrai TODAS as despesas aduaneiras =====
     * Extrai pagamentos, acréscimos e calcula despesas obrigatórias
     */
    async extractDespesasAduaneiras(xmlDoc) {
        console.log('🔍 Extraindo despesas aduaneiras...');
        
        const despesas = {
            pagamentos: [],
            acrescimos: [],
            calculadas: {},
            total_despesas_aduaneiras: 0
        };
        
        // ===== 1. EXTRAIR SEÇÃO <pagamento> =====
        this.extractPagamentos(xmlDoc, despesas);
        
        // ===== 2. EXTRAIR SEÇÃO <acrescimo> =====
        this.extractAcrescimos(xmlDoc, despesas);
        
        // ===== 3. CALCULAR DESPESAS AUTOMÁTICAS =====
        await this.calcularDespesasAutomaticas(xmlDoc, despesas);
        
        // ===== 5. TOTALIZAR DESPESAS =====
        this.totalizarDespesasAduaneiras(despesas);
        
        // Adicionar ao diData
        this.diData.despesas_aduaneiras = despesas;
        
        console.log('✅ Despesas aduaneiras extraídas:', {
            siscomex: despesas.calculadas.siscomex || 0,
            afrmm: despesas.calculadas.afrmm || 0,
            capatazia: despesas.calculadas.capatazia || 0,
            total: despesas.total_despesas_aduaneiras
        });
    }

    /**
     * Extrai seção <pagamento> com códigos de receita
     */
    extractPagamentos(xmlDoc, despesas) {
        const pagamentos = xmlDoc.querySelectorAll('pagamento');
        
        pagamentos.forEach(pagamento => {
            const codigoReceita = this.getTextContent(pagamento, 'codigoReceita');
            const valorReceita = this.convertValue(this.getTextContent(pagamento, 'valorReceita'), 'monetary');
            const dataPagamento = this.getTextContent(pagamento, 'dataPagamento');
            
            if (codigoReceita && valorReceita > 0) {
                const tipoDespesa = this.mapearCodigoReceita(codigoReceita);
                
                const pagamentoData = {
                    codigo_receita: codigoReceita,
                    tipo_despesa: tipoDespesa,
                    valor: valorReceita,
                    data_pagamento: dataPagamento
                };
                
                despesas.pagamentos.push(pagamentoData);
                
                // Mapear para despesas calculadas ou classificar como imposto
                if (tipoDespesa === 'SISCOMEX') {
                    despesas.calculadas.siscomex = valorReceita;
                } else if (tipoDespesa === 'ANTI_DUMPING') {
                    despesas.calculadas.anti_dumping = valorReceita;
                } else if (tipoDespesa === 'MEDIDA_COMPENSATORIA') {
                    despesas.calculadas.medida_compensatoria = valorReceita;
                } else if (tipoDespesa === 'MEDIDA_SALVAGUARDA') {
                    despesas.calculadas.medida_salvaguarda = valorReceita;
                } else if (tipoDespesa.startsWith('II_') || tipoDespesa.startsWith('IPI_') || 
                          tipoDespesa === 'PIS' || tipoDespesa === 'COFINS') {
                    // Impostos federais - registrar mas NÃO somar como despesas
                    console.log(`  ⚠️ ${tipoDespesa} é imposto, não despesa: R$ ${valorReceita.toFixed(2)}`);
                } else {
                    // Códigos não mapeados - tratamento conservador
                    console.log(`  ⚠️ Código não mapeado ${codigo} (${tipoDespesa}): R$ ${valorReceita.toFixed(2)} - verificar se é despesa ou imposto`);
                }
                
                console.log(`📋 Pagamento extraído: ${tipoDespesa} (${codigoReceita}) = R$ ${valorReceita.toFixed(2)}`);
            }
        });
    }

    /**
     * Extrai seção <acrescimo> (capatazia, taxa CE, etc.)
     */
    extractAcrescimos(xmlDoc, despesas) {
        const acrescimos = xmlDoc.querySelectorAll('acrescimo');
        
        acrescimos.forEach(acrescimo => {
            const codigoAcrescimo = this.getTextContent(acrescimo, 'codigoAcrescimo');
            const valorReais = this.convertValue(this.getTextContent(acrescimo, 'valorReais'), 'monetary');
            const valorMoedaNegociada = this.convertValue(this.getTextContent(acrescimo, 'valorMoedaNegociada'), 'monetary');
            
            if (codigoAcrescimo && valorReais > 0) {
                const tipoAcrescimo = this.mapearCodigoAcrescimo(codigoAcrescimo);
                
                const acrescimoData = {
                    codigo_acrescimo: codigoAcrescimo,
                    tipo_acrescimo: tipoAcrescimo,
                    valor_reais: valorReais,
                    valor_moeda_negociada: valorMoedaNegociada
                };
                
                despesas.acrescimos.push(acrescimoData);
                
                // Mapear para despesas calculadas
                if (tipoAcrescimo === 'CAPATAZIA') {
                    despesas.calculadas.capatazia = valorReais;
                } else if (tipoAcrescimo === 'TAXA_CE') {
                    despesas.calculadas.taxa_ce = valorReais;
                } else {
                    if (!despesas.calculadas.outras) despesas.calculadas.outras = 0;
                    despesas.calculadas.outras += valorReais;
                }
                
                console.log(`📋 Acréscimo extraído: ${tipoAcrescimo} (${codigoAcrescimo}) = R$ ${valorReais.toFixed(2)}`);
            }
        });
    }

    /**
     * Extrai despesas automáticas das informações complementares (AFRMM, etc.)
     * PRINCÍPIO: APENAS EXTRAIR dados da DI, NÃO calcular
     */
    async calcularDespesasAutomaticas(xmlDoc, despesas) {
        // ===== AFRMM - EXTRAIR das informações complementares =====
        const afrmmExtraido = this.diData.informacoes_complementares?.dados_extraidos?.afrmm_valor;
        
        if (afrmmExtraido && afrmmExtraido > 0) {
            despesas.calculadas.afrmm = afrmmExtraido;
            console.log(`✅ AFRMM extraído das informações complementares: R$ ${afrmmExtraido.toFixed(2)}`);
        } else {
            console.log(`⚠️ AFRMM não encontrado nas informações complementares`);
        }
        
        // ===== OUTRAS DESPESAS - podem ser adicionadas aqui no futuro =====
        // Exemplo: Taxas portuárias, despesas de armazenagem, etc.
        // Sempre EXTRAIR das informações da DI, nunca calcular
    }


    /**
     * Totaliza todas as despesas aduaneiras
     */
    totalizarDespesasAduaneiras(despesas) {
        let total = 0;
        
        // Somar APENAS despesas aduaneiras legítimas (excluir impostos)
        const despesasParaBaseICMS = [
            'siscomex', 'afrmm', 'capatazia', 'taxa_ce', 
            'anti_dumping', 'medida_compensatoria', 'medida_salvaguarda'
            // NÃO incluir: II, IPI, PIS, COFINS - são impostos federais!
        ];
        
        despesasParaBaseICMS.forEach(campo => {
            if (despesas.calculadas[campo]) {
                total += despesas.calculadas[campo];
            }
        });
        
        despesas.total_despesas_aduaneiras = total;
        
        console.log(`💰 Total despesas aduaneiras para base ICMS: R$ ${total.toFixed(2)}`);
    }

    /**
     * Mapeia código de receita para tipo de despesa
     */
    mapearCodigoReceita(codigo) {
        const mapeamento = {
            // === DESPESAS ADUANEIRAS LEGÍTIMAS ===
            '7811': 'SISCOMEX',           // Taxa de Utilização do SISCOMEX
            '5529': 'ANTI_DUMPING',       // Direito Antidumping (despesa aduaneira)
            '5622': 'MEDIDA_COMPENSATORIA', // Medida Compensatória
            '5651': 'MEDIDA_SALVAGUARDA', // Medida de Salvaguarda
            
            // === IMPOSTOS FEDERAIS (NÃO são despesas aduaneiras) ===
            '0086': 'II_OUTROS',          // Imposto de Importação - Outros
            '1038': 'IPI_VINCULADO',      // IPI - Vinculado Importação
            '5602': 'PIS',                // PIS Importação
            '5629': 'COFINS',             // COFINS Importação
            '1394': 'II_BAGAGEM',         // II Bagagem
            '1402': 'II_BAGAGEM_2',       // II Bagagem alternativo
            '5503': 'IPI_VEICULOS',       // IPI Vinculado - Importação de Veículos
            '5516': 'II_VEICULOS',        // Imposto de Importação - Veículos
            '9064': 'II_ADICIONAL'        // Imposto de Importação - Adicional
        };
        
        return mapeamento[codigo] || `RECEITA_${codigo}`;
    }

    /**
     * Mapeia código de acréscimo para tipo
     */
    mapearCodigoAcrescimo(codigo) {
        const mapeamento = {
            '16': 'CAPATAZIA',            // Capatazia
            '17': 'TAXA_CE'               // Taxa CE (Conhecimento Embarque)
        };
        
        return mapeamento[codigo] || `ACRESCIMO_${codigo}`;
    }

    /**
     * Retorna dados processados
     */
    getData() {
        return this.diData;
    }

    /**
     * Retorna XML original
     */
    getOriginalXML() {
        return this.originalXmlContent;
    }

    /**
     * Retorna incoterm identificado
     */
    getIncotermIdentificado() {
        return this.incotermIdentificado;
    }

    /**
     * Consolida despesas automáticas da DI com despesas extras manuais
     * @param {Object} despesasExtras - Despesas extras informadas pelo usuário
     * @returns {Object} Despesas consolidadas com classificação tributária
     */
    consolidarDespesasCompletas(despesasExtras = {}) {
        console.log('🔄 Consolidando despesas automáticas + extras...');
        
        const despesasAutomaticas = this.diData.despesas_aduaneiras || {};
        
        const despesasConsolidadas = {
            // Despesas automáticas da DI (sempre tributáveis para ICMS)
            automaticas: {
                siscomex: despesasAutomaticas.calculadas?.siscomex || 0,
                afrmm: despesasAutomaticas.calculadas?.afrmm || 0,
                capatazia: despesasAutomaticas.calculadas?.capatazia || 0,
                total: (despesasAutomaticas.calculadas?.siscomex || 0) + 
                       (despesasAutomaticas.calculadas?.afrmm || 0) + 
                       (despesasAutomaticas.calculadas?.capatazia || 0)
            },
            
            // Despesas extras informadas pelo usuário
            extras: {
                armazenagem_extra: despesasExtras.armazenagem_extra || 0,
                transporte_interno: despesasExtras.transporte_interno || 0,
                despachante: despesasExtras.despachante || 0,
                outros_portuarios: despesasExtras.outros_portuarios || 0,
                bancarios: despesasExtras.bancarios || 0,
                administrativos: despesasExtras.administrativos || 0,
                outros_extras: despesasExtras.outros_extras || 0
            },
            
            // Classificação tributária (definida pelo usuário)
            classificacao: {
                tributaveis_icms: despesasExtras.tributaveis_icms || {},
                apenas_custeio: despesasExtras.apenas_custeio || {}
            }
        };
        
        // Calcular totais por classificação
        let totalTributavel = despesasConsolidadas.automaticas.total; // DI sempre tributável
        let totalCusteio = 0;
        
        // Processar despesas extras conforme classificação
        Object.keys(despesasConsolidadas.extras).forEach(key => {
            const valor = despesasConsolidadas.extras[key];
            if (valor > 0) {
                if (despesasConsolidadas.classificacao.tributaveis_icms[key]) {
                    totalTributavel += valor;
                } else {
                    totalCusteio += valor;
                }
            }
        });
        
        despesasConsolidadas.totais = {
            automaticas: despesasConsolidadas.automaticas.total,
            extras: Object.values(despesasConsolidadas.extras).reduce((sum, val) => sum + val, 0),
            tributavel_icms: totalTributavel,
            apenas_custeio: totalCusteio,
            geral: totalTributavel + totalCusteio
        };
        
        console.log('✅ Despesas consolidadas:', despesasConsolidadas);
        return despesasConsolidadas;
    }

    /**
     * Obtém despesas automáticas já extraídas da DI
     * @returns {Object} Despesas automáticas da DI
     */
    getDespesasAutomaticas() {
        return this.diData.despesas_aduaneiras || {};
    }

    /**
     * Carrega dados de moedas do arquivo de configuração
     * @returns {Promise<Object>} Dados das moedas
     */
    async loadMoedasData() {
        if (!this.moedasData) {
            const response = await fetch(new URL('../../shared/data/moedas-siscomex.json', import.meta.url));
            if (!response.ok) {
                throw new Error(`Erro ao carregar moedas-siscomex.json: ${response.status}`);
            }
            this.moedasData = await response.json();
        }
        return this.moedasData;
    }

    /**
     * Retorna dados da moeda baseado no código SISCOMEX
     * @param {string} codigoSiscomex - Código SISCOMEX da moeda
     * @returns {Promise<Object>} Dados da moeda (símbolo, nome, etc.)
     */
    async getCurrencyData(codigoSiscomex) {
        const moedasData = await this.loadMoedasData();
        const moeda = moedasData.moedas.find(m => m.codigo_siscomex === codigoSiscomex);
        
        if (!moeda) {
            throw new Error(`Código de moeda SISCOMEX '${codigoSiscomex}' não encontrado em moedas-siscomex.json`);
        }
        
        return moeda;
    }

    /**
     * Formata valor com símbolo de moeda correto
     * @param {number} valor - Valor a ser formatado  
     * @param {string} codigoSiscomex - Código SISCOMEX da moeda
     * @returns {Promise<string>} Valor formatado com símbolo
     */
    async formatCurrency(valor, codigoSiscomex) {
        const moedaData = await this.getCurrencyData(codigoSiscomex);
        const simbolo = moedaData.simbolo;
        const decimais = moedaData.decimais;
        
        if (moedaData.codigo_iso === 'USD') {
            // USD - formato americano
            return `${simbolo} ${valor.toLocaleString('en-US', { 
                minimumFractionDigits: decimais, 
                maximumFractionDigits: decimais 
            })}`;
        } else {
            // BRL e outras - formato brasileiro  
            return `${simbolo} ${valor.toLocaleString('pt-BR', { 
                minimumFractionDigits: decimais, 
                maximumFractionDigits: decimais 
            })}`;
        }
    }
}

// ES6 Module Export - já exportado na linha 8 com export class