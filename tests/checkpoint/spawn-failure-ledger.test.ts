// v16.0 Phase 66 T4 — the five named spawn failures reach the leaf ledger.
//
// Two things are locked here, and the second one is the expensive one:
//
//   1. `spawn_failure` round-trips through the current-workflow schema and the
//      ledger writers.
//   2. it is ADDITIVE-OPTIONAL in the strict sense: an entry that was never
//      given one must not carry the key at all. 13 eval goldens compare the
//      serialized ledger verbatim (fixtures/eval/*/golden.json), so a field that
//      materialized as `"spawn_failure": undefined`/null would drift all of them
//      at once.

import { Value } from '@sinclair/typebox/value'
import { describe, expect, it } from 'vitest'
import { annotateSpawnFailure, markSub } from '../../src/checkpoint/ledger.js'
import {
  CurrentWorkflowV1,
  type SubProgressEntryType,
} from '../../src/checkpoint/schema/currentWorkflow.v1.js'
import { SPAWN_FAILURES } from '../../src/workflow/lib/spawnFailure.js'

const record = (entries: SubProgressEntryType[]) => ({
  schemaVersion: 'harnessed.current-workflow.v1',
  phase: 'task',
  status: 'active',
  last_checkpoint_path: null,
  started_at: '2026-09-30T00:00:00.000Z',
  sub_progress: entries,
})

const pending = (sub = 'task-code'): SubProgressEntryType => ({
  sub,
  status: 'pending',
  gate_fired: true,
})

describe('T4 schema — spawn_failure on a ledger entry', () => {
  it('accepts every one of the five kinds', () => {
    for (const kind of SPAWN_FAILURES) {
      expect(Value.Check(CurrentWorkflowV1, record([{ ...pending(), spawn_failure: kind }]))).toBe(
        true,
      )
    }
  })

  it('rejects a kind outside the five (the enum is the contract, not a free string)', () => {
    expect(
      Value.Check(
        CurrentWorkflowV1,
        record([
          { ...pending(), spawn_failure: 'SpawnWhatever' } as unknown as SubProgressEntryType,
        ]),
      ),
    ).toBe(false)
  })

  it('BACK-COMPAT: a pre-T4 record with no spawn_failure anywhere still validates', () => {
    expect(
      Value.Check(
        CurrentWorkflowV1,
        record([
          { sub: 'task-code', status: 'failed', gate_fired: true, fail_count: 1 },
          { sub: 'task-test', status: 'skipped', gate_fired: false, reason: 'gate false' },
        ]),
      ),
    ).toBe(true)
  })
})

describe('T4 golden fence — the key is ABSENT when unset', () => {
  it('markSub without the option leaves no spawn_failure key behind', () => {
    const after = markSub([pending()], 'task-code', 'failed')
    expect(Object.hasOwn(after[0] as object, 'spawn_failure')).toBe(false)
    expect(JSON.stringify(after)).not.toContain('spawn_failure')
  })

  it('annotateSpawnFailure leaves the other entries byte-identical', () => {
    const before = [pending('task-code'), pending('task-test')]
    const after = annotateSpawnFailure(before, 'task-code', 'SpawnTimeout')
    expect(JSON.stringify(after[1])).toBe(JSON.stringify(before[1]))
  })
})

describe('T4 writers', () => {
  it('markSub records the kind alongside the ->failed transition', () => {
    const after = markSub([pending()], 'task-code', 'failed', { spawn_failure: 'SpawnAuthFailed' })
    expect(after[0]?.spawn_failure).toBe('SpawnAuthFailed')
    expect(after[0]?.status).toBe('failed')
    expect(after[0]?.fail_count).toBe(1)
  })

  it('markSub without the option keeps a previously recorded kind (undefined never erases)', () => {
    const seeded = markSub([pending()], 'task-code', 'failed', { spawn_failure: 'SpawnRefused' })
    const again = markSub(seeded, 'task-code', 'failed')
    expect(again[0]?.spawn_failure).toBe('SpawnRefused')
  })

  it('annotateSpawnFailure sets the kind WITHOUT moving status or fail_count', () => {
    const after = annotateSpawnFailure([pending()], 'task-code', 'SpawnExitNonZero')
    expect(after[0]?.spawn_failure).toBe('SpawnExitNonZero')
    expect(after[0]?.status).toBe('pending')
    expect(after[0]?.fail_count).toBeUndefined()
  })

  it('annotateSpawnFailure is a no-op for an unseeded sub (never throws, unlike markSub)', () => {
    const before = [pending('task-code')]
    expect(annotateSpawnFailure(before, 'task-nope', 'SpawnTimeout')).toBe(before)
    expect(() => markSub(before, 'task-nope', 'failed')).toThrow(/not found in ledger/)
  })
})
