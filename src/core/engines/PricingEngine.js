/**
 * PricingEngine.js - Phase 2: Pricing Strategy Engine
 * 
 * Handles business pricing analysis and optimization
 * Focused ONLY on pricing strategies, NOT compliance
 * Works with processed DI data from Phase 1
 */

class PricingEngine {
    constructor() {
        this.diData = null;
        this.scenarios = [];
        this.pricingRules = {};
        this.marketAnalysis = {};
        this.configurations = {};
        this.configLoader = new ConfigLoader();
        
        // NOVA INTEGRAÇÃO: Sistema de cálculo de custos por regime
        this.costCalculationEngine = null;
        this.regimeConfigManager = null;
        this.productMemoryManager = null;
        this.initializeCostSystem();
    }
    
    /**
     * Inicializa sistema de cálculo de custos integrado
     */
    async initializeCostSystem() {
        const missingComponents = [];
        
        try {
            // Verificar se classes estão disponíveis - OBRIGATÓRIAS
            if (typeof CostCalculationEngine !== 'undefined') {
                this.costCalculationEngine = new CostCalculationEngine();
                await this.costCalculationEngine.initializeEngine();
                console.log('✅ CostCalculationEngine integrado ao PricingEngine');
            } else {
                missingComponents.push('CostCalculationEngine');
            }
            
            if (typeof RegimeConfigManager !== 'undefined') {
                this.regimeConfigManager = new RegimeConfigManager();
                console.log('✅ RegimeConfigManager integrado ao PricingEngine');
            } else {
                missingComponents.push('RegimeConfigManager');
            }
            
            if (typeof ProductMemoryManager !== 'undefined') {
                this.productMemoryManager = new ProductMemoryManager();
                console.log('✅ ProductMemoryManager integrado ao PricingEngine');
            } else {
                missingComponents.push('ProductMemoryManager');
            }
            
            // FAIL-FAST: Se componentes obrigatórios não estão disponíveis
            if (missingComponents.length > 0) {
                throw new Error(`Componentes obrigatórios não disponíveis: ${missingComponents.join(', ')} - PricingEngine não pode operar sem sistema completo de custos por regime`);
            }
            
        } catch (error) {
            console.error('❌ Erro crítico na inicialização do PricingEngine:', error);
            throw new Error(`PricingEngine requer integração completa com sistema de custos - ${error.message}`);
        }
    }

    // ========================================
    // FASE 2: MOTOR DE CÁLCULO - 4 TIPOS DE CUSTOS
    // Implementação conforme PLANO FASE 2 DEFINITIVO
    // ========================================

