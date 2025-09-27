/**
 * business-interface.js - Interface Controller for Pricing Strategy System
 * 
 * Handles UI interactions for the Business Strategy Phase
 * Coordinates between PricingEngine and ScenarioAnalysis
 * Manages business workflow and strategic decision interface
 * Utiliza IndexedDBManager para persistência - NO FALLBACKS
 */

import { dbManager } from '@services/database/IndexedDBManager.js';

// Global instances
let pricingEngine = null;
let scenarioAnalysis = null;
let loadedDI = null;
let currentScenarios = null;
let currentRecommendations = null;
let currentStep = 1;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Business Interface: Inicializando sistema de precificação...');
    try {
        await initializeBusinessSystem();
        setupBusinessEventListeners();
        await checkForLoadedDI();
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        showAlert('Erro ao inicializar sistema: ' + error.message, 'danger');
    }
});

/**
 * Initialize business system components
 */
async function initializeBusinessSystem() {
    try {
        // Initialize engine instances
        pricingEngine = new PricingEngine();
        scenarioAnalysis = new ScenarioAnalysis();
        
        // Configure default pricing rules
        pricingEngine.configurePricingRules({
            customer_types: {
                final_consumer: { markup_min: 35, markup_max: 55, tax_regime: 'normal' },
                reseller: { markup_min: 18, markup_max: 28, tax_regime: 'substitution' },
                industry: { markup_min: 12, markup_max: 22, tax_regime: 'normal' }
            },
            positioning: {
                premium: { markup_factor: 1.4, quality_score: 95 },
                standard: { markup_factor: 1.0, quality_score: 80 },
                competitive: { markup_factor: 0.85, quality_score: 70 }
            }
        });
        
        // Load states dynamically
        await loadStates();
        
        console.log('✅ Sistema de precificação inicializado');
        
    } catch (error) {
        console.error('❌ Erro na inicialização do sistema:', error);
        showAlert('Erro ao inicializar sistema de precificação.', 'danger');
    }
}

/**
 * Setup event listeners for business interface
 */
function setupBusinessEventListeners() {
    // State selection change
    document.getElementById('targetState')?.addEventListener('change', updateSelectedStateSummary);
    
    // Customer type change
    document.getElementById('customerType')?.addEventListener('change', () => {
        if (currentRecommendations) {
            updatePricingRecommendations();
        }
    });
    
    // Market segment change
    const segmentRadios = document.querySelectorAll('input[name="marketSegment"]');
    segmentRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (currentRecommendations) {
                updatePricingRecommendations();
            }
        });
    });
}

/**
 * Load Brazilian states from JSON file - ZERO HARDCODED DATA
 */
async function loadStates() {
    try {
        const response = await fetch('../shared/data/estados-brasil.json');
        if (!response.ok) {
            throw new Error('Erro ao carregar arquivo de estados');
        }
        
        const estadosData = await response.json();
        if (!estadosData.estados) {
            throw new Error('Estrutura de dados de estados inválida');
        }
        
        // Populate target state select with ALL states
        const targetStateSelect = document.getElementById('targetState');
        if (targetStateSelect) {
            targetStateSelect.innerHTML = ''; // Clear loading option
            
            estadosData.estados.forEach(estado => {
                const option = document.createElement('option');
                option.value = estado.codigo;
                option.textContent = `${estado.nome} (${estado.codigo})`;
                targetStateSelect.appendChild(option);
            });
        }
        
        console.log(`✅ ${estadosData.estados.length} estados carregados para precificação`);
        
    } catch (error) {
        console.error('❌ Erro ao carregar estados:', error);
        throw new Error(`Erro ao carregar estados: ${error.message}`);
    }
}

/**
 * INTEGRAÇÃO RIGOROSA: Validar e carregar DI da Fase 1 - NO FALLBACKS
 */
