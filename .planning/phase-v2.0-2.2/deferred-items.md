# Phase v2.0-2.2 deferred items

Tracking deferred / out-of-scope items surfaced during Phase v2.0-2.3 + v2.0-2.4 execution. Items here are explicitly deferred per arbitration decisions, NOT silent omissions.

## T2.4.W1.4 — full v2 cascade upgrade (loadPhases consumers)

**Source**: Q-AUDIT-5 + execute-task-impl Option A++ arbitration (Team `phase24-w1-execute-team` 2026-05-20)

**Defer reason**: Option A++ loadPhases.ts ifelse dispatch returns LoadedPhases union (v1 PhasesSchema OR v2 WorkflowSchemaV2T). Legacy consumers (execute-task.ts model-tier inherit + run.ts skill access + decisionRules.ts) read v1 subset opaquely with minimal cast (`as LoadedPhases` + `'skills' in ph` narrow)。Full cascade upgrade (consumers read v2 字段 `capability` / `gate` / `on` / `args` / `parallelism` / `fallback` 真接) 推 Phase 2.5 dogfood prep。

**Scope (when un-deferred)**:
- `src/cli/execute-task.ts` L62 + L78-81 RoutingOpts add `fallbackConfig?: PhaseFallback` from loaded phases.yaml v2
- `src/workflow/run.ts` L62 narrow + add v2-only field consumption (replace `'skills' in ph` legacy with `capability` invoke)
- `src/routing/decisionRules.ts` (if applicable) read v2 fields if needed
- 6 test file adapt for v2-shape consumption

**Priority**: Phase 2.5 dogfood 之前 ship (sister R20.10 真路径 dogfood depends on cli end-to-end wire)
**Estimated effort**: ~30-45min surgical

---

## T2.4.W1.5 — workflow.ts type exports + cli/execute-task.ts fallback wire-in (CLI E2E)

**Source**: engine-handler T2.4.W1.2 Option C scope expansion deferred (Team 2026-05-20)

**Defer reason**: T2.4.W1.2 ships pure handler `src/routing/lib/fallbackHandlers.ts` 89L + engine.ts catch delegate + 5 fixture verify R20.10 acceptance verbatim (handler exists + UX text + exit 1)。但 CLI-end-to-end wire (cli/execute-task.ts pass fallbackConfig + workflow.ts 4 type exports nice-to-have) 推后续 surgical commit。

**Scope (when un-deferred)**:
- `src/workflow/schema/workflow.ts` add 4 `export` (sister execute-task-impl Q3 推荐 path A): `FallbackMaxIterationsExceeded`, `PhaseFallback`, `OnClause`, `PhaseShape` (4 line)
- `src/cli/execute-task.ts` L78-81 RoutingOpts add `fallbackConfig?: FallbackMaxIterationsExceededConfig` + `fallbackPhaseId?: string` from phases.yaml v2 (~5 line)
- `src/routing/engine.ts` catch handler 用 opts.fallbackConfig 代替 scope-local default (~3 line)
- Delete cli/execute-task.ts L82-85 silent exit(2) handler (handler now process.exit, unreachable)
- Add 2 fixture: phase.fallback config 存在场景 → handler 用 phase.fallback.exit_code + interpolated message; legacy caller (no fallback config) → default exit(1) + 通用 UX text

**Priority**: Phase 2.5 dogfood 之前 ship (depends on cli wire path for真接 dogfood verify)
**Estimated effort**: ~30min surgical (handler ready + signature shape known)

---

## CK — setup.ts ≤200L Karpathy split

**Source**: Phase v2.0-2.3 W1.1 ship (2026-05-20)

**Defer reason**: src/cli/setup.ts 235L > 200L karpathy hard limit。历史 207L pre-task + W1.1 patch +28L Agent Teams warn UX + Pure bundled highlight 必要功能。NOT 阻塞 Q-AUDIT-5b mandated ship。

**Scope (when un-deferred)**:
- Split sister Phase 3.4 W1 doctor.ts inline shrink pattern
- Move 50+L helper logic to `src/cli/lib/setup-helpers.ts` NEW (or similar) — candidates: Agent Teams warn block + Pure bundled highlight + dry-run / apply branching helpers
- setup.ts ≤200L 达标

**Priority**: Phase 2.6 W0 close cleanup (sister Phase 3.4 W1 cadence + Phase 6.1 W2 cleanup pattern)
**Estimated effort**: ~30-45min split + verify no regression

---

## NS — `gsd-plan-phase` capabilities.yaml entry

**Source**: plan-feature-impl T2.4.W1.3 (2026-05-20)

**Defer reason**: workflows/plan-feature/workflow.yaml L32 `invokes: 'gsd-plan-phase'` legacy literal 沿袭 v1 pattern。capabilities.yaml 中 gsd-plan-phase entry 暂未 ship (sister 12 GSD entry 含 gsd-discuss-phase / gsd-progress / gsd-verify-work / gsd-review / gsd-debug 5 entry, gsd-plan-phase 漏)。

**Scope (when un-deferred)**:
- Add `gsd-plan-phase` entry to `workflows/capabilities.yaml` (impl: gsd, cmd: gsd-plan-phase, since: v2.0)
- workflows/plan-feature/workflow.yaml L32 改 `capability: '{{ capabilities.gsd-plan-phase.cmd }}'` 替代 literal `invokes`
- Add fixture in `tests/workflow/plan-feature-v2.test.ts` capability resolve verify

**Priority**: Phase 2.4 W2 or Phase 2.6 close (single-entry patch trivial)
**Estimated effort**: ~5min

---

## Lessons learned (cross-task observations)

- **PLAN.md file-path drift risk** (sister engine-handler T2.4.W1.2 surface): PLAN.md L340 wrote `src/workflow/engineHook.ts` but actual location was `src/routing/engine.ts`. Pattern: planner-time file-location can stale before execution-time。Mitigation: Wave 0 schema task should include file-location verify step (or planner pre-task: grep for actual file before naming)。
- **TypeBox strict additionalProperties cascading test fails**: v1→v2 yaml field add 多文件 cascading test fail (sister 7→1 fail Option A++ ifelse dispatch resolution)。Pattern: schema-upgrade 必须 ifelse dispatch + opaque shape pass-through 避免 fork upgrade 全 consumer。
- **expr-eval 2.0.2 keyword case-sensitivity** (sister Phase 2.3 W0.4 surface): RESEARCH.md § 1.2 文档 `AND`/`OR` uppercase 等价 lowercase, 实测 2.0.2 仅 accept lowercase。Mitigation: 已 ship yaml 8 keyword 统一 lowercase + 推 Phase 2.6 ADR 0026 errata 节 codify。
- **Cross-team SendMessage state stale-read**: execute-task-impl 一次 stale-read workflow.yaml 中间快照触发误 raise (sister 已 self-correct + apology)。Pattern: 跨 teammate 状态 verify 应 re-read disk just-in-time, NOT 假设 cached state。

---

*Phase v2.0-2.2 deferred-items*
*Last updated: 2026-05-20*
*Owner: team-lead (Phase 2.4 W1 batch commit)*
