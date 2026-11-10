const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const jwt = require('jsonwebtoken');
const { randomBytes, scryptSync } = require('node:crypto');
const { createAuthRouter } = require('../src/routes/auth');
const { readAuthConfig } = require('../src/config/auth');
const { hashPassword, verifyPassword } = require('../src/services/passwords');
const config = readAuthConfig({ JWT_SECRET: randomBytes(48).toString('hex') });
async function fixture(t) {
  const users = [];
  const pool = { async execute(sql, params) {
    if (sql.startsWith('INSERT')) {
      if (users.some(u => u.email === params[1])) throw Object.assign(new Error('duplicate'), { code: 'ER_DUP_ENTRY' });
      const user = { id: users.length + 1, nome: params[0], email: params[1], senha: params[2], tipo_usuario: params[3] };
      users.push(user); return [{ insertId: user.id }];
    }
    const found = users.filter(u => sql.includes('WHERE email') ? u.email === params[0] : u.id === params[0]);
    return [found.map(u => {
      if (sql.includes(', senha FROM')) return { ...u };
      const { senha, ...safe } = u; return safe;
    })];
  } };
  const app = express(); app.use(express.json());
  app.use('/api/auth', createAuthRouter({ pool, config }));
  app.use('/api/usuarios', require('../src/routes/usuarios'));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  async function request(path, body, token, method) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/${path}`, {
      method: method || (body ? 'POST' : 'GET'),
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, body: await response.json() };
  }
  return { request, users };
}
const account = { nome: 'Aluno Teste', email: 'aluno@example.com', senha: 'senha de teste segura' };
test('cadastro, duplicidade, login válido e /me sem dados sensíveis', async t => {
  const { request, users } = await fixture(t);
  const created = await request('auth/cadastro', { ...account, email: ' ALUNO@example.com ' });
  assert.equal(created.status, 201); assert.equal(created.body.usuario.tipo_usuario, 'aluno');
  assert.equal(created.body.usuario.email, account.email); assert.equal(created.body.usuario.senha, undefined);
  assert.notEqual(users[0].senha, account.senha);
  assert.equal((await request('auth/cadastro', account)).status, 409);
  const login = await request('auth/login', account); assert.equal(login.status, 200);
  const claims = jwt.verify(login.body.token, config.secret, { algorithms: ['HS256'], issuer: config.issuer, audience: config.audience });
  assert.equal(claims.sub, '1'); assert.equal(claims.exp - claims.iat, 900);
  assert.deepEqual(Object.keys(claims).sort(), ['aud', 'exp', 'iat', 'iss', 'sub']);
  assert.equal(login.body.usuario.senha, undefined);
  const me = await request('auth/me', null, login.body.token); assert.equal(me.status, 200);
  assert.equal(me.body.usuario.id, 1); assert.equal(me.body.usuario.senha, undefined);
  users.length = 0;
  assert.equal((await request('auth/me', null, login.body.token)).status, 401);
});
test('validacao de perfis e bloqueio do CRUD legado', async t => {
  const { request, users } = await fixture(t);
  for (const body of [{}, { ...account, nome: ' ' }, { ...account, email: 'inválido' },
    { ...account, senha: 'curta' }, { ...account, senha: 'a'.repeat(129) },
    { ...account, tipo_usuario: null }, { ...account, tipo_usuario: '' }, { ...account, tipo_usuario: 'Aluno' }, { ...account, tipo_usuario: 'admin' }]) {
    assert.equal((await request('auth/cadastro', body)).status, 400);
  }
  assert.equal(users.length, 0);
  for (const method of ['GET', 'POST', 'PUT', 'DELETE']) {
    assert.equal((await request('usuarios/1', null, null, method)).status, 403);
  }
});
test('login inválido, conta inexistente e limite de tentativas', async t => {
  const { request } = await fixture(t); await request('auth/cadastro', account);
  const wrong = await request('auth/login', { ...account, senha: 'senha errada' });
  const missing = await request('auth/login', { ...account, email: 'outro@example.com' });
  assert.equal(wrong.status, 401); assert.deepEqual(wrong.body, missing.body);
  for (let i = 0; i < 8; i++) assert.equal((await request('auth/login', account)).status, 200);
  assert.equal((await request('auth/login', account)).status, 429);
});
test('token ausente, inválido, expirado e claims incorretos', async t => {
  const { request } = await fixture(t);
  const sign = (payload, overrides = {}, secret = config.secret) => jwt.sign(payload, secret, {
    algorithm: 'HS256', issuer: config.issuer, audience: config.audience, ...overrides });
  const tokens = [null, 'inválido', sign({ sub: '1', exp: Math.floor(Date.now()/1000)-10 }),
    sign({ sub: '1', exp: Math.floor(Date.now()/1000)+100 }, { issuer: 'outro' }),
    sign({ sub: '1', exp: Math.floor(Date.now()/1000)+100 }, { audience: 'outro' }),
    sign({ sub: '1', exp: Math.floor(Date.now()/1000)+100 }, { algorithm: 'HS384' }),
    sign({ sub: '1', exp: Math.floor(Date.now()/1000)+100 }, {}, randomBytes(48).toString('hex')),
    sign({ sub: '1' }), sign({ sub: '0', exp: Math.floor(Date.now()/1000)+100 })];
  for (const token of tokens) assert.equal((await request('auth/me', null, token)).status, 401);
});
test('scrypt compatével com hash anterior e salt independente', async () => {
  const salt = randomBytes(16).toString('hex');
  const legacy = `scrypt$${salt}$${scryptSync(account.senha, salt, 64).toString('hex')}`;
  assert.equal(await verifyPassword(account.senha, legacy), true);
  assert.equal(await verifyPassword('errada', legacy), false);
  assert.equal(await verifyPassword(account.senha, 'hash inválido'), false);
  assert.notEqual(await hashPassword(account.senha), await hashPassword(account.senha));
});
test('segredo obrigatério e sem placeholder', () => {
  for (const JWT_SECRET of [undefined, '', 'curto', 'COLOQUE_'.repeat(10)]) {
    assert.throws(() => readAuthConfig({ JWT_SECRET }));
  }
});

test('cadastro explicito de ambos os perfis, login e me preservam perfil sem claim de permissao', async t => {
  const { request } = await fixture(t);
  for (const tipo_usuario of ['aluno', 'responsavel']) {
    const body = { ...account, email: tipo_usuario + '@example.com', tipo_usuario };
    const created = await request('auth/cadastro', body);
    assert.equal(created.status, 201);
    assert.equal(created.body.usuario.tipo_usuario, tipo_usuario);
    const login = await request('auth/login', body);
    assert.equal(login.status, 200);
    assert.equal(login.body.usuario.tipo_usuario, tipo_usuario);
    assert.equal(jwt.decode(login.body.token).tipo_usuario, undefined);
    const me = await request('auth/me', null, login.body.token);
    assert.equal(me.status, 200);
    assert.equal(me.body.usuario.tipo_usuario, tipo_usuario);
    assert.equal(me.body.usuario.senha, undefined);
    assert.equal((await request('usuarios/1', { tipo_usuario: 'aluno' }, login.body.token, 'PUT')).status, 403);
  }
});
