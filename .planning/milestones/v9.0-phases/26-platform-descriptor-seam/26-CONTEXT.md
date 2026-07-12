# Phase 26 CONTEXT — PlatformDescriptor seam (v9.0 Phase A)

> v9.0 Cross-Harness, Phase A of 3 (A=26 seam / B=27 config resolvers / C=28 `.agents/` proof). Design SoT = `.planning/v9.0-cross-harness-ARCHITECTURE.md` (scope B locked via D2; eng-review APPROVED). Do NOT re-derive the architecture here. Main-session hand-controlled (GSD agent chain overreaches this host — STATE lesson). **TDD mandatory** (core path-resolution logic, regression-sensitive).

## Goal

Introduce the `PlatformDescriptor` seam with **zero behavior change**: route `getHarnessedRoot()` through a new `detectPlatform()` that returns a Claude-Code descriptor identical to today's hardcoded path. This is the refactor-first foundation (Beck: make-the-change-easy) — the auto-probe + `.agents/` second platform are Phase C (28); the scattered config resolvers are Phase B (27). Phase A only builds the seam and proves the full existing suite stays green.

## Verified surface (spec-writing checklist — Read-confirmed 2026-06-23)

- `getHarnessedRoot()` — `src/installers/lib/harnessedRoot.ts:65-69` (exists). Current body: `const override = process.env.HARNESSED_ROOT_OVERRIDE; if (override !== undefined && override !== '') return override; return join(homedir(), '.claude', 'harnessed')`.
- `harnessedSubdir()` L78-80, `harnessedFile()` L88-90 (exist) — compose under `getHarnessedRoot()`. Unchanged by Phase A (they call getHarnessedRoot, automatically routed).
- `migrateLegacyHarnessedRoot()` L114-145 (exists) — `~/.harnessed` → `~/.claude/harnessed`. **Unchanged** by Phase A.
- 6 consumers of the root (per coupling map): `state.ts`, `checkpoint/state.ts`, `backup.ts`, `archive.ts`, `audit/log.ts`, `governance.ts` — all via `harnessedSubdir/File`, so they inherit the routing transparently. **Not touched** in Phase A.
- `HARNESSED_ROOT_OVERRIDE` env (harnessedRoot.ts:66) — test-isolation override; precedence MUST be preserved.
- `src/installers/lib/platform.ts` — NEW (Phase A creates it).
- `tests/installers/platform.test.ts` — NEW. (Check for an existing harnessedRoot test to keep green: `grep -rl harnessedRoot tests/` at execution.)

## Locked design (from architecture doc §3 — Phase A subset)

- **PlatformDescriptor** (8 fields, full type defined in A, only `claude` populated): `id`, `homeDir`, `stateRoot`, `settingsPath`, `skillsDir`, `commandsDir`, `pluginsRegistry`, `mcpConfigPath`. (settings/skills/commands/plugins/mcp fields are defined but only CONSUMED in Phase B; Phase A only consumes `stateRoot`.)
- **claudeDescriptor()** — `homeDir = join(homedir(),'.claude')`; `stateRoot = join(homeDir,'harnessed')`; `settingsPath = join(homeDir,'settings.json')`; `skillsDir = join(homeDir,'skills')`; `commandsDir = join(homeDir,'commands')`; `pluginsRegistry = join(homeDir,'plugins','installed_plugins.json')`; `mcpConfigPath = join(homedir(),'.claude.json')` (SIBLING — the §7 D-A irregular field); `id='claude'`.
- **detectPlatform()** — Phase A precedence ONLY: (1) `HARNESSED_ROOT_OVERRIDE` set → claude descriptor with `stateRoot` replaced by the override verbatim (preserves test isolation; other fields stay claude-default, matching today where only the harnessed root is overridden); (2) else → `claudeDescriptor()`. **NO auto-probe, NO `.agents/` fallback, NO `HARNESSED_PLATFORM` handling** — those are Phase C (anti-stale: don't build detection branches before the second platform exists).
- **getHarnessedRoot()** — body becomes `return detectPlatform().stateRoot`. Byte-identical output to current (override → override; else → `~/.claude/harnessed`).

## Scope

- NEW `src/installers/lib/platform.ts`: `PlatformDescriptor` interface + `claudeDescriptor()` + `detectPlatform()`.
- MODIFY `src/installers/lib/harnessedRoot.ts`: `getHarnessedRoot()` routes through `detectPlatform().stateRoot` (move the override check into detectPlatform; keep the doc-comment accurate).
- NEW `tests/installers/platform.test.ts`: detectPlatform precedence + descriptor shape (TDD red-first).

## Out of scope (do NOT touch)

- Config-dir resolvers (settings/skills/commands/plugins/mcp) + the scattered call sites → **Phase B (27)**.
- Auto-probe detection + `.agents/` descriptor + `HARNESSED_PLATFORM` + `.platform` pin + `setup --platform` → **Phase C (28)**.
- `migrateLegacyHarnessedRoot()` + the 6 root consumers + `harnessedSubdir/File` bodies → unchanged.
- Any settings.json deep-merge writer (D-C) → Phase B.

## Invariants

- **Zero behavior change**: the FULL existing test suite passes unchanged (the regression proof that the seam is transparent). `getHarnessedRoot()` output byte-identical for both override-set and default cases.
- `HARNESSED_ROOT_OVERRIDE` precedence preserved exactly.
- KARPATHY-minimal: descriptor struct + one detect function; no platform framework.
- TDD red→green; tsc 0; biome preempt before commit; NEVER `git add -A`; NEVER push without approval.

## Acceptance

1. `PlatformDescriptor` interface exported with 8 fields; `claudeDescriptor()` returns the correct claude paths (incl. `mcpConfigPath` = `~/.claude.json` sibling). (unit)
2. `detectPlatform()`: default → claude descriptor; `HARNESSED_ROOT_OVERRIDE=/tmp/x` → descriptor with `stateRoot==='/tmp/x'`, other fields claude-default. (unit)
3. `getHarnessedRoot()` === `detectPlatform().stateRoot`; output byte-identical to pre-change for default + override. (unit)
4. Full existing suite green unchanged (regression proof); tsc 0; biome clean. (gate)
