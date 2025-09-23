/**
 * Teste E2E: Verificação de Armazenamento IndexedDB
 * Testa o processamento de XML real e persistência de dados
 */

import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('IndexedDB Storage Verification', () => {
    let page;
    
    test.beforeEach(async ({ browser }) => {
        page = await browser.newPage();
        
        // Limpar IndexedDB antes de cada teste
        await page.goto('http://localhost:8000/di-interface.html');
        await page.evaluate(() => {
            return new Promise((resolve) => {
                const deleteReq = indexedDB.deleteDatabase('ExpertzyDB');
                deleteReq.onsuccess = () => resolve();
                deleteReq.onerror = () => resolve(); // Continue mesmo se falhar
            });
        });
        
        // Aguardar inicialização do sistema
        await page.waitForTimeout(2000);
    });

    test('Deve processar XML real e salvar dados no IndexedDB', async () => {
        console.log('🚀 Iniciando teste de armazenamento IndexedDB...');
        
        // 1. Upload do XML real
        const xmlPath = path.join(process.cwd(), 'uploads', '2300120746.xml');
        const fileInput = page.locator('#xmlFile');
        await fileInput.setInputFiles(xmlPath);
        
        console.log('📁 XML carregado:', xmlPath);
        
        // 2. Processar DI
        const processarBtn = page.locator('#processarBtn');
        await processarBtn.click();
        
        console.log('🔄 Iniciando processamento...');
        
        // 3. Aguardar processamento completo
        await page.waitForFunction(() => {
            const alert = document.querySelector('.alert-success');
            return alert && alert.textContent.includes('processada');
        }, { timeout: 30000 });
        
        console.log('✅ Processamento concluído');
        
        // 4. Verificar dados no IndexedDB
        const dbData = await page.evaluate(async () => {
            return new Promise((resolve) => {
                const request = indexedDB.open('ExpertzyDB');
                
                request.onsuccess = (event) => {
                    const db = event.target.result;
                    const results = {};
                    
                    // Verificar tabela declaracoes
                    const declTransaction = db.transaction(['declaracoes'], 'readonly');
                    const declStore = declTransaction.objectStore('declaracoes');
                    const declRequest = declStore.getAll();
                    
                    declRequest.onsuccess = () => {
                        results.declaracoes = declRequest.result;
                        console.log('📊 Declarações encontradas:', results.declaracoes.length);
                        
                        if (results.declaracoes.length > 0) {
                            console.log('🎯 Primeira DI:', results.declaracoes[0]);
                            
                            // Verificar tabela adicoes
                            const adicTransaction = db.transaction(['adicoes'], 'readonly');
                            const adicStore = adicTransaction.objectStore('adicoes');
                            const adicRequest = adicStore.getAll();
                            
                            adicRequest.onsuccess = () => {
                                results.adicoes = adicRequest.result;
                                console.log('📦 Adições encontradas:', results.adicoes.length);
                                
                                // Verificar tabela produtos
                                const prodTransaction = db.transaction(['produtos'], 'readonly');
                                const prodStore = prodTransaction.objectStore('produtos');
                                const prodRequest = prodStore.getAll();
                                
                                prodRequest.onsuccess = () => {
                                    results.produtos = prodRequest.result;
                                    console.log('🏷️ Produtos encontrados:', results.produtos.length);
                                    
                                    // Verificar tabela despesas_aduaneiras
                                    const despTransaction = db.transaction(['despesas_aduaneiras'], 'readonly');
                                    const despStore = despTransaction.objectStore('despesas_aduaneiras');
                                    const despRequest = despStore.getAll();
                                    
                                    despRequest.onsuccess = () => {
                                        results.despesas_aduaneiras = despRequest.result;
                                        console.log('💰 Despesas encontradas:', results.despesas_aduaneiras.length);
                                        resolve(results);
                                    };
                                };
                            };
                        } else {
                            resolve(results);
                        }
                    };
                };
                
                request.onerror = () => {
                    console.error('❌ Erro ao acessar IndexedDB');
                    resolve({ error: 'Erro ao acessar IndexedDB' });
                };
            });
        });
        
        // 5. Validações dos dados salvos
        console.log('📋 Resultados do IndexedDB:', dbData);
        
        // Verificar se dados foram salvos
        expect(dbData.declaracoes).toBeDefined();
        expect(dbData.declaracoes.length).toBeGreaterThan(0);
        
        // Verificar estrutura da DI
        const di = dbData.declaracoes[0];
        expect(di.numero_di).toBe('2300120746');
        expect(di.importador_cnpj).toBeDefined();
        expect(di.importador_nome).toBeDefined();
        
        // Verificar adições
        expect(dbData.adicoes).toBeDefined();
        expect(dbData.adicoes.length).toBeGreaterThan(0);
        
        const adicao = dbData.adicoes[0];
        expect(adicao.numero_adicao).toBeDefined();
        expect(adicao.ncm).toBeDefined();
        expect(adicao.valor_reais).toBeGreaterThan(0);
        
        // Verificar produtos (se existirem)
        expect(dbData.produtos).toBeDefined();
        
        // Verificar despesas
        expect(dbData.despesas_aduaneiras).toBeDefined();
        
        console.log('✅ Todos os dados validados com sucesso!');
        
        // 6. Verificar valores específicos do XML 2300120746
        expect(di.numero_di).toBe('2300120746');
        expect(adicao.valor_reais).toBeCloseTo(551683.75, 2); // Valor FOB em reais
        
        console.log('🎯 Valores específicos validados:', {
            numeroDI: di.numero_di,
            valorReais: adicao.valor_reais,
            importador: di.importador_nome
        });
    });

    test('Deve verificar integridade dos dados após reload da página', async () => {
        console.log('🔄 Testando persistência após reload...');
        
        // 1. Processar XML (mesmo fluxo do teste anterior)
        const xmlPath = path.join(process.cwd(), 'uploads', '2300120746.xml');
        const fileInput = page.locator('#xmlFile');
        await fileInput.setInputFiles(xmlPath);
        
        const processarBtn = page.locator('#processarBtn');
        await processarBtn.click();
        
        await page.waitForFunction(() => {
            const alert = document.querySelector('.alert-success');
            return alert && alert.textContent.includes('processada');
        }, { timeout: 30000 });
        
        // 2. Recarregar página
        await page.reload();
        await page.waitForTimeout(3000);
        
        // 3. Verificar se dados persistiram
        const persistedData = await page.evaluate(async () => {
            return new Promise((resolve) => {
                const request = indexedDB.open('ExpertzyDB');
                
                request.onsuccess = (event) => {
                    const db = event.target.result;
                    const transaction = db.transaction(['declaracoes'], 'readonly');
                    const store = transaction.objectStore('declaracoes');
                    const getRequest = store.getAll();
                    
                    getRequest.onsuccess = () => {
                        resolve(getRequest.result);
                    };
                };
            });
        });
        
        expect(persistedData.length).toBeGreaterThan(0);
        expect(persistedData[0].numero_di).toBe('2300120746');
        
        console.log('✅ Dados persistiram após reload!');
    });
});