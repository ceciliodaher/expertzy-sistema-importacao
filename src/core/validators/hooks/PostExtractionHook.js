/**
 * PostExtractionHook.js - Hook de Validação Pós-Extração
 * 
 * RESPONSABILIDADE: Validar dados após extração XML pelo DIProcessor
 * PRINCÍPIOS: NO FALLBACKS, NO HARDCODED DATA, Fail-Fast, Nomenclatura Oficial DIProcessor
 * INTEGRAÇÃO: Validação imediatamente após DIProcessor.parseXML()
 * 
 * @author Sistema Expertzy - ETL Validation Module
 * @version 1.0.0
 */

import { ConfigLoader } from '@shared/utils/ConfigLoader.js';

// Cache para configurações carregadas
let validationRulesCache = null;
let estadosCache = null;

/**
 * Hook de validação pós-extração
 * Executa após DIProcessor extrair dados do XML da DI
 * NO HARDCODED DATA: Todas as regras vêm de arquivos JSON
 * 
 * @param {Object} data - Dados extraídos pelo DIProcessor
 * @param {Object} context - Contexto obrigatório da extração
 * @returns {Object} Resultado da validação
 */
export async function postExtractionValidation(data, context) {
    // NO FALLBACKS - todos os parâmetros obrigatórios
    if (!data) {
        throw new Error('PostExtractionHook: data é obrigatório para validação pós-extração');
    }
    
    if (!context) {
        throw new Error('PostExtractionHook: context é obrigatório para validação pós-extração');
    }
    
    const result = {
        success: true,
        errors: [],
        warnings: [],
        metrics: {
            extractedFields: Object.keys(data),
            fieldCount: Object.keys(data).length,
            timestamp: new Date().toISOString(),
            validationPhase: 'post_extraction'
        }
    };
    
    try {
        // Carregar regras de validação - NO HARDCODED DATA
        await loadValidationConfigurations();
        
        // Validar campos obrigatórios da DI (nomenclatura DIProcessor)
        await validateRequiredDIFields(data, result);
        
        // Validar estrutura das adições
        await validateAdditionsStructure(data, result);
        
        // Validar dados do importador
        await validateImporterData(data, result);
        
        // Validar consistência de valores monetários
        await validateMonetaryConsistency(data, result);
        
        // Validar contexto de extração
        await validateExtractionContext(context, result);
        
        console.log(`✅ PostExtractionHook: Validação pós-extração ${result.success ? 'bem-sucedida' : 'falhou'}`);
        
    } catch (error) {
        result.success = false;
        result.errors.push({
            type: 'POST_EXTRACTION_VALIDATION_ERROR',
            message: `Erro na validação pós-extração: ${error.message}`,
            timestamp: new Date().toISOString()
        });
        console.error('❌ PostExtractionHook: Erro crítico:', error);
    }
    
    return result;
}

/**
 * Carrega configurações de validação
 * NO HARDCODED DATA: Todas as regras vêm de arquivos JSON
 * 
 * @private
 */
async function loadValidationConfigurations() {
    if (validationRulesCache && estadosCache) {
        return; // Já carregadas
    }
    
    try {
        const configLoader = new ConfigLoader();
        
        // Carregar regras de validação ETL
        const validationRulesResponse = await fetch(new URL('../../../shared/data/etl-validation/validation-rules.json', import.meta.url));
        if (!validationRulesResponse.ok) {
            throw new Error(`Erro ao carregar validation-rules.json: ${validationRulesResponse.status}`);
        }
        validationRulesCache = await validationRulesResponse.json();
        
        // Carregar estados brasileiros
        estadosCache = await configLoader.loadConfig('estados-brasil.json');
        
        if (!validationRulesCache) {
            throw new Error('Falha ao carregar regras de validação ETL');
        }
        
        if (!estadosCache) {
            throw new Error('Falha ao carregar dados de estados brasileiros');
        }
        
        console.log('✅ PostExtractionHook: Configurações de validação carregadas');
        
    } catch (error) {
        console.error('❌ PostExtractionHook: Erro ao carregar configurações:', error);
        throw new Error(`Falha ao carregar configurações de validação: ${error.message}`);
    }
}

/**
 * Valida campos obrigatórios da DI usando configurações JSON
 * NO HARDCODED DATA: Lista de campos vem do validation-rules.json
 * 
 * @private
 */
