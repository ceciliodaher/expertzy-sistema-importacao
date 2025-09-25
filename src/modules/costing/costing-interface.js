/**
 * costing-interface.js - Interface modular para cálculo de custos
 * FASE 2: Motor de Cálculo dos 4 Tipos de Custos
 * 
 * FUNÇÃO: Calcular custos precisos por regime tributário como base para formação de preços
 * 
 * REGRAS APLICADAS:
 * - NO FALLBACKS: Falha explícita quando dados obrigatórios ausentes
 * - PARÂMETROS OPCIONAIS: Sistema funciona com 3 ou 4 tipos de custos
 * - NOMENCLATURA OFICIAL: Seguindo padrão DIProcessor.js
 */

class CostingInterface {
    constructor() {
        this.currentDI = null;
        this.pricingEngine = null;
        this.indexedDBManager = null;
        this.calculationMode = 'completo';
        this.lastResult = null;
        
        this.initializeSystem();
    }

    /**
     * Inicializa o sistema de cálculo de custos
     */
    async initializeSystem() {
        console.log('🧮 Inicializando sistema de cálculo de custos...');
        
        try {
            // Validar dependências obrigatórias - NO FALLBACKS
            if (typeof PricingEngine === 'undefined') {
                throw new Error('PricingEngine não disponível - componente obrigatório não carregado');
            }
            
            if (typeof IndexedDBManager === 'undefined') {
                throw new Error('IndexedDBManager não disponível - componente obrigatório não carregado');
            }
            
            // Inicializar componentes
            this.pricingEngine = new PricingEngine();
            this.indexedDBManager = new IndexedDBManager();
            await this.indexedDBManager.initialize();
            
            // Carregar DI atual
            await this.loadCurrentDI();
            
            // Configurar interface
            this.setupEventListeners();
            
            console.log('✅ Sistema de cálculo de custos inicializado');
            
        } catch (error) {
            console.error('❌ Erro ao inicializar sistema de custos:', error);
            throw new Error(`Falha na inicialização do sistema: ${error.message}`);
        }
    }

    /**
     * Carrega DI atual da URL - NO FALLBACKS
     */
    async loadCurrentDI() {
        // Tentar obter ID da DI da URL
        const urlParams = new URLSearchParams(window.location.search);
        const diId = urlParams.get('di_id');
        
        if (!diId) {
            throw new Error('ID da DI obrigatório na URL - parâmetro ?di_id=X ausente');
        }
        
        const diIdNumber = parseInt(diId);
        if (isNaN(diIdNumber) || diIdNumber <= 0) {
            throw new Error(`ID da DI inválido: ${diId} - deve ser número positivo`);
        }
        
        // Buscar DI no IndexedDB
        this.currentDI = await this.indexedDBManager.getDI(diIdNumber);
        
        if (!this.currentDI) {
            throw new Error(`DI ${diIdNumber} não encontrada no banco de dados - verifique se foi processada`);
        }
        
        // Validar campos obrigatórios da DI
        if (!this.currentDI.numero_di) {
            throw new Error('Número da DI ausente - dados corrompidos');
        }
        
        if (!this.currentDI.importador_nome) {
            throw new Error('Nome do importador ausente - dados corrompidos');
        }
        
        // Atualizar interface com dados da DI
        this.updateDIInfo();
        
        console.log(`✅ DI ${this.currentDI.numero_di} carregada para precificação`);
    }

    /**
     * Atualiza informações da DI na interface
     */
    updateDIInfo() {
        const diNumberElement = document.getElementById('diNumber');
        const diImporterElement = document.getElementById('diImporter');
        
        if (!diNumberElement) {
            throw new Error('Elemento diNumber não encontrado na interface');
        }
        
        if (!diImporterElement) {
            throw new Error('Elemento diImporter não encontrado na interface');
        }
        
        diNumberElement.textContent = this.currentDI.numero_di;
        diImporterElement.textContent = this.currentDI.importador_nome;
    }

