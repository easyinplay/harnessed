# MILESTONES — harnessed

> Shipped history index. Generated 2026-06-09 during `.planning/` GSD-layout migration.
> Per-milestone detail: `.planning/milestones/<version>-ROADMAP.md` + `-REQUIREMENTS.md` + `-MILESTONE-AUDIT.md`.
> Phase execution records: `.planning/milestones/<version>-phases/`.
> Full narrative: `CHANGELOG.md` (46 releases) + `.planning/RETROSPECTIVE.md`.
>
> Note: milestone codenames are NOT npm release versions. harnessed publishes by npm semver
> (latest published: 4.3.0); milestone names (v2.0, v3.0, v5.0, v5.1) are spec/era codenames.
> Shipped order below is chronological, not version-monotonic.

## Shipped

| Milestone | Shipped | Summary | Phase archive |
|-----------|---------|---------|---------------|
| v0.1.0 | 2026-05-12~14 | manifest 引擎 + research workflow. | `v0.1.0-phases/` |
| v0.2.0 | 2026-05-16 | sub-task loop + extension installers. | `v0.2.0-phases/` |
| v0.3.0 | 2026-05-17 | plan-feature + checkpoint engine; routing 30/30 100%. | `v0.3.0-phases/` |
| v0.4.0 | 2026-05-19 | dogfooding + 稳定期 (benchmark, audit log, community). | `v0.4.0-phases/` |
| v2.0 | 2026-05-20 | Architecture Refactor — pure bundled SoT + capabilities + judgments. | `v2.0-phases/` |
| v3.0 | 2026-05-21 | 4-Stage Namespace-Layered Workflow — master orchestrator + 22 sub-workflow + L0 disciplines. ADR-0030/0031/0032. | `v3.0-phases/` |
| v0.5.0 / v1.0 GA | 2026-05-22 | v1.0-RC2 hardening → production GA. | `v0.5.0-phases/` + `v1.0-GA-phases/` |
| v3.9.x | 2026-05-24~30 | maintenance series (v3.9.3→v3.9.26), dogfood bug fixes. | `v3.9.x-phases/` |
| v4.0.0 | 2026-05-30 | orchestration-brain redesign — gates/prompt/checkpoint CLIs, CC-native spawn. | `v4.0-phases/` |
| v4.1.0→v4.1.3 | 2026-05-30~06-04 | yaml SoT richness + code-review fixes + P0 data-loss fixes. 1107 tests. | (in `v4.0-phases/` / CHANGELOG) |
| v5.0 State Machine Core (Spec 1) | 2026-06-05 (npm 4.2.0) | structured progress ledger + fail-closed evidence guard + `status --recover` + handoff drift + verify backfill + generated ORCHESTRATOR body. ADR-0033. 1158 tests. Spec 2/3 deferred (Backlog). Working dir `.planning/milestones/v5.0-phases/`. | `.planning/milestones/v5.0-phases/` |
| v5.1 Upstream Re-sync | 2026-06-10 (npm 4.3.0) | GSD Core rename `@opengsd/gsd-core` 1.4.1 + gstack/mattpocock manifest bump + 18 new capabilities (12 GSD Core + 6 gstack) + stage-phase-gate triggers. Keystone: execute self-owned (gsd-execute-phase NOT wired). 1167 tests. | `phases/09-gsd-core-rewire/` + `phases/10-gstack-bump-skills/` |

## Active

| Milestone | Status | Notes |
|-----------|--------|-------|
| (none) | between milestones | v5.1 shipped (4.3.0). Backlog: v5.0 Spec 2 (session-scoped state) / Spec 3 (per-turn hook + scale verify) / security hardening. Start next via `/gsd-new-milestone`. |
