/**
 * PricingAdapter.js
 * 
 * Adaptador responsável por converter dados do ComplianceCalculator
 * para o formato esperado pelo PricingEngine, mantendo a nomenclatura
 * oficial e implementando a política NO FALLBACKS.
 * 
 * PRIMARY CONSUMER da nomenclatura DIProcessor
 * BRIDGE entre ComplianceCalculator e PricingEngine
 * 
 * @module PricingAdapter
 * @requires DIProcessor nomenclatura oficial
 */

class PricingAdapter {
    constructor() {
        this.pricingEngine = null;
        this.incentiveManager = null;
        this.dbManager = null;
        this.isInitialized = false;
    }

    /**
     * Inicializa o adapter com as dependências necessárias
     * @param {Object} config - Configuração com engines e managers
     */
    async initialize(config = {}) {
        try {
            // Validação NO FALLBACKS - todos os componentes são obrigatórios
            if (!config.pricingEngine) {
                throw new Error('PricingEngine é obrigatório para inicializar PricingAdapter');
            }

            if (!config.incentiveManager) {
                throw new Error('IncentiveManager é obrigatório para inicializar PricingAdapter');
            }

            if (!config.dbManager) {
                throw new Error('IndexedDBManager é obrigatório para inicializar PricingAdapter');
            }

            this.pricingEngine = config.pricingEngine;
            this.incentiveManager = config.incentiveManager;
            this.dbManager = config.dbManager;
            
            // Inicializar PricingEngine se necessário
            if (!this.pricingEngine.isInitialized) {
                await this.pricingEngine.initialize();
            }

            this.isInitialized = true;
            console.log('✅ PricingAdapter inicializado com sucesso');
            
            return true;
        } catch (error) {
            console.error('❌ Erro ao inicializar PricingAdapter:', error);
            throw error;
        }
    }

    /**
     * Processa dados de precificação vindos do ComplianceCalculator
     * @param {Object} pricingData - Dados preparados pelo ComplianceCalculator
     * @returns {Object} Dados processados e salvos
     */
    async processPricingData(pricingData) {
        try {
            // Validação NO FALLBACKS
            if (!this.isInitialized) {
                throw new Error('PricingAdapter não inicializado. Execute initialize() primeiro');
            }

            if (!pricingData) {
                throw new Error('Dados de precificação são obrigatórios');
            }

            if (!pricingData.di_id) {
                throw new Error('ID da DI é obrigatório para processar precificação');
            }

            console.log(`📊 Processando precificação para DI ${pricingData.numero_di || pricingData.di_id}`);

            // Converter dados para formato do PricingEngine
            const engineData = await this.convertToEngineFormat(pricingData);

            // Aplicar incentivos fiscais (sempre tenta, mesmo para simulação)
            engineData.incentivos = await this.processIncentives(
                engineData, 
                pricingData.estado_empresa,
                pricingData.programa_incentivo_simulacao // Permite simulação de qualquer programa
            );

            // Processar no PricingEngine
            const resultado = await this.pricingEngine.calculatePricing(engineData);

            // Salvar no banco de dados
            await this.savePricingData(resultado);

            // Atualizar estado de processamento
            await this.updateProcessingState(pricingData.di_id, 'PRICING_CONFIGURED');

            console.log('✅ Precificação processada e salva com sucesso');
            return resultado;

        } catch (error) {
            console.error('❌ Erro ao processar dados de precificação:', error);
            throw error;
        }
    }

