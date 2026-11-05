const { promisify } = require('node:util');
const { randomBytes, scrypt: scryptCallback } = require('node:crypto');
const pool = require('../config/database');
const scrypt = promisify(scryptCallback);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${derived.toString('hex')}`;
}

exports.list = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, nome, email, tipo_usuario, criado_em FROM usuarios ORDER BY id'
    );
    res.json(rows);
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  try {
    const { nome, email, senha, tipo_usuario = 'aluno' } = req.body;
    if (typeof nome !== 'string' || !nome.trim() || nome.length > 100 ||
        typeof email !== 'string' || !email.trim() || email.length > 150 ||
        typeof senha !== 'string' || senha.length < 8 || senha.length > 128 ||
        !['aluno', 'responsavel'].includes(tipo_usuario)) {
      return res.status(400).json({ error: 'Informe nome (até 100 caracteres), email (até 150), senha (8 a 128 caracteres) e tipo_usuario válido (aluno ou responsavel).' });
    }
    const senhaHash = await hashPassword(senha);
    const [result] = await pool.execute(
      'INSERT INTO usuarios (nome, email, senha, tipo_usuario) VALUES (?, ?, ?, ?)',
      [nome.trim(), email.trim().toLowerCase(), senhaHash, tipo_usuario]
    );
    const [rows] = await pool.execute(
      'SELECT id, nome, email, tipo_usuario, criado_em FROM usuarios WHERE id = ?', [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { nome, email, senha, tipo_usuario: tipoUsuario } = req.body;
    if (!Number.isInteger(id) || id < 1 ||
        typeof nome !== 'string' || !nome.trim() || nome.length > 100 ||
        typeof email !== 'string' || !email.trim() || email.length > 150 ||
        (senha !== undefined && (typeof senha !== 'string' || senha.length < 8 || senha.length > 128)) ||
        !['aluno', 'responsavel'].includes(tipoUsuario)) {
      return res.status(400).json({ error: 'Informe nome, email e tipo_usuario válidos; senha é opcional (8 a 128 caracteres).' });
    }

    const [existing] = await pool.execute('SELECT id FROM usuarios WHERE id = ?', [id]);
    if (!existing.length) return res.status(404).json({ error: 'Usuário não encontrado.' });
    const senhaHash = senha === undefined ? null : await hashPassword(senha);
    await pool.execute(
      'UPDATE usuarios SET nome = ?, email = ?, tipo_usuario = ?, senha = COALESCE(?, senha) WHERE id = ?',
      [nome.trim(), email.trim().toLowerCase(), tipoUsuario, senhaHash, id]
    );
    const [rows] = await pool.execute(
      'SELECT id, nome, email, tipo_usuario, criado_em FROM usuarios WHERE id = ?', [id]
    );
    res.json(rows[0]);
  } catch (error) { next(error); }
};

exports.remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'ID de usuário inválido.' });
    const [result] = await pool.execute('DELETE FROM usuarios WHERE id = ?', [id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.status(204).end();
  } catch (error) { next(error); }
};
