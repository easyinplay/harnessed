# Phase v2.0-2.5 W1 Cycle 1 — parallelism-gate + Agent Teams Dogfood Report

**Date**: 2026-05-20
**Phase**: v2.0-2.5 W1 Cycle 1 (parallelism-gate + Agent Teams round-trip dogfood)
**R coverage**: R20.11 (parallelism-gate 3 路径机器化 + Agent Teams 5 升级触发 OR-chain)
**Test artifact**: `tests/dogfood/parallelism-gate.dogfood.test.ts` (5 fixture NEW)
**Verdict**: **PASS** (3/3 axes verified, miss: none)

---

## Axis A — R20.11 parallelism-gate 3 route runtime resolve verify

**Setup**: 真接 `resolveJudgmentGate()` (T2.3.W0.4 SHIPPED 98L) → `evalGate()` (T2.3.W0.3 SHIPPED 53L expr-eval Parser singleton + locked-down operators) → `Value.Check(JudgmentTriggersFile)` (T2.3.W0.6 SHIPPED schema 86L) full path, **NOT mock**. `packageRoot = process.cwd()` 真接 fs.readFile `workflows/judgments/parallelism-gate.yaml` (T2.3.W0.2 SHIPPED 48L 4-trigger ship)。
**Action**: 5 fixture × 3 route × 5 trigger 完整覆盖:

| Route | Trigger condition | phaseFactContext | Fires | Status |
|-------|-------------------|------------------|-------|--------|
| subagent-default | `parallel_count <= 3 AND communication_needed == false` | `{subtask: {parallel_count: 2, communication_needed: false}}` | true | ✅ F1 |
| main-session-fallback | `lines < 20 OR type == 'single_command_query'` | `{subtask: {lines: 15, type: 'single_command_query'}}` | true | ✅ F2 |
| agent-teams-upgrade | `teammate_send_message_needed` | `{teammate_send_message_needed: true, ...4 false}` | true | ✅ F3.T1 |
| agent-teams-upgrade | `subagent_context_overflow` | `{subagent_context_overflow: true, ...4 false}` | true | ✅ F3.T2 |
| agent-teams-upgrade | `shared_task_list` | `{shared_task_list: true, ...4 false}` | true | ✅ F3.T3 |
| agent-teams-upgrade | `opposing_hypothesis_debate` | `{opposing_hypothesis_debate: true, ...4 false}` | true | ✅ F3.T4 |
| agent-teams-upgrade | `fullstack_three_way` | `{fullstack_three_way: true, ...4 false}` | true | ✅ F3.T5 |
| agent-teams-upgrade | all 5 false (sanity negative) | `{...5 false}` | false | ✅ F3.S |

**Acceptance**: 3 route runtime resolve 全 PASS + 5 升级触发独立激活全 fires=true + sanity negative case fires=false。OR-chain 实装路径完整 (expr-eval `or` 链 4 项)，覆盖 ~/.claude/rules/agent-teams.md L7-13 5 触发节全集。
**Status**: ✅ PASS (covered by F1 + F2 + F3 fixture; real fs.readFile + real resolveJudgmentGate + real evalGate path)

## Axis B — Agent Teams env real probe (Q-AUDIT-5b root-level env.* schema)

**Setup**: 真接 `checkAgentTeams()` (T2.3.W0.5 SHIPPED 47L) **NOT mock** — dev machine 实测 env state。Q-AUDIT-5b 2026-05-20 LOCK schema: `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS == "1"` (root-level NOT nested experimental.*)。
**Action**: F4 fixture 真接 invoke + assert dev machine 实证状态:
- `process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = '1'` (verified via `echo $ENV` shell probe → `ENV=1`)
- `~/.claude/settings.json` 含 `"env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" }` (verified via `grep AGENT_TEAMS` → hit)
- `checkAgentTeams()` returns `{status: 'pass', detected: {env: true, settingsJson: true}, envValue: '1', settingsValue: '1', remediation: undefined}`

**Acceptance**: Q-AUDIT-5b root-level env.* schema 实证生效 + status='pass' + remediation 未触发 (agent-teams-upgrade route 在 dev machine 可实际 invoke TeamCreate)。
**Status**: ✅ PASS (covered by F4 fixture)

**Note on round-trip lifecycle**: 真接 TeamCreate → Agent ×3 → SendMessage round-trip → shutdown_request ×3 → TeamDelete 完整 lifecycle 因当前 session 内 sub-subagent forbid (orchestrator brief 明示 "DO NOT spawn sub-subagents") **deferred to Phase 2.5 W2 Cycle 2** (T2.5.W2.1 4-specialist Pattern C 内执行); 本 Cycle 1 验证 prerequisite — Agent Teams capability 在 dev machine 可用且 R20.11 gate 实装路径完整 (无 schema drift + fires_when 求值正确)，构成 W2 round-trip 前置条件。

