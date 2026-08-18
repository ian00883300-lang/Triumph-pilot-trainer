const CACHE="triumph-v176-fast-shell";
const CORE=["./","./index.html","./triumph-pilot.webmanifest","./triumph-icon-192.png","./triumph-icon-512.png","./triumph-apple-touch-icon.png"];
self.addEventListener("install",event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await Promise.allSettled(CORE.map(url=>fetch(new Request(url,{cache:"no-store"})).then(r=>{if(r&&r.ok)return cache.put(url,r.clone());})));
  await self.skipWaiting();
})()));
self.addEventListener("activate",event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
})()));
async function nav(request,event){
  const cache=await caches.open(CACHE);
  const cached=await cache.match("./index.html")||await cache.match("./")||await cache.match(request,{ignoreSearch:true});
  const network=fetch(new Request(request,{cache:"no-store"})).then(async r=>{
    if(r&&r.ok){await cache.put("./index.html",r.clone());await cache.put("./",r.clone());}
    return r;
  }).catch(()=>null);
  event.waitUntil(network);
  return cached||await network||new Response("Offline",{status:503});
}
self.addEventListener("fetch",event=>{
  const r=event.request;if(r.method!=="GET")return;
  const u=new URL(r.url);
  if(r.mode==="navigate"){event.respondWith(nav(r,event));return;}
  if(u.pathname.endsWith("/version.json")){
    event.respondWith(fetch(new Request(r,{cache:"no-store"})).catch(()=>caches.match(r,{ignoreSearch:true})));return;
  }
  if(u.origin===self.location.origin){
    event.respondWith((async()=>{
      const c=await caches.match(r,{ignoreSearch:true});if(c)return c;
      const x=await fetch(r);if(x&&x.ok){const cache=await caches.open(CACHE);cache.put(r,x.clone());}
      return x;
    })());
  }
});