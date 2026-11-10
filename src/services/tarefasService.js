import { request } from './api.js';
export function consultarTarefas() { return request('/api/tarefas'); }
export function criarTarefa(data) { return request('/api/tarefas', { method: 'POST', body: JSON.stringify(data) }); }
export function atualizarTarefa(id, data) { return request('/api/tarefas/' + encodeURIComponent(String(id)), { method: 'PUT', body: JSON.stringify(data) }); }
export function excluirTarefa(id) { return request('/api/tarefas/' + encodeURIComponent(String(id)), { method: 'DELETE' }); }
