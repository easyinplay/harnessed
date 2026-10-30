---
name: harnessed-update
description: |
  Preview, confirm and execute a deterministic harnessed update. Report partial
  outcomes honestly; offer bounded agent repair only after a second confirmation.
trigger_phrases:
  - "harnessed update"
  - "update harnessed"
  - "更新 harnessed"
---

# harnessed-update

## Overview

One interactive entry point for deterministic self-update, harnessed-owned asset
refresh and reviewed updates of already-installed third-party components.
The CLI is the source of truth, not an agent's interpretation of installer logs.

## Process

1. Run `harnessed update --all --dry-run --json` for a read-only preview. Capture
   stdout, stderr and the exit code separately. Read exactly one JSON object from
   stdout even on nonzero exit; stderr contains diagnostics, not result data.
   Validate `schemaVersion=1`, `operation=update`, `mode`, `host` and `runtime`.
   Missing or malformed JSON, `error` or `failed` preview components mean STOP.
   A preview containing `unsupported` is still partial; show those limits.
2. Show the proposed changes and ask for explicit confirmation via
   {{ host.ask_user }}. Cancellation, silence or unavailable confirmation means
   STOP without mutation. A delegated subagent without approval must return
   `STATUS: NEEDS_CLARIFICATION` for the main session to ask the user.
3. Only after confirmation, run `harnessed update --all --json` exactly once.
   The CLI owns P1 self-update and verified absolute-path P2 continuation; do not
   launch continuation yourself or refresh assets from the replaced runtime.
4. Display `status`, `components`, `warnings` and `error`. For every component,
   show `id`, `status`, `before`, `target`, `after`, `reasonCode`, `verified` and
   `restartRequired`. Keep unknown versions as `null`, not inferred `current`.
5. `unsupported` and `retained` mean `partial`, never all-success. `unsupported`
   has no reviewed update path. `retained` means refresh failed but the previous
   installation still verifies; it was not updated. `not-installed` remains
   absent, not installed or updated. Preserve the CLI's top-level result.
6. Any `restartRequired=true` means STOP and ask the user to restart
   {{ host.native }} before further workflow work, even if the update completed.
    `handoff-failed`, `invalid-continuation`, `error` or nonzero exit means STOP.
    A failed or partial component is not success: preserve the result and
    diagnostics, then continue only to the bounded repair proposal in step 7.

7. If the applied result contains `failed`, `unsupported` or `retained`
   reviewed third-party components, show a second proposal before any repair.
   State that harnessed orchestrates upstream open-source components and that
   repair may read installation state, run upstream installers or verification
   commands, modify the listed skill/plugin/host targets, and invoke the
   selected host agent. State that it does not grant plugin or MCP trust, read
   credentials, expand the host root, or touch components outside the listed
   scope.
8. Ask for explicit confirmation bound to the exact component ids in the
   proposal. If confirmed, run exactly once:
   `harnessed update --all --repair --yes --json`.
   `--yes` is the explicit authorization for this bounded repair operation;
   it is not a general future permission. If declined, unavailable or
   non-interactive without `--yes`, do not invoke an agent and preserve the
   deterministic `partial` or `failed` result.
9. Treat `agentRepair.status=completed` as advisory only. The CLI must report
   `agentRepair.verified=true` after rerunning the deterministic verifier;
   otherwise report `verification-failed` or `failed`. Never rewrite the
   original component result or claim overall success from an agent response.

## Boundary

Phase 79 provides the bounded repair path. Do not start agent repair without the second explicit confirmation. Do not
install missing third parties, infer update commands from manifests, read
credentials, grant trust, rewrite ownership or switch host roots. The repair
runner is bounded to the exact reviewed component list and must finish with a
deterministic verifier pass.

These STOP rules override the generic invoke loop below: do not respawn or retry
the deterministic update, use `checkpoint --force` or claim COMPLETE after a
partial, failed or restart-blocked result. The only allowed next action for a
partial or failed result is the second-confirmation repair path in step 7;
otherwise report the evidence and return control to the user.
Only a verified `complete` result with no restart requirement can complete the
workflow; preview `planned` is not an applied update.

## How to invoke

!`harnessed checkpoint intent harnessed-update`

> The banner above (when present) means this invocation is REGISTERED with the engine (an intent marker) — not yet compliant: the steps below (prompt → spawn → checkpoint complete) resolve it, and a per-turn `<workflow-intent>` reminder persists until they run.

The numbered sequence below **is** the state machine — execute it with Bash. Do NOT improvise
an equivalent flow from the Overview above: freelancing bypasses the engine (no ledger, no
evidence guard). harnessed gives you the spawn-ready prompt; YOU spawn the subagent with a
{{ host.native }} {{ host.spawn_subagent }} (keeps the session responsive + lets clarification round-trips reach the user).

Do NOT pipe to `harnessed run harnessed-update` — that is the CI/headless path ({{ host.harnessed_run_warning_note.execution_tail }}

1. Bash: `harnessed prompt harnessed-update --task "$ARGUMENTS" --json` → parse `{prompt, max_iterations, model}`.
2. Spawn a {{ host.native }} subagent ({{ host.spawn_subagent }}) with that `prompt` and `model`, then drive delivery with harnessed's own completion gate:
   - on return, write the subagent's final output to a file and run `harnessed checkpoint complete harnessed-update --result-file <path>` — it is fail-closed on the declared artifacts, the TDD boundary, and the verbatim `<promise>COMPLETE</promise>`.
   - if it blocks, run `harnessed checkpoint fail harnessed-update --failing-tests <n>` to record the attempt; it prints BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP when a stop condition is reached.
   - respawn ONLY while none of those three has fired. Any one of them means stop: re-scope the subtask, fix the blocker, or escalate to the user. Never respawn past a stop directive.
3. If the output contains `STATUS: NEEDS_CLARIFICATION` + a question list: STOP, relay them verbatim via {{ host.ask_user }}, append the answers to the spec, then re-spawn the same sub.
4. On `<promise>COMPLETE</promise>`: write the subagent’s final output to a file, then Bash `harnessed checkpoint complete harnessed-update --result-file <path> --summary "<one-line>"`. Fail-CLOSED — it blocks unless every declared `artifacts_expected` file exists, the TDD boundary passes (non-empty evidence / both the red and green sides present / the test file was not deleted), and the result carries a verbatim `<promise>COMPLETE</promise>` (or a structured COMPLETE status). `--result <text>` is the inline variant; `--result-file` wins and is quoting-safe on Windows. `--force` records an audited override (`evidence_status=overridden`) — it does not silently pass.
5. If the complete gate blocked: Bash `harnessed checkpoint fail harnessed-update --failing-tests <n>` to record the attempt. It prints `BUDGET-EXHAUSTED` / `NO-PROGRESS` / `BREAK-LOOP` once a stop condition is reached. Respawn ONLY while none of those three has fired; any one of them means STOP — re-scope the subtask, fix the blocker, or escalate to the user.

<!-- harnessed-generated:v4.12.0 -->
