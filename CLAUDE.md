# CLAUDE.md - Sistema Integrado de Gestão de Declarações de Importação

## Visão Geral do Sistema

Sistema web modular para processamento automatizado de Declarações de Importação (DI) com duas funcionalidades principais integradas:

- **Geração automatizada de croquis** de notas fiscais de entrada
- **Cálculo preciso de precificação** com múltiplos regimes tributários e incentivos fiscais

**IMPLEMENTAÇÃO SISTEMA PROGRESSIVO**: 23/09/2025
**STATUS ATUAL**: Sistema progressivo 98% funcional desde XML
**MIGRAÇÃO new URL() COMPLETA**: 24/09/2025 - Sistema universal sem PathResolver
**MÓDULO PRECIFICAÇÃO COMPLETO**: 25/09/2025 - FASE 2.4.3 CONCLUÍDA - Pipeline completo DI → Custos → Preços
**MIGRAÇÃO VITE CONCLUÍDA**: 26/09/2025 - Sistema migrado do Express para Vite com otimizações modernas
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

## 🔧 Correções de Bugs Conhecidos

### Erro de Validação Numérica (26/09/2025)
**Problema**: "Campo total obrigatório inválido: valor_aduaneiro deve ser numérico"

**Solução**: Em `pricing-interface.js`, adicionar parsing numérico antes da validação:

```javascript
// Em carregarDadosDI (aprox. linha 796)
if (dadosDI) {
    dadosDI.valor_aduaneiro = parseFloat(dadosDI.valor_aduaneiro) || 0;
    dadosDI.valor_frete = parseFloat(dadosDI.valor_frete) || 0;
    dadosDI.valor_seguro = parseFloat(dadosDI.valor_seguro) || 0;
}
```

**Referência detalhada**: Ver `documentos/Nomenclatura-DIProcessor-xml-detalhada.md` seção "Conversão de Tipos"

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

### Performance
- **Hot Module Replacement (HMR)** para desenvolvimento instantâneo
- **Code Splitting** automático por rotas
- **Tree Shaking** para builds otimizados
- **Legacy support** para browsers antigos

## 📋 Próximas Etapas
- Cenários comparativos de regimes tributários
- Relatórios avançados de análise de custos
- Dashboard executivo com KPIs de importação

## 📚 Documentação Complementar

- **Nomenclatura e Padrões**: `documentos/Nomenclatura-DIProcessor-xml-detalhada.md`
- **Especificação Funcional**: `documentos/Especificação Funcional e Técnica.md`
- **Manual de Custos**: `documentos/Manual Completo de Cálculo de Custos na Importação-v2.md`
- **Desenvolvimento Cooperativo**: `documentos/Manual de Desenvolvimento Cooperativo para o Siste.md`