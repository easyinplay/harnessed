// Phase 1.2 unit tests for src/cli/status.ts.
//
// Covers (ADR 0004 contract 6 + lib/state.ts SSOT):
//   - registers `status` subcommand
//   - empty state → prints "no installs recorded" (no exit code)
//   - installed entries → prints sorted by name, one line each + count footer
//
// Mocks: readState helper.

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/installers/lib/state.js', () => ({ readState: vi.fn() }))

import { Command } from 'commander'
import { registerStatus } from '../../src/cli/status.js'
import { readState } from '../../src/installers/lib/state.js'

const readStateMock = vi.mocked(readState)

async function runCli(argv: string[]): Promise<{ logs: string[] }> {
  const logs: string[] = []
  const log = vi.spyOn(console, 'log').mockImplementation((m?: unknown) => {
    logs.push(String(m ?? ''))
  })
  const program = new Command().exitOverride()
  registerStatus(program)
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
  } finally {
    log.mockRestore()
  }
  return { logs }
}

describe('cli/status', () => {
  beforeEach(() => {
    readStateMock.mockReset()
  })

  it('registers `status` subcommand', () => {
    const program = new Command()
    registerStatus(program)
    const cmd = program.commands.find((c) => c.name() === 'status')
    expect(cmd).toBeDefined()
  })

  it('empty state → "no installs recorded"', async () => {
    readStateMock.mockResolvedValue({ version: '1', installed: {} })
    const { logs } = await runCli(['status'])
    expect(logs.join('\n')).toContain('no installs recorded')
  })

  it('installed entries → sorted output + count footer', async () => {
    readStateMock.mockResolvedValue({
      version: '1',
      installed: {
        zeta: { version: '^2.0.0', installedAt: '2026-05-12T00:00:00Z', manifestSha1: '' },
        alpha: { version: '^1.0.0', installedAt: '2026-05-11T00:00:00Z', manifestSha1: '' },
      },
    })
    const { logs } = await runCli(['status'])
    const joined = logs.join('\n')
    // Sorted: alpha before zeta
    const alphaIdx = joined.indexOf('alpha')
    const zetaIdx = joined.indexOf('zeta')
    expect(alphaIdx).toBeGreaterThanOrEqual(0)
    expect(zetaIdx).toBeGreaterThan(alphaIdx)
    expect(joined).toMatch(/2\s+install/)
  })
})
