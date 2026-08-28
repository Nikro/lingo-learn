# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Added
- Added `HINTS.md` as a compact future-agent guide for Alpine.js, DaisyUI, routing, data architecture, deployment, security scans, and context-window management.
- Added `ops/` decision-log structure for durable architecture and workflow decisions.
- Added ignored `workspace/` scratch-space guidance for AI/human temporary work.
- **Comprehensive theme consolidation** — Merged 5→10 canonical themes across all 9 CEFR stages (~118 total themes, ~650 vocabulary entries). Redundant themes eliminated.
- **Stage manifest architecture** — Root stage files (`a1-1.json` … `b2-3.json`) serve as metadata manifests (`stage_manifest` type), separate from theme content. `stage_manifest` type added to `data/schema.json`.
- **CI/CD pipeline** — GitHub Actions workflow (`deploy.yml`) with content validation, concurrency controls, and automatic deploy.
- **ADR 0003** — PWA caching strategy with version bumping and old-cache cleanup.
- **ADR 0005** — Subpath-safe PWA: pre-cached shell at install, query-stripped (normalized) cache keys, opaque CDN caching, SPA navigation fallback, relative manifest.
- **PWA icons** — `icon-192.png`, `icon-512.png`, `maskable-512.png` committed to repo root for manifest installability.
- **PWA meta tags** — `theme-color`, `mobile-web-app-capable`, and `apple-mobile-web-app-*` tags in `index.html`.

