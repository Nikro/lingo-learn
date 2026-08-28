# ADR 0006 — Locale Switcher Shows Active Pairs Only

## Status
Accepted

## Context
`data/registry.json` lists 6 locale pairs, but only `en-es` has `active: true` and
only `en-es` has content under `data/`. The sidebar locale switcher rendered all 6,
so clicking Romanian→Spanish, French→Spanish, or Italian→Spanish led to an
empty/broken experience (no stage data, no themes).

Content for the other pairs is a separate, large project — deliberately out of scope
for reaching 100% on the current product. The product decision: until a pair ships
content, it must not be offered in the UI.

## Decision
- The sidebar switcher renders **only registry locales with `active === true`**
  (`activeLocales` computed in `js/app.js`). Inactive pairs stay in `registry.json`
  (the registry documents the roadmap and keeps the architecture locale-agnostic)
  but are invisible in the UI.
- **Stale-state fallback:** on init, the stored locale (`lingolearn_current_locale`
  in localStorage) is validated against the active set via `resolveActiveLocale()`.
  A stale non-active value (e.g. `fr-es` from an older build) falls back to `en-es`
  (or the first active locale if `en-es` is ever deactivated) and the resolved value
  is persisted so progress keys stay consistent.
- **Stale deep links:** `parseRoute()` redirects hashes that name an inactive locale
  (`#/fr-es/A1/a1-1`) to the equivalent `en-es` route, preserving the remaining
  path segments. The redirect only fires when the registry loaded with at least one
  active locale, so a failed registry fetch cannot loop.

## Consequences
- The switcher shows exactly one entry today (English → Spanish); when a pair ships
  content, flipping its `active` flag in `registry.json` exposes it with no code
  change.
- Users with old localStorage or old bookmarks can no longer land in a dead locale.
- `switchLocale()` and all locale-scoped storage are untouched — en-es behavior is
  byte-for-byte identical.
