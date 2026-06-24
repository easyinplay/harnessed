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

使用 Bash 工具运行：

```bash
echo "$ARGUMENTS" | harnessed run retro --task-stdin
```

如果 `$ARGUMENTS` 为空，运行 `harnessed run retro`（不带 stdin pipe）。

完成后，Bash 输出会在 stderr 打印 `Next:` 提示，建议下一个阶段。根据对话上下文决定是否调用 — 该提示仅供参考，不作强制指引。

<!-- harnessed-generated:v3.4.4 -->

## 参考文档

- D-04 新增 v3 standalone 工作流 (research v3 bump + retro 新增)
- Pattern A E.2 LOCK — 2 个 alias suffix `-gstack` 解决 namespace 冲突 (retro-gstack + investigate-gstack)
- Pattern A reconcile D.2 — gstack 30 optional naming bare 例外
- workflows/capabilities.yaml — retro-gstack (alias suffix) + planning-with-files
- workflows/defaults.yaml — ralph_max_iterations.retro.* values (W2.2 backfill)
- sister Phase v2.0-2.5 RETROSPECTIVE.md sink pattern
