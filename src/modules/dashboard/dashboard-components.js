/**
 * dashboard-components.js - UI Components Dashboard
 * 
 * Componentes visuais seguindo padrão Expertzy
 * Integração com Bootstrap 5 + Expertzy Brand System
 */

class DashboardComponents {
    constructor(dashboardCore) {
        this.core = dashboardCore;
        this.searchTimeout = null;
        this.currentFilter = '';
    }
    
    /**
     * Renderizar cards de estatísticas
     */
    async renderStatsCards() {
        const container = document.getElementById('statsGrid');
        if (!container) return;
        
        try {
            // Mostrar loading
            container.innerHTML = this.getLoadingHTML('Carregando estatísticas...');
            
            const stats = await this.core.getGeneralStats();
            
            const cardsHTML = `
                <div class="stat-card">
                    <div class="stat-value">${stats.totalDIs}</div>
                    <div class="stat-label">Declarações</div>
                    <div class="stat-description">Total de DIs processadas</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-value">${stats.totalAdicoes}</div>
                    <div class="stat-label">Adições</div>
                    <div class="stat-description">Média: ${stats.avgAdicoesPorDI} por DI</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-value">${stats.totalProdutos}</div>
                    <div class="stat-label">Produtos</div>
                    <div class="stat-description">Média: ${stats.avgProdutosPorDI} por DI</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-value">${stats.totalDespesas}</div>
                    <div class="stat-label">Despesas</div>
                    <div class="stat-description">Aduaneiras registradas</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-value">${stats.totalCarga}</div>
                    <div class="stat-label">Cargas</div>
                    <div class="stat-description">Informações logísticas</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-value">${stats.totalIncentivos}</div>
                    <div class="stat-label">Incentivos</div>
                    <div class="stat-description">Benefícios fiscais</div>
                </div>
            `;
            
            container.innerHTML = cardsHTML;
            
            // Animar entrada dos cards
            this.animateCards(container);
            
        } catch (error) {
            console.error('❌ Erro ao renderizar stats cards:', error);
            container.innerHTML = this.getErrorHTML('Erro ao carregar estatísticas');
        }
    }
    
    /**
     * Renderizar lista de DIs
     */
    async renderDIsList() {
        const container = document.getElementById('disList');
        if (!container) return;
        
        try {
            // Mostrar loading
            container.innerHTML = this.getLoadingHTML('Carregando declarações...');
            
            const dis = await this.core.getDIsList(100);
            
            if (dis.length === 0) {
                container.innerHTML = this.getEmptyStateHTML(
                    'folder-open',
                    'Nenhuma DI encontrada',
                    'Importe uma DI usando a interface principal para ver os dados aqui.',
                    [{
                        text: 'Ir para Interface DI',
                        href: 'di-interface.html',
                        class: 'btn-expertzy-primary'
                    }]
                );
                return;
            }
            
            // Renderizar tools bar + tabela
            const toolsBarHTML = `
                <div class="tools-bar">
                    <input type="text" 
                           class="search-box" 
                           id="searchDI" 
                           placeholder="🔍 Buscar por número DI, importador ou CNPJ...">
                    <button class="btn btn-expertzy-primary" onclick="dashboardComponents.refreshDIs()">
                        <i class="bi bi-arrow-clockwise"></i> Atualizar
                    </button>
                    <button class="btn btn-expertzy-secondary" onclick="dashboardComponents.exportData()">
                        <i class="bi bi-download"></i> Exportar
                    </button>
                    <button class="btn btn-danger" onclick="dashboardComponents.confirmClearDatabase()">
                        <i class="bi bi-trash"></i> Limpar DB
                    </button>
                </div>
            `;
            
            const tableHTML = this.generateDIsTable(dis);
            
            container.innerHTML = toolsBarHTML + tableHTML;
            
            // Setup search functionality
            this.setupSearch();
            
        } catch (error) {
            console.error('❌ Erro ao renderizar lista DIs:', error);
            container.innerHTML = this.getErrorHTML('Erro ao carregar declarações');
        }
    }
    
