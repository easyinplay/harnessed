---
name: ship-preflight
description: |
  Check that the repo is ready to tag a release: the changelog has unreleased entries, the version resolves, the tree is clean, and the tag does not exist yet. Run it before shipping; a failed check blocks the release.
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
| `changelog` | `## [Unreleased]` has entries, or a section exists for the valid target version |
| `version` | A static valid SemVer is discovered, or supplied with `--release-version <semver>` |
| `git-clean` | the working tree has no uncommitted changes |
| `tag-absent` | a `v<version>` tag does NOT already exist |

Version sources are `package.json.version`, `pyproject.toml [project].version`,
`pyproject.toml [tool.poetry].version`, and `Cargo.toml [package].version`.
`harnessed release-preflight --release-version <semver>` takes highest priority;
an invalid explicit value fails without falling back to manifests. Matching discovered
versions are accepted. Conflicting valid versions fail closed and require an explicit
override. No target version is inferred from git tags. Missing, dynamic,
workspace-inherited or malformed versions cannot supply a static target. If no valid
target can be determined, `version` fails and `tag-absent` is warn/not-run, never a check
against the literal tag `v`. Version-specific CHANGELOG sections are checked only for
a valid target; `[Unreleased]` remains independent. Root `harnessed --version` still
prints the harnessed CLI version, not the target release version.

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
{{ host.native }} {{ host.spawn_subagent }} (keeps the session responsive + lets clarification round-trips reach the user).

Do NOT pipe to `harnessed run ship-preflight` — that is the CI/headless path ({{ host.harnessed_run_warning_note.execution_tail }}

1. Bash: `harnessed prompt ship-preflight --task "$ARGUMENTS" --json` → parse `{prompt, max_iterations, model, result_file}`.
2. Spawn a {{ host.native }} subagent ({{ host.spawn_subagent }}) with that `prompt` and `model`. The sub writes its own final result into `result_file` — the path that prompt names — so the FILE is the completion signal: do NOT wait for the sub's chat message, because a background or re-parented agent's message may never arrive. Then drive delivery with harnessed's own completion gate:
   - the gate is `harnessed checkpoint complete ship-preflight --result-file <result_file> --wait 60` — one call waits at most 60 seconds, so run the SAME command again when the sub needs longer; it is fail-closed on the declared artifacts, the TDD boundary, and the verbatim `<promise>COMPLETE</promise>`.
   - if it blocks, run `harnessed checkpoint fail ship-preflight --failing-tests <n>` to record the attempt; it prints BUDGET-EXHAUSTED / NO-PROGRESS / BREAK-LOOP when a stop condition is reached.
   - respawn ONLY while none of those three has fired. Any one of them means stop: re-scope the subtask, fix the blocker, or escalate to the user. Never respawn past a stop directive.
3. If the sub’s output contains `STATUS: NEEDS_CLARIFICATION` + a question list (read it from `result_file` — the chat message may never arrive): STOP, relay them verbatim via {{ host.ask_user }}, append the answers to the spec, then re-spawn the same sub.
4. When `result_file` carries the completion marker: Bash `harnessed checkpoint complete ship-preflight --result-file <result_file> --wait 60 --summary "<one-line>"`. Fail-CLOSED — it blocks unless every declared `artifacts_expected` file exists, the TDD boundary passes (non-empty evidence / both the red and green sides present / the test file was not deleted), and the result file carries a verbatim `<promise>COMPLETE</promise>` (or a structured COMPLETE status). `--wait 60` bounds ONE call to 60 seconds — run the SAME command again when the sub needs longer, never an unbounded wait. `--result <text>` is the inline variant; `--result-file` wins and is quoting-safe on Windows. A `result-wait-timeout` exit means the sub has not signalled YET — repeat the same command; `--force` records an audited override (`evidence_status=overridden`) — it does not silently pass.
5. If the complete gate blocked: Bash `harnessed checkpoint fail ship-preflight --failing-tests <n>` to record the attempt. It prints `BUDGET-EXHAUSTED` / `NO-PROGRESS` / `BREAK-LOOP` once a stop condition is reached. Respawn ONLY while none of those three has fired; any one of them means STOP — re-scope the subtask, fix the blocker, or escalate to the user.

<!-- harnessed-generated:v4.13.0 -->
