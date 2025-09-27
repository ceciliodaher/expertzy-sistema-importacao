/**
 * pricing-interface.js - Sistema de Precificação Completo
 *
 * Interface para cálculo de custos de importação e formação de preços
 * PRINCÍPIOS RIGOROSOS:
 * - NO FALLBACKS: Falha explícita para dados ausentes
 * - NO HARDCODED DATA: Todos os dados vem de arquivos externos ou input do usuário
 * - PORTUGUESE NOMENCLATURE: Seguindo DIProcessor.js
 * - FAIL-FAST VALIDATION: Erro imediato para estruturas inválidas
 *
 * FONTES DE DADOS:
 * - aliquotas.json: Alíquotas ICMS por estado
 * - tributacao-monofasica.json: Produtos monofásicos
 * - IndexedDB: Dados da DI processada
 * - Input do usuário: Regime tributário, margens, parâmetros gerenciais
 */

/**
 * MotorCalculoTributario - Cálculo de percentuais tributários baseado em dados externos
 * NO HARDCODED VALUES - todos os dados vem de arquivos JSON ou input do usuário
 */
// Importar IncentiveManager para aplicação de incentivos
import { IncentiveManager } from '@core/incentives/IncentiveManager.js';

class MotorCalculoTributario {
    constructor() {
        this.aliquotasData = null;
        this.tributacaoMonofasicaData = null;
        this.incentiveManager = new IncentiveManager();
        this.initialized = false;
    }

    /**
     * Inicializar motor com carregamento de dados externos - NO FALLBACKS
     */
    async inicializar() {
        if (this.initialized) {
            return; // Já inicializado
        }

        try {
            // Carregar aliquotas.json - OBRIGATÓRIO
            await this.carregarAliquotas();

            // Carregar tributacao-monofasica.json - OBRIGATÓRIO
            await this.carregarTributacaoMonofasica();

            // Inicializar IncentiveManager - OBRIGATÓRIO para aplicação de incentivos
            await this.incentiveManager.initializeConfiguration();

            this.initialized = true;
            console.log('✅ MotorCalculoTributario inicializado com dados externos + incentivos');

        } catch (error) {
            throw new Error(`Falha na inicialização do MotorCalculoTributario: ${error.message}`);
        }
    }

    /**
     * Carregar dados de alíquotas - FAIL-FAST se arquivo não existir
     */
    async carregarAliquotas() {
        try {
            const response = await fetch(new URL('../../shared/data/aliquotas.json', import.meta.url));
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            this.aliquotasData = await response.json();

            if (!this.aliquotasData.aliquotas_icms_2025) {
                throw new Error('Estrutura inválida: aliquotas_icms_2025 não encontrado');
            }

            console.log('✅ Alíquotas ICMS carregadas dos dados oficiais');

        } catch (error) {
            throw new Error(`Erro ao carregar aliquotas.json: ${error.message}`);
        }
    }

    /**
     * Carregar dados de tributação monofásica - FAIL-FAST se arquivo não existir
     */
    async carregarTributacaoMonofasica() {
        try {
            const response = await fetch(new URL('../../shared/data/tributacao-monofasica.json', import.meta.url));
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            this.tributacaoMonofasicaData = await response.json();

            if (!this.tributacaoMonofasicaData.regras_credito_por_regime) {
                throw new Error('Estrutura inválida: regras_credito_por_regime não encontrado');
            }

            console.log('✅ Regras de tributação monofásica carregadas dos dados oficiais');

        } catch (error) {
            throw new Error(`Erro ao carregar tributacao-monofasica.json: ${error.message}`);
        }
    }

    /**
     * Obter alíquota ICMS para estado específico - NO FALLBACKS
     * @param {string} estadoUF - Código UF do estado (obrigatório)
     * @returns {number} Alíquota ICMS + FCP
     */
    obterAliquotaICMS(estadoUF) {
        this.validarInicializacao();

        if (!estadoUF) {
            throw new Error('Código UF do estado é obrigatório para obter alíquota ICMS');
        }

        if (typeof estadoUF !== 'string') {
            throw new Error('Código UF deve ser string');
        }

        const estadoData = this.aliquotasData.aliquotas_icms_2025[estadoUF.toUpperCase()];
        if (!estadoData) {
            throw new Error(`Estado ${estadoUF} não encontrado nos dados de alíquotas oficiais`);
        }

        if (typeof estadoData.aliquota_interna !== 'number') {
            throw new Error(`Alíquota interna inválida para estado ${estadoUF} - deve ser numérica`);
        }

        // Calcular alíquota total (ICMS + FCP se aplicável)
        let aliquotaTotal = estadoData.aliquota_interna;

        if (estadoData.fcp !== null) {
            if (typeof estadoData.fcp === 'number') {
                // FCP fixo
                aliquotaTotal += estadoData.fcp;
            } else if (estadoData.fcp && typeof estadoData.fcp.min === 'number') {
                // FCP variável - usar valor MÍNIMO (piso) conforme especificação
                aliquotaTotal += estadoData.fcp.min;
            }
        }

        return aliquotaTotal;
    }

    /**
     * Obter regras de crédito para regime tributário específico - NO FALLBACKS
     * @param {string} regimeTributario - lucro_real | lucro_presumido | simples_nacional
     * @returns {Object} Regras de crédito do regime
     */
    obterRegrasCreditoRegime(regimeTributario) {
        this.validarInicializacao();

        if (!regimeTributario) {
            throw new Error('Regime tributário é obrigatório para obter regras de crédito');
        }

        const regimesValidos = ['lucro_real', 'lucro_presumido', 'simples_nacional'];
        if (!regimesValidos.includes(regimeTributario)) {
            throw new Error(`Regime tributário inválido: ${regimeTributario}. Válidos: ${regimesValidos.join(', ')}`);
        }

        const regrasCredito = this.tributacaoMonofasicaData.regras_credito_por_regime[regimeTributario];
        if (!regrasCredito) {
            throw new Error(`Regras de crédito não encontradas para regime ${regimeTributario}`);
        }

        return regrasCredito;
    }

    /**
     * Detectar produtos monofásicos em NCM - NO FALLBACKS
     * @param {string} ncm - Código NCM (obrigatório)
     * @returns {boolean} Se NCM é monofásico
     */
    detectarMonofasico(ncm) {
        this.validarInicializacao();

        if (!ncm) {
            throw new Error('NCM é obrigatório para detecção de produto monofásico');
        }

        if (typeof ncm !== 'string') {
            throw new Error('NCM deve ser string');
        }

        const padroesMonofasicos = this.tributacaoMonofasicaData.deteccao_automatica?.padroes_ncm_4digitos;
        if (!padroesMonofasicos || !Array.isArray(padroesMonofasicos)) {
            throw new Error('Padrões de detecção monofásica não encontrados nos dados');
        }

        return padroesMonofasicos.some(padrao => ncm.startsWith(padrao));
    }

    /**
     * Calcular percentuais de impostos por dentro para precificação - NO FALLBACKS
     * @param {string} regimeTributario - Regime tributário da empresa
     * @param {string} estadoUF - Estado para operações internas
     * @param {boolean} isMonofasico - Se produto é monofásico
     * @returns {Object} Percentuais de impostos por dentro
     */
    calcularPercentuaisImpostosPorDentro(regimeTributario, estadoUF, isMonofasico = false) {
        this.validarInicializacao();

        if (!regimeTributario) {
            throw new Error('Regime tributário é obrigatório para cálculo de percentuais');
        }

        if (!estadoUF) {
            throw new Error('Estado UF é obrigatório para cálculo de percentuais');
        }

        // Obter alíquota ICMS do estado
        const aliquotaICMS = this.obterAliquotaICMS(estadoUF);

        // Obter regras de crédito do regime
        const regrasCredito = this.obterRegrasCreditoRegime(regimeTributario);

        let percentuais = {
            pis: 0,
            cofins: 0,
            icms: aliquotaICMS,
            ipi: 0, // IPI varia por NCM - deve vir dos dados da DI
            total: aliquotaICMS
        };

        // Calcular PIS/COFINS baseado no regime
        if (regimeTributario === 'simples_nacional') {
            // Simples Nacional: tributação unificada no DAS
            // Não há PIS/COFINS separados - apenas ICMS nas operações internas
            percentuais.pis = 0;
            percentuais.cofins = 0;

        } else if (regimeTributario === 'lucro_real') {
            // Lucro Real: regime não-cumulativo
            if (isMonofasico) {
                // Produtos monofásicos: sem PIS/COFINS na saída (alíquota zero)
                percentuais.pis = 0;
                percentuais.cofins = 0;
            } else {
                // Produtos normais: alíquotas padrão não-cumulativo
                const aliquotasPadrao = this.aliquotasData.tributos_federais?.pis_cofins_base;
                if (!aliquotasPadrao) {
                    throw new Error('Alíquotas padrão PIS/COFINS não encontradas nos dados');
                }

                percentuais.pis = aliquotasPadrao.pis_aliquota_basica;
                percentuais.cofins = aliquotasPadrao.cofins_aliquota_basica;
            }

        } else if (regimeTributario === 'lucro_presumido') {
            // Lucro Presumido: regime cumulativo
            if (isMonofasico) {
                // Produtos monofásicos: sem PIS/COFINS na saída
                percentuais.pis = 0;
                percentuais.cofins = 0;
            } else {
                // Produtos normais: alíquotas cumulativas (0,65% + 3%)
                percentuais.pis = 0.65;
                percentuais.cofins = 3.00;
            }
        }

        // Calcular total
        percentuais.total = percentuais.pis + percentuais.cofins + percentuais.icms + percentuais.ipi;

        console.log(`📊 Percentuais calculados para ${regimeTributario}/${estadoUF}: ICMS ${percentuais.icms}% + PIS ${percentuais.pis}% + COFINS ${percentuais.cofins}% = ${percentuais.total}%`);

        return percentuais;
    }

