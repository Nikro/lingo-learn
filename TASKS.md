# Spanish Learning App — TASKS

## Phase 1: Shell (HTML + Navigation)

### T1: Project Setup & Data Architecture
- [ ] Create project directory structure: `data/`, `css/`, `js/`
- [ ] Initialize git repo
- [ ] Add `.gitignore`
- [ ] Create `data/registry.json` with locale pair registry format
- [ ] Create `data/en-es/` folder for English→Spanish curriculum
- [ ] Create `README.md` with project description and multi-locale architecture

### T2: Main HTML Shell
- [ ] Create `index.html` with CDN includes:
  - Tailwind CSS (CDN)
  - DaisyUI 4 (CDN)
  - Alpine.js 3 (CDN)
- [ ] Implement base layout: sidebar + main content area
- [ ] Add responsive CSS (mobile-first)
- [ ] Add dark/light theme toggle (DaisyUI theme)

### T3: Sidebar Navigation
- [ ] Build collapsible sidebar: Locale switcher → Levels (A1→B2) → Stages list
- [ ] Implement active state highlighting for current locale/level/stage
- [ ] Add "Settings" button at bottom
- [ ] Add hamburger menu for mobile

### T4: Stage View Layout
- [ ] Create stage header: title, progress bar, XP display
- [ ] Implement pillar tabs: Grammar | Vocabulary | Verbs | Pronunciation
- [ ] Add "Start Quiz" button (disabled until pillars complete)
- [ ] Create placeholder content for each pillar
- [ ] Ensure smooth tab switching

### T5: Settings Modal
- [ ] Create modal for settings
- [ ] Add Locale Switcher dropdown (loads from `registry.json`)
- [ ] Add Aid Language dropdown: None, Romanian, Italian, French, Portuguese
- [ ] Add "Reset Progress" button (with confirmation)
- [ ] Add "Export Progress" / "Import Progress" buttons
- [ ] Save settings to `localStorage` (locale-prefixed keys)

## Phase 2: Data Layer

### T6: JSON Schema & First Content
- [ ] Define schema for stages, pillars, exercises
- [ ] Create `data/en-es/a1-1.json` with first full stage (real content)
- [ ] Create `js/storage.js` — localStorage wrapper with locale prefixing
- [ ] Implement save/load for: progress, settings, streaks, XP

### T7: Exercise Renderer Engine
- [ ] Build renderer for Multiple Choice exercises
- [ ] Build renderer for Fill-in-Blank exercises
- [ ] Add validation logic (case-insensitive, trim whitespace)
- [ ] Add feedback: correct/incorrect + explanation
- [ ] Implement submit button with score tracking

### T8: Hash Routing
- [ ] Implement `app.js` router: parse `#/locale/level/stage/pillar`
- [ ] Map routes to locale/stage/pillar data from JSON
- [ ] Update sidebar active state on route change
- [ ] Add back button support
- [ ] Handle invalid routes (redirect to home)

## Phase 3: Exercise Engine

### T9: Advanced Exercise Types
- [ ] Build Drag-and-Drop renderer (match pairs)
- [ ] Build Conjugation Matrix renderer (fill verb table)
- [ ] Add scoring for each exercise type
- [ ] Implement drag-drop validation
- [ ] Add visual feedback (green/red borders, animations)

### T10: Scoring & Progress Tracking
- [ ] Implement per-exercise scoring (1 point per correct answer)
- [ ] Calculate pillar completion % (average of exercises)
- [ ] Update stage progress bar (average of pillars)
- [ ] Implement XP system (10 XP per correct exercise, bonus for streaks)
- [ ] Add streak tracking (daily login, consecutive correct answers)

### T11: Quiz Flow
- [ ] Build "Start Quiz" flow: select pillars, shuffle exercises
- [ ] Implement next/previous navigation within quiz
- [ ] Add "Submit Quiz" with score summary
- [ ] Show results screen: correct/incorrect, explanations
- [ ] Allow retry with score improvement tracking

## Phase 4: Polish

### T12: PWA Setup
- [ ] Create `manifest.json` with app name, icons, theme color
- [ ] Create `sw.js` service worker (cache shell + data JSON)
- [ ] Register service worker in `index.html`
- [ ] Implement offline fallback page
- [ ] Test PWA install prompt

### T13: Install Prompt & UI Polish
- [ ] Implement `beforeinstallprompt` event handler
- [ ] Create "Install App" button (appears on first visit)
- [ ] Add install state to localStorage
- [ ] Hide button after install
- [ ] Add animations: transitions between tabs, exercise feedback
- [ ] Add loading states (while JSON loads)
- [ ] Add error states (network failure, corrupted data)
- [ ] Polish progress bar (smooth fill animation)
- [ ] Add XP counter animation (count-up effect)

### T14: Content Expansion
- [ ] Populate A1.1 full content: Grammar, Vocabulary, Verbs, Pronunciation
- [ ] Add 5-8 exercises per pillar (mixed types)
- [ ] Review content for accuracy
- [ ] Create `data/ro-es/` placeholder structure (if Romanian content ready)

## Phase 5: Deploy

### T15: GitHub Pages Deployment
- [ ] Create GitHub repository
- [ ] Configure GitHub Pages (branch: main, folder: /)
- [ ] Push code to remote
- [ ] Test deployment URL
- [ ] Add custom domain (future)

### T16: Testing & QA
- [ ] Test on desktop browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile browsers (iOS Safari, Android Chrome)
- [ ] Test PWA install on mobile
- [ ] Test offline mode (service worker cache)
- [ ] Verify localStorage persistence
- [ ] Verify locale switching works correctly
- [ ] Cross-check curriculum content against sources

### T17: Documentation
- [ ] Update `README.md` with setup instructions
- [ ] Add inline comments to JavaScript code
- [ ] Document JSON schema in `data/README.md`
- [ ] Add changelog (`CHANGELOG.md`)
