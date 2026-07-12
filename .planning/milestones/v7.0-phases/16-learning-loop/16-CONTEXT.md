# Phase 16 CONTEXT — learning 回灌闭环 (C)

> Locked from v7.0 milestone discuss + Phase 16 design clarification (2026-06-13, AskUserQuestion: append-only record / in-repo .planning/LEARNINGS.md / hybrid extraction). Planned + executed in the MAIN session (no autonomous planner/checker chain — the Phase 13 run had one go rogue). Builds on Phase 15 per-repo store (repoKey).

## Goal

Close the cross-session learning loop: when a workflow completes, capture what was learned (mechanical failure/loop/reject signals + optional agent prose) into a git-shareable, append-only `.planning/LEARNINGS.md` in the repo, so the next session starts smarter (Trellis `update-spec` analog, no-vendor).

## Honest framing (verified)

- harnessed's checkpoint state is THIN: the sub-progress ledger carries `status (pending|done|failed|skipped|rejected)`, `fail_count` (G6), `evidence_status`, `reason`. It is NOT rich prose. So mechanically-extractable learnings = failure/loop/reject signals; richer lessons need the agent to supply prose.
- Consumption is mostly FREE: `.planning/LEARNINGS.md` is the standard GSD/agent read location, so the next session/planner sees it without new wiring. Automated per-turn injection is Phase 17's job. Phase 16 = the CAPTURE half + a readable record; the loop closes via the standard `.planning/` read now and Phase 17 injection later.

## Locked decisions

- **D1 — append-only record** (chosen): on workflow completion, APPEND a learning entry. Do NOT auto-rewrite existing docs/specs (that ambitious Trellis-style auto-promote was rejected — too risky to auto-edit user docs).
- **D2 — in-repo `.planning/LEARNINGS.md`** (chosen): write to `<repoRoot>/.planning/LEARNINGS.md` where `repoRoot = repoKey(cwd)` (Phase 15 walk-up). Git-shareable, visible, Trellis-like. **New write surface**: harnessed normally writes to `~/.claude/harnessed`; this writes into the user's repo working tree. Create `.planning/` if absent. Append-only markdown (human + agent readable).
- **D3 — hybrid extraction** (chosen): (a) AUTO on workflow-complete — extract mechanical signals from the final ledger (`fail_count>0` looped, `status==='rejected'` abandoned, `status==='failed'` failed); (b) `harnessed learn "<lesson>"` — agent appends a prose lesson anytime.
- **D4 — no empty writes**: AUTO capture only appends when there is at least one signal (a clean completion with zero failed/looped/rejected subs writes nothing). This also protects the test suite from polluting the real repo's `.planning/LEARNINGS.md`.
- **D5 — append target by cwd**: the write target is the REPO (repoKey(cwd)), NOT the global harnessed root. Tests isolate via chdir to a tmp repo (sister Phase 15 state-store tests).
- **D6 — TDD red-first**: pure extraction/format first, then the impure append + wiring.

## Scope

- `src/checkpoint/learnings.ts` (NEW):
  - `extractLearnings(ledger): LearningSignal[]` — pure; mechanical signals from the final ledger.
  - `formatLearningEntry({phase, signals, prose?, at}): string` — pure; a dated markdown block.
  - `learningsPath(repoRoot)` = `join(repoRoot, '.planning', 'LEARNINGS.md')`.
  - `appendLearning(repoRoot, entry)` — impure; mkdir `.planning/` if absent + append (create file with a header on first write).
  - `captureWorkflowLearnings(ledger, phase)` — impure convenience; extract → if non-empty, format + append under repoKey(cwd). No-op when empty (D4).
- `src/cli/checkpoint.ts`: in the `complete` branch, after `completePhase` when `allResolved`, call `captureWorkflowLearnings(afterMark.sub_progress, sub)` (auto half of D3).
- `src/cli/learn.ts` (NEW) + register in `src/cli.ts`: `harnessed learn "<lesson>"` → append a prose learning to the current repo.
- `tests/checkpoint/learnings.test.ts` + extend checkpoint complete tests.

## Out of scope (do NOT touch)

- Auto-rewriting / promoting into existing specs or docs (D1 rejected the ambitious path).
- Per-turn injection of learnings into the agent context (that is Phase 17).
- The global `~/.claude/harnessed` store / Phase 15 multi-workflow internals (only READ the ledger).
- Phases 17–19.
- `CurrentWorkflowV1` envelope schema (unchanged; learnings live in a separate markdown file, not the envelope).

## Invariants

- Append-only: never rewrite/delete existing LEARNINGS.md content; only append.
- No empty writes (D4) — clean completions and the test suite never pollute a repo's `.planning/`.
- Write target = repoKey(cwd) repo root, never the global harnessed root.
- KARPATHY-minimal surgical diff; TDD red→green; full gate green vs the post-Phase-15 baseline (1256); Windows CI green.
- Biome preempt before commit; NEVER `git add -A`; NEVER push without approval.

## Acceptance

1. `extractLearnings`: returns looped (`fail_count>0`), rejected, and failed signals from a ledger; empty array for a clean ledger. (unit)
2. `formatLearningEntry`: produces a dated markdown block listing the signals + optional prose. (unit)
3. `appendLearning`: creates `<repoRoot>/.planning/LEARNINGS.md` (with a header) on first write; appends on subsequent writes; never truncates. (unit, tmp repo)
4. `captureWorkflowLearnings`: appends when signals exist; **no-op (no file created)** when the ledger is clean (D4). (unit, tmp repo)
5. `checkpoint complete` auto-captures into the repo's LEARNINGS.md when the completed workflow's ledger has failure signals; writes nothing for a clean completion. (integration, isolated cwd)
6. `harnessed learn "<lesson>"` appends a prose learning to the current repo's LEARNINGS.md.
7. Full test gate green (no real-repo `.planning/LEARNINGS.md` pollution); biome clean.
