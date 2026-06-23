---
gsd_state_version: 1.0
milestone: v8.0
milestone_name: Frictionless Entry
status: executing
last_updated: "2026-06-23T00:00:00.000Z"
last_activity: 2026-06-23
progress:
  total_phases: 2
  completed_phases: 1
  total_plans: 1
  completed_plans: 1
  percent: 50
---

# STATE — harnessed

> Project memory / single source of truth for current position.
> Digest only (<100 lines) — history lives in CHANGELOG / RETROSPECTIVE / milestone audits / phase SUMMARYs, not here.

## Project Reference

- **Core value**: executable engine of the full three-layer-stack methodology — orchestration brain + prompt library, machine-codifying CLAUDE.md collaboration rules into a subagent-isolated routing engine. Does NOT vendor upstream code; composes + arbitrates heterogeneous upstreams (gstack/ECC/GSD/superpowers/…).
- **Current focus**: **v8.0 Frictionless Entry** — Phase 24 (single-command resume entry) EXECUTED + verified 2026-06-23 (awaiting commit gate); next is Phase 25 (value-prop/quickstart).
- **Latest shipped**: **v4.6.0** 2026-06-14 (npm `harnessed@4.6.0` + GitHub release). v7.0 + follow-ons (Phase 13–23) all shipped.

## Current Position

- **v8.0 in progress** — posture 守宽做深 (B); 3-milestone split (quick-wins v8.0 → cross-harness v9.0 → i18n v10.0). **Phase 24 EXECUTED + verified 2026-06-23** (zero-arg `harnessed` dashboard + NEXT + `--json`; 1352 tests; 详 `phases/24-resume-entry/24-01-SUMMARY.md`); Phase 25 still sketch-only.
- **Next**: commit Phase 24 (user gate), then plan Phase 25.

## Milestone Scope (v8.0) — 2 phases

- **Phase 24 single-command resume entry**: `harnessed` zero-arg = auto-detect active workflow (`workflows.json[repoKey]`) + report phase + continue (comet `/comet` analog). Mechanism exists (`resume.ts`/`nextStep.ts`/`workflows.json`); gap = zero-arg dispatch + ergonomics. Independent.
- **Phase 25 value-prop + quickstart**: README one-line positioning + <5min quickstart (comet legibility). Docs-only. Depends on 24.

## Accumulated Context

### Decisions (v8.0 discuss, 2026-06-23)

- **Posture** — 守宽做深 (B): keep the heterogeneous-upstream-arbitration moat; do NOT narrow to a single pairing.
- **Fact correction** — earlier "守宽 vs cross-platform conflict" premise was WRONG. gstack/ECC are already cross-harness (verified: ECC README cross-harness list; gstack deploys `.agents/.cursor/.factory/.hermes/.kiro/.omc/.openclaw/`). Cross-platform = abstract harnessed's OWN hardcoded `~/.claude/` (`setup.ts:120/194`) onto `.agents/` + per-platform + auto-detect. No generator; no CC-degrade. → v9.0.
- **State-machine + evidence-guard are NOT gaps** — harnessed has a two-tier state machine + fail-closed evidence guard already; earlier compare drafts mis-attributed them to comet (corrected).
- **Remaining real gaps** — cross-harness reach [v9.0], single-command resume [v8.0 Phase 24], i18n skill surface [v10.0], adoption/legibility [v8.0 Phase 25].
- **Competitive basis** — reuse `.planning/research/01–04` + `SUMMARY.md` + `docs/comparison.md` (do NOT re-create). 2026-06-23 increment: comet 1,562 ★ / Trellis 10,949 ★.

### Invariants (must not break)

- 守宽 moat preserved; KARPATHY-minimal surgical diffs; full gate green vs 1335-test baseline; Windows CI green.
- Biome preempt before every TS/JS commit (`pnpm exec biome check --write`).
- Every `.planning/` edit self-exemplifies v6.0 doc-discipline (this edit included).
- NEVER push to remote without explicit user approval.

### Open todos / blockers

- **ECC optional-tier batch SHIPPED** 2026-06-23 (39e8a5f code + 5b81371 planning docs). 1342 tests green, tsc/biome clean. Working tree clean (only untracked noise: `.understand-anything/`, `AGENTS.md`, `phases/_rogue-impl-reference/`).
- **Phase 24 impl awaiting commit gate** — 8 files (6 tracked M + `src/cli/lib/here.ts` + `tests/cli/here.test.ts` new) + `24-01-SUMMARY.md` + this STATE + ROADMAP checkbox. Verified (tsc=0, 1352 green, dogfood 4 forms incl. T-24-01 anti-misfire, no mutation). NOT committed.

## Session Continuity

- **Next command**: commit the uncommitted ECC optional-tier batch (user gate), then plan Phase 24.
- **Methodology lesson (still active)**: GSD plan-phase agent chain overreaches on this host — drive plan+execute hand-controlled in the main session. GSD `context: fork` slash skills fire-and-die — spawn `gsd-planner`/`gsd-executor` via Agent tool if needed. Rogue impls in `.planning/phases/_rogue-impl-reference/` (untracked). RTK note: `git status | grep` false-positives (RTK prints `ok`) — verify with `ls`/`test -f`.
