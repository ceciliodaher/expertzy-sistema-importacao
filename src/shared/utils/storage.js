/**
 * Módulo de Armazenamento Local para Sistema Expertzy
 * Gerencia localStorage com configurações e dados da DI
 */
class StorageManager {
    constructor() {
        this.prefix = 'expertzy_';
        this.sessionDuration = 24 * 60 * 60 * 1000; // 24 horas
        this.initStorage();
    }

    /**
     * Inicializa storage verificando versão e limpando dados expirados
     */
    initStorage() {
        this.cleanExpiredData();
        this.ensureDefaultConfig();
    }

    /**
     * Limpa dados expirados do localStorage
     */
    cleanExpiredData() {
        const now = Date.now();
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.timestamp && (now - data.timestamp > this.sessionDuration)) {
                        localStorage.removeItem(key);
                        console.log(`Removido dado expirado: ${key}`);
                    }
                } catch (error) {
                    // Se não conseguir parsear, remove o item
                    localStorage.removeItem(key);
                }
            }
        });
    }

    /**
     * Garante configurações padrão
     */
    ensureDefaultConfig() {
        if (!this.getConfig()) {
            this.saveConfig({
                estado_padrao: null, // Estado vem da DI
                regime_tributario: 'real',
                tipo_operacao_padrao: 'interestadual',
                auto_calculate: true,
                show_tooltips: true,
                format_numbers: true
            });
        }
    }

    /**
     * Gera chave completa com prefixo
     */
    getKey(name) {
        return `${this.prefix}${name}`;
    }

    /**
     * Cria objeto de dados com timestamp
     */
    createDataObject(data) {
        return {
            data: data,
            timestamp: Date.now(),
            version: '2025.1'
        };
    }

    /**
     * Salva dados da DI processada
     */
    saveDI(diData) {
        try {
            const dataObject = this.createDataObject(diData);
            localStorage.setItem(this.getKey('di_data'), JSON.stringify(dataObject));
            
            // Salvar na lista de histórico
            this.addToHistory({
                numero_di: diData.numero_di,
                data_processamento: new Date().toLocaleString('pt-BR'),
                total_adicoes: diData.total_adicoes,
                valor_total: this.validateDITotal(diData.totais?.valor_total_fob_brl, diData.numero_di)
            });

            console.log('DI salva com sucesso:', diData.numero_di);
            return true;
        } catch (error) {
            console.error('Erro ao salvar DI:', error);
            return false;
        }
    }

    /**
     * Recupera dados da DI
     */
    getDI() {
        try {
            const stored = localStorage.getItem(this.getKey('di_data'));
            if (stored) {
                const dataObject = JSON.parse(stored);
                return dataObject.data;
            }
            return null;
        } catch (error) {
            console.error('Erro ao recuperar DI:', error);
            return null;
        }
    }

    /**
     * Limpa dados da DI atual do localStorage
     */
    clearDIData() {
        try {
            localStorage.removeItem(this.getKey('di_data'));
            console.log('Dados da DI limpos do localStorage');
            return true;
        } catch (error) {
            console.error('Erro ao limpar dados da DI:', error);
            return false;
        }
    }

    /**
     * Salva configurações de custos extras
     */
    saveCustosExtras(custos) {
        try {
            const dataObject = this.createDataObject(custos);
            localStorage.setItem(this.getKey('custos_config'), JSON.stringify(dataObject));
            return true;
        } catch (error) {
            console.error('Erro ao salvar custos extras:', error);
            return false;
        }
    }

    /**
     * Recupera configurações de custos extras
     */
    getCustosExtras() {
        try {
            const stored = localStorage.getItem(this.getKey('custos_config'));
            if (stored) {
                const dataObject = JSON.parse(stored);
                return dataObject.data;
            }
            return {
                portuarios: 0,
                bancarios: 0,
                logisticos: 0,
                administrativos: 0
            };
        } catch (error) {
            console.error('Erro ao recuperar custos extras:', error);
            return {};
        }
    }

    /**
     * Salva configurações do usuário
     */
    saveConfig(config) {
        try {
            const dataObject = this.createDataObject(config);
            localStorage.setItem(this.getKey('user_config'), JSON.stringify(dataObject));
            return true;
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            return false;
        }
    }

    /**
     * Recupera configurações do usuário
     */
    getConfig() {
        try {
            const stored = localStorage.getItem(this.getKey('user_config'));
            if (stored) {
                const dataObject = JSON.parse(stored);
                return dataObject.data;
            }
            return null;
        } catch (error) {
            console.error('Erro ao recuperar configurações:', error);
            return null;
        }
    }

    /**
     * Adiciona operação ao histórico
     */
    addToHistory(operation) {
        try {
            let history = this.getHistory();
            
            // Adicionar nova operação no início
            history.unshift({
                ...operation,
                id: Date.now().toString(),
                timestamp: Date.now()
            });

            // Manter apenas últimas 50 operações
            if (history.length > 50) {
                history = history.slice(0, 50);
            }

            const dataObject = this.createDataObject(history);
            localStorage.setItem(this.getKey('operation_history'), JSON.stringify(dataObject));
            return true;
        } catch (error) {
            console.error('Erro ao salvar histórico:', error);
            return false;
        }
    }

    /**
     * Recupera histórico de operações
     */
    getHistory() {
        try {
            const stored = localStorage.getItem(this.getKey('operation_history'));
            if (stored) {
                const dataObject = JSON.parse(stored);
                return dataObject.data;
            }
            return [];
        } catch (error) {
            console.error('Erro ao recuperar histórico:', error);
            return [];
        }
    }

    /**
     * Salva resultado de cálculos
     */
    saveCalculationResults(results) {
        try {
            const dataObject = this.createDataObject(results);
            localStorage.setItem(this.getKey('calculation_results'), JSON.stringify(dataObject));
            return true;
        } catch (error) {
            console.error('Erro ao salvar resultados:', error);
            return false;
        }
    }

    /**
     * Recupera resultado de cálculos
     */
    getCalculationResults() {
        try {
            const stored = localStorage.getItem(this.getKey('calculation_results'));
            if (stored) {
                const dataObject = JSON.parse(stored);
                return dataObject.data;
            }
            return null;
        } catch (error) {
            console.error('Erro ao recuperar resultados:', error);
            return null;
        }
    }

    /**
     * Salva configurações de estado e operação
     */
    saveOperationConfig(estadoDestino, regimeTributario, tipoOperacao) {
        const config = this.getConfig() || {};
        config.estado_padrao = estadoDestino;
        config.regime_tributario = regimeTributario;
        config.tipo_operacao_padrao = tipoOperacao;
        return this.saveConfig(config);
    }

    /**
     * Exporta todos os dados para backup
     */
    exportAllData() {
        const allData = {};
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                try {
                    allData[key] = JSON.parse(localStorage.getItem(key));
                } catch (error) {
                    allData[key] = localStorage.getItem(key);
                }
            }
        });

        return {
            export_date: new Date().toISOString(),
            system_version: '2025.1',
            data: allData
        };
    }

    /**
     * Importa dados de backup
     */
    importData(backupData) {
        try {
            if (backupData.data) {
                Object.keys(backupData.data).forEach(key => {
                    if (key.startsWith(this.prefix)) {
                        localStorage.setItem(key, JSON.stringify(backupData.data[key]));
                    }
                });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            return false;
        }
    }

    /**
     * Limpa todos os dados do sistema
     */
    clearAllData() {
        const keys = Object.keys(localStorage);
        let cleared = 0;
        
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
                cleared++;
            }
        });

        console.log(`Removidos ${cleared} itens do storage`);
        this.ensureDefaultConfig();
        return cleared;
    }

    /**
     * Retorna informações sobre uso do storage
     */
    getStorageInfo() {
        const keys = Object.keys(localStorage);
        let expertzyKeys = 0;
        let totalSize = 0;
        
        keys.forEach(key => {
            const value = localStorage.getItem(key);
            totalSize += value.length;
            
            if (key.startsWith(this.prefix)) {
                expertzyKeys++;
            }
        });

        return {
            total_keys: keys.length,
            expertzy_keys: expertzyKeys,
            estimated_size_bytes: totalSize,
            estimated_size_mb: (totalSize / 1024 / 1024).toFixed(2),
            storage_available: this.isStorageAvailable()
        };
    }

    /**
     * Verifica se localStorage está disponível
     */
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, 'test');
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Salva arquivo XML original para referência
     */
    saveOriginalXML(xmlContent, filename) {
        try {
            const dataObject = this.createDataObject({
                content: xmlContent,
                filename: filename,
                size: xmlContent.length
            });
            localStorage.setItem(this.getKey('original_xml'), JSON.stringify(dataObject));
            return true;
        } catch (error) {
            console.error('Erro ao salvar XML original:', error);
            return false;
        }
    }

    /**
     * Recupera arquivo XML original
     */
    getOriginalXML() {
        try {
            const stored = localStorage.getItem(this.getKey('original_xml'));
            if (stored) {
                const dataObject = JSON.parse(stored);
                return dataObject.data;
            }
            return null;
        } catch (error) {
            console.error('Erro ao recuperar XML original:', error);
            return null;
        }
    }

    // ========== GESTÃO DE DESPESAS CONSOLIDADAS ==========

    /**
     * Salva configuração completa de despesas por DI
     */
    saveDespesasConsolidadas(diNumero, despesasConfig) {
        if (!diNumero || !despesasConfig) {
            console.warn('Dados insuficientes para salvar despesas consolidadas');
            return false;
        }

        try {
            const key = `${this.prefix}despesas_${diNumero}`;
            const data = {
                di_numero: diNumero,
                timestamp: Date.now(),
                despesas_extras: despesasConfig,
                versao: '1.0'
            };

            localStorage.setItem(key, JSON.stringify(data));
            
            // Manter histórico
            this.addToHistorico('despesas_configuradas', {
                di_numero: diNumero,
                timestamp: data.timestamp,
                total_extras: Object.values(despesasConfig).reduce((sum, val) => 
                    typeof val === 'number' ? sum + val : sum, 0)
            });

            console.log(`✅ Despesas consolidadas salvas para DI ${diNumero}`);
            return true;

        } catch (error) {
            console.error('Erro ao salvar despesas consolidadas:', error);
            return false;
        }
    }

    /**
     * Recupera configuração de despesas por DI
     */
    getDespesasConsolidadas(diNumero) {
        if (!diNumero) return null;

        try {
            const key = `${this.prefix}despesas_${diNumero}`;
            const stored = localStorage.getItem(key);
            
            if (!stored) return null;

            const data = JSON.parse(stored);
            
            // Verificar se não expirou
            const now = Date.now();
            if (data.timestamp && (now - data.timestamp > this.sessionDuration)) {
                localStorage.removeItem(key);
                return null;
            }

            console.log(`📖 Despesas consolidadas recuperadas para DI ${diNumero}`);
            return data.despesas_extras;

        } catch (error) {
            console.error('Erro ao recuperar despesas consolidadas:', error);
            return null;
        }
    }

    /**
     * Lista todas as configurações de despesas salvas
     */
    getAllDespesasConsolidadas() {
        const despesas = {};
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith(`${this.prefix}despesas_`)) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.di_numero) {
                        despesas[data.di_numero] = data.despesas_extras;
                    }
                } catch (error) {
                    console.warn(`Erro ao processar despesa salva: ${key}`);
                }
            }
        });
        
        return despesas;
    }

    /**
     * Remove configuração de despesas de uma DI específica
     */
    removeDespesasConsolidadas(diNumero) {
        if (!diNumero) return false;

        try {
            const key = `${this.prefix}despesas_${diNumero}`;
            localStorage.removeItem(key);
            
            console.log(`🗑️ Despesas consolidadas removidas para DI ${diNumero}`);
            return true;

        } catch (error) {
            console.error('Erro ao remover despesas consolidadas:', error);
            return false;
        }
    }

    /**
     * Limpa todas as configurações de despesas
     */
    clearAllDespesas() {
        const keys = Object.keys(localStorage);
        let removidas = 0;
        
        keys.forEach(key => {
            if (key.startsWith(`${this.prefix}despesas_`)) {
                localStorage.removeItem(key);
                removidas++;
            }
        });
        
        console.log(`🧹 ${removidas} configurações de despesas removidas`);
        return removidas;
    }

    /**
     * Adiciona entrada ao histórico
     */
    addToHistorico(tipo, dados) {
        try {
            const key = `${this.prefix}historico`;
            const historico = JSON.parse(localStorage.getItem(key) || '[]');
            
            historico.unshift({
                tipo,
                timestamp: Date.now(),
                dados
            });
            
            // Manter apenas últimas 50 entradas
            if (historico.length > 50) {
                historico.splice(50);
            }
            
            localStorage.setItem(key, JSON.stringify(historico));
            
        } catch (error) {
            console.warn('Erro ao salvar no histórico:', error);
        }
    }

    /**
     * Recupera histórico de operações
     */
    getHistorico(tipo = null) {
        try {
            const key = `${this.prefix}historico`;
            const historico = JSON.parse(localStorage.getItem(key) || '[]');
            
            if (tipo) {
                return historico.filter(item => item.tipo === tipo);
            }
            
            return historico;
            
        } catch (error) {
            console.error('Erro ao recuperar histórico:', error);
            return [];
        }
    }

    // ========== GESTÃO DE SNAPSHOTS DE DI ==========

    /**
     * Salva snapshot completo da DI com cálculos
     */
    saveDISnapshot(diData, calculation, customName = null) {
        try {
            if (!diData || !diData.numero_di) {
                console.error('Dados da DI inválidos para snapshot');
                return false;
            }

            const timestamp = Date.now();
            const identifier = `${diData.numero_di}_${timestamp}`;
            const key = `${this.prefix}di_snapshot_${identifier}`;

            const snapshot = {
                identifier: identifier,
                numero_di: diData.numero_di,
                custom_name: customName || `DI ${diData.numero_di}`,
                timestamp: timestamp,
                data_salvamento: new Date().toLocaleString('pt-BR'),
                di_data: diData,
                calculation_data: calculation,
                valor_total: this.validateDITotal(diData.totais?.valor_total_fob_brl, diData.numero_di),
                total_adicoes: this.validateAdditionsCount(diData.total_adicoes, diData.numero_di),
                version: '2025.1'
            };

            localStorage.setItem(key, JSON.stringify(snapshot));

            // Adicionar ao índice de snapshots
            this.addToSnapshotIndex(identifier, snapshot);

            console.log(`✅ Snapshot da DI ${diData.numero_di} salvo com sucesso`);
            return identifier;

        } catch (error) {
            console.error('Erro ao salvar snapshot da DI:', error);
            return false;
        }
    }

    /**
     * Adiciona snapshot ao índice para busca rápida
     */
    addToSnapshotIndex(identifier, snapshot) {
        try {
            const indexKey = `${this.prefix}snapshot_index`;
            const index = JSON.parse(localStorage.getItem(indexKey) || '[]');

            // Adicionar nova entrada ao índice
            index.unshift({
                identifier: identifier,
                numero_di: snapshot.numero_di,
                custom_name: snapshot.custom_name,
                timestamp: snapshot.timestamp,
                data_salvamento: snapshot.data_salvamento,
                valor_total: snapshot.valor_total,
                total_adicoes: snapshot.total_adicoes
            });

            // Manter apenas últimos 100 registros no índice
            if (index.length > 100) {
                index.splice(100);
            }

            localStorage.setItem(indexKey, JSON.stringify(index));

        } catch (error) {
            console.error('Erro ao atualizar índice de snapshots:', error);
        }
    }

    /**
     * Lista todos os snapshots salvos
     */
    listDISnapshots() {
        try {
            const indexKey = `${this.prefix}snapshot_index`;
            const index = JSON.parse(localStorage.getItem(indexKey) || '[]');
            
            // Filtrar snapshots que ainda existem
            const validSnapshots = index.filter(item => {
                const key = `${this.prefix}di_snapshot_${item.identifier}`;
                return localStorage.getItem(key) !== null;
            });

            // Atualizar índice se houve remoções
            if (validSnapshots.length !== index.length) {
                localStorage.setItem(indexKey, JSON.stringify(validSnapshots));
            }

            return validSnapshots;

        } catch (error) {
            console.error('Erro ao listar snapshots:', error);
            return [];
        }
    }

    /**
     * Carrega snapshot específico
     */
    loadDISnapshot(identifier) {
        try {
            const key = `${this.prefix}di_snapshot_${identifier}`;
            const stored = localStorage.getItem(key);

            if (!stored) {
                console.error(`Snapshot ${identifier} não encontrado`);
                return null;
            }

            const snapshot = JSON.parse(stored);
            console.log(`✅ Snapshot ${identifier} carregado com sucesso`);
            return snapshot;

        } catch (error) {
            console.error('Erro ao carregar snapshot:', error);
            return null;
        }
    }

    /**
     * Deleta snapshot específico
     */
    deleteDISnapshot(identifier) {
        try {
            // Remover snapshot
            const key = `${this.prefix}di_snapshot_${identifier}`;
            localStorage.removeItem(key);

            // Atualizar índice
            const indexKey = `${this.prefix}snapshot_index`;
            const index = JSON.parse(localStorage.getItem(indexKey) || '[]');
            const newIndex = index.filter(item => item.identifier !== identifier);
            localStorage.setItem(indexKey, JSON.stringify(newIndex));

            console.log(`🗑️ Snapshot ${identifier} removido com sucesso`);
            return true;

        } catch (error) {
            console.error('Erro ao deletar snapshot:', error);
            return false;
        }
    }

    /**
     * Limpa cache mantendo snapshots salvos
     */
    clearCacheKeepSnapshots() {
        try {
            const keys = Object.keys(localStorage);
            let cleared = 0;

            keys.forEach(key => {
                // Manter apenas snapshots e índice
                if (key.startsWith(this.prefix) && 
                    !key.includes('di_snapshot_') && 
                    !key.includes('snapshot_index')) {
                    localStorage.removeItem(key);
                    cleared++;
                }
            });

            console.log(`🧹 Cache limpo: ${cleared} itens removidos (snapshots mantidos)`);
            
            // Recriar configurações padrão
            this.ensureDefaultConfig();
            
            return cleared;

        } catch (error) {
            console.error('Erro ao limpar cache:', error);
            return 0;
        }
    }

    /**
     * Exporta snapshot como arquivo JSON
     */
    exportSnapshot(identifier) {
        try {
            const snapshot = this.loadDISnapshot(identifier);
            if (!snapshot) return null;

            return {
                export_date: new Date().toISOString(),
                system_version: '2025.1',
                snapshot: snapshot
            };

        } catch (error) {
            console.error('Erro ao exportar snapshot:', error);
            return null;
        }
    }

    /**
     * Importa snapshot de arquivo JSON
     */
    importSnapshot(jsonData) {
        try {
            if (!jsonData.snapshot) {
                console.error('Formato de importação inválido');
                return false;
            }

            const snapshot = jsonData.snapshot;
            const key = `${this.prefix}di_snapshot_${snapshot.identifier}`;
            
            localStorage.setItem(key, JSON.stringify(snapshot));
            this.addToSnapshotIndex(snapshot.identifier, snapshot);

            console.log(`✅ Snapshot importado: ${snapshot.identifier}`);
            return true;

        } catch (error) {
            console.error('Erro ao importar snapshot:', error);
            return false;
        }
    }

    /**
     * Validation methods for strict DI data handling
     */
    validateDITotal(valorTotal, numeroDI) {
        if (valorTotal === null || valorTotal === undefined || isNaN(valorTotal)) {
            throw new Error(`Valor total da DI ${numeroDI} inválido - obrigatório para salvamento`);
        }
        return valorTotal;
    }

    validateAdditionsCount(totalAdicoes, numeroDI) {
        if (!totalAdicoes || totalAdicoes <= 0) {
            throw new Error(`Total de adições da DI ${numeroDI} inválido - obrigatório para salvamento`);
        }
        return totalAdicoes;
    }
}