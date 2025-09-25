/**
 * ItemCalculator.js - Módulo para Cálculos Individuais de Itens
 * 
 * Centraliza todos os cálculos por item individual para reutilização
 * entre módulos de compliance e precificação.
 * 
 * @author Sistema Expertzy
 * @version 2.0
 */


class ItemCalculator {
    constructor() {
        this.aliquotasCache = null;
        this.icmsConfig = {
            estado: null, // Estado vem do contexto
            aliquotaPadrao: null,
            ncmConfigs: {}
        };
    }

    /**
     * Carregar alíquotas do arquivo JSON
     */
    async carregarAliquotasICMS() {
        if (this.aliquotasCache) return this.aliquotasCache;
        
        try {
            const response = await fetch(new URL('../../shared/data/aliquotas.json', import.meta.url));
            this.aliquotasCache = await response.json();
            console.log('✅ ItemCalculator: Alíquotas ICMS carregadas');
            return this.aliquotasCache;
        } catch (error) {
            console.error('❌ ItemCalculator: Erro ao carregar alíquotas:', error);
            return null;
        }
    }

    /**
     * Obter alíquota ICMS para um NCM específico
     * @param {string} ncm - Código NCM
     * @returns {number} Alíquota ICMS aplicável
     */
    getAliquotaICMSParaNCM(ncm) {
        return this.icmsConfig.ncmConfigs[ncm] || this.icmsConfig.aliquotaPadrao;
    }

    /**
     * Atualizar configurações de ICMS
     * @param {object} config - Configurações {estado, aliquotaPadrao, ncmConfigs}
     */
    atualizarConfigICMS(config) {
        this.icmsConfig = { ...this.icmsConfig, ...config };
        console.log('✅ ItemCalculator: Configurações ICMS atualizadas:', this.icmsConfig);
    }

    /**
     * Calcular tributos individuais para um item específico
     * @param {number} valorItem - Valor individual do item em R$
     * @param {object} adicao - Dados da adição que contém o item
     * @returns {object} Tributos calculados individualmente
     */
    calcularTributosIndividuais(valorItem, adicao) {
        const tributos = {
            ii: { valor: 0, aliquota: 0 },
            ipi: { valor: 0, aliquota: 0 },
            pis: { valor: 0, aliquota: 0 },
            cofins: { valor: 0, aliquota: 0 }
        };
        
        // Obter alíquotas da adição (extraídas da DI)
        const aliqII = adicao.tributos?.ii_aliquota_ad_valorem;
        const aliqIPI = adicao.tributos?.ipi_aliquota_ad_valorem;
        const aliqPIS = adicao.tributos?.pis_aliquota_ad_valorem;
        const aliqCOFINS = adicao.tributos?.cofins_aliquota_ad_valorem;
        
        if (aliqII === undefined || aliqIPI === undefined || aliqPIS === undefined || aliqCOFINS === undefined) {
            throw new Error(`Alíquotas tributárias ausentes na adição ${adicao.numero_adicao}: II=${aliqII}, IPI=${aliqIPI}, PIS=${aliqPIS}, COFINS=${aliqCOFINS}`);
        }
        
        // === CÁLCULO INDIVIDUAL DOS TRIBUTOS ===
        
        // 1. II = Valor do Item × Alíquota II
        tributos.ii.valor = valorItem * (aliqII / 100);
        tributos.ii.aliquota = aliqII;
        
        // 2. IPI = (Valor do Item + II) × Alíquota IPI
        const baseIPI = valorItem + tributos.ii.valor;
        tributos.ipi.valor = baseIPI * (aliqIPI / 100);
        tributos.ipi.aliquota = aliqIPI;
        
        // 3. PIS = Valor do Item × Alíquota PIS
        tributos.pis.valor = valorItem * (aliqPIS / 100);
        tributos.pis.aliquota = aliqPIS;
        
        // 4. COFINS = Valor do Item × Alíquota COFINS
        tributos.cofins.valor = valorItem * (aliqCOFINS / 100);
        tributos.cofins.aliquota = aliqCOFINS;
        
        console.log(`📊 Tributos individuais calculados para item (R$ ${valorItem.toFixed(2)}):
        - II: ${aliqII}% = R$ ${tributos.ii.valor.toFixed(2)}
        - IPI: ${aliqIPI}% = R$ ${tributos.ipi.valor.toFixed(2)} (base: R$ ${baseIPI.toFixed(2)})
        - PIS: ${aliqPIS}% = R$ ${tributos.pis.valor.toFixed(2)}
        - COFINS: ${aliqCOFINS}% = R$ ${tributos.cofins.valor.toFixed(2)}`);
        
        return tributos;
    }