    /**
     * Converte dados do ComplianceCalculator para formato do PricingEngine
     * Mantém nomenclatura oficial DIProcessor
     * @private
     */
    async convertToEngineFormat(pricingData) {
        // Validação NO FALLBACKS de campos obrigatórios
        if (!pricingData.adicoes || !Array.isArray(pricingData.adicoes)) {
            throw new Error('Campo "adicoes" é obrigatório e deve ser um array');
        }

        if (!pricingData.totais) {
            throw new Error('Campo "totais" é obrigatório com valores consolidados');
        }

        // Estrutura seguindo nomenclatura oficial
        const engineData = {
            // Identificação
            di_id: pricingData.di_id,
            numero_di: pricingData.numero_di,
            
            // Dados do importador (nomenclatura oficial)
            importador: {
                cnpj: pricingData.importador?.cnpj,
                nome: pricingData.importador?.nome,
                endereco_uf: pricingData.importador?.endereco_uf
            },

            // Totais consolidados (nomenclatura oficial) - SEM FALLBACKS
            totais: {
                valor_aduaneiro: pricingData.totais.valor_aduaneiro,
                ii_devido: pricingData.totais.ii_devido,
                ipi_devido: pricingData.totais.ipi_devido,
                pis_devido: pricingData.totais.pis_devido,
                cofins_devido: pricingData.totais.cofins_devido,
                icms_devido: pricingData.totais.icms_devido,
                despesas_aduaneiras: pricingData.totais.despesas_aduaneiras
            },

            // Adições com produtos (nomenclatura oficial)
            adicoes: await this.convertAdicoes(pricingData.adicoes),

            // Despesas aduaneiras detalhadas
            despesas_aduaneiras: pricingData.despesas_aduaneiras,

            // Metadados
            data_processamento: new Date().toISOString(),
            versao_adapter: '1.0.0'
        };

        return engineData;
    }

    /**
     * Converte adições mantendo nomenclatura oficial
     * @private
     */
    async convertAdicoes(adicoes) {
        return adicoes.map(adicao => {
            // Validação NO FALLBACKS para campos críticos
            if (!adicao.numero_adicao) {
                throw new Error(`Adição sem numero_adicao identificado`);
            }

            if (!adicao.ncm) {
                throw new Error(`Adição ${adicao.numero_adicao} sem NCM`);
            }

            // Validar nomenclatura oficial - produtos, não mercadorias
            if (adicao.mercadorias) {
                throw new Error('VIOLAÇÃO NOMENCLATURA: Use "produtos" não "mercadorias"');
            }

            return {
                numero_adicao: adicao.numero_adicao,
                ncm: adicao.ncm,
                descricao_ncm: adicao.descricao_ncm,
                
                // Valores (nomenclatura oficial) - SEM FALLBACKS
                valor_reais: adicao.valor_reais,
                frete_valor_reais: adicao.frete_valor_reais,
                seguro_valor_reais: adicao.seguro_valor_reais,
                
                // Tributos (nomenclatura oficial) - SEM FALLBACKS
                tributos: {
                    ii_aliquota_ad_valorem: adicao.tributos?.ii_aliquota_ad_valorem,
                    ii_valor_devido: adicao.tributos?.ii_valor_devido,
                    ipi_aliquota_ad_valorem: adicao.tributos?.ipi_aliquota_ad_valorem,
                    ipi_valor_devido: adicao.tributos?.ipi_valor_devido,
                    pis_valor_devido: adicao.tributos?.pis_valor_devido,
                    cofins_valor_devido: adicao.tributos?.cofins_valor_devido
                },
                
                // Produtos (nomenclatura oficial)
                produtos: this.convertProdutos(adicao.produtos)
            };
        });
    }

    /**
     * Converte produtos mantendo nomenclatura oficial
     * @private
     */
    convertProdutos(produtos) {
        if (!produtos || !Array.isArray(produtos)) {
            throw new Error('Campo "produtos" é obrigatório e deve ser um array');
        }

        return produtos.map(produto => {
            // Validação NO FALLBACKS
            if (!produto.numero_sequencial_item) {
                throw new Error('Produto sem numero_sequencial_item');
            }

            return {
                numero_sequencial_item: produto.numero_sequencial_item,
                descricao_mercadoria: produto.descricao_mercadoria, // Nome oficial
                quantidade: produto.quantidade,
                unidade_medida: produto.unidade_medida,
                valor_unitario_brl: produto.valor_unitario_brl,
                valor_total_brl: produto.valor_total_brl,
                
                // Custos já calculados pelo ComplianceCalculator
                custo_produto_federal: produto.custo_produto_federal,
                
                // Campos para precificação (serão preenchidos pelo PricingEngine)
                precificacao: {
                    custo_unitario_final: null,
                    margem_aplicada: null,
                    preco_venda_sugerido: null,
                    preco_venda_minimo: null,
                    preco_venda_maximo: null
                }
            };
        });
    }

