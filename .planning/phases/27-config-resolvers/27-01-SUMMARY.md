---
phase: 27-config-resolvers
plan: 01
subsystem: installers/platform + cli/settings
tags: [refactor, descriptor-seam, config-resolvers, settings-writer-fold, v9.0-phase-B, zero-behavior-change]
status: complete
requires:
  - "26-platform-descriptor-seam (PlatformDescriptor + detectPlatform)"
provides:
  - "5 config resolvers (getSettingsPath/getSkillsDir/getCommandsDir/getPluginsRegistry/getMcpConfigPath) + optional home base (D1/D2)"
  - "src/cli/lib/settingsWriter.ts mergeSettingsEnvKey shared env-key writer (D3 fold)"
affects:
  - "setup.ts / capabilityResolver.ts / readClaudeConfig.ts / ccHookAdd.ts / idempotent.ts (swapped to resolvers)"
  - "enableAgentTeamsInSettings.ts / enableUserLangInSettings.ts (thin callers of settingsWriter)"
tech-stack:
  added: []
  patterns: ["descriptor-backed resolver accessors", "shared-writer fold preserving public result-type unions"]
key-files:
  created:
    - src/cli/lib/settingsWriter.ts
    - tests/cli/settingsWriter.test.ts
  modified:
    - src/installers/lib/platform.ts
    - src/cli/lib/enableAgentTeamsInSettings.ts
    - src/cli/lib/enableUserLangInSettings.ts
    - src/installers/ccHookAdd.ts
    - src/installers/lib/readClaudeConfig.ts
    - src/cli/setup.ts
    - src/cli/lib/capabilityResolver.ts
    - src/installers/lib/idempotent.ts
    - tests/installers/platform.test.ts
decisions:
  - "D1: resolvers live in platform.ts co-located with descriptor"
  - "D2: claudeDescriptor/detectPlatform gain optional home base (additive, default homedir()); resolvers thread it to preserve capabilityResolver homedirOverride WITHOUT re-hardcoding .claude"
  - "D3: ONE shared settingsWriter.mergeSettingsEnvKey; ccHookAdd NOT folded (Installer pipeline) — only its settingsPath swapped"
  - "D4: idempotent.ts:121-122 ['.claude','.agents'] dual-probe LEFT AS-IS (Phase 28 reconciles)"
metrics:
  duration: ~25min
  completed: 2026-06-24
  tasks: 3
  files_created: 2
  files_modified: 9
---

# Phase 27 Plan 01: Central config resolvers + settings-writer fold Summary

Centralized the ~7 scattered `~/.claude/`-config call sites behind 5 descriptor-backed resolvers in `platform.ts` (with an additive optional home base, D2) and folded the two near-duplicate settings env-key writers behind one shared `settingsWriter.mergeSettingsEnvKey()` — pure refactor, claude-default output byte-identical, full existing suite green unchanged (regression proof).

## What was built

### Task 1 (TDD) — 5 config resolvers + optional home base (D1/D2)

`src/installers/lib/platform.ts` (82 → 124 lines):
- `claudeDescriptor(home: string = homedir())` — internal base now derives from the supplied `home`; `mcpConfigPath = join(home, '.claude.json')` stays a homedir sibling. No-arg default = byte-identical to Phase 26.
- `detectPlatform(home: string = homedir())` — threads `home` to `claudeDescriptor(home)`; `HARNESSED_ROOT_OVERRIDE` still only replaces `stateRoot` (orthogonal to the new home param).
- 5 NEW resolvers, each `= detectPlatform(home?).<field>`:
  - `getSettingsPath(home?)` → `<home>/.claude/settings.json`
  - `getSkillsDir(home?)` → `<home>/.claude/skills`
  - `getCommandsDir(home?)` → `<home>/.claude/commands`
  - `getPluginsRegistry(home?)` → `<home>/.claude/plugins/installed_plugins.json`
  - `getMcpConfigPath(home?)` → `<home>/.claude.json` (sibling)

**Mechanical swap sites (Task 1):**
| File | Before | After |
|------|--------|-------|
| `setup.ts:120` | `resolve(homedir(),'.claude','skills')` | `getSkillsDir()` |
| `setup.ts:194` | `resolve(homedir(),'.claude','commands')` | `getCommandsDir()` |
| `capabilityResolver.ts:82-84` | `join(home,'.claude','plugins','installed_plugins.json')` | `getPluginsRegistry(homedirOverride)` |
| `capabilityResolver.ts:117-119` | `join(home,'.claude','skills')` | `getSkillsDir(homedirOverride)` |
| `readClaudeConfig.ts:getUserClaudeJsonPath` | `join(homedir(),'.claude.json')` | `return getMcpConfigPath()` (export name preserved) |
| `readClaudeConfig.ts:112` | `join(homedir(),'.claude','plugins','installed_plugins.json')` | `getPluginsRegistry()` |
| `readClaudeConfig.ts:129-130` | `[join(homedir(),'.claude','settings.json'), join(homedir(),'.claude.json')]` | `[getSettingsPath(), getMcpConfigPath()]` |
| `ccHookAdd.ts:46` | `join(homedir(),'.claude','settings.json')` | `getSettingsPath()` (hooks pipeline untouched) |

`capabilityResolver`'s `homedirOverride?` test param is preserved (D2): threaded straight through the resolver's optional `home?` arg (`undefined` → resolver defaults to `homedir()`). Removed now-unused `homedir`/`join` imports from `setup.ts`, `capabilityResolver.ts`, `ccHookAdd.ts`.

