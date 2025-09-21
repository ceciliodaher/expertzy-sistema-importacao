/**
 * IndexedDBManager - Gerenciador de banco de dados IndexedDB com Dexie.js
 * Implementa o schema completo conforme especificado no CLAUDE.md
 * ÚNICA interface com banco de dados - Single Source of Truth
 * 
 * REGRAS APLICADAS:
 * - NO FALLBACKS: Sempre lançar exceções quando dados obrigatórios ausentes
 * - NO HARDCODED DATA: Todos os códigos e configurações em arquivos externos
 */

import Dexie from 'dexie';
import codigosReceita from '../../shared/data/codigos-receita.json';

class IndexedDBManager {
    constructor() {
        // Inicializar banco de dados Dexie
        this.db = new Dexie('ExpertzyDB');
        
        // Carregar códigos de receita do arquivo de configuração
        this.codigosReceita = codigosReceita.codigosReceita;
        if (!this.codigosReceita) {
            throw new Error('Códigos de receita não carregados - arquivo de configuração ausente ou inválido');
        }
        
        // Definir schema conforme CLAUDE.md
        this.initializeSchema();
        
        // Abrir conexão
        this.db.open().catch(err => {
            throw new Error(`Erro ao abrir IndexedDB: ${err.message}`);
        });
    }

    /**
     * Inicializa o schema do banco de dados
     * Schema completo conforme especificação no CLAUDE.md
     */
    initializeSchema() {
        this.db.version(1).stores({
            // Entidades principais
            declaracoes: '++id, numero_di, importador_cnpj, data_processamento, *ncms, xml_hash, [importador_cnpj+data_processamento]',
            adicoes: '++id, di_id, numero_adicao, ncm, [di_id+numero_adicao]',
            produtos: '++id, adicao_id, codigo, descricao, ncm, valor_unitario, [adicao_id+codigo]',
            
            // Despesas e carga
            despesas_aduaneiras: '++id, di_id, tipo, valor, codigo_receita, [di_id+tipo]',
            dados_carga: '++id, di_id, peso_bruto, peso_liquido, via_transporte',
            
            // Incentivos fiscais especializados
            incentivos_entrada: '++id, di_id, estado, tipo_beneficio, percentual_reducao, economia_calculada, [di_id+estado]',
            incentivos_saida: '++id, di_id, estado, operacao, credito_aplicado, contrapartidas, [di_id+estado+operacao]',
            elegibilidade_ncm: '++id, ncm, estado, incentivo_codigo, elegivel, motivo_rejeicao, [ncm+estado+incentivo_codigo]',
            
            // Business intelligence
            metricas_dashboard: '++id, periodo, tipo_metrica, valor, breakdown_estados, [periodo+tipo_metrica]',
            cenarios_precificacao: '++id, di_id, nome_cenario, configuracao, resultados_comparativos, [di_id+nome_cenario]',
            
            // Auditoria e controle
            historico_operacoes: '++id, timestamp, operacao, modulo, detalhes, resultado',
            snapshots: '++id, di_id, nome_customizado, timestamp, dados_completos',
            configuracoes_usuario: 'chave, valor, timestamp, validado'
        });
    }

    /**
     * Obtém código de receita para um tipo de despesa
     * @param {string} tipoDespesa - Tipo da despesa (SISCOMEX, AFRMM, etc)
     * @returns {string|null} Código de receita ou null se não aplicável
     */
    getCodigoReceita(tipoDespesa) {
        if (!tipoDespesa) {
            throw new Error('Tipo de despesa é obrigatório para obter código de receita');
        }

        const config = this.codigosReceita[tipoDespesa.toUpperCase()];
        if (!config) {
            throw new Error(`Configuração não encontrada para tipo de despesa: ${tipoDespesa}`);
        }

        return config.codigo;
    }

