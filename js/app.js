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
      { id: 'A1', name: 'A1 — Beginner', stages: [{ id: '1.1', name: 'A1.1 — Greetings' }, { id: '1.2', name: 'A1.2 — Numbers & Colors' }, { id: '1.3', name: 'A1.3 — Family' }] },
      { id: 'A2', name: 'A2 — Elementary', stages: [{ id: '2.1', name: 'A2.1 — Daily Life' }, { id: '2.2', name: 'A2.2 — Shopping' }, { id: '2.3', name: 'A2.3 — Food & Drink' }] },
      { id: 'B1', name: 'B1 — Intermediate', stages: [{ id: '3.1', name: 'B1.1 — Travel' }, { id: '3.2', name: 'B1.2 — Work' }, { id: '3.3', name: 'B1.3 — Opinions' }] },
      { id: 'B2', name: 'B2 — Upper Intermediate', stages: [{ id: '4.1', name: 'B2.1 — Culture' }, { id: '4.2', name: 'B2.2 — Society' }, { id: '4.3', name: 'B2.3 — Abstract' }] }
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
    xp: 0,
    streak: 0,

    // Quiz state
    quizActive: false,
    quizQuestions: [],
    quizIndex: 0,
    quizScore: 0,
    quizAnswered: false,
    quizFeedback: null,
    fillInAnswer: '',
    conjugationAnswer: '',

    // Drag and drop state
    dragItem: null,
    dropTarget: null,

    // Conjugation state
    conjugationVerb: null,
    conjugationCells: {},

    // Matching state
    matchLeft: null,
    matchRight: null,

    // Loading state
    pillarContent: {
      grammar: '',
      vocabulary: [],
      verbs: '',
      pronunciation: ''
    },

    // ─── Initialization ───
    async init() {
      // Load settings
      var settings = Storage.getSettings();
      this.theme = settings.theme || 'dark';
      this.updateTheme(this.theme);

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
        this.registry = await response.json();
        this.aidLanguages = this.registry.aid_languages;
      } catch (e) {
        console.error('Failed to load registry:', e);
        this.registry = { locales: [], aid_languages: [] };
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
        // Build filename like: a1-1.json, a1-2.json, b1-1.json, etc.
        var levelNum = levelId.toLowerCase();
        var stageNum = stageId.split('.')[0];
        var fileName = levelNum + '-' + stageNum;
        var response = await fetch('data/' + this.currentLocale + '/' + fileName + '.json');
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

      window.location.hash = '/' + this.currentLocale + '/' + levelId + '/' + stageId + '/' + pillar;

      this.loadStageData(levelId, stageId);
    },

    parseRoute() {
      var hash = window.location.hash.slice(1) || '/' + this.currentLocale;
      var parts = hash.split('/').filter(function(b) { return b; });

      if (parts.length >= 1) this.currentLocale = parts[0] || this.currentLocale;
      if (parts.length >= 2) this.currentLevel = parts[1];
      if (parts.length >= 3) this.currentStage = parts[2];
      if (parts.length >= 4) this.currentPillar = parts[3];

      if (this.currentLevel) this.expandedLevel = this.currentLevel;

      if (this.currentLevel && this.currentStage) {
        this.loadStageData(this.currentLevel, this.currentStage);
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
          if (item.type === 'exercise') {
            self.quizQuestions.push(Object.assign({}, item, { pillar: pillar, index: index }));
          }
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
      this.quizAnswered = false;
      this.quizFeedback = null;
      this.fillInAnswer = '';
      this.conjugationAnswer = '';
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

      if (this.quizIndex >= this.quizQuestions.length) {
        this.finishQuiz();
      }
    },

    finishQuiz: function() {
      this.quizActive = false;

      if (this.currentLevel && this.currentStage) {
        var pillar = this.quizQuestions[0] ? this.quizQuestions[0].pillar : 'grammar';
        var stageKey = this.currentLevel.replace('.', '-') + '-' + this.currentStage.replace('.', '-');
        Storage.saveProgress(stageKey, pillar, this.quizScore, this.quizQuestions.length);
      }

      Storage.recordActivity();
      alert('Quiz complete!\n\nScore: ' + this.quizScore + '/' + this.quizQuestions.length + '\nXP earned: +' + (this.quizScore * 10));
    },

    renderQuizQuestion: function() {
      if (!this.quizActive) return '';

      var question = this.quizQuestions[this.quizIndex];
      var total = this.quizQuestions.length;
      var progress = ((this.quizIndex + 1) / total) * 100;

      var html = '';
      html += '<div class="mb-4 flex items-center justify-between">';
      html += '<span class="text-sm opacity-70">Question ' + (this.quizIndex + 1) + ' of ' + total + '</span>';
      html += '<span class="text-sm font-bold">Score: ' + this.quizScore + '</span>';
      html += '</div>';
      html += '<progress class="progress progress-primary w-full mb-4" value="' + progress + '" max="100"></progress>';
      html += '<div class="text-lg font-medium mb-6">' + question.question + '</div>';

      switch (question.type) {
        case 'multiple-choice':
          html += this.renderMultipleChoice(question);
          break;
        case 'fill-in-blank':
          html += this.renderFillInBlank(question);
          break;
        case 'conjugation':
          html += this.renderConjugationExercise(question);
          break;
        default:
          html += '<p class="opacity-70">Exercise type not yet implemented.</p>';
      }

      // Feedback
      if (this.quizFeedback) {
        html += '<div class="alert ' + (this.quizFeedback.correct ? 'alert-success' : 'alert-error') + ' mt-4">';
        html += '<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">';
        if (this.quizFeedback.correct) {
          html += '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />';
        } else {
          html += '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />';
        }
        html += '</svg>';
        html += '<div>';
        html += '<p class="font-bold">' + (this.quizFeedback.correct ? 'Correct!' : 'Not quite...') + '</p>';
        html += '<p class="text-sm">' + this.quizFeedback.explanation + '</p>';
        html += '</div>';
        html += '</div>';
      }

      return html;
    },

    renderMultipleChoice: function(question) {
      if (!question.options) return '';

      var html = '<div class="mt-4 space-y-2">';
      var self = this;
      question.options.forEach(function(option, index) {
        var letter = String.fromCharCode(65 + index);
        html += '<button class="btn btn-outline w-full justify-start" @click="submitAnswer(\'' + option.replace(/'/g, "\\'") + '\')">';
        html += '<span class="font-mono font-bold w-6">' + letter + '.</span>';
        html += '<span>' + option + '</span>';
        html += '</button>';
      });
      html += '</div>';

      if (this.quizAnswered) {
        html += '<button class="btn btn-primary mt-4" @click="nextQuestion()">Next Question \u2192</button>';
      }

      return html;
    },

    renderFillInBlank: function(question) {
      var html = '<div class="space-y-4 mt-4">';
      html += '<input type="text" x-model="fillInAnswer" @keyup.enter="submitAnswer(fillInAnswer)" class="input input-bordered input-primary w-full" placeholder="Type your answer..." />';

      if (!this.quizAnswered) {
        html += '<button class="btn btn-primary" @click="submitAnswer(fillInAnswer)">Submit</button>';
      } else {
        html += '<button class="btn btn-primary" @click="nextQuestion()">Next Question \u2192</button>';
      }

      html += '</div>';
      return html;
    },

    renderConjugationExercise: function(question) {
      var html = '<div class="space-y-4 mt-4">';
      html += '<p class="opacity-70">Conjugate <strong>' + (question.verb || 'the verb') + '</strong> in the <strong>' + (question.tense || 'present') + '</strong> tense:</p>';
      html += '<input type="text" x-model="conjugationAnswer" @keyup.enter="submitAnswer(conjugationAnswer)" class="input input-bordered input-primary w-full" placeholder="Type the conjugation..." />';

      if (!this.quizAnswered) {
        html += '<button class="btn btn-primary" @click="submitAnswer(conjugationAnswer)">Submit</button>';
      } else {
        html += '<button class="btn btn-primary" @click="nextQuestion()">Next Question \u2192</button>';
      }

      html += '</div>';
      return html;
    },

    // ─── Settings ───
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
      var stageKey = levelId.replace('.', '-') + '-' + stageId.replace('.', '-');
      return Storage.getStageProgress(stageKey);
    }
  };
}
