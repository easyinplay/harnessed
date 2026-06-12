// Phase 3.1 W4 T4.5 — resume.test.ts: 7 fixtures (runResume + CLI exit codes).
// D-03 fail-loud: 3+ tests assert exit(1); D-04 fallback: 1 test asserts fresh-session hint.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fsState = new Map<string, string>()

vi.mock('node:fs/promises', () => ({
  readFile: async (p: string) => {
    const v = fsState.get(p)
    if (v === undefined) throw new Error(`ENOENT: ${p}`)
    return v
  },
  writeFile: async (p: string, data: string) => void fsState.set(p, data),
  mkdir: async () => undefined,
}))

// v5.0 Spec 1 (F) — mock detectDrift so resume drift tests are deterministic and
// don't depend on real sha256 of in-memory fixtures.
vi.mock('../../src/checkpoint/evidence.js', () => ({ detectDrift: vi.fn(async () => []) }))

import { join as pathJoin } from 'node:path'
import { Command } from 'commander'
import { detectDrift } from '../../src/checkpoint/evidence.js'
import { runResume } from '../../src/checkpoint/resume.js'
import { registerResume } from '../../src/cli/resume.js'
import { harnessedFile, harnessedSubdir } from '../../src/installers/lib/harnessedRoot.js'
import { SCHEMA_VERSIONS } from '../../src/types/schemaVersion.js'

const detectDriftMock = vi.mocked(detectDrift)

// v3.0.3 — paths under ~/.claude/harnessed/ via harnessedRoot SoT.
const STATE_PATH = harnessedFile('current-workflow.json')
const CP_PATH = pathJoin(harnessedSubdir('checkpoints'), '3.1.json')

function seedPausedWorkflow(cpPath: string = CP_PATH) {
  fsState.set(
    STATE_PATH,
    JSON.stringify({
      schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
      phase: '3.1',
      status: 'paused',
      last_checkpoint_path: cpPath,
      started_at: '2026-05-16T10:00:00.000Z',
      paused_at: '2026-05-16T11:00:00.000Z',
    }),
  )
}

function seedCheckpoint(overrides: Record<string, unknown> = {}, path: string = CP_PATH) {
  fsState.set(
    path,
    JSON.stringify({
      schemaVersion: SCHEMA_VERSIONS.checkpoint,
      phase: '3.1',
      status: 'paused',
      last_task: 'T4.5 tests in progress',
      key_decisions: ['D-03 RELOAD', 'D-04 WIRE-IN'],
      canonical_refs: ['PLAN.md', 'RESEARCH.md'],
      session_id: 'sess-resume-1',
      cwd: process.cwd(), // match by default — overrides can drift
      timestamp: '2026-05-16T11:00:00.000Z',
      archive_path: '.harnessed/archive/phase-3.1/',
      ...overrides,
    }),
  )
}

class ExitError extends Error {
  constructor(public code: number) {
    super(`exit(${code})`)
  }
}

async function runCli(argv: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  let stdout = ''
  let stderr = ''
  vi.spyOn(process, 'exit').mockImplementation((c?: number | string | null) => {
    throw new ExitError(typeof c === 'number' ? c : 0)
  })
  vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
    stdout += `${a.map(String).join(' ')}\n`
  })
  vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => {
    stderr += `${a.map(String).join(' ')}\n`
  })
  const program = new Command().exitOverride()
  registerResume(program)
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
    return { code: 0, stdout, stderr }
  } catch (e) {
    if (e instanceof ExitError) return { code: e.code, stdout, stderr }
    throw e
  }
}

beforeEach(() => fsState.clear())
afterEach(() => vi.restoreAllMocks())

