# CLAUDE.md - Sistema Integrado de Gestão de Declarações de Importação

## Visão Geral do Sistema

Sistema web modular para processamento automatizado de Declarações de Importação (DI) com duas funcionalidades principais integradas:

- **Geração automatizada de croquis** de notas fiscais de entrada
- **Cálculo preciso de precificação** com múltiplos regimes tributários e incentivos fiscais

**IMPLEMENTAÇÃO SISTEMA PROGRESSIVO**: 23/09/2025
**STATUS ATUAL**: Sistema 100% funcional e estável
**MIGRAÇÃO new URL() COMPLETA**: 24/09/2025 - Sistema universal sem PathResolver
**MÓDULO PRECIFICAÇÃO COMPLETO**: 25/09/2025 - FASE 2.4.3 CONCLUÍDA - Pipeline completo DI → Custos → Preços
**MIGRAÇÃO VITE CONCLUÍDA**: 26/09/2025 - Sistema migrado do Express para Vite com otimizações modernas
**CORREÇÕES CRÍTICAS FINALIZADAS**: 26/09/2025 - Todos erros Dexie/ES6 corrigidos, arquitetura estabilizada
**FRETE/SEGURO INCOTERM IMPLEMENTADO**: 27/09/2025 - Lógica INCOTERM zero correta, NO FALLBACKS, SOLID aplicado
**PRÓXIMA FASE**: Cenários comparativos e relatórios avançados

## 🏛️ NOMENCLATURA OFICIAL

**DOCUMENTAÇÃO DETALHADA**: Ver arquivo `documentos/Nomenclatura-DIProcessor-xml-detalhada.md`

### Regra Fundamental
**DIProcessor.js é o PRIMARY CREATOR** - único módulo autorizado a criar nomenclatura de campos. Todos os outros módulos DEVEM seguir exatamente seus nomes de campos.

### Hierarquia de Autoridade:
1. **DIProcessor.js**: PRIMARY CREATOR (cria nomenclatura oficial)
2. **IndexedDBManager.js**: Implementa schema seguindo DIProcessor  
3. **Demais módulos**: CONSUMERS (seguem nomenclatura estabelecida)

**Para consultar tabelas completas, mapeamentos XML e exemplos detalhados, consulte: `documentos/Nomenclatura-DIProcessor-xml-detalhada.md`**

## 🔧 PRINCÍPIOS DE DESENVOLVIMENTO - SOLID

### Princípios Fundamentais Aplicados

#### **✅ SOLID Principles**
- **S - Single Responsibility**: Cada classe tem uma única responsabilidade
  - `DIProcessor`: Apenas processamento XML e extração de dados
  - `ComplianceCalculator`: Apenas cálculos tributários
  - `ExcelExporter`/`CroquiNFExporter`: Apenas formatação e export
  
- **O - Open/Closed**: Aberto para extensão, fechado para modificação
  - Novos regimes tributários via configuração JSON
  - Extensibilidade via plugins sem alterar código base

- **L - Liskov Substitution**: Subtipos substituíveis sem quebrar funcionalidade
  - Interfaces de exporters intercambiáveis
  - Validators polimórficos

- **I - Interface Segregation**: Interfaces específicas e focadas
  - Separação clara entre interfaces de cálculo, validação e export
  - Módulos não dependem de interfaces que não usam

- **D - Dependency Inversion**: Dependência de abstrações, não concretizações
  - IndexedDB como abstração de persistência
  - Configurações JSON como abstrações de regras tributárias

#### **✅ NO FALLBACKS Principle**
- **Falha rápida**: Sistema deve falhar explicitamente quando dados obrigatórios ausentes
- **Mensagens claras**: Erros específicos indicam exatamente o que está faltando
- **Zero hardcoded data**: Configurações externas, nunca valores padrão no código
- **Exemplo**: `throw new Error('campo_obrigatório ausente')` ao invés de `|| valorPadrao`

