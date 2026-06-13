---
gsd_state_version: 1.0
milestone: v7.0
milestone_name: Gap-Close & Memory Loop
status: in_progress
last_updated: "2026-06-13T00:00:00.000Z"
last_activity: 2026-06-13
progress:
  total_phases: 7
  completed_phases: 3
  total_plans: 3
  completed_plans: 3
  percent: 43
---

# STATE — harnessed

> Project memory / single source of truth for current position.
> Digest only (<100 lines) — history lives in CHANGELOG / RETROSPECTIVE / milestone audits, not here.

## Project Reference

- **Core value**: executable engine of the full three-layer-stack methodology — orchestration brain + prompt library, machine-codifying CLAUDE.md collaboration rules into a subagent-isolated routing engine. Does NOT vendor upstream code.
- **Current focus**: v7.0 Gap-Close & Memory Loop — Phase 13 (doc-debloat) + 14 (compact) + 15 (multi-workflow) DONE (3/7). Next = Phase 16 (learning 回灌闭环). Closes comet/Trellis competitive gaps.
- **Latest shipped**: npm latest=4.4.0 (verified live). v6.0 implemented 2026-06-11, pending tag/release.

## Current Position

Phase: 15 (multi-workflow) ✅ DONE 2026-06-13 — global singleton `current-workflow.json` → per-repo store `workflows.json` (arch A behind-API: `readCurrentWorkflow`/`writeCurrentWorkflowUnlocked` rewired to `workflows[repoKey(cwd)]`; 17 src consumers + envelope schema UNCHANGED). repoKey = pure fs walk-up to `.git`; compat-read migrates legacy + dual-write rollback anchor; `harnessed workflows` CLI. rogue F4/F5 fixed by construction. TDD, 1256 tests, tsc 0, biome clean.
Plan: 15-01-PLAN.md executed + 15-01-SUMMARY.md (main-session hand-driven). Next = plan Phase 16.
Status: 2 existing TESTS adapted (not src consumers): types-schemaVersion 17→18 surfaces; checkpoint-scale SMALL cwd-spy broadened (state is now cwd-keyed — real single-invocation cwd is stable). ⚠️ Methodology lesson (still active): GSD plan-phase agent chain overreaches on this host (it auto-committed a defective 14/15 during the Phase-13 run → reverted); drive plan+execute hand-controlled in the main session. Rogue impls = known-defective reference in `.planning/phases/_rogue-impl-reference/` (untracked; do NOT cherry-pick).
Last activity: 2026-06-13 — Phase 15 executed (TDD, behind-API per-repo store, anti-clobber).

## Milestone Scope (v7.0) — 7 phases

- **Phase 13 doc-debloat (A)**: PROJECT-SPEC ~4000-word status line → <100-line digest; README ×11 translations → on-demand. Self-exemplifies doc-discipline. First (independent).
- **Phase 14 compact 做实 (B)**: `src/checkpoint/compact.ts` placeholder → real measured compression.
- **Phase 15 multi-workflow (D / un-defer G5)**: singleton `current-workflow.json` → multi-active + compat-read migration. BREAKING. Subsumes ex-Spec-2.
- **Phase 16 learning 回灌 (C)**: completed-workflow learnings → persistent knowledge (Trellis update-spec analog). Biggest increment; needs Phase 15 base.
- **Phase 17 spec auto-injection (E)**: extend G4 inject hook to project specs/conventions per turn. Subsumes ex-Spec-3.
- **Phase 18 CodeGraph (F)**: optional semantic-index capability/manifest. Parallelizable (no dep on 14–17).
- **Phase 19 adoption (G)**: README quickstart + 1 honest comparison post. Last.

## Accumulated Context

### Decisions (v7.0 discuss, 2026-06-13)

- **Scope** — full 6-item, phased (not subset). Source: comet/Trellis comparison analysis.
- **Doc-debloat** — full (status-line digest + ADR/README archive), not status-line-only.
- **Multi-workflow** — complete breaking migration (un-defers G5), NOT schema-only-prep. Must ship compat-read for existing singleton (no data loss).
- **Adoption** — minimal (README quickstart + 1 comparison post), not full go-to-market.
- **Non-goals (trimmed)** — cross-harness breadth + routing L2-supervisor over-generalization; both YAGNI at 1 harness + ~0 real users (2 stars, downloads are CI/dogfood noise).

### Invariants (must not break)

- Additive-where-possible; Phase 15 migration ships compat-read for singleton `current-workflow.json` (zero data loss).
- KARPATHY-minimal surgical diffs; full gate green vs 1188-test baseline; Windows CI green.
- Biome preempt before every TS/JS commit (`pnpm exec biome check --write`).
- Every `.planning/` edit self-exemplifies v6.0 doc-discipline (this edit included).
- NEVER push to remote without explicit user approval.

### Open todos / blockers

- v6.0 (Phase 11 + 12 G2 sentinel) FULLY committed + shipped in npm 4.4.0 (Phase 12 = commit `1d4dffe`; the earlier "uncommitted" note was stale — verified 2026-06-13). No leftover.
- v7.0 phases 13–15 committed locally; npm still 4.4.0 (a new release for v7.0 work is a future decision, not pending now).
- Phase sequencing: 13→14→15→16→17→18→19 (15 before 16/17 = state base; 18 parallelizable).

## Session Continuity

- **Next command**: `/gsd-plan-phase 13` (doc-debloat) or commit v6.0 + release 4.4.0 first. User picks order.
- **Reference impl**: Phase 14 = `src/checkpoint/compact.ts`; Phase 15 = `src/checkpoint/schema/currentWorkflow.v1.ts` + `state.ts` (singleton → multi); Phase 17 = `src/checkpoint/injectState.ts` + `bin/harnessed-inject-state.mjs` (G4 hook).
- **Methodology note**: GSD `context: fork` skills (`/gsd-plan-phase`, `/gsd-execute-phase`) fire-and-die as slash commands — drive via `gsd-planner` / `gsd-executor` Agent-tool spawns instead.
