/**
 * Test Configuration for Complete Pricing Pipeline E2E Tests
 *
 * Configuration constants, test data, and helper functions
 * for the comprehensive pricing pipeline test suite.
 */

// Test execution configuration
export const TEST_CONFIG = {
    // Timeouts
    PAGE_LOAD_TIMEOUT: 3000,
    MODULE_INIT_TIMEOUT: 2000,
    CALCULATION_TIMEOUT: 5000,

    // Mathematical tolerance for floating point comparisons
    CALCULATION_TOLERANCE: 0.01, // 1 cent tolerance
    PERCENTAGE_TOLERANCE: 0.001, // 0.1% tolerance

    // Test data validation
    REQUIRED_MODULES: [
        'DIProcessor',
        'ComplianceCalculator',
        'PricingEngine',
        'dbManager'
    ],

    OPTIONAL_MODULES: [
        'CostCalculationEngine',
        'RegimeConfigManager',
        'ProductMemoryManager',
        'IncentiveManager'
    ]
};

// Real-world test scenarios with expected outcomes
export const TEST_SCENARIOS = {
    // Scenario 1: Mixed products (regular + monophasic)
    MIXED_PRODUCTS: {
        name: "Mixed Products - Electronics + Diesel",
        di_number: "24/1234567-0",
        importador_uf: "SP",
        produtos: [
            {
                ncm: "8517.12.31",
                descricao: "TELEFONES CELULARES",
                categoria: "electronics",
                is_monophasic: false,
                valor_unitario: 500.00,
                quantidade: 100
            },
            {
                ncm: "2710.19.21",
                descricao: "OLEO DIESEL S10",
                categoria: "derivados_petroleo",
                is_monophasic: true,
                valor_unitario: 4.00,
                quantidade: 5000
            }
        ],
        expected_totals: {
            valor_aduaneiro: 70000.00,
            ii_devido: 52800.00,
            ipi_devido: 47850.00,
            pis_devido: 9508.90,
            cofins_devido: 43679.25
        }
    },

    // Scenario 2: Only monophasic products
    MONOPHASIC_ONLY: {
        name: "Monophasic Only - Pharmaceutical Products",
        di_number: "24/2345678-1",
        importador_uf: "RJ",
        produtos: [
            {
                ncm: "3004.20.00",
                descricao: "MEDICAMENTOS ANTIBIOTICOS",
                categoria: "medicamentos",
                is_monophasic: true,
                valor_unitario: 25.00,
                quantidade: 1000
            }
        ],
        expected_regime_differences: {
            lucro_real: {
                allows_pis_cofins_credit: true,
                allows_ipi_credit: true
            },
            lucro_presumido: {
                allows_pis_cofins_credit: false,
                allows_ipi_credit: true
            },
            simples_nacional: {
                allows_pis_cofins_credit: false,
                allows_ipi_credit: false
            }
        }
    },

    // Scenario 3: High-value luxury goods
    LUXURY_GOODS: {
        name: "Luxury Goods - Vehicles",
        di_number: "24/3456789-2",
        importador_uf: "SC",
        produtos: [
            {
                ncm: "8703.23.10",
                descricao: "AUTOMOVEIS DE LUXO",
                categoria: "veiculos",
                is_monophasic: true,
                valor_unitario: 80000.00,
                quantidade: 5
            }
        ],
        incentives_available: ["SC_TTD_409", "SC_TTD_410"],
        expected_icms_reduction: 0.949 // 94.9% reduction
    }
};

