/**
 * Servidor de desenvolvimento para Sistema Expertzy
 * Serve arquivos estáticos com configurações específicas para SPA
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8000;

// Configurar CORS para desenvolvimento
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Servir arquivos estáticos
app.use(express.static('.', {
  extensions: ['html', 'js', 'css', 'json'],
  index: ['index.html']
}));

// Middleware para logs de desenvolvimento
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Rota especial para uploads (caso necessário)
app.use('/uploads', express.static('uploads'));

// Rota para servir dados de configuração
app.get('/api/config', (req, res) => {
  try {
    const configPath = path.join(__dirname, 'src/shared/data/config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      res.json(config);
    } else {
      res.status(404).json({ error: 'Configuração não encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao carregar configuração' });
  }
});

// SPA fallback - todas as rotas retornam index.html
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Sistema não encontrado');
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Erro no servidor:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Sistema Expertzy executando em http://localhost:${PORT}`);
  console.log(`📁 Servindo arquivos de: ${__dirname}`);
  console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;