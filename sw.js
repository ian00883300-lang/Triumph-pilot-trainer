/* TRIUMPH Pilot Trainer v193 service worker — 2026-08-22
   Goals:
   1) Faster repeat launches: serve the last usable app shell immediately, then refresh it in the background.
   2) Keep the previous cache as a warm fallback during service-worker upgrades instead of forcing a second 6 MB navigation.
   3) Apply two safe UI hotfixes at runtime: centered Flight Memory full-hint block and neutral timer toggles.

   The main index.html is currently about 6 MB, so network-first + no-store on every launch can make iPhone/iPad startup feel very slow.
*/

const CACHE_NAME = 'triumph-pilot-v193-20260822';
const CACHE_PREFIX = 'triumph-pilot-';
const INDEX_URL = new URL('./index.html', self.location.href).href;
const PATCH_ID = 'triumph-v193-runtime-20260822';

const RUNTIME_PATCH = `
<style id="${PATCH_ID}">
/* Flight Memory — keep the complete-hint list as one centered block on iPad/desktop.
   Individual rows stay left-readable and the numbers remain aligned. */
html body .fm-hidden-command.full-hint-mode{
  text-align:center!important;
  padding-left:18px!important;
  padding-right:18px!important;
}
html body .fm-hidden-command.full-hint-mode .fm-full-hint-title{
  text-align:center!important;
}
html body .fm-hidden-command.full-hint-mode .fm-full-hint-list{
  display:grid!important;
  gap:7px!important;
  width:max-content!important;
  max-width:100%!important;
  margin-left:auto!important;
  margin-right:auto!important;
}
html body .fm-hidden-command.full-hint-mode .fm-full-hint-row{
  display:grid!important;
  grid-template-columns:2.2em auto!important;
  gap:8px!important;
  align-items:start!important;
  line-height:1.4!important;
}
html body .fm-hidden-command.full-hint-mode .fm-full-hint-num{
  text-align:right!important;
  font-variant-numeric:tabular-nums!important;
  font-weight:800!important;
}
html body .fm-hidden-command.full-hint-mode .fm-full-hint-text{
  text-align:left!important;
  min-width:0!important;
  overflow-wrap:normal!important;
  word-break:normal!important;
}

/* Main timer toggle — active state is neutral, not blue.
   Disabled state keeps the same neutral surface and only adds dimming + a red slash. */
html body #timerQuickToggle.timer-quick,
html body #timerQuickToggle.timer-quick.active{
  background:var(--soft)!important;
  color:var(--text)!important;
  border:1px solid var(--line)!important;
  box-shadow:none!important;
  filter:none!important;
}
html body #timerQuickToggle.timer-quick.active{
  opacity:1!important;
}
html body #timerQuickToggle.timer-quick:not(.active){
  opacity:.55!important;
  filter:grayscale(.45)!important;
}
html body #timerQuickToggle.timer-quick:not(.active)::after{
  content:""!important;
  position:absolute!important;
  left:7px!important;
  right:7px!important;
  top:50%!important;
  height:2px!important;
  background:#d75b5b!important;
  transform:rotate(-35deg)!important;
  border-radius:2px!important;
}

/* Daily Test timer uses the same visual language. */
html body #dtTimerToggle.dt-timer-toggle,
html body #dtTimerToggle.dt-timer-toggle.active{
  position:relative!important;
  background:var(--dt-soft,var(--soft))!important;
  color:var(--dt-text,var(--text))!important;
  border:1px solid var(--dt-line,var(--line))!important;
  box-shadow:none!important;
  filter:none!important;
}
html body #dtTimerToggle.dt-timer-toggle.active{
  opacity:1!important;
}
html body #dtTimerToggle.dt-timer-toggle:not(.active){
  opacity:.55!important;
  filter:grayscale(.45)!important;
}
html body #dtTimerToggle.dt-timer-toggle:not(.active)::after{
  content:""!important;
  position:absolute!important;
  left:8px!important;
  right:8px!important;
  top:50%!important;
  height:2px!important;
  background:#d75b5b!important;
  transform:rotate(-35deg)!important;
  border-radius:2px!important;
  pointer-events:none!important;
}

@media(max-width:620px){
  html body .fm-hidden-command.full-hint-mode{
    padding-left:12px!important;
    padding-right:12px!important;
  }
  html body .fm-hidden-command.full-hint-mode .fm-full-hint-row{
    grid-template-columns:2em auto!important;
    gap:7px!important;
  }
}
</style>`;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Do not delete the previous TRIUMPH cache here. Keeping it prevents a blank/slow
    // upgrade launch while the new 6 MB app shell is being refreshed in the background.
    await self.clients.claim();
  })());
});

function isAppNavigation(request) {
  if (request.method !== 'GET') return false;
  const isDocument = request.mode === 'navigate' || request.destination === 'document';
  if (!isDocument) return false;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;

  const scopePath = new URL(self.registration.scope).pathname;
  return url.pathname === scopePath || url.pathname === scopePath + 'index.html';
}

async function applyRuntimePatch(response) {
  if (!response || !response.ok) return response;
  if (response.headers.get('x-triumph-runtime-patch') === PATCH_ID) return response;

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  let html = await response.text();
  if (!html.includes(`id="${PATCH_ID}"`)) {
    if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, `${RUNTIME_PATCH}\n</body>`);
    else html += RUNTIME_PATCH;
  }

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.set('x-triumph-runtime-patch', PATCH_ID);

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

async function findCachedIndex() {
  const currentCache = await caches.open(CACHE_NAME);
  const current = await currentCache.match(INDEX_URL);
  if (current) return current;

  // Warm migration path: reuse the newest usable older TRIUMPH shell immediately.
  const keys = (await caches.keys())
    .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
    .reverse();

  for (const key of keys) {
    const oldCache = await caches.open(key);
    const old = await oldCache.match(INDEX_URL);
    if (!old) continue;

    const patched = await applyRuntimePatch(old);
    await currentCache.put(INDEX_URL, patched.clone());
    return patched;
  }

  return null;
}

async function refreshFromNetwork(request) {
  const response = await fetch(request, { cache: 'no-store' });
  if (!response || !response.ok) return response;

  const patched = await applyRuntimePatch(response);
  const cache = await caches.open(CACHE_NAME);
  await cache.put(INDEX_URL, patched.clone());

  // Only after the new shell is safely cached do we remove older TRIUMPH caches.
  const keys = await caches.keys();
  const staleKeys = keys.filter(
    (key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME
  );
  await Promise.all(staleKeys.map((key) => caches.delete(key)));

  return patched;
}

self.addEventListener('fetch', (event) => {
  if (!isAppNavigation(event.request)) return;

  // Start revalidation immediately, but never make a warm launch wait for it.
  const networkRefresh = refreshFromNetwork(event.request);
  event.waitUntil(networkRefresh.then(() => undefined).catch(() => undefined));

  event.respondWith((async () => {
    const cached = await findCachedIndex();
    if (cached) return applyRuntimePatch(cached);

    // First-ever launch (no cache yet): network is still required once.
    try {
      const network = await networkRefresh;
      if (network) return network;
    } catch (_) {}

    // Final fallback in case refresh failed before producing a response.
    return fetch(event.request, { cache: 'no-store' });
  })());
});
