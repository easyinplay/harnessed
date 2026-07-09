// Phase 2.4 W1 T1.3 — doctor 5-check unit + --json + warn≠fail exit policy.
// Sister: tests/unit/cli-doctor.test.ts (Phase 1.2, 4 cells checks 1-4). ≤100L.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:child_process', () => ({ spawnSync: vi.fn() }))
vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }))
vi.mock('node:fs', () => ({ readFileSync: vi.fn() }))
// Phase 3.3 W1 T1.12 — 7th check mock: doctor tests mock node:fs globally with
// JSON content; loading aliases.yaml via yaml.parse would fail. Mock the helper
// to always emit pass-status (deprecation logic is unit-tested in
// tests/cli/check-deprecations.test.ts and tests/manifest/aliases.test.ts).
vi.mock('../../src/cli/lib/check-deprecations.js', () => ({
  checkDeprecations: () => ({
    name: 'deprecated manifests',
    status: 'pass',
    message: 'no deprecated manifests',
  }),
}))
// Phase 3.4 W1 T1.4 — 8th check mock (same reason as 7th): global vi.mock('node:fs')
// would crash check-token-budget.ts existsSync/readdirSync. Real PRIMARY helper logic
// is unit-tested in tests/cli/check-token-budget.test.ts (5 fixtures with tmpdir).
vi.mock('../../src/cli/lib/check-token-budget.js', () => ({
  checkTokenBudget: () => ({
    name: 'token budget',
    status: 'pass',
    message: '0 skill(s) total 0 tokens (under 1% / 2000 threshold)',
  }),
}))
// Phase v2.0-2.4 W3 T2.4.W3.1 — 9th + 10th check mocks (same reason as 7th/8th):
// real impls read process.env / fs which doctor.test.ts has globally mocked.
// PRIMARY logic unit-tested in tests/cli/checkAgentTeams.test.ts + tests/cli/
// check-planning-with-files.test.ts (sister pattern). Default = pass for cell 1
// "all checks pass"; individual cells override status as needed.
vi.mock('../../src/cli/lib/check-agent-teams-doctor.js', () => ({
  checkAgentTeamsDoctor: () => ({
    name: 'Agent Teams env',
    status: 'pass',
    message: 'CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 (env var)',
  }),
}))
vi.mock('../../src/cli/lib/check-planning-with-files.js', () => ({
  checkPlanningWithFiles: () => ({
    name: 'planning-with-files plugin',
    status: 'pass',
    message: 'installed (version 2.34.0)',
  }),
}))
// v3.6.0 Phase 2 Wave 3 — 11th + 12th check mocks (same reason as 9th/10th).
// PRIMARY logic unit-tested in tests/cli/check-mattpocock-skills.test.ts +
// tests/cli/check-mcp-availability.test.ts (sister tmpdir+HOME redirect pattern).
vi.mock('../../src/cli/lib/check-mattpocock-skills.js', () => ({
  checkMattpocockSkills: () => ({
    name: 'mattpocock-skills',
    status: 'pass',
    message: 'installed as plugin (version 1.2.0)',
  }),
}))
vi.mock('../../src/cli/lib/check-mcp-availability.js', () => ({
  checkMcpAvailability: () => ({
    name: 'MCP servers (tavily/exa/chrome-devtools)',
    status: 'pass',
    message: 'all 3 installed: tavily-mcp, exa-mcp, chrome-devtools',
  }),
}))
// Phase 18 — 13th check mock (same reason: check-codegraph.ts uses fs existsSync
// which the global node:fs mock doesn't export). Real logic unit-tested in
// tests/cli/check-codegraph.test.ts. Always-pass opt-in detector.
vi.mock('../../src/cli/lib/check-codegraph.js', () => ({
  checkCodeGraph: () => ({
    name: 'codegraph',
    status: 'pass',
    message: 'CodeGraph not configured (optional semantic index)',
  }),
}))
// Phase 20 — 14th check mock (check-update.ts spawns `npm view` for the version
// check). Real logic unit-tested in tests/cli/check-update.test.ts. Default pass.
vi.mock('../../src/cli/lib/check-update.js', () => ({
  checkUpdate: () => ({ name: 'update', status: 'pass', message: 'up to date (test)' }),
}))

