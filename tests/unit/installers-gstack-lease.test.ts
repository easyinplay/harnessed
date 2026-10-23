import { ChildProcess, execFile, spawn } from 'node:child_process'
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { PassThrough } from 'node:stream'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parse } from 'yaml'
import { installGitCloneWithSetup } from '../../src/installers/gitCloneWithSetup.js'
import { verifyGstackLease } from '../../src/installers/lib/gstackLease.js'
import { isAlreadyInstalled } from '../../src/installers/lib/idempotent.js'
import { resolveBash } from '../../src/installers/lib/resolveBash.js'
import { verifySkillRuntime } from '../../src/installers/lib/skillRuntime.js'
import { spawnCmd } from '../../src/installers/lib/spawn.js'
import { recordObservedInstall, updateInstalled } from '../../src/installers/lib/state.js'
import type { InstallContext } from '../../src/installers/lib/types.js'
import { verifyInstalled } from '../../src/installers/lib/verifyInstalled.js'
import * as platform from '../../src/platform/platform.js'

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>()
  return { ...actual, execFile: vi.fn(actual.execFile), spawn: vi.fn(actual.spawn) }
})
vi.mock('../../src/installers/lib/resolveBash.js', () => ({
  resolveBash: vi.fn(() => ({ path: 'fixture-bash', source: 'env' })),
}))
vi.mock('../../src/installers/lib/spawn.js', () => ({
  DEFAULT_VERIFY_TIMEOUT_MS: 15_000,
  DEFAULT_INSTALL_TIMEOUT_MS: 60_000,
  spawnCmd: vi.fn(async () => ({ exitCode: 0, stdout: '', stderr: '' })),
}))
vi.mock('../../src/installers/lib/idempotent.js', () => ({
  isAlreadyInstalled: vi.fn(async () => true),
}))
vi.mock('../../src/installers/lib/state.js', () => ({
  recordObservedInstall: vi.fn(),
  updateInstalled: vi.fn(),
}))
vi.mock('../../src/installers/lib/backup.js', () => ({
  backup: vi.fn(async () => ({ ok: true, backupId: 'fixture-backup' })),
}))
vi.mock('../../src/installers/lib/confirm.js', () => ({
  confirmAt: vi.fn(async () => ({ proceed: true })),
}))
vi.mock('../../src/installers/lib/gstackRuntime.js', () => ({
  repairGstackCodexRuntimeAfterConfirm: vi.fn(),
}))
vi.mock('../../src/installers/lib/packSkillAudit.js', () => ({
  warnDeclaredCollisions: vi.fn(),
  snapshotSkillNames: vi.fn(),
  auditPostInstall: vi.fn(),
}))
vi.mock('../../src/installers/lib/skillRuntime.js', () => ({
  verifySkillRuntime: vi.fn(async () => null),
}))

const roots: string[] = []
let ctx: InstallContext
let source: string

function required(value: string | undefined): string {
  if (!value) throw new Error('required fixture path missing')
  return value
}

async function useRealShell(): Promise<void> {
  const actual = await vi.importActual<typeof import('node:child_process')>('node:child_process')
  const bash = await vi.importActual<typeof import('../../src/installers/lib/resolveBash.js')>(
    '../../src/installers/lib/resolveBash.js',
  )
  vi.mocked(execFile).mockImplementation(actual.execFile)
  vi.mocked(resolveBash).mockImplementation(bash.resolveBash)
}

