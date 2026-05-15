import { useState, useRef, useEffect, useCallback } from 'react';
import { useTournament } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import Modal from '../components/Modal';
import TournamentShieldThumb from '../components/TournamentShieldThumb';
import { formatDate, compressImage, getInitials, getTeamColor } from '../utils/helpers';
import { loadTeamSubmissions, updateTeamSubmissionStatus, supabaseConfigured, saveTournamentToken, deactivateTournamentToken } from '../lib/supabase';

const SPORTS = ['Fútbol', 'Baloncesto', 'Tenis', 'Voleibol', 'Béisbol', 'Otro'];
const SPORT_ICONS = {
  'Fútbol': '⚽', 'Baloncesto': '🏀', 'Tenis': '🎾',
  'Voleibol': '🏐', 'Béisbol': '⚾', 'Otro': '🏆',
};

const EMPTY_FORM = {
  name: '', sport: 'Fútbol', type: 'league',
  startDate: '', endDate: '', description: '', inscriptionFee: '',
  playerLimit: '25',
  venue: '', matchFee: '', gameSystem: '', regulations: '', awards: '',
  shield: null,
};

/* ─── Escudo del torneo (subida) ─── */
function TournamentShieldPicker({ value, onChange }) {
  const inputRef = useRef(null);

  function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Solo imágenes (JPG, PNG, WEBP, SVG).');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      alert('El escudo no puede superar 4 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async e => onChange(await compressImage(e.target.result, 300, 0.75));
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files[0])}
      />
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          handleFile(e.dataTransfer.files[0]);
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          padding: value ? 16 : 22,
          borderRadius: 12,
          border: `2px ${value ? 'solid' : 'dashed'} ${value ? 'var(--primary)' : 'var(--border)'}`,
          background: value ? 'rgba(132,204,22,0.06)' : 'var(--bg-card2)',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {value ? (
          <>
            <img
              src={value}
              alt=""
              style={{
                width: 96,
                height: 96,
                objectFit: 'contain',
                borderRadius: 8,
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
              }}
            />
            <div style={{ fontSize: '0.78rem', color: 'var(--primary-light)', fontWeight: 600 }}>
              Escudo cargado · haz clic o arrastra otro archivo
            </div>
          </>
        ) : (
          <>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'var(--bg-card)',
              border: '2px dashed var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
            }}
            >
              🏆
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 3 }}>
                Sube el logo del torneo
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Aparecerá en la tarjeta, menú y cabeceras · JPG, PNG, WEBP, SVG · máx 4 MB
              </div>
            </div>
          </>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={e => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
        >
          📁 Elegir archivo
        </button>
        {value && (
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={e => {
              e.stopPropagation();
              onChange(null);
            }}
          >
            Quitar imagen
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Info row inside card ─── */
function InfoRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {value}
        </div>
      </div>
    </div>
  );
}

/* ─── Tournament Card ─── */
function TournamentCard({ t, i, isActive, dispatch, onEdit, onDelete, onToggleStatus }) {
  const { formatMoney } = useCurrency();
  const { isAdmin } = useAuth();
  const [showInfo, setShowInfo] = useState(false);
  const [showTeamRegLink, setShowTeamRegLink] = useState(false);

  const played = t.matches.filter(m => m.status === 'finished').length;

  function toggleShieldInfo(e) {
    e.preventDefault();
    setShowInfo(v => !v);
  }

  return (
    <div
      className="card"
      style={{ border: isActive ? '1px solid rgba(132,204,22,0.4)' : undefined, position: 'relative' }}
    >
      {isActive && (
        <span style={{
          position: 'absolute', top: 12, right: 12,
          fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary-light)',
          background: 'rgba(132,204,22,0.15)', padding: '2px 8px', borderRadius: 99,
        }}>
          ACTIVO
        </span>
      )}

      {/* Header — clic en escudo muestra/oculta toda la información del torneo */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, gap: 4 }}>
          <button
            type="button"
            className="tournament-card-shield-btn"
            aria-label={showInfo ? 'Ocultar información del torneo' : 'Ver información del torneo'}
            aria-expanded={showInfo}
            onClick={toggleShieldInfo}
          >
            <TournamentShieldThumb shield={t.shield} sport={t.sport} colorIndex={i} size={48} />
          </button>
          {!t.shield && isAdmin && (
            <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--primary-light)', textAlign: 'center', lineHeight: 1.25, maxWidth: 72 }}>
              Sin logo · Editar
            </span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingRight: isActive ? 60 : 0 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 6 }}>
            {t.name}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className={`badge ${t.status === 'active' ? 'badge-active' : 'badge-finished'}`}>
              {t.status === 'active' ? '● Activo' : '■ Finalizado'}
            </span>
            <span className={`badge ${t.type === 'league' ? 'badge-league' : 'badge-knockout'}`}>
              {t.type === 'league' ? 'Liga' : 'Eliminación'}
            </span>
            <span className="badge" style={{ background: 'var(--bg-card2)', color: 'var(--text-secondary)' }}>
              {t.sport}
            </span>
          </div>
        </div>
      </div>

      {t.description && (
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 12, fontStyle: 'italic' }}>
          {t.description}
        </p>
      )}

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Equipos', value: t.teams.length, icon: '👥' },
          { label: 'Partidos', value: t.matches.length, icon: '📅' },
          { label: 'Jugados', value: played, icon: '✅' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card2)', borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick info pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {(t.startDate || t.endDate) && (
          <span className="pill">
            📅 {t.startDate ? formatDate(t.startDate) : '?'} → {t.endDate ? formatDate(t.endDate) : '?'}
          </span>
        )}
        {t.inscriptionFee > 0 && (
          <span className="pill" style={{ color: 'var(--accent)', background: 'rgba(245,158,11,0.1)' }}>
            💰 Inscripción: {formatMoney(t.inscriptionFee)}
          </span>
        )}
        {t.matchFee > 0 && (
          <span className="pill" style={{ color: 'var(--secondary)', background: 'rgba(34,197,94,0.1)' }}>
            💵 Por partido: {formatMoney(t.matchFee)}
          </span>
        )}
        {t.venue && (
          <span className="pill">
            📍 {t.venue}
          </span>
        )}
      </div>

      {/* Información ampliable — también se abre con clic en el escudo */}
      <button
        type="button"
        className="btn btn-ghost w-full"
        style={{ justifyContent: 'space-between', padding: '7px 10px', marginBottom: showInfo ? 12 : 14, borderRadius: 8, border: '1px solid var(--border)' }}
        aria-expanded={showInfo}
        onClick={() => setShowInfo(v => !v)}
      >
        <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>📋 Información del torneo</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{showInfo ? '▲ Ocultar' : '▼ Ver todo'}</span>
      </button>

      {showInfo && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14, padding: '14px 14px 4px', background: 'var(--bg-card2)', borderRadius: 10, border: '1px solid var(--border)' }}>
          <InfoRow
            icon="📅"
            label="Fechas"
            value={
              [t.startDate && formatDate(t.startDate), t.endDate ? formatDate(t.endDate) : null].filter(Boolean).join(' → ') || null
            }
          />
          <InfoRow
            icon="💰"
            label="Valor inscripción"
            value={t.inscriptionFee > 0 ? formatMoney(t.inscriptionFee) : null}
          />
          <InfoRow
            icon="💵"
            label="Valor por partido"
            value={t.matchFee > 0 ? formatMoney(t.matchFee) : null}
          />
          <InfoRow icon="👥" label="Cupo jugadores por equipo" value={t.playerLimit != null && Number(t.playerLimit) > 0 ? String(Number(t.playerLimit)) : null} />
          <InfoRow icon="📝" label="Descripción" value={t.description} />
          <InfoRow icon="📍" label="Cancha / Sede" value={t.venue} />
          <InfoRow icon="⚽" label="Sistema de juego" value={t.gameSystem} />
          <InfoRow icon="📜" label="Reglamento" value={t.regulations} />
          <InfoRow icon="🏅" label="Premiación" value={t.awards} />
        </div>
      )}

      {/* Enlace de inscripción de equipos */}
      {isAdmin && (
        <button
          className="btn btn-secondary w-full"
          style={{ justifyContent: 'space-between', padding: '8px 12px', marginBottom: 10, position: 'relative' }}
          onClick={() => setShowTeamRegLink(true)}
        >
          <span>🔗 Enlace inscripción de equipos</span>
          {t.teamRegistrationActive && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--success)', fontWeight: 700 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
              Activo
            </span>
          )}
        </button>
      )}

      {/* Actions */}
      <TournamentActions t={t} isActive={isActive} dispatch={dispatch} onEdit={onEdit} onDelete={onDelete} onToggleStatus={onToggleStatus} />

      {showTeamRegLink && (
        <TeamRegistrationLinkModal
          tournament={t}
          dispatch={dispatch}
          onClose={() => setShowTeamRegLink(false)}
        />
      )}
    </div>
  );
}

