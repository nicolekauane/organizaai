const { createOwnedController } = require('./ownedResourceController');
function validDate(value) {
  if (value === null) return true;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1000-01-01') return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function createController(pool) {
  return createOwnedController(pool, {
    invalidMessage: 'Dados inválidos. Informe título (1 a 150 caracteres), data válida em YYYY-MM-DD ou null, prioridade (baixa, media, alta), status (pendente, em andamento, concluida) e materia_id inteiro positivo ou null. O usuário é identificado pelo token.',
    table: 'tarefas', fields: ['titulo', 'descricao', 'data_entrega', 'prioridade', 'status', 'materia_id'], order: 'data_entrega, id',
    parse: ({ titulo, descricao = null, data_entrega = null, prioridade = 'media', status = 'pendente', materia_id = null }) => ({
      titulo: typeof titulo === 'string' ? titulo.trim() : titulo, descricao, data_entrega, prioridade, status,
      materia_id: materia_id === null ? null : (typeof materia_id === 'number' || (typeof materia_id === 'string' && /^[1-9]\d*$/.test(materia_id))) ? Number(materia_id) : NaN,
    }),
    valid: v => typeof v.titulo === 'string' && v.titulo.length > 0 && v.titulo.length <= 150 &&
      (v.descricao === null || typeof v.descricao === 'string') && validDate(v.data_entrega) &&
      ['baixa', 'media', 'alta'].includes(v.prioridade) && ['pendente', 'em andamento', 'concluida'].includes(v.status) &&
      (v.materia_id === null || (Number.isSafeInteger(v.materia_id) && v.materia_id > 0 && v.materia_id <= 2147483647)),
  });
}
module.exports = { createController };
