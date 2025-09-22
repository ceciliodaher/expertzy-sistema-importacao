/**
 * di-interface.js - Interface Controller for DI Processing
 * 
 * Handles UI interactions for the DI Compliance Processor
 * Coordinates between DIProcessor and ComplianceCalculator
 * Manages workflow steps and user experience
 */

// Global instances
let diProcessor = null;
let complianceCalculator = null;
let validator = null;
let exportManager = null;
let currentDI = null;
let currentStep = 1;
let expenseCounter = 0;
let currencyMasks = [];

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DI Interface: Inicializando sistema...');
    initializeSystem();
    setupEventListeners();
});

/**
 * Initialize system components
 */
async function initializeSystem() {
    try {
        // Initialize processor instances
        diProcessor = new DIProcessor();
        complianceCalculator = new ComplianceCalculator();
        validator = new CalculationValidator();
        exportManager = new ExportManager();
        
        // Load tax configurations
        await complianceCalculator.carregarConfiguracoes();
        
        // Setup expense preview listeners
        setupExpensePreview();
        
        // Make instances globally available for testing
        window.diProcessor = diProcessor;
        window.complianceCalculator = complianceCalculator;
        window.ItemCalculator = ItemCalculator;
        window.exportManager = exportManager;
        
        console.log('✅ Sistema inicializado com sucesso');
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        showAlert('Erro ao inicializar sistema. Recarregue a página.', 'danger');
    }
}

/**
 * Setup event listeners for form inputs
 */
function setupEventListeners() {
    // File input change
    document.getElementById('xmlFile').addEventListener('change', handleFileSelection);
    
    // ===== DRAG & DROP FUNCIONAL (copiado do sistema legado) =====
    setupDragAndDrop();
    
    // Initialize currency masks for predefined expenses
    initializeCurrencyMasks();
    
    // Setup expense table event delegation
    setupExpenseTableEvents();
}

/**
 * Initialize currency masks for expense inputs
 */
function initializeCurrencyMasks() {
    // Apply masks to predefined expense inputs
    document.querySelectorAll('.expense-value').forEach(input => {
        applyCurrencyMask(input);
    });
}

/**
 * Apply currency mask to an input element
 */
function applyCurrencyMask(input) {
    const cleave = new Cleave(input, {
        numeral: true,
        numeralThousandsGroupStyle: 'thousand',
        numeralDecimalMark: ',',
        delimiter: '.',
        numeralDecimalScale: 2,
        numeralPositiveOnly: true,
        onValueChanged: function(e) {
            updateExpensePreview();
        }
    });
    currencyMasks.push(cleave);
    return cleave;
}

/**
 * Setup expense table event delegation
 */
function setupExpenseTableEvents() {
    const table = document.getElementById('expensesTableBody');
    
    if (table) {
        // Delegate events for dynamic rows
        table.addEventListener('change', function(e) {
            if (e.target.classList.contains('expense-icms')) {
                updateExpensePreview();
            }
        });
        
        table.addEventListener('click', function(e) {
            if (e.target.closest('.remove-expense')) {
                removeExpenseRow(e.target.closest('tr'));
            }
        });
    }
}

/**
 * Handle file selection
 */
function handleFileSelection(event) {
    // Reset all states when new file is selected
    const uploadArea = document.querySelector('.upload-area');
    if (uploadArea) {
        uploadArea.classList.remove('success', 'file-loaded');
    }
    
    const file = event.target.files[0];
    if (file && file.type === 'text/xml') {
        console.log(`📁 Arquivo selecionado: ${file.name}`);
        
        // Visual feedback: arquivo XML importado com sucesso
        if (uploadArea) {
            uploadArea.classList.add('file-loaded');
        }
        
        showFileInfo(file);
    } else if (file) {
        showAlert('Por favor, selecione um arquivo XML válido.', 'warning');
        event.target.value = '';
        hideFileInfo();
    }
}

/**
 * Show file information
 */
function showFileInfo(file) {
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = formatFileSize(file.size);
    document.getElementById('fileType').textContent = file.type || 'text/xml';
    document.getElementById('fileInfo').classList.remove('d-none');
}

/**
 * Hide file information
 */
function hideFileInfo() {
    document.getElementById('fileInfo').classList.add('d-none');
}

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Main function to process DI
 */
async function processarDI() {
    const fileInput = document.getElementById('xmlFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showAlert('Por favor, selecione um arquivo XML.', 'warning');
        return;
    }
    
    try {
        showLoading('Processando DI...', 'Extraindo dados fiscais da declaração');
        
        // Read file content
        const xmlContent = await readFileContent(file);
        
        // Armazenar XML original em base64 para salvamento
        currentXMLContent = btoa(unescape(encodeURIComponent(xmlContent)));
        
        // Process DI usando o parser legado funcional
        currentDI = await diProcessor.parseXML(xmlContent);
        
        // Set global variable for ItemCalculator access
        window.currentDI = currentDI;
        
        // Populate step 2 with DI data
        populateStep2Data(currentDI);
        
        // Show all additions (not just first one)
        populateAllAdditions(currentDI);
        
        // Move to step 2
        hideLoading();
        avancarStep(2);
        
        // Mark upload area as successfully processed (transition from file-loaded to success)
        const uploadArea = document.querySelector('.upload-area');
        if (uploadArea) {
            uploadArea.classList.remove('file-loaded');
            uploadArea.classList.add('success');
        }
        
        showAlert('DI processada com sucesso! Configure as despesas extras.', 'success');
        
    } catch (error) {
        hideLoading();
        console.error('❌ Erro no processamento:', error);
        showAlert('Erro ao processar DI: ' + error.message, 'danger');
    }
}

/**
 * Read file content as text
 */
function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve(event.target.result);
        reader.onerror = error => reject(error);
        reader.readAsText(file);
    });
}

/**
 * Populate step 2 with DI data
 */
function populateStep2Data(diData) {
    // Update DI summary (legacy style)
    updateDIInfo(diData);
    
    // Basic DI info
    document.getElementById('diNumber').textContent = diData.numero_di || 'N/A';
    document.getElementById('diDate').textContent = diData.data_registro || 'N/A';
    document.getElementById('diIncoterm').textContent = diData.incoterm_identificado?.codigo || 'N/A';
    
    // First addition data (most DIs have one main addition)
    const firstAddition = diData.adicoes?.[0];
    if (firstAddition) {
        document.getElementById('diCifValue').textContent = formatCurrency(firstAddition.valor_reais || 0);
        document.getElementById('productNCM').textContent = firstAddition.ncm || 'N/A';
        document.getElementById('productDesc').textContent = firstAddition.descricao_ncm || 'N/A';
        document.getElementById('productWeight').textContent = `${formatNumber(firstAddition.peso_liquido || 0)} kg`;
        document.getElementById('supplierName').textContent = firstAddition.fornecedor?.nome || 'N/A';
    }
    
    // Automatic expenses using legacy parser structure
    populateAutomaticExpenses(diData.despesas_aduaneiras);
    
    // Initialize expense preview
    updateExpensePreview();
}

/**
 * Populate all additions (copied from legacy system)
 */
function populateAllAdditions(diData) {
    const container = createAdditionsContainer();
    
    if (!diData.adicoes || diData.adicoes.length === 0) {
        container.innerHTML = '<div class="alert alert-warning">Nenhuma adição encontrada na DI.</div>';
        return;
    }
    
    const tableHtml = `
        <div class="card mb-4">
            <div class="card-header">
                <h6><i class="bi bi-list"></i> Todas as Adições da DI (${diData.adicoes.length})</h6>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>Adição</th>
                                <th>NCM</th>
                                <th>Descrição</th>
                                <th>Peso (kg)</th>
                                <th>Valor (R$)</th>
                                <th>Incoterm</th>
                                <th>Fornecedor</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${diData.adicoes.map(adicao => `
                                <tr>
                                    <td><strong>${adicao.numero_adicao}</strong></td>
                                    <td><code>${adicao.ncm}</code></td>
                                    <td class="text-truncate" style="max-width: 200px;" title="${adicao.descricao_ncm}">${adicao.descricao_ncm}</td>
                                    <td>${formatNumber(adicao.peso_liquido || 0)}</td>
                                    <td>${formatCurrency(adicao.valor_reais || 0)}</td>
                                    <td><span class="badge bg-info">${adicao.condicao_venda_incoterm || 'N/A'}</span></td>
                                    <td class="text-truncate" style="max-width: 150px;" title="${adicao.fornecedor?.nome}">${adicao.fornecedor?.nome || 'N/A'}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary me-1" onclick="viewAdicaoDetails('${adicao.numero_adicao}')" title="Ver detalhes">
                                            <i class="bi bi-eye"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-success" onclick="viewCalculationMemory('${adicao.numero_adicao}')" title="Memória de cálculo">
                                            <i class="bi bi-calculator"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="mt-3">
                    <div class="row mb-3">
                        <div class="col-md-4">
                            <div class="card text-center">
                                <div class="card-body">
                                    <h5 class="card-title text-primary">${formatCurrency(diData.totais?.valor_total_fob_brl || 0)}</h5>
                                    <p class="card-text small">Valor Total FOB</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card text-center">
                                <div class="card-body">
                                    <h5 class="card-title text-success">${formatNumber(diData.totais?.peso_liquido_total || 0)} kg</h5>
                                    <p class="card-text small">Peso Total</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card text-center">
                                <div class="card-body">
                                    <h5 class="card-title text-info">${diData.adicoes.length}</h5>
                                    <p class="card-text small">Total de Adições</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="text-center">
                        <button class="btn btn-success" onclick="viewMultiAdditionSummary()" title="Visão consolidada de todas as adições">
                            <i class="bi bi-collection"></i> Ver Resumo Completo (${diData.adicoes.length} Adições)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = tableHtml;
}

/**
 * Create additions container if it doesn't exist
 */
function createAdditionsContainer() {
    let container = document.getElementById('allAdditionsContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'allAdditionsContainer';
        container.className = 'all-additions mb-4';
        
        // Insert after the DI summary in step2
        const diSummary = document.getElementById('diSummary');
        if (diSummary && diSummary.parentNode) {
            diSummary.parentNode.insertBefore(container, diSummary.nextSibling);
        } else {
            const step2 = document.getElementById('step2');
            if (step2) {
                step2.appendChild(container);
            }
        }
    }
    return container;
}

/**
 * View addition details (copied from legacy system)
 */
