const pool = require('../config/database');
const priorities = ['baixa', 'media', 'alta'];
const statuses = ['pendente', 'em andamento', 'concluida'];
const validDate = (value) => value === null || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)));

exports.list = async (req, res, next) => {
  try {
    const { usuario_id: usuarioId } = req.query;
    const [rows] = usuarioId
      ? await pool.execute('SELECT id, titulo, descricao, data_entrega, prioridade, status, materia_id, usuario_id, criado_em FROM tarefas WHERE usuario_id = ? ORDER BY data_entrega, id', [usuarioId])
      : await pool.execute('SELECT id, titulo, descricao, data_entrega, prioridade, status, materia_id, usuario_id, criado_em FROM tarefas ORDER BY data_entrega, id');
    res.json(rows);
  } catch (error) { next(error); }
};

exports.create = async (req, res, next) => {
  try {
    const { titulo, descricao = null, data_entrega: dueDate = null, prioridade = 'media', status = 'pendente', materia_id: materiaId = null, usuario_id: usuarioId } = req.body;
    if (typeof titulo !== 'string' || !titulo.trim() || titulo.length > 150 ||
        (descricao !== null && typeof descricao !== 'string') || !validDate(dueDate) ||
        !priorities.includes(prioridade) || !statuses.includes(status) ||
        !Number.isInteger(Number(usuarioId)) || Number(usuarioId) < 1 ||
        (materiaId !== null && (!Number.isInteger(Number(materiaId)) || Number(materiaId) < 1))) {
      return res.status(400).json({ error: 'Dados inválidos. Confira título, data (YYYY-MM-DD), prioridade, status, usuario_id e materia_id opcional.' });
    }

    if (materiaId !== null) {
      const [subjects] = await pool.execute('SELECT id FROM materias WHERE id = ? AND usuario_id = ?', [Number(materiaId), Number(usuarioId)]);
      if (!subjects.length) return res.status(400).json({ error: 'A matéria informada não existe ou não pertence ao usuário.' });
    }
    const [result] = await pool.execute(
      'INSERT INTO tarefas (titulo, descricao, data_entrega, prioridade, status, materia_id, usuario_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [titulo.trim(), descricao, dueDate, prioridade, status, materiaId === null ? null : Number(materiaId), Number(usuarioId)]
    );
    const [rows] = await pool.execute('SELECT id, titulo, descricao, data_entrega, prioridade, status, materia_id, usuario_id, criado_em FROM tarefas WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) { next(error); }
};

exports.update = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { titulo, descricao = null, data_entrega: dueDate = null, prioridade = 'media', status = 'pendente', materia_id: materiaId = null, usuario_id: usuarioId } = req.body;
    if (!Number.isInteger(id) || id < 1 ||
        typeof titulo !== 'string' || !titulo.trim() || titulo.length > 150 ||
        (descricao !== null && typeof descricao !== 'string') || !validDate(dueDate) ||
        !priorities.includes(prioridade) || !statuses.includes(status) ||
        !Number.isInteger(Number(usuarioId)) || Number(usuarioId) < 1 ||
        (materiaId !== null && (!Number.isInteger(Number(materiaId)) || Number(materiaId) < 1))) {
      return res.status(400).json({ error: 'Dados inválidos. Confira ID, título, data (YYYY-MM-DD), prioridade, status, usuario_id e materia_id opcional.' });
    }
    if (materiaId !== null) {
      const [subjects] = await pool.execute(
        'SELECT id FROM materias WHERE id = ? AND usuario_id = ?', [Number(materiaId), Number(usuarioId)]
      );
      if (!subjects.length) return res.status(400).json({ error: 'A matéria informada não existe ou não pertence ao usuário.' });
    }
    const [existing] = await pool.execute('SELECT id FROM tarefas WHERE id = ? AND usuario_id = ?', [id, Number(usuarioId)]);
    if (!existing.length) {
      const [rows] = await pool.execute('SELECT id FROM tarefas WHERE id = ?', [id]);
      return res.status(rows.length ? 403 : 404).json({ error: rows.length ? 'A tarefa não pertence ao usuário informado.' : 'Tarefa não encontrada.' });
    }
    await pool.execute(
      'UPDATE tarefas SET titulo = ?, descricao = ?, data_entrega = ?, prioridade = ?, status = ?, materia_id = ? WHERE id = ? AND usuario_id = ?',
      [titulo.trim(), descricao, dueDate, prioridade, status, materiaId === null ? null : Number(materiaId), id, Number(usuarioId)]
    );
    const [rows] = await pool.execute(
      'SELECT id, titulo, descricao, data_entrega, prioridade, status, materia_id, usuario_id, criado_em FROM tarefas WHERE id = ? AND usuario_id = ?',
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
    const [result] = await pool.execute('DELETE FROM tarefas WHERE id = ? AND usuario_id = ?', [id, usuarioId]);
    if (!result.affectedRows) {
      const [rows] = await pool.execute('SELECT id FROM tarefas WHERE id = ?', [id]);
      return res.status(rows.length ? 403 : 404).json({ error: rows.length ? 'A tarefa não pertence ao usuário informado.' : 'Tarefa não encontrada.' });
    }
    res.status(204).end();
  } catch (error) { next(error); }
};
