// tests/workflow/plan-feature-v2.test.ts — Phase v2.0-2.4 W1 T2.4.W1.3
// (D-15 + Q-AUDIT-5a LOCKED Option A: planning-with-files = Claude Code plugin slash cmd `/plan`)
//
// 5 fixture per teammate brief acceptance verbatim:
//   F1: yaml parse + TypeBox Value.Check(WorkflowSchemaV2) pass
//   F2: planning-with-files capability entry resolve from capabilities.yaml + impl=claude-code-plugin
//   F3: 4 gate refs resolve via judgmentResolver (strategic / phase / subtask) — NO ENOENT / TriggerNotFoundError
//   F4: invokes: '/plan' literal present at 05-persist + artifacts_expected = [task_plan.md, progress.md, findings.md]
//   F5: Q-AUDIT-5a anti-pattern guard — raw yaml text NO `fs.writeFile` / NO `require.*planning-with-files` / NO `import.*planning-with-files`

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { describe, expect, test } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { resolveJudgmentGate } from '../../src/workflow/judgmentResolver.js'
import { Capabilities } from '../../src/workflow/schema/capabilities.js'
import { WorkflowSchemaV2 } from '../../src/workflow/schema/workflow.js'

const ROOT = resolve(__dirname, '../..')
const WORKFLOW_PATH = resolve(ROOT, 'workflows/plan-feature/workflow.yaml')
const CAPABILITIES_PATH = resolve(ROOT, 'workflows/capabilities.yaml')

const rawYaml = readFileSync(WORKFLOW_PATH, 'utf8')
const parsed = parseYaml(rawYaml) as {
  schema_version: string
  workflow: string
  phases: Array<{
    id: string
    capability?: string
    invokes?: string
    gate?: string
    on?: Array<{ if: string; invoke?: string; action?: string }>
    artifacts_expected?: string[]
  }>
}

describe('plan-feature workflow.yaml v2 — T2.4.W1.3 (D-15 + Q-AUDIT-5a)', () => {
  test('F1: yaml parse + TypeBox Value.Check(WorkflowSchemaV2) passes', () => {
    expect(parsed.schema_version).toBe('harnessed.workflow.v2')
    expect(parsed.workflow).toBe('plan-feature')
    expect(parsed.phases).toHaveLength(5)
    expect(Value.Check(WorkflowSchemaV2, parsed)).toBe(true)
    // sister N1 pattern — print errors path if Value.Check fails
    if (!Value.Check(WorkflowSchemaV2, parsed)) {
      const errors = [...Value.Errors(WorkflowSchemaV2, parsed)]
      console.error('WorkflowSchemaV2 errors:', errors)
    }
  })

  test('F2: planning-with-files capability entry resolves with impl=claude-code-plugin + cmd=/plan', () => {
    const capRaw = readFileSync(CAPABILITIES_PATH, 'utf8')
    const capParsed = parseYaml(capRaw) as {
      capabilities: Record<
        string,
        { impl: string; cmd: string; requires?: { plugin?: string }; outputs?: string[] }
      >
    }
    expect(Value.Check(Capabilities, capParsed)).toBe(true)
    const entry = capParsed.capabilities['planning-with-files']
    if (!entry) throw new Error('planning-with-files entry missing')
    expect(entry.impl).toBe('claude-code-plugin')
    expect(entry.cmd).toBe('/plan')
    expect(entry.requires?.plugin).toMatch(/planning-with-files >=2\.2\.0/)
    expect(entry.outputs).toEqual(['task_plan.md', 'progress.md', 'findings.md'])
  })

  test('F3: 3 gate / on refs resolve via judgmentResolver (cross-file, NO ENOENT / NO TriggerNotFoundError)', async () => {
    // 01-gstack-decision gate (strategic-gate)
    const r1 = await resolveJudgmentGate(
      'judgments.strategic-gate.office-hours.fires',
      { phase: { type: 'new_feature', scope_locked_in_history: false } },
      ROOT,
    )
    expect(r1).toBe(true)

    // 02-brainstorm on[0].if (subtask-gate)
    const r2 = await resolveJudgmentGate(
      'judgments.subtask-gate.brainstorming.fires',
      {
        subtask: {
          approaches: 3,
          core_algorithm: false,
          has_api_contract: false,
          error_cost: 'low',
        },
      },
      ROOT,
    )
    expect(r2).toBe(true)

    // 03-gsd-discuss on[0].if (phase-gate)
    const r3 = await resolveJudgmentGate(
      'judgments.phase-gate.gsd-discuss-phase.fires',
      {
        phase: {
          open_decisions: 3,
          has_cross_phase_data_flow: false,
          scope_days: 2,
        },
      },
      ROOT,
    )
    expect(r3).toBe(true)
  })

  test('F4: invokes:/plan literal + capability template + artifacts_expected list at 05-persist', () => {
    const persist = parsed.phases.find((p) => p.id === '05-persist')
    expect(persist).toBeDefined()
    expect(persist?.invokes).toBe('/plan')
    expect(persist?.capability).toBe('{{ capabilities.planning-with-files.cmd }}')
    expect(persist?.artifacts_expected).toEqual(['task_plan.md', 'progress.md', 'findings.md'])
    // on clause: invoke when phase.scope_days > 1 OR phase.is_critical_module == true
    expect(persist?.on).toHaveLength(1)
    const onClause = persist?.on?.[0]
    if (!onClause) throw new Error('persist.on[0] missing')
    expect(onClause.if).toMatch(/scope_days/)
    expect(onClause.if).toMatch(/is_critical_module/)
    expect(onClause.action).toBe('invoke')

    // 01-gstack-decision must carry gate ref + capability ref
    const gstack = parsed.phases.find((p) => p.id === '01-gstack-decision')
    expect(gstack?.gate).toBe('judgments.strategic-gate.office-hours.fires')
    expect(gstack?.capability).toBe('{{ capabilities.gstack-office-hours.cmd }}')
  })

  test('F5: Q-AUDIT-5a anti-pattern guard — yaml syntax NO fs.writeFile / NO npm SDK import|require', () => {
    // Strip yaml comment lines (anti-pattern guard docs themselves mention
    // "fs.writeFile" in `# ...` lines — guard targets actual yaml key:value
    // syntax NOT documentation mentions). Sister CLAUDE.md "引用原文规则".
    const yamlNoComments = rawYaml
      .split('\n')
      .filter((line) => !line.trim().startsWith('#'))
      .join('\n')

    // anti-pattern grep — rejected option (c) fs.writeFile self-impl as yaml value
    expect(yamlNoComments).not.toMatch(/fs\.writeFile/)
    expect(yamlNoComments).not.toMatch(/\bwriteFile\b\s*\(/)
    // anti-pattern grep — rejected npm SDK call (verified 2026-05-20 npm registry 404)
    expect(yamlNoComments).not.toMatch(/^\s*import\s.+planning-with-files/m)
    expect(yamlNoComments).not.toMatch(/^\s*require\s*\(.*planning-with-files/m)

    // positive — Q-AUDIT-5a Option A path a (Claude Code plugin slash cmd `/plan`)
    expect(rawYaml).toMatch(/invokes:\s*['"]?\/plan['"]?/)
    expect(rawYaml).toMatch(
      /capability:\s*['"]?\{\{\s*capabilities\.planning-with-files\.cmd\s*\}\}['"]?/,
    )
  })
})
