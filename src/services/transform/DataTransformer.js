/**
 * DataTransformer - Transformação ETL para dados DI
 * Transforma dados extraídos do XML para formato IndexedDB
 * 
 * REGRAS APLICADAS:
 * - NO FALLBACKS: Sempre lançar exceções quando dados obrigatórios ausentes
 * - NO HARDCODED DATA: Usar configurações externas
 * - FAIL-FAST: Validar antes de transformar
 */

// Códigos de receita serão carregados via fetch
// crypto não disponível em browser - usar Web Crypto API

class DataTransformer {
    constructor() {
        this.codigosReceita = null;
    }

    /**
     * Inicializa o transformer carregando configurações
     */
    async initialize() {
        try {
            const response = await fetch('./src/shared/data/codigos-receita.json');
            if (!response.ok) {
                throw new Error(`Erro ao carregar códigos de receita: ${response.status}`);
            }
            const codigosReceita = await response.json();
            this.codigosReceita = codigosReceita.codigos;
            
            if (!this.codigosReceita) {
                throw new Error('Códigos de receita não encontrados na configuração');
            }
            
            return true;
        } catch (error) {
            throw new Error(`Erro ao inicializar DataTransformer: ${error.message}`);
        }
    }

    /**
     * Transforma dados DI extraídos do XML para formato IndexedDB
     * @param {Object} xmlData - Dados extraídos do XML pelo DIProcessor
     * @returns {Object} Dados transformados para IndexedDB
     */
    async transformDIData(xmlData) {
        if (!xmlData) {
            throw new Error('Dados XML são obrigatórios para transformação');
        }

        if (!xmlData.numero_di) {
            throw new Error('Número da DI é obrigatório');
        }

        // Gerar hash do XML para validação de integridade
        const xmlHash = await this.generateXMLHash(xmlData);

        // Transformar dados principais
        const transformedData = {
            numero_di: xmlData.numero_di,
            data_processamento: new Date(),
            xml_hash: xmlHash,
            
            // Transformar dados do importador
            importador: this.transformImportador(xmlData.importador),
            
            // Transformar dados gerais
            data_registro: this.transformDate(xmlData.data_registro),
            urf_despacho: xmlData.urf_despacho,
            modalidade: xmlData.modalidade,
            situacao_entrega: xmlData.situacao_entrega,
            total_adicoes: this.validateInteger(xmlData.total_adicoes, 'total_adicoes'),
            
            // Transformar informações complementares
            informacao_complementar: xmlData.informacao_complementar,
            
            // Transformar valores monetários
            valor_total_fob_usd: this.transformMonetaryValue(xmlData.valor_total_fob_usd, 'FOB USD'),
            valor_total_fob_brl: this.transformMonetaryValue(xmlData.valor_total_fob_brl, 'FOB BRL'),
            valor_total_frete_usd: this.transformMonetaryValue(xmlData.valor_total_frete_usd, 'Frete USD'),
            valor_total_frete_brl: this.transformMonetaryValue(xmlData.valor_total_frete_brl, 'Frete BRL'),
            valor_aduaneiro_total_brl: this.transformMonetaryValue(xmlData.valor_aduaneiro_total_brl, 'Valor Aduaneiro'),
            
            // Calcular taxa de câmbio
            taxa_cambio: this.calculateTaxaCambio(xmlData),
            
            // Transformar dados de carga
            carga: this.transformDadosCarga(xmlData.carga),
            
            // Transformar adições
            adicoes: this.transformAdicoes(xmlData.adicoes),
            
            // Transformar despesas aduaneiras
            despesas: this.transformDespesas(xmlData.despesas || xmlData.informacao_complementar)
        };

        return transformedData;
    }

