/**
 * AlertPanel.js - Componente Painel de Alertas ETL
 * 
 * RESPONSABILIDADE: Gerenciar exibição de alertas, erros e warnings
 * PRINCÍPIOS: NO FALLBACKS, Validação explícita, Fail-fast
 * INTEGRAÇÃO: Componente visual para alertas do sistema ETL
 * 
 * @author Sistema Expertzy - ETL Validation Module
 * @version 1.0.0
 */

class AlertPanel {
    constructor(containerElement) {
        // Validação rigorosa - NO FALLBACKS
        if (!containerElement) {
            throw new Error('AlertPanel: containerElement é obrigatório');
        }
        
        this.container = containerElement;
        this.alerts = [];
        this.maxAlerts = 50;
        
        // Configurações de tipos de alerta
        this.alertTypes = {
            error: {
                class: 'alert-danger',
                icon: 'bi-x-circle-fill',
                priority: 3,
                title: 'Erro'
            },
            warning: {
                class: 'alert-warning', 
                icon: 'bi-exclamation-triangle-fill',
                priority: 2,
                title: 'Aviso'
            },
            info: {
                class: 'alert-info',
                icon: 'bi-info-circle-fill',
                priority: 1,
                title: 'Informação'
            }
        };
        
        // Configurações de exibição
        this.config = {
            animations: {
                enabled: true,
                duration: 300
            },
            autoRemove: {
                enabled: false,
                timeout: 10000
            },
            maxHeight: '400px',
            showTimestamp: true,
            allowDismiss: true
        };
        
        console.log('🚨 AlertPanel: Inicializando componente...');
        this.initializePanel();
    }
    
    /**
     * Inicializa o painel de alertas
     */
    initializePanel() {
        if (!this.container.classList.contains('alerts-container')) {
            this.container.classList.add('alerts-container');
        }
        
        if (this.config.maxHeight) {
            this.container.style.maxHeight = this.config.maxHeight;
            this.container.style.overflowY = 'auto';
        }
        
        console.log('🚨 AlertPanel: Painel inicializado');
    }
    
    /**
     * Adiciona um novo alerta
     * @param {Object} alert - Dados do alerta
     */
    addAlert(alert) {
        // Validação rigorosa - NO FALLBACKS
        if (!alert || typeof alert !== 'object') {
            throw new Error('AlertPanel: alert é obrigatório e deve ser objeto');
        }
        
        if (!alert.type || typeof alert.type !== 'string') {
            throw new Error('AlertPanel: alert.type é obrigatório e deve ser string');
        }
        
        if (!this.alertTypes[alert.type]) {
            throw new Error(`AlertPanel: tipo de alerta '${alert.type}' inválido. Válidos: ${Object.keys(this.alertTypes).join(', ')}`);
        }
        
        if (!alert.message || typeof alert.message !== 'string') {
            throw new Error('AlertPanel: alert.message é obrigatório e deve ser string');
        }
        
        // Criar objeto de alerta completo - validação explícita de cada campo
        const newAlert = {
            id: this.generateAlertId(),
            type: alert.type,
            message: alert.message,
            timestamp: new Date().toISOString()
        };
        
        // Validar e adicionar campos opcionais explicitamente
        if (alert.phase !== undefined && alert.phase !== null) {
            if (typeof alert.phase !== 'string') {
                throw new Error('AlertPanel: alert.phase deve ser string quando fornecido');
            }
            newAlert.phase = alert.phase;
        }
        
        if (alert.field !== undefined && alert.field !== null) {
            if (typeof alert.field !== 'string') {
                throw new Error('AlertPanel: alert.field deve ser string quando fornecido');
            }
            newAlert.field = alert.field;
        }
        
        if (alert.timestamp !== undefined && alert.timestamp !== null) {
            if (typeof alert.timestamp !== 'string') {
                throw new Error('AlertPanel: alert.timestamp deve ser string quando fornecido');
            }
            newAlert.timestamp = alert.timestamp;
        }
        
        if (alert.details !== undefined && alert.details !== null) {
            newAlert.details = alert.details;
        }
        
        if (alert.actions !== undefined && alert.actions !== null) {
            if (!Array.isArray(alert.actions)) {
                throw new Error('AlertPanel: alert.actions deve ser array quando fornecido');
            }
            newAlert.actions = alert.actions;
        }
        
        // Adicionar alerta à lista
        this.alerts.unshift(newAlert);
        
        // Limitar número de alertas
        if (this.alerts.length > this.maxAlerts) {
            this.alerts = this.alerts.slice(0, this.maxAlerts);
        }
        
        // Renderizar alerta
        this.renderAlert(newAlert);
        
        console.log(`🚨 AlertPanel: Novo alerta ${alert.type}: ${alert.message}`);
        
        return newAlert.id;
    }
    
