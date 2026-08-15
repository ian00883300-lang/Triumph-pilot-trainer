const SW_VERSION = "triumph-v169-network-first";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isNavigation = req.mode === "navigate";
  const isCore = url.pathname.endsWith("/index.html") ||
                 url.pathname.endsWith("/version.json") ||
                 url.pathname.endsWith("/triumph-pilot.webmanifest");
  if (isNavigation || isCore) {
    event.respondWith(fetch(new Request(req,{cache:"no-store"})));
    return;
  }
  event.respondWith(fetch(req));
});