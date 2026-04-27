import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTournament } from '../context/TournamentContext';
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
  const info = PAGE_INFO[currentPath] || { title: 'TourneyPro', subtitle: '' };

  const [showMenu, setShowMenu] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  function handleChangePw(e) {
    e.preventDefault();
    setPwError('');
    if (pwForm.next !== pwForm.confirm) {
      setPwError('Las contraseñas nuevas no coinciden.');
      return;
    }
    const result = changePassword(pwForm.current, pwForm.next);
    if (result.error) { setPwError(result.error); return; }
    setPwSuccess(true);
    setTimeout(() => { setShowChangePw(false); setPwSuccess(false); setPwForm({ current: '', next: '', confirm: '' }); }, 1500);
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
          {activeTournament && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: activeTournament.status === 'active' ? 'var(--success)' : 'var(--text-muted)', display: 'inline-block' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {activeTournament.name}
              </span>
            </div>
          )}

          {/* Role badge + user menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMenu(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 12px', borderRadius: 8,
                background: isAdmin ? 'rgba(99,102,241,0.12)' : 'rgba(14,165,233,0.1)',
                border: `1px solid ${isAdmin ? 'rgba(99,102,241,0.3)' : 'rgba(14,165,233,0.25)'}`,
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
          title="Cambiar contraseña de administrador"
          onClose={() => { setShowChangePw(false); setPwError(''); setPwSuccess(false); setPwForm({ current: '', next: '', confirm: '' }); }}
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
                <label className="form-label">Contraseña actual</label>
                <input type="password" className="form-input" placeholder="Contraseña actual" value={pwForm.current} onChange={e => { setPwForm(f => ({ ...f, current: e.target.value })); setPwError(''); }} autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Nueva contraseña</label>
                <input type="password" className="form-input" placeholder="Mínimo 4 caracteres" value={pwForm.next} onChange={e => { setPwForm(f => ({ ...f, next: e.target.value })); setPwError(''); }} />
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
