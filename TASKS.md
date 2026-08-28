# LingoLearn Tasks

> Board is the source of truth — this file lags by design. (Kanban board `default`; the 100% push cards created 2026-08-26 define the remaining work.)

## Open

- [ ] **GATE: 100% verification pass** (`t_4e512e79`) — re-audit the live app once all 11 parent cards are done and report. (Board card; `todo` until parents complete.)
- [ ] Audit mobile sidebar behavior on real devices. (No board card yet.)
- [ ] Revisit quiz start behavior for theme-specific exercises. (No board card yet.)
- [ ] Align every theme JSON to one schema. (Validator enforces per-file shape; full unification pending.)

## Immediate stabilization (all shipped)
- [x] Add repository agent rules in `AGENTS.md`.
- [x] Add practical future-agent implementation hints in `HINTS.md`.
- [x] Add ignored scratch-space guidance and durable decision records under `ops/`.
- [x] Refresh `README.md` with the current source/destination/aid model.
- [x] Refresh `PLAN.md` around static PWA and theme-first curriculum priorities.
- [x] Gate loading skeletons behind the `loading` state.
- [x] Add an accessible settings modal shell.
- [x] Replace interactive theme cards rendered through `x-html` with Alpine templates.
- [x] Preserve sidebar/stage context when opening a theme.
- [x] Make theme pillar tabs render content without leaving theme detail.
- [x] Run a repository secret scan with ripgrep patterns.

## UI (shipped)
- [x] Add explicit empty states for missing grammar/vocabulary/exercises per theme. (grammar / exercises / verb-drill / pronunciation alerts in `js/app.js`.)
- [x] Add visual breadcrumbs for language pair → level → stage → theme. (rendered from the `breadcrumbs` state in `index.html`.)
- [x] Add route handling for `/themes` and invalid theme IDs. (`loadStageData` validates theme IDs against the manifest; invalid IDs fall back to the theme list with a message.)

## Data (shipped)
- [x] Decide whether root stage JSON files are manifests or complete stage payloads. (ADR 0007: root files retired 2026-08-28; `themes/<stage>.json` is the single canonical manifest and the validator rejects any resurrected root file.)
- [x] Reduce duplicate topics. (Theme consolidation shipped; stage sizes now vary by design — see the canonical manifests, 10–25 themes per stage.)
- [x] Define accepted sources for vocabulary, grammar examples, dialogues, and exercises. (`SOURCES.md` catalogs and rates the curriculum sources.)
- [x] Define a standard aid-language hint field. (`aid_note` in `data/schema.json`, used by 79 themes.)
- [x] Add review rules for generated exercises: CEFR fit, one correct answer, clear explanation, no copyrighted long excerpts, no personal data. (HINTS.md §12 exercise review checklist.)
- [x] Validate all active data with `node data/validate.js`. (Full scan of all 139 themes + 9 canonical manifests; runs as a CI gate in `deploy.yml`.)

## PWA/deployment (shipped)
- [x] Fix service-worker cache versioning. (`CACHE_VERSION` mechanism per ADR 0003; currently v18.)
- [x] Enable service-worker registration and verify install & offline. (PWA card done; verified install + offline on the `/lingo-learn/` subpath.)
- [x] Test deployment under a GitHub Pages subpath.
- [x] Add a minimal GitHub Actions workflow for validation and static deployment. (`.github/workflows/deploy.yml`.)
- [x] Add icons to the manifest. (`icon-192.png`, `icon-512.png`, `maskable-512.png`.)

## Git hygiene and decision logging (shipped)
- [x] Use `/tmp` or ignored `workspace/` for scratch files, downloaded references, and generated intermediate data. (Guidance in `AGENTS.md`.)
- [x] Add ADRs under `ops/decisions/` for durable architecture/workflow decisions. (ADR 0001–0007.)
- [x] Keep `CHANGELOG.md` updated for user-visible changes and major repo/process changes. (Maintained with each ship; see the Unreleased section.)