### Task 2 (TDD) — settingsWriter fold (D3) + idempotent single-`.claude` swap

NEW `src/cli/lib/settingsWriter.ts` (141 lines) extracts the shared `mergeSettingsEnvKey(key, value, opts?: { skipIfPresent? })`:
- 3-case mechanics byte-for-byte: (a) ENOENT → create fresh `{env:{key:value}}`; (b) `skipIfPresent(existing)===true` → idempotent no-op (`outcome:'already'` carries `existing`); (c) missing/stale → `backupOriginal` (→ `harnessedSubdir('backups')/settings.json.{ISO-ts}.bak`) + non-destructive merge + `atomicWrite` (tmp + rename).
- settingsPath via `getSettingsPath()` resolver; same warn wording (`read/write … failed`, `malformed JSON`, `not a JSON object`) so callers' result mapping is unchanged.
- Returns discriminated `MergeOutcome` union (`created`/`already`/`merged`/`warn`).

**Writer fold (before → after):**
| Writer | Before | After | Public API |
|--------|--------|-------|------------|
| `enableAgentTeamsInSettings.ts` | 108 lines | 44 lines | `EnableResult` union + signature UNCHANGED; key `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`, `skipIfPresent: v => v === '1'` |
| `enableUserLangInSettings.ts` | 154 lines | 89 lines | `EnableUserLangResult` union + signature UNCHANGED; `detectUserLang`/`safeIntlLocale` KEPT; already-set policy `skipIfPresent: () => override === undefined` |

Both writers map `MergeOutcome` → their existing status union (created → created; already → already-enabled / already-set+existing; merged → enabled+backupPath/detected; warn → warn). Net writer-code shrink: 262 → 133 lines (settingsWriter +141 shared).

`idempotent.ts` single-`.claude` swaps: `:97` (indicator dir) + `:145` (npm-cli) → `join(getSkillsDir(), …)`. **`:121-122` `['.claude','.agents']` dual-probe LEFT AS-IS** (D4 — Phase 28 reconciles). `:58` git-clone-target `homedir()` expansion is out of scope, untouched.

### Task 3 — regression gate

- **biome**: `Checked 338 files. No fixes applied.` exit 0.
- **tsc --noEmit**: exit 0.
- **Full suite**: `Test Files 166 passed | 3 skipped (169)` / `Tests 1369 passed | 5 skipped | 1 todo (1375)` — **0 failed**. Baseline 1357 (Phase 26) + 12 new (5 platform resolver + 7 settingsWriter) = 1369. Existing settings/installer/capabilityResolver/setup/idempotent suites all green UNCHANGED.

## Zero-behavior-change evidence

**Residual-hardcoded grep** (`grep -rn "homedir(), *'\.claude'" src/`): the remaining hits are all OUT OF SCOPE for Phase 27 — `check-mattpocock-skills.ts`, `check-token-budget.ts`, `checkAgentTeams.ts`, `harnessedRoot.ts`, `npxSkillInstaller.ts`, `uninstallers/*`, `check-builtin.ts` — none in the plan's 7-site swap list. The idempotent dual-probe (`:121-122`) intentionally still uses `join(homedir(), base, 'skills', …)` per D4. All 8 planned swap sites + 2 idempotent single-`.claude` sites confirmed routed through resolvers; `readClaudeConfig.ts` and `installers/ccHookAdd.ts` have ZERO remaining `homedir` references.

`HARNESSED_ROOT_OVERRIDE` orthogonality unit-tested: setting it moves `detectPlatform().stateRoot` only; the 5 config resolvers stay claude-default.

## git diff --stat (tracked)

```
 README.md                                 |   2 -   (PRE-EXISTING out-of-scope change — left untouched)
 src/cli/lib/capabilityResolver.ts         |  12 ++--
 src/cli/lib/enableAgentTeamsInSettings.ts | 107 ++++------------
 src/cli/lib/enableUserLangInSettings.ts   | 114 +++++-----------
 src/cli/setup.ts                          |   6 +-
 src/installers/ccHookAdd.ts               |   5 +-
 src/installers/lib/idempotent.ts          |   5 +-
 src/installers/lib/platform.ts            |  69 ++++++++++--
 src/installers/lib/readClaudeConfig.ts    |  15 ++--
 tests/installers/platform.test.ts         |  87 +++++++++++++-
 10 files changed, 210 insertions(+), 212 deletions(-)
```
Plus 2 NEW untracked files: `src/cli/lib/settingsWriter.ts`, `tests/cli/settingsWriter.test.ts`.

## Deviations from Plan

None — plan executed exactly as written. No bugs/missing-functionality/blockers required Rules 1-3; no architectural changes (Rule 4).

## Notes

- Per executor brief: changes left in working tree UNCOMMITTED (main session re-verifies + commits). README.md pre-existing 2-line change left untouched (out of scope, accounted for).
- `enableAgentTeamsInSettings` create-case `mkdir` now uses `dirname(getSettingsPath())` (= `<home>/.claude`) instead of `join(homedir(),'.claude')` — byte-identical path, warn wording preserved.

## Phase 28 pointer (C — `.agents/` proof)

Tier-3 of v9.0: auto-probe detection + `.agents/` descriptor + `HARNESSED_PLATFORM`/`.platform` pin + `setup --platform`. Phase 28 generalizes the idempotent `['.claude','.agents']` dual-probe via the descriptor set (D4), and retargets the second harness by swapping the descriptor — the call sites are already centralized through these resolvers, so no further call-site edits needed.
