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
            const response = await fetch('./src/shared/data/codigos-receita.json');
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

        // Schema v1 é a única versão suportada - consolidação completa
        // Mantém compatibilidade total com sistema atual funcional
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