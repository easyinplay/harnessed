// Phase 3.1 W2 T2.4 — template.test.ts: 5 fixtures (14-18) + D-01 grep gate.
// vi.mock fs sister pattern: state.test.ts (W1 T1.4).

import { readFile } from 'node:fs/promises'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fsState = new Map<string, string>()
const mkdirCalls: string[] = []

vi.mock('node:fs', () => ({
  writeFileSync: (p: string, data: string) => void fsState.set(p, data),
  mkdirSync: (p: string) => void mkdirCalls.push(p),
}))

import { join as pathJoin } from 'node:path'
import type { CheckpointV1Type } from '../../src/checkpoint/schema/index.js'
import {
  CheckpointTooLargeError,
  CheckpointWriteError,
  enforceBudget,
  estimateTokens,
  writeCheckpoint,
} from '../../src/checkpoint/template.js'
import { harnessedSubdir } from '../../src/installers/lib/harnessedRoot.js'
import { SCHEMA_VERSIONS } from '../../src/types/schemaVersion.js'

const makeCheckpoint = (overrides: Partial<CheckpointV1Type> = {}): CheckpointV1Type => ({
  schemaVersion: SCHEMA_VERSIONS.checkpoint,
  phase: '3.1',
  status: 'active',
  last_task: 'T2.4',
  key_decisions: ['D-01 zero-LLM'],
  canonical_refs: ['.planning/phase-3.1/PLAN.md'],
  cwd: 'D:/GitCode/harnessed',
  timestamp: '2026-05-16T10:00:00.000Z',
  archive_path: '.harnessed/checkpoints/3.1.json',
  ...overrides,
})

beforeEach(() => {
  fsState.clear()
  mkdirCalls.length = 0
})
afterEach(() => vi.clearAllMocks())

describe('template — writeCheckpoint + enforceBudget (T2.4 fixtures 14-18)', () => {
  it('14. happy path: valid CheckpointV1 → writes to default path + content matches', () => {
    const cp = makeCheckpoint()
    const p = writeCheckpoint(cp)
    // v3.0.3 — default path is under the homedir-rooted harness root.
    const expected = pathJoin(harnessedSubdir('checkpoints'), '3.1.json')
    expect(p).toBe(expected)
    expect(fsState.get(p)).toBe(JSON.stringify(cp, null, 2))
    expect(mkdirCalls).toContain(harnessedSubdir('checkpoints'))
  })

  it('15. budget within: 500-token checkpoint → no truncation, JSON content === input', () => {
    const cp = makeCheckpoint({ last_task: 'short task' })
    const out = enforceBudget(cp)
    expect(out).toEqual(cp)
    expect(estimateTokens(JSON.stringify(out))).toBeLessThanOrEqual(1000)
  })

  it('16. budget over level 1: long last_task → truncate to ≤200 chars + ≤1000 tokens', () => {
    const cp = makeCheckpoint({ last_task: 'x'.repeat(5000) })
    const out = enforceBudget(cp)
    expect(out.last_task.length).toBeLessThanOrEqual(200)
    expect(estimateTokens(JSON.stringify(out))).toBeLessThanOrEqual(1000)
  })

  it('17. budget over level 2: huge key_decisions → truncate to 5 items + ≤1000 tokens', () => {
    // last_task small; only key_decisions blows budget.
    const cp = makeCheckpoint({
      last_task: 'x',
      key_decisions: Array.from({ length: 200 }, (_, i) => `decision-${i}-${'y'.repeat(20)}`),
    })
    const out = enforceBudget(cp)
    expect(out.key_decisions.length).toBeLessThanOrEqual(5)
    expect(estimateTokens(JSON.stringify(out))).toBeLessThanOrEqual(1000)
  })

  it('18. budget impossible: canonical_refs blow budget (not truncated) → throw CheckpointTooLargeError', () => {
    // canonical_refs is preserved (high-value); 200 long refs cannot be truncated.
    const cp = makeCheckpoint({
      last_task: 'x',
      key_decisions: ['d1'],
      canonical_refs: Array.from(
        { length: 200 },
        (_, i) => `.planning/ref-${i}-${'z'.repeat(30)}.md`,
      ),
    })
    expect(() => enforceBudget(cp)).toThrow(CheckpointTooLargeError)
  })

  it('19. writeCheckpoint throws CheckpointWriteError on schema violation (missing cwd)', () => {
    const cp = makeCheckpoint()
    const { cwd: _cwd, ...invalid } = cp
    expect(() => writeCheckpoint(invalid as CheckpointV1Type)).toThrow(CheckpointWriteError)
  })

  it('20. D-01 守门: template.ts source contains zero LLM-call markers', async () => {
    const src = await readFile('src/checkpoint/template.ts', 'utf8')
    expect(src).not.toMatch(/@anthropic-ai|Anthropic|query\(|messages\.create/)
  })
})
