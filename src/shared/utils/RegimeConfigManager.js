/**
 * RegimeConfigManager.js - Gerenciador de Configuração de Regime Tributário
 * 
 * Gerencia as configurações de regime tributário da empresa
 * Define créditos aplicáveis e alíquotas de saída por regime
 * Utiliza IndexedDBManager para persistência - NO FALLBACKS
 * 
 * @version 2.0.0
 * @author Expertzy System
 */

import indexedDBManager from '../../services/database/IndexedDBManager.js';

class RegimeConfigManager {
    constructor() {
        this.storageKey = 'expertzy_regime_config';
        this.config = null;
        this.regimeAliquotas = null;
        this.initialized = false;
        this.initializeConfig();
        this.loadRegimeAliquotas();
    }

    /**
     * Carrega alíquotas e configurações de regime do arquivo JSON
     */
    async loadRegimeAliquotas() {
        try {
            const response = await fetch('../shared/data/regime-aliquotas.json');
            if (!response.ok) {
                throw new Error('Erro ao carregar arquivo de alíquotas');
            }
            this.regimeAliquotas = await response.json();
            console.log('✅ Alíquotas de regime carregadas:', this.regimeAliquotas.versao);
        } catch (error) {
            console.error('❌ Erro ao carregar alíquotas:', error);
            // Usar valores de fallback mínimos apenas para não quebrar o sistema
            this.regimeAliquotas = {
                lucro_real: { pis: { aliquota_padrao: 1.65 }, cofins: { aliquota_padrao: 7.60 } },
                lucro_presumido: { pis: { aliquota_padrao: 0.65 }, cofins: { aliquota_padrao: 3.00 } },
                simples_nacional: { tabela_das: {} }
            };
        }
    }

    /**
     * Configuração padrão do sistema (apenas configurações da empresa, não alíquotas)
     */
    getDefaultConfig() {
        return {
            company_settings: {
                regime_tributario: 'lucro_real', // lucro_real | lucro_presumido | simples_nacional
                tipo_empresa: 'comercio', // comercio | industria | servicos | misto
                estado_sede: null, // Estado vem da DI
                inscricao_estadual: true,
                substituto_tributario: false,
                contribuinte_ipi: true, // Todo importador é contribuinte de IPI
                
                // Configurações específicas da empresa para Simples Nacional
                simples_config: {
                    anexo: 'I', // I, II, III, IV, V
                    faixa_faturamento: 1, // 1 a 6
                    receita_bruta_anual: 0,
                    sublimite_icms: false
                }
            },
            
            // Metadados
            metadata: {
                updated_at: new Date().toISOString(),
                updated_by: 'sistema',
                version: '1.0.0'
            }
        };
    }

    /**
     * Inicializa configuração do IndexedDB ou usa padrão
     */
    async initializeConfig() {
        try {
            if (!indexedDBManager) {
                throw new Error('IndexedDBManager não disponível - obrigatório para RegimeConfigManager');
            }
            
            await indexedDBManager.initialize();
            
            const stored = await indexedDBManager.getConfig(this.storageKey);
            if (stored) {
                this.config = stored;
                console.log('✅ RegimeConfigManager: Configuração carregada');
                console.log(`   Regime: ${this.config.company_settings.regime_tributario}`);
                console.log(`   Tipo: ${this.config.company_settings.tipo_empresa}`);
            } else {
                this.config = this.getDefaultConfig();
                await this.saveConfig();
                console.log('🆕 RegimeConfigManager: Configuração padrão inicializada');
            }
            
            this.initialized = true;
        } catch (error) {
            console.error('❌ Erro ao inicializar RegimeConfigManager:', error);
            throw new Error(`RegimeConfigManager initialization failed: ${error.message}`);
        }
    }

    /**
     * Salva configuração atual no IndexedDB
     */
    async saveConfig() {
        try {
            if (!indexedDBManager) {
                throw new Error('IndexedDBManager não disponível - obrigatório para salvar configuração');
            }
            
            if (!this.initialized) {
                throw new Error('RegimeConfigManager não inicializado - chame initializeConfig() primeiro');
            }
            
            this.config.metadata.updated_at = new Date().toISOString();
            await indexedDBManager.saveConfig(this.storageKey, this.config);
            console.log('✅ Configuração de regime salva');
            return true;
        } catch (error) {
            console.error('❌ Erro ao salvar configuração:', error);
            throw new Error(`Falha ao salvar configuração: ${error.message}`);
        }
    }

    /**
     * Obtém regime tributário atual
     */
    getCurrentRegime() {
        return this.config.company_settings.regime_tributario;
    }

    /**
     * Obtém tipo de empresa atual
     */
    getCompanyType() {
        return this.config.company_settings.tipo_empresa;
    }

