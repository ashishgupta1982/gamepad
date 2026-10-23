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

/**
 * The questions a game got as far as: all of them once it is over, or up to
 * the one on screen when it was ended early. None if it never started.
 */
export function playedIds(game) {
  const upTo = Math.max(0, (game?.index ?? -1) + 1);
  return (game?.questions || []).slice(0, upTo).filter((q) => q?.id).map((q) => q.id);
}

/** A player's list after a game: the new questions added at the end, no repeats, capped. */
export function addSeen(list, ids) {
  const fresh = (Array.isArray(ids) ? ids : []).filter((id) => typeof id === 'string' && id.length < 16);
  const set = new Set(fresh);
  return [...(list || []).filter((id) => !set.has(id)), ...new Set(fresh)].slice(-SEEN_CAP);
}

// A signed-in player's handle: their quiz name, unique across GamePad
// (Ash, 2026-10-23). A name in a game that matches a handle is that player,
// and their memory is their account's own, kept under this key, which a typed
// name can never become (nameKey lower-cases).
export const SELF = 'SELF';
export const HANDLE_MAX = 20;

/** A handle as typed, tidied; '' if it will not do (it needs a letter or digit). */
export function cleanHandle(text) {
  const h = String(text ?? '').trim().replace(/\s+/g, ' ').slice(0, HANDLE_MAX).trim();
  return /[\p{L}\p{N}]/u.test(h) ? h : '';
}

/** The handle a new player starts with: their first name, else their email's first part. */
export function handleBase(name, email) {
  const first = String(name ?? '').trim().split(/\s+/)[0] || String(email ?? '').split('@')[0].replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(' ')[0];
  const h = cleanHandle(first) || 'Player';
  return h.charAt(0).toUpperCase() + h.slice(1);
}
