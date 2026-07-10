// 4.23.0 (T8) — GateGuard exemption via the env channel (TDD red-first).
//
// Current ecc's gateguard-fact-force.js honors `GATEGUARD_EXEMPT_GLOBS` (comma-
// separated globs; normalized-path match skips fact-forcing). harnessed offers
// a consented auto-fix persisting `.planning/**` into the harness settings env
// — default YES (2026-07-05 decision carried over), refusal path stays LOUD.
// Supersedes the 4.22.2 `.gateguard.yml` text-append channel (removed — user
// decision 2026-07-10: single channel, env only).

import { describe, expect, it, vi } from 'vitest'
import {
  ECC_UPGRADE_CMD,
  EXEMPT_ENV_KEY,
  MANUAL_FIX_CMD,
  PLANNING_GLOB,
  planEnvExemption,
  probeExemptCapability,
  readCurrentEnvValue,
  refusalLines,
  runExemptionFlow,
  splitGlobs,
  upgradeAdviceLines,
} from '../../../src/cli/lib/guard-exemption.js'

describe('planEnvExemption (idempotent comma-list append)', () => {
  it('skip when .planning/** already listed', () => {
    expect(planEnvExemption('.planning/**').action).toBe('skip')
    expect(planEnvExemption('docs/**, .planning/** ,tmp/**').action).toBe('skip')
  })

  it('starts a fresh list when unset/empty', () => {
    expect(planEnvExemption(undefined)).toEqual({ action: 'set', value: PLANNING_GLOB })
    expect(planEnvExemption('')).toEqual({ action: 'set', value: PLANNING_GLOB })
  })

  it('appends after existing globs, preserving them verbatim', () => {
    expect(planEnvExemption('docs/**,build/**')).toEqual({
      action: 'set',
      value: `docs/**,build/**,${PLANNING_GLOB}`,
    })
  })

  it('splitGlobs trims whitespace and drops empty tokens', () => {
    expect(splitGlobs(' a/** , , b/** ')).toEqual(['a/**', 'b/**'])
    expect(splitGlobs(undefined)).toEqual([])
  })
})

describe('probeExemptCapability (installed-hook grep)', () => {
  const registry = JSON.stringify({
    version: 2,
    plugins: {
      'ecc@ecc': [{ scope: 'user', installPath: '/plug/ecc/2.0.0' }],
      'other@m': [{ installPath: '/plug/other/1.0.0' }],
    },
  })

  it('env-supported when the resident hook mentions the env key', async () => {
    const r = await probeExemptCapability({
      registryPath: () => '/reg.json',
      readFile: async (p) => {
        if (p === '/reg.json') return registry
        if (p.replace(/\\/g, '/').includes('/plug/ecc/2.0.0/scripts/hooks/')) {
          return `const exempt = process.env.${EXEMPT_ENV_KEY} || ''`
        }
        throw new Error('ENOENT')
      },
    })
    expect(r).toBe('env-supported')
  })

  it('legacy when the hook exists but predates the env key', async () => {
    const r = await probeExemptCapability({
      registryPath: () => '/reg.json',
      readFile: async (p) =>
        p === '/reg.json' ? registry : 'module.exports = factForce // old hook',
    })
    expect(r).toBe('legacy')
  })

  it('legacy (fail-soft) on no registry / unreadable hook / no ecc entry', async () => {
    expect(await probeExemptCapability({ registryPath: () => null })).toBe('legacy')
    expect(
      await probeExemptCapability({
        registryPath: () => '/reg.json',
        readFile: async () => {
          throw new Error('EACCES')
        },
      }),
    ).toBe('legacy')
    expect(
      await probeExemptCapability({
        registryPath: () => '/reg.json',
        readFile: async () => JSON.stringify({ plugins: { 'other@m': [] } }),
      }),
    ).toBe('legacy')
  })
})

describe('readCurrentEnvValue (settings.json env reader, fail-soft)', () => {
  it('returns the persisted value', async () => {
    const v = await readCurrentEnvValue({
      readSettings: async () => JSON.stringify({ env: { [EXEMPT_ENV_KEY]: 'a/**,b/**' } }),
    })
    expect(v).toBe('a/**,b/**')
  })

  it('undefined on absent file / malformed JSON / unset key', async () => {
    expect(await readCurrentEnvValue({ readSettings: async () => null })).toBeUndefined()
    expect(await readCurrentEnvValue({ readSettings: async () => '{oops' })).toBeUndefined()
    expect(await readCurrentEnvValue({ readSettings: async () => '{"env":{}}' })).toBeUndefined()
  })
})