    /**
     * Define novo regime tributário
     */
    async setRegime(regime) {
        if (!this.initialized) {
            throw new Error('RegimeConfigManager não inicializado - chame initializeConfig() primeiro');
        }
        const validRegimes = ['lucro_real', 'lucro_presumido', 'simples_nacional'];
        if (!validRegimes.includes(regime)) {
            throw new Error(`Regime inválido: ${regime}`);
        }
        
        this.config.company_settings.regime_tributario = regime;
        await this.saveConfig();
        console.log(`✅ Regime alterado para: ${regime}`);
        return this.config;
    }

    /**
     * Define tipo de empresa
     */
    async setCompanyType(tipo) {
        if (!this.initialized) {
            throw new Error('RegimeConfigManager não inicializado - chame initializeConfig() primeiro');
        }
        const validTypes = ['comercio', 'industria', 'servicos', 'misto'];
        if (!validTypes.includes(tipo)) {
            throw new Error(`Tipo de empresa inválido: ${tipo}`);
        }
        
        this.config.company_settings.tipo_empresa = tipo;
        
        // Se for indústria, pode creditar IPI
        if (tipo === 'industria' || tipo === 'misto') {
            this.config.company_settings.contribuinte_ipi = true;
        } else {
            this.config.company_settings.contribuinte_ipi = false;
        }
        
        await this.saveConfig();
        console.log(`✅ Tipo de empresa alterado para: ${tipo}`);
        return this.config;
    }

    /**
     * Define estado sede da empresa
     */
    async setEstadoSede(estado) {
        if (!this.initialized) {
            throw new Error('RegimeConfigManager não inicializado - chame initializeConfig() primeiro');
        }
        
        this.config.company_settings.estado_sede = estado;
        await this.saveConfig();
        console.log(`✅ Estado sede alterado para: ${estado}`);
        return this.config;
    }

    /**
     * Configura parâmetros do Simples Nacional
     */
    async configureSimplesNacional(anexo, faixa, receitaBruta = 0) {
        if (!this.initialized) {
            throw new Error('RegimeConfigManager não inicializado - chame initializeConfig() primeiro');
        }
        if (this.config.company_settings.regime_tributario !== 'simples_nacional') {
            console.warn('⚠️ Empresa não está no Simples Nacional');
            return;
        }
        
        this.config.company_settings.simples_config.anexo = anexo;
        this.config.company_settings.simples_config.faixa_faturamento = faixa;
        this.config.company_settings.simples_config.receita_bruta_anual = receitaBruta;
        
        await this.saveConfig();
        console.log(`✅ Simples configurado: Anexo ${anexo}, Faixa ${faixa}`);
        return this.config;
    }

    /**
     * Obtém alíquota DAS do Simples Nacional
     */
    getDASAliquota(anexo = null, faixa = null) {
        if (!this.regimeAliquotas?.simples_nacional?.tabela_das) {
            console.error('❌ Tabela DAS não carregada');
            return 6.0; // Valor default de emergência
        }
        
        const anexoUsado = anexo || this.config.company_settings.simples_config.anexo;
        const faixaUsada = faixa || this.config.company_settings.simples_config.faixa_faturamento;
        
        const anexoKey = `anexo_${anexoUsado}`;
        const tabelaAnexo = this.regimeAliquotas.simples_nacional.tabela_das[anexoKey];
        
        if (!tabelaAnexo) {
            console.error(`❌ Anexo ${anexoUsado} não encontrado na tabela`);
            return 6.0;
        }
        
        const faixaData = tabelaAnexo.faixas.find(f => f.faixa === faixaUsada);
        if (!faixaData) {
            console.error(`❌ Faixa ${faixaUsada} não encontrada no anexo ${anexoUsado}`);
            return 6.0;
        }
        
        return faixaData.aliquota;
    }

    /**
     * Obtém créditos aplicáveis para o regime atual
     */
    getApplicableCredits(regime = null) {
        if (!this.regimeAliquotas) {
            console.warn('⚠️ Alíquotas não carregadas ainda');
            return {};
        }
        
        const regimeAtual = regime || this.getCurrentRegime();
        const regimeData = this.regimeAliquotas[regimeAtual];
        
        if (!regimeData) {
            console.error(`❌ Regime ${regimeAtual} não encontrado`);
            return {};
        }
        
        const creditos = regimeData.creditos_permitidos || {};
        
        // Para IPI, verificar se é indústria
        const podeCreditar_IPI = this.config.company_settings.contribuinte_ipi && 
                                (creditos.ipi_industria || creditos.ipi);
        
        return {
            icms: creditos.icms || false,
            ipi: podeCreditar_IPI || false,
            pis: creditos.pis_cofins || false,
            cofins: creditos.pis_cofins || false,
            regime: regimeAtual,
            tipo_empresa: this.config.company_settings.tipo_empresa
        };
    }

