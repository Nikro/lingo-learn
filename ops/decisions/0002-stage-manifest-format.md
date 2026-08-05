# ADR 0002 — Root Stage Files as Manifests Only

## Status
Accepted

## Context
Stage root files (`a1-1.json`, `b2-3.json`, etc.) were being validated against the theme content schema (which expects `vocabulary[]`, `grammar[]`, `exercises[]`), causing 136 validation errors. The files already contained the correct structure: `stage_id`, `title`, `description`, `themes[]`, `estimated_weeks` — but the validator treated them as incomplete theme files rather than manifests.

## Decision
Root stage files are **manifests** that describe what themes exist in a stage. They contain metadata and a list of theme references but NOT the actual content. Content lives in per-theme files under `data/{locale}/{stage}/themes/{theme}.json`.

A `stage_manifest` type was added to `data/schema.json` for explicit schema validation of these files. The validator (`data/validate.js`) detects manifest files via heuristic and skips them from theme-schema validation.

## Consequences
- Easier to review individual stage manifests (small files)
- Theme files are the source of truth for content
- Validator output now clearly separates manifest vs. theme validation
- Schema has a new `stage_manifest` definition for future use
- Root manifests now include `themes[]` arrays listing all canonical themes in each stage
