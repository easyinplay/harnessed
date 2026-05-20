# ADR 0028: ralph-loop completion-promise + tdd-gate + Agent Teams Routing + Q-AUDIT-5b Schema Fix

**Status**: Accepted
**Date**: 2026-05-20
**Phase**: v2.0-2.6 W0 ADR backfill (5 of 6)

---

## Context

CLAUDE.md Stage ③ Execute 三条铁律需要在 v2.0 完整机器化:

1. **ralph-loop completion-promise** (每子任务必至 verbatim "COMPLETE" gate signal)
2. **tdd-gate** (核心业务逻辑 / 算法 / 数据处理 / regression-risk='high' / reliability_required 强制 TDD red-green-refactor)
3. **Agent Teams 5 升级触发** (subagent fan-out 默认; cross-deps API contract / shared task list / opposing hypothesis / fullstack three-way 升级 Team)

Sister ADR 0011 (Phase 2.2 v0.2.0) ship 了 ralph-loop SDK full integration + sdkSpawn.ts 91L + isComplete 4-layer dual-signal pattern。v2.0 需要在 workflow.yaml v2 真接消费这些 helper, 通过 capability abstraction + judgment gate 把 CLAUDE.md prose 转为 yaml SoT。

**Q-AUDIT-5b discovery (post-LOCK audit 2026-05-20)**: Phase v2.0-2.1 CONTEXT.md L101 + REQUIREMENTS R20.11 acceptance d 文案错误写 nested `experimental.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` schema。Wave A research 实证本地 `~/.claude/settings.json` schema 是 **root-level `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`** (NOT nested experimental.*)。Phase 2.3 W0.5 实装 + Phase 2.4 W3 doctor wire 应用正确 schema。

---

## Decision

### D-10 (R20.10) ralph-loop completion-promise 真接

**workflows/execute-task/phases.yaml v2** 04-deliver phase wire:
- `capability: '{{ capabilities.ralph-loop.cmd }}'` (capability abstraction NOT 字面 `'ralph-loop'`)
- `args.completion_promise: COMPLETE` (verbatim literal per sister Phase 2.2 isComplete 4-layer dual-signal)
- `args.max_iterations: '{{ defaults.ralph_max_iterations.execute-task.04-deliver }}'` (defaults.yaml interpolation, 默认 20)
- `fallback.max_iterations_exceeded: {action: emit_warning_and_halt, message, exit_code: 1}` per R20.10 "explicit NOT silent"

**`src/routing/lib/fallbackHandlers.ts` NEW ~89L** (Phase 2.4 W1.2 SHIPPED):
- `handleMaxIterationsExceeded(err, fallback?)` return type `never` — UX text full per RESEARCH § 7.2 verbatim + process.exit(fallback?.exit_code ?? 1)
- `handleVerbatimCompleteFail(err, ...)` sister handler
- 模板插值: `interpolate(message, {args.max_iterations})` substitute placeholder

**`src/routing/engine.ts` L188-203 MODIFY** (Phase 2.4 W1.2):
- Replace silent emitAudit-only catch with delegate to handlers
- 沿袭 emitAudit (audit trail preserved per ADR 0021 audit log + R8.1 dogfood)
- Karpathy ≤200L hard limit 守住 via split helper pattern (sister Phase 2.2 sdkReconcile.ts pattern)

### D-11 (R20.11) parallelism-gate + Agent Teams env check

**`workflows/judgments/parallelism-gate.yaml` NEW** (Phase 2.3 W0.2 SHIPPED): 4 trigger schema
- `subagent-default` (默认 fan-out): `subtask.parallel_count <= 3 AND subtask.communication_needed == false`
- `main-session-fallback` (降级主 session 直跑): `subtask.lines < 20 OR subtask.type == 'single_command_query'`
- `agent-teams-upgrade` (5 升级触发 OR-chain per `~/.claude/rules/agent-teams.md`):
  - teammate_send_message_needed
  - subagent_context_overflow
  - shared_task_list
  - opposing_hypothesis_debate
  - fullstack_three_way
