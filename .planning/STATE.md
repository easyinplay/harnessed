---
gsd_state_version: 1.0
milestone: none
milestone_name: (none — v12.0 Forward Continuation shipped npm 4.10.0; latest patch npm 4.11.3 2026-06-30)
status: no-active-milestone
last_updated: "2026-06-30T00:00:00.000Z"
last_activity: 2026-06-30
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
- **Current focus**: **No active milestone. Latest npm 4.11.3** (2026-06-30) — last real milestone v12.0 Forward Continuation (npm 4.10.0); 4.10.1→4.11.3 are post-milestone patches (see Current Position). **Process lessons (cross-session)**: (1) a 300s install spawn-timeout isn't always slow network — run the real command for the true error (a PromptScript `--global` rejection errors in 4s via `owner/repo` shorthand but hangs via full-URL); (2) local vitest can't run the `setup.test.ts` family (orphan-MCP-proc) → CI is the authoritative gate; extract a heavily-`vi.mock`'d addition into its own module ([[feedback_mock-export-gap-extract-module]]).
- **Latest shipped (npm)**: **v4.11.3** 2026-06-30 (cosmetic: HARNESSED ASCII wordmark + parrot tagline atop `harnessed setup`). Post-v12.0 patch series: 4.10.1 installer force-update robustness (idempotent rm-before-write + 120→300s timeout + `kept-existing` warn) · 4.11.0 design swap (frontend-design → design-taste-frontend taste-skill, two-stage overlay) · 4.11.1 setup robustness (atomicWrite race + version banner) · 4.11.2 taste-skill v2 PromptScript install fix (`owner/repo` shorthand + `--skill … --copy`, no `--global`). Detail: CHANGELOG `## [4.10.1]`…`## [4.11.3]`.

## Current Position

- **v12.0 Forward Continuation SHIPPED + PUBLISHED npm 4.10.0 2026-06-30**, closed lightweight (ROADMAP + MILESTONES index rows + audit 9/9+4/4; phase dirs 37–40 stay in `phases/`). Closes the horizontal-advance gap: after a task/phase finishes, derive + advance to the next from `.planning` disk SoT (no queue), vs manual re-invocation. Design = 5-repo fusion (gsd-pi/gsd-core/Trellis/comet/oh-my-pi); spec `specs/2026-06-30-forward-continuation-design.md`. Bundled the issue #2 fix. Phase-level advance is the shipped floor (OQ-2); task-level resolver-ready, CLI-unwired.
- **harnessed-site CLI docs DONE**: `reference/cli.md` next/advance (en+zh) written + pushed (commit `0f3b24d`, site repo).
- **Deferred (non-blocking)**: 9 localized READMEs design-routing two-stage deeper reword still old XOR wording (cosmetic i18n) · optional D5 `gsd_run` reuse · task-level CLI surface (resolver-ready, CLI-unwired).
- **Next: no active milestone — direction TBD.** New direction → strategy gate (`/office-hours` + `/plan-ceo-review`) per global cadence (skip only if pre-defined).

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

- **issue #2 fixed (local, npm UNPUBLISHED) 2026-06-29**: `/auto` etc. injected the philosophy-layer `SKILL.md` whose "How to invoke" was a cross-file pointer to `commands/<name>.md` → agent freestyled, bypassing the engine (no `gates`/`checkpoint`/ledger/evidence-guard). 5-repo research (comet/oh-my-pi/gsd-pi/Trellis/gsd-core) → consensus: the injected artifact itself must carry executable steps + bypass must fail at the engine/per-turn layer; cross-harness (Codex ⊅ `@import`) → inline TEXT not `@import`. Fix = **T1** inline the deterministic state-machine into all 52 SKILL invoke sections (+ anti-freestyle directive + Trellis-style positive-invariant test; marker→`v4.9.3`) + **T2** per-turn `ENGINE:` enforcement line in the `<workflow-state>` breadcrumb (`injectState.ts` + `bin/harnessed-inject-state.mjs` parity). Also **promoted `ship` to orchestrator** (a documented stage-master but missing `role-prompts.yaml` entry → `commands/ship.md` never generated + misclassified execution; added ship/ship-preflight entries + `ORCHESTRATOR_COMMANDS`/`nameToYamlHintPath`). + README `🆚 vs Native Claude Code / Codex` table. Commits `eaab2b4`(T1+ship)/`aa199a3`(T2)/`d384863`(README). **SHIPPED npm 4.10.0** (bundled into v12.0 Forward Continuation, 2026-06-30). Installed users need `harnessed setup` re-copy.
- **issue #1 fixed + PUBLISHED npm 4.9.1 2026-06-26**: `/auto` via SKILL.md drove the deprecated `harnessed run` (nested SDK spawn → silent no-op + 108s hang inside CC). Root cause = v4.0 migration updated `commands/<name>.md` to CC-native but left 48 `SKILL.md` invoke sections on `harnessed run`. Fix = footgun-anchored rewrite of all 48 SKILL files to CC-native (+ `skill-invoke-parity` anti-drift test) + `harnessed run` runtime hardening (defaultSpawnDriver fail-fast on sub failure / nested-CC guard via Phase 35 `sessionIdEnv` seam / non-interactive readline guard). vitest 1535 pass 0 fail. Released as patch: commits `953c134`/`fcb19cc`(i18n-parity regression fix)/`14dab93`(bump), tag `v4.9.1`, npm latest=4.9.1 + gh release non-draft. **Installed users need `harnessed setup` re-copy** for the SKILL fix to take effect. Lesson: ran the CI hard-fail gate scripts (`scripts/check-*.mjs`) only after a red CI — see [[feedback_ci-gate-scripts-preflight]].
- **v11.0 SHIPPED + PUBLISHED npm 4.9.0 2026-06-26** (CEO review → SHIP; full flow push→CI 3-OS green→tag `v4.9.0`→publish.yml npm-publish+gh-release; verified npm latest=4.9.0 + gh release non-draft). Closed lightweight (audit 4/4); the v5.0 state-machine arc fully delivered. **No active milestone — next direction TBD.** When starting one: strategy gate (`/office-hours` + `/plan-ceo-review`) applies for a genuinely new direction (skip only if pre-defined like v11.0 was). Baseline 1470 tests. Per 逐-gate + NEVER push without explicit user approval.
- **Methodology lesson (still active)**: GSD plan-phase agent chain overreaches on this host — drive plan+execute hand-controlled in the main session. GSD `context: fork` slash skills fire-and-die — spawn `gsd-planner`/`gsd-executor` via Agent tool if needed; self-verify subagent outputs (grep files / run green gate), don't trust swallowed final text. Always produce PWF 三件套 (task_plan/progress/findings) alongside GSD PLAN/SUMMARY per phase.
