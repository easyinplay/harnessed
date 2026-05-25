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

function writeSettings(mcpServers: Record<string, unknown>): void {
  writeFileSync(join(tmpRoot, '.claude', 'settings.json'), JSON.stringify({ mcpServers }), 'utf8')
}

describe('checkMcpAvailability — v3.6.0 Phase 2 Wave 3 (all-3 / partial / none)', () => {
  it('1. all 3 target MCP servers present → status=pass + all-3 message', async () => {
    writeSettings({
      'tavily-mcp': { type: 'stdio', command: 'npx' },
      'exa-mcp': { type: 'stdio', command: 'npx' },
      'chrome-devtools': { type: 'stdio', command: 'npx' },
    })
    const { checkMcpAvailability } = await import('../../src/cli/lib/check-mcp-availability.js')
    const r = await checkMcpAvailability()
    expect(r.status).toBe('pass')
    expect(r.message).toMatch(/all 3 installed/)
  })

  it('2. partial: 1-2 of 3 present → status=warn + lists missing + per-server fix', async () => {
    writeSettings({
      'tavily-mcp': { type: 'stdio', command: 'npx' },
      // exa-mcp + chrome-devtools missing
    })
    const { checkMcpAvailability } = await import('../../src/cli/lib/check-mcp-availability.js')
    const r = await checkMcpAvailability()
    expect(r.status).toBe('warn')
    expect(r.message).toMatch(/1\/3 installed/)
    expect(r.message).toMatch(/tavily-mcp/)
    expect(r.message).toMatch(/missing:/)
    expect(r.message).toMatch(/exa-mcp/)
    expect(r.message).toMatch(/chrome-devtools/)
    expect(r.fix).toMatch(/claude mcp add/)
  })

  it('3. none of 3 present (settings.json missing entirely) → status=warn + REMEDIATION', async () => {
    // No settings.json written — readFile will ENOENT, catch path triggers
    const { checkMcpAvailability } = await import('../../src/cli/lib/check-mcp-availability.js')
    const r = await checkMcpAvailability()
    expect(r.status).toBe('warn')
    expect(r.message).toMatch(/none of 3 target MCP servers/)
    expect(r.fix).toMatch(/claude mcp add/)
    expect(r.fix).toMatch(/web-search-routing\.yaml/)
  })
})
