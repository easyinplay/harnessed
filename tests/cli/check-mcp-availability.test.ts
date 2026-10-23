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

const runHarnessArgs = vi.hoisted(() => vi.fn())
vi.mock('../../src/installers/lib/runClaudeArgs.js', () => ({
  runHarnessArgs,
  runArgs: vi.fn(),
}))

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
  vi.stubEnv('HARNESSED_PLATFORM', 'claude')
  vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '')
  runHarnessArgs.mockReset()
  runHarnessArgs.mockRejectedValue(new Error('unexpected subprocess'))
  mkdirSync(join(tmpRoot, '.claude'), { recursive: true })
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
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
  it('keeps one Codex context for native metadata and key hints after async listing drift', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    vi.stubEnv('CODEX_HOME', '/selected-native')
    writeClaudeConfig({
      'tavily-mcp': { env: { TAVILY_API_KEY: 'wrong-host-secret' } },
      'exa-mcp': { env: { EXA_API_KEY: 'wrong-host-secret' } },
    })
    runHarnessArgs.mockImplementation(async () => {
      vi.stubEnv('HARNESSED_PLATFORM', 'claude')
      vi.stubEnv('CODEX_HOME', '/drift-native')
      return {
        exitCode: 0,
        stdout: JSON.stringify([
          { name: 'tavily-mcp', enabled: false },
          { name: 'exa-mcp', enabled: true },
        ]),
        stderr: '',
      }
    })
    const { checkMcpAvailability } = await import('../../src/cli/lib/check-mcp-availability.js')
    const result = await checkMcpAvailability()
    expect(result.status).toBe('warn')
    expect(result.message).toContain('disabled: tavily-mcp')
    expect(result.message).toContain('API key not visible to this check')
    expect(result.message).not.toContain('API key hints observed')
    expectUnverified(result.message)
    expect(runHarnessArgs.mock.calls[0]?.[4]).toMatchObject({
      hostId: 'codex',
      nativeHome: '/selected-native',
    })
    expect(JSON.stringify(result)).not.toContain('wrong-host-secret')
  })
  it('1. registration plus MCP env keys is advisory, never runtime availability', async () => {
    writeClaudeConfig({
      'tavily-mcp': { type: 'stdio', command: 'npx', env: { TAVILY_API_KEY: 'tvly-x' } },
      'exa-mcp': { type: 'stdio', command: 'npx', env: { EXA_API_KEY: 'exa-x' } },
    })
    const { checkMcpAvailability } = await import('../../src/cli/lib/check-mcp-availability.js')
    const r = await checkMcpAvailability()
    expect(r.status).toBe('warn')
    expectUnverified(r.message)
    expect(r.message).toMatch(/enablement[^;.]*(?:unknown|not verified)/i)
    expect(JSON.stringify(r)).not.toMatch(/tvly-x|exa-x/)
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
    expect(r.message).toMatch(/registered[^;]*exa-mcp/)
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
    expect(r.message).toMatch(/registered[^;]*tavily-mcp/)
    expect(r.message).toMatch(/API key missing/)
    expectUnverified(r.message)
    expect(r.fix).toBe(
      'set TAVILY_API_KEY / EXA_API_KEY in the ~/.claude/settings.json "env" block (e.g. {"env": {"TAVILY_API_KEY": "<your-key>"}}) ' +
        'or export it in your shell; a mcpServers.<name>.env entry in ~/.claude.json also works',
    )
    expect(r.message).toMatch(/TAVILY_API_KEY/)
    expect(r.message).toMatch(/EXA_API_KEY/)
    expect(r.fix).toMatch(/settings\.json/)
    expect(r.fix).toMatch(/export/)
  })

  it('5. settings env keys do not verify authentication', async () => {
    writeClaudeConfig({
      'tavily-mcp': { type: 'stdio', command: 'npx' },
      'exa-mcp': { type: 'stdio', command: 'npx' },
    })
    writeSettingsEnv({ TAVILY_API_KEY: 'tvly-x', EXA_API_KEY: 'exa-x' })
    const { checkMcpAvailability } = await import('../../src/cli/lib/check-mcp-availability.js')
    const r = await checkMcpAvailability()
    expect(r.status).toBe('warn')
    expectUnverified(r.message)
  })

  it('6. process env keys do not verify authentication', async () => {
    writeClaudeConfig({
      'tavily-mcp': { type: 'stdio', command: 'npx' },
      'exa-mcp': { type: 'stdio', command: 'npx' },
    })
    process.env.TAVILY_API_KEY = 'tvly-proc'
    process.env.EXA_API_KEY = 'exa-proc'
    const { checkMcpAvailability } = await import('../../src/cli/lib/check-mcp-availability.js')
    const r = await checkMcpAvailability()
    expect(r.status).toBe('warn')
    expectUnverified(r.message)
    expect(JSON.stringify(r)).not.toMatch(/tvly-proc|exa-proc/)
  })

  it('7. one installed with key + one missing → warn mentions only the real gaps', async () => {
    writeClaudeConfig({
      'tavily-mcp': { type: 'stdio', command: 'npx', env: { TAVILY_API_KEY: 'tvly-x' } },
    })
    const { checkMcpAvailability } = await import('../../src/cli/lib/check-mcp-availability.js')
    const r = await checkMcpAvailability()
    expect(r.status).toBe('warn')
    expect(r.message).toMatch(/registered[^;]*tavily-mcp/)
    expect(r.message).toMatch(/not registered.*exa-mcp/)
    expect(r.message).not.toMatch(/TAVILY_API_KEY/)
  })

  it('Codex: env keys not observed stays warn without claiming authentication or query failure', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    runHarnessArgs.mockResolvedValue({
      exitCode: 0,
      stdout: JSON.stringify([
        { name: 'tavily-mcp', enabled: true },
        { name: 'exa-mcp', enabled: true },
      ]),
      stderr: '',
    })
    const { checkMcpAvailability } = await import('../../src/cli/lib/check-mcp-availability.js')
    const r = await checkMcpAvailability()
    expect(r.status).toBe('warn')
    expect(r.message).toMatch(/API key not visible to this check/)
    expect(r.message).toMatch(/TAVILY_API_KEY/)
    expect(r.message).toMatch(/EXA_API_KEY/)
    expectUnverified(r.message)
    expect(r.message).not.toMatch(/API key missing|will fail|authentication failed/)
    expect(r.fix).toBe(
      'export TAVILY_API_KEY / EXA_API_KEY in your shell (on codex that is the only source this check can read — its MCP config is TOML and there is no JSON settings file)',
    )
    expect(r.install_commands).toBeUndefined()
  })

  it.each([false, true])('Codex enabled=%s plus keys stays registered WARN', async (enabled) => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    process.env.TAVILY_API_KEY = 'doctor-tavily-secret'
    process.env.EXA_API_KEY = 'doctor-exa-secret'
    runHarnessArgs.mockResolvedValue({
      exitCode: 0,
      stdout: JSON.stringify([
        { name: 'tavily-mcp', enabled },
        { name: 'exa-mcp', enabled },
      ]),
      stderr: '',
    })
    const { checkMcpAvailability } = await import('../../src/cli/lib/check-mcp-availability.js')
    const r = await checkMcpAvailability()
    expect.soft(r.status).toBe('warn')
    expect.soft(r.message).toMatch(/registered[^;]*tavily-mcp/)
    expect.soft(r.message).toMatch(enabled ? /enabled/i : /disabled/i)
    expectUnverified(r.message)
    expect(r.message).not.toMatch(/not registered/)
    expect(r.fix ?? '').not.toMatch(/harnessed setup|install|mcp add|enable/i)
    expect(r.install_commands).toBeUndefined()
    expect(JSON.stringify(r)).not.toMatch(/doctor-tavily-secret|doctor-exa-secret/)
    expect(runHarnessArgs).toHaveBeenCalledTimes(1)
    expect(runHarnessArgs.mock.calls[0]?.slice(0, 2)).toEqual(['codex', ['mcp', 'list', '--json']])
  })

  it.each([
    ['CLI missing', -1, ''],
    ['malformed JSON', 0, '[{oops'],
    ['wrong payload shape', 0, '{"servers":[]}'],
  ])('Codex %s means registration UNKNOWN, not missing', async (_label, exitCode, stdout) => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    runHarnessArgs.mockResolvedValue({ exitCode, stdout, stderr: 'fixture listing failure' })
    const { checkMcpAvailability } = await import('../../src/cli/lib/check-mcp-availability.js')
    const r = await checkMcpAvailability()
    expect(r.status).toBe('warn')
    expect.soft(r.message).toMatch(/registration[^;.]*(?:unknown|not verified)/i)
    expect.soft(r.message).not.toMatch(/not registered|API key missing/i)
    expect.soft(r.fix ?? '').not.toMatch(/harnessed setup|install|mcp add/i)
    expect(r.install_commands).toBeUndefined()
  })

  it('Codex a successful empty listing is known missing, with setup advisory', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    runHarnessArgs.mockResolvedValue({ exitCode: 0, stdout: '[]', stderr: '' })
    const { checkMcpAvailability } = await import('../../src/cli/lib/check-mcp-availability.js')
    const r = await checkMcpAvailability()
    expect(r.status).toBe('warn')
    expect(r.message).toMatch(/not registered[^;]*tavily-mcp[^;]*exa-mcp/)
    expect(r.fix).toMatch(/harnessed setup/)
    expect(r.install_commands).toBeUndefined()
  })
})

function expectUnverified(message: string): void {
  expect.soft(message).toMatch(/authentication[^;.]*(?:not verified|unverified)/i)
  expect.soft(message).toMatch(/approval[^;.]*(?:not probed|unknown)/i)
  expect.soft(message).toMatch(/runtime availability[^;.]*(?:not verified|unverified)/i)
}
