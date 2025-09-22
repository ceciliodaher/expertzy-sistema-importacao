/**
 * ComplianceCalculator.js - Phase 1: Compliance Tax Calculator
 * Migrated from legacy system to new ES6 module architecture
 * 
 * Handles ONLY mandatory tax calculations for import compliance
 * Focus: II, IPI, PIS, COFINS, ICMS with correct expense inclusion
 * NO business logic, NO pricing, NO scenario analysis
 * 
 * CRITICAL FIX: Proper SISCOMEX inclusion in ICMS tax base
 * PERFORMANCE FIX: Single calculation execution (no repetitions)
 */

import ProductMemoryManager from '../memory/ProductMemoryManager.js';

export class ComplianceCalculator {
    constructor() {
        this.configuracoes = null;
        this.estadoDestino = null;
        this.calculationMemory = [];
        this.lastCalculation = null;
        this.aliquotasData = null;
        this.codigosReceita = null;
        
        this.loadConfigurations();
    }
    
    /**
     * Carrega configurações externas (sem hardcoded data)
     */
    async loadConfigurations() {
        try {
            // Carrega alíquotas ICMS
            const response = await fetch('./src/shared/data/aliquotas.json');
            this.aliquotasData = await response.json();
            
            // Carrega códigos de receita
            const codigosResponse = await fetch('/src/shared/data/codigos-receita.json');
            this.codigosReceita = await codigosResponse.json();
            
            // Estruturar configurações para acesso unificado
            this.configuracoes = {
                aliquotas: this.aliquotasData
            };
            
            console.log('[ComplianceCalculator] Configurações carregadas com sucesso');
        } catch (error) {
            console.error('[ComplianceCalculator] Erro ao carregar configurações:', error);
            throw new Error('Configurações obrigatórias não disponíveis - sistema não pode prosseguir');
        }
    }
    
    /**
     * Inicializa ItemCalculator se disponível
     */
    initializeItemCalculator() {
        try {
            if (typeof ItemCalculator !== 'undefined') {
                this.itemCalculator = new ItemCalculator();
                console.log('[ComplianceCalculator] ItemCalculator integrado');
            } else {
                console.warn('[ComplianceCalculator] ItemCalculator não disponível - cálculos por item não funcionarão');
            }
        } catch (error) {
            console.error('[ComplianceCalculator] Erro ao inicializar ItemCalculator:', error);
            this.itemCalculator = null;
        }
    }
    
    /**
     * Inicializa ProductMemoryManager
     */
    async initializeProductMemory() {
        try {
            this.productMemory = new ProductMemoryManager();
            console.log('[ComplianceCalculator] ProductMemoryManager integrado e inicializado');
        } catch (error) {
            console.error('[ComplianceCalculator] Erro ao inicializar ProductMemory:', error);
            throw new Error('ProductMemoryManager obrigatório não pode ser inicializado - sistema não pode prosseguir');
        }
    }

