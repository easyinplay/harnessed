---
gsd_state_version: 1.0
milestone: v9.0
milestone_name: Cross-Harness
status: executing
last_updated: "2026-06-23T00:00:00.000Z"
last_activity: 2026-06-23
progress:
  total_phases: 3
  completed_phases: 0
  total_plans: 1
  completed_plans: 0
  percent: 0
---

# STATE — harnessed

> Project memory / single source of truth for current position.
> Digest only (<100 lines) — history lives in CHANGELOG / RETROSPECTIVE / milestone audits / phase SUMMARYs, not here.

## Project Reference

- **Core value**: executable engine of the full three-layer-stack methodology — orchestration brain + prompt library, machine-codifying CLAUDE.md collaboration rules into a subagent-isolated routing engine. Does NOT vendor upstream code; composes + arbitrates heterogeneous upstreams (gstack/ECC/GSD/superpowers/…).
- **Current focus**: **v9.0 Cross-Harness** — architecture locked 2026-06-23 (scope B, eng-review APPROVED; SoT `v9.0-cross-harness-ARCHITECTURE.md`). **Phase 26 (A) PlatformDescriptor seam PLANNED + ready-to-execute** (TDD). Prior: v8.0 shipped 2026-06-23 (`milestones/v8.0-MILESTONE-AUDIT.md`).
- **Latest shipped**: **v4.6.0** 2026-06-14 (npm `harnessed@4.6.0` + GitHub release). v7.0 + follow-ons (Phase 13–23) all shipped.

## Current Position

- **v9.0 Cross-Harness ACTIVE** — posture 守宽做深 (B); 3-milestone split (v8.0 quick-wins ✓ → v9.0 cross-harness ◐ → v10.0 i18n). Architecture locked 2026-06-23 (inline design + `/plan-eng-review`, scope B, APPROVED): `PlatformDescriptor` + `detectPlatform()` (claude-first, zero blast) + central config resolvers + `.agents/` 2nd-platform proof; no generator/matrix (upstreams portable). 3 phases: **26 (A seam, PLANNED+TDD)** / 27 (B resolvers, sketch) / 28 (C `.agents/` proof, sketch). harnessed already ~70% abstracted (`getHarnessedRoot` SoT). Design SoT: `v9.0-cross-harness-ARCHITECTURE.md`.
- **Next**: execute Phase 26 (platform descriptor seam — `src/installers/lib/platform.ts` + route `getHarnessedRoot`; zero behavior change, TDD; user gate).

## Open architecture decisions (v9.0, from ARCHITECTURE doc §7)

- **D-A** `.agents/` mcpConfigPath (CC's `~/.claude.json` is a homedir sibling, irregular) + **D-B** `.agents/` internal layout compat → both **Phase-C-time verification** (anti-stale, don't guess now; D-B evidence: `idempotent.ts:120-128` dual-probes `~/.agents/skills/<name>/SKILL.md`).
- **D-C** settings.json 3-writer centralization → bundled into Phase 27. **D-D** A/B/C as phases 26/27/28 → locked.

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

- **v9.0 architecture + Phase 26 plan landed** — arch doc committed `374b3ff`; ROADMAP/MILESTONES/STATE promote + `phases/26-platform-descriptor-seam/{26-CONTEXT,26-01-PLAN}.md` pending this commit. **Phase 26 ready-to-execute** (TDD, 3 files: `platform.ts` new + `harnessedRoot.ts` M + `platform.test.ts` new). NOT executed.
- **Doc-hygiene backlog** (non-blocking, from v8.0 audit): REQUIREMENTS.md + PROJECT.md are frozen ~2026-06-05 v5.1/v6.0-era snapshots (not reconciled past v6.0); shipped v5.1–v8.0 phase dirs (09–25) live in active `phases/` not `milestones/<ver>-phases/` (de-facto v5.1+ lightweight convention). Reconcile if/when a fuller archive pass is wanted.
- **Untracked noise (never add)**: `.understand-anything/`, `AGENTS.md`, `phases/_rogue-impl-reference/`.

## Session Continuity

- **Next command**: execute Phase 26 (PlatformDescriptor seam, TDD; main-session hand-controlled or spawn `gsd-executor`; user gate per 逐-gate).
- **Methodology lesson (still active)**: GSD plan-phase agent chain overreaches on this host — drive plan+execute hand-controlled in the main session. GSD `context: fork` slash skills fire-and-die — spawn `gsd-planner`/`gsd-executor` via Agent tool if needed. Rogue impls in `.planning/phases/_rogue-impl-reference/` (untracked). RTK note: `git status | grep` false-positives (RTK prints `ok`) — verify with `ls`/`test -f`.