function viewAdicaoDetails(numeroAdicao) {
    if (!currentDI || !currentDI.adicoes) {
        showAlert('Nenhuma DI carregada.', 'warning');
        return;
    }
    
    const adicao = currentDI.adicoes.find(add => add.numero_adicao === numeroAdicao);
    if (!adicao) {
        showAlert('Adição não encontrada.', 'warning');
        return;
    }
    
    // Create modal for addition details
    const modalContent = `
        <div class="modal fade" id="adicaoModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-box"></i> Detalhes da Adição ${numeroAdicao}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <h6>Classificação Fiscal</h6>
                                <p><strong>NCM:</strong> ${adicao.ncm}</p>
                                <p><strong>Descrição:</strong> ${adicao.descricao_ncm}</p>
                            </div>
                            <div class="col-md-6">
                                <h6>Valores Comerciais</h6>
                                <p><strong>Valor USD:</strong> ${formatCurrencyWithCode(adicao.valor_moeda_negociacao || 0, adicao.moeda_negociacao_codigo)}</p>
                                <p><strong>Valor BRL:</strong> ${formatCurrency(adicao.valor_reais || 0)}</p>
                                <p><strong>Peso Líquido:</strong> ${formatNumber(adicao.peso_liquido || 0)} kg</p>
                            </div>
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <h6>Fornecedor</h6>
                                <p><strong>Nome:</strong> ${adicao.fornecedor?.nome || 'N/A'}</p>
                                <p><strong>Endereço:</strong> ${adicao.fornecedor?.endereco_completo || 'N/A'}</p>
                            </div>
                            <div class="col-md-6">
                                <h6>Tributos Federais</h6>
                                <p><strong>II:</strong> ${adicao.tributos?.ii_aliquota || 0}% - ${formatCurrency(adicao.tributos?.ii_valor_devido || 0)}</p>
                                <p><strong>IPI:</strong> ${adicao.tributos?.ipi_aliquota || 0}% - ${formatCurrency(adicao.tributos?.ipi_valor_devido || 0)}</p>
                                <p><strong>PIS:</strong> ${adicao.tributos?.pis_aliquota_ad_valorem || 0}% - ${formatCurrency(adicao.tributos?.pis_valor_devido || 0)}</p>
                                <p><strong>COFINS:</strong> ${adicao.tributos?.cofins_aliquota_ad_valorem || 0}% - ${formatCurrency(adicao.tributos?.cofins_valor_devido || 0)}</p>
                            </div>
                        </div>
                        
                        ${adicao.produtos ? `
                        <div class="mt-3">
                            <h6>Produtos desta Adição</h6>
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th>Descrição</th>
                                            <th>Quantidade</th>
                                            <th>Valor Unit.</th>
                                            <th>Valor Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${adicao.produtos.map(produto => `
                                            <tr>
                                                <td>${produto.numero_sequencial_item || '-'}</td>
                                                <td>${produto.descricao_mercadoria || '-'}</td>
                                                <td>${formatNumber(produto.quantidade || 0)} ${produto.unidade_medida || ''}</td>
                                                <td>${formatUSD(produto.valor_unitario || 0)}</td>
                                                <td>${formatUSD(produto.valor_total_item || 0)}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove modal if exists
    const existingModal = document.getElementById('adicaoModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    // Show modal (Bootstrap 5)
    const modal = new bootstrap.Modal(document.getElementById('adicaoModal'));
    modal.show();
}

/**
 * Populate automatic expenses display
 */
function populateAutomaticExpenses(despesasAuto) {
    const container = document.getElementById('automaticExpenses');
    container.innerHTML = '';
    
    if (!despesasAuto) return;
    
    const calculadas = despesasAuto.calculadas || {};
    const expenses = [
        { key: 'siscomex', label: 'SISCOMEX', icon: 'file-text', value: calculadas.siscomex || 0 },
        { key: 'afrmm', label: 'AFRMM', icon: 'ship', value: calculadas.afrmm || 0 },
        { key: 'capatazia', label: 'Capatazia/Armazenagem', icon: 'box', value: calculadas.capatazia || 0 }
    ];
    
    expenses.forEach(expense => {
        if (expense.value > 0) {
            const expenseCard = document.createElement('div');
            expenseCard.className = 'col-md-4 mb-3';
            expenseCard.innerHTML = `
                <div class="expense-card auto-expense">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-${expense.icon} me-2 text-success"></i>
                        <div>
                            <strong>${expense.label}</strong><br>
                            <span class="text-success">${formatCurrency(expense.value)}</span>
                            <br><small class="text-muted">Incluso na base ICMS</small>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(expenseCard);
        }
    });
    
    // Total automatic expenses
    const totalCard = document.createElement('div');
    totalCard.className = 'col-12';
    totalCard.innerHTML = `
        <div class="alert alert-info">
            <strong><i class="bi bi-calculator"></i> Total Despesas Automáticas: ${formatCurrency(despesasAuto.total || 0)}</strong>
            <br><small>Estas despesas são obrigatórias e sempre compõem a base de cálculo do ICMS</small>
        </div>
    `;
    container.appendChild(totalCard);
}

/**
 * Setup expense preview functionality
 */
function setupExpensePreview() {
    // This will be called after initialization
}

/**
 * Add new expense row to the table
 */
function addExpenseRow() {
    expenseCounter++;
    const tbody = document.getElementById('expensesTableBody');
    const newRow = document.createElement('tr');
    newRow.dataset.expenseId = `custom_${expenseCounter}`;
    newRow.dataset.predefined = 'false';
    
    newRow.innerHTML = `
        <td><i class="bi bi-currency-dollar text-warning"></i></td>
        <td>
            <input type="text" class="form-control form-control-sm expense-name" 
                   placeholder="Nome da despesa" value="">
        </td>
        <td>
            <div class="input-group input-group-sm">
                <span class="input-group-text">R$</span>
                <input type="text" class="form-control expense-value" 
                       data-expense="custom_${expenseCounter}" placeholder="0,00">
            </div>
        </td>
        <td class="text-center">
            <div class="form-check d-flex justify-content-center">
                <input class="form-check-input expense-icms" type="checkbox" 
                       data-expense="custom_${expenseCounter}">
            </div>
        </td>
        <td class="text-center">
            <button class="btn btn-sm btn-outline-danger remove-expense" 
                    title="Remover despesa">
                <i class="bi bi-trash"></i>
            </button>
        </td>
    `;
    
    tbody.appendChild(newRow);
    
    // Apply currency mask to the new input
    const valueInput = newRow.querySelector('.expense-value');
    applyCurrencyMask(valueInput);
    
    // Focus on the name input
    newRow.querySelector('.expense-name').focus();
}

/**
 * Remove expense row from the table
 */
function removeExpenseRow(row) {
    if (row && row.dataset.predefined === 'false') {
        row.remove();
        updateExpensePreview();
    }
}

/**
 * Get all expenses from the table
 */
function getAllExpenses() {
    const expenses = [];
    
    document.querySelectorAll('#expensesTableBody tr').forEach(row => {
        const valueInput = row.querySelector('.expense-value');
        const icmsInput = row.querySelector('.expense-icms');
        const nameInput = row.querySelector('.expense-name') || row.querySelector('input[readonly]');
        
        if (valueInput) {
            const value = parseFloat(valueInput.value.replace(/\./g, '').replace(',', '.')) || 0;
            
            if (value > 0) {
                expenses.push({
                    id: row.dataset.expenseId,
                    name: nameInput ? nameInput.value : 'Despesa',
                    value: value,
                    includeInICMS: icmsInput ? icmsInput.checked : false,
                    isPredefined: row.dataset.predefined === 'true'
                });
            }
        }
    });
    
    return expenses;
}

/**
 * Update expense preview in real time
 */
function updateExpensePreview() {
    if (!currentDI) return;
    
    // Get all expenses from the table
    const expenses = getAllExpenses();
    
    // Calculate totals
    const totalExtra = expenses.reduce((sum, exp) => sum + exp.value, 0);
    const totalExtraICMS = expenses
        .filter(exp => exp.includeInICMS)
        .reduce((sum, exp) => sum + exp.value, 0);
    
    // Calculate ICMS impact using parser legado structure
    if (!currentDI.despesas_aduaneiras || !currentDI.despesas_aduaneiras.total_despesas_aduaneiras) {
        console.error('❌ Despesas aduaneiras não encontradas na DI');
        return;
    }
    const automaticExpenses = currentDI.despesas_aduaneiras.total_despesas_aduaneiras;
    const baseICMSBefore = automaticExpenses;
    const baseICMSAfter = automaticExpenses + totalExtraICMS;
    // Get ICMS rate for the state from DI (no fallback - fail fast)
    const estado = currentDI?.importador?.endereco_uf;
    if (!estado) {
        throw new Error('Estado do importador não encontrado na DI - obrigatório para cálculo ICMS');
    }
    
    const aliquotaICMSPercent = complianceCalculator.obterAliquotaICMS(estado); // Returns percentage (19.00)
    const aliquotaICMSDecimal = aliquotaICMSPercent / 100; // Convert to decimal (0.19)
    const icmsDifference = (baseICMSAfter - baseICMSBefore) * aliquotaICMSDecimal / (1 - aliquotaICMSDecimal);
    
    // Update preview
    document.getElementById('previewTotalExtra').textContent = formatCurrency(totalExtra);
    const icmsExpensesEl = document.getElementById('previewICMSExpenses');
    if (icmsExpensesEl) {
        icmsExpensesEl.textContent = formatCurrency(totalExtraICMS);
    }
    document.getElementById('previewICMSBefore').textContent = formatCurrency(baseICMSBefore);
    document.getElementById('previewICMSAfter').textContent = formatCurrency(baseICMSAfter);
    document.getElementById('previewICMSDiff').textContent = formatCurrency(icmsDifference);
    
    // Update total in table footer
    const totalEl = document.getElementById('totalExtraExpenses');
    if (totalEl) {
        totalEl.textContent = formatCurrency(totalExtra);
    }
}

/**
 * Calculate taxes based on current configuration
 */
