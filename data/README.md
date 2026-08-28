# Data Directory Reference

This directory contains all curriculum content for the Spanish Learning App. Content is organized by locale (language pair) and stage (lesson level).

## Directory Layout

```
data/
├── registry.json           # Locale registry — which language pairs are available
├── schema.json             # JSON Schema draft-07 — validates all stage files
├── validate.js             # Runtime validator — run against a locale folder (or all)
└── <locale>/               # One subdirectory per locale
    └── <stage>/            # One subdirectory per stage (a1-1, a2-2, …)
        └── themes/
            ├── <stage>.json    # CANONICAL stage manifest (title, description, themes[];
                                # optional stage-level verbs[]) — the app reads THIS
            ├── <theme-a>.json  # Theme content (vocabulary, grammar, exercises, …)
            └── <theme-b>.json
```

NOTE: there are **no root-level stage files** (`data/<locale>/<stage>.json` was retired
2026-08-28, see `ops/decisions/0007-canonical-stage-manifest.md`). The validator
treats any resurrected root stage file as an error.

## Locale Registry (`registry.json`)

```json
{
  "locales": [
    {
      "code": "en-es",
      "name": "English → Spanish",
      "active": true,
      "stages": ["a1-1", "a1-2"]
    }
  ],
  "aid_languages": [
    { "code": "ro", "name": "Romanian", "enabled": true },
    { "code": "it", "name": "Italian", "enabled": true }
  ]
}
```

- **code**: Unique locale identifier (source-destination)
- **name**: Human-readable label
- **active**: Whether this locale is available in the app
- **stages**: List of stage IDs available for this locale

## Stage Manifest Format (`themes/<stage>.json`)

The canonical stage manifest lives at `data/<locale>/<stage>/themes/<stage>.json`.
It conforms to [schema.json](schema.json) (`file_type: "manifest"`). Key sections:

### `id` (string, required)
Stage identifier in kebab-case. Must match the pattern `^[a-z]\d-\d+$`.

Example: `"a1-1"`, `"b2-3"`.

### `title` (string, required)
Display title shown in the app.

Example: `"Stage A1.1 — Greetings & Introductions"`

### `description` (string, required)
Brief overview of what the stage covers.

### `grammar` (array, required)
Grammar lessons for this stage. Each item:

```json
{
  "title": "Articles: el, la, los, las",
  "content": "Spanish has definite articles that agree in gender...",
  "table": {
    "headers": ["", "Singular", "Plural"],
    "rows": [["Masculine", "el", "los"], ["Feminine", "la", "las"]]
  },
  "examples": ["el libro (the book)", "la casa (the house)"],
  "aid_note": "Like Italian 'il/la/i/le' or French 'le/la/les/les'"
}
```

- **title**: Lesson heading
- **content**: HTML-free explanation text
- **table**: (optional) Two-dimensional table — headers + rows
- **examples**: (optional) Example sentences
- **aid_note**: (optional) Helpful comparison for speakers of aid languages (Romanian, Italian, etc.)

### `vocabulary` (array, required)
Vocabulary word cards:

```json
{
  "id": 1,
  "target": "hola",
  "source": "hello",
  "gender": "—",
  "type": "greeting"
}
```

- **id**: Unique integer within the stage
- **target**: Spanish word/phrase
- **source**: Source language translation
- **gender**: `"m."`, `"f."`, or `"—"` (not applicable)
- **type**: Semantic category (`greeting`, `polite`, `intro`, `feeling`, `noun`, `adjective`, `verb`, `adverb`, `preposition`, `number`, `family`, `color`, `other`)

### `verbs` (array, required)
Verb entries with full conjugation tables:

```json
{
  "infinitive": "SER",
  "translation": "to be (permanent)",
  "conjugations": {
    "present": {
      "yo": "soy",
      "tú": "eres",
      "él/ella/usted": "es",
      "nosotros": "somos",
      "vosotros": "sois",
      "ellos/ellas/ustedes": "son"
    },
    "imperfect": { ... }
  }
}
```

- **infinitive**: Verb in infinitive form (uppercase convention)
- **translation**: English meaning
- **conjugations**: Map of tense names → pronoun-to-form maps

