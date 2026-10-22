/* TRIUMPH v218: cached navigation first; small version check in the background.
   Never delete a usable older cache during activation and never force a reload. */
const CACHE_NAME = 'triumph-pilot-v218';
const APP_URL = new URL('./index.html', self.registration.scope).href;
const VERSION_URL = new URL('./version.json', self.registration.scope).href;
const ROOT_URL = new URL('./', self.registration.scope).href;
let refreshPromise;

function isAppURL(url) {
  return url.origin === self.location.origin &&
    (url.pathname === new URL(APP_URL).pathname || url.pathname === new URL(ROOT_URL).pathname);
}
function buildOf(text) {
  return text.match(/<title>TRIUMPH Pilot Trainer (v\d+)<\/title>/i)?.[1] || null;
}
async function cachedApp() {
  const names = await caches.keys();
  const ordered = names.filter(n => /^triumph-pilot-v\d+$/.test(n))
    .sort((a,b) => Number(b.match(/v(\d+)$/)[1]) - Number(a.match(/v(\d+)$/)[1]));
  // Prefer this worker's validated cache. Older versions are a recovery source.
  if (ordered.includes(CACHE_NAME)) ordered.splice(ordered.indexOf(CACHE_NAME), 1);
  ordered.unshift(CACHE_NAME);
  for (const name of ordered) {
    if (!names.includes(name)) continue;
    const cache = await caches.open(name);
    const response = await cache.match(APP_URL) || await cache.match(ROOT_URL);
    if (response?.ok) return {response, name};
  }
  return null;
}
async function storeComplete(response, expectedBuild) {
  if (!response?.ok || !/text\/html/i.test(response.headers.get('content-type') || '')) return null;
  const text = await response.text();
  const build = buildOf(text);
  // Do not replace working content with an error/login page, partial download,
  // or a version.json/index.html mismatch during a rolling CDN deployment.
  if (!build || (expectedBuild && build !== expectedBuild) || !/<\/body>\s*<\/html>\s*$/i.test(text)) return null;
  const headers = new Headers(response.headers);
  headers.delete('content-length');headers.delete('content-encoding');
  headers.set('X-Triumph-Build', build);
  const cache = await caches.open(CACHE_NAME);
  await cache.put(APP_URL, new Response(text, {status:200,headers}));
  // Keep one last known-good older release for recovery. Never touch app data,
  // localStorage, or caches belonging to another application.
  const old = (await caches.keys()).filter(n => /^triumph-pilot-v\d+$/.test(n) && n !== CACHE_NAME)
    .sort((a,b) => Number(b.match(/v(\d+)$/)[1]) - Number(a.match(/v(\d+)$/)[1]));
  await Promise.all(old.slice(1).map(n => caches.delete(n)));
  return build;
}
async function timedFetch(url, cache = 'no-cache') {
  const controller = new AbortController();
  // Updates are non-blocking; allow a large HTML download on a slow connection.
  const timer = setTimeout(() => controller.abort(), 90000);
  try {
    const response = await fetch(url, {cache,signal:controller.signal});
    // Consume the body within the timeout, including a stalled download.
    const body = await response.arrayBuffer();
    return new Response(body,{status:response.status,statusText:response.statusText,headers:response.headers});
  } finally {clearTimeout(timer);}
}
function refreshCachedApp(primeURL, primeBuild) {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const cached = await cachedApp();
    if (!cached && primeURL) {
      // On first installation reuse the browser's just-downloaded document if
      // available, rather than immediately downloading it a second time.
      const primed = await storeComplete(await timedFetch(primeURL, 'force-cache'), primeBuild);
      if (primed) return;
    }
    const versionResponse = await timedFetch(VERSION_URL);
    if (!versionResponse.ok) return;
    const manifest = await versionResponse.json();
    if (!/^v\d+$/.test(manifest.version)) return;
    let cachedBuild = cached?.response.headers.get('X-Triumph-Build');
    if (!cachedBuild && cached) cachedBuild = buildOf(await cached.response.clone().text());
    if (cachedBuild === manifest.version) return;
    // Ignore an older CDN manifest: never downgrade a working newer document.
    if (cachedBuild && Number(manifest.version.slice(1)) < Number(cachedBuild.slice(1))) return;
    const build = await storeComplete(await timedFetch(APP_URL), manifest.version);
    if (build) for (const client of await self.clients.matchAll({type:'window'})) {
      client.postMessage({type:'TRIUMPH_UPDATE_READY',version:build});
    }
  })().catch(() => { /* A failed update must not interrupt the cached trainer. */ })
    .finally(() => {refreshPromise = null;});
  return refreshPromise;
}
self.addEventListener('install', event => {event.waitUntil(self.skipWaiting());});
self.addEventListener('activate', event => {event.waitUntil(self.clients.claim());});
self.addEventListener('message', event => {
  if (event.data?.type !== 'TRIUMPH_PRIME' || !event.source?.url) return;
  const url = new URL(event.source.url);
  if (isAppURL(url) && /^v\d+$/.test(event.data.version)) event.waitUntil(refreshCachedApp(url.href,event.data.version));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.mode !== 'navigate' || !isAppURL(new URL(request.url))) return;
  const cachedPromise = cachedApp();
  let coldSave = Promise.resolve();
  const responsePromise = (async () => {
    const cached = await cachedPromise;
    if (cached) return cached.response;
    // With no cache, stream the network response immediately. Cache writing
    // happens separately and does not hold up delivery of the HTML to the page.
    try {
      const response = await fetch(request);
      coldSave = storeComplete(response.clone()).catch(() => null);
      return response;
    } catch (_) {
      return new Response('<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><title>TRIUMPH 尚未快取</title><body><h1>目前無法連線</h1><p>這台裝置尚無可用的離線版本。請連上網路後重新整理；不需要清除收藏或練習紀錄。</p></body></html>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
    }
  })();
  event.respondWith(responsePromise);
  event.waitUntil((async () => {
    const cached = await cachedPromise;
    await responsePromise;
    if (cached) await refreshCachedApp();else await coldSave;
  })());
});