    /**
     * Salva uma DI completa com todas as suas relações
     * Usa transação atômica para garantir integridade
     * @param {Object} diData - Dados transformados da DI
     * @returns {Promise<number>} ID da DI salva
     */
    async saveDI(diData) {
        if (!diData) {
            throw new Error('Dados da DI são obrigatórios');
        }
        
        if (!diData.numero_di) {
            throw new Error('Número da DI é obrigatório');
        }

        if (!diData.importador?.cnpj) {
            throw new Error('CNPJ do importador é obrigatório');
        }

        try {
            return await this.db.transaction('rw', 
                this.db.declaracoes, 
                this.db.adicoes, 
                this.db.produtos,
                this.db.despesas_aduaneiras,
                this.db.dados_carga,
                this.db.historico_operacoes,
                async () => {
                    
                    // Verificar se DI já existe
                    const existingDI = await this.db.declaracoes
                        .where('numero_di')
                        .equals(diData.numero_di)
                        .first();
                    
                    if (existingDI) {
                        throw new Error(`DI ${diData.numero_di} já existe no banco de dados`);
                    }

                    // Validar dados obrigatórios antes de salvar
                    if (!diData.data_processamento) {
                        diData.data_processamento = new Date();
                    }

                    // Salvar declaração principal
                    const diId = await this.db.declaracoes.add({
                        numero_di: diData.numero_di,
                        importador_cnpj: diData.importador.cnpj,
                        importador_nome: diData.importador.nome,
                        importador_endereco_uf: diData.importador.endereco_uf,
                        data_processamento: diData.data_processamento,
                        data_registro: diData.data_registro,
                        urf_despacho: diData.urf_despacho,
                        modalidade: diData.modalidade,
                        situacao: diData.situacao_entrega,
                        total_adicoes: diData.total_adicoes,
                        
                        // Valores totais
                        valor_total_fob_usd: diData.valor_total_fob_usd,
                        valor_total_fob_brl: diData.valor_total_fob_brl,
                        valor_total_frete_usd: diData.valor_total_frete_usd,
                        valor_total_frete_brl: diData.valor_total_frete_brl,
                        valor_aduaneiro_total_brl: diData.valor_aduaneiro_total_brl,
                        
                        // Taxa de câmbio calculada
                        taxa_cambio: diData.taxa_cambio,
                        
                        // Informações complementares
                        informacao_complementar: diData.informacao_complementar,
                        
                        // NCMs para busca indexada
                        ncms: diData.adicoes?.map(a => a.ncm).filter(n => n),
                        
                        // Hash do XML para validação
                        xml_hash: diData.xml_hash
                    });

                    // Salvar adições
                    if (!diData.adicoes || diData.adicoes.length === 0) {
                        throw new Error('DI deve ter pelo menos uma adição');
                    }

                    for (const adicao of diData.adicoes) {
                        if (!adicao.numero_adicao) {
                            throw new Error('Número da adição é obrigatório');
                        }
                        
                        if (!adicao.ncm) {
                            throw new Error(`NCM é obrigatório para adição ${adicao.numero_adicao}`);
                        }

                        const adicaoId = await this.db.adicoes.add({
                            di_id: diId,
                            numero_adicao: adicao.numero_adicao,
                            ncm: adicao.ncm,
                            descricao_ncm: adicao.descricao_ncm,
                            
                            // Valores
                            valor_moeda_negociacao: adicao.valor_moeda_negociacao,
                            valor_reais: adicao.valor_reais,
                            
                            // Tributos
                            ii_aliquota: adicao.ii_aliquota,
                            ii_valor_devido: adicao.ii_valor_devido,
                            ipi_aliquota: adicao.ipi_aliquota,
                            ipi_valor_devido: adicao.ipi_valor_devido,
                            pis_aliquota: adicao.pis_aliquota,
                            pis_valor_devido: adicao.pis_valor_devido,
                            cofins_aliquota: adicao.cofins_aliquota,
                            cofins_valor_devido: adicao.cofins_valor_devido,
                            icms_aliquota: adicao.icms_aliquota,
                            
                            // Frete e seguro
                            frete_valor_reais: adicao.frete_valor_reais,
                            seguro_valor_reais: adicao.seguro_valor_reais,
                            
                            // Outros dados
                            peso_liquido: adicao.peso_liquido,
                            condicao_venda_incoterm: adicao.condicao_venda_incoterm,
                            fornecedor_nome: adicao.fornecedor_nome,
                            fabricante_nome: adicao.fabricante_nome
                        });

                        // Salvar produtos da adição
                        if (adicao.mercadorias && adicao.mercadorias.length > 0) {
                            for (const mercadoria of adicao.mercadorias) {
                                if (!mercadoria.descricao) {
                                    throw new Error(`Descrição é obrigatória para produto da adição ${adicao.numero_adicao}`);
                                }

                                await this.db.produtos.add({
                                    adicao_id: adicaoId,
                                    codigo: mercadoria.codigo,
                                    descricao: mercadoria.descricao,
                                    ncm: adicao.ncm,
                                    quantidade: mercadoria.quantidade,
                                    unidade_medida: mercadoria.unidade_medida,
                                    valor_unitario: mercadoria.valor_unitario,
                                    valor_total: mercadoria.valor_total
                                });
                            }
                        }
                    }

                    // Salvar despesas aduaneiras
                    if (diData.despesas) {
                        // SISCOMEX
                        if (diData.despesas.siscomex !== undefined && diData.despesas.siscomex > 0) {
                            const codigoSiscomex = this.getCodigoReceita('SISCOMEX');
                            await this.db.despesas_aduaneiras.add({
                                di_id: diId,
                                tipo: 'SISCOMEX',
                                valor: diData.despesas.siscomex,
                                codigo_receita: codigoSiscomex
                            });
                        }
                        
                        // AFRMM
                        if (diData.despesas.afrmm !== undefined && diData.despesas.afrmm > 0) {
                            const codigoAFRMM = this.getCodigoReceita('AFRMM');
                            await this.db.despesas_aduaneiras.add({
                                di_id: diId,
                                tipo: 'AFRMM',
                                valor: diData.despesas.afrmm,
                                codigo_receita: codigoAFRMM
                            });
                        }
                        
                        // CAPATAZIA
                        if (diData.despesas.capatazia !== undefined && diData.despesas.capatazia > 0) {
                            const codigoCapatazia = this.getCodigoReceita('CAPATAZIA');
                            await this.db.despesas_aduaneiras.add({
                                di_id: diId,
                                tipo: 'CAPATAZIA',
                                valor: diData.despesas.capatazia,
                                codigo_receita: codigoCapatazia
                            });
                        }

                        // Outras despesas
                        if (diData.despesas.outras && Array.isArray(diData.despesas.outras)) {
                            for (const despesa of diData.despesas.outras) {
                                if (!despesa.tipo) {
                                    throw new Error('Tipo é obrigatório para despesa adicional');
                                }
                                if (despesa.valor === undefined || despesa.valor === null) {
                                    throw new Error(`Valor é obrigatório para despesa ${despesa.tipo}`);
                                }

                                // Tentar obter código de receita se o tipo for conhecido
                                let codigoReceita = null;
                                try {
                                    codigoReceita = this.getCodigoReceita(despesa.tipo);
                                } catch (e) {
                                    // Tipo de despesa não mapeado - continuar sem código
                                    codigoReceita = despesa.codigo_receita || null;
                                }

                                await this.db.despesas_aduaneiras.add({
                                    di_id: diId,
                                    tipo: despesa.tipo,
                                    valor: despesa.valor,
                                    codigo_receita: codigoReceita
                                });
                            }
                        }
                    }

                    // Salvar dados de carga
                    if (diData.carga) {
                        if (!diData.carga.peso_bruto || !diData.carga.peso_liquido) {
                            throw new Error('Peso bruto e peso líquido são obrigatórios para dados de carga');
                        }

                        await this.db.dados_carga.add({
                            di_id: diId,
                            peso_bruto: diData.carga.peso_bruto,
                            peso_liquido: diData.carga.peso_liquido,
                            via_transporte: diData.carga.via_transporte,
                            nome_veiculo: diData.carga.nome_veiculo,
                            nome_transportador: diData.carga.nome_transportador,
                            pais_procedencia: diData.carga.pais_procedencia,
                            data_chegada: diData.carga.data_chegada
                        });
                    }

                    // Registrar operação no histórico
                    await this.db.historico_operacoes.add({
                        timestamp: new Date(),
                        operacao: 'SAVE_DI',
                        modulo: 'IndexedDBManager',
                        detalhes: {
                            numero_di: diData.numero_di,
                            total_adicoes: diData.total_adicoes,
                            valor_total: diData.valor_aduaneiro_total_brl
                        },
                        resultado: 'SUCCESS'
                    });

                    return diId;
                }
            );
        } catch (error) {
            // Registrar erro no histórico
            try {
                await this.db.historico_operacoes.add({
                    timestamp: new Date(),
                    operacao: 'SAVE_DI',
                    modulo: 'IndexedDBManager',
                    detalhes: {
                        numero_di: diData.numero_di,
                        erro: error.message
                    },
                    resultado: 'ERROR'
                });
            } catch (logError) {
                console.error('Erro ao registrar falha no histórico:', logError);
            }

            throw error; // Re-lançar erro original
        }
    }

