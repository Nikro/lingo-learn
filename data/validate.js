#!/usr/bin/env node
/**
 * validate.js — Validates ALL curriculum JSON for the LingoLearn app.
 *
 * Coverage (per locale pair, e.g. en-es):
 *   1. Content themes   data/<locale>/<stage>/themes/<theme>.json   (skips the stage manifest)
 *   2. Stage manifests  data/<locale>/<stage>/themes/<stage>.json   (drives the app's theme list)
 *   3. Root manifests   data/<locale>/<stage>.json                  (MUST NOT exist — retired 2026-08-28, ADR 0007)
 *
 * Per-content-theme checks:
 *   - Valid JSON parse                                   -> ERROR
 *   - grammar / exercises / pronunciation present+non-empty -> ERROR (app pillar crash if missing)
 *   - vocabulary present (missing entirely)              -> ERROR
 *   - vocabulary >= 50 items (array OR dict-of-categories, flattened the way app.js does) -> WARNING (reports known gaps, does not block)
 *   - no secret-named JSON key / credential token value  -> ERROR (real leak; see secret scanner note below)
 *   - explicit id (id/theme_id/stage_id) field           -> WARNING (app routes by FILENAME, so non-fatal)
 *   - display title (title/theme_name)                   -> WARNING
 *
 * Cross-checks (per stage, using the in-theme-dir manifest the app actually reads):
 *   - every manifest theme id has a matching file        -> ERROR (dangling entry = dead list row)
 *   - every content file appears in the manifest         -> ERROR (orphan file = unreachable theme)
 *   - duplicate ids in a manifest                        -> ERROR
 *   - a stage dir must have an in-theme-dir manifest     -> ERROR
 *
 * Exit code: 0 = no errors (warnings allowed), 1 = at least one error.
 *
 * Usage: node validate.js [locale-folder]   (default: all locale folders under data/)
 *
 * NOTE on the secret scanner (deliberate deviation from a naive keyword grep):
 * The task suggested flagging "password" in strings. We do NOT — HINTS.md §10
 * warns that the English word "password" is legitimate Spanish vocabulary
 * (e.g. "contraseña = password"), and an empirical scan of all 139 themes
 * confirmed 4 such false positives and ZERO real secrets. Instead we flag:
 *   (a) JSON KEYS whose names look like secrets (api_key, secret, token, bearer, private_key, ...), and
 *   (b) STRING VALUES that look like credential tokens (sk-/ghp_/github_pat_/AKIA/AIza/xox patterns,
 *       PEM private-key headers, JWTs, user:password@ connection strings).
 * This catches real leaks without breaking vocabulary lessons.
 */

const fs = require('fs');
const path = require('path');

const DATA_ROOT = __dirname; // the data/ directory this file lives in

// ─── Section-length helper (array length OR dict-of-categories flattened, like app.js) ───
function sectionLen(v) {
  if (v == null) return 0;
  if (Array.isArray(v)) return v.length;
  if (typeof v === 'object') {
    let n = 0;
    for (const k in v) if (Array.isArray(v[k])) n += v[k].length;
    return n;
  }
  return 0;
}

// ─── Secret scanner ───
// (a) key names that look like secrets
const SECRET_KEY_RE = /^(api_?key|secret|secret_?key|access_?token|auth_?token|token|password|passwd|bearer|private_?key|client_?secret|credentials|credential)$/i;
// (b) string values that look like credential tokens
const SECRET_VALUE_PATTERNS = [
  { re: /sk-[A-Za-z0-9]{16,}/, label: 'OpenAI-style key' },
  { re: /gh[pousr]_[A-Za-z0-9_]{16,}/, label: 'GitHub token' },
  { re: /github_pat_[A-Za-z0-9_]{16,}/, label: 'GitHub PAT' },
  { re: /\bAKIA[0-9A-Z]{16}\b/, label: 'AWS access key id' },
  { re: /AIza[0-9A-Za-z_-]{30,}/, label: 'Google API key' },
  { re: /xox[baprs]-[A-Za-z0-9-]{10,}/, label: 'Slack token' },
  { re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, label: 'PEM private key' },
  { re: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{4,}/, label: 'JWT' },
  { re: /[a-z][a-z0-9+.-]*:\/\/[^@\s/]+:[^@\s/]+@/, label: 'connection string with embedded credentials' },
];

