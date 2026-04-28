import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import { formatDate, getTeamColor, getInitials } from '../utils/helpers';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const SPORT_ICONS = {
  'Fútbol': '⚽', 'Baloncesto': '🏀', 'Tenis': '🎾',
  'Voleibol': '🏐', 'Béisbol': '⚾', 'Otro': '🏆',
};

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { state, activeTournament, dispatch } = useTournament();

  const globalStats = useMemo(() => {
    const total = state.tournaments.length;
    const active = state.tournaments.filter(t => t.status === 'active').length;
    const totalTeams = state.tournaments.reduce((s, t) => s + t.teams.length, 0);
    const totalMatches = state.tournaments.reduce((s, t) => s + t.matches.length, 0);
    const played = state.tournaments.reduce(
      (s, t) => s + t.matches.filter(m => m.status === 'finished').length, 0
    );
    return { total, active, totalTeams, totalMatches, played };
  }, [state.tournaments]);

  const recentMatches = useMemo(() => {
    const all = [];
    state.tournaments.forEach(t => {
      t.matches.filter(m => m.status === 'finished').forEach(m => {
        const home = t.teams.find(tm => tm.id === m.homeId);
        const away = t.teams.find(tm => tm.id === m.awayId);
        if (home && away) {
          all.push({ ...m, home, away, tournament: t.name });
        }
      });
    });
    return all.slice(-5).reverse();
  }, [state.tournaments]);

  const upcomingMatches = useMemo(() => {
    const all = [];
    state.tournaments.forEach(t => {
      t.matches.filter(m => m.status === 'scheduled').forEach(m => {
        const home = t.teams.find(tm => tm.id === m.homeId);
        const away = t.teams.find(tm => tm.id === m.awayId);
        if (home && away) {
          all.push({ ...m, home, away, tournament: t.name });
        }
      });
    });
    return all.slice(0, 5);
  }, [state.tournaments]);

  const chartData = useMemo(() => {
    return state.tournaments.map(t => ({
      name: t.name.length > 14 ? t.name.slice(0, 12) + '…' : t.name,
      equipos: t.teams.length,
      partidos: t.matches.length,
      jugados: t.matches.filter(m => m.status === 'finished').length,
    }));
  }, [state.tournaments]);

  if (state.tournaments.length === 0) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Fondo cancha */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, #1a4a1a 0%, #1e5c1e 25%, #226622 50%, #1e5c1e 75%, #1a4a1a 100%)',
        }} />

        {/* Franjas de césped */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(0,0,0,0.08) 60px, rgba(0,0,0,0.08) 120px)',
        }} />

        {/* Líneas blancas de la cancha */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.18 }} viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
          {/* Borde cancha */}
          <rect x="60" y="40" width="880" height="520" fill="none" stroke="white" strokeWidth="3"/>
          {/* Línea central */}
          <line x1="500" y1="40" x2="500" y2="560" stroke="white" strokeWidth="3"/>
          {/* Círculo central */}
          <circle cx="500" cy="300" r="80" fill="none" stroke="white" strokeWidth="3"/>
          <circle cx="500" cy="300" r="4" fill="white"/>
          {/* Área grande izquierda */}
          <rect x="60" y="170" width="130" height="260" fill="none" stroke="white" strokeWidth="3"/>
          {/* Área pequeña izquierda */}
          <rect x="60" y="230" width="55" height="140" fill="none" stroke="white" strokeWidth="3"/>
          {/* Área grande derecha */}
          <rect x="810" y="170" width="130" height="260" fill="none" stroke="white" strokeWidth="3"/>
          {/* Área pequeña derecha */}
          <rect x="885" y="230" width="55" height="140" fill="none" stroke="white" strokeWidth="3"/>
          {/* Semicírculo área izquierda */}
          <path d="M 190 240 A 80 80 0 0 1 190 360" fill="none" stroke="white" strokeWidth="3"/>
          {/* Semicírculo área derecha */}
          <path d="M 810 240 A 80 80 0 0 0 810 360" fill="none" stroke="white" strokeWidth="3"/>
          {/* Punto penal izquierdo */}
          <circle cx="145" cy="300" r="4" fill="white"/>
          {/* Punto penal derecho */}
          <circle cx="855" cy="300" r="4" fill="white"/>
          {/* Porterías */}
          <rect x="40" y="258" width="20" height="84" fill="none" stroke="white" strokeWidth="3"/>
          <rect x="940" y="258" width="20" height="84" fill="none" stroke="white" strokeWidth="3"/>
          {/* Esquinas */}
          <path d="M 60 40 Q 75 40 75 55" fill="none" stroke="white" strokeWidth="2"/>
          <path d="M 940 40 Q 925 40 925 55" fill="none" stroke="white" strokeWidth="2"/>
          <path d="M 60 560 Q 75 560 75 545" fill="none" stroke="white" strokeWidth="2"/>
          <path d="M 940 560 Q 925 560 925 545" fill="none" stroke="white" strokeWidth="2"/>
        </svg>

        {/* Overlay oscuro para legibilidad */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.45)',
        }} />

        {/* Contenido */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <img
            src="/logo jc sport.png"
            alt="Torneos JC SPORT"
            style={{
              width: 130, height: 130, objectFit: 'contain', marginBottom: 20,
              filter: 'drop-shadow(0 8px 32px rgba(132,204,22,0.5))',
            }}
          />
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', marginBottom: 8 }}>
            Bienvenido a Torneos JC SPORT
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24, fontSize: '0.95rem' }}>
            Aún no tienes torneos. Crea tu primer torneo para comenzar.
          </p>
          <Link to="/torneos" className="btn btn-primary" style={{ fontSize: '1rem', padding: '12px 28px' }}>
            + Crear primer torneo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div className="stat-grid">
        <StatCard label="Torneos totales" value={globalStats.total} icon="🏆" color="indigo" sub={`${globalStats.active} activos`} />
        <StatCard label="Equipos" value={globalStats.totalTeams} icon="👥" color="blue" sub="en todos los torneos" />
        <StatCard label="Partidos" value={globalStats.totalMatches} icon="📅" color="green" sub={`${globalStats.played} jugados`} />
        <StatCard label="Pendientes" value={globalStats.totalMatches - globalStats.played} icon="⏳" color="amber" sub="por jugar" />
      </div>

      <div className="grid-2 mb-24">
        {/* Chart */}
        <div className="card">
          <div className="flex-between mb-16">
            <div>
              <div className="font-semibold">Torneos — Equipos y partidos</div>
              <div className="text-xs text-muted" style={{ marginTop: 2 }}>Comparativa general</div>
            </div>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={14}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#111713', border: '1px solid #1e2d1a', borderRadius: 8, color: '#f1f5f9' }}
                  cursor={{ fill: 'rgba(132,204,22,0.08)' }}
                />
                <Bar dataKey="equipos" name="Equipos" fill="#84cc16" radius={[4,4,0,0]} />
                <Bar dataKey="jugados" name="Jugados" fill="#10b981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: 30 }}>
              <p>Sin datos aún</p>
            </div>
          )}
        </div>

        {/* Tournaments list */}
        <div className="card">
          <div className="flex-between mb-16">
            <div className="font-semibold">Mis torneos</div>
            <Link to="/torneos" className="btn btn-ghost btn-sm">Ver todos →</Link>
          </div>
          <div className="flex-col gap-8">
            {state.tournaments.map((t, i) => (
              <button
                key={t.id}
                onClick={() => dispatch({ type: 'SET_ACTIVE_TOURNAMENT', payload: t.id })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1px solid ${t.id === activeTournament?.id ? 'rgba(132,204,22,0.4)' : 'var(--border)'}`,
                  background: t.id === activeTournament?.id ? 'rgba(132,204,22,0.08)' : 'var(--bg-card2)',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                <div
                  className="team-avatar"
                  style={{ background: getTeamColor(i) + '33', color: getTeamColor(i), fontSize: '1rem' }}
                >
                  {SPORT_ICONS[t.sport] || '🏆'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {t.teams.length} equipos · {t.matches.filter(m => m.status === 'finished').length}/{t.matches.length} partidos
                  </div>
                </div>
                <span className={`badge ${t.status === 'active' ? 'badge-active' : 'badge-finished'}`}>
                  {t.status === 'active' ? 'Activo' : 'Finalizado'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Recent results */}
        <div className="card">
          <div className="flex-between mb-16">
            <div className="font-semibold">Últimos resultados</div>
          </div>
          {recentMatches.length === 0 ? (
            <div className="empty-state" style={{ padding: 30 }}>
              <div className="empty-state-icon">⚽</div>
              <p>Sin resultados registrados aún</p>
            </div>
          ) : (
            <div className="flex-col gap-8">
              {recentMatches.map(m => (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 8, background: 'var(--bg-card2)',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {m.home.name} vs {m.away.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.tournament}</div>
                  </div>
                  <div style={{
                    fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)',
                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: 6, padding: '3px 10px'
                  }}>
                    {m.homeScore} — {m.awayScore}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming */}
        <div className="card">
          <div className="flex-between mb-16">
            <div className="font-semibold">Próximos partidos</div>
          </div>
          {upcomingMatches.length === 0 ? (
            <div className="empty-state" style={{ padding: 30 }}>
              <div className="empty-state-icon">📅</div>
              <p>No hay partidos programados</p>
            </div>
          ) : (
            <div className="flex-col gap-8">
              {upcomingMatches.map(m => (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 8, background: 'var(--bg-card2)',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {m.home.name} vs {m.away.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {m.tournament}{m.date ? ` · ${formatDate(m.date)}` : ''}
                    </div>
                  </div>
                  <span className="badge badge-pending">Pendiente</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
