// v3.6.0 Phase 2 Wave 3 — checkMcpAvailability helper PRIMARY coverage.
// Sister Phase 3.4 W1 T1.3 check-token-budget.test.ts tmpdir + HOME redirect
// + vi.resetModules per-cell isolation pattern (real fs, NOT global mock).

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
// Previous version (v3.6.0 Phase 2) wrote to `~/.claude/settings.json` — wrong file;
// fixed in v3.9.5 to align with isMcpServerRegistered helper read path.
function writeClaudeConfig(mcpServers: Record<string, unknown>): void {
  writeFileSync(join(tmpRoot, '.claude.json'), JSON.stringify({ mcpServers }), 'utf8')
}

describe('checkMcpAvailability — v3.6.0 Phase 2 Wave 3 (all-3 / partial / none)', () => {
  it('1. all 3 target MCP servers present → status=pass + all-3 message', async () => {
    // v3.9.5 — server names match manifest install.cmd register names (stdio
    // + npx → `tavily-mcp` / `exa-mcp` / `chrome-devtools-mcp`).
    writeClaudeConfig({
      'tavily-mcp': { type: 'stdio', command: 'npx' },
      'exa-mcp': { type: 'stdio', command: 'npx' },
      'chrome-devtools-mcp': { type: 'stdio', command: 'npx' },
    })
    const { checkMcpAvailability } = await import('../../src/cli/lib/check-mcp-availability.js')
    const r = await checkMcpAvailability()
    expect(r.status).toBe('pass')
    expect(r.message).toMatch(/all 3 installed/)
  })

  it('2. partial: 1-2 of 3 present → status=warn + lists missing', async () => {
    writeClaudeConfig({
      'tavily-mcp': { type: 'stdio', command: 'npx' },
      // exa-mcp + chrome-devtools-mcp missing
    })
    const { checkMcpAvailability } = await import('../../src/cli/lib/check-mcp-availability.js')
    const r = await checkMcpAvailability()
    expect(r.status).toBe('warn')
    expect(r.message).toMatch(/1\/3 installed/)
    expect(r.message).toMatch(/tavily-mcp/)
    expect(r.message).toMatch(/missing:/)
    expect(r.message).toMatch(/exa-mcp/)
    expect(r.message).toMatch(/chrome-devtools-mcp/)
    // v3.9.5 — install_commands removed (Step B owns install). fix points to setup.
    expect(r.fix).toMatch(/harnessed setup/)
    expect(r.install_commands).toBeUndefined()
  })

  it('3. none of 3 present (~/.claude.json missing entirely) → status=warn', async () => {
    // No ~/.claude.json written — isMcpServerRegistered returns false for all
    const { checkMcpAvailability } = await import('../../src/cli/lib/check-mcp-availability.js')
    const r = await checkMcpAvailability()
    expect(r.status).toBe('warn')
    expect(r.message).toMatch(/none of 3 target MCP servers/)
    expect(r.fix).toMatch(/harnessed setup/)
    expect(r.install_commands).toBeUndefined()
  })
})
