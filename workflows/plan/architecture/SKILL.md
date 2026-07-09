---
name: plan-architecture
description: |
  Stage ②.a 架构层 plan sub-workflow — gstack /plan-eng-review (复杂架构强制治理关卡;
  bundled plan-stage cadence: mandatory before complex-architecture phases)。schema_version:
  harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  [plan-eng-review] + 1 phase (01-plan-eng-review) + gate literal expr
  `phase.is_complex_architecture == true`。Triggered by harnessed CLI `harnessed
  plan-architecture --module <name>` or slash command `/plan-architecture` after
  `harnessed setup`.
trigger_phrases:
  - "plan architecture"
  - "架构审查"
  - "plan eng review"
  - "复杂架构"
  - "跑 plan-architecture"
---

# plan-architecture workflow (v3)

## Overview

1-phase sub-workflow mapping CLAUDE.md "⚠️ 复杂架构前 — plan-eng-review" onto harnessed
runtime (Phase v3.0-3.4 W0.4 — D-04 Stage ② Plan 二层 + D-12 gstack 治理关卡 + Pattern A
sub-workflow ship)。

| phase | id | upstream | model | capability | gate |
| ----- | -- | -------- | ----- | ---------- | ---- |
| 1 | `01-plan-eng-review` | gstack | opus | `{{ capabilities.plan-eng-review.cmd }}` | `gate: phase.is_complex_architecture == true` (literal expr) |

## Capability refs

Sister `workflows/capabilities.yaml` entries:
- `plan-eng-review` — Bucket 7 gstack 33 optional (impl: gstack, cmd: /plan-eng-review)
  - Pattern A E.2 LOCK: no `gstack-` prefix per CLAUDE.md gstack skill routing convention

## Gate ref

Inline literal expr `phase.is_complex_architecture == true` — sister capability
`fires_when` clause verbatim。W2.2 backfill 可加 `judgments/phase-gate.yaml`
trigger `is-complex-architecture` 重构 ref。

## Invocation

- Slash command: `/plan-architecture <name>` (after `harnessed setup`)

## Routing rules

触发条件 (sister CLAUDE.md "⚠️ 复杂架构前"):
- 涉及多模块跨界设计 (≥3 模块协同)
- 新引入核心抽象 (新 framework / 新数据模型 / 新协议)
- 性能 / scaling 关键路径
- 引入显著技术债 / migration 风险

## How to invoke

!`harnessed checkpoint intent plan-architecture`

> The banner above (when present) means this invocation is REGISTERED with the engine (an intent marker) — not yet compliant: the steps below (prompt → spawn → checkpoint complete) resolve it, and a per-turn `<workflow-intent>` reminder persists until they run.

The numbered sequence below **is** the state machine — execute it with Bash. Do NOT improvise
an equivalent flow from the Overview above: freelancing bypasses the engine (no ledger, no
evidence guard). harnessed gives you the spawn-ready prompt; YOU spawn the subagent with a
CC-native Task / Agent tool (keeps the session responsive + lets clarification round-trips reach the user).

Do NOT pipe to `harnessed run plan-architecture` — that is the CI/headless path (in-process SDK spawn
that blocks the session inside Claude Code).

1. Bash: `harnessed prompt plan-architecture --task "$ARGUMENTS" --json` → parse `{prompt, max_iterations, model}`.
2. Spawn a CC-native subagent (Task / Agent tool) with that `prompt` + `model`, wrapped in the ralph-loop plugin: `/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`. If the plugin is absent, use the native goal gate instead (Claude Code 2.1.139+ / Codex): `/goal "this subtask is delivered: the subagent's final output contains verbatim <promise>COMPLETE</promise>; or stop after <max_iterations> turns"` then spawn the subagent and let the goal evaluator drive re-spawns until it clears. If `/goal` is unavailable too, self-loop: spawn → check output for `<promise>COMPLETE</promise>` → re-spawn with prior output appended (up to max_iterations). Set the goal only at the leaf subtask level — `/goal` is single-slot per session and a nested goal overwrites the outer one.
3. If the output contains `STATUS: NEEDS_CLARIFICATION` + a question list: STOP, relay them verbatim via AskUserQuestion, append the answers to the spec, then re-spawn the same sub.
4. On `<promise>COMPLETE</promise>`: Bash `harnessed checkpoint complete plan-architecture --summary "<one-line>"`. The evidence guard runs here (fail-CLOSED): if a declared `artifacts_expected` file is missing it exits non-zero — re-spawn to produce it before treating the sub as done.

<!-- harnessed-generated:v4.9.3 -->

## References

- D-04 Stage ② Plan 二层 (架构 / 计划)
- D-12 gstack 治理关卡 (复杂架构强制)
- workflows/capabilities.yaml — plan-eng-review (Bucket 7)
- workflows/defaults.yaml — ralph_max_iterations.plan-architecture.* values (W2.2 backfill)
