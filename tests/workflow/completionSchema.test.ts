// issue #4 — COMPLETION_SCHEMA forced `phase` (required + task-chain-only enum)
// on EVERY spawn via sdkSpawn's outputFormat, but only the task chain
// (01-clarify / 02-code / 03-test / 04-deliver) has such a label. discuss / plan
// / verify / research / retro subs could not emit a schema-valid structured_output
// at all, so structured completion detection was unreachable for them. No consumer
// reads `phase` (isComplete + run.ts derive from `status`/`subtype` only), so the
// requirement was dead weight that broke non-task subs. These pin the relaxed
// contract: only `status` is required; `phase` is optional and unconstrained.

import { describe, expect, it } from 'vitest'
import { COMPLETION_SCHEMA } from '../../src/workflow/lib/completionSchema.js'

describe('COMPLETION_SCHEMA — issue #4 (task-only phase must not be forced on every spawn)', () => {
  it('requires only status, not phase', () => {
    expect(COMPLETION_SCHEMA.required).toEqual(['status'])
  })

  it('keeps the status enum COMPLETE/PARTIAL/BLOCKED', () => {
    expect(COMPLETION_SCHEMA.properties.status.enum).toEqual(['COMPLETE', 'PARTIAL', 'BLOCKED'])
  })

  it('no longer constrains phase to the task-chain enum (non-task subs may omit or free-label it)', () => {
    const phase = COMPLETION_SCHEMA.properties.phase as { type?: string; enum?: unknown }
    expect(phase.enum).toBeUndefined()
    expect(phase.type).toBe('string')
  })
})
