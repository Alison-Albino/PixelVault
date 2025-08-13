require('dotenv').config();
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('❌ Erro na conexão com banco:', err);
  } else {
    console.log('✅ Banco conectado:', result.rows[0]);
  }
});

// Basic middleware
app.use(helmet({
  contentSecurityPolicy: false // Simplified for development
}));

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Simple session without PostgreSQL store for now
app.use(session({
  secret: process.env.SESSION_SECRET || 'pixelvault-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files
app.use(express.static(path.join(__dirname, '../')));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'PixelVault API funcionando!' });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, masterPassword } = req.body;
    
    if (!username || !email || !password || !masterPassword) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    res.json({ message: 'Rota de registro funcionando', received: { username, email } });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }

    res.json({ message: 'Rota de login funcionando', received: { username } });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/auth/session', (req, res) => {
  res.json({ 
    loggedIn: false,
    vaultAccess: false,
    message: 'Verificação de sessão funcionando' 
  });
});

// Serve the main app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Initialize database tables
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        master_password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS vault_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL CHECK (type IN ('password', 'note', 'file')),
        encrypted_data TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tabelas do banco criadas/verificadas com sucesso');
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error.message);
  }
}

// Start server
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 PixelVault servidor rodando na porta ${PORT}`);
      console.log(`🌐 Acesse: http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();