async function checkForLoadedDI() {
    try {
        console.log('🔍 Verificando dados da DI no IndexedDB...');
        
        if (!dbManager) {
            throw new Error('dbManager não disponível - obrigatório para carregar DI');
        }
        
        await dbManager.initialize();
        
        // Tentar recuperar dados OBRIGATÓRIOS do IndexedDB
        const storedDI = await dbManager.getConfig('expertzy_processed_di');
        
        if (!storedDI) {
            console.log('❌ Nenhuma DI encontrada no IndexedDB');
            mostrarErroIntegracao('NENHUMA_DI', 
                'Nenhuma DI processada encontrada',
                'Processe uma DI na Fase 1 (Sistema de Compliance) antes de acessar a precificação.'
            );
            return;
        }
        
        // Dados já vem do IndexedDB como objeto (não precisa JSON.parse)
        const diData = storedDI;
        
        if (!diData || typeof diData !== 'object') {
            console.error('❌ Dados da DI inválidos no IndexedDB');
            mostrarErroIntegracao('DADOS_CORROMPIDOS', 
                'Dados da DI estão corrompidos no armazenamento', 
                'Processe a DI novamente na Fase 1.'
            );
            return;
        }
        
        // Validação RIGOROSA da estrutura da DI - FAIL-FAST
        const erroValidacao = validarEstruturaDICarregada(diData);
        if (erroValidacao) {
            console.error('❌ Estrutura de DI inválida:', erroValidacao);
            mostrarErroIntegracao('ESTRUTURA_INVALIDA', 
                'Estrutura de dados da DI inválida',
                `${erroValidacao}. Reprocesse a DI na Fase 1.`
            );
            return;
        }
        
        // Verificar se Fase 1 foi completada
        if (!diData.integration.phase1_completed) {
            console.log('⚠️ Fase 1 não completada - DI processada mas impostos não calculados');
            mostrarErroIntegracao('FASE1_INCOMPLETA',
                'Cálculo de impostos não finalizado',
                'Complete o cálculo de impostos na Fase 1 antes de prosseguir para precificação.'
            );
            return;
        }
        
        // Tudo válido - carregar DI
        loadedDI = diData;
        console.log(`✅ DI ${diData.di_numero} carregada e validada - ${diData.produtos.length} produtos disponíveis`);
        
        // Mostrar seção de dados da DI
        const noDIAlert = document.getElementById('noDIAlert');
        const diDataSection = document.getElementById('diDataSection');
        
        if (!noDIAlert || !diDataSection) {
            throw new Error('Elementos de interface não encontrados - DOM pode estar corrompido');
        }
        
        noDIAlert.classList.add('hidden');
        diDataSection.classList.remove('hidden');
        
        // Popular informações da DI na interface
        populateDIInfo(loadedDI);
        
    } catch (error) {
        console.error('❌ Erro crítico ao verificar DI:', error);
        mostrarErroIntegracao('ERRO_CRITICO', 
            'Erro crítico na verificação da DI',
            `${error.message}. Reinicie o navegador e tente novamente.`
        );
    }
}

/**
 * Validar estrutura rigorosa da DI carregada - NO FALLBACKS
 * @param {Object} diData - Dados da DI carregados do IndexedDB
 * @returns {String|null} - Erro de validação ou null se válida
 */
function validarEstruturaDICarregada(diData) {
    // Validar metadados de integração
    if (!diData.integration) {
        return 'Metadados de integração ausentes';
    }
    
    if (diData.integration.version !== '2.0') {
        return `Versão de integração incompatível: ${diData.integration.version}`;
    }
    
    // Validar campos básicos obrigatórios
    const camposObrigatorios = ['di_numero', 'produtos', 'taxa_cambio'];
    for (const campo of camposObrigatorios) {
        if (!diData[campo]) {
            return `Campo obrigatório ausente: ${campo}`;
        }
    }
    
    // Validar número da DI
    if (typeof diData.di_numero !== 'string' || diData.di_numero.length === 0) {
        return 'Número da DI deve ser uma string não-vazia';
    }
    
    // Validar taxa de câmbio
    if (typeof diData.taxa_cambio !== 'number' || diData.taxa_cambio <= 0) {
        return 'Taxa de câmbio deve ser um número positivo';
    }
    
    // Validar produtos
    if (!Array.isArray(diData.produtos)) {
        return 'Lista de produtos deve ser um array';
    }
    
    if (diData.produtos.length === 0) {
        return 'DI deve ter pelo menos um produto';
    }
    
    // Validar estrutura dos produtos
    for (let i = 0; i < diData.produtos.length; i++) {
        const produto = diData.produtos[i];
        
        if (!produto.id) {
            return `Produto ${i} sem ID`;
        }
        
        if (!produto.ncm) {
            return `Produto ${i} sem NCM`;
        }
        
        if (!produto.descricao) {
            return `Produto ${i} sem descrição`;
        }
        
        if (typeof produto.valor_unitario_brl !== 'number') {
            return `Produto ${i} sem valor unitário BRL válido`;
        }
    }
    
    // Se Fase 1 completa, validar cálculos
    if (diData.integration.phase1_completed) {
        if (!diData.calculoImpostos) {
            return 'Cálculos de impostos ausentes apesar de Fase 1 marcada como completa';
        }
        
        if (!diData.despesas) {
            return 'Despesas consolidadas ausentes apesar de Fase 1 marcada como completa';
        }
        
        if (!diData.valores_base_finais) {
            return 'Valores base finais ausentes apesar de Fase 1 marcada como completa';
        }
    }
    
    return null; // Tudo válido
}