// Expected calculation formulas for validation
export const CALCULATION_FORMULAS = {
    // Cost Type 1: Base Cost
    CUSTO_BASE: {
        formula: "valor_aduaneiro + ii + ipi + pis + cofins + icms + despesas_aduaneiras",
        components: [
            "valor_aduaneiro",
            "ii_devido",
            "ipi_devido",
            "pis_devido",
            "cofins_devido",
            "icms_devido",
            "despesas_aduaneiras"
        ]
    },

    // Cost Type 2: Disbursement Cost (varies by tax regime)
    CUSTO_DESEMBOLSO: {
        lucro_real: {
            formula: "custo_base - credito_pis - credito_cofins - credito_ipi",
            credits_allowed: ["PIS", "COFINS", "IPI"]
        },
        lucro_presumido: {
            formula: "custo_base - credito_ipi",
            credits_allowed: ["IPI"]
        },
        simples_nacional: {
            formula: "custo_base", // No credits
            credits_allowed: []
        }
    },

    // Cost Type 3: Accounting Cost
    CUSTO_CONTABIL: {
        formula: "custo_desembolso + encargos_financeiros - tributos_recuperaveis",
        adjustments: ["encargos_financeiros", "tributos_recuperaveis"]
    },

    // Cost Type 4: Price Formation Base
    BASE_FORMACAO_PRECO: {
        formula: "custo_contabil + custos_indiretos + margem_operacional",
        add_ons: ["custos_indiretos", "margem_operacional"]
    }
};

// Tax regime specific rules for validation
export const TAX_REGIME_RULES = {
    LUCRO_REAL: {
        regime_code: "lucro_real",
        pis_cofins_regime: "nao_cumulativo",
        allows_import_credits: true,
        pis_cofins_credit_rate: {
            pis: 2.10,
            cofins: 9.65
        },
        ipi_credit: "integral",
        icms_credit: "integral"
    },

    LUCRO_PRESUMIDO: {
        regime_code: "lucro_presumido",
        pis_cofins_regime: "cumulativo",
        allows_import_credits: false,
        pis_cofins_rates: {
            pis: 0.65,
            cofins: 3.00
        },
        ipi_credit: "integral",
        icms_credit: "integral"
    },

    SIMPLES_NACIONAL: {
        regime_code: "simples_nacional",
        pis_cofins_regime: "isento_das",
        allows_import_credits: false,
        separate_payment_required: true,
        ipi_credit: "none", // Unless specific cases
        icms_credit: "integral"
    }
};

// Monophasic product categories for testing
export const MONOPHASIC_CATEGORIES = {
    DERIVADOS_PETROLEO: {
        category: "derivados_petroleo",
        ncm_patterns: ["2710", "2711"],
        sample_ncms: ["2710.12.10", "2710.19.21", "2711.11.00"],
        aliquotas_saida: {
            pis: 4.21, // For diesel
            cofins: 19.42
        }
    },

    MEDICAMENTOS: {
        category: "medicamentos",
        ncm_patterns: ["3003", "3004"],
        sample_ncms: ["3003.10.00", "3004.20.00"],
        aliquotas_saida: {
            pis: 2.10,
            cofins: 9.90
        }
    },

    VEICULOS: {
        category: "veiculos_maquinas",
        ncm_patterns: ["8701", "8702", "8703"],
        sample_ncms: ["8703.23.10", "8703.32.90"],
        aliquotas_saida: {
            pis: 2.00,
            cofins: 9.60
        }
    }
};

// Error validation patterns for NO FALLBACKS testing
export const ERROR_PATTERNS = {
    MISSING_DATA: {
        pattern: /obrigatório.*não fornecido/i,
        scenarios: [
            "null engineData",
            "missing totais",
            "undefined valor_aduaneiro"
        ]
    },

    INVALID_TYPE: {
        pattern: /deve ser numérico/i,
        scenarios: [
            "string instead of number",
            "array instead of number",
            "object instead of number"
        ]
    },

    NOMENCLATURE_VIOLATION: {
        pattern: /VIOLAÇÃO NOMENCLATURA/i,
        forbidden_fields: [
            "mercadorias", // Should be "produtos"
            "despesas", // Should be "despesas_aduaneiras"
            "tax_regime", // Should be "regime_tributario"
            "base_cost", // Should be "custo_base"
            "disbursement_cost" // Should be "custo_desembolso"
        ]
    }
};

