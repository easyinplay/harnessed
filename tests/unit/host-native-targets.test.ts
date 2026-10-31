import { existsSync } from 'node:fs'
import {
  access,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parse } from 'yaml'
import type { HostInstallContext } from '../../src/platform/hostInstallContext.js'
import { claudeDescriptor, codexDescriptor } from '../../src/platform/platform.js'

vi.mock('../../src/platform/platform.js', async (original) => {
  const real = await original<typeof import('../../src/platform/platform.js')>()
  return {
    ...real,
    detectPlatform: vi.fn(() =>
      process.env.HARNESSED_PLATFORM === 'codex'
        ? real.codexDescriptor(process.env.HOME)
        : real.claudeDescriptor(process.env.HOME),
    ),
    getSettingsPath: vi.fn(() => join(process.env.HOME ?? '', '.claude', 'settings.json')),
    getSkillsDir: vi.fn(() => join(process.env.HOME ?? '', '.claude', 'skills')),
  }
})
vi.mock('../../src/installers/lib/preflight.js', () => ({ preflight: vi.fn(() => ({ ok: true })) }))
vi.mock('@clack/prompts', () => ({
  confirm: vi.fn(async () => false),
  isCancel: vi.fn(() => false),
}))
vi.mock('node:fs/promises', async (original) => {
  const actual = await original<typeof import('node:fs/promises')>()
  return {
    ...actual,
    access: vi.fn(actual.access),
    lstat: vi.fn(actual.lstat),
    rm: vi.fn(actual.rm),
  }
})
vi.mock('../../src/installers/lib/confirm.js', () => ({
  confirmAt: vi.fn(async () => ({ proceed: true })),
}))
vi.mock('../../src/installers/lib/backup.js', () => ({
  backup: vi.fn(async () => ({ ok: true, backupId: 'fixture-backup' })),
}))
vi.mock('../../src/installers/lib/idempotent.js', async (original) => {
  const actual = await original<typeof import('../../src/installers/lib/idempotent.js')>()
  return {
    ...actual,
    isAlreadyInstalled: vi.fn(async () => false),
    detectSkillPresence: vi.fn(async () => true),
    extractSkillName: vi.fn(() => 'fixture'),
  }
})
vi.mock('../../src/installers/lib/verifyInstalled.js', () => ({
  verifyInstalled: vi.fn(async () => null),
}))
vi.mock('../../src/installers/lib/state.js', () => ({
  updateInstalled: vi.fn(async () => undefined),
  recordObservedInstall: vi.fn(async () => undefined),
}))
vi.mock('../../src/installers/lib/packSkillAudit.js', () => ({
  skillRootsForContext: vi.fn((ctx: { hostContext?: HostInstallContext }) =>
    ctx.hostContext
      ? [ctx.hostContext.platform.skillsDir, join(ctx.hostContext.nativeHome, 'skills')]
      : [join(process.env.HOME ?? '', '.claude', 'skills')],
  ),
  snapshotSkillPaths: vi.fn(async () => new Set<string>()),
  snapshotSkillNames: vi.fn(async () => new Set<string>()),
  warnDeclaredCollisions: vi.fn(async () => undefined),
  auditPostInstall: vi.fn(async () => undefined),
}))
vi.mock('../../src/installers/lib/spawn.js', () => ({
  DEFAULT_INSTALL_TIMEOUT_MS: 60_000,
  spawnCmd: vi.fn(async () => ({ exitCode: 0, stdout: '', stderr: '' })),
}))
vi.mock('../../src/installers/lib/runClaudeArgs.js', () => ({
  runHarnessArgs: vi.fn(async () => ({ exitCode: 0, stdout: '', stderr: '' })),
}))
vi.mock('../../src/installers/lib/safeCwd.js', () => ({
  getMcpSpawnCwd: vi.fn((context?: HostInstallContext) => context?.userHome ?? process.env.HOME),
}))
vi.mock('../../src/installers/lib/readClaudeConfig.js', () => ({
  isPluginRegistered: vi.fn(async () => true),
  isMcpServerRegistered: vi.fn(async () => true),
  readPluginEnablement: vi.fn(async () => true),
}))
vi.mock('../../src/installers/lib/codexPlugins.js', () => ({
  isCodexPluginInstalled: vi.fn(async () => true),
  listCodexPluginMetadata: vi.fn(async () => []),
  invalidateCodexPluginCache: vi.fn(),
  withCodexPluginLock: vi.fn(async (fn: () => Promise<unknown>) => fn()),
}))
vi.mock('../../src/installers/lib/codexMcpServers.js', () => ({
  invalidateCodexMcpCache: vi.fn(),
  listCodexMcpServerMetadata: vi.fn(async () => [{ name: 'fixture', enabled: true }]),
}))
vi.mock('../../src/installers/lib/gstackRuntime.js', () => ({
  repairGstackCodexRuntimeAfterConfirm: vi.fn(async () => ({ status: 'created' })),
}))
vi.mock('node:child_process', async () => {
  const { EventEmitter } = await import('node:events')
  return {
    spawn: vi.fn(() => {
      const stdout = Object.assign(new EventEmitter(), { setEncoding: () => stdout })
      const child = Object.assign(new EventEmitter(), { stdout })
      queueMicrotask(() => {
        stdout.emit('data', gitSha)
        child.emit('close', 0)
      })
      return child
    }),
  }
})
vi.mock('../../src/installers/lib/codexHookTrust.js', () => ({
  listCodexHooks: vi.fn(async () => ({ ok: true, value: [] })),
  trustCodexHooks: vi.fn(async () => ({
    ok: true,
    value: { trusted: [], already: [], missing: [] },
  })),
  untrustCodexHooks: vi.fn(async () => ({ ok: true, value: { removed: [] } })),
}))