    /**
     * Calcular rateio de despesas específico para um item
     * @param {object} adicao - Dados da adição
     * @param {number} valorItem - Valor individual do item
     * @param {object} despesasAduaneiras - Despesas aduaneiras da DI
     * @param {array} despesasExtras - Despesas extras configuradas
     * @returns {object} Rateio de despesas para o item
     */
    calcularRateioItemPorValor(adicao, valorItem, despesasAduaneiras = null, despesasExtras = null) {
        const rateio = {
            aduaneiras: 0,
            extras: 0,
            total: 0
        };
        
        // Calcular proporção do item dentro da adição
        const valorTotalAdicao = adicao.valor_reais;
        if (!valorTotalAdicao || valorTotalAdicao === 0) {
            throw new Error(`Valor total da adição ${adicao.numero_adicao} é zero ou ausente: ${valorTotalAdicao}`);
        }
        
        const proporcaoItem = valorItem / valorTotalAdicao;
        
        // Rateio de despesas aduaneiras (proporcionalmente ao valor da adição na DI total)
        if (despesasAduaneiras?.total_despesas_aduaneiras) {
            // Primeiro calcular rateio da adição na DI total
            const valorTotalDI = this.calcularValorTotalDI();
            const proporcaoAdicaoNaDI = valorTotalDI > 0 ? valorTotalAdicao / valorTotalDI : 0;
            const despesasAdicao = despesasAduaneiras.total_despesas_aduaneiras * proporcaoAdicaoNaDI;
            
            // Depois ratear dentro da adição por valor do item
            rateio.aduaneiras = despesasAdicao * proporcaoItem;
        }
        
        // Rateio de despesas extras (proporcionalmente ao valor da adição na DI total)
        if (despesasExtras && Array.isArray(despesasExtras)) {
            const totalDespesasICMS = despesasExtras
                .filter(d => d.includeInICMS)
                .reduce((sum, d) => sum + d.value, 0);
            
            if (totalDespesasICMS > 0) {
                const valorTotalDI = this.calcularValorTotalDI();
                const proporcaoAdicaoNaDI = valorTotalDI > 0 ? valorTotalAdicao / valorTotalDI : 0;
                const despesasAdicao = totalDespesasICMS * proporcaoAdicaoNaDI;
                
                // Ratear dentro da adição por valor do item
                rateio.extras = despesasAdicao * proporcaoItem;
            }
        }
        
        rateio.total = rateio.aduaneiras + rateio.extras;
        
        console.log(`📊 ItemCalculator: Rateio despesas para item (R$ ${valorItem.toFixed(2)}) - Adição ${adicao.numero_adicao}:
        - Proporção na adição: ${(proporcaoItem * 100).toFixed(4)}%
        - Despesas aduaneiras: R$ ${rateio.aduaneiras.toFixed(2)}
        - Despesas extras: R$ ${rateio.extras.toFixed(2)}
        - Total item: R$ ${rateio.total.toFixed(2)}`);
        
        return rateio;
    }

    /**
     * Definir dados da DI para uso interno
     * @param {object} di - Dados da DI
     */
    setDIData(di) {
        this.diData = di;
        console.log('✅ ItemCalculator: DI data set for internal calculations');
    }

