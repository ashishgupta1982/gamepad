import { useCallback, useEffect, useState } from 'react';

// "Get ready for the museum": save every photo on the phone before the visit.
//
// The page puts the photos into the Cache API itself, so it can count them;
// public/egypt-sw.js then answers the <img> requests from that cache. Both use
// the cache name below, so change them together.
const CACHE = 'egypt-photos-v1';
const AT_ONCE = 4;

const supported = () =>
  typeof window !== 'undefined' && 'caches' in window && 'serviceWorker' in navigator;

export default function useOfflinePhotos(urls) {
  const [saved, setSaved] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [available, setAvailable] = useState(false);
  const total = urls.length;

  useEffect(() => {
    if (!supported()) return;
    setAvailable(true);
    navigator.serviceWorker.register('/egypt-sw.js', { scope: '/games/egypt-explorer' }).catch(() => {});
    let cancelled = false;
    (async () => {
      const cache = await caches.open(CACHE);
      const hits = await Promise.all(urls.map((u) => cache.match(u)));
      if (!cancelled) setSaved(hits.filter(Boolean).length);
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [urls]);

  const getReady = useCallback(async () => {
    if (!supported() || busy) return;
    setBusy(true);
    setError('');
    let failed = 0;
    try {
      const cache = await caches.open(CACHE);
      const missing = [];
      for (const u of urls) if (!(await cache.match(u))) missing.push(u);
      setSaved(total - missing.length);
      const queue = [...missing];
      const worker = async () => {
        while (queue.length) {
          const u = queue.shift();
          try {
            const res = await fetch(u, { mode: 'cors', credentials: 'omit' });
            if (!res.ok) throw new Error(String(res.status));
            await cache.put(u, res);
            setSaved((n) => n + 1);
          } catch {
            failed += 1;
          }
        }
      };
      await Promise.all(Array.from({ length: AT_ONCE }, worker));
      if (failed) setError(`${failed} photo${failed === 1 ? '' : 's'} could not be saved. Try again on Wi-Fi.`);
    } catch {
      setError('Photos could not be saved on this phone.');
    } finally {
      setBusy(false);
    }
  }, [urls, total, busy]);

  return { available, saved, total, busy, error, getReady, done: total > 0 && saved >= total };
}
