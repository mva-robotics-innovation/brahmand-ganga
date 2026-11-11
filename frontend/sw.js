const C='bg-v1',A=['./','index.html','assets/theme.css','assets/app.js','assets/config.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(A)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET')return;
if(u.origin===location.origin&&!u.pathname.startsWith('/api')){e.respondWith(caches.match(e.request).then(m=>{const n=fetch(e.request).then(r=>{const k=r.clone();caches.open(C).then(c=>c.put(e.request,k));return r}).catch(()=>m);return m||n}))}});
