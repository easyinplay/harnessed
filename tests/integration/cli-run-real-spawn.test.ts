// Phase 2 (v3.4.4) — real-spawn E2E for `harnessed run` (skipIf gate).
//
// Default-skipped on every CI / local `pnpm test` run; only fires when the
// developer sets HARNESSED_REAL_SPAWN=1 explicitly. Purpose: prove the v3.4.4
// runtime flip end-to-end — `harnessed run verify-simplify` (no --dry-run)
// drives a real Claude subagent spawn via the new sdkSpawn-backed
// _dispatchSkillStub.fn (commit 2738c07), NOT the legacy `<stub for X>`
// placeholder string.
//
// Sister pattern: tests/integration/installer-real-spawn.test.ts:31-33
// (same env-var gate, same opt-in policy — CI workflow does NOT set the env).
//
// Pre-condition: `pnpm build` must have produced dist/cli.mjs.
//
// Run manually:
//   HARNESSED_REAL_SPAWN=1 corepack pnpm test tests/integration/cli-run-real-spawn.test.ts

import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const REAL = process.env.HARNESSED_REAL_SPAWN === '1'
const CLI = join(process.cwd(), 'dist', 'cli.mjs')

describe.skipIf(!REAL)('harnessed run real-spawn (HARNESSED_REAL_SPAWN=1)', () => {
  it('verify-simplify → exit 0 + stderr stage marker + no <stub for X> in output', () => {
    const r = spawnSync('node', [CLI, 'run', 'verify-simplify', '--task', 'noop test task'], {
      encoding: 'utf8',
      timeout: 120_000,
      // issue #1 — this test intentionally exercises the real in-process spawn,
      // so bypass the nested-CC guard (a dev running HARNESSED_REAL_SPAWN=1 is
      // typically inside a CC session, which would otherwise exit 1).
      env: { ...process.env, HARNESSED_ALLOW_NESTED: '1' },
    })
    expect(r.status).toBe(0)
    expect(r.stderr).toMatch(/\[stage verify-simplify complete\]/)
    // KEY: production default emits real SDK output, NOT the literal placeholder.
    expect(r.stdout + r.stderr).not.toMatch(/<stub for /)
  }, 130_000)
})
