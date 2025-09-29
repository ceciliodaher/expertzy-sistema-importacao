/**
 * Prettier Configuration
 * Sistema Expertzy - Importação e Precificação
 */

export default {
  // Configurações básicas
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'es5',
  tabWidth: 2,
  useTabs: false,
  printWidth: 100,
  
  // Quebras de linha
  endOfLine: 'lf',
  
  // JavaScript específico
  arrowParens: 'avoid',
  bracketSpacing: true,
  bracketSameLine: false,
  
  // Formatação de objetos
  objectCurlySpacing: true,
  
  // Arquivos específicos
  overrides: [
    {
      files: '*.json',
      options: {
        tabWidth: 2
      }
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always'
      }
    }
  ]
};