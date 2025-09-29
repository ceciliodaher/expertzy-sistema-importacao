/**
 * PhaseIndicator.js - Componente Indicador de Fases ETL
 * 
 * RESPONSABILIDADE: Gerenciar indicadores visuais do pipeline ETL
 * PRINCÍPIOS: NO FALLBACKS, Validação explícita, Fail-fast
 * INTEGRAÇÃO: Componente visual para status das fases do pipeline
 * 
 * @author Sistema Expertzy - ETL Validation Module
 * @version 1.0.0
 */

class PhaseIndicator {
    constructor(elements) {
        // Validação rigorosa - NO FALLBACKS
        if (!elements || typeof elements !== 'object') {
            throw new Error('PhaseIndicator: elements é obrigatório e deve ser objeto');
        }
        
        // Validar elementos obrigatórios
        const requiredElements = ['extraction', 'transformation', 'loading', 'quality'];
        for (const elementKey of requiredElements) {
            if (!elements[elementKey]) {
                throw new Error(`PhaseIndicator: elemento '${elementKey}' é obrigatório`);
            }
        }
        
        this.elements = elements;
        this.phases = {
            extraction: { name: 'Extração', status: 'pending', duration: null, errors: [], warnings: [] },
            transformation: { name: 'Transformação', status: 'pending', duration: null, errors: [], warnings: [] },
            loading: { name: 'Carregamento', status: 'pending', duration: null, errors: [], warnings: [] },
            quality: { name: 'Qualidade', status: 'pending', duration: null, errors: [], warnings: [] }
        };
        
        // Estados válidos
        this.validStatuses = ['pending', 'running', 'success', 'warning', 'error'];
        
        // Configurações visuais
        this.config = {
            badges: {
                pending: { class: 'bg-secondary', icon: 'bi-clock', text: 'Pendente' },
                running: { class: 'bg-primary', icon: 'bi-gear-fill', text: 'Executando' },
                success: { class: 'bg-success', icon: 'bi-check-circle-fill', text: 'Concluído' },
                warning: { class: 'bg-warning', icon: 'bi-exclamation-triangle-fill', text: 'Atenção' },
                error: { class: 'bg-danger', icon: 'bi-x-circle-fill', text: 'Erro' }
            },
            animations: {
                duration: 300,
                enabled: true
            }
        };
        
        console.log('🚦 PhaseIndicator: Inicializando componente...');
        this.initializePhases();
    }
    
    /**
     * Inicializa todas as fases com estado pendente
     */
    initializePhases() {
        for (const [phaseKey, phaseData] of Object.entries(this.phases)) {
            this.updatePhaseStatus(phaseKey, 'pending');
        }
        
        console.log('🚦 PhaseIndicator: Fases inicializadas');
    }
    
    /**
     * Atualiza status de uma fase específica
     * @param {string} phase - Nome da fase
     * @param {string} status - Status da fase
     * @param {Object} data - Dados adicionais da fase
     */
    updatePhaseStatus(phase, status, data = {}) {
        // Validação rigorosa - NO FALLBACKS
        if (!phase || typeof phase !== 'string') {
            throw new Error('PhaseIndicator: phase é obrigatório e deve ser string');
        }
        
        if (!this.phases[phase]) {
            throw new Error(`PhaseIndicator: fase '${phase}' não existe. Disponíveis: ${Object.keys(this.phases).join(', ')}`);
        }
        
        if (!status || typeof status !== 'string') {
            throw new Error('PhaseIndicator: status é obrigatório e deve ser string');
        }
        
        if (!this.validStatuses.includes(status)) {
            throw new Error(`PhaseIndicator: status '${status}' inválido. Válidos: ${this.validStatuses.join(', ')}`);
        }
        
        // Atualizar dados da fase
        this.phases[phase].status = status;
        
        if (typeof data.duration === 'number') {
            this.phases[phase].duration = data.duration;
        }
        
        if (Array.isArray(data.errors)) {
            this.phases[phase].errors = data.errors;
        }
        
        if (Array.isArray(data.warnings)) {
            this.phases[phase].warnings = data.warnings;
        }
        
        // Renderizar atualização visual
        this.renderPhaseStatus(phase);
        
        console.log(`🚦 PhaseIndicator: Fase '${phase}' atualizada para '${status}'`);
    }
    
