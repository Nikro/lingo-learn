// LingoLearn Service Worker
//
// CACHE_VERSION: bump on every deploy. Each distinct value creates a new cache
// name and triggers old-cache cleanup on activation (see activate handler).
// For a zero-build static deploy the version is bumped manually in this file.
const CACHE_VERSION = '14';
const CACHE_NAME = `lingolearn-${CACHE_VERSION}`;

// ─── App shell ───
// Files needed to boot the app offline. All RELATIVE so they resolve against
// the SW's own base URL — which is the deploy root, whether that is "/" or a
// GitHub Pages subpath like "/lingo-learn/". Never use absolute "/" paths here;
// they 404 under a subpath and would break install.
//
// The shell is PRE-CACHED at install time (see install handler). That is what
// guarantees the first offline reload works: a lazy "cache on first fetch"
// approach fails, because the initial page load happens before the SW controls
// the page, so the cache would still be empty on the first offline reload.
//
// data/registry.json is included (small, first data fetch) so the offline app
// can render the locale list. The ~139 stage/theme JSON files are NOT
// pre-cached; they are cached on first load by the fetch handler and
// invalidated wholesale by the CACHE_VERSION bump.
const SHELL = [
  'index.html',
  'js/app.js',
  'js/storage.js',
  'manifest.json',
  'favicon.ico',
  'icon-192.png',
  'icon-512.png',
  'maskable-512.png',
  'data/registry.json',
];

// CDN origins the app loads. Their responses carry
// Access-Control-Allow-Origin: * so they can be cached for offline use.
const CDN_HOSTS = new Set([
  'cdn.jsdelivr.net',
  'cdn.tailwindcss.com',
]);

// Resolve a relative path against the SW base and strip any query string.
// Stripping the query is what makes version-busted URLs (js/app.js?v=56) match
// the unversioned cache key (js/app.js), so cache-busting deploys keep working
// offline instead of missing.
function normKey(relOrUrl) {
  const u = new URL(relOrUrl, self.location.href);
  u.search = '';
  return u.toString();
}

const INDEX_KEY = normKey('index.html');

function cachePut(key, response) {
  return caches.open(CACHE_NAME).then((cache) => cache.put(key, response));
}

// Install — pre-cache the app shell. Per-URL resilience: one missing file
// logs a warning instead of failing the whole install (a hard addAll failure
// would leave the user with NO service worker at all).
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      await Promise.all(
        SHELL.map(async (rel) => {
          const key = new Request(normKey(rel));
          try {
            const res = await fetch(key, { cache: 'no-cache' });
            if (res && res.ok) {
              await cachePut(key, res);
            } else {
              console.warn('[SW] install: skipping', rel, res ? res.status : 'no response');
            }
          } catch (err) {
            console.warn('[SW] install: could not cache', rel, err.message);
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

// Activate — delete every old lingolearn-* cache, then claim open clients so
// the page is controlled immediately (app.js reloads on controllerchange).
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name.startsWith('lingolearn-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — strategy by resource type (same-origin keys normalized, i.e. query
// stripped, so version-busted URLs match the cached copies):
//   HTML / navigation → stale-while-revalidate: cached copy instantly, refresh
//                       in background; navigations fall back to the cached
//                       index.html (hash routing keeps all content in the shell).
//   JS / data JSON    → network-first: always try fresh, cache on success,
//                       fall back to cache when offline.
//   Same-origin other → cache-first, then network (icons, future assets).
//   Cross-origin CDN  → network-first, cache on success (opaque responses
//                       included), fall back to cache when offline.
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isShell = SHELL.some((rel) => normKey(rel) === normKey(request.url));
  const isNavigation = request.mode === 'navigate';
  const isData = url.pathname.startsWith('data/') && url.pathname.endsWith('.json');
  const isJs = url.pathname.endsWith('.js');
  const isSameOrigin = url.origin === self.location.origin;

  if (isShell || isNavigation) {
    // Stale-while-revalidate for the HTML shell.
    event.respondWith(
      caches.match(normKey(request.url))
        .then((cached) => cached || (isNavigation ? caches.match(INDEX_KEY) : undefined))
        .then((cached) => {
          const network = fetch(request)
            .then((response) => {
              if (response && response.status === 200 && response.type === 'basic') {
                cachePut(new Request(normKey(request.url)), response.clone());
              }
              return response;
            })
            .catch(() =>
              isNavigation
                ? new Response('offline', { status: 503, statusText: 'Offline' })
                : null
            );
          return cached || network;
        })
    );
  } else if (isData || isJs) {
    // Network-first for JS and data JSON, with normalized cache keys.
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            cachePut(new Request(normKey(request.url)), response.clone());
          }
          return response;
        })
        .catch(() => caches.match(normKey(request.url)))
    );
  } else if (isSameOrigin) {
    // Cache-first for other same-origin assets (icons, etc.).
    event.respondWith(
      caches.match(normKey(request.url)).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            cachePut(new Request(normKey(request.url)), response.clone());
          }
          return response;
        });
      })
    );
  } else if (CDN_HOSTS.has(url.hostname)) {
    // Network-first for known CDNs; cache opaque responses too so the shell
    // still loads offline (browser serves the cached opaque body).
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && (response.status === 200 || response.type === 'opaque')) {
            cachePut(request, response.clone());
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
  // Anything else: let the browser handle it (no interception).
});

// Handle messages from the app (update flow: app.js posts SKIP_WAITING to a
// waiting worker; it then activates and clients.claim() triggers the
// controllerchange reload).
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
