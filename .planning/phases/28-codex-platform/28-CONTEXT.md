# Phase 28 CONTEXT — Codex second-platform proof (v9.0 Phase C, pivoted)

> v9.0 Cross-Harness, Phase C of 3 (A=26 seam ✅ / B=27 resolvers ✅ / C=28 second-platform proof). Design SoT = `v9.0-cross-harness-ARCHITECTURE.md` (§3b detection + §4 Phase C + §7 D-A/D-B). Builds on Phase 26/27 (`PlatformDescriptor` + `detectPlatform()` + 5 resolvers). Main-session hand-controlled discuss+plan; executed via spawned `gsd-executor`. **TDD mandatory** (detection precedence + capability-aware resolution, regression-sensitive). **Zero behavior change for the claude default** (full existing suite stays green).

## Pivot (discuss outcome — supersedes the architecture-doc §4 Phase C sketch)

The sketch targeted `.agents/` as the second platform. **Anti-stale verification (2 research subagents, host + official docs, 2026-06-24) overturned that premise**, then a user decision re-pointed the target:

1. **`~/.agents/` is a PARTIAL convention, NOT a harness home.** It standardizes ONLY `skills/<name>/SKILL.md` (byte-compatible with CC's format, via the `vercel-labs/skills` CLI; registry = `~/.agents/.skill-lock.json` v3, schema ≠ `installed_plugins.json`). It has **no settings, no commands, no plugin registry, no MCP concept** (no `~/.agents.json`). Host `~/.agents/` = `skills/` + `.skill-lock.json` only. `.agents/skills/` is canonical; `.claude/skills/` symlinks INTO it. So `.agents/` cannot be a full "second platform" — and harnessed already treats stray `.agents/` writes as a bridge-back bug (`npxSkillInstaller.ts` D-02).
2. **User decision (D-28a): pivot the second platform to a real full harness → Codex** (`/gsd-execute` discuss gate, option C). Cursor was rejected: not installed on host (no ground truth) + user surface is mostly an opaque app-settings DB (only `~/.cursor/mcp.json` is filesystem-addressable; 6/8 fields UNVERIFIED/null — too thin).
3. **User decision (D-28b): write surfaces = capability-absent**, not a TOML writer (option A). The CC-specific env keys (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`) are meaningless to Codex; harnessed's `settingsWriter` (JSON env-key merge) does not port to Codex's TOML config. Phase 28 proves path-resolution + skills/commands/state install + detection, NOT settings/MCP writes for codex.

## Verified Codex layout → descriptor (stock Codex, host extras excluded)

All Read-/host-confirmed 2026-06-24 (host `C:\Users\easyi\.codex\`; docs developers.openai.com/codex). `~/.Codex/` == `~/.codex/` (Windows case-insensitive; canonical lowercase, `CODEX_HOME` in config.toml).

| Descriptor field | claude (incumbent) | **codex** | Divergence |
|---|---|---|---|
| `id` | `'claude'` | `'codex'` | — |
| `homeDir` | `~/.claude` | `~/.codex` | — |
| `stateRoot` | `~/.claude/harnessed` | `~/.codex/harnessed` | harnessed-defined `<homeDir>/harnessed`; OK |
| `settingsPath` | `~/.claude/settings.json` (JSON) | `~/.codex/config.toml` (**TOML**) | format diverges; **write unsupported** (D-28b) |
| `skillsDir` | `~/.claude/skills` | `~/.agents/skills` (**shared**) | **NOT `<homeDir>/skills`** — breaks uniform derivation |
| `commandsDir` | `~/.claude/commands` | `~/.codex/prompts` | named "prompts" |
| `pluginsRegistry` | `~/.claude/plugins/installed_plugins.json` | **`null`** | no registry (inline `[marketplaces.*]`) |
| `mcpConfigPath` | `~/.claude.json` (sibling) | `~/.codex/config.toml` → `[mcp_servers.*]` (**same file as settings**) | not a sibling; write unsupported (D-28b) |

**Load-bearing implications**: (a) `pluginsRegistry` must become `string | null` — codex has no registry. (b) `skillsDir` is NOT `<homeDir>/skills` for codex (it's the shared `~/.agents/skills`) — descriptor stores it explicitly, no derivation. (c) `settingsPath === mcpConfigPath` for codex (both config.toml) and both are TOML → harnessed's JSON env-key writes are **capability-absent** for codex (gated off, no-op+inform). (d) Codex's own bundled skills live at `~/.codex/skills/.system/` — irrelevant; harnessed-installed skills go to the shared `~/.agents/skills`.

## Locked design

- **D1 — capability-aware `PlatformDescriptor`** (additive, backward-compat): `pluginsRegistry: string | null`; add `supportsEnvKeyWrite: boolean` (claude `true`, codex `false`) gating the 2 env-key settings writers. All other fields stay `string` (codex points settings+mcp at the same config.toml; writes gated by the flag). Phase 26/27 `claude` descriptor unchanged in value.
- **D2 — `codexDescriptor(home = homedir())`** in `platform.ts`, co-located with `claudeDescriptor`. Explicit verified paths (skillsDir = `join(home,'.agents','skills')`; settingsPath = mcpConfigPath = `join(home,'.codex','config.toml')`; commandsDir = `join(home,'.codex','prompts')`; pluginsRegistry = `null`; supportsEnvKeyWrite = `false`).
- **D3 — `detectPlatform()` precedence expansion** (claude-first = zero blast): `HARNESSED_ROOT_OVERRIDE` (claude + stateRoot override, **kept FIRST** for test isolation) → `HARNESSED_PLATFORM=<id>` env → `.platform` pin file (read from the claude/incumbent stateRoot, the well-known location) → auto-probe (`~/.claude/` exists → claude, INCUMBENT wins; else `~/.codex/` → codex) → fallback claude. A claude user gets byte-identical behavior; codex only via explicit opt-in.
- **D4 — capability-aware resolvers + writers**: `getPluginsRegistry()` returns `string | null`; its callers (`capabilityResolver`, `readClaudeConfig`) treat null as "no registry → no plugins". `enableAgentTeamsInSettings` + `enableUserLangInSettings` gate on `detectPlatform().supportsEnvKeyWrite` — no-op + inform when false (codex).
- **D5 — `setup --platform <id>`**: commander option on the `setup` command; validate `id ∈ {claude, codex}`; set `process.env.HARNESSED_PLATFORM` for the run + persist the `.platform` pin; existing `getSkillsDir()`/`getCommandsDir()`/`getHarnessedRoot()` then route to codex automatically (already resolver-backed since Phase 27).
- **D6 — generalize idempotent dual-probe** (closes the Phase 27 STATE follow-on, D4-deferred): replace `idempotent.ts:121` hardcoded `['.claude','.agents']` with the deduped skillsDir set of the known descriptors (`claudeDescriptor().skillsDir` + `codexDescriptor().skillsDir` = `~/.claude/skills` + `~/.agents/skills`). Same paths probed, now descriptor-derived.

## Scope

- MODIFY `src/installers/lib/platform.ts`: capability-aware type (D1) + `codexDescriptor` (D2) + `detectPlatform` precedence (D3) + resolver return-type for `getPluginsRegistry` (D4).
- MODIFY `src/cli/lib/enableAgentTeamsInSettings.ts` + `enableUserLangInSettings.ts`: gate on `supportsEnvKeyWrite` (D4).
- MODIFY `src/cli/lib/capabilityResolver.ts` + `src/installers/lib/readClaudeConfig.ts`: tolerate `null` pluginsRegistry (D4).
- MODIFY `src/cli/setup.ts`: `--platform <id>` option + pin write (D5).
- MODIFY `src/installers/lib/idempotent.ts`: descriptor-derived probe set (D6).
- NEW/UPDATE tests: codexDescriptor + detection precedence + capability-aware resolution + dual-platform integration + writers-gated-off.

## Out of scope (do NOT touch)

- **TOML reader/writer** for Codex settings/MCP — capability-absent (D-28b). No new TOML dependency.
- **Cursor / Gemini / Copilot** descriptors — Codex is the only verified target; others remain future data.
- **`.agents/` as a platform** — it's a skills convention, not a harness (only its `skills/` path appears, as codex's `skillsDir`).
- **Cross-platform state migration** — switching platforms = explicit re-`setup` (architecture §3d), no auto-migrate.
- **`getHarnessedRoot` / state consumers** — unchanged (already routed Phase 26); they follow `stateRoot` automatically once detection picks codex.
- Out-of-scope residual `~/.claude` hardcodes (`check-mattpocock-skills`, `check-token-budget`, `checkAgentTeams`, `npxSkillInstaller`, `uninstallers/*`) — mostly CC-specific (e.g. `checkAgentTeams` reads the CC env key, capability-absent for codex); leave unless a specific one blocks codex install correctness.

## Invariants

- **Zero behavior change for claude default**: full existing suite green UNCHANGED (regression proof). `detectPlatform()` with no env/pin = byte-identical `claudeDescriptor()`. The new precedence branches only fire on explicit opt-in.
- `HARNESSED_ROOT_OVERRIDE` stays the FIRST precedence check (e2e test isolation preserved).
- Capability-absent writes inform, never silently corrupt (codex env-key write = no-op + message, never writes JSON into config.toml).
- KARPATHY-minimal: one new descriptor + precedence branches + a boolean capability flag; no framework, no TOML writer.
- TDD red→green; tsc 0; biome preempt; NEVER `git add -A`; NEVER push without approval.

## Acceptance

1. `codexDescriptor()` returns the verified codex paths; `pluginsRegistry` is `null`; `supportsEnvKeyWrite` is `false`; `skillsDir` = `~/.agents/skills` (not `~/.codex/skills`). (unit)
2. `detectPlatform()` precedence: override-first; `HARNESSED_PLATFORM=codex` → codex; `.platform` pin → pinned; claude-first auto-probe; no env/pin + `~/.claude/` present → claude (byte-identical). (unit matrix)
3. Capability-aware resolution: `getPluginsRegistry()` null for codex + callers tolerate it; `enableAgentTeams`/`enableUserLang` no-op+inform when `supportsEnvKeyWrite=false`. (unit)
4. `setup --platform codex` routes skills→`~/.agents/skills`, commands→`~/.codex/prompts`, state→`~/.codex/harnessed`; persists the pin. (integration, tmp roots)
5. Dual-platform: claude AND codex tmp roots resolve every field correctly; idempotent probe set descriptor-derived. (integration)
6. Full existing suite green UNCHANGED (claude-default regression proof); tsc 0; biome clean. (gate)
