// T2.7 D-1 — the completion promise moves from the DEAD path to the LIVE path.
//
// `isComplete` (src/workflow/lib/ralphLoop.ts, 4-layer dual signal) had exactly one
// consumer: src/workflow/run.ts, i.e. `harnessed run` — the path every SKILL forbids
// ("Do NOT pipe to `harnessed run`", workflows/auto/SKILL.md). This adapter lets
// `harnessed checkpoint complete` verify the same claim. The predicate itself is
// REUSED verbatim (tests/routing + tests/workflow already cover its 4 layers); this
// file only covers the adapter: input sourcing and the three-way verdict.

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { verifyCompletionClaim } from '../../src/checkpoint/completionClaim.js'

describe('verifyCompletionClaim', () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'harnessed-claim-'))
  })
  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  it('no input → not_provided (the gate is unarmed; the caller warns, never blocks)', async () => {
    expect(await verifyCompletionClaim({})).toEqual({ verdict: 'not_provided', source: null })
    expect(await verifyCompletionClaim({ result: '   ' })).toEqual({
      verdict: 'not_provided',
      source: null,
    })
  })

  it('verbatim promise in raw text → complete', async () => {
    const r = await verifyCompletionClaim({ result: 'done here <promise>COMPLETE</promise>' })
    expect(r.verdict).toBe('complete')
    expect(r.source).toBe('--result')
  })

  it('think-out-loud "COMPLETE" without the wrapper → incomplete (promiseExtract disambiguation)', async () => {
    const r = await verifyCompletionClaim({ result: 'I think the task is COMPLETE in nature.' })
    expect(r.verdict).toBe('incomplete')
  })

  it('structured BLOCKED envelope → incomplete', async () => {
    const env = JSON.stringify({ subtype: 'success', structured_output: { status: 'BLOCKED' } })
    expect((await verifyCompletionClaim({ result: env })).verdict).toBe('incomplete')
  })

  it('structured COMPLETE on an ERRORED run → incomplete (a claim on a broken run is not trusted)', async () => {
    const env = JSON.stringify({
      subtype: 'error_during_execution',
      structured_output: { status: 'COMPLETE' },
    })
    expect((await verifyCompletionClaim({ result: env })).verdict).toBe('incomplete')
  })

  it('reads --result-file (Windows quoting-safe channel) and reports it as the source', async () => {
    const p = join(dir, 'out.txt')
    writeFileSync(p, '<promise>COMPLETE</promise>\n')
    const r = await verifyCompletionClaim({ resultFile: p })
    expect(r.verdict).toBe('complete')
    expect(r.source).toBe(p)
  })

  it('--result-file wins over --result when both are supplied', async () => {
    const p = join(dir, 'out.txt')
    writeFileSync(p, 'nothing here')
    const r = await verifyCompletionClaim({ result: '<promise>COMPLETE</promise>', resultFile: p })
    expect(r.verdict).toBe('incomplete')
    expect(r.source).toBe(p)
  })

  it('unreadable --result-file → incomplete, NOT not_provided (an unverifiable claim is fail-closed)', async () => {
    const r = await verifyCompletionClaim({ resultFile: join(dir, 'missing.txt') })
    expect(r.verdict).toBe('incomplete')
  })
})
