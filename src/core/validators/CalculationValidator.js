/**
 * CalculationValidator.js - Validation Module for Import Tax Calculations
 * Migrated from legacy system to new ES6 module architecture
 */

export class CalculationValidator {
    constructor() {
        this.validationResults = [];
        this.tolerancePercent = 0.01; // 1% tolerance for floating point calculations;
    }

    /**
     * Validates calculation against DI extracted values
     * @param {Object} diData - Original DI data
     * @param {Object} calculation - Calculated tax results
     * @param {string} adicaoNumero - Addition number to validate
     * @returns {Object} Validation results with status and details
     */
    validateCalculation(diData, calculation, adicaoNumero) {
        console.log('🔍 Iniciando validação de cálculos...');
        
        const adicao = diData.adicoes.find(a => a.numero_adicao === adicaoNumero);
        if (!adicao) {
            throw new Error(`Adição ${adicaoNumero} não encontrada na DI`);
        }

        const validation = {
            adicao_numero: adicaoNumero,
            timestamp: new Date().toISOString(),
            overall_status: 'VALID',
            tests: [],
            warnings: [],
            errors: []
        };

        // Test 1: Exchange Rate Consistency
        this.validateExchangeRate(adicao, calculation, validation);
        
        // Test 2: Federal Tax Values (if available in DI)
        this.validateFederalTaxes(adicao, calculation, validation);
        
        // Test 3: Base Calculations
        this.validateBaseCalculations(adicao, calculation, validation);
        
        // Test 4: ICMS Logic
        this.validateICMSLogic(calculation, validation);
        
        // Test 5: Expense Inclusion
        this.validateExpenseInclusion(diData, calculation, validation);

        // Determine overall status
        if (validation.errors.length > 0) {
            validation.overall_status = 'ERROR';
        } else if (validation.warnings.length > 0) {
            validation.overall_status = 'WARNING';
        }

        this.validationResults.push(validation);
        console.log(`✅ Validação concluída: ${validation.overall_status}`);
        
        return validation;
    }

    /**
     * Validate exchange rate consistency
     */
    validateExchangeRate(adicao, calculation, validation) {
        const test = {
            name: 'Taxa de Câmbio',
            status: 'PASS',
            details: {}
        };

        // Validação estrutural: dados base são obrigatórios
        const valorUSD = adicao.valor_moeda_negociacao;
        const valorBRL = adicao.valor_reais;
        const taxaUsadaCalculo = calculation.valores_base?.taxa_cambio;
        
        if (valorUSD === undefined || valorUSD === null) {
            throw new Error(`Valor USD ausente na adição ${adicao.numero_adicao} - obrigatório para validação`);
        }
        if (valorBRL === undefined || valorBRL === null) {
            throw new Error(`Valor BRL ausente na adição ${adicao.numero_adicao} - obrigatório para validação`);
        }
        if (taxaUsadaCalculo === undefined || taxaUsadaCalculo === null) {
            throw new Error(`Taxa de câmbio ausente no cálculo - obrigatória para validação`);
        }
        
        const taxaCalculadaDI = valorUSD > 0 ? valorBRL / valorUSD : 0;

        test.details = {
            di_usd: valorUSD,
            di_brl: valorBRL,
            taxa_di: taxaCalculadaDI,
            taxa_calculo: taxaUsadaCalculo,
            diferenca_percentual: taxaCalculadaDI > 0 ? Math.abs(taxaUsadaCalculo - taxaCalculadaDI) / taxaCalculadaDI : 0
        };

        if (test.details.diferenca_percentual > this.tolerancePercent) {
            test.status = 'WARNING';
            validation.warnings.push(`Taxa de câmbio diverge entre DI (${taxaCalculadaDI.toFixed(6)}) e cálculo (${taxaUsadaCalculo.toFixed(6)})`);
        }

        validation.tests.push(test);
    }

