# ADR 0007 — Single Canonical Stage Manifest (themes/<stage>.json)

## Status
Accepted (2026-08-28)

## Context
Two stage-manifest formats coexisted:

1. **Root manifests** — `data/<locale>/<stage>.json` (introduced by ADR 0002 as
   "manifests only" files at the locale root).
2. **In-theme-dir manifests** — `data/<locale>/<stage>/themes/<stage>.json`, the
   canonical layout the validator, the theme-listing code path, and the ADR 0004
   cross-checks already treated as authoritative.

The root files were strict subsets of the in-theme-dir manifests (verified
2026-08-28: 0 orphaned themes across all 9 stages). The only unique payload they
carried was a `verbs[]` array on `b1-1` and `b2-1`, used by the conjugation-quiz
fallback in `js/app.js` (the quiz reads `stageData.verbs` when a theme has no
per-theme verbs). Keeping both meant every new stage had to be registered in two
places, and `loadStageData` needed a two-step fetch with fallback just to tolerate
the duplication.

## Decision
- The **sole** stage manifest is `data/<locale>/<stage>/themes/<stage>.json`.
- All 9 root-level stage files were deleted (`data/en-es/{a1-1,a1-2,a2-1,a2-2,
  b1-1,b1-2,b2-1,b2-2,b2-3}.json`).
- The `verbs[]` arrays from the deleted `b1-1` and `b2-1` root files were migrated
  **byte-identical** into the canonical `themes/b1-1.json` / `themes/b2-1.json`
  manifests, so the conjugation-quiz fallback keeps working.
- `js/app.js` → `loadStageData` now fetches the canonical path directly
  (`data/<locale>/<stage>/themes/<stage>.json`); the two-step root→canonical
  fallback is gone.
- `data/validate.js` treats any resurrected `data/<locale>/<stage>.json` as a
  **hard error** (non-zero exit), not a validation target, so the old format
  cannot silently come back.

## Consequences
- One manifest per stage, one fetch, one place to register themes.
- Validator output no longer double-counts manifests; summary now reports
  canonical manifests only.
- ADR 0002 is superseded: root stage files are no longer part of the format.
  ADR 0004 (manifest-vs-content cross-checks) is unaffected and still applies to
  the canonical location.
- `data/README.md` and `CONTRIBUTING.md` were updated to the canonical layout.
- Service-worker cache bumped to version 18 (old caches may still contain root
  files; they are now 404s the app no longer requests).
