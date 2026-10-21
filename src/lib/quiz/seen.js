// Who has seen which questions, per player name on an account (models/QuizSeen.js).
// Pure helpers, shared by the routes and their tests.

// A player's memory keeps their most recent questions; beyond this the oldest
// may come round again, which with 1,050 questions is many games away.
export const SEEN_CAP = 2000;

/** How a name is matched: "Dad", "dad" and " Dad " are one player. */
export const nameKey = (name) => String(name ?? '').trim().replace(/\s+/g, ' ').toLowerCase().slice(0, 40);

/** The distinct, usable names of a game's players. */
export function playerKeys(names) {
  const out = [];
  for (const n of Array.isArray(names) ? names : []) {
    const key = nameKey(n);
    if (key && !out.includes(key)) out.push(key);
  }
  return out.slice(0, 12);
}

/** A player's list after a game: the new questions added at the end, no repeats, capped. */
export function addSeen(list, ids) {
  const fresh = (Array.isArray(ids) ? ids : []).filter((id) => typeof id === 'string' && id.length < 16);
  const set = new Set(fresh);
  return [...(list || []).filter((id) => !set.has(id)), ...new Set(fresh)].slice(-SEEN_CAP);
}
