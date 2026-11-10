const notFound = () => ({ status: 404, body: { error: 'Registro nao encontrado.' } });
const conflict = () => ({ status: 409, body: { error: 'Vinculo alterado. Atualize a lista antes de tentar novamente.' } });
const accepted = () => ({ status: 202, body: { message: 'Se o aluno puder receber a solicitacao, ela ficara disponivel para aprovacao.' } });
const idValue = value => typeof value === 'string' && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) <= 2147483647 ? Number(value) : null;
function validVersion(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) return false;
  const date = new Date(value.replace(' ', 'T') + 'Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 19).replace('T', ' ') === value;
}
async function transaction(pool, work) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    try { await connection.rollback(); } catch { /* Preserve the original error. */ }
    throw error;
  } finally { connection.release(); }
}
async function profile(connection, userId, expected) {
  const [rows] = await connection.execute('SELECT id, tipo_usuario FROM usuarios WHERE id = ? FOR SHARE', [userId]);
  if (!rows.length) return { status: 401, body: { error: 'Autenticacao necessaria.' } };
  if (expected && rows[0].tipo_usuario !== expected) return { status: 403, body: { error: 'Perfil sem permissao.' } };
  if (!['aluno', 'responsavel'].includes(rows[0].tipo_usuario)) return { status: 403, body: { error: 'Perfil sem permissao.' } };
  return null;
}
function createService(pool) {
  return {
    async request(userId, email) {
      try {
        return await transaction(pool, async connection => {
          const denied = await profile(connection, userId, 'responsavel');
          if (denied) return denied;
          const [students] = await connection.execute("SELECT id FROM usuarios WHERE email = ? AND tipo_usuario = 'aluno' FOR SHARE", [email]);
          if (!students.length) return accepted();
          const student = students[0].id;
          const [rows] = await connection.execute(`SELECT id, status,
            (encerrado_em <= CURRENT_TIMESTAMP - INTERVAL 24 HOUR AND solicitado_em <= CURRENT_TIMESTAMP - INTERVAL 24 HOUR) AS pode_renovar
            FROM vinculos_acompanhamento WHERE aluno_id = ? AND responsavel_id = ? FOR UPDATE`, [student, userId]);
          if (!rows.length) {
            await connection.execute('INSERT INTO vinculos_acompanhamento (aluno_id, responsavel_id) VALUES (?, ?)', [student, userId]);
          } else if (['recusado', 'revogado'].includes(rows[0].status) && Number(rows[0].pode_renovar) === 1) {
            await connection.execute(`UPDATE vinculos_acompanhamento SET status = 'pendente', solicitado_em = CURRENT_TIMESTAMP,
              autorizado_em = NULL, encerrado_em = NULL WHERE id = ? AND responsavel_id = ?`, [rows[0].id, userId]);
          }
          return accepted();
        });
      } catch (error) {
        // Concurrent first requests race on the unique pair. Never disclose it.
        if (error.code === 'ER_DUP_ENTRY') return accepted();
        throw error;
      }
    },
    list(userId) {
      return transaction(pool, async connection => {
        const denied = await profile(connection, userId);
        if (denied) return denied;
        const [rows] = await connection.execute(`SELECT v.id, v.aluno_id, v.responsavel_id, v.status,
          DATE_FORMAT(v.solicitado_em, '%Y-%m-%d %H:%i:%s') AS solicitado_em,
          DATE_FORMAT(v.autorizado_em, '%Y-%m-%d %H:%i:%s') AS autorizado_em,
          DATE_FORMAT(v.encerrado_em, '%Y-%m-%d %H:%i:%s') AS encerrado_em,
          a.nome AS aluno_nome, r.nome AS responsavel_nome
          FROM vinculos_acompanhamento v JOIN usuarios a ON a.id = v.aluno_id
          JOIN usuarios r ON r.id = v.responsavel_id
          WHERE (v.aluno_id = ? OR v.responsavel_id = ?) ORDER BY v.id DESC`, [userId, userId]);
        return { status: 200, body: rows };
      });
    },
    transition(userId, id, version, action) {
      return transaction(pool, async connection => {
        const denied = await profile(connection, userId, 'aluno');
        if (denied) return denied;
        const [rows] = await connection.execute(`SELECT id, status,
          DATE_FORMAT(solicitado_em, '%Y-%m-%d %H:%i:%s') AS solicitado_em
          FROM vinculos_acompanhamento WHERE id = ? AND aluno_id = ? FOR UPDATE`, [id, userId]);
        if (!rows.length) return notFound();
        const row = rows[0];
        if (row.solicitado_em !== version || row.status !== (action === 'revogar' ? 'autorizado' : 'pendente')) return conflict();
        // Action names and assignments are defined server-side, never interpolated input.
        const updates = {
          autorizar: "status = 'autorizado', autorizado_em = GREATEST(CURRENT_TIMESTAMP, solicitado_em), encerrado_em = NULL",
          recusar: "status = 'recusado', autorizado_em = NULL, encerrado_em = GREATEST(CURRENT_TIMESTAMP, solicitado_em)",
          revogar: "status = 'revogado', encerrado_em = GREATEST(CURRENT_TIMESTAMP, autorizado_em)",
        };
        await connection.execute(`UPDATE vinculos_acompanhamento SET ${updates[action]} WHERE id = ? AND aluno_id = ?`, [id, userId]);
        return { status: 200, body: { id, status: { autorizar: 'autorizado', recusar: 'recusado', revogar: 'revogado' }[action] } };
      });
    },
    students(userId) {
      return transaction(pool, async connection => {
        const denied = await profile(connection, userId, 'responsavel');
        if (denied) return denied;
        const [rows] = await connection.execute(`SELECT a.id, a.nome FROM usuarios a
          JOIN vinculos_acompanhamento v ON v.aluno_id = a.id
          WHERE v.responsavel_id = ? AND v.status = 'autorizado' AND a.tipo_usuario = 'aluno' ORDER BY a.nome, a.id`, [userId]);
        return { status: 200, body: rows };
      });
    },
    read(userId, studentId, resource) {
      return transaction(pool, async connection => {
        const denied = await profile(connection, userId, 'responsavel');
        if (denied) return denied;
        // A shared lock on the authorized link serializes this read against revocation.
        // No session-level authorization cache: every request performs this locking read.
        const [links] = await connection.execute(`SELECT v.id FROM vinculos_acompanhamento v
          JOIN usuarios a ON a.id = v.aluno_id
          WHERE v.responsavel_id = ? AND v.aluno_id = ? AND v.status = 'autorizado'
          AND a.tipo_usuario = 'aluno' FOR SHARE`, [userId, studentId]);
        if (!links.length) return notFound();
        if (resource === 'resumo') {
          const [[counts]] = await connection.execute(`SELECT COUNT(*) AS total,
            COALESCE(SUM(status = 'pendente'), 0) AS pendente,
            COALESCE(SUM(status = 'em andamento'), 0) AS em_andamento,
            COALESCE(SUM(status = 'concluida'), 0) AS concluida FROM tarefas WHERE usuario_id = ?`, [studentId]);
          const [[subjects]] = await connection.execute('SELECT COUNT(*) AS total FROM materias WHERE usuario_id = ?', [studentId]);
          const tarefas = Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, Number(value)]));
          return { status: 200, body: { materias: Number(subjects.total), tarefas,
            progresso: tarefas.total ? Math.round(tarefas.concluida / tarefas.total * 100) : 0 } };
        }
        const queries = {
          materias: 'SELECT id, nome, professor, cor FROM materias WHERE usuario_id = ? ORDER BY id',
          tarefas: 'SELECT id, titulo, descricao, data_entrega, prioridade, status, materia_id FROM tarefas WHERE usuario_id = ? ORDER BY data_entrega, id',
        };
        const [rows] = await connection.execute(queries[resource], [studentId]);
        return { status: 200, body: rows };
      });
    },
  };
}
module.exports = { createService, idValue, validVersion };
