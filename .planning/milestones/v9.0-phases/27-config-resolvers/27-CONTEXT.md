# Phase 27 CONTEXT — central config resolvers + settings-writer fold (v9.0 Phase B)

> v9.0 Cross-Harness, Phase B of 3 (A=26 seam ✅ / B=27 resolvers / C=28 `.agents/` proof). Design SoT = `v9.0-cross-harness-ARCHITECTURE.md` (§3 resolver layer + §7 D-C). Builds on Phase 26's `PlatformDescriptor` + `detectPlatform()` (`src/installers/lib/platform.ts`). Main-session hand-controlled; executed via spawned `gsd-executor` (host overreach lesson). **TDD mandatory** (path-resolution + settings-write logic, regression-sensitive). **Zero behavior change** — full existing suite stays green.

## Goal

Centralize the ~7 scattered `~/.claude/`-config call sites behind descriptor-backed resolvers (`getSettingsPath/getSkillsDir/getCommandsDir/getPluginsRegistry/getMcpConfigPath`), and DRY the two near-duplicate settings env-key writers behind one shared writer (D-C). Pure refactor — every output identical to today (claude default). This is the Tier-2 of the v9.0 abstraction; the auto-probe + `.agents/` wiring is Phase 28.

## Verified surface (spec-writing checklist — all Read-confirmed 2026-06-23/24)

**Settings writers (the D-C fold core):**
- `src/cli/lib/enableAgentTeamsInSettings.ts` — private `settingsPath()` L26 (`resolve(homedir(),'.claude','settings.json')`) + `backupOriginal()` L83 + `atomicWrite()` L98 (tmpPath+rename) + `createFreshSettings()` L71 + 3-case env-key merge (key `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS='1'`). EnableResult union.
- `src/cli/lib/enableUserLangInSettings.ts` — **near-identical structure** (settingsPath L35 / backupOriginal L129 / atomicWrite L144 / createFreshSettings L114), key `HARNESSED_USER_LANG`, plus `detectUserLang()`/`safeIntlLocale()` (KEEP — lang policy, not the writer). EnableUserLangResult union.
- `src/installers/ccHookAdd.ts:46` — inline `settingsPath = join(homedir(),'.claude','settings.json')`; writes nested `hooks` via Installer pipeline (preflight/confirmAt L3/backup()/renderDiff/writeFile non-atomic/R7 verify). **DIFFERENT mechanism — NOT folded; only swap its settingsPath → getSettingsPath().**

**Config / plugin reads:**
- `src/installers/lib/readClaudeConfig.ts` — `getUserClaudeJsonPath()` L35-37 (`join(homedir(),'.claude.json')`); `isPluginRegistered()` hardcodes plugins registry L112 + legacy `settings.json` L129 + `.claude.json` L130.

**Skills / commands / plugins (mechanical swaps):**
- `src/cli/setup.ts:120` — `const skillsBase = resolve(homedir(),'.claude','skills')`; `:194` — `const commandsBase = resolve(homedir(),'.claude','commands')`.
- `src/cli/lib/capabilityResolver.ts:84` — `readInstalledPlugins(homedirOverride?)` computes `join(home,'.claude','plugins','installed_plugins.json')`; `:119` — `readInstalledUserSkills(homedirOverride?)` computes `join(home,'.claude','skills')`. **Both take a `homedirOverride?` test param** — resolvers MUST preserve it (see D2 below).
- `src/installers/lib/idempotent.ts:96` (indicator dir, single `.claude`) + `:144` (npm-cli, single `.claude`) → swap. **`:120-128` is the `['.claude','.agents']` DUAL probe (cross-platform-aware precedent) — LEAVE AS-IS (Phase 28 reconciles).**

- `src/installers/lib/platform.ts` — Phase 26 SoT; extend here. Descriptor fields settingsPath/skillsDir/commandsDir/pluginsRegistry/mcpConfigPath already exist (defined Phase 26).

