// Phase 5.1 W2 T2.4 — TDD RED→GREEN state-lock.test.ts: 5 fixtures (R10.2 concurrent write lock)
// Sister tests/checkpoint/state.test.ts vi.mock fs/promises pattern延袭 + vi.mock proper-lockfile
// W-01 PLAN-CHECK resolve Path A: lock in writeCurrentWorkflow (state.ts self-locks); engineHook
// acquires transitively. No direct engineHook lock acquire (no double-lock deadlock per RESEARCH § 3.3)

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// vi.hoisted() ensures mocks are defined before vi.mock() factory (hoisting safe)
const { releaseMock, lockMock } = vi.hoisted(() => {
  const releaseMock = vi.fn().mockResolvedValue(undefined)
  const lockMock = vi.fn().mockResolvedValue(releaseMock)
  return { releaseMock, lockMock }
})

const fsState = new Map<string, string>()
const mkdirCalls: string[] = []

vi.mock('proper-lockfile', () => ({
  default: { lock: lockMock, check: vi.fn().mockResolvedValue(false) },
}))

vi.mock('node:fs/promises', () => ({
  readFile: async (p: string) => {
    const v = fsState.get(p)
    if (v === undefined) throw Object.assign(new Error(`ENOENT: ${p}`), { code: 'ENOENT' })
    return v
  },
  writeFile: async (p: string, data: string) => void fsState.set(p, data),
  mkdir: async (p: string) => void mkdirCalls.push(p),
  rename: async (src: string, dst: string) => {
    fsState.set(dst, fsState.get(src) as string)
    fsState.delete(src)
  },
  stat: vi.fn(),
}))

import { activate, LockHeldError, writeCurrentWorkflow } from '../../src/checkpoint/state.js'
import { getHarnessedRoot } from '../../src/installers/lib/harnessedRoot.js'
import { SCHEMA_VERSIONS } from '../../src/types/schemaVersion.js'

const HARNESSED_ROOT = getHarnessedRoot()

const makeWorkflow = () => ({
  schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
  phase: '5.1',
  status: 'active' as const,
  last_checkpoint_path: null,
  started_at: new Date().toISOString(),
})

beforeEach(() => {
  fsState.clear()
  mkdirCalls.length = 0
  lockMock.mockReset()
  releaseMock.mockReset()
  lockMock.mockResolvedValue(releaseMock)
  releaseMock.mockResolvedValue(undefined)
})
afterEach(() => vi.clearAllMocks())

describe('R10.2 concurrent write lock (T2.4 — 5 cells)', () => {
  it('cell 1 — serial writeCurrentWorkflow completes via lock acquire + release', async () => {
    await writeCurrentWorkflow(makeWorkflow())
    expect(lockMock).toHaveBeenCalledTimes(1)
    expect(lockMock).toHaveBeenCalledWith(
      HARNESSED_ROOT,
      expect.objectContaining({ stale: 10_000 }),
    )
    expect(releaseMock).toHaveBeenCalledTimes(1)
  })

  it('cell 2 — concurrent two writeCurrentWorkflow calls both complete (lock called twice)', async () => {
    const order: number[] = []
    const release1 = vi.fn().mockResolvedValue(undefined)
    const release2 = vi.fn().mockResolvedValue(undefined)
    lockMock
      .mockImplementationOnce(async () => {
        order.push(1)
        return release1
      })
      .mockImplementationOnce(async () => {
        order.push(2)
        return release2
      })
    await Promise.all([writeCurrentWorkflow(makeWorkflow()), writeCurrentWorkflow(makeWorkflow())])
    expect(order).toContain(1)
    expect(order).toContain(2)
    expect(release1).toHaveBeenCalledTimes(1)
    expect(release2).toHaveBeenCalledTimes(1)
  })

  it('cell 3 — lock rejected ELOCKED → LockHeldError with verbatim actionable message', async () => {
    const elocked: NodeJS.ErrnoException = new Error('Lock file is already being held')
    elocked.code = 'ELOCKED'
    lockMock.mockRejectedValue(elocked)
    await expect(writeCurrentWorkflow(makeWorkflow())).rejects.toBeInstanceOf(LockHeldError)
    await expect(writeCurrentWorkflow(makeWorkflow())).rejects.toThrow(
      /another harnessed process holds the lock/,
    )
    await expect(writeCurrentWorkflow(makeWorkflow())).rejects.toThrow(/harnessed status/)
  })

  it('cell 4 — non-ELOCKED lock error propagates as-is (release never acquired)', async () => {
    const ioErr = new Error('disk full')
    lockMock.mockRejectedValueOnce(ioErr)
    await expect(writeCurrentWorkflow(makeWorkflow())).rejects.toThrow('disk full')
    // Release mock should not be called since lock was never acquired
    expect(releaseMock).not.toHaveBeenCalled()
  })

  it('cell 5 — mkdir(<harnessed-root>) called and lock acquired on activate()', async () => {
    await activate('5.1', null)
    // After T2.2 implementation: lock must have been called via writeCurrentWorkflow
    expect(lockMock).toHaveBeenCalledTimes(1)
    expect(lockMock).toHaveBeenCalledWith(
      HARNESSED_ROOT,
      expect.objectContaining({ retries: expect.objectContaining({ retries: 3 }) }),
    )
    // mkdir should have been called for the harness root before lock
    expect(mkdirCalls).toContain(HARNESSED_ROOT)
    expect(releaseMock).toHaveBeenCalledTimes(1)
  })
})
