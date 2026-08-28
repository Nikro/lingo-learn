# LingoLearn Plan

## Goal
Build a static, GitHub Pages deployable PWA for structured language learning. The core product should support source → destination language pairs plus an optional aid language while keeping curriculum content decoupled from UI code.

## Architecture principles

1. **Static first**: all app code and curriculum data are served as static files.
2. **Locale-pair agnostic**: `en-es` is the first real corpus, but the app model should support any source-target pair.
3. **Data-driven curriculum**: stages and themes live in JSON, not in hardcoded templates.
4. **Standardized lesson shape**: theme pages should consistently expose vocabulary, grammar, exercises, and optional supporting sections.
5. **Predictable UX states**: every screen must have explicit loading, loaded, empty, and error behavior.
6. **No secrets**: the app must not require or store credentials, API keys, or private user data.

## Information architecture (canonical as of 2026-08-28, ADR 0007)

```text
data/
├── registry.json
├── schema.json
└── <source>-<target>/
    └── <stage>/themes/
        ├── <stage>.json      # canonical stage manifest (title, description, themes[];
        │                     # optional stage-level verbs[])
        └── <theme>.json      # theme content
```

Root-level stage files (`data/<locale>/<stage>.json`) were retired on 2026-08-28
(ADR 0007). The validator rejects any resurrected root stage file as an error.

A stage should aim for about 10 theme-topics. The current repository has more generated content than the original README described, so cleanup should focus on standardization, validation, and navigation reliability rather than merely adding volume.

## Near-term priorities

### 1. Establish agent-ready project knowledge
- Keep `AGENTS.md` as hard rules for contributors and agents.
- Keep `HINTS.md` as the practical playbook for Alpine.js, DaisyUI, routing, data architecture, and context-window discipline.
- Record durable decisions in `ops/decisions/` when architecture or workflow choices change.

### 2. Stabilize shell and navigation
- Fix loading skeleton visibility and overlap.
- Make settings accessible at all times.
- Keep sidebar context when opening a theme.
- Keep theme tabs visible when switching vocabulary/grammar/exercises.
- Replace interactive `x-html` with Alpine templates.

### 3. Normalize data shape and collection rules
- Decide whether stage root files are summaries or full pillar files.
- Keep per-theme files small and schema-aligned.
- Normalize field names: `target`, `source`, `gender`, `type`, `examples`, `aid_note`.
- Decide how aid-language hints are represented.
- Define what belongs in collected/generated JSON: learner-useful terms, examples, prompts, answers, explanations, CEFR fit, and source notes when licensing allows.
- Exclude copyrighted long passages, personal data, credentials, slurs/offensive content unless pedagogically necessary and clearly marked, and unreviewed machine hallucinations.

### 4. Improve validation and QA
- Expand `data/schema.json` to match the theme-first model.
- Ensure `data/validate.js` validates every active stage and theme manifest.
- Add a lightweight browser smoke-test checklist for routes and settings.
- Keep a repeatable secret-scan command in documentation/tasks.

### 5. PWA readiness and build/deploy ergonomics
- Re-enable the service worker only after stale-cache behavior is handled.
- Make cache versioning explicit.
- Ensure GitHub Pages subpath deployment works.
- Consider a tiny CI/CD pipeline that validates data, checks JavaScript, copies static assets into `dist/`, and deploys the artifact.

## Out of scope for now
- Backend services.
- User accounts.
- Remote progress sync.
- AI-generated content at runtime.
- Analytics/tracking.
