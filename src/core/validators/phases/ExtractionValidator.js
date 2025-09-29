/**
 * ExtractionValidator.js - Validador de Fase de Extração XML
 * 
 * RESPONSABILIDADE: Validar dados extraídos do XML pelo DIProcessor
 * PRINCÍPIOS: NO FALLBACKS, NO HARDCODED DATA, Nomenclatura Oficial DIProcessor
 * INTEGRAÇÃO: Valida estrutura e integridade após DIProcessor.parseXML()
 * 
 * @author Sistema Expertzy - ETL Validation Module
 * @version 1.0.0
 */

import { ConfigLoader } from '@shared/utils/ConfigLoader.js';

export class ExtractionValidator {
    constructor() {
        this.validationRules = null;
        this.estadosBrasil = null;
        this.validationFields = null;
        this.configsLoaded = false;
        
        console.log('🔍 ExtractionValidator: Inicializando validador de extração');
        this.loadValidationConfigurations();
    }
    
    /**
     * Carrega configurações de validação
     * NO HARDCODED DATA: Todas as regras vêm de arquivos JSON
     */
    async loadValidationConfigurations() {
        try {
            const configLoader = new ConfigLoader();
            
            // Carregar regras de validação ETL
            const validationRulesResponse = await fetch(new URL('../../../shared/data/etl-validation/validation-rules.json', import.meta.url));
            if (!validationRulesResponse.ok) {
                throw new Error(`Erro ao carregar validation-rules.json: ${validationRulesResponse.status}`);
            }
            this.validationRules = await validationRulesResponse.json();
            
            // Carregar dados de estados brasileiros
            this.estadosBrasil = await configLoader.loadConfig('estados-brasil.json');
            
            // Carregar regras de validação de campos
            this.validationFields = await configLoader.loadConfig('validacao-campos.json');
            
            if (!this.validationRules) {
                throw new Error('ExtractionValidator: Falha ao carregar regras de validação');
            }
            
            if (!this.estadosBrasil) {
                throw new Error('ExtractionValidator: Falha ao carregar dados de estados');
            }
            
            if (!this.validationFields) {
                throw new Error('ExtractionValidator: Falha ao carregar regras de campos');
            }
            
            this.configsLoaded = true;
            console.log('✅ ExtractionValidator: Configurações carregadas');
            
        } catch (error) {
            console.error('❌ ExtractionValidator: Erro ao carregar configurações:', error);
            throw new Error(`Falha ao carregar configurações: ${error.message}`);
        }
    }
    
    /**
     * Valida dados extraídos do XML
     * NO FALLBACKS: Todos os parâmetros obrigatórios
     * 
     * @param {Object} extractedData - Dados extraídos pelo DIProcessor
     * @param {Object} context - Contexto da extração
     * @returns {Object} Resultado da validação
     */
    async validateExtraction(extractedData, context) {
        // NO FALLBACKS - parâmetros obrigatórios
        if (!extractedData) {
            throw new Error('ExtractionValidator: extractedData é obrigatório');
        }
        
        if (!context) {
            throw new Error('ExtractionValidator: context é obrigatório');
        }
        
        if (!this.configsLoaded) {
            throw new Error('ExtractionValidator: Configurações não carregadas - aguarde inicialização');
        }
        
        const startTime = Date.now();
        const validationId = `extraction_${Date.now()}`;
        
        console.log(`🔍 ExtractionValidator: Iniciando validação de extração - ID: ${validationId}`);
        
        const result = {
            validationId,
            phase: 'extraction',
            timestamp: new Date().toISOString(),
            duration: 0,
            success: true,
            errors: [],
            warnings: [],
            metrics: {
                fieldsValidated: 0,
                additionsValidated: 0,
                structuralChecks: 0,
                formatValidations: 0
            }
        };
        
        try {
            // 1. Validar estrutura básica da DI
            await this._validateBasicDIStructure(extractedData, result);
            
            // 2. Validar campos obrigatórios
            await this._validateRequiredFields(extractedData, result);
            
            // 3. Validar formatos de campos
            await this._validateFieldFormats(extractedData, result);
            
            // 4. Validar estrutura de adições
            await this._validateAdditionsStructure(extractedData, result);
            
            // 5. Validar dados do importador
            await this._validateImporterData(extractedData, result);
            
            // 6. Validar valores monetários
            await this._validateMonetaryValues(extractedData, result);
            
            // 7. Validar consistência de dados
            await this._validateDataConsistency(extractedData, result);
            
            // 8. Validar contexto de extração
            await this._validateExtractionContext(context, result);
            
            result.duration = Date.now() - startTime;
            
            if (result.success) {
                console.log(`✅ ExtractionValidator: Validação concluída com sucesso em ${result.duration}ms`);
            } else {
                console.error(`❌ ExtractionValidator: Validação falhou com ${result.errors.length} erros`);
            }
            
        } catch (error) {
            result.success = false;
            result.duration = Date.now() - startTime;
            result.errors.push({
                type: 'EXTRACTION_VALIDATION_SYSTEM_ERROR',
                message: `Erro crítico na validação de extração: ${error.message}`,
                timestamp: new Date().toISOString()
            });
            
            console.error('❌ ExtractionValidator: Erro crítico:', error);
        }
        
        return result;
    }
    
