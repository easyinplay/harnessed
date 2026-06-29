---
gsd_state_version: 1.0
milestone: none
milestone_name: (no active milestone — v11.0 closed lightweight)
status: no-active-milestone
last_updated: "2026-06-29T00:00:00.000Z"
last_activity: 2026-06-29
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
- **Current focus**: **No active milestone. v11.0 SHIPPED + PUBLISHED npm 4.9.0 2026-06-26** (CEO review → SHIP; `/office-hours` skipped as mismatched for a ship decision). Full release flow closed: push main → CI 3-OS green (`28209257956`) → tag `v4.9.0` → publish.yml `npm publish --provenance` + `gh release` (`28210134542` success). Verified: npm `harnessed` latest = **4.9.0**, GitHub release `v4.9.0` (non-draft). Ships v11.0 (Phases 34–36, Spec 2/3). **Next: a new milestone direction (TBD)** — the v5.0 state-machine arc (Spec 1 v4.2.0 + Spec 2/3 v11.0/4.9.0) is now fully delivered + published.
- **Latest shipped (npm)**: **v4.9.1** 2026-06-26 (npm `harnessed@4.9.1` latest + GitHub release `v4.9.1` non-draft, CI green 3-OS, provenance) — patch: issue #1 fix (SKILL.md drift → CC-native + `harnessed run` hardening). Prior 4.9.0 = v11.0 State Machine Completion; 4.8.0 = v10.0 i18n; 4.7.0 = v8.0+v9.0+ECC. Detail: CHANGELOG `## [4.9.1]` + ROADMAP shipped rows.

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

- **issue #2 fixed (local, npm UNPUBLISHED) 2026-06-29**: `/auto` etc. injected the philosophy-layer `SKILL.md` whose "How to invoke" was a cross-file pointer to `commands/<name>.md` → agent freestyled, bypassing the engine (no `gates`/`checkpoint`/ledger/evidence-guard). 5-repo research (comet/oh-my-pi/gsd-pi/Trellis/gsd-core) → consensus: the injected artifact itself must carry executable steps + bypass must fail at the engine/per-turn layer; cross-harness (Codex ⊅ `@import`) → inline TEXT not `@import`. Fix = **T1** inline the deterministic state-machine into all 52 SKILL invoke sections (+ anti-freestyle directive + Trellis-style positive-invariant test; marker→`v4.9.3`) + **T2** per-turn `ENGINE:` enforcement line in the `<workflow-state>` breadcrumb (`injectState.ts` + `bin/harnessed-inject-state.mjs` parity). Also **promoted `ship` to orchestrator** (a documented stage-master but missing `role-prompts.yaml` entry → `commands/ship.md` never generated + misclassified execution; added ship/ship-preflight entries + `ORCHESTRATOR_COMMANDS`/`nameToYamlHintPath`). + README `🆚 vs Native Claude Code / Codex` table. Commits `eaab2b4`(T1+ship)/`aa199a3`(T2)/`d384863`(README) on main, NOT pushed. Local gate green (tsc 0 / vitest 1641 / biome / skill+yaml-i18n-parity / workflow-schema); 3-OS CI not yet run. Installed users need `harnessed setup` re-copy. **Release pending user decision (would be 4.9.2).**
- **issue #1 fixed + PUBLISHED npm 4.9.1 2026-06-26**: `/auto` via SKILL.md drove the deprecated `harnessed run` (nested SDK spawn → silent no-op + 108s hang inside CC). Root cause = v4.0 migration updated `commands/<name>.md` to CC-native but left 48 `SKILL.md` invoke sections on `harnessed run`. Fix = footgun-anchored rewrite of all 48 SKILL files to CC-native (+ `skill-invoke-parity` anti-drift test) + `harnessed run` runtime hardening (defaultSpawnDriver fail-fast on sub failure / nested-CC guard via Phase 35 `sessionIdEnv` seam / non-interactive readline guard). vitest 1535 pass 0 fail. Released as patch: commits `953c134`/`fcb19cc`(i18n-parity regression fix)/`14dab93`(bump), tag `v4.9.1`, npm latest=4.9.1 + gh release non-draft. **Installed users need `harnessed setup` re-copy** for the SKILL fix to take effect. Lesson: ran the CI hard-fail gate scripts (`scripts/check-*.mjs`) only after a red CI — see [[feedback_ci-gate-scripts-preflight]].
- **v11.0 SHIPPED + PUBLISHED npm 4.9.0 2026-06-26** (CEO review → SHIP; full flow push→CI 3-OS green→tag `v4.9.0`→publish.yml npm-publish+gh-release; verified npm latest=4.9.0 + gh release non-draft). Closed lightweight (audit 4/4); the v5.0 state-machine arc fully delivered. **No active milestone — next direction TBD.** When starting one: strategy gate (`/office-hours` + `/plan-ceo-review`) applies for a genuinely new direction (skip only if pre-defined like v11.0 was). Baseline 1470 tests. Per 逐-gate + NEVER push without explicit user approval.
- **Methodology lesson (still active)**: GSD plan-phase agent chain overreaches on this host — drive plan+execute hand-controlled in the main session. GSD `context: fork` slash skills fire-and-die — spawn `gsd-planner`/`gsd-executor` via Agent tool if needed; self-verify subagent outputs (grep files / run green gate), don't trust swallowed final text. Always produce PWF 三件套 (task_plan/progress/findings) alongside GSD PLAN/SUMMARY per phase.
