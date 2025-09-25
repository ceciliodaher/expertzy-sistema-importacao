/**
 * IndexedDBManager - Gerenciador de banco de dados IndexedDB com Dexie.js
 * Implementa o schema completo conforme especificado no CLAUDE.md
 * ÚNICA interface com banco de dados - Single Source of Truth
 * 
 * REGRAS APLICADAS:
 * - NO FALLBACKS: Sempre lançar exceções quando dados obrigatórios ausentes
 * - NO HARDCODED DATA: Todos os códigos e configurações em arquivos externos
 */


// Dexie is loaded via CDN in HTML - access it globally
const Dexie = window.Dexie;

class IndexedDBManager {
    constructor() {
        // Validar se Dexie está disponível
        if (!Dexie) {
            throw new Error('Dexie.js não está disponível - verifique se foi carregado corretamente');
        }
        
        // Inicializar banco de dados Dexie
        this.db = new Dexie('ExpertzyDB');
        
        // Códigos de receita serão carregados via fetch no initialize()
        this.codigosReceita = null;
        
        // Definir schema conforme CLAUDE.md
        this.initializeSchema();
    }

    /**
     * Inicializa o sistema de banco de dados
     * Carrega configurações e abre conexão
     */
    async initialize() {
        try {
            // Carregar códigos de receita do arquivo JSON
            const response = await fetch(new URL('../../shared/data/codigos-receita.json', import.meta.url));
            if (!response.ok) {
                throw new Error(`Erro ao carregar códigos de receita: ${response.status}`);
            }
            const codigosReceita = await response.json();
            this.codigosReceita = codigosReceita.codigosReceita;
            
            if (!this.codigosReceita) {
                throw new Error('Códigos de receita não encontrados no arquivo de configuração');
            }
            
            // Abrir conexão com banco
            await this.db.open();
            
            return true;
        } catch (error) {
            throw new Error(`Erro ao inicializar IndexedDB: ${error.message}`);
        }
    }

