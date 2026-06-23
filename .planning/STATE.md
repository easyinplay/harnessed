---
gsd_state_version: 1.0
milestone: v8.0
milestone_name: Frictionless Entry
status: shipped
last_updated: "2026-06-23T00:00:00.000Z"
last_activity: 2026-06-23
progress:
  total_phases: 2
  completed_phases: 2
  total_plans: 2
  completed_plans: 2
  percent: 100
---

# STATE — harnessed

> Project memory / single source of truth for current position.
> Digest only (<100 lines) — history lives in CHANGELOG / RETROSPECTIVE / milestone audits / phase SUMMARYs, not here.

## Project Reference

- **Core value**: executable engine of the full three-layer-stack methodology — orchestration brain + prompt library, machine-codifying CLAUDE.md collaboration rules into a subagent-isolated routing engine. Does NOT vendor upstream code; composes + arbitrates heterogeneous upstreams (gstack/ECC/GSD/superpowers/…).
- **Current focus**: **v8.0 Frictionless Entry SHIPPED + closed 2026-06-23** (Phase 24 `c988bc8` + Phase 25 `58a6900`; audit passed 2/2 → `milestones/v8.0-MILESTONE-AUDIT.md`). **Next milestone: v9.0 Cross-Harness** (not started — opens with `/plan-eng-review`).
- **Latest shipped**: **v4.6.0** 2026-06-14 (npm `harnessed@4.6.0` + GitHub release). v7.0 + follow-ons (Phase 13–23) all shipped.

## Current Position

- **v8.0 SHIPPED + closed 2026-06-23** — posture 守宽做深 (B); 3-milestone split (v8.0 quick-wins ✓ → v9.0 cross-harness → v10.0 i18n). Phase 24 (`c988bc8`) + Phase 25 (`58a6900`) committed; audit passed 2/2; ROADMAP + MILESTONES indexed. Lightweight close (v5.1–v7.0 precedent: no git tag — codename≠npm; phase dirs stay in `phases/NN/`; REQUIREMENTS.md untouched).
- **Next**: **v9.0 Cross-Harness** — opens with `/plan-eng-review` (structural) → discuss/plan/execute. Sketch in ROADMAP Backlog.

## Next Milestone Sketch (v9.0 Cross-Harness)

- Big bet ①: abstract harnessed's OWN hardcoded `~/.claude/` (`setup.ts:120/194` + state + inject) → platform descriptor + auto-detect installed harness + industry `.agents/` per-platform convention. Upstreams (gstack/ECC/superpowers/codegraph) already portable → no generator / no upstream-mapping. Sketch only (anti-stale — refine at start). 详: ROADMAP Backlog + `milestones/v8.0-MILESTONE-AUDIT.md` (discuss decisions).

## Accumulated Context

### Decisions (carry-forward for v9.0)

- **Posture = 守宽做深 (B)** — keep the heterogeneous-upstream-arbitration moat; do NOT narrow to a single pairing.
- **Cross-harness feasibility (verified 2026-06-23, → v9.0)** — gstack/ECC already cross-harness; v9.0 work = abstract harnessed's OWN `~/.claude/` (`setup.ts:120/194`) onto `.agents/` + per-platform + auto-detect. No generator; no CC-degrade.
- Full v8.0 discuss decisions (state-machine-not-gap, gap map, competitive basis) → `milestones/v8.0-MILESTONE-AUDIT.md`. Competitive basis: `.planning/research/01–04` + `docs/comparison.md` (do NOT re-create).

### Invariants (must not break)

- 守宽 moat preserved; KARPATHY-minimal surgical diffs; full gate green vs 1335-test baseline; Windows CI green.
- Biome preempt before every TS/JS commit (`pnpm exec biome check --write`).
- Every `.planning/` edit self-exemplifies v6.0 doc-discipline (this edit included).
- NEVER push to remote without explicit user approval.

### Open todos / blockers

- **v8.0 fully committed** — Phase 24 `c988bc8`, Phase 25 `58a6900`, audit `4d106ad`; milestone-close docs (ROADMAP/MILESTONES/STATE/PROJECT/audit) pending this commit. No open blockers.
- **Doc-hygiene backlog** (non-blocking, from v8.0 audit): REQUIREMENTS.md + PROJECT.md are frozen ~2026-06-05 v5.1/v6.0-era snapshots (not reconciled past v6.0); shipped v5.1–v8.0 phase dirs (09–25) live in active `phases/` not `milestones/<ver>-phases/` (de-facto v5.1+ lightweight convention). Reconcile if/when a fuller archive pass is wanted.
- **Untracked noise (never add)**: `.understand-anything/`, `AGENTS.md`, `phases/_rogue-impl-reference/`.

## Session Continuity

- **Next command**: v9.0 Cross-Harness kickoff — `/plan-eng-review` (structural architecture gate) then discuss/plan/execute (hand-controlled). `/clear` first recommended.
- **Methodology lesson (still active)**: GSD plan-phase agent chain overreaches on this host — drive plan+execute hand-controlled in the main session. GSD `context: fork` slash skills fire-and-die — spawn `gsd-planner`/`gsd-executor` via Agent tool if needed. Rogue impls in `.planning/phases/_rogue-impl-reference/` (untracked). RTK note: `git status | grep` false-positives (RTK prints `ok`) — verify with `ls`/`test -f`.
