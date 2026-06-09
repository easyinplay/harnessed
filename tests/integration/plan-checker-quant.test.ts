// Phase 2.4 W2 T2.4 — EE-4 plan-checker quantitative gate integration test.
// 4 cells (all self-contained tmpdir fixtures — decoupled from live .planning/
// after the 2026-06-09 GSD-layout migration moved + broke the old real-plan refs):
//   1. synthetic PASS fixture -> exit 0 (PASS per T2.0 RELAX baseline)
//   2. synthetic BLOCKER fixture (weasel + missing file refs) -> exit 1 + ::error::
//   3. schema yaml validate (yaml parse + 4 维 threshold keys present)
//   4. synthetic BLOCKER-tending fixture + ENFORCE=false -> exit 0, still emits JSON
import { execSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'

const SCHEMA_PATH = 'routing/plan-review-schema.yaml'
const WALKER = 'scripts/run-plan-checker.mjs'

function runWalker(
  target: string,
  env: NodeJS.ProcessEnv = {},
): { stdout: string; stderr: string; code: number } {
  try {
    const stdout = execSync(`node ${WALKER} ${target}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
    })
    return { stdout, stderr: '', code: 0 }
  } catch (err) {
    const e = err as { stdout?: Buffer | string; stderr?: Buffer | string; status?: number }
    return {
      stdout: e.stdout?.toString() ?? '',
      stderr: e.stderr?.toString() ?? '',
      code: e.status ?? 1,
    }
  }
}

describe('Phase 2.4 W2 T2.4 — EE-4 plan-checker quant gate', () => {
  it('cell 1: synthetic PASS fixture scores PASS (T2.0 RELAX baseline lock)', () => {
    // Self-contained: real file ref (README.md) + quant acceptance + anchors → 4/4 PASS.
    // Decoupled from live .planning/ (2026-06-09 GSD migration broke real-plan refs).
    const dir = mkdtempSync(join(tmpdir(), 'plan-check-pass-'))
    writeFileSync(
      join(dir, 'task_plan.md'),
      '# T1.1\n- **files_modified**: `README.md`(MODIFY)\n- **acceptance_criteria**:\n  - `wc -l README.md` > 0\n  - `grep -c "harnessed" README.md` ≥ 1\n  - exit 0\n- **decision_source**: B-01 + ADR 0001\n',
    )
    const r = runWalker(dir)
    expect(r.code).toBe(0)
    const lines = r.stdout.trim().split('\n').filter(Boolean)
    expect(lines.length).toBeGreaterThanOrEqual(1)
    for (const line of lines) {
      const parsed = JSON.parse(line)
      expect(parsed.verdict).not.toBe('BLOCKER')
      expect(parsed.dimensions_passed).toBeGreaterThanOrEqual(3)
      expect(parsed.auto_retrigger_plan_phase).toBe(false) // B-12 invariant
    }
    rmSync(dir, { recursive: true, force: true })
  })

  it('cell 2: synthetic BLOCKER fixture -> exit 1 + ::error:: annotation', () => {
    const dir = mkdtempSync(join(tmpdir(), 'plan-check-blocker-'))
    const bad = `# Synthetic BLOCKER plan\n\n## T1.1 — bad task\n\n- **files_modified**: \`nonexistent/missing.ts\`(NEW) + \`another/ghost.md\`(NEW) + \`third/phantom.yaml\`(NEW)\n- **acceptance_criteria**:\n  - it should be working maybe\n  - it presumably likely works probably\n  - assumed to be fine\n- **decision_source**: vague reference no anchors\n`
    writeFileSync(join(dir, 'task_plan.md'), bad)
    const r = runWalker(dir)
    expect(r.code).toBe(1)
    expect(r.stderr).toContain('::error')
    expect(r.stderr).toContain('BLOCKER')
    rmSync(dir, { recursive: true, force: true })
  })

  it('cell 3: schema yaml valid + 4 维 threshold keys present', () => {
    type Schema = {
      schemaVersion: number
      kind: string
      spec: {
        dimensions: Record<string, { threshold: number }>
        scoring: { pass_threshold: number; warning_threshold: number }
        enforcement: { auto_spawn: boolean }
      }
    }
    const schema = parseYaml(readFileSync(SCHEMA_PATH, 'utf8')) as Schema
    expect(schema.schemaVersion).toBe(1)
    expect(schema.kind).toBe('PlanReview')
    const dims = schema.spec.dimensions
    expect(Object.keys(dims).sort()).toEqual([
      'business_logic_assumptions',
      'concrete_acceptance',
      'file_references_verified',
      'reference_sources_real',
    ])
    for (const k of Object.keys(dims)) expect(dims[k]).toHaveProperty('threshold')
    expect(schema.spec.scoring.pass_threshold).toBe(4)
    expect(schema.spec.scoring.warning_threshold).toBe(3)
    expect(schema.spec.enforcement.auto_spawn).toBe(false) // B-12 invariant
  })

  it('cell 4: ENFORCE=false warn-only emits JSON cleanly even on BLOCKER (sister transparency W3)', () => {
    // Synthetic BLOCKER-tending plan + ENFORCE=false → walker exits 0 (warn-only)
    // but still emits a JSON verdict line. Self-contained, no .planning/ coupling.
    const dir = mkdtempSync(join(tmpdir(), 'plan-check-warn-'))
    writeFileSync(
      join(dir, 'task_plan.md'),
      '# T1.1 — mid-flight\n- **files_modified**: `ghost/missing-a.ts`(NEW) + `ghost/missing-b.ts`(NEW)\n- **acceptance_criteria**:\n  - it should probably work\n- **decision_source**: vague\n',
    )
    const r = runWalker(dir, { ENFORCE: 'false' })
    expect(r.code).toBe(0) // ENFORCE=false -> warn-only round 1 (sister transparency W3)
    const lines = r.stdout.trim().split('\n').filter(Boolean)
    expect(lines.length).toBeGreaterThanOrEqual(1)
    for (const line of lines) {
      const parsed = JSON.parse(line)
      expect(['PASS', 'WARNING', 'BLOCKER']).toContain(parsed.verdict)
      expect(parsed).toHaveProperty('scores.file_references_verified')
      expect(parsed).toHaveProperty('scores.business_logic_assumptions')
    }
    rmSync(dir, { recursive: true, force: true })
  })
})
