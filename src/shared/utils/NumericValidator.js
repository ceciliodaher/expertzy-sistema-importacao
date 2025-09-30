/**
 * NumericValidator.js - Validação Numérica Centralizada
 *
 * PRINCÍPIOS RIGOROSOS:
 * - NO FALLBACKS: Sempre throw Error para dados inválidos
 * - FAIL-FAST: Validação na origem, erro imediato
 * - EXPLICIT ERRORS: Mensagens claras e específicas
 * - DRY: Função única, usada por todos os módulos
 *
 * RESPONSABILIDADE: Single Source of Truth para parsing/validação numérica
 *
 * @module NumericValidator
 * @version 1.0.0
 * @date 2025-09-30
 */

/**
 * Parse e valida campo numérico com fail-fast explícito
 *
 * @param {*} value - Valor a ser parseado (string, number, ou qualquer tipo)
 * @param {string} fieldName - Nome do campo para mensagem de erro
 * @param {Object} options - Opções de validação
 * @param {boolean} options.allowZero - Se permite valor zero (padrão: true)
 * @param {boolean} options.allowNegative - Se permite valores negativos (padrão: false)
 * @param {number} options.min - Valor mínimo permitido (opcional)
 * @param {number} options.max - Valor máximo permitido (opcional)
 * @returns {number} Valor numérico parseado e validado
 * @throws {Error} Se valor inválido, null, undefined, ou fora dos limites
 *
 * @example
 * // Sucesso
 * parseNumericField("1500.50", "valor_aduaneiro") // Returns: 1500.50
 * parseNumericField(1500.50, "valor_aduaneiro")   // Returns: 1500.50
 *
 * // Erro explícito - NO FALLBACKS
 * parseNumericField(null, "valor_aduaneiro")      // Throws: "valor_aduaneiro ausente ou null..."
 * parseNumericField("abc", "valor_aduaneiro")     // Throws: "valor_aduaneiro inválido..."
 * parseNumericField(-100, "valor_aduaneiro")      // Throws: "valor_aduaneiro negativo não permitido"
 */
export function parseNumericField(value, fieldName, options = {}) {
    // Opções padrão
    const {
        allowZero = true,
        allowNegative = false,
        min = null,
        max = null
    } = options;

    // Validação 1: Valor ausente (null/undefined) - NO FALLBACKS
    if (value === null || value === undefined) {
        throw new Error(
            `Campo obrigatório ausente: ${fieldName} é null ou undefined. ` +
            `Verifique se o campo foi extraído corretamente do XML.`
        );
    }

    // Validação 2: Conversão para número
    let numericValue;

    if (typeof value === 'number') {
        numericValue = value;
    } else if (typeof value === 'string') {
        // Remover espaços em branco
        const trimmedValue = value.trim();

        if (trimmedValue === '') {
            throw new Error(
                `Campo obrigatório vazio: ${fieldName} é string vazia. ` +
                `Valor original: "${value}"`
            );
        }

        // Parse para float
        numericValue = parseFloat(trimmedValue);
    } else {
        throw new Error(
            `Tipo inválido para ${fieldName}: esperado number ou string, ` +
            `recebido ${typeof value}. Valor: ${JSON.stringify(value)}`
        );
    }

    // Validação 3: Resultado do parsing
    if (isNaN(numericValue)) {
        throw new Error(
            `Valor não-numérico para ${fieldName}: não foi possível converter "${value}" para número. ` +
            `Verifique se o valor no XML está correto.`
        );
    }

    // Validação 4: Infinito
    if (!isFinite(numericValue)) {
        throw new Error(
            `Valor infinito para ${fieldName}: ${value}. ` +
            `Isso pode indicar divisão por zero ou overflow.`
        );
    }

    // Validação 5: Zero (se não permitido)
    if (!allowZero && numericValue === 0) {
        throw new Error(
            `Valor zero não permitido para ${fieldName}. ` +
            `Se zero é válido, configure {allowZero: true}.`
        );
    }

    // Validação 6: Negativo (se não permitido)
    if (!allowNegative && numericValue < 0) {
        throw new Error(
            `Valor negativo não permitido para ${fieldName}: ${numericValue}. ` +
            `Valores monetários e quantidades devem ser positivos.`
        );
    }

    // Validação 7: Limites mínimo/máximo (se configurados)
    if (min !== null && numericValue < min) {
        throw new Error(
            `Valor de ${fieldName} abaixo do mínimo: ${numericValue} < ${min}. ` +
            `Verifique se o valor está correto.`
        );
    }

    if (max !== null && numericValue > max) {
        throw new Error(
            `Valor de ${fieldName} acima do máximo: ${numericValue} > ${max}. ` +
            `Isso pode indicar erro de parsing ou valor inconsistente.`
        );
    }

    // Sucesso: retornar valor validado
    return numericValue;
}

