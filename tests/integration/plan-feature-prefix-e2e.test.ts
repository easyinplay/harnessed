// tests/integration/plan-feature-prefix-e2e.test.ts — Phase 3.2 W3 T3.1.
// R7.4 acceptance "用户三种前缀场景任一都跑通" e2e prefix matrix.
// 3-prefix matrix: gstack- mode / bare '' (--no-prefix) mode / ambiguous fail.
// Real workflow runner + real loadPhases + real engineHook + real interpolate.
// vi.mock spawnSync for probeGstackPrefix surface; tmpdir cwd-swap pattern
// (sister tests/integration/plan-feature-wired.test.ts T2.6).
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// vi.mock spawnSync at module level (hoisted) — sister tests/cli/doctor.test.ts
vi.mock('node:child_process', async () => {
  const actual = await vi.importActual<typeof import('node:child_process')>('node:child_process')
  return { ...actual, spawnSync: vi.fn() }
})

// Phase v3.4.4 — runWorkflow's production default of _dispatchSkillStub.fn now
// calls real sdkSpawn → @anthropic-ai/claude-agent-sdk query(). Without this
// mock the workflow-level fixtures would hang waiting on the real SDK. Yield
// a synthetic success result message so sdkSpawn returns a COMPLETE envelope
// and _dispatchSkillStub maps to {status:'ok'} — preserves pre-flip workflow
// semantic. Sister tests/routing/sdk-spawn.test.ts:122-129 success-message shape.
vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: () =>
    (async function* () {
      yield {
        type: 'result',
        subtype: 'success',
        result: '<stub for plan-feature-phase>',
        structured_output: { status: 'COMPLETE' },
        session_id: 'mock-session',
      }
    })(),
}))

const WORKFLOW_YAML = join(process.cwd(), 'workflows/plan-feature/workflow.yaml')

// v3.0.3 — HARNESSED_ROOT_OVERRIDE isolation (sister plan-feature-wired).
let tmp: string
let originalCwd: string
let originalOverride: string | undefined

beforeEach(async () => {
  originalCwd = process.cwd()
  tmp = mkdtempSync(join(tmpdir(), 'plan-feature-prefix-e2e-'))
  process.chdir(tmp)
  originalOverride = process.env.HARNESSED_ROOT_OVERRIDE
  process.env.HARNESSED_ROOT_OVERRIDE = join(tmp, '.claude', 'harnessed')
  await mkdir(join(tmp, '.claude', 'harnessed', 'checkpoints'), { recursive: true })
  vi.resetModules()
})

afterEach(() => {
  process.chdir(originalCwd)
  if (originalOverride === undefined) delete process.env.HARNESSED_ROOT_OVERRIDE
  else process.env.HARNESSED_ROOT_OVERRIDE = originalOverride
  rmSync(tmp, { recursive: true, force: true })
  vi.restoreAllMocks()
})

function harnessedSubdirPath(...segments: string[]): string {
  return join(tmp, '.claude', 'harnessed', ...segments)
}

