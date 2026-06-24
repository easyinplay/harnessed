---
name: task-clarify
description: |
  task-clarify workflow v3 — Stage ③.a 子任务澄清 sub-workflow (superpowers
  brainstorm + mattpocock /grill-with-docs conditional invoke)。Per-subtask
  repeat invoke 入口 — execute-task 每个 subtask 起步先走 task-clarify 评估 gate
  (judgments.subtask-gate.brainstorming.fires) 是否激活 brainstorming + 条件性
  fire grill-with-docs (phase.spec_ambiguous == true)。
  schema_version: harnessed.workflow.v3 with disciplines_applied [6] + tools_available
  [superpowers-brainstorming, grill-with-docs]. Triggered by harnessed CLI
  `harnessed task-clarify --task <text>` or slash command `/task-clarify` after
  `harnessed setup`.
trigger_phrases:
  - "clarify this subtask"
  - "task-clarify workflow"
  - "Stage 3 clarify"
  - "跑 task-clarify"
---

# task-clarify workflow (v3)

## Overview

单阶段子工作流，将 CLAUDE.md Stage ③.a 子任务澄清纪律映射到 harnessed runtime，
完整采用 `harnessed.workflow.v3` schema（Phase v3.0-3.4 W0 T3.4.W0.6 — D-09 L0
Discipline Substrate + D-05 conditional `invokes_tools` + D-04 gate ref）。

| phase | id | upstream | model | capability / invokes_tools | gate |
| ----- | -- | -------- | ----- | -------------------------- | ---- |
| 1 | `01-brainstorm` | superpowers | sonnet | `{{ capabilities.superpowers-brainstorming.cmd }}` + `invokes_tools: [{if: phase.spec_ambiguous, tool: grill-with-docs}]` | `judgments.subtask-gate.brainstorming.fires` |

每阶段配置从 `workflows/task/clarify/workflow.yaml` 加载；engine.runRouting 通过
`@anthropic-ai/claude-agent-sdk` 0.3.142+ 将每个阶段 spawn 为 sub-agent。

## Per-subtask 重复 invoke 模式

task-clarify **不是**一次性阶段——execute-task 主控编排器对**每个 subtask 入口**委托一次
task-clarify，评估 gate（subtask-gate.brainstorming.fires）是否激活。跳过路径
（subtask.type in ['crud','standard_lib_call'] OR subtask.lines < 20）完全绕过
brainstorming，遵循 CLAUDE.md「拿不准 → 倾向跳过」原则。

## Discipline Substrate (L0 always-on)

6 个 discipline（karpathy + output-style + language + operational + priority + protocols）
按 D-09 L0 Discipline Substrate 横切应用——workflow runtime pre-phase hook 加载
discipline yaml 并应用规则。Sentinel 类别 `behavioral` 跳过 cmd invoke；runtime engine
通过 `discipline_ref` 路由至 `workflows/disciplines/<basename>.yaml`。

## 条件性 grill-with-docs 触发 (D-05 invokes_tools)

Phase 01-brainstorm 在 `phase.spec_ambiguous == true` 时条件性 fire `grill-with-docs`——
对应 CLAUDE.md「Discuss / Research 阶段」mattpocock 招式按需召唤模式；**非**强制
无条件 fire（D-05 invokes_tools 与 OnClause 并存，但作用面不同——invokes_tools
属于 phase 级别的条件性工具触发，不决定 phase 是否执行）。

## How to invoke

使用 Bash 工具运行：

```bash
echo "$ARGUMENTS" | harnessed run task-clarify --task-stdin
```

若 `$ARGUMENTS` 为空，运行 `harnessed run task-clarify`（不带 stdin pipe）。

执行完成后，Bash 输出会在 stderr 打印 `Next:` 提示，建议下一个阶段。根据对话上下文自行决定是否调用——该提示仅供参考，不具强制性。

<!-- harnessed-generated:v3.4.4 -->

## References

- D-09 — L0 Discipline Substrate always-on (6 disciplines)
- D-05 — phase-level `invokes_tools` conditional tool fire
- D-04 — `gate` 4-level ref pre-resolved by `judgmentResolver`
- D-02 — SKILL.md `name:` bare slash cmd (`task-clarify` NOT `task/clarify`) per ADR 0030
- `workflows/judgments/subtask-gate.yaml` triggers.brainstorming
- `workflows/capabilities.yaml` — superpowers-brainstorming + grill-with-docs entries
- `workflows/defaults.yaml` — ralph_max_iterations.task-clarify.* values (T3.4.W2.2 followup)
- `docs/WORKFLOW.md` — 4-stage workflow mermaid + Stage ③ Execute 章节
