/**
 * IncentiveManager - Gerenciador Central de Incentivos Fiscais
 * Sistema Expertzy - Importação e Precificação
 * 
 * PRINCÍPIOS APLICADOS:
 * - NO FALLBACKS: Todas as validações devem falhar explicitamente
 * - NO HARDCODED DATA: Todos os dados vêm de configurações externas
 * - KISS (Keep It Simple): Módulo único e centralizado
 * - DRY (Don't Repeat Yourself): Reutiliza configurações JSON
 * - Single Source of Truth: beneficios.json como única fonte de regras
 * - USER CHOICE: Usuário define o incentivo, sistema apenas valida e aplica
 * - SIMPLE VALIDATION: Valida apenas estado vs incentivo + NCMs restritos
 * 
 * @author Sistema Expertzy
 * @version 1.0.0 - Janeiro 2025
 * @description Gerencia aplicação de incentivos fiscais e prepara para reforma tributária
 */

class IncentiveManager {
    constructor() {
        this.beneficios = null;
        this.reformaConfig = null;
        this.ncmsVedados = null;
        this.loadedAt = null;
        
        // Inicializar PathResolver se disponível (compatibilidade universal)
        this.pathResolver = typeof PathResolver !== 'undefined' ? new PathResolver() : null;
        
        console.log('🎯 IncentiveManager v1.0: Inicializando sistema de incentivos fiscais');
        
        this.initializeConfiguration();
    }
    
    /**
     * Inicializa configurações dos benefícios e reforma tributária
     */
    async initializeConfiguration() {
        try {
            this.beneficios = await this.loadBeneficios();
            this.reformaConfig = await this.loadReformaConfig();
            this.ncmsVedados = await this.loadNCMsVedados();
            this.loadedAt = new Date();
            
            console.log('✅ Configurações carregadas:', {
                programas: Object.keys(this.beneficios.programas).length,
                anos_reforma: Object.keys(this.reformaConfig.cronograma).length,
                ncms_vedados: Object.keys(this.ncmsVedados.vedacoes_por_programa).length
            });
        } catch (error) {
            throw new Error(`Falha ao carregar configurações de incentivos: ${error.message}`);
        }
    }
    
    /**
     * Carrega configurações de benefícios do arquivo JSON
     */
    async loadBeneficios() {
        try {
            // Usar PathResolver se disponível, senão usar path direto
            const path = this.pathResolver ? 
                this.pathResolver.resolveDataPath('beneficios.json') : 
                '/src/shared/data/beneficios.json';
                
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            
            if (!data.programas) {
                throw new Error('Estrutura inválida em beneficios.json - campo programas ausente');
            }
            
            return data;
        } catch (error) {
            throw new Error(`Erro ao carregar beneficios.json: ${error.message}`);
        }
    }
    
    /**
     * Carrega configurações da reforma tributária
     */
    async loadReformaConfig() {
        try {
            // Usar PathResolver se disponível, senão usar path direto
            const path = this.pathResolver ? 
                this.pathResolver.resolveDataPath('reforma-tributaria.json') : 
                '/src/shared/data/reforma-tributaria.json';
                
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            
            if (!data.cronograma_tributario) {
                throw new Error('Estrutura inválida em reforma-tributaria.json - campo cronograma_tributario ausente');
            }
            
            return data;
        } catch (error) {
            throw new Error(`Erro ao carregar reforma-tributaria.json: ${error.message}`);
        }
    }
    
    /**
     * Carrega configurações de NCMs vedados do arquivo JSON centralizado
     */
    async loadNCMsVedados() {
        try {
            // Usar PathResolver se disponível, senão usar path direto
            const path = this.pathResolver ? 
                this.pathResolver.resolveDataPath('ncms-vedados.json') : 
                '/src/shared/data/ncms-vedados.json';
                
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            
            if (!data.vedacoes_por_programa || !data.mapeamento_programa_vedacao) {
                throw new Error('Estrutura inválida em ncms-vedados.json - campos obrigatórios ausentes');
            }
            
            return data;
        } catch (error) {
            throw new Error(`Erro ao carregar ncms-vedados.json: ${error.message}`);
        }
    }
    
