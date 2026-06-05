# REQUIREMENTS — harnessed

> Regenerated 2026-06-05 from `.planning/intel/requirements.md` reconciliation.
> Shipped families = delivered baseline (do NOT re-plan). Active forward scope = v5.0 Spec 1.
> Current published version: **v4.1.3**. Active milestone: **v5.0 State Machine Core**.

---

## Shipped requirement families (delivered baseline — all Done)

> Historical record. Detail lives in `.planning/milestones/*-MILESTONE-AUDIT.md` + `CHANGELOG.md` (authoritative, 46 releases).

| Family | Version | Status | Scope |
|--------|---------|--------|-------|
| REQ-v0.1-manifest | v0.1.0 | ✅ Done | manifest 引擎 + research workflow. |
| REQ-v0.2-subtask | v0.2.0 | ✅ Done | sub-task loop + extension installers. |
| REQ-v0.3-checkpoint-routing | v0.3.0 | ✅ Done (7/7) | checkpoint engine + plan-feature + gstack probe + aliases/deprecation + version lock + routing hit-rate 30/30 100% + token budget doctor. |
| REQ-v0.4-benchmark-community | v0.4.0 | ✅ Done (6/6) | dogfooding benchmark + routing audit log + co-maintainer onboarding + GitHub Sponsors + stale-bot + ADR 0018-0020. |
| REQ-v0.5-hardening | v0.5.0 | ✅ Done (4/4) | audit-log consumer (`--filter`) + state.ts concurrent-write lock + `harnessed uninstall` (7-method) + path-traversal guard (5-vector OWASP A1) + ADR 0021/0022. |
| REQ-v2.0-architecture-refactor | v2.0 | ✅ Done (16/16, R20.6 dropped) | pure bundled SoT + capabilities.yaml flat map + expr-eval gate grammar + judgments multi-file + 4 v2 workflows + release-notes migration + ADR 0024-0029. |
| REQ-v3.0-4stage | v3.0 | ✅ Done (13/13) | 4-stage namespace-layered (22 v3 workflows) + master auto gate-route + bare slash cmd + nested dir + L0 disciplines + L5b execution mechanism + rules-based routing + gstack capabilities registry. Implements ADR-0030/0031/0032. |
| REQ-v3.9.x-maintenance | v3.9.3→v3.9.26 | ✅ Done | dogfood bug fixes + Windows compat + Option A architecture fix (interactive clarify → main session). |
| REQ-v4.0-orchestration-brain | v4.0.0 | ✅ Done | gates/prompt/checkpoint CLIs; CC-native spawn replaces in-process SDK spawn. Implements ARCHITECTURE-SPEC v4.0. |
| REQ-v4.1-yaml-sot-richness | v4.1.0→v4.1.3 | ✅ Done | tools injection + master recursion + disciplines_applied injection + gates→prompt handoff fix + P0 data-loss fixes (atomic write / gc no-op / rollback two-pass). 1107 tests. |

---

## Active forward scope — v5.0 State Machine Core (Spec 1)

> Source: `.planning/v5.0/STATE-MACHINE-CORE-DESIGN.md` + `task_plan.md` + ADR-0033 (Proposed).
> Status: DESIGN LOCKED, pending plan-phase → execute → verify. Schema (Phase 1) + verify-backfill (Phase 7) already done in working tree (uncommitted).

### REQ-v5-additive-schema (E) — additive ledger schema, no version bump
- **Source**: STATE-MACHINE-CORE-DESIGN §3, ADR-0033 D3.
- **Description**: Add optional `EvidenceRef {path, sha256}` + `SubProgressEntry` + `sub_progress: Optional(Array(...))` to `currentWorkflow.v1`. `checkpoint.v1.ts` NOT modified (single SoT).
- **Acceptance**: additive optional fields only; no `SCHEMA_VERSIONS` bump; no migrator; old `current-workflow.json` (no sub_progress) still `Value.Check`-passes; readers use `?? []`; zero data-loss; no FSM library.

### REQ-v5-ledger (A) — structured progress ledger, ledger-only progression
- **Source**: STATE-MACHINE-CORE-DESIGN §1-4, ADR-0033 D1.
- **Description**: per-sub progress ledger in `current-workflow.json` (sole SoT), seeded upfront from gates plan.
- **Acceptance**: `seedLedger(plan)` maps fire→{pending, gate_fired:true} / skip→{skipped, gate_fired:false, reason}; `markSub` pure transitions (new array, throws on unknown sub, input not mutated); `nextPending` returns first pending; ledger NOT copied into checkpoint snapshot.

