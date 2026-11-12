const VERSION='roteiro-vitoria-v1';
const SHELL=[
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==VERSION).map(key=>caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);

  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>{
      const copy=response.clone();
      caches.open(VERSION).then(cache=>cache.put('./index.html',copy));
      return response;
    }).catch(()=>caches.match('./index.html')));
    return;
  }

  const local=url.origin===self.location.origin;
  const wikimedia=url.hostname.endsWith('wikimedia.org');
  if(!local&&!wikimedia)return;

  event.respondWith(caches.match(request).then(cached=>{
    const update=fetch(request).then(response=>{
      if(response.ok||response.type==='opaque')caches.open(VERSION).then(cache=>cache.put(request,response.clone()));
      return response;
    }).catch(()=>cached);
    return cached||update;
  }));
});
