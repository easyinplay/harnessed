// tests/dogfood/cycle-1-discuss.dogfood.test.ts — Phase v3.0-3.5 W2 T3.5.W2.1 Cycle 1
// /discuss master orchestrator 端到端 dogfood (sister Phase 2.5 5-cycle methodology
// reduced to 4)。验证 discuss/auto/workflow.yaml gate-route 3 sub (strategic+phase+subtask
// 独立判 → 透明声明) + parallel mode + chain-isolation 铁律 (3 sub 独立 eval, 不串行)。
//
// Sister refs:
//   - .planning/phase-v2.0-2.2/DOGFOOD-T5.5-AGGREGATE.md (5-axis pattern reference)
//   - workflows/discuss/auto/workflow.yaml (T3.5.W1.1 SHIPPED)
//   - workflows/judgments/stage-routing.yaml (Phase 3.3 W0.3 SHIPPED)
//   - src/workflow/masterOrchestrator.ts (T3.5.W0.1 SHIPPED)
//   - .planning/phase-v3.0-3.2/RESEARCH-workflows.md § Area 3 Transparency block verbatim

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { runMasterOrchestrator } from '../../src/workflow/masterOrchestrator.js'
import { WorkflowSchemaV3, type WorkflowSchemaV3T } from '../../src/workflow/schema/workflow.js'

const PACKAGE_ROOT = resolve(__dirname, '../..')
const DISCUSS_YAML = resolve(PACKAGE_ROOT, 'workflows/discuss/auto/workflow.yaml')

