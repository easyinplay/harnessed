// tests/workflow/execute-task-v2.test.ts — Phase v2.0-2.4 W1.1 T2.4.W1.1 (3 fixture).
// Validates shipped workflows/execute-task/phases.yaml v2:
//   (a) yaml parse pass
//   (b) TypeBox Value.Check(WorkflowSchemaV2) pass — sister schema.test.ts W2 fixture pattern
//   (c) fallback.max_iterations_exceeded field shape verify — engine-handler API contract
//
// Sister Phase 2.4 W0.1 ship: src/workflow/schema/workflow.ts + tests/workflow/schema.test.ts
// W2 (executeTaskV2 synthetic). This test consumes the SHIPPED phases.yaml on disk.

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { describe, expect, test } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { WorkflowSchemaV2 } from '../../src/workflow/schema/workflow.js'

const ROOT = resolve(__dirname, '../..')
const phasesPath = resolve(ROOT, 'workflows/execute-task/phases.yaml')
const phasesRaw = readFileSync(phasesPath, 'utf8')
const phasesParsed = parseYaml(phasesRaw) as {
  schema_version: string
  workflow: string
  phases: Array<{
    id: string
    capability?: string
    args?: Record<string, unknown>
    gate?: string
    parallelism?: string
    on?: Array<{ if: string; invoke?: string; action?: string }>
    fallback?: {
      max_iterations_exceeded?: { action: string; message: string; exit_code: number }
    }
  }>
}

describe('execute-task phases.yaml v2 (T2.4.W1.1)', () => {
  test('F1: yaml parse pass + schema_version harnessed.workflow.v2', () => {
    expect(phasesParsed.schema_version).toBe('harnessed.workflow.v2')
    expect(phasesParsed.workflow).toBe('execute-task')
    expect(phasesParsed.phases).toHaveLength(4)
    const ids = phasesParsed.phases.map((p) => p.id)
    expect(ids).toEqual(['01-clarify', '02-code', '03-test', '04-deliver'])
  })

  test('F2: TypeBox Value.Check(WorkflowSchemaV2, phases.yaml) pass', () => {
    expect(Value.Check(WorkflowSchemaV2, phasesParsed)).toBe(true)
  })

  test('F3: fallback.max_iterations_exceeded API contract (engine-handler T2.4.W1.2 consume)', () => {
    const deliver = phasesParsed.phases.find((p) => p.id === '04-deliver')
    expect(deliver).toBeDefined()
    expect(deliver?.capability).toBe('{{ capabilities.ralph-loop.cmd }}')
    expect(deliver?.args?.completion_promise).toBe('COMPLETE')
    expect(deliver?.gate).toBe('judgments.parallelism-gate.fires')
    expect(deliver?.parallelism).toBe('judgments.parallelism-gate.ralph-loop-wrapper.fires')

    const fb = deliver?.fallback?.max_iterations_exceeded
    expect(fb).toBeDefined()
    expect(fb?.action).toBe('emit_warning_and_halt')
    expect(typeof fb?.message).toBe('string')
    expect(fb?.message).toContain('{{ args.max_iterations }}')
    expect(fb?.exit_code).toBe(1)
  })

  test('F4: 02-code on[] mattpocock route by condition (D-09 + D-13)', () => {
    const code = phasesParsed.phases.find((p) => p.id === '02-code')
    expect(code?.on).toBeDefined()
    expect(code?.on).toHaveLength(3)
    const ifs = code?.on?.map((o) => o.if) ?? []
    expect(ifs).toContain('judgments.tdd-gate.tdd-strongly-suggested.fires')
    expect(ifs).toContain('phase.spec_ambiguous == true')
    expect(ifs).toContain('phase.unfamiliar_module == true')
  })
})