    /**
     * Valida estrutura básica da DI
     * NO FALLBACKS: Estrutura obrigatória definida na configuração
     * 
     * @private
     */
    async _validateBasicDIStructure(data, result) {
        if (!data) {
            throw new Error('_validateBasicDIStructure: data é obrigatório');
        }
        
        if (!result) {
            throw new Error('_validateBasicDIStructure: result é obrigatório');
        }
        
        result.metrics.structuralChecks++;
        
        // Validar que é objeto
        if (typeof data !== 'object' || data === null) {
            result.success = false;
            result.errors.push({
                type: 'INVALID_DI_STRUCTURE',
                message: 'Dados extraídos devem ser objeto não-nulo',
                received: typeof data
            });
            return;
        }
        
        // Validar presença de seções principais
        const mainSections = ['adicoes'];
        
        for (const section of mainSections) {
            if (data[section] === undefined || data[section] === null) {
                result.success = false;
                result.errors.push({
                    type: 'MISSING_MAIN_SECTION',
                    message: this.validationRules.mensagens_erro.campo_obrigatorio_ausente.replace('{campo}', section),
                    section: section
                });
            }
        }
        
        // Validar estrutura de adições
        if (data.adicoes && !Array.isArray(data.adicoes)) {
            result.success = false;
            result.errors.push({
                type: 'INVALID_ADDITIONS_TYPE',
                message: this.validationRules.mensagens_erro.tipo_invalido
                    .replace('{campo}', 'adicoes')
                    .replace('{tipo_esperado}', 'array')
                    .replace('{tipo_recebido}', typeof data.adicoes)
            });
        }
        
        if (data.adicoes && Array.isArray(data.adicoes) && data.adicoes.length === 0) {
            result.success = false;
            result.errors.push({
                type: 'EMPTY_ADDITIONS',
                message: this.validationRules.mensagens_erro.array_vazio.replace('{campo}', 'adicoes')
            });
        }
    }
    
    /**
     * Valida campos obrigatórios usando configuração
     * NOMENCLATURA: Usa lista de campos do validation-rules.json
     * 
     * @private
     */
    async _validateRequiredFields(data, result) {
        if (!data) {
            throw new Error('_validateRequiredFields: data é obrigatório');
        }
        
        if (!result) {
            throw new Error('_validateRequiredFields: result é obrigatório');
        }
        
        // Campos obrigatórios vindos da configuração - NO HARDCODED DATA
        const requiredFields = this.validationRules.campos_obrigatorios.di_basica;
        
        if (!Array.isArray(requiredFields)) {
            throw new Error('_validateRequiredFields: configuração de campos obrigatórios inválida');
        }
        
        for (const field of requiredFields) {
            result.metrics.fieldsValidated++;
            
            if (data[field] === undefined || data[field] === null) {
                result.success = false;
                result.errors.push({
                    type: 'MISSING_REQUIRED_FIELD',
                    message: this.validationRules.mensagens_erro.campo_obrigatorio_ausente.replace('{campo}', field),
                    field: field
                });
            } else if (typeof data[field] === 'string' && data[field].trim() === '') {
                result.success = false;
                result.errors.push({
                    type: 'EMPTY_REQUIRED_FIELD',
                    message: this.validationRules.mensagens_erro.campo_obrigatorio_vazio.replace('{campo}', field),
                    field: field
                });
            }
        }
    }
    
