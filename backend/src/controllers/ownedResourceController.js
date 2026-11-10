// Only trusted server-side definitions may supply table/column names.
function createOwnedController(pool, definition) {
  const { table, fields, order, parse, valid, invalidMessage } = definition;
  const columns = ['id', ...fields, 'usuario_id', 'criado_em'].join(', ');
  const notFound = res => res.status(404).json({ error: 'Registro não encontrado.' });
  const select = async (id, userId) => {
    const [rows] = await pool.execute(`SELECT ${columns} FROM ${table} WHERE id = ? AND usuario_id = ?`, [id, userId]);
    return rows[0];
  };
  async function save(req, res, next, editing) {
    try {
      const userId = req.auth.userId;
      const id = Number(req.params.id);
      if (editing) {
        if (!Number.isSafeInteger(id) || id < 1 || !await select(id, userId)) return notFound(res);
      }
      const values = parse(req.body || {});
      if (!valid(values)) return res.status(400).json({ error: invalidMessage || 'Dados inválidos. Confira os campos e seus limites.' });
      if (table === 'tarefas' && values.materia_id !== null) {
        const [subjects] = await pool.execute('SELECT id FROM materias WHERE id = ? AND usuario_id = ?', [values.materia_id, userId]);
        if (!subjects.length) return notFound(res);
      }
      if (editing) {
        await pool.execute(`UPDATE ${table} SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ? AND usuario_id = ?`,
          [...fields.map(f => values[f]), id, userId]);
        const row = await select(id, userId);
        if (!row) return notFound(res);
        return res.json(row);
      }
      const [result] = await pool.execute(`INSERT INTO ${table} (${fields.join(', ')}, usuario_id) VALUES (${[...fields, 'usuario_id'].map(() => '?').join(', ')})`,
        [...fields.map(f => values[f]), userId]);
      res.status(201).json(await select(result.insertId, userId));
    } catch (error) { next(error); }
  }
  return {
    async list(req, res, next) {
      try {
        const [rows] = await pool.execute(`SELECT ${columns} FROM ${table} WHERE usuario_id = ? ORDER BY ${order}`, [req.auth.userId]);
        res.json(rows);
      } catch (error) { next(error); }
    },
    async get(req, res, next) {
      try {
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id < 1) return notFound(res);
        const row = await select(id, req.auth.userId);
        if (!row) return notFound(res);
        res.json(row);
      } catch (error) { next(error); }
    },
    create: (req, res, next) => save(req, res, next, false),
    update: (req, res, next) => save(req, res, next, true),
    async remove(req, res, next) {
      try {
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id < 1) return notFound(res);
        const [result] = await pool.execute(`DELETE FROM ${table} WHERE id = ? AND usuario_id = ?`, [id, req.auth.userId]);
        if (!result.affectedRows) return notFound(res);
        res.status(204).end();
      } catch (error) { next(error); }
    },
  };
}
module.exports = { createOwnedController };
