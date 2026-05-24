// Phase 3 (v3.4.4) — E2E for `harnessed run --max-iterations <n>` (skipIf gate).
//
// Default-skipped on every CI / local `pnpm test` run; only fires when the
// developer sets HARNESSED_REAL_SPAWN=1 explicitly. Purpose: prove the Phase 3
// ralph-loop wrap end-to-end (commit b430682) — both the explicit halt path
// (R20.10 c, `handleMaxIterationsExceeded` fires `process.exit(exit_code)`
// with UX text) and the Phase 1 regression that `--max-iterations` reaches
// `gateContext.maxIterations` in `--dry-run` JSON output.
//
// Sister pattern: tests/integration/cli-run-real-spawn.test.ts:22-25
// (same env-var gate, same opt-in policy — CI workflow does NOT set the env).
//
// Pre-condition: `pnpm build` must have produced dist/cli.mjs.
//
// Run manually:
//   HARNESSED_REAL_SPAWN=1 corepack pnpm test tests/integration/cli-run-max-iterations.test.ts

import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const REAL = process.env.HARNESSED_REAL_SPAWN === '1'
const CLI = join(process.cwd(), 'dist', 'cli.mjs')

describe.skipIf(!REAL)('harnessed run --max-iterations (HARNESSED_REAL_SPAWN=1)', () => {
  it('--max-iterations 3 caps SDK calls + surfaces fallback UX on task-deliver', () => {
    // task-deliver phase 01-deliver has fallback.max_iterations_exceeded
    // configured → R20.10 explicit halt with exit_code 1.
    const r = spawnSync(
      'node',
      [CLI, 'run', 'task-deliver', '--task', 'force-incomplete', '--max-iterations', '3'],
      { encoding: 'utf8', timeout: 180_000 },
    )
    // R20.10 explicit halt → exit code 1 (sister handleMaxIterationsExceeded)
    expect(r.status).toBe(1)
    expect(r.stderr).toMatch(/max-iterations exceeded \(3\/3\)/)
    expect(r.stderr).toMatch(/task-deliver/)
  }, 200_000)

  it('--max-iterations flag echoed in --dry-run JSON (Phase 1 regression)', () => {
    const r = spawnSync(
      'node',
      [CLI, 'run', 'task-deliver', '--max-iterations', '5', '--dry-run'],
      { encoding: 'utf8', timeout: 30_000 },
    )
    expect(r.status).toBe(0)
    const parsed = JSON.parse(r.stdout) as { gateContext: { maxIterations: number } }
    expect(parsed.gateContext.maxIterations).toBe(5)
  })
})
