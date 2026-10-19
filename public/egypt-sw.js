// Egypt Explorer's photo cache.
//
// Registered by the Egypt Explorer page only, with that page as its scope, so
// it controls nothing else in GamePad. It answers requests for Wikimedia photos
// from the cache first, and caches anything it fetches. "Get ready" on the trip
// screen fills the same cache ahead of the visit (components/egypt/
// useOfflinePhotos.js), so the stops still have their pictures in a museum
// with no signal. Everything else goes to the network untouched.
//
// Bump CACHE to throw the old photos away.
const CACHE = 'egypt-photos-v1';
const PHOTO_HOSTS = ['thumb.wikimedia.org', 'upload.wikimedia.org'];

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('egypt-photos-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || !PHOTO_HOSTS.includes(url.hostname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(url.href);
    if (hit) return hit;
    try {
      const res = await fetch(url.href, { mode: 'cors', credentials: 'omit' });
      if (res.ok) cache.put(url.href, res.clone());
      return res;
    } catch (err) {
      return Response.error();
    }
  })());
});
