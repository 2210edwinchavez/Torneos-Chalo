import { useState, useRef } from 'react';
import { useTournament } from '../context/TournamentContext';
import { getTeamColor, getInitials } from '../utils/helpers';

/* ─── Formaciones ─── */
const FORMATIONS = {
  '4-4-2': {
    label: '4-4-2', slots: [
      { id: 0, role: 'PO', x: 50, y: 88 },
      { id: 1, role: 'LD', x: 80, y: 72 }, { id: 2, role: 'DC', x: 60, y: 74 }, { id: 3, role: 'DC', x: 40, y: 74 }, { id: 4, role: 'LI', x: 20, y: 72 },
      { id: 5, role: 'ED', x: 80, y: 50 }, { id: 6, role: 'MC', x: 60, y: 50 }, { id: 7, role: 'MC', x: 40, y: 50 }, { id: 8, role: 'EI', x: 20, y: 50 },
      { id: 9, role: 'DC', x: 62, y: 26 }, { id: 10, role: 'DC', x: 38, y: 26 },
    ],
  },
  '4-3-3': {
    label: '4-3-3', slots: [
      { id: 0, role: 'PO', x: 50, y: 88 },
      { id: 1, role: 'LD', x: 80, y: 72 }, { id: 2, role: 'DC', x: 60, y: 74 }, { id: 3, role: 'DC', x: 40, y: 74 }, { id: 4, role: 'LI', x: 20, y: 72 },
      { id: 5, role: 'MCD', x: 68, y: 52 }, { id: 6, role: 'MC', x: 50, y: 50 }, { id: 7, role: 'MCO', x: 32, y: 52 },
      { id: 8, role: 'ED', x: 78, y: 24 }, { id: 9, role: 'DC', x: 50, y: 18 }, { id: 10, role: 'EI', x: 22, y: 24 },
    ],
  },
  '4-2-3-1': {
    label: '4-2-3-1', slots: [
      { id: 0, role: 'PO', x: 50, y: 88 },
      { id: 1, role: 'LD', x: 80, y: 72 }, { id: 2, role: 'DC', x: 60, y: 74 }, { id: 3, role: 'DC', x: 40, y: 74 }, { id: 4, role: 'LI', x: 20, y: 72 },
      { id: 5, role: 'MCD', x: 64, y: 58 }, { id: 6, role: 'MCD', x: 36, y: 58 },
      { id: 7, role: 'ED', x: 74, y: 38 }, { id: 8, role: 'MCO', x: 50, y: 36 }, { id: 9, role: 'EI', x: 26, y: 38 },
      { id: 10, role: 'DC', x: 50, y: 18 },
    ],
  },
  '3-5-2': {
    label: '3-5-2', slots: [
      { id: 0, role: 'PO', x: 50, y: 88 },
      { id: 1, role: 'DC', x: 70, y: 74 }, { id: 2, role: 'DC', x: 50, y: 76 }, { id: 3, role: 'DC', x: 30, y: 74 },
      { id: 4, role: 'CAD', x: 88, y: 52 }, { id: 5, role: 'MC', x: 68, y: 50 }, { id: 6, role: 'MC', x: 50, y: 48 }, { id: 7, role: 'MC', x: 32, y: 50 }, { id: 8, role: 'CAI', x: 12, y: 52 },
      { id: 9, role: 'DC', x: 64, y: 24 }, { id: 10, role: 'DC', x: 36, y: 24 },
    ],
  },
  '5-3-2': {
    label: '5-3-2', slots: [
      { id: 0, role: 'PO', x: 50, y: 88 },
      { id: 1, role: 'CAD', x: 88, y: 66 }, { id: 2, role: 'DC', x: 70, y: 74 }, { id: 3, role: 'DC', x: 50, y: 76 }, { id: 4, role: 'DC', x: 30, y: 74 }, { id: 5, role: 'CAI', x: 12, y: 66 },
      { id: 6, role: 'MCD', x: 68, y: 48 }, { id: 7, role: 'MC', x: 50, y: 46 }, { id: 8, role: 'MCD', x: 32, y: 48 },
      { id: 9, role: 'DC', x: 64, y: 24 }, { id: 10, role: 'DC', x: 36, y: 24 },
    ],
  },
  '4-5-1': {
    label: '4-5-1', slots: [
      { id: 0, role: 'PO', x: 50, y: 88 },
      { id: 1, role: 'LD', x: 80, y: 72 }, { id: 2, role: 'DC', x: 60, y: 74 }, { id: 3, role: 'DC', x: 40, y: 74 }, { id: 4, role: 'LI', x: 20, y: 72 },
      { id: 5, role: 'ED', x: 85, y: 50 }, { id: 6, role: 'MC', x: 65, y: 48 }, { id: 7, role: 'MC', x: 50, y: 46 }, { id: 8, role: 'MC', x: 35, y: 48 }, { id: 9, role: 'EI', x: 15, y: 50 },
      { id: 10, role: 'DC', x: 50, y: 20 },
    ],
  },
};

