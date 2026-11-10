const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('node:crypto');
const { createVinculosRouter, createAcompanhamentoRouter, noStore } = require('../src/routes/acompanhamento');
const { createService } = require('../src/services/acompanhamento');
const config = { secret: randomBytes(48).toString('hex'), issuer: 'test-api', audience: 'test-app' };
const token = id => jwt.sign({ tipo_usuario: 'aluno' }, config.secret, { subject: String(id), issuer: config.issuer, audience: config.audience, expiresIn: 900 });
const version = '2026-11-09 10:00:00';
const closed = '2026-11-07 10:00:00';
const user = (id, tipo_usuario) => ({ id, tipo_usuario, nome: 'Conta ' + id, email: id + '@example.com' });
async function fixture(t) {
  const db = { users: [user(1, 'aluno'), user(2, 'responsavel'), user(3, 'aluno'), user(4, 'responsavel')], links: [],
    materias: [{ id: 11, usuario_id: 1, nome: 'Matematica', professor: null, cor: '#fff' }, { id: 12, usuario_id: 3, nome: 'Privada' }],
    tarefas: ['pendente', 'em andamento', 'concluida', 'concluida'].map((status, i) => ({ id: i + 1, usuario_id: 1, titulo: 'Tarefa ' + i, descricao: null, data_entrega: null, prioridade: 'media', status, materia_id: 11 })) };
  const calls = []; let queue = Promise.resolve(); let released = 0; let rolledBack = 0; let failOn; let failCode;
  const now = '2026-11-09 12:00:00';
  const safe = row => structuredClone(row);
  async function execute(raw, args = []) {
    const sql = raw.replace(/\s+/g, ' ').trim(); calls.push({ sql, args });
    if (failOn && sql.includes(failOn)) throw Object.assign(new Error('injected database failure'), { code: failCode });
    if (sql === 'SELECT tipo_usuario FROM usuarios WHERE id = ?' || sql === 'SELECT id, tipo_usuario FROM usuarios WHERE id = ? FOR SHARE') return [db.users.filter(u => u.id === args[0]).map(u => ({ id: u.id, tipo_usuario: u.tipo_usuario }))];
    if (sql.startsWith('SELECT id FROM usuarios WHERE email')) {
      assert.match(sql, /tipo_usuario = 'aluno' FOR SHARE$/);
      return [db.users.filter(u => u.email === args[0] && u.tipo_usuario === 'aluno').map(u => ({ id: u.id }))];
    }
    if (sql.startsWith('SELECT id, status, (encerrado_em')) {
      assert.match(sql, /WHERE aluno_id = \? AND responsavel_id = \? FOR UPDATE$/);
      return [db.links.filter(v => v.aluno_id === args[0] && v.responsavel_id === args[1]).map(v => ({ ...safe(v), pode_renovar: Boolean(v.encerrado_em && v.encerrado_em <= '2026-11-08 12:00:00' && v.solicitado_em <= '2026-11-08 12:00:00') ? 1 : 0 }))];
    }
    if (sql.startsWith('INSERT INTO vinculos_acompanhamento')) {
      if (db.links.some(v => v.aluno_id === args[0] && v.responsavel_id === args[1])) throw Object.assign(new Error('duplicate'), { code: 'ER_DUP_ENTRY' });
      const row = { id: db.links.length + 1, aluno_id: args[0], responsavel_id: args[1], status: 'pendente', solicitado_em: now, autorizado_em: null, encerrado_em: null };
      db.links.push(row); return [{ insertId: row.id }];
    }
    if (sql.startsWith('SELECT id, status, DATE_FORMAT')) {
      assert.match(sql, /WHERE id = \? AND aluno_id = \? FOR UPDATE$/);
      return [db.links.filter(v => v.id === args[0] && v.aluno_id === args[1]).map(safe)];
    }
    if (sql.startsWith('UPDATE vinculos_acompanhamento')) {
      assert.match(sql, /WHERE id = \? AND (?:aluno_id|responsavel_id) = \?$/);
      const row = db.links.find(v => v.id === args[0] && v[sql.includes('AND aluno_id') ? 'aluno_id' : 'responsavel_id'] === args[1]);
      if (!row) return [{ affectedRows: 0 }];
      const state = /status = '([^']+)'/.exec(sql)[1]; row.status = state;
      if (state === 'pendente') { row.solicitado_em = now; row.autorizado_em = null; row.encerrado_em = null; }
      if (state === 'autorizado') { row.autorizado_em = now; row.encerrado_em = null; }
      if (state === 'recusado') { row.autorizado_em = null; row.encerrado_em = now; }
      if (state === 'revogado') row.encerrado_em = now;
      return [{ affectedRows: 1 }];
    }
    if (sql.startsWith('SELECT v.id, v.aluno_id')) {
      assert.match(sql, /WHERE \(v.aluno_id = \? OR v.responsavel_id = \?\)/);
      return [db.links.filter(v => v.aluno_id === args[0] || v.responsavel_id === args[1]).map(v => ({ ...safe(v), aluno_nome: db.users.find(u => u.id === v.aluno_id).nome, responsavel_nome: db.users.find(u => u.id === v.responsavel_id).nome }))];
    }
    if (sql.startsWith('SELECT a.id, a.nome')) {
      assert.match(sql, /v.responsavel_id = \? AND v.status = 'autorizado'/);
      return [db.users.filter(u => u.tipo_usuario === 'aluno' && db.links.some(v => v.aluno_id === u.id && v.responsavel_id === args[0] && v.status === 'autorizado')).map(u => ({ id: u.id, nome: u.nome }))];
    }
    if (sql.startsWith('SELECT v.id FROM')) {
      assert.match(sql, /v.responsavel_id = \? AND v.aluno_id = \? AND v.status = 'autorizado'/); assert.match(sql, /FOR SHARE$/);
      return [db.links.filter(v => v.responsavel_id === args[0] && v.aluno_id === args[1] && v.status === 'autorizado' && db.users.some(u => u.id === v.aluno_id && u.tipo_usuario === 'aluno')).map(v => ({ id: v.id }))];
    }
    if (sql.startsWith('SELECT COUNT(*) AS total, COALESCE')) {
      assert.match(sql, /FROM tarefas WHERE usuario_id = \?$/);
      const rows = db.tarefas.filter(v => v.usuario_id === args[0]);
      return [[{ total: rows.length, pendente: rows.filter(v => v.status === 'pendente').length, em_andamento: rows.filter(v => v.status === 'em andamento').length, concluida: rows.filter(v => v.status === 'concluida').length }]];
    }
    if (sql === 'SELECT COUNT(*) AS total FROM materias WHERE usuario_id = ?') return [[{ total: db.materias.filter(v => v.usuario_id === args[0]).length }]];
    if (sql.startsWith('SELECT id, nome, professor, cor FROM materias') || sql.startsWith('SELECT id, titulo, descricao')) {
      assert.match(sql, /WHERE usuario_id = \? ORDER BY/);
      return [db[sql.includes('FROM materias') ? 'materias' : 'tarefas'].filter(v => v.usuario_id === args[0]).map(v => { const { usuario_id, ...row } = v; return safe(row); })];
    }
    throw new Error('Unexpected SQL: ' + sql);
  }
  const pool = { execute, async getConnection() {
    let unlock, snapshot;
    return { execute,
      async beginTransaction() { const previous = queue; queue = new Promise(resolve => { unlock = resolve; }); await previous; snapshot = safe(db.links); },
      async commit() {}, async rollback() { rolledBack++; if (snapshot) db.links = snapshot; }, release() { released++; if (unlock) unlock(); } };
  } };
  const app = express(); app.use(['/api/vinculos', '/api/acompanhamento'], noStore); app.use(express.json());
  app.use('/api/vinculos', createVinculosRouter({ pool, config }));
  app.use('/api/acompanhamento', createAcompanhamentoRouter({ pool, config }));
  for (const name of ['materias', 'tarefas']) app.use('/api/' + name, require('../src/routes/' + name).createRouter({ pool, config }));
  app.use((error, _req, res, _next) => res.status(error.type === 'entity.parse.failed' ? 400 : 500).json({ error: 'Erro interno.' }));
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const request = async (url, id = 2, method = 'GET', body) => {
    const response = await fetch('http://127.0.0.1:' + server.address().port + '/api/' + url, { method,
      headers: { 'Content-Type': 'application/json', ...(id ? { Authorization: 'Bearer ' + token(id) } : {}) },
      ...(body === undefined ? {} : { body: body === '__malformed__' ? '{' : JSON.stringify(body) }) });
    return { status: response.status, body: await response.json(), cache: response.headers.get('cache-control'), retry: response.headers.get('retry-after') };
  };
  const link = (status = 'pendente', student = 1, guardian = 2) => {
    const row = { id: db.links.length + 1, aluno_id: student, responsavel_id: guardian, status, solicitado_em: version, autorizado_em: status === 'autorizado' || status === 'revogado' ? version : null, encerrado_em: status === 'recusado' || status === 'revogado' ? version : null }; db.links.push(row); return row;
  };
  return { request, db, link, calls, service: createService(pool), fail: (value, code) => { failOn = value; failCode = code; }, stats: () => ({ released, rolledBack }) };
}
const actionBody = { solicitado_em: version };
test('solicitacao valida, duplicada, inexistente e email de responsavel tem resposta generica identica', async t => {
  const { request, db } = await fixture(t);
  const responses = [];
  for (const email of [' 1@EXAMPLE.COM ', '1@example.com', 'ausente@example.com', '2@example.com']) responses.push(await request('vinculos/solicitacoes', 2, 'POST', { email, usuario_id: 3, status: 'autorizado' }));
  assert.ok(responses.every(r => r.status === 202 && r.cache === 'no-store'));
  responses.forEach(r => assert.deepEqual(r.body, responses[0].body));
  assert.equal(db.links.length, 1); assert.equal(db.links[0].status, 'pendente'); assert.equal(db.links[0].aluno_id, 1); assert.equal(db.links[0].responsavel_id, 2);
});
test('validacao de email, IDs e versao da solicitacao', async t => {
  const { request, link } = await fixture(t); link();
  for (const email of [null, '', 'invalido', 'x'.repeat(151), {}]) assert.equal((await request('vinculos/solicitacoes', 2, 'POST', { email })).status, 400);
  for (const id of ['0', '-1', '1e0', '1.0', '2147483648', 'abc']) assert.equal((await request('vinculos/' + id + '/autorizar', 1, 'POST', actionBody)).status, 404);
  for (const solicitado_em of [null, '2026-02-30 10:00:00', '2026-11-09', {}, '2026-11-09 25:00:00']) assert.equal((await request('vinculos/1/autorizar', 1, 'POST', { solicitado_em })).status, 400);
});
test('JWT obrigatorio e no-store em todas as rotas e erros', async t => {
  const { request, calls } = await fixture(t);
  for (const [url,method] of [['vinculos','GET'],['vinculos/solicitacoes','POST'],['vinculos/1/autorizar','POST'],['vinculos/1/recusar','POST'],['vinculos/1/revogar','POST'],['acompanhamento/alunos','GET'],...['materias','tarefas','resumo'].map(r => ['acompanhamento/alunos/1/' + r,'GET'])]) {
    const response = await request(url, null, method); assert.equal(response.status,401); assert.equal(response.cache,'no-store');
  }
  assert.equal(calls.length,0);
});
test('perfis atuais e conta removida; responsavel nao aprova e aluno nao solicita nem acompanha', async t => {
  const { request, db, link } = await fixture(t); link();
  assert.equal((await request('vinculos/solicitacoes',1,'POST',{email:'3@example.com'})).status,403);
  for (const action of ['autorizar','recusar','revogar']) assert.equal((await request('vinculos/1/'+action,2,'POST',actionBody)).status,403);
  assert.equal((await request('acompanhamento/alunos',1)).status,403);
  db.users.find(u => u.id===2).tipo_usuario='aluno';
  assert.equal((await request('acompanhamento/alunos',2)).status,403);
  db.users=db.users.filter(u=>u.id!==2);
  assert.equal((await request('vinculos',2)).status,401);
});
test('listagem isolada e sem email, senha ou hashes', async t => {
  const { request, link } = await fixture(t); link(); link('pendente',3,4);
  for (const id of [1,2]) { const r=await request('vinculos?usuario_id=3',id); assert.equal(r.status,200); assert.equal(r.body.length,1); assert.equal(r.body[0].id,1); assert.ok(!/email|senha|hash/.test(JSON.stringify(r.body))); }
  assert.equal((await request('vinculos',4)).body[0].id,2);
});
test('aprovar, ler materias/tarefas/resumo e revogar impede imediatamente novas leituras', async t => {
  const { request, link } = await fixture(t); link();
  assert.equal((await request('acompanhamento/alunos/1/tarefas')).status,404);
  assert.deepEqual((await request('acompanhamento/alunos')).body,[]);
  assert.equal((await request('vinculos/1/autorizar',1,'POST',actionBody)).status,200);
  assert.deepEqual((await request('acompanhamento/alunos')).body,[{id:1,nome:'Conta 1'}]);
  assert.equal((await request('acompanhamento/alunos/1/materias?usuario_id=3')).body.length,1);
  assert.equal((await request('acompanhamento/alunos/1/tarefas')).body.length,4);
  assert.deepEqual((await request('acompanhamento/alunos/1/resumo')).body,{materias:1,tarefas:{total:4,pendente:1,em_andamento:1,concluida:2},progresso:50});
  assert.equal((await request('vinculos/1/revogar',1,'POST',actionBody)).status,200);
  for(const resource of ['materias','tarefas','resumo']) assert.equal((await request('acompanhamento/alunos/1/'+resource)).status,404);
  assert.deepEqual((await request('acompanhamento/alunos')).body,[]);
});
test('recusa, repeticao de decisoes e transicoes invalidas nao concedem acesso', async t => {
  const { request, link, db } = await fixture(t); link();
  assert.equal((await request('vinculos/1/revogar',1,'POST',actionBody)).status,409);
  assert.equal((await request('vinculos/1/recusar',1,'POST',actionBody)).status,200);
  for(const action of ['autorizar','recusar','revogar']) assert.equal((await request('vinculos/1/'+action,1,'POST',actionBody)).status,409);
  assert.equal(db.links[0].status,'recusado'); assert.equal((await request('acompanhamento/alunos/1/resumo')).status,404);
});
test('terceiros recebem 404 para vinculos e alunos inacessiveis; recursos inexistentes iguais', async t => {
  const { request, link } = await fixture(t); link('autorizado');
  for(const action of ['autorizar','recusar','revogar']) assert.equal((await request('vinculos/1/'+action,3,'POST',actionBody)).status,404);
  for(const resource of ['materias','tarefas','resumo']) {
    const foreign=await request('acompanhamento/alunos/1/'+resource,4);
    const missing=await request('acompanhamento/alunos/999/'+resource,4);
    assert.equal(foreign.status,404); assert.deepEqual(foreign.body,missing.body);
  }
});
test('renovacao exige cooldown e nova aprovacao; decisao antiga nao vale para nova solicitacao', async t => {
  const { request, link, db } = await fixture(t); const v=link('revogado');
  await request('vinculos/solicitacoes',2,'POST',{email:'1@example.com'}); assert.equal(v.status,'revogado');
  v.encerrado_em=closed;v.solicitado_em=closed;v.autorizado_em=closed;
  await request('vinculos/solicitacoes',2,'POST',{email:'1@example.com'});
  assert.equal(v.status,'pendente');assert.equal(v.autorizado_em,null);assert.equal(v.encerrado_em,null);assert.notEqual(v.solicitado_em,version);assert.equal(db.links.length,1);
  assert.equal((await request('vinculos/1/autorizar',1,'POST',actionBody)).status,409);
  assert.equal((await request('acompanhamento/alunos/1/tarefas')).status,404);
  assert.equal((await request('vinculos/1/autorizar',1,'POST',{solicitado_em:v.solicitado_em})).status,200);
  await request('vinculos/solicitacoes',2,'POST',{email:'1@example.com'});assert.equal(v.status,'autorizado');
});
test('limite de solicitacoes por conta inclui inexistentes e duplicadas', async t => {
  const { request } = await fixture(t);
  for(let i=0;i<10;i++) assert.equal((await request('vinculos/solicitacoes',2,'POST',{email:'ausente@example.com'})).status,202);
  const blocked=await request('vinculos/solicitacoes',2,'POST',{email:'1@example.com'}); assert.equal(blocked.status,429);assert.ok(blocked.retry);assert.equal(blocked.cache,'no-store');
});
test('resumo sem tarefas retorna zeros e protege alunos sem vinculo autorizado', async t => {
  const { request, link } = await fixture(t);link('autorizado',3);
  assert.deepEqual((await request('acompanhamento/alunos/3/resumo')).body,{materias:1,tarefas:{total:0,pendente:0,em_andamento:0,concluida:0},progresso:0});
});
test('responsavel nao escreve por rotas novas ou CRUD existente', async t => {
  const { request, link, db } = await fixture(t);link('autorizado'); const original=JSON.stringify({materias:db.materias,tarefas:db.tarefas});
  for(const resource of ['materias','tarefas']) for(const method of ['POST','PUT','PATCH','DELETE']) {
    assert.equal((await request('acompanhamento/alunos/1/'+resource,2,method,{status:'concluida'})).status,404);
    assert.equal((await request(resource+'/1',2,method,{usuario_id:1,status:'concluida'})).status,403);
  }
  assert.equal(JSON.stringify({materias:db.materias,tarefas:db.tarefas}),original);
});
test('decisoes simultaneas sao serializadas; apenas uma altera pendente', async t => {
  const { request, link, db } = await fixture(t);link();
  const results=await Promise.all(['autorizar','recusar'].map(action=>request('vinculos/1/'+action,1,'POST',actionBody)));
  assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);assert.ok(['autorizado','recusado'].includes(db.links[0].status));
});
test('solicitacoes simultaneas mantem um unico par pendente', async t => {
  const { request, db } = await fixture(t);
  const results=await Promise.all(Array.from({length:5},()=>request('vinculos/solicitacoes',2,'POST',{email:'1@example.com'})));
  assert.ok(results.every(r=>r.status===202));assert.equal(db.links.length,1);assert.equal(db.links[0].status,'pendente');
});
test('falha SQL fecha acesso, reverte e libera conexao', async t => {
  const { request, link, fail, stats } = await fixture(t);link('autorizado');fail('FROM tarefas WHERE');
  const response=await request('acompanhamento/alunos/1/tarefas');assert.equal(response.status,500);assert.equal(response.cache,'no-store');assert.ok(stats().released>0);assert.ok(stats().rolledBack>0);
});
test('leitura iniciada depois de revogacao concluida falha inclusive com o mesmo token', async t => {
  const { service, link } = await fixture(t);link('autorizado');
  assert.equal((await service.read(2,1,'tarefas')).status,200);
  assert.equal((await service.transition(1,1,version,'revogar')).status,200);
  assert.equal((await service.read(2,1,'tarefas')).status,404);
});

