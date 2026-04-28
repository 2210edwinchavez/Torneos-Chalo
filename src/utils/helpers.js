export const COLORS = [
  '#84cc16','#22c55e','#f59e0b','#ef4444','#06b6d4',
  '#a3e635','#16a34a','#eab308','#f97316','#10b981',
];

export function getTeamColor(index) {
  return COLORS[index % COLORS.length];
}

export function getInitials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/** Calculate league standings from a list of matches */
export function calcStandings(teams, matches) {
  const table = {};
  teams.forEach(t => {
    table[t.id] = { team: t, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 };
  });

  matches.forEach(m => {
    if (m.status !== 'finished') return;
    const home = table[m.homeId];
    const away = table[m.awayId];
    if (!home || !away) return;
    const hg = Number(m.homeScore) || 0;
    const ag = Number(m.awayScore) || 0;

    home.pj++; away.pj++;
    home.gf += hg; home.gc += ag;
    away.gf += ag; away.gc += hg;

    if (hg > ag) {
      home.pg++; home.pts += 3;
      away.pp++;
    } else if (hg < ag) {
      away.pg++; away.pts += 3;
      home.pp++;
    } else {
      home.pe++; home.pts++;
      away.pe++; away.pts++;
    }
  });

  return Object.values(table)
    .map(r => ({ ...r, dg: r.gf - r.gc }))
    .sort((a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf);
}

/** Generate round-robin fixtures for league */
export function generateLeagueFixtures(teams) {
  const fixtures = [];
  const n = teams.length;
  const list = [...teams];
  if (n % 2 !== 0) list.push({ id: 'bye', name: 'BYE' });
  const rounds = list.length - 1;
  const half = list.length / 2;

  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const home = list[i];
      const away = list[list.length - 1 - i];
      if (home.id !== 'bye' && away.id !== 'bye') {
        fixtures.push({
          id: generateId(),
          round: r + 1,
          homeId: home.id,
          awayId: away.id,
          homeScore: null,
          awayScore: null,
          status: 'scheduled',
          date: '',
        });
      }
    }
    list.splice(1, 0, list.pop());
  }
  return fixtures;
}

/** Generate knockout bracket (single elimination) */
export function generateKnockoutBracket(teams) {
  const shuffled = [...teams].sort(() => Math.random() - 0.5);
  const matches = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    if (shuffled[i + 1]) {
      matches.push({
        id: generateId(),
        round: 1,
        homeId: shuffled[i].id,
        awayId: shuffled[i + 1].id,
        homeScore: null,
        awayScore: null,
        status: 'scheduled',
        date: '',
        bracketSlot: Math.floor(i / 2),
      });
    }
  }
  return matches;
}

export function getRoundName(round, totalRounds) {
  const diff = totalRounds - round;
  if (diff === 0) return 'Final';
  if (diff === 1) return 'Semifinal';
  if (diff === 2) return 'Cuartos de final';
  if (diff === 3) return 'Octavos de final';
  return `Ronda ${round}`;
}
