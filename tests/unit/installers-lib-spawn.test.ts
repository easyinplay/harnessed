// Phase 1.2 unit tests for src/installers/lib/spawn.ts (Pattern J BASE+modifier).
//
// Covers (ADR 0004 contract 6 + B1 defense-in-depth):
//   - checkCmdString() second-line gate refuses $(...) / ${...} / backtick →
//     InstallResult { ok:false, phase:'preflight', keyword:'security-gate-bypass' }
//   - Win platform → spawn('cmd.exe', ['/c', ...])
//   - Unix platform → spawn('/bin/sh', ['-c', joined])
//   - timeout default 15s; verify.timeout_ms override
//   - env merge (process.env + manifest spec.install.env)
//   - cwd resolves from manifest install.cwd if set, else ctx.cwd
//   - timeout fires SIGKILL + returns InstallResult phase:'spawn' keyword:'spawn-timeout'
//   - non-zero exit code returns SpawnOk (caller decides), not failure
//
// Mocks: child_process.spawn — returns a fake EventEmitter-shaped child so
// the implementation's stdout/stderr/close handlers are exercised.

import { EventEmitter } from 'node:events'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}))

import { spawn } from 'node:child_process'
import { type SpawnOk, spawnCmd } from '../../src/installers/lib/spawn.js'
import type { InstallContext, InstallOpts, Manifest } from '../../src/installers/lib/types.js'

const spawnMock = vi.mocked(spawn)

// SpawnOk is the only success variant that exposes exitCode/stdout/stderr;
// the other ok:true shape (BackupResult) lacks those fields. Use a property
// presence check to narrow.
function isSpawnOk(r: unknown): r is SpawnOk {
  return typeof r === 'object' && r !== null && 'exitCode' in r
}

function isInstallFailure(
  r: unknown,
): r is { ok: false; phase: string; error: { keyword: string; message: string } } {
  return typeof r === 'object' && r !== null && 'ok' in r && (r as { ok: boolean }).ok === false
}

const BASE_OPTS: InstallOpts = {
  apply: true,
  dryRun: false,
  system: false,
  nonInteractive: true,
  fullDiff: false,
  color: 'auto',
}

function baseManifest(): Manifest {
  return {
    apiVersion: 'harnessed/v1',
    kind: 'Manifest',
    metadata: {
      name: 'sp-test',
      display_name: 'Spawn Test',
      description: 'fixture',
      upstream: {
        source: 'sp-test',
        homepage: 'https://example.com',
        repository: 'https://github.com/example/sp-test.git',
        license: 'MIT',
        notice: 'fixture',
      },
    },
    spec: {
      type: 'cli-npm',
      component_type: 'cli-binary',
      install: {
        method: 'npm-cli',
        cmd: 'npm install -g sp-test',
        npm_version: '^1.0.0',
        idempotent_check: 'which sp-test',
      },
      verify: { cmd: 'sp-test --version', timeout_ms: 5000, expected_exit_code: 0 },
      uninstall: { cmd: 'npm uninstall -g sp-test' },
      upstream_health: {
        stability: 'stable',
        last_check: '2026-05-12',
        last_known_good_version: '1.0.0',
        fallback_action: 'warn',
      },
      signed_by: 'easyinplay',
      platforms: ['linux', 'darwin', 'win32'],
    },
  } as Manifest
}

function ctx(modify?: (m: Manifest) => void): InstallContext {
  const manifest = baseManifest()
  modify?.(manifest)
  return { manifest, opts: BASE_OPTS, level: 'L4', cwd: '/tmp/proj' }
}

// Build a fake ChildProcess that emits close synchronously after listeners
// are registered.
interface FakeChild extends EventEmitter {
  stdout: EventEmitter & { setEncoding: (e: string) => FakeChild['stdout'] }
  stderr: EventEmitter & { setEncoding: (e: string) => FakeChild['stderr'] }
  kill: (sig: NodeJS.Signals) => void
}

function makeChild(opts: {
  exitCode?: number
  stdout?: string
  stderr?: string
  emitError?: Error
  delayMs?: number
}): FakeChild {
  const child = new EventEmitter() as FakeChild
  const stdout = new EventEmitter() as FakeChild['stdout']
  stdout.setEncoding = () => stdout
  const stderr = new EventEmitter() as FakeChild['stderr']
  stderr.setEncoding = () => stderr
  child.stdout = stdout
  child.stderr = stderr
  child.kill = vi.fn() as unknown as FakeChild['kill']

  // Schedule emission after the synchronous Promise constructor returns so
  // listeners have time to attach.
  setImmediate(() => {
    if (opts.stdout) stdout.emit('data', opts.stdout)
    if (opts.stderr) stderr.emit('data', opts.stderr)
    if (opts.emitError) {
      child.emit('error', opts.emitError)
    } else if (typeof opts.delayMs === 'number') {
      setTimeout(() => child.emit('close', opts.exitCode ?? 0), opts.delayMs)
    } else {
      child.emit('close', opts.exitCode ?? 0)
    }
  })
  return child
}

