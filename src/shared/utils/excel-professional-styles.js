/**
 * Excel Professional Styles - Formatação Corporativa Expertzy
 * Migrated from legacy system to new ES6 module architecture
 * Cores corporativas, formatação condicional e zebra striping
 */

export class ExcelProfessionalStyles {
    constructor() {
        // Estilos corporativos Expertzy para ExcelJS
        this.estilosExpertzy = {
            // Cores corporativas (formato ExcelJS)
            cores: {
                vermelhoExpertzy: 'FFFF002D',      // #FF002D
                azulNaval: 'FF091A30',             // #091A30
                branco: 'FFFFFFFF',                // #FFFFFF
                azulCorporativo: 'FF4285F4',       // Headers padrão
                verdeClaro: 'FFE8F5E8',            // Aprovado/OK
                amareloClaro: 'FFFFF3CD',          // Aviso
                vermelhoClaro: 'FFFFEAEA',         // Erro
                cinzaClaro: 'FFF5F5F5',            // Alternância zebra
                azulClaro: 'FFE3F2FD'              // Informativo
            },
            
            // Estilos de header principal
            headerPrincipal: {
                fill: {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF091A30' }  // Azul naval
                },
                font: {
                    bold: true,
                    color: { argb: 'FFFFFFFF' },
                    size: 14
                },
                alignment: {
                    horizontal: 'center',
                    vertical: 'middle'
                },
                border: {
                    top: { style: 'medium', color: { argb: 'FF000000' } },
                    left: { style: 'medium', color: { argb: 'FF000000' } },
                    bottom: { style: 'medium', color: { argb: 'FF000000' } },
                    right: { style: 'medium', color: { argb: 'FF000000' } }
                }
            },
            
            // Estilos de header secundário
            headerSecundario: {
                fill: {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF4285F4' }  // Azul corporativo
                },
                font: {
                    bold: true,
                    color: { argb: 'FFFFFFFF' },
                    size: 12
                },
                alignment: {
                    horizontal: 'center',
                    vertical: 'middle'
                },
                border: {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } }
                }
            },
            
            // Estilos de dados
            valorMonetario: {
                numFmt: '"R$ "#,##0.00_);[Red]("R$ "#,##0.00)',
                alignment: {
                    horizontal: 'right',
                    vertical: 'middle'
                },
                border: {
                    top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
                }
            },
            
            valorPercentual: {
                numFmt: '0.00%',
                alignment: {
                    horizontal: 'right',
                    vertical: 'middle'
                },
                border: {
                    top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
                }
            },
            
            textoNormal: {
                alignment: {
                    horizontal: 'left',
                    vertical: 'middle'
                },
                border: {
                    top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
                }
            },
            
            ncmMonospace: {
                font: {
                    name: 'Courier New',
                    size: 10
                },
                alignment: {
                    horizontal: 'center',
                    vertical: 'middle'
                },
                border: {
                    top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
                }
            },
            
            // Estilos de validação
            validacaoOK: {
                fill: {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFE8F5E8' }  // Verde claro
                },
                font: {
                    color: { argb: 'FF2E7D32' },
                    bold: true
                },
                border: {
                    top: { style: 'thin', color: { argb: 'FF4CAF50' } },
                    left: { style: 'thin', color: { argb: 'FF4CAF50' } },
                    bottom: { style: 'thin', color: { argb: 'FF4CAF50' } },
                    right: { style: 'thin', color: { argb: 'FF4CAF50' } }
                }
            },
            
            validacaoAviso: {
                fill: {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFF8E1' }  // Amarelo claro
                },
                font: {
                    color: { argb: 'FFF57F17' },
                    bold: true
                },
                border: {
                    top: { style: 'thin', color: { argb: 'FFFFC107' } },
                    left: { style: 'thin', color: { argb: 'FFFFC107' } },
                    bottom: { style: 'thin', color: { argb: 'FFFFC107' } },
                    right: { style: 'thin', color: { argb: 'FFFFC107' } }
                }
            },
            
            validacaoErro: {
                fill: {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFFFEBEE' }  // Vermelho claro
                },
                font: {
                    color: { argb: 'FFC62828' },
                    bold: true
                },
                border: {
                    top: { style: 'thin', color: { argb: 'FFF44336' } },
                    left: { style: 'thin', color: { argb: 'FFF44336' } },
                    bottom: { style: 'thin', color: { argb: 'FFF44336' } },
                    right: { style: 'thin', color: { argb: 'FFF44336' } }
                }
            },
            
            // Estilos para totais
            subtotal: {
                fill: {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFE3F2FD' }  // Azul claro
                },
                font: {
                    bold: true,
                    size: 11
                },
                border: {
                    top: { style: 'medium', color: { argb: 'FF1976D2' } },
                    left: { style: 'thin', color: { argb: 'FF1976D2' } },
                    bottom: { style: 'thin', color: { argb: 'FF1976D2' } },
                    right: { style: 'thin', color: { argb: 'FF1976D2' } }
                }
            },
            
            total: {
                fill: {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF091A30' }  // Azul naval
                },
                font: {
                    bold: true,
                    color: { argb: 'FFFFFFFF' },
                    size: 12
                },
                border: {
                    top: { style: 'medium', color: { argb: 'FF000000' } },
                    left: { style: 'medium', color: { argb: 'FF000000' } },
                    bottom: { style: 'medium', color: { argb: 'FF000000' } },
                    right: { style: 'medium', color: { argb: 'FF000000' } }
                }
            },
            
