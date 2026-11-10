const express = require('express');
const jwt = require('jsonwebtoken');
const { rateLimit } = require('express-rate-limit');
const { hashPassword, verifyPassword } = require('../services/passwords');
const { authenticate } = require('../middleware/authenticate');
const fields = 'id, nome, email, tipo_usuario, criado_em';
const normalizeEmail = (email) => typeof email === 'string' ? email.trim().toLowerCase() : '';
const validEmail = (email) => email.length <= 150 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
function createAuthRouter({ pool, config }) {
  const router = express.Router();
  router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  const limiter = () => rateLimit({ windowMs: 15 * 60 * 1000, limit: 10,
    standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: 'Muitas tentativas. Tente novamente mais tarde.' } });
  router.post('/cadastro', limiter(), async (req, res, next) => {
    try {
      const { nome, senha, tipo_usuario = 'aluno' } = req.body || {};
      const email = normalizeEmail(req.body?.email);
      if (typeof nome !== 'string' || !nome.trim() || nome.trim().length > 100 ||
          !validEmail(email) || typeof senha !== 'string' || senha.length < 8 || senha.length > 128 ||
          !['aluno', 'responsavel'].includes(tipo_usuario)) {
        return res.status(400).json({ error: 'Informe nome (1-100), e-mail válido e senha (8-128 caracteres). Perfil deve ser aluno ou responsavel.' });
      }
      const hash = await hashPassword(senha);
      const [result] = await pool.execute(
        'INSERT INTO usuarios (nome, email, senha, tipo_usuario) VALUES (?, ?, ?, ?)',
        [nome.trim(), email, hash, tipo_usuario]);
      const [rows] = await pool.execute(`SELECT ${fields} FROM usuarios WHERE id = ?`, [result.insertId]);
      res.status(201).json({ usuario: rows[0] });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Não foi possível cadastrar com os dados informados.' });
      next(error);
    }
  });
  router.post('/login', limiter(), async (req, res, next) => {
    try {
      const email = normalizeEmail(req.body?.email);
      const senha = req.body?.senha;
      if (!validEmail(email) || typeof senha !== 'string' || !senha.length || senha.length > 128) {
        return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
      }
      const [rows] = await pool.execute(`SELECT ${fields}, senha FROM usuarios WHERE email = ?`, [email]);
      const user = rows[0];
      const matches = await verifyPassword(senha, user?.senha);
      if (!user || !matches) return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
      const token = jwt.sign({}, config.secret, { algorithm: 'HS256', subject: String(user.id),
        issuer: config.issuer, audience: config.audience, expiresIn: config.expiresIn });
      const { senha: _hash, ...usuario } = user;
      res.json({ token, token_type: 'Bearer', expires_in: config.expiresIn, usuario });
    } catch (error) { next(error); }
  });
  router.get('/me', authenticate(config), async (req, res, next) => {
    try {
      const [rows] = await pool.execute(`SELECT ${fields} FROM usuarios WHERE id = ?`, [req.auth.userId]);
      if (!rows.length) return res.status(401).json({ error: 'Autenticação necessária ou token inválido.' });
      res.json({ usuario: rows[0] });
    } catch (error) { next(error); }
  });
  return router;
}
module.exports = { createAuthRouter };
