<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# Documento Técnico: Sistema de Análise de DI com Custos, Incentivos Fiscais e Precificação

## 1. Visão Geral do Sistema

O sistema desenvolvido em Python/Tkinter é uma solução completa para análise de Declarações de Importação (DI), oferecendo cálculos precisos de custos, aplicação de incentivos fiscais estaduais e módulo integrado de precificação para formação de preços de venda.

### 1.1 Funcionalidades Principais

- **Processamento de XML de DI**: Extração completa de dados estruturados
- **Cálculo de Custos Unitários**: Rateio proporcional de todos os tributos e despesas
- **Incentivos Fiscais Estaduais**: Suporte a 4 estados com programas específicos
- **Configurações Especiais**: Redução de base, dólar diferenciado, substituição tributária
- **Módulo de Precificação**: Cálculo de preços de venda com impostos sobre vendas
- **Validação Automática**: Verificação de consistência dos cálculos
- **Geração Excel Avançada**: Planilhas formatadas com análise detalhada

## 2. Arquitetura do Sistema

### 2.1 Estrutura de Classes Principais

```python
class AppExtrato(tk.Tk)              # Interface principal
class JanelaPrecificacao             # Módulo de precificação
```

### 2.2 Módulos Funcionais

- **Processamento de XML**: `carrega_di_completo()`
- **Cálculo de Custos**: `calcular_custos_unitarios()`
- **Incentivos Fiscais**: `calcular_icms_com_incentivo()`
- **Validação**: `validar_custos()`
- **Geração Excel**: `gera_excel_completo()`

## 3. Incentivos Fiscais Estaduais

### 3.1 Estados Suportados

| Estado             | Programa      | Carga Efetiva                        | Características                                    |
|:------------------ |:------------- |:------------------------------------ |:-------------------------------------------------- |
| **Goiás**          | COMEXPRODUZIR | 1,92% (interestadual), 4% (estadual) | Crédito outorgado 65% e Redução da Base de Cálculo |
| **Santa Catarina** | TTD 409       | 1,4%                                 | Alíquotas progressivas                             |
| **Espírito Santo** | INVEST-ES     | 4,34%                                | Diferimento + redução 75%                          |
| **Minas Gerais**   | Corredor MG   | 1,0% (c/ similar)                    | Crédito presumido variável                         |

### 3.2 Estrutura de Dados dos Incentivos

```python
INCENTIVOS_FISCAIS = {
    "GO": {
        "nome": "COMEXPRODUZIR",
        "parametros": {
            "aliquota_interestadual": 0.04,
            "credito_outorgado_pct": 0.65,
            "contrapartidas": {
                "FUNPRODUZIR": 0.05,
                "PROTEGE": 0.15
            }
        }
    }
    # ... demais estados
}
```

### 3.3 Cálculo por Estado

#### 3.3.1 Goiás - COMEXPRODUZIR

- **Operação Interestadual**: Crédito outorgado de 65% sobre ICMS devido
- **Contrapartidas**: FUNPRODUZIR (5%) + PROTEGE (15%) sobre benefício
- **Operação Interna**: Alíquota reduzida para 4%

#### 3.3.2 Santa Catarina - TTD 409

- **Fase 1** (0-36 meses): Alíquota efetiva 2,6%
- **Fase 2** (36+ meses): Alíquota efetiva 1,0%
- **Contrapartida**: Fundo de Educação (0,4%)

#### 3.3.3 Espírito Santo - INVEST-ES

- **Diferimento**: 100% do ICMS na importação
- **Redução**: 75% do ICMS na saída para CD
- **Taxa Administrativa**: 0,5% sobre ICMS diferido

#### 3.3.4 Minas Gerais - Corredor MG

- **Com Similar Nacional**: Crédito presumido 3% (interestadual), 6% (interno)
- **Sem Similar Nacional**: Crédito presumido 2,5% (interestadual), 5% (interno)

## 4. Configurações Especiais Avançadas

### 4.1 Redução de Base de Cálculo

```python
"reducao_base_entrada": {
    "ativo": Boolean,
    "percentual": Float,           # 100% = sem redução
    "aplicacao": "DI|adicao|item", # Nível de aplicação
    "adicoes_especificas": [],     # Adições específicas
    "itens_especificos": []        # Itens específicos
}
```

### 4.2 Dólar Diferenciado

```python
"dolar_diferenciado": {
    "ativo": Boolean,
    "taxa_contratada": Float,      # Taxa diferente da DI
    "taxa_di": Float,              # Taxa oficial da DI
    "aplicacao": "DI|adicao|item",
    "adicoes_especificas": {},     # {num_adicao: taxa_especifica}
    "itens_especificos": {}        # {seq_item: taxa_especifica}
}
```

### 4.3 Substituição Tributária

