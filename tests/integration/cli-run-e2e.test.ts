// v3.4.4 Phase 1 T5 — E2E spawn of `harnessed run` (sister pattern
// tests/integration/install-aliases.test.ts spawnSync against dist/cli.mjs).
//
// 4 scenarios from PHASE-1-SPEC.md:
//   1. Dry-run loads yaml + emits JSON envelope to stdout (tier-3 sub).
//   2. --list enumerates ≥24 workflow names (tier-1 + tier-2 + tier-3).
//   3. Stdin pipe — `echo "test" | node dist/cli.mjs run X --task-stdin
//      --dry-run` → gateContext.task === "test". MSYS2 / bash semantics
//      verified on dev box; scenario runs unconditionally (Open verification 1
//      passed during implementation; no platform skip needed).
//   4. Live runtime walks workflow (NO --dry-run). DEFERRED to Phase 2 —
//      src/workflow/loadPhases.ts only validates v1 + v2 schemas, so every v3
//      workflow.yaml in workflows/ (all 24 sub-workflows + 4 stage-masters)
//      throws PhasesValidationError on real spawn. Spec assumption that
//      `runWorkflow` walks v3 yamls is incorrect; Phase 2 work needs to add a
//      v3 dispatch arm in loadPhases (mirroring the v1/v2 dispatch). Until
//      then, dry-run is the only verifiable wire — scenarios 1 + 3 confirm
//      the CLI hands off to runWorkflow with the right yamlPath + gateContext.

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(process.cwd())
const CLI = resolve(REPO_ROOT, 'dist', 'cli.mjs')

const DIST_BUILT = existsSync(CLI)

describe.skipIf(!DIST_BUILT)('cli/run E2E — v3.4.4 Phase 1 T5 (spawnSync dist/cli.mjs)', () => {
  it('scenario 1 — dry-run loads yaml + JSON envelope on stdout (tier-3 sub)', () => {
    const r = spawnSync(process.execPath, [CLI, 'run', 'verify-simplify', '--dry-run'], {
      encoding: 'utf8',
      env: { ...process.env, NO_COLOR: '1' },
    })
    expect(r.status).toBe(0)
    const parsed = JSON.parse(r.stdout ?? '')
    expect(parsed.workflow).toBe('verify-simplify')
    // Path uses platform separator — normalize to forward-slash for assertion.
    expect(parsed.yamlPath.replace(/\\/g, '/')).toMatch(
      /workflows\/verify\/simplify\/workflow\.yaml$/,
    )
    expect(parsed.gateContext).toBeDefined()
    expect(parsed.gateContext.task).toBe('')
  })

  it('scenario 2 — --list enumerates ≥24 workflow names (all tiers)', () => {
    const r = spawnSync(process.execPath, [CLI, 'run', '--list'], {
      encoding: 'utf8',
      env: { ...process.env, NO_COLOR: '1' },
    })
    expect(r.status).toBe(0)
    const names = (r.stdout ?? '').split('\n').filter((l) => l.trim().length > 0)
    // Tier-1: auto, research, retro / Tier-2: discuss, plan, task, verify / Tier-3: ~24 subs.
    expect(names.length).toBeGreaterThanOrEqual(24)
    expect(names).toContain('auto')
    expect(names).toContain('discuss')
    expect(names).toContain('discuss-strategic')
    expect(names).toContain('verify-paranoid')
    expect(names).toContain('verify-simplify')
    expect(names).toContain('research')
    expect(names).toContain('retro')
  })

  it('scenario 3 — stdin pipe via `echo`-spawn-spawn chain → gateContext.task carries piped text', () => {
    // Spawn `bash -c 'echo "test requirement" | node dist/cli.mjs run X --task-stdin --dry-run'`
    // so the pipe semantics are exercised by the real shell (sister to manual
    // verification done during impl on Windows Git Bash MSYS2).
    const shellCmd = `echo "test requirement" | "${process.execPath}" "${CLI}" run verify-simplify --task-stdin --dry-run`
    const r = spawnSync(process.platform === 'win32' ? 'bash' : 'sh', ['-c', shellCmd], {
      encoding: 'utf8',
      env: { ...process.env, NO_COLOR: '1' },
    })
    expect(r.status).toBe(0)
    const parsed = JSON.parse(r.stdout ?? '')
    expect(parsed.gateContext.task).toBe('test requirement')
  })

  it.todo(
    'scenario 4 — live runtime walks workflow (DEFERRED): src/workflow/loadPhases.ts lacks v3 schema dispatch; all 24 sub-workflow.yaml files are v3 → PhasesValidationError on real spawn. Phase 2 work: add v3 dispatch arm to loadPhases.',
  )
})