    /**
     * Lista programas disponíveis para um estado específico
     * @param {string} estado - UF do importador (SC, MG, ES, etc.)
     * @returns {Array} - Lista de programas disponíveis
     */
    getAvailablePrograms(estado) {
        if (!estado) {
            throw new Error('Estado do importador obrigatório para listar programas disponíveis');
        }
        
        if (!this.beneficios || !this.beneficios.programas) {
            throw new Error('Configurações de benefícios não carregadas');
        }
        
        const programasDisponiveis = [];
        
        for (const [codigo, config] of Object.entries(this.beneficios.programas)) {
            if (!config.requisitos || !config.requisitos.estados_elegiveis) {
                throw new Error(`Requisitos não configurados para programa ${codigo}`);
            }
            
            if (config.requisitos.estados_elegiveis.includes(estado)) {
                programasDisponiveis.push({
                    codigo: codigo,
                    nome: config.nome,
                    tipo: config.tipo,
                    descricao: config.descricao || config.nome
                });
            }
        }
        
        console.log(`📋 Programas disponíveis para ${estado}:`, programasDisponiveis.map(p => p.codigo));
        return programasDisponiveis;
    }
    
    /**
     * Valida elegibilidade simples: apenas estado vs programa + NCMs restritos
     * @param {string} estado - Estado do importador
     * @param {string} programa - Código do programa
     * @param {Array} ncms - Lista de NCMs a importar (opcional)
     * @returns {Object} - Resultado da validação
     */
    validateEligibility(estado, programa, ncms = []) {
        if (!estado) {
            throw new Error('Estado do importador obrigatório para validação');
        }
        
        if (!programa) {
            throw new Error('Programa de incentivo obrigatório para validação');
        }
        
        if (!this.beneficios || !this.beneficios.programas) {
            throw new Error('Configurações de benefícios não carregadas');
        }
        
        const config = this.beneficios.programas[programa];
        if (!config) {
            throw new Error(`Programa ${programa} não encontrado nas configurações`);
        }
        
        // Validação 1: Estado elegível para o programa
        if (!config.requisitos || !config.requisitos.estados_elegiveis) {
            throw new Error(`Estados elegíveis não configurados para programa ${programa}`);
        }
        
        if (!config.requisitos.estados_elegiveis.includes(estado)) {
            const programasDisponiveis = this.getAvailablePrograms(estado);
            return {
                elegivel: false,
                motivo: `Programa ${programa} não disponível para o estado ${estado}`,
                programas_disponiveis: programasDisponiveis
            };
        }
        
        // Validação 2: NCMs restritos (usando arquivo centralizado)
        const ncmsRestritos = this.validateNCMRestrictions(programa, ncms);
        if (ncmsRestritos.length > 0) {
            return {
                elegivel: false,
                motivo: 'NCMs restritos encontrados',
                ncms_restritos: ncmsRestritos,
                ncms_aceitos: ncms.filter(ncm => !ncmsRestritos.includes(ncm)),
                detalhes_vedacao: this.getVedacaoDetails(programa)
            };
        }
        
        return {
            elegivel: true,
            motivo: 'Programa elegível para o estado e NCMs',
            beneficios_estimados: this.calculateEstimatedBenefits(programa, config)
        };
    }
    
