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
