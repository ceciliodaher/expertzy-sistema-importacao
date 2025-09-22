/**
 * DataViewer - Módulo para visualização e gestão de DIs importadas
 * Sistema Expertzy - Visualização de dados do IndexedDB
 * 
 * FUNCIONALIDADES:
 * - Listar DIs salvas com paginação
 * - Buscar por número, CNPJ, data
 * - Ver detalhes completos de DI
 * - Exportar e deletar DIs
 * - Gestão do banco de dados
 */

class DataViewer {
    constructor(dbManager) {
        if (!dbManager) {
            throw new Error('IndexedDBManager é obrigatório para DataViewer');
        }
        
        this.dbManager = dbManager;
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.searchCriteria = null;
        this.sortField = 'data_processamento';
        this.sortOrder = 'desc';
    }

    /**
     * Lista DIs salvas com paginação
     * @param {number} page - Página atual
     * @param {number} limit - Itens por página
     * @returns {Promise<Object>} Lista de DIs e informações de paginação
     */
    async listSavedDIs(page = 1, limit = 10) {
        try {
            this.currentPage = page;
            this.itemsPerPage = limit;
            
            const offset = (page - 1) * limit;
            
            // Obter total de DIs
            const totalCount = await this.dbManager.db.declaracoes.count();
            
            // Buscar DIs com paginação
            let query = this.dbManager.db.declaracoes;
            
            // Aplicar ordenação
            if (this.sortField === 'data_processamento') {
                query = query.orderBy('data_processamento');
            } else if (this.sortField === 'numero_di') {
                query = query.orderBy('numero_di');
            }
            
            // Inverter ordem se necessário
            if (this.sortOrder === 'desc') {
                query = query.reverse();
            }
            
            // Aplicar paginação
            const dis = await query
                .offset(offset)
                .limit(limit)
                .toArray();
            
            // Formatar dados para exibição
            const formattedDIs = dis.map(di => ({
                id: di.id,
                numero_di: di.numero_di,
                data_processamento: di.data_processamento,
                importador_nome: di.importador_nome,
                importador_cnpj: di.importador_cnpj,
                valor_total_brl: di.valor_total_brl || 0,
                status: di.processing_status || 'new',
                ncms: di.ncms || [],
                quantidade_adicoes: di.quantidade_adicoes || 0
            }));
            
            // Calcular informações de paginação
            const totalPages = Math.ceil(totalCount / limit);
            
            return {
                success: true,
                data: formattedDIs,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: totalCount,
                    itemsPerPage: limit,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            };
            
        } catch (error) {
            console.error('Erro ao listar DIs:', error);
            return {
                success: false,
                error: error.message,
                data: [],
                pagination: null
            };
        }
    }

    /**
     * Busca DIs por critérios
     * @param {Object} criteria - Critérios de busca
     * @returns {Promise<Array>} Lista de DIs encontradas
     */
    async searchDIs(criteria) {
        try {
            let query = this.dbManager.db.declaracoes;
            
            // Buscar por número da DI
            if (criteria.numero_di) {
                query = query.where('numero_di').equals(criteria.numero_di);
            }
            
            // Buscar por CNPJ
            if (criteria.cnpj) {
                query = query.where('importador_cnpj').equals(criteria.cnpj);
            }
            
            // Buscar por período
            if (criteria.data_inicio && criteria.data_fim) {
                query = query.where('data_processamento')
                    .between(criteria.data_inicio, criteria.data_fim, true, true);
            }
            
            const results = await query.toArray();
            
            // Buscar por texto em nome da empresa
            if (criteria.texto) {
                const texto = criteria.texto.toLowerCase();
                return results.filter(di => 
                    di.importador_nome?.toLowerCase().includes(texto) ||
                    di.numero_di?.includes(criteria.texto)
                );
            }
            
            return results;
            
        } catch (error) {
            console.error('Erro ao buscar DIs:', error);
            return [];
        }
    }