## Axis C — yaml schema contract stability (R20.4 schema invariant)

**Setup**: 真接 fs.readFile `workflows/judgments/parallelism-gate.yaml` → `parseYaml()` → `Value.Check(JudgmentTriggersFile)` 三步链。schema additionalProperties:false 严格 enforce — 任何 drifted shape (e.g., 新 root key / 未声明字段) 应 reject。
**Action**: F5 fixture verify:
- `Value.Check(JudgmentTriggersFile, parsed) === true` (schema contract stable)
- `Object.keys(file.triggers)` 含 4 verbatim trigger: `subagent-default` + `main-session-fallback` + `agent-teams-upgrade` + `ralph-loop-wrapper` (R20.10 正交 wrapper)

**Acceptance**: T2.3.W0.2 SHIPPED yaml + T2.3.W0.6 SHIPPED TypeBox schema 仍 contract-stable, 无 drift; ralph-loop-wrapper 作为 orthogonal wrapper (per R20.10) 与 3 主 route 并存。
**Status**: ✅ PASS (covered by F5 fixture)

---

## Aggregate verification

- **R20.11 parallelism-gate 3 路径机器化**: ✅ Axis A (subagent-default + main-session-fallback + agent-teams-upgrade 3 route 各 fires=true; 5 升级触发独立激活全验)
- **R20.11 Agent Teams 5 触发 OR-chain**: ✅ Axis A (teammate_send_message_needed / subagent_context_overflow / shared_task_list / opposing_hypothesis_debate / fullstack_three_way 各独立 fires=true)
- **R20.11 Agent Teams capability dev-machine 可用**: ✅ Axis B (checkAgentTeams status='pass' real probe; Q-AUDIT-5b root-level env.* schema 实证生效)
- **R20.4 yaml schema invariant**: ✅ Axis C (parallelism-gate.yaml TypeBox JudgmentTriggersFile Value.Check pass + 4 verbatim trigger present)
- **Full test suite gate**: ✅ 854 passed / 4 skipped / 0 failed (vitest direct run — 849 baseline + 5 NEW Cycle 1 dogfood fixture)
- **Biome lint**: ✅ clean (1 import-fold auto-fix applied — sister Phase 2.1/2.2/2.3 3-recurrence project memory preempt successful)
- **TypeScript noEmit**: ✅ exit 0 (0 type error)

## Lessons learned

- **Sub-subagent forbid → defer round-trip to W2**: 完整 TeamCreate → SendMessage round-trip → TeamDelete lifecycle 因 orchestrator brief "DO NOT spawn sub-subagents" 约束 deferred 至 Cycle 2 (T2.5.W2.1 4-specialist Pattern C lead-delegate 自然容纳此 lifecycle 评估)。Cycle 1 范围聚焦 yaml gate 实装路径 + env probe prerequisite — 这是合理切分: gate 路径错 → round-trip 必失败, prerequisite-first 验证更 surgical (Karpathy simplicity)。
- **expr-eval `or` 链 ≥4 项工作正常**: parallelism-gate.yaml agent-teams-upgrade.fires_when 是 5-项 OR-chain, T2.3.W0.3 evalGate Parser singleton 处理正确 (no operator drift, no parse error)。sister W0.4 已 mock-cover 1 trigger, 本 dogfood real-fs 实证 5 trigger 独立激活全集。
- **Biome preempt 3-recurrence project memory 仍生效**: TS dogfood test 写完跑 biome `--write` 1 次 auto-fix (import 折叠) → clean. 沿袭 Phase 2.1.1 / 2.2 / 2.3 CI-red recurrence lesson, **不**触发本 Cycle CI red 4th recurrence。
- **dev machine Agent Teams env 实证状态**: env=1 + settings.json env.*=1 双 ON, status=pass 与 R20.11 acceptance 一致, 为 W2 Cycle 2 Pattern C 4-specialist round-trip 提供 verified prerequisite。

## Next

Phase 2.5 W2 Cycle 2 — verify-work 4-stage dogfood + 4-specialist Agent Team Pattern C lead-delegate 完整 round-trip + DOGFOOD-T5.2.md (per PLAN L467-482 R20.12 主 + R20.11 4-specialist + R20.14 gstack 3 可选)。

---

*Phase v2.0-2.5 W1 Cycle 1 — parallelism-gate + Agent Teams dogfood report*
*Run: 2026-05-20*
