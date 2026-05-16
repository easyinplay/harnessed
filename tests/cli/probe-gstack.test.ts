// Phase 3.2 W1 T1.5 — probe-gstack.ts 5-fixture unit test (D-01 PROBE 4 outcome
// branches + 1 Win shell flavor matrix). Sister tests/cli/audit.test.ts (Phase
// 2.4 W4) vi.mock('node:child_process') + ssOk/ssFail stub pattern.

import type { SpawnSyncReturns } from 'node:child_process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:child_process', () => ({ spawnSync: vi.fn() }))

import { spawnSync } from 'node:child_process'
import { probeGstackPrefix } from '../../src/cli/lib/probe-gstack.js'

const spawnSyncMock = vi.mocked(spawnSync)

const ssFound = (path: string): SpawnSyncReturns<string> =>
  ({ status: 0, stdout: `${path}\n`, stderr: '' }) as SpawnSyncReturns<string>
const ssNotFound = (): SpawnSyncReturns<string> =>
  ({ status: 1, stdout: '', stderr: 'not found' }) as SpawnSyncReturns<string>

const ORIG_PLATFORM = process.platform

beforeEach(() => {
  spawnSyncMock.mockReset()
})
afterEach(() => {
  Object.defineProperty(process, 'platform', { value: ORIG_PLATFORM })
})

describe('probeGstackPrefix — D-01 PROBE 4 outcome branches + Win shell flavor', () => {
  it('1. gstack-office-hours only → status=pass, prefix=gstack-', () => {
    spawnSyncMock
      .mockReturnValueOnce(ssFound('/usr/local/bin/gstack-office-hours'))
      .mockReturnValueOnce(ssNotFound())
    const r = probeGstackPrefix()
    expect(r.status).toBe('pass')
    expect(r.prefix).toBe('gstack-')
    expect(r.detail).toContain('gstack-office-hours found')
  })

  it('2. office-hours only → status=pass, prefix="" (--no-prefix mode)', () => {
    spawnSyncMock
      .mockReturnValueOnce(ssNotFound())
      .mockReturnValueOnce(ssFound('/usr/local/bin/office-hours'))
    const r = probeGstackPrefix()
    expect(r.status).toBe('pass')
    expect(r.prefix).toBe('')
    expect(r.detail).toContain('office-hours found')
  })

  it('3. both found → status=fail, detail=ambiguous, fix=edit config.json', () => {
    spawnSyncMock
      .mockReturnValueOnce(ssFound('/usr/local/bin/gstack-office-hours'))
      .mockReturnValueOnce(ssFound('/usr/local/bin/office-hours'))
    const r = probeGstackPrefix()
    expect(r.status).toBe('fail')
    expect(r.detail).toContain('ambiguous')
    expect(r.fix).toContain('edit .harnessed/config.json')
  })

  it('4. neither found → status=fail, detail=neither, fix=install gstack', () => {
    spawnSyncMock.mockReturnValueOnce(ssNotFound()).mockReturnValueOnce(ssNotFound())
    const r = probeGstackPrefix()
    expect(r.status).toBe('fail')
    expect(r.detail).toContain('neither')
    expect(r.fix).toContain('install gstack')
  })

  it('5. Win platform → spawnSync called with "where" not "which"', () => {
    Object.defineProperty(process, 'platform', { value: 'win32' })
    spawnSyncMock.mockReturnValue(ssNotFound())
    probeGstackPrefix()
    expect(spawnSyncMock).toHaveBeenCalledWith('where', ['gstack-office-hours'], expect.any(Object))
    expect(spawnSyncMock).toHaveBeenCalledWith('where', ['office-hours'], expect.any(Object))
    expect(spawnSyncMock).not.toHaveBeenCalledWith('which', expect.anything(), expect.anything())
  })
})
