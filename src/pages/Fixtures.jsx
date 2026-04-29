import { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTournament } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import LineupEditor from '../components/LineupEditor';
import {
  generateLeagueFixtures,
  generateKnockoutBracket,
  getTeamColor,
  getInitials,
  formatDate,
  generateId,
} from '../utils/helpers';

/* ─── Match Poster Modal ─── */
function MatchPosterModal({ match, home, away, tournamentName, onClose }) {
  const canvasRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const homeColor = getTeamColor(home?.colorIndex) || '#84cc16';
  const awayColor = getTeamColor(away?.colorIndex) || '#3b82f6';

  async function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
  }

  async function downloadPoster() {
    setDownloading(true);
    const W = 800, H = 480;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Fondo degradado
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0a1a0a');
    bg.addColorStop(0.5, '#0d200d');
    bg.addColorStop(1, '#0a1a0a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Franjas del equipo local (izquierda)
    const gl = ctx.createLinearGradient(0, 0, W * 0.45, 0);
    gl.addColorStop(0, `rgba(${hexToRgb(homeColor)},0.25)`);
    gl.addColorStop(1, 'transparent');
    ctx.fillStyle = gl;
    ctx.fillRect(0, 0, W * 0.45, H);

    // Franjas del equipo visita (derecha)
    const gr = ctx.createLinearGradient(W, 0, W * 0.55, 0);
    gr.addColorStop(0, `rgba(${hexToRgb(awayColor)},0.25)`);
    gr.addColorStop(1, 'transparent');
    ctx.fillStyle = gr;
    ctx.fillRect(W * 0.55, 0, W * 0.45, H);

    // Línea central decorativa
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
    ctx.setLineDash([]);

    // Borde exterior
    ctx.strokeStyle = 'rgba(132,204,22,0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, W - 24, H - 24);

    // ── Cabecera ──
    ctx.fillStyle = 'rgba(132,204,22,0.12)';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 180, 18, 360, 36, 8);
    ctx.fill();
    ctx.fillStyle = '#84cc16';
    ctx.font = 'bold 13px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('⚽ TORNEOS JC SPORT', W / 2, 42);

    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '11px system-ui';
    ctx.fillText(tournamentName.toUpperCase(), W / 2, 66);

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = '10px system-ui';
    ctx.fillText(`RONDA ${match.round || '?'}`, W / 2, 82);

    // ── VS central ──
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 30, H / 2 - 22, 60, 44, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(132,204,22,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 22px system-ui';
    ctx.textAlign = 'center';
    if (match.status === 'finished') {
      ctx.fillText(`${match.homeScore}–${match.awayScore}`, W / 2, H / 2 + 8);
    } else {
      ctx.fillStyle = '#84cc16';
      ctx.fillText('VS', W / 2, H / 2 + 8);
    }

    // Cargar escudos
    const homeImg = home?.shield ? await loadImage(home.shield) : null;
    const awayImg = away?.shield ? await loadImage(away.shield) : null;

    // Función para dibujar equipo
    function drawTeam(x, name, color, shieldImg, align) {
      const shieldSize = 110;
      const shieldX = align === 'left' ? x - shieldSize / 2 : x - shieldSize / 2;
      const shieldY = H / 2 - 80;

      if (shieldImg) {
        // Sombra
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.drawImage(shieldImg, shieldX, shieldY, shieldSize, shieldSize);
        ctx.shadowBlur = 0;
      } else {
        // Avatar de letras
        ctx.fillStyle = color + '33';
        ctx.beginPath();
        ctx.roundRect(shieldX, shieldY, shieldSize, shieldSize, 16);
        ctx.fill();
        ctx.fillStyle = color;
        ctx.font = `bold ${shieldSize * 0.38}px system-ui`;
        ctx.textAlign = 'center';
        const initials = name.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase();
        ctx.fillText(initials, x, shieldY + shieldSize * 0.65);
      }

      // Nombre
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#f1f5f9';
      ctx.font = `bold 17px system-ui`;
      ctx.textAlign = 'center';
      const words = name.split(' ');
      let line1 = '', line2 = '';
      words.forEach(w => {
        if ((line1 + ' ' + w).trim().length <= 14) line1 = (line1 + ' ' + w).trim();
        else line2 = (line2 + ' ' + w).trim();
      });
      ctx.fillText(line1, x, shieldY + shieldSize + 24);
      if (line2) {
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '14px system-ui';
        ctx.fillText(line2, x, shieldY + shieldSize + 42);
      }

      // Etiqueta local/visita
      ctx.fillStyle = color + '66';
      ctx.beginPath();
      ctx.roundRect(x - 30, shieldY + shieldSize + (line2 ? 54 : 36), 60, 18, 6);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.font = 'bold 10px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(align === 'left' ? 'LOCAL' : 'VISITA', x, shieldY + shieldSize + (line2 ? 67 : 49));
    }

    drawTeam(W * 0.22, home?.name || '?', homeColor, homeImg, 'left');
    drawTeam(W * 0.78, away?.name || '?', awayColor, awayImg, 'right');

    // ── Info inferior ──
    const infoY = H - 64;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 230, infoY - 8, 460, 52, 10);
    ctx.fill();

    const pills = [];
    if (match.date) pills.push(`📅 ${match.date}`);
    if (match.time) pills.push(`🕐 ${match.time}`);
    if (match.venue) pills.push(`📍 ${match.venue}`);
    if (match.status === 'finished') pills.push('✅ Finalizado');

    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';
    const infoLine = pills.join('   ');
    ctx.fillText(infoLine, W / 2, infoY + 14);

    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '10px system-ui';
    ctx.fillText('torneosjcsport.vercel.app', W / 2, infoY + 32);

    // Descargar
    const link = document.createElement('a');
    link.download = `partido-${home?.name || 'local'}-vs-${away?.name || 'visita'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setDownloading(false);
  }

  const isMobile = window.innerWidth < 600;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        animation: 'modalBgIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
          border: '1px solid rgba(132,204,22,0.25)',
          animation: 'modalIn 0.2s ease',
        }}
      >
        {/* Poster visual */}
        <div style={{
          background: `linear-gradient(135deg, #0a1a0a 0%, ${homeColor}28 50%, ${awayColor}28 100%)`,
          padding: '28px 20px 20px',
          position: 'relative',
          minHeight: 260,
        }}>
          {/* Decoración fondo */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 30px, rgba(255,255,255,0.015) 30px, rgba(255,255,255,0.015) 31px)' }} />

          {/* Cabecera */}
          <div style={{ textAlign: 'center', marginBottom: 20, position: 'relative' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#84cc16', letterSpacing: '0.14em', marginBottom: 2 }}>
              ⚽ TORNEOS JC SPORT
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em' }}>
              {tournamentName}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
              RONDA {match.round || '?'}
            </div>
          </div>

          {/* Equipos */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, position: 'relative' }}>
            {/* Equipo local */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              {home?.shield ? (
                <img src={home.shield} alt={home.name} style={{ width: 80, height: 80, objectFit: 'contain', filter: `drop-shadow(0 4px 16px ${homeColor}88)` }} />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: 14, background: homeColor + '33', border: `2px solid ${homeColor}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 800, color: homeColor }}>
                  {getInitials(home?.name)}
                </div>
              )}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#f1f5f9', lineHeight: 1.2 }}>{home?.name}</div>
                <div style={{ fontSize: '0.62rem', color: homeColor, fontWeight: 700, marginTop: 3, letterSpacing: '0.08em' }}>LOCAL</div>
              </div>
            </div>

            {/* VS / Marcador */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {match.status === 'finished' ? (
                <div style={{
                  background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(132,204,22,0.3)',
                  borderRadius: 12, padding: '8px 16px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#f1f5f9', lineHeight: 1, letterSpacing: '0.05em' }}>
                    {match.homeScore}<span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>–</span>{match.awayScore}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: '#84cc16', fontWeight: 700, letterSpacing: '0.1em', marginTop: 4 }}>RESULTADO FINAL</div>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(132,204,22,0.3)',
                  borderRadius: 12, padding: '10px 18px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#84cc16', letterSpacing: '0.1em' }}>VS</div>
                  <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginTop: 2, letterSpacing: '0.1em' }}>PROGRAMADO</div>
                </div>
              )}
            </div>

            {/* Equipo visita */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              {away?.shield ? (
                <img src={away.shield} alt={away.name} style={{ width: 80, height: 80, objectFit: 'contain', filter: `drop-shadow(0 4px 16px ${awayColor}88)` }} />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: 14, background: awayColor + '33', border: `2px solid ${awayColor}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 800, color: awayColor }}>
                  {getInitials(away?.name)}
                </div>
              )}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#f1f5f9', lineHeight: 1.2 }}>{away?.name}</div>
                <div style={{ fontSize: '0.62rem', color: awayColor, fontWeight: 700, marginTop: 3, letterSpacing: '0.08em' }}>VISITA</div>
              </div>
            </div>
          </div>
        </div>

        {/* Info inferior */}
        <div style={{ background: '#0d1a0d', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {match.date && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: 99 }}>
                📅 {formatDate(match.date)}
              </span>
            )}
            {match.time && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: '#84cc16', fontWeight: 700, background: 'rgba(132,204,22,0.1)', padding: '4px 10px', borderRadius: 99 }}>
                🕐 {match.time}
              </span>
            )}
            {match.venue && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: 99 }}>
                📍 {match.venue}
              </span>
            )}
            {!match.date && !match.time && !match.venue && (
              <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>Sin fecha ni cancha programadas</span>
            )}
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              onClick={downloadPoster}
              disabled={downloading}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 9, border: 'none',
                background: downloading ? 'rgba(132,204,22,0.4)' : '#84cc16',
                color: '#0a0f0a', fontWeight: 800, fontSize: '0.82rem',
                cursor: downloading ? 'wait' : 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {downloading ? (
                '⏳ Generando…'
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Descargar imagen
                </>
              )}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '9px 16px', borderRadius: 9,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.82rem',
                cursor: 'pointer',
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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