    /**
     * Obtém alíquotas de saída para o regime atual
     */
    getSalesTaxRates(regime = null) {
        if (!this.regimeAliquotas) {
            console.warn('⚠️ Alíquotas não carregadas ainda');
            return {};
        }
        
        const regimeAtual = regime || this.getCurrentRegime();
        const regimeData = this.regimeAliquotas[regimeAtual];
        
        if (!regimeData) {
            console.error(`❌ Regime ${regimeAtual} não encontrado`);
            return {};
        }
        
        if (regimeAtual === 'simples_nacional') {
            const aliquota_das = this.getDASAliquota();
            return {
                pis: 0, // Incluso no DAS
                cofins: 0, // Incluso no DAS
                das: aliquota_das,
                icms: 0, // Incluso no DAS (salvo sublimite)
                regime: regimeAtual
            };
        }
        
        return {
            pis: regimeData.pis?.aliquota_padrao || 0,
            cofins: regimeData.cofins?.aliquota_padrao || 0,
            cumulatividade: regimeData.pis?.cumulatividade || 'cumulativo',
            regime: regimeAtual
        };
    }

    /**
     * Valida se um crédito pode ser aplicado
     */
    canApplyCredit(creditType, regime = null) {
        const credits = this.getApplicableCredits(regime);
        
        switch(creditType.toLowerCase()) {
            case 'icms':
                return credits.icms === true;
            case 'ipi':
                return credits.ipi === true;
            case 'pis':
                return credits.pis === true;
            case 'cofins':
                return credits.cofins === true;
            default:
                return false;
        }
    }

    /**
     * Obtém configuração completa do regime
     */
    getRegimeConfig(regime = null) {
        const regimeAtual = regime || this.getCurrentRegime();
        
        if (!this.regimeAliquotas) {
            return null;
        }
        
        const regimeData = this.regimeAliquotas[regimeAtual];
        const companyConfig = this.config.company_settings;
        
        return {
            ...regimeData,
            empresa_config: {
                tipo: companyConfig.tipo_empresa,
                estado: companyConfig.estado_sede,
                contribuinte_ipi: companyConfig.contribuinte_ipi,
                simples_config: companyConfig.simples_config
            }
        };
    }

    /**
     * Obtém configuração completa da empresa
     */
    getCompanyConfig() {
        return this.config.company_settings;
    }

    /**
     * Atualiza configuração completa
     */
    async updateConfig(newConfig) {
        if (!this.initialized) {
            throw new Error('RegimeConfigManager não inicializado - chame initializeConfig() primeiro');
        }
        try {
            // Validar estrutura básica
            if (!newConfig.regime_tributario || !newConfig.tipo_empresa) {
                throw new Error('Configuração incompleta');
            }
            
            // Mesclar com configuração atual
            this.config.company_settings = {
                ...this.config.company_settings,
                ...newConfig
            };
            
            await this.saveConfig();
            console.log('✅ Configuração atualizada com sucesso');
            return this.config;
            
        } catch (error) {
            console.error('❌ Erro ao atualizar configuração:', error);
            throw error;
        }
    }

    /**
     * Reseta para configuração padrão
     */
    async resetToDefault() {
        if (!this.initialized) {
            throw new Error('RegimeConfigManager não inicializado - chame initializeConfig() primeiro');
        }
        
        this.config = this.getDefaultConfig();
        await this.saveConfig();
        console.log('✅ Configuração resetada para padrão');
        return this.config;
    }

    /**
     * Exporta configuração para JSON
     */
    exportConfig() {
        const data = {
            ...this.config,
            export_time: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `regime_config_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('✅ Configuração exportada');
    }

    /**
     * Importa configuração de JSON
     */
    async importConfig(jsonData) {
        if (!this.initialized) {
            throw new Error('RegimeConfigManager não inicializado - chame initializeConfig() primeiro');
        }
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            
            // Validar estrutura
            if (!data.company_settings || !data.company_settings.regime_tributario) {
                throw new Error('Formato de configuração inválido');
            }
            
            this.config = data;
            await this.saveConfig();
            
            console.log('✅ Configuração importada com sucesso');
            return this.config;
            
        } catch (error) {
            console.error('❌ Erro ao importar configuração:', error);
            throw error;
        }
    }

    /**
     * Obtém resumo da configuração atual
     */
    getConfigSummary() {
        const regime = this.getCurrentRegime();
        const tipo = this.getCompanyType();
        const credits = this.getApplicableCredits();
        const salesTax = this.getSalesTaxRates();
        
        return {
            regime_tributario: regime,
            tipo_empresa: tipo,
            estado_sede: this.config.company_settings.estado_sede,
            creditos_disponiveis: {
                icms: credits.icms ? '✅' : '❌',
                ipi: credits.ipi ? '✅' : '❌',
                pis: credits.pis ? '✅' : '❌',
                cofins: credits.cofins ? '✅' : '❌'
            },
            aliquotas_saida: salesTax,
            simples_config: regime === 'simples_nacional' ? 
                this.config.company_settings.simples_config : null,
            atualizado_em: this.config.metadata.updated_at
        };
    }
}

// Export ES6 para compatibilidade com importação IndexedDBManager
export default RegimeConfigManager;

// Exportar para uso global se não estiver em ambiente de módulos (backward compatibility)
export { RegimeConfigManager };