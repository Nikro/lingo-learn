# LingoLearn

LingoLearn is a static, offline-capable language-learning PWA prototype built with Alpine.js, Tailwind CSS, and DaisyUI. It is designed around reusable source → destination language pairs with an optional aid language for hints.

## Product model

The app should treat language learning data as three separate language roles:

- **Source language** — the language used for explanations and translations, such as English.
- **Destination language** — the language being learned, such as Spanish.
- **Aid language** — an optional helper language used for hints or contrastive notes, such as Romanian.

The current populated pair is **English → Spanish** (`en-es`). Other pairs are registered as inactive placeholders until their data exists.

## Curriculum model

The target curriculum structure is CEFR-inspired:

```text
Language pair
└── CEFR level: A1, A2, B1, B2
    └── Stage: A1.1, A1.2, ...
        └── ~10 themes/topics
            ├── Vocabulary
            ├── Grammar
            ├── Exercises
            └── Optional: pronunciation, dialogues, culture notes
```

Exercises can include multiple-choice, fill-in-blank, matching, conjugation, and conjugation-matrix formats.

## Current implementation snapshot

- Static single-page app in `index.html`.
- Alpine component and router in `js/app.js`.
- Locale-aware localStorage wrapper in `js/storage.js`.
- Registry, schema, validator, and curriculum JSON in `data/`.
- PWA metadata in `manifest.json` and service worker file in `sw.js`.
- No backend and no committed secrets are required.

## Run locally

Serve the repository root with any static file server:

```bash
python3 -m http.server 8765
```

Then open <http://localhost:8765>.

> Do not open `index.html` directly with a `file://` URL; browser fetch restrictions will block JSON loading.

## Validate data

```bash
node data/validate.js
```

This checks the JSON curriculum files against `data/schema.json` where supported by the current validator.

## GitHub Pages deployment

This repo is intended to deploy from the repository root:

1. Push the branch to GitHub.
2. Enable GitHub Pages for the branch/root folder.
3. Visit the published URL and smoke-test routing, JSON loading, installability, and offline behavior.


## Documentation map

- `AGENTS.md` — non-negotiable operating rules for AI agents and contributors.
- `HINTS.md` — practical implementation guidance for Alpine.js, DaisyUI, data shape, routing, deployment, security scans, and small-context agent workflows.
- `PLAN.md` — current architecture direction and phased priorities.
- `TASKS.md` — active backlog and completed stabilization items.
- `ops/decisions/` — durable decision records for choices future agents should preserve.
- `data/README.md` — curriculum data/schema notes.

## Important development rules

See `AGENTS.md` for operating rules. The short version:

- Keep it static and PWA-friendly.
- Keep data decoupled into JSON.
- Use DaisyUI first, Tailwind second.
- Never commit secrets or local progress exports.
- Do not inject Alpine directives through `x-html` for interactive elements.