    /**
     * Atualiza todos os alertas com uma lista
     * @param {Array} alertsList - Lista de alertas
     */
    updateAlerts(alertsList) {
        if (!Array.isArray(alertsList)) {
            throw new Error('AlertPanel: alertsList deve ser array');
        }
        
        // Limpar alertas existentes
        this.clearAllAlerts();
        
        // Adicionar novos alertas
        for (const alert of alertsList) {
            this.addAlert(alert);
        }
        
        console.log(`🚨 AlertPanel: Atualizados ${alertsList.length} alertas`);
    }
    
    /**
     * Renderiza um alerta específico
     * @param {Object} alert - Dados do alerta
     */
    renderAlert(alert) {
        if (!alert || !alert.id) {
            throw new Error('AlertPanel: alert com id é obrigatório para renderização');
        }
        
        const alertConfig = this.alertTypes[alert.type];
        if (!alertConfig) {
            throw new Error(`AlertPanel: configuração não encontrada para tipo '${alert.type}'`);
        }
        
        // Criar elemento de alerta
        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-item ${alertConfig.class} fade show`;
        alertElement.setAttribute('data-alert-id', alert.id);
        alertElement.setAttribute('data-alert-type', alert.type);
        
        // Construir conteúdo do alerta
        let alertContent = `
            <div class="d-flex">
                <div class="alert-icon">
                    <i class="bi ${alertConfig.icon}"></i>
                </div>
                <div class="alert-content flex-grow-1">
                    <h6 class="alert-title">${alertConfig.title}</h6>
                    <p class="alert-message">${this.escapeHtml(alert.message)}</p>
        `;
        
        // Adicionar informações adicionais se disponíveis - verificação explícita
        if (alert.hasOwnProperty('phase') && alert.phase) {
            alertContent += `<small class="text-muted">Fase: <span class="fw-bold">${alert.phase}</span></small><br>`;
        }
        
        if (alert.hasOwnProperty('field') && alert.field) {
            alertContent += `<small class="text-muted">Campo: <code>${alert.field}</code></small><br>`;
        }
        
        // Adicionar timestamp
        if (this.config.showTimestamp && alert.timestamp) {
            const timeString = new Date(alert.timestamp).toLocaleTimeString('pt-BR');
            alertContent += `<small class="text-muted alert-timestamp">${timeString}</small>`;
        }
        
        alertContent += `
                </div>
        `;
        
        // Adicionar botão de dismiss se habilitado
        if (this.config.allowDismiss) {
            alertContent += `
                <button type="button" class="btn-close btn-close-alert" data-alert-id="${alert.id}"></button>
            `;
        }
        
        alertContent += `</div>`;
        
        // Adicionar ações personalizadas se existirem
        if (alert.hasOwnProperty('actions') && Array.isArray(alert.actions) && alert.actions.length > 0) {
            alertContent += `<div class="alert-actions">`;
            for (const action of alert.actions) {
                if (action.label && action.callback) {
                    const actionId = action.id ? action.id : 'action';
                    alertContent += `
                        <button type="button" class="btn btn-sm btn-outline-primary alert-action-btn" 
                                data-action="${actionId}" 
                                data-alert-id="${alert.id}">
                            ${action.label}
                        </button>
                    `;
                }
            }
            alertContent += `</div>`;
        }
        
        alertElement.innerHTML = alertContent;
        
        // Adicionar event listeners
        this.bindAlertEvents(alertElement, alert);
        
        // Inserir no container
        if (this.container.firstChild) {
            this.container.insertBefore(alertElement, this.container.firstChild);
        } else {
            this.container.appendChild(alertElement);
        }
        
        // Animação de entrada se habilitada
        if (this.config.animations.enabled) {
            alertElement.style.opacity = '0';
            alertElement.style.transform = 'translateX(-20px)';
            
            requestAnimationFrame(() => {
                alertElement.style.transition = `all ${this.config.animations.duration}ms ease`;
                alertElement.style.opacity = '1';
                alertElement.style.transform = 'translateX(0)';
            });
        }
        
        // Auto-remoção se habilitada
        if (this.config.autoRemove.enabled) {
            setTimeout(() => {
                this.removeAlert(alert.id);
            }, this.config.autoRemove.timeout);
        }
        
        // Remover placeholder se existir
        this.removeEmptyPlaceholder();
    }
    
    /**
     * Vincula eventos aos elementos do alerta
     * @param {Element} alertElement - Elemento do alerta
     * @param {Object} alert - Dados do alerta
     */
    bindAlertEvents(alertElement, alert) {
        if (!alertElement || !alert) {
            throw new Error('AlertPanel: alertElement e alert são obrigatórios');
        }
        
        // Botão de dismiss
        const dismissButton = alertElement.querySelector('.btn-close-alert');
        if (dismissButton) {
            dismissButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.removeAlert(alert.id);
            });
        }
        
        // Botões de ação personalizadas
        const actionButtons = alertElement.querySelectorAll('.alert-action-btn');
        for (const button of actionButtons) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const actionId = button.getAttribute('data-action');
                this.handleAlertAction(alert.id, actionId, alert);
            });
        }
    }
    
    /**
     * Manipula ações personalizadas dos alertas
     * @param {string} alertId - ID do alerta
     * @param {string} actionId - ID da ação
     * @param {Object} alert - Dados do alerta
     */
    handleAlertAction(alertId, actionId, alert) {
        if (!alert.hasOwnProperty('actions') || !Array.isArray(alert.actions)) return;
        
        const action = alert.actions.find(a => a.id === actionId);
        if (action && typeof action.callback === 'function') {
            try {
                action.callback(alert);
                
                // Remover alerta após ação se configurado
                if (action.removeAfterExecution === true) {
                    this.removeAlert(alertId);
                }
            } catch (error) {
                console.error('🚨 AlertPanel: Erro ao executar ação:', error);
            }
        }
    }
    
    /**
     * Remove um alerta específico
     * @param {string} alertId - ID do alerta
     */
    removeAlert(alertId) {
        if (!alertId) {
            throw new Error('AlertPanel: alertId é obrigatório');
        }
        
        // Remover da lista
        this.alerts = this.alerts.filter(alert => alert.id !== alertId);
        
        // Remover elemento DOM
        const alertElement = this.container.querySelector(`[data-alert-id="${alertId}"]`);
        if (alertElement) {
            if (this.config.animations.enabled) {
                alertElement.style.transition = `all ${this.config.animations.duration}ms ease`;
                alertElement.style.opacity = '0';
                alertElement.style.transform = 'translateX(-20px)';
                
                setTimeout(() => {
                    if (alertElement.parentNode) {
                        alertElement.parentNode.removeChild(alertElement);
                        this.checkEmptyState();
                    }
                }, this.config.animations.duration);
            } else {
                alertElement.parentNode.removeChild(alertElement);
                this.checkEmptyState();
            }
        }
        
        console.log(`🚨 AlertPanel: Alerta ${alertId} removido`);
    }
    
    /**
     * Remove todos os alertas
     */
    clearAllAlerts() {
        this.alerts = [];
        this.container.innerHTML = '';
        this.showEmptyPlaceholder();
        
        console.log('🚨 AlertPanel: Todos os alertas removidos');
    }
    
    /**
     * Verifica se deve mostrar placeholder vazio
     */
    checkEmptyState() {
        if (this.alerts.length === 0) {
            this.showEmptyPlaceholder();
        }
    }
    
    /**
     * Mostra placeholder quando não há alertas
     */
    showEmptyPlaceholder() {
        if (this.container.children.length === 0) {
            this.container.innerHTML = `
                <div class="text-center py-4 text-muted empty-placeholder">
                    <i class="bi bi-check-circle fs-1 mb-2 d-block"></i>
                    Nenhum alerta no momento
                </div>
            `;
        }
    }
    
    /**
     * Remove placeholder vazio
     */
    removeEmptyPlaceholder() {
        const placeholder = this.container.querySelector('.empty-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
    }
    
    /**
     * Filtra alertas por tipo
     * @param {string} type - Tipo de alerta para filtrar
     */
    filterByType(type) {
        if (!type) {
            throw new Error('AlertPanel: type é obrigatório para filtrar');
        }
        
        const alertElements = this.container.querySelectorAll('.alert-item');
        
        for (const element of alertElements) {
            const elementType = element.getAttribute('data-alert-type');
            
            if (type === 'all' || elementType === type) {
                element.style.display = '';
            } else {
                element.style.display = 'none';
            }
        }
        
        console.log(`🚨 AlertPanel: Filtrados alertas por tipo: ${type}`);
    }
    
    /**
     * Gera ID único para alerta
     * @returns {string} ID único
     */
    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Escapa HTML para prevenir XSS
     * @param {string} text - Texto para escapar
     * @returns {string} Texto escapado
     */
    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Retorna estatísticas dos alertas
     * @returns {Object} Estatísticas
     */
    getStatistics() {
        const stats = {
            total: this.alerts.length,
            errors: 0,
            warnings: 0,
            infos: 0,
            byPhase: {}
        };
        
        for (const alert of this.alerts) {
            stats[`${alert.type}s`]++;
            
            if (alert.hasOwnProperty('phase') && alert.phase) {
                if (!stats.byPhase[alert.phase]) {
                    stats.byPhase[alert.phase] = { errors: 0, warnings: 0, infos: 0 };
                }
                stats.byPhase[alert.phase][`${alert.type}s`]++;
            }
        }
        
        return stats;
    }
    
    /**
     * Retorna todos os alertas atuais
     * @returns {Array} Lista de alertas
     */
    getAllAlerts() {
        return [...this.alerts];
    }
    
    /**
     * Exporta alertas em formato JSON
     * @returns {string} JSON dos alertas
     */
    exportToJSON() {
        return JSON.stringify({
            alerts: this.alerts,
            exported: new Date().toISOString(),
            statistics: this.getStatistics()
        }, null, 2);
    }
}

export default AlertPanel;