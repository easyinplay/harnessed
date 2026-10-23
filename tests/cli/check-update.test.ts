// Phase 20 — checkUpdate doctor check. Opt-in, fail-soft: 'warn' only when
// genuinely behind; 'pass' when current OR when npm is unreachable. The version
// fetcher is injectable so the unit test never spawns npm.

import { afterEach, describe, expect, it } from 'vitest'
import { checkUpdate } from '../../src/cli/lib/check-update.js'

const originalBun = Object.getOwnPropertyDescriptor(process.versions, 'bun')
afterEach(() => {
  if (originalBun) Object.defineProperty(process.versions, 'bun', originalBun)
  else Reflect.deleteProperty(process.versions, 'bun')
})

describe('checkUpdate', () => {
  it('Bun registry unavailability does not claim npm is unreachable', async () => {
    Object.defineProperty(process.versions, 'bun', { configurable: true, value: '1.4.4' })
    expect(await checkUpdate('4.4.0', async () => null)).toEqual({
      name: 'update',
      status: 'pass',
      message: 'update check skipped (registry unavailable)',
    })
  })

  it('behind → warn with X→Y and a run hint', async () => {
    const r = await checkUpdate('4.4.0', async () => '4.5.0')
    expect(r.name).toBe('update')
    expect(r.status).toBe('warn')
    expect(r.message).toContain('4.4.0')
    expect(r.message).toContain('4.5.0')
    expect(`${r.message} ${r.fix ?? ''}`).toContain('harnessed update')
  })
  it('current → pass', async () => {
    const r = await checkUpdate('4.5.0', async () => '4.5.0')
    expect(r.status).toBe('pass')
  })
  it('npm unreachable (null) → pass (fail-soft, check skipped)', async () => {
    const r = await checkUpdate('4.4.0', async () => null)
    expect(r).toEqual({
      name: 'update',
      status: 'pass',
      message: 'update check skipped (npm unreachable)',
    })
  })
  it('ahead (local dev > published) → pass', async () => {
    const r = await checkUpdate('4.6.0', async () => '4.5.0')
    expect(r.status).toBe('pass')
  })
})
