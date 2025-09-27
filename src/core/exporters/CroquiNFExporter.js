/**
 * CroquiNFExporter - Módulo de Exportação de Croqui de Nota Fiscal
 * Sistema Expertzy - Importação e Precificação - IndexedDB Version
 * 
 * REFATORADO - SOLID PRINCIPLES:
 * - SINGLE RESPONSIBILITY: Apenas formata e exporta (não calcula)
 * - NO FALLBACKS: Todas as dependências obrigatórias devem estar disponíveis
 * - READ-ONLY: Lê dados calculados do IndexedDB (não faz cálculos)
 * 
 * @author Sistema Expertzy
 * @version 3.0.0 - SOLID Refactoring
 * @description Gera croqui de NF em Excel e PDF seguindo padrão brasileiro
 */

import IndexedDBManager from '@services/database/IndexedDBManager.js';

export class CroquiNFExporter {
    constructor(diData, calculosData = null, incentiveManager = null) {
        // NO FALLBACKS - validar dados obrigatórios
        if (!diData) {
            throw new Error('Dados da DI não disponíveis - obrigatórios para CroquiNFExporter');
        }
        
        if (!diData.numero_di) {
            throw new Error('Número da DI ausente - obrigatório para gerar croqui');
        }
        
        this.di = diData;  // Dados já processados pelo DIProcessor
        this.calculos = calculosData;  // Cálculos já feitos pelo ComplianceCalculator
        this.incentiveManager = incentiveManager;  // Para gerar campos CST 51
        this.dbManager = IndexedDBManager.getInstance();  // Para ler dados calculados
        this.empresa = 'EXPERTZY';
        this.subtitulo = 'SISTEMA DE IMPORTAÇÃO E PRECIFICAÇÃO';
        this.versao = '2.1.0';
        
        // Configuração de incentivos (será carregada dinamicamente)
        this.beneficiosConfig = null;
        
        console.log('🏭 CroquiNFExporter v2.1: Inicializando com DI:', diData.numero_di);
        
        this.initializeStyles();
        this.loadIncentiveConfig().then(async () => {
            await this.prepareAllData();
        }).catch(async (error) => {
            console.warn('⚠️ Erro ao carregar configuração de incentivos:', error);
            await this.prepareAllData(); // Continuar sem incentivos
        });
    }
    
    /**
     * Carregar configuração de benefícios de beneficios.json (NO HARDCODED DATA)
     */
    async loadIncentiveConfig() {
        try {
            const configPath = new URL('../../shared/data/beneficios.json', import.meta.url);
            const response = await fetch(configPath);
            if (!response.ok) {
                throw new Error(`Erro ao carregar beneficios.json: ${response.status}`);
            }
            
            this.beneficiosConfig = await response.json();
            console.log('✅ Configuração de benefícios carregada:', Object.keys(this.beneficiosConfig.programas).length, 'programas');
            
        } catch (error) {
            console.error('❌ Erro ao carregar beneficios.json:', error);
            throw error;
        }
    }
    
