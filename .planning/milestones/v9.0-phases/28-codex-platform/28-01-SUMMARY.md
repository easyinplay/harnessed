---
phase: 28-codex-platform
plan: 01
subsystem: installers/platform
status: complete
tags: [v9.0, cross-harness, platform-descriptor, codex, capability-aware, tdd]
requires: ["26-platform-descriptor-seam", "27-config-resolvers"]
provides:
  - "capability-aware PlatformDescriptor (pluginsRegistry string|null + supportsEnvKeyWrite)"
  - "codexDescriptor (real second harness, host-verified paths)"
  - "detectPlatform 5-level precedence (override → HARNESSED_PLATFORM → .platform pin → claude-first probe → fallback)"
  - "setup --platform <id> (claude|codex) + .platform pin persist"
  - "harnessSkillsDirs descriptor-derived dual-probe (idempotent.ts D6)"
affects:
  - src/installers/lib/platform.ts
  - src/cli/lib/enableAgentTeamsInSettings.ts
  - src/cli/lib/enableUserLangInSettings.ts
  - src/cli/lib/capabilityResolver.ts
  - src/installers/lib/readClaudeConfig.ts
  - src/cli/setup.ts
  - src/installers/lib/idempotent.ts
tech-stack:
  patterns: ["capability flag gating", "descriptor-derived probe set", "claude-first auto-probe (zero-blast)"]
key-files:
  created:
    - tests/installers/platform-codex.test.ts
    - tests/cli/setup-platform.test.ts
    - tests/integration/dual-platform.test.ts
  modified:
    - src/installers/lib/platform.ts
    - src/cli/lib/enableAgentTeamsInSettings.ts
    - src/cli/lib/enableUserLangInSettings.ts
    - src/cli/lib/capabilityResolver.ts
    - src/installers/lib/readClaudeConfig.ts
    - src/cli/setup.ts
    - src/installers/lib/idempotent.ts
decisions:
  - "Auto-probe (existsSync) wrapped defensively — a partial node:fs mock degrades to the claude-default fallback (byte-identical), keeping detectPlatform tolerant of unit-test fs stubs without editing any existing test."
metrics:
  duration: "~50min"
  completed: 2026-06-24
  tasks: 3
  files: 10
---

# Phase 28 Plan 01: Codex second-platform proof Summary

v9.0's PlatformDescriptor seam validated against a REAL divergent second harness (Codex): capability-aware descriptor (`pluginsRegistry: string | null` + `supportsEnvKeyWrite`), a host-verified `codexDescriptor`, a 5-level `detectPlatform` precedence, `setup --platform codex`, capability-absent env-key writers, and a descriptor-derived idempotent probe set — with the claude default staying byte-identical (full pre-existing suite green, unchanged).

## Capability-aware PlatformDescriptor (before → after)

| Field | Before (Phase 26/27) | After (Phase C) |
|---|---|---|
| `id` | `'claude'\|'agents'\|'cursor'\|'gemini'\|'copilot'` | + `'codex'` |
| `pluginsRegistry` | `string` | `string \| null` (codex has no registry) |
| `supportsEnvKeyWrite` | — (absent) | `boolean` (claude `true`, codex `false`) |

All other claude descriptor values byte-identical. `getPluginsRegistry` return type widened `string → string | null`.

## codexDescriptor path table (host-verified 2026-06-24)

| Field | Value (`home`) | Divergence from claude |
|---|---|---|
| `id` | `codex` | — |
| `homeDir` | `<home>/.codex` | — |
| `stateRoot` | `<home>/.codex/harnessed` | harnessed-defined |
| `settingsPath` | `<home>/.codex/config.toml` | TOML; **write capability-absent** |
| `mcpConfigPath` | `<home>/.codex/config.toml` | **same file as settings** |
| `skillsDir` | `<home>/.agents/skills` | **SHARED, NOT `<home>/.codex/skills`** |
| `commandsDir` | `<home>/.codex/prompts` | named "prompts" |
| `pluginsRegistry` | `null` | no registry (inline `[marketplaces.*]`) |
| `supportsEnvKeyWrite` | `false` | env-key writes gated off |

## detectPlatform precedence (D3, claude-first)

1. `HARNESSED_ROOT_OVERRIDE` → claude + stateRoot=override (FIRST, unchanged — test isolation).
2. `HARNESSED_PLATFORM=<id>` env → that descriptor (claude|codex; unknown → fall through).
3. `.platform` pin at claude/incumbent stateRoot (`readFileSync` in try/catch) → pinned descriptor.
4. auto-probe: `existsSync(~/.claude)` → claude (INCUMBENT wins); else `existsSync(~/.codex)` → codex. Wrapped in try/catch → degrades to claude fallback (byte-identical) when fs is partially mocked.
5. fallback → claude.

No env/pin + `~/.claude` present → exact `claudeDescriptor()`. codex reached ONLY via explicit opt-in or codex-only host.

## 2 env-key writers gated (D4 evidence)

