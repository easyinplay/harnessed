import { spawn } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type BackupMetadata, backup, getBackupRoot } from '../../src/installers/lib/backup.js'
import { preflight } from '../../src/installers/lib/preflight.js'
import { runArgs, runHarnessArgs } from '../../src/installers/lib/runClaudeArgs.js'
import { getMcpSpawnCwd, getNeutralSpawnCwd } from '../../src/installers/lib/safeCwd.js'
import { spawnCmd } from '../../src/installers/lib/spawn.js'
import {
  readState,
  recordObservedInstall,
  updateInstalled,
  writeState,
} from '../../src/installers/lib/state.js'
import type { InstallContext, Manifest } from '../../src/installers/lib/types.js'
import type { HostInstallContext } from '../../src/platform/hostInstallContext.js'
import { claudeDescriptor, codexDescriptor } from '../../src/platform/platform.js'

vi.mock('node:child_process', () => ({ spawn: vi.fn() }))
vi.mock('../../src/installers/lib/killTree.js', () => ({ killProcessTree: vi.fn() }))
vi.mock('../../src/installers/lib/resolveBash.js', () => ({
  resolveBash: () => ({ path: 'git-bash', source: 'path' }),
}))

import { killProcessTree } from '../../src/installers/lib/killTree.js'

let root: string
let contexts: HostInstallContext[]

function context(index: number): HostInstallContext {
  const host = contexts[index]
  if (!host) throw new Error('missing test context')
  return host
}

function installContext(hostContext?: HostInstallContext): InstallContext {
  return {
    hostContext,
    manifest: {
      metadata: { name: 'plumbing-fixture' },
      spec: { install: { method: 'npm-cli', cmd: 'fixture', env: {} } },
    } as Manifest,
    opts: {
      apply: true,
      dryRun: false,
      system: false,
      nonInteractive: true,
      fullDiff: false,
      color: false,
    },
    level: 'L2',
    cwd: root,
  }
}

function fakeChild(close = true) {
  const child = Object.assign(new EventEmitter(), {
    stdout: Object.assign(new EventEmitter(), {
      setEncoding() {
        return this
      },
    }),
    stderr: Object.assign(new EventEmitter(), {
      setEncoding() {
        return this
      },
    }),
  })
  if (close) queueMicrotask(() => child.emit('close', 0))
  return child as unknown as ReturnType<typeof spawn>
}

function spawnOptions() {
  const call = vi.mocked(spawn).mock.calls.at(-1)
  expect(call).toBeDefined()
  return call?.[2] as { cwd: string; env?: NodeJS.ProcessEnv; stdio: string[] }
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'host-plumbing-'))
  contexts = (['claude', 'codex'] as const).map((hostId) => {
    const userHome = join(root, hostId)
    const platform = hostId === 'claude' ? claudeDescriptor(userHome) : codexDescriptor(userHome)
    return Object.freeze({
      hostId,
      os: 'linux' as const,
      userHome,
      platform: Object.freeze({ ...platform, stateRoot: join(userHome, 'captured-state') }),
      nativeHome: join(userHome, 'custom-native'),
    })
  })
  vi.stubEnv('HOME', join(root, 'ambient'))
  vi.stubEnv('USERPROFILE', join(root, 'ambient'))
  vi.stubEnv('HARNESSED_PLATFORM', 'claude')
  vi.stubEnv('HARNESSED_ROOT_OVERRIDE', join(root, 'ambient-state'))
  vi.stubEnv('HARNESSED_SPAWN_CWD', join(root, 'ambient-spawn'))
  vi.stubEnv('CODEX_HOME', join(root, 'ambient-codex'))
  vi.stubEnv('CLAUDE_CONFIG_DIR', join(root, 'ambient-claude'))
  vi.mocked(spawn)
    .mockReset()
    .mockImplementation(() => fakeChild())
  vi.mocked(killProcessTree).mockClear()
})

afterEach(async () => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  await rm(root, { recursive: true, force: true })
})

