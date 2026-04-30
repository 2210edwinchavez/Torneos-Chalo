import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { loadStatePublic, submitPlayerRegistration } from '../lib/supabase';
import { APP_DISPLAY_NAME, APP_LOGO_URL } from '../constants/branding';
import TournamentShieldThumb from '../components/TournamentShieldThumb';
import { getTeamColor, getInitials } from '../utils/helpers';

const EMPTY_FORM = {
  firstName: '', lastName: '', docNumber: '',
  birthDate: '', phone: '', position: '', photo: null,
};

/* ─── Subida de foto ─── */
function PhotoUpload({ value, onChange }) {
  const ref = useRef(null);
  function handle(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Solo imágenes (JPG, PNG, WEBP).'); return; }
    if (file.size > 3 * 1024 * 1024) { alert('Máximo 3 MB.'); return; }
    const reader = new FileReader();
    reader.onload = e => onChange(e.target.result);
    reader.readAsDataURL(file);
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handle(e.target.files[0])} />
      <div
        onClick={() => ref.current.click()}
        style={{
          width: 100, height: 100, borderRadius: '50%', cursor: 'pointer',
          border: `3px dashed ${value ? '#84cc16' : '#2d3e2d'}`,
          background: value ? 'transparent' : '#111713',
          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 0.2s',
        }}
      >
        {value
          ? <img src={value} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
          : <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem' }}>📷</div>
              <div style={{ fontSize: '0.65rem', color: '#5a7353', marginTop: 2 }}>Subir foto</div>
            </div>
        }
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => ref.current.click()} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #2d3e2d', background: '#161c14', color: '#a1b89a', fontSize: '0.78rem', cursor: 'pointer' }}>
          {value ? '📷 Cambiar' : '📷 Subir foto'}
        </button>
        {value && <button type="button" onClick={() => onChange(null)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: '0.78rem', cursor: 'pointer' }}>Quitar</button>}
      </div>
    </div>
  );
}

