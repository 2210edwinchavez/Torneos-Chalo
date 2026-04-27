import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { loginAsUser, loginAsAdmin } = useAuth();
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  function handleAdminLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      const result = loginAsAdmin(password);
      if (result.error) {
        setError(result.error);
        setPassword('');
      }
      setLoading(false);
    }, 400);
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
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
          }}>
            🏆
          </div>
          <h1 style={{
            fontSize: '2rem', fontWeight: 800,
            background: 'linear-gradient(135deg, var(--primary-light), var(--secondary))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            marginBottom: 6,
          }}>
            TourneyPro
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Plataforma de gestión de torneos
          </p>
        </div>

        {!showAdminForm ? (
          /* ── Role selection ── */
          <div>
            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
              Selecciona tu tipo de acceso
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* User card */}
              <button
                onClick={loginAsUser}
                style={{
                  display: 'flex', alignItems: 'center', gap: 18,
                  padding: '20px 22px', borderRadius: 14, width: '100%', textAlign: 'left',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--secondary)'; e.currentTarget.style.background = 'rgba(14,165,233,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(14,165,233,0.15)', border: '2px solid rgba(14,165,233,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                }}>
                  👁️
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 3 }}>
                    Visitante / Usuario
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Acceso de solo lectura. Puede ver torneos, equipos, jugadores, partidos y posiciones.
                  </div>
                </div>
                <span style={{ color: 'var(--secondary)', fontSize: '1.2rem', flexShrink: 0 }}>→</span>
              </button>

              {/* Admin card */}
              <button
                onClick={() => setShowAdminForm(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 18,
                  padding: '20px 22px', borderRadius: 14, width: '100%', textAlign: 'left',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(99,102,241,0.15)', border: '2px solid rgba(99,102,241,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                }}>
                  🔐
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 3 }}>
                    Administrador
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    Acceso completo. Puede crear, editar y eliminar torneos, equipos y jugadores.
                  </div>
                </div>
                <span style={{ color: 'var(--primary)', fontSize: '1.2rem', flexShrink: 0 }}>→</span>
              </button>
            </div>

            <div style={{
              marginTop: 28, padding: '12px 16px', borderRadius: 10,
              background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
              fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center',
            }}>
              La sesión se cerrará automáticamente al cerrar el navegador
            </div>
          </div>
        ) : (
          /* ── Admin password form ── */
          <div>
            <button
              onClick={() => { setShowAdminForm(false); setError(''); setPassword(''); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20,
                color: 'var(--text-muted)', fontSize: '0.82rem', background: 'none',
                border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              ← Volver
            </button>

            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '28px 24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'rgba(99,102,241,0.15)', border: '2px solid rgba(99,102,241,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0,
                }}>
                  🔐
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Acceso de Administrador</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ingresa la contraseña para continuar</div>
                </div>
              </div>

              <form onSubmit={handleAdminLogin}>
                <div className="form-group">
                  <label className="form-label">Contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      type={showPw ? 'text' : 'password'}
                      placeholder="Contraseña de administrador"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      autoFocus
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
                    >
                      {showPw ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {error && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 8, marginBottom: 14,
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    color: 'var(--danger)', fontSize: '0.82rem', fontWeight: 600,
                  }}>
                    ⚠️ {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary w-full btn-lg"
                  disabled={!password || loading}
                  style={{ justifyContent: 'center', marginTop: 4 }}
                >
                  {loading ? 'Verificando…' : '🔐 Ingresar como Administrador'}
                </button>
              </form>

              <div style={{ marginTop: 14, fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Contraseña por defecto: <code style={{ color: 'var(--primary-light)' }}>admin2026</code>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
