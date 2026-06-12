// Phase 12 sentinel-gate — integration tests for the .planning/ sync guard in the
// `harnessed checkpoint complete` path.
//
// These tests verify the merged missing-set block/override/synced/na logic added in
// T12.2: checkPlanningSync is called after checkArtifacts; the two missing arrays are
// merged; the combined set gates the fail-closed block and the --force override.
//
// Pattern: mirrors tests/cli/checkpoint.test.ts (vi.mock modules + runCli helper).
// Both checkArtifacts and checkPlanningSync are mocked so tests are hermetic CLI-wiring
// assertions (no real fs/yaml). Default postures: checkArtifacts → none_declared,
// checkPlanningSync → verified (no artifact or planning block on a bare complete).

import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/checkpoint/engineHook.js', () => ({
  activatePhase: vi.fn(async () => ({ checkpointPath: '/fake/path/task-code.json' })),
  completePhase: vi.fn(async () => undefined),
}))

vi.mock('../../src/checkpoint/evidence.js', () => ({
  checkArtifacts: vi.fn(async () => ({ status: 'none_declared', found: [], missing: [] })),
  checkPlanningSync: vi.fn(async () => ({ status: 'verified', missing: [] })),
}))

vi.mock('../../src/checkpoint/state.js', () => ({
  mutateSubProgress: vi.fn(async () => undefined),
  readCurrentWorkflow: vi.fn(async () => null),
  writeCurrentWorkflow: vi.fn(async () => undefined),
}))

// G1 — mock scale.js so the complete branch doesn't spawn real git commands
// in these pure CLI-wiring unit tests.
vi.mock('../../src/checkpoint/scale.js', () => ({
  collectScaleMetrics: vi.fn(async () => ({ changedFiles: 0, firedSubs: 0, requirements: 0 })),
  assessScale: vi.fn(() => 'light' as const),
}))

import { completePhase } from '../../src/checkpoint/engineHook.js'
import { checkArtifacts, checkPlanningSync } from '../../src/checkpoint/evidence.js'
import { registerCheckpoint } from '../../src/cli/checkpoint.js'

class ExitError extends Error {
  constructor(public code: number) {
    super(`process.exit(${code})`)
  }
}

interface CliResult {
  code: number
  stdout: string
  stderr: string
}

async function runCli(argv: string[]): Promise<CliResult> {
  let stdout = ''
  let stderr = ''
  const exit = vi.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
    throw new ExitError(typeof code === 'number' ? code : 0)
  })
  const log = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    stdout += `${args.map(String).join(' ')}\n`
  })
  const err = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    stderr += `${args.map(String).join(' ')}\n`
  })
  const program = new Command().exitOverride()
  registerCheckpoint(program)
  let code = 0
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
  } catch (e) {
    if (e instanceof ExitError) {
      code = e.code
    } else {
      code = 1
      stderr += `${(e as Error).message}\n`
    }
  } finally {
    exit.mockRestore()
    log.mockRestore()
    err.mockRestore()
  }
  return { code, stdout, stderr }
}

describe('checkpoint complete — .planning/ sync sentinel (Phase 12)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(completePhase).mockResolvedValue(undefined)
    // Default: no artifact block, planning synced
    vi.mocked(checkArtifacts).mockResolvedValue({ status: 'none_declared', found: [], missing: [] })
    vi.mocked(checkPlanningSync).mockResolvedValue({ status: 'verified', missing: [] })
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('block — .planning/ exists, STATE.md absent, no --force → exit 1, BLOCKED, names .planning/STATE.md', async () => {
    vi.mocked(checkPlanningSync).mockResolvedValueOnce({
      status: 'missing',
      missing: ['.planning/STATE.md'],
    })
    const { code, stderr } = await runCli(['checkpoint', 'complete', 'task-code'])
    expect(code).toBe(1)
    expect(completePhase).not.toHaveBeenCalled()
    expect(stderr).toContain('BLOCKED')
    expect(stderr).toContain('.planning/STATE.md')
  })

  it('override — .planning/ exists, STATE.md absent, --force → exit 0, overridden, completePhase called', async () => {
    vi.mocked(checkPlanningSync).mockResolvedValueOnce({
      status: 'missing',
      missing: ['.planning/STATE.md'],
    })
    const { code, stdout } = await runCli(['checkpoint', 'complete', 'task-code', '--force'])
    expect(code).toBe(0)
    expect(completePhase).toHaveBeenCalledTimes(1)
    expect(stdout).toContain('overridden')
  })

  it('synced — .planning/STATE.md present → exit 0, no block, completePhase called', async () => {
    // Default mock already returns verified; just confirm normal path
    vi.mocked(checkPlanningSync).mockResolvedValueOnce({ status: 'verified', missing: [] })
    const { code, stderr } = await runCli(['checkpoint', 'complete', 'task-code'])
    expect(code).toBe(0)
    expect(completePhase).toHaveBeenCalledTimes(1)
    expect(stderr).not.toContain('BLOCKED')
  })

  it('na (none_declared) — no .planning/ dir → exit 0, no block, completePhase called', async () => {
    vi.mocked(checkPlanningSync).mockResolvedValueOnce({ status: 'none_declared', missing: [] })
    const { code, stderr } = await runCli(['checkpoint', 'complete', 'task-code'])
    expect(code).toBe(0)
    expect(completePhase).toHaveBeenCalledTimes(1)
    expect(stderr).not.toContain('BLOCKED')
  })

  it('combined block — artifact missing AND planning unsynced → exit 1, names both in BLOCKED message', async () => {
    vi.mocked(checkArtifacts).mockResolvedValueOnce({
      status: 'missing',
      found: [],
      missing: ['progress.md'],
    })
    vi.mocked(checkPlanningSync).mockResolvedValueOnce({
      status: 'missing',
      missing: ['.planning/STATE.md'],
    })
    const { code, stderr } = await runCli(['checkpoint', 'complete', 'task-code'])
    expect(code).toBe(1)
    expect(completePhase).not.toHaveBeenCalled()
    expect(stderr).toContain('BLOCKED')
    expect(stderr).toContain('progress.md')
    expect(stderr).toContain('.planning/STATE.md')
  })

  it('combined --force — artifact missing AND planning unsynced, --force → exit 0, overridden', async () => {
    vi.mocked(checkArtifacts).mockResolvedValueOnce({
      status: 'missing',
      found: [],
      missing: ['progress.md'],
    })
    vi.mocked(checkPlanningSync).mockResolvedValueOnce({
      status: 'missing',
      missing: ['.planning/STATE.md'],
    })
    const { code, stdout } = await runCli(['checkpoint', 'complete', 'task-code', '--force'])
    expect(code).toBe(0)
    expect(completePhase).toHaveBeenCalledTimes(1)
    expect(stdout).toContain('overridden')
  })
})
