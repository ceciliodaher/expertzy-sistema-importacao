# Complete Pricing Pipeline E2E Tests

Comprehensive end-to-end test suite for the integrated pricing pipeline flow in the Expertzy Sistema de Importação.

## Overview

This test suite validates the complete integration between:
- XML Import & DI Processing
- Compliance Calculation
- Pricing Engine with 4 Cost Types
- Tax Regime Integration
- Monophasic Product Handling
- NO FALLBACKS Compliance

## Test Files

### Core Test Files

- **`test-complete-pricing-pipeline.spec.js`** - Main test suite (846 lines)
- **`test-pricing-pipeline-config.js`** - Configuration and test data (438 lines)
- **`README-pricing-pipeline-tests.md`** - This documentation

### Test Coverage

#### 1. Complete Pipeline Flow
- ✅ XML Import → DI Processing → Pricing Engine
- ✅ Data persistence across module navigation
- ✅ SessionStorage integration
- ✅ Database operations (IndexedDB)

#### 2. Cost Calculation Validation
- ✅ **Custo Base**: `valor_aduaneiro + impostos + despesas + ICMS`
- ✅ **Custo Desembolso**: `custo_base - créditos_tributários` (by regime)
- ✅ **Custo Contábil**: `custo_desembolso + encargos - recuperáveis`
- ✅ **Base Formação Preço**: `custo_contábil + custos_indiretos + margem`

#### 3. Tax Regime Testing
- ✅ **Lucro Real**: Full PIS/COFINS + IPI credits
- ✅ **Lucro Presumido**: IPI credits only
- ✅ **Simples Nacional**: No import credits

#### 4. Monophasic Products
- ✅ Automatic detection by NCM
- ✅ Special credit rules by regime
- ✅ Integration with real data files

#### 5. Error Handling (NO FALLBACKS)
- ✅ Missing required data throws errors
- ✅ Invalid data types rejected
- ✅ No implicit fallback to zero values
- ✅ Nomenclature violations detected

#### 6. Mathematical Accuracy
- ✅ Real configuration files (aliquotas.json, tributacao-monofasica.json)
- ✅ Known test data with expected results
- ✅ Tolerance-based floating point validation
- ✅ Formula verification

## Test Data

### Test XML Structure
```xml
<declaracaoImportacao>
    <numeroDeclaracaoImportacao>24/1234567-0</numeroDeclaracaoImportacao>
    <adicoes>
        <adicao numeroAdicao="001">
            <ncm>8517.12.31</ncm> <!-- Electronics - Regular -->
            <valorAduaneiro>50000.00</valorAduaneiro>
            <tributos>...</tributos>
        </adicao>
        <adicao numeroAdicao="002">
            <ncm>2710.19.21</ncm> <!-- Diesel - Monophasic -->
            <valorAduaneiro>20000.00</valorAduaneiro>
            <tributos>...</tributos>
        </adicao>
    </adicoes>
</declaracaoImportacao>
```

### Expected Calculation Results
```javascript
const EXPECTED_RESULTS = {
    totals: {
        valor_aduaneiro: 70000.00,
        ii_devido: 52800.00,
        ipi_devido: 47850.00,
        pis_devido: 9508.90,
        cofins_devido: 43679.25
    },
    costs: {
        custo_base: 540445.50,
        custo_desembolso_lucro_real: 456445.50,
        custo_desembolso_presumido: 487595.50,
        custo_desembolso_simples: 540445.50
    },
    monophasic: {
        ncm_27101921: {
            is_monophasic: true,
            permite_credito_lucro_real: true
        }
    }
};
```

## Running the Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Start local server
npm start # http://localhost:8000
```

### Execute Tests
```bash
# Run complete pricing pipeline tests
npx playwright test tests/e2e/test-complete-pricing-pipeline.spec.js

# Run with verbose output
npx playwright test tests/e2e/test-complete-pricing-pipeline.spec.js --reporter=verbose

# Run specific test group
npx playwright test tests/e2e/test-complete-pricing-pipeline.spec.js --grep "Cost Types"