/**
 * Mostrar erro de integração específico para usuário - NO FALLBACKS
 * @param {String} tipo - Tipo do erro
 * @param {String} titulo - Título do erro  
 * @param {String} descricao - Descrição detalhada
 */
function mostrarErroIntegracao(tipo, titulo, descricao) {
    const noDIAlert = document.getElementById('noDIAlert');
    const diDataSection = document.getElementById('diDataSection');
    
    if (!noDIAlert || !diDataSection) {
        console.error('❌ Elementos de interface não encontrados para mostrar erro');
        return;
    }
    
    // Mostrar alerta de erro
    noDIAlert.classList.remove('hidden');
    diDataSection.classList.add('hidden');
    
    // Personalizar mensagem baseado no tipo de erro
    let linkBotao = '../di-processing/di-processor.html';
    let textoBotao = 'Processar DI';
    
    if (tipo === 'FASE1_INCOMPLETA') {
        linkBotao = '../di-processing/di-processor.html#step2';
        textoBotao = 'Completar Cálculos';
    }
    
    // Atualizar conteúdo do alerta
    noDIAlert.innerHTML = `
        <h6><i class="bi bi-exclamation-triangle"></i> ${titulo}</h6>
        <p class="mb-2">${descricao}</p>
        <p class="mb-0">
            <strong>Para continuar:</strong> 
            <a href="${linkBotao}" class="btn btn-sm btn-business-secondary ms-2">
                <i class="bi bi-file-earmark-text"></i> ${textoBotao}
            </a>
        </p>
    `;
    
    // Mostrar alert adicional
    showAlert(titulo + ': ' + descricao, 'danger');
}

/**
 * Populate DI information display
 */