    /**
     * Configura event listeners da interface
     */
    setupEventListeners() {
        // Toggle de parâmetros opcionais
        const enableParametersCheck = document.getElementById('enableParameters');
        if (!enableParametersCheck) {
            throw new Error('Elemento enableParameters não encontrado na interface');
        }
        enableParametersCheck.addEventListener('change', () => this.toggleParametersSection());

        // Mudança de regime tributário
        const regimeRadios = document.querySelectorAll('input[name="regimeTributario"]');
        if (regimeRadios.length === 0) {
            throw new Error('Radio buttons de regime tributário não encontrados na interface');
        }
        
        regimeRadios.forEach(radio => {
            radio.addEventListener('change', () => this.updateCalculationText());
        });
    }

    /**
     * Seleciona modo de cálculo (básico ou completo)
     */
    selectCalculationMode(mode) {
        if (!mode) {
            throw new Error('Modo de cálculo obrigatório para seleção');
        }
        
        const validModes = ['basico', 'completo'];
        if (!validModes.includes(mode)) {
            throw new Error(`Modo de cálculo inválido: ${mode}. Válidos: ${validModes.join(', ')}`);
        }
        
        this.calculationMode = mode;
        
        // Atualizar visual dos botões
        document.querySelectorAll('.mode-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        const selectedOption = document.getElementById(`mode${mode.charAt(0).toUpperCase() + mode.slice(1)}`);
        if (!selectedOption) {
            throw new Error(`Elemento de modo ${mode} não encontrado na interface`);
        }
        selectedOption.classList.add('selected');
        
        // Atualizar textos da interface
        this.updateCalculationText();
        
        // Se modo básico, desabilitar parâmetros gerenciais
        const enableParametersCheck = document.getElementById('enableParameters');
        if (!enableParametersCheck) {
            throw new Error('Checkbox de parâmetros não encontrado na interface');
        }
        
        if (mode === 'basico') {
            enableParametersCheck.checked = false;
            enableParametersCheck.disabled = true;
            this.toggleParametersSection();
        } else {
            enableParametersCheck.disabled = false;
        }
        
        console.log(`📊 Modo de cálculo selecionado: ${mode}`);
    }

    /**
     * Atualiza textos baseado no modo e regime selecionado
     */
    updateCalculationText() {
        const calcularBtnText = document.getElementById('calcularBtnText');
        if (!calcularBtnText) {
            throw new Error('Elemento calcularBtnText não encontrado na interface');
        }
        
        const regimeChecked = document.querySelector('input[name="regimeTributario"]:checked');
        if (!regimeChecked) {
            throw new Error('Nenhum regime tributário selecionado');
        }
        
        if (this.calculationMode === 'basico') {
            calcularBtnText.textContent = 'Calcular 3 Tipos de Custos';
        } else {
            calcularBtnText.textContent = 'Calcular 4 Tipos de Custos';
        }
    }

    /**
     * Toggle da seção de parâmetros gerenciais
     */
    toggleParametersSection() {
        const parametersSection = document.getElementById('parametersSection');
        const enableParametersCheck = document.getElementById('enableParameters');
        
        if (!parametersSection) {
            throw new Error('Seção de parâmetros não encontrada na interface');
        }
        
        if (!enableParametersCheck) {
            throw new Error('Checkbox de parâmetros não encontrado na interface');
        }
        
        if (enableParametersCheck.checked) {
            parametersSection.classList.add('enabled');
        } else {
            parametersSection.classList.remove('enabled');
            // Limpar valores quando desabilitado
            const inputs = parametersSection.querySelectorAll('input');
            inputs.forEach(input => input.value = '');
        }
    }

    /**
     * Executa cálculo de custos - NO FALLBACKS
     */
    async calcularCustos() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        
        try {
            // Mostrar loading
            if (loadingOverlay) {
                loadingOverlay.style.display = 'flex';
            }
            
            // Validações obrigatórias
            if (!this.currentDI) {
                throw new Error('DI não carregada - sistema em estado inválido');
            }
            
            // Obter regime tributário selecionado
            const regimeSelected = document.querySelector('input[name="regimeTributario"]:checked');
            if (!regimeSelected) {
                throw new Error('Regime tributário obrigatório - selecione uma opção');
            }
            const regimeTributario = regimeSelected.value;
            
            // Preparar dados do engine
            const engineData = await this.prepareEngineData(regimeTributario);
            
            // Executar cálculo no PricingEngine
            let resultado;
            
            if (this.calculationMode === 'basico' || !this.isParametersEnabled()) {
                // Cálculo básico (3 tipos) - sem parâmetros gerenciais
                resultado = await this.calculateBasicCosts(engineData);
            } else {
                // Cálculo completo (4 tipos) - com parâmetros gerenciais
                resultado = await this.pricingEngine.calculatePricing(engineData);
            }
            
            // Salvar resultado no IndexedDB como custos calculados
            await this.saveCostingResult(resultado);
            
            // Mostrar resultados na interface
            this.displayResults(resultado);
            
            // Armazenar resultado para navegação
            this.lastResult = resultado;
            
            console.log('✅ Cálculo de custos concluído');
            
        } catch (error) {
            console.error('❌ Erro no cálculo de custos:', error);
            throw new Error(`Falha no cálculo de custos: ${error.message}`);
        } finally {
            // Ocultar loading
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
        }
    }

