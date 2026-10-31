import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ownerHash, ownerPath } from '../../src/checkpoint/ownerPath.js'
import { harnessedSubdir } from '../../src/platform/harnessedRoot.js'

describe('checkpoint owner paths — issue #24', () => {
  it('hashes the full activeKey so repo and session both participate', () => {
    const first = ownerHash('D:/repo::session-a')
    const second = ownerHash('D:/repo::session-b')
    const otherRepo = ownerHash('D:/other::session-a')

    expect(first).toBe(createHash('sha256').update('D:/repo::session-a').digest('hex').slice(0, 16))
    expect(first).not.toBe(second)
    expect(first).not.toBe(otherRepo)
  })

  it('places checkpoint and archive artifacts below the owner hash', () => {
    const key = 'D:/repo::session-a'
    const hash = ownerHash(key)

    expect(ownerPath('checkpoints', ['plan.json'], key)).toBe(
      join(harnessedSubdir('checkpoints'), hash, 'plan.json'),
    )
    expect(ownerPath('archive', ['phase-plan', 'raw.json'], key)).toBe(
      join(harnessedSubdir('archive'), hash, 'phase-plan', 'raw.json'),
    )
  })
})
