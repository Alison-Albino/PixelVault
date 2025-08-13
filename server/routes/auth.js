const express = require('express');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const router = express.Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware para verificar se usuário está logado
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  next();
};

// Cadastro de usuário
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, masterPassword } = req.body;

    // Validações
    if (!username || !email || !password || !masterPassword) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    if (masterPassword.length < 6) {
      return res.status(400).json({ error: 'A senha mestra deve ter pelo menos 6 caracteres' });
    }

    // Verificar se usuário já existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Usuário ou email já existe' });
    }

    // Hash das senhas
    const passwordHash = await bcrypt.hash(password, 12);
    const masterPasswordHash = await bcrypt.hash(masterPassword, 12);

    // Criar usuário
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, master_password_hash) 
       VALUES ($1, $2, $3, $4) RETURNING id, username, email, created_at`,
      [username, email, passwordHash, masterPasswordHash]
    );

    const user = result.rows[0];

    // Criar sessão
    req.session.userId = user.id;
    req.session.username = user.username;

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Erro no cadastro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }

    // Buscar usuário
    const result = await pool.query(
      'SELECT id, username, email, password_hash, created_at FROM users WHERE username = $1 OR email = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = result.rows[0];

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Criar sessão
    req.session.userId = user.id;
    req.session.username = user.username;

    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Verificar senha mestra
router.post('/verify-master', requireAuth, async (req, res) => {
  try {
    const { masterPassword } = req.body;

    if (!masterPassword) {
      return res.status(400).json({ error: 'Senha mestra é obrigatória' });
    }

    // Buscar hash da senha mestra
    const result = await pool.query(
      'SELECT master_password_hash FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = result.rows[0];

    // Verificar senha mestra
    const validMasterPassword = await bcrypt.compare(masterPassword, user.master_password_hash);
    if (!validMasterPassword) {
      return res.status(401).json({ error: 'Senha mestra incorreta' });
    }

    // Marcar sessão como autorizada para acessar cofre
    req.session.vaultAccess = true;

    res.json({ message: 'Senha mestra verificada com sucesso' });
  } catch (error) {
    console.error('Erro na verificação da senha mestra:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro no logout:', err);
      return res.status(500).json({ error: 'Erro ao fazer logout' });
    }
    res.json({ message: 'Logout realizado com sucesso' });
  });
});

// Verificar sessão
router.get('/session', (req, res) => {
  if (req.session.userId) {
    res.json({
      loggedIn: true,
      vaultAccess: !!req.session.vaultAccess,
      user: {
        id: req.session.userId,
        username: req.session.username
      }
    });
  } else {
    res.json({ loggedIn: false, vaultAccess: false });
  }
});

module.exports = router;