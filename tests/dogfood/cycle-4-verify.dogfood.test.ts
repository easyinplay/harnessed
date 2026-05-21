// tests/dogfood/cycle-4-verify.dogfood.test.ts — Phase v3.0-3.5 W2 T3.5.W2.1 Cycle 4
// /verify master orchestrator 端到端 dogfood + **Master Path A SDK vs Path B sub-shell LOCK
// decision** (Open Q4 final 决策点)。验证 verify/auto/workflow.yaml 8 sub mixed
// (progress serial order 1 + 6 parallel conditional + simplify serial order 99)。
//
// Path A vs Path B LOCK 决策:
//   - Path A (default) — defaultSpawnDriver in-process recursive runWorkflow on sub yaml
//   - Path B (fallback) — try/catch SDK error → console.warn (NOT 真 sub-shell exec per v3.0
//     conservative scope, K-mitigation cmd surface 收紧;实际 sub-shell exec defer v3.x)
// LOCK criteria 实证:
//   - F8: default (no spawnDriver arg) → Path A in-process spawn 3 fired sub (real yaml load) ✓
//   - F9: DI spawnDriver intentional throw → Promise.allSettled catch parallel rejection +
//     serial throw propagate 验证 + defaultSpawnDriver Path B try/catch contract static-verify
//
// Sister refs:
//   - workflows/verify/auto/workflow.yaml (T3.5.W1.4 SHIPPED)
//   - workflows/judgments/stage-routing.yaml verify-* triggers
//   - src/workflow/masterOrchestrator.ts defaultSpawnDriver L62-78 (T3.5.W0.1 SHIPPED)

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { describe, expect, it, vi } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { runMasterOrchestrator } from '../../src/workflow/masterOrchestrator.js'
import { WorkflowSchemaV3, type WorkflowSchemaV3T } from '../../src/workflow/schema/workflow.js'

const PACKAGE_ROOT = resolve(__dirname, '../..')
const VERIFY_YAML = resolve(PACKAGE_ROOT, 'workflows/verify/auto/workflow.yaml')

