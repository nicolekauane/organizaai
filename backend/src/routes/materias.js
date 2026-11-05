const router = require('express').Router();
const controller = require('../controllers/materiasController');
router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);
module.exports = router;
