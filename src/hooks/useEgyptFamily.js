import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { isFamily, newFamily, newerFamily, upgrade, EPOCH } from '@/lib/egypt/progress';
import { TRIPS } from '@/data/egypt';

// Egypt Explorer's family, and which of them is holding this phone.
//
// The family is one list for every trip. It is kept on the phone and, signed
// in, on the account (api/egypt/family), so every phone signed in to it shows
// the same people; the newest edit wins. Fetched again whenever the game comes
// back into view, which is how a name added on one phone reaches the others.
//
// Who is playing on this phone (`me`) never leaves it: each phone picks its
// own, and the header switches it when the phone is handed over.
//
// A phone that played before the family list existed has the names in its
// trip saves, so the list starts from those (dated EPOCH, so any list someone
// actually typed in beats it).
const FAMILY_KEY = 'gamepad:egypt:family';
const ME_KEY = 'gamepad:egypt:me';

function read(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    if (value == null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Private mode or a full quota: this phone just asks again next time.
  }
}

function readLocalFamily() {
  try {
    const f = JSON.parse(read(FAMILY_KEY) || 'null');
    return isFamily(f) ? f : null;
  } catch {
    return null;
  }
}

function familyFromTrips() {
  const latest = TRIPS.map((t) => {
    try {
      return upgrade(JSON.parse(read(`gamepad:egypt:${t.id}`) || 'null'));
    } catch {
      return null;
    }
  })
    .filter((p) => p?.players?.length)
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))[0];
  return latest ? newFamily(latest.players.map((p) => p.name), EPOCH) : null;
}

export default function useEgyptFamily() {
  const { status } = useSession();
  const signedIn = status === 'authenticated';
  const [family, setFamilyState] = useState(null);
  const [me, setMeState] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [fetched, setFetched] = useState(false);
  const ref = useRef(null);

  const keep = useCallback((f) => {
    ref.current = f;
    setFamilyState(f);
    write(FAMILY_KEY, f ? JSON.stringify(f) : null);
  }, []);

  const push = useCallback(
    (f) => {
      if (!signedIn || !f) return;
      fetch('/api/egypt/family', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ family: f }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (isFamily(data?.family) && newerFamily(ref.current, data.family) !== ref.current) keep(data.family);
        })
        .catch(() => {});
    },
    [signedIn, keep],
  );

  const refresh = useCallback(() => {
    if (!signedIn) return Promise.resolve();
    return fetch('/api/egypt/family', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        const remote = isFamily(data.family) ? data.family : null;
        const winner = newerFamily(ref.current, remote);
        if (winner && winner !== ref.current) keep(winner);
        // The account has no list of its own yet, or an older one: send ours.
        if (ref.current && (!remote || data.derived || ref.current.updatedAt > remote.updatedAt)) push(ref.current);
      })
      .catch(() => {});
  }, [signedIn, keep, push]);

  useEffect(() => {
    const local = readLocalFamily() || familyFromTrips();
    ref.current = local;
    setFamilyState(local);
    setMeState(read(ME_KEY));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || status === 'loading') return undefined;
    let cancelled = false;
    refresh().finally(() => !cancelled && setFetched(true));
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [loaded, status, refresh]);

  const setFamily = useCallback(
    (names) => {
      const f = newFamily(names);
      keep(f);
      push(f);
    },
    [keep, push],
  );

  const setMe = useCallback((id) => {
    setMeState(id);
    write(ME_KEY, id);
  }, []);

  const players = family?.players || [];
  return {
    players,
    // Ready once there is a list to show, or we know there is none to fetch.
    ready: loaded && (players.length > 0 || fetched),
    me: players.some((p) => p.id === me) ? me : null,
    setFamily,
    setMe,
  };
}
