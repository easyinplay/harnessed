---
name: task
description: |
  Stage ③ Task master orchestrator — 串行 invoke 4 sub per subtask (clarify → code → test → deliver)。
  completion gate (harnessed 自有 checkpoint CLI) 在 deliver phase 内 (D-10 orthogonal wrapper)。tdd-gate conditional
  fire on test sub。schema_version: harnessed.workflow.v3 with delegates_to (4 sub: clarify order 1
  conditional + code order 2 + test order 3 conditional + deliver order 4) + disciplines_applied
  (6 default) + tools_available (8 entry: superpowers-brainstorming + tdd + grill-with-docs +
  improve-codebase-architecture + diagnose + completion-gate + planning-with-files)。
  Triggered by slash command `/task`
  (bare per ADR 0030 namespace policy D-02 LOCK) after `harnessed setup`.
trigger_phrases:
  - "task"
  - "子任务执行"
  - "stage 3 execute"
  - "completion gate"
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
| 4 | `deliver` | (unconditional — completion gate COMPLETE wrapper) | serial | always |

Engine runtime spawns 4 sub-workflow phases sequentially via `runMasterOrchestrator`
per T3.5.W0.1 — clarify → code → test → deliver。K9 invariant enforced: every serial
mode delegate carries explicit `order`。Each subtask 入口走一次此 master orchestrator。

## completion gate orthogonal wrapper (D-10)

完成闸门是正交 wrapper, 套在 deliver sub 的 01-deliver phase 外层保 completion-promise
verbatim "COMPLETE" (R20.10)。任何执行单元 (subagent / team / 主 session) 都可外层套它
保 completion-promise (bundled subagent vs Agent Teams routing — orthogonal wrapper rule).

它是 harnessed 自有的 CLI,不是上游 plugin (ADR 0039,4.36.0 摘除 `/ralph-loop` 依赖):
`harnessed checkpoint complete <sub> --result-file <path>` 对产物 / TDD boundary / verbatim
`<promise>COMPLETE</promise>` 三重 fail-closed;被拦下时 `harnessed checkpoint fail <sub>
--failing-tests <n>` 记录尝试并在命中停机条件时打印 BUDGET-EXHAUSTED / NO-PROGRESS /
BREAK-LOOP。**仅当**三者都未触发才允许重 spawn;任一触发即停。

## Capability refs

