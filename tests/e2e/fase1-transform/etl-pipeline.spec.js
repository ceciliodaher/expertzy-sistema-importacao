/**
 * Testes E2E - ETAPA 1.2 TRANSFORM
 * Validação do pipeline ETL completo
 */

const { test, expect } = require('@playwright/test');

test.describe('ETAPA 1.2 - Transform e Load ETL Pipeline', () => {

    test.beforeEach(async ({ page }) => {
        // Limpar IndexedDB antes de cada teste
        await page.evaluate(() => {
            return new Promise((resolve) => {
                const deleteReq = indexedDB.deleteDatabase('ExpertzyDB');
                deleteReq.onsuccess = () => resolve();
                deleteReq.onerror = () => resolve();
            });
        });
        
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('01 - Pipeline ETL completo com XML real', async ({ page }) => {
        // Upload arquivo XML de teste
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles('uploads/2520345968.xml');

        // Aguardar processamento ETL completo
        await page.waitForSelector('[data-testid="etl-complete"]', { timeout: 30000 });

        // Verificar se DI foi processada
        const diNumber = await page.locator('[data-testid="di-number"]').textContent();
        expect(diNumber).toContain('2520345968');

        // Verificar dados no IndexedDB
        const dbData = await page.evaluate(async () => {
            const { default: Dexie } = await import('/src/services/database/IndexedDBManager.js');
            const db = new Dexie('ExpertzyDB');
            db.version(1).stores({
                declaracoes: '++id, numero_di, importador_cnpj, data_processamento'
            });
            
            return await db.declaracoes.where('numero_di').equals('2520345968').first();
        });

        expect(dbData).toBeTruthy();
        expect(dbData.numero_di).toBe('2520345968');
        expect(dbData.importador_cnpj).toBeTruthy();
        expect(dbData.data_processamento).toBeTruthy();
    });

    test('02 - Transformação de valores monetários', async ({ page }) => {
        await page.setInputFiles('input[type="file"]', 'uploads/2520345968.xml');
        await page.waitForSelector('[data-testid="etl-complete"]');

        // Verificar transformação de valores (centavos → reais)
        const dbData = await page.evaluate(async () => {
            const { default: indexedDBManager } = await import('/src/services/database/IndexedDBManager.js');
            return await indexedDBManager.getDI('2520345968');
        });

        // Verificar se valores foram transformados corretamente
        expect(dbData.valor_total_fob_brl).toBeGreaterThan(0);
        expect(dbData.valor_total_fob_usd).toBeGreaterThan(0);
        
        // Verificar se taxa de câmbio foi calculada
        expect(dbData.taxa_cambio).toBeGreaterThan(0);
        expect(dbData.taxa_cambio).toBeLessThan(10); // Sanidade
    });

    test('03 - Extração e transformação de despesas SISCOMEX', async ({ page }) => {
        await page.setInputFiles('input[type="file"]', 'uploads/2520345968.xml');
        await page.waitForSelector('[data-testid="etl-complete"]');

        // Verificar se SISCOMEX foi extraído corretamente
        const dbData = await page.evaluate(async () => {
            const { default: indexedDBManager } = await import('/src/services/database/IndexedDBManager.js');
            const di = await indexedDBManager.getDI('2520345968');
            return di.despesas.find(d => d.tipo === 'SISCOMEX');
        });

        expect(dbData).toBeTruthy();
        expect(dbData.valor).toBe(154.23); // Valor extraído de informação complementar
        expect(dbData.codigo_receita).toBe('7811'); // Código da configuração
    });

    test('04 - Validação fail-fast com dados inválidos', async ({ page }) => {
        // Interceptar logs de erro
        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        // Simular XML com dados inválidos
        await page.evaluate(() => {
            const invalidXML = `<?xml version="1.0"?>
                <declaracaoImportacao>
                    <!-- XML inválido sem campos obrigatórios -->
                </declaracaoImportacao>`;
            
            // Tentar processar XML inválido
            const event = new CustomEvent('processInvalidXML', { detail: invalidXML });
            document.dispatchEvent(event);
        });

        // Aguardar erro
        await page.waitForTimeout(2000);

        // Verificar se erro foi lançado corretamente
        const hasValidationError = errors.some(error => 
            error.includes('obrigatório') || 
            error.includes('inválido') ||
            error.includes('required')
        );
        
        expect(hasValidationError).toBe(true);
    });

    test('05 - Performance do pipeline ETL', async ({ page }) => {
        const startTime = Date.now();

        // Upload arquivo XML
        await page.setInputFiles('input[type="file"]', 'uploads/2520345968.xml');
        
        // Aguardar processamento completo
        await page.waitForSelector('[data-testid="etl-complete"]');
        
        const endTime = Date.now();
        const processingTime = endTime - startTime;

        // Performance deve ser < 30 segundos conforme especificação
        expect(processingTime).toBeLessThan(30000);
        
        console.log(`ETL Pipeline performance: ${processingTime}ms`);
    });

    test('06 - Logs limpos durante operação normal', async ({ page }) => {
        // Interceptar todos os logs
        const logs = [];
        page.on('console', msg => {
            logs.push({
                type: msg.type(),
                text: msg.text()
            });
        });

        // Processar XML
        await page.setInputFiles('input[type="file"]', 'uploads/2520345968.xml');
        await page.waitForSelector('[data-testid="etl-complete"]');

        // Filtrar erros e warnings
        const errors = logs.filter(log => log.type === 'error');
        const warnings = logs.filter(log => log.type === 'warning');

        // CRÍTICO: Zero erros ou warnings em operação normal
        expect(errors).toHaveLength(0);
        expect(warnings).toHaveLength(0);
    });

    test('07 - Migração localStorage para IndexedDB', async ({ page }) => {
        // Simular dados existentes em localStorage
        await page.evaluate(() => {
            const legacyDI = {
                numero_di: 'TEST123456',
                importador_cnpj: '12345678000199',
                importador_nome: 'Empresa Teste',
                valor_total_usd: 5000.00,
                valor_total_brl: 25000.00
            };
            
            localStorage.setItem('expertzy_di_TEST123456', JSON.stringify(legacyDI));
            localStorage.setItem('config_test_setting', JSON.stringify({ value: 'test' }));
        });

        // Executar migração
        await page.click('[data-testid="migrate-data"]');
        await page.waitForSelector('[data-testid="migration-complete"]');

        // Validar dados migrados no IndexedDB
        const migratedDI = await page.evaluate(async () => {
            const { default: indexedDBManager } = await import('/src/services/database/IndexedDBManager.js');
            return await indexedDBManager.getDI('TEST123456');
        });

        expect(migratedDI).toBeTruthy();
        expect(migratedDI.numero_di).toBe('TEST123456');
        expect(migratedDI.importador_cnpj).toBe('12345678000199');

        // Validar configuração migrada
        const migratedConfig = await page.evaluate(async () => {
            const { default: indexedDBManager } = await import('/src/services/database/IndexedDBManager.js');
            return await indexedDBManager.getConfig('test_setting');
        });

        expect(migratedConfig).toEqual({ value: 'test' });
    });

    test('08 - Auditoria de operações críticas', async ({ page }) => {
        // Processar DI
        await page.setInputFiles('input[type="file"]', 'uploads/2520345968.xml');
        await page.waitForSelector('[data-testid="etl-complete"]');

        // Verificar logs de auditoria
        const auditLogs = await page.evaluate(async () => {
            const { default: indexedDBManager } = await import('/src/services/database/IndexedDBManager.js');
            return await indexedDBManager.db.historico_operacoes
                .where('operacao').equals('DI_PERSISTED')
                .toArray();
        });

        expect(auditLogs.length).toBeGreaterThan(0);
        
        const lastAudit = auditLogs[auditLogs.length - 1];
        expect(lastAudit.modulo).toBe('DIProcessor');
        expect(lastAudit.resultado).toBe('SUCCESS');
        expect(lastAudit.detalhes.numero_di).toBe('2520345968');
    });

    test('09 - Rollback em caso de falha', async ({ page }) => {
        // Simular dados no localStorage
        await page.evaluate(() => {
            localStorage.setItem('expertzy_test_di', JSON.stringify({
                numero_di: 'ROLLBACK_TEST',
                importador_cnpj: '98765432000199'
            }));
        });

        // Simular falha crítica no IndexedDB
        await page.evaluate(() => {
            // Corromper IndexedDB intencionalmente
            indexedDB.deleteDatabase('ExpertzyDB');
        });

        // Sistema deve detectar falha
        await page.reload();
        await page.waitForSelector('[data-testid="system-ready"]');

        // Verificar se dados localStorage foram preservados
        const preservedData = await page.evaluate(() => {
            return localStorage.getItem('expertzy_test_di');
        });

        expect(preservedData).toBeTruthy();
        
        const parsed = JSON.parse(preservedData);
        expect(parsed.numero_di).toBe('ROLLBACK_TEST');
    });

    test('10 - Integridade referencial IndexedDB', async ({ page }) => {
        await page.setInputFiles('input[type="file"]', 'uploads/2520345968.xml');
        await page.waitForSelector('[data-testid="etl-complete"]');

        // Verificar integridade das relações
        const integrity = await page.evaluate(async () => {
            const { default: indexedDBManager } = await import('/src/services/database/IndexedDBManager.js');
            
            const di = await indexedDBManager.getDI('2520345968');
            const adicoes = di.adicoes || [];
            const produtos = [];
            
            for (const adicao of adicoes) {
                if (adicao.produtos) {
                    produtos.push(...adicao.produtos);
                }
            }

            return {
                di_exists: !!di,
                adicoes_count: adicoes.length,
                produtos_count: produtos.length,
                has_despesas: !!(di.despesas && di.despesas.length > 0),
                has_carga: !!di.carga
            };
        });

        expect(integrity.di_exists).toBe(true);
        expect(integrity.adicoes_count).toBeGreaterThan(0);
        expect(integrity.produtos_count).toBeGreaterThan(0);
    });

});

// Função auxiliar para validar logs limpos
async function expectCleanLogs(page) {
    const logs = await page.evaluate(() => {
        return window.testLogs || [];
    });

    const errors = logs.filter(log => log.level === 'error');
    const warnings = logs.filter(log => log.level === 'warn');

    expect(errors).toHaveLength(0);
    expect(warnings).toHaveLength(0);
}