// Phase 2.4 W1 T1.3 — doctor 5-check unit + --json + warn≠fail exit policy.
// Sister: tests/unit/cli-doctor.test.ts (Phase 1.2, 4 cells checks 1-4). ≤100L.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:child_process', () => ({ spawnSync: vi.fn() }))
vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }))
vi.mock('node:fs', () => ({ readFileSync: vi.fn() }))

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

function mockSpawn(opts: { jq?: boolean; gitUrl?: string } = {}): void {
  const { jq = true, gitUrl = REPO } = opts
  spawnSyncMock.mockImplementation((cmd: string, args?: readonly string[]) => {
    const argv = (args ?? []) as string[]
    if ((cmd === 'where' || cmd === 'which') && argv[0] === 'jq')
      return { status: jq ? 0 : 127, stdout: jq ? '/usr/bin/jq\n' : '' } as never
    if (cmd === 'where' || cmd === 'which') return { status: 0, stdout: '/usr/bin/bash\n' } as never
    if (cmd === 'bash') return { status: 0, stdout: '' } as never // empty WSL probe
    if (cmd === 'git') return { status: 0, stdout: `${gitUrl}\n` } as never
    return { status: 0, stdout: '' } as never
  })
  readFileMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
  readFileSyncMock.mockReturnValue(JSON.stringify({ repository: { url: REPO } }))
}

describe('cli/doctor — Phase 2.4 W1 5-check + --json + exit policy', () => {
  beforeEach(() => {
    spawnSyncMock.mockReset()
    readFileMock.mockReset()
    readFileSyncMock.mockReset()
  })
  afterEach(() => vi.restoreAllMocks())

  it('cell 1 — all 5 checks pass → exit 0 + summary "pass"', async () => {
    mockSpawn()
    const { code, stdout } = await runCli(['doctor', '--json'])
    expect(code).toBe(0)
    const p = JSON.parse(stdout) as { checks: unknown[]; summary: string }
    expect(p.checks).toHaveLength(5)
    expect(p.summary).toBe('pass')
  })

  it('cell 2 — origin URL drift → warn → exit 0 per B-06 (warn ≠ fail)', async () => {
    mockSpawn({ gitUrl: 'https://github.com/forker/fork.git' })
    const { code, stdout } = await runCli(['doctor', '--json'])
    expect(code).toBe(0)
    expect(JSON.parse(stdout).summary).toBe('warn')
  })

  it('cell 3 — jq missing → fail → exit 1 per B-06', async () => {
    mockSpawn({ jq: false })
    const { code } = await runCli(['doctor'])
    expect(code).toBe(1)
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