- `ralph-loop-wrapper` (正交 wraps array, sister R20.10 集成)

**`src/cli/lib/checkAgentTeams.ts` NEW ~47L** (Phase 2.3 W0.5 SHIPPED):
- Probe 1: `process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS === '1'`
- Probe 2: `~/.claude/settings.json` **root-level `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS == "1"`** (Q-AUDIT-5b schema fix; NOT nested `experimental.*`)
- AgentTeamsCheckResult interface (status / detected / envValue / settingsValue / remediation)
- Missing → warn + remediation text `claude config set env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 1`

**Wire-in path** (3 entry point sister Phase 2.3 + 2.4):
- `src/cli/setup.ts` warn UX (Phase 2.3 W1.1) — non-blocking continue per agent-teams.md L42 "Session-scoped 容忍策略"
- `src/cli/doctor.ts` MIN 8→10 check (Phase 2.4 W3 + check-agent-teams-doctor.ts wrapper)
- workflow.yaml `parallelism` 字段引用 `judgments.parallelism-gate.<route>.fires`

### D-13 (R20.13) tdd-gate

**`workflows/judgments/tdd-gate.yaml` NEW** (Phase 2.3 W0.2 SHIPPED): 1 trigger `tdd-strongly-suggested`
- `fires_when` OR-chain (6 fires):
  - `subtask.is_core_business_logic == true`
  - `subtask.is_algorithm == true`
  - `subtask.is_data_processing == true`
  - `subtask.regression_risk == 'high'`
  - `subtask.reliability_required == true`
  - `subtask.has_api_contract == true` (reserve)
- `skips_when` (3 skips):
  - `subtask.type == 'crud'`
  - `subtask.type == 'ui_polish'`
  - `subtask.type == 'docs_only'`

**`workflows/capabilities.yaml` tdd entry**: `aliases` array 2 候选
- Primary: `{impl: superpowers, cmd: superpowers:test-driven-development}`
- Alias: `{impl: mattpocock-skills, cmd: /tdd}`

**workflow.yaml execute-task 02-code phase** wire conditional invoke:
- `on: [{if: 'judgments.tdd-gate.tdd-strongly-suggested.fires', invoke: '{{ capabilities.tdd.cmd }}'}]`

---

## A7 Conservation Gate

ADR 0001-0023 main body 永久 0 diff (per F26 + ci.yml A7 step iterate Phase N ship 时 add new ADR reference)。本 ADR 0028 ship 时 ci.yml A7 step iter 0027→0028 (Phase 2.6 W1 batch)。

---

## Consequences

**Positive**:
- Stage ③ Execute 3 铁律完全 yaml SoT 机器化 (NOT prose-only CLAUDE.md)
- Pattern A 全栈三路 Team escalation first-use validated Phase 2.4 W1 `phase24-w1-execute-team` (3 teammate + 4 SendMessage round-trip + 2 architectural arbitration)
- ralph-loop fallback explicit NOT silent — R8.1 audit-trail preserved + R20.10 acceptance verbatim
- Q-AUDIT-5b schema fix prevent false-negative warnings for end-user Agent Teams detection

**Negative**:
- engine.ts ≤200L Karpathy 撞顶 → must split helper `fallbackHandlers.ts` (sister Phase 2.2 sdkReconcile.ts pattern)
- expr-eval keyword case-sensitivity (sister ADR 0026 errata cross-link): yaml expression `and`/`or` lowercase only (Phase 2.5 W2 dogfood-first catch 3 处 uppercase fix)

**Neutral**:
- Pattern A/B/C 3 升级 schema reusable for future workflow ship (verify-work Phase 2.4 W2.2 09-agent-team-multispecialist 沿袭 Pattern C)

---

## References

