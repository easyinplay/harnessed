// v4.1.3 — unit tests for crash-safe atomic writes (temp → rename).

import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { writeFileAtomic, writeFileSyncAtomic } from '../../src/checkpoint/atomicWrite.js'

let dir: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'harnessed-atomic-'))
})
afterEach(() => {
  // retries — a concurrent writer's tmp may be momentarily locked on Windows
  // (see the EPERM note in the concurrency block); ride out the lock release.
  rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 })
})

describe('writeFileSyncAtomic', () => {
  it('writes content to the final path', () => {
    const p = join(dir, 'state.json')
    writeFileSyncAtomic(p, '{"a":1}')
    expect(readFileSync(p, 'utf8')).toBe('{"a":1}')
  })

  it('leaves no .tmp file behind after success', () => {
    writeFileSyncAtomic(join(dir, 'x.json'), 'data')
    expect(readdirSync(dir)).toEqual(['x.json'])
  })

  it('overwrites an existing file', () => {
    const p = join(dir, 'y.json')
    writeFileSyncAtomic(p, 'old')
    writeFileSyncAtomic(p, 'new')
    expect(readFileSync(p, 'utf8')).toBe('new')
    expect(readdirSync(dir)).toEqual(['y.json'])
  })
})

describe('writeFileAtomic (async)', () => {
  it('writes content to the final path', async () => {
    const p = join(dir, 'cw.json')
    await writeFileAtomic(p, '{"status":"active"}')
    expect(readFileSync(p, 'utf8')).toBe('{"status":"active"}')
  })

  it('leaves no .tmp file behind after success', async () => {
    await writeFileAtomic(join(dir, 'z.json'), 'data')
    expect(readdirSync(dir)).toEqual(['z.json'])
  })
})

// v4.11.1 regression — a shared `<path>.tmp` raced when parallel `harnessed setup`
// force-update installers all wrote the same state.json: both wrote `<path>.tmp`,
// the first rename moved it, the second rename hit ENOENT. Two-part fix: (1) each
// write gets a UNIQUE tmp name (pid + monotonic counter) so no writer's tmp is
// yanked out — kills the ENOENT; (2) the rename retries on transient contention
// (Windows MoveFileEx EPERM/EACCES/EBUSY when many writers hit the SAME target).
// Contract under test: N concurrent writers all succeed (no rejection of any
// code), the final file is one writer's *complete* payload (last-writer-wins is
// fine; a partial/corrupt blend is not), and no `.tmp` is left behind.
describe('writeFileAtomic — concurrent writers to the same path (v4.11.1 race fix)', () => {
  it('async: N parallel writes to one path all succeed and leave a complete file + no tmp', async () => {
    const p = join(dir, 'state.json')
    const N = 25
    const payloads = Array.from({ length: N }, (_, i) => JSON.stringify({ writer: i }))

    const results = await Promise.allSettled(payloads.map((data) => writeFileAtomic(p, data)))

    // Unique tmp names + bounded rename retry → no writer crashes (the old bug was
    // ENOENT; Windows could also EPERM on same-target contention — both retried).
    const rejected = results.filter((r) => r.status === 'rejected')
    expect(rejected.map((r) => (r as PromiseRejectedResult).reason)).toEqual([])

    // A rename wins → the final file is one complete payload, and every unique tmp
    // was consumed by its retrying rename (only the final file remains).
    expect(payloads).toContain(readFileSync(p, 'utf8'))
    expect(readdirSync(dir)).toEqual(['state.json'])
  })

  it('sync: repeated writes to one path leave only the final file (unique tmp names)', () => {
    const p = join(dir, 'sync-state.json')
    for (let i = 0; i < 10; i++) writeFileSyncAtomic(p, JSON.stringify({ n: i }))
    expect(readFileSync(p, 'utf8')).toBe('{"n":9}')
    expect(readdirSync(dir)).toEqual(['sync-state.json'])
  })
})
