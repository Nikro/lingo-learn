# LingoLearn — Spanish Learning App

A gamified, offline-capable Spanish learning web app built with **Alpine.js**, **Tailwind CSS**, and **DaisyUI**. Zero dependencies, zero build step — just open and learn.

## Features

- **Multi-level curriculum**: A1 → A2 → B1 → B2 (planned); currently A1.1 populated
- **5 exercise types**: Multiple choice, fill-in-blank, conjugation (single & matrix), matching, drag-and-drop
- **Progress tracking**: XP, daily streaks with multiplier (1× / 1.5× / 2×), per-pillar & per-stage completion
- **PWA**: Installable on mobile/desktop; full offline support via service worker
- **Responsive**: Mobile-first layout with collapsible sidebar; works on phones, tablets, and desktops
- **Multi-language**: Data-driven locale registry (en-es populated, easily extensible)
- **Hash routing**: Shareable deep-links (`#/en-es/A1/a1-1/grammar`)

## Quick Start

### Local Development

No build step required. Just serve the static files:

```bash
# Python 3
python3 -m http.server 8765

# Or any other static server
npx serve . -p 8765
```

Then open **http://localhost:8765**.

### Install on Mobile / Desktop

When visiting from a PWA-capable browser (Chrome, Edge, Safari), an **Install App** button appears in the sidebar. Tap it to add a home-screen shortcut that works offline.

## Architecture

```
spanish-app/
├── index.html              # Single-page app shell (Alpine.js + DaisyUI)
├── manifest.json           # PWA manifest (name, icons, display mode)
├── sw.js                   # Service worker (cache-first HTML, network-first JS)
├── js/
│   ├── app.js              # Main app: Alpine component, routing, quiz engine, rendering
│   └── storage.js          # localStorage wrapper (progress, XP, streak, settings, I/O)
├── data/
│   ├── registry.json       # Locale registry (codes, names, active flags)
│   ├── schema.json         # JSON Schema draft-07 for stage content validation
│   ├── validate.js         # Runtime schema validator for stage data
│   └── <locale>/
│       └── a1-1.json       # One JSON file per stage (A1.1, A1.2, …)
├── data/README.md          # Data directory documentation & schema reference
├── CHANGELOG.md            # Release history
├── CONTRIBUTING.md         # How to contribute content & code
└── README.md
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | [Alpine.js](https://alpinejs.dev) v3 (reactive, no build step) |
| Styling | [Tailwind CSS](https://tailwindcss.com) + [DaisyUI](https://daisyui.com) (CDN) |
| PWA | Native Service Worker (`sw.js`) + `manifest.json` |
| Routing | URL hash (`#/locale/level/stage/pillar`) |
| Storage | `localStorage` (locale-aware keys) |
| Data | Hand-curated JSON files, validated against `schema.json` |
| Hosting | GitHub Pages (static) |

## Data Architecture

Content lives in JSON files under `data/<locale>/`. Each file represents one stage:

- **grammar** — Lesson topics with explanations, tables, examples, and learner aid notes
- **vocabulary** — Word cards with target/source terms, gender markers, semantic categories
- **verbs** — Conjugation tables for each tense/verb combination
- **pronunciation** — Sound guides with phonetic examples
- **exercises** — Quiz questions (multiple choice, fill-in-blank, matching, conjugation matrix)

See [data/README.md](data/README.md) for the full schema reference and examples.

## Adding New Content

1. Review `data/schema.json` or `data/README.md` for the data format
2. Create a new JSON file in `data/<locale>/` (e.g., `a1-2.json`)
3. Validate against the schema using `data/validate.js`
4. Update `data/registry.json` to register the new stage
5. Commit and push — the app picks up new content automatically

## License

MIT