describe('refusalLines (D3 — loud decline)', () => {
  it('carries the three concrete consequences and the exact manual command', () => {
    const block = refusalLines().join('\n')
    expect(block).toMatch(/⚠/)
    expect(block).toMatch(/qa-report\.md/) // verify-stage artifacts named concretely
    expect(block).toMatch(/subagent/i) // no fact-retry channel consequence
    expect(block).toContain(MANUAL_FIX_CMD) // exact manual fix command
    expect(block).toMatch(/doctor/) // doctor keeps warning until resolved
  })
})

describe('upgradeAdviceLines (legacy ecc)', () => {
  it('names the upgrade command and the interim kill switch', () => {
    const block = upgradeAdviceLines().join('\n')
    expect(block).toContain(ECC_UPGRADE_CMD)
    expect(block).toContain('ECC_GATEGUARD=off')
  })
})

describe('runExemptionFlow (interactive confirm default YES)', () => {
  const flowDeps = (existing: string | undefined) => {
    const printed: string[] = []
    const merges: string[] = []
    return {
      printed,
      merges,
      deps: {
        probe: async () => 'env-supported' as const,
        readEnvValue: async () => existing,
        merge: async (value: string) => {
          merges.push(value)
          return {
            outcome: 'merged' as const,
            path: '/fake/settings.json',
            backupPath: '/b/settings.bak',
          }
        },
        supportsEnvWrite: () => true,
        print: (line: string) => {
          printed.push(line)
        },
      },
    }
  }

  it('confirm=yes → applied; preview shows exact env change + target before consent', async () => {
    const h = flowDeps(undefined)
    const confirm = vi.fn(async () => true)
    const r = await runExemptionFlow({ confirm, ...h.deps })
    expect(r).toBe('applied')
    expect(confirm).toHaveBeenCalledOnce()
    const out = h.printed.join('\n')
    expect(out).toContain(`+ env.${EXEMPT_ENV_KEY} = "${PLANNING_GLOB}"`)
    expect(out).toContain('/fake/settings.json') // ✓ line names the target
    expect(h.merges).toEqual([PLANNING_GLOB])
  })

  it('appends to an existing list instead of clobbering it', async () => {
    const h = flowDeps('docs/**')
    const r = await runExemptionFlow({ confirm: async () => true, ...h.deps })
    expect(r).toBe('applied')
    expect(h.merges).toEqual([`docs/**,${PLANNING_GLOB}`])
    expect(h.printed.join('\n')).toContain(`"docs/**" → "docs/**,${PLANNING_GLOB}"`)
  })

  it('confirm=no → declined + loud refusal block printed, nothing merged', async () => {
    const h = flowDeps(undefined)
    const r = await runExemptionFlow({ confirm: async () => false, ...h.deps })
    expect(r).toBe('declined')
    expect(h.merges.length).toBe(0)
    expect(h.printed.join('\n')).toContain(MANUAL_FIX_CMD)
  })

  it('no confirm fn (non-interactive) → advises manual command, nothing merged', async () => {
    const h = flowDeps(undefined)
    const r = await runExemptionFlow({ ...h.deps })
    expect(r).toBe('advised')
    expect(h.merges.length).toBe(0)
    expect(h.printed.join('\n')).toContain(MANUAL_FIX_CMD)
  })

  it('already exempt → already, quiet (no refusal block, no merge)', async () => {
    const h = flowDeps(`x/**,${PLANNING_GLOB}`)
    const r = await runExemptionFlow({ confirm: async () => true, ...h.deps })
    expect(r).toBe('already')
    expect(h.merges.length).toBe(0)
  })

  it('legacy capability → not-capable, silent (caller words the advice)', async () => {
    const h = flowDeps(undefined)
    const r = await runExemptionFlow({
      ...h.deps,
      probe: async () => 'legacy' as const,
      confirm: async () => true,
    })
    expect(r).toBe('not-capable')
    expect(h.merges.length).toBe(0)
    expect(h.printed.length).toBe(0)
  })

  it('platform without env-key write (codex) → unsupported-platform + shell-export hint', async () => {
    const h = flowDeps(undefined)
    const r = await runExemptionFlow({
      ...h.deps,
      supportsEnvWrite: () => false,
      confirm: async () => true,
    })
    expect(r).toBe('unsupported-platform')
    expect(h.merges.length).toBe(0)
    expect(h.printed.join('\n')).toContain(EXEMPT_ENV_KEY)
  })

  it('merge warn outcome → error + manual command advice', async () => {
    const h = flowDeps(undefined)
    const r = await runExemptionFlow({
      ...h.deps,
      merge: async () => ({ outcome: 'warn' as const, message: 'disk full' }),
      confirm: async () => true,
    })
    expect(r).toBe('error')
    expect(h.printed.join('\n')).toContain('disk full')
  })
})
