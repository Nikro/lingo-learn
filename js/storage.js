// Storage Manager — locale-aware localStorage wrapper
// All keys are prefixed with 'lingolearn_' and include the current locale
// so that different locale pairs don't share progress (e.g., en-es vs fr-es)
const Storage = {
  prefix: 'lingolearn_',
  
  // ─── Locale ───
  
  // Get current locale from localStorage or default to 'en-es'
  getLocale() {
    return localStorage.getItem(this.prefix + 'current_locale') || 'en-es';
  },
  
  // Set current locale (called when user switches language pair)
  setLocale(locale) {
    localStorage.setItem(this.prefix + 'current_locale', locale);
  },
  
  // Build a prefixed key that includes the current locale
  // e.g., for name='progress' and locale='en-es' → 'lingolearn_en-es_progress'
  key(name) {
    const locale = this.getLocale();
    return `${this.prefix}${locale}_${name}`;
  },
  
  // ─── Generic Save/Load ───
  
  // Save data as JSON string to localStorage
  // Returns true on success, false on quota/exceeded errors
  save(name, data) {
    try {
      localStorage.setItem(this.key(name), JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Storage save error:', e);
      return false;
    }
  },
  
  // Load data from localStorage, parse JSON, return defaultValue if missing or corrupted
  load(name, defaultValue = null) {
    try {
      const item = localStorage.getItem(this.key(name));
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error('Storage load error:', e);
      return defaultValue;
    }
  },
  
  // Remove data by key name (does not throw)
  remove(name) {
    localStorage.removeItem(this.key(name));
  },
  
  // ─── Progress ───
  
  // Save progress for a specific stage/pillar combination
  // progress data: { [stageId]: { [pillar]: { score, total, completed: boolean } } }
  // A pillar is marked "completed" when score >= 80% of total questions
  saveProgress(stageId, pillar, score, total) {
    let progress = this.load('progress', {});
    if (!progress[stageId]) progress[stageId] = {};
    progress[stageId][pillar] = { score, total, completed: score >= total * 0.8 };
    this.save('progress', progress);
  },
  
  // Get completion ratio (0.0 to 1.0) for a specific stage/pillar
  // Returns 0 if no progress recorded yet
  getProgress(stageId, pillar) {
    const progress = this.load('progress', {});
    if (progress[stageId] && progress[stageId][pillar]) {
      return progress[stageId][pillar].score / progress[stageId][pillar].total || 0;
    }
    return 0;
  },
  
  // Get overall stage progress as a percentage (average of all pillar scores)
  // Used for the sidebar progress display and stage header progress bar
  getStageProgress(stageId) {
    const progress = this.load('progress', {});
    if (!progress[stageId]) return 0;
    const pillars = Object.keys(progress[stageId]);
    if (pillars.length === 0) return 0;
    // Average the completion ratios across all pillars
    const total = pillars.reduce((sum, p) => {
      const data = progress[stageId][p];
      return sum + (data.total > 0 ? data.score / data.total : 0);
    }, 0);
    return Math.round((total / pillars.length) * 100);
  },
  
  // ─── XP ───
  
  // Add XP to the user's total and persist
  addXP(amount) {
    let xp = this.load('xp', 0);
    xp += amount;
    this.save('xp', xp);
    return xp;
  },
  
  // Get the user's current XP total
  getXP() {
    return this.load('xp', 0);
  },
  
  // Get streak multiplier based on consecutive daily activity days
  // Returns: 1x for 0-2 days, 1.5x for 3-6 days, 2x for 7+ days
  getStreakMultiplier() {
    const streak = this.getStreak();
    if (streak >= 7) return 2;
    if (streak >= 3) return 1.5;
    return 1;
  },
  
  // Calculate XP for correct answers, applying streak multiplier
  // Base rate: 10 XP per correct answer
  // e.g., 3 correct + 5-day streak = 30 * 1.5 = 45 XP
  calculateXP(correctCount) {
    const base = correctCount * 10; // 10 XP per correct answer
    const multiplier = this.getStreakMultiplier();
    return Math.round(base * multiplier);
  },

  // Get just the bonus XP from streak multiplier (total - base)
  getStreakBonus(correctCount) {
    const base = correctCount * 10;
    const total = this.calculateXP(correctCount);
    return total - base;
  },
  
  // ─── Streak ───
  
  // Record daily activity — called once per day
  // Logic: if today == lastActive → no change; if today == yesterday → streak++; else → streak = 1
  recordActivity() {
    const today = new Date().toISOString().split('T')[0];
    const lastActive = this.load('last_active', null);
    
    let streak = this.load('streak', 0);
    
    if (lastActive === today) {
      // Already recorded today — no change
    } else if (lastActive === new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
      // Yesterday — streak continues
      streak++;
    } else {
      // Not yesterday (gap of 2+ days) — reset streak to 1
      streak = 1;
    }
    
    this.save('last_active', today);
    this.save('streak', streak);
    return streak;
  },
  
  // Get current streak count (days of consecutive activity)
  getStreak() {
    return this.load('streak', 0);
  },
  
  // ─── Settings ───
  
  // Save the full settings object
  saveSettings(settings) {
    this.save('settings', settings);
  },
  
  // Get settings with defaults: theme='dark', aidLanguage='none'
  getSettings() {
    return this.load('settings', {
      aidLanguage: 'none',
      theme: 'dark'
    });
  },
  
  // ─── Export/Import ───
  
  // Export all user data as a downloadable JSON file
  // Creates a blob and triggers browser download with filename: lingolearn-export-YYYY-MM-DD.json
  exportAll() {
    const exportData = {
      locale: this.getLocale(),
      progress: this.load('progress', {}),
      xp: this.load('xp', 0),
      streak: this.load('streak', 0),
      last_active: this.load('last_active', null),
      settings: this.load('settings', {})
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lingolearn-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
  
  // Import data from a JSON object or JSON string
  // Merges imported data with current settings (doesn't overwrite unknown keys)
  importAll(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      if (data.locale) this.setLocale(data.locale);
      if (data.progress) this.save('progress', data.progress);
      if (data.xp !== undefined) this.save('xp', data.xp);
      if (data.streak !== undefined) this.save('streak', data.streak);
      if (data.last_active) this.save('last_active', data.last_active);
      if (data.settings) this.save('settings', data.settings);
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  },
  
  // ─── Reset ───
  
  // Wipe all progress data (XP, streak, activity date) — keeps settings intact
  resetProgress() {
    this.remove('progress');
    this.remove('xp');
    this.remove('streak');
    this.remove('last_active');
  },

  // ─── Migration ───
  
  // Current schema version — increment when localStorage key format changes
  SCHEMA_VERSION: 1,

  // Run migration from older schema versions to the current one
  // v0 → v1: migrates from flat keys ('lingolearn_progress') to locale-aware keys ('lingolearn_en-es_progress')
  // Returns true if any data was migrated, false if already at current version
  migrate() {
    const version = this.load('_schema_version', 0);
    if (version >= this.SCHEMA_VERSION) return false;

    // v0 → v1: add locale-aware prefixing
    // Old keys were 'lingolearn_progress', 'lingolearn_xp', etc.
    // New keys are 'lingolearn_en-es_progress', 'lingolearn_en-es_xp', etc.
    const oldKeys = ['progress', 'xp', 'streak', 'last_active', 'settings'];
    let migrated = false;

    for (const key of oldKeys) {
      const oldKey = 'lingolearn_' + key;
      const newItem = this.load(key, null);
      const oldItem = localStorage.getItem(oldKey);

      if (oldItem !== null && newItem === null) {
        // Found old-format data — migrate it to the new locale-aware format
        try {
          const parsed = JSON.parse(oldItem);
          this.save(key, parsed);
          localStorage.removeItem(oldKey);
          migrated = true;
        } catch (e) {
          console.error('Migration failed for key', key, e);
        }
      }
    }

    this.save('_schema_version', this.SCHEMA_VERSION);
    return migrated;
  },

  // ─── Persistence Test ───

  // Write-test data to localStorage and read it back to verify functionality
  // Used during app.init() to detect localStorage being blocked (e.g., private browsing)
  // Returns true if test passes, false if it fails
  testPersistence() {
    const testKey = '_test_' + Date.now();
    const testData = { test: true, ts: Date.now() };

    try {
      // Write
      localStorage.setItem(testKey, JSON.stringify(testData));

      // Read back
      const readback = localStorage.getItem(testKey);
      if (!readback) throw new Error('Read returned null');

      const parsed = JSON.parse(readback);
      if (parsed.test !== true || parsed.ts !== testData.ts) {
        throw new Error('Data mismatch on read-back');
      }

      // Cleanup test data
      localStorage.removeItem(testKey);

      console.log('Persistence test PASSED — localStorage is functional');
      return true;
    } catch (e) {
      console.error('Persistence test FAILED:', e.message);
      return false;
    }
  },

  // ─── Health Check ───

  // Diagnostic: returns an object with localStorage availability, quota status, schema version, and locale
  // Used for debugging and monitoring
  health() {
    const result = {
      storageAvailable: typeof localStorage !== 'undefined',
      quotaOk: true,
      version: this.SCHEMA_VERSION,
      locale: this.getLocale()
    };

    // Check storage quota by attempting a large write (1KB test string)
    try {
      const check = new Array(1024).fill('x').join('');
      localStorage.setItem('_quota_test', check);
      localStorage.removeItem('_quota_test');
    } catch (e) {
      result.quotaOk = false;
    }

    return result;
  }
};
