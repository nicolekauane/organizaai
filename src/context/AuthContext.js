import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { authSession } from '../auth/session';
import { login, cadastro, logout } from '../services/authService';
/** @typedef {ReturnType<typeof authSession.getSnapshot> & { login: typeof login, cadastro: typeof cadastro, logout: typeof logout }} AuthValue */
/** @type {import('react').Context<AuthValue | null>} */
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const state = useSyncExternalStore(authSession.subscribe, authSession.getSnapshot, authSession.getSnapshot);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', status => { if (status === 'active') authSession.checkExpiry(); });
    return () => subscription.remove();
  }, []);
  return <AuthContext.Provider value={{ ...state, login, cadastro, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('AuthProvider ausente.');
  return auth;
}