describe('captured spawn routing', () => {
  it('uses captured OS for the manifest platform gate instead of the current runtime', () => {
    const os = process.platform === 'win32' ? 'linux' : 'win32'
    const host: HostInstallContext = { ...context(0), os }
    const ctx = installContext(host)
    ctx.manifest.spec.install.idempotent_check = 'fixture --version'
    ctx.manifest.spec.platforms = [os]
    expect(preflight(ctx)).toEqual({ ok: true, errors: [] })
    ctx.manifest.spec.platforms = [process.platform as 'win32' | 'linux' | 'darwin']
    expect(preflight(ctx)).toMatchObject({
      ok: false,
      abortReason: 'platform-mismatch',
      errors: [{ keyword: 'platform-mismatch', message: expect.stringContaining(`'${os}'`) }],
    })
  })

  it.each([
    'install',
    'verify',
  ] as const)('pins routing after manifest env merge in %s mode', async (mode) => {
    vi.stubEnv('PRIVATE_TOKEN', 'ambient-secret')
    for (const host of contexts) {
      const ctx = installContext(host)
      ctx.manifest.spec.install.env = {
        HOME: '/wrong',
        USERPROFILE: '/wrong',
        HARNESSED_PLATFORM: 'wrong',
        CODEX_HOME: '/wrong',
        CLAUDE_CONFIG_DIR: '/wrong',
        HARNESSED_ROOT_OVERRIDE: '/wrong-state',
        HARNESSED_SPAWN_CWD: '/wrong-spawn',
        PRIVATE_TOKEN: 'manifest-secret',
        PATH: '/manifest-path',
      }
      expect(
        await spawnCmd(ctx, 'fixture --version', [], 1000, {
          neutralCwd: true,
          envMode: mode === 'verify' ? 'verify' : undefined,
        }),
      ).toMatchObject({ ok: true, exitCode: 0 })
      const opts = spawnOptions()
      expect(opts.cwd).toBe(join(host.platform.stateRoot, '.spawn'))
      expect(opts.env).toMatchObject({
        HOME: host.userHome,
        USERPROFILE: host.userHome,
        HARNESSED_PLATFORM: host.hostId,
        HARNESSED_ROOT_OVERRIDE: host.platform.stateRoot,
        HARNESSED_SPAWN_CWD: '',
        [host.hostId === 'codex' ? 'CODEX_HOME' : 'CLAUDE_CONFIG_DIR']: host.nativeHome,
        PATH: '/manifest-path',
      })
      expect(opts.env?.PRIVATE_TOKEN).toBe(mode === 'verify' ? undefined : 'manifest-secret')
      expect(opts.stdio[0]).toBe('ignore')
    }
    expect(process.env.PRIVATE_TOKEN).toBe('ambient-secret')
    expect(process.env.HOME).toBe(join(root, 'ambient'))
  })

  it('evaluates tilde test chains against captured home without spawning', async () => {
    for (const host of contexts) {
      await mkdir(host.userHome, { recursive: true })
      await writeFile(join(host.userHome, 'present'), 'yes')
      expect(await spawnCmd(installContext(host), 'test -f ~/present', [])).toMatchObject({
        ok: true,
        exitCode: 0,
      })
    }
    expect(spawn).not.toHaveBeenCalled()
  })

  it('uses captured Windows OS and home for cmd.exe tilde expansion and case-insensitive pins', async () => {
    const host: HostInstallContext = { ...context(1), os: 'win32' }
    const ctx = installContext(host)
    ctx.manifest.spec.install.env = {
      home: '/wrong',
      UserProfile: '/wrong',
      codex_home: '/wrong',
      harnessed_platform: 'claude',
      harnessed_root_override: '/wrong-state',
      harnessed_spawn_cwd: '/wrong-spawn',
    }
    await spawnCmd(ctx, 'fixture ~/settings', ['~/extra'])
    const call = vi.mocked(spawn).mock.calls[0]
    expect(call?.[0]).toBe('cmd.exe')
    const home = host.userHome.replace(/\\/g, '/')
    expect(call?.[1]).toEqual(['/c', `fixture ${home}/settings`, `${home}/extra`])
    const env = spawnOptions().env ?? {}
    expect(Object.entries(env).filter(([key]) => key.toUpperCase() === 'HOME')).toEqual([
      ['HOME', host.userHome],
    ])
    expect(env.CODEX_HOME).toBe(host.nativeHome)
    expect(env.codex_home).toBeUndefined()
    expect(env.UserProfile).toBeUndefined()
    expect(env.harnessed_platform).toBeUndefined()
    expect(env.harnessed_root_override).toBeUndefined()
    expect(env.harnessed_spawn_cwd).toBeUndefined()
    expect(env.HARNESSED_ROOT_OVERRIDE).toBe(host.platform.stateRoot)
    expect(env.HARNESSED_SPAWN_CWD).toBe('')
  })

  it('keeps Git Bash routing and pinned home for captured Windows POSIX commands', async () => {
    const host: HostInstallContext = { ...context(0), os: 'win32' }
    await spawnCmd(installContext(host), 'echo ~/settings', [], 1000, { posixShell: true })
    expect(vi.mocked(spawn).mock.calls[0]?.[0]).toBe('git-bash')
    expect(spawnOptions().env?.HOME).toBe(host.userHome)
  })

  it('retains manifest env and explicit cwd for legacy calls', async () => {
    const ctx = installContext()
    ctx.manifest.spec.install.env = { HOME: '/legacy-home', PRIVATE_TOKEN: 'legacy-secret' }
    ctx.manifest.spec.install.cwd = root
    await spawnCmd(ctx, 'fixture', [], 1000, { neutralCwd: true })
    expect(spawnOptions()).toMatchObject({
      cwd: root,
      env: { HOME: '/legacy-home', PRIVATE_TOKEN: 'legacy-secret' },
    })
  })

  it('still rejects shell escapes before spawn with a context', async () => {
    expect(await spawnCmd(installContext(contexts[0]), 'fixture $(whoami)', [])).toMatchObject({
      ok: false,
      phase: 'preflight',
      error: { keyword: 'security-gate-bypass' },
    })
    expect(spawn).not.toHaveBeenCalled()
  })

  it('still kills a timed-out context spawn', async () => {
    vi.useFakeTimers()
    const child = fakeChild(false)
    vi.mocked(spawn).mockReturnValueOnce(child)
    const result = spawnCmd(installContext(contexts[0]), 'fixture', [], 20)
    await vi.advanceTimersByTimeAsync(20)
    expect(await result).toMatchObject({ ok: false, error: { keyword: 'spawn-timeout' } })
    expect(killProcessTree).toHaveBeenCalledWith(child)
  })
})