    /**
     * Valida formatos de campos específicos
     * NO HARDCODED DATA: Regras de formato vêm da configuração
     * 
     * @private
     */
    async _validateFieldFormats(data, result) {
        if (!data) {
            throw new Error('_validateFieldFormats: data é obrigatório');
        }
        
        if (!result) {
            throw new Error('_validateFieldFormats: result é obrigatório');
        }
        
        const formatRules = this.validationRules.validacao_formatos;
        
        // Validar número da DI
        if (data.numero_di) {
            result.metrics.formatValidations++;
            this._validateFieldFormat(data.numero_di, 'numero_di', formatRules.numero_di, result);
        }
        
        // Validar CNPJ do importador
        if (data.importador_cnpj) {
            result.metrics.formatValidations++;
            this._validateFieldFormat(data.importador_cnpj, 'importador_cnpj', formatRules.cnpj, result);
        }
        
        // Validar UF se presente
        if (data.importador_endereco_uf) {
            result.metrics.formatValidations++;
            this._validateUF(data.importador_endereco_uf, result);
        }
    }
    
    /**
     * Valida formato específico de um campo
     * NO FALLBACKS: Regras específicas obrigatórias
     * 
     * @private
     */
    _validateFieldFormat(value, fieldName, rule, result) {
        if (!value) {
            throw new Error('_validateFieldFormat: value é obrigatório');
        }
        
        if (!fieldName) {
            throw new Error('_validateFieldFormat: fieldName é obrigatório');
        }
        
        if (!rule) {
            throw new Error('_validateFieldFormat: rule é obrigatório');
        }
        
        if (!result) {
            throw new Error('_validateFieldFormat: result é obrigatório');
        }
        
        const stringValue = String(value);
        
        // Validar tamanho mínimo
        if (rule.tamanho_minimo && stringValue.length < rule.tamanho_minimo) {
            result.warnings.push({
                type: 'FIELD_FORMAT_WARNING',
                message: this.validationRules.mensagens_erro.formato_invalido
                    .replace('{campo}', fieldName)
                    .replace('{valor}', value)
                    .replace('{descricao}', rule.descricao),
                field: fieldName,
                value: value
            });
        }
        
        // Validar tamanho exato
        if (rule.tamanho_exato && stringValue.length !== rule.tamanho_exato) {
            result.success = false;
            result.errors.push({
                type: 'INVALID_FIELD_LENGTH',
                message: this.validationRules.mensagens_erro.formato_invalido
                    .replace('{campo}', fieldName)
                    .replace('{valor}', value)
                    .replace('{descricao}', rule.descricao),
                field: fieldName,
                expected: rule.tamanho_exato,
                received: stringValue.length
            });
        }
        
        // Validar padrão regex
        if (rule.pattern) {
            const regex = new RegExp(rule.pattern);
            if (!regex.test(stringValue)) {
                result.success = false;
                result.errors.push({
                    type: 'INVALID_FIELD_PATTERN',
                    message: this.validationRules.mensagens_erro.formato_invalido
                        .replace('{campo}', fieldName)
                        .replace('{valor}', value)
                        .replace('{descricao}', rule.descricao),
                    field: fieldName,
                    pattern: rule.pattern
                });
            }
        }
    }
    
    /**
     * Valida UF usando dados de estados-brasil.json
     * NO HARDCODED DATA: Lista de UFs válidas vem da configuração
     * 
     * @private
     */
    _validateUF(uf, result) {
        if (!uf) {
            throw new Error('_validateUF: uf é obrigatório');
        }
        
        if (!result) {
            throw new Error('_validateUF: result é obrigatório');
        }
        
        const validUFs = this.estadosBrasil.estados.map(estado => estado.codigo);
        
        if (!validUFs.includes(uf)) {
            result.success = false;
            result.errors.push({
                type: 'INVALID_UF',
                message: this.validationRules.mensagens_erro.formato_invalido
                    .replace('{campo}', 'UF')
                    .replace('{valor}', uf)
                    .replace('{descricao}', 'UF deve ser código válido de estado brasileiro'),
                field: 'importador_endereco_uf',
                validValues: validUFs,
                received: uf
            });
        }
    }
    
