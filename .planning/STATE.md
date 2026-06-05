---
gsd_state_version: 1.0
milestone: v5.0
status: in_progress
latest_shipped: 4.1.3
current_phase: 2
updated: 2026-06-05
---

# STATE — harnessed

> Project memory / single source of truth for current position.
> Regenerated 2026-06-05 (reconciliation). Stale v2.0/v3.9.x narrative stripped.

## Project Reference

- **Core value**: executable engine of the full three-layer-stack methodology — orchestration brain + prompt library, machine-codifying CLAUDE.md collaboration rules into a subagent-isolated routing engine. Does NOT vendor upstream code.
- **Current focus**: v5.0 State Machine Core (Spec 1) — structured progress ledger + fail-closed evidence guard + `status --recover`.
- **Latest shipped**: v4.1.3 (2026-06-04, 1107 tests, CI green 3 platforms).

## Current Position

- **Milestone**: v5.0 State Machine Core (Spec 1: A/B/C/E/F)
- **Status**: in_progress
- **Current phase**: Phase 2 — ledger.ts pure functions (TDD)
- **Done in working tree (uncommitted)**: Phase 1 (schema extension), Phase 7 (verify/* artifacts_expected backfill)
- **Pending**: Phases 2, 3, 4, 5, 6, 8

Progress: `[##--------]` 2/8 phases (Phase 1 + Phase 7 done uncommitted)

## Design Baseline (locked)

- ADR-0033 (Proposed) + `.planning/v5.0/STATE-MACHINE-CORE-DESIGN.md` — full implementation contract. 7 brainstorm + 3 eng-review decisions locked. No open gray areas.
- task_plan: `.planning/v5.0/task_plan.md` (8-phase TDD plan, dependency order: schema → ledger/evidence → checkpoint wiring → status/resume → generated body → verify backfill → release gate).

## Accumulated Context

### Decisions (v5.0)
- **D1** — single SoT: ledger lives only in `current-workflow.json`; checkpoint envelope carries NO ledger copy (dual-SoT + 1000-token budget risk).
- **D2** — three-state evidence_status (`verified` / `none_declared` / `overridden`), never collapse to boolean.
- **D3** — two-step gates→start; generated ORCHESTRATOR body enforces sequence; recover degrades gracefully on empty ledger.
- **Ledger-only progression** — no transition-event FSM (linear topology); progression = field writes. Additive optional schema, no version bump.

### Invariants (must not break)
- ADR-0029 gate fail-soft UNCHANGED — evidence guard is a SEPARATE fail-CLOSED posture (a future "unify error handling" refactor must not collapse them).
- atomic write (`writeFileAtomic`/`writeFileSyncAtomic`) + proper-lockfile dir lock — reuse existing.
- KARPATHY-minimal: no FSM lib, surgical changes.
- Windows CI must stay green.
- Biome preempt before every TS/JS commit (`pnpm exec biome check --write`).
- NEVER push to remote without explicit user approval.

### Open todos / blockers
- None blocking. Next action: Phase 2 ledger.ts TDD (RED first).

### Deferred (out of Spec 1)
- Spec 2 — session-scoped state + single-session fallback.
- Spec 3 — per-turn injection hook + scale-adaptive verify strength.
- Security hardening pass (threat-model-gated): shell-injection in `security.ts`/`spawn.ts`/`path-guard.ts`; concurrency hazards in `sigintTrap.ts`/`before-commit.ts`.

## Session Continuity

- **Next command**: `/gsd-plan-phase 2` (or continue `.planning/v5.0/task_plan.md` Phase 2).
- **Working-tree note**: Phase 1 schema + Phase 7 verify backfill done but uncommitted. Confirm `git status` before committing — biome preempt + Windows-green check first.
- **Methodology**: TDD on pure fns (ledger/evidence); `superpowers:test-driven-development` for Phase 2/3 (RED→GREEN); 三层栈 verify cadence at Phase 8 release gate.
