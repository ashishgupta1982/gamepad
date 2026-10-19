import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { isProgress, newer } from '@/lib/egypt/progress';

// Egypt Explorer's progress, kept where GamePad's save contract says.
//
// Always in localStorage, so the game works with no signal and survives a
// closed tab. For a signed-in family it is also saved to their account
// (api/egypt/progress), so a second phone can pick up the trip. On load the
// newer of the two wins (lib/egypt/progress.js `newer`).
//
// Saves to the server are debounced: a quiz answer and its points land as one
// write, not three. The last one is flushed with keepalive when the page is
// hidden, which is how a phone "closes" a tab.
const key = (trip) => `gamepad:egypt:${trip}`;
const SAVE_DELAY = 1500;

/** This phone's saved progress for a trip, or null. Browser only. */
export function readLocal(trip) {
  try {
    const raw = window.localStorage.getItem(key(trip));
    const parsed = raw ? JSON.parse(raw) : null;
    return isProgress(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeLocal(trip, progress) {
  try {
    if (progress) window.localStorage.setItem(key(trip), JSON.stringify(progress));
    else window.localStorage.removeItem(key(trip));
  } catch {
    // Private mode or a full quota. The game carries on; it just will not
    // survive a reload on this phone.
  }
}

export default function useEgyptProgress(trip) {
  const { status } = useSession();
  const signedIn = status === 'authenticated';
  const [progress, setProgress] = useState(null);
  const [ready, setReady] = useState(false);
  const ref = useRef(null);
  const timer = useRef(null);
  const dirty = useRef(false);

  const pushToServer = useCallback(
    (keepalive = false) => {
      if (!signedIn || !dirty.current || !ref.current) return;
      dirty.current = false;
      fetch('/api/egypt/progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip, progress: ref.current }),
        keepalive,
      }).catch(() => {
        dirty.current = true;
      });
    },
    [signedIn, trip],
  );

  // This phone first: instant, and works offline.
  useEffect(() => {
    const local = readLocal(trip);
    ref.current = local;
    setProgress(local);
    setReady(true);
  }, [trip]);

  // Then the account, once we know there is one.
  useEffect(() => {
    if (!ready || !signedIn) return undefined;
    let cancelled = false;
    fetch(`/api/egypt/progress?trip=${encodeURIComponent(trip)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        const remote = isProgress(data?.progress) ? data.progress : null;
        const winner = newer(ref.current, remote);
        if (winner && winner !== ref.current) {
          ref.current = winner;
          setProgress(winner);
          writeLocal(trip, winner);
        } else if (ref.current && (!remote || String(ref.current.updatedAt) > String(remote.updatedAt))) {
          // This phone is ahead of the account (played signed out, or offline).
          dirty.current = true;
          pushToServer();
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ready, signedIn, trip, pushToServer]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') {
        clearTimeout(timer.current);
        pushToServer(true);
      }
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [pushToServer]);

  /** Apply a change: `fn(current) -> next`. */
  const update = useCallback(
    (fn) => {
      const next = fn(ref.current);
      if (next === ref.current) return;
      ref.current = next;
      setProgress(next);
      writeLocal(trip, next);
      dirty.current = true;
      clearTimeout(timer.current);
      timer.current = setTimeout(() => pushToServer(), SAVE_DELAY);
    },
    [trip, pushToServer],
  );

  return { progress, ready, update };
}
