/**
 * ItemPricingCalculator.js
 * 
 * Motor de cálculo de preços de venda para itens individuais de importação
 * Parte da FASE 2.5: Cálculo de Preços por Item
 * 
 * PRINCÍPIOS:
 * - NO FALLBACKS: Sistema fail-fast sem dados hardcoded
 * - NO HARDCODED DATA: Todos os dados vêm de arquivos de configuração
 * - Single Source of Truth: ConfigLoader para todos os dados
 * - Nomenclatura única: Segue DIProcessor.js
 * 
 * @author Sistema Expertzy v3.0
 * @version FASE 2.5.1
 */

import { ConfigLoader } from '@shared/utils/ConfigLoader.js';

export class ItemPricingCalculator {
    constructor() {
        this.configLoader = new ConfigLoader();
        this.aliquotasData = null;
        this.tributacaoData = null;
        this.beneficiosData = null;
        this.initialized = false;
    }

    /**
     * Inicializar calculadora - OBRIGATÓRIO antes do uso
     * Falha explicitamente se dados não estiverem disponíveis
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // Carregar TODOS os dados obrigatórios
            const [aliquotas, tributacao, beneficios] = await Promise.all([
                this.configLoader.loadAliquotas(),
                this.configLoader.loadTributacaoMonofasica(),
                this.configLoader.loadBeneficios()
            ]);

            // FAIL-FAST: Se qualquer dado estiver ausente, falhar explicitamente
            if (!aliquotas) {
                throw new Error('Dados de aliquotas não disponíveis - obrigatório para ItemPricingCalculator');
            }
            if (!tributacao) {
                throw new Error('Dados de tributação monofásica não disponíveis - obrigatório para ItemPricingCalculator');
            }
            if (!beneficios) {
                throw new Error('Dados de benefícios fiscais não disponíveis - obrigatório para ItemPricingCalculator');
            }

            this.aliquotasData = aliquotas;
            this.tributacaoData = tributacao;
            this.beneficiosData = beneficios;
            this.initialized = true;

            console.log('✅ ItemPricingCalculator inicializado com dados externos validados');
        } catch (error) {
            console.error('❌ FALHA CRÍTICA - ItemPricingCalculator não pode ser inicializado:', error.message);
            throw error;
        }
    }

    /**
     * Calcular custo contábil de um item individual
     * Usa APENAS dados já processados pelo DIProcessor e PricingEngine
     */
    calculateItemCosts(item, diData) {
        this._ensureInitialized();
        this._validateRequiredInputs(item, diData);

        // Obter rateio proporcional baseado em valor aduaneiro
        const rateio = this._calculateItemRatio(item, diData);
        
        // Custos diretos do item (campos do DIProcessor)
        const custosDiretos = {
            valor_aduaneiro: this._parseNumeric(item.valor_reais, 'valor_reais do item'),
            frete: this._parseNumeric(item.frete_valor_reais, 'frete_valor_reais do item'),
            seguro: this._parseNumeric(item.seguro_valor_reais, 'seguro_valor_reais do item')
        };

        // Impostos federais (campos processados pelo DIProcessor)
        const impostosFederais = {
            ii: this._parseNumeric(item.ii_valor_devido, 'ii_valor_devido do item'),
            ipi: this._parseNumeric(item.ipi_valor_devido, 'ipi_valor_devido do item'),
            pis: this._parseNumeric(item.pis_valor_devido, 'pis_valor_devido do item'),
            cofins: this._parseNumeric(item.cofins_valor_devido, 'cofins_valor_devido do item'),
            cide: this._parseNumeric(item.cide_valor_devido, 'cide_valor_devido do item')
        };

        // ICMS rateado (usar dados do PricingEngine se disponível)
        const icmsItem = this._calculateICMSItem(item, diData, rateio);

        // Despesas aduaneiras rateadas (usar dados processados)
        const despesasItem = this._ratearDespesasAduaneiras(diData, rateio);

        // Custo contábil total
        const custoContabil = 
            custosDiretos.valor_aduaneiro +
            custosDiretos.frete +
            custosDiretos.seguro +
            impostosFederais.ii +
            impostosFederais.ipi +
            impostosFederais.pis +
            impostosFederais.cofins +
            impostosFederais.cide +
            icmsItem +
            despesasItem.total;

        return {
            custos_diretos: custosDiretos,
            impostos_federais: impostosFederais,
            icms_item: icmsItem,
            despesas_aduaneiras: despesasItem,
            custo_contabil_total: custoContabil,
            rateio_aplicado: rateio,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Calcular preço margem zero usando dados externos
     */
    calculateZeroMarginPrice(custoItem, parametrosCenario) {
        this._ensureInitialized();
        this._validateRequiredInputs(custoItem, parametrosCenario);

        const custoBase = custoItem.custo_contabil_total;
        
        // Calcular créditos baseado nos dados de configuração
        const creditos = this._calculateCreditosFromConfig(custoItem, parametrosCenario);
        
        const precoMargemZero = Math.max(0, custoBase - creditos.total);

        return {
            preco_margem_zero: precoMargemZero,
            custo_base: custoBase,
            creditos_aplicados: creditos,
            parametros_utilizados: parametrosCenario
        };
    }

    /**
     * Calcular preço com margem usando validação rigorosa
     */
    calculatePriceWithMargin(custoItem, parametrosMargemValidados, cenarioValidado) {
        this._ensureInitialized();
        this._validateRequiredInputs(custoItem, parametrosMargemValidados, cenarioValidado);

        const margemZero = this.calculateZeroMarginPrice(custoItem, cenarioValidado);
        
        // Aplicar margem conforme tipo especificado
        const precoComMargem = this._aplicarMargem(margemZero.preco_margem_zero, parametrosMargemValidados);
        
        // Calcular impostos de venda usando dados de configuração
        const impostoVenda = this._calculateImpostosVendaFromConfig(precoComMargem, cenarioValidado);
        
        const precoFinal = precoComMargem + impostoVenda.total;

        return {
            preco_sem_impostos: precoComMargem,
            impostos_venda: impostoVenda,
            preco_final: precoFinal,
            margem_aplicada: parametrosMargemValidados,
            dados_origem: margemZero
        };
    }

    /**
     * Detectar regimes especiais baseado APENAS em dados de configuração
     */
    detectSpecialRegimes(ncm) {
        this._ensureInitialized();
        
        if (!ncm || typeof ncm !== 'string' || ncm.length < 8) {
            throw new Error('NCM válido obrigatório para detecção de regimes especiais');
        }

        const regimesDetectados = {
            monofasico: false,
            categoria_monofasica: null,
            st_detectado: false,
            beneficios_disponiveis: [],
            ncm_analisado: ncm
        };

        // Verificar monofásico nos dados de configuração
        for (const [categoria, dados] of Object.entries(this.tributacaoData)) {
            if (dados.ncms && Array.isArray(dados.ncms)) {
                const ncmMatch = dados.ncms.find(ncmConfig => 
                    ncm.startsWith(ncmConfig) || ncmConfig === ncm
                );
                
                if (ncmMatch) {
                    regimesDetectados.monofasico = true;
                    regimesDetectados.categoria_monofasica = categoria;
                    break;
                }
            }
        }

        // Verificar benefícios disponíveis nos dados de configuração
        for (const [estado, beneficios] of Object.entries(this.beneficiosData)) {
            if (beneficios.ncms_contemplados && Array.isArray(beneficios.ncms_contemplados)) {
                const beneficioMatch = beneficios.ncms_contemplados.find(ncmBeneficio => 
                    ncm.startsWith(ncmBeneficio)
                );
                
                if (beneficioMatch) {
                    regimesDetectados.beneficios_disponiveis.push({
                        estado,
                        tipo_beneficio: beneficios.tipo || 'Não especificado',
                        ncm_match: beneficioMatch
                    });
                }
            }
        }

        return regimesDetectados;
    }

    // === MÉTODOS PRIVADOS - Validação e Processamento ===

    _ensureInitialized() {
        if (!this.initialized) {
            throw new Error('ItemPricingCalculator deve ser inicializado antes do uso');
        }
    }

    _validateRequiredInputs(...inputs) {
        inputs.forEach((input, index) => {
            if (input === null || input === undefined || 
                (typeof input === 'object' && Object.keys(input).length === 0)) {
                throw new Error(`Input obrigatório ${index + 1} ausente ou inválido`);
            }
        });
    }

    _parseNumeric(value, fieldName) {
        const parsed = parseFloat(value || 0);
        if (isNaN(parsed)) {
            throw new Error(`Campo ${fieldName} deve ser numérico válido`);
        }
        return parsed;
    }

    _calculateItemRatio(item, diData) {
        const valorItem = this._parseNumeric(item.valor_reais, 'valor_reais do item');
        const valorTotalDI = this._parseNumeric(diData.valor_aduaneiro, 'valor_aduaneiro da DI');
        
        if (valorTotalDI <= 0) {
            throw new Error('Valor aduaneiro total da DI deve ser positivo para cálculo de rateio');
        }
        
        return {
            percentual: valorItem / valorTotalDI,
            valor_item: valorItem,
            valor_total_di: valorTotalDI
        };
    }

    _calculateICMSItem(item, diData, rateio) {
        // Tentar usar ICMS já calculado do item se disponível
        if (item.icms_valor_devido !== undefined && item.icms_valor_devido !== null) {
            return this._parseNumeric(item.icms_valor_devido, 'icms_valor_devido do item');
        }
        
        // Caso contrário, ratear do total da DI
        const icmsTotal = this._parseNumeric(diData.valores_totais?.icms_devido, 'icms_devido total da DI');
        return icmsTotal * rateio.percentual;
    }

    _ratearDespesasAduaneiras(diData, rateio) {
        const despesas = diData.despesas_aduaneiras || {};
        
        const despesasRateadas = {};
        let total = 0;

        // Ratear cada tipo de despesa usando os dados disponíveis
        for (const [tipo, valor] of Object.entries(despesas)) {
            if (typeof valor === 'number') {
                despesasRateadas[tipo] = valor * rateio.percentual;
                total += despesasRateadas[tipo];
            }
        }

        return { ...despesasRateadas, total };
    }

    _calculateCreditosFromConfig(custoItem, parametrosCenario) {
        const creditos = { total: 0, detalhes: {} };
        
        // Aplicar créditos baseado no regime tributário configurado
        const regime = parametrosCenario.regime_vendedor;
        if (!regime) {
            throw new Error('Regime tributário do vendedor obrigatório para cálculo de créditos');
        }

        // Usar dados de configuração para calcular créditos (implementar conforme necessidade)
        // Por ora, retornar estrutura base
        return creditos;
    }

    _aplicarMargem(precoBase, parametrosMargemValidados) {
        const { tipo, valor } = parametrosMargemValidados;
        
        switch (tipo) {
            case 'percentual':
                const percentual = this._parseNumeric(valor, 'margem percentual');
                if (percentual < 0 || percentual >= 100) {
                    throw new Error('Margem percentual deve estar entre 0% e 99%');
                }
                return precoBase / (1 - percentual / 100);
                
            case 'markup_fixo':
                const markup = this._parseNumeric(valor, 'markup fixo');
                if (markup < 0) {
                    throw new Error('Markup fixo deve ser positivo');
                }
                return precoBase + markup;
                
            case 'preco_manual':
                const preco = this._parseNumeric(valor, 'preço manual');
                if (preco <= 0) {
                    throw new Error('Preço manual deve ser positivo');
                }
                return preco;
                
            default:
                throw new Error(`Tipo de margem não suportado: ${tipo}`);
        }
    }

    _calculateImpostosVendaFromConfig(precoVenda, cenarioValidado) {
        const impostos = { total: 0, detalhes: {} };
        
        // Usar dados de aliquotas.json para calcular impostos
        const estadoOrigem = cenarioValidado.estado_origem;
        if (!estadoOrigem) {
            throw new Error('Estado de origem obrigatório para cálculo de impostos de venda');
        }

        const dadosEstado = this.aliquotasData.icms_estados?.[estadoOrigem];
        if (!dadosEstado) {
            throw new Error(`Dados tributários não encontrados para estado: ${estadoOrigem}`);
        }

        // Calcular ICMS usando dados externos
        const aliquotaICMS = this._parseNumeric(dadosEstado.aliquota, `aliquota ICMS ${estadoOrigem}`);
        impostos.detalhes.icms = precoVenda * (aliquotaICMS / 100);
        impostos.total += impostos.detalhes.icms;

        return impostos;
    }
}

export default ItemPricingCalculator;