    /**
     * Calcular valor total da DI (helper para rateios)
     * @param {object} di - Dados completos da DI
     * @returns {number} Valor total da DI
     */
    calcularValorTotalDI(di = null) {
        // Usar DI passada, interna ou global (em ordem de prioridade)
        const diData = di || this.diData || window.currentDI;
        
        if (!diData) {
            console.warn('⚠️ ItemCalculator: Nenhuma DI encontrada para cálculo do valor total');
            return 0;
        }
        
        if (diData && diData.adicoes) {
            const total = diData.adicoes.reduce((total, adicao) => {
                return total + adicao.valor_reais;
            }, 0);
            console.log(`💰 ItemCalculator: Valor total da DI calculado: R$ ${total.toFixed(2)}`);
            return total;
        }
        
        console.warn('⚠️ ItemCalculator: DI sem adições para cálculo do valor total');
        return 0;
    }

    /**
     * Calcular base ICMS completa para um item individual
     * @param {number} valorItem - Valor individual do item
     * @param {object} adicao - Dados da adição
     * @param {object} despesasAduaneiras - Despesas aduaneiras da DI
     * @param {array} despesasExtras - Despesas extras configuradas
     * @param {string} ncm - Código NCM para alíquota específica
     * @returns {object} Cálculo completo do ICMS para o item
     */
    calcularBaseICMSItem(valorItem, adicao, despesasAduaneiras = null, despesasExtras = null, ncm = null) {
        // 1. Calcular tributos individuais
        const tributos = this.calcularTributosIndividuais(valorItem, adicao);
        
        // 2. Calcular rateio de despesas
        const rateio = this.calcularRateioItemPorValor(adicao, valorItem, despesasAduaneiras, despesasExtras);
        
        // 3. Somar tudo para base antes do ICMS
        const baseAntesICMS = valorItem + 
                             tributos.ii.valor + 
                             tributos.ipi.valor + 
                             tributos.pis.valor + 
                             tributos.cofins.valor + 
                             rateio.total;
        
        // 4. Obter alíquota ICMS (específica do NCM ou padrão)
        const aliquotaICMS = ncm ? this.getAliquotaICMSParaNCM(ncm) : this.icmsConfig.aliquotaPadrao;
        
        // 5. Aplicar fórmula "por dentro"
        const fatorDivisao = 1 - (aliquotaICMS / 100);
        const baseICMS = baseAntesICMS / fatorDivisao;
        const valorICMS = (baseICMS * aliquotaICMS) / 100;
        
        const resultado = {
            valorItem: valorItem,
            tributos: tributos,
            rateio: rateio,
            baseAntesICMS: baseAntesICMS,
            baseICMS: baseICMS,
            valorICMS: valorICMS,
            aliquotaICMS: aliquotaICMS,
            custoTotalItem: baseICMS
        };
        
        console.log(`📊 ItemCalculator: Base ICMS completa para item:
        - Valor base: R$ ${valorItem.toFixed(2)}
        - Tributos: R$ ${(tributos.ii.valor + tributos.ipi.valor + tributos.pis.valor + tributos.cofins.valor).toFixed(2)}
        - Despesas: R$ ${rateio.total.toFixed(2)}
        - Base ICMS: R$ ${baseICMS.toFixed(2)}
        - ICMS (${aliquotaICMS}%): R$ ${valorICMS.toFixed(2)}
        - Custo total: R$ ${resultado.custoTotalItem.toFixed(2)}`);
        
        return resultado;
    }

