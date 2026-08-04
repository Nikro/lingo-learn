# HINTS.md — Practical Notes for Future LingoLearn Agents

This file is intentionally a **compact working guide**, not a full framework dump. Keep the repo small and keep AI context windows focused. If framework details are needed, read the relevant official page at that moment instead of committing huge copied documentation.

## 1. What this app is trying to be

LingoLearn is a static language-learning PWA:

```text
source language → destination language + optional aid language
```

Example: English explanations for Spanish learners, with Romanian hints when available.

The app should stay:

- static and GitHub Pages deployable;
- data-driven from JSON;
- friendly to offline/PWA usage;
- small enough for humans and LLMs to reason about;
- boring and predictable rather than clever.

## 2. Keep the AI context window small

The current `js/app.js` is too large for comfortable LLM editing. Future work should split it into focused modules, then optionally stitch/bundle for static deployment.

Suggested split:

```text
js/
├── main.js              # Alpine bootstrap only
├── state.js             # initial state factory/constants
├── router.js            # hash parse/build/validation
├── loaders.js           # registry/stage/theme fetch helpers
├── renderers/
│   ├── grammar.js
│   ├── vocabulary.js
│   ├── exercises.js
│   └── pronunciation.js
├── quiz/
│   ├── engine.js
│   ├── matching.js
│   └── conjugation.js
└── storage.js           # existing localStorage wrapper
```

For a zero-build version, multiple plain `<script>` tags are acceptable. For a cleaner production version, add a small build step that emits `dist/` for GitHub Pages.

## 3. Recommended deployment path

Keep source files readable and let CI publish static output:

```text
source files → optional build/copy step → dist/ → GitHub Pages artifact
```

A minimal GitHub Actions flow can:

1. validate JSON;
2. run JavaScript syntax checks;
3. copy static files to `dist/`;
4. optionally concatenate/minify JS later;
5. deploy `dist/` to GitHub Pages.

Do not add a bundler just because it is fashionable. Add it only when it reduces complexity or improves validation.

## 4. Alpine.js hints

Use Alpine for simple reactive UI, not as a full application framework.

Good Alpine patterns:

- Keep state shallow and explicit.
- Prefer `x-show` for toggling existing UI.
- Prefer `<template x-for>` for lists.
- Keep event handlers small: call named methods instead of embedding complex logic in markup.
- Use computed getters for display-only derived values.
- Use `x-cloak` for anything that should not flash before Alpine initializes.

Avoid:

- interactive directives inside `x-html`;
- large generated HTML strings for clickable UI;
- deeply nested state mutations spread across many methods;
- one global `loading` flag for unrelated async operations;
- hidden route changes from inside rendering functions.

Suggested loading state shape:

```js
loading: {
  registry: false,
  stage: false,
  theme: false,
  quiz: false
},
errors: {
  registry: null,
  stage: null,
  theme: null,
  quiz: null
}
```

This prevents one fetch from causing the whole app to look stuck.

## 5. DaisyUI and Tailwind hints

Use DaisyUI for semantic building blocks:

- `navbar`, `drawer`, `menu` for navigation;
- `tabs` for pillars;
- `card` for lesson/theme sections;
- `modal` for settings;
- `alert` for error/empty states;
- `progress`, `stats`, `badge` for progress and XP;
- `btn`, `select`, `input`, `checkbox` for forms.

Use Tailwind for spacing/layout only when DaisyUI does not already solve it:

- `grid grid-cols-1 md:grid-cols-2 gap-4`;
- `max-w-4xl mx-auto`;
- `p-4`, `mb-6`, `text-sm`, `opacity-70`.

Keep custom CSS minimal. If the design requires many custom classes, first ask whether the component should be simpler.

## 6. Routing rules

Prefer a small, explicit hash route contract:

```text
#/en-es
#/en-es/A1/a1-1
#/en-es/A1/a1-1/themes
#/en-es/A1/a1-1/theme/greetings-introductions
#/en-es/A1/a1-1/theme/greetings-introductions/vocabulary
```

The router should:

- parse the hash once;
- validate locale, level, stage, theme, and pillar;
- load only the required JSON;
- set view state;
- never depend on stale state from a previous route.

Avoid having unrelated methods mutate the URL unless they are clearly navigation methods.

## 7. Data architecture hints

Standardize the data contract before generating more content.

Recommended stage summary:

```json
{
  "stage_id": "a1-1",
  "title": "A1.1 — Greetings & Introductions",
  "description": "...",
  "themes": [
    {
      "id": "greetings-introductions",
      "title": "Greetings & Introductions",
      "description": "...",
      "estimated_hours": 4,
      "sections": ["vocabulary", "grammar", "exercises", "pronunciation"]
    }
  ]
}
```

Recommended theme file:

```json
{
  "id": "greetings-introductions",
  "title": "Greetings & Introductions",
  "description": "...",
  "vocabulary": [],
  "grammar": [],
  "exercises": [],
  "pronunciation": [],
  "dialogues": [],
  "culture_notes": []
}
```

Pick one naming style and enforce it. Current data mixes some conventions; schema cleanup should happen before more content expansion.

## 8. Exercise architecture hints

Exercises should be plain data, and the quiz engine should render by `type`.