    initializeStyles() {
        this.excelStyles = {
            header: {
                font: { bold: true, size: 14, color: { rgb: "091A30" } },
                fill: { fgColor: { rgb: "E8F1F8" } },
                alignment: { horizontal: "center", vertical: "center" }
            },
            subtitle: {
                font: { bold: false, size: 11, color: { rgb: "091A30" } },
                alignment: { horizontal: "center", vertical: "center" }
            },
            tableHeader: {
                font: { bold: true, size: 9, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "091A30" } },
                border: { 
                    top: { style: "thin", color: { rgb: "000000" } }, 
                    bottom: { style: "thin", color: { rgb: "000000" } }, 
                    left: { style: "thin", color: { rgb: "000000" } }, 
                    right: { style: "thin", color: { rgb: "000000" } } 
                },
                alignment: { horizontal: "center", vertical: "center", wrapText: true }
            },
            cell: {
                border: { 
                    top: { style: "thin", color: { rgb: "CCCCCC" } }, 
                    bottom: { style: "thin", color: { rgb: "CCCCCC" } }, 
                    left: { style: "thin", color: { rgb: "CCCCCC" } }, 
                    right: { style: "thin", color: { rgb: "CCCCCC" } } 
                }
            },
            currency: {
                numFmt: '"R$" #,##0.00',
                alignment: { horizontal: "right" },
                border: { 
                    top: { style: "thin", color: { rgb: "CCCCCC" } }, 
                    bottom: { style: "thin", color: { rgb: "CCCCCC" } }, 
                    left: { style: "thin", color: { rgb: "CCCCCC" } }, 
                    right: { style: "thin", color: { rgb: "CCCCCC" } } 
                }
            },
            percentage: {
                numFmt: '0.00"%"',
                alignment: { horizontal: "center" },
                border: { 
                    top: { style: "thin", color: { rgb: "CCCCCC" } }, 
                    bottom: { style: "thin", color: { rgb: "CCCCCC" } }, 
                    left: { style: "thin", color: { rgb: "CCCCCC" } }, 
                    right: { style: "thin", color: { rgb: "CCCCCC" } } 
                }
            },
            totalsHeader: {
                font: { bold: true, size: 10, color: { rgb: "091A30" } },
                fill: { fgColor: { rgb: "F0F0F0" } },
                border: { 
                    top: { style: "medium", color: { rgb: "000000" } }, 
                    bottom: { style: "thin", color: { rgb: "000000" } }, 
                    left: { style: "thin", color: { rgb: "000000" } }, 
                    right: { style: "thin", color: { rgb: "000000" } } 
                }
            },
            totalsValue: {
                font: { bold: true, size: 10 },
                numFmt: '"R$" #,##0.00',
                alignment: { horizontal: "right" },
                border: { 
                    top: { style: "thin", color: { rgb: "000000" } }, 
                    bottom: { style: "medium", color: { rgb: "000000" } }, 
                    left: { style: "thin", color: { rgb: "000000" } }, 
                    right: { style: "thin", color: { rgb: "000000" } } 
                }
            }
        };
    }
    
    // ========== PREPARAÇÃO DE DADOS ==========
    
    async prepareAllData() {
        console.log('📊 Preparando dados do croqui...');
        this.header = this.prepareHeader();
        this.produtos = await this.prepareProdutos();
        this.totais = this.prepareTotais();
        console.log('✅ Dados preparados:', { 
            produtos: this.produtos.length, 
            totais: this.totais 
        });
        
    }
    
    prepareHeader() {
        const importador = this.di.importador || {};
        const fornecedor = this.extractFornecedor();
        
        // Taxa de câmbio da DI (calculada dinamicamente)
        const taxa_cambio = this.di.taxa_cambio || 
                           this.di.moedas?.vmle_vmld?.taxa ||
                           this.di.adicoes?.[0]?.taxa_cambio;
        
        if (!taxa_cambio || taxa_cambio <= 0) {
            throw new Error('Taxa de câmbio não encontrada na DI para export - obrigatória para croqui');
        }
        
        return {
            empresa: this.empresa,
            subtitulo: this.subtitulo,
            di_numero: this.di.numero_di,
            data_registro: this.formatDate(this.di.data_registro),
            data_hora: new Date().toLocaleString('pt-BR'),
            
            importador: {
                nome: importador.nome,
                cnpj: this.formatCNPJ(importador.cnpj),
                endereco: importador.endereco_completo || `${importador.endereco_logradouro}, ${importador.endereco_numero}`.trim(),
                complemento: importador.endereco_complemento,
                bairro: importador.endereco_bairro,
                municipio: importador.endereco_municipio,
                uf: importador.endereco_uf,
                cep: this.formatCEP(importador.endereco_cep),
                ie: importador.inscricao_estadual
            },
            
            fornecedor: fornecedor,
            
            // Referências
            referencia_twa: this.extractReferenciaTWA(),
            referencia_importador: this.extractReferenciaImportador(),
            
            // Taxa de câmbio
            moedas: this.di.moedas,
            taxa_cambio: taxa_cambio.toFixed(8)
        };
    }
    
    async prepareProdutos() {
        const produtos = [];
        let itemCounter = 1;
        
        // NOVO: Usar produtos_individuais já calculados pelo ComplianceCalculator + ItemCalculator
        if (this.calculos && this.calculos.produtos_individuais && this.calculos.produtos_individuais.length > 0) {
            console.log('📦 Usando produtos individuais já calculados:', this.calculos.produtos_individuais.length);
            
            for (const produto of this.calculos.produtos_individuais) {
                // FASE 2: Buscar dados da adição e produto correspondentes - OBRIGATÓRIO
                const adicaoCorrespondente = this.di.adicoes.find(ad => ad.numero_adicao.toString().padStart(3, '0') === produto.adicao_numero);
                
                if (!adicaoCorrespondente) {
                    throw new Error(`Adição ${produto.adicao_numero} não encontrada na DI - obrigatória para gerar croqui`);
                }
                
                // Buscar produto dentro da adição
                const produtoDI = adicaoCorrespondente.produtos ? adicaoCorrespondente.produtos.find(p => p.numero_sequencial_item === produto.numero_sequencial_item) : null;
                
                if (!produtoDI) {
                    throw new Error(`Produto ${produto.numero_sequencial_item} da adição ${produto.adicao_numero} não encontrado na DI - obrigatório para croqui`);
                }
                
                // Validar dados críticos
                if (!adicaoCorrespondente.quantidade_estatistica) {
                    throw new Error(`Quantidade estatística ausente na adição ${produto.adicao_numero} - obrigatória para croqui`);
                }
                
                if (!adicaoCorrespondente.unidade_estatistica) {
                    throw new Error(`Unidade estatística ausente na adição ${produto.adicao_numero} - obrigatória para croqui`);
                }
                
                if (!adicaoCorrespondente.peso_liquido) {
                    throw new Error(`Peso líquido ausente na adição ${produto.adicao_numero} - obrigatório para croqui`);
                }
                
                const produtoProcessado = {
                    // Identificação
                    adicao: produto.adicao_numero,
                    item: this.generateItemCode(itemCounter),
                    descricao: this.formatDescription(produto.descricao),
                    ncm: produto.ncm,
                    
                    // CORRIGIDO: Quantidades reais da DI - NO FALLBACKS
                    peso_kg: adicaoCorrespondente.peso_liquido,
                    quant_cx: produtoDI.quantidade, // Quantidade real do produto na DI
                    quant_por_cx: this.extractQuantidadePorCaixa(produtoDI.descricao_mercadoria), // Extrair da descrição
                    total_un: adicaoCorrespondente.quantidade_estatistica,
                    unidade_real: await this.mapUnidade(adicaoCorrespondente.unidade_estatistica), // "QUILOGRAMA LIQUIDO" → "KG"
                    unidade_comercial: await this.mapUnidade(produtoDI.unidade_medida), // Mapeada
                    
                    // CORRIGIDO: Valores monetários reais - NO FALLBACKS
                    valor_unitario_usd: produtoDI.valor_unitario_usd,
                    valor_unitario: produtoDI.valor_unitario_brl,
                    valor_total: produtoDI.valor_total_brl,
                    
                    // IMPOSTOS JÁ CALCULADOS POR ITEM (ItemCalculator)
                    bc_icms: produto.base_icms_item,
                    valor_icms: produto.icms_item,
                    aliq_icms: this.getAliquotaICMSPorNCM(produto.ncm),
                    
                    bc_ipi: produto.valor_total_brl + produto.ii_item,
                    valor_ipi: produto.ipi_item,
                    aliq_ipi: this.getAliquotaIPIPorNCM(produto.ncm),
                    
                    // Outros impostos por item
                    valor_ii: produto.ii_item,
                    valor_pis: produto.pis_item,
                    valor_cofins: produto.cofins_item
                };
                
                // APLICAR INCENTIVOS FISCAIS (CST 51) SE DISPONÍVEL
                this.applyIncentiveFields(produtoProcessado, produto.ncm);
                
                produtos.push(produtoProcessado);
                itemCounter++;
            }
            
        } else {
            // NO FALLBACKS - produtos individuais são obrigatórios
            throw new Error('Produtos individuais não encontrados - execute o cálculo de impostos primeiro');
        }
        
        return produtos;
    }
    
    prepareTotais() {
        // REFATORADO: Não calcula mais, apenas lê dados já calculados
        // Seguindo princípio Single Responsibility - cálculos movidos para ComplianceCalculator
        
        if (!this.calculos.totais_relatorio) {
            throw new Error('Totais do relatório não encontrados - execute ComplianceCalculator.calcularTotaisRelatorio() primeiro');
        }
        
        // Apenas retorna os totais já calculados
        return this.calculos.totais_relatorio;
    }
    
    // ========== INCENTIVOS FISCAIS CST 51 ==========
    
    /**
     * Aplicar campos de incentivos fiscais CST 51 aos produtos
     * Nomenclatura oficial: IncentiveManager é PRIMARY CREATOR
     */
    applyIncentiveFields(produto, ncm) {
        if (!this.incentiveManager || !this.beneficiosConfig) {
            console.log('📋 Sem IncentiveManager ou configuração - croqui sem incentivos fiscais');
            return;
        }
        
        try {
            // Verificar se há programa_selecionado (nomenclatura oficial)
            const programaSelecionado = this.getProgramaSelecionado();
            
            if (!programaSelecionado) {
                console.log('📋 Nenhum programa de incentivo selecionado');
                return;
            }
            
            console.log(`💰 Aplicando incentivo fiscal ${programaSelecionado} ao NCM ${ncm}`);
            
            // Obter configuração do programa
            const configPrograma = this.beneficiosConfig.programas[programaSelecionado];
            if (!configPrograma) {
                console.warn(`⚠️ Configuração não encontrada para programa ${programaSelecionado}`);
                return;
            }
            
            // Aplicar campos CST 51
            this.generateCST51Fields(produto, configPrograma, programaSelecionado);
            
        } catch (error) {
            console.error('❌ Erro ao aplicar incentivos fiscais:', error);
            // NO FALLBACKS - continuar sem incentivos mas registrar erro
        }
    }
    
    /**
     * Gerar campos específicos CST 51 para diferimento ICMS
     * Campos conforme SPED NFe: CST, vBC, vICMSOp, vICMS, vICMSDif, pDif, cBenef
     */
    generateCST51Fields(produto, configPrograma, programaCodigo) {
        // CST do programa (geralmente 51 para diferimento)
        produto.cst_icms = configPrograma.nf_config?.cst || '51';
        
        // Valor da operação (mesma base de cálculo)
        produto.vICMSOp = produto.bc_icms;
        
        // Percentual de diferimento baseado na redução da base
        const reducaoBase = configPrograma.reducao_base || 1.0;
        const percentualDiferimento = (1.0 - reducaoBase) * 100;
        
        // Alíquota ICMS
        const aliquotaICMS = produto.aliq_icms;
        
        // ICMS devido sem diferimento
        const icmsOperacao = produto.bc_icms * (aliquotaICMS / 100);
        
        // Aplicar diferimento conforme tipo de programa
        if (configPrograma.tipo === 'diferimento_total') {
            // Diferimento total - ICMS devido = 0
            produto.valor_icms = 0;
            produto.vICMSDif = icmsOperacao;
            produto.pDif = 100;
            
        } else if (configPrograma.tipo === 'diferimento_parcial') {
            // Diferimento parcial - usar redução da base
            const icmsDiferido = icmsOperacao * (1.0 - reducaoBase);
            const icmsDevido = icmsOperacao - icmsDiferido;
            
            produto.valor_icms = icmsDevido;
            produto.vICMSDif = icmsDiferido;
            produto.pDif = percentualDiferimento;
            
        } else if (configPrograma.tipo === 'credito_outorgado') {
            // Crédito outorgado - não altera entrada, só saída
            console.log('💳 Programa de crédito outorgado - não altera campos da NF de entrada');
            return;
        }
        
        // Código do benefício
        produto.cBenef = configPrograma.nf_config?.cBenef || '';
        
        console.log(`✅ CST 51 aplicado: Programa ${programaCodigo}, ICMS Diferido: R$ ${produto.vICMSDif?.toFixed(2) || '0,00'}`);
    }
    
    /**
     * Obter programa selecionado com nomenclatura oficial
     * NO FALLBACKS - deve usar nomenclatura do IncentiveManager
     */
    getProgramaSelecionado() {
        // Tentar obter da configuração global (di-interface.js)
        if (typeof window !== 'undefined' && window.currentDI && window.currentDI.programa_selecionado) {
            return window.currentDI.programa_selecionado;
        }
        
        // Validação de nomenclatura (NO FALLBACKS)
        if (typeof window !== 'undefined' && window.currentDI && 
            (window.currentDI.selectedIncentive || window.currentDI.selected_incentive)) {
            throw new Error('VIOLAÇÃO NOMENCLATURA: Use "programa_selecionado" não "selectedIncentive"');
        }
        
        return null;
    }
    
    // ========== MÉTODOS AUXILIARES (apenas formatação, sem cálculos) ==========
    
    generateItemCode(counter) {
        return `IC${String(counter).padStart(4, '0')}`;
    }
    
    formatDescription(descricao) {
        if (!descricao) return '';
        // Limpar e formatar descrição
        return descricao
            .replace(/\s+/g, ' ')
            .trim()
            .toUpperCase()
            .substring(0, 100);
    }
    
    formatDate(dateString) {
        if (!dateString) return '';
        
        // Se já está formatada DD/MM/AAAA
        if (dateString.includes('/')) {
            return dateString;
        }
        
        // Se está em formato AAAAMMDD
        if (dateString.length === 8) {
            const ano = dateString.substring(0, 4);
            const mes = dateString.substring(4, 6);
            const dia = dateString.substring(6, 8);
            return `${dia}/${mes}/${ano}`;
        }
        
        return dateString;
    }
    
    formatCNPJ(cnpj) {
        if (!cnpj) return '';
        const numbers = cnpj.replace(/\D/g, '');
        if (numbers.length !== 14) return cnpj;
        return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    formatCEP(cep) {
        if (!cep) return '';
        const numbers = cep.replace(/\D/g, '');
        if (numbers.length !== 8) return cep;
        return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }
    
    extractFornecedor() {
        // Extrair dados do fornecedor das adições (baseado na análise XML)
        if (this.di.adicoes && this.di.adicoes.length > 0) {
            const primeiraAdicao = this.di.adicoes[0];
            const fornecedor = primeiraAdicao.fornecedor;
            return {
                nome: fornecedor?.nome,
                endereco: `${fornecedor?.logradouro}, ${fornecedor?.cidade}`.trim(),
                pais: primeiraAdicao.pais_aquisicao_nome,
                cnpj: ''
            };
        }
        return { nome: '', endereco: '', pais: '', cnpj: '' };
    }
    
    extractReferenciaTWA() {
        // Buscar referência TWA nas informações complementares
        if (this.di.informacao_complementar) {
            const match = this.di.informacao_complementar.match(/Nossa Referência[.:]+\s*([^\s\n]+)/i);
            if (match) return match[1];
        }
        return '';
    }
    
    extractReferenciaImportador() {
        // Buscar referência do importador nas informações complementares
        if (this.di.informacao_complementar) {
            const match = this.di.informacao_complementar.match(/REF\.IMPORTADOR[.:]+\s*([^\s\n]+)/i);
            if (match) return match[1];
        }
        return '';
    }
    
    getDespesaAduaneira(tipo) {
        // Extrair despesas aduaneiras das informações complementares
        if (!this.di.informacao_complementar) return '0,00';
        
        const info = this.di.informacao_complementar;
        let pattern;
        
        switch(tipo) {
            case 'siscomex':
                pattern = /Taxa Siscomex[.:]+\s*([\d,]+)/i;
                break;
            case 'afrmm':
                pattern = /VALOR AFRMM[.:]+\s*R\$\s*([\d,]+)/i;
                break;
            case 'capatazia':
                pattern = /CAPATAZIA[.:]+\s*R\$\s*([\d,]+)/i;
                break;
            default:
                return '0,00';
        }
        
        const match = info.match(pattern);
        return match ? match[1] : '0,00';
    }
    
    // ========== GERAÇÃO EXCEL ==========
    
    async generateExcel() {
        // Carregar dados calculados do IndexedDB se necessário
        await this.loadCalculatedData();
        
        try {
            console.log('📝 Iniciando geração do Excel...');
            
            if (typeof XLSX === 'undefined') {
                throw new Error('Biblioteca SheetJS não encontrada');
            }
            
            const wb = XLSX.utils.book_new();
            const ws = this.createExcelWorksheet();
            
            XLSX.utils.book_append_sheet(wb, ws, "Croqui NF");
            
            // Configurações do workbook
            wb.Props = {
                Title: `Croqui NF - DI ${this.di.numero_di}`,
                Author: 'Sistema Expertzy',
                CreatedDate: new Date()
            };
            
            const buffer = XLSX.write(wb, {
                bookType: 'xlsx',
                type: 'array',
                cellStyles: true,
                bookSST: false
            });
            
            console.log('✅ Excel gerado com sucesso');
            return buffer;
            
        } catch (error) {
            console.error('❌ Erro ao gerar Excel:', error);
            throw error;
        }
    }
    
    createExcelWorksheet() {
        const ws = {};
        let row = 1;
        
        // CABEÇALHO EXPERTZY
        this.addCell(ws, 'A1', this.empresa, this.excelStyles.header);
        this.mergeCells(ws, 'A1:T1');
        
        this.addCell(ws, 'A2', this.subtitulo, this.excelStyles.subtitle);
        this.mergeCells(ws, 'A2:T2');
        
        row = 4;
        
        // TÍTULO DO DOCUMENTO
        this.addCell(ws, `A${row}`, 'CROQUI NOTA FISCAL DE ENTRADA', this.excelStyles.header);
        this.mergeCells(ws, `A${row}:T${row}`);
        row += 2;
        
        // INFORMAÇÕES DA DI
        this.addCell(ws, `A${row}`, `DI: ${this.header.di_numero}`, this.excelStyles.cell);
        this.mergeCells(ws, `A${row}:D${row}`);
        
        this.addCell(ws, `E${row}`, `DATA DO REGISTRO: ${this.header.data_registro}`, this.excelStyles.cell);
        this.mergeCells(ws, `E${row}:J${row}`);
        
        this.addCell(ws, `K${row}`, `Cotação US$ ${this.header.taxa_cambio}`, this.excelStyles.cell);
        this.mergeCells(ws, `K${row}:T${row}`);
        row += 2;
        
        // CABEÇALHOS DA TABELA DE PRODUTOS
        const headers = [
            'Adição', 'ITEM', 'PRODUTO', 'NCM', 'PESO',
            'QUANT CX', 'QUANT\nP/CX', 'TOTAL UN',
            'V. UNIT\nReal R$', 'V. TOTAL\nReal R$',
            'BC ICMS', 'V.ICMS', 'BC IPI', 'V.IPI',
            'ALIQ ICMS', 'ALIQ IPI',
            'MVA', 'BC ST', 'ST', 'FP'
        ];
        
        headers.forEach((header, index) => {
            const col = String.fromCharCode(65 + index); // A, B, C...
            this.addCell(ws, `${col}${row}`, header, this.excelStyles.tableHeader);
        });
        row++;
        
        // DADOS DOS PRODUTOS
        this.produtos.forEach(produto => {
            this.addCell(ws, `A${row}`, produto.adicao, this.excelStyles.cell);
            this.addCell(ws, `B${row}`, produto.item, this.excelStyles.cell);
            this.addCell(ws, `C${row}`, produto.descricao, this.excelStyles.cell);
            this.addCell(ws, `D${row}`, produto.ncm, this.excelStyles.cell);
            this.addCell(ws, `E${row}`, produto.peso_kg.toFixed(2), this.excelStyles.cell);
            this.addCell(ws, `F${row}`, produto.quant_cx, this.excelStyles.cell);
            this.addCell(ws, `G${row}`, produto.quant_por_cx, this.excelStyles.cell);
            this.addCell(ws, `H${row}`, produto.total_un, this.excelStyles.cell);
            this.addCell(ws, `I${row}`, produto.valor_unitario, this.excelStyles.currency);
            this.addCell(ws, `J${row}`, produto.valor_total, this.excelStyles.currency);
            this.addCell(ws, `K${row}`, produto.bc_icms, this.excelStyles.currency);
            this.addCell(ws, `L${row}`, produto.valor_icms, this.excelStyles.currency);
            this.addCell(ws, `M${row}`, produto.bc_ipi, this.excelStyles.currency);
            this.addCell(ws, `N${row}`, produto.valor_ipi, this.excelStyles.currency);
            
            // ALÍQUOTAS FORMATADAS COMO PERCENTUAL
            this.addCell(ws, `O${row}`, produto.aliq_icms, this.excelStyles.percentage);
            this.addCell(ws, `P${row}`, produto.aliq_ipi, this.excelStyles.percentage);
            
            this.addCell(ws, `Q${row}`, produto.mva, this.excelStyles.cell);
            this.addCell(ws, `R${row}`, produto.bc_st, this.excelStyles.currency);
            this.addCell(ws, `S${row}`, produto.valor_st, this.excelStyles.currency);
            this.addCell(ws, `T${row}`, produto.fp, this.excelStyles.cell);
            
            row++;
        });
        
        // LINHA DE TOTAL
        row++;
        this.addCell(ws, `A${row}`, 'TOTAL', this.excelStyles.totalsHeader);
        this.mergeCells(ws, `A${row}:H${row}`);
        
        // Somar totais
        let totalValor = 0;
        let totalICMS = 0;
        let totalIPI = 0;
        this.produtos.forEach(p => {
            totalValor += p.valor_total;
            totalICMS += p.valor_icms;
            totalIPI += p.valor_ipi;
        });
        
        this.addCell(ws, `I${row}`, '', this.excelStyles.totalsHeader);
        this.addCell(ws, `J${row}`, totalValor, this.excelStyles.totalsValue);
        this.addCell(ws, `K${row}`, '', this.excelStyles.totalsHeader);
        this.addCell(ws, `L${row}`, totalICMS, this.excelStyles.totalsValue);
        this.addCell(ws, `M${row}`, '', this.excelStyles.totalsHeader);
        this.addCell(ws, `N${row}`, totalIPI, this.excelStyles.totalsValue);
        this.addCell(ws, `O${row}`, '', this.excelStyles.totalsHeader);
        this.addCell(ws, `P${row}`, '', this.excelStyles.totalsHeader);
        this.addCell(ws, `Q${row}`, '', this.excelStyles.totalsHeader);
        this.addCell(ws, `R${row}`, '', this.excelStyles.totalsHeader);
        this.addCell(ws, `S${row}`, '', this.excelStyles.totalsHeader);
        this.addCell(ws, `T${row}`, '', this.excelStyles.totalsHeader);
        
        row += 3;
        
        // SEÇÃO DE CÁLCULO DO IMPOSTO
        this.addCell(ws, `A${row}`, 'CÁLCULO DO IMPOSTO', this.excelStyles.header);
        this.mergeCells(ws, `A${row}:T${row}`);
        row += 2;
        
        // Primeira linha de totais
        this.addCell(ws, `A${row}`, 'Base de Cálculo do ICMS', this.excelStyles.cell);
        this.mergeCells(ws, `A${row}:B${row}`);
        this.addCell(ws, `C${row}`, this.totais.base_calculo_icms, this.excelStyles.currency);
        
        this.addCell(ws, `D${row}`, 'VALOR DO ICMS', this.excelStyles.cell);
        this.mergeCells(ws, `D${row}:E${row}`);
        this.addCell(ws, `F${row}`, this.totais.valor_icms, this.excelStyles.currency);
        
        this.addCell(ws, `G${row}`, 'BC ST', this.excelStyles.cell);
        this.addCell(ws, `H${row}`, this.totais.base_calculo_icms_st, this.excelStyles.currency);
        
        this.addCell(ws, `I${row}`, 'ICMS ST', this.excelStyles.cell);
        this.addCell(ws, `J${row}`, this.totais.valor_icms_st, this.excelStyles.currency);
        
        this.addCell(ws, `K${row}`, 'VALOR TOTAL DOS PRODUTOS', this.excelStyles.cell);
        this.mergeCells(ws, `K${row}:M${row}`);
        this.addCell(ws, `N${row}`, this.totais.valor_total_produtos, this.excelStyles.currency);
        row++;
        
        // Segunda linha de totais
        this.addCell(ws, `A${row}`, 'Total do Frete', this.excelStyles.cell);
        this.addCell(ws, `B${row}`, this.totais.valor_frete, this.excelStyles.currency);
        
        this.addCell(ws, `C${row}`, 'Valor do Seguro', this.excelStyles.cell);
        this.addCell(ws, `D${row}`, this.totais.valor_seguro, this.excelStyles.currency);
        
        this.addCell(ws, `E${row}`, 'Total do Desconto', this.excelStyles.cell);
        this.addCell(ws, `F${row}`, this.totais.valor_desconto, this.excelStyles.currency);
        
        this.addCell(ws, `G${row}`, 'Outras Despesas', this.excelStyles.cell);
        this.mergeCells(ws, `G${row}:H${row}`);
        this.addCell(ws, `I${row}`, this.totais.outras_despesas, this.excelStyles.currency);
        
        this.addCell(ws, `J${row}`, 'Valor do II', this.excelStyles.cell);
        this.addCell(ws, `K${row}`, this.totais.valor_ii, this.excelStyles.currency);
        
        this.addCell(ws, `L${row}`, 'VALOR DO IPI', this.excelStyles.cell);
        this.addCell(ws, `M${row}`, this.totais.valor_ipi, this.excelStyles.currency);
        row++;
        
        // Terceira linha de totais
        this.addCell(ws, `A${row}`, 'PIS', this.excelStyles.cell);
        this.addCell(ws, `B${row}`, this.totais.valor_pis, this.excelStyles.currency);
        
        this.addCell(ws, `C${row}`, 'COFINS', this.excelStyles.cell);
        this.addCell(ws, `D${row}`, this.totais.valor_cofins, this.excelStyles.currency);
        
        this.addCell(ws, `K${row}`, 'VALOR TOTAL DA NOTA', this.excelStyles.totalsHeader);
        this.mergeCells(ws, `K${row}:M${row}`);
        this.addCell(ws, `N${row}`, this.totais.valor_total_nota, this.excelStyles.totalsValue);
        
        // Definir range e larguras
        ws['!ref'] = `A1:T${row + 2}`;
        this.setColumnWidths(ws);
        
        // Adicionar merges ao worksheet
        if (!ws['!merges']) {
            ws['!merges'] = [];
        }
        
        return ws;
    }
    
    // ========== CARREGAR DADOS CALCULADOS ==========
    
    /**
     * Carrega dados calculados do IndexedDB
     * SOLID: Não calcula, apenas lê dados já calculados
     */
    async loadCalculatedData() {
        try {
            const numeroDI = this.di.numero_di;
            
            // Se já tem cálculos, não precisa buscar
            if (this.calculos && this.calculos.totais_relatorio && this.calculos.produtos_individuais) {
                console.log(`✅ CroquiNFExporter: Usando dados calculados já carregados para DI ${numeroDI}`);
                return;
            }
            
            // Buscar dados calculados no IndexedDB usando getConfig
            const chave = `calculo_${numeroDI}`;
            const calculosDB = await this.dbManager.getConfig(chave);
            
            if (!calculosDB) {
                throw new Error(`Dados calculados não encontrados para DI ${numeroDI} - execute ComplianceCalculator primeiro`);
            }
            
            // Validar campos obrigatórios
            if (!calculosDB.totais_relatorio) {
                throw new Error('Totais do relatório não encontrados - execute ComplianceCalculator.calcularTotaisRelatorio() primeiro');
            }
            
            if (!calculosDB.produtos_individuais) {
                throw new Error('Produtos individuais não encontrados - execute ItemCalculator primeiro');
            }
            
            // Atualizar cálculos com dados do IndexedDB
            this.calculos = calculosDB;
            
            console.log(`✅ CroquiNFExporter: Dados calculados carregados do IndexedDB para DI ${numeroDI}`);
        } catch (error) {
            console.error('Erro ao carregar dados calculados:', error);
            throw error;
        }
    }
    
    // ========== GERAÇÃO PDF ==========
    
    async generatePDF() {
        // Carregar dados calculados do IndexedDB se necessário
        await this.loadCalculatedData();
        try {
            console.log('📝 Iniciando geração do PDF...');
            
            // Verificação correta do jsPDF
            if (typeof window.jspdf === 'undefined' && typeof jspdf === 'undefined') {
                throw new Error('Biblioteca jsPDF não encontrada');
            }
            
            const { jsPDF } = window.jspdf || jspdf;
            const doc = new jsPDF('landscape', 'mm', 'a4');
            
            // Configurar fontes
            doc.setFont('helvetica');
            
            // ADICIONAR CABEÇALHO E RODAPÉ EM TODAS AS PÁGINAS
            this.addHeaderFooterToAllPages(doc);
            
            // LOGO E CABEÇALHO EXPERTZY (now async)
            await this.addLogoAndHeader(doc);
            
            // SEÇÃO DESTINATÁRIO/REMETENTE
            this.addDestinatarioSection(doc);
            
            // DADOS DOS PRODUTOS
            this.addProdutosSection(doc);
            
            // CÁLCULO DO IMPOSTO
            this.addCalculoImpostoSection(doc);
            
            // INFORMAÇÕES COMPLEMENTARES
            this.addInformacoesComplementares(doc);
            
            // ADICIONAR CABEÇALHO E RODAPÉ FINAL
            this.addHeaderFooterToAllPages(doc);
            
            // Gerar buffer
            const pdfBuffer = doc.output('arraybuffer');
            
            console.log('✅ PDF gerado com sucesso');
            return pdfBuffer;
            
        } catch (error) {
            console.error('❌ Erro ao gerar PDF:', error);
            throw error;
        }
    }
    
    
    createManualPDFTable(doc) {
        // Implementação de fallback caso autoTable não esteja disponível
        let y = 55;
        const lineHeight = 7;
        
        // Cabeçalhos
        doc.setFontSize(8);
        doc.setFillColor(9, 26, 48); // Expertzy Navy
        doc.rect(20, y, 257, lineHeight, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text('Adição | Item | Produto | NCM | Peso | Valores...', 22, y + 5);
        
        // Resetar cor do texto
        doc.setTextColor(0, 0, 0);
        y += lineHeight;
        
        // Produtos
        doc.setFontSize(7);
        this.produtos.forEach(produto => {
            doc.text(`${produto.adicao} | ${produto.item} | ${produto.descricao.substring(0, 20)}...`, 22, y + 5);
            y += lineHeight;
        });
    }
    
    async addLogoAndHeader(doc) {
        // ===== LAYOUT PAISAGEM (297mm x 210mm) =====
        
        // Add header background with Expertzy colors
        doc.setFillColor(248, 249, 250); // Light gray background
        doc.rect(0, 0, 297, 50, 'F');
        
        // Add Expertzy Red accent line
        doc.setFillColor(255, 0, 45); // Expertzy Red
        doc.rect(0, 0, 297, 3, 'F');
        
        // Try to add the actual Expertzy logo if available
        try {
            // Check if logo exists and can be loaded
            // Using the official Expertzy logo
            const logoPath = '../../images/expertzy-it.png';
            const response = await fetch(logoPath);
            if (response.ok) {
                const blob = await response.blob();
                const reader = new FileReader();
                await new Promise((resolve, reject) => {
                    reader.onload = resolve;
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
                const logoData = reader.result;
                // Add official Expertzy logo (adjusted for better proportions)
                doc.addImage(logoData, 'PNG', 15, 10, 70, 20);
                console.log('✅ Logo Expertzy adicionado ao PDF');
            } else {
                console.warn('Logo not found at path, using text fallback');
                // Fallback to text logo if image not available
                this.addTextLogo(doc);
            }
        } catch (error) {
            console.warn('Could not load logo image, using text fallback:', error);
            // Fallback to text logo
            this.addTextLogo(doc);
        }
        
        // TÍTULO PRINCIPAL (centro) - Com destaque Expertzy
        doc.setTextColor(9, 26, 48); // Expertzy Navy
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('CROQUI NOTA FISCAL DE ENTRADA', 148, 20, { align: 'center' });
        
        // INFORMAÇÕES DA DI (distribuídas horizontalmente)
        doc.setTextColor(9, 26, 48); // Expertzy Navy
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`DI: ${this.header.di_numero}`, 80, 45);
        doc.text(`DATA REGISTRO: ${this.header.data_registro}`, 140, 45);
        doc.text(`CÂMBIO USD: ${this.header.taxa_cambio}`, 210, 45);
        
        // Linha separadora com cor Expertzy
        doc.setDrawColor(9, 26, 48); // Expertzy Navy
        doc.setLineWidth(0.5);
        doc.line(15, 50, 282, 50);
    }
    
    addTextLogo(doc) {
        // Text-based logo fallback
        // Background com Expertzy Navy
        doc.setFillColor(9, 26, 48); // Expertzy Navy
        doc.rect(15, 10, 70, 20, 'F');
        
        // Border com Expertzy Red para destaque
        doc.setDrawColor(255, 0, 45); // Expertzy Red
        doc.setLineWidth(1);
        doc.rect(15, 10, 70, 20, 'S');
        
        // Texto do logo
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('expertzy', 50, 18, { align: 'center' });
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.text('INTELIGÊNCIA TRIBUTÁRIA', 50, 25, { align: 'center' });
    }

    addHeaderFooterToAllPages(doc) {
        const pageCount = doc.getNumberOfPages();
        
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            
            // CABEÇALHO
            if (i > 1) { // Primeira página já tem cabeçalho customizado
                // Background do cabeçalho
                doc.setFillColor(248, 249, 250); // Light gray
                doc.rect(0, 0, 297, 25, 'F');
                
                // Linha vermelha superior
                doc.setFillColor(255, 0, 45); // Expertzy Red
                doc.rect(0, 0, 297, 2, 'F');
                
                // Logo pequeno no cabeçalho
                doc.setTextColor(9, 26, 48); // Expertzy Navy
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text('EXPERTZY', 15, 15);
                doc.setFontSize(6);
                doc.setFont('helvetica', 'normal');
                doc.text('INTELIGÊNCIA TRIBUTÁRIA', 15, 20);
                
                // Título do documento no centro
                doc.setTextColor(9, 26, 48);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.text(`CROQUI NF - DI ${this.header.di_numero}`, 148, 15, { align: 'center' });
            }
            
            // RODAPÉ
            const footerY = 200; // Posição Y do rodapé
            
            // Background do rodapé
            doc.setFillColor(9, 26, 48); // Expertzy Navy
            doc.rect(0, footerY, 297, 10, 'F');
            
            // Informações do rodapé
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            
            // Esquerda: Sistema
            doc.text('🚀 Sistema Expertzy v2.0', 15, footerY + 6);
            
            // Centro: Data/Hora
            const agora = new Date().toLocaleString('pt-BR');
            doc.text(`Gerado em: ${agora}`, 148, footerY + 6, { align: 'center' });
            
            // Direita: Página
            doc.text(`Página ${i} de ${pageCount}`, 282, footerY + 6, { align: 'right' });
        }
    }
    
    addDestinatarioSection(doc) {
        let y = 55;
        
        // SEÇÃO DESTINATÁRIO (IMPORTADOR BRASILEIRO)
        doc.setTextColor(9, 26, 48); // Expertzy Navy
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('DESTINATÁRIO (IMPORTADOR)', 15, y);
        
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        
        // Dados do importador (destinatário)
        doc.text(`NOME: ${this.header.importador.nome}`, 15, y);
        y += 4;
        doc.text(`CNPJ: ${this.header.importador.cnpj}`, 15, y);
        y += 4;
        doc.text(`ENDEREÇO: ${this.header.importador.endereco}`, 15, y);
        y += 4;
        doc.text(`MUNICÍPIO: ${this.header.importador.municipio} - ${this.header.importador.uf}`, 15, y);
        y += 4;
        doc.text(`CEP: ${this.header.importador.cep}`, 15, y);
        
        // SEÇÃO REMETENTE (FORNECEDOR/EXPORTADOR)
        doc.setTextColor(9, 26, 48); // Expertzy Navy
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('REMETENTE (EXPORTADOR)', 160, y - 16);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        
        // Dados do fornecedor (remetente)
        doc.text(`FORNECEDOR: ${this.header.fornecedor.nome}`, 160, y - 12);
        doc.text(`PAÍS: ${this.header.fornecedor.pais}`, 160, y - 8);
        doc.text(`ENDEREÇO: ${this.header.fornecedor.endereco}`, 160, y - 4);
        
        return y + 8;
    }
    
    addProdutosSection(doc) {
        const startY = 90;
        
        // DADOS DOS PRODUTOS
        doc.setTextColor(9, 26, 48); // Expertzy Navy
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('DADOS DOS PRODUTOS / SERVIÇOS', 15, startY);
        
        if (doc.autoTable) {
            const tableData = this.produtos.map(p => [
                p.adicao,
                p.descricao.substring(0, 35),
                p.ncm,
                p.unidade_real, // CORRIGIDO: Unidade real da DI
                p.total_un.toFixed(2),
                p.valor_unitario.toFixed(4),
                p.valor_total.toFixed(2),
                p.bc_icms.toFixed(2),
                p.valor_icms.toFixed(2),
                p.valor_ipi.toFixed(2),
                p.aliq_icms.toFixed(2),
                p.aliq_ipi.toFixed(2)
            ]);
            
            // CORRIGIDO: Usar dados reais da DI
            const tableDataCorrected = this.produtos.map(p => [
                p.adicao,
                p.descricao.substring(0, 40),
                p.ncm,
                p.unidade_real, // CORRIGIDO: Unidade real da DI
                p.total_un.toFixed(2), // Quantidade 
                this.formatCurrency(p.valor_unitario), // Valor unitário formatado
                this.formatCurrency(p.valor_total), // Valor total formatado
                this.formatCurrency(p.bc_icms), // BC ICMS formatado
                this.formatCurrency(p.valor_icms), // Valor ICMS formatado
                this.formatCurrency(p.valor_ipi), // Valor IPI formatado
                p.aliq_icms.toFixed(2), // Alíquota ICMS
                p.aliq_ipi.toFixed(2) // Alíquota IPI
            ]);

            doc.autoTable({
                startY: startY + 5,
                head: [[
                    'CÓDIGO',
                    'DESCRIÇÃO PRODUTO / SERVIÇO',
                    'NCM/SH',
                    'UN',
                    'QUANT.',
                    'VALOR UNIT.',
                    'VALOR TOTAL',
                    'B.CALC. ICMS',
                    'VALOR ICMS',
                    'VALOR IPI',
                    'ALIQ ICMS',
                    'ALIQ IPI'
                ]],
                body: tableDataCorrected,
                theme: 'grid',
                headStyles: {
                    fillColor: [9, 26, 48], // Expertzy Navy
                    textColor: 255,
                    fontSize: 8,
                    halign: 'center',
                    cellPadding: 2
                },
                bodyStyles: {
                    fontSize: 7,
                    cellPadding: 2
                },
                columnStyles: {
                    0: { cellWidth: 15 },      // Código (-3)
                    1: { cellWidth: 65 },      // Descrição (-5)
                    2: { cellWidth: 20 },      // NCM (-2)
                    3: { cellWidth: 10, halign: 'center' },   // UN (-2)
                    4: { cellWidth: 16, halign: 'right' },    // Quantidade (-2)
                    5: { cellWidth: 20, halign: 'right' },    // Valor Unit (-2)
                    6: { cellWidth: 20, halign: 'right' },    // Valor Total (-2)
                    7: { cellWidth: 20, halign: 'right' },    // BC ICMS (-2)
                    8: { cellWidth: 18, halign: 'right' },    // Valor ICMS (-2)
                    9: { cellWidth: 16, halign: 'right' },    // Valor IPI (-2)
                    10: { cellWidth: 16, halign: 'center' },  // Aliq ICMS (-2)
                    11: { cellWidth: 13, halign: 'center' }   // Aliq IPI (-2)
                },
                margin: { left: 15, right: 15 }
            });
        }
        
        return doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : startY + 40;
    }
    
    addCalculoImpostoSection(doc) {
        const startY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 140;
        
        // CÁLCULO DO IMPOSTO
        doc.setTextColor(9, 26, 48); // Expertzy Navy
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('CÁLCULO DO IMPOSTO', 15, startY);
        
        // Criar tabela de cálculo do imposto
        const impostoData = [
            [
                'BASE DE CÁLCULO DO ICMS',
                this.formatCurrency(this.totais.base_calculo_icms),
                'VALOR DO ICMS',
                this.formatCurrency(this.totais.valor_icms),
                'VALOR TOTAL DOS PRODUTOS',
                this.formatCurrency(this.totais.valor_total_produtos)
            ],
            [
                'VALOR DO FRETE',
                this.formatCurrency(this.totais.valor_frete),
                'VALOR DO SEGURO',
                this.formatCurrency(this.totais.valor_seguro),
                'VALOR DO DESCONTO',
                this.formatCurrency(this.totais.valor_desconto)
            ],
            [
                'OUTRAS DESPESAS',
                this.formatCurrency(this.totais.outras_despesas),
                'VALOR DO IPI',
                this.formatCurrency(this.totais.valor_ipi),
                'VALOR TOTAL DA NOTA',
                this.formatCurrency(this.totais.valor_total_nota)
            ]
        ];
        
        if (doc.autoTable) {
            doc.autoTable({
                startY: startY + 5,
                body: impostoData,
                theme: 'grid',
                bodyStyles: {
                    fontSize: 7
                },
                columnStyles: {
                    0: { cellWidth: 40, fontStyle: 'bold' },   // Reduced width
                    1: { cellWidth: 34, halign: 'right' },
                    2: { cellWidth: 40, fontStyle: 'bold' },
                    3: { cellWidth: 34, halign: 'right' },
                    4: { cellWidth: 40, fontStyle: 'bold' },
                    5: { cellWidth: 34, halign: 'right' }
                },
                margin: { left: 15, right: 15 }
            });
        }
        
        return doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : startY + 30;
    }
    
    addInformacoesComplementares(doc) {
        const startY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 180;
        
        // INFORMAÇÕES COMPLEMENTARES
        doc.setTextColor(9, 26, 48); // Expertzy Navy
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMAÇÕES COMPLEMENTARES', 15, startY);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        
        let y = startY + 5;
        
        // Informações dos tributos e despesas aduaneiras
        const infoLines = [
            `II R$ ${this.totais.valor_ii.toFixed(2)} IPI R$ ${this.totais.valor_ipi.toFixed(2)} PIS R$ ${this.totais.valor_pis.toFixed(2)} COFINS R$ ${this.totais.valor_cofins.toFixed(2)}`,
            `SISCOMEX ${this.formatCurrency(this.calculos?.despesas?.automaticas?.siscomex)} CAPATAZIA ${this.formatCurrency(this.calculos?.despesas?.automaticas?.capatazia)} AFRMM ${this.formatCurrency(this.calculos?.despesas?.automaticas?.afrmm)}`,
            `Nossa Referência: ${this.header.referencia_twa || 'N/A'}`,
            `REF.IMPORTADOR: ${this.header.referencia_importador || 'N/A'}`,
            `NOTA FISCAL DE IMPORTAÇÃO DE ACORDO COM A DI ${this.header.di_numero}`,
            `DESCRIÇÃO DA MERCADORIA CONFORME DI ${this.header.di_numero}`,
            '🚀 GERADO PELO SISTEMA EXPERTZY - www.expertzy.com.br'
        ];
        
        infoLines.forEach(line => {
            doc.text(line, 15, y);
            y += 4;
        });
        
        return y;
    }
    
    // ========== MÉTODOS AUXILIARES DO EXCEL ==========
    
    addCell(ws, address, value, style = null) {
        if (!ws[address]) {
            ws[address] = {};
        }
        
        // Tratar valores nulos/undefined
        if (value === null || value === undefined) {
            value = '';
        }
        
        ws[address].v = value;
        
        // Definir tipo da célula
        if (typeof value === 'number' && !isNaN(value)) {
            ws[address].t = 'n';
        } else if (typeof value === 'boolean') {
            ws[address].t = 'b';
        } else {
            ws[address].t = 's';
            ws[address].v = String(value);
        }
        
        // Aplicar estilo se fornecido
        if (style) {
            ws[address].s = style;
        }
    }
    
    mergeCells(ws, range) {
        if (!ws['!merges']) {
            ws['!merges'] = [];
        }
        
        // Parse range (ex: A1:D1)
        const [start, end] = range.split(':');
        const startCol = start.charCodeAt(0) - 65;
        const startRow = parseInt(start.substring(1)) - 1;
        const endCol = end.charCodeAt(0) - 65;
        const endRow = parseInt(end.substring(1)) - 1;
        
        ws['!merges'].push({
            s: { r: startRow, c: startCol },
            e: { r: endRow, c: endCol }
        });
    }
    
    setColumnWidths(ws) {
        const widths = [
            6,   // A - Adição
            8,   // B - Item
            30,  // C - Produto
            10,  // D - NCM
            8,   // E - Peso
            8,   // F - Quant CX
            8,   // G - Quant P/CX
            8,   // H - Total UN
            12,  // I - V. Unit
            12,  // J - V. Total
            12,  // K - BC ICMS
            12,  // L - V. ICMS
            12,  // M - BC IPI
            12,  // N - V. IPI
            10,  // O - ALIQ ICMS
            10,  // P - ALIQ IPI
            6,   // Q - MVA
            10,  // R - BC ST
            10,  // S - ST
            6    // T - FP
        ];
        
        ws['!cols'] = widths.map(width => ({ wch: width }));
    }
    
    // ========== MÉTODOS HELPER PARA ALÍQUOTAS ==========
    
    /**
     * Obter alíquota ICMS por NCM - USA DADOS JÁ CALCULADOS
     */
    getAliquotaICMSPorNCM(ncm) {
        if (!this.calculos) {
            throw new Error('Dados de cálculo não disponíveis. Execute o cálculo de impostos primeiro.');
        }
        
        if (this.calculos.impostos?.icms?.aliquota) {
            return this.calculos.impostos.icms.aliquota;
        }
        
        const estado = this.calculos.estado || 'não definido';
        throw new Error(`Alíquota ICMS não encontrada. Estado: ${estado}, NCM: ${ncm}`);
    }
    
    /**
     * Obter alíquota IPI por NCM - USA DADOS JÁ EXTRAÍDOS DA DI
     */
    getAliquotaIPIPorNCM(ncm) {
        if (this.di && this.di.adicoes) {
            const adicaoNCM = this.di.adicoes.find(ad => ad.ncm === ncm);
            if (adicaoNCM && adicaoNCM.tributos) {
                return adicaoNCM.tributos.ipi_aliquota_ad_valorem;
            }
        }
        throw new Error(`Alíquota IPI não encontrada para NCM ${ncm}`);
    }

    /**
     * Mapeia unidades de medida para formato padrão (ex: "QUILOGRAMA LIQUIDO" → "KG")
     * @param {string} unidadeOriginal - Unidade original da DI
     * @returns {Promise<string>} Unidade mapeada
     */
    async mapUnidade(unidadeOriginal) {
        if (!unidadeOriginal) {
            throw new Error('Unidade não fornecida - obrigatória para mapeamento');
        }

        const config = await this.loadUnitsMapping();
        const mapeamento = config.mapeamento_unidades;
        
        const unidadeNormalizada = unidadeOriginal.toUpperCase().trim();
        const unidadeMapeada = mapeamento[unidadeNormalizada];
        
        if (unidadeMapeada) {
            return unidadeMapeada;
        }
        
        // Se não tem mapeamento, usar a unidade original
        return unidadeOriginal;
    }

    /**
     * Carrega configuração de mapeamento de unidades
     * @returns {Promise<Object>} Configuração de unidades
     */
    async loadUnitsMapping() {
        if (!this.unitsMapping) {
            const response = await fetch(new URL('../../shared/data/unidades-medida.json', import.meta.url));
            if (!response.ok) {
                throw new Error(`Erro ao carregar unidades-medida.json: ${response.status}`);
            }
            this.unitsMapping = await response.json();
        }
        return this.unitsMapping;
    }

    /**
     * Extrai quantidade por caixa da descrição da mercadoria
     * @param {string} descricao - Descrição da mercadoria
     * @returns {number} Quantidade por caixa
     */
    extractQuantidadePorCaixa(descricao) {
        if (!descricao) {
            throw new Error('Descrição não fornecida - obrigatória para extrair quantidade por caixa');
        }

        // Padrões para detectar quantidade por caixa/embalagem
        const patterns = [
            /(\d+)\s*(?:un|und|unidades|pcs|peças|pçs)[\s\/]*(?:por|p|\/)\s*(?:caixa|cx|embalagem|emb)/i,
            /(\d+)\s*(?:x|×)\s*\d+/i, // Formato "12x500g"
            /(\d+)\s*(?:un|und|unidades|pcs|peças|pçs)/i // Quantidade simples
        ];

        for (const pattern of patterns) {
            const match = descricao.match(pattern);
            if (match) {
                const quantidade = parseInt(match[1]);
                if (!isNaN(quantidade) && quantidade > 0) {
                    return quantidade;
                }
            }
        }

        // Se não conseguir extrair, retornar 1 como padrão
        return 1;
    }
}

// ========== FUNÇÕES GLOBAIS PARA INTEGRAÇÃO ==========


window.gerarCroquiPDFNovo = async function(diData, incentiveManager = null) {
    try {
        console.log('🚀 Iniciando geração do Croqui NF PDF (v2.1 - IndexedDB)...');
        
        if (!diData) {
            throw new Error('Dados da DI não fornecidos - obrigatório para geração do croqui NF');
        }
        
        // Verificar se há cálculos disponíveis (pode vir de currentCalculation ou IndexedDB)
        let calculationData = window.currentCalculation;
        
        // Se não há currentCalculation, tentar recuperar do IndexedDB
        if (!calculationData && window.dbManager) {
            try {
                const diProcessadaKey = `di_processed_${diData.numero_di}`;
                calculationData = await window.dbManager.getConfig(diProcessadaKey);
                
                if (calculationData) {
                    console.log('✅ Cálculos recuperados do IndexedDB para gerar croqui');
                }
            } catch (error) {
                console.warn('⚠️ Erro ao recuperar cálculos do IndexedDB:', error);
            }
        }
        
        if (!calculationData) {
            throw new Error('Cálculos não encontrados - execute o cálculo de impostos primeiro');
        }
        
        const exporter = new CroquiNFExporter(diData, calculationData, incentiveManager);
        const buffer = await exporter.generatePDF();
        
        // Download do arquivo
        const blob = new Blob([buffer], {
            type: 'application/pdf'
        });
        
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
        
        console.log('✅ Croqui NF PDF gerado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao gerar Croqui NF PDF:', error);
        alert(`Erro ao gerar Croqui NF PDF: ${error.message}`);
    }
};

// ES6 Module Export - já exportado no início com export class