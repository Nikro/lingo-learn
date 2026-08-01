# Changelog

All notable changes to this project will be documented in this file.

## [v1.0.0] — 2026-08-01

### Added
- **Complete app shell** — Single-page app with Alpine.js reactive state
- **Sidebar navigation** — Expandable A1/A2/B1/B2 levels with per-stage progress
- **Four content pillars** — Grammar, Vocabulary, Verbs & Drills, Pronunciation
- **Five exercise types** — Multiple choice, fill-in-blank, conjugation (single & matrix), matching, drag-and-drop
- **Full quiz flow** — Question-by-question navigation, per-answer feedback, pillar breakdown, results summary
- **Progress tracking** — XP system with daily streak multiplier (1× → 1.5× → 2×)
- **localStorage persistence** — Locale-aware keys for progress, XP, streak, settings
- **Hash routing** — Shareable deep-links (`#/en-es/A1/a1-1/grammar`)
- **Settings panel** — Theme toggle (dark/light), language-aid selection, import/export progress, reset
- **Install prompt** — PWA beforeinstallprompt handler with sidebar install button
- **Service worker** — Cache-first HTML, network-first JS, offline fallback
- **UI polish** — Skeleton loading screens, confetti animation, XP counter animation, shake/pop feedback
- **Error states** — Data load failure UI with dashed borders and dismiss button
- **Data validation** — JSON Schema draft-07 + runtime validator for stage content
- **A1.1 content** — Full lesson: Articles, Gender, Plurals, SER/ESTAR, 55 vocabulary words, pronunciation guide, 29 exercises

### Technical
- Zero build step — pure static HTML/CSS/JS served via any HTTP server
- CDN-hosted dependencies: Tailwind CSS, DaisyUI, Alpine.js (no npm required)
- Mobile-first responsive layout with collapsible sidebar
- Locale-aware localStorage with migration path from v0 to v1 keys
- Schema versioning system in storage.js (`SCHEMA_VERSION`)

## [v0.1.0] — 2026-07-xx (planned)

Future roadmap items:
- [ ] Populate A1.2, A1.3, and additional levels (A2, B1, B2)
- [ ] Add more exercise types (flashcards, listening, typing)
- [ ] Implement leaderboards / comparison mode
- [ ] Add Spanish-English bidirectional locale (es-en)
- [ ] Web Audio API pronunciation playback
- [ ] Unit tests for quiz logic
- [ ] CI pipeline for content validation

---

*For contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).*
