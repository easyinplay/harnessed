---
gsd_state_version: 1.0
milestone: v7.0
milestone_name: Gap-Close & Memory Loop
status: planning
last_updated: "2026-06-13T00:00:00.000Z"
last_activity: 2026-06-13
progress:
  total_phases: 7
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# STATE — harnessed

> Project memory / single source of truth for current position.
> Digest only (<100 lines) — history lives in CHANGELOG / RETROSPECTIVE / milestone audits, not here.

## Project Reference

- **Core value**: executable engine of the full three-layer-stack methodology — orchestration brain + prompt library, machine-codifying CLAUDE.md collaboration rules into a subagent-isolated routing engine. Does NOT vendor upstream code.
- **Current focus**: v7.0 Gap-Close & Memory Loop — DISCUSSED (2026-06-13), 7 phases scoped, plan-phase pending. Closes comet/Trellis competitive gaps + de-bloats planning docs. v6.0 done, pending npm release.
- **Latest shipped**: npm latest=4.4.0 (verified live). v6.0 implemented 2026-06-11 (1188 tests), pending tag/release.

## Current Position

Phase: v7.0 DISCUSSED, not yet planned. 7 phases (13–19) listed in ROADMAP active section.
Plan: none yet — next = `/gsd-plan-phase 13` (or gsd-planner spawn) for Phase 13 doc-debloat.
Status: ROADMAP/STATE/MILESTONES updated to v7.0. No code touched. v6.0 working tree (Phase 12 `before-complete` gate) still pending commit + release.
Last activity: 2026-06-13 — comet/Trellis comparison → milestone discuss (4 decisions via AskUserQuestion) → planning docs updated.

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

- v6.0 Phase 12 (`before-complete` gate) still uncommitted + v4.4.0 release pending (needs user approval to tag/push).
- Phase sequencing: 13→14→15→16→17→18→19 (15 before 16/17 = state base; 18 parallelizable).

## Session Continuity

- **Next command**: `/gsd-plan-phase 13` (doc-debloat) or commit v6.0 + release 4.4.0 first. User picks order.
- **Reference impl**: Phase 14 = `src/checkpoint/compact.ts`; Phase 15 = `src/checkpoint/schema/currentWorkflow.v1.ts` + `state.ts` (singleton → multi); Phase 17 = `src/checkpoint/injectState.ts` + `bin/harnessed-inject-state.mjs` (G4 hook).
- **Methodology note**: GSD `context: fork` skills (`/gsd-plan-phase`, `/gsd-execute-phase`) fire-and-die as slash commands — drive via `gsd-planner` / `gsd-executor` Agent-tool spawns instead.
