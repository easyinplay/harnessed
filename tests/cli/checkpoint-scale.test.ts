// G1 integration test — verify_mode is written to the envelope after
// `checkpoint complete <sub>`.
//
// This suite uses REAL filesystem state (HARNESSED_ROOT_OVERRIDE temp dir) +
// real scale.ts + real state.ts, because we need to assert that `verify_mode`
// is actually persisted to the envelope.  engineHook and evidence are still
// mocked so we exercise only the G1 wire-in without touching real checkpoint
// files or requiring declared artifacts.
//
// Two determinism cases:
//
//   LARGE ledger — seed ≥5 fired subs so firedSubs > 4 forces 'full'
//   regardless of git signal.  Even if process.cwd() points at the harnessed
//   repo (which has git + a feature-branch diff) the firedSubs alone crosses
//   the threshold.
//
//   SMALL ledger — seed exactly 1 fired sub and spy process.cwd() to return
//   the empty temp dir (no git repo, no .planning/) so countChangedFiles and
//   countRequirements both fail-soft to 0.  firedSubs=1, changedFiles=0,
//   requirements=0 → assessScale yields 'light'.

import { mkdtempSync, rmSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// engineHook is mocked: we don't want real checkpoint file writes or date
// lookups; activatePhase must return a valid path shape.
vi.mock('../../src/checkpoint/engineHook.js', () => ({
  activatePhase: vi.fn(async () => ({ checkpointPath: '/fake/path/task-code.json' })),
  completePhase: vi.fn(async () => undefined),
}))

// evidence is mocked: no declared artifacts / no .planning/ sync check so the
// complete branch never hits the fail-closed block.
vi.mock('../../src/checkpoint/evidence.js', () => ({
  checkArtifacts: vi.fn(async () => ({ status: 'none_declared', found: [], missing: [] })),
  checkPlanningSync: vi.fn(async () => ({ status: 'verified', missing: [] })),
}))

// state.js is NOT mocked — we need the real writeCurrentWorkflow /
// readCurrentWorkflow so verify_mode is actually persisted.

import { type GatesPlan, seedLedger } from '../../src/checkpoint/ledger.js'
import { activate, mutateSubProgress, readCurrentWorkflow } from '../../src/checkpoint/state.js'
import { registerCheckpoint } from '../../src/cli/checkpoint.js'

// ---- tmpdir + HARNESSED_ROOT_OVERRIDE isolation ---------------------------
let tmp: string
let originalOverride: string | undefined

beforeEach(async () => {
  tmp = mkdtempSync(join(tmpdir(), 'ckpt-scale-'))
  originalOverride = process.env.HARNESSED_ROOT_OVERRIDE
  process.env.HARNESSED_ROOT_OVERRIDE = join(tmp, '.claude', 'harnessed')
  // Pre-create the root so the first read (inside withLock mkdir) is clean.
  await mkdir(join(tmp, '.claude', 'harnessed'), { recursive: true })
  vi.clearAllMocks()
})

afterEach(() => {
  if (originalOverride === undefined) delete process.env.HARNESSED_ROOT_OVERRIDE
  else process.env.HARNESSED_ROOT_OVERRIDE = originalOverride
  rmSync(tmp, { recursive: true, force: true })
  vi.restoreAllMocks()
})

// --------------------------------------------------------------------------
// CLI runner — mirrors the pattern from checkpoint.test.ts / checkpoint-
// complete-planning.test.ts but does NOT stub process.exit permanently;
// each call restores immediately so the next call starts fresh.
// --------------------------------------------------------------------------

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

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

/** Build a GatesPlan with `n` fired subs named sub-0 … sub-(n-1). */
function planWithNFired(n: number): GatesPlan {
  return {
    master: 'master',
    fire: Array.from({ length: n }, (_, i) => ({ sub: `sub-${i}`, order: i + 1 })),
    skip: [],
  }
}

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe('checkpoint complete — G1 verify_mode wire-in', () => {
  it('LARGE ledger (≥5 fired subs) → verify_mode === "full" after completing one sub', async () => {
    // Seed 5 fired subs so firedSubs > 4 regardless of git signal.
    // Even if process.cwd() points at the harnessed repo (which has a git
    // diff on this feature branch), firedSubs alone is enough to force 'full'.
    const plan = planWithNFired(5)
    await activate('master')
    await mutateSubProgress(() => seedLedger(plan))

    // Complete the first sub.
    const { code } = await runCli(['checkpoint', 'complete', 'sub-0'])
    expect(code).toBe(0)

    const envelope = await readCurrentWorkflow()
    expect(envelope).not.toBeNull()
    // G1 wire-in assertion: verify_mode must be persisted.
    expect(envelope?.verify_mode).toBe('full')
  }, 15_000)

  it('SMALL ledger (1 fired sub, no git in cwd) → verify_mode === "light" after completing the sub', async () => {
    // Point process.cwd() at the temp dir (no git repo, no .planning/) for the
    // ENTIRE flow. Two reasons: (1) collectScaleMetrics(process.cwd(), ...) sees
    // no-git → changedFiles=0, requirements=0; firedSubs=1 → assessScale 'light'.
    // (2) Phase 15 — state is keyed by repo-root(cwd); spying cwd only during
    // `complete` (as before) would split activate/seed (real cwd) from
    // complete/read (tmp cwd) into two slots. A real single CLI invocation runs
    // under one stable cwd, so the spy must wrap the whole sequence to match.
    const cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tmp)
    try {
      const plan = planWithNFired(1)
      await activate('master')
      await mutateSubProgress(() => seedLedger(plan))

      const { code } = await runCli(['checkpoint', 'complete', 'sub-0'])
      expect(code).toBe(0)

      const envelope = await readCurrentWorkflow()
      expect(envelope).not.toBeNull()
      // G1 wire-in assertion: verify_mode must be 'light'.
      expect(envelope?.verify_mode).toBe('light')
    } finally {
      cwdSpy.mockRestore()
    }
  }, 15_000)
})
