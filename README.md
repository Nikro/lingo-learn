# Spanish Learning App

A single-page, offline-first web application for learning Spanish — structured around the CEFR levels (A1, A2, B1, B2) and organized into stages with grammar, vocabulary, verb conjugation, and pronunciation exercises.

## Features

- **Progressive curriculum**: A1 → A2 → B1 → B2, each level with expandable stages
- **Multiple exercise types**: multiple choice, fill-in-the-blank, conjugation drills
- **Progress tracking**: XP, streaks, and stage completion saved to localStorage
- **Offline-first**: Works without a network connection (PWA with service worker)
- **Responsive**: Adapts to mobile, tablet, and desktop screens
- **Settings**: Theme toggle, locale selection, import/export progress data

## Tech Stack

- **Frontend**: Vanilla HTML5 + CSS3 + JavaScript (ES6+)
- **Styling**: DaisyUI + Tailwind CSS (via CDN)
- **Reactivity**: Alpine.js (via CDN)
- **PWA**: Service Worker + manifest.json for installability
- **Storage**: localStorage for progress and settings persistence
- **Routing**: Hash-based client-side routing

## Project Structure

```
spanish-app/
├── index.html          # Main application shell
├── manifest.json       # PWA manifest
├── sw.js               # Service worker
├── css/
│   └── custom.css      # Custom styles on top of Tailwind/DaisyUI
├── js/
│   ├── app.js          # Main application logic, router, exercise engine
│   └── storage.js      # localStorage persistence layer
├── data/
│   ├── registry.json   # Stage/level registry
│   └── en-es/          # Content organized by locale & level
│       └── a1-1.json   # A1.1: Greetings & Introductions
├── PLAN.md             # Development plan
├── SOURCES.md          # References and source materials
├── TASKS.md            # Task tracking
└── .gitignore
```

## Usage

Open `index.html` in any modern browser. No build step or server required — this is a fully static app.

For best experience on mobile, use the "Add to Home Screen" prompt to install as a PWA.

## Development

1. Clone this repository
2. Open `index.html` in your browser (or serve with any static file server)
3. Edit content in `data/` to add new lessons or stages
4. Modify `css/custom.css` for styling changes
5. Add new exercise types in `js/app.js`

## Deployment

The app is designed to be deployed as static files on any hosting service:
- GitHub Pages (recommended for development)
- Netlify / Vercel
- Any web server (Apache, Nginx, etc.)

## Data Format

Lesson content is stored as JSON files in `data/<locale>/`. Each file follows the schema defined in the project:

```json
{
  "level": "A1",
  "stage": "1",
  "title": "Greetings & Introductions",
  "grammar": [...],
  "vocabulary": [...],
  "verbs": [...],
  "exercises": [...]
}
```

See `PLAN.md` for the full data schema specification.

## License

Private project — all rights reserved.
