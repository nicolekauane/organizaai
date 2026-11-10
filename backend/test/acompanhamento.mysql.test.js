const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes, createHash } = require('node:crypto');
const { createService } = require('../src/services/acompanhamento');
const testDatabase = process.env.ORGANIZA_AI_TEST_DATABASE;
test('MySQL: SQL real, triggers, transicoes e leituras com rollback integral em banco de testes', { skip: !testDatabase }, async () => {
  // Opt-in only. Never select the production database and never create/drop schema.
  const fs = require('node:fs');
  const path = require('node:path');
  const cfg = require('dotenv').parse(fs.readFileSync(path.join(__dirname, '../.env')));
  assert.match(testDatabase, /^organiza_ai_teste_41_[a-f0-9]{16}$/);
  assert.notEqual(testDatabase, cfg.DB_NAME || 'organiza_ai');
  const connection = await require('mysql2/promise').createConnection({
    host: cfg.DB_HOST || 'localhost', port: Number(cfg.DB_PORT || 3306), user: cfg.DB_USER,
    password: cfg.DB_PASSWORD, database: testDatabase, dateStrings: true,
  });
  const fingerprint = async () => {
    const result = {};
    for (const name of ['usuarios', 'materias', 'tarefas', 'vinculos_acompanhamento']) {
      const [rows] = await connection.query('SELECT * FROM ' + name);
      result[name] = createHash('sha256').update(JSON.stringify(rows.map(r => JSON.stringify(r)).sort())).digest('hex');
    }
    return JSON.stringify(result);
  };
  let before;
  try {
    before = await fingerprint();
    await connection.beginTransaction();
    // Keep all service operations inside the outer transaction; no fixture commits.
    const scoped = { execute: (...args) => connection.execute(...args), beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release() {} };
    const service = createService({ getConnection: async () => scoped });
    const ids = [];
    const emails = [];
    for (const role of ['aluno', 'responsavel', 'aluno', 'responsavel']) {
      const email = randomBytes(16).toString('hex') + '@example.invalid'; emails.push(email);
      const [r] = await connection.execute('INSERT INTO usuarios (nome,email,senha,tipo_usuario) VALUES (?,?,?,?)', ['Fixture acompanhamento', email, 'fixture-sem-login', role]); ids.push(r.insertId);
    }
    const [student, guardian, stranger, otherGuardian] = ids;
    assert.equal((await service.request(guardian, emails[0])).status, 202);
    assert.equal((await service.request(guardian, emails[0])).status, 202);
    assert.equal((await service.request(guardian, randomBytes(12).toString('hex') + '@example.invalid')).status, 202);
    const list = await service.list(student); const own = list.body.find(v => v.responsavel_id === guardian);
    assert.ok(own); assert.equal(own.status, 'pendente'); assert.equal(list.body.filter(v => v.responsavel_id === guardian).length, 1);
    assert.equal((await service.read(guardian, student, 'tarefas')).status, 404);
    assert.equal((await service.transition(stranger, own.id, own.solicitado_em, 'autorizar')).status, 404);
    assert.equal((await service.transition(guardian, own.id, own.solicitado_em, 'autorizar')).status, 403);
    assert.equal((await service.transition(student, own.id, own.solicitado_em, 'autorizar')).status, 200);
    const [subject] = await connection.execute('INSERT INTO materias (nome, usuario_id) VALUES (?,?)', ['Fixture', student]);
    for (const status of ['pendente','em andamento','concluida']) await connection.execute('INSERT INTO tarefas (titulo,status,usuario_id,materia_id) VALUES (?,?,?,?)',['Fixture', status, student, subject.insertId]);
    assert.equal((await service.read(guardian, student, 'materias')).body.length,1);
    assert.equal((await service.read(guardian, student, 'tarefas')).body.length,3);
    assert.deepEqual((await service.read(guardian, student, 'resumo')).body,{materias:1,tarefas:{total:3,pendente:1,em_andamento:1,concluida:1},progresso:33});
    assert.equal((await service.read(otherGuardian, student, 'resumo')).status,404);
    assert.equal((await service.students(guardian)).body.filter(v => v.id === student).length,1);
    assert.equal((await service.transition(student, own.id, own.solicitado_em, 'revogar')).status,200);
    assert.equal((await service.read(guardian, student, 'tarefas')).status,404);
    await service.request(guardian, emails[0]);
    assert.equal((await service.list(student)).body.find(v => v.id === own.id).status,'revogado');
    await connection.execute("UPDATE vinculos_acompanhamento SET solicitado_em = CURRENT_TIMESTAMP - INTERVAL 3 DAY, autorizado_em = CURRENT_TIMESTAMP - INTERVAL 2 DAY, encerrado_em = CURRENT_TIMESTAMP - INTERVAL 2 DAY WHERE id = ?", [own.id]);
    const old = (await service.list(student)).body.find(v => v.id === own.id).solicitado_em;
    await service.request(guardian, emails[0]);
    const renewed = (await service.list(student)).body.find(v => v.id === own.id);
    assert.equal(renewed.status,'pendente');assert.equal(renewed.autorizado_em,null);assert.equal(renewed.encerrado_em,null);
    assert.equal((await service.transition(student,own.id,old,'autorizar')).status,409);
    assert.equal((await service.transition(student,own.id,renewed.solicitado_em,'recusar')).status,200);
  } finally {
    try {
      await connection.rollback();
      if (before !== undefined) assert.ok(await fingerprint() === before, 'Existing records must be preserved after rollback');
    } finally { await connection.end(); }
  }
});