    /**
     * Validar se soma dos tributos individuais confere com total da adição
     * @param {object} adicao - Dados da adição
     * @param {array} itensCalculados - Array com tributos calculados por item
     * @returns {object} Resultado da validação
     */
    validarSomaTributos(adicao, itensCalculados) {
        const somasCalculadas = {
            ii: itensCalculados.reduce((sum, item) => sum + item.tributos.ii.valor, 0),
            ipi: itensCalculados.reduce((sum, item) => sum + item.tributos.ipi.valor, 0),
            pis: itensCalculados.reduce((sum, item) => sum + item.tributos.pis.valor, 0),
            cofins: itensCalculados.reduce((sum, item) => sum + item.tributos.cofins.valor, 0)
        };
        
        const totaisAdicao = {
            ii: adicao.tributos?.ii_valor_devido,
            ipi: adicao.tributos?.ipi_valor_devido,
            pis: adicao.tributos?.pis_valor_devido,
            cofins: adicao.tributos?.cofins_valor_devido
        };
        
        const validacao = {
            ok: true,
            diferencas: {},
            somasCalculadas: somasCalculadas,
            totaisAdicao: totaisAdicao
        };
        
        Object.keys(somasCalculadas).forEach(tributo => {
            const diferenca = Math.abs(somasCalculadas[tributo] - totaisAdicao[tributo]);
            
            // Tolerância proporcional: 0.1% do valor ou R$ 5,00 (o menor)
            const valorBase = Math.max(somasCalculadas[tributo], totaisAdicao[tributo]);
            const toleranciaPercentual = valorBase * 0.001; // 0.1%
            const toleranciaFixa = 5.00; // R$ 5,00
            const tolerancia = Math.min(toleranciaPercentual, toleranciaFixa);
            
            if (diferenca > tolerancia) {
                validacao.ok = false;
                validacao.diferencas[tributo] = {
                    calculado: somasCalculadas[tributo],
                    esperado: totaisAdicao[tributo],
                    diferenca: diferenca,
                    toleranciaAplicada: tolerancia
                };
            }
        });
        
        if (!validacao.ok) {
            console.warn(`⚠️ ItemCalculator: Validação de tributos falhou para adição ${adicao.numero_adicao}:`, validacao.diferencas);
        } else {
            console.log(`✅ ItemCalculator: Validação de tributos OK para adição ${adicao.numero_adicao}`);
        }
        
        return validacao;
    }

    /**
     * Processar todos os itens de uma adição com cálculos individuais
     * @param {object} adicao - Dados da adição
     * @param {object} despesasAduaneiras - Despesas aduaneiras da DI
     * @param {array} despesasExtras - Despesas extras configuradas
     * @returns {array} Array com todos os itens calculados
     */
    processarItensAdicao(adicao, despesasAduaneiras = null, despesasExtras = null) {
        const itensCalculados = [];
        
        // Obter lista de produtos da adição
        const produtosList = adicao.produtos || [];
        if (produtosList.length === 0) {
            // Se não há lista de produtos, criar um item único da adição
            produtosList.push({
                descricao_mercadoria: adicao.descricao_mercadoria,
                quantidade: adicao.quantidade_estatistica,
                valor_unitario: adicao.valor_unitario_brl || adicao.valor_unitario,
                valor_total: adicao.valor_reais
            });
        }
        
        produtosList.forEach((produto, index) => {
            const valorItem = produto.valor_total_brl || produto.valor_total || 
                             (produto.valor_unitario_brl || produto.valor_unitario) * produto.quantidade;
            
            const calculoCompleto = this.calcularBaseICMSItem(
                valorItem, 
                adicao, 
                despesasAduaneiras, 
                despesasExtras, 
                adicao.ncm
            );
            
            // Adicionar dados do produto
            calculoCompleto.produto = {
                indice: index + 1,
                descricao: produto.descricao_mercadoria || adicao.descricao_mercadoria,
                quantidade: produto.quantidade || adicao.quantidade_estatistica,
                valor_unitario: produto.valor_unitario_brl || produto.valor_unitario,
                ncm: adicao.ncm,
                peso_kg: adicao.peso_liquido // Peso total da adição (não temos peso individual)
            };
            
            itensCalculados.push(calculoCompleto);
        });
        
        // Validar soma dos tributos
        const validacao = this.validarSomaTributos(adicao, itensCalculados);
        
        return {
            itens: itensCalculados,
            validacao: validacao,
            resumoAdicao: {
                numero: adicao.numero_adicao,
                ncm: adicao.ncm,
                totalItens: itensCalculados.length,
                valorTotal: itensCalculados.reduce((sum, item) => sum + item.valorItem, 0),
                tributosTotal: itensCalculados.reduce((sum, item) => sum + 
                    item.tributos.ii.valor + item.tributos.ipi.valor + 
                    item.tributos.pis.valor + item.tributos.cofins.valor, 0),
                icmsTotal: itensCalculados.reduce((sum, item) => sum + item.valorICMS, 0),
                custoTotal: itensCalculados.reduce((sum, item) => sum + item.custoTotalItem, 0)
            }
        };
    }

