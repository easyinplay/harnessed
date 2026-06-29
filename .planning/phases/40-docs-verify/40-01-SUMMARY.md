# Phase 40 — docs + verify (W4) — SUMMARY

> v12.0 Forward Continuation, Wave 4 (close). Plan SoT = `.planning/specs/2026-06-30-forward-continuation-design.md` §7.

## Done

- **Full-gate verify (combined W1–W3)**: vitest **1673 passed / 0 failed** (`--no-file-parallelism`) · `tsc --noEmit` **0** · biome clean (11 v12 files) · `check-skill-i18n-parity` / `check-yaml-i18n-parity` / `check-workflow-schema` / `check-deferred-items` / `check-transparency-verdicts` / `check-state-archive-stale` all OK. (`check-provenance` fails only on the gitignored local `.harnessed/` artifact — unrelated.)
- **CHANGELOG** `## [Unreleased]` populated: Added = Forward continuation (deriveNext / `harnessed next` exit-codes / `harnessed advance` + gate / per-turn NEXT-UNIT); Fixed = issue #2 (SKILL inline state-machine + ship orchestrator) — both pushed-not-released, now staged for the next version bump.
- **STATE** synced to "v12.0 core BUILT + GREEN, npm UNPUBLISHED".

## Deferred to the release step (ride npm 4.10.0)

- harnessed-site `reference/cli.md` (en+zh): document `harnessed next` (extended) + `harnessed advance` — premature to publish on the live site while npm is still 4.9.1 (users wouldn't have the command).
- README forward-continuation mention + the 9 localized READMEs (vs-native + three-layer-stack backfill).
- Optional D5 `gsd_run query` reuse (per-turn parity risk; native scan is the complete floor).
- Task-level CLI surface (resolver-ready; OQ-2 phase-level is the shipped floor).

## Phases

P37 ✅ deriveNext core · P38 ✅ next/advance CLI · P39 ✅ per-turn pointer · P40 ✅ verify + changelog. Milestone core complete; release = user decision (would bundle the pushed-not-released issue #2 fix).
