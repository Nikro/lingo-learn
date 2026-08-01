# LingoLearn — Spanish Learning App

A gamified Spanish learning app built with **Alpine.js**, **Tailwind CSS**, and **DaisyUI**. Fully client-side, PWA-ready, and works offline.

## Features

- **Multi-level curriculum**: A1 → A2 → B1 → B2
- **5 exercise types**: Multiple choice, fill-in-blank, conjugation, matching, translation
- **Progress tracking**: XP, streaks, completion percentages
- **PWA**: Installable on mobile/desktop with offline support
- **Responsive**: Works on phones, tablets, and desktops
- **Multi-language**: Data-driven locale system (en-es ready, extensible)

## Quick Start

### Local Development
```bash
# Serve locally (no build step needed)
python3 -m http.server 8765
# Open http://localhost:8765
```

### GitHub Pages Deployment
1. Create a new GitHub repo: `Nikro/spanish-learning-app`
2. Add a GitHub PAT: `export GH_TOKEN=ghp_...`
3. Clone and push:
   ```bash
   git clone git@github-bippy-brains:Nikro/spanish-learning-app.git
   cd spanish-learning-app
   # Copy all files from this repo
   git add -A && git commit -m "Initial commit" && git push origin main
   ```
4. Go to **Settings → Pages → Source: main branch, / (root)**
5. Your app will be live at: `https://nikro.github.io/spanish-learning-app/`

## Project Structure

```
spanish-app/
├── index.html          # Main app shell (Alpine.js + DaisyUI)
├── manifest.json       # PWA manifest
├── sw.js              # Service worker (offline support)
├── css/
├── js/
│   ├── app.js         # Main application logic
│   └── storage.js     # localStorage persistence
├── data/
│   ├── registry.json  # Locale/language registry
│   ├── schema.json    # Data schema definition
│   └── en-es/
│       └── a1-1.json  # A1.1: Greetings & Introductions
└── README.md
```

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS + Alpine.js (no build step)
- **Styling**: Tailwind CSS + DaisyUI (via CDN)
- **PWA**: Service Worker + manifest.json
- **Routing**: Hash-based (`#grammar`, `#vocabulary`, etc.)
- **Storage**: localStorage (progress, settings, XP)

## Adding New Content

Add content by creating JSON files in `data/<locale>/` following the schema in `data/schema.json`. The app auto-registers new stages via `data/registry.json`.

## License

MIT
