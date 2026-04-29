import { useState, useRef } from 'react';
import { useTournament, findAllEnrollments, getPaymentStatus } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { getInitials, getTeamColor, formatDate } from '../utils/helpers';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from 'recharts';

const EMPTY_FORM = { firstName: '', lastName: '', docNumber: '', birthDate: '', photo: null };
const EMPTY_STATS = { convocados: '', titulares: '', minutos: '', goles: '' };

/* ─── Photo Upload ─── */
function PhotoUpload({ value, onChange }) {
  const inputRef = useRef(null);
  function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Solo imágenes (JPG, PNG, WEBP).'); return; }
    if (file.size > 3 * 1024 * 1024) { alert('Máximo 3 MB.'); return; }
    const reader = new FileReader();
    reader.onload = e => onChange(e.target.result);
    reader.readAsDataURL(file);
  }
  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
      <div className={`photo-upload-area${value ? ' has-photo' : ''}`} onClick={() => inputRef.current.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}>
        {value ? (
          <><img src={value} className="photo-preview" alt="Foto" /><div style={{ fontSize: '0.78rem', color: 'var(--primary-light)', fontWeight: 600 }}>Haz clic para cambiar</div></>
        ) : (
          <><div style={{ fontSize: '2.2rem', marginBottom: 6 }}>📷</div><div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 3 }}>Subir foto</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Arrastra o haz clic · JPG, PNG · máx 3 MB</div></>
        )}
      </div>
      {value && <button type="button" className="btn btn-danger btn-sm" style={{ marginTop: 6, width: '100%' }} onClick={() => onChange(null)}>Quitar foto</button>}
    </div>
  );
}

