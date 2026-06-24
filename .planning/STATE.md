---
gsd_state_version: 1.0
milestone: v10.0
milestone_name: i18n Surface
status: shipped
last_updated: "2026-06-25T00:00:00.000Z"
last_activity: 2026-06-25
progress:
  total_phases: 5
  completed_phases: 5
  total_plans: 5
  completed_plans: 5
  percent: 100
---

# STATE — harnessed

> Project memory / single source of truth for current position.
> Digest only (<100 lines) — history lives in CHANGELOG / RETROSPECTIVE / milestone audits / phase SUMMARYs, not here.

## Project Reference

- **Core value**: executable engine of the full three-layer-stack methodology — orchestration brain + prompt library, machine-codifying CLAUDE.md collaboration rules into a subagent-isolated routing engine. Does NOT vendor upstream code; composes + arbitrates heterogeneous upstreams (gstack/ECC/GSD/superpowers/…).
- **Current focus**: **_(no active milestone)_** — v10.0 i18n Surface SHIPPED + PUBLISHED (npm `harnessed@4.8.0` 2026-06-25). Next: open a new milestone OR maintenance. Strategy/durable rationale: `milestones/v10.0-MILESTONE-AUDIT.md`.
- **Latest shipped (npm)**: **v4.8.0** 2026-06-25 (npm `harnessed@4.8.0` dist-tag latest + GitHub release `v4.8.0`, CI green 3-OS, provenance). Ships **v10.0 i18n Surface** (skill + yaml bilingual surface + en-default bug fix). Prior 4.7.0 bundled v8.0+v9.0+ECC. Detail: ROADMAP shipped rows + `milestones/*-MILESTONE-AUDIT.md`.

## Current Position

- **v10.0 i18n Surface — SHIPPED + PUBLISHED as npm 4.8.0 (2026-06-25, 5/5 phases).** Skill+workflow+yaml bilingual surface (en+zh-Hans) via Approach A parallel sibling files + 2 CI structural-parity hard-gates; en byte-identical; fixed a pre-existing en-default bug (English users were getting Chinese discipline text). 1446 tests; CI green 3-OS. Per-phase evidence: `phases/29-…/` … `phases/33-yaml-i18n/`-`SUMMARY.md`. Audit (passed 6/6) + durable decisions: `milestones/v10.0-MILESTONE-AUDIT.md`. REQUIREMENTS `REQ-v100-*` 6/6.
- **Released**: pushed `origin/main` + tag `v4.8.0` → `publish.yml` `npm publish --provenance` (latest) + `gh release create`. npm latest = 4.8.0.

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

- **v10.0 RELEASE COMPLETE 2026-06-25** — npm `harnessed@4.8.0` published (latest, provenance) + GitHub release `v4.8.0`; pushed main + tag; CI green 3-OS. No active milestone. **Next**: open a new milestone (backlog: v5.0 Spec 2/3, security hardening pass) OR maintenance. This commit = post-release doc sync.
- **Methodology lesson (still active)**: GSD plan-phase agent chain overreaches on this host — drive plan+execute hand-controlled in the main session. GSD `context: fork` slash skills fire-and-die — spawn `gsd-planner`/`gsd-executor` via Agent tool if needed; self-verify subagent outputs (grep files / run green gate), don't trust swallowed final text. Always produce PWF 三件套 (task_plan/progress/findings) alongside GSD PLAN/SUMMARY per phase.
