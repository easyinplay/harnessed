---
name: task
description: |
  Stage ③ Task master orchestrator — 串行 invoke 4 sub per subtask (clarify → code → test → deliver)。
  ralph-loop COMPLETE wrapper 在 deliver phase 内 (D-10 orthogonal wrapper)。tdd-gate conditional
  fire on test sub。schema_version: harnessed.workflow.v3 with delegates_to (4 sub: clarify order 1
  conditional + code order 2 + test order 3 conditional + deliver order 4) + disciplines_applied
  (6 default) + tools_available (8 entry: superpowers-brainstorming + tdd + grill-with-docs +
  improve-codebase-architecture + diagnose + ralph-loop + planning-with-files)。
  Triggered by slash command `/task`
  (bare per ADR 0030 namespace policy D-02 LOCK) after `harnessed setup`.
trigger_phrases:
  - "task"
  - "子任务执行"
  - "stage 3 execute"
  - "ralph loop"
  - "执行子任务"
---

# task master orchestrator (v3)

## Overview

4-stage cadence Stage ③ master orchestrator delegating to 4 sequential sub-workflows
per subtask (bundled Execute-stage cadence + karpathy 心法 always-on):

| order | sub | gate ref | mode | when fires |
| ----- | --- | -------- | ---- | ---------- |
| 1 | `clarify` | `judgments.subtask-gate.brainstorming.fires` | serial | approaches ≥ 2 / core_algorithm / has_api_contract / error_cost=high |
| 2 | `code` | (unconditional — karpathy 心法 always-on + mattpocock conditional route) | serial | always |
| 3 | `test` | `judgments.tdd-gate.tdd-strongly-suggested.fires` | serial | 核心业务 / 算法 / 数据处理 / 回归 risk / reliability (6 fires_when OR-chain) |
| 4 | `deliver` | (unconditional — ralph-loop COMPLETE wrapper) | serial | always |

Engine runtime spawns 4 sub-workflow phases sequentially via `runMasterOrchestrator`
per T3.5.W0.1 — clarify → code → test → deliver。K9 invariant enforced: every serial
mode delegate carries explicit `order`。Each subtask 入口走一次此 master orchestrator。

## ralph-loop orthogonal wrapper (D-10)

ralph-loop 是正交 wrapper, 套在 deliver sub 的 01-deliver phase 外层保 completion-promise
verbatim "COMPLETE" (R20.10)。任何执行单元 (subagent / team / 主 session) 都可外层套 ralph-loop
保 completion-promise (bundled subagent vs Agent Teams routing — orthogonal wrapper rule).

## Capability refs

Sister `workflows/capabilities.yaml`:
- `superpowers-brainstorming` — Bucket 4 核心 capability (sub clarify upstream)
- `tdd` — Bucket 4 核心 capability TDD red-green-refactor (sub test upstream)
- `grill-with-docs` — Bucket 1 mattpocock conditional invoke (clarify)
- `improve-codebase-architecture` — Bucket 1 mattpocock conditional invoke (code, architecture_health_audit)
- `diagnose` — Bucket 1 mattpocock conditional invoke (code/test, bug_root_cause_unknown / test_fail)
- `ralph-loop` — Bucket 4 核心 capability orthogonal wrapper (deliver)
- `planning-with-files` — Bucket 4 核心 capability (code + deliver progress.md update)

## Invocation

- Slash command: `/task <text>` (bare per ADR 0030 namespace policy D-02 LOCK after `harnessed setup`)

## How to invoke

!`harnessed checkpoint intent task`

> The banner above (when present) means this invocation is REGISTERED with the engine (an intent marker) — not yet compliant: steps 2-3 below seed the ledger, and a per-turn `<workflow-intent>` reminder persists until they run.

The numbered sequence below **is** the state machine — execute it step by step with Bash.
Do NOT improvise an equivalent flow from the Overview above: freelancing bypasses the engine
(no per-sub ledger, no evidence guard, no recovery). harnessed is the orchestration brain
(`harnessed gates` says which subs fire, `harnessed prompt` gives each spawn-ready prompt,
`harnessed checkpoint` records the ledger); YOU spawn with CC-native Task / Agent tools.

