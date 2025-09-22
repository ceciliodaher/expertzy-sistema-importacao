/**
 * DI Interface Helper - Helpers para interação com interface principal
 * Sistema Expertzy - Fase 1 Foundation
 */

class DIInterfaceHelper {
    constructor(page) {
        this.page = page;
        
        // Seletores principais da interface
        this.selectors = {
            // Navigation
            navbar: '.expertzy-navbar',
            processadorLink: 'a[href="di-interface.html"]',
            
            // Process Flow Indicators
            step1Indicator: '.process-indicator:nth-child(1)',
            step2Indicator: '.process-indicator:nth-child(2)', 
            step3Indicator: '.process-indicator:nth-child(3)',
            step4Indicator: '.process-indicator:nth-child(4)',
            
            // Step 1 - Upload DI
            xmlFileInput: '#xmlFile',
            uploadButton: '#processarBtn', // Botão correto conforme HTML
            step1Container: '#step1',
            
            // Step 2 - Configurar Despesas
            step2Container: '#step2',
            expenseInputs: '.expense-input',
            nextToStep3Button: '[data-step="3"]',
            
            // Step 3 - Calcular Impostos
            step3Container: '#step3',
            calculateButton: '#calculateButton',
            calculationResults: '#calculationResults',
            nextToStep4Button: '[data-step="4"]',
            
            // Step 4 - Exportar
            step4Container: '#step4',
            exportButtons: '.export-button',
            excelExportButton: '#exportExcel',
            pdfExportButton: '#exportPDF',
            
            // Results Display
            diDataDisplay: '#diData',
            summaryCards: '.summary-card',
            
            // Loading
            loadingOverlay: '#loadingOverlay',
            loadingMessage: '#loadingMessage',
            
            // Error/Success Messages
            alertMessages: '.alert',
            errorMessages: '.alert-danger',
            successMessages: '.alert-success'
        };
    }

    /**
     * Navegar para interface principal
     */
    async navigateToInterface() {
        await this.page.goto('/di-interface.html');
        await this.page.waitForLoadState('networkidle');
        
        // Verificar se página carregou corretamente
        await this.page.waitForSelector(this.selectors.navbar);
        await this.page.waitForSelector(this.selectors.step1Container);
    }

    /**
     * Fazer upload de arquivo XML
     */
    async uploadXMLFile(filePath) {
        // Aguardar input estar visível
        await this.page.waitForSelector(this.selectors.xmlFileInput);
        
        // Fazer upload do arquivo
        await this.page.setInputFiles(this.selectors.xmlFileInput, filePath);
        
        // Aguardar botão de upload estar habilitado
        await this.page.waitForSelector(this.selectors.uploadButton + ':not([disabled])');
        
        // Clicar no botão de upload
        await this.page.click(this.selectors.uploadButton);
        
        // Aguardar processamento (loading pode aparecer)
        await this.waitForProcessingComplete();
    }

    /**
     * Aguardar processamento completar
     */
    async waitForProcessingComplete(timeout = 30000) {
        try {
            // Se loading overlay aparecer, aguardar desaparecer
            const loadingVisible = await this.page.isVisible(this.selectors.loadingOverlay);
            if (loadingVisible) {
                await this.page.waitForSelector(this.selectors.loadingOverlay + '.hidden', { timeout });
            }
        } catch (error) {
            // Loading pode não aparecer para arquivos pequenos
        }
        
        // Aguardar network idle para garantir que processamento terminou
        await this.page.waitForLoadState('networkidle');
    }

    /**
     * Verificar se step está ativo
     */
    async isStepActive(stepNumber) {
        const selector = `.process-indicator:nth-child(${stepNumber})`;
        const element = await this.page.$(selector);
        const classList = await element.getAttribute('class');
        return classList.includes('active');
    }

    /**
     * Avançar para próximo step
     */
    async goToNextStep(currentStep) {
        const nextStepButton = `[data-step="${currentStep + 1}"]`;
        
        await this.page.waitForSelector(nextStepButton + ':not([disabled])');
        await this.page.click(nextStepButton);
        
        // Aguardar step ativar
        await this.page.waitForFunction(
            (step) => {
                const indicator = document.querySelector(`.process-indicator:nth-child(${step})`);
                return indicator && indicator.classList.contains('active');
            },
            currentStep + 1
        );
    }

