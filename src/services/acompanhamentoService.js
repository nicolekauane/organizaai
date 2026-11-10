import { request, ApiError } from './api.js';
import { authSession } from '../auth/session.js';
const listeners = new Set();
export function subscribePrivateInvalidation(listener) { listeners.add(listener); return () => listeners.delete(listener); }
export function invalidatePrivateData(message = 'O acesso mudou. Atualize a lista para continuar.') { listeners.forEach(listener => listener(message)); }
async function privateRequest(path, options = {}) {
  const version = authSession.getSnapshot().version;
  try { return await request(path, { ...options, cache: 'no-store' }); }
  catch (error) {
    if (authSession.getSnapshot().version === version && [401, 403, 404].includes(error.status)) {
      invalidatePrivateData(error.status === 404 ? 'Acesso indisponível. O vínculo pode ter sido encerrado.' : 'Seu acesso mudou. Entre novamente.');
      if (error.status === 403) authSession.clear('Seu perfil ou acesso mudou. Entre novamente.');
    }
    throw error;
  }
}
const segment = value => {
  const text = String(value ?? '');
  if (!/^[1-9]\d*$/.test(text) || !Number.isSafeInteger(Number(text)) || Number(text) > 2147483647) throw new ApiError('Registro não encontrado.', 404);
  return text;
};
export const consultarVinculos = () => privateRequest('/api/vinculos');
export const consultarAlunos = () => privateRequest('/api/acompanhamento/alunos');
export function solicitarAcompanhamento(email) {
  const normalized = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (normalized.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return Promise.reject(new ApiError('Informe um e-mail válido (até 150 caracteres).', 400));
  return privateRequest('/api/vinculos/solicitacoes', { method: 'POST', body: JSON.stringify({ email: normalized }) });
}
export function decidirVinculo(vinculo, action) {
  if (!['autorizar', 'recusar', 'revogar'].includes(action) || typeof vinculo?.solicitado_em !== 'string') return Promise.reject(new ApiError('Atualize a lista antes de decidir.', 400));
  return privateRequest('/api/vinculos/' + segment(vinculo.id) + '/' + action, { method: 'POST', body: JSON.stringify({ solicitado_em: vinculo.solicitado_em }) });
}
export async function carregarAluno(alunoId) {
  let id;
  try { id = segment(alunoId); } catch (error) { invalidatePrivateData('Aluno indisponível. Volte à lista.'); throw error; }
  const base = '/api/acompanhamento/alunos/' + id;
  const [alunos, materias, tarefas, resumo] = await Promise.all([
    consultarAlunos(), privateRequest(base + '/materias'), privateRequest(base + '/tarefas'), privateRequest(base + '/resumo'),
  ]);
  const aluno = alunos.find(item => String(item.id) === id);
  if (!aluno) { invalidatePrivateData('Acesso indisponível. Atualize a lista de alunos.'); throw new ApiError('Aluno indisponível.', 404); }
  return { aluno, materias, tarefas, resumo };
}
export async function carregarAreaResponsavel() {
  const [alunos, vinculos] = await Promise.all([consultarAlunos(), consultarVinculos()]);
  return { alunos, vinculos };
}
