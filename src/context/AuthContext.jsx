import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { APP_DISPLAY_NAME, APP_LOGO_URL } from '../constants/branding';

const AuthContext = createContext(null);
const GUEST_KEY = 'torneosjcsport_guest';

export function AuthProvider({ children }) {
  const [supaSession, setSupaSession] = useState(null);
  const [profile, setProfile]         = useState(null);
  const [isGuest, setIsGuest]         = useState(false);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem(GUEST_KEY)) setIsGuest(true);

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSupaSession(session);
        if (session) fetchProfile(session.user.id);
        else setLoading(false);
      })
      .catch(() => setLoading(false));

    let subscription;
    try {
      const { data } = supabase.auth.onAuthStateChange((_e, session) => {
        setSupaSession(session);
        if (session) fetchProfile(session.user.id);
        else { setProfile(null); setLoading(false); }
      });
      subscription = data.subscription;
    } catch { setLoading(false); }

    return () => { try { subscription?.unsubscribe(); } catch {} };
  }, []);

  async function fetchProfile(userId) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(data || null);
    } catch {
      setProfile(null);
    }
    setLoading(false);
  }

  async function signUpWithEmail(email, password, fullName) {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      return { error: error?.message || null };
    } catch (err) {
      if (err?.message?.toLowerCase().includes('fetch')) {
        return { error: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.' };
      }
      return { error: err?.message || 'Error desconocido.' };
    }
  }

  async function signInWithEmail(email, password) {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message || null };
    } catch (err) {
      if (err?.message?.toLowerCase().includes('fetch')) {
        return { error: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.' };
      }
      return { error: err?.message || 'Error desconocido.' };
    }
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    return { error: error?.message || null };
  }

  async function signInWithFacebook() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: window.location.origin },
    });
    return { error: error?.message || null };
  }

  function loginAsGuest() {
    sessionStorage.setItem(GUEST_KEY, 'true');
    setIsGuest(true);
  }

  async function logout() {
    sessionStorage.removeItem(GUEST_KEY);
    setIsGuest(false);
    if (supaSession) await supabase.auth.signOut();
    setProfile(null);
    setSupaSession(null);
  }

  async function changePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error?.message || null };
  }

  async function resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/?reset=1`,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch (err) {
      if (err?.message?.toLowerCase().includes('fetch')) {
        return { error: 'No se pudo conectar con el servidor. Verifica tu conexión a internet o intenta más tarde.' };
      }
      return { error: err?.message || 'Error desconocido.' };
    }
  }

  const isAdmin    = profile?.role === 'admin';
  const isLoggedIn = !!supaSession || isGuest;
  const session    = supaSession
    ? {
        name:  profile?.full_name || supaSession.user.email?.split('@')[0],
        email: supaSession.user.email,
        role:  isAdmin ? 'admin' : 'user',
      }
    : isGuest
    ? { name: 'Visitante', role: 'user' }
    : null;

  if (!supabaseConfigured) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0a0f0a', flexDirection: 'column', gap: 16,
        padding: 24, textAlign: 'center',
      }}>
        <img src={APP_LOGO_URL} alt={APP_DISPLAY_NAME} style={{ width: 72, height: 72, objectFit: 'contain' }} />
        <div style={{ color: '#ef4444', fontWeight: 800, fontSize: '1.1rem' }}>⚠️ Base de datos no configurada</div>
        <div style={{
          background: '#1a0f0f', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 12, padding: '20px 28px', maxWidth: 480,
        }}>
          <p style={{ color: '#f1f5f9', fontSize: '0.88rem', marginBottom: 12, lineHeight: 1.6 }}>
            La clave de Supabase en el archivo <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>.env</code> no es válida.
          </p>
          <p style={{ color: '#a1b89a', fontSize: '0.82rem', lineHeight: 1.7 }}>
            1. Ve a <strong style={{ color: '#84cc16' }}>supabase.com/dashboard</strong><br/>
            2. Selecciona tu proyecto<br/>
            3. Ve a <strong style={{ color: '#84cc16' }}>Settings → API</strong><br/>
            4. Copia la clave <strong style={{ color: '#84cc16' }}>anon public</strong> (empieza con <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 4px', borderRadius: 4 }}>eyJ...</code>)<br/>
            5. Pégala en el archivo <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>.env</code> como <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>VITE_SUPABASE_ANON_KEY</code><br/>
            6. Reinicia el servidor con <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>npm run dev</code>
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0a0f0a', flexDirection: 'column', gap: 16,
      }}>
        <img src={APP_LOGO_URL} alt={APP_DISPLAY_NAME} style={{ width: 72, height: 72, objectFit: 'contain' }} />
        <div style={{ color: '#84cc16', fontWeight: 700, fontSize: '1.1rem' }}>
          Cargando…
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      session, isAdmin, isLoggedIn, isGuest,
      user: supaSession?.user,
      signUpWithEmail, signInWithEmail,
      signInWithGoogle,
      loginAsGuest, logout, changePassword, resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
