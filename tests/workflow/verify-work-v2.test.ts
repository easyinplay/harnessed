// tests/workflow/verify-work-v2.test.ts — Phase v2.0-2.4 W2 T2.4.W2.2
// (D-12 Q-AUDIT-2 amend + R20.12 + R20.11 + R20.14 + R20.16 fallback chain_isolation)
//
// 5 fixture per teammate brief acceptance verbatim:
//   F1: yaml parse pass + TypeBox Value.Check(WorkflowSchemaV2) pass + 9 phase count + schema_version=workflow.v2
//   F2: 9 phase count + critical capability refs resolve (gsd-verify-work / code-review / gstack-review / agent-teams-create)
//   F3: conditional gate refs (phase.is_critical_module / has_ui_changes / has_auth_or_secrets / has_design_changes / is_major_release / is_large_refactor)
//        — sister phaseFactContext convention (executor passes facts at runtime)
//   F4: agent-teams-upgrade parallelism ref `judgments.parallelism-gate.agent-teams-upgrade.fires` resolve from parallelism-gate.yaml
//   F5: R20.16 chain_isolation 实装 — phase 04/05/06/07/09 各自 `on: [..., {action: skip}]` else-branch present (not just invoke-only)

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { describe, expect, test } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { Capabilities } from '../../src/workflow/schema/capabilities.js'
import { WorkflowSchemaV2 } from '../../src/workflow/schema/workflow.js'

const ROOT = resolve(__dirname, '../..')
const WORKFLOW_PATH = resolve(ROOT, 'workflows/verify-work/workflow.yaml')
const CAPABILITIES_PATH = resolve(ROOT, 'workflows/capabilities.yaml')
const PARALLELISM_GATE_PATH = resolve(ROOT, 'workflows/judgments/parallelism-gate.yaml')

const rawYaml = readFileSync(WORKFLOW_PATH, 'utf8')
const parsed = parseYaml(rawYaml) as {
  schema_version: string
  workflow: string
  description?: string
  phases: Array<{
    id: string
    name?: string
    upstream?: string
    capability?: string
    model?: string
    invokes?: string
    gate?: string
    parallelism?: string
    on?: Array<{ if: string; invoke?: string; action?: 'invoke' | 'skip' }>
    max_iterations?: number | string
  }>
}

