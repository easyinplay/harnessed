// tests/workflow/execute-task-v3.test.ts — v3.4.4 Phase 4 Commit 1 NEW
// Sister tests/workflow/research-v2.test.ts pattern (4 fixtures shape).
// PHASE-4-SPEC L413-417 verbatim:
//   F1: workflows/execute-task/workflow.yaml parses + Value.Check(WorkflowSchemaV3) true + 4 phases
//   F2: phase ids = ['01-clarify','02-code','03-test','04-deliver']
//       + per-phase models = ['opus','sonnet','sonnet','haiku'] (intel CD-2 § 第 4 条 defaults)
//   F3: capability refs (superpowers-brainstorming / tdd / grill-with-docs / zoom-out /
//       diagnose / ralph-loop) all resolve in workflows/capabilities.yaml
//   F4: 04-deliver.fallback.max_iterations_exceeded shape valid +
//       defaults.ralph_max_iterations.execute-task.{01..04} all numeric 1-hard_upper_limit

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { describe, expect, test } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { Capabilities } from '../../src/workflow/schema/capabilities.js'
import { WorkflowSchemaV3 } from '../../src/workflow/schema/workflow.js'

const ROOT = resolve(__dirname, '../..')
const WORKFLOW_PATH = resolve(ROOT, 'workflows/execute-task/workflow.yaml')
const CAPABILITIES_PATH = resolve(ROOT, 'workflows/capabilities.yaml')
const DEFAULTS_PATH = resolve(ROOT, 'workflows/defaults.yaml')

const rawYaml = readFileSync(WORKFLOW_PATH, 'utf8')
const parsed = parseYaml(rawYaml) as {
  schema_version: string
  workflow: string
  description?: string
  disciplines_applied?: string[]
  tools_available?: string[]
  phases: Array<{
    id: string
    name?: string
    upstream?: string
    capability?: string
    model?: string
    max_iterations?: number | string
    gate?: string
    parallelism?: string
    args?: Record<string, unknown>
    on?: Array<{ if: string; invoke?: string; action?: string }>
    fallback?: {
      max_iterations_exceeded?: { action: string; message: string; exit_code: number }
    }
  }>
}

describe('execute-task workflow.yaml v3 — Phase 4 Commit 1 (PHASE-4-SPEC L413-417)', () => {
  test('F1: yaml parse + Value.Check(WorkflowSchemaV3) pass + schema_version=workflow.v3 + 4 phases', () => {
    expect(parsed.schema_version).toBe('harnessed.workflow.v3')
    expect(parsed.workflow).toBe('execute-task')
    expect(parsed.phases).toHaveLength(4)

    if (!Value.Check(WorkflowSchemaV3, parsed)) {
      const errors = [...Value.Errors(WorkflowSchemaV3, parsed)].slice(0, 3)
      throw new Error(`Schema mismatch: ${errors.map((e) => `${e.path}: ${e.message}`).join('; ')}`)
    }
    expect(Value.Check(WorkflowSchemaV3, parsed)).toBe(true)
  })

  test('F2: phase ids + per-phase models = opus/sonnet/sonnet/haiku (intel CD-2 § 第 4 条 defaults)', () => {
    const ids = parsed.phases.map((p) => p.id)
    expect(ids).toEqual(['01-clarify', '02-code', '03-test', '04-deliver'])

    const models = parsed.phases.map((p) => p.model)
    expect(models).toEqual(['opus', 'sonnet', 'sonnet', 'haiku'])
  })

  test('F3: 6 capability refs resolve in capabilities.yaml (brainstorming / tdd / grill-with-docs / zoom-out / diagnose / ralph-loop)', () => {
    const capRaw = readFileSync(CAPABILITIES_PATH, 'utf8')
    const capParsed = parseYaml(capRaw) as {
      schema_version: string
      capabilities: Record<string, { impl: string; cmd: string }>
    }
    expect(Value.Check(Capabilities, capParsed)).toBe(true)

    const requiredRefs = [
      'superpowers-brainstorming',
      'tdd',
      'grill-with-docs',
      'zoom-out',
      'diagnose',
      'ralph-loop',
    ]
    for (const ref of requiredRefs) {
      const entry = capParsed.capabilities[ref]
      if (!entry) throw new Error(`${ref} entry missing in capabilities.yaml`)
      expect(entry.cmd).toBeTruthy()
    }
  })

  test('F4: 04-deliver fallback shape valid + defaults.ralph_max_iterations.execute-task.{01..04} numeric 1-hard_upper_limit', () => {
    const deliver = parsed.phases.find((p) => p.id === '04-deliver')
    if (!deliver) throw new Error('04-deliver phase missing')
    const fb = deliver.fallback?.max_iterations_exceeded
    if (!fb) throw new Error('04-deliver.fallback.max_iterations_exceeded missing')
    expect(fb.action).toBe('emit_warning_and_halt')
    expect(fb.message).toMatch(/ralph-loop max-iterations/)
    expect(fb.exit_code).toBe(1)

    const defaultsRaw = readFileSync(DEFAULTS_PATH, 'utf8')
    const defaults = parseYaml(defaultsRaw) as {
      ralph_max_iterations: { 'execute-task': Record<string, number> }
      hard_upper_limit: number
    }
    const table = defaults.ralph_max_iterations['execute-task']
    const phaseIds = ['01-clarify', '02-code', '03-test', '04-deliver']
    for (const id of phaseIds) {
      const value = table[id]
      expect(typeof value).toBe('number')
      expect(value).toBeGreaterThanOrEqual(1)
      expect(value).toBeLessThanOrEqual(defaults.hard_upper_limit)
    }
  })
})
