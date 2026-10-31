// tests/dogfood/cycle-2-plan.dogfood.test.ts — Phase v3.0-3.5 W2 T3.5.W2.1 Cycle 2
// /plan master orchestrator 端到端 dogfood (sister Phase 2.5 reduced to 4)。验证
// plan/auto/workflow.yaml serial 2 sub (architecture conditional order 1 → phase always
// order 2) + K9 serial order invariant + order respect (sequential await per masterOrchestrator
// L169-173) + planning-with-files /plan sub 内 invoke (D-06 cross-cutting tool)。
//
// Sister refs:
//   - workflows/plan/auto/workflow.yaml (T3.5.W1.2 SHIPPED)
//   - workflows/judgments/stage-routing.yaml plan-architecture-delegate (Phase 3.3 W0.3)
//   - src/workflow/masterOrchestrator.ts (T3.5.W0.1 SHIPPED)

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { runMasterOrchestrator } from '../../src/workflow/masterOrchestrator.js'
import { WorkflowSchemaV3, type WorkflowSchemaV3T } from '../../src/workflow/schema/workflow.js'

const PACKAGE_ROOT = resolve(__dirname, '../..')
const PLAN_YAML = resolve(PACKAGE_ROOT, 'workflows/plan/auto/workflow.yaml')

