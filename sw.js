// Bump to discard every previously cached response
const CACHE_NAME = 'na-tuner-v16';

// Everything the app needs to open with no network at all
const SHELL = [
  './',
  './index.html',
  './tuner.html',
  './ratios.html',
  './about.html',
  './licences.html',
  './style.css',
  './ozadje.jpg',
  './tuner.js',
  './ratios.js',
  './tuner-wasm.js',
  './tuner-core.wasm',
  './tunings.js',
  './manifest.json',
  './favicon.ico',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

// Fill the cache up front, bypassing the HTTP cache so a deploy is picked up
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(SHELL.map((url) => new Request(url, { cache: 'reload' })))
    )
  );
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
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  // tuner.html reads ?t=<slug> at runtime, so all twelve share one cache entry
  const key = url.origin + url.pathname;

  e.respondWith(
    fetch(e.request, { cache: 'no-store' })
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(key, responseToCache);
          });
        }
        return response;
      })
      .catch(() =>
        caches.match(key).then((hit) => {
          if (hit) return hit;
          // A URL we never shipped: give navigations the picker rather than an error page
          if (e.request.mode === 'navigate') return caches.match('./index.html');
        })
      )
  );
});
