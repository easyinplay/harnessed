# Phase 15 CONTEXT — multi-workflow migration (D / un-defer G5)

> Locked from v7.0 milestone discuss + Phase 15 design clarification (2026-06-13, conversational — user picked arch A, key=repo-root, multi-workflow is a real need). Planned + executed in the MAIN session (no autonomous planner/checker chain — the Phase 13 run had one go rogue and auto-commit a defective 14/15; the reverted impl is reference-only at `.planning/phases/_rogue-impl-reference/`).

## Goal

Replace the global singleton `current-workflow.json` with a per-repo multi-workflow store, so concurrent projects stop clobbering each other's checkpoint state — without changing the 17 call sites and without losing existing singleton data.

## Problem (verified)

- `getHarnessedRoot()` = `~/.claude/harnessed` → checkpoint state is **GLOBAL**, shared by every repo on the machine.
- `current-workflow.json` is a singleton; `activate(phase)` overwrites it wholesale. Working in repo A (phase 14) then running `checkpoint start` in repo B **clobbers** repo A's ledger. This is a latent data-loss footgun, and the comet/Trellis gap (comet multi-Spec, Trellis multi-task).
- All 17 consumers route through `readCurrentWorkflow()` / `writeCurrentWorkflow()` / `mutateSubProgress()` in `state.ts`. The filename literal lives only in `state.ts` (`statePath() = harnessedFile('current-workflow.json')`).

## Locked decisions