    /**
     * Calcular impostos para TODAS as adições de uma DI
     * @param {object} di - Objeto DI completo com todas as adições
     * @param {object} despesasConsolidadas - Despesas totais da DI
     * @returns {object} Cálculo consolidado de todas as adições
     */
    async calcularTodasAdicoes(di, despesasConsolidadas = null) {
        console.log('📋 ComplianceCalculator: Processando DI completa com múltiplas adições...');
        
        if (!di || !di.adicoes || di.adicoes.length === 0) {
            throw new Error('DI sem adições válidas para cálculo');
        }
        
        // Validar que estado foi configurado (deve ser feito externamente antes de chamar este método)
        if (!this.estadoDestino) {
            throw new Error('Estado destino não configurado - ComplianceCalculator requer estado definido via setEstadoDestino()');
        }
        
        // Verificar se ItemCalculator está disponível antes do uso
        if (!this.itemCalculator) {
            throw new Error('ItemCalculator não disponível - obrigatório para cálculos por item');
        }
        
        // Configurar DI data para ItemCalculator usar em rateios
        this.itemCalculator.setDIData(di);
        
        // Configurar ICMS para ItemCalculator - obrigatório para cálculos por item
        const aliquotaICMS = this.obterAliquotaICMS(this.estadoDestino);
        
        // Verificar se há configurações NCM específicas disponíveis globalmente
        const ncmConfigs = window.icmsConfig?.ncmConfigs || {};
        
        this.itemCalculator.atualizarConfigICMS({
            estado: this.estadoDestino,
            aliquotaPadrao: aliquotaICMS,
            ncmConfigs: ncmConfigs // Usar configurações NCM-específicas se disponíveis
        });
        
        console.log(`📊 ItemCalculator configurado com ICMS: Estado ${this.estadoDestino}, Alíquota padrão ${aliquotaICMS}%, NCMs personalizados: ${Object.keys(ncmConfigs).length}`);
        
        const totalAdicoes = di.adicoes.length;
        console.log(`  Total de adições a processar: ${totalAdicoes}`);
        
        // Arrays para armazenar cálculos individuais
        const calculosIndividuais = [];
        const resumoPorAdicao = [];
        const produtosIndividuais = []; // Array para produtos com impostos individuais
        
        // Calcular valor total da DI para rateio proporcional
        const valorTotalDI = di.adicoes.reduce((sum, ad) => {
            if (!ad.valor_reais) {
                throw new Error(`Valor em reais ausente na adição ${ad.numero_adicao}`);
            }
            return sum + ad.valor_reais;
        }, 0);
        
        // Processar cada adição E seus produtos individuais
        for (let i = 0; i < di.adicoes.length; i++) {
            const adicao = di.adicoes[i];
            console.log(`  Processando adição ${i + 1}/${totalAdicoes}: NCM ${adicao.ncm}`);
            
            // Calcular despesas proporcionais para esta adição
            let despesasAdicao = null;
            if (despesasConsolidadas && valorTotalDI > 0) {
                const proporcao = adicao.valor_reais / valorTotalDI;
                despesasAdicao = {
                    automaticas: {
                        siscomex: despesasConsolidadas.automaticas.siscomex * proporcao,
                        afrmm: despesasConsolidadas.automaticas.afrmm * proporcao,
                        capatazia: despesasConsolidadas.automaticas.capatazia * proporcao,
                        total: despesasConsolidadas.automaticas.total * proporcao
                    },
                    extras: {
                        total_icms: despesasConsolidadas.extras?.total_icms ? despesasConsolidadas.extras.total_icms * proporcao : 0,
                        total: despesasConsolidadas.extras?.total ? despesasConsolidadas.extras.total * proporcao : 0
                    },
                    totais: {
                        tributavel_icms: despesasConsolidadas.totais.tributavel_icms * proporcao
                    }
                };
            }
            
            // Calcular impostos para esta adição
            const calculoAdicao = this.calcularImpostosImportacao(adicao, despesasAdicao);
            calculosIndividuais.push(calculoAdicao);
            
            // NOVO: Calcular impostos para cada produto individual usando ItemCalculator
            if (adicao.produtos && adicao.produtos.length > 0) {
                // Passar despesas totais da DI - ItemCalculator fará o rateio correto
                const despesasTotaisDI = despesasConsolidadas ? {
                    total_despesas_aduaneiras: despesasConsolidadas.totais?.tributavel_icms || despesasConsolidadas.automaticas?.total
                } : null;
                
                const resultadoItens = this.itemCalculator.processarItensAdicao(
                    adicao, 
                    despesasTotaisDI,
                    null
                );
                
                // Adicionar produtos calculados ao array global
                resultadoItens.itens.forEach((item, index) => {
                    produtosIndividuais.push({
                        adicao_numero: adicao.numero_adicao,
                        produto_index: index + 1,
                        ncm: adicao.ncm,
                        descricao: item.produto.descricao,
                        codigo: item.produto.codigo,                    // Real code from DI
                        unidade_medida: item.produto.unidade_medida,   // Real unit from DI
                        valor_unitario_brl: item.produto.valor_unitario,
                        valor_total_brl: item.valorItem,
                        quantidade: item.produto.quantidade,
                        ii_item: item.tributos.ii.valor,
                        ipi_item: item.tributos.ipi.valor, 
                        pis_item: item.tributos.pis.valor,
                        cofins_item: item.tributos.cofins.valor,
                        icms_item: item.valorICMS,
                        base_icms_item: item.baseICMS
                    });
                });
                
                console.log(`    ✅ ${resultadoItens.itens.length} produtos processados individualmente`);
            }
            
            // Guardar resumo
            resumoPorAdicao.push({
                numero: adicao.numero_adicao,
                ncm: adicao.ncm,
                valor: adicao.valor_reais,
                peso: adicao.peso_liquido,
                impostos: {
                    ii: calculoAdicao.impostos.ii.valor_devido,
                    ipi: calculoAdicao.impostos.ipi.valor_devido,
                    pis: calculoAdicao.impostos.pis.valor_devido,
                    cofins: calculoAdicao.impostos.cofins.valor_devido,
                    icms: calculoAdicao.impostos.icms?.valor_devido
                }
            });
        }
        
        // Consolidar totais incluindo produtos individuais e despesas originais
        const totaisConsolidados = this.consolidarTotaisDI(calculosIndividuais, resumoPorAdicao, produtosIndividuais, despesasConsolidadas, di);
        
        console.log('✅ DI processada com sucesso:', {
            adicoes: totalAdicoes,
            produtos: produtosIndividuais.length,
            'II Total': `R$ ${totaisConsolidados.impostos.ii.valor_devido.toFixed(2)}`,
            'IPI Total': `R$ ${totaisConsolidados.impostos.ipi.valor_devido.toFixed(2)}`,
            'PIS Total': `R$ ${totaisConsolidados.impostos.pis.valor_devido.toFixed(2)}`,
            'COFINS Total': `R$ ${totaisConsolidados.impostos.cofins.valor_devido.toFixed(2)}`
        });
        
        // Validação automática comparando com totais extraídos do XML
        this.validarTotaisComXML(di, totaisConsolidados);
        
        // NOVA FUNCIONALIDADE: Salvar produtos na memória para sistema de precificação
        await this.salvarProdutosNaMemoria(di, totaisConsolidados, despesasConsolidadas);
        
        // INTEGRAÇÃO: Salvar no IndexedDB (NO FALLBACKS)
        await this.atualizarDISalvaComCalculos(di, totaisConsolidados, despesasConsolidadas);
        
        return totaisConsolidados;
    }
    
