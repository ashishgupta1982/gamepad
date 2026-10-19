// Egypt Explorer's game state, and every rule that scores it.
//
// Pure functions over plain objects, so the same state can sit in localStorage
// for a guest and in a Game document for a signed-in family, so several phones
// on one account can merge what each of them has done (mergeProgress), and so
// the rules are testable without a browser (progress.test.js).
//
// Two objects. The FAMILY is everyone playing, shared by every trip and every
// phone on the account (hooks/useEgyptFamily.js, /api/egypt/family):
//
//   { players: [{ id, name }], updatedAt }
//
// A player's id is made from their name (playerId), so two phones that set up
// the same family agree on everyone's id without having to talk first. The
// cost is that renaming someone starts them afresh. Which of them is holding a
// phone is that phone's business, kept in its localStorage, not in here.
//
// A trip's PROGRESS is what each of them has done there. Everyone plays every
// stop for themselves:
//
//   {
//     v: 2, trip: 'gem',
//     players: [{ id, name }],   // the family when last saved: the launcher's label
//     play: {
//       [playerId]: {
//         [stopId]: {
//           answers: { [questionIndex]: { choice, correct } },
//           quest:   { found, override, says, at } | null,
//           looked:  [lookForIndex], lookedAt,
//         },
//       },
//     },
//     shared: { [stopId]: { looked: [lookForIndex] } },   // version 1's ticks
//     asked: 0,           // questions put to the guide
//     startedAt, updatedAt,
//   }
//
// Version 1 (the GEM's first day, 2026-10-19) kept one answer per question for
// the whole family, with `by` saying who gave it. `upgrade` moves each answer
// and quest to whoever gave it, so their points stand and everyone else can
// still play that question. Version 1's "look closely" ticks had no owner, so
// they stay in `shared` and count to the family total only.
//
// Points are never stored. They are worked out from what happened, so a scoring
// change applies to a trip already under way and the totals can never drift
// from the record.

export const POINTS = {
  correct: 10, // a quiz question answered right
  quest: 20, // a photo quest found
  look: 2, // a "look closely" item ticked off
};

// Ranks by stamps: each explorer's own, and the family's (familyStampCount).
export const RANKS = [
  { stamps: 0, title: 'Tourist' },
  { stamps: 1, title: 'Tomb Explorer' },
  { stamps: 3, title: 'Scribe' },
  { stamps: 5, title: 'High Priest' },
  { stamps: 7, title: 'Vizier' },
  { stamps: 9, title: 'Pharaoh' },
];

export const MAX_PLAYERS = 8;

// The date a family worked out from old saves carries, so that any family
// someone actually typed in wins over it.
export const EPOCH = '1970-01-01T00:00:00.000Z';

const now = () => new Date().toISOString();
const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const isPlayer = (x) => isObj(x) && typeof x.id === 'string' && typeof x.name === 'string';
const keys = (o) => (isObj(o) ? Object.keys(o) : []);
const union = (a, b) => [...new Set([...a, ...b])];
const EMPTY = Object.freeze({ answers: Object.freeze({}), quest: null, looked: Object.freeze([]) });

// ─── The family ────────────────────────────────────────────────────────────

/**
 * A player's id, from their name. Lower-cased, so "mia" and "Mia" are one
 * person; and escaped, so a name with a dot or a dollar is still a safe Mongo
 * field name inside `play`.
 */
export function playerId(name) {
  return `n_${encodeURIComponent(String(name).trim().toLowerCase()).replace(/\./g, '%2E')}`;
}

/** Names as typed: trimmed, blanks dropped, repeats removed, at most MAX_PLAYERS. */
export function cleanNames(names) {
  const seen = new Set();
  return names
    .map((n) => String(n || '').trim().slice(0, 24))
    .filter((n) => n && !seen.has(n.toLowerCase()) && seen.add(n.toLowerCase()))
    .slice(0, MAX_PLAYERS);
}

export function newFamily(names, updatedAt = now()) {
  return { players: cleanNames(names).map((name) => ({ id: playerId(name), name })), updatedAt };
}

export function isFamily(f) {
  return isObj(f) && Array.isArray(f.players) && f.players.every(isPlayer) && typeof f.updatedAt === 'string';
}

