# ADR 0035 — v13.0 Upstream Re-sync: gstack / gsd-core / superpowers pin bump + selective wire

- **Status**: Accepted
- **Date**: 2026-07-01
- **Supersedes**: none (sister to the v5.1 upstream re-sync, which shipped without a formal ADR)
- **Relates to**: ADR-0031/0032 (4-stage namespace + capabilities/judgments substrate), ADR-0034 (ECC assimilation deconfliction)
- **Milestone**: v13.0 Upstream Re-sync
- **Design doc**: `.planning/specs/2026-06-30-upstream-resync-v13.md`

## Context

harnessed is an assembly-ist orchestrator: it does not vendor upstream code, it pins
upstream versions in `manifests/` and orchestrates a curated SUBSET of their skills via
`workflows/capabilities.yaml` + `workflows/judgments/*.yaml` + `workflows/*/workflow.yaml`.

Three core upstreams had drifted since the last re-sync (v5.1, 2026-06-10): gstack
1.52.1.0 → 1.58.0.0, gsd-core ^1.4.1 → 1.6.0, superpowers v5.1.0 → v6.0.3. A 3-subagent
delta study (one per upstream) plus two main-session compatibility spikes established:

- The window produced **almost no new user-facing skills** (gstack: 1 = `/diagram`;
  gsd-core: 2 = mempalace capture/recall; superpowers: 0). The value is concentrated in
  **upstream hardening of already-orchestrated capabilities** — inherited for free on a
  pin bump — plus a few pre-existing-but-unwired capabilities that close real gaps.
- **SPIKE-1** (gsd 1.6.0): the locally-installed 1.6.0 still lays skills at
  `~/.claude/skills/<name>/SKILL.md`; the manifest `idempotent_check`/`verify` commands
  pass unchanged. ADR-1244's capability-CLI did not move the install surface. Bump safe.
- **SPIKE-2** (superpowers 6.0): harnessed does not wire `using-git-worktrees` (it uses
  the Agent-native `isolation: worktree`); 6.0's worktree skill now prefers harness-native
  tools, same direction. The 6.0 `subagent-driven-development` rewrite is internal skill
  semantics — the `superpowers:subagent-driven-development` cmd name and the
  `parallelism-gate` wiring are unchanged, so it is transparent to harnessed. Bump safe.

## Decision

### D1 — Pin bump all three upstreams (highest ROI, ahead of any new wire)

- **gstack → 1.58.0.0** (commit `14fc0866`): inherits token carving (`/ship` -59% always-loaded), redaction / staging-guard / codex-auth guards, AskUserQuestion text fallback, unresolved-decisions forced verdict.
- **gsd-core → ^1.6.0**: inherits verify-work deterministic UAT routing, `plan:pre` codebase-drift precheck, gsd-review forced source verification of plan claims.
- **superpowers → v6.0.3**: SDD rewrite transparent (cmd + gate unchanged); bump後 smoke-test parallelism-gate dispatch.

The pin bump alone — wiring zero new skills — is the single largest payoff of this milestone.

### D2 — Wire 5 selective capabilities

High-value:
- **verification-before-completion** (superpowers) → `task/deliver` phase `01b-verify-evidence`: a task-level per-claim evidence gate (run the verification command + paste output before claiming done/fixed/passing). Closes the gap that harnessed's verify is all phase-level — there was no task-level superpowers-native "evidence before claims" discipline. Pairs with ralph-loop verbatim COMPLETE + karpathy 完成=验收通过.
- **gsd-eval-review** (gsd) → `verify/eval-review` conditional sub (`has_ai_phase` gate): one-to-one pairing with the already-wired plan-side `gsd-ai-integration-phase` (AI-SPEC eval strategy) — verify re-checks whether the implementation actually covers the planned eval dimensions.

Optional:
- **/diagram** (gstack 1.58 NEW) → Bucket 7 optional registry, on-demand English/mermaid → editable architecture diagram (.mmd + .excalidraw + SVG). Mirrors `make-pdf`; closes the diagram-visualization gap for an ADR/SPEC-heavy project.
- **gsd-validate-phase** (gsd) → `verify/validate-phase` conditional sub (`requires_coverage_audit` gate): Nyquist requirement→test coverage backfill — the backward gap-hunt complementing forward TDD.
- **systematic-debugging** (superpowers) → a superpowers-native alias on `gsd-debug` (dual-impl alongside mattpocock `/diagnose`, mirroring the `tdd` superpowers-primary/mattpocock-fallback pattern).

### D3 — Explicit skips (noise avoidance + anti-corruption invariant)

- **gsd-mempalace-recall/capture**: a cross-session memory store overlapping `.planning/`'s three-tier discipline + planning-with-files `findings.md`. Wiring GSD's MemPalace KG = a second memory home, violating the 「一事实一个家」(one-fact-one-home) anti-corruption rule. Keep `.planning/` as the single memory home. (user-confirmed)
- **sync-gbrain**: harnessed does not depend on the gbrain stack (it has codegraph + understand-anything); wiring it = a dead, no-op-until-installed entry.
- **gstack ios-\*** (5): harnessed is a Node/TS/pnpm CLI — zero iOS surface.
- **gsd ship / pr-branch / code-review / ns-\* router / autonomous|fast|quick**: cross-layer overlap (ship → gstack governance, code-review → mattpocock; router → harnessed's own capabilities/workflow layer) or conflict with harnessed's keystone "self-owned execute, deliberately NOT wiring gsd-execute-phase".
- **superpowers writing-plans** (CLAUDE.md already forbids it, overlaps planning-with-files) / **using-git-worktrees** (Agent-native `isolation: worktree`) / **finishing-a-development-branch** (overlaps ship).

## Consequences

- `capabilities.yaml`: 35 → 39 entries (+gsd-eval-review, +verification-before-completion, +diagram, +gsd-validate-phase; systematic-debugging is an alias, not counted).
- verify-stage conditional subs: 5 → 7 (+eval-review, +validate-phase), each with its own `workflow.yaml` + `SKILL.md` + `SKILL.zh-Hans.md` + stage-routing trigger + master delegates_to.
- **Installed users must re-run `harnessed setup`** to pick up the new pins + new SKILL files.
- Additive; no schema bump; claude/en byte-identical. Full gate green (workflow-schema v3 26→28, skill-i18n-parity, skill-invoke-parity, capability-resolver, manifest dry-run, tsc 0).
- Release: minor bump (new orchestrated capabilities), target npm 4.12.0.