```python
"substituicao_tributaria": {
    "st_entrada": {
        "ativo": Boolean,
        "aliquota_st": Float,
        "base_calculo_st": "valor_aduaneiro|valor_operacao"
    },
    "st_saida": {
        "ativo": Boolean,
        "aliquota_st": Float,
        "mva": Float              # Margem de Valor Agregado
    }
}
```

## 5. Processamento de Custos

### 5.1 Fluxo de Cálculo

```python
def calcular_custos_unitarios(dados, **kwargs):
    # 1. Extrair totais da DI
    # 2. Aplicar incentivos fiscais (se habilitado)
    # 3. Calcular ICMS com configurações especiais
    # 4. Processar cada adição com dólar diferenciado
    # 5. Ratear custos proporcionalmente
    # 6. Distribuir custos por item
    # 7. Calcular custos unitários e por peça
```

### 5.2 Componentes de Custo

Para cada item são calculados:

- **Valor Mercadoria**: FOB convertido
- **Frete Rateado**: Proporcional se não embutido
- **Seguro Rateado**: Proporcional se não embutido
- **AFRMM/SISCOMEX**: Rateio proporcional
- **Tributos**: II, IPI, PIS, COFINS, ICMS
- **ICMS-ST**: Quando aplicável
- **Custo Total**: Soma de todos componentes
- **Custo Unitário**: Por unidade comercial
- **Custo por Peça**: Considerando embalagem

### 5.3 Validação de Custos

```python
validacao = {
    "Custo Total Calculado": Float,
    "Valor Esperado": Float,
    "Diferença": Float,
    "% Diferença": Float,
    "Status": "OK|DIVERGÊNCIA"
}
```

## 6. Módulo de Precificação

### 6.1 Funcionalidades

- **Cálculo de Créditos Tributários**: Regime real vs. presumido
- **Formação de Preços**: Impostos por dentro e por fora
- **Margem Real**: Verificação da margem efetiva obtida
- **Exportação Excel**: Planilhas de precificação detalhadas

### 6.2 Cálculo de Créditos

```python
def calcular_creditos_tributarios(custo_item_data, regime="real"):
    creditos = {
        "ICMS Crédito": custo_item_data["ICMS Incorporado R$"],
        "IPI Crédito": custo_item_data["IPI R$"],
        "PIS Crédito": custo_item_data["PIS R$"] if regime == "real" else 0,
        "COFINS Crédito": custo_item_data["COFINS R$"] if regime == "real" else 0
    }
    return creditos, custo_bruto - total_creditos
```

### 6.3 Cálculo de Preço de Venda

```python
def calcular_preco_venda(custo_liquido, margem_desejada, **impostos):
    # Ajustar alíquotas conforme regime (real/presumido)
    # Calcular preço base: (Custo + Margem) / (1 - Impostos_por_dentro)
    # IPI calculado "por fora" sobre preço base
    # Verificar margem real obtida
    return preco_detalhado
```

## 7. Geração de Excel

### 7.1 Estrutura de Abas

| Aba                           | Conteúdo                     |
|:----------------------------- |:---------------------------- |
| `01_Capa`                     | Dados do cabeçalho da DI     |
| `02_Importador`               | Dados do importador          |
| `03_Carga`                    | Informações da carga         |
| `04_Valores`                  | Valores FOB, frete, seguro   |
| `04A_Config_Custos`           | Configuração aplicada        |
| `04B_Despesas_Complementares` | AFRMM, SISCOMEX extraídos    |
| `05_Tributos_Totais`          | Tributos consolidados        |
| `05A_Validacao_Custos`        | Validação dos cálculos       |
| `06_Resumo_Adicoes`           | Resumo por adição            |
| `06A_Resumo_Custos`           | Custos detalhados por adição |
| `Add_XXX`                     | Aba individual por adição    |
| `Croqui_NFe_Entrada`          | Modelo de nota fiscal        |
| `99_Complementar`             | Informações complementares   |

### 7.2 Formatação Excel

```python
# Formatos aplicados
money = {"num_format": "#,##0.00"}
percent = {"num_format": "0.00%"}
hdr_secao = {"bold": True, "bg_color": "#4F81BD", "font_color": "white"}
hdr_custo = {"bold": True, "bg_color": "#FFA500", "font_color": "white"}
```

### 7.3 Aba Individual por Adição

Cada adição possui aba própria com:

- **Dados Gerais**: NCM, VCMV, INCOTERM, etc.
- **Partes Envolvidas**: Exportador, fabricante, países
- **Tributos**: Detalhamento de cada imposto
- **Análise de Custos**: Rateio de todos os componentes
- **Itens Detalhados**: Custos individuais por item com formatação de tabela Excel
- **Totais**: Consolidação por adição

## 8. Interface de Usuário

### 8.1 Seções da Interface