beforeEach(async () => {
  vi.mocked(spawnCmd)
    .mockReset()
    .mockResolvedValue({ ok: true, exitCode: 0, stdout: '', stderr: '' })
  vi.mocked(verifySkillRuntime).mockClear()
  vi.mocked(isAlreadyInstalled).mockResolvedValue(true)
  vi.mocked(recordObservedInstall).mockClear()
  vi.mocked(updateInstalled).mockClear()
  vi.mocked(resolveBash).mockReturnValue({ path: 'fixture-bash', source: 'env' })
  vi.stubEnv('HARNESSED_PLATFORM', 'codex')
  const root = await mkdtemp(join(tmpdir(), 'harnessed-lease-test-'))
  roots.push(root)
  const codexHome = join(root, 'codex home')
  const runtime = join(codexHome, 'skills', 'gstack')
  source = join(root, 'source checkout')
  await mkdir(join(runtime, 'bin'), { recursive: true })
  await mkdir(source)
  await writeFile(join(runtime, '.source-path'), `${source}\n`)
  await writeFile(join(runtime, 'bin', 'gstack-lease'), '#!/usr/bin/env bash\nexit 3\n')
  const manifest = parse(await readFile('manifests/skill-packs/gstack.yaml', 'utf8'))
  ctx = {
    manifest: {
      ...manifest,
      spec: {
        ...manifest.spec,
        install: { ...manifest.spec.install, env: { CODEX_HOME: codexHome } },
      },
    },
    cwd: root,
    level: 'L2',
    opts: {
      apply: true,
      dryRun: false,
      system: false,
      nonInteractive: true,
      fullDiff: false,
      color: false,
    },
  }
  vi.mocked(execFile).mockImplementation((...args) => {
    const callback = args.at(-1) as (error: Error, stdout: string, stderr: string) => void
    queueMicrotask(() =>
      callback(
        Object.assign(new Error('exit 3'), { code: 3 }),
        '',
        'live process ; lease not renewed',
      ),
    )
    return new ChildProcess()
  })
})

afterEach(async () => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.mocked(execFile).mockClear()
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true })
})