    /**
     * Renderiza status visual de uma fase
     * @param {string} phase - Nome da fase
     */
    renderPhaseStatus(phase) {
        if (!phase || !this.phases[phase]) {
            throw new Error(`PhaseIndicator: fase '${phase}' inválida para renderização`);
        }
        
        const phaseData = this.phases[phase];
        const element = this.elements[phase];
        
        if (!element) {
            throw new Error(`PhaseIndicator: elemento DOM não encontrado para fase '${phase}'`);
        }
        
        // Atualizar badge de status
        this.updateStatusBadge(element, phaseData.status, phaseData);
        
        // Atualizar duração se disponível
        this.updateDuration(phase, phaseData.duration);
        
        // Atualizar atributo data-status no pipeline step
        this.updatePipelineStepStatus(phase, phaseData.status);
    }
    
    /**
     * Atualiza badge de status visual
     * @param {Element} element - Elemento DOM
     * @param {string} status - Status da fase
     * @param {Object} phaseData - Dados da fase
     */
    updateStatusBadge(element, status, phaseData) {
        if (!element) {
            throw new Error('PhaseIndicator: element é obrigatório para atualizar badge');
        }
        
        const badgeConfig = this.config.badges[status];
        if (!badgeConfig) {
            throw new Error(`PhaseIndicator: configuração de badge não encontrada para status '${status}'`);
        }
        
        // Encontrar ou criar badge
        let badge = element.querySelector('.badge');
        if (!badge) {
            badge = document.createElement('span');
            element.appendChild(badge);
        }
        
        // Aplicar classes e conteúdo
        badge.className = `badge ${badgeConfig.class}`;
        
        let badgeText = badgeConfig.text;
        
        // Adicionar contadores de erros/warnings se existirem
        if (phaseData.errors && phaseData.errors.length > 0) {
            badgeText += ` (${phaseData.errors.length} erro${phaseData.errors.length > 1 ? 's' : ''})`;
        } else if (phaseData.warnings && phaseData.warnings.length > 0) {
            badgeText += ` (${phaseData.warnings.length} aviso${phaseData.warnings.length > 1 ? 's' : ''})`;
        }
        
        badge.innerHTML = `<i class="bi ${badgeConfig.icon} me-1"></i>${badgeText}`;
        
        // Animação se habilitada
        if (this.config.animations.enabled) {
            badge.style.transition = `all ${this.config.animations.duration}ms ease`;
        }
    }
    
    /**
     * Atualiza display de duração da fase
     * @param {string} phase - Nome da fase
     * @param {number|null} duration - Duração em ms
     */
    updateDuration(phase, duration) {
        if (!phase) {
            throw new Error('PhaseIndicator: phase é obrigatório para atualizar duração');
        }
        
        // Procurar elemento de duração
        const durationElementId = `${phase}Duration`;
        const durationElement = document.getElementById(durationElementId);
        
        if (durationElement) {
            if (typeof duration === 'number') {
                durationElement.textContent = `${duration}ms`;
                durationElement.classList.remove('text-muted');
                durationElement.classList.add('text-success');
            } else {
                durationElement.textContent = '--ms';
                durationElement.classList.add('text-muted');
                durationElement.classList.remove('text-success');
            }
        }
    }
    
    /**
     * Atualiza atributo data-status do pipeline step
     * @param {string} phase - Nome da fase  
     * @param {string} status - Status da fase
     */
    updatePipelineStepStatus(phase, status) {
        if (!phase || !status) {
            throw new Error('PhaseIndicator: phase e status são obrigatórios');
        }
        
        // Procurar elemento pipeline step correspondente
        const pipelineStep = document.querySelector(`[data-step="${phase}"]`);
        
        if (pipelineStep) {
            pipelineStep.setAttribute('data-status', status);
            
            // Aplicar animação CSS se disponível
            if (status === 'running') {
                pipelineStep.classList.add('pulse');
            } else {
                pipelineStep.classList.remove('pulse');
            }
        }
    }
    
