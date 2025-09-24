/**
 * dashboard-core.js - Core Dashboard Functionality
 * 
 * Integração direta com IndexedDBManager v3
 * Nomenclatura oficial DIProcessor.js
 */

class DashboardCore {
    constructor() {
        this.db = new Dexie('ExpertzyDB');
        this.initializeSchema();
        this.initializeEventListeners();
    }
    
    /**
     * Inicializar schema v3 - nomenclatura oficial DIProcessor.js
     */
    initializeSchema() {
        // Schema v3 - NOMENCLATURA OFICIAL DIProcessor.js (PRIMARY CREATOR)
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
            
            // Tabelas de apoio (mantidas)
            incentivos_entrada: '++id, di_id, estado, tipo_beneficio, percentual_reducao, economia_calculada, [di_id+estado]',
            incentivos_saida: '++id, di_id, estado, operacao, credito_aplicado, contrapartidas, [di_id+estado+operacao]',
            elegibilidade_ncm: '++id, ncm, estado, incentivo_codigo, elegivel, motivo_rejeicao, [ncm+estado+incentivo_codigo]',
            metricas_dashboard: '++id, periodo, tipo_metrica, valor, breakdown_estados, [periodo+tipo_metrica]',
            cenarios_precificacao: '++id, di_id, nome_cenario, configuracao, resultados_comparativos, [di_id+nome_cenario]',
            historico_operacoes: '++id, timestamp, operacao, modulo, detalhes, resultado',
            snapshots: '++id, di_id, nome_customizado, timestamp, dados_completos',
            configuracoes_usuario: 'chave, valor, timestamp, validado'
        });
        
        console.log('🗃️ Dashboard conectado ao IndexedDB v3 - nomenclatura oficial');
    }
    
    /**
     * Inicializar event listeners
     */
    initializeEventListeners() {
        // Auto-refresh a cada 30 segundos
        setInterval(() => {
            this.refreshStats();
        }, 30000);
    }
    
    /**
     * Obter estatísticas gerais do banco
     */
    async getGeneralStats() {
        try {
            console.log('📊 Carregando estatísticas gerais...');
            
            const [
                totalDIs,
                totalAdicoes,
                totalProdutos,
                totalDespesas,
                totalCarga,
                totalIncentivos,
                recentDIs
            ] = await Promise.all([
                this.db.declaracoes.count(),
                this.db.adicoes.count(),
                this.db.produtos.count(),
                this.db.despesas_aduaneiras.count(),
                this.db.dados_carga.count(),
                this.db.incentivos_entrada.count(),
                this.db.declaracoes
                    .orderBy('data_processamento')
                    .reverse()
                    .limit(5)
                    .toArray()
            ]);
            
            // Calcular estatísticas derivadas
            const avgProdutosPorDI = totalDIs > 0 ? (totalProdutos / totalDIs).toFixed(1) : 0;
            const avgAdicoesPorDI = totalDIs > 0 ? (totalAdicoes / totalDIs).toFixed(1) : 0;
            
            return {
                totalDIs,
                totalAdicoes,
                totalProdutos,
                totalDespesas,
                totalCarga,
                totalIncentivos,
                avgProdutosPorDI,
                avgAdicoesPorDI,
                recentDIs,
                lastUpdate: new Date()
            };
            
        } catch (error) {
            console.error('❌ Erro ao obter estatísticas:', error);
            return this.getEmptyStats();
        }
    }
    
    /**
     * Obter lista completa de DIs com relacionamentos
     */
    async getDIsList(limit = 50) {
        try {
            console.log('📋 Carregando lista de DIs...');
            
            const dis = await this.db.declaracoes
                .orderBy('data_processamento')
                .reverse()
                .limit(limit)
                .toArray();
            
            // Enriquecer cada DI com dados relacionados
            for (const di of dis) {
                // Contar adições e produtos relacionados
                di.count_adicoes = await this.db.adicoes.where('di_id').equals(di.id).count();
                
                const adicoesIds = await this.db.adicoes.where('di_id').equals(di.id).primaryKeys();
                di.count_produtos = adicoesIds.length > 0 ? 
                    await this.db.produtos.where('adicao_id').anyOf(adicoesIds).count() : 0;
                
                di.count_despesas = await this.db.despesas_aduaneiras.where('di_id').equals(di.id).count();
                
                // Informações de carga
                const carga = await this.db.dados_carga.where('di_id').equals(di.id).first();
                di.has_carga = !!carga;
                di.peso_total = carga?.peso_bruto || 0;
                
                // Status de processamento mais amigável
                di.status_display = this.getStatusDisplay(di.processing_state);
            }
            
            return dis;
            
        } catch (error) {
            console.error('❌ Erro ao carregar DIs:', error);
            return [];
        }
    }
    
    /**
     * Obter detalhes completos de uma DI
     */
    async getDIDetails(diId) {
        try {
            console.log(`🔍 Carregando detalhes da DI ${diId}...`);
            
            const di = await this.db.declaracoes.get(diId);
            if (!di) {
                throw new Error(`DI ${diId} não encontrada`);
            }
            
            // Buscar todos os dados relacionados
            di.adicoes = await this.db.adicoes.where('di_id').equals(di.id).toArray();
            di.despesas = await this.db.despesas_aduaneiras.where('di_id').equals(di.id).toArray();
            di.carga = await this.db.dados_carga.where('di_id').equals(di.id).first();
            
            // Buscar produtos de cada adição
            for (const adicao of di.adicoes) {
                adicao.produtos = await this.db.produtos
                    .where('adicao_id')
                    .equals(adicao.id)
                    .toArray();
            }
            
            return di;
            
        } catch (error) {
            console.error(`❌ Erro ao carregar detalhes da DI ${diId}:`, error);
            throw error;
        }
    }
    
    /**
     * Obter dados para gráficos
     */
    async getChartsData() {
        try {
            console.log('📈 Preparando dados para gráficos...');
            
            const [
                ncmStats,
                ufsStats,
                monthlyStats,
                processingStates
            ] = await Promise.all([
                this.getNcmStats(),
                this.getUfsStats(),
                this.getMonthlyStats(),
                this.getProcessingStates()
            ]);
            
            return {
                ncmStats,
                ufsStats,
                monthlyStats,
                processingStates
            };
            
        } catch (error) {
            console.error('❌ Erro ao preparar dados para gráficos:', error);
            return {
                ncmStats: [],
                ufsStats: [],
                monthlyStats: [],
                processingStates: []
            };
        }
    }
    
    /**
     * Estatísticas de NCMs mais importados
     */
    async getNcmStats() {
        const adicoes = await this.db.adicoes.toArray();
        const ncmCount = {};
        
        adicoes.forEach(adicao => {
            if (adicao.ncm) {
                ncmCount[adicao.ncm] = (ncmCount[adicao.ncm] || 0) + 1;
            }
        });
        
        return Object.entries(ncmCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([ncm, count]) => ({ ncm, count }));
    }
    
    /**
     * Estatísticas por UF dos importadores
     */
    async getUfsStats() {
        const dis = await this.db.declaracoes.toArray();
        const ufCount = {};
        
        dis.forEach(di => {
            if (di.importador_endereco_uf) {
                ufCount[di.importador_endereco_uf] = (ufCount[di.importador_endereco_uf] || 0) + 1;
            }
        });
        
        return Object.entries(ufCount)
            .sort(([,a], [,b]) => b - a)
            .map(([uf, count]) => ({ uf, count }));
    }
    
    /**
     * Estatísticas mensais
     */
    async getMonthlyStats() {
        const dis = await this.db.declaracoes.toArray();
        const monthlyCount = {};
        
        dis.forEach(di => {
            if (di.data_processamento) {
                const month = new Date(di.data_processamento).toISOString().slice(0, 7); // YYYY-MM
                monthlyCount[month] = (monthlyCount[month] || 0) + 1;
            }
        });
        
        return Object.entries(monthlyCount)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, count]) => ({ month, count }));
    }
    
    /**
     * Estatísticas por estado de processamento
     */
    async getProcessingStates() {
        const dis = await this.db.declaracoes.toArray();
        const stateCount = {};
        
        dis.forEach(di => {
            const state = di.processing_state || 'UNKNOWN';
            stateCount[state] = (stateCount[state] || 0) + 1;
        });
        
        return Object.entries(stateCount)
            .map(([state, count]) => ({ 
                state, 
                count, 
                display: this.getStatusDisplay(state) 
            }));
    }
    
    /**
     * Exportar todos os dados
     */
    async exportAllData() {
        try {
            console.log('📥 Exportando todos os dados...');
            
            const [declaracoes, adicoes, produtos, despesas, carga] = await Promise.all([
                this.db.declaracoes.toArray(),
                this.db.adicoes.toArray(),
                this.db.produtos.toArray(),
                this.db.despesas_aduaneiras.toArray(),
                this.db.dados_carga.toArray()
            ]);
            
            const exportData = {
                metadata: {
                    exportDate: new Date().toISOString(),
                    version: '3.0',
                    nomenclature: 'DIProcessor.js',
                    counts: {
                        declaracoes: declaracoes.length,
                        adicoes: adicoes.length,
                        produtos: produtos.length,
                        despesas: despesas.length,
                        carga: carga.length
                    }
                },
                data: {
                    declaracoes,
                    adicoes,
                    produtos,
                    despesas_aduaneiras: despesas,
                    dados_carga: carga
                }
            };
            
            return exportData;
            
        } catch (error) {
            console.error('❌ Erro ao exportar dados:', error);
            throw error;
        }
    }
    
    /**
     * Limpar todos os dados do banco
     */
    async clearAllData() {
        try {
            console.log('🗑️ Limpando todos os dados do banco...');
            
            await this.db.transaction('rw', [
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
                this.db.snapshots
            ], async () => {
                await Promise.all([
                    this.db.declaracoes.clear(),
                    this.db.adicoes.clear(),
                    this.db.produtos.clear(),
                    this.db.despesas_aduaneiras.clear(),
                    this.db.dados_carga.clear(),
                    this.db.incentivos_entrada.clear(),
                    this.db.incentivos_saida.clear(),
                    this.db.elegibilidade_ncm.clear(),
                    this.db.metricas_dashboard.clear(),
                    this.db.cenarios_precificacao.clear(),
                    this.db.historico_operacoes.clear(),
                    this.db.snapshots.clear()
                ]);
            });
            
            console.log('✅ Todos os dados foram removidos');
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao limpar dados:', error);
            return false;
        }
    }
    
    /**
     * Validar nomenclatura oficial
     */
    async validateNomenclature() {
        try {
            console.log('✅ Validando nomenclatura oficial DIProcessor.js...');
            
            const violations = [];
            const checks = [];
            
            // Verificar produtos com nomenclatura incorreta
            const produtosIncorretos = await this.db.produtos
                .filter(produto => !produto.descricao_mercadoria && produto.descricao)
                .toArray();
            
            if (produtosIncorretos.length > 0) {
                violations.push({
                    type: 'produtos',
                    count: produtosIncorretos.length,
                    message: 'Produtos usando "descricao" em vez de "descricao_mercadoria"'
                });
            }
            
            checks.push({
                field: 'produtos.descricao_mercadoria',
                status: produtosIncorretos.length === 0 ? 'success' : 'error',
                message: produtosIncorretos.length === 0 ? 
                    'Produtos usam nomenclatura oficial "descricao_mercadoria"' :
                    `${produtosIncorretos.length} produtos com nomenclatura incorreta`
            });
            
            // Verificar adições com tributos incorretos
            const adicoesIncorretas = await this.db.adicoes
                .filter(adicao => adicao.ii_aliquota && !adicao.ii_aliquota_ad_valorem)
                .toArray();
            
            if (adicoesIncorretas.length > 0) {
                violations.push({
                    type: 'tributos',
                    count: adicoesIncorretas.length,
                    message: 'Adições usando "ii_aliquota" em vez de "ii_aliquota_ad_valorem"'
                });
            }
            
            checks.push({
                field: 'adicoes.ii_aliquota_ad_valorem',
                status: adicoesIncorretas.length === 0 ? 'success' : 'error',
                message: adicoesIncorretas.length === 0 ? 
                    'Tributos usam nomenclatura oficial "*_aliquota_ad_valorem"' :
                    `${adicoesIncorretas.length} adições com nomenclatura incorreta`
            });
            
            // Verificar DIs com URF/modalidade incorretas
            const disIncorretas = await this.db.declaracoes
                .filter(di => (di.urf_despacho && !di.urf_despacho_nome) || 
                             (di.modalidade && !di.modalidade_nome))
                .toArray();
            
            if (disIncorretas.length > 0) {
                violations.push({
                    type: 'declaracoes',
                    count: disIncorretas.length,
                    message: 'DIs usando "urf_despacho"/"modalidade" em vez da nomenclatura oficial'
                });
            }
            
            checks.push({
                field: 'declaracoes.urf_despacho_nome',
                status: disIncorretas.length === 0 ? 'success' : 'error',
                message: disIncorretas.length === 0 ? 
                    'DIs usam nomenclatura oficial "urf_despacho_nome"' :
                    `${disIncorretas.length} DIs com nomenclatura incorreta`
            });
            
            return {
                isValid: violations.length === 0,
                violations,
                checks,
                summary: violations.length === 0 ? 
                    '✅ Sistema 100% compatível com nomenclatura oficial DIProcessor.js' :
                    `❌ ${violations.length} tipo(s) de violação encontrada(s)`
            };
            
        } catch (error) {
            console.error('❌ Erro ao validar nomenclatura:', error);
            return {
                isValid: false,
                violations: [],
                checks: [],
                summary: '❌ Erro durante validação',
                error: error.message
            };
        }
    }
    
    /**
     * Utilitários internos
     */
    getEmptyStats() {
        return {
            totalDIs: 0,
            totalAdicoes: 0,
            totalProdutos: 0,
            totalDespesas: 0,
            totalCarga: 0,
            totalIncentivos: 0,
            avgProdutosPorDI: 0,
            avgAdicoesPorDI: 0,
            recentDIs: [],
            lastUpdate: new Date()
        };
    }
    
    getStatusDisplay(processingState) {
        switch (processingState) {
            case 'DI_COMPLETE_FROM_XML':
                return 'Completa XML';
            case 'ICMS_CALCULATED':
                return 'ICMS Calculado';
            case 'FINAL_COMPLETE':
                return 'Finalizada';
            default:
                return 'Em Processo';
        }
    }
    
    /**
     * Obter detalhes completos das tabelas com dados reais
     */
    async getTableDetails() {
        try {
            console.log('🗃️ Carregando detalhes das tabelas...');
            
            const tableDetails = {};
            
            // Tabelas principais para análise
            const mainTables = [
                'declaracoes',
                'adicoes', 
                'produtos',
                'despesas_aduaneiras',
                'dados_carga'
            ];
            
            for (const tableName of mainTables) {
                tableDetails[tableName] = await this.getTableSample(tableName);
            }
            
            return tableDetails;
            
        } catch (error) {
            console.error('❌ Erro ao carregar detalhes das tabelas:', error);
            return {};
        }
    }
    
    /**
     * Obter amostra de dados de uma tabela específica
     */
    async getTableSample(tableName, limit = 10) {
        try {
            const table = this.db[tableName];
            if (!table) {
                return {
                    count: 0,
                    samples: [],
                    fields: [],
                    statistics: {}
                };
            }
            
            // Contar total de registros
            const count = await table.count();
            
            // Buscar amostra de dados
            const samples = await table.limit(limit).toArray();
            
            // Extrair campos (baseado no primeiro registro)
            const fields = samples.length > 0 ? Object.keys(samples[0]) : [];
            
            // Calcular estatísticas básicas
            const statistics = await this.calculateTableStatistics(tableName, samples);
            
            return {
                count,
                samples,
                fields,
                statistics,
                tableName: this.getTableDisplayName(tableName)
            };
            
        } catch (error) {
            console.error(`❌ Erro ao carregar amostra da tabela ${tableName}:`, error);
            return {
                count: 0,
                samples: [],
                fields: [],
                statistics: {}
            };
        }
    }
    
    /**
     * Calcular estatísticas básicas da tabela
     */
    async calculateTableStatistics(tableName, samples) {
        try {
            const stats = {
                totalRecords: samples.length,
                lastUpdate: new Date()
            };
            
            if (samples.length === 0) return stats;
            
            // Estatísticas específicas por tabela
            switch (tableName) {
                case 'declaracoes':
                    stats.uniqueImporters = [...new Set(samples.map(di => di.importador_cnpj).filter(Boolean))].length;
                    stats.uniqueUfs = [...new Set(samples.map(di => di.importador_endereco_uf).filter(Boolean))].length;
                    stats.processingStates = this.countValues(samples, 'processing_state');
                    break;
                    
                case 'adicoes':
                    stats.uniqueNCMs = [...new Set(samples.map(adicao => adicao.ncm).filter(Boolean))].length;
                    stats.avgIIAliquota = this.calculateAverage(samples, 'ii_aliquota_ad_valorem');
                    stats.avgIPIAliquota = this.calculateAverage(samples, 'ipi_aliquota_ad_valorem');
                    stats.totalValue = this.calculateSum(samples, 'valor_reais');
                    break;
                    
                case 'produtos':
                    stats.avgUnitPrice = this.calculateAverage(samples, 'valor_unitario_brl');
                    stats.uniqueUnits = [...new Set(samples.map(produto => produto.unidade_medida).filter(Boolean))].length;
                    stats.totalQuantity = this.calculateSum(samples, 'quantidade');
                    break;
                    
                case 'despesas_aduaneiras':
                    stats.uniqueTypes = [...new Set(samples.map(despesa => despesa.tipo).filter(Boolean))].length;
                    stats.totalValue = this.calculateSum(samples, 'valor');
                    stats.origins = this.countValues(samples, 'origem');
                    break;
                    
                case 'dados_carga':
                    stats.totalWeight = this.calculateSum(samples, 'peso_bruto');
                    stats.uniqueCountries = [...new Set(samples.map(carga => carga.pais_procedencia_nome).filter(Boolean))].length;
                    stats.transportModes = this.countValues(samples, 'via_transporte_nome');
                    break;
            }
            
            return stats;
            
        } catch (error) {
            console.error(`❌ Erro ao calcular estatísticas para ${tableName}:`, error);
            return { totalRecords: samples.length };
        }
    }
    
    /**
     * Obter top valores de um campo específico
     */
    async getTopFieldValues(tableName, fieldName, limit = 10) {
        try {
            const table = this.db[tableName];
            const allRecords = await table.toArray();
            
            const valueCounts = {};
            allRecords.forEach(record => {
                const value = record[fieldName];
                if (value) {
                    valueCounts[value] = (valueCounts[value] || 0) + 1;
                }
            });
            
            return Object.entries(valueCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, limit)
                .map(([value, count]) => ({ value, count }));
                
        } catch (error) {
            console.error(`❌ Erro ao obter top valores de ${fieldName}:`, error);
            return [];
        }
    }
    
    /**
     * Utilitários para cálculos estatísticos
     */
    countValues(samples, fieldName) {
        const counts = {};
        samples.forEach(sample => {
            const value = sample[fieldName] || 'N/A';
            counts[value] = (counts[value] || 0) + 1;
        });
        return counts;
    }
    
    calculateAverage(samples, fieldName) {
        const values = samples.map(s => parseFloat(s[fieldName])).filter(v => !isNaN(v));
        return values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : 0;
    }
    
    calculateSum(samples, fieldName) {
        const values = samples.map(s => parseFloat(s[fieldName])).filter(v => !isNaN(v));
        return values.reduce((a, b) => a + b, 0).toFixed(2);
    }
    
    getTableDisplayName(tableName) {
        const displayNames = {
            'declaracoes': 'Declarações de Importação',
            'adicoes': 'Adições',
            'produtos': 'Produtos/Mercadorias',
            'despesas_aduaneiras': 'Despesas Aduaneiras',
            'dados_carga': 'Dados de Carga'
        };
        return displayNames[tableName] || tableName;
    }
    
    /**
     * Obter dados completos de uma tabela com paginação
     */
    async getCompleteTableData(tableName, page = 1, limit = 50, filters = {}, orderBy = 'id') {
        try {
            const table = this.db[tableName];
            if (!table) {
                return {
                    data: [],
                    pagination: { page, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false }
                };
            }
            
            // Aplicar filtros
            let query = table.toCollection();
            
            // Filtros por campo
            Object.entries(filters).forEach(([field, value]) => {
                if (value && value.trim() !== '') {
                    query = query.filter(record => {
                        const fieldValue = String(record[field] || '').toLowerCase();
                        return fieldValue.includes(value.toLowerCase());
                    });
                }
            });
            
            // Contar total após filtros
            const total = await query.count();
            
            // Aplicar ordenação
            if (orderBy && orderBy !== 'id') {
                query = query.sortBy(orderBy);
            }
            
            // Aplicar paginação
            const offset = (page - 1) * limit;
            const data = await query.offset(offset).limit(limit).toArray();
            
            // Calcular informações de paginação
            const totalPages = Math.ceil(total / limit);
            const hasNext = page < totalPages;
            const hasPrev = page > 1;
            
            return {
                data,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext,
                    hasPrev,
                    showing: data.length,
                    from: offset + 1,
                    to: offset + data.length
                },
                fields: data.length > 0 ? Object.keys(data[0]) : [],
                tableName: this.getTableDisplayName(tableName)
            };
            
        } catch (error) {
            console.error(`❌ Erro ao carregar dados completos de ${tableName}:`, error);
            return {
                data: [],
                pagination: { page, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false }
            };
        }
    }
    
    /**
     * Obter estatísticas completas de uma DI específica
     */
    async getDICompleteStats(diId) {
        try {
            const di = await this.db.declaracoes.get(diId);
            if (!di) return null;
            
            // Buscar adições relacionadas
            const adicoes = await this.db.adicoes.where('di_id').equals(diId).toArray();
            
            // Buscar produtos de todas as adições
            const adicoesIds = adicoes.map(a => a.id);
            const produtos = adicoesIds.length > 0 ? 
                await this.db.produtos.where('adicao_id').anyOf(adicoesIds).toArray() : [];
            
            // Buscar despesas da DI
            const despesas = await this.db.despesas_aduaneiras.where('di_id').equals(diId).toArray();
            
            // Buscar dados de carga
            const carga = await this.db.dados_carga.where('di_id').equals(diId).first();
            
            // Calcular estatísticas agregadas
            const totalImpostos = {
                ii: this.calculateSum(adicoes, 'ii_valor_devido'),
                ipi: this.calculateSum(adicoes, 'ipi_valor_devido'),
                pis: this.calculateSum(adicoes, 'pis_valor_devido'),
                cofins: this.calculateSum(adicoes, 'cofins_valor_devido'),
                total: 0
            };
            totalImpostos.total = parseFloat(totalImpostos.ii) + parseFloat(totalImpostos.ipi) + 
                                 parseFloat(totalImpostos.pis) + parseFloat(totalImpostos.cofins);
            
            const totalDespesas = this.calculateSum(despesas, 'valor');
            const valorTotalImportacao = this.calculateSum(adicoes, 'valor_reais');
            
            return {
                di,
                counts: {
                    adicoes: adicoes.length,
                    produtos: produtos.length,
                    despesas: despesas.length,
                    ncmsUnicos: [...new Set(adicoes.map(a => a.ncm).filter(Boolean))].length
                },
                valores: {
                    totalImportacao: parseFloat(valorTotalImportacao),
                    totalImpostos: totalImpostos.total,
                    totalDespesas: parseFloat(totalDespesas),
                    custoTotalEstimado: parseFloat(valorTotalImportacao) + totalImpostos.total + parseFloat(totalDespesas)
                },
                breakdown: {
                    impostos: totalImpostos,
                    despesas: this.groupBy(despesas, 'tipo'),
                    fornecedores: [...new Set(adicoes.map(a => a.fornecedor_nome).filter(Boolean))],
                    paises: [...new Set(adicoes.map(a => a.fabricante_nome).filter(Boolean))]
                },
                carga: carga || null
            };
            
        } catch (error) {
            console.error(`❌ Erro ao calcular estatísticas da DI ${diId}:`, error);
            return null;
        }
    }
    
    /**
     * Obter estrutura hierárquica completa de uma DI
     */
    async getDIWithFullHierarchy(diId) {
        try {
            const stats = await this.getDICompleteStats(diId);
            if (!stats) return null;
            
            // Buscar adições com produtos
            const adicoesWithProdutos = await this.getAdicoesWithProdutos(diId);
            
            return {
                ...stats,
                hierarchy: adicoesWithProdutos
            };
            
        } catch (error) {
            console.error(`❌ Erro ao montar hierarquia da DI ${diId}:`, error);
            return null;
        }
    }
    
    /**
     * Obter todas as adições de uma DI com seus produtos
     */
    async getAdicoesWithProdutos(diId) {
        try {
            const adicoes = await this.db.adicoes.where('di_id').equals(diId).toArray();
            
            for (const adicao of adicoes) {
                // Buscar produtos da adição
                adicao.produtos = await this.db.produtos
                    .where('adicao_id')
                    .equals(adicao.id)
                    .toArray();
                
                // Calcular estatísticas da adição
                adicao.stats = {
                    totalProdutos: adicao.produtos.length,
                    valorTotalProdutos: this.calculateSum(adicao.produtos, 'valor_total_brl'),
                    quantidadeTotal: this.calculateSum(adicao.produtos, 'quantidade'),
                    unidadesMedida: [...new Set(adicao.produtos.map(p => p.unidade_medida).filter(Boolean))]
                };
            }
            
            return adicoes;
            
        } catch (error) {
            console.error(`❌ Erro ao buscar adições com produtos da DI ${diId}:`, error);
            return [];
        }
    }
    
    /**
     * Obter cálculos agregados de impostos
     */
    async getTotalImpostosByDI() {
        try {
            const dis = await this.db.declaracoes.toArray();
            const results = [];
            
            for (const di of dis) {
                const stats = await this.getDICompleteStats(di.id);
                if (stats) {
                    results.push({
                        di_id: di.id,
                        numero_di: di.numero_di,
                        importador_nome: di.importador_nome,
                        total_impostos: stats.valores.totalImpostos,
                        breakdown_impostos: stats.breakdown.impostos,
                        total_despesas: stats.valores.totalDespesas,
                        custo_total: stats.valores.custoTotalEstimado
                    });
                }
            }
            
            return results.sort((a, b) => b.total_impostos - a.total_impostos);
            
        } catch (error) {
            console.error('❌ Erro ao calcular impostos por DI:', error);
            return [];
        }
    }
    
    /**
     * Obter análise de fornecedores por país
     */
    async getSupplierAnalysis() {
        try {
            const adicoes = await this.db.adicoes.toArray();
            const analysis = {};
            
            adicoes.forEach(adicao => {
                const pais = adicao.fabricante_nome || 'Não informado';
                const fornecedor = adicao.fornecedor_nome || 'Não informado';
                
                if (!analysis[pais]) {
                    analysis[pais] = {
                        pais,
                        fornecedores: new Set(),
                        totalAdicoes: 0,
                        valorTotal: 0,
                        ncms: new Set()
                    };
                }
                
                analysis[pais].fornecedores.add(fornecedor);
                analysis[pais].totalAdicoes++;
                analysis[pais].valorTotal += parseFloat(adicao.valor_reais || 0);
                analysis[pais].ncms.add(adicao.ncm);
            });
            
            return Object.values(analysis).map(item => ({
                pais: item.pais,
                fornecedores: Array.from(item.fornecedores),
                totalFornecedores: item.fornecedores.size,
                totalAdicoes: item.totalAdicoes,
                valorTotal: item.valorTotal,
                ncmsUnicos: item.ncms.size,
                participacao: 0 // Será calculado no frontend
            })).sort((a, b) => b.valorTotal - a.valorTotal);
            
        } catch (error) {
            console.error('❌ Erro na análise de fornecedores:', error);
            return [];
        }
    }
    
    /**
     * Utilitários adicionais
     */
    groupBy(array, key) {
        return array.reduce((result, item) => {
            const group = item[key] || 'Não classificado';
            if (!result[group]) {
                result[group] = [];
            }
            result[group].push(item);
            return result;
        }, {});
    }
    
    /**
     * Refresh das estatísticas (chamado automaticamente)
     */
    async refreshStats() {
        if (window.dashboardComponents && window.dashboardComponents.refreshStats) {
            await window.dashboardComponents.refreshStats();
        }
    }
}

// Exportar para uso global
window.DashboardCore = DashboardCore;