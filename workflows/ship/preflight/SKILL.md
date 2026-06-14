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
