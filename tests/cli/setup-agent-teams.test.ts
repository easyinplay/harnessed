// Phase v2.0-2.3 W1.1 — setup.ts Agent Teams env probe + Pure bundled highlight tests.
// Covers R20.11 acceptance e (setup wire) + R20.1 (Pure bundled distribution).
// vi.mock checkAgentTeams to simulate both 'missing' (warn path) and 'pass' (silent) states.
// Sister tests/cli/setup.test.ts pattern (Step A + Step B happy-path mocks).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs/promises', () => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
  stat: vi.fn(),
  cp: vi.fn(),
}))

vi.mock('../../src/installers/index.js', () => ({
  runInstall: vi.fn(),
}))

vi.mock('../../src/manifest/validate.js', () => ({
  validateManifestFile: vi.fn(),
}))

vi.mock('../../src/cli/lib/checkAgentTeams.js', () => ({
  checkAgentTeams: vi.fn(),
}))

import { cp, readdir, readFile, stat } from 'node:fs/promises'
import { Command } from 'commander'
import { checkAgentTeams } from '../../src/cli/lib/checkAgentTeams.js'
import { registerSetup } from '../../src/cli/setup.js'
import { runInstall } from '../../src/installers/index.js'
import { validateManifestFile } from '../../src/manifest/validate.js'

const readdirMock = vi.mocked(readdir)
const statMock = vi.mocked(stat)
const cpMock = vi.mocked(cp)
const readFileMock = vi.mocked(readFile)
const runInstallMock = vi.mocked(runInstall)
const validateManifestFileMock = vi.mocked(validateManifestFile)
const checkAgentTeamsMock = vi.mocked(checkAgentTeams)

class ExitError extends Error {
  constructor(public code: number) {
    super(`exit(${code})`)
  }
}

async function runCli(argv: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  let stdout = ''
  let stderr = ''
  vi.spyOn(process, 'exit').mockImplementation((c?: number | string | null) => {
    throw new ExitError(typeof c === 'number' ? c : 0)
  })
  vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
    stdout += `${a.map(String).join(' ')}\n`
  })
  vi.spyOn(console, 'warn').mockImplementation((...a: unknown[]) => {
    stderr += `${a.map(String).join(' ')}\n`
  })
  vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => {
    stderr += `${a.map(String).join(' ')}\n`
  })
  const program = new Command().exitOverride()
  registerSetup(program)
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
    return { code: 0, stdout, stderr }
  } catch (e) {
    if (e instanceof ExitError) return { code: e.code, stdout, stderr }
    throw e
  }
}

/** Minimal happy-path mocks so setup runs to completion. */
function setupHappyPathMocks() {
  // Phase v3.0-3.3 T3.3.W0.12: 'execute-task' deprecated → use 'research' (flat keep)
  readdirMock.mockImplementation(async (p: unknown) => {
    const ps = String(p).replace(/\\/g, '/').replace(/\/+$/, '')
    if (ps.endsWith('/workflows')) return ['research'] as never
    if (ps.includes('tools')) return ['ctx7.yaml'] as never
    return [] as never
  })
  statMock.mockImplementation(async (p: unknown) => {
    const path = String(p)
    if (path.includes('SKILL.md')) {
      if (path.includes('research')) return { isDirectory: () => false } as never
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    }
    return { isDirectory: () => true } as never
  })
  cpMock.mockResolvedValue(undefined)
  readFileMock.mockResolvedValue('yaml-content' as never)
  validateManifestFileMock.mockReturnValue({
    ok: true,
    errors: [],
    manifest: { metadata: { name: 'ctx7' }, spec: { install: { method: 'copy-file' } } },
  } as never)
  runInstallMock.mockResolvedValue({ ok: true } as never)
}

describe('cli/setup — Phase v2.0-2.3 W1.1 (Agent Teams probe + Pure bundled highlight)', () => {
  beforeEach(() => {
    readdirMock.mockReset()
    statMock.mockReset()
    cpMock.mockReset()
    readFileMock.mockReset()
    runInstallMock.mockReset()
    validateManifestFileMock.mockReset()
    checkAgentTeamsMock.mockReset()
  })
  afterEach(() => vi.restoreAllMocks())

  // Acceptance (a) + (b): Agent Teams missing → warn text emitted, exit 0 (non-blocking)
  it('cell A1 — Agent Teams missing: warn text emitted on stderr, exit 0 (non-blocking)', async () => {
    checkAgentTeamsMock.mockResolvedValue({
      status: 'missing',
      detected: { env: false, settingsJson: false },
      remediation: 'Agent Teams not enabled.',
    })
    setupHappyPathMocks()

    const { code, stderr } = await runCli(['setup'])
    expect(code).toBe(0) // acceptance (a): non-blocking
    // acceptance (b): warn text grep both CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS + 2.1.133+
    expect(stderr).toContain('Agent Teams 未启用')
    expect(stderr).toContain('CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS')
    expect(stderr).toContain('2.1.133+')
    expect(stderr).toContain('parallelism-gate')
    expect(stderr).toContain('不阻塞')
    expect(checkAgentTeamsMock).toHaveBeenCalledOnce()
  })

  // Acceptance (a) negative: Agent Teams pass → silent (no warn), exit 0
  it('cell A2 — Agent Teams pass: no warn emitted, exit 0', async () => {
    checkAgentTeamsMock.mockResolvedValue({
      status: 'pass',
      detected: { env: true, settingsJson: false },
      envValue: '1',
    })
    setupHappyPathMocks()

    const { code, stderr } = await runCli(['setup'])
    expect(code).toBe(0)
    expect(stderr).not.toContain('Agent Teams 未启用')
    expect(stderr).not.toContain('CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS')
    expect(checkAgentTeamsMock).toHaveBeenCalledOnce()
  })

  // Acceptance (c): Pure bundled highlight emitted (workflows in <packageRoot>/workflows/)
  it('cell A3 — Pure bundled highlight emitted on success (D-01 verify, no ~/.harnessed/)', async () => {
    checkAgentTeamsMock.mockResolvedValue({
      status: 'pass',
      detected: { env: true, settingsJson: false },
      envValue: '1',
    })
    setupHappyPathMocks()

    const { code, stdout } = await runCli(['setup'])
    expect(code).toBe(0)
    expect(stdout).toContain('harnessed v3.0 三层栈方法论 bundled')
    expect(stdout).toContain('23 workflows (4 master + 18 sub + 1 standalone)')
    expect(stdout).toContain('6 disciplines + 10 judgments + ~83 capabilities ready')
    expect(stdout).toContain('Pure bundled, NOT user-dir override per D-01')
    expect(stdout).toContain('<packageRoot>/workflows/')
    // Pure bundled verify: NO ~/.harnessed/ user-dir reference
    expect(stdout).not.toContain('~/.harnessed/')
  })

  // Acceptance (b) edge: --dry-run still triggers Agent Teams probe + warn (preview mode honest)
  it('cell A4 — --dry-run: Agent Teams probe still fires + warn emitted', async () => {
    checkAgentTeamsMock.mockResolvedValue({
      status: 'missing',
      detected: { env: false, settingsJson: false },
    })
    setupHappyPathMocks()

    const { code, stderr } = await runCli(['setup', '--dry-run'])
    expect(code).toBe(0)
    expect(stderr).toContain('Agent Teams 未启用')
    expect(checkAgentTeamsMock).toHaveBeenCalledOnce()
  })
})
