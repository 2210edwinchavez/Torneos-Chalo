import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import TournamentShieldThumb from '../components/TournamentShieldThumb';
import { getTeamColor, getInitials, getRoundName } from '../utils/helpers';

function BracketMatch({ match, teams, onEdit }) {
  const home = teams.find(t => t.id === match.homeId);
  const away = teams.find(t => t.id === match.awayId);

  const homeWins = match.status === 'finished' && Number(match.homeScore) > Number(match.awayScore);
  const awayWins = match.status === 'finished' && Number(match.awayScore) > Number(match.homeScore);

  function TeamRow({ team, score, isWinner }) {
    const color = getTeamColor(team?.colorIndex ?? 0);
    return (
      <button
        className={`bracket-team${isWinner ? ' winner' : ''}`}
        onClick={() => onEdit(match)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
          {team ? (
            <>
              <div
                style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: color + '33', color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.6rem', fontWeight: 800,
                }}
              >
                {getInitials(team.name)}
              </div>
              <span style={{
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                fontWeight: isWinner ? 700 : 500,
              }}>
                {team.name}
              </span>
            </>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.78rem' }}>
              Por definir
            </span>
          )}
        </div>
        <span className="bracket-score" style={{ color: isWinner ? 'var(--success)' : 'var(--text-muted)' }}>
          {score !== null && score !== undefined ? score : '—'}
        </span>
      </button>
    );
  }

  return (
    <div className="bracket-match">
      <TeamRow team={home} score={match.homeScore} isWinner={homeWins} />
      <TeamRow team={away} score={match.awayScore} isWinner={awayWins} />
    </div>
  );
}

export default function Bracket() {
  const { activeTournament, dispatch, state } = useTournament();
  const { isAdmin } = useAuth();
  const [editMatch, setEditMatch] = useState(null);
  const [scores, setScores] = useState({ home: '', away: '' });

  if (!activeTournament) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🎯</div>
        <h3>Sin torneo activo</h3>
        <Link to="/torneos" className="btn btn-primary" style={{ marginTop: 20 }}>Ir a Torneos</Link>
      </div>
    );
  }

  if (activeTournament.type !== 'knockout') {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📋</div>
        <h3>Este torneo es de formato liga</h3>
        <p>El bracket solo está disponible para torneos de eliminación directa.</p>
        <Link to="/posiciones" className="btn btn-primary" style={{ marginTop: 20 }}>Ver Posiciones</Link>
      </div>
    );
  }

  const rounds = useMemo(() => {
    const roundNums = [...new Set(activeTournament.matches.map(m => m.round))].sort((a, b) => a - b);
    const totalRounds = roundNums.length;
    return roundNums.map(r => ({
      round: r,
      name: getRoundName(r, totalRounds),
      matches: activeTournament.matches
        .filter(m => m.round === r)
        .sort((a, b) => (a.bracketSlot ?? 0) - (b.bracketSlot ?? 0)),
    }));
  }, [activeTournament.matches]);

  function openEdit(match) {
    setEditMatch(match);
    setScores({ home: match.homeScore ?? '', away: match.awayScore ?? '' });
  }

  function saveResult() {
    const isFinished = scores.home !== '' && scores.away !== '';
    if (isFinished && Number(scores.home) === Number(scores.away)) {
      alert('En eliminación directa no puede haber empate. Ingresa un marcador diferente.');
      return;
    }
    dispatch({
      type: 'UPDATE_MATCH',
      payload: {
        tournamentId: activeTournament.id,
        matchId: editMatch.id,
        data: {
          homeScore: isFinished ? Number(scores.home) : null,
          awayScore: isFinished ? Number(scores.away) : null,
          status: isFinished ? 'finished' : 'scheduled',
        },
      },
    });
    setEditMatch(null);
  }

  if (activeTournament.matches.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🎯</div>
        <h3>Sin bracket generado</h3>
        <p>Ve a la sección de Partidos y genera el bracket automáticamente.</p>
        <Link to="/partidos" className="btn btn-primary" style={{ marginTop: 20 }}>Ir a Partidos</Link>
      </div>
    );
  }

  const played = activeTournament.matches.filter(m => m.status === 'finished').length;
  const total = activeTournament.matches.length;
  const tournIdx = Math.max(0, state.tournaments.findIndex(t => t.id === activeTournament.id));

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <TournamentShieldThumb
            shield={activeTournament.shield}
            sport={activeTournament.sport}
            colorIndex={tournIdx}
            size={44}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="page-title">Bracket</div>
            <div className="page-subtitle">
              {activeTournament.name} · {played}/{total} partidos jugados
            </div>
          </div>
        </div>
        <Link to="/partidos" className="btn btn-secondary">
          ← Ver fixture lista
        </Link>
      </div>

      <div className="card mb-24" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Progreso del bracket
          </span>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {played}/{total} ({Math.round((played / total) * 100)}%)
          </span>
        </div>
        <div style={{ background: 'var(--bg-card2)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, var(--danger), var(--accent))',
            borderRadius: 99,
            width: `${(played / total) * 100}%`,
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      <div className="bracket-container">
        <div className="bracket-rounds">
          {rounds.map(({ round, name, matches }) => (
            <div key={round} className="bracket-round">
              <div className="bracket-round-title">{name}</div>
              <div className="bracket-matches">
                {matches.map(match => (
                  <BracketMatch
                    key={match.id}
                    match={match}
                    teams={activeTournament.teams}
                    onEdit={isAdmin ? openEdit : () => {}}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        💡 Haz clic en cualquier partido para registrar el resultado.
      </div>

      {editMatch && (() => {
        const home = activeTournament.teams.find(t => t.id === editMatch.homeId);
        const away = activeTournament.teams.find(t => t.id === editMatch.awayId);
        return (
          <Modal
            title="Registrar resultado"
            onClose={() => setEditMatch(null)}
            footer={
              <>
                <button className="btn btn-secondary" onClick={() => setEditMatch(null)}>Cancelar</button>
                <button className="btn btn-success" onClick={saveResult}>Guardar</button>
              </>
            }
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 20, marginBottom: 20, padding: '12px 0',
            }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{home?.name ?? '—'}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Local</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="number" min="0" max="99"
                  className="form-input"
                  value={scores.home}
                  onChange={e => setScores(s => ({ ...s, home: e.target.value }))}
                  style={{ width: 64, textAlign: 'center', fontSize: '1.4rem', fontWeight: 700 }}
                  placeholder="0"
                />
                <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>—</span>
                <input
                  type="number" min="0" max="99"
                  className="form-input"
                  value={scores.away}
                  onChange={e => setScores(s => ({ ...s, away: e.target.value }))}
                  style={{ width: 64, textAlign: 'center', fontSize: '1.4rem', fontWeight: 700 }}
                  placeholder="0"
                />
              </div>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{away?.name ?? '—'}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Visita</div>
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              No se permiten empates en eliminación directa.
            </p>
          </Modal>
        );
      })()}
    </div>
  );
}