function populateDIInfo(diData) {
    const infoContainer = document.getElementById('loadedDIInfo');
    if (!infoContainer) return;
    
    const firstAddition = diData.adicoes?.[0] || {};
    const calculation = diData.calculoImpostos || {};
    
    infoContainer.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <p><strong>DI:</strong> ${diData.di_numero || 'N/A'}</p>
                <p><strong>NCM:</strong> ${firstAddition.ncm || 'N/A'}</p>
                <p><strong>Fornecedor:</strong> ${firstAddition.fornecedor?.nome || 'N/A'}</p>
            </div>
            <div class="col-md-6">
                <p><strong>CIF:</strong> R$ ${formatCurrency(validateNumericValue(calculation.valores_base?.valor_aduaneiro_total, 'Valor aduaneiro'))}</p>
                <p><strong>Total Impostos:</strong> R$ ${formatCurrency(validateNumericValue(calculation.totais?.total_impostos, 'Total impostos'))}</p>
                <p><strong>Custo Total:</strong> R$ ${formatCurrency(validateNumericValue(calculation.totais?.custo_total, 'Custo total'))}</p>
            </div>
        </div>
        <div class="alert alert-success mt-2">
            <i class="bi bi-check-circle"></i> DI processada e pronta para análise de precificação
        </div>
    `;
}

/**
 * Start state analysis - main function
 */
async function iniciarAnaliseEstados() {
    if (!loadedDI) {
        showAlert('Nenhuma DI carregada. Processe uma DI primeiro.', 'warning');
        return;
    }
    
    try {
        showLoading('Analisando estados...', 'Comparando cenários fiscais');
        
        // Load DI data into pricing engine
        pricingEngine.loadProcessedDI(loadedDI);
        
        // Generate state scenarios
        currentScenarios = pricingEngine.generateStateScenarios();
        
        // Set scenarios for analysis
        scenarioAnalysis.setScenarios(currentScenarios);
        
        // Populate step 2 with results
        populateStateAnalysis(currentScenarios);
        
        // Create comparison chart
        createStateComparisonChart(currentScenarios);
        
        // Move to step 2
        hideLoading();
        avancarStep(2);
        
        showAlert('Análise de estados concluída!', 'success');
        
    } catch (error) {
        hideLoading();
        console.error('❌ Erro na análise de estados:', error);
        showAlert('Erro na análise: ' + error.message, 'danger');
    }
}

/**
 * Populate state analysis results
 */
function populateStateAnalysis(scenarios) {
    const container = document.getElementById('stateScenarios');
    if (!container) return;
    
    container.innerHTML = '';
    
    scenarios.forEach((scenario, index) => {
        const isRecommended = index === 0; // First is best cost
        
        const scenarioCard = document.createElement('div');
        scenarioCard.className = `col-md-6 mb-3`;
        scenarioCard.innerHTML = `
            <div class="scenario-card ${isRecommended ? 'best' : ''}">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6><i class="bi bi-geo-alt"></i> ${scenario.state_name}</h6>
                    <span class="badge bg-${isRecommended ? 'success' : 'secondary'}">
                        #${index + 1} Menor Custo
                    </span>
                </div>
                
                <div class="row text-center mb-3">
                    <div class="col-4">
                        <div class="metric-card">
                            <div class="metric-value">R$ ${scenario.totals.total_cost.toFixed(0)}</div>
                            <div class="metric-label">Custo Total</div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="metric-card">
                            <div class="metric-value">R$ ${(scenario.benefits.tax_savings || 0).toFixed(0)}</div>
                            <div class="metric-label">Economia Fiscal</div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="metric-card">
                            <div class="metric-value">${scenario.totals.competitiveness_score.toFixed(0)}</div>
                            <div class="metric-label">Score Competitivo</div>
                        </div>
                    </div>
                </div>
                
                ${scenario.benefits.applicable ? `
                    <div class="alert alert-info small">
                        <i class="bi bi-award"></i> <strong>${scenario.benefits.name}</strong><br>
                        ${scenario.benefits.description}
                    </div>
                ` : `
                    <div class="alert alert-secondary small">
                        <i class="bi bi-info-circle"></i> Tributação padrão sem benefícios específicos
                    </div>
                `}
                
                <div class="d-flex justify-content-between small text-muted">
                    <span>ICMS: R$ ${scenario.taxes.icms_effective.toFixed(2)}</span>
                    <span>Total Impostos: R$ ${scenario.taxes.total_taxes.toFixed(2)}</span>
                </div>
            </div>
        `;
        
        container.appendChild(scenarioCard);
    });
    
    // Populate best scenarios summary
    populateBestScenarios(scenarios);
}

/**
 * Populate best scenarios summary
 */
function populateBestScenarios(scenarios) {
    const bestCost = scenarios[0]; // Already sorted by cost
    const bestBenefits = scenarios.reduce((best, current) => 
        (current.benefits.tax_savings || 0) > (best.benefits.tax_savings || 0) ? current : best);
    
    // Best cost scenario
    const bestCostContainer = document.getElementById('bestCostScenario');
    if (bestCostContainer) {
        bestCostContainer.innerHTML = `
            <h6>${bestCost.state_name}</h6>
            <p class="mb-2">Custo Total: <strong>R$ ${bestCost.totals.total_cost.toFixed(2)}</strong></p>
            <p class="text-success mb-0">
                <i class="bi bi-arrow-down"></i>
                Economia potencial vs. pior cenário
            </p>
        `;
    }
    
    // Best benefits scenario
    const bestBenefitsContainer = document.getElementById('bestBenefitsScenario');
    if (bestBenefitsContainer) {
        if (bestBenefits.benefits.applicable) {
            bestBenefitsContainer.innerHTML = `
                <h6>${bestBenefits.state_name}</h6>
                <p class="mb-2">Economia Fiscal: <strong>R$ ${(bestBenefits.benefits.tax_savings || 0).toFixed(2)}</strong></p>
                <p class="text-primary mb-0">
                    <i class="bi bi-award"></i>
                    ${bestBenefits.benefits.name}
                </p>
            `;
        } else {
            bestBenefitsContainer.innerHTML = `
                <div class="text-muted">
                    <i class="bi bi-info-circle"></i>
                    Nenhum benefício fiscal específico identificado para os NCMs analisados
                </div>
            `;
        }
    }
    
    // Set default target state to best cost
    const targetStateSelect = document.getElementById('targetState');
    if (targetStateSelect) {
        targetStateSelect.value = bestCost.state;
    }
}

/**
 * Create state comparison chart
 */
function createStateComparisonChart(scenarios) {
    const canvas = document.getElementById('stateComparisonChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.stateChart) {
        window.stateChart.destroy();
    }
    
    window.stateChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: scenarios.map(s => s.state_name),
            datasets: [
                {
                    label: 'Custo Total',
                    data: scenarios.map(s => s.totals.total_cost),
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Economia Fiscal',
                    data: scenarios.map(s => s.benefits.tax_savings || 0),
                    backgroundColor: 'rgba(40, 167, 69, 0.8)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Comparação de Custos por Estado'
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Valor (R$)'
                    }
                }
            }
        }
    });
}

/**
 * Configure pricing strategies
 */
async function configurarPrecos() {
    const targetState = document.getElementById('targetState')?.value;
    const customerType = document.getElementById('customerType')?.value;
    
    if (!targetState || !currentScenarios) {
        showAlert('Selecione um estado e execute a análise de estados primeiro.', 'warning');
        return;
    }
    
    try {
        showLoading('Configurando preços...', 'Gerando estratégias de precificação');
        
        // Update selected state summary
        updateSelectedStateSummary();
        
        // Move to step 3
        hideLoading();
        avancarStep(3);
        
        showAlert('Pronto para configurar estratégias de preço!', 'success');
        
    } catch (error) {
        hideLoading();
        console.error('❌ Erro na configuração:', error);
        showAlert('Erro: ' + error.message, 'danger');
    }
}

/**
 * Update selected state summary
 */
function updateSelectedStateSummary() {
    const targetState = document.getElementById('targetState')?.value;
    const summaryContainer = document.getElementById('selectedStateSummary');
    
    if (!summaryContainer || !currentScenarios) return;
    
    const selectedScenario = currentScenarios.find(s => s.state === targetState);
    if (!selectedScenario) return;
    
    summaryContainer.innerHTML = `
        <div class="card-body">
            <h6 class="card-title"><i class="bi bi-geo-alt"></i> ${selectedScenario.state_name}</h6>
            <div class="row">
                <div class="col-6">
                    <p><strong>Custo Total:</strong><br>R$ ${selectedScenario.totals.total_cost.toFixed(2)}</p>
                </div>
                <div class="col-6">
                    <p><strong>Economia Fiscal:</strong><br>R$ ${(selectedScenario.benefits.tax_savings || 0).toFixed(2)}</p>
                </div>
            </div>
            ${selectedScenario.benefits.applicable ? `
                <div class="alert alert-info small mb-0">
                    <i class="bi bi-award"></i> ${selectedScenario.benefits.name}
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Generate pricing recommendations
 */
async function gerarRecomendacoes() {
    const targetState = document.getElementById('targetState')?.value;
    const customerType = document.getElementById('customerType')?.value || 'reseller';
    
    if (!targetState || !currentScenarios) {
        showAlert('Configure o estado e tipo de cliente primeiro.', 'warning');
        return;
    }
    
    try {
        showLoading('Gerando recomendações...', 'Calculando estratégias otimizadas');
        
        // Generate pricing recommendations
        currentRecommendations = pricingEngine.generatePricingRecommendations(targetState, customerType);
        
        // Populate pricing recommendations
        populatePricingRecommendations();
        
        // Create margin analysis chart
        createMarginAnalysisChart(currentRecommendations.recommendations);
        
        hideLoading();
        showAlert('Recomendações de preço geradas!', 'success');
        
    } catch (error) {
        hideLoading();
        console.error('❌ Erro ao gerar recomendações:', error);
        showAlert('Erro: ' + error.message, 'danger');
    }
}

/**
 * Populate pricing recommendations
 */
function populatePricingRecommendations() {
    if (!currentRecommendations) return;
    
    const container = document.getElementById('pricingRecommendations');
    if (!container) return;
    
    container.innerHTML = '';
    
    currentRecommendations.recommendations.forEach((rec, index) => {
        const positioningClasses = {
            'competitive': 'competitive-price',
            'standard': 'standard-price', 
            'premium': 'premium-price'
        };
        
        const cardClass = positioningClasses[rec.positioning] || 'standard-price';
        
        const recCard = document.createElement('div');
        recCard.className = 'col-md-4 mb-3';
        recCard.innerHTML = `
            <div class="pricing-card ${cardClass} ${rec.recommended ? 'border-success' : ''}">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6><i class="bi bi-tags"></i> ${rec.positioning_name}</h6>
                    ${rec.recommended ? '<span class="badge bg-success">Recomendado</span>' : ''}
                </div>
                
                <div class="text-center mb-3">
                    <h4 class="text-success">R$ ${rec.sell_price.toFixed(2)}</h4>
                    <p class="text-muted mb-0">Preço de Venda</p>
                </div>
                
                <table class="table table-sm">
                    <tr>
                        <td>Markup:</td>
                        <td class="text-end">${rec.markup_percent.toFixed(1)}%</td>
                    </tr>
                    <tr>
                        <td>Margem Bruta:</td>
                        <td class="text-end">${rec.gross_margin.toFixed(1)}%</td>
                    </tr>
                    <tr>
                        <td>Lucro:</td>
                        <td class="text-end">R$ ${rec.gross_profit.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Score Qualidade:</td>
                        <td class="text-end">${rec.quality_score}/100</td>
                    </tr>
                </table>
                
                <div class="mt-3">
                    <h6 class="small">Preços por Volume:</h6>
                    ${rec.volume_pricing.slice(0, 3).map(tier => `
                        <div class="d-flex justify-content-between small">
                            <span>${tier.tier_name} (${tier.min_quantity}+):</span>
                            <span>R$ ${tier.unit_price.toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        container.appendChild(recCard);
    });
}

/**
 * Create margin analysis chart
 */
function createMarginAnalysisChart(recommendations) {
    const canvas = document.getElementById('marginAnalysisChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.marginChart) {
        window.marginChart.destroy();
    }
    
    window.marginChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: recommendations.map(r => r.positioning_name),
            datasets: [{
                data: recommendations.map(r => r.gross_margin),
                backgroundColor: [
                    'rgba(255, 193, 7, 0.8)',
                    'rgba(40, 167, 69, 0.8)',
                    'rgba(108, 67, 193, 0.8)'
                ],
                borderColor: [
                    'rgba(255, 193, 7, 1)',
                    'rgba(40, 167, 69, 1)',
                    'rgba(108, 67, 193, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Margem Bruta por Posicionamento (%)'
                },
                legend: {
                    display: true,
                    position: 'bottom'
                }
            }
        }
    });
}

/**
 * Generate final reports
 */
async function gerarRelatorios() {
    if (!currentRecommendations || !currentScenarios) {
        showAlert('Execute a análise completa primeiro.', 'warning');
        return;
    }
    
    try {
        showLoading('Preparando relatórios...', 'Finalizando análise estratégica');
        
        // Perform comprehensive analysis
        const comprehensiveAnalysis = scenarioAnalysis.performComprehensiveAnalysis();
        
        // Populate final summary
        populateFinalSummary(comprehensiveAnalysis);
        
        // Move to step 4
        hideLoading();
        avancarStep(4);
        
        showAlert('Relatórios prontos para exportação!', 'success');
        
    } catch (error) {
        hideLoading();
        console.error('❌ Erro ao gerar relatórios:', error);
        showAlert('Erro: ' + error.message, 'danger');
    }
}

/**
 * Populate final summary
 */
function populateFinalSummary(analysis) {
    const container = document.getElementById('finalSummary');
    if (!container) return;
    
    const primaryRec = analysis.strategic_recommendations.primary_recommendation;
    
    container.innerHTML = `
        <h6><i class="bi bi-trophy"></i> Recomendação Principal</h6>
        <div class="alert alert-success small">
            <strong>${primaryRec.title}</strong><br>
            ${primaryRec.description}
        </div>
        
        <h6><i class="bi bi-graph-up"></i> Resumo da Análise</h6>
        <ul class="small">
            <li><strong>Estados analisados:</strong> ${currentScenarios.length}</li>
            <li><strong>Melhor custo:</strong> ${currentScenarios[0].state_name}</li>
            <li><strong>Economia máxima:</strong> R$ ${(Math.max(...currentScenarios.map(s => s.benefits.tax_savings || 0))).toFixed(2)}</li>
            <li><strong>Oportunidades identificadas:</strong> ${analysis.optimization_opportunities.total_opportunities}</li>
        </ul>
    `;
}

/**
 * Navigation functions
 */
function avancarStep(stepNumber) {
    // Hide all steps
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`step${i}`)?.classList.add('hidden');
    }
    
    // Show target step
    document.getElementById(`step${stepNumber}`)?.classList.remove('hidden');
    
    // Update step indicator
    updateStepIndicator(stepNumber);
    
    currentStep = stepNumber;
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function voltarStep(stepNumber) {
    avancarStep(stepNumber);
}

function updateStepIndicator(activeStep) {
    const indicators = document.querySelectorAll('.process-indicator .badge');
    
    indicators.forEach((badge, index) => {
        const stepNum = index + 1;
        
        if (stepNum < activeStep) {
            badge.className = 'badge bg-success me-2';
        } else if (stepNum === activeStep) {
            badge.className = 'badge bg-success me-2';
        } else {
            badge.className = 'badge bg-secondary me-2';
        }
    });
}

/**
 * Export functions
 */
function exportarAnaliseComparativa() {
    showAlert('Funcionalidade de exportação será implementada.', 'info');
}

function exportarEstrategiasPreco() {
    showAlert('Funcionalidade de exportação será implementada.', 'info');
}

function exportarAnaliseMargens() {
    showAlert('Funcionalidade de exportação será implementada.', 'info');
}

function exportarRecomendacoesEstrategicas() {
    showAlert('Funcionalidade de exportação será implementada.', 'info');
}

function novaAnalise() {
    // Reset system
    currentScenarios = null;
    currentRecommendations = null;
    currentStep = 1;
    
    // Clear charts
    if (window.stateChart) {
        window.stateChart.destroy();
        window.stateChart = null;
    }
    
    if (window.marginChart) {
        window.marginChart.destroy();
        window.marginChart = null;
    }
    
    // Go to step 1
    avancarStep(1);
    
    showAlert('Sistema resetado. Inicie uma nova análise.', 'info');
}

/**
 * Utility functions
 */
function showLoading(message, detail) {
    document.getElementById('loadingMessage').textContent = message;
    document.getElementById('loadingDetail').textContent = detail;
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;
    
    const alertId = 'alert_' + Date.now();
    
    const alertElement = document.createElement('div');
    alertElement.id = alertId;
    alertElement.className = `alert alert-${type} alert-dismissible fade show`;
    alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertContainer.appendChild(alertElement);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        const element = document.getElementById(alertId);
        if (element) {
            element.remove();
        }
    }, 5000);
}

// Make functions available globally for button onclick handlers
window.iniciarAnaliseEstados = iniciarAnaliseEstados;
/**
 * Validation helper functions for strict data handling
 */
function validateNumericValue(value, fieldName) {
    if (value === null || value === undefined || isNaN(value)) {
        throw new Error(`${fieldName} não disponível ou inválido - obrigatório para exibição`);
    }
    return value;
}

function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    });
}

// Make functions globally available
window.configurarPrecos = configurarPrecos;
window.gerarRecomendacoes = gerarRecomendacoes;
window.gerarRelatorios = gerarRelatorios;
window.avancarStep = avancarStep;
window.voltarStep = voltarStep;
window.exportarAnaliseComparativa = exportarAnaliseComparativa;
window.exportarEstrategiasPreco = exportarEstrategiasPreco;
window.exportarAnaliseMargens = exportarAnaliseMargens;
window.exportarRecomendacoesEstrategicas = exportarRecomendacoesEstrategicas;
window.novaAnalise = novaAnalise;