    /**
     * Gerar tabela de DIs
     */
    generateDIsTable(dis) {
        let tableHTML = `
            <div class="table-container">
                <table class="table table-hover dashboard-table">
                    <thead>
                        <tr>
                            <th><i class="bi bi-file-earmark-text"></i> Número DI</th>
                            <th><i class="bi bi-building"></i> Importador</th>
                            <th><i class="bi bi-credit-card"></i> CNPJ</th>
                            <th><i class="bi bi-geo-alt"></i> UF</th>
                            <th><i class="bi bi-calendar"></i> Data</th>
                            <th><i class="bi bi-list-ul"></i> Adições</th>
                            <th><i class="bi bi-box-seam"></i> Produtos</th>
                            <th><i class="bi bi-cash-stack"></i> Despesas</th>
                            <th><i class="bi bi-info-circle"></i> Status</th>
                            <th><i class="bi bi-gear"></i> Ações</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        for (const di of dis) {
            const dataFormatada = new Date(di.data_processamento).toLocaleString('pt-BR');
            const statusBadge = this.getStatusBadge(di.processing_state);
            const cnpjFormatado = this.formatCNPJ(di.importador_cnpj);
            const nomeImportador = di.importador_nome || 'N/A';
            const uf = di.importador_endereco_uf || 'N/A';
            
            tableHTML += `
                <tr data-di-id="${di.id}" data-search-text="${di.numero_di} ${nomeImportador} ${cnpjFormatado}">
                    <td><strong class="text-expertzy-navy">${di.numero_di}</strong></td>
                    <td>
                        <div class="text-truncate" style="max-width: 200px;" title="${nomeImportador}">
                            ${nomeImportador}
                        </div>
                    </td>
                    <td><code class="small">${cnpjFormatado}</code></td>
                    <td><span class="badge bg-light text-dark">${uf}</span></td>
                    <td><small class="text-muted">${dataFormatada}</small></td>
                    <td><span class="badge bg-primary">${di.count_adicoes || 0}</span></td>
                    <td><span class="badge bg-info">${di.count_produtos || 0}</span></td>
                    <td><span class="badge bg-warning text-dark">${di.count_despesas || 0}</span></td>
                    <td>${statusBadge}</td>
                    <td>
                        <div class="btn-group btn-group-sm" role="group">
                            <button class="btn btn-dashboard btn-view" 
                                    onclick="dashboardComponents.showDIDetails('${di.id}')"
                                    title="Ver detalhes">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-outline-secondary" 
                                    onclick="dashboardComponents.exportDI('${di.id}')"
                                    title="Exportar DI">
                                <i class="bi bi-download"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
        
        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;
        
        return tableHTML;
    }
    
    /**
     * Renderizar estrutura de tabelas com dados reais
     */
    async renderTableStructure() {
        const container = document.getElementById('schemaInfo');
        if (!container) return;
        
        try {
            // Mostrar loading
            container.innerHTML = this.getLoadingHTML('Carregando dados das tabelas...');
            
            const tableDetails = await this.core.getTableDetails();
            
            if (Object.keys(tableDetails).length === 0) {
                container.innerHTML = this.getEmptyStateHTML(
                    'database',
                    'Nenhum dado encontrado',
                    'Importe algumas DIs para visualizar os dados das tabelas.',
                    [{
                        text: 'Ir para Processamento DI',
                        href: 'di-interface.html',
                        class: 'btn-expertzy-primary'
                    }]
                );
                return;
            }
            
            const tabsHTML = this.generateTableTabs(tableDetails);
            container.innerHTML = tabsHTML;
            
            // Ativar primeira aba
            this.activateFirstTab();
            
        } catch (error) {
            console.error('❌ Erro ao renderizar estrutura de tabelas:', error);
            container.innerHTML = this.getErrorHTML('Erro ao carregar dados das tabelas');
        }
    }
    