    /**
     * Consolidar totais de todas as adições incluindo produtos individuais com rateio completo
     * @private
     */
    consolidarTotaisDI(calculosIndividuais, resumos, produtosIndividuais = [], despesasConsolidadas = null, di = null) {
        // Somar todos os impostos
        const totais = {
            ii: 0,
            ipi: 0,
            pis: 0,
            cofins: 0,
            icms: 0,
            valor_aduaneiro: 0,
            despesas: 0,
            peso_total: 0
        };
        
        calculosIndividuais.forEach(calc => {
            // Impostos já calculados - devem existir (podem ser zero mas a estrutura deve existir)
            totais.ii += calc.impostos.ii.valor_devido;
            totais.ipi += calc.impostos.ipi.valor_devido;
            totais.pis += calc.impostos.pis.valor_devido;
            totais.cofins += calc.impostos.cofins.valor_devido;
            totais.icms += calc.impostos.icms.valor_devido;
            totais.valor_aduaneiro += calc.valores_base.cif_brl;
            totais.despesas += calc.despesas.total_custos;
            totais.peso_total += calc.valores_base.peso_liquido;
        });
        
        const totalImpostos = totais.ii + totais.ipi + totais.pis + totais.cofins + totais.icms;
        
        // Criar adicoes_detalhes com rateio hierárquico completo
        const adicoesComRateioCompleto = this.criarAdicoesComRateioHierarquico(
            di, 
            calculosIndividuais, 
            despesasConsolidadas,
            resumos
        );
        
        return {
            tipo: 'DI_COMPLETA',
            numero_adicoes: calculosIndividuais.length,
            timestamp: new Date().toISOString(),
            estado: this.estadoDestino, // Estado do importador da DI
            ncm: resumos.map(r => r.ncm).join(', '), // Lista de NCMs
            
            valores_base: {
                valor_aduaneiro_total: totais.valor_aduaneiro,
                despesas_totais: totais.despesas,
                peso_liquido: totais.peso_total,
                taxa_cambio: calculosIndividuais[0]?.valores_base?.taxa_cambio
            },
            
            impostos: {
                ii: { 
                    valor_devido: totais.ii,
                    detalhamento: 'Soma de todas as adições'
                },
                ipi: { 
                    valor_devido: totais.ipi,
                    detalhamento: 'Soma de todas as adições'
                },
                pis: { 
                    valor_devido: totais.pis,
                    detalhamento: 'Soma de todas as adições'
                },
                cofins: { 
                    valor_devido: totais.cofins,
                    detalhamento: 'Soma de todas as adições'
                },
                icms: { 
                    valor_devido: totais.icms,
                    aliquota: this.obterAliquotaICMS(this.estadoDestino),
                    detalhamento: 'Soma de todas as adições'
                }
            },
            
            despesas: despesasConsolidadas || {
                automaticas: totais.despesas,
                extras_tributaveis: 0,
                extras_custos: 0,
                total_base_icms: totais.despesas,
                total_custos: totais.despesas
            },
            
            totais: {
                total_impostos: totalImpostos,
                custo_total: totais.valor_aduaneiro + totais.despesas + totalImpostos,
                custo_por_kg: totais.peso_total > 0 ? 
                    (totais.valor_aduaneiro + totais.despesas + totalImpostos) / totais.peso_total : 0
            },
            
            adicoes_detalhes: adicoesComRateioCompleto,
            calculos_individuais: calculosIndividuais,
            produtos_individuais: produtosIndividuais, // NOVO: Produtos com tributos por item
            
            // Metadados para rastreabilidade
            estado: this.estadoDestino,
            data_calculo: new Date().toISOString(),
            versao: '2.0'
        };
    }
    
    /**
     * Criar estrutura de adições com rateio hierárquico completo (DI → Adição → Item)
     * KISS: Apenas ratear valores já calculados, zero é válido
     * @private
     */
    criarAdicoesComRateioHierarquico(di, calculosIndividuais, despesasConsolidadas, resumos) {
        const valorTotalDI = di.adicoes.reduce((sum, ad) => sum + ad.valor_reais, 0);
        
        // Valores para rateio 
        const freteTotalDI = di.frete_brl;
        const seguroTotalDI = di.seguro_brl;
        const afrmm = despesasConsolidadas.automaticas.afrmm;
        const siscomex = despesasConsolidadas.automaticas.siscomex;
        const capatazia = despesasConsolidadas.automaticas.capatazia;
        
        return di.adicoes.map((adicao, index) => {
            const calculoAdicao = calculosIndividuais[index];
            
            // RATEIO NÍVEL 1: DI → Adição
            const proporcaoAdicao = adicao.valor_reais / valorTotalDI;
            
            const despesasRateadasAdicao = {
                frete: freteTotalDI * proporcaoAdicao,
                seguro: seguroTotalDI * proporcaoAdicao,
                afrmm: afrmm * proporcaoAdicao,
                siscomex: siscomex * proporcaoAdicao,
                capatazia: capatazia * proporcaoAdicao,
                total: (freteTotalDI + seguroTotalDI + afrmm + siscomex + capatazia) * proporcaoAdicao
            };
            
            // RATEIO NÍVEL 2: Adição → Produtos
            let produtosComRateio = [];
            if (adicao.produtos && adicao.produtos.length > 0) {
                const valorTotalProdutosAdicao = adicao.produtos.reduce(
                    (sum, p) => sum + p.valor_total_brl, 0
                );
                
                produtosComRateio = adicao.produtos.map(produto => {
                    const proporcaoProduto = produto.valor_total_brl / valorTotalProdutosAdicao;
                    
                    // Rateio das despesas do produto
                    const despesasProduto = {
                        frete: despesasRateadasAdicao.frete * proporcaoProduto,
                        seguro: despesasRateadasAdicao.seguro * proporcaoProduto,
                        afrmm: despesasRateadasAdicao.afrmm * proporcaoProduto,
                        siscomex: despesasRateadasAdicao.siscomex * proporcaoProduto,
                        capatazia: despesasRateadasAdicao.capatazia * proporcaoProduto,
                        total: despesasRateadasAdicao.total * proporcaoProduto
                    };
                    
                    // Rateio dos impostos (valores já calculados)
                    const impostosProduto = {
                        ii: calculoAdicao.impostos.ii.valor_devido * proporcaoProduto,
                        ipi: calculoAdicao.impostos.ipi.valor_devido * proporcaoProduto,
                        pis: calculoAdicao.impostos.pis.valor_devido * proporcaoProduto,
                        cofins: calculoAdicao.impostos.cofins.valor_devido * proporcaoProduto,
                        icms: calculoAdicao.impostos.icms.valor_devido * proporcaoProduto
                    };
                    
                    const custoTotalItem = produto.valor_total_brl + 
                                          despesasProduto.total + 
                                          impostosProduto.ii + 
                                          impostosProduto.ipi + 
                                          impostosProduto.pis + 
                                          impostosProduto.cofins + 
                                          impostosProduto.icms;
                    
                    return {
                        ...produto,
                        despesas_rateadas: despesasProduto,
                        impostos_item: impostosProduto,
                        custo_total_item: custoTotalItem
                    };
                });
            }
            
            const custoTotalAdicao = adicao.valor_reais +
                                    despesasRateadasAdicao.total +
                                    calculoAdicao.impostos.ii.valor_devido +
                                    calculoAdicao.impostos.ipi.valor_devido +
                                    calculoAdicao.impostos.pis.valor_devido +
                                    calculoAdicao.impostos.cofins.valor_devido +
                                    calculoAdicao.impostos.icms.valor_devido;
            
            return {
                numero_adicao: adicao.numero_adicao,
                ncm: adicao.ncm,
                incoterm: adicao.condicao_venda_incoterm,
                valor_aduaneiro: adicao.valor_reais,
                peso_liquido: adicao.peso_liquido,
                despesas_rateadas: despesasRateadasAdicao,
                impostos: {
                    ii: calculoAdicao.impostos.ii.valor_devido,
                    ipi: calculoAdicao.impostos.ipi.valor_devido,
                    pis: calculoAdicao.impostos.pis.valor_devido,
                    cofins: calculoAdicao.impostos.cofins.valor_devido,
                    icms: calculoAdicao.impostos.icms.valor_devido
                },
                produtos_com_rateio: produtosComRateio,
                custo_total: custoTotalAdicao
            };
        });
    }
    
