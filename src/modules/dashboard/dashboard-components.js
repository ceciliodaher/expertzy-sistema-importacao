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
        this.currentPageSize = 50;
        this.currentFilters = {};
        this.navigationStack = [{ level: 'declaracoes', title: 'Declarações', id: null }];
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
                
                <div class="stat-card pricing-card">
                    <div class="stat-value">${stats.itemsPrecificados || 0}</div>
                    <div class="stat-label">Itens Precificados</div>
                    <div class="stat-description">Precificação individual</div>
                </div>
                
                <div class="stat-card pricing-card">
                    <div class="stat-value">R$ ${this.formatCurrency(stats.precoMedio || 0)}</div>
                    <div class="stat-label">Preço Médio</div>
                    <div class="stat-description">Preços de venda calculados</div>
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

    // Sistema de moedas correto com símbolos
    formatCurrency(value, currency = 'BRL') {
        if (!value || value === 0) return currency === 'BRL' ? 'R$ 0,00' : '$ 0.00';
        
        if (currency === 'USD') {
            return '$ ' + new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(value);
        } else {
            return 'R$ ' + new Intl.NumberFormat('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(value);
        }
    }

    // Formato para valores monetários com detecção automática de moeda
    formatMoneyWithCurrency(value, currencyCode = null) {
        if (!value || value === 0) return currencyCode === 'USD' ? '$ 0.00' : 'R$ 0,00';
        
        // Se não especificado, detecta pela magnitude (valores USD geralmente menores)
        const detectedCurrency = currencyCode || (value > 10000 ? 'BRL' : 'USD');
        
        return this.formatCurrency(value, detectedCurrency);
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

    /**
     * Sistema de Paginação Avançada
     */
    renderPaginationControls(currentPage, totalPages, totalRecords, pageSize = 50) {
        if (totalPages <= 1) return '';
        
        const startRecord = (currentPage - 1) * pageSize + 1;
        const endRecord = Math.min(currentPage * pageSize, totalRecords);
        
        // Gerar números de página visíveis
        const visiblePages = this.getVisiblePages(currentPage, totalPages);
        
        return `
            <div class="pagination-container">
                <div class="pagination-info">
                    <span class="records-info">
                        Mostrando ${startRecord}-${endRecord} de ${totalRecords.toLocaleString('pt-BR')} registros
                    </span>
                    <div class="page-size-selector">
                        <label>Registros por página:</label>
                        <select class="form-select form-select-sm" onchange="dashboardComponents.changePageSize(this.value)">
                            <option value="10" ${pageSize === 10 ? 'selected' : ''}>10</option>
                            <option value="25" ${pageSize === 25 ? 'selected' : ''}>25</option>
                            <option value="50" ${pageSize === 50 ? 'selected' : ''}>50</option>
                            <option value="100" ${pageSize === 100 ? 'selected' : ''}>100</option>
                            <option value="250" ${pageSize === 250 ? 'selected' : ''}>250</option>
                        </select>
                    </div>
                </div>
                
                <nav aria-label="Navegação de páginas">
                    <ul class="pagination pagination-sm">
                        <!-- Primeira página -->
                        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                            <button class="page-link" onclick="dashboardComponents.goToPage(1)" ${currentPage === 1 ? 'disabled' : ''}>
                                <i class="bi bi-chevron-double-left"></i>
                            </button>
                        </li>
                        
                        <!-- Página anterior -->
                        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                            <button class="page-link" onclick="dashboardComponents.goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
                                <i class="bi bi-chevron-left"></i>
                            </button>
                        </li>
                        
                        <!-- Números de página -->
                        ${visiblePages.map(page => `
                            <li class="page-item ${page === currentPage ? 'active' : ''}">
                                <button class="page-link" onclick="dashboardComponents.goToPage(${page})">${page}</button>
                            </li>
                        `).join('')}
                        
                        <!-- Próxima página -->
                        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                            <button class="page-link" onclick="dashboardComponents.goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
                                <i class="bi bi-chevron-right"></i>
                            </button>
                        </li>
                        
                        <!-- Última página -->
                        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                            <button class="page-link" onclick="dashboardComponents.goToPage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>
                                <i class="bi bi-chevron-double-right"></i>
                            </button>
                        </li>
                    </ul>
                </nav>
                
                <!-- Jump to page -->
                <div class="jump-to-page">
                    <label>Ir para página:</label>
                    <input type="number" class="form-control form-control-sm" 
                           min="1" max="${totalPages}" 
                           placeholder="${currentPage}"
                           onkeypress="if(event.key==='Enter') dashboardComponents.jumpToPage(this.value)">
                    <button class="btn btn-sm btn-outline-primary" onclick="dashboardComponents.jumpToPage(document.querySelector('.jump-to-page input').value)">
                        Ir
                    </button>
                </div>
            </div>
        `;
    }

    // Calcular páginas visíveis para paginação
    getVisiblePages(currentPage, totalPages, maxVisible = 5) {
        const pages = [];
        let start, end;
        
        if (totalPages <= maxVisible) {
            start = 1;
            end = totalPages;
        } else {
            const half = Math.floor(maxVisible / 2);
            start = Math.max(1, currentPage - half);
            end = Math.min(totalPages, start + maxVisible - 1);
            
            if (end - start < maxVisible - 1) {
                start = Math.max(1, end - maxVisible + 1);
            }
        }
        
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        
        return pages;
    }

    // Navegar para página específica
    async goToPage(page) {
        const currentTable = this.getCurrentActiveTable();
        if (!currentTable) return;
        
        this.showLoadingOverlay('Carregando página...');
        
        try {
            await this.renderTable(currentTable, page, this.currentPageSize, this.currentFilters);
        } catch (error) {
            console.error('❌ Erro ao navegar para página:', error);
            this.showAlert('Erro ao carregar página: ' + error.message, 'danger');
        } finally {
            this.hideLoadingOverlay();
        }
    }

    // Saltar para página
    jumpToPage(pageNumber) {
        const page = parseInt(pageNumber);
        if (!page || page < 1) return;
        
        this.goToPage(page);
    }

    // Alterar tamanho da página
    async changePageSize(newSize) {
        this.currentPageSize = parseInt(newSize);
        const currentTable = this.getCurrentActiveTable();
        if (!currentTable) return;
        
        this.showLoadingOverlay('Aplicando novo tamanho...');
        
        try {
            // Voltar para primeira página com novo tamanho
            await this.renderTable(currentTable, 1, this.currentPageSize, this.currentFilters);
        } catch (error) {
            console.error('❌ Erro ao alterar tamanho da página:', error);
            this.showAlert('Erro ao alterar tamanho da página: ' + error.message, 'danger');
        } finally {
            this.hideLoadingOverlay();
        }
    }

    // Obter tabela ativa atual
    getCurrentActiveTable() {
        const activeTab = document.querySelector('.table-structure-tabs .nav-link.active');
        return activeTab ? activeTab.textContent.toLowerCase().trim() : 'declaracoes';
    }

    // Loading overlay para transições
    showLoadingOverlay(message = 'Carregando...') {
        const existing = document.querySelector('.pagination-loading');
        if (existing) existing.remove();
        
        const overlay = document.createElement('div');
        overlay.className = 'pagination-loading';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner-border text-primary" role="status"></div>
                <span class="ms-2">${message}</span>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }

    hideLoadingOverlay() {
        const overlay = document.querySelector('.pagination-loading');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        }
    }

    /**
     * Sistema de Filtros Dinâmicos e Busca Global
     */
    renderAdvancedFilters(tableName) {
        const filterConfig = this.getFilterConfig(tableName);
        
        return `
            <div class="advanced-filters-container">
                <div class="filters-header">
                    <h6><i class="bi bi-funnel"></i> Filtros Avançados</h6>
                    <div class="filter-actions">
                        <button class="btn btn-sm btn-outline-secondary" onclick="dashboardComponents.clearAllFilters()">
                            <i class="bi bi-x-circle"></i> Limpar Filtros
                        </button>
                        <button class="btn btn-sm btn-outline-primary" onclick="dashboardComponents.toggleFilters()">
                            <i class="bi bi-chevron-down" id="filterToggleIcon"></i>
                        </button>
                    </div>
                </div>
                
                <div class="filters-body" id="filtersBody" style="display: none;">
                    <!-- Busca Global -->
                    <div class="row mb-3">
                        <div class="col-12">
                            <label class="form-label">Busca Global</label>
                            <div class="search-global-container">
                                <input type="text" class="form-control" 
                                       placeholder="Buscar em todos os campos..." 
                                       id="globalSearch"
                                       onkeyup="dashboardComponents.handleGlobalSearch(this.value)">
                                <i class="bi bi-search search-icon"></i>
                                <div class="search-results-counter" id="searchCounter" style="display: none;"></div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Filtros Específicos por Campo -->
                    <div class="row">
                        ${filterConfig.map(filter => `
                            <div class="col-md-4 mb-3">
                                <label class="form-label">${filter.label}</label>
                                ${this.renderFilterControl(filter)}
                            </div>
                        `).join('')}
                    </div>
                    
                    <!-- Filtros Aplicados (Tags) -->
                    <div class="applied-filters" id="appliedFilters"></div>
                </div>
            </div>
        `;
    }

    // Configuração de filtros por tabela
    getFilterConfig(tableName) {
        const configs = {
            'declaracoes': [
                { field: 'numero_di', type: 'text', label: 'Número DI' },
                { field: 'importador_cnpj', type: 'text', label: 'CNPJ Importador' },
                { field: 'importador_endereco_uf', type: 'select', label: 'UF', options: ['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'GO', 'PE', 'CE', 'ES'] },
                { field: 'processing_state', type: 'select', label: 'Estado', options: ['DI_COMPLETE_FROM_XML', 'ICMS_CALCULATED', 'FINAL_COMPLETE'] },
                { field: 'data_processamento', type: 'date', label: 'Data Processamento' }
            ],
            'adicoes': [
                { field: 'ncm', type: 'text', label: 'NCM' },
                { field: 'numero_adicao', type: 'text', label: 'Número Adição' },
                { field: 'valor_reais', type: 'number', label: 'Valor Mínimo (R$)' },
                { field: 'ii_aliquota_ad_valorem', type: 'number', label: 'Alíquota II (%)' }
            ],
            'produtos': [
                { field: 'ncm', type: 'text', label: 'NCM' },
                { field: 'descricao_mercadoria', type: 'text', label: 'Descrição' },
                { field: 'unidade_medida', type: 'select', label: 'Unidade', options: ['UN', 'KG', 'MT', 'LT', 'M2', 'M3'] },
                { field: 'valor_unitario_brl', type: 'number', label: 'Valor Unitário Min (R$)' }
            ],
            'despesas_aduaneiras': [
                { field: 'tipo', type: 'select', label: 'Tipo', options: ['SISCOMEX', 'AFRMM', 'CAPATAZIA', 'ANTI_DUMPING'] },
                { field: 'codigo_receita', type: 'text', label: 'Código Receita' },
                { field: 'valor', type: 'number', label: 'Valor Mínimo (R$)' },
                { field: 'origem', type: 'select', label: 'Origem', options: ['XML', 'CALCULADO', 'MANUAL'] }
            ]
        };
        
        return configs[tableName] || [];
    }

    // Renderizar controle de filtro específico
    renderFilterControl(filter) {
        switch (filter.type) {
            case 'select':
                return `
                    <select class="form-select" onchange="dashboardComponents.applyFieldFilter('${filter.field}', this.value, '${filter.type}')">
                        <option value="">Todos</option>
                        ${filter.options.map(option => `<option value="${option}">${option}</option>`).join('')}
                    </select>
                `;
            case 'number':
                return `
                    <input type="number" class="form-control" 
                           placeholder="Valor mínimo"
                           onchange="dashboardComponents.applyFieldFilter('${filter.field}', this.value, '${filter.type}')"
                           step="0.01">
                `;
            case 'date':
                return `
                    <input type="date" class="form-control" 
                           onchange="dashboardComponents.applyFieldFilter('${filter.field}', this.value, '${filter.type}')">
                `;
            default: // text
                return `
                    <input type="text" class="form-control" 
                           placeholder="Digite para filtrar..."
                           onkeyup="dashboardComponents.debounceFieldFilter('${filter.field}', this.value, '${filter.type}')"
                           autocomplete="off">
                `;
        }
    }

    // Busca global com debounce
    handleGlobalSearch(query) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(async () => {
            const currentTable = this.getCurrentActiveTable();
            const counter = document.getElementById('searchCounter');
            
            if (query.trim()) {
                this.currentFilters['_global'] = query;
                counter.style.display = 'block';
                counter.innerHTML = '<div class="spinner-border spinner-border-sm"></div>';
                
                try {
                    await this.renderTable(currentTable, 1, this.currentPageSize, this.currentFilters);
                    const totalRecords = await this.core.getTableCount(currentTable, this.currentFilters);
                    counter.innerHTML = `${totalRecords} resultado(s) encontrado(s)`;
                } catch (error) {
                    console.error('❌ Erro na busca global:', error);
                    counter.innerHTML = 'Erro na busca';
                }
            } else {
                delete this.currentFilters['_global'];
                counter.style.display = 'none';
                await this.renderTable(currentTable, 1, this.currentPageSize, this.currentFilters);
            }
            
            this.updateAppliedFilters();
        }, 300);
    }

    // Aplicar filtro por campo específico
    applyFieldFilter(field, value, type) {
        if (value && value.trim()) {
            this.currentFilters[field] = { value: value.trim(), type };
        } else {
            delete this.currentFilters[field];
        }
        
        this.refreshCurrentTable();
        this.updateAppliedFilters();
    }

    // Filtro por campo com debounce (para text inputs)
    debounceFieldFilter(field, value, type) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.applyFieldFilter(field, value, type);
        }, 500);
    }

    // Atualizar tabela com filtros atuais
    async refreshCurrentTable() {
        const currentTable = this.getCurrentActiveTable();
        if (!currentTable) return;
        
        try {
            await this.renderTable(currentTable, 1, this.currentPageSize, this.currentFilters);
        } catch (error) {
            console.error('❌ Erro ao atualizar tabela:', error);
            this.showAlert('Erro ao aplicar filtros: ' + error.message, 'danger');
        }
    }

    // Exibir filtros aplicados como tags
    updateAppliedFilters() {
        const container = document.getElementById('appliedFilters');
        if (!container) return;
        
        const filterTags = [];
        
        Object.entries(this.currentFilters).forEach(([key, filter]) => {
            if (key === '_global') {
                filterTags.push(`
                    <span class="filter-tag global-filter">
                        <i class="bi bi-search"></i> Busca: "${filter}"
                        <button onclick="dashboardComponents.removeFilter('${key}')" class="btn-close-filter">
                            <i class="bi bi-x"></i>
                        </button>
                    </span>
                `);
            } else {
                const displayValue = typeof filter === 'object' ? filter.value : filter;
                filterTags.push(`
                    <span class="filter-tag field-filter">
                        <strong>${key}:</strong> ${displayValue}
                        <button onclick="dashboardComponents.removeFilter('${key}')" class="btn-close-filter">
                            <i class="bi bi-x"></i>
                        </button>
                    </span>
                `);
            }
        });
        
        if (filterTags.length > 0) {
            container.innerHTML = `
                <div class="applied-filters-header">
                    <small class="text-muted">Filtros aplicados:</small>
                </div>
                <div class="filter-tags-container">
                    ${filterTags.join('')}
                </div>
            `;
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }

    // Remover filtro específico
    async removeFilter(key) {
        delete this.currentFilters[key];
        
        // Limpar também o campo de input correspondente
        if (key === '_global') {
            const globalSearch = document.getElementById('globalSearch');
            if (globalSearch) globalSearch.value = '';
            
            const counter = document.getElementById('searchCounter');
            if (counter) counter.style.display = 'none';
        }
        
        await this.refreshCurrentTable();
        this.updateAppliedFilters();
    }

    // Limpar todos os filtros
    async clearAllFilters() {
        this.currentFilters = {};
        
        // Limpar inputs
        const filterInputs = document.querySelectorAll('#filtersBody input, #filtersBody select');
        filterInputs.forEach(input => {
            input.value = '';
        });
        
        const counter = document.getElementById('searchCounter');
        if (counter) counter.style.display = 'none';
        
        await this.refreshCurrentTable();
        this.updateAppliedFilters();
    }

    // Toggle de visibilidade dos filtros
    toggleFilters() {
        const body = document.getElementById('filtersBody');
        const icon = document.getElementById('filterToggleIcon');
        
        if (body.style.display === 'none') {
            body.style.display = 'block';
            icon.className = 'bi bi-chevron-up';
        } else {
            body.style.display = 'none';
            icon.className = 'bi bi-chevron-down';
        }
    }

    /**
     * Sistema de Drill-Down Navigation (DI → Adição → Produto)
     */
    renderBreadcrumbNavigation() {
        if (!this.navigationStack || this.navigationStack.length === 0) {
            this.navigationStack = [{ level: 'declaracoes', title: 'Declarações', id: null }];
        }
        
        return `
            <nav aria-label="breadcrumb" class="drill-down-breadcrumb">
                <ol class="breadcrumb mb-0">
                    ${this.navigationStack.map((item, index) => `
                        <li class="breadcrumb-item ${index === this.navigationStack.length - 1 ? 'active' : ''}">
                            ${index === this.navigationStack.length - 1 ? 
                                `<span><i class="${this.getLevelIcon(item.level)}"></i> ${item.title}</span>` :
                                `<button class="btn-breadcrumb" onclick="dashboardComponents.navigateToLevel(${index})">
                                    <i class="${this.getLevelIcon(item.level)}"></i> ${item.title}
                                </button>`
                            }
                        </li>
                    `).join('')}
                </ol>
                
                <!-- Ações de navegação -->
                <div class="navigation-actions">
                    ${this.navigationStack.length > 1 ? `
                        <button class="btn btn-sm btn-outline-secondary" onclick="dashboardComponents.navigateBack()">
                            <i class="bi bi-arrow-left"></i> Voltar
                        </button>
                    ` : ''}
                    
                    <button class="btn btn-sm btn-outline-primary" onclick="dashboardComponents.resetNavigation()">
                        <i class="bi bi-house"></i> Início
                    </button>
                </div>
            </nav>
        `;
    }

    // Obter ícone para cada nível
    getLevelIcon(level) {
        const icons = {
            'declaracoes': 'bi bi-file-earmark-text',
            'adicoes': 'bi bi-plus-square',
            'produtos': 'bi bi-box',
            'despesas_aduaneiras': 'bi bi-currency-dollar'
        };
        return icons[level] || 'bi bi-folder';
    }

    // Navegar para nível específico no breadcrumb
    async navigateToLevel(levelIndex) {
        // Cortar o stack até o nível desejado
        this.navigationStack = this.navigationStack.slice(0, levelIndex + 1);
        const currentLevel = this.navigationStack[levelIndex];
        
        // Recarregar dados para esse nível
        await this.loadLevelData(currentLevel);
        this.updateBreadcrumbDisplay();
    }

    // Voltar um nível
    async navigateBack() {
        if (this.navigationStack.length <= 1) return;
        
        this.navigationStack.pop();
        const currentLevel = this.navigationStack[this.navigationStack.length - 1];
        
        await this.loadLevelData(currentLevel);
        this.updateBreadcrumbDisplay();
    }

    // Resetar para início
    async resetNavigation() {
        this.navigationStack = [{ level: 'declaracoes', title: 'Declarações', id: null }];
        this.currentFilters = {};
        
        await this.loadLevelData(this.navigationStack[0]);
        this.updateBreadcrumbDisplay();
    }

    // Carregar dados para um nível específico
    async loadLevelData(levelInfo) {
        this.showLoadingOverlay(`Carregando ${levelInfo.title}...`);
        
        try {
            // Aplicar filtros de hierarquia baseado no nível atual
            const hierarchyFilters = this.buildHierarchyFilters(levelInfo);
            const combinedFilters = { ...this.currentFilters, ...hierarchyFilters };
            
            await this.renderTable(levelInfo.level, 1, this.currentPageSize, combinedFilters);
            
            // Atualizar aba ativa
            const tabs = document.querySelectorAll('.table-structure-tabs .nav-link');
            tabs.forEach(tab => tab.classList.remove('active'));
            
            const targetTab = Array.from(tabs).find(tab => 
                tab.textContent.toLowerCase().trim() === levelInfo.level
            );
            if (targetTab) targetTab.classList.add('active');
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados do nível:', error);
            this.showAlert('Erro ao carregar dados: ' + error.message, 'danger');
        } finally {
            this.hideLoadingOverlay();
        }
    }

    // Construir filtros de hierarquia
    buildHierarchyFilters(levelInfo) {
        const filters = {};
        
        // Filtrar baseado na hierarquia DI → Adição → Produto
        this.navigationStack.forEach(stackItem => {
            if (stackItem.id && stackItem.level !== levelInfo.level) {
                switch (stackItem.level) {
                    case 'declaracoes':
                        if (levelInfo.level === 'adicoes' || levelInfo.level === 'produtos') {
                            filters['di_id'] = { value: stackItem.id, type: 'number' };
                        }
                        break;
                    case 'adicoes':
                        if (levelInfo.level === 'produtos') {
                            filters['adicao_id'] = { value: stackItem.id, type: 'number' };
                        }
                        break;
                }
            }
        });
        
        return filters;
    }

    // Atualizar exibição do breadcrumb
    updateBreadcrumbDisplay() {
        const container = document.querySelector('.drill-down-breadcrumb');
        if (container) {
            container.outerHTML = this.renderBreadcrumbNavigation();
        }
    }

    // Drill down para próximo nível (chamado por botões das tabelas)
    async drillDownTo(level, id, title) {
        const levelConfig = {
            'adicoes': { level: 'adicoes', title: `Adições de ${title}` },
            'produtos': { level: 'produtos', title: `Produtos de ${title}` },
            'despesas_aduaneiras': { level: 'despesas_aduaneiras', title: `Despesas de ${title}` }
        };
        
        if (!levelConfig[level]) {
            console.error('❌ Nível de drill-down inválido:', level);
            return;
        }
        
        // Adicionar novo nível ao stack
        const newLevel = { 
            level: levelConfig[level].level, 
            title: levelConfig[level].title, 
            id: id 
        };
        
        this.navigationStack.push(newLevel);
        
        // Carregar dados do novo nível
        await this.loadLevelData(newLevel);
        this.updateBreadcrumbDisplay();
    }

    // Renderizar botão de drill-down nas células da tabela
    renderDrillDownButton(targetLevel, id, title, icon = 'bi bi-arrow-right') {
        const levelNames = {
            'adicoes': 'adições',
            'produtos': 'produtos', 
            'despesas_aduaneiras': 'despesas'
        };
        
        return `
            <button class="btn btn-sm btn-outline-primary drill-down-btn" 
                    onclick="dashboardComponents.drillDownTo('${targetLevel}', ${id}, '${title.replace(/'/g, "&#39;")}')"
                    title="Ver ${levelNames[targetLevel]} de ${title}">
                <i class="${icon}"></i>
            </button>
        `;
    }

    // Context menu para ações de drill-down
    renderContextMenu(record, recordType) {
        const actions = [];
        
        switch (recordType) {
            case 'declaracoes':
                actions.push(
                    { label: 'Ver Adições', action: `drillDownTo('adicoes', ${record.id}, 'DI ${record.numero_di}')`, icon: 'bi bi-plus-square' },
                    { label: 'Ver Despesas', action: `drillDownTo('despesas_aduaneiras', ${record.id}, 'DI ${record.numero_di}')`, icon: 'bi bi-currency-dollar' }
                );
                break;
            case 'adicoes':
                actions.push(
                    { label: 'Ver Produtos', action: `drillDownTo('produtos', ${record.id}, 'Adição ${record.numero_adicao}')`, icon: 'bi bi-box' }
                );
                break;
        }
        
        if (actions.length === 0) return '';
        
        return `
            <div class="dropdown">
                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                        type="button" data-bs-toggle="dropdown">
                    <i class="bi bi-three-dots"></i>
                </button>
                <ul class="dropdown-menu">
                    ${actions.map(action => `
                        <li>
                            <button class="dropdown-item" onclick="dashboardComponents.${action.action}">
                                <i class="${action.icon}"></i> ${action.label}
                            </button>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    // Hover preview para dados relacionados
    async showHoverPreview(recordType, id, event) {
        const preview = document.getElementById('hoverPreview');
        if (preview) preview.remove();
        
        try {
            let previewData;
            let previewHTML = '';
            
            switch (recordType) {
                case 'declaracoes':
                    previewData = await this.core.getDICompleteStats(id);
                    previewHTML = this.renderDIPreview(previewData);
                    break;
                case 'adicoes':
                    previewData = await this.core.getAdicaoCompleteStats(id);
                    previewHTML = this.renderAdicaoPreview(previewData);
                    break;
            }
            
            if (previewHTML) {
                this.showTooltipPreview(previewHTML, event);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar preview:', error);
        }
    }

    // Renderizar preview para DI
    renderDIPreview(stats) {
        return `
            <div class="hover-preview-content">
                <h6><i class="bi bi-file-earmark-text"></i> DI ${stats.numero_di}</h6>
                <div class="preview-stats">
                    <div><strong>Adições:</strong> ${stats.totalAdicoes || 0}</div>
                    <div><strong>Produtos:</strong> ${stats.totalProdutos || 0}</div>
                    <div><strong>Valor Total:</strong> R$ ${this.formatMoney(stats.valorTotal || 0)}</div>
                    <div><strong>Impostos:</strong> R$ ${this.formatMoney(stats.totalImpostos || 0)}</div>
                </div>
            </div>
        `;
    }

    // Renderizar preview para Adição
    renderAdicaoPreview(stats) {
        return `
            <div class="hover-preview-content">
                <h6><i class="bi bi-plus-square"></i> Adição ${stats.numero_adicao}</h6>
                <div class="preview-stats">
                    <div><strong>NCM:</strong> ${stats.ncm || 'N/A'}</div>
                    <div><strong>Produtos:</strong> ${stats.totalProdutos || 0}</div>
                    <div><strong>Valor:</strong> R$ ${this.formatMoney(stats.valor || 0)}</div>
                    <div><strong>Impostos:</strong> R$ ${this.formatMoney(stats.totalImpostos || 0)}</div>
                </div>
            </div>
        `;
    }

    // Mostrar tooltip de preview
    showTooltipPreview(content, event) {
        const tooltip = document.createElement('div');
        tooltip.id = 'hoverPreview';
        tooltip.className = 'hover-preview-tooltip';
        tooltip.innerHTML = content;
        
        document.body.appendChild(tooltip);
        
        // Posicionar próximo ao mouse
        const rect = tooltip.getBoundingClientRect();
        const x = Math.min(event.pageX + 10, window.innerWidth - rect.width - 20);
        const y = Math.min(event.pageY + 10, window.innerHeight - rect.height - 20);
        
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
        
        // Remover depois de 3 segundos
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.remove();
            }
        }, 3000);
    }

    /**
     * Otimizações de Performance para Grandes Volumes
     */
    
    // Virtual Scrolling para listas grandes (>1000 itens)
    renderVirtualizedTable(data, containerHeight = 400, rowHeight = 50) {
        if (data.length <= 100) {
            // Para listas pequenas, usar renderização normal
            return this.renderNormalTable(data);
        }
        
        const visibleRows = Math.ceil(containerHeight / rowHeight) + 5; // Buffer rows
        
        return `
            <div class="virtualized-table-container" style="height: ${containerHeight}px; overflow-y: auto;">
                <div class="virtualized-content" style="height: ${data.length * rowHeight}px; position: relative;">
                    <div class="visible-rows" id="visibleRows">
                        <!-- Rows will be dynamically populated -->
                    </div>
                </div>
            </div>
        `;
    }

    // Inicializar virtual scrolling
    initVirtualScrolling(tableContainer, data, renderRowFunction) {
        const scrollContainer = tableContainer.querySelector('.virtualized-table-container');
        const contentDiv = tableContainer.querySelector('.virtualized-content');
        const visibleRowsDiv = tableContainer.querySelector('.visible-rows');
        
        let startIndex = 0;
        let endIndex = Math.min(20, data.length);
        
        // Renderizar linhas iniciais
        this.updateVirtualRows(visibleRowsDiv, data, startIndex, endIndex, renderRowFunction);
        
        // Scroll listener com throttling
        let scrollTimeout;
        scrollContainer.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const scrollTop = scrollContainer.scrollTop;
                const rowHeight = 50;
                const containerHeight = scrollContainer.clientHeight;
                
                startIndex = Math.floor(scrollTop / rowHeight);
                endIndex = Math.min(startIndex + Math.ceil(containerHeight / rowHeight) + 10, data.length);
                
                this.updateVirtualRows(visibleRowsDiv, data, startIndex, endIndex, renderRowFunction);
            }, 16); // ~60fps
        });
    }

    // Atualizar linhas visíveis no virtual scroll
    updateVirtualRows(container, data, startIndex, endIndex, renderRowFunction) {
        const fragment = document.createDocumentFragment();
        const rowHeight = 50;
        
        // Limpar container
        container.innerHTML = '';
        
        // Renderizar apenas as linhas visíveis
        for (let i = startIndex; i < endIndex; i++) {
            if (data[i]) {
                const rowDiv = document.createElement('div');
                rowDiv.style.position = 'absolute';
                rowDiv.style.top = (i * rowHeight) + 'px';
                rowDiv.style.width = '100%';
                rowDiv.style.height = rowHeight + 'px';
                rowDiv.innerHTML = renderRowFunction(data[i], i);
                fragment.appendChild(rowDiv);
            }
        }
        
        container.appendChild(fragment);
    }

    // Cache inteligente para consultas frequentes
    initPerformanceCache() {
        this.performanceCache = {
            queries: new Map(),
            stats: new Map(),
            maxSize: 50,
            ttl: 5 * 60 * 1000 // 5 minutos
        };
    }

    // Obter dados com cache
    async getCachedData(cacheKey, queryFunction) {
        if (!this.performanceCache) {
            this.initPerformanceCache();
        }
        
        const cached = this.performanceCache.queries.get(cacheKey);
        const now = Date.now();
        
        // Verificar se o cache é válido
        if (cached && (now - cached.timestamp) < this.performanceCache.ttl) {
            console.log(`📦 Cache hit: ${cacheKey}`);
            return cached.data;
        }
        
        // Executar consulta e armazenar no cache
        console.log(`🔍 Cache miss: ${cacheKey}`);
        const data = await queryFunction();
        
        // Limitar tamanho do cache
        if (this.performanceCache.queries.size >= this.performanceCache.maxSize) {
            const firstKey = this.performanceCache.queries.keys().next().value;
            this.performanceCache.queries.delete(firstKey);
        }
        
        this.performanceCache.queries.set(cacheKey, {
            data,
            timestamp: now
        });
        
        return data;
    }

    // Lazy loading de dados relacionados
    async loadDataLazy(tableName, page, filters, signal) {
        const abortController = signal || new AbortController();
        
        try {
            // Mostrar skeleton loading
            this.showSkeletonLoading(tableName);
            
            // Carregar dados em chunks menores
            const chunkSize = 25;
            const startIndex = (page - 1) * this.currentPageSize;
            const chunks = Math.ceil(this.currentPageSize / chunkSize);
            
            let allData = [];
            
            for (let chunk = 0; chunk < chunks; chunk++) {
                if (abortController.signal.aborted) {
                    throw new Error('Operação cancelada');
                }
                
                const chunkStart = startIndex + (chunk * chunkSize);
                const chunkEnd = Math.min(chunkStart + chunkSize, startIndex + this.currentPageSize);
                
                const chunkData = await this.core.getCompleteTableData(
                    tableName, 
                    Math.floor(chunkStart / chunkSize) + 1, 
                    chunkSize, 
                    filters
                );
                
                allData = allData.concat(chunkData.data || []);
                
                // Update progress
                this.updateLoadingProgress(chunk + 1, chunks);
                
                // Small delay to prevent UI blocking
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            
            return {
                data: allData,
                total: allData.length,
                page: page
            };
            
        } catch (error) {
            if (error.message === 'Operação cancelada') {
                console.log('⏹️ Carregamento cancelado pelo usuário');
            } else {
                console.error('❌ Erro no carregamento lazy:', error);
            }
            throw error;
        } finally {
            this.hideSkeletonLoading();
        }
    }

    // Skeleton loading para UX melhor
    showSkeletonLoading(tableName) {
        const tableContainer = document.getElementById('tableContent');
        if (!tableContainer) return;
        
        const skeletonRows = Array(5).fill(0).map(() => `
            <tr class="skeleton-row">
                <td><div class="skeleton-item"></div></td>
                <td><div class="skeleton-item"></div></td>
                <td><div class="skeleton-item"></div></td>
                <td><div class="skeleton-item"></div></td>
            </tr>
        `).join('');
        
        tableContainer.innerHTML = `
            <div class="skeleton-loading">
                <table class="table">
                    <tbody>${skeletonRows}</tbody>
                </table>
                <div class="loading-progress">
                    <div class="progress">
                        <div class="progress-bar" id="loadingProgressBar" style="width: 0%"></div>
                    </div>
                    <small class="text-muted" id="loadingProgressText">Carregando dados...</small>
                </div>
            </div>
        `;
    }

    hideSkeletonLoading() {
        const skeleton = document.querySelector('.skeleton-loading');
        if (skeleton) {
            skeleton.remove();
        }
    }

    updateLoadingProgress(current, total) {
        const progressBar = document.getElementById('loadingProgressBar');
        const progressText = document.getElementById('loadingProgressText');
        
        if (progressBar && progressText) {
            const percentage = (current / total) * 100;
            progressBar.style.width = percentage + '%';
            progressText.textContent = `Carregando... ${current}/${total} chunks`;
        }
    }

    // Debounce para operações custosas
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle para scroll events
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Memory management - limpeza periódica
    initMemoryManagement() {
        // Limpar cache a cada 10 minutos
        setInterval(() => {
            if (this.performanceCache) {
                const now = Date.now();
                for (const [key, value] of this.performanceCache.queries.entries()) {
                    if (now - value.timestamp > this.performanceCache.ttl) {
                        this.performanceCache.queries.delete(key);
                    }
                }
                console.log(`🧹 Cache limpo: ${this.performanceCache.queries.size} entradas restantes`);
            }
        }, 10 * 60 * 1000);
        
        // Monitorar uso de memória
        if (performance.memory) {
            setInterval(() => {
                const memory = performance.memory;
                const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
                const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
                
                if (usedMB > 100) { // Alert se usar mais que 100MB
                    console.warn(`⚠️ Alto uso de memória: ${usedMB}MB / ${totalMB}MB`);
                }
            }, 30000); // Check a cada 30 segundos
        }
    }

    // Métricas de performance
    startPerformanceMetrics(operation) {
        return {
            operation,
            startTime: performance.now(),
            startMemory: performance.memory ? performance.memory.usedJSHeapSize : 0
        };
    }

    endPerformanceMetrics(metrics) {
        const endTime = performance.now();
        const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
        
        const duration = Math.round(endTime - metrics.startTime);
        const memoryDelta = Math.round((endMemory - metrics.startMemory) / 1024); // KB
        
        console.log(`⚡ Performance - ${metrics.operation}: ${duration}ms, Memory: ${memoryDelta > 0 ? '+' : ''}${memoryDelta}KB`);
        
        // Alertar para operações lentas
        if (duration > 2000) {
            console.warn(`🐌 Operação lenta detectada: ${metrics.operation} (${duration}ms)`);
        }
        
        return { duration, memoryDelta };
    }

    // Otimização de DOM - batch updates
    batchDOMUpdates(updates) {
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                const fragment = document.createDocumentFragment();
                
                updates.forEach(update => {
                    if (typeof update === 'function') {
                        update(fragment);
                    }
                });
                
                resolve(fragment);
            });
        });
    }
}

// Exportar para uso global
window.DashboardComponents = DashboardComponents;