/* ─── Helper: obtener stats de partidos para un jugador ─── */
function getPlayerMatchEvents(tournaments, playerId) {
  const goals = [];
  const cards = [];
  const subs = [];

  for (const tournament of tournaments) {
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

  return { goals, cards, subs };
}

/* ─── Player Profile Modal ─── */
function PlayerProfileModal({ player, enrollments, onClose, onEdit }) {
  const { state, dispatch } = useTournament();
  const { isAdmin } = useAuth();
  const [editingStats, setEditingStats] = useState(null); // { tournamentId, form }
  const [activeSection, setActiveSection] = useState('stats'); // 'stats' | 'events'

  const age = player.birthDate
    ? Math.floor((Date.now() - new Date(player.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  // Eventos de partido (goles, tarjetas, cambios) — calculado dinámicamente
  const { goals: matchGoals, cards: matchCards, subs: matchSubs } = getPlayerMatchEvents(state.tournaments, player.id);

  // Calcular stats por torneo
  const statsByTournament = enrollments.map(({ tournament, team, enrollment }) => {
    const saved = state.playerStats?.[player.id]?.[tournament.id] || {};
    // Goles desde partidos reales
    const realGoals = matchGoals.filter(g => g.tournament.id === tournament.id && g.type !== 'autogol').length;
    return {
      tournament,
      team,
      enrollment,
      convocados: Number(saved.convocados) || 0,
      titulares: Number(saved.titulares) || 0,
      minutos: Number(saved.minutos) || 0,
      goles: realGoals || Number(saved.goles) || 0,
    };
  });

  // Totales
  const totals = statsByTournament.reduce(
    (acc, s) => ({
      convocados: acc.convocados + s.convocados,
      titulares: acc.titulares + s.titulares,
      minutos: acc.minutos + s.minutos,
      goles: acc.goles + s.goles,
    }),
    { convocados: 0, titulares: 0, minutos: 0, goles: 0 }
  );

  const totalYellow = matchCards.filter(c => c.type === 'yellow').length;
  const totalRed = matchCards.filter(c => c.type === 'red').length;

  // Datos para radar chart (normalizados 0-100)
  const maxMinutos = 90 * Math.max(totals.titulares, 1);
  const radarData = [
    { stat: 'Convocatoria', value: totals.convocados > 0 ? Math.min(100, Math.round((totals.convocados / Math.max(totals.convocados, 1)) * 100)) : 0, fullMark: 100 },
    { stat: 'Titularidad', value: totals.convocados > 0 ? Math.min(100, Math.round((totals.titulares / totals.convocados) * 100)) : 0, fullMark: 100 },
    { stat: 'Minutos', value: Math.min(100, Math.round((totals.minutos / Math.max(maxMinutos, 1)) * 100)), fullMark: 100 },
    { stat: 'Goles', value: Math.min(100, totals.goles * 10), fullMark: 100 },
    { stat: 'Partidos', value: Math.min(100, totals.titulares * 5), fullMark: 100 },
  ];

  function saveStats(tournamentId, form) {
    dispatch({
      type: 'UPDATE_PLAYER_STATS',
      payload: {
        playerId: player.id,
        tournamentId,
        stats: {
          convocados: Number(form.convocados) || 0,
          titulares: Number(form.titulares) || 0,
          minutos: Number(form.minutos) || 0,
          goles: Number(form.goles) || 0,
        },
      },
    });
    setEditingStats(null);
  }

  return (
    <Modal
      title="Perfil del jugador"
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', gap: 8, width: '100%', justifyContent: 'space-between' }}>
          {isAdmin && <button className="btn btn-secondary" onClick={onEdit}>✏️ Editar datos</button>}
          <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
        </div>
      }
    >
      {/* ── Header jugador ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '14px 16px', background: 'var(--bg-card2)', borderRadius: 12, border: '1px solid var(--border)' }}>
        {player.photo
          ? <img src={player.photo} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)', flexShrink: 0 }} alt="" />
          : <div className="player-photo-placeholder" style={{ width: 72, height: 72, fontSize: '1.4rem', flexShrink: 0 }}>{getInitials(`${player.firstName} ${player.lastName}`) || '👤'}</div>
        }
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
            {player.firstName} {player.lastName}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
            {age !== null && <span className="pill">🎂 {age} años</span>}
            {player.docNumber && <span className="pill">📄 {player.docNumber}</span>}
            {enrollments.length > 0 && (
              <span className="pill" style={{ color: 'var(--primary-light)', background: 'rgba(132,204,22,0.1)' }}>
                ⚽ {enrollments.length} torneo{enrollments.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs de sección ── */}
      {(enrollments.length > 0 || matchGoals.length > 0 || matchCards.length > 0 || matchSubs.length > 0) && (
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
          {[
            { id: 'stats', label: '📊 Estadísticas' },
            { id: 'events', label: `⚽ Historial (${matchGoals.length + matchCards.length + matchSubs.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              style={{
                flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer',
                fontSize: '0.78rem', fontWeight: 700,
                background: activeSection === tab.id ? 'transparent' : 'transparent',
                color: activeSection === tab.id ? 'var(--primary-light)' : 'var(--text-muted)',
                borderBottom: activeSection === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >{tab.label}</button>
          ))}
        </div>
      )}

      {enrollments.length === 0 && matchGoals.length === 0 && matchCards.length === 0 && matchSubs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Sin inscripciones ni estadísticas disponibles.
        </div>
      ) : activeSection === 'events' ? (
        /* ── HISTORIAL DE PARTIDOS ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Resumen de tarjetas */}
          {(totalYellow > 0 || totalRed > 0) && (
            <div style={{ display: 'flex', gap: 8 }}>
              {totalYellow > 0 && (
                <div style={{ flex: 1, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem' }}>🟨</div>
                  <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--warning)', lineHeight: 1 }}>{totalYellow}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>Amarillas</div>
                </div>
              )}
              {totalRed > 0 && (
                <div style={{ flex: 1, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem' }}>🟥</div>
                  <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--danger)', lineHeight: 1 }}>{totalRed}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>Rojas</div>
                </div>
              )}
              {matchGoals.filter(g => g.type !== 'autogol').length > 0 && (
                <div style={{ flex: 1, background: 'rgba(132,204,22,0.08)', border: '1px solid rgba(132,204,22,0.25)', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem' }}>⚽</div>
                  <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--primary-light)', lineHeight: 1 }}>{matchGoals.filter(g => g.type !== 'autogol').length}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>Goles</div>
                </div>
              )}
              {matchSubs.length > 0 && (
                <div style={{ flex: 1, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem' }}>🔄</div>
                  <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--secondary)', lineHeight: 1 }}>{matchSubs.length}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2 }}>Cambios</div>
                </div>
              )}
            </div>
          )}

          {/* Goles */}
          {matchGoals.length > 0 && (
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>⚽ Goles marcados</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {matchGoals.map((g, i) => {
                  const opponentTeam = g.teamId === g.home?.id ? g.away : g.home;
                  const myTeam = g.teamId === g.home?.id ? g.home : g.away;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--bg-card2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span>⚽</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                          {g.tournament.name}
                          {g.type !== 'normal' && (
                            <span style={{ marginLeft: 6, fontSize: '0.6rem', fontWeight: 800, color: g.type === 'penalty' ? 'var(--warning)' : 'var(--danger)', background: g.type === 'penalty' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)', padding: '1px 5px', borderRadius: 4 }}>
                              {g.type === 'penalty' ? 'PEN' : 'AG'}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1 }}>
                          {g.home?.name} vs {g.away?.name} · R{g.match.round}
                        </div>
                      </div>
                      <span style={{ fontWeight: 800, color: 'var(--primary-light)', fontSize: '0.9rem', flexShrink: 0 }}>{g.minute}&apos;</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tarjetas */}
          {matchCards.length > 0 && (
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>🟨 Amonestaciones</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {matchCards.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--bg-card2)', borderRadius: 8, border: `1px solid ${c.type === 'yellow' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                    <span>{c.type === 'yellow' ? '🟨' : '🟥'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {c.tournament.name}
                        <span style={{ marginLeft: 6, fontSize: '0.6rem', fontWeight: 800, color: c.type === 'yellow' ? 'var(--warning)' : 'var(--danger)' }}>
                          {c.type === 'yellow' ? 'AMARILLA' : 'ROJA'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1 }}>
                        {c.home?.name} vs {c.away?.name} · R{c.match.round}
                      </div>
                    </div>
                    <span style={{ fontWeight: 800, color: 'var(--primary-light)', fontSize: '0.9rem', flexShrink: 0 }}>{c.minute}&apos;</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cambios */}
          {matchSubs.length > 0 && (
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>🔄 Cambios</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {matchSubs.map((s, i) => {
                  const entered = s.playerInId === player.id;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--bg-card2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span>🔄</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          <span style={{ color: entered ? 'var(--success)' : 'var(--danger)' }}>
                            {entered ? '↑ Entró' : '↓ Salió'}
                          </span>
                          <span style={{ color: 'var(--text-muted)', marginLeft: 4, fontWeight: 400, fontSize: '0.72rem' }}>— {s.tournament.name}</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1 }}>
                          {s.home?.name} vs {s.away?.name} · R{s.match.round}
                        </div>
                      </div>
                      <span style={{ fontWeight: 800, color: 'var(--primary-light)', fontSize: '0.9rem', flexShrink: 0 }}>{s.minute}&apos;</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {matchGoals.length === 0 && matchCards.length === 0 && matchSubs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Sin eventos registrados en partidos aún.
            </div>
          )}
        </div>
      ) : (
        <>
          {/* ── Radar Chart ── */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              📊 Mapa de rendimiento
            </div>
            <div style={{ background: 'var(--bg-card2)', borderRadius: 12, border: '1px solid var(--border)', padding: '12px 8px' }}>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="stat" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }} />
                  <Radar name="Rendimiento" dataKey="value" stroke="#84cc16" fill="#84cc16" fillOpacity={0.25} strokeWidth={2} />
                  <Tooltip
                    contentStyle={{ background: '#111713', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.8rem' }}
                    formatter={(v) => [`${v}%`, 'Rendimiento']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Tarjetas resumen totales ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
            {[
              { label: 'Convocado', value: totals.convocados, icon: '📋', color: 'var(--primary-light)' },
              { label: 'Titular', value: totals.titulares, icon: '⚽', color: 'var(--secondary)' },
              { label: 'Minutos', value: totals.minutos, icon: '⏱️', color: 'var(--accent)' },
              { label: 'Goles', value: totals.goles, icon: '🥅', color: 'var(--danger)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', marginBottom: 2 }}>{s.icon}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Tabla por torneo ── */}
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
            📅 Historial por torneo
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {statsByTournament.map(s => (
              <div key={s.tournament.id} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{s.tournament.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {s.team.name}
                      {s.enrollment.shirtNumber && <span style={{ color: 'var(--primary-light)', fontWeight: 700, marginLeft: 6 }}>#{s.enrollment.shirtNumber}</span>}
                    </div>
                  </div>
                  {isAdmin && (
                    editingStats?.tournamentId === s.tournament.id ? null : (
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditingStats({
                        tournamentId: s.tournament.id,
                        form: { convocados: s.convocados || '', titulares: s.titulares || '', minutos: s.minutos || '', goles: s.goles || '' },
                      })}>
                        ✏️ Editar stats
                      </button>
                    )
                  )}
                </div>

                {/* Edición de stats */}
                {editingStats?.tournamentId === s.tournament.id ? (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 10 }}>
                      {[
                        { key: 'convocados', label: '📋 Convocado', placeholder: '0' },
                        { key: 'titulares', label: '⚽ Titular', placeholder: '0' },
                        { key: 'minutos', label: '⏱️ Minutos', placeholder: '0' },
                        { key: 'goles', label: '🥅 Goles', placeholder: '0' },
                      ].map(f => (
                        <div key={f.key}>
                          <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 3 }}>{f.label}</label>
                          <input
                            type="number" min="0" className="form-input"
                            style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                            placeholder={f.placeholder}
                            value={editingStats.form[f.key]}
                            onChange={e => setEditingStats(prev => ({ ...prev, form: { ...prev.form, [f.key]: e.target.value } }))}
                          />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => saveStats(s.tournament.id, editingStats.form)}>✓ Guardar</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditingStats(null)}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                    {[
                      { label: 'Convoc.', value: s.convocados, color: 'var(--primary-light)' },
                      { label: 'Titular', value: s.titulares, color: 'var(--secondary)' },
                      { label: 'Minutos', value: s.minutos, color: 'var(--accent)' },
                      { label: 'Goles', value: s.goles, color: 'var(--danger)' },
                    ].map(stat => (
                      <div key={stat.label} style={{ background: 'var(--bg-card)', borderRadius: 7, padding: '6px 4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}

/* ─── Player row ─── */
function PlayerRow({ player, enrollments, onDelete, onEdit, onView }) {
  const age = player.birthDate
    ? Math.floor((Date.now() - new Date(player.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <tr style={{ cursor: 'pointer' }} onClick={onView}>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {player.photo
            ? <img src={player.photo} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} alt="" />
            : <div className="player-photo-placeholder" style={{ width: 38, height: 38, fontSize: '0.85rem' }}>{getInitials(`${player.firstName} ${player.lastName}`) || '👤'}</div>
          }
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              {player.firstName} {player.lastName}
            </div>
            {player.docNumber && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Doc: {player.docNumber}</div>}
          </div>
        </div>
      </td>
      <td style={{ fontSize: '0.82rem' }}>{age !== null ? `${age} años` : '—'}{player.birthDate && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatDate(player.birthDate)}</div>}</td>
      <td>
        {enrollments.length === 0
          ? <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sin inscripción</span>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {enrollments.map(({ tournament, team, enrollment }) => (
                <div key={enrollment.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="team-avatar" style={{ width: 22, height: 22, fontSize: '0.6rem', fontWeight: 800, background: getTeamColor(team.colorIndex) + '33', color: getTeamColor(team.colorIndex) }}>
                    {getInitials(team.name)}
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{team.name}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>·</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{tournament.name}</span>
                </div>
              ))}
            </div>
        }
      </td>
      <td>
        {enrollments.length === 0
          ? <span className="badge badge-finished">Libre</span>
          : enrollments.map(({ enrollment }) => {
              const status = getPaymentStatus(enrollment.payment);
              return (
                <span key={enrollment.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, background: status.color + '22', color: status.color, border: `1px solid ${status.color}44` }}>
                  {status.pct === 100 ? '✓' : '○'} {status.label}
                </span>
              );
            })
        }
      </td>
      <td onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" title="Ver perfil" onClick={onView}>👤</button>
          <AdminPlayerActions player={player} enrollments={enrollments} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </td>
    </tr>
  );
}

function AdminPlayerActions({ player, enrollments, onEdit, onDelete }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return null;
  return (
    <>
      <button className="btn btn-ghost btn-sm btn-icon" onClick={e => { e.stopPropagation(); onEdit(player); }} title="Editar">✏️</button>
      {enrollments.length === 0 && (
        <button className="btn btn-danger btn-sm btn-icon" onClick={e => { e.stopPropagation(); onDelete(player.id); }} title="Eliminar">🗑</button>
      )}
    </>
  );
}

/* ─── Main Page ─── */
export default function Players() {
  const { state, dispatch } = useTournament();
  const { isAdmin } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewPlayer, setViewPlayer] = useState(null);

  const filtered = (state.globalPlayers || []).filter(p => {
    const name = `${p.firstName} ${p.lastName} ${p.docNumber}`.toLowerCase();
    if (!name.includes(search.toLowerCase())) return false;
    if (filterStatus === 'enrolled') {
      return findAllEnrollments(state.tournaments, p.id).length > 0;
    }
    if (filterStatus === 'free') {
      return findAllEnrollments(state.tournaments, p.id).length === 0;
    }
    return true;
  });

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditPlayer(null);
    setShowModal(true);
  }

  function openEdit(player) {
    setForm({ firstName: player.firstName, lastName: player.lastName, docNumber: player.docNumber, birthDate: player.birthDate, photo: player.photo });
    setEditPlayer(player);
    setShowModal(true);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    if (editPlayer) {
      dispatch({ type: 'UPDATE_GLOBAL_PLAYER', payload: { id: editPlayer.id, data: form } });
    } else {
      dispatch({ type: 'ADD_GLOBAL_PLAYER', payload: form });
    }
    setShowModal(false);
  }

  function handleDelete(id) {
    dispatch({ type: 'DELETE_GLOBAL_PLAYER', payload: id });
    setDeleteConfirm(null);
  }

  const totalEnrolled = (state.globalPlayers || []).filter(p => findAllEnrollments(state.tournaments, p.id).length > 0).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Lista de Jugadores</div>
          <div className="page-subtitle">
            {state.globalPlayers.length} jugadores · {totalEnrolled} inscritos en equipos
          </div>
        </div>
        {isAdmin && <button className="btn btn-primary btn-lg" onClick={openCreate}>+ Nuevo jugador</button>}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200, maxWidth: 360 }}>
          <span className="search-icon">🔍</span>
          <input className="form-input" placeholder="Buscar por nombre o documento…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ minWidth: 160 }}>
          <option value="all">Todos</option>
          <option value="free">Libres (sin equipo)</option>
          <option value="enrolled">Inscritos en equipo</option>
        </select>
      </div>

      {state.globalPlayers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <h3>Sin jugadores registrados</h3>
          <p>Crea jugadores aquí para luego inscribirlos en los equipos de cada torneo.</p>
          {isAdmin && <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={openCreate}>+ Crear primer jugador</button>}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>Sin resultados</h3>
          <p>Prueba con otro filtro o búsqueda.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Jugador</th>
                <th>Edad / Nacimiento</th>
                <th>Equipo / Torneo</th>
                <th>Estado de pago</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(player => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  enrollments={findAllEnrollments(state.tournaments, player.id)}
                  onDelete={id => setDeleteConfirm(id)}
                  onEdit={openEdit}
                  onView={() => setViewPlayer(player)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Player profile modal */}
      {viewPlayer && (
        <PlayerProfileModal
          player={viewPlayer}
          enrollments={findAllEnrollments(state.tournaments, viewPlayer.id)}
          onClose={() => setViewPlayer(null)}
          onEdit={() => { openEdit(viewPlayer); setViewPlayer(null); }}
        />
      )}

      {/* Create / Edit modal */}
      {showModal && (
        <Modal
          title={editPlayer ? 'Editar jugador' : 'Nuevo jugador'}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{editPlayer ? 'Guardar cambios' : 'Crear jugador'}</button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Foto</label>
              <PhotoUpload value={form.photo} onChange={photo => setForm(f => ({ ...f, photo }))} />
            </div>
            <div className="divider" />
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input className="form-input" placeholder="Ej: Carlos" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Apellido *</label>
                <input className="form-input" placeholder="Ej: García" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} required />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Número de documento</label>
                <input className="form-input" placeholder="Ej: 12345678" value={form.docNumber} onChange={e => setForm(f => ({ ...f, docNumber: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha de nacimiento</label>
                <input type="date" className="form-input" value={form.birthDate} onChange={e => setForm(f => ({ ...f, birthDate: e.target.value }))} />
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <Modal
          title="Eliminar jugador"
          onClose={() => setDeleteConfirm(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Eliminar</button>
            </>
          }
        >
          <p style={{ color: 'var(--text-secondary)' }}>
            ¿Eliminar este jugador del registro? Esta acción no puede deshacerse.
          </p>
        </Modal>
      )}
    </div>
  );
}
