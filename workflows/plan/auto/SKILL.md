---
name: plan
description: |
  Stage ② Plan master orchestrator — 串行 invoke 2 sub (architecture conditional → phase always)。
  复杂架构 gstack /plan-eng-review 锁定架构后再 GSD /gsd-plan-phase + planning-with-files 持久化
  task_plan.md。schema_version: harnessed.workflow.v3 with delegates_to (2 sub: architecture
  serial order 1 + phase serial order 2) + disciplines_applied (6 default) + tools_available
  (planning-with-files + plan-eng-review + gsd-plan-phase)。
  Triggered by slash command `/plan`
  (bare per ADR 0030 namespace policy D-02 LOCK) after `harnessed setup`.
trigger_phrases:
  - "plan"
  - "计划阶段"
  - "stage 2 plan"
  - "持久化计划"
  - "task_plan"
---

# plan master orchestrator (v3)

## Overview

4-stage cadence Stage ② master orchestrator delegating to 2 sequential sub-workflows
(bundled Plan-stage cadence + D-06 planning-with-files cross-cutting tool):

| order | sub | gate ref | mode | when fires |
| ----- | --- | -------- | ---- | ---------- |
| 1 | `architecture` | `judgments.stage-routing.plan-architecture-delegate.fires` | serial | phase.is_complex_architecture == true |
| 2 | `phase` | (unconditional — plan-phase always fires when stage=='plan') | serial | always |

Engine runtime spawns 2 sub-workflow phases sequentially via `runMasterOrchestrator`
per T3.5.W0.1 — order 1 (architecture conditional) MUST complete before order 2
(phase unconditional, GSD plan-phase + planning-with-files /plan task_plan.md
持久化)。K9 invariant enforced: every serial mode delegate carries explicit `order`。

## Capability refs

Sister `workflows/capabilities.yaml`:
- `planning-with-files` — Bucket 4 核心 capability (impl: claude-code-plugin, cmd: /plan)
- `plan-eng-review` — Bucket 7 gstack 33 optional (impl: gstack, cmd: /plan-eng-review)
- `gsd-plan-phase` — Bucket 2 special-purpose (impl: gsd, cmd: /gsd-plan-phase)
- sub `architecture` upstream → `plan-eng-review`
- sub `phase` upstream → `gsd-plan-phase` + `planning-with-files`

## Routing rules (sister CLAUDE.md "Plan 阶段")

- **复杂架构必须先跑** `/plan-eng-review` 锁定架构后再进入 plan-phase (sister CLAUDE.md "⚠️")
- 普通 phase skip architecture sub (gate `phase.is_complex_architecture == false`)
- **禁止在规划阶段直接使用** `superpowers:writing-plans` 输出大文档 (除非用户明确要求)

## Invocation

- Slash command: `/plan <text>` (bare per ADR 0030 namespace policy D-02 LOCK after `harnessed setup`)

## How to invoke

!`harnessed checkpoint intent plan`

> The banner above (when present) means this invocation is REGISTERED with the engine (an intent marker) — not yet compliant: steps 2-3 below seed the ledger, and a per-turn `<workflow-intent>` reminder persists until they run.

The numbered sequence below **is** the state machine — execute it step by step with Bash.
Do NOT improvise an equivalent flow from the Overview above: freelancing bypasses the engine
(no per-sub ledger, no evidence guard, no recovery). harnessed is the orchestration brain
(`harnessed gates` says which subs fire, `harnessed prompt` gives each spawn-ready prompt,
`harnessed checkpoint` records the ledger); YOU spawn with CC-native Task / Agent tools.

Do NOT pipe to `harnessed run plan` — that is the CI/headless path (in-process SDK spawn
that blocks the session, bypasses Agent Teams, and hangs inside Claude Code).

1. If the clarification criteria fire for "$ARGUMENTS" (≥2 approaches / core algorithm / API contract / high error cost), clarify interactively in THIS session first (AskUserQuestion) and lock decisions; otherwise transparent-skip. Produce a locked spec.
1b. Bash: `harnessed facts plan --out .harnessed-facts.json` → it lists ONLY the facts this stage’s gates actually read: deterministic ones already filled (change size / files touched / stage, from git), judgement calls left `null` with a one-line hint of what to judge. Edit the file and replace each `null` in `facts` with your honest answer from the locked spec — leave one null only if you genuinely cannot judge it (it then falls back to the built-in default). Do NOT skip this step and do NOT invent facts the command did not ask for.
2. Bash: `harnessed gates plan --task "<locked spec>" --context-file .harnessed-facts.json --skip-sub discuss` → parse the JSON `{fire, skip, parallelism}`. This is the plan SoT (no spawn). Keep the verbatim JSON.
3. Bash: `harnessed checkpoint start plan --plan '<the verbatim gates JSON from step 2>'` → seeds the per-sub ledger so `harnessed status --recover` can re-orient you after compaction.
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
- D-06 planning-with-files cross-cutting tool (NOT 独立 sub-workflow)
- workflows/judgments/stage-routing.yaml — plan-{architecture,phase}-delegate triggers
- workflows/plan/{architecture,phase}/workflow.yaml — 2 sub-workflow Phase 3.4 SHIPPED
