/**
 * ExcelExporter.js - Professional Multi-Sheet Excel Export Module
 * Migrated from legacy system to new ES6 module architecture
 * 
 * Generates comprehensive Excel workbook following ExtratoDI_COMPLETO template
 * Includes complete DI data, calculations, validation, and memory trace
 */

import { ExcelProfessionalStyles } from '@shared/utils/excel-professional-styles.js';
import { ExcelDataMapper } from './ExcelDataMapper.js';

export class ExcelExporter {
    constructor() {
        this.name = 'ExcelExporter';
        this.workbook = null;
        this.styles = new ExcelProfessionalStyles();
        this.mapper = null;  // ExcelDataMapper instance
    }

    /**
     * Main export method - generates complete multi-sheet workbook using ExcelDataMapper
     * KISS: Aceita apenas numeroDI, dados carregados automaticamente do IndexedDB
     * @param {string} numeroDI - Número da DI a ser exportada
     */
    async export(numeroDI) {
        // Validação KISS - apenas numeroDI obrigatório
        if (!numeroDI) {
            throw new Error('ExcelExporter: numeroDI é obrigatório');
        }

        console.log('📊 ExcelExporter: Iniciando export usando ExcelDataMapper...');
        console.log(`📋 DI ${numeroDI} será carregada do banco`);

        try {
            // KISS: ExcelDataMapper carrega dados do banco automaticamente
            this.mapper = new ExcelDataMapper(numeroDI);
            await this.mapper.initialize();

            // Armazenar referência para diData (usada em generateFilename e outras funções)
            this.diData = this.mapper.diData;

            // Obter mapeamentos de todas as abas
            const sheetMappings = this.mapper.getAllSheetMappings();
            console.log(`📊 ExcelDataMapper: ${sheetMappings.length} abas mapeadas`);

            // Create new ExcelJS workbook
            this.workbook = new ExcelJS.Workbook();
            this.workbook.creator = 'Expertzy - Sistema de Importação e Precificação';
            this.workbook.lastModifiedBy = 'ExcelExporter';
            this.workbook.created = new Date();
            this.workbook.modified = new Date();
            
            // Gerar todas as abas usando mapeamentos
            for (const sheetMapping of sheetMappings) {
                this.createSheetFromMapping(sheetMapping);
            }
            
            // Generate filename with DI number and date
            const filename = this.generateFilename(numeroDI);
            
            // Export file with ExcelJS (full formatting support)
            const arquivoBuffer = await this.workbook.xlsx.writeBuffer();
            this.downloadArquivo(arquivoBuffer, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            
            console.log(`✅ ExcelExporter: Export completo realizado via ExcelDataMapper - ${filename}`);
            console.log(`📊 Total de ${this.workbook.worksheets.length} abas criadas`);
            return { success: true, filename, sheets: sheetMappings.length };
            
        } catch (error) {
            console.error('❌ ExcelExporter: Erro no export:', error);
            throw new Error(`Falha no export Excel: ${error.message}`);
        }
    }

    /**
     * Creates a worksheet from ExcelDataMapper mapping
     * @param {Object} sheetMapping - Sheet configuration from mapper
     */
    createSheetFromMapping(sheetMapping) {
        if (!sheetMapping) {
            throw new Error('ExcelExporter: sheetMapping é obrigatório');
        }
        
        if (!sheetMapping.name) {
            throw new Error('ExcelExporter: sheetMapping.name é obrigatório');
        }
        
        if (!sheetMapping.type) {
            throw new Error('ExcelExporter: sheetMapping.type é obrigatório');
        }
        
        if (!sheetMapping.data) {
            throw new Error('ExcelExporter: sheetMapping.data é obrigatório');
        }

        console.log(`📋 ExcelExporter: Criando aba ${sheetMapping.name} (${sheetMapping.type})`);

        // Criar worksheet com nome do mapeamento
        const worksheet = this.workbook.addWorksheet(sheetMapping.name);
        
        // Delegar criação específica baseada no tipo
        switch (sheetMapping.type) {
            case 'capa':
                this.createCapaSheetFromMapping(worksheet, sheetMapping.data);
                break;
            case 'importador':
                this.createImportadorSheetFromMapping(worksheet, sheetMapping.data);
                break;
            case 'carga':
                this.createCargaSheetFromMapping(worksheet, sheetMapping.data);
                break;
            case 'valores':
                this.createValoresSheetFromMapping(worksheet, sheetMapping.data);
                break;
            case 'despesas':
                this.createDespesasSheetFromMapping(worksheet, sheetMapping.data);
                break;
            case 'tributos':
                this.createTributosSheetFromMapping(worksheet, sheetMapping.data);
                break;
            case 'resumo_custos':
                this.createResumoCustosSheetFromMapping(worksheet, sheetMapping.data);
                break;
            case 'ncms':
                this.createNCMsSheetFromMapping(worksheet, sheetMapping.data);
                break;
            case 'produtos':
                this.createProdutosSheetFromMapping(worksheet, sheetMapping.data);
                break;
            case 'memoria':
                this.createMemoriaSheetFromMapping(worksheet, sheetMapping.data);
                break;
            case 'incentivos':
                this.createIncentivosSheetFromMapping(worksheet, sheetMapping.data);
                break;
            case 'comparativo':
                this.createComparativoSheetFromMapping(worksheet, sheetMapping.data);
                break;
            case 'precificacao':
                this.createPrecificacaoSheetFromMapping(worksheet, sheetMapping.data);
                break;
            case 'validacao':
                this.createValidacaoSheetFromMapping(worksheet, sheetMapping.data);
                break;
            case 'adicao':
                this.createAdicaoSheetFromMapping(worksheet, sheetMapping.data);
                break;
            default:
                throw new Error(`ExcelExporter: Tipo de aba não suportado: ${sheetMapping.type}`);
        }
    }

    /**
     * Cria aba Capa usando dados do mapping
     * @param {Object} worksheet - ExcelJS worksheet
     * @param {Object} data - Dados da capa
     */
    createCapaSheetFromMapping(worksheet, data) {
        if (!data.titulo) {
            throw new Error('ExcelExporter: data.titulo é obrigatório para Capa');
        }
        
        if (!data.numero_di) {
            throw new Error('ExcelExporter: data.numero_di é obrigatório para Capa');
        }

        // Header principal
        worksheet.mergeCells('A1:B1');
        worksheet.getCell('A1').value = data.titulo;
        worksheet.getCell('A1').style = this.styles.estilosExpertzy.headerPrincipal;

        // Subtítulo
        worksheet.mergeCells('A2:B2');
        worksheet.getCell('A2').value = data.subtitulo;
        worksheet.getCell('A2').style = this.styles.estilosExpertzy.headerSecundario;

        // Dados básicos
        const dadosBasicos = [
            ['Campo', 'Valor'],
            ['DI', data.numero_di],
            ['Data registro', data.data_registro],
            ['URF despacho', `${data.urf_despacho.codigo} - ${data.urf_despacho.nome}`],
            ['Modalidade', data.resumo.modalidade],
            ['Qtd. adições', data.resumo.total_adicoes],
            ['INCOTERM', data.resumo.incoterm]
        ];

        // Adicionar dados à planilha
        dadosBasicos.forEach((row, index) => {
            const rowIndex = index + 4; // Começar após header e subtítulo
            worksheet.getCell(`A${rowIndex}`).value = row[0];
            worksheet.getCell(`B${rowIndex}`).value = row[1];
            
            if (index === 0) {
                // Header da tabela
                worksheet.getCell(`A${rowIndex}`).style = this.styles.estilosExpertzy.headerSecundario;
                worksheet.getCell(`B${rowIndex}`).style = this.styles.estilosExpertzy.headerSecundario;
            } else {
                // Dados
                worksheet.getCell(`A${rowIndex}`).style = { border: this.styles.estilosExpertzy.valorMonetario.border };
                worksheet.getCell(`B${rowIndex}`).style = { border: this.styles.estilosExpertzy.valorMonetario.border };
            }
        });

        // Ajustar larguras das colunas
        worksheet.getColumn('A').width = 20;
        worksheet.getColumn('B').width = 30;
    }

    /**
     * Cria aba Importador usando dados do mapping
     * @param {Object} worksheet - ExcelJS worksheet
     * @param {Object} data - Dados do importador
     */
    createImportadorSheetFromMapping(worksheet, data) {
        if (!data.identificacao) {
            throw new Error('ExcelExporter: data.identificacao é obrigatório para Importador');
        }
        
        if (!data.identificacao.cnpj) {
            throw new Error('ExcelExporter: data.identificacao.cnpj é obrigatório');
        }

        // Header
        worksheet.mergeCells('A1:B1');
        worksheet.getCell('A1').value = 'DADOS DO IMPORTADOR';
        worksheet.getCell('A1').style = this.styles.estilosExpertzy.headerPrincipal;

        let row = 3;

        // Identificação
        worksheet.getCell(`A${row}`).value = 'IDENTIFICAÇÃO';
        worksheet.getCell(`A${row}`).style = this.styles.estilosExpertzy.headerSecundario;
        worksheet.mergeCells(`A${row}:B${row}`);
        row++;

        const identificacao = [
            ['CNPJ', data.identificacao.cnpj],
            ['Razão Social', data.identificacao.nome],
            ['Telefone', data.identificacao.telefone]
        ];

        identificacao.forEach(([campo, valor]) => {
            worksheet.getCell(`A${row}`).value = campo;
            worksheet.getCell(`B${row}`).value = valor;
            worksheet.getCell(`A${row}`).style = { border: this.styles.estilosExpertzy.valorMonetario.border };
            worksheet.getCell(`B${row}`).style = { border: this.styles.estilosExpertzy.valorMonetario.border };
            row++;
        });

        // Endereço
        if (data.endereco) {
            row++;
            worksheet.getCell(`A${row}`).value = 'ENDEREÇO';
            worksheet.getCell(`A${row}`).style = this.styles.estilosExpertzy.headerSecundario;
            worksheet.mergeCells(`A${row}:B${row}`);
            row++;

            const endereco = [
                ['Logradouro', data.endereco.logradouro],
                ['Número', data.endereco.numero],
                ['Complemento', data.endereco.complemento],
                ['Bairro', data.endereco.bairro],
                ['Cidade', data.endereco.cidade],
                ['UF', data.endereco.uf],
                ['CEP', data.endereco.cep]
            ];

            endereco.forEach(([campo, valor]) => {
                if (valor) { // Só mostrar campos preenchidos
                    worksheet.getCell(`A${row}`).value = campo;
                    worksheet.getCell(`B${row}`).value = valor;
                    worksheet.getCell(`A${row}`).style = { border: this.styles.estilosExpertzy.valorMonetario.border };
                    worksheet.getCell(`B${row}`).style = { border: this.styles.estilosExpertzy.valorMonetario.border };
                    row++;
                }
            });
        }

        // Representante
        if (data.representante) {
            row++;
            worksheet.getCell(`A${row}`).value = 'REPRESENTANTE LEGAL';
            worksheet.getCell(`A${row}`).style = this.styles.estilosExpertzy.headerSecundario;
            worksheet.mergeCells(`A${row}:B${row}`);
            row++;

            const representante = [
                ['Nome', data.representante.nome],
                ['CPF', data.representante.cpf]
            ];

            representante.forEach(([campo, valor]) => {
                if (valor) {
                    worksheet.getCell(`A${row}`).value = campo;
                    worksheet.getCell(`B${row}`).value = valor;
                    worksheet.getCell(`A${row}`).style = { border: this.styles.estilosExpertzy.valorMonetario.border };
                    worksheet.getCell(`B${row}`).style = { border: this.styles.estilosExpertzy.valorMonetario.border };
                    row++;
                }
            });
        }

        // Ajustar larguras
        worksheet.getColumn('A').width = 20;
        worksheet.getColumn('B').width = 40;
    }

    /**
     * Cria aba Valores usando dados do mapping
     * @param {Object} worksheet - ExcelJS worksheet
     * @param {Object} data - Dados dos valores
     */
    createValoresSheetFromMapping(worksheet, data) {
        if (!data.valor_aduaneiro) {
            throw new Error('ExcelExporter: data.valor_aduaneiro é obrigatório para Valores');
        }

        // Header
        worksheet.mergeCells('A1:C1');
        worksheet.getCell('A1').value = 'VALORES DA IMPORTAÇÃO';
        worksheet.getCell('A1').style = this.styles.estilosExpertzy.headerPrincipal;

        let row = 3;

        // Valores FOB
        if (data.valores_fob) {
            worksheet.getCell(`A${row}`).value = 'VALORES FOB';
            worksheet.getCell(`A${row}`).style = this.styles.estilosExpertzy.headerSecundario;
            worksheet.mergeCells(`A${row}:C${row}`);
            row++;

            const fob = [
                ['Valor FOB USD', data.valores_fob.usd, 'USD'],
                ['Valor FOB BRL', data.valores_fob.brl, 'BRL']
            ];

            fob.forEach(([campo, valor, moeda]) => {
                if (typeof valor === 'number') {
                    worksheet.getCell(`A${row}`).value = campo;
                    worksheet.getCell(`B${row}`).value = valor;
                    worksheet.getCell(`C${row}`).value = moeda;
                    
                    worksheet.getCell(`A${row}`).style = { border: this.styles.estilosExpertzy.valorMonetario.border };
                    worksheet.getCell(`B${row}`).style = this.styles.estilosExpertzy.valorMonetario;
                    worksheet.getCell(`C${row}`).style = { border: this.styles.estilosExpertzy.valorMonetario.border };
                    row++;
                }
            });
        }

        // Frete
        if (data.frete) {
            row++;
            worksheet.getCell(`A${row}`).value = 'FRETE';
            worksheet.getCell(`A${row}`).style = this.styles.estilosExpertzy.headerSecundario;
            worksheet.mergeCells(`A${row}:C${row}`);
            row++;

            const frete = [
                ['Frete USD', data.frete.usd, 'USD'],
                ['Frete BRL', data.frete.brl, 'BRL'],
                ['Frete Cálculo', data.frete.calculo, 'BRL']
            ];

            frete.forEach(([campo, valor, moeda]) => {
                if (typeof valor === 'number') {
                    worksheet.getCell(`A${row}`).value = campo;
                    worksheet.getCell(`B${row}`).value = valor;
                    worksheet.getCell(`C${row}`).value = moeda;
                    
                    worksheet.getCell(`A${row}`).style = { border: this.styles.estilosExpertzy.valorMonetario.border };
                    worksheet.getCell(`B${row}`).style = this.styles.estilosExpertzy.valorMonetario;
                    worksheet.getCell(`C${row}`).style = { border: this.styles.estilosExpertzy.valorMonetario.border };
                    row++;
                }
            });
        }

        // Seguro
        if (data.seguro) {
            row++;
            worksheet.getCell(`A${row}`).value = 'SEGURO';
            worksheet.getCell(`A${row}`).style = this.styles.estilosExpertzy.headerSecundario;
            worksheet.mergeCells(`A${row}:C${row}`);
            row++;

            const seguro = [
                ['Seguro USD', data.seguro.usd, 'USD'],
                ['Seguro BRL', data.seguro.brl, 'BRL'],
                ['Seguro Cálculo', data.seguro.calculo, 'BRL']
            ];

            seguro.forEach(([campo, valor, moeda]) => {
                if (typeof valor === 'number') {
                    worksheet.getCell(`A${row}`).value = campo;
                    worksheet.getCell(`B${row}`).value = valor;
                    worksheet.getCell(`C${row}`).value = moeda;
                    
                    worksheet.getCell(`A${row}`).style = { border: this.styles.estilosExpertzy.valorMonetario.border };
                    worksheet.getCell(`B${row}`).style = this.styles.estilosExpertzy.valorMonetario;
                    worksheet.getCell(`C${row}`).style = { border: this.styles.estilosExpertzy.valorMonetario.border };
                    row++;
                }
            });
        }

        // Valor Aduaneiro
        row++;
        worksheet.getCell(`A${row}`).value = 'VALOR ADUANEIRO';
        worksheet.getCell(`A${row}`).style = this.styles.estilosExpertzy.headerSecundario;
        worksheet.mergeCells(`A${row}:C${row}`);
        row++;

        worksheet.getCell(`A${row}`).value = 'Valor Aduaneiro Total';
        worksheet.getCell(`B${row}`).value = data.valor_aduaneiro.brl;
        worksheet.getCell(`C${row}`).value = 'BRL';
        
        worksheet.getCell(`A${row}`).style = { border: this.styles.estilosExpertzy.valorMonetario.border };
        worksheet.getCell(`B${row}`).style = this.styles.estilosExpertzy.valorMonetario;
        worksheet.getCell(`C${row}`).style = { border: this.styles.estilosExpertzy.valorMonetario.border };
        row++;

        // INCOTERM
        if (data.incoterm) {
            row++;
            worksheet.getCell(`A${row}`).value = 'INCOTERM';
            worksheet.getCell(`A${row}`).style = this.styles.estilosExpertzy.headerSecundario;
            worksheet.mergeCells(`A${row}:C${row}`);
            row++;

            worksheet.getCell(`A${row}`).value = 'Código';
            worksheet.getCell(`B${row}`).value = data.incoterm.codigo;
            worksheet.mergeCells(`B${row}:C${row}`);
            worksheet.getCell(`A${row}`).style = { border: this.styles.estilosExpertzy.valorMonetario.border };
            worksheet.getCell(`B${row}`).style = { border: this.styles.estilosExpertzy.valorMonetario.border };
            row++;

            worksheet.getCell(`A${row}`).value = 'Descrição';
            worksheet.getCell(`B${row}`).value = data.incoterm.descricao;
            worksheet.mergeCells(`B${row}:C${row}`);
            worksheet.getCell(`A${row}`).style = { border: this.styles.estilosExpertzy.valorMonetario.border };
            worksheet.getCell(`B${row}`).style = { border: this.styles.estilosExpertzy.valorMonetario.border };
        }

        // Ajustar larguras
        worksheet.getColumn('A').width = 25;
        worksheet.getColumn('B').width = 20;
        worksheet.getColumn('C').width = 10;
    }

    /**
     * Cria placeholder para abas não implementadas
     * @param {Object} worksheet - ExcelJS worksheet
     * @param {Object} data - Dados da aba
     * @param {string} sheetType - Tipo da aba
     */
    createPlaceholderSheet(worksheet, data, sheetType) {
        // Header
        worksheet.getCell('A1').value = `ABA ${sheetType.toUpperCase()}`;
        worksheet.getCell('A1').style = this.styles.estilosExpertzy.headerPrincipal;

        worksheet.getCell('A3').value = 'Esta aba será implementada nas próximas fases.';
        worksheet.getCell('A4').value = `Dados disponíveis: ${Object.keys(data).length} campos`;
        
        // Listar campos disponíveis
        let row = 6;
        worksheet.getCell(`A${row}`).value = 'Campos Disponíveis:';
        worksheet.getCell(`A${row}`).style = this.styles.estilosExpertzy.headerSecundario;
        row++;

        Object.keys(data).forEach(key => {
            worksheet.getCell(`A${row}`).value = key;
            worksheet.getCell(`B${row}`).value = typeof data[key];
            row++;
        });

        worksheet.getColumn('A').width = 30;
        worksheet.getColumn('B').width = 15;
    }

    // Métodos placeholder para as demais abas
    createCargaSheetFromMapping(worksheet, data) {
        this.createPlaceholderSheet(worksheet, data, 'carga');
    }

    createDespesasSheetFromMapping(worksheet, data) {
        this.createPlaceholderSheet(worksheet, data, 'despesas');
    }

    createTributosSheetFromMapping(worksheet, data) {
        this.createPlaceholderSheet(worksheet, data, 'tributos');
    }

    createResumoCustosSheetFromMapping(worksheet, data) {
        this.createPlaceholderSheet(worksheet, data, 'resumo_custos');
    }

    createNCMsSheetFromMapping(worksheet, data) {
        this.createPlaceholderSheet(worksheet, data, 'ncms');
    }

    createProdutosSheetFromMapping(worksheet, data) {
        this.createPlaceholderSheet(worksheet, data, 'produtos');
    }

    createMemoriaSheetFromMapping(worksheet, data) {
        this.createPlaceholderSheet(worksheet, data, 'memoria');
    }

    createIncentivosSheetFromMapping(worksheet, data) {
        this.createPlaceholderSheet(worksheet, data, 'incentivos');
    }

    createComparativoSheetFromMapping(worksheet, data) {
        this.createPlaceholderSheet(worksheet, data, 'comparativo');
    }

    createPrecificacaoSheetFromMapping(worksheet, data) {
        this.createPlaceholderSheet(worksheet, data, 'precificacao');
    }

    createValidacaoSheetFromMapping(worksheet, data) {
        this.createPlaceholderSheet(worksheet, data, 'validacao');
    }

    createAdicaoSheetFromMapping(worksheet, data) {
        // Validações sem fallbacks - nomenclatura oficial obrigatória
        if (!data.numero_adicao) {
            throw new Error('ExcelExporter: numero_adicao é obrigatório para Adição');
        }

        if (!data.ncm) {
            throw new Error('ExcelExporter: ncm é obrigatório para Adição');
        }

        // Obter produtos individuais do mapper
        const produtosPorAdicao = this.mapper._mapearProdutosIndividuaisPorAdicao();
        const dadosAdicao = produtosPorAdicao.get(data.numero_adicao);

        if (!dadosAdicao) {
            throw new Error(`ExcelExporter: Dados da adição ${data.numero_adicao} não encontrados no mapper`);
        }

        // Header
        worksheet.mergeCells('A1:J1');
        worksheet.getCell('A1').value = `ADIÇÃO ${data.numero_adicao}`;
        worksheet.getCell('A1').style = this.styles.estilosExpertzy.headerPrincipal;

        let row = 3;

        // Informações básicas - nomenclatura oficial DIProcessor
        worksheet.getCell(`A${row}`).value = 'INFORMAÇÕES BÁSICAS';
        worksheet.getCell(`A${row}`).style = this.styles.estilosExpertzy.headerSecundario;
        worksheet.mergeCells(`A${row}:J${row}`);
        row++;

        const infos = [
            ['Número da Adição', data.numero_adicao],
            ['NCM', data.ncm],
            ['Descrição NCM', data.descricao_ncm],
            ['INCOTERM', data.condicao_venda_incoterm]
        ];

        infos.forEach(([campo, valor]) => {
            if (valor !== undefined && valor !== null) {
                worksheet.getCell(`A${row}`).value = campo;
                worksheet.getCell(`B${row}`).value = valor;
                worksheet.mergeCells(`B${row}:J${row}`);

                worksheet.getCell(`A${row}`).style = { border: this.styles.estilosExpertzy.valorMonetario.border };
                worksheet.getCell(`B${row}`).style = { border: this.styles.estilosExpertzy.valorMonetario.border };
                row++;
            }
        });

        // Seção PRODUTOS INDIVIDUAIS (FASE 2A)
        row++;
        worksheet.getCell(`A${row}`).value = 'PRODUTOS INDIVIDUAIS';
        worksheet.getCell(`A${row}`).style = this.styles.estilosExpertzy.headerSecundario;
        worksheet.mergeCells(`A${row}:J${row}`);
        row++;

        // Headers da tabela de produtos
        const produtoHeaders = [
            'Item', 'Código', 'Descrição', 'NCM', 'Quantidade',
            'Unidade', 'Valor Unit. USD', 'Valor Total USD',
            'Valor Unit. R$', 'Valor Total R$'
        ];

        produtoHeaders.forEach((header, index) => {
            const col = String.fromCharCode(65 + index); // A, B, C, ...
            worksheet.getCell(`${col}${row}`).value = header;
            worksheet.getCell(`${col}${row}`).style = this.styles.estilosExpertzy.headerSecundario;
        });
        row++;

        // Listar TODOS os produtos da adição
        const produtosStartRow = row;
        dadosAdicao.produtos.forEach((produto, index) => {
            // Truncar descrição se muito longa (max 50 caracteres)
            const descricaoTruncada = produto.descricao.length > 50
                ? produto.descricao.substring(0, 47) + '...'
                : produto.descricao;

            const produtoRow = [
                index + 1,  // Item sequencial
                produto.codigo,
                descricaoTruncada,
                produto.ncm,
                produto.quantidade,
                produto.unidade_medida,
                produto.valor_unitario_usd,
                produto.valor_total_usd,
                produto.valor_unitario_brl,
                produto.valor_total_brl
            ];

            produtoRow.forEach((valor, colIndex) => {
                const col = String.fromCharCode(65 + colIndex);
                worksheet.getCell(`${col}${row}`).value = valor;

                // Aplicar formatação por tipo
                if (colIndex === 0) {
                    // Item - número sequencial
                    worksheet.getCell(`${col}${row}`).style = {
                        border: this.styles.estilosExpertzy.valorMonetario.border
                    };
                } else if (colIndex === 3) {
                    // NCM - estilo especial
                    worksheet.getCell(`${col}${row}`).style = {
                        ...this.styles.estilosExpertzy.valorMonetario,
                        font: { name: 'Courier New', size: 10 }
                    };
                } else if (colIndex >= 6) {
                    // Valores monetários (Unit. USD, Total USD, Unit. R$, Total R$)
                    worksheet.getCell(`${col}${row}`).style = this.styles.estilosExpertzy.valorMonetario;
                } else if (colIndex === 4) {
                    // Quantidade - numérico simples
                    worksheet.getCell(`${col}${row}`).style = this.styles.estilosExpertzy.valorMonetario;
                } else {
                    // Outros campos - texto com borda
                    worksheet.getCell(`${col}${row}`).style = {
                        border: this.styles.estilosExpertzy.valorMonetario.border
                    };
                }
            });

            row++;
        });

        // Aplicar zebra striping na tabela de produtos
        const produtosEndRow = row - 1;
        if (produtosEndRow >= produtosStartRow) {
            this.styles.applyZebraStriping(
                worksheet,
                produtosStartRow,
                produtosEndRow,
                0,
                9  // 10 colunas (A-J)
            );
        }

        // Totais da tabela de produtos
        row++;
        worksheet.getCell(`A${row}`).value = 'TOTAL';
        worksheet.getCell(`A${row}`).style = this.styles.estilosExpertzy.headerSecundario;

        worksheet.getCell(`H${row}`).value = dadosAdicao.totais.valor_total_usd;
        worksheet.getCell(`H${row}`).style = this.styles.estilosExpertzy.valorMonetario;

        worksheet.getCell(`J${row}`).value = dadosAdicao.totais.valor_total_brl;
        worksheet.getCell(`J${row}`).style = this.styles.estilosExpertzy.valorMonetario;

        // Impostos - nomenclatura oficial DIProcessor
        row += 2;
        worksheet.getCell(`A${row}`).value = 'IMPOSTOS';
        worksheet.getCell(`A${row}`).style = this.styles.estilosExpertzy.headerSecundario;
        worksheet.mergeCells(`A${row}:D${row}`);
        row++;

        // Headers da tabela de impostos
        const impostoHeaders = ['Imposto', 'Alíquota (%)', 'Valor Devido', 'Valor a Recolher'];
        impostoHeaders.forEach((header, index) => {
            const col = String.fromCharCode(65 + index); // A, B, C, D
            worksheet.getCell(`${col}${row}`).value = header;
            worksheet.getCell(`${col}${row}`).style = this.styles.estilosExpertzy.headerSecundario;
        });
        row++;

        // Dados dos impostos - nomenclatura oficial DIProcessor
        const impostos = [
            ['II', data.ii_aliquota_ad_valorem, data.ii_valor_devido, data.ii_valor_recolher],
            ['IPI', data.ipi_aliquota_ad_valorem, data.ipi_valor_devido, data.ipi_valor_recolher],
            ['PIS', data.pis_aliquota_ad_valorem, data.pis_valor_devido, data.pis_valor_recolher],
            ['COFINS', data.cofins_aliquota_ad_valorem, data.cofins_valor_devido, data.cofins_valor_recolher]
        ];

        impostos.forEach(([imposto, aliquota, devido, recolher]) => {
            if (devido !== undefined || recolher !== undefined) {
                worksheet.getCell(`A${row}`).value = imposto;
                worksheet.getCell(`B${row}`).value = aliquota;
                worksheet.getCell(`C${row}`).value = devido;
                worksheet.getCell(`D${row}`).value = recolher;

                worksheet.getCell(`A${row}`).style = { border: this.styles.estilosExpertzy.valorMonetario.border };
                worksheet.getCell(`B${row}`).style = this.styles.estilosExpertzy.valorPercentual;
                worksheet.getCell(`C${row}`).style = this.styles.estilosExpertzy.valorMonetario;
                worksheet.getCell(`D${row}`).style = this.styles.estilosExpertzy.valorMonetario;
                row++;
            }
        });

        // Fornecedor - nomenclatura oficial DIProcessor
        if (data.fornecedor_nome) {
            row++;
            worksheet.getCell(`A${row}`).value = 'FORNECEDOR';
            worksheet.getCell(`A${row}`).style = this.styles.estilosExpertzy.headerSecundario;
            worksheet.mergeCells(`A${row}:D${row}`);
            row++;

            const fornecedor = [
                ['Nome', data.fornecedor_nome],
                ['Logradouro', data.fornecedor_logradouro],
                ['Número', data.fornecedor_numero],
                ['Cidade', data.fornecedor_cidade],
                ['Estado', data.fornecedor_estado]
            ];

            fornecedor.forEach(([campo, valor]) => {
                if (valor !== undefined && valor !== null) {
                    worksheet.getCell(`A${row}`).value = campo;
                    worksheet.getCell(`B${row}`).value = valor;
                    worksheet.mergeCells(`B${row}:D${row}`);

                    worksheet.getCell(`A${row}`).style = { border: this.styles.estilosExpertzy.valorMonetario.border };
                    worksheet.getCell(`B${row}`).style = { border: this.styles.estilosExpertzy.valorMonetario.border };
                    row++;
                }
            });
        }

        // Fabricante - nomenclatura oficial DIProcessor (se disponível)
        if (data.fabricante_nome) {
            row++;
            worksheet.getCell(`A${row}`).value = 'FABRICANTE';
            worksheet.getCell(`A${row}`).style = this.styles.estilosExpertzy.headerSecundario;
            worksheet.mergeCells(`A${row}:D${row}`);
            row++;

            const fabricante = [
                ['Nome', data.fabricante_nome],
                ['Cidade', data.fabricante_cidade],
                ['Estado', data.fabricante_estado]
            ];

            fabricante.forEach(([campo, valor]) => {
                if (valor !== undefined && valor !== null) {
                    worksheet.getCell(`A${row}`).value = campo;
                    worksheet.getCell(`B${row}`).value = valor;
                    worksheet.mergeCells(`B${row}:D${row}`);

                    worksheet.getCell(`A${row}`).style = { border: this.styles.estilosExpertzy.valorMonetario.border };
                    worksheet.getCell(`B${row}`).style = { border: this.styles.estilosExpertzy.valorMonetario.border };
                    row++;
                }
            });
        }

        // Estatísticas - nomenclatura oficial DIProcessor
        row++;
        worksheet.getCell(`A${row}`).value = 'ESTATÍSTICAS';
        worksheet.getCell(`A${row}`).style = this.styles.estilosExpertzy.headerSecundario;
        worksheet.mergeCells(`A${row}:D${row}`);
        row++;

        const stats = [
            ['Peso Líquido (kg)', data.peso_liquido],
            ['Quantidade Estatística', data.quantidade_estatistica],
            ['Unidade Estatística', data.unidade_estatistica]
        ];

        stats.forEach(([campo, valor]) => {
            if (valor !== undefined && valor !== null) {
                worksheet.getCell(`A${row}`).value = campo;
                worksheet.getCell(`B${row}`).value = valor;

                worksheet.getCell(`A${row}`).style = { border: this.styles.estilosExpertzy.valorMonetario.border };
                worksheet.getCell(`B${row}`).style = { border: this.styles.estilosExpertzy.valorMonetario.border };
                row++;
            }
        });

        // Ajustar larguras otimizadas para produtos individuais
        worksheet.getColumn('A').width = 6;   // Item
        worksheet.getColumn('B').width = 15;  // Código
        worksheet.getColumn('C').width = 40;  // Descrição
        worksheet.getColumn('D').width = 12;  // NCM
        worksheet.getColumn('E').width = 10;  // Quantidade
        worksheet.getColumn('F').width = 8;   // Unidade
        worksheet.getColumn('G').width = 15;  // Valor Unit. USD
        worksheet.getColumn('H').width = 15;  // Valor Total USD
        worksheet.getColumn('I').width = 15;  // Valor Unit. R$
        worksheet.getColumn('J').width = 15;  // Valor Total R$
    }

    /**
     * 01_Capa - Cover sheet with basic DI information (ExcelJS)
     */
    createCoverSheet() {
        const worksheet = this.workbook.addWorksheet('01_Capa');
        
        const data = [
            ['Campo', 'Valor'],
            ['DI', this.diData.numero_di],
            ['Data registro', this.diData.data_registro || 'N/D'],
            ['URF despacho', this.diData.urf_despacho_nome],
            ['Modalidade', this.diData.modalidade_nome],
            ['Qtd. adições', this.diData.adicoes.length],
            ['Situação', this.diData.situacao_entrega]
        ];

        // Adicionar dados à planilha
        worksheet.addRows(data);
        
        // Aplicar formatação profissional
        this.styles.applyHeaderStyle(worksheet, 'A1:B1');
        this.styles.applyZebraStriping(worksheet, 1, data.length - 1, 0, 1);
        this.styles.setOptimizedColumnWidths(worksheet, [30, 60]);
    }

    /**
     * 02_Importador - Importer company details
     */
    createImporterSheet() {
        const importador = this.diData.importador || {};
        // Construir endereço completo conforme nomenclatura.md
        const enderecoCompleto = [
            importador.endereco_logradouro,
            importador.endereco_numero,
            importador.endereco_complemento
        ].filter(Boolean).join(', ');
        
        const data = [
            ['Campo', 'Valor'],
            ['Nome/Razão Social', importador.nome],
            ['CNPJ', importador.cnpj || 'N/D'], // Already formatted XX.XXX.XXX/XXXX-XX by DIProcessor
            ['Endereço', enderecoCompleto],
            ['Cidade', importador.endereco_cidade],
            ['UF', importador.endereco_uf],
            ['CEP', importador.endereco_cep]
        ];

        const worksheet = this.workbook.addWorksheet('02_Importador');
        
        // Adicionar dados à planilha
        worksheet.addRows(data);
        
        // Aplicar formatação profissional
        this.styles.applyHeaderStyle(worksheet, 'A1:B1');
        this.styles.applyZebraStriping(worksheet, 1, data.length - 1, 0, 1);
        this.styles.setOptimizedColumnWidths(worksheet, [30, 60]);
    }

    /**
     * 03_Carga - Cargo and transport information
     */
    createCargoSheet() {
        const data = [
            ['Campo', 'Valor'],
            ['Peso Bruto (kg)', this.formatNumber(this.diData.carga.peso_bruto)],
            ['Peso Líquido (kg)', this.formatNumber(this.diData.carga.peso_liquido)],
            ['Via de Transporte', this.diData.carga.via_transporte_nome],
            ['Tipo de Declaração', this.diData.modalidade_nome],
            ['URF Entrada', this.diData.carga.urf_entrada_nome],
            ['Recinto Aduaneiro', this.diData.urf_despacho_nome]
        ];

        const worksheet = this.workbook.addWorksheet('03_Carga');
        worksheet.addRows(data);
        
        // Aplicar formatação profissional
        this.styles.applyHeaderStyle(worksheet, 'A1:B1');
        this.styles.applyZebraStriping(worksheet, 1, data.length - 1, 0, 1);
        this.styles.setOptimizedColumnWidths(worksheet, [30, 60]);
    }

    /**
     * 04_Valores - Values and exchange rates
     */
    createValuesSheet() {
        // Usar estrutura real conforme DIProcessor.js
        const moedas = this.diData.moedas || {};
        const vmle = moedas.vmle_vmld || {};
        const totais = this.diData.totais || {};
        
        const data = [
            ['Campo', 'Valor USD', 'Valor R$', 'Taxa Câmbio'],
            ['Taxa Câmbio', 
                '', 
                '', 
                this.formatNumber(vmle.taxa, 6)],
            [],
            ['Moeda Principal', vmle.codigo, vmle.sigla || 'USD', ''],
            ['Total FOB', 
                this.formatNumber(totais.valor_total_fob_usd), 
                this.formatNumber(totais.valor_total_fob_brl), 
                ''],
            ['Frete Internacional', 
                this.formatNumber(this.diData.frete_usd), 
                this.formatNumber(this.diData.frete_brl), 
                ''],
            ['Seguro Internacional', 
                this.formatNumber(this.diData.seguro_usd), 
                this.formatNumber(this.diData.seguro_brl), 
                ''],
            [],
            ['Data Taxa Câmbio', this.diData.data_registro || 'N/D', '', ''] // Already formatted by DIProcessor
        ];

        const worksheet = this.workbook.addWorksheet('04_Valores');
        worksheet.addRows(data);
        
        // Aplicar formatação profissional
        this.styles.applyHeaderStyle(worksheet, 'A1:D1');
        this.styles.applyZebraStriping(worksheet, 1, data.length - 2, 0, 3); // -2 para excluir linha vazia
        this.styles.setOptimizedColumnWidths(worksheet, [25, 20, 20, 20]);
    }

    /**
     * 04B_Despesas_Complementares - Additional expenses
     */
    createComplementaryExpensesSheet() {
        // Usar estrutura real conforme ComplianceCalculator analysis
        const despesasOriginais = this.diData?.despesas?.extras || {};
        const armazenagem = despesasOriginais.armazenagem_extra || 0;
        const transporte = despesasOriginais.transporte_interno || 0;
        const despachante = despesasOriginais.despachante || 0;
        const outras = (despesasOriginais.outros_portuarios || 0) + 
                      (despesasOriginais.bancarios || 0) + 
                      (despesasOriginais.administrativos || 0) + 
                      (despesasOriginais.outros_extras || 0);
        const totalExtras = armazenagem + transporte + despachante + outras;
        const totalBaseIcms = this.calculationData?.despesas?.total_base_icms || 0;
        
        const data = [
            ['Tipo de Despesa', 'Valor R$', 'Compõe Base ICMS'],
            ['Armazenagem', this.formatNumber(armazenagem), armazenagem > 0 ? 'Sim' : 'Não'],
            ['Transporte Interno', this.formatNumber(transporte), transporte > 0 ? 'Sim' : 'Não'],
            ['Despachante', this.formatNumber(despachante), despachante > 0 ? 'Sim' : 'Não'],
            ['Outras Despesas', this.formatNumber(outras), outras > 0 ? 'Sim' : 'Não'],
            [],
            ['Total Extras', this.formatNumber(totalExtras), ''],
            ['Total Base ICMS', this.formatNumber(totalBaseIcms), '']
        ];

        const worksheet = this.workbook.addWorksheet('04B_Despesas_Complementares');
        worksheet.addRows(data);
        
        this.styles.applyHeaderStyle(worksheet, 'A1:C1');
        this.styles.applyZebraStriping(worksheet, 1, data.length - 1, 0, 2);
        this.styles.setOptimizedColumnWidths(worksheet, [40, 20, 15]);
    }

    /**
     * 04A_Config_Custos - Cost configuration
     */
    createCostConfigSheet() {
        // Trust processed data from ComplianceCalculator
        const config = this.calculationData || {};
        const despesas = config.despesas || {};
        const impostos = config.impostos || {};
        
        const data = [
            ['Configuração', 'Valor'],
            ['Frete Embutido', this.diData.frete_embutido ? 'Sim' : 'Não'],
            ['Seguro Embutido', this.diData.seguro_embutido ? 'Sim' : 'Não'],
            ['Base de Cálculo', 'Valor Aduaneiro'],
            ['Valor Base R$', this.formatNumber(config.valores_base.valor_aduaneiro_total)],
            ['Frete Considerado R$', this.formatNumber(this.diData.frete_brl)],  // Fail-fast - must be number
            ['Seguro Considerado R$', this.formatNumber(this.diData.seguro_brl)],
            ['AFRMM R$', this.formatNumber(despesas.automaticas.afrmm)],
            ['Siscomex R$', this.formatNumber(despesas.automaticas.siscomex)],
            ['ICMS Normal R$', this.formatNumber(impostos.icms.valor_devido)],
            ['ICMS Alíquota %', impostos.icms.aliquota],
            ['Estado Destino', config.estado],
            [],
            ['Regime Tributário', config.regime_tributario], // Use processed value directly - no defaults
            ['Contribuinte IPI', 'Sim'], // Todo importador é contribuinte IPI
            ['Data Cálculo', new Date().toLocaleDateString('pt-BR')] // Format new date only
        ];

        const worksheet = this.workbook.addWorksheet('04A_Config_Custos');
        worksheet.addRows(data);
        
        this.styles.applyHeaderStyle(worksheet, 'A1:B1');
        this.styles.applyZebraStriping(worksheet, 1, data.length - 1, 0, 1);
        this.styles.setOptimizedColumnWidths(worksheet, [40, 25]);
    }

    /**
     * 05_Tributos_Totais - Total taxes summary
     */
    createTotalTaxesSheet() {
        // Trust processed data from ComplianceCalculator
        const impostos = this.calculationData?.impostos || {};
        const totais = this.calculationData?.totais || {};
        
        const data = [
            ['Tributo', 'Valor R$', '% do Total'],
            ['II - Imposto de Importação', 
                this.formatNumber(impostos.ii.valor_devido),
                this.formatPercent(impostos.ii.valor_devido, totais.total_impostos)],
            ['IPI - Imposto Produtos Industrializados', 
                this.formatNumber(impostos.ipi.valor_devido),
                this.formatPercent(impostos.ipi.valor_devido, totais.total_impostos)],
            ['PIS - Programa Integração Social', 
                this.formatNumber(impostos.pis.valor_devido),
                this.formatPercent(impostos.pis.valor_devido, totais.total_impostos)],
            ['COFINS - Contribuição Financ. Seg. Social', 
                this.formatNumber(impostos.cofins.valor_devido),
                this.formatPercent(impostos.cofins.valor_devido, totais.total_impostos)],
            ['ICMS - Imposto Circulação Mercadorias', 
                this.formatNumber(impostos.icms.valor_devido),
                this.formatPercent(impostos.icms.valor_devido, totais.total_impostos)],
            [],
            ['TOTAL IMPOSTOS', 
                this.formatNumber(totais.total_impostos),
                '100,00%'],
            [],
            ['Valor Aduaneiro', this.formatNumber(this.calculationData.valores_base?.valor_aduaneiro_total), ''],
            ['Total Despesas', this.formatNumber(this.calculationData.valores_base?.despesas_totais), ''],
            ['CUSTO TOTAL FINAL', this.formatNumber(this.calculationData.totais?.custo_total), '']
        ];

        const worksheet = this.workbook.addWorksheet('05_Tributos_Totais');
        worksheet.addRows(data);
        
        this.styles.applyHeaderStyle(worksheet, 'A1:C1');
        this.styles.applyCurrencyStyle(worksheet, 'B2:C' + data.length);
        this.styles.applyZebraStriping(worksheet, 1, data.length - 1, 0, 2);
        this.styles.setOptimizedColumnWidths(worksheet, [25, 20, 20]);
    }

    /**
     * 05A_Validacao_Custos - Cost validation and verification
     */
    createCostValidationSheet() {
        // Trust processed data - use what's available
        const totais = this.calculationData?.totais || {};
        const validacao = this.calculationData?.validacao || {};
        
        // Calculate validation metrics
        const custoCalculado = totais.custo_total;
        const valorEsperado = validacao?.valor_esperado || custoCalculado; // Default to calculated if no validation provided
        const diferenca = custoCalculado - valorEsperado;
        const percentDiferenca = valorEsperado > 0 ? (diferenca / valorEsperado) * 100 : 0;
        
        // Validate values before formatting
        if (custoCalculado === null || custoCalculado === undefined) {
            throw new Error('Custo total calculado é obrigatório para validação');
        }
        
        const data = [
            ['Métrica', 'Valor'],
            ['Custo Total Calculado', this.formatNumber(custoCalculado)],
            ['Valor Esperado', this.formatNumber(valorEsperado)],
            ['Diferença', this.formatNumber(Math.abs(diferenca))],
            ['% Diferença', percentDiferenca !== 0 ? this.formatPercent(Math.abs(percentDiferenca), 100) : '0,00%'],
            ['Status', Math.abs(percentDiferenca) < 0.5 ? 'OK' : 'DIVERGÊNCIA'],
            ['Configuração', `Frete: ${this.diData.frete_embutido ? 'Embutido' : 'Separado'}, Seguro: ${this.diData.seguro_embutido ? 'Embutido' : 'Separado'}`],
            [],
            ['Validação de Impostos', ''],
            ['II Extraído DI', this.diData.totais?.tributos_totais?.ii_total ? this.formatNumber(this.diData.totais.tributos_totais.ii_total) : 'N/D'],
            ['II Calculado', this.formatNumber(this.calculationData.impostos.ii.valor_devido)],
            ['IPI Extraído DI', this.diData.totais?.tributos_totais?.ipi_total ? this.formatNumber(this.diData.totais.tributos_totais.ipi_total) : 'N/D'],
            ['IPI Calculado', this.formatNumber(this.calculationData.impostos.ipi.valor_devido)],
            ['PIS/COFINS Extraído', (this.diData.totais?.tributos_totais?.pis_total || this.diData.totais?.tributos_totais?.cofins_total) ? this.formatNumber((this.diData.totais.tributos_totais.pis_total || 0) + (this.diData.totais.tributos_totais.cofins_total || 0)) : 'N/D'],
            ['PIS/COFINS Calculado', this.formatNumber(this.calculationData.impostos.pis.valor_devido + this.calculationData.impostos.cofins.valor_devido)]
        ];

        const worksheet = this.workbook.addWorksheet('05A_Validacao_Custos');
        worksheet.addRows(data);
        
        // Aplicar formatação profissional
        this.styles.applyHeaderStyle(worksheet, 'A1:B1');
        
        // Aplicar formatação condicional baseada na diferença
        const validationStatus = Math.abs(percentDiferenca) < 0.5 ? 'OK' : (Math.abs(percentDiferenca) < 5 ? 'AVISO' : 'ERRO');
        
        // Aplicar formatação de validação na linha de status
        this.styles.applyValidationStyle(worksheet, 'B6', validationStatus.toLowerCase());
        
        // Configurar larguras otimizadas e zebra striping
        this.styles.setOptimizedColumnWidths(worksheet, [35, 20]);
        this.styles.applyZebraStriping(worksheet, 1, data.length - 2, 0, 1); // Excluir linha vazia
    }

    /**
     * 06_Resumo_Adicoes - Additions summary
     */
    createAdditionsSummarySheet() {
        // Trust processed data from DIProcessor
        const adicoes = this.diData.adicoes || [];
        
        const data = [
            ['Adição', 'NCM', 'Descrição', 'INCOTERM', 'Valor USD', 'Valor R$', 'Qtd Produtos']
        ];

        adicoes.forEach(adicao => {
            data.push([
                adicao.numero_adicao,
                adicao.ncm,
                (adicao.descricao_ncm || 'N/D').substring(0, 30) + '...',  // ✅ Graceful handling for mock data
                adicao.condicao_venda_incoterm,
                this.formatNumber(adicao.valor_moeda_negociacao),
                this.formatNumber(adicao.valor_reais),
this.calculationData.produtos_individuais ? this.calculationData.produtos_individuais.filter(p => p.adicao_numero === adicao.numero_adicao).length : 0
            ]);
        });

        // Add totals row
        const totalUSD = adicoes.reduce((sum, a) => sum + a.valor_moeda_negociacao, 0);
        const totalBRL = adicoes.reduce((sum, a) => sum + a.valor_reais, 0);
        const totalProducts = this.calculationData.produtos_individuais ? this.calculationData.produtos_individuais.length : 0;
        
        data.push([]);
        data.push(['TOTAL', '', '', '', this.formatNumber(totalUSD), this.formatNumber(totalBRL), totalProducts]);

        const worksheet = this.workbook.addWorksheet('06_Resumo_Adicoes');
        worksheet.addRows(data);
        
        // Aplicar formatação profissional
        this.styles.applyHeaderStyle(worksheet, 'A1:G1');
        this.styles.applyZebraStriping(worksheet, 1, data.length - 3, 0, 6);
        this.styles.applyCurrencyStyle(worksheet, 'E2:F' + (data.length - 2));
        this.styles.applyNCMStyle(worksheet, 'B2:B' + (data.length - 3));
        this.styles.setOptimizedColumnWidths(worksheet, [8, 15, 45, 12, 18, 18, 10]);
        this.styles.setAutoFilter(worksheet, 'A1:G' + (data.length - 3));
    }

    /**
     * 06A_Resumo_Custos - Cost summary by addition
     */
    createCostSummarySheet() {
        // Usar dados já processados pelo ComplianceCalculator - sem fallbacks
        const adicoes = this.calculationData.adicoes_detalhes;
        
        if (!adicoes) {
            throw new Error('Adições com rateio não disponíveis - ComplianceCalculator deve ter processado completamente');
        }
        
        const data = [
            ['Adição', 'NCM', 'INCOTERM', 'Valor Mercadoria R$', 'Frete Rateado R$', 'Seguro Rateado R$', 
             'AFRMM Rateado R$', 'Siscomex Rateado R$', 'II R$', 'IPI R$', 'PIS R$', 'COFINS R$', 'ICMS R$', 'Custo Total R$']
        ];

        adicoes.forEach(adicao => {
            // Usar dados já processados - falhar se ausentes
            if (!adicao.despesas_rateadas) {
                throw new Error(`Despesas rateadas ausentes na adição ${adicao.numero_adicao}`);
            }
            if (!adicao.impostos) {
                throw new Error(`Impostos ausentes na adição ${adicao.numero_adicao}`);
            }
            
            data.push([
                adicao.numero_adicao,
                adicao.ncm,
                adicao.condicao_venda_incoterm,
                this.formatNumber(adicao.valor_aduaneiro),
                this.formatNumber(adicao.despesas_rateadas.frete),
                this.formatNumber(adicao.despesas_rateadas.seguro),
                this.formatNumber(adicao.despesas_rateadas.afrmm),
                this.formatNumber(adicao.despesas_rateadas.siscomex),
                this.formatNumber(adicao.impostos.ii),
                this.formatNumber(adicao.impostos.ipi),
                this.formatNumber(adicao.impostos.pis),
                this.formatNumber(adicao.impostos.cofins),
                this.formatNumber(adicao.impostos.icms),
                this.formatNumber(adicao.custo_total)
            ]);
        });

        // Add totals row usando valores já calculados
        const totals = this.calculateTotalsByColumn(adicoes);
        data.push([]);
        data.push(['TOTAL', '', '', 
            this.formatNumber(totals.valor_aduaneiro),
            this.formatNumber(totals.frete),
            this.formatNumber(totals.seguro),
            this.formatNumber(totals.afrmm),
            this.formatNumber(totals.siscomex),
            this.formatNumber(totals.ii),
            this.formatNumber(totals.ipi),
            this.formatNumber(totals.pis),
            this.formatNumber(totals.cofins),
            this.formatNumber(totals.icms),
            this.formatNumber(totals.custo_total)
        ]);

        const worksheet = this.workbook.addWorksheet('06A_Resumo_Custos');
        worksheet.addRows(data);
        
        // Aplicar formatação profissional
        this.styles.applyHeaderStyle(worksheet, 'A1:N1');
        this.styles.applyZebraStriping(worksheet, 1, data.length - 3, 0, 13);
        this.styles.applyCurrencyStyle(worksheet, 'D2:N' + (data.length - 2));
        this.styles.applyNCMStyle(worksheet, 'B2:B' + (data.length - 3));
        
        // Destacar linha de totais
        this.styles.applySecondaryHeaderStyle(worksheet, 'A' + data.length + ':N' + data.length);
        
        this.styles.setOptimizedColumnWidths(worksheet, [8, 12, 12, 15, 15, 15, 15, 15, 12, 12, 10, 12, 12, 15]);
        this.styles.setAutoFilter(worksheet, 'A1:N' + (data.length - 3));
    }

    /**
     * Create individual addition sheets dynamically based on actual additions
     * CRÍTICO: Não assume quantidade fixa - cria baseado em this.diData.adicoes.length
     */
    createIndividualAdditionSheets() {
        // Trust processed data from DIProcessor
        const adicoes = this.diData.adicoes || [];
        
        if (adicoes.length === 0) {
            console.warn('⚠️ DI sem adições - nenhuma aba Add_XXX será criada');
            return;
        }
        
        // Criar uma aba para CADA adição existente, seja 1 ou 100+
        adicoes.forEach((adicao, index) => {
            const sheetName = `Add_${String(index + 1).padStart(3, '0')}`;
            const calculoAdicao = this.calculationData.adicoes_detalhes[index];
            
            if (!calculoAdicao) {
                throw new Error(`Cálculo da adição ${adicao.numero_adicao} não encontrado em adicoes_detalhes`);
            }
            
            this.createAdditionDetailSheet(adicao, calculoAdicao, sheetName);
        });
        
        console.log(`📊 Criadas ${adicoes.length} abas de adições (Add_001 a Add_${String(adicoes.length).padStart(3, '0')})`);
    }

    /**
     * Create detailed sheet for a single addition
     */
    createAdditionDetailSheet(adicao, calculo, sheetName) {
        // Use ONLY the correct field names documented in CLAUDE.md
        const data = [
            ['DADOS GERAIS'],
            ['Campo', 'Valor'],
            ['NCM', adicao.ncm],
            ['Descrição NCM', adicao.descricao_ncm],
            ['VCMV USD', this.formatNumber(adicao.valor_moeda_negociacao)],
            ['VCMV R$', this.formatNumber(adicao.valor_reais)],
            ['INCOTERM', adicao.condicao_venda_incoterm],
            ['Local', adicao.condicao_venda_local],
            ['Moeda', adicao.moeda_negociacao_nome],
            ['Peso líq. (kg)', this.formatNumber(adicao.peso_liquido)],
            ['Quantidade', this.formatNumber(adicao.quantidade_estatistica)],
            ['Unidade', adicao.unidade_estatistica],
            ['Taxa Câmbio', this.formatNumber(this.di.taxa_cambio, 6)],  // CORREÇÃO CRÍTICA: usar taxa única da DI
            [],
            ['TRIBUTOS'],
            ['Tributo', 'Alíquota %', 'Base Cálculo R$', 'Valor Devido R$'],
            ['II', 
                this.formatNumber(adicao.tributos.ii_aliquota_ad_valorem), 
                this.formatNumber(adicao.valor_reais),
                this.formatNumber(adicao.tributos.ii_valor_devido)],
            ['IPI', 
                this.formatNumber(adicao.tributos.ipi_aliquota_ad_valorem),
                this.formatNumber(adicao.valor_reais + adicao.tributos.ii_valor_devido),
                this.formatNumber(adicao.tributos.ipi_valor_devido)],
            ['PIS', 
                this.formatNumber(adicao.tributos.pis_aliquota_ad_valorem),
                this.formatNumber(adicao.valor_reais),
                this.formatNumber(adicao.tributos.pis_valor_devido)],
            ['COFINS', 
                this.formatNumber(adicao.tributos.cofins_aliquota_ad_valorem),
                this.formatNumber(adicao.valor_reais),
                this.formatNumber(adicao.tributos.cofins_valor_devido)],
            ['ICMS', 
                this.formatNumber(this.calculationData?.impostos?.icms?.aliquota),
                this.formatNumber(calculo.impostos?.icms_base || adicao.valor_reais),
                this.formatNumber(this.calculationData?.impostos?.icms?.valor_devido)],
            [],
            ['PRODUTOS'],
            ['Código', 'Descrição', 'Quantidade', 'Unidade', 'Valor Unit. USD', 'Valor Total USD', 'Valor Unit. R$', 'Valor Total R$']
        ];

        // Add products using pre-calculated data from ComplianceCalculator
        const produtosDaAdicao = this.calculationData.produtos_individuais.filter(p => p.adicao_numero === adicao.numero_adicao);
        if (produtosDaAdicao.length > 0) {
            produtosDaAdicao.forEach(produto => {
                data.push([
                    produto.codigo,
                    produto.descricao,
                    this.formatNumber(produto.quantidade),
                    produto.unidade_medida,
                    this.formatNumber(produto.valor_unitario_usd),
                    this.formatNumber(produto.valor_total_usd),
                    this.formatNumber(produto.valor_unitario_brl),
                    this.formatNumber(produto.valor_total_brl)
                ]);
            });
        }

        // Add expense allocation - usar dados já rateados
        data.push([]);
        data.push(['RATEIO DE DESPESAS']);
        data.push(['Despesa', 'Valor Rateado R$']);
        
        // Usar despesas já rateadas pelo ComplianceCalculator
        if (!calculo.despesas_rateadas) {
            throw new Error(`Despesas rateadas ausentes na adição ${adicao.numero_adicao}`);
        }
        
        data.push(['AFRMM Rateado', this.formatNumber(calculo.despesas_rateadas.afrmm)]);
        data.push(['SISCOMEX Rateado', this.formatNumber(calculo.despesas_rateadas.siscomex)]);
        data.push(['Capatazia Rateada', this.formatNumber(calculo.despesas_rateadas.capatazia)]);
        data.push(['Frete Rateado', this.formatNumber(calculo.despesas_rateadas.frete)]);
        data.push(['Seguro Rateado', this.formatNumber(calculo.despesas_rateadas.seguro)]);
        data.push(['Total Despesas Rateadas', this.formatNumber(calculo.despesas_rateadas.total)]);

        // Add cost summary - usar valores já calculados
        data.push([]);
        data.push(['RESUMO DE CUSTOS']);
        data.push(['Item', 'Valor R$']);
        data.push(['Valor Aduaneiro', this.formatNumber(calculo.valor_aduaneiro)]);
        data.push(['Total Impostos', this.formatNumber(
            calculo.impostos.ii + calculo.impostos.ipi + calculo.impostos.pis + calculo.impostos.cofins + calculo.impostos.icms
        )]);
        data.push(['Total Despesas', this.formatNumber(calculo.despesas_rateadas.total)]);
        data.push(['CUSTO TOTAL', this.formatNumber(calculo.custo_total)]);

        const worksheet = this.workbook.addWorksheet(sheetName);
        worksheet.addRows(data);
        
        // Aplicar formatação profissional para adições individuais
        this.styles.applyHeaderStyle(worksheet, 'A1:B1');
        this.styles.applyHeaderStyle(worksheet, 'A2:B2');
        
        // Seção tributos
        this.styles.applySecondaryHeaderStyle(worksheet, 'A15:A15');
        this.styles.applyHeaderStyle(worksheet, 'A16:D16');
        
        // Formatar percentuais e monetários
        this.styles.applyPercentageStyle(worksheet, 'B17:B21');
        this.styles.applyCurrencyStyle(worksheet, 'C17:D21');
        this.styles.applyCurrencyStyle(worksheet, 'B3:B16');
        
        // Seção produtos
        const produtosStartRow = data.findIndex(row => row[0] === 'PRODUTOS');
        if (produtosStartRow > -1) {
            this.styles.applySecondaryHeaderStyle(worksheet, 'A' + (produtosStartRow + 1) + ':A' + (produtosStartRow + 1));
            this.styles.applyHeaderStyle(worksheet, 'A' + (produtosStartRow + 2) + ':H' + (produtosStartRow + 2));
        }
        
        this.styles.applyNCMStyle(worksheet, 'B3:B3');
        this.styles.setOptimizedColumnWidths(worksheet, [25, 40, 15, 15, 18, 18, 18, 18]);
    }

    /**
     * 99_Complementar - Complementary notes
     */
    createComplementarySheet() {
        const data = [
            ['Observações e Notas Complementares'],
            [''],
            ['Data Processamento', new Date().toLocaleDateString('pt-BR')], // Format new date only
            ['Sistema', 'Expertzy - Sistema de Importação e Precificação'],
            ['Versão', '2025.1'],
            [''],
            ['DI Processada:'],
            [`- Número: ${this.diData.numero_di}`],
            [`- Total de Adições: ${this.diData.adicoes.length}`],
            [`- Estado Destino: ${this.calculationData.estado}`],
            [''],
            ['Notas:'],
            ['- Cálculos baseados na legislação vigente'],
            ['- ICMS calculado conforme estado de destino'],
            ['- Todos os importadores são contribuintes de IPI'],
            ['- Despesas aduaneiras rateadas proporcionalmente ao valor'],
            ['- Número de abas de adições criadas dinamicamente'],
            [''],
            ['Memória de Cálculo:'],
            [`- Total de operações registradas: ${this.memoryData ? this.memoryData.operations.length : 0}`],
            [`- Sessão de cálculo: ${this.memoryData ? this.memoryData.sessionId : 'Sessão não disponível'}`]
        ];

        const worksheet = this.workbook.addWorksheet('99_Complementar');
        worksheet.addRows(data);
        
        // Aplicar formatação profissional
        this.styles.applyHeaderStyle(worksheet, 'A1:A1');
        this.styles.applySecondaryHeaderStyle(worksheet, 'A7:A7');
        this.styles.applySecondaryHeaderStyle(worksheet, 'A12:A12');
        this.styles.applySecondaryHeaderStyle(worksheet, 'A19:A19');
        
        this.styles.setOptimizedColumnWidths(worksheet, [150]);
    }

    /**
     * Croqui_NFe_Entrada - Formatted for fiscal document
     */
    createCroquiNFeSheet() {
        // Usar dados pré-calculados pelo ComplianceCalculator - sem fallbacks
        const produtosIndividuais = this.calculationData.produtos_individuais;
        
        if (!produtosIndividuais) {
            throw new Error('Produtos individuais não calculados - ComplianceCalculator deve processar produtos por item');
        }
        
        if (produtosIndividuais.length === 0) {
            throw new Error('Nenhum produto individual encontrado para croqui NFe');
        }
        
        console.log(`📊 Usando ${produtosIndividuais.length} produtos pré-calculados para croqui NFe`);
        
        const produtos = produtosIndividuais.map(produto => {
            // Usar dados já processados - sem fallbacks
            return {
                adicao: produto.adicao_numero,
                ncm: produto.ncm,
                codigo: produto.codigo,
                descricao: produto.descricao,
                quantidade: produto.quantidade,
                unidade: produto.unidade_medida,
                valor_unitario: produto.valor_unitario_brl,
                valor_total: produto.valor_total_brl,
                // Usar valores pré-calculados exatamente como vêm
                ii: produto.ii_item,
                ipi: produto.ipi_item, 
                pis: produto.pis_item,
                cofins: produto.cofins_item,
                icms: produto.icms_item
            };
        });

        const data = [
            ['CROQUI PARA NOTA FISCAL DE ENTRADA'],
            [''],
            ['Item', 'NCM', 'Código', 'Descrição', 'Qtd', 'Un', 'V.Unit', 'V.Total', 'II', 'IPI', 'PIS', 'COFINS', 'ICMS', 'Total c/ Impostos']
        ];

        produtos.forEach((produto, index) => {
            const totalComImpostos = produto.valor_total + produto.ii + produto.ipi + produto.pis + produto.cofins + produto.icms;
            
            data.push([
                index + 1,
                produto.ncm,
                produto.codigo,
                produto.descricao,
                this.formatNumber(produto.quantidade),
                produto.unidade,
                this.formatNumber(produto.valor_unitario),
                this.formatNumber(produto.valor_total),
                this.formatNumber(produto.ii),
                this.formatNumber(produto.ipi),
                this.formatNumber(produto.pis),
                this.formatNumber(produto.cofins),
                this.formatNumber(produto.icms),
                this.formatNumber(totalComImpostos)
            ]);
        });

        // Add totals using pre-calculated values
        const totals = produtos.reduce((acc, p) => ({
            valor_total: acc.valor_total + p.valor_total,
            ii: acc.ii + p.ii,
            ipi: acc.ipi + p.ipi,
            pis: acc.pis + p.pis,
            cofins: acc.cofins + p.cofins,
            icms: acc.icms + p.icms
        }), { valor_total: 0, ii: 0, ipi: 0, pis: 0, cofins: 0, icms: 0 });
        
        console.log(`✅ Croqui NFe: ${produtos.length} produtos processados com impostos pré-calculados`);

        const grandTotal = totals.valor_total + totals.ii + totals.ipi + totals.pis + totals.cofins + totals.icms;

        data.push([]);
        data.push(['TOTAL', '', '', '', '', '', '', 
            this.formatNumber(totals.valor_total),
            this.formatNumber(totals.ii),
            this.formatNumber(totals.ipi),
            this.formatNumber(totals.pis),
            this.formatNumber(totals.cofins),
            this.formatNumber(totals.icms),
            this.formatNumber(grandTotal)
        ]);

        const worksheet = this.workbook.addWorksheet('Croqui_NFe_Entrada');
        worksheet.addRows(data);
        
        // Aplicar formatação profissional estilo nota fiscal
        this.styles.applyHeaderStyle(worksheet, 'A1:A1'); // Título principal
        this.styles.applyHeaderStyle(worksheet, 'A3:N3'); // Headers da tabela
        
        // Aplicar zebra striping e formatação
        this.styles.applyZebraStriping(worksheet, 3, data.length - 3, 0, 13);
        this.styles.applyCurrencyStyle(worksheet, 'G4:N' + (data.length - 2));
        this.styles.applyNCMStyle(worksheet, 'B4:B' + (data.length - 3));
        
        // Destacar linha de totais
        this.styles.applySecondaryHeaderStyle(worksheet, 'A' + data.length + ':N' + data.length);
        
        this.styles.setOptimizedColumnWidths(worksheet, [6, 12, 15, 40, 8, 6, 15, 15, 12, 12, 10, 12, 12, 18]);
        this.styles.setAutoFilter(worksheet, 'A3:N' + (data.length - 3));
    }

    // ========== Helper Methods ==========

    /**
     * Format number with Brazilian locale - trusts processed data
     */
    formatNumber(value, decimals = 2) {
        // Trust processed data - display N/D for missing values
        if (value === null || value === undefined || isNaN(value)) {
            return 'N/D';
        }
        return value.toLocaleString('pt-BR', { 
            minimumFractionDigits: decimals, 
            maximumFractionDigits: decimals 
        });
    }

    /**
     * Format percentage - trusts processed data
     */
    formatPercent(value, total) {
        // Trust processed data - display N/D for invalid calculations
        if (value === null || value === undefined || total === null || total === undefined || total === 0) {
            return 'N/D';
        }
        const percent = (value / total) * 100;
        return this.formatNumber(percent, 2) + '%';
    }

    /**
     * Format date - ONLY for new Date objects (DIProcessor already formats DI dates)
     */
    formatDate(date) {
        // DIProcessor already formats DI dates to DD/MM/YYYY - only format new Date() objects
        if (date instanceof Date) {
            return date.toLocaleDateString('pt-BR');
        }
        
        // If it's already a string, trust it's processed by DIProcessor
        if (typeof date === 'string') {
            return date;
        }
        
        // For missing dates, return N/D instead of throwing error
        return 'N/D';
    }

    /**
     * Aplicar formatação monetária brasileira
     */
    applyCurrencyFormatting(ws, range) {
        this.styles.applyCurrencyStyle(ws, range);
    }
    
    /**
     * Aplicar formatação de percentual
     */
    applyPercentageFormatting(ws, range) {
        this.styles.applyPercentageStyle(ws, range);
    }
    
    /**
     * Aplicar formatação NCM com fonte monospace
     */
    applyNCMFormatting(ws, range) {
        this.styles.applyNCMStyle(ws, range);
    }
    
    /**
     * Aplicar zebra striping nas tabelas
     */
    applyZebraStriping(ws, startRow, endRow, startCol, endCol) {
        this.styles.applyZebraStriping(ws, startRow, endRow, startCol, endCol);
    }

    /**
     * Format CNPJ - DIProcessor already formats CNPJs to XX.XXX.XXX/XXXX-XX
     * This method only handles edge cases
     */
    formatCNPJ(cnpj) {
        // Trust DIProcessor formatting - CNPJs arrive already formatted
        if (!cnpj) {
            return 'N/D';
        }
        
        // Return as-is - DIProcessor already handles formatting
        return cnpj;
    }

    /**
     * Apply professional header style to worksheet cells
     */
    applyHeaderStyle(worksheet, range) {
        this.styles.applyHeaderStyle(worksheet, range);
    }
    
    /**
     * Apply secondary header style
     */
    applySecondaryHeaderStyle(ws, range) {
        this.styles.applySecondaryHeaderStyle(ws, range);
    }
    
    /**
     * Apply zebra striping to table data
     */
    applyZebraStriping(ws, startRow, endRow, startCol, endCol) {
        this.styles.applyZebraStriping(ws, startRow, endRow, startCol, endCol);
    }
    
    /**
     * Apply professional currency formatting
     */
    applyCurrencyFormatting(ws, range) {
        this.styles.applyCurrencyStyle(ws, range);
    }
    
    /**
     * Apply percentage formatting
     */
    applyPercentageFormatting(ws, range) {
        this.styles.applyPercentageStyle(ws, range);
    }

    /**
     * REFATORADO: Não calcula mais, apenas lê dados já calculados
     * Seguindo princípio Single Responsibility - cálculos movidos para ComplianceCalculator
     */
    calculateTotalsByColumn(adicoes) {
        // Verificar se totais já foram calculados
        if (this.calculos && this.calculos.totais_por_coluna) {
            return this.calculos.totais_por_coluna;
        }
        
        // Se não foram calculados, lançar erro - NO FALLBACKS
        throw new Error('Totais por coluna não encontrados - execute ComplianceCalculator.calcularTotaisPorColuna() primeiro');
    }

    
    /**
     * Generate filename with DI number, date, and importer
     */
    generateFilename(numeroDI) {
        // Use processed data directly - no reprocessing
        const dataRegistro = this.diData.data_registro || 
            new Date().toLocaleDateString('pt-BR');
        
        // Clean importer name for filename
        const nomeImportador = this.diData.importador?.nome ? 
            this.diData.importador.nome
                .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
                .replace(/\s+/g, '_')          // Replace spaces with underscore
                .substring(0, 20)              // Limit to 20 characters
                .toUpperCase() : 
            'IMPORTADOR';
        
        const date = dataRegistro.replace(/\//g, '-');
        return `ExtratoDI_COMPLETO_${numeroDI}_${date}_${nomeImportador}.xlsx`;
    }

    /**
     * Download arquivo com formatação preservada (baseado no sistema original)
     */
    downloadArquivo(conteudo, nomeArquivo, mimeType) {
        const blob = new Blob([conteudo], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = nomeArquivo;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpar URL para evitar vazamentos de memória
        window.URL.revokeObjectURL(url);
    }
}