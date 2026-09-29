// v16.0 Phase 66 T3 — the classification survives run.ts's catch.
//
// Before this phase `_dispatchSkillStub.fn` flattened every spawn exception
// into `sdkSpawn failed for <phase>: <message>` and the typed kind
// (SpawnFailError / SpawnTimeoutError) was gone for good. These two tests are
// the regression fence: `output` keeps its historical wording AND `failure`
// now names which of the five it was.
//
// Scope note: writing `failure` into the leaf ledger is T4 (checkpoint schema +
// runCheckpointFail). Nothing here touches src/checkpoint/**.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Drive the real sdkSpawn against a controllable stream — that way the errors
// under test are the genuine SpawnFailError / SpawnTimeoutError instances, not
// hand-built stand-ins.
let hangForever = false
vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: () =>
    (async function* () {
      if (hangForever) await new Promise(() => {})
    })(),
}))

import { _dispatchSkillStub } from '../../src/workflow/run.js'

let savedTimeout: string | undefined

beforeEach(() => {
  hangForever = false
  savedTimeout = process.env.HARNESSED_SPAWN_TIMEOUT_MS
})
afterEach(() => {
  if (savedTimeout === undefined) delete process.env.HARNESSED_SPAWN_TIMEOUT_MS
  else process.env.HARNESSED_SPAWN_TIMEOUT_MS = savedTimeout
})

describe('_dispatchSkillStub.fn spawn-failure classification', () => {
  it('keeps SpawnOutputMalformed when the stream ends with no result message', async () => {
    const r = await _dispatchSkillStub.fn('01-probe')
    expect(r.status).toBe('fail')
    expect(r.failure).toBe('SpawnOutputMalformed')
    // historical wording preserved — nothing downstream had to change
    expect(r.output).toContain('sdkSpawn failed for 01-probe')
  })

  it('keeps SpawnTimeout when the wall clock fires', async () => {
    process.env.HARNESSED_SPAWN_TIMEOUT_MS = '20'
    hangForever = true
    const r = await _dispatchSkillStub.fn('02-probe')
    expect(r.status).toBe('fail')
    expect(r.failure).toBe('SpawnTimeout')
  })
})
