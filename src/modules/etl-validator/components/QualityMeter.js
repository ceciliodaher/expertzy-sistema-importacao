/**
 * QualityMeter.js - Componente Visual de Métrica de Qualidade ETL
 * 
 * RESPONSABILIDADE: Renderizar visualização circular de qualidade
 * PRINCÍPIOS: NO FALLBACKS, Validação explícita, Fail-fast
 * INTEGRAÇÃO: Componente visual para dashboard ETL
 * 
 * @author Sistema Expertzy - ETL Validation Module
 * @version 1.0.0
 */

class QualityMeter {
    constructor(containerElement) {
        // Validação rigorosa - NO FALLBACKS
        if (!containerElement) {
            throw new Error('QualityMeter: containerElement é obrigatório');
        }
        
        this.container = containerElement;
        this.currentQuality = 0;
        this.currentGrade = 'UNKNOWN';
        
        // Configurações do componente
        this.config = {
            animationDuration: 800,
            updateInterval: 50,
            colors: {
                excellent: '#198754', // 90-100%
                good: '#28a745',      // 75-89%
                acceptable: '#fd7e14', // 60-74%
                poor: '#dc3545',      // 0-59%
                unknown: '#6c757d'    // Sem dados
            },
            thresholds: {
                excellent: 90,
                good: 75,
                acceptable: 60
            }
        };
        
        console.log('🎯 QualityMeter: Inicializando componente...');
    }
    
    /**
     * Atualiza a qualidade exibida no componente
     * @param {number} quality - Percentual de qualidade (0-100)
     * @param {string} grade - Grade opcional (EXCELLENT, GOOD, ACCEPTABLE, POOR)
     */
    updateQuality(quality, grade = null) {
        // Validação rigorosa - NO FALLBACKS
        if (typeof quality !== 'number') {
            throw new Error('QualityMeter: quality deve ser numérico');
        }
        
        if (quality < 0 || quality > 100) {
            throw new Error('QualityMeter: quality deve estar entre 0-100');
        }
        
        // NO FALLBACKS: Se grade não fornecido, calcular explicitamente
        let finalGrade;
        if (grade === null || grade === undefined || grade === '') {
            finalGrade = this.determineGrade(quality);
        } else {
            // Validar grade fornecido
            const validGrades = ['EXCELLENT', 'GOOD', 'ACCEPTABLE', 'POOR', 'UNKNOWN'];
            if (!validGrades.includes(grade)) {
                throw new Error(`QualityMeter: grade inválido: ${grade}. Esperado: ${validGrades.join(', ')}`);
            }
            finalGrade = grade;
        }
        
        this.currentQuality = quality;
        this.currentGrade = finalGrade;
        
        this.renderQualityMeter();
        
        console.log(`🎯 QualityMeter: Atualizada qualidade ${quality}% (${finalGrade})`);
    }
    
    /**
     * Determina grade baseado no percentual de qualidade
     * @param {number} quality - Percentual de qualidade
     * @returns {string} Grade determinado
     */
    determineGrade(quality) {
        if (typeof quality !== 'number') {
            throw new Error('QualityMeter: quality deve ser numérico para determinar grade');
        }
        
        if (quality >= this.config.thresholds.excellent) return 'EXCELLENT';
        if (quality >= this.config.thresholds.good) return 'GOOD';
        if (quality >= this.config.thresholds.acceptable) return 'ACCEPTABLE';
        return 'POOR';
    }
    
    /**
     * Renderiza o medidor visual de qualidade
     */
    renderQualityMeter() {
        const circleProgress = this.container.querySelector('.circle-progress');
        const percentageElement = this.container.querySelector('.percentage');
        const gradeElement = this.container.querySelector('.grade');
        
        // Validação de elementos obrigatórios
        if (!circleProgress || !percentageElement || !gradeElement) {
            throw new Error('QualityMeter: Elementos HTML obrigatórios ausentes (.circle-progress, .percentage, .grade)');
        }
        
        // Atualizar valores textuais
        percentageElement.textContent = `${Math.round(this.currentQuality)}%`;
        gradeElement.textContent = this.translateGrade(this.currentGrade);
        
        // Atualizar círculo de progresso
        this.updateCircleProgress(circleProgress, this.currentQuality, this.currentGrade);
    }
    