describe('gstack Codex lease readiness', () => {
  it.each([
    { override: '', parent: 'parent custom' },
    { override: undefined, parent: '' },
  ])('uses the default lease runtime for override=$override and parent=$parent', async ({
    override,
    parent,
  }) => {
    const home = required(ctx.manifest.spec.install.env?.CODEX_HOME)
    const descriptor = platform.codexDescriptor(ctx.cwd)
    await rename(home, descriptor.homeDir)
    vi.spyOn(platform, 'detectPlatform').mockReturnValue(descriptor)
    vi.stubEnv('CODEX_HOME', parent ? join(ctx.cwd, parent) : '')
    ctx.manifest.spec.install.env = override === undefined ? {} : { CODEX_HOME: override }
    expect(await verifyGstackLease(ctx)).toMatchObject({
      error: { message: expect.stringContaining('official lease touch exit 3') },
    })
    expect(execFile).toHaveBeenCalledOnce()
    const call = vi.mocked(execFile).mock.calls[0]
    expect(call?.[1]?.[5]?.replace(/\\/g, '/')).toBe(
      (await realpath(join(descriptor.homeDir, 'skills', 'gstack', 'bin', 'gstack-lease'))).replace(
        /\\/g,
        '/',
      ),
    )
    expect(call?.[2]).toMatchObject({ cwd: await realpath(source) })
    expect(await readdir(source)).toEqual([])
  })

  it('runs a real Bash fixture with spaced paths and forwards the official touch arguments', async () => {
    await useRealShell()
    const lease = join(
      required(ctx.manifest.spec.install.env?.CODEX_HOME),
      'skills/gstack/bin/gstack-lease',
    )
    await writeFile(
      lease,
      [
        '#!/usr/bin/env bash',
        'set -eu',
        'test "$#" -eq 5 && test "$1" = touch && test "$2" = --root && test "$4" = --pid',
        'test "$GSTACK_LEASE_LOCK_TRIES" = 1',
        'test -d "$3" && test -d "$GSTACK_LEASE_DIR"',
        'printf "fixture identity\\n" > "$GSTACK_LEASE_DIR/$5"',
      ].join('\n'),
    )
    expect(await verifyGstackLease(ctx)).toBeNull()
    expect(execFile).toHaveBeenCalledOnce()
    expect(await readdir(source)).toEqual([])
  })

  it('propagates a real Bash fixture exit 3 instead of treating diagnostic retries as success', async () => {
    await useRealShell()
    expect(await verifyGstackLease(ctx)).toMatchObject({
      error: { keyword: 'upstream-lease-unavailable', message: expect.stringContaining('exit 3') },
    })
    expect(execFile).toHaveBeenCalledOnce()
    expect(await readdir(source)).toEqual([])
  })

  it('rejects a successful command that leaves its scratch lock behind', async () => {
    await useRealShell()
    const lease = join(
      required(ctx.manifest.spec.install.env?.CODEX_HOME),
      'skills/gstack/bin/gstack-lease',
    )
    await writeFile(
      lease,
      'printf "fixture\\n" > "$GSTACK_LEASE_DIR/$5"\nprintf "held\\n" > "$GSTACK_LEASE_DIR/.lock"\n',
    )
    expect(await verifyGstackLease(ctx)).toMatchObject({
      error: { keyword: 'upstream-lease-unavailable' },
    })
    expect(await readdir(source)).toEqual([])
  })

  it('uses different owned scratch directories for concurrent probes', async () => {
    const scratches: string[] = []
    vi.mocked(execFile).mockImplementation((...args) => {
      const options = args[2] as { env: NodeJS.ProcessEnv }
      const callback = args.at(-1) as (error: null, stdout: string, stderr: string) => void
      scratches.push(required(options.env.GSTACK_LEASE_DIR))
      void writeFile(
        join(required(options.env.GSTACK_LEASE_DIR), '4242'),
        'fixture identity\n',
      ).then(() => callback(null, '', ''))
      return new ChildProcess()
    })
    expect(await Promise.all([verifyGstackLease(ctx), verifyGstackLease(ctx)])).toEqual([
      null,
      null,
    ])
    expect(new Set(scratches).size).toBe(2)
    for (const scratch of scratches)
      expect(await realpath(dirname(scratch))).toBe(await realpath(source))
    expect(await readdir(source)).toEqual([])
  })

  it.runIf(process.platform === 'win32' && process.env.HARNESSED_GSTACK_LEASE_REAL_PROBE === '1')(
    'installed runtime reality probe: this Windows machine is correctly blocked',
    async () => {
      await useRealShell()
      const home = process.env.HARNESSED_GSTACK_LEASE_REAL_CODEX_HOME
      if (!home)
        throw new Error('real probe requires an explicit HARNESSED_GSTACK_LEASE_REAL_CODEX_HOME')
      ctx.manifest.spec.install.env = { CODEX_HOME: home }
      const actualSource = (await readFile(join(home, 'skills/gstack/.source-path'), 'utf8')).trim()
      const before = (await readdir(actualSource))
        .filter((entry) => entry.startsWith('.harnessed-gstack-lease-'))
        .sort()
      const result = await verifyGstackLease(ctx)
      console.info('REAL_GSTACK_LEASE_RESULT', JSON.stringify(result))
      expect(result).toMatchObject({
        ok: false,
        phase: 'verify',
        error: {
          keyword: 'upstream-lease-unavailable',
          message: expect.stringContaining('exit 3'),
        },
      })
      expect(execFile).toHaveBeenCalledOnce()
      expect(
        (await readdir(actualSource))
          .filter((entry) => entry.startsWith('.harnessed-gstack-lease-'))
          .sort(),
      ).toEqual(before)
    },
  )

  it.each([
    'existing',
    'fresh',
  ])('propagates %s install failure without writing a green receipt', async (mode) => {
    ctx.opts.quiet = true
    ctx.manifest.spec.install.cmd =
      'git clone https://github.com/garrytan/gstack.git relative-clone'
    vi.mocked(isAlreadyInstalled).mockResolvedValue(mode === 'existing')
    vi.mocked(spawn).mockImplementation(() => {
      const child = new ChildProcess()
      const stdout = new PassThrough()
      child.stdout = stdout
      const install = ctx.manifest.spec.install
      if (install.method !== 'git-clone-with-setup') throw new Error('fixture requires git install')
      queueMicrotask(() => {
        stdout.end(install.git_ref)
        child.emit('close', 0)
      })
      return child
    })
    expect(await installGitCloneWithSetup(ctx)).toMatchObject({
      ok: false,
      phase: 'verify',
      error: { keyword: 'upstream-lease-unavailable' },
    })
    expect(recordObservedInstall).not.toHaveBeenCalled()
    expect(updateInstalled).not.toHaveBeenCalled()
    expect(execFile).toHaveBeenCalledOnce()
  })

  it.each([
    'other-name',
    'claude',
    'dry-run',
  ])('does not run or create scratch for %s', async (mode) => {
    if (mode === 'other-name') ctx.manifest.metadata.name = 'other-skill'
    if (mode === 'claude') vi.stubEnv('HARNESSED_PLATFORM', 'claude')
    if (mode === 'dry-run') ctx.opts.dryRun = true
    expect(await verifyGstackLease(ctx)).toBeNull()
    expect(execFile).not.toHaveBeenCalled()
    expect(await readdir(source)).toEqual([])
  })

  it('does not run the lease gate or skillRuntime after failed shell verification', async () => {
    vi.mocked(spawnCmd).mockResolvedValue({
      ok: true,
      exitCode: 8,
      stdout: '',
      stderr: 'shell failed',
    })
    expect(await verifyInstalled(ctx)).toMatchObject({
      ok: false,
      phase: 'verify',
      error: { keyword: 'verify-failed' },
    })
    expect(execFile).not.toHaveBeenCalled()
    expect(verifySkillRuntime).not.toHaveBeenCalled()
  })

  it('prefers install CODEX_HOME, never forwards credentials/startup hooks, and leaves shared locks alone', async () => {
    vi.stubEnv('CODEX_HOME', join(ctx.cwd, 'wrong parent codex'))
    vi.stubEnv('GSTACK_LEASE_DIR', join(source, 'user leases'))
    vi.stubEnv('BASH_ENV', 'fixture-startup-must-not-run')
    vi.stubEnv('EXA_API_KEY', 'fixture-not-a-secret')
    const shared = join(source, 'user leases')
    await mkdir(shared)
    await writeFile(join(shared, '.lock'), 'user-owned lock')
    await verifyGstackLease(ctx)
    const args = vi.mocked(execFile).mock.calls[0]?.[1] as string[]
    const options = vi.mocked(execFile).mock.calls[0]?.[2] as { env: NodeJS.ProcessEnv }
    expect(args.join(' ')).toContain('/skills/gstack/bin/gstack-lease')
    expect(args.join(' ')).not.toContain('wrong parent codex')
    expect(options.env.GSTACK_LEASE_DIR).not.toBe(shared)
    expect(options.env.BASH_ENV).toBeUndefined()
    expect(options.env.EXA_API_KEY).toBeUndefined()
    expect(options.env.MSYS).toBe(process.env.MSYS)
    expect(options.env.MSYS2).toBe(process.env.MSYS2)
    expect(await readFile(join(shared, '.lock'), 'utf8')).toBe('user-owned lock')
    expect(await readdir(source)).toEqual(['user leases'])
  })

  it('falls back to parent CODEX_HOME only when the install has no override', async () => {
    vi.stubEnv('CODEX_HOME', required(ctx.manifest.spec.install.env?.CODEX_HOME))
    ctx.manifest.spec.install.env = {}
    expect(await verifyGstackLease(ctx)).toMatchObject({
      error: { keyword: 'upstream-lease-unavailable' },
    })
    expect(execFile).toHaveBeenCalledOnce()
  })

  it('fails closed for an absent installed script without touching the shared lease directory', async () => {
    const home = required(ctx.manifest.spec.install.env?.CODEX_HOME)
    await rm(join(home, 'skills/gstack/bin/gstack-lease'))
    expect(await verifyGstackLease(ctx)).toMatchObject({
      error: { keyword: 'upstream-lease-unavailable' },
    })
    expect(execFile).not.toHaveBeenCalled()
    expect(await readdir(source)).toEqual([])
  })

  it.each([
    '../relative source',
    'missing source',
  ])('refuses an invalid source marker: %s', async (marker) => {
    const runtime = join(required(ctx.manifest.spec.install.env?.CODEX_HOME), 'skills/gstack')
    await writeFile(join(runtime, '.source-path'), marker)
    expect(await verifyGstackLease(ctx)).toMatchObject({
      error: { keyword: 'upstream-lease-unavailable' },
    })
    expect(execFile).not.toHaveBeenCalled()
  })

  it('fails closed on a killed/timed-out official command and removes only its scratch', async () => {
    vi.mocked(execFile).mockImplementation((...args) => {
      const callback = args.at(-1) as (error: Error, stdout: string, stderr: string) => void
      queueMicrotask(() =>
        callback(Object.assign(new Error('deadline'), { killed: true, code: null }), '', ''),
      )
      return new ChildProcess()
    })
    const result = await verifyGstackLease(ctx)
    expect(result).toMatchObject({
      error: {
        keyword: 'upstream-lease-unavailable',
        message: expect.stringContaining('timeout or termination'),
      },
    })
    expect(await readdir(source)).toEqual([])
  })

  it('rejects exit zero without an actual published lease', async () => {
    vi.mocked(execFile).mockImplementation((...args) => {
      const callback = args.at(-1) as (error: null, stdout: string, stderr: string) => void
      queueMicrotask(() => callback(null, '', ''))
      return new ChildProcess()
    })
    expect(await verifyGstackLease(ctx)).toMatchObject({
      error: {
        keyword: 'upstream-lease-unavailable',
        message: expect.stringContaining('did not publish'),
      },
    })
    expect(await readdir(source)).toEqual([])
  })

  it('accepts publication plus unlock, then continues to skillRuntime and cleans scratch', async () => {
    vi.mocked(execFile).mockImplementation((...args) => {
      const options = args[2] as { env: NodeJS.ProcessEnv }
      const callback = args.at(-1) as (error: null, stdout: string, stderr: string) => void
      void writeFile(
        join(required(options.env.GSTACK_LEASE_DIR), '4242'),
        'fixture identity\n',
      ).then(() => callback(null, '', ''))
      return new ChildProcess()
    })
    expect(await verifyInstalled(ctx)).toBeNull()
    expect(verifySkillRuntime).toHaveBeenCalledOnce()
    expect(await readdir(source)).toEqual([])
  })
  it('runs after shell verification and stops before skillRuntime on lease failure', async () => {
    expect(await verifyInstalled(ctx)).toMatchObject({
      ok: false,
      phase: 'verify',
      error: { keyword: 'upstream-lease-unavailable' },
    })
    expect(spawnCmd).toHaveBeenCalledOnce()
    expect(execFile).toHaveBeenCalledOnce()
    expect(verifySkillRuntime).not.toHaveBeenCalled()
    expect(vi.mocked(execFile).mock.invocationCallOrder[0]).toBeGreaterThan(
      vi.mocked(spawnCmd).mock.invocationCallOrder[0] ?? 0,
    )
  })
  it('fails closed when the official lease command cannot lock its own fresh scratch', async () => {
    const before = await readdir(source)
    const result = await verifyGstackLease(ctx)
    expect(result).toMatchObject({
      ok: false,
      phase: 'verify',
      error: { keyword: 'upstream-lease-unavailable' },
    })
    if (result && 'error' in result) {
      expect(result.error.message).toContain('does not prove live-process contention')
      expect(result.error.message).toContain('exit 3')
      expect(result.error.message).toContain('scratch')
    }
    expect(execFile).toHaveBeenCalledOnce()
    const options = vi.mocked(execFile).mock.calls[0]?.[2] as {
      env: NodeJS.ProcessEnv
      cwd: string
      shell: boolean
      timeout: number
    }
    expect(options.shell).toBe(false)
    expect(options.timeout).toBeLessThanOrEqual(15_000)
    expect(options.env.GSTACK_LEASE_LOCK_TRIES).toBe('1')
    expect(options.env.GSTACK_LEASE_DIR).toContain('.harnessed-gstack-lease-')
    expect(await readdir(source)).toEqual(before)
    expect(await realpath(source)).toBe(options.cwd)
  })
})