async function validateRequiredDIFields(data, result) {
    if (!data) {
        throw new Error('validateRequiredDIFields: data é obrigatório');
    }
    
    if (!result) {
        throw new Error('validateRequiredDIFields: result é obrigatório');
    }
    
    if (!validationRulesCache) {
        throw new Error('validateRequiredDIFields: regras de validação não carregadas');
    }
    
    // Campos obrigatórios vindos da configuração - NO HARDCODED DATA
    const requiredFields = validationRulesCache.campos_obrigatorios.di_basica;
    
    if (!Array.isArray(requiredFields)) {
        throw new Error('Configuração de campos obrigatórios inválida');
    }
    
    for (const field of requiredFields) {
        if (data[field] === undefined || data[field] === null) {
            result.errors.push({
                type: 'MISSING_REQUIRED_DI_FIELD',
                message: validationRulesCache.mensagens_erro.campo_obrigatorio_ausente.replace('{campo}', field),
                field: field,
                phase: 'post_extraction'
            });
        } else if (typeof data[field] === 'string' && data[field].trim() === '') {
            result.errors.push({
                type: 'EMPTY_REQUIRED_DI_FIELD',
                message: validationRulesCache.mensagens_erro.campo_obrigatorio_vazio.replace('{campo}', field),
                field: field
            });
        }
    }
    
    // Validações específicas de formato vindas da configuração
    validateFieldFormat(data, 'numero_di', result);
    validateFieldFormat(data, 'importador_cnpj', result);
}

/**
 * Valida formato de campo específico usando regras da configuração
 * NO HARDCODED DATA: Regras de formato vem do validation-rules.json
 * 
 * @private
 */
function validateFieldFormat(data, fieldName, result) {
    if (!data) {
        throw new Error('validateFieldFormat: data é obrigatório');
    }
    
    if (!fieldName) {
        throw new Error('validateFieldFormat: fieldName é obrigatório');
    }
    
    if (!result) {
        throw new Error('validateFieldFormat: result é obrigatório');
    }
    
    if (!validationRulesCache) {
        throw new Error('validateFieldFormat: regras de validação não carregadas');
    }
    
    const fieldValue = data[fieldName];
    if (fieldValue === undefined || fieldValue === null) {
        return; // Campo ausente será validado em outro lugar
    }
    
    // Mapear nomes de campos para regras de validação
    const formatRules = {
        'numero_di': validationRulesCache.validacao_formatos.numero_di,
        'importador_cnpj': validationRulesCache.validacao_formatos.cnpj,
        'ncm': validationRulesCache.validacao_formatos.ncm
    };
    
    const rule = formatRules[fieldName];
    if (!rule) {
        return; // Sem regra específica para este campo
    }
    
    const stringValue = String(fieldValue);
    
    // Validar tamanho
    if (rule.tamanho_minimo && stringValue.length < rule.tamanho_minimo) {
        result.warnings.push({
            type: 'FIELD_FORMAT_WARNING',
            message: validationRulesCache.mensagens_erro.formato_invalido
                .replace('{campo}', fieldName)
                .replace('{valor}', fieldValue)
                .replace('{descricao}', rule.descricao),
            field: fieldName
        });
    }
    
    if (rule.tamanho_exato && stringValue.length !== rule.tamanho_exato) {
        result.errors.push({
            type: 'INVALID_FIELD_FORMAT',
            message: validationRulesCache.mensagens_erro.formato_invalido
                .replace('{campo}', fieldName)
                .replace('{valor}', fieldValue)
                .replace('{descricao}', rule.descricao),
            field: fieldName
        });
    }
    
    // Validar padrão regex se especificado
    if (rule.pattern) {
        const regex = new RegExp(rule.pattern);
        if (!regex.test(stringValue)) {
            result.errors.push({
                type: 'INVALID_FIELD_PATTERN',
                message: validationRulesCache.mensagens_erro.formato_invalido
                    .replace('{campo}', fieldName)
                    .replace('{valor}', fieldValue)
                    .replace('{descricao}', rule.descricao),
                field: fieldName
            });
        }
    }
}

/**
 * Valida estrutura das adições usando configurações JSON
 * NO HARDCODED DATA: Campos obrigatórios vem do validation-rules.json
 * 
 * @private
 */