// Performance benchmarks
export const PERFORMANCE_BENCHMARKS = {
    XML_PROCESSING: 30000, // 30 seconds max
    DI_SAVING: 5000, // 5 seconds max
    COST_CALCULATION: 1000, // 1 second max
    PRICING_ANALYSIS: 2000, // 2 seconds max
    DATABASE_OPERATIONS: 500, // 500ms max
    UI_RESPONSE: 200 // 200ms max for UI updates
};

// Helper functions for test validation
export class TestValidators {

    static validateCostCalculation(actual, expected, tolerance = TEST_CONFIG.CALCULATION_TOLERANCE) {
        const difference = Math.abs(actual - expected);
        return {
            isValid: difference < tolerance,
            difference,
            tolerance,
            actual,
            expected
        };
    }

    static validateTaxCredits(regime, credits, products) {
        const rules = TAX_REGIME_RULES[regime.toUpperCase()];
        if (!rules) {
            throw new Error(`Unknown tax regime: ${regime}`);
        }

        const validations = {};

        // Validate PIS/COFINS credits
        if (rules.allows_import_credits) {
            validations.pis_cofins_credits = credits.pis > 0 && credits.cofins > 0;
        } else {
            validations.pis_cofins_credits = credits.pis === 0 && credits.cofins === 0;
        }

        // Validate IPI credits
        if (rules.ipi_credit === "integral") {
            validations.ipi_credits = credits.ipi > 0;
        } else {
            validations.ipi_credits = credits.ipi === 0;
        }

        return validations;
    }

    static validateMonophasicDetection(products, expectedMonophasic) {
        const detectionResults = {};

        products.forEach(product => {
            const ncm = product.ncm;
            const isMonophasicExpected = expectedMonophasic.includes(ncm);
            const isMonophasicDetected = product.is_monophasic;

            detectionResults[ncm] = {
                expected: isMonophasicExpected,
                detected: isMonophasicDetected,
                correct: isMonophasicExpected === isMonophasicDetected
            };
        });

        const allCorrect = Object.values(detectionResults).every(r => r.correct);

        return {
            allCorrect,
            detectionResults,
            summary: {
                total: products.length,
                correct: Object.values(detectionResults).filter(r => r.correct).length
            }
        };
    }

    static validateNomenclature(data) {
        const violations = [];

        // Check for forbidden field names
        ERROR_PATTERNS.NOMENCLATURE_VIOLATION.forbidden_fields.forEach(field => {
            if (this.hasField(data, field)) {
                const correctField = this.getCorrectFieldName(field);
                violations.push(`VIOLAÇÃO NOMENCLATURA: Use "${correctField}" não "${field}"`);
            }
        });

        return {
            isValid: violations.length === 0,
            violations,
            count: violations.length
        };
    }

    static hasField(obj, fieldName) {
        if (typeof obj !== 'object' || obj === null) return false;

        if (obj.hasOwnProperty(fieldName)) return true;

        // Recursively check nested objects
        for (const key in obj) {
            if (typeof obj[key] === 'object' && this.hasField(obj[key], fieldName)) {
                return true;
            }
        }

        return false;
    }

    static getCorrectFieldName(forbiddenField) {
        const mapping = {
            'mercadorias': 'produtos',
            'despesas': 'despesas_aduaneiras',
            'tax_regime': 'regime_tributario',
            'base_cost': 'custo_base',
            'disbursement_cost': 'custo_desembolso'
        };

        return mapping[forbiddenField] || `field_${forbiddenField}`;
    }
}

// Export configuration for use in tests
export default {
    TEST_CONFIG,
    TEST_SCENARIOS,
    CALCULATION_FORMULAS,
    TAX_REGIME_RULES,
    MONOPHASIC_CATEGORIES,
    ERROR_PATTERNS,
    PERFORMANCE_BENCHMARKS,
    TestValidators
};