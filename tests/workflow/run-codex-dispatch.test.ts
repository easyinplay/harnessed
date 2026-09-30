// v16.0 Phase 66 T3b — the dispatch is wired into run.ts, not just unit-tested.
//
// tests/workflow/spawn-dispatch.test.ts proves the routing function; this file
// proves `_dispatchSkillStub.fn` actually goes through it, which is the whole
// point of T3b (codexExecSpawn shipped in T2 with zero callers).
//
// `codexExecSpawn` is mocked at the module boundary — no child process, no
// quota, no codex binary needed. The host is pinned with HARNESSED_PLATFORM,
// precedence step 1 of detectPlatform.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SpawnFailureError } from '../../src/workflow/lib/spawnFailure.js'

const codexCalls: Array<{ expertName: string }> = []
let codexImpl: () => Promise<string> = async () =>
  JSON.stringify({ subtype: 'success', text: 'from codex <promise>COMPLETE</promise>' })

vi.mock('../../src/workflow/lib/codexExecSpawn.js', () => ({
  codexExecSpawn: async (_def: unknown, opts: { expertName: string }) => {
    codexCalls.push({ expertName: opts.expertName })
    return codexImpl()
  },
}))

// Kept inert so importing sdkSpawn (still reachable on the claude branch) never
// reaches the real SDK.
vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: () => (async function* () {})(),
}))

import { _dispatchSkillStub } from '../../src/workflow/run.js'

let savedPlatform: string | undefined

beforeEach(() => {
  codexCalls.length = 0
  codexImpl = async () =>
    JSON.stringify({ subtype: 'success', text: 'from codex <promise>COMPLETE</promise>' })
  savedPlatform = process.env.HARNESSED_PLATFORM
  process.env.HARNESSED_PLATFORM = 'codex'
})
afterEach(() => {
  if (savedPlatform === undefined) delete process.env.HARNESSED_PLATFORM
  else process.env.HARNESSED_PLATFORM = savedPlatform
})

describe('_dispatchSkillStub.fn on a codex host', () => {
  it('routes the spawn to codexExecSpawn and consumes its envelope', async () => {
    const r = await _dispatchSkillStub.fn('01-code')
    expect(codexCalls).toEqual([{ expertName: '01-code' }])
    expect(r.status).toBe('ok')
    expect(r.output).toContain('from codex')
  })

  it('keeps the five-way classification raised by the codex path', async () => {
    codexImpl = async () => {
      throw new SpawnFailureError('SpawnRefused', 'sandbox rejected the tool call')
    }
    const r = await _dispatchSkillStub.fn('02-probe')
    expect(r.status).toBe('fail')
    expect(r.failure).toBe('SpawnRefused')
  })

  it('does NOT touch codexExecSpawn once the host is claude', async () => {
    process.env.HARNESSED_PLATFORM = 'claude'
    // the inert SDK mock yields no result message → SpawnFailError, i.e. the
    // claude path ran (a codex route would have returned the stub envelope).
    const r = await _dispatchSkillStub.fn('03-probe')
    expect(codexCalls).toHaveLength(0)
    expect(r.status).toBe('fail')
    expect(r.failure).toBe('SpawnOutputMalformed')
  })
})