Both `enableAgentTeamsInSettings` + `enableUserLangInSettings` early-guard:
```
if (!detectPlatform().supportsEnvKeyWrite) return { status: 'warn', message: `platform 'codex' does not support env-key settings writes (capability-absent) — <KEY> skipped` }
```
Short-circuits BEFORE any fs read — never reads/parses/writes `config.toml`, never a JSON-into-TOML corruption. claude path unchanged (existing 6+10 enable* fixtures green). RED proof: without the gate the writer read the real host `~/.codex/config.toml` → `malformed JSON` (capability-absent corruption risk), now eliminated.

null-tolerant consumers:
- `capabilityResolver.readInstalledPlugins`: `if (path === null) return new Set()` before `readFileSync`.
- `readClaudeConfig.isPluginRegistered`: `if (registryPath !== null)` guards the registry probe; legacy settings/mcp sources still consulted.

## setup --platform (D5)

`.option('--platform <id>', ...)`. Action applies it FIRST: validate `∈ {claude,codex}` (else error + `exit(1)`), set `process.env.HARNESSED_PLATFORM`, persist `.platform` pin at the now-resolved `stateRoot` (`mkdir -p` + `writeFile`; pin-write failure non-blocking warn). Existing resolver-backed `getSkillsDir`/`getCommandsDir`/`getHarnessedRoot` then route to codex. Test-proven: `--platform codex` writes pin to `~/.codex/harnessed/.platform` + routes skills→`~/.agents/skills`, commands→`~/.codex/prompts`.

## idempotent generalization (D6, before → after)

Before (`idempotent.ts:121`):
```
for (const base of ['.claude', '.agents']) {
  const skillMd = join(homedir(), base, 'skills', skillName, 'SKILL.md')
```
After (descriptor-derived, same paths):
```
for (const skillsDir of harnessSkillsDirs()) {  // [~/.claude/skills, ~/.agents/skills]
  const skillMd = join(skillsDir, skillName, 'SKILL.md')
```
New export `harnessSkillsDirs(home?)` = deduped `[claudeDescriptor.skillsDir, codexDescriptor.skillsDir]` — single source of truth.

## Test counts

- `tests/installers/platform-codex.test.ts` (NEW): 18 tests (codex descriptor + 5-level precedence matrix + harnessSkillsDirs + capability-aware consumers/writers under codex).
- `tests/cli/setup-platform.test.ts` (NEW): 3 tests (invalid-id exit, codex pin+route, claude-default untouched).
- `tests/integration/dual-platform.test.ts` (NEW): 4 tests (claude-pinned vs codex-pinned every-field resolution + divergence + probe set).
- `tests/installers/platform.test.ts` (existing, UNCHANGED): 10 tests still green (type widening broke nothing).

## Regression proof (claude-default unchanged)

- Baseline after Phase 27: 1369 tests.
- After Phase 28: **1394 passed | 0 failed** | 5 skipped | 1 todo (172 test files). = +25 new (13+5 codex + 3 setup-platform + 4 dual-platform).
- **Zero existing test files modified** (`git diff --name-only | grep tests/` → none). Every pre-existing claude-default test green UNCHANGED.
- A transient self-introduced regression (10 audit/checkpoint tests crashing on `existsSync` undefined under partial `node:fs` mocks) was found and fixed via the defensive try/catch in detectPlatform's auto-probe — no existing test was edited to accommodate it.

## biome / tsc

- `biome check src/ tests/` → clean (1 file auto-fixed during dev, final clean; 0 errors).
- `tsc --noEmit` → exit 0 (the `string | null` widening broke no consumer; the 2 named consumers were made null-tolerant).

## git diff --stat (planned files only)

```
 README.md                                 |   2 -   (pre-existing OUT-OF-SCOPE; NOT touched by Phase 28)
 src/cli/lib/capabilityResolver.ts         |   3 +
 src/cli/lib/enableAgentTeamsInSettings.ts |  12 +++
 src/cli/lib/enableUserLangInSettings.ts   |  10 +++
 src/cli/setup.ts                          |  40 ++++++++-
 src/installers/lib/idempotent.ts          |   8 +-
 src/installers/lib/platform.ts            | 137 ++++++++++++++++++++++++---
 src/installers/lib/readClaudeConfig.ts    |  26 +++---
```
+ 3 NEW untracked test files. README.md's −2 is the pre-existing intentional working-tree change (left untouched per brief).

## v9.0 milestone-audit pointer

Phase C complete = **v9.0 Cross-Harness 3/3** (A=26 seam ✅ / B=27 resolvers ✅ / C=28 second-platform proof ✅). The seam now demonstrably admits a real divergent second harness (TOML config / shared skills / no plugin registry / settings===mcp / capability-absent writes) with zero blast on the claude incumbent. **Next step: `/gsd-audit-milestone` v9.0 → close** (LIGHTWEIGHT-adapt per project memory: ROADMAP + MILESTONES index rows + audit; no git-tag; phase dirs stay in `phases/`).

## Self-Check: PASSED

- Created files exist: `tests/installers/platform-codex.test.ts`, `tests/cli/setup-platform.test.ts`, `tests/integration/dual-platform.test.ts` — all present.
- Modified files carry the changes: platform.ts (codexDescriptor/precedence/widening), 2 writers (gate), 2 consumers (null-tolerant), setup.ts (--platform), idempotent.ts (harnessSkillsDirs).
- Gates: biome clean, tsc 0, full suite 1394 passed / 0 failed, 0 existing tests modified.
