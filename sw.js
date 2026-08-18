// Bump to discard every previously cached response
const CACHE_NAME = 'na-tuner-v6';

// Installation - activate the new SW immediately
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

// Clean up old caches and take control of all clients
self.addEventListener('activate', (e) => {
  e.waitUntil(
    Promise.all([
      // Clean up old versions
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) return caches.delete(key);
          })
        );
      }),
      // SW takes control of all tabs immediately
      self.clients.claim()
    ])
  );
});

// Network-first, falls back to cache when offline
self.addEventListener('fetch', (e) => {
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request, { cache: 'no-store' })
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