describe('native CLI explicit context', () => {
  it('pins native and user homes for two CLI calls without swapping global env', async () => {
    vi.stubEnv('PRIVATE_TOKEN', 'retained-install-secret')
    for (const host of contexts) {
      expect(await runHarnessArgs(host.hostId, ['mcp', 'list'], root, 1000, host)).toEqual({
        exitCode: 0,
        stdout: '',
        stderr: '',
      })
      expect(vi.mocked(spawn).mock.calls.at(-1)?.[0]).toBe(host.hostId)
      expect(spawnOptions()).toMatchObject({
        cwd: root,
        env: {
          HOME: host.userHome,
          USERPROFILE: host.userHome,
          HARNESSED_PLATFORM: host.hostId,
          HARNESSED_ROOT_OVERRIDE: host.platform.stateRoot,
          HARNESSED_SPAWN_CWD: '',
          [host.hostId === 'codex' ? 'CODEX_HOME' : 'CLAUDE_CONFIG_DIR']: host.nativeHome,
          PRIVATE_TOKEN: 'retained-install-secret',
        },
      })
    }
    expect(process.env.CODEX_HOME).toBe(join(root, 'ambient-codex'))
    expect(process.env.CLAUDE_CONFIG_DIR).toBe(join(root, 'ambient-claude'))
    expect(process.env.HOME).toBe(join(root, 'ambient'))
  })

  it('passes optional context through the Claude shorthand', async () => {
    const host = context(0)
    await runArgs(['plugin', 'list'], root, 1000, host)
    expect(spawnOptions().env?.CLAUDE_CONFIG_DIR).toBe(host.nativeHome)
  })

  it('preserves implicit env inheritance on legacy native CLI calls', async () => {
    await runHarnessArgs('codex', ['mcp', 'list'], root)
    expect(spawnOptions().env).toBeUndefined()
  })
})

