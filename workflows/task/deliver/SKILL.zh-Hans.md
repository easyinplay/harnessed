---
name: task-deliver
description: |
  task-deliver workflow v3 — Stage ③.d 子任务交付 sub-workflow (harnessed 自有 completion-gate
  + Agent Teams conditional escalation + R20.10 explicit max_iterations_exceeded
  fallback)。2-phase composition: 01-deliver (completion-gate with completion_promise
  verbatim "COMPLETE" + parallelism judgments.parallelism-gate.completion-gate-wrapper.fires +
  fallback emit_warning_and_halt exit_code 1) → 02-progress-mark (Claude Code plugin
  /plan mark subtask complete in progress.md)。
  schema_version: harnessed.workflow.v3 with disciplines_applied [6] + tools_available
  [completion-gate, verification-before-completion, agent-teams-create,
  agent-teams-send-message, agent-teams-shutdown,
  planning-with-files]. Triggered by harnessed CLI `harnessed task-deliver --task <text>`
  or slash command `/task-deliver` after `harnessed setup`.
trigger_phrases:
  - "deliver this subtask"
  - "task-deliver workflow"
  - "Stage 3 deliver"
  - "completion gate COMPLETE"
  - "跑 task-deliver"
---

# task-deliver workflow (v3)

## Overview

2-phase 子工作流，将 CLAUDE.md Stage ③.d 子任务交付纪律映射到 harnessed runtime，
完整采用 `harnessed.workflow.v3` schema（Phase v3.0-3.4 W0 T3.4.W0.9 — D-09 L0
Discipline Substrate + D-10 完成保证 + D-11 Agent Teams 升级 5 触发
OR-chain + R20.10 explicit max_iterations_exceeded handler）。

| phase | id | upstream | model | capability / args / parallelism / fallback |
| ----- | -- | -------- | ----- | ------------------------------------------ |
| 1 | `01-deliver` | （无 — harnessed 自有 CLI） | haiku | `{{ capabilities.completion-gate.cmd }}` + `args: {completion_promise: COMPLETE, max_iterations: ...}` + `parallelism: judgments.parallelism-gate.completion-gate-wrapper.fires` + `fallback.max_iterations_exceeded.action: emit_warning_and_halt` |
| 2 | `02-progress-mark` | planning-with-files | haiku | `{{ capabilities.planning-with-files.cmd }}` / `invokes: /plan` / `artifacts_expected: [progress.md]` |

每阶段配置从 `workflows/task/deliver/workflow.yaml` 加载；engine.runRouting 通过
`@anthropic-ai/claude-agent-sdk` 0.3.142+ 将每个阶段 spawn 为 sub-agent。

## Phase 01 完成闸门 (R20.10 + D-10 + ADR 0039)

完成判据是子任务输出包含 verbatim `"COMPLETE"` string（NOT 启发式 / NOT LLM-as-judge）。
4.36.0 起这条保证**完全内置**，跑在 harnessed 自己的 live path 上，不依赖任何上游 plugin：

- `harnessed checkpoint complete <sub> --result-file <path>` —— fail-CLOSED，同时校验
  声明的 `artifacts_expected` 产物存在、TDD boundary 通过（证据非空 / 红绿两侧齐全 /
  测试文件未被删除）、结果含 verbatim `<promise>COMPLETE</promise>`（或结构化 COMPLETE
  状态）。`--result <text>` 是内联变体；`--result-file` 优先且在 Windows 上引号安全。
  `--force` 记录可审计的覆盖（`evidence_status=overridden`），不是静默放行。
- `harnessed checkpoint fail <sub> --failing-tests <n>` —— 记录本次尝试，并在命中停机
  条件时打印 `BUDGET-EXHAUSTED`（已用尝试次数 vs `workflows/defaults.yaml
  ralph_max_iterations`）/ `NO-PROGRESS`（连续 N 次无进展；失败测试数，省略该 flag 时退回
  证据产物摘要）/ `BREAK-LOOP`（该 sub 失败次数达阈值）。