    /**
     * Gerar HTML das abas de tabelas
     */
    generateTableTabs(tableDetails) {
        const tables = Object.keys(tableDetails);
        
        const tabNavHTML = tables.map((tableName, index) => {
            const table = tableDetails[tableName];
            const isActive = index === 0 ? 'active' : '';
            
            return `
                <li class="nav-item" role="presentation">
                    <button class="nav-link table-tab ${isActive}" 
                            id="tab-${tableName}" 
                            data-bs-toggle="tab" 
                            data-bs-target="#panel-${tableName}" 
                            type="button" 
                            role="tab">
                        ${this.getTableIcon(tableName)}
                        ${table.tableName}
                        <span class="badge bg-light text-dark ms-2">${table.count}</span>
                    </button>
                </li>
            `;
        }).join('');
        
        const tabContentHTML = tables.map((tableName, index) => {
            const table = tableDetails[tableName];
            const isActive = index === 0 ? 'show active' : '';
            
            return `
                <div class="tab-pane fade ${isActive}" 
                     id="panel-${tableName}" 
                     role="tabpanel" 
                     aria-labelledby="tab-${tableName}">
                    ${this.generateTablePanel(tableName, table)}
                </div>
            `;
        }).join('');
        
        return `
            <div class="table-structure-container">
                <!-- Alert com informações gerais -->
                <div class="alert alert-info mb-4">
                    <h5><i class="bi bi-database"></i> Estrutura e Dados do Banco</h5>
                    <p class="mb-0">Visualização dinâmica dos dados reais importados, organizados por tabela com estatísticas e amostras.</p>
                </div>
                
                <!-- Navegação por abas -->
                <ul class="nav nav-tabs table-structure-tabs mb-4" role="tablist">
                    ${tabNavHTML}
                </ul>
                
                <!-- Conteúdo das abas -->
                <div class="tab-content">
                    ${tabContentHTML}
                </div>
            </div>
        `;
    }
    
