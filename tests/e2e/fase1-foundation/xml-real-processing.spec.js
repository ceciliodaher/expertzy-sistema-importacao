/**
 * Teste E2E - Processamento XML Real
 * Sistema Expertzy - Fase 1 Foundation
 * 
 * Valida processamento completo de DI real com XML 2518173187.xml
 * - Incoterm CPT, NCM 29420000, Importador GO
 * - Logs limpos, sem erros DataMigration
 * - Interface responde corretamente em todos os steps
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import { ConsoleMonitor } from '../helpers/console-monitor.js';
import { DIInterfaceHelper } from '../helpers/di-interface-helper.js';

// Dados esperados do XML real 2518173187.xml
const EXPECTED_DI_DATA = {
    numero: '25181731870',
    importador: {
        nome: 'EQUIPLEX INDUSTRIA FARMACEUTICA LTDA',
        cnpj: '01784792000103',
        uf: 'GO'
    },
    incoterm: 'CPT',
    ncm: '29420000',
    descricaoNCM: 'Outros compostos orgânicos',
    valorFOB: 893.64, // USD
    valorCIF: 4819.22, // BRL
    pesoLiquido: 20000 // gramas
};

test.describe('Processamento XML Real - DI 2518173187', () => {
    let consoleMonitor;
    let diHelper;
    let xmlFilePath;

    test.beforeEach(async ({ page }) => {
        // Configurar helpers
        consoleMonitor = new ConsoleMonitor(page);
        diHelper = new DIInterfaceHelper(page);
        
        // Caminho para XML real
        xmlFilePath = path.join(__dirname, '../fixtures/real-xml/2518173187.xml');
        
        // Navegar para interface
        await diHelper.navigateToInterface();
    });

    test('deve processar XML real sem erros e com logs limpos', async ({ page }) => {
        // Step 1: Upload do XML real
        await test.step('Upload XML real', async () => {
            await diHelper.uploadXMLFile(xmlFilePath);
            
            // Aguardar processamento
            await diHelper.waitForProcessingComplete();
            
            // Verificar se avançou para step 2
            const step2Active = await diHelper.isStepActive(2);
            expect(step2Active).toBe(true);
        });

        // Validar dados extraídos do XML
        await test.step('Validar dados extraídos', async () => {
            const validations = await diHelper.validateDIData(EXPECTED_DI_DATA);
            
            // Verificar importador
            const importadorValidation = validations.find(v => v.field === 'importador-nome');
            expect(importadorValidation?.match).toBe(true);
            
            const ufValidation = validations.find(v => v.field === 'importador-uf');
            expect(ufValidation?.match).toBe(true);
            
            // Verificar incoterm
            const incotermValidation = validations.find(v => v.field === 'incoterm');
            expect(incotermValidation?.match).toBe(true);
            
            // Verificar NCM
            const ncmValidation = validations.find(v => v.field === 'ncm-principal');
            expect(ncmValidation?.match).toBe(true);
        });

        // Step 2: Configurar despesas (usar padrões)
        await test.step('Configurar despesas', async () => {
            // Avançar para step 3 com despesas padrão
            await diHelper.goToNextStep(2);
            
            const step3Active = await diHelper.isStepActive(3);
            expect(step3Active).toBe(true);
        });

        // Step 3: Calcular impostos
        await test.step('Calcular impostos', async () => {
            await diHelper.calculateTaxes();
            
            // Verificar resultados dos cálculos
            const results = await diHelper.validateCalculationResults();
            
            // Não deve haver valores inválidos (NaN, undefined, null)
            expect(results.hasInvalidValues).toBe(false);
            
            // Deve ter cards de resumo
            expect(results.summaryCards.length).toBeGreaterThan(0);
            
            // Avançar para step 4
            await diHelper.goToNextStep(3);
            
            const step4Active = await diHelper.isStepActive(4);
            expect(step4Active).toBe(true);
        });

        // Step 4: Exportar relatórios
        await test.step('Exportar relatórios', async () => {
            const exports = await diHelper.exportReports();
            
            // Pelo menos uma exportação deve funcionar
            const hasSuccessfulExport = exports.excel?.success || exports.pdf?.success;
            expect(hasSuccessfulExport).toBe(true);
        });

        // Validar logs limpos
        await test.step('Validar logs limpos', async () => {
            const logValidation = consoleMonitor.validateCleanLogs();
            
            // Não deve haver erros críticos
            expect(logValidation.summary.criticalIssues).toBe(0);
            
            // Logs específicos que NÃO devem aparecer
            const forbiddenLogs = [
                'DataMigration',
                'Cannot read properties of null',
                'Cannot read properties of undefined',
                'is not a function'
            ];
            
            forbiddenLogs.forEach(pattern => {
                const found = consoleMonitor.findLogsByPattern(pattern, 'error');
                expect(found.length).toBe(0);
            });
            
            // Se houver issues, reportar detalhes
            if (!logValidation.isClean) {
                console.log('Issues encontrados:', JSON.stringify(logValidation.issues, null, 2));
            }
            
            expect(logValidation.isClean).toBe(true);
        });
    });

    test('deve validar dados específicos do XML 2518173187', async ({ page }) => {
        // Upload e processamento
        await diHelper.uploadXMLFile(xmlFilePath);
        await diHelper.waitForProcessingComplete();

        // Verificações específicas do XML real
        await test.step('Verificar dados específicos da DI', async () => {
            // Aguardar dados carregarem
            await page.waitForSelector('[data-field="importador-cnpj"]');
            
            // CNPJ do importador
            const cnpjText = await page.textContent('[data-field="importador-cnpj"]');
            expect(cnpjText).toContain('01.784.792/0001-03');
            
            // Estado Goiás
            const ufText = await page.textContent('[data-field="importador-uf"]');
            expect(ufText).toBe('GO');
            
            // NCM específico
            const ncmText = await page.textContent('[data-field="ncm-principal"]');
            expect(ncmText).toBe('29420000');
            
            // Incoterm CPT
            const incotermText = await page.textContent('[data-field="incoterm"]');
            expect(incotermText).toBe('CPT');
        });

        // Verificar cálculos específicos para Goiás
        await test.step('Verificar cálculos para estado GO', async () => {
            // Avançar para cálculos
            await diHelper.goToNextStep(2);
            await diHelper.calculateTaxes();
            
            // Aguardar resultados
            await page.waitForSelector('#calculationResults');
            
            // Verificar se ICMS foi calculado corretamente
            const icmsElement = await page.$('[data-tax="icms"]');
            if (icmsElement) {
                const icmsValue = await icmsElement.textContent();
                expect(icmsValue).not.toContain('NaN');
                expect(icmsValue).not.toContain('undefined');
            }
            
            // Taxa de câmbio calculada deve ser realista
            const taxaCambioElement = await page.$('[data-field="taxa-cambio"]');
            if (taxaCambioElement) {
                const taxaCambioText = await taxaCambioElement.textContent();
                const taxa = parseFloat(taxaCambioText.replace(',', '.'));
                
                // Taxa deve estar entre 3.00 e 8.00 (valores realistas)
                expect(taxa).toBeGreaterThan(3.0);
                expect(taxa).toBeLessThan(8.0);
            }
        });
    });

    test('deve processar adições múltiplas do XML', async ({ page }) => {
        await diHelper.uploadXMLFile(xmlFilePath);
        await diHelper.waitForProcessingComplete();

        await test.step('Verificar processamento de todas as adições', async () => {
            // Aguardar tabela de adições
            await page.waitForSelector('.adicoes-table, [data-table="adicoes"]');
            
            // Contar adições processadas
            const adicoesCount = await page.$$eval(
                '.adicao-row, [data-row="adicao"]',
                rows => rows.length
            );
            
            // XML deve ter pelo menos 1 adição
            expect(adicoesCount).toBeGreaterThan(0);
            
            // Verificar se todas as adições têm dados válidos
            const invalidAdicoes = await page.$$eval(
                '.adicao-row, [data-row="adicao"]',
                rows => {
                    return rows.filter(row => {
                        const ncm = row.querySelector('[data-field="ncm"]')?.textContent;
                        const valor = row.querySelector('[data-field="valor"]')?.textContent;
                        return !ncm || !valor || ncm.includes('undefined') || valor.includes('NaN');
                    });
                }
            );
            
            expect(invalidAdicoes.length).toBe(0);
        });
    });

    test.afterEach(async ({ page }) => {
        // Exportar logs para debugging se teste falhar
        if (test.info().status === 'failed') {
            const logs = consoleMonitor.exportLogs();
            console.log('Console logs for failed test:', JSON.stringify(logs, null, 2));
        }
    });
});