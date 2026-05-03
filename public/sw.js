const VERSION = 'liora-v1';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for API + HMR; fall back to cache only for navigations.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/@') || url.pathname.startsWith('/__')) {
    return;
  }

  // Navigations: network-first with offline shell fallback.
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(() => caches.match('/index.html').then((r) => r || new Response('Offline', { status: 503 })))
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request).then((res) => {
        if (res && res.ok) cache.put(request, res.clone()).catch(() => {});
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

// Web Push scaffold (real backend deferred — needs VAPID keys).
self.addEventListener('push', (e) => {
  if (!e.data) return;
  let payload = {};
  try { payload = e.data.json(); } catch { payload = { title: 'Liora', body: e.data.text() }; }
  e.waitUntil(self.registration.showNotification(payload.title || 'Liora', {
    body: payload.body || '',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: payload.url || '/',
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data || '/';
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then((wins) => {
    const w = wins.find((w) => w.url.includes(self.location.origin));
    if (w) { w.focus(); w.navigate?.(url); } else self.clients.openWindow(url);
  }));
});
