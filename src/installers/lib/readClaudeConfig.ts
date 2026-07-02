// v3.0.3 hotfix — fs-based MCP verify (replaces v3.0.2 spawn `claude mcp list`).
//
// Problem: v3.0.2 changed `mcpStdioAdd.ts` / `mcpHttpAdd.ts` / `ccPluginMarketplace.ts`
// verify step from a `claude mcp list | grep -q <name>` shell pipe to a native
// `spawn('claude', ['mcp', 'list'])` + `stdout.includes(name)` match (sister
// CHANGELOG v3.0.2 entry). User reports the spawn-based path still fails 3-way
// on Windows because `claude mcp list` cold-start exceeds the 15s timeout when
// invoked sequentially after 3 `claude mcp add` calls (warm process pool
// nearly exhausted; sister Bug 3 v3.0.2 timeout-budgeting issue, but for the
// VERIFY surface).
//
// Crucially: the underlying `claude mcp add --scope user` invocation likely
// SUCCEEDED — `~/.claude.json` is written before the verify spawn — but the
// verify spawn timed out and reported `exit -1 or '<name>' not in mcp list
// stdout: [timeout]` (literal user message). All 3 MCP installers fall in.
//
// Solution: skip the spawn entirely. Read `~/.claude.json` directly with
// `fs.readFile` + `JSON.parse` + check `mcpServers[name]`. The file is the
// authoritative source of truth (Claude Code reads it on startup); CC's
// `mcp list` is just a JSON pretty-printer over the same file.
//
// Cross-platform: pure Node fs, no shell, no spawn, no timeout risk.
// Idempotent: file-not-exists → no servers registered → return false (no throw).
// Robust: malformed JSON → return false (graceful), don't crash the installer.

import { readFile } from 'node:fs/promises'
import {
  detectPlatform,
  getMcpConfigPath,
  getPluginsRegistry,
  getSettingsPath,
} from './platform.js'

/**
 * Path to the user-global Claude Code config file written by `claude mcp add
 * --scope user` and `claude plugin install --scope user`. CC reads this on
 * startup to load the `mcpServers` map + `enabledPlugins` map.
 *
 * Delegates to the `mcpConfigPath` descriptor resolver (Phase B / D1) — `~/.claude.json`
 * IS the MCP config file. Export name preserved for existing callers/tests.
 */
export function getUserClaudeJsonPath(): string {
  return getMcpConfigPath()
}

interface UserClaudeJsonShape {
  mcpServers?: Record<string, unknown>
  enabledPlugins?: Record<string, unknown>
  [k: string]: unknown
}

/**
 * Read `~/.claude.json` and return the parsed object.
 *
 * Returns `{}` only for the two graceful conditions specified in the v3.0.3
 * verify contract:
 *   1. ENOENT — file does not exist yet (first install). Verify should report
 *      "server not registered" cleanly, not throw.
 *   2. Malformed JSON — the file exists but is corrupt. Verify should report
 *      false rather than crash; the caller's error path produces a clearer
 *      "server missing" message than a bare SyntaxError stack would.
 *
 * Any other read error (EACCES, EISDIR, etc.) is unexpected and re-thrown
 * so the installer surface them as verify-failed with the original cause
 * (no silent swallowing — anti-slop posture per CLAUDE.md karpathy heuristic).
 */
export async function readUserClaudeJson(): Promise<UserClaudeJsonShape> {
  const path = getUserClaudeJsonPath()
  let raw: string
  try {
    raw = await readFile(path, 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return {}
    throw err
  }
  try {
    const parsed = JSON.parse(raw) as UserClaudeJsonShape
    if (parsed === null || typeof parsed !== 'object') return {}
    return parsed
  } catch {
    // Malformed JSON — explicit graceful return per verify contract.
    return {}
  }
}

/**
 * v4.14.0 — codex MCP registration probe: `~/.codex/config.toml` table-header
 * existence check. A registered server appears as `[mcp_servers.<name>]` (bare)
 * or `[mcp_servers."<name>"]` (quoted — TOML quotes keys containing dots), and
 * may ALSO surface only via a sub-table (`[mcp_servers.<name>.env]`). Line-start
 * regex on the raw file — deliberately NOT a full TOML parse (findings.md 锁定
 * 决策: header 正则,零新依赖; the header line IS the registration contract).
 */
export function isMcpServerInToml(raw: string, name: string): boolean {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`^\\s*\\[mcp_servers\\.(?:${esc}|"${esc}"|'${esc}')(?:\\]|\\.)`, 'm')
  return re.test(raw)
}

