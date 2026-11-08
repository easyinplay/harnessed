---
name: ship
description: |
  Run the release stage after verification: check release readiness, then hand the PR and deploy to gstack /ship; the tag push triggers the publish CI. Use it when the work is verified and ready to ship.
trigger_phrases:
  - "ship"
  - "发布阶段"
  - "stage 5 ship"
  - "release stage"
  - "send it"
---

# ship master orchestrator (v3) — Stage ⑤

## Overview

The 5th stage, after Verify. harnessed has the pieces (a release-preflight gate, gstack
`/ship`, `publish.yml` CI) — this master orchestrates them into one repeatable release path,
the way comet (archive), Trellis (finish-work), and Claude-Harness (`/harness-release`) each
close their loop.

| order/mode | sub | when fires |
| ---------- | --- | ---------- |
| 1 (serial) | `preflight` | always when stage=='ship' — read-only release-readiness gate |

After preflight passes, the master delegates PR + deploy to gstack `/ship` (composition —
harnessed does not reimplement it), and the actual `npm publish` + GitHub release happen in
`publish.yml` CI on tag push.

## Process

1. **preflight (always)** — run `harnessed release-preflight`. If any check fails (most often
   an empty `## [Unreleased]`), STOP and document the release / clean the tree first.
2. **PR / deploy (delegate)** — invoke gstack `/ship` for PR creation + pre-land review.
3. **publish (CI)** — push the `v<version>` tag (with explicit user approval) → `publish.yml`
   runs `npm publish` + creates the GitHub release.

## Boundary (important)

This stage stops at **tag-ready**. It never pushes to the remote, never publishes to npm, and
never creates a git tag on its own. Those are CI + explicit-approval actions, by design —
"PR ready != release ready", and "release ready != already published".

## How to invoke

!`harnessed checkpoint intent ship`

> The banner above (when present) means this invocation is REGISTERED with the engine (an intent marker) — not yet compliant: steps 2-3 below seed the ledger, and a per-turn `<workflow-intent>` reminder persists until they run.

The numbered sequence below **is** the state machine — execute it step by step with Bash.
Do NOT improvise an equivalent flow from the Overview above: freelancing bypasses the engine
(no per-sub ledger, no evidence guard, no recovery). harnessed is the orchestration brain
(`harnessed gates` says which subs fire, `harnessed prompt` gives each spawn-ready prompt,
`harnessed checkpoint` records the ledger); YOU spawn with {{ host.native }} {{ host.spawn_subagent.plural }}.

