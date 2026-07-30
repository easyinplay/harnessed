// T2.7 D-2/D-3 delivery — the two damping stops must reach the model, not just the
// terminal. `harnessed checkpoint fail` prints them once on stderr; the per-turn
// UserPromptSubmit injection re-emits them from the persisted ledger every turn, which
// is what "refuse to spawn it again" can mean when the spawn happens in the harness
// rather than inside the CLI. Both lines are PURE reads of the ledger entry (the
// budget is resolved and stored at fail time so this builder stays yaml-free).

import { describe, expect, it } from 'vitest'
import { buildWorkflowStateBlock } from '../../src/checkpoint/injectState.js'
import type { CurrentWorkflowV1Type } from '../../src/checkpoint/schema/currentWorkflow.v1.js'
import { SCHEMA_VERSIONS } from '../../src/types/schemaVersion.js'

const wf = (entries: CurrentWorkflowV1Type['sub_progress']): CurrentWorkflowV1Type => ({
  schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
  phase: 'task',
  status: 'active',
  last_checkpoint_path: null,
  started_at: '2026-07-30T00:00:00.000Z',
  sub_progress: entries,
})

describe('buildWorkflowStateBlock — T2.7 damping breadcrumbs', () => {
  it('emits BUDGET-EXHAUSTED once fail_count reaches the persisted attempt_budget', () => {
    const out = buildWorkflowStateBlock(
      wf([
        {
          sub: 'task-test',
          status: 'failed',
          gate_fired: true,
          fail_count: 15,
          attempt_budget: 15,
        },
      ]),
    )
    expect(out).toContain('BUDGET-EXHAUSTED')
    expect(out).toContain('15/15')
    expect(out).toMatch(/do NOT spawn it again/)
  })

  it('stays silent below the budget', () => {
    const out = buildWorkflowStateBlock(
      wf([
        { sub: 'task-test', status: 'failed', gate_fired: true, fail_count: 4, attempt_budget: 15 },
      ]),
    )
    expect(out).not.toContain('BUDGET-EXHAUSTED')
  })

  it('emits NO-PROGRESS at the plateau threshold — even below the BREAK-LOOP failure count', () => {
    const out = buildWorkflowStateBlock(
      wf([
        {
          sub: 'task-test',
          status: 'failed',
          gate_fired: true,
          fail_count: 2,
          progress: { metric: 'failing_tests', failing_tests: 5, stale_count: 2 },
        },
      ]),
    )
    // fail_count 2 < LOOP_THRESHOLD 3 → BREAK-LOOP is silent; damping still fires.
    expect(out).not.toContain('BREAK-LOOP')
    expect(out).toContain('NO-PROGRESS')
    expect(out).toContain('failing_tests')
  })

  it('stays silent below the plateau threshold', () => {
    const out = buildWorkflowStateBlock(
      wf([
        {
          sub: 'task-test',
          status: 'failed',
          gate_fired: true,
          fail_count: 2,
          progress: { metric: 'evidence_digest', evidence_digest: 'abc', stale_count: 1 },
        },
      ]),
    )
    expect(out).not.toContain('NO-PROGRESS')
  })

  it('a pre-T2.7 ledger (no attempt_budget / no progress) is byte-identical to before', () => {
    const out = buildWorkflowStateBlock(
      wf([{ sub: 'task-test', status: 'failed', gate_fired: true, fail_count: 2 }]),
    )
    expect(out).not.toContain('BUDGET-EXHAUSTED')
    expect(out).not.toContain('NO-PROGRESS')
  })
})