async function calcularImpostos() {
    if (!currentDI) {
        showAlert('Nenhuma DI carregada.', 'warning');
        return;
    }
    
    try {
        showLoading('Calculando impostos...', 'Aplicando legislação fiscal brasileira');
        
        // Get all expenses from the table
        const expenses = getAllExpenses();
        
        // Build extra expenses object for legacy compatibility
        const extraExpenses = {
            armazenagem: 0,
            transporte_interno: 0,
            despachante: 0,
            armazenagem_icms: false,
            transporte_interno_icms: false,
            despachante_icms: false,
            outras_despesas: []
        };
        
        // Process expenses
        expenses.forEach(exp => {
            if (exp.id === 'storage') {
                extraExpenses.armazenagem = exp.value;
                extraExpenses.armazenagem_icms = exp.includeInICMS;
            } else if (exp.id === 'transport') {
                extraExpenses.transporte_interno = exp.value;
                extraExpenses.transporte_interno_icms = exp.includeInICMS;
            } else if (exp.id === 'agent') {
                extraExpenses.despachante = exp.value;
                extraExpenses.despachante_icms = exp.includeInICMS;
            } else {
                // Custom expenses
                extraExpenses.outras_despesas.push({
                    descricao: exp.name,
                    valor: exp.value,
                    base_icms: exp.includeInICMS
                });
            }
        });
        
        // Get consolidated expenses using legacy method
        const despesasConsolidadas = diProcessor.consolidarDespesasCompletas(extraExpenses);
        
        // Add custom expenses to consolidated total if needed
        if (extraExpenses.outras_despesas.length > 0) {
            const totalOutras = extraExpenses.outras_despesas.reduce((sum, d) => sum + d.valor, 0);
            const totalOutrasICMS = extraExpenses.outras_despesas
                .filter(d => d.base_icms)
                .reduce((sum, d) => sum + d.valor, 0);
            
            despesasConsolidadas.total += totalOutras;
            despesasConsolidadas.total_base_icms += totalOutrasICMS;
        }
        
        // Obter estado do importador da DI
        const estadoImportador = currentDI.importador?.endereco_uf;
        if (!estadoImportador) {
            throw new Error('Estado do importador não encontrado na DI - campo obrigatório para cálculos fiscais');
        }
        complianceCalculator.setEstadoDestino(estadoImportador);
        
        // Use the modular method to calculate taxes for ALL additions
        const taxCalculation = await complianceCalculator.calcularTodasAdicoes(currentDI, despesasConsolidadas);
        
        // Store calculation results with individual products
        currentDI.calculoImpostos = taxCalculation;
        currentDI.despesasExtras = expenses; // Store for export
        
        // Make calculation available globally for export modules
        window.currentCalculation = taxCalculation;
        
        // Populate step 3 with results
        populateStep3Results(taxCalculation);
        
        // Move to step 3
        hideLoading();
        avancarStep(3);
        
        showAlert('Impostos calculados com sucesso!', 'success');
        
    } catch (error) {
        hideLoading();
        console.error('❌ Erro no cálculo:', error);
        showAlert('Erro ao calcular impostos: ' + error.message, 'danger');
    }
}

/**
 * Populate step 3 with tax calculation results
 */
function populateStep3Results(calculation) {
    // Debug: Log actual calculation structure
    console.log('🔍 DEBUG populateStep3Results - Estrutura recebida:', calculation);
    console.log('🔍 DEBUG valores_base:', calculation.valores_base);
    console.log('🔍 DEBUG despesas:', calculation.despesas);
    console.log('🔍 DEBUG impostos.icms:', calculation.impostos?.icms);
    
    // Tax summary cards
    const resultsContainer = document.getElementById('taxResults');
    resultsContainer.innerHTML = `
        <div class="col-md-3 mb-3">
            <div class="card text-center">
                <div class="card-body">
                    <h6 class="card-title">II</h6>
                    <h4 class="text-primary">${formatCurrency(calculation.impostos.ii.valor_devido)}</h4>
                    <small class="text-muted">${calculation.impostos.ii.aliquota}%</small>
                </div>
            </div>
        </div>
        <div class="col-md-3 mb-3">
            <div class="card text-center">
                <div class="card-body">
                    <h6 class="card-title">IPI</h6>
                    <h4 class="text-primary">${formatCurrency(calculation.impostos.ipi.valor_devido)}</h4>
                    <small class="text-muted">${calculation.impostos.ipi.aliquota}%</small>
                </div>
            </div>
        </div>
        <div class="col-md-3 mb-3">
            <div class="card text-center">
                <div class="card-body">
                    <h6 class="card-title">PIS/COFINS</h6>
                    <h4 class="text-primary">${formatCurrency(calculation.impostos.pis.valor_devido + calculation.impostos.cofins.valor_devido)}</h4>
                    <small class="text-muted">11.75%</small>
                </div>
            </div>
        </div>
        <div class="col-md-3 mb-3">
            <div class="card text-center border-primary">
                <div class="card-body">
                    <h6 class="card-title">ICMS</h6>
                    <h4 class="text-primary">${formatCurrency(calculation.impostos.icms.valor_devido)}</h4>
                    <small class="text-muted">${calculation.impostos.icms.aliquota}%</small>
                </div>
            </div>
        </div>
        <div class="col-12">
            <div class="alert alert-primary text-center">
                <h4><strong>Total Impostos: ${formatCurrency(calculation.totais.total_impostos)}</strong></h4>
                <p class="mb-0">Custo Total da Importação: <strong>${formatCurrency(calculation.totais.custo_total)}</strong></p>
            </div>
        </div>
    `;
    
    // Detailed breakdown
    const detailsContainer = document.getElementById('taxDetails');
    detailsContainer.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6><i class="bi bi-receipt"></i> Base de Cálculo ICMS</h6>
                <table class="table table-sm">
                    <tr>
                        <td>CIF (R$)</td>
                        <td class="text-end">${formatCurrency(calculation.valores_base.valor_aduaneiro_total)}</td>
                    </tr>
                    <tr>
                        <td>II</td>
                        <td class="text-end">${formatCurrency(calculation.impostos.ii.valor_devido)}</td>
                    </tr>
                    <tr>
                        <td>IPI</td>
                        <td class="text-end">${formatCurrency(calculation.impostos.ipi.valor_devido)}</td>
                    </tr>
                    <tr>
                        <td>PIS</td>
                        <td class="text-end">${formatCurrency(calculation.impostos.pis.valor_devido)}</td>
                    </tr>
                    <tr>
                        <td>COFINS</td>
                        <td class="text-end">${formatCurrency(calculation.impostos.cofins.valor_devido)}</td>
                    </tr>
                    <tr class="table-primary">
                        <td><strong>Despesas Aduaneiras</strong></td>
                        <td class="text-end"><strong>${formatCurrency(calculation.despesas?.totais?.tributavel_icms)}</strong></td>
                    </tr>
                    <tr class="table-info">
                        <td><strong>Base ICMS Final</strong></td>
                        <td class="text-end"><strong>${formatCurrency(
                            calculation.valores_base.valor_aduaneiro_total + 
                            calculation.impostos.ii.valor_devido + 
                            calculation.impostos.ipi.valor_devido + 
                            calculation.impostos.pis.valor_devido + 
                            calculation.impostos.cofins.valor_devido + 
                            calculation.despesas?.totais?.tributavel_icms
                        )}</strong></td>
                    </tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6><i class="bi bi-info-circle"></i> Informações Adicionais</h6>
                <ul class="list-unstyled">
                    <li><strong>Estado:</strong> ${calculation.estado}</li>
                    <li><strong>NCM:</strong> ${calculation.ncm}</li>
                    <li><strong>Peso:</strong> ${calculation.valores_base.peso_liquido.toFixed(2)} kg</li>
                    <li><strong>Taxa Câmbio:</strong> ${calculation.valores_base.taxa_cambio.toFixed(4)}</li>
                    <li><strong>Custo por kg:</strong> ${formatCurrency(calculation.totais.custo_por_kg)}</li>
                </ul>
                
                ${calculation.despesas.extras_tributaveis > 0 ? `
                    <div class="alert alert-info small">
                        <i class="bi bi-exclamation-circle"></i>
                        <strong>Despesas Extras Incluídas:</strong><br>
                        ${formatCurrency(calculation.despesas.extras_tributaveis)} adicionados à base ICMS
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Navigation functions
 */
function avancarStep(stepNumber) {
    // Hide all steps
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`step${i}`).classList.add('hidden');
    }
    
    // Show target step
    const targetStep = document.getElementById(`step${stepNumber}`);
    targetStep.classList.remove('hidden');
    
    // Update step indicator
    updateStepIndicator(stepNumber);
    
    currentStep = stepNumber;
    
    // Smooth scroll to step instead of forcing to top
    targetStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            badge.className = 'badge bg-primary me-2';
        } else {
            badge.className = 'badge bg-secondary me-2';
        }
    });
}

/**
 * Export functions
 */
async function exportarPlanilhaCustos() {
    if (!currentDI) {
        showAlert('Nenhuma DI carregada para exportar.', 'warning');
        return;
    }
    
    if (!currentCalculation) {
        showAlert('Execute o cálculo de impostos antes de exportar.', 'warning');
        return;
    }
    
    try {
        const result = await exportManager.export('excel', currentDI, currentCalculation);
        showAlert(`Planilha exportada: ${result.filename}`, 'success');
    } catch (error) {
        console.error('Erro na exportação:', error);
        showAlert('Erro ao exportar planilha: ' + error.message, 'danger');
    }
}

function exportarRelatórioImpostos() {
    if (!currentDI?.calculoImpostos) {
        showAlert('Calcule os impostos antes de exportar o relatório.', 'warning');
        return;
    }
    
    try {
        // Create a detailed tax report
        const report = createTaxReport(currentDI, currentDI.calculoImpostos);
        exportAsJSON('relatorio_impostos_' + currentDI.numero_di, report);
        showAlert('Relatório de impostos exportado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro na exportação:', error);
        showAlert('Erro ao exportar relatório: ' + error.message, 'danger');
    }
}

function exportarCroquiNF() {
    if (!currentDI) {
        showAlert('Nenhuma DI carregada para gerar croqui.', 'warning');
        return;
    }
    
    if (!window.currentCalculation) {
        showAlert('Nenhum cálculo disponível. Execute o cálculo de impostos primeiro.', 'warning');
        return;
    }
    
    try {
        // Call the legacy croqui function if available
        if (typeof gerarCroquiPDFNovo === 'function') {
            gerarCroquiPDFNovo(currentDI);
            showAlert('Croqui NF gerado com sucesso!', 'success');
        } else {
            showAlert('Função de geração de croqui não disponível.', 'warning');
        }
    } catch (error) {
        console.error('Erro na geração do croqui:', error);
        showAlert('Erro ao gerar croqui: ' + error.message, 'danger');
    }
}

function exportarMemoriaCalculo() {
    if (!currentDI) {
        showAlert('Nenhuma DI carregada.', 'warning');
        return;
    }
    
    try {
        // Get calculation memory from the calculator
        const memory = complianceCalculator?.getHistoricoCalculos() || [];
        const memoryData = {
            di_numero: currentDI.numero_di,
            timestamp: new Date().toISOString(),
            calculationMemory: memory,
            summary: {
                total_calculations: memory.length,
                last_calculation: complianceCalculator?.getUltimoCalculo()
            }
        };
        
        exportAsJSON('memoria_calculo_' + currentDI.numero_di, memoryData);
        showAlert('Memória de cálculo exportada com sucesso!', 'success');
    } catch (error) {
        console.error('Erro na exportação:', error);
        showAlert('Erro ao exportar memória de cálculo: ' + error.message, 'danger');
    }
}

/**
 * Export data as JSON file
 */
function exportAsJSON(filename, data) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename + '.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Create detailed tax report
 */
function createTaxReport(diData, calculations) {
    return {
        di_info: {
            numero: diData.numero_di,
            data: diData.data_registro,
            incoterm: diData.incoterm_identificado?.codigo
        },
        calculations: calculations,
        totals: {
            total_taxes: calculations?.totais?.total_impostos || 0,
            total_cost: calculations?.totais?.custo_total || 0
        },
        additions_summary: diData.adicoes?.map(adicao => ({
            numero: adicao.numero_adicao,
            ncm: adicao.ncm,
            value: adicao.valor_reais,
            weight: adicao.peso_liquido,
            taxes: {
                ii: adicao.tributos?.ii_valor_devido || 0,
                ipi: adicao.tributos?.ipi_valor_devido || 0,
                pis: adicao.tributos?.pis_valor_devido || 0,
                cofins: adicao.tributos?.cofins_valor_devido || 0
            }
        })) || [],
        generated_at: new Date().toISOString()
    };
}

function confirmarProcessarNovaDI() {
    // Se não há DI carregada, apenas processa nova
    if (!currentDI) {
        processarNovaDI();
        return;
    }
    
    // Mostrar modal de confirmação
    const modal = new bootstrap.Modal(document.getElementById('modalConfirmarNovaDI'));
    modal.show();
}

function salvarEProcessarNovaDI() {
    // Salvar dados antes de processar nova DI
    salvarDadosDI(false); // false = não mostrar modal de sucesso
    
    // Fechar modal de confirmação
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalConfirmarNovaDI'));
    modal.hide();
    
    // Processar nova DI
    processarNovaDI();
}

function processarNovaDISemSalvar() {
    // Fechar modal de confirmação
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalConfirmarNovaDI'));
    modal.hide();
    
    // Processar nova DI sem salvar
    processarNovaDI();
}

function processarNovaDI() {
    // Reset system
    currentDI = null;
    currentCalculation = null;
    currentStep = 1;
    
    // Limpar cache mantendo snapshots
    if (window.storageManager) {
        window.storageManager.clearCacheKeepSnapshots();
    }
    
    // Clear file input
    const xmlFileInput = document.getElementById('xmlFile');
    if (xmlFileInput) {
        xmlFileInput.value = '';
    }
    
    // Clear file info
    hideFileInfo();
    
    // Clear display areas
    const adicoesDisplay = document.getElementById('adicoes-display');
    if (adicoesDisplay) {
        adicoesDisplay.innerHTML = '';
    }
    
    const diInfoDisplay = document.getElementById('diInfoDisplay');
    if (diInfoDisplay) {
        diInfoDisplay.innerHTML = '';
    }
    
    const resultadosDisplay = document.getElementById('resultados-display');
    if (resultadosDisplay) {
        resultadosDisplay.innerHTML = '';
    }
    
    // Go to step 1
    avancarStep(1);
    
    showAlert('Sistema reiniciado. Pronto para processar nova DI.', 'info');
}

// ========== FUNÇÕES DE SALVAMENTO E RECUPERAÇÃO DE DADOS ==========

// Variável global para armazenar conteúdo XML original
let currentXMLContent = null;

/**
 * Salvar dados completos em arquivo JSON
 */
function salvarDadosEmArquivo() {
    if (!currentDI) {
        showAlert('Nenhuma DI carregada para salvar.', 'warning');
        return;
    }
    
    try {
        // Preparar dados completos para salvamento
        const dadosCompletos = {
            version: "2025.1",
            type: "expertzy_di_compliance",
            timestamp: new Date().toISOString(),
            di_data: currentDI,
            calculation_results: currentCalculation,
            xml_content: currentXMLContent, // XML original em base64
            metadata: {
                processed_by: "DI Compliance Processor v2025.1",
                ready_for_pricing: true,
                numero_di: currentDI.numero_di,
                valor_total_fob_brl: currentDI.totais?.valor_total_fob_brl || 0,
                total_adicoes: currentDI.total_adicoes || 0,
                estado_importador: currentDI.importador?.endereco_uf || 'N/A',
                data_processamento: new Date().toLocaleString('pt-BR')
            }
        };
        
        // Criar arquivo JSON para download
        const jsonStr = JSON.stringify(dadosCompletos, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `DI_${currentDI.numero_di}_${Date.now()}.expertzy.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showAlert(`✅ Arquivo salvo: DI_${currentDI.numero_di}.expertzy.json`, 'success');
        
    } catch (error) {
        console.error('Erro ao salvar arquivo:', error);
        showAlert('❌ Erro ao salvar arquivo. Verifique o console para detalhes.', 'danger');
    }
}