Pronoun keys must be one of: `yo`, `tú`, `él/ella/usted`, `nosotros`, `vosotros`, `ellos/ellas/ustedes`.

### `pronunciation` (array, required)
Pronunciation lessons:

```json
{
  "title": "The Five Vowels",
  "content": "Spanish vowels are always pronounced the same way...",
  "examples": [
    { "target": "a", "source": "like 'a' in father" },
    { "target": "e", "source": "like 'e' in bet" }
  ]
}
```

- **title**: Lesson heading
- **content**: Explanation text
- **examples**: Array of `{target, source}` pairs for sound-to-pronunciation mapping

### `exercises` (array, required)
Interactive quiz questions. Types:

#### Multiple Choice (`"exercise"`)
```json
{
  "type": "exercise",
  "question": "What is the masculine singular definite article?",
  "options": ["la", "el", "los", "las"],
  "correct": 1,
  "explanation": "'El' is the masculine singular definite article."
}
```

- **type**: Must be `"exercise"`
- **question**: The prompt
- **options**: Array of answer choices
- **correct**: Index of correct answer (0-based)
- **explanation**: Shown after answering

#### Fill-in-Blank
```json
{
  "type": "fill-in-blank",
  "question": "Write the plural of 'el libro': el ____",
  "correct": "libros",
  "explanation": "Masculine singular nouns ending in a vowel add -s."
}
```

- **type**: `"fill-in-blank"`
- **correct**: Expected string answer (case-insensitive comparison)

#### Conjugation (single cell)
```json
{
  "type": "conjugation",
  "question": "Conjugate SER in the present tense for 'yo':",
  "verb": "SER",
  "tense": "present",
  "correct": "soy",
  "explanation": "'Soy' is the first-person singular of SER."
}
```

#### Conjugation Matrix
```json
{
  "type": "conjugation-matrix",
  "question": "Complete the full present tense conjugation table for SER:",
  "verb": "SER",
  "tenses": ["present"],
  "explanation": "Practice all six forms."
}
```
User fills a full pronoun × tense grid. Correctness is evaluated per cell.

#### Matching
```json
{
  "type": "matching",
  "question": "Match each Spanish greeting with its English meaning:",
  "pairs": [
    { "target": "hola", "source": "hello" },
    { "target": "buenos días", "source": "good morning" }
  ],
  "explanation": "Essential greetings for introductions."
}
```
User clicks a target term, then its English match. Right column items are shuffled.

#### Drag-and-Drop
```json
{
  "type": "drag-drop",
  "question": "Sort the sentences from most formal to least formal:",
  "items": ["Buenos días", "Hola", "Adiós"],
  "correct_order": [1, 0, 2],
  "explanation": "Order by formality level."
}
```

## Schema Validation

Run `validate.js` against a locale folder (or all locales):

```bash
node data/validate.js          # all locales
node data/validate.js en-es    # one locale
```

Expected output on success: one `✅` line per content theme and per stage manifest,
plus a summary. Any `❌` line is a blocking error (non-zero exit code).

## Best Practices for Adding Content

1. **Follow the schema** — Always validate before committing
2. **One stage per file** — Don't split stages across files or combine stages
3. **Use consistent tense names** — `present`, `imperfect`, `preterite`, `future`, `conditional`, `subjunctive`
4. **Include `aid_note`** where relevant — Comparisons to Romanian/Italian are especially helpful for our audience
5. **Balance exercise types** — Mix multiple choice, fill-in-blank, and matching for variety
6. **Write clear explanations** — Every answer should have a helpful explanation

## Adding a New Stage

1. Create `data/<locale>/<stage>/themes/`
2. Create the stage manifest `data/<locale>/<stage>/themes/<stage>.json` (copy an existing one)
3. Add the theme content files to `themes/`
4. Update `registry.json` to add the stage ID to the locale's `stages` array
5. Validate: `node data/validate.js <locale>`
6. Commit with message: `Add stage A1.x — <topic>`

Do NOT create a root-level `data/<locale>/<stage>.json` — root stage files were
retired in 2026-08-28 and the validator now rejects them.
