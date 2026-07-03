const CACHE = 'clnch-v1';
const PRECACHE = ['/', '/manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Only handle GET requests for same-origin resources
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  // Network-first for API/auth calls, cache-first for assets
  const url = new URL(e.request.url);
  if (url.pathname.startsWith('/rest/') || url.pathname.startsWith('/auth/')) {
    return; // Let network handle Supabase calls
  }
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fresh = fetch(e.request).then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
        return res;
      });
      return cached || fresh;
    })
  );
});