    /**
     * Valida restrições de NCM para o programa usando arquivo centralizado
     * @param {string} programa - Código do programa de incentivo
     * @param {Array} ncms - Lista de NCMs a validar
     * @returns {Array} - Lista de NCMs restritos encontrados
     */
    validateNCMRestrictions(programa, ncms) {
        if (!ncms || ncms.length === 0) {
            return []; // Sem NCMs para validar
        }
        
        if (!this.ncmsVedados) {
            throw new Error('Configuração de NCMs vedados não carregada');
        }
        
        // Buscar configuração de vedação para o programa
        const vedacaoKey = this.ncmsVedados.mapeamento_programa_vedacao[programa];
        if (!vedacaoKey) {
            console.log(`ℹ️ Programa ${programa} sem restrições de NCM configuradas`);
            return []; // Programa sem restrições
        }
        
        const vedacao = this.ncmsVedados.vedacoes_por_programa[vedacaoKey];
        if (!vedacao) {
            throw new Error(`Configuração de vedação ${vedacaoKey} não encontrada para programa ${programa}`);
        }
        
        console.log(`🔍 Validando ${ncms.length} NCMs contra restrições do programa ${programa} (${vedacao.nome})`);
        
        const ncmsRestritos = [];
        
        for (const ncm of ncms) {
            // Verificar lista negativa exata
            if (vedacao.lista_negativa && vedacao.lista_negativa.includes(ncm)) {
                ncmsRestritos.push(ncm);
                continue;
            }
            
            // Verificar padrões wildcard
            if (vedacao.padroes_wildcard && vedacao.padroes_wildcard.length > 0) {
                for (const padrao of vedacao.padroes_wildcard) {
                    const regex = new RegExp(padrao.replace('*', '.*'));
                    if (regex.test(ncm)) {
                        ncmsRestritos.push(ncm);
                        break;
                    }
                }
            }
        }
        
        const ncmsUnicos = [...new Set(ncmsRestritos)]; // Remove duplicatas
        
        if (ncmsUnicos.length > 0) {
            console.log(`❌ ${ncmsUnicos.length} NCMs restritos encontrados:`, ncmsUnicos);
        } else {
            console.log(`✅ Todos os ${ncms.length} NCMs são elegíveis para o programa ${programa}`);
        }
        
        return ncmsUnicos;
    }
    
    /**
     * Retorna detalhes da configuração de vedação para um programa
     * @param {string} programa - Código do programa
     * @returns {Object} - Detalhes da vedação
     */
    getVedacaoDetails(programa) {
        if (!this.ncmsVedados) {
            throw new Error('Configuração de NCMs vedados não carregada');
        }
        
        const vedacaoKey = this.ncmsVedados.mapeamento_programa_vedacao[programa];
        if (!vedacaoKey) {
            return { sem_restricoes: true };
        }
        
        const vedacao = this.ncmsVedados.vedacoes_por_programa[vedacaoKey];
        if (!vedacao) {
            throw new Error(`Configuração de vedação ${vedacaoKey} não encontrada`);
        }
        
        return {
            nome: vedacao.nome,
            base_legal: vedacao.base_legal,
            tipo_lista: vedacao.tipo_lista,
            total_ncms_vedados: vedacao.lista_negativa ? vedacao.lista_negativa.length : 0,
            total_padroes: vedacao.padroes_wildcard ? vedacao.padroes_wildcard.length : 0,
            observacoes: vedacao.observacoes
        };
    }
    
    /**
     * Calcula benefícios estimados para um programa
     */
    calculateEstimatedBenefits(programa, config) {
        if (!config.calculo_estimativa) {
            throw new Error(`Configuração de cálculo de estimativa não encontrada para ${programa}`);
        }
        
        const estimativa = config.calculo_estimativa;
        const valorBase = estimativa.valor_base;
        const aliquotaBase = estimativa.aliquota_base;
        
        if (!valorBase || !aliquotaBase) {
            throw new Error(`Parâmetros de estimativa incompletos para ${programa}`);
        }
        
        switch (config.tipo) {
            case 'diferimento_parcial':
                if (!config.fases || !config.fases[0] || config.fases[0].aliquota_antecipacao === undefined) {
                    throw new Error('Configuração de fases não encontrada para diferimento parcial');
                }
                const fase1 = config.fases[0];
                const economia = valorBase * aliquotaBase * (1 - fase1.aliquota_antecipacao);
                return {
                    tipo: 'Diferimento parcial',
                    economia_estimada: economia,
                    percentual_economia: ((economia / (valorBase * aliquotaBase)) * 100).toFixed(1)
                };
                
            case 'diferimento_total':
                return {
                    tipo: 'Diferimento total',
                    economia_estimada: valorBase * aliquotaBase,
                    percentual_economia: '100.0'
                };
                
            case 'credito_outorgado':
                if (config.credito === undefined) {
                    throw new Error('Percentual de crédito não configurado');
                }
                const aliquotaInterestadual = estimativa.aliquota_interestadual;
                if (!aliquotaInterestadual) {
                    throw new Error('Alíquota interestadual não configurada para estimativa');
                }
                const credito = valorBase * aliquotaInterestadual * config.credito;
                const contrapartidas = this.calculateCounterpartsValue(config, credito);
                return {
                    tipo: 'Crédito outorgado',
                    economia_estimada: credito - contrapartidas,
                    percentual_economia: (((credito - contrapartidas) / (valorBase * aliquotaInterestadual)) * 100).toFixed(1)
                };
                
            default:
                throw new Error(`Tipo de programa não suportado: ${config.tipo}`);
        }
    }
    