Do NOT pipe to `harnessed run task` — that is the CI/headless path (in-process SDK spawn
that blocks the session, bypasses Agent Teams, and hangs inside Claude Code).

1. If the clarification criteria fire for "$ARGUMENTS" (≥2 approaches / core algorithm / API contract / high error cost), clarify interactively in THIS session first (AskUserQuestion) and lock decisions; otherwise transparent-skip. Produce a locked spec.
2. Bash: `harnessed gates task --task "<locked spec>" --skip-sub clarify` → parse the JSON `{fire, skip, parallelism}`. This is the plan SoT (no spawn). Keep the verbatim JSON.
3. Bash: `harnessed checkpoint start task --plan '<the verbatim gates JSON from step 2>'` → seeds the per-sub ledger so `harnessed status --recover` can re-orient you after compaction.
4. If `parallelism.escalate_to_teams === true`: read `~/.claude/rules/agent-teams.md`, then drive the fired subs as an Agent Team (`TeamCreate` → `Agent(name, team_name, …)` per sub with its `harnessed prompt <sub>` prompt → coordinate via `SendMessage` → `SendMessage shutdown_request` + `TeamDelete`). Still checkpoint each sub (`complete` / `fail`) as below.
5. Otherwise, for each fired sub in `order` (serial subs sequentially, parallel subs concurrently):
   - **If the entry has `is_master: true`** (a stage master — e.g. `/auto` firing `plan`/`task`/`verify`): do NOT prompt+spawn it. RECURSE: run that master’s own `harnessed gates <sub> --task "<spec>" --skip-sub clarify` → `harnessed checkpoint start <sub> --plan '<json>'` → repeat this loop for ITS fired subs.
   - **Else (leaf sub):**
     a. Bash: `harnessed prompt <sub> --task "<spec>" --json` → parse `{prompt, max_iterations, model}`.
     b. Spawn a CC-native subagent (Task / Agent tool) with that `prompt` + `model`, wrapped in the ralph-loop plugin: `/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`. If the plugin is absent, use the native goal gate instead (Claude Code 2.1.139+ / Codex): `/goal "this subtask is delivered: the subagent's final output contains verbatim <promise>COMPLETE</promise>; or stop after <max_iterations> turns"` then spawn the subagent and let the goal evaluator drive re-spawns until it clears. If `/goal` is unavailable too, self-loop: spawn → check output for `<promise>COMPLETE</promise>` → re-spawn with prior output appended (up to max_iterations). Set the goal only at the leaf subtask level — `/goal` is single-slot per session and a nested goal overwrites the outer one.
     c. If the output contains `STATUS: NEEDS_CLARIFICATION` + questions: STOP, relay them verbatim via AskUserQuestion, append the answers to the spec, then re-spawn the same sub.
     d. On `<promise>COMPLETE</promise>`: Bash `harnessed checkpoint complete <sub> --summary "<one-line>"`. The evidence guard runs here (fail-CLOSED): if a declared `artifacts_expected` file is missing it exits non-zero — re-spawn to produce it, or pass `--force` only to deliberately override.
     e. If the sub cannot reach COMPLETE (max_iterations exhausted / unrecoverable error): Bash `harnessed checkpoint fail <sub> --summary "<why>"`, then STOP and report to the user.
6. After all fired subs are `done` (or recorded `failed`), Bash `harnessed status --recover` to confirm the ledger and report a per-sub fired/skipped/done/failed summary to the user.

**If you lose context (compaction / resume):** run `harnessed status --recover` first — it reads the ledger and prints "you are here, this is next" so you resume at the first `pending` sub instead of restarting. If the ledger is empty, re-run steps 2-3.

<!-- harnessed-generated:v4.9.3 -->

## References

- D-01 master orchestrator delegation pattern
- D-02 bare slash cmd convention (ADR 0030 namespace policy LOCK)
- D-10 ralph-loop orthogonal wrapper
- workflows/judgments/{subtask-gate,tdd-gate}.yaml — brainstorming + tdd-strongly-suggested triggers
- workflows/task/{clarify,code,test,deliver}/workflow.yaml — 4 sub-workflow Phase 3.4 SHIPPED
