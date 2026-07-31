# Spanish Learning App — PROJECT PLAN

## Vision
A progressive, gamified Spanish learning web app (PWA) — multi-language capable from day one. Source→Target language pairs are first-class citizens. English→Spanish, Romanian→English, Romanian→Spanish, Russian→English — all supported via a pluggable locale registry. Deployed on GitHub Pages. Single `index.html` + CDN dependencies. Zero build step.

## Tech Stack
- **UI:** DaisyUI 4 + Tailwind CSS (CDN)
- **Reactivity:** Alpine.js 3 (CDN)
- **Routing:** Hash-based (`#/en-es/a1.1/grammar`) — single-page, no backend
- **Data:** Flat JSON files in `data/{locale}/` directories
- **Storage:** `localStorage` (progress, settings, streaks, XP) — all keys locale-prefixed
- **PWA:** `manifest.json` + `sw.js` (cache shell + data for offline)
- **Dev:** GitHub Pages, no CI/CD pipeline needed initially

## Architecture: Locale → Levels → Stages → Pillars → Exercises

### Top-Level Hierarchy
```
Locale (en-es, ro-en, ro-es, ro-ru, fr-es...)
 └── Levels (A1, A2, B1, B2)
      └── Stage (A1.1, A1.2...) — thematic chunks of ~10 learning units
           ├── Pillar: Grammar
           ├── Pillar: Vocabulary
           ├── Pillar: Verbs & Drills
           ├── Pillar: Pronunciation & Spelling
           └── Exercises — interactive application
```

### Locale Pair Structure
Each locale folder (`data/{source}-{target}/`) contains its own curriculum. The app loads `registry.json` to discover available pairs and a dropdown to switch between them.

```
data/
├── registry.json              # Available locale pairs + metadata
├── en-es/                     # English → Spanish (first full set)
│   ├── a1-1.json
│   ├── a1-2.json
│   └── ...
├── ro-es/                     # Romanian → Spanish
├── ro-en/                     # Romanian → English
└── fr-es/                     # French → Spanish
```

### Page Building Blocks (Content UI)
- **Locale Switcher:** Dropdown in settings to swap source→target pairs
- **Hero Card:** Stage title, progress bar, XP earned, "Start" button
- **Pillar Tabs:** Grammar | Vocabulary | Verbs | Pronunciation
- **Theory Block:** Text explanation, grammar tables, example sentences
- **Vocab Grid:** Cards with target word, source translation, gender marker
- **Quiz Engine:** Multiple-choice, fill-in-blank, drag-drop matching, conjugation matrix
- **Progress Tracker:** Per-pillar completion %, overall level progress bar, XP counter
- **Settings Panel:** Aid Language selector, locale switcher, reset progress, export/import save data

## Curriculum Source
Built from 12+ sources (CVC Instituto Cervantes, CLM Granada, UNIZAR, UB, UNED, Meyster frequency lists, etc.). See `SOURCES.md` for full catalog.

## Development Phases

### Phase 1: Shell (HTML + Navigation)
- `index.html` with Tailwind + DaisyUI + Alpine CDN
- Locale switcher in sidebar or settings
- Sidebar navigation: Locale → Levels (A1→B2) → Stages list
- Main view: Stage title, pillar tabs, progress display
- Settings modal: Locale switcher, Aid Language dropdown, progress reset
- Responsive layout (mobile-first, works as PWA)

### Phase 2: Data Layer
- `data/registry.json` — locale pair registry
- JSON schema definition for stages, pillars, exercises
- `data/en-es/a1-1.json` — first full stage with real content
- Exercise renderer engine (multiple choice + fill-in-blank)
- localStorage save/load for progress and settings (locale-prefixed keys)

### Phase 3: Exercise Engine
- Advanced exercise types: drag-drop, matching, conjugation matrix
- Validation logic: case-insensitive, fuzzy matching where appropriate
- Scoring: per-exercise, per-pillar, per-stage
- Streak tracking + XP system

### Phase 4: Polish
- PWA service worker + manifest
- Install prompt via `beforeinstallprompt`
- Offline cache for data JSON files
- UI polish: animations, transitions, error states
- Populate A1.1 full content from curriculum research

### Phase 5: Deploy
- GitHub Pages setup
- Domain configuration (future)
- Testing across devices

## Key Decisions
- **No backend.** All data static, all logic client-side.
- **Single HTML file.** CDN dependencies only. No npm, no bundler.
- **Hash routing.** `#/locale/level/stage/pillar` for deep links.
- **JSON data.** Easy to add new locale pairs by dropping a folder into `data/`.
- **localStorage only.** Keys prefixed with locale (e.g., `spanish_app_en-es_progress`).
- **Stop at B2.** No C territory. B2 is conversational fluency.
- **Locale-agnostic.** Any source→target pair works. Content is authored per locale, not hardcoded.

## File Structure
```
spanish-app/
├── index.html          # Main app shell
├── manifest.json       # PWA manifest
├── sw.js               # Service worker
├── data/
│   ├── registry.json   # Locale pair registry
│   ├── en-es/          # English → Spanish curriculum
│   │   ├── a1-1.json
│   │   ├── a1-2.json
│   │   └── ...
│   ├── ro-es/          # Romanian → Spanish (future)
│   └── ro-en/          # Romanian → English (future)
├── css/
│   └── styles.css      # Custom overrides (minimal)
├── js/
│   ├── app.js          # Core app logic, routing, locale switching
│   ├── exercises.js    # Exercise engine
│   └── storage.js      # localStorage wrapper (locale-aware)
├── SOURCES.md          # Source research catalog
├── PLAN.md             # This file
└── TASKS.md            # Task breakdown
```
