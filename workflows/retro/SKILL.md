---
name: retro
description: |
  Standalone post-④ Verify retrospective workflow — gstack /retro 经验教训 / 决策 / lessons
  系统总结 (项目 / 里程碑结束可选, sister ~/.claude/CLAUDE.md "项目 / 里程碑结束: 可选跑
  /retro 总结" verbatim) + planning-with-files RETROSPECTIVE.md 持久化 (sister Phase
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

# retro workflow (v3 NEW standalone)

## Overview

2-phase standalone workflow mapping CLAUDE.md "项目 / 里程碑结束: 可选跑 /retro 总结" onto
harnessed runtime (Phase v3.0-3.4 W1.2 — D-04 NEW v3 standalone workflow + Pattern A E.2
retro-gstack alias suffix LOCK)。

| phase | id | upstream | model | capability / invokes | artifacts |
| ----- | -- | -------- | ----- | -------------------- | --------- |
| 1 | `01-retro` | gstack | opus | `{{ capabilities.retro-gstack.cmd }}` | gstack /retro 经验教训系统总结 |
| 2 | `02-persist` | planning-with-files | haiku | `{{ capabilities.planning-with-files.cmd }}` + `invokes: /plan` | `artifacts_expected: [RETROSPECTIVE.md]` |

Per-phase config loads from `workflows/retro/workflow.yaml`; engine spawns phase 01 gstack
`/retro` (alias resolve to retro-gstack carrier per capabilities.yaml entry), phase 02
planning-with-files `/plan` invoke 持久化 RETROSPECTIVE.md sink。

## Capability refs (Pattern A E.2 LOCK)

Sister `workflows/capabilities.yaml` entries:
- `retro-gstack` — Bucket 7 gstack optional **alias suffix** per Pattern A E.2 LOCK
  (impl: gstack, cmd: /retro, aliases to harnessed-bundled /retro, fires_when: is_milestone_close)
  — 解决 namespace 冲突 (NOT bare `retro` capability 因 standalone workflow 已占 retro 名)
- `planning-with-files` — Bucket 4 核心 capability (impl: claude-code-plugin, cmd: /plan)

## Routing rules (sister CLAUDE.md "项目 / 里程碑结束")

- ✅ **触发**: 项目结束 / 里程碑结束 / 用户明示 "复盘 / retro / lessons learned"
- ❌ **跳过**: 日常 PR / 单 phase 完成 (常规 verify-progress 已够用)

## CLI invocation

```bash
# Dry-run preview — arbitrate-only, never spawns SDK.
harnessed retro --milestone <name> --dry-run --non-interactive

# Apply path — real SDK spawn + 2-phase serial (gstack /retro → planning-with-files RETROSPECTIVE.md sink).
harnessed retro --milestone <name> --apply
```

## References

- D-04 NEW v3 standalone workflow (research v3 bump + retro NEW)
- Pattern A E.2 LOCK — 2 alias suffix `-gstack` 解决 namespace 冲突 (retro-gstack + investigate-gstack)
- Pattern A reconcile D.2 — gstack 30 optional naming bare 例外
- ~/.claude/CLAUDE.md "项目 / 里程碑结束: 可选跑 /retro 总结" verbatim
- workflows/capabilities.yaml — retro-gstack (alias suffix) + planning-with-files
- workflows/defaults.yaml — ralph_max_iterations.retro.* values (W2.2 backfill)
- sister Phase v2.0-2.5 RETROSPECTIVE.md sink pattern
