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
import {
  JudgmentRulesFile,
  JudgmentTriggersFile,
  UserOverridesFile,
} from '../../src/workflow/schema/judgment.js'
import { PhaseFactContext } from '../../src/workflow/schema/phaseFactContext.js'
import { WorkflowSchemaV2 } from '../../src/workflow/schema/workflow.js'

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
    'stage-phase-gate.yaml',
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

  test('B2: every shipped judgment yaml accounted for (12 file — 6 v2 base + 4 v3 NEW T3.3.W0.3 + 1 v3.6.0 Phase 3 user-overrides + 1 v5.1 Phase 9 stage-phase-gate)', () => {
    // v3.6.0 Phase 3 Wave 1 — added workflows/judgments/user-overrides.yaml
    // (P0b 上半 mechanism, validated via separate UserOverridesFile schema —
    // additive only, NOT in JudgmentFile union per Risk 3 mitigation).
    // v5.1 Phase 9 (GSD Core re-wire) — added workflows/judgments/stage-phase-gate.yaml
    // (4 design-contract phase triggers; triggers-shape, validated in P2-P6 loop above).
    expect(judgmentFiles.length).toBe(12)
  })

  test('B3: user-overrides.yaml passes UserOverridesFile schema (v3.6.0 Phase 3)', () => {
    const parsed = parseYaml(readFileSync(resolve(judgmentsDir, 'user-overrides.yaml'), 'utf8'))
    expect(Value.Check(UserOverridesFile, parsed)).toBe(true)
    // Sanity — must NOT validate against either JudgmentTriggersFile OR
    // JudgmentRulesFile (separate top-level shape per Phase 3 灰区 protocol).
    expect(Value.Check(JudgmentTriggersFile, parsed)).toBe(false)
    expect(Value.Check(JudgmentRulesFile, parsed)).toBe(false)
  })
})

// Phase v3.0-3.3 W0 T3.3.W0.7 — discriminated union (Pattern A B.3) fixture.
// behavioral category MUST have discipline_ref; tool-* category MUST NOT have discipline_ref.
describe('Capabilities v3 discriminated union — T3.3.W0.7', () => {
  test('C1: behavioral entry with discipline_ref passes', () => {
    const ok = {
      schema_version: 'harnessed.capabilities.v1',
      capabilities: {
        'karpathy-guidelines': {
          impl: 'harnessed-bundled',
          cmd: '<not-applicable-behavioral>',
          since: 'v2.0',
          category: 'behavioral',
          discipline_ref: 'workflows/disciplines/karpathy.yaml',
        },
      },
    }
    expect(Value.Check(Capabilities, ok)).toBe(true)
  })

  test('C2: tool entry WITHOUT discipline_ref passes', () => {
    const ok = {
      schema_version: 'harnessed.capabilities.v1',
      capabilities: {
        'grill-with-docs': {
          impl: 'mattpocock-skills',
          cmd: '/grill-with-docs',
          since: 'v2.0',
          category: 'tool-slash-cmd',
        },
      },
    }
    expect(Value.Check(Capabilities, ok)).toBe(true)
  })

  test('C3: tool entry WITH discipline_ref rejected (additionalProperties:false guards)', () => {
    const bad = {
      schema_version: 'harnessed.capabilities.v1',
      capabilities: {
        'rogue-tool': {
          impl: 'x',
          cmd: '/x',
          since: 'v3.0',
          category: 'tool-slash-cmd',
          discipline_ref: 'workflows/disciplines/karpathy.yaml',
        },
      },
    }
    expect(Value.Check(Capabilities, bad)).toBe(false)
  })

  test('C4: behavioral entry WITHOUT discipline_ref rejected (required field on variant)', () => {
    const bad = {
      schema_version: 'harnessed.capabilities.v1',
      capabilities: {
        'orphan-behavioral': {
          impl: 'harnessed-bundled',
          cmd: '<not-applicable-behavioral>',
          since: 'v3.0',
          category: 'behavioral',
        },
      },
    }
    expect(Value.Check(Capabilities, bad)).toBe(false)
  })

  test('C5: invalid discipline_ref pattern rejected (must match workflows/disciplines/<name>.yaml)', () => {
    const bad = {
      schema_version: 'harnessed.capabilities.v1',
      capabilities: {
        'bad-ref': {
          impl: 'harnessed-bundled',
          cmd: '<not-applicable-behavioral>',
          since: 'v3.0',
          category: 'behavioral',
          discipline_ref: 'invalid/path/karpathy.yml', // missing workflows/disciplines/ prefix, .yml not .yaml
        },
      },
    }
    expect(Value.Check(Capabilities, bad)).toBe(false)
  })

  test('C6: legacy v2 entry WITHOUT category still passes (Pattern A B.1 backward-compat)', () => {
    const legacy = {
      schema_version: 'harnessed.capabilities.v1',
      capabilities: {
        'legacy-v2-entry': {
          impl: 'mattpocock-skills',
          cmd: '/legacy',
          since: 'v2.0',
        },
      },
    }
    expect(Value.Check(Capabilities, legacy)).toBe(true)
  })
})