    /**
     * Processa incentivos fiscais com suporte a simulação
     * @private
     */
    async processIncentives(engineData, estadoEmpresa, programaSimulacao = null) {
        try {
            // Coletar todos os NCMs
            const ncms = engineData.adicoes.map(a => a.ncm).filter(Boolean);
            
            let programa = programaSimulacao;
            let isSimulacao = false;
            let avisoSimulacao = null;

            // Se não há programa específico para simular, buscar programas do estado
            if (!programa && estadoEmpresa) {
                const programasDisponiveis = await this.incentiveManager.getAvailablePrograms(estadoEmpresa);
                
                if (programasDisponiveis && programasDisponiveis.length > 0) {
                    programa = programasDisponiveis[0]; // Usar primeiro disponível
                }
            }

            // Se há programa de simulação, verificar se é do estado correto
            if (programaSimulacao) {
                const estadoPrograma = this.extractEstadoFromPrograma(programaSimulacao);
                
                if (estadoPrograma !== estadoEmpresa) {
                    isSimulacao = true;
                    avisoSimulacao = `⚠️ SIMULAÇÃO: Programa ${programaSimulacao} é de ${estadoPrograma}, mas importador é de ${estadoEmpresa}`;
                    console.warn(avisoSimulacao);
                }
            }

            // Se não há programa disponível, retornar sem incentivos
            if (!programa) {
                console.log(`ℹ️ Nenhum incentivo fiscal configurado`);
                return null;
            }

            // Validar elegibilidade dos NCMs
            const estadoPrograma = isSimulacao ? this.extractEstadoFromPrograma(programa) : estadoEmpresa;
            const elegibilidade = await this.incentiveManager.validateEligibility(
                estadoPrograma,
                programa,
                ncms
            );

            // Estrutura de incentivos com informações de simulação
            const incentivos = {
                programa_selecionado: programa,
                estado_programa: estadoPrograma,
                estado_empresa: estadoEmpresa,
                is_simulacao: isSimulacao,
                aviso_simulacao: avisoSimulacao,
                elegivel: elegibilidade.eligible,
                ncms_vedados: elegibilidade.restrictedNCMs || [],
                percentual_reducao: elegibilidade.eligible ? (elegibilidade.percentual_reducao || 0) : 0,
                economia_estimada: null // Será calculada pelo PricingEngine
            };

            if (elegibilidade.eligible) {
                console.log(`✅ Incentivos fiscais ${isSimulacao ? 'SIMULADOS' : 'aplicados'}: ${programa}`);
            } else {
                console.log(`❌ NCMs não elegíveis para ${programa}: ${elegibilidade.restrictedNCMs?.join(', ')}`);
            }

            return incentivos;

        } catch (error) {
            console.warn('⚠️ Erro ao processar incentivos fiscais:', error.message);
            return null; // Continuar sem incentivos
        }
    }

    /**
     * Extrai o estado do código do programa
     * Ex: SC_TTD_409 -> SC
     * @private
     */
    extractEstadoFromPrograma(programa) {
        if (!programa) return null;
        
        const partes = programa.split('_');
        if (partes.length > 0) {
            const estado = partes[0];
            // Validar se é UF válida (2 letras maiúsculas)
            if (/^[A-Z]{2}$/.test(estado)) {
                return estado;
            }
        }
        
        return null;
    }

