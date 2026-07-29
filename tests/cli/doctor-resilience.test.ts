// 4.32.23 — doctor must survive a crashing check.
//
// `readClaudeConfig.ts` deliberately re-throws non-ENOENT read errors (EACCES /
// EISDIR) instead of silently swallowing them, and several checks call into it.
// doctor.ts dispatched the whole registry through `Promise.all`, so ONE throwing
// check aborted the command with a bare stack trace and discarded the other 19
// results. Degrade the crashed check to a warn row instead.

import { Command } from 'commander'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/cli/lib/doctor-registry.js', () => ({
  CHECKS: [
    async () => ({ name: 'healthy check', status: 'pass', message: 'all good' }),
    async () => {
      throw new Error('EACCES: permission denied')
    },
    async () => ({ name: 'later check', status: 'pass', message: 'still reported' }),
  ],
}))

import { registerDoctor } from '../../src/cli/doctor.js'

class ExitError extends Error {
  constructor(public code: number) {
    super(`process.exit(${code})`)
  }
}

async function runDoctor(argv: string[]): Promise<{ code: number; stdout: string }> {
  let stdout = ''
  const exit = vi.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
    throw new ExitError(typeof code === 'number' ? code : 0)
  })
  const log = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    stdout += `${args.map(String).join(' ')}\n`
  })
  const program = new Command()
  program.exitOverride()
  registerDoctor(program)
  let code = 0
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
  } catch (e) {
    if (e instanceof ExitError) code = e.code
    else throw e
  }
  exit.mockRestore()
  log.mockRestore()
  return { code, stdout }
}

describe('cli/doctor — 4.32.23 per-check crash resilience', () => {
  afterEach(() => vi.restoreAllMocks())

  it('a throwing check degrades to a warn row; the other checks still report', async () => {
    const { code, stdout } = await runDoctor(['doctor'])
    expect(stdout).toContain('healthy check')
    expect(stdout).toContain('later check')
    expect(stdout).toContain('EACCES: permission denied')
    expect(code).toBe(0) // warn ≠ fail (B-06 advisory policy)
  })

  it('--json carries the crashed check as a warn entry, summary warn', async () => {
    const { stdout } = await runDoctor(['doctor', '--json'])
    const parsed = JSON.parse(stdout) as {
      checks: { name: string; status: string; message: string }[]
      summary: string
    }
    expect(parsed.checks).toHaveLength(3)
    const crashed = parsed.checks[1]
    expect(crashed?.status).toBe('warn')
    expect(crashed?.message).toContain('EACCES: permission denied')
    expect(parsed.summary).toBe('warn')
  })
})
