# Requirements Intel

> Synthesized by gsd-doc-synthesizer (2026-06-05).
> No PRD-type docs in the ingest set. Requirements below are derived from the
> milestone-audit DOCs (shipped R-codes, historical record) + the forward-scope
> v5.0 SPEC/task_plan. Shipped requirements are CONTEXT (already delivered);
> the v5.0 set is the active forward scope.
>
> No competing acceptance variants detected — each requirement family belongs to a
> distinct version era (no two docs assert divergent acceptance on the same scope).

---

## Shipped requirement families (historical, from milestone audits — all Done)

### REQ-v0.3-checkpoint-routing (R4.2 + R7.1-R7.6)
- **source**: `.planning/milestones/v0.3.0-MILESTONE-AUDIT.md`
- **status**: shipped (7/7 Done, v0.3.0 PASSED 2026-05-17)
- checkpoint engine + plan-feature workflow + gstack prefix probe + aliases/deprecation + known-good version lock + routing hit-rate ≥85% (30/30 = 100%) + token budget doctor check.

### REQ-v0.4-benchmark-community (R8.1-R8.5)
- **source**: `.planning/milestones/v0.4.0-MILESTONE-AUDIT.md`
- **status**: shipped (6/6 Done, v0.4.0 PASSED 2026-05-19)
- dogfooding benchmark (public format) + routing audit log (`src/audit`) + co-maintainer onboarding + GitHub Sponsors + stale-bot + ADR backfill (0018/0019/0020).

### REQ-v0.5-hardening (R10.1-R10.4)
- **source**: `.planning/milestones/v0.5.0-MILESTONE-AUDIT.md`
- **status**: shipped (4/4 Done, v0.5.0 PASSED 2026-05-22)
- audit-log consumer (`--filter`) + state.ts concurrent-write lock + `harnessed uninstall` (7-method) + path-traversal guard (5-vector OWASP A1) + ADR 0021/0022.

### REQ-v2.0-architecture-refactor (R20.1-R20.x, R20.6 DROPPED)
- **source**: `.planning/milestones/v2.0-MILESTONE-AUDIT.md`
- **status**: shipped (16 R20.x Done, v2.0 GA 2026-05-20)
- Pure bundled SoT distribution + capabilities.yaml flat map + expr-eval gate grammar + judgments/ multi-file + 4 v2 workflows + release-notes-only migration + mattpocock conditional routing + ADR 0024-0029.

### REQ-v3.0-4stage (R30.1-R30.13)
- **source**: `.planning/milestones/v3.0-MILESTONE-AUDIT.md`
- **status**: shipped (13/13 Done, v3.0 GA 2026-05-21)
- 4-stage namespace-layered ship (22 v3 workflows) + master auto gate-route + bare slash cmd (ADR-0030) + nested dir (D-03) + release-notes migration + L0 Discipline Substrate + L5b Execution Mechanism + rules-based routing + capabilities v3 category field + gstack 33 capabilities registry. Implements ADR-0030/0031/0032.

---

## Active forward-scope requirements — v5.0 State Machine Core (Spec 1: A/B/C/E/F)

> source: `.planning/milestones/v5.0-phases/STATE-MACHINE-CORE-DESIGN.md` (SPEC) + `.planning/milestones/v5.0-phases/task_plan.md` (DOC) + ADR-0033 (Proposed)
> Status: DESIGN LOCKED, pending plan-phase → execute → verify. NOT yet shipped.

### REQ-v5-ledger (A — structured progress ledger)
- **source**: STATE-MACHINE-CORE-DESIGN.md §1-4, ADR-0033 D1
- **description**: per-sub progress ledger in `current-workflow.json` (sole SoT), seeded upfront from gates plan.
- **acceptance**: `seedLedger(plan)` maps fire→pending / skip→skipped+reason; `markSub` pure transitions; old `current-workflow.json` (no sub_progress) still `Value.Check`-passes; ledger NOT copied into checkpoint snapshot.

### REQ-v5-evidence-guard (C — fail-closed evidence exit guard)
- **source**: STATE-MACHINE-CORE-DESIGN.md §5, ADR-0033 D2
- **description**: `checkpoint complete <sub>` verifies declared `artifacts_expected` exist before flipping to done.
- **acceptance**: missing artifact → block (exit 1, entry stays pending); present → sha256 recorded, `evidence_status:'verified'`; none declared → `'none_declared'` (rendered distinctly, NOT a pass); `--force` → `'overridden'` (audit-flagged). Fail-closed posture, separate from ADR-0029 fail-soft.

### REQ-v5-recover (B — `harnessed status --recover`)
- **source**: STATE-MACHINE-CORE-DESIGN.md §7, task_plan Phase 5
- **description**: structured post-compaction recovery output (done/pending/skipped + next command + drift warns).
- **acceptance**: full ledger render; empty-ledger graceful degrade ("no ledger — run gates + start"); `none_declared` rendered distinctly; drift line on sha256 mismatch.

### REQ-v5-handoff-drift (F — evidence sha256 drift)
- **source**: STATE-MACHINE-CORE-DESIGN.md §6, ADR-0033 D4
- **description**: `resume` / `status --recover` re-hash evidence paths; mismatch → drift warn (not block).
- **acceptance**: cross-CC source drift detected mechanically; warn-only (user adjudicates per cc-handoff.md); complete-missing blocks while resume-drift warns (not contradictory).

### REQ-v5-additive-schema (E — ledger-only implicit progression + no version bump)
- **source**: STATE-MACHINE-CORE-DESIGN.md §3, ADR-0033 D3
- **acceptance**: additive optional fields only; no `SCHEMA_VERSIONS` bump; no migrator; zero data-loss; no FSM library (ledger is plain array, progression = field writes).

### REQ-v5-verify-backfill (D2-followup)
- **source**: STATE-MACHINE-CORE-DESIGN.md §12, task_plan Phase 7
- **description**: audit + backfill `artifacts_expected` on all `workflows/verify/*/workflow.yaml` leafs so the evidence guard is real where it matters most.
- **acceptance**: every verify leaf declares ≥1 artifact; no `none_declared` for verify subs in e2e run.

**Deferred to sibling specs (same v5.0 milestone, out of Spec 1 scope)**:
- Spec 2 — D: session-scoped state (`sessions/<CLAUDE_SESSION_ID>.json`) + single-session fallback.
- Spec 3 — G: per-turn injection hook + H: scale-adaptive verify strength.
