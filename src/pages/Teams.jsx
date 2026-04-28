import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTournament, findPlayerEnrollment, getPaymentStatus } from '../context/TournamentContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import Modal from '../components/Modal';
import { getTeamColor, getInitials, formatDate } from '../utils/helpers';

const EMPTY_TEAM_FORM = { name: '', shortName: '', coach: '', city: '', shield: null };

/* ─── Shield Upload ─── */
function ShieldUpload({ value, onChange, required }) {
  const inputRef = useRef(null);

  function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Solo se permiten imágenes (JPG, PNG, WEBP, SVG).'); return; }
    if (file.size > 4 * 1024 * 1024) { alert('El escudo no puede superar 4 MB.'); return; }
    const reader = new FileReader();
    reader.onload = e => onChange(e.target.result);
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
        onClick={() => inputRef.current.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          padding: value ? 16 : 28,
          borderRadius: 12,
          border: `2px ${value ? 'solid' : 'dashed'} ${value ? 'var(--primary)' : required ? 'rgba(245,158,11,0.6)' : 'var(--border)'}`,
          background: value ? 'rgba(132,204,22,0.06)' : 'var(--bg-card2)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          position: 'relative',
        }}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="Escudo del equipo"
              style={{
                width: 96, height: 96,
                objectFit: 'contain',
                borderRadius: 8,
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
              }}
            />
            <div style={{ fontSize: '0.78rem', color: 'var(--primary-light)', fontWeight: 600 }}>
              Escudo cargado · haz clic para cambiar
            </div>
          </>
        ) : (
          <>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--bg-card)', border: '2px dashed var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem',
            }}>
              🛡️
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 3 }}>
                Subir escudo del equipo
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Arrastra la imagen o haz clic · JPG, PNG, SVG · máx 4 MB
              </div>
              {required && (
                <div style={{ fontSize: '0.72rem', color: 'var(--warning)', marginTop: 6, fontWeight: 600 }}>
                  ⚠️ Campo obligatorio
                </div>
              )}
            </div>
          </>
        )}
      </div>
      {value && (
        <button
          type="button"
          className="btn btn-danger btn-sm"
          style={{ marginTop: 8, width: '100%' }}
          onClick={e => { e.stopPropagation(); onChange(null); }}
        >
          Quitar escudo
        </button>
      )}
    </div>
  );
}

