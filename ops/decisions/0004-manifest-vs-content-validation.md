# ADR 0004 — Separate manifest and content validation paths

## Status

Accepted

## Context

Root stage files (e.g., `a1-1.json` in `data/en-es/`) are **manifests**: they contain stage metadata (`stage_id`, `title`, `description`, `estimated_weeks`) and a `themes[]` array listing the themes in the stage. They do NOT contain full content (no `vocabulary[]`, `grammar[]`, `exercises[]`).

Theme files under `data/en-es/{stage}/themes/*.json` are **content**: they contain full curriculum content (`vocabulary[]`, `grammar[]`, `exercises[]`, etc.).

The previous validator used a fragile heuristic (`has themes but no grammar/vocab/exercises → skip`) to avoid validating manifests against the content schema. This was a workaround, not a proper solution.

## Decision

1. **Root stage files are manifests** — they contain only metadata + theme list.
2. **Schema updated** with `file_type` discriminator field (`"manifest"` or `"content"`), auto-detected if omitted.
3. **Validator distinguishes manifests from content** using format detection:
   - **Manifest**: has `themes[]`, no content sections (vocabulary, grammar, exercises, pronunciation). Validated for manifest-specific constraints (non-empty themes, theme id/title).
   - **Content**: has content sections. Validated for schema compliance + quality checks.
4. **Output labels each file** with its format: `[manifest]` or `[content]`.
5. **Quality warnings** for content files remain non-blocking (they flag incomplete content, not schema errors).

## Consequences

- **Easier**: New developers understand the manifest vs content distinction immediately. The validator output makes the distinction explicit.
- **Harder**: None — this simplifies rather than complicates.
- **Manifest files** no longer need to contain content fields (vocabulary, grammar, etc.), keeping them small and reviewable.
- **Theme files** with a `level` field (not in schema) are still not validated by default since they live in subdirectories. Future work can add recursive validation.