    /**
     * Validate federal tax values from DI
     */
    validateFederalTaxes(adicao, calculation, validation) {
        const federalTaxes = ['ii', 'ipi', 'pis', 'cofins'];
        
        federalTaxes.forEach(tax => {
            const test = {
                name: `${tax.toUpperCase()} - Valor`,
                status: 'PASS',
                details: {}
            };

            // ETAPA 1: Verificar estrutura obrigatória (fail-fast)
            if (!adicao.tributos) {
                throw new Error(`Estrutura tributos ausente na adição ${adicao.numero_adicao} - obrigatória para validação fiscal`);
            }
            if (!calculation.impostos?.[tax]) {
                throw new Error(`Imposto ${tax.toUpperCase()} ausente no cálculo - obrigatório para validação`);
            }
            
            // ETAPA 2: Validar tipos numéricos - NO FALLBACKS (correção crítica 30/09/2025)
            // Valores devem ser number (incluindo zero para isenção), nunca null/undefined
            const diValue = adicao.tributos[`${tax}_valor_devido`];
            const calculatedValue = calculation.impostos[tax].valor_devido;
            const diRate = adicao.tributos[`${tax}_aliquota_ad_valorem`];
            const calculatedRate = calculation.impostos[tax].aliquota;

            // VALIDAÇÃO NO FALLBACKS: Campos devem existir e ser numéricos
            if (typeof diValue !== 'number') {
                throw new Error(
                    `${tax.toUpperCase()}_valor_devido ausente ou inválido na DI (adição ${adicao.numero_adicao}). ` +
                    `Tipo: ${typeof diValue}. DIProcessor deve garantir tipos numéricos.`
                );
            }
            if (typeof calculatedValue !== 'number') {
                throw new Error(
                    `${tax.toUpperCase()}_valor_devido ausente ou inválido no cálculo. ` +
                    `Tipo: ${typeof calculatedValue}. ComplianceCalculator deve garantir estrutura correta.`
                );
            }
            if (typeof diRate !== 'number') {
                throw new Error(
                    `${tax.toUpperCase()}_aliquota_ad_valorem ausente ou inválida na DI (adição ${adicao.numero_adicao}). ` +
                    `Tipo: ${typeof diRate}. DIProcessor deve garantir tipos numéricos.`
                );
            }
            if (typeof calculatedRate !== 'number') {
                throw new Error(
                    `${tax.toUpperCase()}_aliquota ausente ou inválida no cálculo. ` +
                    `Tipo: ${typeof calculatedRate}. ComplianceCalculator deve garantir estrutura correta.`
                );
            }

            // Nota: Zero é válido (isenção), validação acima garante que é number

            test.details = {
                di_valor: diValue,
                calculated_valor: calculatedValue,
                di_aliquota: diRate,
                calculated_aliquota: calculatedRate,
                diferenca_valor: Math.abs(diValue - calculatedValue),
                diferenca_aliquota: Math.abs(diRate - calculatedRate)
            };

            // Check rate consistency
            if (test.details.diferenca_aliquota > 0.01) {
                test.status = 'WARNING';
                validation.warnings.push(`${tax.toUpperCase()}: Alíquota DI (${diRate}%) ≠ Alíquota cálculo (${calculatedRate}%)`);
            }

            // Check value consistency (allowing for calculation differences)
            if (diValue > 0 && test.details.diferenca_valor > (diValue * this.tolerancePercent)) {
                test.status = 'WARNING';
                validation.warnings.push(`${tax.toUpperCase()}: Valor DI (R$ ${diValue.toFixed(2)}) ≠ Valor calculado (R$ ${calculatedValue.toFixed(2)})`);
            }

            validation.tests.push(test);
        });
    }

    /**
     * Validate base calculations
     */
    validateBaseCalculations(adicao, calculation, validation) {
        const test = {
            name: 'Valores Base',
            status: 'PASS',
            details: {}
        };

        // Validação estrutural: valores base são obrigatórios 
        const cifDI = adicao.valor_reais;
        const cifCalculo = calculation.valores_base?.cif_brl;
        const pesoDI = adicao.peso_liquido;
        const pesoCalculo = calculation.valores_base?.peso_liquido;
        
        if (cifDI === undefined || cifDI === null) {
            throw new Error(`Valor CIF BRL ausente na adição ${adicao.numero_adicao} - obrigatório para validação`);
        }
        if (cifCalculo === undefined || cifCalculo === null) {
            throw new Error(`Valor CIF BRL ausente no cálculo - obrigatório para validação`);
        }
        if (pesoDI === undefined || pesoDI === null) {
            throw new Error(`Peso líquido ausente na adição ${adicao.numero_adicao} - obrigatório para validação`);
        }
        if (pesoCalculo === undefined || pesoCalculo === null) {
            throw new Error(`Peso líquido ausente no cálculo - obrigatório para validação`);
        }

        test.details = {
            cif_di: cifDI,
            cif_calculo: cifCalculo,
            peso_di: pesoDI,
            peso_calculo: pesoCalculo,
            diferenca_cif: Math.abs(cifDI - cifCalculo),
            diferenca_peso: Math.abs(pesoDI - pesoCalculo)
        };

        if (test.details.diferenca_cif > (cifDI * this.tolerancePercent)) {
            test.status = 'ERROR';
            validation.errors.push(`CIF: Valor DI (R$ ${cifDI.toFixed(2)}) ≠ Valor cálculo (R$ ${cifCalculo.toFixed(2)})`);
        }

        if (test.details.diferenca_peso > (pesoDI * this.tolerancePercent)) {
            test.status = 'WARNING';
            validation.warnings.push(`Peso: DI (${pesoDI.toFixed(2)} kg) ≠ Cálculo (${pesoCalculo.toFixed(2)} kg)`);
        }

        validation.tests.push(test);
    }

