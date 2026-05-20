// tests/workflow/research-v2.test.ts — Phase v2.0-2.4 W2 T2.4.W2.1
// (D-08 R20.7 NEW workflow research multi-source fan-out)
//
// 4 fixture per teammate brief acceptance verbatim:
//   F1: yaml parse + TypeBox Value.Check(WorkflowSchemaV2) pass + schema_version=workflow.v2 + 2 phase count
//   F2: 3 source capability refs (tavily-mcp / exa-mcp / ctx7) resolve from capabilities.yaml
//   F3: GSD discuss-phase synth capability ref at 02-synth resolves
//   F4: defaults.yaml ralph_max_iterations.research.{01-fan-out,02-synth} numeric value 1-100 range

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { describe, expect, test } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { Capabilities } from '../../src/workflow/schema/capabilities.js'
import { WorkflowSchemaV2 } from '../../src/workflow/schema/workflow.js'

const ROOT = resolve(__dirname, '../..')
const WORKFLOW_PATH = resolve(ROOT, 'workflows/research/workflow.yaml')
const CAPABILITIES_PATH = resolve(ROOT, 'workflows/capabilities.yaml')
const DEFAULTS_PATH = resolve(ROOT, 'workflows/defaults.yaml')

const rawYaml = readFileSync(WORKFLOW_PATH, 'utf8')
const parsed = parseYaml(rawYaml) as {
  schema_version: string
  workflow: string
  description?: string
  phases: Array<{
    id: string
    upstream?: string
    capability?: string
    model?: string
    max_iterations?: number | string
    parallelism?: string
  }>
}

describe('research workflow.yaml v2 — T2.4.W2.1 (D-08 + R20.7)', () => {
  test('F1: yaml parse + Value.Check(WorkflowSchemaV2) pass + schema_version=workflow.v2 + 2 phase', () => {
    expect(parsed.schema_version).toBe('harnessed.workflow.v2')
    expect(parsed.workflow).toBe('research')
    expect(parsed.phases).toHaveLength(2)

    if (!Value.Check(WorkflowSchemaV2, parsed)) {
      const errors = [...Value.Errors(WorkflowSchemaV2, parsed)].slice(0, 3)
      throw new Error(`Schema mismatch: ${errors.map((e) => `${e.path}: ${e.message}`).join('; ')}`)
    }
    expect(Value.Check(WorkflowSchemaV2, parsed)).toBe(true)
  })

  test('F2: 3 source capability refs (tavily-mcp / exa-mcp / ctx7) exist in capabilities.yaml', () => {
    const capRaw = readFileSync(CAPABILITIES_PATH, 'utf8')
    const capParsed = parseYaml(capRaw) as {
      schema_version: string
      capabilities: Record<string, { impl: string; cmd: string }>
    }
    expect(Value.Check(Capabilities, capParsed)).toBe(true)

    const tavily = capParsed.capabilities['tavily-mcp']
    const exa = capParsed.capabilities['exa-mcp']
    const ctx7 = capParsed.capabilities.ctx7
    if (!tavily) throw new Error('tavily-mcp entry missing in capabilities.yaml')
    if (!exa) throw new Error('exa-mcp entry missing in capabilities.yaml')
    if (!ctx7) throw new Error('ctx7 entry missing in capabilities.yaml')
    expect(tavily.impl).toBeTruthy()
    expect(exa.impl).toBeTruthy()
    expect(ctx7.impl).toBeTruthy()
  })

  test('F3: 02-synth phase wires gsd-discuss-phase capability template interpolation', () => {
    const synth = parsed.phases.find((p) => p.id === '02-synth')
    if (!synth) throw new Error('02-synth phase missing')
    expect(synth.capability).toBe('{{ capabilities.gsd-discuss-phase.cmd }}')
    expect(synth.upstream).toBe('gsd')

    const capRaw = readFileSync(CAPABILITIES_PATH, 'utf8')
    const capParsed = parseYaml(capRaw) as {
      capabilities: Record<string, { cmd: string }>
    }
    const gsdEntry = capParsed.capabilities['gsd-discuss-phase']
    if (!gsdEntry) throw new Error('gsd-discuss-phase entry missing in capabilities.yaml')
    expect(gsdEntry.cmd).toBeTruthy()
  })

  test('F4: defaults.yaml ralph_max_iterations.research.{01-fan-out,02-synth} numeric in 1-100 range', () => {
    const defaultsRaw = readFileSync(DEFAULTS_PATH, 'utf8')
    const defaults = parseYaml(defaultsRaw) as {
      ralph_max_iterations: { research: Record<string, number> }
      hard_upper_limit: number
    }
    const fanOut = defaults.ralph_max_iterations.research['01-fan-out']
    const synth = defaults.ralph_max_iterations.research['02-synth']
    expect(fanOut).toBeGreaterThanOrEqual(1)
    expect(fanOut).toBeLessThanOrEqual(defaults.hard_upper_limit)
    expect(synth).toBeGreaterThanOrEqual(1)
    expect(synth).toBeLessThanOrEqual(defaults.hard_upper_limit)
  })
})