/* ─── Actions (admin only) ─── */
function TournamentActions({ t, isActive, dispatch, onEdit, onDelete, onToggleStatus }) {
  const { isAdmin } = useAuth();
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {!isActive && (
        <button className="btn btn-primary btn-sm" onClick={() => dispatch({ type: 'SET_ACTIVE_TOURNAMENT', payload: t.id })}>
          Seleccionar
        </button>
      )}
      {isAdmin && (
        <>
          <button className="btn btn-secondary btn-sm" onClick={() => onEdit(t)}>✏️ Editar</button>
          <button className="btn btn-ghost btn-sm" onClick={() => onToggleStatus(t)}>
            {t.status === 'active' ? '⏹ Finalizar' : '▶ Reactivar'}
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => onDelete(t)}>🗑</button>
        </>
      )}
    </div>
  );
}

/* ─── Tournament Form Modal ─── */
function TournamentModal({ editId, form, setForm, onClose, onSubmit }) {
  const [tab, setTab] = useState('basic');

  return (
    <Modal
      title={editId ? 'Editar torneo' : 'Nuevo torneo'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={onSubmit}>
            {editId ? 'Guardar cambios' : 'Crear torneo'}
          </button>
        </>
      }
    >
      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab${tab === 'basic' ? ' active' : ''}`} onClick={() => setTab('basic')}>
          📋 Datos · logo
        </button>
        <button className={`tab${tab === 'details' ? ' active' : ''}`} onClick={() => setTab('details')}>
          🏟️ Detalles del torneo
        </button>
      </div>

      <form onSubmit={onSubmit}>
        {/* ── Tab: Basic ── */}
        {tab === 'basic' && (
          <>
            <div className="form-group">
              <label className="form-label">Logo / escudo del torneo</label>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                Opcional. Si no subes una imagen, se usará el icono del deporte en la lista y menús.
              </div>
              <TournamentShieldPicker
                value={form.shield}
                onChange={shield => setForm(f => ({ ...f, shield }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nombre del torneo *</label>
              <input
                className="form-input"
                placeholder="Ej: Copa de Verano 2026"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                autoFocus
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Deporte</label>
                <select className="form-input" value={form.sport} onChange={e => setForm(f => ({ ...f, sport: e.target.value }))}>
                  {SPORTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Formato</label>
                <select className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="league">Liga (round-robin)</option>
                  <option value="knockout">Eliminación directa</option>
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Fecha de inicio</label>
                <input type="date" className="form-input" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha de fin</label>
                <input type="date" className="form-input" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Cuota de inscripción / jugador ($)</label>
                <input
                  type="number" min="0" step="0.01"
                  className="form-input" placeholder="0.00"
                  value={form.inscriptionFee}
                  onChange={e => setForm(f => ({ ...f, inscriptionFee: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Valor por partido ($)</label>
                <input
                  type="number" min="0" step="0.01"
                  className="form-input" placeholder="0.00"
                  value={form.matchFee}
                  onChange={e => setForm(f => ({ ...f, matchFee: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">👥 Límite de jugadores por equipo</label>
              <input
                type="number" min="1" max="100"
                className="form-input" placeholder="25"
                value={form.playerLimit}
                onChange={e => setForm(f => ({ ...f, playerLimit: e.target.value }))}
              />
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Máximo de jugadores que se pueden inscribir por equipo. Por defecto: 25.
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Descripción general</label>
              <textarea
                className="form-input" rows={2}
                placeholder="Breve descripción del torneo…"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
          </>
        )}

        {/* ── Tab: Details ── */}
        {tab === 'details' && (
          <>
            <div className="form-group">
              <label className="form-label">📍 Cancha / Sede</label>
              <input
                className="form-input"
                placeholder="Ej: Estadio Municipal, Cancha Norte, Polideportivo…"
                value={form.venue}
                onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">⚽ Sistema de juego</label>
              <textarea
                className="form-input" rows={3}
                placeholder={`Ej: Todos contra todos en fase de grupos.\n3 puntos por victoria, 1 por empate, 0 por derrota.\nClasifican los 2 primeros de cada grupo.`}
                value={form.gameSystem}
                onChange={e => setForm(f => ({ ...f, gameSystem: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">📜 Reglamento</label>
              <textarea
                className="form-input" rows={4}
                placeholder={`Ej:\n- Partidos de 2 tiempos de 45 minutos.\n- Máximo 3 refuerzos por equipo.\n- Tarjeta roja = 1 fecha de suspensión.\n- Jugadores deben presentar cédula antes del partido.`}
                value={form.regulations}
                onChange={e => setForm(f => ({ ...f, regulations: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">🏅 Premiación</label>
              <textarea
                className="form-input" rows={3}
                placeholder={`Ej:\n🥇 1er lugar: Trofeo + $500.000\n🥈 2do lugar: Medallas + $200.000\n🥉 3er lugar: Medallas\n⭐ Goleador del torneo: Premio especial`}
                value={form.awards}
                onChange={e => setForm(f => ({ ...f, awards: e.target.value }))}
              />
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}

/* ─── Modal de enlace de inscripción de equipos ─── */
function TeamRegistrationLinkModal({ tournament, dispatch, onClose }) {
  const [copyOk, setCopyOk] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const link = tournament.teamRegistrationToken
    ? `${appUrl}/unirse/${tournament.teamRegistrationToken}`
    : null;

  function generateToken() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  async function handleActivate() {
    const token = tournament.teamRegistrationToken || generateToken();
    dispatch({
      type: 'UPDATE_TOURNAMENT',
      payload: { id: tournament.id, data: { teamRegistrationToken: token, teamRegistrationActive: true } },
    });
    await saveTournamentToken({
      token,
      tournamentId: tournament.id,
      name: tournament.name,
      sport: tournament.sport,
      type: tournament.type,
      playerLimit: tournament.playerLimit || 30,
    });
  }

  async function handleDeactivate() {
    dispatch({
      type: 'UPDATE_TOURNAMENT',
      payload: { id: tournament.id, data: { teamRegistrationActive: false } },
    });
    if (tournament.teamRegistrationToken) {
      await deactivateTournamentToken(tournament.teamRegistrationToken);
    }
  }

  async function handleNewToken() {
    if (!confirm('¿Generar un enlace nuevo? El anterior dejará de funcionar.')) return;
    const newToken = generateToken();
    if (tournament.teamRegistrationToken) {
      await deactivateTournamentToken(tournament.teamRegistrationToken);
    }
    dispatch({
      type: 'UPDATE_TOURNAMENT',
      payload: { id: tournament.id, data: { teamRegistrationToken: newToken, teamRegistrationActive: true } },
    });
    await saveTournamentToken({
      token: newToken,
      tournamentId: tournament.id,
      name: tournament.name,
      sport: tournament.sport,
      type: tournament.type,
      playerLimit: tournament.playerLimit || 30,
    });
  }

  async function handleCopy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopyOk(true);
    setTimeout(() => setCopyOk(false), 2000);
  }

  const loadSubs = useCallback(async () => {
    if (!tournament.teamRegistrationToken || !supabaseConfigured) return;
    setLoading(true);
    const data = await loadTeamSubmissions(tournament.teamRegistrationToken);
    setSubmissions(data);
    setLoading(false);
  }, [tournament.teamRegistrationToken]);

  useEffect(() => { loadSubs(); }, [loadSubs]);

  const pending = submissions.filter(s => s.status === 'pending');
  const approved = submissions.filter(s => s.status === 'approved');
  const rejected = submissions.filter(s => s.status === 'rejected');

  async function handleApprove(sub) {
    setProcessingId(sub.id);
    dispatch({
      type: 'APPROVE_TEAM_SUBMISSION',
      payload: {
        tournamentId: tournament.id,
        teamData: sub.team_data,
        inscriptionFee: tournament.inscriptionFee || 0,
      },
    });
    await updateTeamSubmissionStatus(sub.id, 'approved');
    setSubmissions(prev => prev.filter(s => s.id !== sub.id));
    setProcessingId(null);
  }

  async function handleReject(sub) {
    setProcessingId(sub.id);
    await updateTeamSubmissionStatus(sub.id, 'rejected');
    setSubmissions(prev => prev.filter(s => s.id !== sub.id));
    setProcessingId(null);
  }

  return (
    <Modal
      title={`Inscripción de equipos — ${tournament.name}`}
      onClose={onClose}
      footer={<button className="btn btn-secondary" onClick={onClose}>Cerrar</button>}
    >
      {/* Estado del enlace */}
      <div style={{
        padding: '14px 16px', borderRadius: 12, marginBottom: 18,
        background: tournament.teamRegistrationActive ? 'rgba(16,185,129,0.07)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${tournament.teamRegistrationActive ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
          background: tournament.teamRegistrationActive ? 'var(--success)' : 'var(--text-muted)',
          boxShadow: tournament.teamRegistrationActive ? '0 0 8px var(--success)' : 'none',
        }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
            {tournament.teamRegistrationActive ? 'Enlace activo' : tournament.teamRegistrationToken ? 'Enlace desactivado' : 'Sin enlace generado'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {tournament.teamRegistrationActive
              ? 'Cualquier persona con el enlace puede inscribir su equipo.'
              : 'Activa el enlace para recibir inscripciones de equipos.'}
          </div>
        </div>
        {tournament.teamRegistrationActive
          ? <button className="btn btn-danger btn-sm" onClick={handleDeactivate}>Desactivar</button>
          : <button className="btn btn-success btn-sm" onClick={handleActivate}>Activar</button>
        }
      </div>

      {/* Enlace */}
      {link && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.06em' }}>
            Enlace para compartir
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{
              flex: 1, padding: '9px 12px', borderRadius: 8,
              background: 'var(--bg-card2)', border: '1px solid var(--border)',
              fontSize: '0.75rem', color: 'var(--text-secondary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              userSelect: 'all', fontFamily: 'monospace',
            }}>
              {link}
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleCopy} style={{ flexShrink: 0 }}>
              {copyOk ? '✓ Copiado' : '📋 Copiar'}
            </button>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }} onClick={handleNewToken}>
            🔄 Generar enlace nuevo
          </button>
          {link.includes('localhost') && (
            <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', fontSize: '0.75rem', color: 'var(--warning)' }}>
              ⚠️ El enlace usa "localhost" — solo funciona en este equipo. En producción usa la URL de Vercel.
            </div>
          )}
        </div>
      )}

      {/* Solicitudes pendientes */}
      {supabaseConfigured && tournament.teamRegistrationToken && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Equipos pendientes de aprobación
              {pending.length > 0 && (
                <span style={{ marginLeft: 6, padding: '1px 7px', borderRadius: 99, background: 'rgba(245,158,11,0.2)', color: 'var(--warning)', fontSize: '0.7rem', fontWeight: 800 }}>
                  {pending.length}
                </span>
              )}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.72rem' }} onClick={loadSubs} disabled={loading}>
              {loading ? '⏳' : '🔄'}
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>Cargando…</div>
          ) : pending.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>No hay solicitudes pendientes</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pending.map(sub => {
                const td = sub.team_data;
                return (
                  <div key={sub.id} style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg-card2)', border: '1px solid rgba(245,158,11,0.25)' }}>
                    {/* Team header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      {td.shield
                        ? <img src={td.shield} style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 8, flexShrink: 0 }} alt="" />
                        : <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>🛡️</div>
                      }
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{td.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {td.coach && <span>👔 {td.coach}</span>}
                          {td.city && <span>📍 {td.city}</span>}
                          {(td.players || []).length > 0 && <span>👥 {td.players.length} jugadores</span>}
                        </div>
                      </div>
                    </div>

                    {/* Players preview */}
                    {(td.players || []).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                        {td.players.slice(0, 10).map((p, i) => (
                          <span key={i} style={{ fontSize: '0.68rem', background: 'var(--bg-card)', borderRadius: 99, padding: '2px 8px', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                            {p.shirtNumber ? `#${p.shirtNumber} ` : ''}{p.firstName} {p.lastName}
                          </span>
                        ))}
                        {td.players.length > 10 && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>+{td.players.length - 10} más</span>}
                      </div>
                    )}

                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                      {new Date(sub.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-success btn-sm" style={{ flex: 1 }} disabled={processingId === sub.id} onClick={() => handleApprove(sub)}>
                        ✓ Aprobar e inscribir equipo
                      </button>
                      <button className="btn btn-danger btn-sm" disabled={processingId === sub.id} onClick={() => handleReject(sub)}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {(approved.length > 0 || rejected.length > 0) && (
            <div style={{ marginTop: 10, fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
              {approved.length > 0 && <span>✓ {approved.length} aprobado{approved.length !== 1 ? 's' : ''}</span>}
              {rejected.length > 0 && <span>✕ {rejected.length} rechazado{rejected.length !== 1 ? 's' : ''}</span>}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

/* ─── Main Page ─── */
export default function Tournaments() {
  const { state, dispatch, activeTournament } = useTournament();
  const { isAdmin } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = state.tournaments.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowCreate(true);
  }

  function openEdit(t) {
    setForm({
      name: t.name, sport: t.sport, type: t.type,
      startDate: t.startDate, endDate: t.endDate, description: t.description || '',
      inscriptionFee: t.inscriptionFee || '', matchFee: t.matchFee || '',
      playerLimit: t.playerLimit || '25',
      venue: t.venue || '', gameSystem: t.gameSystem || '',
      regulations: t.regulations || '', awards: t.awards || '',
      shield: t.shield || null,
    });
    setEditId(t.id);
    setShowCreate(true);
  }

  function handleSubmit(e) {
    e?.preventDefault();
    if (!form.name.trim()) return;
    const data = {
      ...form,
      inscriptionFee: Number(form.inscriptionFee) || 0,
      matchFee: Number(form.matchFee) || 0,
    };
    if (editId) {
      dispatch({ type: 'UPDATE_TOURNAMENT', payload: { id: editId, data } });
    } else {
      dispatch({ type: 'ADD_TOURNAMENT', payload: data });
    }
    setShowCreate(false);
  }

  function handleDelete(id) {
    dispatch({ type: 'DELETE_TOURNAMENT', payload: id });
    setDeleteConfirm(null);
  }

  function toggleStatus(t) {
    dispatch({
      type: 'UPDATE_TOURNAMENT',
      payload: { id: t.id, data: { status: t.status === 'active' ? 'finished' : 'active' } },
    });
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Torneos</div>
          <div className="page-subtitle">
            {state.tournaments.length} torneo{state.tournaments.length !== 1 ? 's' : ''} creados
          </div>
        </div>
        {isAdmin && <button className="btn btn-primary btn-lg" onClick={openCreate}>+ Nuevo torneo</button>}
      </div>

      {state.tournaments.length > 3 && (
        <div className="search-bar mb-24" style={{ maxWidth: 320 }}>
          <span className="search-icon">🔍</span>
          <input className="form-input" placeholder="Buscar torneo…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏆</div>
          <h3>No hay torneos aún</h3>
          <p>Crea tu primer torneo para comenzar a gestionar competencias.</p>
          {isAdmin && <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={openCreate}>+ Crear torneo</button>}
        </div>
      ) : (
        <div className="tournaments-grid-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 16 }}>
          {filtered.map((t, i) => (
            <TournamentCard
              key={t.id}
              t={t}
              i={i}
              isActive={t.id === activeTournament?.id}
              dispatch={dispatch}
              onEdit={openEdit}
              onDelete={setDeleteConfirm}
              onToggleStatus={toggleStatus}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showCreate && (
        <TournamentModal
          editId={editId}
          form={form}
          setForm={setForm}
          onClose={() => setShowCreate(false)}
          onSubmit={handleSubmit}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <Modal
          title="Eliminar torneo"
          onClose={() => setDeleteConfirm(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Eliminar</button>
            </>
          }
        >
          <p style={{ color: 'var(--text-secondary)' }}>
            ¿Eliminar el torneo <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm.name}</strong>?
            Se eliminarán todos sus equipos y partidos. Esta acción no se puede deshacer.
          </p>
        </Modal>
      )}
    </div>
  );
}