/** The newer of two families: the last phone to edit the list wins it. */
export function newerFamily(a, b) {
  if (!a) return b || null;
  if (!b) return a;
  return String(a.updatedAt) >= String(b.updatedAt) ? a : b;
}

// ─── A trip's progress ─────────────────────────────────────────────────────

function touch(progress) {
  return { ...progress, updatedAt: now() };
}

const snapshot = (players) => players.map(({ id, name }) => ({ id, name }));

export function newProgress(trip, players = []) {
  return { v: 2, trip, players: snapshot(players), play: {}, shared: {}, asked: 0, startedAt: now(), updatedAt: now() };
}

/** Keep the family's names on the progress, for the launcher. Same object if unchanged. */
export function withPlayers(progress, players) {
  const same =
    progress.players.length === players.length &&
    progress.players.every((p, i) => p.id === players[i].id && p.name === players[i].name);
  return same ? progress : { ...progress, players: snapshot(players) };
}

/** One player's record at one stop (never null). */
export function playerStop(progress, pid, stopId) {
  const s = progress?.play?.[pid]?.[stopId];
  return isObj(s) ? s : EMPTY;
}

function withPlayerStop(progress, pid, stopId, change) {
  const mine = progress.play?.[pid] || {};
  const current = playerStop(progress, pid, stopId);
  return touch({
    ...progress,
    play: { ...progress.play, [pid]: { ...mine, [stopId]: { ...current, ...change(current) } } },
  });
}

/** Record a player's answer. Each question is answered once per player; a second go is ignored. */
export function recordAnswer(progress, stop, qIndex, choice, pid) {
  if (!pid) return progress;
  if (playerStop(progress, pid, stop.id).answers[qIndex]) return progress;
  const q = stop.quiz[qIndex];
  if (!q) return progress;
  return withPlayerStop(progress, pid, stop.id, (s) => ({
    answers: { ...s.answers, [qIndex]: { choice, correct: choice === q.answer } },
  }));
}

/**
 * Record a player's photo quest. `found` is the guide's verdict; `override` is
 * a parent saying "we definitely found it" when the photo did not convince the
 * AI. Both score: the point is that they looked, not that the camera was
 * perfect.
 */
export function recordQuest(progress, stopId, pid, { found, override = false, says = '' }) {
  if (!pid) return progress;
  return withPlayerStop(progress, pid, stopId, () => ({
    quest: { found: !!found || !!override, override: !!override, says: String(says).slice(0, 600), at: now() },
  }));
}

export function toggleLooked(progress, stopId, pid, index) {
  if (!pid) return progress;
  return withPlayerStop(progress, pid, stopId, (s) => {
    const looked = s.looked || [];
    return {
      looked: looked.includes(index) ? looked.filter((i) => i !== index) : [...looked, index],
      lookedAt: now(),
    };
  });
}

export function countAsk(progress) {
  return touch({ ...progress, asked: (progress.asked || 0) + 1 });
}