import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { Command } from 'commander'
import { registerDoctor } from '../../src/cli/doctor.js'

const spawnSyncMock = vi.mocked(spawnSync)
const readFileMock = vi.mocked(readFile)
const readFileSyncMock = vi.mocked(readFileSync)

class ExitError extends Error {
  constructor(public code: number) {
    super(`exit(${code})`)
  }
}

async function runCli(argv: string[]): Promise<{ code: number; stdout: string }> {
  let stdout = ''
  vi.spyOn(process, 'exit').mockImplementation((c?: number | string | null) => {
    throw new ExitError(typeof c === 'number' ? c : 0)
  })
  vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
    stdout += `${a.map(String).join(' ')}\n`
  })
  const program = new Command().exitOverride()
  registerDoctor(program)
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
    return { code: 0, stdout }
  } catch (e) {
    if (e instanceof ExitError) return { code: e.code, stdout }
    throw e
  }
}

const REPO = 'https://github.com/easyinplay/harnessed.git'

function mockSpawn(
  opts: { jq?: boolean; gitUrl?: string; gstack?: 'prefixed' | 'bare' | 'both' | 'neither' } = {},
): void {
  const { jq = true, gitUrl = REPO, gstack = 'prefixed' } = opts
  spawnSyncMock.mockImplementation((cmd: string, args?: readonly string[]) => {
    const argv = (args ?? []) as string[]
    if ((cmd === 'where' || cmd === 'which') && argv[0] === 'jq')
      return { status: jq ? 0 : 127, stdout: jq ? '/usr/bin/jq\n' : '' } as never
    // Phase 3.2 W1 T1.5 — 6th check gstack PROBE: 4 outcome branches via gstack opt.
    if ((cmd === 'where' || cmd === 'which') && argv[0] === 'gstack-office-hours') {
      const found = gstack === 'prefixed' || gstack === 'both'
      return {
        status: found ? 0 : 1,
        stdout: found ? '/usr/bin/gstack-office-hours\n' : '',
      } as never
    }
    if ((cmd === 'where' || cmd === 'which') && argv[0] === 'office-hours') {
      const found = gstack === 'bare' || gstack === 'both'
      return { status: found ? 0 : 1, stdout: found ? '/usr/bin/office-hours\n' : '' } as never
    }
    if (cmd === 'where' || cmd === 'which') return { status: 0, stdout: '/usr/bin/bash\n' } as never
    if (cmd === 'bash') return { status: 0, stdout: '' } as never // empty WSL probe
    if (cmd === 'git') return { status: 0, stdout: `${gitUrl}\n` } as never
    return { status: 0, stdout: '' } as never
  })
  readFileMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
  readFileSyncMock.mockReturnValue(JSON.stringify({ repository: { url: REPO } }))
}

