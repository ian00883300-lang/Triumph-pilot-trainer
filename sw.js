/* TRIUMPH Pilot Trainer v184 service worker
   Online navigation: network first (bypass browser HTTP cache).
   Offline fallback: most recently fetched index.html.
*/
const CACHE_NAME = 'triumph-pilot-v184';
const INDEX_FALLBACK = './index.html';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const staleKeys = keys.filter(
      (key) => key.startsWith('triumph-pilot-') && key !== CACHE_NAME
    );
    await Promise.all(staleKeys.map((key) => caches.delete(key)));
    await self.clients.claim();

    // If an older TRIUMPH app-shell cache existed, refresh controlled windows
    // once so users do not remain on the stale shell that launched this update.
    if (staleKeys.length) {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      await Promise.all(clients.map(async (client) => {
        try { await client.navigate(client.url); } catch (_) {}
      }));
    }
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isDocument = request.mode === 'navigate' || request.destination === 'document';
  if (!isDocument) return;

  event.respondWith((async () => {
    try {
      // Bypass both the old service-worker app shell and browser HTTP cache.
      const response = await fetch(request, { cache: 'no-store' });
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(INDEX_FALLBACK, response.clone());
      }
      return response;
    } catch (error) {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(INDEX_FALLBACK);
      if (cached) return cached;
      throw error;
    }
  })());
});
