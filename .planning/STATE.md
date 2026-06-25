---
gsd_state_version: 1.0
milestone: none
milestone_name: (no active milestone — v11.0 closed lightweight)
status: no-active-milestone
last_updated: "2026-06-26T00:00:00.000Z"
last_activity: 2026-06-26
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# STATE — harnessed

> Project memory / single source of truth for current position.
> Digest only (<100 lines) — history lives in CHANGELOG / RETROSPECTIVE / milestone audits / phase SUMMARYs, not here.

## Project Reference

- **Core value**: executable engine of the full three-layer-stack methodology — orchestration brain + prompt library, machine-codifying CLAUDE.md collaboration rules into a subagent-isolated routing engine. Does NOT vendor upstream code; composes + arbitrates heterogeneous upstreams (gstack/ECC/GSD/superpowers/…).
- **Current focus**: **No active milestone.** **v11.0 State Machine Completion CLOSED lightweight 2026-06-26** (3 phases 34–36, closed the v5.0 deferred Spec 2/3; audit passed 4/4 — `milestones/v11.0-MILESTONE-AUDIT.md`). Built local, npm UNPUBLISHED. Next action: a **v11.0 release-pass decision** (npm bump 4.8.0→4.9.0? — lean release per the v9.0 "don't pile up unpublished" lesson; a release pass is the natural place for `/office-hours` + `/plan-ceo-review` re-sequencing) and/or the next milestone direction.
- **Latest shipped (npm)**: **v4.8.0** 2026-06-25 (npm `harnessed@4.8.0` latest + GitHub release `v4.8.0`, CI green 3-OS, provenance). Ships **v10.0 i18n Surface**. Prior 4.7.0 = v8.0+v9.0+ECC. Detail: ROADMAP shipped rows + `milestones/*-MILESTONE-AUDIT.md`.

## Current Position

- **No active milestone.** v11.0 (Phases 34–36) closed lightweight 2026-06-26 — collapsed to the ROADMAP/MILESTONES shipped-index + `milestones/v11.0-MILESTONE-AUDIT.md` (passed 4/4). Phase dirs 34–36 stay in `phases/`. Local commits `42273d5`/`03ddaf6`/`a489745`; built local, npm UNPUBLISHED.
- **Open decisions (next gate)**: (1) **v11.0 release pass** — bump npm 4.8.0→4.9.0 + CHANGELOG `## [4.9.0]` header → tag → publish.yml auto npm-publish + gh-release (lean release; natural place for `/office-hours` + `/plan-ceo-review`). (2) next milestone direction (TBD). The v5.0 state-machine arc (Spec 1 v4.2.0 + Spec 2/3 v11.0) is now fully delivered.

## Accumulated Context

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

- **v11.0 CLOSED lightweight 2026-06-26** (34 session-state + 35 per-turn hook + 36 adaptive-verify; audit 4/4; ROADMAP/MILESTONES collapsed to shipped-index; phase dirs stay in `phases/`; NO git-tag vN.0). Built local, npm UNPUBLISHED (latest 4.8.0). **No active milestone. Next: v11.0 release-pass decision** (npm 4.8.0→4.9.0 + CHANGELOG `## [4.9.0]` → tag → publish.yml auto npm-publish + gh-release; lean release per v9.0 "don't pile up unpublished" lesson — natural place for `/office-hours` + `/plan-ceo-review`) and/or next milestone direction. Baseline 1470 tests. Per 逐-gate, await user word before each commit/release/phase-advance.
- **Methodology lesson (still active)**: GSD plan-phase agent chain overreaches on this host — drive plan+execute hand-controlled in the main session. GSD `context: fork` slash skills fire-and-die — spawn `gsd-planner`/`gsd-executor` via Agent tool if needed; self-verify subagent outputs (grep files / run green gate), don't trust swallowed final text. Always produce PWF 三件套 (task_plan/progress/findings) alongside GSD PLAN/SUMMARY per phase.
