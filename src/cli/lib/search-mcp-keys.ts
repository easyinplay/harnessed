// 4.32.22 — search-MCP API-key detection, shared by the doctor
// check-mcp-availability probe and the setup tail hint.
//
// Both search MCPs read their key from the server process env at query time
// (tavily-mcp → TAVILY_API_KEY, exa-mcp → EXA_API_KEY); an installed server
// without its key silently fails on first use. Presence is resolved by source
// priority (user ruling):
//   1. `mcpServers.<name>.env` block in the harness MCP config (~/.claude.json)
//   2. `~/.claude/settings.json` top-level `env` block (Claude Code injects it
//      into spawned processes)
//   3. process env (OS/shell export)
// codex note: its MCP/settings config is TOML (~/.codex/config.toml); sources
// 1-2 degrade gracefully there (JSON parse fails → skipped) and only the
// process-env source applies. Good enough — the key hint is advisory.

import { readFile } from 'node:fs/promises'
import { t } from '../../i18n/index.js'
import { isMcpServerRegistered, readUserClaudeJson } from '../../installers/lib/readClaudeConfig.js'
import { getSettingsPath } from '../../platform/platform.js'

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
export async function probeSearchMcpKey(server: string): Promise<SearchKeyProbe> {
  const envVar = SEARCH_MCP_KEY_VARS[server]
  if (!envVar) return { server, envVar: '', present: false }

  // 1. mcpServers.<name>.env in the harness MCP config.
  try {
    const cfg = await readUserClaudeJson()
    const entry = cfg.mcpServers?.[server] as { env?: Record<string, unknown> } | undefined
    if (entry?.env && nonEmpty(entry.env[envVar])) {
      return { server, envVar, present: true, source: 'mcp-env' }
    }
  } catch {
    // unreadable config → next source
  }

  // 2. settings.json top-level env block.
  try {
    const raw = await readFile(getSettingsPath(), 'utf8')
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
export async function missingSearchMcpKeys(): Promise<SearchKeyProbe[]> {
  const out: SearchKeyProbe[] = []
  for (const server of Object.keys(SEARCH_MCP_KEY_VARS)) {
    if (!(await isMcpServerRegistered(server))) continue
    const probe = await probeSearchMcpKey(server)
    if (!probe.present) out.push(probe)
  }
  return out
}

/** i18n'd setup tail-hint lines: header + one line per missing key.
 *  Empty array when nothing is missing (print nothing — no noise). */
export async function searchMcpKeyHintLines(): Promise<string[]> {
  const missing = await missingSearchMcpKeys()
  if (missing.length === 0) return []
  const lines = [t('setup.search_key_hint.header')]
  for (const m of missing) {
    lines.push(t('setup.search_key_hint.line', { server: m.server, envVar: m.envVar }))
  }
  return lines
}
