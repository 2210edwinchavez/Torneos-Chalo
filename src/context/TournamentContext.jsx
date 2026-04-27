import { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { generateId } from '../utils/helpers';
import { loadStateFromDB, saveStateToDB } from '../lib/supabase';

const TournamentContext = createContext(null);

const INITIAL_STATE = {
  globalPlayers: [],
  tournaments: [],
  activeTournamentId: null,
};

function buildPayment(type, totalAmount) {
  const total = Number(totalAmount) || 0;
  if (type === 'installments3') {
    const base = Math.floor((total / 3) * 100) / 100;
    const last = Math.round((total - base * 2) * 100) / 100;
    return {
      type: 'installments3',
      totalAmount: total,
      installments: [
        { number: 1, amount: base, paid: false, paidDate: null },
        { number: 2, amount: base, paid: false, paidDate: null },
        { number: 3, amount: last, paid: false, paidDate: null },
      ],
    };
  }
  return {
    type: 'cash',
    totalAmount: total,
    paid: false,
    paidDate: null,
  };
}

function reducer(state, action) {
  switch (action.type) {

    /* ── Global Players ── */
    case 'ADD_GLOBAL_PLAYER': {
      const player = {
        id: generateId(),
        firstName: action.payload.firstName || '',
        lastName: action.payload.lastName || '',
        docNumber: action.payload.docNumber || '',
        birthDate: action.payload.birthDate || '',
        photo: action.payload.photo || null,
        createdAt: new Date().toISOString(),
      };
      return { ...state, globalPlayers: [...state.globalPlayers, player] };
    }

    case 'UPDATE_GLOBAL_PLAYER': {
      return {
        ...state,
        globalPlayers: state.globalPlayers.map(p =>
          p.id === action.payload.id ? { ...p, ...action.payload.data } : p
        ),
      };
    }

    case 'DELETE_GLOBAL_PLAYER': {
      return {
        ...state,
        globalPlayers: state.globalPlayers.filter(p => p.id !== action.payload),
      };
    }

    case 'CREATE_AND_ENROLL': {
      const { player, tournamentId, teamId, shirtNumber, paymentType, inscriptionFee } = action.payload;
      const newPlayer = {
        id: generateId(),
        firstName: player.firstName || '',
        lastName: player.lastName || '',
        docNumber: player.docNumber || '',
        birthDate: player.birthDate || '',
        photo: player.photo || null,
        createdAt: new Date().toISOString(),
      };
      const enrollment = {
        id: generateId(),
        playerId: newPlayer.id,
        shirtNumber: shirtNumber || '',
        payment: buildPayment(paymentType, inscriptionFee),
        enrolledAt: new Date().toISOString(),
      };
      return {
        ...state,
        globalPlayers: [...state.globalPlayers, newPlayer],
        tournaments: state.tournaments.map(t => {
          if (t.id !== tournamentId) return t;
          return {
            ...t,
            teams: t.teams.map(tm => {
              if (tm.id !== teamId) return tm;
              return { ...tm, enrollments: [...(tm.enrollments || []), enrollment] };
            }),
          };
        }),
      };
    }

    /* ── Tournaments ── */
    case 'ADD_TOURNAMENT': {
      const p = action.payload;
      const tournament = {
        id: generateId(),
        name: p.name,
        sport: p.sport || 'Fútbol',
        type: p.type || 'league',
        status: 'active',
        createdAt: new Date().toISOString(),
        startDate: p.startDate || '',
        endDate: p.endDate || '',
        description: p.description || '',
        inscriptionFee: Number(p.inscriptionFee) || 0,
        // Extended info
        venue: p.venue || '',
        matchFee: Number(p.matchFee) || 0,
        gameSystem: p.gameSystem || '',
        regulations: p.regulations || '',
        awards: p.awards || '',
        teams: [],
        matches: [],
      };
      return {
        ...state,
        tournaments: [...state.tournaments, tournament],
        activeTournamentId: tournament.id,
      };
    }

    case 'UPDATE_TOURNAMENT': {
      return {
        ...state,
        tournaments: state.tournaments.map(t =>
          t.id === action.payload.id ? { ...t, ...action.payload.data } : t
        ),
      };
    }

    case 'DELETE_TOURNAMENT': {
      const remaining = state.tournaments.filter(t => t.id !== action.payload);
      return {
        ...state,
        tournaments: remaining,
        activeTournamentId:
          state.activeTournamentId === action.payload
            ? (remaining[0]?.id || null)
            : state.activeTournamentId,
      };
    }

    case 'SET_ACTIVE_TOURNAMENT':
      return { ...state, activeTournamentId: action.payload };

    /* ── Teams ── */
    case 'ADD_TEAM': {
      const { tournamentId, team } = action.payload;
      return {
        ...state,
        tournaments: state.tournaments.map(t => {
          if (t.id !== tournamentId) return t;
          const newTeam = {
            id: generateId(),
            name: team.name,
            shortName: team.shortName || team.name.slice(0, 3).toUpperCase(),
            coach: team.coach || '',
            city: team.city || '',
            colorIndex: t.teams.length,
            shield: team.shield || null,
            enrollments: [],
          };
          return { ...t, teams: [...t.teams, newTeam] };
        }),
      };
    }

    case 'DELETE_TEAM': {
      const { tournamentId, teamId } = action.payload;
      return {
        ...state,
        tournaments: state.tournaments.map(t => {
          if (t.id !== tournamentId) return t;
          return { ...t, teams: t.teams.filter(tm => tm.id !== teamId) };
        }),
      };
    }

    /* ── Enrollments ── */
    case 'ENROLL_PLAYER': {
      const { tournamentId, teamId, playerId, shirtNumber, paymentType, inscriptionFee } = action.payload;
      const enrollment = {
        id: generateId(),
        playerId,
        shirtNumber: shirtNumber || '',
        payment: buildPayment(paymentType, inscriptionFee),
        enrolledAt: new Date().toISOString(),
      };
      return {
        ...state,
        tournaments: state.tournaments.map(t => {
          if (t.id !== tournamentId) return t;
          return {
            ...t,
            teams: t.teams.map(tm => {
              if (tm.id !== teamId) return tm;
              return { ...tm, enrollments: [...(tm.enrollments || []), enrollment] };
            }),
          };
        }),
      };
    }

    case 'UNENROLL_PLAYER': {
      const { tournamentId, teamId, enrollmentId } = action.payload;
      return {
        ...state,
        tournaments: state.tournaments.map(t => {
          if (t.id !== tournamentId) return t;
          return {
            ...t,
            teams: t.teams.map(tm => {
              if (tm.id !== teamId) return tm;
              return { ...tm, enrollments: (tm.enrollments || []).filter(e => e.id !== enrollmentId) };
            }),
          };
        }),
      };
    }

    case 'PAY_CASH': {
      const { tournamentId, teamId, enrollmentId } = action.payload;
      return {
        ...state,
        tournaments: state.tournaments.map(t => {
          if (t.id !== tournamentId) return t;
          return {
            ...t,
            teams: t.teams.map(tm => {
              if (tm.id !== teamId) return tm;
              return {
                ...tm,
                enrollments: (tm.enrollments || []).map(e => {
                  if (e.id !== enrollmentId) return e;
                  return { ...e, payment: { ...e.payment, paid: true, paidDate: new Date().toISOString() } };
                }),
              };
            }),
          };
        }),
      };
    }

    case 'PAY_INSTALLMENT': {
      const { tournamentId, teamId, enrollmentId, installmentNumber } = action.payload;
      return {
        ...state,
        tournaments: state.tournaments.map(t => {
          if (t.id !== tournamentId) return t;
          return {
            ...t,
            teams: t.teams.map(tm => {
              if (tm.id !== teamId) return tm;
              return {
                ...tm,
                enrollments: (tm.enrollments || []).map(e => {
                  if (e.id !== enrollmentId) return e;
                  return {
                    ...e,
                    payment: {
                      ...e.payment,
                      installments: e.payment.installments.map(inst =>
                        inst.number === installmentNumber
                          ? { ...inst, paid: true, paidDate: new Date().toISOString() }
                          : inst
                      ),
                    },
                  };
                }),
              };
            }),
          };
        }),
      };
    }

    /* ── Matches ── */
    case 'SET_MATCHES': {
      const { tournamentId, matches } = action.payload;
      return {
        ...state,
        tournaments: state.tournaments.map(t =>
          t.id === tournamentId ? { ...t, matches } : t
        ),
      };
    }

    case 'UPDATE_MATCH': {
      const { tournamentId, matchId, data } = action.payload;
      return {
        ...state,
        tournaments: state.tournaments.map(t => {
          if (t.id !== tournamentId) return t;
          return {
            ...t,
            matches: t.matches.map(m => m.id === matchId ? { ...m, ...data } : m),
          };
        }),
      };
    }

    case 'ADD_MATCH': {
      const { tournamentId, match } = action.payload;
      return {
        ...state,
        tournaments: state.tournaments.map(t => {
          if (t.id !== tournamentId) return t;
          return { ...t, matches: [...t.matches, { id: generateId(), ...match }] };
        }),
      };
    }

    case 'DELETE_MATCH': {
      const { tournamentId, matchId } = action.payload;
      return {
        ...state,
        tournaments: state.tournaments.map(t => {
          if (t.id !== tournamentId) return t;
          return { ...t, matches: t.matches.filter(m => m.id !== matchId) };
        }),
      };
    }

    case '_LOAD_STATE':
      return { ...INITIAL_STATE, ...action.payload };

    default:
      return state;
  }
}

function getLocalState() {
  try {
    const saved = localStorage.getItem('tourneypro_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        activeTournamentId: null,
        ...parsed,
        globalPlayers: Array.isArray(parsed.globalPlayers) ? parsed.globalPlayers : [],
        tournaments: Array.isArray(parsed.tournaments) ? parsed.tournaments : [],
      };
    }
    const v1 = localStorage.getItem('tourneypro_v1');
    if (v1) {
      const old = JSON.parse(v1);
      return {
        globalPlayers: [],
        tournaments: (old.tournaments || []).map(t => ({
          ...t,
          inscriptionFee: 0,
          teams: (t.teams || []).map(tm => ({
            ...tm,
            enrollments: [],
            players: undefined,
          })),
        })),
        activeTournamentId: old.activeTournamentId,
      };
    }
  } catch { /* ignore */ }
  return INITIAL_STATE;
}

