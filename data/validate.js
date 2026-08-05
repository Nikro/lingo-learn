#!/usr/bin/env node
/**
 * validate.js — Validates stage/theme JSON files against schema.json.
 *
 * Root stage files (e.g., a1-1.json in data/en-es/) are **manifests**:
 *   stage_id, title, description, estimated_weeks, themes[]
 *
 * Theme files (e.g., a1-1/themes/greetings-introductions.json) are **content**:
 *   id, title, description, vocabulary[], grammar[], exercises[], pronunciation[], etc.
 *
 * Usage: node validate.js [locale-folder]
 *   e.g.   node validate.js                    (validates all locale folders)
 *          node validate.js en-es              (validates en-es only)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.dirname(__filename);
const SCHEMA_PATH = path.join(ROOT, 'schema.json');

// ─── Simple JSON Schema Validator (minimal, no deps) ───

function validate(data, schema, path = '') {
  const errors = [];

  if (schema.type === 'object') {
    // Required fields
    if (schema.required) {
      for (const key of schema.required) {
        if (!(key in data)) {
          errors.push((path || 'root') + ': missing required field ' + JSON.stringify(key));
        }
      }
    }

    // Additional properties
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(data)) {
        if (!schema.properties || !(key in schema.properties)) {
          errors.push((path || 'root') + ': unexpected field ' + JSON.stringify(key));
        }
      }
    }

    // Validate properties
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in data) {
          errors.push(...validate(data[key], propSchema, (path ? path + '.' : '') + key));
        }
      }
    }
  }

  if (schema.type === 'array' && Array.isArray(data)) {
    if (schema.items) {
      for (let i = 0; i < data.length; i++) {
        errors.push(...validate(data[i], schema.items, (path ? path + '[' : '') + i + ']'));
      }
    }
  }

  if (schema.type === 'string' && typeof data !== 'string') {
    errors.push((path || 'root') + ': expected string, got ' + typeof data);
  }

  if (schema.type === 'integer' && !Number.isInteger(data)) {
    errors.push((path || 'root') + ': expected integer, got ' + typeof data);
  }

  if (schema.enum && !schema.enum.includes(data)) {
    errors.push((path || 'root') + ': enum violation, got ' + JSON.stringify(data) + ', expected one of [' + schema.enum.join(', ') + ']');
  }

  if (schema.pattern && typeof data === 'string' && !new RegExp(schema.pattern).test(data)) {
    errors.push((path || 'root') + ': pattern violation, value ' + JSON.stringify(data) + ' doesn\'t match ' + schema.pattern);
  }

  return errors;
}

// ─── Format detection ───

function detectFormat(data) {
  // Manifest: has themes[] and no content sections
  // Content: has vocabulary, grammar, exercises, pronunciation, etc.
  const contentKeys = ['vocabulary', 'grammar', 'exercises', 'pronunciation', 'verbs', 'dialogues', 'culture_notes'];
  const hasContent = contentKeys.some(k => data[k] && Array.isArray(data[k]) && data[k].length > 0);

  if (data.file_type) return data.file_type;
  if (hasContent) return 'content';
  return 'manifest';
}

// ─── Manifest-only validation (only validate manifest-relevant fields) ───

function validateManifest(data, schema, fileLabel) {
  const errors = [];

  // Check at least one identifier is present
  if (!data.id && !data.stage_id) {
    errors.push(fileLabel + ': missing identifier (needs id or stage_id)');
  }

  // Normalize stage_id → id for consistency
  if (!data.id && data.stage_id) {
    data.id = data.stage_id;
  }

  // Validate against the full schema (manifest fields are a subset)
  const stageSchema = { ...schema, properties: { ...schema.properties } };
  const stageErrors = validate(data, stageSchema, fileLabel);

  // Manifest-specific: themes array is required and must be non-empty
  if (!data.themes || !Array.isArray(data.themes) || data.themes.length === 0) {
    errors.push(fileLabel + ': manifest must have a non-empty themes[] array');
  } else {
    // Validate each theme has id and title
    for (let i = 0; i < data.themes.length; i++) {
      const theme = data.themes[i];
      if (typeof theme !== 'object') {
        errors.push(fileLabel + '.themes[' + i + ']: expected object, got ' + typeof theme);
      } else {
        if (!theme.id) errors.push(fileLabel + '.themes[' + i + ']: missing theme id');
        if (!theme.title) errors.push(fileLabel + '.themes[' + i + ']: missing theme title');
      }
    }
  }

  return errors;
}

// ─── Content-only validation (theme files with full content) ───

function validateContent(data, schema, fileLabel) {
  // Check at least one identifier is present
  if (!data.id && !data.stage_id) {
    return [fileLabel + ': missing identifier (needs id or stage_id)'];
  }

  // Normalize stage_id → id for consistency
  if (!data.id && data.stage_id) {
    data.id = data.stage_id;
  }

  const stageErrors = validate(data, schema, fileLabel);

  // Content quality checks
  const qualityWarnings = [];
  if (!data.exercises || data.exercises.length === 0) {
    qualityWarnings.push('no exercises');
  }
  if (!data.vocabulary || data.vocabulary.length < 5) {
    qualityWarnings.push(data.vocabulary ? 'only ' + data.vocabulary.length + ' vocab items (suggested ≥5)' : 'no vocabulary');
  }
  if (!data.grammar || data.grammar.length === 0) {
    qualityWarnings.push('no grammar content');
  }
  if (!data.verbs || data.verbs.length === 0) {
    qualityWarnings.push('no verb entries');
  }
  if (!data.pronunciation || data.pronunciation.length === 0) {
    qualityWarnings.push('no pronunciation content');
  }

  return { schemaErrors: stageErrors, qualityWarnings };
}

// ─── Main ───

const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));

const targetLocale = process.argv[2] || null;

// Get locale folders from ROOT (data/ directory)
const localeFolders = fs.readdirSync(ROOT)
  .filter(f => {
    const fp = path.join(ROOT, f);
    return fs.statSync(fp).isDirectory() && f !== 'data';
  })
  .filter(f => !targetLocale || f === targetLocale);

let totalFiles = 0;
let manifestCount = 0;
let contentCount = 0;
let structureCount = 0;
let totalSchemaErrors = 0;
let totalQualityWarnings = 0;
let failedFiles = 0;

console.log('Spanish Learning App — Data Validator');
console.log('======================================');
console.log('');

for (const folder of localeFolders) {
  console.log('📁 ' + folder);

  const files = fs.readdirSync(path.join(ROOT, folder))
    .filter(f => f.endsWith('.json'));

  for (const file of files) {
    const filePath = path.join(ROOT, folder, file);
    const fileLabel = folder + '/' + file;
    totalFiles++;

    let data;
    try {
      data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.error('❌ ' + fileLabel + ': invalid JSON — ' + e.message);
      totalSchemaErrors++;
      failedFiles++;
      continue;
    }

    // ── Detect file format ──
    const format = detectFormat(data);

    // Special case: master-structure.json (curriculum overview with version/levels)
    if (data.version && data.levels && !data.stage_id && !data.id) {
      console.log('  📋 ' + fileLabel + ': curriculum structure (skipped)');
      structureCount++;
      continue;
    }

    // Skip non-stage/theme files (schema.json shouldn't be in locale folders anyway)
    if (file === 'schema.json') {
      console.log('  ⏭️  ' + fileLabel + ': schema file (skipped)');
      continue;
    }

    // ── Validate based on format ──
    if (format === 'manifest') {
      manifestCount++;
      const errors = validateManifest(data, schema, fileLabel);
      if (errors.length > 0) {
        console.error('  ❌ ' + fileLabel + ' [manifest]: ' + errors.length + ' error(s)');
        for (const e of errors) {
          console.error('     → ' + e);
        }
        totalSchemaErrors += errors.length;
        failedFiles++;
      } else {
        const themeCount = data.themes ? data.themes.length : 0;
        console.log('  ✅ ' + fileLabel + ' [manifest]: valid (' + themeCount + ' themes)');
      }
    } else {
      // format === 'content'
      contentCount++;
      const result = validateContent(data, schema, fileLabel);
      if (result.schemaErrors.length > 0) {
        console.error('  ❌ ' + fileLabel + ' [content]: ' + result.schemaErrors.length + ' error(s)');
        for (const e of result.schemaErrors) {
          console.error('     → ' + e);
        }
        totalSchemaErrors += result.schemaErrors.length;
        failedFiles++;
      } else if (result.qualityWarnings.length > 0) {
        totalQualityWarnings += result.qualityWarnings.length;
        console.warn('  ⚠️  ' + fileLabel + ' [content]: ' + result.qualityWarnings.join(', '));
      } else {
        const gLen = (data.grammar || []).length;
        const vLen = (data.vocabulary || []).length;
        const vbLen = (data.verbs || []).length;
        const pLen = (data.pronunciation || []).length;
        const eLen = (data.exercises || []).length;
        console.log('  ✅ ' + fileLabel + ' [content]: valid (' + gLen + ' grammar, ' + vLen + ' vocab, ' + vbLen + ' verbs, ' + pLen + ' pron, ' + eLen + ' exercises)');
      }
    }
  }

  console.log('');
}

// ── Summary ──
console.log('───────────────────────────────────────');
console.log('Summary: ' + totalFiles + ' file(s) processed');
console.log('  Manifests: ' + manifestCount);
console.log('  Content:   ' + contentCount);
console.log('  Skipped:   ' + structureCount);
console.log('───────────────────────────────────────');

if (totalSchemaErrors > 0) {
  console.log('❌ ' + totalSchemaErrors + ' schema error(s) across ' + failedFiles + ' file(s)');
  process.exit(1);
}

if (totalQualityWarnings > 0) {
  console.log('⚠️  ' + totalQualityWarnings + ' quality warning(s) — these are non-blocking');
} else {
  console.log('✅ All files valid!');
}

process.exit(totalSchemaErrors > 0 ? 1 : 0);
