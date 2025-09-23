<<<<<<< HEAD
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import xml.etree.ElementTree as ET
import pandas as pd
from pathlib import Path
import logging
import re

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")
log = logging.getLogger("ExtratoDI")

# Dados das alíquotas de ICMS por estado (2025)
ALIQ_ICMS_ESTADOS = {
    "GO": {"nome": "Goiás", "aliquota": 0.19, "codigo": "GO"},
    "SC": {"nome": "Santa Catarina", "aliquota": 0.17, "codigo": "SC"},
    "ES": {"nome": "Espírito Santo", "aliquota": 0.17, "codigo": "ES"},
    "MG": {"nome": "Minas Gerais", "aliquota": 0.18, "codigo": "MG"},
    "SP": {"nome": "São Paulo", "aliquota": 0.18, "codigo": "SP"},
    "RJ": {"nome": "Rio de Janeiro", "aliquota": 0.18, "codigo": "RJ"},
    "RS": {"nome": "Rio Grande do Sul", "aliquota": 0.18, "codigo": "RS"},
    "PR": {"nome": "Paraná", "aliquota": 0.19, "codigo": "PR"},
    "BA": {"nome": "Bahia", "aliquota": 0.205, "codigo": "BA"},  # 18% + 2,5% FECP
    "PE": {"nome": "Pernambuco", "aliquota": 0.18, "codigo": "PE"},
}

# Dados dos incentivos fiscais por estado
INCENTIVOS_FISCAIS = {
    "GO": {
        "nome": "COMEXPRODUZIR",
        "descricao": "Crédito outorgado de 65% sobre o saldo devedor do ICMS nas operações interestaduais",
        "tipo": "credito_outorgado",
        "ativo": True,
        "condicoes": [
            "Desembaraço obrigatório no Porto Seco de Anápolis",
            "Trânsito físico obrigatório pelo estado de Goiás",
            "Perfil empresarial com 95% do faturamento em comércio exterior"
        ],
        "parametros": {
            "aliquota_interestadual": 0.04,
            "credito_outorgado_pct": 0.65,
            "aliquota_interna_reduzida": 0.04,
            "contrapartidas": {
                "FUNPRODUZIR": 0.05,  # 5% sobre o benefício
                "PROTEGE": 0.15       # 15% sobre o benefício
            }
        },
        "carga_efetiva_interestadual": 0.0192,  # 1,92%
        "carga_efetiva_interna": 0.04           # 4%
    },
    "SC": {
        "nome": "TTD 409",
        "descricao": "Tratamento Tributário Diferenciado com alíquotas efetivas reduzidas",
        "tipo": "aliquota_efetiva",
        "ativo": True,
        "condicoes": [
            "Desembaraço obrigatório em território catarinense",
            "Cumprimento de metas progressivas de faturamento",
            "Transição progressiva entre níveis de TTD"
        ],
        "parametros": {
            "aliquota_importacao_fase1": 0.026,  # 2,6% primeiros 36 meses
            "aliquota_importacao_fase2": 0.01,   # 1,0% após 36 meses
            "aliquota_interestadual_fase1": 0.026,
            "aliquota_interestadual_fase2": 0.01,
            "contrapartidas": {
                "Fundo_Educacao": 0.004  # 0,4% sobre operações
            }
        },
        "carga_efetiva_interestadual": 0.014,   # 1,4%
        "carga_efetiva_interna": 0.014
    },
    "ES": {
        "nome": "INVEST-ES Importação",
        "descricao": "Diferimento total do ICMS na importação + redução de 75% nas saídas para CD",
        "tipo": "diferimento_reducao",
        "ativo": True,
        "condicoes": [
            "Desembaraço obrigatório nos portos ou aeroportos do ES",
            "Implantação de Centro de Distribuição com área mínima de 1.000 m²",
            "Garantia financeira de 10% do benefício"
        ],
        "parametros": {
            "diferimento_importacao": True,
            "reducao_saida_pct": 0.75,
            "contrapartidas": {
                "Taxa_Administrativa": 0.005  # 0,5% sobre ICMS diferido
            }
        },
        "carga_efetiva_interestadual": 0.0434,  # 4,34%
        "carga_efetiva_interna": 0.0434
    },
    "MG": {
        "nome": "Corredor de Importação MG",
        "descricao": "Diferimento na importação + crédito presumido nas saídas",
        "tipo": "credito_presumido",
        "ativo": True,
        "condicoes": [
            "Desembaraço obrigatório em território mineiro",
            "Exclusão de produtos da lista negativa",
            "Cumprimento de obrigações acessórias específicas"
        ],
        "parametros": {
            "diferimento_importacao": True,
            "credito_presumido": {
                "com_similar": {"interestadual": 0.03, "interno": 0.06},      # 3% e 6%
                "sem_similar": {"interestadual": 0.025, "interno": 0.05}      # 2,5% e 5%
            }
        },
        "carga_efetiva_interestadual": 0.01,    # 1% (com similar)
        "carga_efetiva_interna": 0.12
    }
}

# Mapeamento de códigos de moeda da Receita Federal
CODIGOS_MOEDA_RFB = {
    "220": {"sigla": "USD", "nome": "Dólar dos Estados Unidos"},
    "860": {"sigla": "INR", "nome": "Rúpia Indiana"},
    "978": {"sigla": "EUR", "nome": "Euro"},
    "470": {"sigla": "GBP", "nome": "Libra Esterlina"},
    "156": {"sigla": "CNY", "nome": "Yuan Chinês"},
    "392": {"sigla": "JPY", "nome": "Iene Japonês"},
    "124": {"sigla": "CAD", "nome": "Dólar Canadense"},
    "036": {"sigla": "AUD", "nome": "Dólar Australiano"},
    "756": {"sigla": "CHF", "nome": "Franco Suíço"},
    "554": {"sigla": "NZD", "nome": "Dólar Neozelandês"},
    "710": {"sigla": "ZAR", "nome": "Rand Sul-Africano"},
    "484": {"sigla": "MXN", "nome": "Peso Mexicano"},
    "032": {"sigla": "ARS", "nome": "Peso Argentino"},
    "152": {"sigla": "CLP", "nome": "Peso Chileno"},
    "170": {"sigla": "COP", "nome": "Peso Colombiano"},
    "604": {"sigla": "PEN", "nome": "Sol Peruano"},
    "858": {"sigla": "UYU", "nome": "Peso Uruguaio"},
    "000": {"sigla": "N/A", "nome": "Não especificada"}  # Código 000 usado quando não há moeda
}

# EXPANSÃO DAS ESTRUTURAS EXISTENTES
CONFIGURACOES_ESPECIAIS = {
    "reducao_base_entrada": {
        "ativo": False,
        "percentual": 100.0,  # 100% = sem redução, 70% = redução para 70%
        "aplicacao": "DI",    # "DI", "adicao", "item"
        "adicoes_especificas": [],
        "itens_especificos": []
    },
    "reducao_base_saida": {
        "ativo": False,
        "percentual": 100.0,
        "aplicacao": "DI",
        "adicoes_especificas": [],
        "itens_especificos": []
    },
    "dolar_diferenciado": {
        "ativo": False,
        "taxa_contratada": 0.0,
        "taxa_di": 0.0,
        "aplicacao": "DI",
        "adicoes_especificas": {},  # {num_adicao: taxa_especifica}
        "itens_especificos": {}     # {seq_item: taxa_especifica}
    },
    "substituicao_tributaria": {
        "st_entrada": {
            "ativo": False,
            "aliquota_st": 0.0,
            "base_calculo_st": "valor_aduaneiro",  # ou "valor_operacao"
            "aplicacao": "DI",
            "adicoes_especificas": [],
            "itens_especificos": []
        },
        "st_saida": {
            "ativo": False,
            "aliquota_st": 0.0,
            "mva": 0.0,  # Margem de Valor Agregado
            "aplicacao": "DI",
            "adicoes_especificas": [],
            "itens_especificos": []
        }
    }
}

# Adicionar após o fechamento do dicionário CONFIGURACOES_ESPECIAIS (linha ~150)
CONFIGURACOES_ESPECIAIS_DEFAULT = {
    "reducao_base_entrada": {
        "ativo": False,
        "percentual": 100.0,
        "aplicacao": "DI",
        "adicoes_especificas": [],
        "itens_especificos": []
    },
    "reducao_base_saida": {
        "ativo": False,
        "percentual": 100.0,
        "aplicacao": "DI",
        "adicoes_especificas": [],
        "itens_especificos": []
    },
    "dolar_diferenciado": {
        "ativo": False,
        "taxa_contratada": 0.0,
        "taxa_di": 0.0,
        "aplicacao": "DI",
        "adicoes_especificas": {},
        "itens_especificos": {}
    },
    "substituicao_tributaria": {
        "st_entrada": {
            "ativo": False,
            "aliquota_st": 0.0,
            "base_calculo_st": "valor_aduaneiro",
            "aplicacao": "DI",
            "adicoes_especificas": [],
            "itens_especificos": []
        },
        "st_saida": {
            "ativo": False,
            "aliquota_st": 0.0,
            "mva": 0.0,
            "aplicacao": "DI",
            "adicoes_especificas": [],
            "itens_especificos": []
        }
    }
}

def parse_numeric_field(value, divisor=100):
    """Converte campos numéricos do XML que vêm com zeros à esquerda"""
    if not value:
        return 0.0
    try:
        clean_value = value.lstrip('0') or '0'
        return float(clean_value) / divisor
    except:
        return 0.0

    
def extrair_codigo_produto(descricao):
    """Extrai o código do produto da descrição"""
    if not descricao:
        return "N/A"
    parts = descricao.split(" - ")
    if len(parts) >= 2:
        return parts[0].strip()
    return "N/A"


def extrair_unidades_por_caixa(descricao):
    """Extrai quantidade de unidades por caixa da descrição"""
    if not descricao or "EM CX COM" not in descricao:
        return "N/A"
    try:
        parte = descricao.split("EM CX COM")[1].split("UNIDADES")[0].strip()
        return int(parte)
    except:
        return "N/A"

    
def extrair_despesas_informacao_complementar(texto):
    """Extrai despesas das informações complementares"""
    despesas = {
        "SISCOMEX R$": 0.0,
        "AFRMM R$": 0.0
    }
    
    if not texto:
        return despesas
    
    # SISCOMEX - padrão mais amplo
    siscomex_patterns = [
        r"SISCOMEX[^\d]*R\$?\s*([\d\.,]+)",
        r"TAXA DE UTILIZACAO DO SISCOMEX[^\d]*R\$?\s*([\d\.,]+)",
        r"UTILIZACAO DO SISCOMEX[^\d]*R\$?\s*([\d\.,]+)"
    ]
    
    for pattern in siscomex_patterns:
        match = re.search(pattern, texto, re.IGNORECASE)
        if match:
            try:
                valor = match.group(1).replace('.', '').replace(',', '.')
                despesas["SISCOMEX R$"] = float(valor)
                break
            except:
                continue
    
    # AFRMM - padrão mais amplo
    afrmm_patterns = [
        r"AFRMM[^\d]*R?\$?\s*([\d\.,]+)",
        r"A\.F\.R\.M\.M[^\d]*R?\$?\s*([\d\.,]+)"
    ]
    
    for pattern in afrmm_patterns:
        match = re.search(pattern, texto, re.IGNORECASE)
        if match:
            try:
                valor = match.group(1).replace('.', '').replace(',', '.')
                despesas["AFRMM R$"] = float(valor)
                break
            except:
                continue
    
    return despesas



def calcular_icms_importacao_avancado(valor_aduaneiro, ii, ipi, pis, cofins, outras_despesas,
                                      aliquota_icms=0.19, configuracoes_especiais=None):
    """
    Calcula ICMS considerando configurações especiais:
    - Redução de base de cálculo
    - Substituição tributária
    """
    config = configuracoes_especiais or {}

    # Base de cálculo padrão
    base_sem_icms = valor_aduaneiro + ii + ipi + pis + cofins + outras_despesas

    # 1. REDUÇÃO DE BASE DE CÁLCULO NA ENTRADA
    reducao_entrada = config.get("reducao_base_entrada", {})
    if reducao_entrada.get("ativo", False):
        percentual_base = reducao_entrada.get("percentual", 100.0) / 100
        base_sem_icms = base_sem_icms * percentual_base

    # 2. SUBSTITUIÇÃO TRIBUTÁRIA NA ENTRADA
    st_entrada = config.get("substituicao_tributaria", {}).get("st_entrada", {})
    if st_entrada.get("ativo", False):
        aliquota_st = st_entrada.get("aliquota_st", 0.0)

        # Cálculo do ICMS normal
        base_com_icms = base_sem_icms / (1 - aliquota_icms)
        icms_normal = base_com_icms - base_sem_icms

        # Cálculo do ICMS-ST
        # Base para ST = base normal + margem (se houver)
        base_st = base_com_icms
        icms_st = base_st * aliquota_st - icms_normal

        return {
            "icms_normal": icms_normal,
            "icms_st": max(0, icms_st),  # ST não pode ser negativo
            "icms_total": icms_normal + max(0, icms_st),
            "base_calculo": base_com_icms,
            "base_calculo_st": base_st,
            "substituicao_tributaria": True
        }

    # 3. CÁLCULO NORMAL (sem ST)
    base_com_icms = base_sem_icms / (1 - aliquota_icms)
    icms = base_com_icms - base_sem_icms

    return {
        "icms_normal": icms,
        "icms_st": 0.0,
        "icms_total": icms,
        "base_calculo": base_com_icms,
        "base_calculo_st": 0.0,
        "substituicao_tributaria": False
    }

    
def aplicar_dolar_diferenciado(valor_usd, dados_adicao, config_dolar):
    """Aplica taxa de câmbio diferenciada conforme configuração"""
    if not config_dolar.get("ativo", False):
        return valor_usd * config_dolar.get("taxa_di", 5.0)  # taxa padrão da DI

    aplicacao = config_dolar.get("aplicacao", "DI")
    num_adicao = dados_adicao.get("numero", "")

    if aplicacao == "adicao" and num_adicao in config_dolar.get("adicoes_especificas", {}):
        taxa_especifica = config_dolar["adicoes_especificas"][num_adicao]
        return valor_usd * taxa_especifica

    # Taxa contratada (diferente da DI)
    taxa_contratada = config_dolar.get("taxa_contratada", config_dolar.get("taxa_di", 5.0))
    return valor_usd * taxa_contratada


def verificar_aplicacao_configuracao(config, nivel, identificador=""):
    """
    Verifica se uma configuração especial se aplica ao nível especificado

    Args:
        config: configuração específica
        nivel: "DI", "adicao", "item"
        identificador: número da adição ou sequência do item

    Returns:
        bool: True se a configuração se aplica
    """
    if not config.get("ativo", False):
        return False

    aplicacao = config.get("aplicacao", "DI")

    if aplicacao == "DI":
        return True
    elif aplicacao == "adicao" and nivel == "adicao":
        adicoes_especificas = config.get("adicoes_especificas", [])
        return not adicoes_especificas or identificador in adicoes_especificas
    elif aplicacao == "item" and nivel == "item":
        itens_especificos = config.get("itens_especificos", [])
        return not itens_especificos or identificador in itens_especificos

    return False


def obter_estados_disponiveis():
    """Retorna lista de estados disponíveis"""
    return [(codigo, dados["nome"]) for codigo, dados in ALIQ_ICMS_ESTADOS.items()]


def obter_aliquota_icms_estado(estado_codigo):
    """Obtém alíquota de ICMS do estado"""
    estado_data = ALIQ_ICMS_ESTADOS.get(estado_codigo.upper())
    return estado_data["aliquota"] if estado_data else 0.19  # Default 19%


def obter_incentivos_por_estado(estado_codigo):
    """Obtém incentivos fiscais disponíveis para o estado"""
    return INCENTIVOS_FISCAIS.get(estado_codigo.upper(), None)


def calcular_icms_com_incentivo(valor_base, estado_codigo, tipo_operacao="interestadual", tem_similar_nacional=True):
    """
    Calcula ICMS considerando incentivos fiscais específicos do estado

    Args:
        valor_base: Valor base para cálculo
        estado_codigo: Código do estado (GO, SC, ES, MG)
        tipo_operacao: "interestadual" ou "interno"
        tem_similar_nacional: True se produto tem similar nacional

    Returns:
        dict com detalhes do cálculo
    """
    incentivo = obter_incentivos_por_estado(estado_codigo)
    aliquota_normal = obter_aliquota_icms_estado(estado_codigo)

    if not incentivo or not incentivo["ativo"]:
        # Sem incentivo - cálculo normal
        if tipo_operacao == "interestadual":
            aliquota_final = 0.04 if tem_similar_nacional else 0.12
        else:
            aliquota_final = aliquota_normal

        icms_devido = valor_base * aliquota_final
        return {
            "icms_nominal": icms_devido,
            "icms_devido": icms_devido,
            "beneficio": 0,
            "contrapartidas": 0,
            "carga_efetiva": aliquota_final,
            "incentivo_aplicado": "Nenhum"
        }

    # Com incentivo fiscal
    if estado_codigo == "GO":  # COMEXPRODUZIR
        return _calcular_icms_goias(valor_base, incentivo, tipo_operacao)

    elif estado_codigo == "SC":  # TTD 409
        return _calcular_icms_santa_catarina(valor_base, incentivo, tipo_operacao)

    elif estado_codigo == "ES":  # INVEST-ES
        return _calcular_icms_espirito_santo(valor_base, incentivo, tipo_operacao)

    elif estado_codigo == "MG":  # Corredor de Importação
        return _calcular_icms_minas_gerais(valor_base, incentivo, tipo_operacao, tem_similar_nacional)

    else:
        # Fallback para cálculo normal
        return calcular_icms_com_incentivo(valor_base, estado_codigo, tipo_operacao, tem_similar_nacional)

    
def _calcular_icms_goias(valor_base, incentivo, tipo_operacao):
    """Cálculo específico para COMEXPRODUZIR - Goiás"""
    params = incentivo["parametros"]

    if tipo_operacao == "interestadual":
        # Operação interestadual com crédito outorgado
        aliquota = params["aliquota_interestadual"]  # 4%
        icms_nominal = valor_base * aliquota
        credito_outorgado = icms_nominal * params["credito_outorgado_pct"]  # 65%

        # Contrapartidas sobre o benefício
        contrib_funproduzir = credito_outorgado * params["contrapartidas"]["FUNPRODUZIR"]
        contrib_protege = credito_outorgado * params["contrapartidas"]["PROTEGE"]
        contrapartidas_total = contrib_funproduzir + contrib_protege

        icms_devido = icms_nominal - credito_outorgado + contrapartidas_total

        return {
            "icms_nominal": icms_nominal,
            "icms_devido": icms_devido,
            "beneficio": credito_outorgado,
            "contrapartidas": contrapartidas_total,
            "detalhes_contrapartidas": {
                "FUNPRODUZIR": contrib_funproduzir,
                "PROTEGE": contrib_protege
            },
            "carga_efetiva": icms_devido / valor_base,
            "incentivo_aplicado": "COMEXPRODUZIR - Crédito Outorgado 65%"
        }

    else:  # Operação interna
        # Alíquota reduzida para 4%
        aliquota_reduzida = params["aliquota_interna_reduzida"]
        icms_devido = valor_base * aliquota_reduzida
        icms_nominal = valor_base * 0.19  # Alíquota normal de Goiás

        return {
            "icms_nominal": icms_nominal,
            "icms_devido": icms_devido,
            "beneficio": icms_nominal - icms_devido,
            "contrapartidas": 0,
            "carga_efetiva": aliquota_reduzida,
            "incentivo_aplicado": "COMEXPRODUZIR - Alíquota Reduzida 4%"
        }

        
def _calcular_icms_santa_catarina(valor_base, incentivo, tipo_operacao):
    """Cálculo específico para TTD 409 - Santa Catarina"""
    params = incentivo["parametros"]

    # Para simplificação, usar Fase 2 (após 36 meses) - 1,0%
    aliquota_efetiva = params["aliquota_interestadual_fase2"]  # 1,0%
    icms_devido = valor_base * aliquota_efetiva

    # Contribuição ao Fundo de Educação
    contrib_fundo = valor_base * params["contrapartidas"]["Fundo_Educacao"]

    icms_total = icms_devido + contrib_fundo
    icms_nominal = valor_base * 0.17  # Alíquota normal SC

    return {
        "icms_nominal": icms_nominal,
        "icms_devido": icms_total,
        "beneficio": icms_nominal - icms_devido,
        "contrapartidas": contrib_fundo,
        "detalhes_contrapartidas": {
            "Fundo_Educacao": contrib_fundo
        },
        "carga_efetiva": icms_total / valor_base,
        "incentivo_aplicado": "TTD 409 - Fase 2 (1,0%)"
    }

    
def _calcular_icms_espirito_santo(valor_base, incentivo, tipo_operacao):
    """Cálculo específico para INVEST-ES - Espírito Santo"""
    params = incentivo["parametros"]

    # ICMS diferido na importação, recolhido na saída com redução de 75%
    icms_nominal = valor_base * 0.17  # Alíquota normal ES
    reducao = icms_nominal * params["reducao_saida_pct"]  # 75% de redução
    taxa_admin = icms_nominal * params["contrapartidas"]["Taxa_Administrativa"]  # 0,5%

    icms_devido = icms_nominal - reducao + taxa_admin

    return {
        "icms_nominal": icms_nominal,
        "icms_devido": icms_devido,
        "beneficio": reducao,
        "contrapartidas": taxa_admin,
        "detalhes_contrapartidas": {
            "Taxa_Administrativa": taxa_admin
        },
        "carga_efetiva": icms_devido / valor_base,
        "incentivo_aplicado": "INVEST-ES - Redução 75%"
    }

    
def _calcular_icms_minas_gerais(valor_base, incentivo, tipo_operacao, tem_similar_nacional):
    """Cálculo específico para Corredor de Importação - Minas Gerais"""
    params = incentivo["parametros"]
    creditos = params["credito_presumido"]

    if tipo_operacao == "interestadual":
        if tem_similar_nacional:
            aliquota_operacao = 0.04  # 4% interestadual com similar
            credito_pct = creditos["com_similar"]["interestadual"]  # 3%
        else:
            aliquota_operacao = 0.12  # 12% interestadual sem similar
            credito_pct = creditos["sem_similar"]["interestadual"]  # 2,5%

        icms_nominal = valor_base * aliquota_operacao
        credito_presumido = valor_base * credito_pct
        icms_devido = icms_nominal - credito_presumido

        return {
            "icms_nominal": icms_nominal,
            "icms_devido": icms_devido,
            "beneficio": credito_presumido,
            "contrapartidas": 0,
            "carga_efetiva": icms_devido / valor_base,
            "incentivo_aplicado": f"Corredor MG - Crédito {credito_pct*100}%"
        }

    else:  # Operação interna
        # Para operações internas, o benefício é menor
        aliquota_operacao = 0.18  # Alíquota normal MG
        if tem_similar_nacional:
            credito_pct = creditos["com_similar"]["interno"]  # 6%
        else:
            credito_pct = creditos["sem_similar"]["interno"]   # 5%

        icms_nominal = valor_base * aliquota_operacao
        credito_presumido = valor_base * credito_pct
        icms_devido = icms_nominal - credito_presumido

        return {
            "icms_nominal": icms_nominal,
            "icms_devido": icms_devido,
            "beneficio": credito_presumido,
            "contrapartidas": 0,
            "carga_efetiva": icms_devido / valor_base,
            "incentivo_aplicado": f"Corredor MG - Crédito Interno {credito_pct*100}%"
        }

        
def calcular_creditos_tributarios(custo_item_data, regime_tributario="real"):
    """
    Calcula os créditos tributários disponíveis para cada item
    
    Args:
        custo_item_data: dict com dados de custos do item
        regime_tributario: "real" ou "presumido"
    
    Returns:
        dict com créditos disponíveis e custo ajustado
    """
    creditos = {
        "ICMS Crédito": 0.0,
        "IPI Crédito": 0.0,
        "PIS Crédito": 0.0,
        "COFINS Crédito": 0.0,
        "Total Créditos": 0.0
    }
    
    # ICMS da importação sempre gera crédito
    creditos["ICMS Crédito"] = custo_item_data.get("ICMS Incorporado R$", 0)
    
    # IPI da importação gera crédito para empresas industriais
    creditos["IPI Crédito"] = custo_item_data.get("IPI R$", 0)
    
    # PIS/COFINS: só gera crédito no regime real
    if regime_tributario == "real":
        creditos["PIS Crédito"] = custo_item_data.get("PIS R$", 0)
        creditos["COFINS Crédito"] = custo_item_data.get("COFINS R$", 0)
    
    creditos["Total Créditos"] = sum([
        creditos["ICMS Crédito"],
        creditos["IPI Crédito"], 
        creditos["PIS Crédito"],
        creditos["COFINS Crédito"]
    ])
    
    # Custo líquido = custo total - créditos disponíveis
    custo_bruto = custo_item_data.get("Custo Total Item R$", 0)
    custo_liquido = custo_bruto - creditos["Total Créditos"]
    
    return creditos, custo_liquido


def calcular_preco_venda(custo_liquido, margem_desejada, aliq_icms=0.19, aliq_ipi_entrada=0.0, 
                        aliq_pis=0.0165, aliq_cofins=0.076, regime="real"):
    """
    Calcula preço de venda considerando impostos por dentro e por fora
    
    Args:
        custo_liquido: custo após deduzir créditos
        margem_desejada: margem desejada (ex: 0.30 para 30%)
        aliq_icms, aliq_pis, aliq_cofins: alíquotas dos impostos por dentro
        aliq_ipi_entrada: alíquota do IPI da entrada (será a mesma da venda)
        regime: "real" ou "presumido"
    
    Returns:
        dict com breakdown completo do preço
    """
    
    # Ajustar alíquotas conforme regime
    if regime == "presumido":
        # No presumido, PIS/COFINS têm alíquotas menores
        aliq_pis = 0.0065  # 0,65%
        aliq_cofins = 0.03  # 3%
    
    # O IPI da venda é o mesmo da entrada
    aliq_ipi = aliq_ipi_entrada
    
    # Impostos "por dentro" (não incluem IPI)
    impostos_por_dentro = aliq_icms + aliq_pis + aliq_cofins
    
    # Preço base (antes do IPI)
    # Fórmula: P = (Custo + Margem) / (1 - Impostos%)
    valor_desejado = custo_liquido * (1 + margem_desejada)
    preco_base = valor_desejado / (1 - impostos_por_dentro)
    
    # Calcular valores dos impostos por dentro
    icms_venda = preco_base * aliq_icms
    pis_venda = preco_base * aliq_pis
    cofins_venda = preco_base * aliq_cofins
    
    # IPI é "por fora" - calculado sobre o preço base
    ipi_venda = preco_base * aliq_ipi
    preco_final = preco_base + ipi_venda
    
    # Verificação: margem real obtida
    impostos_totais = icms_venda + pis_venda + cofins_venda + ipi_venda
    margem_real = (preco_final - custo_liquido - impostos_totais) / custo_liquido
    
    return {
        "Custo Líquido R$": custo_liquido,
        "Margem Desejada (%)": margem_desejada * 100,
        "Preço Base R$": preco_base,
        "ICMS Venda R$": icms_venda,
        "PIS Venda R$": pis_venda,
        "COFINS Venda R$": cofins_venda,
        "IPI Venda R$": ipi_venda,
        "IPI Alíq. Venda (%)": aliq_ipi * 100,
        "Total Impostos Venda R$": impostos_totais,
        "Preço Final R$": preco_final,
        "Margem Real (%)": margem_real * 100,
        "Regime Tributário": regime.title()
    }


def extrair_taxa_cambio_di(xml_path):
    """Extrai a taxa de câmbio da DI do XML"""
    try:
        tree = ET.parse(xml_path)
        root = tree.getroot()
        di = root.find("declaracaoImportacao")

        if di is not None:
            # Tentar extrair da primeira adição
            primeira_adicao = di.find("adicao")
            if primeira_adicao is not None:
                vcmv_usd = parse_numeric_field(primeira_adicao.findtext("condicaoVendaValorMoeda", "0"))
                vcmv_brl = parse_numeric_field(primeira_adicao.findtext("condicaoVendaValorReais", "0"))

                if vcmv_usd > 0 and vcmv_brl > 0:
                    return vcmv_brl / vcmv_usd

        # Taxa padrão se não conseguir extrair
        return 5.0

    except Exception:
        return 5.0


