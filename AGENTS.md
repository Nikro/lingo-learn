# AGENTS.md — LingoLearn Operating Rules

## Project intent
LingoLearn is a static, GitHub Pages friendly PWA for language learning. The app must model learning as:

- **Source language**: the learner's primary explanation language, e.g. English.
- **Destination language**: the language being learned, e.g. Spanish.
- **Aid language**: optional hint/bridge language, e.g. Romanian, used only when content explicitly provides it.

The first production-quality curriculum is `en-es` (English → Spanish). Keep the architecture locale-pair agnostic.

## Non-negotiable constraints
- Keep the app static: no backend, no secrets, no server-required runtime, and no paid API dependency.
- Keep it deployable from the repository root on GitHub Pages.
- Prefer zero build step. CDN usage is acceptable for this prototype; if a build step is introduced later, document it and keep static output simple.
- Keep learner data in browser storage only. Do not add analytics, trackers, remote sync, or credential flows unless explicitly requested.
- Do not commit credentials, API keys, private tokens, cookies, database dumps, or generated local exports.
- Never wrap imports in `try/catch` blocks.

## UI and interaction standards
- Use DaisyUI components first; use Tailwind utilities for layout and small adjustments.
- Every async content path must have exactly one of these visible states: loading, loaded content, empty state, or error state. Loading skeletons must be gated by `loading` and hidden after completion.
- Navigation must preserve context. Selecting a theme should not collapse the entire sidebar or remove the user's path back to the stage/theme list.
- Pillar tabs must remain visible while switching between vocabulary, grammar, and exercises inside a theme.
- Avoid injecting Alpine directives through `x-html`; Alpine does not compile those bindings after insertion. Use templates for interactive DOM.
- Escape or sanitize learner-facing HTML generated from JSON if content can come from untrusted sources.

## Curriculum/data rules
- Content belongs in JSON under `data/<source>-<target>/`.
- Stage IDs use lowercase CEFR chunks, e.g. `a1-1`, `a1-2`, `b2-3`.
- A full stage should target roughly 10 themes. Each theme should use standardized sections: vocabulary, grammar, exercises, and optionally pronunciation/dialogues/culture notes.
- Keep files small enough for browser loading and code-review context. Prefer per-theme files over huge monolithic stage files.
- Register active language pairs and aid languages in `data/registry.json`.
- Validate data with `node data/validate.js` after schema-affecting or content-shape changes.

## Testing/checks before commit
Run the strongest available checks for the change:

1. `node data/validate.js` for data/schema changes.
2. `python3 -m http.server 8765` and a browser smoke test for UI/navigation changes when practical.
3. Secret scan with ripgrep patterns before finalizing broad generated-content changes.

## Documentation expectations
- Read `HINTS.md` before broad UI, architecture, data-shape, routing, or agent-workflow changes. It contains practical Alpine.js, DaisyUI, data, deployment, and context-window guidance.
- Update `README.md` when app setup, architecture, deployment, or major behavior changes.
- Update `PLAN.md` when scope/architecture decisions change.
- Update `TASKS.md` when task state or priorities change.
- Add an ADR under `ops/decisions/` for decisions that future agents should not have to rediscover.
- Keep documentation direct, explicit, and useful for future AI agents.

## Scratch-space and git hygiene
- Prefer `/tmp` for throwaway analysis, downloaded references, or generated intermediate files.
- A root-level `workspace/` directory is also available for local scratch work and is ignored by git.
- Before committing, run `git status --short` and verify that only intentional source/docs/data changes are staged.
- Do not commit generated logs, localStorage exports, browser profiles, copied full framework docs, or temporary prompt/context dumps.
- If a temporary artifact becomes a durable project decision, summarize it in `ops/decisions/` instead of committing the raw artifact.
