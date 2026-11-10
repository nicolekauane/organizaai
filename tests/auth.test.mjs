import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { authSession, createMemorySession, EXPIRED_MESSAGE } from '../src/auth/session.js';
import { request, ApiError } from '../src/services/api.js';
import { login, cadastro, logout } from '../src/services/authService.js';
import { validateAuthForm } from '../src/utils/authValidation.js';
const originalFetch = globalThis.fetch;
afterEach(() => { logout(); globalThis.fetch = originalFetch; });
const response = (status, data) => ({ status, ok: status >= 200 && status < 300, text: async () => JSON.stringify(data) });
function signedIn(user = { id: 1, nome: 'Aluno A' }, token = 'test-token-A') {
  const version = authSession.begin();
  authSession.acceptToken(version, token, Date.now() + 900000); authSession.complete(version, user);
}
test('form validates name, email, required password, bounds and confirmation', () => {
  const valid = { nome: 'Aluno', email: 'aluno@example.com', senha: 'senha longa', confirmar: 'senha longa' };
  assert.equal(validateAuthForm(valid, true), '');
  for (const patch of [{ nome: ' ' }, { email: 'errado' }, { senha: '' }, { senha: 'curta', confirmar: 'curta' }, { confirmar: 'outra' }, { senha: 'a'.repeat(129) }]) {
    assert.ok(validateAuthForm({ ...valid, ...patch }, true));
  }
  assert.ok(validateAuthForm({ email: 'aluno@example.com' }));
  assert.equal(validateAuthForm({ email: 'aluno@example.com', senha: 'senha antiga' }), '');
});
test('registration defaults to aluno and never sends Bearer or extra fields', async () => {
  globalThis.fetch = async (url, options) => {
    assert.ok(url.endsWith('/api/auth/cadastro'));
    assert.equal(options.headers.Authorization, undefined);
    assert.deepEqual(JSON.parse(options.body), { nome: 'Aluno', email: 'aluno@example.com', senha: 'senha longa', tipo_usuario: 'aluno' });
    return response(201, { usuario: { id: 3, tipo_usuario: 'aluno' } });
  };
  const data = await cadastro({ nome: ' Aluno ', email: ' ALUNO@example.com ', senha: 'senha longa', confirmar: 'senha longa' });
  assert.equal(data.usuario.tipo_usuario, 'aluno'); assert.equal(authSession.getSnapshot().token, null);
});
test('successful login validates /me before exposing authenticated user', async () => {
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    if (url.endsWith('/login')) {
      assert.equal(options.headers.Authorization, undefined);
      assert.equal(authSession.getSnapshot().loading, true);
      return response(200, { token: 'test-token-A', expires_in: 900 });
    }
    assert.ok(url.endsWith('/me')); assert.equal(options.headers.Authorization, 'Bearer test-token-A');
    assert.equal(authSession.getSnapshot().user, null);
    return response(200, { usuario: { id: 1, nome: 'Aluno', tipo_usuario: 'aluno' } });
  };
  await login('aluno@example.com', 'senha longa');
  assert.equal(calls, 2); assert.equal(authSession.getSnapshot().user.id, 1); assert.equal(authSession.getSnapshot().loading, false);
  logout(); assert.equal(authSession.getSnapshot().token, null); assert.equal(authSession.getSnapshot().user, null);
});
test('bad credentials do not create session; 429 is friendly', async () => {
  globalThis.fetch = async () => response(401, { error: 'E-mail ou senha invalidos.' });
  await assert.rejects(login('aluno@example.com', 'errada'), e => e.status === 401);
  assert.equal(authSession.getSnapshot().user, null); assert.equal(authSession.getSnapshot().loading, false);
  globalThis.fetch = async () => response(429, {});
  await assert.rejects(login('aluno@example.com', 'senha'), /Muitas tentativas/);
});
test('protected requests require token; any authenticated 401 clears even malformed responses', async () => {
  let called = false; globalThis.fetch = async () => { called = true; return response(200, []); };
  await assert.rejects(request('/api/materias'), e => e.status === 401); assert.equal(called, false);
  signedIn();
  globalThis.fetch = async () => ({ status: 401, ok: false, text: async () => { throw new Error('malformed'); } });
  await assert.rejects(request('/api/materias'), e => e.status === 401);
  assert.equal(authSession.getSnapshot().token, null); assert.equal(authSession.getSnapshot().message, EXPIRED_MESSAGE);
});
test('expiration timer and foreground check clear token; reload creates an empty session', () => {
  let now = 100, callback;
  const session = createMemorySession({ now: () => now, schedule: fn => { callback = fn; return 1; }, cancel: () => {} });
  const v = session.begin(); session.acceptToken(v, 'test', 200); session.complete(v, { id: 1 });
  now = 200; callback();
  assert.equal(session.getSnapshot().user, null); assert.equal(session.getSnapshot().message, EXPIRED_MESSAGE);
  assert.equal(session.complete(v, { id: 1 }), false);
  assert.equal(createMemorySession().getSnapshot().token, null);
});
test('late responses and old 401 cannot restore or clear a different account', async () => {
  signedIn(); let resolve;
  globalThis.fetch = () => new Promise(done => { resolve = done; });
  const pending = request('/api/tarefas');
  logout(); signedIn({ id: 2 }, 'test-token-B');
  resolve(response(401, { error: 'expired' }));
  await assert.rejects(pending, ApiError);
  assert.equal(authSession.getSnapshot().user.id, 2); assert.equal(authSession.getSnapshot().token, 'test-token-B');
});
test('failed /me clears tentative token; successful resource JSON remains intact', async () => {
  globalThis.fetch = async url => url.endsWith('/login') ? response(200, { token: 'test', expires_in: 900 }) : response(401, {});
  await assert.rejects(login('a@example.com', 'senha'), e => e.status === 401);
  assert.equal(authSession.getSnapshot().token, null);
  signedIn(); const tasks = [{ id: 1, data_entrega: '2026-12-10', status: 'concluida', materia_id: null }];
  globalThis.fetch = async (_url, options) => { assert.equal(options.headers.Authorization, 'Bearer test-token-A'); return response(200, tasks); };
  assert.deepEqual(await request('/api/tarefas'), tasks);
});