    /**
     * Validate ICMS calculation logic
     */
    validateICMSLogic(calculation, validation) {
        const test = {
            name: 'Lógica ICMS',
            status: 'PASS',
            details: {}
        };

        const icms = calculation.impostos.icms;
        // NO FALLBACKS - validar estrutura obrigatória
        if (!calculation.impostos) {
            throw new Error('calculation.impostos ausente - obrigatório para validação ICMS');
        }
        if (!calculation.despesas) {
            throw new Error('calculation.despesas ausente - obrigatório para validação ICMS');
        }
        if (calculation.despesas.total_base_icms === undefined || calculation.despesas.total_base_icms === null) {
            throw new Error('calculation.despesas.total_base_icms ausente - obrigatório para validação ICMS');
        }
        
        const expectedBaseBefore = 
            calculation.valores_base.cif_brl +
            calculation.impostos.ii.valor_devido +
            calculation.impostos.ipi.valor_devido +
            calculation.impostos.pis.valor_devido +
            calculation.impostos.cofins.valor_devido +
            calculation.despesas.total_base_icms;

        const expectedFactor = 1 - (icms.aliquota / 100);
        const expectedBaseFinal = expectedBaseBefore / expectedFactor;
        const expectedICMS = expectedBaseFinal - expectedBaseBefore;

        test.details = {
            base_antes_expected: expectedBaseBefore,
            base_antes_actual: icms.base_calculo_antes,
            fator_expected: expectedFactor,
            fator_actual: icms.fator_divisao,
            base_final_expected: expectedBaseFinal,
            base_final_actual: icms.base_calculo_final,
            icms_expected: expectedICMS,
            icms_actual: icms.valor_devido
        };

        // Check base calculation
        if (Math.abs(expectedBaseBefore - icms.base_calculo_antes) > (expectedBaseBefore * this.tolerancePercent)) {
            test.status = 'ERROR';
            validation.errors.push(`Base ICMS incorreta: esperado R$ ${expectedBaseBefore.toFixed(2)}, calculado R$ ${icms.base_calculo_antes.toFixed(2)}`);
        }

        // Check factor calculation
        if (Math.abs(expectedFactor - icms.fator_divisao) > 0.001) {
            test.status = 'ERROR';
            validation.errors.push(`Fator divisão incorreto: esperado ${expectedFactor.toFixed(3)}, calculado ${icms.fator_divisao.toFixed(3)}`);
        }

        // Check final ICMS value
        if (Math.abs(expectedICMS - icms.valor_devido) > (expectedICMS * this.tolerancePercent)) {
            test.status = 'WARNING';
            validation.warnings.push(`ICMS valor: esperado R$ ${expectedICMS.toFixed(2)}, calculado R$ ${icms.valor_devido.toFixed(2)}`);
        }

        validation.tests.push(test);
    }

    /**
     * Validate expense inclusion in ICMS base
     */
    validateExpenseInclusion(diData, calculation, validation) {
        const test = {
            name: 'Inclusão de Despesas',
            status: 'PASS',
            details: {}
        };

        // NO FALLBACKS - validar dados obrigatórios
        if (!diData.despesas_aduaneiras?.total_despesas_aduaneiras && diData.despesas_aduaneiras?.total_despesas_aduaneiras !== 0) {
            throw new Error('diData.despesas_aduaneiras.total_despesas_aduaneiras ausente - obrigatório para validação');
        }
        if (!calculation.despesas?.total_base_icms && calculation.despesas?.total_base_icms !== 0) {
            throw new Error('calculation.despesas.total_base_icms ausente - obrigatório para validação');
        }
        
        const despesasDI = diData.despesas_aduaneiras.total_despesas_aduaneiras;
        const despesasCalculo = calculation.despesas.total_base_icms;

        // Validar estrutura calculadas (pode ser zero mas deve existir)
        const calculadas = diData.despesas_aduaneiras?.calculadas;
        if (!calculadas) {
            throw new Error('diData.despesas_aduaneiras.calculadas ausente - obrigatório para validação detalhada');
        }
        
        test.details = {
            despesas_di: despesasDI,
            despesas_calculo: despesasCalculo,
            siscomex_di: calculadas.siscomex || 0,
            afrmm_di: calculadas.afrmm || 0,
            capatazia_di: calculadas.capatazia || 0,
            diferenca: Math.abs(despesasDI - despesasCalculo)
        };

        // Check if SISCOMEX is properly included
        if (test.details.siscomex_di === 0) {
            test.status = 'WARNING';
            validation.warnings.push('SISCOMEX não foi extraído da DI - verificar se existe no XML');
        }

        // Check total expense consistency
        if (test.details.diferenca > (Math.max(despesasDI, despesasCalculo) * this.tolerancePercent)) {
            test.status = 'WARNING';
            validation.warnings.push(`Despesas: DI (R$ ${despesasDI.toFixed(2)}) ≠ Cálculo (R$ ${despesasCalculo.toFixed(2)})`);
        }

        validation.tests.push(test);
    }

