import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import {
  generateLeagueFixtures,
  generateKnockoutBracket,
  getTeamColor,
  getInitials,
  formatDate,
  generateId,
} from '../utils/helpers';

function ScoreInput({ value, onChange, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</label>
      <input
        type="number"
        min="0"
        max="99"
        className="form-input"
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        style={{ width: 64, textAlign: 'center', fontSize: '1.4rem', fontWeight: 700, padding: '6px 4px' }}
      />
    </div>
  );
}

function MatchRow({ match, teams, onEdit, onDelete, isAdmin }) {
  const home = teams.find(t => t.id === match.homeId);
  const away = teams.find(t => t.id === match.awayId);
  if (!home || !away) return null;

  const homeColor = getTeamColor(home.colorIndex);
  const awayColor = getTeamColor(away.colorIndex);

  return (
    <div className="match-card">
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 48, textAlign: 'center' }}>
        {match.date ? formatDate(match.date) : 'Sin fecha'}
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
          R{match.round || '?'}
        </div>
      </div>

      <div className="match-teams">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          {home.shield
            ? <img src={home.shield} alt="" style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.4))' }} />
            : <div className="team-avatar" style={{ background: homeColor + '22', color: homeColor, fontSize: '0.75rem' }}>{getInitials(home.name)}</div>
          }
          <span
            className="match-team-name"
            style={{ color: match.status === 'finished' && Number(match.homeScore) > Number(match.awayScore) ? 'var(--success)' : undefined }}
          >
            {home.name}
          </span>
        </div>

        <div className="match-score-box">
          {match.status === 'finished' ? (
            <>
              <span style={{ color: 'var(--text-primary)' }}>{match.homeScore}</span>
              <span className="match-score-sep">—</span>
              <span style={{ color: 'var(--text-primary)' }}>{match.awayScore}</span>
            </>
          ) : (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>vs</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
          <span
            className="match-team-name"
            style={{
              textAlign: 'right',
              color: match.status === 'finished' && Number(match.awayScore) > Number(match.homeScore) ? 'var(--success)' : undefined,
            }}
          >
            {away.name}
          </span>
          {away.shield
            ? <img src={away.shield} alt="" style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.4))' }} />
            : <div className="team-avatar" style={{ background: awayColor + '22', color: awayColor, fontSize: '0.75rem' }}>{getInitials(away.name)}</div>
          }
        </div>
      </div>

      <span className={`badge ${match.status === 'finished' ? 'badge-active' : 'badge-pending'}`}>
        {match.status === 'finished' ? 'Final' : 'Pendiente'}
      </span>

      {isAdmin && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => onEdit(match)} title="Editar resultado">✏️</button>
          <button className="btn btn-danger btn-sm btn-icon" onClick={() => onDelete(match.id)} title="Eliminar">🗑</button>
        </div>
      )}
    </div>
  );
}

