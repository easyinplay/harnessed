// 4.23.0 (T8) — `harnessed exempt-gateguard` CLI (the auto-install fix channel,
// env variant: persists GATEGUARD_EXEMPT_GLOBS=".planning/**" into settings env).
//
// Consent semantics: invoking the command IS the consent (doctor auto-install
// already confirmed, default YES; or the user typed it from the refusal-block
// advice) — so the command applies without another prompt, but still prints the
// exact env change + backup path (D2 transparency) before writing.
//
// The CLI passes the module's own exports into runExemptionFlow's deps, so a
// factory mock on guard-exemption.js controls probe/read/merge WITHOUT touching
// the host's real settings.json (settingsWriter would otherwise write ~/.claude).

import { Command } from 'commander'
import { describe, expect, it, vi } from 'vitest'

const ctl = vi.hoisted(() => ({
  capability: 'env-supported' as 'env-supported' | 'legacy',
  existing: undefined as string | undefined,
  merges: [] as string[],
  mergeOutcome: 'merged' as 'merged' | 'warn',
}))

vi.mock('../../src/cli/lib/guard-exemption.js', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../src/cli/lib/guard-exemption.js')>()
  return {
    ...orig,
    probeExemptCapability: vi.fn(async () => ctl.capability),
    readCurrentEnvValue: vi.fn(async () => ctl.existing),
    applyEnvExemption: vi.fn(async (value: string) => {
      ctl.merges.push(value)
      return ctl.mergeOutcome === 'merged'
        ? { outcome: 'merged' as const, path: '/fake/settings.json', backupPath: '/fake/b.bak' }
        : { outcome: 'warn' as const, message: 'write failed' }
    }),
  }
})

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

describe('harnessed exempt-gateguard', () => {
  it('capable + unexempt → applies: env change previewed, merge called, exit 0', async () => {
    ctl.capability = 'env-supported'
    ctl.existing = undefined
    ctl.merges = []
    ctl.mergeOutcome = 'merged'
    const { code, out } = await runCli(['exempt-gateguard'])
    expect(code).toBe(0)
    expect(ctl.merges).toEqual(['.planning/**'])
    expect(out).toContain('+ env.GATEGUARD_EXEMPT_GLOBS = ".planning/**"') // preview before write
    expect(out).toContain('/fake/settings.json') // target named
    expect(out).toContain('/fake/b.bak') // backup path surfaced
  })

  it('second run is idempotent: already listed, no merge, exit 0', async () => {
    ctl.capability = 'env-supported'
    ctl.existing = 'docs/**,.planning/**'
    ctl.merges = []
    const { code, out } = await runCli(['exempt-gateguard'])
    expect(code).toBe(0)
    expect(ctl.merges.length).toBe(0)
    expect(out).toMatch(/already/i)
  })

  it('legacy ecc → upgrade advice (claude plugin update ecc), no merge, exit 0', async () => {
    ctl.capability = 'legacy'
    ctl.existing = undefined
    ctl.merges = []
    const { code, out } = await runCli(['exempt-gateguard'])
    expect(code).toBe(0)
    expect(ctl.merges.length).toBe(0)
    expect(out).toContain('claude plugin update ecc')
    expect(out).toContain('ECC_GATEGUARD=off')
  })

  it('merge failure → exit 1 with the manual advice', async () => {
    ctl.capability = 'env-supported'
    ctl.existing = undefined
    ctl.merges = []
    ctl.mergeOutcome = 'warn'
    const { code, out } = await runCli(['exempt-gateguard'])
    expect(code).toBe(1)
    expect(out).toContain('write failed')
  })
})
