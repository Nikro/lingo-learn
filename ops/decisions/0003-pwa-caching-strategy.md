# ADR 0003 — PWA Caching Strategy

## Status
Accepted

## Context
The original service worker (`sw.js`) used a hardcoded cache name (`lingolearn-v6`) with a static asset list of only 9 files. This caused stale-cache behavior: when the app was updated, old cached versions would persist indefinitely. The fetch strategy was also inconsistent (comment said "network first for HTML" but code did cache-first for HTML).

## Decision
- **Cache versioning**: Use `CACHE_VERSION = '8'` — bump this string on every deployment to create a new cache name and trigger old-cache cleanup. For static GitHub Pages without a build step, the version is bumped manually or via CI script.
- **Strategic separation**: App shell (HTML, JS) cached on install; data files cached via fetch.
- **Theme data caching**: Theme-specific data files are fetched and cached on first load by the app, so they don't need to be in the static DATA_ASSETS list. This avoids the need to maintain a growing hardcoded list.
- **Fetch strategy**: HTML = cache-first (offline availability); JS/Data = network-first (always get updates); Other = cache-first (CDN assets).
- **Cache cleanup**: On activation, all caches with prefix `lingolearn-*` except the current one are deleted.
- **Cache busting**: `index.html` JavaScript references use `?v=48` query strings.
- **Service worker registration**: Currently disabled (commented out) during development to prevent stale caching. To enable for production on GitHub Pages, uncomment the registration block and ensure CACHE_VERSION is updated.

## Consequences
- Users get fresh code on every deploy (network-first for JS/data)
- App still works offline (cache-first for HTML shell)
- Old caches are cleaned up automatically on SW activation
- Cache version must be bumped manually on each deploy (documented in sw.js comments)
