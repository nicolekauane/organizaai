import { request } from './api';
function checkUser(id) { if (id == null || String(id).trim() === '') throw new TypeError('Informe um usuario_id válido.'); }
export function consultarMaterias(id) { checkUser(id); return request('/api/materias?usuario_id=' + encodeURIComponent(String(id))); }
export function criarMateria(data, userId) { checkUser(userId); return request('/api/materias', { method: 'POST', body: JSON.stringify({ ...data, usuario_id: Number(userId) }) }); }
export function atualizarMateria(id, data, userId) { checkUser(userId); return request('/api/materias/' + encodeURIComponent(String(id)), { method: 'PUT', body: JSON.stringify({ ...data, usuario_id: Number(userId) }) }); }
export function excluirMateria(id, userId) { checkUser(userId); return request('/api/materias/' + encodeURIComponent(String(id)) + '?usuario_id=' + encodeURIComponent(String(userId)), { method: 'DELETE' }); }
