# Phase 16 SUMMARY — learning 回灌闭环 (C)

> Executed in the MAIN session (TDD red→green), 2026-06-13. Hand-driven (no autonomous chain). Builds on Phase 15 `repoKey`. NOT yet committed — awaiting user review.

## Outcome

Cross-session learning loop, capture half: on workflow completion, the final ledger's failure/loop/reject signals are appended to the repo's git-shareable `.planning/LEARNINGS.md` (append-only, in-repo). The agent can also append a prose lesson via `harnessed learn`. Consumption is via the standard `.planning/` read now; per-turn injection is Phase 17.

## Tasks (TDD)

1. **Pure extract/format** — `extractLearnings(ledger)` → looped(`fail_count>0`)/rejected/failed signals, one per sub (looped wins), `[]` for clean. `formatLearningEntry({phase,signals,prose?,at})` → dated markdown block, lesson line only when prose given.
2. **Append + capture** — `learningsPath(repoRoot)=<repoRoot>/.planning/LEARNINGS.md`; `appendLearning` creates `.planning/` + a one-time header on first write, **appends** (never truncates) after; `captureWorkflowLearnings(ledger,phase)` extracts → appends under `repoKey()` when signals exist, **no-op (no file)** for a clean ledger (D4).
3. **Wiring + CLI** — `checkpoint complete` auto-captures from the **pre-compact `afterMark` snapshot** when `allResolved` (so rejected entries that Phase-14 auto-compact would evict are not lost); `harnessed learn "<lesson>"` (24th subcommand) appends prose.
4. **Verify gate** — below.

## Decisions honored (16-CONTEXT.md)

- D1 append-only (no auto-rewrite of existing docs). D2 in-repo `.planning/LEARNINGS.md`, `repoKey(cwd)`-targeted (git-shareable). D3 hybrid (auto mechanical + `harnessed learn` prose). D4 no-empty-write (clean completion + the test suite never pollute a repo). D5 repo target (not global root). D6 TDD.

## Ordering subtlety (caught + handled)

Auto-capture reads `afterMark.sub_progress` (the pre-compact snapshot taken at the verify_mode step), NOT a post-compact re-read. Phase-14 auto-compact evicts `rejected` entries (status∈{done,skipped,rejected}∧fail_count==0), so reading after compact would drop G7-lite reject signals. Using the snapshot preserves them.

## Evidence

- TDD: learnings RED→GREEN, **9 tests** (extractLearnings ×3, formatLearningEntry ×2, append/capture ×4 incl. the D4 no-empty-write + append-not-truncate).
- Typecheck: `tsc --noEmit` exit 0.
- Biome: `biome check src/ tests/` — clean (no fixes).
- Full suite: **1265 passed | 5 skipped | 1 todo, 0 failed** (was 1256; +9).
- No-pollution: `test -f .planning/LEARNINGS.md` → absent after a full suite run (D4 + cwd isolation hold). NOTE: a `git status | grep` check gave a false positive because the RTK git wrapper prints an `ok` marker that the grep matched — verified with `ls`/`test -f` instead.
- `git diff --stat`: ROADMAP.md + cli.ts + checkpoint.ts (13 lines); untracked new: `learnings.ts`, `learn.ts`, `learnings.test.ts`, phase docs.

## Acceptance — all met

1. ✅ extractLearnings signals + clean→[]
2. ✅ formatLearningEntry dated block, optional prose
3. ✅ appendLearning first-write header + append-not-truncate
4. ✅ captureWorkflowLearnings writes on signals / no-op (no file) clean — D4
5. ✅ checkpoint complete auto-captures on allResolved+signals (pre-compact snapshot)
6. ✅ harnessed learn appends prose
7. ✅ full gate green; no real-repo pollution; biome clean

## Not done / deferred

- Per-turn injection of LEARNINGS.md into the agent context (Phase 17).
- Auto-promote into existing specs (D1 rejected — append-only by design).
- Phases 17–19.

## Notes for the reviewer

- `checkpoint complete` auto-capture + `harnessed learn` are thin CLI/wiring glue; the behavior they call (`captureWorkflowLearnings`/`appendLearning`) is unit-covered. Consistent with the Phase 14/15 CLI approach (glue not separately unit-tested; full-suite regression guards it).
