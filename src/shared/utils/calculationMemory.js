/**
 * Memória de Cálculo Auditável
 * Registra todas as operações de cálculo com rastreabilidade completa
 */
class CalculationMemory {
    constructor() {
        this.operations = [];
        this.sessionId = this.generateSessionId();
        this.startTime = new Date().toISOString();
    }

    /**
     * Gera ID único da sessão de cálculo
     */
    generateSessionId() {
        return 'calc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Registra uma operação de cálculo
     */
    log(operationType, description, inputs, formula, result, metadata = {}) {
        const operation = {
            id: this.generateOperationId(),
            timestamp: new Date().toISOString(),
            type: operationType,
            description: description,
            inputs: this.sanitizeInputs(inputs),
            formula: formula,
            result: result,
            metadata: {
                ...metadata,
                stack_trace: this.getSimpleStackTrace()
            }
        };

        this.operations.push(operation);
        
        // Log no console para debug
        console.log(`[CALC MEMORY] ${operationType}: ${description}`, operation);
        
        return operation.id;
    }

    /**
     * Gera ID único da operação
     */
    generateOperationId() {
        return 'op_' + Date.now() + '_' + this.operations.length;
    }

    /**
     * Limpa inputs para evitar referências circulares
     */
    sanitizeInputs(inputs) {
        try {
            return JSON.parse(JSON.stringify(inputs));
        } catch (error) {
            return { error: 'Inputs não serializáveis', type: typeof inputs };
        }
    }

    /**
     * Obtém stack trace simplificado
     */
    getSimpleStackTrace() {
        try {
            const stack = new Error().stack;
            const lines = stack.split('\n').slice(2, 5); // Pegar algumas linhas relevantes
            return lines.map(line => line.trim());
        } catch (error) {
            return ['Stack trace não disponível'];
        }
    }

    /**
     * Registra cálculo de tributo específico
     */
    logTributeCalculation(tributo, adicao, baseCalculo, aliquota, valor, metadata = {}) {
        return this.log(
            'TRIBUTO',
            `Cálculo de ${tributo} para adição ${adicao.numero_adicao}`,
            {
                adicao_numero: adicao.numero_adicao,
                ncm: adicao.ncm,
                base_calculo: baseCalculo,
                aliquota_percentual: aliquota,
                moeda_origem: adicao.moeda_negociacao_codigo
            },
            `${tributo} = Base de Cálculo (${this.formatValue(baseCalculo)}) × Alíquota (${aliquota}%)`,
            {
                valor_calculado: valor,
                aliquota_aplicada: aliquota,
                base_utilizada: baseCalculo
            },
            {
                tributo_tipo: tributo,
                adicao_id: adicao.numero_adicao,
                ncm: adicao.ncm,
                ...metadata
            }
        );
    }

    /**
     * Registra conversão de moeda
     */
    logCurrencyConversion(valorOriginal, moedaOrigem, valorConvertido, moedaDestino, taxa, metadata = {}) {
        return this.log(
            'CONVERSAO_MOEDA',
            `Conversão de ${moedaOrigem} para ${moedaDestino}`,
            {
                valor_original: valorOriginal,
                moeda_origem: moedaOrigem,
                taxa_conversao: taxa,
                data_conversao: new Date().toISOString()
            },
            `Valor em ${moedaDestino} = ${this.formatValue(valorOriginal)} ${moedaOrigem} × Taxa ${taxa}`,
            {
                valor_convertido: valorConvertido,
                moeda_destino: moedaDestino
            },
            {
                tipo_conversao: `${moedaOrigem}_to_${moedaDestino}`,
                ...metadata
            }
        );
    }

    /**
     * Registra aplicação de benefício fiscal
     */
    logFiscalBenefit(beneficio, estado, valorOriginal, valorComBeneficio, metadata = {}) {
        const economia = valorOriginal - valorComBeneficio;
        const percentualEconomia = valorOriginal > 0 ? (economia / valorOriginal) * 100 : 0;

        return this.log(
            'BENEFICIO_FISCAL',
            `Aplicação de ${beneficio} no estado ${estado}`,
            {
                valor_original: valorOriginal,
                estado: estado,
                beneficio_tipo: beneficio,
                legislacao: metadata.legislacao || 'N/I'
            },
            `Valor com benefício = ${this.formatValue(valorOriginal)} - Benefício aplicado`,
            {
                valor_com_beneficio: valorComBeneficio,
                economia_absoluta: economia,
                economia_percentual: percentualEconomia
            },
            {
                estado: estado,
                beneficio_nome: beneficio,
                ...metadata
            }
        );
    }

    /**
     * Registra rateio de custos
     */
    logCostAllocation(custoTotal, criterioRateio, itens, metadata = {}) {
        const totalBase = itens.reduce((sum, item) => sum + (item.base_rateio || 0), 0);
        
        const rateios = itens.map(item => {
            const proporcao = totalBase > 0 ? item.base_rateio / totalBase : 0;
            const valorRateado = custoTotal * proporcao;
            
            return {
                item_id: item.id,
                base_rateio: item.base_rateio,
                proporcao: proporcao,
                valor_rateado: valorRateado
            };
        });

        return this.log(
            'RATEIO_CUSTOS',
            `Rateio de custos por ${criterioRateio}`,
            {
                custo_total: custoTotal,
                criterio: criterioRateio,
                total_base: totalBase,
                numero_itens: itens.length
            },
            `Rateio proporcional baseado em ${criterioRateio}`,
            {
                rateios: rateios,
                validacao: {
                    soma_rateios: rateios.reduce((sum, r) => sum + r.valor_rateado, 0),
                    diferenca: Math.abs(custoTotal - rateios.reduce((sum, r) => sum + r.valor_rateado, 0))
                }
            },
            {
                criterio_rateio: criterioRateio,
                ...metadata
            }
        );
    }

    /**
     * Registra cálculo de custo total
     */
    logTotalCostCalculation(item, componentes, custoTotal, metadata = {}) {
        return this.log(
            'CUSTO_TOTAL',
            `Cálculo do custo total para item ${item.id || 'N/I'}`,
            {
                item_identificacao: item.id || item.descricao || 'N/I',
                componentes_custo: componentes
            },
            `Custo Total = ${Object.keys(componentes).map(k => `${k}(${this.formatValue(componentes[k])})`).join(' + ')}`,
            {
                custo_total: custoTotal,
                componentes_detalhados: componentes,
                validacao: {
                    soma_componentes: Object.values(componentes).reduce((sum, val) => sum + (val || 0), 0)
                }
            },
            {
                item_tipo: item.tipo || 'produto',
                ...metadata
            }
        );
    }

    /**
     * Formata valor para exibição na fórmula
     */
    formatValue(value) {
        if (typeof value === 'number') {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 2
            }).format(value);
        }
        return String(value);
    }

    /**
     * Obtém operações por tipo
     */
    getOperationsByType(type) {
        return this.operations.filter(op => op.type === type);
    }

    /**
     * Obtém operações por adição
     */
    getOperationsByAdicao(numeroAdicao) {
        return this.operations.filter(op => 
            op.metadata.adicao_id === numeroAdicao || 
            op.inputs.adicao_numero === numeroAdicao
        );
    }

    /**
     * Gera relatório de auditoria
     */
    generateAuditReport() {
        const summary = {
            session_id: this.sessionId,
            start_time: this.startTime,
            end_time: new Date().toISOString(),
            total_operations: this.operations.length,
            operations_by_type: this.getOperationsSummaryByType(),
            timeline: this.getOperationsTimeline()
        };

        return {
            summary: summary,
            detailed_operations: this.operations,
            export_timestamp: new Date().toISOString()
        };
    }

    /**
     * Resumo de operações por tipo
     */
    getOperationsSummaryByType() {
        const summary = {};
        this.operations.forEach(op => {
            if (!summary[op.type]) {
                summary[op.type] = {
                    count: 0,
                    first_occurrence: op.timestamp,
                    last_occurrence: op.timestamp
                };
            }
            summary[op.type].count++;
            summary[op.type].last_occurrence = op.timestamp;
        });
        return summary;
    }

    /**
     * Timeline de operações
     */
    getOperationsTimeline() {
        return this.operations.map(op => ({
            timestamp: op.timestamp,
            type: op.type,
            description: op.description,
            result_summary: this.summarizeResult(op.result)
        }));
    }

    /**
     * Resumo do resultado para timeline
     */
    summarizeResult(result) {
        if (typeof result === 'object' && result !== null) {
            if (result.valor_calculado !== undefined) return `Valor: ${this.formatValue(result.valor_calculado)}`;
            if (result.valor_convertido !== undefined) return `Convertido: ${this.formatValue(result.valor_convertido)}`;
            if (result.custo_total !== undefined) return `Total: ${this.formatValue(result.custo_total)}`;
            return 'Objeto complexo';
        }
        return String(result);
    }

    /**
     * Exporta memória de cálculo
     */
    exportMemory(format = 'json') {
        const report = this.generateAuditReport();
        
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `memoria_calculo_${this.sessionId}_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    /**
     * Limpa memória de cálculo
     */
    clear() {
        this.operations = [];
        this.sessionId = this.generateSessionId();
        this.startTime = new Date().toISOString();
        console.log('[CALC MEMORY] Memória de cálculo limpa');
    }

    /**
     * Obtém estatísticas da sessão
     */
    getSessionStats() {
        const now = new Date();
        const start = new Date(this.startTime);
        const duration = now - start;

        return {
            session_id: this.sessionId,
            start_time: this.startTime,
            duration_ms: duration,
            duration_formatted: this.formatDuration(duration),
            total_operations: this.operations.length,
            operations_per_minute: this.operations.length / (duration / 60000),
            types_used: [...new Set(this.operations.map(op => op.type))].length,
            last_operation: this.operations.length > 0 ? this.operations[this.operations.length - 1].timestamp : null
        };
    }

    /**
     * Formata duração em formato legível
     */
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
}