    /**
     * Extrair NCMs únicos de uma DI
     * @param {object} di - Dados da DI processada
     * @returns {array} Array com NCMs únicos e seus dados
     */
    extrairNCMsUnicos(di) {
        if (!di || !di.adicoes) return [];
        
        const ncmsMap = new Map();
        
        di.adicoes.forEach(adicao => {
            const ncm = adicao.ncm;
            if (ncm && !ncmsMap.has(ncm)) {
                ncmsMap.set(ncm, {
                    ncm: ncm,
                    descricao: adicao.descricao_mercadoria || adicao.nome_ncm,
                    valor: adicao.valor_reais,
                    aliquotaII: adicao.tributos?.ii_aliquota_ad_valorem,
                    aliquotaIPI: adicao.tributos?.ipi_aliquota_ad_valorem
                });
            }
        });
        
        return Array.from(ncmsMap.values());
    }

    /**
     * Calcular custos de importação por item para uso em precificação
     * @param {object} di - DI processada completa
     * @param {object} despesasAduaneiras - Despesas aduaneiras
     * @param {array} despesasExtras - Despesas extras
     * @returns {object} Estrutura para módulo de precificação
     */
    async processarDIParaPrecificacao(di, despesasAduaneiras = null, despesasExtras = null) {
        const resultadoPrecificacao = {
            di_numero: di.numero_di,
            estado: this.icmsConfig.estado,
            timestamp: new Date().toISOString(),
            adicoes: [],
            resumo: {
                totalItens: 0,
                valorTotal: 0,
                custoTotal: 0,
                margemSugerida: 0.30 // 30% padrão
            }
        };
        
        // Processar cada adição
        di.adicoes.forEach(adicao => {
            const resultadoAdicao = this.processarItensAdicao(adicao, despesasAduaneiras, despesasExtras);
            
            resultadoPrecificacao.adicoes.push({
                numero: adicao.numero_adicao,
                ncm: adicao.ncm,
                itens: resultadoAdicao.itens.map(item => ({
                    produto: item.produto,
                    custoUnitario: item.custoTotalItem / item.produto.quantidade,
                    custoTotal: item.custoTotalItem,
                    margemMinima: 0.15, // 15% mínimo
                    margemSugerida: 0.30, // 30% sugerido
                    precoVendaSugerido: item.custoTotalItem * 1.30
                })),
                validacao: resultadoAdicao.validacao,
                resumo: resultadoAdicao.resumoAdicao
            });
            
            // Atualizar resumo geral
            resultadoPrecificacao.resumo.totalItens += resultadoAdicao.resumoAdicao.totalItens;
            resultadoPrecificacao.resumo.valorTotal += resultadoAdicao.resumoAdicao.valorTotal;
            resultadoPrecificacao.resumo.custoTotal += resultadoAdicao.resumoAdicao.custoTotal;
        });
        
        console.log('📊 ItemCalculator: DI processada para precificação:', resultadoPrecificacao);
        return resultadoPrecificacao;
    }
}

// Instância global do ItemCalculator
if (typeof window !== 'undefined') {
    window.ItemCalculator = ItemCalculator;
}

export { ItemCalculator };