/**
 * Carregar arquivo salvo do computador
 */
function carregarArquivoSalvo(input) {
    const file = input.files[0];
    if (!file) {
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const dadosCarregados = JSON.parse(e.target.result);
            
            // Validar arquivo
            if (dadosCarregados.type !== 'expertzy_di_compliance') {
                throw new Error('Arquivo não é do tipo Expertzy DI Compliance');
            }
            
            if (!dadosCarregados.di_data || !dadosCarregados.di_data.numero_di) {
                throw new Error('Dados da DI inválidos no arquivo');
            }
            
            // Restaurar dados globais
            currentDI = dadosCarregados.di_data;
            currentCalculation = dadosCarregados.calculation_results;
            currentXMLContent = dadosCarregados.xml_content;
            
            console.log('✅ Dados carregados:', {
                di: currentDI.numero_di,
                calculation: currentCalculation ? 'Presente' : 'Ausente',
                xml: currentXMLContent ? 'Presente' : 'Ausente'
            });
            
            // Atualizar interface - ir direto para Step 3 se tiver cálculos
            if (currentCalculation) {
                currentStep = 3;
                avancarStep(3);
                
                // Atualizar displays
                updateDIInfo();
                mostrarResultadosCalculo();
                
                showAlert(`✅ Trabalho carregado: DI ${currentDI.numero_di} - Pronto para continuar!`, 'success');
            } else {
                // Se não tiver cálculos, ir para Step 2
                currentStep = 2;
                avancarStep(2);
                
                updateDIInfo();
                showAlert(`✅ DI ${currentDI.numero_di} carregada - Continue o processamento.`, 'info');
            }
            
        } catch (error) {
            console.error('Erro ao carregar arquivo:', error);
            showAlert(`❌ Erro ao carregar arquivo: ${error.message}`, 'danger');
        }
    };
    
    reader.readAsText(file);
}

/**
 * Mostrar resultados dos cálculos na interface
 */
