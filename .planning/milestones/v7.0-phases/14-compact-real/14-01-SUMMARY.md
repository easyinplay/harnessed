# Phase 14 SUMMARY — compact 做实 (B)

> Executed in the MAIN session (TDD red→green), 2026-06-13. No autonomous planner/executor chain (the Phase 13 run had one go rogue + auto-commit 14/15; this was hand-driven for control). NOT yet committed at time of writing — awaiting user review.

## Outcome

`src/checkpoint/compact.ts` placeholder `compact()` (warn-only) → real **summarize+evict** ledger compaction with a manual CLI + an auto threshold trigger, G6-safe.

## Tasks (TDD)

1. **Schema additive field** — `compacted_summary` (`{evicted, by_status, last_at}`) added to `CurrentWorkflowV1`, `additionalProperties:false`, NO `schemaVersion` bump. Back-compat proven: a pre-Phase-14 envelope (no field) still `Value.Check`-passes.
2. **`compactLedger` (pure)** — evicts only `status∈{done,skipped,rejected} ∧ (fail_count??0)===0`; preserves all pending/failed/`fail_count>0`. Returns `{kept, evicted, by_status, before_tokens, after_tokens, pct_saved, digest}`. Token metric = `Buffer.byteLength(JSON.stringify)/4` (real token %, not entry %).
3. **`compactWorkflow` (impure)** — read→compactLedger→write kept + accumulate `compacted_summary` (monotonic). No-op (no write) when no active workflow or nothing evictable. `shouldAutoCompact(tokens?)` = `tokens!=null && shouldCompact(tokens)`.
4. **CLI + auto-trigger** — `harnessed compact` (22nd subcommand) manual path; `checkpoint complete --tokens <n>` auto-compacts after the done-mark iff `shouldAutoCompact(n)`; silent no-op without `--tokens`. Surgical: appended after `completePhase`, existing evidence-guard/done-mark logic untouched.
5. **Verify gate** — below.

## Rogue defects fixed by design

- **F1 (G6 regression)** — `isEvictable` excludes any `fail_count>0` entry. Regression test: a `done` entry with `fail_count=3` is NOT evicted and `detectLoop(kept)` still returns it.
- **F2 (fake token metric)** — `pct_saved` is a real `Buffer/4` token percentage, not entry count.
- **F3 (bolt-on path)** — logic lives in the same module, reuses `shouldCompact`; placeholder removed (was zero-ref).

## Evidence

- TDD: RED first (`13 failed | 7 passed`) → GREEN (`20 passed`) on `tests/checkpoint/compact.test.ts` (+13 new: compactLedger ×5, shouldAutoCompact ×3, compactWorkflow ×4, schema ×2 — incl. the G6 regression + back-compat).
- Typecheck: `tsc --noEmit` exit 0.
- Biome: `biome check src/ tests/` — 306 files, no fixes (clean).
- Full suite: **1242 passed | 5 skipped | 1 todo, 0 failed**.
- `git diff --stat`: ROADMAP.md (+1 Plans line) + compact.ts + currentWorkflow.v1.ts + cli.ts + checkpoint.ts + compact.test.ts; untracked new: `src/cli/compact-cmd.ts` + phase docs.

## Acceptance (14-CONTEXT.md) — all met

1. ✅ evict predicate + preserve pending/failed/fail_count>0 (unit, incl. empty)
2. ✅ G6 regression (done+fail_count=3 kept, breakLoop fires)
3. ✅ compactWorkflow round-trip + compacted_summary accumulation + real token pct + no-op
4. ✅ manual CLI + `--tokens` auto-trigger + silent no-op without tokens
5. ✅ additive schema (old file Value.Check-passes, no version bump)
6. ✅ full gate green; biome clean

## Not done / deferred

- spec/brainstorm context-block compression (option C, not chosen).
- Multi-workflow (Phase 15).