export default function PlayerRegistration() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading | ready | invalid | submitted | error
  const [teamInfo, setTeamInfo] = useState(null);   // { team, tournament }
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function load() {
      setStatus('loading');
      const state = await loadStatePublic();
      if (!state) {
        setStatus('error');
        setErrorMsg('No se pudo conectar con el servidor. Por favor intenta más tarde.');
        return;
      }
      // Find team by registrationToken
      let found = null;
      for (const tournament of (state.tournaments || [])) {
        for (const team of (tournament.teams || [])) {
          if (team.registrationToken === token) {
            found = { team, tournament };
            break;
          }
        }
        if (found) break;
      }

      if (!found) {
        setStatus('invalid');
        return;
      }
      if (!found.team.registrationActive) {
        setStatus('inactive');
        setTeamInfo(found);
        return;
      }
      setTeamInfo(found);
      setStatus('ready');
    }
    load();
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setErrorMsg('El nombre y apellido son obligatorios.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    const { error } = await submitPlayerRegistration({
      token,
      tournamentId: teamInfo.tournament.id,
      teamId: teamInfo.team.id,
      playerData: {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        docNumber: form.docNumber.trim(),
        birthDate: form.birthDate,
        phone: form.phone.trim(),
        position: form.position.trim(),
        photo: form.photo,
      },
    });
    setSubmitting(false);
    if (error) {
      setErrorMsg('Error al enviar la solicitud. ' + error);
    } else {
      setStatus('submitted');
    }
  }

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })); setErrorMsg(''); }

  const teamColor = teamInfo ? getTeamColor(teamInfo.team.colorIndex) : '#84cc16';
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

  /* ── Pantalla de carga ── */
  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a1a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#84cc16' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⚽</div>
          <div style={{ fontWeight: 700 }}>Cargando…</div>
        </div>
      </div>
    );
  }

  /* ── Token inválido ── */
  if (status === 'invalid') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a1a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔗</div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f1f5f9', marginBottom: 8 }}>Enlace no válido</div>
          <div style={{ color: '#5a7353', fontSize: '0.875rem' }}>Este enlace de inscripción no existe o ha sido eliminado.</div>
        </div>
      </div>
    );
  }

  /* ── Enlace desactivado ── */
  if (status === 'inactive') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a1a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          {teamInfo?.team.shield
            ? <img src={teamInfo.team.shield} style={{ width: 72, height: 72, objectFit: 'contain', marginBottom: 12 }} alt="" />
            : <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔒</div>
          }
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f1f5f9', marginBottom: 8 }}>Inscripciones cerradas</div>
          <div style={{ color: '#5a7353', fontSize: '0.875rem' }}>
            El enlace de inscripción para <strong style={{ color: '#a1b89a' }}>{teamInfo?.team.name}</strong> está temporalmente desactivado.
          </div>
          <div style={{ fontSize: '0.8rem', color: '#5a7353', marginTop: 12 }}>Contacta al administrador del torneo.</div>
        </div>
      </div>
    );
  }

  /* ── Error de conexión ── */
  if (status === 'error') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a1a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚠️</div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ef4444', marginBottom: 8 }}>Error de conexión</div>
          <div style={{ color: '#5a7353', fontSize: '0.875rem' }}>{errorMsg}</div>
        </div>
      </div>
    );
  }

  /* ── Enviado con éxito ── */
  if (status === 'submitted') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a1a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{
          width: '100%', maxWidth: 420, textAlign: 'center',
          background: '#111713', border: '1px solid #1e2d1a', borderRadius: 20,
          padding: '40px 28px', boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>✅</div>
          <div style={{ fontWeight: 800, fontSize: '1.3rem', color: '#84cc16', marginBottom: 8 }}>
            ¡Solicitud enviada!
          </div>
          <div style={{ color: '#a1b89a', fontSize: '0.9rem', marginBottom: 20, lineHeight: 1.6 }}>
            Tu solicitud de inscripción para <strong style={{ color: '#f1f5f9' }}>{teamInfo?.team.name}</strong> fue enviada correctamente.
          </div>
          <div style={{ padding: '12px 16px', background: 'rgba(132,204,22,0.06)', border: '1px solid rgba(132,204,22,0.2)', borderRadius: 10, fontSize: '0.82rem', color: '#5a7353' }}>
            El administrador del torneo revisará tu solicitud y te confirmará la inscripción.
          </div>
        </div>
      </div>
    );
  }

  const { team, tournament } = teamInfo;
  const enrolledCount = (team.enrollments || []).length;
  const playerLimit = tournament.playerLimit || 25;
  const isFull = enrolledCount >= playerLimit;

  /* ── Formulario principal ── */
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #071207 0%, #0a1a0a 50%, #071207 100%)',
      padding: '20px 16px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      {/* Header de la app */}
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <img src={APP_LOGO_URL} alt={APP_DISPLAY_NAME} style={{ width: 32, height: 32, objectFit: 'contain' }} />
        <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#84cc16' }}>{APP_DISPLAY_NAME}</span>
      </div>

      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Tarjeta del equipo */}
        <div style={{
          border: `1px solid ${teamColor}44`,
          borderRadius: 16, padding: '20px',
          marginBottom: 20,
          background: `linear-gradient(135deg, #111713 0%, ${teamColor}0a 100%)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {team.shield
              ? <img src={team.shield} alt="" style={{ width: 60, height: 60, objectFit: 'contain', filter: `drop-shadow(0 4px 12px ${teamColor}66)` }} />
              : <div style={{ width: 60, height: 60, borderRadius: 12, background: teamColor + '33', color: teamColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.3rem' }}>
                  {getInitials(team.name)}
                </div>
            }
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f1f5f9' }}>{team.name}</div>
              <div style={{ fontSize: '0.78rem', color: '#a1b89a', marginTop: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
                <TournamentShieldThumb shield={tournament.shield} sport={tournament.sport} colorIndex={0} size={22} />
                <span>{tournament.name}</span>
              </div>
              {team.coach && <div style={{ fontSize: '0.72rem', color: '#5a7353', marginTop: 2 }}>👔 {team.coach}</div>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: 99, background: 'rgba(132,204,22,0.1)', color: '#84cc16', border: '1px solid rgba(132,204,22,0.2)', fontWeight: 700 }}>
              {enrolledCount}/{playerLimit} jugadores
            </span>
            {isFull && (
              <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: 99, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', fontWeight: 700 }}>
                🔒 Cupo completo
              </span>
            )}
          </div>
        </div>

        {isFull ? (
          <div style={{ textAlign: 'center', padding: '28px 20px', background: '#111713', borderRadius: 16, border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>🔒</div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Equipo completo</div>
            <div style={{ fontSize: '0.82rem', color: '#5a7353' }}>Este equipo ya alcanzó el límite de {playerLimit} jugadores.</div>
          </div>
        ) : (
          /* Formulario */
          <form onSubmit={handleSubmit} style={{ background: '#111713', border: '1px solid #1e2d1a', borderRadius: 16, padding: '24px 20px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#5a7353', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
              📋 Formulario de inscripción
            </div>

            {/* Foto */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <PhotoUpload value={form.photo} onChange={v => setField('photo', v)} />
            </div>

            {/* Nombre y apellido */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#a1b89a', marginBottom: 5 }}>
                  Nombre *
                </label>
                <input
                  className="form-input"
                  placeholder="Carlos"
                  value={form.firstName}
                  onChange={e => setField('firstName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#a1b89a', marginBottom: 5 }}>
                  Apellido *
                </label>
                <input
                  className="form-input"
                  placeholder="García"
                  value={form.lastName}
                  onChange={e => setField('lastName', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Cédula y fecha de nacimiento */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#a1b89a', marginBottom: 5 }}>
                  N° de cédula
                </label>
                <input
                  className="form-input"
                  placeholder="12345678"
                  value={form.docNumber}
                  onChange={e => setField('docNumber', e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#a1b89a', marginBottom: 5 }}>
                  Fecha de nacimiento
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={form.birthDate}
                  onChange={e => setField('birthDate', e.target.value)}
                />
              </div>
            </div>

            {/* Teléfono y posición */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#a1b89a', marginBottom: 5 }}>
                  Teléfono
                </label>
                <input
                  className="form-input"
                  placeholder="3001234567"
                  value={form.phone}
                  onChange={e => setField('phone', e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#a1b89a', marginBottom: 5 }}>
                  Posición
                </label>
                <select
                  className="form-input"
                  value={form.position}
                  onChange={e => setField('position', e.target.value)}
                >
                  <option value="">Sin especificar</option>
                  <option value="Portero">🧤 Portero</option>
                  <option value="Defensa">🛡️ Defensa</option>
                  <option value="Mediocampista">⚙️ Mediocampista</option>
                  <option value="Delantero">⚡ Delantero</option>
                </select>
              </div>
            </div>

            {errorMsg && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '0.82rem', marginBottom: 14 }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
                background: submitting ? 'rgba(132,204,22,0.5)' : '#84cc16',
                color: '#0a0f0a', fontWeight: 800, fontSize: '0.95rem',
                cursor: submitting ? 'wait' : 'pointer', transition: 'all 0.2s',
              }}
            >
              {submitting ? '⏳ Enviando…' : '✅ Enviar solicitud de inscripción'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#5a7353', marginTop: 12 }}>
              Tu solicitud será revisada y aprobada por el administrador del torneo.
            </p>
          </form>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.72rem', color: '#5a7353' }}>
          <a href={appUrl} style={{ color: '#84cc16', fontWeight: 700, textDecoration: 'none' }}>{APP_DISPLAY_NAME}</a> · Gestión deportiva
        </div>
      </div>
    </div>
  );
}
