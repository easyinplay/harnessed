// Phase 3.2 W2 T2.6 — PlanFeatureWorkflowV1 TypeBox schema unit test (2 fixtures).

import { Value } from '@sinclair/typebox/value'
import { describe, expect, it } from 'vitest'
import { PlanFeatureWorkflowV1 } from '../../../src/workflow/schema/planFeature.js'

const validPhase = {
  id: '01-x',
  name: 'X',
  upstream: 'gstack',
  model: 'opus' as const,
  skills: ['plan-feature-decision'],
  max_iterations: 1,
}

describe('PlanFeatureWorkflowV1 — TypeBox DSL schema', () => {
  it('1. valid DSL parse (workflow + on_veto + 1 phase) → Value.Check returns true', () => {
    const valid = {
      workflow: 'plan-feature',
      on_veto: 'halt_workflow',
      phases: [validPhase],
    }
    expect(Value.Check(PlanFeatureWorkflowV1, valid)).toBe(true)
  })

  it('2. extra top-level field rejected (additionalProperties: false strict)', () => {
    const invalid = {
      workflow: 'plan-feature',
      extra: 'rogue',
      phases: [validPhase],
    }
    expect(Value.Check(PlanFeatureWorkflowV1, invalid)).toBe(false)
  })
})
