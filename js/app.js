// LingoLearn — Main Application
// ═══════════════════════════════════════════════════════════
// ─── Application Structure ───
// This file contains the main Alpine.js component for the LingoLearn app.
// It is wrapped in `function app()` and exposed as `window.app`.
// ═══════════════════════════════════════════════════════════

function app() {
  return {
    // ═══════════════════════════════════════════
    // ─── State: Global UI ───
    // ═══════════════════════════════════════════
    
    // Global UI state
    loading: true,           // Overall loading indicator (true during init & data fetch)
    sidebarOpen: false,      // Whether the sidebar is expanded (mobile)
    isMobile: window.innerWidth < 1024,  // Reactive viewport check
    settingsOpen: false,     // Whether the settings modal is visible
    dataError: false,        // True when stage data fails to load
    registry: [],            // Locale registry (levels, stages, pillar ordering)
    aidLanguages: [],        // Available aid language options from the registry
    appLevels: [
      { id: 'A1', name: 'A1 — Beginner', stages: [{ id: 'a1-1', name: 'A1.1 — Greetings & Intros' }, { id: 'a1-2', name: 'A1.2 — Past Tenses & Daily Life' }] },
      { id: 'A2', name: 'A2 — Elementary', stages: [{ id: 'a2-1', name: 'A2.1 — Imperfect & Subjunctive' }, { id: 'a2-2', name: 'A2.2 — Future & Conditional' }] },
      { id: 'B1', name: 'B1 — Intermediate', stages: [{ id: 'b1-1', name: 'B1.1 — Subjunctive & Passives' }, { id: 'b1-2', name: 'B1.2' }] },
      { id: 'B2', name: 'B2 — Upper Intermediate', stages: [{ id: 'b2-1', name: 'B2.1 — Hypotheticals & Professional' }, { id: 'b2-2', name: 'B2.2 — Abstract & Argumentation' }, { id: 'b2-3', name: 'B2.3 — Academic Writing' }] }
    ],

    // ═══════════════════════════════════════════
    // ─── State: Current Navigation ───
    // Current navigation state (parsed from URL hash)
    // ═══════════════════════════════════════════
    
    currentLocale: 'en-es',      // Active locale code (e.g., 'en-es')
    currentLevel: null,          // Active CEFR level (e.g., 'A1', 'B2')
    currentStage: null,          // Active stage (e.g., 'a1-1', 'b2-3')
    currentPillar: 'grammar',    // Active content pillar: grammar | vocabulary | verbs | pronunciation

    // ═══════════════════════════════════════════
    // ─── State: Stage & UI ───
    // Stage data (fetched from JSON) and UI state
    // ═══════════════════════════════════════════
    
    stageData: null,           // Full stage data object (grammar, vocabulary, verbs, pronunciation)

    currentTheme: null,         // Active theme within the current stage
    themeData: null,            // Full theme data object (vocab, grammar, exercises)
    themeView: null,            // null | 'themes' | 'theme-detail' — controls theme navigation view
    themeTitle: null,           // Display title for the current theme (from JSON data)
    previousView: null,         // Previous navigation context for "Go Back" (null | {level, stage, themeView})
    levelData: [],             // Data for the current level (not currently used)

    expandedLevel: null,       // Currently expanded CEFR level in sidebar (null = all collapsed)
    expandedStage: null,       // Currently expanded stage ID in sidebar (e.g., 'a1-1' — shows themes)
    sidebarThemes: {},         // stageId -> theme manifest array (loaded on expand)
    stageThemes: [],           // Current stage's themes manifest (for themes grid view)
    theme: 'dark',             // Active DaisyUI theme name
    aidLanguage: 'none',       // Aid language setting: none | english | spanish | bilingual
    xp: 0,                     // Total experience points earned (persisted to localStorage)
    streak: 0,                 // Current daily learning streak (days in a row)
    progressVersion: 0,        // Reactivity trigger: bumped whenever progress is written to localStorage

    // ═══════════════════════════════════════════
    // ─── State: Quiz Lifecycle ───
    // ═══════════════════════════════════════════
    
    quizActive: false,       // True while a quiz is in progress
    quizFinished: false,     // True when the quiz is complete (results shown)
    quizSubmitted: false,    // True = user has clicked "Submit Quiz" on the last question
    quizQuestions: [],       // Array of exercise objects for the current quiz
    quizIndex: 0,            // Current question index (0-based)
    quizScore: 0,            // Total correct answers in current quiz
    quizAnswered: false,     // True after user answers the current question (waiting for feedback)
    quizFeedback: null,      // Feedback message for the current question

    // Per-question answer inputs (reset each time quiz starts)
    selectedOption: null,    // Index of selected option (multiple choice)
    fillInAnswer: '',        // User's text input (fill-in-the-blank)
    conjugationAnswer: '',   // User's conjugation input

    // Quiz configuration
    quizPillars: ['grammar', 'vocabulary', 'verbs', 'pronunciation'], // Which pillars to include
    lastQuizResult: null,    // Previous attempt history: [{score, total, date}]
    quizPillarBreakdown: null, // Per-pillar breakdown: [{pillar, name, emoji, score, total}]
    pillarScoreMap: null,    // { pillar: score } — tracked during quiz for per-pillar stats
    previousAnswers: [],     // [{question, userAnswer, correct, correctAnswer}] — answer log
    currentQuestionAnswer: null, // Current question's user answer (for summary)
    currentQuestionCorrect: null, // Current question's correctness boolean

    // ═══════════════════════════════════════════
    // ─── State: Drag and Drop ───
    dragItem: null,        // Currently dragged item index (for drag-drop exercises)
    dropTarget: null,       // Drop target index

    // ═══════════════════════════════════════════
    // ─── State: Install Prompt ───
    deferredPrompt: null,   // Captured beforeinstallprompt event (null if not available)
    isInstalled: false,     // Whether the app has been installed as a PWA

    // ═══════════════════════════════════════════
    // ─── State: Conjugation ───
    conjugationVerb: null,       // Verb object being conjugated (for single-cell exercises)
    conjugationCells: {},        // { "tense-pronoun": "form" } — user's conjugation answers

    // ═══════════════════════════════════════════
    // ─── State: Matching Exercise ───
    matchPairs: [],                    // [{target, source}] — correct pairs
    matchRightItems: [],               // Shuffled source strings for the right column
    matchRightOriginalIndex: [],       // Maps right-column items back to pair index
    matchSelections: [],               // { [pairIndex]: { leftIdx, rightIdx, correct } }
    matchRightMatched: [],             // [pairIndex] → true|false — did this right item match?
    selectedLeft: null,                // Currently selected left-item index
    selectedRight: null,               // Currently selected right-item index
    userMatchAnswers: null,            // [source_string] per pair — user's choices
    matchResults: null,                // [boolean] per pair — correctness per pair
    matchAttempts: 0,                  // Total match attempts (for scoring)

    // ═══════════════════════════════════════════
    // ─── State: Conjugation Matrix ───
    matrixPronouns: ['yo', 'tú', 'él/ella/usted', 'nosotros', 'vosotros', 'ellos/ellas/ustedes'],
    matrixAnswers: {},             // { "0-0": "soy", "0-1": "era", ... } — user's input
    matrixCorrectAnswers: null,    // { "0-0": "soy", ... } — expected answers
    matrixResults: null,           // { "0-0": true, ... } — correctness per cell
    matrixCorrectCount: 0,         // Number of correctly filled cells

    // ═══════════════════════════════════════
    // ─── State: Error Tracking ───
    // Track which view had an error so we show actionable messages
    errorState: {
      themes: false,     // true when /themes route but stage has no themes manifest
      theme: false,      // true when theme ID not found in stage manifest
      stage: false,      // true when stage ID invalid for the selected level
      level: false,      // true when level ID is not in the known levels list
    },
    invalidThemeId: false,       // true when theme ID is invalid — show warning in themes grid
    invalidThemeMessage: '',     // descriptive message for the invalid theme

    // ═══════════════════════════════════════════
    // ─── State: Loading ───
    pillarContent: {
      grammar: '',          // Rendered HTML for the grammar pillar view
      vocabulary: [],       // Array of vocabulary card objects
      verbs: '',            // Rendered HTML for the verbs pillar view
      pronunciation: ''     // Rendered HTML for the pronunciation pillar view
    },

    // ═══════════════════════════════════════════
    // ─── Computed Helpers ───
    // ═══════════════════════════════════════════
    
    // Total number of cells in the conjugation matrix grid
    // (pronoun count × tense count for the current question)
    get matrixTotalCells() {
      if (!this.quizQuestions[this.quizIndex]) return 0;
      return this.matrixPronouns.length * (this.quizQuestions[this.quizIndex].tenses || []).length;
    },
    // Count of non-empty cells the user has filled in
    get matrixFilledCount() {
      var filled = 0;
      for (var key in this.matrixAnswers) {
        if (this.matrixAnswers[key] && this.matrixAnswers[key].trim() !== '') filled++;
      }
      return filled;
    },
    // Estimated number of questions in a quiz across all selected pillars
    // When in theme-detail view, counts ONLY theme-level exercises (respects pillar selection)
    // When not in theme-detail view, counts stage-level pillar content
    get estimatedQuizLength() {
      var count = 0;
      var selectedPillars = this.quizPillars.length > 0 ? this.quizPillars : ['grammar', 'vocabulary', 'verbs', 'pronunciation'];

      // Count theme exercises when in theme-detail view
      if (this.themeView === 'theme-detail' && this.themeData) {
        // Theme vocabulary
        if (selectedPillars.includes('vocabulary') && this.themeData.vocabulary && Array.isArray(this.themeData.vocabulary)) {
          count += this.themeData.vocabulary.length;
        }
        // Theme grammar
        if (selectedPillars.includes('grammar') && this.themeData.grammar && Array.isArray(this.themeData.grammar)) {
          count += this.themeData.grammar.length;
        }
        // Theme exercises (filtered by pillar)
        var flatEx = this.flattenThemeExercises();
        for (var i = 0; i < flatEx.length; i++) {
          var ep = flatEx[i].pillar || this.mapExerciseTypeToPillar(flatEx[i].type);
          if (selectedPillars.includes(ep)) count++;
        }
        // No stage-level content in theme-detail view
        return count;
      }
      // Stage view: count only selected pillar content
      if (!this.stageData) return count;
      var self = this;
      selectedPillars.forEach(function(p) {
        if (self.stageData[p] && Array.isArray(self.stageData[p])) count += self.stageData[p].length;
      });
      return count;
    },
    // Emoji feedback based on quiz performance ratio (score / total questions)
    get quizCompletionEmoji() {
      var ratio = this.quizQuestions.length > 0 ? this.quizScore / this.quizQuestions.length : 0;
      if (ratio >= 1) return '🏆';
      if (ratio >= 0.8) return '🌟';
      if (ratio >= 0.6) return '👏';
      if (ratio >= 0.4) return '💪';
      if (ratio > 0) return '🤔';
      return '📚';
    },

    // ═══════════════════════════════════════════
    // ─── Initialization ───
    // ═══════════════════════════════════════════
    
    // Called once after Alpine.js has loaded the component. Sets up routing,
    // locale detection, service worker registration, and PWA install detection.
    async init() {
      // Test persistence
      Storage.testPersistence();

      // Run migration if needed
      Storage.migrate();

      // Load settings
      var settings = Storage.getSettings();
      this.theme = settings.theme || 'dark';
      this.updateTheme(this.theme);
      this.aidLanguage = settings.aidLanguage || 'none';

      // Load registry first — the stored locale is validated against it below
      await this.loadRegistry();

      // Load locale; fall back to the default active locale when the stored
      // value is stale (e.g., a non-active locale left in localStorage).
      // Persist the resolved value so progress keys stay consistent with it.
      this.currentLocale = this.resolveActiveLocale(Storage.getLocale());
      if (Storage.getLocale() !== this.currentLocale) {
        Storage.setLocale(this.currentLocale);
      }

      // Load progress data
      this.xp = Storage.getXP();
      this.streak = Storage.getStreak();

      // Load route
      this.parseRoute();

      // Listen for hash changes
      window.addEventListener('hashchange', function() { this.parseRoute() }.bind(this));

      // Listen for resize to update mobile/desktop state; close sidebar when moving to desktop
      // so it doesn't stay "open" when resizing back to mobile
      window.addEventListener('resize', function() {
        var wasMobile = this.isMobile;
        this.isMobile = window.innerWidth < 1024;
        if (wasMobile && !this.isMobile) {
          this.sidebarOpen = false;
        }
      }.bind(this));

      // Record daily activity
      Storage.recordActivity();

      // ═══════════════════════════════════════════
      // ─── Install Prompt Setup ───
      // ═══════════════════════════════════════════
      
      // Check if previously installed
      this.isInstalled = Storage.getSettings().pwaInstalled || false;

      // Listen for beforeinstallprompt event (captures the native install trigger)
      window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Store the event so we can trigger the install prompt later
        this.deferredPrompt = e;
        console.log('beforeinstallprompt event fired');
      });

      // Listen for app installed event (fires after successful install)
      window.addEventListener('appinstalled', () => {
        this.isInstalled = true;
        this.deferredPrompt = null;
        var s = Storage.getSettings();
        s.pwaInstalled = true;
        Storage.saveSettings(s);
        console.log('LingoLearn PWA installed');
      });

      this.loading = false;
    },

    // Apply a DaisyUI theme to the document root and persist to settings
    updateTheme(theme) {
      this.theme = theme;
      document.documentElement.setAttribute('data-theme', theme);
      var s = Storage.getSettings();
      s.theme = theme;
      Storage.saveSettings(s);
    },

    // Called when the user taps the "Install" button. Triggers the browser's
    // native install prompt (via the captured beforeinstallprompt event).
    async handleInstall() {
      if (!this.deferredPrompt) return;

      // Show the native install prompt
      this.deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      try {
        var choiceResult = await this.deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        // Clear the deferred prompt
        this.deferredPrompt = null;
      } catch (err) {
        console.error('Install prompt error:', err);
      }
    },

    // Computed: returns true if the app can be installed as a PWA
    get canInstallApp() {
      return !this.isInstalled && this.deferredPrompt !== null;
    },

    // Computed: registry locales that are active. The sidebar switcher
    // renders only these; inactive pairs have no content yet (see ADR 0006).
    get activeLocales() {
      return (this.registry.locales || []).filter(function (l) { return l.active === true; });
    },

    // Resolve a stored/routed locale code to an active one. Returns the code
    // itself when it is active; otherwise the default 'en-es', or the first
    // active locale if the default is ever deactivated.
    resolveActiveLocale(code) {
      var active = this.activeLocales;
      if (active.length === 0) return code || 'en-es';
      var i;
      for (i = 0; i < active.length; i++) {
        if (active[i].code === code) return code;
      }
      for (i = 0; i < active.length; i++) {
        if (active[i].code === 'en-es') return 'en-es';
      }
      return active[0].code;
    },

    // ═══════════════════════════════════════════
    // ─── Data Loading ───
    // ═══════════════════════════════════════════
    
    // Fetch and cache the locale registry from data/registry.json.
    // Called during init; called again after a locale switch.
    async loadRegistry() {
      try {
        var response = await fetch('data/registry.json');
        var data = await response.json();
        this.registry = data;
        this.aidLanguages = data.aid_languages || [];
      } catch (e) {
        console.error('Failed to load registry:', e);
        this.registry = { locales: [], aid_languages: [] };
        this.aidLanguages = [];
      }
    },

    // Switch the active locale and reset navigation to the locale root
    switchLocale(locale) {
      this.currentLocale = locale;
      Storage.setLocale(locale);
      this.xp = Storage.getXP();
      this.streak = Storage.getStreak();
      // Progress is locale-keyed — re-read now that the locale changed
      this.touchProgress();
      this.currentStage = null;
      this.currentLevel = null;
      window.location.hash = '/' + locale;
    },

    // Fetch stage data from the locale-specific JSON file and render the current pillar.
    // stageId is in filename format (a1-1, a2-3, b1-2, etc.)
    // onReady: optional callback invoked when data is loaded (for async route validation)
    // themeId: optional theme ID to validate against the manifest
    loadStageData: function(levelId, stageId, onReady, themeId) {
      var self = this;
      this.loading = true;
      this.dataError = false;
      // Use a promise so the caller can optionally wait for completion
      var complete = function() {
        self.loading = false;
        if (onReady) onReady();
      };
      // stageId is already in filename format (a1-1, a2-3, b1-2, etc.)
      fetch('data/' + this.currentLocale + '/' + stageId + '.json')
        .then(function(response) {
          if (!response.ok) throw new Error('HTTP ' + response.status);
          return response.json();
        })
        .then(function(data) {
          self.stageData = data;
          if (!self.stageData || Object.keys(self.stageData).length === 0) {
            self.dataError = true;
            complete();
            return;
          }
          // Check if this stage has a themes directory (granular theme-based curriculum)
          var themesDir = 'data/' + self.currentLocale + '/' + stageId + '/themes';
          return fetch(themesDir + '/' + stageId + '.json')
            .then(function(themesResponse) {
              if (!themesResponse.ok) {
                // No themes manifest — fall through to pillar view
                self.renderPillar();
                complete();
                return;
              }
              return themesResponse.json();
            })
            .then(function(manifest) {
              if (manifest && manifest.themes) {
                // Stage has theme-based curriculum — set theme data
                self.stageThemes = manifest.themes;
                self.stageTitle = manifest.title || self.stageData.title;
                self.stageDescription = manifest.description || self.stageData.description;

                // Validate theme ID if one was provided
                if (themeId) {
                  var themeFound = manifest.themes.some(function(t) { return t.id === themeId; });
                  if (!themeFound) {
                    self.invalidThemeId = true;
                    self.invalidThemeMessage = '"' + themeId + '" is not a valid theme for this stage.';
                    self.themeView = 'themes';
                    self.themeTitle = null;
                    self.themeData = null;
                    complete();
                    return;
                  }
                  // Theme valid — proceed to detail view
                  self.themeView = 'theme-detail';
                } else {
                  // No theme requested — show themes list
                  self.themeView = 'themes';
                }
              } else {
                self.renderPillar();
              }
              complete();
            })
            .catch(function(e) {
              // No themes found or manifest invalid — fall through to pillar view
              self.renderPillar();
              complete();
            });
        })
        .catch(function(e) {
          console.error('Failed to load stage data:', e);
          self.stageData = {
            id: stageId,
            title: 'Stage ' + stageId,
            description: 'Content loading...',
            grammar: [],
            vocabulary: [],
            verbs: [],
            pronunciation: []
          };
          self.dataError = true;
          complete();
        });
    },

    // ═══════════════════════════════════════════
    // ─── Navigation ───
    // ═══════════════════════════════════════════
    
    // Toggle expansion of a CEFR level in the sidebar (A1, A2, B1, B2)
    toggleLevel(levelId) {
      this.expandedLevel = this.expandedLevel === levelId ? null : levelId;
    },

    // Toggle expansion of a stage within a level (shows themes)
    toggleStage(stageId) {
      if (this.expandedStage === stageId) {
        this.expandedStage = null;
        delete this.sidebarThemes[stageId];
      } else {
        this.expandedStage = stageId;
        // Load themes for this stage if not already loaded
        if (!this.sidebarThemes[stageId]) {
          this.loadStageThemes(stageId);
        }
      }
    },

    // Load theme manifest for a stage (for sidebar display)
    async loadStageThemes(stageId) {
      try {
        var themesDir = 'data/' + this.currentLocale + '/' + stageId + '/themes/';
        var response = await fetch(themesDir + stageId + '.json');
        if (response.ok) {
          var manifest = await response.json();
          if (manifest && manifest.themes) {
            this.sidebarThemes[stageId] = manifest.themes;
            return;
          }
        }
        // No themes — clear the key so we know
        this.sidebarThemes[stageId] = null;
      } catch(e) {
        this.sidebarThemes[stageId] = null;
      }
    },

    // Navigate to a theme directly from sidebar
    async loadThemeDirectly(stageId, themeId) {
      // Close sidebar on mobile after navigation so content is visible
      this.sidebarOpen = false;
      // Keep the stage expanded so users can navigate adjacent themes without losing context.
      this.currentLevel = this.getCurrentLevelForStage(stageId);
      this.currentStage = stageId;
      this.themeView = 'theme-detail';
      this.currentTheme = themeId;
      this.themeData = null;
      this.themeTitle = null;
      this.loading = true;
      this.dataError = false;
      window.location.hash = '/' + this.currentLocale + '/' + this.currentLevel + '/' + this.currentStage + '/theme/' + themeId;
      await this.loadTheme(themeId);
    },

    // Helper: find which level a stage belongs to
    getCurrentLevelForStage(stageId) {
      for (var i = 0; i < this.appLevels.length; i++) {
        for (var j = 0; j < this.appLevels[i].stages.length; j++) {
          if (this.appLevels[i].stages[j].id === stageId) return this.appLevels[i].id;
        }
      }
      return null;
    },

    // Navigate to a specific level/stage/pillar:
    // update state, set hash URL, close sidebar, load stage data
    navigateTo(levelId, stageId, pillar) {
      pillar = pillar || 'grammar';
      this.currentLevel = levelId;
      this.currentStage = stageId;
      this.currentPillar = pillar;
      this.sidebarOpen = false;

      window.location.hash = '/' + this.currentLocale + '/' + this.currentLevel + '/' + this.currentStage + '/' + this.currentPillar;

      this.loadStageData(levelId, stageId);
    },

    // Parse URL hash into route parameters (locale, level, stage, pillar).
    // Also handles theme routes: /{locale}/{level}/{stage}/theme/{themeId}
    // Validates each level against the loaded registry; invalid entries show error state.
    parseRoute: function() {
      var hash = window.location.hash.slice(1) || '/' + this.currentLocale;
      var parts = hash.split('/').filter(function(b) { return b; });

      // Bare /themes route with no context — show error, can't redirect anywhere
      if (parts.length === 1 && parts[0] === 'themes') {
        this.errorState.stage = true;
        this.stageTitle = 'No stage selected';
        this.stageDescription = 'Navigate to a stage to view its themes.';
        this.loading = false;
        return;
      }

      if (parts.length >= 1) this.currentLocale = parts[0] || this.currentLocale;

      // Redirect deep links that name an inactive locale to the default active
      // one (stale bookmarks of unshipped pairs). Only when the registry
      // loaded with at least one active locale, so a failed registry fetch
      // cannot trigger a redirect loop.
      var activeNow = this.activeLocales;
      if (activeNow.length > 0 && activeNow.every(function (l) { return l.code !== this.currentLocale; }.bind(this))) {
        var rest = parts.slice(1);
        this.currentLocale = this.resolveActiveLocale(parts[0]);
        window.location.hash = '/' + this.currentLocale + (rest.length ? '/' + rest.join('/') : '');
        return;
      }

      if (parts.length >= 2) this.currentLevel = parts[1];
      if (parts.length >= 3) this.currentStage = parts[2];

      // Clear all error states at the start of each route parse
      this.errorState.themes = false;
      this.errorState.theme = false;
      this.errorState.stage = false;
      this.errorState.level = false;
      this.invalidThemeId = false;
      this.invalidThemeMessage = '';

      // /{locale}/themes — no level/stage context
      if (parts.length >= 2 && parts[1] === 'themes') {
        if (this.currentStage) {
          this.themeView = 'themes';
          window.location.hash = '/' + this.currentLocale + '/' + this.currentLevel + '/' + this.currentStage;
          return;
        }
        this.errorState.stage = true;
        this.stageTitle = 'No stage selected';
        this.stageDescription = 'Navigate to a stage to view its themes.';
        this.loading = false;
        return;
      }

      // Theme route: /{locale}/{level}/{stage}/theme/{themeId}
      if (parts.length >= 5 && parts[3] === 'theme') {
        var themeId = parts[4];
        this.currentTheme = themeId;
        this.themeData = null;
        this.themeTitle = null;
        if (this.currentLevel && this.currentStage) {
          // Load stage data with theme validation — themeId is validated inside loadStageData
          var self = this;
          self.loading = true;
          self.dataError = false;
          self.loadStageData(self.currentLevel, self.currentStage, function() {
            // If theme was valid, load it now (loadStageData already set themeView to 'themes' or 'theme-detail')
            if (self.themeView === 'theme-detail') {
              self.loadTheme(self.currentTheme);
            } else if (self.invalidThemeId) {
              // Invalid theme — set previous view and error state for "Go Back"
              self.previousView = {
                level: self.currentLevel,
                stage: self.currentStage,
                themeView: 'themes'
              };
              self.errorState.theme = true;
            }
            self.loading = false;
          }, themeId);
        } else {
          // No level/stage — set error
          this.errorState.stage = true;
          this.themeView = null;
          this.loading = false;
        }
        return;
      }

      // Themes route: /{locale}/{level}/{stage}/themes
      if (parts.length >= 4 && parts[3] === 'themes') {
        if (this.currentLevel && this.currentStage) {
          // Load stage data to get the manifest
          var self2 = this;
          this.loading = true;
          this.dataError = false;
          this.loadStageData(this.currentLevel, this.currentStage, function() {
            if (self2.stageThemes && Array.isArray(self2.stageThemes) && self2.stageThemes.length > 0) {
              self2.themeView = 'themes';
            } else {
              // Stage has no themes manifest or empty manifest
              self2.errorState.themes = true;
              self2.stageTitle = self2.stageData ? (self2.stageTitle || 'Stage ' + self2.currentStage) : 'Stage ' + self2.currentStage;
              self2.stageDescription = self2.stageDescription || 'This stage does not have a themes view — content is organized differently.';
              self2.themeView = null;
            }
            self2.loading = false;
          });
        } else {
          // No level/stage for themes route
          this.errorState.stage = true;
          this.themeView = null;
          this.loading = false;
        }
        return;
      }

      if (parts.length >= 4) {
        this.currentPillar = parts[3];
        this.themeView = null;
      }

      // Validate level against known app levels
      if (this.currentLevel) {
        var levelExists = this.appLevels.some(function(l) { return l.id === this.currentLevel; }.bind(this));
        if (!levelExists) {
          // Track locale root as previous for "Go Back"
          this.previousView = { level: this.currentLevel, stage: null, themeView: null };
          this.errorState.level = true;
          this.currentLevel = null;
          this.currentStage = null;
          this.expandedLevel = null;
          this.stageData = null;
          this.stageTitle = 'Invalid level';
          this.stageDescription = 'This learning level does not exist in our curriculum.';
          this.loading = false;
          return;
        }
        this.expandedLevel = this.currentLevel;
      }

      // Validate stage against the selected level
      if (this.currentLevel && this.currentStage) {
        var currentLevelObj = this.appLevels.find(function(l) { return l.id === this.currentLevel; }.bind(this));
        if (!currentLevelObj) {
          this.currentLevel = null;
          this.currentStage = null;
          this.expandedLevel = null;
          return;
        }
        var stageExists = currentLevelObj.stages.some(function(s) { return s.id === this.currentStage; }.bind(this));
        if (!stageExists) {
          // Track current level as previous for "Go Back"
          this.previousView = { level: this.currentLevel, stage: null, themeView: null };
          this.errorState.stage = true;
          this.currentLevel = null;
          this.currentStage = null;
          this.expandedLevel = null;
          this.stageData = null;
          this.stageTitle = 'Stage not found';
          this.stageDescription = 'This stage is not available in the curriculum.';
          this.loading = false;
          return;
        }

        this.loadStageData(this.currentLevel, this.currentStage);
      } else if (this.currentLevel && !this.currentStage) {
        // Level selected but no stage — show error instead of silently defaulting
        this.errorState.stage = true;
        this.stageTitle = this.currentLevel + ' — No stage selected';
        this.stageDescription = 'Please select a specific stage to begin learning.';
        this.loading = false;
      }
    },

    // Get the current route string for display in breadcrumbs
    get currentRoute() {
      if (!this.currentLocale) return '';
      if (!this.currentStage) return '/' + this.currentLocale;
      if (!this.currentPillar) return '/' + this.currentLocale + '/' + this.currentLevel + '/' + this.currentStage;
      return '/' + this.currentLocale + '/' + this.currentLevel + '/' + this.currentStage + '/' + this.currentPillar;
    },

    // Breadcrumb trail for navigation context
    // Returns array of { label, path, isCurrent } objects
    get breadcrumbs() {
      if (!this.currentLocale) return [];

      var items = [];

      // Locale root — always first
      items.push({ label: this.currentLocale, path: '#/' + this.currentLocale, isCurrent: false });

      // Stage segment
      if (this.currentStage) {
        // Try to get display name from stageData first
        var stageLabel = '';
        if (this.stageData && this.stageData.title) {
          stageLabel = this.stageData.title.replace(/^[A-Z]\d\.\d — /, '');
        } else if (this.stageData && this.stageData.name) {
          stageLabel = this.stageData.name.replace(/^[A-Z]\d\.\d — /, '');
        } else {
          // Fallback: look up in appLevels
          for (var i = 0; i < this.appLevels.length; i++) {
            for (var j = 0; j < this.appLevels[i].stages.length; j++) {
              if (this.appLevels[i].stages[j].id === this.currentStage) {
                stageLabel = this.appLevels[i].stages[j].name.replace(/^[A-Z]\d\.\d — /, '');
                break;
              }
            }
            if (stageLabel) break;
          }
        }
        if (stageLabel) {
          items.push({ label: stageLabel, path: '#/' + this.currentLocale + '/' + this.currentLevel + '/' + this.currentStage, isCurrent: false });
          } else {
          items.push({ label: this.currentStage, path: '#/' + this.currentLocale + '/' + this.currentLevel + '/' + this.currentStage, isCurrent: false });
        }
      }

      // Pillar views (stage-level pillars)
      if (this.currentStage && !this.themeView && this.currentPillar) {
        items.push({ label: this.formatPillarName(this.currentPillar), path: '#/' + this.currentLocale + '/' + this.currentLevel + '/' + this.currentStage + '/' + this.currentPillar, isCurrent: true });
        }

        // Themes overview
        if (this.themeView === 'themes') {
        items.push({ label: 'Themes', path: '#/' + this.currentLocale + '/' + this.currentLevel + '/' + this.currentStage + '/themes', isCurrent: true });
        }

      // Theme detail — show theme name
      if (this.themeView === 'theme-detail') {
        var themeLabel = '';
        if (this.themeTitle) {
          themeLabel = this.themeTitle.replace(/^[A-Z]\d\.\d — /, '');
        }
        if (!themeLabel && this.currentTheme) {
          themeLabel = this.currentTheme.replace(/-/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
        }
        if (themeLabel) {
          items.push({ label: themeLabel, path: '#/' + this.currentLocale + '/' + this.currentLevel + '/' + this.currentStage + '/theme/' + this.currentTheme, isCurrent: false });
          }
          // Optional pillar suffix for theme-detail pillar views
          if (this.currentPillar) {
          items.push({ label: this.formatPillarName(this.currentPillar), path: '#/' + this.currentLocale + '/' + this.currentLevel + '/' + this.currentStage + '/theme/' + this.currentTheme + '/' + this.currentPillar, isCurrent: true });
        }
      }

      // If only the locale is set, make it current
      if (items.length === 1) {
        items[0].isCurrent = true;
      }

      return items;
    },

    // Format a pillar key into a readable label
    formatPillarName: function(pillar) {
      var labels = {
        'grammar': 'Grammar',
        'vocabulary': 'Vocabulary',
        'verbs': 'Verbs & Drills',
        'pronunciation': 'Pronunciation'
      };
      return labels[pillar] || pillar;
    },

    // Check if a sidebar item should be highlighted as active
    isStageActive(levelId, stageId) {
      return this.currentLevel === levelId && this.currentStage === stageId;
    },

    // Check if a pillar tab is active (for hash routing via tab clicks)
    isPillarActive(pillar) {
      return this.currentPillar === pillar;
    },

    // Set pillar and update the hash URL
    setPillar(pillar) {
      this.currentPillar = pillar;
      if (this.themeView === 'theme-detail' && this.currentTheme) {
        this.renderThemePillar();
        return;
      }
      if (this.currentStage) {
        window.location.hash = '/' + this.currentLocale + '/' + this.currentLevel + '/' + this.currentStage + '/' + pillar;
      }
      // Re-render pillar content if stage data is already loaded
      if (this.stageData) {
        this.renderPillar();
      }
    },
    // ═══════════════════════════════════════════
    // ─── Theme Navigation ───
    // ═══════════════════════════════════════════
    
    // Navigate into themes view for the current stage
    enterThemes() {
      this.themeView = 'themes';
      this.currentTheme = null;
      this.themeData = null;
      this.themeTitle = null;
      this.expandedStage = null;
      this.sidebarThemes = {};
    },
    
    // Navigate from the themes overview into a concrete theme and keep the URL shareable.
    async loadThemeFromList(themeId) {
      if (this.currentStage && this.currentLevel) {
        window.location.hash = '/' + this.currentLocale + '/' + this.currentLevel + '/' + this.currentStage + '/theme/' + themeId;
      }
      await this.loadTheme(themeId);
    },

    // Load a specific theme's data (handles both single-file and chunked/partitioned JSON)
    async loadTheme(themeId) {
      // Close sidebar on mobile so theme content is visible
      this.sidebarOpen = false;
      this.loading = true;
      this.dataError = false;
      // Track current view as previous for "Go Back" navigation
      this.previousView = {
        level: this.currentLevel,
        stage: this.currentStage,
        themeView: this.themeView
      };
      this.themeView = 'theme-detail';
      this.currentTheme = themeId;
      // Validate theme ID against the stage's manifest if available
      if (this.currentStage && this.stageThemes && Array.isArray(this.stageThemes)) {
        var themeExists = this.stageThemes.some(function(t) { return t.id === themeId; });
        if (!themeExists) {
          this.errorState.theme = true;
          this.themeView = 'themes';
          this.loading = false;
          console.warn('Theme "' + themeId + '" not found in stage manifest');
          return;
        }
      }
      try {
        var baseDir = 'data/' + this.currentLocale + '/' + this.currentStage + '/themes/';
        // Check if chunked/partitioned files exist (e.g., themeId-part-1.json, themeId-part-2.json)
        var chunked = false;
        var partNum = 1;
        while (true) {
          var chunkUrl = baseDir + themeId + '-part-' + partNum + '.json';
          var chunkResponse = await fetch(chunkUrl);
          if (!chunkResponse.ok) {
            // No more chunks found
            break;
          }
          if (!chunked) {
            this.themeData = await chunkResponse.json();
            // Normalize vocabulary: if dict-based (categories), flatten into array
            if (typeof this.themeData.vocabulary === 'object' && !Array.isArray(this.themeData.vocabulary)) {
              var flatVocab = [];
              var nextId = 1;
              for (var cat in this.themeData.vocabulary) {
                if (Array.isArray(this.themeData.vocabulary[cat])) {
                  this.themeData.vocabulary[cat].forEach(function(item) {
                    item.id = item.id || nextId++;
                    item.target = item.target || item.word || '';
                    item.source = item.source || item.english || '';
                    item.gender = item.gender || '—';
                    item.type = item.type || cat;
                    flatVocab.push(item);
                  });
                }
              }
              this.themeData.vocabulary = flatVocab;
              // Also set the theme title from JSON if not set
              if (this.themeData.title && typeof this.themeData.title === 'string') {
                this.themeTitle = this.themeData.title;
              }
            }
            chunked = true;
            partNum++;
            continue;
          }
          var chunkData = await chunkResponse.json();
          // Handle dict-based vocabulary (e.g., b2-1 themes with nouns/verbs categories)
          var chunkVocab = chunkData.vocabulary;
          if (Array.isArray(chunkVocab)) {
            this.themeData.vocabulary.push(...chunkVocab);
          } else if (typeof chunkVocab === 'object') {
            // Merge category arrays into flat vocabulary array, adding IDs
            var vocab = this.themeData.vocabulary;
            var nextId = vocab.length + 1;
            for (var cat in chunkVocab) {
              if (Array.isArray(chunkVocab[cat])) {
                chunkVocab[cat].forEach(function(item) {
                  item.id = item.id || nextId++;
                  item.target = item.target || item.word || '';
                  item.source = item.source || item.english || '';
                  item.gender = item.gender || '—';
                  item.type = item.type || cat;
                  vocab.push(item);
                }.bind(this));
              }
            }
          }
          // Handle dict-based grammar/pronunciation/exercises
          var chunkGrammar = chunkData.grammar;
          if (Array.isArray(chunkGrammar)) {
            this.themeData.grammar.push(...chunkGrammar);
          }
          var chunkExercises = chunkData.exercises;
          if (Array.isArray(chunkExercises)) {
            this.themeData.exercises.push(...chunkExercises);
          }
          var chunkPron = chunkData.pronunciation;
          if (Array.isArray(chunkPron)) {
            this.themeData.pronunciation.push(...chunkPron);
          }
          partNum++;
        }
        if (chunked) {
          // Remove chunking metadata
          delete this.themeData.part;
          this.currentPillar = 'vocabulary';
          this.renderThemePillar();
          this.loading = false;
          return;
        }
        // Fallback: single-file format for backward compatibility
        var response = await fetch(baseDir + themeId + '.json');
        if (!response.ok) throw new Error('HTTP ' + response.status);
        this.themeData = await response.json();
        // Set theme title from JSON if available
        if (this.themeData.title && typeof this.themeData.title === 'string') {
          this.themeTitle = this.themeData.title;
        }
        this.currentPillar = 'vocabulary';
        this.renderThemePillar();
      } catch (e) {
        console.error('Failed to load theme data:', e);
        this.dataError = true;
        this.loading = false;
        return;
      }
      this.loading = false;
    },
    
    // Exit theme detail and return to themes view
    exitTheme() {
      // Track current view as previous for "Go Back" navigation
      this.previousView = {
        level: this.currentLevel,
        stage: this.currentStage,
        themeView: this.themeView
      };
      this.themeView = 'themes';
      this.currentTheme = null;
      this.themeData = null;
      this.themeTitle = null;
      this.currentPillar = 'grammar';
      this.expandedStage = null;
      this.sidebarThemes = {};
      if (this.currentStage && this.currentLevel) {
        window.location.hash = '/' + this.currentLocale + '/' + this.currentLevel + '/' + this.currentStage + '/themes';
      }
    },
    
    // Exit theme navigation entirely and return to stage pillars
    exitThemes() {
      this.themeView = null;
      this.currentTheme = null;
      this.themeData = null;
      this.themeTitle = null;
      this.expandedStage = null;
      this.sidebarThemes = {};
      if (this.currentStage && this.currentLevel) {
        window.location.hash = '/' + this.currentLocale + '/' + this.currentLevel + '/' + this.currentStage + '/' + this.currentPillar;
      }
      this.renderPillar();
    },
    
    // Go back from an error state — clears the error and navigates to the previous view or home
    goBack() {
      this.errorState.themes = false;
      this.errorState.theme = false;
      this.errorState.stage = false;
      this.errorState.level = false;
      this.invalidThemeId = false;
      this.invalidThemeMessage = '';

      // Restore previous view context if available
      if (this.previousView) {
        var pv = this.previousView;
        this.currentLevel = pv.level;
        this.currentStage = pv.stage;
        this.themeView = pv.themeView;
        this.currentTheme = null;
        this.themeData = null;
        this.themeTitle = null;
        this.previousView = null;

        if (pv.themeView === 'themes') {
          window.location.hash = '/' + this.currentLocale + '/' + this.currentLevel + '/' + this.currentStage;
        } else if (pv.themeView === 'theme-detail') {
          window.location.hash = '/' + this.currentLocale + '/' + this.currentLevel + '/' + this.currentStage + '/theme/' + (pv.theme || '');
        } else {
          window.location.hash = '/' + this.currentLocale + '/' + this.currentLevel + '/' + this.currentStage;
        }
        return;
      }

      // No previous view — go home
      this.currentLevel = null;
      this.currentStage = null;
      this.currentTheme = null;
      this.themeView = null;
      this.themeData = null;
      this.themeTitle = null;
      this.stageData = null;
      this.expandedLevel = null;
      this.expandedStage = null;
      window.location.hash = '/' + this.currentLocale;
    },

    // Go directly to the locale root (from error states)
    goHome() {
      this.errorState.themes = false;
      this.errorState.theme = false;
      this.errorState.stage = false;
      this.errorState.level = false;
      this.invalidThemeId = false;
      this.invalidThemeMessage = '';
      this.currentLevel = null;
      this.currentStage = null;
      this.currentTheme = null;
      this.themeView = null;
      this.themeData = null;
      this.themeTitle = null;
      this.stageData = null;
      this.previousView = null;
      this.expandedLevel = null;
      this.expandedStage = null;
      window.location.hash = '/' + this.currentLocale;
    },

    // Render the themes grid view
    renderThemes: function() {
      if (!this.stageThemes || this.stageThemes.length === 0) {
        return '<p class="opacity-70">No themes available for this stage.</p>';
      }
      
      var html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
      this.stageThemes.forEach(function(theme) {
        html += '<div class="card bg-base-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" ';
        html += '@click="loadTheme(\'' + theme.id + '\')">';
        html += '<div class="card-body p-4">';
        html += '<h4 class="font-bold text-lg">' + theme.title + '</h4>';
        if (theme.description) {
          html += '<p class="text-sm opacity-70">' + theme.description + '</p>';
        }
        html += '<div class="flex items-center gap-2 mt-2 text-xs opacity-60">';
        html += '<span>📖 ' + (theme.sections || []).length + ' sections</span>';
        html += '<span>⏱ ' + (theme.estimatedHours || '?') + 'h</span>';
        html += '</div>';
        html += '</div></div>';
      });
      html += '</div>';
      return html;
    },
    
    // Render theme pillar content (vocabulary, grammar, exercises)
    renderThemePillar: function() {
      if (!this.themeData) return;
      
      switch (this.currentPillar) {
        case 'vocabulary':
          this.pillarContent.vocabulary = this.themeData.vocabulary || [];
          break;
        case 'grammar':
          this.pillarContent.grammar = this.renderThemeGrammar();
          break;
        case 'verbs':
          this.pillarContent.verbs = this.renderThemeExercises();
          break;
        case 'pronunciation':
          this.pillarContent.pronunciation = this.renderThemePronunciation();
          break;
      }
    },
    
    // Render theme grammar content
    renderThemeGrammar: function() {
      if (!this.themeData.grammar || this.themeData.grammar.length === 0) {
        return '<div class="alert alert-neutral"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><div><h3 class="font-bold">No grammar lessons yet</h3><p class="text-sm">This grammar pillar is coming soon — check back later!</p></div></div>';
      }
      
      var html = '<div class="space-y-4">';
      var self = this;
      this.themeData.grammar.forEach(function(item, i) {
        html += '<div class="bg-base-200 rounded-lg p-5 border border-base-300">';
        html += '<div class="flex items-center gap-2 mb-3">';
        html += '<span class="badge badge-primary badge-sm">' + (i + 1) + '</span>';
        html += '<h4 class="font-bold text-lg">' + (item.title || 'Lesson') + '</h4>';
        html += '</div>';
        if (item.content) html += '<div class="prose prose-sm max-w-none mb-3"><p class="whitespace-pre-wrap">' + item.content + '</p></div>';
        if (item.examples) {
          html += '<div class="bg-base-100 rounded-lg p-3 mt-3">';
          html += '<h5 class="text-sm font-semibold opacity-70 mb-2 uppercase tracking-wide">Examples</h5>';
          html += '<ul class="space-y-1">';
          item.examples.forEach(function(e) { html += '<li class="text-sm flex items-start gap-2"><span class="text-primary mt-1">•</span> <span>' + self.escapeHtml(e) + '</span></li>'; });
          html += '</ul></div>';
        }
        if (item.note) {
          html += '<div class="alert alert-info mt-3 p-3 text-sm"><svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>' + self.escapeHtml(item.note) + '</span></div>';
        }
        html += '</div>';
      });
      html += '</div>';
      return html;
    },
    
    // Render theme exercises
    renderThemeExercises: function() {
      var flatEx = this.flattenThemeExercises();
      if (flatEx.length === 0) {
        return '<div class="alert alert-neutral"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><div><h3 class="font-bold">No exercises yet</h3><p class="text-sm">Practice activities are coming soon \u2014 check back later!</p></div></div>';
      }
      
      var html = '<div class="space-y-4">';
      var self = this;
      flatEx.forEach(function(exercise, i) {
        var normType = exercise.type || 'fill-in-blank';
        html += '<div class="bg-base-200 rounded-lg p-4">';
        html += '<h4 class="font-bold mb-2">Exercise ' + (i + 1) + '</h4>';
        
        if (exercise.question) {
          html += '<p class="mb-2">' + exercise.question + '</p>';
        }
        
        // Multiple-choice
        if (normType === 'multiple-choice' && exercise.options && Array.isArray(exercise.options)) {
          html += '<div class="grid grid-cols-1 gap-2 mt-2">';
          exercise.options.forEach(function(opt, oi) {
            html += '<button class="btn btn-outline w-full justify-start text-left" onclick="window._exerciseSelect(' + i + ',' + oi + ')">';
            html += '<span class="font-mono font-bold w-6">' + String.fromCharCode(65 + oi) + '.</span>';
            html += '<span>' + self.escapeHtml(opt) + '</span>';
            html += '</button>';
          });
          html += '</div>';
        }
        // Fill-in-blank
        else if (normType === 'fill-in-blank' && exercise.correct) {
          html += '<div class="flex gap-2 mt-2">';
          html += '<input type="text" class="input input-bordered flex-1" data-exercise-fill="' + i + '" placeholder="Type your answer..." />';
          html += '<button class="btn btn-primary" onclick="window.app._exerciseSubmitFillIn(' + i + ')">Submit</button>';
          html += '</div>';
        }
        // Matching exercise
        else if (normType === 'matching' && exercise.pairs && Array.isArray(exercise.pairs)) {
          html += '<div class="grid grid-cols-2 gap-4 mt-2">';
          html += '<div class="space-y-2"><strong>Match:</strong>';
          exercise.pairs.forEach(function(pair, pi) {
            html += '<div class="bg-base-100 p-2 rounded">' + self.escapeHtml(pair.target) + '</div>';
          });
          html += '</div>';
          html += '<div class="space-y-2"><strong>Answers:</strong>';
          var shuffledPairs = exercise.pairs.slice().sort(function() { return Math.random() - 0.5; });
          shuffledPairs.forEach(function(pair, pi) {
            html += '<div class="bg-base-100 p-2 rounded text-success">' + self.escapeHtml(pair.source) + '</div>';
          });
          html += '</div></div>';
        }
        // Conjugation matrix
        else if (normType === 'conjugation-matrix' && exercise.tenses) {
          html += '<div class="mt-2 text-sm opacity-70">Practice conjugating <strong>' + (exercise.verb || 'the verb') + '</strong></div>';
          if (exercise.verb && self.stageData && self.stageData.verbs) {
            var verbObj = self.stageData.verbs.find(function(v) {
              return v.infinitive.toLowerCase() === exercise.verb.toLowerCase();
            });
            if (verbObj) {
              html += '<div class="overflow-x-auto mt-2"><table class="table table-xs">';
              html += '<thead><tr><th></th>';
              exercise.tenses.forEach(function(t) { html += '<th>' + t + '</th>'; });
              html += '</tr></thead><tbody>';
              var pronouns = ['yo', 't\u00fa', '\u00e9l', 'nosotros', 'vosotros', 'ellos'];
              pronouns.forEach(function(p) {
                html += '<tr><td class="font-medium">' + p + '</td>';
                exercise.tenses.forEach(function(t) {
                  var forms = verbObj.conjugations[t];
                  html += '<td>' + (forms && forms[p] ? forms[p] : '\u2014') + '</td>';
                });
                html += '</tr>';
              });
              html += '</tbody></table></div>';
            }
          }
        }
        // Fallback: static display for unsupported types
        else {
          html += '<div class="mt-2 p-2 bg-base-300 rounded text-sm">';
          html += '<p><strong>Answer:</strong> ' + (exercise.correct || '\u2014') + '</p>';
          if (exercise.options && Array.isArray(exercise.options)) {
            html += '<p><strong>Options:</strong></p><ul class="list-disc ml-4">';
            exercise.options.forEach(function(opt) { html += '<li>' + self.escapeHtml(opt) + '</li>'; });
            html += '</ul>';
          }
          html += '</div>';
        }
        
        // Show explanation
        if (exercise.explanation) {
          html += '<div class="mt-2 text-sm opacity-70">' + self.escapeHtml(exercise.explanation) + '</div>';
        }
        
        html += '</div>';
      });
      html += '</div>';
      return html;
    },

    // Render theme pronunciation content
    renderThemePronunciation: function() {
      if (!this.themeData.pronunciation || this.themeData.pronunciation.length === 0) {
        return '<div class="alert alert-neutral"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><div><h3 class="font-bold">No pronunciation content yet</h3><p class="text-sm">Pronunciation guides are coming soon \u2014 check back later!</p></div></div>';
      }

      var html = '<div class="space-y-4">';
      var self = this;
      this.themeData.pronunciation.forEach(function(item, i) {
        html += '<div class="bg-base-200 rounded-lg p-5 border border-base-300">';
        html += '<div class="flex items-center gap-2 mb-3">';
        html += '<span class="badge badge-secondary badge-sm">🔊 ' + (i + 1) + '</span>';
        html += '<h4 class="font-bold text-lg">' + (item.title || 'Pronunciation') + '</h4>';
        html += '</div>';
        if (item.content) html += '<div class="prose prose-sm max-w-none mb-3"><p class="whitespace-pre-wrap">' + item.content + '</p></div>';
        if (item.examples && item.examples.length > 0) {
          html += '<div class="bg-base-100 rounded-lg p-3 mt-3">';
          html += '<h5 class="text-sm font-semibold opacity-70 mb-2 uppercase tracking-wide">Practice</h5>';
          html += '<div class="grid grid-cols-1 md:grid-cols-2 gap-2">';
          item.examples.forEach(function(e) {
            var target = e.target || e;
            var source = e.source || '';
            if (typeof target === 'string' && typeof source === 'string') {
              html += '<div class="bg-base-200 rounded p-2">';
              html += '<div class="font-bold">' + self.escapeHtml(target) + '</div>';
              html += '<div class="text-sm opacity-70">' + self.escapeHtml(source) + '</div>';
              html += '</div>';
            } else {
              html += '<div class="bg-base-200 rounded p-2 text-sm">' + self.escapeHtml(target) + '</div>';
            }
          });
          html += '</div></div>';
        }
        html += '</div>';
      });
      html += '</div>';
      return html;
    },


    // ═══════════════════════=════════════════════
    // ─── Rendering ───
    // ═══════════════════════════════════════════
    
    // Getters for stage display info
    
    // Returns the stage title for display in the header
    get stageTitle() {
      if (!this.stageData) return 'Loading...';
      return this.stageData.title || 'Stage ' + this.currentStage;
    },

    // Returns the stage description for display under the title
    get stageDescription() {
      if (!this.stageData) return '';
      return this.stageData.description || '';
    },

    // Returns true if at least one pillar has content or theme exercises exist
    get canStartQuiz() {
      if (!this.stageData && !this.themeData) return false;
      // Check theme exercises first (when in theme-detail view)
      if (this.themeView === 'theme-detail' && this.themeData) {
        var selectedPillars = this.quizPillars.length > 0 ? this.quizPillars : ['grammar', 'vocabulary', 'verbs', 'pronunciation'];
        if (selectedPillars.includes('vocabulary') && this.themeData.vocabulary && this.themeData.vocabulary.length > 0) return true;
        if (selectedPillars.includes('grammar') && this.themeData.grammar && this.themeData.grammar.length > 0) return true;
        var flatEx = this.flattenThemeExercises();
        if (flatEx.length > 0) {
          // Check if any exercises match selected pillars
          for (var i = 0; i < flatEx.length; i++) {
            var ep = flatEx[i].pillar || this.mapExerciseTypeToPillar(flatEx[i].type);
            if (selectedPillars.includes(ep)) return true;
          }
        }
        return false;
      }
      // Fall back to stage-level pillar content
      if (!this.stageData) return false;
      var pillars = ['grammar', 'vocabulary', 'verbs', 'pronunciation'];
      return pillars.some(function(p) {
        if (this.stageData[p] && this.stageData[p].length > 0) return true;
      }.bind(this));
    },

    // Cancel an active quiz and return to the theme/stage view
    cancelQuiz: function() {
      if (confirm('Cancel the quiz? Your progress will be lost.')) {
        this.resetQuizView();
      }
    },

    selectAllPillars: function() {
      this.quizPillars = ['grammar', 'vocabulary', 'verbs', 'pronunciation'];
    },

    deselectAllPillars: function() {
      this.quizPillars = [];
    },

    // Getter for vocabulary card data (for template rendering)
    get vocabularyCards() {
      if (!this.stageData || !this.stageData.vocabulary) return [];
      return this.stageData.vocabulary;
    },

    // Dispatch rendering to the appropriate pillar-specific renderer
    renderPillar: function() {
      if (!this.stageData) return;

      switch (this.currentPillar) {
        case 'grammar':
          this.pillarContent.grammar = this.renderGrammar();
          break;
        case 'vocabulary':
          this.pillarContent.vocabulary = this.stageData.vocabulary || [];
          break;
        case 'verbs':
          this.pillarContent.verbs = this.renderVerbs();
          break;
        case 'pronunciation':
          this.pillarContent.pronunciation = this.renderPronunciation();
          break;
      }
    },

    // Render the Grammar pillar: loops over grammar items, building HTML with
    // title, content, optional tables, examples, and aid notes
    renderGrammar: function() {
      if (!this.stageData.grammar || this.stageData.grammar.length === 0) {
        return '<div class="alert alert-neutral"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><div><h3 class="font-bold">No grammar content yet</h3><p class="text-sm">This grammar pillar is coming soon — check back later!</p></div></div>';
      }

      var html = '<div class="space-y-4">';
      var self = this;
      this.stageData.grammar.forEach(function(item, i) {
        html += '<div class="bg-base-200 rounded-lg p-4">';
        html += '<h4 class="font-bold mb-2">' + (i + 1) + '. ' + item.title + '</h4>';
        if (item.content) html += '<p class="mb-2 whitespace-pre-wrap">' + item.content + '</p>';
        if (item.table) html += self.renderTable(item.table);
        if (item.examples) {
          html += '<div class="mt-2"><strong>Examples:</strong><ul class="list-disc ml-4">';
          item.examples.forEach(function(e) { html += '<li>' + e + '</li>'; });
          html += '</ul></div>';
        }
        if (item.aid_note) {
          html += '<div class="alert alert-info mt-2">';
          html += '<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
          html += '<span>' + item.aid_note + '</span>';
          html += '</div>';
        }
        html += '</div>';
      });
      html += '</div>';
      return html;
    },

    // Render a simple HTML table from headers + rows array (used by grammar items)
    renderTable: function(table) {
      if (!table || !table.headers || !table.rows) return '';

      var html = '<div class="overflow-x-auto"><table class="table table-sm"><thead>';
      html += '<tr>';
      table.headers.forEach(function(h) { html += '<th>' + h + '</th>'; });
      html += '</tr></thead><tbody>';
      table.rows.forEach(function(row) {
        html += '<tr>';
        row.forEach(function(cell) { html += '<td>' + cell + '</td>'; });
        html += '</tr>';
      });
      html += '</tbody></table></div>';
      return html;
    },

    // Render the Verbs pillar: loops over verb objects, showing infinitive +
    // translation and a full conjugation table for each
    renderVerbs: function() {
      if (!this.stageData.verbs || this.stageData.verbs.length === 0) {
        return '<div class="alert alert-neutral"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><div><h3 class="font-bold">No verb drills yet</h3><p class="text-sm">Verb conjugation practice is coming soon — check back later!</p></div></div>';
      }

      var html = '<div class="space-y-6">';
      var self = this;
      this.stageData.verbs.forEach(function(verb) {
        html += '<div class="bg-base-200 rounded-lg p-4">';
        html += '<h4 class="font-bold text-lg mb-2">' + verb.infinitive + ' &mdash; ' + verb.translation + '</h4>';
        html += self.renderConjugation(verb);
        html += '</div>';
      });
      html += '</div>';
      return html;
    },

        // Render a conjugation table for a single verb: pronouns × tenses matrix
    renderConjugation: function(verb) {
      if (!verb.conjugations) return '<p>No conjugations available.</p>';

      var html = '<div class="overflow-x-auto"><table class="table table-sm"><thead>';
      html += '<tr><th></th>';
      Object.keys(verb.conjugations).forEach(function(tense) {
        html += '<th>' + tense + '</th>';
      });
      html += '</tr></thead><tbody>';

      var pronouns = ['yo', 'tu', 'el/ella/usted', 'nosotros', 'vosotros', 'ellos/ellas/ustedes'];
      pronouns.forEach(function(pronoun) {
        html += '<tr><td class="font-medium">' + pronoun + '</td>';
        Object.keys(verb.conjugations).forEach(function(tense) {
          var forms = verb.conjugations[tense];
          html += '<td>' + (forms[pronoun] || '\u2014') + '</td>';
        });
        html += '</tr>';
      });

      html += '</tbody></table></div>';
      return html;
    },

        // Render the Pronunciation pillar: loops over pronunciation items with
    // title, content, and paired examples (Spanish ↔ English)
    renderPronunciation: function() {
      if (!this.stageData.pronunciation || this.stageData.pronunciation.length === 0) {
        return '<div class="alert alert-neutral"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><div><h3 class="font-bold">No pronunciation content yet</h3><p class="text-sm">Pronunciation guides are coming soon — check back later!</p></div></div>';
      }

      var html = '<div class="space-y-4">';
      var self = this;
      this.stageData.pronunciation.forEach(function(item) {
        html += '<div class="bg-base-200 rounded-lg p-4">';
        html += '<h4 class="font-bold mb-2">' + item.title + '</h4>';
        if (item.content) html += '<p class="mb-2 whitespace-pre-wrap">' + item.content + '</p>';
        if (item.examples) {
          html += '<div class="grid grid-cols-2 gap-2 mt-2">';
          item.examples.forEach(function(e) {
            html += '<div class="bg-base-100 rounded p-2">';
            html += '<div class="font-bold">' + e.target + '</div>';
            html += '<div class="text-sm opacity-70">' + e.source + '</div>';
            html += '</div>';
          });
          html += '</div>';
        }
        html += '</div>';
      });
      html += '</div>';
      return html;
    },

    // ═══════════════════════════════════════════
    // ─── Quiz ───
    // ═══════════════════════════════════════════
    
    // Normalize exercise types from various formats into quiz-compatible types.
    // Theme exercises use inconsistent type names; this maps them to standard types.
    normalizeExerciseType: function(item) {
      if (item.type) {
        var t = item.type.toLowerCase().replace(/_/g, '-');
        // Direct matches
        if (['multiple-choice', 'fill-in-blank', 'conjugation', 'matching', 'conjugation-matrix'].indexOf(t) !== -1) {
          return t;
        }
        // Map common aliases
        if (t === 'fill_in_the_blank' || t === 'sentence_completion') return 'fill-in-blank';
        if (t === 'exercise' || t === 'grammar_application') {
          return (item.options && Array.isArray(item.options)) ? 'multiple-choice' : 'fill-in-blank';
        }
        if (t === 'translation') return 'fill-in-blank';
        if (t === 'vocabulary_matching') return 'matching';
      }
      // Fallback: infer from structure
      if (item.options && Array.isArray(item.options)) return 'multiple-choice';
      if (item.pairs && Array.isArray(item.pairs)) return 'matching';
      if (item.tenses && Array.isArray(item.tenses)) return 'conjugation-matrix';
      return item.type || 'fill-in-blank';
    },

    // Escape HTML special characters to prevent XSS in rendered content
    escapeHtml: function(text) {
      return String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    },

    // Flatten theme exercises from dict {type: [...]} to array [{...}, ...]
    // with a normalized type field on each item.
    flattenThemeExercises: function() {
      if (!this.themeData || !this.themeData.exercises) return [];
      var arr = [];
      var self = this;
      // Handle dict-based exercises (theme JSON structure)
      if (typeof this.themeData.exercises === 'object' && !Array.isArray(this.themeData.exercises)) {
        for (var groupKey in this.themeData.exercises) {
          if (Array.isArray(this.themeData.exercises[groupKey])) {
            this.themeData.exercises[groupKey].forEach(function(item) {
              arr.push(Object.assign({}, item, { type: groupKey }));
            });
          }
        }
      } else if (Array.isArray(this.themeData.exercises)) {
        arr = this.themeData.exercises.slice();
      }
      // Normalize types
      return arr.map(function(item) {
        item.type = self.normalizeExerciseType(item);
        return item;
      });
    },

    // Start a quiz: collect exercises from selected pillars, shuffle them,
    // initialize question-specific state for matching/matrix exercises,
    // and begin the quiz loop.
    // When in theme-detail view, collects ONLY theme-level exercises
    // (respects pillar selection). When not in theme-detail view, collects
    // stage-level pillar content (also respects pillar selection).
    startQuiz: function() {
      // Must have at least stage data or theme data to start a quiz
      if (!this.stageData && !this.themeData) return;

      this.quizQuestions = [];
      var self = this;

      // Determine which pillars are selected (default to all if none selected)
      var selectedPillars = this.quizPillars.length > 0 ? this.quizPillars : ['grammar', 'vocabulary', 'verbs', 'pronunciation'];

      if (this.themeView === 'theme-detail' && this.themeData) {
        // THEME-DETAIL VIEW: Only use theme-level content, filtered by selected pillars

        // Include theme vocabulary as multiple-choice questions (only if 'vocabulary' pillar selected)
        if (selectedPillars.includes('vocabulary') && this.themeData.vocabulary && Array.isArray(this.themeData.vocabulary)) {
          var vocabItems = this.themeData.vocabulary;
          vocabItems.forEach(function(item, index) {
            var q = Object.assign({}, item, {
              pillar: 'vocabulary',
              index: index,
              type: 'multiple-choice'
            });
            if (!q.options || !Array.isArray(q.options)) {
              var targets = vocabItems
                .filter(function(v) { return v.target !== item.target; })
                .map(function(v) { return v.source; });
              targets = self.shuffleArray(targets).slice(0, 3);
              q.options = [item.source].concat(targets);
              q.options = self.shuffleArray(q.options);
              q.correct = q.options.indexOf(item.source);
              q.question = 'What does "' + item.target + '" mean?';
            }
            self.quizQuestions.push(q);
          });
        }

        // Include theme grammar items as quiz questions (only if 'grammar' pillar selected)
        if (selectedPillars.includes('grammar') && this.themeData.grammar && Array.isArray(this.themeData.grammar)) {
          this.themeData.grammar.forEach(function(item, index) {
            var q = Object.assign({}, item, {
              pillar: 'grammar',
              index: index,
              type: item.type || 'fill-in-blank'
            });
            self.quizQuestions.push(q);
          });
        }

        // Include theme exercises (only those matching selected pillars)
        var flatEx = this.flattenThemeExercises();
        flatEx.forEach(function(item, index) {
          // Map exercise type to pillar for filtering
          var exercisePillar = item.pillar || self.mapExerciseTypeToPillar(item.type);
          if (!selectedPillars.includes(exercisePillar)) return;

          var q = Object.assign({}, item, {
            pillar: exercisePillar,
            index: index,
            type: item.type
          });

          // For matching exercises, store pairs and shuffled right items on the question object
          if (q.type === 'matching' && item.pairs && Array.isArray(item.pairs)) {
            q.matchPairs = item.pairs;
            q.matchRightItems = item.pairs.map(function(p) { return p.source; });
            q.matchRightOriginalIndex = item.pairs.map(function(_, i) { return i; });
            for (var s = q.matchRightOriginalIndex.length - 1; s > 0; s--) {
              var r = Math.floor(Math.random() * (s + 1));
              var tmp = q.matchRightOriginalIndex[s];
              q.matchRightOriginalIndex[s] = q.matchRightOriginalIndex[r];
              q.matchRightOriginalIndex[r] = tmp;
            }
            var originalPairs = item.pairs;
            q.matchRightItems = q.matchRightOriginalIndex.map(function(origIdx) {
              return originalPairs[origIdx].source;
            });
            q._matchSelections = [];
            q._matchRightMatched = [];
            q._selectedLeft = null;
            q._selectedRight = null;
            q._userMatchAnswers = null;
            q._matchResults = null;
            q._matchAttempts = 0;
          }

          // For conjugation-matrix exercises, look up verb data from theme verbs
          if (q.type === 'conjugation-matrix' && item.verb) {
            var verbs = self.themeData.verbs || self.stageData && self.stageData.verbs;
            if (verbs) {
              var verbObj = verbs.find(function(v) {
                return v.infinitive.toLowerCase() === item.verb.toLowerCase();
              });
              if (verbObj) {
                q.verbData = verbObj;
              }
            }
            q._matrixAnswers = {};
            q._matrixCorrectAnswers = null;
            q._matrixResults = null;
            q._matrixCorrectCount = 0;
          }

          self.quizQuestions.push(q);
        });
      } else {
        // STAGE VIEW: Collect stage-level pillar content (respects pillar selection)

        selectedPillars.forEach(function(pillar) {
          var items = self.stageData[pillar];
          if (!items) return;
          items.forEach(function(item, index) {
            var q = Object.assign({}, item, { pillar: pillar, index: index });

            // For matching exercises, store pairs and shuffled right items on the question object
            if (item.type === 'matching' && item.pairs) {
              q.matchPairs = item.pairs;
              q.matchRightItems = item.pairs.map(function(p) { return p.source; });
              // Shuffle right items
              q.matchRightOriginalIndex = item.pairs.map(function(_, i) { return i; });
              for (var s = q.matchRightOriginalIndex.length - 1; s > 0; s--) {
                var r = Math.floor(Math.random() * (s + 1));
                var tmp = q.matchRightOriginalIndex[s];
                q.matchRightOriginalIndex[s] = q.matchRightOriginalIndex[r];
                q.matchRightOriginalIndex[r] = tmp;
              }
              var originalPairs = item.pairs;
              q.matchRightItems = q.matchRightOriginalIndex.map(function(origIdx) {
                return originalPairs[origIdx].source;
              });
              // Reset matching state for this question
              q._matchSelections = [];
              q._matchRightMatched = [];
              q._selectedLeft = null;
              q._selectedRight = null;
              q._userMatchAnswers = null;
              q._matchResults = null;
              q._matchAttempts = 0;
            }

            // For conjugation-matrix exercises, look up verb data
            if (item.type === 'conjugation-matrix' && item.verb && self.stageData && self.stageData.verbs) {
              var verbObj = self.stageData.verbs.find(function(v) {
                return v.infinitive.toLowerCase() === item.verb.toLowerCase();
              });
              if (verbObj) {
                q.verbData = verbObj;
              }
              // Initialize matrix state on question
              q._matrixAnswers = {};
              q._matrixCorrectAnswers = null;
              q._matrixResults = null;
              q._matrixCorrectCount = 0;
            }

            self.quizQuestions.push(q);
          });
        });
      }

      if (this.quizQuestions.length === 0) {
        alert('No exercises available for the selected pillars yet.');
        return;
      }

      this.quizQuestions = this.shuffleArray(this.quizQuestions);

      this.quizIndex = 0;
      this.quizScore = 0;
      this.quizActive = true;
      this.quizFinished = false;
      this.quizSubmitted = false;
      this.quizAnswered = false;
      this.quizFeedback = null;
      this.selectedOption = null;
      this.fillInAnswer = '';
      this.conjugationAnswer = '';
      this.previousAnswers = [];
      this.currentQuestionAnswer = null;
      this.currentQuestionCorrect = null;
      this.pillarScoreMap = {};
    },

    // Map exercise type to a pillar for filtering in theme-detail view
    mapExerciseTypeToPillar: function(type) {
      var typeToPillar = {
        'multiple-choice': 'vocabulary',
        'fill-in-blank': 'grammar',
        'conjugation': 'verbs',
        'conjugation-matrix': 'verbs',
        'translation': 'vocabulary',
        'matching': 'vocabulary',
        'pronunciation': 'pronunciation',
        'drag-drop': 'vocabulary'
      };
      return typeToPillar[type] || 'vocabulary';
    },

    shuffleArray: function(array) {
      var shuffled = array.slice();
      for (var i = shuffled.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
      }
      return shuffled;
    },
    // ═══════════════════════════════════════════
    // ─── Quiz: Submit Answer ───
    // ═══════════════════════════════════════════
    
    // Submit the current answer, evaluate correctness, and advance to the next question.
    // Called after the user answers a multiple-choice, fill-in-blank, or conjugation
    // exercise. Tracks the answer, computes score, shows feedback, and advances.
    submitAnswer: function(answer) {
      if (this.quizAnswered) return;

      var question = this.quizQuestions[this.quizIndex];
      var correct = this.checkAnswer(answer, question);

      // Track per-question answer for summary
      this.previousAnswers[this.quizIndex] = {
        question: question.question || '',
        userAnswer: this.formatAnswerForSummary(answer, question),
        correct: correct,
        correctAnswer: this.formatCorrectAnswerForSummary(question),
        pillar: question.pillar
      };

      // Track current question's answer
      this.currentQuestionAnswer = this.formatAnswerForSummary(answer, question);
      this.currentQuestionCorrect = correct;

      // Track per-pillar score
      if (question && question.pillar) {
        if (!this.pillarScoreMap[question.pillar]) {
          this.pillarScoreMap[question.pillar] = 0;
        }
        if (correct) this.pillarScoreMap[question.pillar]++;
      }

      var oldXP = this.xp;

      if (correct) {
        this.quizScore++;
        var xpEarned = Storage.calculateXP(1);
        Storage.addXP(xpEarned);
        this.xp = Storage.getXP();
        // Animate XP counter
        this.animateXP(oldXP, this.xp);
        this.quizFeedback = { correct: true, explanation: question.explanation || 'Correct!' };
        // Add pop animation to feedback
        setTimeout(() => {
          var fbEl = document.querySelector('[x-show="quizFeedback"]');
          if (fbEl) {
            fbEl.classList.add('feedback-pop');
            setTimeout(() => fbEl.classList.remove('feedback-pop'), 300);
          }
        }, 50);
      } else {
        this.quizFeedback = {
          correct: false,
          explanation: question.explanation || ('The correct answer is: ' + this.getCorrectAnswer(question))
        };
        // Shake animation for wrong answer
        setTimeout(() => {
          var qEl = document.querySelector('[x-text*="quizQuestions[quizIndex]"]');
          if (qEl) {
            qEl.classList.add('feedback-shake');
            setTimeout(() => qEl.classList.remove('feedback-shake'), 400);
          }
        }, 50);
      }

      this.quizAnswered = true;
    },

    formatAnswerForSummary: function(answer, question) {
      if (question && question.type === 'multiple-choice') {
        if (question.options && question.options[answer]) return question.options[answer];
        return 'Option ' + (answer + 1);
      }
      return String(answer);
    },

    formatCorrectAnswerForSummary: function(question) {
      if (question && question.type === 'multiple-choice') {
        if (question.options && question.options[question.correct]) return question.options[question.correct];
        return '—';
      }
      return question.correct || '—';
    },

    checkAnswer: function(userAnswer, question) {
      var correctAnswer = question.correct;

      switch (question.type) {
        case 'multiple-choice':
          return userAnswer === correctAnswer;
        case 'fill-in-blank':
        case 'conjugation':
          return String(userAnswer).trim().toLowerCase() === String(correctAnswer).trim().toLowerCase();
        default:
          return userAnswer === correctAnswer;
      }
    },

    getCorrectAnswer: function(question) {
      switch (question.type) {
        case 'multiple-choice':
          if (question.options && question.options[question.correct]) return question.options[question.correct];
          return '\u2014';
        default:
          return question.correct || '\u2014';
      }
    },

    nextQuestion: function() {
      // Save current question's answer state before moving on
      if (!this.quizAnswered) {
        // If user clicks Next without answering, record unanswered
        this.previousAnswers[this.quizIndex] = {
          question: this.quizQuestions[this.quizIndex].question || '',
          userAnswer: '(skipped)',
          correct: false,
          correctAnswer: this.formatCorrectAnswerForSummary(this.quizQuestions[this.quizIndex]),
          pillar: this.quizQuestions[this.quizIndex].pillar
        };
      }

      this.quizIndex++;
      this.quizAnswered = false;
      this.quizFeedback = null;
      this.fillInAnswer = '';
      this.conjugationAnswer = '';
      this.selectedOption = null;

      // Load per-question matching/matrix data for the new question
      var q = this.quizQuestions[this.quizIndex];
      if (q) {
        if (q.matchPairs) {
          this.matchPairs = q.matchPairs;
          this.matchRightItems = q.matchRightItems;
          this.matchRightOriginalIndex = q.matchRightOriginalIndex;
          this.matchSelections = q._matchSelections || [];
          this.matchRightMatched = q._matchRightMatched || [];
          this.selectedLeft = q._selectedLeft || null;
          this.selectedRight = q._selectedRight || null;
          this.userMatchAnswers = q._userMatchAnswers || null;
          this.matchResults = q._matchResults || null;
          this.matchAttempts = q._matchAttempts || 0;
        }
        if (q.verbData) {
          this.matrixAnswers = q._matrixAnswers || {};
          this.matrixCorrectAnswers = q._matrixCorrectAnswers || null;
          this.matrixResults = q._matrixResults || null;
          this.matrixCorrectCount = q._matrixCorrectCount || 0;
        }
      }

      this.currentQuestionAnswer = null;
      this.currentQuestionCorrect = null;
    },

    prevQuestion: function() {
      if (this.quizIndex <= 0) return;
      this.quizIndex--;
      this.quizAnswered = false;
      this.quizFeedback = null;
      this.fillInAnswer = '';
      this.conjugationAnswer = '';
      this.selectedOption = null;

      // Load per-question matching/matrix data for the previous question
      var q = this.quizQuestions[this.quizIndex];
      if (q) {
        if (q.matchPairs) {
          this.matchPairs = q.matchPairs;
          this.matchRightItems = q.matchRightItems;
          this.matchRightOriginalIndex = q.matchRightOriginalIndex;
          this.matchSelections = q._matchSelections || [];
          this.matchRightMatched = q._matchRightMatched || [];
          this.selectedLeft = q._selectedLeft || null;
          this.selectedRight = q._selectedRight || null;
          this.userMatchAnswers = q._userMatchAnswers || null;
          this.matchResults = q._matchResults || null;
          this.matchAttempts = q._matchAttempts || 0;
        }
        if (q.verbData) {
          this.matrixAnswers = q._matrixAnswers || {};
          this.matrixCorrectAnswers = q._matrixCorrectAnswers || null;
          this.matrixResults = q._matrixResults || null;
          this.matrixCorrectCount = q._matrixCorrectCount || 0;
        }
      }

      this.currentQuestionAnswer = null;
      this.currentQuestionCorrect = null;
    },

    // Submit quiz — show summary of all answers
    submitQuiz: function() {
      // First answer the last question if not yet answered
      if (!this.quizAnswered && this.quizIndex < this.quizQuestions.length) {
        this.finalizeCurrentAnswer();
      }
      this.quizSubmitted = true;
    },

    // Helper: finalize the current unanswered question
    finalizeCurrentAnswer: function() {
      var question = this.quizQuestions[this.quizIndex];
      if (!question) return;

      var correct = false;
      var userAnswer = '(skipped)';

      if (question.type === 'multiple-choice' && this.selectedOption !== null) {
        correct = this.checkAnswer(this.selectedOption, question);
        userAnswer = this.formatAnswerForSummary(this.selectedOption, question);
      } else if (question.type === 'fill-in-blank' && this.fillInAnswer.trim() !== '') {
        correct = this.checkAnswer(this.fillInAnswer, question);
        userAnswer = this.formatAnswerForSummary(this.fillInAnswer, question);
      } else if (question.type === 'conjugation' && this.conjugationAnswer.trim() !== '') {
        correct = this.checkAnswer(this.conjugationAnswer, question);
        userAnswer = this.formatAnswerForSummary(this.conjugationAnswer, question);
      } else if (question.type === 'matching') {
        // Matching was already scored in submitMatching
        correct = this.matchResults ? this.matchResults.filter(function(r) { return r; }).length === this.matchPairs.length : false;
        userAnswer = this.formatAnswerForSummary('matching', question);
      } else if (question.type === 'conjugation-matrix') {
        // Matrix was already scored in submitConjugationMatrix
        correct = this.matrixCorrectCount === this.matrixTotalCells;
        userAnswer = this.formatAnswerForSummary(this.matrixCorrectCount + '/' + this.matrixTotalCells, question);
      }

      // Track this question
      this.previousAnswers[this.quizIndex] = {
        question: question.question || '',
        userAnswer: userAnswer,
        correct: correct,
        correctAnswer: this.formatCorrectAnswerForSummary(question),
        pillar: question.pillar
      };

      if (correct) this.quizScore++;
      this.quizAnswered = true;
    },

    // Finalize the quiz — calculate XP, save progress, show results
    finalSubmitQuiz: function() {
      this.quizSubmitted = false;
      this.finishQuiz();
    },

    // Cancel submit — go back to answering
    cancelSubmit: function() {
      this.quizSubmitted = false;
    },

    // ─── Quiz Handlers: Multiple Choice ───

    selectOption: function(index) {
      if (this.quizAnswered) return;
      this.selectedOption = index;
    },

    submitMultipleChoice: function() {
      if (!this.quizAnswered && this.selectedOption !== null) {
        this.submitAnswer(this.selectedOption);
      }
    },

    // ─── Quiz Handlers: Fill-in-Blank ───

    submitFillIn: function() {
      if (!this.quizAnswered && this.fillInAnswer.trim() !== '') {
        this.submitAnswer(this.fillInAnswer);
      }
    },

    // ─── Quiz Handlers: Conjugation (single) ───

    submitConjugation: function() {
      if (!this.quizAnswered && this.conjugationAnswer.trim() !== '') {
        this.submitAnswer(this.conjugationAnswer);
      }
    },

    // ─── Quiz Handlers: Matching / Drag-and-Drop ───

    selectMatchLeft: function(index) {
      if (this.quizAnswered) return;
      if (this.matchSelections[index] !== undefined) return; // already matched
      this.selectedLeft = index;
      this.selectedRight = null;
    },

    selectMatchRight: function(index) {
      if (this.quizAnswered) return;
      if (this.selectedLeft === null) return; // must select left first
      this.matchAttempts++;

      var pairIndex = this.selectedLeft;
      var rightIdx = index;

      // Check if this right item is the correct match
      var correct = this.matchRightOriginalIndex[rightIdx] === pairIndex;

      this.matchSelections[pairIndex] = {
        leftIdx: pairIndex,
        rightIdx: rightIdx,
        correct: correct
      };
      this.matchRightMatched[rightIdx] = correct;
      this.matchRightItems[rightIdx] = this.matchRightItems[rightIdx]; // trigger re-render
      this.selectedLeft = null;
      this.selectedRight = null;

      // Track user answers
      if (!this.userMatchAnswers) {
        this.userMatchAnswers = [];
      }
      this.userMatchAnswers[pairIndex] = this.matchRightItems[rightIdx];

      // Save state back to question object
      var q = this.quizQuestions[this.quizIndex];
      if (q) {
        q._matchSelections = this.matchSelections;
        q._matchRightMatched = this.matchRightMatched;
        q._selectedLeft = this.selectedLeft;
        q._selectedRight = this.selectedRight;
        q._userMatchAnswers = this.userMatchAnswers;
        q._matchAttempts = this.matchAttempts;
      }
    },

    submitMatching: function() {
      if (this.quizAnswered) return;

      // Count matched pairs
      var matchedCount = this.matchSelections.filter(function(s) { return s !== undefined; }).length;
      if (matchedCount < this.matchPairs.length) {
        alert('Please match all pairs before submitting.');
        return;
      }

      // Compute results
      this.matchResults = this.matchPairs.map(function(_, i) {
        return this.matchSelections[i] && this.matchSelections[i].correct;
      }.bind(this));

      // Save results to question object
      var q = this.quizQuestions[this.quizIndex];
      if (q) {
        q._matchResults = this.matchResults;
      }

      // Score: each correct pair = 1 point
      var correctCount = this.matchResults.filter(function(r) { return r; }).length;
      this.quizScore = correctCount;
      var xpEarned = Storage.calculateXP(correctCount);
      var oldXP = this.xp;
      Storage.addXP(xpEarned);
      this.xp = Storage.getXP();
      this.animateXP(oldXP, this.xp);

      // Track per-pillar score (matching is under its pillar)
      var question = this.quizQuestions[this.quizIndex];
      if (question && question.pillar) {
        if (!this.pillarScoreMap[question.pillar]) {
          this.pillarScoreMap[question.pillar] = 0;
        }
        this.pillarScoreMap[question.pillar] = correctCount;
      }

      if (correctCount === this.matchPairs.length) {
        this.quizFeedback = { correct: true, explanation: 'Perfect! All pairs matched correctly.' };
      } else if (correctCount > 0) {
        this.quizFeedback = { correct: false, explanation: correctCount + '/' + this.matchPairs.length + ' pairs matched correctly.' };
      } else {
        this.quizFeedback = { correct: false, explanation: 'None matched correctly. Check the results below.' };
      }

      this.quizAnswered = true;
    },

    // ─── Quiz Handlers: Conjugation Matrix ───

    submitConjugationMatrix: function() {
      if (this.quizAnswered) return;

      var question = this.quizQuestions[this.quizIndex];
      if (!question || !question.verbData) return;

      var tenses = question.tenses || [];
      var verbData = question.verbData;

      // Build correct answers map: "pIdx-tIdx" → correct form
      this.matrixCorrectAnswers = {};
      tenses.forEach(function(tense, tIdx) {
        var forms = verbData.conjugations[tense];
        if (!forms) return;
        this.matrixPronouns.forEach(function(pronoun, pIdx) {
          var key = pIdx + '-' + tIdx;
          this.matrixCorrectAnswers[key] = forms[pronoun] || '\u2014';
        }.bind(this));
      }.bind(this));

      // Evaluate each cell
      this.matrixResults = {};
      var correctCount = 0;
      tenses.forEach(function(tense, tIdx) {
        var forms = verbData.conjugations[tense];
        if (!forms) return;
        this.matrixPronouns.forEach(function(pronoun, pIdx) {
          var key = pIdx + '-' + tIdx;
          var userAnswer = (this.matrixAnswers[key] || '').trim().toLowerCase();
          var correctAnswer = (forms[pronoun] || '').trim().toLowerCase();
          var isCorrect = userAnswer === correctAnswer && userAnswer !== '';
          this.matrixResults[key] = isCorrect;
          if (isCorrect) correctCount++;
        }.bind(this));
      }.bind(this));

      this.matrixCorrectCount = correctCount;
      var totalCells = this.matrixTotalCells;
      this.quizScore = correctCount;
      var xpEarned = Storage.calculateXP(correctCount); // 5→10 base, streak bonus applies on top
      var oldXP = this.xp;
      Storage.addXP(xpEarned);
      this.xp = Storage.getXP();
      this.animateXP(oldXP, this.xp);

      // Save results to question object
      var q = this.quizQuestions[this.quizIndex];
      if (q) {
        q._matrixAnswers = this.matrixAnswers;
        q._matrixCorrectAnswers = this.matrixCorrectAnswers;
        q._matrixResults = this.matrixResults;
        q._matrixCorrectCount = this.matrixCorrectCount;
      }

      // Track per-pillar score
      var question = this.quizQuestions[this.quizIndex];
      if (question && question.pillar) {
        if (!this.pillarScoreMap[question.pillar]) {
          this.pillarScoreMap[question.pillar] = 0;
        }
        this.pillarScoreMap[question.pillar] = correctCount;
      }

      if (correctCount === totalCells) {
        this.quizFeedback = { correct: true, explanation: 'Perfect! All cells correct.' };
      } else if (correctCount > totalCells * 0.75) {
        this.quizFeedback = { correct: false, explanation: correctCount + '/' + totalCells + ' correct — great effort!' };
      } else if (correctCount > totalCells * 0.5) {
        this.quizFeedback = { correct: false, explanation: 'Halfway there. ' + correctCount + '/' + totalCells + ' correct.' };
      } else {
        this.quizFeedback = { correct: false, explanation: 'Keep practicing conjugations. ' + correctCount + '/' + totalCells + ' correct.' };
      }

      this.quizAnswered = true;
    },

    resetQuizView: function() {
      this.quizActive = false;
      this.quizFinished = false;
      this.quizSubmitted = false;
      this.quizQuestions = [];
      this.quizIndex = 0;
      this.quizScore = 0;
      this.quizAnswered = false;
      this.quizFeedback = null;
      this.selectedOption = null;
      this.fillInAnswer = '';
      this.conjugationAnswer = '';
      this.matchPairs = [];
      this.matchRightItems = [];
      this.matchRightOriginalIndex = [];
      this.matchSelections = [];
      this.matchRightMatched = [];
      this.selectedLeft = null;
      this.selectedRight = null;
      this.userMatchAnswers = null;
      this.matchResults = null;
      this.matchAttempts = 0;
      this.matrixAnswers = {};
      this.matrixCorrectAnswers = null;
      this.matrixResults = null;
      this.matrixCorrectCount = 0;
      this.pillarScoreMap = null;
      this.quizPillarBreakdown = null;
      this.lastQuizResult = this.lastQuizResult; // keep attempt history
      this.previousAnswers = [];
      this.currentQuestionAnswer = null;
      this.currentQuestionCorrect = null;
      // Reset pillar to default so pillar tabs show correct active state
      this.currentPillar = 'grammar';
    },

    finishQuiz: function() {
      this.quizActive = false;
      this.quizFinished = true;

      // Build per-pillar breakdown from actual tracked scores
      var pillarBreakdown = [];
      var pillarNames = {
        grammar: { name: 'Grammar', emoji: '📖' },
        vocabulary: { name: 'Vocabulary', emoji: '🗣️' },
        verbs: { name: 'Verbs & Drills', emoji: '⚡' },
        pronunciation: { name: 'Pronunciation', emoji: '🔊' }
      };
      var pillarTotals = {};
      var self = this;

      // Count questions per pillar
      this.quizQuestions.forEach(function(q) {
        if (!pillarTotals[q.pillar]) pillarTotals[q.pillar] = 0;
        pillarTotals[q.pillar]++;
      });

      // Build breakdown with actual scores
      Object.keys(pillarTotals).forEach(function(pk) {
        pillarBreakdown.push({
          pillar: pk,
          name: pillarNames[pk] ? pillarNames[pk].name : pk,
          emoji: pillarNames[pk] ? pillarNames[pk].emoji : '',
          score: this.pillarScoreMap ? (this.pillarScoreMap[pk] || 0) : 0,
          total: pillarTotals[pk]
        });
      }.bind(this));

      this.quizPillarBreakdown = pillarBreakdown;

      // Save to progress storage
      if (this.currentStage) {
        var pillar = this.quizQuestions[0] ? this.quizQuestions[0].pillar : 'grammar';
        Storage.saveProgress(this.currentStage, pillar, this.quizScore, this.quizQuestions.length);
        // Bump the reactive version so the stage header progress re-evaluates
        // immediately (the read path is a pure localStorage lookup).
        this.progressVersion++;
      }

      Storage.recordActivity();

      // Track quiz attempt for retry comparison
      this.trackQuizAttempt(this.quizScore, this.quizQuestions.length);

      // Confetti for great performance
      var ratio = this.quizQuestions.length > 0 ? this.quizScore / this.quizQuestions.length : 0;
      if (ratio >= 0.8) {
        this.spawnConfetti(40);
      } else if (ratio >= 0.5) {
        this.spawnConfetti(15);
      }

      // Don't use alert — the results screen shows everything
      console.log('Quiz complete! Score: ' + this.quizScore + '/' + this.quizQuestions.length + ', XP: +' + (this.quizScore * 10 + Storage.getStreakBonus(this.quizScore)));
    },

    trackQuizAttempt: function(score, total) {
      var attempts = this.lastQuizResult || [];
      var now = new Date();
      var dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      attempts.push({ score: score, total: total, date: dateStr });
      // Keep only last 5 attempts
      if (attempts.length > 5) attempts = attempts.slice(-5);
      this.lastQuizResult = attempts;
    },

    retryQuiz: function() {
      // Keep the same pillar selections but reshuffle questions
      this.startQuiz();
    },

    // ─── Settings ───
    setTheme: function(theme) {
      this.theme = theme;
      document.documentElement.setAttribute('data-theme', theme);
      var s = Storage.getSettings();
      s.theme = theme;
      Storage.saveSettings(s);
    },

    saveSettings: function() {
      var s = Storage.getSettings();
      s.aidLanguage = this.aidLanguage;
      Storage.saveSettings(s);
    },

    resetProgress: function() {
      if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
        Storage.resetProgress();
        this.xp = 0;
        this.streak = 0;
        this.touchProgress();
        this.settingsOpen = false;
        alert('Progress has been reset.');
      }
    },

    exportProgress: function() {
      Storage.exportAll();
    },

    importProgress: function() {
      document.getElementById('importFile').click();
    },

    handleImport: function(event) {
      var file = event.target.files[0];
      if (!file) return;

      var reader = new FileReader();
      reader.onload = function(e) {
        var success = Storage.importAll(e.target.result);
        if (success) {
          alert('Progress imported successfully!');
          location.reload();
        } else {
          alert('Failed to import progress. Check the file format.');
        }
      };
      reader.readAsText(file);
    },

    // Hard reload: clears cache and forces fresh fetch
    hardReload: function() {
      if (confirm('Flush cache and reload? This will refresh all data from the server.')) {
        var reload = function() {
          // Bypass browser cache by loading with a fresh URL
          location.href = window.location.origin + window.location.pathname + '?nocache=' + Date.now();
        };
        // Also flush the service worker cache so the next load re-primes it
        // with fresh content. Unregister first, then reload.
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistration().then(function(reg) {
            if (reg) {
              return reg.unregister().then(function() {
                if (window.caches) {
                  return caches.keys().then(function(names) {
                    return Promise.all(
                      names.filter(function(n) { return n.indexOf('lingolearn-') === 0; })
                           .map(function(n) { return caches.delete(n); })
                    );
                  });
                }
              });
            }
          }).catch(function() {}).then(reload);
          return;
        }
        reload();
      }
    },

    // ─── Exercise Interaction Handlers ───

    // Handle multiple-choice exercise selection
    _exerciseSelect: function(exerciseIndex, optionIndex) {
      var exercise = this.flattenThemeExercises()[exerciseIndex];
      if (!exercise) return;
      
      // Visual feedback - highlight selected option
      var self = this;
      var buttons = document.querySelectorAll('button');
      buttons.forEach(function(btn) {
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').indexOf('_exerciseSelect') !== -1) {
          var parts = btn.getAttribute('onclick').match(/_exerciseSelect\((\d+),(\d+)\)/);
          if (parts && parseInt(parts[1]) === exerciseIndex) {
            var oi = parseInt(parts[2]);
            if (exercise.options && exercise.options[oi]) {
              btn.classList.toggle('btn-success', oi === optionIndex);
              btn.classList.toggle('text-white', oi === optionIndex);
              btn.classList.toggle('btn-outline', oi !== optionIndex);
            }
          }
        }
      });
      
      // Show answer
      setTimeout(function() {
        var isCorrect = exercise.options && exercise.options[optionIndex] === exercise.correct;
        var msg = isCorrect ? '✓ Correct!' : '✗ The correct answer is: ' + exercise.correct;
        alert(msg);
        // Reset selection
        buttons.forEach(function(btn) {
          if (btn.getAttribute('onclick') && btn.getAttribute('onclick').indexOf('_exerciseSelect') !== -1) {
            var parts = btn.getAttribute('onclick').match(/_exerciseSelect\((\d+),(\d+)\)/);
            if (parts && parseInt(parts[1]) === exerciseIndex) {
              btn.classList.remove('btn-success', 'text-white');
              btn.classList.add('btn-outline');
            }
          }
        });
      }, 500);
    },

    // Handle fill-in-blank exercise submission
    _exerciseSubmitFillIn: function(exerciseIndex) {
      var input = document.querySelector('[data-exercise-fill="' + exerciseIndex + '"]');
      if (!input) return;
      
      var answer = input.value.trim();
      var exercise = this.flattenThemeExercises()[exerciseIndex];
      if (!exercise) return;
      
      var isCorrect = answer.toLowerCase() === String(exercise.correct).toLowerCase();
      var msg = isCorrect ? '✓ Correct!' : '✗ The correct answer is: ' + exercise.correct;
      alert(msg);
      input.value = '';
      input.classList.toggle('input-success', isCorrect);
      input.classList.toggle('input-error', !isCorrect);
    },

    // ─── Helpers ───
    getProgress: function(levelId, stageId) {
      // stageId is already in the correct format (a1-1, a2-3, etc.)
      // Reading progressVersion makes this expression depend on a reactive
      // property: getStageProgress() is a pure localStorage read, so without
      // this Alpine would never re-evaluate after saveProgress() (e.g. after
      // quiz completion) and the stage header would keep showing "Not started".
      void this.progressVersion;
      return Storage.getStageProgress(stageId);
    },

    // Bump the progress reactivity trigger. Call after any out-of-band write
    // to progress storage (locale switch, reset) so displays re-read localStorage.
    touchProgress: function() {
      this.progressVersion++;
    },

    // Get stage-level progress (average of all pillars)
    getStageProgress: function(levelId, stageId) {
      return Storage.getStageProgress(stageId);
    },

    // Get per-pillar completion percentage
    getPillarProgress: function(stageId, pillar) {
      var progress = Storage.load('progress', {});
      if (!progress[stageId] || !progress[stageId][pillar]) return 0;
      var data = progress[stageId][pillar];
      return data.total > 0 ? Math.round((data.score / data.total) * 100) : 0;
    },

    // Get streak multiplier (returns numeric multiplier: 1, 1.5, or 2)
    getStreakMultiplier: function() {
      return Storage.getStreakMultiplier();
    },

    // ── UI Polish: Utility Functions ──

    // XP count-up animation
        // Animate XP gain with a floating "+N" display.
    // Uses CSS transitions for a smooth visual effect.
    animateXP: function(from, to) {
      var duration = 400;
      var start = performance.now();
      var el = document.querySelector('[x-text*="xp"]');
      if (!el) return;
      var self = this;
      (function tick(now) {
        var elapsed = now - start;
        var progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = Math.round(from + (to - from) * eased);
        // Find the XP display element and update it
        var xpElements = document.querySelectorAll('[x-text="xp"]');
        for (var i = 0; i < xpElements.length; i++) {
          xpElements[i].textContent = current;
        }
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          // Pulse animation
          var xpBadge = document.querySelector('.badge-primary');
          if (xpBadge) {
            xpBadge.classList.add('xp-animate');
            setTimeout(function() { xpBadge.classList.remove('xp-animate'); }, 400);
          }
        }
      })(start);
    },

    // Confetti particle effect
    spawnConfetti: function(count) {
      count = count || 30;
      var colors = ['#6366f1', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
      for (var i = 0; i < count; i++) {
        (function(idx) {
          setTimeout(function() {
            var particle = document.createElement('div');
            particle.className = 'confetti';
            particle.style.left = (Math.random() * 100) + 'vw';
            particle.style.top = (Math.random() * 30 - 5) + 'vh';
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.width = (4 + Math.random() * 6) + 'px';
            particle.style.height = (4 + Math.random() * 6) + 'px';
            particle.style.animationDuration = (1 + Math.random() * 1) + 's';
            document.body.appendChild(particle);
            setTimeout(function() {
              if (particle.parentNode) particle.parentNode.removeChild(particle);
            }, 2500);
          }, idx * 30);
        })(i);
      }
    },

    // Smooth progress bar animation via Alpine expression
    // (DaisyUI progress bars animate natively via CSS transition on the value attribute)

    // Trigger skeleton → content transition
        // Toggle skeleton loading placeholders.
    // Sets the loading state and clears data errors.
    setSkeletonLoading: function(isLoading) {
      this.loading = isLoading;
      this.dataError = false;
    }
  };
}
// Expose globally
window.app = app;

// ─── Service Worker Update Detection ───
(function() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', function() {
      console.log('Service Worker updated — reloading...');
      window.location.reload();
    });

    // Periodic check for SW updates (every 24 hours)
    setInterval(function() {
      navigator.serviceWorker.getRegistration().then(function(reg) {
        if (reg && reg.active && reg.active.state !== 'activating') {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            console.log('New SW available — notified to skip waiting');
          }
        }
      });
    }, 24 * 60 * 60 * 1000);
  }
})();
