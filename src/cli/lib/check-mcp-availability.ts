// v3.6.0 Phase 2 Wave 2 — 12th doctor check (MCP server availability per
// audit P1a "MCP 自动探测 + fallback hint").
//
// v3.9.5 — Major correctness fix:
//   1. Reads `~/.claude.json` user-scope mcpServers (via isMcpServerRegistered
//      helper) — NOT `~/.claude/settings.json`. Step B `mcpStdioAdd` writes to
//      `~/.claude.json` (v3.0.2 hotfix scope flip per src/installers/
//      ccPluginMarketplace.ts L4-5 same scope).
//   2. install_commands removed — Step B now installs these (PHASE_21 set
//      removed in v3.9.5). doctor reports detection only.
//
// 4.32.21 — TARGET_SERVERS shrunk to tavily-mcp only:
//   - exa-mcp manifest deleted; the exa capability is now provided by the ECC
//     plugin (optional) hosted exa MCP — not a ~/.claude.json mcpServers entry.
//   - chrome-devtools-mcp migrated to cc-plugin-marketplace (official
//     claude-plugins-official plugin) — plugin-registered, not mcpServers.
//   Only mcp-stdio-add manifests under manifests/tools/ remain in scope here.
//
// Distinct from existing `checkMcpScope` which checks scope hygiene (project
// vs user — CC #54803 risk); this check is server-by-server availability.

import { isMcpServerRegistered } from '../../installers/lib/readClaudeConfig.js'

interface CheckResult {
  name: string
  status: 'pass' | 'warn' | 'fail'
  message: string
  fix?: string
  install_commands?: readonly string[]
}

// 4.32.21 — TARGET_SERVERS match the mcp-stdio-add manifests under
// manifests/tools/ (`install.cmd` register name verbatim — the token
// immediately after `mcp add ... --transport stdio <name> --`).
const TARGET_SERVERS = ['tavily-mcp'] as const

const CHECK_NAME = 'MCP servers (tavily)'

export async function checkMcpAvailability(): Promise<CheckResult> {
  // v3.9.5 — read ~/.claude.json via shared helper (sister Step B writes
  // there too via mcpStdioAdd --scope user, sister ccPluginMarketplace.ts).
  const installed: string[] = []
  const missing: string[] = []
  for (const s of TARGET_SERVERS) {
    const present = await isMcpServerRegistered(s)
    if (present) {
      installed.push(s)
    } else {
      missing.push(s)
    }
  }

  if (missing.length === 0) {
    return {
      name: CHECK_NAME,
      status: 'pass',
      message: `installed: ${installed.join(', ')}`,
    }
  }

  // v3.9.5 — install_commands removed. Step B (`harnessed setup` install-base
  // chain) owns the install path for these manifests; doctor reports detection
  // only. If user wants to install missing MCPs, they re-run `harnessed setup`.
  if (installed.length === 0) {
    return {
      name: CHECK_NAME,
      status: 'warn',
      message: `not registered in ~/.claude.json: ${missing.join(', ')}`,
      fix: 'run `harnessed setup` to install via Step B (manifests/tools/tavily-mcp.yaml)',
    }
  }

  return {
    name: CHECK_NAME,
    status: 'warn',
    message: `${installed.length}/${TARGET_SERVERS.length} installed: ${installed.join(', ')}; missing: ${missing.join(', ')}`,
    fix: 'run `harnessed setup` to install missing MCPs via Step B',
  }
}
