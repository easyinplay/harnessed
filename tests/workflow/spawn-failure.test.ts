// v16.0 Phase 66 T3 — the five named spawn failures (vocabulary layer).
//
// Shape is copied from `src/installers/lib/codexHookTrust.ts` (`TrustFailure`
// discriminated union + `RpcOutcome<T>`), per task_plan R5 — deliberately NOT a
// new invention.
//
// What this file locks:
//   1. the union has exactly the five names the SPEC enumerates
//   2. SpawnFailureError carries the kind as data (not as a message substring)
//   3. classifySpawnError recovers the kind from BOTH spawn paths' errors —
//      the codex one (SpawnFailureError) and the claude one (sdkSpawn's
//      SpawnTimeoutError / SpawnFailError). This is what stops run.ts from
//      flattening the classification into a string.
//   4. only SpawnTimeout is retryable (one retry, per SPEC)

import { describe, expect, it, vi } from 'vitest'

// sdkSpawn pulls the agent SDK at module load; keep it inert (Pattern J).
vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: () => (async function* () {})(),
}))

import { SpawnFailError, SpawnTimeoutError } from '../../src/workflow/lib/sdkSpawn.js'
import {
  classifySpawnError,
  isRetryableSpawnFailure,
  isSpawnFailure,
  SPAWN_FAILURES,
  SpawnFailureError,
} from '../../src/workflow/lib/spawnFailure.js'

describe('SpawnFailure union', () => {
  it('enumerates exactly the five SPEC names', () => {
    expect([...SPAWN_FAILURES]).toEqual([
      'SpawnTimeout',
      'SpawnExitNonZero',
      'SpawnOutputMalformed',
      'SpawnAuthFailed',
      'SpawnRefused',
    ])
  })

  it('isSpawnFailure guards unknown strings', () => {
    expect(isSpawnFailure('SpawnRefused')).toBe(true)
    expect(isSpawnFailure('SpawnWhatever')).toBe(false)
    expect(isSpawnFailure(undefined)).toBe(false)
  })
})

describe('SpawnFailureError', () => {
  it('carries the kind as a field and as the error name', () => {
    const e = new SpawnFailureError('SpawnRefused', 'sandbox rejected exec_command')
    expect(e).toBeInstanceOf(Error)
    expect(e.failure).toBe('SpawnRefused')
    expect(e.name).toBe('SpawnRefused')
    expect(e.message).toBe('sandbox rejected exec_command')
  })
})

describe('classifySpawnError', () => {
  it('recovers the kind from a codex-path SpawnFailureError', () => {
    expect(classifySpawnError(new SpawnFailureError('SpawnAuthFailed', 'not logged in'))).toBe(
      'SpawnAuthFailed',
    )
  })

  it('maps the claude-path SpawnTimeoutError to SpawnTimeout', () => {
    expect(classifySpawnError(new SpawnTimeoutError(5))).toBe('SpawnTimeout')
  })

  it('maps the claude-path SpawnFailError (no result message) to SpawnOutputMalformed', () => {
    // "the stream ended without the contractual result" — we got a run but not
    // the shape the contract promised. Same semantics as a codex run whose
    // `-o` file never appeared.
    expect(classifySpawnError(new SpawnFailError())).toBe('SpawnOutputMalformed')
  })

  it('returns undefined for anything that is not a spawn failure', () => {
    expect(classifySpawnError(new Error('boom'))).toBeUndefined()
    expect(classifySpawnError('boom')).toBeUndefined()
    expect(classifySpawnError(null)).toBeUndefined()
  })
})

describe('isRetryableSpawnFailure', () => {
  it('retries only timeouts', () => {
    expect(isRetryableSpawnFailure('SpawnTimeout')).toBe(true)
    for (const f of SPAWN_FAILURES.filter((k) => k !== 'SpawnTimeout')) {
      expect(isRetryableSpawnFailure(f)).toBe(false)
    }
  })
})
