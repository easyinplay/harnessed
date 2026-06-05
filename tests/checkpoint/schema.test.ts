// Phase 3.1 W1 T1.4 — schema.test.ts: 6 fixtures covering CheckpointV1 +
// CurrentWorkflowV1 + branchOnSchemaVersion routing + 8-surface SCHEMA_VERSIONS
// grep gate. Sister of `tests/routing/sdk-spawn.test.ts` (vitest pattern).

import { Value } from '@sinclair/typebox/value'
import { describe, expect, it } from 'vitest'
import { CheckpointV1, CurrentWorkflowV1 } from '../../src/checkpoint/schema/index.js'
import { branchOnSchemaVersion, SCHEMA_VERSIONS } from '../../src/types/schemaVersion.js'

const validCheckpoint = {
  schemaVersion: SCHEMA_VERSIONS.checkpoint,
  phase: '3.1',
  status: 'active' as const,
  last_task: 'T1.4',
  key_decisions: ['D-02 KARPATHY'],
  canonical_refs: ['.planning/phase-3.1/PLAN.md'],
  session_id: 'sess-abc',
  cwd: 'D:/GitCode/harnessed',
  timestamp: '2026-05-16T10:00:00.000Z',
  archive_path: '.harnessed/checkpoints/3.1.json',
}

const validCurrentWorkflow = {
  schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
  phase: '3.1',
  status: 'active' as const,
  last_checkpoint_path: '.harnessed/checkpoints/3.1.json',
  started_at: '2026-05-16T10:00:00.000Z',
}

describe('schema — CheckpointV1 + CurrentWorkflowV1 (T1.4 fixtures 1-6)', () => {
  it('1. SCHEMA_VERSIONS exports ≥ 8 surfaces (8th currentWorkflow ship gate)', () => {
    const surfaces = Object.values(SCHEMA_VERSIONS)
    expect(surfaces.length).toBeGreaterThanOrEqual(8)
    expect(surfaces).toContain('harnessed.current-workflow.v1')
    expect(surfaces).toContain('harnessed.checkpoint.v1')
  })

  it('2. branchOnSchemaVersion routes checkpoint.v1 → v1 handler', () => {
    const r = branchOnSchemaVersion(SCHEMA_VERSIONS.checkpoint, {
      v1: () => 'v1-checkpoint',
      unknown: () => 'unknown',
    })
    expect(r).toBe('v1-checkpoint')
  })

  it('3. branchOnSchemaVersion routes current-workflow.v1 → v1 handler', () => {
    const r = branchOnSchemaVersion(SCHEMA_VERSIONS.currentWorkflow, {
      v1: () => 'v1-current',
      unknown: () => 'unknown',
    })
    expect(r).toBe('v1-current')
  })

  it('4. branchOnSchemaVersion routes unknown string → unknown handler (CD-5 rule b)', () => {
    const r = branchOnSchemaVersion('harnessed.unknown-future.v2', {
      v1: () => 'v1',
      unknown: () => 'unknown-bucket',
    })
    expect(r).toBe('unknown-bucket')
  })

  it('5. Value.Check CheckpointV1 happy round-trip + reject missing cwd (R § 1.3)', () => {
    expect(Value.Check(CheckpointV1, validCheckpoint)).toBe(true)
    const { cwd: _cwd, ...noCwd } = validCheckpoint
    expect(Value.Check(CheckpointV1, noCwd)).toBe(false)
  })

  it('6. Value.Check rejects invalid status + additionalProperties + missing schemaVersion', () => {
    expect(Value.Check(CurrentWorkflowV1, validCurrentWorkflow)).toBe(true)
    expect(Value.Check(CurrentWorkflowV1, { ...validCurrentWorkflow, status: 'cancelled' })).toBe(
      false,
    )
    expect(Value.Check(CurrentWorkflowV1, { ...validCurrentWorkflow, extra: 'no' })).toBe(false)
    const { schemaVersion: _sv, ...noSv } = validCurrentWorkflow
    expect(Value.Check(CurrentWorkflowV1, noSv)).toBe(false)
  })
})

describe('schema — sub_progress ledger (v5.0 Spec 1, ADR-0033 additive optional)', () => {
  it('a. old shape WITHOUT sub_progress still passes (additive optional, no version bump)', () => {
    // `validCurrentWorkflow` carries no sub_progress → backward-compatible.
    expect('sub_progress' in validCurrentWorkflow).toBe(false)
    expect(Value.Check(CurrentWorkflowV1, validCurrentWorkflow)).toBe(true)
  })

  it('b. new shape with three-state sub_progress entries passes', () => {
    const withLedger = {
      ...validCurrentWorkflow,
      sub_progress: [
        {
          sub: 'task-clarify',
          status: 'done' as const,
          gate_fired: true,
          evidence_status: 'verified' as const,
          evidence: [{ path: '.planning/DISCUSS.md', sha256: 'abc1234' }],
        },
        {
          sub: 'task-test',
          status: 'pending' as const,
          gate_fired: true,
          evidence_status: 'none_declared' as const,
        },
        {
          sub: 'task-deliver',
          status: 'skipped' as const,
          gate_fired: false,
          reason: 'gate skipped: trivial change',
        },
      ],
    }
    expect(Value.Check(CurrentWorkflowV1, withLedger)).toBe(true)
  })

  it('c. illegal evidence_status value is rejected', () => {
    const bad = {
      ...validCurrentWorkflow,
      sub_progress: [
        { sub: 'task-code', status: 'done' as const, gate_fired: true, evidence_status: 'passed' },
      ],
    }
    expect(Value.Check(CurrentWorkflowV1, bad)).toBe(false)
  })
})
