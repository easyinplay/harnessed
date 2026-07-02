---
name: verify-multispec
description: |
  Stage ④.h verify 子工作流 — 4-specialist Agent Team Pattern C 多维度审查（关键发布 /
  大重构 PR 升级，code-review + gstack-review + gstack-cso + gstack-qa 4 teammate 互相
  SendMessage 质询，NOT fire-and-forget subagent fan-out；bundled Agent Teams Pattern C
  routing）。Cleanup 必跑：shutdown_request + TeamDelete（bundled cleanup discipline）。
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (agent-teams 3 + 4 specialist capability) + 2 phase (01-team-create on critical-release
  invoke / 02-team-cleanup mandatory shutdown)。
  Triggered by slash command
  `/verify-multispec` after `harnessed setup`.
trigger_phrases:
  - "verify multispec"
  - "4-specialist Agent Team"
  - "Pattern C 多维度审查"
  - "critical release review"
  - "跑 verify-multispec"
---

# verify-multispec 工作流 (v3)

## 概览

2-phase 子工作流，将 CLAUDE.md「Verify 阶段 — 关键发布 / 大重构 PR 升级 Agent Team
Pattern C」映射到 harnessed 运行时（Phase v3.0-3.4 W0.13e — D-04 Stage ④ Verify 7 sub +
D-11 Agent Teams + Pattern A sub-workflow ship）。

| phase | id | upstream | model | capability | gate / on |
| ----- | -- | -------- | ----- | ---------- | --------- |
| 1 | `01-team-create` | claude-platform | opus | `{{ capabilities.agent-teams-create.cmd }}` | `parallelism: agent-teams-upgrade.fires`; `on: is_major_release OR is_large_refactor → invoke` |
| 2 | `02-team-cleanup` | claude-platform | haiku | `{{ capabilities.agent-teams-shutdown.cmd }}` | mandatory 防呆清单 |

Per-phase 配置从 `workflows/verify/multispec/workflow.yaml` 加载；phase 01 通过 TeamCreate 创建 4
个 teammate（code-review + gstack-review + gstack-cso + gstack-qa），teammate 互相
SendMessage 质询 findings 是否真问题（NOT fire-and-forget）；phase 02 必跑 shutdown_request
+ TeamDelete（bundled Agent Teams cleanup discipline）。

## Capability refs

Sister `workflows/capabilities.yaml` 条目：
- `agent-teams-create` — Bucket 5 Agent Teams (impl: claude-platform, cmd: TeamCreate)
- `agent-teams-send-message` — Bucket 5 Agent Teams (impl: claude-platform, cmd: SendMessage)
- `agent-teams-shutdown` — Bucket 5 Agent Teams (impl: claude-platform, cmd: TeamDelete)
- `code-review` — Bucket 1 mattpocock (teammate 1)
- `gstack-review` — Bucket 3 治理关卡 (teammate 2 Paranoid Staff Engineer)
- `gstack-cso` — Bucket 3 治理关卡 (teammate 3 安全审查)
- `gstack-qa` — Bucket 3 治理关卡 (teammate 4 端到端 QA)

## Parallelism + on gate refs

Sister `workflows/judgments/parallelism-gate.yaml`：
- `agent-teams-upgrade.fires` — 5 OR-chain（teammate_send_message_needed / subagent_context_overflow /
  shared_task_list / opposing_hypothesis_debate / fullstack_three_way）

Phase 级 `on` 子句（critical-release 升级触发）：
- `if: phase.is_major_release == true or phase.is_large_refactor == true` → `action: invoke`
- else → `action: skip`

## 路由规则（bundled Agent Teams routing — `workflows/judgments/parallelism-gate.yaml`）

- ✅ **触发**：关键发布 / 大重构 PR（≥3 specialist 需互相质询而非 fire-and-forget）
- ❌ **跳过**：常规 PR / 单点任务（sister verify-code-review fan-out + verify-paranoid 已够用且省 token）
- **Token 估算前置条件**：`team_cost < 2 × subagent_cost`（engine-level check；bundled cost guideline）
- **Cleanup 必跑**：phase 02-team-cleanup `agent-teams-shutdown` 必跑（bundled cleanup discipline）

## 如何调用

下面这套编号序列**就是** state machine —— 用 Bash 执行。**不要**从上方 Overview 自行演绎等价流程:
freestyle 会旁路引擎(无 ledger、无 evidence guard)。harnessed 给你 spawn-ready prompt;**你**用
CC-native Task / Agent 工具 spawn subagent(保持 session 响应 + 让澄清 round-trip 能回到用户)。

**不要** pipe 到 `harnessed run verify-multispec` —— 那是 CI/headless 路径(in-process SDK spawn,在 Claude
Code 内部会阻塞 session)。

1. Bash: `harnessed prompt verify-multispec --task "$ARGUMENTS" --json` → 解析 `{prompt, max_iterations, model}`。
2. 用 CC-native subagent(Task / Agent 工具)以该 `prompt` + `model` spawn,用 ralph-loop plugin 包裹:`/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`。若 plugin 未装,改用原生 goal gate(Claude Code 2.1.139+ / Codex):`/goal "this subtask is delivered: the subagent's final output contains verbatim <promise>COMPLETE</promise>; or stop after <max_iterations> turns"`,随后 spawn subagent,由 goal 评估器驱动重 spawn 直到目标清除。若 `/goal` 也不可用,自循环:spawn → 检查输出 `<promise>COMPLETE</promise>` → 把上轮输出 append 后重 spawn(至多 max_iterations)。goal 只在叶子 subtask 层设置 — `/goal` 每 session 单槽,嵌套 goal 会覆盖外层。
3. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 AskUserQuestion 原样转达,把答案 append 进 spec,再重 spawn。
4. 命中 `<promise>COMPLETE</promise>`:Bash `harnessed checkpoint complete verify-multispec --summary "<one-line>"`。evidence guard 在此运行(fail-CLOSED):若声明的 `artifacts_expected` 文件缺失会 exit 非零 —— 重 spawn 产出它再算 done。

<!-- harnessed-generated:v4.9.3 -->

## 参考资料

- D-04 Stage ④ Verify 7 sub 分解
- D-11 Agent Teams 4-specialist Pattern C upgrade
- workflows/capabilities.yaml — agent-teams-{create,send-message,shutdown} + 4 specialist
- workflows/judgments/stage-routing.yaml — verify-multispec-critical-release trigger
- workflows/judgments/parallelism-gate.yaml — agent-teams-upgrade.fires (5 OR-chain)
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 09-agent-team-multispecialist sister verbatim