    /**
     * Generate validation report for UI display
     */
    generateValidationReport(validation) {
        const statusIcon = {
            'VALID': '<i class="bi bi-check-circle-fill text-success"></i>',
            'WARNING': '<i class="bi bi-exclamation-triangle-fill text-warning"></i>',
            'ERROR': '<i class="bi bi-x-circle-fill text-danger"></i>'
        };

        const statusClass = {
            'VALID': 'alert-success',
            'WARNING': 'alert-warning', 
            'ERROR': 'alert-danger'
        };

        let report = `
            <div class="alert ${statusClass[validation.overall_status]} mb-3">
                <h6>${statusIcon[validation.overall_status]} Status de Validação: ${validation.overall_status}</h6>
                ${validation.overall_status === 'VALID' ? 
                    '<p class="mb-0">Todos os cálculos estão consistentes com os dados da DI.</p>' :
                    `<p class="mb-0">Encontradas ${validation.warnings.length} advertências e ${validation.errors.length} erros.</p>`
                }
            </div>
        `;

        if (validation.warnings.length > 0) {
            report += `
                <div class="alert alert-warning">
                    <h6><i class="bi bi-exclamation-triangle"></i> Advertências:</h6>
                    <ul class="mb-0">
                        ${validation.warnings.map(w => `<li>${w}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (validation.errors.length > 0) {
            report += `
                <div class="alert alert-danger">
                    <h6><i class="bi bi-x-circle"></i> Erros:</h6>
                    <ul class="mb-0">
                        ${validation.errors.map(e => `<li>${e}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        // Detailed test results
        report += `
            <div class="accordion mt-3" id="validationAccordion">
                ${validation.tests.map((test, index) => this.generateTestAccordion(test, index)).join('')}
            </div>
        `;

        return report;
    }

    /**
     * Generate accordion item for individual test
     */
    generateTestAccordion(test, index) {
        const statusIcon = {
            'PASS': '<i class="bi bi-check-circle text-success"></i>',
            'WARNING': '<i class="bi bi-exclamation-triangle text-warning"></i>',
            'ERROR': '<i class="bi bi-x-circle text-danger"></i>'
        };

        return `
            <div class="accordion-item">
                <h2 class="accordion-header" id="test${index}">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" 
                            data-bs-target="#collapse${index}" aria-expanded="false" aria-controls="collapse${index}">
                        ${statusIcon[test.status]} ${test.name} - ${test.status}
                    </button>
                </h2>
                <div id="collapse${index}" class="accordion-collapse collapse" aria-labelledby="test${index}" 
                     data-bs-parent="#validationAccordion">
                    <div class="accordion-body">
                        <pre class="small bg-light p-2 rounded">${JSON.stringify(test.details, null, 2)}</pre>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get validation indicator for UI
     */
    getValidationIndicator(validation) {
        const indicators = {
            'VALID': '<span class="badge bg-success"><i class="bi bi-check-circle"></i> Validado</span>',
            'WARNING': '<span class="badge bg-warning"><i class="bi bi-exclamation-triangle"></i> Advertências</span>',
            'ERROR': '<span class="badge bg-danger"><i class="bi bi-x-circle"></i> Erros</span>'
        };
        
        return indicators[validation.overall_status] || '<span class="badge bg-secondary">Não Validado</span>';
    }

    /**
     * Quick validation check for display purposes
     */
    quickValidationCheck(diData, calculation, adicaoNumero) {
        try {
            const validation = this.validateCalculation(diData, calculation, adicaoNumero);
            return this.getValidationIndicator(validation);
        } catch (error) {
            console.error('Erro na validação rápida:', error);
            return '<span class="badge bg-danger"><i class="bi bi-x-circle"></i> Erro</span>';
        }
    }

    /**
     * Get latest validation results
     */
    getLatestValidation() {
        return this.validationResults[this.validationResults.length - 1] || null;
    }

    /**
     * Clear validation history
     */
    clearValidationHistory() {
        this.validationResults = [];
        console.log('🧹 Histórico de validação limpo');
    }

    /**
     * Export validation report to JSON
     */
    exportValidationReport(validation) {
        const report = {
            metadata: {
                sistema: 'Sistema Expertzy - Importação',
                versao: '2025.1',
                timestamp: validation.timestamp,
                adicao: validation.adicao_numero
            },
            validation: validation,
            generated_by: 'CalculationValidator.js'
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Validation_Report_${validation.adicao_numero}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Export for use in other modules - já exportado na linha 6 com export class