    /**
     * Verifica se parâmetros gerenciais estão habilitados
     */
    isParametersEnabled() {
        const enableParametersCheck = document.getElementById('enableParameters');
        if (!enableParametersCheck) {
            throw new Error('Checkbox de parâmetros não encontrado para verificação');
        }
        return enableParametersCheck.checked;
    }

    /**
     * Prepara dados para o PricingEngine - NO FALLBACKS
     */
    async prepareEngineData(regimeTributario) {
        if (!regimeTributario) {
            throw new Error('Regime tributário obrigatório para preparar dados do engine');
        }
        
        // Buscar totais da DI
        const totais = await this.calculateDITotals();
        
        // Buscar adições para detecção de produtos monofásicos
        const adicoes = await this.indexedDBManager.getAdicoesByDI(this.currentDI.id);
        if (!adicoes || adicoes.length === 0) {
            throw new Error('Adições não encontradas para a DI - dados obrigatórios ausentes');
        }
        
        const engineData = {
            di_id: this.currentDI.id,
            numero_di: this.currentDI.numero_di,
            regime_tributario: regimeTributario,
            totais: totais,
            adicoes: adicoes
        };
        
        // Adicionar parâmetros gerenciais se habilitados
        if (this.isParametersEnabled()) {
            engineData.parametros_gerenciais = this.getParametrosGerenciais();
        }
        
        return engineData;
    }

    /**
     * Calcula totais da DI - NO FALLBACKS
     */
    async calculateDITotals() {
        const adicoes = await this.indexedDBManager.getAdicoesByDI(this.currentDI.id);
        const despesas = await this.indexedDBManager.getDespesasByDI(this.currentDI.id);
        
        if (!adicoes || adicoes.length === 0) {
            throw new Error('Adições não encontradas para a DI - dados obrigatórios para cálculo de custos');
        }
        
        const totais = {
            valor_aduaneiro: 0,
            ii_devido: 0,
            ipi_devido: 0,
            pis_devido: 0,
            cofins_devido: 0,
            icms_devido: 0,
            despesas_aduaneiras: 0
        };
        
        // Somar valores das adições - validações rigorosas
        adicoes.forEach((adicao, index) => {
            if (!adicao.valor_reais && adicao.valor_reais !== 0) {
                throw new Error(`Valor em reais ausente na adição ${index + 1} - campo obrigatório`);
            }
            
            if (typeof adicao.ii_valor_devido !== 'number') {
                throw new Error(`II devido ausente na adição ${index + 1} - campo obrigatório para cálculo`);
            }
            
            if (typeof adicao.ipi_valor_devido !== 'number') {
                throw new Error(`IPI devido ausente na adição ${index + 1} - campo obrigatório para cálculo`);
            }
            
            if (typeof adicao.pis_valor_devido !== 'number') {
                throw new Error(`PIS devido ausente na adição ${index + 1} - campo obrigatório para cálculo`);
            }
            
            if (typeof adicao.cofins_valor_devido !== 'number') {
                throw new Error(`COFINS devido ausente na adição ${index + 1} - campo obrigatório para cálculo`);
            }
            
            totais.valor_aduaneiro += adicao.valor_reais;
            totais.ii_devido += adicao.ii_valor_devido;
            totais.ipi_devido += adicao.ipi_valor_devido;
            totais.pis_devido += adicao.pis_valor_devido;
            totais.cofins_devido += adicao.cofins_valor_devido;
            // ICMS será calculado separadamente se necessário
        });
        
        // Somar despesas aduaneiras
        if (despesas && despesas.length > 0) {
            despesas.forEach((despesa, index) => {
                if (typeof despesa.valor !== 'number') {
                    throw new Error(`Valor da despesa ${index + 1} deve ser numérico - dado corrompido`);
                }
                totais.despesas_aduaneiras += despesa.valor;
            });
        }
        
        // Validar totais calculados
        if (totais.valor_aduaneiro <= 0) {
            throw new Error('Valor aduaneiro total inválido - deve ser positivo para cálculo de custos');
        }
        
        return totais;
    }