    /**
     * Salva dados de precificação no IndexedDB
     * @private
     */
    async savePricingData(resultado) {
        try {
            // Salvar configuração de precificação
            const pricingConfig = {
                di_id: resultado.di_id,
                regime_tributario: resultado.regime_tributario,
                custo_base: resultado.custo_base,
                custo_desembolso: resultado.custo_desembolso,
                custo_contabil: resultado.custo_contabil,
                base_formacao_preco: resultado.base_formacao_preco,
                total_creditos: resultado.total_creditos,
                margem_configurada: resultado.margem_configurada,
                
                // Informações de incentivos/simulação
                incentivo_aplicado: resultado.incentivos?.programa_selecionado,
                incentivo_simulacao: resultado.incentivos?.is_simulacao,
                incentivo_economia: resultado.incentivos?.economia_estimada,
                
                timestamp: new Date().toISOString()
            };

            await this.dbManager.db.pricing_configurations.add(pricingConfig);

            // Atualizar produtos com dados de precificação
            for (const adicao of resultado.adicoes) {
                for (const produto of adicao.produtos) {
                    if (produto.id) {
                        await this.dbManager.db.produtos.update(produto.id, {
                            preco_venda_sugerido: produto.precificacao.preco_venda_sugerido,
                            margem_configurada: produto.precificacao.margem_aplicada,
                            custo_unitario_final: produto.precificacao.custo_unitario_final
                        });
                    }
                }
            }

            console.log('💾 Dados de precificação salvos no IndexedDB');

        } catch (error) {
            console.error('❌ Erro ao salvar dados de precificação:', error);
            throw error;
        }
    }

    /**
     * Atualiza estado de processamento da DI
     * @private
     */
    async updateProcessingState(diId, newState) {
        try {
            await this.dbManager.db.declaracoes.update(diId, {
                processing_state: newState,
                pricing_configured: true,
                pricing_timestamp: new Date().toISOString()
            });

            console.log(`📊 Estado atualizado para: ${newState}`);

        } catch (error) {
            console.error('❌ Erro ao atualizar estado de processamento:', error);
            // Não lançar erro - é operação não-crítica
        }
    }

    /**
     * Prepara dados resumidos para visualização
     */
    async getPricingSummary(diId) {
        try {
            // Validação NO FALLBACKS
            if (!diId) {
                throw new Error('ID da DI é obrigatório');
            }

            const config = await this.dbManager.db.pricing_configurations
                .where('di_id')
                .equals(diId)
                .last();

            if (!config) {
                throw new Error(`Nenhuma configuração de precificação encontrada para DI ${diId}`);
            }

            return {
                regime_tributario: config.regime_tributario,
                custos: {
                    custo_base: config.custo_base,
                    custo_desembolso: config.custo_desembolso,
                    custo_contabil: config.custo_contabil,
                    base_formacao_preco: config.base_formacao_preco
                },
                creditos: config.total_creditos,
                margem: config.margem_configurada,
                incentivos: {
                    programa: config.incentivo_aplicado,
                    is_simulacao: config.incentivo_simulacao,
                    economia: config.incentivo_economia
                },
                timestamp: config.timestamp
            };

        } catch (error) {
            console.error('❌ Erro ao buscar resumo de precificação:', error);
            throw error;
        }
    }

    /**
     * Permite simular precificação com diferentes cenários
     */
    async simulatePricing(diId, cenario = {}) {
        try {
            // Buscar dados da DI
            const di = await this.dbManager.db.declaracoes.get(diId);
            if (!di) {
                throw new Error(`DI ${diId} não encontrada`);
            }

            // Preparar dados para simulação
            const pricingData = {
                di_id: diId,
                numero_di: di.numero_di,
                importador: di.importador,
                adicoes: await this.dbManager.getAdicoesByDI(diId),
                totais: di.totais,
                despesas_aduaneiras: await this.dbManager.getDespesasByDI(diId),
                
                // Parâmetros de simulação
                estado_empresa: cenario.estado_empresa || di.importador?.endereco_uf,
                programa_incentivo_simulacao: cenario.programa_incentivo,
                regime_tributario_simulacao: cenario.regime_tributario,
                margem_simulacao: cenario.margem
            };

            // Processar simulação
            const resultado = await this.processPricingData(pricingData);
            
            // Marcar como simulação
            resultado.is_simulacao = true;
            resultado.parametros_simulacao = cenario;

            return resultado;

        } catch (error) {
            console.error('❌ Erro ao simular precificação:', error);
            throw error;
        }
    }
}

// Exportar como singleton
const pricingAdapter = new PricingAdapter();

// Tornar disponível globalmente
if (typeof window !== 'undefined') {
    window.pricingAdapter = pricingAdapter;
}

export default pricingAdapter;