#### **✅ Single Source of Truth**
- **DIProcessor**: PRIMARY CREATOR de nomenclatura de campos
- **IndexedDB**: Única fonte de dados persistidos
- **JSON configs**: Única fonte de regras tributárias
- **Dados fluem**: XML → DIProcessor → ComplianceCalculator → IndexedDB → Exporters

#### **✅ INCOTERM Business Logic**
- **CIF/CFR**: `valor_frete_calculo = 0, valor_seguro_calculo = 0` (já inclusos no preço)
- **FOB**: `valor_frete_calculo = valor_xml, valor_seguro_calculo = valor_xml` (adicionar aos custos)
- **Transparência**: Logs mostram `XML → Cálculo` com justificativa INCOTERM
- **Campos separados**: `valor_frete_xml` (auditoria) vs `valor_frete_calculo` (processamento)

## 🚀 STATUS ATUAL - FASE 2.4.3 CONCLUÍDA

### Pipeline Completo: DI → Custos → Preços
Sistema de precificação 100% funcional com:
- Motor tributário baseado em dados externos (aliquotas.json, tributacao-monofasica.json)
- Cálculo automático de custos de importação
- Formação de preços com múltiplos regimes tributários
- Interface responsiva para simulação de cenários

### Migração new URL() Universal
Sistema migrado para padrão ES2020+ eliminando PathResolver:
- Compatibilidade universal (qualquer IP/domínio/subdiretório)  
- Zero configuração de ambiente
- Performance otimizada

## 📁 Estrutura de Arquivos Principais

```
src/
├── modules/
│   ├── pricing/           # Sistema de precificação
│   ├── croqui/           # Geração de croquis  
│   └── di-processing/    # Processamento de DI
├── shared/
│   ├── data/             # Arquivos JSON (aliquotas, etc)
│   └── utils/            # Utilitários compartilhados
└── interfaces/           # Interfaces web
```

## 🔧 Correções Implementadas (26/09/2025)

### ✅ Erro de Validação Numérica 
**Problema**: "Campo total obrigatório inválido: valor_aduaneiro deve ser numérico"
**Status**: CORRIGIDO - Parsing numérico implementado em `pricing-interface.js`

### ✅ Erro Dashboard - ReferenceError: Dexie is not defined
**Problema**: Dashboard não carregava após migração Vite  
**Status**: CORRIGIDO - Import ES6 adicionado em `dashboard-core.js`

### ✅ Erro Precificação Individual - TypeError crítico
**Problema**: Conflitos export/import e inicialização prematura
**Status**: CORRIGIDO - Exports padronizados e validação robusta implementada

### ✅ Múltiplas Instâncias Dexie
**Problema**: Conflitos entre módulos criando instâncias separadas
**Status**: CORRIGIDO - Singleton pattern implementado em `IndexedDBManager.js`

**Documentação Técnica**: Ver `ARCHITECTURE.md` e `TROUBLESHOOTING.md` para detalhes completos

## 🔧 Correções SOLID e INCOTERM (27/09/2025)

### ✅ Parameter Mismatch TypeError Fix 
**Problema**: `TypeError: can't access property "totais", calculosCompletos.despesas is undefined`
**Status**: CORRIGIDO - Parameter structure padronizada em `calcularTotaisRelatorio` seguindo SOLID (NO FALLBACKS)

### ✅ INCOTERM Zero Logic Implementation
**Problema**: Frete/seguro sempre incluídos nos cálculos independente do INCOTERM
**Status**: CORRIGIDO - Business logic correta implementada:
- **CIF/CFR**: `valor_frete_calculo = 0, valor_seguro_calculo = 0` (já inclusos no preço)
- **FOB**: `valor_frete_calculo = valor_xml, valor_seguro_calculo = valor_xml` (adicionar aos custos)
- **Transparência**: Logs explicam tratamento por INCOTERM
- **Campos separados**: XML (auditoria) vs Cálculo (processamento)

