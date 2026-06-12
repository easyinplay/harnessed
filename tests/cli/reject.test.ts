// `harnessed reject` CLI unit tests (TDD red-first).
//
// Single `reject <sub>` command; marks a pending sub as 'rejected' (terminal,
// user-abandoned, distinct from 'failed' which drives G6 retry logic).
// Sister pattern: tests/cli/checkpoint.test.ts (vi.mock harness, ExitError, runCli).
//
// All I/O is mocked — state.ts and ledger.ts are pure mocks so no real fs or
// lock is touched. The two test cases:
//   case 1 — known sub 'a' present → status flipped to 'rejected', exit 0.
//   case 2 — unknown sub 'z' not in ledger → exit 1, ledger unchanged.

import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock mutateSubProgress so we can capture the transform fn and simulate it
// against our seeded entries without real fs/lock.
vi.mock('../../src/checkpoint/state.js', () => ({
  mutateSubProgress: vi.fn(async () => undefined),
}))

import { mutateSubProgress } from '../../src/checkpoint/state.js'
import { registerReject } from '../../src/cli/reject.js'

class ExitError extends Error {
  constructor(public code: number) {
    super(`process.exit(${code})`)
  }
}

interface CliResult {
  code: number
  stdout: string
  stderr: string
}

async function runCli(argv: string[]): Promise<CliResult> {
  let stdout = ''
  let stderr = ''
  const exit = vi.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
    throw new ExitError(typeof code === 'number' ? code : 0)
  })
  const log = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    stdout += `${args.map(String).join(' ')}\n`
  })
  const err = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    stderr += `${args.map(String).join(' ')}\n`
  })
  const program = new Command().exitOverride()
  registerReject(program)
  let code = 0
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
  } catch (e) {
    if (e instanceof ExitError) {
      code = e.code
    } else {
      code = 1
      stderr += `${(e as Error).message}\n`
    }
  } finally {
    exit.mockRestore()
    log.mockRestore()
    err.mockRestore()
  }
  return { code, stdout, stderr }
}

describe('cli/reject — mark sub as user-rejected', () => {
  // Seeded ledger: one pending sub 'a' and one already-done sub 'b'.
  const seededEntries: Array<{ sub: string; status: string; gate_fired: boolean }> = [
    { sub: 'a', status: 'pending', gate_fired: true },
    { sub: 'b', status: 'done', gate_fired: true },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // Default: mutateSubProgress calls the transform fn against seededEntries.
    // This lets the action's "touched" check work correctly: if the sub is found
    // the transform fn returns a mutated array (entries.some → true), then
    // mutateSubProgress resolves and the action exits 0. When sub not found the
    // fn returns entries unchanged and touched stays false → exit 1.
    vi.mocked(mutateSubProgress).mockImplementation(async (fn) => {
      // biome-ignore lint/suspicious/noExplicitAny: test fixture
      fn(seededEntries as any)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('registers `reject` subcommand on Command instance', () => {
    const program = new Command()
    registerReject(program)
    const names = program.commands.map((c) => c.name())
    expect(names).toContain('reject')
  })

  it('case 1 — known sub "a" → mutateSubProgress called, exit 0, stdout confirms rejection', async () => {
    const { code, stdout } = await runCli(['reject', 'a'])
    expect(code).toBe(0)
    expect(mutateSubProgress).toHaveBeenCalledTimes(1)
    expect(stdout).toContain('rejected')
    expect(stdout).toContain('a')
  })

  it('case 2 — unknown sub "z" not in ledger → exit 1, stderr notes not found, mutateSubProgress still called', async () => {
    const { code, stderr } = await runCli(['reject', 'z'])
    expect(code).toBe(1)
    // mutateSubProgress IS called but the fn returns entries unchanged (sub absent)
    expect(mutateSubProgress).toHaveBeenCalledTimes(1)
    expect(stderr).toContain('z')
  })
})
