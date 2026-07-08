HEAD
// ─── SERVICE WORKER — Eatshimo ────────────────────────────
const CACHE_NAME = 'eatshimo-v3.2';

// Files to pre-cache on install (all core app assets)
const PRECACHE_URLS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './favicon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  // Chart.js from CDN — cached on first fetch
];

// ─── INSTALL: pre-cache core files ───────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())  // activate immediately
  );
});

// ─── ACTIVATE: clean up old caches ───────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── FETCH: network-first, fallback to cache ─────────────
self.addEventListener('fetch', event => {
  // Skip non-GET and chrome-extension requests
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request).then(response => {
      // Only cache valid responses (not errors, not opaque cross-origin)
      if (!response || response.status !== 200) return response;

      // Update the cache with the fresh response
      const responseClone = response.clone();
      caches.open(CACHE_NAME).then(cache => {
        cache.put(event.request, responseClone);
      });
      return response;
    }).catch(() => {
      // Offline — fall back to cache
      return caches.match(event.request).then(cached => {
        if (cached) return cached;
        // Last resort: return app shell for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      });
    })
  );
});