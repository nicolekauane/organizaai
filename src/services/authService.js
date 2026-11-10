import { isKnownProfile } from '../auth/profiles.js';
import { request, ApiError } from './api.js';
import { authSession } from '../auth/session.js';
export async function login(email, senha) {
  const version = authSession.begin();
  const startedAt = Date.now();
  try {
    const data = await request('/api/auth/login', { authenticated: false, method: 'POST', body: JSON.stringify({ email: email.trim().toLowerCase(), senha }) });
    if (!authSession.acceptToken(version, data.token, startedAt + data.expires_in * 1000)) return;
    const { usuario } = await request('/api/auth/me');
    if (!usuario || !isKnownProfile(usuario.tipo_usuario)) throw new ApiError('Perfil não reconhecido. Entre novamente.', 403);
    authSession.complete(version, usuario);
  } catch (error) { authSession.fail(version); throw error; }
}
export async function cadastro({ nome, email, senha, tipo_usuario = 'aluno' }) {
  if (!isKnownProfile(tipo_usuario)) throw new ApiError('Selecione Aluno ou Responsável.', 400);
  return request('/api/auth/cadastro', { authenticated: false, method: 'POST',
    body: JSON.stringify({ nome: nome.trim(), email: email.trim().toLowerCase(), senha, tipo_usuario }) });
}
export function logout() { authSession.clear(); }
