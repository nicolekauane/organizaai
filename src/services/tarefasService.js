import { request } from './api';
function checkUser(id) { if (id == null || String(id).trim() === '') throw new TypeError('Informe um usuario_id válido.'); }
export function consultarTarefas(id) { checkUser(id); return request('/api/tarefas?usuario_id=' + encodeURIComponent(String(id))); }
export function criarTarefa(data, userId) { checkUser(userId); return request('/api/tarefas', { method: 'POST', body: JSON.stringify({ ...data, usuario_id: Number(userId) }) }); }
export function atualizarTarefa(id, data, userId) { checkUser(userId); return request('/api/tarefas/' + encodeURIComponent(String(id)), { method: 'PUT', body: JSON.stringify({ ...data, usuario_id: Number(userId) }) }); }
export function excluirTarefa(id, userId) { checkUser(userId); return request('/api/tarefas/' + encodeURIComponent(String(id)) + '?usuario_id=' + encodeURIComponent(String(userId)), { method: 'DELETE' }); }
