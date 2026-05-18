import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { loadTournamentByToken, submitTeamRegistration } from '../lib/supabase';
import { APP_DISPLAY_NAME, APP_LOGO_URL } from '../constants/branding';
import TournamentShieldThumb from '../components/TournamentShieldThumb';
import { getInitials, compressImage } from '../utils/helpers';

const EMPTY_PLAYER = {
  firstName: '', lastName: '', docNumber: '',
  birthDate: '', phone: '', position: '', shirtNumber: '', photo: null,
};

/* ─── Subida de foto jugador ─── */
function PlayerPhoto({ value, onChange }) {
  const ref = useRef(null);
  function handle(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Solo imágenes.'); return; }
    const reader = new FileReader();
    reader.onload = async e => onChange(await compressImage(e.target.result, 200, 0.7));
    reader.readAsDataURL(file);
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handle(e.target.files[0])} />
      <div
        onClick={() => ref.current.click()}
        style={{
          width: 64, height: 64, borderRadius: '50%', cursor: 'pointer',
          border: `2px dashed ${value ? '#84cc16' : '#2d3e2d'}`,
          background: value ? 'transparent' : '#111713',
          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {value
          ? <img src={value} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
          : <span style={{ fontSize: '1.4rem' }}>📷</span>
        }
      </div>
      <button type="button" onClick={() => ref.current.click()} style={btnLight}>
        {value ? 'Cambiar' : 'Foto'}
      </button>
    </div>
  );
}

/* ─── Subida de escudo ─── */
function ShieldPicker({ value, onChange }) {
  const ref = useRef(null);
  function handle(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Solo imágenes.'); return; }
    const reader = new FileReader();
    reader.onload = async e => onChange(await compressImage(e.target.result, 300, 0.75));
    reader.readAsDataURL(file);
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handle(e.target.files[0])} />
      <div
        onClick={() => ref.current.click()}
        style={{
          width: 100, height: 100, borderRadius: 12, cursor: 'pointer',
          border: `2px dashed ${value ? '#84cc16' : '#2d3e2d'}`,
          background: value ? 'rgba(132,204,22,0.06)' : '#111713',
          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 0.2s',
        }}
      >
        {value
          ? <img src={value} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} alt="" />
          : <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem' }}>🛡️</div>
              <div style={{ fontSize: '0.62rem', color: '#5a7353', marginTop: 2 }}>Escudo</div>
            </div>
        }
      </div>
      <button type="button" onClick={() => ref.current.click()} style={btnLight}>
        {value ? '📁 Cambiar escudo' : '📁 Subir escudo'}
      </button>
      {value && (
        <button type="button" onClick={() => onChange(null)} style={{ ...btnLight, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>
          Quitar
        </button>
      )}
    </div>
  );
}

/* ─── Estilos inline compartidos ─── */
const btnLight = {
  padding: '5px 12px', borderRadius: 6, border: '1px solid #2d3e2d',
  background: '#161c14', color: '#a1b89a', fontSize: '0.78rem', cursor: 'pointer',
};

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8, boxSizing: 'border-box',
  border: '1px solid #2d3e2d', background: '#111713', color: '#e2e8df',
  fontSize: '0.88rem', outline: 'none',
};

const labelStyle = {
  display: 'block', fontSize: '0.72rem', fontWeight: 700,
  color: '#7a9a72', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4,
};

