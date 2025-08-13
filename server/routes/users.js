const express = require('express');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const router = express.Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware para verificar autenticação
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  next();
};

// Obter perfil do usuário
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar perfil
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({ error: 'Usuário e email são obrigatórios' });
    }

    // Verificar se username/email já existem (excluindo o usuário atual)
    const existing = await pool.query(
      'SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3',
      [username, email, req.session.userId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Usuário ou email já existe' });
    }

    // Atualizar perfil
    const result = await pool.query(
      'UPDATE users SET username = $1, email = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, username, email, updated_at',
      [username, email, req.session.userId]
    );

    // Atualizar sessão
    req.session.username = username;

    res.json({
      message: 'Perfil atualizado com sucesso',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Alterar senha de login
router.put('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
    }

    // Verificar senha atual
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const validPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    // Atualizar senha
    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, req.session.userId]
    );

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Alterar senha mestra
router.put('/change-master-password', requireAuth, async (req, res) => {
  try {
    const { currentMasterPassword, newMasterPassword } = req.body;

    if (!currentMasterPassword || !newMasterPassword) {
      return res.status(400).json({ error: 'Senha mestra atual e nova são obrigatórias' });
    }

    if (newMasterPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha mestra deve ter pelo menos 6 caracteres' });
    }

    // Verificar senha mestra atual
    const result = await pool.query(
      'SELECT master_password_hash FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const validMasterPassword = await bcrypt.compare(currentMasterPassword, result.rows[0].master_password_hash);
    if (!validMasterPassword) {
      return res.status(401).json({ error: 'Senha mestra atual incorreta' });
    }

    // Atualizar senha mestra
    const newMasterPasswordHash = await bcrypt.hash(newMasterPassword, 12);
    await pool.query(
      'UPDATE users SET master_password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newMasterPasswordHash, req.session.userId]
    );

    // Remover acesso ao cofre (usuário precisará verificar a nova senha mestra)
    req.session.vaultAccess = false;

    res.json({ 
      message: 'Senha mestra alterada com sucesso. Você precisará verificar a nova senha mestra para acessar o cofre.',
      vaultAccessRevoked: true
    });
  } catch (error) {
    console.error('Erro ao alterar senha mestra:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Excluir conta
router.delete('/account', requireAuth, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Senha é obrigatória para excluir a conta' });
    }

    // Verificar senha
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const validPassword = await bcrypt.compare(password, result.rows[0].password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    // Excluir usuário (cascade irá excluir as entradas também)
    await pool.query('DELETE FROM users WHERE id = $1', [req.session.userId]);

    // Destruir sessão
    req.session.destroy((err) => {
      if (err) {
        console.error('Erro ao destruir sessão:', err);
      }
    });

    res.json({ message: 'Conta excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir conta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;