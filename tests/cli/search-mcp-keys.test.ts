// 4.32.22 — search-mcp-keys helper PRIMARY coverage (shared by the doctor
// check-mcp-availability key probe + the setup tail hint).
// Sister check-mcp-availability.test.ts tmpdir + HOME redirect + vi.resetModules.
//
// Key-source priority contract (per user ruling):
//   1. mcpServers.<name>.env in the harness MCP config (~/.claude.json)
//   2. ~/.claude/settings.json top-level `env` block
//   3. process env
// Missing everywhere → present:false (consumer decides warn/hint).

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
  origTavilyKey = process.env.TAVILY_API_KEY
  origExaKey = process.env.EXA_API_KEY
  delete process.env.TAVILY_API_KEY
  delete process.env.EXA_API_KEY
  tmpRoot = mkdtempSync(join(tmpdir(), 'search-mcp-keys-'))
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

function writeClaudeConfig(mcpServers: Record<string, unknown>): void {
  writeFileSync(join(tmpRoot, '.claude.json'), JSON.stringify({ mcpServers }), 'utf8')
}

function writeSettingsEnv(env: Record<string, string>): void {
  writeFileSync(join(tmpRoot, '.claude', 'settings.json'), JSON.stringify({ env }), 'utf8')
}

describe('probeSearchMcpKey — source priority', () => {
  it('mcpServers.<name>.env wins (source=mcp-env) even when settings + process also set', async () => {
    writeClaudeConfig({
      'tavily-mcp': { type: 'stdio', command: 'npx', env: { TAVILY_API_KEY: 'tvly-mcp' } },
    })
    writeSettingsEnv({ TAVILY_API_KEY: 'tvly-settings' })
    process.env.TAVILY_API_KEY = 'tvly-proc'
    const { probeSearchMcpKey } = await import('../../src/cli/lib/search-mcp-keys.js')
    const p = await probeSearchMcpKey('tavily-mcp')
    expect(p).toEqual({
      server: 'tavily-mcp',
      envVar: 'TAVILY_API_KEY',
      present: true,
      source: 'mcp-env',
    })
  })

  it('settings.json env block is source 2 (source=settings-env)', async () => {
    writeClaudeConfig({ 'exa-mcp': { type: 'stdio', command: 'npx' } })
    writeSettingsEnv({ EXA_API_KEY: 'exa-settings' })
    process.env.EXA_API_KEY = 'exa-proc'
    const { probeSearchMcpKey } = await import('../../src/cli/lib/search-mcp-keys.js')
    const p = await probeSearchMcpKey('exa-mcp')
    expect(p.present).toBe(true)
    expect(p.source).toBe('settings-env')
  })

  it('process env is the last source (source=process-env)', async () => {
    writeClaudeConfig({ 'exa-mcp': { type: 'stdio', command: 'npx' } })
    process.env.EXA_API_KEY = 'exa-proc'
    const { probeSearchMcpKey } = await import('../../src/cli/lib/search-mcp-keys.js')
    const p = await probeSearchMcpKey('exa-mcp')
    expect(p.present).toBe(true)
    expect(p.source).toBe('process-env')
  })

  it('key nowhere (empty-string values do not count) → present:false', async () => {
    writeClaudeConfig({
      'tavily-mcp': { type: 'stdio', command: 'npx', env: { TAVILY_API_KEY: '' } },
    })
    writeSettingsEnv({})
    const { probeSearchMcpKey } = await import('../../src/cli/lib/search-mcp-keys.js')
    const p = await probeSearchMcpKey('tavily-mcp')
    expect(p.present).toBe(false)
    expect(p.source).toBeUndefined()
  })
})

describe('searchMcpKeyHintLines — setup tail hint', () => {
  it('installed server without key → header + one line per missing key (en text)', async () => {
    process.env.HARNESSED_LANG = 'en'
    writeClaudeConfig({
      'tavily-mcp': { type: 'stdio', command: 'npx' },
      'exa-mcp': { type: 'stdio', command: 'npx' },
    })
    const { searchMcpKeyHintLines } = await import('../../src/cli/lib/search-mcp-keys.js')
    const lines = await searchMcpKeyHintLines()
    delete process.env.HARNESSED_LANG
    expect(lines.length).toBe(3) // header + tavily + exa
    expect(lines.join('\n')).toMatch(/TAVILY_API_KEY/)
    expect(lines.join('\n')).toMatch(/EXA_API_KEY/)
    expect(lines.join('\n')).toMatch(/settings\.json/)
  })

  it('server not installed → no hint for it (uninstalled ≠ misconfigured)', async () => {
    process.env.HARNESSED_LANG = 'en'
    writeClaudeConfig({ 'tavily-mcp': { type: 'stdio', command: 'npx' } })
    const { searchMcpKeyHintLines } = await import('../../src/cli/lib/search-mcp-keys.js')
    const lines = await searchMcpKeyHintLines()
    delete process.env.HARNESSED_LANG
    expect(lines.join('\n')).toMatch(/TAVILY_API_KEY/)
    expect(lines.join('\n')).not.toMatch(/EXA_API_KEY/)
  })

  it('all keys configured → empty array (no noise)', async () => {
    writeClaudeConfig({
      'tavily-mcp': { type: 'stdio', command: 'npx', env: { TAVILY_API_KEY: 'tvly-x' } },
    })
    const { searchMcpKeyHintLines } = await import('../../src/cli/lib/search-mcp-keys.js')
    const lines = await searchMcpKeyHintLines()
    expect(lines).toEqual([])
  })
})
