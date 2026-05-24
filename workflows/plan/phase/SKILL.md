---
name: plan-phase
description: |
  Stage ②.b 计划层 plan sub-workflow — GSD /gsd-plan-phase Wave A research + Wave B planner +
  Wave C plan-checker + planning-with-files Claude Code plugin /plan 持久化 task_plan.md +
  progress.md (bundled Plan-stage cadence: GSD + planning-with-files)。Stage ② 铁律:
  dual capability (GSD orchestration + planning-with-files plugin)。schema_version:
  harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available [gsd-plan-phase,
  planning-with-files] + 2 phases (01-gsd-plan + 02-persist)。Triggered by harnessed CLI
  `harnessed plan-phase --phase <num>` or slash command `/plan-phase` after `harnessed setup`.
trigger_phrases:
  - "plan phase"
  - "计划层 phase"
  - "gsd plan phase"
  - "持久化计划"
  - "跑 plan-phase"
---

# plan-phase workflow (v3)

## Overview

2-phase sub-workflow mapping CLAUDE.md "Plan 阶段 — GSD + planning-with-files" onto harnessed
runtime (Phase v3.0-3.4 W0.5 — D-04 Stage ② Plan 二层 + D-15 planning-with-files
claude-code-plugin /plan + Pattern A sub-workflow ship)。

| phase | id | upstream | model | capability / invokes | artifacts |
| ----- | -- | -------- | ----- | -------------------- | --------- |
| 1 | `01-gsd-plan` | gsd | sonnet | `{{ capabilities.gsd-plan-phase.cmd }}` | (Wave A research + Wave B planner + Wave C plan-checker) |
| 2 | `02-persist` | planning-with-files | haiku | `{{ capabilities.planning-with-files.cmd }}` + `invokes: /plan` | `artifacts_expected: [task_plan.md, progress.md]` |

## Capability refs

Sister `workflows/capabilities.yaml` entries:
- `gsd-plan-phase` — Bucket 2 (impl: gsd, cmd: /gsd-plan-phase)
- `planning-with-files` — Bucket 4 (impl: claude-code-plugin, cmd: /plan;
  requires the `planning-with-files` Claude Code plugin to be installed via the
  Claude Code plugin marketplace; outputs: task_plan.md + progress.md + findings.md)

## Stage ② 铁律 — dual capability

GSD `/gsd-plan-phase` orchestrate (Wave A research → Wave B planner → Wave C
plan-checker) → planning-with-files `/plan` 持久化 (plugin 真生成 task_plan.md +
progress.md, NOT fs.writeFile self-impl per D-15 Q-AUDIT-5a claude-code-plugin
reframe)。

## Invocation

- Slash command: `/plan-phase <num>` (after `harnessed setup`)

## Output artifacts

- `task_plan.md` — 主任务清单 + 文件路径 + 依赖 + 验收标准
- `progress.md` — phase 进度跟踪 + cross-session 恢复
- (`findings.md` 由 discuss-* sub-workflow 产出, 此处不重复)

## How to invoke

Use the Bash tool to run:

```bash
echo "$ARGUMENTS" | harnessed run plan-phase --task-stdin
```

If `$ARGUMENTS` is empty, run `harnessed run plan-phase` (no stdin pipe).

After completion, the Bash output prints a `Next:` hint on stderr suggesting the next stage. Decide whether to invoke based on conversation context — the hint is informational, not prescriptive.

<!-- harnessed-generated:v3.4.4 -->

## References

- D-04 Stage ② Plan 二层 (架构 / 计划)
- D-15 Q-AUDIT-5a planning-with-files claude-code-plugin reframe (NOT npm-sdk)
- workflows/capabilities.yaml — gsd-plan-phase / planning-with-files (Bucket 4)
- workflows/defaults.yaml — ralph_max_iterations.plan-phase.* values (W2.2 backfill)
