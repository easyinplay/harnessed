// Phase 20 — `harnessed update` CLI unit tests (TDD). ALL spawning is mocked —
// the test NEVER runs `npm i -g`. Sister pattern: tests/cli/reject.test.ts
// (ExitError + runCli spy on process.exit/console).

import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import pkg from '../../package.json' with { type: 'json' }

// Mock npm spawning — assert the invocation, never actually install. execFile is
// included because version-check.ts promisifies it at module load.
// `exec` too: version-check.ts runs `npm view` through exec on Windows (a .cmd shim
// cannot be spawned shell-less since Node's CVE-2024-27980 fix), and a mock
// factory missing an export the module imports fails the whole file at load.
vi.mock('node:child_process', () => ({
  execFileSync: vi.fn(),
  execFile: vi.fn(),
  exec: vi.fn(),
  spawn: vi.fn(),
  spawnSync: vi.fn(),
}))
vi.mock('../../src/installers/lib/idempotent.js', () => ({
  isAlreadyInstalled: vi.fn(async () => false),
}))
vi.mock('../../src/installers/lib/skillRuntime.js', () => ({
  observeGsdRuntimeIdentity: vi.fn(async () => ({
    kind: 'not-installed',
    reasonCode: 'runtime-missing',
  })),
}))
vi.mock('../../src/installers/lib/spawn.js', () => ({ spawnCmd: vi.fn() }))
vi.mock('../../src/cli/lib/packageUpdateTarget.js', async (original) => ({
  ...(await original<typeof import('../../src/cli/lib/packageUpdateTarget.js')>()),
  preparePackageUpdate: vi.fn(),
}))
// Control the published version; keep compareVersions real.
vi.mock('../../src/cli/lib/version-check.js', async (orig) => ({
  ...(await orig<typeof import('../../src/cli/lib/version-check.js')>()),
  fetchLatestNpmVersion: vi.fn(),
  fetchLatestBunVersion: vi.fn(),
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
  finalizeBinarySelfUpdate: vi.fn(async () => true),
}))
// The 'updated' branch runs an opportunistic assets gc — mock it so the unit
// test never sweeps the REAL <stateRoot>/assets of the dev machine.
vi.mock('../../src/cli/gc.js', () => ({
  registerGc: vi.fn(),
  gcCompiledArtifacts: vi.fn(async () => ({ removed: [], kept: [] })),
}))

import { execFileSync, spawn } from 'node:child_process'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { gcCompiledArtifacts } from '../../src/cli/gc.js'
import { installBaseProfile } from '../../src/cli/install-base.js'
import { preparePackageUpdate } from '../../src/cli/lib/packageUpdateTarget.js'
import {
  finalizeBinarySelfUpdate,
  realSelfUpdateDeps,
  runBinaryRollback,
  runBinarySelfUpdate,
} from '../../src/cli/lib/selfUpdateBinary.js'
import { acquireUpdateLock } from '../../src/cli/lib/updateLock.js'
import {
  fetchLatestBunVersion,
  fetchLatestNpmVersion,
  fetchLatestVersion,
} from '../../src/cli/lib/version-check.js'
import { registerUpdate } from '../../src/cli/update.js'
import { setLocale } from '../../src/i18n/index.js'
import { isCompiledRuntime } from '../../src/platform/assetsRoot.js'

class ExitError extends Error {
  constructor(public code: number) {
    super(`exit ${code}`)
  }
}

async function runCli(argv: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  const previousExitCode = process.exitCode
  process.exitCode = undefined
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
  program.option('--lang <locale>').option('--verbose')
  program.exitOverride()
  program.configureOutput({
    writeErr: (str) => {
      stderr += str
    },
  })
  registerUpdate(program)
  let code = 0
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
    code = Number(process.exitCode ?? 0)
  } catch (e) {
    if (e instanceof ExitError) code = e.code
    else throw e
  } finally {
    exit.mockRestore()
    log.mockRestore()
    warn.mockRestore()
    process.exitCode = previousExitCode
  }
  return { code, stdout, stderr }
}