    /**
     * Obtém detalhes completos de uma DI
     * @param {string} numeroDI - Número da DI
     * @returns {Promise<Object>} Detalhes completos
     */
    async viewDIDetails(numeroDI) {
        try {
            // Buscar DI principal
            const di = await this.dbManager.getDI(numeroDI);
            if (!di) {
                throw new Error(`DI ${numeroDI} não encontrada`);
            }
            
            // Buscar adições relacionadas
            const adicoes = await this.dbManager.db.adicoes
                .where('di_id')
                .equals(di.id)
                .toArray();
            
            // Buscar produtos de cada adição
            const adicoesComProdutos = await Promise.all(
                adicoes.map(async (adicao) => {
                    const produtos = await this.dbManager.db.produtos
                        .where('adicao_id')
                        .equals(adicao.id)
                        .toArray();
                    
                    return {
                        ...adicao,
                        produtos
                    };
                })
            );
            
            // Buscar despesas aduaneiras
            const despesas = await this.dbManager.db.despesas_aduaneiras
                .where('di_id')
                .equals(di.id)
                .toArray();
            
            // Buscar dados de carga
            const dadosCarga = await this.dbManager.db.dados_carga
                .where('di_id')
                .equals(di.id)
                .first();
            
            // Buscar histórico de operações
            const historico = await this.dbManager.db.historico_operacoes
                .where('detalhes')
                .anyOf([numeroDI, `DI ${numeroDI}`])
                .toArray();
            
            // Montar objeto completo
            return {
                success: true,
                data: {
                    declaracao: di,
                    adicoes: adicoesComProdutos,
                    despesas,
                    dadosCarga,
                    historico,
                    estatisticas: {
                        totalAdicoes: adicoes.length,
                        totalProdutos: adicoesComProdutos.reduce((sum, a) => sum + a.produtos.length, 0),
                        totalDespesas: despesas.reduce((sum, d) => sum + (d.valor || 0), 0),
                        valorTotal: di.valor_total_brl || 0
                    }
                }
            };
            
        } catch (error) {
            console.error('Erro ao obter detalhes da DI:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    /**
     * Exporta DI para arquivo JSON
     * @param {string} numeroDI - Número da DI
     * @returns {Promise<Object>} Dados exportados
     */
    async exportDI(numeroDI) {
        try {
            const details = await this.viewDIDetails(numeroDI);
            
            if (!details.success) {
                throw new Error(details.error);
            }
            
            // Preparar dados para exportação
            const exportData = {
                exportDate: new Date().toISOString(),
                version: '1.0',
                di: details.data
            };
            
            // Criar blob e download
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `DI_${numeroDI}_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            return {
                success: true,
                message: `DI ${numeroDI} exportada com sucesso`
            };
            
        } catch (error) {
            console.error('Erro ao exportar DI:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Deleta uma DI e todos os dados relacionados
     * @param {string} numeroDI - Número da DI
     * @returns {Promise<Object>} Resultado da operação
     */
    async deleteDI(numeroDI) {
        try {
            const di = await this.dbManager.getDI(numeroDI);
            if (!di) {
                throw new Error(`DI ${numeroDI} não encontrada`);
            }
            
            // Deletar em transação para garantir consistência
            await this.dbManager.db.transaction('rw',
                this.dbManager.db.declaracoes,
                this.dbManager.db.adicoes,
                this.dbManager.db.produtos,
                this.dbManager.db.despesas_aduaneiras,
                this.dbManager.db.dados_carga,
                this.dbManager.db.historico_operacoes,
                async () => {
                    // Buscar adições para deletar produtos
                    const adicoes = await this.dbManager.db.adicoes
                        .where('di_id')
                        .equals(di.id)
                        .toArray();
                    
                    // Deletar produtos de cada adição
                    for (const adicao of adicoes) {
                        await this.dbManager.db.produtos
                            .where('adicao_id')
                            .equals(adicao.id)
                            .delete();
                    }
                    
                    // Deletar adições
                    await this.dbManager.db.adicoes
                        .where('di_id')
                        .equals(di.id)
                        .delete();
                    
                    // Deletar despesas
                    await this.dbManager.db.despesas_aduaneiras
                        .where('di_id')
                        .equals(di.id)
                        .delete();
                    
                    // Deletar dados de carga
                    await this.dbManager.db.dados_carga
                        .where('di_id')
                        .equals(di.id)
                        .delete();
                    
                    // Deletar declaração
                    await this.dbManager.db.declaracoes
                        .delete(di.id);
                }
            );
            
            // Registrar no histórico
            await this.dbManager.logOperation(
                'delete_di',
                'DataViewer',
                { numero_di: numeroDI },
                'success'
            );
            
            return {
                success: true,
                message: `DI ${numeroDI} deletada com sucesso`
            };
            
        } catch (error) {
            console.error('Erro ao deletar DI:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Renderiza tabela HTML de DIs
     * @param {Object} listResult - Resultado de listSavedDIs
     * @returns {string} HTML da tabela
     */
    renderDITable(listResult) {
        if (!listResult.success || listResult.data.length === 0) {
            return '<p class="text-center">Nenhuma DI encontrada</p>';
        }
        
        let html = `
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>DI</th>
                        <th>Data</th>
                        <th>Empresa</th>
                        <th>CNPJ</th>
                        <th>Valor Total</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        for (const di of listResult.data) {
            const statusBadge = this.getStatusBadge(di.status);
            const valorFormatado = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(di.valor_total_brl);
            
            const dataFormatada = di.data_processamento ? 
                new Date(di.data_processamento).toLocaleDateString('pt-BR') : 
                '-';
            
            html += `
                <tr>
                    <td><strong>${di.numero_di}</strong></td>
                    <td>${dataFormatada}</td>
                    <td>${di.importador_nome || '-'}</td>
                    <td>${this.formatCNPJ(di.importador_cnpj)}</td>
                    <td>${valorFormatado}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="viewDIDetails('${di.numero_di}')">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="loadDIForProcessing('${di.numero_di}')">
                            <i class="fas fa-play"></i> Continuar
                        </button>
                        <button class="btn btn-sm btn-success" onclick="exportDI('${di.numero_di}')">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="confirmDeleteDI('${di.numero_di}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }
        
        html += '</tbody></table>';
        
        // Adicionar paginação
        if (listResult.pagination.totalPages > 1) {
            html += this.renderPagination(listResult.pagination);
        }
        
        return html;
    }

    /**
     * Renderiza controles de paginação
     * @param {Object} pagination - Informações de paginação
     * @returns {string} HTML da paginação
     */
    renderPagination(pagination) {
        let html = '<nav><ul class="pagination justify-content-center">';
        
        // Botão anterior
        html += `
            <li class="page-item ${!pagination.hasPrev ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="dataViewer.changePage(${pagination.currentPage - 1})">
                    Anterior
                </a>
            </li>
        `;
        
        // Páginas
        const startPage = Math.max(1, pagination.currentPage - 2);
        const endPage = Math.min(pagination.totalPages, pagination.currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <li class="page-item ${i === pagination.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="dataViewer.changePage(${i})">${i}</a>
                </li>
            `;
        }
        
        // Botão próximo
        html += `
            <li class="page-item ${!pagination.hasNext ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="dataViewer.changePage(${pagination.currentPage + 1})">
                    Próximo
                </a>
            </li>
        `;
        
        html += '</ul></nav>';
        
        return html;
    }

    /**
     * Muda página atual
     * @param {number} page - Nova página
     */
    async changePage(page) {
        if (page < 1) return;
        
        const result = await this.listSavedDIs(page, this.itemsPerPage);
        const tableContainer = document.getElementById('diListTableBody');
        
        if (tableContainer) {
            tableContainer.innerHTML = this.renderDITable(result);
        }
    }

    /**
     * Obtém badge HTML para status
     * @param {string} status - Status da DI
     * @returns {string} HTML do badge
     */
    getStatusBadge(status) {
        const badges = {
            'new': '<span class="badge bg-primary">Nova</span>',
            'xml_loaded': '<span class="badge bg-info">XML Carregado</span>',
            'taxes_calculated': '<span class="badge bg-warning">Impostos Calculados</span>',
            'exported': '<span class="badge bg-success">Exportada</span>',
            'completed': '<span class="badge bg-success">Completa</span>'
        };
        
        return badges[status] || '<span class="badge bg-secondary">Desconhecido</span>';
    }

    /**
     * Formata CNPJ para exibição
     * @param {string} cnpj - CNPJ sem formatação
     * @returns {string} CNPJ formatado
     */
    formatCNPJ(cnpj) {
        if (!cnpj) return '-';
        
        const cleaned = cnpj.replace(/\D/g, '');
        if (cleaned.length !== 14) return cnpj;
        
        return cleaned.replace(
            /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
            '$1.$2.$3/$4-$5'
        );
    }
}

// Export ES6 para uso em outros módulos
export { DataViewer };

// Tornar disponível globalmente no navegador
if (typeof window !== 'undefined') {
    window.DataViewer = DataViewer;
}