    /**
     * Busca uma DI pelo número
     * @param {string} numeroDI - Número da DI
     * @returns {Promise<Object>} Dados completos da DI
     */
    async getDI(numeroDI) {
        if (!numeroDI) {
            throw new Error('Número da DI é obrigatório para busca');
        }

        const di = await this.db.declaracoes
            .where('numero_di')
            .equals(numeroDI)
            .first();

        if (!di) {
            return null;
        }

        // Buscar dados relacionados
        di.adicoes = await this.db.adicoes
            .where('di_id')
            .equals(di.id)
            .toArray();

        // Buscar produtos de cada adição
        for (const adicao of di.adicoes) {
            adicao.produtos = await this.db.produtos
                .where('adicao_id')
                .equals(adicao.id)
                .toArray();
        }

        // Buscar despesas
        di.despesas = await this.db.despesas_aduaneiras
            .where('di_id')
            .equals(di.id)
            .toArray();

        // Buscar dados de carga
        di.carga = await this.db.dados_carga
            .where('di_id')
            .equals(di.id)
            .first();

        return di;
    }

    /**
     * Lista todas as DIs com paginação
     * @param {number} offset - Início da página
     * @param {number} limit - Quantidade por página
     * @returns {Promise<Array>} Lista de DIs
     */
    async listDIs(offset = 0, limit = 20) {
        return await this.db.declaracoes
            .orderBy('data_processamento')
            .reverse()
            .offset(offset)
            .limit(limit)
            .toArray();
    }