export default function TeamSelfRegistration() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | ready | invalid | submitted | error
  const [tournament, setTournament] = useState(null);
  const [step, setStep] = useState(1); // 1: team info, 2: players
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const playerLimit = tournament?.playerLimit || 30;

  const [teamForm, setTeamForm] = useState({
    name: '', shortName: '', coach: '', city: '', shield: null,
  });
  const [players, setPlayers] = useState([{ ...EMPTY_PLAYER }]);

  useEffect(() => {
    loadTournamentByToken(token).then(t => {
      if (!t) { setStatus('invalid'); return; }
      setTournament(t);
      setStatus('ready');
    }).catch(() => setStatus('invalid'));
  }, [token]);

  /* ── Jugadores ── */
  function addPlayer() {
    if (players.length >= playerLimit) return;
    setPlayers(prev => [...prev, { ...EMPTY_PLAYER }]);
  }

  function removePlayer(idx) {
    if (players.length === 1) return;
    setPlayers(prev => prev.filter((_, i) => i !== idx));
  }

  function updatePlayer(idx, field, value) {
    setPlayers(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  }

  /* ── Envío ── */
  async function handleSubmit() {
    if (!teamForm.name.trim()) { alert('El nombre del equipo es obligatorio.'); return; }
    const validPlayers = players.filter(p => p.firstName.trim() && p.lastName.trim());
    if (validPlayers.length === 0) { alert('Agrega al menos 1 jugador con nombre y apellido.'); return; }

    setSubmitting(true);
    setSubmitError('');
    const { error } = await submitTeamRegistration({
      token,
      tournamentId: tournament.id,
      teamData: {
        ...teamForm,
        players: validPlayers,
      },
    });
    setSubmitting(false);
    if (error) { setSubmitError(error); setStatus('error'); return; }
    setStatus('submitted');
  }

  /* ── Renders de estado ── */
  if (status === 'loading') {
    return (
      <PageShell>
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#7a9a72' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⏳</div>
          <div>Cargando información del torneo…</div>
        </div>
      </PageShell>
    );
  }

  if (status === 'invalid') {
    return (
      <PageShell>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔒</div>
          <h2 style={{ color: '#e2e8df', marginBottom: 8 }}>Enlace no válido</h2>
          <p style={{ color: '#7a9a72', fontSize: '0.9rem' }}>
            Este enlace de inscripción no existe o ya no está activo.
          </p>
        </div>
      </PageShell>
    );
  }

  if (status === 'submitted') {
    return (
      <PageShell>
        <div style={{ textAlign: 'center', padding: '50px 20px' }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>✅</div>
          <h2 style={{ color: '#84cc16', marginBottom: 8, fontSize: '1.3rem' }}>¡Inscripción enviada!</h2>
          <p style={{ color: '#a1b89a', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Tu equipo <strong style={{ color: '#e2e8df' }}>{teamForm.name}</strong> fue enviado correctamente.<br />
            El organizador revisará la solicitud y la confirmará pronto.
          </p>
        </div>
      </PageShell>
    );
  }

  if (status === 'error') {
    return (
      <PageShell>
        <div style={{ textAlign: 'center', padding: '50px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>❌</div>
          <h2 style={{ color: '#ef4444', marginBottom: 8 }}>Error al enviar</h2>
          <p style={{ color: '#7a9a72', fontSize: '0.9rem' }}>Ocurrió un error. Intenta de nuevo.</p>
          {submitError && (
            <p style={{ color: '#a1b89a', fontSize: '0.75rem', marginTop: 10, wordBreak: 'break-word' }}>{submitError}</p>
          )}
          <button onClick={() => { setSubmitError(''); setStatus('ready'); }} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 8, background: '#84cc16', color: '#000', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            Intentar de nuevo
          </button>
        </div>
      </PageShell>
    );
  }

  /* ── Formulario principal ── */
  return (
    <PageShell>
      {/* Encabezado del torneo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, padding: '16px', background: 'rgba(132,204,22,0.06)', borderRadius: 12, border: '1px solid rgba(132,204,22,0.2)' }}>
        <TournamentShieldThumb shield={tournament.shield} sport={tournament.sport} colorIndex={0} size={52} />
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#e2e8df' }}>{tournament.name}</div>
          <div style={{ fontSize: '0.78rem', color: '#7a9a72', marginTop: 2 }}>
            {tournament.sport} · {tournament.type === 'league' ? 'Liga' : 'Eliminación'} · máx {playerLimit} jugadores/equipo
          </div>
        </div>
      </div>

      {/* Indicador de pasos */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { n: 1, label: 'Equipo' },
          { n: 2, label: 'Jugadores' },
        ].map(s => (
          <div
            key={s.n}
            onClick={() => s.n < step || (s.n === 2 && teamForm.name.trim()) ? setStep(s.n) : null}
            style={{
              flex: 1, padding: '10px 8px', borderRadius: 10, textAlign: 'center',
              background: step === s.n ? 'rgba(132,204,22,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${step === s.n ? 'rgba(132,204,22,0.5)' : '#2d3e2d'}`,
              cursor: s.n <= step ? 'pointer' : 'default',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: step === s.n ? '#84cc16' : '#5a7353' }}>
              {s.n < step ? '✓' : s.n}
            </div>
            <div style={{ fontSize: '0.72rem', color: step === s.n ? '#a3e635' : '#5a7353', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── PASO 1: Info del equipo ── */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 8 }}>
            <ShieldPicker value={teamForm.shield} onChange={v => setTeamForm(f => ({ ...f, shield: v }))} />
          </div>

          <div>
            <label style={labelStyle}>Nombre del equipo *</label>
            <input
              style={inputStyle} placeholder="Ej: Los Tigres FC"
              value={teamForm.name}
              onChange={e => setTeamForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Siglas</label>
              <input
                style={inputStyle} placeholder="TIG" maxLength={4}
                value={teamForm.shortName}
                onChange={e => setTeamForm(f => ({ ...f, shortName: e.target.value.toUpperCase() }))}
              />
            </div>
            <div>
              <label style={labelStyle}>Ciudad</label>
              <input
                style={inputStyle} placeholder="Ej: Bogotá"
                value={teamForm.city}
                onChange={e => setTeamForm(f => ({ ...f, city: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Director técnico / Entrenador</label>
            <input
              style={inputStyle} placeholder="Ej: Juan Pérez"
              value={teamForm.coach}
              onChange={e => setTeamForm(f => ({ ...f, coach: e.target.value }))}
            />
          </div>

          <button
            onClick={() => {
              if (!teamForm.name.trim()) { alert('El nombre del equipo es obligatorio.'); return; }
              setStep(2);
            }}
            style={{
              width: '100%', padding: '13px', borderRadius: 10, border: 'none',
              background: '#84cc16', color: '#071207', fontWeight: 800, fontSize: '1rem',
              cursor: 'pointer', marginTop: 8,
            }}
          >
            Siguiente → Agregar jugadores
          </button>
        </div>
      )}

      {/* ── PASO 2: Jugadores ── */}
      {step === 2 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, color: '#e2e8df', fontSize: '0.95rem' }}>
                👥 Jugadores del equipo
              </div>
              <div style={{ fontSize: '0.72rem', color: '#7a9a72', marginTop: 2 }}>
                {players.filter(p => p.firstName.trim()).length} agregados · máx {playerLimit}
              </div>
            </div>
            <button
              onClick={addPlayer}
              disabled={players.length >= playerLimit}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: players.length >= playerLimit ? '#1a2d1a' : '#84cc16',
                color: players.length >= playerLimit ? '#5a7353' : '#071207',
                fontWeight: 700, fontSize: '0.85rem', cursor: players.length >= playerLimit ? 'not-allowed' : 'pointer',
              }}
            >
              + Jugador
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {players.map((player, idx) => (
              <div key={idx} style={{
                padding: 14, borderRadius: 12,
                background: 'rgba(255,255,255,0.03)', border: '1px solid #2d3e2d',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, color: '#84cc16', fontSize: '0.85rem' }}>Jugador #{idx + 1}</span>
                  {players.length > 1 && (
                    <button onClick={() => removePlayer(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <PlayerPhoto
                    value={player.photo}
                    onChange={v => updatePlayer(idx, 'photo', v)}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <label style={labelStyle}>Nombre *</label>
                        <input style={inputStyle} placeholder="Carlos"
                          value={player.firstName}
                          onChange={e => updatePlayer(idx, 'firstName', e.target.value)} />
                      </div>
                      <div>
                        <label style={labelStyle}>Apellido *</label>
                        <input style={inputStyle} placeholder="García"
                          value={player.lastName}
                          onChange={e => updatePlayer(idx, 'lastName', e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <label style={labelStyle}>Cédula</label>
                        <input style={inputStyle} placeholder="12345678"
                          value={player.docNumber}
                          onChange={e => updatePlayer(idx, 'docNumber', e.target.value)} />
                      </div>
                      <div>
                        <label style={labelStyle}>Camisa</label>
                        <input style={inputStyle} placeholder="10" type="number" min="1" max="99"
                          value={player.shirtNumber}
                          onChange={e => updatePlayer(idx, 'shirtNumber', e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <label style={labelStyle}>Fecha de nacimiento</label>
                        <input style={inputStyle} type="date"
                          value={player.birthDate}
                          onChange={e => updatePlayer(idx, 'birthDate', e.target.value)} />
                      </div>
                      <div>
                        <label style={labelStyle}>Posición</label>
                        <input style={inputStyle} placeholder="Delantero"
                          value={player.position}
                          onChange={e => updatePlayer(idx, 'position', e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Celular</label>
                      <input style={inputStyle} placeholder="300 000 0000"
                        value={player.phone}
                        onChange={e => updatePlayer(idx, 'phone', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Barra de cupo */}
          <div style={{ marginTop: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#7a9a72', marginBottom: 4 }}>
              <span>Cupo del equipo</span>
              <span>{players.filter(p => p.firstName.trim()).length} / {playerLimit} jugadores</span>
            </div>
            <div style={{ background: '#1a2d1a', borderRadius: 99, height: 5, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min((players.filter(p => p.firstName.trim()).length / playerLimit) * 100, 100)}%`,
                background: '#84cc16', borderRadius: 99, transition: 'width 0.3s',
              }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep(1)} style={{
              flex: 1, padding: '12px', borderRadius: 10, border: '1px solid #2d3e2d',
              background: 'transparent', color: '#a1b89a', fontWeight: 600, cursor: 'pointer',
            }}>
              ← Volver
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                flex: 2, padding: '12px', borderRadius: 10, border: 'none',
                background: submitting ? '#4a7a1a' : '#84cc16',
                color: '#071207', fontWeight: 800, fontSize: '1rem', cursor: submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? '⏳ Enviando…' : '✓ Enviar inscripción'}
            </button>
          </div>
        </div>
      )}
    </PageShell>
  );
}

/* ─── Contenedor base de la página pública ─── */
function PageShell({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #071207 0%, #0d1f0d 60%, #071207 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '0 0 40px',
    }}>
      {/* Header */}
      <div style={{
        width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid #1a2d1a', marginBottom: 24,
      }}>
        {APP_LOGO_URL
          ? <img src={APP_LOGO_URL} style={{ width: 36, height: 36, objectFit: 'contain' }} alt="" />
          : <span style={{ fontSize: '1.5rem' }}>🏆</span>
        }
        <span style={{ fontWeight: 800, color: '#84cc16', fontSize: '1rem' }}>{APP_DISPLAY_NAME}</span>
      </div>

      <div style={{ width: '100%', maxWidth: 480, padding: '0 16px' }}>
        <h1 style={{ color: '#e2e8df', fontSize: '1.2rem', fontWeight: 800, marginBottom: 20 }}>
          📋 Inscripción de equipo
        </h1>
        {children}
      </div>
    </div>
  );
}