def calcular_custos_unitarios(dados, frete_embutido=False, seguro_embutido=False,
                              afrmm_manual="", siscomex_manual="", aliquota_icms_manual="19",
                              # NOVOS PARÂMETROS PARA RESOLVER O ERRO
                              estado_destino=None, aplicar_incentivo=False,
                              tipo_operacao="interestadual", tem_similar_nacional=True,
                              configuracoes_especiais=None, xml_path=None):
    """
    VERSÃO COMPLETA E CORRIGIDA - Calcula custos unitários com incentivos fiscais

    PARÂMETROS BÁSICOS (existiam antes):
    - dados: dados da DI processados
    - frete_embutido, seguro_embutido: configurações de custos
    - afrmm_manual, siscomex_manual: valores manuais de despesas
    - aliquota_icms_manual: alíquota de ICMS para cálculo

    NOVOS PARÂMETROS (que estavam faltando):
    - estado_destino: código do estado de destino para incentivos
    - aplicar_incentivo: se deve aplicar incentivos fiscais
    - tipo_operacao: "interestadual" ou "interna"
    - tem_similar_nacional: se produto tem similar nacional
    - configuracoes_especiais: configurações avançadas
    - xml_path: caminho do XML para detecção automática
    """

    # Aplicar configurações padrão se não fornecidas
    config_especiais = configuracoes_especiais or CONFIGURACOES_ESPECIAIS_DEFAULT.copy()

    log.info("=== INICIANDO CÁLCULO DE CUSTOS EXPANDIDO E COMPATÍVEL ===")

    # DETECTAR TAXA DE CÂMBIO DA DI SE CONFIGURADO DÓLAR DIFERENCIADO
    if config_especiais.get("dolar_diferenciado", {}).get("ativo", False) and xml_path:
        taxa_di_detectada = extrair_taxa_cambio_di(xml_path)
        config_especiais["dolar_diferenciado"]["taxa_di"] = taxa_di_detectada

    # EXTRAIR TOTAIS DA DI
    valor_total_di = dados["valores"]["FOB R$"]
    frete_total = dados["valores"]["Frete R$"] if not frete_embutido else 0.0
    seguro_total = dados.get("valores", {}).get("Seguro R$", 0.0) if not seguro_embutido else 0.0

    # AFRMM - prioridade: XML > Info Complementar > Manual > 0
    afrmm_total = dados.get("valores", {}).get("AFRMM R$", 0.0)
    if afrmm_total == 0.0 and dados.get("despesas_complementares", {}).get("AFRMM R$", 0.0) > 0:
        afrmm_total = dados["despesas_complementares"]["AFRMM R$"]
    if afrmm_total == 0.0 and afrmm_manual:
        try:
            afrmm_total = float(afrmm_manual.replace(",", "."))
        except:
            afrmm_total = 0.0

    # SISCOMEX - prioridade: XML > Info Complementar > Manual > 0
    siscomex_total = dados.get("valores", {}).get("Siscomex R$", 0.0)
    if siscomex_total == 0.0 and dados.get("despesas_complementares", {}).get("SISCOMEX R$", 0.0) > 0:
        siscomex_total = dados["despesas_complementares"]["SISCOMEX R$"]
    if siscomex_total == 0.0 and siscomex_manual:
        try:
            siscomex_total = float(siscomex_manual.replace(",", "."))
        except:
            siscomex_total = 0.0

    # Alíquota ICMS
    try:
        aliquota_icms = float(aliquota_icms_manual.replace(",", ".")) / 100
    except:
        aliquota_icms = 0.19  # 19% padrão

    # APLICAR INCENTIVOS FISCAIS SE SOLICITADO
    valor_aduaneiro_total = dados["valores"]["Valor Aduaneiro R$"]
    ii_total = dados["tributos"]["II R$"]
    ipi_total = dados["tributos"]["IPI R$"]
    pis_total = dados["tributos"]["PIS R$"]
    cofins_total = dados["tributos"]["COFINS R$"]
    outras_despesas_total = afrmm_total + siscomex_total

    if aplicar_incentivo and estado_destino:
        log.info(
            f"Aplicando incentivos fiscais para {estado_destino} - {tipo_operacao} - Similar Nacional: {tem_similar_nacional}")

        # Calcular ICMS com incentivo fiscal
        resultado_incentivo = calcular_icms_com_incentivo(
            valor_aduaneiro_total, estado_destino, tipo_operacao, tem_similar_nacional
        )

        # Atualizar dados com resultado do incentivo
        dados["incentivo_fiscal"] = {
            "Estado": estado_destino,
            "Programa": resultado_incentivo["incentivo_aplicado"],
            "Tipo Operação": tipo_operacao,
            "Similar Nacional": "Sim" if tem_similar_nacional else "Não",
            "ICMS Nominal R$": resultado_incentivo["icms_nominal"],
            "ICMS Devido R$": resultado_incentivo["icms_devido"],
            "Benefício R$": resultado_incentivo["beneficio"],
            "Contrapartidas R$": resultado_incentivo["contrapartidas"],
            "Carga Efetiva (%)": resultado_incentivo["carga_efetiva"] * 100
        }

        # Usar ICMS com incentivo para o cálculo de custos
        icms_total = resultado_incentivo["icms_devido"]

        # Simular resultado_icms para compatibilidade
        resultado_icms = {
            "icms_normal": icms_total,
            "icms_st": 0.0,
            "icms_total": icms_total,
            "base_calculo": valor_aduaneiro_total + ii_total + ipi_total + pis_total + cofins_total + outras_despesas_total,
            "base_calculo_st": 0.0,
            "substituicao_tributaria": False
        }

        log.info(f"✅ Incentivo aplicado: {resultado_incentivo['incentivo_aplicado']}")
        log.info(f"💰 ICMS com incentivo: R$ {icms_total:,.2f} (era R$ {resultado_incentivo['icms_nominal']:,.2f})")
    else:
        # Usar função avançada de cálculo de ICMS sem incentivo
        resultado_icms = calcular_icms_importacao_avancado(
            valor_aduaneiro_total, ii_total, ipi_total, pis_total, cofins_total,
            outras_despesas_total, aliquota_icms, config_especiais
        )
        icms_total = resultado_icms["icms_total"]
        dados["incentivo_fiscal"] = None
        log.info("⭕ Sem incentivos fiscais aplicados")

    # Adicionar ICMS aos tributos
    dados["tributos"]["ICMS R$"] = resultado_icms["icms_normal"]
    dados["tributos"]["ICMS-ST R$"] = resultado_icms["icms_st"]
    dados["tributos"]["ICMS Total R$"] = icms_total
    dados["tributos"]["Base ICMS R$"] = resultado_icms["base_calculo"]

    if resultado_icms["substituicao_tributaria"]:
        dados["tributos"]["Base ICMS-ST R$"] = resultado_icms["base_calculo_st"]

    # CONFIGURAÇÃO DE BASE DE CÁLCULO
    if frete_embutido or seguro_embutido:
        valor_base_calculo = dados["valores"]["Valor Aduaneiro R$"]
    else:
        valor_base_calculo = valor_total_di

    # INFORMAÇÕES SOBRE CONFIGURAÇÃO DE CUSTOS
    dados["configuracao_custos"] = {
        "Frete Embutido": "Sim" if frete_embutido else "Não",
        "Seguro Embutido": "Sim" if seguro_embutido else "Não",
        "Base de Cálculo": "Valor Aduaneiro" if (frete_embutido or seguro_embutido) else "FOB",
        "Valor Base R$": valor_base_calculo,
        "Frete Considerado R$": frete_total,
        "Seguro Considerado R$": seguro_total,
        "AFRMM R$": afrmm_total,
        "Siscomex R$": siscomex_total,
        "ICMS Normal R$": resultado_icms["icms_normal"],
        "ICMS-ST R$": resultado_icms["icms_st"],
        "ICMS Total R$": icms_total,
        "Alíquota ICMS (%)": aliquota_icms * 100,
        "Substituição Tributária": "Sim" if resultado_icms["substituicao_tributaria"] else "Não",
        "Incentivo Fiscal": "Sim" if dados["incentivo_fiscal"] else "Não",
        "Configurações Especiais Ativas": [
            k for k, v in config_especiais.items()
            if isinstance(v, dict) and v.get("ativo", False)
        ]
    }

    # PROCESSAR CADA ADIÇÃO COM CONFIGURAÇÕES ESPECIAIS
    valor_total_ajustado = 0.0

    for adicao in dados["adicoes"]:
        valor_adicao_original = adicao["dados_gerais"]["VCMV R$"]

        # APLICAR DÓLAR DIFERENCIADO (se configurado)
        config_dolar = config_especiais.get("dolar_diferenciado", {})
        if verificar_aplicacao_configuracao(config_dolar, "adicao", adicao["numero"]):
            valor_usd = adicao["dados_gerais"]["VCMV USD"]
            valor_adicao_ajustado = aplicar_dolar_diferenciado(valor_usd, adicao, config_dolar)

            # Registrar ajuste
            adicao["dados_gerais"]["VCMV R$ (Original)"] = valor_adicao_original
            adicao["dados_gerais"]["VCMV R$ (Ajustado)"] = valor_adicao_ajustado
            adicao["dados_gerais"]["Taxa Câmbio DI"] = config_dolar.get("taxa_di", 5.0)
            adicao["dados_gerais"]["Taxa Câmbio Utilizada"] = valor_adicao_ajustado / valor_usd if valor_usd > 0 else 0
            adicao["dados_gerais"]["Diferença Cambial R$"] = valor_adicao_ajustado - valor_adicao_original
            valor_adicao = valor_adicao_ajustado
        else:
            valor_adicao = valor_adicao_original

        valor_total_ajustado += valor_adicao

        # Calcular percentual da adição sobre a base
        if valor_base_calculo > 0:
            base_para_percentual = valor_total_ajustado if valor_total_ajustado > 0 else valor_base_calculo
            percentual_adicao = valor_adicao / base_para_percentual
        else:
            percentual_adicao = 0

        # Ratear custos proporcionais
        custo_frete_adicao = percentual_adicao * frete_total
        custo_seguro_adicao = percentual_adicao * seguro_total
        custo_afrmm_adicao = percentual_adicao * afrmm_total
        custo_siscomex_adicao = percentual_adicao * siscomex_total

        # Impostos incorporáveis
        ii_adicao = adicao["tributos"]["II R$"]
        ipi_adicao = adicao["tributos"]["IPI R$"]
        pis_adicao = adicao["tributos"]["PIS R$"]
        cofins_adicao = adicao["tributos"]["COFINS R$"]
        icms_adicao = percentual_adicao * icms_total

        # Cálculo com ST se aplicável
        if resultado_icms["substituicao_tributaria"]:
            icms_st_adicao = percentual_adicao * resultado_icms["icms_st"]
            custo_total_adicao = (
                    valor_adicao + custo_frete_adicao + custo_seguro_adicao +
                    custo_afrmm_adicao + custo_siscomex_adicao + ii_adicao + icms_adicao + icms_st_adicao
            )
        else:
            icms_st_adicao = 0.0
            custo_total_adicao = (
                    valor_adicao + custo_frete_adicao + custo_seguro_adicao +
                    custo_afrmm_adicao + custo_siscomex_adicao + ii_adicao + icms_adicao
            )

        # Adicionar dados de custo à adição
        adicao["custos"] = {
            "Valor Mercadoria R$": valor_adicao,
            "Valor Original R$": valor_adicao_original,
            "Ajuste Cambial R$": valor_adicao - valor_adicao_original,
            "Frete Rateado R$": custo_frete_adicao,
            "Seguro Rateado R$": custo_seguro_adicao,
            "AFRMM Rateado R$": custo_afrmm_adicao,
            "Siscomex Rateado R$": custo_siscomex_adicao,
            "II Incorporado R$": ii_adicao,
            "IPI R$": ipi_adicao,
            "PIS R$": pis_adicao,
            "COFINS R$": cofins_adicao,
            "ICMS Incorporado R$": icms_adicao,
            "ICMS-ST Incorporado R$": icms_st_adicao,
            "Custo Total Adição R$": custo_total_adicao,
            "% Participação": percentual_adicao * 100,
            "Observações": f"Base: {'Valor Aduaneiro' if (frete_embutido or seguro_embutido) else 'FOB'}; ST: {'Sim' if resultado_icms['substituicao_tributaria'] else 'Não'}"
        }

        # Calcular custo unitário para cada item
        if adicao["itens"]:
            qtd_total_adicao = sum(item["Qtd"] for item in adicao["itens"])

            for item in adicao["itens"]:
                if qtd_total_adicao > 0:
                    proporcao_item = item["Qtd"] / qtd_total_adicao

                    # Distribuir todos os custos proporcionalmente por item
                    item["Custo Mercadoria R$"] = valor_adicao * proporcao_item
                    item["Ajuste Cambial R$"] = (valor_adicao - valor_adicao_original) * proporcao_item
                    item["Frete Rateado R$"] = custo_frete_adicao * proporcao_item
                    item["Seguro Rateado R$"] = custo_seguro_adicao * proporcao_item
                    item["AFRMM Rateado R$"] = custo_afrmm_adicao * proporcao_item
                    item["Siscomex Rateado R$"] = custo_siscomex_adicao * proporcao_item
                    item["II Incorporado R$"] = ii_adicao * proporcao_item
                    item["IPI R$"] = ipi_adicao * proporcao_item
                    item["PIS R$"] = pis_adicao * proporcao_item
                    item["COFINS R$"] = cofins_adicao * proporcao_item
                    item["ICMS Incorporado R$"] = icms_adicao * proporcao_item
                    item["ICMS-ST Incorporado R$"] = icms_st_adicao * proporcao_item

                    custo_total_item = custo_total_adicao * proporcao_item
                    item["Custo Total Item R$"] = custo_total_item

                    # CUSTO UNITÁRIO
                    if item["Qtd"] > 0:
                        custo_por_unidade = custo_total_item / item["Qtd"]
                        item["Custo Unitário R$"] = custo_por_unidade
                    else:
                        item["Custo Unitário R$"] = 0

                    # CUSTO POR PEÇA
                    unid_caixa = item.get("Unid/Caixa", "N/A")
                    if isinstance(unid_caixa, int) and unid_caixa > 0:
                        custo_por_peca = custo_total_item / (item["Qtd"] * unid_caixa)
                        item["Custo por Peça R$"] = custo_por_peca
                    else:
                        item["Custo por Peça R$"] = "N/A"

                    # Verificar configurações específicas por item
                    seq_item = item["Seq"]
                    item["Configurações Aplicadas"] = []
                    for config_nome in ["reducao_base_entrada", "reducao_base_saida"]:
                        config_item = config_especiais.get(config_nome, {})
                        if verificar_aplicacao_configuracao(config_item, "item", seq_item):
                            item["Configurações Aplicadas"].append(config_nome)

                    # Configurações ST
                    for st_tipo in ["st_entrada", "st_saida"]:
                        config_st = config_especiais.get("substituicao_tributaria", {}).get(st_tipo, {})
                        if verificar_aplicacao_configuracao(config_st, "item", seq_item):
                            item["Configurações Aplicadas"].append(f"ST_{st_tipo}")
                else:
                    # Zerar custos se não houver quantidade
                    campos_zero = [
                        "Custo Mercadoria R$", "Ajuste Cambial R$", "Frete Rateado R$", "Seguro Rateado R$",
                        "AFRMM Rateado R$", "Siscomex Rateado R$", "II Incorporado R$",
                        "IPI R$", "PIS R$", "COFINS R$", "ICMS Incorporado R$", "ICMS-ST Incorporado R$",
                        "Custo Total Item R$", "Custo Unitário R$"
                    ]
                    for campo in campos_zero:
                        item[campo] = 0
                    item["Custo por Peça R$"] = 0
                    item["Configurações Aplicadas"] = []

    # LOGS DE RESUMO
    log.info("=== RESUMO DAS CONFIGURAÇÕES APLICADAS ===")
    for config_nome, config_data in config_especiais.items():
        if isinstance(config_data, dict) and config_data.get("ativo", False):
            log.info(f"✅ {config_nome.upper()}: ATIVO")
        else:
            log.info(f"⭕ {config_nome}: Inativo")

    log.info("=== CÁLCULO DE CUSTOS COMPLETO FINALIZADO ===")

def validar_custos(dados, frete_embutido=False, seguro_embutido=False):
    """Valida se os custos calculados estão coerentes com os totais da DI"""
    
    # Somar custos de todas as adições
    custo_total_calculado = sum(
        adicao.get("custos", {}).get("Custo Total Adição R$", 0)
        for adicao in dados["adicoes"]
    )
    
    # Valor esperado baseado na configuração
    if frete_embutido or seguro_embutido:
        valor_esperado = dados["valores"]["Valor Aduaneiro R$"]
        if not frete_embutido:
            valor_esperado += dados["valores"]["Frete R$"]
        if not seguro_embutido:
            valor_esperado += dados.get("valores", {}).get("Seguro R$", 0)
    else:
        valor_esperado = (
            dados["valores"]["FOB R$"] +
            dados["valores"]["Frete R$"] +
            dados.get("valores", {}).get("Seguro R$", 0)
        )
    
    # Adicionar despesas extras e impostos (incluindo ICMS)
    valor_esperado += (
        dados.get("configuracao_custos", {}).get("AFRMM R$", 0) +
        dados.get("configuracao_custos", {}).get("Siscomex R$", 0) +
        dados["tributos"]["II R$"] +
        dados["tributos"].get("ICMS R$", 0)
    )
    
    diferenca = abs(custo_total_calculado - valor_esperado)
    percentual_diferenca = (diferenca / valor_esperado * 100) if valor_esperado > 0 else 0
    
    validacao = {
        "Custo Total Calculado": custo_total_calculado,
        "Valor Esperado": valor_esperado,
        "Diferença": diferenca,
        "% Diferença": percentual_diferenca,
        "Status": "OK" if percentual_diferenca < 0.01 else "DIVERGÊNCIA",
        "Configuração": f"Frete: {'Embutido' if frete_embutido else 'Separado'}, Seguro: {'Embutido' if seguro_embutido else 'Separado'}"
    }
    
    return validacao


def carrega_di_completo(xml_path: Path) -> dict:
    """Carrega o XML da DI com dados completos para cada adição"""
    tree = ET.parse(xml_path)
    root = tree.getroot()
    di = root.find("declaracaoImportacao")
    
    if di is None:
        raise ValueError("Elemento declaracaoImportacao não encontrado no XML")
    
    get = di.findtext
    
    # Processar informações complementares
    info_complementar_raw = get("informacaoComplementar", "").strip() or "—"
    despesas_complementares = extrair_despesas_informacao_complementar(info_complementar_raw)
    
    dados = {
        "cabecalho": {
            "DI": get("numeroDI") or "N/A",
            "Data registro": get("dataRegistro") or "N/A",
            "URF despacho": get("urfDespachoNome") or "N/A",
            "Modalidade": get("modalidadeDespachoNome") or "N/A",
            "Qtd. adições": int(get("totalAdicoes", "0")),
            "Situação": get("situacaoEntregaCarga") or "N/A",
        },
        "importador": {
            "CNPJ": get("importadorNumero") or "N/A",
            "Nome": get("importadorNome") or "N/A",
            "Representante": get("importadorNomeRepresentanteLegal") or "N/A",
            "CPF repr.": get("importadorCpfRepresentanteLegal") or "N/A",
            "Endereço": ", ".join(filter(None, [
                get("importadorEnderecoLogradouro", ""),
                get("importadorEnderecoNumero", ""),
                get("importadorEnderecoBairro", ""),
                get("importadorEnderecoMunicipio", ""),
                get("importadorEnderecoUf", ""),
                get("importadorEnderecoCep", "")
            ])) or "N/A",
        },
        "carga": {
            "Manifesto": f"{get('documentoChegadaCargaNome', 'N/A')} {get('documentoChegadaCargaNumero', '')}".strip(),
            "Recinto": get("armazenamentoRecintoAduaneiroNome") or "N/A",
            "Armazém": (get("armazem") or "").strip() or "N/A",
            "Peso bruto (kg)": parse_numeric_field(get("cargaPesoBruto", "0"), 1000),
            "Peso líquido (kg)": parse_numeric_field(get("cargaPesoLiquido", "0"), 1000),
        },
        "valores": {
            "FOB USD": parse_numeric_field(get("localEmbarqueTotalDolares", "0")),
            "FOB R$": parse_numeric_field(get("localEmbarqueTotalReais", "0")),
            "Frete USD": parse_numeric_field(get("freteTotalDolares", "0")),
            "Frete R$": parse_numeric_field(get("freteTotalReais", "0")),
            "Seguro R$": parse_numeric_field(get("seguroTotalReais", "0")),
            "AFRMM R$": parse_numeric_field(get("afrmm", "0")),
            "Siscomex R$": parse_numeric_field(get("taxaSiscomex", "0")),
            "Valor Aduaneiro R$": parse_numeric_field(get("localDescargaTotalReais", "0")),
        },
        "despesas_complementares": despesas_complementares,
        "adicoes": [],
        "info_complementar": info_complementar_raw
    }
    
    # Processar cada adição
    for adicao_elem in di.findall("adicao"):
        g = adicao_elem.findtext
        
        adicao = {
            "numero": g("numeroAdicao") or "N/A",
            "numero_li": g("numeroLI") or "N/A",
            "dados_gerais": {
                "NCM": g("dadosMercadoriaCodigoNcm") or "N/A",
                "NBM": g("dadosMercadoriaCodigoNcm") or "N/A",
                "Descrição NCM": g("dadosMercadoriaNomeNcm") or "N/A",
                "VCMV USD": parse_numeric_field(g("condicaoVendaValorMoeda", "0")),
                "VCMV R$": parse_numeric_field(g("condicaoVendaValorReais", "0")),
                "INCOTERM": g("condicaoVendaIncoterm") or "N/A",
                "Local": g("condicaoVendaLocal") or "N/A",
                "Moeda": g("condicaoVendaMoedaNome") or "N/A",
                "Peso líq. (kg)": parse_numeric_field(g("dadosMercadoriaPesoLiquido", "0"), 1000),
                "Quantidade": parse_numeric_field(g("dadosMercadoriaMedidaEstatisticaQuantidade", "0"), 1000),
                "Unidade": (g("dadosMercadoriaMedidaEstatisticaUnidade") or "").strip() or "N/A",
            },
            "partes": {
                "Exportador": g("fornecedorNome") or "N/A",
                "País Aquisição": g("paisAquisicaoMercadoriaNome") or "N/A",
                "Fabricante": g("fabricanteNome") or "N/A",
                "País Origem": g("paisOrigemMercadoriaNome") or "N/A",
            },
            "tributos": {
                "II Alíq. (%)": parse_numeric_field(g("iiAliquotaAdValorem", "0"), 10000),
                "II Regime": g("iiRegimeTributacaoNome") or "N/A",
                "II R$": parse_numeric_field(g("iiAliquotaValorRecolher", "0")),
                "IPI Alíq. (%)": parse_numeric_field(g("ipiAliquotaAdValorem", "0"), 10000),
                "IPI Regime": g("ipiRegimeTributacaoNome") or "N/A",
                "IPI R$": parse_numeric_field(g("ipiAliquotaValorRecolher", "0")),
                "PIS Alíq. (%)": parse_numeric_field(g("pisPasepAliquotaAdValorem", "0"), 10000),
                "PIS R$": parse_numeric_field(g("pisPasepAliquotaValorRecolher", "0")),
                "COFINS Alíq. (%)": parse_numeric_field(g("cofinsAliquotaAdValorem", "0"), 10000),
                "COFINS R$": parse_numeric_field(g("cofinsAliquotaValorRecolher", "0")),
                "Base PIS/COFINS R$": parse_numeric_field(g("pisCofinsBaseCalculoValor", "0")),
                "Regime PIS/COFINS": g("pisCofinsRegimeTributacaoNome") or "N/A",
            },
            "itens": []
        }
        
        # Processar mercadorias (itens) da adição
        for mercadoria in adicao_elem.findall("mercadoria"):
            descricao = (mercadoria.findtext("descricaoMercadoria") or "").strip()
            qtd = parse_numeric_field(mercadoria.findtext("quantidade", "0"), 100000)
            valor_unit = parse_numeric_field(mercadoria.findtext("valorUnitario", "0"), 10000000)
            
            item = {
                "Seq": mercadoria.findtext("numeroSequencialItem", "N/A"),
                "Código": extrair_codigo_produto(descricao),
                "Descrição": descricao or "N/A",
                "Qtd": qtd,
                "Unidade": (mercadoria.findtext("unidadeMedida") or "").strip() or "N/A",
                "Valor Unit. USD": valor_unit,
                "Unid/Caixa": extrair_unidades_por_caixa(descricao),
                "Valor Total USD": qtd * valor_unit
            }
            
            adicao["itens"].append(item)
        
        dados["adicoes"].append(adicao)
    
    # Calcular totais de tributos
    if dados["adicoes"]:
        tributos_totais = {"II R$": 0, "IPI R$": 0, "PIS R$": 0, "COFINS R$": 0}
        for adicao in dados["adicoes"]:
            tributos_totais["II R$"] += adicao["tributos"]["II R$"]
            tributos_totais["IPI R$"] += adicao["tributos"]["IPI R$"]
            tributos_totais["PIS R$"] += adicao["tributos"]["PIS R$"]
            tributos_totais["COFINS R$"] += adicao["tributos"]["COFINS R$"]
        dados["tributos"] = tributos_totais
    else:
        dados["tributos"] = {"II R$": 0, "IPI R$": 0, "PIS R$": 0, "COFINS R$": 0}
    
    return dados

# NOVA CLASSE: Interface de Precificação