    /**
     * Obter parâmetros gerenciais da interface - NO FALLBACKS
     */
    getParametrosGerenciais() {
        const encargosInput = document.getElementById('encargosFinanceiros');
        const custosInput = document.getElementById('custosIndiretos');
        const margemInput = document.getElementById('margemOperacional');
        const tributosInput = document.getElementById('tributosRecuperaveis');
        
        if (!encargosInput) {
            throw new Error('Campo encargos financeiros não encontrado na interface');
        }
        
        if (!custosInput) {
            throw new Error('Campo custos indiretos não encontrado na interface');
        }
        
        if (!margemInput) {
            throw new Error('Campo margem operacional não encontrado na interface');
        }
        
        if (!tributosInput) {
            throw new Error('Campo tributos recuperáveis não encontrado na interface');
        }
        
        const encargosFinanceiros = parseFloat(encargosInput.value);
        const custosIndiretos = parseFloat(custosInput.value);
        const margemOperacional = parseFloat(margemInput.value);
        const tributosRecuperaveis = parseFloat(tributosInput.value);
        
        if (isNaN(encargosFinanceiros)) {
            throw new Error('Encargos financeiros deve ser numérico - valor obrigatório');
        }
        
        if (isNaN(custosIndiretos)) {
            throw new Error('Custos indiretos deve ser numérico - valor obrigatório');
        }
        
        if (isNaN(margemOperacional)) {
            throw new Error('Margem operacional deve ser numérica - valor obrigatório');
        }
        
        if (isNaN(tributosRecuperaveis)) {
            throw new Error('Tributos recuperáveis deve ser numérico - valor obrigatório');
        }
        
        return {
            encargos_financeiros_percentual: encargosFinanceiros,
            custos_indiretos_percentual: custosIndiretos,
            margem_operacional_percentual: margemOperacional,
            tributos_recuperaveis_outros: tributosRecuperaveis
        };
    }

    /**
     * Cálculo básico (apenas 3 tipos de custos) - NO FALLBACKS
     */
    async calculateBasicCosts(engineData) {
        if (!engineData) {
            throw new Error('Dados do engine obrigatórios para cálculo básico');
        }
        
        // Calcular apenas os 3 primeiros tipos
        const custoBase = this.pricingEngine.calculateCustoBase(engineData);
        if (!custoBase || typeof custoBase.custo_base !== 'number') {
            throw new Error('Falha no cálculo do custo base - resultado inválido');
        }
        
        const custoDesembolso = await this.pricingEngine.calculateCustoDesembolso(
            custoBase.custo_base, 
            engineData.regime_tributario, 
            engineData
        );
        if (!custoDesembolso || typeof custoDesembolso.custo_desembolso !== 'number') {
            throw new Error('Falha no cálculo do custo de desembolso - resultado inválido');
        }
        
        // Parâmetros mínimos para custo contábil (sem fallbacks - valores zerados explícitos)
        const parametrosMinimos = {
            encargos_financeiros_percentual: 0,
            tributos_recuperaveis_outros: 0
        };
        
        const custoContabil = this.pricingEngine.calculateCustoContabil(
            custoDesembolso.custo_desembolso,
            parametrosMinimos
        );
        if (!custoContabil || typeof custoContabil.custo_contabil !== 'number') {
            throw new Error('Falha no cálculo do custo contábil - resultado inválido');
        }
        
        // Estruturar resultado básico
        return {
            di_id: engineData.di_id,
            numero_di: engineData.numero_di,
            regime_tributario: engineData.regime_tributario,
            
            // 3 TIPOS DE CUSTOS
            custo_base: custoBase.custo_base,
            custo_desembolso: custoDesembolso.custo_desembolso,
            custo_contabil: custoContabil.custo_contabil,
            base_formacao_preco: null, // Não calculado no modo básico
            
            // Análises
            total_creditos: custoDesembolso.total_creditos_aplicados,
            economia_creditos: custoDesembolso.economia_creditos,
            percentual_economia: custoDesembolso.percentual_economia,
            
            // Detalhamento
            detalhamento_completo: {
                custoBase: custoBase,
                custoDesembolso: custoDesembolso,
                custoContabil: custoContabil,
                baseFormacaoPreco: null
            },
            
            timestamp: new Date().toISOString(),
            versao_calculo: '2.0.0-basic'
        };
    }

