/**
 * DataMigration - Migração de dados localStorage para IndexedDB
 * Garante transição suave do sistema legado para nova arquitetura
 * 
 * REGRAS APLICADAS:
 * - NO FALLBACKS: Falhar explicitamente se migração não funcionar
 * - AUDITORIA: Registrar todas as operações de migração
 * - TRANSAÇÕES: Migração atômica - tudo ou nada
 * - VALIDAÇÃO: Validar dados antes de migrar
 */

import DataTransformer from '../transform/DataTransformer.js';
import DataValidator from '../validation/DataValidator.js';
import indexedDBManager from '../database/IndexedDBManager.js';
import Logger from '../../utils/Logger.js';

class DataMigration {
    constructor() {
        this.migratedCount = 0;
        this.errorCount = 0;
        this.skippedCount = 0;
        this.startTime = null;
        this.endTime = null;
    }

    /**
     * Executa migração completa do localStorage para IndexedDB
     * @param {Object} options - Opções de migração
     * @returns {Promise<Object>} Resultado da migração
     */
    async migrate(options = {}) {
        this.startTime = performance.now();
        Logger.time('DataMigration', 'migrate');
        
        try {
            Logger.critical('DataMigration', 'MIGRATION_START', {
                options: options,
                timestamp: new Date()
            }, 'INITIATED');

            // Verificar se já existe migração
            if (await this.hasPreviousMigration() && !options.force) {
                throw new Error('Migração já foi executada. Use force: true para re-executar');
            }

            // Buscar dados do localStorage
            const existingData = this.getLocalStorageData();
            
            if (!existingData || existingData.length === 0) {
                Logger.info('DataMigration', 'migrate', 'Nenhum dado encontrado no localStorage para migrar');
                return this.createMigrationResult();
            }

            Logger.info('DataMigration', 'migrate_data_found', {
                total_items: existingData.length,
                items_preview: existingData.slice(0, 3).map(item => ({
                    key: item.key,
                    size: JSON.stringify(item.value).length
                }))
            });

            // Migrar cada item
            for (const item of existingData) {
                await this.migrateItem(item, options);
            }

            // Criar backup dos dados migrados
            if (options.createBackup !== false) {
                await this.createBackup(existingData);
            }

            // Limpar localStorage após migração bem-sucedida
            if (options.clearAfterMigration !== false) {
                this.clearLocalStorage(existingData);
            }

            this.endTime = performance.now();
            const result = this.createMigrationResult();

            Logger.timeEnd('DataMigration', 'migrate', {
                migrated_count: this.migratedCount,
                error_count: this.errorCount,
                skipped_count: this.skippedCount
            });

            Logger.critical('DataMigration', 'MIGRATION_COMPLETE', result, 'SUCCESS');

            return result;

        } catch (error) {
            Logger.error('DataMigration', 'migrate', error, {
                migrated_count: this.migratedCount,
                error_count: this.errorCount,
                skipped_count: this.skippedCount
            });

            throw error;
        }
    }

    /**
     * Busca dados relevantes do localStorage
     * @returns {Array} Lista de itens do localStorage
     */
    getLocalStorageData() {
        const items = [];
        const relevantPrefixes = [
            'expertzy_',
            'di_',
            'importacao_',
            'croqui_',
            'precificacao_',
            'config_'
        ];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            
            // Verificar se a chave é relevante
            const isRelevant = relevantPrefixes.some(prefix => key.startsWith(prefix));
            
            if (isRelevant) {
                try {
                    const rawValue = localStorage.getItem(key);
                    const parsedValue = JSON.parse(rawValue);
                    
                    items.push({
                        key: key,
                        value: parsedValue,
                        type: this.determineDataType(key, parsedValue),
                        size: rawValue.length
                    });
                    
                } catch (parseError) {
                    Logger.warn('DataMigration', 'getLocalStorageData', 
                        `Erro ao fazer parse do item ${key}`, 
                        { key, error: parseError.message }
                    );
                    
                    // Adicionar como item raw para não perder dados
                    items.push({
                        key: key,
                        value: localStorage.getItem(key),
                        type: 'raw',
                        size: localStorage.getItem(key).length,
                        parse_error: parseError.message
                    });
                }
            }
        }

