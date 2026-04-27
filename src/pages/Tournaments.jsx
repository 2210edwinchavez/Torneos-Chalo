import { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { formatDate, getTeamColor } from '../utils/helpers';

const SPORTS = ['Fútbol', 'Baloncesto', 'Tenis', 'Voleibol', 'Béisbol', 'Otro'];
const SPORT_ICONS = {
  'Fútbol': '⚽', 'Baloncesto': '🏀', 'Tenis': '🎾',
  'Voleibol': '🏐', 'Béisbol': '⚾', 'Otro': '🏆',
};

const EMPTY_FORM = {
  name: '', sport: 'Fútbol', type: 'league',
  startDate: '', endDate: '', description: '', inscriptionFee: '',
  venue: '', matchFee: '', gameSystem: '', regulations: '', awards: '',
};

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
  const [showInfo, setShowInfo] = useState(false);

  const played = t.matches.filter(m => m.status === 'finished').length;

  const hasInfo = t.venue || t.matchFee > 0 || t.gameSystem || t.regulations || t.awards;

  return (
    <div
      className="card"
      style={{ border: isActive ? '1px solid rgba(99,102,241,0.4)' : undefined, position: 'relative' }}
    >
      {isActive && (
        <span style={{
          position: 'absolute', top: 12, right: 12,
          fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary-light)',
          background: 'rgba(99,102,241,0.15)', padding: '2px 8px', borderRadius: 99,
        }}>
          ACTIVO
        </span>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
        <div
          className="team-avatar"
          style={{ width: 48, height: 48, fontSize: '1.4rem', background: getTeamColor(i) + '22', color: getTeamColor(i), flexShrink: 0 }}
        >
          {SPORT_ICONS[t.sport] || '🏆'}
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
            💰 Inscripción: ${Number(t.inscriptionFee).toFixed(2)}
          </span>
        )}
        {t.matchFee > 0 && (
          <span className="pill" style={{ color: 'var(--secondary)', background: 'rgba(14,165,233,0.1)' }}>
            💵 Por partido: ${Number(t.matchFee).toFixed(2)}
          </span>
        )}
        {t.venue && (
          <span className="pill">
            📍 {t.venue}
          </span>
        )}
      </div>

      {/* Expandable info section */}
      {hasInfo && (
        <>
          <button
            className="btn btn-ghost w-full"
            style={{ justifyContent: 'space-between', padding: '7px 10px', marginBottom: showInfo ? 12 : 14, borderRadius: 8, border: '1px solid var(--border)' }}
            onClick={() => setShowInfo(v => !v)}
          >
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>📋 Información del torneo</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{showInfo ? '▲ Ocultar' : '▼ Ver todo'}</span>
          </button>

          {showInfo && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14, padding: '14px 14px 4px', background: 'var(--bg-card2)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <InfoRow icon="📍" label="Cancha / Sede" value={t.venue} />
              <InfoRow icon="💵" label="Valor por partido" value={t.matchFee > 0 ? `$${Number(t.matchFee).toFixed(2)}` : null} />
              <InfoRow icon="⚽" label="Sistema de juego" value={t.gameSystem} />
              <InfoRow icon="📜" label="Reglamento" value={t.regulations} />
              <InfoRow icon="🏅" label="Premiación" value={t.awards} />
            </div>
          )}
        </>
      )}

      {/* Actions */}
      <TournamentActions t={t} isActive={isActive} dispatch={dispatch} onEdit={onEdit} onDelete={onDelete} onToggleStatus={onToggleStatus} />
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
          📋 Información básica
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
      venue: t.venue || '', gameSystem: t.gameSystem || '',
      regulations: t.regulations || '', awards: t.awards || '',
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 16 }}>
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