    /**
     * Calcula valor das contrapartidas
     */
    calculateCounterpartsValue(config, beneficio) {
        if (!config.contrapartidas || config.contrapartidas.length === 0) {
            return 0;
        }
        
        return config.contrapartidas.reduce((total, contrapartida) => {
            if (!contrapartida.percentual) {
                throw new Error('Percentual da contrapartida não configurado');
            }
            return total + (beneficio * contrapartida.percentual);
        }, 0);
    }
    
    /**
     * Calcula campos da NF com diferimento para CST 51
     * @param {Object} di - Dados da DI processada
     * @param {string} programa - Programa de incentivo aplicado
     * @returns {Object} - Campos calculados para a NF
     */
    calculateNFFields(di, programa) {
        if (!di) {
            throw new Error('Dados da DI obrigatórios para cálculo dos campos NF');
        }
        
        if (!programa) {
            return di; // Sem incentivo, retorna dados originais
        }
        
        if (!this.beneficios || !this.beneficios.programas) {
            throw new Error('Configurações de benefícios não carregadas');
        }
        
        const config = this.beneficios.programas[programa];
        if (!config) {
            throw new Error(`Configuração não encontrada para programa ${programa}`);
        }
        
        console.log(`📄 Calculando campos NF para programa: ${programa}`);
        
        // Verificar se programa tem configuração de NF
        if (!config.nf_config) {
            throw new Error(`Configuração de NF não encontrada para programa ${programa}`);
        }
        
        // Aplicar configuração específica por tipo
        return this.applyNFConfiguration(di, programa, config);
    }
    
    /**
     * Aplica configuração de NF baseada no tipo do programa
     */
    applyNFConfiguration(di, programa, config) {
        const nfConfig = config.nf_config;
        
        // Calcular valores base
        const subtotal = this.calculateSubtotal(di);
        const aliquotas = this.getAliquotasFromConfig(config);
        
        switch (config.tipo) {
            case 'diferimento_parcial':
                return this.calculateDiferimentoParcial(di, programa, config, subtotal, aliquotas);
            case 'diferimento_total':
                return this.calculateDiferimentoTotal(di, programa, config, subtotal, aliquotas);
            case 'credito_outorgado':
                return this.calculateCreditoOutorgado(di, programa, config, subtotal);
            default:
                throw new Error(`Tipo de programa não implementado: ${config.tipo}`);
        }
    }
    
    /**
     * Obtém alíquotas da configuração
     */
    getAliquotasFromConfig(config) {
        if (!config.aliquotas) {
            throw new Error('Alíquotas não configuradas no programa');
        }
        
        const aliquotas = config.aliquotas;
        if (!aliquotas.icms_escrituracao || !aliquotas.icms_calculo) {
            throw new Error('Alíquotas de ICMS incompletas na configuração');
        }
        
        return aliquotas;
    }
    
