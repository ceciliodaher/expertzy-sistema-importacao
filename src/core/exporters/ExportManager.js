/**
 * ExportManager.js - Export System Coordinator
 * Migrated from legacy system to new ES6 module architecture
 */

import { ExcelExporter } from '@core/exporters/ExcelExporter.js';
import { CroquiNFExporter } from '@core/exporters/CroquiNFExporter.js';

export class ExportManager {
    constructor() {
        this.excelExporter = new ExcelExporter();
    }

    /**
     * Main export function - routes to specialized modules
     * @param {string} format - Export format ('excel', 'pdf', 'json')
     * @param {Object} diData - Complete DI data from DIProcessor.getComprehensiveDIData()
     */
    async export(format, diData) {
        // Validate required data using new architecture
        this.validateExportData(diData);
        
        console.log(`📊 ExportManager: Iniciando export ${format} usando nova arquitetura...`);

        try {
            switch (format) {
                case 'excel':
                    return await this.exportExcel(diData);
                    
                case 'pdf':
                    return await this.exportPDF(diData);
                    
                case 'json':
                    return await this.exportJSON(diData);
                    
                default:
                    throw new Error(`Formato de export não suportado: ${format}`);
            }
        } catch (error) {
            console.error(`❌ ExportManager: Erro no export ${format}:`, error);
            throw error;
        }
    }

    /**
     * Export to Excel using specialized module
     * KISS: Extrai numero_di e passa para ExcelExporter que carrega dados do IndexedDB
     */
    async exportExcel(diData) {
        // Validação rigorosa NO FALLBACKS
        if (!diData || !diData.numero_di) {
            throw new Error('ExportManager: diData.numero_di é obrigatório para export Excel');
        }
        // KISS: Passa apenas numero_di (string) - ExcelExporter carrega dados do IndexedDB
        return this.excelExporter.export(diData.numero_di);
    }

    /**
     * Export to PDF using CroquiNFExporter
     * Carrega calculosData do IndexedDB para passar ao exporter (legacy signature)
     */
    async exportPDF(diData) {
        try {
            // 1. Importar dependências
            const { StoreKeys } = await import('@core/db/StoreKeyConstants.js');
            const { IndexedDBManager } = await import('@services/database/IndexedDBManager.js');

            // 2. Carregar calculosData do IndexedDB (NO FALLBACKS)
            const dbManager = IndexedDBManager.getInstance();
            const calculosData = await dbManager.getConfig(StoreKeys.CALCULO(diData.numero_di));

            if (!calculosData) {
                throw new Error(
                    `Cálculos não encontrados para DI ${diData.numero_di} - ` +
                    `execute ComplianceCalculator primeiro`
                );
            }

            console.log(`✅ ExportManager: Cálculos carregados para DI ${diData.numero_di}`);

            // 3. Instanciar com ambos parâmetros (legacy constructor signature)
            const croquiExporter = new CroquiNFExporter(diData, calculosData);
            const buffer = await croquiExporter.generatePDF();

            // Download do arquivo
            const blob = new Blob([buffer], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // Nome do arquivo com data
            const hoje = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            a.download = `Croqui_NF_${diData.numero_di}_${hoje}.pdf`;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(url);

            console.log('✅ ExportManager: PDF exportado com sucesso');
            return { success: true, filename: a.download };

        } catch (error) {
            console.error('❌ ExportManager: Erro ao exportar PDF:', error);
            throw error;
        }
    }

    /**
     * Export to JSON format
     */
    async exportJSON(diData) {
        const jsonData = {
            timestamp: new Date().toISOString(),
            di_data: diData,
            metadata: {
                sistema: 'Expertzy DI Processor',
                versao: '2.0'
            }
        };

        const filename = `dados_di_${diData.numero_di}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.json`;
        
        // Create and download JSON file
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        console.log(`✅ ExportManager: JSON exportado - ${filename}`);
        return { success: true, filename };
    }

    /**
     * Validate export data before processing - estrutura completa obrigatória
     * TEMPORÁRIO: Compatibilidade com interface legacy durante migração
     */
    validateExportData(diData) {
        // Validar DI data
        if (!diData) {
            throw new Error('DI data não disponível para export');
        }
        if (!diData.numero_di) {
            throw new Error('Número da DI é obrigatório para export');
        }
        if (!diData.adicoes || diData.adicoes.length === 0) {
            throw new Error('DI deve conter pelo menos uma adição para export');
        }

        // TEMPORÁRIO: Metadata opcional durante migração
        // TODO: Restaurar validação rigorosa quando interface migrar para nova arquitetura
        if (diData.metadata) {
            console.log('✅ ExportManager: Usando nova arquitetura com metadata');
        } else {
            console.warn('⚠️ ExportManager: Usando interface legacy sem metadata - migração pendente');
        }

        // Validar cada adição tem estrutura mínima
        diData.adicoes.forEach((adicao, index) => {
            if (!adicao.numero_adicao) {
                throw new Error(`numero_adicao ausente na adição ${index + 1}`);
            }
            if (!adicao.ncm) {
                throw new Error(`ncm ausente na adição ${adicao.numero_adicao}`);
            }
            if (adicao.valor_reais === undefined || adicao.valor_reais === null) {
                throw new Error(`valor_reais ausente na adição ${adicao.numero_adicao}`);
            }
        });

        console.log('✅ ExportManager: Estrutura de dados DI validada para export');
    }
}