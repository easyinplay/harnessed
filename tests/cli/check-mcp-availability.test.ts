// v3.6.0 Phase 2 Wave 3 — checkMcpAvailability helper PRIMARY coverage.
// Sister Phase 3.4 W1 T1.3 check-token-budget.test.ts tmpdir + HOME redirect
// + vi.resetModules per-cell isolation pattern (real fs, NOT global mock).
//
// 4.32.22 — exa-mcp RESTORED as a base component (user reversal of the 4.32.21
// deletion; the ECC-side exa was retired to opt-in and does not carry it):
//   - TARGET_SERVERS back to ['tavily-mcp', 'exa-mcp']
//   - NEW: per-server API-key detection for installed search MCPs
//     (tavily-mcp → TAVILY_API_KEY, exa-mcp → EXA_API_KEY; priority
//     mcpServers.<name>.env > settings.json env block > process env)
//   - chrome-devtools-mcp is ECC-provided (its manifest deleted 4.32.22) — a
//     stale mcpServers entry for it still must not satisfy anything (4.32.21
//     anti-fudge cell kept, adjusted to the exa-restored target set).

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let tmpRoot: string
let origHome: string | undefined
let origUserprofile: string | undefined
let origTavilyKey: string | undefined
let origExaKey: string | undefined

beforeEach(() => {
  origHome = process.env.HOME
  origUserprofile = process.env.USERPROFILE
  // 4.32.22 — key detection consults process env as the last source; the host
  // machine may genuinely have these keys set. Clear + restore per cell.
  origTavilyKey = process.env.TAVILY_API_KEY
  origExaKey = process.env.EXA_API_KEY
  delete process.env.TAVILY_API_KEY
  delete process.env.EXA_API_KEY
  tmpRoot = mkdtempSync(join(tmpdir(), 'check-mcp-avail-'))
  process.env.HOME = tmpRoot
  process.env.USERPROFILE = tmpRoot
  mkdirSync(join(tmpRoot, '.claude'), { recursive: true })
  vi.resetModules()
})

afterEach(() => {
  if (origHome === undefined) delete process.env.HOME
  else process.env.HOME = origHome
  if (origUserprofile === undefined) delete process.env.USERPROFILE
  else process.env.USERPROFILE = origUserprofile
  if (origTavilyKey === undefined) delete process.env.TAVILY_API_KEY
  else process.env.TAVILY_API_KEY = origTavilyKey
  if (origExaKey === undefined) delete process.env.EXA_API_KEY
  else process.env.EXA_API_KEY = origExaKey
  rmSync(tmpRoot, { recursive: true, force: true })
})

// v3.9.5 — write to `~/.claude.json` (user-scope, sister mcpStdioAdd `--scope user`).
function writeClaudeConfig(mcpServers: Record<string, unknown>): void {
  writeFileSync(join(tmpRoot, '.claude.json'), JSON.stringify({ mcpServers }), 'utf8')
}

function writeSettingsEnv(env: Record<string, string>): void {
  writeFileSync(join(tmpRoot, '.claude', 'settings.json'), JSON.stringify({ env }), 'utf8')
}

