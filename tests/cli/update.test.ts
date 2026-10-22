// Phase 20 — `harnessed update` CLI unit tests (TDD). ALL spawning is mocked —
// the test NEVER runs `npm i -g`. Sister pattern: tests/cli/reject.test.ts
// (ExitError + runCli spy on process.exit/console).

import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import pkg from '../../package.json' with { type: 'json' }

// Mock npm spawning — assert the invocation, never actually install. execFile is
// included because version-check.ts promisifies it at module load.
// `exec` too: version-check.ts runs `npm view` through exec on Windows (a .cmd shim
// cannot be spawned shell-less since Node's CVE-2024-27980 fix), and a mock
// factory missing an export the module imports fails the whole file at load.
vi.mock('node:child_process', () => ({ execFileSync: vi.fn(), execFile: vi.fn(), exec: vi.fn() }))
// Control the published version; keep compareVersions real.
vi.mock('../../src/cli/lib/version-check.js', async (orig) => ({
  ...(await orig<typeof import('../../src/cli/lib/version-check.js')>()),
  fetchLatestVersion: vi.fn(),
}))
// Spy the upstream re-install; never run the real base profile.
vi.mock('../../src/cli/install-base.js', () => ({
  installBaseProfile: vi.fn(async () => ({
    installed: [],
    alreadyInstalled: [],
    skipped: [],
    failed: [],
  })),
}))
// 4.27.0 (B3 T2) — compiled-branch routing seams. isCompiledRuntime is spread-
// mocked (getAssetsRoot stays real for changelogTop); the binary engine is
// fully mocked (unit-tested separately in tests/cli/lib/selfUpdateBinary.test.ts).
vi.mock('../../src/platform/assetsRoot.js', async (orig) => ({
  ...(await orig<typeof import('../../src/platform/assetsRoot.js')>()),
  isCompiledRuntime: vi.fn(() => false),
}))
vi.mock('../../src/cli/lib/selfUpdateBinary.js', () => ({
  runBinarySelfUpdate: vi.fn(async () => ({ status: 'current', version: '0.0.0' })),
  runBinaryRollback: vi.fn(async () => ({ status: 'error', message: 'not under test' })),
  realSelfUpdateDeps: vi.fn(() => ({}) as never),
}))
// The 'updated' branch runs an opportunistic assets gc — mock it so the unit
// test never sweeps the REAL <stateRoot>/assets of the dev machine.
vi.mock('../../src/cli/gc.js', () => ({
  registerGc: vi.fn(),
  gcCompiledArtifacts: vi.fn(async () => ({ removed: [], kept: [] })),
}))

import { execFileSync } from 'node:child_process'
import { installBaseProfile } from '../../src/cli/install-base.js'
import { runBinaryRollback, runBinarySelfUpdate } from '../../src/cli/lib/selfUpdateBinary.js'
import { fetchLatestVersion } from '../../src/cli/lib/version-check.js'
import { registerUpdate } from '../../src/cli/update.js'
import { isCompiledRuntime } from '../../src/platform/assetsRoot.js'

class ExitError extends Error {
  constructor(public code: number) {
    super(`exit ${code}`)
  }
}

async function runCli(argv: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  let stdout = ''
  let stderr = ''
  const exit = vi.spyOn(process, 'exit').mockImplementation((c?: number | string | null) => {
    throw new ExitError(typeof c === 'number' ? c : 0)
  })
  const log = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
    stdout += `${a.map(String).join(' ')}\n`
  })
  const warn = vi.spyOn(console, 'warn').mockImplementation((...a: unknown[]) => {
    stderr += `${a.map(String).join(' ')}\n`
  })
  const program = new Command()
  program.exitOverride()
  registerUpdate(program)
  let code = 0
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
  } catch (e) {
    if (e instanceof ExitError) code = e.code
    else throw e
  } finally {
    exit.mockRestore()
    log.mockRestore()
    warn.mockRestore()
  }
  return { code, stdout, stderr }
}