describe('cli/resume + runResume — Phase 3.1 W4 T4.5 (fixtures 24-30)', () => {
  it('24. no current-workflow.json → runResume returns "no-paused-phase" + CLI exit 1', async () => {
    const r = await runResume()
    expect(r.status).toBe('no-paused-phase')
    const cli = await runCli(['resume'])
    expect(cli.code).toBe(1)
    // v3.0.3 — message references the harness root (no longer ".harnessed/...").
    expect(cli.stderr).toMatch(/no current-workflow.json found under <harnessed-root>/)
  })

  it('25. workflow status="active" → "no-paused-phase" + CLI exit 1 (D-03 fail-loud)', async () => {
    fsState.set(
      STATE_PATH,
      JSON.stringify({
        schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
        phase: '3.1',
        status: 'active',
        last_checkpoint_path: null,
        started_at: '2026-05-16T10:00:00.000Z',
      }),
    )
    const r = await runResume()
    expect(r.status).toBe('no-paused-phase')
    if (r.status === 'no-paused-phase') expect(r.error).toMatch(/'active'/)
    const cli = await runCli(['resume'])
    expect(cli.code).toBe(1)
  })

  it('26. paused + valid checkpoint with session_id → ok + resumeHint mentions SDK redirect', async () => {
    seedPausedWorkflow()
    seedCheckpoint()
    const r = await runResume()
    expect(r.status).toBe('ok')
    if (r.status === 'ok') {
      expect(r.checkpoint.phase).toBe('3.1')
      expect(r.checkpoint.last_task).toBe('T4.5 tests in progress')
      expect(r.resumeHint).toMatch(/session_id: sess-resume-1/)
      expect(r.resumeHint).toMatch(/redirect to original session/)
    }
    const cli = await runCli(['resume'])
    expect(cli.code).toBe(0)
    expect(cli.stdout).toMatch(/phase: 3.1/)
    expect(cli.stdout).toMatch(/last_task: T4.5/)
    expect(cli.stdout).toMatch(/key_decisions:/)
  })

  it('27. paused + checkpoint NO session_id → resumeHint mentions "fresh session" (D-04 fallback)', async () => {
    seedPausedWorkflow()
    seedCheckpoint({ session_id: undefined })
    const r = await runResume()
    expect(r.status).toBe('ok')
    if (r.status === 'ok') {
      expect(r.resumeHint).toMatch(/fresh session — context reloaded from checkpoint/)
    }
  })

  it('28. paused but checkpoint file missing → "corrupt" + CLI exit 1', async () => {
    seedPausedWorkflow(pathJoin(harnessedSubdir('checkpoints'), 'does-not-exist.json'))
    const r = await runResume()
    expect(r.status).toBe('corrupt')
    if (r.status === 'corrupt') expect(r.error).toMatch(/checkpoint missing/)
    const cli = await runCli(['resume'])
    expect(cli.code).toBe(1)
  })

  it('29. paused + checkpoint JSON corrupt → "corrupt" + CLI exit 1', async () => {
    seedPausedWorkflow()
    fsState.set(CP_PATH, '{not valid json')
    const r = await runResume()
    expect(r.status).toBe('corrupt')
    if (r.status === 'corrupt') expect(r.error).toMatch(/JSON parse failed/)
    const cli = await runCli(['resume'])
    expect(cli.code).toBe(1)
  })

  it('30. cwd mismatch → ok with cwdWarn + --json schema includes cwdWarn key', async () => {
    seedPausedWorkflow()
    seedCheckpoint({ cwd: '/some/other/repo' })
    const r = await runResume()
    expect(r.status).toBe('ok')
    if (r.status === 'ok') {
      expect(r.cwdWarn).toBeDefined()
      expect(r.cwdWarn).toMatch(/SDK session resume may fail/)
    }
    const cli = await runCli(['resume', '--json'])
    expect(cli.code).toBe(0)
    const payload = JSON.parse(cli.stdout) as { status: string; cwdWarn?: string }
    expect(payload.status).toBe('ok')
    expect(payload.cwdWarn).toBeDefined()
  })
})

