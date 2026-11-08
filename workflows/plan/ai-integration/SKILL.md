---
name: plan-ai-integration
description: "Optional: produce the GSD AI-SPEC contract before plan-phase when the phase builds an AI system."
trigger_phrases: ["plan ai integration", "gsd ai integration phase"]
---

# plan-ai-integration workflow

## Overview

Run `harnessed prompt plan-ai-integration --task "$ARGUMENTS" --json`, execute `/gsd-ai-integration-phase`, then complete the registered checkpoint with verifiable output.

## Invocation

Fires only when `phase.builds_ai_system == true`.

## How to invoke

!`harnessed checkpoint intent plan-ai-integration`

> The banner above (when present) means this invocation is REGISTERED with the engine (an intent marker) — not yet compliant: the steps below (prompt → spawn → checkpoint complete) resolve it, and a per-turn `<workflow-intent>` reminder persists until they run.

The numbered sequence below **is** the state machine — execute it with Bash. Do NOT improvise
an equivalent flow from the Overview above: freelancing bypasses the engine (no ledger, no
evidence guard). harnessed gives you the spawn-ready prompt; YOU spawn the subagent with a
{{ host.native }} {{ host.spawn_subagent }} (keeps the session responsive + lets clarification round-trips reach the user).

Do NOT pipe to `harnessed run plan-ai-integration` — that is the CI/headless path ({{ host.harnessed_run_warning_note.execution_tail }}

1. Bash: `harnessed prompt plan-ai-integration --task "$ARGUMENTS" --json` → parse `{prompt, max_iterations, model, result_file}`.
2. Spawn a {{ host.native }} subagent ({{ host.spawn_subagent }}) with that `prompt` and `model`. The sub writes its own final result into `result_file` — the path that prompt names — so the FILE is the completion signal: do NOT wait for the sub's chat message, because a background or re-parented agent's message may never arrive. Then drive delivery with harnessed's own completion gate:
   - the gate is `harnessed checkpoint complete plan-ai-integration --result-file <result_file> --wait 60` — one call waits at most 60 seconds, so run the SAME command again when the sub needs longer; it is fail-closed on the declared artifacts, the TDD boundary, and the verbatim `<promise>COMPLETE</promise>`.
   - if it blocks, run `harnessed checkpoint fail plan-ai-integration --failing-tests <n>` to record the attempt; it prints BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP when a stop condition is reached.
   - respawn ONLY while none of those three has fired. Any one of them means stop: re-scope the subtask, fix the blocker, or escalate to the user. Never respawn past a stop directive.
3. If the sub’s output contains `STATUS: NEEDS_CLARIFICATION` + a question list (read it from `result_file` — the chat message may never arrive): STOP, relay them verbatim via {{ host.ask_user }}, append the answers to the spec, then re-spawn the same sub.
4. When `result_file` carries the completion marker: Bash `harnessed checkpoint complete plan-ai-integration --result-file <result_file> --wait 60 --summary "<one-line>"`. Fail-CLOSED — it blocks unless every declared `artifacts_expected` file exists, the TDD boundary passes (non-empty evidence / both the red and green sides present / the test file was not deleted), and the result file carries a verbatim `<promise>COMPLETE</promise>` (or a structured COMPLETE status). `--wait 60` bounds ONE call to 60 seconds — run the SAME command again when the sub needs longer, never an unbounded wait. `--result <text>` is the inline variant; `--result-file` wins and is quoting-safe on Windows. A `result-wait-timeout` exit means the sub has not signalled YET — repeat the same command; `--force` records an audited override (`evidence_status=overridden`) — it does not silently pass.
5. If the complete gate blocked: Bash `harnessed checkpoint fail plan-ai-integration --failing-tests <n>` to record the attempt. It prints `BUDGET-EXHAUSTED` / `NO-PROGRESS` / `BREAK-LOOP` once a stop condition is reached. Respawn ONLY while none of those three has fired; any one of them means STOP — re-scope the subtask, fix the blocker, or escalate to the user.

<!-- harnessed-generated:v4.13.0 -->
