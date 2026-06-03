// v4.1.3 — unit tests for crash-safe atomic writes (temp → rename).

import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { writeFileAtomic, writeFileSyncAtomic } from '../../src/checkpoint/atomicWrite.js'

let dir: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'harnessed-atomic-'))
})
afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
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