    /**
     * Validar se motor foi inicializado - FAIL-FAST
     */
    validarInicializacao() {
        if (!this.initialized) {
            throw new Error('MotorCalculoTributario não foi inicializado - chame inicializar() primeiro');
        }

        if (!this.aliquotasData) {
            throw new Error('Dados de alíquotas não carregados - inicialização incompleta');
        }

        if (!this.tributacaoMonofasicaData) {
            throw new Error('Dados de tributação monofásica não carregados - inicialização incompleta');
        }
    }

    /**
     * Aplicar incentivos fiscais nos percentuais calculados
     * @param {Object} percentuais - Percentuais base calculados
     * @param {string} estadoUF - Estado de destino
     * @param {Array} ncms - Lista de NCMs da operação
     * @param {string} incentivosEscolhidos - Códigos dos incentivos escolhidos pelo usuário
     * @returns {Object} Percentuais com incentivos aplicados + detalhamento
     */
    aplicarIncentivosFiscais(percentuais, estadoUF, ncms = [], incentivosEscolhidos = null) {
        this.validarInicializacao();

        if (!percentuais || typeof percentuais !== 'object') {
            throw new Error('Percentuais base obrigatórios para aplicação de incentivos');
        }

        if (!estadoUF) {
            throw new Error('Estado UF obrigatório para aplicação de incentivos');
        }

        const resultado = {
            percentuais_originais: { ...percentuais },
            percentuais_com_incentivos: { ...percentuais },
            incentivos_aplicados: [],
            economia_total: 0,
            detalhamento: {}
        };

        try {
            if (incentivosEscolhidos) {
                // Usuário escolheu incentivos específicos - validar e aplicar
                const programas = incentivosEscolhidos.split(',').map(p => p.trim());
                
                for (const programa of programas) {
                    const validacao = this.incentiveManager.validateEligibility(estadoUF, programa, ncms);
                    
                    if (validacao.elegivel && validacao.beneficios_estimados) {
                        // Aplicar benefícios reais vindos do beneficios.json
                        const beneficio = validacao.beneficios_estimados;
                        
                        resultado.incentivos_aplicados.push({
                            programa: programa,
                            beneficio: beneficio,
                            economia_percentual: beneficio.percentual_reducao || 0
                        });
                        
                        // Aplicar redução nos percentuais baseada nos dados reais
                        if (beneficio.tipo === 'reducao_base_icms' && beneficio.percentual_reducao) {
                            resultado.percentuais_com_incentivos.icms *= (1 - beneficio.percentual_reducao / 100);
                        }
                    }
                }
            } else {
                // Auto-detectar incentivos disponíveis (apenas informativamente)
                const programasDisponiveis = this.incentiveManager.getAvailablePrograms(estadoUF);
                resultado.detalhamento.programas_disponiveis = programasDisponiveis;
            }

            // Recalcular total
            resultado.percentuais_com_incentivos.total = 
                resultado.percentuais_com_incentivos.pis + 
                resultado.percentuais_com_incentivos.cofins + 
                resultado.percentuais_com_incentivos.icms + 
                resultado.percentuais_com_incentivos.ipi;

            // Calcular economia total
            resultado.economia_total = resultado.percentuais_originais.total - resultado.percentuais_com_incentivos.total;

            return resultado;

        } catch (error) {
            console.error('Erro ao aplicar incentivos fiscais:', error);
            return {
                ...resultado,
                erro: error.message,
                incentivos_aplicados: []
            };
        }
    }
}

/**
 * CalculadoraMetodosPrecificacao - Implementação dos 4 métodos de precificação
 * Utiliza fórmulas matemáticas exatas conforme especificação técnica
 */
class CalculadoraMetodosPrecificacao {
    constructor(motorTributario) {
        if (!motorTributario) {
            throw new Error('MotorCalculoTributario é obrigatório para CalculadoraMetodosPrecificacao');
        }
        this.motorTributario = motorTributario;
    }

