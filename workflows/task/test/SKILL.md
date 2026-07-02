---
name: task-test
description: |
  task-test workflow v3 — Stage ③.c 子任务测试 sub-workflow (superpowers TDD
  red-green-refactor 强制 + diagnose conditional invoke)。Single-phase composition:
  01-test (capability `superpowers:test-driven-development` + gate
  judgments.tdd-gate.tdd-strongly-suggested.fires + invokes_tools[{if: test_fail,
  tool: diagnose}])。Alias /tdd (mattpocock-skills) 可替代 superpowers TDD per D-13。
  schema_version: harnessed.workflow.v3 with disciplines_applied [6] + tools_available
  [tdd, diagnose]. Triggered by harnessed CLI `harnessed task-test --task <text>` or
  slash command `/task-test` after `harnessed setup`.
trigger_phrases:
  - "test this subtask"
  - "task-test workflow"
  - "Stage 3 test"
  - "TDD red-green-refactor"
  - "跑 task-test"
---

# task-test workflow (v3)

## Overview

Single-phase sub-workflow mapping the user's CLAUDE.md Stage ③.c 子任务测试 + TDD
强烈建议开启 discipline onto the harnessed runtime, fully `harnessed.workflow.v3`
schema (Phase v3.0-3.4 W0 T3.4.W0.8 — D-09 L0 Discipline Substrate + D-04 gate ref
+ D-05 conditional `invokes_tools` + D-13 tdd capability alias).

| phase | id | upstream | model | capability / invokes_tools | gate |
| ----- | -- | -------- | ----- | -------------------------- | ---- |
| 1 | `01-test` | superpowers | sonnet | `{{ capabilities.tdd.cmd }}` + `invokes_tools: [{if: test_fail == true, tool: diagnose}]` | `judgments.tdd-gate.tdd-strongly-suggested.fires` |

Per-phase config loads from `workflows/task/test/workflow.yaml`; engine.runRouting
spawns each phase as a sub-agent via `@anthropic-ai/claude-agent-sdk` 0.3.142+.

## TDD gate (D-04 + judgments/tdd-gate.yaml 6 fires_when + 3 skips_when)

Gate `judgments.tdd-gate.tdd-strongly-suggested.fires` 机器化 CLAUDE.md
「Execute 阶段」 TDD 强烈建议开启 节 6 OR-chain:
- `subtask.is_core_business_logic == true`
- `subtask.is_algorithm == true`
- `subtask.is_data_processing == true`
- `subtask.regression_risk == 'high'`
- `subtask.reliability_required == true`

Skips when (per tdd-gate.yaml skips_when):
- `subtask.type in ['crud', 'ui_polish', 'docs_only']`

Gate 4-level ref pre-resolved by `judgmentResolver` (T2.3.W0.4 SHIPPED) BEFORE
expr-eval evaluation — runtime engine 跳过 phase 当 gate 不 fire 时。

## D-13 tdd capability alias

Capability `tdd` (per capabilities.yaml L346-359) 主 impl `superpowers:test-driven-
development`, alias `[{impl: mattpocock-skills, cmd: /tdd}]` — 两者可替代 per D-13
LOCKED 决策。`{{ capabilities.tdd.cmd }}` 默认 resolve 至 superpowers
SDK, 用户 explicit signal 可切换 mattpocock /tdd alias path。

## Conditional diagnose invoke (D-05 invokes_tools)

Phase 01-test 条件性 fire `diagnose` (capabilities.yaml L55-64 mattpocock-skills
/diagnose) when `test_fail == true` — sister CLAUDE.md "系统化排错" pattern;
test fail 时进入 diagnose loop (reproduce → minimise → hypothesise → instrument →
fix → regression-test), 测试通过则 skip diagnose entirely。

## How to invoke

The numbered sequence below **is** the state machine — execute it with Bash. Do NOT improvise
an equivalent flow from the Overview above: freelancing bypasses the engine (no ledger, no
evidence guard). harnessed gives you the spawn-ready prompt; YOU spawn the subagent with a
CC-native Task / Agent tool (keeps the session responsive + lets clarification round-trips reach the user).

Do NOT pipe to `harnessed run task-test` — that is the CI/headless path (in-process SDK spawn
that blocks the session inside Claude Code).

1. Bash: `harnessed prompt task-test --task "$ARGUMENTS" --json` → parse `{prompt, max_iterations, model}`.
2. Spawn a CC-native subagent (Task / Agent tool) with that `prompt` + `model`, wrapped in the ralph-loop plugin: `/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`. If the plugin is absent, use the native goal gate instead (Claude Code 2.1.139+ / Codex): `/goal "this subtask is delivered: the subagent's final output contains verbatim <promise>COMPLETE</promise>; or stop after <max_iterations> turns"` then spawn the subagent and let the goal evaluator drive re-spawns until it clears. If `/goal` is unavailable too, self-loop: spawn → check output for `<promise>COMPLETE</promise>` → re-spawn with prior output appended (up to max_iterations). Set the goal only at the leaf subtask level — `/goal` is single-slot per session and a nested goal overwrites the outer one.
3. If the output contains `STATUS: NEEDS_CLARIFICATION` + a question list: STOP, relay them verbatim via AskUserQuestion, append the answers to the spec, then re-spawn the same sub.
4. On `<promise>COMPLETE</promise>`: Bash `harnessed checkpoint complete task-test --summary "<one-line>"`. The evidence guard runs here (fail-CLOSED): if a declared `artifacts_expected` file is missing it exits non-zero — re-spawn to produce it before treating the sub as done.

<!-- harnessed-generated:v4.9.3 -->

## References

- D-09 — L0 Discipline Substrate always-on
- D-04 — `gate` 4-level ref pre-resolved by `judgmentResolver`
- D-05 — phase-level `invokes_tools` conditional tool fire
- D-13 — tdd capability 2 impl 候选 alias (superpowers 主 + mattpocock /tdd 备)
- D-02 — SKILL.md `name:` bare slash cmd (`task-test` NOT `task/test`) per ADR 0030
- `workflows/judgments/tdd-gate.yaml` triggers.tdd-strongly-suggested
- `workflows/capabilities.yaml` — tdd (superpowers + mattpocock alias) + diagnose entries
- `workflows/defaults.yaml` — ralph_max_iterations.task-test.* values (T3.4.W2.2 followup)
- `docs/WORKFLOW.md` — 4-stage workflow mermaid + Stage ③ Execute 章节
