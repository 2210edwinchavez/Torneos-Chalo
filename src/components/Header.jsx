import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTournament } from '../context/TournamentContext';
import { useCurrency, CURRENCIES } from '../context/CurrencyContext';
import Modal from './Modal';

const PAGE_INFO = {
  '/': { title: 'Dashboard', subtitle: 'Resumen general de tus torneos' },
  '/torneos': { title: 'Torneos', subtitle: 'Gestiona todos tus torneos' },
  '/jugadores': { title: 'Jugadores', subtitle: 'Registro universal de jugadores' },
  '/equipos': { title: 'Equipos', subtitle: 'Equipos del torneo activo' },
  '/partidos': { title: 'Partidos', subtitle: 'Fixtures y resultados' },
  '/posiciones': { title: 'Tabla de Posiciones', subtitle: 'Clasificación actualizada' },
  '/bracket': { title: 'Bracket', subtitle: 'Cuadro de eliminación' },
};

export default function Header({ currentPath, onMenuToggle }) {
  const { activeTournament } = useTournament();
  const { session, isAdmin, logout, changePassword } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const info = PAGE_INFO[currentPath] || { title: 'Torneos JC SPORT', subtitle: '' };

  const [showMenu, setShowMenu] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [pwForm, setPwForm] = useState({ next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  async function handleShare() {
    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const shareData = {
      title: 'Torneos JC SPORT',
      text: '¡Únete a la plataforma de gestión de torneos JC SPORT! Consulta equipos, jugadores, partidos y tabla de posiciones.',
      url: appUrl,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(appUrl);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      } catch {}
    }
  }

  async function handleChangePw(e) {
    e.preventDefault();
    setPwError('');
    if (pwForm.next.length < 6) {
      setPwError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError('Las contraseñas no coinciden.');
      return;
    }
    const result = await changePassword(pwForm.next);
    if (result.error) { setPwError(result.error); return; }
    setPwSuccess(true);
    setTimeout(() => { setShowChangePw(false); setPwSuccess(false); setPwForm({ next: '', confirm: '' }); }, 1500);
  }

  return (
    <>
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="hamburger-btn"
            onClick={onMenuToggle}
            aria-label="Abrir menú"
          >
            <span /><span /><span />
          </button>
          <div>
            <div className="header-title">{info.title}</div>
            {info.subtitle && <div className="header-subtitle">{info.subtitle}</div>}
          </div>
        </div>

        <div className="header-actions">
          {/* Selector de moneda */}
          <div style={{ display: 'flex', gap: 4 }}>
            {Object.values(CURRENCIES).map(c => (
              <button
                key={c.code}
                onClick={() => setCurrency(c.code)}
                title={c.label}
                style={{
                  padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontSize: '0.72rem', fontWeight: 700,
                  background: currency === c.code ? 'rgba(132,204,22,0.2)' : 'rgba(255,255,255,0.05)',
                  color: currency === c.code ? 'var(--primary-light)' : 'var(--text-muted)',
                  outline: currency === c.code ? '1px solid rgba(132,204,22,0.4)' : '1px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                {c.flag} {c.code}
              </button>
            ))}
          </div>

          {activeTournament && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: activeTournament.status === 'active' ? 'var(--success)' : 'var(--text-muted)', display: 'inline-block' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {activeTournament.name}
              </span>
            </div>
          )}

          {/* Share button */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={handleShare}
              title="Compartir plataforma"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: 8, border: '1px solid rgba(132,204,22,0.25)',
                background: shareCopied ? 'rgba(132,204,22,0.2)' : 'rgba(255,255,255,0.05)',
                cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
              }}
            >
              {shareCopied ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#84cc16" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              )}
            </button>
            {shareCopied && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: 'var(--bg-card)', border: '1px solid rgba(132,204,22,0.3)',
                borderRadius: 8, padding: '6px 12px', whiteSpace: 'nowrap',
                fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-light)',
                boxShadow: 'var(--shadow)', zIndex: 300,
                animation: 'modalIn 0.15s ease',
              }}>
                ✓ ¡Enlace copiado!
              </div>
            )}
          </div>

          {/* Role badge + user menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMenu(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 12px', borderRadius: 8,
                background: isAdmin ? 'rgba(132,204,22,0.12)' : 'rgba(34,197,94,0.1)',
                border: `1px solid ${isAdmin ? 'rgba(132,204,22,0.3)' : 'rgba(34,197,94,0.25)'}`,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '1rem' }}>{isAdmin ? '🔐' : '👁️'}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: isAdmin ? 'var(--primary-light)' : 'var(--secondary)', lineHeight: 1.2 }}>
                  {session?.name}
                </div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>
                  {isAdmin ? 'Acceso total' : 'Solo lectura'}
                </div>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginLeft: 2 }}>▼</span>
            </button>

            {/* Dropdown */}
            {showMenu && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 199 }}
                  onClick={() => setShowMenu(false)}
                />
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '6px', minWidth: 180,
                  boxShadow: 'var(--shadow)', zIndex: 200,
                  animation: 'modalIn 0.15s ease',
                }}>
                  {isAdmin && (
                    <button
                      className="btn btn-ghost w-full"
                      style={{ justifyContent: 'flex-start', fontSize: '0.82rem', padding: '8px 10px', marginBottom: 2 }}
                      onClick={() => { setShowMenu(false); setShowChangePw(true); }}
                    >
                      🔑 Cambiar contraseña
                    </button>
                  )}
                  <div style={{ height: isAdmin ? 1 : 0, background: 'var(--border)', margin: isAdmin ? '4px 0' : 0 }} />
                  <button
                    className="btn btn-danger w-full"
                    style={{ justifyContent: 'flex-start', fontSize: '0.82rem', padding: '8px 10px' }}
                    onClick={() => { setShowMenu(false); logout(); }}
                  >
                    ← Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Change password modal */}
          {showChangePw && (
        <Modal
          title="Cambiar contraseña"
          onClose={() => { setShowChangePw(false); setPwError(''); setPwSuccess(false); setPwForm({ next: '', confirm: '' }); }}
          footer={
            pwSuccess ? null : (
              <>
                <button className="btn btn-secondary" onClick={() => setShowChangePw(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleChangePw}>Cambiar contraseña</button>
              </>
            )
          }
        >
          {pwSuccess ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✅</div>
              <div style={{ fontWeight: 700, color: 'var(--success)' }}>Contraseña actualizada</div>
            </div>
          ) : (
            <form onSubmit={handleChangePw}>
              <div className="form-group">
                <label className="form-label">Nueva contraseña</label>
                <input type="password" className="form-input" placeholder="Mínimo 6 caracteres" value={pwForm.next} onChange={e => { setPwForm(f => ({ ...f, next: e.target.value })); setPwError(''); }} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Confirmar nueva contraseña</label>
                <input type="password" className="form-input" placeholder="Repite la nueva contraseña" value={pwForm.confirm} onChange={e => { setPwForm(f => ({ ...f, confirm: e.target.value })); setPwError(''); }} />
              </div>
              {pwError && (
                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)', fontSize: '0.82rem' }}>
                  ⚠️ {pwError}
                </div>
              )}
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
