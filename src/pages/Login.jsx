import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithFacebook, loginAsGuest } = useAuth();

  const [mode, setMode]       = useState('login'); // 'login' | 'register'
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [info, setInfo]       = useState('');
  const [loading, setLoading] = useState('');

  function setField(k, v) {
    setForm(f => ({ ...f, [k]: v }));
    setError('');
    setInfo('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setInfo('');

    if (!form.email || !form.password) { setError('Completa todos los campos.'); return; }

    if (mode === 'register') {
      if (!form.name.trim()) { setError('Ingresa tu nombre.'); return; }
      if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
      if (form.password !== form.confirm) { setError('Las contraseñas no coinciden.'); return; }
      setLoading('email');
      const { error } = await signUpWithEmail(form.email, form.password, form.name);
      setLoading('');
      if (error) { setError(error); return; }
      setInfo('✅ Cuenta creada. Revisa tu correo para confirmar tu registro.');
      setForm({ name: '', email: '', password: '', confirm: '' });
      setMode('login');
    } else {
      setLoading('email');
      const { error } = await signInWithEmail(form.email, form.password);
      setLoading('');
      if (error) { setError('Correo o contraseña incorrectos.'); }
    }
  }

  async function handleGoogle() {
    setLoading('google'); setError('');
    const { error } = await signInWithGoogle();
    if (error) { setError(error); setLoading(''); }
  }

  async function handleFacebook() {
    setLoading('facebook'); setError('');
    const { error } = await signInWithFacebook();
    if (error) { setError(error); setLoading(''); }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 68, height: 68, borderRadius: '50%', margin: '0 auto 14px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.9rem', boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
          }}>🏆</div>
          <h1 style={{
            fontSize: '1.8rem', fontWeight: 800,
            background: 'linear-gradient(135deg, var(--primary-light), var(--secondary))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            marginBottom: 4,
          }}>TourneyPro</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Plataforma de gestión de torneos</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '28px 24px',
        }}>

          {/* Tabs */}
          <div style={{
            display: 'flex', background: 'rgba(0,0,0,0.2)',
            borderRadius: 10, padding: 4, marginBottom: 24,
          }}>
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setInfo(''); }}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
                  fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: mode === m ? 'var(--primary)' : 'transparent',
                  color: mode === m ? '#fff' : 'var(--text-muted)',
                }}
              >
                {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Nombre completo</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Tu nombre"
                  value={form.name}
                  onChange={e => setField('name', e.target.value)}
                  autoFocus
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <input
                className="form-input"
                type="email"
                placeholder="correo@ejemplo.com"
                value={form.email}
                onChange={e => setField('email', e.target.value)}
                autoFocus={mode === 'login'}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : 'Tu contraseña'}
                  value={form.password}
                  onChange={e => setField('password', e.target.value)}
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', fontSize: '1rem',
                  }}
                >{showPw ? '🙈' : '👁️'}</button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Confirmar contraseña</label>
                <input
                  className="form-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Repite la contraseña"
                  value={form.confirm}
                  onChange={e => setField('confirm', e.target.value)}
                />
              </div>
            )}

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 14,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                color: 'var(--danger)', fontSize: '0.82rem',
              }}>⚠️ {error}</div>
            )}

            {info && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 14,
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                color: 'var(--success)', fontSize: '0.82rem',
              }}>{info}</div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={!!loading}
              style={{ justifyContent: 'center', padding: '11px 0', fontSize: '0.95rem' }}
            >
              {loading === 'email'
                ? (mode === 'login' ? 'Ingresando…' : 'Creando cuenta…')
                : (mode === 'login' ? '→ Iniciar sesión' : '→ Crear cuenta')}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '20px 0', color: 'var(--text-muted)', fontSize: '0.8rem',
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            o continúa con
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Social buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleGoogle}
              disabled={!!loading}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 0', borderRadius: 10, border: '1px solid var(--border)',
                background: loading === 'google' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)',
                color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              {loading === 'google' ? '…' : 'Google'}
            </button>

            <button
              onClick={handleFacebook}
              disabled={!!loading}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 0', borderRadius: 10, border: '1px solid var(--border)',
                background: loading === 'facebook' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)',
                color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
              </svg>
              {loading === 'facebook' ? '…' : 'Facebook'}
            </button>
          </div>
        </div>

        {/* Guest access */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            onClick={loginAsGuest}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: '0.82rem',
              textDecoration: 'underline', textDecorationStyle: 'dotted',
            }}
          >
            Entrar como visitante (solo lectura)
          </button>
        </div>
      </div>
    </div>
  );
}
