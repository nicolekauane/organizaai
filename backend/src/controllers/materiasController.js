const pool = require('../config/database');

exports.list = async (req, res, next) => {
  try {
    const { usuario_id: usuarioId } = req.query;
    const [rows] = usuarioId
      ? await pool.execute('SELECT id, nome, professor, cor, usuario_id, criado_em FROM materias WHERE usuario_id = ? ORDER BY id', [usuarioId])
      : await pool.execute('SELECT id, nome, professor, cor, usuario_id, criado_em FROM materias ORDER BY id');
    res.json(rows);
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  try {
    const { nome, professor = null, cor = null, usuario_id: usuarioId } = req.body;
    if (typeof nome !== 'string' || !nome.trim() || nome.length > 100 ||
        (professor !== null && (typeof professor !== 'string' || professor.length > 100)) ||
        (cor !== null && (typeof cor !== 'string' || cor.length > 20)) ||
        !Number.isInteger(Number(usuarioId)) || Number(usuarioId) < 1) {
      return res.status(400).json({ error: 'Informe nome, usuario_id válido e professor/cor opcionais dentro dos limites do banco.' });
    }
    const [result] = await pool.execute(
      'INSERT INTO materias (nome, professor, cor, usuario_id) VALUES (?, ?, ?, ?)',
      [nome.trim(), professor, cor, Number(usuarioId)]
    );
    const [rows] = await pool.execute('SELECT id, nome, professor, cor, usuario_id, criado_em FROM materias WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { nome, professor = null, cor = null, usuario_id: usuarioId } = req.body;
    if (!Number.isInteger(id) || id < 1 ||
        typeof nome !== 'string' || !nome.trim() || nome.length > 100 ||
        (professor !== null && (typeof professor !== 'string' || professor.length > 100)) ||
        (cor !== null && (typeof cor !== 'string' || cor.length > 20)) ||
        !Number.isInteger(Number(usuarioId)) || Number(usuarioId) < 1) {
      return res.status(400).json({ error: 'Informe ID, nome, usuario_id válido e professor/cor opcionais dentro dos limites do banco.' });
    }
    const [existing] = await pool.execute('SELECT id FROM materias WHERE id = ? AND usuario_id = ?', [id, Number(usuarioId)]);
    if (!existing.length) {
      const [rows] = await pool.execute('SELECT id FROM materias WHERE id = ?', [id]);
      return res.status(rows.length ? 403 : 404).json({ error: rows.length ? 'A matéria não pertence ao usuário informado.' : 'Matéria não encontrada.' });
    }
    await pool.execute(
      'UPDATE materias SET nome = ?, professor = ?, cor = ? WHERE id = ? AND usuario_id = ?',
      [nome.trim(), professor, cor, id, Number(usuarioId)]
    );
    const [rows] = await pool.execute(
      'SELECT id, nome, professor, cor, usuario_id, criado_em FROM materias WHERE id = ? AND usuario_id = ?',
      [id, Number(usuarioId)]
    );
    res.json(rows[0]);
  } catch (error) { next(error); }
};

exports.remove = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const usuarioId = Number(req.query.usuario_id);
    if (!Number.isInteger(id) || id < 1 || !Number.isInteger(usuarioId) || usuarioId < 1) {
      return res.status(400).json({ error: 'Informe ID e usuario_id válidos.' });
    }
    const [result] = await pool.execute('DELETE FROM materias WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
    if (!result.affectedRows) {
      const [rows] = await pool.execute('SELECT id FROM materias WHERE id = ?', [id]);
      return res.status(rows.length ? 403 : 404).json({ error: rows.length ? 'A matéria não pertence ao usuário informado.' : 'Matéria não encontrada.' });
    }
    res.status(204).end();
  } catch (error) { next(error); }
};