    /**
     * Exibir resultados na interface - NO FALLBACKS
     */
    displayResults(resultado) {
        if (!resultado) {
            throw new Error('Resultado obrigatório para exibir na interface');
        }
        
        const resultadosCard = document.getElementById('resultadosCard');
        const custosDisplay = document.getElementById('custosDisplay');
        const resultadoTitulo = document.getElementById('resultadoTitulo');
        
        if (!resultadosCard) {
            throw new Error('Card de resultados não encontrado na interface');
        }
        
        if (!custosDisplay) {
            throw new Error('Display de custos não encontrado na interface');
        }
        
        if (!resultadoTitulo) {
            throw new Error('Título de resultado não encontrado na interface');
        }
        
        // Validar campos obrigatórios do resultado
        if (typeof resultado.custo_base !== 'number') {
            throw new Error('Custo base ausente no resultado - cálculo inválido');
        }
        
        if (typeof resultado.custo_desembolso !== 'number') {
            throw new Error('Custo desembolso ausente no resultado - cálculo inválido');
        }
        
        if (typeof resultado.custo_contabil !== 'number') {
            throw new Error('Custo contábil ausente no resultado - cálculo inválido');
        }
        
        // Atualizar título
        if (this.calculationMode === 'basico' || !resultado.base_formacao_preco) {
            resultadoTitulo.textContent = 'Resultado: 3 Tipos de Custos';
        } else {
            resultadoTitulo.textContent = 'Resultado: 4 Tipos de Custos Completos';
        }
        
        // Limpar display anterior
        custosDisplay.innerHTML = '';
        
        // Custos a exibir
        const custos = [
            { nome: 'Custo Base', valor: resultado.custo_base, classe: 'info' },
            { nome: 'Custo Desembolso', valor: resultado.custo_desembolso, classe: 'success' },
            { nome: 'Custo Contábil', valor: resultado.custo_contabil, classe: 'warning' }
        ];
        
        // Adicionar 4º tipo se disponível
        if (resultado.base_formacao_preco && typeof resultado.base_formacao_preco === 'number') {
            custos.push({ 
                nome: 'Base Formação Preço', 
                valor: resultado.base_formacao_preco, 
                classe: 'danger' 
            });
        }
        
        // Criar elementos de custos
        custos.forEach(custo => {
            const colSize = resultado.base_formacao_preco ? 'col-md-3' : 'col-md-4';
            const custoHtml = `
                <div class="${colSize}">
                    <div class="custo-display mb-3" style="border-color: var(--bs-${custo.classe});">
                        <div class="custo-value">R$ ${this.formatCurrency(custo.valor)}</div>
                        <small class="text-muted">${custo.nome}</small>
                    </div>
                </div>
            `;
            custosDisplay.innerHTML += custoHtml;
        });
        
        // Atualizar informações adicionais
        this.updateAdditionalInfo(resultado);
        
        // Mostrar card e botão salvar
        resultadosCard.style.display = 'block';
        const salvarBtn = document.getElementById('salvarBtn');
        if (salvarBtn) {
            salvarBtn.style.display = 'inline-block';
        }
    }

