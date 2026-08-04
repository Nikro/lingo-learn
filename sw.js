// LingoLearn Service Worker
const CACHE_NAME = 'lingolearn-v6';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/js/storage.js',
  '/js/app.js',
  '/data/registry.json',
  '/data/schema.json',
  '/data/validate.js',
  '/data/en-es/a1-1.json'
];

// Install — cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch — network first for JS, cache first for HTML
self.addEventListener('fetch', (event) => {
  const isJS = event.request.url.endsWith('.js');
  const isHTML = event.request.headers.get('accept').includes('text/html');

  if (isJS || isHTML) {
    // Network-first for JS and HTML to get updates immediately
    event.respondWith(
      fetch(event.request).then((response) => {
        if (!response || response.status !== 200) return response;
        var responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        return caches.match(event.request);
      })
    );
  } else {
    // Cache-first for HTML and other assets
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          var responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        }).catch(() => {
          // Offline fallback
          if (isHTML) {
            return caches.match('/index.html');
          }
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