describe('plan-feature prefix matrix e2e (R7.4 acceptance — 三选一 + WIRED)', () => {
  it('1. gstack- mode end-to-end (R7.4 case 1 prefixed) — probe pass + runWorkflow complete + invokes interpolated', async () => {
    // Mock: gstack-office-hours found, office-hours NOT found
    const { spawnSync } = await import('node:child_process')
    vi.mocked(spawnSync).mockImplementation((_finder: unknown, args?: ReadonlyArray<string>) => {
      const cmd = args?.[0] ?? ''
      if (cmd === 'gstack-office-hours') {
        return {
          status: 0,
          stdout: '/usr/local/bin/gstack-office-hours\n',
          stderr: '',
        } as ReturnType<typeof spawnSync>
      }
      return { status: 1, stdout: '', stderr: '' } as ReturnType<typeof spawnSync>
    })

    const { probeGstackPrefix } = await import('../../src/cli/lib/probe-gstack.js')
    const probe = probeGstackPrefix()
    expect(probe.status).toBe('pass')
    expect(probe.prefix).toBe('gstack-')

    // Verify JINJA interpolate produces 'gstack-office-hours' (T1.6 contract)
    const { interpolate } = await import('../../src/workflow/interpolate.js')
    expect(interpolate('{{ gstack_prefix }}office-hours', { gstack_prefix: 'gstack-' })).toBe(
      'gstack-office-hours',
    )

    // runWorkflow consumes vars + interpolates + completes 5 phases (D-03 WIRED)
    const { runWorkflow } = await import('../../src/workflow/run.js')
    const r = await runWorkflow(WORKFLOW_YAML, { gstack_prefix: 'gstack-' })
    expect(r.status).toBe('complete')
    expect(r.phasesRun).toBe(5)
    // engineHook 二代消费 — 5 checkpoint files written by completePhase chain
    expect(existsSync(harnessedSubdirPath('checkpoints', '01-gstack-decision.json'))).toBe(true)
    expect(existsSync(harnessedSubdirPath('checkpoints', '05-persist.json'))).toBe(true)
  })

  it("2. bare '' mode end-to-end (R7.4 case 2 --no-prefix) — probe pass + interp '' empty concat + runWorkflow complete", async () => {
    // Mock: gstack-office-hours NOT found, office-hours found (bare)
    const { spawnSync } = await import('node:child_process')
    vi.mocked(spawnSync).mockImplementation((_finder: unknown, args?: ReadonlyArray<string>) => {
      const cmd = args?.[0] ?? ''
      if (cmd === 'office-hours') {
        return { status: 0, stdout: '/usr/local/bin/office-hours\n', stderr: '' } as ReturnType<
          typeof spawnSync
        >
      }
      return { status: 1, stdout: '', stderr: '' } as ReturnType<typeof spawnSync>
    })

    const { probeGstackPrefix } = await import('../../src/cli/lib/probe-gstack.js')
    const probe = probeGstackPrefix()
    expect(probe.status).toBe('pass')
    expect(probe.prefix).toBe('')

    // Verify JINJA interpolate with empty prefix yields bare 'office-hours'
    const { interpolate } = await import('../../src/workflow/interpolate.js')
    expect(interpolate('{{ gstack_prefix }}office-hours', { gstack_prefix: '' })).toBe(
      'office-hours',
    )

    const { runWorkflow } = await import('../../src/workflow/run.js')
    const r = await runWorkflow(WORKFLOW_YAML, { gstack_prefix: '' })
    expect(r.status).toBe('complete')
    expect(r.phasesRun).toBe(5)
    expect(existsSync(harnessedSubdirPath('checkpoints', '01-gstack-decision.json'))).toBe(true)
  })

  it('3. both/neither ambiguous fail-loud (R7.4 case 3) — probe fail+fix hint; manual config workaround unblocks runWorkflow', async () => {
    // Sub-case 3a: both found → ambiguous
    const { spawnSync } = await import('node:child_process')
    vi.mocked(spawnSync).mockImplementation(
      () =>
        ({ status: 0, stdout: '/usr/local/bin/found\n', stderr: '' }) as ReturnType<
          typeof spawnSync
        >,
    )
    const { probeGstackPrefix } = await import('../../src/cli/lib/probe-gstack.js')
    const ambig = probeGstackPrefix()
    expect(ambig.status).toBe('fail')
    expect(ambig.detail).toMatch(/ambiguous/)
    expect(ambig.fix).toMatch(/\.harnessed\/config\.json/)

    // Sub-case 3b: neither found → install hint
    vi.mocked(spawnSync).mockImplementation(
      () => ({ status: 1, stdout: '', stderr: '' }) as ReturnType<typeof spawnSync>,
    )
    const neither = probeGstackPrefix()
    expect(neither.status).toBe('fail')
    expect(neither.detail).toMatch(/neither/)
    expect(neither.fix).toMatch(/install gstack/)

    // User-provides-manual-config workaround: runWorkflow still works given explicit vars
    // (doctor would fail at this state pre-workflow, but runWorkflow itself does NOT probe —
    // it accepts vars directly per D-03 WIRED API design)
    const { runWorkflow } = await import('../../src/workflow/run.js')
    const r = await runWorkflow(WORKFLOW_YAML, { gstack_prefix: 'gstack-' })
    expect(r.status).toBe('complete')
    expect(r.phasesRun).toBe(5)
  })
})
