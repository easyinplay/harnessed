// `harnessed checkpoint` CLI unit tests (TDD red-first).
//
// Single `checkpoint <action> <sub>` command; action ∈ {start, complete, fail}.
// Sister pattern: tests/cli/run.test.ts (ExitError + runCli helper, vi.mock module).
// engineHook.js fully mocked so we assert CLI→hook call args WITHOUT touching the
// real filesystem or Date (engineHook uses new Date().toISOString() in prod).

import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/checkpoint/engineHook.js', () => ({
  activatePhase: vi.fn(async () => ({ checkpointPath: '/fake/path/task-code.json' })),
  completePhase: vi.fn(async () => undefined),
}))

// v5.0 Spec 1 — the `complete` action now runs the fail-closed evidence guard
// (checkArtifacts) and the ledger RMW (mutateSubProgress). Mock both so these
// stay pure CLI-wiring unit tests (hook calls + exit codes) without real fs/yaml.
// Default checkArtifacts → none_declared (guard N/A) so a bare `complete` still
// exits 0; individual cells override the return to exercise the guard branches.
vi.mock('../../src/checkpoint/evidence.js', () => ({
  checkArtifacts: vi.fn(async () => ({ status: 'none_declared', found: [], missing: [] })),
  // Phase 12: also mock checkPlanningSync so complete tests stay hermetic.
  // Default: verified (no planning block) so bare `complete` still exits 0.
  checkPlanningSync: vi.fn(async () => ({ status: 'verified', missing: [] })),
}))
// v5.0 Spec 1 — the `complete` branch reads the ledger back (readCurrentWorkflow)
// after the mark to decide whether this completion finishes the master chain.
// Default: no active record (null) → nextPending([])===null → workflow completes
// (legacy single-sub behavior). Cells override to seed a multi-sub ledger.
vi.mock('../../src/checkpoint/state.js', () => ({
  mutateSubProgress: vi.fn(async () => undefined),
  readCurrentWorkflow: vi.fn(async () => null),
}))

import { activatePhase, completePhase } from '../../src/checkpoint/engineHook.js'
import { checkArtifacts } from '../../src/checkpoint/evidence.js'
import { readCurrentWorkflow } from '../../src/checkpoint/state.js'
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