            // Zebra striping
            linhaAlternada: {
                fill: {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF5F5F5' }  // Cinza bem claro
                },
                border: {
                    top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
                    right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
                }
            }
        };
    }
    
    /**
     * Aplicar formatação de header principal (ExcelJS)
     */
    applyHeaderStyle(worksheet, cellRange) {
        const range = this.parseRange(cellRange);
        for (let row = range.startRow; row <= range.endRow; row++) {
            for (let col = range.startCol; col <= range.endCol; col++) {
                const cell = worksheet.getCell(row, col);
                cell.style = this.estilosExpertzy.headerPrincipal;
            }
        }
    }
    
    /**
     * Aplicar formatação de header secundário (ExcelJS)
     */
    applySecondaryHeaderStyle(worksheet, cellRange) {
        const range = this.parseRange(cellRange);
        for (let row = range.startRow; row <= range.endRow; row++) {
            for (let col = range.startCol; col <= range.endCol; col++) {
                const cell = worksheet.getCell(row, col);
                cell.style = this.estilosExpertzy.headerSecundario;
            }
        }
    }
    
    /**
     * Aplicar zebra striping para tabelas (ExcelJS)
     */
    applyZebraStriping(worksheet, startRow, endRow, startCol, endCol) {
        for (let row = startRow; row <= endRow; row++) {
            const isZebra = (row % 2) === 0;
            if (isZebra) {
                for (let col = startCol; col <= endCol; col++) {
                    const cell = worksheet.getCell(row + 1, col + 1); // ExcelJS é 1-indexed
                    const currentStyle = cell.style || {};
                    cell.style = {
                        ...currentStyle,
                        fill: {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: this.estilosExpertzy.cores.cinzaClaro }
                        }
                    };
                }
            }
        }
    }
    
    /**
     * Aplicar formatação monetária brasileira (ExcelJS)
     */
    applyCurrencyStyle(worksheet, cellRange) {
        const range = this.parseRange(cellRange);
        for (let row = range.startRow; row <= range.endRow; row++) {
            for (let col = range.startCol; col <= range.endCol; col++) {
                const cell = worksheet.getCell(row, col);
                cell.style = {
                    ...cell.style,
                    ...this.estilosExpertzy.valorMonetario
                };
            }
        }
    }
    
    /**
     * Aplicar formatação de percentual (ExcelJS)
     */
    applyPercentageStyle(worksheet, cellRange) {
        const range = this.parseRange(cellRange);
        for (let row = range.startRow; row <= range.endRow; row++) {
            for (let col = range.startCol; col <= range.endCol; col++) {
                const cell = worksheet.getCell(row, col);
                cell.style = {
                    ...cell.style,
                    ...this.estilosExpertzy.valorPercentual
                };
            }
        }
    }
    
    /**
     * Aplicar formatação de validação (OK, Aviso, Erro)
     */
    applyValidationStyle(worksheet, cellAddress, status) {
        const cell = worksheet.getCell(cellAddress);
        
        let style;
        switch (status.toLowerCase()) {
            case 'ok':
            case 'aprovado':
                style = this.estilosExpertzy.validacaoOK;
                break;
            case 'aviso':
            case 'warning':
                style = this.estilosExpertzy.validacaoAviso;
                break;
            case 'erro':
            case 'error':
                style = this.estilosExpertzy.validacaoErro;
                break;
            default:
                style = this.estilosExpertzy.textoNormal;
        }
        
        cell.style = style;
    }
    
    /**
     * Aplicar formatação de NCM com fonte monospace (ExcelJS)
     */
    applyNCMStyle(worksheet, cellRange) {
        const range = this.parseRange(cellRange);
        for (let row = range.startRow; row <= range.endRow; row++) {
            for (let col = range.startCol; col <= range.endCol; col++) {
                const cell = worksheet.getCell(row, col);
                cell.style = this.estilosExpertzy.ncmMonospace;
            }
        }
    }
    
    /**
     * Configurar larguras de coluna otimizadas (ExcelJS)
     */
    setOptimizedColumnWidths(worksheet, columnWidths) {
        columnWidths.forEach((width, index) => {
            const column = worksheet.getColumn(index + 1);
            column.width = width;
        });
    }
    
    /**
     * Configurar auto-filter (ExcelJS)
     */
    setAutoFilter(worksheet, range) {
        worksheet.autoFilter = range;
    }
    
    /**
     * Parser de range A1:B5 para objeto com coordenadas
     */
    parseRange(range) {
        const [start, end] = range.split(':');
        const startCoords = this.cellToCoords(start);
        const endCoords = this.cellToCoords(end);
        
        return {
            startRow: startCoords.row,
            startCol: startCoords.col,
            endRow: endCoords.row,
            endCol: endCoords.col
        };
    }
    
    /**
     * Converter célula A1 para coordenadas numéricas
     */
    cellToCoords(cell) {
        const match = cell.match(/([A-Z]+)(\d+)/);
        if (!match) throw new Error(`Formato de célula inválido: ${cell}`);
        
        const colStr = match[1];
        const rowNum = parseInt(match[2]);
        
        let colNum = 0;
        for (let i = 0; i < colStr.length; i++) {
            colNum = colNum * 26 + (colStr.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
        }
        
        return { row: rowNum, col: colNum };
    }
}

// Export para uso em outros módulos
export { ExcelProfessionalStyles };