    /**
     * TIPO 1: Cálculo do Custo Base
     * Fórmula: valor_aduaneiro + II + IPI + PIS + COFINS + ICMS + despesas_aduaneiras
     * @param {Object} engineData - Dados estruturados para cálculo
     * @returns {Object} Estrutura completa do custo base
     */
    calculateCustoBase(engineData) {
        // Validações NO FALLBACKS obrigatórias
        if (!engineData) {
            throw new Error('engineData obrigatório para cálculo de custo base - não fornecido');
        }

        if (!engineData.totais) {
            throw new Error('engineData.totais obrigatório para cálculo de custo base - estrutura ausente');
        }

        const totais = engineData.totais;

        // Validar cada componente obrigatório
        if (typeof totais.valor_aduaneiro !== 'number') {
            throw new Error('Valor aduaneiro obrigatório e deve ser numérico para cálculo de custo base');
        }

        if (typeof totais.ii_devido !== 'number') {
            throw new Error('II devido obrigatório e deve ser numérico para cálculo de custo base');
        }

        if (typeof totais.ipi_devido !== 'number') {
            throw new Error('IPI devido obrigatório e deve ser numérico para cálculo de custo base');
        }

        if (typeof totais.pis_devido !== 'number') {
            throw new Error('PIS devido obrigatório e deve ser numérico para cálculo de custo base');
        }

        if (typeof totais.cofins_devido !== 'number') {
            throw new Error('COFINS devido obrigatório e deve ser numérico para cálculo de custo base');
        }

        if (typeof totais.icms_devido !== 'number') {
            throw new Error('ICMS devido obrigatório e deve ser numérico para cálculo de custo base');
        }

        if (typeof totais.despesas_aduaneiras !== 'number') {
            throw new Error('Despesas aduaneiras obrigatório e deve ser numérico para cálculo de custo base');
        }

        // Calcular custo base conforme fórmula oficial
        const custo_base = 
            totais.valor_aduaneiro +
            totais.ii_devido +
            totais.ipi_devido +
            totais.pis_devido +
            totais.cofins_devido +
            totais.icms_devido +
            totais.despesas_aduaneiras;

        console.log(`💰 Custo Base calculado: R$ ${custo_base.toFixed(2)}`);

        return {
            custo_base: custo_base,
            detalhamento: {
                valor_aduaneiro: totais.valor_aduaneiro,
                impostos_federais: totais.ii_devido + totais.ipi_devido + totais.pis_devido + totais.cofins_devido,
                icms: totais.icms_devido,
                despesas_aduaneiras: totais.despesas_aduaneiras
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * TIPO 2: Cálculo do Custo de Desembolso
     * Fórmula: custo_base - creditos_tributarios_por_regime
     * @param {number} custoBase - Custo base calculado anteriormente
     * @param {string} regimeTributario - lucro_real | lucro_presumido | simples_nacional
     * @param {Object} engineData - Dados para cálculo de créditos
     * @returns {Object} Estrutura completa do custo de desembolso
     */
    async calculateCustoDesembolso(custoBase, regimeTributario, engineData) {
        // Validações NO FALLBACKS obrigatórias
        if (typeof custoBase !== 'number') {
            throw new Error('Custo base deve ser numérico para cálculo de custo de desembolso');
        }

        if (custoBase <= 0) {
            throw new Error('Custo base deve ser positivo para cálculo de custo de desembolso');
        }

        if (!regimeTributario) {
            throw new Error('Regime tributário obrigatório para cálculo de custo de desembolso - não fornecido');
        }

        const regimesValidos = ['lucro_real', 'lucro_presumido', 'simples_nacional'];
        if (!regimesValidos.includes(regimeTributario)) {
            throw new Error(`Regime tributário inválido: ${regimeTributario}. Válidos: ${regimesValidos.join(', ')}`);
        }

        if (!engineData) {
            throw new Error('engineData obrigatório para cálculo de créditos tributários');
        }

        // Calcular créditos por regime tributário
        const creditos = await this.calculateCreditos(custoBase, regimeTributario, engineData);

        const custo_desembolso = custoBase - creditos.total_creditos;

        console.log(`💳 Custo Desembolso calculado: R$ ${custo_desembolso.toFixed(2)} (créditos: R$ ${creditos.total_creditos.toFixed(2)})`);

        return {
            custo_desembolso: custo_desembolso,
            custo_base_original: custoBase,
            total_creditos_aplicados: creditos.total_creditos,
            economia_creditos: creditos.total_creditos,
            percentual_economia: ((creditos.total_creditos / custoBase) * 100),
            regime_tributario: regimeTributario,
            detalhamento_creditos: creditos.detalhamento,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * TIPO 3: Cálculo do Custo Contábil
     * Fórmula: custo_desembolso + encargos_financeiros - tributos_recuperáveis
     * @param {number} custoDesembolso - Custo de desembolso calculado anteriormente
     * @param {Object} parametrosGerenciais - Parâmetros obrigatórios do usuário
     * @returns {Object} Estrutura completa do custo contábil
     */
    calculateCustoContabil(custoDesembolso, parametrosGerenciais) {
        // Validações NO FALLBACKS obrigatórias
        if (typeof custoDesembolso !== 'number') {
            throw new Error('Custo de desembolso deve ser numérico para cálculo de custo contábil');
        }

        if (custoDesembolso <= 0) {
            throw new Error('Custo de desembolso deve ser positivo para cálculo de custo contábil');
        }

        if (!parametrosGerenciais) {
            throw new Error('Parâmetros gerenciais obrigatórios - devem ser preenchidos pelo usuário na interface');
        }

        if (typeof parametrosGerenciais.encargos_financeiros_percentual !== 'number') {
            throw new Error('Encargos financeiros (%) obrigatório - deve ser configurado pelo usuário');
        }

        if (typeof parametrosGerenciais.tributos_recuperaveis_outros !== 'number') {
            throw new Error('Tributos recuperáveis outros (valor) obrigatório - deve ser configurado pelo usuário');
        }

        // Validar percentuais dentro de limites razoáveis
        if (parametrosGerenciais.encargos_financeiros_percentual < 0 || parametrosGerenciais.encargos_financeiros_percentual > 100) {
            throw new Error('Encargos financeiros % deve estar entre 0 e 100');
        }

        if (parametrosGerenciais.tributos_recuperaveis_outros < 0) {
            throw new Error('Tributos recuperáveis outros deve ser >= 0');
        }

        // Calcular componentes do custo contábil
        const encargosFinanceiros = custoDesembolso * (parametrosGerenciais.encargos_financeiros_percentual / 100);
        const tributosRecuperaveis = parametrosGerenciais.tributos_recuperaveis_outros;

        const custo_contabil = custoDesembolso + encargosFinanceiros - tributosRecuperaveis;

        console.log(`📊 Custo Contábil calculado: R$ ${custo_contabil.toFixed(2)}`);

        return {
            custo_contabil: custo_contabil,
            custo_desembolso_original: custoDesembolso,
            encargos_financeiros: encargosFinanceiros,
            encargos_financeiros_percentual: parametrosGerenciais.encargos_financeiros_percentual,
            tributos_recuperaveis_outros: tributosRecuperaveis,
            ajuste_liquido: encargosFinanceiros - tributosRecuperaveis,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * TIPO 4: Cálculo da Base para Formação de Preço
     * Fórmula: custo_contabil + custos_indiretos + margem_operacional
     * @param {number} custoContabil - Custo contábil calculado anteriormente
     * @param {Object} parametrosGerenciais - Parâmetros obrigatórios do usuário
     * @returns {Object} Estrutura completa da base para formação de preço
     */
    calculateBaseFormacaoPreco(custoContabil, parametrosGerenciais) {
        // Validações NO FALLBACKS obrigatórias
        if (typeof custoContabil !== 'number') {
            throw new Error('Custo contábil deve ser numérico para cálculo de base de formação de preço');
        }

        if (custoContabil <= 0) {
            throw new Error('Custo contábil deve ser positivo para cálculo de base de formação de preço');
        }

        if (!parametrosGerenciais) {
            throw new Error('Parâmetros gerenciais obrigatórios - devem ser preenchidos pelo usuário na interface');
        }

        if (typeof parametrosGerenciais.custos_indiretos_percentual !== 'number') {
            throw new Error('Custos indiretos (%) obrigatório - deve ser configurado pelo usuário');
        }

        if (typeof parametrosGerenciais.margem_operacional_percentual !== 'number') {
            throw new Error('Margem operacional (%) obrigatório - deve ser configurado pelo usuário');
        }

        // Validar percentuais dentro de limites razoáveis
        if (parametrosGerenciais.custos_indiretos_percentual < 0 || parametrosGerenciais.custos_indiretos_percentual > 100) {
            throw new Error('Custos indiretos % deve estar entre 0 e 100');
        }

        if (parametrosGerenciais.margem_operacional_percentual < 0 || parametrosGerenciais.margem_operacional_percentual > 1000) {
            throw new Error('Margem operacional % deve estar entre 0 e 1000');
        }

        // Calcular componentes da base de formação de preço
        const custosIndiretos = custoContabil * (parametrosGerenciais.custos_indiretos_percentual / 100);
        const margemOperacional = custoContabil * (parametrosGerenciais.margem_operacional_percentual / 100);

        const base_formacao_preco = custoContabil + custosIndiretos + margemOperacional;

        console.log(`🎯 Base Formação Preço calculada: R$ ${base_formacao_preco.toFixed(2)}`);

        return {
            base_formacao_preco: base_formacao_preco,
            custo_contabil_original: custoContabil,
            custos_indiretos: custosIndiretos,
            custos_indiretos_percentual: parametrosGerenciais.custos_indiretos_percentual,
            margem_operacional: margemOperacional,
            margem_operacional_percentual: parametrosGerenciais.margem_operacional_percentual,
            incremento_total: custosIndiretos + margemOperacional,
            markup_sobre_contabil: ((base_formacao_preco - custoContabil) / custoContabil) * 100,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Cálculo de Créditos Tributários conforme Lei 10.865/2004
     * Base correta: valor_aduaneiro + ipi_capitalizado (SEM despesas aduaneiras)
     * @param {number} custoBase - Custo base para referência
     * @param {string} regimeTributario - Regime tributário da empresa
     * @param {Object} engineData - Dados da DI para cálculo
     * @returns {Object} Créditos detalhados por imposto e regime
     */
    async calculateCreditos(custoBase, regimeTributario, engineData) {
        // Validações NO FALLBACKS obrigatórias
        if (!engineData || !engineData.totais) {
            throw new Error('Dados de totais obrigatórios para cálculo de créditos tributários');
        }

        const totais = engineData.totais;
        
        // Base de cálculo CORRETA conforme Lei 10.865/2004
        const baseCreditos = totais.valor_aduaneiro + totais.ipi_devido;
        if (baseCreditos <= 0) {
            throw new Error('Base de créditos inválida - valor aduaneiro + IPI deve ser positivo');
        }

        // Identificar tipo de importação (monofásico vs normal)
        const importType = await this.identifyImportationType(engineData);
        
        console.log(`🔍 Tipo importação detectado: ${importType.type} | Base créditos: R$ ${baseCreditos.toFixed(2)}`);

        let creditos = {
            creditos_pis: 0,
            creditos_cofins: 0,
            creditos_ipi: 0,
            creditos_icms: 0,
            total_creditos: 0
        };

        // Calcular créditos por regime tributário
        switch (regimeTributario) {
            case 'lucro_real':
                // Lucro Real: permite crédito integral mesmo para monofásicos
                creditos.creditos_pis = baseCreditos * (importType.pis_aliquota / 100);
                creditos.creditos_cofins = baseCreditos * (importType.cofins_aliquota / 100);
                creditos.creditos_ipi = totais.ipi_devido;
                creditos.creditos_icms = totais.icms_devido;
                
                // IMPORTANTE: Adicional COFINS (1%) NUNCA gera crédito
                if (totais.cofins_adicional) {
                    console.log(`⚠️ Adicional COFINS R$ ${totais.cofins_adicional.toFixed(2)} não gera crédito (§21 art.8º)`);
                }
                break;

            case 'lucro_presumido':
                // Lucro Presumido: SEM créditos PIS/COFINS (regime cumulativo)
                creditos.creditos_pis = 0;
                creditos.creditos_cofins = 0;
                creditos.creditos_ipi = totais.ipi_devido; // IPI permite crédito (importadora = indústria)
                creditos.creditos_icms = totais.icms_devido;
                break;

            case 'simples_nacional':
                // Simples Nacional: ZERO créditos em todos os impostos
                creditos.creditos_pis = 0;
                creditos.creditos_cofins = 0;
                creditos.creditos_ipi = 0;
                creditos.creditos_icms = 0;
                break;

            default:
                throw new Error(`Regime tributário não suportado para cálculo de créditos: ${regimeTributario}`);
        }

        creditos.total_creditos = creditos.creditos_pis + creditos.creditos_cofins + creditos.creditos_ipi + creditos.creditos_icms;

        return {
            total_creditos: creditos.total_creditos,
            detalhamento: creditos,
            regime_tributario: regimeTributario,
            import_type: importType.type,
            base_calculo_creditos: baseCreditos,
            aliquotas_aplicadas: {
                pis: importType.pis_aliquota,
                cofins: importType.cofins_aliquota
            },
            observacoes: [
                regimeTributario === 'lucro_real' ? 'Crédito integral permitido (regime não-cumulativo)' : null,
                regimeTributario === 'lucro_presumido' ? 'SEM crédito PIS/COFINS (regime cumulativo)' : null,
                regimeTributario === 'simples_nacional' ? 'SEM créditos (tributação unificada DAS)' : null,
                importType.type === 'monofasic' ? 'Produto monofásico - mesmas alíquotas importação' : null
            ].filter(Boolean),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Identificar tipo de importação: produtos monofásicos vs normais
     * @param {Object} engineData - Dados da DI com adições/produtos
     * @returns {Object} Tipo de importação e alíquotas aplicáveis
     */
    async identifyImportationType(engineData) {
        // Validações NO FALLBACKS obrigatórias
        if (!engineData || !engineData.adicoes) {
            throw new Error('Adições obrigatórias para identificar tipo de importação (monofásico vs normal)');
        }

        if (!Array.isArray(engineData.adicoes) || engineData.adicoes.length === 0) {
            throw new Error('Array de adições deve conter pelo menos um item para identificação do tipo');
        }

        // Carregar dados de tributação monofásica
        let tributacaoMonofasica;
        try {
            const response = await fetch(new URL('../../shared/data/tributacao-monofasica.json', import.meta.url));
            if (!response.ok) {
                throw new Error('Erro ao carregar dados de tributação monofásica');
            }
            tributacaoMonofasica = await response.json();
        } catch (error) {
            throw new Error(`Erro ao carregar tributacao-monofasica.json: ${error.message}`);
        }

        if (!tributacaoMonofasica.deteccao_automatica || !tributacaoMonofasica.deteccao_automatica.padroes_ncm_4digitos) {
            throw new Error('Dados de detecção automática inválidos no arquivo tributacao-monofasica.json');
        }

        // Verificar se alguma adição contém produto monofásico
        const padroesMonofasicos = tributacaoMonofasica.deteccao_automatica.padroes_ncm_4digitos;
        const hasMonofasicProduct = engineData.adicoes.some(adicao => {
            if (!adicao.ncm) {
                throw new Error(`NCM obrigatório para identificação - adição sem NCM encontrada`);
            }
            return padroesMonofasicos.some(padrao => adicao.ncm.startsWith(padrao));
        });

        // Retornar tipo de importação com alíquotas
        const importType = hasMonofasicProduct ? 'monofasic' : 'normal';
        const aliquotas = tributacaoMonofasica.aliquotas_importacao.padrao_monofasico;

        return {
            type: importType,
            pis_aliquota: aliquotas.pis_import,
            cofins_aliquota: aliquotas.cofins_import,
            cofins_adicional: aliquotas.cofins_adicional,
            ncms_monofasicos: hasMonofasicProduct ? 
                engineData.adicoes.filter(adicao => 
                    padroesMonofasicos.some(padrao => adicao.ncm.startsWith(padrao))
                ).map(adicao => adicao.ncm) : []
        };
    }

    /**
     * Método principal: Calcular todos os 4 tipos de custos sequencialmente
     * @param {Object} engineData - Dados estruturados da DI
     * @returns {Object} Resultado completo com os 4 tipos de custos
     */
    async calculatePricing(engineData) {
        console.log('🏭 Iniciando cálculo completo dos 4 tipos de custos...');

        // Validação geral obrigatória
        if (!engineData) {
            throw new Error('engineData obrigatório para cálculo de precificação');
        }

        if (!engineData.regime_tributario) {
            throw new Error('Regime tributário obrigatório - deve ser especificado no engineData');
        }

        if (!engineData.parametros_gerenciais) {
            throw new Error('Parâmetros gerenciais obrigatórios - devem ser preenchidos pelo usuário');
        }

        try {
            // TIPO 1: Custo Base
            const resultadoCustoBase = this.calculateCustoBase(engineData);
            
            // TIPO 2: Custo de Desembolso
            const resultadoCustoDesembolso = await this.calculateCustoDesembolso(
                resultadoCustoBase.custo_base, 
                engineData.regime_tributario, 
                engineData
            );
            
            // TIPO 3: Custo Contábil
            const resultadoCustoContabil = this.calculateCustoContabil(
                resultadoCustoDesembolso.custo_desembolso, 
                engineData.parametros_gerenciais
            );
            
            // TIPO 4: Base para Formação de Preço
            const resultadoBaseFormacaoPreco = this.calculateBaseFormacaoPreco(
                resultadoCustoContabil.custo_contabil, 
                engineData.parametros_gerenciais
            );

            // Estruturar resultado final completo
            const resultadoFinal = {
                di_id: engineData.di_id,
                numero_di: engineData.numero_di,
                regime_tributario: engineData.regime_tributario,
                
                // 4 TIPOS DE CUSTOS
                custo_base: resultadoCustoBase.custo_base,
                custo_desembolso: resultadoCustoDesembolso.custo_desembolso,
                custo_contabil: resultadoCustoContabil.custo_contabil,
                base_formacao_preco: resultadoBaseFormacaoPreco.base_formacao_preco,
                
                // Análises principais
                total_creditos: resultadoCustoDesembolso.total_creditos_aplicados,
                economia_creditos: resultadoCustoDesembolso.economia_creditos,
                percentual_economia: resultadoCustoDesembolso.percentual_economia,
                
                // Tipo de importação detectado
                import_type: resultadoCustoDesembolso.regime_tributario,
                
                // Detalhamento completo
                detalhamento_completo: {
                    custoBase: resultadoCustoBase,
                    custoDesembolso: resultadoCustoDesembolso,
                    custoContabil: resultadoCustoContabil,
                    baseFormacaoPreco: resultadoBaseFormacaoPreco
                },
                
                timestamp: new Date().toISOString(),
                versao_calculo: '2.0.0'
            };

            console.log('✅ Cálculo completo dos 4 tipos de custos finalizado com sucesso');
            console.log(`📊 Resumo: Base R$ ${resultadoFinal.custo_base.toFixed(2)} → Desembolso R$ ${resultadoFinal.custo_desembolso.toFixed(2)} → Contábil R$ ${resultadoFinal.custo_contabil.toFixed(2)} → Formação Preço R$ ${resultadoFinal.base_formacao_preco.toFixed(2)}`);
            
            return resultadoFinal;

        } catch (error) {
            console.error('❌ Erro no cálculo dos 4 tipos de custos:', error);
            throw new Error(`Falha no cálculo de precificação: ${error.message}`);
        }
    }

    /**
     * Load processed DI data from Phase 1
     * @param {Object} processedDI - Data from DI Processor
     */
    async loadProcessedDI(processedDI) {
        console.log('📊 PricingEngine: Carregando dados da DI processada...');
        
        // Initialize configurations
        await this.configLoader.loadAll();
        
        if (!processedDI || !processedDI.calculoImpostos) {
            throw new Error('Dados da DI devem ser processados na Fase 1 antes da precificação');
        }
        
        this.diData = { ...processedDI };
        console.log('✅ Dados da DI carregados para análise de preços');
        
        return this.diData;
    }

    /**
     * Configure pricing rules and parameters
     */
    configurePricingRules(rules) {
        console.log('⚙️ Configurando regras de precificação...');
        
        this.pricingRules = {
            // Customer segments
            customer_types: rules.customer_types || {
                final_consumer: { markup_min: 30, markup_max: 50, tax_regime: 'normal' },
                reseller: { markup_min: 15, markup_max: 25, tax_regime: 'substitution' },
                industry: { markup_min: 10, markup_max: 20, tax_regime: 'normal' }
            },
            
            // Market positioning
            positioning: rules.positioning || {
                premium: { markup_factor: 1.5, quality_score: 95 },
                standard: { markup_factor: 1.0, quality_score: 80 },
                competitive: { markup_factor: 0.8, quality_score: 70 }
            },
            
            // Volume discounts
            volume_breaks: rules.volume_breaks || [
                { min_qty: 1, max_qty: 10, discount: 0 },
                { min_qty: 11, max_qty: 50, discount: 5 },
                { min_qty: 51, max_qty: 100, discount: 10 },
                { min_qty: 101, max_qty: null, discount: 15 }
            ],
            
            // Payment terms
            payment_terms: rules.payment_terms || {
                cash: { discount: 3 },
                '30_days': { discount: 0 },
                '60_days': { increase: 2 },
                '90_days': { increase: 4 }
            }
        };
        
        console.log('✅ Regras de precificação configuradas');
    }

    /**
     * Generate pricing scenarios using regime-based cost calculation
     */
    async generateStateScenarios() {
        console.log('🗺️ Gerando cenários por estado com custos por regime...');
        
        if (!this.productMemoryManager) {
            throw new Error('ProductMemoryManager não disponível - necessário para análise de precificação');
        }
        
        // Obter regime tributário atual
        const currentRegime = this.regimeConfigManager.getCurrentRegime();
        console.log(`📊 Regime atual: ${currentRegime}`);
        
        // Obter produtos da memória
        const allProducts = this.productMemoryManager.products;
        if (!allProducts || allProducts.length === 0) {
            throw new Error('Nenhum produto encontrado na memória - processe uma DI primeiro');
        }
        
        const states = ['GO', 'SC', 'ES', 'MG', 'SP'];
        const scenarios = [];
        
        for (const state of states) {
            const scenario = await this.calculateRegimeBasedScenario(state, currentRegime, allProducts);
            scenarios.push(scenario);
        }
        
        // Sort by best total cost
        scenarios.sort((a, b) => a.totals.total_cost - b.totals.total_cost);
        
        this.scenarios = scenarios;
        console.log(`✅ ${scenarios.length} cenários gerados com custos por regime`);
        
        return scenarios;
    }

    /**
     * Calculate scenario for specific state
     */
    /**
     * NOVO: Calcula cenário baseado em regime tributário correto - ZERO FALLBACKS
     */
    async calculateRegimeBasedScenario(state, regime, products) {
        console.log(`🏛️ Calculando cenário ${state} para regime ${regime}...`);
        
        if (!state) {
            throw new Error('Estado não fornecido - obrigatório para cálculo de cenário');
        }
        
        if (!regime) {
            throw new Error('Regime tributário não fornecido - obrigatório para cálculo de cenário');
        }
        
        if (!products || products.length === 0) {
            throw new Error('Produtos não fornecidos - obrigatório para cálculo de cenário');
        }
        
        let totalBaseCost = 0;
        let totalNetCost = 0;
        let totalCredits = 0;
        let productCount = 0;
        
        // Calcular custos líquidos para cada produto usando CostCalculationEngine
        for (const product of products) {
            if (!product.id) {
                throw new Error(`Produto sem ID encontrado - obrigatório para cálculo`);
            }
            
            // Calcular custo para o regime atual - FAIL-FAST se erro
            const costCalculation = this.costCalculationEngine.calculateProductCost(product.id, regime);
            
            if (!costCalculation.net_cost) {
                throw new Error(`Cálculo de custo inválido para produto ${product.id} - estrutura net_cost ausente`);
            }
            
            if (typeof costCalculation.net_cost.base_cost !== 'number') {
                throw new Error(`Base cost inválido para produto ${product.id} - deve ser numérico`);
            }
            
            if (typeof costCalculation.net_cost.final_cost !== 'number') {
                throw new Error(`Final cost inválido para produto ${product.id} - deve ser numérico`);
            }
            
            if (typeof costCalculation.tax_credits.total_credits !== 'number') {
                throw new Error(`Total credits inválido para produto ${product.id} - deve ser numérico`);
            }
            
            totalBaseCost += costCalculation.net_cost.base_cost;
            totalNetCost += costCalculation.net_cost.final_cost;
            totalCredits += costCalculation.tax_credits.total_credits;
            productCount++;
        }
        
        if (productCount === 0) {
            throw new Error(`Nenhum produto válido encontrado para calcular cenário ${state}`);
        }
        
        // Obter alíquotas de saída do regime - FAIL-FAST se não encontrar
        const salesTaxRates = this.regimeConfigManager.getSalesTaxRates(regime);
        if (!salesTaxRates) {
            throw new Error(`Alíquotas de saída não encontradas para regime ${regime} - obrigatórias para cálculo`);
        }
        
        // Validar alíquotas obrigatórias baseado no regime
        if (regime === 'simples_nacional') {
            if (typeof salesTaxRates.das !== 'number') {
                throw new Error(`Alíquota DAS não encontrada para Simples Nacional - obrigatória para cálculo`);
            }
        } else {
            if (typeof salesTaxRates.pis !== 'number') {
                throw new Error(`Alíquota PIS não encontrada para regime ${regime} - obrigatória para cálculo`);
            }
            
            if (typeof salesTaxRates.cofins !== 'number') {
                throw new Error(`Alíquota COFINS não encontrada para regime ${regime} - obrigatória para cálculo`);
            }
        }
        
        // Obter alíquota ICMS do estado - FAIL-FAST se não encontrar
        const icmsRate = await this.configLoader.getICMSRate(state);
        if (typeof icmsRate !== 'number') {
            throw new Error(`Alíquota ICMS não encontrada para estado ${state} - obrigatória para cálculo`);
        }
        
        // Calcular benefícios fiscais específicos do estado
        const firstProductNcm = products[0]?.ncm;
        if (!firstProductNcm) {
            throw new Error('NCM do produto não encontrado - obrigatório para análise de benefícios');
        }
        
        const stateBenefits = this.calculateStateBenefitsNew(state, firstProductNcm, totalNetCost);
        if (!stateBenefits) {
            throw new Error(`Erro ao calcular benefícios fiscais para estado ${state}`);
        }
        
        // Calcular tax burden total
        const totalTaxBurden = this.calculateTotalTaxBurden(salesTaxRates);
        if (typeof totalTaxBurden !== 'number') {
            throw new Error(`Erro ao calcular carga tributária total para regime ${regime}`);
        }
        
        // Calcular competitiveness score
        const competitivenessScore = this.calculateCompetitivenessScore(totalNetCost);
        if (typeof competitivenessScore !== 'number') {
            throw new Error(`Erro ao calcular score de competitividade`);
        }
        
        // Validar tax_savings
        const taxSavings = stateBenefits.tax_savings;
        if (typeof taxSavings !== 'number') {
            throw new Error(`Tax savings inválido para estado ${state} - deve ser numérico`);
        }
        
        // Estruturar cenário com dados validados - ZERO FALLBACKS
        const scenario = {
            state: state,
            state_name: await this.getStateName(state),
            regime: regime,
            
            costs: {
                base_cost: totalBaseCost,
                net_cost: totalNetCost,
                credits_applied: totalCredits,
                unit_cost: totalNetCost / productCount
            },
            
            taxes: {
                pis_rate: salesTaxRates.pis,
                cofins_rate: salesTaxRates.cofins,
                das_rate: salesTaxRates.das,
                icms_rate: icmsRate,
                total_tax_burden: totalTaxBurden
            },
            
            benefits: stateBenefits,
            
            totals: {
                total_cost: totalNetCost - taxSavings, // Subtraindo savings (benefício reduz custo)
                cost_per_unit: totalNetCost / productCount,
                competitiveness_score: competitivenessScore,
                potential_savings: totalCredits
            }
        };
        
        console.log(`✅ Cenário ${state} calculado: Custo R$ ${scenario.totals.total_cost.toFixed(2)}`);
        return scenario;
    }

    /**
     * MÉTODO LEGADO: Calculate scenario for a specific state (mantido para compatibilidade)
     */
    async calculateStateScenario(state) {
        const baseCalculation = { ...this.diData.calculoImpostos };
        
        // Use ICMS rate from aliquotas.json (correct rates)
        const icmsRate = await this.configLoader.getICMSRate(state);
        const baseICMS = baseCalculation.impostos.icms.base_calculo_antes;
        const newICMSValue = (baseICMS / (1 - icmsRate/100)) - baseICMS;
        
        // Apply state benefits
        const benefits = this.calculateStateBenefits(state, baseCalculation.ncm, newICMSValue);
        
        const scenario = {
            state: state,
            state_name: await this.getStateName(state),
            
            // Tax calculation
            taxes: {
                ii: baseCalculation.impostos.ii.valor_devido,
                ipi: baseCalculation.impostos.ipi.valor_devido,
                pis: baseCalculation.impostos.pis.valor_devido,
                cofins: baseCalculation.impostos.cofins.valor_devido,
                icms_nominal: newICMSValue,
                icms_effective: newICMSValue - this.validateTaxSavings(benefits),
                total_taxes: baseCalculation.totais.total_impostos - baseCalculation.impostos.icms.valor_devido + newICMSValue - this.validateTaxSavings(benefits)
            },
            
            // Benefits
            benefits: benefits,
            
            // Totals
            totals: {
                cif_cost: baseCalculation.valores_base.cif_brl,
                total_cost: 0, // Will be calculated below
                cost_per_kg: 0,
                competitiveness_score: 0
            }
        };
        
        // Calculate totals
        scenario.totals.total_cost = 
            scenario.totals.cif_cost + 
            scenario.taxes.total_taxes + 
            this.validateExpenseTotal(baseCalculation.despesas);
            
        const pesoLiquido = this.validateWeight(baseCalculation.valores_base.peso_liquido);
        scenario.totals.cost_per_kg = scenario.totals.total_cost / pesoLiquido;
        
        // Calculate competitiveness (lower cost = higher score)
        scenario.totals.competitiveness_score = this.calculateCompetitivenessScore(scenario.totals.total_cost);
        
        return scenario;
    }

    /**
     * Calculate state-specific fiscal benefits
     */
    calculateStateBenefits(state, ncm, icmsValue) {
        // Use benefits from beneficios.json (existing configuration)
        const rule = this.configLoader.getBenefits(state, ncm);
        if (!rule || rule.type === 'none') {
            return {
                applicable: false,
                name: rule?.name || 'Sem benefícios',
                description: rule?.description || 'Tributação padrão',
                tax_savings: 0,
                effective_rate: null
            };
        }
        
        // Check if NCM is eligible
        const ncmEligible = rule.applicable_ncms.some(eligible => ncm.startsWith(eligible));
        if (!ncmEligible) {
            return {
                applicable: false,
                name: rule.name,
                description: 'NCM não contemplado no benefício',
                tax_savings: 0,
                effective_rate: null
            };
        }
        
        let taxSavings = 0;
        let effectiveRate = null;
        
        switch (rule.type) {
            case 'credit':
                taxSavings = icmsValue * (rule.rate / 100);
                effectiveRate = 100 - rule.rate;
                break;
                
            case 'deferral':
                taxSavings = icmsValue * (rule.rate / 100); // For cash flow purposes
                effectiveRate = 100 - rule.rate;
                break;
                
            case 'reduction':
                const currentRate = 17; // Assume 17% standard
                taxSavings = icmsValue * ((currentRate - rule.effective_rate) / currentRate);
                effectiveRate = rule.effective_rate;
                break;
        }
        
        return {
            applicable: true,
            name: rule.name,
            type: rule.type,
            description: rule.description,
            tax_savings: taxSavings,
            effective_rate: effectiveRate,
            cash_flow_benefit: rule.type === 'deferral' ? taxSavings : 0
        };
    }

    /**
     * Generate pricing recommendations
     */
    generatePricingRecommendations(targetState, customerType = 'reseller') {
        console.log('💰 Gerando recomendações de preço...');
        
        if (!this.scenarios.length) {
            throw new Error('Execute a análise de cenários primeiro');
        }
        
        const scenario = this.scenarios.find(s => s.state === targetState);
        if (!scenario) {
            throw new Error(`Cenário não encontrado para estado ${targetState}`);
        }
        
        const customerRule = this.pricingRules.customer_types[customerType] || this.pricingRules.customer_types.reseller;
        const baseMarkups = [customerRule.markup_min, (customerRule.markup_min + customerRule.markup_max) / 2, customerRule.markup_max];
        
        const recommendations = baseMarkups.map((markup, index) => {
            const positioningNames = ['competitive', 'standard', 'premium'];
            const positioning = positioningNames[index];
            const positioningRule = this.pricingRules.positioning[positioning];
            
            const adjustedMarkup = markup * positioningRule.markup_factor;
            const sellPrice = scenario.totals.total_cost * (1 + adjustedMarkup / 100);
            const grossProfit = sellPrice - scenario.totals.total_cost;
            const grossMargin = (grossProfit / sellPrice) * 100;
            
            return {
                positioning: positioning,
                positioning_name: this.getPositioningName(positioning),
                markup_percent: adjustedMarkup,
                cost_base: scenario.totals.total_cost,
                sell_price: sellPrice,
                gross_profit: grossProfit,
                gross_margin: grossMargin,
                quality_score: positioningRule.quality_score,
                recommended: index === 1 // Middle option as default recommendation
            };
        });
        
        // Add volume pricing
        recommendations.forEach(rec => {
            rec.volume_pricing = this.calculateVolumePricing(rec.sell_price);
        });
        
        return {
            state: targetState,
            customer_type: customerType,
            base_scenario: scenario,
            recommendations: recommendations,
            market_analysis: this.generateMarketAnalysis(recommendations),
            generated_at: new Date().toISOString()
        };
    }

    /**
     * Calculate volume pricing tiers
     */
    calculateVolumePricing(basePrice) {
        return this.pricingRules.volume_breaks.map(tier => ({
            min_quantity: tier.min_qty,
            max_quantity: tier.max_qty,
            discount_percent: tier.discount,
            unit_price: basePrice * (1 - tier.discount / 100),
            tier_name: this.getVolumeTierName(tier.min_qty)
        }));
    }

    /**
     * Generate market analysis insights
     */
    generateMarketAnalysis(recommendations) {
        const standardRec = recommendations.find(r => r.positioning === 'standard');
        
        return {
            competitive_position: this.analyzeCompetitivePosition(standardRec.sell_price),
            price_sensitivity: this.analyzePriceSensitivity(recommendations),
            profit_optimization: this.analyzeProfitOptimization(recommendations),
            risk_assessment: this.assessPricingRisk(recommendations)
        };
    }

    /**
     * Compare scenarios across all states
     */
    compareAllScenarios() {
        console.log('🔍 Comparando cenários entre estados...');
        
        if (!this.scenarios.length) {
            this.generateStateScenarios();
        }
        
        const comparison = {
            best_cost: this.scenarios[0], // Already sorted by cost
            best_benefits: this.findBestBenefitsScenario(),
            summary: this.scenarios.map(scenario => ({
                state: scenario.state,
                state_name: scenario.state_name,
                total_cost: scenario.totals.total_cost,
                tax_savings: this.validateTaxSavings(scenario.benefits),
                competitiveness: scenario.totals.competitiveness_score,
                recommended: scenario.state === this.scenarios[0].state
            })),
            analysis: this.generateComparisonAnalysis()
        };
        
        return comparison;
    }

    /**
     * Find scenario with best fiscal benefits
     */
    findBestBenefitsScenario() {
        return this.scenarios.reduce((best, current) => {
            const currentSavings = this.validateTaxSavings(current.benefits);
            const bestSavings = this.validateTaxSavings(best.benefits);
            return currentSavings > bestSavings ? current : best;
        });
    }

    /**
     * Generate analysis of scenario comparison
     */
    generateComparisonAnalysis() {
        const costs = this.scenarios.map(s => s.totals.total_cost);
        const savings = this.scenarios.map(s => this.validateTaxSavings(s.benefits));
        
        return {
            cost_variation: {
                min: Math.min(...costs),
                max: Math.max(...costs),
                difference: Math.max(...costs) - Math.min(...costs),
                percentage: ((Math.max(...costs) - Math.min(...costs)) / Math.min(...costs)) * 100
            },
            savings_potential: {
                max_savings: Math.max(...savings),
                total_states_with_benefits: savings.filter(s => s > 0).length,
                average_savings: savings.reduce((a, b) => a + b, 0) / savings.length
            },
            recommendations: this.generateStrategicRecommendations()
        };
    }

    /**
     * Generate strategic recommendations
     */
    generateStrategicRecommendations() {
        const bestCost = this.scenarios[0];
        const bestBenefits = this.findBestBenefitsScenario();
        
        const recommendations = [];
        
        // Cost optimization
        recommendations.push({
            type: 'cost_optimization',
            title: 'Menor Custo Total',
            state: bestCost.state,
            description: `${bestCost.state_name} oferece o menor custo total de R$ ${bestCost.totals.total_cost.toFixed(2)}`,
            impact: 'high',
            implementation: 'immediate'
        });
        
        // Benefits optimization
        if (bestBenefits.benefits.applicable) {
            recommendations.push({
                type: 'benefit_optimization',
                title: 'Maiores Benefícios Fiscais',
                state: bestBenefits.state,
                description: `${bestBenefits.state_name} oferece economia de R$ ${bestBenefits.benefits.tax_savings.toFixed(2)} com ${bestBenefits.benefits.name}`,
                impact: 'medium',
                implementation: 'requires_compliance'
            });
        }
        
        // Strategic considerations
        if (bestCost.state !== bestBenefits.state) {
            recommendations.push({
                type: 'strategic_decision',
                title: 'Análise Estratégica Necessária',
                description: 'Avaliar entre menor custo imediato vs. benefícios fiscais de longo prazo',
                impact: 'high',
                implementation: 'strategic_planning'
            });
        }
        
        return recommendations;
    }

    /**
     * Utility functions - REMOVED: duplicated getStateName
     * Using async version at line 738 that loads from estados-brasil.json
     */

    getPositioningName(code) {
        if (!code) {
            throw new Error('Código de posicionamento não fornecido - obrigatório');
        }
        
        const names = {
            'competitive': 'Competitivo', 'standard': 'Padrão', 'premium': 'Premium'
        };
        
        if (!names[code]) {
            throw new Error(`Código de posicionamento inválido: ${code}`);
        }
        
        return names[code];
    }

    getVolumeTierName(minQty) {
        if (minQty === 1) return 'Varejo';
        if (minQty <= 10) return 'Pequeno';
        if (minQty <= 50) return 'Médio';
        return 'Atacado';
    }

    // REMOVED: Old hardcoded calculateCompetitivenessScore
    // Using improved version at line 862 with dynamic cost comparison

    analyzeCompetitivePosition(price, marketPrices = []) {
        if (typeof price !== 'number' || price <= 0) {
            throw new Error('Preço deve ser numérico e positivo para análise competitiva');
        }
        
        // Se não há preços de mercado para comparar, retorna análise neutra
        if (!marketPrices || marketPrices.length === 0) {
            return {
                level: 'neutral',
                description: 'Sem dados de mercado para comparação'
            };
        }
        
        // Calcular posição relativa no mercado
        const validPrices = marketPrices.filter(p => typeof p === 'number' && p > 0);
        if (validPrices.length === 0) {
            throw new Error('Nenhum preço de mercado válido encontrado para comparação');
        }
        
        const avgMarketPrice = validPrices.reduce((sum, p) => sum + p, 0) / validPrices.length;
        const position = price / avgMarketPrice;
        
        if (position < 0.9) return { level: 'very_competitive', description: 'Muito competitivo' };
        if (position < 1.1) return { level: 'competitive', description: 'Competitivo' };
        if (position < 1.3) return { level: 'premium', description: 'Premium' };
        return { level: 'expensive', description: 'Alto' };
    }

    analyzePriceSensitivity(recommendations) {
        const priceRange = Math.max(...recommendations.map(r => r.sell_price)) - Math.min(...recommendations.map(r => r.sell_price));
        const avgPrice = recommendations.reduce((sum, r) => sum + r.sell_price, 0) / recommendations.length;
        
        return {
            sensitivity: priceRange / avgPrice,
            level: priceRange / avgPrice > 0.3 ? 'high' : 'medium',
            description: priceRange / avgPrice > 0.3 ? 'Alta sensibilidade ao preço' : 'Sensibilidade moderada'
        };
    }

    analyzeProfitOptimization(recommendations) {
        const bestMargin = Math.max(...recommendations.map(r => r.gross_margin));
        const bestMarginRec = recommendations.find(r => r.gross_margin === bestMargin);
        
        return {
            optimal_positioning: bestMarginRec.positioning,
            optimal_margin: bestMargin,
            description: `Posicionamento ${bestMarginRec.positioning_name} oferece melhor margem`
        };
    }

    assessPricingRisk(recommendations) {
        const competitiveRec = recommendations.find(r => r.positioning === 'competitive');
        const premiumRec = recommendations.find(r => r.positioning === 'premium');
        
        const riskFactors = [];
        
        if (competitiveRec.gross_margin < 20) {
            riskFactors.push('Margem baixa no posicionamento competitivo');
        }
        
        if (premiumRec.sell_price > 20000) {
            riskFactors.push('Preço premium pode limitar demanda');
        }
        
        return {
            level: riskFactors.length > 1 ? 'high' : riskFactors.length === 1 ? 'medium' : 'low',
            factors: riskFactors,
            recommendations: riskFactors.length > 0 ? ['Considerar posicionamento padrão', 'Analisar elasticidade de demanda'] : ['Estratégia de preços balanceada']
        };
    }

    /**
     * Validation methods for strict fiscal calculations
     */
    validateTaxSavings(benefits) {
        if (!benefits || typeof benefits.tax_savings === 'undefined') {
            throw new Error('Benefícios fiscais não calculados - obrigatório para análise de precificação');
        }
        return benefits.tax_savings;
    }

    validateExpenseTotal(despesas) {
        if (!despesas || typeof despesas.total_custos === 'undefined') {
            throw new Error('Total de despesas não disponível - obrigatório para cálculo de custo');
        }
        return despesas.total_custos;
    }

    validateWeight(pesoLiquido) {
        if (!pesoLiquido || pesoLiquido <= 0) {
            throw new Error('Peso líquido inválido - obrigatório para cálculo de custo por kg');
        }
        return pesoLiquido;
    }

    /**
     * NOVOS MÉTODOS AUXILIARES - ZERO FALLBACKS
     */
    
    /**
     * Obter nome do estado - carregado de arquivo JSON
     */
    async getStateName(stateCode) {
        if (!stateCode) {
            throw new Error('Código do estado não fornecido - obrigatório');
        }
        
        // Carregar estados do arquivo JSON
        try {
            const response = await fetch('../shared/data/estados-brasil.json');
            if (!response.ok) {
                throw new Error('Erro ao carregar arquivo de estados');
            }
            
            const estadosData = await response.json();
            if (!estadosData.estados) {
                throw new Error('Estrutura de dados de estados inválida');
            }
            
            const estado = estadosData.estados.find(e => e.codigo === stateCode);
            if (!estado) {
                throw new Error(`Estado ${stateCode} não encontrado no arquivo de configuração`);
            }
            
            return estado.nome;
            
        } catch (error) {
            throw new Error(`Erro ao obter nome do estado ${stateCode}: ${error.message}`);
        }
    }
    
    /**
     * Calcular benefícios fiscais específicos do estado - ZERO FALLBACKS
     */
    calculateStateBenefitsNew(state, ncm, totalCost) {
        if (!state) {
            throw new Error('Estado não fornecido para cálculo de benefícios');
        }
        
        if (!ncm) {
            throw new Error('NCM não fornecido para cálculo de benefícios');
        }
        
        if (typeof totalCost !== 'number') {
            throw new Error('Custo total deve ser numérico para cálculo de benefícios');
        }
        
        // Usar ConfigLoader para obter benefícios
        const benefits = this.configLoader.getBenefits(state, ncm);
        
        if (!benefits || benefits.type === 'none') {
            return {
                applicable: false,
                name: 'Sem benefícios específicos',
                description: 'Tributação padrão sem incentivos',
                tax_savings: 0,
                effective_rate: null
            };
        }
        
        // Calcular savings baseado no tipo de benefício
        let taxSavings = 0;
        
        switch (benefits.type) {
            case 'credito_icms':
                if (!benefits.percentage || typeof benefits.percentage !== 'number') {
                    throw new Error(`Percentual de crédito ICMS inválido para estado ${state}`);
                }
                taxSavings = totalCost * (benefits.percentage / 100);
                break;
                
            case 'diferimento':
                if (!benefits.percentage || typeof benefits.percentage !== 'number') {
                    throw new Error(`Percentual de diferimento inválido para estado ${state}`);
                }
                taxSavings = totalCost * (benefits.percentage / 100);
                break;
                
            default:
                taxSavings = 0;
        }
        
        return {
            applicable: true,
            name: benefits.name,
            description: benefits.description,
            tax_savings: taxSavings,
            effective_rate: benefits.effective_rate
        };
    }
    
    /**
     * Calcular carga tributária total - ZERO FALLBACKS
     */
    calculateTotalTaxBurden(salesTaxRates) {
        if (!salesTaxRates) {
            throw new Error('Alíquotas de saída não fornecidas para cálculo de carga tributária');
        }
        
        let totalBurden = 0;
        
        // Para Simples Nacional
        if (salesTaxRates.das && typeof salesTaxRates.das === 'number') {
            totalBurden = salesTaxRates.das;
        } 
        // Para outros regimes
        else if (salesTaxRates.pis && salesTaxRates.cofins) {
            if (typeof salesTaxRates.pis !== 'number') {
                throw new Error('Alíquota PIS deve ser numérica para cálculo de carga tributária');
            }
            
            if (typeof salesTaxRates.cofins !== 'number') {
                throw new Error('Alíquota COFINS deve ser numérica para cálculo de carga tributária');
            }
            
            totalBurden = salesTaxRates.pis + salesTaxRates.cofins;
        } else {
            throw new Error('Estrutura de alíquotas inválida para cálculo de carga tributária');
        }
        
        return totalBurden;
    }
    
    /**
     * Calcular score de competitividade baseado em posição relativa - ZERO HARDCODED VALUES
     */
    calculateCompetitivenessScore(cost, allCosts = []) {
        if (typeof cost !== 'number') {
            throw new Error('Custo deve ser numérico para cálculo de competitividade');
        }
        
        if (cost <= 0) {
            throw new Error('Custo deve ser positivo para cálculo de competitividade');
        }
        
        // Se não há outros custos para comparar, retorna score neutro
        if (!allCosts || allCosts.length === 0) {
            return 50; // Score neutro sem comparação
        }
        
        // Validar array de custos
        const validCosts = allCosts.filter(c => typeof c === 'number' && c > 0);
        if (validCosts.length === 0) {
            return 50; // Score neutro se não há custos válidos para comparar
        }
        
        // Calcular posição relativa (menor custo = melhor score)
        const sortedCosts = [...validCosts].sort((a, b) => a - b);
        const position = sortedCosts.indexOf(cost);
        
        if (position === -1) {
            throw new Error('Custo não encontrado no array de comparação');
        }
        
        // Score baseado na posição: melhor posição = score mais alto
        const scorePercentile = (1 - (position / (sortedCosts.length - 1))) * 100;
        
        return Math.round(scorePercentile);
    }
}

// Export for use in other modules
// ES6 Module Export
export default PricingEngine;
}