// Walk a parsed JSON value, collecting secret-named keys and secret-looking string values.
function findSecrets(node, pointer, out) {
  if (node == null) return;
  if (typeof node === 'string') {
    for (const p of SECRET_VALUE_PATTERNS) {
      if (p.re.test(node)) out.push(pointer + ' => ' + p.label + ' (value starts ' + JSON.stringify(node.slice(0, 20)) + ')');
    }
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => findSecrets(v, pointer + '[' + i + ']', out));
    return;
  }
  if (typeof node === 'object') {
    for (const k of Object.keys(node)) {
      if (SECRET_KEY_RE.test(k)) out.push(pointer + ' key "' + k + '" looks like a secret');
      findSecrets(node[k], pointer + '.' + k, out);
    }
  }
}

// ─── Per-content-theme checks ───
// returns { errors: [], warnings: [], vocabLen: n }
function checkTheme(data, label) {
  const errors = [];
  const warnings = [];

  const vocabLen = sectionLen(data.vocabulary);

  // vocabulary present
  if (data.vocabulary == null) {
    errors.push('missing vocabulary section');
  } else if (vocabLen < 50) {
    warnings.push('only ' + vocabLen + ' vocab items (need >=50)');
  }

  // required pillars present + non-empty
  for (const sec of ['grammar', 'exercises', 'pronunciation']) {
    if (data[sec] == null) errors.push('missing ' + sec + ' section');
    else if (sectionLen(data[sec]) === 0) errors.push(sec + ' section is empty');
  }

  // explicit id (app routes by filename, so absence is a warning, not an error)
  const hasId = !!(data.id || data.theme_id || data.stage_id);
  if (!hasId) warnings.push('no explicit id (id/theme_id) field — app routes by filename, so OK but not self-describing');

  // display title
  const hasTitle = typeof data.title === 'string' && data.title.length > 0;
  const hasThemeName = typeof data.theme_name === 'string' && data.theme_name.length > 0;
  if (!hasTitle && !hasThemeName) warnings.push('no display title (title/theme_name) field');

  // secrets
  const secrets = [];
  findSecrets(data, label, secrets);
  secrets.forEach(s => errors.push('possible secret: ' + s));

  return { errors, warnings, vocabLen };
}

// ─── Per-manifest checks (canonical in-theme-dir stage manifests) ───
// returns { errors: [], themeIds: [] }
function checkManifest(data, label) {
  const errors = [];
  const themeIds = [];
  if (typeof data.title !== 'string' || data.title.length === 0) errors.push('manifest missing title');
  if (!Array.isArray(data.themes) || data.themes.length === 0) {
    errors.push('manifest has no non-empty themes[] array');
    return { errors, themeIds };
  }
  const seen = new Set();
  data.themes.forEach((t, i) => {
    if (!t || typeof t !== 'object') { errors.push('themes[' + i + '] is not an object'); return; }
    if (!t.id) { errors.push('themes[' + i + '] missing id'); return; }
    if (!t.title) { errors.push('themes[' + i + '].id="' + t.id + '" missing title'); }
    if (seen.has(t.id)) errors.push('duplicate theme id "' + t.id + '" in manifest');
    seen.add(t.id);
    themeIds.push(t.id);
  });
  return { errors, themeIds };
}

// ─── Main ───
const targetLocale = process.argv[2] || null;

const localeFolders = fs.readdirSync(DATA_ROOT)
  .filter(f => {
    const fp = path.join(DATA_ROOT, f);
    return fs.statSync(fp).isDirectory() && f !== 'data';
  })
  .filter(f => !targetLocale || f === targetLocale)
  .sort();

let totalContent = 0;
let totalManifests = 0;
let totalRootManifests = 0;
let totalErrors = 0;
let totalWarnings = 0;
let failedFiles = 0;

console.log('Spanish Learning App — Data Validator (all themes)');
console.log('===================================================');
console.log('');

