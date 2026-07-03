// tests/dogfood/cycle-3-task.dogfood.test.ts — Phase v3.0-3.5 W2 T3.5.W2.1 Cycle 3
// /task master orchestrator 端到端 dogfood (sister Phase 2.5 reduced to 4)。验证
// task/auto/workflow.yaml serial 4 sub (clarify order 1 → code order 2 → test order 3
// → deliver order 4) + K9 serial order invariant + subtask-gate.brainstorming conditional
// (clarify) + tdd-gate.tdd-strongly-suggested conditional (test) + ralph-loop NOT master scope
// (D-10 orthogonal wrapper inside deliver sub workflow)。
//
// Sister refs:
//   - workflows/task/auto/workflow.yaml (T3.5.W1.3 SHIPPED)
//   - workflows/judgments/subtask-gate.yaml brainstorming trigger
//   - workflows/judgments/tdd-gate.yaml tdd-strongly-suggested trigger
//   - src/workflow/masterOrchestrator.ts (T3.5.W0.1 SHIPPED)

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { runMasterOrchestrator } from '../../src/workflow/masterOrchestrator.js'
import { WorkflowSchemaV3, type WorkflowSchemaV3T } from '../../src/workflow/schema/workflow.js'

const PACKAGE_ROOT = resolve(__dirname, '../..')
const TASK_YAML = resolve(PACKAGE_ROOT, 'workflows/task/auto/workflow.yaml')

