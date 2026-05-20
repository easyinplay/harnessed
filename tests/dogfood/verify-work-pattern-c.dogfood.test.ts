// Phase v2.0-2.5 W2 Cycle 2 — verify-work workflow + Pattern C 4-specialist dogfood
//
// Verifies R20.12 (verify-work 9-phase composition + 4-stage full coverage) +
// Pattern C upgrade routing (sister ~/.claude/rules/agent-teams.md L61-64 Pattern C
// 多维度审查 ≥3 specialist + lead 委派)。
//
// NOT a unit test (mock-based) — this is dogfood:
//   - real fs.readFile workflows/verify-work/workflow.yaml (no mock)
//   - real parseYaml + real Value.Check(WorkflowSchemaV2)
//   - real resolveJudgmentGate path (T2.3.W0.4 SHIPPED) + real evalGate
//     (T2.3.W0.3 SHIPPED) for parallelism + on[].if branch evaluation
//   - sister Phase 2.5 W1 (parallelism-gate.dogfood.test.ts) format 沿袭
//
// 6 fixture covering:
//   F1 — 9 phase 实装 + 必跑串行 (01-02) unconditional shape
//   F2 — Scenario B 并行 fan-out (03 parallelism: subagent-default.fires)
//   F3 — Scenario C 关键模块强制 (04 双 branch is_critical_module true/false)
//   F4 — Scenario D 可选 conditional (05/06/07 × 2 branch = 6 sub-scenario)
//   F5 — Scenario F Pattern C 4-specialist 升级 (09 三 branch routing)
//   F6 — workflow.yaml TypeBox WorkflowSchemaV2 Value.Check pass
//
// Note on live Pattern C TeamCreate→SendMessage→TeamDelete round-trip:
// Per orchestrator brief (DO NOT spawn sub-subagents), live lifecycle deferred to
// v2.0 GA first user usage; this dogfood verifies yaml gate path + conditional
// branch logic 完整性 — gate 实装错则 lifecycle 必失败, prerequisite-first surgical
// verification per Karpathy simplicity。
//
// Cross-OS perf bar: 6/6 < 250ms (Windows fs cold readFile + parse).

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { evalGate } from '../../src/workflow/exprBuilder.js'
import { _clearJudgmentCache, resolveJudgmentGate } from '../../src/workflow/judgmentResolver.js'
import { WorkflowSchemaV2, type WorkflowSchemaV2T } from '../../src/workflow/schema/workflow.js'

const PACKAGE_ROOT = process.cwd()
const WORKFLOW_YAML_PATH = resolve(PACKAGE_ROOT, 'workflows', 'verify-work', 'workflow.yaml')

beforeEach(() => {
  _clearJudgmentCache()
})

afterEach(() => {
  _clearJudgmentCache()
})

async function loadWorkflow(): Promise<WorkflowSchemaV2T> {
  const raw = await readFile(WORKFLOW_YAML_PATH, 'utf8')
  const parsed = parseYaml(raw) as WorkflowSchemaV2T
  return parsed
}

