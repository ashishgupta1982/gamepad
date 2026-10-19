import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { normalise, mergeProgress, sameProgress, isLegacyProgress } from '@/lib/egypt/progress';

// Egypt Explorer's progress for one trip, kept where GamePad's save contract says.
//
// Always in localStorage, so the game works with no signal and survives a
// closed tab. For a signed-in family it is also saved to their account
// (api/egypt/progress), and several phones play on that account at once: each
// save is merged into the account's copy, and the merged copy comes back. While
// the trip is open the phone also fetches the account's copy every
// REFRESH_EVERY, and when it comes back into view or online, so everyone's
// points move as the day goes on. Anything this phone has that the account
// lacks (played offline, or a save that failed) goes up then too.
//
// Saves are debounced: a quiz answer and its points land as one write, not
// three. The last one is flushed with keepalive when the page is hidden, which
// is how a phone "closes" a tab.
const key = (trip) => `gamepad:egypt:${trip}`;
const SAVE_DELAY = 1500;
const REFRESH_EVERY = 30 * 1000;

/** This phone's saved progress for a trip (version 2), or null. Browser only. */
export function readLocal(trip) {
  try {
    const raw = window.localStorage.getItem(key(trip));
    return normalise(raw ? JSON.parse(raw) : null);
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

// A version 1 save is upgraded in place, so keep the original beside it once.
function keepLegacy(trip) {
  try {
    const raw = window.localStorage.getItem(key(trip));
    if (!raw || !isLegacyProgress(JSON.parse(raw))) return;
    if (!window.localStorage.getItem(`${key(trip)}:v1`)) window.localStorage.setItem(`${key(trip)}:v1`, raw);
  } catch {
    // As above.
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

  // Take in a copy from the account: everyone else's go, merged with ours.
  const adopt = useCallback(
    (remote) => {
      const merged = mergeProgress(remote, ref.current);
      if (merged && !sameProgress(merged, ref.current)) {
        ref.current = merged;
        setProgress(merged);
        writeLocal(trip, merged);
      }
      return merged;
    },
    [trip],
  );

  const pushToServer = useCallback(
    (keepalive = false) => {
      if (!signedIn || !dirty.current || !ref.current) return;
      dirty.current = false;
      fetch('/api/egypt/progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip, progress: ref.current }),
        keepalive,
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((data) => adopt(data?.progress))
        .catch(() => {
          dirty.current = true;
        });
    },
    [signedIn, trip, adopt],
  );

  const refresh = useCallback(() => {
    if (!signedIn) return;
    fetch(`/api/egypt/progress?trip=${encodeURIComponent(trip)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        const remote = normalise(data.progress);
        const merged = adopt(remote);
        // This phone has something the account does not: send it.
        if (merged && !sameProgress(merged, remote)) {
          dirty.current = true;
          pushToServer();
        }
      })
      .catch(() => {});
  }, [signedIn, trip, adopt, pushToServer]);

  // This phone first: instant, and works offline.
  useEffect(() => {
    keepLegacy(trip);
    const local = readLocal(trip);
    ref.current = local;
    setProgress(local);
    if (local) writeLocal(trip, local);
    setReady(true);
  }, [trip]);

  // Then the account, once we know there is one, and every so often after.
  useEffect(() => {
    if (!ready || !signedIn) return undefined;
    refresh();
    const tick = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, REFRESH_EVERY);
    window.addEventListener('online', refresh);
    return () => {
      clearInterval(tick);
      window.removeEventListener('online', refresh);
    };
  }, [ready, signedIn, refresh]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        clearTimeout(timer.current);
        pushToServer(true);
      } else {
        refresh();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [pushToServer, refresh]);

  /** Apply a change: `fn(current) -> next`. */
  const update = useCallback(
    (fn) => {
      const next = fn(ref.current);
      if (!next || next === ref.current) return;
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
