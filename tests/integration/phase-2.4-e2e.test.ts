// Phase 2.4 Wave 5 T5.3 — end-to-end 6-link cross-compose smoke test.
//
// Sister: tests/integration/phase-2.3-e2e.test.ts (W5 T5.3, 107L, 5 link + 1 compose).
// task_plan.md L1049-1066 — verifies 5 W1-W4 ship链路 + cross-link compose.
//   Link 1 — doctor (W1 T1.2 ship)        — src/cli/doctor.ts loadable + registers
//   Link 2 — EE-4 plan-checker (W2 ship)   — scripts/run-plan-checker.mjs + schema
//   Link 3 — dashboard C 路径 (W3 ship)    — scripts/dashboard.mjs + SSE + multi-proj
//   Link 4 — cc-hook-add (W3 T3.1 ship)   — installer 7/7 + dashboard-autospawn yaml
//   Link 5 — audit 完整版 (W4 T4.1 ship)   — runtime-layer helpers + Win sentinel CI
//   Link 6 — cross-link compose            — register* attach without collision
// Karpathy YAGNI: 1 cell per link (artifact + contract surface), NOT re-runs
// W1-W4 unit/integration suites. ≤120L per task_plan.md L1064.

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { Command } from 'commander'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'

const ROOT = process.cwd()

describe('Phase 2.4 e2e 6-link smoke (Wave 5 T5.3)', () => {
  it('Link 1 — doctor: registerDoctor attaches doctor subcommand with 5-check semantics', async () => {
    const { registerDoctor } = await import('../../src/cli/doctor.js')
    const program = new Command()
    registerDoctor(program)
    const cmd = program.commands.find((c) => c.name() === 'doctor')
    expect(cmd, 'doctor subcommand attaches').toBeDefined()
    expect(cmd?.description()).toContain('Node')
    expect(cmd?.description()).toContain('origin')
    // Origin-check helper shared with audit (D2.4-3 sister-share).
    expect(existsSync(join(ROOT, 'src/cli/lib/origin-check.ts'))).toBe(true)
  })

  it('Link 2 — EE-4 plan-checker: walker + schema.yaml co-shipped + 4-dim threshold present', () => {
    const walker = join(ROOT, 'scripts/run-plan-checker.mjs')
    const schemaPath = join(ROOT, 'routing/plan-review-schema.yaml')
    expect(existsSync(walker), 'walker ship (W2 T2.2)').toBe(true)
    expect(existsSync(schemaPath), 'schema yaml ship (W2 T2.1)').toBe(true)
    type Schema = {
      schemaVersion: number
      kind: string
      spec: {
        dimensions: Record<string, { threshold: number }>
        enforcement: { auto_spawn: boolean }
      }
    }
    const schema = parseYaml(readFileSync(schemaPath, 'utf8')) as Schema
    expect(schema.kind).toBe('PlanReview')
    // 4 维 SSOT (T2.0 RELAX calibration baseline locked).
    expect(Object.keys(schema.spec.dimensions).sort()).toEqual([
      'business_logic_assumptions',
      'concrete_acceptance',
      'file_references_verified',
      'reference_sources_real',
    ])
    expect(schema.spec.enforcement.auto_spawn).toBe(false) // B-12 invariant: manual rerun
  })

  it('Link 3 — dashboard C 路径: dashboard.mjs ship + SSE endpoint + multi-project registry', () => {
    const dashboard = join(ROOT, 'scripts/dashboard.mjs')
    expect(existsSync(dashboard), 'dashboard.mjs ship (W3 T3.1-T3.3)').toBe(true)
    const src = readFileSync(dashboard, 'utf8')
    // SSE replaces WebSocket per D2.4-9 (zero-dep + native auto-reconnect).
    expect(src).toMatch(/text\/event-stream|EventSource|\/events/)
    // Multi-project nav per O7 (W3 T3.3 — harnessed-projects.json registry).
    expect(src).toMatch(/harnessed-projects\.json|\/api\/projects/)
    // B-27 localhost-only bind safety.
    expect(src).toMatch(/127\.0\.0\.1|localhost/)
  })

  it('Link 4 — cc-hook-add: 7th installer ship + dashboard-autospawn manifest schema-valid', async () => {
    const installer = join(ROOT, 'src/installers/ccHookAdd.ts')
    const manifest = join(ROOT, 'manifests/cc-hooks/dashboard-autospawn.yaml')
    expect(existsSync(installer), 'ccHookAdd installer ship (W3 T3.1)').toBe(true)
    expect(existsSync(manifest), 'dashboard-autospawn.yaml ship (W3 T3.1)').toBe(true)
    // ccHookAdd registered in installers dispatch (7/7 method).
    const indexSrc = readFileSync(join(ROOT, 'src/installers/index.ts'), 'utf8')
    expect(indexSrc).toMatch(/'cc-hook-add':\s*installCcHookAdd/)
    // Manifest declares SessionStart hook event + cc-hook-add method.
    const yaml = readFileSync(manifest, 'utf8')
    expect(yaml).toMatch(/method:\s*cc-hook-add/)
    expect(yaml).toMatch(/hook_event:\s*SessionStart/)
  })

  it('Link 5 — audit 完整版: runtime-layer helpers + Win sentinel CI step', () => {
    const auditHelpers = join(ROOT, 'src/cli/lib/audit-helpers.ts')
    expect(existsSync(auditHelpers), 'audit-helpers ship (W4 T4.1)').toBe(true)
    const helpersSrc = readFileSync(auditHelpers, 'utf8')
    // 3 runtime-layer helpers per B-28 + B-29 + D2.4-16 + D2.4-17.
    expect(helpersSrc).toMatch(/auditOriginIntegrity/)
    expect(helpersSrc).toMatch(/auditInstallCmdIntegrity/)
    expect(helpersSrc).toMatch(/auditProvenance/)
    // Win sentinel ralph-loop CI step shipped (W4 T4.3 if: runner.os == 'Windows').
    const ci = readFileSync(join(ROOT, '.github/workflows/ci.yml'), 'utf8')
    expect(ci).toMatch(/ralph-loop.*[Ww]in|runner\.os == 'Windows'/)
  })

  it('Link 6 — cross-link compose: doctor + audit + install register on one Command tree without collision', async () => {
    const { registerDoctor } = await import('../../src/cli/doctor.js')
    const { registerAudit } = await import('../../src/cli/audit.js')
    const { registerInstall } = await import('../../src/cli/install.js')
    const program = new Command()
    registerDoctor(program)
    registerAudit(program)
    registerInstall(program)
    const names = program.commands.map((c) => c.name())
    expect(names).toContain('doctor')
    expect(names).toContain('audit')
    expect(names).toContain('install')
    // No duplicate registration (5 W1-W4 ship pieces compose on single CLI surface).
    expect(new Set(names).size).toBe(names.length)
  })
})