### REQ-v5-evidence-guard (C) — fail-closed evidence exit guard
- **Source**: STATE-MACHINE-CORE-DESIGN §5, ADR-0033 D2.
- **Description**: `checkpoint complete <sub>` verifies declared `artifacts_expected` exist before flipping to done. Deliberate fail-CLOSED exception to ADR-0029 fail-soft.
- **Acceptance**: missing artifact & !force → block (exit 1, entry stays pending, print missing); present → sha256 recorded, `evidence_status:'verified'`, evidence=found; none declared → `'none_declared'` (rendered distinctly, NOT a pass); `--force` → `'overridden'` (audit-flagged). Three-state posture, never collapse to boolean.

### REQ-v5-recover (B) — `harnessed status --recover`
- **Source**: STATE-MACHINE-CORE-DESIGN §7, task_plan Phase 5.
- **Description**: structured post-compaction recovery output (done/pending/skipped + next command + drift warns).
- **Acceptance**: full ledger render with markers + evidence_status + `→ next: harnessed prompt <sub>`; empty-ledger graceful degrade ("no ledger — run gates + start"); `none_declared` rendered distinctly; drift line on sha256 mismatch.

### REQ-v5-handoff-drift (F) — evidence sha256 drift detection
- **Source**: STATE-MACHINE-CORE-DESIGN §6, ADR-0033 D4.
- **Description**: `resume` / `status --recover` re-hash evidence paths; mismatch → drift warn (not block).
- **Acceptance**: cross-CC source drift detected mechanically; warn-only (user adjudicates per cc-handoff.md); complete-missing blocks while resume-drift warns (not contradictory).

### REQ-v5-verify-backfill (D2-followup) — verify/* artifacts_expected backfill
- **Source**: STATE-MACHINE-CORE-DESIGN §12, task_plan Phase 7.
- **Description**: audit + backfill `artifacts_expected` on all `workflows/verify/*/workflow.yaml` leafs so the evidence guard is real where it matters most.
- **Acceptance**: every verify leaf declares ≥1 artifact; check-workflow-schema passes; no `none_declared` for verify subs in e2e run.

### REQ-v5-orchestrator-body — generated ORCHESTRATOR command body
- **Source**: STATE-MACHINE-CORE-DESIGN, task_plan Phase 6, ADR-0033 D3.
- **Description**: `generateCommands` deterministically emits the `gates → checkpoint start --plan` → per-sub `prompt`+spawn+`checkpoint complete` → `checkpoint fail` on error sequence.
- **Acceptance**: generated body contains gates→start→complete/fail sequence (harnessed-generated marker); snapshot updated; biome + tsc clean.

### REQ-v5-release — v5.0 release gate
- **Source**: task_plan Phase 8.
- **Description**: e2e validation + full quality gate + version bump.
- **Acceptance**: e2e PowerShell (gates → start --plan → complete missing⇒exit1 / --force⇒pass / none_declared → status --recover → mutate⇒drift warn); biome + tsc + full vitest green; package.json → 5.0.0; CHANGELOG v5.0.0 entry; STOP before push (await user approval).

---

## Deferred (out of Spec 1 scope, same v5.0 milestone)

- **Spec 2** — D: session-scoped state (`sessions/<CLAUDE_SESSION_ID>.json`) + single-session fallback.
- **Spec 3** — G: per-turn injection hook + H: scale-adaptive verify strength.

---

## Traceability (v5.0 forward scope)

| Requirement | Phase | Status |
|-------------|-------|--------|
| REQ-v5-additive-schema (E) | Phase 1 | ✅ Done (working tree) |
| REQ-v5-ledger (A) | Phase 2 | Pending |
| REQ-v5-evidence-guard (C) | Phase 3 + Phase 4 | Pending |
| REQ-v5-recover (B) | Phase 5 | Pending |
| REQ-v5-handoff-drift (F) | Phase 5 | Pending |
| REQ-v5-orchestrator-body | Phase 6 | Pending |
| REQ-v5-verify-backfill (D2-followup) | Phase 7 | ✅ Done (working tree) |
| REQ-v5-release | Phase 8 | Pending |

Coverage: 8/8 forward requirements mapped ✓ · No orphans.
