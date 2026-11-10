const { Router } = require('express');
const { requireProfile } = require('../middleware/requireProfile');
const { authenticate } = require('../middleware/authenticate');
const { createController } = require('../controllers/tarefasController');
function createRouter({ pool, config }) {
  const router = Router();
  const controller = createController(pool);
  router.use(authenticate(config), requireProfile(pool, 'aluno'));
  router.get('/', controller.list);
  router.get('/:id', controller.get);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.remove);
  return router;
}
module.exports = { createRouter };