    /**
     * Validar totais calculados vs totais extraídos do XML
     * @private
     */
    validarTotaisComXML(di, totaisCalculados) {
        // Obter totais extraídos pelo DIProcessor
        const totaisXML = di.totals?.tributos_totais;
        
        if (!totaisXML) {
            console.log('⚠️ Totais de tributos não encontrados no XML extraído');
            return;
        }
        
        const calculados = {
            ii: totaisCalculados.impostos.ii.valor_devido,
            ipi: totaisCalculados.impostos.ipi.valor_devido,
            pis: totaisCalculados.impostos.pis.valor_devido,
            cofins: totaisCalculados.impostos.cofins.valor_devido
        };
        
        const extraidos = {
            ii: totaisXML.ii_total,
            ipi: totaisXML.ipi_total,
            pis: totaisXML.pis_total,
            cofins: totaisXML.cofins_total
        };
        
        console.log('🔍 VALIDAÇÃO AUTOMÁTICA - Calculados vs XML:');
        console.log('==========================================');
        
        let temDiferenca = false;
        const tolerancia = 0.10; // 10 centavos de tolerância
        
        Object.keys(calculados).forEach(imposto => {
            const calculado = calculados[imposto];
            const extraido = extraidos[imposto];
            const diferenca = Math.abs(extraido - calculado);
            
            if (diferenca > tolerancia) {
                const percentual = extraido > 0 ? (diferenca / extraido * 100).toFixed(2) : '100.00';
                console.log(`❌ ${imposto.toUpperCase()}: XML R$ ${extraido.toFixed(2)} | Calc R$ ${calculado.toFixed(2)} | Diferença: R$ ${diferenca.toFixed(2)} (${percentual}%)`);
                temDiferenca = true;
            } else {
                console.log(`✅ ${imposto.toUpperCase()}: R$ ${calculado.toFixed(2)} ✓`);
            }
        });
        
        if (!temDiferenca) {
            console.log('🎉 TODOS OS CÁLCULOS ESTÃO CONSISTENTES COM O XML!');
        } else {
            console.log('⚠️ ATENÇÃO: Diferenças encontradas entre cálculos e XML');
            console.log('   Verifique se todas as adições foram processadas corretamente');
        }
        
        console.log('==========================================');
    }

    /**
     * Carrega configurações fiscais (alíquotas, regimes) - USANDO ARQUIVOS EXISTENTES
     */
    async carregarConfiguracoes() {
        try {
            console.log('📂 ComplianceCalculator: Carregando configurações fiscais...');
            
            // Carregar arquivos de configuração existentes (como no sistema legado)
            const [aliquotasResponse, beneficiosResponse, configResponse] = await Promise.all([
                fetch('./src/shared/data/aliquotas.json'),
                fetch('../shared/data/beneficios.json'),
                fetch('../shared/data/config.json')
            ]);

            if (!aliquotasResponse.ok || !beneficiosResponse.ok || !configResponse.ok) {
                throw new Error('Erro ao carregar arquivos de configuração');
            }

            const aliquotas = await aliquotasResponse.json();
            const beneficios = await beneficiosResponse.json();
            const config = await configResponse.json();

            // Estruturar configurações no formato esperado
            this.configuracoes = {
                aliquotas: aliquotas,
                beneficios: beneficios,
                config: config,
                versao: config.versao || '2025.1'
            };

            console.log('✅ Configurações fiscais carregadas:', {
                aliquotas: aliquotas.versao,
                beneficios: beneficios.versao,
                config: config.versao
            });
            
        } catch (error) {
            console.error('❌ Erro ao carregar configurações:', error);
            throw new Error('Falha crítica ao carregar configurações fiscais. Sistema não pode funcionar sem elas.');
        }
    }