describe('Cycle 3 — /task master orchestrator dogfood', () => {
  it('F1: task/auto/workflow.yaml Value.Check WorkflowSchemaV3 pass + workflow=task + delegates_to=4', () => {
    const raw = readFileSync(TASK_YAML, 'utf8')
    const parsed = parseYaml(raw) as unknown
    expect(Value.Check(WorkflowSchemaV3, parsed)).toBe(true)
    const m = parsed as WorkflowSchemaV3T
    expect(m.workflow).toBe('task')
    expect(m.delegates_to).toHaveLength(4)
    expect(m.phases).toBeUndefined()
  })

  it('F2: 4 sub mode=serial + order=1,2,3,4 (K9 serial order invariant)', () => {
    const raw = readFileSync(TASK_YAML, 'utf8')
    const m = parseYaml(raw) as WorkflowSchemaV3T
    const dels = m.delegates_to ?? []
    for (const d of dels) {
      expect(d.mode).toBe('serial')
      expect(d.order).toBeDefined()
    }
    const ordered = [...dels].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    expect(ordered.map((d) => d.sub)).toEqual(['clarify', 'code', 'test', 'deliver'])
    expect(ordered.map((d) => d.order)).toEqual([1, 2, 3, 4])
  })

  it('F3: clarify gate=subtask-gate.brainstorming + test gate=tdd-gate + code/deliver NO gate', () => {
    const raw = readFileSync(TASK_YAML, 'utf8')
    const m = parseYaml(raw) as WorkflowSchemaV3T
    const dels = m.delegates_to ?? []
    const clarify = dels.find((d) => d.sub === 'clarify')
    const code = dels.find((d) => d.sub === 'code')
    const test = dels.find((d) => d.sub === 'test')
    const deliver = dels.find((d) => d.sub === 'deliver')
    expect(clarify?.gate).toBe('judgments.subtask-gate.brainstorming.fires')
    expect(code?.gate).toBeUndefined()
    expect(test?.gate).toBe('judgments.tdd-gate.tdd-strongly-suggested.fires')
    expect(deliver?.gate).toBeUndefined()
  })

  it('F4: high-stakes ctx (multi-approach + core algorithm) → 全 4 sub fire in order 1-2-3-4', async () => {
    // Context — subtask 有 ≥2 approaches + core_algorithm true → clarify fires;
    // core_business_logic / is_algorithm / reliability_required → tdd fires。
    const ctx = {
      subtask: {
        approaches: 2,
        core_algorithm: true,
        has_api_contract: true,
        error_cost: 'high',
        is_core_business_logic: true,
        is_algorithm: true,
        is_data_processing: false,
        regression_risk: 'high',
        reliability_required: true,
        type: 'feature_implementation',
        lines: 100,
      },
    }
    const order: string[] = []
    const trackingSpawn = async (_master: string, sub: string) => {
      order.push(sub)
    }
    const r = await runMasterOrchestrator('task', ctx, PACKAGE_ROOT, trackingSpawn)
    expect(r.fired).toEqual(['clarify', 'code', 'test', 'deliver'])
    expect(r.skipped).toEqual([])
    expect(order).toEqual(['clarify', 'code', 'test', 'deliver'])
  })

  it('F5: CRUD low-stakes ctx → fired=[code, deliver] + clarify+test skipped', async () => {
    // CRUD 单一实现 → clarify skip (subtask-gate skips_when type='crud');
    // CRUD 非 core_business / 非 algorithm / 非 high regression → tdd skip。
    const ctx = {
      subtask: {
        approaches: 1,
        core_algorithm: false,
        has_api_contract: false,
        error_cost: 'low',
        is_core_business_logic: false,
        is_algorithm: false,
        is_data_processing: false,
        regression_risk: 'low',
        reliability_required: false,
        type: 'crud',
        lines: 15,
      },
    }
    const noopSpawn = async () => undefined
    const r = await runMasterOrchestrator('task', ctx, PACKAGE_ROOT, noopSpawn)
    expect(r.fired).toEqual(['code', 'deliver'])
    expect(r.skipped.sort()).toEqual(['clarify', 'test'])
  })

  it('F6: serial 4-step order respect — clarify end < code start < test start < deliver start', async () => {
    const ctx = {
      subtask: {
        approaches: 2,
        core_algorithm: true,
        has_api_contract: true,
        error_cost: 'high',
        is_core_business_logic: true,
        is_algorithm: true,
        is_data_processing: false,
        regression_risk: 'high',
        reliability_required: true,
        type: 'feature_implementation',
        lines: 100,
      },
    }
    const events: Array<{ phase: 'start' | 'end'; sub: string; ts: number }> = []
    const sequentialSpawn = async (_master: string, sub: string) => {
      events.push({ phase: 'start', sub, ts: Date.now() })
      await new Promise((res) => setTimeout(res, 5))
      events.push({ phase: 'end', sub, ts: Date.now() })
    }
    await runMasterOrchestrator('task', ctx, PACKAGE_ROOT, sequentialSpawn)
    const findEnd = (sub: string) => events.find((e) => e.phase === 'end' && e.sub === sub)
    const findStart = (sub: string) => events.find((e) => e.phase === 'start' && e.sub === sub)
    const seq = ['clarify', 'code', 'test', 'deliver']
    for (let i = 0; i < seq.length - 1; i++) {
      const cur = seq[i]
      const nxt = seq[i + 1]
      if (!cur || !nxt) continue
      const e = findEnd(cur)
      const s = findStart(nxt)
      expect(e).toBeDefined()
      expect(s).toBeDefined()
      if (e && s) {
        expect(s.ts).toBeGreaterThanOrEqual(e.ts)
      }
    }
  })

  it('F7: Transparency block 4-step sequence — Firing 4 sub in serial + serial order=1..4', async () => {
    const logs: string[] = []
    const origLog = console.log
    console.log = (...args: unknown[]) => {
      logs.push(args.map(String).join(' '))
    }
    try {
      const ctx = {
        subtask: {
          approaches: 2,
          core_algorithm: true,
          has_api_contract: true,
          error_cost: 'high',
          is_core_business_logic: true,
          is_algorithm: true,
          regression_risk: 'high',
          reliability_required: true,
          type: 'feature',
        },
      }
      const noopSpawn = async () => undefined
      await runMasterOrchestrator('task', ctx, PACKAGE_ROOT, noopSpawn)
    } finally {
      console.log = origLog
    }
    const joined = logs.join('\n')
    expect(joined).toMatch(/\[task master\] Evaluating 4 sub-workflow gates/)
    expect(joined).toMatch(/Firing 4 sub in serial/)
    expect(joined).toMatch(/→ clarify \(serial order=1\)/)
    expect(joined).toMatch(/→ code \(serial order=2\)/)
    expect(joined).toMatch(/→ test \(serial order=3\)/)
    expect(joined).toMatch(/→ deliver \(serial order=4\)/)
    expect(joined).toMatch(/\[task master\] Complete: 4 fired, 0 skipped/)
  })

  it('F8: ralph-loop NOT in master scope (D-10 orthogonal wrapper) — tools_available list ralph-loop but master 不 invoke', () => {
    // ralph-loop 在 deliver sub workflow 内 (D-10 orthogonal wrapper) NOT master concern。
    // tools_available declare ralph-loop but master yaml 不 invoke (delegates_to 不含 ralph-loop)。
    const raw = readFileSync(TASK_YAML, 'utf8')
    const m = parseYaml(raw) as WorkflowSchemaV3T
    expect(m.tools_available).toContain('ralph-loop')
    // master delegates_to 仅 4 sub workflow,NOT ralph-loop 直接 invoke
    const subs = (m.delegates_to ?? []).map((d) => d.sub)
    expect(subs).not.toContain('ralph-loop')
  })

  it('F9: tdd-gate fires_when verify — is_data_processing trigger TDD fire alone (5 OR-chain branch)', async () => {
    // tdd-gate OR-chain 任一为 true → fires;此 fixture 验 is_data_processing 单独 trigger。
    const ctx = {
      subtask: {
        approaches: 1, // clarify NOT fire (subtask 单一)
        core_algorithm: false,
        has_api_contract: false,
        error_cost: 'low',
        is_core_business_logic: false,
        is_algorithm: false,
        is_data_processing: true, // 单独 trigger tdd fire
        regression_risk: 'low',
        reliability_required: false,
        type: 'feature',
        lines: 50,
      },
    }
    const noopSpawn = async () => undefined
    const r = await runMasterOrchestrator('task', ctx, PACKAGE_ROOT, noopSpawn)
    expect(r.fired).toEqual(['code', 'test', 'deliver'])
    expect(r.skipped).toEqual(['clarify'])
  })

  it('F10: tools_available 含 planning-with-files (progress.md sink) + 3 mattpocock 招式', () => {
    const raw = readFileSync(TASK_YAML, 'utf8')
    const m = parseYaml(raw) as WorkflowSchemaV3T
    expect(m.tools_available).toContain('planning-with-files')
    // mattpocock conditional route — grill-with-docs / improve-codebase-architecture / diagnose
    // (v4.16.3: zoom-out removed — upstream deleted the skill)
    expect(m.tools_available).toContain('grill-with-docs')
    expect(m.tools_available).not.toContain('zoom-out')
    expect(m.tools_available).toContain('improve-codebase-architecture')
    expect(m.tools_available).toContain('diagnose')
  })
})
