/**
 * PreProcessingHook.js - Hook de Validação Pré-Processamento
 * 
 * RESPONSABILIDADE: Validar dados antes do processamento ETL iniciar
 * PRINCÍPIOS: NO FALLBACKS, Fail-Fast, Single Responsibility
 * INTEGRAÇÃO: Primeiro ponto de validação no pipeline ETL
 * 
 * @author Sistema Expertzy - ETL Validation Module
 * @version 1.0.0
 */

/**
 * Hook de validação pré-processamento
 * Executa antes de qualquer processamento ETL começar
 * 
 * @param {Object} data - Dados XML brutos ou objeto a processar
 * @param {Object} context - Contexto obrigatório com metadata
 * @returns {Object} Resultado da validação
 */
export async function preProcessingValidation(data, context) {
    // NO FALLBACKS - todos os parâmetros obrigatórios
    if (!data) {
        throw new Error('PreProcessingHook: data é obrigatório para validação pré-processamento');
    }
    
    if (!context) {
        throw new Error('PreProcessingHook: context é obrigatório para validação pré-processamento');
    }
    
    const result = {
        success: true,
        errors: [],
        warnings: [],
        metrics: {
            dataType: typeof data,
            contextKeys: Object.keys(context),
            timestamp: new Date().toISOString()
        }
    };
    
    try {
        // Validar estrutura básica dos dados de entrada
        await validateInputStructure(data, result);
        
        // Validar contexto obrigatório
        await validateContext(context, result);
        
        // Validar precondições para processamento ETL
        await validateETLPreconditions(data, context, result);
        
        console.log(`✅ PreProcessingHook: Validação pré-processamento ${result.success ? 'bem-sucedida' : 'falhou'}`);
        
    } catch (error) {
        result.success = false;
        result.errors.push({
            type: 'PRE_PROCESSING_VALIDATION_ERROR',
            message: `Erro na validação pré-processamento: ${error.message}`,
            timestamp: new Date().toISOString()
        });
        console.error('❌ PreProcessingHook: Erro crítico:', error);
    }
    
    return result;
}

/**
 * Valida estrutura básica dos dados de entrada
 * NO FALLBACKS: Falha explícita para dados inválidos
 * 
 * @private
 */
async function validateInputStructure(data, result) {
    if (!data) {
        throw new Error('validateInputStructure: data é obrigatório');
    }
    
    if (!result) {
        throw new Error('validateInputStructure: result é obrigatório');
    }
    
    // Validar que temos dados válidos para processar
    if (typeof data !== 'object' || data === null) {
        result.errors.push({
            type: 'INVALID_INPUT_STRUCTURE',
            message: 'Dados de entrada devem ser objeto não-nulo',
            received: typeof data
        });
        return;
    }
    
    // Se for XML string, validar que é XML válido
    if (typeof data === 'string') {
        if (data.trim().length === 0) {
            result.errors.push({
                type: 'EMPTY_INPUT_DATA',
                message: 'Dados de entrada estão vazios'
            });
            return;
        }
        
        if (!data.includes('<?xml')) {
            result.warnings.push({
                type: 'POSSIBLE_NON_XML_INPUT',
                message: 'Dados podem não ser XML válido - ausente declaração XML',
                recommendation: 'Verificar se entrada é XML de DI válido'
            });
        }
    }
    
    // Se for objeto, validar estrutura mínima
    if (typeof data === 'object') {
        const keys = Object.keys(data);
        if (keys.length === 0) {
            result.errors.push({
                type: 'EMPTY_INPUT_OBJECT',
                message: 'Objeto de entrada está vazio - sem propriedades'
            });
        }
    }
}

/**
 * Valida contexto obrigatório para processamento
 * NO FALLBACKS: Context deve ter estrutura específica
 * 
 * @private
 */
async function validateContext(context, result) {
    if (!context) {
        throw new Error('validateContext: context é obrigatório');
    }
    
    if (!result) {
        throw new Error('validateContext: result é obrigatório');
    }
    
    // Validar estrutura do contexto
    if (typeof context !== 'object' || context === null) {
        result.errors.push({
            type: 'INVALID_CONTEXT_STRUCTURE',
            message: 'Context deve ser objeto não-nulo',
            received: typeof context
        });
        return;
    }
    
    // Validar campos obrigatórios do contexto
    const requiredContextFields = ['source', 'operation'];
    
    for (const field of requiredContextFields) {
        if (context[field] === undefined || context[field] === null) {
            result.errors.push({
                type: 'MISSING_CONTEXT_FIELD',
                message: `Campo obrigatório ausente no context: ${field}`,
                field: field
            });
        }
    }
    
    // Validar valores específicos
    if (context.source && typeof context.source !== 'string') {
        result.errors.push({
            type: 'INVALID_CONTEXT_SOURCE',
            message: 'context.source deve ser string identificando origem dos dados'
        });
    }
    
    if (context.operation && typeof context.operation !== 'string') {
        result.errors.push({
            type: 'INVALID_CONTEXT_OPERATION',
            message: 'context.operation deve ser string identificando operação ETL'
        });
    }
}

/**
 * Valida precondições para processamento ETL
 * Verifica se sistema está pronto para processar dados
 * 
 * @private
 */
async function validateETLPreconditions(data, context, result) {
    if (!data) {
        throw new Error('validateETLPreconditions: data é obrigatório');
    }
    
    if (!context) {
        throw new Error('validateETLPreconditions: context é obrigatório');
    }
    
    if (!result) {
        throw new Error('validateETLPreconditions: result é obrigatório');
    }
    
    // Validar que operação ETL é suportada
    const supportedOperations = [
        'xml_to_di_processing',
        'data_transformation',
        'storage_validation',
        'export_preparation'
    ];
    
    if (context.operation && !supportedOperations.includes(context.operation)) {
        result.errors.push({
            type: 'UNSUPPORTED_ETL_OPERATION',
            message: `Operação ETL não suportada: ${context.operation}`,
            supported: supportedOperations
        });
    }
    
    // Validar recursos necessários disponíveis
    if (context.requiresDatabase !== undefined && context.requiresDatabase === true) {
        // Verificar se IndexedDB está disponível (contexto browser)
        if (typeof window !== 'undefined' && !window.indexedDB) {
            result.errors.push({
                type: 'MISSING_DATABASE_SUPPORT',
                message: 'IndexedDB não disponível - necessário para operação ETL'
            });
        }
    }
    
    // Validar tamanho dos dados para processamento
    const dataSize = JSON.stringify(data).length;
    const maxSize = 50 * 1024 * 1024; // 50MB limit
    
    if (dataSize > maxSize) {
        result.errors.push({
            type: 'DATA_SIZE_LIMIT_EXCEEDED',
            message: `Dados excedem limite de processamento: ${dataSize} bytes > ${maxSize} bytes`,
            dataSize: dataSize,
            maxSize: maxSize
        });
    } else if (dataSize > 10 * 1024 * 1024) { // 10MB warning
        result.warnings.push({
            type: 'LARGE_DATA_SIZE',
            message: `Dados são grandes (${Math.round(dataSize / 1024 / 1024)}MB) - processamento pode ser lento`,
            recommendation: 'Considerar processamento em lotes'
        });
    }
}

export default preProcessingValidation;