    /**
     * Calcula impostos de importação para uma adição da DI
     * ENTRADA: Dados da DI + despesas consolidadas
     * SAÍDA: Estrutura completa de impostos calculados
     */
    calcularImpostosImportacao(adicao, despesasConsolidadas = null) {
        console.log('🧮 ComplianceCalculator: Iniciando cálculo de impostos...');
        
        try {
            // Validar entrada
            if (!adicao || !adicao.valor_reais) {
                throw new Error('Dados da adição inválidos para cálculo');
            }

            const calculo = {
                adicao_numero: adicao.numero_adicao,
                ncm: adicao.ncm,
                timestamp: new Date().toISOString(),
                
                // Valores base
                valores_base: {
                    cif_usd: adicao.valor_moeda_negociacao,
                    cif_brl: adicao.valor_reais,
                    taxa_cambio: adicao.taxa_cambio,
                    peso_liquido: adicao.peso_liquido
                },

                // Despesas
                despesas: this.processarDespesas(despesasConsolidadas),
                
                // Impostos calculados
                impostos: {},
                
                // Totais
                totais: {},
                
                // Estado e benefícios
                estado: this.estadoDestino,
                beneficios: {}
            };

            // 1. Calcular II (Imposto de Importação)
            calculo.impostos.ii = this.calcularII(adicao, calculo.valores_base);
            
            // 2. Calcular IPI 
            calculo.impostos.ipi = this.calcularIPI(adicao, calculo.valores_base, calculo.impostos.ii);
            
            // 3. Calcular PIS/COFINS
            calculo.impostos.pis = this.calcularPIS(adicao, calculo.valores_base);
            calculo.impostos.cofins = this.calcularCOFINS(adicao, calculo.valores_base);
            
            // 4. Calcular ICMS (com despesas incluídas corretamente)
            calculo.impostos.icms = this.calcularICMS(adicao, calculo);
            
            // 5. Calcular totais finais
            calculo.totais = this.calcularTotais(calculo);
            
            // 6. Aplicar benefícios fiscais se aplicáveis
            calculo.beneficios = this.aplicarBeneficios(calculo);
            
            // Salvar cálculo na memória
            this.salvarCalculoMemoria(calculo);
            this.lastCalculation = calculo;
            
            console.log('✅ ComplianceCalculator: Cálculo de impostos concluído');
            console.log('📊 Resumo:', {
                CIF: `R$ ${calculo.valores_base.cif_brl.toFixed(2)}`,
                II: `R$ ${calculo.impostos.ii.valor_devido.toFixed(2)}`,
                IPI: `R$ ${calculo.impostos.ipi.valor_devido.toFixed(2)}`,
                PIS: `R$ ${calculo.impostos.pis.valor_devido.toFixed(2)}`,
                COFINS: `R$ ${calculo.impostos.cofins.valor_devido.toFixed(2)}`,
                ICMS: `R$ ${calculo.impostos.icms.valor_devido.toFixed(2)}`,
                'Total Impostos': `R$ ${calculo.totais.total_impostos.toFixed(2)}`,
                'Custo Total': `R$ ${calculo.totais.custo_total.toFixed(2)}`
            });
            
            return calculo;
            
        } catch (error) {
            console.error('❌ ComplianceCalculator: Erro no cálculo:', error);
            throw error;
        }
    }

    /**
     * Processa e consolida despesas para cálculo
     * CRÍTICO: Inclui SISCOMEX corretamente na base ICMS
     */
    processarDespesas(despesasConsolidadas) {
        if (!despesasConsolidadas) {
            console.warn('⚠️ Despesas consolidadas não fornecidas - usando zero para cálculo');
            return {
                automaticas: 0,
                extras_tributaveis: 0,
                extras_custos: 0,
                total_base_icms: 0,
                total_custos: 0
            };
        }

        // Validar estrutura de despesas
        if (!despesasConsolidadas.automaticas || typeof despesasConsolidadas.automaticas.total === 'undefined') {
            throw new Error('Estrutura de despesas automáticas inválida ou ausente');
        }

        const despesas = {
            // Despesas automáticas da DI (sempre na base ICMS)
            automaticas: despesasConsolidadas.automaticas.total,
            
            // Despesas extras classificadas pelo usuário (podem ser zero)
            extras_tributaveis: despesasConsolidadas.extras?.total_icms || 0,
            extras_custos: (despesasConsolidadas.extras?.total || 0) - (despesasConsolidadas.extras?.total_icms || 0),
            
            // Totais para diferentes fins
            total_base_icms: 0,
            total_custos: 0
        };

        // CRÍTICO: SISCOMEX sempre na base ICMS
        despesas.total_base_icms = despesas.automaticas + despesas.extras_tributaveis;
        despesas.total_custos = despesas.automaticas + despesas.extras_tributaveis + despesas.extras_custos;

        console.log('💰 Despesas consolidadas incluídas na base ICMS:', `R$ ${despesas.total_base_icms.toFixed(2)}`);
        console.log('📊 Detalhamento:', `Automáticas R$ ${despesas.automaticas.toFixed(2)} + Extras tributáveis R$ ${despesas.extras_tributaveis.toFixed(2)}`);

        return despesas;
    }

    /**
     * Calcula II - Imposto de Importação
     */
    calcularII(adicao, valoresBase) {
        if (!adicao.tributos || adicao.tributos.ii_aliquota_ad_valorem === null || adicao.tributos.ii_aliquota_ad_valorem === undefined) {
            throw new Error('Dados de II não encontrados na DI');
        }
        
        // Usar valores já extraídos da DI (conforme POP de Impostos)
        const aliquota = adicao.tributos.ii_aliquota_ad_valorem;
        const valorDevido = adicao.tributos.ii_valor_devido;
        const baseCalculo = valoresBase.cif_brl;
        
        return {
            aliquota: aliquota,
            base_calculo: baseCalculo,
            valor_calculado: valorDevido,
            valor_devido: valorDevido,
            regime: adicao.tributos?.ii_regime_nome || 'RECOLHIMENTO INTEGRAL'
        };
    }