**Sister ADR**:
- ADR 0011: sister ralph-loop SDK full integration + sdkSpawn.ts 91L pattern (Phase 2.2 v0.2.0 SHIPPED — v2.0 复用 NOT 重写)
- ADR 0023: sister v1.0 publish.yml + OIDC + sigstore (Phase 6.1 v1.0 GA SHIPPED — relevance: ship cadence 沿袭)
- ADR 0024: workflow.yaml v2 schema (本 phase backfill sibling)
- ADR 0025: capabilities.yaml baseline (本 phase backfill sibling)
- ADR 0026: judgments multi-file + judgmentResolver + expr-eval keyword errata (本 phase backfill sibling, cross-link)
- ADR 0027: research + verify-work NEW + planning-with-files plugin errata (本 phase backfill sibling)

**Phase planning artifacts**:
- `.planning/phase-v2.0-2.1/2.1-CONTEXT.md` § D-10 + D-11 + D-13 + Q-AUDIT-5b transparency
- `.planning/phase-v2.0-2.1/2.1-DISCUSSION-LOG.md` Q-AUDIT-2 batch + Q-AUDIT-5b amend
- `.planning/REQUIREMENTS.md` § R20.10 + R20.11 + R20.13 acceptance
- `.planning/phase-v2.0-2.2/PLAN.md` T2.3.W0.5 + T2.4.W1.1 + T2.4.W1.2 + T2.4.W3.1
- `.planning/phase-v2.0-2.2/RESEARCH.md` § 3 (ralph-loop SDK) + § 4 (Agent Teams check) + § 7 (fallback UX)
- `.planning/phase-v2.0-2.2/PLAN-ENG-REVIEW.md` Q-AUDIT-5b schema fix arbitration

**Implementation**:
- `src/routing/lib/ralphLoop.ts` (sister Phase 2.2 SHIPPED 54L 复用)
- `src/routing/lib/fallbackHandlers.ts` (Phase 2.4 W1.2 SHIPPED 89L)
- `src/routing/engine.ts` L188-203 catch wire (Phase 2.4 W1.2 modified, ≤200L)
- `src/cli/lib/checkAgentTeams.ts` (Phase 2.3 W0.5 SHIPPED 47L)
- `src/cli/lib/check-agent-teams-doctor.ts` (Phase 2.4 W3 wrapper 34L)
- `workflows/judgments/parallelism-gate.yaml` (Phase 2.3 W0.2 SHIPPED)
- `workflows/judgments/tdd-gate.yaml` (Phase 2.3 W0.2 SHIPPED)
- `workflows/capabilities.yaml` tdd + ralph-loop + agent-teams-create entry (Phase 2.3 W0.1 SHIPPED)
- `workflows/execute-task/phases.yaml` v2 04-deliver + 02-code wire (Phase 2.4 W1.1 SHIPPED)

**External rules**:
- `~/.claude/rules/agent-teams.md` (5 升级触发 + Pattern A/B/C verbatim)
- `~/.claude/CLAUDE.md` Stage ③ Execute 铁律 (机器化对象)

---

## Implementation Status

**SHIPPED 2026-05-20** across multiple Phases:
- Phase 2.3 W0.1 (capabilities.yaml tdd + ralph-loop + agent-teams-create entry)
- Phase 2.3 W0.2 (judgments/parallelism-gate.yaml + tdd-gate.yaml)
- Phase 2.3 W0.5 (checkAgentTeams.ts + 5 fixture)
- Phase 2.3 W1.1 (setup.ts wire warn UX)
- Phase 2.4 W1.1 (execute-task phases.yaml v2 ralph-loop + tdd-gate + mattpocock route via Team 1 `execute-task-impl` teammate)
- Phase 2.4 W1.2 (fallbackHandlers.ts split + engine.ts wire via Team 1 `engine-handler` teammate, 2 architectural arbitration: Option C split helper + delegate)
- Phase 2.4 W3 (doctor MIN 8→10 check + check-agent-teams-doctor.ts wrapper)
- Phase 2.5 dogfood W1 (parallelism-gate 3 路径 + 5 升级触发 matrix verify, 5 fixture) + W3 (ralph-loop 7 fixture + tdd-gate 8 fixture) + W4 (Agent Teams Pattern A/C reference verify)