/* ─── Payment Modal ─── */
function PaymentModal({ enrollment, player, tournamentId, teamId, inscriptionFee, onClose, dispatch }) {
  const { formatMoney } = useCurrency();
  const payment = enrollment.payment;
  const status = getPaymentStatus(payment);

  function payCash() {
    dispatch({ type: 'PAY_CASH', payload: { tournamentId, teamId, enrollmentId: enrollment.id } });
    onClose();
  }

  function payInstallment(number) {
    dispatch({ type: 'PAY_INSTALLMENT', payload: { tournamentId, teamId, enrollmentId: enrollment.id, installmentNumber: number } });
  }

  const fullName = `${player.firstName} ${player.lastName}`;

  return (
    <Modal
      title="Estado de pago"
      onClose={onClose}
      footer={<button className="btn btn-secondary" onClick={onClose}>Cerrar</button>}
    >
      {/* Player info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: 14, background: 'var(--bg-card2)', borderRadius: 10, border: '1px solid var(--border)' }}>
        {player.photo
          ? <img src={player.photo} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} alt="" />
          : <div className="player-photo-placeholder" style={{ width: 48, height: 48, fontSize: '1rem' }}>{getInitials(fullName)}</div>
        }
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{fullName}</div>
          {enrollment.shirtNumber && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Camisa #{enrollment.shirtNumber}</div>}
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            {formatMoney(payment.totalAmount)}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total inscripción</div>
        </div>
      </div>

      {/* Payment type badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          Modalidad: {payment.type === 'cash' ? '💵 Contado' : '📆 3 Cuotas'}
        </span>
        <span style={{ padding: '4px 12px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700, background: status.color + '22', color: status.color, border: `1px solid ${status.color}44` }}>
          {status.pct === 100 ? '✓ ' : ''}{status.label}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ background: 'var(--bg-card2)', borderRadius: 99, height: 8, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ height: '100%', width: `${status.pct}%`, background: status.pct === 100 ? 'var(--success)' : 'linear-gradient(90deg, var(--primary), var(--secondary))', borderRadius: 99, transition: 'width 0.4s ease' }} />
      </div>

      {/* Cash payment */}
      {payment.type === 'cash' && (
        <div style={{ padding: 16, background: 'var(--bg-card2)', borderRadius: 10, border: '1px solid var(--border)', textAlign: 'center' }}>
          {payment.paid ? (
            <div>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
              <div style={{ fontWeight: 700, color: 'var(--success)' }}>Pago completo</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {payment.paidDate ? `Pagado el ${new Date(payment.paidDate).toLocaleDateString('es-ES')}` : ''}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                {formatMoney(payment.totalAmount)}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 14 }}>Pago único de contado</div>
              <button className="btn btn-success btn-lg w-full" onClick={payCash}>
                💵 Confirmar pago de contado
              </button>
            </div>
          )}
        </div>
      )}

      {/* Installments */}
      {payment.type === 'installments3' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {payment.installments.map(inst => (
            <div key={inst.number} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', borderRadius: 10,
              background: inst.paid ? 'rgba(16,185,129,0.06)' : 'var(--bg-card2)',
              border: `1px solid ${inst.paid ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
              transition: 'all 0.15s',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: inst.paid ? 'rgba(16,185,129,0.15)' : 'var(--bg-card)',
                border: `2px solid ${inst.paid ? 'var(--success)' : 'var(--border)'}`,
                fontSize: inst.paid ? '1rem' : '0.85rem', fontWeight: 800,
                color: inst.paid ? 'var(--success)' : 'var(--text-muted)',
              }}>
                {inst.paid ? '✓' : inst.number}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                  Cuota {inst.number} de 3
                </div>
                {inst.paid && inst.paidDate && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Pagado el {new Date(inst.paidDate).toLocaleDateString('es-ES')}
                  </div>
                )}
              </div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: inst.paid ? 'var(--success)' : 'var(--text-primary)' }}>
                {formatMoney(inst.amount)}
              </div>
              {!inst.paid && (
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => payInstallment(inst.number)}
                >
                  Pagar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

/* ─── Photo Upload (inline) ─── */
function PhotoUploadInline({ value, onChange }) {
  const inputRef = useRef(null);
  function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Solo imágenes.'); return; }
    if (file.size > 3 * 1024 * 1024) { alert('Máximo 3 MB.'); return; }
    const reader = new FileReader();
    reader.onload = e => onChange(e.target.result);
    reader.readAsDataURL(file);
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
      <div
        onClick={() => inputRef.current.click()}
        style={{
          width: 64, height: 64, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
          border: `2px dashed ${value ? 'var(--primary)' : 'var(--border)'}`,
          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-card2)', transition: 'border-color 0.15s',
        }}
      >
        {value
          ? <img src={value} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
          : <span style={{ fontSize: '1.6rem' }}>📷</span>
        }
      </div>
      <div style={{ flex: 1 }}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => inputRef.current.click()}>
          {value ? 'Cambiar foto' : 'Subir foto'}
        </button>
        {value && <button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft: 6 }} onClick={() => onChange(null)}>Quitar</button>}
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>JPG · PNG · máx 3 MB</div>
      </div>
    </div>
  );
}

/* ─── Enroll Modal ─── */
function EnrollModal({ team, tournament, globalPlayers = [], onClose, dispatch }) {
  const { formatMoney } = useCurrency();
  const playerLimit = tournament.playerLimit || 25;
  const enrollments = team.enrollments || [];
  const isFull = enrollments.length >= playerLimit;

  // step: 'search' | 'details' | 'create'
  const [step, setStep] = useState('search');
  const [search, setSearch] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [shirtNumber, setShirtNumber] = useState('');
  const [paymentType, setPaymentType] = useState('cash');

  // New player form (when creating from scratch)
  const [newForm, setNewForm] = useState({
    firstName: '', lastName: '', docNumber: '', birthDate: '', photo: null,
  });

  const inscriptionFee = tournament.inscriptionFee || 0;

  // Build player status relative to this tournament
  const enrolledInTournament = new Map(); // playerId → teamName
  tournament.teams.forEach(t => {
    (t.enrollments || []).forEach(e => {
      enrolledInTournament.set(e.playerId, t.name);
    });
  });

  const query = search.trim().toLowerCase();
  const filteredPlayers = query.length < 1
    ? []
    : globalPlayers.filter(p => {
        const full = `${p.firstName} ${p.lastName}`.toLowerCase();
        const doc = (p.docNumber || '').toLowerCase();
        return full.includes(query) || doc.includes(query);
      });

  function selectPlayer(p) {
    if (enrolledInTournament.has(p.id)) return; // blocked
    setSelectedPlayer(p);
    setStep('details');
  }

  function goCreateMode() {
    // Pre-fill docNumber if search looks like a number
    const looksLikeDoc = /^\d+$/.test(search.trim());
    setNewForm(f => ({
      ...f,
      docNumber: looksLikeDoc ? search.trim() : '',
    }));
    setStep('create');
  }

  function handleCreateAndEnroll() {
    if (!newForm.firstName.trim() || !newForm.lastName.trim()) return;
    dispatch({
      type: 'CREATE_AND_ENROLL',
      payload: {
        player: newForm,
        tournamentId: tournament.id,
        teamId: team.id,
        shirtNumber,
        paymentType,
        inscriptionFee,
      },
    });
    onClose();
  }

  function handleEnroll() {
    if (!selectedPlayer) return;
    dispatch({
      type: 'ENROLL_PLAYER',
      payload: {
        tournamentId: tournament.id,
        teamId: team.id,
        playerId: selectedPlayer.id,
        shirtNumber,
        paymentType,
        inscriptionFee,
      },
    });
    onClose();
  }

  // ── Render ──
  const stepLabel = step === 'search' ? 'Buscar jugador' : step === 'create' ? 'Crear e inscribir jugador' : 'Datos de inscripción';

  return (
    <Modal
      title={`${stepLabel} — ${team.name}`}
      onClose={onClose}
      footer={
        step === 'search' ? (
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        ) : step === 'create' ? (
          <>
            <button className="btn btn-secondary" onClick={() => setStep('search')}>← Volver</button>
            <button className="btn btn-primary" onClick={handleCreateAndEnroll}
              disabled={!newForm.firstName.trim() || !newForm.lastName.trim()}>
              ✓ Crear e inscribir
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-secondary" onClick={() => { setStep('search'); setSelectedPlayer(null); }}>← Volver</button>
            <button className="btn btn-primary" onClick={handleEnroll}>Inscribir jugador ✓</button>
          </>
        )
      }
    >
      {/* ── STEP: Search ── */}
      {step === 'search' && (
        <div>
          {/* Cupo restante */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px', borderRadius: 8, marginBottom: 12,
            background: isFull ? 'rgba(239,68,68,0.08)' : enrollments.length / playerLimit > 0.8 ? 'rgba(245,158,11,0.08)' : 'rgba(132,204,22,0.06)',
            border: `1px solid ${isFull ? 'rgba(239,68,68,0.3)' : enrollments.length / playerLimit > 0.8 ? 'rgba(245,158,11,0.3)' : 'rgba(132,204,22,0.2)'}`,
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              👥 Cupo del equipo
            </span>
            <span style={{
              fontSize: '0.8rem', fontWeight: 800,
              color: isFull ? 'var(--danger)' : enrollments.length / playerLimit > 0.8 ? 'var(--warning)' : 'var(--primary-light)',
            }}>
              {enrollments.length} / {playerLimit} {isFull ? '— COMPLETO' : `(${playerLimit - enrollments.length} disponibles)`}
            </span>
          </div>

          {/* Search bar */}
          <div className="search-bar" style={{ marginBottom: 6 }}>
            <span className="search-icon">🔍</span>
            <input
              className="form-input"
              placeholder="Buscar por nombre completo o número de cédula…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              style={{ paddingRight: 12 }}
            />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 14 }}>
            Escribe al menos 1 carácter para buscar
          </div>

          {/* Results */}
          {query.length > 0 && (
            <>
              {filteredPlayers.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto', marginBottom: 12 }}>
                  {filteredPlayers.map(p => {
                    const enrolledTeam = enrolledInTournament.get(p.id);
                    const isBlocked = !!enrolledTeam;
                    const age = p.birthDate
                      ? Math.floor((Date.now() - new Date(p.birthDate).getTime()) / (365.25 * 24 * 3600 * 1000))
                      : null;

                    return (
                      <button
                        key={p.id}
                        onClick={() => selectPlayer(p)}
                        disabled={isBlocked}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '11px 14px', borderRadius: 10, width: '100%', textAlign: 'left',
                          border: `1px solid ${isBlocked ? 'var(--border)' : 'var(--border)'}`,
                          background: isBlocked ? 'rgba(255,255,255,0.02)' : 'var(--bg-card2)',
                          cursor: isBlocked ? 'not-allowed' : 'pointer',
                          opacity: isBlocked ? 0.65 : 1,
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { if (!isBlocked) e.currentTarget.style.borderColor = 'var(--primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                      >
                        {/* Photo */}
                        {p.photo
                          ? <img src={p.photo} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
                          : <div className="player-photo-placeholder" style={{ width: 42, height: 42, fontSize: '0.85rem', flexShrink: 0 }}>
                              {getInitials(`${p.firstName} ${p.lastName}`) || '👤'}
                            </div>
                        }

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                            {p.firstName} {p.lastName}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            {p.docNumber && <span>📄 {p.docNumber}</span>}
                            {p.docNumber && age !== null && <span> · </span>}
                            {age !== null && <span>{age} años</span>}
                          </div>
                        </div>

                        {/* Status badge */}
                        {isBlocked ? (
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <span style={{
                              display: 'block', padding: '3px 10px', borderRadius: 99, fontSize: '0.7rem',
                              fontWeight: 700, background: 'rgba(239,68,68,0.12)', color: 'var(--danger)',
                              border: '1px solid rgba(239,68,68,0.25)',
                            }}>
                              🔒 En {enrolledTeam}
                            </span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>
                              Ya inscrito en este torneo
                            </span>
                          </div>
                        ) : (
                          <span style={{
                            padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem',
                            fontWeight: 700, background: 'rgba(16,185,129,0.12)', color: 'var(--success)',
                            border: '1px solid rgba(16,185,129,0.25)', flexShrink: 0,
                          }}>
                            ✓ Libre
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center', padding: '24px 16px', background: 'var(--bg-card2)',
                  borderRadius: 10, border: '1px solid var(--border)', marginBottom: 14,
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    No se encontró ningún jugador
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    "{search}" no está en el registro global
                  </div>
                </div>
              )}

              {/* Create option — always shown when there's a query */}
              <div style={{
                padding: '14px 16px', borderRadius: 10,
                border: '1px dashed var(--primary)',
                background: 'rgba(132,204,22,0.05)',
              }}>
                <div style={{ fontWeight: 600, color: 'var(--primary-light)', marginBottom: 4, fontSize: '0.875rem' }}>
                  ¿No encuentras al jugador?
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                  Puedes crearlo en el registro y agregarlo al equipo directamente.
                </div>
                <button className="btn btn-primary w-full" onClick={goCreateMode}>
                  + Crear e inscribir nuevo jugador
                </button>
              </div>
            </>
          )}

          {/* Empty search state */}
          {query.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>👤</div>
              <div style={{ fontSize: '0.875rem' }}>Escribe el nombre o cédula del jugador que deseas inscribir</div>
            </div>
          )}
        </div>
      )}

      {/* ── STEP: Details (existing player) ── */}
      {step === 'details' && selectedPlayer && (
        <div>
          {/* Player card */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20,
            padding: '12px 14px', background: 'var(--bg-card2)', borderRadius: 10,
            border: '2px solid var(--primary)',
          }}>
            {selectedPlayer.photo
              ? <img src={selectedPlayer.photo} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
              : <div className="player-photo-placeholder" style={{ width: 52, height: 52, fontSize: '1rem', flexShrink: 0 }}>{getInitials(`${selectedPlayer.firstName} ${selectedPlayer.lastName}`)}</div>
            }
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary-light)' }}>
                {selectedPlayer.firstName} {selectedPlayer.lastName}
              </div>
              {selectedPlayer.docNumber && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📄 {selectedPlayer.docNumber}</div>
              )}
            </div>
            <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700, background: 'rgba(16,185,129,0.12)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.25)' }}>
              ✓ Seleccionado
            </span>
          </div>

          <PaymentStep
            inscriptionFee={inscriptionFee}
            shirtNumber={shirtNumber}
            setShirtNumber={setShirtNumber}
            paymentType={paymentType}
            setPaymentType={setPaymentType}
          />
        </div>
      )}

      {/* ── STEP: Create new player ── */}
      {step === 'create' && (
        <div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 14, padding: '8px 12px', background: 'rgba(132,204,22,0.06)', borderRadius: 8, borderLeft: '3px solid var(--primary)' }}>
            El jugador se creará en el registro global y quedará inscrito en <strong style={{ color: 'var(--primary-light)' }}>{team.name}</strong>.
          </div>

          {/* Photo */}
          <div className="form-group">
            <label className="form-label">Foto del jugador</label>
            <PhotoUploadInline value={newForm.photo} onChange={photo => setNewForm(f => ({ ...f, photo }))} />
          </div>

          <div className="divider" />

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input className="form-input" placeholder="Ej: Carlos" value={newForm.firstName}
                onChange={e => setNewForm(f => ({ ...f, firstName: e.target.value }))} autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Apellido *</label>
              <input className="form-input" placeholder="Ej: García" value={newForm.lastName}
                onChange={e => setNewForm(f => ({ ...f, lastName: e.target.value }))} />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Número de cédula</label>
              <input className="form-input" placeholder="Ej: 12345678" value={newForm.docNumber}
                onChange={e => setNewForm(f => ({ ...f, docNumber: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha de nacimiento</label>
              <input type="date" className="form-input" value={newForm.birthDate}
                onChange={e => setNewForm(f => ({ ...f, birthDate: e.target.value }))} />
            </div>
          </div>

          <div className="divider" />

          <PaymentStep
            inscriptionFee={inscriptionFee}
            shirtNumber={shirtNumber}
            setShirtNumber={setShirtNumber}
            paymentType={paymentType}
            setPaymentType={setPaymentType}
          />
        </div>
      )}
    </Modal>
  );
}

/* ─── Shared Payment Step ─── */
function PaymentStep({ inscriptionFee, shirtNumber, setShirtNumber, paymentType, setPaymentType }) {
  const { formatMoney } = useCurrency();
  const fee3 = inscriptionFee > 0 ? inscriptionFee / 3 : 0;

  return (
    <>
      <div className="form-group">
        <label className="form-label">Número de camisa</label>
        <input type="number" min="1" max="99" className="form-input" placeholder="Ej: 10"
          value={shirtNumber} onChange={e => setShirtNumber(e.target.value)} />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Modalidad de pago de inscripción</label>
        {inscriptionFee > 0 && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>
            Cuota del torneo: <strong style={{ color: 'var(--accent)' }}>{formatMoney(inscriptionFee)}</strong> por jugador
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Cash */}
          <button type="button" onClick={() => setPaymentType('cash')} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 10,
            border: `2px solid ${paymentType === 'cash' ? 'var(--success)' : 'var(--border)'}`,
            background: paymentType === 'cash' ? 'rgba(16,185,129,0.07)' : 'var(--bg-card2)',
            cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', width: '100%',
          }}>
            <span style={{ fontSize: '1.8rem' }}>💵</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Pago de contado</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Un solo pago por el monto total</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: paymentType === 'cash' ? 'var(--success)' : 'var(--text-primary)' }}>
                {formatMoney(inscriptionFee)}
              </div>
            </div>
            {paymentType === 'cash' && <span style={{ color: 'var(--success)', fontSize: '1.3rem' }}>✓</span>}
          </button>

          {/* 3 installments */}
          <button type="button" onClick={() => setPaymentType('installments3')} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 10,
            border: `2px solid ${paymentType === 'installments3' ? 'var(--primary)' : 'var(--border)'}`,
            background: paymentType === 'installments3' ? 'rgba(132,204,22,0.07)' : 'var(--bg-card2)',
            cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', width: '100%',
          }}>
            <span style={{ fontSize: '1.8rem' }}>📆</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Pago en 3 cuotas</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {inscriptionFee > 0 ? <>3 pagos de <strong style={{ color: 'var(--primary-light)' }}>{formatMoney(fee3)}</strong> cada uno</> : '3 pagos iguales'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: paymentType === 'installments3' ? 'var(--primary-light)' : 'var(--text-primary)' }}>
                3 × {formatMoney(fee3)}
              </div>
            </div>
            {paymentType === 'installments3' && <span style={{ color: 'var(--primary)', fontSize: '1.3rem' }}>✓</span>}
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Enrolled player row inside team card ─── */
function EnrolledPlayerRow({ enrollment, player, tournamentId, teamId, inscriptionFee, dispatch }) {
  const [showPayment, setShowPayment] = useState(false);
  const status = getPaymentStatus(enrollment.payment);
  const fullName = `${player.firstName} ${player.lastName}`;

  function handleUnenroll() {
    if (!confirm(`¿Retirar a ${fullName} de este equipo?`)) return;
    dispatch({ type: 'UNENROLL_PLAYER', payload: { tournamentId, teamId, enrollmentId: enrollment.id } });
  }

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 8, background: 'var(--bg-card2)',
        border: '1px solid var(--border)', transition: 'border-color 0.15s',
      }}>
        {/* Photo */}
        {player.photo
          ? <img src={player.photo} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt="" />
          : <div className="player-photo-placeholder" style={{ width: 36, height: 36, fontSize: '0.75rem', flexShrink: 0 }}>{getInitials(fullName) || '👤'}</div>
        }

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {enrollment.shirtNumber ? <span style={{ color: 'var(--primary-light)', fontWeight: 800, marginRight: 4 }}>#{enrollment.shirtNumber}</span> : null}
            {fullName}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            {player.docNumber && `Doc: ${player.docNumber}`}
          </div>
        </div>

        {/* Payment badge */}
        <button
          onClick={() => setShowPayment(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px',
            borderRadius: 99, fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
            background: status.color + '22', color: status.color, border: `1px solid ${status.color}44`,
            transition: 'all 0.15s', flexShrink: 0,
          }}
          title="Ver estado de pago"
        >
          {status.pct === 100 ? '✓' : '💳'} {status.label}
        </button>

        {/* Remove */}
        <button className="btn btn-danger btn-sm btn-icon" style={{ flexShrink: 0, padding: '4px 6px', fontSize: '0.7rem' }} onClick={handleUnenroll} title="Retirar jugador">✕</button>
      </div>

      {showPayment && (
        <PaymentModal
          enrollment={enrollment}
          player={player}
          tournamentId={tournamentId}
          teamId={teamId}
          inscriptionFee={inscriptionFee}
          onClose={() => setShowPayment(false)}
          dispatch={dispatch}
        />
      )}
    </>
  );
}

/* ─── Team Card ─── */
function TeamCard({ team, tournament, dispatch }) {
  const [showPlayers, setShowPlayers] = useState(false);
  const [showEnroll, setShowEnroll] = useState(false);
  const [deleteTeamConfirm, setDeleteTeamConfirm] = useState(false);
  const { state } = useTournament();
  const { isAdmin } = useAuth();

  const color = getTeamColor(team.colorIndex);
  const enrollments = team.enrollments || [];
  const playerLimit = tournament.playerLimit || 25;
  const isFull = enrollments.length >= playerLimit;

  const stats = (() => {
    const ms = tournament.matches.filter(m => m.status === 'finished' && (m.homeId === team.id || m.awayId === team.id));
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

  const paidCount = enrollments.filter(e => {
    const s = getPaymentStatus(e.payment);
    return s.pct === 100;
  }).length;

  return (
    <>
      <div className="card" style={{ borderTop: `3px solid ${color}` }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          {team.shield ? (
            <img
              src={team.shield}
              alt={`Escudo ${team.name}`}
              style={{
                width: 54, height: 54, objectFit: 'contain', flexShrink: 0,
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))',
              }}
            />
          ) : (
            <div className="team-avatar" style={{ width: 54, height: 54, fontSize: '1rem', fontWeight: 800, background: color + '22', color }}>
              {getInitials(team.name)}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{team.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>
              {team.shortName && <span className="pill" style={{ marginRight: 4 }}>{team.shortName}</span>}
              {team.city}
            </div>
          </div>
          {isAdmin && <button className="btn btn-danger btn-icon btn-sm" onClick={() => setDeleteTeamConfirm(true)} title="Eliminar equipo">🗑</button>}
        </div>

        {team.coach && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>
            👔 <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{team.coach}</span>
          </div>
        )}

        {/* Match stats */}
        {stats.pj > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 12 }}>
            {[{ label: 'PJ', value: stats.pj }, { label: 'G', value: stats.w, color: 'var(--success)' }, { label: 'E', value: stats.d, color: 'var(--warning)' }, { label: 'P', value: stats.l, color: 'var(--danger)' }].map(s => (
              <div key={s.label} style={{ background: 'var(--bg-card2)', borderRadius: 6, padding: '5px 2px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: s.color || 'var(--text-primary)' }}>{s.value}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Payment summary pill */}
        {enrollments.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>💳 Pagos:</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: paidCount === enrollments.length ? 'var(--success)' : 'var(--warning)' }}>
              {paidCount}/{enrollments.length} completos
            </span>
          </div>
        )}

        {/* Players toggle */}
        <button
          className="btn btn-secondary w-full"
          style={{ justifyContent: 'space-between', padding: '8px 12px' }}
          onClick={() => setShowPlayers(v => !v)}
        >
          <span>
            👥 Jugadores
            <span style={{
              marginLeft: 8, borderRadius: 99, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 700,
              background: isFull ? 'rgba(239,68,68,0.15)' : color + '33',
              color: isFull ? 'var(--danger)' : color,
            }}>
              {enrollments.length}/{playerLimit}
            </span>
            {isFull && <span style={{ marginLeft: 6, fontSize: '0.68rem', color: 'var(--danger)', fontWeight: 700 }}>COMPLETO</span>}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{showPlayers ? '▲' : '▼'}</span>
        </button>

        {/* Players panel */}
        {showPlayers && (
          <div className="players-panel">
            {/* Barra de progreso del límite */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                <span>Cupo del equipo</span>
                <span style={{ fontWeight: 700, color: isFull ? 'var(--danger)' : 'var(--text-secondary)' }}>
                  {enrollments.length} / {playerLimit} jugadores
                </span>
              </div>
              <div style={{ background: 'var(--bg-card)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min((enrollments.length / playerLimit) * 100, 100)}%`,
                  background: isFull ? 'var(--danger)' : enrollments.length / playerLimit > 0.8 ? 'var(--warning)' : 'var(--primary)',
                  borderRadius: 99,
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>

            {enrollments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '14px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Sin jugadores inscritos aún
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                {enrollments.map(enrollment => {
                  const player = state.globalPlayers.find(p => p.id === enrollment.playerId);
                  if (!player) return null;
                  return (
                    <EnrolledPlayerRow
                      key={enrollment.id}
                      enrollment={enrollment}
                      player={player}
                      tournamentId={tournament.id}
                      teamId={team.id}
                      inscriptionFee={tournament.inscriptionFee || 0}
                      dispatch={dispatch}
                    />
                  );
                })}
              </div>
            )}
            {isAdmin && (
              isFull ? (
                <div style={{
                  textAlign: 'center', padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                  color: 'var(--danger)', fontSize: '0.82rem', fontWeight: 600,
                }}>
                  🔒 Equipo completo — límite de {playerLimit} jugadores alcanzado
                </div>
              ) : (
                <button className="btn btn-primary w-full" onClick={() => setShowEnroll(true)}>
                  + Inscribir jugador
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Enroll modal */}
      {showEnroll && (
        <EnrollModal
          team={team}
          tournament={tournament}
          globalPlayers={state.globalPlayers}
          onClose={() => setShowEnroll(false)}
          dispatch={dispatch}
        />
      )}

      {/* Delete team confirm */}
      {deleteTeamConfirm && (
        <Modal
          title="Eliminar equipo"
          onClose={() => setDeleteTeamConfirm(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDeleteTeamConfirm(false)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => dispatch({ type: 'DELETE_TEAM', payload: { tournamentId: tournament.id, teamId: team.id } })}>Eliminar</button>
            </>
          }
        >
          <p style={{ color: 'var(--text-secondary)' }}>
            ¿Eliminar al equipo <strong style={{ color: 'var(--text-primary)' }}>{team.name}</strong>?
            Se perderán las {enrollments.length} inscripción{enrollments.length !== 1 ? 'es' : ''} de jugadores.
          </p>
        </Modal>
      )}
    </>
  );
}

/* ─── Main Page ─── */
export default function Teams() {
  const { activeTournament, dispatch } = useTournament();
  const { isAdmin } = useAuth();
  const { formatMoney: formatMoneyTeams } = useCurrency();
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamForm, setTeamForm] = useState(EMPTY_TEAM_FORM);
  const [search, setSearch] = useState('');

  if (!activeTournament) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">🏆</div>
        <h3>Sin torneo activo</h3>
        <p>Selecciona o crea un torneo primero.</p>
        <Link to="/torneos" className="btn btn-primary" style={{ marginTop: 20 }}>Ir a Torneos</Link>
      </div>
    );
  }

  const filtered = activeTournament.teams.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.city || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalEnrollments = activeTournament.teams.reduce((s, t) => s + (t.enrollments?.length || 0), 0);

  const [shieldError, setShieldError] = useState(false);

  function handleAddTeam(e) {
    e.preventDefault();
    if (!teamForm.name.trim()) return;
    if (!teamForm.shield) {
      setShieldError(true);
      return;
    }
    setShieldError(false);
    dispatch({
      type: 'ADD_TEAM',
      payload: {
        tournamentId: activeTournament.id,
        team: { ...teamForm, shortName: teamForm.shortName || teamForm.name.slice(0, 3).toUpperCase() },
      },
    });
    setTeamForm(EMPTY_TEAM_FORM);
    setShowTeamModal(false);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Equipos</div>
          <div className="page-subtitle">
            {activeTournament.name} · {activeTournament.teams.length} equipo{activeTournament.teams.length !== 1 ? 's' : ''}
            {totalEnrollments > 0 && ` · ${totalEnrollments} jugador${totalEnrollments !== 1 ? 'es' : ''} inscritos`}
          </div>
        </div>
        {isAdmin && <button className="btn btn-primary btn-lg" onClick={() => setShowTeamModal(true)}>+ Agregar equipo</button>}
      </div>

      {activeTournament.inscriptionFee > 0 && (
        <div className="card mb-24" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12, borderLeft: '3px solid var(--accent)' }}>
          <span style={{ fontSize: '1.2rem' }}>💰</span>
          <div>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Cuota de inscripción: {formatMoneyTeams(activeTournament.inscriptionFee)}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 10 }}>por jugador · contado o 3 cuotas</span>
          </div>
        </div>
      )}

      {activeTournament.teams.length > 3 && (
        <div className="search-bar mb-24" style={{ maxWidth: 320 }}>
          <span className="search-icon">🔍</span>
          <input className="form-input" placeholder="Buscar equipo…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <h3>Sin equipos</h3>
          <p>Agrega equipos y luego inscribe jugadores desde el registro global.</p>
          {isAdmin && <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setShowTeamModal(true)}>+ Agregar primer equipo</button>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map(team => (
            <TeamCard key={team.id} team={team} tournament={activeTournament} dispatch={dispatch} />
          ))}
        </div>
      )}

      {/* Add team modal */}
      {showTeamModal && (
        <Modal
          title="Agregar equipo"
          onClose={() => { setShowTeamModal(false); setTeamForm(EMPTY_TEAM_FORM); setShieldError(false); }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => { setShowTeamModal(false); setTeamForm(EMPTY_TEAM_FORM); setShieldError(false); }}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleAddTeam}>
                Crear equipo
              </button>
            </>
          }
        >
          <form onSubmit={handleAddTeam}>
            {/* Shield upload — first and prominent */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Escudo del equipo
                <span style={{ color: 'var(--danger)', fontWeight: 800 }}>*</span>
                <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.72rem' }}>(obligatorio)</span>
              </label>
              <ShieldUpload
                value={teamForm.shield}
                onChange={shield => { setTeamForm(f => ({ ...f, shield })); setShieldError(false); }}
                required={shieldError}
              />
              {shieldError && (
                <div style={{
                  marginTop: 8, padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  color: 'var(--danger)', fontSize: '0.82rem', fontWeight: 600,
                }}>
                  ⚠️ Debes subir el escudo del equipo para continuar.
                </div>
              )}
            </div>

            <div className="divider" />

            <div className="form-group">
              <label className="form-label">Nombre del equipo *</label>
              <input
                className="form-input"
                placeholder="Ej: Real Madrid"
                value={teamForm.name}
                onChange={e => setTeamForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Siglas</label>
                <input className="form-input" placeholder="RMA" maxLength={4} value={teamForm.shortName} onChange={e => setTeamForm(f => ({ ...f, shortName: e.target.value.toUpperCase() }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Ciudad</label>
                <input className="form-input" placeholder="Ej: Madrid" value={teamForm.city} onChange={e => setTeamForm(f => ({ ...f, city: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Director técnico</label>
              <input className="form-input" placeholder="Ej: Carlo Ancelotti" value={teamForm.coach} onChange={e => setTeamForm(f => ({ ...f, coach: e.target.value }))} />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
