---
name: discuss-subtask
description: |
  Stage ①.c 子任务层 discuss sub-workflow — superpowers brainstorming (≥2 approach / 核心算法 /
  API contract / 错误成本高)。schema_version: harnessed.workflow.v3 with disciplines_applied (6
  default) + tools_available (superpowers-brainstorming + grill-with-docs + grill-me) + 1 phase
  (01-brainstorm with conditional invokes_tools for spec_ambiguous + no_docs)。Triggered by
  harnessed CLI `harnessed discuss-subtask --task <text>` or slash command `/discuss-subtask`
  after `harnessed setup`.
trigger_phrases:
  - "discuss subtask"
  - "子任务澄清"
  - "brainstorm"
  - "多 approach 探索"
  - "跑 discuss-subtask"
---

# discuss-subtask workflow (v3)

## Overview

1-phase sub-workflow mapping CLAUDE.md "Stage ①.c 子任务层 — superpowers brainstorming"
onto harnessed runtime (Phase v3.0-3.4 W0.3 — D-04 Stage ① Discuss 三层 + D-05
phase.invokes_tools conditional fire + Pattern A sub-workflow ship)。

| phase | id | upstream | model | capability / invokes_tools | gate |
| ----- | -- | -------- | ----- | -------------------------- | ---- |
| 1 | `01-brainstorm` | superpowers | opus | `{{ capabilities.superpowers-brainstorming.cmd }}` + conditional `invokes_tools[grill-with-docs, grill-me]` | `gate: judgments.subtask-gate.brainstorming.fires` |

## Capability refs

Sister `workflows/capabilities.yaml` entries:
- `superpowers-brainstorming` — Bucket 4 (impl: superpowers, cmd: superpowers:brainstorming)
- `grill-with-docs` — Bucket 1 mattpocock (impl: mattpocock-skills, cmd: /grill-with-docs)
- `grill-me` — Bucket 1 mattpocock (impl: mattpocock-skills, cmd: /grill-me)

## Gate ref

Sister `workflows/judgments/subtask-gate.yaml`:
- `brainstorming.fires` — `subtask.approaches >= 2 or subtask.core_algorithm == true or subtask.has_api_contract == true or subtask.error_cost == 'high'`

## Conditional tool invocation (D-05 invokes_tools)

- `phase.spec_ambiguous == true` → fire `grill-with-docs`
- `phase.spec_ambiguous == true AND phase.no_docs == true` → fire `grill-me`

## Invocation

- CLI: `harnessed discuss-subtask --task "<text>"`
- Slash command: `/discuss-subtask <text>` (after `harnessed setup`)

## Routing rules

跳过条件 (sister CLAUDE.md "子任务层 ❌ 跳过"):
- 常规 CRUD / 跟现有模式一致
- 单一明显实现 (< 20 行 / 一个文件)
- 标准库直接调用
- bug 修复且已知根因

## How to invoke

Use the SlashCommand tool to run: `{{ capabilities.superpowers-brainstorming.cmd }}`

(If a `⚠️ ... not installed` warning was printed by `harnessed setup`, the backing
capability is missing on disk. Install it (`claude plugin install <name>` for
plugins, or follow the official install instructions for user-skills — e.g. for
gstack: `git clone https://github.com/garrytan/gstack.git ~/.claude/skills/gstack` then
`cd ~/.claude/skills/gstack && ./setup`), then re-run `harnessed setup` to re-render
this SKILL.md and clear the warning.)

## References

- D-04 Stage ① Discuss 三层 (战略 / phase / 子任务)
- D-05 phase.invokes_tools conditional fire (NEW v3)
- ~/.claude/CLAUDE.md "子任务层: superpowers:brainstorming"
- workflows/capabilities.yaml — superpowers-brainstorming / grill-with-docs / grill-me
- workflows/judgments/subtask-gate.yaml — brainstorming trigger
- workflows/defaults.yaml — ralph_max_iterations.discuss-subtask.* values (W2.2 backfill)