- **D1 — Architecture A (behind-API multi-store)**: `readCurrentWorkflow`/`writeCurrentWorkflow`/`mutateSubProgress` keep their signatures; their internals operate on the **active repo's slot** inside a multi-store. The 17 call sites do NOT change. Fixes rogue F4 (the store IS the sole SoT, not a bolt-on index) and F5 (one write path → no separate index to leave stale) by construction.
- **D2 — Key = repo-root**: each slot is keyed by the nearest ancestor directory of `process.cwd()` containing `.git`, falling back to the normalized cwd when none. Pure fs walk-up — NO `git` subprocess (testable, deterministic). NOT cwd+phase (harnessed runs phases sequentially per repo → one active workflow per repo; per-phase keying just accumulates stale done-phase slots + makes "active for this repo" ambiguous).
- **D3 — Active is implicit by cwd**: resolution is `store.workflows[repoKey(process.cwd())]`. `cd`-ing between repos auto-switches the active workflow. NO explicit `active` pointer field, NO `resume --switch` UI (both were the rogue's stale-index idea; unnecessary when cwd auto-resolves). Simplest model.
- **D4 — Store shape (single file)**: `~/.claude/harnessed/workflows.json` = `{ schemaVersion: 'harnessed.workflow-store.v1', workflows: Record<repoKey, CurrentWorkflowV1> }`. Envelope schema UNCHANGED (reuse `CurrentWorkflowV1`). Single file (not a dir) — karpathy-minimal, one `atomicWrite`, fits existing `proper-lockfile` infra; dir-per-workflow is premature at harnessed's scale (revisit only if real multi-process lock contention appears).
- **D5 — Compat-read migration (zero data loss)**: when `workflows.json` is absent but legacy `current-workflow.json` exists, the legacy envelope is surfaced under `repoKey(cwd)` — IN MEMORY on reads (reads stay side-effect-free), PERSISTED on the next locked write. The legacy file is NOT deleted (rollback anchor). Idempotent: once `workflows.json` exists, the legacy file is never re-read. Honest caveat (documented + logged): the legacy singleton has no repo attribution, so it is filed under whatever repo first reads it; data is never lost (worst case = filed under one wrong key once, recoverable via its `phase` field).
- **D6 — Lock semantics preserved**: the store's raw read/write are lock-FREE kernels (sister `writeCurrentWorkflowUnlocked`); all locking + the single-lock read-modify-write stay in `state.ts` (`withLock`). `mutateSubProgress` remains a single-lock RMW over the resolved slot (no double-lock, no lost-update — preserves pre-v4 C5 fix).
- **D7 — Rollback window (dual-write, one release)**: on every write, ALSO write the active repo's envelope back to the legacy `current-workflow.json`. This keeps a code-revert safe for one release (reverting readers still find current data in the legacy file). Remove the dual-write in a later phase once the store is proven. (Mitigates the inherent rollback-hostility of a breaking on-disk change.)
- **D8 — TDD red-first**: core checkpoint state → failing tests first.

## Scope

- `src/checkpoint/workflowStore.ts` (NEW): `WorkflowStoreV1` TypeBox schema + type; `repoKey(cwd)` pure walk-up; `readStoreRaw()` (parse workflows.json; in-memory legacy fallback; empty store otherwise); `writeStoreRaw(store)` lock-free atomic; `listWorkflows()`.
- `src/checkpoint/state.ts`: rewrite the internals of `readCurrentWorkflow` / `writeCurrentWorkflow` (+ unlocked kernel) / `mutateSubProgress` to resolve+mutate the `repoKey` slot in the store; keep `withLock` placement; add the D7 dual-write to legacy.
- `src/cli/workflows.ts` (NEW) + register in `src/cli.ts`: `harnessed workflows` — list all in-flight repos (key, phase, status).
- `src/types/schemaVersion.ts`: add `workflowStore: 'harnessed.workflow-store.v1'`.
- `tests/checkpoint/workflowStore.test.ts` + extend `tests/checkpoint/ledger-state.test.ts` / state tests for the per-repo isolation + migration.

## Out of scope (do NOT touch)

- The `CurrentWorkflowV1` envelope schema (reused as-is; no field changes).
- The 17 call sites (compact, inject, checkpoint, next, status, resume, governance, etc.) — they keep calling the same 3 functions.
- Phases 16–19.
- An explicit `active` pointer / `resume --switch` UI (D3 — not needed).
- Deleting the legacy `current-workflow.json` (D5/D7 — kept as anchor).
- `git` subprocess for repo detection (D2 — pure fs walk-up).
- Any cherry-pick from the rogue patch (F4/F5 defective; reference only).

## Invariants

- 17 call sites unchanged; `readCurrentWorkflow()` returns `null` exactly as today when the current repo has no slot.
- Zero data loss: legacy singleton migrates verbatim; legacy file retained; dual-write rollback window.
- Lock semantics intact: single-lock RMW for `mutateSubProgress`, no lost-update, no double-lock deadlock.
- KARPATHY-minimal surgical diff; TDD red→green; full gate green vs the post-Phase-14 baseline; Windows CI green.
- Biome preempt before commit; NEVER `git add -A`; NEVER push without approval.

## Acceptance

1. `repoKey(cwd)`: returns nearest ancestor with `.git`; falls back to normalized cwd; pure, no subprocess. (unit)
2. Per-repo isolation: a workflow under repoKey A and one under repoKey B coexist in `workflows.json`; `readCurrentWorkflow()` from cwd∈A returns A's, from cwd∈B returns B's; neither clobbers the other. (the core anti-clobber test)
3. Migration: a fixture with only legacy `current-workflow.json` → `readCurrentWorkflow()` returns it verbatim; first write persists `workflows.json` under repoKey(cwd); legacy file still on disk; second run does not re-migrate. (zero-loss)
4. `mutateSubProgress` still single-lock RMW over the resolved slot; concurrent calls don't lost-update; no-op when the slot is unseeded. (preserve C5)
5. Dual-write: after a write, the legacy `current-workflow.json` holds the current repo's envelope (rollback anchor).
6. `harnessed workflows` lists every slot (key, phase, status). All 17 existing consumers still green (no signature change).
7. Additive elsewhere: `CurrentWorkflowV1` unchanged; full test gate green; biome clean.