- **仅当**这三条停机理由都未触发时才允许重 spawn。任一触发即停：重新收敛子任务范围、
  修掉阻塞点，或上报用户。绝不越过停机指令继续重 spawn。

这三条停机理由 == 上游 `/ralph-loop --max-iterations` + `--completion-promise` 曾经提供的
东西，只是长在自有路径上、没有「装没装」的问题（ADR 0039 supersedes ADR 0036 的
plugin → `/goal` → self-loop 三级链）。Sister capabilities.yaml `completion-gate` entry
impl `harnessed-bundled` + `sdk_ref: src/workflow/lib/ralphLoop.ts`。

### Parallelism — 完成闸门正交 wrapper

`parallelism: judgments.parallelism-gate.completion-gate-wrapper.fires` ref——遵循 R20.10
+ D-10，完成闸门是**正交 wrapper**，套在 subagent-default / agent-teams-upgrade /
main-session-fallback 任意 1 种模式外层（NOT 互斥触发器，而是 parallelism-gate.yaml
中的 `wraps:` 正交字段）。Runtime engine 评估 wrapping mode 后 spawn 相应
执行单元并套 completion check。

### Agent Teams 条件性升级 (D-11 + agent-teams.md 5 OR-chain)

5 个升级触发（来自 capabilities.yaml `agent-teams-create.fires_when` + agent-teams.md）：
1. `teammate_send_message_needed == true` — teammate 间 SendMessage 互通（NOT fire-and-forget）
2. `subagent_context_overflow == true` — subagent 撞 context 上限
3. `shared_task_list == true` — 多 teammate 共享 task list 自协调
4. `opposing_hypothesis_debate == true` — 对立假设辩论
5. `fullstack_three_way == true` — 全栈三路协同

任 1 触发 → 升级 subagent fan-out → Agent Teams Pattern A/B/C。清理是强制的，
遵循 agent-teams.md 防呆清单（lead 按名请求每个 teammate shut down；CC 2.1.178+ 已无
teardown 工具，团目录在 session 退出时自动清理——剩下的纪律是别把 teammate 落在运行态）
——属于 engine 级别的连接，NOT yaml schema 的职责范围。

### R20.10 explicit max_iterations_exceeded handler（非静默中止）

phase.fallback.max_iterations_exceeded = `{action: emit_warning_and_halt, message,
exit_code: 1}`——通过 FallbackMaxIterationsExceeded Type.Literal(
'emit_warning_and_halt')（workflow.ts L70-77）做 schema 级强制约束。Sister Phase 2.4
W1.2 fallbackHandlers.ts engine.ts wire——撞 max_iterations 时显式 emit
warning + halt with exit_code 1，NOT 静默中止/继续执行。交互面的对应物是
`checkpoint fail` 打印的 `BUDGET-EXHAUSTED`。

Brief enforcement W0.9: ✅ completion-gate completion_promise COMPLETE / ✅ parallelism-gate
ref / ✅ R20.10 explicit max_iterations_exceeded handler。

## Phase 02 progress-mark planning-with-files (D-15 + Q-AUDIT-5a Option A)

02-progress-mark 调用 Claude Code plugin slash cmd `/plan`，在 `progress.md` 中将
subtask 标记为完成——对应 Phase 01-code progress update 模式，是 Stage ③ task chain
的最后一次调用。需要安装 `planning-with-files` Claude Code plugin（通过
Claude Code plugin marketplace 安装）。

## 如何调用

!`harnessed checkpoint intent task-deliver`

> 上方 banner(如出现)表示本次调用已在引擎**登记**(intent 标记)——尚未合规:按下方步骤(prompt → spawn → checkpoint complete)完成即解除;在此之前每 turn 会持续注入 `<workflow-intent>` 提醒。

