// 4x4 Camp: prima prova la rete (così prendi sempre l'ultima versione), senza rete usa la copia salvata
const C='camp-v3';
self.addEventListener('install',e=>{ self.skipWaiting(); e.waitUntil(caches.open(C).then(c=>c.addAll(['./','icon-192.png','icon-512.png','manifest.webmanifest']).catch(()=>{}))); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{ const r=e.request; if(r.method!=='GET') return; const u=new URL(r.url);
  const same=u.origin===location.origin, cdn=/cdn\.jsdelivr\.net|fonts\.(googleapis|gstatic)/.test(u.host); if(!same&&!cdn) return; if(u.pathname.includes('/classifica')) return;
  const fresh=same&&(r.mode==='navigate'||/\.(html|webmanifest|js)$|\/$/.test(u.pathname)); e.respondWith(fetch(fresh?new Request(r,{cache:'no-cache'}):r).then(res=>{ if(res.ok){ const cp=res.clone(); caches.open(C).then(c=>c.put(r,cp)); } return res; }).catch(()=>caches.match(r).then(m=>m||caches.match('./')))); });