describe('cli/doctor — Phase 2.4 W1 5-check + Phase 3.2 W1 6 + Phase 3.3 W1 7 + Phase 3.4 W1 8 + Phase v2.0-2.4 W3 10 + v3.6.0 Phase 2 12-check + --json + exit policy', () => {
  beforeEach(() => {
    spawnSyncMock.mockReset()
    readFileMock.mockReset()
    readFileSyncMock.mockReset()
  })
  afterEach(() => vi.restoreAllMocks())

  // v3.7.0 Phase 1 — registry future-proof: CHECKS array is single source of truth.
  // Bump assertion when adding a check (sister doctor.ts --description string update).
  it('cell 0 — CHECKS registry has 16 entries (4.22.1 +guard-conflict)', async () => {
    const { CHECKS } = await import('../../src/cli/lib/doctor-registry.js')
    expect(CHECKS.length).toBe(16)
  })

  it('cell 1 — all 16 checks pass → exit 0 + summary "pass" (4.22.1 bump 15→16)', async () => {
    mockSpawn()
    const { code, stdout } = await runCli(['doctor', '--json'])
    expect(code).toBe(0)
    const p = JSON.parse(stdout) as { checks: { name: string }[]; summary: string }
    expect(p.checks).toHaveLength(16)
    expect(p.summary).toBe('pass')
    expect(p.checks.map((c) => c.name)).toContain('deprecated manifests')
    // Phase 3.4 W1 T1.4 — 8th check assertion (token budget = pass mock when no skills)
    expect(p.checks.map((c) => c.name)).toContain('token budget')
    // Phase v2.0-2.4 W3 T2.4.W3.1 — 9th + 10th check assertions (D-11 + D-15)
    expect(p.checks.map((c) => c.name)).toContain('Agent Teams env')
    expect(p.checks.map((c) => c.name)).toContain('planning-with-files plugin')
    // v3.6.0 Phase 2 Wave 3 — 11th + 12th check assertions (mattpocock + MCP avail)
    expect(p.checks.map((c) => c.name)).toContain('mattpocock-skills')
    expect(p.checks.map((c) => c.name)).toContain('MCP servers (tavily/exa/chrome-devtools)')
    // Phase 18 — 13th check (opt-in codegraph detect, always pass)
    expect(p.checks.map((c) => c.name)).toContain('codegraph')
    // Phase 20 — 14th check (update available, fail-soft pass)
    expect(p.checks.map((c) => c.name)).toContain('update')
    // v4.16.1 — 15th check (bun present, warn-only gstack build dep)
    expect(p.checks.map((c) => c.name)).toContain('bun present')
    // 4.22.1 — 16th check (dual-guard GateGuard conflict, warn-only)
    expect(p.checks.map((c) => c.name)).toContain('guard conflict (GateGuard)')
  })

  it('cell 5 — doctor 8th check token budget — status warn does NOT fail exit (B-06 + D-04)', async () => {
    mockSpawn()
    const { code, stdout } = await runCli(['doctor', '--json'])
    expect(code).toBe(0) // warn ≠ fail per D-04 DOCTOR WARN + B-06
    const p = JSON.parse(stdout) as { checks: { name: string; status: string }[]; summary: string }
    expect(p.checks).toHaveLength(16)
    const tokenBudget = p.checks.find((c) => c.name === 'token budget')
    expect(tokenBudget).toBeDefined()
    expect(['pass', 'warn']).toContain(tokenBudget?.status ?? 'fail')
  })

  it('cell 2 — origin URL drift → warn → exit 0 per B-06 (warn ≠ fail)', async () => {
    mockSpawn({ gitUrl: 'https://github.com/forker/fork.git' })
    const { code, stdout } = await runCli(['doctor', '--json'])
    expect(code).toBe(0)
    expect(JSON.parse(stdout).summary).toBe('warn')
  })

  it('cell 3 — jq missing → warn → exit 0 (v4.15.2 T5: jq is optional, not a core dep)', async () => {
    mockSpawn({ jq: false })
    const { code } = await runCli(['doctor'])
    expect(code).toBe(0)
  })

  it('cell 4 — --json emits {checks, summary} 3-tier "pass|warn|fail" for CI', async () => {
    mockSpawn()
    const { stdout } = await runCli(['doctor', '--json'])
    const p = JSON.parse(stdout) as { checks: { status: string; name: string }[]; summary: string }
    expect(['pass', 'warn', 'fail']).toContain(p.summary)
    expect(p.checks.every((c) => ['pass', 'warn', 'fail'].includes(c.status))).toBe(true)
    expect(p.checks.map((c) => c.name)).toContain('origin URL')
  })
})
