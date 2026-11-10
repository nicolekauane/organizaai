export const EXPIRED_MESSAGE = 'Sua sessão expirou. Entre novamente para continuar.';
export function createMemorySession({ now = Date.now, schedule = setTimeout, cancel = clearTimeout } = {}) {
  /** @type {{ token: string | null, user: { id: number, nome: string, tipo_usuario: 'aluno' | 'responsavel', email?: string } | null, loading: boolean, message: string, version: number, expiresAt: number }} */
  let state = { token: null, user: null, loading: false, message: '', version: 0, expiresAt: 0 };
  let timer;
  const listeners = new Set();
  const publish = patch => { state = { ...state, ...patch }; listeners.forEach(fn => fn()); };
  function clear(message = '') {
    cancel(timer);
    publish({ token: null, user: null, loading: false, message, expiresAt: 0, version: state.version + 1 });
  }
  function checkExpiry() {
    if (state.token && now() >= state.expiresAt) clear(EXPIRED_MESSAGE);
  }
  return {
    getSnapshot: () => state,
    subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); },
    clear, checkExpiry,
    begin() { clear(); publish({ loading: true }); return state.version; },
    acceptToken(version, token, expiresAt) {
      if (version !== state.version) return false;
      if (!token || !Number.isFinite(expiresAt) || expiresAt <= now()) { clear(EXPIRED_MESSAGE); return false; }
      publish({ token, expiresAt });
      timer = schedule(checkExpiry, Math.min(expiresAt - now(), 2147483647));
      return true;
    },
    complete(version, user) {
      checkExpiry();
      if (version !== state.version || !state.token) return false;
      publish({ user, loading: false }); return true;
    },
    fail(version) { if (version === state.version) clear(); },
    expire(token) { if (token && token === state.token) clear(EXPIRED_MESSAGE); },
  };
}
export const authSession = createMemorySession();
