import { authSession } from './session.js';
import { canAccessProfile } from './profiles.js';
import { subscribePrivateInvalidation } from '../services/acompanhamentoService.js';
// Focus-scoped state. Generations reject late responses, including sibling requests.
export function createPrivateResource(loader, role) {
  let state = { data: null, loading: false, error: '' };
  let active = false, generation = 0, unsubscribeSession, unsubscribeAccess;
  const listeners = new Set();
  const publish = patch => { state = { ...state, ...patch }; listeners.forEach(listener => listener()); };
  const clear = (error = '') => { generation++; publish({ data: null, loading: false, error }); };
  return {
    getSnapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    clear,
    activate() {
      if (active) return;
      active = true;
      const version = authSession.getSnapshot().version;
      unsubscribeSession = authSession.subscribe(() => { if (authSession.getSnapshot().version !== version) clear(); });
      unsubscribeAccess = subscribePrivateInvalidation(clear);
    },
    deactivate() { active = false; unsubscribeSession?.(); unsubscribeAccess?.(); clear(); },
    async reload() {
      authSession.checkExpiry();
      const session = authSession.getSnapshot();
      if (!active || !session.token || !canAccessProfile(session.user, role)) { clear(); return; }
      const current = ++generation;
      publish({ data: null, loading: true, error: '' });
      const valid = () => active && current === generation && session.version === authSession.getSnapshot().version;
      try { const data = await loader(); if (valid()) publish({ data, loading: false }); }
      catch (error) { if (valid()) publish({ data: null, loading: false, error: error.message || 'Não foi possível carregar. Tente novamente.' }); }
    },
  };
}
