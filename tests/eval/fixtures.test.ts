// 4.31.0 eval Slice A (T8) — vitest thin shell over the SAME engine: every
// shipped scenario under fixtures/eval must PASS against its committed golden.
// This is the local inner loop (src via vitest transform); CI additionally
// runs `harnessed eval` from dist (OV4 — the production artifact).

import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runEvalSuite } from '../../src/eval/runner.js'

describe('fixtures/eval trap suite (thin shell)', () => {
  it('all committed scenarios PASS', async () => {
    const suite = await runEvalSuite(join(process.cwd(), 'fixtures', 'eval'), {})
    expect(suite.results.length).toBeGreaterThanOrEqual(2)
    const notPass = suite.results.filter((r) => r.status !== 'PASS')
    expect(notPass.map((r) => `${r.name}: ${r.status}\n${(r.detail ?? []).join('\n')}`)).toEqual([])
  }, 60_000)
})