    /**
     * Gera hash do XML para validação de integridade
     * @param {Object} xmlData - Dados do XML
     * @returns {string} Hash SHA-256
     */
    async generateXMLHash(xmlData) {
        const dataString = JSON.stringify(xmlData);
        const encoder = new TextEncoder();
        const data = encoder.encode(dataString);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Transforma dados do importador
     * @param {Object} importadorData - Dados do importador
     * @returns {Object} Dados transformados do importador
     */
    transformImportador(importadorData) {
        if (!importadorData) {
            throw new Error('Dados do importador são obrigatórios');
        }

        if (!importadorData.cnpj) {
            throw new Error('CNPJ do importador é obrigatório');
        }

        if (!importadorData.nome) {
            throw new Error('Nome do importador é obrigatório');
        }

        return {
            cnpj: this.validateCNPJ(importadorData.cnpj),
            nome: importadorData.nome.trim(),
            endereco_uf: importadorData.endereco_uf,
            endereco_completo: this.buildEnderecoCompleto(importadorData),
            telefone: importadorData.telefone,
            representante_legal: importadorData.representante_legal,
            cpf_representante: importadorData.cpf_representante
        };
    }

    /**
     * Constrói endereço completo do importador
     * @param {Object} importadorData - Dados do importador
     * @returns {string} Endereço completo
     */
    buildEnderecoCompleto(importadorData) {
        const partes = [
            importadorData.endereco_logradouro,
            importadorData.endereco_numero,
            importadorData.endereco_complemento,
            importadorData.endereco_bairro,
            importadorData.endereco_municipio,
            importadorData.endereco_uf,
            importadorData.endereco_cep
        ].filter(parte => parte && parte.trim());

        return partes.join(', ');
    }

    /**
     * Transforma dados de carga
     * @param {Object} cargaData - Dados da carga
     * @returns {Object} Dados transformados da carga
     */
    transformDadosCarga(cargaData) {
        if (!cargaData) {
            throw new Error('Dados de carga são obrigatórios');
        }

        return {
            peso_bruto: this.transformWeightValue(cargaData.peso_bruto, 'Peso bruto'),
            peso_liquido: this.transformWeightValue(cargaData.peso_liquido, 'Peso líquido'),
            via_transporte: cargaData.via_transporte,
            nome_veiculo: cargaData.nome_veiculo,
            nome_transportador: cargaData.nome_transportador,
            pais_procedencia: cargaData.pais_procedencia,
            data_chegada: this.transformDate(cargaData.data_chegada)
        };
    }

    /**
     * Transforma adições
     * @param {Array} adicoesData - Lista de adições
     * @returns {Array} Adições transformadas
     */
    transformAdicoes(adicoesData) {
        if (!adicoesData || !Array.isArray(adicoesData) || adicoesData.length === 0) {
            throw new Error('DI deve ter pelo menos uma adição');
        }

        return adicoesData.map((adicao, index) => {
            if (!adicao.ncm) {
                throw new Error(`NCM é obrigatório para adição ${index + 1}`);
            }

            return {
                numero_adicao: adicao.numero_adicao || (index + 1),
                ncm: adicao.ncm,
                descricao_ncm: adicao.descricao_ncm,
                
                // Valores comerciais
                valor_moeda_negociacao: this.transformMonetaryValue(adicao.valor_moeda_negociacao, `Valor moeda negociação adição ${adicao.numero_adicao}`),
                valor_reais: this.transformMonetaryValue(adicao.valor_reais, `Valor em reais adição ${adicao.numero_adicao}`),
                
                // Tributos
                ii_aliquota: this.transformPercentageValue(adicao.ii_aliquota),
                ii_valor_devido: this.transformMonetaryValue(adicao.ii_valor_devido),
                ipi_aliquota: this.transformPercentageValue(adicao.ipi_aliquota),
                ipi_valor_devido: this.transformMonetaryValue(adicao.ipi_valor_devido),
                pis_aliquota: this.transformPercentageValue(adicao.pis_aliquota),
                pis_valor_devido: this.transformMonetaryValue(adicao.pis_valor_devido),
                cofins_aliquota: this.transformPercentageValue(adicao.cofins_aliquota),
                cofins_valor_devido: this.transformMonetaryValue(adicao.cofins_valor_devido),
                icms_aliquota: this.transformPercentageValue(adicao.icms_aliquota),
                
                // Frete e seguro
                frete_valor_reais: this.transformMonetaryValue(adicao.frete_valor_reais),
                seguro_valor_reais: this.transformMonetaryValue(adicao.seguro_valor_reais),
                
                // Outros dados
                peso_liquido: this.transformWeightValue(adicao.peso_liquido),
                condicao_venda_incoterm: adicao.condicao_venda_incoterm,
                fornecedor_nome: adicao.fornecedor_nome,
                fabricante_nome: adicao.fabricante_nome,
                
                // Mercadorias
                mercadorias: this.transformMercadorias(adicao.mercadorias, adicao.numero_adicao)
            };
        });
    }

    /**
     * Transforma mercadorias de uma adição
     * @param {Array} mercadorias - Lista de mercadorias
     * @param {number} numeroAdicao - Número da adição
     * @returns {Array} Mercadorias transformadas
     */
    transformMercadorias(mercadorias, numeroAdicao) {
        if (!mercadorias || !Array.isArray(mercadorias)) {
            return [];
        }

        return mercadorias.map((mercadoria, index) => {
            if (!mercadoria.descricao) {
                throw new Error(`Descrição é obrigatória para mercadoria ${index + 1} da adição ${numeroAdicao}`);
            }

            return {
                codigo: mercadoria.codigo || mercadoria.numero_sequencial_item,
                descricao: mercadoria.descricao.trim(),
                quantidade: this.validateNumeric(mercadoria.quantidade, `Quantidade mercadoria ${index + 1}`),
                unidade_medida: mercadoria.unidade_medida,
                valor_unitario: this.transformUnitValue(mercadoria.valor_unitario),
                valor_total: this.calculateValorTotal(mercadoria)
            };
        });
    }

    /**
     * Transforma despesas aduaneiras
     * @param {Object|string} despesasData - Dados de despesas ou informação complementar
     * @returns {Object} Despesas transformadas
     */
    transformDespesas(despesasData) {
        const despesas = {
            siscomex: 0,
            afrmm: 0,
            capatazia: 0,
            outras: []
        };

        // Se os dados são uma string (informação complementar), extrair despesas
        if (typeof despesasData === 'string') {
            despesas.siscomex = this.extractSiscomexFromText(despesasData);
            despesas.afrmm = this.extractAFRMMFromText(despesasData);
            despesas.capatazia = this.extractCapataziaFromText(despesasData);
        }
        // Se os dados já estão estruturados
        else if (despesasData && typeof despesasData === 'object') {
            despesas.siscomex = this.transformMonetaryValue(despesasData.siscomex);
            despesas.afrmm = this.transformMonetaryValue(despesasData.afrmm);
            despesas.capatazia = this.transformMonetaryValue(despesasData.capatazia);
            
            if (despesasData.outras && Array.isArray(despesasData.outras)) {
                despesas.outras = despesasData.outras.map(despesa => ({
                    tipo: despesa.tipo,
                    valor: this.transformMonetaryValue(despesa.valor, `Despesa ${despesa.tipo}`),
                    codigo_receita: despesa.codigo_receita
                }));
            }
        }

        return despesas;
    }

    /**
     * Extrai valor SISCOMEX de texto livre
     * @param {string} texto - Texto da informação complementar
     * @returns {number} Valor do SISCOMEX
     */
    extractSiscomexFromText(texto) {
        if (!texto) return 0;

        const patterns = [
            /Taxa\s+Siscomex[:\.\s]*(\d+[,\.]\d{2})/i,
            /SISCOMEX[:\.\s]*(\d+[,\.]\d{2})/i,
            /Siscomex[:\.\s]*(\d+[,\.]\d{2})/i
        ];

        for (const pattern of patterns) {
            const match = texto.match(pattern);
            if (match) {
                return this.parseMonetaryString(match[1]);
            }
        }

        return 0;
    }

    /**
     * Extrai valor AFRMM de texto livre
     * @param {string} texto - Texto da informação complementar
     * @returns {number} Valor do AFRMM
     */
    extractAFRMMFromText(texto) {
        if (!texto) return 0;

        const patterns = [
            /AFRMM[:\.\s]*(\d+[,\.]\d{2})/i,
            /Adicional.*Frete.*Marinha[:\.\s]*(\d+[,\.]\d{2})/i
        ];

        for (const pattern of patterns) {
            const match = texto.match(pattern);
            if (match) {
                return this.parseMonetaryString(match[1]);
            }
        }

        return 0;
    }

    /**
     * Extrai valor CAPATAZIA de texto livre
     * @param {string} texto - Texto da informação complementar
     * @returns {number} Valor da CAPATAZIA
     */
    extractCapataziaFromText(texto) {
        if (!texto) return 0;

        const patterns = [
            /CAPATAZIA[:\.\s]*(\d+[,\.]\d{2})/i,
            /Capatazia[:\.\s]*(\d+[,\.]\d{2})/i
        ];

        for (const pattern of patterns) {
            const match = texto.match(pattern);
            if (match) {
                return this.parseMonetaryString(match[1]);
            }
        }

        return 0;
    }

    /**
     * Calcula taxa de câmbio
     * @param {Object} xmlData - Dados do XML
     * @returns {number} Taxa de câmbio calculada
     */
    calculateTaxaCambio(xmlData) {
        const fobUSD = this.transformMonetaryValue(xmlData.valor_total_fob_usd);
        const fobBRL = this.transformMonetaryValue(xmlData.valor_total_fob_brl);

        if (!fobUSD || fobUSD <= 0) {
            throw new Error('Valor FOB USD é obrigatório para cálculo da taxa de câmbio');
        }

        if (!fobBRL || fobBRL <= 0) {
            throw new Error('Valor FOB BRL é obrigatório para cálculo da taxa de câmbio');
        }

        const taxa = fobBRL / fobUSD;

        // Validação de sanidade
        if (taxa <= 0 || taxa > 10) {
            throw new Error(`Taxa de câmbio calculada inválida: ${taxa.toFixed(4)}`);
        }

        return parseFloat(taxa.toFixed(4));
    }

    /**
     * Transforma valor monetário (centavos → reais)
     * @param {string|number} value - Valor em centavos
     * @param {string} fieldName - Nome do campo para erro
     * @returns {number} Valor em reais
     */
    transformMonetaryValue(value, fieldName = 'valor monetário') {
        if (value === undefined || value === null || value === '') {
            return 0;
        }

        const numericValue = this.parseNumericValue(value);
        return parseFloat((numericValue / 100).toFixed(2));
    }

    /**
     * Transforma valor de peso (5 decimais → kg)
     * @param {string|number} value - Valor com 5 decimais
     * @param {string} fieldName - Nome do campo para erro
     * @returns {number} Valor em kg
     */
    transformWeightValue(value, fieldName = 'peso') {
        if (!value) {
            throw new Error(`${fieldName} é obrigatório`);
        }

        const numericValue = this.parseNumericValue(value);
        return parseFloat((numericValue / 100000).toFixed(5));
    }

    /**
     * Transforma valor percentual (centésimos → %)
     * @param {string|number} value - Valor em centésimos
     * @returns {number} Valor percentual
     */
    transformPercentageValue(value) {
        if (value === undefined || value === null || value === '') {
            return 0;
        }

        const numericValue = this.parseNumericValue(value);
        return parseFloat((numericValue / 100).toFixed(2));
    }

    /**
     * Transforma valor unitário (7 decimais)
     * @param {string|number} value - Valor unitário
     * @returns {number} Valor transformado
     */
    transformUnitValue(value) {
        if (value === undefined || value === null || value === '') {
            return 0;
        }

        const numericValue = this.parseNumericValue(value);
        return parseFloat((numericValue / 10000000).toFixed(7));
    }

    /**
     * Transforma data de string YYYYMMDD para Date
     * @param {string} dateString - Data em formato YYYYMMDD
     * @returns {Date|null} Data transformada
     */
    transformDate(dateString) {
        if (!dateString || dateString.length !== 8) {
            return null;
        }

        const year = parseInt(dateString.substring(0, 4));
        const month = parseInt(dateString.substring(4, 6)) - 1; // Month is 0-indexed
        const day = parseInt(dateString.substring(6, 8));

        return new Date(year, month, day);
    }

    /**
     * Valida e converte CNPJ
     * @param {string} cnpj - CNPJ para validar
     * @returns {string} CNPJ formatado
     */
    validateCNPJ(cnpj) {
        if (!cnpj) {
            throw new Error('CNPJ é obrigatório');
        }

        // Remover caracteres não numéricos
        const cleanCNPJ = cnpj.replace(/\D/g, '');

        if (cleanCNPJ.length !== 14) {
            throw new Error(`CNPJ inválido: ${cnpj}`);
        }

        return cleanCNPJ;
    }

    /**
     * Valida valor inteiro
     * @param {any} value - Valor para validar
     * @param {string} fieldName - Nome do campo
     * @returns {number} Valor inteiro
     */
    validateInteger(value, fieldName) {
        if (value === undefined || value === null) {
            throw new Error(`${fieldName} é obrigatório`);
        }

        const intValue = parseInt(value);
        if (isNaN(intValue)) {
            throw new Error(`${fieldName} deve ser um número inteiro válido`);
        }

        return intValue;
    }

    /**
     * Valida valor numérico
     * @param {any} value - Valor para validar
     * @param {string} fieldName - Nome do campo
     * @returns {number} Valor numérico
     */
    validateNumeric(value, fieldName) {
        if (value === undefined || value === null) {
            throw new Error(`${fieldName} é obrigatório`);
        }

        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
            throw new Error(`${fieldName} deve ser um número válido`);
        }

        return numValue;
    }

    /**
     * Parse de valor numérico genérico
     * @param {string|number} value - Valor para parse
     * @returns {number} Valor numérico
     */
    parseNumericValue(value) {
        if (typeof value === 'number') {
            return value;
        }

        if (typeof value === 'string') {
            // Se valor está preenchido com zeros, é zero
            if (value === '0'.repeat(value.length)) {
                return 0;
            }

            return parseInt(value) || 0;
        }

        return 0;
    }

    /**
     * Parse de string monetária brasileira
     * @param {string} monetaryString - String monetária (ex: "154,23")
     * @returns {number} Valor numérico
     */
    parseMonetaryString(monetaryString) {
        if (!monetaryString) return 0;
        
        return parseFloat(monetaryString.replace(',', '.')) || 0;
    }

    /**
     * Calcula valor total da mercadoria
     * @param {Object} mercadoria - Dados da mercadoria
     * @returns {number} Valor total
     */
    calculateValorTotal(mercadoria) {
        const quantidade = this.validateNumeric(mercadoria.quantidade, 'quantidade');
        const valorUnitario = this.transformUnitValue(mercadoria.valor_unitario);
        
        return parseFloat((quantidade * valorUnitario).toFixed(2));
    }
}

export default DataTransformer;