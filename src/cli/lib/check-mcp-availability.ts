// v3.6.0 Phase 2 Wave 2 — 12th doctor check (3 MCP server availability per
// audit-harnessed-vs-user-rules-2026-05-25.md P1a "MCP 自动探测 + fallback
// hint"). Reads ~/.claude/settings.json (NOT ~/.claude.json — user-scope
// settings), checks if tavily-mcp / exa-mcp / chrome-devtools-mcp are
// declared in the `mcpServers` block.
//
// Distinct from existing `checkMcpScope` which checks scope hygiene (project
// vs user — CC #54803 risk); this check is server-by-server availability.
// Substring match accepts forks/aliases (e.g. `tavily-mcp-fork` matches
// `tavily-mcp` — still functionally compatible per harnessed web-search
// routing).
//
// Missing → warn (non-blocking per R2.4.1 warn ≠ fail). harnessed routes
// web-search to tavily/exa per workflows/judgments/web-search-routing.yaml —
// without them, falls back to WebFetch/WebSearch built-in (degraded but functional).

import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

interface CheckResult {
  name: string
  status: 'pass' | 'warn' | 'fail'
  message: string
  fix?: string
  install_commands?: readonly string[]
}

const TARGET_SERVERS = ['tavily-mcp', 'exa-mcp', 'chrome-devtools'] as const

// v3.9.1 — per-server install command (different transport / source per server).
// Map key = TARGET_SERVERS entry; value = single-step install (each entry runs
// independently in install chain — order does not matter for MCP add).
const SERVER_INSTALL_COMMANDS: Record<(typeof TARGET_SERVERS)[number], string> = {
  'tavily-mcp': 'claude mcp add tavily-remote-mcp --transport http https://mcp.tavily.com/mcp/',
  'exa-mcp': 'claude mcp add --transport http exa https://mcp.exa.ai/mcp',
  // chrome-devtools: official Claude marketplace direct install (v3.9.2 dogfood
  // confirmed — was assumed npx in v3.9.1 SPEC, corrected to official marketplace).
  'chrome-devtools': 'claude plugin install chrome-devtools-mcp',
}

type TargetServer = (typeof TARGET_SERVERS)[number]

export async function checkMcpAvailability(): Promise<CheckResult> {
  const settingsPath = join(homedir(), '.claude', 'settings.json')
  let installed: TargetServer[] = []
  let missing: TargetServer[] = [...TARGET_SERVERS]

  try {
    const raw = await readFile(settingsPath, 'utf8')
    const parsed = JSON.parse(raw) as { mcpServers?: Record<string, unknown> }
    const servers = parsed.mcpServers ?? {}
    const serverNames = Object.keys(servers)
    installed = TARGET_SERVERS.filter((s) =>
      serverNames.some((n) => n.includes(s) || s.includes(n)),
    )
    missing = TARGET_SERVERS.filter((s) => !installed.includes(s))
  } catch {
    // settings.json missing or malformed — all 3 effectively missing.
    // Keep installed=[] and missing=[...TARGET_SERVERS] defaults.
  }

  if (missing.length === 0) {
    return {
      name: 'MCP servers (tavily/exa/chrome-devtools)',
      status: 'pass',
      message: `all 3 installed: ${installed.join(', ')}`,
    }
  }

  // Build per-server install command list for the missing subset (covers both
  // none-installed and partial-installed cases — sister single source of truth).
  const installCommands = missing.map((s) => SERVER_INSTALL_COMMANDS[s])

  if (installed.length === 0) {
    return {
      name: 'MCP servers (tavily/exa/chrome-devtools)',
      status: 'warn',
      message: 'none of 3 target MCP servers installed in ~/.claude/settings.json',
      fix:
        'install via per-server transport-specific command (see install_commands); ' +
        'harnessed routes web-search to tavily/exa per workflows/judgments/web-search-routing.yaml — ' +
        'without them, falls back to WebFetch/WebSearch built-in (degraded but functional)',
      install_commands: installCommands,
    }
  }

  return {
    name: 'MCP servers (tavily/exa/chrome-devtools)',
    status: 'warn',
    message: `${installed.length}/3 installed: ${installed.join(', ')}; missing: ${missing.join(', ')}`,
    fix: `install missing via per-server command (see install_commands): ${missing.join(', ')}`,
    install_commands: installCommands,
  }
}
