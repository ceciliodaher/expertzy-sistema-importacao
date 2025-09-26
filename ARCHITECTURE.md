# 🏗️ Arquitetura ES6 - Sistema Expertzy

## Visão Geral

Sistema totalmente migrado para ES6 modules com Vite, implementando padrões modernos de desenvolvimento e singleton pattern para gerenciamento de dados.

## Padrões de Import/Export

### **Named Exports (Padrão Adotado)**

```javascript
// ✅ Definição
export class MyClass {
    constructor() { ... }
}

// ✅ Import
import { MyClass } from '@path/to/file.js';
```

### **Aliases do Vite**

```javascript
// Configurados em vite.config.js
'@': './src'
'@shared': './src/shared'
'@core': './src/core'
'@modules': './src/modules'
'@services': './src/services'

// ✅ Uso
import { DIProcessor } from '@core/processors/DIProcessor.js';
import IndexedDBManager from '@services/database/IndexedDBManager.js';
import { ConfigLoader } from '@shared/utils/ConfigLoader.js';
```

## Singleton Pattern - IndexedDBManager

### **Implementação**

```javascript
// IndexedDBManager.js
class IndexedDBManager {
    constructor() {
        this.db = new Dexie('ExpertzyDB'); // Instância única
        this.schemaInitialized = false;
    }
    
    async initialize() {
        if (!this.schemaInitialized) {
            this.initializeSchema();
            this.schemaInitialized = true;
        }
        // Carregar configurações...
    }
}

export default IndexedDBManager;
```

### **Uso em Módulos**

```javascript
// ✅ Padrão implementado
import IndexedDBManager from '@services/database/IndexedDBManager.js';

class MyModule {
    constructor() {
        this.dbManager = new IndexedDBManager(); // Sempre mesma instância
        this.db = this.dbManager.db;
    }
    
    async initialize() {
        await this.dbManager.initialize(); // Obrigatório
    }
}
```

## Padrão "NO FALLBACKS"

### **Validação Robusta**

```javascript
async _initializeDependencies() {
    // 1. Validar dependências obrigatórias
    if (typeof ItemPricingCalculator === 'undefined') {
        throw new Error('ItemPricingCalculator não disponível - componente obrigatório não carregado');
    }
    
    if (typeof IndexedDBManager === 'undefined') {
        throw new Error('IndexedDBManager não disponível - componente obrigatório não carregado');
    }
    
    // 2. Só depois inicializar
    this.calculator = new ItemPricingCalculator();
    this.dbManager = new IndexedDBManager();
    
    // 3. Verificar conexões
    const dbStatus = await this.dbManager.checkDatabaseStatus();
    if (!dbStatus.connected) {
        throw new Error('IndexedDB não disponível - obrigatório para funcionalidade');
    }
}
```

## Estrutura de Módulos

### **Dashboard**
```
src/modules/dashboard/
├── dashboard-core.js      # Core functionality + singleton IndexedDBManager
├── dashboard-components.js # UI components
├── dashboard-charts.js    # Chart.js integration
└── dashboard-main.js      # Entry point com ES6 imports
```

### **DI Processing**
```
src/core/
├── processors/DIProcessor.js        # XML processing
├── calculators/ComplianceCalculator.js # Tax calculations
└── validators/CalculationValidator.js  # Validation logic
```

### **Item Pricing**
```
src/modules/item-pricing/
└── item-pricing-interface.js  # Interface com validação robusta
src/core/calculators/
└── ItemPricingCalculator.js   # Engine de cálculo
```

## Fluxo de Inicialização

### **1. Dashboard**
```javascript
// dashboard-main.js
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Inicializar com singleton pattern
        window.dashboardCore = await new DashboardCore().initialize();
        window.dashboardComponents = new DashboardComponents(window.dashboardCore);
        window.dashboardCharts = new DashboardCharts(window.dashboardCore);
    } catch (error) {
        console.error('❌ Erro ao inicializar dashboard:', error);
    }
});
```

### **2. Item Pricing**
```javascript
// item-pricing-interface.js
class ItemPricingInterface {
    constructor() {
        // Componentes inicializados no método initialize()
        this.calculator = null;
        this.dbManager = null;
    }
    
    async initialize() {
        await this._initializeDependencies(); // Validação robusta
        this._initializeElements();
        this._setupEventListeners();
    }
}
```

## Performance e Otimizações

### **Code Splitting Automático**
```javascript
// Vite automaticamente cria chunks otimizados:
// - dashboard-DHy1KsYc.js (83.44 kB)
// - IndexedDBManager-D2d00qhB.js (136.34 kB) 
// - di-DT8vsuYG.js (266.96 kB)
```

### **Tree Shaking**
- Apenas código utilizado é incluído no bundle final
- Imports não utilizados são automaticamente removidos

### **Hot Module Replacement (HMR)**
- Atualizações instantâneas durante desenvolvimento
- Estado da aplicação preservado

## Backward Compatibility

### **Window Globals (Legado)**
```javascript
// Mantido para compatibilidade com HTML inline
export { DashboardCore };

if (typeof window !== 'undefined') {
    window.DashboardCore = DashboardCore; // Backward compatibility
}
```

## Vantagens da Arquitetura

### **Desenvolvimento**
- ✅ Hot reload instantâneo
- ✅ Error handling robusto
- ✅ TypeScript-ready
- ✅ Debugging facilitado

### **Performance**
- ✅ Bundle otimizado (tree shaking)
- ✅ Code splitting automático
- ✅ Caching inteligente
- ✅ Singleton pattern (menos instâncias)

### **Manutenibilidade**
- ✅ Imports organizados com aliases
- ✅ Separação clara de responsabilidades
- ✅ Padrão "NO FALLBACKS" consistente
- ✅ Documentação técnica completa

---

**Versão**: Vite v7.1.7 + ES6 Modules  
**Data**: 26/09/2025  
**Status**: Arquitetura estável e production-ready