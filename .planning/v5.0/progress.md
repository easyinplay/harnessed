# progress — harnessed v5.0 State Machine Core

## Session 1 — 2026-06-05 (design + plan)
- Researched Trellis + comet state machines (2 parallel agents). Reports → comparison.
- brainstorm: locked 7 design decisions (scope/progression/storage/migration/seed/evidence/handoff).
- gstack /plan-eng-review: 3 findings → 3 decisions D1 (single SoT) / D2 (three-state evidence) / D3 (two-step seed + generated body + recover degrade).
- Wrote `.planning/v5.0/STATE-MACHINE-CORE-DESIGN.md` + `docs/adr/0033-*.md` (updated w/ D1/D2/D3).
- Created planning files (task_plan/findings/progress).
- **Next:** Phase 1 schema extension → Phase 2 ledger TDD.

## Status
- [x] Phase 1 schema (committed fc19318)
- [x] Phase 2 ledger.ts (TDD, 14 tests)
- [x] Phase 3 evidence.ts (TDD, 8 tests)
- [x] Phase 4 checkpoint.ts wiring (mutateSubProgress 单锁 RMW + 三态守卫; ledger-state 6 tests + checkpoint CLI 10 tests)
- [x] Phase 5 status --recover + resume drift (status-recover 8 tests + resume drift 4)
- [x] Phase 6 generateCommands ORCHESTRATOR body (确定性 gates→start→complete/fail+recover 序列, generate-commands +5 cells)
- [x] Phase 7 verify/* artifacts_expected backfill (committed fc19318; simplify left none_declared, pending decision)
- [~] Phase 8 release gate — e2e ✅ + verify ✅ (2 reviewers, 2 P0 + 5 P1 全修, 见 REVIEW-FINDINGS.md); 待: version bump 4.2.0 + CHANGELOG + STATE
- Verify (2026-06-05): code-reviewer 5-dim + ts-reviewer 并行 → P0-A evidence base 错位(用 cwd + 绝对路径修) / P0-B path traversal(checkPathSafe) / 5 P1 全修 + 回归测试; e2e 双证两 P0; 1166 passed

## Session 2 — 2026-06-05 (GSD reconcile + Wave 0/1)
- GSD .planning reconciliation: regenerated PROJECT/STATE/ROADMAP/REQUIREMENTS via gsd-ingest-docs (commit a4d1a5e). Archived stale version-dir clutter to .planning/archive/.
- Wave 0 committed (fc19318): Phase 1 schema + Phase 7 verify backfill.
- Wave 1 done: Phase 2 ledger.ts (14 tests RED→GREEN) + Phase 3 evidence.ts (8 tests, reuses resolveWorkflowYaml).
- **Next:** Wave 2 = Phase 4 checkpoint.ts CLI wiring (depends on ledger + evidence).

## Test results
- Full suite after Wave 1: 1137 passed | 5 skipped | 1 todo (139 files). tsc 0, biome clean.
