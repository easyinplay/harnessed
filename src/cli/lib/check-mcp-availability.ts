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
// search MCP key variables are TAVILY_API_KEY / EXA_API_KEY. Key sources probed
// in priority order mcp-config env > settings.json env > process env
// (search-mcp-keys.ts). Codex observes only process env, not actual query auth.
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

import { listCodexMcpServerMetadata } from '../../installers/lib/codexMcpServers.js'
import { isMcpServerRegistered } from '../../installers/lib/readClaudeConfig.js'
import {
  captureHostInstallContext,
  type HostInstallContext,
} from '../../platform/hostInstallContext.js'
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
const UNVERIFIED =
  'authentication not verified; approval not probed; runtime availability not verified'

export async function checkMcpAvailability(
  context: HostInstallContext = captureHostInstallContext(),
): Promise<CheckResult> {
  const isCodex = context.hostId === 'codex'
  const metadata = isCodex ? await listCodexMcpServerMetadata(context) : null
  if (isCodex && metadata === null) {
    return {
      name: CHECK_NAME,
      status: 'warn',
      message: `registration unknown (Codex CLI listing unavailable or unparseable); enablement unknown; ${UNVERIFIED}`,
    }
  }

  const installed: string[] = []
  const missing: string[] = []
  const enabled: string[] = []
  const disabled: string[] = []
  const unknown: string[] = []
  for (const s of TARGET_SERVERS) {
    const entry = metadata?.find((server) => server.name === s)
    const registered = isCodex ? entry !== undefined : await isMcpServerRegistered(s, context)
    if (!registered) {
      missing.push(s)
      continue
    }
    installed.push(s)
    if (entry?.enabled === true) enabled.push(s)
    else if (entry?.enabled === false) disabled.push(s)
    else unknown.push(s)
  }

  // 4.32.22 — key probe only for INSTALLED servers (uninstalled ≠ keyless).
  const keyless: SearchKeyProbe[] = []
  const observed: string[] = []
  for (const s of installed) {
    const probe = await probeSearchMcpKey(s, context)
    if (!probe.present) keyless.push(probe)
    else observed.push(s)
  }

  const parts: string[] = []
  if (installed.length > 0) parts.push(`registered: ${installed.join(', ')}`)
  if (missing.length > 0) parts.push(`not registered: ${missing.join(', ')}`)
  if (enabled.length > 0) parts.push(`enabled: ${enabled.join(', ')}`)
  if (disabled.length > 0) parts.push(`disabled: ${disabled.join(', ')}`)
  if (unknown.length > 0) parts.push(`enablement unknown: ${unknown.join(', ')}`)
  if (observed.length > 0) parts.push(`API key hints observed: ${observed.join(', ')}`)
  if (keyless.length > 0) {
    const label = isCodex ? 'API key not visible to this check' : 'API key missing'
    parts.push(`${label}: ${keyless.map((k) => `${k.server} → ${k.envVar}`).join(', ')}`)
  }
  parts.push(UNVERIFIED)

  // v3.9.5 — install_commands removed. Step B (`harnessed setup` install-base
  // chain) owns the install path for these manifests; doctor reports detection
  // only. If user wants to install missing MCPs, they re-run `harnessed setup`.
  const fixes: string[] = []
  if (missing.length > 0) {
    fixes.push('run `harnessed setup` to install missing MCPs via Step B (manifests/tools/)')
  }
  if (keyless.length > 0) {
    const vars = keyless.map((k) => k.envVar).join(' / ')
    // v16.0 post-close — the hint has to follow the host. On codex, `settingsPath` is
    // null and the MCP config is TOML, so `probeSearchMcpKey` can only ever answer from
    // process env there (see search-mcp-keys.ts). Naming the two claude JSON files
    // would send a codex user to edit files that have no effect on their setup.
    fixes.push(
      isCodex
        ? `export ${vars} in your shell (on codex that is the only source this check can read — its MCP config is TOML and there is no JSON settings file)`
        : `set ${vars} in the ~/.claude/settings.json "env" block (e.g. {"env": {"${keyless[0]?.envVar}": "<your-key>"}}) ` +
            `or export it in your shell; a mcpServers.<name>.env entry in ~/.claude.json also works`,
    )
  }

  return {
    name: CHECK_NAME,
    status: 'warn',
    message: parts.join('; '),
    ...(fixes.length > 0 ? { fix: fixes.join('; ') } : {}),
  }
}