import { installCcHookAdd } from '../../src/installers/ccHookAdd.js'
import { installCcPluginMarketplace } from '../../src/installers/ccPluginMarketplace.js'
import {
  codexHookPaths,
  installCodexHook,
  removeCodexHook,
  resolveCodexHome,
} from '../../src/installers/codexHookAdd.js'
import { installGitCloneWithSetup } from '../../src/installers/gitCloneWithSetup.js'
import { backup } from '../../src/installers/lib/backup.js'
import {
  listCodexHooks,
  trustCodexHooks,
  untrustCodexHooks,
} from '../../src/installers/lib/codexHookTrust.js'
import { listCodexMcpServerMetadata } from '../../src/installers/lib/codexMcpServers.js'
import {
  invalidateCodexPluginCache,
  isCodexPluginInstalled,
  listCodexPluginMetadata,
  withCodexPluginLock,
} from '../../src/installers/lib/codexPlugins.js'
import { confirmAt } from '../../src/installers/lib/confirm.js'
import { repairGstackCodexRuntimeAfterConfirm } from '../../src/installers/lib/gstackRuntime.js'
import { isAlreadyInstalled } from '../../src/installers/lib/idempotent.js'
import { snapshotDeclaredOwnership } from '../../src/installers/lib/ownershipContract.js'
import { auditPostInstall, snapshotSkillNames } from '../../src/installers/lib/packSkillAudit.js'
import {
  isMcpServerRegistered,
  isPluginRegistered,
  readPluginEnablement,
} from '../../src/installers/lib/readClaudeConfig.js'
import { runHarnessArgs } from '../../src/installers/lib/runClaudeArgs.js'
import { spawnCmd } from '../../src/installers/lib/spawn.js'
import { recordObservedInstall, updateInstalled } from '../../src/installers/lib/state.js'
import type { InstallContext, Installer, Manifest } from '../../src/installers/lib/types.js'
import { installMcpHttpAdd } from '../../src/installers/mcpHttpAdd.js'
import { installMcpStdioAdd } from '../../src/installers/mcpStdioAdd.js'
import { installNpmCli } from '../../src/installers/npmCli.js'
import { installNpxSkillInstaller } from '../../src/installers/npxSkillInstaller.js'

let root: string
let pinned: HostInstallContext
let gitSha = 'abcdef1234567'
function drift(host = 'claude') {
  vi.stubEnv('HARNESSED_PLATFORM', host)
  vi.stubEnv('HOME', join(root, 'ambient'))
  vi.stubEnv('USERPROFILE', join(root, 'ambient'))
  vi.stubEnv('CODEX_HOME', join(root, 'ambient-codex'))
  vi.stubEnv('CLAUDE_CONFIG_DIR', join(root, 'ambient-claude'))
}
function context(hostId: 'claude' | 'codex'): HostInstallContext {
  const userHome = join(root, 'selected')
  const platform = hostId === 'codex' ? codexDescriptor(userHome) : claudeDescriptor(userHome)
  return Object.freeze({
    hostId,
    os: process.platform,
    userHome,
    nativeHome: join(root, `native-${hostId}`),
    platform: Object.freeze({ ...platform, stateRoot: join(root, 'selected-state') }),
  })
}
function fixture(method: string, cmd: string, name = 'fixture'): InstallContext {
  return {
    cwd: root,
    level: 'L3',
    hostContext: pinned,
    opts: {
      apply: true,
      dryRun: false,
      system: true,
      nonInteractive: true,
      fullDiff: false,
      color: false,
      quiet: true,
    },
    manifest: {
      apiVersion: 'harnessed/v1',
      kind: 'Manifest',
      metadata: {
        name,
        description: 'fixture',
        upstream: {
          source: 'owner/fixture',
          homepage: 'https://example.com',
          repository: 'https://example.com/fixture.git',
          license: 'MIT',
          notice: 'fixture',
        },
      },
      spec: {
        component_type: 'cli-binary',
        type: 'cli-npm',
        install: {
          method,
          cmd,
          ...(method === 'npx-skill-installer' ? { installs_skills: ['fixture'] } : {}),
          npm_version: '1.0.0',
          git_ref: 'abcdef1234567',
          idempotent_check: 'fixture probe',
          hook_event: 'SessionStart',
          hook_command: 'node bin/harnessed-inject-state.mjs',
        },
        verify: { cmd: 'fixture --version', expected_exit_code: 0, timeout_ms: 1000 },
        uninstall: { cmd: 'fixture remove' },
        upstream_health: {
          stability: 'stable',
          last_check: '2026-10-23',
          last_known_good_version: '1.0.0',
          fallback_action: 'warn',
        },
        signed_by: 'easyinplay',
        platforms: ['linux', 'darwin', 'win32'],
        category: 'engineering',
        install_type: 'npm',
      },
    } as Manifest,
  }
}
function materializeNpxSkillOnSpawn(skillsDir = pinned.platform.skillsDir, name = 'fixture') {
  vi.mocked(spawnCmd).mockImplementationOnce(async () => {
    const skillDir = join(skillsDir, name)
    await mkdir(skillDir, { recursive: true })
    await writeFile(join(skillDir, 'SKILL.md'), '# fixture\n')
    return { ok: true, exitCode: 0, stdout: '', stderr: '' }
  })
}
const methods: [string, Installer, string][] = [
  ['npm-cli', installNpmCli, 'npm install -g fixture'],
  ['npx-skill-installer', installNpxSkillInstaller, 'npx skills add owner/fixture --copy'],
  [
    'git-clone-with-setup',
    installGitCloneWithSetup,
    'git clone https://example.com/fixture.git ~/clone',
  ],
  [
    'cc-plugin-marketplace',
    installCcPluginMarketplace,
    'codex plugin marketplace add owner/market && codex plugin add fixture@market',
  ],
  ['mcp-stdio-add', installMcpStdioAdd, 'codex mcp add fixture -- npx fixture'],
  ['mcp-http-add', installMcpHttpAdd, 'codex mcp add fixture --url https://example.com/mcp'],
]
beforeEach(async () => {
  vi.clearAllMocks()
  root = await mkdtemp(join(tmpdir(), 'harnessed-native-targets-'))
  pinned = context('codex')
  gitSha = 'abcdef1234567'
  drift('codex')
  await mkdir(join(root, 'ambient', '.claude'), { recursive: true })
  vi.mocked(isAlreadyInstalled).mockReset().mockResolvedValue(false)
  vi.mocked(confirmAt)
    .mockReset()
    .mockImplementation(async () => {
      drift()
      return { proceed: true }
    })
  vi.mocked(runHarnessArgs).mockReset().mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' })
  vi.mocked(readPluginEnablement).mockReset().mockResolvedValue(true)
  vi.mocked(recordObservedInstall).mockReset().mockResolvedValue(undefined)
  vi.mocked(updateInstalled).mockReset().mockResolvedValue(undefined)
  vi.mocked(listCodexHooks).mockReset().mockResolvedValue({ ok: true, value: [] })
  vi.mocked(untrustCodexHooks)
    .mockReset()
    .mockResolvedValue({ ok: true, value: { removed: [] } })
  vi.mocked(isCodexPluginInstalled).mockReset().mockResolvedValue(true)
  vi.mocked(listCodexPluginMetadata)
    .mockReset()
    .mockResolvedValue([
      { pluginId: 'harnessed-fixture@harnessed-local', installed: true, enabled: true },
    ])
  vi.mocked(isPluginRegistered)
    .mockReset()
    .mockImplementation(async (id) => id.includes('@'))
  vi.mocked(listCodexMcpServerMetadata)
    .mockReset()
    .mockResolvedValue([{ name: 'fixture', enabled: true }])
})
afterEach(async () => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  await rm(root, { recursive: true, force: true })
})

