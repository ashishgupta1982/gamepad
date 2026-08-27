import { useEffect, useRef } from 'react';

// Hold the screen awake while a game is on.
//
// The pattern is lifted from CookBook, which does the same for cook mode. A
// darts leg or a bingo card gets looked at far more than it gets touched, and a
// screen that blanks mid-turn means unlocking the phone before you can score.
//
// Two things make this fiddly, and both are handled here:
//
//  - The API is not everywhere. Missing support, an insecure origin or a denied
//    request all just mean no wake lock; none of them are errors worth
//    surfacing, so every path swallows and carries on.
//  - The lock is dropped automatically whenever the tab is hidden, and is NOT
//    restored when it comes back. Without the visibilitychange listener the
//    screen sleeps again the first time someone checks a message mid-game.
export default function useWakeLock(enabled = true) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return undefined;

    let cancelled = false;

    const acquire = async () => {
      if (document.visibilityState !== 'visible') return;
      if (sentinelRef.current) return;
      try {
        const sentinel = await navigator.wakeLock.request('screen');
        if (cancelled) {
          sentinel.release().catch(() => {});
          return;
        }
        sentinelRef.current = sentinel;
        // Fires on OS-initiated release too, so the ref cannot go stale and
        // block a later re-acquire.
        sentinel.addEventListener('release', () => {
          sentinelRef.current = null;
        });
      } catch {
        // Not supported, not permitted, or the document was not visible.
      }
    };

    const release = () => {
      const sentinel = sentinelRef.current;
      sentinelRef.current = null;
      sentinel?.release().catch(() => {});
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') acquire();
    };

    acquire();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      release();
    };
  }, [enabled]);
}
