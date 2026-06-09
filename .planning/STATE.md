---
gsd_state_version: 1.0
milestone: v5.1
milestone_name: Upstream Re-sync
status: executing
last_updated: "2026-06-09T14:43:00.000Z"
last_activity: 2026-06-09
progress:
  total_phases: 2
  completed_phases: 1
  total_plans: 1
  completed_plans: 1
  percent: 50
---

# STATE — harnessed

> Project memory / single source of truth for current position.
> Digest only (<100 lines) — history lives in CHANGELOG / RETROSPECTIVE / milestone audits, not here.

## Project Reference

- **Core value**: executable engine of the full three-layer-stack methodology — orchestration brain + prompt library, machine-codifying CLAUDE.md collaboration rules into a subagent-isolated routing engine. Does NOT vendor upstream code.
- **Current focus**: v5.1 Upstream Re-sync — additive sync of composition manifest + capability registry to upstream drift (GSD Core 1.4.1 + gstack v1.52.1.0). No runtime/architecture change.
- **Latest shipped**: v4.2.0 (2026-06-05, v5.0 State Machine Core Spec 1, 1158 tests, CI green 3 platforms).

## Current Position

Phase: 9 — GSD Core re-wire (✅ COMPLETE 2026-06-09)
Plan: 09-01 done — 详: phases/09-gsd-core-rewire/09-01-SUMMARY.md
Status: Phase 9 executed & verified green; next → Phase 10 (gstack/mattpocock bump + 6 skills)
Last activity: 2026-06-09 — Phase 9 shipped: 12 GSD Core 1.4.1 capabilities + 4 stage-phase-gate triggers (additive, keystone intact, 1159 tests pass)

## Milestone Scope (v5.1)

- **Keystone**: execute mechanism stays self-owned — `gsd-execute-phase` NOT wired (harnessed keeps CC-native spawn + ralph-loop + v4.2 checkpoint ledger).
- **Additive-only**: ~18 new `capabilities.yaml` entries + 2 manifest version bumps + test-fixture sync. No existing capability mutated except gstack/mattpocock version fields.
- **Preamble delivered**: GSD Core manifest rename `get-shit-done-cc` → `@opengsd/gsd-core` 1.4.1 (commit `0ab8c52`) + `.planning/` GSD-layout migration (`f61e443`).

## Accumulated Context

### Decisions (v5.1)

- **Grouping** — 2 phases: Phase 9 = GSD Core re-wire (rewire + judgments), Phase 10 = gstack/mattpocock bump + 6 skills. Validation (REQ-v51-validation) folds into each phase's acceptance + Phase 10 final gate (not its own phase).
- **Verify-on-disk** — every new `skill_dir` must be confirmed to exist on disk before wiring (grep-over-assume; see CLAUDE.md SPEC cross-ref checklist).
- **iOS skipped** — gstack iOS suite intentionally out of scope; 6 non-iOS skills only.

### Invariants (must not break)

- ADR-0029 gate fail-soft + ADR-0033 evidence guard fail-closed — both UNCHANGED (no architecture touch this milestone).
- Only gstack/mattpocock version fields mutated; all capability additions are new entries.
- KARPATHY-minimal: smallest effective config diff, surgical.
- Windows CI must stay green; no regression vs the 1158-test baseline.
- Biome preempt before every TS/JS commit (`pnpm exec biome check --write`).
- NEVER push to remote without explicit user approval.

### Open todos / blockers

- None blocking. Next action: `/gsd-plan-phase 10`.

### Deferred (Backlog)

- v5.0 Spec 2 — session-scoped state + single-session fallback.
- v5.0 Spec 3 — per-turn injection hook + scale-adaptive verify strength.
- Security hardening pass (threat-model-gated): shell-injection `security.ts`/`spawn.ts`/`path-guard.ts`; concurrency `sigintTrap.ts`/`before-commit.ts`.

## Session Continuity

- **Next command**: `/gsd-plan-phase 10`.
- **Phase dirs**: `.planning/phases/09-gsd-core-rewire/` + `.planning/phases/10-gstack-bump-skills/` (created, empty — ready for PLAN).
- **Methodology**: additive config work — no TDD on pure fns needed; verification = capability-resolver + check-workflow-schema + manifest-validate + full vitest green. 三层栈 verify cadence at Phase 10 final gate.