### Changed
- **Locale switcher shows active pairs only** — `data/registry.json` lists 6 locale pairs but only `en-es` has content, and the switcher offered all 6, so selecting an unshipped pair (ro-es, fr-es, it-es, …) dead-ended in an empty view. The switcher now renders only `active === true` locales (`activeLocales` computed in `js/app.js`); inactive pairs stay in the registry as roadmap but are invisible in the UI (see ADR 0006). A stale stored locale in localStorage, or a deep link to an inactive locale, now resolves/redirects to `en-es` gracefully (stale deep links preserve the rest of the path). `app.js` `?v=57`; `CACHE_VERSION` 14 → 15.
- **Data validator (all 139 themes)** — `data/validate.js` rewritten from a 10-file hardcoded list to a full scan of every locale: all `data/<locale>/<stage>/themes/*.json` content themes, the in-theme-dir stage manifests, and root stage manifests. Checks: JSON parse, `vocabulary` ≥ 50 (array or dict-of-categories, flattened the way `app.js` does), `grammar`/`exercises`/`pronunciation` present and non-empty, manifest↔file cross-check (no dangling ids, no orphan files), and a secret scanner (secret-named JSON keys + credential-token-shaped values — deliberately not a naive "password" grep, since that is legitimate Spanish vocabulary; see HINTS.md §10). Exit 0/1 with per-file report; the deploy workflow already runs it pre-deploy, so a bad theme now blocks the deploy.
- **Service worker rewrite (subpath-safe)** — All cache keys and the shell list are now relative so `sw.js` works at any GitHub Pages subpath (previously absolute paths 404'd under `/lingo-learn/`). Shell is pre-cached at install time so the first offline reload works; `normKey()` strips `?v=` query strings so version-busted URLs match cached entries; CDN responses (type `opaque`) are now cached; navigations fall back to cached `index.html` for offline deep links. `CACHE_VERSION` bumped to `14`.
- **Service worker registration enabled** in `index.html` with a subpath-aware path.
- **`manifest.json`** — `start_url: "./"` and `scope: "./"` (relative) so installability holds on a subpath; `id: "lingolearn"`; relative icon paths.
- **`app.js` `hardReload()`** — now unregisters the service worker and clears all caches before reloading.
- **Cache busting** — `app.js` version bumped to `v=53` in `index.html`; service worker `CACHE_VERSION` bumped `10` → `11` for the grammar-pillar fix deploy.
- **Service worker** — Rewrite: strategic cache separation, network-first for JS/data, cache-first for HTML, activation-time cache cleanup. Cache version bumped to `v7`.
- **Cache busting** — `app.js` version bumped to `v=48` in `index.html`.
- **Data validator** — Updated to skip root stage manifest files (no exercises/grammar/pronunciation expected).
- **Schema** — Added `stage_manifest` type, `aid_note` field for grammar exercises. Fixed double-escaped regex for stage identifiers.

### Fixed
- **a2-1 pronunciation shape** — `environment-nature` and `science-technology` stored `pronunciation` as a single object, but `renderThemePronunciation()` consumes an array (`.forEach`). The tab silently fell into the "No pronunciation content yet" empty state. Both now store a 1-item array (content unchanged).
- **b2-1 root manifest** — `advanced-literary-analysis-part-1` had an empty `title` in `data/en-es/b2-1.json`; synced to "Advanced Literary Analysis Part 1" (matches the in-theme-dir manifest).
- **Offline mode** — The app previously could not work offline at all on GitHub Pages: absolute cache paths 404'd under the `/lingo-learn/` subpath, the lazy cache-on-first-use left the cache empty on the first offline reload, `?v=`-busted URLs never matched cached entries, and CDN responses were never cached. All four defects fixed (see ADR 0005); verified offline in headless Chromium for both root and subpath.
- **Installability** — `manifest.json` absolute `start_url` of `/` replaced with relative `./` so the install prompt criteria hold on a subpath; missing icon assets added.
- **`no-store`/`no-cache` meta tags** removed from `index.html` — they conflicted with the stale-while-revalidate strategy.
- **Grammar pillar crash** — `renderThemeGrammar` referenced `self.escapeHtml(...)` inside `forEach` callbacks without declaring `var self = this;`, throwing `self.escapeHtml is not a function` for any theme with non-empty grammar `examples` (134 of 139 themes crashed on the Grammar tab). Fixed by capturing `self` like `renderThemeExercises` does. Verified in browser across all 9 stages (a1-1 to b2-3): grammar examples render, no console errors.
- Double-escaped regex pattern in `schema.json` (`^[a-z]\\d-\\d+$` corrected).
- Stale cache behavior: old cache versions no longer persist after updates.
- Inconsistent fetch strategy: HTML now correctly cache-first (offline-available).

## Unreleased (Recent)

### Fixed
- **Mobile sidebar** — Auto-closes when navigating to a theme (`loadThemeDirectly()`, `loadTheme()`).
- **Mobile sidebar** — Escape key now dismisses the sidebar overlay.
- **Mobile header z-index** — Raised from z-10 to z-60 so the header always sits above the z-50 sidebar.
- **Viewport transition** — Sidebar state resets when moving from mobile to desktop (prevents pre-opened sidebar on re-entry).
- **Sidebar animation** — Slide-in duration increased from 200ms to 300ms for smoother feel.
- **Quiz engine** — Restricted theme-detail quiz to theme-level exercises only; respects pillar selection; added exit button.

### Changed
- **Service worker** — Cache version bumped from `v7` to `v8`.
- **Cache busting** — `app.js` version bumped to `v=48`.

## [v1.0.0] — 2026-08-01

### Added
- **Complete app shell** — Single-page app with Alpine.js reactive state
- **Sidebar navigation** — Expandable A1/A2/B1/B2 levels with per-stage progress
- **Four content pillars** — Grammar, Vocabulary, Verbs & Drills, Pronunciation
- **Five exercise types** — Multiple choice, fill-in-blank, conjugation (single & matrix), matching, drag-and-drop
- **Full quiz flow** — Question-by-question navigation, per-answer feedback, pillar breakdown, results summary
- **Progress tracking** — XP system with daily streak multiplier (1× → 1.5× → 2×)
- **localStorage persistence** — Locale-aware keys for progress, XP, streak, settings
- **Hash routing** — Shareable deep-links (`#/en-es/A1/a1-1/grammar`)
- **Settings panel** — Theme toggle (dark/light), language-aid selection, import/export progress, reset
- **Install prompt** — PWA beforeinstallprompt handler with sidebar install button
- **Service worker** — Cache-first HTML, network-first JS, offline fallback
- **UI polish** — Skeleton loading screens, confetti animation, XP counter animation, shake/pop feedback
- **Error states** — Data load failure UI with dashed borders and dismiss button
- **Data validation** — JSON Schema draft-07 + runtime validator for stage content
- **A1.1 content** — Full lesson: Articles, Gender, Plurals, SER/ESTAR, 55 vocabulary words, pronunciation guide, 29 exercises

### Technical
- Zero build step — pure static HTML/CSS/JS served via any HTTP server
- CDN-hosted dependencies: Tailwind CSS, DaisyUI, Alpine.js (no npm required)
- Mobile-first responsive layout with collapsible sidebar
- Locale-aware localStorage with migration path from v0 to v1 keys
- Schema versioning system in storage.js (`SCHEMA_VERSION`)

## [v0.1.0] — 2026-07-xx (planned)

Future roadmap items:
- [ ] Populate A1.2, A1.3, and additional levels (A2, B1, B2)
- [ ] Add more exercise types (flashcards, listening, typing)
- [ ] Implement leaderboards / comparison mode
- [ ] Add Spanish-English bidirectional locale (es-en)
- [ ] Web Audio API pronunciation playback
- [ ] Unit tests for quiz logic
- [ ] CI pipeline for content validation

---

*For contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).*
