import { useCallback, useEffect, useRef, useState } from 'react';

// Following a multi-phone quiz from a phone, the host's screen or the TV.
//
// It polls once a second, sending the version it has; the server answers
// "same" when nothing has changed, so a quiet poll is tiny. Polling replaces
// the old server-sent-events stream, which the platform cut off every few
// minutes and which opened two connections per player on the join page. Every
// poll also lets the server move the game on by the clock.
//
// `offset` is the server's clock minus this device's, so the countdown on every
// phone ends together.

const POLL_MS = 1000;

export async function post(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Something went wrong. Try again?');
    err.status = res.status;
    throw err;
  }
  return data;
}

export default function useLive(code, { player = null } = {}) {
  const [state, setState] = useState({ game: null, v: null, offset: 0, gone: false, offline: false });
  const vRef = useRef(null);

  /** Take a fresh game from any response (a poll, or a POST that returns one). */
  const apply = useCallback((data) => {
    if (!data) return;
    const offset = typeof data.now === 'number' ? data.now - Date.now() : undefined;
    if (data.same) {
      setState((s) => ({ ...s, offline: false, ...(offset !== undefined ? { offset } : {}) }));
      return;
    }
    if (!data.game) return;
    if (vRef.current !== null && data.v < vRef.current) return; // an older answer arriving late
    vRef.current = data.v;
    setState((s) => ({ ...s, game: data.game, v: data.v, offline: false, ...(offset !== undefined ? { offset } : {}) }));
  }, []);

  useEffect(() => {
    if (!code) return undefined;
    let stopped = false;
    let timer = null;
    const poll = async () => {
      if (stopped) return;
      if (document.visibilityState === 'visible') {
        try {
          const q = new URLSearchParams({ v: String(vRef.current ?? ''), ...(player ? { player } : {}) });
          const res = await fetch(`/api/quiz/live/${code}?${q}`, { cache: 'no-store' });
          if (res.status === 404) {
            setState((s) => ({ ...s, gone: true }));
            return;
          }
          apply(await res.json());
        } catch {
          setState((s) => ({ ...s, offline: true }));
        }
      }
      timer = setTimeout(poll, POLL_MS);
    };
    poll();
    const wake = () => document.visibilityState === 'visible' && (clearTimeout(timer), poll());
    document.addEventListener('visibilitychange', wake);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', wake);
    };
  }, [code, player, apply]);

  return { ...state, apply };
}
