// 4.22.1 T2 — `checkpoint start` step-0 skeleton warning (TDD red-first).
//
// Dogfood (first compliant /auto run): the model skipped the step-0 skeleton, so
// `.planning/STATE.md` never existed and the complete-side planning-sync gate
// fail-closed blocked — correct but LATE. This warns at start time (stderr, never
// stdout — JSON consumers), fail-soft, and stays silent for non-GSD users (no
// .planning/ at all) and for complete skeletons.
//
// Same harness family as checkpoint-intent.test.ts: real state layer against a
// tmp HARNESSED_ROOT_OVERRIDE, engineHook mocked, cwd chdir'd into a tmp project.

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/checkpoint/engineHook.js', () => ({
  activatePhase: vi.fn(async () => ({ checkpointPath: '/fake/cp.json' })),
  completePhase: vi.fn(async () => undefined),
}))

// 4.22.1 T2b — force the dual-guard detection deterministically (real deps read
// host settings/plugins → host-dependent). New module, no factory-mock siblings.
const gateGuardActive = vi.hoisted(() => ({ value: false }))
vi.mock('../../src/cli/lib/check-guard-conflict.js', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../src/cli/lib/check-guard-conflict.js')>()
  return {
    ...orig,
    detectGateGuardActive: vi.fn(async () =>
      gateGuardActive.value
        ? { active: true, source: 'settings-hooks' }
        : { active: false, source: null },
    ),
  }
})

// 4.22.2 — control the exemption flow's yml discovery (real fs for everything
// else so apply/no-apply is observable on disk). 'project' resolves to the
// per-test tmp cwd at CALL time (chdir happens in beforeEach).
const ymlMode = vi.hoisted(() => ({ value: 'none' as 'none' | 'project' }))
vi.mock('../../src/cli/lib/guard-exemption.js', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../src/cli/lib/guard-exemption.js')>()
  const { join: joinPath } = await import('node:path')
  return {
    ...orig,
    findGateguardYml: vi.fn(async () =>
      ymlMode.value === 'project' ? joinPath(process.cwd(), '.gateguard.yml') : null,
    ),
  }
})

import { registerCheckpoint } from '../../src/cli/checkpoint.js'

class ExitError extends Error {
  constructor(public code: number) {
    super(`process.exit(${code})`)
  }
}

async function runCli(argv: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
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
  const warn = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
    stderr += `${args.map(String).join(' ')}\n`
  })
  const program = new Command().exitOverride()
  registerCheckpoint(program)
  let code = 0
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
  } catch (e) {
    if (e instanceof ExitError) code = e.code
    else {
      code = 1
      stderr += `${(e as Error).message}\n`
    }
  } finally {
    exit.mockRestore()
    log.mockRestore()
    err.mockRestore()
    warn.mockRestore()
  }
  return { code, stdout, stderr }
}

let stateRoot: string
let projectDir: string
let prevCwd: string

beforeEach(() => {
  stateRoot = mkdtempSync(join(tmpdir(), 'harnessed-skel-state-'))
  projectDir = mkdtempSync(join(tmpdir(), 'harnessed-skel-proj-'))
  process.env.HARNESSED_ROOT_OVERRIDE = stateRoot
  prevCwd = process.cwd()
  process.chdir(projectDir)
})
afterEach(() => {
  process.chdir(prevCwd)
  delete process.env.HARNESSED_ROOT_OVERRIDE
  rmSync(stateRoot, { recursive: true, force: true })
  rmSync(projectDir, { recursive: true, force: true })
})

describe('checkpoint start — step-0 skeleton warning (4.22.1)', () => {
  it('warns on stderr when .planning/ exists without STATE.md / ROADMAP.md', async () => {
    mkdirSync(join(projectDir, '.planning'), { recursive: true })
    const { code, stdout, stderr } = await runCli(['checkpoint', 'start', 'auto'])
    expect(code).toBe(0)
    expect(stderr).toMatch(/step 0/i)
    // stdout stays clean of the warning (JSON/plain consumers).
    expect(stdout).not.toMatch(/step 0/i)
  })

  it('stays silent when the skeleton is complete', async () => {
    const p = join(projectDir, '.planning')
    mkdirSync(p, { recursive: true })
    writeFileSync(join(p, 'STATE.md'), '# state\n', 'utf8')
    writeFileSync(join(p, 'ROADMAP.md'), '# roadmap\n', 'utf8')
    const { code, stderr } = await runCli(['checkpoint', 'start', 'auto'])
    expect(code).toBe(0)
    expect(stderr).not.toMatch(/step 0/i)
  })

  it('stays silent when there is no .planning/ at all (non-GSD user)', async () => {
    const { code, stderr } = await runCli(['checkpoint', 'start', 'auto'])
    expect(code).toBe(0)
    expect(stderr).not.toMatch(/step 0/i)
  })
})

describe('checkpoint start — dual-guard (GateGuard) conflict warning (4.22.1 T2b)', () => {
  it('warns on stderr when GateGuard is detected active', async () => {
    gateGuardActive.value = true
    try {
      const { code, stdout, stderr } = await runCli(['checkpoint', 'start', 'auto'])
      expect(code).toBe(0)
      expect(stderr).toMatch(/GateGuard/)
      expect(stderr).toMatch(/\.planning\//) // 三选一 advice, exemption first
      expect(stdout).not.toMatch(/GateGuard/)
    } finally {
      gateGuardActive.value = false
    }
  })

  it('stays silent when GateGuard is not detected', async () => {
    const { code, stderr } = await runCli(['checkpoint', 'start', 'auto'])
    expect(code).toBe(0)
    expect(stderr).not.toMatch(/GateGuard/)
  })
})

describe('checkpoint start — GateGuard exemption flow (4.22.2)', () => {
  it('active + unexempt .gateguard.yml (non-TTY) → preview + manual-cmd advice, file untouched', async () => {
    gateGuardActive.value = true
    ymlMode.value = 'project'
    const yml = join(projectDir, '.gateguard.yml')
    writeFileSync(yml, 'enabled: true\nignore_paths:\n  - ".venv/**"\n', 'utf8')
    try {
      const { code, stderr } = await runCli(['checkpoint', 'start', 'auto'])
      expect(code).toBe(0)
      expect(stderr).toContain('+   - ".planning/**"') // exact diff preview
      expect(stderr).toContain('exempt-gateguard') // non-interactive manual advice
      // never mutated without live consent (non-TTY vitest run)
      expect(readFileSync(yml, 'utf8')).not.toContain('.planning/**')
    } finally {
      gateGuardActive.value = false
      ymlMode.value = 'none'
    }
  })

  it('active + already-exempt yml → resolved, no collision warning', async () => {
    gateGuardActive.value = true
    ymlMode.value = 'project'
    writeFileSync(join(projectDir, '.gateguard.yml'), 'ignore_paths:\n  - ".planning/**"\n', 'utf8')
    try {
      const { code, stderr } = await runCli(['checkpoint', 'start', 'auto'])
      expect(code).toBe(0)
      expect(stderr).not.toMatch(/collides/)
      expect(stderr).not.toContain('+   - ".planning/**"')
    } finally {
      gateGuardActive.value = false
      ymlMode.value = 'none'
    }
  })

  it('active + no yml (bundled/unknown variant) → the 4.22.1 generic warning stands', async () => {
    gateGuardActive.value = true
    try {
      const { code, stderr } = await runCli(['checkpoint', 'start', 'auto'])
      expect(code).toBe(0)
      expect(stderr).toMatch(/collides/)
    } finally {
      gateGuardActive.value = false
    }
  })
})