describe('Cycle 2 — /plan master orchestrator dogfood', () => {
  it('F1: plan/auto/workflow.yaml validates with six serial delegates', () => {
    const raw = readFileSync(PLAN_YAML, 'utf8')
    const parsed = parseYaml(raw) as unknown
    expect(Value.Check(WorkflowSchemaV3, parsed)).toBe(true)
    const m = parsed as WorkflowSchemaV3T
    expect(m.workflow).toBe('plan')
    expect(m.delegates_to).toHaveLength(6)
    expect(m.phases).toBeUndefined()
  })

  it('F2: all six subs are serial with explicit order', () => {
    const raw = readFileSync(PLAN_YAML, 'utf8')
    const m = parseYaml(raw) as WorkflowSchemaV3T
    const dels = m.delegates_to ?? []
    for (const d of dels) {
      expect(d.mode).toBe('serial')
      // serial mode 必带 explicit order per K9 invariant
      expect(d.order).toBeDefined()
      expect(typeof d.order).toBe('number')
    }
    expect(dels.map((d) => [d.sub, d.order])).toEqual([
      ['architecture', 1],
      ['spec', 2],
      ['ui', 3],
      ['secure', 4],
      ['ai-integration', 5],
      ['phase', 6],
    ])
  })

  it('F3: five conditional gates precede unconditional phase planning', () => {
    const raw = readFileSync(PLAN_YAML, 'utf8')
    const m = parseYaml(raw) as WorkflowSchemaV3T
    const archDel = (m.delegates_to ?? []).find((d) => d.sub === 'architecture')
    const phaseDel = (m.delegates_to ?? []).find((d) => d.sub === 'phase')
    expect(archDel?.gate).toBe('judgments.stage-routing.plan-architecture-delegate.fires')
    expect((m.delegates_to ?? []).find((d) => d.sub === 'spec')?.gate).toBe(
      'judgments.stage-phase-gate.gsd-spec-phase.fires',
    )
    expect((m.delegates_to ?? []).find((d) => d.sub === 'ui')?.gate).toBe(
      'judgments.stage-phase-gate.gsd-ui-phase.fires',
    )
    expect((m.delegates_to ?? []).find((d) => d.sub === 'secure')?.gate).toBe(
      'judgments.stage-phase-gate.gsd-secure-phase.fires',
    )
    expect((m.delegates_to ?? []).find((d) => d.sub === 'ai-integration')?.gate).toBe(
      'judgments.stage-phase-gate.gsd-ai-integration-phase.fires',
    )
    // phase 总是 fire — gate undefined per masterOrchestrator unconditional fire
    expect(phaseDel?.gate).toBeUndefined()
  })

  it('F4: all gates true fires the six-step order', async () => {
    const ctx = {
      phase: {
        is_complex_architecture: true,
        requires_spec: true,
        has_ui_changes: true,
        has_auth_or_secrets: true,
        builds_ai_system: true,
        stage: 'plan',
      },
    }
    const order: string[] = []
    const trackingSpawn = async (_master: string, sub: string) => {
      order.push(sub)
    }
    const r = await runMasterOrchestrator('plan', ctx, PACKAGE_ROOT, trackingSpawn)
    expect(r.fired).toEqual(['architecture', 'spec', 'ui', 'secure', 'ai-integration', 'phase'])
    expect(r.skipped).toEqual([])
    // Serial mode spawn 严格按 order (architecture order 1 first, phase order 2 后)
    expect(order).toEqual(['architecture', 'spec', 'ui', 'secure', 'ai-integration', 'phase'])
  })

  it('F5: simple plan context → fired=[phase] + architecture skipped (conditional 不 fire)', async () => {
    const ctx = {
      phase: {
        is_complex_architecture: false,
        requires_spec: false,
        has_ui_changes: false,
        has_auth_or_secrets: false,
        builds_ai_system: false,
        stage: 'plan',
      },
    }
    const noopSpawn = async () => undefined
    const r = await runMasterOrchestrator('plan', ctx, PACKAGE_ROOT, noopSpawn)
    expect(r.fired).toEqual(['phase'])
    expect(r.skipped).toEqual(['architecture', 'spec', 'ui', 'secure', 'ai-integration'])
  })

  it('F6: serial order respect — spawnDriver called sequentially (Promise.all NOT used)', async () => {
    // Sequential await proof — architecture spawn 完成后 phase spawn 才开始
    const events: Array<{ phase: 'start' | 'end'; sub: string; ts: number }> = []
    const ctx = {
      phase: {
        is_complex_architecture: true,
        requires_spec: true,
        has_ui_changes: true,
        has_auth_or_secrets: true,
        builds_ai_system: true,
        stage: 'plan',
      },
    }
    const sequentialSpawn = async (_master: string, sub: string) => {
      events.push({ phase: 'start', sub, ts: Date.now() })
      // 微小延迟 模拟 sub spawn 异步耗时
      await new Promise((res) => setTimeout(res, 10))
      events.push({ phase: 'end', sub, ts: Date.now() })
    }
    await runMasterOrchestrator('plan', ctx, PACKAGE_ROOT, sequentialSpawn)
    // KEY assertion — architecture end MUST happen before phase start (sequential proof)
    const archEnd = events.find((e) => e.phase === 'end' && e.sub === 'architecture')
    const phaseStart = events.find((e) => e.phase === 'start' && e.sub === 'phase')
    expect(archEnd).toBeDefined()
    expect(phaseStart).toBeDefined()
    if (archEnd && phaseStart) {
      expect(phaseStart.ts).toBeGreaterThanOrEqual(archEnd.ts)
    }
  })

  it('F7: Transparency block "Firing N sub in serial" + spawn marker per fired clause', async () => {
    const logs: string[] = []
    const origLog = console.log
    console.log = (...args: unknown[]) => {
      logs.push(args.map(String).join(' '))
    }
    try {
      const ctx = {
        phase: {
          is_complex_architecture: true,
          requires_spec: true,
          has_ui_changes: true,
          has_auth_or_secrets: true,
          builds_ai_system: true,
          stage: 'plan',
        },
      }
      const noopSpawn = async () => undefined
      await runMasterOrchestrator('plan', ctx, PACKAGE_ROOT, noopSpawn)
    } finally {
      console.log = origLog
    }
    const joined = logs.join('\n')
    expect(joined).toMatch(/\[plan master\] Evaluating 6 sub-workflow gates/)
    expect(joined).toMatch(/Firing 6 sub in serial/)
    expect(joined).toMatch(/→ architecture \(serial order=1\)/)
    expect(joined).toMatch(/→ phase \(serial order=6\)/)
    expect(joined).toMatch(/\[plan master\] Complete: 6 fired, 0 skipped/)
  })

  it('F8: K8 single-context snapshot — same ctx reference passed 到 2 spawn (无 re-snapshot)', async () => {
    const ctx = {
      phase: {
        is_complex_architecture: true,
        requires_spec: true,
        has_ui_changes: true,
        has_auth_or_secrets: true,
        builds_ai_system: true,
        stage: 'plan',
      },
    }
    const receivedCtx: Record<string, unknown>[] = []
    const captureSpawn = async (
      _master: string,
      _sub: string,
      passedCtx: Record<string, unknown>,
    ) => {
      receivedCtx.push(passedCtx)
    }
    await runMasterOrchestrator('plan', ctx, PACKAGE_ROOT, captureSpawn)
    expect(receivedCtx).toHaveLength(6)
    for (const c of receivedCtx) {
      expect(c).toBe(ctx)
    }
  })

  it('F9: disciplines_applied 6 default 全 declared (D-09 L0 substrate)', () => {
    const raw = readFileSync(PLAN_YAML, 'utf8')
    const m = parseYaml(raw) as WorkflowSchemaV3T
    expect(m.disciplines_applied?.sort()).toEqual([
      'karpathy',
      'language',
      'operational',
      'output-style',
      'priority',
      'protocols',
    ])
  })

  it('F10: tools_available declares planning-with-files (D-06 cross-cutting /plan sink)', () => {
    const raw = readFileSync(PLAN_YAML, 'utf8')
    const m = parseYaml(raw) as WorkflowSchemaV3T
    // planning-with-files 是 D-06 cross-cutting tool 沉淀 task_plan.md + progress.md
    expect(m.tools_available).toContain('planning-with-files')
    expect(m.tools_available).toContain('plan-eng-review')
    expect(m.tools_available).toContain('gsd-spec-phase')
    expect(m.tools_available).toContain('gsd-ui-phase')
    expect(m.tools_available).toContain('gsd-secure-phase')
    expect(m.tools_available).toContain('gsd-ai-integration-phase')
    expect(m.tools_available).toContain('gsd-plan-phase')
  })
})
