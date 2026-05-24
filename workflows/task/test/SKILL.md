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

Use the Bash tool to run:

```bash
echo "$ARGUMENTS" | harnessed run task-test --task-stdin
```

If `$ARGUMENTS` is empty, run `harnessed run task-test` (no stdin pipe).

After completion, the Bash output prints a `Next:` hint on stderr suggesting the next stage. Decide whether to invoke based on conversation context — the hint is informational, not prescriptive.

<!-- harnessed-generated:v3.4.4 -->

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
