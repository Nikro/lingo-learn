# ADR 0001 — Agent docs, durable decisions, and scratch space

## Status
Accepted

## Context
This repository is being iterated on by humans and AI agents. Agents need enough guidance to make useful progress, but the repo should not collect temporary files, copied framework docs, or generated clutter.

## Decision
- Keep long-lived agent rules in `AGENTS.md`.
- Keep practical implementation hints in `HINTS.md`.
- Keep durable project decisions in `ops/decisions/` as small ADR-style Markdown files.
- Use `/tmp` or the ignored root-level `workspace/` folder for scratch work.
- Do not commit scratch files, local exports, generated logs, copied full documentation dumps, or credentials.

## Consequences
Future agents have a clear place to record decisions without bloating the app source or mixing temporary artifacts into version control.