下面这套编号序列**就是** state machine —— 用 Bash 执行。**不要**从上方 Overview 自行演绎等价流程:
freestyle 会旁路引擎(无 ledger、无 evidence guard)。harnessed 给你 spawn-ready prompt;**你**用
CC-native Task / Agent 工具 spawn subagent(保持 session 响应 + 让澄清 round-trip 能回到用户)。

**不要** pipe 到 `harnessed run task-deliver` —— 那是 CI/headless 路径(in-process SDK spawn,在 Claude
Code 内部会阻塞 session)。

1. Bash: `harnessed prompt task-deliver --task "$ARGUMENTS" --json` → 解析 `{prompt, max_iterations, model}`。
2. 用 CC-native subagent(Task / Agent 工具)以该 `prompt` + `model` spawn,然后用 harnessed 自己的完成闸门驱动交付:
   - subagent 返回后,把它的最终输出写入文件,跑 `harnessed checkpoint complete task-deliver --result-file <path>` —— 该命令对声明的产物、TDD boundary、逐字 `<promise>COMPLETE</promise>` 三者 fail-closed。
   - 若被拦下,跑 `harnessed checkpoint fail task-deliver --failing-tests <n>` 记录本次尝试;命中停机条件时它会打印 BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP。
   - **仅当**这三者都未触发时才允许重 spawn。任一触发即停:重新收敛子任务范围、修掉阻塞点,或上报用户。绝不越过停机指令继续重 spawn。
3. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 AskUserQuestion 原样转达,把答案 append 进 spec,再重 spawn。
4. 命中 `<promise>COMPLETE</promise>`:把 subagent 最终输出写入文件,再 Bash `harnessed checkpoint complete task-deliver --result-file <path> --summary "<one-line>"`。fail-CLOSED —— 除非声明的 `artifacts_expected` 文件全部存在、TDD boundary 通过(证据非空 / 红绿两侧齐全 / 测试文件未被删除)、且结果含逐字 `<promise>COMPLETE</promise>`(或结构化 COMPLETE 状态),否则拦下。`--result <text>` 是内联变体;`--result-file` 优先且在 Windows 上引号安全。`--force` 记录可审计的覆盖(`evidence_status=overridden`),不是静默放行。
5. 若 complete 闸门拦下:Bash `harnessed checkpoint fail task-deliver --failing-tests <n>` 记录本次尝试。命中停机条件时会打印 `BUDGET-EXHAUSTED` / `NO-PROGRESS` / `BREAK-LOOP`。**仅当**三者都未触发时才允许重 spawn;任一触发即 STOP —— 重新收敛子任务范围、修掉阻塞点,或上报用户。

<!-- harnessed-generated:v4.12.0 -->

## References

- D-09 — L0 Discipline Substrate always-on (6 disciplines)
- D-10 — 完成保证真接 SDK wrapper (NOT mock reference; v0.2.0 ship)
- D-11 — Agent Teams 升级 5 触发 OR-chain per bundled parallelism-gate rules
- R20.10 — max_iterations_exceeded explicit emit_warning_and_halt
  (acceptance c "NOT silent abort"); 完成闸门正交 wrapper wraps 3 mode
- D-02 — SKILL.md `name:` bare slash cmd (`task-deliver` NOT `task/deliver`) per ADR 0030
- ADR 0011 — SDK + 完成保证 integration v0.2.0 baseline
- ADR 0039 — 完成保证内置化 + 摘除上游 `/ralph-loop` 依赖（supersedes ADR 0036）
- `workflows/judgments/parallelism-gate.yaml` triggers.completion-gate-wrapper +
  agent-teams-upgrade + subagent-default + main-session-fallback
- `workflows/capabilities.yaml` — completion-gate + agent-teams-{create,send-message,shutdown}
  + planning-with-files entries
- `workflows/defaults.yaml` — ralph_max_iterations.task-deliver.* values (T3.4.W2.2 followup)
- `docs/WORKFLOW.md` — 4-stage workflow mermaid + Stage ③ Execute 章节
