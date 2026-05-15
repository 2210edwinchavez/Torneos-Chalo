import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import TournamentShieldThumb from '../components/TournamentShieldThumb';
import { formatDate, getTeamColor, getInitials, calcStandings } from '../utils/helpers';

/* ─── Team Detail View (dentro de TournamentDetailModal) ─── */
function TeamDetailView({ team, tournament, onBack }) {
  const { state } = useTournament();
  const color = getTeamColor(team.colorIndex);
  const enrollments = team.enrollments || [];
  const playerLimit = tournament.playerLimit || 25;
  const isFull = enrollments.length >= playerLimit;

  const stats = (() => {
    const ms = tournament.matches.filter(
      m => m.status === 'finished' && (m.homeId === team.id || m.awayId === team.id)
    );
    let w = 0, d = 0, l = 0, gf = 0;
    ms.forEach(m => {
      const isHome = m.homeId === team.id;
      const myG = isHome ? Number(m.homeScore) : Number(m.awayScore);
      const theirG = isHome ? Number(m.awayScore) : Number(m.homeScore);
      gf += myG;
      if (myG > theirG) w++; else if (myG === theirG) d++; else l++;
    });
    return { pj: ms.length, w, d, l, gf };
  })();

  return (
    <div>
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600,
          padding: '0 0 16px', transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        ← Todos los equipos
      </button>

      {/* Team header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20,
        padding: 16, background: 'var(--bg-card2)', borderRadius: 12,
        borderLeft: `4px solid ${color}`,
      }}>
        {team.shield ? (
          <img src={team.shield} alt="" style={{ width: 72, height: 72, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }} />
        ) : (
          <div className="team-avatar" style={{ width: 72, height: 72, fontSize: '1.2rem', fontWeight: 800, background: color + '22', color, flexShrink: 0 }}>
            {getInitials(team.name)}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 4 }}>{team.name}</div>
          {team.coach && <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>👔 {team.coach}</div>}
          {team.city && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>📍 {team.city}</div>}
        </div>
      </div>

      {/* Stats */}
      {stats.pj > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
          {[
            { label: 'PJ', value: stats.pj },
            { label: 'G', value: stats.w, color: 'var(--success)' },
            { label: 'E', value: stats.d, color: 'var(--warning)' },
            { label: 'P', value: stats.l, color: 'var(--danger)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-card2)', borderRadius: 8, padding: '10px 4px', textAlign: 'center', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: s.color || 'var(--text-primary)' }}>{s.value}</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Players */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            👥 Jugadores
          </div>
          <span style={{
            padding: '2px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
            background: isFull ? 'rgba(239,68,68,0.15)' : color + '33',
            color: isFull ? 'var(--danger)' : color,
          }}>
            {enrollments.length}/{playerLimit}{isFull ? ' · COMPLETO' : ''}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 99, height: 5, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{
            height: '100%',
            width: `${Math.min((enrollments.length / playerLimit) * 100, 100)}%`,
            background: isFull ? 'var(--danger)' : enrollments.length / playerLimit > 0.8 ? 'var(--warning)' : 'var(--primary)',
            borderRadius: 99,
          }} />
        </div>

        {enrollments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Sin jugadores inscritos aún
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {enrollments.map((enrollment, idx) => {
              const player = state.globalPlayers.find(p => p.id === enrollment.playerId);
              if (!player) return null;
              const fullName = `${player.firstName} ${player.lastName}`;
              const age = player.birthDate
                ? Math.floor((Date.now() - new Date(player.birthDate)) / (365.25 * 24 * 3600 * 1000))
                : null;
              return (
                <div
                  key={enrollment.id || idx}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 10,
                    background: 'var(--bg-card2)', border: '1px solid var(--border)',
                  }}
                >
                  {player.photo ? (
                    <img src={player.photo} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
                  ) : (
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                      background: color + '22', color, fontWeight: 800, fontSize: '0.8rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {getInitials(fullName)}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {enrollment.shirtNumber && (
                        <span style={{ color, fontWeight: 800, marginRight: 5 }}>#{enrollment.shirtNumber}</span>
                      )}
                      {fullName}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', gap: 8, marginTop: 1 }}>
                      {player.docNumber && <span>📄 {player.docNumber}</span>}
                      {age !== null && <span>🎂 {age} años</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Tournament Detail Modal (para usuarios) ─── */
function TournamentDetailModal({ tournament, colorIndex = 0, onClose }) {
  const [tab, setTab] = useState('info');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const standings = useMemo(() => calcStandings(tournament.teams, tournament.matches), [tournament]);
  const color = '#84cc16';

  const played = tournament.matches.filter(m => m.status === 'finished');
  const upcoming = tournament.matches.filter(m => m.status !== 'finished');

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'stretch', justifyContent:'center' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:'100%', maxWidth:860, background:'var(--bg)',
          display:'flex', flexDirection:'column', overflow:'hidden',
          boxShadow:'0 0 80px rgba(0,0,0,0.7)',
          borderLeft:'1px solid var(--border)', borderRight:'1px solid var(--border)',
        }}
      >
        {/* Cabecera */}
        <div style={{ background:'linear-gradient(135deg,#071207,#0d200d)', padding:'20px 20px 0', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:16 }}>
            <TournamentShieldThumb shield={tournament.shield} sport={tournament.sport} colorIndex={colorIndex} size={56} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:800, fontSize:'1.2rem', color:'#f1f5f9' }}>{tournament.name}</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:6 }}>
                <span className={`badge ${tournament.status==='active'?'badge-active':'badge-finished'}`}>
                  {tournament.status==='active'?'● Activo':'■ Finalizado'}
                </span>
                <span className="badge" style={{ background:'var(--bg-card2)',color:'var(--text-secondary)' }}>{tournament.sport}</span>
                <span className="badge" style={{ background:'var(--bg-card2)',color:'var(--text-secondary)' }}>
                  {tournament.type==='league'?'Liga':'Eliminación'}
                </span>
              </div>
            </div>
            <button onClick={onClose} style={{ background:'none',border:'none',color:'var(--text-muted)',fontSize:'1.2rem',cursor:'pointer',flexShrink:0,padding:'0 4px' }}>✕</button>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:2 }}>
            {[
              {id:'info', label:'📋 Info'},
              {id:'equipos', label:`👥 Equipos (${tournament.teams.length})`},
              {id:'partidos', label:`⚽ Partidos (${tournament.matches.length})`},
              ...(tournament.type==='league' ? [{id:'posiciones',label:'📊 Posiciones'}] : []),
            ].map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setSelectedTeam(null); }} style={{
                padding:'8px 14px', border:'none', cursor:'pointer',
                borderRadius:'8px 8px 0 0', fontWeight:700, fontSize:'0.78rem',
                background: tab===t.id ? 'var(--bg)' : 'transparent',
                color: tab===t.id ? color : 'var(--text-muted)',
                borderBottom: tab===t.id ? '2px solid '+color : '2px solid transparent',
                transition:'all 0.15s',
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* Contenido */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>

          {/* ── Info ── */}
          {tab==='info' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {/* Stats rápidas */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:8 }}>
                {[
                  {icon:'👥',label:'Equipos',value:tournament.teams.length},
                  {icon:'⚽',label:'Partidos',value:tournament.matches.length},
                  {icon:'✅',label:'Jugados',value:played.length},
                ].map(s => (
                  <div key={s.label} style={{ background:'var(--bg-card2)',borderRadius:10,padding:'12px 8px',textAlign:'center',border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:'1.4rem',marginBottom:4 }}>{s.icon}</div>
                    <div style={{ fontWeight:800,fontSize:'1.2rem',color:'var(--text-primary)' }}>{s.value}</div>
                    <div style={{ fontSize:'0.7rem',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {tournament.description && (
                <div style={{ padding:'12px 14px',background:'var(--bg-card2)',borderRadius:10,border:'1px solid var(--border)',fontSize:'0.85rem',color:'var(--text-secondary)',fontStyle:'italic' }}>
                  {tournament.description}
                </div>
              )}
              {[
                {icon:'📅',label:'Fechas', value: tournament.startDate||tournament.endDate ? `${tournament.startDate?formatDate(tournament.startDate):'?'} → ${tournament.endDate?formatDate(tournament.endDate):'?'}` : null},
                {icon:'📍',label:'Cancha / Sede', value:tournament.venue},
                {icon:'⚽',label:'Sistema de juego', value:tournament.gameSystem},
                {icon:'📜',label:'Reglamento', value:tournament.regulations},
                {icon:'🏅',label:'Premiación', value:tournament.awards},
              ].map(row => row.value ? (
                <div key={row.label} style={{ padding:'12px 14px',background:'var(--bg-card2)',borderRadius:10,border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:'0.68rem',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4 }}>
                    {row.icon} {row.label}
                  </div>
                  <div style={{ fontSize:'0.85rem',color:'var(--text-secondary)',whiteSpace:'pre-wrap' }}>{row.value}</div>
                </div>
              ) : null)}
            </div>
          )}

          {/* ── Equipos ── */}
          {tab==='equipos' && (
            selectedTeam ? (
              /* ── Detalle del equipo seleccionado ── */
              <TeamDetailView
                team={selectedTeam}
                tournament={tournament}
                onBack={() => setSelectedTeam(null)}
              />
            ) : (
              /* ── Grid de equipos clickeables ── */
              <div>
                {tournament.teams.length === 0 ? (
                  <div style={{ color:'var(--text-muted)',fontSize:'0.85rem',textAlign:'center',padding:'30px 0' }}>Sin equipos registrados</div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,150px),1fr))', gap:12 }}>
                    {tournament.teams.map((team, i) => {
                      const tc = getTeamColor(team.colorIndex);
                      const enrollments = team.enrollments || [];
                      const playerLimit = tournament.playerLimit || 25;
                      return (
                        <button
                          key={team.id}
                          type="button"
                          onClick={() => setSelectedTeam(team)}
                          className="team-tile-btn"
                          style={{ borderTop:`3px solid ${tc}` }}
                        >
                          {team.shield
                            ? <img src={team.shield} style={{ width:60,height:60,objectFit:'contain',filter:'drop-shadow(0 2px 8px rgba(0,0,0,0.4))' }} alt="" />
                            : <div className="team-avatar" style={{ width:60,height:60,background:tc+'22',color:tc,fontWeight:800,fontSize:'1rem' }}>{getInitials(team.name)}</div>
                          }
                          <div style={{ fontWeight:700,fontSize:'0.85rem',color:'var(--text-primary)',lineHeight:1.3,marginTop:4 }}>{team.name}</div>
                          {team.city && <div style={{ fontSize:'0.68rem',color:'var(--text-muted)',marginTop:1 }}>📍 {team.city}</div>}
                          <span style={{
                            marginTop:6, padding:'2px 8px', borderRadius:99, fontSize:'0.68rem', fontWeight:700,
                            background: tc+'22', color: tc,
                          }}>
                            👥 {enrollments.length}/{playerLimit}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )
          )}

          {/* ── Partidos ── */}
          {tab==='partidos' && (
            <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
              {played.length > 0 && (
                <div>
                  <div style={{ fontSize:'0.75rem',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8 }}>
                    ✅ Resultados ({played.length})
                  </div>
                  <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                    {played.slice().reverse().map(m => {
                      const home = tournament.teams.find(t=>t.id===m.homeId);
                      const away = tournament.teams.find(t=>t.id===m.awayId);
                      if(!home||!away) return null;
                      return (
                        <div key={m.id} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'var(--bg-card2)',borderRadius:10,border:'1px solid var(--border)' }}>
                          <div style={{ flex:1,display:'flex',alignItems:'center',gap:8,justifyContent:'flex-end' }}>
                            <span style={{ fontSize:'0.85rem',fontWeight:700,color:Number(m.homeScore)>Number(m.awayScore)?'var(--success)':'var(--text-primary)' }}>{home.name}</span>
                            {home.shield?<img src={home.shield} style={{ width:28,height:28,objectFit:'contain' }} alt=""/>:<div className="team-avatar" style={{ width:28,height:28,fontSize:'0.6rem',background:getTeamColor(home.colorIndex)+'22',color:getTeamColor(home.colorIndex) }}>{getInitials(home.name)}</div>}
                          </div>
                          <div style={{ background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.2)',borderRadius:8,padding:'4px 12px',fontWeight:800,fontSize:'1rem',color:'var(--text-primary)',flexShrink:0 }}>
                            {m.homeScore} — {m.awayScore}
                          </div>
                          <div style={{ flex:1,display:'flex',alignItems:'center',gap:8 }}>
                            {away.shield?<img src={away.shield} style={{ width:28,height:28,objectFit:'contain' }} alt=""/>:<div className="team-avatar" style={{ width:28,height:28,fontSize:'0.6rem',background:getTeamColor(away.colorIndex)+'22',color:getTeamColor(away.colorIndex) }}>{getInitials(away.name)}</div>}
                            <span style={{ fontSize:'0.85rem',fontWeight:700,color:Number(m.awayScore)>Number(m.homeScore)?'var(--success)':'var(--text-primary)' }}>{away.name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {upcoming.length > 0 && (
                <div>
                  <div style={{ fontSize:'0.75rem',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8 }}>
                    📅 Próximos partidos ({upcoming.length})
                  </div>
                  <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                    {upcoming.map(m => {
                      const home = tournament.teams.find(t=>t.id===m.homeId);
                      const away = tournament.teams.find(t=>t.id===m.awayId);
                      if(!home||!away) return null;
                      return (
                        <div key={m.id} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'var(--bg-card2)',borderRadius:10,border:'1px solid var(--border)' }}>
                          <div style={{ flex:1,display:'flex',alignItems:'center',gap:8,justifyContent:'flex-end' }}>
                            <span style={{ fontSize:'0.85rem',fontWeight:700,color:'var(--text-primary)' }}>{home.name}</span>
                            {home.shield?<img src={home.shield} style={{ width:28,height:28,objectFit:'contain' }} alt=""/>:<div className="team-avatar" style={{ width:28,height:28,fontSize:'0.6rem',background:getTeamColor(home.colorIndex)+'22',color:getTeamColor(home.colorIndex) }}>{getInitials(home.name)}</div>}
                          </div>
                          <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:2,flexShrink:0 }}>
                            <div style={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,padding:'4px 12px',fontWeight:700,fontSize:'0.85rem',color:'var(--text-muted)' }}>VS</div>
                            {(m.date||m.time) && <span style={{ fontSize:'0.65rem',color:'var(--primary-light)',fontWeight:700 }}>{m.date} {m.time}</span>}
                            {m.venue && <span style={{ fontSize:'0.62rem',color:'var(--text-muted)' }}>📍 {m.venue}</span>}
                          </div>
                          <div style={{ flex:1,display:'flex',alignItems:'center',gap:8 }}>
                            {away.shield?<img src={away.shield} style={{ width:28,height:28,objectFit:'contain' }} alt=""/>:<div className="team-avatar" style={{ width:28,height:28,fontSize:'0.6rem',background:getTeamColor(away.colorIndex)+'22',color:getTeamColor(away.colorIndex) }}>{getInitials(away.name)}</div>}
                            <span style={{ fontSize:'0.85rem',fontWeight:700,color:'var(--text-primary)' }}>{away.name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {tournament.matches.length === 0 && (
                <div style={{ textAlign:'center',padding:'40px 0',color:'var(--text-muted)' }}>Sin partidos programados aún</div>
              )}
            </div>
          )}

          {/* ── Posiciones ── */}
          {tab==='posiciones' && (
            <div>
              {standings.length === 0 ? (
                <div style={{ textAlign:'center',padding:'40px 0',color:'var(--text-muted)' }}>Sin partidos jugados aún</div>
              ) : (
                <>
                  {standings[0].pj > 0 && (
                    <div className="card mb-24" style={{ background:`linear-gradient(135deg,${getTeamColor(standings[0].team.colorIndex)}22,var(--bg-card))`, borderColor:getTeamColor(standings[0].team.colorIndex)+'44', display:'flex',alignItems:'center',gap:14 }}>
                      <span style={{ fontSize:'2rem' }}>🥇</span>
                      {standings[0].team.shield
                        ? <img src={standings[0].team.shield} style={{ width:48,height:48,objectFit:'contain' }} alt="" />
                        : <div className="team-avatar" style={{ width:48,height:48,background:getTeamColor(standings[0].team.colorIndex)+'33',color:getTeamColor(standings[0].team.colorIndex),fontWeight:800 }}>{getInitials(standings[0].team.name)}</div>
                      }
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:800,fontSize:'1rem',color:'var(--text-primary)' }}>{standings[0].team.name}</div>
                        <div style={{ fontSize:'0.78rem',color:'var(--text-muted)' }}>Líder · {standings[0].pts} puntos</div>
                      </div>
                      <div style={{ fontSize:'2rem',fontWeight:800,color:getTeamColor(standings[0].team.colorIndex) }}>{standings[0].pts}</div>
                    </div>
                  )}
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th><th>Equipo</th>
                          <th title="Jugados">PJ</th><th title="Ganados" style={{color:'var(--success)'}}>G</th>
                          <th title="Empatados" style={{color:'var(--warning)'}}>E</th><th title="Perdidos" style={{color:'var(--danger)'}}>P</th>
                          <th>GF</th><th>GC</th><th>DG</th><th>PTS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((row,i) => {
                          const tc = getTeamColor(row.team.colorIndex);
                          return (
                            <tr key={row.team.id}>
                              <td><span style={{ fontWeight:700,color:'var(--text-muted)' }}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</span></td>
                              <td>
                                <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                                  {row.team.shield?<img src={row.team.shield} style={{ width:28,height:28,objectFit:'contain' }} alt=""/>
                                    :<div className="team-avatar" style={{ background:tc+'22',color:tc,fontSize:'0.65rem',fontWeight:800 }}>{getInitials(row.team.name)}</div>}
                                  <span style={{ fontWeight:600,fontSize:'0.85rem',color:'var(--text-primary)' }}>{row.team.name}</span>
                                </div>
                              </td>
                              <td>{row.pj}</td>
                              <td style={{ color:'var(--success)',fontWeight:700 }}>{row.pg}</td>
                              <td style={{ color:'var(--warning)',fontWeight:700 }}>{row.pe}</td>
                              <td style={{ color:'var(--danger)',fontWeight:700 }}>{row.pp}</td>
                              <td>{row.gf}</td><td>{row.gc}</td>
                              <td style={{ fontWeight:600,color:row.dg>0?'var(--success)':row.dg<0?'var(--danger)':'var(--text-muted)' }}>{row.dg>0?'+':''}{row.dg}</td>
                              <td><span style={{ fontWeight:800,color:tc,fontSize:'0.95rem' }}>{row.pts}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DupIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

/* ─── User Dashboard ─── */
function UserDashboard({ tournaments, session }) {
  const [selected, setSelected] = useState(null);

  if (tournaments.length === 0) {
    return (
      <div className="dashboard-simple">
        <div className="dashboard-simple-empty">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Hola, {session?.name || 'invitado'}
          </h2>
          <p className="dashboard-simple-empty-note">
            Aún no hay torneos disponibles. El administrador los publicará pronto.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-simple">
      <div className="dashboard-logos-row">
        {tournaments.map((t, i) => (
          <button
            key={t.id}
            type="button"
            className="dashboard-logo-btn"
            title={t.name}
            onClick={() => setSelected(t)}
          >
            <TournamentShieldThumb shield={t.shield} sport={t.sport} colorIndex={i} size={72} />
          </button>
        ))}
      </div>
      {selected && (
        <TournamentDetailModal
          tournament={selected}
          colorIndex={Math.max(0, tournaments.findIndex(tm => tm.id === selected.id))}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

export default function Dashboard() {
  const { state, activeTournament, dispatch } = useTournament();
  const { isAdmin, session } = useAuth();
  const navigate = useNavigate();

  if (!isAdmin) {
    return <UserDashboard tournaments={state.tournaments} session={session} />;
  }

  if (state.tournaments.length === 0) {
    return (
      <div className="dashboard-simple">
        <div className="dashboard-simple-empty">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Bienvenido{session?.name ? `, ${session.name}` : ''}
          </h2>
          <p className="dashboard-simple-empty-note">
            Crea tu primer torneo para empezar a organizar equipos y partidos.
          </p>
        </div>
        <Link to="/torneos" className="dashboard-simple-new">
          + Nuevo torneo
        </Link>
      </div>
    );
  }

  return (
    <div className="dashboard-simple">
      <div className="dashboard-logos-row">
        {state.tournaments.map((t, i) => (
          <button
            key={t.id}
            type="button"
            className={`dashboard-logo-btn${t.id === activeTournament?.id ? ' is-active' : ''}`}
            title={t.name}
            onClick={() => {
              dispatch({ type: 'SET_ACTIVE_TOURNAMENT', payload: t.id });
              navigate('/torneos');
            }}
          >
            <TournamentShieldThumb shield={t.shield} sport={t.sport} colorIndex={i} size={72} />
          </button>
        ))}
      </div>
      <Link to="/torneos" className="dashboard-simple-new" style={{ marginTop: 28 }}>
        + Nuevo torneo
      </Link>
    </div>
  );
}