/**
 * Check whether an MCP server is registered with the ACTIVE harness.
 *
 * Used by `mcpStdioAdd.ts` + `mcpHttpAdd.ts` v3.0.3 verify step in place of
 * `spawn('claude', ['mcp', 'list'])` + stdout match.
 *
 * claude → `~/.claude.json` `mcpServers[name]` exists (any truthy value).
 * codex (v4.14.0) → `~/.codex/config.toml` `[mcp_servers.<name>]` header probe.
 * Both: `false` if the file is missing, malformed, or the server is not present.
 */
export async function isMcpServerRegistered(name: string): Promise<boolean> {
  const platform = detectPlatform()
  if (platform.id === 'codex') {
    let raw: string
    try {
      raw = await readFile(platform.mcpConfigPath, 'utf8')
    } catch (err) {
      // ENOENT (first install) → not registered; other errors re-throw (sister
      // readUserClaudeJson contract — no silent swallowing of EACCES/EISDIR).
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return false
      throw err
    }
    return isMcpServerInToml(raw, name)
  }
  const config = await readUserClaudeJson()
  const servers = config.mcpServers
  if (!servers || typeof servers !== 'object') return false
  return Object.hasOwn(servers, name)
}

/**
 * Check whether a Claude Code plugin is registered.
 *
 * v3.9.8 — primary source is `~/.claude/plugins/installed_plugins.json`
 * (Claude Code v2.1.133+ authoritative plugin registry). Schema:
 *   { version: 2, plugins: { "<plugin>@<marketplace>": [ { scope, installPath, version, ... } ] } }
 *
 * Fallback to `~/.claude/settings.json.enabledPlugins` (legacy) for older
 * installs / cross-version compat. Pre-v3.9.8 code read
 * `~/.claude.json.enabledPlugins` — but that field does NOT exist there
 * (verified empirically; the field is in settings.json, not claude.json).
 *
 * Returns `true` if any registry key's left-of-`@` prefix matches `pluginName`.
 */
export async function isPluginRegistered(pluginName: string): Promise<boolean> {
  // Primary: ~/.claude/plugins/installed_plugins.json (v2 schema, Claude Code 2.1.133+).
  // Phase C / D4: codex has no plugin registry (getPluginsRegistry → null) — skip
  // this probe; the legacy settings/mcp sources below are still consulted.
  const registryPath = getPluginsRegistry()
  if (registryPath !== null) {
    try {
      const raw = await readFile(registryPath, 'utf8')
      const parsed = JSON.parse(raw) as { version?: number; plugins?: Record<string, unknown> }
      const plugins = parsed.plugins
      if (plugins && typeof plugins === 'object') {
        if (Object.hasOwn(plugins, pluginName)) return true
        if (Object.keys(plugins).some((k) => k.split('@')[0] === pluginName)) return true
      }
    } catch {
      // ENOENT / malformed → fall through to legacy probe
    }
  }

  // Legacy fallback 1: ~/.claude/settings.json.enabledPlugins
  // Legacy fallback 2: ~/.claude.json.enabledPlugins (pre-v3.9.8 read path;
  //                    kept for test mock compatibility — production v2.1.133+
  //                    doesn't actually write here, verified empirically)
  for (const path of [getSettingsPath(), getMcpConfigPath()]) {
    try {
      const raw = await readFile(path, 'utf8')
      const parsed = JSON.parse(raw) as { enabledPlugins?: Record<string, unknown> }
      const plugins = parsed.enabledPlugins
      if (plugins && typeof plugins === 'object') {
        if (Object.hasOwn(plugins, pluginName)) return true
        if (Object.keys(plugins).some((k) => k.split('@')[0] === pluginName)) return true
      }
    } catch {
      // ENOENT / malformed → try next source
    }
  }

  return false
}