describe('captured state, backup and cwd plumbing', () => {
  it('honors captured explicit neutral cwd after the ambient override changes', async () => {
    for (const captured of contexts) {
      const neutralSpawnCwd = join(root, captured.hostId, 'custom-neutral')
      const host: HostInstallContext = { ...captured, neutralSpawnCwd }
      vi.stubEnv('HARNESSED_SPAWN_CWD', join(root, 'changed-ambient-neutral'))
      expect(getNeutralSpawnCwd(host)).toBe(neutralSpawnCwd)
      expect(existsSync(neutralSpawnCwd)).toBe(false)
      await spawnCmd(installContext(host), 'fixture', [], 1000, { neutralCwd: true })
      expect(spawnOptions().cwd).toBe(neutralSpawnCwd)
      expect(spawnOptions().env?.HARNESSED_SPAWN_CWD).toBe(neutralSpawnCwd)
    }
    expect(existsSync(join(root, 'changed-ambient-neutral'))).toBe(false)
  })

  it.each([
    ['2', 'original-sha'],
    ['1', 'changed-sha'],
    ['2', 'changed-sha'],
  ])('does not replace a conflicting explicit-context observed receipt (%s, %s)', async (version, sha) => {
    const host = context(0)
    const state = {
      version: '1' as const,
      installed: {
        fixture: {
          version: '1',
          manifestSha1: 'original-sha',
          installedAt: '2025-01-01T00:00:00Z',
        },
      },
    }
    await writeState(root, state, host)
    await recordObservedInstall(root, 'fixture', version, sha, host)
    expect(await readState(root, host)).toEqual(state)
  })

  it('still updates conflicting observed receipts on legacy calls', async () => {
    await updateInstalled(root, 'fixture', '1', 'old-sha')
    const previous = await readState(root)
    await recordObservedInstall(root, 'fixture', '2', 'new-sha')
    expect((await readState(root)).installed.fixture).toEqual({
      ...previous.installed.fixture,
      version: '2',
      manifestSha1: 'new-sha',
    })
  })

  it('keeps state and both receipt helpers in each captured root', async () => {
    for (const host of contexts) {
      await writeState(root, { version: '1', installed: {} }, host)
      await updateInstalled(root, 'installed', host.hostId, 'sha-installed', host)
      await recordObservedInstall(root, 'observed', '1', 'sha-observed', host)
      const first = await readState(root, host)
      vi.stubEnv('HARNESSED_ROOT_OVERRIDE', join(root, 'later-state'))
      await recordObservedInstall(root, 'observed', '2', 'sha-updated', host)
      const persisted = JSON.parse(
        await readFile(join(host.platform.stateRoot, 'state.json'), 'utf8'),
      )
      expect(persisted.installed.installed.version).toBe(host.hostId)
      expect(persisted.installed.observed.version).toBe('1')
      expect(persisted.installed.observed.manifestSha1).toBe('sha-observed')
      expect(persisted.installed.observed.installedAt).toBe(first.installed.observed?.installedAt)
      expect(await readState(root, host)).toEqual(persisted)
      expect(existsSync(join(host.platform.stateRoot, 'state.json.tmp'))).toBe(false)
    }
    expect(existsSync(join(root, 'ambient-state'))).toBe(false)
    expect(existsSync(join(root, 'later-state'))).toBe(false)
  })

  it('backs up bytes and mirrors HOME against captured userHome', async () => {
    for (const host of contexts) {
      const target = join(host.userHome, 'settings.json')
      await mkdir(host.userHome, { recursive: true })
      await writeFile(target, 'original\r\n')
      expect(getBackupRoot(host)).toBe(join(host.platform.stateRoot, 'backups'))
      const result = await backup(
        { files: [{ target, scope: 'HOME', oldText: 'original\r\n', newText: 'new\n' }] },
        installContext(host),
      )
      expect(result.ok).toBe(true)
      if (!result.ok) throw new Error(result.error.message)
      expect(result.backupDir).toBe(join(host.platform.stateRoot, 'backups', result.backupId))
      const dest = join(result.backupDir, 'HOME', 'settings.json')
      expect(await readFile(dest, 'utf8')).toBe('original\r\n')
      const metadata: BackupMetadata = JSON.parse(
        await readFile(join(result.backupDir, 'metadata.json'), 'utf8'),
      )
      expect(metadata.files[0]).toMatchObject({ target, backup: dest, eol: 'crlf' })
    }
    expect(existsSync(join(root, 'ambient-state'))).toBe(false)
  })

  it('uses captured home and neutral sentinel despite ambient cwd overrides', () => {
    for (const host of contexts) {
      expect(getMcpSpawnCwd(host)).toBe(host.userHome)
      const neutral = join(host.platform.stateRoot, '.spawn')
      expect(getNeutralSpawnCwd(host)).toBe(neutral)
      expect(existsSync(join(neutral, 'package.json'))).toBe(true)
    }
    expect(existsSync(join(root, 'ambient-spawn'))).toBe(false)
  })

  it('preserves legacy root and cwd overrides with no context', async () => {
    await writeState(root, { version: '1', installed: {} })
    expect(await readState(root)).toEqual({ version: '1', installed: {} })
    expect(existsSync(join(root, 'ambient-state', 'state.json'))).toBe(true)
    expect(getBackupRoot()).toBe(join(root, 'ambient-state', 'backups'))
    expect(getNeutralSpawnCwd()).toBe(join(root, 'ambient-spawn'))
    expect(getMcpSpawnCwd()).toBe(join(root, 'ambient'))
  })
})
