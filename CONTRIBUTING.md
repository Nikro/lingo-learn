# Contributing to LingoLearn

Thanks for wanting to contribute! This guide covers how to add content (lessons, exercises, vocabulary) and how to contribute code changes.

## Table of Contents

- [Adding Content](#adding-content)
- [Adding New Exercise Types](#adding-new-exercise-types)
- [Adding a New Locale](#adding-a-new-locale)
- [Code Changes](#code-changes)
- [Project Structure](#project-structure)
- [Review Checklist](#review-checklist)

---

## Adding Content

This is a content-first project. The most impactful contribution is adding lessons, vocabulary, and exercises.

### Quick Start

1. **Pick a stage** — e.g., A1.2 (Numbers & Colors) or A2.1 (Daily Life)
2. **Copy a template** — Start from `data/en-es/a1-1.json`
3. **Edit the content** — Replace the arrays with your material
4. **Register the stage** — Update `data/registry.json`
5. **Validate** — Run `node data/validate.js data/en-es/a1-2.json`
6. **Submit a PR** — That's it!

### Content Guidelines

#### Grammar Lessons
- Write clear, concise explanations (1-2 paragraphs max)
- Include at least one table when applicable (conjugation, declension, etc.)
- Provide 3+ example sentences
- Add an `aid_note` if there's a useful comparison to Romanian, Italian, or another aid language
- Use proper Spanish punctuation: ¡ ¿ ¡

#### Vocabulary
- Include `gender` for every noun (`m.`, `f.`, or `—`)
- Use the semantic `type` field: `greeting`, `noun`, `adjective`, `number`, `family`, `color`, `food`, `body`, `place`, `verb`, `adverb`, `preposition`, `time`, `weather`, `polite`, `intro`, `feeling`, `other`
- Aim for 20-40 words per stage (A1), 40-60 (A2+)
- Avoid duplicate entries

#### Verbs
- Use uppercase for the infinitive: `SER`, `ESTAR`, `HABLAR`
- Include all 6 pronoun forms for each tense
- Start with present tense, add imperfect/future as levels progress
- Translation should clarify if it's the permanent vs temporary "to be"

#### Exercises
- Every stage should have 20-30 exercises
- Mix types: 50% multiple choice, 20% fill-in-blank, 15% matching, 15% conjugation matrix
- Every question needs a helpful `explanation`
- For fill-in-blank: use lowercase answers and keep them unambiguous
- For matching: pair at least 4-6 items per exercise
- For conjugation matrix: one verb per matrix, start with present tense only

#### Pronunciation
- Cover the fundamentals first (vowels, consonants, stress rules)
- Include examples for every rule
- Use IPA-style descriptions in the `source` field that learners can read

---

## Adding New Exercise Types

The exercise engine in `js/app.js` supports five types:

| Type | Handler | Description |
|------|---------|-------------|
| `exercise` | `submitMultipleChoice()` | Standard multiple choice |
| `fill-in-blank` | `submitFillIn()` | Free-text answer |
| `conjugation` | `submitConjugation()` | Single conjugation cell |
| `conjugation-matrix` | `submitConjugationMatrix()` | Full conjugation grid |
| `matching` | `submitMatching()` | Click-to-match pairs |

To add a new exercise type:

1. **Define the data structure** in `data/schema.json` under `exercises.items.properties`
2. **Add the handler** in `js/app.js` (e.g., `submitFlashcard()`)
3. **Add the UI** in `index.html` — a new `<div x-show="...">` block in the quiz section
4. **Add scoring** — update `submitAnswer()`, `checkAnswer()`, and XP calculation
5. **Validate** — run `node data/validate.js` with test data

---

## Adding a New Locale

To add a new language pair (e.g., French → Spanish):

1. **Create the directory**: `data/fr-es/`
2. **Create stage files** — Copy `data/en-es/a1-1.json`, translate content
3. **Update registry** — Add to `data/registry.json`:
   ```json
   { "code": "fr-es", "name": "French → Spanish", "active": true, "stages": ["a1-1"] }
   ```
4. **Test** — Open the app, select the new locale from the sidebar dropdown
5. **Validate** — `node data/validate.js data/fr-es/a1-1.json`

---

## Code Changes

### Development Setup

No build step required:

```bash
# Serve locally
cd spanish-app
python3 -m http.server 8765
# Open http://localhost:8765
```

### Files Overview

| File | Purpose |
|------|---------|
| `index.html` | App shell — HTML structure, Alpine.js bindings, Tailwind/DaisyUI config |
| `js/app.js` | Main Alpine component — state, routing, rendering, quiz engine |
| `js/storage.js` | localStorage wrapper — progress, XP, streak, settings, export/import |
| `sw.js` | Service worker — caching strategy, offline fallback, update detection |
| `data/registry.json` | Locale registry |
| `data/schema.json` | JSON Schema for content validation |
| `data/validate.js` | Runtime validator |

### Making Changes

1. **Branch from main**: `git checkout -b feature/your-feature`
2. **Edit files** — Make your changes
3. **Test locally** — Open in multiple browsers (Chrome, Firefox, Safari if possible)
4. **Validate content** — `node data/validate.js data/en-es/*.json`
5. **Commit**: `git add -A && git commit -m "Brief description"`
6. **Push and PR**

### Code Style

- **JavaScript**: Standard browser ES5 — no `const`/`let` in app.js (uses `var` for Alpine compatibility), IIFE pattern, `function` syntax
- **HTML**: Alpine.js directives, semantic elements, no inline event handlers outside `@click` etc.
- **CSS**: Tailwind utility classes + minimal custom CSS in `<style>` block
- **JSON**: 2-space indent, trailing commas not allowed
- **Comments**: Add `// ─── Section Name ───` block headers in app.js

### Adding Inline Comments

When modifying `app.js` or `storage.js`, add comments for:
- New Alpine properties and their purpose
- Complex algorithms (shuffling, scoring logic)
- Edge cases and fallbacks
- `@click` handlers that aren't self-explanatory

---

## Review Checklist

Before submitting a PR, verify:

- [ ] Content validates: `node data/validate.js data/<locale>/*.json`
- [ ] No broken links in `README.md` or `data/README.md`
- [ ] All vocabulary entries have `gender` set (not empty)
- [ ] All exercises have `explanation` text
- [ ] Streak multiplier logic works (1×, 1.5×, 2× thresholds)
- [ ] App loads correctly in Chrome, Firefox
- [ ] PWA install prompt appears in Chrome/Edge
- [ ] Offline mode works after first visit
- [ ] Hash routing works (bookmark a deep link, reload)
- [ ] Settings persist after page reload
- [ ] Export/import works for progress data

---

## Questions?

If you're unsure about anything, open an issue or ask directly. Content contributions don't need to be perfect — they can be iterated on. The app is designed to be extensible and forgiving.

Happy learning! 🇪🇸
