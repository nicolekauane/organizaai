import { request } from './api.js';
export function consultarMaterias() { return request('/api/materias'); }
export function criarMateria(data) { return request('/api/materias', { method: 'POST', body: JSON.stringify(data) }); }
export function atualizarMateria(id, data) { return request('/api/materias/' + encodeURIComponent(String(id)), { method: 'PUT', body: JSON.stringify(data) }); }
export function excluirMateria(id) { return request('/api/materias/' + encodeURIComponent(String(id)), { method: 'DELETE' }); }
