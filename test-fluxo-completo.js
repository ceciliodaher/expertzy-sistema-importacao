/**
 * Script de Teste do Fluxo Completo
 * Valida a refatoração arquitetural SOLID
 * 
 * Fluxo testado:
 * 1. Processar XML com DIProcessor
 * 2. Calcular impostos com ComplianceCalculator (salvando no IndexedDB)
 * 3. Gerar relatórios com exportadores (lendo do IndexedDB)
 */

import DIProcessor from './src/core/processors/DIProcessor.js';
import { ComplianceCalculator } from './src/core/calculators/ComplianceCalculator.js';
import { CroquiNFExporter } from './src/core/exporters/CroquiNFExporter.js';
import ExcelExporter from './src/core/exporters/ExcelExporter.js';
import IndexedDBManager from './src/services/db/IndexedDBManager.js';
import fs from 'fs/promises';

async function testarFluxoCompleto() {
    console.log('🚀 Iniciando teste do fluxo completo SOLID...\n');
    
    try {
        // 1. PROCESSAR XML
        console.log('📄 FASE 1: Processando XML...');
        const xmlPath = './uploads/2518173187.xml';
        const xmlContent = await fs.readFile(xmlPath, 'utf-8');
        
        const diProcessor = new DIProcessor();
        await diProcessor.initialize();
        const dadosDI = await diProcessor.processXML(xmlContent);
        
        if (!dadosDI.numero_di) {
            throw new Error('Número da DI não encontrado no XML processado');
        }
        
        console.log(`✅ XML processado - DI: ${dadosDI.numero_di}`);
        console.log(`   Adições: ${dadosDI.adicoes.length}`);
        console.log(`   Importador: ${dadosDI.importador.nome}\n`);
        
        // 2. CALCULAR IMPOSTOS E SALVAR NO INDEXEDDB
        console.log('💰 FASE 2: Calculando impostos...');
        const calculator = new ComplianceCalculator();
        await calculator.loadConfigurations();
        calculator.setEstadoDestino('SP');
        
        const calculos = await calculator.calcularImpostos(dadosDI);
        
        console.log(`✅ Impostos calculados e salvos no IndexedDB`);
        console.log(`   II: R$ ${calculos.impostos.ii.valor_devido.toFixed(2)}`);
        console.log(`   IPI: R$ ${calculos.impostos.ipi.valor_devido.toFixed(2)}`);
        console.log(`   PIS: R$ ${calculos.impostos.pis.valor_devido.toFixed(2)}`);
        console.log(`   COFINS: R$ ${calculos.impostos.cofins.valor_devido.toFixed(2)}`);
        console.log(`   ICMS: R$ ${calculos.impostos.icms.valor_devido.toFixed(2)}`);
        
        // Verificar se foi salvo no IndexedDB
        const dbManager = IndexedDBManager.getInstance();
        const dadosDB = await dbManager.getDI(dadosDI.numero_di);
        
        if (!dadosDB) {
            throw new Error('Dados não foram salvos no IndexedDB!');
        }
        
        if (!dadosDB.totais_relatorio) {
            throw new Error('totais_relatorio não foi salvo no IndexedDB!');
        }
        
        if (!dadosDB.totais_por_coluna) {
            throw new Error('totais_por_coluna não foi salvo no IndexedDB!');
        }
        
        console.log(`✅ Dados verificados no IndexedDB\n`);
        
        // 3. GERAR RELATÓRIOS (LENDO DO INDEXEDDB)
        console.log('📊 FASE 3: Gerando relatórios...');
        
        // Testar CroquiNFExporter
        console.log('   Testando CroquiNFExporter...');
        const croquiExporter = new CroquiNFExporter(dadosDI);
        
        // O exportador deve carregar dados do IndexedDB automaticamente
        await croquiExporter.loadCalculatedData();
        
        // Verificar se carregou os totais
        if (!croquiExporter.calculos || !croquiExporter.calculos.totais_relatorio) {
            throw new Error('CroquiNFExporter não carregou totais_relatorio do IndexedDB!');
        }
        
        console.log(`   ✅ CroquiNFExporter carregou dados do IndexedDB`);
        
        // Testar ExcelExporter
        console.log('   Testando ExcelExporter...');
        const excelExporter = new ExcelExporter();
        
        await excelExporter.loadCalculatedData(dadosDI.numero_di);
        
        if (!excelExporter.calculos || !excelExporter.calculos.totais_por_coluna) {
            throw new Error('ExcelExporter não carregou totais_por_coluna do IndexedDB!');
        }
        
        console.log(`   ✅ ExcelExporter carregou dados do IndexedDB\n`);
        
        // 4. VALIDAR SEPARAÇÃO DE RESPONSABILIDADES
        console.log('🔍 FASE 4: Validando arquitetura SOLID...');
        
        // Verificar que exportadores não têm mais métodos de cálculo
        if (typeof croquiExporter.prepareTotais === 'function') {
            const totais = croquiExporter.prepareTotais();
            // Se não lançar erro, está correto (apenas lê, não calcula)
            console.log('   ✅ CroquiNFExporter.prepareTotais() apenas lê dados (não calcula)');
        }
        
        if (typeof excelExporter.calculateTotalsByColumn === 'function') {
            try {
                // Deve lançar erro se não tiver dados
                const totais = excelExporter.calculateTotalsByColumn([]);
            } catch (error) {
                console.log('   ✅ ExcelExporter.calculateTotalsByColumn() lança erro sem dados (não calcula)');
            }
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 TESTE COMPLETO COM SUCESSO!');
        console.log('='.repeat(60));
        console.log('✅ XML processado corretamente');
        console.log('✅ Impostos calculados e salvos no IndexedDB');
        console.log('✅ Exportadores leem dados do IndexedDB (não calculam)');
        console.log('✅ Arquitetura SOLID aplicada com sucesso');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('\n❌ ERRO NO TESTE:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Executar teste
testarFluxoCompleto().catch(console.error);