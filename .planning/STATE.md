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
- **Current focus**: **_(no active milestone)_** — v10.0 i18n Surface CLOSED lightweight 2026-06-25 (5/5 phases, local-only, NOT npm-published). Next: release-pass decision (v10.0 → npm 4.8.0?) OR open a new milestone. Strategy/durable rationale: `milestones/v10.0-MILESTONE-AUDIT.md`.
- **Latest shipped (npm)**: **v4.7.0** 2026-06-24 (npm `harnessed@4.7.0` dist-tag latest + GitHub release `v4.7.0`). Bundles **v8.0 + v9.0 + ECC** (additive, claude default byte-identical). **v10.0 built but UNPUBLISHED** (release-pass pending). Detail: ROADMAP shipped rows + `milestones/*-MILESTONE-AUDIT.md`.

## Current Position

- **v10.0 i18n Surface — SHIPPED (closed lightweight 2026-06-25, 5/5 phases, local-only).** Skill+workflow+yaml bilingual surface (en+zh-Hans) via Approach A parallel sibling files + 2 CI structural-parity hard-gates; en byte-identical; fixed a pre-existing en-default bug (English users were getting Chinese discipline text). 1446 tests. Per-phase evidence: `phases/29-…/` … `phases/33-yaml-i18n/`-`SUMMARY.md`. Audit (passed 6/6) + durable decisions: `milestones/v10.0-MILESTONE-AUDIT.md`. REQUIREMENTS `REQ-v100-*` 6/6.
- **Local commits (NOT pushed)**: implementation + close per phase (29–33); latest `52ba1de`. npm still 4.7.0.

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

- **Next: v10.0 RELEASE-PASS decision** (milestone-close DONE 2026-06-25 — ROADMAP/MILESTONES shipped-index rows + `milestones/v10.0-MILESTONE-AUDIT.md` + STATE flip). Decide whether v10.0 (skill+yaml i18n surface) ships as a new npm semver (e.g. **4.8.0**) since 4.7.0. Release mechanics (per gsd-planning-reconciled-v5 + [[github-release-on-publish]]): bump package.json → CHANGELOG `## [4.8.0]` header → commit → **push main (user-gated)** → CI green 3-OS → tag `v4.8.0` → publish.yml fires npm publish --provenance + `gh release create`. Release lesson: don't let closed milestones pile up unreleased. OR open a new milestone instead. Per 逐-gate, await user word.
- **Methodology lesson (still active)**: GSD plan-phase agent chain overreaches on this host — drive plan+execute hand-controlled in the main session. GSD `context: fork` slash skills fire-and-die — spawn `gsd-planner`/`gsd-executor` via Agent tool if needed; self-verify subagent outputs (grep files / run green gate), don't trust swallowed final text. Always produce PWF 三件套 (task_plan/progress/findings) alongside GSD PLAN/SUMMARY per phase.