// Phase v3.0-3.3 W0 T3.3.W0.8 — phaseFactContext extend 13 NEW field MIN scope.
describe('PhaseFactContext v3 extend — T3.3.W0.8', () => {
  test('PF1: full valid v3 context passes (47 field — 20 phase + 18 subtask + 1 user + 8 root-flat)', () => {
    const ok = makeValidPhaseFactContext()
    expect(Value.Check(PhaseFactContext, ok)).toBe(true)
  })

  test('PF2: subtask.test_type invalid literal rejected (4-literal Union strict)', () => {
    const bad = makeValidPhaseFactContext()
    // biome-ignore lint/suspicious/noExplicitAny: intentional invalid mutation for test
    ;(bad.subtask as any).test_type = 'invalid-test-type'
    expect(Value.Check(PhaseFactContext, bad)).toBe(false)
  })

  test('PF3: subtask.search_type invalid literal rejected (6-literal Union strict)', () => {
    const bad = makeValidPhaseFactContext()
    // biome-ignore lint/suspicious/noExplicitAny: intentional invalid mutation for test
    ;(bad.subtask as any).search_type = 'invalid-search'
    expect(Value.Check(PhaseFactContext, bad)).toBe(false)
  })

  test('PF4: phase.is_complex_architecture missing rejected (required boolean per D-01)', () => {
    const bad = makeValidPhaseFactContext()
    // biome-ignore lint/suspicious/noExplicitAny: intentional invalid mutation for test
    delete (bad.phase as any).is_complex_architecture
    expect(Value.Check(PhaseFactContext, bad)).toBe(false)
  })

  test('PF5: root-flat is_critical_release missing rejected (required boolean per stage-routing)', () => {
    const bad = makeValidPhaseFactContext()
    // biome-ignore lint/suspicious/noExplicitAny: intentional invalid mutation for test
    delete (bad as any).is_critical_release
    expect(Value.Check(PhaseFactContext, bad)).toBe(false)
  })
})