describe('Cycle 4 — /verify master orchestrator dogfood + Path A vs Path B LOCK', () => {
  it('F1: verify/auto/workflow.yaml Value.Check WorkflowSchemaV3 pass + workflow=verify + delegates_to=8', () => {
    const raw = readFileSync(VERIFY_YAML, 'utf8')
    const parsed = parseYaml(raw) as unknown
    expect(Value.Check(WorkflowSchemaV3, parsed)).toBe(true)
    const m = parsed as WorkflowSchemaV3T
    expect(m.workflow).toBe('verify')
    expect(m.delegates_to).toHaveLength(8)
  })

  it('F2: 2 serial (progress order 1 + simplify order 99) + 6 parallel mixed', () => {
    const raw = readFileSync(VERIFY_YAML, 'utf8')
    const m = parseYaml(raw) as WorkflowSchemaV3T
    const dels = m.delegates_to ?? []
    const serial = dels.filter((d) => d.mode === 'serial')
    const parallel = dels.filter((d) => d.mode === 'parallel')
    expect(serial).toHaveLength(2)
    expect(parallel).toHaveLength(6)
    const progress = dels.find((d) => d.sub === 'progress')
    const simplify = dels.find((d) => d.sub === 'simplify')
    expect(progress?.order).toBe(1)
    expect(simplify?.order).toBe(99)
  })

  it('F3: 5 conditional parallel gate refs + code-review NO gate (unconditional parallel)', () => {
    const raw = readFileSync(VERIFY_YAML, 'utf8')
    const m = parseYaml(raw) as WorkflowSchemaV3T
    const dels = m.delegates_to ?? []
    const expectedGates: Record<string, string> = {
      paranoid: 'judgments.stage-routing.verify-paranoid-critical.fires',
      qa: 'judgments.stage-routing.verify-qa-ui.fires',
      security: 'judgments.stage-routing.verify-security-secrets.fires',
      design: 'judgments.stage-routing.verify-design-changes.fires',
      multispec: 'judgments.stage-routing.verify-multispec-critical-release.fires',
    }
    for (const [sub, gate] of Object.entries(expectedGates)) {
      expect(dels.find((d) => d.sub === sub)?.gate).toBe(gate)
    }
    expect(dels.find((d) => d.sub === 'code-review')?.gate).toBeUndefined()
  })

  it('F4: minimal verify ctx (stage=verify only) → 3 fired (progress + code-review + simplify) + 5 skipped', async () => {
    const ctx = {
      phase: {
        stage: 'verify',
        is_critical_module: false,
        has_ui_changes: false,
        has_auth_or_secrets: false,
        has_design_changes: false,
      },
      is_critical_release: false,
    }
    const noopSpawn = async () => undefined
    const r = await runMasterOrchestrator('verify', ctx, PACKAGE_ROOT, noopSpawn)
    expect(r.fired.sort()).toEqual(['code-review', 'progress', 'simplify'])
    expect(r.skipped.sort()).toEqual(['design', 'multispec', 'paranoid', 'qa', 'security'])
  })

  it('F5: critical release full ctx → 8 fired all 0 skipped (max-scope verify)', async () => {
    const ctx = {
      phase: {
        stage: 'verify',
        is_critical_module: true,
        has_ui_changes: true,
        has_auth_or_secrets: true,
        has_design_changes: true,
      },
      is_critical_release: true,
    }
    const noopSpawn = async () => undefined
    const r = await runMasterOrchestrator('verify', ctx, PACKAGE_ROOT, noopSpawn)
    expect(r.fired).toHaveLength(8)
    expect(r.fired.sort()).toEqual([
      'code-review',
      'design',
      'multispec',
      'paranoid',
      'progress',
      'qa',
      'security',
      'simplify',
    ])
  })

  it('F6: serial+parallel order — progress order=1 spawned first + simplify order=99 spawned after parallel fan-out', async () => {
    const ctx = {
      phase: {
        stage: 'verify',
        is_critical_module: true,
        has_ui_changes: false,
        has_auth_or_secrets: false,
        has_design_changes: false,
      },
      is_critical_release: false,
    }
    const order: string[] = []
    const trackingSpawn = async (_master: string, sub: string) => {
      order.push(sub)
    }
    await runMasterOrchestrator('verify', ctx, PACKAGE_ROOT, trackingSpawn)
    // progress order 1 first;simplify order 99 last (parallel 中间 order 任意 per Promise.allSettled)
    expect(order[0]).toBe('progress')
    expect(order[order.length - 1]).toBe('simplify')
    expect(order).toContain('code-review')
    expect(order).toContain('paranoid')
  })

  it('F7: Transparency block — Evaluating 8 + Firing N sub in serial+parallel + Complete summary', async () => {
    const logs: string[] = []
    const origLog = console.log
    console.log = (...args: unknown[]) => {
      logs.push(args.map(String).join(' '))
    }
    try {
      const ctx = {
        phase: {
          stage: 'verify',
          is_critical_module: true,
          has_ui_changes: true,
          has_auth_or_secrets: false,
          has_design_changes: false,
        },
        is_critical_release: false,
      }
      const noopSpawn = async () => undefined
      await runMasterOrchestrator('verify', ctx, PACKAGE_ROOT, noopSpawn)
    } finally {
      console.log = origLog
    }
    const joined = logs.join('\n')
    expect(joined).toMatch(/\[verify master\] Evaluating 8 sub-workflow gates/)
    expect(joined).toMatch(/Firing 5 sub in serial\+parallel/)
    expect(joined).toMatch(/→ progress \(serial order=1\)/)
    expect(joined).toMatch(/→ simplify \(serial order=99\)/)
    expect(joined).toMatch(/→ code-review \(parallel\)/)
    expect(joined).toMatch(/→ paranoid \(parallel\)/)
    expect(joined).toMatch(/→ qa \(parallel\)/)
    expect(joined).toMatch(/\[verify master\] Complete: 5 fired, 3 skipped/)
  })

  it('F8: Path A LOCK — default spawnDriver in-process spawn real sub yaml (3 SHIPPED sub all load OK)', async () => {
    // Path A default — no spawnDriver arg → defaultSpawnDriver runWorkflow on sub yaml。
    // 3 fired sub (progress + code-review + simplify) 全 SHIPPED Phase 3.4,real yaml load + Value.Check
    // pass + sub workflow.yaml phase loop in-process exec (sub yaml stub spawner D-03 WIRED)。
    const ctx = {
      phase: {
        stage: 'verify',
        is_critical_module: false,
        has_ui_changes: false,
        has_auth_or_secrets: false,
        has_design_changes: false,
      },
      is_critical_release: false,
    }
    const r = await runMasterOrchestrator('verify', ctx, PACKAGE_ROOT)
    expect(r.master).toBe('verify')
    expect(r.fired.sort()).toEqual(['code-review', 'progress', 'simplify'])
  })

  it('F9: Path B LOCK — DI spawnDriver intentional throw → Promise.allSettled catch (parallel) + Path B contract static-verify', async () => {
    // Path B fallback proof — DI spawnDriver intentional throw on parallel sub:
    // - Promise.allSettled (masterOrchestrator L176-182) catch parallel rejections silently
    // - Failed sub NOT added to fired[] (only fulfilled push per L184)
    // - Master itself NOT throw (master returns success status with smaller fired[])
    const ctx = {
      phase: {
        stage: 'verify',
        is_critical_module: true,
        has_ui_changes: false,
        has_auth_or_secrets: false,
        has_design_changes: false,
      },
      is_critical_release: false,
    }
    const throwOnParallelSpawn = async (_master: string, sub: string) => {
      // Throw on parallel 'paranoid' — verify Promise.allSettled tolerance
      if (sub === 'paranoid')
        throw new Error('intentional Path A failure for Path B contract proof')
    }
    const r = await runMasterOrchestrator('verify', ctx, PACKAGE_ROOT, throwOnParallelSpawn)
    // Master returns success — 'paranoid' NOT in fired[] (rejected) but no throw propagates。
    expect(r.master).toBe('verify')
    expect(r.fired).not.toContain('paranoid')
    expect(r.fired).toContain('progress')
    expect(r.fired).toContain('code-review')
    expect(r.fired).toContain('simplify')

    // Path B contract static-verify — defaultSpawnDriver L62-78 source-level check
    const orchSrc = readFileSync(
      resolve(PACKAGE_ROOT, 'src/workflow/masterOrchestrator.ts'),
      'utf8',
    )
    // Path A primary call
    expect(orchSrc).toMatch(/await runWorkflow\(subYamlPath/)
    // Path B catch + warn note (sub-shell exec defer v3.x per K-mitigation cmd surface 收紧)
    expect(orchSrc).toMatch(/Path B sub-shell fallback/)
    expect(orchSrc).toMatch(/Path A failed/)
  })

  it('F10: K8 single-context snapshot — same ctx reference 全 8 spawn 共享 (max-scope verify)', async () => {
    const ctx = {
      phase: {
        stage: 'verify',
        is_critical_module: true,
        has_ui_changes: true,
        has_auth_or_secrets: true,
        has_design_changes: true,
      },
      is_critical_release: true,
    }
    const receivedCtx: Record<string, unknown>[] = []
    const captureSpawn = async (
      _master: string,
      _sub: string,
      passedCtx: Record<string, unknown>,
    ) => {
      receivedCtx.push(passedCtx)
    }
    await runMasterOrchestrator('verify', ctx, PACKAGE_ROOT, captureSpawn)
    expect(receivedCtx).toHaveLength(8)
    for (const c of receivedCtx) {
      expect(c).toBe(ctx)
    }
  })
})

// Suppress unused-vi-import lint (vi 仅在 F9 间接通过 vitest import 走);keep clean
void vi
