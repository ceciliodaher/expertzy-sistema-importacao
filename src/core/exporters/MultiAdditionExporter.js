/**
 * MultiAdditionExporter.js - Exportação Especializada para DIs Multi-Adição
 * Migrated from legacy system to new ES6 module architecture
 */

import { ExcelProfessionalStyles } from '@shared/utils/excel-professional-styles.js';

export class MultiAdditionExporter {
    constructor(diData) {
        this.di = diData;
        this.empresa = 'EXPERTZY';
        this.subtitulo = 'RESUMO MULTI-ADIÇÃO';
        this.styles = new ExcelProfessionalStyles();
        this.versao = '1.0.0';
        
        console.log('📊 MultiAdditionExporter: Inicializando com DI:', diData.numero_di);
    }
    
    /**
     * Exporta resumo para Excel
     */
    async exportToExcel() {
        try {
            const workbook = new ExcelJS.Workbook();
            
            // Sheet 1: Resumo Geral
            const resumoSheet = workbook.addWorksheet('Resumo Geral');
            this.createResumoSheet(resumoSheet);
            
            // Sheet 2: Detalhamento por Adição
            const detalhamentoSheet = workbook.addWorksheet('Detalhamento');
            this.createDetalhamentoSheet(detalhamentoSheet);
            
            // Sheet 3: Análise Fiscal
            const fiscalSheet = workbook.addWorksheet('Análise Fiscal');
            this.createAnalyseFiscalSheet(fiscalSheet);
            
            // Sheet 4: Comparativo NCMs
            const ncmSheet = workbook.addWorksheet('Comparativo NCM');
            this.createComparativoNCMSheet(ncmSheet);
            
            // Export file
            const fileName = `Resumo_MultiAdicao_${this.di.numero_di}_${new Date().toISOString().split('T')[0]}.xlsx`;
            const buffer = await workbook.xlsx.writeBuffer();
            
            // Create download
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(url);
            
            console.log('✅ Resumo multi-adição exportado para Excel:', fileName);
            return { success: true, fileName };
            
        } catch (error) {
            console.error('❌ Erro ao exportar resumo multi-adição:', error);
            throw error;
        }
    }
    
    /**
     * Cria sheet de resumo geral
     */
    createResumoSheet(worksheet) {
        // Cabeçalho
        worksheet.addRow([this.empresa]);
        worksheet.addRow([this.subtitulo]);
        worksheet.addRow(['']);
        worksheet.addRow(['RESUMO GERAL DA IMPORTAÇÃO']);
        worksheet.addRow(['']);
        worksheet.addRow(['DI Número:', this.di.numero_di]);
        worksheet.addRow(['Data Registro:', this.di.data_registro]);
        worksheet.addRow(['Total de Adições:', this.di.adicoes.length]);
        worksheet.addRow(['Importador:', this.di.importador?.nome || 'N/A']);
        worksheet.addRow(['']);
        worksheet.addRow(['TOTAIS CONSOLIDADOS']);
        worksheet.addRow(['']);
        
        // Calcular totais
        let totalCIF = 0;
        let totalWeight = 0;
        let totalII = 0;
        let totalIPI = 0;
        let totalPIS = 0;
        let totalCOFINS = 0;
        
        this.di.adicoes.forEach(adicao => {
            totalCIF += adicao.valor_reais || 0;
            totalWeight += adicao.peso_liquido || 0;
            totalII += adicao.tributos?.ii_valor_devido || 0;
            totalIPI += adicao.tributos?.ipi_valor_devido || 0;
            totalPIS += adicao.tributos?.pis_valor_devido || 0;
            totalCOFINS += adicao.tributos?.cofins_valor_devido || 0;
        });
        
        data.push(
            ['Valor Total CIF (R$):', totalCIF.toFixed(2)],
            ['Peso Total (kg):', totalWeight.toFixed(2)],
            [''],
            ['IMPOSTOS FEDERAIS TOTAIS'],
            ['II - Imposto de Importação:', totalII.toFixed(2)],
            ['IPI - Imposto sobre Produtos Industrializados:', totalIPI.toFixed(2)],
            ['PIS - Programa de Integração Social:', totalPIS.toFixed(2)],
            ['COFINS - Contribuição Social:', totalCOFINS.toFixed(2)],
            ['Total Impostos Federais:', (totalII + totalIPI + totalPIS + totalCOFINS).toFixed(2)],
            [''],
            ['INDICADORES'],
            ['CIF Médio por kg:', (totalCIF / totalWeight).toFixed(2)],
            ['Carga Tributária Federal (%):', ((totalII + totalIPI + totalPIS + totalCOFINS) / totalCIF * 100).toFixed(2) + '%']
        );
        
        return XLSX.utils.aoa_to_sheet(data);
    }
    
