// Storage Manager — locale-aware localStorage wrapper
const Storage = {
  prefix: 'lingolearn_',
  
  // Get current locale from localStorage or default to en-es
  getLocale() {
    return localStorage.getItem(this.prefix + 'current_locale') || 'en-es';
  },
  
  // Set current locale
  setLocale(locale) {
    localStorage.setItem(this.prefix + 'current_locale', locale);
  },
  
  // Get a prefixed key
  key(name) {
    const locale = this.getLocale();
    return `${this.prefix}${locale}_${name}`;
  },
  
  // Save data
  save(name, data) {
    try {
      localStorage.setItem(this.key(name), JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Storage save error:', e);
      return false;
    }
  },
  
  // Load data
  load(name, defaultValue = null) {
    try {
      const item = localStorage.getItem(this.key(name));
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error('Storage load error:', e);
      return defaultValue;
    }
  },
  
  // Remove data
  remove(name) {
    localStorage.removeItem(this.key(name));
  },
  
  // ─── Progress ───
  
  saveProgress(stageId, pillar, score, total) {
    let progress = this.load('progress', {});
    if (!progress[stageId]) progress[stageId] = {};
    progress[stageId][pillar] = { score, total, completed: score >= total * 0.8 };
    this.save('progress', progress);
  },
  
  getProgress(stageId, pillar) {
    const progress = this.load('progress', {});
    if (progress[stageId] && progress[stageId][pillar]) {
      return progress[stageId][pillar].score / progress[stageId][pillar].total || 0;
    }
    return 0;
  },
  
  // Get overall stage progress (average of all pillars)
  getStageProgress(stageId) {
    const progress = this.load('progress', {});
    if (!progress[stageId]) return 0;
    const pillars = Object.keys(progress[stageId]);
    if (pillars.length === 0) return 0;
    const total = pillars.reduce((sum, p) => {
      const data = progress[stageId][p];
      return sum + (data.total > 0 ? data.score / data.total : 0);
    }, 0);
    return Math.round((total / pillars.length) * 100);
  },
  
  // ─── XP ───
  
  addXP(amount) {
    let xp = this.load('xp', 0);
    xp += amount;
    this.save('xp', xp);
    return xp;
  },
  
  getXP() {
    return this.load('xp', 0);
  },
  
  // ─── Streak ───
  
  recordActivity() {
    const today = new Date().toISOString().split('T')[0];
    const lastActive = this.load('last_active', null);
    
    let streak = this.load('streak', 0);
    
    if (lastActive === today) {
      // Already recorded today
    } else if (lastActive === new Date(Date.now() - 86400000).toISOString().split('T')[0]) {
      // Yesterday — streak continues
      streak++;
    } else {
      // Not yesterday — reset streak
      streak = 1;
    }
    
    this.save('last_active', today);
    this.save('streak', streak);
    return streak;
  },
  
  getStreak() {
    return this.load('streak', 0);
  },
  
  // ─── Settings ───
  
  saveSettings(settings) {
    this.save('settings', settings);
  },
  
  getSettings() {
    return this.load('settings', {
      aidLanguage: 'none',
      theme: 'dark'
    });
  },
  
  // ─── Export/Import ───
  
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
  
  resetProgress() {
    this.remove('progress');
    this.remove('xp');
    this.remove('streak');
    this.remove('last_active');
  },

  // ─── Migration ───

  SCHEMA_VERSION: 1,

  migrate() {
    const version = this.load('_schema_version', 0);
    if (version >= this.SCHEMA_VERSION) return false;

    // v0 → v1: add locale-aware prefixing
    // Old keys were 'lingolearn_progress', 'lingolearn_xp', etc.
    // New keys are 'lingolearn_en-es_progress', etc.
    const oldKeys = ['progress', 'xp', 'streak', 'last_active', 'settings'];
    let migrated = false;

    for (const key of oldKeys) {
      const oldKey = 'lingolearn_' + key;
      const newItem = this.load(key, null);
      const oldItem = localStorage.getItem(oldKey);

      if (oldItem !== null && newItem === null) {
        // Found old-format data — migrate it
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

      // Cleanup
      localStorage.removeItem(testKey);

      console.log('Persistence test PASSED — localStorage is functional');
      return true;
    } catch (e) {
      console.error('Persistence test FAILED:', e.message);
      return false;
    }
  },

  // ─── Health Check ───

  health() {
    const result = {
      storageAvailable: typeof localStorage !== 'undefined',
      quotaOk: true,
      version: this.SCHEMA_VERSION,
      locale: this.getLocale()
    };

    // Check quota (try a large write)
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