function MatchRow({ match, teams, onEdit, onDelete, isAdmin, onView, onLineup }) {
  const home = teams.find(t => t.id === match.homeId);
  const away = teams.find(t => t.id === match.awayId);
  if (!home || !away) return null;

  const homeColor = getTeamColor(home.colorIndex);
  const awayColor = getTeamColor(away.colorIndex);

  return (
    <div
      className="match-card"
      onClick={onView}
      style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(132,204,22,0.35)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = ''}
    >
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 60, textAlign: 'center' }}>
        {match.date ? formatDate(match.date) : 'Sin fecha'}
        {match.time && (
          <div style={{ fontSize: '0.72rem', color: 'var(--primary-light)', fontWeight: 700, marginTop: 1 }}>
            🕐 {match.time}
          </div>
        )}
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
          R{match.round || '?'}
        </div>
        {match.venue && (
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2, maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={match.venue}>
            📍 {match.venue}
          </div>
        )}
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
        <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => onEdit(match)} title="Editar resultado">✏️</button>
          <button className="btn btn-danger btn-sm btn-icon" onClick={() => onDelete(match.id)} title="Eliminar">🗑</button>
        </div>
      )}
      {/* Alinear — disponible para todos */}
      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[home, away].map(team => (
          <button
            key={team.id}
            onClick={() => onLineup(match, team)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(132,204,22,0.3)',
              background: 'rgba(132,204,22,0.08)', color: 'var(--primary-light)',
              fontWeight: 700, fontSize: '0.65rem', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
            title={`Alinear ${team.name}`}
          >
            {team.shield
              ? <img src={team.shield} style={{ width: 14, height: 14, objectFit: 'contain' }} alt="" />
              : <span style={{ fontSize: '0.6rem' }}>{getInitials(team.name)}</span>
            }
            ⬆
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Fixtures() {
  const { activeTournament, dispatch } = useTournament();
  const { isAdmin } = useAuth();
  const [editMatch, setEditMatch] = useState(null);
  const [editScores, setEditScores] = useState({ home: '', away: '', date: '', time: '', venue: '' });
  const [showAddMatch, setShowAddMatch] = useState(false);
  const [addForm, setAddForm] = useState({ homeId: '', awayId: '', date: '', time: '', venue: '', round: 1 });
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRound, setFilterRound] = useState('all');
  const [viewMatch, setViewMatch] = useState(null);
  const [lineupMatch, setLineupMatch] = useState(null);   // { match, team }

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
      time: match.time || '',
      venue: match.venue || '',
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
          time: editScores.time,
          venue: editScores.venue,
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
          time: addForm.time || '',
          venue: addForm.venue || '',
        },
      },
    });
    setAddForm({ homeId: '', awayId: '', date: '', time: '', venue: '', round: 1 });
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
                          onView={() => setViewMatch(m)}
                          onLineup={(match, team) => setLineupMatch({ match, team })}
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
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">🕐 Hora</label>
                    <input
                      type="time"
                      className="form-input"
                      value={editScores.time}
                      onChange={e => setEditScores(s => ({ ...s, time: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">📍 Cancha / Sede</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ej: Cancha Principal"
                      value={editScores.venue}
                      onChange={e => setEditScores(s => ({ ...s, venue: e.target.value }))}
                    />
                  </div>
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
                <label className="form-label">📅 Fecha</label>
                <input
                  type="date"
                  className="form-input"
                  value={addForm.date}
                  onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">🕐 Hora</label>
                <input
                  type="time"
                  className="form-input"
                  value={addForm.time}
                  onChange={e => setAddForm(f => ({ ...f, time: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">📍 Cancha / Sede</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Cancha Principal"
                  value={addForm.venue}
                  onChange={e => setAddForm(f => ({ ...f, venue: e.target.value }))}
                />
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Lineup Editor */}
      {lineupMatch && (
        <LineupEditor
          match={lineupMatch.match}
          tournament={activeTournament}
          team={lineupMatch.team}
          onClose={() => setLineupMatch(null)}
        />
      )}

      {/* Match Poster Modal */}
      {viewMatch && (() => {        const home = activeTournament.teams.find(t => t.id === viewMatch.homeId);
        const away = activeTournament.teams.find(t => t.id === viewMatch.awayId);
        return (
          <MatchPosterModal
            match={viewMatch}
            home={home}
            away={away}
            tournamentName={activeTournament.name}
            onClose={() => setViewMatch(null)}
          />
        );
      })()}
    </div>
  );
}
