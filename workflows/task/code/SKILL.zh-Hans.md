---
name: task-code
description: |
  task-code workflow v3 — Stage ③.b 子任务编码 sub-workflow (karpathy 4 心法
  always-on + mattpocock conditional route + planning-with-files progress.md update)。
  2-phase composition: 01-code (karpathy 心法 + improve-arch
  周期审查 / diagnose bug conditional invokes_tools) → 02-progress (Claude Code plugin
  /plan 更新 progress.md 跨 session 进度同步)。
  schema_version: harnessed.workflow.v3 with disciplines_applied [6] + tools_available
  [improve-codebase-architecture, diagnose, planning-with-files]. Triggered
  by harnessed CLI `harnessed task-code --task <text>` or slash command `/task-code`
  after `harnessed setup`.
trigger_phrases:
  - "code this subtask"
  - "task-code workflow"
  - "Stage 3 code"
  - "跑 task-code"
---

# task-code workflow (v3)

## Overview

2-phase 子工作流，将 CLAUDE.md Stage ③.b 子任务编码纪律映射到 harnessed runtime，
完整采用 `harnessed.workflow.v3` schema（Phase v3.0-3.4 W0 T3.4.W0.7 — D-09 L0
Discipline Substrate + D-05 conditional `invokes_tools` + D-15
planning-with-files plugin）。

| phase | id | upstream | model | capability / invokes_tools |
| ----- | -- | -------- | ----- | -------------------------- |
| 1 | `01-code` | karpathy | sonnet | `invokes_tools: [{if: phase.architecture_health_audit, tool: improve-codebase-architecture}, {if: subtask.bug_root_cause_unknown, tool: diagnose}]` |
| 2 | `02-progress` | planning-with-files | haiku | `{{ capabilities.planning-with-files.cmd }}` / `invokes: /plan` / `artifacts_expected: [progress.md]` |

每阶段配置从 `workflows/task/code/workflow.yaml` 加载；engine.runRouting 通过
`@anthropic-ai/claude-agent-sdk` 0.3.142+ 将每个阶段 spawn 为 sub-agent。

## Karpathy 4 心法 (L0 Discipline Substrate always-on)

Phase 01-code 的 upstream 是 `karpathy`——runtime engine 加载 `workflows/disciplines/
karpathy.yaml` discipline rules 横切应用（Think Before Coding / Simplicity
First / Surgical Changes / Goal-Driven Execution + ≤200L hard limit + no-feature-creep
+ trust-internal-code + no-comments-default）。不 invoke slash cmd，通过 hook 强制
behavioral rule，遵循 D-09 L0 Discipline Substrate。

## mattpocock conditional route (D-05 invokes_tools)

Phase 01-code 根据 phase fact context 条件性 fire 2 个 mattpocock 招式：
- `improve-codebase-architecture` — 周期架构健康审查（当 `phase.architecture_health_audit == true`）
- `diagnose` — bug 系统化排错（当 `subtask.bug_root_cause_unknown == true`）

2 个触发条件 OR-chain，任 1 触发即 invoke 对应招式——互不排斥（对应 CLAUDE.md
「mattpocock 招式按需召唤」模式，NOT exclusive）。无触发 = pure karpathy 心法 only。

## CodeGraph navigation (opt-in, v4.17.0)

项目存在 `.codegraph/` 索引时（opt-in 的 CodeGraph 语义索引 — 对应
`capabilities.yaml` 的 `codegraph` entry），符号查找 / 调用链 / 影响面分析优先用
codegraph MCP 工具（`codegraph_explore`），替代 grep/glob/逐文件 Read 爬取。
无 `.codegraph/` 则跳过（不做安装劝导）。

## Phase 02-progress planning-with-files plugin 直接对接 (Q-AUDIT-5a LOCKED Option A)

02-progress 调用 **Claude Code plugin** slash command `/plan` 更新
`.planning/phases/<NN>-<slug>/` 下的 `progress.md`——跟踪 subtask 完成 / blocked / next step，
遵循捆绑的「跨 session 恢复」模式 + R20.6 Manus-style 持久化。需要安装
`planning-with-files` Claude Code plugin（通过 Claude Code plugin marketplace 安装）。

## 如何调用

下面这套编号序列**就是** state machine —— 用 Bash 执行。**不要**从上方 Overview 自行演绎等价流程:
freestyle 会旁路引擎(无 ledger、无 evidence guard)。harnessed 给你 spawn-ready prompt;**你**用
CC-native Task / Agent 工具 spawn subagent(保持 session 响应 + 让澄清 round-trip 能回到用户)。

**不要** pipe 到 `harnessed run task-code` —— 那是 CI/headless 路径(in-process SDK spawn,在 Claude
Code 内部会阻塞 session)。

1. Bash: `harnessed prompt task-code --task "$ARGUMENTS" --json` → 解析 `{prompt, max_iterations, model}`。
2. 用 CC-native subagent(Task / Agent 工具)以该 `prompt` + `model` spawn,用 ralph-loop plugin 包裹:`/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`。若 plugin 未装,改用原生 goal gate(Claude Code 2.1.139+ / Codex):`/goal "this subtask is delivered: the subagent's final output contains verbatim <promise>COMPLETE</promise>; or stop after <max_iterations> turns"`,随后 spawn subagent,由 goal 评估器驱动重 spawn 直到目标清除。若 `/goal` 也不可用,自循环:spawn → 检查输出 `<promise>COMPLETE</promise>` → 把上轮输出 append 后重 spawn(至多 max_iterations)。goal 只在叶子 subtask 层设置 — `/goal` 每 session 单槽,嵌套 goal 会覆盖外层。
3. 若输出含 `STATUS: NEEDS_CLARIFICATION` + 问题列表:STOP,用 AskUserQuestion 原样转达,把答案 append 进 spec,再重 spawn。
4. 命中 `<promise>COMPLETE</promise>`:Bash `harnessed checkpoint complete task-code --summary "<one-line>"`。evidence guard 在此运行(fail-CLOSED):若声明的 `artifacts_expected` 文件缺失会 exit 非零 —— 重 spawn 产出它再算 done。

<!-- harnessed-generated:v4.9.3 -->

## References

- D-09 — L0 Discipline Substrate always-on (karpathy 心法 4 条 cross-cutting)
- D-05 — phase-level `invokes_tools` conditional tool fire
- D-15 + Q-AUDIT-5a — planning-with-files = Claude Code plugin slash cmd `/plan`
- D-02 — SKILL.md `name:` bare slash cmd (`task-code` NOT `task/code`) per ADR 0030
- `workflows/disciplines/karpathy.yaml` — 4 心法 + ≤200L hard limit 等 rules (L0 substrate)
- `workflows/capabilities.yaml` — improve-codebase-architecture / diagnose / planning-with-files entries
- `workflows/defaults.yaml` — ralph_max_iterations.task-code.* values (T3.4.W2.2 followup)
- `docs/WORKFLOW.md` — 4-stage workflow mermaid + Stage ③ Execute 章节
