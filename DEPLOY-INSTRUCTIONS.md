# Instruções de Deploy - Sistema Expertzy

## Correções Implementadas

O sistema foi **migrado completamente** para `new URL()` + `import.meta.url`, eliminando dependências frágeis e garantindo compatibilidade universal sem configuração.

### Mudanças Arquiteturais:

1. **Sistema Nativo ES2020+**
   - Eliminado PathResolver.js (dependência customizada)
   - Migração para `new URL()` + `import.meta.url` (padrão nativo)
   - Resolução de paths em tempo de build/carregamento

2. **Módulos Migrados (10 arquivos):**
   - **Core**: IncentiveManager.js, CroquiNFExporter.js, ComplianceCalculator.js, ItemCalculator.js, DIProcessor.js
   - **Services**: DataTransformer.js, IndexedDBManager.js  
   - **Utils**: ConfigLoader.js
   - **Interface**: di-interface.js

3. **Padrão Implementado:**
```javascript
// ✅ NOVO: Resolução nativa ES2020+
const response = await fetch(new URL('../../shared/data/aliquotas.json', import.meta.url));

// ❌ ANTES: PathResolver removido
// const response = await fetch(pathResolver.resolveDataPath('aliquotas.json'));
```

## Como Fazer Deploy

### Vantagem: Zero Configuração

O sistema agora funciona **universalmente** sem modificações:
- ✅ localhost:8000, 127.0.0.1, 192.168.x.x, 10.x.x.x
- ✅ domain.local, subdomain.local  
- ✅ Produção com subdiretórios (/sistema-importacao/)
- ✅ Qualquer combinação IP/domínio/subdiretório

### Para Servidor Apache/Nginx:

1. **Copie todos os arquivos mantendo a estrutura de diretórios:**
```bash
rsync -av --exclude 'node_modules' --exclude '.git' ./ /caminho/destino/
```

2. **Garanta que a estrutura de diretórios seja mantida:**
```
sistema-importacao/
├── index.html
├── di-interface.html
├── dashboard.html
├── images/
│   └── expertzy-it.png
├── src/
│   ├── shared/
│   │   ├── data/
│   │   │   ├── aliquotas.json
│   │   │   ├── codigos-receita.json
│   │   │   └── ... (todos os JSONs)
│   │   └── utils/
│   │       └── ConfigLoader.js
│   └── ... (todos os módulos)
└── ... (outros arquivos)
```

3. **Configure o servidor para servir arquivos estáticos:**

#### Apache (.htaccess):
```apache
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
</IfModule>

# Permitir acesso a arquivos JSON
<FilesMatch "\.json$">
    Header set Content-Type "application/json"
</FilesMatch>
```

#### Nginx:
```nginx
location /sistema-importacao/ {
    root /var/www/html;
    try_files $uri $uri/ =404;
    
    # CORS headers
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
    
    # JSON files
    location ~ \.json$ {
        add_header Content-Type application/json;
    }
}
```

### Para Servidor Node.js:

Use o arquivo `server.js` já incluído:

```bash
npm install
npm run dev
```

Ou em produção com PM2:
```bash
pm2 start server.js --name expertzy-sistema
```

## Verificação Pós-Deploy

1. **Teste funcionalidade principal:**
   - Acesse `https://seu-dominio.com.br/sistema-importacao/di-interface.html`
   - Faça upload de um arquivo XML de teste
   - Verifique se o processamento funciona sem erros

2. **Verifique o console do navegador:**
   - Abra o Developer Tools (F12)
   - Vá para a aba Console
   - Não deve haver erros 404 para arquivos JSON ou imagens

3. **Teste em diferentes ambientes:**
   - IP direto: `http://192.168.1.100:8000/`
   - Domain local: `http://sistema.local/`
   - Subdiretório: `https://empresa.com.br/sistema-importacao/`

## Troubleshooting

### Problema: Erro 404 nos arquivos JSON

**Solução:** Verifique se a estrutura de diretórios foi mantida e se o servidor tem permissão para servir arquivos JSON.

### Problema: Imagens não carregam

**Solução:** Verifique se a pasta `images/` existe e contém os arquivos necessários.

### Problema: "CORS blocked"

**Solução:** Configure os headers CORS no servidor conforme instruções acima.

### Problema: Módulos ES6 não carregam

**Solução:** Certifique-se de que o servidor está configurado para servir arquivos `.js` com Content-Type correto:

```apache
# Apache
<FilesMatch "\.js$">
    Header set Content-Type "application/javascript"
</FilesMatch>
```

```nginx
# Nginx
location ~ \.js$ {
    add_header Content-Type application/javascript;
}
```

## Suporte

Em caso de problemas, verifique:
1. Console do navegador para erros JavaScript
2. Network tab para verificar se os recursos estão sendo carregados
3. Logs do servidor web
4. Estrutura de diretórios está intacta

## Notas Importantes

- ✅ **Sistema Universal**: Funciona em qualquer ambiente sem configuração
- ✅ **Padrão Nativo**: Usa apenas recursos ES2020+ nativos
- ✅ **Performance**: Resolução de paths em tempo de build
- ✅ **Manutenção**: Zero dependências customizadas para compatibilidade
- ✅ **Simplicidade**: Código mais limpo seguindo princípios KISS/DRY

## Migração Completa

**Arquivos Removidos:**
- `src/shared/utils/PathResolver.js` (eliminado)
- `test-path-resolver.html` (desnecessário)

**Resultado:** Sistema 100% nativo, universal e sem dependências para resolução de paths.