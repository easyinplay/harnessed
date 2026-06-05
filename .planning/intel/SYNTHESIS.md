# Synthesis Summary

> Single entry point for gsd-roadmapper. Produced by gsd-doc-synthesizer.
> harnessed .planning reconciliation — MODE=new, 2026-06-05.
> Current published version: v4.1.3. Active forward milestone: v5.0.

## Doc counts by type

| Type | Count | Sources |
|------|-------|---------|
| ADR  | 4 | 0030, 0031, 0032 (LOCKED), 0033 (Proposed) |
| SPEC | 4 | PROJECT-SPEC, WORKFLOWS-MVP, ARCHITECTURE-SPEC (v4.0), STATE-MACHINE-CORE-DESIGN (v5.0) |
| DOC  | 8 | CHANGELOG, MAINTENANCE-LOG (v3.9.x), task_plan (v5.0), 5 milestone audits (v0.3/v0.4/v0.5/v2.0/v3.0) |
| **Total** | **16** | |

No UNKNOWN-confidence-low docs. All 16 classifications had `confidence: high` + `manifest_override: true`.

## Decisions locked (3)

- ADR-0030 — Bare slash command namespace policy → `docs/adr/0030-namespace-policy-bare-slash-cmd.md`
- ADR-0031 — 4-stage namespace-layered workflow architecture → `docs/adr/0031-4-stage-namespace-layered-architecture.md`
- ADR-0032 — L0 disciplines + L5b execution mechanism + rules-based routing → `docs/adr/0032-cross-cutting-disciplines-and-execution-mechanism.md`

Plus 1 Proposed (not locked): ADR-0033 — state machine ledger + evidence guard (v5.0 forward scope).

## Requirements extracted

**Shipped families (historical, all Done):** REQ-v0.3-checkpoint-routing, REQ-v0.4-benchmark-community, REQ-v0.5-hardening, REQ-v2.0-architecture-refactor, REQ-v3.0-4stage.

**Active forward scope (v5.0 Spec 1, DESIGN LOCKED, not shipped):**
REQ-v5-ledger (A), REQ-v5-evidence-guard (C), REQ-v5-recover (B), REQ-v5-handoff-drift (F), REQ-v5-additive-schema (E), REQ-v5-verify-backfill (D2-followup).
Deferred siblings: Spec 2 (D session-scoped state), Spec 3 (G per-turn hook + H scale-adaptive verify).

## Constraints (4 SPECs)

- PROJECT-SPEC (prec=1): 7 constraints — positioning, manifest schema, routing SSOT schema, workflow phases schema, checkpoint execution, engineering discipline, + 1 superseded (namespace §5.2). Types: api-contract / schema / protocol / nfr.
- WORKFLOWS-MVP (prec=2): 4 constraints — 3 MVP workflows, persistence contract, error degradation, platform constraints.
- ARCHITECTURE-SPEC v4.0: 3 constraints — orchestration-brain direction, 3 new CLIs, command-body templates.
- STATE-MACHINE-CORE-DESIGN v5.0: 4 constraints — data structures, two error postures, CLI surface, component isolation.

## Context topics (7)

Version history (CHANGELOG SoT), v3.9.x maintenance series, milestone lineage (5 PASSED), v5.0 forward-scope plan, cross-ref structure. See `context.md`.

## Conflicts

- **0 blockers**
- **0 competing-variants**
- **4 auto-resolved/info** (2 precedence auto-resolutions: ADR-0030 > PROJECT-SPEC namespace, v4.0 > v3.x execution model; 2 bounded companion-doc cross-refs)

Detail: `.planning/INGEST-CONFLICTS.md`

## Per-type intel files

- Decisions: `.planning/intel/decisions.md`
- Requirements: `.planning/intel/requirements.md`
- Constraints: `.planning/intel/constraints.md`
- Context: `.planning/intel/context.md`

## Routing guidance for roadmapper

The ingest set is largely additive shipped-history (v0.1 → v4.1.3) plus one active
forward milestone (v5.0). The roadmapper should:
1. Treat all shipped milestone requirements (v0.3-v3.0) + ADR-0030/0031/0032 as
   delivered baseline (do not re-plan).
2. Treat v5.0 (ADR-0033 Proposed + STATE-MACHINE-CORE-DESIGN + task_plan 8 phases)
   as the active forward scope to roadmap.
3. Honor the 2 auto-resolutions: bare slash cmd (not `/harnessed:*`), CC-native spawn
   (not in-process SDK spawn).

STATUS: READY — safe to route.
