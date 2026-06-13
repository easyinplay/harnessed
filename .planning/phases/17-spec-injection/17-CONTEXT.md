# Phase 17 CONTEXT — spec/convention auto-injection (E / ex-Spec3)

> Locked from v7.0 milestone discuss + Phase 17 design clarification (2026-06-13, AskUserQuestion: relevance-ranked spec / relevance-filtered / sources = learnings + current-phase CONTEXT). Planned + executed in the MAIN session (no autonomous chain). Consumption half of the learning loop — pairs with Phase 16's capture.

## Goal

Extend the G4 per-turn inject hook so it injects relevance-FILTERED project knowledge (the repo's recent, phase/sub-relevant `.planning/LEARNINGS.md` entries + the current phase's CONTEXT.md excerpt), token-bounded, not just the `<workflow-state>` breadcrumb. Closes the 16→17 learning loop (capture → inject).

## Current state (verified)

- `injectState.ts`: pure `buildWorkflowStateBlock(wf)` → `<workflow-state>` block (phase/status/next/BREAK-LOOP). null → ''.
- `bin/harnessed-inject-state.mjs`: standalone UserPromptSubmit hook, **self-contained plain JS** (no project imports, for hot-path speed), reads `current-workflow.json` directly + emits the block.
- **A bin↔TS parity test already exists** (`tests/checkpoint/injectState.test.ts` → `describe('bin/...mjs parity')` runs the .mjs via `execFileSync` + `HARNESSED_ROOT_OVERRIDE` and compares to `buildWorkflowStateBlock`). This guards the duplicated logic — extend it for the new injection.
- **Phase 15 gap (fix here)**: the bin reads the GLOBAL `current-workflow.json` (the dual-write anchor = last-written repo), NOT `workflows.json[repoKey(cwd)]`. For a multi-repo user the injected state can be the wrong repo's. Since learnings are repo-pathed, the hook must be made repo-aware for consistency.
- Phase 16: `<repoRoot>/.planning/LEARNINGS.md`, append-only, entries shaped `### <at> — phase <phase>` + `- <kind>: <sub> (×N)` + `- lesson: <prose>`. CONTEXT files: `.planning/phases/<N>/<N>-CONTEXT.md`.

## Locked decisions

- **D1 — relevance-FILTERED (not full scoring)** (chosen — user said "relevance-filtered"): a deterministic, LLM-free filter. Keep a learning entry when its `phase` equals the current workflow phase OR any of its subs is in the current ledger; then order by recency (newest-relevant first) within a token budget. If nothing matches, fall back to the single most-recent entry (recency = weak relevance). No semantic ranking.
- **D2 — sources = learnings + current-phase CONTEXT** (chosen): (a) relevance-filtered LEARNINGS.md entries; (b) the current phase's CONTEXT.md excerpt (Goal + Locked-decisions sections, bounded). Static files (CLAUDE.md auto-loaded by Claude Code; REQUIREMENTS/ADR static) are EXCLUDED — low per-turn value.
- **D3 — token-bounded**: default budget ≈ 1500 tokens (Buffer/4 heuristic), overridable via `HARNESSED_INJECT_BUDGET` env. Learnings + CONTEXT share the budget (learnings first, CONTEXT with the remainder).
- **D4 — repo-aware** (fixes Phase 15 bin gap): resolve `repoKey(cwd)`; read the active repo's workflow from `workflows.json[repoKey]` (fallback legacy `current-workflow.json`, sister readStoreRaw); read `<repoKey>/.planning/LEARNINGS.md` + that repo's CONTEXT. Both the workflow-state block AND the project-context block are now repo-correct.
- **D5 — CONTEXT match is best-effort + graceful**: find `.planning/phases/<dir>/<N>-CONTEXT.md` whose phase token appears in the current workflow `phase` string; if none matches, skip the CONTEXT block (inject learnings only). Honest: the workflow `phase` field (a master sub name from `activate`) often won't map to a phase dir, so CONTEXT injection fires only when it does — learnings are the reliable half.
- **D6 — silent when empty** (sister G4): no learnings + no CONTEXT → emit only the workflow-state block (or nothing if no workflow). Never error.
- **D7 — bin stays self-contained**: the .mjs replicates the parse/filter/select logic in plain JS (no project imports, hot-path speed); the extended parity test guards drift against the TS builder.
- **D8 — TDD red-first**.

## Scope

- `src/checkpoint/injectState.ts` (extend):
  - `parseLearnings(md): LearningEntry[]` — split on `### ` headers → `{raw, phase, subs[]}`.
  - `filterRelevantLearnings(entries, ctx): LearningEntry[]` — phase/sub filter + recency order + most-recent fallback.
  - `selectWithinBudget(entries, budgetTokens): LearningEntry[]` — greedy recent-first.
  - `buildProjectContextBlock({learnings, contextExcerpt}): string` — `<project-context>` block; '' when both empty.
  - `findPhaseContextExcerpt(repoRoot, phase, budget): string|null` — best-effort bounded excerpt (impure).
  - `buildInjection(repoRoot, wf, learningsMd, budget): string` — composes workflow-state + project-context (the end-to-end testable unit).
- `bin/harnessed-inject-state.mjs` (rewrite): repo-aware (repoKey walk-up + workflows.json[repoKey] + legacy fallback) + parse/filter/select learnings + CONTEXT excerpt + emit both blocks. Plain JS.
- `tests/checkpoint/injectState.test.ts` (extend): pure parse/filter/select/build + the bin parity test (workflows.json + LEARNINGS.md under override + cwd).

## Out of scope (do NOT touch)

- Static spec-file injection (CLAUDE.md / REQUIREMENTS / ADR) — D2 excluded.
- Semantic / LLM relevance ranking — D1 deterministic filter only.
- Changing Phase 16's LEARNINGS.md format or the capture side.
- `CurrentWorkflowV1` envelope schema; the workflowStore internals (only READ).
- Phases 18–19.

## Invariants

- Hot-path: the bin stays self-contained plain JS, no project imports, no subprocess, no LLM.
- Deterministic: same inputs → same injection (parity-tested against the TS builder).
- Token-bounded: never exceed the budget (default 1500, env override).
- Repo-aware: read by repoKey(cwd); fail-soft to '' on any error (sister G4).
- KARPATHY-minimal; TDD red→green; full gate green vs the post-Phase-16 baseline (1265); Windows CI green; biome preempt; NEVER `git add -A`; NEVER push without approval.

## Acceptance

1. `parseLearnings`: round-trips the Phase-16 markdown into `{phase, subs}` entries; tolerates a header-only file → []. (unit)
2. `filterRelevantLearnings`: keeps phase-match + sub-match entries, recency-ordered; most-recent fallback when none match. (unit)
3. `selectWithinBudget`: never exceeds the token budget; recent-first. (unit)
4. `buildProjectContextBlock`: `<project-context>` with learnings + optional CONTEXT excerpt; '' when both empty. (unit)
5. `buildInjection`: workflow-state + project-context composed; workflow-state only when no learnings/CONTEXT; '' when no workflow. (unit)
6. **bin parity + repo-aware**: the .mjs, given workflows.json[repoKey] + LEARNINGS.md under an override root with cwd in a repo, emits the workflow-state block AND the relevant learnings; matches the TS `buildInjection` on the same fixture. (integration)
7. Full gate green; biome clean.
