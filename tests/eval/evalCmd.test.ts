// 4.31.0 eval Slice A (T4) — `harnessed eval` CLI wiring: exit codes, --json
// shape, --filter, --coverage, GITHUB_ACTIONS ::error annotations.

import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Command } from 'commander'
import { afterEach, describe, expect, it } from 'vitest'
import { registerEval } from '../../src/cli/evalCmd.js'

const cleanups: string[] = []
afterEach(() => {
  for (const d of cleanups.splice(0)) rmSync(d, { recursive: true, force: true })
  delete process.env.GITHUB_ACTIONS
})

function suiteDir(): string {
  const parent = realpathSync(mkdtempSync(join(tmpdir(), 'evalcmd-')))
  cleanups.push(parent)
  const s1 = join(parent, 'ok')
  mkdirSync(s1)
  writeFileSync(join(s1, 'scenario.yaml'), 'name: ok\nsteps:\n  - gates:\n      master: verify\n')
  return parent
}

interface CliRun {
  code: number | null
  stdout: string[]
  stderr: string[]
}

async function runCli(argv: string[]): Promise<CliRun> {
  const stdout: string[] = []
  const stderr: string[] = []
  const logSpy = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
    stdout.push(a.map(String).join(' '))
  })
  const errSpy = vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => {
    stderr.push(a.map(String).join(' '))
  })
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation((...a: unknown[]) => {
    stderr.push(a.map(String).join(' '))
  })
  let code: number | null = null
  const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((c?: number) => {
    code = c ?? 0
    throw new Error(`process.exit(${c})`)
  }) as never)
  const program = new Command()
  registerEval(program)
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
  } catch {
    // exit sentinel
  } finally {
    logSpy.mockRestore()
    errSpy.mockRestore()
    warnSpy.mockRestore()
    exitSpy.mockRestore()
  }
  return { code, stdout, stderr }
}

import { vi } from 'vitest'

describe('harnessed eval CLI (T4)', () => {
  it('MISSING-GOLDEN → non-zero exit; --update-golden then green exit 0', async () => {
    const dir = suiteDir()
    const first = await runCli(['eval', '--dir', dir])
    expect(first.code).not.toBe(0)
    expect(first.stdout.join('\n')).toMatch(/MISSING-GOLDEN/)

    const rec = await runCli(['eval', '--dir', dir, '--update-golden'])
    expect(rec.code).toBe(0)
    expect(rec.stdout.join('\n')).toMatch(/UPDATED/)

    const second = await runCli(['eval', '--dir', dir])
    expect(second.code).toBe(0)
    expect(second.stdout.join('\n')).toMatch(/PASS/)
  })

  it('--json emits machine-readable results (results[] + summary)', async () => {
    const dir = suiteDir()
    await runCli(['eval', '--dir', dir, '--update-golden'])
    const r = await runCli(['eval', '--dir', dir, '--json'])
    expect(r.code).toBe(0)
    const parsed = JSON.parse(r.stdout.join('\n'))
    expect(Array.isArray(parsed.results)).toBe(true)
    expect(parsed.summary.pass).toBe(1)
  })

  it('--filter narrows by scenario name substring', async () => {
    const dir = suiteDir()
    await runCli(['eval', '--dir', dir, '--update-golden'])
    const none = await runCli(['eval', '--dir', dir, '--filter', 'no-such-name'])
    expect(none.stdout.join('\n')).toMatch(/0 scenario/i)
  })

  it('--coverage prints the trigger matrix with bare items highlighted', async () => {
    const dir = suiteDir()
    await runCli(['eval', '--dir', dir, '--update-golden'])
    const r = await runCli(['eval', '--dir', dir, '--coverage'])
    expect(r.code).toBe(0)
    const out = r.stdout.join('\n')
    expect(out).toMatch(/coverage/i)
    expect(out).toMatch(/judgments\./)
    expect(out).toMatch(/BARE|not covered/i)
  })

  it('GITHUB_ACTIONS=true + failure → ::error annotation on stdout', async () => {
    const dir = suiteDir() // no golden recorded → MISSING-GOLDEN failure
    process.env.GITHUB_ACTIONS = 'true'
    const r = await runCli(['eval', '--dir', dir])
    expect(r.code).not.toBe(0)
    expect(r.stdout.join('\n')).toMatch(/::error/)
  })
})
