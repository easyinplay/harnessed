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

!`harnessed checkpoint intent plan-phase`

> The banner above (when present) means this invocation is REGISTERED with the engine (an intent marker) — not yet compliant: the steps below (prompt → spawn → checkpoint complete) resolve it, and a per-turn `<workflow-intent>` reminder persists until they run.

The numbered sequence below **is** the state machine — execute it with Bash. Do NOT improvise
an equivalent flow from the Overview above: freelancing bypasses the engine (no ledger, no
evidence guard). harnessed gives you the spawn-ready prompt; YOU spawn the subagent with a
CC-native Task / Agent tool (keeps the session responsive + lets clarification round-trips reach the user).

Do NOT pipe to `harnessed run plan-phase` — that is the CI/headless path (in-process SDK spawn
that blocks the session inside Claude Code).

1. Bash: `harnessed prompt plan-phase --task "$ARGUMENTS" --json` → parse `{prompt, max_iterations, model}`.
2. Spawn a CC-native subagent (Task / Agent tool) with that `prompt` + `model`, wrapped in the ralph-loop plugin: `/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`. If the plugin is absent, use the native goal gate instead (Claude Code 2.1.139+ / Codex): `/goal "this subtask is delivered: the subagent's final output contains verbatim <promise>COMPLETE</promise>; or stop after <max_iterations> turns"` then spawn the subagent and let the goal evaluator drive re-spawns until it clears. If `/goal` is unavailable too, self-loop: spawn → check output for `<promise>COMPLETE</promise>` → re-spawn with prior output appended (up to max_iterations). Set the goal only at the leaf subtask level — `/goal` is single-slot per session and a nested goal overwrites the outer one.
3. If the output contains `STATUS: NEEDS_CLARIFICATION` + a question list: STOP, relay them verbatim via AskUserQuestion, append the answers to the spec, then re-spawn the same sub.
4. On `<promise>COMPLETE</promise>`: Bash `harnessed checkpoint complete plan-phase --summary "<one-line>"`. The evidence guard runs here (fail-CLOSED): if a declared `artifacts_expected` file is missing it exits non-zero — re-spawn to produce it before treating the sub as done.

<!-- harnessed-generated:v4.9.3 -->

## References

- D-04 Stage ② Plan 二层 (架构 / 计划)
- D-15 Q-AUDIT-5a planning-with-files claude-code-plugin reframe (NOT npm-sdk)
- workflows/capabilities.yaml — gsd-plan-phase / planning-with-files (Bucket 4)
- workflows/defaults.yaml — ralph_max_iterations.plan-phase.* values (W2.2 backfill)
