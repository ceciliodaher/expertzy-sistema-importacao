#!/usr/bin/env node

/**
 * Pricing Pipeline Test Runner
 *
 * Automated test runner for the complete pricing pipeline E2E tests.
 * Provides easy command-line interface for running different test scenarios.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
    testFile: 'tests/e2e/test-complete-pricing-pipeline.spec.js',
    serverPort: 8000,
    serverStartDelay: 3000, // 3 seconds to start server
    playwrightConfig: 'playwright.config.js'
};

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

class PricingTestRunner {
    constructor() {
        this.serverProcess = null;
        this.serverStarted = false;
    }

    log(message, color = 'reset') {
        console.log(`${colors[color]}${message}${colors.reset}`);
    }

    async checkPrerequisites() {
        this.log('🔍 Checking prerequisites...', 'cyan');

        // Check if Node.js modules are installed
        if (!fs.existsSync('node_modules')) {
            this.log('❌ Node modules not found. Run: npm install', 'red');
            return false;
        }

        // Check if Playwright is installed
        try {
            execSync('npx playwright --version', { stdio: 'pipe' });
            this.log('✅ Playwright is installed', 'green');
        } catch (error) {
            this.log('❌ Playwright not found. Run: npx playwright install', 'red');
            return false;
        }

        // Check if test files exist
        if (!fs.existsSync(TEST_CONFIG.testFile)) {
            this.log(`❌ Test file not found: ${TEST_CONFIG.testFile}`, 'red');
            return false;
        }

        this.log('✅ All prerequisites met', 'green');
        return true;
    }

    async startServer() {
        if (this.serverStarted) {
            this.log('⚠️  Server already running', 'yellow');
            return true;
        }

        this.log(`🚀 Starting server on port ${TEST_CONFIG.serverPort}...`, 'cyan');

        try {
            // Start server in background
            this.serverProcess = spawn('npm', ['start'], {
                stdio: 'pipe',
                detached: false
            });

            // Give server time to start
            await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.serverStartDelay));

            // Test if server is responsive
            const testUrl = `http://localhost:${TEST_CONFIG.serverPort}`;

            try {
                const { execSync } = require('child_process');
                execSync(`curl -f -s ${testUrl} > /dev/null`, { stdio: 'pipe' });
                this.log('✅ Server is running and responsive', 'green');
                this.serverStarted = true;
                return true;
            } catch (curlError) {
                this.log('⚠️  Server may not be fully ready, continuing anyway...', 'yellow');
                this.serverStarted = true;
                return true;
            }

        } catch (error) {
            this.log(`❌ Failed to start server: ${error.message}`, 'red');
            return false;
        }
    }

    stopServer() {
        if (this.serverProcess) {
            this.log('🛑 Stopping server...', 'cyan');
            this.serverProcess.kill('SIGTERM');
            this.serverProcess = null;
            this.serverStarted = false;
        }
    }

    async runTests(options = {}) {
        const {
            grep = null,
            headed = false,
            verbose = false,
            reporter = 'list',
            debug = false,
            trace = false
        } = options;

        this.log('🧪 Running Pricing Pipeline E2E Tests...', 'cyan');

        // Build Playwright command
        const cmd = ['npx', 'playwright', 'test', TEST_CONFIG.testFile];

        if (grep) {
            cmd.push('--grep', grep);
        }

        if (headed) {
            cmd.push('--headed');
        }

        if (debug) {
            cmd.push('--debug');
        }

        if (trace) {
            cmd.push('--trace=on');
        }

        cmd.push('--reporter', reporter);

        if (verbose) {
            cmd.push('--reporter=verbose');
        }

        this.log(`Running: ${cmd.join(' ')}`, 'blue');

        try {
            const result = execSync(cmd.join(' '), {
                stdio: 'inherit',
                encoding: 'utf-8'
            });

            this.log('✅ Tests completed successfully!', 'green');
            return true;

        } catch (error) {
            this.log(`❌ Tests failed with exit code: ${error.status}`, 'red');
            return false;
        }
    }

    async generateReport() {
        this.log('📊 Generating test report...', 'cyan');

        try {
            execSync(`npx playwright show-report`, {
                stdio: 'inherit'
            });
        } catch (error) {
            this.log('⚠️  No report available to show', 'yellow');
        }
    }

    async cleanup() {
        this.log('🧹 Cleaning up...', 'cyan');
        this.stopServer();
    }

    // Predefined test scenarios
    async runScenario(scenarioName) {
        const scenarios = {
            'pipeline': {
                description: 'Complete pipeline flow (XML → DI → Pricing)',
                grep: 'Complete Pipeline'
            },
            'costs': {
                description: '4 Cost types calculation validation',
                grep: '4 Cost Types'
            },
            'regimes': {
                description: 'Tax regime switching tests',
                grep: 'Tax Regime'
            },
            'monophasic': {
                description: 'Monophasic product detection and credits',
                grep: 'Monophasic'
            },
            'errors': {
                description: 'NO FALLBACKS and error handling',
                grep: 'NO FALLBACKS'
            },
            'navigation': {
                description: 'Navigation and data persistence',
                grep: 'Navigation'
            },
            'accuracy': {
                description: 'Mathematical accuracy with real data',
                grep: 'Mathematical Accuracy'
            },
            'nomenclature': {
                description: 'Official nomenclature compliance',
                grep: 'Nomenclature'
            }
        };

        const scenario = scenarios[scenarioName];
        if (!scenario) {
            this.log(`❌ Unknown scenario: ${scenarioName}`, 'red');
            this.log('Available scenarios:', 'cyan');
            Object.keys(scenarios).forEach(name => {
                this.log(`  ${name}: ${scenarios[name].description}`, 'blue');
            });
            return false;
        }

        this.log(`🎯 Running scenario: ${scenario.description}`, 'bright');
        return await this.runTests({
            grep: scenario.grep,
            verbose: true,
            reporter: 'verbose'
        });
    }

    printUsage() {
        this.log('🔧 Pricing Pipeline Test Runner', 'bright');
        this.log('');
        this.log('Usage:', 'cyan');
        this.log('  node run-pricing-tests.js [command] [options]', 'blue');
        this.log('');
        this.log('Commands:', 'cyan');
        this.log('  all              Run all tests', 'blue');
        this.log('  scenario <name>  Run specific test scenario', 'blue');
        this.log('  report           Generate and show test report', 'blue');
        this.log('  help             Show this help message', 'blue');
        this.log('');
        this.log('Options:', 'cyan');
        this.log('  --headed         Run tests in headed mode (show browser)', 'blue');
        this.log('  --debug          Run tests in debug mode', 'blue');
        this.log('  --trace          Enable trace recording', 'blue');
        this.log('  --verbose        Verbose output', 'blue');
        this.log('  --grep <pattern> Filter tests by pattern', 'blue');
        this.log('');
        this.log('Examples:', 'cyan');
        this.log('  node run-pricing-tests.js all --headed', 'blue');
        this.log('  node run-pricing-tests.js scenario costs', 'blue');
        this.log('  node run-pricing-tests.js all --grep "Cost Types" --verbose', 'blue');
        this.log('');
        this.log('Test Scenarios:', 'cyan');
        this.log('  pipeline     - Complete XML → DI → Pricing flow', 'blue');
        this.log('  costs        - 4 cost types calculation', 'blue');
        this.log('  regimes      - Tax regime switching', 'blue');
        this.log('  monophasic   - Monophasic product detection', 'blue');
        this.log('  errors       - Error handling and NO FALLBACKS', 'blue');
        this.log('  navigation   - Data persistence across modules', 'blue');
        this.log('  accuracy     - Mathematical accuracy validation', 'blue');
        this.log('  nomenclature - Official nomenclature compliance', 'blue');
    }
}

// Main execution function
async function main() {
    const runner = new PricingTestRunner();

    // Parse command line arguments
    const args = process.argv.slice(2);
    const command = args[0] || 'help';

    const options = {
        headed: args.includes('--headed'),
        debug: args.includes('--debug'),
        trace: args.includes('--trace'),
        verbose: args.includes('--verbose')
    };

    // Extract grep pattern if provided
    const grepIndex = args.indexOf('--grep');
    if (grepIndex !== -1 && grepIndex + 1 < args.length) {
        options.grep = args[grepIndex + 1];
    }

    // Handle cleanup on exit
    process.on('SIGINT', () => {
        runner.log('\n⚠️  Interrupted by user', 'yellow');
        runner.cleanup();
        process.exit(0);
    });

    process.on('exit', () => {
        runner.cleanup();
    });

    try {
        switch (command) {
            case 'all':
                if (!(await runner.checkPrerequisites())) return 1;
                if (!(await runner.startServer())) return 1;
                const success = await runner.runTests(options);
                return success ? 0 : 1;

            case 'scenario':
                const scenarioName = args[1];
                if (!scenarioName) {
                    runner.log('❌ Scenario name required', 'red');
                    runner.printUsage();
                    return 1;
                }
                if (!(await runner.checkPrerequisites())) return 1;
                if (!(await runner.startServer())) return 1;
                const scenarioSuccess = await runner.runScenario(scenarioName);
                return scenarioSuccess ? 0 : 1;

            case 'report':
                await runner.generateReport();
                return 0;

            case 'help':
            default:
                runner.printUsage();
                return 0;
        }

    } catch (error) {
        runner.log(`💥 Fatal error: ${error.message}`, 'red');
        return 1;

    } finally {
        runner.cleanup();
    }
}

// Run if called directly
if (require.main === module) {
    main().then(exitCode => {
        process.exit(exitCode);
    }).catch(error => {
        console.error('💥 Unhandled error:', error);
        process.exit(1);
    });
}

module.exports = PricingTestRunner;