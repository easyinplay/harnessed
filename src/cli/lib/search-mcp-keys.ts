// 4.32.22 — search-MCP API-key detection, shared by the doctor
// check-mcp-availability probe and the setup tail hint.
//
// Observes TAVILY_API_KEY / EXA_API_KEY in the sources below; this is not an
// authentication or query probe. An unobserved key does not prove tool failure.
// Presence is resolved by source priority (user ruling):
//   1. `mcpServers.<name>.env` block in the harness MCP config (~/.claude.json)
//   2. `~/.claude/settings.json` top-level `env` block (Claude Code injects it
//      into spawned processes)
//   3. process env (OS/shell export)
// codex note: its MCP/settings config is TOML (~/.codex/config.toml), so only the
// process-env source applies there. Source 1 used to reach that conclusion by reading
// config.toml and letting JSON.parse fail; since the v16.0 close `readUserClaudeJson`
// returns `{}` on codex WITHOUT opening it (ADR 0041 — the file holds credentials).
// Source 2 was already skipped (`settingsPath === null`). The key hint is advisory.

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { t } from '../../i18n/index.js'
import { isMcpServerRegistered, readUserClaudeJson } from '../../installers/lib/readClaudeConfig.js'
import {
  captureHostInstallContext,
  type HostInstallContext,
} from '../../platform/hostInstallContext.js'

/** Target search MCP servers → the env var each reads its API key from. */
export const SEARCH_MCP_KEY_VARS: Readonly<Record<string, string>> = {
  'tavily-mcp': 'TAVILY_API_KEY',
  'exa-mcp': 'EXA_API_KEY',
}

export type SearchKeySource = 'mcp-env' | 'settings-env' | 'process-env'

export interface SearchKeyProbe {
  server: string
  envVar: string
  present: boolean
  source?: SearchKeySource
}

function nonEmpty(v: unknown): v is string {
  return typeof v === 'string' && v.trim() !== ''
}

/** Probe one server's API key across the 3 sources (priority order above). */
export async function probeSearchMcpKey(
  server: string,
  context: HostInstallContext = captureHostInstallContext(),
): Promise<SearchKeyProbe> {
  const envVar = SEARCH_MCP_KEY_VARS[server]
  if (!envVar) return { server, envVar: '', present: false }

  // 1. mcpServers.<name>.env in the harness MCP config.
  try {
    const cfg = await readUserClaudeJson(context)
    const entry = cfg.mcpServers?.[server] as { env?: Record<string, unknown> } | undefined
    if (entry?.env && nonEmpty(entry.env[envVar])) {
      return { server, envVar, present: true, source: 'mcp-env' }
    }
  } catch {
    // unreadable config → next source
  }

  // 2. settings.json top-level env block.
  try {
    // v16.0 Phase 63 — null (codex: no JSON settings file) → empty, next source.
    const path = context.hostId === 'codex' ? null : join(context.nativeHome, 'settings.json')
    const raw = path === null ? '{}' : await readFile(path, 'utf8')
    const parsed = JSON.parse(raw) as { env?: Record<string, unknown> }
    if (parsed?.env && nonEmpty(parsed.env[envVar])) {
      return { server, envVar, present: true, source: 'settings-env' }
    }
  } catch {
    // missing / TOML (codex) / malformed → next source
  }

  // 3. process env.
  if (nonEmpty(process.env[envVar])) {
    return { server, envVar, present: true, source: 'process-env' }
  }

  return { server, envVar, present: false }
}

/** Installed-but-keyless search MCPs (uninstalled servers are NOT reported —
 *  uninstalled ≠ misconfigured; install gaps belong to the availability check). */
export async function missingSearchMcpKeys(
  context: HostInstallContext = captureHostInstallContext(),
): Promise<SearchKeyProbe[]> {
  const out: SearchKeyProbe[] = []
  for (const server of Object.keys(SEARCH_MCP_KEY_VARS)) {
    if (!(await isMcpServerRegistered(server, context))) continue
    const probe = await probeSearchMcpKey(server, context)
    if (!probe.present) out.push(probe)
  }
  return out
}

/** i18n'd setup tail-hint lines: header + one line per missing key.
 *  Empty array when nothing is missing (print nothing — no noise). */
export async function searchMcpKeyHintLines(
  context: HostInstallContext = captureHostInstallContext(),
): Promise<string[]> {
  const missing = await missingSearchMcpKeys(context)
  if (missing.length === 0) return []
  const isCodex = context.hostId === 'codex'
  const lines = [t(isCodex ? 'setup.search_key_hint.header_codex' : 'setup.search_key_hint.header')]
  const lineKey = isCodex ? 'setup.search_key_hint.line_codex' : 'setup.search_key_hint.line'
  for (const m of missing) {
    lines.push(t(lineKey, { server: m.server, envVar: m.envVar }))
  }
  return lines
}