    /**
     * Calcula campos para diferimento parcial
     */
    calculateDiferimentoParcial(di, programa, config, subtotal, aliquotas) {
        // Base para escrituração (alíquota normal por dentro)
        const baseEscrituracao = subtotal / (1 - aliquotas.icms_escrituracao);
        
        // Base para cálculo do imposto devido (alíquota reduzida por dentro)
        const baseCalculo = subtotal / (1 - aliquotas.icms_calculo);
        
        // Determinar fase atual
        const faseAtual = this.getCurrentPhase(config);
        if (!faseAtual || faseAtual.aliquota_antecipacao === undefined) {
            throw new Error('Fase atual do programa não determinada ou alíquota ausente');
        }
        
        const vICMSOp = baseEscrituracao * aliquotas.icms_escrituracao;
        const vICMS = baseCalculo * faseAtual.aliquota_antecipacao;
        const vICMSDif = vICMSOp - vICMS;
        const pDif = (vICMSDif / vICMSOp) * 100;
        
        return {
            ...di,
            nf_fields: {
                cst: config.nf_config.cst,
                vBC: baseEscrituracao,
                pICMS: aliquotas.icms_escrituracao * 100,
                vICMSOp: vICMSOp,
                vICMS: vICMS,
                vICMSDif: vICMSDif,
                pDif: pDif,
                cBenef: config.nf_config.cBenef,
                observacao: `${config.nome} - Antecipação ${(faseAtual.aliquota_antecipacao * 100).toFixed(1)}%`
            },
            incentivo_aplicado: {
                programa: programa,
                fase: faseAtual.descricao,
                economia: vICMSDif
            }
        };
    }
    
    /**
     * Calcula campos para diferimento total
     */
    calculateDiferimentoTotal(di, programa, config, subtotal, aliquotas) {
        const base = subtotal / (1 - aliquotas.icms_escrituracao);
        const vICMSOp = base * aliquotas.icms_escrituracao;
        
        return {
            ...di,
            nf_fields: {
                cst: config.nf_config.cst,
                vBC: base,
                pICMS: aliquotas.icms_escrituracao * 100,
                vICMSOp: vICMSOp,
                vICMS: 0, // Diferimento total
                vICMSDif: vICMSOp,
                pDif: 100.00,
                cBenef: config.nf_config.cBenef || null,
                observacao: `${config.nome} - Diferimento total`
            },
            incentivo_aplicado: {
                programa: programa,
                tipo: 'Diferimento total',
                economia: vICMSOp
            }
        };
    }
    
    /**
     * Calcula campos para crédito outorgado
     */
    calculateCreditoOutorgado(di, programa, config, subtotal) {
        // COMEXPRODUZIR não altera a NF de entrada (crédito aplicado na saída)
        return {
            ...di,
            nf_fields: {
                observacao: `${config.nome} - Crédito aplicado na saída`
            },
            incentivo_aplicado: {
                programa: programa,
                tipo: 'Crédito outorgado na saída',
                credito_percentual: config.credito * 100,
                contrapartidas: config.contrapartidas
            }
        };
    }
    
    /**
     * Determina fase atual do programa
     */
    getCurrentPhase(config) {
        if (!config.fases || config.fases.length === 0) {
            throw new Error('Fases do programa não configuradas');
        }
        
        // Por simplicidade, retornar primeira fase
        // Em implementação real, seria baseado na data de início do benefício
        return config.fases[0];
    }
    
    /**
     * Calcula impacto dos incentivos nos custos dos produtos
     * @param {Array} produtos - Lista de produtos
     * @param {string} programa - Programa aplicado
     * @param {number} year - Ano para projeção (padrão: atual)
     * @returns {Array} - Produtos com custos ajustados
     */
    calculateCostImpact(produtos, programa, year = new Date().getFullYear()) {
        if (!produtos || !Array.isArray(produtos)) {
            throw new Error('Lista de produtos obrigatória para cálculo de impacto');
        }
        
        if (!programa) {
            console.log('ℹ️ Nenhum programa especificado, retornando custos originais');
            return produtos;
        }
        
        if (!this.beneficios || !this.beneficios.programas) {
            throw new Error('Configurações de benefícios não carregadas');
        }
        
        const config = this.beneficios.programas[programa];
        if (!config) {
            throw new Error(`Configuração não encontrada para programa ${programa}`);
        }
        
        console.log(`💰 Calculando impacto nos custos para ${produtos.length} produtos - Programa: ${programa}`);
        
        const benefitFactor = this.getBenefitFactor(programa, config, year);
        const reformImpact = this.getReformImpact(year);
        
        return produtos.map(produto => {
            const custoOriginal = produto.custo_produto_federal || produto.valor_unitario;
            if (custoOriginal === undefined) {
                throw new Error(`Custo do produto não encontrado: ${produto.codigo || 'produto sem código'}`);
            }
            
            const custoComIncentivo = custoOriginal * (1 - benefitFactor.reducao);
            const custoFuturoReforma = custoOriginal * reformImpact.multiplicador;
            
            return {
                ...produto,
                custo_original: custoOriginal,
                custo_com_incentivo: custoComIncentivo,
                economia_incentivo: custoOriginal - custoComIncentivo,
                percentual_economia: benefitFactor.reducao * 100,
                custo_futuro_reforma: custoFuturoReforma,
                impacto_reforma: {
                    ano: year,
                    fase: reformImpact.fase,
                    multiplicador: reformImpact.multiplicador
                },
                contrapartidas: this.calculateCounterparts(programa, config, custoOriginal - custoComIncentivo)
            };
        });
    }
    
