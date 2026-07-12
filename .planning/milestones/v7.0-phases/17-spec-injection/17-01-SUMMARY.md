# Phase 17 SUMMARY — spec/convention auto-injection (E / ex-Spec3)

> Executed in the MAIN session (TDD red→green), 2026-06-13. Hand-driven. Consumption half of the learning loop — closes 16→17. NOT yet committed — awaiting user review.

## Outcome

The G4 per-turn inject hook now emits, in addition to `<workflow-state>`, a relevance-filtered `<project-context>` block: the repo's recent phase/sub-relevant `.planning/LEARNINGS.md` entries (token-bounded) + the current phase's CONTEXT.md excerpt. The bin is also made repo-aware (fixes the Phase-15 gap where it blindly read the global singleton).

## Tasks (TDD)

1. **Pure parse/filter/select** — `parseLearnings(md)` (round-trips Phase-16 markdown to `{phase,subs}`; header-only→[]), `filterRelevantLearnings(entries, {phase, ledgerSubs})` (phase OR sub match, newest-first, most-recent fallback), `selectWithinBudget(entries, budget)` (greedy, never exceeds, Buffer/4).
2. **Assemblers** — `buildProjectContextBlock` (`<project-context>` or ''), `findPhaseContextExcerpt(repoRoot, phase, budget)` (best-effort Goal excerpt by phase-number match, graceful null), `buildInjection(repoRoot, wf, learningsMd, budget)` (workflow-state + project-context; ws-only when nothing relevant; '' when no workflow). `DEFAULT_INJECT_BUDGET=1500`.
3. **Repo-aware bin + parity** — `bin/harnessed-inject-state.mjs` rewritten: `repoKey(cwd)` walk-up → `workflows.json[repoKey]` (legacy `current-workflow.json` fallback) → workflow-state + parse/filter/select learnings from `<repoKey>/.planning/LEARNINGS.md` + CONTEXT excerpt. Self-contained plain JS. The existing parity test was extended (repo-aware: workflows.json + LEARNINGS.md under override + cwd in a tmp repo) and now asserts `.mjs stdout === buildInjection(...)` byte-for-byte, plus a legacy-fallback case.
4. **Verify gate** — below.

## Decisions honored (17-CONTEXT.md)

- D1 relevance-FILTERED (deterministic phase/sub match + recency, no LLM). D2 sources = learnings + current-phase CONTEXT (static files / CLAUDE.md excluded). D3 token-bounded (1500 default, `HARNESSED_INJECT_BUDGET` override). D4 repo-aware (workflows.json[repoKey], legacy fallback). D5 CONTEXT match best-effort + graceful. D6 silent when empty. D7 bin self-contained + parity-tested. D8 TDD.

## Honest limitations

- **CONTEXT-excerpt injection rarely fires in real dogfooding**: it matches a phase dir by leading number against the workflow `phase` string, but `phase` is a master sub name from `activate` (e.g. "verify"/"task"), which usually contains no phase number → no match → CONTEXT skipped. **Learnings are the reliable half.** The CONTEXT path is exercised by the unit test (phase string containing "13") and works when the phase field does carry a number.
- The bin duplicates the parse/filter/select/excerpt logic in plain JS (hot-path, no project imports). The extended parity test (runs the real `.mjs` vs the TS `buildInjection`) is the drift guard.

## Evidence

- TDD: injectState RED→GREEN, **19 tests** (12 new: parse ×2, filter ×3, select ×2, buildProjectContextBlock ×2, findPhaseContextExcerpt ×2, buildInjection ×3 — wait, count: 12 new + repo-aware parity ×2; plus the 3 original buildWorkflowStateBlock). Repo-aware bin parity asserts `.mjs ≡ buildInjection`.
- Typecheck: `tsc --noEmit` exit 0 (3 strict `noUncheckedIndexedAccess` issues fixed behavior-neutrally; bin unchanged → parity intact).
- Biome: 313 files clean.
- Full suite: **1280 passed | 5 skipped | 1 todo, 0 failed** (was 1265; +15).
- No-pollution: `test -f .planning/LEARNINGS.md` → absent (Phase 17 only READS learnings).
- `git diff --stat`: ROADMAP.md + bin + injectState.ts + injectState.test.ts; untracked new: phase docs.

## Acceptance — all met

1. ✅ parseLearnings round-trip + header-only→[]
2. ✅ filterRelevantLearnings phase/sub + recency + fallback
3. ✅ selectWithinBudget never exceeds
4. ✅ buildProjectContextBlock block / ''
5. ✅ buildInjection 3 states
6. ✅ bin repo-aware (workflows.json[repoKey] + legacy fallback) + parity == buildInjection
7. ✅ full gate green; no pollution; biome clean

## Not done / deferred

- Semantic / LLM relevance ranking (D1 deterministic only).
- Static spec-file injection (D2 excluded).
- Improving CONTEXT-match (would need the workflow `phase` to carry the phase number) — out of scope; learnings are the reliable half.
- Phases 18–19.