class JanelaPrecificacao:
    def __init__(self, parent, dados_processados):
        self.parent = parent
        self.dados = dados_processados
        self.window = tk.Toplevel(parent)
        self.window.title("Módulo de Precificação - Cálculo de Preço de Venda")
        self.window.geometry("1200x800")
        self.window.transient(parent)
        self.window.grab_set()
        
        # Variáveis de configuração
        self.regime_tributario = tk.StringVar(value="real")
        self.aliq_icms_venda = tk.StringVar(value="19.0")
        self.aliq_ipi_venda = tk.StringVar(value="0.0")
        self.margem_padrao = tk.StringVar(value="30.0")
        
        # Lista para armazenar dados dos itens
        self.itens_precificacao = []
        self._preparar_dados_itens()
        self._criar_interface()
        
    def _preparar_dados_itens(self):
        """Prepara lista de itens para precificação"""
        for adicao in self.dados["adicoes"]:
            for item in adicao["itens"]:
                self.itens_precificacao.append({
                    "Adição": adicao["numero"],
                    "NCM": adicao["dados_gerais"]["NCM"],
                    "Seq": item["Seq"],
                    "Código": item["Código"],
                    "Descrição": item["Descrição"][:50] + "..." if len(item["Descrição"]) > 50 else item["Descrição"],
                    "Qtd": item["Qtd"],
                    "Custo Unit R$": item.get("Custo Unitário R$", 0),
                    "Margem (%)": 30.0,  # Padrão
                    "item_data": item  # Dados completos do item
                })
    
    def _criar_interface(self):
        main_frame = ttk.Frame(self.window, padding=20)
        main_frame.pack(fill="both", expand=True)
        
        # Título
        ttk.Label(main_frame, text="Módulo de Precificação com Cálculo de Impostos sobre Venda", 
                 font=("Arial", 14, "bold"), foreground="blue").pack(pady=(0, 20))
        
        # Configurações gerais
        config_frame = ttk.LabelFrame(main_frame, text="Configurações de Precificação", padding=15)
        config_frame.pack(fill="x", pady=(0, 20))
        
        # Primeira linha de configurações
        config_row1 = ttk.Frame(config_frame)
        config_row1.pack(fill="x", pady=(0, 10))
        
        ttk.Label(config_row1, text="Regime Tributário:").grid(row=0, column=0, sticky="w", padx=(0, 5))
        regime_combo = ttk.Combobox(config_row1, textvariable=self.regime_tributario, 
                                   values=["real", "presumido"], width=12, state="readonly")
        regime_combo.grid(row=0, column=1, padx=(0, 20))
        
        ttk.Label(config_row1, text="ICMS Venda (%):").grid(row=0, column=2, sticky="w", padx=(0, 5))
        ttk.Entry(config_row1, textvariable=self.aliq_icms_venda, width=8).grid(row=0, column=3, padx=(0, 20))
        
        ttk.Label(config_row1, text="IPI Venda (%):").grid(row=0, column=4, sticky="w", padx=(0, 5))
        ttk.Entry(config_row1, textvariable=self.aliq_ipi_venda, width=8).grid(row=0, column=5, padx=(0, 20))
        
        ttk.Label(config_row1, text="Margem Padrão (%):").grid(row=0, column=6, sticky="w", padx=(0, 5))
        ttk.Entry(config_row1, textvariable=self.margem_padrao, width=8).grid(row=0, column=7)
        
        # Segunda linha com botões - REMOVER O CAMPO IPI VENDA
        config_row2 = ttk.Frame(config_frame)
        config_row2.pack(fill="x")
        
        ttk.Button(config_row2, text="Aplicar Margem Padrão a Todos", 
                command=self._aplicar_margem_padrao).pack(side="left", padx=(0, 10))
        ttk.Button(config_row2, text="Calcular Preços de Venda", 
                command=self._calcular_precos).pack(side="left", padx=(0, 10))
        ttk.Button(config_row2, text="Gerar Excel com Precificação", 
                command=self._gerar_excel_precificacao).pack(side="left")
        
        # Nota informativa
        ttk.Label(config_frame, text="ℹ️ IPI da venda será o mesmo da entrada para cada item", 
                font=("Arial", 8), foreground="blue").pack(pady=(5, 0))
        
        # Frame principal com treeview
        tree_frame = ttk.Frame(main_frame)
        tree_frame.pack(fill="both", expand=True)
        
        # Scrollbars
        tree_scroll_v = ttk.Scrollbar(tree_frame, orient="vertical")
        tree_scroll_v.pack(side="right", fill="y")
        tree_scroll_h = ttk.Scrollbar(tree_frame, orient="horizontal")
        tree_scroll_h.pack(side="bottom", fill="x")
        
        # Treeview para exibir itens
        self.tree = ttk.Treeview(tree_frame, 
                                yscrollcommand=tree_scroll_v.set,
                                xscrollcommand=tree_scroll_h.set)
        self.tree.pack(fill="both", expand=True)
        
        # Configurar scrollbars
        tree_scroll_v.config(command=self.tree.yview)
        tree_scroll_h.config(command=self.tree.xview)
        
        # Definir colunas
        colunas = ["NCM", "Código", "Descrição", "Qtd", "Custo Unit R$", "Margem (%)", 
                  "Custo Líq R$", "Preço Venda R$", "Margem Real (%)"]
        
        self.tree["columns"] = colunas
        self.tree["show"] = "headings"
        
        # Configurar cabeçalhos e larguras
        larguras = [100, 80, 300, 80, 100, 80, 100, 100, 80]
        for i, col in enumerate(colunas):
            self.tree.heading(col, text=col)
            self.tree.column(col, width=larguras[i], anchor="center" if i != 2 else "w")
        
        # Permitir edição duplo-clique na margem
        self.tree.bind("<Double-1>", self._editar_margem)
        
        # Carregar dados iniciais
        self._carregar_dados_tree()
        
        # Botão fechar
        ttk.Button(main_frame, text="Fechar", command=self.window.destroy).pack(pady=20)
    
    def _carregar_dados_tree(self):
        """Carrega dados na treeview"""
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        for item_data in self.itens_precificacao:
            valores = [
                item_data["NCM"],
                item_data["Código"],
                item_data["Descrição"],
                f"{item_data['Qtd']:.0f}",
                f"R$ {item_data['Custo Unit R$']:.2f}",
                f"{item_data['Margem (%)']:.1f}",
                "R$ 0,00",  # Será calculado
                "R$ 0,00",  # Será calculado
                "0,0%"      # Será calculado
            ]
            self.tree.insert("", "end", values=valores)
    
    def _aplicar_margem_padrao(self):
        """Aplica margem padrão a todos os itens"""
        try:
            margem = float(self.margem_padrao.get().replace(",", "."))
            for item in self.itens_precificacao:
                item["Margem (%)"] = margem
            self._carregar_dados_tree()
        except ValueError:
            messagebox.showerror("Erro", "Margem padrão inválida!")
    
    def _editar_margem(self, event):
        """Permite editar margem com duplo-clique"""
        selection = self.tree.selection()
        if not selection:
            return
        
        item_id = selection[0]
        col = self.tree.identify_column(event.x)
        
        # Coluna 6 é "Margem (%)"
        if col == "#6":
            # Obter valores atuais
            item_values = self.tree.item(item_id)["values"]
            margem_atual = item_values[5].replace("%", "")
            
            # Dialog para editar
            nova_margem = tk.simpledialog.askfloat("Editar Margem", 
                                                  f"Nova margem (%):", 
                                                  initialvalue=float(margem_atual))
            if nova_margem is not None:
                # Atualizar dados
                row_index = self.tree.index(item_id)
                self.itens_precificacao[row_index]["Margem (%)"] = nova_margem
                self._carregar_dados_tree()
    
    def _calcular_precos(self):
        """Calcula preços de venda para todos os itens"""
        try:
            regime = self.regime_tributario.get()
            aliq_icms = float(self.aliq_icms_venda.get().replace(",", ".")) / 100
            
            # Limpar treeview
            for item in self.tree.get_children():
                self.tree.delete(item)
            
            # Calcular para cada item
            for i, item_precif in enumerate(self.itens_precificacao):
                item_data = item_precif["item_data"]
                margem = item_precif["Margem (%)"] / 100
                
                # Obter IPI da entrada para este item específico
                aliq_ipi_entrada = 0.0
                
                # Buscar a adição correspondente para pegar o IPI
                for adicao in self.dados["adicoes"]:
                    if any(it["Seq"] == item_data["Seq"] for it in adicao["itens"]):
                        aliq_ipi_entrada = adicao["tributos"].get("IPI Alíq. (%)", 0.0) / 100
                        break
                
                # Calcular créditos e custo líquido
                creditos, custo_liquido = calcular_creditos_tributarios(item_data, regime)
                
                # Calcular preço de venda com IPI da entrada
                preco_data = calcular_preco_venda(
                    custo_liquido, margem, aliq_icms, aliq_ipi_entrada, regime=regime
                )
                
                # Armazenar resultados
                item_precif["precificacao"] = preco_data
                item_precif["creditos"] = creditos
                
                # Inserir na treeview
                valores = [
                    item_precif["NCM"],
                    item_precif["Código"],
                    item_precif["Descrição"],
                    f"{item_precif['Qtd']:.0f}",
                    f"R$ {item_precif['Custo Unit R$']:.2f}",
                    f"{item_precif['Margem (%)']:.1f}%",
                    f"R$ {custo_liquido:.2f}",
                    f"R$ {preco_data['Preço Final R$']:.2f}",
                    f"{preco_data['Margem Real (%)']:.1f}%"
                ]
                self.tree.insert("", "end", values=valores)
                
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao calcular preços: {str(e)}")
    
    def _gerar_excel_precificacao(self):
        """Gera Excel com dados de precificação"""
        if not any("precificacao" in item for item in self.itens_precificacao):
            messagebox.showwarning("Aviso", "Execute o cálculo de preços primeiro!")
            return
        
        # Escolher local para salvar
        arquivo = filedialog.asksaveasfilename(
            title="Salvar Precificação como...",
            defaultextension=".xlsx",
            filetypes=[("Excel", "*.xlsx")]
        )
        
        if not arquivo:
            return
        
        try:
            with pd.ExcelWriter(arquivo, engine="xlsxwriter") as writer:
                # Preparar dados para o DataFrame
                dados_precificacao = []
                dados_creditos = []
                
                for item in self.itens_precificacao:
                    if "precificacao" not in item:
                        continue
                        
                    preco_data = item["precificacao"]
                    creditos = item["creditos"]
                    
                    # Dados de precificação
                    dados_precificacao.append({
                        "NCM": item["NCM"],
                        "Código": item["Código"],
                        "Descrição": item["Descrição"],
                        "Qtd": item["Qtd"],
                        "Custo Bruto Unit R$": item["Custo Unit R$"],
                        "Custo Líquido Unit R$": preco_data["Custo Líquido R$"],
                        "Margem Desejada (%)": preco_data["Margem Desejada (%)"],
                        "Preço Base R$": preco_data["Preço Base R$"],
                        "ICMS Venda R$": preco_data["ICMS Venda R$"],
                        "PIS Venda R$": preco_data["PIS Venda R$"],
                        "COFINS Venda R$": preco_data["COFINS Venda R$"],
                        "IPI Venda R$": preco_data["IPI Venda R$"],
                        "IPI Alíq. Venda (%)": preco_data["IPI Alíq. Venda (%)"],  # NOVO
                        "Total Impostos R$": preco_data["Total Impostos Venda R$"],
                        "Preço Final R$": preco_data["Preço Final R$"],
                        "Margem Real (%)": preco_data["Margem Real (%)"],
                        "Regime": preco_data["Regime Tributário"]
                    })
                    
                    # Dados de créditos
                    dados_creditos.append({
                        "NCM": item["NCM"],
                        "Código": item["Código"],
                        "Descrição": item["Descrição"],
                        "Custo Bruto R$": item["Custo Unit R$"],
                        "ICMS Crédito R$": creditos["ICMS Crédito"],
                        "IPI Crédito R$": creditos["IPI Crédito"],
                        "PIS Crédito R$": creditos["PIS Crédito"],
                        "COFINS Crédito R$": creditos["COFINS Crédito"],
                        "Total Créditos R$": creditos["Total Créditos"],
                        "Custo Líquido R$": preco_data["Custo Líquido R$"]
                    })
                
                # Criar DataFrames e salvar
                df_precificacao = pd.DataFrame(dados_precificacao)
                df_creditos = pd.DataFrame(dados_creditos)
                
                df_precificacao.to_excel(writer, sheet_name="Precificação", index=False)
                df_creditos.to_excel(writer, sheet_name="Créditos_Tributários", index=False)
                
                # Formatação
                workbook = writer.book
                money_format = workbook.add_format({'num_format': 'R$ #,##0.00'})
                percent_format = workbook.add_format({'num_format': '0.0%'})
                
                # Aplicar formatação na aba Precificação
                worksheet = writer.sheets["Precificação"]
                for col in [4, 5, 6, 7, 8, 9, 10, 11, 12, 13]:  # Colunas monetárias
                    worksheet.set_column(col, col, None, money_format)
                worksheet.set_column(6, 6, None, percent_format)  # Margem Desejada
                worksheet.set_column(14, 14, None, percent_format)  # Margem Real
                
                # Aplicar formatação na aba Créditos
                worksheet2 = writer.sheets["Créditos_Tributários"]
                for col in range(3, 10):  # Colunas monetárias
                    worksheet2.set_column(col, col, None, money_format)
            
            messagebox.showinfo("Sucesso", f"Precificação salva em:\n{arquivo}")
            
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao gerar Excel: {str(e)}")

# Adicionar import necessário para o simpledialog

import tkinter.simpledialog

def gera_excel_completo(d: dict, xlsx: Path):
    """Gera Excel com aba para cada adição - COM CONFIGURAÇÃO DE CUSTOS E ICMS"""
    
    with pd.ExcelWriter(xlsx, engine="xlsxwriter") as wr:
        wb = wr.book
        hdr = wb.add_format({"bold": True, "bg_color": "#D7E4BC"})
        hdr_secao = wb.add_format({"bold": True, "bg_color": "#4F81BD", "font_color": "white"})
        hdr_custo = wb.add_format({"bold": True, "bg_color": "#FFA500", "font_color": "white"})
        hdr_config = wb.add_format({"bold": True, "bg_color": "#9932CC", "font_color": "white"})
        money = wb.add_format({"num_format": "#,##0.00"})
        percent = wb.add_format({"num_format": "0.00%"})
        
        def add_table(worksheet, df, style="Table Style Medium 2"):
            """Adiciona uma tabela do Excel à planilha."""
            (rows, cols) = df.shape
            worksheet.add_table(0, 0, rows, cols - 1, {
                'style': style,
                'columns': [{'header': str(c)} for c in df.columns]
            })
        
        def simples(dic, aba, larg0=26, larg1=50):
            df_data = pd.DataFrame(list(dic.items()), columns=["Campo", "Valor"])
            df_data.to_excel(wr, sheet_name=aba, index=False, header=True)
            ws = wr.sheets[aba]
            ws.set_column(0, 0, larg0)
            ws.set_column(1, 1, larg1)
            add_table(ws, df_data)
        
        # Abas gerais
        simples(d["cabecalho"], "01_Capa")
        simples(d["importador"], "02_Importador")
        simples(d["carga"], "03_Carga")
        simples(d["valores"], "04_Valores")
        
        # Aba de despesas complementares
        if d.get("despesas_complementares"):
            despesas_df = pd.DataFrame(list(d["despesas_complementares"].items()), 
                                     columns=["Despesa", "Valor (R$)"])
            despesas_df.to_excel(wr, "04B_Despesas_Complementares", index=False)
            ws = wr.sheets["04B_Despesas_Complementares"]
            ws.set_column(0, 0, 25)
            ws.set_column(1, 1, 15, money)
            add_table(ws, despesas_df, style="Table Style Medium 5")
        
        # Configuração de Custos
        if "configuracao_custos" in d:
            config_df = pd.DataFrame(list(d["configuracao_custos"].items()), 
                                   columns=["Configuração", "Valor"])
            config_df.to_excel(wr, "04A_Config_Custos", index=False)
            ws = wr.sheets["04A_Config_Custos"]
            ws.set_column(0, 0, 25)
            ws.set_column(1, 1, 25, money)
            add_table(ws, config_df, style="Table Style Medium 3")
        
        # Tributos totais (incluindo ICMS)
        tributos_df = pd.Series(d["tributos"]).rename("Total (R$)").to_frame().reset_index()
        tributos_df.columns = ["Imposto", "Total (R$)"]
        tributos_df.to_excel(wr, "05_Tributos_Totais", index=False)
        ws = wr.sheets["05_Tributos_Totais"]
        ws.set_column(0, 0, 20)
        ws.set_column(1, 1, 14, money)
        add_table(ws, tributos_df)
        
        # Validação de custos
        if "validacao_custos" in d:
            validacao_df = pd.DataFrame(list(d["validacao_custos"].items()), 
                                      columns=["Métrica", "Valor"])
            validacao_df.to_excel(wr, "05A_Validacao_Custos", index=False)
            ws = wr.sheets["05A_Validacao_Custos"]
            ws.set_column(0, 0, 25)
            ws.set_column(1, 1, 25)
            
            # Colorir status
            for i, row in validacao_df.iterrows():
                if row["Métrica"] == "Status":
                    status_format = wb.add_format(
                        {"bold": True, "bg_color": "#90EE90" if row["Valor"] == "OK" else "#FFB6C1"})
                    ws.write(i + 1, 1, row["Valor"], status_format)
                elif "R$" in str(row["Métrica"]) or row["Métrica"] in ["Custo Total Calculado", "Valor Esperado", "Diferença"]:
                    ws.write(i + 1, 1, row["Valor"], money)
            
            add_table(ws, validacao_df, style="Table Style Medium 4")
        
        # Resumo de adições COM TODOS OS TRIBUTOS
        resumo_adicoes = []
        for ad in d["adicoes"]:
            descricao = ad["dados_gerais"]["Descrição NCM"] or "N/A"
            if len(descricao) > 50:
                descricao = descricao[:50] + "..."
            
            custos = ad.get("custos", {})
            resumo_adicoes.append({
                "Nº": ad["numero"],
                "NCM": ad["dados_gerais"]["NCM"],
                "Descrição": descricao,
                "INCOTERM": ad["dados_gerais"]["INCOTERM"],
                "VCMV R$": ad["dados_gerais"]["VCMV R$"],
                "Custo Total R$": custos.get("Custo Total Adição R$", 0),
                "II R$": ad["tributos"]["II R$"],
                "IPI R$": ad["tributos"]["IPI R$"],
                "PIS R$": ad["tributos"]["PIS R$"],
                "COFINS R$": ad["tributos"]["COFINS R$"],
                "ICMS R$": custos.get("ICMS Incorporado R$", 0),
                "Total Tributos R$": (ad["tributos"]["II R$"] + ad["tributos"]["IPI R$"] +
                                    ad["tributos"]["PIS R$"] + ad["tributos"]["COFINS R$"] +
                                    custos.get("ICMS Incorporado R$", 0))
            })
        
        if resumo_adicoes:
            df_resumo = pd.DataFrame(resumo_adicoes)
            df_resumo.to_excel(wr, "06_Resumo_Adicoes", index=False)
            ws = wr.sheets["06_Resumo_Adicoes"]
            ws.freeze_panes(1, 0)
            add_table(ws, df_resumo, style="Table Style Medium 9")
            
            # Configurar colunas
            larguras = [5, 12, 35, 10, 12, 15, 12, 12, 12, 12, 12, 16]
            for col, width in enumerate(larguras):
                ws.set_column(col, col, width)
            
            # Formatar colunas monetárias
            for c in range(4, len(larguras)):
                ws.set_column(c, c, None, money)
        
        # Resumo de custos por adição COM TODOS OS TRIBUTOS
        resumo_custos = []
        for ad in d["adicoes"]:
            custos = ad.get("custos", {})
            if custos:
                resumo_custos.append({
                    "Adição": ad["numero"],
                    "NCM": ad["dados_gerais"]["NCM"],
                    "INCOTERM": ad["dados_gerais"]["INCOTERM"],
                    "Valor Mercadoria R$": custos.get("Valor Mercadoria R$", 0),
                    "Frete Rateado R$": custos.get("Frete Rateado R$", 0),
                    "Seguro Rateado R$": custos.get("Seguro Rateado R$", 0),
                    "AFRMM Rateado R$": custos.get("AFRMM Rateado R$", 0),
                    "Siscomex Rateado R$": custos.get("Siscomex Rateado R$", 0),
                    "II R$": custos.get("II Incorporado R$", 0),
                    "IPI R$": custos.get("IPI R$", 0),
                    "PIS R$": custos.get("PIS R$", 0),
                    "COFINS R$": custos.get("COFINS R$", 0),
                    "ICMS R$": custos.get("ICMS Incorporado R$", 0),
                    "Custo Total R$": custos.get("Custo Total Adição R$", 0),
                    "% Participação": custos.get("% Participação", 0)
                })
        
        if resumo_custos:
            df_custos = pd.DataFrame(resumo_custos)
            df_custos.to_excel(wr, "06A_Resumo_Custos", index=False)
            ws = wr.sheets["06A_Resumo_Custos"]
            ws.freeze_panes(1, 0)
            add_table(ws, df_custos, style="Table Style Medium 10")
            
            # Configurar larguras
            larguras = [8, 12, 10, 12, 10, 10, 10, 10, 10, 10, 10, 10, 10, 12, 12]
            for col, width in enumerate(larguras):
                ws.set_column(col, col, width)
            
            # Formatar colunas
            for c in range(3, len(larguras)-1):  # Colunas monetárias exceto % Participação
                ws.set_column(c, c, None, money)
            ws.set_column(len(larguras)-1, len(larguras)-1, None, percent)  # % Participação
        
        # Criar aba para cada adição com custos EXPANDIDOS POR ITEM
        for i, ad in enumerate(d["adicoes"], 1):
            numero_adicao = ad["numero"] or str(i).zfill(3)
            aba_nome = f"Add_{numero_adicao}"
            ws = wb.add_worksheet(aba_nome)
            
            current_row = 0
            
            def write_section_as_table(title, data_dict, header_format, col1_name="Campo", col2_name="Valor"):
                nonlocal current_row
                ws.merge_range(current_row, 0, current_row, 1, title, header_format)
                current_row += 1
                start_table_row = current_row
                ws.write(current_row, 0, col1_name, hdr)
                ws.write(current_row, 1, col2_name, hdr)
                current_row += 1
                
                for campo, valor in data_dict.items():
                    ws.write(current_row, 0, campo)
                    if isinstance(valor, (int, float)):
                        if "%" in campo: 
                            ws.write(current_row, 1, valor / 100, percent)
                        elif "R$" in campo: 
                            ws.write(current_row, 1, valor, money)
                        else: 
                            ws.write(current_row, 1, valor)
                    else: 
                        ws.write(current_row, 1, valor)
                    current_row += 1
                
                ws.add_table(start_table_row, 0, current_row - 1, 1,
                           {'style': 'Table Style Medium 2', 'columns': [{'header': col1_name}, {'header': col2_name}]})
                current_row += 1
            
            # SEÇÕES COMO TABELAS
            write_section_as_table("DADOS GERAIS", ad["dados_gerais"], hdr_secao)
            write_section_as_table("PARTES ENVOLVIDAS", ad["partes"], hdr_secao)
            write_section_as_table("TRIBUTOS", ad["tributos"], hdr_secao)
            
            if "custos" in ad:
                write_section_as_table("ANÁLISE DE CUSTOS", ad["custos"], hdr_custo, 
                                     col1_name="Componente", col2_name="Valor (R$)")
            
            # SEÇÃO: ITENS DETALHADOS COM TODOS OS CUSTOS E TRIBUTOS
            ws.merge_range(current_row, 0, current_row, 20, "ITENS DETALHADOS COM CUSTOS E TRIBUTOS", hdr_secao)
            current_row += 1
            
            if ad["itens"]:
                df_itens = pd.DataFrame(ad["itens"])
                
                # Adicionar todas as colunas de custo e tributos calculadas por item
                colunas_custos = [
                    "Custo Mercadoria R$", "Frete Rateado R$", "Seguro Rateado R$", 
                    "AFRMM Rateado R$", "Siscomex Rateado R$", "II Incorporado R$",
                    "IPI R$", "PIS R$", "COFINS R$", "ICMS Incorporado R$",
                    "Custo Total Item R$", "Custo Unitário R$", "Custo por Peça R$"
                ]
                
                for coluna in colunas_custos:
                    if coluna not in df_itens.columns:
                        df_itens[coluna] = [item.get(coluna, 0) for item in ad["itens"]]
                
                # Organizar colunas
                cols_ordem = [
                    "Seq", "Código", "Descrição", "Qtd", "Unidade", 
                    "Valor Unit. USD", "Unid/Caixa", "Valor Total USD"
                ] + colunas_custos
                
                df_itens = df_itens[cols_ordem]
                
                start_table_row = current_row
                df_itens.to_excel(wr, sheet_name=aba_nome, startrow=start_table_row, index=False)
                
                # Adicionar tabela
                (rows, cols) = df_itens.shape
                ws.add_table(start_table_row, 0, start_table_row + rows, cols - 1,
                           {'style': 'Table Style Medium 9', 'columns': [{'header': c} for c in df_itens.columns]})
                
                current_row += rows + 2
                
                # Formatação de colunas monetárias
                money_cols = list(range(5, len(cols_ordem)))  # Todas as colunas monetárias
                for c_idx in money_cols:
                    ws.set_column(c_idx, c_idx, None, money)
                
                # Linha de totais
                ws.write(current_row, 2, "TOTAIS:", hdr)
                total_qtd = sum(item["Qtd"] for item in ad["itens"])
                total_valor_usd = sum(item["Valor Total USD"] for item in ad["itens"])
                
                ws.write(current_row, 3, total_qtd, hdr)
                ws.write(current_row, 7, total_valor_usd, money)
                
                # Totais de cada custo
                for col_idx, col_name in enumerate(colunas_custos, start=8):
                    if col_name not in ["Custo Unitário R$", "Custo por Peça R$"]:  # Não somar unitários
                        total_custo = sum(item.get(col_name, 0) for item in ad["itens"] 
                                        if isinstance(item.get(col_name), (int, float)))
                        ws.write(current_row, col_idx, total_custo, money)
            else:
                ws.write(current_row, 0, "Nenhum item detalhado encontrado", hdr)
                current_row += 1
            
            # Configurar larguras das colunas
            larguras_cols = [
                8,   # Seq
                12,  # Código  
                40,  # Descrição
                8,   # Qtd
                10,  # Unidade
                12,  # Valor Unit. USD
                10,  # Unid/Caixa
                12,  # Valor Total USD
                12,  # Custo Mercadoria
                10,  # Frete Rateado
                10,  # Seguro Rateado
                10,  # AFRMM Rateado
                10,  # Siscomex Rateado
                10,  # II
                8,   # IPI
                8,   # PIS
                10,  # COFINS
                10,  # ICMS
                12,  # Custo Total
                12,  # Custo Unitário
                12   # Custo por Peça
            ]
            
            for col_idx, width in enumerate(larguras_cols):
                ws.set_column(col_idx, col_idx, width)
        
        # Dados complementares
        df_comp = pd.DataFrame({"Dados Complementares": [d["info_complementar"]]})
        df_comp.to_excel(wr, "99_Complementar", index=False)
        ws = wr.sheets["99_Complementar"]
        ws.set_column(0, 0, 120)
        add_table(ws, df_comp)
        
        # === CROQUI DE NOTA FISCAL DE ENTRADA COM ICMS CORRIGIDO === #
        ws_croqui = wb.add_worksheet("Croqui_NFe_Entrada")
        linha = 0
        
        def secao(titulo):
            nonlocal linha
            ws_croqui.merge_range(linha, 0, linha, 13, titulo, hdr_secao)
            linha += 1
        
        secao("CABEÇALHO DA NOTA")
        ws_croqui.write_row(linha, 0, ["Série", "Modelo", "Tipo de Operação", "Natureza da Operação", 
                                      "Finalidade", "Data de Emissão", "Chave de Acesso"])
        ws_croqui.write_row(linha+1, 0, [1, 55, "0 (entrada)", "Importação do exterior (CFOP 3102)", 
                                        1, "", ""])
        linha += 3
        
        # EMITENTE/IMPORTADOR
        secao("EMITENTE / IMPORTADOR")
        ws_croqui.write_row(linha, 0, ["CNPJ", "Razão Social", "Endereço"])
        ws_croqui.write_row(linha+1, 0, [d["importador"]["CNPJ"], d["importador"]["Nome"], 
                                        d["importador"]["Endereço"]])
        linha += 3
        
        # REMETENTE/EXPORTADOR (EXTERIOR)
        secao("REMETENTE / EXPORTADOR (EXTERIOR)")
        primeira_ad = d["adicoes"][0]
        ws_croqui.write_row(linha, 0, ["Nome Exportador", "País de Aquisição"])
        ws_croqui.write_row(linha+1, 0, [primeira_ad["partes"]["Exportador"], 
                                        primeira_ad["partes"]["País Aquisição"]])
        linha += 3
        
        # DADOS DA DI
        secao("DADOS DA DECLARAÇÃO DE IMPORTAÇÃO")
        ws_croqui.write_row(linha, 0, ["Número DI", "Registro", "URF", "Modalidade"])
        ws_croqui.write_row(linha+1, 0, [d["cabecalho"]["DI"], d["cabecalho"]["Data registro"], 
                                        d["cabecalho"]["URF despacho"], d["cabecalho"]["Modalidade"]])
        linha += 3
        
        # PRODUTOS E SERVIÇOS
        secao("PRODUTOS E SERVIÇOS")
        itens_nfe = []
        seq_nota = 1
        
        # Usar alíquota configurada
        aliquota_icms_config = d.get("configuracao_custos", {}).get("Alíquota ICMS (%)", 19.0)
        
        for ad in d["adicoes"]:
            for item in ad["itens"]:
                itens_nfe.append({
                    "Seq": seq_nota,
                    "Descrição": item["Descrição"],
                    "NCM": ad["dados_gerais"]["NCM"],
                    "Quantidade": item["Qtd"],
                    "Unidade": item["Unidade"],
                    "Valor Unit. (R$)": item.get("Custo Unitário R$", 0),
                    "Valor Total (R$)": item.get("Custo Total Item R$", 0),
                    "CFOP": "3102",
                    "Origem": "3",  # Estrangeira
                    "CST ICMS": "00",
                    "Alq. ICMS (%)": aliquota_icms_config,
                    "IPI CST": "00",
                    "IPI Alíq. (%)": round(ad["tributos"].get("IPI Alíq. (%)", 0)*100, 2),
                    "Fabricante": ad["partes"]["Fabricante"]
                })
                seq_nota += 1
        
        if itens_nfe:
            df_nfe = pd.DataFrame(itens_nfe)
            df_nfe.to_excel(wr, sheet_name="Croqui_NFe_Entrada", startrow=linha, index=False)
            
            (rows, cols) = df_nfe.shape
            ws_croqui.add_table(linha, 0, linha + rows, cols - 1,
                               {'style': 'Table Style Medium 9', 'columns': [{'header': c} for c in df_nfe.columns]})
            linha += rows + 2
        
        # BASE E CÁLCULO DO ICMS COM VALORES CORRETOS
        secao("BASE DE CÁLCULO DO ICMS IMPORTAÇÃO")
        
        base_icms_data = {
            "Valor Aduaneiro": d["valores"]["Valor Aduaneiro R$"],
            "II": d["tributos"]["II R$"],
            "IPI": d["tributos"]["IPI R$"],
            "PIS": d["tributos"]["PIS R$"],
            "COFINS": d["tributos"]["COFINS R$"],
            "AFRMM": d.get("configuracao_custos", {}).get("AFRMM R$", 0),
            "Siscomex": d.get("configuracao_custos", {}).get("Siscomex R$", 0)
        }
        
        for k, v in base_icms_data.items(): 
            ws_croqui.write_row(linha, 0, [k, v]); 
            linha += 1
        linha += 1
        
        base_icms_sem_icms = sum(base_icms_data.values())
        ws_croqui.write_row(linha, 0, ["Base ICMS Sem ICMS", base_icms_sem_icms]); linha += 1
        
        # Usar ICMS calculado
        icms_total = d["tributos"].get("ICMS R$", 0)
        base_final_icms = d["tributos"].get("Base ICMS R$", base_icms_sem_icms + icms_total)
        
        ws_croqui.write_row(linha, 0, ["Base Final do ICMS", base_final_icms]); linha += 1
        ws_croqui.write_row(linha, 0, ["ICMS a Recolher", icms_total]); linha += 2
        
        # INFORMAÇÕES COMPLEMENTARES
        secao("INFORMAÇÕES COMPLEMENTARES / OBSERVAÇÕES OBRIGATÓRIAS")
        
        info_extra = f"DI: {d['cabecalho']['DI']} - Data Registro: {d['cabecalho']['Data registro']}\n\n"
        info_extra += f"INFORMAÇÕES COMPLEMENTARES:\n{d['info_complementar']}\n\n"
        
        # Mostrar despesas identificadas
        if d.get("despesas_complementares"):
            info_extra += "DESPESAS IDENTIFICADAS AUTOMATICAMENTE:\n"
            for despesa, valor in d["despesas_complementares"].items():
                if valor > 0:
                    info_extra += f"• {despesa}: R$ {valor:,.2f}\n"
        
        ws_croqui.merge_range(linha, 0, linha + 10, 13, info_extra)
        linha += 12
        
        # Ajuste visual
        larguras_croqui = [5, 50, 12, 9, 8, 18, 18, 8, 6, 10, 14, 8, 8, 30]
        for col_idx, width in enumerate(larguras_croqui):
            ws_croqui.set_column(col_idx, col_idx, width)
        
        ws_croqui.write(linha, 0, "LEGENDAS: CFOP 3102=Compra p/ comercialização; CST ICMS=00; Origem=3(estrangeira)")

        