    /**
     * Calcula fator de benefício para um programa e ano
     */
    getBenefitFactor(programa, config, year) {
        if (!this.beneficios.reforma_tributaria_nacional) {
            throw new Error('Configuração da reforma tributária nacional não encontrada');
        }
        
        const reformConfig = this.beneficios.reforma_tributaria_nacional;
        
        if (year <= 2028) {
            return { 
                reducao: this.getBaseBenefitReduction(programa, config), 
                mantido: 1.0 
            };
        }
        
        const yearConfig = reformConfig[year.toString()];
        if (yearConfig && yearConfig.mantido !== undefined) {
            const baseBenefit = this.getBaseBenefitReduction(programa, config);
            return {
                reducao: baseBenefit * yearConfig.mantido,
                mantido: yearConfig.mantido
            };
        }
        
        // Após 2032, benefícios extintos
        return { reducao: 0, mantido: 0 };
    }
    
    /**
     * Retorna redução base do benefício (sem reforma)
     */
    getBaseBenefitReduction(programa, config) {
        if (!config.reducao_base) {
            throw new Error(`Redução base não configurada para programa ${programa}`);
        }
        
        return config.reducao_base;
    }
    
    /**
     * Calcula contrapartidas específicas por programa
     */
    calculateCounterparts(programa, config, beneficio) {
        if (!config.contrapartidas || config.contrapartidas.length === 0) {
            return [];
        }
        
        return config.contrapartidas.map(contrapartida => {
            if (contrapartida.percentual === undefined) {
                throw new Error(`Percentual da contrapartida não configurado para ${programa}`);
            }
            
            const valor = beneficio * contrapartida.percentual;
            
            return {
                tipo: contrapartida.fundo || contrapartida.tipo,
                percentual: contrapartida.percentual * 100,
                valor: valor,
                descricao: `${contrapartida.fundo || contrapartida.tipo}: ${(contrapartida.percentual * 100).toFixed(1)}%`
            };
        });
    }
    
    /**
     * Projeta cenários da reforma tributária (2025-2033)
     * @param {number} startYear - Ano inicial para projeção
     * @returns {Array} - Cenários por ano
     */
    projectReformScenarios(startYear = 2025) {
        if (!this.reformaConfig || !this.reformaConfig.cronograma) {
            throw new Error('Configuração da reforma tributária não carregada');
        }
        
        const scenarios = [];
        const endYear = 2033;
        
        for (let year = startYear; year <= endYear; year++) {
            const yearConfig = this.reformaConfig.cronograma[year.toString()];
            
            if (!yearConfig) {
                throw new Error(`Configuração não encontrada para o ano ${year}`);
            }
            
            scenarios.push({
                ano: year,
                fase: yearConfig.fase,
                beneficios_icms_percentual: (yearConfig.beneficios_icms || 0) * 100,
                aliquota_futura: yearConfig.cbs_ibs || null,
                fundo_compensacao: this.reformaConfig.fundo_compensacao[year.toString()] || 0,
                mudancas_principais: this.getMainChanges(year, yearConfig),
                alerta: this.getYearAlert(year, yearConfig)
            });
        }
        
        console.log(`📊 Projeção da reforma gerada para ${scenarios.length} anos`);
        return scenarios;
    }
    
