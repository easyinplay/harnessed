---
name: task-code
description: |
  task-code workflow v3 — Stage ③.b 子任务编码 sub-workflow (karpathy 4 心法
  always-on + mattpocock conditional route + planning-with-files progress.md update)。
  2-phase composition: 01-code (karpathy 心法 + zoom-out 陌生模块 / improve-arch
  周期审查 / diagnose bug conditional invokes_tools) → 02-progress (Claude Code plugin
  /plan 更新 progress.md 跨 session 进度同步)。
  schema_version: harnessed.workflow.v3 with disciplines_applied [6] + tools_available
  [zoom-out, improve-codebase-architecture, diagnose, planning-with-files]. Triggered
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
| 1 | `01-code` | karpathy | sonnet | `invokes_tools: [{if: phase.unfamiliar_module, tool: zoom-out}, {if: phase.architecture_health_audit, tool: improve-codebase-architecture}, {if: subtask.bug_root_cause_unknown, tool: diagnose}]` |
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

Phase 01-code 根据 phase fact context 条件性 fire 3 个 mattpocock 招式：
- `zoom-out` — 陌生模块导航（当 `phase.unfamiliar_module == true`）
- `improve-codebase-architecture` — 周期架构健康审查（当 `phase.architecture_health_audit == true`）
- `diagnose` — bug 系统化排错（当 `subtask.bug_root_cause_unknown == true`）

3 个触发条件 OR-chain，任 1 触发即 invoke 对应招式——互不排斥（对应 CLAUDE.md
「mattpocock 招式按需召唤」模式，NOT exclusive）。无触发 = pure karpathy 心法 only。

## Phase 02-progress planning-with-files plugin 直接对接 (Q-AUDIT-5a LOCKED Option A)

02-progress 调用 **Claude Code plugin** slash command `/plan` 更新
`.planning/<phase-id>/` 下的 `progress.md`——跟踪 subtask 完成 / blocked / next step，
遵循捆绑的「跨 session 恢复」模式 + R20.6 Manus-style 持久化。需要安装
`planning-with-files` Claude Code plugin（通过 Claude Code plugin marketplace 安装）。

## How to invoke

使用 Bash 工具运行：

```bash
echo "$ARGUMENTS" | harnessed run task-code --task-stdin
```

若 `$ARGUMENTS` 为空，运行 `harnessed run task-code`（不带 stdin pipe）。

执行完成后，Bash 输出会在 stderr 打印 `Next:` 提示，建议下一个阶段。根据对话上下文自行决定是否调用——该提示仅供参考，不具强制性。

<!-- harnessed-generated:v3.4.4 -->

## References

- D-09 — L0 Discipline Substrate always-on (karpathy 心法 4 条 cross-cutting)
- D-05 — phase-level `invokes_tools` conditional tool fire
- D-15 + Q-AUDIT-5a — planning-with-files = Claude Code plugin slash cmd `/plan`
- D-02 — SKILL.md `name:` bare slash cmd (`task-code` NOT `task/code`) per ADR 0030
- `workflows/disciplines/karpathy.yaml` — 4 心法 + ≤200L hard limit 等 rules (L0 substrate)
- `workflows/capabilities.yaml` — zoom-out / improve-codebase-architecture / diagnose / planning-with-files entries
- `workflows/defaults.yaml` — ralph_max_iterations.task-code.* values (T3.4.W2.2 followup)
- `docs/WORKFLOW.md` — 4-stage workflow mermaid + Stage ③ Execute 章节