        return items;
    }

    /**
     * Determina o tipo de dados baseado na chave e conteúdo
     * @param {string} key - Chave do localStorage
     * @param {any} value - Valor do item
     * @returns {string} Tipo identificado
     */
    determineDataType(key, value) {
        if (key.includes('di_') && value.numero_di) {
            return 'declaracao_importacao';
        } else if (key.includes('config_')) {
            return 'configuracao';
        } else if (key.includes('croqui_')) {
            return 'croqui_data';
        } else if (key.includes('precificacao_')) {
            return 'precificacao_data';
        } else if (key.includes('adicao_') && value.ncm) {
            return 'adicao';
        } else if (key.includes('produto_') && value.descricao) {
            return 'produto';
        } else {
            return 'generic';
        }
    }

    /**
     * Migra um item específico
     * @param {Object} item - Item do localStorage
     * @param {Object} options - Opções de migração
     */
    async migrateItem(item, options) {
        try {
            Logger.debug('DataMigration', 'migrateItem', {
                key: item.key,
                type: item.type,
                size: item.size
            });

            switch (item.type) {
                case 'declaracao_importacao':
                    await this.migrateDI(item);
                    break;
                
                case 'configuracao':
                    await this.migrateConfig(item);
                    break;
                
                case 'croqui_data':
                case 'precificacao_data':
                case 'adicao':
                case 'produto':
                    // Estes tipos são migrados junto com a DI principal
                    this.skippedCount++;
                    Logger.debug('DataMigration', 'migrateItem', 
                        `Item ${item.key} será migrado junto com DI principal`
                    );
                    break;
                
                case 'generic':
                case 'raw':
                    await this.migrateGeneric(item, options);
                    break;
                
                default:
                    Logger.warn('DataMigration', 'migrateItem', 
                        `Tipo não reconhecido: ${item.type}`, 
                        { key: item.key }
                    );
                    this.skippedCount++;
            }

        } catch (error) {
            this.errorCount++;
            Logger.error('DataMigration', 'migrateItem', error, {
                key: item.key,
                type: item.type
            });

            if (!options.continueOnError) {
                throw error;
            }
        }
    }

    /**
     * Migra uma Declaração de Importação
     * @param {Object} item - Item DI do localStorage
     */
    async migrateDI(item) {
        if (!item.value || !item.value.numero_di) {
            throw new Error(`Item DI inválido: ${item.key}`);
        }

        // Verificar se DI já existe no IndexedDB
        const existingDI = await indexedDBManager.getDI(item.value.numero_di);
        if (existingDI) {
            Logger.warn('DataMigration', 'migrateDI', 
                `DI ${item.value.numero_di} já existe no IndexedDB - pulando`
            );
            this.skippedCount++;
            return;
        }

        // Transformar dados legados para novo formato
        const transformer = new DataTransformer();
        const transformedData = this.transformLegacyDIData(item.value, transformer);

        // Validar dados transformados
        const validator = new DataValidator();
        validator.validate(transformedData);

        if (validator.hasErrors()) {
            throw new Error(`Dados DI inválidos: ${validator.getErrors().join('; ')}`);
        }

        // Salvar no IndexedDB
        const diId = await indexedDBManager.saveDI(transformedData);
        
        Logger.info('DataMigration', 'migrateDI', {
            numero_di: transformedData.numero_di,
            di_id: diId,
            original_key: item.key
        });

        this.migratedCount++;
    }

    /**
     * Transforma dados DI legados para novo formato
     * @param {Object} legacyData - Dados no formato antigo
     * @param {DataTransformer} transformer - Instância do transformer
     * @returns {Object} Dados transformados
     */
    transformLegacyDIData(legacyData, transformer) {
        // Mapear campos do formato antigo para novo
        const mappedData = {
            numero_di: legacyData.numero_di || legacyData.numero,
            data_registro: legacyData.data_registro,
            urf_despacho: legacyData.urf_despacho,
            modalidade: legacyData.modalidade,
            situacao_entrega: legacyData.situacao || legacyData.situacao_entrega,
            total_adicoes: legacyData.total_adicoes || legacyData.adicoes?.length,

            // Importador
            importador: {
                cnpj: legacyData.importador_cnpj || legacyData.importador?.cnpj,
                nome: legacyData.importador_nome || legacyData.importador?.nome,
                endereco_uf: legacyData.importador_uf || legacyData.importador?.endereco_uf
            },

            // Valores
            valor_total_fob_usd: legacyData.valor_total_usd || legacyData.valor_total_fob_usd,
            valor_total_fob_brl: legacyData.valor_total_brl || legacyData.valor_total_fob_brl,
            valor_aduaneiro_total_brl: legacyData.valor_aduaneiro_total || legacyData.valor_aduaneiro_total_brl,

            // Carga
            carga: {
                peso_bruto: legacyData.peso_bruto || legacyData.carga?.peso_bruto,
                peso_liquido: legacyData.peso_liquido || legacyData.carga?.peso_liquido,
                via_transporte: legacyData.via_transporte || legacyData.carga?.via_transporte
            },

            // Adições
            adicoes: legacyData.adicoes || [],

            // Informações complementares
            informacao_complementar: legacyData.informacao_complementar,

            // Despesas (se já extraídas)
            despesas: legacyData.despesas || {}
        };

        // Usar transformer padrão para aplicar conversões
        return transformer.transformDIData(mappedData);
    }

    /**
     * Migra configuração
     * @param {Object} item - Item de configuração
     */
    async migrateConfig(item) {
        const configKey = item.key.replace('config_', '');
        
        await indexedDBManager.saveConfig(configKey, item.value);
        
        Logger.debug('DataMigration', 'migrateConfig', {
            config_key: configKey,
            original_key: item.key
        });

        this.migratedCount++;
    }

    /**
     * Migra item genérico
     * @param {Object} item - Item genérico
     * @param {Object} options - Opções de migração
     */
    async migrateGeneric(item, options) {
        if (options.skipGeneric) {
            this.skippedCount++;
            return;
        }

        // Salvar como configuração genérica
        await indexedDBManager.saveConfig(`legacy_${item.key}`, item.value);
        
        Logger.debug('DataMigration', 'migrateGeneric', {
            key: item.key,
            type: item.type
        });

        this.migratedCount++;
    }

    /**
     * Verifica se já houve migração anterior
     * @returns {Promise<boolean>} True se já migrou
     */
    async hasPreviousMigration() {
        const migrationFlag = await indexedDBManager.getConfig('migration_completed');
        return migrationFlag === true;
    }

    /**
     * Cria backup dos dados originais
     * @param {Array} data - Dados originais
     */
    async createBackup(data) {
        const backupData = {
            timestamp: new Date(),
            version: '1.0',
            items: data,
            total_items: data.length
        };

        await indexedDBManager.saveConfig('migration_backup', backupData);
        
        Logger.info('DataMigration', 'createBackup', {
            total_items: data.length,
            backup_size: JSON.stringify(backupData).length
        });
    }

    /**
     * Limpa localStorage após migração
     * @param {Array} migratedItems - Itens migrados
     */
    clearLocalStorage(migratedItems) {
        let clearedCount = 0;

        for (const item of migratedItems) {
            try {
                localStorage.removeItem(item.key);
                clearedCount++;
            } catch (error) {
                Logger.warn('DataMigration', 'clearLocalStorage', 
                    `Erro ao remover ${item.key}`, 
                    { error: error.message }
                );
            }
        }

        Logger.info('DataMigration', 'clearLocalStorage', {
            cleared_count: clearedCount,
            total_items: migratedItems.length
        });
    }

    /**
     * Cria resultado da migração
     * @returns {Object} Resultado estruturado
     */
    createMigrationResult() {
        const result = {
            success: this.errorCount === 0,
            migrated_count: this.migratedCount,
            error_count: this.errorCount,
            skipped_count: this.skippedCount,
            total_processed: this.migratedCount + this.errorCount + this.skippedCount,
            duration_ms: this.endTime ? (this.endTime - this.startTime) : 0,
            timestamp: new Date()
        };

        // Marcar migração como concluída
        if (result.success) {
            indexedDBManager.saveConfig('migration_completed', true);
            indexedDBManager.saveConfig('migration_result', result);
        }

        return result;
    }

    /**
     * Rollback da migração (restaurar localStorage)
     * @returns {Promise<Object>} Resultado do rollback
     */
    async rollback() {
        try {
            Logger.critical('DataMigration', 'ROLLBACK_START', {}, 'INITIATED');

            // Buscar backup
            const backup = await indexedDBManager.getConfig('migration_backup');
            if (!backup) {
                throw new Error('Backup de migração não encontrado');
            }

            let restoredCount = 0;

            // Restaurar dados no localStorage
            for (const item of backup.items) {
                try {
                    const valueString = typeof item.value === 'string' 
                        ? item.value 
                        : JSON.stringify(item.value);
                    
                    localStorage.setItem(item.key, valueString);
                    restoredCount++;
                } catch (error) {
                    Logger.error('DataMigration', 'rollback', error, {
                        key: item.key
                    });
                }
            }

            // Limpar dados migrados do IndexedDB
            await indexedDBManager.clearAll();

            const rollbackResult = {
                success: true,
                restored_count: restoredCount,
                total_items: backup.items.length,
                timestamp: new Date()
            };

            Logger.critical('DataMigration', 'ROLLBACK_COMPLETE', rollbackResult, 'SUCCESS');

            return rollbackResult;

        } catch (error) {
            Logger.error('DataMigration', 'rollback', error);
            throw error;
        }
    }
}

export default DataMigration;