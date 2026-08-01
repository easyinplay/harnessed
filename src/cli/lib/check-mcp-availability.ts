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
// 4.32.22 — exa-mcp RESTORED to the target set (user reversal of the 4.32.21
// deletion: "exa 我觉得还是需要的"; the ECC-side exa was retired to opt-in and
// does not carry the capability). PLUS per-server API-key detection: both
// search MCPs silently fail at query time without their key (tavily-mcp →
// TAVILY_API_KEY, exa-mcp → EXA_API_KEY). Key sources probed in priority
// order mcp-config env > settings.json env > process env (search-mcp-keys.ts).
// chrome-devtools-mcp stays OUT of this check (4.32.22 final: provider is
// either/or — ecc (bonus tier) or the optional self-install manifest
// manifests/optional/chrome-devtools-mcp.yaml; not a base component, and
// ecc-overlapping entries are flagged by the doctor `ecc` check instead).
// The exclusion is deliberate and stays: a base-MCP "not registered" warn would
// be wrong for an either/or optional provider. Reporting the zero-provider case
// belongs to the `ecc` check (src/cli/lib/check-ecc.ts), which reads the shared
// src/cli/lib/probe-chrome-devtools.ts probe.
//
// Distinct from existing `checkMcpScope` which checks scope hygiene (project
// vs user — CC #54803 risk); this check is server-by-server availability.

import { isMcpServerRegistered } from '../../installers/lib/readClaudeConfig.js'
import { probeSearchMcpKey, SEARCH_MCP_KEY_VARS, type SearchKeyProbe } from './search-mcp-keys.js'

interface CheckResult {
  name: string
  status: 'pass' | 'warn' | 'fail'
  message: string
  fix?: string
  install_commands?: readonly string[]
}

// TARGET_SERVERS match the mcp-stdio-add manifests under manifests/tools/
// (`install.cmd` register name verbatim — the token immediately after
// `mcp add ... --transport stdio <name> --`). Single source of truth is the
// key-var map (4.32.22 — target set === key-checked set).
const TARGET_SERVERS = Object.keys(SEARCH_MCP_KEY_VARS)

const CHECK_NAME = 'MCP servers (tavily/exa)'

export async function checkMcpAvailability(): Promise<CheckResult> {
  // v3.9.5 — read ~/.claude.json via shared helper (sister Step B writes
  // there too via mcpStdioAdd --scope user, sister ccPluginMarketplace.ts).
  const installed: string[] = []
  const missing: string[] = []
  for (const s of TARGET_SERVERS) {
    if (await isMcpServerRegistered(s)) installed.push(s)
    else missing.push(s)
  }

  // 4.32.22 — key probe only for INSTALLED servers (uninstalled ≠ keyless).
  const keyless: SearchKeyProbe[] = []
  for (const s of installed) {
    const probe = await probeSearchMcpKey(s)
    if (!probe.present) keyless.push(probe)
  }

  if (missing.length === 0 && keyless.length === 0) {
    return {
      name: CHECK_NAME,
      status: 'pass',
      message: `installed: ${installed.join(', ')} (API keys configured)`,
    }
  }

  const parts: string[] = []
  if (installed.length > 0) parts.push(`installed: ${installed.join(', ')}`)
  if (missing.length > 0) parts.push(`not registered: ${missing.join(', ')}`)
  if (keyless.length > 0) {
    parts.push(`API key missing: ${keyless.map((k) => `${k.server} → ${k.envVar}`).join(', ')}`)
  }

  // v3.9.5 — install_commands removed. Step B (`harnessed setup` install-base
  // chain) owns the install path for these manifests; doctor reports detection
  // only. If user wants to install missing MCPs, they re-run `harnessed setup`.
  const fixes: string[] = []
  if (missing.length > 0) {
    fixes.push('run `harnessed setup` to install missing MCPs via Step B (manifests/tools/)')
  }
  if (keyless.length > 0) {
    const vars = keyless.map((k) => k.envVar).join(' / ')
    fixes.push(
      `set ${vars} in the ~/.claude/settings.json "env" block (e.g. {"env": {"${keyless[0]?.envVar}": "<your-key>"}}) ` +
        `or export it in your shell; a mcpServers.<name>.env entry in ~/.claude.json also works`,
    )
  }

  return {
    name: CHECK_NAME,
    status: 'warn',
    message: parts.join('; '),
    fix: fixes.join('; '),
  }
}
