const C='bg-v2',A=['index.html','assets/theme.css','assets/app.js','assets/config.js'];

self.addEventListener('install',e=>e.waitUntil(
  caches.open(C).then(c=>c.addAll(A)).then(()=>self.skipWaiting())
));

self.addEventListener('activate',e=>e.waitUntil(
  caches.keys()
    .then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
));

self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin||u.pathname.startsWith('/api'))return;
  e.respondWith(
    fetch(e.request)
      .then(r=>{const k=r.clone();caches.open(C).then(c=>c.put(e.request,k));return r})
      .catch(()=>caches.match(e.request))
  );
});
