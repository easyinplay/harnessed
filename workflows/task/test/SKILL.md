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
/diagnosing-bugs) when `test_fail == true` — sister CLAUDE.md "系统化排错" pattern;
test fail 时进入 diagnose loop (reproduce → minimise → hypothesise → instrument →
fix → regression-test), 测试通过则 skip diagnose entirely。

## Narrowing the test run with CodeGraph (opt-in, presence-conditional)

**Only when the project has a `.codegraph/` index AND `codegraph` is on PATH.** Both
missing-cases run the full suite exactly as before, **silently — no install nag** (same
standing contract as `workflows/task/code` CodeGraph navigation).

When both are present, derive the affected test files from the working-tree diff and run
those first (upstream's own CI/hook recipe):

```bash
AFFECTED=$(git diff --name-only HEAD | codegraph affected --stdin --quiet)
if [ -n "$AFFECTED" ]; then npx vitest run $AFFECTED; fi
```

`codegraph affected` traces import dependencies transitively (default depth 5) from the
changed source files to the test files that reach them. Do NOT re-index or `codegraph
sync` first: the index auto-syncs on every file change.

**An EMPTY affected list means "run the full suite" — never "run nothing".** Empty is
"the trace found no edge", not "there is nothing to verify": the diff may touch files the
graph does not model (config, fixtures, generated code), or the graph may simply be
behind. A narrowing heuristic that can silently run zero tests turns a green run into a
lie, so an empty list falls straight back to the full suite.

**The narrowed run is a fast first pass, not a substitute for the full suite.** Use it
inside the red-green inner loop for quick feedback. **The completion evidence for this sub
MUST come from a FULL-suite run** — the test log cited in `artifacts_expected` /
`tdd-evidence.md` and the run backing `<promise>COMPLETE</promise>` are the full-suite
result. Never mark this sub complete on a narrowed pass alone.

## How to invoke

!`harnessed checkpoint intent task-test`

> The banner above (when present) means this invocation is REGISTERED with the engine (an intent marker) — not yet compliant: the steps below (prompt → spawn → checkpoint complete) resolve it, and a per-turn `<workflow-intent>` reminder persists until they run.

The numbered sequence below **is** the state machine — execute it with Bash. Do NOT improvise
an equivalent flow from the Overview above: freelancing bypasses the engine (no ledger, no
evidence guard). harnessed gives you the spawn-ready prompt; YOU spawn the subagent with a
CC-native Task / Agent tool (keeps the session responsive + lets clarification round-trips reach the user).

Do NOT pipe to `harnessed run task-test` — that is the CI/headless path (in-process SDK spawn
that blocks the session inside Claude Code).

1. Bash: `harnessed prompt task-test --task "$ARGUMENTS" --json` → parse `{prompt, max_iterations, model}`.
2. Spawn a CC-native subagent (Task / Agent tool) with that `prompt` and `model`, then drive delivery with harnessed's own completion gate:
   - on return, write the subagent's final output to a file and run `harnessed checkpoint complete task-test --result-file <path>` — it is fail-closed on the declared artifacts, the TDD boundary, and the verbatim `<promise>COMPLETE</promise>`.
   - if it blocks, run `harnessed checkpoint fail task-test --failing-tests <n>` to record the attempt; it prints BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP when a stop condition is reached.
   - respawn ONLY while none of those three has fired. Any one of them means stop: re-scope the subtask, fix the blocker, or escalate to the user. Never respawn past a stop directive.
3. If the output contains `STATUS: NEEDS_CLARIFICATION` + a question list: STOP, relay them verbatim via AskUserQuestion, append the answers to the spec, then re-spawn the same sub.
4. On `<promise>COMPLETE</promise>`: write the subagent’s final output to a file, then Bash `harnessed checkpoint complete task-test --result-file <path> --summary "<one-line>"`. Fail-CLOSED — it blocks unless every declared `artifacts_expected` file exists, the TDD boundary passes (non-empty evidence / both the red and green sides present / the test file was not deleted), and the result carries a verbatim `<promise>COMPLETE</promise>` (or a structured COMPLETE status). `--result <text>` is the inline variant; `--result-file` wins and is quoting-safe on Windows. `--force` records an audited override (`evidence_status=overridden`) — it does not silently pass.
5. If the complete gate blocked: Bash `harnessed checkpoint fail task-test --failing-tests <n>` to record the attempt. It prints `BUDGET-EXHAUSTED` / `NO-PROGRESS` / `BREAK-LOOP` once a stop condition is reached. Respawn ONLY while none of those three has fired; any one of them means STOP — re-scope the subtask, fix the blocker, or escalate to the user.

<!-- harnessed-generated:v4.12.0 -->

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
