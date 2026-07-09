---
name: retro
description: |
  Standalone post-④ Verify retrospective workflow — gstack /retro 经验教训 / 决策 / lessons
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

## How to invoke

!`harnessed checkpoint intent retro`

> The banner above (when present) means this invocation is REGISTERED with the engine (an intent marker) — not yet compliant: the steps below (prompt → spawn → checkpoint complete) resolve it, and a per-turn `<workflow-intent>` reminder persists until they run.

The numbered sequence below **is** the state machine — execute it with Bash. Do NOT improvise
an equivalent flow from the Overview above: freelancing bypasses the engine (no ledger, no
evidence guard). harnessed gives you the spawn-ready prompt; YOU spawn the subagent with a
CC-native Task / Agent tool (keeps the session responsive + lets clarification round-trips reach the user).

Do NOT pipe to `harnessed run retro` — that is the CI/headless path (in-process SDK spawn
that blocks the session inside Claude Code).

1. Bash: `harnessed prompt retro --task "$ARGUMENTS" --json` → parse `{prompt, max_iterations, model}`.
2. Spawn a CC-native subagent (Task / Agent tool) with that `prompt` + `model`, wrapped in the ralph-loop plugin: `/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`. If the plugin is absent, use the native goal gate instead (Claude Code 2.1.139+ / Codex): `/goal "this subtask is delivered: the subagent's final output contains verbatim <promise>COMPLETE</promise>; or stop after <max_iterations> turns"` then spawn the subagent and let the goal evaluator drive re-spawns until it clears. If `/goal` is unavailable too, self-loop: spawn → check output for `<promise>COMPLETE</promise>` → re-spawn with prior output appended (up to max_iterations). Set the goal only at the leaf subtask level — `/goal` is single-slot per session and a nested goal overwrites the outer one.
3. If the output contains `STATUS: NEEDS_CLARIFICATION` + a question list: STOP, relay them verbatim via AskUserQuestion, append the answers to the spec, then re-spawn the same sub.
4. On `<promise>COMPLETE</promise>`: Bash `harnessed checkpoint complete retro --summary "<one-line>"`. The evidence guard runs here (fail-CLOSED): if a declared `artifacts_expected` file is missing it exits non-zero — re-spawn to produce it before treating the sub as done.

<!-- harnessed-generated:v4.9.3 -->

## References

- D-04 NEW v3 standalone workflow (research v3 bump + retro NEW)
- Pattern A E.2 LOCK — 2 alias suffix `-gstack` 解决 namespace 冲突 (retro-gstack + investigate-gstack)
- Pattern A reconcile D.2 — gstack 30 optional naming bare 例外
- workflows/capabilities.yaml — retro-gstack (alias suffix) + planning-with-files
- workflows/defaults.yaml — ralph_max_iterations.retro.* values (W2.2 backfill)
- sister Phase v2.0-2.5 RETROSPECTIVE.md sink pattern
