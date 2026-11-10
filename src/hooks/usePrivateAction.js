import { useEffect, useRef, useState } from 'react';
import { authSession } from '../auth/session';
export function usePrivateAction() {
  const [state, setState] = useState({ busy: false, message: '', error: '' });
  const mounted = useRef(false), lock = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function run(action) {
    if (lock.current) return;
    const version = authSession.getSnapshot().version;
    const valid = () => mounted.current && authSession.getSnapshot().version === version;
    lock.current = true;
    setState({ busy: true, message: '', error: '' });
    try { const message = await action(valid); if (valid()) setState({ busy: false, message: message || '', error: '' }); }
    catch (error) { if (valid()) setState({ busy: false, message: '', error: error.message || 'Não foi possível concluir. Tente novamente.' }); }
    finally { lock.current = false; if (valid()) setState(current => ({ ...current, busy: false })); }
  }
  return { ...state, run };
}