describe('checkMcpAvailability — 4.32.22 tavily+exa target set + API-key detection', () => {
  it('1. both present with keys in mcpServers env → status=pass', async () => {
    writeClaudeConfig({
      'tavily-mcp': { type: 'stdio', command: 'npx', env: { TAVILY_API_KEY: 'tvly-x' } },
      'exa-mcp': { type: 'stdio', command: 'npx', env: { EXA_API_KEY: 'exa-x' } },
    })
    const { checkMcpAvailability } = await import('../../src/cli/lib/check-mcp-availability.js')
    const r = await checkMcpAvailability()
    expect(r.status).toBe('pass')
    expect(r.name).toBe('MCP servers (tavily/exa)')
    expect(r.message).toMatch(/tavily-mcp/)
    expect(r.message).toMatch(/exa-mcp/)
  })

  it('2. anti-fudge kept: stale chrome-devtools-mcp entry does not count; exa counts again', async () => {
    // 4.32.21 regression guard adjusted for the restored target set —
    // chrome-devtools-mcp is ECC-provided (manifest deleted 4.32.22); a stale
    // mcpServers entry for it must not mask the missing tavily-mcp. exa-mcp is
    // a legit target again.
    writeClaudeConfig({
      'exa-mcp': { type: 'stdio', command: 'npx', env: { EXA_API_KEY: 'exa-x' } },
      'chrome-devtools-mcp': { type: 'stdio', command: 'npx' },
    })
    const { checkMcpAvailability } = await import('../../src/cli/lib/check-mcp-availability.js')
    const r = await checkMcpAvailability()
    expect(r.status).toBe('warn')
    expect(r.message).toMatch(/installed: exa-mcp/)
    expect(r.message).toMatch(/not registered.*tavily-mcp/)
    expect(r.message).not.toMatch(/chrome-devtools/)
    // v3.9.5 — install_commands removed (Step B owns install). fix points to setup.
    expect(r.fix).toMatch(/harnessed setup/)
    expect(r.install_commands).toBeUndefined()
  })

  it('3. ~/.claude.json missing entirely → status=warn (both targets missing)', async () => {
    const { checkMcpAvailability } = await import('../../src/cli/lib/check-mcp-availability.js')
    const r = await checkMcpAvailability()
    expect(r.status).toBe('warn')
    expect(r.message).toMatch(/tavily-mcp/)
    expect(r.message).toMatch(/exa-mcp/)
    expect(r.fix).toMatch(/harnessed setup/)
    expect(r.install_commands).toBeUndefined()
  })

  it('4. installed but API key nowhere → status=warn + per-server env var + remediation', async () => {
    writeClaudeConfig({
      'tavily-mcp': { type: 'stdio', command: 'npx' },
      'exa-mcp': { type: 'stdio', command: 'npx' },
    })
    const { checkMcpAvailability } = await import('../../src/cli/lib/check-mcp-availability.js')
    const r = await checkMcpAvailability()
    expect(r.status).toBe('warn')
    expect(r.message).toMatch(/TAVILY_API_KEY/)
    expect(r.message).toMatch(/EXA_API_KEY/)
    expect(r.fix).toMatch(/settings\.json/)
    expect(r.fix).toMatch(/export/)
  })

  it('5. keys via ~/.claude/settings.json env block → status=pass (source priority 2)', async () => {
    writeClaudeConfig({
      'tavily-mcp': { type: 'stdio', command: 'npx' },
      'exa-mcp': { type: 'stdio', command: 'npx' },
    })
    writeSettingsEnv({ TAVILY_API_KEY: 'tvly-x', EXA_API_KEY: 'exa-x' })
    const { checkMcpAvailability } = await import('../../src/cli/lib/check-mcp-availability.js')
    const r = await checkMcpAvailability()
    expect(r.status).toBe('pass')
  })

  it('6. keys via process env → status=pass (source priority 3)', async () => {
    writeClaudeConfig({
      'tavily-mcp': { type: 'stdio', command: 'npx' },
      'exa-mcp': { type: 'stdio', command: 'npx' },
    })
    process.env.TAVILY_API_KEY = 'tvly-proc'
    process.env.EXA_API_KEY = 'exa-proc'
    const { checkMcpAvailability } = await import('../../src/cli/lib/check-mcp-availability.js')
    const r = await checkMcpAvailability()
    expect(r.status).toBe('pass')
  })

  it('7. one installed with key + one missing → warn mentions only the real gaps', async () => {
    writeClaudeConfig({
      'tavily-mcp': { type: 'stdio', command: 'npx', env: { TAVILY_API_KEY: 'tvly-x' } },
    })
    const { checkMcpAvailability } = await import('../../src/cli/lib/check-mcp-availability.js')
    const r = await checkMcpAvailability()
    expect(r.status).toBe('warn')
    expect(r.message).toMatch(/installed: tavily-mcp/)
    expect(r.message).toMatch(/not registered.*exa-mcp/)
    expect(r.message).not.toMatch(/TAVILY_API_KEY/)
  })
})
