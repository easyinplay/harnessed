---
gsd_state_version: 1.0
milestone: v6.0
milestone_name: Doc-Discipline Substrate
status: complete
last_updated: "2026-06-11T00:00:00.000Z"
last_activity: 2026-06-11
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
- **Current focus**: v6.0 COMPLETE (2/2) + release 4.4.0 PREPPED (package.json bump + CHANGELOG [4.4.0] + publish.yml GH-release step + G6 doc drift fix). Awaiting tag `v4.4.0` + push (needs user approval).
- **Latest shipped**: v4.3.0 (2026-06-10, v5.1 Upstream Re-sync, 1167 tests, CI green 3 platforms, npm latest=4.3.0).

## Current Position

Phase: v6.0 COMPLETE (2/2) — Phase 11 (doc-discipline) + Phase 12 (sentinel gate) both done
Plan: 11 + 12 done — 详: phases/11-doc-discipline/ + phases/12-sentinel-gate/
Status: Both phases in working tree (11 committed a5bd03c; 12 not yet committed). G1 = 7th L0 discipline + STATE-line halt. G2 = `checkPlanningSync` guard wired into checkpoint complete (halt + --force). vitest 1188 green.
Last activity: 2026-06-11 — executed Phase 12 (single TDD wave, self-owned spawn + main-session impl-body verify).

## Milestone Scope (v6.0)

- **G1 (Phase 11)**: codify CLAUDE.md 文档纪律 as 7th L0 discipline (`disciplines/doc-discipline.yaml`, 6 rules) + capability + before-commit enforcement.
- **G2 (Phase 12)**: finish 强制执行哨兵 — `before-complete.ts` checkpoint-sync gate (refuse COMPLETE when `.planning/` unsynced). Reuses v4.2 checkpoint ledger.
- **Additive-only**: 1 new discipline yaml + 1 new hook + tests. No existing discipline/capability mutated. No architecture change.

## Accumulated Context

### Decisions (v6.0 discuss, 2026-06-11)

- **Scope** — 1 milestone, 2 phases (G1 Phase 11 → G2 Phase 12). G2 depends on G1's state-check capability.
- **G1 shape** — `disciplines/doc-discipline.yaml` (L0 substrate, 7th discipline), NOT a judgment gate. Always-on, hook-enforced.
- **Enforcement hardness** — warn-majority + STATE.md >100-line `halt`-with-override (karpathy philosophy); one-fact / overview-pointer = heuristic warn; responsibility-matrix = info.

### Invariants (must not break)

- 7th discipline follows existing `harnessed.discipline.v1` shape (sister karpathy/operational); reuse before-commit + v4.2 checkpoint ledger (no new state store).
- Additive-only: new yaml + new hook + new tests; no existing discipline/capability/architecture mutated.
- KARPATHY-minimal: smallest effective diff, surgical; doc-discipline self-exemplified in this very `.planning/` edit.
- Windows CI must stay green; no regression vs the 1167-test baseline.
- Biome preempt before every TS/JS commit (`pnpm exec biome check --write`).
- NEVER push to remote without explicit user approval.

### Open todos / blockers

- None blocking. Carry-over (non-blocking): npm-readme drift on 4.3.0 tarball; CI Node-20 deprecation (forced to Node 24 by 2026-06-16). v5.1 milestone never formally archived (ceremony skipped).

### Deferred (Backlog)

- v5.0 Spec 2 — session-scoped state + single-session fallback.
- v5.0 Spec 3 — per-turn injection hook + scale-adaptive verify strength.
- Security hardening pass (threat-model-gated): shell-injection `security.ts`/`spawn.ts`/`path-guard.ts`; concurrency `sigintTrap.ts`/`before-commit.ts`.

## Session Continuity

- **Next command**: tag `v4.4.0` + push main + tag → CI publishes npm + GitHub release (per publish.yml). User approval required before any push.
- **Phase dirs**: `phases/11-doc-discipline/` + `phases/12-sentinel-gate/` both DONE (PLAN + triplet + verified). v5.1 archived in shipped index.
- **Reference impl**: 7th discipline mirrors `workflows/disciplines/karpathy.yaml` + `operational.yaml`; G2 hook mirrors `src/discipline/enforcement/before-commit.ts`; checkpoint ledger = v4.2 `state.ts`.
- **Methodology note**: GSD `context: fork` skills (`/gsd-plan-phase`, `/gsd-execute-phase`) fire-and-die as slash commands — drive them via `gsd-planner` / `gsd-executor` Agent-tool spawns instead.