    /**
     * Calcula IPI 
     */
    calcularIPI(adicao, valoresBase, ii) {
        if (!adicao.tributos || adicao.tributos.ipi_aliquota_ad_valorem === null || adicao.tributos.ipi_aliquota_ad_valorem === undefined) {
            throw new Error('Dados de IPI não encontrados na DI');
        }
        
        // Usar valores já extraídos da DI (conforme POP de Impostos)
        const aliquota = adicao.tributos.ipi_aliquota_ad_valorem;
        const valorDevido = adicao.tributos.ipi_valor_devido;
        const baseCalculo = valoresBase.cif_brl + ii.valor_devido;
        
        return {
            aliquota: aliquota,
            base_calculo: baseCalculo,
            valor_calculado: valorDevido,
            valor_devido: valorDevido,
            regime: adicao.tributos?.ipi_regime_nome || 'SEM BENEFÍCIO'
        };
    }

    /**
     * Calcula PIS
     */
    calcularPIS(adicao, valoresBase) {
        if (!adicao.tributos || adicao.tributos.pis_aliquota_ad_valorem === null || adicao.tributos.pis_aliquota_ad_valorem === undefined) {
            throw new Error('Dados de PIS não encontrados na DI');
        }
        
        // Usar valores já extraídos da DI (conforme POP de Impostos)
        const aliquota = adicao.tributos.pis_aliquota_ad_valorem;
        const valorDevido = adicao.tributos.pis_valor_devido;
        const baseCalculo = valoresBase.cif_brl;
        
        return {
            aliquota: aliquota,
            base_calculo: baseCalculo,
            valor_calculado: valorDevido,
            valor_devido: valorDevido
        };
    }

    /**
     * Calcula COFINS
     */
    calcularCOFINS(adicao, valoresBase) {
        if (!adicao.tributos || adicao.tributos.cofins_aliquota_ad_valorem === null || adicao.tributos.cofins_aliquota_ad_valorem === undefined) {
            throw new Error('Dados de COFINS não encontrados na DI');
        }
        
        // Usar valores já extraídos da DI (conforme POP de Impostos)
        const aliquota = adicao.tributos.cofins_aliquota_ad_valorem;
        const valorDevido = adicao.tributos.cofins_valor_devido;
        const baseCalculo = valoresBase.cif_brl;
        
        return {
            aliquota: aliquota,
            base_calculo: baseCalculo,
            valor_calculado: valorDevido,
            valor_devido: valorDevido
        };
    }

    /**
     * Calcula ICMS com despesas incluídas corretamente
     * CRÍTICO: Base ICMS deve incluir SISCOMEX e outras despesas
     */
    calcularICMS(adicao, calculo) {
        const aliquotaICMS = this.obterAliquotaICMS(this.estadoDestino);
        
        // Base ICMS = CIF + II + IPI + PIS + COFINS + DESPESAS ADUANEIRAS
        const baseAntes = 
            calculo.valores_base.cif_brl +
            calculo.impostos.ii.valor_devido +
            calculo.impostos.ipi.valor_devido +
            calculo.impostos.pis.valor_devido +
            calculo.impostos.cofins.valor_devido +
            calculo.despesas.total_base_icms; // INCLUI SISCOMEX!

        console.log('📊 Cálculo Base ICMS (Calculator):');
        console.log(`        - Base antes ICMS: R$ ${baseAntes.toFixed(2)}`);
        console.log(`        - Alíquota ICMS: ${aliquotaICMS}%`);
        
        // Fator de divisão para ICMS por dentro
        const fatorDivisao = 1 - (aliquotaICMS / 100);
        console.log(`        - Fator divisão: ${fatorDivisao.toFixed(4)}`);
        
        // Base ICMS final (com ICMS por dentro)
        const baseICMS = baseAntes / fatorDivisao;
        console.log(`        - Base ICMS final: R$ ${baseICMS.toFixed(2)}`);
        
        // Valor ICMS devido
        const valorICMS = baseICMS - baseAntes;
        
        return {
            aliquota: aliquotaICMS,
            base_calculo_antes: baseAntes,
            base_calculo_final: baseICMS,
            fator_divisao: fatorDivisao,
            valor_devido: valorICMS,
            despesas_inclusas: calculo.despesas.total_base_icms
        };
    }

    /**
     * Calcula totais finais
     */
    calcularTotais(calculo) {
        const totalImpostos = 
            calculo.impostos.ii.valor_devido +
            calculo.impostos.ipi.valor_devido +
            calculo.impostos.pis.valor_devido +
            calculo.impostos.cofins.valor_devido +
            calculo.impostos.icms.valor_devido;

        const custoTotal = 
            calculo.valores_base.cif_brl +
            totalImpostos +
            calculo.despesas.total_custos;

        return {
            total_impostos: totalImpostos,
            custo_total: custoTotal,
            custo_por_kg: calculo.valores_base.peso_liquido > 0 ? custoTotal / calculo.valores_base.peso_liquido : 0
        };
    }

    /**
     * Aplica benefícios fiscais por estado
     */
    aplicarBeneficios(calculo) {
        const beneficios = this.configuracoes?.beneficios?.[this.estadoDestino];
        
        if (!beneficios) {
            return { aplicado: false, motivo: 'Sem benefícios para o estado' };
        }

        // Verificar se NCM tem benefício
        const ncmBeneficiado = this.verificarNCMBeneficiado(calculo.ncm, beneficios);
        
        if (!ncmBeneficiado) {
            return { aplicado: false, motivo: 'NCM não contemplado nos benefícios' };
        }

        // Aplicar benefício conforme tipo
        switch (beneficios.tipo) {
            case 'credito_icms':
                return this.aplicarCreditoICMS(calculo, beneficios);
            case 'diferimento':
                return this.aplicarDiferimento(calculo, beneficios);
            case 'fundap':
                return this.aplicarFUNDAP(calculo, beneficios);
            default:
                return { aplicado: false, motivo: 'Tipo de benefício desconhecido' };
        }
    }