    /**
     * Cria sheet de detalhamento por adição
     */
    createDetalhamentoSheet() {
        const headers = [
            'Adição', 'NCM', 'Descrição NCM', 'Fornecedor', 
            'CIF USD', 'CIF BRL', 'Taxa Câmbio', 'Peso (kg)',
            'II (%)', 'II (R$)', 'IPI (%)', 'IPI (R$)',
            'PIS (%)', 'PIS (R$)', 'COFINS (%)', 'COFINS (R$)',
            'Total Federal (R$)', 'Incoterm'
        ];
        
        const data = [headers];
        
        this.di.adicoes.forEach(adicao => {
            const taxa_cambio = this.di.taxa_cambio;  // CORREÇÃO CRÍTICA: usar taxa única da DI (NO FALLBACKS)
            
            const totalFederal = (adicao.tributos?.ii_valor_devido || 0) +
                               (adicao.tributos?.ipi_valor_devido || 0) +
                               (adicao.tributos?.pis_valor_devido || 0) +
                               (adicao.tributos?.cofins_valor_devido || 0);
            
            data.push([
                adicao.numero_adicao,
                adicao.ncm,
                adicao.descricao_ncm,
                adicao.fornecedor?.nome || 'N/A',
                adicao.valor_moeda_negociacao || 0,
                adicao.valor_reais || 0,
                taxa_cambio.toFixed(6),
                adicao.peso_liquido || 0,
                adicao.tributos?.ii_aliquota_ad_valorem || 0,
                adicao.tributos?.ii_valor_devido || 0,
                adicao.tributos?.ipi_aliquota_ad_valorem || 0,
                adicao.tributos?.ipi_valor_devido || 0,
                adicao.tributos?.pis_aliquota_ad_valorem || 0,
                adicao.tributos?.pis_valor_devido || 0,
                adicao.tributos?.cofins_aliquota_ad_valorem || 0,
                adicao.tributos?.cofins_valor_devido || 0,
                totalFederal,
                adicao.condicao_venda_incoterm || 'N/A'
            ]);
        });
        
        // Add totals row
        const totals = this.calculateTotals();
        data.push([
            'TOTAIS', '', '', '',
            '', totals.totalCIF, '', totals.totalWeight,
            '', totals.totalII, '', totals.totalIPI,
            '', totals.totalPIS, '', totals.totalCOFINS,
            totals.totalFederal, ''
        ]);
        
        return XLSX.utils.aoa_to_sheet(data);
    }
    
