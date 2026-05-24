---
name: discuss-strategic
description: |
  Stage ①.a 战略层 discuss sub-workflow — gstack /office-hours + /plan-ceo-review 新功能 / 新
  milestone / 新产品方向启动前强制治理关卡 (bundled gstack governance gate, mandatory before new-feature)。
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (gstack-office-hours + gstack-plan-ceo-review + planning-with-files) + 3 phases (gate
  judgments.strategic-gate.* fires + planning-with-files /plan findings.md 持久化)。
  Triggered by slash command
  `/discuss-strategic` after `harnessed setup`.
trigger_phrases:
  - "discuss strategic"
  - "战略层澄清"
  - "office hours"
  - "新功能启动"
  - "跑 discuss-strategic"
---

# discuss-strategic workflow (v3)

## Overview

3-phase sub-workflow mapping CLAUDE.md "Stage ①.a 战略层 — 新功能启动前强制 🔒"
onto harnessed runtime (Phase v3.0-3.4 W0.1 — D-04 Stage ① Discuss 三层 + D-12 gstack
治理关卡 + Pattern A sub-workflow ship)。

| phase | id | upstream | model | capability / invokes | gate / artifacts |
| ----- | -- | -------- | ----- | -------------------- | ---------------- |
| 1 | `01-office-hours` | gstack | opus | `{{ capabilities.gstack-office-hours.cmd }}` | `gate: judgments.strategic-gate.office-hours.fires` |
| 2 | `02-plan-ceo-review` | gstack | opus | `{{ capabilities.gstack-plan-ceo-review.cmd }}` | `gate: judgments.strategic-gate.plan-ceo-review.fires` |
| 3 | `03-persist` | planning-with-files | haiku | `{{ capabilities.planning-with-files.cmd }}` + `invokes: /plan` | `artifacts_expected: [findings.md]` |

## Capability refs

Sister `workflows/capabilities.yaml` entries:
- `gstack-office-hours` — Bucket 3 治理关卡 (impl: gstack, cmd: /office-hours)
- `gstack-plan-ceo-review` — Bucket 3 治理关卡 (impl: gstack, cmd: /plan-ceo-review)
- `planning-with-files` — Bucket 4 核心 capability (impl: claude-code-plugin, cmd: /plan)

## Gate refs

Sister `workflows/judgments/strategic-gate.yaml`:
- `office-hours.fires` — `phase.type in ['new_project', 'new_milestone', 'new_feature']`
- `plan-ceo-review.fires` — `phase.type == 'new_project' or phase.is_major_release == true`

## Invocation

- Slash command: `/discuss-strategic <text>` (after `harnessed setup`)

## Routing rules

跳过条件 (sister CLAUDE.md "战略层 ❌ 跳过"):
- bug 修复 / 技术债 / 实现细节
- scope 已在历史 `.planning/` 或 design doc 定义
- continuing 已有 phase 的执行
- 用户已给明确 ticket / spec

## How to invoke

Use the Bash tool to run:

```bash
echo "$ARGUMENTS" | harnessed run discuss-strategic --task-stdin
```

If `$ARGUMENTS` is empty, run `harnessed run discuss-strategic` (no stdin pipe).

After completion, the Bash output prints a `Next:` hint on stderr suggesting the next stage. Decide whether to invoke based on conversation context — the hint is informational, not prescriptive.

<!-- harnessed-generated:v3.4.4 -->

## References

- D-04 Stage ① Discuss 三层 (战略 / phase / 子任务)
- D-12 gstack 治理关卡强制
- workflows/capabilities.yaml — gstack-office-hours / gstack-plan-ceo-review / planning-with-files
- workflows/judgments/strategic-gate.yaml — office-hours / plan-ceo-review triggers
- workflows/defaults.yaml — ralph_max_iterations.discuss-strategic.* values (W2.2 backfill)
