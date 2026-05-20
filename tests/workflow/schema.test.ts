// tests/workflow/schema.test.ts — Phase v2.0-2.3 W0 T2.3.W0.6 (PLAN L240 15 fixture).
// 6 positive valid + 5 negative invalid + 4 edge case per acceptance (d).
// Validates shipped workflows/capabilities.yaml + workflows/judgments/*.yaml
// + PhaseFactContext typed shape.

import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { describe, expect, test } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { Capabilities } from '../../src/workflow/schema/capabilities.js'
import { JudgmentRulesFile, JudgmentTriggersFile } from '../../src/workflow/schema/judgment.js'
import { PhaseFactContext } from '../../src/workflow/schema/phaseFactContext.js'

const ROOT = resolve(__dirname, '../..')
const capRaw = readFileSync(resolve(ROOT, 'workflows/capabilities.yaml'), 'utf8')
const judgmentsDir = resolve(ROOT, 'workflows/judgments')
const judgmentFiles = readdirSync(judgmentsDir).filter((f) => f.endsWith('.yaml'))

describe('positive — 6 shipped yaml files validate', () => {
  test('P1: workflows/capabilities.yaml passes Capabilities schema', () => {
    expect(Value.Check(Capabilities, parseYaml(capRaw))).toBe(true)
  })

  for (const f of [
    'strategic-gate.yaml',
    'phase-gate.yaml',
    'subtask-gate.yaml',
    'parallelism-gate.yaml',
    'tdd-gate.yaml',
  ]) {
    test(`P2-P6 triggers shape — workflows/judgments/${f}`, () => {
      const parsed = parseYaml(readFileSync(resolve(judgmentsDir, f), 'utf8'))
      expect(Value.Check(JudgmentTriggersFile, parsed)).toBe(true)
    })
  }
})

describe('negative — 5 invalid fixture must fail Value.Check', () => {
  test('N1: missing schema_version', () => {
    const bad = { capabilities: { foo: { impl: 'x', cmd: '/x', since: 'v2.0' } } }
    expect(Value.Check(Capabilities, bad)).toBe(false)
    expect([...Value.Errors(Capabilities, bad)].length).toBeGreaterThan(0)
  })

  test('N2: missing required field (CapabilityEntry.since)', () => {
    const bad = {
      schema_version: 'harnessed.capabilities.v1',
      capabilities: { foo: { impl: 'x', cmd: '/x' } },
    }
    expect(Value.Check(Capabilities, bad)).toBe(false)
  })

  test('N3: additionalProperties unknown key on root', () => {
    const bad = {
      schema_version: 'harnessed.capabilities.v1',
      capabilities: {},
      unknown_root_key: 42,
    }
    expect(Value.Check(Capabilities, bad)).toBe(false)
  })

  test('N4: wrong literal schema_version value', () => {
    const bad = {
      schema_version: 'harnessed.capabilities.v2', // v2 NOT registered
      capabilities: {},
    }
    expect(Value.Check(Capabilities, bad)).toBe(false)
  })

  test('N5: wrong enum (PhaseFactContext.phase.type)', () => {
    const bad = makeValidPhaseFactContext()
    // biome-ignore lint/suspicious/noExplicitAny: intentional invalid mutation for test
    ;(bad.phase as any).type = 'invalid_phase_type'
    expect(Value.Check(PhaseFactContext, bad)).toBe(false)
  })
})

describe('edge — 4 case', () => {
  test('E1: empty capabilities map passes (empty Record allowed)', () => {
    const ok = { schema_version: 'harnessed.capabilities.v1', capabilities: {} }
    expect(Value.Check(Capabilities, ok)).toBe(true)
  })

  test('E2: empty triggers map passes (empty judgment file)', () => {
    const ok = { schema_version: 'harnessed.judgment.v1', triggers: {} }
    expect(Value.Check(JudgmentTriggersFile, ok)).toBe(true)
  })

  test('E3: nested unknown sub-key on CapabilityEntry.requires fails', () => {
    const bad = {
      schema_version: 'harnessed.capabilities.v1',
      capabilities: {
        foo: {
          impl: 'x',
          cmd: '/x',
          since: 'v2.0',
          requires: { unknown_nested_key: 'bad' },
        },
      },
    }
    expect(Value.Check(Capabilities, bad)).toBe(false)
  })

  test('E4: PhaseFactContext wrong field type (lines as string not number)', () => {
    const bad = makeValidPhaseFactContext()
    // biome-ignore lint/suspicious/noExplicitAny: intentional invalid mutation for test
    ;(bad.subtask as any).lines = 'not-a-number'
    expect(Value.Check(PhaseFactContext, bad)).toBe(false)
  })
})

describe('fallback.yaml rules-shape parity', () => {
  test('B1: fallback.yaml passes JudgmentRulesFile (NOT JudgmentTriggersFile)', () => {
    const parsed = parseYaml(readFileSync(resolve(judgmentsDir, 'fallback.yaml'), 'utf8'))
    expect(Value.Check(JudgmentRulesFile, parsed)).toBe(true)
    expect(Value.Check(JudgmentTriggersFile, parsed)).toBe(false)
  })

  test('B2: every shipped judgment yaml accounted for (6 file expected)', () => {
    expect(judgmentFiles.length).toBe(6)
  })
})

// Helper — builds a valid PhaseFactContext for mutation in negative/edge tests.
function makeValidPhaseFactContext() {
  return {
    phase: {
      type: 'new_feature' as const,
      open_decisions: 0,
      scope_days: 1,
      single_task: false,
      is_critical_module: false,
      has_ui_changes: false,
      has_auth_or_secrets: false,
      has_design_changes: false,
      is_major_release: false,
      is_large_refactor: false,
      spec_ambiguous: false,
      unfamiliar_module: false,
      has_cross_phase_data_flow: false,
      scope_locked_in_history: false,
    },
    subtask: {
      type: 'crud' as const,
      lines: 50,
      approaches: 1,
      core_algorithm: false,
      is_core_business_logic: false,
      is_algorithm: false,
      is_data_processing: false,
      regression_risk: 'low' as const,
      reliability_required: false,
      has_api_contract: false,
      error_cost: 'low' as const,
      parallel_count: 1,
      communication_needed: false,
    },
    user: { explicit_signal: [] },
    teammate_send_message_needed: false,
    subagent_context_overflow: false,
    shared_task_list: false,
    opposing_hypothesis_debate: false,
    fullstack_three_way: false,
    test_fail: false,
  }
}
