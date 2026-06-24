---
gsd_state_version: 1.0
milestone: v10.0
milestone_name: i18n Surface
status: executing
last_updated: "2026-06-24T00:00:00.000Z"
last_activity: 2026-06-24
progress:
  total_phases: 5
  completed_phases: 4
  total_plans: 4
  completed_plans: 4
  percent: 80
---

# STATE — harnessed

> Project memory / single source of truth for current position.
> Digest only (<100 lines) — history lives in CHANGELOG / RETROSPECTIVE / milestone audits / phase SUMMARYs, not here.

## Project Reference

- **Core value**: executable engine of the full three-layer-stack methodology — orchestration brain + prompt library, machine-codifying CLAUDE.md collaboration rules into a subagent-isolated routing engine. Does NOT vendor upstream code; composes + arbitrates heterogeneous upstreams (gstack/ECC/GSD/superpowers/…).
- **Current focus**: **v10.0 i18n Surface** opened 2026-06-24 — extend i18n from the shipped CLI message layer to the skill/workflow surface (comet model: ship EN+中文 skills). Full bilingual scope (user override) + Approach A parallel sibling files. 4 phases 29–32. Strategy gate DONE (`v10.0-i18n-surface-DESIGN.md`: office-hours + ceo-review). Next action: `/gsd-plan-phase 29`.
- **Latest shipped**: **v4.7.0** 2026-06-24 (npm `harnessed@4.7.0` dist-tag latest + GitHub release `v4.7.0`). Bundles **v8.0 Frictionless Entry + v9.0 Cross-Harness + ECC assimilation** (all additive backward-compat, claude default byte-identical). Detail: ROADMAP shipped rows + `milestones/v8.0-` / `v9.0-MILESTONE-AUDIT.md`.

## Current Position

- **v10.0 i18n Surface — executing (4/5 phases).** Scope + approach locked at strategy gate; phase structure approved 2026-06-24 (4→5 phases: Phase 33 added at Phase-31 plan when research split yaml from SKILL.md). Sketch-then-refine: ROADMAP carries phase one-liners; full PLAN per-phase at `/gsd-plan-phase`.
  - **Phase 29** ✅ locale-aware skill/workflow resolve layer — DONE 2026-06-24 (OPEN-2: render-step, dest single SKILL.md; en byte-identical). 详: `phases/29-locale-resolve-layer/29-01-SUMMARY.md`.
  - **Phase 30** ✅ en↔zh-Hans CI sync-guard — DONE 2026-06-24 (OPEN-1: structural parity; drift-only hard-fail gate, `scripts/check-skill-i18n-parity.mjs`; 1423 tests). 详: `phases/30-skill-i18n-sync-guard/30-01-SUMMARY.md`.
  - **Phase 31** ✅ SKILL.md surface translation — DONE 2026-06-24 (**26** zh-Hans siblings via 7 parallel subagents; guard exit 0, en byte-identical, vitest 1423/0; prose TDD-skip). 详: `phases/31-skill-translation/31-01-SUMMARY.md`.
  - **Phase 32** ✅ CLI message table gap close — DONE 2026-06-24 (zh-Hans 80→94 full parity + `i18n-parity.test.ts`; 16 keys added, 2 dead removed; vitest 1426/0). 详: `phases/32-cli-message-gap/32-01-SUMMARY.md`.
  - **Phase 33** user-facing yaml i18n — locale-aware loader + zh-Hans siblings for `role-prompts.yaml` + `disciplines/*.yaml` (mechanism + translation; excludes internal capabilities/judgments). Added from Phase-31 research.
- **Design SoT**: `.planning/v10.0-i18n-surface-DESIGN.md` (scope boundary / Approach A rationale / risks). REQUIREMENTS: `REQ-v100-*` (6 reqs).

## Accumulated Context

### Decisions (locked for v10.0)

- **Full bilingual scope** — user override of office-hours narrow recommendation (finish-14-CLI-keys-only). Logged as defended-premise founder signal; not re-litigated. Bet is forward-looking (Chinese-audience intent), not observed-demand-driven.
- **Approach A parallel sibling files** (`SKILL.md` + `SKILL.zh-Hans.md`) over B (string-table extend `t()`, anti-karpathy for 12k words of prose) and C (build-time split). Reuses v9.0 resolve layer + messages/{en,zh} file pattern. CI sync-guard makes dual-maintenance a checkable hard constraint.
- 2 OPEN design questions deferred to per-phase plan (sync-guard granularity → Phase 30; resolve-vs-bundle → Phase 29). Main-session brainstorm before executor spawn.

### Invariants (must not break)

- en-default byte-identical; claude default install byte-identical; additive-only (no en-behavior mutation).
- KARPATHY-minimal surgical diffs; full gate green vs the 1394-test baseline; Windows CI green on 3 platforms.
- Biome preempt before every TS/JS commit (`pnpm exec biome check --write`).
- Every `.planning/` edit self-exemplifies doc-discipline (STATE digest <100 lines; overview pointers not inlined narrative).
- NEVER push to remote without explicit user approval.

### Open todos / carry-forward (non-blocking, from v9.0)

- v9.0 perf follow-on (`detectPlatform` step-3 pin `readFileSync` per-call throw-catch), `migrateLegacyHarnessedRoot` not descriptor-routed, residual `~/.claude` hardcodes (check-*/uninstallers/harnessedRoot legacy-migration), doc-hygiene (shipped phase dirs 09–28 stay in active `phases/`). Detail: prior STATE git history + `milestones/v9.0-MILESTONE-AUDIT.md`. Address when touched / a fuller archive pass is wanted.
- **Uncommitted (pre-existing, not this milestone)**: `README.md` — intentional 2-line removal (comparison-doc pointer); leave for user.
- **Untracked noise (never add)**: `.understand-anything/`, `AGENTS.md`, `phases/_rogue-impl-reference/`.

## Session Continuity

- **Next command**: `/gsd-plan-phase 33` (user-facing yaml i18n — locale-aware loader + zh-Hans siblings for `role-prompts.yaml` + `disciplines/*.yaml`; mechanism + translation; the LAST v10.0 phase) when ready. Per 逐-gate, await explicit user word before planning the next phase.
- **Methodology lesson (still active)**: GSD plan-phase agent chain overreaches on this host — drive plan+execute hand-controlled in the main session. GSD `context: fork` slash skills fire-and-die — spawn `gsd-planner`/`gsd-executor` via Agent tool if needed; self-verify subagent outputs (grep files / run green gate), don't trust swallowed final text. Always produce PWF 三件套 (task_plan/progress/findings) alongside GSD PLAN/SUMMARY per phase.