Sister `workflows/capabilities.yaml`:
- `superpowers-brainstorming` — Bucket 4 核心 capability (sub clarify upstream)
- `tdd` — Bucket 4 核心 capability TDD red-green-refactor (sub test upstream)
- `grill-with-docs` — Bucket 1 mattpocock conditional invoke (clarify)
- `improve-codebase-architecture` — Bucket 1 mattpocock conditional invoke (code, architecture_health_audit)
- `diagnose` — Bucket 1 mattpocock conditional invoke (code/test, bug_root_cause_unknown / test_fail)
- `completion-gate` — Bucket 4 核心 capability orthogonal wrapper (deliver;harnessed 自有 `harnessed checkpoint complete` / `fail`,无上游 plugin)
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
1b. Bash: `harnessed facts task --out .harnessed-facts.json` → it lists ONLY the facts this stage’s gates actually read: deterministic ones already filled (change size / files touched / stage, from git), judgement calls left `null` with a one-line hint of what to judge. Edit the file and replace each `null` in `facts` with your honest answer from the locked spec — leave one null only if you genuinely cannot judge it (it then falls back to the built-in default). Do NOT skip this step and do NOT invent facts the command did not ask for.
2. Bash: `harnessed gates task --task "<locked spec>" --context-file .harnessed-facts.json --skip-sub discuss` → parse the JSON `{fire, skip, parallelism}`. This is the plan SoT (no spawn). Keep the verbatim JSON.
3. Bash: `harnessed checkpoint start task --plan '<the verbatim gates JSON from step 2>'` → seeds the per-sub ledger so `harnessed status --recover` can re-orient you after compaction.
4. If `parallelism.escalate_to_teams === true`: read `~/.claude/rules/agent-teams.md`, then drive the fired subs as an Agent Team. There is NO create step and no create tool — spawn one background teammate per fired sub with `Agent(name: <sub>, run_in_background: true, prompt: <that sub's `harnessed prompt <sub>` prompt>)` and the team forms implicitly on the FIRST spawn, with this session as lead (the `team_name` input is accepted but ignored — the name is session-derived). Coordinate via `SendMessage`; when a sub is finished, ask that teammate to shut down BY NAME (e.g. "ask the verify-qa teammate to shut down"). Still checkpoint each sub (`complete` / `fail`) as below.
5. Otherwise, for each fired sub in `order` (serial subs sequentially, parallel subs concurrently):
   - **If the entry has `is_master: true`** (a stage master — e.g. `/auto` firing `plan`/`task`/`verify`): do NOT prompt+spawn it. RECURSE: run that master’s own `harnessed facts <sub> --out .harnessed-facts.json` (fill the nulls) → `harnessed gates <sub> --task "<spec>" --context-file .harnessed-facts.json --skip-sub discuss` → `harnessed checkpoint start <sub> --plan '<json>'` → repeat this loop for ITS fired subs.
   - **Else (leaf sub):**
     a. Bash: `harnessed prompt <sub> --task "<spec>" --json` → parse `{prompt, max_iterations, model}`.
     b. Spawn a CC-native subagent (Task / Agent tool) with that `prompt` and `model`, then drive delivery with harnessed's own completion gate:
        - on return, write the subagent's final output to a file and run `harnessed checkpoint complete <sub> --result-file <path>` — it is fail-closed on the declared artifacts, the TDD boundary, and the verbatim `<promise>COMPLETE</promise>`.
        - if it blocks, run `harnessed checkpoint fail <sub> --failing-tests <n>` to record the attempt; it prints BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP when a stop condition is reached.
        - respawn ONLY while none of those three has fired. Any one of them means stop: re-scope the subtask, fix the blocker, or escalate to the user. Never respawn past a stop directive.
     c. If the output contains `STATUS: NEEDS_CLARIFICATION` + questions: STOP, relay them verbatim via AskUserQuestion, append the answers to the spec, then re-spawn the same sub.
     d. On `<promise>COMPLETE</promise>`: write the subagent’s final output to a file, then Bash `harnessed checkpoint complete <sub> --result-file <path> --summary "<one-line>"`. Fail-CLOSED — it blocks unless every declared `artifacts_expected` file exists, the TDD boundary passes (non-empty evidence / both the red and green sides present / the test file was not deleted), and the result carries a verbatim `<promise>COMPLETE</promise>` (or a structured COMPLETE status). `--result <text>` is the inline variant; `--result-file` wins and is quoting-safe on Windows. On a non-zero exit the sub is NOT done — re-spawn to close the gap, or pass `--force` only to deliberately override (records `evidence_status=overridden`, an audited override rather than a silent pass).
     e. If the complete gate blocked: Bash `harnessed checkpoint fail <sub> --failing-tests <n>` to record the attempt (omit the flag when the sub has no tests — the evidence-artifact digest is the fallback progress metric). It prints `BUDGET-EXHAUSTED` (attempts spent vs `workflows/defaults.yaml ralph_max_iterations`), `NO-PROGRESS` (no improvement for N consecutive attempts) or `BREAK-LOOP` (this sub failed >= the threshold) once a stop condition is reached. Respawn ONLY while none of those three has fired; any one of them means STOP — re-scope, fix the blocker, or escalate to the user, and report it.
6. After all fired subs are `done` (or recorded `failed`), Bash `harnessed status --recover` to confirm the ledger and report a per-sub fired/skipped/done/failed summary to the user.

**If you lose context (compaction / resume):** run `harnessed status --recover` first — it reads the ledger and prints "you are here, this is next" so you resume at the first `pending` sub instead of restarting. If the ledger is empty, re-run steps 2-3.

<!-- harnessed-generated:v4.12.0 -->

## References

- D-01 master orchestrator delegation pattern
- D-02 bare slash cmd convention (ADR 0030 namespace policy LOCK)
- D-10 completion gate orthogonal wrapper (ADR 0039 — 内置化后摘除上游 `/ralph-loop`)
- workflows/judgments/{subtask-gate,tdd-gate}.yaml — brainstorming + tdd-strongly-suggested triggers
- workflows/task/{clarify,code,test,deliver}/workflow.yaml — 4 sub-workflow Phase 3.4 SHIPPED
