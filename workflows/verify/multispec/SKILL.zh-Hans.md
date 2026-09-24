---
name: verify-multispec
description: |
  Stage ④.h verify 子工作流 — 4-specialist Agent Team Pattern C 多维度审查（关键发布 /
  大重构 PR 升级，code-review + gstack-review + gstack-cso + gstack-qa 4 {{ host.teammate }} 互相
  {{ host.send_message }} 质询，NOT fire-and-forget subagent fan-out；bundled {{ host.team }} Pattern C
  routing）。Cleanup 必跑：按名请求每个 {{ host.teammate }} shut down（bundled cleanup discipline）。
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
D-11 {{ host.team }} + Pattern A sub-workflow ship）。

| phase | id | upstream | model | capability | gate / on |
| ----- | -- | -------- | ----- | ---------- | --------- |
| 1 | `01-team-create` | claude-platform | opus | `{{ capabilities.agent-teams-create.cmd }}` | `parallelism: agent-teams-upgrade.fires`; `on: is_major_release OR is_large_refactor → invoke` |
| 2 | `02-team-cleanup` | claude-platform | haiku | `{{ capabilities.agent-teams-shutdown.cmd }}` | mandatory 防呆清单 |

Per-phase 配置从 `workflows/verify/multispec/workflow.yaml` 加载；phase 01 用
{{ host.multispec_spawn_note }}；phase 02
{{ host.teams_cleanup_note.multispec }}

## Capability refs

Sister `workflows/capabilities.yaml` 条目：
- `agent-teams-create` — Bucket 5 Agent Teams (impl: claude-platform, cmd: `Agent(name, run_in_background=true)`)
- `agent-teams-send-message` — Bucket 5 Agent Teams (impl: claude-platform, cmd: SendMessage)
- `agent-teams-shutdown` — Bucket 5 Agent Teams (impl: claude-platform, cmd: `ask the <teammate-name> teammate to shut down`)
- `code-review` — Bucket 1 mattpocock ({{ host.teammate }} 1)
- `gstack-review` — Bucket 3 治理关卡 ({{ host.teammate }} 2 Paranoid Staff Engineer)
- `gstack-cso` — Bucket 3 治理关卡 ({{ host.teammate }} 3 安全审查)
- `gstack-qa` — Bucket 3 治理关卡 ({{ host.teammate }} 4 端到端 QA)

## Parallelism + on gate refs

Sister `workflows/judgments/parallelism-gate.yaml`：
- `agent-teams-upgrade.fires` — 5 OR-chain（teammate_send_message_needed / subagent_context_overflow /
  shared_task_list / opposing_hypothesis_debate / fullstack_three_way）

Phase 级 `on` 子句（critical-release 升级触发）：
- `if: phase.is_major_release == true or phase.is_large_refactor == true` → `action: invoke`
- else → `action: skip`

## 路由规则（bundled {{ host.team }} routing — `workflows/judgments/parallelism-gate.yaml`）

- ✅ **触发**：关键发布 / 大重构 PR（≥3 specialist 需互相质询而非 fire-and-forget）
- ❌ **跳过**：常规 PR / 单点任务（sister verify-code-review fan-out + verify-paranoid 已够用且省 token）
- **Token 估算前置条件**：`team_cost < 2 × subagent_cost`（engine-level check；bundled cost guideline）
- **Cleanup 必跑**：phase 02-team-cleanup `agent-teams-shutdown` 必跑（bundled cleanup discipline）

## 如何调用

!`harnessed checkpoint intent verify-multispec`

> 上方 banner(如出现)表示本次调用已在引擎**登记**(intent 标记)——尚未合规:按下方步骤(prompt → spawn → checkpoint complete)完成即解除;在此之前每 turn 会持续注入 `<workflow-intent>` 提醒。

下面这套编号序列**就是** state machine —— 用 Bash 执行。**不要**从上方 Overview 自行演绎等价流程:
freestyle 会旁路引擎(无 ledger、无 evidence guard)。harnessed 给你 spawn-ready prompt;**你**用
{{ host.native }} {{ host.spawn_subagent.zh_tool }} spawn subagent(保持 session 响应 + 让澄清 round-trip 能回到用户)。

**不要** pipe 到 `harnessed run verify-multispec` —— 那是 CI/headless 路径({{ host.harnessed_run_warning_note.execution_tail }}

1. Bash: `harnessed prompt verify-multispec --task "$ARGUMENTS" --json` → 解析 `{prompt, max_iterations, model}`。
2. 用 {{ host.native }} subagent({{ host.spawn_subagent.zh_tool }})以该 `prompt` + `model` spawn,然后用 harnessed 自己的完成闸门驱动交付:
   - subagent 返回后,把它的最终输出写入文件,跑 `harnessed checkpoint complete verify-multispec --result-file <path>` —— 该命令对声明的产物、TDD boundary、逐字 `<promise>COMPLETE</promise>` 三者 fail-closed。
   - 若被拦下,跑 `harnessed checkpoint fail verify-multispec --failing-tests <n>` 记录本次尝试;命中停机条件时它会打印 BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP。
   - **仅当**这三者都未触发时才允许重 spawn。任一触发即停:重新收敛子任务范围、修掉阻塞点,或上报用户。绝不越过停机指令继续重 spawn。
3. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 {{ host.ask_user }} 原样转达,把答案 append 进 spec,再重 spawn。
4. 命中 `<promise>COMPLETE</promise>`:把 subagent 最终输出写入文件,再 Bash `harnessed checkpoint complete verify-multispec --result-file <path> --summary "<one-line>"`。fail-CLOSED —— 除非声明的 `artifacts_expected` 文件全部存在、TDD boundary 通过(证据非空 / 红绿两侧齐全 / 测试文件未被删除)、且结果含逐字 `<promise>COMPLETE</promise>`(或结构化 COMPLETE 状态),否则拦下。`--result <text>` 是内联变体;`--result-file` 优先且在 Windows 上引号安全。`--force` 记录可审计的覆盖(`evidence_status=overridden`),不是静默放行。
5. 若 complete 闸门拦下:Bash `harnessed checkpoint fail verify-multispec --failing-tests <n>` 记录本次尝试。命中停机条件时会打印 `BUDGET-EXHAUSTED` / `NO-PROGRESS` / `BREAK-LOOP`。**仅当**三者都未触发时才允许重 spawn;任一触发即 STOP —— 重新收敛子任务范围、修掉阻塞点,或上报用户。

<!-- harnessed-generated:v4.12.0 -->

## 参考资料

- D-04 Stage ④ Verify 7 sub 分解
- D-11 {{ host.team }} 4-specialist Pattern C upgrade
- workflows/capabilities.yaml — agent-teams-{create,send-message,shutdown} + 4 specialist
- workflows/judgments/stage-routing.yaml — verify-multispec-critical-release trigger
- workflows/judgments/parallelism-gate.yaml — agent-teams-upgrade.fires (5 OR-chain)
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 09-agent-team-multispecialist sister verbatim
