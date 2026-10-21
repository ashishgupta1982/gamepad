import { useCallback, useEffect, useRef } from 'react';
import { isMatch, replay } from '@/lib/darts/rules';

// Where a darts match is kept.
//
// Always on this phone, after every dart, so a reload or a locked screen never
// loses a leg (guests used to lose the lot). For a signed-in player it is also
// saved to their account, through the same /api/games route as before, as
// `dartsConfig.match`: the whole match, which replays to every score, so the
// old problem of fields the schema dropped on save cannot come back.

const KEY = 'darts:match';
const NAMES = 'darts:names';

export function loadLocal() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    return saved && isMatch(saved.match) ? saved : null;
  } catch {
    return null;
  }
}

export function saveLocal(match, serverId) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ match, serverId: serverId || null, at: Date.now() }));
  } catch {}
}

export function clearLocal() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

/** Names used on this phone lately, newest first, for the setup screen. */
export function recentNames() {
  try {
    const list = JSON.parse(localStorage.getItem(NAMES) || '[]');
    return Array.isArray(list) ? list.filter((n) => typeof n === 'string') : [];
  } catch {
    return [];
  }
}

export function rememberNames(names) {
  try {
    const clean = names.map((n) => n.trim()).filter((n) => n && !/^Player \d+$/.test(n));
    const list = [...new Set([...clean, ...recentNames()])].slice(0, 16);
    localStorage.setItem(NAMES, JSON.stringify(list));
  } catch {}
}

async function send(url, method, body) {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Save failed (${res.status})`);
  return res.json();
}

/**
 * Saves a signed-in player's match to their account as it changes: one save
 * at a time, the newest state of each match, a moment after the last dart so
 * a visit is one save rather than three.
 *
 * `serverIds` is a ref to a Map of match id → saved game id; a match with none
 * is created on its first save. Keyed by match, not one id for "the game",
 * because "Play again" starts a new match while the last one's final save may
 * still be waiting, and that save must land on its own game.
 */
export function useAccountSave(match, { enabled, serverIds }) {
  const state = useRef({ busy: false, pending: new Map() });
  const timer = useRef(null);

  const flush = useCallback(async () => {
    const st = state.current;
    if (st.busy) return;
    st.busy = true;
    while (st.pending.size) {
      const [key, m] = st.pending.entries().next().value;
      st.pending.delete(key);
      const finished = replay(m).finished;
      const dartsConfig = { gameMode: m.mode, match: m };
      const id = serverIds.current.get(m.id);
      try {
        if (!id) {
          const { game } = await send('/api/games', 'POST', { gameType: 'darts', players: m.players.map((p) => p.name), dartsConfig });
          serverIds.current.set(m.id, game._id);
          // The phone's copy learns the id at once, so a reload now carries
          // on this saved game rather than starting a second one.
          if (loadLocal()?.match.id === m.id) saveLocal(loadLocal().match, game._id);
          if (finished) await send(`/api/games/${game._id}`, 'PATCH', { status: 'completed' });
        } else {
          await send(`/api/games/${id}`, 'PATCH', { dartsConfig, status: finished ? 'completed' : 'active' });
        }
      } catch {
        // The phone's copy is the safety net; the next dart tries again.
      }
    }
    st.busy = false;
  }, [serverIds]);

  useEffect(() => {
    // Leaving the game: whatever is still waiting goes now.
    if (!enabled || !match) {
      if (state.current.pending.size) flush();
      return undefined;
    }
    state.current.pending.set(match.id, match);
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 700);
    return () => clearTimeout(timer.current);
  }, [match, enabled, flush]);

  // Leaving the page mid-wait still saves the last dart.
  useEffect(
    () => () => {
      if (state.current.pending.size) flush();
    },
    [flush],
  );
}

export async function fetchAccountGames() {
  const res = await fetch('/api/games');
  if (!res.ok) return [];
  const { games } = await res.json();
  return (games || []).filter((g) => g.gameType === 'darts');
}

export const deleteAccountGame = (id) => fetch(`/api/games/${id}`, { method: 'DELETE' });
