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

2-phase sub-workflow mapping the user's CLAUDE.md Stage ③.b 子任务编码 discipline
onto the harnessed runtime, fully `harnessed.workflow.v3` schema (Phase v3.0-3.4 W0
T3.4.W0.7 — D-09 L0 Discipline Substrate + D-05 conditional `invokes_tools` + D-15
planning-with-files plugin).

| phase | id | upstream | model | capability / invokes_tools |
| ----- | -- | -------- | ----- | -------------------------- |
| 1 | `01-code` | karpathy | sonnet | `invokes_tools: [{if: phase.unfamiliar_module, tool: zoom-out}, {if: phase.architecture_health_audit, tool: improve-codebase-architecture}, {if: subtask.bug_root_cause_unknown, tool: diagnose}]` |
| 2 | `02-progress` | planning-with-files | haiku | `{{ capabilities.planning-with-files.cmd }}` / `invokes: /plan` / `artifacts_expected: [progress.md]` |

Per-phase config loads from `workflows/task/code/workflow.yaml`; engine.runRouting
spawns each phase as a sub-agent via `@anthropic-ai/claude-agent-sdk` 0.3.142+.

## Karpathy 4 心法 (L0 Discipline Substrate always-on)

Phase 01-code 的 upstream 是 `karpathy` — runtime engine 加载 `workflows/disciplines/
karpathy.yaml` discipline rules 应用 cross-cutting (Think Before Coding / Simplicity
First / Surgical Changes / Goal-Driven Execution + ≤200L hard limit + no-feature-creep
+ trust-internal-code + no-comments-default). 不 invoke slash cmd, 通过 hook 强制
behavioral rule per D-09 L0 Discipline Substrate.

## mattpocock conditional route (D-05 invokes_tools)

Phase 01-code 按 phase fact context 条件性 fire 3 mattpocock 招式:
- `zoom-out` — 陌生模块导航 (when `phase.unfamiliar_module == true`)
- `improve-codebase-architecture` — 周期架构健康审查 (when `phase.architecture_health_audit == true`)
- `diagnose` — bug 系统化排错 (when `subtask.bug_root_cause_unknown == true`)

3 触发条件 OR-chain, 任 1 fire 即 invoke 对应招式 — 不互斥 (sister CLAUDE.md
"mattpocock 招式按需召唤" pattern, NOT exclusive). 无触发 = pure karpathy 心法 only.

## Phase 02-progress planning-with-files plugin 真接 (Q-AUDIT-5a LOCKED Option A)

02-progress invokes the **Claude Code plugin** slash command `/plan` to update
`progress.md` in `.planning/<phase-id>/` — 跟踪 subtask 完成 / blocked / next step
per bundled "跨 session 恢复" 模式 + R20.6 Manus-style 持久化. Requires the
`planning-with-files` Claude Code plugin (install via Claude Code plugin
marketplace).

## How to invoke

The numbered sequence below **is** the state machine — execute it with Bash. Do NOT improvise
an equivalent flow from the Overview above: freelancing bypasses the engine (no ledger, no
evidence guard). harnessed gives you the spawn-ready prompt; YOU spawn the subagent with a
CC-native Task / Agent tool (keeps the session responsive + lets clarification round-trips reach the user).

Do NOT pipe to `harnessed run task-code` — that is the CI/headless path (in-process SDK spawn
that blocks the session inside Claude Code).

1. Bash: `harnessed prompt task-code --task "$ARGUMENTS" --json` → parse `{prompt, max_iterations, model}`.
2. Spawn a CC-native subagent (Task / Agent tool) with that `prompt` + `model`, wrapped in the ralph-loop plugin: `/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`. If the plugin is absent, use the native goal gate instead (Claude Code 2.1.139+ / Codex): `/goal "this subtask is delivered: the subagent's final output contains verbatim <promise>COMPLETE</promise>; or stop after <max_iterations> turns"` then spawn the subagent and let the goal evaluator drive re-spawns until it clears. If `/goal` is unavailable too, self-loop: spawn → check output for `<promise>COMPLETE</promise>` → re-spawn with prior output appended (up to max_iterations). Set the goal only at the leaf subtask level — `/goal` is single-slot per session and a nested goal overwrites the outer one.
3. If the output contains `STATUS: NEEDS_CLARIFICATION` + a question list: STOP, relay them verbatim via AskUserQuestion, append the answers to the spec, then re-spawn the same sub.
4. On `<promise>COMPLETE</promise>`: Bash `harnessed checkpoint complete task-code --summary "<one-line>"`. The evidence guard runs here (fail-CLOSED): if a declared `artifacts_expected` file is missing it exits non-zero — re-spawn to produce it before treating the sub as done.

<!-- harnessed-generated:v4.9.3 -->

## References

- D-09 — L0 Discipline Substrate always-on (karpathy 心法 4 条 cross-cutting)
- D-05 — phase-level `invokes_tools` conditional tool fire
- D-15 + Q-AUDIT-5a — planning-with-files = Claude Code plugin slash cmd `/plan`
- D-02 — SKILL.md `name:` bare slash cmd (`task-code` NOT `task/code`) per ADR 0030
- `workflows/disciplines/karpathy.yaml` — 4 心法 + ≤200L hard limit 等 rules (L0 substrate)
- `workflows/capabilities.yaml` — zoom-out / improve-codebase-architecture / diagnose / planning-with-files entries
- `workflows/defaults.yaml` — ralph_max_iterations.task-code.* values (T3.4.W2.2 followup)
- `docs/WORKFLOW.md` — 4-stage workflow mermaid + Stage ③ Execute 章节
