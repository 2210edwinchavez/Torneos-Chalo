import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const ADMIN_PW_KEY = 'tourneypro_admin_pw';
const SESSION_KEY = 'tourneypro_session';
const DEFAULT_PW = 'admin2026';

export function getAdminPassword() {
  return localStorage.getItem(ADMIN_PW_KEY) || DEFAULT_PW;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const s = sessionStorage.getItem(SESSION_KEY);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  function loginAsUser() {
    const s = { role: 'user', name: 'Visitante' };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    setSession(s);
  }

  function loginAsAdmin(password) {
    if (password !== getAdminPassword()) {
      return { error: 'Contraseña incorrecta. Inténtalo de nuevo.' };
    }
    const s = { role: 'admin', name: 'Administrador' };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    setSession(s);
    return { error: null };
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
  }

  function changePassword(currentPw, newPw) {
    if (currentPw !== getAdminPassword()) {
      return { error: 'La contraseña actual es incorrecta.' };
    }
    if (newPw.length < 4) {
      return { error: 'La nueva contraseña debe tener al menos 4 caracteres.' };
    }
    localStorage.setItem(ADMIN_PW_KEY, newPw);
    return { error: null };
  }

  const isAdmin = session?.role === 'admin';
  const isLoggedIn = !!session;

  return (
    <AuthContext.Provider value={{ session, isAdmin, isLoggedIn, loginAsUser, loginAsAdmin, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
