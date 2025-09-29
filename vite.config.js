import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  
  server: {
    port: 8000,
    host: '0.0.0.0',
    cors: true,
    open: false,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'expertzy-importacao.servbay.demo',
      '.servbay.demo'
    ]
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        di: resolve(__dirname, 'di-interface.html'),
        pricing: resolve(__dirname, 'src/modules/pricing/pricing-interface.html'),
        itemPricing: resolve(__dirname, 'src/modules/item-pricing/item-pricing-interface.html'),
        etlValidator: resolve(__dirname, 'src/modules/etl-validator/ui/etl-validator-interface.html')
      }
    },
    // Otimização de chunks
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, './src/shared'),
      '@core': resolve(__dirname, './src/core'),
      '@modules': resolve(__dirname, './src/modules'),
      '@services': resolve(__dirname, './src/services')
    }
  },
  
  // Otimizações de dependências
  optimizeDeps: {
    include: [
      'chart.js',
      'dexie',
      'exceljs',
      'jspdf'
    ]
  },
  
  // Definir variáveis de ambiente
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  },
  
  // Configurar preview server
  preview: {
    port: 8000,
    host: true
  }
})