describe('Phase v2.0-2.5 W2 Cycle 2 — verify-work + Pattern C 4-specialist dogfood', () => {
  // ==========================================================================
  // F1 — 9 phase composition + Scenario A/E unconditional shape (必跑串行 01/02
  // + 末尾串行 08 无 on[] / gate / parallelism)
  // ==========================================================================
  it('F1. workflow.yaml — 9 phase + 必跑串行 (01/02) + 末尾串行 (08) unconditional', async () => {
    const wf = await loadWorkflow()
    expect(wf.workflow).toBe('verify-work')
    expect(wf.schema_version).toBe('harnessed.workflow.v2')
    expect(wf.phases).toHaveLength(9)

    const ids = wf.phases.map((p) => p.id)
    expect(ids).toEqual([
      '01-gsd-verify-work',
      '02-gsd-progress',
      '03-code-review-parallel',
      '04-gstack-review-conditional',
      '05-qa-conditional',
      '06-cso-conditional',
      '07-design-review-conditional',
      '08-code-simplifier',
      '09-agent-team-multispecialist',
    ])

    // 必跑串行 01 + 02 + 末尾串行 08 — unconditional (no on[] / no gate)
    for (const id of ['01-gsd-verify-work', '02-gsd-progress', '08-code-simplifier']) {
      const phase = wf.phases.find((p) => p.id === id)
      expect(phase, `phase ${id} present`).toBeDefined()
      expect(phase?.on, `${id} has no on[]`).toBeUndefined()
      expect(phase?.gate, `${id} has no gate`).toBeUndefined()
    }
  })

  // ==========================================================================
  // F2 — Scenario B 并行 fan-out (03-code-review-parallel)
  // parallelism: judgments.parallelism-gate.subagent-default.fires
  // ==========================================================================
  it('F2. Scenario B — 03 parallelism subagent-default.fires === true (parallel_count=3)', async () => {
    const wf = await loadWorkflow()
    const phase = wf.phases.find((p) => p.id === '03-code-review-parallel')
    expect(phase?.parallelism).toBe('judgments.parallelism-gate.subagent-default.fires')

    // Resolve at runtime — real fs + real resolveJudgmentGate
    const fires = await resolveJudgmentGate(
      'judgments.parallelism-gate.subagent-default.fires',
      {
        subtask: {
          parallel_count: 3,
          communication_needed: false,
        },
      },
      PACKAGE_ROOT,
    )
    expect(fires).toBe(true)
  })

  // ==========================================================================
  // F3 — Scenario C 关键模块强制 conditional (04-gstack-review-conditional)
  // on[0]: phase.is_critical_module == true → invoke
  // on[1]: phase.is_critical_module == false → skip
  // ==========================================================================
  it('F3. Scenario C — 04 gstack-review 关键模块强制 双 branch (invoke + skip)', async () => {
    const wf = await loadWorkflow()
    const phase = wf.phases.find((p) => p.id === '04-gstack-review-conditional')
    expect(phase?.on).toHaveLength(2)
    expect(phase?.on?.[0]?.if).toBe('phase.is_critical_module == true')
    expect(phase?.on?.[0]?.action).toBe('invoke')
    expect(phase?.on?.[1]?.if).toBe('phase.is_critical_module == false')
    expect(phase?.on?.[1]?.action).toBe('skip')

    // Branch 1 — invoke
    expect(
      evalGate('phase.is_critical_module == true', {
        phase: { is_critical_module: true },
      }),
    ).toBe(true)
    expect(
      evalGate('phase.is_critical_module == false', {
        phase: { is_critical_module: true },
      }),
    ).toBe(false)

    // Branch 2 — skip
    expect(
      evalGate('phase.is_critical_module == true', {
        phase: { is_critical_module: false },
      }),
    ).toBe(false)
    expect(
      evalGate('phase.is_critical_module == false', {
        phase: { is_critical_module: false },
      }),
    ).toBe(true)
  })

  // ==========================================================================
  // F4 — Scenario D 可选 conditional (05/06/07) × 2 branch = 6 sub-scenario
  // 05-qa-conditional: phase.has_ui_changes
  // 06-cso-conditional: phase.has_auth_or_secrets
  // 07-design-review-conditional: phase.has_design_changes
  // ==========================================================================
  it('F4. Scenario D — 05/06/07 可选 conditional 3 phase × 2 branch (6 sub-scenario)', async () => {
    const wf = await loadWorkflow()

    type OptionalPhaseSpec = {
      id: string
      factKey: 'has_ui_changes' | 'has_auth_or_secrets' | 'has_design_changes'
    }
    const optionalPhases: OptionalPhaseSpec[] = [
      { id: '05-qa-conditional', factKey: 'has_ui_changes' },
      { id: '06-cso-conditional', factKey: 'has_auth_or_secrets' },
      { id: '07-design-review-conditional', factKey: 'has_design_changes' },
    ]

    for (const { id, factKey } of optionalPhases) {
      const phase = wf.phases.find((p) => p.id === id)
      expect(phase, `${id} present`).toBeDefined()
      expect(phase?.on, `${id} has on[]`).toHaveLength(2)

      const invokeExpr = `phase.${factKey} == true`
      const skipExpr = `phase.${factKey} == false`

      expect(phase?.on?.[0]?.if).toBe(invokeExpr)
      expect(phase?.on?.[0]?.action).toBe('invoke')
      expect(phase?.on?.[1]?.if).toBe(skipExpr)
      expect(phase?.on?.[1]?.action).toBe('skip')

      // Sub-scenario A — fact=true → invoke branch fires
      expect(
        evalGate(invokeExpr, { phase: { [factKey]: true } }),
        `${id} invoke branch (true)`,
      ).toBe(true)

      // Sub-scenario B — fact=false → skip branch fires
      expect(evalGate(skipExpr, { phase: { [factKey]: false } }), `${id} skip branch (false)`).toBe(
        true,
      )
    }
  })

  // ==========================================================================
  // F5 — Scenario F Pattern C 4-specialist 升级 (09-agent-team-multispecialist)
  // on[0]: phase.is_major_release == true OR phase.is_large_refactor == true → invoke
  // on[1]: phase.is_major_release == false AND phase.is_large_refactor == false → skip
  // parallelism: judgments.parallelism-gate.agent-teams-upgrade.fires
  // ==========================================================================
  it('F5. Scenario F — 09 Pattern C 4-specialist 升级 3 branch (major / refactor / neither)', async () => {
    const wf = await loadWorkflow()
    const phase = wf.phases.find((p) => p.id === '09-agent-team-multispecialist')
    expect(phase?.parallelism).toBe('judgments.parallelism-gate.agent-teams-upgrade.fires')
    expect(phase?.on).toHaveLength(2)

    const invokeExpr = phase?.on?.[0]?.if as string
    const skipExpr = phase?.on?.[1]?.if as string
    expect(invokeExpr).toBe('phase.is_major_release == true or phase.is_large_refactor == true')
    expect(skipExpr).toBe('phase.is_major_release == false and phase.is_large_refactor == false')
    expect(phase?.on?.[0]?.action).toBe('invoke')
    expect(phase?.on?.[1]?.action).toBe('skip')

    // Branch 1 — is_major_release=true → invoke
    expect(
      evalGate(invokeExpr, {
        phase: { is_major_release: true, is_large_refactor: false },
      }),
    ).toBe(true)

    // Branch 2 — is_large_refactor=true → invoke (OR-chain)
    expect(
      evalGate(invokeExpr, {
        phase: { is_major_release: false, is_large_refactor: true },
      }),
    ).toBe(true)

    // Branch 3 — both false → skip
    expect(
      evalGate(invokeExpr, {
        phase: { is_major_release: false, is_large_refactor: false },
      }),
    ).toBe(false)
    expect(
      evalGate(skipExpr, {
        phase: { is_major_release: false, is_large_refactor: false },
      }),
    ).toBe(true)

    // parallelism gate resolve — agent-teams-upgrade fires when teammate_send_message_needed=true
    // (sister Phase 2.5 W1 F3.T1 verified all 5 trigger; F5 spot-check 1 trigger)
    const teamsFires = await resolveJudgmentGate(
      'judgments.parallelism-gate.agent-teams-upgrade.fires',
      {
        teammate_send_message_needed: true,
        subagent_context_overflow: false,
        shared_task_list: false,
        opposing_hypothesis_debate: false,
        fullstack_three_way: false,
      },
      PACKAGE_ROOT,
    )
    expect(teamsFires).toBe(true)
  })

  // ==========================================================================
  // F6 — workflow.yaml TypeBox WorkflowSchemaV2 Value.Check pass
  // (verifies T2.4.W2.2 SHIPPED yaml + T2.4.W0.1 SHIPPED schema 仍 contract-stable;
  // sister R20.4 schema invariant guarantee)
  // ==========================================================================
  it('F6. workflow.yaml — TypeBox WorkflowSchemaV2 Value.Check pass + 9 phase verified', async () => {
    const raw = await readFile(WORKFLOW_YAML_PATH, 'utf8')
    const parsed = parseYaml(raw) as unknown

    // TypeBox strict schema check — additionalProperties:false should reject
    // any drifted shape (R20.4 schema contract guarantee)
    expect(Value.Check(WorkflowSchemaV2, parsed)).toBe(true)

    const wf = parsed as WorkflowSchemaV2T
    expect(wf.schema_version).toBe('harnessed.workflow.v2')
    expect(wf.workflow).toBe('verify-work')
    expect(wf.phases).toHaveLength(9)
  })
})
