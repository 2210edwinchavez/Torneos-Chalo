import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, loginAsGuest, resetPassword } = useAuth();

  const [mode, setMode]       = useState('login'); // 'login' | 'register' | 'reset'
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [info, setInfo]       = useState('');
  const [loading, setLoading] = useState('');

  const [resetEmail, setResetEmail]   = useState('');
  const [resetSent, setResetSent]     = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleReset(e) {
    e.preventDefault();
    if (!resetEmail) { setError('Ingresa tu correo electrónico.'); return; }
    setResetLoading(true); setError('');
    const { error } = await resetPassword(resetEmail);
    setResetLoading(false);
    if (error) { setError(error); return; }
    setResetSent(true);
  }

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

  return (
    <div className="login-page">
      {/* Tarjeta dividida */}
      <div className="login-card">

        {/* ── Panel izquierdo: solo en desktop ── */}
        <div className="login-left">
          {/* Decoración: círculo verde difuso de fondo */}
          <div style={{
            position: 'absolute', width: 320, height: 320, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(132,204,22,0.12) 0%, transparent 70%)',
            top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            pointerEvents: 'none',
          }} />
          {/* Líneas de campo decorativas */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.06,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(132,204,22,0.8) 28px, rgba(132,204,22,0.8) 29px)',
            pointerEvents: 'none',
          }} />

          <img
            src="/logo jc sport.png"
            alt="Torneos JC SPORT"
            style={{
              width: 180, height: 180, objectFit: 'contain',
              position: 'relative', zIndex: 1,
              filter: 'drop-shadow(0 8px 32px rgba(132,204,22,0.35))',
            }}
          />
          <h2 style={{
            marginTop: 20, marginBottom: 6, fontSize: '1.25rem', fontWeight: 800,
            color: '#84cc16', letterSpacing: '0.05em', textAlign: 'center',
            position: 'relative', zIndex: 1,
          }}>TORNEOS JC SPORT</h2>
          <p style={{
            fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', textAlign: 'center',
            position: 'relative', zIndex: 1, letterSpacing: '0.08em',
          }}>PLATAFORMA DE GESTIÓN</p>

          {/* Acento verde inferior */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 4,
            background: 'linear-gradient(90deg, transparent, #84cc16, transparent)',
          }} />
        </div>

        {/* ── Panel derecho: formulario ── */}
        <div className="login-right">

          {/* Logo compacto — solo en móvil */}
          <div className="login-mobile-logo">
            <img src="/logo jc sport.png" alt="Torneos JC SPORT" style={{ width: 72, height: 72, objectFit: 'contain', filter: 'drop-shadow(0 4px 16px rgba(132,204,22,0.4))' }} />
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#84cc16', letterSpacing: '0.05em' }}>TORNEOS JC SPORT</div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>PLATAFORMA DE GESTIÓN</div>
          </div>

          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>
            {mode === 'reset' ? 'Recuperar contraseña' : mode === 'login' ? 'Bienvenido de nuevo' : 'Crear cuenta'}
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>
            {mode === 'reset' ? 'Te enviaremos un enlace para restablecer tu contraseña' : mode === 'login' ? 'Ingresa tus credenciales para continuar' : 'Completa los datos para registrarte'}
          </p>

          {/* Tabs — solo cuando no es modo reset */}
          {mode !== 'reset' && (
            <div style={{
              display: 'flex', background: 'rgba(0,0,0,0.35)',
              borderRadius: 10, padding: 4, marginBottom: 24,
              border: '1px solid rgba(132,204,22,0.15)',
            }}>
              {['login', 'register'].map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); setInfo(''); }}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 7, border: 'none',
                    fontWeight: 600, fontSize: '0.83rem', cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: mode === m ? '#84cc16' : 'transparent',
                    color: mode === m ? '#0a0f0a' : 'rgba(255,255,255,0.45)',
                  }}
                >
                  {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                </button>
              ))}
            </div>
          )}

          {/* ── Formulario de recuperación de contraseña ── */}
          {mode === 'reset' && (
            <div>
              {resetSent ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 16 }}>📧</div>
                  <div style={{ fontWeight: 700, color: '#84cc16', fontSize: '1rem', marginBottom: 8 }}>
                    ¡Correo enviado!
                  </div>
                  <p style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.5)', marginBottom: 24, lineHeight: 1.6 }}>
                    Revisa tu bandeja de entrada en <strong style={{ color: '#f1f5f9' }}>{resetEmail}</strong> y sigue el enlace para restablecer tu contraseña.
                  </p>
                  <button
                    onClick={() => { setMode('login'); setResetSent(false); setResetEmail(''); setError(''); }}
                    style={{
                      width: '100%', padding: '11px 0', borderRadius: 9, border: 'none',
                      background: '#84cc16', color: '#0a0f0a', fontWeight: 800,
                      fontSize: '0.92rem', cursor: 'pointer',
                    }}
                  >
                    ← Volver al inicio de sesión
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReset}>
                  <div className="form-group">
                    <label className="form-label">Correo electrónico</label>
                    <input
                      className="form-input"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={resetEmail}
                      onChange={e => { setResetEmail(e.target.value); setError(''); }}
                      autoFocus
                    />
                  </div>

                  {error && (
                    <div style={{
                      padding: '10px 14px', borderRadius: 8, marginBottom: 14,
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                      color: 'var(--danger)', fontSize: '0.82rem',
                    }}>⚠️ {error}</div>
                  )}

                  <button
                    type="submit"
                    disabled={resetLoading}
                    style={{
                      width: '100%', padding: '11px 0', borderRadius: 9, border: 'none',
                      background: resetLoading ? 'rgba(132,204,22,0.5)' : '#84cc16',
                      color: '#0a0f0a', fontWeight: 800, fontSize: '0.92rem',
                      cursor: resetLoading ? 'not-allowed' : 'pointer', marginBottom: 14,
                    }}
                  >
                    {resetLoading ? 'Enviando…' : '→ Enviar enlace de recuperación'}
                  </button>

                  <div style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setError(''); setResetEmail(''); }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem',
                        textDecoration: 'underline', textDecorationStyle: 'dotted',
                      }}
                    >
                      ← Volver al inicio de sesión
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ── Form normal (login / register) ── */}
          {mode !== 'reset' && <form onSubmit={handleSubmit}>
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
                background: 'rgba(132,204,22,0.1)', border: '1px solid rgba(132,204,22,0.3)',
                color: '#84cc16', fontSize: '0.82rem',
              }}>{info}</div>
            )}

            <button
              type="submit"
              disabled={!!loading}
              style={{
                width: '100%', padding: '11px 0', borderRadius: 9, border: 'none',
                background: loading ? 'rgba(132,204,22,0.5)' : '#84cc16',
                color: '#0a0f0a', fontWeight: 800, fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                letterSpacing: '0.03em',
              }}
            >
              {loading === 'email'
                ? (mode === 'login' ? 'Ingresando…' : 'Creando cuenta…')
                : (mode === 'login' ? '→ Iniciar sesión' : '→ Crear cuenta')}
            </button>

            {/* Enlace olvidé contraseña — solo en login */}
            {mode === 'login' && (
              <div style={{ textAlign: 'right', marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => { setMode('reset'); setError(''); setInfo(''); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#84cc16', fontSize: '0.78rem', fontWeight: 600,
                    textDecoration: 'underline', textDecorationStyle: 'dotted',
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}
          </form>}

          {/* Divider y social — solo en login/register */}
          {mode !== 'reset' && <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '18px 0', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem',
          }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
            o continúa con
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          </div>}

          {mode !== 'reset' && <div style={{ marginBottom: 18 }}>
            <button
              onClick={handleGoogle}
              disabled={!!loading}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '10px 0', borderRadius: 9,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)',
                color: '#f1f5f9', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <svg width="17" height="17" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              {loading === 'google' ? '…' : 'Continuar con Google'}
            </button>
          </div>}

          {/* Guest access */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={loginAsGuest}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem',
                textDecoration: 'underline', textDecorationStyle: 'dotted',
              }}
            >
              Entrar como visitante (solo lectura)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
