import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);
const GUEST_KEY = 'tourneypro_guest';

export function AuthProvider({ children }) {
  const [supaSession, setSupaSession] = useState(null);
  const [profile, setProfile]         = useState(null);
  const [isGuest, setIsGuest]         = useState(false);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem(GUEST_KEY)) setIsGuest(true);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupaSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSupaSession(session);
      if (session) fetchProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data || null);
    setLoading(false);
  }

  async function signUpWithEmail(email, password, fullName) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { error: error?.message || null };
  }

  async function signInWithEmail(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
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

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0f172a', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ fontSize: '2.5rem' }}>🏆</div>
        <div style={{ color: '#818cf8', fontWeight: 700, fontSize: '1.1rem' }}>
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
      signInWithGoogle, signInWithFacebook,
      loginAsGuest, logout, changePassword,
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