/* ─── Helpers ─── */
function shortName(player) {
  if (!player) return '?';
  return `${player.firstName[0]}. ${player.lastName}`.slice(0, 14);
}

/* ─── LineupEditor Modal ─── */
export default function LineupEditor({ match, tournament, team, onClose }) {
  const { state, dispatch } = useTournament();

  const saved = state.lineups?.[match.id]?.[team.id] || {};
  const [formation, setFormation] = useState(saved.formation || '4-4-2');
  const [starters, setStarters] = useState(saved.starters || {}); // {slotIdx: playerId}
  const [convocados, setConvocados] = useState(saved.convocados || []); // playerIds en convocatoria
  const [activeSlot, setActiveSlot] = useState(null); // slot index being assigned
  const [playerSearch, setPlayerSearch] = useState('');
  const [downloading, setDownloading] = useState(false);
  const fieldRef = useRef(null);

  const slots = FORMATIONS[formation].slots;
  const color = getTeamColor(team.colorIndex);

  // Jugadores inscritos en el equipo
  const enrolled = (team.enrollments || [])
    .map(e => ({ enrollment: e, player: state.globalPlayers.find(p => p.id === e.playerId) }))
    .filter(x => x.player);

  // Titulares ya asignados como playerIds
  const starterIds = new Set(Object.values(starters));

  // Suplentes = convocados que no son titulares
  const subs = convocados.filter(id => !starterIds.has(id));

  // Jugadores disponibles para asignar (en convocatoria o todos los inscritos si convocatoria vacía)
  const pool = convocados.length > 0
    ? enrolled.filter(x => convocados.includes(x.player.id))
    : enrolled;

  const filteredPool = pool.filter(x => {
    const full = `${x.player.firstName} ${x.player.lastName} ${x.enrollment.shirtNumber}`.toLowerCase();
    return full.includes(playerSearch.toLowerCase());
  });

  function toggleConvocado(playerId) {
    setConvocados(prev => {
      if (prev.includes(playerId)) {
        // Quitar de convocatoria y de titulares
        setStarters(s => {
          const next = { ...s };
          Object.keys(next).forEach(k => { if (next[k] === playerId) delete next[k]; });
          return next;
        });
        return prev.filter(id => id !== playerId);
      }
      return [...prev, playerId];
    });
  }

  function assignSlot(playerId) {
    if (activeSlot === null) return;
    // Si ya tenía jugador en ese slot, lo liberamos
    setStarters(prev => {
      const next = { ...prev };
      // Si el jugador ya está en otro slot, lo quitamos de allí
      Object.keys(next).forEach(k => { if (next[k] === playerId) delete next[k]; });
      next[activeSlot] = playerId;
      return next;
    });
    // Asegurar que está en convocados
    setConvocados(prev => prev.includes(playerId) ? prev : [...prev, playerId]);
    setActiveSlot(null);
    setPlayerSearch('');
  }

  function clearSlot(slotId) {
    setStarters(prev => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
  }

  function saveLineup() {
    dispatch({
      type: 'UPDATE_LINEUP',
      payload: {
        matchId: match.id,
        teamId: team.id,
        lineup: { formation, starters, convocados },
      },
    });
  }

  async function loadImg(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  async function downloadImage() {
    setDownloading(true);
    const W = 900, H = 1100;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    // ── Fondo ──
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#071207');
    bg.addColorStop(1, '#0d1f0d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ── Cabecera ──
    ctx.fillStyle = 'rgba(132,204,22,0.1)';
    ctx.fillRect(0, 0, W, 130);
    ctx.strokeStyle = 'rgba(132,204,22,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, W, 130);

    // Logo (letra) + nombre torneo
    ctx.fillStyle = '#84cc16';
    ctx.font = 'bold 14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('⚽ TORNEOS JC SPORT', W / 2, 30);

    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = 'bold 18px system-ui';
    ctx.fillText(tournament.name.toUpperCase(), W / 2, 58);

    // Rival
    const opponent = tournament.teams.find(t => t.id === (match.homeId === team.id ? match.awayId : match.homeId));
    const isHome = match.homeId === team.id;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '13px system-ui';
    ctx.fillText(`${isHome ? 'LOCAL' : 'VISITA'} · Ronda ${match.round || '?'}`, W / 2, 80);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 15px system-ui';
    const matchLine = `${team.name} vs ${opponent?.name || '?'}`;
    ctx.fillText(matchLine, W / 2, 100);
    const infoParts = [match.date, match.time, match.venue].filter(Boolean);
    if (infoParts.length) {
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '12px system-ui';
      ctx.fillText(infoParts.join('   ·   '), W / 2, 120);
    }

    // ── Escudo del equipo ──
    const shieldImg = team.shield ? await loadImg(team.shield) : null;
    if (shieldImg) {
      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 18;
      ctx.drawImage(shieldImg, W / 2 - 30, 138, 60, 60);
      ctx.restore();
    } else {
      ctx.fillStyle = color + '44';
      ctx.beginPath();
      ctx.roundRect(W / 2 - 28, 138, 56, 56, 10);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.font = 'bold 22px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(getInitials(team.name), W / 2, 175);
    }
    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(team.name, W / 2, 214);
    ctx.fillStyle = color;
    ctx.font = 'bold 13px system-ui';
    ctx.fillText(`Formación: ${formation}`, W / 2, 232);

    // ── Campo de fútbol ──
    const FX = 60, FY = 248, FW = W - 120, FH = 600;
    // Césped
    const fieldGrad = ctx.createLinearGradient(FX, FY, FX, FY + FH);
    fieldGrad.addColorStop(0, '#1a5c1a');
    fieldGrad.addColorStop(0.5, '#1e6e1e');
    fieldGrad.addColorStop(1, '#1a5c1a');
    ctx.fillStyle = fieldGrad;
    ctx.beginPath();
    ctx.roundRect(FX, FY, FW, FH, 8);
    ctx.fill();

    // Franjas
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(FX, FY, FW, FH, 8);
    ctx.clip();
    for (let i = 0; i < FH; i += 40) {
      if (Math.floor(i / 40) % 2 === 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        ctx.fillRect(FX, FY + i, FW, 40);
      }
    }
    ctx.restore();

    // Líneas campo (blancas)
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    // Borde
    ctx.beginPath();
    ctx.roundRect(FX + 8, FY + 8, FW - 16, FH - 16, 4);
    ctx.stroke();
    // Línea media
    ctx.beginPath(); ctx.moveTo(FX + 8, FY + FH / 2); ctx.lineTo(FX + FW - 8, FY + FH / 2); ctx.stroke();
    // Círculo central
    ctx.beginPath(); ctx.arc(FX + FW / 2, FY + FH / 2, 55, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath(); ctx.arc(FX + FW / 2, FY + FH / 2, 3, 0, Math.PI * 2); ctx.fill();
    // Área grande arriba
    const agW = FW * 0.5, agH = FH * 0.13;
    ctx.beginPath(); ctx.rect(FX + (FW - agW) / 2, FY + 8, agW, agH); ctx.stroke();
    // Área pequeña arriba
    const apW = FW * 0.26, apH = FH * 0.055;
    ctx.beginPath(); ctx.rect(FX + (FW - apW) / 2, FY + 8, apW, apH); ctx.stroke();
    // Área grande abajo
    ctx.beginPath(); ctx.rect(FX + (FW - agW) / 2, FY + FH - 8 - agH, agW, agH); ctx.stroke();
    // Área pequeña abajo
    ctx.beginPath(); ctx.rect(FX + (FW - apW) / 2, FY + FH - 8 - apH, apW, apH); ctx.stroke();

    // ── Jugadores en el campo ──
    function drawPlayer(slot, player) {
      const px = FX + (slot.x / 100) * FW;
      const py = FY + (slot.y / 100) * FH;
      const R = 22;

      // Sombra
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 8;
      // Círculo del jugador
      ctx.fillStyle = player ? color : 'rgba(255,255,255,0.15)';
      ctx.beginPath(); ctx.arc(px, py, R, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(px, py, R, 0, Math.PI * 2); ctx.stroke();

      if (player) {
        // Número de camisa
        const enroll = team.enrollments.find(e => e.playerId === player.id);
        const num = enroll?.shirtNumber || '';
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${num ? 13 : 0}px system-ui`;
        ctx.textAlign = 'center';
        if (num) ctx.fillText(`#${num}`, px, py - 4);
        // Nombre
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px system-ui';
        ctx.fillText(player.lastName.slice(0, 10).toUpperCase(), px, py + (num ? 8 : 4));
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(slot.role, px, py + 4);
      }

      // Rol debajo del círculo
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath();
      ctx.roundRect(px - 16, py + R + 2, 32, 14, 4);
      ctx.fill();
      ctx.fillStyle = player ? color : 'rgba(255,255,255,0.4)';
      ctx.font = 'bold 9px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(slot.role, px, py + R + 12);
    }

    slots.forEach(slot => {
      const pid = starters[slot.id];
      const player = pid ? state.globalPlayers.find(p => p.id === pid) : null;
      drawPlayer(slot, player);
    });

    // ── Suplentes ──
    const subsY = FY + FH + 20;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.roundRect(FX, subsY, FW, 180, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(132,204,22,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#84cc16';
    ctx.font = 'bold 13px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('SUPLENTES', FX + 16, subsY + 22);

    const subPlayers = subs.map(id => state.globalPlayers.find(p => p.id === id)).filter(Boolean);
    const colW = FW / 4;
    subPlayers.forEach((p, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const sx = FX + 16 + col * colW;
      const sy = subsY + 38 + row * 36;
      const enroll = team.enrollments.find(e => e.playerId === p.id);
      const num = enroll?.shirtNumber ? `#${enroll.shirtNumber}` : '';

      ctx.fillStyle = color + '33';
      ctx.beginPath();
      ctx.roundRect(sx, sy, colW - 12, 28, 6);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.font = 'bold 10px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText(`${num} ${p.lastName.toUpperCase()}, ${p.firstName[0]}.`.slice(0, 20), sx + 8, sy + 18);
    });

    if (subPlayers.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Sin suplentes asignados', FX + FW / 2, subsY + 60);
    }

    // ── Pie de página ──
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('torneosjcsport.vercel.app', W / 2, H - 12);

    const link = document.createElement('a');
    link.download = `alineacion-${team.name}-${match.round || '1'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setDownloading(false);
  }

  const opponentTeam = tournament.teams.find(t =>
    t.id === (match.homeId === team.id ? match.awayId : match.homeId)
  );

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.88)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 960, margin: '0 auto',
          height: '100%', display: 'flex', flexDirection: 'column',
          background: 'var(--bg)', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
              {team.shield
                ? <img src={team.shield} style={{ width: 28, height: 28, objectFit: 'contain', verticalAlign: 'middle', marginRight: 8 }} alt="" />
                : null
              }
              Alineación — {team.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
              vs {opponentTeam?.name || '?'} · Ronda {match.round || '?'}{match.date ? ` · ${match.date}` : ''}{match.time ? ` · ${match.time}` : ''}{match.venue ? ` · ${match.venue}` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { saveLineup(); }}
              style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#0a0f0a', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
            >
              💾 Guardar
            </button>
            <button
              onClick={downloadImage}
              disabled={downloading}
              style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: downloading ? 'rgba(132,204,22,0.4)' : '#84cc16', color: '#0a0f0a', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
            >
              {downloading ? '⏳…' : '⬇ Descargar'}
            </button>
            <button onClick={onClose} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
          </div>
        </div>

        {/* Formaciones */}
        <div style={{ display: 'flex', gap: 6, padding: '10px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0, flexWrap: 'wrap' }}>
          {Object.keys(FORMATIONS).map(f => (
            <button
              key={f}
              onClick={() => setFormation(f)}
              style={{
                padding: '5px 14px', borderRadius: 99, border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: '0.78rem',
                background: formation === f ? color : 'rgba(255,255,255,0.07)',
                color: formation === f ? '#0a0f0a' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

          {/* Campo */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px 8px 8px', minWidth: 0 }}>
            <div
              ref={fieldRef}
              style={{
                flex: 1,
                position: 'relative',
                background: 'linear-gradient(180deg, #1a5c1a 0%, #1e6e1e 50%, #1a5c1a 100%)',
                borderRadius: 10,
                overflow: 'hidden',
                minHeight: 320,
              }}
            >
              {/* Franjas */}
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 38px, rgba(0,0,0,0.07) 38px, rgba(0,0,0,0.07) 76px)' }} />
              {/* Líneas SVG */}
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.45 }} viewBox="0 0 100 100" preserveAspectRatio="none">
                <rect x="3" y="2" width="94" height="96" fill="none" stroke="white" strokeWidth="0.5"/>
                <line x1="3" y1="50" x2="97" y2="50" stroke="white" strokeWidth="0.5"/>
                <circle cx="50" cy="50" r="13" fill="none" stroke="white" strokeWidth="0.5"/>
                <circle cx="50" cy="50" r="0.8" fill="white"/>
                <rect x="28" y="2" width="44" height="13" fill="none" stroke="white" strokeWidth="0.5"/>
                <rect x="37" y="2" width="26" height="5.5" fill="none" stroke="white" strokeWidth="0.5"/>
                <rect x="28" y="85" width="44" height="13" fill="none" stroke="white" strokeWidth="0.5"/>
                <rect x="37" y="91.5" width="26" height="5.5" fill="none" stroke="white" strokeWidth="0.5"/>
                <circle cx="50" cy="10" r="0.7" fill="white"/>
                <circle cx="50" cy="90" r="0.7" fill="white"/>
              </svg>

              {/* Slots de posiciones */}
              {slots.map(slot => {
                const pid = starters[slot.id];
                const player = pid ? state.globalPlayers.find(p => p.id === pid) : null;
                const isActive = activeSlot === slot.id;
                const enroll = pid ? team.enrollments.find(e => e.playerId === pid) : null;

                return (
                  <div
                    key={slot.id}
                    onClick={() => setActiveSlot(isActive ? null : slot.id)}
                    style={{
                      position: 'absolute',
                      left: `${slot.x}%`,
                      top: `${slot.y}%`,
                      transform: 'translate(-50%, -50%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                      cursor: 'pointer',
                      zIndex: 2,
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: isActive ? '#fff' : (player ? color : 'rgba(255,255,255,0.2)'),
                      border: `2px solid ${isActive ? color : (player ? '#fff' : 'rgba(255,255,255,0.6)')}`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      boxShadow: player ? `0 2px 10px ${color}88` : '0 2px 6px rgba(0,0,0,0.4)',
                      transition: 'all 0.15s',
                      position: 'relative',
                    }}>
                      {player && enroll?.shirtNumber && (
                        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: isActive ? color : '#0a0f0a', lineHeight: 1 }}>#{enroll.shirtNumber}</span>
                      )}
                      {!player && <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>{slot.role}</span>}
                      {player && !enroll?.shirtNumber && <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#0a0f0a' }}>{slot.role}</span>}

                      {/* Botón quitar */}
                      {player && (
                        <button
                          onClick={e => { e.stopPropagation(); clearSlot(slot.id); }}
                          style={{
                            position: 'absolute', top: -5, right: -5,
                            width: 14, height: 14, borderRadius: '50%',
                            background: 'var(--danger)', border: 'none', color: '#fff',
                            fontSize: '0.55rem', lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >✕</button>
                      )}
                    </div>
                    <div style={{
                      background: 'rgba(0,0,0,0.65)', borderRadius: 4, padding: '1px 4px',
                      fontSize: '0.55rem', fontWeight: 700,
                      color: player ? '#f1f5f9' : 'rgba(255,255,255,0.6)',
                      maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      textAlign: 'center',
                    }}>
                      {player ? player.lastName.slice(0, 9).toUpperCase() : '+'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Suplentes */}
            {subs.length > 0 && (
              <div style={{ marginTop: 8, flexShrink: 0 }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Suplentes ({subs.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {subs.map(id => {
                    const p = state.globalPlayers.find(pl => pl.id === id);
                    if (!p) return null;
                    const e = team.enrollments.find(en => en.playerId === id);
                    return (
                      <div key={id} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: 'rgba(255,255,255,0.07)', borderRadius: 99,
                        padding: '3px 8px', fontSize: '0.72rem',
                        border: '1px solid rgba(255,255,255,0.12)',
                      }}>
                        <span style={{ color: color, fontWeight: 800 }}>{e?.shirtNumber ? `#${e.shirtNumber}` : ''}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{p.lastName}, {p.firstName[0]}.</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Panel derecho: jugadores */}
          <div style={{ width: 220, flexShrink: 0, borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                {activeSlot !== null
                  ? `Asignar → ${slots.find(s => s.id === activeSlot)?.role}`
                  : `Convocatoria (${convocados.length})`}
              </div>
              <input
                className="form-input"
                placeholder="Buscar jugador…"
                style={{ fontSize: '0.78rem', padding: '6px 10px' }}
                value={playerSearch}
                onChange={e => setPlayerSearch(e.target.value)}
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
              {activeSlot !== null ? (
                // Modo asignación: muestra jugadores disponibles
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '4px 4px 8px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                    Selecciona un jugador para la posición <strong style={{ color: color }}>{slots.find(s => s.id === activeSlot)?.role}</strong>
                  </div>
                  {filteredPool.map(({ player, enrollment }) => {
                    const isStarter = starterIds.has(player.id);
                    return (
                      <button
                        key={player.id}
                        onClick={() => assignSlot(player.id)}
                        disabled={isStarter && starters[activeSlot] !== player.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '7px 8px', borderRadius: 8, border: '1px solid var(--border)',
                          background: isStarter ? 'rgba(132,204,22,0.08)' : 'var(--bg-card2)',
                          cursor: isStarter && starters[activeSlot] !== player.id ? 'not-allowed' : 'pointer',
                          opacity: isStarter && starters[activeSlot] !== player.id ? 0.5 : 1,
                          textAlign: 'left', width: '100%',
                        }}
                      >
                        {player.photo
                          ? <img src={player.photo} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
                          : <div style={{ width: 28, height: 28, borderRadius: '50%', background: color + '33', color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, flexShrink: 0 }}>{getInitials(`${player.firstName} ${player.lastName}`)}</div>
                        }
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {enrollment.shirtNumber && <span style={{ color, marginRight: 3 }}>#{enrollment.shirtNumber}</span>}
                            {player.lastName}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{player.firstName}</div>
                        </div>
                        {isStarter && <span style={{ fontSize: '0.6rem', color, fontWeight: 700 }}>✓</span>}
                      </button>
                    );
                  })}
                  {filteredPool.length === 0 && enrolled.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', padding: '20px 0' }}>
                      Este equipo no tiene jugadores inscritos
                    </div>
                  )}
                </div>
              ) : (
                // Modo convocatoria: seleccionar quiénes van a la convocatoria
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '4px 4px 8px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                    Marca los convocados · luego haz clic en un slot del campo para asignar
                  </div>
                  {enrolled.filter(x => {
                    const full = `${x.player.firstName} ${x.player.lastName} ${x.enrollment.shirtNumber}`.toLowerCase();
                    return full.includes(playerSearch.toLowerCase());
                  }).map(({ player, enrollment }) => {
                    const inConv = convocados.includes(player.id);
                    const isStarter = starterIds.has(player.id);
                    return (
                      <button
                        key={player.id}
                        onClick={() => toggleConvocado(player.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '7px 8px', borderRadius: 8,
                          border: `1px solid ${inConv ? (isStarter ? color : 'rgba(132,204,22,0.3)') : 'var(--border)'}`,
                          background: inConv ? (isStarter ? color + '22' : 'rgba(132,204,22,0.06)') : 'var(--bg-card2)',
                          cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s',
                        }}
                      >
                        {player.photo
                          ? <img src={player.photo} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
                          : <div style={{ width: 28, height: 28, borderRadius: '50%', background: color + '33', color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, flexShrink: 0 }}>{getInitials(`${player.firstName} ${player.lastName}`)}</div>
                        }
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {enrollment.shirtNumber && <span style={{ color, marginRight: 3 }}>#{enrollment.shirtNumber}</span>}
                            {player.lastName}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{player.firstName}</div>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: inConv ? color : 'var(--text-muted)', fontWeight: 700 }}>
                          {isStarter ? '⬆️' : inConv ? '✓' : '+'}
                        </span>
                      </button>
                    );
                  })}
                  {enrolled.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', padding: '20px 0' }}>
                      Este equipo no tiene jugadores inscritos
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stats rápidas */}
            <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: 8, fontSize: '0.72rem' }}>
                <div style={{ flex: 1, background: 'var(--bg-card2)', borderRadius: 6, padding: '4px 6px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, color: color }}>{Object.keys(starters).length}</div>
                  <div style={{ color: 'var(--text-muted)' }}>Titulares</div>
                </div>
                <div style={{ flex: 1, background: 'var(--bg-card2)', borderRadius: 6, padding: '4px 6px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>{subs.length}</div>
                  <div style={{ color: 'var(--text-muted)' }}>Suplentes</div>
                </div>
                <div style={{ flex: 1, background: 'var(--bg-card2)', borderRadius: 6, padding: '4px 6px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>{convocados.length}</div>
                  <div style={{ color: 'var(--text-muted)' }}>Convoc.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
