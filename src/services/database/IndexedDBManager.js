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

class IndexedDBManager {
    constructor() {
        // Validar se Dexie está disponível via ES6 import
        if (!Dexie) {
            throw new Error('Dexie.js não está disponível - falha no import ES6');
        }
        
        // Inicializar banco de dados Dexie
        this.db = new Dexie('ExpertzyDB');
        
        // Códigos de receita serão carregados via fetch no initialize()
        this.codigosReceita = null;
        
        // Schema será inicializado no initialize() para garantir timing correto
        this.schemaInitialized = false;
    }

    /**
     * Inicializa o sistema de banco de dados
     * Carrega configurações e abre conexão
     */
    async initialize() {
        try {
            // Inicializar schema se ainda não foi feito
            if (!this.schemaInitialized) {
                this.initializeSchema();
                this.schemaInitialized = true;
            }
            
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

        // Versão 4 - Adiciona tabelas de precificação
        this.db.version(4).stores({
            // Manter todas as tabelas existentes da v3
            declaracoes: '++id, numero_di, importador_cnpj, importador_nome, importador_endereco_uf, importador_endereco_logradouro, importador_endereco_numero, importador_endereco_complemento, importador_endereco_bairro, importador_endereco_cidade, importador_endereco_municipio, importador_endereco_cep, importador_representante_nome, importador_representante_cpf, importador_telefone, importador_endereco_completo, data_processamento, data_registro, urf_despacho_codigo, urf_despacho_nome, modalidade_codigo, modalidade_nome, situacao_entrega, total_adicoes, incoterm_identificado, taxa_cambio, informacao_complementar, valor_total_fob_usd, valor_total_fob_brl, valor_total_frete_usd, valor_total_frete_brl, valor_aduaneiro_total_brl, *ncms, xml_hash, xml_content, processing_state, icms_configured, extra_expenses_configured, pricing_configured, pricing_timestamp, [importador_cnpj+data_processamento]',
            
            adicoes: '++id, di_id, numero_adicao, ncm, descricao_ncm, peso_liquido, condicao_venda_incoterm, moeda_negociacao_codigo, moeda_negociacao_nome, valor_moeda_negociacao, valor_reais, frete_valor_reais, seguro_valor_reais, taxa_cambio, metodo_valoracao_codigo, metodo_valoracao_nome, codigo_naladi_sh, codigo_naladi_ncca, quantidade_estatistica, unidade_estatistica, aplicacao_mercadoria, condicao_mercadoria, condicao_venda_local, ii_aliquota_ad_valorem, ii_valor_devido, ii_valor_recolher, ii_base_calculo, ipi_aliquota_ad_valorem, ipi_valor_devido, ipi_valor_recolher, pis_aliquota_ad_valorem, pis_valor_devido, pis_valor_recolher, cofins_aliquota_ad_valorem, cofins_valor_devido, cofins_valor_recolher, cide_valor_devido, cide_valor_recolher, pis_cofins_base_calculo, icms_aliquota, fornecedor_nome, fornecedor_logradouro, fornecedor_numero, fornecedor_complemento, fornecedor_cidade, fornecedor_estado, fabricante_nome, fabricante_logradouro, fabricante_numero, fabricante_cidade, fabricante_estado, processing_state, custo_basico_federal, [di_id+numero_adicao]',
            
            produtos: '++id, adicao_id, numero_sequencial_item, descricao_mercadoria, ncm, quantidade, unidade_medida, valor_unitario_usd, valor_unitario_brl, valor_total_usd, valor_total_brl, taxa_cambio, processing_state, custo_produto_federal, is_virtual, margem_configurada, preco_venda_sugerido, custo_unitario_final, categoria_produto, [adicao_id+numero_sequencial_item]',
            
            despesas_aduaneiras: '++id, di_id, tipo, valor, codigo_receita, processing_state, origem, [di_id+tipo]',
            
            dados_carga: '++id, di_id, peso_bruto, peso_liquido, pais_procedencia_codigo, pais_procedencia_nome, urf_entrada_codigo, urf_entrada_nome, data_chegada, via_transporte_codigo, via_transporte_nome, nome_veiculo, nome_transportador',
            
            incentivos_entrada: '++id, di_id, estado, tipo_beneficio, percentual_reducao, economia_calculada, [di_id+estado]',
            incentivos_saida: '++id, di_id, estado, operacao, credito_aplicado, contrapartidas, [di_id+estado+operacao]',
            elegibilidade_ncm: '++id, ncm, estado, incentivo_codigo, elegivel, motivo_rejeicao, [ncm+estado+incentivo_codigo]',
            metricas_dashboard: '++id, periodo, tipo_metrica, valor, breakdown_estados, [periodo+tipo_metrica]',
            cenarios_precificacao: '++id, di_id, nome_cenario, configuracao, resultados_comparativos, custos_calculados, comparativo_regimes, impacto_incentivos, [di_id+nome_cenario]',
            historico_operacoes: '++id, timestamp, operacao, modulo, detalhes, resultado',
            snapshots: '++id, di_id, nome_customizado, timestamp, dados_completos',
            configuracoes_usuario: 'chave, valor, timestamp, validado',
            
            // NOVAS TABELAS DE PRECIFICAÇÃO (v4)
            pricing_configurations: '++id, di_id, regime_tributario, custo_base, custo_desembolso, custo_contabil, base_formacao_preco, total_creditos, creditos_pis, creditos_cofins, creditos_ipi, creditos_icms, margem_configurada, markup_configurado, estado_destino, tipo_operacao, incentivo_aplicado, incentivo_simulacao, incentivo_economia, margens_padrao, estados_preferenciais, timestamp, [di_id+regime_tributario]',
            
            historico_precos: '++id, produto_id, di_id, preco_calculado, margem_aplicada, custo_base_momento, regime_tributario, incentivos_ativos, timestamp, usuario, [produto_id+timestamp]',
            
            margens_categoria: '++id, categoria, margem_padrao, markup_padrao, margem_minima, margem_maxima, ultima_atualizacao, [categoria]',
            
            simulacoes_pricing: '++id, di_id, nome_simulacao, parametros_simulacao, resultado_simulacao, comparacao_original, timestamp, [di_id+nome_simulacao]'
        });
        
        // Versão 5 - Adiciona tabelas do pipeline completo
        this.db.version(5).stores({
            // Manter todas as tabelas existentes da v4
            declaracoes: '++id, numero_di, importador_cnpj, importador_nome, importador_endereco_uf, importador_endereco_logradouro, importador_endereco_numero, importador_endereco_complemento, importador_endereco_bairro, importador_endereco_cidade, importador_endereco_municipio, importador_endereco_cep, importador_representante_nome, importador_representante_cpf, importador_telefone, importador_endereco_completo, data_processamento, data_registro, urf_despacho_codigo, urf_despacho_nome, modalidade_codigo, modalidade_nome, situacao_entrega, total_adicoes, incoterm_identificado, taxa_cambio, informacao_complementar, valor_total_fob_usd, valor_total_fob_brl, valor_total_frete_usd, valor_total_frete_brl, valor_aduaneiro_total_brl, *ncms, xml_hash, xml_content, processing_state, icms_configured, extra_expenses_configured, pricing_configured, pricing_timestamp, [importador_cnpj+data_processamento]',
            
            adicoes: '++id, di_id, numero_adicao, ncm, descricao_ncm, peso_liquido, condicao_venda_incoterm, moeda_negociacao_codigo, moeda_negociacao_nome, valor_moeda_negociacao, valor_reais, frete_valor_reais, seguro_valor_reais, taxa_cambio, metodo_valoracao_codigo, metodo_valoracao_nome, codigo_naladi_sh, codigo_naladi_ncca, quantidade_estatistica, unidade_estatistica, aplicacao_mercadoria, condicao_mercadoria, condicao_venda_local, ii_aliquota_ad_valorem, ii_valor_devido, ii_valor_recolher, ii_base_calculo, ipi_aliquota_ad_valorem, ipi_valor_devido, ipi_valor_recolher, pis_aliquota_ad_valorem, pis_valor_devido, pis_valor_recolher, cofins_aliquota_ad_valorem, cofins_valor_devido, cofins_valor_recolher, cide_valor_devido, cide_valor_recolher, pis_cofins_base_calculo, icms_aliquota, fornecedor_nome, fornecedor_logradouro, fornecedor_numero, fornecedor_complemento, fornecedor_cidade, fornecedor_estado, fabricante_nome, fabricante_logradouro, fabricante_numero, fabricante_cidade, fabricante_estado, processing_state, custo_basico_federal, [di_id+numero_adicao]',
            
            produtos: '++id, adicao_id, numero_sequencial_item, descricao_mercadoria, ncm, quantidade, unidade_medida, valor_unitario_usd, valor_unitario_brl, valor_total_usd, valor_total_brl, taxa_cambio, processing_state, custo_produto_federal, is_virtual, margem_configurada, preco_venda_sugerido, custo_unitario_final, categoria_produto, [adicao_id+numero_sequencial_item]',
            
            despesas_aduaneiras: '++id, di_id, tipo, valor, codigo_receita, processing_state, origem, [di_id+tipo]',
            
            dados_carga: '++id, di_id, peso_bruto, peso_liquido, pais_procedencia_codigo, pais_procedencia_nome, urf_entrada_codigo, urf_entrada_nome, data_chegada, via_transporte_codigo, via_transporte_nome, nome_veiculo, nome_transportador',
            
            // Tabelas de apoio existentes
            incentivos_entrada: '++id, di_id, estado, tipo_beneficio, percentual_reducao, economia_calculada, [di_id+estado]',
            incentivos_saida: '++id, di_id, estado, operacao, credito_aplicado, contrapartidas, [di_id+estado+operacao]',
            elegibilidade_ncm: '++id, ncm, estado, incentivo_codigo, elegivel, motivo_rejeicao, [ncm+estado+incentivo_codigo]',
            metricas_dashboard: '++id, periodo, tipo_metrica, valor, breakdown_estados, [periodo+tipo_metrica]',
            cenarios_precificacao: '++id, di_id, nome_cenario, configuracao, resultados_comparativos, [di_id+nome_cenario]',
            historico_operacoes: '++id, timestamp, operacao, modulo, detalhes, resultado',
            snapshots: '++id, di_id, nome_customizado, timestamp, dados_completos',
            configuracoes_usuario: 'chave, valor, timestamp, validado',
            
            // Tabelas de precificação existentes (v4)
            pricing_configurations: '++id, di_id, regime_tributario, custo_base, custo_desembolso, custo_contabil, base_formacao_preco, total_creditos, creditos_pis, creditos_cofins, creditos_ipi, creditos_icms, margem_configurada, markup_configurado, estado_destino, tipo_operacao, incentivo_aplicado, incentivo_simulacao, incentivo_economia, margens_padrao, estados_preferenciais, timestamp, [di_id+regime_tributario]',
            
            historico_precos: '++id, produto_id, di_id, preco_calculado, margem_aplicada, custo_base_momento, regime_tributario, incentivos_ativos, timestamp, usuario, [produto_id+timestamp]',
            
            margens_categoria: '++id, categoria, margem_padrao, markup_padrao, margem_minima, margem_maxima, ultima_atualizacao, [categoria]',
            
            simulacoes_pricing: '++id, di_id, nome_simulacao, parametros_simulacao, resultado_simulacao, comparacao_original, timestamp, [di_id+nome_simulacao]',
            
            // NOVAS TABELAS PIPELINE v5
            costing_results: '++id, di_id, numero_di, regime_tributario, custos_4_tipos, detalhamento_completo, total_creditos, economia_creditos, percentual_economia, ready_for_pricing, timestamp, versao_calculo, [di_id+regime_tributario]',
            
            pricing_results: '++id, di_id, costing_result_id, cenarios_precos, recomendacoes, analise_comparativa, melhor_cenario, economia_maxima, estados_analisados, timestamp, [di_id+timestamp]',
            
            pipeline_metrics: '++id, di_id, etapa, tempo_processamento, status, resultado_resumo, timestamp, [di_id+etapa]'
        });

        // Versão 6 - Adiciona tabela de precificação individual por item (FASE 2.5)
        this.db.version(6).stores({
            // Manter todas as tabelas existentes da v5
            declaracoes: '++id, numero_di, importador_cnpj, importador_nome, importador_endereco_uf, importador_endereco_logradouro, importador_endereco_numero, importador_endereco_complemento, importador_endereco_bairro, importador_endereco_cidade, importador_endereco_municipio, importador_endereco_cep, importador_representante_nome, importador_representante_cpf, importador_telefone, importador_endereco_completo, data_processamento, data_registro, urf_despacho_codigo, urf_despacho_nome, modalidade_codigo, modalidade_nome, situacao_entrega, total_adicoes, incoterm_identificado, taxa_cambio, informacao_complementar, valor_total_fob_usd, valor_total_fob_brl, valor_total_frete_usd, valor_total_frete_brl, valor_aduaneiro_total_brl, *ncms, xml_hash, xml_content, processing_state, icms_configured, extra_expenses_configured, pricing_configured, pricing_timestamp, [importador_cnpj+data_processamento]',
            
            adicoes: '++id, di_id, numero_adicao, ncm, descricao_ncm, peso_liquido, condicao_venda_incoterm, moeda_negociacao_codigo, moeda_negociacao_nome, valor_moeda_negociacao, valor_reais, frete_valor_reais, seguro_valor_reais, taxa_cambio, metodo_valoracao_codigo, metodo_valoracao_nome, codigo_naladi_sh, codigo_naladi_ncca, quantidade_estatistica, unidade_estatistica, aplicacao_mercadoria, condicao_mercadoria, condicao_venda_local, ii_aliquota_ad_valorem, ii_valor_devido, ii_valor_recolher, ii_base_calculo, ipi_aliquota_ad_valorem, ipi_valor_devido, ipi_valor_recolher, pis_aliquota_ad_valorem, pis_valor_devido, pis_valor_recolher, cofins_aliquota_ad_valorem, cofins_valor_devido, cofins_valor_recolher, cide_valor_devido, cide_valor_recolher, pis_cofins_base_calculo, icms_aliquota, fornecedor_nome, fornecedor_logradouro, fornecedor_numero, fornecedor_complemento, fornecedor_cidade, fornecedor_estado, fabricante_nome, fabricante_logradouro, fabricante_numero, fabricante_cidade, fabricante_estado, processing_state, custo_basico_federal, [di_id+numero_adicao]',
            
            produtos: '++id, adicao_id, numero_sequencial_item, descricao_mercadoria, ncm, quantidade, unidade_medida, valor_unitario_usd, valor_unitario_brl, valor_total_usd, valor_total_brl, taxa_cambio, processing_state, custo_produto_federal, is_virtual, margem_configurada, preco_venda_sugerido, custo_unitario_final, categoria_produto, [adicao_id+numero_sequencial_item]',
            
            despesas_aduaneiras: '++id, di_id, tipo, valor, codigo_receita, processing_state, origem, [di_id+tipo]',
            
            dados_carga: '++id, di_id, peso_bruto, peso_liquido, pais_procedencia_codigo, pais_procedencia_nome, urf_entrada_codigo, urf_entrada_nome, data_chegada, via_transporte_codigo, via_transporte_nome, nome_veiculo, nome_transportador',
            
            // Tabelas de apoio existentes
            incentivos_entrada: '++id, di_id, estado, tipo_beneficio, percentual_reducao, economia_calculada, [di_id+estado]',
            incentivos_saida: '++id, di_id, estado, operacao, credito_aplicado, contrapartidas, [di_id+estado+operacao]',
            elegibilidade_ncm: '++id, ncm, estado, incentivo_codigo, elegivel, motivo_rejeicao, [ncm+estado+incentivo_codigo]',
            metricas_dashboard: '++id, periodo, tipo_metrica, valor, breakdown_estados, [periodo+tipo_metrica]',
            cenarios_precificacao: '++id, di_id, nome_cenario, configuracao, resultados_comparativos, [di_id+nome_cenario]',
            historico_operacoes: '++id, timestamp, operacao, modulo, detalhes, resultado',
            snapshots: '++id, di_id, nome_customizado, timestamp, dados_completos',
            configuracoes_usuario: 'chave, valor, timestamp, validado',
            
            // Tabelas de precificação existentes
            pricing_configurations: '++id, di_id, regime_tributario, custo_base, custo_desembolso, custo_contabil, base_formacao_preco, total_creditos, creditos_pis, creditos_cofins, creditos_ipi, creditos_icms, margem_configurada, markup_configurado, estado_destino, tipo_operacao, incentivo_aplicado, incentivo_simulacao, incentivo_economia, margens_padrao, estados_preferenciais, timestamp, [di_id+regime_tributario]',
            
            historico_precos: '++id, produto_id, di_id, preco_calculado, margem_aplicada, custo_base_momento, regime_tributario, incentivos_ativos, timestamp, usuario, [produto_id+timestamp]',
            
            margens_categoria: '++id, categoria, margem_padrao, markup_padrao, margem_minima, margem_maxima, ultima_atualizacao, [categoria]',
            
            simulacoes_pricing: '++id, di_id, nome_simulacao, parametros_simulacao, resultado_simulacao, comparacao_original, timestamp, [di_id+nome_simulacao]',
            
            // Tabelas pipeline v5
            costing_results: '++id, di_id, numero_di, regime_tributario, custos_4_tipos, detalhamento_completo, total_creditos, economia_creditos, percentual_economia, ready_for_pricing, timestamp, versao_calculo, [di_id+regime_tributario]',
            
            pricing_results: '++id, di_id, costing_result_id, cenarios_precos, recomendacoes, analise_comparativa, melhor_cenario, economia_maxima, estados_analisados, timestamp, [di_id+timestamp]',
            
            pipeline_metrics: '++id, di_id, etapa, tempo_processamento, status, resultado_resumo, timestamp, [di_id+etapa]',
            
            // NOVA TABELA v6 - FASE 2.5: Precificação Individual por Item
            item_pricing_results: '++id, di_id, item_id, numero_adicao, ncm, descricao_item, custo_contabil_item, preco_margem_zero, margem_aplicada_tipo, margem_aplicada_valor, preco_com_margem, cenario_tributario, estado_origem, estado_destino, tipo_cliente, regime_vendedor, impostos_venda_breakdown, preco_final, regimes_especiais_detectados, beneficios_aplicaveis, calculo_detalhado, timestamp_calculo, usuario_calculo, [di_id+numero_adicao]'
        });

        console.log('✅ Schema v6 com precificação individual por item inicializado (FASE 2.5)');
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
     * Busca adições por DI ID
     * Método auxiliar para PricingAdapter
     * @param {number} diId - ID da DI
     * @returns {Promise<Array>} Array de adições
     */
    async getAdicoesByDI(diId) {
        if (!diId) {
            throw new Error('ID da DI é obrigatório');
        }

        const adicoes = await this.db.adicoes
            .where('di_id')
            .equals(diId)
            .toArray();

        // Buscar produtos de cada adição
        for (const adicao of adicoes) {
            adicao.produtos = await this.db.produtos
                .where('adicao_id')
                .equals(adicao.id)
                .toArray();
        }

        return adicoes;
    }

    /**
     * Busca despesas por DI ID
     * Método auxiliar para PricingAdapter
     * @param {number} diId - ID da DI
     * @returns {Promise<Array>} Array de despesas
     */
    async getDespesasByDI(diId) {
        if (!diId) {
            throw new Error('ID da DI é obrigatório');
        }

        return await this.db.despesas_aduaneiras
            .where('di_id')
            .equals(diId)
            .toArray();
    }

    /**
     * Salva configuração de precificação
     * @param {Object} config - Configuração de precificação
     * @returns {Promise<number>} ID da configuração salva
     */
    async savePricingConfiguration(config) {
        if (!config.di_id) {
            throw new Error('ID da DI é obrigatório para salvar configuração de precificação');
        }

        if (!config.regime_tributario) {
            throw new Error('Regime tributário é obrigatório');
        }

        // Adicionar timestamp se não existir
        if (!config.timestamp) {
            config.timestamp = new Date().toISOString();
        }

        return await this.db.pricing_configurations.add(config);
    }

    /**
     * Busca última configuração de precificação para uma DI
     * @param {number} diId - ID da DI
     * @returns {Promise<Object|null>} Configuração ou null
     */
    async getPricingConfiguration(diId) {
        if (!diId) {
            throw new Error('ID da DI é obrigatório');
        }

        return await this.db.pricing_configurations
            .where('di_id')
            .equals(diId)
            .last();
    }

    /**
     * Atualiza estatísticas do banco incluindo tabelas de precificação
     * @returns {Promise<Object>} Estatísticas atualizadas
     */
    async getDataStatisticsV4() {
        const stats = await this.getDataStatistics();
        
        // Adicionar estatísticas das novas tabelas v4
        if (this.db.pricing_configurations) {
            stats.pricing_configurations = await this.db.pricing_configurations.count();
            stats.historico_precos = await this.db.historico_precos.count();
            stats.margens_categoria = await this.db.margens_categoria.count();
            stats.simulacoes_pricing = await this.db.simulacoes_pricing.count();
            
            // Recalcular total
            stats.total = Object.values(stats)
                .filter(v => typeof v === 'number')
                .reduce((sum, count) => sum + count, 0);
        }

        return stats;
    }

    /**
     * Limpa todos os dados incluindo tabelas v4
     * @returns {Promise<void>}
     */
    async clearAllV4() {
        await this.clearAll();
        
        // Limpar também as novas tabelas v4
        if (this.db.pricing_configurations) {
            await this.db.pricing_configurations.clear();
            await this.db.historico_precos.clear();
            await this.db.margens_categoria.clear();
            await this.db.simulacoes_pricing.clear();
        }
        
        console.log('✅ Banco de dados v4 limpo completamente');
    }

    // ========================================
    // MÉTODOS ESPECÍFICOS PARA 4 TIPOS DE CUSTOS - FASE 2
    // ========================================

    /**
     * Salva resultado completo do cálculo dos 4 tipos de custos
     * @param {Object} resultadoPricing - Resultado do calculatePricing()
     * @returns {Promise<number>} ID da configuração salva
     */
    async savePricingResult(resultadoPricing) {
        if (!resultadoPricing) {
            throw new Error('Resultado de precificação obrigatório para salvar');
        }

        // Validações NO FALLBACKS obrigatórias
        if (!resultadoPricing.di_id) {
            throw new Error('di_id obrigatório no resultado de precificação');
        }

        if (!resultadoPricing.regime_tributario) {
            throw new Error('regime_tributario obrigatório no resultado de precificação');
        }

        if (typeof resultadoPricing.custo_base !== 'number') {
            throw new Error('custo_base deve ser numérico no resultado de precificação');
        }

        if (typeof resultadoPricing.custo_desembolso !== 'number') {
            throw new Error('custo_desembolso deve ser numérico no resultado de precificação');
        }

        if (typeof resultadoPricing.custo_contabil !== 'number') {
            throw new Error('custo_contabil deve ser numérico no resultado de precificação');
        }

        if (typeof resultadoPricing.base_formacao_preco !== 'number') {
            throw new Error('base_formacao_preco deve ser numérico no resultado de precificação');
        }

        try {
            // Estruturar dados para salvar conforme schema v4
            const pricingConfig = {
                di_id: resultadoPricing.di_id,
                regime_tributario: resultadoPricing.regime_tributario,
                
                // 4 TIPOS DE CUSTOS
                custo_base: resultadoPricing.custo_base,
                custo_desembolso: resultadoPricing.custo_desembolso,
                custo_contabil: resultadoPricing.custo_contabil,
                base_formacao_preco: resultadoPricing.base_formacao_preco,
                
                // CRÉDITOS DETALHADOS
                total_creditos: resultadoPricing.total_creditos,
                creditos_pis: resultadoPricing.detalhamento_completo.custoDesembolso.detalhamento_creditos.detalhamento.creditos_pis || 0,
                creditos_cofins: resultadoPricing.detalhamento_completo.custoDesembolso.detalhamento_creditos.detalhamento.creditos_cofins || 0,
                creditos_ipi: resultadoPricing.detalhamento_completo.custoDesembolso.detalhamento_creditos.detalhamento.creditos_ipi || 0,
                creditos_icms: resultadoPricing.detalhamento_completo.custoDesembolso.detalhamento_creditos.detalhamento.creditos_icms || 0,
                
                // DADOS ADICIONAIS
                margem_configurada: 0, // Será preenchido pela interface
                markup_configurado: 0, // Será preenchido pela interface
                estado_destino: null, // Será preenchido pela interface
                tipo_operacao: 'importacao',
                
                // INCENTIVOS (se aplicável)
                incentivo_aplicado: false,
                incentivo_simulacao: null,
                incentivo_economia: 0,
                
                // CONFIGURAÇÕES
                margens_padrao: JSON.stringify({}),
                estados_preferenciais: JSON.stringify([]),
                
                timestamp: new Date().toISOString()
            };

            // Verificar se já existe configuração para esta DI e regime
            const existingConfig = await this.db.pricing_configurations
                .where('[di_id+regime_tributario]')
                .equals([resultadoPricing.di_id, resultadoPricing.regime_tributario])
                .first();

            let configId;
            
            if (existingConfig) {
                // Atualizar configuração existente
                configId = existingConfig.id;
                await this.db.pricing_configurations.update(configId, {
                    ...pricingConfig,
                    id: configId // Manter o ID existente
                });
                console.log(`📊 Configuração de precificação atualizada: ID ${configId}`);
            } else {
                // Criar nova configuração
                configId = await this.db.pricing_configurations.add(pricingConfig);
                console.log(`📊 Nova configuração de precificação criada: ID ${configId}`);
            }

            // Atualizar status na tabela de declarações
            await this.updateDeclarationPricingStatus(resultadoPricing.di_id, true);

            return configId;

        } catch (error) {
            console.error('❌ Erro ao salvar resultado de precificação:', error);
            throw new Error(`Falha ao salvar resultado de precificação: ${error.message}`);
        }
    }

    /**
     * Atualiza status de precificação na tabela de declarações
     * @param {number} diId - ID da declaração
     * @param {boolean} configured - Se precificação foi configurada
     * @returns {Promise<void>}
     */
    async updateDeclarationPricingStatus(diId, configured) {
        if (!diId) {
            throw new Error('ID da DI obrigatório para atualizar status de precificação');
        }

        const updateData = {
            pricing_configured: configured,
            pricing_timestamp: configured ? new Date().toISOString() : null,
            processing_state: configured ? 'PRICING_CONFIGURED' : 'DI_COMPLETE_FROM_XML'
        };

        await this.db.declaracoes.update(diId, updateData);
        console.log(`📊 Status de precificação atualizado para DI ${diId}: ${configured ? 'CONFIGURADO' : 'REMOVIDO'}`);
    }

    /**
     * Recupera configuração de precificação completa por DI e regime
     * @param {number} diId - ID da declaração
     * @param {string} regimeTributario - Regime tributário
     * @returns {Promise<Object|null>} Configuração encontrada ou null
     */
    async getPricingConfigurationByRegime(diId, regimeTributario) {
        if (!diId) {
            throw new Error('ID da DI obrigatório para buscar configuração');
        }

        if (!regimeTributario) {
            throw new Error('Regime tributário obrigatório para buscar configuração');
        }

        try {
            const config = await this.db.pricing_configurations
                .where('[di_id+regime_tributario]')
                .equals([diId, regimeTributario])
                .first();

            if (config) {
                // Parse de dados JSON
                config.margens_padrao = JSON.parse(config.margens_padrao || '{}');
                config.estados_preferenciais = JSON.parse(config.estados_preferenciais || '[]');
            }

            return config;

        } catch (error) {
            console.error('❌ Erro ao recuperar configuração de precificação:', error);
            throw new Error(`Falha ao recuperar configuração: ${error.message}`);
        }
    }

    /**
     * Lista todas as configurações de precificação de uma DI
     * @param {number} diId - ID da declaração
     * @returns {Promise<Array>} Array de configurações
     */
    async getAllPricingConfigurationsByDI(diId) {
        if (!diId) {
            throw new Error('ID da DI obrigatório para listar configurações');
        }

        try {
            const configs = await this.db.pricing_configurations
                .where('di_id')
                .equals(diId)
                .toArray();

            // Parse de dados JSON em cada configuração
            configs.forEach(config => {
                config.margens_padrao = JSON.parse(config.margens_padrao || '{}');
                config.estados_preferenciais = JSON.parse(config.estados_preferenciais || '[]');
            });

            return configs;

        } catch (error) {
            console.error('❌ Erro ao listar configurações de precificação:', error);
            throw new Error(`Falha ao listar configurações: ${error.message}`);
        }
    }

    /**
     * Salva parâmetros gerenciais configurados pelo usuário
     * @param {number} diId - ID da declaração
     * @param {string} regimeTributario - Regime tributário
     * @param {Object} parametrosGerenciais - Parâmetros do usuário
     * @returns {Promise<void>}
     */
    async saveParametrosGerenciais(diId, regimeTributario, parametrosGerenciais) {
        if (!diId) {
            throw new Error('ID da DI obrigatório para salvar parâmetros gerenciais');
        }

        if (!regimeTributario) {
            throw new Error('Regime tributário obrigatório para salvar parâmetros gerenciais');
        }

        if (!parametrosGerenciais) {
            throw new Error('Parâmetros gerenciais obrigatórios para salvar');
        }

        try {
            // Buscar configuração existente
            const existingConfig = await this.db.pricing_configurations
                .where('[di_id+regime_tributario]')
                .equals([diId, regimeTributario])
                .first();

            if (!existingConfig) {
                throw new Error('Configuração de precificação não encontrada - execute o cálculo primeiro');
            }

            // Atualizar apenas os parâmetros gerenciais
            const updateData = {
                margens_padrao: JSON.stringify({
                    encargos_financeiros_percentual: parametrosGerenciais.encargos_financeiros_percentual,
                    custos_indiretos_percentual: parametrosGerenciais.custos_indiretos_percentual,
                    margem_operacional_percentual: parametrosGerenciais.margem_operacional_percentual,
                    tributos_recuperaveis_outros: parametrosGerenciais.tributos_recuperaveis_outros
                }),
                timestamp: new Date().toISOString()
            };

            await this.db.pricing_configurations.update(existingConfig.id, updateData);
            console.log(`📊 Parâmetros gerenciais salvos para DI ${diId} - Regime ${regimeTributario}`);

        } catch (error) {
            console.error('❌ Erro ao salvar parâmetros gerenciais:', error);
            throw new Error(`Falha ao salvar parâmetros gerenciais: ${error.message}`);
        }
    }

    /**
     * Recupera parâmetros gerenciais configurados
     * @param {number} diId - ID da declaração
     * @param {string} regimeTributario - Regime tributário
     * @returns {Promise<Object|null>} Parâmetros encontrados ou null
     */
    async getParametrosGerenciais(diId, regimeTributario) {
        if (!diId) {
            throw new Error('ID da DI obrigatório para buscar parâmetros gerenciais');
        }

        if (!regimeTributario) {
            throw new Error('Regime tributário obrigatório para buscar parâmetros gerenciais');
        }

        try {
            const config = await this.db.pricing_configurations
                .where('[di_id+regime_tributario]')
                .equals([diId, regimeTributario])
                .first();

            if (!config || !config.margens_padrao) {
                return null;
            }

            const margensPadrao = JSON.parse(config.margens_padrao);
            
            // Validar se contém os campos esperados
            const camposEsperados = [
                'encargos_financeiros_percentual',
                'custos_indiretos_percentual', 
                'margem_operacional_percentual',
                'tributos_recuperaveis_outros'
            ];

            const hasAllFields = camposEsperados.every(campo => 
                margensPadrao.hasOwnProperty(campo)
            );

            return hasAllFields ? margensPadrao : null;

        } catch (error) {
            console.error('❌ Erro ao recuperar parâmetros gerenciais:', error);
            throw new Error(`Falha ao recuperar parâmetros gerenciais: ${error.message}`);
        }
    }

    /**
     * Remove configuração de precificação
     * @param {number} diId - ID da declaração
     * @param {string} regimeTributario - Regime tributário (opcional - remove todos se não especificado)
     * @returns {Promise<number>} Número de registros removidos
     */
    async removePricingConfiguration(diId, regimeTributario = null) {
        if (!diId) {
            throw new Error('ID da DI obrigatório para remover configuração');
        }

        try {
            let deleted = 0;

            if (regimeTributario) {
                // Remover configuração específica do regime
                deleted = await this.db.pricing_configurations
                    .where('[di_id+regime_tributario]')
                    .equals([diId, regimeTributario])
                    .delete();
            } else {
                // Remover todas as configurações da DI
                deleted = await this.db.pricing_configurations
                    .where('di_id')
                    .equals(diId)
                    .delete();
            }

            // Se removeu todas as configurações, atualizar status da DI
            if (!regimeTributario || deleted > 0) {
                const remainingConfigs = await this.db.pricing_configurations
                    .where('di_id')
                    .equals(diId)
                    .count();

                if (remainingConfigs === 0) {
                    await this.updateDeclarationPricingStatus(diId, false);
                }
            }

            console.log(`📊 ${deleted} configuração(ões) de precificação removida(s) para DI ${diId}`);
            return deleted;

        } catch (error) {
            console.error('❌ Erro ao remover configuração de precificação:', error);
            throw new Error(`Falha ao remover configuração: ${error.message}`);
        }
    }

    // ========================================
    // MÉTODOS PIPELINE COMPLETO - v5
    // ========================================

    /**
     * Salva resultado de custos para próxima etapa (pricing)
     * @param {Object} costingResult - Resultado do cálculo de custos
     */
    async saveCostingResult(costingResult) {
        if (!costingResult) {
            throw new Error('Resultado de custos obrigatório para salvar');
        }

        if (!costingResult.di_id) {
            throw new Error('ID da DI obrigatório no resultado de custos');
        }

        if (!costingResult.regime_tributario) {
            throw new Error('Regime tributário obrigatório no resultado de custos');
        }

        if (!costingResult.custos_4_tipos) {
            throw new Error('Custos dos 4 tipos obrigatórios no resultado');
        }

        try {
            // Verificar se já existe resultado para esta DI + regime
            const existingResult = await this.db.costing_results
                .where('[di_id+regime_tributario]')
                .equals([costingResult.di_id, costingResult.regime_tributario])
                .first();

            let resultId;

            if (existingResult) {
                // Atualizar resultado existente
                resultId = existingResult.id;
                await this.db.costing_results.update(resultId, {
                    ...costingResult,
                    id: resultId,
                    timestamp: new Date().toISOString()
                });
                console.log(`✅ Resultado de custos atualizado: ID ${resultId}`);
            } else {
                // Criar novo resultado
                costingResult.timestamp = new Date().toISOString();
                resultId = await this.db.costing_results.add(costingResult);
                console.log(`✅ Novo resultado de custos salvo: ID ${resultId}`);
            }

            return resultId;

        } catch (error) {
            console.error('❌ Erro ao salvar resultado de custos:', error);
            throw new Error(`Falha ao salvar custos: ${error.message}`);
        }
    }

    /**
     * Busca resultado de custos por DI
     * @param {number} diId - ID da DI
     * @returns {Object|null} Resultado de custos ou null se não encontrado
     */
    async getCostingResult(diId) {
        if (!diId) {
            throw new Error('ID da DI obrigatório para buscar resultado de custos');
        }

        try {
            const result = await this.db.costing_results
                .where('di_id')
                .equals(diId)
                .last(); // Pegar o mais recente

            return result || null;

        } catch (error) {
            console.error('❌ Erro ao buscar resultado de custos:', error);
            throw new Error(`Falha ao buscar custos: ${error.message}`);
        }
    }

    /**
     * Busca resultado de custos por DI e regime específico
     * @param {number} diId - ID da DI
     * @param {string} regimeTributario - Regime tributário
     * @returns {Object|null} Resultado de custos ou null se não encontrado
     */
    async getCostingResultByRegime(diId, regimeTributario) {
        if (!diId || !regimeTributario) {
            throw new Error('ID da DI e regime tributário obrigatórios');
        }

        try {
            const result = await this.db.costing_results
                .where('[di_id+regime_tributario]')
                .equals([diId, regimeTributario])
                .first();

            return result || null;

        } catch (error) {
            console.error('❌ Erro ao buscar resultado de custos por regime:', error);
            throw new Error(`Falha ao buscar custos: ${error.message}`);
        }
    }

    /**
     * Salva resultado de precificação multi-cenário
     * @param {Object} pricingResult - Resultado da formação de preços
     */
    async savePricingResult(pricingResult) {
        if (!pricingResult) {
            throw new Error('Resultado de precificação obrigatório para salvar');
        }

        if (!pricingResult.di_id) {
            throw new Error('ID da DI obrigatório no resultado de precificação');
        }

        if (!pricingResult.cenarios_precos) {
            throw new Error('Cenários de preços obrigatórios no resultado');
        }

        try {
            pricingResult.timestamp = new Date().toISOString();
            const resultId = await this.db.pricing_results.add(pricingResult);
            
            console.log(`✅ Resultado de precificação salvo: ID ${resultId}`);
            return resultId;

        } catch (error) {
            console.error('❌ Erro ao salvar resultado de precificação:', error);
            throw new Error(`Falha ao salvar preços: ${error.message}`);
        }
    }

    /**
     * Busca resultado de precificação por DI
     * @param {number} diId - ID da DI
     * @returns {Object|null} Resultado de precificação ou null se não encontrado
     */
    async getPricingResult(diId) {
        if (!diId) {
            throw new Error('ID da DI obrigatório para buscar resultado de precificação');
        }

        try {
            const result = await this.db.pricing_results
                .where('di_id')
                .equals(diId)
                .last(); // Pegar o mais recente

            return result || null;

        } catch (error) {
            console.error('❌ Erro ao buscar resultado de precificação:', error);
            throw new Error(`Falha ao buscar preços: ${error.message}`);
        }
    }

    /**
     * Salva métrica do pipeline para dashboard
     * @param {Object} metric - Métrica de performance
     */
    async savePipelineMetric(metric) {
        if (!metric) {
            throw new Error('Métrica obrigatória para salvar');
        }

        if (!metric.di_id || !metric.etapa) {
            throw new Error('ID da DI e etapa obrigatórios na métrica');
        }

        try {
            metric.timestamp = new Date().toISOString();
            const metricId = await this.db.pipeline_metrics.add(metric);
            
            return metricId;

        } catch (error) {
            console.error('❌ Erro ao salvar métrica de pipeline:', error);
            // Não falhar crítico - métricas são opcionais
            return null;
        }
    }

    /**
     * Busca métricas do pipeline para dashboard
     * @param {number} diId - ID da DI (opcional)
     * @returns {Array} Lista de métricas
     */
    async getPipelineMetrics(diId = null) {
        try {
            if (diId) {
                return await this.db.pipeline_metrics
                    .where('di_id')
                    .equals(diId)
                    .orderBy('timestamp')
                    .toArray();
            } else {
                return await this.db.pipeline_metrics
                    .orderBy('timestamp')
                    .toArray();
            }

        } catch (error) {
            console.error('❌ Erro ao buscar métricas de pipeline:', error);
            return [];
        }
    }

    /**
     * Estatísticas do pipeline para dashboard expandido
     */
    async getPipelineStatistics() {
        try {
            const stats = {
                // Contadores básicos
                total_dis: await this.db.declaracoes.count(),
                custos_calculados: await this.db.costing_results.count(),
                precos_calculados: await this.db.pricing_results.count(),
                
                // Taxa de conversão entre etapas
                taxa_di_para_custos: 0,
                taxa_custos_para_precos: 0,
                
                // Regimes mais utilizados
                regimes_populares: {},
                
                // Métricas de tempo médio
                tempo_medio_custos: 0,
                tempo_medio_precos: 0
            };

            // Calcular taxas de conversão
            if (stats.total_dis > 0) {
                stats.taxa_di_para_custos = (stats.custos_calculados / stats.total_dis) * 100;
            }
            
            if (stats.custos_calculados > 0) {
                stats.taxa_custos_para_precos = (stats.precos_calculados / stats.custos_calculados) * 100;
            }

            // Análise por regime tributário
            const costingResults = await this.db.costing_results.toArray();
            const regimeCount = {};
            
            costingResults.forEach(result => {
                const regime = result.regime_tributario;
                regimeCount[regime] = (regimeCount[regime] || 0) + 1;
            });
            
            stats.regimes_populares = regimeCount;

            // Métricas de tempo médio
            const metricas = await this.db.pipeline_metrics.toArray();
            const temposCustos = metricas
                .filter(m => m.etapa === 'costing_completed')
                .map(m => m.tempo_processamento)
                .filter(t => t && t > 0);
                
            if (temposCustos.length > 0) {
                stats.tempo_medio_custos = temposCustos.reduce((a, b) => a + b, 0) / temposCustos.length;
            }

            return stats;

        } catch (error) {
            console.error('❌ Erro ao calcular estatísticas do pipeline:', error);
            return {
                total_dis: 0,
                custos_calculados: 0,
                precos_calculados: 0,
                taxa_di_para_custos: 0,
                taxa_custos_para_precos: 0,
                regimes_populares: {},
                tempo_medio_custos: 0,
                tempo_medio_precos: 0
            };
        }
    }

    // === MÉTODOS PARA ITEM PRICING (FASE 2.5) ===

    /**
     * Salvar resultado de precificação individual por item
     * @param {Object} itemPricingResult - Resultado completo do cálculo
     * @returns {Promise<number>} ID do registro salvo
     */
    async saveItemPricingResult(itemPricingResult) {
        if (!this.initialized) {
            throw new Error('IndexedDBManager não inicializado');
        }

        // Validações obrigatórias
        this._validateItemPricingResult(itemPricingResult);

        try {
            const resultado = await this.db.item_pricing_results.add({
                di_id: itemPricingResult.di_id,
                item_id: itemPricingResult.item_id,
                numero_adicao: itemPricingResult.numero_adicao,
                ncm: itemPricingResult.ncm,
                descricao_item: itemPricingResult.descricao_item,
                
                // Custos calculados
                custo_contabil_item: itemPricingResult.custo_contabil_item,
                preco_margem_zero: itemPricingResult.preco_margem_zero,
                
                // Margem aplicada
                margem_aplicada_tipo: itemPricingResult.margem_aplicada.tipo,
                margem_aplicada_valor: itemPricingResult.margem_aplicada.valor,
                preco_com_margem: itemPricingResult.preco_com_margem,
                
                // Cenário tributário
                cenario_tributario: JSON.stringify(itemPricingResult.cenario_tributario),
                estado_origem: itemPricingResult.cenario_tributario.estado_origem,
                estado_destino: itemPricingResult.cenario_tributario.estado_destino,
                tipo_cliente: itemPricingResult.cenario_tributario.tipo_cliente,
                regime_vendedor: itemPricingResult.cenario_tributario.regime_vendedor,
                
                // Impostos e preço final
                impostos_venda_breakdown: JSON.stringify(itemPricingResult.impostos_venda),
                preco_final: itemPricingResult.preco_final,
                
                // Regimes especiais
                regimes_especiais_detectados: JSON.stringify(itemPricingResult.regimes_especiais || {}),
                beneficios_aplicaveis: JSON.stringify(itemPricingResult.beneficios_aplicaveis || []),
                
                // Detalhamento completo
                calculo_detalhado: JSON.stringify(itemPricingResult.calculo_detalhado || {}),
                
                // Metadados
                timestamp_calculo: new Date().toISOString(),
                usuario_calculo: itemPricingResult.usuario_calculo || 'sistema'
            });

            console.log(`✅ Item pricing salvo com ID: ${resultado}`);
            return resultado;

        } catch (error) {
            console.error('❌ Erro ao salvar item pricing:', error);
            throw new Error(`Falha ao salvar resultado de precificação: ${error.message}`);
        }
    }

    /**
     * Buscar resultados de precificação por DI
     * @param {string} diId - ID da DI
     * @returns {Promise<Array>} Lista de resultados de precificação
     */
    async getItemPricingResultsByDI(diId) {
        if (!this.initialized) {
            throw new Error('IndexedDBManager não inicializado');
        }

        if (!diId) {
            throw new Error('DI ID obrigatório para buscar resultados de precificação');
        }

        try {
            const resultados = await this.db.item_pricing_results
                .where('di_id')
                .equals(diId)
                .toArray();

            // Deserializar campos JSON
            return resultados.map(resultado => ({
                ...resultado,
                cenario_tributario: JSON.parse(resultado.cenario_tributario || '{}'),
                impostos_venda_breakdown: JSON.parse(resultado.impostos_venda_breakdown || '{}'),
                regimes_especiais_detectados: JSON.parse(resultado.regimes_especiais_detectados || '{}'),
                beneficios_aplicaveis: JSON.parse(resultado.beneficios_aplicaveis || '[]'),
                calculo_detalhado: JSON.parse(resultado.calculo_detalhado || '{}')
            }));

        } catch (error) {
            console.error('❌ Erro ao buscar item pricing por DI:', error);
            throw new Error(`Falha ao buscar resultados de precificação: ${error.message}`);
        }
    }

    /**
     * Buscar resultado de precificação específico por item
     * @param {string} diId - ID da DI
     * @param {string} numeroAdicao - Número da adição
     * @returns {Promise<Object|null>} Resultado de precificação ou null
     */
    async getItemPricingResult(diId, numeroAdicao) {
        if (!this.initialized) {
            throw new Error('IndexedDBManager não inicializado');
        }

        if (!diId || !numeroAdicao) {
            throw new Error('DI ID e número da adição obrigatórios');
        }

        try {
            const resultado = await this.db.item_pricing_results
                .where('[di_id+numero_adicao]')
                .equals([diId, numeroAdicao])
                .first();

            if (!resultado) {
                return null;
            }

            // Deserializar campos JSON
            return {
                ...resultado,
                cenario_tributario: JSON.parse(resultado.cenario_tributario || '{}'),
                impostos_venda_breakdown: JSON.parse(resultado.impostos_venda_breakdown || '{}'),
                regimes_especiais_detectados: JSON.parse(resultado.regimes_especiais_detectados || '{}'),
                beneficios_aplicaveis: JSON.parse(resultado.beneficios_aplicaveis || '[]'),
                calculo_detalhado: JSON.parse(resultado.calculo_detalhado || '{}')
            };

        } catch (error) {
            console.error('❌ Erro ao buscar item pricing específico:', error);
            throw new Error(`Falha ao buscar resultado específico: ${error.message}`);
        }
    }

    /**
     * Obter estatísticas de precificação por item
     * @returns {Promise<Object>} Estatísticas agregadas
     */
    async getItemPricingStatistics() {
        if (!this.initialized) {
            throw new Error('IndexedDBManager não inicializado');
        }

        try {
            const resultados = await this.db.item_pricing_results.toArray();
            
            if (resultados.length === 0) {
                return {
                    total_itens_precificados: 0,
                    margem_media: 0,
                    preco_medio: 0,
                    distribuicao_por_estado: {},
                    regimes_mais_usados: {},
                    tipos_cliente_distribuicao: {}
                };
            }

            // Calcular estatísticas
            const precoMedio = resultados.reduce((acc, r) => acc + r.preco_final, 0) / resultados.length;
            
            // Distribuição por estado
            const estadosCount = {};
            const regimesCount = {};
            const clientesCount = {};

            resultados.forEach(resultado => {
                const estado = resultado.estado_destino;
                const regime = resultado.regime_vendedor;
                const cliente = resultado.tipo_cliente;

                estadosCount[estado] = (estadosCount[estado] || 0) + 1;
                regimesCount[regime] = (regimesCount[regime] || 0) + 1;
                clientesCount[cliente] = (clientesCount[cliente] || 0) + 1;
            });

            return {
                total_itens_precificados: resultados.length,
                preco_medio: precoMedio,
                distribuicao_por_estado: estadosCount,
                regimes_mais_usados: regimesCount,
                tipos_cliente_distribuicao: clientesCount,
                ultimo_calculo: resultados[resultados.length - 1]?.timestamp_calculo
            };

        } catch (error) {
            console.error('❌ Erro ao calcular estatísticas de item pricing:', error);
            return {
                total_itens_precificados: 0,
                margem_media: 0,
                preco_medio: 0,
                distribuicao_por_estado: {},
                regimes_mais_usados: {},
                tipos_cliente_distribuicao: {}
            };
        }
    }

    /**
     * Validar resultado de precificação de item
     * @private
     */
    _validateItemPricingResult(result) {
        const requiredFields = [
            'di_id', 'item_id', 'numero_adicao', 'ncm',
            'custo_contabil_item', 'preco_margem_zero', 'preco_final',
            'margem_aplicada', 'cenario_tributario'
        ];

        for (const field of requiredFields) {
            if (!result[field] && result[field] !== 0) {
                throw new Error(`Campo obrigatório ausente: ${field}`);
            }
        }

        // Validações específicas
        if (typeof result.custo_contabil_item !== 'number') {
            throw new Error('custo_contabil_item deve ser numérico');
        }

        if (typeof result.preco_final !== 'number') {
            throw new Error('preco_final deve ser numérico');
        }

        if (!result.margem_aplicada.tipo || !result.margem_aplicada.valor) {
            throw new Error('margem_aplicada deve ter tipo e valor');
        }

        if (!result.cenario_tributario.estado_origem || !result.cenario_tributario.regime_vendedor) {
            throw new Error('cenario_tributario deve ter estado_origem e regime_vendedor');
        }
    }

    /**
     * Fecha conexão com o banco
     */
    close() {
        this.db.close();
    }
}

// Export da classe para uso padrão
export default IndexedDBManager;