describe('cli/checkpoint — start/complete/fail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(activatePhase).mockResolvedValue({ checkpointPath: '/fake/path/task-code.json' })
    vi.mocked(completePhase).mockResolvedValue(undefined)
    // Default evidence posture: none_declared (guard N/A) → `complete` exits 0.
    vi.mocked(checkArtifacts).mockResolvedValue({ status: 'none_declared', found: [], missing: [] })
    // Default: no active workflow record → nextPending([])===null → completion
    // transitions the workflow to 'complete' (empty-ledger / single-sub legacy).
    vi.mocked(readCurrentWorkflow).mockResolvedValue(null)
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('registers `checkpoint` subcommand on Command instance', () => {
    const program = new Command()
    registerCheckpoint(program)
    const names = program.commands.map((c) => c.name())
    expect(names).toContain('checkpoint')
  })

  it('cell 1 — start task-code → activatePhase("task-code"), exit 0, stdout has path', async () => {
    const { code, stdout } = await runCli(['checkpoint', 'start', 'task-code'])
    expect(code).toBe(0)
    expect(activatePhase).toHaveBeenCalledTimes(1)
    expect(activatePhase).toHaveBeenCalledWith('task-code')
    expect(completePhase).not.toHaveBeenCalled()
    expect(stdout).toContain('/fake/path/task-code.json')
  })

  it('cell 2 — complete task-code --summary "done X" → completePhase with lastTask "done X", exit 0', async () => {
    const { code } = await runCli(['checkpoint', 'complete', 'task-code', '--summary', 'done X'])
    expect(code).toBe(0)
    expect(completePhase).toHaveBeenCalledTimes(1)
    // empty ledger (readCurrentWorkflow→null) → nextPending null → workflow completes.
    expect(completePhase).toHaveBeenCalledWith({
      phaseId: 'task-code',
      status: 'complete',
      lastTask: 'done X',
      transitionWorkflowComplete: true,
    })
    expect(activatePhase).not.toHaveBeenCalled()
  })

  it('cell 3 — complete task-code (no summary) → completePhase with default lastTask, exit 0', async () => {
    const { code } = await runCli(['checkpoint', 'complete', 'task-code'])
    expect(code).toBe(0)
    expect(completePhase).toHaveBeenCalledTimes(1)
    expect(completePhase).toHaveBeenCalledWith({
      phaseId: 'task-code',
      status: 'complete',
      lastTask: 'phase task-code complete',
      transitionWorkflowComplete: true,
    })
  })

  it('cell 4 — fail task-code --summary "boom" → lastTask "FAILED: boom", exit 1, stderr note', async () => {
    const { code, stderr } = await runCli(['checkpoint', 'fail', 'task-code', '--summary', 'boom'])
    expect(code).toBe(1)
    expect(completePhase).toHaveBeenCalledTimes(1)
    const arg = vi.mocked(completePhase).mock.calls[0]?.[0]
    expect(arg?.phaseId).toBe('task-code')
    expect(arg?.status).toBe('complete')
    expect(arg?.lastTask).toContain('FAILED')
    expect(arg?.lastTask).toContain('boom')
    // v5.0 Spec 1 — a failed sub never flips the workflow to 'complete'.
    expect(arg?.transitionWorkflowComplete).toBe(false)
    expect(stderr.length).toBeGreaterThan(0)
  })

  it('cell 5 — badaction task-code → exit 1 (invalid action), neither hook called', async () => {
    const { code } = await runCli(['checkpoint', 'badaction', 'task-code'])
    expect(code).toBe(1)
    expect(activatePhase).not.toHaveBeenCalled()
    expect(completePhase).not.toHaveBeenCalled()
  })

  it('cell 6 — start then complete sequence → both hooks called', async () => {
    const r1 = await runCli(['checkpoint', 'start', 'task-code'])
    expect(r1.code).toBe(0)
    expect(activatePhase).toHaveBeenCalledTimes(1)
    const r2 = await runCli(['checkpoint', 'complete', 'task-code', '--summary', 'done'])
    expect(r2.code).toBe(0)
    expect(completePhase).toHaveBeenCalledTimes(1)
  })

  // v5.0 Spec 1 (ADR-0033) — fail-closed evidence guard branches.
  it('cell 7 — complete with declared-but-missing artifact → fail-closed exit 1, completePhase NOT called', async () => {
    vi.mocked(checkArtifacts).mockResolvedValueOnce({
      status: 'missing',
      found: [],
      missing: ['progress.md'],
    })
    const { code, stderr } = await runCli(['checkpoint', 'complete', 'task-code'])
    expect(code).toBe(1)
    expect(completePhase).not.toHaveBeenCalled()
    expect(stderr).toContain('BLOCKED')
    expect(stderr).toContain('progress.md')
  })

  it('cell 8 — complete --force with missing artifact → override, exit 0, completePhase called', async () => {
    vi.mocked(checkArtifacts).mockResolvedValueOnce({
      status: 'missing',
      found: [{ path: 'progress.md', sha256: 'abc123' }],
      missing: ['other.md'],
    })
    const { code } = await runCli(['checkpoint', 'complete', 'task-code', '--force'])
    expect(code).toBe(0)
    expect(completePhase).toHaveBeenCalledTimes(1)
  })

  it('cell 9 — complete with verified artifacts → exit 0, completePhase called, stdout notes verified', async () => {
    vi.mocked(checkArtifacts).mockResolvedValueOnce({
      status: 'verified',
      found: [{ path: 'progress.md', sha256: 'deadbeef' }],
      missing: [],
    })
    const { code, stdout } = await runCli(['checkpoint', 'complete', 'task-code'])
    expect(code).toBe(0)
    expect(completePhase).toHaveBeenCalledTimes(1)
    expect(stdout).toContain('verified')
  })

  // v5.0 Spec 1 — workflow-status × ledger consistency. Completing ONE sub of a
  // master chain that still has pending subs must NOT flip the whole workflow to
  // 'complete' (e2e dogfood: seed 4 subs → complete 1 → status showed `complete`
  // while 3 stayed pending + `→ next`).
  const ledger = (
    entries: Array<{ sub: string; status: 'pending' | 'done' | 'failed' | 'skipped' }>,
  ) =>
    ({
      schemaVersion: '1.0.0',
      phase: 'task',
      status: 'active',
      last_checkpoint_path: null,
      started_at: '2026-06-05T00:00:00.000Z',
      sub_progress: entries.map((e) => ({ ...e, gate_fired: true })),
      // biome-ignore lint/suspicious/noExplicitAny: schema literal narrowing in test fixture.
    }) as any

  it('cell 10 — complete one sub while others pending → workflow NOT completed (transitionWorkflowComplete:false)', async () => {
    // After the mark, the ledger reflects task-code done but 3 subs still pending.
    vi.mocked(readCurrentWorkflow).mockResolvedValue(
      ledger([
        { sub: 'task-code', status: 'done' },
        { sub: 'task-clarify', status: 'pending' },
        { sub: 'task-review', status: 'pending' },
        { sub: 'task-verify', status: 'pending' },
      ]),
    )
    const { code } = await runCli(['checkpoint', 'complete', 'task-code'])
    expect(code).toBe(0)
    expect(completePhase).toHaveBeenCalledTimes(1)
    const arg = vi.mocked(completePhase).mock.calls[0]?.[0]
    expect(arg?.transitionWorkflowComplete).toBe(false)
  })

  it('cell 11 — complete the LAST pending sub (none remain) → workflow completed (transitionWorkflowComplete:true)', async () => {
    // After the mark, every sub is resolved (done/skipped) → nextPending null.
    vi.mocked(readCurrentWorkflow).mockResolvedValue(
      ledger([
        { sub: 'task-code', status: 'done' },
        { sub: 'task-clarify', status: 'skipped' },
        { sub: 'task-review', status: 'done' },
        { sub: 'task-verify', status: 'done' },
      ]),
    )
    const { code } = await runCli(['checkpoint', 'complete', 'task-verify'])
    expect(code).toBe(0)
    expect(completePhase).toHaveBeenCalledTimes(1)
    const arg = vi.mocked(completePhase).mock.calls[0]?.[0]
    expect(arg?.transitionWorkflowComplete).toBe(true)
  })
})