    /**
     * Verificar dados da DI extraídos
     */
    async validateDIData(expectedData) {
        // Aguardar dados aparecerem na interface
        await this.page.waitForSelector(this.selectors.diDataDisplay);
        
        const validations = [];
        
        // Verificar importador
        if (expectedData.importador) {
            const importadorText = await this.page.textContent('[data-field="importador-nome"]');
            validations.push({
                field: 'importador-nome',
                expected: expectedData.importador.nome,
                actual: importadorText,
                match: importadorText?.includes(expectedData.importador.nome)
            });
            
            const importadorUF = await this.page.textContent('[data-field="importador-uf"]');
            validations.push({
                field: 'importador-uf', 
                expected: expectedData.importador.uf,
                actual: importadorUF,
                match: importadorUF === expectedData.importador.uf
            });
        }
        
        // Verificar incoterm
        if (expectedData.incoterm) {
            const incotermText = await this.page.textContent('[data-field="incoterm"]');
            validations.push({
                field: 'incoterm',
                expected: expectedData.incoterm,
                actual: incotermText,
                match: incotermText === expectedData.incoterm
            });
        }
        
        // Verificar NCM principal
        if (expectedData.ncm) {
            const ncmText = await this.page.textContent('[data-field="ncm-principal"]');
            validations.push({
                field: 'ncm-principal',
                expected: expectedData.ncm,
                actual: ncmText,
                match: ncmText === expectedData.ncm
            });
        }
        
        return validations;
    }

    /**
     * Executar cálculo de impostos
     */
    async calculateTaxes() {
        await this.page.waitForSelector(this.selectors.calculateButton + ':not([disabled])');
        await this.page.click(this.selectors.calculateButton);
        
        // Aguardar cálculo completar
        await this.waitForProcessingComplete();
        
        // Aguardar resultados aparecerem
        await this.page.waitForSelector(this.selectors.calculationResults);
    }

    /**
     * Verificar resultados dos cálculos
     */
    async validateCalculationResults() {
        const results = {};
        
        // Capturar cards de resumo
        const summaryCards = await this.page.$$eval(this.selectors.summaryCards, cards => {
            return cards.map(card => ({
                title: card.querySelector('.card-title')?.textContent,
                value: card.querySelector('.card-text, .display-6')?.textContent
            }));
        });
        
        results.summaryCards = summaryCards;
        
        // Verificar se há valores NaN ou undefined na interface
        const hasInvalidValues = await this.page.evaluate(() => {
            const elements = document.querySelectorAll('[data-value]');
            return Array.from(elements).some(el => {
                const value = el.textContent;
                return value.includes('NaN') || value.includes('undefined') || value.includes('null');
            });
        });
        
        results.hasInvalidValues = hasInvalidValues;
        
        return results;
    }

    /**
     * Exportar relatórios
     */
    async exportReports() {
        const exports = {};
        
        // Tentar exportar Excel
        try {
            await this.page.click(this.selectors.excelExportButton);
            exports.excel = { success: true, timestamp: new Date() };
        } catch (error) {
            exports.excel = { success: false, error: error.message };
        }
        
        // Aguardar um pouco entre exports
        await this.page.waitForTimeout(1000);
        
        // Tentar exportar PDF
        try {
            await this.page.click(this.selectors.pdfExportButton);
            exports.pdf = { success: true, timestamp: new Date() };
        } catch (error) {
            exports.pdf = { success: false, error: error.message };
        }
        
        return exports;
    }

    /**
     * Verificar mensagens de erro/sucesso
     */
    async getMessages() {
        const messages = {
            errors: [],
            success: [],
            warnings: []
        };
        
        // Capturar mensagens de erro
        const errorElements = await this.page.$$(this.selectors.errorMessages);
        for (const element of errorElements) {
            const text = await element.textContent();
            if (text.trim()) {
                messages.errors.push(text.trim());
            }
        }
        
        // Capturar mensagens de sucesso
        const successElements = await this.page.$$(this.selectors.successMessages);
        for (const element of successElements) {
            const text = await element.textContent();
            if (text.trim()) {
                messages.success.push(text.trim());
            }
        }
        
        return messages;
    }

    /**
     * Reset da interface para novo teste
     */
    async resetInterface() {
        await this.page.reload();
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForSelector(this.selectors.step1Container);
    }
}

module.exports = { DIInterfaceHelper };