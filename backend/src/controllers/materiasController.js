const { createOwnedController } = require('./ownedResourceController');
function createController(pool) {
  return createOwnedController(pool, {
    table: 'materias', fields: ['nome', 'professor', 'cor'], order: 'id',
    parse: ({ nome, professor = null, cor = null }) => ({ nome: typeof nome === 'string' ? nome.trim() : nome, professor, cor }),
    valid: ({ nome, professor, cor }) => typeof nome === 'string' && nome.length > 0 && nome.length <= 100 &&
      (professor === null || (typeof professor === 'string' && professor.length <= 100)) &&
      (cor === null || (typeof cor === 'string' && cor.length <= 20)),
  });
}
module.exports = { createController };
