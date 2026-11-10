const { Router } = require('express');
const { rateLimit } = require('express-rate-limit');
const { authenticate } = require('../middleware/authenticate');
const { requireProfile } = require('../middleware/requireProfile');
const { createService, idValue, validVersion } = require('../services/acompanhamento');
const noStore = (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); };
const route = handler => async (req, res, next) => {
  try {
    const result = await handler(req);
    res.status(result.status).json(result.body);
  } catch (error) {
    if (['ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT'].includes(error.code)) {
      res.set('Retry-After', '1');
      return res.status(503).json({ error: 'Operacao concorrente. Atualize a lista e tente novamente.' });
    }
    next(error);
  }
};
function createVinculosRouter({ pool, config }) {
  const router = Router();
  const service = createService(pool);
  router.use(noStore, authenticate(config));
  const limitOptions = { windowMs: 15 * 60 * 1000, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: 'Muitas solicitacoes. Tente novamente mais tarde.' } };
  const byIP = rateLimit({ ...limitOptions, limit: 30 });
  const byAccount = rateLimit({ ...limitOptions, limit: 10, keyGenerator: req => String(req.auth.userId) });
  router.post('/solicitacoes', requireProfile(pool, 'responsavel'), byIP, byAccount, route(req => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { status: 400, body: { error: 'Informe um e-mail valido (ate 150 caracteres).' } };
    return service.request(req.auth.userId, email);
  }));
  router.get('/', route(req => service.list(req.auth.userId)));
  for (const action of ['autorizar', 'recusar', 'revogar']) {
    router.post('/:id/' + action, requireProfile(pool, 'aluno'), route(req => {
      const id = idValue(req.params.id);
      if (!id) return { status: 404, body: { error: 'Registro nao encontrado.' } };
      if (!validVersion(req.body?.solicitado_em)) return { status: 400, body: { error: 'Envie solicitado_em exatamente como recebido na lista de vinculos.' } };
      return service.transition(req.auth.userId, id, req.body.solicitado_em, action);
    }));
  }
  router.use((_req, res) => res.status(404).json({ error: 'Rota nao encontrada.' }));
  return router;
}
function createAcompanhamentoRouter({ pool, config }) {
  const router = Router();
  const service = createService(pool);
  router.use(noStore, authenticate(config), requireProfile(pool, 'responsavel'));
  router.get('/alunos', route(req => service.students(req.auth.userId)));
  for (const resource of ['materias', 'tarefas', 'resumo']) {
    router.get('/alunos/:alunoId/' + resource, route(req => {
      const id = idValue(req.params.alunoId);
      if (!id) return { status: 404, body: { error: 'Registro nao encontrado.' } };
      return service.read(req.auth.userId, id, resource);
    }));
  }
  // This router exposes read operations only.
  router.use((_req, res) => res.status(404).json({ error: 'Rota nao encontrada.' }));
  return router;
}
module.exports = { createVinculosRouter, createAcompanhamentoRouter, noStore };
