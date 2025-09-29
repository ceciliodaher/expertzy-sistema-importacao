/**
 * ESLint Configuration
 * Sistema Expertzy - Importação e Precificação
 */

import js from '@eslint/js';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        FileReader: 'readonly',
        DOMParser: 'readonly',
        XMLHttpRequest: 'readonly',
        fetch: 'readonly',
        indexedDB: 'readonly',
        Dexie: 'readonly',
        // Vitest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly'
      }
    },
    rules: {
      // Regras SOLID e NO FALLBACKS
      'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
      'no-console': 'off', // Permitir console.log para logs do sistema
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      'arrow-spacing': 'error',
      'no-duplicate-imports': 'error',
      'no-useless-constructor': 'error',
      'no-useless-return': 'error',
      
      // Regras específicas para NO FALLBACKS
      'no-undef': 'error', // Não permitir variáveis não definidas
      'no-implicit-globals': 'error',
      'strict': ['error', 'never'], // ES6 modules já são strict
      
      // Melhores práticas SOLID
      'complexity': ['warn', 10], // Limitar complexidade ciclomática
      'max-depth': ['warn', 4], // Limitar aninhamento
      'max-lines-per-function': ['warn', 50], // Limitar tamanho de função
      'max-params': ['warn', 4] // Limitar parâmetros de função
    }
  },
  {
    files: ['tests/**/*.js'],
    rules: {
      // Regras mais flexíveis para testes
      'max-lines-per-function': 'off',
      'no-magic-numbers': 'off'
    }
  },
  {
    ignores: [
      'node_modules/',
      'dist/',
      'public/',
      'playwright-report/',
      'coverage/',
      '*.config.js',
      'server.legacy.js'
    ]
  }
];