function mostrarResultadosCalculo() {
    if (!currentCalculation) {
        console.log('Nenhum cálculo disponível para exibir');
        return;
    }
    
    try {
        // Encontrar container de resultados
        const resultadosContainer = document.getElementById('resultados-display');
        if (!resultadosContainer) {
            console.log('Container de resultados não encontrado');
            return;
        }
        
        // Se já tem resultados exibidos, não duplicar
        if (resultadosContainer.innerHTML && resultadosContainer.innerHTML.trim() !== '') {
            console.log('Resultados já exibidos');
            return;
        }
        
        // Exibir resumo dos cálculos
        resultadosContainer.innerHTML = `
            <div class="results-summary">
                <h4><i class="bi bi-calculator"></i> Resultados dos Cálculos</h4>
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h6>Impostos Federais</h6>
                                <p><strong>II:</strong> ${formatCurrency(currentCalculation.impostos?.ii || 0)}</p>
                                <p><strong>IPI:</strong> ${formatCurrency(currentCalculation.impostos?.ipi || 0)}</p>
                                <p><strong>PIS:</strong> ${formatCurrency(currentCalculation.impostos?.pis || 0)}</p>
                                <p><strong>COFINS:</strong> ${formatCurrency(currentCalculation.impostos?.cofins || 0)}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-body">
                                <h6>ICMS e Totais</h6>
                                <p><strong>ICMS:</strong> ${formatCurrency(currentCalculation.impostos?.icms || 0)}</p>
                                <p><strong>Total Impostos:</strong> ${formatCurrency(currentCalculation.totais?.total_impostos || 0)}</p>
                                <p><strong>Custo Total:</strong> ${formatCurrency(currentCalculation.totais?.custo_total || 0)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        console.log('✅ Resultados dos cálculos exibidos com sucesso');
        
    } catch (error) {
        console.error('Erro ao exibir resultados:', error);
        showAlert('⚠️ Erro ao exibir resultados dos cálculos.', 'warning');
    }
}

/**
 * Preparar dados para fase de precificação
 */
function prepararParaPrecificacao() {
    if (!currentDI || !currentCalculation) {
        showAlert('Complete o processamento da DI antes de prosseguir para precificação.', 'warning');
        return;
    }
    
    try {
        // Preparar dados para próxima fase
        const dadosParaPrecificacao = {
            di_data: currentDI,
            calculation_results: currentCalculation,
            xml_content: currentXMLContent,
            compliance_completed: true,
            timestamp: new Date().toISOString()
        };
        
        // Passar dados via sessionStorage para próxima fase
        sessionStorage.setItem('di_compliance_data', JSON.stringify(dadosParaPrecificacao));
        
        // Salvar automaticamente antes de prosseguir
        salvarDadosEmArquivo();
        
        // Aguardar um pouco para o download e então redirecionar
        setTimeout(() => {
            if (confirm('Dados salvos! Deseja prosseguir para a fase de precificação?')) {
                window.location.href = '../pricing-strategy/pricing-system.html';
            }
        }, 1000);
        
    } catch (error) {
        console.error('Erro ao preparar para precificação:', error);
        showAlert('❌ Erro ao preparar dados para precificação.', 'danger');
    }
}

/**
 * Format currency values (Brazilian format)
 */
function formatCurrency(valor) {
    if (valor === null || valor === undefined || isNaN(valor)) {
        return 'R$ 0,00';
    }
    
    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Format USD currency values
 */
function formatUSD(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value || 0);
}

/**
 * Format currency with specific currency code
 */
function formatCurrencyWithCode(value, currencyCode) {
    // Currency code will be resolved from ConfigLoader when needed
    // For now, just show the code with value
    if (!currencyCode) {
        return formatNumber(value, 2);
    }
    
    // Special handling for known formats
    if (currencyCode === '220' || currencyCode === 'USD') {
        return formatUSD(value);
    }
    
    // For other currencies, show with code
    return `${currencyCode} ${formatNumber(value, 2)}`;
}

/**
 * Get currency label from currency code
 */
function getCurrencyLabel(currencyCode) {
    // Return code as-is, will be resolved from ConfigLoader when system loads
    return currencyCode || 'N/A';
}

/**
 * Format number (Brazilian format)
 */
function formatNumber(valor, decimals = 2) {
    if (valor === null || valor === undefined || isNaN(valor)) {
        return '0';
    }
    
    return valor.toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * Update DI information display (copied from legacy system)
 */
function updateDIInfo(diData) {
    const diInfoDiv = document.querySelector('.di-summary') || createDISummaryDiv();
    
    if (diInfoDiv && diData) {
        // Calculate total values properly
        const totalFOB = diData.totais?.valor_total_fob_brl || 0;
        const totalAdicoes = diData.adicoes?.length || 0;
        
        diInfoDiv.innerHTML = `
            <div class="alert alert-success">
                <h6><i class="bi bi-file-text"></i> DI ${diData.numero_di || 'N/A'}</h6>
                <div class="row">
                    <div class="col-md-6">
                        <small><strong>Data:</strong> ${diData.data_registro || 'N/A'}</small><br>
                        <small><strong>Importador:</strong> ${diData.importador?.nome || 'N/A'}</small><br>
                        <small><strong>URF:</strong> ${diData.urf_despacho_nome || 'N/A'}</small>
                    </div>
                    <div class="col-md-6">
                        <small><strong>Adições:</strong> ${totalAdicoes}</small><br>
                        <small><strong>Incoterm:</strong> ${diData.incoterm_identificado?.codigo || 'N/A'}</small><br>
                        <small><strong>Valor Total:</strong> ${formatCurrency(totalFOB)}</small>
                    </div>
                </div>
            </div>
        `;
        
        diInfoDiv.style.display = 'block';
    }
}

/**
 * Create DI summary div if it doesn't exist
 */
function createDISummaryDiv() {
    let diInfoDiv = document.getElementById('diSummary');
    if (!diInfoDiv) {
        diInfoDiv = document.createElement('div');
        diInfoDiv.id = 'diSummary';
        diInfoDiv.className = 'di-summary mb-4';
        
        // Insert at the beginning of step2
        const step2 = document.getElementById('step2');
        if (step2) {
            step2.insertBefore(diInfoDiv, step2.firstChild);
        }
    }
    return diInfoDiv;
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

// ===== DRAG & DROP FUNCTIONALITY (copiado do sistema legado funcionando) =====

/**
 * Setup drag and drop functionality
 */
function setupDragAndDrop() {
    const fileInput = document.getElementById('xmlFile');
    const uploadArea = document.querySelector('.upload-area');
    
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleFileDrop);
        uploadArea.addEventListener('click', () => fileInput.click());
    }
}

/**
 * Handle drag over
 */
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('dragover');
}

/**
 * Handle drag leave
 */
function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('dragover');
}

/**
 * Handle file drop
 */
function handleFileDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('dragover');
    
    // Reset all states when new file is uploaded  
    event.currentTarget.classList.remove('success', 'file-loaded');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        
        // Validate file type
        if (file.type === 'text/xml' || file.name.toLowerCase().endsWith('.xml')) {
            // Set the file input and trigger processing
            const fileInput = document.getElementById('xmlFile');
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
            
            // Visual feedback: arquivo XML importado com sucesso
            event.currentTarget.classList.add('file-loaded');
            
            console.log(`📁 Arquivo arrastado: ${file.name}`);
            showFileInfo(file);
            showAlert(`Arquivo "${file.name}" carregado. Clique em "Processar DI" para continuar.`, 'success');
        } else {
            showAlert('Por favor, arraste apenas arquivos XML.', 'warning');
        }
    }
}

// Make functions available globally for button onclick handlers
window.processarDI = processarDI;
window.calcularImpostos = calcularImpostos;
window.avancarStep = avancarStep;
window.voltarStep = voltarStep;
window.viewAdicaoDetails = viewAdicaoDetails;
window.viewCalculationMemory = viewCalculationMemory;
window.exportCalculationMemory = exportCalculationMemory;
window.exportCalculationMemoryPDF = exportCalculationMemoryPDF;
window.viewMultiAdditionSummary = viewMultiAdditionSummary;
window.exportMultiAdditionSummary = exportMultiAdditionSummary;
window.exportarPlanilhaCustos = exportarPlanilhaCustos;
window.exportarRelatórioImpostos = exportarRelatórioImpostos;
window.exportarCroquiNF = exportarCroquiNF;
window.exportarMemoriaCalculo = exportarMemoriaCalculo;
window.processarNovaDI = processarNovaDI;
window.confirmarProcessarNovaDI = confirmarProcessarNovaDI;
window.salvarEProcessarNovaDI = salvarEProcessarNovaDI;
window.processarNovaDISemSalvar = processarNovaDISemSalvar;
window.salvarDadosEmArquivo = salvarDadosEmArquivo;
window.carregarArquivoSalvo = carregarArquivoSalvo;
window.mostrarResultadosCalculo = mostrarResultadosCalculo;
window.prepararParaPrecificacao = prepararParaPrecificacao;
window.addExpenseRow = addExpenseRow;

// ===== MEMÓRIA DE CÁLCULO DETALHADA =====

/**
 * View detailed calculation memory for a specific addition
 */
function viewCalculationMemory(numeroAdicao) {
    if (!currentCalculation) {
        showAlert('Nenhum cálculo encontrado. Execute o cálculo de impostos primeiro.', 'warning');
        return;
    }

    const adicao = currentDI.adicoes.find(a => a.numero_adicao === numeroAdicao);
    if (!adicao) {
        showAlert('Adição não encontrada.', 'warning');
        return;
    }

    const modalContent = document.getElementById('calculationMemoryContent');
    const taxaCambio = adicao.taxa_cambio || (adicao.valor_reais / adicao.valor_moeda_negociacao);
    
    // Perform validation
    const validation = validator.validateCalculation(currentDI, currentCalculation, numeroAdicao);
    
    modalContent.innerHTML = `
        <div class="row">
            <div class="col-md-12">
                ${validator.generateValidationReport(validation)}
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-12">
                <div class="alert alert-info">
                    <h6><i class="bi bi-info-circle"></i> Adição ${numeroAdicao} - NCM ${adicao.ncm}</h6>
                    <p class="mb-0">${adicao.descricao_ncm}</p>
                </div>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header bg-light">
                        <h6><i class="bi bi-currency-exchange"></i> Valores Base</h6>
                    </div>
                    <div class="card-body">
                        <table class="table table-sm">
                            <tr>
                                <td><strong>Valor FOB (USD):</strong></td>
                                <td class="text-end">$${(adicao.valor_moeda_negociacao || 0).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td><strong>Valor CIF (BRL):</strong></td>
                                <td class="text-end">${formatCurrency(adicao.valor_reais || 0)}</td>
                            </tr>
                            <tr class="table-primary">
                                <td><strong>Taxa de Câmbio:</strong></td>
                                <td class="text-end"><strong>${taxaCambio.toFixed(6)}</strong></td>
                            </tr>
                            <tr>
                                <td><strong>Peso Líquido:</strong></td>
                                <td class="text-end">${(adicao.peso_liquido || 0).toFixed(2)} kg</td>
                            </tr>
                        </table>
                        
                        <div class="alert alert-light small">
                            <i class="bi bi-lightbulb"></i> <strong>Como é calculado:</strong><br>
                            Taxa de Câmbio = Valor em R$ ÷ Valor em USD<br>
                            ${formatCurrency(adicao.valor_reais || 0)} ÷ $${(adicao.valor_moeda_negociacao || 0).toFixed(2)} = ${taxaCambio.toFixed(6)}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header bg-light">
                        <h6><i class="bi bi-receipt"></i> Impostos Federais (DI)</h6>
                    </div>
                    <div class="card-body">
                        <table class="table table-sm">
                            <tr>
                                <td><strong>II (${adicao.tributos.ii_aliquota_ad_valorem}%):</strong></td>
                                <td class="text-end">${formatCurrency(adicao.tributos.ii_valor_devido || 0)}</td>
                            </tr>
                            <tr>
                                <td><strong>IPI (${adicao.tributos.ipi_aliquota_ad_valorem}%):</strong></td>
                                <td class="text-end">${formatCurrency(adicao.tributos.ipi_valor_devido || 0)}</td>
                            </tr>
                            <tr>
                                <td><strong>PIS (${adicao.tributos.pis_aliquota_ad_valorem}%):</strong></td>
                                <td class="text-end">${formatCurrency(adicao.tributos.pis_valor_devido || 0)}</td>
                            </tr>
                            <tr>
                                <td><strong>COFINS (${adicao.tributos.cofins_aliquota_ad_valorem}%):</strong></td>
                                <td class="text-end">${formatCurrency(adicao.tributos.cofins_valor_devido || 0)}</td>
                            </tr>
                        </table>
                        
                        <div class="alert alert-light small">
                            <i class="bi bi-lightbulb"></i> <strong>Fonte:</strong><br>
                            Alíquotas e valores extraídos diretamente da DI (SISCOMEX).
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mt-3">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header bg-warning text-dark">
                        <h6><i class="bi bi-piggy-bank"></i> Cálculo ICMS Detalhado</h6>
                    </div>
                    <div class="card-body">
                        ${generateICMSCalculationBreakdown(currentCalculation)}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mt-3">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header bg-light">
                        <h6><i class="bi bi-cash-stack"></i> Despesas Incluídas</h6>
                    </div>
                    <div class="card-body">
                        <table class="table table-sm">
                            <tr>
                                <td>SISCOMEX:</td>
                                <td class="text-end">${formatCurrency(currentDI.despesas_aduaneiras?.calculadas?.siscomex || 0)}</td>
                            </tr>
                            <tr>
                                <td>AFRMM:</td>
                                <td class="text-end">${formatCurrency(currentDI.despesas_aduaneiras?.calculadas?.afrmm || 0)}</td>
                            </tr>
                            <tr>
                                <td>Capatazia:</td>
                                <td class="text-end">${formatCurrency(currentDI.despesas_aduaneiras?.calculadas?.capatazia || 0)}</td>
                            </tr>
                            <tr class="table-primary">
                                <td><strong>Total Despesas Automáticas:</strong></td>
                                <td class="text-end"><strong>${formatCurrency(currentDI.despesas_aduaneiras?.total_despesas_aduaneiras || 0)}</strong></td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header bg-light">
                        <h6><i class="bi bi-graph-up"></i> Resumo Final</h6>
                    </div>
                    <div class="card-body">
                        <table class="table table-sm">
                            <tr>
                                <td>Total Impostos:</td>
                                <td class="text-end">${formatCurrency(currentCalculation.totais.total_impostos)}</td>
                            </tr>
                            <tr>
                                <td>Custo Total:</td>
                                <td class="text-end">${formatCurrency(currentCalculation.totais.custo_total)}</td>
                            </tr>
                            <tr class="table-success">
                                <td><strong>Custo por kg:</strong></td>
                                <td class="text-end"><strong>${formatCurrency(currentCalculation.totais.custo_por_kg)}</strong></td>
                            </tr>
                        </table>
                        
                        <div class="alert alert-success small">
                            <i class="bi bi-check-circle"></i> <strong>Cálculo Validado:</strong><br>
                            Impostos calculados conforme legislação brasileira.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('calculationMemoryModal'));
    modal.show();
}

/**
 * Generate detailed ICMS calculation breakdown
 */
function generateICMSCalculationBreakdown(calculation) {
    const icms = calculation.impostos.icms;
    const valores = calculation.valores_base;
    const impostos = calculation.impostos;
    
    return `
        <div class="row">
            <div class="col-md-8">
                <h6 class="text-primary">1️⃣ Cálculo da Base ICMS (passo a passo)</h6>
                <table class="table table-sm">
                    <tr>
                        <td>CIF (valor da mercadoria):</td>
                        <td class="text-end">${formatCurrency(valores.cif_brl)}</td>
                        <td class="text-muted">Valor base da importação</td>
                    </tr>
                    <tr>
                        <td>+ II (Imposto de Importação):</td>
                        <td class="text-end">${formatCurrency(impostos.ii.valor_devido)}</td>
                        <td class="text-muted">${impostos.ii.aliquota}% sobre CIF</td>
                    </tr>
                    <tr>
                        <td>+ IPI (${impostos.ipi.aliquota}%):</td>
                        <td class="text-end">${formatCurrency(impostos.ipi.valor_devido)}</td>
                        <td class="text-muted">Sobre CIF + II</td>
                    </tr>
                    <tr>
                        <td>+ PIS (${impostos.pis.aliquota}%):</td>
                        <td class="text-end">${formatCurrency(impostos.pis.valor_devido)}</td>
                        <td class="text-muted">Sobre CIF</td>
                    </tr>
                    <tr>
                        <td>+ COFINS (${impostos.cofins.aliquota}%):</td>
                        <td class="text-end">${formatCurrency(impostos.cofins.valor_devido)}</td>
                        <td class="text-muted">Sobre CIF</td>
                    </tr>
                    <tr>
                        <td>+ Despesas Aduaneiras:</td>
                        <td class="text-end">${formatCurrency(icms.despesas_inclusas)}</td>
                        <td class="text-muted">SISCOMEX, AFRMM, etc.</td>
                    </tr>
                    <tr class="table-warning">
                        <td><strong>= Base ICMS (antes do ICMS):</strong></td>
                        <td class="text-end"><strong>${formatCurrency(icms.base_calculo_antes)}</strong></td>
                        <td class="text-muted">Soma de todos os itens acima</td>
                    </tr>
                </table>
            </div>
            
            <div class="col-md-4">
                <div class="alert alert-warning">
                    <h6 class="text-primary">2️⃣ ICMS "Por Dentro"</h6>
                    <p class="small mb-2">O ICMS é calculado "por dentro", ou seja, a alíquota incide sobre o valor final incluindo o próprio ICMS.</p>
                    
                    <div class="bg-light p-2 rounded">
                        <strong>Fórmula:</strong><br>
                        <code>Base Final = Base Antes ÷ (1 - alíquota)</code><br><br>
                        
                        <strong>Aplicação:</strong><br>
                        ${formatCurrency(icms.base_calculo_antes)} ÷ ${icms.fator_divisao.toFixed(3)} = <br>
                        <strong>${formatCurrency(icms.base_calculo_final)}</strong>
                    </div>
                    
                    <div class="mt-2 p-2 bg-success text-white rounded">
                        <strong>ICMS Devido:</strong><br>
                        ${formatCurrency(icms.base_calculo_final)} - ${formatCurrency(icms.base_calculo_antes)} = <br>
                        <strong>${formatCurrency(icms.valor_devido)}</strong>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Export calculation memory to Excel format
 */
function exportCalculationMemory() {
    if (!currentCalculation || !currentDI) {
        showAlert('Nenhuma memória de cálculo disponível para exportar.', 'warning');
        return;
    }

    try {
        const workbook = XLSX.utils.book_new();
        const taxaCambio = currentCalculation.valores_base.taxa_cambio;
        
        // Sheet 1: Resumo Geral
        const resumoData = [
            ['MEMÓRIA DE CÁLCULO DETALHADA - IMPORTAÇÃO'],
            [''],
            ['DI Número:', currentDI.numero_di],
            ['Data:', new Date().toLocaleDateString('pt-BR')],
            ['Estado Destino:', currentCalculation.estado],
            [''],
            ['RESUMO FISCAL'],
            ['Adição', 'NCM', 'CIF (R$)', 'Total Impostos (R$)', 'Custo Total (R$)'],
            [
                currentCalculation.adicao_numero,
                currentCalculation.ncm,
                currentCalculation.valores_base.cif_brl,
                currentCalculation.totais.total_impostos,
                currentCalculation.totais.custo_total
            ]
        ];
        
        const resumoSheet = XLSX.utils.aoa_to_sheet(resumoData);
        XLSX.utils.book_append_sheet(workbook, resumoSheet, 'Resumo');
        
        // Sheet 2: Cálculo Detalhado
        const detalhesData = [
            ['CÁLCULO DETALHADO DE IMPOSTOS'],
            [''],
            ['VALORES BASE'],
            ['Descrição', 'Valor', 'Observação'],
            ['CIF USD', `$${(currentCalculation.valores_base.cif_usd || 0).toFixed(2)}`, 'Valor original da DI'],
            ['CIF BRL', formatCurrencyValue(currentCalculation.valores_base.cif_brl), 'Valor convertido'],
            ['Taxa de Câmbio', taxaCambio.toFixed(6), 'R$/USD'],
            ['Peso Líquido', `${(currentCalculation.valores_base.peso_liquido || 0).toFixed(2)} kg`, 'Conforme DI'],
            [''],
            ['IMPOSTOS FEDERAIS'],
            ['Imposto', 'Alíquota (%)', 'Base Cálculo (R$)', 'Valor Devido (R$)', 'Explicação'],
            [
                'II - Imposto de Importação',
                currentCalculation.impostos.ii.aliquota,
                formatCurrencyValue(currentCalculation.impostos.ii.base_calculo),
                formatCurrencyValue(currentCalculation.impostos.ii.valor_devido),
                'Incide sobre o valor CIF'
            ],
            [
                'IPI - Imposto sobre Produtos Industrializados', 
                currentCalculation.impostos.ipi.aliquota,
                formatCurrencyValue(currentCalculation.impostos.ipi.base_calculo),
                formatCurrencyValue(currentCalculation.impostos.ipi.valor_devido),
                'Incide sobre CIF + II'
            ],
            [
                'PIS - Programa de Integração Social',
                currentCalculation.impostos.pis.aliquota,
                formatCurrencyValue(currentCalculation.impostos.pis.base_calculo),
                formatCurrencyValue(currentCalculation.impostos.pis.valor_devido),
                'Incide sobre CIF'
            ],
            [
                'COFINS - Contribuição Social',
                currentCalculation.impostos.cofins.aliquota,
                formatCurrencyValue(currentCalculation.impostos.cofins.base_calculo),
                formatCurrencyValue(currentCalculation.impostos.cofins.valor_devido),
                'Incide sobre CIF'
            ],
            [''],
            ['DESPESAS ADUANEIRAS'],
            ['Tipo', 'Valor (R$)', 'Incluso na Base ICMS'],
            ['SISCOMEX', formatCurrencyValue(currentDI.despesas_aduaneiras?.calculadas?.siscomex || 0), 'Sim'],
            ['AFRMM', formatCurrencyValue(currentDI.despesas_aduaneiras?.calculadas?.afrmm || 0), 'Sim'],
            ['Capatazia', formatCurrencyValue(currentDI.despesas_aduaneiras?.calculadas?.capatazia || 0), 'Sim'],
            ['Total Despesas', formatCurrencyValue(currentCalculation.despesas.total_base_icms), 'Sim'],
            [''],
            ['CÁLCULO ICMS (POR DENTRO)'],
            ['Componente', 'Valor (R$)', 'Explicação'],
            ['Base antes ICMS', formatCurrencyValue(currentCalculation.impostos.icms.base_calculo_antes), 'CIF + II + IPI + PIS + COFINS + Despesas'],
            ['Alíquota ICMS', `${currentCalculation.impostos.icms.aliquota}%`, `Estado: ${currentCalculation.estado}`],
            ['Fator de Divisão', currentCalculation.impostos.icms.fator_divisao.toFixed(3), '1 - (alíquota ÷ 100)'],
            ['Base Final ICMS', formatCurrencyValue(currentCalculation.impostos.icms.base_calculo_final), 'Base antes ÷ Fator'],
            ['ICMS Devido', formatCurrencyValue(currentCalculation.impostos.icms.valor_devido), 'Base Final - Base Antes']
        ];
        
        const detalhesSheet = XLSX.utils.aoa_to_sheet(detalhesData);
        XLSX.utils.book_append_sheet(workbook, detalhesSheet, 'Cálculo Detalhado');
        
        // Export file
        const fileName = `Memoria_Calculo_${currentDI.numero_di}_${currentCalculation.adicao_numero}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        
        showAlert('Memória de cálculo exportada para Excel com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao exportar memória de cálculo:', error);
        showAlert('Erro ao exportar memória de cálculo: ' + error.message, 'danger');
    }
}