test('JSON malformado nao permite cache e falha antes do acesso ao banco', async t => {
  const { request, calls } = await fixture(t);
  const response=await request('vinculos/solicitacoes',2,'POST','__malformed__');
  assert.equal(response.status,400);assert.equal(response.cache,'no-store');assert.equal(calls.length,0);
});
test('renovacao de recusado permanece pendente e exige decisao da nova versao', async t => {
  const { request, link } = await fixture(t);const v=link('recusado');v.solicitado_em=closed;v.encerrado_em=closed;
  await request('vinculos/solicitacoes',2,'POST',{email:'1@example.com'});
  assert.equal(v.status,'pendente');assert.equal(v.autorizado_em,null);
  assert.equal((await request('acompanhamento/alunos/1/resumo')).status,404);
  assert.equal((await request('vinculos/1/autorizar',1,'POST',{solicitado_em:closed})).status,409);
  assert.equal((await request('vinculos/1/autorizar',1,'POST',{solicitado_em:v.solicitado_em})).status,200);
});

test('limite por IP se mantem ao alternar contas de responsavel', async t => {
  const { request, db } = await fixture(t);db.users.push(user(6,'responsavel'),user(8,'responsavel'));
  for(const id of [2,4,6]) for(let i=0;i<10;i++) assert.equal((await request('vinculos/solicitacoes',id,'POST',{email:'ausente@example.com'})).status,202);
  const blocked=await request('vinculos/solicitacoes',8,'POST',{email:'ausente@example.com'});
  assert.equal(blocked.status,429);assert.ok(blocked.retry);
});
test('deadlock e timeout revertem a transacao e retornam 503 sem liberar acesso', async t => {
  for(const code of ['ER_LOCK_DEADLOCK','ER_LOCK_WAIT_TIMEOUT']) {
    const { request, link, fail, stats } = await fixture(t);link('autorizado');fail('SELECT v.id FROM',code);
    const r=await request('acompanhamento/alunos/1/tarefas');assert.equal(r.status,503);assert.equal(r.retry,'1');assert.equal(r.cache,'no-store');assert.equal(stats().rolledBack,1);assert.equal(stats().released,1);
  }
});