async function validateAdditionsStructure(data, result) {
    if (!data) {
        throw new Error('validateAdditionsStructure: data é obrigatório');
    }
    
    if (!result) {
        throw new Error('validateAdditionsStructure: result é obrigatório');
    }
    
    if (!validationRulesCache) {
        throw new Error('validateAdditionsStructure: regras de validação não carregadas');
    }
    
    // Validar campo 'adicoes' (nomenclatura oficial)
    if (data.adicoes === undefined || data.adicoes === null) {
        result.errors.push({
            type: 'MISSING_ADDITIONS',
            message: validationRulesCache.mensagens_erro.campo_obrigatorio_ausente.replace('{campo}', 'adicoes'),
            field: 'adicoes'
        });
        return;
    }
    
    if (!Array.isArray(data.adicoes)) {
        result.errors.push({
            type: 'INVALID_ADDITIONS_TYPE',
            message: validationRulesCache.mensagens_erro.tipo_invalido
                .replace('{campo}', 'adicoes')
                .replace('{tipo_esperado}', 'array')
                .replace('{tipo_recebido}', typeof data.adicoes),
            field: 'adicoes'
        });
        return;
    }
    
    if (data.adicoes.length === 0) {
        result.errors.push({
            type: 'EMPTY_ADDITIONS_ARRAY',
            message: validationRulesCache.mensagens_erro.array_vazio.replace('{campo}', 'adicoes'),
            field: 'adicoes'
        });
        return;
    }
    
    // Validar limite máximo de adições
    const maxAdditions = validationRulesCache.limites_processamento.max_adicoes_por_di;
    if (data.adicoes.length > maxAdditions) {
        result.errors.push({
            type: 'TOO_MANY_ADDITIONS',
            message: `DI contém ${data.adicoes.length} adições, máximo permitido: ${maxAdditions}`,
            field: 'adicoes',
            count: data.adicoes.length,
            maxAllowed: maxAdditions
        });
    }
    
    // Campos obrigatórios em cada adição - NO HARDCODED DATA
    const requiredAdditionFields = validationRulesCache.campos_obrigatorios.adicao;
    
    // Validar cada adição individualmente
    for (let i = 0; i < data.adicoes.length; i++) {
        const adicao = data.adicoes[i];
        
        if (!adicao || typeof adicao !== 'object') {
            result.errors.push({
                type: 'INVALID_ADDITION_STRUCTURE',
                message: `Adição ${i + 1} deve ser objeto`,
                additionIndex: i
            });
            continue;
        }
        
        // Validar campos obrigatórios da configuração
        for (const field of requiredAdditionFields) {
            if (adicao[field] === undefined || adicao[field] === null) {
                result.errors.push({
                    type: 'MISSING_ADDITION_FIELD',
                    message: validationRulesCache.mensagens_erro.campo_obrigatorio_ausente
                        .replace('{campo}', `${field} na adição ${i + 1}`),
                    field: field,
                    additionIndex: i
                });
            }
        }
        
        // Validar formato NCM usando configuração
        if (adicao.ncm) {
            validateNCMFormat(adicao.ncm, i, result);
        }
    }
    
    // Atualizar métricas
    result.metrics.totalAdditions = data.adicoes.length;
}

/**
 * Valida formato NCM usando regras da configuração
 * NO HARDCODED DATA: Regras vem do validation-rules.json
 * 
 * @private
 */
function validateNCMFormat(ncm, additionIndex, result) {
    if (!ncm) {
        throw new Error('validateNCMFormat: ncm é obrigatório');
    }
    
    if (additionIndex === undefined || additionIndex === null) {
        throw new Error('validateNCMFormat: additionIndex é obrigatório');
    }
    
    if (!result) {
        throw new Error('validateNCMFormat: result é obrigatório');
    }
    
    if (!validationRulesCache) {
        throw new Error('validateNCMFormat: regras de validação não carregadas');
    }
    
    const ncmRule = validationRulesCache.validacao_formatos.ncm;
    const ncmString = String(ncm);
    
    if (ncmString.length !== ncmRule.tamanho_exato) {
        result.errors.push({
            type: 'INVALID_NCM_FORMAT',
            message: validationRulesCache.mensagens_erro.formato_invalido
                .replace('{campo}', `NCM na adição ${additionIndex + 1}`)
                .replace('{valor}', ncm)
                .replace('{descricao}', ncmRule.descricao),
            field: 'ncm',
            additionIndex: additionIndex
        });
    }
    
    // Validar padrão numérico
    const regex = new RegExp(ncmRule.pattern);
    if (!regex.test(ncmString)) {
        result.errors.push({
            type: 'INVALID_NCM_PATTERN',
            message: validationRulesCache.mensagens_erro.formato_invalido
                .replace('{campo}', `NCM na adição ${additionIndex + 1}`)
                .replace('{valor}', ncm)
                .replace('{descricao}', ncmRule.descricao),
            field: 'ncm',
            additionIndex: additionIndex
        });
    }
}

/**
 * Valida dados do importador usando configurações JSON
 * NO HARDCODED DATA: Lista de UFs válidas vem do estados-brasil.json
 * 
 * @private
 */