/**
 * Export calculation memory to PDF format
 */
function exportCalculationMemoryPDF() {
    if (!currentCalculation || !currentDI) {
        showAlert('Nenhuma memória de cálculo disponível para exportar.', 'warning');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const taxaCambio = currentCalculation.valores_base.taxa_cambio;
        
        // Header
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('MEMÓRIA DE CÁLCULO DETALHADA', 20, 20);
        doc.text('IMPOSTOS DE IMPORTAÇÃO', 20, 30);
        
        // DI Info
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`DI: ${currentDI.numero_di}`, 20, 45);
        doc.text(`Adição: ${currentCalculation.adicao_numero}`, 80, 45);
        doc.text(`NCM: ${currentCalculation.ncm}`, 140, 45);
        doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 55);
        doc.text(`Taxa Câmbio: ${taxaCambio.toFixed(6)}`, 80, 55);
        doc.text(`Estado: ${currentCalculation.estado}`, 140, 55);
        
        // Base Values Table
        doc.autoTable({
            startY: 70,
            head: [['VALORES BASE', 'VALOR', 'OBSERVAÇÃO']],
            body: [
                ['CIF USD', `$${(currentCalculation.valores_base.cif_usd || 0).toFixed(2)}`, 'Valor original da DI'],
                ['CIF BRL', formatCurrencyValue(currentCalculation.valores_base.cif_brl), 'Valor convertido'],
                ['Peso Líquido', `${(currentCalculation.valores_base.peso_liquido || 0).toFixed(2)} kg`, 'Conforme DI']
            ],
            theme: 'grid',
            headStyles: { fillColor: [52, 58, 64] },
            margin: { left: 20, right: 20 }
        });
        
        // Federal Taxes Table
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 10,
            head: [['IMPOSTOS FEDERAIS', 'ALÍQUOTA', 'BASE CÁLCULO', 'VALOR DEVIDO', 'EXPLICAÇÃO']],
            body: [
                [
                    'II', 
                    `${currentCalculation.impostos.ii.aliquota}%`,
                    formatCurrencyValue(currentCalculation.impostos.ii.base_calculo),
                    formatCurrencyValue(currentCalculation.impostos.ii.valor_devido),
                    'Sobre CIF'
                ],
                [
                    'IPI', 
                    `${currentCalculation.impostos.ipi.aliquota}%`,
                    formatCurrencyValue(currentCalculation.impostos.ipi.base_calculo),
                    formatCurrencyValue(currentCalculation.impostos.ipi.valor_devido),
                    'Sobre CIF + II'
                ],
                [
                    'PIS', 
                    `${currentCalculation.impostos.pis.aliquota}%`,
                    formatCurrencyValue(currentCalculation.impostos.pis.base_calculo),
                    formatCurrencyValue(currentCalculation.impostos.pis.valor_devido),
                    'Sobre CIF'
                ],
                [
                    'COFINS', 
                    `${currentCalculation.impostos.cofins.aliquota}%`,
                    formatCurrencyValue(currentCalculation.impostos.cofins.base_calculo),
                    formatCurrencyValue(currentCalculation.impostos.cofins.valor_devido),
                    'Sobre CIF'
                ]
            ],
            theme: 'grid',
            headStyles: { fillColor: [25, 135, 84] },
            margin: { left: 20, right: 20 }
        });
        
        // ICMS Calculation
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 10,
            head: [['CÁLCULO ICMS (POR DENTRO)', 'VALOR', 'FÓRMULA/EXPLICAÇÃO']],
            body: [
                ['Base antes ICMS', formatCurrencyValue(icms.base_calculo_antes), 'CIF + II + IPI + PIS + COFINS + Despesas'],
                ['Alíquota ICMS', `${icms.aliquota}%`, `Alíquota do estado ${currentCalculation.estado}`],
                ['Fator de Divisão', icms.fator_divisao.toFixed(3), '1 - (alíquota ÷ 100)'],
                ['Base Final ICMS', formatCurrencyValue(icms.base_calculo_final), 'Base antes ÷ Fator'],
                ['ICMS Devido', formatCurrencyValue(icms.valor_devido), 'Base Final - Base Antes']
            ],
            theme: 'grid',
            headStyles: { fillColor: [255, 193, 7], textColor: [0, 0, 0] },
            margin: { left: 20, right: 20 }
        });
        
        // Summary
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 10,
            head: [['RESUMO FINAL', 'VALOR']],
            body: [
                ['Total Impostos', formatCurrencyValue(currentCalculation.totais.total_impostos)],
                ['Custo Total', formatCurrencyValue(currentCalculation.totais.custo_total)],
                ['Custo por kg', formatCurrencyValue(currentCalculation.totais.custo_por_kg)]
            ],
            theme: 'grid',
            headStyles: { fillColor: [13, 110, 253] },
            margin: { left: 20, right: 20 }
        });
        
        // Save PDF
        const fileName = `Memoria_Calculo_${currentDI.numero_di}_${currentCalculation.adicao_numero}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        showAlert('Memória de cálculo exportada para PDF com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao exportar PDF:', error);
        showAlert('Erro ao exportar PDF: ' + error.message, 'danger');
    }
}

/**
 * Helper function to format currency values for export
 */
function formatCurrencyValue(value) {
    return `R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * View multi-addition summary with all calculations
 */