describe('harnessed update', () => {
  it('ordinary human update cannot bypass a JSON updater target lock', async () => {
    const target = process.argv[1]
    if (!target) throw new Error('fixture entry missing')
    const locked = await acquireUpdateLock({ stateRoot: 'unused-json-host', target })
    if (locked.status !== 'acquired') throw new Error('fixture lock missing')
    try {
      vi.mocked(fetchLatestNpmVersion).mockResolvedValue('99.0.0')
      const result = await runCli(['update'])
      expect(result.code).toBe(1)
      expect(result.stderr).toContain('Another update owns this executable target')
      expect(execFileSync).not.toHaveBeenCalled()
      expect(fetchLatestNpmVersion).not.toHaveBeenCalled()
    } finally {
      await locked.lock.release()
    }
  })

  it.each([
    ['update'],
    ['update', '--rollback'],
    ['update', '--rollback', '--non-interactive'],
  ])('compiled human %j cannot bypass the same target lock', async (...args) => {
    vi.mocked(isCompiledRuntime).mockReturnValue(true)
    const locked = await acquireUpdateLock({
      stateRoot: 'unused-json-host',
      target: process.execPath,
    })
    if (locked.status !== 'acquired') throw new Error('fixture lock missing')
    try {
      const result = await runCli(args)
      expect(result.code).toBe(1)
      expect(result.stderr).toContain('Another update owns this executable target')
      expect(runBinarySelfUpdate).not.toHaveBeenCalled()
      expect(runBinaryRollback).not.toHaveBeenCalled()
    } finally {
      await locked.lock.release()
    }
  })
  const originalBun = Object.getOwnPropertyDescriptor(process.versions, 'bun')
  const useBun = () =>
    Object.defineProperty(process.versions, 'bun', {
      configurable: true,
      value: '1.4.4',
    })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('unexpected direct registry fetch')
      }),
    )
    vi.mocked(isCompiledRuntime).mockReturnValue(false)
    vi.mocked(execFileSync).mockReturnValue(`${pkg.version}\n`)
    vi.mocked(preparePackageUpdate).mockImplementation((manager) =>
      manager === 'bun'
        ? { ok: false, reasonCode: 'package-target-unproven', message: 'Bun target unproven' }
        : {
            ok: true,
            command: '/fixed/npm',
            args: ['i', '-g', '--prefix', '/fixed/prefix', 'harnessed@latest'],
            options: {
              cwd: '/fixed/cwd',
              env: {},
              shell: false,
              windowsHide: true,
              windowsVerbatimArguments: false,
            },
          },
    )
    vi.mocked(spawn).mockImplementation((_file, args) => {
      const child = Object.assign(new EventEmitter(), { stdout: new PassThrough(), kill: vi.fn() })
      const payload = (args as string[]).at(-1) ?? ''
      const continuation = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
      queueMicrotask(() => {
        child.stdout.end(
          `${JSON.stringify({ schemaVersion: 1, operation: 'update', mode: 'apply', host: continuation.host, runtime: continuation.runtime, status: 'complete', components: [{ id: 'gsd', status: 'not-installed', before: null, target: null, after: null, reasonCode: 'runtime-missing', verified: false, restartRequired: false }], warnings: [], error: null })}\n`,
        )
        child.emit('close', 0, null)
      })
      return child as unknown as ReturnType<typeof spawn>
    })
    vi.stubEnv('HARNESSED_PLATFORM', 'claude')
  })
  afterEach(() => {
    setLocale('en')
    if (originalBun) Object.defineProperty(process.versions, 'bun', originalBun)
    else Reflect.deleteProperty(process.versions, 'bun')
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it.each([
    'en',
    'zh-CN',
  ])('captures explicit global --lang %s without copying unrelated globals', async (lang) => {
    vi.stubEnv('HARNESSED_LANG', lang === 'en' ? 'zh-Hans' : 'en')
    vi.mocked(fetchLatestNpmVersion).mockResolvedValue(pkg.version)
    const result = await runCli(['--lang', lang, '--verbose', 'update', '--all', '--json'])
    expect(result.code).toBe(0)
    const args = vi.mocked(spawn).mock.calls[0]?.[1] as string[]
    const payload = JSON.parse(Buffer.from(args.at(-1) ?? '', 'base64url').toString('utf8'))
    const canonical = lang === 'en' ? 'en' : 'zh-Hans'
    expect(payload.lang).toBe(canonical)
    expect(args.slice(1, 4)).toEqual(['--lang', canonical, 'update'])
    expect(payload).not.toHaveProperty('verbose')
  })

  it.each([
    ['--json'],
    ['--json', '--check'],
    ['--json', '--dry-run'],
    ['--rollback'],
  ])('compiled explicit host uses captured Codex root with %j', async (...flags) => {
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '')
    vi.mocked(isCompiledRuntime).mockReturnValue(true)
    vi.mocked(runBinarySelfUpdate).mockResolvedValue({ status: 'current', version: pkg.version })
    vi.mocked(runBinaryRollback).mockResolvedValue({
      status: 'rolled-back',
      from: '5.0.5',
      to: '5.0.4',
      backupUsed: '/fixture/backup',
    })
    const result = await runCli(['update', '--platform', 'codex', ...flags])
    expect(result.code).toBe(0)
    expect(realSelfUpdateDeps).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        hostId: 'codex',
        platform: expect.objectContaining({ stateRoot: join(homedir(), '.codex', 'harnessed') }),
      }),
    )
    if (flags.includes('--rollback')) expect(result.stdout).toContain('restart Codex')
  })

  it('legacy compiled GC uses the same captured root despite ambient changes during swap', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '/captured/state')
    const capturedStateRoot = join(homedir(), '.codex', 'harnessed')
    vi.mocked(isCompiledRuntime).mockReturnValue(true)
    vi.mocked(runBinarySelfUpdate).mockImplementationOnce(async () => {
      vi.stubEnv('HARNESSED_PLATFORM', 'claude')
      vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '/changed/state')
      return {
        status: 'updated',
        from: '5.0.4',
        to: '5.0.5',
        bakPath: '/fixture/bak',
        bakRemoved: true,
        backupDir: join(capturedStateRoot, 'bin-backup', '5.0.4'),
      }
    })
    const result = await runCli(['update'])
    expect(result.code).toBe(0)
    expect(realSelfUpdateDeps).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        hostId: 'codex',
        platform: expect.objectContaining({ stateRoot: capturedStateRoot }),
      }),
    )
    expect(gcCompiledArtifacts).toHaveBeenCalledWith({
      keepVersions: ['5.0.4', '5.0.5'],
      stateRoot: capturedStateRoot,
      execPath: null,
    })
    expect(result.stdout).toContain('restart Codex')
  })

  it('accepts exactly the explicit npm/bun package-manager choices', async () => {
    const program = new Command()
    registerUpdate(program)
    const option = program.commands[0]?.options.find((o) => o.long === '--package-manager')
    expect(option?.argChoices).toEqual(['npm', 'bun'])
    await expect(runCli(['update', '--package-manager', 'pnpm'])).rejects.toMatchObject({
      code: 'commander.invalidArgument',
    })
  })

  it('finalizes a retained compiled backup only after successful P2 closure', async () => {
    vi.mocked(isCompiledRuntime).mockReturnValue(true)
    const outcome = {
      status: 'updated',
      from: '5.0.4',
      to: pkg.version,
      bakPath: '/fixture/harnessed.bak',
      bakRemoved: false,
      backupDir: '/fixture/banked',
    } as const
    vi.mocked(runBinarySelfUpdate).mockResolvedValue(outcome)
    const result = await runCli(['update', '--all', '--json'])
    expect(result.code).toBe(0)
    expect(finalizeBinarySelfUpdate).toHaveBeenCalledExactlyOnceWith(expect.anything(), outcome)
    expect(vi.mocked(finalizeBinarySelfUpdate).mock.invocationCallOrder[0]).toBeGreaterThan(
      vi.mocked(spawn).mock.invocationCallOrder[0] ?? 0,
    )
    expect(runBinarySelfUpdate).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ retainBackupForContinuation: true }),
    )
  })

  it.each([
    'spawn-failed',
    'partial',
    'malformed',
    'identity-mismatch',
  ])('keeps the retained .bak when P2 is %s', async (failure) => {
    vi.mocked(isCompiledRuntime).mockReturnValue(true)
    vi.mocked(runBinarySelfUpdate).mockResolvedValue({
      status: 'updated',
      from: '5.0.4',
      to: pkg.version,
      bakPath: '/fixture/harnessed.bak',
      bakRemoved: false,
      backupDir: '/fixture/banked',
    })
    if (failure === 'identity-mismatch') vi.mocked(execFileSync).mockReturnValue('99.0.0\n')
    vi.mocked(spawn).mockImplementation((_file, args) => {
      if (failure === 'spawn-failed') throw new Error('fixture spawn failed')
      const child = Object.assign(new EventEmitter(), { stdout: new PassThrough(), kill: vi.fn() })
      const continuation = JSON.parse(
        Buffer.from((args as string[]).at(-1) ?? '', 'base64url').toString('utf8'),
      )
      queueMicrotask(() => {
        child.stdout.end(
          failure === 'malformed'
            ? 'invalid'
            : JSON.stringify({
                schemaVersion: 1,
                operation: 'update',
                mode: 'apply',
                host: continuation.host,
                runtime: continuation.runtime,
                status: 'partial',
                components: [{ id: 'gsd', status: 'retained' }],
                warnings: [],
                error: null,
              }),
        )
        child.emit('close', 1, null)
      })
      return child as unknown as ReturnType<typeof spawn>
    })
    const result = await runCli(['update', '--all', '--json'])
    expect(result.code).not.toBe(0)
    expect(finalizeBinarySelfUpdate).not.toHaveBeenCalled()
  })

  it('explicit npm applies only the bound executable and prefix with the npm version runner', async () => {
    vi.mocked(fetchLatestNpmVersion).mockResolvedValue('99.0.0')
    await runCli(['update', '--package-manager', 'npm'])
    expect(fetchLatestBunVersion).not.toHaveBeenCalled()
    expect(vi.mocked(execFileSync).mock.calls[0]?.slice(0, 2)).toEqual([
      '/fixed/npm',
      ['i', '-g', '--prefix', '/fixed/prefix', 'harnessed@latest'],
    ])
  })

  describe.each([
    [],
    ['--all', '--json'],
  ] as string[][])('package target guard with flags %j', (...flags) => {
    it.each([
      'package-target-unproven',
      'package-target-mismatch',
      'package-layout-unsupported',
    ] as const)('refuses %s without installer, P2 or upstream mutation', async (reasonCode) => {
      vi.mocked(fetchLatestNpmVersion).mockResolvedValue('99.0.0')
      vi.mocked(preparePackageUpdate).mockReturnValue({
        ok: false,
        reasonCode,
        message: 'fixture refused target',
      })
      const result = await runCli(['update', ...flags])
      expect(result.code).toBe(1)
      if (flags.includes('--json'))
        expect(JSON.parse(result.stdout).components).toEqual([
          expect.objectContaining({
            id: 'harnessed',
            status: 'failed',
            reasonCode,
            verified: false,
            after: pkg.version,
          }),
        ])
      else expect(result.stderr).toContain(reasonCode)
      expect(preparePackageUpdate).toHaveBeenCalledWith('npm', {
        entryPath: expect.any(String),
        targetKey: expect.stringMatching(/^[a-f0-9]{64}$/),
      })
      expect(execFileSync).not.toHaveBeenCalled()
      expect(spawn).not.toHaveBeenCalled()
      expect(installBaseProfile).not.toHaveBeenCalled()
    })
  })

  it('Bun runtime with explicit npm and a custom registry uses only the npm query', async () => {
    useBun()
    vi.stubEnv('npm_config_registry', 'https://registry.fixture.invalid/private/')
    vi.mocked(fetchLatestNpmVersion).mockResolvedValue('99.0.0')
    vi.mocked(fetchLatestBunVersion).mockResolvedValue('1.0.0')
    vi.mocked(fetchLatestVersion).mockResolvedValue('1.0.0')
    const { code, stdout } = await runCli(['update', '--package-manager', 'npm', '--check'])
    expect(code).toBe(0)
    expect(stdout).toContain('99.0.0')
    expect(stdout).toContain('behind')
    expect(fetchLatestNpmVersion).toHaveBeenCalledTimes(1)
    expect(fetchLatestBunVersion).not.toHaveBeenCalled()
    expect(fetchLatestVersion).not.toHaveBeenCalled()
    expect(execFileSync).not.toHaveBeenCalled()
  })

  it('Bun query failure is transparent and never installs or falls back to npm', async () => {
    vi.mocked(fetchLatestBunVersion).mockResolvedValue(null)
    const { code, stderr } = await runCli(['update', '--package-manager', 'bun'])
    expect(code).toBe(0)
    expect(stderr).toContain('bun info')
    expect(stderr).toContain('no update performed')
    expect(fetchLatestNpmVersion).not.toHaveBeenCalled()
    expect(execFileSync).not.toHaveBeenCalled()
    expect(installBaseProfile).not.toHaveBeenCalled()
  })

  it('Node refuses unproven Bun apply without installing or falling back to npm', async () => {
    vi.mocked(fetchLatestBunVersion).mockResolvedValue('99.0.0')
    const { code, stderr } = await runCli(['update', '--package-manager', 'bun'])
    expect(code).toBe(1)
    expect(stderr).toContain('package-target-unproven')
    expect(fetchLatestNpmVersion).not.toHaveBeenCalled()
    expect(execFileSync).not.toHaveBeenCalled()
    expect(spawn).not.toHaveBeenCalled()
  })

  it('Bun runtime refuses unproven Bun apply before P2 or any third-party update', async () => {
    useBun()
    vi.mocked(fetchLatestBunVersion).mockResolvedValue('99.0.0')
    const result = await runCli(['update', '--package-manager', 'bun', '--all', '--json'])
    expect(result.code).toBe(1)
    expect(JSON.parse(result.stdout).components).toEqual([
      expect.objectContaining({
        status: 'failed',
        verified: false,
        reasonCode: 'package-target-unproven',
      }),
    ])
    expect(fetchLatestNpmVersion).not.toHaveBeenCalled()
    expect(execFileSync).not.toHaveBeenCalled()
    expect(spawn).not.toHaveBeenCalled()
    expect(installBaseProfile).not.toHaveBeenCalled()
  })

  it.each([
    'npm',
    'bun',
  ] as const)('current %s package apply does not require target proof', async (manager) => {
    vi.mocked(manager === 'npm' ? fetchLatestNpmVersion : fetchLatestBunVersion).mockResolvedValue(
      pkg.version,
    )
    const result = await runCli(['update', '--json', '--package-manager', manager])
    expect(result.code).toBe(0)
    expect(JSON.parse(result.stdout).components[0]).toMatchObject({
      status: 'current',
      verified: true,
    })
    expect(preparePackageUpdate).not.toHaveBeenCalled()
    expect(execFileSync).not.toHaveBeenCalled()
  })

  it.each([
    '--check',
    '--dry-run',
  ])('explicit Bun %s is read-only, including --all', async (flag) => {
    vi.mocked(fetchLatestBunVersion).mockResolvedValue('99.0.0')
    const { code, stdout } = await runCli(['update', '--package-manager', 'bun', flag, '--all'])
    expect(code).toBe(0)
    expect(execFileSync).not.toHaveBeenCalled()
    expect(installBaseProfile).not.toHaveBeenCalled()
    expect(preparePackageUpdate).not.toHaveBeenCalled()
    if (flag === '--dry-run') expect(stdout).toContain('bun add --global harnessed@latest')
    else expect(stdout).toContain('99.0.0')
  })

  describe.each(['Node', 'Bun'])('%s runtime upstream safety', (runtime) => {
    beforeEach(() => {
      if (runtime === 'Bun') useBun()
      else Reflect.deleteProperty(process.versions, 'bun')
    })

    describe.each([
      { label: 'default npm', manager: 'npm', args: [] },
      { label: 'explicit npm', manager: 'npm', args: ['--package-manager', 'npm'] },
      { label: 'explicit Bun', manager: 'bun', args: ['--package-manager', 'bun'] },
    ])('$label', ({ manager, args }) => {
      const selectedQuery = manager === 'bun' ? fetchLatestBunVersion : fetchLatestNpmVersion
      const otherQuery = manager === 'bun' ? fetchLatestNpmVersion : fetchLatestBunVersion

      it.each([
        { status: 'current', latest: pkg.version, flag: '--upstreams' },
        { status: 'current', latest: pkg.version, flag: '--all' },
        { status: 'ahead', latest: '0.0.0', flag: '--upstreams' },
        { status: 'ahead', latest: '0.0.0', flag: '--all' },
      ])('$status --dry-run $flag never installs', async ({ latest, flag }) => {
        vi.mocked(selectedQuery).mockResolvedValue(latest)

        const { code, stdout } = await runCli(['update', ...args, '--dry-run', flag])

        expect(code).toBe(0)
        expect(selectedQuery).toHaveBeenCalledTimes(1)
        expect(otherQuery).not.toHaveBeenCalled()
        expect(fetchLatestVersion).not.toHaveBeenCalled()
        expect(execFileSync).not.toHaveBeenCalled()
        expect(runBinarySelfUpdate).not.toHaveBeenCalled()
        expect(runBinaryRollback).not.toHaveBeenCalled()
        expect(installBaseProfile).not.toHaveBeenCalled()
        expect(stdout).toContain('nothing installed')
      })

      it.each([
        '--upstreams',
        '--all',
      ])('current %s delegates to absolute fresh P2 without installing missing upstreams', async (flag) => {
        vi.mocked(selectedQuery).mockResolvedValue(pkg.version)

        const { code } = await runCli(['update', ...args, flag])

        expect(code).toBe(0)
        expect(selectedQuery).toHaveBeenCalledTimes(1)
        expect(otherQuery).not.toHaveBeenCalled()
        expect(execFileSync).toHaveBeenCalledTimes(1)
        expect(vi.mocked(execFileSync).mock.calls[0]?.[1]).toContain('--internal-update-identity')
        expect(installBaseProfile).not.toHaveBeenCalled()
        expect(spawn).toHaveBeenCalledTimes(1)
        expect(vi.mocked(spawn).mock.calls[0]?.[0]).toBe(process.execPath)
      })
    })
  })

  it('Bun runtime without a manager override preserves npm and explains how to opt in', async () => {
    useBun()
    vi.mocked(fetchLatestNpmVersion).mockResolvedValue('99.0.0')
    const { stderr } = await runCli(['update'])
    expect(vi.mocked(execFileSync).mock.calls[0]?.[1]).toEqual([
      'i',
      '-g',
      '--prefix',
      '/fixed/prefix',
      'harnessed@latest',
    ])
    expect(stderr).toContain('--package-manager bun')
    expect(stderr).toContain('npm')
  })

  it('Bun rollback is refused with the selected manager guidance before any network/install', async () => {
    const { code, stderr } = await runCli(['update', '--package-manager', 'bun', '--rollback'])
    expect(code).toBe(1)
    expect(stderr).toContain('bun add --global harnessed@<version>')
    expect(fetchLatestBunVersion).not.toHaveBeenCalled()
    expect(fetchLatestNpmVersion).not.toHaveBeenCalled()
    expect(execFileSync).not.toHaveBeenCalled()
  })

  it.each([
    'npm',
    'bun',
  ])('compiled explicitly rejects --package-manager %s without switching channels', async (manager) => {
    vi.mocked(isCompiledRuntime).mockReturnValue(true)
    const { code, stderr } = await runCli(['update', '--package-manager', manager])
    expect(code).toBe(1)
    expect(stderr).toContain('--package-manager')
    expect(runBinarySelfUpdate).not.toHaveBeenCalled()
    expect(fetchLatestNpmVersion).not.toHaveBeenCalled()
    expect(fetchLatestBunVersion).not.toHaveBeenCalled()
    expect(execFileSync).not.toHaveBeenCalled()
  })

  it.each([
    '--check',
    '--dry-run',
    '--rollback',
    '--migration-report',
  ])('compiled rejects a package-manager override even with %s', async (flag) => {
    vi.mocked(isCompiledRuntime).mockReturnValue(true)
    const { code, stderr } = await runCli(['update', '--package-manager', 'bun', flag])
    expect(code).toBe(1)
    expect(stderr).toContain('--package-manager')
    expect(runBinarySelfUpdate).not.toHaveBeenCalled()
    expect(runBinaryRollback).not.toHaveBeenCalled()
    expect(fetchLatestBunVersion).not.toHaveBeenCalled()
    expect(execFileSync).not.toHaveBeenCalled()
  })

  it('--check reports installed/latest/status and does NOT install', async () => {
    vi.mocked(fetchLatestNpmVersion).mockResolvedValue('99.0.0')
    const { stdout } = await runCli(['update', '--check'])
    expect(stdout).toContain(pkg.version)
    expect(stdout).toContain('99.0.0')
    expect(stdout.toLowerCase()).toContain('behind')
    expect(execFileSync).not.toHaveBeenCalled()
  })

  it('behind → runs `npm i -g harnessed@latest` + restart hint', async () => {
    vi.mocked(fetchLatestNpmVersion).mockResolvedValue('99.0.0')
    const { stdout } = await runCli(['update'])
    expect(execFileSync).toHaveBeenCalled()
    const call = vi.mocked(execFileSync).mock.calls[0]
    expect(call?.[1]).toEqual(['i', '-g', '--prefix', '/fixed/prefix', 'harnessed@latest'])
    expect(stdout.toLowerCase()).toContain('restart')
  })

  it('current → does NOT install', async () => {
    vi.mocked(fetchLatestNpmVersion).mockResolvedValue(pkg.version)
    const { stdout } = await runCli(['update'])
    expect(execFileSync).not.toHaveBeenCalled()
    expect(stdout.toLowerCase()).toContain('up to date')
  })

  it.each([
    '--upstreams',
    '--all',
  ])('%s hands off after self-update without running the base profile', async (flag) => {
    vi.mocked(fetchLatestNpmVersion).mockResolvedValue('99.0.0')
    vi.mocked(execFileSync).mockReturnValue('99.0.0\n')
    await runCli(['update', flag])
    expect(execFileSync).toHaveBeenCalledTimes(2)
    expect(vi.mocked(execFileSync).mock.calls[0]?.[1]).toEqual([
      'i',
      '-g',
      '--prefix',
      '/fixed/prefix',
      'harnessed@latest',
    ])
    expect(installBaseProfile).not.toHaveBeenCalled()
    expect(spawn).toHaveBeenCalledTimes(1)
  })

  it('npm unreachable (fetch null) → no install, friendly message', async () => {
    vi.mocked(fetchLatestNpmVersion).mockResolvedValue(null)
    const { stderr } = await runCli(['update'])
    expect(execFileSync).not.toHaveBeenCalled()
    expect(stderr.toLowerCase()).toContain('npm')
  })

  it('--migration-report prints a read-only inventory and does NOT install', async () => {
    const { stdout } = await runCli(['update', '--migration-report'])
    expect(stdout.toLowerCase()).toContain('migration report')
    expect(stdout.toLowerCase()).toContain('read-only')
    expect(execFileSync).not.toHaveBeenCalled()
    expect(fetchLatestNpmVersion).not.toHaveBeenCalled() // no version check on this path
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
    expect(fetchLatestNpmVersion).not.toHaveBeenCalled() // rev3 issue 4: before ANY npm touch
    expect(execFileSync).not.toHaveBeenCalled()
    expect(stdout).toContain('4.27.0')
  })

  it('compiled + refused (safety valve) → falls back to the npm flow', async () => {
    vi.mocked(isCompiledRuntime).mockReturnValue(true)
    vi.mocked(runBinarySelfUpdate).mockResolvedValue({
      status: 'refused',
      reason: 'binary lives under node_modules',
    })
    vi.mocked(fetchLatestNpmVersion).mockResolvedValue(pkg.version)
    const { stdout } = await runCli(['update'])
    expect(fetchLatestNpmVersion).toHaveBeenCalled()
    expect(stdout.toLowerCase()).toContain('up to date')
  })

  it('npm mode --dry-run → prints the npm command, installs nothing', async () => {
    vi.mocked(isCompiledRuntime).mockReturnValue(false)
    vi.mocked(fetchLatestNpmVersion).mockResolvedValue('99.0.0')
    const { stdout } = await runCli(['update', '--dry-run'])
    expect(stdout).toContain('npm i -g harnessed@latest')
    expect(execFileSync).not.toHaveBeenCalled()
    expect(installBaseProfile).not.toHaveBeenCalled()
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
      expect(fetchLatestNpmVersion).not.toHaveBeenCalled()
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
      expect(fetchLatestNpmVersion).not.toHaveBeenCalled()
      expect(execFileSync).not.toHaveBeenCalled()
    })

    it('npm update names the active host and preserves the exact final line', async () => {
      vi.mocked(fetchLatestNpmVersion).mockResolvedValue('99.0.0')

      const { code, stdout, stderr } = await runCli(['update'])

      expect(code).toBe(0)
      expect(stderr).toBe('')
      expect(stdout.split('\n').slice(-2).join('\n')).toBe(`${npmHint}\n`)
      expect(execFileSync).toHaveBeenCalledTimes(1)
      expect(vi.mocked(execFileSync).mock.calls[0]?.[1]).toEqual([
        'i',
        '-g',
        '--prefix',
        '/fixed/prefix',
        'harnessed@latest',
      ])
      expect(runBinarySelfUpdate).not.toHaveBeenCalled()
      expect(runBinaryRollback).not.toHaveBeenCalled()
    })
  })
})