1. **Seleção de XML**: Carregamento do arquivo da DI
2. **Configuração de Custos**: Frete/seguro embutido (INCOTERM)
3. **Estado e Incentivos**: Seleção do estado e ativação de incentivos
4. **Configurações Especiais**: Opções avançadas
5. **Despesas Adicionais**: Entrada manual de AFRMM/SISCOMEX
6. **Local de Salvamento**: Definição do arquivo Excel
7. **Processamento**: Execução e status

### 8.2 Funcionalidades Interativas

- **Detecção Automática**: INCOTERM, despesas complementares
- **Validação em Tempo Real**: Verificação de configurações
- **Informações Contextuais**: Tooltips e explicações
- **Status Dinâmico**: Feedback do processamento
- **Módulo Precificação**: Janela separada para cálculo de preços

### 8.3 Canvas com Scroll

```python
# Interface responsiva com scroll vertical
canvas = tk.Canvas(self)
scrollbar = ttk.Scrollbar(self, orient="vertical", command=canvas.yview)
scrollable_frame = ttk.Frame(canvas)
```

## 9. Tratamento de Dados

### 9.1 Extração de XML

```python
def parse_numeric_field(value, divisor=100):
    # Converte campos numéricos com zeros à esquerda
    clean_value = value.lstrip('0') or '0'
    return float(clean_value) / divisor
```

### 9.2 Extração Automática de Despesas

```python
def extrair_despesas_informacao_complementar(texto):
    # Regex patterns para SISCOMEX e AFRMM
    # Suporte a múltiplos formatos de descrição
    # Tratamento de valores com vírgulas e pontos
```

### 9.3 Detecção de INCOTERM

Detecção automática do INCOTERM no XML com configuração automática:

- **CFR**: Frete embutido
- **CIF**: Frete e seguro embutidos
- **FOB/EXW**: Frete e seguro separados

## 10. Validações e Controles de Qualidade

### 10.1 Validação de Custos

- Soma dos custos calculados vs. valor esperado
- Tolerância de 0,01% para divergências
- Identificação de problemas de configuração

### 10.2 Logs de Sistema

```python
log.info("=== INICIANDO CÁLCULO DE CUSTOS EXPANDIDO ===")
log.info("✅ Incentivo aplicado: COMEXPRODUZIR")
log.info("💰 ICMS com incentivo: R$ 15.000,00")
```

### 10.3 Tratamento de Erros

- Try/catch abrangente
- Mensagens de erro informativas
- Fallback para valores padrão
- Logs detalhados para debugging

## 11. Requisitos Técnicos

### 11.1 Dependências Python

```python
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import xml.etree.ElementTree as ET
import pandas as pd
from pathlib import Path
import logging
import re
```

### 11.2 Dependências Externas

- **xlsxwriter**: Geração avançada de Excel
- **pandas**: Manipulação de dados
- **tkinter**: Interface gráfica

### 11.3 Estrutura de Arquivos

```
projeto/
├── importador-xml-di-nf-entrada-perplexity-aprimorado-venda.py
├── exemplos/
│   ├── DI_exemplo.xml
│   └── ExtratoDI_COMPLETO_exemplo.xlsx
└── documentacao/
    └── manual_usuario.pdf
```

## 12. Possíveis Melhorias Futuras

### 12.1 Funcionalidades Técnicas

- **API Integration**: Consulta automática de câmbio
- **Base de Dados**: Armazenamento histórico
- **Multi-threading**: Processamento paralelo
- **Cloud Integration**: Salvamento em nuvem

### 12.2 Interface de Usuário

- **Drag \& Drop**: Upload de arquivos simplificado
- **Preview**: Visualização antes do processamento
- **Templates**: Configurações salvas
- **Relatórios**: Dashboard executivo

### 12.3 Integrações

- **ERP**: Conexão com sistemas empresariais
- **Contabilidade**: Export para sistemas contábeis
- **BI**: Dashboards de análise
- **API Externa**: Consulta de NCMs e alíquotas

## 13. Conclusão

O sistema desenvolvido oferece uma solução completa e robusta para análise de Declarações de Importação, com funcionalidades avançadas de:

- ✅ **Precisão nos Cálculos**: Rateio proporcional de todos os custos
- ✅ **Incentivos Fiscais**: Suporte aos principais programas estaduais
- ✅ **Flexibilidade**: Configurações especiais para casos complexos
- ✅ **Automação**: Detecção automática de despesas e configurações
- ✅ **Validação**: Controle de qualidade dos cálculos
- ✅ **Precificação**: Módulo integrado para formação de preços
- ✅ **Relatórios**: Excel formatado com análise detalhada
- ✅ **Usabilidade**: Interface intuitiva e responsiva

O sistema atende às necessidades de importadores, consultores tributários e analistas de custos, oferecendo precisão, confiabilidade e eficiência no processamento de operações de importação.

<div style="text-align: center">⁂</div>

[^1]: importador-xml-di-nf-entrada-perplexity-aprimorado-venda.py
