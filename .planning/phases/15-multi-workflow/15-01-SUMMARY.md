# Phase 15 SUMMARY — multi-workflow migration (D / un-defer G5)

> Executed in the MAIN session (TDD red→green), 2026-06-13. Hand-driven — no autonomous planner/executor chain (the reverted rogue 14/15 came from one). NOT yet committed — awaiting user review.

## Outcome

Global singleton `current-workflow.json` → per-repo multi-workflow store `workflows.json` (arch A, behind-API). Concurrent repos no longer clobber each other's checkpoint state. The 17 source call sites and the `CurrentWorkflowV1` envelope schema are UNCHANGED.

## Tasks (TDD)

1. **schemaVersion + WorkflowStoreV1 + repoKey** — `workflowStore: 'harnessed.workflow-store.v1'` added (+ to `SchemaVersionLiteral` union); `WorkflowStoreV1` = `{schemaVersion, workflows: Record<repoKey, CurrentWorkflowV1>}`; `repoKey(cwd)` = pure fs walk-up to nearest `.git`, fallback resolve(cwd), no git subprocess.
2. **Store kernels + migration** — `readStoreRaw` (parse store; in-memory legacy fallback under repoKey WITHOUT writing; empty otherwise) + `writeStoreRaw` (lock-free atomic) + `listWorkflows`.
3. **CORE — state.ts rewire** — `readCurrentWorkflow` → `store.workflows[repoKey()] ?? null`; `writeCurrentWorkflowUnlocked` → write the repo slot + **dual-write** the legacy singleton (D7 rollback anchor). `mutateSubProgress` / `writeCurrentWorkflow` / `activate` / `pause` / `complete` unchanged — they compose the two rewired kernels, so the single-lock RMW + lock placement are preserved automatically.
4. **`harnessed workflows` CLI** (23rd subcommand) — lists every in-flight repo slot (key, phase, status).
5. **Verify gate** — below.

## Rogue defects fixed by construction

- **F4 (bolt-on cold index)** — the store IS the sole SoT reached through the same API; no second source to drift.
- **F5 (stale index)** — one write path (`writeCurrentWorkflowUnlocked`) targets the store slot; there is no separate index to forget to sync. The rogue's `switchWorkflow`-restores-stale-snapshot bug is structurally impossible.

## Two existing tests adapted (NOT source-consumer changes)

- `tests/unit/types-schemaVersion.test.ts` — 17→18 surfaces (legitimate: a new state surface was added). `toContain` list extended with `workflow-store`.
- `tests/cli/checkpoint-scale.test.ts` (SMALL) — its `process.cwd()` spy was broadened from "only during `complete`" to "the whole flow". **Honest note**: this surfaced a real behavioral change — state is now keyed by `repoKey(cwd)`, so a caller that changes cwd mid-workflow resolves a different slot. A real single CLI invocation runs under one stable cwd (the test's narrow spy was an artifact of the old cwd-independent singleton), so broadening the spy matches real usage and keeps the test's intent (scale sees a no-git cwd).

The 17 **source** consumers (compact, inject, checkpoint, next, status, resume, governance, generateCommands, engineHook, …) were NOT modified — behind-API held.

## Evidence

- TDD: workflowStore RED→GREEN (9 tests: repoKey ×2, schema ×2, kernels+migration ×5); state-store RED→GREEN (5 tests: per-repo isolation, null, migration persist, mutate RMW, dual-write).
- Typecheck: `tsc --noEmit` exit 0.
- Biome: `biome check src/ tests/` — 310 files, no fixes (clean).
- Full suite: **1256 passed | 5 skipped | 1 todo, 0 failed** (was 1242 pre-phase; +14 new, −0 regressions after the 2 adaptations).
- `git diff --stat`: state.ts + cli.ts + schemaVersion.ts + ROADMAP.md + 2 adapted tests; untracked new: `workflowStore.ts`, `workflows.ts`, `state-store.test.ts`, `workflowStore.test.ts`, phase docs.

## Acceptance (15-CONTEXT.md) — all met

1. ✅ repoKey walk-up + fallback, pure no subprocess
2. ✅ per-repo isolation (two repos coexist, neither clobbers)
3. ✅ migration verbatim + first-write persist + legacy retained + idempotent
4. ✅ mutateSubProgress single-lock RMW + no-op when unseeded
5. ✅ dual-write legacy anchor
6. ✅ `harnessed workflows` lists slots; 17 source consumers green
7. ✅ envelope schema unchanged; full gate green; biome clean

## Not done / deferred

- Removing the dual-write + legacy file (D7 says next phase, once the store is proven).
- Phases 16–19.