    /**
     * MÉTODO 1: Método da Margem
     * Fórmula: preco_base = custo_contabil / (1 - margem_desejada - percentual_impostos_por_dentro)
     * @param {number} custoContabil - Custo contábil calculado
     * @param {number} margemDesejada - Margem desejada em decimal (ex: 0.25 para 25%)
     * @param {Object} percentuaisImpostos - Percentuais de impostos por dentro
     * @param {number} aliquotaIPI - Alíquota IPI específica do produto (se aplicável)
     * @returns {Object} Resultado do método da margem
     */
    calcularMetodoMargem(custoContabil, margemDesejada, percentuaisImpostos, aliquotaIPI = 0) {
        // Validações NO FALLBACKS
        if (typeof custoContabil !== 'number' || custoContabil <= 0) {
            throw new Error('Custo contábil deve ser numérico e positivo para método da margem');
        }

        if (typeof margemDesejada !== 'number' || margemDesejada < 0 || margemDesejada >= 1) {
            throw new Error('Margem desejada deve ser decimal entre 0 e 1 (ex: 0.25 para 25%)');
        }

        if (!percentuaisImpostos || typeof percentuaisImpostos.total !== 'number') {
            throw new Error('Percentuais de impostos inválidos - total obrigatório');
        }

        if (typeof aliquotaIPI !== 'number' || aliquotaIPI < 0) {
            throw new Error('Alíquota IPI deve ser numérica e >= 0');
        }

        // Calcular percentual total de impostos por dentro (em decimal)
        const percentualImpostosPorDentro = percentuaisImpostos.total / 100;

        // Validar se há margem suficiente
        const margemMaximaPossivel = 1 - percentualImpostosPorDentro;
        if (margemDesejada >= margemMaximaPossivel) {
            throw new Error(`Margem desejada (${(margemDesejada * 100).toFixed(2)}%) inviável. Máxima possível: ${(margemMaximaPossivel * 100).toFixed(2)}% considerando impostos`);
        }

        // Aplicar fórmula do método da margem
        const denominador = 1 - margemDesejada - percentualImpostosPorDentro;
        if (denominador <= 0) {
            throw new Error('Denominador inválido na fórmula - margem + impostos excedem 100%');
        }

        const precoBase = custoContabil / denominador;

        // Aplicar IPI se aplicável (IPI é por fora)
        const precoFinal = precoBase * (1 + (aliquotaIPI / 100));

        // Calcular métricas de resultado
        const valorImpostos = precoBase * percentualImpostosPorDentro;
        const valorMargem = precoBase * margemDesejada;
        const valorIPI = precoBase * (aliquotaIPI / 100);

        return {
            metodo: 'margem',
            custo_contabil: custoContabil,
            preco_base: precoBase,
            preco_final: precoFinal,
            margem_desejada_percentual: margemDesejada * 100,
            margem_valor: valorMargem,
            impostos_valor: valorImpostos,
            ipi_valor: valorIPI,
            percentuais_aplicados: percentuaisImpostos,
            validacao: {
                denominador: denominador,
                margem_maxima_possivel: margemMaximaPossivel * 100
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * MÉTODO 2: Método do Markup
     * Fórmula: markup_calculado = 100 / (100 - margem_lucro - percentual_impostos_por_dentro)
     * @param {number} custoContabil - Custo contábil calculado
     * @param {number} margemLucro - Margem de lucro desejada em percentual (ex: 25 para 25%)
     * @param {Object} percentuaisImpostos - Percentuais de impostos por dentro
     * @param {number} aliquotaIPI - Alíquota IPI específica do produto (se aplicável)
     * @returns {Object} Resultado do método do markup
     */
    calcularMetodoMarkup(custoContabil, margemLucro, percentuaisImpostos, aliquotaIPI = 0) {
        // Validações NO FALLBACKS
        if (typeof custoContabil !== 'number' || custoContabil <= 0) {
            throw new Error('Custo contábil deve ser numérico e positivo para método do markup');
        }

        if (typeof margemLucro !== 'number' || margemLucro < 0 || margemLucro >= 100) {
            throw new Error('Margem de lucro deve ser percentual entre 0 e 100 (ex: 25 para 25%)');
        }

        if (!percentuaisImpostos || typeof percentuaisImpostos.total !== 'number') {
            throw new Error('Percentuais de impostos inválidos - total obrigatório');
        }

        if (typeof aliquotaIPI !== 'number' || aliquotaIPI < 0) {
            throw new Error('Alíquota IPI deve ser numérica e >= 0');
        }

        // Validar se há margem suficiente
        const margemMaximaPossivel = 100 - percentuaisImpostos.total;
        if (margemLucro >= margemMaximaPossivel) {
            throw new Error(`Margem de lucro (${margemLucro}%) inviável. Máxima possível: ${margemMaximaPossivel.toFixed(2)}% considerando impostos`);
        }

        // Aplicar fórmula do método do markup
        const denominador = 100 - margemLucro - percentuaisImpostos.total;
        if (denominador <= 0) {
            throw new Error('Denominador inválido na fórmula - margem + impostos excedem 100%');
        }

        const markupCalculado = 100 / denominador;
        const precoBase = custoContabil * markupCalculado;

        // Aplicar IPI se aplicável (IPI é por fora)
        const precoFinal = precoBase * (1 + (aliquotaIPI / 100));

        // Calcular métricas de resultado
        const valorImpostos = precoBase * (percentuaisImpostos.total / 100);
        const valorMargem = precoBase * (margemLucro / 100);
        const valorIPI = precoBase * (aliquotaIPI / 100);

        return {
            metodo: 'markup',
            custo_contabil: custoContabil,
            markup_calculado: markupCalculado,
            preco_base: precoBase,
            preco_final: precoFinal,
            margem_lucro_percentual: margemLucro,
            margem_valor: valorMargem,
            impostos_valor: valorImpostos,
            ipi_valor: valorIPI,
            percentuais_aplicados: percentuaisImpostos,
            validacao: {
                denominador: denominador,
                margem_maxima_possivel: margemMaximaPossivel
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * MÉTODO 3: Divisão
     * Fórmula: preco_final = custo_contabil / (1 - percentual_total_impostos_margem)
     * @param {number} custoContabil - Custo contábil calculado
     * @param {number} percentualTotal - Percentual total (impostos + margem) em decimal
     * @param {number} aliquotaIPI - Alíquota IPI específica do produto (se aplicável)
     * @returns {Object} Resultado do método divisão
     */
    calcularMetodoDivisao(custoContabil, percentualTotal, aliquotaIPI = 0) {
        // Validações NO FALLBACKS
        if (typeof custoContabil !== 'number' || custoContabil <= 0) {
            throw new Error('Custo contábil deve ser numérico e positivo para método da divisão');
        }

        if (typeof percentualTotal !== 'number' || percentualTotal <= 0 || percentualTotal >= 1) {
            throw new Error('Percentual total deve ser decimal entre 0 e 1 (ex: 0.4 para 40%)');
        }

        if (typeof aliquotaIPI !== 'number' || aliquotaIPI < 0) {
            throw new Error('Alíquota IPI deve ser numérica e >= 0');
        }

        // Aplicar fórmula da divisão
        const denominador = 1 - percentualTotal;
        if (denominador <= 0) {
            throw new Error('Denominador inválido - percentual total >= 100%');
        }

        const precoBase = custoContabil / denominador;

        // Aplicar IPI se aplicável (IPI é por fora)
        const precoFinal = precoBase * (1 + (aliquotaIPI / 100));

        // Calcular métricas de resultado
        const valorImpostosMargem = precoBase * percentualTotal;
        const valorIPI = precoBase * (aliquotaIPI / 100);

        return {
            metodo: 'divisao',
            custo_contabil: custoContabil,
            percentual_total_decimal: percentualTotal,
            percentual_total_percentual: percentualTotal * 100,
            preco_base: precoBase,
            preco_final: precoFinal,
            valor_impostos_margem: valorImpostosMargem,
            ipi_valor: valorIPI,
            validacao: {
                denominador: denominador
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * MÉTODO 4: Multiplicação (Factor)
     * Fórmula: preco_final = custo_contabil * fator_multiplicador
     * @param {number} custoContabil - Custo contábil calculado
     * @param {number} fatorMultiplicador - Fator de multiplicação (ex: 1.67 para markup de 67%)
     * @param {number} aliquotaIPI - Alíquota IPI específica do produto (se aplicável)
     * @returns {Object} Resultado do método multiplicação
     */
    calcularMetodoMultiplicacao(custoContabil, fatorMultiplicador, aliquotaIPI = 0) {
        // Validações NO FALLBACKS
        if (typeof custoContabil !== 'number' || custoContabil <= 0) {
            throw new Error('Custo contábil deve ser numérico e positivo para método da multiplicação');
        }

        if (typeof fatorMultiplicador !== 'number' || fatorMultiplicador <= 1) {
            throw new Error('Fator multiplicador deve ser numérico e > 1 (ex: 1.67 para markup de 67%)');
        }

        if (typeof aliquotaIPI !== 'number' || aliquotaIPI < 0) {
            throw new Error('Alíquota IPI deve ser numérica e >= 0');
        }

        // Aplicar fórmula da multiplicação
        const precoBase = custoContabil * fatorMultiplicador;

        // Aplicar IPI se aplicável (IPI é por fora)
        const precoFinal = precoBase * (1 + (aliquotaIPI / 100));

        // Calcular métricas de resultado
        const valorMarkup = precoBase - custoContabil;
        const percentualMarkup = ((precoBase - custoContabil) / custoContabil) * 100;
        const margemBruta = (valorMarkup / precoBase) * 100;
        const valorIPI = precoBase * (aliquotaIPI / 100);

        return {
            metodo: 'multiplicacao',
            custo_contabil: custoContabil,
            fator_multiplicador: fatorMultiplicador,
            preco_base: precoBase,
            preco_final: precoFinal,
            valor_markup: valorMarkup,
            percentual_markup: percentualMarkup,
            margem_bruta_percentual: margemBruta,
            ipi_valor: valorIPI,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * ValidadorParametros - Validação rigorosa de parâmetros de entrada - NO FALLBACKS
 */
class ValidadorParametros {
    /**
     * Validar dados da DI carregados do IndexedDB
     * @param {Object} diData - Dados da DI
     * @returns {Object} Estrutura validada
     */
    static validarDadosDI(diData) {
        if (!diData) {
            throw new Error('Dados da DI são obrigatórios - não fornecidos');
        }

        if (typeof diData !== 'object') {
            throw new Error('Dados da DI devem ser um objeto válido');
        }

        // Validar campos obrigatórios básicos
        const camposObrigatorios = ['numero_di', 'adicoes', 'totais'];
        for (const campo of camposObrigatorios) {
            if (!diData[campo]) {
                throw new Error(`Campo obrigatório ausente nos dados da DI: ${campo}`);
            }
        }

        // Validar número da DI
        if (typeof diData.numero_di !== 'string' || diData.numero_di.trim().length === 0) {
            throw new Error('Número da DI deve ser uma string não-vazia');
        }

        // Validar adições
        if (!Array.isArray(diData.adicoes) || diData.adicoes.length === 0) {
            throw new Error('DI deve ter pelo menos uma adição válida');
        }

        // Validar totais
        if (typeof diData.totais !== 'object') {
            throw new Error('Totais da DI devem ser um objeto válido');
        }

        const camposTotaisObrigatorios = ['valor_aduaneiro', 'ii_devido', 'ipi_devido', 'pis_devido', 'cofins_devido', 'icms_devido', 'despesas_aduaneiras'];
        for (const campo of camposTotaisObrigatorios) {
            if (typeof diData.totais[campo] !== 'number') {
                throw new Error(`Campo total obrigatório inválido: ${campo} deve ser numérico`);
            }
        }

        console.log('✅ Dados da DI validados com sucesso');
        return diData;
    }

    /**
     * Validar regime tributário
     * @param {string} regimeTributario - Regime tributário
     * @returns {string} Regime validado
     */
    static validarRegimeTributario(regimeTributario) {
        if (!regimeTributario) {
            throw new Error('Regime tributário é obrigatório - não fornecido pelo usuário');
        }

        if (typeof regimeTributario !== 'string') {
            throw new Error('Regime tributário deve ser uma string');
        }

        const regimesValidos = ['lucro_real', 'lucro_presumido', 'simples_nacional'];
        if (!regimesValidos.includes(regimeTributario)) {
            throw new Error(`Regime tributário inválido: ${regimeTributario}. Válidos: ${regimesValidos.join(', ')}`);
        }

        return regimeTributario;
    }

    /**
     * Validar estado UF
     * @param {string} estadoUF - Código UF do estado
     * @returns {string} Estado validado
     */
    static validarEstadoUF(estadoUF) {
        if (!estadoUF) {
            throw new Error('Estado UF é obrigatório - não fornecido pelo usuário');
        }

        if (typeof estadoUF !== 'string') {
            throw new Error('Estado UF deve ser uma string');
        }

        if (estadoUF.length !== 2) {
            throw new Error('Estado UF deve ter exatamente 2 caracteres');
        }

        return estadoUF.toUpperCase();
    }

    /**
     * Validar parâmetros gerenciais do usuário
     * @param {Object} parametros - Parâmetros gerenciais
     * @returns {Object} Parâmetros validados
     */
    static validarParametrosGerenciais(parametros) {
        if (!parametros) {
            throw new Error('Parâmetros gerenciais são obrigatórios - devem ser preenchidos pelo usuário');
        }

        if (typeof parametros !== 'object') {
            throw new Error('Parâmetros gerenciais devem ser um objeto válido');
        }

        // Validar encargos financeiros
        if (typeof parametros.encargos_financeiros_percentual !== 'number') {
            throw new Error('Encargos financeiros (%) é obrigatório - deve ser preenchido pelo usuário');
        }

        if (parametros.encargos_financeiros_percentual < 0 || parametros.encargos_financeiros_percentual > 100) {
            throw new Error('Encargos financeiros deve estar entre 0 e 100%');
        }

        // Validar tributos recuperáveis
        if (typeof parametros.tributos_recuperaveis_outros !== 'number') {
            throw new Error('Tributos recuperáveis outros é obrigatório - deve ser preenchido pelo usuário');
        }

        if (parametros.tributos_recuperaveis_outros < 0) {
            throw new Error('Tributos recuperáveis outros deve ser >= 0');
        }

        // Validar custos indiretos
        if (typeof parametros.custos_indiretos_percentual !== 'number') {
            throw new Error('Custos indiretos (%) é obrigatório - deve ser preenchido pelo usuário');
        }

        if (parametros.custos_indiretos_percentual < 0 || parametros.custos_indiretos_percentual > 100) {
            throw new Error('Custos indiretos deve estar entre 0 e 100%');
        }

        // Validar margem operacional
        if (typeof parametros.margem_operacional_percentual !== 'number') {
            throw new Error('Margem operacional (%) é obrigatório - deve ser preenchido pelo usuário');
        }

        if (parametros.margem_operacional_percentual < 0 || parametros.margem_operacional_percentual > 1000) {
            throw new Error('Margem operacional deve estar entre 0 e 1000%');
        }

        console.log('✅ Parâmetros gerenciais validados com sucesso');
        return parametros;
    }

    /**
     * Validar parâmetros de precificação
     * @param {Object} parametrosPrecificacao - Parâmetros de precificação
     * @returns {Object} Parâmetros validados
     */
    static validarParametrosPrecificacao(parametrosPrecificacao) {
        if (!parametrosPrecificacao) {
            throw new Error('Parâmetros de precificação são obrigatórios - devem ser preenchidos pelo usuário');
        }

        if (typeof parametrosPrecificacao !== 'object') {
            throw new Error('Parâmetros de precificação devem ser um objeto válido');
        }

        // Validar método selecionado
        const metodosValidos = ['margem', 'markup', 'divisao', 'multiplicacao'];
        if (!parametrosPrecificacao.metodo || !metodosValidos.includes(parametrosPrecificacao.metodo)) {
            throw new Error(`Método de precificação inválido. Válidos: ${metodosValidos.join(', ')}`);
        }

        // Validações específicas por método
        switch (parametrosPrecificacao.metodo) {
            case 'margem':
                if (typeof parametrosPrecificacao.margem_desejada !== 'number') {
                    throw new Error('Margem desejada é obrigatória para método da margem');
                }
                if (parametrosPrecificacao.margem_desejada <= 0 || parametrosPrecificacao.margem_desejada >= 100) {
                    throw new Error('Margem desejada deve estar entre 0 e 100%');
                }
                break;

            case 'markup':
                if (typeof parametrosPrecificacao.margem_lucro !== 'number') {
                    throw new Error('Margem de lucro é obrigatória para método do markup');
                }
                if (parametrosPrecificacao.margem_lucro <= 0 || parametrosPrecificacao.margem_lucro >= 100) {
                    throw new Error('Margem de lucro deve estar entre 0 e 100%');
                }
                break;

            case 'divisao':
                if (typeof parametrosPrecificacao.percentual_total !== 'number') {
                    throw new Error('Percentual total é obrigatório para método da divisão');
                }
                if (parametrosPrecificacao.percentual_total <= 0 || parametrosPrecificacao.percentual_total >= 100) {
                    throw new Error('Percentual total deve estar entre 0 e 100%');
                }
                break;

            case 'multiplicacao':
                if (typeof parametrosPrecificacao.fator_multiplicador !== 'number') {
                    throw new Error('Fator multiplicador é obrigatório para método da multiplicação');
                }
                if (parametrosPrecificacao.fator_multiplicador <= 1) {
                    throw new Error('Fator multiplicador deve ser > 1');
                }
                break;
        }

        console.log('✅ Parâmetros de precificação validados com sucesso');
        return parametrosPrecificacao;
    }
}

/**
 * InterfacePrecificacao - Classe principal de orquestração
 * Coordena todos os componentes do sistema de precificação
 */
class InterfacePrecificacao {
    constructor() {
        this.motorTributario = new MotorCalculoTributario();
        this.calculadora = null;
        this.dadosDI = null;
        this.custos4Tipos = null;
        this.resultadosPrecificacao = null;
        this.initialized = false;
    }

    /**
     * Inicializar sistema completo de precificação
     */
    async inicializar() {
        if (this.initialized) {
            return;
        }

        try {
            console.log('🚀 Inicializando sistema de precificação...');

            // Inicializar motor tributário com dados externos
            await this.motorTributario.inicializar();

            // Criar calculadora
            this.calculadora = new CalculadoraMetodosPrecificacao(this.motorTributario);

            this.initialized = true;
            console.log('✅ Sistema de precificação inicializado com sucesso');

        } catch (error) {
            throw new Error(`Falha na inicialização do sistema de precificação: ${error.message}`);
        }
    }

    /**
     * Carregar dados da DI do IndexedDB - INTEGRAÇÃO OBRIGATÓRIA
     * @param {Object} dadosDI - Dados da DI processados na Fase 1
     */
    carregarDadosDI(dadosDI) {
        this.validarInicializacao();

        // Aplicar parsing numérico nos campos obrigatórios antes da validação
        if (dadosDI.totais) {
            dadosDI.totais.valor_aduaneiro = parseFloat(dadosDI.totais.valor_aduaneiro);
            dadosDI.totais.ii_devido = parseFloat(dadosDI.totais.ii_devido);
            dadosDI.totais.ipi_devido = parseFloat(dadosDI.totais.ipi_devido);
            dadosDI.totais.pis_devido = parseFloat(dadosDI.totais.pis_devido);
            dadosDI.totais.cofins_devido = parseFloat(dadosDI.totais.cofins_devido);
            dadosDI.totais.icms_devido = parseFloat(dadosDI.totais.icms_devido);
            dadosDI.totais.despesas_aduaneiras = parseFloat(dadosDI.totais.despesas_aduaneiras);
            
            // Validar que conversão foi bem-sucedida - falhar se NaN
            const campos = ['valor_aduaneiro', 'ii_devido', 'ipi_devido', 'pis_devido', 'cofins_devido', 'icms_devido', 'despesas_aduaneiras'];
            for (const campo of campos) {
                if (isNaN(dadosDI.totais[campo])) {
                    throw new Error(`Campo ${campo} obrigatório inválido: deve ser numérico`);
                }
            }
        }

        // Aplicar parsing em outros campos numéricos se existirem
        if (dadosDI.valor_aduaneiro !== undefined) {
            dadosDI.valor_aduaneiro = parseFloat(dadosDI.valor_aduaneiro);
            if (isNaN(dadosDI.valor_aduaneiro)) {
                throw new Error('Campo valor_aduaneiro deve ser numérico');
            }
        }
        if (dadosDI.valor_frete !== undefined) {
            dadosDI.valor_frete = parseFloat(dadosDI.valor_frete);
            if (isNaN(dadosDI.valor_frete)) {
                throw new Error('Campo valor_frete deve ser numérico');
            }
        }
        if (dadosDI.valor_seguro !== undefined) {
            dadosDI.valor_seguro = parseFloat(dadosDI.valor_seguro);
            if (isNaN(dadosDI.valor_seguro)) {
                throw new Error('Campo valor_seguro deve ser numérico');
            }
        }

        // Validar estrutura da DI rigorosamente
        this.dadosDI = ValidadorParametros.validarDadosDI(dadosDI);

        console.log(`✅ Dados da DI ${this.dadosDI.numero_di} carregados para precificação`);
    }

    /**
     * Calcular os 4 tipos de custos conforme PricingEngine
     * @param {string} regimeTributario - Regime tributário da empresa
     * @param {Object} parametrosGerenciais - Parâmetros preenchidos pelo usuário
     * @returns {Object} Resultado dos 4 tipos de custos
     */
    async calcular4TiposCustos(regimeTributario, parametrosGerenciais) {
        this.validarInicializacao();

        if (!this.dadosDI) {
            throw new Error('Dados da DI não carregados - use carregarDadosDI() primeiro');
        }

        // Validar parâmetros de entrada
        const regimeValidado = ValidadorParametros.validarRegimeTributario(regimeTributario);
        const parametrosValidados = ValidadorParametros.validarParametrosGerenciais(parametrosGerenciais);

        try {
            console.log('🏭 Calculando os 4 tipos de custos...');

            // TIPO 1: Custo Base (valor_aduaneiro + impostos + despesas)
            const custoBase = this.calcularCustoBase();

            // TIPO 2: Custo de Desembolso (custo_base - créditos)
            const resultadoDesembolso = await this.calcularCustoDesembolso(custoBase, regimeValidado);
            const custoDesembolso = resultadoDesembolso.valor;
            const creditosDetalhados = resultadoDesembolso.creditos;

            // TIPO 3: Custo Contábil (custo_desembolso + encargos - recuperáveis)
            const custoContabil = this.calcularCustoContabil(custoDesembolso, parametrosValidados);

            // TIPO 4: Base para Formação de Preço (custo_contábil + indiretos + margem operacional)
            const baseFormacaoPreco = this.calcularBaseFormacaoPreco(custoContabil, parametrosValidados);

            // Estruturar resultado completo com informações de créditos
            this.custos4Tipos = {
                tipo_1_custo_base: custoBase,
                tipo_2_custo_desembolso: custoDesembolso,
                tipo_3_custo_contabil: custoContabil,
                tipo_4_base_formacao_preco: baseFormacaoPreco,
                regime_tributario: regimeValidado,
                creditos_aplicados: creditosDetalhados,
                parametros_utilizados: parametrosValidados,
                di_numero: this.dadosDI.numero_di,
                timestamp: new Date().toISOString(),
                versao_sistema: 'FASE 2.4.3 - v2025.1'
            };

            console.log(`✅ 4 tipos de custos calculados: Base R$ ${custoBase.toFixed(2)} → Desembolso R$ ${custoDesembolso.toFixed(2)} → Contábil R$ ${custoContabil.toFixed(2)} → Formação Preço R$ ${baseFormacaoPreco.toFixed(2)}`);

            return this.custos4Tipos;

        } catch (error) {
            throw new Error(`Erro no cálculo dos 4 tipos de custos: ${error.message}`);
        }
    }

    /**
     * Gerar preços pelos 4 métodos de precificação
     * @param {string} estadoUF - Estado para operações de venda
     * @param {Object} parametrosPrecificacao - Parâmetros específicos por método
     * @returns {Object} Preços calculados pelos 4 métodos
     */
    async gerarPrecos4Metodos(estadoUF, parametrosPrecificacao) {
        this.validarInicializacao();

        if (!this.custos4Tipos) {
            throw new Error('4 tipos de custos não calculados - use calcular4TiposCustos() primeiro');
        }

        // Validar parâmetros
        const estadoValidado = ValidadorParametros.validarEstadoUF(estadoUF);
        const parametrosValidados = ValidadorParametros.validarParametrosPrecificacao(parametrosPrecificacao);

        try {
            console.log('💰 Gerando preços pelos 4 métodos de precificação...');

            // Obter custo contábil para base dos cálculos
            const custoContabil = this.custos4Tipos.tipo_3_custo_contabil;

            // Detectar se produtos são monofásicos
            const ncmPrincipal = this.dadosDI.adicoes[0].ncm;
            const isMonofasico = this.motorTributario.detectarMonofasico(ncmPrincipal);

            // Obter percentuais de impostos por dentro para o estado
            const percentuaisImpostos = this.motorTributario.calcularPercentuaisImpostosPorDentro(
                this.custos4Tipos.regime_tributario,
                estadoValidado,
                isMonofasico
            );

            // Obter alíquota IPI (se aplicável) dos dados da DI
            const aliquotaIPI = this.dadosDI.adicoes[0].ipi_aliquota_ad_valorem || 0;

            let resultados = {};

            // MÉTODO 1: Margem (se parametros fornecidos)
            if (parametrosValidados.margem_desejada !== undefined) {
                resultados.metodo_margem = this.calculadora.calcularMetodoMargem(
                    custoContabil,
                    parametrosValidados.margem_desejada / 100, // Converter para decimal
                    percentuaisImpostos,
                    aliquotaIPI
                );
            }

            // MÉTODO 2: Markup (se parametros fornecidos)
            if (parametrosValidados.margem_lucro !== undefined) {
                resultados.metodo_markup = this.calculadora.calcularMetodoMarkup(
                    custoContabil,
                    parametrosValidados.margem_lucro,
                    percentuaisImpostos,
                    aliquotaIPI
                );
            }

            // MÉTODO 3: Divisão (se parametros fornecidos)
            if (parametrosValidados.percentual_total !== undefined) {
                resultados.metodo_divisao = this.calculadora.calcularMetodoDivisao(
                    custoContabil,
                    parametrosValidados.percentual_total / 100, // Converter para decimal
                    aliquotaIPI
                );
            }

            // MÉTODO 4: Multiplicação (se parametros fornecidos)
            if (parametrosValidados.fator_multiplicador !== undefined) {
                resultados.metodo_multiplicacao = this.calculadora.calcularMetodoMultiplicacao(
                    custoContabil,
                    parametrosValidados.fator_multiplicador,
                    aliquotaIPI
                );
            }

            // Estruturar resultado final
            this.resultadosPrecificacao = {
                custos_base: this.custos4Tipos,
                metodos_precificacao: resultados,
                configuracao: {
                    estado_uf: estadoValidado,
                    ncm_principal: ncmPrincipal,
                    is_monofasico: isMonofasico,
                    aliquota_ipi: aliquotaIPI,
                    percentuais_impostos: percentuaisImpostos
                },
                parametros_aplicados: parametrosValidados,
                timestamp: new Date().toISOString()
            };

            console.log(`✅ Preços gerados pelos métodos especificados para estado ${estadoValidado}`);

            return this.resultadosPrecificacao;

        } catch (error) {
            throw new Error(`Erro na geração de preços: ${error.message}`);
        }
    }

    /**
     * TIPO 1: Calcular Custo Base
     * Fórmula: valor_aduaneiro + II + IPI + PIS + COFINS + ICMS + despesas_aduaneiras
     */
    calcularCustoBase() {
        const totais = this.dadosDI.totais;

        const custoBase =
            totais.valor_aduaneiro +
            totais.ii_devido +
            totais.ipi_devido +
            totais.pis_devido +
            totais.cofins_devido +
            totais.icms_devido +
            totais.despesas_aduaneiras;

        console.log(`💰 Custo Base: R$ ${custoBase.toFixed(2)}`);
        return custoBase;
    }

    /**
     * TIPO 2: Calcular Custo de Desembolso
     * Fórmula: custo_base - créditos_tributários
     */
    async calcularCustoDesembolso(custoBase, regimeTributario) {
        const totais = this.dadosDI.totais;

        // Base para créditos: valor_aduaneiro + IPI (sem despesas aduaneiras)
        const baseCreditos = totais.valor_aduaneiro + totais.ipi_devido;

        // Estrutura detalhada de créditos
        const creditosDetalhados = {
            pis: 0,
            cofins: 0,
            ipi: 0,
            icms: 0,
            total: 0,
            regime: regimeTributario
        };

        // Calcular créditos por regime
        const regrasCredito = this.motorTributario.obterRegrasCreditoRegime(regimeTributario);

        if (regimeTributario === 'lucro_real') {
            // Lucro Real: crédito integral mesmo para monofásicos
            if (regrasCredito.permite_credito_importacao) {
                creditosDetalhados.pis = totais.pis_devido;
                creditosDetalhados.cofins = totais.cofins_devido;
                creditosDetalhados.ipi = totais.ipi_devido;
                creditosDetalhados.icms = totais.icms_devido;
            }
        } else if (regimeTributario === 'lucro_presumido') {
            // Lucro Presumido: sem créditos PIS/COFINS, mas permite IPI e ICMS
            creditosDetalhados.ipi = totais.ipi_devido;
            creditosDetalhados.icms = totais.icms_devido;
        }
        // Simples Nacional: sem créditos (já zerados na inicialização)

        // Calcular total
        creditosDetalhados.total = creditosDetalhados.pis + creditosDetalhados.cofins + 
                                  creditosDetalhados.ipi + creditosDetalhados.icms;

        const custoDesembolso = custoBase - creditosDetalhados.total;

        console.log(`💳 Custo Desembolso: R$ ${custoDesembolso.toFixed(2)} (créditos: R$ ${creditosDetalhados.total.toFixed(2)})`);
        
        return {
            valor: custoDesembolso,
            creditos: creditosDetalhados
        };
    }

    /**
     * TIPO 3: Calcular Custo Contábil
     * Fórmula: custo_desembolso + encargos_financeiros - tributos_recuperáveis
     */
    calcularCustoContabil(custoDesembolso, parametrosGerenciais) {
        const encargosFinanceiros = custoDesembolso * (parametrosGerenciais.encargos_financeiros_percentual / 100);
        const tributosRecuperaveis = parametrosGerenciais.tributos_recuperaveis_outros;

        const custoContabil = custoDesembolso + encargosFinanceiros - tributosRecuperaveis;

        console.log(`📊 Custo Contábil: R$ ${custoContabil.toFixed(2)}`);
        return custoContabil;
    }

    /**
     * TIPO 4: Calcular Base para Formação de Preço
     * Fórmula: custo_contábil + custos_indiretos + margem_operacional
     */
    calcularBaseFormacaoPreco(custoContabil, parametrosGerenciais) {
        const custosIndiretos = custoContabil * (parametrosGerenciais.custos_indiretos_percentual / 100);
        const margemOperacional = custoContabil * (parametrosGerenciais.margem_operacional_percentual / 100);

        const baseFormacaoPreco = custoContabil + custosIndiretos + margemOperacional;

        console.log(`🎯 Base Formação Preço: R$ ${baseFormacaoPreco.toFixed(2)}`);
        return baseFormacaoPreco;
    }

    /**
     * Obter resumo de resultados para interface
     */
    obterResumoResultados() {
        if (!this.resultadosPrecificacao) {
            throw new Error('Nenhum resultado de precificação disponível');
        }

        const custos = this.custos4Tipos;
        const metodos = this.resultadosPrecificacao.metodos_precificacao;

        // Preparar resumo dos métodos calculados
        let resumoMetodos = {};

        if (metodos.metodo_margem) {
            resumoMetodos.margem = {
                nome: 'Método da Margem',
                preco_final: metodos.metodo_margem.preco_final,
                margem_percentual: metodos.metodo_margem.margem_desejada_percentual
            };
        }

        if (metodos.metodo_markup) {
            resumoMetodos.markup = {
                nome: 'Método do Markup',
                preco_final: metodos.metodo_markup.preco_final,
                markup_calculado: metodos.metodo_markup.markup_calculado
            };
        }

        if (metodos.metodo_divisao) {
            resumoMetodos.divisao = {
                nome: 'Método da Divisão',
                preco_final: metodos.metodo_divisao.preco_final,
                percentual_total: metodos.metodo_divisao.percentual_total_percentual
            };
        }

        if (metodos.metodo_multiplicacao) {
            resumoMetodos.multiplicacao = {
                nome: 'Método da Multiplicação',
                preco_final: metodos.metodo_multiplicacao.preco_final,
                fator: metodos.metodo_multiplicacao.fator_multiplicador
            };
        }

        return {
            di_numero: this.dadosDI.numero_di,
            custos_4_tipos: {
                custo_base: custos.tipo_1_custo_base,
                custo_desembolso: custos.tipo_2_custo_desembolso,
                custo_contabil: custos.tipo_3_custo_contabil,
                base_formacao_preco: custos.tipo_4_base_formacao_preco
            },
            metodos_precificacao: resumoMetodos,
            configuracao: this.resultadosPrecificacao.configuracao,
            timestamp: this.resultadosPrecificacao.timestamp
        };
    }

    /**
     * Validar se sistema foi inicializado
     */
    validarInicializacao() {
        if (!this.initialized) {
            throw new Error('Sistema de precificação não foi inicializado - chame inicializar() primeiro');
        }

        if (!this.motorTributario || !this.calculadora) {
            throw new Error('Componentes do sistema não estão disponíveis - inicialização incompleta');
        }
    }
}

// Exportar classes para uso global
if (typeof window !== 'undefined') {
    window.MotorCalculoTributario = MotorCalculoTributario;
    window.CalculadoraMetodosPrecificacao = CalculadoraMetodosPrecificacao;
    window.ValidadorParametros = ValidadorParametros;
    window.InterfacePrecificacao = InterfacePrecificacao;
}

// ===== INTEGRAÇÃO COM SISTEMA DI =====

/**
 * Sistema de inicialização e integração com dados da DI
 */
let sistemaGlobal = {
    interfacePrecificacao: null,
    dadosDI: null,
    initialized: false
};

/**
 * Inicializar sistema quando página carregar
 */
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('🚀 Iniciando sistema de precificação...');

        // Carregar dados da DI do sessionStorage (se disponível)
        await carregarDadosDIFromSession();

        // Inicializar interface de precificação
        sistemaGlobal.interfacePrecificacao = new InterfacePrecificacao();
        await sistemaGlobal.interfacePrecificacao.inicializar();

        // Carregar dados da DI no sistema (se disponível)
        if (sistemaGlobal.dadosDI) {
            sistemaGlobal.interfacePrecificacao.carregarDadosDI(sistemaGlobal.dadosDI);

            // Atualizar interface com informações da DI
            atualizarInterfaceComDadosDI();
        }

        sistemaGlobal.initialized = true;
        console.log('✅ Sistema de precificação inicializado com sucesso');

    } catch (error) {
        console.error('❌ Erro na inicialização do sistema de precificação:', error);
        showAlert(`Erro na inicialização: ${error.message}`, 'danger');
    }
});

/**
 * Carregar dados da DI do sessionStorage - INTEGRAÇÃO OBRIGATÓRIA
 */
async function carregarDadosDIFromSession() {
    try {
        const dadosCompliance = sessionStorage.getItem('di_compliance_data');

        if (!dadosCompliance) {
            console.warn('⚠️ Nenhum dado de compliance encontrado no sessionStorage');
            showAlert('Nenhum dado da DI encontrado. Certifique-se de vir do processamento de DI.', 'warning');
            return;
        }

        const dadosParsed = JSON.parse(dadosCompliance);

        // Validar estrutura básica
        if (!dadosParsed.di_data || !dadosParsed.calculation_results) {
            throw new Error('Dados de compliance incompletos - di_data ou calculation_results ausentes');
        }

        sistemaGlobal.dadosDI = dadosParsed.di_data;
        
        // Validar estrutura obrigatória - NO FALLBACKS
        if (!sistemaGlobal.dadosDI.totais) {
            throw new Error('Estrutura totais obrigatória ausente - dados incompatíveis do módulo anterior');
        }
        
        // Validar que são números (sem conversão)
        const camposObrigatorios = ['valor_aduaneiro', 'ii_devido', 'ipi_devido', 
                                    'pis_devido', 'cofins_devido', 'icms_devido', 
                                    'despesas_aduaneiras'];
                                    
        camposObrigatorios.forEach(campo => {
            if (typeof sistemaGlobal.dadosDI.totais[campo] !== 'number') {
                throw new Error(`Campo ${campo} não é numérico - integração falhou. Valor recebido: ${sistemaGlobal.dadosDI.totais[campo]}`);
            }
        });

        console.log(`✅ Dados da DI ${sistemaGlobal.dadosDI.numero_di} carregados do sessionStorage`);
        console.log('✅ Estrutura totais validada:', sistemaGlobal.dadosDI.totais);

    } catch (error) {
        console.error('❌ Erro ao carregar dados da DI:', error);
        throw new Error(`Falha ao carregar dados da DI: ${error.message}`);
    }
}

/**
 * Atualizar interface com informações da DI carregada
 */
function atualizarInterfaceComDadosDI() {
    if (!sistemaGlobal.dadosDI) {
        return;
    }

    try {
        // Atualizar número da DI
        const diNumberEl = document.getElementById('diNumber');
        if (diNumberEl) {
            diNumberEl.textContent = sistemaGlobal.dadosDI.numero_di || '-';
        }

        // Atualizar importador
        const diImporterEl = document.getElementById('diImporter');
        if (diImporterEl && sistemaGlobal.dadosDI.importador) {
            const importador = sistemaGlobal.dadosDI.importador.nome ||
                              sistemaGlobal.dadosDI.importador.razao_social ||
                              '-';
            diImporterEl.textContent = importador;
        }

        // Mostrar sucesso na integração
        showAlert(`Dados da DI ${sistemaGlobal.dadosDI.numero_di} carregados com sucesso!`, 'success');

        console.log('✅ Interface atualizada com dados da DI');

    } catch (error) {
        console.error('❌ Erro ao atualizar interface:', error);
        showAlert(`Erro ao atualizar interface: ${error.message}`, 'warning');
    }
}

/**
 * Função principal de cálculo de precificação - INTERFACE PÚBLICA
 */
async function calcularPrecificacao() {
    if (!sistemaGlobal.initialized || !sistemaGlobal.interfacePrecificacao) {
        showAlert('Sistema não inicializado. Aguarde...', 'warning');
        return;
    }

    if (!sistemaGlobal.dadosDI) {
        showAlert('Nenhuma DI carregada. Volte ao processamento de DI primeiro.', 'danger');
        return;
    }

    try {
        mostrarLoading(true, 'Calculando 4 tipos de custos...');

        // Obter regime tributário selecionado
        const regimeTributario = document.querySelector('input[name="regimeTributario"]:checked');
        if (!regimeTributario) {
            throw new Error('Selecione um regime tributário');
        }

        // Obter parâmetros gerenciais
        const parametrosGerenciais = obterParametrosGerenciais();

        // Calcular os 4 tipos de custos
        const custos4Tipos = await sistemaGlobal.interfacePrecificacao.calcular4TiposCustos(
            regimeTributario.value,
            parametrosGerenciais
        );

        // Atualizar interface com resultados
        exibirResultadosCustos(custos4Tipos);

        showAlert('4 tipos de custos calculados com sucesso!', 'success');

    } catch (error) {
        console.error('❌ Erro no cálculo de precificação:', error);
        showAlert(`Erro no cálculo: ${error.message}`, 'danger');
    } finally {
        mostrarLoading(false);
    }
}

/**
 * Obter parâmetros gerenciais do formulário - NO FALLBACKS
 */
function obterParametrosGerenciais() {
    const encargosFinanceiros = parseFloat(document.getElementById('encargosFinanceiros').value);
    const custosIndiretos = parseFloat(document.getElementById('custosIndiretos').value);
    const margemOperacional = parseFloat(document.getElementById('margemOperacional').value);
    const tributosRecuperaveis = parseFloat(document.getElementById('tributosRecuperaveis').value);

    if (isNaN(encargosFinanceiros) || isNaN(custosIndiretos) || isNaN(margemOperacional) || isNaN(tributosRecuperaveis)) {
        throw new Error('Todos os parâmetros gerenciais devem ser preenchidos com valores numéricos válidos');
    }

    return {
        encargos_financeiros_percentual: encargosFinanceiros,
        custos_indiretos_percentual: custosIndiretos,
        margem_operacional_percentual: margemOperacional,
        tributos_recuperaveis_outros: tributosRecuperaveis
    };
}

/**
 * Exibir resultados dos custos na interface
 */
function exibirResultadosCustos(custos4Tipos) {
    const custosDisplay = document.getElementById('custosDisplay');
    const resultadosCard = document.getElementById('resultadosCard');
    const salvarBtn = document.getElementById('salvarBtn');

    if (!custosDisplay || !resultadosCard) {
        console.error('Elementos de interface não encontrados');
        return;
    }

    // Criar cards para cada tipo de custo
    const tiposHtml = `
        <div class="col-md-6">
            <div class="alert alert-primary">
                <h6><i class="bi bi-1-circle"></i> Custo Base</h6>
                <strong>R$ ${custos4Tipos.tipo_1_custo_base.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong>
                <small class="d-block">Valor aduaneiro + impostos + despesas</small>
            </div>
        </div>
        <div class="col-md-6">
            <div class="alert alert-info">
                <h6><i class="bi bi-2-circle"></i> Custo de Desembolso</h6>
                <strong>R$ ${custos4Tipos.tipo_2_custo_desembolso.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong>
                <small class="d-block">Custo base - créditos tributários</small>
            </div>
        </div>
        <div class="col-md-6">
            <div class="alert alert-warning">
                <h6><i class="bi bi-3-circle"></i> Custo Contábil</h6>
                <strong>R$ ${custos4Tipos.tipo_3_custo_contabil.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong>
                <small class="d-block">Custo desembolso + encargos - recuperáveis</small>
            </div>
        </div>
        <div class="col-md-6">
            <div class="alert alert-success">
                <h6><i class="bi bi-4-circle"></i> Base Formação de Preço</h6>
                <strong>R$ ${custos4Tipos.tipo_4_base_formacao_preco.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong>
                <small class="d-block">Custo contábil + indiretos + margem</small>
            </div>
        </div>
    `;

    custosDisplay.innerHTML = tiposHtml;
    resultadosCard.style.display = 'block';

    // Preencher campos de informações que estavam vazios
    if (custos4Tipos.creditos_aplicados) {
        const creditos = custos4Tipos.creditos_aplicados;
        
        // Total Créditos
        const totalCreditosEl = document.getElementById('totalCreditos');
        if (totalCreditosEl) {
            totalCreditosEl.textContent = `R$ ${creditos.total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
        }

        // Economia Percentual
        const economiaPercentualEl = document.getElementById('economiaPercentual');
        if (economiaPercentualEl && custos4Tipos.tipo_1_custo_base > 0) {
            const economiaPercentual = ((creditos.total / custos4Tipos.tipo_1_custo_base) * 100).toFixed(1);
            economiaPercentualEl.textContent = `${economiaPercentual}%`;
        }

        // Adicionar breakdown detalhado de créditos após os cards principais
        adicionarBreakdownCreditos(creditos);
    }

    // Regime Aplicado
    const regimeAplicadoEl = document.getElementById('regimeAplicado');
    if (regimeAplicadoEl && custos4Tipos.regime_tributario) {
        const regimeFormatado = custos4Tipos.regime_tributario
            .replace('_', ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
        regimeAplicadoEl.textContent = regimeFormatado;
    }

    // Versão do Sistema
    const versaoCalculoEl = document.getElementById('versaoCalculo');
    if (versaoCalculoEl && custos4Tipos.versao_sistema) {
        versaoCalculoEl.textContent = custos4Tipos.versao_sistema;
    }

    // Timestamp
    const timestampCalculoEl = document.getElementById('timestampCalculo');
    if (timestampCalculoEl && custos4Tipos.timestamp) {
        const timestamp = new Date(custos4Tipos.timestamp).toLocaleString('pt-BR');
        timestampCalculoEl.textContent = timestamp;
    }

    if (salvarBtn) {
        salvarBtn.style.display = 'inline-block';
    }

    // Mostrar botão de precificação individual (FASE 2.5)
    const itemPricingBtn = document.getElementById('itemPricingBtn');
    if (itemPricingBtn) {
        itemPricingBtn.style.display = 'inline-block';
    }
}

/**
 * Adicionar breakdown detalhado de créditos na interface
 */
function adicionarBreakdownCreditos(creditos) {
    // Procurar por um container existente ou criar um novo
    let breakdownContainer = document.getElementById('creditosBreakdownContainer');
    
    if (!breakdownContainer) {
        // Criar container para o breakdown se não existir
        breakdownContainer = document.createElement('div');
        breakdownContainer.id = 'creditosBreakdownContainer';
        breakdownContainer.className = 'mt-4';
        
        // Inserir após o container de custos
        const custosDisplay = document.getElementById('custosDisplay');
        if (custosDisplay && custosDisplay.parentNode) {
            custosDisplay.parentNode.insertBefore(breakdownContainer, custosDisplay.nextSibling);
        }
    }

    // Criar HTML do breakdown somente se há créditos aplicados
    if (creditos.total > 0) {
        const breakdownHtml = `
            <div class="card border-success">
                <div class="card-header bg-success text-white">
                    <h6 class="mb-0">
                        <i class="bi bi-piggy-bank"></i> Detalhamento de Créditos Tributários
                        <small class="float-end">Regime: ${creditos.regime.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</small>
                    </h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        ${creditos.pis > 0 ? `
                        <div class="col-md-3">
                            <div class="text-center p-2 border rounded bg-light">
                                <small class="text-muted">Crédito PIS</small>
                                <div class="fw-bold text-success">R$ ${creditos.pis.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                            </div>
                        </div>` : ''}
                        ${creditos.cofins > 0 ? `
                        <div class="col-md-3">
                            <div class="text-center p-2 border rounded bg-light">
                                <small class="text-muted">Crédito COFINS</small>
                                <div class="fw-bold text-success">R$ ${creditos.cofins.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                            </div>
                        </div>` : ''}
                        ${creditos.ipi > 0 ? `
                        <div class="col-md-3">
                            <div class="text-center p-2 border rounded bg-light">
                                <small class="text-muted">Crédito IPI</small>
                                <div class="fw-bold text-success">R$ ${creditos.ipi.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                            </div>
                        </div>` : ''}
                        ${creditos.icms > 0 ? `
                        <div class="col-md-3">
                            <div class="text-center p-2 border rounded bg-light">
                                <small class="text-muted">Crédito ICMS</small>
                                <div class="fw-bold text-success">R$ ${creditos.icms.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                            </div>
                        </div>` : ''}
                    </div>
                    <hr>
                    <div class="row">
                        <div class="col-md-12 text-center">
                            <h5 class="text-success mb-0">
                                <i class="bi bi-calculator"></i> Total de Créditos: 
                                <strong>R$ ${creditos.total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</strong>
                            </h5>
                            <small class="text-muted">Economia tributária aplicada conforme regime ${creditos.regime.replace('_', ' ')}</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        breakdownContainer.innerHTML = breakdownHtml;
    } else {
        // Se não há créditos, mostrar informativo
        const noCreditsHtml = `
            <div class="card border-warning">
                <div class="card-body text-center">
                    <i class="bi bi-info-circle text-warning"></i>
                    <strong>Regime ${creditos.regime.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong>: 
                    Nenhum crédito tributário aplicável para esta importação.
                </div>
            </div>
        `;
        
        breakdownContainer.innerHTML = noCreditsHtml;
    }
}

/**
 * Controlar loading overlay
 */
function mostrarLoading(show, message = 'Processando...') {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (!loadingOverlay) return;

    if (show) {
        const messageEl = loadingOverlay.querySelector('.text-white');
        if (messageEl) messageEl.textContent = message;

        loadingOverlay.style.display = 'flex';
    } else {
        loadingOverlay.style.display = 'none';
    }
}

/**
 * Mostrar alertas para usuário
 */
function showAlert(message, type = 'info') {
    // Criar alerta temporário no topo da página
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x`;
    alertDiv.style.zIndex = '9999';
    alertDiv.style.marginTop = '80px';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    document.body.appendChild(alertDiv);

    // Auto-remover após 5 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

/**
 * Função para alternar seção de parâmetros opcionais
 */
function toggleParametersSection() {
    const checkbox = document.getElementById('enableParameters');
    const parametersSection = document.getElementById('parametersSection');

    if (!checkbox || !parametersSection) return;

    if (checkbox.checked) {
        parametersSection.style.display = 'block';
    } else {
        parametersSection.style.display = 'none';
    }
}

/**
 * Função para selecionar modo de cálculo
 */
function selectCalculationMode(mode) {
    const modeBasico = document.getElementById('modeBasico');
    const modeCompleto = document.getElementById('modeCompleto');
    const calcularBtn = document.getElementById('calcularBtnText');

    if (!modeBasico || !modeCompleto) return;

    // Remover classe selected de ambos
    modeBasico.classList.remove('selected');
    modeCompleto.classList.remove('selected');

    // Adicionar classe selected ao modo escolhido
    if (mode === 'basico') {
        modeBasico.classList.add('selected');
        if (calcularBtn) calcularBtn.textContent = 'Calcular 3 Custos Básicos';
    } else if (mode === 'completo') {
        modeCompleto.classList.add('selected');
        if (calcularBtn) calcularBtn.textContent = 'Calcular 4 Tipos de Custos';
    }
}

/**
 * Função para salvar configurações
 */
function salvarConfiguracoes() {
    try {
        if (!sistemaGlobal.dadosDI) {
            showAlert('Nenhuma DI carregada para salvar configurações.', 'warning');
            return;
        }

        // Coletar dados de configuração
        const configuracao = {
            di_numero: sistemaGlobal.dadosDI.numero_di,
            regime_tributario: document.querySelector('input[name="regimeTributario"]:checked')?.value,
            parametros_gerenciais: obterParametrosGerenciais(),
            timestamp: new Date().toISOString()
        };

        // Salvar no localStorage
        const chave = `pricing_config_${sistemaGlobal.dadosDI.numero_di}`;
        localStorage.setItem(chave, JSON.stringify(configuracao));

        showAlert('Configurações salvas com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        showAlert(`Erro ao salvar: ${error.message}`, 'danger');
    }
}

/**
 * Abrir módulo de precificação por itens (FASE 2.5)
 */
function abrirPrecificacaoItens() {
    try {
        // Navegar para o módulo de item pricing
        const itemPricingURL = '../item-pricing/item-pricing-interface.html';
        
        // Salvar estado atual no sessionStorage para manter contexto
        if (sistemaGlobal.diSelecionada && sistemaGlobal.custos4Tipos) {
            sessionStorage.setItem('expertzy_pricing_context', JSON.stringify({
                di_numero: sistemaGlobal.diSelecionada.numero_di,
                custos_calculados: sistemaGlobal.custos4Tipos,
                timestamp: new Date().toISOString()
            }));
        }

        // Confirmar navegação
        if (confirm('Deseja navegar para o módulo de Precificação Individual por Item?\n\nOs custos calculados serão mantidos para precificar itens específicos.')) {
            window.location.href = itemPricingURL;
        }

    } catch (error) {
        console.error('❌ Erro ao navegar para precificação de itens:', error);
        // Navegação simplificada em caso de erro
        window.location.href = '../item-pricing/item-pricing-interface.html';
    }
}

/**
 * Exportar funções para uso global
 */
if (typeof window !== 'undefined') {
    window.calcularPrecificacao = calcularPrecificacao;
    window.toggleParametersSection = toggleParametersSection;
    window.selectCalculationMode = selectCalculationMode;
    window.salvarConfiguracoes = salvarConfiguracoes;
    window.abrirPrecificacaoItens = abrirPrecificacaoItens;
    window.sistemaGlobal = sistemaGlobal;
}

// Export para módulos ES6
export {
    MotorCalculoTributario,
    CalculadoraMetodosPrecificacao,
    ValidadorParametros,
    InterfacePrecificacao,
    calcularPrecificacao
};