Do NOT pipe to `harnessed run ship` — that is the CI/headless path ({{ host.harnessed_run_warning_note.orchestrator_tail }}

1. If the clarification criteria fire for "$ARGUMENTS" (≥2 approaches / core algorithm / API contract / high error cost), clarify interactively in THIS session first ({{ host.ask_user }}) and lock decisions; otherwise transparent-skip. Produce a locked spec.
1b. Bash: `harnessed facts ship --out .harnessed-facts.json` → it lists ONLY the facts this stage’s gates actually read: deterministic ones already filled (change size / files touched / stage, from git), judgement calls left `null` with a one-line hint of what to judge. Edit the file and replace each `null` in `facts` with your honest answer from the locked spec — leave one null only if you genuinely cannot judge it (it then falls back to the built-in default). Do NOT skip this step and do NOT invent facts the command did not ask for.
2. Bash: `harnessed gates ship --task "<locked spec>" --context-file .harnessed-facts.json --skip-sub discuss` → parse the JSON `{fire: [{sub, order, mode, is_master}], skip: [{sub, reason}], parallelism: {escalate_to_teams, teams_active, transport, result_contract, bounded_wait}}`. `escalate_to_teams: false` means the run cannot form a team — drive the fired subs as a plain subagent fan-out (parallel where `order` allows) instead. `teams_active` says whether a team is actually running, `transport` names the transport this plan uses, `result_contract` is `result-file` and `bounded_wait` is `true`: every sub signals completion through its result file, never through a chat message. This is the plan SoT (no spawn). Keep the verbatim JSON.
3. Bash: `harnessed checkpoint start ship --plan '<the verbatim gates JSON from step 2>'` → seeds the per-sub ledger so `harnessed status --recover` can re-orient you after compaction.
{{ host.teams_step_note.skill }}
5. Otherwise, for each fired sub in `order` (serial subs sequentially, parallel subs concurrently):
   - **If the entry has `is_master: true`** (a stage master — e.g. `/auto` firing `plan`/`task`/`verify`): do NOT prompt+spawn it. RECURSE: run that master’s own `harnessed facts <sub> --out .harnessed-facts.json` (fill the nulls) → `harnessed gates <sub> --task "<spec>" --context-file .harnessed-facts.json --skip-sub discuss` → `harnessed checkpoint start <sub> --plan '<json>'` → repeat this loop for ITS fired subs.
   - **Else (leaf sub):**
     a. Bash: `harnessed prompt <sub> --task "<spec>" --json` → parse `{prompt, max_iterations, model, result_file}`.
     b. Spawn a {{ host.native }} subagent ({{ host.spawn_subagent }}) with that `prompt` and `model`. The sub writes its own final result into `result_file` — the path that prompt names — so the FILE is the completion signal: do NOT wait for the sub's chat message, because a background or re-parented agent's message may never arrive. Then drive delivery with harnessed's own completion gate:
        - the gate is `harnessed checkpoint complete <sub> --result-file <result_file> --wait 60` — one call waits at most 60 seconds, so run the SAME command again when the sub needs longer; it is fail-closed on the declared artifacts, the TDD boundary, and the verbatim `<promise>COMPLETE</promise>`.
        - if it blocks, run `harnessed checkpoint fail <sub> --failing-tests <n>` to record the attempt; it prints BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP when a stop condition is reached.
        - respawn ONLY while none of those three has fired. Any one of them means stop: re-scope the subtask, fix the blocker, or escalate to the user. Never respawn past a stop directive.
     c. If the sub’s output contains `STATUS: NEEDS_CLARIFICATION` + questions (read it from `result_file` — the chat message may never arrive): STOP, relay them verbatim via {{ host.ask_user }}, append the answers to the spec, then re-spawn the same sub.
     d. When `result_file` carries the completion marker: Bash `harnessed checkpoint complete <sub> --result-file <result_file> --wait 60 --summary "<one-line>"`. The evidence guard runs here (fail-CLOSED) and blocks unless every declared `artifacts_expected` file exists, the TDD boundary passes (non-empty evidence / both the red and green sides present / the test file was not deleted), and the result file carries a verbatim `<promise>COMPLETE</promise>` (or a structured COMPLETE status). `--wait 60` bounds ONE call to 60 seconds — run the SAME command again when the sub needs longer, never an unbounded wait. `--result <text>` is the inline variant; `--result-file` wins and is quoting-safe on Windows. A `result-wait-timeout` exit means the sub has not signalled YET — repeat the same command; on any other non-zero exit the sub is NOT done — re-spawn to close the gap, or pass `--force` only to deliberately override (records `evidence_status=overridden`, an audited override rather than a silent pass).
     e. If the complete gate blocked: Bash `harnessed checkpoint fail <sub> --failing-tests <n>` to record the attempt (omit the flag when the sub has no tests — the evidence-artifact digest is the fallback progress metric). It prints `BUDGET-EXHAUSTED` (attempts spent vs `workflows/defaults.yaml ralph_max_iterations`), `NO-PROGRESS` (no improvement for N consecutive attempts) or `BREAK-LOOP` (this sub failed >= the threshold) once a stop condition is reached. Respawn ONLY while none of those three has fired; any one of them means STOP — re-scope, fix the blocker, or escalate to the user, and report it.
6. After all fired subs are `done` (or recorded `failed`), Bash `harnessed status --recover` to confirm the ledger and report a per-sub fired/skipped/done/failed summary to the user.

**If you lose context (compaction / resume):** run `harnessed status --recover` first — it reads the ledger and prints "you are here, this is next" so you resume at the first `pending` sub instead of restarting. If the ledger is empty, re-run steps 2-3.

<!-- harnessed-generated:v4.13.0 -->
