import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import TournamentShieldThumb from '../components/TournamentShieldThumb';
import { calcStandings, getTeamColor, getInitials } from '../utils/helpers';

function MiniBar({ value, max, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 60, background: 'var(--bg-card2)', borderRadius: 99, height: 5, overflow: 'hidden', flex: '0 0 60px' }}>
        <div
          style={{
            width: `${max > 0 ? (value / max) * 100 : 0}%`,
            height: '100%',
            background: color,
            borderRadius: 99,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

export default function Standings() {
  const { activeTournament, state } = useTournament();

  const standings = useMemo(() => {
    if (!activeTournament) return [];
    return calcStandings(activeTournament.teams, activeTournament.matches);
  }, [activeTournament]);

  if (!activeTournament) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🏆</div>
        <h3>Sin torneo activo</h3>
        <Link to="/torneos" className="btn btn-primary" style={{ marginTop: 20 }}>Ir a Torneos</Link>
      </div>
    );
  }

  if (activeTournament.type !== 'league') {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🎯</div>
        <h3>Este torneo es de eliminación directa</h3>
        <p>La tabla de posiciones es solo para torneos de liga.</p>
        <Link to="/bracket" className="btn btn-primary" style={{ marginTop: 20 }}>Ver Bracket</Link>
      </div>
    );
  }

  if (activeTournament.teams.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">👥</div>
        <h3>Sin equipos</h3>
        <p>Agrega equipos al torneo para ver la tabla.</p>
        <Link to="/equipos" className="btn btn-primary" style={{ marginTop: 20 }}>Agregar equipos</Link>
      </div>
    );
  }

  const maxPts = Math.max(...standings.map(r => r.pts), 1);
  const maxGf = Math.max(...standings.map(r => r.gf), 1);
  const tournIdx = Math.max(0, state.tournaments.findIndex(t => t.id === activeTournament.id));

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <TournamentShieldThumb shield={activeTournament.shield} sport={activeTournament.sport} colorIndex={tournIdx} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="page-title">Tabla de Posiciones</div>
            <div className="page-subtitle">{activeTournament.name}</div>
          </div>
        </div>
      </div>

      {/* Leader card */}
      {standings.length > 0 && standings[0].pj > 0 && (
        <div
          className="card mb-24"
          style={{
            background: `linear-gradient(135deg, ${getTeamColor(standings[0].team.colorIndex)}22, var(--bg-card))`,
            borderColor: getTeamColor(standings[0].team.colorIndex) + '44',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              fontSize: '2rem', width: 56, height: 56,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              🥇
            </div>
            {standings[0].team.shield ? (
              <img src={standings[0].team.shield} alt="" style={{ width: 56, height: 56, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }} />
            ) : (
              <div className="team-avatar" style={{ width: 56, height: 56, fontSize: '1.1rem', fontWeight: 800, background: getTeamColor(standings[0].team.colorIndex) + '33', color: getTeamColor(standings[0].team.colorIndex) }}>
                {getInitials(standings[0].team.name)}
              </div>
            )}
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {standings[0].team.name}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Líder · {standings[0].pts} puntos · {standings[0].pj} partidos jugados
              </div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: getTeamColor(standings[0].team.colorIndex) }}>
                {standings[0].pts}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>PTS</div>
            </div>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th>Equipo</th>
              <th title="Partidos jugados">PJ</th>
              <th title="Partidos ganados" style={{ color: 'var(--success)' }}>G</th>
              <th title="Partidos empatados" style={{ color: 'var(--warning)' }}>E</th>
              <th title="Partidos perdidos" style={{ color: 'var(--danger)' }}>P</th>
              <th title="Goles a favor">GF</th>
              <th title="Goles en contra">GC</th>
              <th title="Diferencia de goles">DG</th>
              <th>Puntos</th>
              <th>Forma</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, i) => {
              const color = getTeamColor(row.team.colorIndex);

              const lastMatches = activeTournament.matches
                .filter(m => m.status === 'finished' && (m.homeId === row.team.id || m.awayId === row.team.id))
                .slice(-5);

              const forma = lastMatches.map(m => {
                const isHome = m.homeId === row.team.id;
                const myG = isHome ? Number(m.homeScore) : Number(m.awayScore);
                const theirG = isHome ? Number(m.awayScore) : Number(m.homeScore);
                if (myG > theirG) return 'G';
                if (myG === theirG) return 'E';
                return 'P';
              });

              const formaColors = { G: 'var(--success)', E: 'var(--warning)', P: 'var(--danger)' };

              return (
                <tr key={row.team.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {i === 0 && <span>🥇</span>}
                      {i === 1 && <span>🥈</span>}
                      {i === 2 && <span>🥉</span>}
                      {i > 2 && <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{i + 1}</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {row.team.shield ? (
                        <img src={row.team.shield} alt="" style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.4))' }} />
                      ) : (
                        <div className="team-avatar" style={{ background: color + '22', color, fontSize: '0.72rem', fontWeight: 800 }}>
                          {getInitials(row.team.name)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                          {row.team.name}
                        </div>
                        {row.team.city && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{row.team.city}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{row.pj}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 700 }}>{row.pg}</td>
                  <td style={{ color: 'var(--warning)', fontWeight: 700 }}>{row.pe}</td>
                  <td style={{ color: 'var(--danger)', fontWeight: 700 }}>{row.pp}</td>
                  <td>{row.gf}</td>
                  <td>{row.gc}</td>
                  <td style={{ fontWeight: 600, color: row.dg > 0 ? 'var(--success)' : row.dg < 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                    {row.dg > 0 ? '+' : ''}{row.dg}
                  </td>
                  <td>
                    <MiniBar value={row.pts} max={maxPts} color={color} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {forma.map((f, j) => (
                        <div
                          key={j}
                          style={{
                            width: 18, height: 18, borderRadius: '50%',
                            background: formaColors[f],
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.55rem', fontWeight: 800, color: '#fff',
                          }}
                          title={f === 'G' ? 'Victoria' : f === 'E' ? 'Empate' : 'Derrota'}
                        >
                          {f}
                        </div>
                      ))}
                      {forma.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          PJ = Partidos Jugados · G = Ganados · E = Empatados · P = Perdidos · GF = Goles a Favor · GC = Goles en Contra · DG = Diferencia de Goles
        </span>
      </div>
    </div>
  );
}
