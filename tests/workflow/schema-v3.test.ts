// tests/workflow/schema-v3.test.ts — Phase v3.0-3.3 W0 T3.3.W0.5 (R30.9 + D-09 + D-05 + D-01).
// WorkflowSchemaV3 TypeBox fixture coverage:
//   4 positive valid (master delegates_to + sub-stage phases + standalone phases + minimal)
//   3 negative invalid (additionalProperties + invalid discipline literal + literal version)
//   3 edge case (empty arrays + 0 phases via Optional + master no-phases)
//
// Cross-cutting contract checks (D-09 + D-05 + D-01):
// - disciplines_applied 字段 strict Literal Union (Pattern A A.1) — typo basename fails
// - tools_available 字段 string[] cross-ref capabilities.yaml entry name (cross-validate T3.3.W0.10)
// - delegates_to 字段 master orchestrator only (DelegationClause with sub/gate?/mode?/order?)
// - invokes_tools phase-level conditional fire (InvokeToolClause)

import { Value } from '@sinclair/typebox/value'
import { describe, expect, test } from 'vitest'
import { WorkflowSchemaV3 } from '../../src/workflow/schema/workflow.js'

describe('WorkflowSchemaV3 — 4 positive', () => {
  test('V1: master orchestrator with delegates_to + disciplines_applied + tools_available', () => {
    const master = {
      schema_version: 'harnessed.workflow.v3',
      workflow: 'discuss',
      description: 'Stage ① master — 3 sub-stage independent gate route',
      disciplines_applied: [
        'karpathy',
        'output-style',
        'language',
        'operational',
        'priority',
        'protocols',
      ],
      tools_available: ['planning-with-files'],
      delegates_to: [
        {
          sub: 'strategic',
          gate: 'judgments.strategic-gate.gstack-office-hours.fires',
          mode: 'serial',
          order: 1,
        },
        {
          sub: 'phase',
          gate: 'judgments.phase-gate.gsd-discuss-phase.fires',
          mode: 'serial',
          order: 2,
        },
        { sub: 'subtask', mode: 'parallel' },
      ],
    }
    expect(Value.Check(WorkflowSchemaV3, master)).toBe(true)
  })

  test('V2: sub-stage workflow with phases + invokes_tools (D-05 conditional fire)', () => {
    const sub = {
      schema_version: 'harnessed.workflow.v3',
      workflow: 'discuss-strategic',
      disciplines_applied: [
        'karpathy',
        'output-style',
        'language',
        'operational',
        'priority',
        'protocols',
      ],
      tools_available: ['gstack-office-hours', 'gstack-plan-ceo-review', 'planning-with-files'],
      phases: [
        {
          id: '01-office-hours',
          name: 'gstack office-hours (CEO sanity check)',
          upstream: 'gstack',
          model: 'opus',
          capability: '{{ capabilities.gstack-office-hours.cmd }}',
          gate: 'judgments.strategic-gate.gstack-office-hours.fires',
          max_iterations: 1,
          invokes_tools: [
            { if: 'phase.has_business_decisions == true', tool: 'gstack-plan-ceo-review' },
          ],
        },
      ],
    }
    expect(Value.Check(WorkflowSchemaV3, sub)).toBe(true)
  })

  test('V3: standalone workflow with full v2-compat fields (research)', () => {
    const standalone = {
      schema_version: 'harnessed.workflow.v3',
      workflow: 'research',
      description: 'Stage ⓪ standalone — multi-source web search + lib docs fan-out',
      disciplines_applied: [
        'karpathy',
        'output-style',
        'language',
        'operational',
        'priority',
        'protocols',
      ],
      tools_available: ['tavily-search', 'exa-search', 'ctx7'],
      phases: [
        {
          id: '01-search',
          upstream: 'web-search',
          model: 'sonnet',
          on: [{ if: 'subtask.needs_lib_docs == true', invoke: '{{ capabilities.ctx7.cmd }}' }],
          artifacts_expected: ['findings.md', 'knowledge.md'],
          fallback: {
            max_iterations_exceeded: {
              action: 'emit_warning_and_halt',
              message: 'research max-iter exceeded',
              exit_code: 1,
            },
          },
        },
      ],
    }
    expect(Value.Check(WorkflowSchemaV3, standalone)).toBe(true)
  })

  test('V4: minimal valid (only schema_version + workflow + phases)', () => {
    const minimal = {
      schema_version: 'harnessed.workflow.v3',
      workflow: 'minimal',
      phases: [{ id: '01-x' }],
    }
    expect(Value.Check(WorkflowSchemaV3, minimal)).toBe(true)
  })
})

describe('WorkflowSchemaV3 — 3 negative', () => {
  test('N1: unknown additionalProperties at root rejected (STRIDE T-2.2-02)', () => {
    const bad = {
      schema_version: 'harnessed.workflow.v3',
      workflow: 'bad',
      phases: [{ id: '01-x' }],
      unknown_root_key: 42,
    }
    expect(Value.Check(WorkflowSchemaV3, bad)).toBe(false)
  })

  test('N2: invalid disciplines_applied literal (typo) rejected by strict Literal Union (Pattern A A.1)', () => {
    const bad = {
      schema_version: 'harnessed.workflow.v3',
      workflow: 'bad',
      disciplines_applied: ['karpatHy', 'output-style'], // typo 'karpatHy' (capital H)
      phases: [{ id: '01-x' }],
    }
    expect(Value.Check(WorkflowSchemaV3, bad)).toBe(false)
    const errors = [...Value.Errors(WorkflowSchemaV3, bad)]
    expect(errors.length).toBeGreaterThan(0)
  })

  test('N3: wrong literal schema_version rejected (v2 NOT accepted by v3 schema)', () => {
    const bad = {
      schema_version: 'harnessed.workflow.v2',
      workflow: 'bad',
      phases: [{ id: '01-x' }],
    }
    expect(Value.Check(WorkflowSchemaV3, bad)).toBe(false)
  })
})

describe('WorkflowSchemaV3 — 3 edge', () => {
  test('E1: master with delegates_to + NO phases passes (phases Optional)', () => {
    const masterNoPhases = {
      schema_version: 'harnessed.workflow.v3',
      workflow: 'plan',
      delegates_to: [{ sub: 'architecture' }, { sub: 'phase' }],
    }
    expect(Value.Check(WorkflowSchemaV3, masterNoPhases)).toBe(true)
  })

  test('E2: empty disciplines_applied + empty tools_available arrays pass (escape hatch — all disciplines off)', () => {
    const escapeHatch = {
      schema_version: 'harnessed.workflow.v3',
      workflow: 'escape',
      disciplines_applied: [],
      tools_available: [],
      phases: [{ id: '01-x' }],
    }
    expect(Value.Check(WorkflowSchemaV3, escapeHatch)).toBe(true)
  })

  test('E3: DelegationClause additionalProperties rejected (no rogue keys in sub spec)', () => {
    const bad = {
      schema_version: 'harnessed.workflow.v3',
      workflow: 'bad',
      delegates_to: [{ sub: 'strategic', rogue: 'leak' }],
    }
    expect(Value.Check(WorkflowSchemaV3, bad)).toBe(false)
  })
})
