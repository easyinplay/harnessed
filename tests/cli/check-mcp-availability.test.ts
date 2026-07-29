// v3.6.0 Phase 2 Wave 3 — checkMcpAvailability helper PRIMARY coverage.
// Sister Phase 3.4 W1 T1.3 check-token-budget.test.ts tmpdir + HOME redirect
// + vi.resetModules per-cell isolation pattern (real fs, NOT global mock).
//
// 4.32.21 — target set shrunk to tavily-mcp only:
//   - exa-mcp manifest deleted (ECC plugin 2.0 bundles hosted exa MCP; the
//     capability survives in capabilities.yaml with provider=ecc semantics)
//   - chrome-devtools-mcp migrated to cc-plugin-marketplace (official
//     claude-plugins-official plugin) — registered as a plugin, NOT in
//     ~/.claude.json mcpServers, so this check no longer owns it.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let tmpRoot: string
let origHome: string | undefined
let origUserprofile: string | undefined

beforeEach(() => {
  origHome = process.env.HOME
  origUserprofile = process.env.USERPROFILE
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
  rmSync(tmpRoot, { recursive: true, force: true })
})

// v3.9.5 — write to `~/.claude.json` (user-scope, sister mcpStdioAdd `--scope user`).
function writeClaudeConfig(mcpServers: Record<string, unknown>): void {
  writeFileSync(join(tmpRoot, '.claude.json'), JSON.stringify({ mcpServers }), 'utf8')
}

describe('checkMcpAvailability — 4.32.21 tavily-only target set', () => {
  it('1. tavily-mcp present → status=pass', async () => {
    writeClaudeConfig({
      'tavily-mcp': { type: 'stdio', command: 'npx' },
    })
    const { checkMcpAvailability } = await import('../../src/cli/lib/check-mcp-availability.js')
    const r = await checkMcpAvailability()
    expect(r.status).toBe('pass')
    expect(r.message).toMatch(/tavily-mcp/)
    expect(r.name).toBe('MCP servers (tavily)')
  })

  it('2. legacy exa-mcp / chrome-devtools-mcp entries do NOT satisfy the check', async () => {
    // 4.32.21 regression guard — exa-mcp is now ECC-plugin-provided and
    // chrome-devtools-mcp is plugin-distributed; stale mcpServers entries for
    // them must not mask a missing tavily-mcp.
    writeClaudeConfig({
      'exa-mcp': { type: 'stdio', command: 'npx' },
      'chrome-devtools-mcp': { type: 'stdio', command: 'npx' },
    })
    const { checkMcpAvailability } = await import('../../src/cli/lib/check-mcp-availability.js')
    const r = await checkMcpAvailability()
    expect(r.status).toBe('warn')
    expect(r.message).toMatch(/tavily-mcp/)
    // v3.9.5 — install_commands removed (Step B owns install). fix points to setup.
    expect(r.fix).toMatch(/harnessed setup/)
    expect(r.install_commands).toBeUndefined()
  })

  it('3. ~/.claude.json missing entirely → status=warn', async () => {
    // No ~/.claude.json written — isMcpServerRegistered returns false
    const { checkMcpAvailability } = await import('../../src/cli/lib/check-mcp-availability.js')
    const r = await checkMcpAvailability()
    expect(r.status).toBe('warn')
    expect(r.message).toMatch(/tavily-mcp/)
    expect(r.fix).toMatch(/harnessed setup/)
    expect(r.install_commands).toBeUndefined()
  })
})