export default function Fixtures() {
  const { activeTournament, dispatch } = useTournament();
  const { isAdmin } = useAuth();
  const [editMatch, setEditMatch] = useState(null);
  const [editScores, setEditScores] = useState({ home: '', away: '', date: '' });
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [addForm, setAddForm] = useState({ homeId: '', awayId: '', date: '', round: 1 });
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRound, setFilterRound] = useState('all');

  if (!activeTournament) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📅</div>
        <h3>Sin torneo activo</h3>
        <Link to="/torneos" className="btn btn-primary" style={{ marginTop: 20 }}>Ir a Torneos</Link>
      </div>
    );
  }

  function generateFixture() {
    if (activeTournament.teams.length < 2) {
      alert('Necesitas al menos 2 equipos para generar el fixture.');
      return;
    }
    if (activeTournament.matches.length > 0) {
      if (!confirm('¿Deseas regenerar el fixture? Se borrarán todos los partidos actuales.')) return;
    }
    const matches =
      activeTournament.type === 'league'
        ? generateLeagueFixtures(activeTournament.teams)
        : generateKnockoutBracket(activeTournament.teams);
    dispatch({ type: 'SET_MATCHES', payload: { tournamentId: activeTournament.id, matches } });
  }

  function openEdit(match) {
    setEditMatch(match);
    setEditScores({
      home: match.homeScore ?? '',
      away: match.awayScore ?? '',
      date: match.date || '',
    });
  }

  function saveResult() {
    const isFinished = editScores.home !== '' && editScores.away !== '';
    dispatch({
      type: 'UPDATE_MATCH',
      payload: {
        tournamentId: activeTournament.id,
        matchId: editMatch.id,
        data: {
          homeScore: isFinished ? Number(editScores.home) : null,
          awayScore: isFinished ? Number(editScores.away) : null,
          status: isFinished ? 'finished' : 'scheduled',
          date: editScores.date,
        },
      },
    });
    setEditMatch(null);
  }

  function handleAddMatch(e) {
    e.preventDefault();
    if (!addForm.homeId || !addForm.awayId) return;
    dispatch({
      type: 'ADD_MATCH',
      payload: {
        tournamentId: activeTournament.id,
        match: {
          round: Number(addForm.round) || 1,
          homeId: addForm.homeId,
          awayId: addForm.awayId,
          homeScore: null,
          awayScore: null,
          status: 'scheduled',
          date: addForm.date || '',
        },
      },
    });
    setAddForm({ homeId: '', awayId: '', date: '', round: 1 });
    setShowAddMatch(false);
  }

  function deleteMatch(matchId) {
    if (!confirm('¿Eliminar este partido?')) return;
    dispatch({
      type: 'DELETE_MATCH',
      payload: { tournamentId: activeTournament.id, matchId },
    });
  }

  const rounds = [...new Set(activeTournament.matches.map(m => m.round))].sort((a, b) => a - b);

  const filtered = activeTournament.matches.filter(m => {
    if (filterStatus !== 'all' && m.status !== filterStatus) return false;
    if (filterRound !== 'all' && String(m.round) !== String(filterRound)) return false;
    return true;
  });

  const played = activeTournament.matches.filter(m => m.status === 'finished').length;
  const total = activeTournament.matches.length;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Partidos</div>
          <div className="page-subtitle">
            {activeTournament.name} · {played}/{total} partidos jugados
          </div>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={() => setShowAddMatch(true)}>+ Partido manual</button>
            <button className="btn btn-primary btn-lg" onClick={generateFixture}>
              ⚡ {activeTournament.matches.length > 0 ? 'Regenerar fixture' : 'Generar fixture'}
            </button>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="card mb-24" style={{ padding: '14px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Progreso del torneo
            </span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {played} de {total} ({Math.round((played / total) * 100)}%)
            </span>
          </div>
          <div style={{ background: 'var(--bg-card2)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                borderRadius: 99,
                width: `${(played / total) * 100}%`,
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      {total > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select
              className="form-input"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{ minWidth: 140 }}
            >
              <option value="all">Todos los estados</option>
              <option value="scheduled">Pendientes</option>
              <option value="finished">Finalizados</option>
            </select>
          </div>
          {rounds.length > 1 && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <select
                className="form-input"
                value={filterRound}
                onChange={e => setFilterRound(e.target.value)}
                style={{ minWidth: 120 }}
              >
                <option value="all">Todas las rondas</option>
                {rounds.map(r => <option key={r} value={r}>Ronda {r}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <h3>{total === 0 ? 'Sin partidos generados' : 'Sin partidos para este filtro'}</h3>
          <p>
            {total === 0
              ? 'Agrega equipos y genera el fixture automáticamente.'
              : 'Prueba cambiando los filtros.'}
          </p>
          {total === 0 && activeTournament.teams.length >= 2 && isAdmin && (
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={generateFixture}>
              ⚡ Generar fixture
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rounds
            .filter(r => filterRound === 'all' || String(r) === String(filterRound))
            .map(round => {
              const roundMatches = filtered.filter(m => m.round === round);
              if (roundMatches.length === 0) return null;
              return (
                <div key={round}>
                  <div style={{
                    fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    padding: '6px 0', marginBottom: 6,
                  }}>
                    Ronda {round}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {roundMatches.map(m => (
                        <MatchRow
                          key={m.id}
                          match={m}
                          teams={activeTournament.teams}
                          onEdit={openEdit}
                          onDelete={deleteMatch}
                          isAdmin={isAdmin}
                        />
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Edit result modal */}
      {editMatch && (
        <Modal
          title="Registrar resultado"
          onClose={() => setEditMatch(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setEditMatch(null)}>Cancelar</button>
              <button className="btn btn-success" onClick={saveResult}>Guardar resultado</button>
            </>
          }
        >
          {(() => {
            const home = activeTournament.teams.find(t => t.id === editMatch.homeId);
            const away = activeTournament.teams.find(t => t.id === editMatch.awayId);
            return (
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 20, marginBottom: 24, padding: '16px 0',
                }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div
                      className="team-avatar"
                      style={{
                        width: 48, height: 48, margin: '0 auto 8px',
                        background: getTeamColor(home?.colorIndex) + '22',
                        color: getTeamColor(home?.colorIndex), fontSize: '1rem',
                      }}
                    >
                      {getInitials(home?.name)}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{home?.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Local</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <ScoreInput value={editScores.home} onChange={v => setEditScores(s => ({ ...s, home: v }))} label="Local" />
                    <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginTop: 16 }}>—</span>
                    <ScoreInput value={editScores.away} onChange={v => setEditScores(s => ({ ...s, away: v }))} label="Visita" />
                  </div>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div
                      className="team-avatar"
                      style={{
                        width: 48, height: 48, margin: '0 auto 8px',
                        background: getTeamColor(away?.colorIndex) + '22',
                        color: getTeamColor(away?.colorIndex), fontSize: '1rem',
                      }}
                    >
                      {getInitials(away?.name)}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{away?.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Visita</div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha del partido</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editScores.date}
                    onChange={e => setEditScores(s => ({ ...s, date: e.target.value }))}
                  />
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Deja los marcadores vacíos para marcarlo como pendiente.
                </p>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Add match manual */}
      {showAddMatch && (
        <Modal
          title="Agregar partido manual"
          onClose={() => setShowAddMatch(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowAddMatch(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAddMatch}>Agregar</button>
            </>
          }
        >
          <form onSubmit={handleAddMatch}>
            <div className="form-group">
              <label className="form-label">Equipo local *</label>
              <select
                className="form-input"
                value={addForm.homeId}
                onChange={e => setAddForm(f => ({ ...f, homeId: e.target.value }))}
                required
              >
                <option value="">Seleccionar equipo…</option>
                {activeTournament.teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Equipo visita *</label>
              <select
                className="form-input"
                value={addForm.awayId}
                onChange={e => setAddForm(f => ({ ...f, awayId: e.target.value }))}
                required
              >
                <option value="">Seleccionar equipo…</option>
                {activeTournament.teams
                  .filter(t => t.id !== addForm.homeId)
                  .map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Ronda</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={addForm.round}
                  onChange={e => setAddForm(f => ({ ...f, round: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha</label>
                <input
                  type="date"
                  className="form-input"
                  value={addForm.date}
                  onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