describe('harnessed update', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(isCompiledRuntime).mockReturnValue(false)
    vi.stubEnv('HARNESSED_PLATFORM', 'claude')
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('--check reports installed/latest/status and does NOT install', async () => {
    vi.mocked(fetchLatestVersion).mockResolvedValue('99.0.0')
    const { stdout } = await runCli(['update', '--check'])
    expect(stdout).toContain(pkg.version)
    expect(stdout).toContain('99.0.0')
    expect(stdout.toLowerCase()).toContain('behind')
    expect(execFileSync).not.toHaveBeenCalled()
  })

  it('behind → runs `npm i -g harnessed@latest` + restart hint', async () => {
    vi.mocked(fetchLatestVersion).mockResolvedValue('99.0.0')
    const { stdout } = await runCli(['update'])
    expect(execFileSync).toHaveBeenCalled()
    const call = vi.mocked(execFileSync).mock.calls[0]
    expect(call?.[1]).toEqual(['i', '-g', 'harnessed@latest'])
    expect(stdout.toLowerCase()).toContain('restart')
  })

  it('current → does NOT install', async () => {
    vi.mocked(fetchLatestVersion).mockResolvedValue(pkg.version)
    const { stdout } = await runCli(['update'])
    expect(execFileSync).not.toHaveBeenCalled()
    expect(stdout.toLowerCase()).toContain('up to date')
  })

  it('--upstreams re-runs the base profile after self-update', async () => {
    vi.mocked(fetchLatestVersion).mockResolvedValue('99.0.0')
    await runCli(['update', '--upstreams'])
    expect(installBaseProfile).toHaveBeenCalled()
  })

  it('npm unreachable (fetch null) → no install, friendly message', async () => {
    vi.mocked(fetchLatestVersion).mockResolvedValue(null)
    const { stderr } = await runCli(['update'])
    expect(execFileSync).not.toHaveBeenCalled()
    expect(stderr.toLowerCase()).toContain('npm')
  })

  it('--migration-report prints a read-only inventory and does NOT install', async () => {
    const { stdout } = await runCli(['update', '--migration-report'])
    expect(stdout.toLowerCase()).toContain('migration report')
    expect(stdout.toLowerCase()).toContain('read-only')
    expect(execFileSync).not.toHaveBeenCalled()
    expect(fetchLatestVersion).not.toHaveBeenCalled() // no version check on this path
  })

  // ── 4.27.0 (B3 T2) — compiled branch routing ─────────────────────────────
  it('compiled runtime → binary engine runs, npm is NEVER touched (mode detection first)', async () => {
    vi.mocked(isCompiledRuntime).mockReturnValue(true)
    vi.mocked(runBinarySelfUpdate).mockResolvedValue({
      status: 'updated',
      from: '4.26.0',
      to: '4.27.0',
      bakPath: '/x/harnessed.bak-4.26.0',
      bakRemoved: true,
      backupDir: '/state/bin-backup/4.26.0',
    })
    const { stdout } = await runCli(['update'])
    expect(runBinarySelfUpdate).toHaveBeenCalled()
    expect(fetchLatestVersion).not.toHaveBeenCalled() // rev3 issue 4: before ANY npm touch
    expect(execFileSync).not.toHaveBeenCalled()
    expect(stdout).toContain('4.27.0')
  })

  it('compiled + refused (safety valve) → falls back to the npm flow', async () => {
    vi.mocked(isCompiledRuntime).mockReturnValue(true)
    vi.mocked(runBinarySelfUpdate).mockResolvedValue({
      status: 'refused',
      reason: 'binary lives under node_modules',
    })
    vi.mocked(fetchLatestVersion).mockResolvedValue(pkg.version)
    const { stdout } = await runCli(['update'])
    expect(fetchLatestVersion).toHaveBeenCalled()
    expect(stdout.toLowerCase()).toContain('up to date')
  })

  it('npm mode --dry-run → prints the npm command, installs nothing', async () => {
    vi.mocked(isCompiledRuntime).mockReturnValue(false)
    vi.mocked(fetchLatestVersion).mockResolvedValue('99.0.0')
    const { stdout } = await runCli(['update', '--dry-run'])
    expect(stdout).toContain('npm i -g harnessed@latest')
    expect(execFileSync).not.toHaveBeenCalled()
  })

  it('compiled update error → non-zero exit + manual-restore/npm guidance surfaced', async () => {
    vi.mocked(isCompiledRuntime).mockReturnValue(true)
    vi.mocked(runBinarySelfUpdate).mockResolvedValue({
      status: 'error',
      message: 'sha256 mismatch — aborted; original binary untouched',
    })
    const { code, stderr } = await runCli(['update'])
    expect(code).not.toBe(0)
    expect(stderr).toContain('sha256 mismatch')
  })

  describe.each([
    {
      platform: 'codex',
      updateHint:
        '[harnessed] restart Codex so the new version + hooks take effect. Manual rollback if needed: copy the binary back from the bin-backup dir above.',
      rollbackHint: '[harnessed] restart Codex so the restored version takes effect.',
      npmHint: '[harnessed] updated. Restart Codex so the new version + hooks take effect.',
    },
    {
      platform: 'claude',
      updateHint:
        '[harnessed] restart Claude Code so the new version + hooks take effect. Manual rollback if needed: copy the binary back from the bin-backup dir above.',
      rollbackHint: '[harnessed] restart Claude Code so the restored version takes effect.',
      npmHint: '[harnessed] updated. Restart Claude Code so the new version + hooks take effect.',
    },
  ])('$platform restart hints', ({ platform, updateHint, rollbackHint, npmHint }) => {
    beforeEach(() => vi.stubEnv('HARNESSED_PLATFORM', platform))

    it('compiled update names the active host and preserves the complete output', async () => {
      vi.mocked(isCompiledRuntime).mockReturnValue(true)
      vi.mocked(runBinarySelfUpdate).mockResolvedValue({
        status: 'updated',
        from: '4.43.0',
        to: '4.49.1',
        bakPath: '/x/harnessed.bak-4.43.0',
        bakRemoved: true,
        backupDir: '/state/bin-backup/4.43.0',
      })

      const { code, stdout, stderr } = await runCli(['update'])

      expect(code).toBe(0)
      expect(stderr).toBe('')
      expect(stdout).toBe(
        '[harnessed] updated 4.43.0 → 4.49.1.\n' +
          '  previous binary kept at: /state/bin-backup/4.43.0\n' +
          `${updateHint}\n`,
      )
      expect(fetchLatestVersion).not.toHaveBeenCalled()
      expect(execFileSync).not.toHaveBeenCalled()
    })

    it('rollback names the active host and preserves the complete output', async () => {
      vi.mocked(isCompiledRuntime).mockReturnValue(true)
      vi.mocked(runBinaryRollback).mockResolvedValue({
        status: 'rolled-back',
        from: '4.49.1',
        to: '4.43.0',
        backupUsed: '/state/bin-backup/4.43.0/harnessed',
      })

      const { code, stdout, stderr } = await runCli(['update', '--rollback'])

      expect(code).toBe(0)
      expect(stderr).toBe('')
      expect(stdout).toBe(
        '[harnessed] rolled back 4.49.1 → 4.43.0 (from /state/bin-backup/4.43.0/harnessed).\n' +
          `${rollbackHint}\n`,
      )
      expect(runBinaryRollback).toHaveBeenCalledWith({}, { version: undefined })
      expect(runBinarySelfUpdate).not.toHaveBeenCalled()
      expect(fetchLatestVersion).not.toHaveBeenCalled()
      expect(execFileSync).not.toHaveBeenCalled()
    })

    it('npm update names the active host and preserves the exact final line', async () => {
      vi.mocked(fetchLatestVersion).mockResolvedValue('99.0.0')

      const { code, stdout, stderr } = await runCli(['update'])

      expect(code).toBe(0)
      expect(stderr).toBe('')
      expect(stdout.split('\n').slice(-2).join('\n')).toBe(`${npmHint}\n`)
      expect(execFileSync).toHaveBeenCalledTimes(1)
      expect(vi.mocked(execFileSync).mock.calls[0]?.[1]).toEqual(['i', '-g', 'harnessed@latest'])
      expect(runBinarySelfUpdate).not.toHaveBeenCalled()
      expect(runBinaryRollback).not.toHaveBeenCalled()
    })
  })
})
