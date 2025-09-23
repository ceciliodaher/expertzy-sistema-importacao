<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" class="logo" width="120"/>

# Especificação Funcional e Técnica

Sistema de Gestão de DI, Custos de Importação e Formação de Preço de Venda

## 1. Objetivo

Entregar um **web-app** que:

1. Importe automaticamente o arquivo XML da DI (ou planilha .xlsx extraída do sistema da Receita).
2. Execute todos os cálculos hoje distribuídos nas planilhas “ADMIN_*”, “Preço Venda …” e “Base Legal”.
3. Solicite ao usuário apenas informações que **não constam no XML**, como:
    * Taxa de câmbio efetivamente contratada.
    * Percentual de comissão.
    * Margem desejada por tipo de cliente (consumidor final ou revenda).
    * Parametrizações pontuais (alíquota estadual fora do default, escolha de regime tributário, etc.).
4. Gere, com um clique, os mesmos relatórios hoje existentes nas abas de preço de venda, custos, espelho da DI e canetinha/comercial, em PDF e XLSX.
5. Armazene o histórico de cada importação para posteriores auditorias.

## 2. Arquitetura de Alto Nível

| Camada | Responsabilidade | Principais Tecnologias |
| :-- | :-- | :-- |
| Front-end | Interface de importação, telas de edição de parâmetros, dashboard de relatórios | React + TypeScript |
| API | Regras de negócio, cálculos, orquestração de relatórios | Node.js (NestJS) |
| Engine de Cálculo | Módulo isolado (library) que recebe as estruturas de dados e devolve resultados | TypeScript puro (sem dependências externas para fácil portabilidade) |
| Banco de Dados | Persistência de DIs, parâmetros e logs | PostgreSQL |
| Relatórios | Templates em HTML/Puppeteer → PDF e planilhas geradas via exceljs | Node.js libs |
| Autenticação | RBAC simples (Admin, Usuário, Somente-leitura) | Keycloak ou Auth0 |

*Hospedagem sugerida*: Docker containers em AWS ECS ou DigitalOcean App Platform.

## 3. Modelo de Dados (essencial)

### 3.1 Tabelas mestre

| Tabela | Campos principais | Origem |
| :-- | :-- | :-- |
| **di_header** | di_number (PK), data_registro, tipo_cambio, … | XML / input |
| **di_addition** | id (PK), di_number (FK), addition_no, ncm, peso_liq, valor_aduaneiro, … | XML |
| **di_item** | id, di_addition_id (FK), item_no, descricao, qtd_caixa, qtd_por_caixa, preco_caixa, … | XML |
| **tributo_estado** | uf (PK), mva, fp, icms_revenda, icms_consumidor, … | Planilha “ADMIN_Alíq Estados” \& “ADMIN_Tributos” |
| **param_config** | chave (PK), valor, descricao | Input UI |
| **cambio** | data, moeda, taxa | Input UI |
| **relatorio_log** | id (PK), di_number, tipo_relatorio, timestamp, usuario | Sistema |

### 3.2 Visões / tabelas derivadas

* **custos_importacao** – reúne valores de II, IPI, PIS, COFINS, ICMS, SISCOMEX, capatazia etc.
* **preco_base** – resultado do custo unitário com margem zero.
* **preco_venda** – resultado por UF \& canal de venda (consumidor ou revenda) com margem desejada.

Cada visão é recalculada on-demand pelo engine de cálculo.

## 4. Fluxo de Usuário

1. **Login**
2. **Importar DI**
    * Carrega XML → pré-validação → grava em tabelas.
3. **Preencher parâmetros complementares**
    * Taxa de câmbio.
    * Comissão padrão.
    * Margem desejada (slider ou textbox).
4. **Executar cálculo** (botão “Processar”)
    * Engine faz parsing dos dados, busca alíquotas vigentes e grava resultados.
5. **Visualizar relatórios** (cards):
    * Espelho DI, Custos, Preço de Venda GO-Consumidor, GO-Revenda, Outros Estados, Canetinha.
    * Exportar PDF ou XLSX.
6. **Auditoria**
    * Tela de histórico mostrando importações, parâmetros utilizados e relatórios gerados.

## 5. Engine de Cálculo – Regras Simplificadas

1. **Conversão Cambial**
`valor_USD × taxa_câmbio_informada = valor_R$`
(Somente um fator por DI).
2. **Base de Cálculo de Impostos**
Utilizar pesos e valores por **adição** conforme XML.
Fórmula genérica:

