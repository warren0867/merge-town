const CACHE = 'merge-restaurant-v3';
const FILES = ['./', './index.html', './manifest.json', './icon.svg',
  'assets/t1.png','assets/t2.png','assets/t3.png','assets/t4.png','assets/t5.png',
  'assets/b1.png','assets/b2.png','assets/b3.png','assets/b4.png','assets/b5.png',
  'assets/m1.png','assets/m2.png','assets/m3.png','assets/m4.png','assets/m5.png',
  'assets/gen_t.png','assets/gen_b.png','assets/gen_m.png',
  'assets/ui_coin.png','assets/ui_gem.png','assets/ui_energy.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;

  // Network-first for the page itself so game updates always reach players
  if (req.mode === 'navigate' || new URL(req.url).pathname.endsWith('.html')) {
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Cache-first for everything else, but cache on first fetch so cross-origin
  // assets (e.g. the Tailwind CDN script) are available offline.
  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        // status 200 (same-origin/CORS) or 0 (opaque cross-origin) are both cacheable
        if (res && (res.status === 200 || res.status === 0)) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return res;
      });
    })
  );
});
