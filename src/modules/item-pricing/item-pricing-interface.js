/**
 * Item Pricing Interface
 * FASE 2.5: Precificação por Item Individual
 * 
 * Lógica principal do módulo de precificação individual
 * 
 * PRINCÍPIOS:
 * - NO FALLBACKS: Falha explicitamente se dados não estiverem disponíveis
 * - NO HARDCODED DATA: Todos os dados vêm de configuração externa
 * - Single Source of Truth: DIProcessor nomenclatura + ConfigLoader dados
 * 
 * @author Sistema Expertzy v3.0
 * @version FASE 2.5.1
 */

import { ItemPricingCalculator } from '@core/calculators/ItemPricingCalculator.js';
import { dbManager } from '@services/database/IndexedDBManager.js';
import { ConfigLoader } from '@shared/utils/ConfigLoader.js';

class ItemPricingInterface {
    constructor() {
        // Componentes serão inicializados no método initialize()
        this.calculator = null;
        this.dbManager = null;
        this.configLoader = null;
        
        this.currentDI = null;
        this.currentItem = null;
        this.aliquotasData = null;
        this.estadosBrasil = null;
        
        this.elements = {};
        this.initialized = false;
    }

    /**
     * Inicializar interface - OBRIGATÓRIO no load da página
     */
    async initialize() {
        if (this.initialized) return;

        try {
            this.showLoading('Inicializando sistema de precificação...');

            // Inicializar dependências obrigatórias
            await this._initializeDependencies();
            
            // Capturar elementos DOM
            this._initializeElements();
            
            // Configurar event listeners
            this._setupEventListeners();
            
            // Carregar dados iniciais
            await this._loadInitialData();
            
            this.initialized = true;
            console.log('✅ ItemPricingInterface inicializado com sucesso');
            
        } catch (error) {
            console.error('❌ FALHA CRÍTICA na inicialização:', error);
            this.showError(`Falha na inicialização: ${error.message}`);
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Inicializar dependências obrigatórias
     * @private
     */
    async _initializeDependencies() {
        // Validar dependências obrigatórias - NO FALLBACKS
        if (typeof ItemPricingCalculator === 'undefined') {
            throw new Error('ItemPricingCalculator não disponível - componente obrigatório não carregado');
        }
        
        if (!dbManager || typeof dbManager.initialize !== 'function') {
            throw new Error('dbManager não disponível - instância singleton obrigatória');
        }
        
        if (typeof ConfigLoader === 'undefined') {
            throw new Error('ConfigLoader não disponível - componente obrigatório não carregado');
        }
        
        // Inicializar componentes
        this.calculator = new ItemPricingCalculator();
        this.dbManager = dbManager; // Usar instância singleton
        this.configLoader = new ConfigLoader();
        
        // Inicializar calculator (obrigatório)
        await this.calculator.initialize();
        
        // Verificar conexão com IndexedDB
        const dbStatus = await this.dbManager.checkDatabaseStatus();
        if (!dbStatus.connected) {
            throw new Error('IndexedDB não disponível - obrigatório para funcionalidade');
        }

        // Carregar dados de configuração obrigatórios
        const [aliquotas, estados] = await Promise.all([
            this.configLoader.loadAliquotas(),
            this.configLoader.loadEstadosBrasil()
        ]);

        if (!aliquotas) {
            throw new Error('Dados de aliquotas não disponíveis - obrigatório para interface');
        }
        if (!estados) {
            throw new Error('Dados de estados não disponíveis - obrigatório para interface');
        }

        this.aliquotasData = aliquotas;
        this.estadosBrasil = estados;
    }

    /**
     * Capturar elementos DOM obrigatórios
     * @private
     */
    _initializeElements() {
        const requiredElements = [
            'diSelector', 'itemSelector', 'calculateBtn', 'saveBtn',
            'marginPercentualValue', 'markupFixoValue', 'precoManualValue',
            'estadoOrigem', 'estadoDestino', 'tipoCliente', 'regimeVendedor',
            'itemDetailsSection', 'pricingSection', 'scenarioSection',
            'itemDetailsContent', 'resultsContent', 'specialRegimesContent'
        ];

        for (const elementId of requiredElements) {
            const element = document.getElementById(elementId);
            if (!element) {
                throw new Error(`Elemento DOM obrigatório não encontrado: ${elementId}`);
            }
            this.elements[elementId] = element;
        }

        // Elementos de radio buttons
        this.elements.marginType = document.querySelectorAll('input[name="marginType"]');
        if (this.elements.marginType.length === 0) {
            throw new Error('Radio buttons de tipo de margem não encontrados');
        }
    }

    /**
     * Configurar event listeners
     * @private
     */
    _setupEventListeners() {
        // Seleção de DI
        this.elements.diSelector.addEventListener('change', (e) => {
            this.onDISelected(e.target.value);
        });

        // Seleção de item
        this.elements.itemSelector.addEventListener('change', (e) => {
            this.onItemSelected(e.target.value);
        });

        // Radio buttons de margem
        this.elements.marginType.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.onMarginTypeChanged(e.target.value);
            });
        });

        // Botões principais
        this.elements.calculateBtn.addEventListener('click', () => {
            this.calculatePricing();
        });

        this.elements.saveBtn.addEventListener('click', () => {
            this.savePricingResults();
        });

        // Validação de formulário em tempo real
        this._setupFormValidation();
    }

    /**
     * Carregar dados iniciais
     * @private
     */
    async _loadInitialData() {
        // Carregar DIs com custos calculados
        await this.loadAvailableDIs();
        
        // Popular dropdowns de estados
        this.populateStateDropdowns();
    }

    /**
     * Carregar DIs disponíveis para precificação
     */
    async loadAvailableDIs() {
        try {
            // Buscar DIs com dados de precificação calculados
            const dis = await this.dbManager.getAllDIs();
            
            if (!dis || dis.length === 0) {
                throw new Error('Nenhuma DI processada encontrada no sistema');
            }

            // Filtrar apenas DIs com custos calculados
            const disComCustos = dis.filter(di => 
                di.valores_base_finais && 
                di.valores_base_finais.tipo_1_custo_base > 0
            );

            if (disComCustos.length === 0) {
                this.showWarning('Nenhuma DI com custos calculados encontrada. Execute primeiro o módulo de Precificação.');
                return;
            }

            // Popular dropdown
            this.elements.diSelector.innerHTML = '<option value="">Selecione uma DI processada...</option>';
            
            disComCustos.forEach(di => {
                const option = document.createElement('option');
                option.value = di.numero_di;
                option.textContent = `DI ${di.numero_di} - ${di.importador_nome} - R$ ${this.formatCurrency(di.valor_aduaneiro)}`;
                this.elements.diSelector.appendChild(option);
            });

            console.log(`✅ ${disComCustos.length} DIs carregadas para precificação`);
            
        } catch (error) {
            console.error('❌ Erro ao carregar DIs:', error);
            this.showError(`Erro ao carregar DIs: ${error.message}`);
        }
    }

    /**
     * Popular dropdowns de estados
     */
    populateStateDropdowns() {
        const dropdowns = [this.elements.estadoOrigem, this.elements.estadoDestino];
        
        dropdowns.forEach(dropdown => {
            dropdown.innerHTML = '<option value="">Selecione o estado...</option>';
            
            for (const [sigla, dados] of Object.entries(this.estadosBrasil)) {
                const option = document.createElement('option');
                option.value = sigla;
                option.textContent = `${sigla} - ${dados.nome}`;
                dropdown.appendChild(option);
            }
        });
    }

    /**
     * Handler: DI selecionada
     */
    async onDISelected(diNumber) {
        if (!diNumber) {
            this.resetItemSelection();
            return;
        }

        try {
            this.showLoading('Carregando itens da DI...');
            
            // Carregar dados completos da DI
            this.currentDI = await this.dbManager.getDIByNumber(diNumber);
            if (!this.currentDI) {
                throw new Error(`DI ${diNumber} não encontrada no banco de dados`);
            }

            // Carregar itens da DI
            const items = await this.dbManager.getItemsByDI(diNumber);
            if (!items || items.length === 0) {
                throw new Error(`Nenhum item encontrado para DI ${diNumber}`);
            }

            // Popular dropdown de itens
            this.elements.itemSelector.innerHTML = '<option value="">Selecione um item...</option>';
            this.elements.itemSelector.disabled = false;

            items.forEach((item, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `Item ${item.numero_adicao} - ${item.ncm} - ${item.descricao_ncm || 'Sem descrição'}`;
                this.elements.itemSelector.appendChild(option);
            });

            this.currentItems = items;
            console.log(`✅ ${items.length} itens carregados para DI ${diNumber}`);
            
        } catch (error) {
            console.error('❌ Erro ao carregar DI:', error);
            this.showError(`Erro ao carregar DI: ${error.message}`);
            this.resetItemSelection();
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Handler: Item selecionado
     */
    async onItemSelected(itemIndex) {
        if (!itemIndex || !this.currentItems) {
            this.hideItemDetails();
            return;
        }

        try {
            const item = this.currentItems[parseInt(itemIndex)];
            if (!item) {
                throw new Error('Item selecionado não encontrado');
            }

            this.currentItem = item;
            
            // Exibir detalhes do item
            this.displayItemDetails(item);
            
            // Detectar regimes especiais
            this.detectAndDisplaySpecialRegimes(item.ncm);
            
            // Mostrar seção de precificação
            this.elements.pricingSection.style.display = 'block';
            this.elements.pricingSection.classList.add('fade-in-up');
            
            // Habilitar botão de cálculo se formulário válido
            this.validateForm();
            
        } catch (error) {
            console.error('❌ Erro ao carregar item:', error);
            this.showError(`Erro ao carregar item: ${error.message}`);
        }
    }

    /**
     * Exibir detalhes do item selecionado
     */
    displayItemDetails(item) {
        const detailsHTML = `
            <div class="col-md-3">
                <div class="item-detail">
                    <div class="item-detail-label">NCM</div>
                    <div class="item-detail-value">${item.ncm || 'Não informado'}</div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="item-detail">
                    <div class="item-detail-label">Descrição</div>
                    <div class="item-detail-value">${item.descricao_ncm || 'Não informado'}</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="item-detail">
                    <div class="item-detail-label">Valor FOB</div>
                    <div class="item-detail-value">R$ ${this.formatCurrency(item.valor_reais || 0)}</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="item-detail">
                    <div class="item-detail-label">Peso Líquido</div>
                    <div class="item-detail-value">${item.peso_liquido || 0} kg</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="item-detail">
                    <div class="item-detail-label">II Devido</div>
                    <div class="item-detail-value">R$ ${this.formatCurrency(item.ii_valor_devido || 0)}</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="item-detail">
                    <div class="item-detail-label">IPI Devido</div>
                    <div class="item-detail-value">R$ ${this.formatCurrency(item.ipi_valor_devido || 0)}</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="item-detail">
                    <div class="item-detail-label">PIS/COFINS</div>
                    <div class="item-detail-value">R$ ${this.formatCurrency((item.pis_valor_devido || 0) + (item.cofins_valor_devido || 0))}</div>
                </div>
            </div>
        `;

        this.elements.itemDetailsContent.innerHTML = detailsHTML;
        this.elements.itemDetailsSection.style.display = 'block';
        this.elements.itemDetailsSection.classList.add('fade-in-up');
    }

    /**
     * Detectar e exibir regimes especiais
     */
    async detectAndDisplaySpecialRegimes(ncm) {
        if (!ncm) return;

        try {
            const regimes = this.calculator.detectSpecialRegimes(ncm);
            
            let badgesHTML = '';
            
            if (regimes.monofasico) {
                badgesHTML += `<span class="regime-badge monofasico">
                    <i class="bi bi-shield-check"></i> Monofásico: ${regimes.categoria_monofasica}
                </span>`;
            }
            
            if (regimes.st_detectado) {
                badgesHTML += `<span class="regime-badge st">
                    <i class="bi bi-exclamation-triangle"></i> Substituição Tributária
                </span>`;
            }
            
            regimes.beneficios_disponiveis.forEach(beneficio => {
                badgesHTML += `<span class="regime-badge beneficio">
                    <i class="bi bi-award"></i> ${beneficio.estado}: ${beneficio.tipo_beneficio}
                </span>`;
            });

            if (badgesHTML) {
                this.elements.specialRegimesContent.innerHTML = badgesHTML;
                document.getElementById('specialRegimesCard').style.display = 'block';
            } else {
                document.getElementById('specialRegimesCard').style.display = 'none';
            }
            
        } catch (error) {
            console.error('❌ Erro ao detectar regimes especiais:', error);
        }
    }

    /**
     * Handler: Tipo de margem alterado
     */
    onMarginTypeChanged(tipo) {
        // Resetar e desabilitar todos os inputs
        this.elements.marginPercentualValue.disabled = true;
        this.elements.markupFixoValue.disabled = true;
        this.elements.precoManualValue.disabled = true;

        // Habilitar apenas o input correspondente
        switch (tipo) {
            case 'percentual':
                this.elements.marginPercentualValue.disabled = false;
                this.elements.marginPercentualValue.focus();
                break;
            case 'markup_fixo':
                this.elements.markupFixoValue.disabled = false;
                this.elements.markupFixoValue.focus();
                break;
            case 'preco_manual':
                this.elements.precoManualValue.disabled = false;
                this.elements.precoManualValue.focus();
                break;
        }

        this.validateForm();
    }

    /**
     * Calcular precificação
     */
    async calculatePricing() {
        if (!this.currentItem || !this.currentDI) {
            this.showError('Item e DI devem estar selecionados');
            return;
        }

        try {
            this.showLoading('Calculando preços...');
            this.elements.calculateBtn.disabled = true;

            // Coletar parâmetros do formulário
            const parametros = this._collectFormParameters();
            
            // Validar parâmetros
            this._validateCalculationParameters(parametros);

            // Calcular custos do item
            const custoItem = this.calculator.calculateItemCosts(this.currentItem, this.currentDI);
            
            // Calcular preço com margem
            const pricing = this.calculator.calculatePriceWithMargin(
                custoItem, 
                parametros.margem, 
                parametros.cenario
            );

            // Exibir resultados
            this.displayResults(custoItem, pricing);
            
            // Habilitar botão salvar
            this.elements.saveBtn.disabled = false;
            
            // Armazenar resultados para salvar
            this.lastCalculation = {
                item: this.currentItem,
                di: this.currentDI,
                custo: custoItem,
                pricing: pricing,
                parametros: parametros
            };

            console.log('✅ Cálculo de precificação concluído');

        } catch (error) {
            console.error('❌ Erro no cálculo:', error);
            this.showError(`Erro no cálculo: ${error.message}`);
        } finally {
            this.hideLoading();
            this.elements.calculateBtn.disabled = false;
        }
    }

    /**
     * Coletar parâmetros do formulário
     * @private
     */
    _collectFormParameters() {
        // Tipo de margem selecionado
        const tipoMargem = document.querySelector('input[name="marginType"]:checked').value;
        
        let valorMargem;
        switch (tipoMargem) {
            case 'percentual':
                valorMargem = this.elements.marginPercentualValue.value;
                break;
            case 'markup_fixo':
                valorMargem = this.elements.markupFixoValue.value;
                break;
            case 'preco_manual':
                valorMargem = this.elements.precoManualValue.value;
                break;
        }

        const parametros = {
            margem: {
                tipo: tipoMargem,
                valor: valorMargem
            },
            cenario: {
                estado_origem: this.elements.estadoOrigem.value,
                estado_destino: this.elements.estadoDestino.value,
                tipo_cliente: this.elements.tipoCliente.value,
                regime_vendedor: this.elements.regimeVendedor.value
            }
        };

        return parametros;
    }

    /**
     * Validar parâmetros de cálculo
     * @private
     */
    _validateCalculationParameters(parametros) {
        if (!parametros.margem.valor || parametros.margem.valor === '') {
            throw new Error('Valor de margem obrigatório');
        }

        if (!parametros.cenario.estado_origem) {
            throw new Error('Estado de origem obrigatório');
        }

        if (!parametros.cenario.tipo_cliente) {
            throw new Error('Tipo de cliente obrigatório');
        }

        if (!parametros.cenario.regime_vendedor) {
            throw new Error('Regime do vendedor obrigatório');
        }

        // Validações específicas por tipo
        const valor = parseFloat(parametros.margem.valor);
        if (isNaN(valor)) {
            throw new Error('Valor de margem deve ser numérico');
        }

        switch (parametros.margem.tipo) {
            case 'percentual':
                if (valor < 0 || valor >= 100) {
                    throw new Error('Margem percentual deve estar entre 0% e 99%');
                }
                break;
            case 'markup_fixo':
                if (valor < 0) {
                    throw new Error('Markup fixo deve ser positivo');
                }
                break;
            case 'preco_manual':
                if (valor <= 0) {
                    throw new Error('Preço manual deve ser positivo');
                }
                break;
        }
    }

    /**
     * Exibir resultados do cálculo
     */
    displayResults(custoItem, pricing) {
        const resultHTML = `
            <div class="result-item">
                <div class="result-label">Custo Contábil Total</div>
                <div class="result-value result-currency">R$ ${this.formatCurrency(custoItem.custo_contabil_total)}</div>
            </div>
            
            <div class="result-item">
                <div class="result-label">Preço Margem Zero</div>
                <div class="result-value result-currency">R$ ${this.formatCurrency(pricing.dados_origem.preco_margem_zero)}</div>
            </div>
            
            <div class="result-item">
                <div class="result-label">Preço Com Margem</div>
                <div class="result-value result-currency">R$ ${this.formatCurrency(pricing.preco_sem_impostos)}</div>
            </div>
            
            <div class="result-item">
                <div class="result-label">Impostos de Venda</div>
                <div class="result-value result-currency">R$ ${this.formatCurrency(pricing.impostos_venda.total)}</div>
            </div>
            
            <div class="result-item" style="border-left: 4px solid #28a745;">
                <div class="result-label">PREÇO FINAL</div>
                <div class="result-value result-currency" style="font-size: 1.5rem; color: #28a745;">
                    R$ ${this.formatCurrency(pricing.preco_final)}
                </div>
            </div>
        `;

        this.elements.resultsContent.innerHTML = resultHTML;
    }

    // === UTILITÁRIOS ===

    /**
     * Validar formulário completo
     */
    validateForm() {
        const tipoMargem = document.querySelector('input[name="marginType"]:checked');
        const temValorMargem = this._hasMarginValue();
        const temCenario = this.elements.estadoOrigem.value && 
                          this.elements.tipoCliente.value && 
                          this.elements.regimeVendedor.value;

        const isValid = this.currentItem && tipoMargem && temValorMargem && temCenario;
        this.elements.calculateBtn.disabled = !isValid;
    }

    _hasMarginValue() {
        const tipo = document.querySelector('input[name="marginType"]:checked')?.value;
        switch (tipo) {
            case 'percentual':
                return this.elements.marginPercentualValue.value !== '';
            case 'markup_fixo':
                return this.elements.markupFixoValue.value !== '';
            case 'preco_manual':
                return this.elements.precoManualValue.value !== '';
            default:
                return false;
        }
    }

    /**
     * Configurar validação em tempo real
     * @private
     */
    _setupFormValidation() {
        const inputs = [
            this.elements.marginPercentualValue,
            this.elements.markupFixoValue,
            this.elements.precoManualValue,
            this.elements.estadoOrigem,
            this.elements.estadoDestino,
            this.elements.tipoCliente,
            this.elements.regimeVendedor
        ];

        inputs.forEach(input => {
            input.addEventListener('input', () => this.validateForm());
            input.addEventListener('change', () => this.validateForm());
        });
    }

    /**
     * Reset de seleção de item
     */
    resetItemSelection() {
        this.elements.itemSelector.innerHTML = '<option value="">Primeiro selecione uma DI...</option>';
        this.elements.itemSelector.disabled = true;
        this.hideItemDetails();
        this.hidePricingSection();
        this.currentItems = null;
        this.currentItem = null;
    }

    hideItemDetails() {
        this.elements.itemDetailsSection.style.display = 'none';
    }

    hidePricingSection() {
        this.elements.pricingSection.style.display = 'none';
        this.elements.scenarioSection.style.display = 'none';
    }

    /**
     * Formatação de moeda
     */
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value || 0);
    }

    /**
     * Controle de loading
     */
    showLoading(message = 'Carregando...') {
        const overlay = document.getElementById('loadingOverlay');
        const messageElement = overlay.querySelector('.text-white');
        if (messageElement) {
            messageElement.textContent = message;
        }
        overlay.classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.add('hidden');
    }

    /**
     * Exibir mensagens
     */
    showError(message) {
        console.error('❌', message);
        // Implementar toast/alert conforme necessário
        alert(`Erro: ${message}`);
    }

    showWarning(message) {
        console.warn('⚠️', message);
        alert(`Aviso: ${message}`);
    }

    showSuccess(message) {
        console.log('✅', message);
        alert(`Sucesso: ${message}`);
    }
}

// Inicializar interface quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const pricingInterface = new ItemPricingInterface();
        await pricingInterface.initialize();
        
        // Tornar disponível globalmente para debug
        window.itemPricingInterface = pricingInterface;
        
    } catch (error) {
        console.error('❌ FALHA CRÍTICA na inicialização da interface:', error);
        alert(`Falha crítica: ${error.message}`);
    }
});