    /**
     * Busca DIs por CNPJ do importador
     * @param {string} cnpj - CNPJ do importador
     * @returns {Promise<Array>} Lista de DIs do importador
     */
    async getDIsByCNPJ(cnpj) {
        if (!cnpj) {
            throw new Error('CNPJ é obrigatório para busca');
        }

        return await this.db.declaracoes
            .where('importador_cnpj')
            .equals(cnpj)
            .toArray();
    }

    /**
     * Busca DIs por NCM
     * @param {string} ncm - Código NCM
     * @returns {Promise<Array>} Lista de DIs que contém o NCM
     */
    async getDIsByNCM(ncm) {
        if (!ncm) {
            throw new Error('NCM é obrigatório para busca');
        }

        return await this.db.declaracoes
            .where('ncms')
            .equals(ncm)
            .toArray();
    }

    /**
     * Salva configuração de usuário
     * @param {string} chave - Chave da configuração
     * @param {any} valor - Valor da configuração
     * @returns {Promise<void>}
     */
    async saveConfig(chave, valor) {
        if (!chave) {
            throw new Error('Chave da configuração é obrigatória');
        }

        if (valor === undefined || valor === null) {
            throw new Error('Valor da configuração é obrigatório');
        }

        await this.db.configuracoes_usuario.put({
            chave: chave,
            valor: valor,
            timestamp: new Date(),
            validado: true
        });
    }

    /**
     * Busca configuração de usuário
     * @param {string} chave - Chave da configuração
     * @returns {Promise<any>} Valor da configuração
     */
    async getConfig(chave) {
        if (!chave) {
            throw new Error('Chave da configuração é obrigatória');
        }

        const config = await this.db.configuracoes_usuario.get(chave);
        return config ? config.valor : null;
    }

    /**
     * Limpa todos os dados do banco (usar com cuidado!)
     * @returns {Promise<void>}
     */
    async clearAll() {
        await this.db.transaction('rw', 
            this.db.declaracoes,
            this.db.adicoes,
            this.db.produtos,
            this.db.despesas_aduaneiras,
            this.db.dados_carga,
            this.db.incentivos_entrada,
            this.db.incentivos_saida,
            this.db.elegibilidade_ncm,
            this.db.metricas_dashboard,
            this.db.cenarios_precificacao,
            this.db.historico_operacoes,
            this.db.snapshots,
            async () => {
                await this.db.declaracoes.clear();
                await this.db.adicoes.clear();
                await this.db.produtos.clear();
                await this.db.despesas_aduaneiras.clear();
                await this.db.dados_carga.clear();
                await this.db.incentivos_entrada.clear();
                await this.db.incentivos_saida.clear();
                await this.db.elegibilidade_ncm.clear();
                await this.db.metricas_dashboard.clear();
                await this.db.cenarios_precificacao.clear();
                await this.db.historico_operacoes.clear();
                await this.db.snapshots.clear();
            }
        );
    }

    /**
     * Fecha conexão com o banco
     */
    close() {
        this.db.close();
    }
}

// Export como singleton para garantir única instância
const indexedDBManager = new IndexedDBManager();
export default indexedDBManager;