// v5.0 Spec 1 (F) — resume evidence drift warn (warn, never block).
function seedPausedWithEvidence() {
  fsState.set(
    STATE_PATH,
    JSON.stringify({
      schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
      phase: '3.1',
      status: 'paused',
      last_checkpoint_path: CP_PATH,
      started_at: '2026-05-16T10:00:00.000Z',
      paused_at: '2026-05-16T11:00:00.000Z',
      sub_progress: [
        {
          sub: 'code',
          status: 'done',
          gate_fired: true,
          evidence_status: 'verified',
          evidence: [{ path: 'progress.md', sha256: 'abc1234deadbeef' }],
        },
        { sub: 'test', status: 'pending', gate_fired: true },
      ],
    }),
  )
}

describe('resume evidence drift (v5.0 Spec 1 F)', () => {
  beforeEach(() => detectDriftMock.mockReset())

  it('31. ledger evidence drift → runResume.ok carries driftWarn (warn, not block)', async () => {
    seedPausedWithEvidence()
    seedCheckpoint()
    detectDriftMock.mockResolvedValue([
      { path: 'progress.md', was: 'abc1234deadbeef', now: 'def5678cafef00d' },
    ])
    const r = await runResume()
    expect(r.status).toBe('ok') // drift never blocks
    if (r.status === 'ok') {
      expect(r.driftWarn).toBeDefined()
      expect(r.driftWarn?.join('\n')).toMatch(/⚠ drift: progress\.md sha256 changed/)
    }
    // detectDrift received the flattened evidence refs from the ledger.
    expect(detectDriftMock).toHaveBeenCalledWith([
      { path: 'progress.md', sha256: 'abc1234deadbeef' },
    ])
  })

  it('32. no drift → driftWarn absent', async () => {
    seedPausedWithEvidence()
    seedCheckpoint()
    detectDriftMock.mockResolvedValue([])
    const r = await runResume()
    expect(r.status).toBe('ok')
    if (r.status === 'ok') expect(r.driftWarn).toBeUndefined()
  })

  it('33. no ledger evidence → detectDrift not called, driftWarn absent', async () => {
    seedPausedWorkflow() // ledger-less paused workflow
    seedCheckpoint()
    const r = await runResume()
    expect(r.status).toBe('ok')
    if (r.status === 'ok') expect(r.driftWarn).toBeUndefined()
    expect(detectDriftMock).not.toHaveBeenCalled()
  })

  it('34. CLI prints drift warning to stderr', async () => {
    seedPausedWithEvidence()
    seedCheckpoint()
    detectDriftMock.mockResolvedValue([
      { path: 'progress.md', was: 'abc1234deadbeef', now: 'def5678cafef00d' },
    ])
    const cli = await runCli(['resume'])
    expect(cli.code).toBe(0)
    expect(cli.stderr).toMatch(/⚠ drift: progress\.md sha256 changed/)
  })
})

// G3 — recoveryActions wired into runResume ok result.
describe('resume recoveryActions (G3)', () => {
  beforeEach(() => detectDriftMock.mockReset())

  it('35. paused workflow with a pending sub → ok result carries recoveryActions with "run sub <name>"', async () => {
    // Seed a paused workflow whose ledger has one pending sub ('test').
    fsState.set(
      STATE_PATH,
      JSON.stringify({
        schemaVersion: SCHEMA_VERSIONS.currentWorkflow,
        phase: '3.1',
        status: 'paused',
        last_checkpoint_path: CP_PATH,
        started_at: '2026-05-16T10:00:00.000Z',
        paused_at: '2026-05-16T11:00:00.000Z',
        sub_progress: [{ sub: 'test', status: 'pending', gate_fired: true }],
      }),
    )
    seedCheckpoint()
    detectDriftMock.mockResolvedValue([])
    const r = await runResume()
    expect(r.status).toBe('ok')
    if (r.status === 'ok') {
      expect(r.recoveryActions).toContain('run sub test')
    }
  })
})
