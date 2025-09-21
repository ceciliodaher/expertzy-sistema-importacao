/**
 * DataValidator - Validação de integridade de dados DI
 * Garante que dados transformados estão corretos antes de persistir
 * 
 * REGRAS APLICADAS:
 * - NO FALLBACKS: Sempre lançar exceções quando dados inválidos
 * - FAIL-FAST: Validar completamente antes de prosseguir
 * - EXPLICIT ERRORS: Mensagens claras sobre o que está errado
 */

class DataValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
    }

    /**
     * Valida dados completos da DI
     * @param {Object} data - Dados transformados da DI
     * @returns {boolean} True se válidos
     * @throws {Error} Se dados inválidos
     */
    validate(data) {
        this.clearErrors();

        if (!data) {
            throw new Error('Dados da DI são obrigatórios para validação');
        }

        // Validar dados gerais obrigatórios
        this.validateDadosGerais(data);

        // Validar importador
        this.validateImportador(data.importador);

        // Validar valores monetários
        this.validateValoresMonetarios(data);

        // Validar taxa de câmbio
        this.validateTaxaCambio(data.taxa_cambio);

        // Validar dados de carga
        this.validateDadosCarga(data.carga);

        // Validar adições
        this.validateAdicoes(data.adicoes);

        // Validar despesas
        this.validateDespesas(data.despesas);

        // Se há erros, lançar exceção
        if (this.errors.length > 0) {
            throw new Error(`Dados inválidos: ${this.errors.join('; ')}`);
        }

        return true;
    }

    /**
     * Valida dados gerais da DI
     * @param {Object} data - Dados da DI
     */
    validateDadosGerais(data) {
        if (!data.numero_di) {
            this.addError('Número da DI é obrigatório');
        }

        if (!data.data_processamento) {
            this.addError('Data de processamento é obrigatória');
        }

        if (!data.xml_hash) {
            this.addError('Hash do XML é obrigatório para integridade');
        }

        if (data.total_adicoes === undefined || data.total_adicoes === null) {
            this.addError('Total de adições é obrigatório');
        } else if (data.total_adicoes <= 0) {
            this.addError('Total de adições deve ser maior que zero');
        }

        // Validar se total de adições confere com array de adições
        if (data.adicoes && data.adicoes.length !== data.total_adicoes) {
            this.addError(`Total de adições (${data.total_adicoes}) não confere com array de adições (${data.adicoes.length})`);
        }
    }

    /**
     * Valida dados do importador
     * @param {Object} importador - Dados do importador
     */
    validateImportador(importador) {
        if (!importador) {
            this.addError('Dados do importador são obrigatórios');
            return;
        }

        if (!importador.cnpj) {
            this.addError('CNPJ do importador é obrigatório');
        } else if (!this.isValidCNPJ(importador.cnpj)) {
            this.addError(`CNPJ do importador inválido: ${importador.cnpj}`);
        }

        if (!importador.nome) {
            this.addError('Nome do importador é obrigatório');
        }

        if (!importador.endereco_uf) {
            this.addError('UF do importador é obrigatória');
        } else if (!this.isValidUF(importador.endereco_uf)) {
            this.addError(`UF do importador inválida: ${importador.endereco_uf}`);
        }
    }

    /**
     * Valida valores monetários
     * @param {Object} data - Dados da DI
     */
    validateValoresMonetarios(data) {
        const valoresObrigatorios = [
            { campo: 'valor_total_fob_usd', nome: 'Valor total FOB USD' },
            { campo: 'valor_total_fob_brl', nome: 'Valor total FOB BRL' },
            { campo: 'valor_aduaneiro_total_brl', nome: 'Valor aduaneiro total BRL' }
        ];

        for (const valor of valoresObrigatorios) {
            if (data[valor.campo] === undefined || data[valor.campo] === null) {
                this.addError(`${valor.nome} é obrigatório`);
            } else if (data[valor.campo] < 0) {
                this.addError(`${valor.nome} não pode ser negativo`);
            } else if (data[valor.campo] === 0) {
                this.addWarning(`${valor.nome} é zero - verificar se correto`);
            }
        }

        // Validar frete (pode ser zero para alguns incoterms)
        if (data.valor_total_frete_usd !== undefined && data.valor_total_frete_usd < 0) {
            this.addError('Valor total frete USD não pode ser negativo');
        }

        if (data.valor_total_frete_brl !== undefined && data.valor_total_frete_brl < 0) {
            this.addError('Valor total frete BRL não pode ser negativo');
        }
    }

    /**
     * Valida taxa de câmbio
     * @param {number} taxaCambio - Taxa de câmbio
     */
    validateTaxaCambio(taxaCambio) {
        if (taxaCambio === undefined || taxaCambio === null) {
            this.addError('Taxa de câmbio é obrigatória');
            return;
        }

        if (taxaCambio <= 0) {
            this.addError('Taxa de câmbio deve ser maior que zero');
        } else if (taxaCambio > 10) {
            this.addError(`Taxa de câmbio muito alta - verificar cálculo: ${taxaCambio}`);
        } else if (taxaCambio < 1) {
            this.addWarning(`Taxa de câmbio baixa - verificar se correto: ${taxaCambio}`);
        }
    }

    /**
     * Valida dados de carga
     * @param {Object} carga - Dados de carga
     */
    validateDadosCarga(carga) {
        if (!carga) {
            this.addError('Dados de carga são obrigatórios');
            return;
        }

        if (carga.peso_bruto === undefined || carga.peso_bruto === null) {
            this.addError('Peso bruto é obrigatório');
        } else if (carga.peso_bruto <= 0) {
            this.addError('Peso bruto deve ser maior que zero');
        }

        if (carga.peso_liquido === undefined || carga.peso_liquido === null) {
            this.addError('Peso líquido é obrigatório');
        } else if (carga.peso_liquido <= 0) {
            this.addError('Peso líquido deve ser maior que zero');
        }

        // Validar relação peso bruto vs líquido
        if (carga.peso_bruto && carga.peso_liquido && carga.peso_liquido > carga.peso_bruto) {
            this.addError('Peso líquido não pode ser maior que peso bruto');
        }
    }

    /**
     * Valida adições
     * @param {Array} adicoes - Lista de adições
     */
    validateAdicoes(adicoes) {
        if (!adicoes || !Array.isArray(adicoes)) {
            this.addError('Lista de adições é obrigatória');
            return;
        }

        if (adicoes.length === 0) {
            this.addError('DI deve ter pelo menos uma adição');
            return;
        }

        adicoes.forEach((adicao, index) => {
            this.validateAdicao(adicao, index + 1);
        });
    }

    /**
     * Valida uma adição específica
     * @param {Object} adicao - Dados da adição
     * @param {number} numero - Número da adição
     */
    validateAdicao(adicao, numero) {
        const prefixo = `Adição ${numero}`;

        if (!adicao.ncm) {
            this.addError(`${prefixo}: NCM é obrigatório`);
        } else if (!this.isValidNCM(adicao.ncm)) {
            this.addError(`${prefixo}: NCM inválido: ${adicao.ncm}`);
        }

        if (adicao.valor_reais === undefined || adicao.valor_reais === null) {
            this.addError(`${prefixo}: Valor em reais é obrigatório`);
        } else if (adicao.valor_reais <= 0) {
            this.addError(`${prefixo}: Valor em reais deve ser maior que zero`);
        }

        // Validar alíquotas (podem ser zero em casos de isenção)
        this.validateAliquota(adicao.ii_aliquota, `${prefixo}: Alíquota II`);
        this.validateAliquota(adicao.ipi_aliquota, `${prefixo}: Alíquota IPI`);
        this.validateAliquota(adicao.pis_aliquota, `${prefixo}: Alíquota PIS`);
        this.validateAliquota(adicao.cofins_aliquota, `${prefixo}: Alíquota COFINS`);

        // Validar valores de tributos
        this.validateTributoValue(adicao.ii_valor_devido, `${prefixo}: Valor II devido`);
        this.validateTributoValue(adicao.ipi_valor_devido, `${prefixo}: Valor IPI devido`);
        this.validateTributoValue(adicao.pis_valor_devido, `${prefixo}: Valor PIS devido`);
        this.validateTributoValue(adicao.cofins_valor_devido, `${prefixo}: Valor COFINS devido`);

        // Validar mercadorias
        if (adicao.mercadorias && adicao.mercadorias.length > 0) {
            adicao.mercadorias.forEach((mercadoria, index) => {
                this.validateMercadoria(mercadoria, numero, index + 1);
            });
        }
    }

    /**
     * Valida uma mercadoria
     * @param {Object} mercadoria - Dados da mercadoria
     * @param {number} numeroAdicao - Número da adição
     * @param {number} numeroMercadoria - Número da mercadoria
     */
    validateMercadoria(mercadoria, numeroAdicao, numeroMercadoria) {
        const prefixo = `Adição ${numeroAdicao}, Mercadoria ${numeroMercadoria}`;

        if (!mercadoria.descricao) {
            this.addError(`${prefixo}: Descrição é obrigatória`);
        }

        if (mercadoria.quantidade === undefined || mercadoria.quantidade === null) {
            this.addError(`${prefixo}: Quantidade é obrigatória`);
        } else if (mercadoria.quantidade <= 0) {
            this.addError(`${prefixo}: Quantidade deve ser maior que zero`);
        }

        if (mercadoria.valor_unitario === undefined || mercadoria.valor_unitario === null) {
            this.addError(`${prefixo}: Valor unitário é obrigatório`);
        } else if (mercadoria.valor_unitario < 0) {
            this.addError(`${prefixo}: Valor unitário não pode ser negativo`);
        }
    }

    /**
     * Valida despesas aduaneiras
     * @param {Object} despesas - Dados de despesas
     */
    validateDespesas(despesas) {
        if (!despesas) {
            this.addWarning('Nenhuma despesa aduaneira informada');
            return;
        }

        // Validar valores de despesas (podem ser zero)
        if (despesas.siscomex !== undefined && despesas.siscomex < 0) {
            this.addError('Valor SISCOMEX não pode ser negativo');
        }

        if (despesas.afrmm !== undefined && despesas.afrmm < 0) {
            this.addError('Valor AFRMM não pode ser negativo');
        }

        if (despesas.capatazia !== undefined && despesas.capatazia < 0) {
            this.addError('Valor CAPATAZIA não pode ser negativo');
        }

        // Validar outras despesas
        if (despesas.outras && Array.isArray(despesas.outras)) {
            despesas.outras.forEach((despesa, index) => {
                if (!despesa.tipo) {
                    this.addError(`Despesa ${index + 1}: Tipo é obrigatório`);
                }

                if (despesa.valor === undefined || despesa.valor === null) {
                    this.addError(`Despesa ${index + 1}: Valor é obrigatório`);
                } else if (despesa.valor < 0) {
                    this.addError(`Despesa ${index + 1}: Valor não pode ser negativo`);
                }
            });
        }
    }

    /**
     * Valida alíquota (percentual)
     * @param {number} aliquota - Valor da alíquota
     * @param {string} campo - Nome do campo
     */
    validateAliquota(aliquota, campo) {
        if (aliquota === undefined || aliquota === null) {
            this.addWarning(`${campo}: Alíquota não informada`);
            return;
        }

        if (aliquota < 0) {
            this.addError(`${campo}: Alíquota não pode ser negativa`);
        } else if (aliquota > 100) {
            this.addError(`${campo}: Alíquota muito alta (${aliquota}%)`);
        }
    }

    /**
     * Valida valor de tributo
     * @param {number} valor - Valor do tributo
     * @param {string} campo - Nome do campo
     */
    validateTributoValue(valor, campo) {
        if (valor === undefined || valor === null) {
            this.addWarning(`${campo}: Valor não informado`);
            return;
        }

        if (valor < 0) {
            this.addError(`${campo}: Valor não pode ser negativo`);
        }
    }

    /**
     * Valida CNPJ
     * @param {string} cnpj - CNPJ para validar
     * @returns {boolean} True se válido
     */
    isValidCNPJ(cnpj) {
        if (!cnpj) return false;

        // Remover caracteres não numéricos
        const cleanCNPJ = cnpj.replace(/\D/g, '');

        // Verificar se tem 14 dígitos
        if (cleanCNPJ.length !== 14) return false;

        // Verificar se não são todos iguais
        if (/^(\d)\1+$/.test(cleanCNPJ)) return false;

        // Validação básica aprovada
        return true;
    }

    /**
     * Valida UF
     * @param {string} uf - UF para validar
     * @returns {boolean} True se válida
     */
    isValidUF(uf) {
        const ufsValidas = [
            'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
            'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
            'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
        ];

        return ufsValidas.includes(uf?.toUpperCase());
    }

    /**
     * Valida NCM
     * @param {string} ncm - NCM para validar
     * @returns {boolean} True se válido
     */
    isValidNCM(ncm) {
        if (!ncm) return false;

        // NCM deve ter 8 dígitos
        const cleanNCM = ncm.replace(/\D/g, '');
        return cleanNCM.length === 8;
    }

    /**
     * Adiciona erro à lista
     * @param {string} error - Mensagem de erro
     */
    addError(error) {
        this.errors.push(error);
    }

    /**
     * Adiciona warning à lista
     * @param {string} warning - Mensagem de warning
     */
    addWarning(warning) {
        this.warnings.push(warning);
    }

    /**
     * Limpa erros e warnings
     */
    clearErrors() {
        this.errors = [];
        this.warnings = [];
    }

    /**
     * Retorna lista de erros
     * @returns {Array} Lista de erros
     */
    getErrors() {
        return this.errors;
    }

    /**
     * Retorna lista de warnings
     * @returns {Array} Lista de warnings
     */
    getWarnings() {
        return this.warnings;
    }

    /**
     * Verifica se há erros
     * @returns {boolean} True se há erros
     */
    hasErrors() {
        return this.errors.length > 0;
    }

    /**
     * Verifica se há warnings
     * @returns {boolean} True se há warnings
     */
    hasWarnings() {
        return this.warnings.length > 0;
    }
}

export default DataValidator;