function viewMultiAdditionSummary() {
    if (!currentDI || !currentDI.adicoes || currentDI.adicoes.length === 0) {
        showAlert('Nenhuma DI carregada ou adições não encontradas.', 'warning');
        return;
    }

    const modalContent = document.getElementById('multiAdditionSummaryContent');
    
    // Calculate totals for all additions
    let totalCIF = 0;
    let totalWeight = 0;
    let totalFederalTaxes = 0;
    
    const additionsSummary = currentDI.adicoes.map(adicao => {
        const taxaCambio = adicao.taxa_cambio || (adicao.valor_reais / adicao.valor_moeda_negociacao);
        const federalTaxes = (adicao.tributos.ii_valor_devido || 0) +
                           (adicao.tributos.ipi_valor_devido || 0) +
                           (adicao.tributos.pis_valor_devido || 0) +
                           (adicao.tributos.cofins_valor_devido || 0);
        
        totalCIF += adicao.valor_reais || 0;
        totalWeight += adicao.peso_liquido || 0;
        totalFederalTaxes += federalTaxes;
        
        return {
            numero: adicao.numero_adicao,
            ncm: adicao.ncm,
            descricao: adicao.descricao_ncm,
            cif_usd: adicao.valor_moeda_negociacao || 0,
            cif_brl: adicao.valor_reais || 0,
            taxa_cambio: taxaCambio,
            peso: adicao.peso_liquido || 0,
            ii: adicao.tributos.ii_valor_devido || 0,
            ipi: adicao.tributos.ipi_valor_devido || 0,
            pis: adicao.tributos.pis_valor_devido || 0,
            cofins: adicao.tributos.cofins_valor_devido || 0,
            total_federal: federalTaxes,
            fornecedor: adicao.fornecedor?.nome || 'N/A'
        };
    });
    
    modalContent.innerHTML = `
        <div class="row mb-4">
            <div class="col-md-12">
                <div class="alert alert-info">
                    <h6><i class="bi bi-info-circle"></i> DI ${currentDI.numero_di} - Resumo de ${currentDI.adicoes.length} Adições</h6>
                    <div class="row mt-2">
                        <div class="col-md-4">
                            <strong>Total CIF:</strong> ${formatCurrency(totalCIF)}
                        </div>
                        <div class="col-md-4">
                            <strong>Peso Total:</strong> ${totalWeight.toFixed(2)} kg
                        </div>
                        <div class="col-md-4">
                            <strong>Impostos Federais:</strong> ${formatCurrency(totalFederalTaxes)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="table-responsive">
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>Adição</th>
                        <th>NCM</th>
                        <th>Descrição</th>
                        <th>CIF USD</th>
                        <th>CIF BRL</th>
                        <th>Taxa Câmbio</th>
                        <th>Peso (kg)</th>
                        <th>II</th>
                        <th>IPI</th>
                        <th>PIS</th>
                        <th>COFINS</th>
                        <th>Total Federal</th>
                        <th>Fornecedor</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${additionsSummary.map(item => `
                        <tr>
                            <td><strong>${item.numero}</strong></td>
                            <td><code class="small">${item.ncm}</code></td>
                            <td class="text-truncate" style="max-width: 200px;" title="${item.descricao}">
                                ${item.descricao.length > 30 ? item.descricao.substring(0, 30) + '...' : item.descricao}
                            </td>
                            <td class="text-end">$${item.cif_usd.toFixed(2)}</td>
                            <td class="text-end">${formatCurrency(item.cif_brl)}</td>
                            <td class="text-end"><span class="badge bg-primary">${item.taxa_cambio.toFixed(4)}</span></td>
                            <td class="text-end">${item.peso.toFixed(2)}</td>
                            <td class="text-end">${formatCurrency(item.ii)}</td>
                            <td class="text-end">${formatCurrency(item.ipi)}</td>
                            <td class="text-end">${formatCurrency(item.pis)}</td>
                            <td class="text-end">${formatCurrency(item.cofins)}</td>
                            <td class="text-end"><strong>${formatCurrency(item.total_federal)}</strong></td>
                            <td class="text-truncate" style="max-width: 120px;" title="${item.fornecedor}">
                                ${item.fornecedor.length > 15 ? item.fornecedor.substring(0, 15) + '...' : item.fornecedor}
                            </td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary me-1" onclick="viewAdicaoDetails('${item.numero}')" title="Ver detalhes">
                                    <i class="bi bi-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-success" onclick="viewCalculationMemory('${item.numero}')" title="Memória de cálculo">
                                    <i class="bi bi-calculator"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot class="table-primary">
                    <tr>
                        <th colspan="4">TOTAIS</th>
                        <th class="text-end">${formatCurrency(totalCIF)}</th>
                        <th></th>
                        <th class="text-end">${totalWeight.toFixed(2)} kg</th>
                        <th class="text-end">${formatCurrency(additionsSummary.reduce((sum, item) => sum + item.ii, 0))}</th>
                        <th class="text-end">${formatCurrency(additionsSummary.reduce((sum, item) => sum + item.ipi, 0))}</th>
                        <th class="text-end">${formatCurrency(additionsSummary.reduce((sum, item) => sum + item.pis, 0))}</th>
                        <th class="text-end">${formatCurrency(additionsSummary.reduce((sum, item) => sum + item.cofins, 0))}</th>
                        <th class="text-end"><strong>${formatCurrency(totalFederalTaxes)}</strong></th>
                        <th colspan="2"></th>
                    </tr>
                </tfoot>
            </table>
        </div>
        
        <div class="row mt-4">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header bg-light">
                        <h6><i class="bi bi-graph-up"></i> Análise Consolidada</h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-3">
                                <div class="text-center p-3 bg-light rounded">
                                    <h5 class="text-primary">${formatCurrency(totalCIF)}</h5>
                                    <small>Valor Total CIF</small>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="text-center p-3 bg-light rounded">
                                    <h5 class="text-success">${formatCurrency(totalFederalTaxes)}</h5>
                                    <small>Impostos Federais</small>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="text-center p-3 bg-light rounded">
                                    <h5 class="text-info">${totalWeight.toFixed(2)} kg</h5>
                                    <small>Peso Total</small>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="text-center p-3 bg-light rounded">
                                    <h5 class="text-warning">${(totalCIF / totalWeight).toFixed(2)}</h5>
                                    <small>CIF Médio por kg</small>
                                </div>
                            </div>
                        </div>
                        
                        <div class="alert alert-light mt-3">
                            <h6><i class="bi bi-exclamation-circle"></i> Importante:</h6>
                            <p class="mb-0">
                                Este resumo mostra os <strong>impostos federais extraídos da DI</strong>. 
                                Para ver o cálculo completo com ICMS e despesas aduaneiras, 
                                utilize o botão "Calcular Impostos" na etapa de processamento.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('multiAdditionSummaryModal'));
    modal.show();
}

