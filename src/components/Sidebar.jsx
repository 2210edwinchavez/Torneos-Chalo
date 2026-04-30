import { NavLink, useNavigate } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import { APP_DISPLAY_NAME, APP_LOGO_URL } from '../constants/branding';
import { getTeamColor } from '../utils/helpers';

const SPORT_ICONS = {
  'Fútbol': '⚽',
  'Baloncesto': '🏀',
  'Tenis': '🎾',
  'Voleibol': '🏐',
  'Béisbol': '⚾',
  'Otro': '🏆',
};

export default function Sidebar({ isOpen, onClose }) {
  const { state, dispatch, activeTournament } = useTournament();
  const navigate = useNavigate();

  function selectTournament(id) {
    dispatch({ type: 'SET_ACTIVE_TOURNAMENT', payload: id });
    navigate('/');
    onClose?.();
  }

  function handleNav() {
    onClose?.();
  }

  return (
    <aside className={`sidebar${isOpen ? ' sidebar-open' : ''}`}>
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={APP_LOGO_URL} alt={APP_DISPLAY_NAME} style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6 }} />
            <h1 style={{ margin: 0 }}>{APP_DISPLAY_NAME}</h1>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Cerrar menú"
          >✕</button>
        </div>
        <span>Gestión de Torneos</span>
      </div>

      <nav className="sidebar-nav">
        <p className="sidebar-section-label">General</p>

        <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={handleNav}>
          <span className="nav-icon">📊</span> Dashboard
        </NavLink>

        <NavLink to="/torneos" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={handleNav}>
          <span className="nav-icon">🏆</span> Torneos
        </NavLink>

        <NavLink to="/jugadores" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={handleNav}>
          <span className="nav-icon">👤</span> Jugadores
        </NavLink>

        <NavLink to="/goleadores" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={handleNav}>
          <span className="nav-icon">⚽</span> Goleadores
        </NavLink>

        {activeTournament && (
          <>
            <p className="sidebar-section-label" style={{ marginTop: 16 }}>
              Torneo activo
            </p>
            <div
              style={{
                padding: '8px 12px',
                marginBottom: 8,
                background: 'rgba(132,204,22,0.08)',
                borderRadius: 8,
                border: '1px solid rgba(132,204,22,0.2)',
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-light)' }}>
                {SPORT_ICONS[activeTournament.sport] || '🏆'} {activeTournament.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {activeTournament.type === 'league' ? 'Liga' : 'Eliminatoria'} · {activeTournament.teams.length} equipos
              </div>
            </div>

            <NavLink to="/equipos" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={handleNav}>
              <span className="nav-icon">👥</span> Equipos
            </NavLink>

            <NavLink to="/partidos" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={handleNav}>
              <span className="nav-icon">📅</span> Partidos
            </NavLink>

            {activeTournament.type === 'league' && (
              <NavLink to="/posiciones" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={handleNav}>
                <span className="nav-icon">📋</span> Posiciones
              </NavLink>
            )}

            {activeTournament.type === 'knockout' && (
              <NavLink to="/bracket" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} onClick={handleNav}>
                <span className="nav-icon">🎯</span> Bracket
              </NavLink>
            )}
          </>
        )}

        {state.tournaments.length > 0 && (
          <>
            <p className="sidebar-section-label" style={{ marginTop: 16 }}>
              Todos los torneos
            </p>
            {state.tournaments.map((t, i) => (
              <button
                key={t.id}
                className="sidebar-tournament-item"
                onClick={() => selectTournament(t.id)}
                style={{
                  background:
                    t.id === activeTournament?.id
                      ? 'rgba(132,204,22,0.06)'
                      : undefined,
                }}
              >
                <span
                  className="sidebar-dot"
                  style={{ background: getTeamColor(i) }}
                />
                <span style={{ flex: 1, textAlign: 'left' }}>{t.name}</span>
                {t.id === activeTournament?.id && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--primary-light)' }}>●</span>
                )}
              </button>
            ))}
          </>
        )}
      </nav>

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          {APP_DISPLAY_NAME} v1.0
        </div>
      </div>
    </aside>
  );
}