// Phase v2.0-2.4 W0 T2.4.W0.1 — 5 NEW workflow.v2 fixture (R20.1 + R20.2 + R20.9).
// 4 valid (plan-feature v2 / execute-task v2 / research v2 / verify-work v2)
// + 1 invalid (additionalProperties unknown key — sister Phase 2.2 STRIDE T-2.2-02).
describe('workflow.v2 — 5 fixture (T2.4.W0.1)', () => {
  test('W1: plan-feature v1→v2 migration synthetic fixture passes', () => {
    const planFeatureV2 = {
      schema_version: 'harnessed.workflow.v2',
      workflow: 'plan-feature',
      description: 'Phase 2.4 W1 v2 plan-feature with capability + gate + on',
      phases: [
        {
          id: '01-gstack-decision',
          name: 'gstack-decision (governance gate)',
          upstream: 'gstack',
          model: 'opus',
          capability: '{{ capabilities.office-hours.cmd }}',
          gate: 'judgments.strategic-gate.office-hours.fires',
          max_iterations: 1,
        },
        {
          id: '02-brainstorm',
          name: 'brainstorm',
          upstream: 'superpowers',
          model: 'sonnet',
          capability: '{{ capabilities.brainstorming.cmd }}',
          on: [
            {
              if: 'judgments.subtask-gate.brainstorming.fires',
              invoke: '{{ capabilities.brainstorming.cmd }}',
            },
            { if: 'subtask.lines < 20', action: 'skip' },
          ],
          max_iterations: 5,
        },
      ],
    }
    expect(Value.Check(WorkflowSchemaV2, planFeatureV2)).toBe(true)
  })

  test('W2: execute-task v1→v2 migration synthetic fixture (ralph-loop + tdd + fallback) passes', () => {
    const executeTaskV2 = {
      schema_version: 'harnessed.workflow.v2',
      workflow: 'execute-task',
      phases: [
        {
          id: '02-code',
          name: 'code (karpathy always-on)',
          upstream: 'karpathy',
          model: 'sonnet',
          on: [
            {
              if: 'judgments.tdd-gate.tdd-strongly-suggested.fires',
              invoke: '{{ capabilities.tdd.cmd }}',
            },
          ],
        },
        {
          id: '04-deliver',
          name: 'deliver (ralph-loop COMPLETE)',
          upstream: 'ralph-loop',
          model: 'haiku',
          capability: '{{ capabilities.ralph-loop.cmd }}',
          args: { completion_promise: 'COMPLETE' },
          gate: 'judgments.parallelism-gate.fires',
          parallelism: 'judgments.parallelism-gate.ralph-loop-wrapper.fires',
          fallback: {
            max_iterations_exceeded: {
              action: 'emit_warning_and_halt',
              message: 'ralph-loop max-iterations exceeded',
              exit_code: 1,
            },
          },
          max_iterations: '{{ defaults.ralph_max_iterations.execute-task.04-deliver }}',
        },
      ],
    }
    expect(Value.Check(WorkflowSchemaV2, executeTaskV2)).toBe(true)
  })

  test('W3: research NEW v2 fixture with capability + gate + on populated', () => {
    const researchV2 = {
      schema_version: 'harnessed.workflow.v2',
      workflow: 'research',
      description: 'Phase 2.4 W2 NEW research workflow — superpowers + ctx7 + tavily',
      phases: [
        {
          id: '01-search',
          name: 'web search (tavily/exa route)',
          upstream: 'web-search',
          model: 'sonnet',
          capability: '{{ capabilities.tavily-search.cmd }}',
          gate: 'judgments.parallelism-gate.fires',
          on: [{ if: 'phase.requires_docs == true', invoke: '{{ capabilities.ctx7.cmd }}' }],
          artifacts_expected: ['findings.md', 'knowledge.md'],
        },
      ],
    }
    expect(Value.Check(WorkflowSchemaV2, researchV2)).toBe(true)
  })

  test('W4: verify-work NEW v2 fixture (7 phase + fallback per R20.10)', () => {
    const verifyWorkV2 = {
      schema_version: 'harnessed.workflow.v2',
      workflow: 'verify-work',
      description: 'Phase 2.4 W2 NEW verify-work — code-review + gstack/review + cso + qa',
      phases: [
        { id: '01-gsd-verify', name: 'GSD verify', upstream: 'gsd', model: 'sonnet' },
        {
          id: '02-code-review',
          name: 'code-review multi-agent',
          upstream: 'superpowers',
          model: 'sonnet',
        },
        {
          id: '03-gstack-review',
          name: 'gstack /review (Paranoid Staff Engineer)',
          upstream: 'gstack',
          model: 'opus',
        },
        { id: '04-cso', name: 'gstack /cso (security)', upstream: 'gstack', model: 'opus' },
        { id: '05-qa', name: 'gstack /qa (e2e)', upstream: 'gstack', model: 'sonnet' },
        { id: '06-simplifier', name: 'code-simplifier', upstream: 'superpowers', model: 'sonnet' },
        {
          id: '07-state-update',
          name: 'STATE.md + planning-with-files progress.md update',
          upstream: 'gsd',
          model: 'haiku',
          fallback: {
            max_iterations_exceeded: {
              action: 'emit_warning_and_halt',
              message: 'verify-work max-iter exceeded',
              exit_code: 1,
            },
          },
        },
      ],
    }
    expect(Value.Check(WorkflowSchemaV2, verifyWorkV2)).toBe(true)
  })

  test('W5: INVALID fixture — additionalProperties unknown key rejected + Errors path printed', () => {
    const invalid = {
      schema_version: 'harnessed.workflow.v2',
      workflow: 'execute-task',
      phases: [
        {
          id: '04-deliver',
          model: 'haiku',
          unknown_phase_key: 'leak', // STRIDE T-2.2-02 strict additionalProperties:false
        },
      ],
    }
    expect(Value.Check(WorkflowSchemaV2, invalid)).toBe(false)
    const errors = [...Value.Errors(WorkflowSchemaV2, invalid)]
    expect(errors.length).toBeGreaterThan(0)
    // Errors enumeration must produce a path string (sister N1 assertion pattern).
    expect(errors.some((e) => typeof e.path === 'string')).toBe(true)
  })
})

// Helper — builds a valid PhaseFactContext for mutation in negative/edge tests.
// Phase v3.0-3.3 W0 T3.3.W0.8 — 13 NEW field MIN scope (6 phase + 5 subtask + 2 root).
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
      // T3.3.W0.8 6 NEW core boolean
      is_complex_architecture: false,
      requires_creative_polish: false,
      requires_persisted_plan: false,
      requires_peer_review: false,
      is_final_step: false,
      has_business_decisions: false,
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
      // T3.3.W0.8 5 NEW (3 enum + 2 boolean)
      test_type: 'ci-commit' as const,
      search_type: 'keyword' as const,
      needs_lib_docs: false,
      needs_web_search: false,
      needs_google_workspace: false,
    },
    user: { explicit_signal: [] },
    teammate_send_message_needed: false,
    subagent_context_overflow: false,
    shared_task_list: false,
    opposing_hypothesis_debate: false,
    fullstack_three_way: false,
    test_fail: false,
    // T3.3.W0.8 2 NEW root-flat boolean
    needs_web_search: false,
    is_critical_release: false,
  }
}