    /**
     * Atualiza informações adicionais do resultado - NO FALLBACKS
     */
    updateAdditionalInfo(resultado) {
        if (!resultado) {
            throw new Error('Resultado obrigatório para atualizar informações adicionais');
        }
        
        const totalCreditos = document.getElementById('totalCreditos');
        const economiaPercentual = document.getElementById('economiaPercentual');
        const regimeAplicado = document.getElementById('regimeAplicado');
        const tipoImportacao = document.getElementById('tipoImportacao');
        const versaoCalculo = document.getElementById('versaoCalculo');
        const timestampCalculo = document.getElementById('timestampCalculo');
        
        if (!totalCreditos) {
            throw new Error('Elemento totalCreditos não encontrado na interface');
        }
        
        if (!economiaPercentual) {
            throw new Error('Elemento economiaPercentual não encontrado na interface');
        }
        
        if (!regimeAplicado) {
            throw new Error('Elemento regimeAplicado não encontrado na interface');
        }
        
        if (!tipoImportacao) {
            throw new Error('Elemento tipoImportacao não encontrado na interface');
        }
        
        if (!versaoCalculo) {
            throw new Error('Elemento versaoCalculo não encontrado na interface');
        }
        
        if (!timestampCalculo) {
            throw new Error('Elemento timestampCalculo não encontrado na interface');
        }
        
        // Validar campos obrigatórios do resultado
        if (typeof resultado.total_creditos !== 'number') {
            throw new Error('Total de créditos ausente no resultado');
        }
        
        if (typeof resultado.percentual_economia !== 'number') {
            throw new Error('Percentual de economia ausente no resultado');
        }
        
        if (!resultado.regime_tributario) {
            throw new Error('Regime tributário ausente no resultado');
        }
        
        if (!resultado.versao_calculo) {
            throw new Error('Versão de cálculo ausente no resultado');
        }
        
        if (!resultado.timestamp) {
            throw new Error('Timestamp ausente no resultado');
        }
        
        // Atualizar elementos
        totalCreditos.textContent = this.formatCurrency(resultado.total_creditos);
        economiaPercentual.textContent = `${resultado.percentual_economia.toFixed(2)}%`;
        regimeAplicado.textContent = this.getRegimeDisplayName(resultado.regime_tributario);
        tipoImportacao.textContent = resultado.import_type ? resultado.import_type : 'Normal';
        versaoCalculo.textContent = resultado.versao_calculo;
        timestampCalculo.textContent = new Date(resultado.timestamp).toLocaleString();
    }

    /**
     * Salva resultado dos custos no IndexedDB para próxima etapa
     */
    async saveCostingResult(resultado) {
        if (!resultado) {
            throw new Error('Resultado obrigatório para salvar custos calculados');
        }
        
        const costingResult = {
            di_id: resultado.di_id,
            numero_di: resultado.numero_di,
            regime_tributario: resultado.regime_tributario,
            custos_4_tipos: {
                custo_base: resultado.custo_base,
                custo_desembolso: resultado.custo_desembolso,
                custo_contabil: resultado.custo_contabil,
                base_formacao_preco: resultado.base_formacao_preco
            },
            detalhamento_completo: resultado.detalhamento_completo,
            total_creditos: resultado.total_creditos,
            economia_creditos: resultado.economia_creditos,
            percentual_economia: resultado.percentual_economia,
            ready_for_pricing: true,
            timestamp: new Date().toISOString(),
            versao_calculo: resultado.versao_calculo || '2.0.0'
        };
        
        // Salvar no IndexedDB usando método específico
        await this.indexedDBManager.saveCostingResult(costingResult);
        
        console.log(`✅ Custos salvos para DI ${resultado.numero_di} - pronto para precificação`);
    }

    /**
     * Navegar para próxima etapa (pricing)
     */
    async prosseguirParaPrecificacao() {
        if (!this.lastResult) {
            throw new Error('Execute o cálculo de custos primeiro');
        }
        
        if (!this.lastResult.ready_for_pricing && !this.lastResult.custo_base) {
            throw new Error('Cálculo de custos deve estar completo para prosseguir');
        }
        
        // Salvar métrica de pipeline
        await this.savePipelineMetric('costing_completed');
        
        const url = `../pricing/pricing-interface.html?di_id=${this.currentDI.id}&from_costing=true`;
        console.log(`🔄 Navegando para precificação: ${url}`);
        window.location.href = url;
    }