/**
 * Valida múltiplos campos numéricos em batch - DRY para validação em lote
 *
 * @param {Object} sourceObject - Objeto contendo os campos a validar
 * @param {Array<string|Object>} fieldList - Lista de campos a validar
 *   Pode ser array de strings: ['campo1', 'campo2']
 *   Ou array de objetos com opções: [{name: 'campo1', allowZero: false}, ...]
 * @param {string} contextName - Nome do contexto para mensagens de erro (ex: "DI", "Adição")
 * @returns {Object} Objeto com campos validados (mesmo sourceObject, mutado)
 * @throws {Error} Se qualquer campo falhar na validação
 *
 * @example
 * const totais = {
 *     valor_aduaneiro: "15000.50",
 *     ii_devido: "2250.00",
 *     ipi_devido: "0"
 * };
 *
 * // Valida e converte todos os campos
 * validateNumericFields(totais, ['valor_aduaneiro', 'ii_devido', 'ipi_devido'], 'Totais DI');
 * // totais agora tem valores numéricos: { valor_aduaneiro: 15000.50, ii_devido: 2250.00, ipi_devido: 0 }
 *
 * // Com opções específicas por campo
 * validateNumericFields(totais, [
 *     { name: 'valor_aduaneiro', allowZero: false },
 *     { name: 'ii_devido', allowZero: true }
 * ], 'Totais DI');
 */
export function validateNumericFields(sourceObject, fieldList, contextName = 'Objeto') {
    if (!sourceObject || typeof sourceObject !== 'object') {
        throw new Error(
            `${contextName}: objeto inválido para validação. ` +
            `Esperado objeto, recebido ${typeof sourceObject}`
        );
    }

    if (!Array.isArray(fieldList) || fieldList.length === 0) {
        throw new Error(
            `${contextName}: lista de campos inválida. ` +
            `Esperado array não-vazio, recebido ${typeof fieldList}`
        );
    }

    const errors = [];

    for (const fieldConfig of fieldList) {
        try {
            // Normalizar configuração (string ou objeto)
            const fieldName = typeof fieldConfig === 'string' ? fieldConfig : fieldConfig.name;
            const options = typeof fieldConfig === 'object' && fieldConfig.name ? fieldConfig : {};

            // Validar que campo existe no objeto
            if (!(fieldName in sourceObject)) {
                throw new Error(
                    `Campo ${fieldName} não encontrado em ${contextName}. ` +
                    `Campos disponíveis: ${Object.keys(sourceObject).join(', ')}`
                );
            }

            // Parse e validação
            const validatedValue = parseNumericField(
                sourceObject[fieldName],
                `${contextName}.${fieldName}`,
                options
            );

            // Mutar objeto original com valor validado
            sourceObject[fieldName] = validatedValue;

        } catch (error) {
            errors.push(error.message);
        }
    }

    // Se houver erros, lançar com todos os problemas encontrados
    if (errors.length > 0) {
        throw new Error(
            `Validação de ${contextName} falhou com ${errors.length} erro(s):\n` +
            errors.map((err, idx) => `  ${idx + 1}. ${err}`).join('\n')
        );
    }

    return sourceObject;
}

