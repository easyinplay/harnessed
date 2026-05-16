// Phase 1.2 unit tests for src/cli/doctor.ts.
//
// Covers (PLAN B8' / ASSUMPTIONS B4 候选 1 + C4):
//   - registers `doctor` subcommand on Command
//   - Node ≥ 22 check passes (node 22+ runtime in CI/test)
//   - exit code 0 when all checks pass; exit 1 on any failure
//
// Mocks: child_process (for jq + bash probes), fs/promises (.mcp.json),
// process.exit; console.log silenced.

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:child_process', () => ({ spawnSync: vi.fn() }))
vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }))

import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { Command } from 'commander'
import { registerDoctor } from '../../src/cli/doctor.js'

const spawnSyncMock = vi.mocked(spawnSync)
const readFileMock = vi.mocked(readFile)

class ExitError extends Error {
  constructor(public code: number) {
    super(`process.exit(${code})`)
  }
}

async function runCli(argv: string[]): Promise<number> {
  const exit = vi.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
    throw new ExitError(typeof code === 'number' ? code : 0)
  })
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  const program = new Command().exitOverride()
  registerDoctor(program)
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
    return 0
  } catch (e) {
    if (e instanceof ExitError) return e.code
    throw e
  } finally {
    exit.mockRestore()
    log.mockRestore()
  }
}

describe('cli/doctor', () => {
  beforeEach(() => {
    spawnSyncMock.mockReset()
    readFileMock.mockReset()
  })

  it('registers `doctor` subcommand on the program', () => {
    const program = new Command()
    registerDoctor(program)
    const cmd = program.commands.find((c) => c.name() === 'doctor')
    expect(cmd).toBeDefined()
  })

  it('all checks pass (jq present, no user-scope MCP, valid bash) → exit 0', async () => {
    // checkJq: where/which jq → status 0 + stdout path
    // checkWinBash: where bash → status 0 + stdout path; bash -c '$WSL_DISTRO_NAME' → empty
    spawnSyncMock.mockImplementation((cmd: string, args?: readonly string[]) => {
      const argv = (args ?? []) as string[]
      if (cmd === 'where' || cmd === 'which') {
        // Phase 3.2 W1 T1.8 — 6th check gstack PROBE: gstack-only branch (pass).
        // gstack-office-hours found → pass; office-hours NOT found → "gstack-only" mode (D-01 PROBE first branch).
        if (argv[0] === 'gstack-office-hours') {
          return {
            status: 0,
            stdout: '/usr/bin/gstack-office-hours\n',
            stderr: '',
            signal: null,
            pid: 0,
            output: [],
          } as ReturnType<typeof spawnSync>
        }
        if (argv[0] === 'office-hours') {
          return {
            status: 1,
            stdout: '',
            stderr: '',
            signal: null,
            pid: 0,
            output: [],
          } as ReturnType<typeof spawnSync>
        }
        // where/which jq → /usr/bin/jq; where/which bash → /usr/bin/bash
        return {
          status: 0,
          stdout: argv[0] === 'jq' ? '/usr/bin/jq\n' : 'C:\\Git\\bin\\bash.exe\n',
          stderr: '',
          signal: null,
          pid: 0,
          output: [],
        } as ReturnType<typeof spawnSync>
      }
      if (cmd === 'bash') {
        // WSL probe — empty stdout means non-WSL
        return {
          status: 0,
          stdout: '',
          stderr: '',
          signal: null,
          pid: 0,
          output: [],
        } as ReturnType<typeof spawnSync>
      }
      return {
        status: 0,
        stdout: '',
        stderr: '',
        signal: null,
        pid: 0,
        output: [],
      } as ReturnType<typeof spawnSync>
    })
    // .mcp.json absent + ~/.claude.json absent → ok (no user-scope MCP)
    readFileMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    const code = await runCli(['doctor'])
    expect(code).toBe(0)
  })

  it('jq missing → exit 1', async () => {
    spawnSyncMock.mockImplementation(() => {
      return {
        status: 127,
        stdout: '',
        stderr: 'command not found',
        signal: null,
        pid: 0,
        output: [],
        error: Object.assign(new Error('ENOENT'), { code: 'ENOENT' }),
        // biome-ignore lint/suspicious/noExplicitAny: spawnSync return shape varies
      } as any
    })
    readFileMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    const code = await runCli(['doctor'])
    expect(code).toBe(1)
  })

  it('user-scope MCP servers detected → exit 1 (CC #54803 violation)', async () => {
    spawnSyncMock.mockImplementation(
      () =>
        ({
          status: 0,
          stdout: 'jq-1.7\n',
          stderr: '',
          signal: null,
          pid: 0,
          output: [],
        }) as ReturnType<typeof spawnSync>,
    )
    readFileMock.mockImplementation((async (p: unknown) => {
      const path = typeof p === 'string' ? p : String(p)
      if (path.endsWith('.claude.json')) {
        return JSON.stringify({ mcpServers: { 'foo-mcp': { command: 'npx' } } })
      }
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
      // biome-ignore lint/suspicious/noExplicitAny: readFile has many overloads
    }) as any)
    const code = await runCli(['doctor'])
    expect(code).toBe(1)
  })
})
