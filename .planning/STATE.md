---
gsd_state_version: 1.0
milestone: v9.0
milestone_name: Cross-Harness
status: executing
last_updated: "2026-06-23T00:00:00.000Z"
last_activity: 2026-06-23
progress:
  total_phases: 3
  completed_phases: 1
  total_plans: 2
  completed_plans: 1
  percent: 33
---

# STATE — harnessed

> Project memory / single source of truth for current position.
> Digest only (<100 lines) — history lives in CHANGELOG / RETROSPECTIVE / milestone audits / phase SUMMARYs, not here.

## Project Reference

- **Core value**: executable engine of the full three-layer-stack methodology — orchestration brain + prompt library, machine-codifying CLAUDE.md collaboration rules into a subagent-isolated routing engine. Does NOT vendor upstream code; composes + arbitrates heterogeneous upstreams (gstack/ECC/GSD/superpowers/…).
- **Current focus**: **v9.0 Cross-Harness** (scope B, SoT `v9.0-cross-harness-ARCHITECTURE.md`). **Phase 26 (A) seam DONE 2026-06-24** (1357 tests). **Phase 27 (B) central config resolvers PLANNED + ready-to-execute** (TDD, ~9 files + settingsWriter fold). Prior: v8.0 shipped (`milestones/v8.0-MILESTONE-AUDIT.md`).
- **Latest shipped**: **v4.6.0** 2026-06-14 (npm `harnessed@4.6.0` + GitHub release). v7.0 + follow-ons (Phase 13–23) all shipped.

## Current Position

- **v9.0 Cross-Harness ACTIVE** — posture 守宽做深 (B); 3-milestone split (v8.0 quick-wins ✓ → v9.0 cross-harness ◐ → v10.0 i18n). Architecture locked 2026-06-23 (inline design + `/plan-eng-review`, scope B, APPROVED): `PlatformDescriptor` + `detectPlatform()` (claude-first, zero blast) + central config resolvers + `.agents/` 2nd-platform proof; no generator/matrix (upstreams portable). 3 phases: **26 (A seam) ✅ DONE 2026-06-24** (PlatformDescriptor + detectPlatform seam, getHarnessedRoot routed, zero behavior change, 1357 tests; 详 `phases/26-platform-descriptor-seam/26-01-SUMMARY.md`) / 27 (B resolvers, **PLANNED** `phases/27-config-resolvers/`) / 28 (C `.agents/` proof, sketch). harnessed already ~70% abstracted (`getHarnessedRoot` SoT). Design SoT: `v9.0-cross-harness-ARCHITECTURE.md`.
- **Next**: execute Phase 27 (B) — 5 config resolvers + optional home (D2) + settingsWriter fold of the 2 env-key writers (D-C, ccHookAdd not folded); ~9 files, TDD, zero behavior change; via gsd-executor.

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

- **Phase 26 (A) DONE** — committed `88dc872` (platform.ts seam + harnessedRoot route + 5 tests; 1357 green, zero behavior change).
- **Phase 27 (B) PLANNED + this commit** — `phases/27-config-resolvers/{27-CONTEXT,27-01-PLAN}.md`. 11 files target (platform.ts +5 resolvers + optional home / settingsWriter.ts new / 2 env-key writers refactor / ccHookAdd/readClaudeConfig/setup/capabilityResolver/idempotent swaps / 2 test files). Ready-to-execute via gsd-executor. NOT executed.
- **Doc-hygiene backlog** (non-blocking, from v8.0 audit): REQUIREMENTS.md + PROJECT.md are frozen ~2026-06-05 v5.1/v6.0-era snapshots (not reconciled past v6.0); shipped v5.1–v8.0 phase dirs (09–25) live in active `phases/` not `milestones/<ver>-phases/` (de-facto v5.1+ lightweight convention). Reconcile if/when a fuller archive pass is wanted.
- **Uncommitted (not Phase 26)**: `README.md` — pre-existing intentional 2-line removal (comparison-doc pointer); leave for user to commit/decide.
- **Untracked noise (never add)**: `.understand-anything/`, `AGENTS.md`, `phases/_rogue-impl-reference/`.

## Session Continuity

- **Next command**: execute Phase 27 (B) via spawned `gsd-executor` (3 tasks: resolvers+swaps / settingsWriter fold / regression gate; TDD; user gate per 逐-gate). Main session independently re-verifies + commits.
- **Methodology lesson (still active)**: GSD plan-phase agent chain overreaches on this host — drive plan+execute hand-controlled in the main session. GSD `context: fork` slash skills fire-and-die — spawn `gsd-planner`/`gsd-executor` via Agent tool if needed. Rogue impls in `.planning/phases/_rogue-impl-reference/` (untracked). RTK note: `git status | grep` false-positives (RTK prints `ok`) — verify with `ls`/`test -f`.
