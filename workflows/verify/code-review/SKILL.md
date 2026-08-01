---
name: verify-code-review
description: |
  Stage ④.b verify sub-workflow — code-review 多 agent 并行 fan-out 高置信度 finding
  (subagent default per bundled parallelism gate — Task / Agent 工具 spawn
  多 subagent fan-out, context 隔离, token 敏感)。
  schema_version: harnessed.workflow.v3 with disciplines_applied (6 default) + tools_available
  (code-review) + 1 phase (parallelism ref judgments.parallelism-gate.subagent-default.fires)。
  Triggered by slash command
  `/verify-code-review` after `harnessed setup`.
trigger_phrases:
  - "verify code review"
  - "代码审查"
  - "multi-agent code review"
  - "并行 review"
  - "跑 verify-code-review"
---

# verify-code-review workflow (v3)

## Overview

1-phase sub-workflow mapping CLAUDE.md "Verify 阶段 — code-review 多 agent 并行" 章节
onto harnessed runtime (Phase v3.0-3.4 W0.11 — D-04 Stage ④ Verify 7 sub + 子任务并行
机制 subagent default routing 机器化 + Pattern A sub-workflow ship)。

| phase | id | upstream | model | capability | parallelism |
| ----- | -- | -------- | ----- | ---------- | ----------- |
| 1 | `01-code-review` | mattpocock-skills | sonnet | `{{ capabilities.code-review.cmd }}` | `judgments.parallelism-gate.subagent-default.fires` |

Per-phase config loads from `workflows/verify/code-review/workflow.yaml`; engine spawns
multiple subagent in parallel fan-out (bundled subagent-default rule — Task / Agent
工具 spawn 多任务并发, context 隔离, summary 折叠回主 context)。

## Capability refs

Sister `workflows/capabilities.yaml` entries:
- `code-review` — Bucket 1 mattpocock 高频招式 (impl: mattpocock-skills, cmd: /code-review)

## Parallelism gate ref

Sister `workflows/judgments/parallelism-gate.yaml`:
- `subagent-default.fires` — `subtask.parallel_count <= 3 and subtask.communication_needed == false`
  (默认 fan-out, focused 任务 research / verify / review 单文件 / 跑测试 / 抓 doc / 探索模块)

## Routing rules

总 fire 当 `phase.stage == 'verify'` 后必跑串行 (verify-progress) 之后并行 fan-out。无 skip
条件 — code-review 多 agent 是 verify-work 第 3 phase 默认 fan-out (sister CLAUDE.md verbatim)。

## How to invoke

!`harnessed checkpoint intent verify-code-review`

> The banner above (when present) means this invocation is REGISTERED with the engine (an intent marker) — not yet compliant: the steps below (prompt → spawn → checkpoint complete) resolve it, and a per-turn `<workflow-intent>` reminder persists until they run.

The numbered sequence below **is** the state machine — execute it with Bash. Do NOT improvise
an equivalent flow from the Overview above: freelancing bypasses the engine (no ledger, no
evidence guard). harnessed gives you the spawn-ready prompt; YOU spawn the subagent with a
CC-native Task / Agent tool (keeps the session responsive + lets clarification round-trips reach the user).

Do NOT pipe to `harnessed run verify-code-review` — that is the CI/headless path (in-process SDK spawn
that blocks the session inside Claude Code).

1. Bash: `harnessed prompt verify-code-review --task "$ARGUMENTS" --json` → parse `{prompt, max_iterations, model}`.
2. Spawn a CC-native subagent (Task / Agent tool) with that `prompt` and `model`, then drive delivery with harnessed's own completion gate:
   - on return, write the subagent's final output to a file and run `harnessed checkpoint complete verify-code-review --result-file <path>` — it is fail-closed on the declared artifacts, the TDD boundary, and the verbatim `<promise>COMPLETE</promise>`.
   - if it blocks, run `harnessed checkpoint fail verify-code-review --failing-tests <n>` to record the attempt; it prints BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP when a stop condition is reached.
   - respawn ONLY while none of those three has fired. Any one of them means stop: re-scope the subtask, fix the blocker, or escalate to the user. Never respawn past a stop directive.
3. If the output contains `STATUS: NEEDS_CLARIFICATION` + a question list: STOP, relay them verbatim via AskUserQuestion, append the answers to the spec, then re-spawn the same sub.
4. On `<promise>COMPLETE</promise>`: write the subagent’s final output to a file, then Bash `harnessed checkpoint complete verify-code-review --result-file <path> --summary "<one-line>"`. Fail-CLOSED — it blocks unless every declared `artifacts_expected` file exists, the TDD boundary passes (non-empty evidence / both the red and green sides present / the test file was not deleted), and the result carries a verbatim `<promise>COMPLETE</promise>` (or a structured COMPLETE status). `--result <text>` is the inline variant; `--result-file` wins and is quoting-safe on Windows. `--force` records an audited override (`evidence_status=overridden`) — it does not silently pass.
5. If the complete gate blocked: Bash `harnessed checkpoint fail verify-code-review --failing-tests <n>` to record the attempt. It prints `BUDGET-EXHAUSTED` / `NO-PROGRESS` / `BREAK-LOOP` once a stop condition is reached. Respawn ONLY while none of those three has fired; any one of them means STOP — re-scope the subtask, fix the blocker, or escalate to the user.

<!-- harnessed-generated:v4.12.0 -->

## References

- D-04 Stage ④ Verify 7 sub 分解
- workflows/capabilities.yaml — code-review
- workflows/judgments/parallelism-gate.yaml — subagent-default.fires
- workflows/defaults.yaml — ralph_max_iterations.verify-code-review.* values (W2.2 backfill)
- workflows/verify-work/workflow.yaml v2 SHIPPED phase 03-code-review-parallel sister verbatim