    /**
     * Salvar métrica de pipeline para dashboard
     */
    async savePipelineMetric(etapa) {
        try {
            const metric = {
                di_id: this.currentDI.id,
                etapa: etapa,
                tempo_processamento: Date.now() - (this.startTime || Date.now()),
                status: 'success',
                resultado_resumo: {
                    regime_tributario: this.lastResult?.regime_tributario,
                    custo_base: this.lastResult?.custo_base,
                    economia_creditos: this.lastResult?.economia_creditos
                },
                timestamp: new Date().toISOString()
            };
            
            await this.indexedDBManager.savePipelineMetric(metric);
            console.log(`📊 Métrica salva: ${etapa}`);
        } catch (error) {
            console.warn('Erro ao salvar métrica (não crítico):', error);
        }
    }

    /**
     * Salva configurações no IndexedDB
     */
    async salvarConfiguracoes() {
        // As configurações já foram salvas durante o cálculo
        // Aqui podemos salvar parâmetros gerenciais se necessário
        
        if (this.isParametersEnabled()) {
            const regimeSelected = document.querySelector('input[name="regimeTributario"]:checked');
            if (!regimeSelected) {
                throw new Error('Regime tributário deve estar selecionado para salvar configurações');
            }
            
            const parametros = this.getParametrosGerenciais();
            
            await this.indexedDBManager.saveParametrosGerenciais(
                this.currentDI.id, 
                regimeSelected.value, 
                parametros
            );
        }
        
        console.log('✅ Configurações salvas com sucesso');
    }

    /**
     * Utilitários - formatação sem fallbacks
     */
    formatCurrency(value) {
        if (typeof value !== 'number') {
            throw new Error('Valor deve ser numérico para formatação de moeda');
        }
        
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    }

    getRegimeDisplayName(regime) {
        if (!regime) {
            throw new Error('Regime obrigatório para obter nome de exibição');
        }
        
        const nomes = {
            'lucro_real': 'Lucro Real',
            'lucro_presumido': 'Lucro Presumido', 
            'simples_nacional': 'Simples Nacional'
        };
        
        if (!nomes[regime]) {
            throw new Error(`Regime desconhecido: ${regime}`);
        }
        
        return nomes[regime];
    }
}

// Funções globais para compatibilidade com HTML
let costingInterface;

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    try {
        costingInterface = new CostingInterface();
        costingInterface.startTime = Date.now(); // Para métricas
    } catch (error) {
        console.error('❌ Erro fatal na inicialização:', error);
        alert('Erro ao carregar sistema de cálculo de custos: ' + error.message);
    }
});

// Funções globais chamadas pelo HTML - com validações
function selectCalculationMode(mode) {
    if (!costingInterface) {
        throw new Error('Sistema de custos não inicializado');
    }
    costingInterface.selectCalculationMode(mode);
}

function toggleParametersSection() {
    if (!costingInterface) {
        throw new Error('Sistema de custos não inicializado');
    }
    costingInterface.toggleParametersSection();
}

function calcularCustos() {
    if (!costingInterface) {
        throw new Error('Sistema de custos não inicializado');
    }
    
    costingInterface.calcularCustos().catch(error => {
        console.error('❌ Erro no cálculo:', error);
        alert('Erro no cálculo: ' + error.message);
    });
}

function prosseguirParaPrecificacao() {
    if (!costingInterface) {
        throw new Error('Sistema de custos não inicializado');
    }
    
    costingInterface.prosseguirParaPrecificacao().catch(error => {
        console.error('❌ Erro na navegação:', error);
        alert('Erro ao navegar para precificação: ' + error.message);
    });
}

function salvarConfiguracoes() {
    if (!costingInterface) {
        throw new Error('Sistema de custos não inicializado');
    }
    
    costingInterface.salvarConfiguracoes().catch(error => {
        console.error('❌ Erro ao salvar:', error);
        alert('Erro ao salvar: ' + error.message);
    });
}

// Manter compatibilidade com nome antigo (temporário)
function calcularPrecificacao() {
    console.warn('⚠️ calcularPrecificacao() é deprecated - use calcularCustos()');
    calcularCustos();
}