# Context Intel (DOCs)

> Synthesized by gsd-doc-synthesizer (2026-06-05) from 8 classified DOCs.
> Running notes keyed by topic, with source attribution. These are shipped-history
> and supplementary context — not decisions or requirements. They establish the
> version lineage the roadmapper should treat as already-delivered baseline.

---

## Topic: Version history (authoritative SoT)

- **source**: `CHANGELOG.md` (Keep-a-Changelog, 46 releases v0.4.0 → v4.1.3)
- Current published version: **v4.1.3** (2026-06-04).
- Key inflection points:
  - **[3.0.0]** — BREAKING: 4-stage namespace-layered workflow (drops `/plan-feature`, `/execute-task`, `/verify-work`; alias map migration). Implements ADR-0030/0031/0032.
  - **[4.0.0]** (2026-05-30) — BREAKING: shift from execution engine to orchestration brain + prompt library. 3 new秒级 CLIs (`gates` / `prompt` / `checkpoint`); slash commands no longer pipe to in-process `harnessed run` (now CI/headless-only). Command bodies → INTERACTIVE / ORCHESTRATOR / EXECUTION. Implements ARCHITECTURE-SPEC v4.0.
  - **[4.0.1]** — language discipline (`HARNESSED_USER_LANG`) injected into v4.0 spawn path.
  - **[4.1.0]** — restore yaml SoT richness: `harnessed prompt` injects `tools_available[]` (was dropped → CC improvised task_plan instead of `/gsd-plan-phase`); `/auto` master-recursion via `is_master` tag.
  - **[4.1.1]** — `disciplines_applied` injected into spawn prompt (2nd flatten dimension).
  - **[4.1.2]** — BLOCKER fix: gates→prompt flattened-name handoff (`task-code` not `code`); `--context` deep-merge; parallelism gate made evaluable; extracted `gateContext.ts` SoT.
  - **[4.1.3]** (2026-06-04) — P0 data-loss fixes (6-reviewer pre-v4.0 review): `gc` default no-op (`slice(-0)`), `rollback` half-restore (now two-pass), non-atomic writes → `src/checkpoint/atomicWrite.ts` (`writeFileAtomic`/`writeFileSyncAtomic`, tmp+rename). 1107 tests pass.
- Deferred security findings (threat-model-gated, not active exploits): shell-injection in `security.ts`/`spawn.ts`/`path-guard.ts`; concurrency hazards in `sigintTrap.ts`/`before-commit.ts`. Tracked for a dedicated hardening pass.

## Topic: v3.9.x maintenance series

- **source**: `.planning/v3.9.x/MAINTENANCE-LOG.md` (v3.9.7 → v3.9.26, 2026-05-24 → 2026-05-30)
- Dogfood-driven bug fixes + Windows compat + simplification. Highlights:
  - v3.9.15-16: removed legacy `execute-task`/`plan-feature`/`verify-work` SKILL.md.
  - v3.9.18: unified `harnessed uninstall` (no-arg = remove self, upstream untouched).
  - v3.9.22-25: gate eval var-missing series — inject 32+ default context fields + master fail-soft fires=true (ADR-0029 alignment) + TDD gate-ref guard test.
  - **v3.9.26: Option A architecture fix** — interactive clarification moved to main session, execution-phase spawn (`--skip-sub` flag + 3 command-body types). Triggered by dogfood finding that discuss/clarify never dialogued with user (headless SDK subagent can't ask). This directly motivated the v4.0 orchestration-brain redesign.

## Topic: Milestone lineage (shipped, all PASSED)

- **source**: 5 milestone audits
- **v0.3.0** (`.planning/milestones/v0.3.0-MILESTONE-AUDIT.md`) — PASSED 2026-05-17. 4 phases, R4.2 + R7.1-R7.6 (7/7). checkpoint engine + plan-feature + gstack probe + routing 30/30 100%. Tech debt: doctor.ts 199L near ≤200L limit; path-traversal hardening deferred (later shipped v0.5).
- **v0.4.0** (`.planning/milestones/v0.4.0-MILESTONE-AUDIT.md`) — PASSED 2026-05-19. 3 phases, R8.1-R8.5 (6/6). benchmark + audit log + co-maintainer + Sponsors + stale-bot + ADR 0018-0020. Permanent deferred: sdkSpawn `as any` + AgentDef SDK coupling (F40-2).
- **v0.5.0** (`.planning/milestones/v0.5.0-MILESTONE-AUDIT.md`) — PASSED 2026-05-22. 3 phases, R10.1-R10.4 (4/4). audit-log consumer + state lock + uninstall + path-guard (5-vector OWASP A1) + ADR 0021/0022. 756 tests.
- **v2.0** (`.planning/milestones/v2.0-MILESTONE-AUDIT.md`) — Architecture Refactor GA 2026-05-20. 6 phases, 16 R20.x (R20.6 dropped). Pure bundled SoT + capabilities.yaml + expr-eval gates + judgments multi-file + 4 v2 workflows + ADR 0024-0029. Triggered by v1.0.4 flaw (workflow.yaml build-artifact not runtime config).
- **v3.0** (`.planning/milestones/v3.0-MILESTONE-AUDIT.md`) — 4-Stage GA 2026-05-21 (~1 day burst). 6 phases, R30.1-R30.13 (13/13). 22 v3 workflows + ~75 capabilities + 10 judgments + L0 6 disciplines + 4 hooks + 46 dogfood fixtures + 1 production bug caught dogfood-first. Implements ADR-0030/0031/0032. Triggered by v2.0 architectural smell (`/plan-feature` 5-phase conflates 5 abstraction layers; "gate-skip 只是障眼法").

## Topic: v5.0 forward-scope implementation plan

- **source**: `.planning/milestones/v5.0-phases/task_plan.md` (8-phase TDD plan, DESIGN LOCKED, not shipped)
- Dependency order: schema → ledger/evidence (pure, TDD) → checkpoint CLI wiring → status/resume → generateCommands body → verify backfill → release gate.
- Phases: (1) schema extension currentWorkflow.v1, (2) ledger.ts pure fns TDD, (3) evidence.ts TDD, (4) checkpoint.ts CLI wiring, (5) status --recover + resume drift, (6) generateCommands ORCHESTRATOR body, (7) verify/* artifacts_expected backfill, (8) release gate → bump 5.0.0.
- Invariants: ADR-0029 fail-soft unchanged; atomic write + dir lock reuse; KARPATHY-minimal (no FSM); Windows CI green.
- Methodology: TDD on pure fns; `biome check --write` pre-commit; NEVER push without approval (CLAUDE.md commit safety).
- All design decisions locked (7 brainstorm + 3 eng-review D1/D2/D3 per ADR-0033). No open gray areas.

## Topic: Cross-ref structure (non-blocking)

- Two bidirectional companion-doc cross-references exist in the ingest set: ADR-0031↔ADR-0032 (v3.0 close trio mutual citation) and ADR-0033↔STATE-MACHINE-CORE-DESIGN (v5.0 ADR + companion spec). These are structural co-references (each doc read once), bounded at depth 2, well under the depth-50 cap. Not synthesis-blocking cycles. Recorded as INFO in INGEST-CONFLICTS.md.
