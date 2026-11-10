const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('node:crypto');
const config = { secret: randomBytes(48).toString('hex'), issuer: 'organiza-ai-api', audience: 'organiza-ai-app' };
const token = (user, expiresIn = 900) => jwt.sign({}, config.secret, { algorithm: 'HS256', subject: String(user), issuer: config.issuer, audience: config.audience, expiresIn });
async function fixture(t) {
  const db = { materias: [], tarefas: [], usuarios: [{ id: 1, tipo_usuario: 'aluno' }, { id: 2, tipo_usuario: 'aluno' }, { id: 3, tipo_usuario: 'responsavel' }] }; let calls = 0;
  const pool = { async execute(sql, args) {
    calls++;
    if (sql === 'SELECT tipo_usuario FROM usuarios WHERE id = ?') return [db.usuarios.filter(u => u.id === args[0]).map(u => ({ tipo_usuario: u.tipo_usuario }))];
    const table = /(?:FROM|INTO|UPDATE) (materias|tarefas)/.exec(sql)?.[1];
    assert.ok(table, 'known table');
    if (sql.startsWith('INSERT')) {
      const fields = /\(([^)]+)\)/.exec(sql)[1].split(', ');
      const row = Object.fromEntries(fields.map((f, i) => [f, args[i]]));
      row.id = db[table].length + 1; row.criado_em = '2026-11-06 12:00:00';
      db[table].push(row); return [{ insertId: row.id }];
    }
    assert.match(sql, /WHERE (?:id = \? AND )?usuario_id = \?/, 'every read/write must scope owner');
    const byId = sql.includes('WHERE id = ?');
    const user = args.at(-1); const id = byId ? args.at(-2) : null;
    const rows = db[table].filter(r => r.usuario_id === user && (!byId || r.id === id));
    if (sql.startsWith('SELECT')) return [structuredClone(rows)];
    if (sql.startsWith('UPDATE')) {
      const fields = /SET (.+) WHERE/.exec(sql)[1].split(', ').map(f => f.split(' = ')[0]);
      rows.forEach(r => fields.forEach((f, i) => { r[f] = args[i]; }));
    }
    if (sql.startsWith('DELETE')) {
      db[table] = db[table].filter(r => !rows.includes(r));
      if (table === 'materias') db.tarefas.forEach(r => { if (rows.some(s => s.id === r.materia_id)) r.materia_id = null; });
    }
    return [{ affectedRows: rows.length }];
  } };
  const app = express(); app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  for (const resource of ['materias', 'tarefas']) app.use('/api/' + resource, require('../src/routes/' + resource).createRouter({ pool, config }));
  app.use((_err, _req, res, _next) => res.status(500).json({ error: 'internal' }));
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  async function request(path, method = 'GET', body, credential = token(1)) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/${path}`, {
      method, headers: { 'Content-Type': 'application/json', ...(credential ? { Authorization: 'Bearer ' + credential } : {}) },
      ...(body && method !== 'GET' ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, body: response.status === 204 ? null : await response.json() };
  }
  return { request, db, calls: () => calls };
}
test('JWT required on every resource operation before database access', async t => {
  const { request, calls } = await fixture(t);
  for (const resource of ['materias', 'tarefas']) {
    for (const [method, suffix] of [['GET', ''], ['GET', '/1'], ['POST', ''], ['PUT', '/1'], ['DELETE', '/1']]) {
      for (const credential of [null, 'invalid', token(1, -10)]) {
        assert.equal((await request(resource + suffix, method, {}, credential)).status, 401);
      }
    }
  }
  assert.equal(calls(), 0);
  assert.equal((await request('health', 'GET', null, null)).status, 200);
});
test('owner CRUD, forged IDs, cross-user isolation and subject/task integrity', async t => {
  const { request, db } = await fixture(t);
  const a = token(1), b = token(2);
  const subject = { nome: 'Matematica', professor: 'Prof', cor: '#E9A9C2', usuario_id: 2 };
  const created = await request('materias?usuario_id=2', 'POST', subject, a);
  assert.equal(created.status, 201); assert.equal(created.body.usuario_id, 1);
  assert.equal(created.body.cor, subject.cor);
  assert.equal((await request('materias', 'POST', { nome: 'Portugues' }, b)).status, 201);
  const task = { titulo: 'Exercicios', descricao: 'Detalhes', data_entrega: '2026-12-10', prioridade: 'alta', status: 'pendente', materia_id: 1, usuario_id: 2 };
  const createdTask = await request('tarefas', 'POST', task, a);
  assert.equal(createdTask.status, 201); assert.equal(createdTask.body.usuario_id, 1);
  assert.equal(createdTask.body.data_entrega, task.data_entrega);
  for (const resource of ['materias', 'tarefas']) {
    const listA = await request(resource + '?usuario_id=2', 'GET', null, a);
    assert.equal(listA.body.length, 1); assert.equal(listA.body[0].usuario_id, 1);
    const listB = await request(resource + '?usuario_id=1', 'GET', null, b);
    assert.ok(listB.body.every(r => r.usuario_id === 2));
    const payload = resource === 'materias' ? subject : task;
    for (const method of ['GET', 'PUT', 'DELETE']) {
      const foreign = await request(resource + '/1?usuario_id=1', method, method === 'PUT' ? { ...payload, usuario_id: 1 } : null, b);
      const missing = await request(resource + '/999', method, method === 'PUT' ? payload : null, b);
      assert.equal(foreign.status, 404); assert.deepEqual(foreign, missing);
    }
    assert.equal((await request(resource + '/1', 'GET', null, a)).status, 200);
  }
  assert.equal((await request('tarefas', 'POST', { ...task, usuario_id: 1 }, b)).status, 404);
  assert.equal((await request('tarefas', 'POST', { ...task, materia_id: 999 }, b)).status, 404);
  for (const status of ['concluida', 'pendente', 'em andamento']) {
    const updated = await request('tarefas/1', 'PUT', { ...task, status, usuario_id: 2 }, a);
    assert.equal(updated.status, 200); assert.equal(updated.body.status, status); assert.equal(updated.body.usuario_id, 1);
  }
  assert.equal((await request('tarefas/1', 'PUT', { ...task, materia_id: 2 }, a)).status, 404);
  assert.equal((await request('tarefas', 'POST', { ...task, data_entrega: '2026-02-30' }, a)).status, 400);
  const optional = await request('tarefas', 'POST', { titulo: 'Sem prazo' }, a);
  assert.equal(optional.status, 201); assert.equal(optional.body.data_entrega, null); assert.equal(optional.body.materia_id, null);
  const editedSubject = await request('materias/1', 'PUT', { nome: 'Novo', cor: '#FFFFFF', usuario_id: 2 }, a);
  assert.equal(editedSubject.status, 200); assert.equal(editedSubject.body.cor, '#FFFFFF');
  assert.equal((await request('materias/1?usuario_id=2', 'DELETE', null, a)).status, 204);
  assert.equal(db.tarefas[0].materia_id, null);
  assert.equal((await request('tarefas/1?usuario_id=2', 'DELETE', null, a)).status, 204);
  assert.equal((await request('tarefas/1', 'GET', null, a)).status, 404);
  assert.equal(db.materias[0].usuario_id, 2);
});

test('reported task registers without usuario_id; all priorities and statuses, optional fields and safe validation', async t => {
  const { request } = await fixture(t);
  const subject = await request('materias', 'POST', { nome: 'tecnico', cor: '#5D1C39' });
  assert.equal(subject.status, 201);
  const payload = { titulo: 'Projeto expo', descricao: 'Preciso entregar ate sexta', data_entrega: '2026-11-07',
    prioridade: 'alta', status: 'em andamento', materia_id: subject.body.id };
  const created = await request('tarefas', 'POST', payload);
  assert.equal(created.status, 201); assert.equal(created.body.usuario_id, 1);
  for (const [key, value] of Object.entries(payload)) assert.equal(created.body[key], value);
  for (const prioridade of ['baixa', 'media', 'alta']) {
    for (const status of ['pendente', 'em andamento', 'concluida']) {
      const result = await request('tarefas', 'POST', { ...payload, prioridade, status });
      assert.equal(result.status, 201); assert.equal(result.body.prioridade, prioridade); assert.equal(result.body.status, status);
    }
  }
  for (const body of [{ titulo: 'Sem opcionais' }, { titulo: 'Opcionais nulos', data_entrega: null, materia_id: null }]) {
    const result = await request('tarefas', 'POST', body);
    assert.equal(result.status, 201); assert.equal(result.body.data_entrega, null); assert.equal(result.body.materia_id, null);
  }
  for (const patch of [{ data_entrega: '07/11/2026' }, { data_entrega: '2026-02-30' }, { prioridade: 'Alta' },
    { status: 'Em andamento' }, { materia_id: -1 }, { titulo: ' ' }]) {
    const result = await request('tarefas', 'POST', { ...payload, ...patch });
    assert.equal(result.status, 400); assert.equal(result.body.error.includes('usuario_id'), false);
    assert.match(result.body.error, /token/);
  }
  assert.equal((await request('tarefas', 'POST', { ...payload, usuario_id: 1 }, token(2))).status, 404);
  const id = created.body.id;
  for (const status of ['concluida', 'pendente']) {
    const result = await request('tarefas/' + id, 'PUT', { ...payload, titulo: 'Projeto revisado', status });
    assert.equal(result.status, 200); assert.equal(result.body.status, status); assert.equal(result.body.titulo, 'Projeto revisado');
  }
  assert.equal((await request('tarefas/' + id, 'DELETE')).status, 204);
  assert.equal((await request('tarefas/' + id)).status, 404);
});

test('perfil atual no banco protege todas as operacoes, sem confiar em corpo, query ou JWT', async t => {
  const { request, db } = await fixture(t);
  const forged = jwt.sign({ tipo_usuario: 'aluno' }, config.secret, { algorithm: 'HS256', subject: '3', issuer: config.issuer, audience: config.audience, expiresIn: 900 });
  for (const resource of ['materias', 'tarefas']) {
    for (const [method, suffix] of [['GET', ''], ['GET', '/1'], ['POST', ''], ['PUT', '/1'], ['DELETE', '/1']]) {
      assert.equal((await request(resource + suffix + '?tipo_usuario=aluno&usuario_id=1', method, { tipo_usuario: 'aluno', usuario_id: 1 }, forged)).status, 403);
    }
  }
  assert.equal(db.materias.length, 0); assert.equal(db.tarefas.length, 0);
  const session = token(1);
  assert.equal((await request('materias', 'GET', null, session)).status, 200);
  db.usuarios[0].tipo_usuario = 'responsavel';
  assert.equal((await request('materias', 'GET', null, session)).status, 403);
  db.usuarios[0].tipo_usuario = 'invalido';
  assert.equal((await request('tarefas', 'GET', null, session)).status, 403);
  db.usuarios.shift();
  assert.equal((await request('tarefas', 'GET', null, session)).status, 401);
});

test('erro de banco na autorizacao nao libera o controller', async () => {
  const { requireProfile } = require('../src/middleware/requireProfile');
  const failure = new Error('database unavailable');
  let forwarded;
  const middleware = requireProfile({ execute: async () => { throw failure; } }, 'aluno');
  await middleware({ auth: { userId: 1 } }, {}, error => { forwarded = error; });
  assert.equal(forwarded, failure);
});

test('invalid subject types and dates outside MySQL range fail without creating tasks', async t => {
  const { request, db } = await fixture(t);
  await request('materias', 'POST', { nome: 'Materia' });
  for (const materia_id of [true, false, [1], {}, '', '1e0', '1.0', 2147483648]) {
    assert.equal((await request('tarefas', 'POST', { titulo: 'Invalid', materia_id })).status, 400);
  }
  for (const data_entrega of ['0000-01-01', '0999-12-31', '2025-02-29', '2026-04-31']) {
    assert.equal((await request('tarefas', 'POST', { titulo: 'Invalid', data_entrega })).status, 400);
  }
  assert.equal(db.tarefas.length, 0);
  for (const data_entrega of ['1000-01-01', '2028-02-29', '9999-12-31']) {
    assert.equal((await request('tarefas', 'POST', { titulo: 'Valid', materia_id: '1', data_entrega })).status, 201);
  }
});