// LingoLearn Service Worker
// CACHE_VERSION: bump this string whenever static files change to invalidate stale caches.
// Every distinct value creates a new cache name and triggers old-cache cleanup on activation.
const CACHE_VERSION = '7';
const CACHE_NAME = `lingolearn-${CACHE_VERSION}`;

// Core app shell — files needed to load the app offline.
// Update this list whenever you add or remove top-level static files.
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/js/app.js',
  '/js/storage.js',
];

// Data files — cached aggressively, invalidated via CACHE_VERSION bump.
// Includes locale data for all stages.
const DATA_ASSETS = [
  '/data/registry.json',
  '/data/schema.json',
  '/data/validate.js',
  '/data/en-es/a1-1.json',
  '/data/en-es/a1-2.json',
  '/data/en-es/a2-1.json',
  '/data/en-es/a2-2.json',
  '/data/en-es/b1-1.json',
  '/data/en-es/b1-2.json',
  '/data/en-es/b2-1.json',
  '/data/en-es/b2-2.json',
  '/data/en-es/b2-3.json',
];

// Install — cache the app shell immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// Activate — clean all old caches from previous versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('lingolearn-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch — strategy by resource type:
//   HTML    → cache-first (offline availability), then network to refresh
//   JS      → network-first (always get latest), cache for offline fallback
//   Data    → network-first (data updates), cache for offline fallback
//   Other   → cache-first (CDN resources, images)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isHTML = event.request.headers.get('accept')?.includes('text/html');
  const isJS = url.pathname.endsWith('.js');
  const isData = url.pathname.startsWith('/data/') && url.pathname.endsWith('.json');

  if (isHTML) {
    // Cache-first for HTML: serve stale cache immediately, refresh in background
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        }).catch(() => cached); // network failure → fall back to cache

        // Return cached if available, otherwise wait for network
        return cached || fetchPromise;
      })
    );
  } else if (isJS || isData) {
    // Network-first for JS and data: always try fresh, cache for offline fallback
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache-first for everything else (CDN CSS, images, etc.)
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        }).catch(() => {
          // Offline fallback for HTML
          if (isHTML) return caches.match('/index.html');
        });
      })
    );
  }
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
