---
gsd_state_version: 1.0
milestone: v9.0
milestone_name: Cross-Harness
status: executing
last_updated: "2026-06-23T00:00:00.000Z"
last_activity: 2026-06-23
progress:
  total_phases: 3
  completed_phases: 3
  total_plans: 3
  completed_plans: 3
  percent: 100
---

# STATE — harnessed

> Project memory / single source of truth for current position.
> Digest only (<100 lines) — history lives in CHANGELOG / RETROSPECTIVE / milestone audits / phase SUMMARYs, not here.

## Project Reference

- **Core value**: executable engine of the full three-layer-stack methodology — orchestration brain + prompt library, machine-codifying CLAUDE.md collaboration rules into a subagent-isolated routing engine. Does NOT vendor upstream code; composes + arbitrates heterogeneous upstreams (gstack/ECC/GSD/superpowers/…).
- **Current focus**: **v9.0 Cross-Harness COMPLETE 3/3 ✅ 2026-06-24** (26 seam + 27 resolvers + 28 Codex proof; 1394 tests, claude default byte-identical). **Next: `/gsd-audit-milestone` v9.0 → LIGHTWEIGHT close.** SoT `v9.0-cross-harness-ARCHITECTURE.md` + Phase 28 pivot CONTEXT. Prior: v8.0 shipped (`milestones/v8.0-MILESTONE-AUDIT.md`).
- **Latest shipped**: **v4.6.0** 2026-06-14 (npm `harnessed@4.6.0` + GitHub release). v7.0 + follow-ons (Phase 13–23) all shipped.

## Current Position

- **v9.0 Cross-Harness ACTIVE** — posture 守宽做深 (B); 3-milestone split (v8.0 quick-wins ✓ → v9.0 cross-harness ◐ → v10.0 i18n). Architecture locked 2026-06-23 (inline design + `/plan-eng-review`, scope B, APPROVED): `PlatformDescriptor` + `detectPlatform()` (claude-first, zero blast) + central config resolvers + `.agents/` 2nd-platform proof; no generator/matrix (upstreams portable). 3 phases ALL ✅: **26 (A seam)** (PlatformDescriptor + detectPlatform seam; `26-01-SUMMARY.md`) / **27 (B resolvers)** (5 resolvers + optional home + settingsWriter fold 262→133L; `27-01-SUMMARY.md`) / **28 (C Codex proof)** (capability-aware descriptor + codexDescriptor + 5-level detection + `setup --platform codex` + idempotent generalize; 1394 tests +25, 0 existing modified; `28-codex-platform/28-01-SUMMARY.md`). Seam admits a real divergent second harness (Codex: TOML config / shared skills / no registry / settings===mcp / capability-absent writes), zero-blast on claude. Design SoT: `v9.0-cross-harness-ARCHITECTURE.md` + Phase 28 pivot CONTEXT.
- **Next**: `/gsd-audit-milestone` v9.0 → LIGHTWEIGHT close (per project memory: ROADMAP + MILESTONES index rows + audit; NO git-tag; phase dirs stay in `phases/`). Then pick next milestone (v10.0 i18n surface, backlog).

## Open architecture decisions (v9.0, from ARCHITECTURE doc §7)

- **D-A/D-B RESOLVED** (Phase 28 discuss, 2026-06-24, anti-stale verified host+docs): `.agents/` is a skills-ONLY convention (`vercel-labs/skills` CLI; only `skills/` + `.skill-lock.json`; NO settings/commands/plugins/mcp; `.agents/skills/` canonical, `.claude` symlinks in). So `.agents/` is NOT a viable full second platform — the §7 D-A/D-B premise was wrong. **D-28a**: pivot target → **Codex** (`~/.codex/`, real full harness; Cursor rejected — uninstalled + opaque app-DB). **D-28b**: codex write surfaces = **capability-absent** (settings/MCP in `config.toml` TOML; CC env keys CC-specific; no TOML writer).
- **D-C** settings env-key writer centralization → ✅ resolved in Phase 27. **D-D** A/B/C as phases 26/27/28 → locked (C reshaped to Codex, not `.agents/`).

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
- **Phase 27 (B) DONE + this commit** — 5 resolvers + optional home (D2) in platform.ts / NEW settingsWriter.ts fold of 2 env-key writers (262→133L) / 8 swap sites + 2 idempotent routed / 12 new tests. Main-session re-verified: 1369 tests green (existing UNCHANGED = regression proof), biome clean, tsc 0. 详 `27-01-SUMMARY.md`.
- **Phase 28 (C) DONE + this commit** — capability-aware descriptor + codexDescriptor + 5-level detection + 2 writers gated + null-tolerant resolvers + `setup --platform` + idempotent generalize (`harnessSkillsDirs`). Main-session re-verified: 1394 tests green (0 existing modified = regression-clean), biome clean, tsc 0, deviation (auto-probe try/catch) audited sound. 详 `28-01-SUMMARY.md`.
- **v9.0 perf follow-on** (non-blocking, for milestone audit): `detectPlatform` step-3 `.platform` pin uses `readFileSync` in try/catch → for pin-less users every `getHarnessedRoot()` throw-catches once on the hot path (architecture wanted memoization; memo conflicts with env-based test injection so executor skipped it). Guard pin read with `existsSync`, or env-keyed memo, to remove the per-call throw.
- **Out-of-scope residual `~/.claude` hardcodes** (follow-on, non-blocking): `check-mattpocock-skills.ts`, `check-token-budget.ts`, `checkAgentTeams.ts`, `npxSkillInstaller.ts`, `uninstallers/*`, `harnessedRoot.ts` legacy-migration still hardcode `.claude` — mostly CC-specific (e.g. `checkAgentTeams` reads CC env key = capability-absent for codex). Phase 28 generalizes idempotent dual-probe; the rest stay unless they block codex install correctness.
- **Doc-hygiene backlog** (non-blocking, from v8.0 audit): REQUIREMENTS.md + PROJECT.md are frozen ~2026-06-05 v5.1/v6.0-era snapshots (not reconciled past v6.0); shipped v5.1–v8.0 phase dirs (09–25) live in active `phases/` not `milestones/<ver>-phases/` (de-facto v5.1+ lightweight convention). Reconcile if/when a fuller archive pass is wanted.
- **Uncommitted (not Phase 27)**: `README.md` — pre-existing intentional 2-line removal (comparison-doc pointer); leave for user to commit/decide.
- **Untracked noise (never add)**: `.understand-anything/`, `AGENTS.md`, `phases/_rogue-impl-reference/`.

## Session Continuity

- **Next command**: `/gsd-audit-milestone` v9.0 (hand-controlled; spawn `gsd-integration-checker` if needed per host overreach lesson) → if passed, LIGHTWEIGHT close (ROADMAP + MILESTONES index rows + `milestones/v9.0-MILESTONE-AUDIT.md`; NO git-tag; phase dirs 26/27/28 stay in `phases/`). Per 逐-gate, await explicit user word. Then next milestone (v10.0 i18n surface).
- **Methodology lesson (still active)**: GSD plan-phase agent chain overreaches on this host — drive plan+execute hand-controlled in the main session. GSD `context: fork` slash skills fire-and-die — spawn `gsd-planner`/`gsd-executor` via Agent tool if needed. Rogue impls in `.planning/phases/_rogue-impl-reference/` (untracked). RTK note: `git status | grep` false-positives (RTK prints `ok`) — verify with `ls`/`test -f`.