describe('native installer captured targets', () => {
  it('leaves an absent Claude receipt absent when dry-run finds an exact existing hook', async () => {
    pinned = context('claude')
    await mkdir(pinned.nativeHome, { recursive: true })
    const ctx = fixture('cc-hook-add', 'node bin/harnessed-inject-state.mjs')
    expect(await installCcHookAdd(ctx)).toMatchObject({ ok: true })
    const settingsPath = join(pinned.nativeHome, 'settings.json')
    const before = await readFile(settingsPath, 'utf8')
    vi.clearAllMocks()
    const actualState = await vi.importActual<typeof import('../../src/installers/lib/state.js')>(
      '../../src/installers/lib/state.js',
    )
    vi.mocked(recordObservedInstall).mockImplementationOnce(actualState.recordObservedInstall)
    ctx.opts.apply = false
    ctx.opts.dryRun = true
    expect(await installCcHookAdd(ctx)).toMatchObject({ ok: true, alreadyInstalled: true })
    expect(existsSync(join(pinned.platform.stateRoot, 'state.json'))).toBe(false)
    expect(recordObservedInstall).not.toHaveBeenCalled()
    expect(updateInstalled).not.toHaveBeenCalled()
    expect(confirmAt).not.toHaveBeenCalled()
    expect(backup).not.toHaveBeenCalled()
    expect(await readFile(settingsPath, 'utf8')).toBe(before)
  })
  it.each(
    methods,
  )('%s pins fresh receipts after environment drift', async (method, install, cmd) => {
    if (method === 'npx-skill-installer') materializeNpxSkillOnSpawn()
    expect(await install(fixture(method, cmd))).toMatchObject({ ok: true })
    expect(updateInstalled).toHaveBeenCalledWith(
      root,
      'fixture',
      method === 'git-clone-with-setup' || method === 'cc-plugin-marketplace'
        ? 'abcdef1234567'
        : '1.0.0',
      '',
      pinned,
    )
  })
  it.each(
    methods,
  )('%s pins observed receipts after probe changes ambient host', async (method, install, cmd) => {
    vi.mocked(isAlreadyInstalled).mockImplementation(async () => {
      drift()
      return true
    })
    if (method === 'npx-skill-installer') {
      const skillDir = join(pinned.platform.skillsDir, 'fixture')
      await mkdir(skillDir, { recursive: true })
      await writeFile(join(skillDir, 'SKILL.md'), '# fixture\n')
      const actualFs = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises')
      vi.mocked(access).mockImplementationOnce(async (path, mode) => {
        drift()
        await actualFs.access(path, mode)
      })
    }
    expect(await install(fixture(method, cmd))).toMatchObject({ ok: true, alreadyInstalled: true })
    expect(recordObservedInstall).toHaveBeenCalledWith(
      root,
      'fixture',
      method === 'git-clone-with-setup' || method === 'cc-plugin-marketplace'
        ? 'abcdef1234567'
        : '1.0.0',
      '',
      pinned,
    )
    expect(runHarnessArgs).not.toHaveBeenCalled()
    expect(spawnCmd).not.toHaveBeenCalled()
    if (method === 'npx-skill-installer') expect(isAlreadyInstalled).not.toHaveBeenCalled()
  })
  it.each(
    methods.slice(3),
  )('%s uses captured CLI, cwd, probe and native config path', async (method, install, cmd) => {
    drift('claude')
    const ctx = fixture(method, cmd)
    expect(await install(ctx)).toMatchObject({
      ok: true,
      appliedFiles: [join(pinned.nativeHome, 'config.toml')],
    })
    for (const call of vi.mocked(runHarnessArgs).mock.calls) {
      expect(call[0]).toBe('codex')
      expect(call[2]).toBe(pinned.userHome)
      expect(call[4]).toBe(pinned)
    }
    expect(runHarnessArgs).toHaveBeenCalled()
    if (method === 'cc-plugin-marketplace') {
      expect(isPluginRegistered).toHaveBeenCalledWith('fixture@market', pinned)
      expect(invalidateCodexPluginCache).toHaveBeenCalledWith(pinned)
    } else expect(isMcpServerRegistered).toHaveBeenCalledWith('fixture', pinned)
    expect(backup).toHaveBeenCalledWith({ files: [] }, ctx)
  })
  it('keeps shared skills on descriptor policy and pins post-write presence/audits', async () => {
    drift('claude')
    const ctx = fixture('npx-skill-installer', 'npx skills add owner/fixture --copy')
    materializeNpxSkillOnSpawn()
    expect(await installNpxSkillInstaller(ctx)).toMatchObject({
      ok: true,
      appliedFiles: [join(pinned.userHome, '.agents', 'skills', 'fixture', 'SKILL.md')],
    })
    expect(spawnCmd).toHaveBeenCalledWith(
      ctx,
      'npx skills add owner/fixture --copy --agent codex',
      [],
      60_000,
      { neutralCwd: true },
    )
    expect(lstat).toHaveBeenCalledWith(join(pinned.platform.skillsDir, 'fixture'))
    expect(access).toHaveBeenCalledWith(join(pinned.platform.skillsDir, 'fixture', 'SKILL.md'))
    expect(snapshotSkillNames).toHaveBeenCalledWith(pinned.platform.skillsDir)
    expect(auditPostInstall).toHaveBeenCalledWith(ctx, new Set(), pinned.platform.skillsDir)
  })
  it('pins git clone tilde expansion and consented runtime repair to selected homes', async () => {
    drift('claude')
    const ctx = fixture(
      'git-clone-with-setup',
      'git clone https://example.com/gstack.git ~/clone',
      'gstack',
    )
    expect(await installGitCloneWithSetup(ctx)).toMatchObject({
      ok: true,
      appliedFiles: [join(pinned.userHome, 'clone')],
    })
    expect(repairGstackCodexRuntimeAfterConfirm).toHaveBeenCalledWith({
      host: 'codex',
      confirmed: true,
      sourceDir: join(pinned.userHome, 'clone'),
      codexHome: pinned.nativeHome,
      hostContext: pinned,
    })
  })
  it('writes Claude hooks only under custom nativeHome despite ambient Codex', async () => {
    pinned = context('claude')
    const settingsPath = join(pinned.nativeHome, 'settings.json')
    await mkdir(pinned.nativeHome, { recursive: true })
    await writeFile(settingsPath, '{"env":{"KEEP":"yes"}}')
    const ctx = fixture('cc-hook-add', 'node bin/harnessed-inject-state.mjs')
    expect(await installCcHookAdd(ctx)).toMatchObject({ ok: true, appliedFiles: [settingsPath] })
    const settings = JSON.parse(await readFile(settingsPath, 'utf8'))
    expect(settings.env).toEqual({ KEEP: 'yes' })
    expect(settings.hooks.SessionStart).toHaveLength(1)
    expect(existsSync(join(root, 'ambient', '.claude', 'settings.json'))).toBe(false)
    expect(runHarnessArgs).not.toHaveBeenCalled()
    expect(updateInstalled).toHaveBeenCalledWith(root, 'fixture', '', '', pinned)
    expect(await installCcHookAdd(ctx)).toMatchObject({ ok: true, alreadyInstalled: true })
    expect(recordObservedInstall).toHaveBeenCalledWith(root, 'fixture', '', '', pinned)
  })
  it('pins Codex hook files, CLI and trust and retains first-party repair', async () => {
    const ctx = fixture('cc-hook-add', 'node bin/harnessed-inject-state.mjs')
    ctx.opts.codexHookTrust = 'grant'
    ctx.opts.updateInstalled = true
    drift('claude')
    expect(resolveCodexHome(pinned)).toBe(pinned.nativeHome)
    expect(await installCcHookAdd(ctx)).toMatchObject({ ok: true })
    const pluginFile = join(
      pinned.nativeHome,
      'harnessed',
      'marketplace',
      'plugins',
      'harnessed-fixture',
      '.codex-plugin',
      'plugin.json',
    )
    expect(existsSync(pluginFile)).toBe(true)
    expect(existsSync(join(root, 'ambient-codex', 'harnessed'))).toBe(false)
    expect(trustCodexHooks).toHaveBeenCalledWith(['harnessed-fixture@harnessed-local'], {
      hostContext: pinned,
      cwd: pinned.userHome,
    })
    expect(isCodexPluginInstalled).toHaveBeenCalledWith('harnessed-fixture@harnessed-local', pinned)
    for (const call of vi.mocked(runHarnessArgs).mock.calls) expect(call[4]).toBe(pinned)
    expect(withCodexPluginLock).toHaveBeenCalled()
    await writeFile(pluginFile, '{}')
    expect(await installCodexHook(ctx)).toMatchObject({ ok: true })
    expect(JSON.parse(await readFile(pluginFile, 'utf8')).name).toBe('harnessed-fixture')
  })
  it('preserves trust deny, dry-run and confirmation refusal', async () => {
    const ctx = fixture('cc-hook-add', 'node bin/harnessed-inject-state.mjs')
    ctx.opts.dryRun = true
    expect(await installCodexHook(ctx)).toHaveProperty('aborted', true)
    expect(runHarnessArgs).not.toHaveBeenCalled()
    expect(trustCodexHooks).not.toHaveBeenCalled()
    expect(updateInstalled).not.toHaveBeenCalled()
    expect(existsSync(pinned.nativeHome)).toBe(false)
    ctx.opts.dryRun = false
    vi.mocked(confirmAt).mockResolvedValueOnce({ proceed: false, reason: 'user-cancel' })
    expect(await installCodexHook(ctx)).toHaveProperty('aborted', true)
    expect(existsSync(pinned.nativeHome)).toBe(false)
    expect(await installCodexHook(ctx)).toMatchObject({
      ok: true,
      trustPending: expect.any(String),
    })
    expect(listCodexHooks).toHaveBeenCalledWith({ hostContext: pinned, cwd: pinned.userHome })
    expect(trustCodexHooks).not.toHaveBeenCalled()
  })
  it('removes only selected Codex hook paths and scopes native teardown/trust', async () => {
    const pluginDir = join(
      pinned.nativeHome,
      'harnessed',
      'marketplace',
      'plugins',
      'harnessed-fixture',
    )
    expect(
      await installCodexHook(fixture('cc-hook-add', 'node bin/harnessed-inject-state.mjs')),
    ).toMatchObject({ ok: true })
    vi.clearAllMocks()
    const ambientDir = join(
      root,
      'ambient-codex',
      'harnessed',
      'marketplace',
      'plugins',
      'harnessed-fixture',
    )
    await mkdir(ambientDir, { recursive: true })
    await writeFile(join(ambientDir, 'fixture'), 'untouched')
    expect(await removeCodexHook('fixture', 'SessionStart', pinned)).toMatchObject({ ok: true })
    expect(existsSync(pluginDir)).toBe(false)
    expect(await readFile(join(ambientDir, 'fixture'), 'utf8')).toBe('untouched')
    expect(listCodexHooks).toHaveBeenCalledWith({ hostContext: pinned, cwd: pinned.userHome })
    expect(untrustCodexHooks).toHaveBeenCalledWith(
      ['harnessed-fixture@harnessed-local:hooks/hooks.json:session_start:0:0'],
      { hostContext: pinned, cwd: pinned.userHome },
    )
    for (const call of vi.mocked(runHarnessArgs).mock.calls) expect(call[4]).toBe(pinned)
  })
  it('keeps direct legacy Codex hook removal CLI and trust argument shapes', async () => {
    const ctx = fixture('cc-hook-add', 'node bin/harnessed-inject-state.mjs')
    delete ctx.hostContext
    expect(await installCodexHook(ctx)).toMatchObject({ ok: true })
    vi.clearAllMocks()
    expect(await removeCodexHook('fixture', 'SessionStart')).toMatchObject({ ok: true })
    expect(listCodexHooks).toHaveBeenCalledWith()
    expect(untrustCodexHooks).toHaveBeenCalledWith([
      'harnessed-fixture@harnessed-local:hooks/hooks.json:session_start:0:0',
    ])
    for (const call of vi.mocked(runHarnessArgs).mock.calls) expect(call).toHaveLength(4)
  })
})
describe('Codex hook teardown confinement', () => {
  async function seed() {
    const ctx = fixture('cc-hook-add', 'node bin/harnessed-inject-state.mjs')
    expect(await installCodexHook(ctx)).toMatchObject({ ok: true })
    return codexHookPaths(pinned.nativeHome, 'fixture')
  }

  function expectNoNativeMutation() {
    expect(runHarnessArgs).not.toHaveBeenCalled()
    expect(isCodexPluginInstalled).not.toHaveBeenCalled()
    expect(listCodexHooks).not.toHaveBeenCalled()
    expect(untrustCodexHooks).not.toHaveBeenCalled()
  }

  it('allows a captured nativeHome alias while confining removal to its canonical generated subtree', async () => {
    const paths = await seed()
    const canonicalHome = join(root, 'canonical-native-home')
    await rename(pinned.nativeHome, canonicalHome)
    await symlink(
      canonicalHome,
      pinned.nativeHome,
      process.platform === 'win32' ? 'junction' : 'dir',
    )
    await writeFile(join(canonicalHome, 'USER.txt'), 'native-root sentinel')
    vi.clearAllMocks()
    expect(await removeCodexHook('fixture', 'SessionStart', pinned)).toMatchObject({ ok: true })
    expect(existsSync(paths.pluginDir)).toBe(false)
    expect(existsSync(pinned.nativeHome)).toBe(true)
    expect(await readFile(join(canonicalHome, 'USER.txt'), 'utf8')).toBe('native-root sentinel')
    expect(runHarnessArgs).toHaveBeenCalled()
  })

  it.each([
    'marketplace-root',
    'plugin-parent',
    'plugin-payload',
    'plugin-nested',
    'data-parent',
    'data-payload',
    'marketplace-metadata',
    'cache-root',
  ])('rejects %s junction before native calls or delete', async (kind) => {
    const paths = await seed()
    const target =
      kind === 'marketplace-root'
        ? paths.marketplaceRoot
        : kind === 'plugin-parent'
          ? paths.pluginsDir
          : kind === 'plugin-payload'
            ? paths.pluginDir
            : kind === 'plugin-nested'
              ? join(paths.pluginDir, 'hooks')
              : kind === 'data-parent'
                ? join(pinned.nativeHome, 'plugins', 'data')
                : kind === 'data-payload'
                  ? paths.dataDir
                  : kind === 'marketplace-metadata'
                    ? join(paths.marketplaceRoot, '.agents')
                    : paths.cacheMarketplaceDir
    await mkdir(target, { recursive: true })
    const outside = join(root, 'outside-junction')
    await rename(target, outside)
    await symlink(outside, target, process.platform === 'win32' ? 'junction' : 'dir')
    await writeFile(join(outside, 'USER.txt'), 'external sentinel')
    vi.clearAllMocks()
    const removeSpy = vi.mocked(rm)
    const result = await removeCodexHook('fixture', 'SessionStart', pinned)
    expect(result).toMatchObject({ ok: false, phase: 'preflight' })
    if (!result.ok) expect(result.error).toMatch(/symbolic|junction|canonical|confined/i)
    expectNoNativeMutation()
    expect(removeSpy).not.toHaveBeenCalled()
    expect(existsSync(target)).toBe(true)
    expect(await readFile(join(outside, 'USER.txt'), 'utf8')).toBe('external sentinel')
  })

  it.each([
    'plugin',
    'data',
    'marketplace',
  ])('rejects foreign content in the same-named %s namespace', async (kind) => {
    const paths = await seed()
    const target =
      kind === 'plugin' ? paths.pluginDir : kind === 'data' ? paths.dataDir : paths.marketplaceRoot
    await writeFile(join(target, 'USER.txt'), 'foreign sentinel')
    vi.clearAllMocks()
    const removeSpy = vi.mocked(rm)
    expect(await removeCodexHook('fixture', 'SessionStart', pinned)).toMatchObject({
      ok: false,
      phase: 'preflight',
    })
    expectNoNativeMutation()
    expect(removeSpy).not.toHaveBeenCalled()
    expect(await readFile(join(target, 'USER.txt'), 'utf8')).toBe('foreign sentinel')
  })

  it('does not claim a same-named directory without a generated identity', async () => {
    const paths = codexHookPaths(pinned.nativeHome, 'fixture')
    await mkdir(paths.pluginDir, { recursive: true })
    await writeFile(join(paths.pluginDir, 'USER.txt'), 'foreign sentinel')
    const removeSpy = vi.mocked(rm)
    expect(await removeCodexHook('fixture', 'SessionStart', pinned)).toMatchObject({
      ok: false,
      phase: 'preflight',
    })
    expectNoNativeMutation()
    expect(removeSpy).not.toHaveBeenCalled()
    expect(await readFile(join(paths.pluginDir, 'USER.txt'), 'utf8')).toBe('foreign sentinel')
  })

  it('does nothing only when read-only listing confirms the exact plugin absent and no payload/data exists', async () => {
    vi.mocked(listCodexPluginMetadata).mockResolvedValue([])
    expect(await removeCodexHook('fixture', 'SessionStart', pinned)).toEqual({
      ok: true,
      removedPaths: [],
    })
    expect(listCodexPluginMetadata).toHaveBeenCalledWith(pinned)
    expectNoNativeMutation()
  })
  it('preserves proven payload/data when native listing is unknown instead of treating a false boolean as absence', async () => {
    const paths = await seed()
    const payloadPath = join(paths.pluginDir, 'hooks', 'hooks.json')
    const dataPath = join(paths.dataDir, 'install.json')
    const payload = await readFile(payloadPath, 'utf8')
    const data = await readFile(dataPath, 'utf8')
    vi.clearAllMocks()
    vi.mocked(isCodexPluginInstalled).mockResolvedValue(false)
    vi.mocked(listCodexPluginMetadata).mockResolvedValue(null)
    const result = await removeCodexHook('fixture', 'SessionStart', pinned)
    expect(result).toMatchObject({ ok: false, phase: 'preflight' })
    if (!result.ok) expect(result.error).toMatch(/registration is unknown/i)
    expect(listCodexPluginMetadata).toHaveBeenCalledWith(pinned)
    expectNoNativeMutation()
    expect(rm).not.toHaveBeenCalled()
    expect(await readFile(payloadPath, 'utf8')).toBe(payload)
    expect(await readFile(dataPath, 'utf8')).toBe(data)
  })
  it('continues proven local cleanup only when listing confirms the exact native plugin absent', async () => {
    const paths = await seed()
    vi.clearAllMocks()
    vi.mocked(listCodexPluginMetadata).mockResolvedValue([])
    expect(await removeCodexHook('fixture', 'SessionStart', pinned)).toMatchObject({ ok: true })
    expect(listCodexPluginMetadata).toHaveBeenCalledWith(pinned)
    expect(isCodexPluginInstalled).not.toHaveBeenCalled()
    expect(runHarnessArgs).not.toHaveBeenCalledWith(
      'codex',
      ['plugin', 'remove', paths.pluginId],
      pinned.userHome,
      60_000,
      pinned,
    )
    expect(untrustCodexHooks).toHaveBeenCalled()
    expect(existsSync(paths.pluginDir)).toBe(false)
    expect(existsSync(paths.dataDir)).toBe(false)
  })
  it.each([
    { entries: null },
    {
      entries: [
        { pluginId: 'harnessed-fixture@harnessed-local', installed: true as const, enabled: true },
      ],
    },
  ])('refuses empty local targets without native absence evidence: %j', async ({ entries }) => {
    vi.mocked(listCodexPluginMetadata).mockResolvedValue(entries)
    expect(await removeCodexHook('fixture', 'SessionStart', pinned)).toMatchObject({
      ok: false,
      phase: 'preflight',
    })
    expect(listCodexPluginMetadata).toHaveBeenCalledWith(pinned)
    expectNoNativeMutation()
    expect(rm).not.toHaveBeenCalled()
  })
  it.each([
    'timeout',
    'method-missing',
  ] as const)('reports partial native removal on untrust %s and preserves generated payload/data', async (failure) => {
    const paths = await seed()
    const payloadPath = join(paths.pluginDir, 'hooks', 'hooks.json')
    const dataPath = join(paths.dataDir, 'install.json')
    const payload = await readFile(payloadPath, 'utf8')
    const data = await readFile(dataPath, 'utf8')
    await writeFile(join(pinned.nativeHome, 'USER.txt'), 'native-root sentinel')
    vi.clearAllMocks()
    vi.mocked(untrustCodexHooks).mockResolvedValue({
      ok: false,
      failure,
      detail: 'fixture RPC failure',
    })
    const result = await removeCodexHook('fixture', 'SessionStart', pinned)
    expect(result).toMatchObject({ ok: false, phase: 'spawn' })
    if (!result.ok) {
      expect(result.error).toContain(failure)
      expect(result.error).toMatch(/partial|already removed/i)
    }
    expect(runHarnessArgs).toHaveBeenCalledWith(
      'codex',
      ['plugin', 'remove', 'harnessed-fixture@harnessed-local'],
      pinned.userHome,
      60_000,
      pinned,
    )
    expect(untrustCodexHooks).toHaveBeenCalled()
    expect(rm).not.toHaveBeenCalled()
    expect(await readFile(payloadPath, 'utf8')).toBe(payload)
    expect(await readFile(dataPath, 'utf8')).toBe(data)
    expect(await readFile(join(pinned.nativeHome, 'USER.txt'), 'utf8')).toBe('native-root sentinel')
  })
  it('recognizes generated legacy version metadata without claiming current manifest history', async () => {
    const paths = await seed()
    const infoPath = join(paths.pluginDir, 'install.json')
    const info = JSON.parse(await readFile(infoPath, 'utf8'))
    info.harnessedVersion = '3.9.0'
    await writeFile(infoPath, JSON.stringify(info))
    await writeFile(join(paths.dataDir, 'install.json'), JSON.stringify(info))
    const descriptorPath = join(paths.pluginDir, '.codex-plugin', 'plugin.json')
    const descriptor = JSON.parse(await readFile(descriptorPath, 'utf8'))
    descriptor.version = '0.8.0'
    await writeFile(descriptorPath, JSON.stringify(descriptor))
    const marketplace = JSON.parse(await readFile(paths.marketplaceJson, 'utf8'))
    marketplace.plugins[0].version = '0.8.0'
    await writeFile(paths.marketplaceJson, JSON.stringify(marketplace))
    vi.clearAllMocks()
    expect(await removeCodexHook('fixture', 'SessionStart', pinned)).toMatchObject({ ok: true })
    expect(existsSync(paths.pluginDir)).toBe(false)
  })

  it.each([
    'deny',
    'ask',
  ] as const)('never records a successful receipt for %s trust with an empty currentHash', async (mode) => {
    await seed()
    vi.clearAllMocks()
    vi.mocked(listCodexHooks).mockResolvedValue({
      ok: true,
      value: [
        {
          key: 'harnessed-fixture@harnessed-local:hooks/hooks.json:session_start:0:0',
          eventName: 'SessionStart',
          trustStatus: 'trusted',
          currentHash: '  ',
        },
      ],
    })
    const ctx = fixture('cc-hook-add', 'node bin/harnessed-inject-state.mjs')
    ctx.opts.codexHookTrust = mode
    expect(await installCodexHook(ctx)).toMatchObject({
      ok: true,
      alreadyInstalled: true,
      trustPending: expect.any(String),
    })
    expect(recordObservedInstall).not.toHaveBeenCalled()
    expect(updateInstalled).not.toHaveBeenCalled()
    expect(trustCodexHooks).not.toHaveBeenCalled()
  })

  it('does not write a fresh hook receipt while trust is pending', async () => {
    expect(
      await installCodexHook(fixture('cc-hook-add', 'node bin/harnessed-inject-state.mjs')),
    ).toMatchObject({ ok: true, trustPending: expect.any(String) })
    expect(updateInstalled).not.toHaveBeenCalled()
  })
})

