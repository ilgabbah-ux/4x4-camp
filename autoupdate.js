// 4x4 Camp: aggiornamento automatico (incluso in index.html da build.sh / pubblica3d.sh)
/* Aggiornamento automatico: a ogni apertura e a ogni ritorno nell'app controlla se c'è una versione nuova;
   se c'è, ricarica il gioco appena sei nel menu iniziale (mai mentre guidi o sei al campo). */
(function(){ if(!('serviceWorker' in navigator)||!/github\.io$/.test(location.hostname)) return;
  let hadCtrl=!!navigator.serviceWorker.controller, pending=false, reg=null, last=0;
  const safe=()=>{ const o=document.getElementById('over'); if(!o||o.hidden) return false; const cs=getComputedStyle(o); return cs.display!=='none'&&cs.visibility!=='hidden'&&+cs.opacity>0.5; };
  const tryReload=()=>{ if(!pending) return; if(document.visibilityState==='visible'&&!safe()){ setTimeout(tryReload,1500); return; }
    if(document.visibilityState==='visible'){ const t=document.createElement('div'); t.textContent='Aggiornamento…'; t.style.cssText='position:fixed;left:50%;top:45%;transform:translate(-50%,-50%);z-index:99999;background:#121914e6;color:#fff;font:700 22px system-ui;padding:14px 22px;border-radius:14px'; document.body.appendChild(t); }
    setTimeout(()=>location.reload(),500); };
  navigator.serviceWorker.addEventListener('controllerchange',()=>{ if(hadCtrl){ pending=true; tryReload(); } hadCtrl=true; });
  let tag=null; const head=()=>fetch('./',{method:'HEAD',cache:'no-store'}).then(r=>r.headers.get('etag')||r.headers.get('last-modified')).catch(()=>null);
  head().then(t=>{ tag=t; });
  const check=()=>{ const n=Date.now(); if(n-last<30000) return; last=n; if(reg) reg.update().catch(()=>{});
    head().then(t=>{ if(t&&tag&&t!==tag){ pending=true; tryReload(); } }); };
  navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(r=>{ reg=r; check(); }).catch(()=>{});
  document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') check(); });
})();