    /**
     * Retorna principais mudanças por ano
     */
    getMainChanges(year, config) {
        if (!this.reformaConfig.mudancas_por_fase) {
            throw new Error('Mudanças por fase não configuradas');
        }
        
        const mudancasFase = this.reformaConfig.mudancas_por_fase[config.fase];
        if (!mudancasFase) {
            throw new Error(`Mudanças não configuradas para fase: ${config.fase}`);
        }
        
        return mudancasFase;
    }
    
    /**
     * Gera alerta específico por ano
     */
    getYearAlert(year, config) {
        if (!this.reformaConfig.alertas_por_ano) {
            return null;
        }
        
        const alertConfig = this.reformaConfig.alertas_por_ano[year.toString()];
        if (!alertConfig) {
            return null;
        }
        
        return alertConfig.replace('{reducao}', ((1 - (config.beneficios_icms || 0)) * 100).toString());
    }
    
    /**
     * Retorna impacto da reforma para um ano específico
     */
    getReformImpact(year) {
        if (!this.reformaConfig || !this.reformaConfig.cronograma) {
            throw new Error('Configuração da reforma tributária não carregada');
        }
        
        const yearConfig = this.reformaConfig.cronograma[year.toString()];
        
        if (!yearConfig) {
            return { multiplicador: 1.0, fase: 'atual' };
        }
        
        if (!this.reformaConfig.multiplicadores_por_fase) {
            throw new Error('Multiplicadores por fase não configurados');
        }
        
        const multiplicador = this.reformaConfig.multiplicadores_por_fase[yearConfig.fase];
        if (multiplicador === undefined) {
            throw new Error(`Multiplicador não configurado para fase: ${yearConfig.fase}`);
        }
        
        return {
            multiplicador: multiplicador,
            fase: yearConfig.fase,
            descricao: yearConfig.descricao || 'Sem descrição'
        };
    }
    
    /**
     * Utilitários de cálculo
     */
    
    calculateSubtotal(di) {
        if (!di.adicoes || di.adicoes.length === 0) {
            throw new Error('Adições da DI não encontradas para cálculo do subtotal');
        }
        
        return di.adicoes.reduce((total, adicao) => {
            const valorAdicao = adicao.valor_aduaneiro;
            if (valorAdicao === undefined) {
                throw new Error(`Valor aduaneiro ausente na adição ${adicao.numero_adicao || 'sem número'}`);
            }
            
            const ii = adicao.tributos?.ii;
            const ipi = adicao.tributos?.ipi;
            const pis = adicao.tributos?.pis;
            const cofins = adicao.tributos?.cofins;
            
            if (ii === undefined || ipi === undefined || pis === undefined || cofins === undefined) {
                throw new Error(`Tributos incompletos na adição ${adicao.numero_adicao || 'sem número'}`);
            }
            
            return total + valorAdicao + ii + ipi + pis + cofins;
        }, 0);
    }
    
    /**
     * Limpa cache e recarrega configurações
     */
    async reload() {
        console.log('🔄 Recarregando configurações do IncentiveManager...');
        await this.initializeConfiguration();
        console.log('✅ Configurações recarregadas com sucesso');
    }
    
    /**
     * Retorna estatísticas do gerenciador
     */
    getStats() {
        if (!this.beneficios || !this.reformaConfig || !this.ncmsVedados) {
            throw new Error('Configurações não carregadas completamente');
        }
        
        return {
            version: '1.0.0',
            loaded_at: this.loadedAt,
            programas_disponiveis: Object.keys(this.beneficios.programas),
            anos_reforma: Object.keys(this.reformaConfig.cronograma),
            vedacoes_configuradas: Object.keys(this.ncmsVedados.vedacoes_por_programa),
            total_ncms_vedados: this.ncmsVedados.estatisticas?.total_ncms_unicos || 'N/A',
            reforma_tributaria_centralizada: !!this.beneficios.reforma_tributaria_nacional,
            status: 'active'
        };
    }
}

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IncentiveManager;
} else if (typeof window !== 'undefined') {
    window.IncentiveManager = IncentiveManager;
}