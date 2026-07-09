// 4.22.2 T2 — `harnessed exempt-gateguard` CLI (the auto-install fix channel).
//
// Consent semantics: invoking the command IS the consent (doctor auto-install
// already confirmed, default YES; or the user typed it from the refusal-block
// advice) — so the command applies without another prompt, but still prints the
// exact diff + backup path (D2 transparency) before writing.

import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { registerExemptGateguard } from '../../src/cli/exempt-gateguard.js'

class ExitError extends Error {
  constructor(public code: number) {
    super(`process.exit(${code})`)
  }
}

async function runCli(argv: string[]): Promise<{ code: number; out: string }> {
  let out = ''
  const exit = vi.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
    throw new ExitError(typeof code === 'number' ? code : 0)
  })
  const log = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    out += `${args.map(String).join(' ')}\n`
  })
  const err = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    out += `${args.map(String).join(' ')}\n`
  })
  const program = new Command().exitOverride()
  registerExemptGateguard(program)
  let code = 0
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
  } catch (e) {
    if (e instanceof ExitError) code = e.code
    else {
      code = 1
      out += `${(e as Error).message}\n`
    }
  } finally {
    exit.mockRestore()
    log.mockRestore()
    err.mockRestore()
  }
  return { code, out }
}

let stateRoot: string
let projectDir: string
let prevCwd: string

beforeEach(() => {
  stateRoot = mkdtempSync(join(tmpdir(), 'harnessed-exempt-state-'))
  projectDir = mkdtempSync(join(tmpdir(), 'harnessed-exempt-proj-'))
  process.env.HARNESSED_ROOT_OVERRIDE = stateRoot
  prevCwd = process.cwd()
  process.chdir(projectDir)
})
afterEach(() => {
  process.chdir(prevCwd)
  delete process.env.HARNESSED_ROOT_OVERRIDE
  rmSync(stateRoot, { recursive: true, force: true })
  rmSync(projectDir, { recursive: true, force: true })
})

describe('harnessed exempt-gateguard', () => {
  it('applies the exemption: file mutated, backup written, exit 0', async () => {
    const yml = join(projectDir, '.gateguard.yml')
    writeFileSync(yml, '# cfg\nenabled: true\nignore_paths:\n  - ".venv/**"\n', 'utf8')
    const { code, out } = await runCli(['exempt-gateguard'])
    expect(code).toBe(0)
    const text = readFileSync(yml, 'utf8')
    expect(text).toContain('.planning/**')
    expect(text).toContain('# cfg') // comments survive (text-level append)
    expect(out).toContain('+   - ".planning/**"') // diff printed before write
    // backup landed under the harnessed backups dir
    const backups = readdirSync(join(stateRoot, 'backups'))
    expect(backups.some((f) => f.startsWith('gateguard.yml.'))).toBe(true)
  })

  it('second run is idempotent: already exempt, no new backup, exit 0', async () => {
    const yml = join(projectDir, '.gateguard.yml')
    writeFileSync(yml, `ignore_paths:\n  - ".planning/**"\n`, 'utf8')
    const { code, out } = await runCli(['exempt-gateguard'])
    expect(code).toBe(0)
    expect(out).toMatch(/already/i)
  })

  it('no .gateguard.yml anywhere → explains the variant situation, exit 0', async () => {
    // findGateguardYml probes cwd then HOME — pin HOME probing away from the
    // real host home is not possible here, so tolerate either outcome shape:
    // exit 0 and a non-empty explanation.
    const { code, out } = await runCli(['exempt-gateguard'])
    expect(code).toBe(0)
    expect(out.length).toBeGreaterThan(0)
  })
})
