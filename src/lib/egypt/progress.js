// Egypt Explorer's game state, and every rule that scores it.
//
// Pure functions over one plain object, so the same state can sit in
// localStorage for a guest and in a Game document for a signed-in family, and so
// the rules are testable without a browser (progress.test.js).
//
// Points are never stored. They are worked out from what happened (who answered
// what, who found which quest), so a scoring change applies to a trip already
// under way and the totals can never drift from the record.
//
//   {
//     v: 1, trip: 'gem',
//     players: [{ id, name }],
//     stops: {
//       [stopId]: {
//         answers: { [questionIndex]: { by, choice, correct } },
//         quest:   { by, found, override, says, at },
//         looked:  [lookForIndex],
//       },
//     },
//     asked: 0,           // questions put to the guide
//     startedAt, updatedAt,
//   }

export const POINTS = {
  correct: 10, // a quiz question answered right
  quest: 20, // a photo quest found
  look: 2, // a "look closely" item ticked off
};

// Ranks by stamps, so the whole family climbs together.
export const RANKS = [
  { stamps: 0, title: 'Tourist' },
  { stamps: 1, title: 'Tomb Explorer' },
  { stamps: 3, title: 'Scribe' },
  { stamps: 5, title: 'High Priest' },
  { stamps: 7, title: 'Vizier' },
  { stamps: 9, title: 'Pharaoh' },
];

export const MAX_PLAYERS = 6;

const now = () => new Date().toISOString();
const id = () => `p_${Math.random().toString(36).slice(2, 9)}`;

export function newProgress(trip, names = []) {
  return {
    v: 1,
    trip,
    players: names.map((name) => ({ id: id(), name })),
    stops: {},
    asked: 0,
    startedAt: now(),
    updatedAt: now(),
  };
}

/** Names as typed: trimmed, blanks dropped, repeats removed, at most MAX_PLAYERS. */
export function cleanNames(names) {
  const seen = new Set();
  return names
    .map((n) => String(n || '').trim().slice(0, 24))
    .filter((n) => n && !seen.has(n.toLowerCase()) && seen.add(n.toLowerCase()))
    .slice(0, MAX_PLAYERS);
}

export function setPlayers(progress, names) {
  const clean = cleanNames(names);
  // Keep a player's id when their name stays, so their points stay with them.
  const byName = new Map(progress.players.map((p) => [p.name.toLowerCase(), p]));
  const players = clean.map((name) => byName.get(name.toLowerCase()) || { id: id(), name });
  return touch({ ...progress, players });
}

function touch(progress) {
  return { ...progress, updatedAt: now() };
}

function stopState(progress, stopId) {
  return progress.stops[stopId] || { answers: {}, quest: null, looked: [] };
}

function withStop(progress, stopId, change) {
  const current = stopState(progress, stopId);
  return touch({ ...progress, stops: { ...progress.stops, [stopId]: { ...current, ...change(current) } } });
}

/** Record an answer. A question is answered once; a second call is ignored. */
export function recordAnswer(progress, stop, qIndex, choice, by) {
  const current = stopState(progress, stop.id);
  if (current.answers[qIndex]) return progress;
  const q = stop.quiz[qIndex];
  if (!q) return progress;
  return withStop(progress, stop.id, (s) => ({
    answers: { ...s.answers, [qIndex]: { by, choice, correct: choice === q.answer } },
  }));
}

/**
 * Record a photo quest. `found` is the guide's verdict; `override` is a parent
 * saying "we definitely found it" when the photo did not convince the AI. Both
 * score: the point is that the family looked, not that the camera was perfect.
 */
export function recordQuest(progress, stopId, { by, found, override = false, says = '' }) {
  return withStop(progress, stopId, () => ({
    quest: { by, found: !!found || !!override, override: !!override, says: String(says).slice(0, 600), at: now() },
  }));
}

export function toggleLooked(progress, stopId, index) {
  return withStop(progress, stopId, (s) => {
    const looked = s.looked || [];
    return { looked: looked.includes(index) ? looked.filter((i) => i !== index) : [...looked, index] };
  });
}

export function countAsk(progress) {
  return touch({ ...progress, asked: (progress.asked || 0) + 1 });
}

/** Whose turn it is to answer: round the table, across the whole trip. */
export function nextPlayer(progress) {
  const { players } = progress;
  if (!players.length) return null;
  const answered = Object.values(progress.stops).reduce((n, s) => n + Object.keys(s.answers || {}).length, 0);
  return players[answered % players.length];
}

export function stopStatus(progress, stop) {
  const s = stopState(progress, stop.id);
  const answered = Object.keys(s.answers || {}).length;
  const correct = Object.values(s.answers || {}).filter((a) => a.correct).length;
  const total = stop.quiz.length;
  return {
    answered,
    correct,
    total,
    stamped: total > 0 && answered >= total,
    quest: !!s.quest?.found,
    started: answered > 0 || !!s.quest || (s.looked || []).length > 0,
    perfect: total > 0 && correct === total,
  };
}

export function stampCount(progress, trip) {
  return trip.stops.filter((stop) => stopStatus(progress, stop).stamped).length;
}

export function rankFor(stamps) {
  return [...RANKS].reverse().find((r) => stamps >= r.stamps) || RANKS[0];
}

/** The first stop without a stamp, in route order, or null when all are done. */
export function nextStop(progress, trip) {
  return trip.stops.find((stop) => !stopStatus(progress, stop).stamped) || null;
}

/** Points per player, plus the team's. Looking closely counts to the team. */
export function scores(progress, trip) {
  const per = Object.fromEntries(progress.players.map((p) => [p.id, 0]));
  let team = 0;
  for (const stop of trip.stops) {
    const s = progress.stops[stop.id];
    if (!s) continue;
    for (const a of Object.values(s.answers || {})) {
      if (!a.correct) continue;
      team += POINTS.correct;
      if (a.by in per) per[a.by] += POINTS.correct;
    }
    if (s.quest?.found) {
      team += POINTS.quest;
      if (s.quest.by in per) per[s.quest.by] += POINTS.quest;
    }
    team += (s.looked || []).length * POINTS.look;
  }
  const board = progress.players
    .map((p) => ({ ...p, points: per[p.id] }))
    .sort((a, b) => b.points - a.points);
  return { team, board };
}

/**
 * The newer of two saved states. Used when a signed-in family opens the game on
 * a second phone: whichever device moved last wins, wholesale. Merging two
 * phones' answers question by question was considered and left out: the
 * family plays on one phone at a time, and a merge that guesses wrong is worse
 * than "the last phone you used".
 */
export function newer(a, b) {
  if (!a) return b || null;
  if (!b) return a;
  return String(a.updatedAt) >= String(b.updatedAt) ? a : b;
}

/** Light shape check for anything read back from storage or a request body. */
export function isProgress(p) {
  return (
    !!p &&
    typeof p === 'object' &&
    p.v === 1 &&
    typeof p.trip === 'string' &&
    Array.isArray(p.players) &&
    p.players.every((x) => x && typeof x.id === 'string' && typeof x.name === 'string') &&
    !!p.stops &&
    typeof p.stops === 'object'
  );
}