    /**
     * Atualiza o progresso circular com animação
     * @param {Element} circleElement - Elemento do círculo
     * @param {number} quality - Percentual de qualidade
     * @param {string} grade - Grade da qualidade
     */
    updateCircleProgress(circleElement, quality, grade) {
        if (!circleElement) {
            throw new Error('QualityMeter: circleElement é obrigatório');
        }
        
        // Definir cor baseada na grade
        const gradeColor = this.getGradeColor(grade);
        
        // Aplicar CSS custom properties para animação
        circleElement.style.setProperty('--percentage', quality);
        circleElement.setAttribute('data-quality', grade.toLowerCase());
        
        // Atualizar background com gradiente cônico
        circleElement.style.background = `conic-gradient(
            ${gradeColor} 0deg,
            ${gradeColor} ${quality * 3.6}deg,
            #e3f2fd ${quality * 3.6}deg,
            #e3f2fd 360deg
        )`;
        
        // Animação suave
        circleElement.style.transition = `all ${this.config.animationDuration}ms ease`;
    }
    
    /**
     * Retorna cor correspondente à grade
     * @param {string} grade - Grade da qualidade
     * @returns {string} Cor CSS
     */
    getGradeColor(grade) {
        if (!grade || typeof grade !== 'string') {
            throw new Error('QualityMeter: grade é obrigatório e deve ser string');
        }
        
        const colorMap = {
            'EXCELLENT': this.config.colors.excellent,
            'GOOD': this.config.colors.good,
            'ACCEPTABLE': this.config.colors.acceptable,
            'POOR': this.config.colors.poor,
            'UNKNOWN': this.config.colors.unknown
        };
        
        const color = colorMap[grade];
        if (!color) {
            throw new Error(`QualityMeter: cor não definida para grade: ${grade}`);
        }
        
        return color;
    }
    
    /**
     * Traduz grade para português
     * @param {string} grade - Grade em inglês
     * @returns {string} Grade em português
     */
    translateGrade(grade) {
        if (!grade || typeof grade !== 'string') {
            throw new Error('QualityMeter: grade é obrigatório para tradução');
        }
        
        const translations = {
            'EXCELLENT': 'EXCELENTE',
            'GOOD': 'BOM',
            'ACCEPTABLE': 'ACEITÁVEL', 
            'POOR': 'RUIM',
            'UNKNOWN': 'DESCONHECIDO'
        };
        
        const translation = translations[grade];
        if (!translation) {
            throw new Error(`QualityMeter: tradução não encontrada para grade: ${grade}`);
        }
        
        return translation;
    }
    
    /**
     * Anima transição entre valores
     * @param {number} fromQuality - Qualidade inicial
     * @param {number} toQuality - Qualidade final
     */
    animateTransition(fromQuality, toQuality) {
        if (typeof fromQuality !== 'number' || typeof toQuality !== 'number') {
            throw new Error('QualityMeter: fromQuality e toQuality devem ser numéricos');
        }
        
        const startTime = Date.now();
        const difference = toQuality - fromQuality;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / this.config.animationDuration, 1);
            
            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = fromQuality + (difference * easeOut);
            
            this.currentQuality = currentValue;
            this.currentGrade = this.determineGrade(currentValue);
            this.renderQualityMeter();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    /**
     * Reset do componente para estado inicial
     */
    reset() {
        this.currentQuality = 0;
        this.currentGrade = 'UNKNOWN';
        this.renderQualityMeter();
        
        console.log('🎯 QualityMeter: Reset para estado inicial');
    }
    
    /**
     * Retorna estado atual do componente
     * @returns {Object} Estado atual
     */
    getState() {
        return {
            quality: this.currentQuality,
            grade: this.currentGrade,
            timestamp: new Date().toISOString()
        };
    }
}

export default QualityMeter;