/**
 * Export multi-addition summary using dedicated exporter
 */
function exportMultiAdditionSummary() {
    if (!currentDI || !currentDI.adicoes || currentDI.adicoes.length === 0) {
        showAlert('Nenhuma DI carregada para exportar.', 'warning');
        return;
    }
    
    try {
        // Create exporter instance
        const exporter = new MultiAdditionExporter(currentDI);
        
        // Export to Excel (default)
        const result = exporter.exportToExcel();
        
        if (result.success) {
            showAlert(`Resumo multi-adição exportado: ${result.fileName}`, 'success');
        }
        
    } catch (error) {
        console.error('Erro ao exportar resumo multi-adição:', error);
        showAlert('Erro ao exportar resumo: ' + error.message, 'danger');
    }
}

// ===== CONFIGURAÇÃO DE ALÍQUOTAS ICMS POR NCM =====

// Storage para configurações de alíquotas
let icmsConfig = {
    estado: null, // Estado será definido quando DI for carregada
    aliquotaPadrao: null, // Alíquota será obtida do JSON baseada no estado
    ncmConfigs: {} // ncm -> aliquota específica
};

// Cache das alíquotas carregadas do JSON
let aliquotasCache = null;

/**
 * Carregar alíquotas do arquivo JSON
 */
async function carregarAliquotasICMS() {
    if (aliquotasCache) return aliquotasCache;
    
    try {
        const response = await fetch('./src/shared/data/aliquotas.json');
        aliquotasCache = await response.json();
        console.log('✅ Alíquotas ICMS carregadas:', aliquotasCache);
        return aliquotasCache;
    } catch (error) {
        console.error('❌ Erro ao carregar alíquotas:', error);
        showAlert('Erro ao carregar configurações de alíquotas ICMS', 'danger');
        return null;
    }
}

/**
 * Preencher select de estados com alíquotas do JSON
 */
async function preencherSelectEstados() {
    const aliquotas = await carregarAliquotasICMS();
    if (!aliquotas) return;
    
    const select = document.getElementById('estadoDestinoSelect');
    if (!select) return;
    
    select.innerHTML = '';
    
    Object.entries(aliquotas.aliquotas_icms_2025).forEach(([uf, config]) => {
        const option = document.createElement('option');
        option.value = uf;
        option.textContent = `${uf} (${config.aliquota_interna}%)`;
        if (config.fcp) {
            option.textContent += ` + FCP`;
        }
        
        // Não definir estado padrão - será selecionado baseado na DI
        // if (uf === 'GO') {
        //     option.selected = true;
        // }
        
        select.appendChild(option);
    });
    
    // Atualizar alíquota padrão
    atualizarAliquotaPadrao();
}

/**
 * Atualizar alíquota padrão baseada no estado selecionado
 */
async function atualizarAliquotaPadrao() {
    const aliquotas = await carregarAliquotasICMS();
    if (!aliquotas) return;
    
    const estadoSelect = document.getElementById('estadoDestinoSelect');
    const aliquotaInput = document.getElementById('aliquotaPadraoInput');
    
    if (!estadoSelect || !aliquotaInput) return;
    
    const estado = estadoSelect.value;
    const config = aliquotas.aliquotas_icms_2025[estado];
    
    if (config) {
        let aliquotaTotal = config.aliquota_interna;
        
        // Adicionar FCP se aplicável
        if (config.fcp && typeof config.fcp === 'number') {
            aliquotaTotal += config.fcp;
        }
        
        aliquotaInput.value = aliquotaTotal;
        icmsConfig.estado = estado;
        icmsConfig.aliquotaPadrao = aliquotaTotal;
    }
}

/**
 * Extrair NCMs únicos da DI carregada
 */
function extrairNCMsUnicos() {
    if (!currentDI || !currentDI.adicoes) return [];
    
    const ncmsMap = new Map();
    
    currentDI.adicoes.forEach(adicao => {
        const ncm = adicao.ncm;
        if (ncm && !ncmsMap.has(ncm)) {
            ncmsMap.set(ncm, {
                ncm: ncm,
                descricao: adicao.descricao_mercadoria || adicao.nome_ncm || 'Descrição não disponível',
                valor: adicao.valor_reais || 0
            });
        }
    });
    
    return Array.from(ncmsMap.values());
}

/**
 * Mostrar modal de configuração de alíquotas ICMS
 */
async function mostrarModalICMS() {
    // Carregar configurações e preencher estados
    await preencherSelectEstados();
    
    const ncms = extrairNCMsUnicos();
    
    if (ncms.length === 0) {
        showAlert('Nenhum NCM encontrado na DI carregada.', 'warning');
        return;
    }
    
    console.log('📊 NCMs encontrados para configuração:', ncms);
    
    // Preencher tabela de NCMs
    const tableBody = document.getElementById('ncmConfigTableBody');
    tableBody.innerHTML = '';
    
    ncms.forEach(ncmData => {
        const aliquotaAtual = icmsConfig.ncmConfigs[ncmData.ncm] || icmsConfig.aliquotaPadrao;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="fw-bold">${ncmData.ncm}</td>
            <td class="small">${ncmData.descricao}</td>
            <td class="text-end">${formatCurrency(ncmData.valor)}</td>
            <td>
                <div class="input-group input-group-sm">
                    <input type="number" class="form-control text-center ncm-aliquota-input" 
                           data-ncm="${ncmData.ncm}" 
                           value="${aliquotaAtual}" 
                           min="0" max="27" step="0.01">
                    <span class="input-group-text">%</span>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('icmsConfigModal'));
    modal.show();
}

/**
 * Salvar configurações de alíquotas
 */
function salvarConfiguracoesICMS() {
    // Atualizar estado e alíquota padrão
    icmsConfig.estado = document.getElementById('estadoDestinoSelect').value;
    icmsConfig.aliquotaPadrao = parseFloat(document.getElementById('aliquotaPadraoInput').value) || 19;
    
    // Coletar alíquotas específicas por NCM
    const inputs = document.querySelectorAll('.ncm-aliquota-input');
    inputs.forEach(input => {
        const ncm = input.dataset.ncm;
        const aliquota = parseFloat(input.value) || icmsConfig.aliquotaPadrao;
        
        // Apenas salvar se diferente da alíquota padrão
        if (aliquota !== icmsConfig.aliquotaPadrao) {
            icmsConfig.ncmConfigs[ncm] = aliquota;
        } else {
            delete icmsConfig.ncmConfigs[ncm]; // Remove se igual ao padrão
        }
    });
    
    console.log('✅ Configurações ICMS salvas:', icmsConfig);
    
    // Sincronizar com ItemCalculator se disponível
    if (window.ItemCalculator) {
        const itemCalculatorInstance = new window.ItemCalculator();
        itemCalculatorInstance.atualizarConfigICMS(icmsConfig);
        
        // Tornar configurações globalmente disponíveis
        window.icmsConfig = icmsConfig;
    }
    
    // Fechar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('icmsConfigModal'));
    modal.hide();
    
    // Mostrar confirmação
    const ncmsDiferentes = Object.keys(icmsConfig.ncmConfigs).length;
    showAlert(`Configurações salvas! Estado: ${icmsConfig.estado}, Alíquota padrão: ${icmsConfig.aliquotaPadrao}%` + 
              (ncmsDiferentes > 0 ? `, ${ncmsDiferentes} NCM(s) com alíquota específica` : ''), 'success');
}

/**
 * Obter alíquota ICMS para um NCM específico
 */
function getAliquotaICMSParaNCM(ncm) {
    return icmsConfig.ncmConfigs[ncm] || icmsConfig.aliquotaPadrao;
}

/**
 * Configurar listeners do modal de alíquotas
 */
document.addEventListener('DOMContentLoaded', function() {
    // Listener para o botão de salvar alíquotas
    const salvarBtn = document.getElementById('salvarAliquotasBtn');
    if (salvarBtn) {
        salvarBtn.addEventListener('click', salvarConfiguracoesICMS);
    }
    
    // Listener para mudança de estado
    const estadoSelect = document.getElementById('estadoDestinoSelect');
    if (estadoSelect) {
        estadoSelect.addEventListener('change', atualizarAliquotaPadrao);
    }
});

// Exportar funções para uso global
window.mostrarModalICMS = mostrarModalICMS;
window.getAliquotaICMSParaNCM = getAliquotaICMSParaNCM;