for (const locale of localeFolders) {
  const localeDir = path.join(DATA_ROOT, locale);
  console.log('📁 ' + locale);

  // Stage dirs = subdirs of data/<locale>/ that contain a themes/ subdir
  const stageDirs = fs.readdirSync(localeDir)
    .filter(f => {
      const p = path.join(localeDir, f);
      return fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, 'themes')) && fs.statSync(path.join(p, 'themes')).isDirectory();
    })
    .sort();

  for (const stage of stageDirs) {
    const themesDir = path.join(localeDir, stage, 'themes');
    const files = fs.readdirSync(themesDir).filter(f => f.endsWith('.json'));
    const manifestFile = stage + '.json';
    const contentFiles = files.filter(f => f !== manifestFile);

    // ── Load + check the in-theme-dir manifest ──
    let manifestData = null;
    let manifestErrors = [];
    const manifestPath = path.join(themesDir, manifestFile);
    if (!fs.existsSync(manifestPath)) {
      manifestErrors = ['stage dir ' + stage + ' has no in-theme-dir manifest themes/' + manifestFile + ' (app reads this for the theme list)'];
    } else {
      let parsed;
      try {
        parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        manifestData = parsed;
        manifestErrors = checkManifest(parsed, locale + '/' + stage + '/themes/' + manifestFile).errors;
      } catch (e) {
        manifestErrors = ['invalid JSON — ' + e.message];
      }
    }

    // ── Per-content-theme checks ──
    const fileStems = contentFiles.map(f => f.replace(/\.json$/, ''));
    for (const f of contentFiles) {
      const fp = path.join(themesDir, f);
      const label = locale + '/' + stage + '/themes/' + f;
      totalContent++;
      let data;
      try {
        data = JSON.parse(fs.readFileSync(fp, 'utf8'));
      } catch (e) {
        console.error('  ❌ ' + label + ': invalid JSON — ' + e.message);
        totalErrors++;
        failedFiles++;
        continue;
      }
      const r = checkTheme(data, label);
      if (r.errors.length) {
        console.error('  ❌ ' + label + ' [content]: ' + r.errors.length + ' error(s)');
        r.errors.forEach(e => console.error('       → ' + e));
        totalErrors += r.errors.length;
        failedFiles++;
      } else if (r.warnings.length) {
        totalWarnings += r.warnings.length;
        console.warn('  ⚠️  ' + label + ' [content]: ' + r.warnings.join('; '));
      } else {
        console.log('  ✅ ' + label + ' [content]: valid (' + r.vocabLen + ' vocab)');
      }
    }

    // ── Cross-check: in-theme-dir manifest ids  vs  content files ──
    if (manifestData && Array.isArray(manifestData.themes)) {
      const manifestIds = manifestData.themes.map(t => t && t.id).filter(Boolean);
      const dangling = manifestIds.filter(id => !fileStems.includes(id));
      const orphans = fileStems.filter(s => !manifestIds.includes(s));
      dangling.forEach(id => {
        console.error('  ❌ ' + locale + '/' + stage + ': DANGLING manifest id (no file) → ' + id + '.json');
        totalErrors++;
        failedFiles++;
      });
      orphans.forEach(s => {
        console.error('  ❌ ' + locale + '/' + stage + ': ORPHAN file (not in manifest) → ' + s + '.json');
        totalErrors++;
        failedFiles++;
      });
    }
    if (manifestErrors.length) {
      console.error('  ❌ ' + locale + '/' + stage + ' [manifest]: ' + manifestErrors.length + ' error(s)');
      manifestErrors.forEach(e => console.error('       → ' + e));
      totalErrors += manifestErrors.length;
      failedFiles++;
      totalManifests++;
    } else {
      totalManifests++;
      const n = manifestData ? (manifestData.themes ? manifestData.themes.length : 0) : 0;
      const crossOk = (manifestData && Array.isArray(manifestData.themes) &&
        manifestData.themes.map(t => t && t.id).filter(Boolean).length === fileStems.length) ? 'cross-checked ✓' : '';
      console.log('  ✅ ' + locale + '/' + stage + '/themes/' + manifestFile + ' [manifest]: valid (' + n + ' themes) ' + crossOk);
    }

    // ── Guard: root-level stage manifests are retired (ADR 0007) ──
    // The canonical manifest is themes/<stage>.json. A data/en-es/<stage>.json
    // file is a stale duplicate that predates the themes/ layout — if it
    // reappears, treat it as an error so the two sources of truth can't
    // silently diverge again.
    const rootManifest = path.join(localeDir, stage + '.json');
    if (fs.existsSync(rootManifest)) {
      totalRootManifests++;
      console.error('  ❌ ' + locale + '/' + stage + '.json [stale root manifest]: retired 2026-08-28 (ADR 0007) — the canonical manifest is themes/' + manifestFile + '. Delete the root file or move its data into the canonical one.');
      totalErrors++;
      failedFiles++;
    }

    console.log('');
  }
}

// ── Summary ──
console.log('──────────────────────────────────────────────────');
console.log('Summary:');
console.log('  Content themes validated:  ' + totalContent);
console.log('  Stage manifests validated: ' + totalManifests + ' (canonical, in themes/ dirs)');
if (totalRootManifests > 0) {
  console.log('  Stale root manifests found: ' + totalRootManifests + ' (ERROR — must be deleted, ADR 0007)');
}
console.log('──────────────────────────────────────────────────');

if (totalErrors > 0) {
  console.log('❌ ' + totalErrors + ' error(s) across ' + failedFiles + ' file(s)');
  process.exit(1);
}
if (totalWarnings > 0) {
  console.log('⚠️  ' + totalWarnings + ' warning(s) — non-blocking (content-completeness / self-description)');
} else {
  console.log('✅ All files valid!');
}
process.exit(0);