export function TournamentProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE, getLocalState);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbReady, setDbReady] = useState(false);

  /* Load from Supabase on mount, overwrite local state if DB has data */
  useEffect(() => {
    loadStateFromDB().then(dbData => {
      if (dbData) {
        const normalized = {
          activeTournamentId: null,
          ...dbData,
          globalPlayers: Array.isArray(dbData.globalPlayers) ? dbData.globalPlayers : [],
          tournaments: Array.isArray(dbData.tournaments) ? dbData.tournaments : [],
        };
        dispatch({ type: '_LOAD_STATE', payload: normalized });
      }
      setDbReady(true);
    }).catch(() => {
      setDbReady(true);
    }).finally(() => {
      setDbLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Save to Supabase and localStorage after every state change (debounced 800ms) */
  useEffect(() => {
    if (!dbReady) return;
    localStorage.setItem('tourneypro_v2', JSON.stringify(state));
    const timer = setTimeout(() => {
      saveStateToDB(state);
    }, 800);
    return () => clearTimeout(timer);
  }, [state, dbReady]);

  const activeTournament =
    state.tournaments.find(t => t.id === state.activeTournamentId) ||
    state.tournaments[0] ||
    null;

  if (dbLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg)', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ fontSize: '2.5rem' }}>🏆</div>
        <div style={{ color: 'var(--primary-light)', fontWeight: 700, fontSize: '1.1rem' }}>
          Conectando con la base de datos…
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>TourneyPro</div>
      </div>
    );
  }

  return (
    <TournamentContext.Provider value={{ state, dispatch, activeTournament }}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const ctx = useContext(TournamentContext);
  if (!ctx) throw new Error('useTournament must be inside TournamentProvider');
  return ctx;
}

/* ── Helpers for enrollment ── */

/** Returns the team (and tournament) a player is enrolled in, within a given tournament */
export function findPlayerEnrollment(tournament, playerId) {
  for (const team of tournament.teams) {
    const e = (team.enrollments || []).find(en => en.playerId === playerId);
    if (e) return { team, enrollment: e };
  }
  return null;
}

/** Returns all enrollments of a player across all tournaments */
export function findAllEnrollments(tournaments, playerId) {
  const result = [];
  for (const t of tournaments) {
    for (const team of t.teams) {
      const e = (team.enrollments || []).find(en => en.playerId === playerId);
      if (e) result.push({ tournament: t, team, enrollment: e });
    }
  }
  return result;
}

/** Payment summary helpers */
export function getPaymentStatus(payment) {
  if (!payment) return { label: 'Sin pago', color: 'var(--text-muted)', pct: 0 };
  if (payment.type === 'cash') {
    return payment.paid
      ? { label: 'Pagado', color: 'var(--success)', pct: 100 }
      : { label: 'Pendiente', color: 'var(--danger)', pct: 0 };
  }
  const paid = payment.installments.filter(i => i.paid).length;
  const total = payment.installments.length;
  const paidAmount = payment.installments.filter(i => i.paid).reduce((s, i) => s + i.amount, 0);
  if (paid === total) return { label: 'Pagado (3/3)', color: 'var(--success)', pct: 100 };
  if (paid === 0) return { label: '0 / 3 cuotas', color: 'var(--danger)', pct: 0 };
  return { label: `${paid} / ${total} cuotas`, color: 'var(--warning)', pct: Math.round((paidAmount / payment.totalAmount) * 100) };
}
