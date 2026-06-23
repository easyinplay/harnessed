# Phase 26-01 SUMMARY — PlatformDescriptor seam (v9.0 Phase A)

> Executed 2026-06-24 via spawned `gsd-executor` (host overreach lesson — GSD slash fork fire-and-die). TDD red→green. Independently re-verified by main session (grep + full gate). Plan: `26-01-PLAN.md`. Design SoT: `v9.0-cross-harness-ARCHITECTURE.md` §3.

## Delivered

The `PlatformDescriptor` seam with **zero behavior change** — 3 files. `getHarnessedRoot()` now routes through `detectPlatform()`; the Claude-Code descriptor reproduces today's hardcoded paths byte-for-byte.

| File | Change |
|------|--------|
| `src/installers/lib/platform.ts` | NEW — `PlatformDescriptor` interface (8 fields: id/homeDir/stateRoot/settingsPath/skillsDir/commandsDir/pluginsRegistry/mcpConfigPath) + `claudeDescriptor()` + `detectPlatform()`. `mcpConfigPath = join(homedir(),'.claude.json')` (homedir SIBLING — the §7 D-A irregular field). |
| `src/installers/lib/harnessedRoot.ts` | MODIFIED — `getHarnessedRoot()` body = `return detectPlatform().stateRoot` (import at L41); local override check moved into `detectPlatform()` verbatim; doc-comment updated to note the seam. `harnessedSubdir`/`harnessedFile`/`migrateLegacyHarnessedRoot` untouched. |
| `tests/installers/platform.test.ts` | NEW — 5 tests. |

`detectPlatform()` has exactly two branches (Phase A scope): `HARNESSED_ROOT_OVERRIDE` set → `{...claudeDescriptor(), stateRoot: override}`; else → `claudeDescriptor()`. **NO auto-probe / NO `.agents/` fallback / NO `HARNESSED_PLATFORM`** — deferred to Phase 28 (anti-stale: no detection branches before the second platform exists).

## TDD RED→GREEN

- RED: `vitest run tests/installers/platform.test.ts` → `Cannot find module '.../platform.js'` (module absent).
- GREEN: after `platform.ts` + routing → `Tests 5 passed (5)`.

## Verification (main-session independent re-verify)

| Gate | Result |
|------|--------|
| platform.test.ts | 5 passed |
| **Full suite (regression proof)** | **1357 passed / 5 skipped / 1 todo (1363); 165 test files; 0 failed.** Baseline 1352 +5 = exactly the new cells → **every existing test UNCHANGED green = seam transparent.** |
| biome | `Checked 336 files. No fixes applied.` clean |
| tsc | `--noEmit` exit 0 |
| byte-identical `getHarnessedRoot` | default → `join(homedir(),'.claude','harnessed')`; override → verbatim (tests 4/5) |
| diff scope | Phase 26 = 3 files (`harnessedRoot.ts` M + `platform.ts`/`platform.test.ts` new). |

## Notes

- **README.md** carried an unrelated pre-existing working-tree change (2-line removal of the comparison-doc pointer, user/linter-intentional) — NOT part of Phase 26, excluded from this commit. The executor correctly flagged it via NEEDS_CLARIFICATION (no conversation context); main session resolved: leave as-is.
- KARPATHY-minimal: descriptor struct + one detect function, no framework.
- Next: **Phase 27 (B)** — central config resolvers (settings/skills/commands/plugins/mcp) + fold the 3 settings.json writers behind one path + deep-merge atomic writer (D-C). Then Phase 28 (C) `.agents/` proof.
