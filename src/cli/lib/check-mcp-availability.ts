// v3.6.0 Phase 2 Wave 2 — 12th doctor check (3 MCP server availability per
// audit P1a "MCP 自动探测 + fallback hint").
//
// v3.9.5 — Major correctness fix:
//   1. Reads `~/.claude.json` user-scope mcpServers (via isMcpServerRegistered
//      helper) — NOT `~/.claude/settings.json`. Step B `mcpStdioAdd` writes to
//      `~/.claude.json` (v3.0.2 hotfix scope flip per src/installers/
//      ccPluginMarketplace.ts L4-5 same scope). v3.6.0 SPEC assumed wrong file
//      → false-missing reports even after install.
//   2. TARGET_SERVERS aligned with manifest install cmd register names
//      (tavily-mcp / exa-mcp / chrome-devtools-mcp — see manifests/tools/*.yaml
//      `install.cmd` second-to-last token). v3.9.1 / v3.9.3 SPEC versions
//      (tavily-remote-mcp / exa / chrome-devtools) didn't match Step B's
//      actual register names.
//   3. install_commands removed — Step B now installs these (PHASE_21 set
//      removed in v3.9.5). doctor reports detection only; auto-install no
//      longer needs to re-prompt MCP since Step B owns the install.
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

// v3.9.5 — TARGET_SERVERS match manifests/tools/{tavily,exa,chrome-devtools}-mcp.yaml
// `install.cmd` register name verbatim (the token immediately after `mcp add ...
// --transport stdio <name> --`).
const TARGET_SERVERS = ['tavily-mcp', 'exa-mcp', 'chrome-devtools-mcp'] as const

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
      name: 'MCP servers (tavily/exa/chrome-devtools)',
      status: 'pass',
      message: `all 3 installed: ${installed.join(', ')}`,
    }
  }

  // v3.9.5 — install_commands removed. Step B (`harnessed setup` install-base
  // chain) now owns the install path for these manifests (PHASE_21 deferred
  // skip removed); doctor reports detection only. If user wants to install
  // missing MCPs, they re-run `harnessed setup` and Step B handles it.
  if (installed.length === 0) {
    return {
      name: 'MCP servers (tavily/exa/chrome-devtools)',
      status: 'warn',
      message: 'none of 3 target MCP servers registered in ~/.claude.json',
      fix: 'run `harnessed setup` to install via Step B (manifests/tools/{tavily,exa,chrome-devtools}-mcp.yaml)',
    }
  }

  return {
    name: 'MCP servers (tavily/exa/chrome-devtools)',
    status: 'warn',
    message: `${installed.length}/3 installed: ${installed.join(', ')}; missing: ${missing.join(', ')}`,
    fix: 'run `harnessed setup` to install missing MCPs via Step B',
  }
}
