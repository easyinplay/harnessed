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

## 调用方式

使用 Bash 工具运行：

```bash
echo "$ARGUMENTS" | harnessed run verify-multispec --task-stdin
```

若 `$ARGUMENTS` 为空，运行 `harnessed run verify-multispec`（不带 stdin pipe）。

执行完成后，Bash 输出会在 stderr 打印 `Next:` 提示，建议下一阶段操作。是否继续调用，请根据对话上下文自行判断——该提示仅供参考，并非强制指令。

<!-- harnessed-generated:v3.4.4 -->

## 参考资料

- D-04 Stage ④ Verify 7 sub 分解
- D-11 Agent Teams 4-specialist Pattern C upgrade
- workflows/capabilities.yaml — agent-teams-{create,send-message,shutdown} + 4 specialist
- workflows/judgments/stage-routing.yaml — verify-multispec-critical-release trigger
- workflows/judgments/parallelism-gate.yaml — agent-teams-upgrade.fires (5 OR-chain)
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 09-agent-team-multispecialist sister verbatim
