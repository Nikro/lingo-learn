# LingoLearn Tasks

## Immediate stabilization
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

## Next UI fixes
- [ ] Add explicit empty states for missing grammar/vocabulary/exercises per theme.
- [ ] Add visual breadcrumbs for language pair → level → stage → theme.
- [ ] Audit mobile sidebar behavior on real devices.
- [ ] Add route handling for `/themes` and invalid theme IDs.
- [ ] Revisit quiz start behavior for theme-specific exercises.

## Data cleanup and collection guidance
- [ ] Decide whether root stage JSON files are manifests or complete stage payloads.
- [ ] Align every theme JSON to one schema.
- [ ] Reduce duplicate topics so each stage has approximately 10 canonical themes.
- [ ] Define a standard aid-language hint field.
- [ ] Define accepted sources for vocabulary, grammar examples, dialogues, and exercises.
- [ ] Add review rules for generated exercises: CEFR fit, one correct answer, clear explanation, no copyrighted long excerpts, no personal data.
- [ ] Validate all active data with `node data/validate.js`.

## PWA/deployment
- [ ] Fix service-worker cache versioning before enabling registration.
- [ ] Test deployment under a GitHub Pages subpath.
- [ ] Add a minimal GitHub Actions workflow for validation and static `dist/` deployment.
- [ ] Add icons/screenshots if missing from the manifest.

## Git hygiene and decision logging
- [ ] Use `/tmp` or ignored `workspace/` for scratch files, downloaded references, and generated intermediate data.
- [ ] Add ADRs under `ops/decisions/` for durable architecture/workflow decisions.
- [ ] Keep `CHANGELOG.md` updated for user-visible changes and major repo/process changes.
