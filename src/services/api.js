import { authSession } from '../auth/session.js';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
export class ApiError extends Error {
  constructor(message, status = null) { super(message); this.name = 'ApiError'; this.status = status; }
}
export async function request(path, options = {}) {
  const { authenticated = true, ...fetchOptions } = options;
  authSession.checkExpiry();
  const { token, version } = authSession.getSnapshot();
  if (authenticated && !token) throw new ApiError('Entre na sua conta para continuar.', 401);
  const controller = new AbortController();
  const changed = () => authSession.getSnapshot().version !== version;
  const unsubscribe = authSession.subscribe(() => { if (changed()) controller.abort(); });
  try {
    const response = await fetch(API_BASE_URL + path, {
      ...fetchOptions, signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(fetchOptions.body ? { 'Content-Type': 'application/json' } : {}),
        ...fetchOptions.headers,
        ...(authenticated ? { Authorization: 'Bearer ' + token } : {}),
      },
    });
    if (changed()) throw new ApiError('A sessão foi encerrada.');
    // Invalidate even when a proxy returns an empty or malformed 401 response.
    if (authenticated && response.status === 401) {
      authSession.expire(token);
      throw new ApiError('Sua sessão expirou. Entre novamente para continuar.', 401);
    }
    const responseText = await response.text();
    if (changed()) throw new ApiError('A sessão foi encerrada.');
    let data = null;
    if (responseText) {
      try { data = JSON.parse(responseText); }
      catch { throw new ApiError('A API retornou uma resposta inválida.', response.status); }
    }
    if (!response.ok) {
      const message = response.status === 429 ? 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
        : data?.error || 'Não foi possível concluir a solicitação.';
      throw new ApiError(message, response.status);
    }
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (changed()) throw new ApiError('A sessão foi encerrada.');
    throw new ApiError('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
  } finally { unsubscribe(); }
}
