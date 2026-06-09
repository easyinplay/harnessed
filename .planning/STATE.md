---
gsd_state_version: 1.0
milestone: v5.1
milestone_name: Upstream Re-sync
status: complete
last_updated: "2026-06-10T00:00:00.000Z"
last_activity: 2026-06-10
progress:
  total_phases: 2
  completed_phases: 2
  total_plans: 2
  completed_plans: 2
  percent: 100
---

# STATE — harnessed

> Project memory / single source of truth for current position.
> Digest only (<100 lines) — history lives in CHANGELOG / RETROSPECTIVE / milestone audits, not here.

## Project Reference

- **Core value**: executable engine of the full three-layer-stack methodology — orchestration brain + prompt library, machine-codifying CLAUDE.md collaboration rules into a subagent-isolated routing engine. Does NOT vendor upstream code.
- **Current focus**: v5.1 Upstream Re-sync — COMPLETE + shipped as npm 4.3.0. Next: optional milestone close or pull from Backlog.
- **Latest shipped**: v4.3.0 (2026-06-10, v5.1 Upstream Re-sync, 1167 tests, CI green 3 platforms, npm latest=4.3.0).

## Current Position

Phase: v5.1 COMPLETE — Phase 9 + Phase 10 both done & shipped (2/2)
Plan: 09 + 10 done — 详: phases/09-gsd-core-rewire/09-01-SUMMARY.md + phases/10-gstack-bump-skills/10-SUMMARY.md
Status: v5.1 implementation complete, released as v4.3.0 (npm latest=4.3.0). Milestone NOT formally archived (complete-milestone ceremony skipped — friction with harnessed custom layout/tagging).
Last activity: 2026-06-10 — shipped v4.3.0: 18 new capabilities (12 GSD Core + 6 gstack) + stage-phase-gate triggers + gstack/mattpocock manifest bump. 1167 tests green.

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

- None blocking. v5.1 complete + shipped (v4.3.0). Optional follow-ups: (1) formally close v5.1 milestone; (2) npm-readme drift — published 4.3.0 tarball README shows old ~70/~83 capability count (repo README fixed post-tag; only matters if a 4.3.1 re-publish is wanted); (3) CI Node-20 deprecation (actions/checkout + setup-node forced to Node 24 by 2026-06-16).

### Deferred (Backlog)

- v5.0 Spec 2 — session-scoped state + single-session fallback.
- v5.0 Spec 3 — per-turn injection hook + scale-adaptive verify strength.
- Security hardening pass (threat-model-gated): shell-injection `security.ts`/`spawn.ts`/`path-guard.ts`; concurrency `sigintTrap.ts`/`before-commit.ts`.

## Session Continuity

- **Next command**: none pending — v5.1 done + shipped. To start new work: `/gsd-new-milestone` (or pull a Backlog item).
- **Phase dirs**: `.planning/phases/09-gsd-core-rewire/` (09-PLAN.md + 09-01-SUMMARY.md) + `.planning/phases/10-gstack-bump-skills/` (10-SUMMARY.md) — both executed & verified.
- **Release**: v4.3.0 commits `0ab8c52`…`2a5fb29` on main (pushed); tag `v4.3.0` → GitHub Actions publish success → npm latest=4.3.0.
- **Methodology note**: GSD `context: fork` skills (`/gsd-plan-phase`, `/gsd-execute-phase`) fire-and-die as slash commands — drive them via `gsd-planner` / `gsd-executor` Agent-tool spawns instead.
