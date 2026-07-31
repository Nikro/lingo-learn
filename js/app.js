// LingoLearn — Main Application
function app() {
  return {
    // ─── State ───
    loading: true,
    sidebarOpen: false,
    settingsOpen: false,
    registry: [],
    aidLanguages: [],
    appLevels: [
      { id: 'A1', name: 'A1 — Beginner', stages: [{ id: 'a1-1', name: 'A1.1 — Greetings' }, { id: 'a1-2', name: 'A1.2 — Numbers & Colors' }, { id: 'a1-3', name: 'A1.3 — Family' }] },
      { id: 'A2', name: 'A2 — Elementary', stages: [{ id: 'a2-1', name: 'A2.1 — Daily Life' }, { id: 'a2-2', name: 'A2.2 — Shopping' }, { id: 'a2-3', name: 'A2.3 — Food & Drink' }] },
      { id: 'B1', name: 'B1 — Intermediate', stages: [{ id: 'b1-1', name: 'B1.1 — Travel' }, { id: 'b1-2', name: 'B1.2 — Work' }, { id: 'b1-3', name: 'B1.3 — Opinions' }] },
      { id: 'B2', name: 'B2 — Upper Intermediate', stages: [{ id: 'b2-1', name: 'B2.1 — Culture' }, { id: 'b2-2', name: 'B2.2 — Society' }, { id: 'b2-3', name: 'B2.3 — Abstract' }] }
    ],

    // Current navigation
    currentLocale: 'en-es',
    currentLevel: null,
    currentStage: null,
    currentPillar: 'grammar',

    // Stage data
    stageData: null,
    levelData: [],

    // UI
    expandedLevel: null,
    theme: 'dark',
    aidLanguage: 'none',
    xp: 0,
    streak: 0,

    // Quiz state
    quizActive: false,
    quizFinished: false,
    quizQuestions: [],
    quizIndex: 0,
    quizScore: 0,
    quizAnswered: false,
    quizFeedback: null,
    selectedOption: null,
    fillInAnswer: '',
    conjugationAnswer: '',

    // Drag and drop state
    dragItem: null,
    dropTarget: null,

    // Conjugation state
    conjugationVerb: null,
    conjugationCells: {},

    // Matching exercise state
    matchPairs: [],           // [{target, source}]
    matchRightItems: [],      // shuffled source strings
    matchRightOriginalIndex: [], // maps right items back to pair index
    matchSelections: [],      // { [pairIndex]: { leftIdx, rightIdx, correct } }
    matchRightMatched: [],    // [pairIndex] | true|false — did this right item get matched correctly?
    selectedLeft: null,
    selectedRight: null,
    userMatchAnswers: null,   // [source_string] per pair — the user's choices
    matchResults: null,       // [boolean] per pair — did they match correctly?
    matchAttempts: 0,

    // Conjugation Matrix exercise state
    matrixPronouns: ['yo', 'tú', 'él/ella/usted', 'nosotros', 'vosotros', 'ellos/ellas/ustedes'],
    matrixAnswers: {},        // { "0-0": "soy", "0-1": "era", ... }
    matrixCorrectAnswers: null, // { "0-0": "soy", ... }
    matrixResults: null,      // { "0-0": true, ... }
    matrixCorrectCount: 0,

    // Loading state
    pillarContent: {
      grammar: '',
      vocabulary: [],
      verbs: '',
      pronunciation: ''
    },

    // ─── Computed Helpers ───
    get matrixTotalCells() {
      if (!this.quizQuestions[this.quizIndex]) return 0;
      return this.matrixPronouns.length * (this.quizQuestions[this.quizIndex].tenses || []).length;
    },
    get matrixFilledCount() {
      var filled = 0;
      for (var key in this.matrixAnswers) {
        if (this.matrixAnswers[key] && this.matrixAnswers[key].trim() !== '') filled++;
      }
      return filled;
    },

    // ─── Initialization ───
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

      // Load locale
      this.currentLocale = Storage.getLocale() || 'en-es';

      // Load registry
      await this.loadRegistry();

      // Load progress data
      this.xp = Storage.getXP();
      this.streak = Storage.getStreak();

      // Load route
      this.parseRoute();

      // Listen for hash changes
      window.addEventListener('hashchange', function() { this.parseRoute() }.bind(this));

      // Record daily activity
      Storage.recordActivity();

      this.loading = false;
    },

    updateTheme(theme) {
      this.theme = theme;
      document.documentElement.setAttribute('data-theme', theme);
      var s = Storage.getSettings();
      s.theme = theme;
      Storage.saveSettings(s);
    },

    // ─── Data Loading ───
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

    switchLocale(locale) {
      this.currentLocale = locale;
      Storage.setLocale(locale);
      this.xp = Storage.getXP();
      this.streak = Storage.getStreak();
      this.currentStage = null;
      this.currentLevel = null;
      window.location.hash = '/' + locale;
    },

    async loadStageData(levelId, stageId) {
      this.loading = true;
      try {
        // stageId is already in filename format (a1-1, a2-3, b1-2, etc.)
        var response = await fetch('data/' + this.currentLocale + '/' + stageId + '.json');
        this.stageData = await response.json();
        this.renderPillar();
      } catch (e) {
        console.error('Failed to load stage data:', e);
        this.stageData = {
          id: stageId,
          title: 'Stage ' + stageId,
          description: 'Content loading...',
          grammar: [],
          vocabulary: [],
          verbs: [],
          pronunciation: []
        };
        this.renderPillar();
      }
      this.loading = false;
    },

    // ─── Navigation ───
    toggleLevel(levelId) {
      this.expandedLevel = this.expandedLevel === levelId ? null : levelId;
    },

    navigateTo(levelId, stageId, pillar) {
      pillar = pillar || 'grammar';
      this.currentLevel = levelId;
      this.currentStage = stageId;
      this.currentPillar = pillar;
      this.sidebarOpen = false;

      window.location.hash = '/' + this.currentLocale + '/' + this.currentLevel + '/' + this.currentStage + '/' + this.currentPillar;

      this.loadStageData(levelId, stageId);
    },

    parseRoute() {
      var hash = window.location.hash.slice(1) || '/' + this.currentLocale;
      var parts = hash.split('/').filter(function(b) { return b; });

      if (parts.length >= 1) this.currentLocale = parts[0] || this.currentLocale;
      if (parts.length >= 2) this.currentLevel = parts[1];
      if (parts.length >= 3) this.currentStage = parts[2];
      if (parts.length >= 4) this.currentPillar = parts[3];

      // Validate level against known app levels
      if (this.currentLevel) {
        var levelExists = this.appLevels.some(function(l) { return l.id === this.currentLevel; }.bind(this));
        if (!levelExists) {
          // Invalid level — reset state, show welcome
          this.currentLevel = null;
          this.currentStage = null;
          this.expandedLevel = null;
          this.stageData = null;
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
          // Invalid stage — reset state, show welcome
          this.currentLevel = null;
          this.currentStage = null;
          this.expandedLevel = null;
          this.stageData = null;
          return;
        }

        this.loadStageData(this.currentLevel, this.currentStage);
      } else if (this.currentLevel && !this.currentStage) {
        // Level selected but no stage — default to first stage
        var firstStage = this.appLevels.find(function(l) { return l.id === this.currentLevel; }.bind(this));
        if (firstStage && firstStage.stages.length > 0) {
          this.currentStage = firstStage.stages[0].id;
          this.loadStageData(this.currentLevel, this.currentStage);
        }
      }
    },

    // Get the current route string for display
    get currentRoute() {
      if (!this.currentLocale) return '';
      if (!this.currentStage) return '/' + this.currentLocale;
      if (!this.currentPillar) return '/' + this.currentLocale + '/' + this.currentLevel + '/' + this.currentStage;
      return '/' + this.currentLocale + '/' + this.currentLevel + '/' + this.currentStage + '/' + this.currentPillar;
    },

    // Check if sidebar item should be highlighted as active
    isStageActive(levelId, stageId) {
      return this.currentLevel === levelId && this.currentStage === stageId;
    },

    // Check if a pillar tab is active (for hash routing via tab clicks)
    isPillarActive(pillar) {
      return this.currentPillar === pillar;
    },

    // Set pillar and update hash
    setPillar(pillar) {
      this.currentPillar = pillar;
      if (this.currentStage) {
        window.location.hash = '/' + this.currentLocale + '/' + this.currentLevel + '/' + this.currentStage + '/' + pillar;
      }
    },

    // ─── Rendering ───
    get stageTitle() {
      if (!this.stageData) return 'Loading...';
      return this.stageData.title || 'Stage ' + this.currentStage;
    },

    get stageDescription() {
      if (!this.stageData) return '';
      return this.stageData.description || '';
    },

    get canStartQuiz() {
      if (!this.stageData) return false;
      var pillars = ['grammar', 'vocabulary', 'verbs', 'pronunciation'];
      return pillars.some(function(p) { return this.stageData[p] && this.stageData[p].length > 0; }.bind(this));
    },

    get vocabularyCards() {
      if (!this.stageData || !this.stageData.vocabulary) return [];
      return this.stageData.vocabulary;
    },

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

    renderGrammar: function() {
      if (!this.stageData.grammar || this.stageData.grammar.length === 0) {
        return '<p class="opacity-70">Grammar content loading...</p>';
      }

      var html = '<div class="space-y-4">';
      var self = this;
      this.stageData.grammar.forEach(function(item, i) {
        html += '<div class="bg-base-200 rounded-lg p-4">';
        html += '<h4 class="font-bold mb-2">' + (i + 1) + '. ' + item.title + '</h4>';
        if (item.content) html += '<p class="mb-2">' + item.content + '</p>';
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

    renderVerbs: function() {
      if (!this.stageData.verbs || this.stageData.verbs.length === 0) {
        return '<p class="opacity-70">Verb drills loading...</p>';
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

    renderPronunciation: function() {
      if (!this.stageData.pronunciation || this.stageData.pronunciation.length === 0) {
        return '<p class="opacity-70">Pronunciation content loading...</p>';
      }

      var html = '<div class="space-y-4">';
      var self = this;
      this.stageData.pronunciation.forEach(function(item) {
        html += '<div class="bg-base-200 rounded-lg p-4">';
        html += '<h4 class="font-bold mb-2">' + item.title + '</h4>';
        if (item.content) html += '<p class="mb-2">' + item.content + '</p>';
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

    // ─── Quiz ───
    startQuiz: function() {
      if (!this.stageData) return;

      this.quizQuestions = [];
      var pillars = ['grammar', 'vocabulary', 'verbs', 'pronunciation'];
      var self = this;

      pillars.forEach(function(pillar) {
        var items = self.stageData[pillar];
        if (!items) return;
        items.forEach(function(item, index) {
          var q = Object.assign({}, item, { pillar: pillar, index: index });

          // For matching exercises, set up pairs and shuffled right items
          if (item.type === 'matching' && item.pairs) {
            self.matchPairs = item.pairs;
            self.matchRightItems = item.pairs.map(function(p) { return p.source; });
            // Shuffle right items
            self.matchRightOriginalIndex = item.pairs.map(function(_, i) { return i; });
            for (var s = self.matchRightOriginalIndex.length - 1; s > 0; s--) {
              var r = Math.floor(Math.random() * (s + 1));
              var tmp = self.matchRightOriginalIndex[s];
              self.matchRightOriginalIndex[s] = self.matchRightOriginalIndex[r];
              self.matchRightOriginalIndex[r] = tmp;
            }
            // Reorder rightItems according to shuffled index
            var originalPairs = item.pairs;
            self.matchRightItems = self.matchRightOriginalIndex.map(function(origIdx) {
              return originalPairs[origIdx].source;
            });
            // Reset matching state
            self.matchSelections = [];
            self.matchRightMatched = [];
            self.selectedLeft = null;
            self.selectedRight = null;
            self.userMatchAnswers = null;
            self.matchResults = null;
            self.matchAttempts = 0;
          }

          // For conjugation-matrix exercises, look up verb data
          if (item.type === 'conjugation-matrix' && item.verb && self.stageData.verbs) {
            var verbObj = self.stageData.verbs.find(function(v) {
              return v.infinitive.toLowerCase() === item.verb.toLowerCase();
            });
            if (verbObj) {
              q.verbData = verbObj;
            }
          }

          self.quizQuestions.push(q);
        });
      });

      if (this.quizQuestions.length === 0) {
        alert('No exercises available for this stage yet.');
        return;
      }

      this.quizQuestions = this.shuffleArray(this.quizQuestions);
      this.quizIndex = 0;
      this.quizScore = 0;
      this.quizActive = true;
      this.quizFinished = false;
      this.quizAnswered = false;
      this.quizFeedback = null;
      this.selectedOption = null;
      this.fillInAnswer = '';
      this.conjugationAnswer = '';

      // Initialize matching state
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

      // Initialize conjugation matrix state
      this.matrixAnswers = {};
      this.matrixCorrectAnswers = null;
      this.matrixResults = null;
      this.matrixCorrectCount = 0;
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

    submitAnswer: function(answer) {
      if (this.quizAnswered) return;

      var question = this.quizQuestions[this.quizIndex];
      var correct = this.checkAnswer(answer, question);

      if (correct) {
        this.quizScore++;
        Storage.addXP(10);
        this.xp = Storage.getXP();
        this.quizFeedback = { correct: true, explanation: question.explanation || 'Correct!' };
      } else {
        this.quizFeedback = {
          correct: false,
          explanation: question.explanation || ('The correct answer is: ' + this.getCorrectAnswer(question))
        };
      }

      this.quizAnswered = true;
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
      this.quizIndex++;
      this.quizAnswered = false;
      this.quizFeedback = null;
      this.fillInAnswer = '';
      this.conjugationAnswer = '';
      this.selectedOption = null;
      // Clear per-type state
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

      if (this.quizIndex >= this.quizQuestions.length) {
        this.finishQuiz();
      }
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

      // Score: each correct pair = 1 point
      var correctCount = this.matchResults.filter(function(r) { return r; }).length;
      this.quizScore = correctCount;
      Storage.addXP(correctCount * 10);
      this.xp = Storage.getXP();

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
      Storage.addXP(correctCount * 5); // 5 XP per correct cell (matrix is harder)
      this.xp = Storage.getXP();

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
    },

    finishQuiz: function() {
      this.quizActive = false;
      this.quizFinished = true;

      if (this.currentStage) {
        // stageId is already in the correct format (a1-1, a2-3, etc.)
        var pillar = this.quizQuestions[0] ? this.quizQuestions[0].pillar : 'grammar';
        Storage.saveProgress(this.currentStage, pillar, this.quizScore, this.quizQuestions.length);
      }

      Storage.recordActivity();
      alert('Quiz complete!\n\nScore: ' + this.quizScore + '/' + this.quizQuestions.length + '\nXP earned: +' + (this.quizScore * 10));
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

    // ─── Helpers ───
    getProgress: function(levelId, stageId) {
      // stageId is already in the correct format (a1-1, a2-3, etc.)
      return Storage.getStageProgress(stageId);
    }
  };
}
