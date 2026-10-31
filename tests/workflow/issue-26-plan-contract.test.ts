import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { WorkflowSchemaV3, type WorkflowSchemaV3T } from '../../src/workflow/schema/workflow.js'

const ROOT = resolve(__dirname, '../..')
const SUBS = [
  ['spec', 'gsd-spec-phase', 'judgments.stage-phase-gate.gsd-spec-phase.fires'],
  ['ui', 'gsd-ui-phase', 'judgments.stage-phase-gate.gsd-ui-phase.fires'],
  ['secure', 'gsd-secure-phase', 'judgments.stage-phase-gate.gsd-secure-phase.fires'],
  [
    'ai-integration',
    'gsd-ai-integration-phase',
    'judgments.stage-phase-gate.gsd-ai-integration-phase.fires',
  ],
] as const

describe('issue #26 plan design-contract workflows', () => {
  it.each(SUBS)('%s ships a gated workflow and bilingual skill', (sub, capability, gate) => {
    const dir = resolve(ROOT, 'workflows', 'plan', sub)
    expect(existsSync(resolve(dir, 'SKILL.md'))).toBe(true)
    expect(existsSync(resolve(dir, 'SKILL.zh-Hans.md'))).toBe(true)
    const parsed = parseYaml(readFileSync(resolve(dir, 'workflow.yaml'), 'utf8')) as unknown
    expect(Value.Check(WorkflowSchemaV3, parsed)).toBe(true)
    const workflow = parsed as WorkflowSchemaV3T
    expect(workflow.workflow).toBe(`plan-${sub}`)
    expect(workflow.tools_available).toEqual([capability])
    expect(workflow.phases).toHaveLength(1)
    expect(workflow.phases?.[0]?.gate).toBe(gate)
  })

  it('defaults and role prompts register all four workflows in both locales', () => {
    const defaults = parseYaml(readFileSync(resolve(ROOT, 'workflows/defaults.yaml'), 'utf8')) as {
      ralph_max_iterations: Record<string, Record<string, number>>
    }
    const en = parseYaml(readFileSync(resolve(ROOT, 'workflows/role-prompts.yaml'), 'utf8')) as {
      prompts: Record<string, { primary_cap: string }>
    }
    const zh = parseYaml(
      readFileSync(resolve(ROOT, 'workflows/role-prompts.zh-Hans.yaml'), 'utf8'),
    ) as { prompts: Record<string, { primary_cap: string }> }
    for (const [sub, capability] of SUBS) {
      const workflow = `plan-${sub}`
      expect(defaults.ralph_max_iterations[workflow]).toBeDefined()
      expect(en.prompts[workflow]?.primary_cap).toBe(capability)
      expect(zh.prompts[workflow]?.primary_cap).toBe(capability)
    }
  })
})
