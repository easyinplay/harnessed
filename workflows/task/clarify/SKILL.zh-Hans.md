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

## 如何调用

澄清需要真实用户对话,所以本阶段直接在**本 session** 跑 —— **不要** spawn,也**不要**自行演绎:
按以下步骤走,把 locked spec 持久化给执行阶段。

1. 对 "$ARGUMENTS" 评估澄清判据:
   - **战略层** —— 新功能 / 新 milestone / 商业 scope 不清 → gstack `/office-hours` + `/plan-ceo-review`
   - **Phase 层** —— ≥2 个 open implementation decision / 跨 phase API contract 不清 → GSD `/gsd-discuss-phase`
   - **子任务层** —— ≥2 个不同方案 / 核心算法 / API contract 设计 / 高错误成本 → superpowers brainstorming
2. 对每个 fire 的层与用户对话(option 型决策用 AskUserQuestion),锁定每个 open decision。
3. 不 fire 的层透明 skip —— 说明哪些被 skip 及原因。
4. 把 locked 决策持久化到 `.planning/`(planning-with-files 的 `findings.md` / `task_plan.md`)。

产出:一份 locked spec,执行阶段(`/plan` → `/task` → `/verify`)无需再问用户即可消费。

<!-- harnessed-generated:v4.9.3 -->

## References

- D-09 — L0 Discipline Substrate always-on (6 disciplines)
- D-05 — phase-level `invokes_tools` conditional tool fire
- D-04 — `gate` 4-level ref pre-resolved by `judgmentResolver`
- D-02 — SKILL.md `name:` bare slash cmd (`task-clarify` NOT `task/clarify`) per ADR 0030
- `workflows/judgments/subtask-gate.yaml` triggers.brainstorming
- `workflows/capabilities.yaml` — superpowers-brainstorming + grill-with-docs entries
- `workflows/defaults.yaml` — ralph_max_iterations.task-clarify.* values (T3.4.W2.2 followup)
- `docs/WORKFLOW.md` — 4-stage workflow mermaid + Stage ③ Execute 章节