    /**
     * Valida estrutura das adições
     * NOMENCLATURA: Campos de adição definidos na configuração
     * 
     * @private
     */
    async _validateAdditionsStructure(data, result) {
        if (!data) {
            throw new Error('_validateAdditionsStructure: data é obrigatório');
        }
        
        if (!result) {
            throw new Error('_validateAdditionsStructure: result é obrigatório');
        }
        
        if (!data.adicoes || !Array.isArray(data.adicoes)) {
            return; // Já validado em estrutura básica
        }
        
        // Validar limite máximo de adições
        const maxAdditions = this.validationRules.limites_processamento.max_adicoes_por_di;
        if (data.adicoes.length > maxAdditions) {
            result.success = false;
            result.errors.push({
                type: 'TOO_MANY_ADDITIONS',
                message: `DI contém ${data.adicoes.length} adições, máximo: ${maxAdditions}`,
                count: data.adicoes.length,
                maxAllowed: maxAdditions
            });
        }
        
        // Campos obrigatórios em adições - NO HARDCODED DATA
        const requiredAdditionFields = this.validationRules.campos_obrigatorios.adicao;
        
        for (let i = 0; i < data.adicoes.length; i++) {
            result.metrics.additionsValidated++;
            
            const adicao = data.adicoes[i];
            
            if (!adicao || typeof adicao !== 'object') {
                result.success = false;
                result.errors.push({
                    type: 'INVALID_ADDITION_STRUCTURE',
                    message: `Adição ${i + 1} deve ser objeto`,
                    additionIndex: i
                });
                continue;
            }
            
            // Validar campos obrigatórios
            for (const field of requiredAdditionFields) {
                if (adicao[field] === undefined || adicao[field] === null) {
                    result.success = false;
                    result.errors.push({
                        type: 'MISSING_ADDITION_FIELD',
                        message: this.validationRules.mensagens_erro.campo_obrigatorio_ausente
                            .replace('{campo}', `${field} na adição ${i + 1}`),
                        field: field,
                        additionIndex: i
                    });
                }
            }
            
            // Validar NCM
            if (adicao.ncm) {
                this._validateNCM(adicao.ncm, i, result);
            }
            
            // Validar valores monetários na adição
            if (adicao.valor_moeda_negociacao !== undefined) {
                this._validateAdditionMonetaryValue(adicao.valor_moeda_negociacao, 'valor_moeda_negociacao', i, result);
            }
        }
        
        result.metrics.totalAdditions = data.adicoes.length;
    }
    
    /**
     * Valida formato NCM usando regras da configuração
     * NO HARDCODED DATA: Regras NCM vêm do validation-rules.json
     * 
     * @private
     */
    _validateNCM(ncm, additionIndex, result) {
        if (!ncm) {
            throw new Error('_validateNCM: ncm é obrigatório');
        }
        
        if (additionIndex === undefined || additionIndex === null) {
            throw new Error('_validateNCM: additionIndex é obrigatório');
        }
        
        if (!result) {
            throw new Error('_validateNCM: result é obrigatório');
        }
        
        const ncmRule = this.validationRules.validacao_formatos.ncm;
        this._validateFieldFormat(ncm, `NCM adição ${additionIndex + 1}`, ncmRule, result);
    }
    
    /**
     * Valida valor monetário em adição
     * NO FALLBACKS: Usa regras de validação da configuração
     * 
     * @private
     */
    _validateAdditionMonetaryValue(value, fieldName, additionIndex, result) {
        if (value === undefined || value === null) {
            throw new Error('_validateAdditionMonetaryValue: value é obrigatório');
        }
        
        if (!fieldName) {
            throw new Error('_validateAdditionMonetaryValue: fieldName é obrigatório');
        }
        
        if (additionIndex === undefined || additionIndex === null) {
            throw new Error('_validateAdditionMonetaryValue: additionIndex é obrigatório');
        }
        
        if (!result) {
            throw new Error('_validateAdditionMonetaryValue: result é obrigatório');
        }
        
        const monetaryRules = this.validationRules.validacao_valores.monetarios;
        
        if (typeof value !== monetaryRules.tipo) {
            result.success = false;
            result.errors.push({
                type: 'INVALID_ADDITION_MONETARY_TYPE',
                message: this.validationRules.mensagens_erro.tipo_invalido
                    .replace('{campo}', `${fieldName} na adição ${additionIndex + 1}`)
                    .replace('{tipo_esperado}', monetaryRules.tipo)
                    .replace('{tipo_recebido}', typeof value),
                field: fieldName,
                additionIndex: additionIndex
            });
        } else if (value < monetaryRules.valor_minimo || value > monetaryRules.valor_maximo) {
            result.success = false;
            result.errors.push({
                type: 'ADDITION_VALUE_OUT_OF_RANGE',
                message: this.validationRules.mensagens_erro.valor_fora_limite
                    .replace('{campo}', `${fieldName} na adição ${additionIndex + 1}`)
                    .replace('{valor}', value)
                    .replace('{min}', monetaryRules.valor_minimo)
                    .replace('{max}', monetaryRules.valor_maximo),
                field: fieldName,
                additionIndex: additionIndex,
                value: value
            });
        }
    }
    
