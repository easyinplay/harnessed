---
name: ship-preflight
description: |
  Stage ⑤.a Ship sub — release-preflight gate. Runs `harnessed release-preflight`
  (read-only: CHANGELOG [Unreleased] non-empty + version + git-clean + tag-absent).
  A failing gate blocks shipping. Nothing is pushed/published/tagged here.
trigger_phrases:
  - "release preflight"
  - "release ready"
  - "ship preflight"
  - "发布就绪检查"
---

# ship-preflight (Stage ⑤.a)

## Overview

The machine-checkable "PR ready != release ready" gate. Runs the harnessed-native
`harnessed release-preflight` command, which inspects (read-only) whether the repo is
ready to tag a release:

| check | passes when |
| ----- | ----------- |
| `changelog` | `## [Unreleased]` has entries (this release is documented) |
| `version` | `package.json` has a valid semver |
| `git-clean` | the working tree has no uncommitted changes |
| `tag-absent` | a `v<version>` tag does NOT already exist |

## Process

1. Run `harnessed release-preflight`.
2. If any check fails, STOP — surface the `fix:` hints and do not proceed to PR/tag.
   - Empty `[Unreleased]` is the most common failure: document the release first.
3. If all pass, the repo is **tag-ready**. The ship master continues to PR/deploy.

## Boundary

This gate is READ-ONLY. It never pushes, publishes, or creates a tag. The actual
`npm publish` + GitHub release happen in `publish.yml` CI when a `v<version>` tag is
pushed (with explicit user approval).

## How to invoke

!`harnessed checkpoint intent ship-preflight`

> The banner above (when present) means this invocation is REGISTERED with the engine (an intent marker) — not yet compliant: the steps below (prompt → spawn → checkpoint complete) resolve it, and a per-turn `<workflow-intent>` reminder persists until they run.

The numbered sequence below **is** the state machine — execute it with Bash. Do NOT improvise
an equivalent flow from the Overview above: freelancing bypasses the engine (no ledger, no
evidence guard). harnessed gives you the spawn-ready prompt; YOU spawn the subagent with a
CC-native Task / Agent tool (keeps the session responsive + lets clarification round-trips reach the user).

Do NOT pipe to `harnessed run ship-preflight` — that is the CI/headless path (in-process SDK spawn
that blocks the session inside Claude Code).

1. Bash: `harnessed prompt ship-preflight --task "$ARGUMENTS" --json` → parse `{prompt, max_iterations, model}`.
2. Spawn a CC-native subagent (Task / Agent tool) with that `prompt` and `model`, then drive delivery with harnessed's own completion gate:
   - on return, write the subagent's final output to a file and run `harnessed checkpoint complete ship-preflight --result-file <path>` — it is fail-closed on the declared artifacts, the TDD boundary, and the verbatim `<promise>COMPLETE</promise>`.
   - if it blocks, run `harnessed checkpoint fail ship-preflight --failing-tests <n>` to record the attempt; it prints BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP when a stop condition is reached.
   - respawn ONLY while none of those three has fired. Any one of them means stop: re-scope the subtask, fix the blocker, or escalate to the user. Never respawn past a stop directive.
3. If the output contains `STATUS: NEEDS_CLARIFICATION` + a question list: STOP, relay them verbatim via AskUserQuestion, append the answers to the spec, then re-spawn the same sub.
4. On `<promise>COMPLETE</promise>`: write the subagent’s final output to a file, then Bash `harnessed checkpoint complete ship-preflight --result-file <path> --summary "<one-line>"`. Fail-CLOSED — it blocks unless every declared `artifacts_expected` file exists, the TDD boundary passes (non-empty evidence / both the red and green sides present / the test file was not deleted), and the result carries a verbatim `<promise>COMPLETE</promise>` (or a structured COMPLETE status). `--result <text>` is the inline variant; `--result-file` wins and is quoting-safe on Windows. `--force` records an audited override (`evidence_status=overridden`) — it does not silently pass.
5. If the complete gate blocked: Bash `harnessed checkpoint fail ship-preflight --failing-tests <n>` to record the attempt. It prints `BUDGET-EXHAUSTED` / `NO-PROGRESS` / `BREAK-LOOP` once a stop condition is reached. Respawn ONLY while none of those three has fired; any one of them means STOP — re-scope the subtask, fix the blocker, or escalate to the user.

<!-- harnessed-generated:v4.12.0 -->
