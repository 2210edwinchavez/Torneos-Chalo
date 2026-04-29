import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import { getTeamColor, getInitials } from '../utils/helpers';

const MEDALS = ['🥇', '🥈', '🥉'];

/* ─── Modal de historial del jugador ─── */
function PlayerHistoryModal({ playerId, onClose }) {
  const { state } = useTournament();
  const player = state.globalPlayers.find(p => p.id === playerId);

  // Recopilar todos los eventos del jugador desde todas las planillas
  const events = useMemo(() => {
    const goals = [];
    const cards = [];
    const subs = [];

    for (const tournament of state.tournaments) {
      for (const match of (tournament.matches || [])) {
        const home = tournament.teams.find(t => t.id === match.homeId);
        const away = tournament.teams.find(t => t.id === match.awayId);
        const ctx = { match, tournament, home, away };

        for (const g of (match.goals || [])) {
          if (g.playerId === playerId) goals.push({ ...g, ...ctx });
        }
        for (const c of (match.cards || [])) {
          if (c.playerId === playerId) cards.push({ ...c, ...ctx });
        }
        for (const s of (match.substitutions || [])) {
          if (s.playerOutId === playerId || s.playerInId === playerId) subs.push({ ...s, ...ctx });
        }
      }
    }

    goals.sort((a, b) => a.minute - b.minute);
    cards.sort((a, b) => a.minute - b.minute);
    subs.sort((a, b) => a.minute - b.minute);
    return { goals, cards, subs };
  }, [state.tournaments, playerId]);

  // Equipo y camiseta del jugador
  const { team, shirtNumber } = getPlayerInfo(state.globalPlayers, state.tournaments, playerId);
  const teamColor = getTeamColor(team?.colorIndex);

  const realGoals = events.goals.filter(g => g.type !== 'autogol').length;
  const ownGoals = events.goals.filter(g => g.type === 'autogol').length;
  const yellowCards = events.cards.filter(c => c.type === 'yellow').length;
  const redCards = events.cards.filter(c => c.type === 'red').length;

  const [activeTab, setActiveTab] = useState('goals');

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '16px', overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.65)',
          marginTop: 20, marginBottom: 20,
        }}
      >
        {/* Header del jugador */}
        <div style={{ background: 'linear-gradient(135deg, #071207, #0d200d)', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>✕</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {player?.photo
              ? <img src={player.photo} alt="" style={{ width: 68, height: 68, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${teamColor || 'var(--primary)'}`, flexShrink: 0 }} />
              : <div style={{ width: 68, height: 68, borderRadius: '50%', background: (teamColor || '#84cc16') + '33', border: `3px solid ${teamColor || 'var(--primary)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.3rem', color: teamColor || 'var(--primary-light)', flexShrink: 0 }}>
                  {getInitials(`${player?.firstName || '?'} ${player?.lastName || ''}`)}
                </div>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {player ? `${player.firstName} ${player.lastName}` : 'Jugador'}
              </div>
              {team && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: teamColor, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.82rem', color: teamColor, fontWeight: 700 }}>
                    {shirtNumber ? `#${shirtNumber} · ` : ''}{team.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Resumen estadístico */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 14 }}>
            {[
              { icon: '⚽', label: 'Goles', value: realGoals, color: 'var(--primary-light)' },
              { icon: '🟨', label: 'Amarillas', value: yellowCards, color: 'var(--warning)' },
              { icon: '🟥', label: 'Rojas', value: redCards, color: 'var(--danger)' },
              { icon: '🔄', label: 'Cambios', value: events.subs.length, color: 'var(--secondary)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '8px 4px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '1rem', marginBottom: 2 }}>{s.icon}</div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg)', overflowX: 'auto' }}>
          {[
            { id: 'goals', label: `⚽ Goles (${events.goals.length})` },
            { id: 'cards', label: `🟨 Tarjetas (${events.cards.length})` },
            { id: 'subs', label: `🔄 Cambios (${events.subs.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: '1 0 auto', padding: '9px 6px', border: 'none', cursor: 'pointer',
                fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap',
                background: activeTab === tab.id ? 'var(--bg-card)' : 'transparent',
                color: activeTab === tab.id ? 'var(--primary-light)' : 'var(--text-muted)',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >{tab.label}</button>
          ))}
        </div>

        {/* Contenido */}
        <div style={{ padding: 18, maxHeight: 'calc(100vh - 360px)', overflowY: 'auto' }}>

          {/* GOLES */}
          {activeTab === 'goals' && (
            events.goals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sin goles registrados</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {events.goals.map((g, i) => {
                  const myTeam = g.teamId === g.home?.id ? g.home : g.away;
                  const opponent = g.teamId === g.home?.id ? g.away : g.home;
                  const myColor = getTeamColor(myTeam?.colorIndex);
                  const opponentColor = getTeamColor(opponent?.colorIndex);
                  const isOwnGoal = g.type === 'autogol';
                  return (
                    <div key={i} style={{
                      background: 'var(--bg-card2)', borderRadius: 10,
                      border: `1px solid ${isOwnGoal ? 'rgba(239,68,68,0.3)' : 'rgba(132,204,22,0.2)'}`,
                      padding: '12px 14px',
                    }}>
                      {/* Primera fila: ícono + equipos + minuto */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>
                          {isOwnGoal ? '🔴' : g.type === 'penalty' ? '🎯' : '⚽'}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Partido */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: myColor }}>{myTeam?.name}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>vs</span>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: opponentColor }}>{opponent?.name}</span>
                          </div>
                          {/* Torneo + ronda */}
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            {g.tournament.name} · Ronda {g.match.round}
                            {g.match.date && ` · ${g.match.date}`}
                          </div>
                        </div>
                        {/* Minuto */}
                        <div style={{ textAlign: 'center', flexShrink: 0 }}>
                          <div style={{ fontWeight: 900, fontSize: '1.2rem', color: isOwnGoal ? 'var(--danger)' : 'var(--primary-light)', lineHeight: 1 }}>{g.minute}&apos;</div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 1 }}>min</div>
                        </div>
                      </div>
                      {/* Tipo de gol */}
                      {g.type !== 'normal' && (
                        <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: 99,
                            background: isOwnGoal ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                            color: isOwnGoal ? 'var(--danger)' : 'var(--warning)',
                            border: isOwnGoal ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(245,158,11,0.3)',
                          }}>
                            {isOwnGoal ? '⚠️ AUTOGOL' : '🎯 PENAL'}
                          </span>
                        </div>
                      )}
                      {/* Marcador final si disponible */}
                      {g.match.status === 'finished' && (
                        <div style={{ marginTop: 6, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Resultado: <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{g.home?.name} {g.match.homeScore} – {g.match.awayScore} {g.away?.name}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* TARJETAS */}
          {activeTab === 'cards' && (
            events.cards.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sin tarjetas registradas</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {events.cards.map((c, i) => {
                  const isYellow = c.type === 'yellow';
                  const home = c.home;
                  const away = c.away;
                  return (
                    <div key={i} style={{
                      background: 'var(--bg-card2)', borderRadius: 10, padding: '12px 14px',
                      border: `1px solid ${isYellow ? 'rgba(245,158,11,0.35)' : 'rgba(239,68,68,0.35)'}`,
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>{isYellow ? '🟨' : '🟥'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isYellow ? 'var(--warning)' : 'var(--danger)' }}>
                          Tarjeta {isYellow ? 'amarilla' : 'roja'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          {home?.name} vs {away?.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1 }}>
                          {c.tournament.name} · R{c.match.round}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontWeight: 900, fontSize: '1.2rem', color: isYellow ? 'var(--warning)' : 'var(--danger)', lineHeight: 1 }}>{c.minute}&apos;</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 1 }}>min</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* CAMBIOS */}
          {activeTab === 'subs' && (
            events.subs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sin cambios registrados</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {events.subs.map((s, i) => {
                  const entered = s.playerInId === playerId;
                  return (
                    <div key={i} style={{
                      background: 'var(--bg-card2)', borderRadius: 10, padding: '12px 14px',
                      border: `1px solid ${entered ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}>
                      <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>🔄</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: entered ? 'var(--success)' : 'var(--danger)' }}>
                          {entered ? '↑ Entró al partido' : '↓ Salió del partido'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          {s.home?.name} vs {s.away?.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1 }}>
                          {s.tournament.name} · R{s.match.round}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--primary-light)', lineHeight: 1 }}>{s.minute}&apos;</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 1 }}>min</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', background: 'var(--bg)' }}>
          <button onClick={onClose} className="btn btn-secondary">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

function computeScorers(tournaments, filterTournamentId) {
  const map = {};

  const toursToScan = filterTournamentId
    ? tournaments.filter(t => t.id === filterTournamentId)
    : tournaments;

  for (const tournament of toursToScan) {
    for (const match of (tournament.matches || [])) {
      for (const goal of (match.goals || [])) {
        const pid = goal.playerId;
        if (!pid) continue;
        if (!map[pid]) {
          map[pid] = { playerId: pid, goals: 0, penalties: 0, ownGoals: 0, tournaments: new Set() };
        }
        if (goal.type === 'autogol') {
          map[pid].ownGoals++;
        } else {
          map[pid].goals++;
          if (goal.type === 'penalty') map[pid].penalties++;
        }
        map[pid].tournaments.add(tournament.id);
      }
    }
  }

  return Object.values(map)
    .filter(s => s.goals > 0)
    .sort((a, b) => b.goals - a.goals || b.penalties - a.penalties);
}

function computeCards(tournaments, filterTournamentId) {
  const map = {};
  const toursToScan = filterTournamentId
    ? tournaments.filter(t => t.id === filterTournamentId)
    : tournaments;

  for (const tournament of toursToScan) {
    for (const match of (tournament.matches || [])) {
      for (const card of (match.cards || [])) {
        const pid = card.playerId;
        if (!pid) continue;
        if (!map[pid]) map[pid] = { playerId: pid, yellow: 0, red: 0 };
        if (card.type === 'yellow') map[pid].yellow++;
        else if (card.type === 'red') map[pid].red++;
      }
    }
  }

  return Object.values(map)
    .filter(s => s.yellow > 0 || s.red > 0)
    .sort((a, b) => b.red - a.red || b.yellow - a.yellow);
}

function getPlayerInfo(globalPlayers, tournaments, playerId) {
  const player = globalPlayers.find(p => p.id === playerId);
  let team = null;
  let shirtNumber = '';
  for (const t of tournaments) {
    for (const tm of t.teams) {
      const e = (tm.enrollments || []).find(en => en.playerId === playerId);
      if (e) { team = tm; shirtNumber = e.shirtNumber || ''; break; }
    }
    if (team) break;
  }
  return { player, team, shirtNumber };
}

export default function Scorers() {
  const { state, activeTournament } = useTournament();
  const [filterTournamentId, setFilterTournamentId] = useState(activeTournament?.id || '');
  const [activeTab, setActiveTab] = useState('goals'); // 'goals' | 'cards'
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  const scorers = useMemo(
    () => computeScorers(state.tournaments, filterTournamentId || null),
    [state.tournaments, filterTournamentId]
  );

  const cards = useMemo(
    () => computeCards(state.tournaments, filterTournamentId || null),
    [state.tournaments, filterTournamentId]
  );

  const hasData = scorers.length > 0 || cards.length > 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Tabla de Goleadores</div>
          <div className="page-subtitle">
            Estadísticas calculadas automáticamente desde las planillas de partido
          </div>
        </div>
      </div>

      {/* Filtro por torneo */}
      <div style={{ marginBottom: 20 }}>
        <select
          className="form-input"
          style={{ maxWidth: 320 }}
          value={filterTournamentId}
          onChange={e => setFilterTournamentId(e.target.value)}
        >
          <option value="">Todos los torneos</option>
          {state.tournaments.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {[
          { id: 'goals', label: `⚽ Goleadores (${scorers.length})` },
          { id: 'cards', label: `🟨 Disciplina (${cards.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="tab"
            style={{
              color: activeTab === tab.id ? 'var(--primary-light)' : undefined,
              borderBottomColor: activeTab === tab.id ? 'var(--primary)' : undefined,
            }}
          >{tab.label}</button>
        ))}
      </div>

      {!hasData ? (
        <div className="empty-state">
          <div className="empty-state-icon">⚽</div>
          <h3>Sin goles registrados</h3>
          <p>
            Cuando registres goles en la planilla de un partido, aparecerán aquí automáticamente.
          </p>
          {activeTournament && (
            <Link to="/partidos" className="btn btn-primary" style={{ marginTop: 20 }}>
              Ir a Partidos
            </Link>
          )}
        </div>
      ) : activeTab === 'goals' ? (
        <>
          {scorers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⚽</div>
              <h3>Sin goles en este filtro</h3>
            </div>
          ) : (
            <>
              {/* Podio top 3 */}
              {scorers.length >= 1 && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {scorers.slice(0, Math.min(3, scorers.length)).map((scorer, idx) => {
                    const { player, team, shirtNumber } = getPlayerInfo(state.globalPlayers, state.tournaments, scorer.playerId);
                    const teamColor = getTeamColor(team?.colorIndex);
                    const podiumSizes = [92, 76, 68];
                    const podiumBorders = [
                      '2px solid #f59e0b',
                      '2px solid #94a3b8',
                      '2px solid #b45309',
                    ];
                    return (
                      <div
                        key={scorer.playerId}
                        onClick={() => setSelectedPlayerId(scorer.playerId)}
                        style={{
                          flex: '1 1 140px', maxWidth: 180,
                          background: 'var(--bg-card)',
                          border: podiumBorders[idx],
                          borderRadius: 16, padding: '18px 12px',
                          textAlign: 'center',
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'transform 0.15s, box-shadow 0.15s',
                          boxShadow: idx === 0 ? '0 0 24px rgba(245,158,11,0.2)' : undefined,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = idx === 0 ? '0 0 24px rgba(245,158,11,0.2)' : ''; }}
                      >
                        <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', fontSize: '1.4rem' }}>
                          {MEDALS[idx]}
                        </div>
                        {player?.photo
                          ? <img src={player.photo} alt="" style={{ width: podiumSizes[idx], height: podiumSizes[idx], borderRadius: '50%', objectFit: 'cover', border: podiumBorders[idx], marginBottom: 8, marginTop: 4 }} />
                          : <div style={{ width: podiumSizes[idx], height: podiumSizes[idx], borderRadius: '50%', background: teamColor + '33', border: podiumBorders[idx], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: podiumSizes[idx] * 0.28 + 'px', color: teamColor, margin: '4px auto 8px' }}>
                              {getInitials(`${player?.firstName || '?'} ${player?.lastName || ''}`)}
                            </div>
                        }
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                          {player ? `${player.firstName} ${player.lastName}` : 'Jugador'}
                        </div>
                        {team && (
                          <div style={{ fontSize: '0.68rem', color: teamColor, fontWeight: 700, marginTop: 3 }}>
                            {shirtNumber ? `#${shirtNumber} · ` : ''}{team.name}
                          </div>
                        )}
                        <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 3 }}>
                          <span style={{ fontSize: idx === 0 ? '2rem' : '1.6rem', fontWeight: 900, color: idx === 0 ? '#f59e0b' : 'var(--text-primary)', lineHeight: 1 }}>
                            {scorer.goals}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>goles</span>
                        </div>
                        {scorer.penalties > 0 && (
                          <div style={{ fontSize: '0.62rem', color: 'var(--warning)', marginTop: 2 }}>
                            {scorer.penalties} pen.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tabla completa */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1rem' }}>⚽</span>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>Clasificación de goleadores</span>
                  <span className="badge badge-active" style={{ marginLeft: 'auto' }}>{scorers.length} jugadores</span>
                </div>
                <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>#</th>
                        <th>Jugador</th>
                        <th>Equipo</th>
                        <th style={{ textAlign: 'center' }}>⚽ Goles</th>
                        <th style={{ textAlign: 'center' }}>🅿️ Pen.</th>
                        <th style={{ textAlign: 'center' }}>AG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scorers.map((scorer, idx) => {
                        const { player, team, shirtNumber } = getPlayerInfo(state.globalPlayers, state.tournaments, scorer.playerId);
                        const teamColor = getTeamColor(team?.colorIndex);
                        const isTop3 = idx < 3;
                        return (
                          <tr
                            key={scorer.playerId}
                            onClick={() => setSelectedPlayerId(scorer.playerId)}
                            style={{ background: isTop3 ? 'rgba(132,204,22,0.03)' : undefined, cursor: 'pointer' }}
                          >
                            <td style={{ textAlign: 'center' }}>
                              {idx < 3
                                ? <span style={{ fontSize: '1.1rem' }}>{MEDALS[idx]}</span>
                                : <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{idx + 1}</span>
                              }
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                {player?.photo
                                  ? <img src={player.photo} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)', flexShrink: 0 }} />
                                  : <div style={{ width: 36, height: 36, borderRadius: '50%', background: teamColor + '33', color: teamColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0 }}>
                                      {getInitials(`${player?.firstName || '?'} ${player?.lastName || ''}`)}
                                    </div>
                                }
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                    {player ? `${player.firstName} ${player.lastName}` : 'Jugador desconocido'}
                                  </div>
                                  {shirtNumber && (
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                      Camiseta #{shirtNumber}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td>
                              {team
                                ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: teamColor, flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{team.name}</span>
                                  </div>
                                : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                              }
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{
                                fontWeight: 900, fontSize: '1.1rem',
                                color: isTop3 ? 'var(--primary-light)' : 'var(--text-primary)',
                              }}>
                                {scorer.goals}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center', color: 'var(--warning)', fontWeight: 700 }}>
                              {scorer.penalties > 0 ? scorer.penalties : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                            </td>
                            <td style={{ textAlign: 'center', color: 'var(--danger)', fontSize: '0.82rem' }}>
                              {scorer.ownGoals > 0 ? scorer.ownGoals : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        /* DISCIPLINA */
        <>
          {cards.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🟨</div>
              <h3>Sin tarjetas en este filtro</h3>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1rem' }}>🟨</span>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>Tabla disciplinaria</span>
                <span className="badge badge-pending" style={{ marginLeft: 'auto' }}>{cards.length} jugadores</span>
              </div>
              <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>#</th>
                      <th>Jugador</th>
                      <th>Equipo</th>
                      <th style={{ textAlign: 'center' }}>🟨 Amarillas</th>
                      <th style={{ textAlign: 'center' }}>🟥 Rojas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cards.map((card, idx) => {
                      const { player, team, shirtNumber } = getPlayerInfo(state.globalPlayers, state.tournaments, card.playerId);
                      const teamColor = getTeamColor(team?.colorIndex);
                      return (
                        <tr
                          key={card.playerId}
                          onClick={() => setSelectedPlayerId(card.playerId)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{idx + 1}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {player?.photo
                                ? <img src={player.photo} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)', flexShrink: 0 }} />
                                : <div style={{ width: 34, height: 34, borderRadius: '50%', background: teamColor + '33', color: teamColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.7rem', flexShrink: 0 }}>
                                    {getInitials(`${player?.firstName || '?'} ${player?.lastName || ''}`)}
                                  </div>
                              }
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                  {player ? `${player.firstName} ${player.lastName}` : 'Jugador desconocido'}
                                </div>
                                {shirtNumber && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>#{shirtNumber}</div>}
                              </div>
                            </div>
                          </td>
                          <td>
                            {team
                              ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: teamColor, flexShrink: 0 }} />
                                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{team.name}</span>
                                </div>
                              : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                            }
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {card.yellow > 0
                              ? <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--warning)' }}>{card.yellow}</span>
                              : <span style={{ color: 'var(--text-muted)' }}>—</span>
                            }
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {card.red > 0
                              ? <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--danger)' }}>{card.red}</span>
                              : <span style={{ color: 'var(--text-muted)' }}>—</span>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de historial del jugador */}
      {selectedPlayerId && (
        <PlayerHistoryModal
          playerId={selectedPlayerId}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}
    </div>
  );
}