    /**
     * Obter alíquotas por NCM (simplificado - pode ser expandido)
     */
    obterAliquotaII(ncm) {
        if (!this.configuracoes || !this.configuracoes.aliquotas) {
            throw new Error('Configurações fiscais não carregadas');
        }
        
        // Usar alíquota do II extraída da DI ou configuração específica por NCM
        return this.configuracoes.aliquotas.ii && this.configuracoes.aliquotas.ii[ncm] ? 
               this.configuracoes.aliquotas.ii[ncm] : 0;
    }

    obterAliquotaIPI(ncm) {
        if (!this.configuracoes || !this.configuracoes.aliquotas) {
            throw new Error('Configurações fiscais não carregadas');
        }
        
        // Usar alíquota do IPI extraída da DI ou configuração específica por NCM
        return this.configuracoes.aliquotas.ipi && this.configuracoes.aliquotas.ipi[ncm] ? 
               this.configuracoes.aliquotas.ipi[ncm] : 0;
    }

    obterAliquotaICMS(estado) {
        if (!this.configuracoes || !this.configuracoes.aliquotas || !this.configuracoes.aliquotas.aliquotas_icms_2025) {
            throw new Error('Configurações de ICMS não carregadas');
        }
        
        const aliquotaEstado = this.configuracoes.aliquotas.aliquotas_icms_2025[estado];
        if (!aliquotaEstado || !aliquotaEstado.aliquota_interna) {
            throw new Error(`Alíquota ICMS não encontrada para o estado: ${estado}`);
        }
        
        return aliquotaEstado.aliquota_interna;
    }

    /**
     * Verifica se NCM tem benefício
     */
    verificarNCMBeneficiado(ncm, beneficios) {
        if (!beneficios.ncms_beneficiados) return true;
        
        return beneficios.ncms_beneficiados.some(ncm_pattern => 
            ncm.startsWith(ncm_pattern)
        );
    }

    /**
     * Aplica crédito ICMS (ex: Goiás 67%)
     */
    aplicarCreditoICMS(calculo, beneficios) {
        const creditoPercentual = beneficios.percentual;
        const valorCredito = calculo.impostos.icms.valor_devido * (creditoPercentual / 100);
        const icmsLiquido = calculo.impostos.icms.valor_devido - valorCredito;
        
        return {
            aplicado: true,
            tipo: 'credito_icms',
            percentual: creditoPercentual,
            valor_credito: valorCredito,
            icms_original: calculo.impostos.icms.valor_devido,
            icms_liquido: icmsLiquido,
            economia: valorCredito
        };
    }

    /**
     * Aplica diferimento ICMS (ex: SC 75%)
     */
    aplicarDiferimento(calculo, beneficios) {
        const percentualDiferido = beneficios.percentual;
        const valorDiferido = calculo.impostos.icms.valor_devido * (percentualDiferido / 100);
        const icmsRecolher = calculo.impostos.icms.valor_devido - valorDiferido;
        
        return {
            aplicado: true,
            tipo: 'diferimento',
            percentual: percentualDiferido,
            codigo: beneficios.codigo,
            valor_diferido: valorDiferido,
            icms_original: calculo.impostos.icms.valor_devido,
            icms_recolher: icmsRecolher,
            economia_fluxo: valorDiferido
        };
    }

    /**
     * Aplica FUNDAP (ES)
     */
    aplicarFUNDAP(calculo, beneficios) {
        const aliquotaOriginal = calculo.impostos.icms.aliquota;
        const aliquotaEfetiva = beneficios.aliquota_efetiva;
        const icmsEfetivo = calculo.impostos.icms.base_calculo_final * (aliquotaEfetiva / 100);
        const economia = calculo.impostos.icms.valor_devido - icmsEfetivo;
        
        return {
            aplicado: true,
            tipo: 'fundap',
            aliquota_original: aliquotaOriginal,
            aliquota_efetiva: aliquotaEfetiva,
            icms_original: calculo.impostos.icms.valor_devido,
            icms_efetivo: icmsEfetivo,
            economia: economia
        };
    }

