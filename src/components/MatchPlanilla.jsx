import { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import { getTeamColor, getInitials, generateId } from '../utils/helpers';

export default function MatchPlanilla({ match, tournament, onClose }) {
  const { dispatch, state } = useTournament();
  const { isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState('info');
  const [planilla, setPlanilla] = useState({
    referee: match.referee || '',
    startTime: match.startTime || match.time || '',
    homeScore: match.homeScore ?? '',
    awayScore: match.awayScore ?? '',
    goals: match.goals || [],
    substitutions: match.substitutions || [],
    cards: match.cards || [],
  });

  const [newGoal, setNewGoal] = useState({ teamId: '', playerId: '', minute: '', type: 'normal' });
  const [newSub, setNewSub] = useState({ teamId: '', playerOutId: '', playerInId: '', minute: '' });
  const [newCard, setNewCard] = useState({ teamId: '', playerId: '', minute: '', type: 'yellow' });

  const home = tournament.teams.find(t => t.id === match.homeId);
  const away = tournament.teams.find(t => t.id === match.awayId);
  const homeColor = getTeamColor(home?.colorIndex);
  const awayColor = getTeamColor(away?.colorIndex);
  const { globalPlayers } = state;

  function getTeamPlayers(teamId) {
    const team = tournament.teams.find(t => t.id === teamId);
    if (!team) return [];
    return (team.enrollments || [])
      .map(e => {
        const p = globalPlayers.find(gp => gp.id === e.playerId);
        return p ? { ...p, shirtNumber: e.shirtNumber } : null;
      })
      .filter(Boolean)
      .sort((a, b) => {
        const na = Number(a.shirtNumber) || 999;
        const nb = Number(b.shirtNumber) || 999;
        return na - nb;
      });
  }

  function getPlayerName(playerId) {
    const p = globalPlayers.find(gp => gp.id === playerId);
    if (!p) return 'Jugador desconocido';
    return `${p.firstName} ${p.lastName}`.trim();
  }

  function getPlayerShirt(teamId, playerId) {
    const team = tournament.teams.find(t => t.id === teamId);
    const e = (team?.enrollments || []).find(en => en.playerId === playerId);
    return e?.shirtNumber || '';
  }

  function addGoal() {
    if (!newGoal.teamId || !newGoal.playerId || !newGoal.minute) return;
    setPlanilla(prev => ({
      ...prev,
      goals: [...prev.goals, { id: generateId(), ...newGoal, minute: Number(newGoal.minute) }],
    }));
    setNewGoal(g => ({ ...g, playerId: '', minute: '' }));
  }

  function removeGoal(id) {
    setPlanilla(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }));
  }

  function addSub() {
    if (!newSub.teamId || !newSub.playerOutId || !newSub.playerInId || !newSub.minute) return;
    setPlanilla(prev => ({
      ...prev,
      substitutions: [...prev.substitutions, { id: generateId(), ...newSub, minute: Number(newSub.minute) }],
    }));
    setNewSub(s => ({ ...s, playerOutId: '', playerInId: '', minute: '' }));
  }

  function removeSub(id) {
    setPlanilla(prev => ({ ...prev, substitutions: prev.substitutions.filter(s => s.id !== id) }));
  }

  function addCard() {
    if (!newCard.teamId || !newCard.playerId || !newCard.minute) return;
    setPlanilla(prev => ({
      ...prev,
      cards: [...prev.cards, { id: generateId(), ...newCard, minute: Number(newCard.minute) }],
    }));
    setNewCard(c => ({ ...c, playerId: '', minute: '' }));
  }

  function removeCard(id) {
    setPlanilla(prev => ({ ...prev, cards: prev.cards.filter(c => c.id !== id) }));
  }

  function savePlanilla() {
    const isFinished = planilla.homeScore !== '' && planilla.awayScore !== '';
    dispatch({
      type: 'UPDATE_MATCH',
      payload: {
        tournamentId: tournament.id,
        matchId: match.id,
        data: {
          referee: planilla.referee,
          startTime: planilla.startTime,
          homeScore: isFinished ? Number(planilla.homeScore) : match.homeScore,
          awayScore: isFinished ? Number(planilla.awayScore) : match.awayScore,
          status: isFinished ? 'finished' : match.status,
          goals: planilla.goals,
          substitutions: planilla.substitutions,
          cards: planilla.cards,
        },
      },
    });
    onClose();
  }

  const allEvents = [
    ...planilla.goals.map(g => ({ ...g, _type: 'goal' })),
    ...planilla.cards.map(c => ({ ...c, _type: 'card' })),
    ...planilla.substitutions.map(s => ({ ...s, _type: 'sub' })),
  ].sort((a, b) => (a.minute || 0) - (b.minute || 0));

  const tabs = [
    { id: 'info', label: '📋 Info' },
    { id: 'goals', label: `⚽ Goles (${planilla.goals.length})` },
    { id: 'subs', label: `🔄 Cambios (${planilla.substitutions.length})` },
    { id: 'cards', label: `🟨 Tarjetas (${planilla.cards.length})` },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.78)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '16px', overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 600,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
          marginTop: 10, marginBottom: 20,
        }}
      >
        {/* ── Cabecera ── */}
        <div style={{
          background: 'linear-gradient(135deg, #071207 0%, #0d200d 100%)',
          padding: '14px 18px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                📋 Planilla Digital · Comisario de Campo
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {tournament.name} · Ronda {match.round || '?'}
                {match.date && ` · ${match.date}`}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}
            >✕</button>
          </div>

          {/* Equipos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
            {/* Local */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              {home?.shield
                ? <img src={home.shield} style={{ width: 34, height: 34, objectFit: 'contain', flexShrink: 0 }} alt="" />
                : <div style={{ width: 34, height: 34, borderRadius: 8, background: homeColor + '33', color: homeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.7rem', flexShrink: 0 }}>{getInitials(home?.name)}</div>
              }
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{home?.name}</div>
                <div style={{ fontSize: '0.6rem', color: homeColor, fontWeight: 700, letterSpacing: '0.06em' }}>LOCAL</div>
              </div>
            </div>

            {/* Marcador */}
            <div style={{
              background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(132,204,22,0.25)',
              borderRadius: 10, padding: '6px 14px', textAlign: 'center', flexShrink: 0,
            }}>
              {match.status === 'finished' ? (
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {match.homeScore}<span style={{ color: 'var(--text-muted)', margin: '0 5px' }}>–</span>{match.awayScore}
                </div>
              ) : (
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--primary-light)' }}>VS</div>
              )}
              <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em', marginTop: 2 }}>
                {match.status === 'finished' ? 'FINAL' : 'PROGRAMADO'}
              </div>
            </div>

            {/* Visita */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', flexDirection: 'row-reverse', minWidth: 0 }}>
              {away?.shield
                ? <img src={away.shield} style={{ width: 34, height: 34, objectFit: 'contain', flexShrink: 0 }} alt="" />
                : <div style={{ width: 34, height: 34, borderRadius: 8, background: awayColor + '33', color: awayColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.7rem', flexShrink: 0 }}>{getInitials(away?.name)}</div>
              }
              <div style={{ textAlign: 'right', minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{away?.name}</div>
                <div style={{ fontSize: '0.6rem', color: awayColor, fontWeight: 700, letterSpacing: '0.06em' }}>VISITA</div>
              </div>
            </div>
          </div>

          {/* Info árbitro / hora inicio */}
          {(match.referee || match.startTime) && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {match.referee && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: 99 }}>
                  👨‍⚖️ {match.referee}
                </span>
              )}
              {match.startTime && (
                <span style={{ fontSize: '0.7rem', color: 'var(--primary-light)', background: 'rgba(132,204,22,0.08)', padding: '3px 8px', borderRadius: 99, fontWeight: 700 }}>
                  🕐 {match.startTime}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg)', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: '1 0 auto', padding: '10px 6px',
                border: 'none', cursor: 'pointer',
                fontSize: '0.7rem', fontWeight: 700,
                background: activeTab === tab.id ? 'var(--bg-card)' : 'transparent',
                color: activeTab === tab.id ? 'var(--primary-light)' : 'var(--text-muted)',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
            >{tab.label}</button>
          ))}
        </div>

        {/* ── Contenido ── */}
        <div style={{ padding: '18px', maxHeight: 'calc(100vh - 340px)', overflowY: 'auto' }}>

          {/* INFO GENERAL */}
          {activeTab === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="grid-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">🕐 Hora de inicio</label>
                  <input
                    type="time" className="form-input"
                    value={planilla.startTime}
                    onChange={e => setPlanilla(p => ({ ...p, startTime: e.target.value }))}
                    disabled={!isAdmin}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">👨‍⚖️ Árbitro</label>
                  <input
                    type="text" className="form-input"
                    placeholder="Nombre del árbitro"
                    value={planilla.referee}
                    onChange={e => setPlanilla(p => ({ ...p, referee: e.target.value }))}
                    disabled={!isAdmin}
                  />
                </div>
              </div>

              {isAdmin && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                    Resultado del partido
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: homeColor, marginBottom: 6 }}>{home?.name}</div>
                      <input
                        type="number" min="0" max="99" className="form-input"
                        value={planilla.homeScore}
                        onChange={e => setPlanilla(p => ({ ...p, homeScore: e.target.value }))}
                        style={{ width: 70, textAlign: 'center', fontSize: '1.4rem', fontWeight: 700, padding: '6px 4px', margin: '0 auto', display: 'block' }}
                      />
                    </div>
                    <span style={{ fontSize: '1.3rem', color: 'var(--text-muted)', marginTop: 22 }}>—</span>
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: awayColor, marginBottom: 6 }}>{away?.name}</div>
                      <input
                        type="number" min="0" max="99" className="form-input"
                        value={planilla.awayScore}
                        onChange={e => setPlanilla(p => ({ ...p, awayScore: e.target.value }))}
                        style={{ width: 70, textAlign: 'center', fontSize: '1.4rem', fontWeight: 700, padding: '6px 4px', margin: '0 auto', display: 'block' }}
                      />
                    </div>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
                    Deja vacíos para marcar como pendiente.
                  </p>
                </div>
              )}

              {/* Resumen de eventos */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Resumen de eventos
                </div>
                {allEvents.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '18px 0' }}>
                    Sin eventos registrados — usa las otras pestañas para agregar goles, cambios y tarjetas.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {allEvents.map(event => {
                      const team = tournament.teams.find(t => t.id === event.teamId);
                      const isHome = event.teamId === home?.id;
                      const color = isHome ? homeColor : awayColor;

                      if (event._type === 'goal') {
                        return (
                          <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', padding: '5px 0' }}>
                            <span style={{ minWidth: 28, fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right' }}>{event.minute}&apos;</span>
                            <span>⚽</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{getPlayerName(event.playerId)}</span>
                            <span style={{ fontSize: '0.7rem', color }}>{team?.name}</span>
                            {event.type !== 'normal' && (
                              <span style={{ fontSize: '0.6rem', fontWeight: 800, color: event.type === 'penalty' ? 'var(--warning)' : 'var(--danger)', background: event.type === 'penalty' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)', padding: '1px 5px', borderRadius: 4 }}>
                                {event.type === 'penalty' ? 'PEN' : 'AG'}
                              </span>
                            )}
                          </div>
                        );
                      }
                      if (event._type === 'card') {
                        return (
                          <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', padding: '5px 0' }}>
                            <span style={{ minWidth: 28, fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right' }}>{event.minute}&apos;</span>
                            <span>{event.type === 'yellow' ? '🟨' : '🟥'}</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{getPlayerName(event.playerId)}</span>
                            <span style={{ fontSize: '0.7rem', color }}>{team?.name}</span>
                          </div>
                        );
                      }
                      if (event._type === 'sub') {
                        return (
                          <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', padding: '5px 0' }}>
                            <span style={{ minWidth: 28, fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right' }}>{event.minute}&apos;</span>
                            <span>🔄</span>
                            <span style={{ flex: 1 }}>
                              <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>↓ {getPlayerName(event.playerOutId)} </span>
                              <span style={{ color: 'var(--success)', fontSize: '0.75rem' }}>↑ {getPlayerName(event.playerInId)}</span>
                            </span>
                            <span style={{ fontSize: '0.7rem', color }}>{team?.name}</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* GOLES */}
          {activeTab === 'goals' && (
            <div>
              {isAdmin && (
                <div style={{ background: 'var(--bg-card2)', borderRadius: 10, padding: 14, marginBottom: 16, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary-light)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    ➕ Registrar gol
                  </div>
                  <div className="grid-2" style={{ marginBottom: 8 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Equipo</label>
                      <select className="form-input" value={newGoal.teamId} onChange={e => setNewGoal(g => ({ ...g, teamId: e.target.value, playerId: '' }))}>
                        <option value="">Seleccionar…</option>
                        <option value={home?.id}>{home?.name} (Local)</option>
                        <option value={away?.id}>{away?.name} (Visita)</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Jugador</label>
                      <select className="form-input" value={newGoal.playerId} onChange={e => setNewGoal(g => ({ ...g, playerId: e.target.value }))} disabled={!newGoal.teamId}>
                        <option value="">Seleccionar…</option>
                        {getTeamPlayers(newGoal.teamId).map(p => (
                          <option key={p.id} value={p.id}>{p.shirtNumber ? `#${p.shirtNumber} ` : ''}{p.firstName} {p.lastName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid-2">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Minuto</label>
                      <input type="number" min="1" max="120" className="form-input" placeholder="Ej: 45" value={newGoal.minute} onChange={e => setNewGoal(g => ({ ...g, minute: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Tipo</label>
                      <select className="form-input" value={newGoal.type} onChange={e => setNewGoal(g => ({ ...g, type: e.target.value }))}>
                        <option value="normal">Normal</option>
                        <option value="penalty">Penal</option>
                        <option value="autogol">Autogol</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={addGoal}
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: 10 }}
                    disabled={!newGoal.teamId || !newGoal.playerId || !newGoal.minute}
                  >
                    ⚽ Agregar gol
                  </button>
                </div>
              )}

              {planilla.goals.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '28px 0', fontSize: '0.85rem' }}>
                  Sin goles registrados
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[...planilla.goals].sort((a, b) => a.minute - b.minute).map(goal => {
                    const team = tournament.teams.find(t => t.id === goal.teamId);
                    const isHome = goal.teamId === home?.id;
                    const color = isHome ? homeColor : awayColor;
                    const shirt = getPlayerShirt(goal.teamId, goal.playerId);
                    return (
                      <div key={goal.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', background: 'var(--bg-card2)',
                        borderRadius: 8, border: '1px solid var(--border)',
                      }}>
                        <span style={{ fontSize: '1.3rem' }}>⚽</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            {shirt ? `#${shirt} ` : ''}{getPlayerName(goal.playerId)}
                            {goal.type !== 'normal' && (
                              <span style={{ marginLeft: 6, fontSize: '0.6rem', fontWeight: 800, color: goal.type === 'penalty' ? 'var(--warning)' : 'var(--danger)', background: goal.type === 'penalty' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)', padding: '1px 5px', borderRadius: 4 }}>
                                {goal.type === 'penalty' ? 'PENAL' : 'AUTOGOL'}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.7rem', color, fontWeight: 600, marginTop: 1 }}>{team?.name}</div>
                        </div>
                        <span style={{ fontWeight: 800, color: 'var(--primary-light)', fontSize: '0.95rem', flexShrink: 0 }}>{goal.minute}&apos;</span>
                        {isAdmin && (
                          <button onClick={() => removeGoal(goal.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem', padding: '0 4px', flexShrink: 0 }}>✕</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* CAMBIOS */}
          {activeTab === 'subs' && (
            <div>
              {isAdmin && (
                <div style={{ background: 'var(--bg-card2)', borderRadius: 10, padding: 14, marginBottom: 16, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary-light)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    ➕ Registrar cambio
                  </div>
                  <div className="form-group">
                    <label className="form-label">Equipo</label>
                    <select className="form-input" value={newSub.teamId} onChange={e => setNewSub(s => ({ ...s, teamId: e.target.value, playerOutId: '', playerInId: '' }))}>
                      <option value="">Seleccionar…</option>
                      <option value={home?.id}>{home?.name} (Local)</option>
                      <option value={away?.id}>{away?.name} (Visita)</option>
                    </select>
                  </div>
                  <div className="grid-2">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">↓ Sale</label>
                      <select className="form-input" value={newSub.playerOutId} onChange={e => setNewSub(s => ({ ...s, playerOutId: e.target.value }))} disabled={!newSub.teamId}>
                        <option value="">Jugador que sale…</option>
                        {getTeamPlayers(newSub.teamId).map(p => (
                          <option key={p.id} value={p.id}>{p.shirtNumber ? `#${p.shirtNumber} ` : ''}{p.firstName} {p.lastName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">↑ Entra</label>
                      <select className="form-input" value={newSub.playerInId} onChange={e => setNewSub(s => ({ ...s, playerInId: e.target.value }))} disabled={!newSub.teamId}>
                        <option value="">Jugador que entra…</option>
                        {getTeamPlayers(newSub.teamId)
                          .filter(p => p.id !== newSub.playerOutId)
                          .map(p => (
                            <option key={p.id} value={p.id}>{p.shirtNumber ? `#${p.shirtNumber} ` : ''}{p.firstName} {p.lastName}</option>
                          ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0, marginTop: 8 }}>
                    <label className="form-label">Minuto</label>
                    <input type="number" min="1" max="120" className="form-input" placeholder="Ej: 65" value={newSub.minute} onChange={e => setNewSub(s => ({ ...s, minute: e.target.value }))} />
                  </div>
                  <button
                    onClick={addSub}
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: 10 }}
                    disabled={!newSub.teamId || !newSub.playerOutId || !newSub.playerInId || !newSub.minute}
                  >
                    🔄 Agregar cambio
                  </button>
                </div>
              )}

              {planilla.substitutions.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '28px 0', fontSize: '0.85rem' }}>
                  Sin cambios registrados
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[...planilla.substitutions].sort((a, b) => a.minute - b.minute).map(sub => {
                    const team = tournament.teams.find(t => t.id === sub.teamId);
                    const isHome = sub.teamId === home?.id;
                    const color = isHome ? homeColor : awayColor;
                    return (
                      <div key={sub.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', background: 'var(--bg-card2)',
                        borderRadius: 8, border: '1px solid var(--border)',
                      }}>
                        <span style={{ fontSize: '1.3rem' }}>🔄</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 600 }}>↓ Sale: {getPlayerName(sub.playerOutId)}</span>
                            <span style={{ color: 'var(--success)', fontSize: '0.8rem', fontWeight: 600 }}>↑ Entra: {getPlayerName(sub.playerInId)}</span>
                          </div>
                          <div style={{ fontSize: '0.7rem', color, fontWeight: 600, marginTop: 2 }}>{team?.name}</div>
                        </div>
                        <span style={{ fontWeight: 800, color: 'var(--primary-light)', fontSize: '0.95rem', flexShrink: 0 }}>{sub.minute}&apos;</span>
                        {isAdmin && (
                          <button onClick={() => removeSub(sub.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem', padding: '0 4px', flexShrink: 0 }}>✕</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TARJETAS */}
          {activeTab === 'cards' && (
            <div>
              {isAdmin && (
                <div style={{ background: 'var(--bg-card2)', borderRadius: 10, padding: 14, marginBottom: 16, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary-light)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    ➕ Registrar amonestación
                  </div>
                  <div className="grid-2" style={{ marginBottom: 8 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Equipo</label>
                      <select className="form-input" value={newCard.teamId} onChange={e => setNewCard(c => ({ ...c, teamId: e.target.value, playerId: '' }))}>
                        <option value="">Seleccionar…</option>
                        <option value={home?.id}>{home?.name} (Local)</option>
                        <option value={away?.id}>{away?.name} (Visita)</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Jugador</label>
                      <select className="form-input" value={newCard.playerId} onChange={e => setNewCard(c => ({ ...c, playerId: e.target.value }))} disabled={!newCard.teamId}>
                        <option value="">Seleccionar…</option>
                        {getTeamPlayers(newCard.teamId).map(p => (
                          <option key={p.id} value={p.id}>{p.shirtNumber ? `#${p.shirtNumber} ` : ''}{p.firstName} {p.lastName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid-2">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Minuto</label>
                      <input type="number" min="1" max="120" className="form-input" placeholder="Ej: 55" value={newCard.minute} onChange={e => setNewCard(c => ({ ...c, minute: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Tipo de tarjeta</label>
                      <select className="form-input" value={newCard.type} onChange={e => setNewCard(c => ({ ...c, type: e.target.value }))}>
                        <option value="yellow">🟨 Amarilla</option>
                        <option value="red">🟥 Roja</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={addCard}
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: 10 }}
                    disabled={!newCard.teamId || !newCard.playerId || !newCard.minute}
                  >
                    🟨 Agregar amonestación
                  </button>
                </div>
              )}

              {planilla.cards.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '28px 0', fontSize: '0.85rem' }}>
                  Sin tarjetas registradas
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[...planilla.cards].sort((a, b) => a.minute - b.minute).map(card => {
                    const team = tournament.teams.find(t => t.id === card.teamId);
                    const isHome = card.teamId === home?.id;
                    const color = isHome ? homeColor : awayColor;
                    const shirt = getPlayerShirt(card.teamId, card.playerId);
                    const isYellow = card.type === 'yellow';
                    return (
                      <div key={card.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', background: 'var(--bg-card2)',
                        borderRadius: 8,
                        border: `1px solid ${isYellow ? 'rgba(245,158,11,0.35)' : 'rgba(239,68,68,0.35)'}`,
                      }}>
                        <span style={{ fontSize: '1.3rem' }}>{isYellow ? '🟨' : '🟥'}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            {shirt ? `#${shirt} ` : ''}{getPlayerName(card.playerId)}
                          </div>
                          <div style={{ fontSize: '0.7rem', marginTop: 1 }}>
                            <span style={{ color, fontWeight: 600 }}>{team?.name}</span>
                            <span style={{ color: isYellow ? 'var(--warning)' : 'var(--danger)', marginLeft: 6, fontWeight: 700, fontSize: '0.65rem' }}>
                              {isYellow ? 'AMARILLA' : 'ROJA'}
                            </span>
                          </div>
                        </div>
                        <span style={{ fontWeight: 800, color: 'var(--primary-light)', fontSize: '0.95rem', flexShrink: 0 }}>{card.minute}&apos;</span>
                        {isAdmin && (
                          <button onClick={() => removeCard(card.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem', padding: '0 4px', flexShrink: 0 }}>✕</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end', background: 'var(--bg)' }}>
          <button onClick={onClose} className="btn btn-secondary">Cerrar</button>
          {isAdmin && (
            <button onClick={savePlanilla} className="btn btn-primary">
              💾 Guardar planilla
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
