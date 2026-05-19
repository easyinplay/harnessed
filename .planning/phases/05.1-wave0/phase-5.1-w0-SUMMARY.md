---
phase: "5.1"
plan: "w0"
wave: 0
subsystem: "planning-cadence + installer-refactor + adr-tagging"
tags: [d2-cadence, state-trim, size-limit, runargs-extract, err-extract, adr-tags, wave0]
dependency_graph:
  requires: [phase-4.3]
  provides: [phase-5.1-w1, phase-5.1-w2]
  affects:
    - .planning/STATE.md
    - .planning/RETROSPECTIVE.md
    - scripts/check-state-archive-stale.mjs
    - src/installers/lib/runClaudeArgs.ts
    - src/installers/lib/err.ts
    - src/installers/mcpStdioAdd.ts
    - src/installers/mcpHttpAdd.ts
    - src/installers/ccPluginMarketplace.ts
    - src/installers/ccHookAdd.ts
    - src/installers/gitCloneWithSetup.ts
    - src/installers/npmCli.ts
    - src/installers/npxSkillInstaller.ts
    - tests/scripts/check-state-archive-stale.test.ts
tech_stack:
  added: []
  patterns:
    - "Shared lib pattern: src/installers/lib/{runClaudeArgs,err}.ts extracted from 3+7 duplicate sites"
    - "D2 archive cadence iter 5 (TERMINUS): STATE.md trim → RETROSPECTIVE.md verbatim relocate"
    - "SIZE_LIMIT gate round 3 tighten: JS lines.length = file-lines + 1 (trailing newline); headroom = 15L above actual"
key_files:
  created:
    - src/installers/lib/runClaudeArgs.ts
    - src/installers/lib/err.ts
    - .planning/phases/05.1-wave0/phase-5.1-w0-SUMMARY.md
  modified:
    - .planning/STATE.md
    - .planning/RETROSPECTIVE.md
    - scripts/check-state-archive-stale.mjs
    - src/installers/mcpStdioAdd.ts
    - src/installers/mcpHttpAdd.ts
    - src/installers/ccPluginMarketplace.ts
    - src/installers/ccHookAdd.ts
    - src/installers/gitCloneWithSetup.ts
    - src/installers/npmCli.ts
    - src/installers/npxSkillInstaller.ts
    - tests/scripts/check-state-archive-stale.test.ts
decisions:
  - "T0.2: SIZE_LIMIT 175→165 (round 3 tighten); post-trim STATE=150L + 15L headroom; JS lines.length includes trailing newline so 150L file = length 151, limit set to 165 not 150"
  - "T0.4: Both adr-0019-accepted + adr-0020-accepted tag same commit e8ecb02 (both ADRs created in same Phase 4.3 cluster commit); LOCAL CREATE only per CLAUDE.md commit safety"
metrics:
  duration: "~45 minutes"
  completed: "2026-05-19"
  tasks_completed: 4
  tasks_total: 4
  files_changed: 13
---

# Phase 5.1 Wave 0 Summary

**One-liner:** D2 iter-5 terminus STATE trim + SIZE_LIMIT round-3 tighten 175→165 + runArgs/err shared-lib extraction from 10 installer duplicate sites + retroactive ADR 0019/0020 baseline tags at e8ecb02

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| T0.1 | STATE.md D2 iter 5 trim → RETROSPECTIVE | fb2ad82 | .planning/STATE.md, .planning/RETROSPECTIVE.md |
| T0.2 | Post-trim size verify + SIZE_LIMIT 175→165 | 3d6f5ba | scripts/check-state-archive-stale.mjs, tests/scripts/check-state-archive-stale.test.ts |
| T0.3 | runArgs + err() extract → lib/ + 7-installer absorb | bbf0566 | src/installers/lib/runClaudeArgs.ts (NEW), src/installers/lib/err.ts (NEW), 7 installer files |
| T0.4 | Retroactive LOCAL CREATE adr-0019-accepted + adr-0020-accepted tags | 8efddc0 | .planning/STATE.md (status update) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] SIZE_LIMIT=150 gate would fire on compliant 150L STATE.md**
- **Found during:** T0.2 — script uses `content.split(/\r?\n/).length` which counts trailing empty string from final newline; a 150-line file produces `lines.length = 151`
- **Fix:** Set SIZE_LIMIT=165 (15L headroom above 150L actual) instead of naively setting 150
- **Files modified:** scripts/check-state-archive-stale.mjs
- **Commit:** 3d6f5ba

**2. [Rule 1 - Bug] InstallContext unused import after err() extraction (7 files)**
- **Found during:** T0.3 biome preempt check
- **Issue:** Removing local `err()` left `InstallContext` type import unused in 7 installer files
- **Fix:** `biome check --write --unsafe` auto-removed unused type imports
- **Files modified:** All 7 installer files
- **Commit:** bbf0566

**3. [Rule 1 - Bug] ProcResult missing import in 3 files after runArgs extraction**
- **Found during:** T0.3 TypeScript compile check
- **Issue:** mcpStdioAdd, mcpHttpAdd, ccPluginMarketplace each use `new Promise<ProcResult>` in inline verify spawn block — reference broken after local interface removed
- **Fix:** Added `import type { ProcResult } from './lib/runClaudeArgs.js'` to each file; biome auto-sorted import order
- **Files modified:** mcpStdioAdd.ts, mcpHttpAdd.ts, ccPluginMarketplace.ts
- **Commit:** bbf0566

**4. [Rule 1 - Bug] Test expectation 250L > 175L stale after SIZE_LIMIT change**
- **Found during:** T0.2 test run
- **Issue:** `check-state-archive-stale.test.ts` test 2 expected `250L > 175L` string but script now emits `250L > 165L`
- **Fix:** Updated test description and assertion string to `165L`
- **Files modified:** tests/scripts/check-state-archive-stale.test.ts
- **Commit:** 3d6f5ba

## CI Gates Verified

| Gate | Result |
|------|--------|
| `tsc --noEmit` | PASS (clean) |
| `biome check src/installers/` | PASS — 17 files, no fixes applied |
| `vitest run check-state-archive-stale.test.ts` | PASS — 3/3 tests |

## Known Stubs

None — Wave 0 is cadence/refactor only; no new user-facing features introduced.

## Threat Flags

None — Wave 0 modifies planning docs and installer lib extraction only; no new network endpoints, auth paths, or schema changes at trust boundaries.

## Self-Check: PASSED

- [x] fb2ad82 exists: `docs(phase-5.1-w0): T0.1 — STATE.md D2 iter 5 trim`
- [x] 3d6f5ba exists: `docs(phase-5.1-w0): T0.2 — STATE size post-trim verify 150L + D-04 5-rule sentinel SIZE_LIMIT 175→165`
- [x] bbf0566 exists: `refactor(phase-5.1-w0): T0.3 — W0 sub-batch ABSORB #BF runArgs 3-installer + #BG err() 7-file extract`
- [x] 8efddc0 exists: `chore(phase-5.1-w0): T0.4 BLOCKER — retroactive LOCAL CREATE tags adr-0019-accepted + adr-0020-accepted`
- [x] src/installers/lib/runClaudeArgs.ts: EXISTS
- [x] src/installers/lib/err.ts: EXISTS
- [x] .planning/STATE.md: 150L (within 165L limit)
- [x] adr-0019-accepted tag: LOCAL at e8ecb02
- [x] adr-0020-accepted tag: LOCAL at e8ecb02
