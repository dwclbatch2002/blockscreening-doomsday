// Keeps the gate page working with no internet.
// Network first (so pages are never stale when online), saved copy only when the network is slow or offline.
const C = 'gate-v19';
const FILES = ['gate.html', 'jsqr.js', 'sfx.js', 'modal.js', 'config.js', 'app.css', 'favicon.png', 'bg.webp', 'doomsday-gate2.webp', 'manifest.webmanifest',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => Promise.all(FILES.map(u => c.add(new Request(u, u.startsWith('http') ? { mode: 'no-cors' } : { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const u = new URL(req.url);
  const mine = u.origin === location.origin && FILES.some(f => f === u.pathname.split('/').pop());
  const cdn = u.hostname === 'cdn.jsdelivr.net';
  if (!mine && !cdn) return;     // Supabase calls and everything else go straight to the network
  e.respondWith(caches.open(C).then(async c => {
    const net = new Promise(res => {
      const t = setTimeout(() => res(null), 3000);          // slow signal: fall back to the saved copy after 3 seconds
      fetch(req, mine ? { cache: 'no-cache' } : undefined).then(r => {
        clearTimeout(t);
        if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone());
        res(r);
      }).catch(() => { clearTimeout(t); res(null); });
    });
    const r = await net;
    if (r) return r;
    return (await c.match(req, { ignoreSearch: true })) || new Response('Offline', { status: 503 });
  }));
});
