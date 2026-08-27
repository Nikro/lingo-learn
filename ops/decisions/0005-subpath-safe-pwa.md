# ADR 0005 — Subpath-Safe PWA: Pre-Cached Shell, Normalized Cache Keys, Real Offline Support

## Status
Accepted (supersedes the implementation details of ADR 0003; its versioning and cleanup model are retained)

## Context
ADR 0003 defined the versioning strategy, but the deployed service worker had four defects that
broke the app on its real target (GitHub Pages subpath) and offline:

1. **Absolute paths.** `sw.js` cached and matched absolute URLs (`/sw.js`, `/index.html`,
   `/js/app.js`). GitHub Pages serves the repo under `/lingo-learn/`, so every absolute path
   404'd and the service worker could never install.
2. **Empty cache on first offline reload.** The fetch handler used lazy
   "cache on first use", but the very first page load happens *before* the service worker
   controls the page — so nothing was ever cached before the first offline attempt. The cache
   was empty and the app was blank offline.
3. **Version-busted URLs never matched.** `index.html` loads `js/app.js?v=56`, but the cache
   key was the unversioned `js/app.js`. Query strings differ, so the cached entry never matched
   the request and version bumping silently broke offline JS.
4. **CDN assets were never cached.** The fetch handler only cached responses with
   `response.type === 'basic'`. Cross-origin CDN responses are `type: 'opaque'`, so DaisyUI,
   Tailwind, and AlpineJS were never stored and the shell could not render offline.
   Additionally, `manifest.json` used an absolute `start_url` of `/`, which fails
   installability audits on a subpath.

## Decision
- **Relative paths everywhere.** The shell list and all cache keys are relative
  (`index.html`, `js/app.js`, …) and resolved against the service worker's own base URL, so the
  same `sw.js` works at `/` or at any subpath like `/lingo-learn/`.
- **Pre-cache the shell at install time.** `index.html`, both JS files, `manifest.json`,
  favicon, all icons, and `data/registry.json` are fetched (with per-URL resilience — one
  missing file warns instead of failing the whole install) and stored during `install`. This
  guarantees the *first* offline reload works.
- **Normalized cache keys.** A `normKey()` helper resolves a URL against the SW base and strips
  the query string, so `js/app.js?v=56` matches the cached `js/app.js`. Cache-busting deploys
  keep working offline.
- **Fetch strategies:**
  - HTML / navigations → stale-while-revalidate: cached copy served instantly, background
    refresh. Unknown navigations (bare directory URLs, deep links) fall back to the cached
    `index.html` — hash routing keeps all content in the shell, so the SPA boots and
    re-navigates to the right view.
  - Same-origin JS and `data/*.json` → network-first, cache on success, fall back to cache
    offline. The ~139 stage/theme JSONs are cached on first load, not pre-cached.
  - Other same-origin assets (icons) → cache-first.
  - Known CDN hosts (`cdn.jsdelivr.net`, `cdn.tailwindcss.com`) → network-first, caching
    **opaque** responses too (all three CDNs send `Access-Control-Allow-Origin: *`), with
    offline fallback to the cached copy.
- **`manifest.json` for subpath installability.** `start_url: "./"`, `scope: "./"`, relative
  icon paths, `display: standalone`. The manifest is served from the same directory as the
  app, so relative URLs resolve correctly at any subpath.
- **Service worker registration enabled** in `index.html`, with a subpath-aware path
  (`./sw.js` via `new URL('sw.js', location.href)`), so it registers on GitHub Pages.
- **Cache hygiene.** `no-store`/`no-cache` meta tags removed from `index.html` (they
  conflicted with the SWR strategy). `hardReload()` in `app.js` now unregisters the service
  worker and clears all caches before reloading, giving a true clean-state reset.
- Icons `icon-192.png`, `icon-512.png`, and `maskable-512.png` are committed to the repo root
  (referenced relatively by the manifest).

## Consequences
- The app installs and works offline at any GitHub Pages subpath, not just `/`.
- First offline reload works without any prior online visit after install (pre-caching).
- Version bumps (`?v=` / `CACHE_VERSION`) no longer break offline mode.
- Offline the app boots to the last route via hash routing; any data JSON already visited is
  available, unvisited ones require network.
- Verification: CDP-driven headless-Chromium test suite (`/tmp/cdp_test.py`) covering SW
  registration, scope, cache population (shell + CDN + data), offline reload of a full theme
  page, and offline bare-directory SPA fallback — run for both the root and a
  subpath-served copy of the repo. All 13 hard checks pass.