### ✅ Exporters INCOTERM-Aware Update
**Problema**: Exporters usavam fallbacks e campos incorretos
**Status**: CORRIGIDO - Removidos fallbacks, validação rigorosa implementada
- **Croquis NF**: Mostram zero quando INCOTERM inclui frete/seguro
- **Excel**: Valores corretos baseados na lógica INCOTERM
- **NO FALLBACKS**: Falha explícita se dados obrigatórios ausentes

### ✅ Missing Field Validation Enhancement
**Problema**: Validadores usavam fallbacks (|| 0) mascarando problemas
**Status**: CORRIGIDO - Validação rigorosa implementada em `CalculationValidator.js`
- **NO FALLBACKS**: Sistema falha rapidamente com mensagens claras
- **SOLID compliance**: Validação explícita de estruturas obrigatórias

### ✅ Commits Granulares Implementation
**Metodologia**: 5 commits individuais implementados seguindo boas práticas
- Facilita rollback e manutenção
- Histórico claro de mudanças
- Princípios SOLID aplicados consistentemente

## 🚀 SISTEMA VITE (26/09/2025)

### Arquitetura de Desenvolvimento Moderna
- **Dev Server**: `npm run dev` - Vite dev server na porta 8000
- **Build Produção**: `npm run build` - Build otimizado em `/dist`
- **Preview**: `npm run preview` - Server de preview da build
- **Legacy**: `npm run legacy:dev` - Servidor Express original (backup)

### Estrutura Otimizada
```
public/            # Assets estáticos (images, favicon)
src/              # Código fonte com aliases (@core, @shared, etc.)
├── modules/      # Módulos do sistema
├── shared/       # Recursos compartilhados  
└── core/         # Engines e processadores
```

### Performance e Arquitetura ES6
- **Hot Module Replacement (HMR)** para desenvolvimento instantâneo
- **Code Splitting** automático por rotas
- **Tree Shaking** para builds otimizados
- **Legacy support** para browsers antigos
- **Singleton Pattern** para gerenciamento de banco de dados
- **ES6 Modules** com imports/exports padronizados
- **Aliases Vite** (@core, @services, @modules, @shared)

## 📋 Próximas Etapas
- Cenários comparativos de regimes tributários
- Relatórios avançados de análise de custos
- Dashboard executivo com KPIs de importação

## 📚 Documentação Complementar

### Documentação de Negócio
- **Nomenclatura e Padrões**: `documentos/Nomenclatura-DIProcessor-xml-detalhada.md`
- **Especificação Funcional**: `documentos/Especificação Funcional e Técnica.md`
- **Manual de Custos**: `documentos/Manual Completo de Cálculo de Custos na Importação-v2.md`
- **Desenvolvimento Cooperativo**: `documentos/Manual de Desenvolvimento Cooperativo para o Siste.md`

### Documentação Técnica (ES6/Vite)
- **Arquitetura ES6**: `ARCHITECTURE.md` - Padrões, singleton, imports/exports
- **Troubleshooting**: `TROUBLESHOOTING.md` - Resolução de erros Dexie/Vite
- **Build System**: `vite.config.js` - Configuração de aliases e otimizações

## 🏆 Status Final do Sistema

✅ **Sistema 100% Funcional** - Todas as funcionalidades operacionais  
✅ **Arquitetura ES6 Estável** - Imports/exports padronizados  
✅ **Singleton Pattern** - IndexedDBManager centralizado  
✅ **Documentação Completa** - Técnica e funcional  
✅ **Performance Otimizada** - Vite build system  
✅ **SOLID Principles** - Aplicados consistentemente em todo o sistema
✅ **NO FALLBACKS** - Falha rápida com mensagens claras
✅ **INCOTERM Business Logic** - Frete/seguro zero quando apropriado
✅ **Zero Bugs Conhecidos** - Todos erros críticos corrigidos

**Versão**: Vite v7.1.7 + ES6 Modules + SOLID Architecture  
**Data de Estabilização**: 27/09/2025
**Princípios**: SOLID, KISS, DRY, NO FALLBACKS, Single Source of Truth