# Run in headed mode (see browser)
npx playwright test tests/e2e/test-complete-pricing-pipeline.spec.js --headed
```

### Test Execution Flow
1. **Setup**: Load DI interface, verify modules
2. **XML Import**: Process test XML through DI pipeline
3. **Data Persistence**: Save complete DI (98% functional)
4. **Navigation**: Move to pricing interface
5. **Cost Calculation**: Execute 4 cost types
6. **Regime Testing**: Switch between tax regimes
7. **Validation**: Verify mathematical accuracy
8. **Error Testing**: Validate NO FALLBACKS compliance

## Test Scenarios

### Scenario 1: Mixed Products (Regular + Monophasic)
- **Products**: Electronics (8517.12.31) + Diesel (2710.19.21)
- **Focus**: Tax credit differences by regime
- **Validation**: Monophasic detection and credit calculation

### Scenario 2: Error Handling
- **Focus**: NO FALLBACKS policy compliance
- **Tests**: Missing data, invalid types, nomenclature violations
- **Expected**: Proper error messages, no silent failures

### Scenario 3: Navigation & Persistence
- **Focus**: Data flow between modules
- **Tests**: SessionStorage, IndexedDB integration
- **Validation**: Data preserved across navigation

## Performance Benchmarks

| Operation | Max Time | Description |
|:--- |:--- |:--- |
| XML Processing | 30s | Import & parse large XML files |
| DI Saving | 5s | Save complete DI to IndexedDB |
| Cost Calculation | 1s | All 4 cost types |
| Pricing Analysis | 2s | Complete pricing scenarios |
| Database Operations | 500ms | CRUD operations |
| UI Response | 200ms | Interface updates |

## Validation Rules

### Mathematical Accuracy
- **Tolerance**: 0.01 (1 cent) for currency calculations
- **Percentage**: 0.001 (0.1%) for rate calculations
- **Formulas**: Validated against expected results

### Tax Regime Rules
```javascript
// Lucro Real: Full credits
creditos = pis_import + cofins_import + ipi_integral

// Lucro Presumido: IPI only
creditos = ipi_integral

// Simples Nacional: No import credits
creditos = 0
```

### Monophasic Detection
- **Method**: NCM prefix matching + exact validation
- **Sources**: tributacao-monofasica.json
- **Categories**: Petroleum, medicines, vehicles, beverages, etc.

## Error Patterns

### NO FALLBACKS Validation
```javascript
// ❌ Forbidden: Silent fallbacks
const value = data.valor || 0; // VIOLATION

// ✅ Required: Explicit validation
if (!data.valor) {
    throw new Error('Valor obrigatório não fornecido');
}
```

### Nomenclature Enforcement
```javascript
// ❌ Forbidden field names
mercadorias -> produtos
despesas -> despesas_aduaneiras
tax_regime -> regime_tributario
base_cost -> custo_base
```

## Configuration Files Used

### Real Data Integration
- **`aliquotas.json`**: ICMS rates by state (2025)
- **`tributacao-monofasica.json`**: Monophasic product rules
- **`beneficios.json`**: Tax incentive programs
- **`ncms-vedados.json`**: Restricted NCMs by program

### Test Configuration
- **Timeouts**: Page load, module init, calculations
- **Tolerances**: Mathematical precision settings
- **Benchmarks**: Performance expectations
- **Scenarios**: Predefined test cases with expected results

## Troubleshooting

### Common Issues

#### Module Not Loaded
```
Error: window.PricingEngine is not defined
```
**Solution**: Verify all modules are loaded in di-interface.html

#### Calculation Mismatch
```
Expected: 456445.50, Actual: 456445.51
```
**Solution**: Check tolerance settings in test configuration

#### Navigation Failure
```
Error: Data not preserved across navigation
```
**Solution**: Verify SessionStorage implementation

#### Database Errors
```
Error: IndexedDB operation failed
```
**Solution**: Check schema version and table structure

### Debug Mode
```bash
# Enable debug logging
DEBUG=1 npx playwright test tests/e2e/test-complete-pricing-pipeline.spec.js

# Generate test trace
npx playwright test --trace=on

# Show browser console
npx playwright test --headed --reporter=verbose
```

## Development Guidelines

### Adding New Tests
1. Follow existing naming conventions
2. Use configuration from `test-pricing-pipeline-config.js`
3. Include expected results for validation
4. Test both success and error cases
5. Validate mathematical accuracy

### Test Data Maintenance
- Update `EXPECTED_RESULTS` for formula changes
- Sync with real configuration files
- Maintain test XML with realistic data
- Document assumptions and calculations

### Performance Monitoring
- Run benchmarks regularly
- Monitor test execution time
- Profile memory usage during tests
- Optimize slow operations

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Run Pricing Pipeline E2E Tests
  run: |
    npm start &
    sleep 10
    npx playwright test tests/e2e/test-complete-pricing-pipeline.spec.js --reporter=github
```

### Test Reports
- HTML report with screenshots on failure
- JUnit XML for CI integration
- Performance metrics logging
- Coverage reports for tested modules

---

## Related Documentation

- [CLAUDE.md](../../CLAUDE.md) - Main system documentation
- [PricingEngine.js](../../src/core/engines/PricingEngine.js) - Core pricing logic
- [DIProcessor.js](../../src/core/processors/DIProcessor.js) - DI processing system
- [ComplianceCalculator.js](../../src/core/calculators/ComplianceCalculator.js) - Tax calculations

For questions or issues, refer to the main project documentation or test configuration comments.