    /**
     * Valida dados do importador
     * NO HARDCODED DATA: Regras vêm da configuração
     * 
     * @private
     */
    async _validateImporterData(data, result) {
        if (!data) {
            throw new Error('_validateImporterData: data é obrigatório');
        }
        
        if (!result) {
            throw new Error('_validateImporterData: result é obrigatório');
        }
        
        // Validar nome do importador
        if (data.importador_nome && typeof data.importador_nome === 'string') {
            if (data.importador_nome.trim().length < 3) {
                result.warnings.push({
                    type: 'SHORT_IMPORTER_NAME',
                    message: 'Nome do importador muito curto - verificar se completo',
                    field: 'importador_nome',
                    length: data.importador_nome.trim().length
                });
            }
        }
        
        // Validações adicionais de endereço se disponíveis
        if (data.importador_endereco_cep && typeof data.importador_endereco_cep === 'string') {
            const cepDigits = data.importador_endereco_cep.replace(/\D/g, '');
            if (cepDigits.length !== 8) {
                result.warnings.push({
                    type: 'INVALID_CEP_FORMAT',
                    message: 'CEP deve ter 8 dígitos',
                    field: 'importador_endereco_cep',
                    value: data.importador_endereco_cep
                });
            }
        }
    }
    
    /**
     * Valida valores monetários usando regras da configuração
     * NO FALLBACKS: Regras monetárias da configuração
     * 
     * @private
     */
    async _validateMonetaryValues(data, result) {
        if (!data) {
            throw new Error('_validateMonetaryValues: data é obrigatório');
        }
        
        if (!result) {
            throw new Error('_validateMonetaryValues: result é obrigatório');
        }
        
        const monetaryRules = this.validationRules.validacao_valores.monetarios;
        const monetaryFields = [
            'valor_total_fob_usd',
            'valor_total_fob_brl', 
            'valor_aduaneiro_total_brl',
            'valor_total_frete_usd',
            'valor_total_seguro_usd'
        ];
        
        for (const field of monetaryFields) {
            if (data[field] !== undefined) {
                if (typeof data[field] !== monetaryRules.tipo) {
                    result.success = false;
                    result.errors.push({
                        type: 'INVALID_MONETARY_TYPE',
                        message: this.validationRules.mensagens_erro.tipo_invalido
                            .replace('{campo}', field)
                            .replace('{tipo_esperado}', monetaryRules.tipo)
                            .replace('{tipo_recebido}', typeof data[field]),
                        field: field
                    });
                } else if (data[field] < monetaryRules.valor_minimo || data[field] > monetaryRules.valor_maximo) {
                    result.success = false;
                    result.errors.push({
                        type: 'MONETARY_VALUE_OUT_OF_RANGE',
                        message: this.validationRules.mensagens_erro.valor_fora_limite
                            .replace('{campo}', field)
                            .replace('{valor}', data[field])
                            .replace('{min}', monetaryRules.valor_minimo)
                            .replace('{max}', monetaryRules.valor_maximo),
                        field: field,
                        value: data[field]
                    });
                }
            }
        }
        
        // Validar taxa de câmbio se presente
        if (data.taxa_cambio !== undefined) {
            const cambioRules = this.validationRules.validacao_valores.taxa_cambio;
            
            if (typeof data.taxa_cambio !== cambioRules.tipo) {
                result.success = false;
                result.errors.push({
                    type: 'INVALID_EXCHANGE_RATE_TYPE',
                    message: this.validationRules.mensagens_erro.tipo_invalido
                        .replace('{campo}', 'taxa_cambio')
                        .replace('{tipo_esperado}', cambioRules.tipo)
                        .replace('{tipo_recebido}', typeof data.taxa_cambio),
                    field: 'taxa_cambio'
                });
            } else if (data.taxa_cambio < cambioRules.valor_minimo || data.taxa_cambio > cambioRules.valor_maximo) {
                result.success = false;
                result.errors.push({
                    type: 'EXCHANGE_RATE_OUT_OF_RANGE',
                    message: this.validationRules.mensagens_erro.valor_fora_limite
                        .replace('{campo}', 'taxa_cambio')
                        .replace('{valor}', data.taxa_cambio)
                        .replace('{min}', cambioRules.valor_minimo)
                        .replace('{max}', cambioRules.valor_maximo),
                    field: 'taxa_cambio',
                    value: data.taxa_cambio
                });
            }
        }
    }
    
