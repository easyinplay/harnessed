---
gsd_state_version: 1.0
milestone: v11.0
milestone_name: State Machine Completion
status: planning
last_updated: "2026-06-25T00:00:00.000Z"
last_activity: 2026-06-25
progress:
  total_phases: 3
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
- **Current focus**: **v11.0 State Machine Completion** opened 2026-06-25 — finish the v5.0 state-machine's deferred Spec 2 + Spec 3 (D session-scoped state / G per-turn injection hook / H scale-adaptive verify strength). Scope SoT = `milestones/v5.0-phases/STATE-MACHINE-CORE-DESIGN.md` §1 (Spec 2/3 lines 43-44). Strategy gate SKIPPED (scope pre-defined in the v5.0 design — transparent). Additive backward-compat. **Phase 34 PLANNED (ready-to-execute)** — next action: execute Phase 34 (T34.1 `activeKey` first, TDD red→green).
- **Latest shipped (npm)**: **v4.8.0** 2026-06-25 (npm `harnessed@4.8.0` latest + GitHub release `v4.8.0`, CI green 3-OS, provenance). Ships **v10.0 i18n Surface**. Prior 4.7.0 = v8.0+v9.0+ECC. Detail: ROADMAP shipped rows + `milestones/*-MILESTONE-AUDIT.md`.

## Current Position

- **v11.0 State Machine Completion — in progress (0/3 phases; Phase 34 planned).** Opened 2026-06-25 to close the v5.0 deferred specs. Full scope D+G+H (user-chosen). Sketch-then-refine: ROADMAP carries phase one-liners; full PLAN per-phase at plan time.
  - **Phase 34 — PLANNED (ready-to-execute).** session-scoped state (Spec 2/D). Design locked via brainstorming: **composite key `<repoKey>::<sessionId>`** on the Phase 15 `workflows.json` store (NOT the v5.0 sketch's `sessions/<id>.json` — Phase 15 already repo-keyed the store). sid = `process.env.CLAUDE_CODE_SESSION_ID`; no sid → bare repoKey (byte-identical). Plan: `phases/34-session-scoped-state/` (PLAN + PWF 三件套). Additive, no schema bump. < 5 files.
  - **Phase 35** per-turn injection hook (Spec 3/G) — render ledger state into the prompt each turn (Trellis per-turn-hook analog). Feasibility (CC session-level hook) → `/plan-eng-review` at this phase's plan.
  - **Phase 36** scale-adaptive verify strength (Spec 3/H) — verify rigor scales with change size/risk.
- **Scope SoT**: `milestones/v5.0-phases/STATE-MACHINE-CORE-DESIGN.md` (Spec 1 shipped v4.2.0; Spec 2/3 the deferred tail this milestone delivers). REQUIREMENTS: `REQ-v110-*` (4 reqs).

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

- **v11.0 OPENED 2026-06-25; Phase 34 PLANNED 2026-06-25** (v10.0 shipped+published npm 4.8.0 prior). Strategy gate skipped (scope in v5.0 design, declared). Full scope D+G+H. **Next: execute Phase 34** — TDD red→green, T34.1 `activeKey()` in `src/checkpoint/workflowStore.ts`, then T34.2 rewire `state.ts:91/109`, then T34.3 gate+e2e. Plan at `phases/34-session-scoped-state/`. Baseline 1446 tests. Per 逐-gate, await user word before each commit/phase-advance.
- **Methodology lesson (still active)**: GSD plan-phase agent chain overreaches on this host — drive plan+execute hand-controlled in the main session. GSD `context: fork` slash skills fire-and-die — spawn `gsd-planner`/`gsd-executor` via Agent tool if needed; self-verify subagent outputs (grep files / run green gate), don't trust swallowed final text. Always produce PWF 三件套 (task_plan/progress/findings) alongside GSD PLAN/SUMMARY per phase.