/**
 * Valida estrutura obrigatória de totais (nomenclatura oficial)
 *
 * @param {Object} totaisObject - Objeto contendo totais da DI
 * @returns {Object} Objeto validado com campos numéricos
 * @throws {Error} Se estrutura inválida ou campos ausentes
 *
 * @example
 * const totais = {
 *     valor_aduaneiro: "15000",
 *     ii_devido: "2250",
 *     ipi_devido: "3375",
 *     pis_devido: "244.50",
 *     cofins_devido: "1126.50",
 *     icms_devido: "4087.50",
 *     despesas_aduaneiras: "214.50"
 * };
 *
 * validateTotaisStructure(totais); // Valida todos os 7 campos obrigatórios
 */
export function validateTotaisStructure(totaisObject) {
    const camposObrigatorios = [
        'valor_aduaneiro',
        'ii_devido',
        'ipi_devido',
        'pis_devido',
        'cofins_devido',
        'icms_devido',
        'despesas_aduaneiras'
    ];

    return validateNumericFields(totaisObject, camposObrigatorios, 'Totais DI');
}

/**
 * Valida estrutura de tributos por adição (nomenclatura oficial)
 *
 * @param {Object} tributosObject - Objeto contendo tributos da adição
 * @returns {Object} Objeto validado com campos numéricos
 * @throws {Error} Se estrutura inválida ou campos ausentes
 *
 * @example
 * const tributos = {
 *     ii_aliquota_ad_valorem: "15.00",
 *     ii_valor_devido: "2250.00",
 *     ipi_aliquota_ad_valorem: "15.00",
 *     ipi_valor_devido: "3375.00",
 *     pis_aliquota_ad_valorem: "1.65",
 *     pis_valor_devido: "244.50",
 *     cofins_aliquota_ad_valorem: "7.60",
 *     cofins_valor_devido: "1126.50"
 * };
 *
 * validateTributosStructure(tributos); // Valida estrutura completa
 */
export function validateTributosStructure(tributosObject) {
    const camposObrigatorios = [
        'ii_aliquota_ad_valorem',
        'ii_valor_devido',
        'ipi_aliquota_ad_valorem',
        'ipi_valor_devido',
        'pis_aliquota_ad_valorem',
        'pis_valor_devido',
        'cofins_aliquota_ad_valorem',
        'cofins_valor_devido'
    ];

    return validateNumericFields(tributosObject, camposObrigatorios, 'Tributos Adição');
}

/**
 * Utilitário: Verificar se valor é numérico válido (sem throw)
 *
 * Útil para validações condicionais onde você quer verificar
 * mas não falhar imediatamente.
 *
 * @param {*} value - Valor a verificar
 * @returns {boolean} true se numérico válido, false caso contrário
 *
 * @example
 * if (!isNumericValue(campo)) {
 *     console.warn('Campo não numérico, usando validação explícita...');
 *     campo = parseNumericField(campo, 'nome_campo');
 * }
 */
export function isNumericValue(value) {
    if (value === null || value === undefined) return false;

    const num = typeof value === 'number' ? value : parseFloat(value);

    return !isNaN(num) && isFinite(num);
}

/**
 * Utilitário: Formatar número para exibição (sem validação)
 *
 * @param {number} value - Valor numérico
 * @param {number} decimals - Casas decimais (padrão: 2)
 * @returns {string} Valor formatado
 *
 * @example
 * formatNumeric(1500.5)    // "1500.50"
 * formatNumeric(1500.5, 0) // "1501"
 */
export function formatNumeric(value, decimals = 2) {
    if (typeof value !== 'number' || !isFinite(value)) {
        throw new Error(`formatNumeric requer número válido, recebido: ${typeof value}`);
    }

    return value.toFixed(decimals);
}

// Exportar como default também para compatibilidade
export default {
    parseNumericField,
    validateNumericFields,
    validateTotaisStructure,
    validateTributosStructure,
    isNumericValue,
    formatNumeric
};