test('resource services preserve payload fields and omit temporary ownership IDs', async () => {
  const subjects = await import('../src/services/materiasService.js');
  const tasks = await import('../src/services/tarefasService.js');
  signedIn(); const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    assert.equal(options.headers.Authorization, 'Bearer test-token-A');
    assert.equal(url.includes('usuario_id'), false);
    return response(200, options.body ? JSON.parse(options.body) : []);
  };
  await subjects.consultarMaterias(); await tasks.consultarTarefas();
  const subject = { nome: 'Matematica', professor: null, cor: '#E9A9C2' };
  assert.deepEqual(await subjects.criarMateria(subject), subject);
  await subjects.atualizarMateria(1, subject); await subjects.excluirMateria(1);
  const task = { titulo: 'Exercicios', descricao: null, data_entrega: '2026-12-10', prioridade: 'alta', status: 'pendente', materia_id: 1 };
  assert.deepEqual(await tasks.criarTarefa(task), task);
  for (const status of ['concluida', 'pendente']) {
    assert.equal((await tasks.atualizarTarefa(1, { ...task, status })).status, status);
  }
  await tasks.excluirTarefa(1);
  assert.equal(calls.length, 9);
  for (const { options } of calls) if (options.body) assert.equal(JSON.parse(options.body).usuario_id, undefined);
});
test('task dates, completion and subject progress keep Entrega 2 behavior', async () => {
  const { mapTaskForDisplay, mapSubjectForDisplay } = await import('../src/utils/dataMappers.js');
  const subject = { id: 3, nome: 'Matematica', cor: '#E9A9C2' };
  const task = { id: 1, titulo: 'Teste', data_entrega: '2026-12-10', status: 'concluida', materia_id: 3 };
  const mapped = mapTaskForDisplay(task, [subject]);
  assert.equal(mapped.due, '10/12/2026'); assert.equal(mapped.isCompleted, true); assert.equal(mapped.color, subject.cor);
  assert.equal(mapTaskForDisplay({ ...task, data_entrega: null, status: 'pendente' }).isCompleted, false);
  assert.equal(mapSubjectForDisplay(subject, [task, { ...task, id: 2, status: 'pendente' }]).progress, 50);
  assert.equal(mapSubjectForDisplay(subject, []).progress, 0);
});
