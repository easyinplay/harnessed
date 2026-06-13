# Phase 14 CONTEXT — compact 做实 (B)

> Captured from v7.0 milestone discuss + Phase 14 subtask-gate clarification (2026-06-13, AskUserQuestion). Planned in the MAIN session (no autonomous planner/checker chain — the Phase 13 run had one go rogue and auto-execute 14/15). This CONTEXT + the PLAN are author-controlled.

## Goal

Turn the stubbed `compact()` in `src/checkpoint/compact.ts` into real, measured ledger compaction: summarize + evict resolved sub-progress entries, report a real token reduction, and wire both a manual CLI and an auto threshold trigger — WITHOUT destroying the G6 loop-detection signal.

## Current state (verified)

- `src/checkpoint/compact.ts` has real `shouldCompact(currentTokens, opts)` (≥75% of context window) + a **placeholder `compact()`** that only `console.warn`s. `compact()` is NOT wired anywhere (grep: zero refs in `checkpoint.ts`/`cli.ts`).
- `SubProgressEntry` (schema/currentWorkflow.v1.ts): `sub, status(pending|done|failed|skipped|rejected), gate_fired, reason?, evidence_status?, evidence?, fail_count?`. Schema comment: **`fail_count` increments only on `->failed` transitions and drives `breakLoop` (G6); `rejected` is terminal, does NOT increment.**
- `breakLoop.ts` (G6) detects loops via `entries.filter(e => (e.fail_count ?? 0) >= 3)`. Any compaction that drops entries carrying `fail_count` blinds G6 — this is exactly the defect (F1) in the reverted rogue impl (`.planning/phases/_rogue-impl-reference/phase14-compact-4b3510e.patch`).
- No shared `estimateTokens` helper exists; the project's token heuristic is inline `Buffer.byteLength(JSON.stringify(x)) / 4` (see `check-token-budget.ts`).
- State I/O: `readCurrentWorkflow()`, `writeCurrentWorkflow(s)`, `mutateSubProgress(...)` in `state.ts`.

## Locked decisions

- **D1 — compaction = summarize + evict resolved** (user choice). Evictable set = `status ∈ {done, skipped, rejected} AND (fail_count ?? 0) === 0`. Everything else is PRESERVED: all `pending`, all `failed`, and **any entry with `fail_count > 0` regardless of status**.
- **D2 — G6 invariant is a hard constraint, not a nice-to-have**: no entry carrying `fail_count > 0` may be evicted. A dedicated regression test asserts `breakLoop` still fires after a compaction (fixes rogue F1).
- **D3 — summarize, don't just drop** (user choice "summarize+evict"): evicted entries collapse into a one-line/structured digest retained on the envelope so resume keeps a human-readable trace of what was compacted. Store via an **additive-optional** `compacted_summary` field (counts by status + cumulative evicted + last_at). Additive-optional → NO `schemaVersion` bump (sister convention: `sub_progress`/`verify_mode`/`auto_transition` were all added this way; old files `Value.Check`-pass).
- **D4 — real token measure** (ROADMAP goal "measured token reduction"): report `pct_saved` as a TOKEN percentage using `Buffer.byteLength(JSON.stringify(before/after)) / 4` (sister to the project /4 heuristic), NOT an entry-count percentage (rogue F2 reported entry %).
- **D5 — trigger = manual CLI + auto threshold** (user choice). Manual: `harnessed compact`. Auto: `checkpoint complete` gains an optional `--tokens <n>`; when provided AND `shouldCompact(n)` fires, auto-run compaction after the done-mark. When `--tokens` absent → auto path is a **silent no-op** (do not fabricate a conversation-token count); manual still works. This preserves `shouldCompact`'s existing conversation-budget semantics.
- **D6 — integrate, don't bolt on** (fixes rogue F3): the real logic replaces/extends the placeholder `compact()` in the SAME module and reuses `shouldCompact`; do not append a second disconnected code path.
- **D7 — TDD red-first**: this is core checkpoint logic → write failing tests first (per project TDD mandate for state-machine core).

## Scope

- `src/checkpoint/compact.ts`: pure `compactLedger(entries)` (partition evictable/kept + build digest + token metrics) + impure `compactWorkflow(opts?)` (read → compactLedger → write kept + accumulate `compacted_summary` → return token-measured result); make placeholder `compact()` delegate or remove it.
- `src/checkpoint/schema/currentWorkflow.v1.ts`: add additive-optional `compacted_summary` field (no schemaVersion bump).
- `src/cli/compact-cmd.ts` (NEW) + register in `src/cli.ts`: `harnessed compact` manual command printing token metrics + digest.
- `src/cli/checkpoint.ts`: `checkpoint complete` optional `--tokens <n>` auto-trigger (post-done-mark, gated by `shouldCompact`).
- `tests/checkpoint/compact.test.ts`: TDD coverage (see acceptance).

## Out of scope (do NOT touch)

- Phases 15–19 (multi-workflow, learning loop, etc.). Phase 14 stays on the singleton current-workflow.
- `schemaVersion` bump (D3 keeps it additive-optional).
- spec/brainstorm context-block compression (that was the bigger option C; NOT chosen — ledger summarize+evict only).
- `breakLoop.ts` / G6 logic itself (only protect its input).
- Any cherry-pick from the rogue patch (known-defective; reference only).

## Invariants

- G6: no `fail_count > 0` entry evicted; regression test proves `breakLoop` still fires post-compact.
- Additive-only schema (no version bump); old files still parse.
- KARPATHY-minimal; integrate with existing `shouldCompact` (no duplicate path).
- TDD red→green; full gate green vs the 1188-test baseline; Windows CI green.
- Biome preempt before commit (`corepack pnpm exec biome check --write`).
- NEVER `git add -A`; explicit file lists. NEVER push without approval.

## Acceptance

1. `compactLedger`: evicts only `{done,skipped,rejected}∧fail_count==0`; preserves all pending/failed/`fail_count>0`; returns kept + structured digest + before/after token estimate. (unit-tested incl. empty ledger)
2. **G6 regression**: a ledger with a `done` entry carrying `fail_count=3` is NOT evicted; `breakLoop` still returns it post-compact. (the F1-fix test)
3. `compactWorkflow`: round-trips through state I/O, accumulates `compacted_summary`, reports real token `pct_saved` (Buffer/4), no-op when nothing evictable.
4. `harnessed compact` prints token-measured result; `checkpoint complete --tokens <n>` auto-compacts iff `shouldCompact(n)`; silent no-op without `--tokens`.
5. Additive schema: a pre-Phase-14 `current-workflow.json` (no `compacted_summary`) still `Value.Check`-passes.
6. Full test gate green; biome clean; docs/STATE synced.
