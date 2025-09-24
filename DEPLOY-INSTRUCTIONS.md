# Instruções de Deploy - Sistema Expertzy

## Correções Implementadas

Foi implementado um sistema de resolução dinâmica de caminhos para garantir que o sistema funcione tanto localmente quanto em servidores remotos.

### Arquivos Modificados:

1. **Criado: `src/shared/utils/PathResolver.js`**
   - Detecta automaticamente o ambiente (local vs produção)
   - Resolve caminhos de recursos dinamicamente
   - Garante compatibilidade entre diferentes ambientes

2. **Atualizados todos os módulos que fazem fetch de JSONs:**
   - ComplianceCalculator.js
   - DIProcessor.js  
   - IndexedDBManager.js
   - DataTransformer.js
   - ItemCalculator.js
   - ConfigLoader.js
   - di-interface.js

3. **Atualizado: `di-interface.html`**
   - Adicionado script para resolver caminhos de imagens dinamicamente
   - Fallback para imagens caso o caminho inicial falhe

## Como Fazer Deploy

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
│   │       └── PathResolver.js
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

1. **Acesse a página de teste:**
   - `https://seu-dominio.com.br/sistema-importacao/test-path-resolver.html`
   - Verifique se todos os testes mostram SUCCESS

2. **Verifique o console do navegador:**
   - Abra o Developer Tools (F12)
   - Vá para a aba Console
   - Não deve haver erros 404 para arquivos JSON ou imagens

3. **Teste a funcionalidade principal:**
   - Acesse `https://seu-dominio.com.br/sistema-importacao/di-interface.html`
   - Faça upload de um arquivo XML de teste
   - Verifique se o processamento funciona sem erros

## Troubleshooting

### Problema: Erro 404 nos arquivos JSON

**Solução:** Verifique se a estrutura de diretórios foi mantida e se o servidor tem permissão para servir arquivos JSON.

### Problema: Imagens não carregam

**Solução:** Verifique se a pasta `images/` existe e contém os arquivos necessários.

### Problema: "CORS blocked"

**Solução:** Configure os headers CORS no servidor conforme instruções acima.

### Problema: PathResolver não detecta ambiente corretamente

**Solução:** O PathResolver detecta automaticamente baseado na URL. Se necessário, você pode forçar o modo editando `src/shared/utils/PathResolver.js`:

```javascript
detectEnvironment() {
    // Forçar modo produção
    return true; 
}

detectBasePath() {
    // Forçar base path específico
    return '/sistema-importacao';
}
```

## Suporte

Em caso de problemas, verifique:
1. Console do navegador para erros JavaScript
2. Network tab para verificar se os recursos estão sendo carregados
3. Logs do servidor web

## Notas Importantes

- O sistema agora detecta automaticamente o ambiente e ajusta os caminhos
- Não é necessário modificar código para diferentes ambientes
- Todos os caminhos de recursos são resolvidos dinamicamente
- O sistema funciona tanto em raiz quanto em subdiretórios