import { useState, useRef } from 'react';
import { useTournament, findAllEnrollments, getPaymentStatus } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { getInitials, getTeamColor, formatDate } from '../utils/helpers';

const EMPTY_FORM = { firstName: '', lastName: '', docNumber: '', birthDate: '', photo: null };

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
      <div
        className={`photo-upload-area${value ? ' has-photo' : ''}`}
        onClick={() => inputRef.current.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
      >
        {value ? (
          <>
            <img src={value} className="photo-preview" alt="Foto" />
            <div style={{ fontSize: '0.78rem', color: 'var(--primary-light)', fontWeight: 600 }}>Haz clic para cambiar</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '2.2rem', marginBottom: 6 }}>📷</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 3 }}>Subir foto</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Arrastra o haz clic · JPG, PNG · máx 3 MB</div>
          </>
        )}
      </div>
      {value && (
        <button type="button" className="btn btn-danger btn-sm" style={{ marginTop: 6, width: '100%' }}
          onClick={() => onChange(null)}>Quitar foto</button>
      )}
    </div>
  );
}

/* ─── Player row ─── */
function PlayerRow({ player, enrollments, onDelete, onEdit }) {
  const age = player.birthDate
    ? Math.floor((Date.now() - new Date(player.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <tr>
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
              {enrollments.map(({ tournament, team, enrollment }) => {
                const status = getPaymentStatus(enrollment.payment);
                return (
                  <div key={enrollment.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div className="team-avatar" style={{ width: 22, height: 22, fontSize: '0.6rem', fontWeight: 800, background: getTeamColor(team.colorIndex) + '33', color: getTeamColor(team.colorIndex) }}>
                      {getInitials(team.name)}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{team.name}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>·</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{tournament.name}</span>
                  </div>
                );
              })}
            </div>
        }
      </td>
      <td>
        {enrollments.length === 0
          ? <span className="badge badge-finished">Libre</span>
          : enrollments.map(({ enrollment }) => {
              const status = getPaymentStatus(enrollment.payment);
              return (
                <span key={enrollment.id} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 8px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
                  background: status.color + '22', color: status.color,
                  border: `1px solid ${status.color}44`,
                }}>
                  {status.pct === 100 ? '✓' : '○'} {status.label}
                </span>
              );
            })
        }
      </td>
      <AdminPlayerActions player={player} enrollments={enrollments} onEdit={onEdit} onDelete={onDelete} />
    </tr>
  );
}

function AdminPlayerActions({ player, enrollments, onEdit, onDelete }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <td />;
  return (
    <td>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => onEdit(player)} title="Editar">✏️</button>
        {enrollments.length === 0 && (
          <button className="btn btn-danger btn-sm btn-icon" onClick={() => onDelete(player.id)} title="Eliminar">🗑</button>
        )}
      </div>
    </td>
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
                />
              ))}
            </tbody>
          </table>
        </div>
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