    /**
     * Gerar painel individual de cada tabela
     */
    generateTablePanel(tableName, tableData) {
        const { count, samples, fields, statistics } = tableData;
        
        if (count === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class="bi bi-inbox"></i>
                    </div>
                    <h4>Tabela Vazia</h4>
                    <p>A tabela <strong>${tableData.tableName}</strong> não possui dados.</p>
                </div>
            `;
        }
        
        return `
            <div class="table-panel">
                <!-- Estatísticas da tabela -->
                <div class="row mb-4">
                    <div class="col-12">
                        ${this.generateTableStatistics(tableName, statistics, count)}
                    </div>
                </div>
                
                <!-- Amostra de dados -->
                <div class="row">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">
                                    <i class="bi bi-table"></i> 
                                    Amostra de Dados (${samples.length} de ${count} registros)
                                </h6>
                            </div>
                            <div class="card-body p-0">
                                ${this.generateDataTable(samples, fields, tableName)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Gerar estatísticas específicas da tabela
     */
    generateTableStatistics(tableName, statistics, totalCount) {
        let statsCards = `
            <div class="stats-row">
                <div class="stat-mini-card">
                    <div class="stat-value">${totalCount}</div>
                    <div class="stat-label">Total Registros</div>
                </div>
        `;
        
        // Estatísticas específicas por tabela
        switch (tableName) {
            case 'declaracoes':
                statsCards += `
                    <div class="stat-mini-card">
                        <div class="stat-value">${statistics.uniqueImporters || 0}</div>
                        <div class="stat-label">Importadores</div>
                    </div>
                    <div class="stat-mini-card">
                        <div class="stat-value">${statistics.uniqueUfs || 0}</div>
                        <div class="stat-label">UFs</div>
                    </div>
                `;
                break;
                
            case 'adicoes':
                statsCards += `
                    <div class="stat-mini-card">
                        <div class="stat-value">${statistics.uniqueNCMs || 0}</div>
                        <div class="stat-label">NCMs Únicos</div>
                    </div>
                    <div class="stat-mini-card">
                        <div class="stat-value">${statistics.avgIIAliquota || 0}%</div>
                        <div class="stat-label">II Médio</div>
                    </div>
                    <div class="stat-mini-card">
                        <div class="stat-value">R$ ${this.formatMoney(statistics.totalValue || 0)}</div>
                        <div class="stat-label">Valor Total</div>
                    </div>
                `;
                break;
                
            case 'produtos':
                statsCards += `
                    <div class="stat-mini-card">
                        <div class="stat-value">${statistics.uniqueUnits || 0}</div>
                        <div class="stat-label">Unidades</div>
                    </div>
                    <div class="stat-mini-card">
                        <div class="stat-value">R$ ${this.formatMoney(statistics.avgUnitPrice || 0)}</div>
                        <div class="stat-label">Preço Médio</div>
                    </div>
                `;
                break;
                
            case 'despesas_aduaneiras':
                statsCards += `
                    <div class="stat-mini-card">
                        <div class="stat-value">${statistics.uniqueTypes || 0}</div>
                        <div class="stat-label">Tipos</div>
                    </div>
                    <div class="stat-mini-card">
                        <div class="stat-value">R$ ${this.formatMoney(statistics.totalValue || 0)}</div>
                        <div class="stat-label">Total</div>
                    </div>
                `;
                break;
                
            case 'dados_carga':
                statsCards += `
                    <div class="stat-mini-card">
                        <div class="stat-value">${statistics.uniqueCountries || 0}</div>
                        <div class="stat-label">Países</div>
                    </div>
                    <div class="stat-mini-card">
                        <div class="stat-value">${this.formatMoney(statistics.totalWeight || 0)} kg</div>
                        <div class="stat-label">Peso Total</div>
                    </div>
                `;
                break;
        }
        
        statsCards += '</div>';
        return statsCards;
    }
    
    /**
     * Gerar tabela de dados
     */
    generateDataTable(samples, fields, tableName) {
        if (samples.length === 0) {
            return '<p class="text-muted text-center p-4">Nenhum dado disponível</p>';
        }
        
        // Campos mais importantes para mostrar primeiro
        const priorityFields = this.getPriorityFields(tableName);
        const displayFields = priorityFields.concat(
            fields.filter(f => !priorityFields.includes(f))
        ).slice(0, 8); // Máximo 8 campos
        
        let tableHTML = `
            <div class="table-responsive">
                <table class="table table-sm table-hover mb-0 data-table">
                    <thead class="table-light">
                        <tr>
                            ${displayFields.map(field => `
                                <th class="field-header" title="${field}">
                                    ${this.formatFieldName(field)}
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        samples.forEach((sample, index) => {
            tableHTML += `
                <tr class="data-row" data-index="${index}">
                    ${displayFields.map(field => `
                        <td class="data-cell" title="${field}: ${sample[field] || 'N/A'}">
                            ${this.formatFieldValue(field, sample[field], tableName)}
                        </td>
                    `).join('')}
                </tr>
            `;
        });
        
        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;
        
        return tableHTML;
    }
    
    /**
     * Utilitários para tabelas
     */
    getTableIcon(tableName) {
        const icons = {
            'declaracoes': '<i class="bi bi-file-earmark-text"></i>',
            'adicoes': '<i class="bi bi-list-ul"></i>',
            'produtos': '<i class="bi bi-box-seam"></i>',
            'despesas_aduaneiras': '<i class="bi bi-cash-stack"></i>',
            'dados_carga': '<i class="bi bi-truck"></i>'
        };
        return icons[tableName] || '<i class="bi bi-table"></i>';
    }
    
    getPriorityFields(tableName) {
        const priorities = {
            'declaracoes': ['numero_di', 'importador_nome', 'importador_cnpj', 'importador_endereco_uf', 'data_processamento'],
            'adicoes': ['numero_adicao', 'ncm', 'valor_reais', 'ii_aliquota_ad_valorem', 'ipi_aliquota_ad_valorem'],
            'produtos': ['numero_sequencial_item', 'descricao_mercadoria', 'ncm', 'quantidade', 'valor_unitario_brl'],
            'despesas_aduaneiras': ['tipo', 'valor', 'codigo_receita', 'origem'],
            'dados_carga': ['peso_bruto', 'peso_liquido', 'pais_procedencia_nome', 'via_transporte_nome']
        };
        return priorities[tableName] || [];
    }
    
    formatFieldName(fieldName) {
        return fieldName
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            .substring(0, 15) + (fieldName.length > 15 ? '...' : '');
    }
    
    formatFieldValue(fieldName, value, tableName) {
        if (value === null || value === undefined || value === '') {
            return '<span class="text-muted">N/A</span>';
        }
        
        // Formatação específica por tipo de campo
        if (fieldName.includes('valor') || fieldName.includes('price')) {
            return `R$ ${this.formatMoney(value)}`;
        }
        
        if (fieldName.includes('aliquota') && typeof value === 'number') {
            return `${value}%`;
        }
        
        if (fieldName.includes('data') || fieldName.includes('date')) {
            try {
                return new Date(value).toLocaleDateString('pt-BR');
            } catch {
                return value;
            }
        }
        
        // Truncar strings longas
        const strValue = String(value);
        if (strValue.length > 30) {
            return `<span title="${strValue}">${strValue.substring(0, 27)}...</span>`;
        }
        
        return strValue;
    }
    
    activateFirstTab() {
        // Garantir que Bootstrap tabs funcionem
        setTimeout(() => {
            const firstTab = document.querySelector('.table-tab.active');
            if (firstTab) {
                const tabInstance = new bootstrap.Tab(firstTab);
                tabInstance.show();
            }
        }, 100);
    }
    
    /**
     * Setup funcionalidade de search
     */
    setupSearch() {
        const searchBox = document.getElementById('searchDI');
        if (!searchBox) return;
        
        searchBox.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.filterDIsList(e.target.value.toLowerCase());
            }, 300);
        });
    }
    
    /**
     * Filtrar lista de DIs
     */
    filterDIsList(searchTerm) {
        const rows = document.querySelectorAll('[data-search-text]');
        let visibleCount = 0;
        
        rows.forEach(row => {
            const searchText = row.getAttribute('data-search-text').toLowerCase();
            const isVisible = searchText.includes(searchTerm);
            row.style.display = isVisible ? '' : 'none';
            if (isVisible) visibleCount++;
        });
        
        // Mostrar contador de resultados
        this.updateSearchResults(visibleCount, rows.length);
    }
    
    /**
     * Atualizar contador de resultados de pesquisa
     */
    updateSearchResults(visible, total) {
        let resultsInfo = document.getElementById('searchResults');
        if (!resultsInfo) {
            resultsInfo = document.createElement('div');
            resultsInfo.id = 'searchResults';
            resultsInfo.className = 'small text-muted mt-2';
            const searchBox = document.getElementById('searchDI');
            searchBox.parentNode.appendChild(resultsInfo);
        }
        
        if (visible === total) {
            resultsInfo.innerHTML = `Exibindo todas as ${total} declarações`;
        } else {
            resultsInfo.innerHTML = `Exibindo ${visible} de ${total} declarações`;
        }
    }
    
    /**
     * Mostrar detalhes de uma DI
     */
    async showDIDetails(diId) {
        try {
            console.log(`🔍 Carregando detalhes da DI ${diId}...`);
            
            const di = await this.core.getDIDetails(diId);
            
            // Criar modal com detalhes
            const modalHTML = this.generateDIDetailsModal(di);
            
            // Adicionar modal ao DOM
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = modalHTML;
            document.body.appendChild(modalContainer);
            
            // Mostrar modal
            const modal = new bootstrap.Modal(modalContainer.querySelector('.modal'));
            modal.show();
            
            // Remover do DOM quando fechar
            modalContainer.querySelector('.modal').addEventListener('hidden.bs.modal', () => {
                modalContainer.remove();
            });
            
        } catch (error) {
            console.error('❌ Erro ao carregar detalhes da DI:', error);
            this.showAlert('Erro ao carregar detalhes da DI: ' + error.message, 'danger');
        }
    }
    
    /**
     * Gerar HTML do modal de detalhes da DI
     */
    generateDIDetailsModal(di) {
        return `
            <div class="modal fade" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header bg-expertzy-navy text-white">
                            <h5 class="modal-title">
                                <i class="bi bi-file-earmark-text"></i> 
                                Detalhes da DI ${di.numero_di}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${this.generateDIDetailsContent(di)}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                            <button type="button" class="btn btn-expertzy-primary" onclick="dashboardComponents.exportDI('${di.id}')">
                                <i class="bi bi-download"></i> Exportar DI
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Gerar conteúdo dos detalhes da DI
     */
    generateDIDetailsContent(di) {
        return `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-header">
                            <h6><i class="bi bi-building"></i> Importador</h6>
                        </div>
                        <div class="card-body">
                            <p><strong>Nome:</strong> ${di.importador_nome || 'N/A'}</p>
                            <p><strong>CNPJ:</strong> ${this.formatCNPJ(di.importador_cnpj)}</p>
                            <p><strong>UF:</strong> ${di.importador_endereco_uf || 'N/A'}</p>
                            <p><strong>Endereço:</strong> ${di.importador_endereco_completo || 'N/A'}</p>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-header">
                            <h6><i class="bi bi-info-circle"></i> Informações Gerais</h6>
                        </div>
                        <div class="card-body">
                            <p><strong>Data Registro:</strong> ${di.data_registro ? new Date(di.data_registro).toLocaleDateString('pt-BR') : 'N/A'}</p>
                            <p><strong>URF:</strong> ${di.urf_despacho_nome || 'N/A'}</p>
                            <p><strong>Modalidade:</strong> ${di.modalidade_nome || 'N/A'}</p>
                            <p><strong>Status:</strong> ${this.getStatusBadge(di.processing_state)}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-12 mb-3">
                    <div class="card">
                        <div class="card-header">
                            <h6><i class="bi bi-list-ul"></i> Adições (${di.adicoes.length})</h6>
                        </div>
                        <div class="card-body">
                            ${this.generateAdicoesTable(di.adicoes)}
                        </div>
                    </div>
                </div>
            </div>
            
            ${di.carga ? this.generateCargaInfo(di.carga) : ''}
            ${di.despesas.length > 0 ? this.generateDespesasInfo(di.despesas) : ''}
        `;
    }
    
    /**
     * Gerar tabela de adições
     */
    generateAdicoesTable(adicoes) {
        if (adicoes.length === 0) {
            return '<p class="text-muted">Nenhuma adição encontrada.</p>';
        }
        
        let html = `
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Nº</th>
                            <th>NCM</th>
                            <th>Valor (BRL)</th>
                            <th>II %</th>
                            <th>IPI %</th>
                            <th>Produtos</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        for (const adicao of adicoes) {
            html += `
                <tr>
                    <td><strong>${adicao.numero_adicao}</strong></td>
                    <td><code>${adicao.ncm}</code></td>
                    <td>R$ ${this.formatMoney(adicao.valor_reais)}</td>
                    <td>${adicao.ii_aliquota_ad_valorem || 0}%</td>
                    <td>${adicao.ipi_aliquota_ad_valorem || 0}%</td>
                    <td><span class="badge bg-info">${adicao.produtos.length}</span></td>
                </tr>
            `;
        }
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        return html;
    }
    
    /**
     * Gerar informações de carga
     */
    generateCargaInfo(carga) {
        return `
            <div class="row">
                <div class="col-12 mb-3">
                    <div class="card">
                        <div class="card-header">
                            <h6><i class="bi bi-truck"></i> Dados de Carga</h6>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-4">
                                    <p><strong>Peso Bruto:</strong> ${carga.peso_bruto || 0} kg</p>
                                    <p><strong>Peso Líquido:</strong> ${carga.peso_liquido || 0} kg</p>
                                </div>
                                <div class="col-md-4">
                                    <p><strong>País:</strong> ${carga.pais_procedencia_nome || 'N/A'}</p>
                                    <p><strong>Via:</strong> ${carga.via_transporte_nome || 'N/A'}</p>
                                </div>
                                <div class="col-md-4">
                                    <p><strong>Veículo:</strong> ${carga.nome_veiculo || 'N/A'}</p>
                                    <p><strong>Transportador:</strong> ${carga.nome_transportador || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Gerar informações de despesas
     */
    generateDespesasInfo(despesas) {
        return `
            <div class="row">
                <div class="col-12 mb-3">
                    <div class="card">
                        <div class="card-header">
                            <h6><i class="bi bi-cash-stack"></i> Despesas Aduaneiras</h6>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Tipo</th>
                                            <th>Valor</th>
                                            <th>Código Receita</th>
                                            <th>Origem</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${despesas.map(despesa => `
                                            <tr>
                                                <td>${despesa.tipo}</td>
                                                <td>R$ ${this.formatMoney(despesa.valor)}</td>
                                                <td><code>${despesa.codigo_receita || 'N/A'}</code></td>
                                                <td><span class="badge bg-light text-dark">${despesa.origem || 'SISCOMEX'}</span></td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Validar nomenclatura e mostrar resultados
     */
    async validateNomenclature() {
        const resultsContainer = document.getElementById('validationResults');
        if (!resultsContainer) return;
        
        try {
            resultsContainer.innerHTML = this.getLoadingHTML('Validando nomenclatura...');
            
            const validation = await this.core.validateNomenclature();
            
            const resultHTML = `
                <div class="validation-result ${validation.isValid ? 'success' : 'warning'}">
                    <h6><i class="bi bi-${validation.isValid ? 'check-circle' : 'exclamation-triangle'}"></i> ${validation.summary}</h6>
                    
                    <div class="mt-3">
                        <h6>Verificações Realizadas:</h6>
                        <ul class="validation-list">
                            ${validation.checks.map(check => `
                                <li>
                                    <i class="bi bi-${check.status === 'success' ? 'check-circle text-success' : 'x-circle text-danger'}"></i>
                                    <span class="validation-code">${check.field}</span>: ${check.message}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    
                    ${validation.violations.length > 0 ? `
                        <div class="mt-3">
                            <h6>Violações Encontradas:</h6>
                            <ul class="validation-list">
                                ${validation.violations.map(violation => `
                                    <li>
                                        <i class="bi bi-exclamation-triangle text-warning"></i>
                                        <strong>${violation.type}:</strong> ${violation.message} (${violation.count} registro(s))
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            `;
            
            resultsContainer.innerHTML = resultHTML;
            
        } catch (error) {
            console.error('❌ Erro na validação:', error);
            resultsContainer.innerHTML = this.getErrorHTML('Erro durante validação: ' + error.message);
        }
    }
    
    /**
     * Actions
     */
    async refreshStats() {
        await this.renderStatsCards();
    }
    
    async refreshDIs() {
        await this.renderDIsList();
    }
    
    async exportData() {
        try {
            const data = await this.core.exportAllData();
            const dataStr = JSON.stringify(data, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `expertzy_backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            this.showAlert('Dados exportados com sucesso!', 'success');
            
        } catch (error) {
            console.error('❌ Erro ao exportar:', error);
            this.showAlert('Erro ao exportar dados: ' + error.message, 'danger');
        }
    }
    
    async exportDI(diId) {
        try {
            const di = await this.core.getDIDetails(diId);
            const dataStr = JSON.stringify(di, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `DI_${di.numero_di}_${Date.now()}.json`;
            link.click();
            
            this.showAlert(`DI ${di.numero_di} exportada com sucesso!`, 'success');
            
        } catch (error) {
            console.error('❌ Erro ao exportar DI:', error);
            this.showAlert('Erro ao exportar DI: ' + error.message, 'danger');
        }
    }
    
    async confirmClearDatabase() {
        if (!confirm('⚠️ ATENÇÃO: Esta ação irá REMOVER TODOS os dados do banco permanentemente!\n\nTem certeza que deseja continuar?')) {
            return;
        }
        
        if (!confirm('🚨 CONFIRMAÇÃO FINAL: Todos os dados serão perdidos!\n\nEsta ação NÃO PODE ser desfeita. Continuar?')) {
            return;
        }
        
        try {
            const success = await this.core.clearAllData();
            if (success) {
                this.showAlert('Base de dados limpa com sucesso!', 'success');
                await this.refreshStats();
                await this.refreshDIs();
            } else {
                this.showAlert('Erro ao limpar base de dados', 'danger');
            }
        } catch (error) {
            console.error('❌ Erro ao limpar base:', error);
            this.showAlert('Erro ao limpar base: ' + error.message, 'danger');
        }
    }
    
    /**
     * Utility methods
     */
    getLoadingHTML(message = 'Carregando...') {
        return `
            <div class="dashboard-loading">
                <div class="dashboard-spinner"></div>
                <p>${message}</p>
            </div>
        `;
    }
    
    getErrorHTML(message) {
        return `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> ${message}
            </div>
        `;
    }
    
    getEmptyStateHTML(icon, title, description, actions = []) {
        const actionsHTML = actions.map(action => 
            `<a href="${action.href || '#'}" class="btn ${action.class || 'btn-primary'}">${action.text}</a>`
        ).join(' ');
        
        return `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="bi bi-${icon}"></i>
                </div>
                <h3>${title}</h3>
                <p>${description}</p>
                ${actionsHTML}
            </div>
        `;
    }
    
    getStatusBadge(processingState) {
        switch (processingState) {
            case 'DI_COMPLETE_FROM_XML':
                return '<span class="status-badge complete">Completa XML</span>';
            case 'ICMS_CALCULATED':
                return '<span class="status-badge processing">ICMS Calculado</span>';
            case 'FINAL_COMPLETE':
                return '<span class="status-badge complete">Finalizada</span>';
            default:
                return '<span class="status-badge pending">Em Processo</span>';
        }
    }
    
    formatCNPJ(cnpj) {
        if (!cnpj) return 'N/A';
        return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    formatMoney(value) {
        if (!value || value === 0) return '0,00';
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    }
    
    showAlert(message, type = 'info') {
        const alertHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        const container = document.querySelector('.container-fluid') || document.body;
        const alertDiv = document.createElement('div');
        alertDiv.innerHTML = alertHTML;
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
    
    animateCards(container) {
        const cards = container.querySelectorAll('.stat-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'all 0.3s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }
}

// Exportar para uso global
window.DashboardComponents = DashboardComponents;