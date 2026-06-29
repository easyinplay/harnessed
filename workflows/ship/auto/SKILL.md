---
name: ship
description: |
  Stage ⑤ Ship master orchestrator — the release stage after Verify. ship-preflight
  必跑串行 (release-readiness gate) → 委派 PR/deploy 给 gstack /ship → publish 留
  publish.yml CI (tag push 触发)。schema_version: harnessed.workflow.v3 with delegates_to
  (1 sub: preflight serial order 1) + disciplines_applied (6 default) + tools_available
  (release-preflight + ship + planning-with-files)。Triggered by `/ship` (bare per ADR 0030)
  or `harnessed ship` after `harnessed verify`. Deploy boundary = TAG-READY (no push/publish/tag).
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

The numbered sequence below **is** the state machine — execute it step by step with Bash.
Do NOT improvise an equivalent flow from the Overview above: freelancing bypasses the engine
(no per-sub ledger, no evidence guard, no recovery). harnessed is the orchestration brain
(`harnessed gates` says which subs fire, `harnessed prompt` gives each spawn-ready prompt,
`harnessed checkpoint` records the ledger); YOU spawn with CC-native Task / Agent tools.

Do NOT pipe to `harnessed run ship` — that is the CI/headless path (in-process SDK spawn
that blocks the session, bypasses Agent Teams, and hangs inside Claude Code).

1. If the clarification criteria fire for "$ARGUMENTS" (≥2 approaches / core algorithm / API contract / high error cost), clarify interactively in THIS session first (AskUserQuestion) and lock decisions; otherwise transparent-skip. Produce a locked spec.
2. Bash: `harnessed gates ship --task "<locked spec>" --skip-sub clarify` → parse the JSON `{fire, skip, parallelism}`. This is the plan SoT (no spawn). Keep the verbatim JSON.
3. Bash: `harnessed checkpoint start ship --plan '<the verbatim gates JSON from step 2>'` → seeds the per-sub ledger so `harnessed status --recover` can re-orient you after compaction.
4. If `parallelism.escalate_to_teams === true`: read `~/.claude/rules/agent-teams.md`, then drive the fired subs as an Agent Team (`TeamCreate` → `Agent(name, team_name, …)` per sub with its `harnessed prompt <sub>` prompt → coordinate via `SendMessage` → `SendMessage shutdown_request` + `TeamDelete`). Still checkpoint each sub (`complete` / `fail`) as below.
5. Otherwise, for each fired sub in `order` (serial subs sequentially, parallel subs concurrently):
   - **If the entry has `is_master: true`** (a stage master — e.g. `/auto` firing `plan`/`task`/`verify`): do NOT prompt+spawn it. RECURSE: run that master’s own `harnessed gates <sub> --task "<spec>" --skip-sub clarify` → `harnessed checkpoint start <sub> --plan '<json>'` → repeat this loop for ITS fired subs.
   - **Else (leaf sub):**
     a. Bash: `harnessed prompt <sub> --task "<spec>" --json` → parse `{prompt, max_iterations, model}`.
     b. Spawn a CC-native subagent (Task / Agent tool) with that `prompt` + `model`, wrapped in the ralph-loop plugin: `/ralph-loop "<prompt>" --max-iterations <max_iterations> --completion-promise "COMPLETE"`. If the plugin is absent, self-loop: spawn → check output for `<promise>COMPLETE</promise>` → re-spawn with prior output appended (up to max_iterations).
     c. If the output contains `STATUS: NEEDS_CLARIFICATION` + questions: STOP, relay them verbatim via AskUserQuestion, append the answers to the spec, then re-spawn the same sub.
     d. On `<promise>COMPLETE</promise>`: Bash `harnessed checkpoint complete <sub> --summary "<one-line>"`. The evidence guard runs here (fail-CLOSED): if a declared `artifacts_expected` file is missing it exits non-zero — re-spawn to produce it, or pass `--force` only to deliberately override.
     e. If the sub cannot reach COMPLETE (max_iterations exhausted / unrecoverable error): Bash `harnessed checkpoint fail <sub> --summary "<why>"`, then STOP and report to the user.
6. After all fired subs are `done` (or recorded `failed`), Bash `harnessed status --recover` to confirm the ledger and report a per-sub fired/skipped/done/failed summary to the user.

**If you lose context (compaction / resume):** run `harnessed status --recover` first — it reads the ledger and prints "you are here, this is next" so you resume at the first `pending` sub instead of restarting. If the ledger is empty, re-run steps 2-3.

<!-- harnessed-generated:v4.9.3 -->
