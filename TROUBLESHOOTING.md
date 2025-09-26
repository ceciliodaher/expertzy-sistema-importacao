# 🔧 Troubleshooting - Sistema Expertzy

## Problemas Dexie/Vite Resolvidos (26/09/2025)

### ❌ **ReferenceError: Dexie is not defined**

**Sintomas:**
- Dashboard não carrega com erro `Dexie is not defined`
- Console mostra erro na linha do `new Dexie()`

**Causa:**
- Módulos tentando usar Dexie como variável global após migração Vite
- Falta de import ES6 adequado

**Solução:**
```javascript
// ❌ ERRADO (dependência global)
class DashboardCore {
    constructor() {
        this.db = new Dexie('ExpertzyDB'); // Erro!
    }
}

// ✅ CORRETO (import ES6)
import IndexedDBManager from '@services/database/IndexedDBManager.js';

class DashboardCore {
    constructor() {
        this.dbManager = new IndexedDBManager();
        this.db = this.dbManager.db; // Usar singleton
    }
}
```

### ❌ **TypeError crítico no módulo de precificação individual**

**Sintomas:**
- Erro durante inicialização: "TypeError: ({db:{_middlewares:{dbcore:..."
- Sistema falha ao carregar módulo item-pricing

**Causa:**
- Conflito entre `export class` e `export default`
- Inicialização sem validação de dependências

**Solução:**
```javascript
// ❌ ERRADO (conflito export)
export class ItemPricingCalculator { ... }
export default ItemPricingCalculator; // Conflito!

// ✅ CORRETO (apenas named export)
export class ItemPricingCalculator { ... }

// No arquivo que importa:
import { ItemPricingCalculator } from '@core/calculators/ItemPricingCalculator.js';
```

## Padrões de Arquitetura ES6 Implementados

### **Import/Export Consistente**

```javascript
// ✅ Padrão para classes
export class ClassName { ... }

// ✅ Import correspondente
import { ClassName } from '@path/to/file.js';
```

### **Singleton Pattern IndexedDBManager**

```javascript
// ✅ Uso correto
import IndexedDBManager from '@services/database/IndexedDBManager.js';

class MyModule {
    constructor() {
        this.dbManager = new IndexedDBManager(); // Sempre a mesma instância
        this.db = this.dbManager.db;
    }
    
    async initialize() {
        await this.dbManager.initialize(); // Necessário!
    }
}
```

### **Validação "NO FALLBACKS"**

```javascript
// ✅ Padrão implementado
async _initializeDependencies() {
    // Validar dependências obrigatórias
    if (typeof ItemPricingCalculator === 'undefined') {
        throw new Error('ItemPricingCalculator não disponível - componente obrigatório não carregado');
    }
    
    // Só depois inicializar
    this.calculator = new ItemPricingCalculator();
}
```

## Checklist de Validação

### **Antes de Modificar Código**
- [ ] Verificar se todos os imports são ES6
- [ ] Confirmar que exports são consistentes (apenas `export class`)
- [ ] Validar que IndexedDBManager é usado como singleton

### **Após Modificações**
- [ ] Executar `npm run build` sem erros
- [ ] Testar carregamento de todos os módulos
- [ ] Verificar console do browser sem erros

### **Para Novos Módulos**
- [ ] Usar imports ES6 com aliases (@core, @services, etc.)
- [ ] Implementar validação "NO FALLBACKS"
- [ ] Sempre inicializar IndexedDBManager antes de usar

## Comandos Úteis

```bash
# Testar build
npm run build

# Servidor desenvolvimento
npm run dev

# Verificar sintaxe JS
find src -name "*.js" -exec node -c {} \;
```

## Arquivos Críticos

- **`src/services/database/IndexedDBManager.js`** - Singleton para Dexie
- **`src/modules/dashboard/dashboard-core.js`** - Dashboard principal
- **`src/modules/item-pricing/item-pricing-interface.js`** - Precificação individual
- **`vite.config.js`** - Configuração de aliases e build

## Status do Sistema

✅ **Dashboard**: 100% funcional  
✅ **DI Processing**: 100% funcional  
✅ **Precificação**: 100% funcional  
✅ **Precificação Individual**: 100% funcional  
✅ **Arquitetura ES6**: Consistente  
✅ **Singleton Pattern**: Implementado  

**Última atualização**: 26/09/2025  
**Versão**: Sistema com Vite v7.1.7 + ES6 modules