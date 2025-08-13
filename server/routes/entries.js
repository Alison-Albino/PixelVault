const express = require('express');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware para verificar autenticação e acesso ao cofre
const requireVaultAccess = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  if (!req.session.vaultAccess) {
    return res.status(403).json({ error: 'Acesso ao cofre negado. Verifique sua senha mestra.' });
  }
  next();
};

// Obter todas as entradas do usuário
router.get('/', requireVaultAccess, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, type, encrypted_data, created_at, updated_at FROM vault_entries WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.session.userId]
    );

    res.json({ entries: result.rows });
  } catch (error) {
    console.error('Erro ao buscar entradas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter uma entrada específica
router.get('/:id', requireVaultAccess, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT id, type, encrypted_data, created_at, updated_at FROM vault_entries WHERE id = $1 AND user_id = $2',
      [id, req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entrada não encontrada' });
    }

    res.json({ entry: result.rows[0] });
  } catch (error) {
    console.error('Erro ao buscar entrada:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar nova entrada
router.post('/', requireVaultAccess, async (req, res) => {
  try {
    const { type, encryptedData } = req.body;

    // Validações
    if (!type || !encryptedData) {
      return res.status(400).json({ error: 'Tipo e dados criptografados são obrigatórios' });
    }

    if (!['password', 'note', 'file'].includes(type)) {
      return res.status(400).json({ error: 'Tipo de entrada inválido' });
    }

    // Verificar tamanho dos dados (limite para evitar ataques)
    if (encryptedData.length > 50 * 1024 * 1024) { // 50MB limit
      return res.status(400).json({ error: 'Dados muito grandes. Limite de 50MB.' });
    }

    const id = uuidv4();

    const result = await pool.query(
      'INSERT INTO vault_entries (id, user_id, type, encrypted_data) VALUES ($1, $2, $3, $4) RETURNING id, type, created_at, updated_at',
      [id, req.session.userId, type, encryptedData]
    );

    res.status(201).json({
      message: 'Entrada criada com sucesso',
      entry: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar entrada:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar entrada
router.put('/:id', requireVaultAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { encryptedData } = req.body;

    if (!encryptedData) {
      return res.status(400).json({ error: 'Dados criptografados são obrigatórios' });
    }

    // Verificar tamanho dos dados
    if (encryptedData.length > 50 * 1024 * 1024) { // 50MB limit
      return res.status(400).json({ error: 'Dados muito grandes. Limite de 50MB.' });
    }

    // Verificar se a entrada existe e pertence ao usuário
    const checkResult = await pool.query(
      'SELECT id FROM vault_entries WHERE id = $1 AND user_id = $2',
      [id, req.session.userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Entrada não encontrada' });
    }

    // Atualizar entrada
    const result = await pool.query(
      'UPDATE vault_entries SET encrypted_data = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING id, type, updated_at',
      [encryptedData, id, req.session.userId]
    );

    res.json({
      message: 'Entrada atualizada com sucesso',
      entry: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar entrada:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Excluir entrada
router.delete('/:id', requireVaultAccess, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a entrada existe e pertence ao usuário
    const result = await pool.query(
      'DELETE FROM vault_entries WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entrada não encontrada' });
    }

    res.json({ message: 'Entrada excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir entrada:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Excluir todas as entradas do usuário
router.delete('/', requireVaultAccess, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM vault_entries WHERE user_id = $1',
      [req.session.userId]
    );

    res.json({ 
      message: 'Todas as entradas foram excluídas com sucesso',
      deletedCount: result.rowCount
    });
  } catch (error) {
    console.error('Erro ao excluir todas as entradas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter estatísticas do cofre
router.get('/stats/summary', requireVaultAccess, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        type,
        COUNT(*) as count
      FROM vault_entries 
      WHERE user_id = $1 
      GROUP BY type
    `, [req.session.userId]);

    const stats = {
      total: 0,
      passwords: 0,
      notes: 0,
      files: 0
    };

    result.rows.forEach(row => {
      stats[row.type + 's'] = parseInt(row.count);
      stats.total += parseInt(row.count);
    });

    res.json({ stats });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;