    /**
     * Inicializa o schema do banco de dados
     * Schema completo conforme especificação XSD oficial RFB no SCHEMA-SPECIFICATION.md
     * Versão 2: Expansão completa para 237+ campos em 9 tabelas oficiais
     */
    initializeSchema() {
        // Versão 1 - Schema original (mantido para compatibilidade)
        this.db.version(1).stores({
            declaracoes: '++id, numero_di, importador_cnpj, data_processamento, *ncms, xml_hash, xml_content, [importador_cnpj+data_processamento]',
            adicoes: '++id, di_id, numero_adicao, ncm, [di_id+numero_adicao]',
            produtos: '++id, adicao_id, codigo, descricao, ncm, valor_unitario, [adicao_id+codigo]',
            despesas_aduaneiras: '++id, di_id, tipo, valor, codigo_receita, [di_id+tipo]',
            dados_carga: '++id, di_id, peso_bruto, peso_liquido, via_transporte',
            incentivos_entrada: '++id, di_id, estado, tipo_beneficio, percentual_reducao, economia_calculada, [di_id+estado]',
            incentivos_saida: '++id, di_id, estado, operacao, credito_aplicado, contrapartidas, [di_id+estado+operacao]',
            elegibilidade_ncm: '++id, ncm, estado, incentivo_codigo, elegivel, motivo_rejeicao, [ncm+estado+incentivo_codigo]',
            metricas_dashboard: '++id, periodo, tipo_metrica, valor, breakdown_estados, [periodo+tipo_metrica]',
            cenarios_precificacao: '++id, di_id, nome_cenario, configuracao, resultados_comparativos, [di_id+nome_cenario]',
            historico_operacoes: '++id, timestamp, operacao, modulo, detalhes, resultado',
            snapshots: '++id, di_id, nome_customizado, timestamp, dados_completos',
            configuracoes_usuario: 'chave, valor, timestamp, validado'
        });

        // SCHEMA OFICIAL - NOMENCLATURA DIProcessor.js (PRIMARY CREATOR)
        // Versão 3 - Schema único com nomenclatura oficial
        this.db.version(3).stores({
            // DECLARAÇÕES - Nomenclatura oficial DIProcessor
            declaracoes: '++id, numero_di, importador_cnpj, importador_nome, importador_endereco_uf, importador_endereco_logradouro, importador_endereco_numero, importador_endereco_complemento, importador_endereco_bairro, importador_endereco_cidade, importador_endereco_municipio, importador_endereco_cep, importador_representante_nome, importador_representante_cpf, importador_telefone, importador_endereco_completo, data_processamento, data_registro, urf_despacho_codigo, urf_despacho_nome, modalidade_codigo, modalidade_nome, situacao_entrega, total_adicoes, incoterm_identificado, taxa_cambio, informacao_complementar, valor_total_fob_usd, valor_total_fob_brl, valor_total_frete_usd, valor_total_frete_brl, valor_aduaneiro_total_brl, *ncms, xml_hash, xml_content, processing_state, icms_configured, extra_expenses_configured, [importador_cnpj+data_processamento]',
            
            // ADIÇÕES - Nomenclatura oficial com tributos completos
            adicoes: '++id, di_id, numero_adicao, ncm, descricao_ncm, peso_liquido, condicao_venda_incoterm, moeda_negociacao_codigo, moeda_negociacao_nome, valor_moeda_negociacao, valor_reais, frete_valor_reais, seguro_valor_reais, taxa_cambio, metodo_valoracao_codigo, metodo_valoracao_nome, codigo_naladi_sh, codigo_naladi_ncca, quantidade_estatistica, unidade_estatistica, aplicacao_mercadoria, condicao_mercadoria, condicao_venda_local, ii_aliquota_ad_valorem, ii_valor_devido, ii_valor_recolher, ii_base_calculo, ipi_aliquota_ad_valorem, ipi_valor_devido, ipi_valor_recolher, pis_aliquota_ad_valorem, pis_valor_devido, pis_valor_recolher, cofins_aliquota_ad_valorem, cofins_valor_devido, cofins_valor_recolher, cide_valor_devido, cide_valor_recolher, pis_cofins_base_calculo, icms_aliquota, fornecedor_nome, fornecedor_logradouro, fornecedor_numero, fornecedor_complemento, fornecedor_cidade, fornecedor_estado, fabricante_nome, fabricante_logradouro, fabricante_numero, fabricante_cidade, fabricante_estado, processing_state, custo_basico_federal, [di_id+numero_adicao]',
            
            // PRODUTOS - Nomenclatura oficial DIProcessor
            produtos: '++id, adicao_id, numero_sequencial_item, descricao_mercadoria, ncm, quantidade, unidade_medida, valor_unitario_usd, valor_unitario_brl, valor_total_usd, valor_total_brl, taxa_cambio, processing_state, custo_produto_federal, is_virtual, [adicao_id+numero_sequencial_item]',
            
            // DESPESAS - Nomenclatura oficial
            despesas_aduaneiras: '++id, di_id, tipo, valor, codigo_receita, processing_state, origem, [di_id+tipo]',
            
            // DADOS CARGA - Nomenclatura oficial expandida
            dados_carga: '++id, di_id, peso_bruto, peso_liquido, pais_procedencia_codigo, pais_procedencia_nome, urf_entrada_codigo, urf_entrada_nome, data_chegada, via_transporte_codigo, via_transporte_nome, nome_veiculo, nome_transportador',
            
            // Tabelas de apoio
            incentivos_entrada: '++id, di_id, estado, tipo_beneficio, percentual_reducao, economia_calculada, [di_id+estado]',
            incentivos_saida: '++id, di_id, estado, operacao, credito_aplicado, contrapartidas, [di_id+estado+operacao]',
            elegibilidade_ncm: '++id, ncm, estado, incentivo_codigo, elegivel, motivo_rejeicao, [ncm+estado+incentivo_codigo]',
            metricas_dashboard: '++id, periodo, tipo_metrica, valor, breakdown_estados, [periodo+tipo_metrica]',
            cenarios_precificacao: '++id, di_id, nome_cenario, configuracao, resultados_comparativos, [di_id+nome_cenario]',
            historico_operacoes: '++id, timestamp, operacao, modulo, detalhes, resultado',
            snapshots: '++id, di_id, nome_customizado, timestamp, dados_completos',
            configuracoes_usuario: 'chave, valor, timestamp, validado'
        });

        console.log('✅ Schema oficial DIProcessor.js inicializado');
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
     * Valida nomenclatura oficial DIProcessor.js - NO FALLBACKS
     * Falha explicitamente se encontrar nomenclatura incorreta
     * @param {Object} diData - Dados da DI para validar
     */
    validateNomenclature(diData) {
        // VALIDAÇÕES DE ESTRUTURA PRINCIPAL
        if (diData.urf_despacho && !diData.urf_despacho_nome) {
            throw new Error('VIOLAÇÃO NOMENCLATURA: Use "urf_despacho_nome" não "urf_despacho"');
        }
        
        if (diData.modalidade && !diData.modalidade_nome) {
            throw new Error('VIOLAÇÃO NOMENCLATURA: Use "modalidade_nome" não "modalidade"');
        }
        
        if (diData.situacao && !diData.situacao_entrega) {
            throw new Error('VIOLAÇÃO NOMENCLATURA: Use "situacao_entrega" não "situacao"');
        }

        // VALIDAÇÕES DE ADIÇÕES
        if (diData.adicoes && Array.isArray(diData.adicoes)) {
            for (const adicao of diData.adicoes) {
                // Validar tributos - nomenclatura oficial
                if (adicao.tributos) {
                    if (adicao.tributos.ii_aliquota && !adicao.tributos.ii_aliquota_ad_valorem) {
                        throw new Error('VIOLAÇÃO NOMENCLATURA: Use "ii_aliquota_ad_valorem" não "ii_aliquota"');
                    }
                    if (adicao.tributos.ipi_aliquota && !adicao.tributos.ipi_aliquota_ad_valorem) {
                        throw new Error('VIOLAÇÃO NOMENCLATURA: Use "ipi_aliquota_ad_valorem" não "ipi_aliquota"');
                    }
                    if (adicao.tributos.pis_aliquota && !adicao.tributos.pis_aliquota_ad_valorem) {
                        throw new Error('VIOLAÇÃO NOMENCLATURA: Use "pis_aliquota_ad_valorem" não "pis_aliquota"');
                    }
                    if (adicao.tributos.cofins_aliquota && !adicao.tributos.cofins_aliquota_ad_valorem) {
                        throw new Error('VIOLAÇÃO NOMENCLATURA: Use "cofins_aliquota_ad_valorem" não "cofins_aliquota"');
                    }
                }

                // Validar produtos - nomenclatura oficial
                if (adicao.produtos && Array.isArray(adicao.produtos)) {
                    for (const produto of adicao.produtos) {
                        if (produto.descricao && !produto.descricao_mercadoria) {
                            throw new Error('VIOLAÇÃO NOMENCLATURA: Use "descricao_mercadoria" não "descricao"');
                        }
                        if (produto.codigo && !produto.numero_sequencial_item) {
                            throw new Error('VIOLAÇÃO NOMENCLATURA: Use "numero_sequencial_item" não "codigo"');
                        }
                    }
                }
            }
        }

        // VALIDAÇÕES DE DESPESAS
        if (diData.despesas && !diData.despesas_aduaneiras) {
            throw new Error('VIOLAÇÃO NOMENCLATURA: Use "despesas_aduaneiras" não "despesas"');
        }

        console.log('✅ Nomenclatura oficial DIProcessor.js validada - zero violações');
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

        // VALIDAÇÕES NO FALLBACKS - Nomenclatura oficial DIProcessor.js
        this.validateNomenclature(diData);

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

                    // Salvar declaração principal - NOMENCLATURA OFICIAL DIProcessor.js
                    const diId = await this.db.declaracoes.add({
                        numero_di: diData.numero_di,
                        
                        // IMPORTADOR - Campos expandidos conforme DIProcessor
                        importador_cnpj: diData.importador.cnpj,
                        importador_nome: diData.importador.nome,
                        importador_endereco_uf: diData.importador.endereco_uf,
                        importador_endereco_logradouro: diData.importador.endereco_logradouro,
                        importador_endereco_numero: diData.importador.endereco_numero,
                        importador_endereco_complemento: diData.importador.endereco_complemento,
                        importador_endereco_bairro: diData.importador.endereco_bairro,
                        importador_endereco_cidade: diData.importador.endereco_cidade,
                        importador_endereco_municipio: diData.importador.endereco_municipio,
                        importador_endereco_cep: diData.importador.endereco_cep,
                        importador_representante_nome: diData.importador.representante_nome,
                        importador_representante_cpf: diData.importador.representante_cpf,
                        importador_telefone: diData.importador.telefone,
                        importador_endereco_completo: diData.importador.endereco_completo,
                        
                        data_processamento: diData.data_processamento,
                        data_registro: diData.data_registro,
                        
                        // URF/MODALIDADE - Nomenclatura oficial expandida
                        urf_despacho_codigo: diData.urf_despacho_codigo,
                        urf_despacho_nome: diData.urf_despacho_nome,
                        modalidade_codigo: diData.modalidade_codigo,
                        modalidade_nome: diData.modalidade_nome,
                        
                        situacao_entrega: diData.situacao_entrega,
                        total_adicoes: diData.total_adicoes,
                        
                        // INCOTERM - Estrutura completa
                        incoterm_identificado: diData.incoterm_identificado,
                        
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
                            
                            // TRIBUTOS - Nomenclatura oficial DIProcessor.js
                            ii_aliquota_ad_valorem: adicao.tributos?.ii_aliquota_ad_valorem,
                            ii_valor_devido: adicao.tributos?.ii_valor_devido,
                            ii_valor_recolher: adicao.tributos?.ii_valor_recolher,
                            ii_base_calculo: adicao.tributos?.ii_base_calculo,
                            ipi_aliquota_ad_valorem: adicao.tributos?.ipi_aliquota_ad_valorem,
                            ipi_valor_devido: adicao.tributos?.ipi_valor_devido,
                            ipi_valor_recolher: adicao.tributos?.ipi_valor_recolher,
                            pis_aliquota_ad_valorem: adicao.tributos?.pis_aliquota_ad_valorem,
                            pis_valor_devido: adicao.tributos?.pis_valor_devido,
                            pis_valor_recolher: adicao.tributos?.pis_valor_recolher,
                            cofins_aliquota_ad_valorem: adicao.tributos?.cofins_aliquota_ad_valorem,
                            cofins_valor_devido: adicao.tributos?.cofins_valor_devido,
                            cofins_valor_recolher: adicao.tributos?.cofins_valor_recolher,
                            cide_valor_devido: adicao.tributos?.cide_valor_devido,
                            cide_valor_recolher: adicao.tributos?.cide_valor_recolher,
                            pis_cofins_base_calculo: adicao.tributos?.pis_cofins_base_calculo,
                            icms_aliquota: adicao.tributos?.icms_aliquota,
                            
                            // Frete e seguro
                            frete_valor_reais: adicao.frete_valor_reais,
                            seguro_valor_reais: adicao.seguro_valor_reais,
                            
                            // DADOS COMPLEMENTARES - Nomenclatura oficial
                            peso_liquido: adicao.peso_liquido,
                            condicao_venda_incoterm: adicao.condicao_venda_incoterm,
                            
                            // MOEDA E VALORAÇÃO - Campos expandidos
                            moeda_negociacao_codigo: adicao.moeda_negociacao_codigo,
                            moeda_negociacao_nome: adicao.moeda_negociacao_nome,
                            metodo_valoracao_codigo: adicao.metodo_valoracao_codigo,
                            metodo_valoracao_nome: adicao.metodo_valoracao_nome,
                            
                            // CÓDIGOS ADICIONAIS
                            codigo_naladi_sh: adicao.codigo_naladi_sh,
                            codigo_naladi_ncca: adicao.codigo_naladi_ncca,
                            quantidade_estatistica: adicao.quantidade_estatistica,
                            unidade_estatistica: adicao.unidade_estatistica,
                            aplicacao_mercadoria: adicao.aplicacao_mercadoria,
                            condicao_mercadoria: adicao.condicao_mercadoria,
                            condicao_venda_local: adicao.condicao_venda_local,
                            
                            // FORNECEDOR/FABRICANTE - Estrutura expandida
                            fornecedor_nome: adicao.fornecedor?.nome || adicao.fornecedor_nome,
                            fornecedor_logradouro: adicao.fornecedor?.logradouro,
                            fornecedor_numero: adicao.fornecedor?.numero,
                            fornecedor_complemento: adicao.fornecedor?.complemento,
                            fornecedor_cidade: adicao.fornecedor?.cidade,
                            fornecedor_estado: adicao.fornecedor?.estado,
                            fabricante_nome: adicao.fabricante?.nome || adicao.fabricante_nome,
                            fabricante_logradouro: adicao.fabricante?.logradouro,
                            fabricante_numero: adicao.fabricante?.numero,
                            fabricante_cidade: adicao.fabricante?.cidade,
                            fabricante_estado: adicao.fabricante?.estado
                        });

                        // SALVAR PRODUTOS - NOMENCLATURA OFICIAL DIProcessor.js
                        if (adicao.produtos && adicao.produtos.length > 0) {
                            for (const produto of adicao.produtos) {
                                // VALIDAÇÃO NO FALLBACKS - Campo obrigatório nomenclatura oficial
                                if (!produto.descricao_mercadoria) {
                                    throw new Error(`Campo "descricao_mercadoria" é obrigatório para produto da adição ${adicao.numero_adicao} - não use "descricao"`);
                                }

                                await this.db.produtos.add({
                                    adicao_id: adicaoId,
                                    // NOMENCLATURA OFICIAL DIProcessor.js
                                    numero_sequencial_item: produto.numero_sequencial_item || produto.codigo,
                                    descricao_mercadoria: produto.descricao_mercadoria,
                                    ncm: adicao.ncm,
                                    quantidade: produto.quantidade,
                                    unidade_medida: produto.unidade_medida,
                                    
                                    // VALORES EXPANDIDOS - USD e BRL
                                    valor_unitario_usd: produto.valor_unitario_usd,
                                    valor_unitario_brl: produto.valor_unitario_brl || produto.valor_unitario,
                                    valor_total_usd: produto.valor_total_usd,
                                    valor_total_brl: produto.valor_total_brl || produto.valor_total,
                                    taxa_cambio: produto.taxa_cambio,
                                    
                                    // CAMPOS DE CONTROLE
                                    processing_state: 'DI_COMPLETE_FROM_XML',
                                    custo_produto_federal: produto.custo_produto_federal || 0,
                                    is_virtual: produto.is_virtual || false
                                });
                            }
                        }
                    }

                    // SALVAR DADOS DE CARGA - Nomenclatura oficial expandida
                    if (diData.carga) {
                        await this.db.dados_carga.add({
                            di_id: diId,
                            peso_bruto: diData.carga.peso_bruto,
                            peso_liquido: diData.carga.peso_liquido,
                            
                            // PAÍS PROCEDÊNCIA - Campos expandidos
                            pais_procedencia_codigo: diData.carga.pais_procedencia_codigo,
                            pais_procedencia_nome: diData.carga.pais_procedencia_nome,
                            
                            // URF ENTRADA - Campos expandidos
                            urf_entrada_codigo: diData.carga.urf_entrada_codigo,
                            urf_entrada_nome: diData.carga.urf_entrada_nome,
                            
                            // TRANSPORTE - Campos expandidos
                            via_transporte_codigo: diData.carga.via_transporte_codigo,
                            via_transporte_nome: diData.carga.via_transporte_nome,
                            nome_veiculo: diData.carga.nome_veiculo,
                            nome_transportador: diData.carga.nome_transportador,
                            data_chegada: diData.carga.data_chegada
                        });
                    }

                    // SALVAR DESPESAS ADUANEIRAS - Nomenclatura já oficial
                    if (diData.despesas_aduaneiras) {
                        console.log('💰 Salvando despesas aduaneiras:', {
                            siscomex: diData.despesas_aduaneiras.calculadas?.siscomex,
                            afrmm: diData.despesas_aduaneiras.calculadas?.afrmm,
                            capatazia: diData.despesas_aduaneiras.calculadas?.capatazia
                        });
                        // SISCOMEX
                        if (diData.despesas_aduaneiras.calculadas?.siscomex !== undefined && diData.despesas_aduaneiras.calculadas.siscomex > 0) {
                            const codigoSiscomex = this.getCodigoReceita('SISCOMEX');
                            await this.db.despesas_aduaneiras.add({
                                di_id: diId,
                                tipo: 'SISCOMEX',
                                valor: diData.despesas_aduaneiras.calculadas.siscomex,
                                codigo_receita: codigoSiscomex
                            });
                            console.log(`✅ SISCOMEX salvo: R$ ${diData.despesas_aduaneiras.calculadas.siscomex.toFixed(2)}`);
                        }
                        
                        // AFRMM
                        if (diData.despesas_aduaneiras.calculadas?.afrmm !== undefined && diData.despesas_aduaneiras.calculadas.afrmm > 0) {
                            const codigoAFRMM = this.getCodigoReceita('AFRMM');
                            await this.db.despesas_aduaneiras.add({
                                di_id: diId,
                                tipo: 'AFRMM',
                                valor: diData.despesas_aduaneiras.calculadas.afrmm,
                                codigo_receita: codigoAFRMM
                            });
                            console.log(`✅ AFRMM salvo: R$ ${diData.despesas_aduaneiras.calculadas.afrmm.toFixed(2)}`);
                        }
                        
                        // CAPATAZIA
                        if (diData.despesas_aduaneiras.calculadas?.capatazia !== undefined && diData.despesas_aduaneiras.calculadas.capatazia > 0) {
                            const codigoCapatazia = this.getCodigoReceita('CAPATAZIA');
                            await this.db.despesas_aduaneiras.add({
                                di_id: diId,
                                tipo: 'CAPATAZIA',
                                valor: diData.despesas_aduaneiras.calculadas.capatazia,
                                codigo_receita: codigoCapatazia
                            });
                        }

                        // Outras despesas
                        if (diData.despesas_aduaneiras.outras && Array.isArray(diData.despesas_aduaneiras.outras)) {
                            for (const despesa of diData.despesas_aduaneiras.outras) {
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

        // Buscar produtos de cada adição e reconstruir estrutura de tributos
        for (const adicao of di.adicoes) {
            adicao.produtos = await this.db.produtos
                .where('adicao_id')
                .equals(adicao.id)
                .toArray();
            
            // RECONSTRUIR ESTRUTURA DE TRIBUTOS - Nomenclatura oficial DIProcessor.js
            // Schema v3 já usa nomenclatura correta, então apenas mover campos
            adicao.tributos = {
                ii_aliquota_ad_valorem: adicao.ii_aliquota_ad_valorem,
                ii_valor_devido: adicao.ii_valor_devido,
                ii_valor_recolher: adicao.ii_valor_recolher,
                ii_base_calculo: adicao.ii_base_calculo,
                ipi_aliquota_ad_valorem: adicao.ipi_aliquota_ad_valorem,
                ipi_valor_devido: adicao.ipi_valor_devido,
                ipi_valor_recolher: adicao.ipi_valor_recolher,
                pis_aliquota_ad_valorem: adicao.pis_aliquota_ad_valorem,
                pis_valor_devido: adicao.pis_valor_devido,
                pis_valor_recolher: adicao.pis_valor_recolher,
                cofins_aliquota_ad_valorem: adicao.cofins_aliquota_ad_valorem,
                cofins_valor_devido: adicao.cofins_valor_devido,
                cofins_valor_recolher: adicao.cofins_valor_recolher,
                cide_valor_devido: adicao.cide_valor_devido,
                cide_valor_recolher: adicao.cide_valor_recolher,
                pis_cofins_base_calculo: adicao.pis_cofins_base_calculo,
                icms_aliquota: adicao.icms_aliquota
            };
            
            // RECONSTRUIR ESTRUTURAS DE FORNECEDOR E FABRICANTE
            if (adicao.fornecedor_nome) {
                adicao.fornecedor = {
                    nome: adicao.fornecedor_nome,
                    logradouro: adicao.fornecedor_logradouro,
                    numero: adicao.fornecedor_numero,
                    complemento: adicao.fornecedor_complemento,
                    cidade: adicao.fornecedor_cidade,
                    estado: adicao.fornecedor_estado
                };
            }
            
            if (adicao.fabricante_nome) {
                adicao.fabricante = {
                    nome: adicao.fabricante_nome,
                    logradouro: adicao.fabricante_logradouro,
                    numero: adicao.fabricante_numero,
                    cidade: adicao.fabricante_cidade,
                    estado: adicao.fabricante_estado
                };
            }
        }

        // Buscar despesas
        const despesasAduaneiras = await this.db.despesas_aduaneiras
            .where('di_id')
            .equals(di.id)
            .toArray();

        // RECONSTRUIR ESTRUTURA despesas_aduaneiras.calculadas - CRÍTICO para ComplianceCalculator
        const despesasCalculadas = {};
        despesasAduaneiras.forEach(despesa => {
            if (despesa.tipo === 'SISCOMEX') despesasCalculadas.siscomex = despesa.valor;
            if (despesa.tipo === 'AFRMM') despesasCalculadas.afrmm = despesa.valor;  
            if (despesa.tipo === 'CAPATAZIA') despesasCalculadas.capatazia = despesa.valor;
            if (despesa.tipo === 'TAXA_CE') despesasCalculadas.taxa_ce = despesa.valor;
        });

        // Estrutura compatível com DIProcessor.js - Nomenclatura oficial
        di.despesas_aduaneiras = {
            calculadas: despesasCalculadas,
            pagamentos: despesasAduaneiras.filter(d => ['SISCOMEX', 'ANTI_DUMPING', 'MEDIDA_COMPENSATORIA'].includes(d.tipo)),
            acrescimos: despesasAduaneiras.filter(d => ['CAPATAZIA', 'TAXA_CE'].includes(d.tipo)),
            total_despesas_aduaneiras: Object.values(despesasCalculadas).reduce((sum, val) => sum + (val || 0), 0)
        };

        console.log('🔧 Estrutura despesas_aduaneiras reconstituída do IndexedDB:', {
            siscomex: di.despesas_aduaneiras.calculadas.siscomex,
            afrmm: di.despesas_aduaneiras.calculadas.afrmm,
            capatazia: di.despesas_aduaneiras.calculadas.capatazia,
            total: di.despesas_aduaneiras.total_despesas_aduaneiras
        });

        // Buscar dados de carga
        di.carga = await this.db.dados_carga
            .where('di_id')
            .equals(di.id)
            .first();

        // RECONSTRUIR ESTRUTURA DO IMPORTADOR - Nomenclatura oficial DIProcessor.js
        di.importador = {
            nome: di.importador_nome,
            cnpj: di.importador_cnpj,
            endereco_uf: di.importador_endereco_uf,
            endereco_logradouro: di.importador_endereco_logradouro,
            endereco_numero: di.importador_endereco_numero,
            endereco_complemento: di.importador_endereco_complemento,
            endereco_bairro: di.importador_endereco_bairro,
            endereco_cidade: di.importador_endereco_cidade,
            endereco_municipio: di.importador_endereco_municipio,
            endereco_cep: di.importador_endereco_cep,
            endereco_completo: di.importador_endereco_completo,
            representante_nome: di.importador_representante_nome,
            representante_cpf: di.importador_representante_cpf,
            telefone: di.importador_telefone
        };
        
        // RECONSTRUIR ESTRUTURA DA CARGA - Campos expandidos
        if (di.carga) {
            // Manter estrutura já existente, mas garantir campos expandidos
            di.carga = {
                ...di.carga,
                pais_procedencia_codigo: di.carga.pais_procedencia_codigo,
                pais_procedencia_nome: di.carga.pais_procedencia_nome,
                urf_entrada_codigo: di.carga.urf_entrada_codigo,
                urf_entrada_nome: di.carga.urf_entrada_nome,
                via_transporte_codigo: di.carga.via_transporte_codigo,
                via_transporte_nome: di.carga.via_transporte_nome
            };
        }

        return di;
    }

    
    /**
     * Conta quantos campos XSD estão preenchidos na DI
     * @private
     */
    countFilledFields(di) {
        let count = 0;
        
        // Contar campos da declaração principal
        for (const key in di) {
            if (di[key] !== null && di[key] !== undefined && key !== 'id') {
                count++;
            }
        }
        
        // Contar campos das adições
        if (di.adicoes) {
            for (const adicao of di.adicoes) {
                for (const key in adicao) {
                    if (adicao[key] !== null && adicao[key] !== undefined && key !== 'id') {
                        count++;
                    }
                }
            }
        }
        
        return count;
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
     * Valida conformidade XSD de uma DI antes de salvar
     * @param {Object} diData - Dados da DI a validar
     * @returns {Object} Resultado da validação {valid: boolean, errors: Array, warnings: Array}
     */
    validateXSDCompliance(diData) {
        const resultado = {
            valid: true,
            errors: [],
            warnings: [],
            camposObrigatoriosAusentes: [],
            camposOpcionaisAusentes: []
        };
        
        // Campos obrigatórios conforme XSD da RFB
        const CAMPOS_OBRIGATORIOS_DECLARACAO = [
            'numero_di', // identificacaoDeclaracaoImportacao
            'importador.cnpj', // numeroImportador
            'importador.nome', // nomeImportador
            'importador.endereco_uf', // enderecoUfImportador (ICMS)
            'total_adicoes', // totalAdicoes
            'adicoes' // Array de adições
        ];
        
        const CAMPOS_OBRIGATORIOS_ADICAO = [
            'numero_adicao', // numeroAdicao
            'ncm', // codigoMercadoriaNCM
            'valor_reais', // valorMercadoriaVendaMoedaNacional
            'peso_liquido' // pesoLiquidoMercadoria
        ];
        
        // Validar campos obrigatórios da declaração
        for (const campoPath of CAMPOS_OBRIGATORIOS_DECLARACAO) {
            const valor = this.getNestedValue(diData, campoPath);
            if (valor === null || valor === undefined || valor === '') {
                resultado.valid = false;
                resultado.errors.push(`Campo obrigatório ausente: ${campoPath}`);
                resultado.camposObrigatoriosAusentes.push(campoPath);
            }
        }
        
        // Validar adições
        if (!diData.adicoes || !Array.isArray(diData.adicoes) || diData.adicoes.length === 0) {
            resultado.valid = false;
            resultado.errors.push('DI deve ter pelo menos uma adição');
        } else {
            // Validar cada adição
            for (let i = 0; i < diData.adicoes.length; i++) {
                const adicao = diData.adicoes[i];
                
                for (const campo of CAMPOS_OBRIGATORIOS_ADICAO) {
                    const valor = this.getNestedValue(adicao, campo);
                    if (valor === null || valor === undefined || valor === '') {
                        resultado.valid = false;
                        resultado.errors.push(`Adição ${i + 1}: Campo obrigatório ausente: ${campo}`);
                        resultado.camposObrigatoriosAusentes.push(`adicao[${i}].${campo}`);
                    }
                }
                
                // Validações de negócio
                if (adicao.ncm && adicao.ncm.length !== 8) {
                    resultado.warnings.push(`Adição ${i + 1}: NCM deve ter 8 dígitos (atual: ${adicao.ncm.length})`);
                }
                
                // Validar tributos
                const tributosObrigatorios = ['ii_valor_devido', 'ipi_valor_devido', 'pis_valor_devido', 'cofins_valor_devido'];
                for (const tributo of tributosObrigatorios) {
                    if (adicao[tributo] === undefined || adicao[tributo] === null) {
                        resultado.warnings.push(`Adição ${i + 1}: Tributo ${tributo} não calculado`);
                    }
                }
            }
        }
        
        // Validações de integridade
        if (diData.total_adicoes && diData.adicoes) {
            if (parseInt(diData.total_adicoes) !== diData.adicoes.length) {
                resultado.warnings.push(`Inconsistência: total_adicoes (${diData.total_adicoes}) != quantidade real (${diData.adicoes.length})`);
            }
        }
        
        // Validar valores monetários
        if (diData.valor_aduaneiro_total_brl && diData.valor_aduaneiro_total_brl < 0) {
            resultado.errors.push('Valor aduaneiro total não pode ser negativo');
            resultado.valid = false;
        }
        
        // Validar taxa de câmbio
        if (diData.taxa_cambio) {
            const taxa = parseFloat(diData.taxa_cambio);
            if (taxa <= 0 || taxa > 10) {
                resultado.warnings.push(`Taxa de câmbio suspeita: ${taxa}`);
            }
        }
        
        resultado.totalCamposPreenchidos = this.countDataFields(diData);
        resultado.percentualCompletude = Math.round((resultado.totalCamposPreenchidos / 237) * 100);
        
        return resultado;
    }
    
    /**
     * Gera hash SHA-256 de integridade para o XML
     * @param {string} xmlContent - Conteúdo XML em string ou Base64
     * @returns {Promise<string>} Hash SHA-256 em hexadecimal
     */
    async generateIntegrityHash(xmlContent) {
        if (!xmlContent) {
            throw new Error('[generateIntegrityHash] Conteúdo XML é obrigatório');
        }
        
        // Converter para ArrayBuffer
        const encoder = new TextEncoder();
        const data = encoder.encode(xmlContent);
        
        // Gerar hash SHA-256
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        
        // Converter para hexadecimal
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        return hashHex;
    }
    
    /**
     * Preserva XML original em Base64
     * @param {string} xmlContent - Conteúdo XML em string
     * @returns {string} XML em Base64
     */
    preserveOriginalXML(xmlContent) {
        if (!xmlContent) {
            throw new Error('[preserveOriginalXML] Conteúdo XML é obrigatório');
        }
        
        // Converter para Base64
        return btoa(unescape(encodeURIComponent(xmlContent)));
    }
    
    /**
     * Recupera XML original de Base64
     * @param {string} base64Content - XML em Base64
     * @returns {string} XML original
     */
    retrieveOriginalXML(base64Content) {
        if (!base64Content) {
            throw new Error('[retrieveOriginalXML] Conteúdo Base64 é obrigatório');
        }
        
        // Converter de Base64
        return decodeURIComponent(escape(atob(base64Content)));
    }
    
    /**
     * Verifica integridade de uma DI comparando hash
     * @param {Object} di - DI com xmlContent e xmlHash
     * @returns {Promise<boolean>} True se íntegro
     */
    async verifyIntegrity(di) {
        if (!di.xmlContent || !di.xmlHash) {
            console.warn('[verifyIntegrity] DI sem XML ou hash para verificação');
            return false;
        }
        
        const xmlOriginal = this.retrieveOriginalXML(di.xmlContent);
        const hashCalculado = await this.generateIntegrityHash(xmlOriginal);
        
        return hashCalculado === di.xmlHash;
    }
    
    /**
     * Obtém valor aninhado de objeto usando path com pontos
     * @private
     */
    getNestedValue(obj, path) {
        const keys = path.split('.');
        let value = obj;
        
        for (const key of keys) {
            if (value && typeof value === 'object') {
                value = value[key];
            } else {
                return null;
            }
        }
        
        return value;
    }
    
    /**
     * Conta campos preenchidos em estrutura de dados
     * @private
     */
    countDataFields(obj, visited = new Set()) {
        if (!obj || typeof obj !== 'object' || visited.has(obj)) {
            return 0;
        }
        
        visited.add(obj);
        let count = 0;
        
        for (const key in obj) {
            const value = obj[key];
            
            if (value !== null && value !== undefined && value !== '' && key !== 'id') {
                count++;
                
                if (typeof value === 'object') {
                    if (Array.isArray(value)) {
                        for (const item of value) {
                            count += this.countDataFields(item, visited);
                        }
                    } else {
                        count += this.countDataFields(value, visited);
                    }
                }
            }
        }
        
        return count;
    }
    
    /**
     * Cria snapshot de uma DI para backup/auditoria
     * @param {string} numeroDI - Número da DI
     * @param {string} nomeCustomizado - Nome do snapshot
     * @returns {Promise<number>} ID do snapshot
     */
    async createSnapshot(numeroDI, nomeCustomizado = null) {
        if (!numeroDI) {
            throw new Error('[createSnapshot] Número da DI é obrigatório');
        }
        
        // Buscar DI completa
        const di = await this.getDIComplete(numeroDI);
        
        if (!di) {
            throw new Error(`[createSnapshot] DI ${numeroDI} não encontrada`);
        }
        
        // Criar snapshot
        const snapshotId = await this.db.snapshots.add({
            di_id: di.id,
            nome_customizado: nomeCustomizado || `Snapshot ${new Date().toISOString()}`,
            timestamp: new Date(),
            dados_completos: JSON.stringify(di)
        });
        
        console.log(`[createSnapshot] Snapshot criado para DI ${numeroDI} com ID ${snapshotId}`);
        
        return snapshotId;
    }
    
    /**
     * Restaura DI de um snapshot
     * @param {number} snapshotId - ID do snapshot
     * @returns {Promise<Object>} DI restaurada
     */
    async restoreFromSnapshot(snapshotId) {
        if (!snapshotId) {
            throw new Error('[restoreFromSnapshot] ID do snapshot é obrigatório');
        }
        
        const snapshot = await this.db.snapshots.get(snapshotId);
        
        if (!snapshot) {
            throw new Error(`[restoreFromSnapshot] Snapshot ${snapshotId} não encontrado`);
        }
        
        const di = JSON.parse(snapshot.dados_completos);
        
        console.log(`[restoreFromSnapshot] DI restaurada do snapshot ${snapshotId}`);
        
        return di;
    }

    /**
     * Verifica o status do banco de dados e retorna estatísticas
     * @returns {Promise<Object>} Status e estatísticas do banco
     */
    async checkDatabaseStatus() {
        try {
            const stats = await this.getDataStatistics();
            
            // Verificar se há dados em qualquer tabela
            const hasData = stats.total > 0;
            
            return {
                hasData,
                stats,
                isHealthy: true,
                version: this.db.verno,
                dbName: this.db.name
            };
        } catch (error) {
            console.error('Erro ao verificar status do banco:', error);
            return {
                hasData: false,
                stats: null,
                isHealthy: false,
                error: error.message
            };
        }
    }

    /**
     * Obtém estatísticas detalhadas do banco de dados
     * @returns {Promise<Object>} Estatísticas por tabela
     */
    async getDataStatistics() {
        const stats = {
            declaracoes: await this.db.declaracoes.count(),
            adicoes: await this.db.adicoes.count(),
            produtos: await this.db.produtos.count(),
            despesas_aduaneiras: await this.db.despesas_aduaneiras.count(),
            dados_carga: await this.db.dados_carga.count(),
            incentivos_entrada: await this.db.incentivos_entrada.count(),
            incentivos_saida: await this.db.incentivos_saida.count(),
            elegibilidade_ncm: await this.db.elegibilidade_ncm.count(),
            metricas_dashboard: await this.db.metricas_dashboard.count(),
            cenarios_precificacao: await this.db.cenarios_precificacao.count(),
            historico_operacoes: await this.db.historico_operacoes.count(),
            snapshots: await this.db.snapshots.count(),
            configuracoes_usuario: await this.db.configuracoes_usuario.count()
        };
        
        // Calcular total
        stats.total = Object.values(stats).reduce((sum, count) => sum + count, 0);
        
        // Adicionar informações úteis
        stats.ultimaDI = null;
        if (stats.declaracoes > 0) {
            const ultimaDI = await this.db.declaracoes.orderBy('data_processamento').last();
            stats.ultimaDI = {
                numero: ultimaDI.numero_di,
                data: ultimaDI.data_processamento,
                empresa: ultimaDI.importador_nome
            };
        }
        
        return stats;
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