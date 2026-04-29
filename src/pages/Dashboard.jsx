import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import { formatDate, getTeamColor, getInitials, calcStandings } from '../utils/helpers';
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

/* ─── Tournament Detail Modal (para usuarios) ─── */
function TournamentDetailModal({ tournament, onClose }) {
  const [tab, setTab] = useState('info');
  const standings = useMemo(() => calcStandings(tournament.teams, tournament.matches), [tournament]);
  const color = '#84cc16';

  const played = tournament.matches.filter(m => m.status === 'finished');
  const upcoming = tournament.matches.filter(m => m.status !== 'finished');

  const SPORT_ICONS_LOCAL = { 'Fútbol':'⚽','Baloncesto':'🏀','Tenis':'🎾','Voleibol':'🏐','Béisbol':'⚾','Otro':'🏆' };

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
            <div style={{ fontSize:'2.2rem' }}>{SPORT_ICONS_LOCAL[tournament.sport] || '🏆'}</div>
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
              <button key={t.id} onClick={() => setTab(t.id)} style={{
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
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
              {tournament.teams.length === 0 && (
                <div style={{ color:'var(--text-muted)',fontSize:'0.85rem',gridColumn:'1/-1',textAlign:'center',padding:'30px 0' }}>Sin equipos registrados</div>
              )}
              {tournament.teams.map((team, i) => {
                const tc = getTeamColor(team.colorIndex);
                const ms = tournament.matches.filter(m => m.status==='finished' && (m.homeId===team.id||m.awayId===team.id));
                let w=0,d=0,l=0;
                ms.forEach(m => {
                  const isH = m.homeId===team.id;
                  const mg = isH?Number(m.homeScore):Number(m.awayScore);
                  const tg = isH?Number(m.awayScore):Number(m.homeScore);
                  if(mg>tg)w++; else if(mg===tg)d++; else l++;
                });
                return (
                  <div key={team.id} className="card" style={{ borderTop:`3px solid ${tc}` }}>
                    <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:10 }}>
                      {team.shield
                        ? <img src={team.shield} style={{ width:48,height:48,objectFit:'contain',filter:'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }} alt="" />
                        : <div className="team-avatar" style={{ width:48,height:48,background:tc+'22',color:tc,fontWeight:800 }}>{getInitials(team.name)}</div>
                      }
                      <div>
                        <div style={{ fontWeight:700,color:'var(--text-primary)' }}>{team.name}</div>
                        {team.coach && <div style={{ fontSize:'0.72rem',color:'var(--text-muted)' }}>👔 {team.coach}</div>}
                        {team.city && <div style={{ fontSize:'0.72rem',color:'var(--text-muted)' }}>📍 {team.city}</div>}
                      </div>
                    </div>
                    {ms.length > 0 && (
                      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:4,marginBottom:10 }}>
                        {[{l:'PJ',v:ms.length},{l:'G',v:w,c:'var(--success)'},{l:'E',v:d,c:'var(--warning)'},{l:'P',v:l,c:'var(--danger)'}].map(s=>(
                          <div key={s.l} style={{ background:'var(--bg-card2)',borderRadius:6,padding:'4px 2px',textAlign:'center' }}>
                            <div style={{ fontSize:'0.9rem',fontWeight:800,color:s.c||'var(--text-primary)' }}>{s.v}</div>
                            <div style={{ fontSize:'0.58rem',color:'var(--text-muted)',textTransform:'uppercase' }}>{s.l}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Jugadores */}
                    {(team.enrollments||[]).length > 0 && (
                      <div>
                        <div style={{ fontSize:'0.68rem',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6 }}>
                          👥 {team.enrollments.length} jugadores
                        </div>
                        <div style={{ display:'flex',flexWrap:'wrap',gap:4 }}>
                          {team.enrollments.slice(0,8).map(e => (
                            <span key={e.id} style={{ fontSize:'0.68rem',background:'var(--bg-card2)',borderRadius:99,padding:'2px 7px',color:'var(--text-secondary)',border:'1px solid var(--border)' }}>
                              {e.shirtNumber?`#${e.shirtNumber} `:''}
                            </span>
                          ))}
                          {team.enrollments.length > 8 && (
                            <span style={{ fontSize:'0.68rem',color:'var(--text-muted)' }}>+{team.enrollments.length-8} más</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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

/* ─── User Dashboard ─── */
function UserDashboard({ tournaments, session }) {
  const [selected, setSelected] = useState(null);
  const SPORT_ICONS_LOCAL = { 'Fútbol':'⚽','Baloncesto':'🏀','Tenis':'🎾','Voleibol':'🏐','Béisbol':'⚾','Otro':'🏆' };

  if (tournaments.length === 0) {
    return (
      <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'60vh',textAlign:'center',gap:16 }}>
        <img src="/logo jc sport.png" alt="Torneos JC SPORT" style={{ width:90,height:90,objectFit:'contain',filter:'drop-shadow(0 4px 24px rgba(132,204,22,0.4))',marginBottom:8 }} />
        <h3 style={{ color:'var(--text-primary)',fontSize:'1.2rem',fontWeight:800 }}>Bienvenido, {session?.name}</h3>
        <p style={{ color:'var(--text-muted)',fontSize:'0.9rem' }}>Aún no hay torneos disponibles.<br/>El administrador los publicará pronto.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Bienvenido, {session?.name} 👋</div>
          <div className="page-subtitle">{tournaments.length} torneo{tournaments.length!==1?'s':''} disponible{tournaments.length!==1?'s':''} · haz clic para ver detalles</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
        {tournaments.map((t, i) => {
          const played = t.matches.filter(m => m.status==='finished').length;
          const tc = getTeamColor(i);
          return (
            <button
              key={t.id}
              onClick={() => setSelected(t)}
              style={{
                textAlign:'left', cursor:'pointer', border:'none', padding:0, background:'transparent',
                borderRadius:16, transition:'transform 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
            >
              <div className="card" style={{ border:`1px solid ${tc}33`, borderTop:`3px solid ${tc}`, height:'100%' }}>
                {/* Header */}
                <div style={{ display:'flex',alignItems:'flex-start',gap:12,marginBottom:14 }}>
                  <div style={{ fontSize:'2rem',width:52,height:52,display:'flex',alignItems:'center',justifyContent:'center',background:tc+'22',borderRadius:12,flexShrink:0 }}>
                    {SPORT_ICONS_LOCAL[t.sport]||'🏆'}
                  </div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontWeight:800,fontSize:'1rem',color:'var(--text-primary)',marginBottom:6 }}>{t.name}</div>
                    <div style={{ display:'flex',gap:5,flexWrap:'wrap' }}>
                      <span className={`badge ${t.status==='active'?'badge-active':'badge-finished'}`}>
                        {t.status==='active'?'● Activo':'■ Finalizado'}
                      </span>
                      <span className="badge" style={{ background:'var(--bg-card2)',color:'var(--text-secondary)' }}>{t.sport}</span>
                    </div>
                  </div>
                </div>

                {t.description && (
                  <p style={{ fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:12,fontStyle:'italic',lineHeight:1.5 }}>
                    {t.description.slice(0,100)}{t.description.length>100?'…':''}
                  </p>
                )}

                {/* Stats */}
                <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,marginBottom:12 }}>
                  {[
                    {label:'Equipos',value:t.teams.length,icon:'👥'},
                    {label:'Partidos',value:t.matches.length,icon:'📅'},
                    {label:'Jugados',value:played,icon:'✅'},
                  ].map(s => (
                    <div key={s.label} style={{ background:'var(--bg-card2)',borderRadius:8,padding:'7px 4px',textAlign:'center' }}>
                      <div style={{ fontSize:'1rem',fontWeight:800,color:'var(--text-primary)' }}>{s.value}</div>
                      <div style={{ fontSize:'0.62rem',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Info pills */}
                <div style={{ display:'flex',flexWrap:'wrap',gap:5,marginBottom:12 }}>
                  {(t.startDate||t.endDate) && (
                    <span className="pill" style={{ fontSize:'0.7rem' }}>📅 {t.startDate?formatDate(t.startDate):'?'} → {t.endDate?formatDate(t.endDate):'?'}</span>
                  )}
                  {t.venue && <span className="pill" style={{ fontSize:'0.7rem' }}>📍 {t.venue}</span>}
                </div>

                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'auto',paddingTop:8,borderTop:'1px solid var(--border)' }}>
                  <span style={{ fontSize:'0.75rem',color:'var(--text-muted)' }}>
                    {t.type==='league'?'Liga':'Eliminación directa'}
                  </span>
                  <span style={{ fontSize:'0.75rem',fontWeight:700,color:tc }}>Ver detalles →</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <TournamentDetailModal tournament={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}


export default function Dashboard() {
  const { state, activeTournament, dispatch } = useTournament();
  const { isAdmin, session } = useAuth();

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

  if (!isAdmin) {
    return <UserDashboard tournaments={state.tournaments} session={session} />;
  }

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
          {isAdmin && (
            <Link to="/torneos" className="btn btn-primary" style={{ fontSize: '1rem', padding: '12px 28px' }}>
              + Crear primer torneo
            </Link>
          )}
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
