---
name: retro
description: |
  独立的 post-④ Verify 回顾工作流 — gstack /retro 经验教训 / 决策 / lessons
  系统总结 (项目 / 里程碑结束可选, bundled milestone-close retrospective cadence)
  + planning-with-files RETROSPECTIVE.md 持久化 (sister Phase
  v2.0-2.5 RETROSPECTIVE pattern)。Capability ref retro-gstack alias suffix per Pattern A
  E.2 LOCK (NOT bare retro 避免 standalone workflow / capability namespace 冲突)。
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (retro-gstack + planning-with-files) + 2 phase (01-retro gstack invoke + 02-persist
  RETROSPECTIVE.md sink)。Triggered by harnessed CLI `harnessed retro --milestone <name>` or
  slash command `/retro` after `harnessed setup`.
trigger_phrases:
  - "项目总结"
  - "里程碑结束"
  - "经验教训"
  - "retro"
---

# retro 工作流 (v3 新增 standalone)

## 概述

2 阶段 standalone 工作流，将 CLAUDE.md 中"项目 / 里程碑结束: 可选跑 /retro 总结"映射到
harnessed 运行时（Phase v3.0-3.4 W1.2 — D-04 新增 v3 standalone 工作流 + Pattern A E.2
retro-gstack alias suffix LOCK）。

| phase | id | upstream | model | capability / invokes | artifacts |
| ----- | -- | -------- | ----- | -------------------- | --------- |
| 1 | `01-retro` | gstack | opus | `{{ capabilities.retro-gstack.cmd }}` | gstack /retro 经验教训系统总结 |
| 2 | `02-persist` | planning-with-files | haiku | `{{ capabilities.planning-with-files.cmd }}` + `invokes: /plan` | `artifacts_expected: [RETROSPECTIVE.md]` |

每阶段配置从 `workflows/retro/workflow.yaml` 加载；引擎 spawn 阶段 01 gstack
`/retro`（alias 解析到 capabilities.yaml 中的 retro-gstack 载体），阶段 02
planning-with-files `/plan` invoke 持久化 RETROSPECTIVE.md sink。

## Capability refs (Pattern A E.2 LOCK)

Sister `workflows/capabilities.yaml` 条目：
- `retro-gstack` — Bucket 7 gstack optional **alias suffix** per Pattern A E.2 LOCK
  (impl: gstack, cmd: /retro, aliases to harnessed-bundled /retro, fires_when: is_milestone_close)
  — 解决 namespace 冲突 (NOT bare `retro` capability 因 standalone workflow 已占 retro 名)
- `planning-with-files` — Bucket 4 核心能力 (impl: claude-code-plugin, cmd: /plan)

## 路由规则（sister CLAUDE.md"项目 / 里程碑结束"）

- ✅ **触发**: 项目结束 / 里程碑结束 / 用户明示"复盘 / retro / lessons learned"
- ❌ **跳过**: 日常 PR / 单阶段完成（常规 verify-progress 已够用）

## 如何调用

CC-native 编排。**不要** pipe 到 `harnessed run retro` —— 那是 CI/headless 路径(in-process
SDK spawn,会阻塞 session、绕过 Agent Teams,在 Claude Code 内部调用时还会挂死)。

改用 `/retro` slash command(由 `harnessed setup` 生成于 `~/.claude/commands/retro.md`)。
它以 CC-native 方式驱动:`harnessed gates` 决定哪些 sub fire,`harnessed prompt <sub>` 给出每个
spawn-ready prompt,然后用 CC-native subagent(Task / Agent 工具)逐个 spawn 已 fire 的 sub,
每个结果用 `harnessed checkpoint` 记录。完整 state-machine 步骤见 `~/.claude/commands/retro.md`;
若该文件不存在,自行按 gates → prompt → spawn → checkpoint 同序执行。

<!-- harnessed-generated:v4.9.1 -->
