// v1.0.1 T1.5 — TDD: setup CLI subcommand tests.
// Covers: smoke (command registered), dry-run default, --apply executes cp, SKILL.md skip.
// vi.mock fs/promises to avoid touching real filesystem.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs/promises', () => ({
  readdir: vi.fn(),
  stat: vi.fn(),
  cp: vi.fn(),
}))

import { cp, readdir, stat } from 'node:fs/promises'
import { Command } from 'commander'
import { registerSetup } from '../../src/cli/setup.js'

const readdirMock = vi.mocked(readdir)
const statMock = vi.mocked(stat)
const cpMock = vi.mocked(cp)

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

describe('cli/setup — v1.0.1 T1.5 (one-time onboarding copy workflows/*/SKILL.md → ~/.claude/skills/)', () => {
  beforeEach(() => {
    readdirMock.mockReset()
    statMock.mockReset()
    cpMock.mockReset()
  })
  afterEach(() => vi.restoreAllMocks())

  // Cell 1: smoke — command registered and reachable
  it('cell 1 — smoke: setup command registered', async () => {
    // readdir returns empty → exit 2 (nothing to install)
    readdirMock.mockResolvedValue([] as never)
    const { code, stdout } = await runCli(['setup'])
    expect(code).toBe(2)
    expect(stdout).toContain('nothing to install')
  })

  // Cell 2: dry-run default — shows preview, does NOT call cp, exits 0
  it('cell 2 — dry-run default: preview output, cp NOT called, exit 0', async () => {
    readdirMock.mockResolvedValue(['execute-task', 'plan-feature'] as never)
    statMock.mockImplementation(async (p: unknown) => {
      const path = String(p)
      // Both entries are directories; execute-task has SKILL.md, plan-feature does NOT
      if (path.includes('SKILL.md') && path.includes('execute-task'))
        return { isDirectory: () => false } as never
      if (path.includes('SKILL.md')) throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
      return { isDirectory: () => true } as never
    })
    const { code, stdout } = await runCli(['setup'])
    expect(code).toBe(0)
    expect(stdout).toContain('[dry-run]')
    expect(stdout).toContain('execute-task')
    expect(stdout).not.toContain('plan-feature')
    expect(cpMock).not.toHaveBeenCalled()
  })

  // Cell 3: --apply executes cp for SKILL.md workflows, exits 0
  it('cell 3 — --apply: cp called for SKILL.md workflows, exit 0', async () => {
    readdirMock.mockResolvedValue(['execute-task'] as never)
    statMock.mockImplementation(async (p: unknown) => {
      const path = String(p)
      if (path.includes('SKILL.md')) return { isDirectory: () => false } as never
      return { isDirectory: () => true } as never
    })
    cpMock.mockResolvedValue(undefined)
    const { code, stdout } = await runCli(['setup', '--apply'])
    expect(code).toBe(0)
    expect(cpMock).toHaveBeenCalledOnce()
    const [src, dst, opts] = cpMock.mock.calls[0] as [string, string, object]
    expect(src).toContain('execute-task')
    expect(dst).toContain('execute-task')
    expect(opts).toMatchObject({ recursive: true, force: true })
    expect(stdout).toContain('setup complete')
  })

  // Cell 4: workflows without SKILL.md are skipped
  it('cell 4 — plan-feature (no SKILL.md) is skipped; only execute-task installed', async () => {
    readdirMock.mockResolvedValue(['execute-task', 'plan-feature'] as never)
    statMock.mockImplementation(async (p: unknown) => {
      const path = String(p)
      if (path.includes('SKILL.md') && path.includes('plan-feature'))
        throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
      if (path.includes('SKILL.md')) return { isDirectory: () => false } as never
      return { isDirectory: () => true } as never
    })
    cpMock.mockResolvedValue(undefined)
    const { code, stdout } = await runCli(['setup', '--apply'])
    expect(code).toBe(0)
    expect(cpMock).toHaveBeenCalledOnce()
    expect(stdout).toContain('1 workflow(s)')
    expect(stdout).not.toContain('plan-feature')
  })

  // Cell 5: no SKILL.md workflows → exit 2
  it('cell 5 — no SKILL.md workflows found → exit 2', async () => {
    readdirMock.mockResolvedValue(['plan-feature'] as never)
    statMock.mockImplementation(async (p: unknown) => {
      const path = String(p)
      if (path.includes('SKILL.md')) throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
      return { isDirectory: () => true } as never
    })
    const { code, stdout } = await runCli(['setup', '--apply'])
    expect(code).toBe(2)
    expect(stdout).toContain('nothing to install')
    expect(cpMock).not.toHaveBeenCalled()
  })
})