Suggested exercise fields:

```json
{
  "id": "ex-001",
  "type": "multiple-choice",
  "pillar": "vocabulary",
  "prompt": "How do you say hello?",
  "options": ["hola", "adiós", "gracias"],
  "answer": "hola",
  "explanation": "Hola means hello."
}
```

Keep validation separate from rendering:

```text
exercise data → validate answer → return result → render feedback
```

Do not bury correctness logic inside HTML strings.

## 9. KISS, DRY, SOLID — practical version

Use these principles lightly:

- **KISS**: one route does one thing; one renderer handles one content type.
- **DRY**: reuse card/tab/alert patterns, but do not over-abstract too early.
- **SOLID**: separate storage, routing, loading, rendering, and quiz scoring.
- **Boring code wins**: prefer obvious functions and plain objects over clever meta-programming.

For this app, the best architecture is probably:

```text
data JSON + small loader functions + small renderers + explicit Alpine state
```

not a giant framework rewrite.

## 10. Security and privacy hints

This app should not need secrets at all.

Never commit:

- `.env` files;
- API keys;
- OAuth credentials;
- personal exports from localStorage;
- private curriculum notes;
- cookies or session tokens;
- generated files containing account data.

Recommended scans before broad commits:

```bash
find . -maxdepth 3 -type f \( -name '.env*' -o -name '*.pem' -o -name '*.key' -o -name '*.p12' -o -name '*.pfx' -o -name 'credentials*' -o -name 'id_rsa*' \) -print
```

```bash
rg -n --pcre2 "(?i)(sk-[a-z0-9]{20,}|gh[pousr]_[a-z0-9_]{20,}|github_pat_[a-z0-9_]{20,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|xox[baprs]-[0-9A-Za-z-]{10,}|-----BEGIN (RSA |DSA |EC |OPENSSH |PGP )?PRIVATE KEY-----|mongodb(\+srv)?://[^\s]+:[^\s]+@|postgres(ql)?://[^\s]+:[^\s]+@|mysql://[^\s]+:[^\s]+@|redis://[^\s]+:[^\s]+@)" -S -g '!node_modules' -g '!dist' -g '!build' -g '!HINTS.md' .
```

Broad keyword scans are useful, but they will produce false positives in a language-learning app because words like `password`, `secret`, and `secretary` may be legitimate lesson content.

## 11. Reference material policy

Do **not** dump full Alpine.js or DaisyUI documentation into this repo by default. It increases noise, bloats context, and goes stale.

Better options:

- keep this compact hints file;
- add small local examples only when they match this app;
- link to official docs from README/HINTS if needed;
- fetch current framework docs only when working on that specific framework behavior.

If local references are needed later, create a small `ref/` folder with hand-written cheatsheets, not copied full documentation dumps.

Suggested future files:

```text
ref/
├── alpine-patterns.md
├── daisyui-components.md
└── github-pages-pwa.md
```


## 12. Data collection guidance for curriculum JSON

Collect data that directly helps a learner practice a specific CEFR-stage skill. Prefer small, reviewable records over giant generated dumps.

Include:

- vocabulary items with `target`, `source`, optional `gender`, `type`, and a short example;
- grammar explanations tied to the current theme and CEFR stage;
- exercises with one unambiguous answer or a clear answer set;
- short original examples and dialogues;
- pronunciation notes when they are useful for the source-language audience;
- aid-language hints only when they clarify a real contrast or mnemonic;
- source notes or references when content comes from an external public source and licensing allows it.

Avoid:

- long copyrighted passages or copied textbook content;
- personal names/contact details from real people unless fictionalized;
- real passwords, API keys, addresses, phone numbers, or account identifiers;
- low-value filler exercises generated only to increase volume;
- culturally loaded stereotypes;
- offensive terms unless the lesson specifically needs a safety/cultural warning;
- content that does not fit the declared CEFR level.

Exercise review checklist:

```text
[ ] The prompt is clear.
[ ] The answer is unambiguous.
[ ] Distractors are plausible but not accidentally correct.
[ ] The explanation teaches the rule or vocabulary.
[ ] The exercise belongs to the declared pillar.
[ ] The exercise fits the declared CEFR stage.
[ ] The content is original or safe to use.
```

## 13. Decision framework

When choosing between approaches, prefer the option that best satisfies this order:

1. Keeps the app static and GitHub Pages friendly.
2. Keeps JSON data independent from UI code.
3. Keeps future LLM edits small and localized.
4. Makes loading/error/empty states explicit.
5. Avoids stale framework-specific cleverness.
6. Is easiest for a human to debug in browser devtools.

If a decision affects project structure, routing, schema, CI/CD, PWA behavior, or data collection policy, write a short ADR in `ops/decisions/`.

ADR format:

```md
# ADR NNNN — Short title

## Status
Proposed | Accepted | Superseded

## Context
What problem are we solving?

## Decision
What are we doing?

## Consequences
What gets easier/harder?
```

## 14. Changelog guidance

Update `CHANGELOG.md` for:

- user-visible UI/navigation behavior changes;
- schema or data-structure changes;
- PWA/cache/deployment changes;
- major content additions/removals;
- security or privacy-related fixes.

Do not log tiny internal-only edits unless they affect future contributors or users.