/** One player's go at a stop. */
export function stopStatus(progress, stop, pid) {
  const s = playerStop(progress, pid, stop.id);
  const answers = s.answers || {};
  const answered = Object.keys(answers).length;
  const correct = Object.values(answers).filter((a) => a?.correct).length;
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

export function stampCount(progress, trip, pid) {
  return trip.stops.filter((stop) => stopStatus(progress, stop, pid).stamped).length;
}

/**
 * The family's stamp for a stop: every question there answered by somebody.
 * Anyone finishing the quiz gets it, and so does a version 1 stop, where the
 * questions were shared out.
 */
export function familyStamped(progress, stop) {
  const answered = new Set();
  for (const pid of keys(progress.play)) for (const q of keys(playerStop(progress, pid, stop.id).answers)) answered.add(q);
  return stop.quiz.length > 0 && stop.quiz.every((_, i) => answered.has(String(i)));
}

export function familyStampCount(progress, trip) {
  return trip.stops.filter((stop) => familyStamped(progress, stop)).length;
}

export function rankFor(stamps) {
  return [...RANKS].reverse().find((r) => stamps >= r.stamps) || RANKS[0];
}

/** The first stop a player has not stamped, in route order, or null when all are done. */
export function nextStop(progress, trip, pid) {
  return trip.stops.find((stop) => !stopStatus(progress, stop, pid).stamped) || null;
}

/** Who has found a stop's quest, first finder first. */
export function questFinders(progress, stopId) {
  return keys(progress.play)
    .map((pid) => ({ pid, quest: playerStop(progress, pid, stopId).quest }))
    .filter((x) => x.quest?.found)
    .sort((a, b) => String(a.quest.at).localeCompare(String(b.quest.at)))
    .map((x) => x.pid);
}

function pointsFor(progress, trip, pid) {
  let points = 0;
  for (const stop of trip.stops) {
    const s = playerStop(progress, pid, stop.id);
    points += Object.values(s.answers || {}).filter((a) => a?.correct).length * POINTS.correct;
    if (s.quest?.found) points += POINTS.quest;
    points += (s.looked || []).length * POINTS.look;
  }
  return points;
}

/**
 * Each player's points and stamps, best first, plus the family's total. The
 * total counts everything anyone did, including someone since taken off the
 * family list, and version 1's shared ticks.
 */
export function scores(progress, trip, players) {
  let team = 0;
  for (const pid of keys(progress.play)) team += pointsFor(progress, trip, pid);
  for (const stop of trip.stops) team += (progress.shared?.[stop.id]?.looked || []).length * POINTS.look;
  const board = players
    .map((p) => ({ id: p.id, name: p.name, points: pointsFor(progress, trip, p.id), stamps: stampCount(progress, trip, p.id) }))
    .sort((a, b) => b.points - a.points);
  return { team, board };
}

// ─── Saving, upgrading and merging ─────────────────────────────────────────

/** Light shape check for anything read back from storage or a request body. */
export function isProgress(p) {
  return (
    isObj(p) &&
    p.v === 2 &&
    typeof p.trip === 'string' &&
    Array.isArray(p.players) &&
    p.players.every(isPlayer) &&
    isObj(p.play) &&
    Object.values(p.play).every(isObj) &&
    (p.shared == null || isObj(p.shared))
  );
}

/** Version 1's shape: one answer per question for the whole family. */
export function isLegacyProgress(p) {
  return isObj(p) && p.v === 1 && typeof p.trip === 'string' && Array.isArray(p.players) && p.players.every(isPlayer) && isObj(p.stops);
}

/** Any saved progress as version 2, or null if it is neither. */
export function upgrade(p) {
  if (isProgress(p)) return p;
  if (!isLegacyProgress(p)) return null;
  const ids = new Map(p.players.map((x) => [x.id, playerId(x.name)]));
  const updatedAt = p.updatedAt || now();
  const play = {};
  const shared = {};
  const put = (by, stopId) => {
    const pid = ids.get(by) || by;
    if (typeof pid !== 'string' || !pid) return null;
    play[pid] ||= {};
    play[pid][stopId] ||= { answers: {}, quest: null, looked: [] };
    return play[pid][stopId];
  };
  for (const [stopId, s] of Object.entries(p.stops)) {
    if (!isObj(s)) continue;
    for (const [q, a] of Object.entries(isObj(s.answers) ? s.answers : {})) {
      const mine = isObj(a) && put(a.by, stopId);
      if (mine) mine.answers[q] = { choice: a.choice, correct: !!a.correct };
    }
    const quest = isObj(s.quest) && s.quest.found ? s.quest : null;
    const mine = quest && put(quest.by, stopId);
    if (mine) mine.quest = { found: true, override: !!quest.override, says: String(quest.says || ''), at: String(quest.at || updatedAt) };
    if (Array.isArray(s.looked) && s.looked.length) shared[stopId] = { looked: [...s.looked] };
  }
  return {
    v: 2,
    trip: p.trip,
    players: p.players.map((x) => ({ id: playerId(x.name), name: x.name })),
    play,
    shared,
    asked: Number(p.asked) || 0,
    startedAt: p.startedAt || updatedAt,
    updatedAt,
  };
}

const ints = (a) => (Array.isArray(a) ? [...new Set(a.filter(Number.isInteger))] : []);

function cleanStop(s) {
  if (!isObj(s)) return { answers: {}, quest: null, looked: [] };
  const answers = {};
  for (const [q, a] of Object.entries(isObj(s.answers) ? s.answers : {})) {
    if (isObj(a) && /^\d+$/.test(q)) answers[q] = { choice: a.choice, correct: !!a.correct };
  }
  const quest = isObj(s.quest)
    ? { found: !!s.quest.found, override: !!s.quest.override, says: String(s.quest.says || '').slice(0, 600), at: String(s.quest.at || '') }
    : null;
  const out = { answers, quest, looked: ints(s.looked) };
  if (typeof s.lookedAt === 'string') out.lookedAt = s.lookedAt;
  return out;
}

function pickQuest(a, b) {
  if (!a) return b;
  if (!b) return a;
  if (a.found !== b.found) return a.found ? a : b;
  // Both found ("Take another"): the newer photo's words.
  return String(b.at) > String(a.at) ? b : a;
}

function mergeStop(x, y) {
  const a = cleanStop(x);
  const b = cleanStop(y);
  // An answer is final, so where two phones disagree the first one's stands.
  const out = { answers: { ...b.answers, ...a.answers }, quest: pickQuest(a.quest, b.quest), looked: a.looked };
  const newer = String(b.lookedAt || '') > String(a.lookedAt || '') ? b : a;
  out.looked = newer.looked;
  if (newer.lookedAt) out.lookedAt = newer.lookedAt;
  return out;
}

/** Any saved progress, upgraded and tidied, or null. */
export function normalise(p) {
  const u = upgrade(p);
  if (!u) return null;
  const play = {};
  for (const pid of keys(u.play)) {
    play[pid] = {};
    for (const stopId of keys(u.play[pid])) play[pid][stopId] = cleanStop(u.play[pid][stopId]);
  }
  const shared = {};
  for (const stopId of keys(u.shared)) shared[stopId] = { looked: ints(u.shared[stopId]?.looked) };
  return {
    v: 2,
    trip: u.trip,
    players: snapshot(u.players),
    play,
    shared,
    asked: Number(u.asked) || 0,
    startedAt: String(u.startedAt || u.updatedAt || now()),
    updatedAt: String(u.updatedAt || now()),
  };
}

/**
 * Two copies of a trip's progress as one: what each phone did, together.
 *
 * Several phones play on one account at once, so neither copy can simply win.
 * Everything is kept per player, per stop: answers and quests are added
 * together (where a player answered one question differently on two phones,
 * `primary` wins, since that one arrived first), and a player's "look closely"
 * ticks are taken from whichever copy changed them last, so unticking works.
 * The server merges every save into what it has (primary = the stored copy),
 * and each phone merges back what the server sends (primary = the server's).
 */
export function mergeProgress(primary, secondary) {
  const a = normalise(primary);
  const b = normalise(secondary);
  if (!a) return b;
  if (!b || a.trip !== b.trip) return a;
  const play = {};
  for (const pid of union(keys(a.play), keys(b.play))) {
    const pa = a.play[pid] || {};
    const pb = b.play[pid] || {};
    play[pid] = {};
    for (const stopId of union(keys(pa), keys(pb))) play[pid][stopId] = mergeStop(pa[stopId], pb[stopId]);
  }
  const shared = {};
  for (const stopId of union(keys(a.shared), keys(b.shared))) {
    shared[stopId] = { looked: ints([...(a.shared[stopId]?.looked || []), ...(b.shared[stopId]?.looked || [])]).sort((x, y) => x - y) };
  }
  const later = b.updatedAt > a.updatedAt ? b : a;
  return {
    v: 2,
    trip: a.trip,
    players: later.players.length ? later.players : a.players.length ? a.players : b.players,
    play,
    shared,
    asked: Math.max(a.asked, b.asked),
    startedAt: a.startedAt < b.startedAt ? a.startedAt : b.startedAt,
    updatedAt: later.updatedAt,
  };
}

function stable(v) {
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  if (isObj(v)) return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`;
  return JSON.stringify(v ?? null);
}

/** Whether two copies hold the same record, ignoring the dates and key order. */
export function sameProgress(a, b) {
  const x = normalise(a);
  const y = normalise(b);
  if (!x || !y) return x === y;
  const content = (p) => stable({ players: p.players, play: p.play, shared: p.shared, asked: p.asked });
  return content(x) === content(y);
}