    /**
     * Cria sheet de análise fiscal
     */
    createAnalyseFiscalSheet() {
        const data = [
            ['ANÁLISE FISCAL POR ADIÇÃO'],
            [''],
            ['Adição', 'NCM', 'Base II', 'Base IPI', 'Base PIS/COFINS', 
             'Alíquota Efetiva (%)', 'Carga Tributária (R$)', 'Peso Fiscal (%)']
        ];
        
        let totalCargaTributaria = 0;
        const totalCIF = this.di.adicoes.reduce((sum, a) => sum + (a.valor_reais || 0), 0);
        
        this.di.adicoes.forEach(adicao => {
            const cif = adicao.valor_reais || 0;
            const ii = adicao.tributos?.ii_valor_devido || 0;
            const ipi = adicao.tributos?.ipi_valor_devido || 0;
            const pis = adicao.tributos?.pis_valor_devido || 0;
            const cofins = adicao.tributos?.cofins_valor_devido || 0;
            
            const cargaTributaria = ii + ipi + pis + cofins;
            const aliquotaEfetiva = cif > 0 ? (cargaTributaria / cif * 100) : 0;
            const pesoFiscal = totalCIF > 0 ? (cargaTributaria / totalCIF * 100) : 0;
            
            totalCargaTributaria += cargaTributaria;
            
            data.push([
                adicao.numero_adicao,
                adicao.ncm,
                cif.toFixed(2),
                (cif + ii).toFixed(2),
                cif.toFixed(2),
                aliquotaEfetiva.toFixed(2) + '%',
                cargaTributaria.toFixed(2),
                pesoFiscal.toFixed(2) + '%'
            ]);
        });
        
        // Summary
        data.push([]);
        data.push(['RESUMO DA ANÁLISE FISCAL']);
        data.push(['Carga Tributária Total:', totalCargaTributaria.toFixed(2)]);
        data.push(['Alíquota Efetiva Média:', (totalCargaTributaria / totalCIF * 100).toFixed(2) + '%']);
        
        return XLSX.utils.aoa_to_sheet(data);
    }
    
    /**
     * Cria sheet comparativo por NCM
     */
    createComparativoNCMSheet() {
        // Agrupar por NCM
        const ncmGroups = {};
        
        this.di.adicoes.forEach(adicao => {
            const ncm = adicao.ncm;
            if (!ncmGroups[ncm]) {
                ncmGroups[ncm] = {
                    descricao: adicao.descricao_ncm,
                    adicoes: [],
                    totalCIF: 0,
                    totalWeight: 0,
                    totalII: 0,
                    totalIPI: 0,
                    totalPIS: 0,
                    totalCOFINS: 0
                };
            }
            
            ncmGroups[ncm].adicoes.push(adicao.numero_adicao);
            ncmGroups[ncm].totalCIF += adicao.valor_reais || 0;
            ncmGroups[ncm].totalWeight += adicao.peso_liquido || 0;
            ncmGroups[ncm].totalII += adicao.tributos?.ii_valor_devido || 0;
            ncmGroups[ncm].totalIPI += adicao.tributos?.ipi_valor_devido || 0;
            ncmGroups[ncm].totalPIS += adicao.tributos?.pis_valor_devido || 0;
            ncmGroups[ncm].totalCOFINS += adicao.tributos?.cofins_valor_devido || 0;
        });
        
        const data = [
            ['COMPARATIVO POR NCM'],
            [''],
            ['NCM', 'Descrição', 'Qtd Adições', 'CIF Total (R$)', 'Peso Total (kg)',
             'II Total', 'IPI Total', 'PIS Total', 'COFINS Total', 'Total Federal']
        ];
        
        Object.entries(ncmGroups).forEach(([ncm, group]) => {
            const totalFederal = group.totalII + group.totalIPI + group.totalPIS + group.totalCOFINS;
            
            data.push([
                ncm,
                group.descricao,
                group.adicoes.length,
                group.totalCIF.toFixed(2),
                group.totalWeight.toFixed(2),
                group.totalII.toFixed(2),
                group.totalIPI.toFixed(2),
                group.totalPIS.toFixed(2),
                group.totalCOFINS.toFixed(2),
                totalFederal.toFixed(2)
            ]);
        });
        
        return XLSX.utils.aoa_to_sheet(data);
    }
    
