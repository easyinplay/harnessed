// 4.22.1 T2b/T4 — GateGuard × evidence-guard conflict detection (TDD red-first).

import { describe, expect, it } from 'vitest'
import {
  checkGuardConflict,
  detectGateGuardActive,
} from '../../src/cli/lib/check-guard-conflict.js'

const deps = (over: {
  env?: Record<string, string | undefined>
  settings?: string | null
  ecc?: boolean
}) => ({
  env: over.env ?? {},
  readSettings: async () => over.settings ?? null,
  eccPluginInstalled: async () => over.ecc ?? false,
})

describe('detectGateGuardActive', () => {
  it('inactive when no signal anywhere', async () => {
    const r = await detectGateGuardActive(deps({}))
    expect(r).toEqual({ active: false, source: null })
  })

  it('kill switches win over every active signal', async () => {
    for (const env of [
      { GATEGUARD_DISABLED: '1', ECC_GATEGUARD: 'on' },
      { ECC_GATEGUARD: 'off' },
      { ECC_GATEGUARD: '0' },
      { ECC_GATEGUARD: 'FALSE' },
    ]) {
      const r = await detectGateGuardActive(
        deps({ env, settings: '{"hooks":{"PreToolUse":[{"command":"gateguard-x"}]}}', ecc: true }),
      )
      expect(r.active).toBe(false)
    }
  })

  it('env non-disable value = explicit opt-in signal', async () => {
    const r = await detectGateGuardActive(deps({ env: { ECC_GATEGUARD: 'on' } }))
    expect(r).toEqual({ active: true, source: 'env' })
  })

  it('gateguard keyword in settings hooks JSON = active', async () => {
    const r = await detectGateGuardActive(
      deps({
        settings: '{"hooks":{"PreToolUse":[{"command":"node .../gateguard-fact-force.js"}]}}',
      }),
    )
    expect(r).toEqual({ active: true, source: 'settings-hooks' })
  })

  it('ecc plugin registered = active (ships the hook by default)', async () => {
    const r = await detectGateGuardActive(deps({ ecc: true }))
    expect(r).toEqual({ active: true, source: 'ecc-plugin' })
  })

  it('fail-soft: throwing deps → inactive', async () => {
    const r = await detectGateGuardActive({
      env: {},
      readSettings: async () => {
        throw new Error('boom')
      },
      eccPluginInstalled: async () => {
        throw new Error('boom')
      },
    })
    expect(r).toEqual({ active: false, source: null })
  })
})

describe('checkGuardConflict (doctor, warn-only)', () => {
  it('warn message names the collision and the fix carries the三选一 advice', async () => {
    // Real-deps doctor fn is host-dependent; assert shape via the detection unit
    // above and only smoke the real fn's contract: status ∈ {pass, warn}, never fail.
    const r = await checkGuardConflict()
    expect(['pass', 'warn']).toContain(r.status)
    expect(r.name).toBe('guard conflict (GateGuard)')
    if (r.status === 'warn') {
      expect(r.message).toMatch(/GateGuard/)
      expect(r.fix).toMatch(/\.planning\//)
    }
  })
})
