const SW_VERSION="triumph-v172-stable-network-first";
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
self.addEventListener("fetch",e=>{
  const r=e.request;
  if(r.method!=="GET") return;
  const u=new URL(r.url);
  const navigation=r.mode==="navigate";
  const core=u.pathname.endsWith("/index.html") ||
             u.pathname.endsWith("/version.json") ||
             u.pathname.endsWith("/triumph-pilot.webmanifest");
  if(navigation || core){
    e.respondWith(fetch(new Request(r,{cache:"no-store"})).catch(()=>fetch(r)));
    return;
  }
  e.respondWith(fetch(r).catch(()=>caches.match(r)));
});