    /**
     * Valida consistência de dados extraídos
     * NO FALLBACKS: Usa tolerâncias da configuração
     * 
     * @private
     */
    async _validateDataConsistency(data, result) {
        if (!data) {
            throw new Error('_validateDataConsistency: data é obrigatório');
        }
        
        if (!result) {
            throw new Error('_validateDataConsistency: result é obrigatório');
        }
        
        // Validar consistência USD/BRL com tolerância configurada
        if (data.valor_total_fob_usd && data.valor_total_fob_brl && data.taxa_cambio) {
            const tolerance = this.validationRules.tolerancias.conversao_monetaria.absoluta;
            const expectedBRL = data.valor_total_fob_usd * data.taxa_cambio;
            const difference = Math.abs(data.valor_total_fob_brl - expectedBRL);
            
            if (difference > tolerance) {
                result.warnings.push({
                    type: 'CURRENCY_CONVERSION_INCONSISTENCY',
                    message: this.validationRules.mensagens_erro.inconsistencia_conversao
                        .replace('{moeda1}', 'USD')
                        .replace('{moeda2}', 'BRL')
                        .replace('{esperado}', expectedBRL.toFixed(2))
                        .replace('{recebido}', data.valor_total_fob_brl),
                    expected: expectedBRL,
                    received: data.valor_total_fob_brl,
                    difference: difference,
                    tolerance: tolerance
                });
            }
        }
        
        // Validar soma de adições vs totais
        if (data.adicoes && Array.isArray(data.adicoes) && data.valor_total_fob_brl) {
            const somaAdicoes = data.adicoes.reduce((sum, adicao) => {
                if (typeof adicao.valor_reais === 'number') {
                    return sum + adicao.valor_reais;
                }
                return sum;
            }, 0);
            
            if (somaAdicoes > 0) {
                const tolerance = this.validationRules.tolerancias.conversao_monetaria.absoluta;
                const difference = Math.abs(data.valor_total_fob_brl - somaAdicoes);
                
                if (difference > tolerance) {
                    result.warnings.push({
                        type: 'ADDITION_TOTAL_INCONSISTENCY',
                        message: `Inconsistência entre soma das adições (${somaAdicoes.toFixed(2)}) e total FOB BRL (${data.valor_total_fob_brl})`,
                        sumOfAdditions: somaAdicoes,
                        totalFOBBRL: data.valor_total_fob_brl,
                        difference: difference
                    });
                }
            }
        }
    }
    
    /**
     * Valida contexto de extração
     * NO FALLBACKS: Context obrigatório com campos específicos
     * 
     * @private
     */
    async _validateExtractionContext(context, result) {
        if (!context) {
            throw new Error('_validateExtractionContext: context é obrigatório');
        }
        
        if (!result) {
            throw new Error('_validateExtractionContext: result é obrigatório');
        }
        
        // Validar campos obrigatórios do contexto
        const requiredContextFields = this.validationRules.validacao_contexto.campos_obrigatorios;
        
        for (const field of requiredContextFields) {
            if (context[field] === undefined || context[field] === null) {
                result.success = false;
                result.errors.push({
                    type: 'MISSING_CONTEXT_FIELD',
                    message: this.validationRules.mensagens_erro.contexto_invalido.replace('{campo}', field),
                    field: field
                });
            }
        }
        
        // Validar se extração foi bem-sucedida
        if (context.extractionSuccess !== undefined && context.extractionSuccess === false) {
            result.success = false;
            result.errors.push({
                type: 'EXTRACTION_CONTEXT_FAILURE',
                message: 'Context indica falha na extração XML - dados podem estar incompletos',
                context: context
            });
        }
        
        // Validar origem dos dados se especificada
        if (context.xmlSource && typeof context.xmlSource === 'string' && context.xmlSource.trim() === '') {
            result.warnings.push({
                type: 'EMPTY_XML_SOURCE',
                message: 'Origem do XML não especificada - dificulta auditoria'
            });
        }
    }
}

export default ExtractionValidator;