class AppExtrato(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Extrato DI com Custos, ICMS, Despesas e Módulo de Precificação – XML → Excel")
        self.geometry("1050x900")
        self.xml_path = tk.StringVar()
        self.excel_path = tk.StringVar()
        self.frete_embutido = tk.BooleanVar()
        self.seguro_embutido = tk.BooleanVar()
        self.valor_afrmm = tk.StringVar()
        self.valor_siscomex = tk.StringVar()
        self.aliquota_icms = tk.StringVar(value="19")
        self.dados_processados = None  # Para armazenar dados para precificação

        # NOVAS VARIÁVEIS para estado e incentivo
        self.estado_destino = tk.StringVar(value="GO")
        self.aplicar_incentivo = tk.BooleanVar(value=True)
        self.tem_similar_nacional = tk.BooleanVar(value=True)
        self.tipo_operacao = tk.StringVar(value="interestadual")

        # ✅ ADICIONAR ESTAS VARIÁVEIS QUE ESTÃO FALTANDO:
        # Variáveis para configurações especiais
        self.reducao_base_entrada = tk.BooleanVar()
        self.percentual_reducao_entrada = tk.StringVar(value="100")
        self.dolar_diferenciado = tk.BooleanVar()
        self.taxa_contratada = tk.StringVar()
        self.st_entrada = tk.BooleanVar()
        self.aliquota_st_entrada = tk.StringVar(value="0")

        self._monta_widgets()

    def _monta_widgets(self):
        # Criar canvas e scrollbar para permitir rolagem vertical
        canvas = tk.Canvas(self)
        scrollbar = ttk.Scrollbar(self, orient="vertical", command=canvas.yview)
        scrollable_frame = ttk.Frame(canvas)
        
        # Configurar rolagem
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        # Empacotar canvas e scrollbar
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        # IMPORTANTE: Agora usar scrollable_frame em vez de self
        frm = ttk.Frame(scrollable_frame, padding=20)
        frm.pack(fill="both", expand=True)
        
        # Habilitar rolagem com mouse wheel
        def _on_mousewheel(event):
            canvas.yview_scroll(int(-1*(event.delta/120)), "units")
        
        def _bind_to_mousewheel(event):
            canvas.bind_all("<MouseWheel>", _on_mousewheel)
        
        def _unbind_from_mousewheel(event):
            canvas.unbind_all("<MouseWheel>")
        
        canvas.bind('<Enter>', _bind_to_mousewheel)
        canvas.bind('<Leave>', _unbind_from_mousewheel)
        
        # === RESTO DO CÓDIGO PERMANECE IGUAL ===
        # Título
        ttk.Label(frm, text="Extrato DI com Custos, ICMS, Despesas e Módulo de Precificação",
                font=("Arial", 14, "bold"), foreground="green").grid(row=0, column=0, columnspan=6, pady=(0, 15))
        
        # Descrição
        desc_text = """🚀 FUNCIONALIDADES COMPLETAS:
    • Cálculo de custos unitários com rateiro proporcional de TODAS as despesas e impostos
    • Inclusão do ICMS no cálculo dos custos de importação (alíquota configurável por estado)
    • Extração automática de SISCOMEX e AFRMM das informações complementares
    • Entrada manual de valores caso não sejam encontrados automaticamente
    • NOVO: Módulo de precificação com cálculo de preços de venda considerando impostos sobre venda
    • NOVO: Cálculo de créditos tributários nos regimes real e presumido
    • NOVO: Impostos sobre venda calculados por dentro (exceto IPI que é por fora)
    • Opção para frete/seguro embutido no VCMV (INCOTERM CFR/CIF) - EVITA DUPLA CONTABILIZAÇÃO
    • Planilha completa com análise detalhada de custos e tributos por item"""
        
        ttk.Label(frm, text=desc_text, font=("Arial", 9), foreground="blue",
                wraplength=900, justify="left").grid(row=1, column=0, columnspan=6, pady=(0, 15))
        
        # 1. Seleção de arquivo XML
        grupo_arq_xml = ttk.LabelFrame(frm, text="1. Seleção do Arquivo XML da DI", padding=15)
        grupo_arq_xml.grid(row=2, column=0, columnspan=6, sticky="ew", pady=(0, 15))
        grupo_arq_xml.columnconfigure(1, weight=1)
        
        ttk.Label(grupo_arq_xml, text="Arquivo XML:").grid(row=0, column=0, sticky="w", padx=(0, 10))
        ttk.Entry(grupo_arq_xml, textvariable=self.xml_path, state="readonly") \
            .grid(row=0, column=1, sticky="ew", padx=(0, 10))
        ttk.Button(grupo_arq_xml, text="Procurar XML…", command=self._abrir_xml) \
            .grid(row=0, column=2)
        
        # 2. Configuração de Custos
        grupo_custos = ttk.LabelFrame(frm, text="2. Configuração de Custos (IMPORTANTE para INCOTERM CFR/CIF)",
                                    padding=15)
        grupo_custos.grid(row=3, column=0, columnspan=6, sticky="ew", pady=(0, 15))
        
        frame_opcoes = ttk.Frame(grupo_custos)
        frame_opcoes.grid(row=0, column=0, columnspan=6, sticky="ew")
        frame_opcoes.columnconfigure(0, weight=1)
        frame_opcoes.columnconfigure(1, weight=1)
        
        # Checkbox Frete Embutido
        frame_frete = ttk.Frame(frame_opcoes)
        frame_frete.grid(row=0, column=0, sticky="w", padx=(0, 20))
        ttk.Checkbutton(frame_frete, text="Frete embutido no VCMV",
                        variable=self.frete_embutido, command=self._atualizar_info_custos) \
            .grid(row=0, column=0, sticky="w")
        ttk.Label(frame_frete, text="(Marque se INCOTERM for CFR ou CIF)",
                font=("Arial", 8), foreground="gray") \
            .grid(row=1, column=0, sticky="w")
        
        # Checkbox Seguro Embutido
        frame_seguro = ttk.Frame(frame_opcoes)
        frame_seguro.grid(row=0, column=1, sticky="w")
        ttk.Checkbutton(frame_seguro, text="Seguro embutido no VCMV",
                        variable=self.seguro_embutido, command=self._atualizar_info_custos) \
            .grid(row=0, column=0, sticky="w")
        ttk.Label(frame_seguro, text="(Marque se INCOTERM for CIF)",
                font=("Arial", 8), foreground="gray") \
            .grid(row=1, column=0, sticky="w")
        
        # Label informativo
        self.lbl_info_custos = ttk.Label(grupo_custos,
                                        text="ℹ️ Configuração atual: Frete e seguro separados (INCOTERM FOB/EXW)",
                                        font=("Arial", 9), foreground="blue")
        self.lbl_info_custos.grid(row=1, column=0, columnspan=6, pady=(10, 0))
        
        # 3. Estado Destino e Incentivos Fiscais
        grupo_estado = ttk.LabelFrame(frm, text="3. Estado Destino e Incentivos Fiscais", padding=15)
        grupo_estado.grid(row=4, column=0, columnspan=6, sticky="ew", pady=(0, 15))
        
        # Configurar grid do grupo_estado
        grupo_estado.columnconfigure(1, weight=1)
        
        # Linha 1: Estado destino
        ttk.Label(grupo_estado, text="Estado de Destino:").grid(row=0, column=0, sticky="w", padx=(0, 5))
        estados_combo = ttk.Combobox(grupo_estado, textvariable=self.estado_destino,
                                values=[f"{codigo} - {ALIQ_ICMS_ESTADOS[codigo]['nome']}" 
                                        for codigo in ALIQ_ICMS_ESTADOS.keys()],
                                width=25, state="readonly")
        estados_combo.grid(row=0, column=1, sticky="w", padx=(0, 20))
        estados_combo.bind("<<ComboboxSelected>>", self._atualizar_info_estado)
        
        # Checkbox para aplicar incentivo
        ttk.Checkbutton(grupo_estado, text="Aplicar Incentivo Fiscal",
                    variable=self.aplicar_incentivo,
                    command=self._atualizar_info_incentivo).grid(row=0, column=2, sticky="w", padx=(0, 20))
        
        # Linha 2: Tipo de operação  
        ttk.Label(grupo_estado, text="Tipo de Operação:").grid(row=1, column=0, sticky="w", padx=(0, 5))
        operacao_combo = ttk.Combobox(grupo_estado, textvariable=self.tipo_operacao,
                                    values=["interestadual", "interna"], width=15, state="readonly")
        operacao_combo.grid(row=1, column=1, sticky="w", padx=(0, 20))
        
        # Checkbox para similar nacional
        ttk.Checkbutton(grupo_estado, text="Produto tem similar nacional",
                    variable=self.tem_similar_nacional).grid(row=1, column=2, sticky="w", padx=(0, 20))
        
        # Label informativo sobre o incentivo (com mais espaço)
        self.lbl_info_incentivo = ttk.Label(grupo_estado,
                                        text="ℹ️ Selecione um estado para ver os incentivos disponíveis",
                                        font=("Arial", 9), foreground="blue", wraplength=950)
        self.lbl_info_incentivo.grid(row=2, column=0, columnspan=3, sticky="ew", pady=(10, 0))
        
        # 3B. Configurações Especiais
        grupo_config_especiais = ttk.LabelFrame(frm, text="3B. Configurações Especiais (Opcional)", padding=15)
        grupo_config_especiais.grid(row=5, column=0, columnspan=6, sticky="ew", pady=(0, 15))
        
        # Usar grid em vez de pack para melhor controle
        grupo_config_especiais.columnconfigure(0, weight=1)
        
        # Primeira linha
        config_frame1 = ttk.Frame(grupo_config_especiais)
        config_frame1.grid(row=0, column=0, sticky="ew", pady=(0, 5))
        
        ttk.Checkbutton(config_frame1, text="Redução base ICMS entrada",
                    variable=self.reducao_base_entrada).grid(row=0, column=0, sticky="w", padx=(0, 10))
        ttk.Label(config_frame1, text="Base (%):").grid(row=0, column=1, sticky="w", padx=(0, 2))
        ttk.Entry(config_frame1, textvariable=self.percentual_reducao_entrada, width=8).grid(row=0, column=2, padx=(0, 30))
        
        ttk.Checkbutton(config_frame1, text="Dólar contratado diferente",
                    variable=self.dolar_diferenciado).grid(row=0, column=3, sticky="w", padx=(0, 10))
        ttk.Label(config_frame1, text="Taxa:").grid(row=0, column=4, sticky="w", padx=(0, 2))
        ttk.Entry(config_frame1, textvariable=self.taxa_contratada, width=10).grid(row=0, column=5)
        
        # Segunda linha
        config_frame2 = ttk.Frame(grupo_config_especiais)
        config_frame2.grid(row=1, column=0, sticky="ew", pady=(0, 5))
        
        ttk.Checkbutton(config_frame2, text="ICMS-ST na entrada",
                    variable=self.st_entrada).grid(row=0, column=0, sticky="w", padx=(0, 10))
        ttk.Label(config_frame2, text="Alíquota ST (%):").grid(row=0, column=1, sticky="w", padx=(0, 2))
        ttk.Entry(config_frame2, textvariable=self.aliquota_st_entrada, width=8).grid(row=0, column=2, padx=(0, 30))
        
        ttk.Button(config_frame2, text="⚙️ Configurações Avançadas...",
                command=self._abrir_config_avancadas).grid(row=0, column=3, sticky="w")
        
        # 4. Despesas Adicionais e ICMS
        grupo_extras = ttk.LabelFrame(frm, text="4. Despesas Adicionais e ICMS (preencher se não detectadas automaticamente)", padding=15)
        grupo_extras.grid(row=6, column=0, columnspan=6, sticky="ew", pady=(0, 15))
        
        ttk.Label(grupo_extras, text="AFRMM (R$):").grid(row=0, column=0, sticky="w", padx=(0, 5))
        ttk.Entry(grupo_extras, textvariable=self.valor_afrmm, width=12).grid(row=0, column=1, sticky="w", padx=(0, 20))
        
        ttk.Label(grupo_extras, text="SISCOMEX (R$):").grid(row=0, column=2, sticky="w", padx=(0, 5))
        ttk.Entry(grupo_extras, textvariable=self.valor_siscomex, width=12).grid(row=0, column=3, sticky="w", padx=(0, 20))
        
        ttk.Label(grupo_extras, text="Alíquota ICMS (%):").grid(row=0, column=4, sticky="w", padx=(0, 5))
        ttk.Entry(grupo_extras, textvariable=self.aliquota_icms, width=8).grid(row=0, column=5, sticky="w")
        
        ttk.Label(grupo_extras, text="(O sistema tentará extrair AFRMM e SISCOMEX automaticamente das informações complementares. Se não encontrar, use os campos acima. GO: 19%, SP/RJ/MG: 18%)",
                font=("Arial", 8), foreground="gray").grid(row=1, column=0, columnspan=6, sticky="w", pady=(5, 0))
        
        # 5. Local para salvar Excel
        grupo_arq_excel = ttk.LabelFrame(frm, text="5. Local para Salvar o Excel", padding=15)
        grupo_arq_excel.grid(row=7, column=0, columnspan=6, sticky="ew", pady=(0, 15))
        grupo_arq_excel.columnconfigure(1, weight=1)
        
        ttk.Label(grupo_arq_excel, text="Salvar como:").grid(row=0, column=0, sticky="w", padx=(0, 10))
        ttk.Entry(grupo_arq_excel, textvariable=self.excel_path, state="readonly") \
            .grid(row=0, column=1, sticky="ew", padx=(0, 10))
        ttk.Button(grupo_arq_excel, text="Escolher Local…", command=self._escolher_local) \
            .grid(row=0, column=2)
        
        # 6. Processamento
        grupo_proc = ttk.LabelFrame(frm, text="6. Processamento", padding=15)
        grupo_proc.grid(row=8, column=0, columnspan=6, sticky="ew", pady=(0, 15))
        
        botoes_frame = ttk.Frame(grupo_proc)
        botoes_frame.pack()
        
        self.bt_exec = ttk.Button(botoes_frame, text="🧮 Gerar Extrato com Custos, ICMS e Despesas",
                                command=self._executar, state="disabled")
        self.bt_exec.pack(side="left", padx=(0, 20))
        
        # NOVO: Botão para módulo de precificação
        self.bt_precificacao = ttk.Button(botoes_frame, text="💰 Abrir Módulo de Precificação",
                                        command=self._abrir_precificacao, state="disabled")
        self.bt_precificacao.pack(side="left")
        
        # 7. Status
        grupo_status = ttk.LabelFrame(frm, text="7. Status", padding=15)
        grupo_status.grid(row=9, column=0, columnspan=6, sticky="ew")
        grupo_status.columnconfigure(0, weight=1)
        
        self.lbl = ttk.Label(grupo_status,
                            text="🎯 VERSÃO COMPLETA COM ICMS, DESPESAS E MÓDULO DE PRECIFICAÇÃO\n"
                                "• Extrai SISCOMEX e AFRMM automaticamente das informações complementares\n"
                                "• Permite entrada manual de valores caso não sejam detectados\n"
                                "• Calcula ICMS de importação com alíquota configurável por estado\n"
                                "• Inclui TODOS os tributos e despesas no cálculo de custos por item\n"
                                "• NOVO: Módulo de precificação com cálculo de preços de venda\n"
                                "• NOVO: Considera créditos tributários nos regimes real e presumido\n"
                                "• NOVO: Impostos sobre venda calculados corretamente (por dentro/por fora)\n"
                                "1. Selecione o arquivo XML da DI\n"
                                "2. Configure os custos conforme INCOTERM\n"
                                "3. Preencha despesas manuais se necessário\n"
                                "4. Configure alíquota ICMS conforme estado de destino\n"
                                "5. Gere o extrato de custos\n"
                                "6. Use o módulo de precificação para calcular preços de venda",
                            wraplength=850, foreground="green")
        self.lbl.grid(row=0, column=0, sticky="w")
        
        # Configurar weight das colunas
        frm.columnconfigure(1, weight=1)

    
    def _atualizar_info_custos(self):
        """Atualiza o texto informativo baseado nas opções selecionadas"""
        frete = self.frete_embutido.get()
        seguro = self.seguro_embutido.get()
        
        if frete and seguro:
            texto = "⚠️ Configuração: Frete E seguro embutidos no VCMV (INCOTERM CIF)"
            cor = "red"
        elif frete:
            texto = "⚠️ Configuração: Frete embutido no VCMV (INCOTERM CFR)"
            cor = "orange"
        elif seguro:
            texto = "⚠️ Configuração: Seguro embutido no VCMV (raro, verificar INCOTERM)"
            cor = "orange"
        else:
            texto = "ℹ️ Configuração: Frete e seguro separados (INCOTERM FOB/EXW)"
            cor = "blue"
        
        self.lbl_info_custos.config(text=texto, foreground=cor)

    def _atualizar_info_estado(self, event=None):
        """Atualiza informações quando estado é alterado"""
        estado_codigo = self.estado_destino.get().split(" - ")[
            0] if " - " in self.estado_destino.get() else self.estado_destino.get()

        # Atualizar alíquota ICMS padrão
        aliquota = obter_aliquota_icms_estado(estado_codigo)
        self.aliquota_icms.set(f"{aliquota * 100:.1f}")

        self._atualizar_info_incentivo()

    def _atualizar_info_incentivo(self):
        """Atualiza informações sobre incentivo fiscal"""
        estado_codigo = self.estado_destino.get().split(" - ")[
            0] if " - " in self.estado_destino.get() else self.estado_destino.get()
        incentivo = obter_incentivos_por_estado(estado_codigo)

        if self.aplicar_incentivo.get() and incentivo:
            texto = f"✅ {incentivo['nome']}: {incentivo['descricao'][:100]}..."
            texto += f"\n📋 Condições principais: {'; '.join(incentivo['condicoes'][:2])}..."
            cor = "green"
        elif incentivo:
            texto = f"❌ Incentivo disponível mas não aplicado: {incentivo['nome']}"
            cor = "orange"
        else:
            texto = "❌ Nenhum incentivo fiscal disponível para este estado"
            cor = "red"

        self.lbl_info_incentivo.config(text=texto, foreground=cor)

    def _abrir_config_avancadas(self):
        """Placeholder para configurações avançadas"""
        messagebox.showinfo("Em Desenvolvimento",
                            "Funcionalidade de configurações avançadas será implementada em versão futura.\n\n"
                            "Use as opções básicas disponíveis na interface principal.")

    def _abrir_xml(self):
        f = filedialog.askopenfilename(title="Selecione o XML da DI",
                                     filetypes=[("XML", "*.xml"), ("Todos arquivos", "*.*")])
        if f:
            self.xml_path.set(f)
            xml_name = Path(f).stem
            sugestao = Path(f).parent / f"ExtratoDI_COMPLETO_{xml_name}.xlsx"
            self.excel_path.set(str(sugestao))
            self._verificar_pronto()
            self.lbl.config(text=f"✅ XML selecionado: {Path(f).name}\n"
                                f"Configure os custos e despesas, depois escolha onde salvar o Excel.")
            
            # Tentar detectar INCOTERM automaticamente
            self._detectar_incoterm_automatico(f)
            
            # Tentar pré-carregar despesas das informações complementares
            self._precarregar_despesas(f)
    
    def _precarregar_despesas(self, xml_path):
        """Tenta pré-carregar despesas das informações complementares"""
        try:
            tree = ET.parse(xml_path)
            root = tree.getroot()
            di = root.find("declaracaoImportacao")
            
            if di is not None:
                info_comp = di.findtext("informacaoComplementar", "")
                if info_comp:
                    despesas = extrair_despesas_informacao_complementar(info_comp)
                    
                    if despesas.get("AFRMM R$", 0) > 0:
                        self.valor_afrmm.set(f"{despesas['AFRMM R$']:.2f}")
                    
                    if despesas.get("SISCOMEX R$", 0) > 0:
                        self.valor_siscomex.set(f"{despesas['SISCOMEX R$']:.2f}")
                    
                    # Mostrar mensagem se encontrou algo
                    total_encontrado = despesas.get("AFRMM R$", 0) + despesas.get("SISCOMEX R$", 0)
                    if total_encontrado > 0:
                        messagebox.showinfo("Despesas Detectadas!",
                                          f"Despesas encontradas automaticamente nas informações complementares:\n\n"
                                          f"• AFRMM: R$ {despesas.get('AFRMM R$', 0):,.2f}\n"
                                          f"• SISCOMEX: R$ {despesas.get('SISCOMEX R$', 0):,.2f}\n\n"
                                          f"Os valores foram preenchidos automaticamente.\n"
                                          f"Você pode editá-los se necessário antes de processar.")
        except Exception as e:
            # Ignorar erros de pré-carregamento
            pass
    
    def _detectar_incoterm_automatico(self, xml_path):
        """Tenta detectar INCOTERM do XML e sugerir configuração"""
        try:
            tree = ET.parse(xml_path)
            root = tree.getroot()
            di = root.find("declaracaoImportacao")
            
            if di is not None:
                primeiro_adicao = di.find("adicao")
                if primeiro_adicao is not None:
                    incoterm = primeiro_adicao.findtext("condicaoVendaIncoterm", "")
                    
                    if incoterm in ["CFR", "CIF"]:
                        self.frete_embutido.set(True)
                        if incoterm == "CIF":
                            self.seguro_embutido.set(True)
                        
                        self._atualizar_info_custos()
                        
                        messagebox.showinfo("INCOTERM Detectado!",
                                          f"INCOTERM {incoterm} detectado no XML!\n\n"
                                          f"Configuração automática aplicada:\n"
                                          f"• Frete embutido: {'Sim' if self.frete_embutido.get() else 'Não'}\n"
                                          f"• Seguro embutido: {'Sim' if self.seguro_embutido.get() else 'Não'}\n\n"
                                          f"⚠️ IMPORTANTE: Esta configuração evita dupla\n"
                                          f"contabilização do frete/seguro no cálculo de custos.")
        except Exception as e:
            pass
    
    def _escolher_local(self):
        nome_padrao = "ExtratoDI_COMPLETO.xlsx"
        if self.xml_path.get():
            xml_name = Path(self.xml_path.get()).stem
            nome_padrao = f"ExtratoDI_COMPLETO_{xml_name}.xlsx"
        
        f = filedialog.asksaveasfilename(
            title="Salvar Extrato Excel como...",
            defaultextension=".xlsx",
            initialfilename=nome_padrao,
            filetypes=[("Excel", "*.xlsx"), ("Todos arquivos", "*.*")]
        )
        
        if f:
            self.excel_path.set(f)
            self._verificar_pronto()
            self.lbl.config(text=f"✅ Excel será salvo como: {Path(f).name}\n" +
                               ("✅ Pronto para processar!" if self.xml_path.get() else "Selecione o XML da DI."))
    
    def _verificar_pronto(self):
        if self.xml_path.get() and self.excel_path.get():
            self.bt_exec.config(state="normal")
            self.lbl.config(text="🚀 Pronto para gerar extrato completo com ICMS e despesas!", foreground="green")
        else:
            self.bt_exec.config(state="disabled")
    
    def _abrir_precificacao(self):
        """Abre o módulo de precificação"""
        if not self.dados_processados:
            messagebox.showwarning("Aviso", "Execute primeiro o processamento do XML!")
            return
        
        # Abrir janela de precificação
        JanelaPrecificacao(self, self.dados_processados)
    
    def _executar(self):
        try:
            self.bt_exec.config(state="disabled")
            self.lbl.config(text="🔄 Processando XML, extraindo despesas e calculando custos com ICMS... Aguarde.", 
                           foreground="blue")
            self.update()
            
            # Processar dados
            dados = carrega_di_completo(Path(self.xml_path.get()))

            # Calcular custos com as opções selecionadas
            estado_codigo = self.estado_destino.get().split(" - ")[
                0] if " - " in self.estado_destino.get() else self.estado_destino.get()

            # Calcular custos com as opções selecionadas
            estado_codigo = self.estado_destino.get().split(" - ")[
                0] if " - " in self.estado_destino.get() else self.estado_destino.get()

            # PREPARAR CONFIGURAÇÕES ESPECIAIS
            config_especiais = CONFIGURACOES_ESPECIAIS_DEFAULT.copy()

            # Aplicar configurações básicas da interface
            if self.reducao_base_entrada.get():
                config_especiais["reducao_base_entrada"]["ativo"] = True
                config_especiais["reducao_base_entrada"]["percentual"] = float(
                    self.percentual_reducao_entrada.get() or "100")

            if self.dolar_diferenciado.get():
                config_especiais["dolar_diferenciado"]["ativo"] = True
                config_especiais["dolar_diferenciado"]["taxa_contratada"] = float(self.taxa_contratada.get() or "5.0")

            if self.st_entrada.get():
                config_especiais["substituicao_tributaria"]["st_entrada"]["ativo"] = True
                config_especiais["substituicao_tributaria"]["st_entrada"]["aliquota_st"] = float(
                    self.aliquota_st_entrada.get() or "0") / 100

            calcular_custos_unitarios(dados,
                        frete_embutido=self.frete_embutido.get(),
                        seguro_embutido=self.seguro_embutido.get(),
                        afrmm_manual=self.valor_afrmm.get(),
                        siscomex_manual=self.valor_siscomex.get(),
                        aliquota_icms_manual=self.aliquota_icms.get(),
                        # SEUS PARÂMETROS EXISTENTES
                        estado_destino=estado_codigo,
                        aplicar_incentivo=self.aplicar_incentivo.get(),
                        tipo_operacao=self.tipo_operacao.get(),
                        tem_similar_nacional=self.tem_similar_nacional.get(),
                        # NOVOS PARÂMETROS OPCIONAIS
                        configuracoes_especiais=config_especiais,
                        xml_path=self.xml_path.get())

            # Validar custos
            dados["validacao_custos"] = validar_custos(dados,
                                                     frete_embutido=self.frete_embutido.get(),
                                                     seguro_embutido=self.seguro_embutido.get())
            
            # Armazenar dados para precificação
            self.dados_processados = dados
            self.bt_precificacao.config(state="normal")
            
            # Gerar arquivo Excel
            excel_path = Path(self.excel_path.get())
            gera_excel_completo(dados, excel_path)
            
            # Estatísticas
            num_adicoes = len(dados.get('adicoes', []))
            total_itens = sum(len(ad.get('itens', [])) for ad in dados.get('adicoes', []))
            validacao = dados.get('validacao_custos', {})
            status_validacao = validacao.get('Status', 'N/A')
            diferenca_percent = validacao.get('% Diferença', 0)
            
            # Valores utilizados
            afrmm_usado = dados.get("configuracao_custos", {}).get("AFRMM R$", 0)
            siscomex_usado = dados.get("configuracao_custos", {}).get("Siscomex R$", 0)
            icms_total = dados["tributos"].get("ICMS R$", 0)
            aliquota_icms_usada = dados.get("configuracao_custos", {}).get("Alíquota ICMS (%)", 19)
            
            # PREPARAR CONFIGURAÇÕES ESPECIAIS
            config_especiais = CONFIGURACOES_ESPECIAIS_DEFAULT.copy()

            # Aplicar configurações básicas da interface
            if self.reducao_base_entrada.get():
                config_especiais["reducao_base_entrada"]["ativo"] = True
                config_especiais["reducao_base_entrada"]["percentual"] = float(self.percentual_reducao_entrada.get() or "100")

            if self.dolar_diferenciado.get():
                config_especiais["dolar_diferenciado"]["ativo"] = True
                config_especiais["dolar_diferenciado"]["taxa_contratada"] = float(self.taxa_contratada.get() or "5.0")

            if self.st_entrada.get():
                config_especiais["substituicao_tributaria"]["st_entrada"]["ativo"] = True
                config_especiais["substituicao_tributaria"]["st_entrada"]["aliquota_st"] = float(self.aliquota_st_entrada.get() or "0") / 100
            
            self.lbl.config(text=f"🎉 Extrato completo salvo: {excel_path.name}\n"
                               f"📊 {num_adicoes} adições, {total_itens} itens processados\n"
                               f"💰 AFRMM: R$ {afrmm_usado:,.2f} | SISCOMEX: R$ {siscomex_usado:,.2f}\n"
                               f"🏛️ ICMS ({aliquota_icms_usada:.0f}%): R$ {icms_total:,.2f}\n"
                               f"🔍 Validação: {status_validacao} (diferença: {diferenca_percent:.3f}%)\n"
                               f"💰 Módulo de Precificação disponível!",
                           foreground="green")
            
            # Mensagem de sucesso detalhada
            config_msg = ""
            if self.frete_embutido.get() or self.seguro_embutido.get():
                config_msg = f"\n🔧 Configuração aplicada:\n"
                config_msg += f"• Frete embutido: {'Sim' if self.frete_embutido.get() else 'Não'}\n"
                config_msg += f"• Seguro embutido: {'Sim' if self.seguro_embutido.get() else 'Não'}"
            
            messagebox.showinfo("Extrato Completo Gerado!",
                              f"🎉 Extrato completo gerado com sucesso!\n\n"
                              f"📁 Arquivo: {excel_path.name}\n"
                              f"📊 {num_adicoes} adições processadas\n"
                              f"🛍️ {total_itens} itens com custos detalhados\n"
                              f"💰 AFRMM utilizado: R$ {afrmm_usado:,.2f}\n"
                              f"📋 SISCOMEX utilizado: R$ {siscomex_usado:,.2f}\n"
                              f"🏛️ ICMS calculado ({aliquota_icms_usada:.0f}%): R$ {icms_total:,.2f}\n"
                              f"🔍 Validação: {status_validacao}\n"
                              f"📈 Diferença: {diferenca_percent:.4f}%"
                              f"{config_msg}\n\n"
                              f"✅ Funcionalidades implementadas:\n"
                              f"• Extração automática de despesas das inf. complementares\n"
                              f"• Entrada manual de valores não detectados\n"
                              f"• Cálculo correto do ICMS com alíquota configurável\n"
                              f"• Distribuição de todos os tributos por item individual\n"
                              f"• Planilhas expandidas com análise completa\n"
                              f"• NOVO: Módulo de precificação disponível!")
            
        except Exception as e:
            log.exception(e)
            messagebox.showerror("Erro", f"❌ Erro ao processar:\n{str(e)}")
            self.lbl.config(text=f"❌ Erro: {str(e)}", foreground="red")
        finally:
            self.bt_exec.config(state="normal")

if __name__ == "__main__":
=======
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import xml.etree.ElementTree as ET
import pandas as pd
from pathlib import Path
import logging
import re

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(message)s")
log = logging.getLogger("ExtratoDI")

# Dados das alíquotas de ICMS por estado (2025)
ALIQ_ICMS_ESTADOS = {
    "GO": {"nome": "Goiás", "aliquota": 0.19, "codigo": "GO"},
    "SC": {"nome": "Santa Catarina", "aliquota": 0.17, "codigo": "SC"},
    "ES": {"nome": "Espírito Santo", "aliquota": 0.17, "codigo": "ES"},
    "MG": {"nome": "Minas Gerais", "aliquota": 0.18, "codigo": "MG"},
    "SP": {"nome": "São Paulo", "aliquota": 0.18, "codigo": "SP"},
    "RJ": {"nome": "Rio de Janeiro", "aliquota": 0.18, "codigo": "RJ"},
    "RS": {"nome": "Rio Grande do Sul", "aliquota": 0.18, "codigo": "RS"},
    "PR": {"nome": "Paraná", "aliquota": 0.19, "codigo": "PR"},
    "BA": {"nome": "Bahia", "aliquota": 0.205, "codigo": "BA"},  # 18% + 2,5% FECP
    "PE": {"nome": "Pernambuco", "aliquota": 0.18, "codigo": "PE"},
}

# Dados dos incentivos fiscais por estado
INCENTIVOS_FISCAIS = {
    "GO": {
        "nome": "COMEXPRODUZIR",
        "descricao": "Crédito outorgado de 65% sobre o saldo devedor do ICMS nas operações interestaduais",
        "tipo": "credito_outorgado",
        "ativo": True,
        "condicoes": [
            "Desembaraço obrigatório no Porto Seco de Anápolis",
            "Trânsito físico obrigatório pelo estado de Goiás",
            "Perfil empresarial com 95% do faturamento em comércio exterior"
        ],
        "parametros": {
            "aliquota_interestadual": 0.04,
            "credito_outorgado_pct": 0.65,
            "aliquota_interna_reduzida": 0.04,
            "contrapartidas": {
                "FUNPRODUZIR": 0.05,  # 5% sobre o benefício
                "PROTEGE": 0.15       # 15% sobre o benefício
            }
        },
        "carga_efetiva_interestadual": 0.0192,  # 1,92%
        "carga_efetiva_interna": 0.04           # 4%
    },
    "SC": {
        "nome": "TTD 409",
        "descricao": "Tratamento Tributário Diferenciado com alíquotas efetivas reduzidas",
        "tipo": "aliquota_efetiva",
        "ativo": True,
        "condicoes": [
            "Desembaraço obrigatório em território catarinense",
            "Cumprimento de metas progressivas de faturamento",
            "Transição progressiva entre níveis de TTD"
        ],
        "parametros": {
            "aliquota_importacao_fase1": 0.026,  # 2,6% primeiros 36 meses
            "aliquota_importacao_fase2": 0.01,   # 1,0% após 36 meses
            "aliquota_interestadual_fase1": 0.026,
            "aliquota_interestadual_fase2": 0.01,
            "contrapartidas": {
                "Fundo_Educacao": 0.004  # 0,4% sobre operações
            }
        },
        "carga_efetiva_interestadual": 0.014,   # 1,4%
        "carga_efetiva_interna": 0.014
    },
    "ES": {
        "nome": "INVEST-ES Importação",
        "descricao": "Diferimento total do ICMS na importação + redução de 75% nas saídas para CD",
        "tipo": "diferimento_reducao",
        "ativo": True,
        "condicoes": [
            "Desembaraço obrigatório nos portos ou aeroportos do ES",
            "Implantação de Centro de Distribuição com área mínima de 1.000 m²",
            "Garantia financeira de 10% do benefício"
        ],
        "parametros": {
            "diferimento_importacao": True,
            "reducao_saida_pct": 0.75,
            "contrapartidas": {
                "Taxa_Administrativa": 0.005  # 0,5% sobre ICMS diferido
            }
        },
        "carga_efetiva_interestadual": 0.0434,  # 4,34%
        "carga_efetiva_interna": 0.0434
    },
    "MG": {
        "nome": "Corredor de Importação MG",
        "descricao": "Diferimento na importação + crédito presumido nas saídas",
        "tipo": "credito_presumido",
        "ativo": True,
        "condicoes": [
            "Desembaraço obrigatório em território mineiro",
            "Exclusão de produtos da lista negativa",
            "Cumprimento de obrigações acessórias específicas"
        ],
        "parametros": {
            "diferimento_importacao": True,
            "credito_presumido": {
                "com_similar": {"interestadual": 0.03, "interno": 0.06},      # 3% e 6%
                "sem_similar": {"interestadual": 0.025, "interno": 0.05}      # 2,5% e 5%
            }
        },
        "carga_efetiva_interestadual": 0.01,    # 1% (com similar)
        "carga_efetiva_interna": 0.12
    }
}

# EXPANSÃO DAS ESTRUTURAS EXISTENTES
CONFIGURACOES_ESPECIAIS = {
    "reducao_base_entrada": {
        "ativo": False,
        "percentual": 100.0,  # 100% = sem redução, 70% = redução para 70%
        "aplicacao": "DI",    # "DI", "adicao", "item"
        "adicoes_especificas": [],
        "itens_especificos": []
    },
    "reducao_base_saida": {
        "ativo": False,
        "percentual": 100.0,
        "aplicacao": "DI",
        "adicoes_especificas": [],
        "itens_especificos": []
    },
    "dolar_diferenciado": {
        "ativo": False,
        "taxa_contratada": 0.0,
        "taxa_di": 0.0,
        "aplicacao": "DI",
        "adicoes_especificas": {},  # {num_adicao: taxa_especifica}
        "itens_especificos": {}     # {seq_item: taxa_especifica}
    },
    "substituicao_tributaria": {
        "st_entrada": {
            "ativo": False,
            "aliquota_st": 0.0,
            "base_calculo_st": "valor_aduaneiro",  # ou "valor_operacao"
            "aplicacao": "DI",
            "adicoes_especificas": [],
            "itens_especificos": []
        },
        "st_saida": {
            "ativo": False,
            "aliquota_st": 0.0,
            "mva": 0.0,  # Margem de Valor Agregado
            "aplicacao": "DI",
            "adicoes_especificas": [],
            "itens_especificos": []
        }
    }
}

# Adicionar após o fechamento do dicionário CONFIGURACOES_ESPECIAIS (linha ~150)
CONFIGURACOES_ESPECIAIS_DEFAULT = {
    "reducao_base_entrada": {
        "ativo": False,
        "percentual": 100.0,
        "aplicacao": "DI",
        "adicoes_especificas": [],
        "itens_especificos": []
    },
    "reducao_base_saida": {
        "ativo": False,
        "percentual": 100.0,
        "aplicacao": "DI",
        "adicoes_especificas": [],
        "itens_especificos": []
    },
    "dolar_diferenciado": {
        "ativo": False,
        "taxa_contratada": 0.0,
        "taxa_di": 0.0,
        "aplicacao": "DI",
        "adicoes_especificas": {},
        "itens_especificos": {}
    },
    "substituicao_tributaria": {
        "st_entrada": {
            "ativo": False,
            "aliquota_st": 0.0,
            "base_calculo_st": "valor_aduaneiro",
            "aplicacao": "DI",
            "adicoes_especificas": [],
            "itens_especificos": []
        },
        "st_saida": {
            "ativo": False,
            "aliquota_st": 0.0,
            "mva": 0.0,
            "aplicacao": "DI",
            "adicoes_especificas": [],
            "itens_especificos": []
        }
    }
}

def parse_numeric_field(value, divisor=100):
    """Converte campos numéricos do XML que vêm com zeros à esquerda"""
    if not value:
        return 0.0
    try:
        clean_value = value.lstrip('0') or '0'
        return float(clean_value) / divisor
    except:
        return 0.0

    
def extrair_codigo_produto(descricao):
    """Extrai o código do produto da descrição"""
    if not descricao:
        return "N/A"
    parts = descricao.split(" - ")
    if len(parts) >= 2:
        return parts[0].strip()
    return "N/A"


def extrair_unidades_por_caixa(descricao):
    """Extrai quantidade de unidades por caixa da descrição"""
    if not descricao or "EM CX COM" not in descricao:
        return "N/A"
    try:
        parte = descricao.split("EM CX COM")[1].split("UNIDADES")[0].strip()
        return int(parte)
    except:
        return "N/A"

    
def extrair_despesas_informacao_complementar(texto):
    """Extrai despesas das informações complementares"""
    despesas = {
        "SISCOMEX R$": 0.0,
        "AFRMM R$": 0.0
    }
    
    if not texto:
        return despesas
    
    # SISCOMEX - padrão mais amplo
    siscomex_patterns = [
        r"SISCOMEX[^\d]*R\$?\s*([\d\.,]+)",
        r"TAXA DE UTILIZACAO DO SISCOMEX[^\d]*R\$?\s*([\d\.,]+)",
        r"UTILIZACAO DO SISCOMEX[^\d]*R\$?\s*([\d\.,]+)"
    ]
    
    for pattern in siscomex_patterns:
        match = re.search(pattern, texto, re.IGNORECASE)
        if match:
            try:
                valor = match.group(1).replace('.', '').replace(',', '.')
                despesas["SISCOMEX R$"] = float(valor)
                break
            except:
                continue
    
    # AFRMM - padrão mais amplo
    afrmm_patterns = [
        r"AFRMM[^\d]*R?\$?\s*([\d\.,]+)",
        r"A\.F\.R\.M\.M[^\d]*R?\$?\s*([\d\.,]+)"
    ]
    
    for pattern in afrmm_patterns:
        match = re.search(pattern, texto, re.IGNORECASE)
        if match:
            try:
                valor = match.group(1).replace('.', '').replace(',', '.')
                despesas["AFRMM R$"] = float(valor)
                break
            except:
                continue
    
    return despesas



def calcular_icms_importacao_avancado(valor_aduaneiro, ii, ipi, pis, cofins, outras_despesas,
                                      aliquota_icms=0.19, configuracoes_especiais=None):
    """
    Calcula ICMS considerando configurações especiais:
    - Redução de base de cálculo
    - Substituição tributária
    """
    config = configuracoes_especiais or {}

    # Base de cálculo padrão
    base_sem_icms = valor_aduaneiro + ii + ipi + pis + cofins + outras_despesas

    # 1. REDUÇÃO DE BASE DE CÁLCULO NA ENTRADA
    reducao_entrada = config.get("reducao_base_entrada", {})
    if reducao_entrada.get("ativo", False):
        percentual_base = reducao_entrada.get("percentual", 100.0) / 100
        base_sem_icms = base_sem_icms * percentual_base

    # 2. SUBSTITUIÇÃO TRIBUTÁRIA NA ENTRADA
    st_entrada = config.get("substituicao_tributaria", {}).get("st_entrada", {})
    if st_entrada.get("ativo", False):
        aliquota_st = st_entrada.get("aliquota_st", 0.0)

        # Cálculo do ICMS normal
        base_com_icms = base_sem_icms / (1 - aliquota_icms)
        icms_normal = base_com_icms - base_sem_icms

        # Cálculo do ICMS-ST
        # Base para ST = base normal + margem (se houver)
        base_st = base_com_icms
        icms_st = base_st * aliquota_st - icms_normal

        return {
            "icms_normal": icms_normal,
            "icms_st": max(0, icms_st),  # ST não pode ser negativo
            "icms_total": icms_normal + max(0, icms_st),
            "base_calculo": base_com_icms,
            "base_calculo_st": base_st,
            "substituicao_tributaria": True
        }

    # 3. CÁLCULO NORMAL (sem ST)
    base_com_icms = base_sem_icms / (1 - aliquota_icms)
    icms = base_com_icms - base_sem_icms

    return {
        "icms_normal": icms,
        "icms_st": 0.0,
        "icms_total": icms,
        "base_calculo": base_com_icms,
        "base_calculo_st": 0.0,
        "substituicao_tributaria": False
    }

    
def aplicar_dolar_diferenciado(valor_usd, dados_adicao, config_dolar):
    """Aplica taxa de câmbio diferenciada conforme configuração"""
    if not config_dolar.get("ativo", False):
        return valor_usd * config_dolar.get("taxa_di", 5.0)  # taxa padrão da DI

    aplicacao = config_dolar.get("aplicacao", "DI")
    num_adicao = dados_adicao.get("numero", "")

    if aplicacao == "adicao" and num_adicao in config_dolar.get("adicoes_especificas", {}):
        taxa_especifica = config_dolar["adicoes_especificas"][num_adicao]
        return valor_usd * taxa_especifica

    # Taxa contratada (diferente da DI)
    taxa_contratada = config_dolar.get("taxa_contratada", config_dolar.get("taxa_di", 5.0))
    return valor_usd * taxa_contratada


def verificar_aplicacao_configuracao(config, nivel, identificador=""):
    """
    Verifica se uma configuração especial se aplica ao nível especificado

    Args:
        config: configuração específica
        nivel: "DI", "adicao", "item"
        identificador: número da adição ou sequência do item

    Returns:
        bool: True se a configuração se aplica
    """
    if not config.get("ativo", False):
        return False

    aplicacao = config.get("aplicacao", "DI")

    if aplicacao == "DI":
        return True
    elif aplicacao == "adicao" and nivel == "adicao":
        adicoes_especificas = config.get("adicoes_especificas", [])
        return not adicoes_especificas or identificador in adicoes_especificas
    elif aplicacao == "item" and nivel == "item":
        itens_especificos = config.get("itens_especificos", [])
        return not itens_especificos or identificador in itens_especificos

    return False


def obter_estados_disponiveis():
    """Retorna lista de estados disponíveis"""
    return [(codigo, dados["nome"]) for codigo, dados in ALIQ_ICMS_ESTADOS.items()]


def obter_aliquota_icms_estado(estado_codigo):
    """Obtém alíquota de ICMS do estado"""
    estado_data = ALIQ_ICMS_ESTADOS.get(estado_codigo.upper())
    return estado_data["aliquota"] if estado_data else 0.19  # Default 19%


def obter_incentivos_por_estado(estado_codigo):
    """Obtém incentivos fiscais disponíveis para o estado"""
    return INCENTIVOS_FISCAIS.get(estado_codigo.upper(), None)


def calcular_icms_com_incentivo(valor_base, estado_codigo, tipo_operacao="interestadual", tem_similar_nacional=True):
    """
    Calcula ICMS considerando incentivos fiscais específicos do estado

    Args:
        valor_base: Valor base para cálculo
        estado_codigo: Código do estado (GO, SC, ES, MG)
        tipo_operacao: "interestadual" ou "interno"
        tem_similar_nacional: True se produto tem similar nacional

    Returns:
        dict com detalhes do cálculo
    """
    incentivo = obter_incentivos_por_estado(estado_codigo)
    aliquota_normal = obter_aliquota_icms_estado(estado_codigo)

    if not incentivo or not incentivo["ativo"]:
        # Sem incentivo - cálculo normal
        if tipo_operacao == "interestadual":
            aliquota_final = 0.04 if tem_similar_nacional else 0.12
        else:
            aliquota_final = aliquota_normal

        icms_devido = valor_base * aliquota_final
        return {
            "icms_nominal": icms_devido,
            "icms_devido": icms_devido,
            "beneficio": 0,
            "contrapartidas": 0,
            "carga_efetiva": aliquota_final,
            "incentivo_aplicado": "Nenhum"
        }

    # Com incentivo fiscal
    if estado_codigo == "GO":  # COMEXPRODUZIR
        return _calcular_icms_goias(valor_base, incentivo, tipo_operacao)

    elif estado_codigo == "SC":  # TTD 409
        return _calcular_icms_santa_catarina(valor_base, incentivo, tipo_operacao)

    elif estado_codigo == "ES":  # INVEST-ES
        return _calcular_icms_espirito_santo(valor_base, incentivo, tipo_operacao)

    elif estado_codigo == "MG":  # Corredor de Importação
        return _calcular_icms_minas_gerais(valor_base, incentivo, tipo_operacao, tem_similar_nacional)

    else:
        # Fallback para cálculo normal
        return calcular_icms_com_incentivo(valor_base, estado_codigo, tipo_operacao, tem_similar_nacional)

    
def _calcular_icms_goias(valor_base, incentivo, tipo_operacao):
    """Cálculo específico para COMEXPRODUZIR - Goiás"""
    params = incentivo["parametros"]

    if tipo_operacao == "interestadual":
        # Operação interestadual com crédito outorgado
        aliquota = params["aliquota_interestadual"]  # 4%
        icms_nominal = valor_base * aliquota
        credito_outorgado = icms_nominal * params["credito_outorgado_pct"]  # 65%

        # Contrapartidas sobre o benefício
        contrib_funproduzir = credito_outorgado * params["contrapartidas"]["FUNPRODUZIR"]
        contrib_protege = credito_outorgado * params["contrapartidas"]["PROTEGE"]
        contrapartidas_total = contrib_funproduzir + contrib_protege

        icms_devido = icms_nominal - credito_outorgado + contrapartidas_total

        return {
            "icms_nominal": icms_nominal,
            "icms_devido": icms_devido,
            "beneficio": credito_outorgado,
            "contrapartidas": contrapartidas_total,
            "detalhes_contrapartidas": {
                "FUNPRODUZIR": contrib_funproduzir,
                "PROTEGE": contrib_protege
            },
            "carga_efetiva": icms_devido / valor_base,
            "incentivo_aplicado": "COMEXPRODUZIR - Crédito Outorgado 65%"
        }

    else:  # Operação interna
        # Alíquota reduzida para 4%
        aliquota_reduzida = params["aliquota_interna_reduzida"]
        icms_devido = valor_base * aliquota_reduzida
        icms_nominal = valor_base * 0.19  # Alíquota normal de Goiás

        return {
            "icms_nominal": icms_nominal,
            "icms_devido": icms_devido,
            "beneficio": icms_nominal - icms_devido,
            "contrapartidas": 0,
            "carga_efetiva": aliquota_reduzida,
            "incentivo_aplicado": "COMEXPRODUZIR - Alíquota Reduzida 4%"
        }

        
def _calcular_icms_santa_catarina(valor_base, incentivo, tipo_operacao):
    """Cálculo específico para TTD 409 - Santa Catarina"""
    params = incentivo["parametros"]

    # Para simplificação, usar Fase 2 (após 36 meses) - 1,0%
    aliquota_efetiva = params["aliquota_interestadual_fase2"]  # 1,0%
    icms_devido = valor_base * aliquota_efetiva

    # Contribuição ao Fundo de Educação
    contrib_fundo = valor_base * params["contrapartidas"]["Fundo_Educacao"]

    icms_total = icms_devido + contrib_fundo
    icms_nominal = valor_base * 0.17  # Alíquota normal SC

    return {
        "icms_nominal": icms_nominal,
        "icms_devido": icms_total,
        "beneficio": icms_nominal - icms_devido,
        "contrapartidas": contrib_fundo,
        "detalhes_contrapartidas": {
            "Fundo_Educacao": contrib_fundo
        },
        "carga_efetiva": icms_total / valor_base,
        "incentivo_aplicado": "TTD 409 - Fase 2 (1,0%)"
    }

    
def _calcular_icms_espirito_santo(valor_base, incentivo, tipo_operacao):
    """Cálculo específico para INVEST-ES - Espírito Santo"""
    params = incentivo["parametros"]

    # ICMS diferido na importação, recolhido na saída com redução de 75%
    icms_nominal = valor_base * 0.17  # Alíquota normal ES
    reducao = icms_nominal * params["reducao_saida_pct"]  # 75% de redução
    taxa_admin = icms_nominal * params["contrapartidas"]["Taxa_Administrativa"]  # 0,5%

    icms_devido = icms_nominal - reducao + taxa_admin

    return {
        "icms_nominal": icms_nominal,
        "icms_devido": icms_devido,
        "beneficio": reducao,
        "contrapartidas": taxa_admin,
        "detalhes_contrapartidas": {
            "Taxa_Administrativa": taxa_admin
        },
        "carga_efetiva": icms_devido / valor_base,
        "incentivo_aplicado": "INVEST-ES - Redução 75%"
    }

    
def _calcular_icms_minas_gerais(valor_base, incentivo, tipo_operacao, tem_similar_nacional):
    """Cálculo específico para Corredor de Importação - Minas Gerais"""
    params = incentivo["parametros"]
    creditos = params["credito_presumido"]

    if tipo_operacao == "interestadual":
        if tem_similar_nacional:
            aliquota_operacao = 0.04  # 4% interestadual com similar
            credito_pct = creditos["com_similar"]["interestadual"]  # 3%
        else:
            aliquota_operacao = 0.12  # 12% interestadual sem similar
            credito_pct = creditos["sem_similar"]["interestadual"]  # 2,5%

        icms_nominal = valor_base * aliquota_operacao
        credito_presumido = valor_base * credito_pct
        icms_devido = icms_nominal - credito_presumido

        return {
            "icms_nominal": icms_nominal,
            "icms_devido": icms_devido,
            "beneficio": credito_presumido,
            "contrapartidas": 0,
            "carga_efetiva": icms_devido / valor_base,
            "incentivo_aplicado": f"Corredor MG - Crédito {credito_pct*100}%"
        }

    else:  # Operação interna
        # Para operações internas, o benefício é menor
        aliquota_operacao = 0.18  # Alíquota normal MG
        if tem_similar_nacional:
            credito_pct = creditos["com_similar"]["interno"]  # 6%
        else:
            credito_pct = creditos["sem_similar"]["interno"]   # 5%

        icms_nominal = valor_base * aliquota_operacao
        credito_presumido = valor_base * credito_pct
        icms_devido = icms_nominal - credito_presumido

        return {
            "icms_nominal": icms_nominal,
            "icms_devido": icms_devido,
            "beneficio": credito_presumido,
            "contrapartidas": 0,
            "carga_efetiva": icms_devido / valor_base,
            "incentivo_aplicado": f"Corredor MG - Crédito Interno {credito_pct*100}%"
        }

        
def calcular_creditos_tributarios(custo_item_data, regime_tributario="real"):
    """
    Calcula os créditos tributários disponíveis para cada item
    
    Args:
        custo_item_data: dict com dados de custos do item
        regime_tributario: "real" ou "presumido"
    
    Returns:
        dict com créditos disponíveis e custo ajustado
    """
    creditos = {
        "ICMS Crédito": 0.0,
        "IPI Crédito": 0.0,
        "PIS Crédito": 0.0,
        "COFINS Crédito": 0.0,
        "Total Créditos": 0.0
    }
    
    # ICMS da importação sempre gera crédito
    creditos["ICMS Crédito"] = custo_item_data.get("ICMS Incorporado R$", 0)
    
    # IPI da importação gera crédito para empresas industriais
    creditos["IPI Crédito"] = custo_item_data.get("IPI R$", 0)
    
    # PIS/COFINS: só gera crédito no regime real
    if regime_tributario == "real":
        creditos["PIS Crédito"] = custo_item_data.get("PIS R$", 0)
        creditos["COFINS Crédito"] = custo_item_data.get("COFINS R$", 0)
    
    creditos["Total Créditos"] = sum([
        creditos["ICMS Crédito"],
        creditos["IPI Crédito"], 
        creditos["PIS Crédito"],
        creditos["COFINS Crédito"]
    ])
    
    # Custo líquido = custo total - créditos disponíveis
    custo_bruto = custo_item_data.get("Custo Total Item R$", 0)
    custo_liquido = custo_bruto - creditos["Total Créditos"]
    
    return creditos, custo_liquido


def calcular_preco_venda(custo_liquido, margem_desejada, aliq_icms=0.19, aliq_ipi_entrada=0.0, 
                        aliq_pis=0.0165, aliq_cofins=0.076, regime="real"):
    """
    Calcula preço de venda considerando impostos por dentro e por fora
    
    Args:
        custo_liquido: custo após deduzir créditos
        margem_desejada: margem desejada (ex: 0.30 para 30%)
        aliq_icms, aliq_pis, aliq_cofins: alíquotas dos impostos por dentro
        aliq_ipi_entrada: alíquota do IPI da entrada (será a mesma da venda)
        regime: "real" ou "presumido"
    
    Returns:
        dict com breakdown completo do preço
    """
    
    # Ajustar alíquotas conforme regime
    if regime == "presumido":
        # No presumido, PIS/COFINS têm alíquotas menores
        aliq_pis = 0.0065  # 0,65%
        aliq_cofins = 0.03  # 3%
    
    # O IPI da venda é o mesmo da entrada
    aliq_ipi = aliq_ipi_entrada
    
    # Impostos "por dentro" (não incluem IPI)
    impostos_por_dentro = aliq_icms + aliq_pis + aliq_cofins
    
    # Preço base (antes do IPI)
    # Fórmula: P = (Custo + Margem) / (1 - Impostos%)
    valor_desejado = custo_liquido * (1 + margem_desejada)
    preco_base = valor_desejado / (1 - impostos_por_dentro)
    
    # Calcular valores dos impostos por dentro
    icms_venda = preco_base * aliq_icms
    pis_venda = preco_base * aliq_pis
    cofins_venda = preco_base * aliq_cofins
    
    # IPI é "por fora" - calculado sobre o preço base
    ipi_venda = preco_base * aliq_ipi
    preco_final = preco_base + ipi_venda
    
    # Verificação: margem real obtida
    impostos_totais = icms_venda + pis_venda + cofins_venda + ipi_venda
    margem_real = (preco_final - custo_liquido - impostos_totais) / custo_liquido
    
    return {
        "Custo Líquido R$": custo_liquido,
        "Margem Desejada (%)": margem_desejada * 100,
        "Preço Base R$": preco_base,
        "ICMS Venda R$": icms_venda,
        "PIS Venda R$": pis_venda,
        "COFINS Venda R$": cofins_venda,
        "IPI Venda R$": ipi_venda,
        "IPI Alíq. Venda (%)": aliq_ipi * 100,
        "Total Impostos Venda R$": impostos_totais,
        "Preço Final R$": preco_final,
        "Margem Real (%)": margem_real * 100,
        "Regime Tributário": regime.title()
    }


def extrair_taxa_cambio_di(xml_path):
    """Extrai a taxa de câmbio da DI do XML"""
    try:
        tree = ET.parse(xml_path)
        root = tree.getroot()
        di = root.find("declaracaoImportacao")

        if di is not None:
            # Tentar extrair da primeira adição
            primeira_adicao = di.find("adicao")
            if primeira_adicao is not None:
                vcmv_usd = parse_numeric_field(primeira_adicao.findtext("condicaoVendaValorMoeda", "0"))
                vcmv_brl = parse_numeric_field(primeira_adicao.findtext("condicaoVendaValorReais", "0"))

                if vcmv_usd > 0 and vcmv_brl > 0:
                    return vcmv_brl / vcmv_usd

        # Taxa padrão se não conseguir extrair
        return 5.0

    except Exception:
        return 5.0


def calcular_custos_unitarios(dados, frete_embutido=False, seguro_embutido=False,
                              afrmm_manual="", siscomex_manual="", aliquota_icms_manual="19",
                              # NOVOS PARÂMETROS PARA RESOLVER O ERRO
                              estado_destino=None, aplicar_incentivo=False,
                              tipo_operacao="interestadual", tem_similar_nacional=True,
                              configuracoes_especiais=None, xml_path=None):
    """
    VERSÃO COMPLETA E CORRIGIDA - Calcula custos unitários com incentivos fiscais

    PARÂMETROS BÁSICOS (existiam antes):
    - dados: dados da DI processados
    - frete_embutido, seguro_embutido: configurações de custos
    - afrmm_manual, siscomex_manual: valores manuais de despesas
    - aliquota_icms_manual: alíquota de ICMS para cálculo

    NOVOS PARÂMETROS (que estavam faltando):
    - estado_destino: código do estado de destino para incentivos
    - aplicar_incentivo: se deve aplicar incentivos fiscais
    - tipo_operacao: "interestadual" ou "interna"
    - tem_similar_nacional: se produto tem similar nacional
    - configuracoes_especiais: configurações avançadas
    - xml_path: caminho do XML para detecção automática
    """

    # Aplicar configurações padrão se não fornecidas
    config_especiais = configuracoes_especiais or CONFIGURACOES_ESPECIAIS_DEFAULT.copy()

    log.info("=== INICIANDO CÁLCULO DE CUSTOS EXPANDIDO E COMPATÍVEL ===")

    # DETECTAR TAXA DE CÂMBIO DA DI SE CONFIGURADO DÓLAR DIFERENCIADO
    if config_especiais.get("dolar_diferenciado", {}).get("ativo", False) and xml_path:
        taxa_di_detectada = extrair_taxa_cambio_di(xml_path)
        config_especiais["dolar_diferenciado"]["taxa_di"] = taxa_di_detectada

    # EXTRAIR TOTAIS DA DI
    valor_total_di = dados["valores"]["FOB R$"]
    frete_total = dados["valores"]["Frete R$"] if not frete_embutido else 0.0
    seguro_total = dados.get("valores", {}).get("Seguro R$", 0.0) if not seguro_embutido else 0.0

    # AFRMM - prioridade: XML > Info Complementar > Manual > 0
    afrmm_total = dados.get("valores", {}).get("AFRMM R$", 0.0)
    if afrmm_total == 0.0 and dados.get("despesas_complementares", {}).get("AFRMM R$", 0.0) > 0:
        afrmm_total = dados["despesas_complementares"]["AFRMM R$"]
    if afrmm_total == 0.0 and afrmm_manual:
        try:
            afrmm_total = float(afrmm_manual.replace(",", "."))
        except:
            afrmm_total = 0.0

    # SISCOMEX - prioridade: XML > Info Complementar > Manual > 0
    siscomex_total = dados.get("valores", {}).get("Siscomex R$", 0.0)
    if siscomex_total == 0.0 and dados.get("despesas_complementares", {}).get("SISCOMEX R$", 0.0) > 0:
        siscomex_total = dados["despesas_complementares"]["SISCOMEX R$"]
    if siscomex_total == 0.0 and siscomex_manual:
        try:
            siscomex_total = float(siscomex_manual.replace(",", "."))
        except:
            siscomex_total = 0.0

    # Alíquota ICMS
    try:
        aliquota_icms = float(aliquota_icms_manual.replace(",", ".")) / 100
    except:
        aliquota_icms = 0.19  # 19% padrão

    # APLICAR INCENTIVOS FISCAIS SE SOLICITADO
    valor_aduaneiro_total = dados["valores"]["Valor Aduaneiro R$"]
    ii_total = dados["tributos"]["II R$"]
    ipi_total = dados["tributos"]["IPI R$"]
    pis_total = dados["tributos"]["PIS R$"]
    cofins_total = dados["tributos"]["COFINS R$"]
    outras_despesas_total = afrmm_total + siscomex_total

    if aplicar_incentivo and estado_destino:
        log.info(
            f"Aplicando incentivos fiscais para {estado_destino} - {tipo_operacao} - Similar Nacional: {tem_similar_nacional}")

        # Calcular ICMS com incentivo fiscal
        resultado_incentivo = calcular_icms_com_incentivo(
            valor_aduaneiro_total, estado_destino, tipo_operacao, tem_similar_nacional
        )

        # Atualizar dados com resultado do incentivo
        dados["incentivo_fiscal"] = {
            "Estado": estado_destino,
            "Programa": resultado_incentivo["incentivo_aplicado"],
            "Tipo Operação": tipo_operacao,
            "Similar Nacional": "Sim" if tem_similar_nacional else "Não",
            "ICMS Nominal R$": resultado_incentivo["icms_nominal"],
            "ICMS Devido R$": resultado_incentivo["icms_devido"],
            "Benefício R$": resultado_incentivo["beneficio"],
            "Contrapartidas R$": resultado_incentivo["contrapartidas"],
            "Carga Efetiva (%)": resultado_incentivo["carga_efetiva"] * 100
        }

        # Usar ICMS com incentivo para o cálculo de custos
        icms_total = resultado_incentivo["icms_devido"]

        # Simular resultado_icms para compatibilidade
        resultado_icms = {
            "icms_normal": icms_total,
            "icms_st": 0.0,
            "icms_total": icms_total,
            "base_calculo": valor_aduaneiro_total + ii_total + ipi_total + pis_total + cofins_total + outras_despesas_total,
            "base_calculo_st": 0.0,
            "substituicao_tributaria": False
        }

        log.info(f"✅ Incentivo aplicado: {resultado_incentivo['incentivo_aplicado']}")
        log.info(f"💰 ICMS com incentivo: R$ {icms_total:,.2f} (era R$ {resultado_incentivo['icms_nominal']:,.2f})")
    else:
        # Usar função avançada de cálculo de ICMS sem incentivo
        resultado_icms = calcular_icms_importacao_avancado(
            valor_aduaneiro_total, ii_total, ipi_total, pis_total, cofins_total,
            outras_despesas_total, aliquota_icms, config_especiais
        )
        icms_total = resultado_icms["icms_total"]
        dados["incentivo_fiscal"] = None
        log.info("⭕ Sem incentivos fiscais aplicados")

    # Adicionar ICMS aos tributos
    dados["tributos"]["ICMS R$"] = resultado_icms["icms_normal"]
    dados["tributos"]["ICMS-ST R$"] = resultado_icms["icms_st"]
    dados["tributos"]["ICMS Total R$"] = icms_total
    dados["tributos"]["Base ICMS R$"] = resultado_icms["base_calculo"]

    if resultado_icms["substituicao_tributaria"]:
        dados["tributos"]["Base ICMS-ST R$"] = resultado_icms["base_calculo_st"]

    # CONFIGURAÇÃO DE BASE DE CÁLCULO
    if frete_embutido or seguro_embutido:
        valor_base_calculo = dados["valores"]["Valor Aduaneiro R$"]
    else:
        valor_base_calculo = valor_total_di

    # INFORMAÇÕES SOBRE CONFIGURAÇÃO DE CUSTOS
    dados["configuracao_custos"] = {
        "Frete Embutido": "Sim" if frete_embutido else "Não",
        "Seguro Embutido": "Sim" if seguro_embutido else "Não",
        "Base de Cálculo": "Valor Aduaneiro" if (frete_embutido or seguro_embutido) else "FOB",
        "Valor Base R$": valor_base_calculo,
        "Frete Considerado R$": frete_total,
        "Seguro Considerado R$": seguro_total,
        "AFRMM R$": afrmm_total,
        "Siscomex R$": siscomex_total,
        "ICMS Normal R$": resultado_icms["icms_normal"],
        "ICMS-ST R$": resultado_icms["icms_st"],
        "ICMS Total R$": icms_total,
        "Alíquota ICMS (%)": aliquota_icms * 100,
        "Substituição Tributária": "Sim" if resultado_icms["substituicao_tributaria"] else "Não",
        "Incentivo Fiscal": "Sim" if dados["incentivo_fiscal"] else "Não",
        "Configurações Especiais Ativas": [
            k for k, v in config_especiais.items()
            if isinstance(v, dict) and v.get("ativo", False)
        ]
    }

    # PROCESSAR CADA ADIÇÃO COM CONFIGURAÇÕES ESPECIAIS
    valor_total_ajustado = 0.0

    for adicao in dados["adicoes"]:
        valor_adicao_original = adicao["dados_gerais"]["VCMV R$"]

        # APLICAR DÓLAR DIFERENCIADO (se configurado)
        config_dolar = config_especiais.get("dolar_diferenciado", {})
        if verificar_aplicacao_configuracao(config_dolar, "adicao", adicao["numero"]):
            valor_usd = adicao["dados_gerais"]["VCMV USD"]
            valor_adicao_ajustado = aplicar_dolar_diferenciado(valor_usd, adicao, config_dolar)

            # Registrar ajuste
            adicao["dados_gerais"]["VCMV R$ (Original)"] = valor_adicao_original
            adicao["dados_gerais"]["VCMV R$ (Ajustado)"] = valor_adicao_ajustado
            adicao["dados_gerais"]["Taxa Câmbio DI"] = config_dolar.get("taxa_di", 5.0)
            adicao["dados_gerais"]["Taxa Câmbio Utilizada"] = valor_adicao_ajustado / valor_usd if valor_usd > 0 else 0
            adicao["dados_gerais"]["Diferença Cambial R$"] = valor_adicao_ajustado - valor_adicao_original
            valor_adicao = valor_adicao_ajustado
        else:
            valor_adicao = valor_adicao_original

        valor_total_ajustado += valor_adicao

        # Calcular percentual da adição sobre a base
        if valor_base_calculo > 0:
            base_para_percentual = valor_total_ajustado if valor_total_ajustado > 0 else valor_base_calculo
            percentual_adicao = valor_adicao / base_para_percentual
        else:
            percentual_adicao = 0

        # Ratear custos proporcionais
        custo_frete_adicao = percentual_adicao * frete_total
        custo_seguro_adicao = percentual_adicao * seguro_total
        custo_afrmm_adicao = percentual_adicao * afrmm_total
        custo_siscomex_adicao = percentual_adicao * siscomex_total

        # Impostos incorporáveis
        ii_adicao = adicao["tributos"]["II R$"]
        ipi_adicao = adicao["tributos"]["IPI R$"]
        pis_adicao = adicao["tributos"]["PIS R$"]
        cofins_adicao = adicao["tributos"]["COFINS R$"]
        icms_adicao = percentual_adicao * icms_total

        # Cálculo com ST se aplicável
        if resultado_icms["substituicao_tributaria"]:
            icms_st_adicao = percentual_adicao * resultado_icms["icms_st"]
            custo_total_adicao = (
                    valor_adicao + custo_frete_adicao + custo_seguro_adicao +
                    custo_afrmm_adicao + custo_siscomex_adicao + ii_adicao + icms_adicao + icms_st_adicao
            )
        else:
            icms_st_adicao = 0.0
            custo_total_adicao = (
                    valor_adicao + custo_frete_adicao + custo_seguro_adicao +
                    custo_afrmm_adicao + custo_siscomex_adicao + ii_adicao + icms_adicao
            )

        # Adicionar dados de custo à adição
        adicao["custos"] = {
            "Valor Mercadoria R$": valor_adicao,
            "Valor Original R$": valor_adicao_original,
            "Ajuste Cambial R$": valor_adicao - valor_adicao_original,
            "Frete Rateado R$": custo_frete_adicao,
            "Seguro Rateado R$": custo_seguro_adicao,
            "AFRMM Rateado R$": custo_afrmm_adicao,
            "Siscomex Rateado R$": custo_siscomex_adicao,
            "II Incorporado R$": ii_adicao,
            "IPI R$": ipi_adicao,
            "PIS R$": pis_adicao,
            "COFINS R$": cofins_adicao,
            "ICMS Incorporado R$": icms_adicao,
            "ICMS-ST Incorporado R$": icms_st_adicao,
            "Custo Total Adição R$": custo_total_adicao,
            "% Participação": percentual_adicao * 100,
            "Observações": f"Base: {'Valor Aduaneiro' if (frete_embutido or seguro_embutido) else 'FOB'}; ST: {'Sim' if resultado_icms['substituicao_tributaria'] else 'Não'}"
        }

        # Calcular custo unitário para cada item
        if adicao["itens"]:
            qtd_total_adicao = sum(item["Qtd"] for item in adicao["itens"])

            for item in adicao["itens"]:
                if qtd_total_adicao > 0:
                    proporcao_item = item["Qtd"] / qtd_total_adicao

                    # Distribuir todos os custos proporcionalmente por item
                    item["Custo Mercadoria R$"] = valor_adicao * proporcao_item
                    item["Ajuste Cambial R$"] = (valor_adicao - valor_adicao_original) * proporcao_item
                    item["Frete Rateado R$"] = custo_frete_adicao * proporcao_item
                    item["Seguro Rateado R$"] = custo_seguro_adicao * proporcao_item
                    item["AFRMM Rateado R$"] = custo_afrmm_adicao * proporcao_item
                    item["Siscomex Rateado R$"] = custo_siscomex_adicao * proporcao_item
                    item["II Incorporado R$"] = ii_adicao * proporcao_item
                    item["IPI R$"] = ipi_adicao * proporcao_item
                    item["PIS R$"] = pis_adicao * proporcao_item
                    item["COFINS R$"] = cofins_adicao * proporcao_item
                    item["ICMS Incorporado R$"] = icms_adicao * proporcao_item
                    item["ICMS-ST Incorporado R$"] = icms_st_adicao * proporcao_item

                    custo_total_item = custo_total_adicao * proporcao_item
                    item["Custo Total Item R$"] = custo_total_item

                    # CUSTO UNITÁRIO
                    if item["Qtd"] > 0:
                        custo_por_unidade = custo_total_item / item["Qtd"]
                        item["Custo Unitário R$"] = custo_por_unidade
                    else:
                        item["Custo Unitário R$"] = 0

                    # CUSTO POR PEÇA
                    unid_caixa = item.get("Unid/Caixa", "N/A")
                    if isinstance(unid_caixa, int) and unid_caixa > 0:
                        custo_por_peca = custo_total_item / (item["Qtd"] * unid_caixa)
                        item["Custo por Peça R$"] = custo_por_peca
                    else:
                        item["Custo por Peça R$"] = "N/A"

                    # Verificar configurações específicas por item
                    seq_item = item["Seq"]
                    item["Configurações Aplicadas"] = []
                    for config_nome in ["reducao_base_entrada", "reducao_base_saida"]:
                        config_item = config_especiais.get(config_nome, {})
                        if verificar_aplicacao_configuracao(config_item, "item", seq_item):
                            item["Configurações Aplicadas"].append(config_nome)

                    # Configurações ST
                    for st_tipo in ["st_entrada", "st_saida"]:
                        config_st = config_especiais.get("substituicao_tributaria", {}).get(st_tipo, {})
                        if verificar_aplicacao_configuracao(config_st, "item", seq_item):
                            item["Configurações Aplicadas"].append(f"ST_{st_tipo}")
                else:
                    # Zerar custos se não houver quantidade
                    campos_zero = [
                        "Custo Mercadoria R$", "Ajuste Cambial R$", "Frete Rateado R$", "Seguro Rateado R$",
                        "AFRMM Rateado R$", "Siscomex Rateado R$", "II Incorporado R$",
                        "IPI R$", "PIS R$", "COFINS R$", "ICMS Incorporado R$", "ICMS-ST Incorporado R$",
                        "Custo Total Item R$", "Custo Unitário R$"
                    ]
                    for campo in campos_zero:
                        item[campo] = 0
                    item["Custo por Peça R$"] = 0
                    item["Configurações Aplicadas"] = []

    # LOGS DE RESUMO
    log.info("=== RESUMO DAS CONFIGURAÇÕES APLICADAS ===")
    for config_nome, config_data in config_especiais.items():
        if isinstance(config_data, dict) and config_data.get("ativo", False):
            log.info(f"✅ {config_nome.upper()}: ATIVO")
        else:
            log.info(f"⭕ {config_nome}: Inativo")

    log.info("=== CÁLCULO DE CUSTOS COMPLETO FINALIZADO ===")

def validar_custos(dados, frete_embutido=False, seguro_embutido=False):
    """Valida se os custos calculados estão coerentes com os totais da DI"""
    
    # Somar custos de todas as adições
    custo_total_calculado = sum(
        adicao.get("custos", {}).get("Custo Total Adição R$", 0)
        for adicao in dados["adicoes"]
    )
    
    # Valor esperado baseado na configuração
    if frete_embutido or seguro_embutido:
        valor_esperado = dados["valores"]["Valor Aduaneiro R$"]
        if not frete_embutido:
            valor_esperado += dados["valores"]["Frete R$"]
        if not seguro_embutido:
            valor_esperado += dados.get("valores", {}).get("Seguro R$", 0)
    else:
        valor_esperado = (
            dados["valores"]["FOB R$"] +
            dados["valores"]["Frete R$"] +
            dados.get("valores", {}).get("Seguro R$", 0)
        )
    
    # Adicionar despesas extras e impostos (incluindo ICMS)
    valor_esperado += (
        dados.get("configuracao_custos", {}).get("AFRMM R$", 0) +
        dados.get("configuracao_custos", {}).get("Siscomex R$", 0) +
        dados["tributos"]["II R$"] +
        dados["tributos"].get("ICMS R$", 0)
    )
    
    diferenca = abs(custo_total_calculado - valor_esperado)
    percentual_diferenca = (diferenca / valor_esperado * 100) if valor_esperado > 0 else 0
    
    validacao = {
        "Custo Total Calculado": custo_total_calculado,
        "Valor Esperado": valor_esperado,
        "Diferença": diferenca,
        "% Diferença": percentual_diferenca,
        "Status": "OK" if percentual_diferenca < 0.01 else "DIVERGÊNCIA",
        "Configuração": f"Frete: {'Embutido' if frete_embutido else 'Separado'}, Seguro: {'Embutido' if seguro_embutido else 'Separado'}"
    }
    
    return validacao


def carrega_di_completo(xml_path: Path) -> dict:
    """Carrega o XML da DI com dados completos para cada adição"""
    tree = ET.parse(xml_path)
    root = tree.getroot()
    di = root.find("declaracaoImportacao")
    
    if di is None:
        raise ValueError("Elemento declaracaoImportacao não encontrado no XML")
    
    get = di.findtext
    
    # Processar informações complementares
    info_complementar_raw = get("informacaoComplementar", "").strip() or "—"
    despesas_complementares = extrair_despesas_informacao_complementar(info_complementar_raw)
    
    dados = {
        "cabecalho": {
            "DI": get("numeroDI") or "N/A",
            "Data registro": get("dataRegistro") or "N/A",
            "URF despacho": get("urfDespachoNome") or "N/A",
            "Modalidade": get("modalidadeDespachoNome") or "N/A",
            "Qtd. adições": int(get("totalAdicoes", "0")),
            "Situação": get("situacaoEntregaCarga") or "N/A",
        },
        "importador": {
            "CNPJ": get("importadorNumero") or "N/A",
            "Nome": get("importadorNome") or "N/A",
            "Representante": get("importadorNomeRepresentanteLegal") or "N/A",
            "CPF repr.": get("importadorCpfRepresentanteLegal") or "N/A",
            "Endereço": ", ".join(filter(None, [
                get("importadorEnderecoLogradouro", ""),
                get("importadorEnderecoNumero", ""),
                get("importadorEnderecoBairro", ""),
                get("importadorEnderecoMunicipio", ""),
                get("importadorEnderecoUf", ""),
                get("importadorEnderecoCep", "")
            ])) or "N/A",
        },
        "carga": {
            "Manifesto": f"{get('documentoChegadaCargaNome', 'N/A')} {get('documentoChegadaCargaNumero', '')}".strip(),
            "Recinto": get("armazenamentoRecintoAduaneiroNome") or "N/A",
            "Armazém": (get("armazem") or "").strip() or "N/A",
            "Peso bruto (kg)": parse_numeric_field(get("cargaPesoBruto", "0"), 1000),
            "Peso líquido (kg)": parse_numeric_field(get("cargaPesoLiquido", "0"), 1000),
        },
        "valores": {
            "FOB USD": parse_numeric_field(get("localEmbarqueTotalDolares", "0")),
            "FOB R$": parse_numeric_field(get("localEmbarqueTotalReais", "0")),
            "Frete USD": parse_numeric_field(get("freteTotalDolares", "0")),
            "Frete R$": parse_numeric_field(get("freteTotalReais", "0")),
            "Seguro R$": parse_numeric_field(get("seguroTotalReais", "0")),
            "AFRMM R$": parse_numeric_field(get("afrmm", "0")),
            "Siscomex R$": parse_numeric_field(get("taxaSiscomex", "0")),
            "Valor Aduaneiro R$": parse_numeric_field(get("localDescargaTotalReais", "0")),
        },
        "despesas_complementares": despesas_complementares,
        "adicoes": [],
        "info_complementar": info_complementar_raw
    }
    
    # Processar cada adição
    for adicao_elem in di.findall("adicao"):
        g = adicao_elem.findtext
        
        adicao = {
            "numero": g("numeroAdicao") or "N/A",
            "numero_li": g("numeroLI") or "N/A",
            "dados_gerais": {
                "NCM": g("dadosMercadoriaCodigoNcm") or "N/A",
                "NBM": g("dadosMercadoriaCodigoNcm") or "N/A",
                "Descrição NCM": g("dadosMercadoriaNomeNcm") or "N/A",
                "VCMV USD": parse_numeric_field(g("condicaoVendaValorMoeda", "0")),
                "VCMV R$": parse_numeric_field(g("condicaoVendaValorReais", "0")),
                "INCOTERM": g("condicaoVendaIncoterm") or "N/A",
                "Local": g("condicaoVendaLocal") or "N/A",
                "Moeda": g("condicaoVendaMoedaNome") or "N/A",
                "Peso líq. (kg)": parse_numeric_field(g("dadosMercadoriaPesoLiquido", "0"), 1000),
                "Quantidade": parse_numeric_field(g("dadosMercadoriaMedidaEstatisticaQuantidade", "0"), 1000),
                "Unidade": (g("dadosMercadoriaMedidaEstatisticaUnidade") or "").strip() or "N/A",
            },
            "partes": {
                "Exportador": g("fornecedorNome") or "N/A",
                "País Aquisição": g("paisAquisicaoMercadoriaNome") or "N/A",
                "Fabricante": g("fabricanteNome") or "N/A",
                "País Origem": g("paisOrigemMercadoriaNome") or "N/A",
            },
            "tributos": {
                "II Alíq. (%)": parse_numeric_field(g("iiAliquotaAdValorem", "0"), 10000),
                "II Regime": g("iiRegimeTributacaoNome") or "N/A",
                "II R$": parse_numeric_field(g("iiAliquotaValorRecolher", "0")),
                "IPI Alíq. (%)": parse_numeric_field(g("ipiAliquotaAdValorem", "0"), 10000),
                "IPI Regime": g("ipiRegimeTributacaoNome") or "N/A",
                "IPI R$": parse_numeric_field(g("ipiAliquotaValorRecolher", "0")),
                "PIS Alíq. (%)": parse_numeric_field(g("pisPasepAliquotaAdValorem", "0"), 10000),
                "PIS R$": parse_numeric_field(g("pisPasepAliquotaValorRecolher", "0")),
                "COFINS Alíq. (%)": parse_numeric_field(g("cofinsAliquotaAdValorem", "0"), 10000),
                "COFINS R$": parse_numeric_field(g("cofinsAliquotaValorRecolher", "0")),
                "Base PIS/COFINS R$": parse_numeric_field(g("pisCofinsBaseCalculoValor", "0")),
                "Regime PIS/COFINS": g("pisCofinsRegimeTributacaoNome") or "N/A",
            },
            "itens": []
        }
        
        # Processar mercadorias (itens) da adição
        for mercadoria in adicao_elem.findall("mercadoria"):
            descricao = (mercadoria.findtext("descricaoMercadoria") or "").strip()
            qtd = parse_numeric_field(mercadoria.findtext("quantidade", "0"), 100000)
            valor_unit = parse_numeric_field(mercadoria.findtext("valorUnitario", "0"), 10000000)
            
            item = {
                "Seq": mercadoria.findtext("numeroSequencialItem", "N/A"),
                "Código": extrair_codigo_produto(descricao),
                "Descrição": descricao or "N/A",
                "Qtd": qtd,
                "Unidade": (mercadoria.findtext("unidadeMedida") or "").strip() or "N/A",
                "Valor Unit. USD": valor_unit,
                "Unid/Caixa": extrair_unidades_por_caixa(descricao),
                "Valor Total USD": qtd * valor_unit
            }
            
            adicao["itens"].append(item)
        
        dados["adicoes"].append(adicao)
    
    # Calcular totais de tributos
    if dados["adicoes"]:
        tributos_totais = {"II R$": 0, "IPI R$": 0, "PIS R$": 0, "COFINS R$": 0}
        for adicao in dados["adicoes"]:
            tributos_totais["II R$"] += adicao["tributos"]["II R$"]
            tributos_totais["IPI R$"] += adicao["tributos"]["IPI R$"]
            tributos_totais["PIS R$"] += adicao["tributos"]["PIS R$"]
            tributos_totais["COFINS R$"] += adicao["tributos"]["COFINS R$"]
        dados["tributos"] = tributos_totais
    else:
        dados["tributos"] = {"II R$": 0, "IPI R$": 0, "PIS R$": 0, "COFINS R$": 0}
    
    return dados

# NOVA CLASSE: Interface de Precificação

class JanelaPrecificacao:
    def __init__(self, parent, dados_processados):
        self.parent = parent
        self.dados = dados_processados
        self.window = tk.Toplevel(parent)
        self.window.title("Módulo de Precificação - Cálculo de Preço de Venda")
        self.window.geometry("1200x800")
        self.window.transient(parent)
        self.window.grab_set()
        
        # Variáveis de configuração
        self.regime_tributario = tk.StringVar(value="real")
        self.aliq_icms_venda = tk.StringVar(value="19.0")
        self.aliq_ipi_venda = tk.StringVar(value="0.0")
        self.margem_padrao = tk.StringVar(value="30.0")
        
        # Lista para armazenar dados dos itens
        self.itens_precificacao = []
        self._preparar_dados_itens()
        self._criar_interface()
        
    def _preparar_dados_itens(self):
        """Prepara lista de itens para precificação"""
        for adicao in self.dados["adicoes"]:
            for item in adicao["itens"]:
                self.itens_precificacao.append({
                    "Adição": adicao["numero"],
                    "NCM": adicao["dados_gerais"]["NCM"],
                    "Seq": item["Seq"],
                    "Código": item["Código"],
                    "Descrição": item["Descrição"][:50] + "..." if len(item["Descrição"]) > 50 else item["Descrição"],
                    "Qtd": item["Qtd"],
                    "Custo Unit R$": item.get("Custo Unitário R$", 0),
                    "Margem (%)": 30.0,  # Padrão
                    "item_data": item  # Dados completos do item
                })
    
    def _criar_interface(self):
        main_frame = ttk.Frame(self.window, padding=20)
        main_frame.pack(fill="both", expand=True)
        
        # Título
        ttk.Label(main_frame, text="Módulo de Precificação com Cálculo de Impostos sobre Venda", 
                 font=("Arial", 14, "bold"), foreground="blue").pack(pady=(0, 20))
        
        # Configurações gerais
        config_frame = ttk.LabelFrame(main_frame, text="Configurações de Precificação", padding=15)
        config_frame.pack(fill="x", pady=(0, 20))
        
        # Primeira linha de configurações
        config_row1 = ttk.Frame(config_frame)
        config_row1.pack(fill="x", pady=(0, 10))
        
        ttk.Label(config_row1, text="Regime Tributário:").grid(row=0, column=0, sticky="w", padx=(0, 5))
        regime_combo = ttk.Combobox(config_row1, textvariable=self.regime_tributario, 
                                   values=["real", "presumido"], width=12, state="readonly")
        regime_combo.grid(row=0, column=1, padx=(0, 20))
        
        ttk.Label(config_row1, text="ICMS Venda (%):").grid(row=0, column=2, sticky="w", padx=(0, 5))
        ttk.Entry(config_row1, textvariable=self.aliq_icms_venda, width=8).grid(row=0, column=3, padx=(0, 20))
        
        ttk.Label(config_row1, text="IPI Venda (%):").grid(row=0, column=4, sticky="w", padx=(0, 5))
        ttk.Entry(config_row1, textvariable=self.aliq_ipi_venda, width=8).grid(row=0, column=5, padx=(0, 20))
        
        ttk.Label(config_row1, text="Margem Padrão (%):").grid(row=0, column=6, sticky="w", padx=(0, 5))
        ttk.Entry(config_row1, textvariable=self.margem_padrao, width=8).grid(row=0, column=7)
        
        # Segunda linha com botões - REMOVER O CAMPO IPI VENDA
        config_row2 = ttk.Frame(config_frame)
        config_row2.pack(fill="x")
        
        ttk.Button(config_row2, text="Aplicar Margem Padrão a Todos", 
                command=self._aplicar_margem_padrao).pack(side="left", padx=(0, 10))
        ttk.Button(config_row2, text="Calcular Preços de Venda", 
                command=self._calcular_precos).pack(side="left", padx=(0, 10))
        ttk.Button(config_row2, text="Gerar Excel com Precificação", 
                command=self._gerar_excel_precificacao).pack(side="left")
        
        # Nota informativa
        ttk.Label(config_frame, text="ℹ️ IPI da venda será o mesmo da entrada para cada item", 
                font=("Arial", 8), foreground="blue").pack(pady=(5, 0))
        
        # Frame principal com treeview
        tree_frame = ttk.Frame(main_frame)
        tree_frame.pack(fill="both", expand=True)
        
        # Scrollbars
        tree_scroll_v = ttk.Scrollbar(tree_frame, orient="vertical")
        tree_scroll_v.pack(side="right", fill="y")
        tree_scroll_h = ttk.Scrollbar(tree_frame, orient="horizontal")
        tree_scroll_h.pack(side="bottom", fill="x")
        
        # Treeview para exibir itens
        self.tree = ttk.Treeview(tree_frame, 
                                yscrollcommand=tree_scroll_v.set,
                                xscrollcommand=tree_scroll_h.set)
        self.tree.pack(fill="both", expand=True)
        
        # Configurar scrollbars
        tree_scroll_v.config(command=self.tree.yview)
        tree_scroll_h.config(command=self.tree.xview)
        
        # Definir colunas
        colunas = ["NCM", "Código", "Descrição", "Qtd", "Custo Unit R$", "Margem (%)", 
                  "Custo Líq R$", "Preço Venda R$", "Margem Real (%)"]
        
        self.tree["columns"] = colunas
        self.tree["show"] = "headings"
        
        # Configurar cabeçalhos e larguras
        larguras = [100, 80, 300, 80, 100, 80, 100, 100, 80]
        for i, col in enumerate(colunas):
            self.tree.heading(col, text=col)
            self.tree.column(col, width=larguras[i], anchor="center" if i != 2 else "w")
        
        # Permitir edição duplo-clique na margem
        self.tree.bind("<Double-1>", self._editar_margem)
        
        # Carregar dados iniciais
        self._carregar_dados_tree()
        
        # Botão fechar
        ttk.Button(main_frame, text="Fechar", command=self.window.destroy).pack(pady=20)
    
    def _carregar_dados_tree(self):
        """Carrega dados na treeview"""
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        for item_data in self.itens_precificacao:
            valores = [
                item_data["NCM"],
                item_data["Código"],
                item_data["Descrição"],
                f"{item_data['Qtd']:.0f}",
                f"R$ {item_data['Custo Unit R$']:.2f}",
                f"{item_data['Margem (%)']:.1f}",
                "R$ 0,00",  # Será calculado
                "R$ 0,00",  # Será calculado
                "0,0%"      # Será calculado
            ]
            self.tree.insert("", "end", values=valores)
    
    def _aplicar_margem_padrao(self):
        """Aplica margem padrão a todos os itens"""
        try:
            margem = float(self.margem_padrao.get().replace(",", "."))
            for item in self.itens_precificacao:
                item["Margem (%)"] = margem
            self._carregar_dados_tree()
        except ValueError:
            messagebox.showerror("Erro", "Margem padrão inválida!")
    
    def _editar_margem(self, event):
        """Permite editar margem com duplo-clique"""
        selection = self.tree.selection()
        if not selection:
            return
        
        item_id = selection[0]
        col = self.tree.identify_column(event.x)
        
        # Coluna 6 é "Margem (%)"
        if col == "#6":
            # Obter valores atuais
            item_values = self.tree.item(item_id)["values"]
            margem_atual = item_values[5].replace("%", "")
            
            # Dialog para editar
            nova_margem = tk.simpledialog.askfloat("Editar Margem", 
                                                  f"Nova margem (%):", 
                                                  initialvalue=float(margem_atual))
            if nova_margem is not None:
                # Atualizar dados
                row_index = self.tree.index(item_id)
                self.itens_precificacao[row_index]["Margem (%)"] = nova_margem
                self._carregar_dados_tree()
    
    def _calcular_precos(self):
        """Calcula preços de venda para todos os itens"""
        try:
            regime = self.regime_tributario.get()
            aliq_icms = float(self.aliq_icms_venda.get().replace(",", ".")) / 100
            
            # Limpar treeview
            for item in self.tree.get_children():
                self.tree.delete(item)
            
            # Calcular para cada item
            for i, item_precif in enumerate(self.itens_precificacao):
                item_data = item_precif["item_data"]
                margem = item_precif["Margem (%)"] / 100
                
                # Obter IPI da entrada para este item específico
                aliq_ipi_entrada = 0.0
                
                # Buscar a adição correspondente para pegar o IPI
                for adicao in self.dados["adicoes"]:
                    if any(it["Seq"] == item_data["Seq"] for it in adicao["itens"]):
                        aliq_ipi_entrada = adicao["tributos"].get("IPI Alíq. (%)", 0.0) / 100
                        break
                
                # Calcular créditos e custo líquido
                creditos, custo_liquido = calcular_creditos_tributarios(item_data, regime)
                
                # Calcular preço de venda com IPI da entrada
                preco_data = calcular_preco_venda(
                    custo_liquido, margem, aliq_icms, aliq_ipi_entrada, regime=regime
                )
                
                # Armazenar resultados
                item_precif["precificacao"] = preco_data
                item_precif["creditos"] = creditos
                
                # Inserir na treeview
                valores = [
                    item_precif["NCM"],
                    item_precif["Código"],
                    item_precif["Descrição"],
                    f"{item_precif['Qtd']:.0f}",
                    f"R$ {item_precif['Custo Unit R$']:.2f}",
                    f"{item_precif['Margem (%)']:.1f}%",
                    f"R$ {custo_liquido:.2f}",
                    f"R$ {preco_data['Preço Final R$']:.2f}",
                    f"{preco_data['Margem Real (%)']:.1f}%"
                ]
                self.tree.insert("", "end", values=valores)
                
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao calcular preços: {str(e)}")
    
    def _gerar_excel_precificacao(self):
        """Gera Excel com dados de precificação"""
        if not any("precificacao" in item for item in self.itens_precificacao):
            messagebox.showwarning("Aviso", "Execute o cálculo de preços primeiro!")
            return
        
        # Escolher local para salvar
        arquivo = filedialog.asksaveasfilename(
            title="Salvar Precificação como...",
            defaultextension=".xlsx",
            filetypes=[("Excel", "*.xlsx")]
        )
        
        if not arquivo:
            return
        
        try:
            with pd.ExcelWriter(arquivo, engine="xlsxwriter") as writer:
                # Preparar dados para o DataFrame
                dados_precificacao = []
                dados_creditos = []
                
                for item in self.itens_precificacao:
                    if "precificacao" not in item:
                        continue
                        
                    preco_data = item["precificacao"]
                    creditos = item["creditos"]
                    
                    # Dados de precificação
                    dados_precificacao.append({
                        "NCM": item["NCM"],
                        "Código": item["Código"],
                        "Descrição": item["Descrição"],
                        "Qtd": item["Qtd"],
                        "Custo Bruto Unit R$": item["Custo Unit R$"],
                        "Custo Líquido Unit R$": preco_data["Custo Líquido R$"],
                        "Margem Desejada (%)": preco_data["Margem Desejada (%)"],
                        "Preço Base R$": preco_data["Preço Base R$"],
                        "ICMS Venda R$": preco_data["ICMS Venda R$"],
                        "PIS Venda R$": preco_data["PIS Venda R$"],
                        "COFINS Venda R$": preco_data["COFINS Venda R$"],
                        "IPI Venda R$": preco_data["IPI Venda R$"],
                        "IPI Alíq. Venda (%)": preco_data["IPI Alíq. Venda (%)"],  # NOVO
                        "Total Impostos R$": preco_data["Total Impostos Venda R$"],
                        "Preço Final R$": preco_data["Preço Final R$"],
                        "Margem Real (%)": preco_data["Margem Real (%)"],
                        "Regime": preco_data["Regime Tributário"]
                    })
                    
                    # Dados de créditos
                    dados_creditos.append({
                        "NCM": item["NCM"],
                        "Código": item["Código"],
                        "Descrição": item["Descrição"],
                        "Custo Bruto R$": item["Custo Unit R$"],
                        "ICMS Crédito R$": creditos["ICMS Crédito"],
                        "IPI Crédito R$": creditos["IPI Crédito"],
                        "PIS Crédito R$": creditos["PIS Crédito"],
                        "COFINS Crédito R$": creditos["COFINS Crédito"],
                        "Total Créditos R$": creditos["Total Créditos"],
                        "Custo Líquido R$": preco_data["Custo Líquido R$"]
                    })
                
                # Criar DataFrames e salvar
                df_precificacao = pd.DataFrame(dados_precificacao)
                df_creditos = pd.DataFrame(dados_creditos)
                
                df_precificacao.to_excel(writer, sheet_name="Precificação", index=False)
                df_creditos.to_excel(writer, sheet_name="Créditos_Tributários", index=False)
                
                # Formatação
                workbook = writer.book
                money_format = workbook.add_format({'num_format': 'R$ #,##0.00'})
                percent_format = workbook.add_format({'num_format': '0.0%'})
                
                # Aplicar formatação na aba Precificação
                worksheet = writer.sheets["Precificação"]
                for col in [4, 5, 6, 7, 8, 9, 10, 11, 12, 13]:  # Colunas monetárias
                    worksheet.set_column(col, col, None, money_format)
                worksheet.set_column(6, 6, None, percent_format)  # Margem Desejada
                worksheet.set_column(14, 14, None, percent_format)  # Margem Real
                
                # Aplicar formatação na aba Créditos
                worksheet2 = writer.sheets["Créditos_Tributários"]
                for col in range(3, 10):  # Colunas monetárias
                    worksheet2.set_column(col, col, None, money_format)
            
            messagebox.showinfo("Sucesso", f"Precificação salva em:\n{arquivo}")
            
        except Exception as e:
            messagebox.showerror("Erro", f"Erro ao gerar Excel: {str(e)}")

# Adicionar import necessário para o simpledialog

import tkinter.simpledialog

def gera_excel_completo(d: dict, xlsx: Path):
    """Gera Excel com aba para cada adição - COM CONFIGURAÇÃO DE CUSTOS E ICMS"""
    
    with pd.ExcelWriter(xlsx, engine="xlsxwriter") as wr:
        wb = wr.book
        hdr = wb.add_format({"bold": True, "bg_color": "#D7E4BC"})
        hdr_secao = wb.add_format({"bold": True, "bg_color": "#4F81BD", "font_color": "white"})
        hdr_custo = wb.add_format({"bold": True, "bg_color": "#FFA500", "font_color": "white"})
        hdr_config = wb.add_format({"bold": True, "bg_color": "#9932CC", "font_color": "white"})
        money = wb.add_format({"num_format": "#,##0.00"})
        percent = wb.add_format({"num_format": "0.00%"})
        
        def add_table(worksheet, df, style="Table Style Medium 2"):
            """Adiciona uma tabela do Excel à planilha."""
            (rows, cols) = df.shape
            worksheet.add_table(0, 0, rows, cols - 1, {
                'style': style,
                'columns': [{'header': str(c)} for c in df.columns]
            })
        
        def simples(dic, aba, larg0=26, larg1=50):
            df_data = pd.DataFrame(list(dic.items()), columns=["Campo", "Valor"])
            df_data.to_excel(wr, sheet_name=aba, index=False, header=True)
            ws = wr.sheets[aba]
            ws.set_column(0, 0, larg0)
            ws.set_column(1, 1, larg1)
            add_table(ws, df_data)
        
        # Abas gerais
        simples(d["cabecalho"], "01_Capa")
        simples(d["importador"], "02_Importador")
        simples(d["carga"], "03_Carga")
        simples(d["valores"], "04_Valores")
        
        # Aba de despesas complementares
        if d.get("despesas_complementares"):
            despesas_df = pd.DataFrame(list(d["despesas_complementares"].items()), 
                                     columns=["Despesa", "Valor (R$)"])
            despesas_df.to_excel(wr, "04B_Despesas_Complementares", index=False)
            ws = wr.sheets["04B_Despesas_Complementares"]
            ws.set_column(0, 0, 25)
            ws.set_column(1, 1, 15, money)
            add_table(ws, despesas_df, style="Table Style Medium 5")
        
        # Configuração de Custos
        if "configuracao_custos" in d:
            config_df = pd.DataFrame(list(d["configuracao_custos"].items()), 
                                   columns=["Configuração", "Valor"])
            config_df.to_excel(wr, "04A_Config_Custos", index=False)
            ws = wr.sheets["04A_Config_Custos"]
            ws.set_column(0, 0, 25)
            ws.set_column(1, 1, 25, money)
            add_table(ws, config_df, style="Table Style Medium 3")
        
        # Tributos totais (incluindo ICMS)
        tributos_df = pd.Series(d["tributos"]).rename("Total (R$)").to_frame().reset_index()
        tributos_df.columns = ["Imposto", "Total (R$)"]
        tributos_df.to_excel(wr, "05_Tributos_Totais", index=False)
        ws = wr.sheets["05_Tributos_Totais"]
        ws.set_column(0, 0, 20)
        ws.set_column(1, 1, 14, money)
        add_table(ws, tributos_df)
        
        # Validação de custos
        if "validacao_custos" in d:
            validacao_df = pd.DataFrame(list(d["validacao_custos"].items()), 
                                      columns=["Métrica", "Valor"])
            validacao_df.to_excel(wr, "05A_Validacao_Custos", index=False)
            ws = wr.sheets["05A_Validacao_Custos"]
            ws.set_column(0, 0, 25)
            ws.set_column(1, 1, 25)
            
            # Colorir status
            for i, row in validacao_df.iterrows():
                if row["Métrica"] == "Status":
                    status_format = wb.add_format(
                        {"bold": True, "bg_color": "#90EE90" if row["Valor"] == "OK" else "#FFB6C1"})
                    ws.write(i + 1, 1, row["Valor"], status_format)
                elif "R$" in str(row["Métrica"]) or row["Métrica"] in ["Custo Total Calculado", "Valor Esperado", "Diferença"]:
                    ws.write(i + 1, 1, row["Valor"], money)
            
            add_table(ws, validacao_df, style="Table Style Medium 4")
        
        # Resumo de adições COM TODOS OS TRIBUTOS
        resumo_adicoes = []
        for ad in d["adicoes"]:
            descricao = ad["dados_gerais"]["Descrição NCM"] or "N/A"
            if len(descricao) > 50:
                descricao = descricao[:50] + "..."
            
            custos = ad.get("custos", {})
            resumo_adicoes.append({
                "Nº": ad["numero"],
                "NCM": ad["dados_gerais"]["NCM"],
                "Descrição": descricao,
                "INCOTERM": ad["dados_gerais"]["INCOTERM"],
                "VCMV R$": ad["dados_gerais"]["VCMV R$"],
                "Custo Total R$": custos.get("Custo Total Adição R$", 0),
                "II R$": ad["tributos"]["II R$"],
                "IPI R$": ad["tributos"]["IPI R$"],
                "PIS R$": ad["tributos"]["PIS R$"],
                "COFINS R$": ad["tributos"]["COFINS R$"],
                "ICMS R$": custos.get("ICMS Incorporado R$", 0),
                "Total Tributos R$": (ad["tributos"]["II R$"] + ad["tributos"]["IPI R$"] +
                                    ad["tributos"]["PIS R$"] + ad["tributos"]["COFINS R$"] +
                                    custos.get("ICMS Incorporado R$", 0))
            })
        
        if resumo_adicoes:
            df_resumo = pd.DataFrame(resumo_adicoes)
            df_resumo.to_excel(wr, "06_Resumo_Adicoes", index=False)
            ws = wr.sheets["06_Resumo_Adicoes"]
            ws.freeze_panes(1, 0)
            add_table(ws, df_resumo, style="Table Style Medium 9")
            
            # Configurar colunas
            larguras = [5, 12, 35, 10, 12, 15, 12, 12, 12, 12, 12, 16]
            for col, width in enumerate(larguras):
                ws.set_column(col, col, width)
            
            # Formatar colunas monetárias
            for c in range(4, len(larguras)):
                ws.set_column(c, c, None, money)
        
        # Resumo de custos por adição COM TODOS OS TRIBUTOS
        resumo_custos = []
        for ad in d["adicoes"]:
            custos = ad.get("custos", {})
            if custos:
                resumo_custos.append({
                    "Adição": ad["numero"],
                    "NCM": ad["dados_gerais"]["NCM"],
                    "INCOTERM": ad["dados_gerais"]["INCOTERM"],
                    "Valor Mercadoria R$": custos.get("Valor Mercadoria R$", 0),
                    "Frete Rateado R$": custos.get("Frete Rateado R$", 0),
                    "Seguro Rateado R$": custos.get("Seguro Rateado R$", 0),
                    "AFRMM Rateado R$": custos.get("AFRMM Rateado R$", 0),
                    "Siscomex Rateado R$": custos.get("Siscomex Rateado R$", 0),
                    "II R$": custos.get("II Incorporado R$", 0),
                    "IPI R$": custos.get("IPI R$", 0),
                    "PIS R$": custos.get("PIS R$", 0),
                    "COFINS R$": custos.get("COFINS R$", 0),
                    "ICMS R$": custos.get("ICMS Incorporado R$", 0),
                    "Custo Total R$": custos.get("Custo Total Adição R$", 0),
                    "% Participação": custos.get("% Participação", 0)
                })
        
        if resumo_custos:
            df_custos = pd.DataFrame(resumo_custos)
            df_custos.to_excel(wr, "06A_Resumo_Custos", index=False)
            ws = wr.sheets["06A_Resumo_Custos"]
            ws.freeze_panes(1, 0)
            add_table(ws, df_custos, style="Table Style Medium 10")
            
            # Configurar larguras
            larguras = [8, 12, 10, 12, 10, 10, 10, 10, 10, 10, 10, 10, 10, 12, 12]
            for col, width in enumerate(larguras):
                ws.set_column(col, col, width)
            
            # Formatar colunas
            for c in range(3, len(larguras)-1):  # Colunas monetárias exceto % Participação
                ws.set_column(c, c, None, money)
            ws.set_column(len(larguras)-1, len(larguras)-1, None, percent)  # % Participação
        
        # Criar aba para cada adição com custos EXPANDIDOS POR ITEM
        for i, ad in enumerate(d["adicoes"], 1):
            numero_adicao = ad["numero"] or str(i).zfill(3)
            aba_nome = f"Add_{numero_adicao}"
            ws = wb.add_worksheet(aba_nome)
            
            current_row = 0
            
            def write_section_as_table(title, data_dict, header_format, col1_name="Campo", col2_name="Valor"):
                nonlocal current_row
                ws.merge_range(current_row, 0, current_row, 1, title, header_format)
                current_row += 1
                start_table_row = current_row
                ws.write(current_row, 0, col1_name, hdr)
                ws.write(current_row, 1, col2_name, hdr)
                current_row += 1
                
                for campo, valor in data_dict.items():
                    ws.write(current_row, 0, campo)
                    if isinstance(valor, (int, float)):
                        if "%" in campo: 
                            ws.write(current_row, 1, valor / 100, percent)
                        elif "R$" in campo: 
                            ws.write(current_row, 1, valor, money)
                        else: 
                            ws.write(current_row, 1, valor)
                    else: 
                        ws.write(current_row, 1, valor)
                    current_row += 1
                
                ws.add_table(start_table_row, 0, current_row - 1, 1,
                           {'style': 'Table Style Medium 2', 'columns': [{'header': col1_name}, {'header': col2_name}]})
                current_row += 1
            
            # SEÇÕES COMO TABELAS
            write_section_as_table("DADOS GERAIS", ad["dados_gerais"], hdr_secao)
            write_section_as_table("PARTES ENVOLVIDAS", ad["partes"], hdr_secao)
            write_section_as_table("TRIBUTOS", ad["tributos"], hdr_secao)
            
            if "custos" in ad:
                write_section_as_table("ANÁLISE DE CUSTOS", ad["custos"], hdr_custo, 
                                     col1_name="Componente", col2_name="Valor (R$)")
            
            # SEÇÃO: ITENS DETALHADOS COM TODOS OS CUSTOS E TRIBUTOS
            ws.merge_range(current_row, 0, current_row, 20, "ITENS DETALHADOS COM CUSTOS E TRIBUTOS", hdr_secao)
            current_row += 1
            
            if ad["itens"]:
                df_itens = pd.DataFrame(ad["itens"])
                
                # Adicionar todas as colunas de custo e tributos calculadas por item
                colunas_custos = [
                    "Custo Mercadoria R$", "Frete Rateado R$", "Seguro Rateado R$", 
                    "AFRMM Rateado R$", "Siscomex Rateado R$", "II Incorporado R$",
                    "IPI R$", "PIS R$", "COFINS R$", "ICMS Incorporado R$",
                    "Custo Total Item R$", "Custo Unitário R$", "Custo por Peça R$"
                ]
                
                for coluna in colunas_custos:
                    if coluna not in df_itens.columns:
                        df_itens[coluna] = [item.get(coluna, 0) for item in ad["itens"]]
                
                # Organizar colunas
                cols_ordem = [
                    "Seq", "Código", "Descrição", "Qtd", "Unidade", 
                    "Valor Unit. USD", "Unid/Caixa", "Valor Total USD"
                ] + colunas_custos
                
                df_itens = df_itens[cols_ordem]
                
                start_table_row = current_row
                df_itens.to_excel(wr, sheet_name=aba_nome, startrow=start_table_row, index=False)
                
                # Adicionar tabela
                (rows, cols) = df_itens.shape
                ws.add_table(start_table_row, 0, start_table_row + rows, cols - 1,
                           {'style': 'Table Style Medium 9', 'columns': [{'header': c} for c in df_itens.columns]})
                
                current_row += rows + 2
                
                # Formatação de colunas monetárias
                money_cols = list(range(5, len(cols_ordem)))  # Todas as colunas monetárias
                for c_idx in money_cols:
                    ws.set_column(c_idx, c_idx, None, money)
                
                # Linha de totais
                ws.write(current_row, 2, "TOTAIS:", hdr)
                total_qtd = sum(item["Qtd"] for item in ad["itens"])
                total_valor_usd = sum(item["Valor Total USD"] for item in ad["itens"])
                
                ws.write(current_row, 3, total_qtd, hdr)
                ws.write(current_row, 7, total_valor_usd, money)
                
                # Totais de cada custo
                for col_idx, col_name in enumerate(colunas_custos, start=8):
                    if col_name not in ["Custo Unitário R$", "Custo por Peça R$"]:  # Não somar unitários
                        total_custo = sum(item.get(col_name, 0) for item in ad["itens"] 
                                        if isinstance(item.get(col_name), (int, float)))
                        ws.write(current_row, col_idx, total_custo, money)
            else:
                ws.write(current_row, 0, "Nenhum item detalhado encontrado", hdr)
                current_row += 1
            
            # Configurar larguras das colunas
            larguras_cols = [
                8,   # Seq
                12,  # Código  
                40,  # Descrição
                8,   # Qtd
                10,  # Unidade
                12,  # Valor Unit. USD
                10,  # Unid/Caixa
                12,  # Valor Total USD
                12,  # Custo Mercadoria
                10,  # Frete Rateado
                10,  # Seguro Rateado
                10,  # AFRMM Rateado
                10,  # Siscomex Rateado
                10,  # II
                8,   # IPI
                8,   # PIS
                10,  # COFINS
                10,  # ICMS
                12,  # Custo Total
                12,  # Custo Unitário
                12   # Custo por Peça
            ]
            
            for col_idx, width in enumerate(larguras_cols):
                ws.set_column(col_idx, col_idx, width)
        
        # Dados complementares
        df_comp = pd.DataFrame({"Dados Complementares": [d["info_complementar"]]})
        df_comp.to_excel(wr, "99_Complementar", index=False)
        ws = wr.sheets["99_Complementar"]
        ws.set_column(0, 0, 120)
        add_table(ws, df_comp)
        
        # === CROQUI DE NOTA FISCAL DE ENTRADA COM ICMS CORRIGIDO === #
        ws_croqui = wb.add_worksheet("Croqui_NFe_Entrada")
        linha = 0
        
        def secao(titulo):
            nonlocal linha
            ws_croqui.merge_range(linha, 0, linha, 13, titulo, hdr_secao)
            linha += 1
        
        secao("CABEÇALHO DA NOTA")
        ws_croqui.write_row(linha, 0, ["Série", "Modelo", "Tipo de Operação", "Natureza da Operação", 
                                      "Finalidade", "Data de Emissão", "Chave de Acesso"])
        ws_croqui.write_row(linha+1, 0, [1, 55, "0 (entrada)", "Importação do exterior (CFOP 3102)", 
                                        1, "", ""])
        linha += 3
        
        # EMITENTE/IMPORTADOR
        secao("EMITENTE / IMPORTADOR")
        ws_croqui.write_row(linha, 0, ["CNPJ", "Razão Social", "Endereço"])
        ws_croqui.write_row(linha+1, 0, [d["importador"]["CNPJ"], d["importador"]["Nome"], 
                                        d["importador"]["Endereço"]])
        linha += 3
        
        # REMETENTE/EXPORTADOR (EXTERIOR)
        secao("REMETENTE / EXPORTADOR (EXTERIOR)")
        primeira_ad = d["adicoes"][0]
        ws_croqui.write_row(linha, 0, ["Nome Exportador", "País de Aquisição"])
        ws_croqui.write_row(linha+1, 0, [primeira_ad["partes"]["Exportador"], 
                                        primeira_ad["partes"]["País Aquisição"]])
        linha += 3
        
        # DADOS DA DI
        secao("DADOS DA DECLARAÇÃO DE IMPORTAÇÃO")
        ws_croqui.write_row(linha, 0, ["Número DI", "Registro", "URF", "Modalidade"])
        ws_croqui.write_row(linha+1, 0, [d["cabecalho"]["DI"], d["cabecalho"]["Data registro"], 
                                        d["cabecalho"]["URF despacho"], d["cabecalho"]["Modalidade"]])
        linha += 3
        
        # PRODUTOS E SERVIÇOS
        secao("PRODUTOS E SERVIÇOS")
        itens_nfe = []
        seq_nota = 1
        
        # Usar alíquota configurada
        aliquota_icms_config = d.get("configuracao_custos", {}).get("Alíquota ICMS (%)", 19.0)
        
        for ad in d["adicoes"]:
            for item in ad["itens"]:
                itens_nfe.append({
                    "Seq": seq_nota,
                    "Descrição": item["Descrição"],
                    "NCM": ad["dados_gerais"]["NCM"],
                    "Quantidade": item["Qtd"],
                    "Unidade": item["Unidade"],
                    "Valor Unit. (R$)": item.get("Custo Unitário R$", 0),
                    "Valor Total (R$)": item.get("Custo Total Item R$", 0),
                    "CFOP": "3102",
                    "Origem": "3",  # Estrangeira
                    "CST ICMS": "00",
                    "Alq. ICMS (%)": aliquota_icms_config,
                    "IPI CST": "00",
                    "IPI Alíq. (%)": round(ad["tributos"].get("IPI Alíq. (%)", 0)*100, 2),
                    "Fabricante": ad["partes"]["Fabricante"]
                })
                seq_nota += 1
        
        if itens_nfe:
            df_nfe = pd.DataFrame(itens_nfe)
            df_nfe.to_excel(wr, sheet_name="Croqui_NFe_Entrada", startrow=linha, index=False)
            
            (rows, cols) = df_nfe.shape
            ws_croqui.add_table(linha, 0, linha + rows, cols - 1,
                               {'style': 'Table Style Medium 9', 'columns': [{'header': c} for c in df_nfe.columns]})
            linha += rows + 2
        
        # BASE E CÁLCULO DO ICMS COM VALORES CORRETOS
        secao("BASE DE CÁLCULO DO ICMS IMPORTAÇÃO")
        
        base_icms_data = {
            "Valor Aduaneiro": d["valores"]["Valor Aduaneiro R$"],
            "II": d["tributos"]["II R$"],
            "IPI": d["tributos"]["IPI R$"],
            "PIS": d["tributos"]["PIS R$"],
            "COFINS": d["tributos"]["COFINS R$"],
            "AFRMM": d.get("configuracao_custos", {}).get("AFRMM R$", 0),
            "Siscomex": d.get("configuracao_custos", {}).get("Siscomex R$", 0)
        }
        
        for k, v in base_icms_data.items(): 
            ws_croqui.write_row(linha, 0, [k, v]); 
            linha += 1
        linha += 1
        
        base_icms_sem_icms = sum(base_icms_data.values())
        ws_croqui.write_row(linha, 0, ["Base ICMS Sem ICMS", base_icms_sem_icms]); linha += 1
        
        # Usar ICMS calculado
        icms_total = d["tributos"].get("ICMS R$", 0)
        base_final_icms = d["tributos"].get("Base ICMS R$", base_icms_sem_icms + icms_total)
        
        ws_croqui.write_row(linha, 0, ["Base Final do ICMS", base_final_icms]); linha += 1
        ws_croqui.write_row(linha, 0, ["ICMS a Recolher", icms_total]); linha += 2
        
        # INFORMAÇÕES COMPLEMENTARES
        secao("INFORMAÇÕES COMPLEMENTARES / OBSERVAÇÕES OBRIGATÓRIAS")
        
        info_extra = f"DI: {d['cabecalho']['DI']} - Data Registro: {d['cabecalho']['Data registro']}\n\n"
        info_extra += f"INFORMAÇÕES COMPLEMENTARES:\n{d['info_complementar']}\n\n"
        
        # Mostrar despesas identificadas
        if d.get("despesas_complementares"):
            info_extra += "DESPESAS IDENTIFICADAS AUTOMATICAMENTE:\n"
            for despesa, valor in d["despesas_complementares"].items():
                if valor > 0:
                    info_extra += f"• {despesa}: R$ {valor:,.2f}\n"
        
        ws_croqui.merge_range(linha, 0, linha + 10, 13, info_extra)
        linha += 12
        
        # Ajuste visual
        larguras_croqui = [5, 50, 12, 9, 8, 18, 18, 8, 6, 10, 14, 8, 8, 30]
        for col_idx, width in enumerate(larguras_croqui):
            ws_croqui.set_column(col_idx, col_idx, width)
        
        ws_croqui.write(linha, 0, "LEGENDAS: CFOP 3102=Compra p/ comercialização; CST ICMS=00; Origem=3(estrangeira)")

        
class AppExtrato(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Extrato DI com Custos, ICMS, Despesas e Módulo de Precificação – XML → Excel")
        self.geometry("1050x900")
        self.xml_path = tk.StringVar()
        self.excel_path = tk.StringVar()
        self.frete_embutido = tk.BooleanVar()
        self.seguro_embutido = tk.BooleanVar()
        self.valor_afrmm = tk.StringVar()
        self.valor_siscomex = tk.StringVar()
        self.aliquota_icms = tk.StringVar(value="19")
        self.dados_processados = None  # Para armazenar dados para precificação

        # NOVAS VARIÁVEIS para estado e incentivo
        self.estado_destino = tk.StringVar(value="GO")
        self.aplicar_incentivo = tk.BooleanVar(value=True)
        self.tem_similar_nacional = tk.BooleanVar(value=True)
        self.tipo_operacao = tk.StringVar(value="interestadual")

        # ✅ ADICIONAR ESTAS VARIÁVEIS QUE ESTÃO FALTANDO:
        # Variáveis para configurações especiais
        self.reducao_base_entrada = tk.BooleanVar()
        self.percentual_reducao_entrada = tk.StringVar(value="100")
        self.dolar_diferenciado = tk.BooleanVar()
        self.taxa_contratada = tk.StringVar()
        self.st_entrada = tk.BooleanVar()
        self.aliquota_st_entrada = tk.StringVar(value="0")

        self._monta_widgets()

    def _monta_widgets(self):
        # Criar canvas e scrollbar para permitir rolagem vertical
        canvas = tk.Canvas(self)
        scrollbar = ttk.Scrollbar(self, orient="vertical", command=canvas.yview)
        scrollable_frame = ttk.Frame(canvas)
        
        # Configurar rolagem
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        # Empacotar canvas e scrollbar
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        # IMPORTANTE: Agora usar scrollable_frame em vez de self
        frm = ttk.Frame(scrollable_frame, padding=20)
        frm.pack(fill="both", expand=True)
        
        # Habilitar rolagem com mouse wheel
        def _on_mousewheel(event):
            canvas.yview_scroll(int(-1*(event.delta/120)), "units")
        
        def _bind_to_mousewheel(event):
            canvas.bind_all("<MouseWheel>", _on_mousewheel)
        
        def _unbind_from_mousewheel(event):
            canvas.unbind_all("<MouseWheel>")
        
        canvas.bind('<Enter>', _bind_to_mousewheel)
        canvas.bind('<Leave>', _unbind_from_mousewheel)
        
        # === RESTO DO CÓDIGO PERMANECE IGUAL ===
        # Título
        ttk.Label(frm, text="Extrato DI com Custos, ICMS, Despesas e Módulo de Precificação",
                font=("Arial", 14, "bold"), foreground="green").grid(row=0, column=0, columnspan=6, pady=(0, 15))
        
        # Descrição
        desc_text = """🚀 FUNCIONALIDADES COMPLETAS:
    • Cálculo de custos unitários com rateiro proporcional de TODAS as despesas e impostos
    • Inclusão do ICMS no cálculo dos custos de importação (alíquota configurável por estado)
    • Extração automática de SISCOMEX e AFRMM das informações complementares
    • Entrada manual de valores caso não sejam encontrados automaticamente
    • NOVO: Módulo de precificação com cálculo de preços de venda considerando impostos sobre venda
    • NOVO: Cálculo de créditos tributários nos regimes real e presumido
    • NOVO: Impostos sobre venda calculados por dentro (exceto IPI que é por fora)
    • Opção para frete/seguro embutido no VCMV (INCOTERM CFR/CIF) - EVITA DUPLA CONTABILIZAÇÃO
    • Planilha completa com análise detalhada de custos e tributos por item"""
        
        ttk.Label(frm, text=desc_text, font=("Arial", 9), foreground="blue",
                wraplength=900, justify="left").grid(row=1, column=0, columnspan=6, pady=(0, 15))
        
        # 1. Seleção de arquivo XML
        grupo_arq_xml = ttk.LabelFrame(frm, text="1. Seleção do Arquivo XML da DI", padding=15)
        grupo_arq_xml.grid(row=2, column=0, columnspan=6, sticky="ew", pady=(0, 15))
        grupo_arq_xml.columnconfigure(1, weight=1)
        
        ttk.Label(grupo_arq_xml, text="Arquivo XML:").grid(row=0, column=0, sticky="w", padx=(0, 10))
        ttk.Entry(grupo_arq_xml, textvariable=self.xml_path, state="readonly") \
            .grid(row=0, column=1, sticky="ew", padx=(0, 10))
        ttk.Button(grupo_arq_xml, text="Procurar XML…", command=self._abrir_xml) \
            .grid(row=0, column=2)
        
        # 2. Configuração de Custos
        grupo_custos = ttk.LabelFrame(frm, text="2. Configuração de Custos (IMPORTANTE para INCOTERM CFR/CIF)",
                                    padding=15)
        grupo_custos.grid(row=3, column=0, columnspan=6, sticky="ew", pady=(0, 15))
        
        frame_opcoes = ttk.Frame(grupo_custos)
        frame_opcoes.grid(row=0, column=0, columnspan=6, sticky="ew")
        frame_opcoes.columnconfigure(0, weight=1)
        frame_opcoes.columnconfigure(1, weight=1)
        
        # Checkbox Frete Embutido
        frame_frete = ttk.Frame(frame_opcoes)
        frame_frete.grid(row=0, column=0, sticky="w", padx=(0, 20))
        ttk.Checkbutton(frame_frete, text="Frete embutido no VCMV",
                        variable=self.frete_embutido, command=self._atualizar_info_custos) \
            .grid(row=0, column=0, sticky="w")
        ttk.Label(frame_frete, text="(Marque se INCOTERM for CFR ou CIF)",
                font=("Arial", 8), foreground="gray") \
            .grid(row=1, column=0, sticky="w")
        
        # Checkbox Seguro Embutido
        frame_seguro = ttk.Frame(frame_opcoes)
        frame_seguro.grid(row=0, column=1, sticky="w")
        ttk.Checkbutton(frame_seguro, text="Seguro embutido no VCMV",
                        variable=self.seguro_embutido, command=self._atualizar_info_custos) \
            .grid(row=0, column=0, sticky="w")
        ttk.Label(frame_seguro, text="(Marque se INCOTERM for CIF)",
                font=("Arial", 8), foreground="gray") \
            .grid(row=1, column=0, sticky="w")
        
        # Label informativo
        self.lbl_info_custos = ttk.Label(grupo_custos,
                                        text="ℹ️ Configuração atual: Frete e seguro separados (INCOTERM FOB/EXW)",
                                        font=("Arial", 9), foreground="blue")
        self.lbl_info_custos.grid(row=1, column=0, columnspan=6, pady=(10, 0))
        
        # 3. Estado Destino e Incentivos Fiscais
        grupo_estado = ttk.LabelFrame(frm, text="3. Estado Destino e Incentivos Fiscais", padding=15)
        grupo_estado.grid(row=4, column=0, columnspan=6, sticky="ew", pady=(0, 15))
        
        # Configurar grid do grupo_estado
        grupo_estado.columnconfigure(1, weight=1)
        
        # Linha 1: Estado destino
        ttk.Label(grupo_estado, text="Estado de Destino:").grid(row=0, column=0, sticky="w", padx=(0, 5))
        estados_combo = ttk.Combobox(grupo_estado, textvariable=self.estado_destino,
                                values=[f"{codigo} - {ALIQ_ICMS_ESTADOS[codigo]['nome']}" 
                                        for codigo in ALIQ_ICMS_ESTADOS.keys()],
                                width=25, state="readonly")
        estados_combo.grid(row=0, column=1, sticky="w", padx=(0, 20))
        estados_combo.bind("<<ComboboxSelected>>", self._atualizar_info_estado)
        
        # Checkbox para aplicar incentivo
        ttk.Checkbutton(grupo_estado, text="Aplicar Incentivo Fiscal",
                    variable=self.aplicar_incentivo,
                    command=self._atualizar_info_incentivo).grid(row=0, column=2, sticky="w", padx=(0, 20))
        
        # Linha 2: Tipo de operação  
        ttk.Label(grupo_estado, text="Tipo de Operação:").grid(row=1, column=0, sticky="w", padx=(0, 5))
        operacao_combo = ttk.Combobox(grupo_estado, textvariable=self.tipo_operacao,
                                    values=["interestadual", "interna"], width=15, state="readonly")
        operacao_combo.grid(row=1, column=1, sticky="w", padx=(0, 20))
        
        # Checkbox para similar nacional
        ttk.Checkbutton(grupo_estado, text="Produto tem similar nacional",
                    variable=self.tem_similar_nacional).grid(row=1, column=2, sticky="w", padx=(0, 20))
        
        # Label informativo sobre o incentivo (com mais espaço)
        self.lbl_info_incentivo = ttk.Label(grupo_estado,
                                        text="ℹ️ Selecione um estado para ver os incentivos disponíveis",
                                        font=("Arial", 9), foreground="blue", wraplength=950)
        self.lbl_info_incentivo.grid(row=2, column=0, columnspan=3, sticky="ew", pady=(10, 0))
        
        # 3B. Configurações Especiais
        grupo_config_especiais = ttk.LabelFrame(frm, text="3B. Configurações Especiais (Opcional)", padding=15)
        grupo_config_especiais.grid(row=5, column=0, columnspan=6, sticky="ew", pady=(0, 15))
        
        # Usar grid em vez de pack para melhor controle
        grupo_config_especiais.columnconfigure(0, weight=1)
        
        # Primeira linha
        config_frame1 = ttk.Frame(grupo_config_especiais)
        config_frame1.grid(row=0, column=0, sticky="ew", pady=(0, 5))
        
        ttk.Checkbutton(config_frame1, text="Redução base ICMS entrada",
                    variable=self.reducao_base_entrada).grid(row=0, column=0, sticky="w", padx=(0, 10))
        ttk.Label(config_frame1, text="Base (%):").grid(row=0, column=1, sticky="w", padx=(0, 2))
        ttk.Entry(config_frame1, textvariable=self.percentual_reducao_entrada, width=8).grid(row=0, column=2, padx=(0, 30))
        
        ttk.Checkbutton(config_frame1, text="Dólar contratado diferente",
                    variable=self.dolar_diferenciado).grid(row=0, column=3, sticky="w", padx=(0, 10))
        ttk.Label(config_frame1, text="Taxa:").grid(row=0, column=4, sticky="w", padx=(0, 2))
        ttk.Entry(config_frame1, textvariable=self.taxa_contratada, width=10).grid(row=0, column=5)
        
        # Segunda linha
        config_frame2 = ttk.Frame(grupo_config_especiais)
        config_frame2.grid(row=1, column=0, sticky="ew", pady=(0, 5))
        
        ttk.Checkbutton(config_frame2, text="ICMS-ST na entrada",
                    variable=self.st_entrada).grid(row=0, column=0, sticky="w", padx=(0, 10))
        ttk.Label(config_frame2, text="Alíquota ST (%):").grid(row=0, column=1, sticky="w", padx=(0, 2))
        ttk.Entry(config_frame2, textvariable=self.aliquota_st_entrada, width=8).grid(row=0, column=2, padx=(0, 30))
        
        ttk.Button(config_frame2, text="⚙️ Configurações Avançadas...",
                command=self._abrir_config_avancadas).grid(row=0, column=3, sticky="w")
        
        # 4. Despesas Adicionais e ICMS
        grupo_extras = ttk.LabelFrame(frm, text="4. Despesas Adicionais e ICMS (preencher se não detectadas automaticamente)", padding=15)
        grupo_extras.grid(row=6, column=0, columnspan=6, sticky="ew", pady=(0, 15))
        
        ttk.Label(grupo_extras, text="AFRMM (R$):").grid(row=0, column=0, sticky="w", padx=(0, 5))
        ttk.Entry(grupo_extras, textvariable=self.valor_afrmm, width=12).grid(row=0, column=1, sticky="w", padx=(0, 20))
        
        ttk.Label(grupo_extras, text="SISCOMEX (R$):").grid(row=0, column=2, sticky="w", padx=(0, 5))
        ttk.Entry(grupo_extras, textvariable=self.valor_siscomex, width=12).grid(row=0, column=3, sticky="w", padx=(0, 20))
        
        ttk.Label(grupo_extras, text="Alíquota ICMS (%):").grid(row=0, column=4, sticky="w", padx=(0, 5))
        ttk.Entry(grupo_extras, textvariable=self.aliquota_icms, width=8).grid(row=0, column=5, sticky="w")
        
        ttk.Label(grupo_extras, text="(O sistema tentará extrair AFRMM e SISCOMEX automaticamente das informações complementares. Se não encontrar, use os campos acima. GO: 19%, SP/RJ/MG: 18%)",
                font=("Arial", 8), foreground="gray").grid(row=1, column=0, columnspan=6, sticky="w", pady=(5, 0))
        
        # 5. Local para salvar Excel
        grupo_arq_excel = ttk.LabelFrame(frm, text="5. Local para Salvar o Excel", padding=15)
        grupo_arq_excel.grid(row=7, column=0, columnspan=6, sticky="ew", pady=(0, 15))
        grupo_arq_excel.columnconfigure(1, weight=1)
        
        ttk.Label(grupo_arq_excel, text="Salvar como:").grid(row=0, column=0, sticky="w", padx=(0, 10))
        ttk.Entry(grupo_arq_excel, textvariable=self.excel_path, state="readonly") \
            .grid(row=0, column=1, sticky="ew", padx=(0, 10))
        ttk.Button(grupo_arq_excel, text="Escolher Local…", command=self._escolher_local) \
            .grid(row=0, column=2)
        
        # 6. Processamento
        grupo_proc = ttk.LabelFrame(frm, text="6. Processamento", padding=15)
        grupo_proc.grid(row=8, column=0, columnspan=6, sticky="ew", pady=(0, 15))
        
        botoes_frame = ttk.Frame(grupo_proc)
        botoes_frame.pack()
        
        self.bt_exec = ttk.Button(botoes_frame, text="🧮 Gerar Extrato com Custos, ICMS e Despesas",
                                command=self._executar, state="disabled")
        self.bt_exec.pack(side="left", padx=(0, 20))
        
        # NOVO: Botão para módulo de precificação
        self.bt_precificacao = ttk.Button(botoes_frame, text="💰 Abrir Módulo de Precificação",
                                        command=self._abrir_precificacao, state="disabled")
        self.bt_precificacao.pack(side="left")
        
        # 7. Status
        grupo_status = ttk.LabelFrame(frm, text="7. Status", padding=15)
        grupo_status.grid(row=9, column=0, columnspan=6, sticky="ew")
        grupo_status.columnconfigure(0, weight=1)
        
        self.lbl = ttk.Label(grupo_status,
                            text="🎯 VERSÃO COMPLETA COM ICMS, DESPESAS E MÓDULO DE PRECIFICAÇÃO\n"
                                "• Extrai SISCOMEX e AFRMM automaticamente das informações complementares\n"
                                "• Permite entrada manual de valores caso não sejam detectados\n"
                                "• Calcula ICMS de importação com alíquota configurável por estado\n"
                                "• Inclui TODOS os tributos e despesas no cálculo de custos por item\n"
                                "• NOVO: Módulo de precificação com cálculo de preços de venda\n"
                                "• NOVO: Considera créditos tributários nos regimes real e presumido\n"
                                "• NOVO: Impostos sobre venda calculados corretamente (por dentro/por fora)\n"
                                "1. Selecione o arquivo XML da DI\n"
                                "2. Configure os custos conforme INCOTERM\n"
                                "3. Preencha despesas manuais se necessário\n"
                                "4. Configure alíquota ICMS conforme estado de destino\n"
                                "5. Gere o extrato de custos\n"
                                "6. Use o módulo de precificação para calcular preços de venda",
                            wraplength=850, foreground="green")
        self.lbl.grid(row=0, column=0, sticky="w")
        
        # Configurar weight das colunas
        frm.columnconfigure(1, weight=1)

    
    def _atualizar_info_custos(self):
        """Atualiza o texto informativo baseado nas opções selecionadas"""
        frete = self.frete_embutido.get()
        seguro = self.seguro_embutido.get()
        
        if frete and seguro:
            texto = "⚠️ Configuração: Frete E seguro embutidos no VCMV (INCOTERM CIF)"
            cor = "red"
        elif frete:
            texto = "⚠️ Configuração: Frete embutido no VCMV (INCOTERM CFR)"
            cor = "orange"
        elif seguro:
            texto = "⚠️ Configuração: Seguro embutido no VCMV (raro, verificar INCOTERM)"
            cor = "orange"
        else:
            texto = "ℹ️ Configuração: Frete e seguro separados (INCOTERM FOB/EXW)"
            cor = "blue"
        
        self.lbl_info_custos.config(text=texto, foreground=cor)

    def _atualizar_info_estado(self, event=None):
        """Atualiza informações quando estado é alterado"""
        estado_codigo = self.estado_destino.get().split(" - ")[
            0] if " - " in self.estado_destino.get() else self.estado_destino.get()

        # Atualizar alíquota ICMS padrão
        aliquota = obter_aliquota_icms_estado(estado_codigo)
        self.aliquota_icms.set(f"{aliquota * 100:.1f}")

        self._atualizar_info_incentivo()

    def _atualizar_info_incentivo(self):
        """Atualiza informações sobre incentivo fiscal"""
        estado_codigo = self.estado_destino.get().split(" - ")[
            0] if " - " in self.estado_destino.get() else self.estado_destino.get()
        incentivo = obter_incentivos_por_estado(estado_codigo)

        if self.aplicar_incentivo.get() and incentivo:
            texto = f"✅ {incentivo['nome']}: {incentivo['descricao'][:100]}..."
            texto += f"\n📋 Condições principais: {'; '.join(incentivo['condicoes'][:2])}..."
            cor = "green"
        elif incentivo:
            texto = f"❌ Incentivo disponível mas não aplicado: {incentivo['nome']}"
            cor = "orange"
        else:
            texto = "❌ Nenhum incentivo fiscal disponível para este estado"
            cor = "red"

        self.lbl_info_incentivo.config(text=texto, foreground=cor)

    def _abrir_config_avancadas(self):
        """Placeholder para configurações avançadas"""
        messagebox.showinfo("Em Desenvolvimento",
                            "Funcionalidade de configurações avançadas será implementada em versão futura.\n\n"
                            "Use as opções básicas disponíveis na interface principal.")

    def _abrir_xml(self):
        f = filedialog.askopenfilename(title="Selecione o XML da DI",
                                     filetypes=[("XML", "*.xml"), ("Todos arquivos", "*.*")])
        if f:
            self.xml_path.set(f)
            xml_name = Path(f).stem
            sugestao = Path(f).parent / f"ExtratoDI_COMPLETO_{xml_name}.xlsx"
            self.excel_path.set(str(sugestao))
            self._verificar_pronto()
            self.lbl.config(text=f"✅ XML selecionado: {Path(f).name}\n"
                                f"Configure os custos e despesas, depois escolha onde salvar o Excel.")
            
            # Tentar detectar INCOTERM automaticamente
            self._detectar_incoterm_automatico(f)
            
            # Tentar pré-carregar despesas das informações complementares
            self._precarregar_despesas(f)
    
    def _precarregar_despesas(self, xml_path):
        """Tenta pré-carregar despesas das informações complementares"""
        try:
            tree = ET.parse(xml_path)
            root = tree.getroot()
            di = root.find("declaracaoImportacao")
            
            if di is not None:
                info_comp = di.findtext("informacaoComplementar", "")
                if info_comp:
                    despesas = extrair_despesas_informacao_complementar(info_comp)
                    
                    if despesas.get("AFRMM R$", 0) > 0:
                        self.valor_afrmm.set(f"{despesas['AFRMM R$']:.2f}")
                    
                    if despesas.get("SISCOMEX R$", 0) > 0:
                        self.valor_siscomex.set(f"{despesas['SISCOMEX R$']:.2f}")
                    
                    # Mostrar mensagem se encontrou algo
                    total_encontrado = despesas.get("AFRMM R$", 0) + despesas.get("SISCOMEX R$", 0)
                    if total_encontrado > 0:
                        messagebox.showinfo("Despesas Detectadas!",
                                          f"Despesas encontradas automaticamente nas informações complementares:\n\n"
                                          f"• AFRMM: R$ {despesas.get('AFRMM R$', 0):,.2f}\n"
                                          f"• SISCOMEX: R$ {despesas.get('SISCOMEX R$', 0):,.2f}\n\n"
                                          f"Os valores foram preenchidos automaticamente.\n"
                                          f"Você pode editá-los se necessário antes de processar.")
        except Exception as e:
            # Ignorar erros de pré-carregamento
            pass
    
    def _detectar_incoterm_automatico(self, xml_path):
        """Tenta detectar INCOTERM do XML e sugerir configuração"""
        try:
            tree = ET.parse(xml_path)
            root = tree.getroot()
            di = root.find("declaracaoImportacao")
            
            if di is not None:
                primeiro_adicao = di.find("adicao")
                if primeiro_adicao is not None:
                    incoterm = primeiro_adicao.findtext("condicaoVendaIncoterm", "")
                    
                    if incoterm in ["CFR", "CIF"]:
                        self.frete_embutido.set(True)
                        if incoterm == "CIF":
                            self.seguro_embutido.set(True)
                        
                        self._atualizar_info_custos()
                        
                        messagebox.showinfo("INCOTERM Detectado!",
                                          f"INCOTERM {incoterm} detectado no XML!\n\n"
                                          f"Configuração automática aplicada:\n"
                                          f"• Frete embutido: {'Sim' if self.frete_embutido.get() else 'Não'}\n"
                                          f"• Seguro embutido: {'Sim' if self.seguro_embutido.get() else 'Não'}\n\n"
                                          f"⚠️ IMPORTANTE: Esta configuração evita dupla\n"
                                          f"contabilização do frete/seguro no cálculo de custos.")
        except Exception as e:
            pass
    
    def _escolher_local(self):
        nome_padrao = "ExtratoDI_COMPLETO.xlsx"
        if self.xml_path.get():
            xml_name = Path(self.xml_path.get()).stem
            nome_padrao = f"ExtratoDI_COMPLETO_{xml_name}.xlsx"
        
        f = filedialog.asksaveasfilename(
            title="Salvar Extrato Excel como...",
            defaultextension=".xlsx",
            initialfilename=nome_padrao,
            filetypes=[("Excel", "*.xlsx"), ("Todos arquivos", "*.*")]
        )
        
        if f:
            self.excel_path.set(f)
            self._verificar_pronto()
            self.lbl.config(text=f"✅ Excel será salvo como: {Path(f).name}\n" +
                               ("✅ Pronto para processar!" if self.xml_path.get() else "Selecione o XML da DI."))
    
    def _verificar_pronto(self):
        if self.xml_path.get() and self.excel_path.get():
            self.bt_exec.config(state="normal")
            self.lbl.config(text="🚀 Pronto para gerar extrato completo com ICMS e despesas!", foreground="green")
        else:
            self.bt_exec.config(state="disabled")
    
    def _abrir_precificacao(self):
        """Abre o módulo de precificação"""
        if not self.dados_processados:
            messagebox.showwarning("Aviso", "Execute primeiro o processamento do XML!")
            return
        
        # Abrir janela de precificação
        JanelaPrecificacao(self, self.dados_processados)
    
    def _executar(self):
        try:
            self.bt_exec.config(state="disabled")
            self.lbl.config(text="🔄 Processando XML, extraindo despesas e calculando custos com ICMS... Aguarde.", 
                           foreground="blue")
            self.update()
            
            # Processar dados
            dados = carrega_di_completo(Path(self.xml_path.get()))

            # Calcular custos com as opções selecionadas
            estado_codigo = self.estado_destino.get().split(" - ")[
                0] if " - " in self.estado_destino.get() else self.estado_destino.get()

            # Calcular custos com as opções selecionadas
            estado_codigo = self.estado_destino.get().split(" - ")[
                0] if " - " in self.estado_destino.get() else self.estado_destino.get()

            # PREPARAR CONFIGURAÇÕES ESPECIAIS
            config_especiais = CONFIGURACOES_ESPECIAIS_DEFAULT.copy()

            # Aplicar configurações básicas da interface
            if self.reducao_base_entrada.get():
                config_especiais["reducao_base_entrada"]["ativo"] = True
                config_especiais["reducao_base_entrada"]["percentual"] = float(
                    self.percentual_reducao_entrada.get() or "100")

            if self.dolar_diferenciado.get():
                config_especiais["dolar_diferenciado"]["ativo"] = True
                config_especiais["dolar_diferenciado"]["taxa_contratada"] = float(self.taxa_contratada.get() or "5.0")

            if self.st_entrada.get():
                config_especiais["substituicao_tributaria"]["st_entrada"]["ativo"] = True
                config_especiais["substituicao_tributaria"]["st_entrada"]["aliquota_st"] = float(
                    self.aliquota_st_entrada.get() or "0") / 100

            calcular_custos_unitarios(dados,
                        frete_embutido=self.frete_embutido.get(),
                        seguro_embutido=self.seguro_embutido.get(),
                        afrmm_manual=self.valor_afrmm.get(),
                        siscomex_manual=self.valor_siscomex.get(),
                        aliquota_icms_manual=self.aliquota_icms.get(),
                        # SEUS PARÂMETROS EXISTENTES
                        estado_destino=estado_codigo,
                        aplicar_incentivo=self.aplicar_incentivo.get(),
                        tipo_operacao=self.tipo_operacao.get(),
                        tem_similar_nacional=self.tem_similar_nacional.get(),
                        # NOVOS PARÂMETROS OPCIONAIS
                        configuracoes_especiais=config_especiais,
                        xml_path=self.xml_path.get())

            # Validar custos
            dados["validacao_custos"] = validar_custos(dados,
                                                     frete_embutido=self.frete_embutido.get(),
                                                     seguro_embutido=self.seguro_embutido.get())
            
            # Armazenar dados para precificação
            self.dados_processados = dados
            self.bt_precificacao.config(state="normal")
            
            # Gerar arquivo Excel
            excel_path = Path(self.excel_path.get())
            gera_excel_completo(dados, excel_path)
            
            # Estatísticas
            num_adicoes = len(dados.get('adicoes', []))
            total_itens = sum(len(ad.get('itens', [])) for ad in dados.get('adicoes', []))
            validacao = dados.get('validacao_custos', {})
            status_validacao = validacao.get('Status', 'N/A')
            diferenca_percent = validacao.get('% Diferença', 0)
            
            # Valores utilizados
            afrmm_usado = dados.get("configuracao_custos", {}).get("AFRMM R$", 0)
            siscomex_usado = dados.get("configuracao_custos", {}).get("Siscomex R$", 0)
            icms_total = dados["tributos"].get("ICMS R$", 0)
            aliquota_icms_usada = dados.get("configuracao_custos", {}).get("Alíquota ICMS (%)", 19)
            
            # PREPARAR CONFIGURAÇÕES ESPECIAIS
            config_especiais = CONFIGURACOES_ESPECIAIS_DEFAULT.copy()

            # Aplicar configurações básicas da interface
            if self.reducao_base_entrada.get():
                config_especiais["reducao_base_entrada"]["ativo"] = True
                config_especiais["reducao_base_entrada"]["percentual"] = float(self.percentual_reducao_entrada.get() or "100")

            if self.dolar_diferenciado.get():
                config_especiais["dolar_diferenciado"]["ativo"] = True
                config_especiais["dolar_diferenciado"]["taxa_contratada"] = float(self.taxa_contratada.get() or "5.0")

            if self.st_entrada.get():
                config_especiais["substituicao_tributaria"]["st_entrada"]["ativo"] = True
                config_especiais["substituicao_tributaria"]["st_entrada"]["aliquota_st"] = float(self.aliquota_st_entrada.get() or "0") / 100
            
            self.lbl.config(text=f"🎉 Extrato completo salvo: {excel_path.name}\n"
                               f"📊 {num_adicoes} adições, {total_itens} itens processados\n"
                               f"💰 AFRMM: R$ {afrmm_usado:,.2f} | SISCOMEX: R$ {siscomex_usado:,.2f}\n"
                               f"🏛️ ICMS ({aliquota_icms_usada:.0f}%): R$ {icms_total:,.2f}\n"
                               f"🔍 Validação: {status_validacao} (diferença: {diferenca_percent:.3f}%)\n"
                               f"💰 Módulo de Precificação disponível!",
                           foreground="green")
            
            # Mensagem de sucesso detalhada
            config_msg = ""
            if self.frete_embutido.get() or self.seguro_embutido.get():
                config_msg = f"\n🔧 Configuração aplicada:\n"
                config_msg += f"• Frete embutido: {'Sim' if self.frete_embutido.get() else 'Não'}\n"
                config_msg += f"• Seguro embutido: {'Sim' if self.seguro_embutido.get() else 'Não'}"
            
            messagebox.showinfo("Extrato Completo Gerado!",
                              f"🎉 Extrato completo gerado com sucesso!\n\n"
                              f"📁 Arquivo: {excel_path.name}\n"
                              f"📊 {num_adicoes} adições processadas\n"
                              f"🛍️ {total_itens} itens com custos detalhados\n"
                              f"💰 AFRMM utilizado: R$ {afrmm_usado:,.2f}\n"
                              f"📋 SISCOMEX utilizado: R$ {siscomex_usado:,.2f}\n"
                              f"🏛️ ICMS calculado ({aliquota_icms_usada:.0f}%): R$ {icms_total:,.2f}\n"
                              f"🔍 Validação: {status_validacao}\n"
                              f"📈 Diferença: {diferenca_percent:.4f}%"
                              f"{config_msg}\n\n"
                              f"✅ Funcionalidades implementadas:\n"
                              f"• Extração automática de despesas das inf. complementares\n"
                              f"• Entrada manual de valores não detectados\n"
                              f"• Cálculo correto do ICMS com alíquota configurável\n"
                              f"• Distribuição de todos os tributos por item individual\n"
                              f"• Planilhas expandidas com análise completa\n"
                              f"• NOVO: Módulo de precificação disponível!")
            
        except Exception as e:
            log.exception(e)
            messagebox.showerror("Erro", f"❌ Erro ao processar:\n{str(e)}")
            self.lbl.config(text=f"❌ Erro: {str(e)}", foreground="red")
        finally:
            self.bt_exec.config(state="normal")

if __name__ == "__main__":
>>>>>>> 7d3bba78094df4422d2bd74265553fe6ba0e419b
    AppExtrato().mainloop()