// Phase 3.2 W1 T1.7 — governance.ts 4 fixture unit test (D-04 PUSH LOCKED).
// Sister tests/checkpoint/state.test.ts (Phase 3.1 W1 T1.4) vi.mock fs/promises
// + Map-backed fsState pattern (direct analog).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fsState = new Map<string, string>()

vi.mock('node:fs/promises', () => ({
  readFile: async (p: string) => {
    const v = fsState.get(p)
    if (v === undefined) throw new Error(`ENOENT: ${p}`)
    return v
  },
}))

import { SCHEMA_VERSIONS } from '../../src/types/schemaVersion.js'
import { isVetoed, readGovernance } from '../../src/workflow/governance.js'

const GOV_PATH = '.harnessed/governance.json'

beforeEach(() => fsState.clear())
afterEach(() => vi.clearAllMocks())

describe('governance — D-04 PUSH lazy-read fail-soft', () => {
  it('1. missing file → readGovernance null + isVetoed false (active by default)', async () => {
    expect(await readGovernance()).toBeNull()
    expect(await isVetoed()).toBe(false)
  })

  it('2. status=active → readGovernance returns record + isVetoed false', async () => {
    fsState.set(
      GOV_PATH,
      JSON.stringify({ schemaVersion: SCHEMA_VERSIONS.governance, status: 'active' }),
    )
    const g = await readGovernance()
    expect(g?.status).toBe('active')
    expect(await isVetoed()).toBe(false)
  })

  it('3. status=vetoed (full metadata) → readGovernance returns record + isVetoed true', async () => {
    fsState.set(
      GOV_PATH,
      JSON.stringify({
        schemaVersion: SCHEMA_VERSIONS.governance,
        status: 'vetoed',
        reason: 'product strategy 不符',
        vetoed_at: '2026-05-16T12:00:00Z',
        vetoed_by: 'CEO',
      }),
    )
    const g = await readGovernance()
    expect(g?.status).toBe('vetoed')
    expect(g?.reason).toBe('product strategy 不符')
    expect(g?.vetoed_by).toBe('CEO')
    expect(await isVetoed()).toBe(true)
  })

  it('4. corrupt JSON → null fail-soft (no throw — threat T-3.2-01 graceful)', async () => {
    fsState.set(GOV_PATH, '{not valid json')
    expect(await readGovernance()).toBeNull()
    expect(await isVetoed()).toBe(false)
  })

  it('5. unknown schemaVersion → null (CD-5 rule (b) graceful degrade)', async () => {
    fsState.set(
      GOV_PATH,
      JSON.stringify({ schemaVersion: 'harnessed.future-thing.v9', status: 'vetoed' }),
    )
    expect(await readGovernance()).toBeNull()
    expect(await isVetoed()).toBe(false)
  })
})