Total NEW fixture for ADR 0028 scope: 25+ (5 W1 + 7+8 W3 + 5 W4 + 5 + 12 Phase 2.4 W1)

---

## Errata

### E-1 Q-AUDIT-5b Agent Teams settings.json schema fix (LOCKED 2026-05-20)

**Discovery**: Post-Phase v2.0-2.1 LOCK audit (Wave A research + gstack /plan-eng-review).

**Original (WRONG) schema**: Phase 2.1 CONTEXT.md L101 + REQUIREMENTS R20.11 acceptance d 写 nested:
```json
{"experimental": {"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"}}
```

**Actual (CORRECT) schema**: Wave A 本地 `~/.claude/settings.json` 实证, root-level `env` object:
```json
{"env": {"CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"}}
```

**Fix path** (LOCKED Q-AUDIT-5b Option A):
- `src/cli/lib/checkAgentTeams.ts` Probe 2 reads `data.env?.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` (NOT `data.experimental?.*`)
- 5 fixture test verify root-level (NOT nested) — `grep 'data.env' tests/cli/checkAgentTeams.test.ts` 命中 + `grep 'data.experimental' tests/cli/checkAgentTeams.test.ts` 0 hit
- Engineer guidance fixture remediation text: `claude config set env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS 1` (verified syntax)
- doctor.ts MIN 8→10 wire (Phase 2.4 W3) + setup.ts wire (Phase 2.3 W1.1) apply correct schema
- Phase 2.5 W1 dogfood (DOGFOOD-T5.1.md) real probe verify ENV=1 + settings.json env.* dev machine pass status=pass

**Impact assessment**: Fix applied **before** any user shipped — Q-AUDIT-5b discovery happened during Phase 2.2 Wave A research, prior to Phase 2.3 W0.5 实装 ship。所以 0 user impact, 0 production blast radius。

### E-2 expr-eval keyword case-sensitivity (cross-link ADR 0026 E-2)

**Discovery**: Phase v2.0-2.5 W2 dogfood-first catch (DOGFOOD-T5.2.md)。

**Bug**: `workflows/execute-task/phases.yaml` L65-67 + `workflows/verify-work/workflow.yaml` L140-142 expression keyword 用 uppercase `AND`/`OR`。expr-eval 2.0.2 实测 case-sensitive 仅 accepts lowercase `and`/`or` (RESEARCH.md § 1.2 documented as 等价 but 实测 only lowercase work)。

**Runtime failure**: 真接调用 evalGate 时 `parse error [1:6] Expected EOF` — uppercase keyword 在 Parser 阶段失败。Schema-shape regex test `/OR/` STATIC pass while runtime evalGate FAIL — dogfood-first methodology 价值实证 (R8.1)。

**Fix**: 3 处 yaml expression statement uppercase AND/OR → lowercase `and`/`or` (sister `workflows/judgments/*.yaml` 6 file SoT alignment)。Schema-shape regex 同步 tighten 为 `\bor\b` + lesson comment in `tests/workflow/verify-work-v2.test.ts`。

**Cross-link**: ADR 0026 § E-2 (judgments multi-file 是 SoT alignment 对象)。

---

*ADR 0028: ralph-loop completion-promise + tdd-gate + Agent Teams Routing + Q-AUDIT-5b Schema Fix*
*Authored: 2026-05-20 Phase v2.0-2.6 W0.5 (backfill, sister ADR 0011 9-section pattern)*
*Acceptance: Phase v2.0-2.3 + 2.4 + 2.5 ship cumulative verify + Phase v2.0-2.6 W1 ci.yml A7 step iter 0027→0028*