## Locked design (refines architecture §7 D-C from the verified code)

- **D1 — resolvers live in `platform.ts`** (co-located with descriptor): `getSettingsPath/getSkillsDir/getCommandsDir/getPluginsRegistry/getMcpConfigPath`, each `= detectPlatform(home?).<field>`.
- **D2 — descriptor takes optional home base** (additive, backward-compat): extend `claudeDescriptor(home = homedir())` + `detectPlatform(home = homedir())` to accept an optional home dir (default `homedir()`). Resolvers thread `home?` through. This preserves `capabilityResolver`'s `homedirOverride` test param WITHOUT re-hardcoding `.claude`. Phase 26 callers (no arg) unaffected.
- **D3 — settings env-key writer fold** (D-C, refined): NEW `src/cli/lib/settingsWriter.ts` extracts the shared `mergeSettingsEnvKey(key, value, opts)` + backup + atomicWrite + createFresh (using `getSettingsPath()`). `enableAgentTeamsInSettings` + `enableUserLangInSettings` become thin callers preserving their public signatures + result-type unions + idempotency/lang policies. **`ccHookAdd` is NOT folded** (Installer pipeline / hooks-merge / confirm-gated) — only its settingsPath swaps to `getSettingsPath()`.
- **D4 — idempotent dual-probe untouched** (D3 refinement): `idempotent.ts:120-128` `['.claude','.agents']` stays; only the two single-`.claude` sites swap. The dual-probe is already cross-platform — Phase 28 generalizes it via the descriptor set.

## Scope

- MODIFY `src/installers/lib/platform.ts`: optional home base (D2) + 5 resolvers (D1).
- NEW `src/cli/lib/settingsWriter.ts`: shared env-key merge writer (D3).
- MODIFY `enableAgentTeamsInSettings.ts` + `enableUserLangInSettings.ts`: thin callers of settingsWriter.
- MODIFY `ccHookAdd.ts`, `readClaudeConfig.ts`, `setup.ts`, `capabilityResolver.ts`, `idempotent.ts`: swap to resolvers.
- NEW/UPDATE tests: settingsWriter unit + resolver unit + any coupled fixtures.

## Out of scope (do NOT touch)

- Auto-probe detection + `.agents/` descriptor + `HARNESSED_PLATFORM`/`.platform` pin + `setup --platform` + the idempotent dual-probe generalization → **Phase 28 (C)**.
- `getHarnessedRoot()` / the 6 state-root consumers → unchanged (Phase 26 done).
- ccHookAdd's hooks-merge / Installer pipeline logic → only settingsPath swaps.
- `migrateLegacyHarnessedRoot` → unchanged.

## Invariants

- **Zero behavior change**: full existing suite green UNCHANGED (regression proof). Every resolver output = the pre-change hardcoded path (claude default). settings writers produce byte-identical settings.json results + same result-type unions.
- `HARNESSED_ROOT_OVERRIDE` (stateRoot) precedence unaffected; the new `home?` param is orthogonal (homeDir-derived fields).
- KARPATHY-minimal: thin resolvers + one shared writer; no framework.
- TDD red→green; tsc 0; biome preempt; NEVER `git add -A`; NEVER push without approval.

## Acceptance

1. 5 resolvers in `platform.ts` return descriptor-correct paths; `claudeDescriptor(home)`/`detectPlatform(home)` honor optional home base (default homedir()); Phase 26 no-arg callers unchanged. (unit)
2. `settingsWriter.mergeSettingsEnvKey()` reproduces the 3-case (create/idempotent/backup+merge) behavior; `enableAgentTeams`/`enableUserLang` keep their public signatures + result unions + policies. (unit)
3. All ~7 swap sites route through resolvers; `idempotent.ts:120-128` dual-probe + ccHookAdd pipeline untouched (only settingsPath swapped). (grep + unit)
4. Full existing suite green UNCHANGED (regression proof); tsc 0; biome clean. (gate)
