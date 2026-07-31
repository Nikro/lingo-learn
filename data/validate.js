#!/usr/bin/env node
/**
 * validate.js — Validates stage JSON files against schema.json.
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
          errors.push(`${path || 'root'}: missing required field '${key}'`);
        }
      }
    }

    // Additional properties
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(data)) {
        if (!schema.properties || !(key in schema.properties)) {
          errors.push(`${path || 'root'}: unexpected field '${key}'`);
        }
      }
    }

    // Validate properties
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in data) {
          errors.push(...validate(data[key], propSchema, `${path}.${key}`));
        }
      }
    }
  }

  if (schema.type === 'array' && Array.isArray(data)) {
    if (schema.items) {
      for (let i = 0; i < data.length; i++) {
        errors.push(...validate(data[i], schema.items, `${path}[${i}]`));
      }
    }
    if (data.length === 0) {
      errors.push(`${path}: array is empty`);
    }
  }

  if (schema.type === 'string' && typeof data !== 'string') {
    errors.push(`${path}: expected string, got ${typeof data}`);
  }

  if (schema.type === 'integer' && !Number.isInteger(data)) {
    errors.push(`${path}: expected integer, got ${typeof data}`);
  }

  if (schema.enum && !schema.enum.includes(data)) {
    errors.push(`${path}: enum violation, got '${data}', expected one of [${schema.enum.join(', ')}]`);
  }

  if (schema.pattern && typeof data === 'string' && !new RegExp(schema.pattern).test(data)) {
    errors.push(`${path}: pattern violation, value '${data}' doesn't match ${schema.pattern}`);
  }

  return errors;
}

// ─── Main ───

const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));

const targetLocale = process.argv[2] || null;
const dataDir = path.join(ROOT, path.dirname(SCHEMA_PATH.split('/schema.json')[0]).split('/data/')[1] || '..');

// Determine which locale folders to validate
let localeDirs;
if (targetLocale) {
  const p = path.join(ROOT, targetLocale);
  if (fs.existsSync(p)) {
    localeDirs = [targetLocale];
  } else {
    console.error(`Locale folder not found: ${p}`);
    process.exit(1);
  }
} else {
  localeDirs = fs.readdirSync(ROOT)
    .filter(f => fs.statSync(path.join(ROOT, f)).isDirectory() && f !== 'data');
  // Wait, schema.json is in ROOT. Data files are in subdirectories.
  // Actually schema.json is in the same dir as validate.js, which is data/
}

// Actually, schema.json and validate.js are both in data/
// Stage files are in data/{locale}/
// Let's fix: get locale dirs from data/
const localeFolders = fs.readdirSync(ROOT)
  .filter(f => fs.statSync(path.join(ROOT, f)).isDirectory() && f !== 'data')
  // If target specified, filter
  .filter(f => !targetLocale || f === targetLocale);

let totalErrors = 0;
let totalFiles = 0;

for (const folder of localeFolders) {
  const stageFiles = fs.readdirSync(path.join(ROOT, folder))
    .filter(f => f.endsWith('.json') && f !== 'schema.json');

  for (const file of stageFiles) {
    totalFiles++;
    const filePath = path.join(ROOT, folder, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Override root path for stage-specific validation
    const stageSchema = { ...schema, properties: { ...schema.properties } };
    const errors = validate(data, stageSchema, `${folder}/${file}`);

    if (errors.length > 0) {
      console.error(`❌ ${folder}/${file}: ${errors.length} error(s)`);
      for (const e of errors) {
        console.error(`   → ${e}`);
      }
      totalErrors += errors.length;
    } else {
      // Validate content quality
      const qualityWarnings = [];
      if (data.exercises.length === 0) {
        qualityWarnings.push('no exercises');
      }
      if (data.vocabulary.length < 5) {
        qualityWarnings.push(`only ${data.vocabulary.length} vocab items (suggested ≥5)`);
      }
      if (data.grammar.length === 0) {
        qualityWarnings.push('no grammar content');
      }
      if (data.verbs.length === 0) {
        qualityWarnings.push('no verb entries');
      }
      if (data.pronunciation.length === 0) {
        qualityWarnings.push('no pronunciation content');
      }

      if (qualityWarnings.length > 0) {
        console.warn(`⚠️  ${folder}/${file}: ${qualityWarnings.join(', ')}`);
        totalErrors += qualityWarnings.length;
      } else {
        console.log(`✅ ${folder}/${file}: valid (${data.grammar.length} grammar, ${data.vocabulary.length} vocab, ${data.verbs.length} verbs, ${data.pronunciation.length} pronunciation, ${data.exercises.length} exercises)`);
      }
    }
  }
}

console.log(`\n${totalFiles} file(s) validated.`);
if (totalErrors > 0) {
  console.log(`${totalErrors} issue(s) found.`);
  process.exit(1);
} else {
  console.log('All files valid!');
  process.exit(0);
}