describe('verify-work workflow.yaml v2 — T2.4.W2.2 (D-12 + R20.12 + R20.11 + R20.14)', () => {
  test('F1: yaml parse + TypeBox Value.Check(WorkflowSchemaV2) passes + 9 phase + schema_version=workflow.v2', () => {
    expect(parsed.schema_version).toBe('harnessed.workflow.v2')
    expect(parsed.workflow).toBe('verify-work')
    expect(parsed.phases).toHaveLength(9)
    expect(parsed.phases.length).toBeGreaterThanOrEqual(7) // R20.12 acceptance "7+ phase"
    // schema validation — print errors path if Value.Check fails (sister plan-feature-v2 N1 pattern)
    if (!Value.Check(WorkflowSchemaV2, parsed)) {
      const errors = [...Value.Errors(WorkflowSchemaV2, parsed)]
      console.error('WorkflowSchemaV2 errors:', errors)
    }
    expect(Value.Check(WorkflowSchemaV2, parsed)).toBe(true)
  })

  test('F2: critical capability refs resolve from capabilities.yaml (gsd-verify-work / code-review / gstack-review / agent-teams-create)', () => {
    const capRaw = readFileSync(CAPABILITIES_PATH, 'utf8')
    const capParsed = parseYaml(capRaw) as {
      capabilities: Record<string, { impl: string; cmd: string }>
    }
    expect(Value.Check(Capabilities, capParsed)).toBe(true)

    // 4 critical capability entries the workflow refs
    const criticalCapNames = [
      'gsd-verify-work',
      'gsd-progress',
      'code-review',
      'gstack-review',
      'gstack-qa',
      'gstack-cso',
      'gstack-design-review',
      'code-simplifier',
      'agent-teams-create',
    ]
    for (const capName of criticalCapNames) {
      const entry = capParsed.capabilities[capName]
      if (!entry) throw new Error(`capability ${capName} missing from capabilities.yaml`)
      expect(entry.cmd).toBeTruthy()
    }

    // Verify workflow phases reference these via `{{ capabilities.<name>.cmd }}` template interpolation
    const phase01 = parsed.phases.find((p) => p.id === '01-gsd-verify-work')
    expect(phase01?.capability).toBe('{{ capabilities.gsd-verify-work.cmd }}')
    const phase03 = parsed.phases.find((p) => p.id === '03-code-review-parallel')
    expect(phase03?.capability).toBe('{{ capabilities.code-review.cmd }}')
    const phase04 = parsed.phases.find((p) => p.id === '04-gstack-review-conditional')
    expect(phase04?.capability).toBe('{{ capabilities.gstack-review.cmd }}')
    const phase09 = parsed.phases.find((p) => p.id === '09-agent-team-multispecialist')
    expect(phase09?.capability).toBe('{{ capabilities.agent-teams-create.cmd }}')
  })

  test('F4: agent-teams-upgrade parallelism ref `judgments.parallelism-gate.agent-teams-upgrade.fires` resolves from parallelism-gate.yaml', () => {
    const gateRaw = readFileSync(PARALLELISM_GATE_PATH, 'utf8')
    const gateParsed = parseYaml(gateRaw) as {
      triggers: Record<string, { fires_when?: string }>
    }
    // Verify the trigger entry exists with correct shape
    expect(gateParsed.triggers['agent-teams-upgrade']).toBeDefined()
    expect(gateParsed.triggers['agent-teams-upgrade']?.fires_when).toBeTruthy()
    expect(gateParsed.triggers['subagent-default']).toBeDefined()
    expect(gateParsed.triggers['subagent-default']?.fires_when).toBeTruthy()

    // Verify workflow phase 03 (parallel fan-out) + phase 09 (Agent Team upgrade) reference these
    const phase03 = parsed.phases.find((p) => p.id === '03-code-review-parallel')
    expect(phase03?.parallelism).toBe('judgments.parallelism-gate.subagent-default.fires')
    const phase09 = parsed.phases.find((p) => p.id === '09-agent-team-multispecialist')
    expect(phase09?.parallelism).toBe('judgments.parallelism-gate.agent-teams-upgrade.fires')
  })

  test('F3: conditional `on` clauses ref 6 phase fact context vars verbatim (is_critical_module / has_ui_changes / has_auth_or_secrets / has_design_changes / is_major_release / is_large_refactor)', () => {
    // Phase 04 — phase.is_critical_module
    const phase04 = parsed.phases.find((p) => p.id === '04-gstack-review-conditional')
    expect(phase04?.on?.[0]?.if).toMatch(/phase\.is_critical_module\s*==\s*true/)
    expect(phase04?.on?.[0]?.action).toBe('invoke')

    // Phase 05 — phase.has_ui_changes
    const phase05 = parsed.phases.find((p) => p.id === '05-qa-conditional')
    expect(phase05?.on?.[0]?.if).toMatch(/phase\.has_ui_changes\s*==\s*true/)
    expect(phase05?.on?.[0]?.action).toBe('invoke')

    // Phase 06 — phase.has_auth_or_secrets
    const phase06 = parsed.phases.find((p) => p.id === '06-cso-conditional')
    expect(phase06?.on?.[0]?.if).toMatch(/phase\.has_auth_or_secrets\s*==\s*true/)
    expect(phase06?.on?.[0]?.action).toBe('invoke')

    // Phase 07 — phase.has_design_changes
    const phase07 = parsed.phases.find((p) => p.id === '07-design-review-conditional')
    expect(phase07?.on?.[0]?.if).toMatch(/phase\.has_design_changes\s*==\s*true/)
    expect(phase07?.on?.[0]?.action).toBe('invoke')

    // Phase 09 — phase.is_major_release OR phase.is_large_refactor (Pattern C trigger)
    const phase09 = parsed.phases.find((p) => p.id === '09-agent-team-multispecialist')
    expect(phase09?.on?.[0]?.if).toMatch(/phase\.is_major_release/)
    expect(phase09?.on?.[0]?.if).toMatch(/phase\.is_large_refactor/)
    expect(phase09?.on?.[0]?.if).toMatch(/OR/)
    expect(phase09?.on?.[0]?.action).toBe('invoke')
  })

  test('F5: R20.16 chain_isolation 实装 — phase 04/05/06/07/09 各自 on:[..., {action: skip}] else-branch present', () => {
    // Each conditional phase MUST have exactly 2 on-clauses: invoke-branch + skip-branch
    // (skip-branch = R20.16 fallback 3 铁律 chain_isolation — 不级联跳过 sibling conditional phase)
    const conditionalPhaseIds = [
      '04-gstack-review-conditional',
      '05-qa-conditional',
      '06-cso-conditional',
      '07-design-review-conditional',
      '09-agent-team-multispecialist',
    ]
    for (const id of conditionalPhaseIds) {
      const phase = parsed.phases.find((p) => p.id === id)
      if (!phase) throw new Error(`conditional phase ${id} missing`)
      if (!phase.on || phase.on.length < 2) {
        throw new Error(
          `phase ${id} must declare both invoke + skip on-clauses (R20.16 chain_isolation), got ${phase.on?.length ?? 0}`,
        )
      }
      // Find skip-branch
      const skipBranch = phase.on.find((c) => c.action === 'skip')
      if (!skipBranch) {
        throw new Error(`phase ${id} missing skip-branch on-clause (R20.16 chain_isolation)`)
      }
      expect(skipBranch.action).toBe('skip')
    }
  })
})