    /**
     * Atualiza todas as fases com array de resultados
     * @param {Array} results - Array de resultados de validação
     */
    updateAllPhases(results) {
        if (!Array.isArray(results)) {
            throw new Error('PhaseIndicator: results deve ser array');
        }
        
        // Reset todas as fases para pending primeiro
        for (const phase of Object.keys(this.phases)) {
            this.updatePhaseStatus(phase, 'pending');
        }
        
        // Aplicar resultados fornecidos
        for (const result of results) {
            if (!result.phase) {
                throw new Error('PhaseIndicator: resultado deve ter propriedade phase');
            }
            
            if (!this.phases[result.phase]) {
                console.warn(`PhaseIndicator: fase '${result.phase}' não reconhecida, ignorando`);
                continue;
            }
            
            // Determinar status baseado no resultado
            let status = 'success';
            
            if (result.errors && result.errors.length > 0) {
                status = 'error';
            } else if (result.warnings && result.warnings.length > 0) {
                status = 'warning';
            } else if (result.success === false) {
                status = 'error';
            }
            
            // Atualizar fase
            this.updatePhaseStatus(result.phase, status, {
                duration: result.duration,
                errors: result.errors || [],
                warnings: result.warnings || []
            });
        }
        
        console.log(`🚦 PhaseIndicator: Atualizadas ${results.length} fases`);
    }
    
    /**
     * Marca fase como em execução
     * @param {string} phase - Nome da fase
     */
    setPhaseRunning(phase) {
        if (!phase) {
            throw new Error('PhaseIndicator: phase é obrigatório');
        }
        
        this.updatePhaseStatus(phase, 'running');
    }
    
    /**
     * Marca fase como concluída com sucesso
     * @param {string} phase - Nome da fase
     * @param {number} duration - Duração da execução
     */
    setPhaseSuccess(phase, duration = null) {
        if (!phase) {
            throw new Error('PhaseIndicator: phase é obrigatório');
        }
        
        this.updatePhaseStatus(phase, 'success', { duration });
    }
    
    /**
     * Marca fase com erro
     * @param {string} phase - Nome da fase
     * @param {Array} errors - Array de erros
     * @param {number} duration - Duração da execução
     */
    setPhaseError(phase, errors = [], duration = null) {
        if (!phase) {
            throw new Error('PhaseIndicator: phase é obrigatório');
        }
        
        if (!Array.isArray(errors)) {
            throw new Error('PhaseIndicator: errors deve ser array');
        }
        
        this.updatePhaseStatus(phase, 'error', { errors, duration });
    }
    
    /**
     * Reset todas as fases para estado inicial
     */
    resetAllPhases() {
        for (const phase of Object.keys(this.phases)) {
            this.phases[phase] = {
                ...this.phases[phase],
                status: 'pending',
                duration: null,
                errors: [],
                warnings: []
            };
            
            this.renderPhaseStatus(phase);
        }
        
        console.log('🚦 PhaseIndicator: Reset completo das fases');
    }
    
    /**
     * Retorna estado atual de todas as fases
     * @returns {Object} Estado das fases
     */
    getAllPhasesState() {
        return {
            phases: { ...this.phases },
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Retorna estatísticas das fases
     * @returns {Object} Estatísticas
     */
    getStatistics() {
        const stats = {
            total: Object.keys(this.phases).length,
            pending: 0,
            running: 0,
            success: 0,
            warning: 0,
            error: 0,
            totalErrors: 0,
            totalWarnings: 0,
            totalDuration: 0
        };
        
        for (const phaseData of Object.values(this.phases)) {
            stats[phaseData.status]++;
            stats.totalErrors += phaseData.errors.length;
            stats.totalWarnings += phaseData.warnings.length;
            
            if (typeof phaseData.duration === 'number') {
                stats.totalDuration += phaseData.duration;
            }
        }
        
        return stats;
    }
}

export default PhaseIndicator;