async function validateImporterData(data, result) {
    if (!data) {
        throw new Error('validateImporterData: data é obrigatório');
    }
    
    if (!result) {
        throw new Error('validateImporterData: result é obrigatório');
    }
    
    if (!estadosCache) {
        throw new Error('validateImporterData: dados de estados não carregados');
    }
    
    // Validar nome do importador
    if (data.importador_nome && typeof data.importador_nome === 'string') {
        if (data.importador_nome.trim().length < 3) {
            result.warnings.push({
                type: 'SHORT_IMPORTER_NAME',
                message: 'Nome do importador muito curto - verificar se está completo',
                field: 'importador_nome'
            });
        }
    }
    
    // Validar UF usando dados do estados-brasil.json - NO HARDCODED DATA
    if (data.importador_endereco_uf && typeof data.importador_endereco_uf === 'string') {
        const validUFs = estadosCache.estados.map(estado => estado.codigo);
        
        if (!validUFs.includes(data.importador_endereco_uf)) {
            result.errors.push({
                type: 'INVALID_UF',
                message: validationRulesCache.mensagens_erro.formato_invalido
                    .replace('{campo}', 'importador_endereco_uf')
                    .replace('{valor}', data.importador_endereco_uf)
                    .replace('{descricao}', 'UF deve ser código válido de estado brasileiro'),
                field: 'importador_endereco_uf',
                validValues: validUFs
            });
        }
    }
}

/**
 * Valida consistência de valores monetários usando configurações JSON
 * NO HARDCODED DATA: Tolerâncias vem do validation-rules.json
 * 
 * @private
 */
async function validateMonetaryConsistency(data, result) {
    if (!data) {
        throw new Error('validateMonetaryConsistency: data é obrigatório');
    }
    
    if (!result) {
        throw new Error('validateMonetaryConsistency: result é obrigatório');
    }
    
    if (!validationRulesCache) {
        throw new Error('validateMonetaryConsistency: regras de validação não carregadas');
    }
    
    const monetaryRules = validationRulesCache.validacao_valores.monetarios;
    const tolerance = validationRulesCache.tolerancias.conversao_monetaria.absoluta;
    
    // Validar valores monetários
    const monetaryFields = ['valor_total_fob_usd', 'valor_aduaneiro_total_brl'];
    
    for (const field of monetaryFields) {
        if (data[field] !== undefined) {
            if (typeof data[field] !== monetaryRules.tipo) {
                result.errors.push({
                    type: 'INVALID_MONETARY_VALUE_TYPE',
                    message: validationRulesCache.mensagens_erro.tipo_invalido
                        .replace('{campo}', field)
                        .replace('{tipo_esperado}', monetaryRules.tipo)
                        .replace('{tipo_recebido}', typeof data[field]),
                    field: field
                });
            } else if (data[field] < monetaryRules.valor_minimo || data[field] > monetaryRules.valor_maximo) {
                result.errors.push({
                    type: 'INVALID_MONETARY_VALUE_RANGE',
                    message: validationRulesCache.mensagens_erro.valor_fora_limite
                        .replace('{campo}', field)
                        .replace('{valor}', data[field])
                        .replace('{min}', monetaryRules.valor_minimo)
                        .replace('{max}', monetaryRules.valor_maximo),
                    field: field,
                    received: data[field]
                });
            }
        }
    }
    
    // Validar consistência entre USD e BRL usando tolerância da configuração
    if (data.valor_total_fob_usd && data.valor_total_fob_brl && data.taxa_cambio) {
        const expectedBRL = data.valor_total_fob_usd * data.taxa_cambio;
        
        if (Math.abs(data.valor_total_fob_brl - expectedBRL) > tolerance) {
            result.warnings.push({
                type: 'CURRENCY_CONVERSION_INCONSISTENCY',
                message: validationRulesCache.mensagens_erro.inconsistencia_conversao
                    .replace('{moeda1}', 'USD')
                    .replace('{moeda2}', 'BRL')
                    .replace('{esperado}', expectedBRL)
                    .replace('{recebido}', data.valor_total_fob_brl),
                expected: expectedBRL,
                received: data.valor_total_fob_brl,
                difference: Math.abs(data.valor_total_fob_brl - expectedBRL)
            });
        }
    }
}

/**
 * Valida contexto de extração usando configurações JSON
 * NO HARDCODED DATA: Campos obrigatórios vem do validation-rules.json
 * 
 * @private
 */
async function validateExtractionContext(context, result) {
    if (!context) {
        throw new Error('validateExtractionContext: context é obrigatório');
    }
    
    if (!result) {
        throw new Error('validateExtractionContext: result é obrigatório');
    }
    
    if (!validationRulesCache) {
        throw new Error('validateExtractionContext: regras de validação não carregadas');
    }
    
    // Validar que contexto indica extração bem-sucedida
    if (context.extractionSuccess !== undefined && context.extractionSuccess === false) {
        result.errors.push({
            type: 'EXTRACTION_CONTEXT_FAILURE',
            message: 'Context indica falha na extração XML',
            context: context
        });
    }
    
    // Validar origem dos dados
    if (context.xmlSource && typeof context.xmlSource === 'string') {
        if (context.xmlSource.trim() === '') {
            result.warnings.push({
                type: 'EMPTY_XML_SOURCE',
                message: 'Origem do XML não especificada no contexto'
            });
        }
    }
}

export default postExtractionValidation;