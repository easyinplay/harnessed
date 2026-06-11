# Phase 12 — task_plan (tracking surface)

> Canonical spec = `12-PLAN.md`. Grounding = `findings.md`. Req = REQ-v60-sentinel-gate + REQ-v60-validation.

## Tasks (3, single TDD wave) — detail in 12-PLAN.md

- [x] **T12.1** RED — failing tests: checkPlanningSync unit (none_declared/missing/verified) + complete-path integration (block/override/synced/na)
- [x] **T12.2** GREEN — `checkPlanningSync` + `CheckPlanningSyncResult` in evidence.ts; wire into checkpoint.ts complete (allMissing merge, force→overridden, single mark)
- [x] **T12.3** REFACTOR + gate — biome + tsc + full vitest

## Acceptance (phase done = TRUE)

- `complete` blocks when `.planning/` present + STATE.md absent and no `--force`; passes with `--force` (overridden), when synced, or when no `.planning/` (none_declared).
- checkPlanningSync three-state verified; single ledger mark preserved (no new store).
- biome + tsc clean; full vitest green, no regression.
