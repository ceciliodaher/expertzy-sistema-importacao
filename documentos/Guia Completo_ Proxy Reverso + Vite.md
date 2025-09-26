<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# **Guia Completo: Proxy Reverso + Vite para Desenvolvimento Local**

**Versão:** 2.0
**Data:** 26 de setembro de 2025
**Autor:** Sistema Expertzy
**Plataformas:** macOS (ServBay) | Windows (WAMP)

***

## **📋 Sumário**

1. [Introdução](#introdu%C3%A7%C3%A3o)
2. [Pré-requisitos por Plataforma](#pr%C3%A9-requisitos-por-plataforma)
3. [Configuração do Vite (Universal)](#configura%C3%A7%C3%A3o-do-vite-universal)
4. [ServBay (macOS)](#servbay-macos)
5. [WAMP (Windows)](#wamp-windows)
6. [Solução de Problemas](#solu%C3%A7%C3%A3o-de-problemas)
7. [Configurações Avançadas](#configura%C3%A7%C3%B5es-avan%C3%A7adas)
8. [Boas Práticas Multiplataforma](#boas-pr%C3%A1ticas-multiplataforma)
9. [Checklist de Validação](#checklist-de-valida%C3%A7%C3%A3o)

***

## **🎯 Introdução**

Este documento orienta a configuração de proxy reverso para projetos **Vite** em ambientes de desenvolvimento local, cobrindo:

- **macOS**: ServBay como solução integrada
- **Windows**: WAMP com Apache como proxy reverso


### **Benefícios da Configuração:**

- ✅ **HTTPS automático** com certificados SSL válidos
- ✅ **Domínios personalizados** para desenvolvimento
- ✅ **Hot-reload preservado** do Vite
- ✅ **Ambiente unificado** para desenvolvimento full-stack
- ✅ **Compatibilidade cross-platform** para equipes mistas

***

## **🔧 Pré-requisitos por Plataforma**

### **macOS (ServBay)**

```bash
# Verificar instalações
servbay --version
node --version
npm --version
```


### **Windows (WAMP)**

```cmd
# Verificar instalações no CMD/PowerShell
wamp64 --version
node --version  
npm --version
apache -v
```

**Software Necessário (Windows):**

- **WAMP64** instalado e funcionando
- **Node.js** (versão 18+ recomendada)
- **Editor de texto** para configurar Apache

***

## **⚙️ Configuração do Vite (Universal)**

### **Configuração Base**

Crie ou ajuste o arquivo `vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    // seus plugins aqui
  ],
  
  server: {
    port: 8000,                    // Porta fixa para o proxy
    host: '0.0.0.0',              // CRÍTICO: Permite conexões externas
    cors: true,                   // Permite CORS
    open: false,                  // Não abre browser automaticamente
    strictPort: true,             // Falha se a porta estiver ocupada
    allowedHosts: [               // CRÍTICO: Hosts autorizados
      'localhost',
      '127.0.0.1',
      '.servbay.demo',            // Para ServBay (macOS)
      '.local.dev',               // Para WAMP (Windows)
      'meu-projeto.local'         // Domínio personalizado Windows
    ]
  },
  
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  
  // Configuração cross-platform
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})
```


### **Scripts Universais**

```json
{
  "scripts": {
    "dev": "vite",
    "dev:host": "vite --host 0.0.0.0",
    "build": "vite build",
    "preview": "vite preview",
    "serve": "vite preview --port 8000 --host 0.0.0.0"
  }
}
```


***

## **🍎 ServBay (macOS)**

### **Configuração Rápida**

1. **Iniciar Vite:**
```bash
cd /caminho/para/projeto
npm run dev
```

2. **Configurar Site no ServBay:**
| Campo | Valor |
| :-- | :-- |
| **Nome** | `Meu Projeto Vite - Dev` |
| **Domínio** | `meu-projeto.servbay.demo` |
| **Tipo** | `Proxy Reverso` |
| **Destino** | `http://127.0.0.1:8000` |
| **SSL** | `ServBay CA` |

3. **Acessar:** `https://meu-projeto.servbay.demo`

### **Configuração Avançada ServBay**

```javascript
// vite.config.js - Específico para ServBay
server: {
  allowedHosts: [
    'localhost',
    '127.0.0.1',
    '.servbay.demo'              // Permite todos os subdomínios
  ],
  hmr: {
    port: 8000,
    host: 'localhost'
  }
}
```


***

## **🪟 WAMP (Windows)**

### **Passo 1: Configurar Virtual Host**

1. **Abra o WAMP** e clique no ícone da bandeja
2. **Vá para:** `Apache > httpd-vhosts.conf`
3. **Adicione no final do arquivo:**
```apache
# Virtual Host para Vite Proxy
<VirtualHost *:80>
    ServerName meu-projeto.local
    ServerAlias www.meu-projeto.local
    
    # Proxy para Vite
    ProxyPreserveHost On
    ProxyRequests Off
    ProxyPass / http://127.0.0.1:8000/
    ProxyPassReverse / http://127.0.0.1:8000/
    
    # Logs
    ErrorLog "logs/vite-proxy-error.log"
    CustomLog "logs/vite-proxy-access.log" common
</VirtualHost>

# HTTPS Virtual Host (Opcional)
<VirtualHost *:443>
    ServerName meu-projeto.local
    ServerAlias www.meu-projeto.local
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile "conf/ssl/server.crt"
    SSLCertificateKeyFile "conf/ssl/server.key"
    
    # Proxy para Vite com SSL
    ProxyPreserveHost On
    ProxyRequests Off
    ProxyPass / http://127.0.0.1:8000/
    ProxyPassReverse / http://127.0.0.1:8000/
    
    ErrorLog "logs/vite-proxy-ssl-error.log"
    CustomLog "logs/vite-proxy-ssl-access.log" common
</VirtualHost>
```


### **Passo 2: Habilitar Módulos Apache**

1. **Clique no WAMP** → `Apache` → `Apache Modules`
2. **Habilite os módulos:**
    - ✅ `proxy_module`
    - ✅ `proxy_http_module`
    - ✅ `rewrite_module`
    - ✅ `ssl_module` (para HTTPS)

### **Passo 3: Configurar Hosts do Windows**

1. **Abra como Administrador:** `C:\Windows\System32\drivers\etc\hosts`
2. **Adicione:**
```
127.0.0.1    meu-projeto.local
127.0.0.1    www.meu-projeto.local
```


### **Passo 4: Reiniciar Serviços**

1. **Reiniciar Apache:** WAMP → `Apache` → `Service` → `Restart Service`
2. **Iniciar Vite:**
```cmd
cd C:\caminho\para\projeto
npm run dev
```


### **Passo 5: Testar**

- **HTTP:** `http://meu-projeto.local`
- **HTTPS:** `https://meu-projeto.local` (se configurado SSL)


### **Configuração SSL Opcional (WAMP)**

Para criar certificados SSL locais:

```cmd
# No diretório do Apache (como Administrador)
cd C:\wamp64\bin\apache\apache2.x.x\bin

# Gerar chave privada
openssl genrsa -out server.key 2048

# Gerar certificado
openssl req -new -x509 -key server.key -out server.crt -days 365
```

**Mover certificados:**

```cmd
move server.key C:\wamp64\bin\apache\apache2.x.x\conf\ssl\
move server.crt C:\wamp64\bin\apache\apache2.x.x\conf\ssl\
```


***

## **🔍 Solução de Problemas**

### **Problemas Comuns - ServBay (macOS)**

| Erro | Causa | Solução |
| :-- | :-- | :-- |
| 502 Bad Gateway | Vite não está rodando | `npm run dev` e verificar porta 8000 |
| Host not allowed | Missing allowedHosts | Adicionar `.servbay.demo` ao config |
| SSL Certificate | ServBay CA não instalado | Instalar certificado do ServBay |

### **Problemas Comuns - WAMP (Windows)**

| Erro | Causa | Solução |
| :-- | :-- | :-- |
| 503 Service Unavailable | Módulos proxy desabilitados | Habilitar proxy_module e proxy_http_module |
| Virtual host não funciona | hosts file incorreto | Verificar C:\Windows\System32\drivers\etc\hosts |
| Apache não reinicia | Erro de sintaxe | Verificar httpd-vhosts.conf |
| Porta 80/443 ocupada | Conflito com outros serviços | Usar netstat -an para identificar |

### **Debug Commands - Windows**

```cmd
# Verificar porta 8000
netstat -an | findstr :8000

# Testar conectividade Vite
curl -I http://localhost:8000

# Verificar status Apache
sc query wampapache64

# Testar configuração Apache
httpd -t

# Ver logs de erro
type C:\wamp64\logs\apache_error.log
```


### **Debug Commands - macOS**

```bash
# Verificar porta 8000  
lsof -i :8000

# Testar Vite
curl -I http://localhost:8000

# Logs ServBay
tail -f ~/Library/Logs/ServBay/error.log
```


***

## **🚀 Configurações Avançadas**

### **1. Múltiplos Projetos**

**ServBay (macOS):**

```
projeto-a.servbay.demo → http://127.0.0.1:8000
projeto-b.servbay.demo → http://127.0.0.1:8001
```

**WAMP (Windows):**

```apache
# httpd-vhosts.conf
<VirtualHost *:80>
    ServerName projeto-a.local
    ProxyPass / http://127.0.0.1:8000/
</VirtualHost>

<VirtualHost *:80>
    ServerName projeto-b.local
    ProxyPass / http://127.0.0.1:8001/
</VirtualHost>
```


### **2. Configuração de APIs Backend**

**Vite config para APIs locais:**

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '')
    },
    '/uploads': {
      target: 'http://localhost:3000',
      changeOrigin: true
    }
  }
}
```


### **3. Environment Variables Cross-Platform**

**`.env.local`:**

```bash
# Universal
VITE_APP_NAME=Meu Projeto
VITE_DEV_MODE=true

# macOS specific
VITE_BASE_URL_MAC=https://meu-projeto.servbay.demo

# Windows specific  
VITE_BASE_URL_WIN=http://meu-projeto.local
VITE_API_URL_WIN=http://api.local.dev
```

**Uso no código:**

```javascript
const baseUrl = import.meta.env.VITE_BASE_URL_MAC || 
                import.meta.env.VITE_BASE_URL_WIN ||
                'http://localhost:8000'
```


***

## **✅ Boas Práticas Multiplataforma**

### **1. Estrutura de Projeto Recomendada**

```
meu-projeto/
├── vite.config.js              # Configuração universal
├── package.json                # Scripts multiplataforma
├── .env.local                  # Variáveis de ambiente
├── .env.mac                    # Específico macOS
├── .env.windows                # Específico Windows
├── docs/
│   ├── setup-servbay.md        # Instruções macOS
│   └── setup-wamp.md           # Instruções Windows
└── configs/
    ├── vite.config.mac.js      # Config específico macOS
    └── vite.config.win.js      # Config específico Windows
```


### **2. Scripts Condicionais**

```json
{
  "scripts": {
    "dev": "vite",
    "dev:mac": "vite --config vite.config.mac.js",
    "dev:win": "vite --config vite.config.win.js",
    "dev:debug": "vite --debug --host 0.0.0.0",
    "setup:mac": "echo 'Configure ServBay proxy for macOS'",
    "setup:win": "echo 'Configure WAMP virtual host for Windows'"
  }
}
```


### **3. Configuração Git**

**`.gitignore`:**

```bash
# Environment files
.env.local
.env.mac
.env.windows

# OS specific
.DS_Store
Thumbs.db

# Platform specific builds
dist-mac/
dist-win/

# Logs
*.log
logs/
```


### **4. Documentação da Equipe**

Crie um `README-SETUP.md`:

```markdown
# Setup Multiplataforma

## macOS Developers
1. Instalar ServBay
2. Executar: `npm run setup:mac`
3. Acessar: https://projeto.servbay.demo

## Windows Developers  
1. Instalar WAMP64
2. Configurar virtual host (ver docs/setup-wamp.md)
3. Executar: `npm run setup:win`
4. Acessar: http://projeto.local
```


***

## **📋 Checklist de Validação**

### **Configuração Universal**

- [ ] Node.js e npm instalados
- [ ] Projeto Vite inicializa (`npm run dev`)
- [ ] vite.config.js com `host: '0.0.0.0'`
- [ ] allowedHosts configurado para ambas plataformas


### **macOS (ServBay)**

- [ ] ServBay instalado e funcionando
- [ ] Site proxy reverso criado
- [ ] Domínio `.servbay.demo` funcionando
- [ ] HTTPS automático ativo
- [ ] Hot-reload funcionando


### **Windows (WAMP)**

- [ ] WAMP64 instalado e funcionando
- [ ] Módulos proxy habilitados no Apache
- [ ] Virtual host configurado em httpd-vhosts.conf
- [ ] Arquivo hosts do Windows atualizado
- [ ] Apache reiniciado sem erros


### **Testes Funcionais - Ambas Plataformas**

- [ ] Página principal carrega
- [ ] Assets estáticos carregam
- [ ] Hot-reload funciona
- [ ] Console sem erros críticos
- [ ] Build de produção funciona (`npm run build`)


### **Performance Cross-Platform**

- [ ] Load inicial < 3s
- [ ] Hot-reload < 1s
- [ ] Build completo < 30s
- [ ] Proxy overhead mínimo

***

## **📞 Recursos e Suporte**

### **Documentação Oficial**

- [ServBay Documentation](https://support.servbay.com) - macOS
- [WAMP Documentation](http://www.wampserver.com/en/) - Windows
- [Vite Documentation](https://vitejs.dev) - Universal
- [Apache Virtual Hosts](https://httpd.apache.org/docs/2.4/vhosts/) - Windows


### **Troubleshooting Quick Reference**

| Plataforma | Problema | Comando de Diagnóstico |
| :-- | :-- | :-- |
| **macOS** | ServBay não conecta | `curl -I http://localhost:8000` |
| **macOS** | Certificado SSL | Instalar ServBay CA |
| **Windows** | Apache não inicia | `httpd -t` |
| **Windows** | Virtual host não funciona | Verificar `hosts` file |
| **Universal** | Hot-reload quebrado | Verificar `allowedHosts` |
| **Universal** | CORS issues | Configurar `cors: true` |

### **Comandos de Emergência**

**Resetar Configuração - macOS:**

```bash
# Parar Vite
pkill -f vite

# Reiniciar ServBay
sudo brew services restart servbay

# Limpar cache
rm -rf node_modules/.vite
```

**Resetar Configuração - Windows:**

```cmd
# Parar Vite
taskkill /f /im node.exe

# Reiniciar Apache
net stop wampapache64
net start wampapache64

# Limpar cache
rmdir /s node_modules\.vite
```


***

**🎉 Agora você tem um ambiente de desenvolvimento completo funcionando tanto no macOS (ServBay) quanto no Windows (WAMP)!**

**Última atualização:** 26 de setembro de 2025
**Testado em:** macOS 14+, Windows 10+, Node.js 18+