describe('unproven external update policy', () => {
  it.each([
    'gstack',
    'ui-ux-pro-max',
  ])('preserves fresh default shipped %s installation through consent and mocked upstream spawn', async (name) => {
    const manifest = parse(
      await readFile(new URL(`../../manifests/skill-packs/${name}.yaml`, import.meta.url), 'utf8'),
    ) as Manifest
    const install = manifest.spec.harness_overrides?.codex?.install
    if (!install || install.method !== 'git-clone-with-setup')
      throw new Error('Missing shipped Codex git installer')
    const ctx = fixture(install.method, install.cmd, name)
    ctx.manifest = { ...manifest, spec: { ...manifest.spec, install } }
    gitSha = install.git_ref
    expect(await installGitCloneWithSetup(ctx)).toMatchObject({ ok: true })
    expect(confirmAt).toHaveBeenCalledWith('L2', { ...ctx, level: 'L2' })
    expect(spawnCmd).toHaveBeenCalledWith(ctx, install.cmd, [], 60_000, { posixShell: true })
    expect(updateInstalled).toHaveBeenCalledWith(root, name, install.git_ref, '', pinned)
  })
  it.each([
    'gstack-source',
    'gstack-native-skill',
    'ui-shared-skill',
  ])('protects a shipped manifest known %s target with incomplete user content', async (targetKind) => {
    const name = targetKind.startsWith('gstack') ? 'gstack' : 'ui-ux-pro-max'
    const manifest = parse(
      await readFile(new URL(`../../manifests/skill-packs/${name}.yaml`, import.meta.url), 'utf8'),
    ) as Manifest
    const install = manifest.spec.harness_overrides?.codex?.install
    if (!install || install.method !== 'git-clone-with-setup')
      throw new Error('Missing shipped Codex git installer')
    const ctx = fixture(install.method, install.cmd, name)
    ctx.manifest = { ...manifest, spec: { ...manifest.spec, install } }
    const target =
      targetKind === 'gstack-source'
        ? join(pinned.userHome, 'gstack')
        : targetKind === 'gstack-native-skill'
          ? join(pinned.nativeHome, 'skills', 'gstack-review')
          : join(pinned.platform.skillsDir, name)
    await mkdir(target, { recursive: true })
    await writeFile(join(target, 'USER.txt'), 'manual content')
    expect(await installGitCloneWithSetup(ctx)).toMatchObject({
      ok: false,
      phase: 'preflight',
      error: { keyword: 'update-unsupported' },
    })
    expect(await readFile(join(target, 'USER.txt'), 'utf8')).toBe('manual content')
    expect(confirmAt).not.toHaveBeenCalled()
    expect(spawnCmd).not.toHaveBeenCalled()
    expect(updateInstalled).not.toHaveBeenCalled()
  })
  it.each([
    false,
    null,
  ])('post-add hook enablement %j prevents trust and receipt', async (enabled) => {
    const ctx = fixture('cc-hook-add', 'node bin/harnessed-inject-state.mjs')
    ctx.opts.codexHookTrust = 'grant'
    vi.mocked(isCodexPluginInstalled).mockResolvedValueOnce(false).mockResolvedValue(true)
    vi.mocked(readPluginEnablement).mockResolvedValue(enabled)
    expect(await installCodexHook(ctx)).toMatchObject({ ok: false, phase: 'verify' })
    expect(runHarnessArgs).toHaveBeenCalled()
    expect(trustCodexHooks).not.toHaveBeenCalled()
    expect(updateInstalled).not.toHaveBeenCalled()
  })
  it.each([
    'claude',
    'codex',
  ] as const)('refuses %s plugin marketplace drift even when exact manifest probe is false', async (hostId) => {
    pinned = context(hostId)
    const ctx = fixture(
      'cc-plugin-marketplace',
      hostId === 'codex'
        ? 'codex plugin add fixture@new-market'
        : 'claude plugin install fixture@new-market',
    )
    ctx.opts.updateInstalled = true
    vi.mocked(isPluginRegistered).mockImplementation(
      async (id) => id === 'fixture' || id === 'fixture@old-market',
    )
    expect(await installCcPluginMarketplace(ctx)).toMatchObject({
      ok: false,
      phase: 'preflight',
      error: { keyword: 'update-unsupported' },
    })
    expect(confirmAt).not.toHaveBeenCalled()
    expect(runHarnessArgs).not.toHaveBeenCalled()
    expect(updateInstalled).not.toHaveBeenCalled()
  })
  it.each([
    false,
    true,
  ])('preserves incomplete GSD native resources for update=%s without a ready probe', async (update) => {
    const ctx = fixture('npm-cli', 'npx @opengsd/gsd-core --codex --global', 'gsd')
    ctx.manifest.spec.component_type = 'command'
    ctx.manifest.spec.ownership = {
      resources: [
        {
          root: 'native-home',
          kind: 'directory',
          selector: { names: ['gsd-core'] },
          marker: { path: 'bin/gsd-tools.cjs', contains: 'GSD Tools' },
        },
      ],
    } as never
    ctx.opts.updateInstalled = update
    const target = join(pinned.nativeHome, 'gsd-core')
    await mkdir(target, { recursive: true })
    await writeFile(join(target, 'USER.txt'), 'manual content')
    await expect(snapshotDeclaredOwnership(ctx)).resolves.toMatchObject({ paths: [target] })
    expect(await installNpmCli(ctx)).toMatchObject({
      ok: false,
      phase: 'preflight',
      error: { keyword: 'update-unsupported' },
    })
    expect(await readFile(join(target, 'USER.txt'), 'utf8')).toBe('manual content')
    expect(confirmAt).not.toHaveBeenCalled()
    expect(spawnCmd).not.toHaveBeenCalled()
    expect(updateInstalled).not.toHaveBeenCalled()
  })
  it('refuses default compound git mutation with an unknown output footprint', async () => {
    const target = join(pinned.platform.skillsDir, 'fixture')
    await mkdir(target, { recursive: true })
    await writeFile(join(target, 'USER.txt'), 'manual content')
    const ctx = fixture(
      'git-clone-with-setup',
      'git clone https://example.com/fixture.git ~/cache && rm -rf ~/.agents/skills/fixture && cp -R ~/cache/skills/fixture ~/.agents/skills/fixture',
    )
    expect(await installGitCloneWithSetup(ctx)).toMatchObject({
      ok: false,
      phase: 'preflight',
      error: { keyword: 'update-unsupported' },
    })
    expect(await readFile(join(target, 'USER.txt'), 'utf8')).toBe('manual content')
    expect(confirmAt).not.toHaveBeenCalled()
    expect(spawnCmd).not.toHaveBeenCalled()
  })
  it.each(
    methods.slice(4),
  )('%s never rewrites or receipts disabled/unknown Codex registration', async (method, install, cmd) => {
    const ctx = fixture(method, cmd)
    for (const metadata of [
      [{ name: 'fixture', enabled: false }],
      [{ name: 'fixture', enabled: null }],
      null,
    ]) {
      vi.mocked(listCodexMcpServerMetadata).mockResolvedValue(metadata)
      expect(await install(ctx)).toMatchObject({ ok: false, phase: 'verify' })
    }
    expect(confirmAt).not.toHaveBeenCalled()
    expect(runHarnessArgs).not.toHaveBeenCalled()
    expect(updateInstalled).not.toHaveBeenCalled()
    expect(recordObservedInstall).not.toHaveBeenCalled()
  })
  it.each(
    methods.slice(4),
  )('%s refuses post-add disabled or unknown enablement without receipt', async (method, install, cmd) => {
    const ctx = fixture(method, cmd)
    for (const enabled of [false, null]) {
      vi.mocked(listCodexMcpServerMetadata)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ name: 'fixture', enabled }])
      expect(await install(ctx)).toMatchObject({ ok: false, phase: 'verify' })
    }
    expect(updateInstalled).not.toHaveBeenCalled()
    expect(recordObservedInstall).not.toHaveBeenCalled()
  })
  it.each(
    methods.slice(4),
  )('%s refuses an already registered disabled server without receipt', async (method, install, cmd) => {
    vi.mocked(isAlreadyInstalled).mockResolvedValue(true)
    vi.mocked(listCodexMcpServerMetadata).mockResolvedValue([{ name: 'fixture', enabled: false }])
    expect(await install(fixture(method, cmd))).toMatchObject({ ok: false, phase: 'verify' })
    expect(recordObservedInstall).not.toHaveBeenCalled()
    expect(runHarnessArgs).not.toHaveBeenCalled()
  })
  it('does not repair a user-disabled first-party Codex hook', async () => {
    vi.mocked(readPluginEnablement).mockResolvedValue(false)
    expect(
      await installCodexHook(fixture('cc-hook-add', 'node bin/harnessed-inject-state.mjs')),
    ).toMatchObject({ ok: false, phase: 'verify' })
    expect(existsSync(pinned.nativeHome)).toBe(false)
    expect(confirmAt).not.toHaveBeenCalled()
    expect(trustCodexHooks).not.toHaveBeenCalled()
    expect(updateInstalled).not.toHaveBeenCalled()
  })
  it.each(
    methods.slice(1, 3),
  )('%s preserves existing non-SKILL user directories despite a false presence probe', async (method, install, cmd) => {
    const ctx = fixture(method, cmd)
    ctx.opts.updateInstalled = true
    const target =
      method === 'npx-skill-installer'
        ? join(pinned.platform.skillsDir, 'fixture')
        : join(pinned.userHome, 'clone')
    await mkdir(target, { recursive: true })
    await writeFile(join(target, 'USER.txt'), 'manual content')
    expect(await install(ctx)).toMatchObject({
      ok: false,
      phase: 'preflight',
      error: { keyword: 'update-unsupported' },
    })
    expect(await readFile(join(target, 'USER.txt'), 'utf8')).toBe('manual content')
    expect(confirmAt).not.toHaveBeenCalled()
    expect(spawnCmd).not.toHaveBeenCalled()
    expect(updateInstalled).not.toHaveBeenCalled()
  })
  it.each(
    methods.slice(1, 3),
  )('%s refuses default install takeover of an incomplete user target', async (method, install, cmd) => {
    const target =
      method === 'npx-skill-installer'
        ? join(pinned.platform.skillsDir, 'fixture')
        : join(pinned.userHome, 'clone')
    await mkdir(target, { recursive: true })
    await writeFile(join(target, 'USER.txt'), 'manual content')
    expect(await install(fixture(method, cmd))).toMatchObject({
      ok: false,
      phase: 'preflight',
      error: { keyword: 'update-unsupported' },
    })
    expect(await readFile(join(target, 'USER.txt'), 'utf8')).toBe('manual content')
    expect(confirmAt).not.toHaveBeenCalled()
    expect(spawnCmd).not.toHaveBeenCalled()
    expect(updateInstalled).not.toHaveBeenCalled()
  })
  it.each(
    methods.slice(1, 3),
  )('%s refuses update with an unreviewed compound/multi-skill footprint even if absent', async (method, install, cmd) => {
    const ctx = fixture(
      method,
      method === 'git-clone-with-setup' ? `${cmd} && rm -rf ~/clone` : cmd,
    )
    ctx.opts.updateInstalled = true
    expect(await install(ctx)).toMatchObject({
      ok: false,
      phase: 'preflight',
      error: { keyword: 'update-unsupported' },
    })
    expect(confirmAt).not.toHaveBeenCalled()
    expect(spawnCmd).not.toHaveBeenCalled()
    expect(updateInstalled).not.toHaveBeenCalled()
  })
  it.each([
    'claude',
    'codex',
  ] as const)('does not claim %s disabled/unknown plugin ready or repair it', async (hostId) => {
    pinned = context(hostId)
    vi.mocked(isAlreadyInstalled).mockResolvedValue(true)
    const ctx = fixture(
      'cc-plugin-marketplace',
      hostId === 'codex'
        ? 'codex plugin add fixture@market'
        : 'claude plugin install fixture@market',
    )
    for (const enabled of [false, null]) {
      vi.mocked(readPluginEnablement).mockResolvedValue(enabled)
      expect(await installCcPluginMarketplace(ctx)).toMatchObject({ ok: false, phase: 'verify' })
    }
    expect(readPluginEnablement).toHaveBeenCalledWith('fixture@market', pinned)
    expect(confirmAt).not.toHaveBeenCalled()
    expect(runHarnessArgs).not.toHaveBeenCalled()
    expect(recordObservedInstall).not.toHaveBeenCalled()
  })
  it.each(
    methods.slice(0, 4),
  )('%s refuses manual/shared or channel-drift updates before consent or writes', async (method, install, cmd) => {
    const ctx = fixture(method, method === 'npx-skill-installer' ? `${cmd} --skill fixture` : cmd)
    ctx.opts.updateInstalled = true
    if (method === 'npm-cli') ctx.manifest.spec.component_type = 'command'
    vi.mocked(isAlreadyInstalled).mockImplementation(
      async (_ctx, opts) => opts?.honorUpdateFlag === false,
    )
    expect(await install(ctx)).toMatchObject({
      ok: false,
      phase: 'preflight',
      error: { keyword: 'update-unsupported', suggest: expect.any(String) },
    })
    expect(confirmAt).not.toHaveBeenCalled()
    expect(backup).not.toHaveBeenCalled()
    expect(spawnCmd).not.toHaveBeenCalled()
    expect(runHarnessArgs).not.toHaveBeenCalled()
    expect(updateInstalled).not.toHaveBeenCalled()
    expect(recordObservedInstall).not.toHaveBeenCalled()
    if (method === 'npx-skill-installer') {
      expect(isAlreadyInstalled).toHaveBeenCalledWith(ctx, { honorUpdateFlag: false })
    }
  })
  it.each(
    methods.slice(0, 4),
  )('%s permits fresh install with update requested and no resource', async (method, install, cmd) => {
    const knownCmd =
      method === 'npx-skill-installer'
        ? `${cmd} --skill fixture`
        : method === 'git-clone-with-setup'
          ? 'git clone https://example.com/fixture.git ~/clone'
          : cmd
    const ctx = fixture(method, knownCmd)
    ctx.opts.updateInstalled = true
    if (method === 'npx-skill-installer') materializeNpxSkillOnSpawn()
    expect(await install(ctx)).toMatchObject({ ok: true })
    expect(updateInstalled).toHaveBeenCalled()
  })
  it('retains explicit neutral global npm CLI updates', async () => {
    const ctx = fixture('npm-cli', 'npm install -g fixture')
    ctx.opts.updateInstalled = true
    expect(await installNpmCli(ctx)).toMatchObject({ ok: true })
    expect(spawnCmd).toHaveBeenCalled()
  })
})