    /**
     * Calcula totais consolidados
     */
    calculateTotals() {
        let totalCIF = 0;
        let totalWeight = 0;
        let totalII = 0;
        let totalIPI = 0;
        let totalPIS = 0;
        let totalCOFINS = 0;
        
        this.di.adicoes.forEach(adicao => {
            totalCIF += adicao.valor_reais || 0;
            totalWeight += adicao.peso_liquido || 0;
            totalII += adicao.tributos?.ii_valor_devido || 0;
            totalIPI += adicao.tributos?.ipi_valor_devido || 0;
            totalPIS += adicao.tributos?.pis_valor_devido || 0;
            totalCOFINS += adicao.tributos?.cofins_valor_devido || 0;
        });
        
        return {
            totalCIF: totalCIF.toFixed(2),
            totalWeight: totalWeight.toFixed(2),
            totalII: totalII.toFixed(2),
            totalIPI: totalIPI.toFixed(2),
            totalPIS: totalPIS.toFixed(2),
            totalCOFINS: totalCOFINS.toFixed(2),
            totalFederal: (totalII + totalIPI + totalPIS + totalCOFINS).toFixed(2)
        };
    }
    
    /**
     * Exporta para PDF
     */
    exportToPDF() {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
            
            // Header
            doc.setFontSize(18);
            doc.setTextColor(0, 51, 102);
            doc.text(this.empresa, 148, 15, { align: 'center' });
            
            doc.setFontSize(14);
            doc.text(this.subtitulo, 148, 23, { align: 'center' });
            
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`DI: ${this.di.numero_di}`, 20, 35);
            doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 42);
            doc.text(`Total de Adições: ${this.di.adicoes.length}`, 20, 49);
            
            // Summary table
            const totals = this.calculateTotals();
            
            doc.autoTable({
                startY: 60,
                head: [['RESUMO CONSOLIDADO', 'VALOR']],
                body: [
                    ['Valor Total CIF', `R$ ${totals.totalCIF}`],
                    ['Peso Total', `${totals.totalWeight} kg`],
                    ['Total II', `R$ ${totals.totalII}`],
                    ['Total IPI', `R$ ${totals.totalIPI}`],
                    ['Total PIS', `R$ ${totals.totalPIS}`],
                    ['Total COFINS', `R$ ${totals.totalCOFINS}`],
                    ['Total Impostos Federais', `R$ ${totals.totalFederal}`]
                ],
                theme: 'grid',
                headStyles: { fillColor: [0, 51, 102] }
            });
            
            // Additions detail table
            const tableData = this.di.adicoes.map(adicao => {
                const totalFederal = (adicao.tributos?.ii_valor_devido || 0) +
                                   (adicao.tributos?.ipi_valor_devido || 0) +
                                   (adicao.tributos?.pis_valor_devido || 0) +
                                   (adicao.tributos?.cofins_valor_devido || 0);
                
                return [
                    adicao.numero_adicao,
                    adicao.ncm,
                    adicao.descricao_ncm.substring(0, 30) + '...',
                    `R$ ${(adicao.valor_reais || 0).toFixed(2)}`,
                    `${(adicao.peso_liquido || 0).toFixed(2)} kg`,
                    `R$ ${totalFederal.toFixed(2)}`
                ];
            });
            
            doc.autoTable({
                startY: doc.lastAutoTable.finalY + 10,
                head: [['Adição', 'NCM', 'Descrição', 'CIF (R$)', 'Peso (kg)', 'Total Federal (R$)']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [0, 51, 102] },
                styles: { fontSize: 9 }
            });
            
            // Footer
            doc.setFontSize(10);
            doc.setTextColor(128, 128, 128);
            doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, doc.internal.pageSize.height - 10);
            doc.text(`Sistema Expertzy v${this.versao}`, 260, doc.internal.pageSize.height - 10);
            
            // Save PDF
            const fileName = `Resumo_MultiAdicao_${this.di.numero_di}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
            
            console.log('✅ Resumo multi-adição exportado para PDF:', fileName);
            return { success: true, fileName };
            
        } catch (error) {
            console.error('❌ Erro ao exportar PDF:', error);
            throw error;
        }
    }
}

// Export for use in other modules - já exportado na linha 8 com export class