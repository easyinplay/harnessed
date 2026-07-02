---
name: task-test
description: |
  task-test 工作流 v3 — Stage ③.c 子任务测试 sub-workflow (superpowers TDD
  red-green-refactor 强制 + diagnose 条件调用)。单阶段组合：
  01-test（能力 `superpowers:test-driven-development` + 关卡
  judgments.tdd-gate.tdd-strongly-suggested.fires + invokes_tools[{if: test_fail,
  tool: diagnose}]）。Alias /tdd (mattpocock-skills) 可替代 superpowers TDD per D-13。
  schema_version: harnessed.workflow.v3，含 disciplines_applied [6] + tools_available
  [tdd, diagnose]。通过 harnessed CLI `harnessed task-test --task <text>` 或
  `harnessed setup` 后的斜杠命令 `/task-test` 触发。
trigger_phrases:
  - "test this subtask"
  - "task-test workflow"
  - "Stage 3 test"
  - "TDD red-green-refactor"
  - "跑 task-test"
---

# task-test workflow (v3)

## 概述

单阶段子工作流，将用户 CLAUDE.md Stage ③.c 子任务测试 + TDD
强烈建议开启纪律映射到 harnessed 运行时，完整采用 `harnessed.workflow.v3`
schema（Phase v3.0-3.4 W0 T3.4.W0.8 — D-09 L0 Discipline Substrate + D-04 关卡引用
+ D-05 条件式 `invokes_tools` + D-13 tdd 能力别名）。

| phase | id | upstream | model | capability / invokes_tools | gate |
| ----- | -- | -------- | ----- | -------------------------- | ---- |
| 1 | `01-test` | superpowers | sonnet | `{{ capabilities.tdd.cmd }}` + `invokes_tools: [{if: test_fail == true, tool: diagnose}]` | `judgments.tdd-gate.tdd-strongly-suggested.fires` |

每阶段配置从 `workflows/task/test/workflow.yaml` 加载；engine.runRouting
通过 `@anthropic-ai/claude-agent-sdk` 0.3.142+ 将每个阶段作为 subagent 启动。

## TDD 关卡（D-04 + judgments/tdd-gate.yaml 6 fires_when + 3 skips_when）

关卡 `judgments.tdd-gate.tdd-strongly-suggested.fires` 机器化 CLAUDE.md
「Execute 阶段」TDD 强烈建议开启节的 6 项 OR-chain：
- `subtask.is_core_business_logic == true`
- `subtask.is_algorithm == true`
- `subtask.is_data_processing == true`
- `subtask.regression_risk == 'high'`
- `subtask.reliability_required == true`

跳过条件（per tdd-gate.yaml skips_when）：
- `subtask.type in ['crud', 'ui_polish', 'docs_only']`

关卡 4 级引用由 `judgmentResolver`（T2.3.W0.4 SHIPPED）在 expr-eval 求值**前**预解析——
运行时引擎在关卡未触发时跳过该阶段。

## D-13 tdd 能力别名

能力 `tdd`（per capabilities.yaml L346-359）主 impl 为 `superpowers:test-driven-
development`，别名 `[{impl: mattpocock-skills, cmd: /tdd}]` — 两者可替代 per D-13
LOCKED 决策。`{{ capabilities.tdd.cmd }}` 默认 resolve 至 superpowers
SDK，用户发出明确信号时可切换至 mattpocock /tdd 别名路径。

## 条件式 diagnose 调用（D-05 invokes_tools）

阶段 01-test 在 `test_fail == true` 时条件性触发 `diagnose`（capabilities.yaml L55-64 mattpocock-skills
/diagnose）— 对应 sister CLAUDE.md「系统化排错」模式；
测试失败时进入 diagnose 循环（reproduce → minimise → hypothesise → instrument →
fix → regression-test），测试通过则完全跳过 diagnose。

## 如何调用

下面这套编号序列**就是** state machine —— 用 Bash 执行。**不要**从上方 Overview 自行演绎等价流程:
freestyle 会旁路引擎(无 ledger、无 evidence guard)。harnessed 给你 spawn-ready prompt;**你**用
CC-native Task / Agent 工具 spawn subagent(保持 session 响应 + 让澄清 round-trip 能回到用户)。

**不要** pipe 到 `harnessed run task-test` —— 那是 CI/headless 路径(in-process SDK spawn,在 Claude
Code 内部会阻塞 session)。

1. Bash: `harnessed prompt task-test --task "$ARGUMENTS" --json` → 解析 `{prompt, max_iterations, model}`。
2. 用 CC-native subagent(Task / Agent 工具)以该 `prompt` + `model` spawn,用 ralph-loop plugin 包裹:`/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`。若 plugin 未装,改用原生 goal gate(Claude Code 2.1.139+ / Codex):`/goal "this subtask is delivered: the subagent's final output contains verbatim <promise>COMPLETE</promise>; or stop after <max_iterations> turns"`,随后 spawn subagent,由 goal 评估器驱动重 spawn 直到目标清除。若 `/goal` 也不可用,自循环:spawn → 检查输出 `<promise>COMPLETE</promise>` → 把上轮输出 append 后重 spawn(至多 max_iterations)。goal 只在叶子 subtask 层设置 — `/goal` 每 session 单槽,嵌套 goal 会覆盖外层。
3. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 AskUserQuestion 原样转达,把答案 append 进 spec,再重 spawn。
4. 命中 `<promise>COMPLETE</promise>`:Bash `harnessed checkpoint complete task-test --summary "<one-line>"`。evidence guard 在此运行(fail-CLOSED):若声明的 `artifacts_expected` 文件缺失会 exit 非零 —— 重 spawn 产出它再算 done。

<!-- harnessed-generated:v4.9.3 -->

## 参考资料

- D-09 — L0 Discipline Substrate always-on
- D-04 — `gate` 4 级引用由 `judgmentResolver` 预解析
- D-05 — 阶段级 `invokes_tools` 条件工具触发
- D-13 — tdd 能力 2 impl 候选别名（superpowers 主 + mattpocock /tdd 备）
- D-02 — SKILL.md `name:` 裸斜杠命令（`task-test` 而非 `task/test`）per ADR 0030
- `workflows/judgments/tdd-gate.yaml` triggers.tdd-strongly-suggested
- `workflows/capabilities.yaml` — tdd（superpowers + mattpocock 别名）+ diagnose 条目
- `workflows/defaults.yaml` — ralph_max_iterations.task-test.* 值（T3.4.W2.2 followup）
- `docs/WORKFLOW.md` — 4-stage 工作流 mermaid + Stage ③ Execute 章节