describe('Cycle 1 — /discuss master orchestrator dogfood', () => {
  it('F1: discuss/auto/workflow.yaml Value.Check WorkflowSchemaV3 pass + workflow=discuss + delegates_to=3', () => {
    const raw = readFileSync(DISCUSS_YAML, 'utf8')
    const parsed = parseYaml(raw) as unknown
    expect(Value.Check(WorkflowSchemaV3, parsed)).toBe(true)
    const m = parsed as WorkflowSchemaV3T
    expect(m.schema_version).toBe('harnessed.workflow.v3')
    expect(m.workflow).toBe('discuss')
    expect(m.delegates_to).toBeDefined()
    expect(m.delegates_to).toHaveLength(3)
    expect(m.phases).toBeUndefined()
  })

  it('F2: 3 sub 全 mode=parallel + 无 serial order field (3 independent gate eval)', () => {
    const raw = readFileSync(DISCUSS_YAML, 'utf8')
    const m = parseYaml(raw) as WorkflowSchemaV3T
    const dels = m.delegates_to ?? []
    for (const d of dels) {
      expect(d.mode).toBe('parallel')
      // parallel mode 无 order field 需求 per K9
      expect(d.order).toBeUndefined()
    }
    const subs = dels.map((d) => d.sub).sort()
    expect(subs).toEqual(['phase', 'strategic', 'subtask'])
  })

  // phase / subtask gate on the CANONICAL tier trigger — the stage-routing copies
  // they used to reference were deleted (the phase copy had already drifted: it
  // lacked phase-gate.yaml's `files_touched > 5` arm, so that criterion could not
  // decide anything at master tier). Guard: tests/workflow/judgment-expression-dedup.test.ts.
  it('F3: 3 sub gate refs — canonical tier triggers (strategic delegate still aggregates 2)', () => {
    const raw = readFileSync(DISCUSS_YAML, 'utf8')
    const m = parseYaml(raw) as WorkflowSchemaV3T
    const gates = (m.delegates_to ?? []).map((d) => d.gate).sort()
    expect(gates).toEqual([
      'judgments.phase-gate.gsd-discuss-phase.fires',
      'judgments.strategic-gate.strategic-tier-delegate.fires',
      'judgments.subtask-gate.brainstorming.fires',
    ])
  })

  it('F4: runMasterOrchestrator(discuss, all-fire-context) → fired=3 + skipped=0 (new_feature 启动 高频路径)', async () => {
    // Context 设计 — 触发全 3 sub: new_feature (strategic) + open_decisions≥2 (phase) +
    // approaches≥2 (subtask)。spawnDriver no-op (dogfood spawn 仅验 gate-route 不深 spawn)。
    //
    // `scope_days` 自 T2.1 D-5 起是有语义的值,不再是任意占位:phase 层 delegate 接了
    // `skip_gate: judgments.phase-gate.gsd-discuss-phase.skips`,而 skips_when 含
    // `phase.scope_days < 1` —— 半天工作量会正当否决 phase 层 (❌ 优先于 ✅)。本用例断言的是
    // 路由链行为 (三层全触发),所以 scope_days 必须 ≥ 1 才能测到它本来要测的东西。
    const ctx = {
      phase: {
        type: 'new_feature',
        open_decisions: 3,
        has_cross_phase_data_flow: false,
        scope_days: 2,
      },
      subtask: { approaches: 2, core_algorithm: false, has_api_contract: false, error_cost: 'low' },
    }
    const noopSpawn = async () => undefined
    const r = await runMasterOrchestrator('discuss', ctx, PACKAGE_ROOT, noopSpawn)
    expect(r.master).toBe('discuss')
    expect(r.fired.sort()).toEqual(['phase', 'strategic', 'subtask'])
    expect(r.skipped).toEqual([])
  })

  it('F5: bug_fix context → strategic skip + phase + subtask 独立判 (chain-isolation 铁律)', async () => {
    // 战略层 skip (非 new_feature 且非 major_release) → phase/subtask 独立 eval, NOT
    // forced skip。Per ~/.claude/CLAUDE.md "Fallback 铁律 3 链式互不前置"。
    //
    // scope_days ≥ 1 同 F4 —— 该值现在有语义 (`< 1` 触发 phase 层 skip_gate veto)。铁律要
    // 证的是「上层 skip 不强制下层 skip」,phase 层必须因自身判据 fire,不能被自己的 ❌ 半边
    // 顺带否决掉,否则这条用例会因为错误的原因变绿。
    const ctx = {
      phase: {
        type: 'bug_fix',
        is_major_release: false,
        open_decisions: 3, // phase 灰色 ≥2 → 该层 fires
        has_cross_phase_data_flow: false,
        scope_days: 1.5,
      },
      subtask: {
        approaches: 1, // 单一实现 → subtask 该层 skip
        core_algorithm: false,
        has_api_contract: false,
        error_cost: 'low',
      },
    }
    const noopSpawn = async () => undefined
    const r = await runMasterOrchestrator('discuss', ctx, PACKAGE_ROOT, noopSpawn)
    // strategic 跑掉,phase 跑,subtask 跑掉 — 验证 chain-isolation
    expect(r.fired).toEqual(['phase'])
    expect(r.skipped.sort()).toEqual(['strategic', 'subtask'])
  })

  it('F6: 全跳 path (bug_fix + 单一 phase + 单一 subtask) → fired=0 + skipped=3 全透明声明', async () => {
    const ctx = {
      phase: {
        type: 'bug_fix',
        is_major_release: false,
        open_decisions: 0,
        has_cross_phase_data_flow: false,
        scope_days: 0.1,
      },
      subtask: {
        approaches: 1,
        core_algorithm: false,
        has_api_contract: false,
        error_cost: 'low',
      },
    }
    const noopSpawn = async () => undefined
    const r = await runMasterOrchestrator('discuss', ctx, PACKAGE_ROOT, noopSpawn)
    expect(r.fired).toEqual([])
    expect(r.skipped.sort()).toEqual(['phase', 'strategic', 'subtask'])
  })

  it('F7: Transparency block emits [discuss master] Evaluating 3 sub-workflow gates + ✓ ⊘ marks + Complete summary', async () => {
    const logs: string[] = []
    const origLog = console.log
    console.log = (...args: unknown[]) => {
      logs.push(args.map(String).join(' '))
    }
    try {
      const ctx = {
        phase: { type: 'new_feature', open_decisions: 3, scope_days: 1 },
        subtask: {
          approaches: 1,
          core_algorithm: false,
          has_api_contract: false,
          error_cost: 'low',
        },
      }
      const noopSpawn = async () => undefined
      await runMasterOrchestrator('discuss', ctx, PACKAGE_ROOT, noopSpawn)
    } finally {
      console.log = origLog
    }
    const joined = logs.join('\n')
    expect(joined).toMatch(/\[discuss master\] Evaluating 3 sub-workflow gates/)
    // ✓ 标记表示 fire (strategic + phase fire,subtask 单一实现 skip)
    expect(joined).toMatch(/✓ strategic/)
    expect(joined).toMatch(/✓ phase/)
    expect(joined).toMatch(/⊘ subtask/)
    expect(joined).toMatch(/\[discuss master\] Complete: 2 fired, 1 skipped/)
  })

  it('F8: spawnDriver invoked 1x per fired sub (parallel fan-out — 全 3 fire 验)', async () => {
    const spawnCalls: Array<{ master: string; sub: string }> = []
    const trackingSpawn = async (master: string, sub: string) => {
      spawnCalls.push({ master, sub })
    }
    const ctx = {
      phase: { type: 'new_feature', open_decisions: 3, scope_days: 1 },
      subtask: { approaches: 2, core_algorithm: true, has_api_contract: true, error_cost: 'high' },
    }
    await runMasterOrchestrator('discuss', ctx, PACKAGE_ROOT, trackingSpawn)
    expect(spawnCalls).toHaveLength(3)
    expect(spawnCalls.map((c) => c.master)).toEqual(['discuss', 'discuss', 'discuss'])
    expect(spawnCalls.map((c) => c.sub).sort()).toEqual(['phase', 'strategic', 'subtask'])
  })

  it('F9: disciplines_applied 6 default 全 declared (D-09 L0 substrate cross-cutting)', () => {
    const raw = readFileSync(DISCUSS_YAML, 'utf8')
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

  it('F10: K8 single-context snapshot — same context obj passed unchanged 到 spawnDriver (无 per-sub re-snapshot)', async () => {
    const ctx = {
      phase: { type: 'new_feature', open_decisions: 3, scope_days: 1 },
      subtask: { approaches: 2, core_algorithm: true, has_api_contract: true, error_cost: 'high' },
    }
    const receivedCtx: Record<string, unknown>[] = []
    const captureSpawn = async (
      _master: string,
      _sub: string,
      passedCtx: Record<string, unknown>,
    ) => {
      receivedCtx.push(passedCtx)
    }
    await runMasterOrchestrator('discuss', ctx, PACKAGE_ROOT, captureSpawn)
    expect(receivedCtx).toHaveLength(3)
    // 全 3 spawn 收到 same context reference (K8 single snapshot proof)
    for (const c of receivedCtx) {
      expect(c).toBe(ctx)
    }
  })
})
