import { useCallback, useEffect, useRef } from 'react';
import { isMatch } from '@/lib/scrabble/rules';

// Where a Scrabble match is kept, the way Darts keeps its own.
//
// Always on this phone, after every turn, so a reload or a locked screen never
// loses a game (guests used to lose the lot). For a signed-in player it is
// also saved to their account through /api/games, as `scrabbleConfig.match`:
// the whole match, which replays to every score.

const KEY = 'scrabble:match';
const NAMES = 'scrabble:names';
const HANDOFF = 'scrabble:handoff';

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

/** Whether the "pass the phone" card shows after each turn (on unless turned off). */
export function handoffOn() {
  try {
    return localStorage.getItem(HANDOFF) !== 'off';
  } catch {
    return true;
  }
}

export function setHandoff(on) {
  try {
    if (on) localStorage.removeItem(HANDOFF);
    else localStorage.setItem(HANDOFF, 'off');
  } catch {}
}

async function send(url, method, body) {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Save failed (${res.status})`);
  return res.json();
}

/**
 * Saves a signed-in player's match to their account as it changes: one save
 * at a time, the newest state of each match, a moment after the last turn.
 *
 * `serverIds` is a ref to a Map of match id → saved game id; a match with none
 * is created on its first save. Keyed by match, not one id for "the game",
 * because "Play again" starts a new match while the last one's final save may
 * still be waiting, and that save must land on its own game. One queue, so
 * saves never arrive out of order (the old scorer's could).
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
      const scrabbleConfig = { match: m };
      const status = m.finished ? 'completed' : 'active';
      const id = serverIds.current.get(m.id);
      try {
        if (!id) {
          const { game } = await send('/api/games', 'POST', { gameType: 'scrabble-scorer', players: m.players.map((p) => p.name), scrabbleConfig });
          serverIds.current.set(m.id, game._id);
          // The phone's copy learns the id at once, so a reload now carries
          // on this saved game rather than starting a second one.
          if (loadLocal()?.match.id === m.id) saveLocal(loadLocal().match, game._id);
          if (m.finished) await send(`/api/games/${game._id}`, 'PATCH', { status });
        } else {
          await send(`/api/games/${id}`, 'PATCH', { scrabbleConfig, status });
        }
      } catch {
        // The phone's copy is the safety net; the next turn tries again.
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

  // Leaving the page mid-wait still saves the last turn.
  useEffect(
    () => () => {
      if (state.current.pending.size) flush();
    },
    [flush],
  );
}

/** The account's Scrabble games. Games from the old scorer have no match and are left out. */
export async function fetchAccountGames() {
  const res = await fetch('/api/games');
  if (!res.ok) return [];
  const { games } = await res.json();
  return (games || []).filter((g) => g.gameType === 'scrabble-scorer' && isMatch(g.scrabbleConfig?.match));
}

export const deleteAccountGame = (id) => fetch(`/api/games/${id}`, { method: 'DELETE' });