```
base_ii   = valor_aduaneiro
ii        = base_ii × alq_ii
base_ipi  = valor_aduaneiro + ii
ipi       = base_ipi × alq_ipi
base_pis  = valor_aduaneiro + ii + ipi
pis       = base_pis × 0,0165
cofins    = base_pis × 0,076
```

ICMS importação:

```
bc_icms = valor_aduaneiro + ii + ipi + pis + cofins +
          despesas_aduaneiras (frete, seguro, siscomex, capatazia)
icms    = bc_icms × alq_icms / (1 − alq_icms)
```

Todas as alíquotas vêm da tabela **tributo_estado** (estado de destino).
3. **Custo Unitário**

```
custo_unit = (total_custo_di + despesas_nacionalizacao) / quantidade_total_itens
```

4. **Preço Margem Zero**

```
preco_zero = custo_unit + icms_st/difal (quando aplicável) + fp (quando aplicável)
```

5. **Preço Venda**

```
preco_desejado = preco_zero /
        (1 − comissão − frete_percentual − margem_desejada)
```

*IPI é destacado conforme cliente (consumidor leva preço c/IPI; revenda recebe s/IPI).*

## 6. Ponto Único de Parametrização

A tela **Configurações** terá:


| Campo | Tipo | Default | Observação |
| :-- | :-- | :-- | :-- |
| % comissão venda | decimal(4,2) | 0,05 | Pode ser sobrescrito por item |
| % frete | decimal(4,2) | 0 |  |
| Margem desejada consumidor | decimal(4,2) | 0,30 |  |
| Margem desejada revenda | decimal(4,2) | 0,15 |  |
| Regime tributário (Lucro Real / Presumido / Simples) | seletor | Real | Move alíquotas de PIS/COFINS |
| UF padrão de venda | seletor | GO |  |

Todas as demais variáveis vêm de bancos ou do XML.

## 7. Telas Principais

1. **Dashboard**
    * Cards: DI importadas, últimas cotações, relatórios recentes.
2. **Importar DI**
    * Upload XML → preview dos campos críticos → confirmar.
3. **Parâmetros**
    * Seção “Câmbio” (data, taxa)
    * Seção “Configurações gerais”
4. **Relatórios** (grid)
    * Linha por relatório com botões PDF/XLSX.
5. **Auditoria \& Logs**

Wireframes (descritos):

*Cada tela contém barra superior com breadcrumb, search e ícone de usuário. Utilizar Material-UI.*

## 8. Integrações Externas

| Serviço | Uso | Método |
| :-- | :-- | :-- |
| Siscomex WebService (opcional) | Download automático da DI em XML | REST + token |
| Banco Central | Cotação PTAX do dia como sugestão | REST (JSON) |

## 9. Regras de Segurança

* Todas as rotas API protegidas por JWT.
* Upload limitado a 5 MB; somente MIME `application/xml` ou `application/vnd.ms-excel`.
* Logs de erro no banco + Sentry.


## 10. Estratégia de Implantação

1. **Sprint 0** – setup repositório, CI/CD, Docker, skeleton front/back.
2. **Sprint 1** – importação DI + modelagem BD.
3. **Sprint 2** – Engine de cálculo com custos de importação.
4. **Sprint 3** – Formação de preço de venda.
5. **Sprint 4** – Geração de relatórios PDF/XLSX.
6. **Sprint 5** – Interface completa de parâmetros + autenticação.
7. **Sprint 6** – Testes automatizados (Jest, Cypress) e homologação com planilha legada.
8. **Sprint 7** – Documentação do usuário final e go-live.

## 11. Metodologia de Validação

1. Importar as DIs-modelo já utilizadas na planilha.
2. Rodar planilha original e sistema, exportar CSV dos relatórios.
3. Diferença máxima tolerada: **±R\$0,01** por item.
4. Assinar termo de aceite.

## 12. Manutenibilidade

* Engine de cálculo isolada → novas fórmulas = nova versão NPM.
* Tabelas de alíquotas editáveis na UI (somente Admin).
* Scripts de migração de banco via Prisma Migrate.

**Este documento é suficiente para que o desenvolvedor:**

1. Crie o esquema de banco, API e front-end.
2. Implemente as fórmulas sem consultar a planilha.
3. Entregue relatórios idênticos, porém com lógica simplificada e parametrizada.

<div style="text-align: center">⁂</div>

[^1]: ENTRA-DI-Detalhado-v-4.1.xlsx

