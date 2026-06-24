---
gsd_state_version: 1.0
milestone: v9.0
milestone_name: Cross-Harness
status: shipped
last_updated: "2026-06-24T00:00:00.000Z"
last_activity: 2026-06-24
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
- **Current focus**: **between milestones** — v9.0 Cross-Harness shipped + closed LIGHTWEIGHT ✅ 2026-06-24 (audit passed 3/3; ROADMAP + MILESTONES index rows; phase dirs 26/27/28 stay in `phases/`; no git-tag). Next candidate: **v10.0 i18n Surface** (backlog, sketch only — not yet started). Prior audits: `milestones/v9.0-MILESTONE-AUDIT.md` + `v8.0-MILESTONE-AUDIT.md`.
- **Latest shipped**: **v4.6.0** 2026-06-14 (npm `harnessed@4.6.0` + GitHub release). v9.0 not yet npm-published (codename≠npm-version; publish is a separate pass).

## Current Position

- **No active milestone.** v9.0 Cross-Harness shipped 2026-06-24 (3/3 phases, 1394 tests, claude default byte-identical): **26 (A seam)** PlatformDescriptor + detectPlatform / **27 (B resolvers)** 5 resolvers + settingsWriter fold 262→133L / **28 (C Codex proof)** capability-aware descriptor + codexDescriptor + claude-first 5-level detection + `setup --platform codex`. Seam admits a real divergent second harness (Codex: TOML config / shared skills / no registry / settings===mcp / capability-absent writes), zero-blast on claude. Detail: ROADMAP shipped row + `milestones/v9.0-MILESTONE-AUDIT.md` + phase SUMMARYs. Design SoT: `v9.0-cross-harness-ARCHITECTURE.md`.
- **Next (RE-SEQUENCED 2026-06-24 by `/office-hours` + `/plan-ceo-review` strategy gate)**: **RELEASE PASS FIRST**, then v10.0. CEO audit found local main 21 commits ahead of origin = **v8.0 + v9.0 two full milestones built+audited but NEVER push/publish** (npm stuck 4.6.0 = no frictionless-entry/cross-harness in users' hands). Highest-leverage move = realize built value: version-bump + push (GATED) + npm publish + GitHub release (per [[feedback_github-release-on-publish]] — `publish.yml` only does `npm publish`, add `gh release` step) for v8.0+v9.0. THEN open **v10.0 i18n Surface** (full scope + Approach A parallel sibling files locked via office-hours; design `.planning/v10.0-i18n-surface-DESIGN.md`, PARKED pending release). Rationale: building 12k-word bilingual surface for 0 users while 2 milestones sit unreleased = proxy problem; real usage post-release gives the first true i18n-demand signal. Carry-forward non-blockers below (perf follow-on, residual `~/.claude` hardcodes, doc-hygiene).

## Resolved architecture decisions (v9.0 — archived)

- All v9.0 decisions resolved + closed (D-A/D-B `.agents/`-not-a-harness pivot → Codex; D-28a Codex target; D-28b capability-absent writes; D-C settingsWriter fold; D-D phases 26/27/28). Full narrative: `milestones/v9.0-MILESTONE-AUDIT.md` + Phase 28 `28-CONTEXT.md`. Do NOT re-litigate.

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

- **v9.0 phases 26/27/28 SHIPPED + CLOSED** — detail in ROADMAP shipped row + `milestones/v9.0-MILESTONE-AUDIT.md` + phase SUMMARYs. Commits (NOT pushed): `88dc872` (26) + `b76674b` (27) + `3076b25` (28) + `3a13acd` (28 plan) + `5b861c6` (audit). Push is a separate user-gated pass.
- **v9.0 perf follow-on** (non-blocking carry-forward): `detectPlatform` step-3 `.platform` pin uses `readFileSync` in try/catch → for pin-less users every `getHarnessedRoot()` throw-catches once on the hot path (architecture wanted memoization; memo conflicts with env-based test injection so executor skipped it). Guard pin read with `existsSync`, or env-keyed memo, to remove the per-call throw.
- **migrateLegacyHarnessedRoot not descriptor-routed** (non-blocking, int-v9 finding): `harnessedRoot.ts` L119-149 hardcodes `~/.claude/harnessed`, bypasses `detectPlatform` — latent if a codex-first user ever needs legacy migration. Route through descriptor when touched.
- **Out-of-scope residual `~/.claude` hardcodes** (follow-on, non-blocking): `check-mattpocock-skills.ts`, `check-token-budget.ts`, `checkAgentTeams.ts`, `npxSkillInstaller.ts`, `uninstallers/*`, `harnessedRoot.ts` legacy-migration still hardcode `.claude` — mostly CC-specific (e.g. `checkAgentTeams` reads CC env key = capability-absent for codex). Phase 28 generalizes idempotent dual-probe; the rest stay unless they block codex install correctness.
- **Doc-hygiene backlog** (non-blocking, from v8.0 audit): REQUIREMENTS.md + PROJECT.md are frozen ~2026-06-05 v5.1/v6.0-era snapshots (not reconciled past v6.0); shipped v5.1–v8.0 phase dirs (09–25) live in active `phases/` not `milestones/<ver>-phases/` (de-facto v5.1+ lightweight convention). Reconcile if/when a fuller archive pass is wanted.
- **Uncommitted (not Phase 27)**: `README.md` — pre-existing intentional 2-line removal (comparison-doc pointer); leave for user to commit/decide.
- **Untracked noise (never add)**: `.understand-anything/`, `AGENTS.md`, `phases/_rogue-impl-reference/`.

## Session Continuity

- **Next command**: `/gsd-new-milestone` for v10.0 i18n Surface (backlog big-bet ②, sketch only) when the user is ready — OR a maintenance/npm-publish pass for v9.0. No active milestone right now. Per 逐-gate, await explicit user word before opening the next milestone.
- **Methodology lesson (still active)**: GSD plan-phase agent chain overreaches on this host — drive plan+execute hand-controlled in the main session. GSD `context: fork` slash skills fire-and-die — spawn `gsd-planner`/`gsd-executor` via Agent tool if needed. Rogue impls in `.planning/phases/_rogue-impl-reference/` (untracked). RTK note: `git status | grep` false-positives (RTK prints `ok`) — verify with `ls`/`test -f`.
