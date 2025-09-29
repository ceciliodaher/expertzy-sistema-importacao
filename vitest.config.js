/**
 * Vitest Configuration
 * Sistema Expertzy - Importação e Precificação
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom', // Para testar código que usa DOM
    globals: true,
    setupFiles: ['./tests/setup.js'], // Setup global para todos os testes
    include: ['tests/unit/**/*.test.js'], // Padrão para testes unitários
    exclude: ['tests/e2e/**/*'], // Excluir testes E2E do Playwright
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js'],
      exclude: [
        'src/**/*.test.js',
        'src/**/*.spec.js',
        'node_modules/',
        'dist/'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  resolve: {
    alias: {
      '@core': resolve(__dirname, 'src/core'),
      '@services': resolve(__dirname, 'src/services'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@modules': resolve(__dirname, 'src/modules'),
      '@utils': resolve(__dirname, 'src/utils')
    }
  }
});