    /**
     * Salva cálculo na memória para auditoria
     */
    salvarCalculoMemoria(calculo) {
        this.calculationMemory.push({
            id: `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: calculo.timestamp,
            tipo: 'IMPOSTOS_IMPORTACAO',
            adicao: calculo.adicao_numero,
            resumo: calculo.totais,
            detalhes: calculo
        });

        // Manter apenas últimos 50 cálculos
        if (this.calculationMemory.length > 50) {
            this.calculationMemory = this.calculationMemory.slice(-50);
        }
    }

    /**
     * Define estado de destino
     */
    setEstadoDestino(estado) {
        if (!estado) {
            throw new Error('Estado destino é obrigatório');
        }
        this.estadoDestino = estado;
        console.log(`📍 Estado destino definido: ${estado}`);
    }

    /**
     * Obtém último cálculo realizado
     */
    getUltimoCalculo() {
        return this.lastCalculation;
    }

    /**
     * Obtém histórico de cálculos
     */
    getHistoricoCalculos() {
        return this.calculationMemory;
    }

    /**
     * Limpa cache de cálculos
     */
    limparCache() {
        this.calculationMemory = [];
        this.lastCalculation = null;
        console.log('🧹 Cache de cálculos limpo');
    }
    
    /**
     * NOVA FUNCIONALIDADE: Salva produtos na memória para sistema de precificação
     * @param {Object} di - Dados da DI
     * @param {Object} totaisConsolidados - Resultados do cálculo
     * @param {Object} despesasConsolidadas - Despesas consolidadas
     */
    async salvarProdutosNaMemoria(di, totaisConsolidados, despesasConsolidadas) {
        if (!this.productMemory) {
            throw new Error('ProductMemoryManager não disponível - obrigatório para funcionamento do sistema');
        }
        
        if (!di?.numero_di) {
            throw new Error('DI sem número válido - obrigatório para salvamento');
        }

        if (!di?.adicoes || di.adicoes.length === 0) {
            throw new Error('DI sem adições válidas - obrigatório para salvamento');
        }
        
        try {
            console.log('💾 Salvando produtos na memória para sistema de precificação...');
            
            // Extrair dados relevantes da DI para salvar produtos estruturados
            const diNumber = di.numero_di;
            const additions = di.adicoes;
            
            // Usar método específico do ProductMemoryManager para salvar dados da DI
            const savedProducts = await this.productMemory.saveProductsFromDI(
                diNumber, 
                additions, 
                totaisConsolidados
            );
            
            console.log(`✅ ${savedProducts.length} produtos salvos na memória para precificação`);
            
            // Opcional: Notificar outros sistemas que produtos foram salvos
            this.notifyProductsSaved(savedProducts);
            
            return savedProducts;
            
        } catch (error) {
            console.error('❌ Erro ao salvar produtos na memória:', error);
            throw new Error(`Falha ao salvar produtos: ${error.message}`);
        }
    }
    
    /**
     * Notifica outros sistemas que produtos foram salvos
     * @param {Array} products - Produtos salvos
     */
    notifyProductsSaved(products) {
        try {
            // Dispatch event para outros sistemas
            const event = new CustomEvent('productsMemorySaved', {
                detail: {
                    products: products,
                    count: products.length,
                    timestamp: new Date().toISOString()
                }
            });
            
            if (typeof window !== 'undefined') {
                window.dispatchEvent(event);
            }
            
            console.log(`📡 Evento 'productsMemorySaved' disparado para ${products.length} produtos`);
            
        } catch (error) {
            console.error('❌ Erro ao notificar salvamento de produtos:', error);
        }
    }
    
    /**
     * INTEGRAÇÃO: Atualiza DI salva no IndexedDB com cálculos completos - NO FALLBACKS
     * @param {Object} di - Dados da DI processada
     * @param {Object} totaisConsolidados - Totais calculados
     * @param {Object} despesasConsolidadas - Despesas consolidadas
     */
    async atualizarDISalvaComCalculos(di, totaisConsolidados, despesasConsolidadas) {
        console.log('🔄 [DEBUG] atualizarDISalvaComCalculos iniciado para DI:', di?.numero_di);
        
        if (!di || !di.numero_di) {
            throw new Error('DI inválida para atualização no IndexedDB');
        }
        
        if (!totaisConsolidados) {
            throw new Error('Totais consolidados ausentes para atualização no IndexedDB');
        }
        
        if (!despesasConsolidadas) {
            throw new Error('Despesas consolidadas ausentes para atualização no IndexedDB');
        }
        
        console.log('📊 [DEBUG] Dados válidos - salvando no IndexedDB:', {
            di_numero: di.numero_di,
            total_adicoes: di.adicoes?.length,
            impostos_calculados: !!totaisConsolidados.impostos,
            despesas_processadas: !!despesasConsolidadas
        });
        
        // IndexedDB é obrigatório - NO FALLBACKS
        if (!window.dbManager) {
            throw new Error('IndexedDB não disponível - obrigatório para persistência de dados');
        }
        
        try {
            console.log('🔄 Atualizando DI salva com cálculos completos no IndexedDB...');
            
            // Recuperar DI salva anteriormente do IndexedDB
            const diSalva = await window.dbManager.getDI(di.numero_di);
            if (!diSalva) {
                throw new Error(`DI ${di.numero_di} não encontrada no IndexedDB - obrigatória para atualização de cálculos`);
            }
            
            // Validar que é a mesma DI
            if (diSalva.numero_di !== di.numero_di) {
                throw new Error(`DI no IndexedDB (${diSalva.numero_di}) não corresponde à DI calculada (${di.numero_di})`);
            }
            
            // Preparar dados de atualização com cálculos completos
            const dadosAtualizacao = {
                ...diSalva,
                integration: {
                    phase1_completed: true,
                    calculations_pending: false,
                    calculations_completed_at: new Date().toISOString()
                },
                calculoImpostos: totaisConsolidados,
                despesas: despesasConsolidadas
            };
            
            // Atualizar valores base com dados finais
            if (totaisConsolidados.valores_base) {
                dadosAtualizacao.valores_base_finais = {
                    cif_brl: totaisConsolidados.valores_base.cif_brl,
                    peso_liquido: totaisConsolidados.valores_base.peso_liquido,
                    taxa_cambio: di.taxa_cambio
                };
            }
            
            // Salvar configuração de DI processada
            await window.dbManager.saveConfig(`di_processed_${di.numero_di}`, dadosAtualizacao);
            
            // Validar que atualização funcionou - NO FALLBACKS
            const verificacao = await window.dbManager.getConfig(`di_processed_${di.numero_di}`);
            if (!verificacao) {
                throw new Error('Falha crítica ao atualizar DI no IndexedDB - dados não persistidos');
            }
            
            if (!verificacao.integration?.phase1_completed) {
                throw new Error('Atualização de DI no IndexedDB não foi aplicada corretamente - estado inconsistente');
            }
            
            console.log(`✅ DI ${di.numero_di} atualizada no IndexedDB com cálculos completos - pronta para precificação`);
            
        } catch (error) {
            console.error('❌ Erro crítico ao atualizar DI salva com cálculos:', error);
            // NO FALLBACKS - sempre lançar exceção para falhas de persistência
            throw new Error(`Falha na persistência de cálculos para DI ${di.numero_di}: ${error.message}`);
        }
    }
}

// Export para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComplianceCalculator;
}