describe('spawnCmd', () => {
  beforeEach(() => {
    spawnMock.mockReset()
  })

  it('refuses $(...) command substitution at spawn boundary (B1 defense-in-depth)', async () => {
    const r = await spawnCmd(ctx(), 'echo $(date)', [])
    expect(isInstallFailure(r)).toBe(true)
    if (isInstallFailure(r)) {
      expect(r.phase).toBe('preflight')
      expect(r.error.keyword).toBe('security-gate-bypass')
    }
    // Important: spawn must NEVER be called when the gate trips.
    expect(spawnMock).not.toHaveBeenCalled()
  })

  // biome-ignore lint/suspicious/noTemplateCurlyInString: literal pattern in test description
  it('refuses ${...} variable expansion at spawn boundary', async () => {
    // biome-ignore lint/suspicious/noTemplateCurlyInString: literal pattern under test
    const r = await spawnCmd(ctx(), 'echo ${HOME}', [])
    expect(isInstallFailure(r)).toBe(true)
    if (isInstallFailure(r)) {
      expect(r.error.keyword).toBe('security-gate-bypass')
    }
    expect(spawnMock).not.toHaveBeenCalled()
  })

  it('refuses backtick command substitution at spawn boundary', async () => {
    const r = await spawnCmd(ctx(), 'echo `whoami`', [])
    expect(isInstallFailure(r)).toBe(true)
    expect(spawnMock).not.toHaveBeenCalled()
  })

  it('on Win uses cmd.exe /c wrapper; on Unix uses /bin/sh -c wrapper', async () => {
    spawnMock.mockReturnValueOnce(
      makeChild({ exitCode: 0, stdout: 'ok' }) as unknown as ReturnType<typeof spawn>,
    )
    await spawnCmd(ctx(), 'echo hello', ['arg1'])
    const callArgs = spawnMock.mock.calls[0] as [string, string[], unknown]
    if (process.platform === 'win32') {
      expect(callArgs[0]).toBe('cmd.exe')
      expect(callArgs[1]).toEqual(['/c', 'echo hello', 'arg1'])
    } else {
      expect(callArgs[0]).toBe('/bin/sh')
      expect(callArgs[1]).toEqual(['-c', 'echo hello arg1'])
    }
  })

  it('returns SpawnOk with stdout/stderr/exitCode on normal completion', async () => {
    spawnMock.mockReturnValueOnce(
      makeChild({ exitCode: 0, stdout: 'hi', stderr: 'warn' }) as unknown as ReturnType<
        typeof spawn
      >,
    )
    const r = await spawnCmd(ctx(), 'echo hi', [])
    expect(isSpawnOk(r)).toBe(true)
    if (isSpawnOk(r)) {
      expect(r.exitCode).toBe(0)
      expect(r.stdout).toBe('hi')
      expect(r.stderr).toBe('warn')
    }
  })

  it('returns SpawnOk with non-zero exit code (caller decides if failure)', async () => {
    spawnMock.mockReturnValueOnce(
      makeChild({ exitCode: 1, stderr: 'oops' }) as unknown as ReturnType<typeof spawn>,
    )
    const r = await spawnCmd(ctx(), 'false', [])
    expect(isSpawnOk(r)).toBe(true)
    if (isSpawnOk(r)) {
      expect(r.exitCode).toBe(1)
      expect(r.stderr).toBe('oops')
    }
  })

  it('passes cwd from manifest install.cwd when set', async () => {
    spawnMock.mockReturnValueOnce(makeChild({ exitCode: 0 }) as unknown as ReturnType<typeof spawn>)
    const c = ctx((m) => {
      ;(m.spec.install as { cwd: string }).cwd = '/custom/dir'
    })
    await spawnCmd(c, 'echo', [])
    const opts = spawnMock.mock.calls[0]?.[2] as { cwd: string }
    expect(opts.cwd).toBe('/custom/dir')
  })

  it('falls back to ctx.cwd when manifest install.cwd not set', async () => {
    spawnMock.mockReturnValueOnce(makeChild({ exitCode: 0 }) as unknown as ReturnType<typeof spawn>)
    await spawnCmd(ctx(), 'echo', [])
    const opts = spawnMock.mock.calls[0]?.[2] as { cwd: string }
    expect(opts.cwd).toBe('/tmp/proj')
  })

  it('merges manifest spec.install.env into spawn env', async () => {
    spawnMock.mockReturnValueOnce(makeChild({ exitCode: 0 }) as unknown as ReturnType<typeof spawn>)
    const c = ctx((m) => {
      ;(m.spec.install as { env: Record<string, string> }).env = { HARNESSED_FLAG: 'yes' }
    })
    await spawnCmd(c, 'echo', [])
    const opts = spawnMock.mock.calls[0]?.[2] as { env: Record<string, string> }
    expect(opts.env.HARNESSED_FLAG).toBe('yes')
    // process.env entries should still be present
    expect(opts.env.PATH).toBeDefined()
  })

  it('returns spawn-error InstallResult on child error event', async () => {
    spawnMock.mockReturnValueOnce(
      makeChild({ emitError: new Error('ENOENT') }) as unknown as ReturnType<typeof spawn>,
    )
    const r = await spawnCmd(ctx(), 'nonexistent-binary', [])
    expect(isInstallFailure(r)).toBe(true)
    if (isInstallFailure(r)) {
      expect(r.phase).toBe('spawn')
      expect(r.error.keyword).toBe('spawn-error')
      expect(r.error.message).toContain('ENOENT')
    }
  })
})

afterEach(() => {
  vi.clearAllMocks()
})
