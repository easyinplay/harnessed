import { EventEmitter } from 'node:events'
import { join, resolve } from 'node:path'
import { PassThrough } from 'node:stream'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { InstallContext, Manifest } from '../../src/installers/lib/types.js'
import type { HostInstallContext } from '../../src/platform/hostInstallContext.js'
import { descriptorFor } from '../../src/platform/platform.js'

const io = vi.hoisted(() => ({
  read: vi.fn(),
  stat: vi.fn(),
  access: vi.fn(),
  realpath: vi.fn(),
  lstat: vi.fn(),
  write: vi.fn(),
  run: vi.fn(),
  spawn: vi.fn(),
  exec: vi.fn(),
  shell: vi.fn(),
}))
vi.mock('node:fs/promises', () => ({
  readFile: io.read,
  stat: io.stat,
  access: io.access,
  realpath: io.realpath,
  lstat: io.lstat,
  symlink: io.write,
  rm: io.write,
  mkdtemp: io.write,
  readdir: io.write,
  writeFile: io.write,
}))
vi.mock('node:child_process', () => ({ spawn: io.spawn, execFile: io.exec }))
vi.mock('../../src/installers/lib/runClaudeArgs.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/installers/lib/runClaudeArgs.js')>()),
  runHarnessArgs: io.run,
}))
vi.mock('../../src/installers/lib/spawn.js', () => ({
  spawnCmd: io.shell,
  DEFAULT_VERIFY_TIMEOUT_MS: 5000,
}))
vi.mock('../../src/installers/lib/resolveBash.js', () => ({
  resolveBash: () => ({ path: 'fixture-bash' }),
}))

import {
  listCodexHooks,
  spawnCodexAppServer,
  trustCodexHooks,
} from '../../src/installers/lib/codexHookTrust.js'
import * as mcp from '../../src/installers/lib/codexMcpServers.js'
import * as plugins from '../../src/installers/lib/codexPlugins.js'
import { repairGstackCodexRuntimeAfterConfirm } from '../../src/installers/lib/gstackRuntime.js'
import { detectSkillPresence, isAlreadyInstalled } from '../../src/installers/lib/idempotent.js'
import {
  isMcpServerRegistered,
  isPluginRegistered,
  readPluginEnablement,
  readUserClaudeJson,
} from '../../src/installers/lib/readClaudeConfig.js'
import { verifySkillRuntime } from '../../src/installers/lib/skillRuntime.js'
import { verifyInstalled } from '../../src/installers/lib/verifyInstalled.js'

function context(hostId: 'claude' | 'codex', root = 'native A'): HostInstallContext {
  const userHome = resolve('fixture observation home')
  return Object.freeze({
    hostId,
    os: 'linux',
    userHome,
    platform: Object.freeze(descriptorFor(hostId, userHome)),
    nativeHome: resolve(root),
  })
}
function ctx(
  name: string,
  hostContext = context('codex'),
): InstallContext & { hostContext: HostInstallContext } {
  return {
    hostContext,
    cwd: hostContext.userHome,
    level: 'L2',
    opts: {
      apply: true,
      dryRun: false,
      system: false,
      nonInteractive: true,
      fullDiff: false,
      color: false,
    },
    manifest: {
      metadata: { name },
      spec: {
        install: {
          method: 'npx-skill-installer',
          cmd: 'npx skills add owner/fixture',
          idempotent_check: '',
        },
        verify: { cmd: 'true' },
      },
    } as Manifest,
  }
}
function reply(stdout: string) {
  return { exitCode: 0, stdout, stderr: '' }
}
function pluginJson(enabled = false) {
  return JSON.stringify({ installed: [{ pluginId: 'demo@expected', installed: true, enabled }] })
}
beforeEach(() => {
  vi.resetAllMocks()
  plugins.invalidateCodexPluginCache()
  mcp.invalidateCodexMcpCache()
  vi.stubEnv('HARNESSED_PLATFORM', 'claude')
  vi.stubEnv('HOME', resolve('ambient drift'))
  vi.stubEnv('USERPROFILE', resolve('ambient drift'))
  vi.stubEnv('CODEX_HOME', resolve('ambient codex'))
  vi.stubEnv('CLAUDE_CONFIG_DIR', resolve('ambient claude'))
  vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '')
  const absent = Object.assign(new Error('fixture ENOENT'), { code: 'ENOENT' })
  io.read.mockRejectedValue(absent)
  io.stat.mockRejectedValue(absent)
  io.access.mockRejectedValue(absent)
  io.realpath.mockImplementation(async (p: string) => p)
  io.run.mockResolvedValue(reply('[]'))
  io.shell.mockResolvedValue(reply(''))
})
afterEach(() => vi.unstubAllEnvs())

it('Claude registry uses nativeHome after ambient host drift', async () => {
  const c = context('claude')
  vi.stubEnv('HARNESSED_PLATFORM', 'codex')
  io.read.mockImplementation(async (p: string) =>
    p === join(c.nativeHome, 'plugins', 'installed_plugins.json')
      ? JSON.stringify({ plugins: { 'demo@expected': [{}] } })
      : '{}',
  )
  expect(await isPluginRegistered('demo@expected', c)).toBe(true)
  expect(io.read.mock.calls.map(([p]) => p)).toEqual([
    join(c.nativeHome, 'plugins', 'installed_plugins.json'),
  ])
  expect(io.run).not.toHaveBeenCalled()
})
it('Claude MCP keeps the captured userHome sibling, not ambient or nativeHome config', async () => {
  const c = context('claude')
  vi.stubEnv('HARNESSED_PLATFORM', 'codex')
  io.read.mockResolvedValue('{"mcpServers":{"demo":{}}}')
  expect(await isMcpServerRegistered('demo', c)).toBe(true)
  expect(io.read).toHaveBeenCalledWith(join(c.userHome, '.claude.json'), 'utf8')
})
it('Claude settings false does not become positive enabled evidence', async () => {
  const c = context('claude')
  io.read.mockImplementation(async (p: string) =>
    p === join(c.nativeHome, 'settings.json') ? '{"enabledPlugins":{"demo@expected":false}}' : '{}',
  )
  expect(await isPluginRegistered('demo@expected', c)).toBe(true)
  expect(await readPluginEnablement('demo@expected', c)).toBe(false)
})
it('qualified Claude plugin cannot match another marketplace', async () => {
  io.read.mockResolvedValue('{"plugins":{"demo@other":[{}]},"enabledPlugins":{"demo@other":true}}')
  expect(await isPluginRegistered('demo@expected', context('claude'))).toBe(false)
})
it('Codex registration uses captured host and never reads config.toml', async () => {
  const c = context('codex')
  io.run.mockResolvedValue(reply('[{"name":"demo","enabled":false}]'))
  expect(await isMcpServerRegistered('demo', c)).toBe(true)
  expect(await readUserClaudeJson(c)).toEqual({})
  expect(io.read).not.toHaveBeenCalled()
  expect(io.run).toHaveBeenCalledWith('codex', ['mcp', 'list', '--json'], c.userHome, 30000, c)
})
it('plugin cache and targeted invalidation are separated by actual native root', async () => {
  const a = context('codex'),
    b = context('codex', 'native B')
  io.run.mockImplementation(async (...args: unknown[]) =>
    reply(
      (args[4] as HostInstallContext | undefined)?.nativeHome === b.nativeHome
        ? '{"installed":[]}'
        : pluginJson(),
    ),
  )
  expect(await plugins.isCodexPluginInstalled('demo@expected', a)).toBe(true)
  expect(await plugins.isCodexPluginInstalled('demo@expected', b)).toBe(false)
  plugins.invalidateCodexPluginCache(a)
  expect(await plugins.isCodexPluginInstalled('demo@expected', b)).toBe(false)
  expect(await plugins.isCodexPluginInstalled('demo@expected', a)).toBe(true)
  expect(io.run).toHaveBeenCalledTimes(3)
})
it('MCP cache and invalidation separate custom roots while retaining disabled metadata', async () => {
  const a = context('codex'),
    b = context('codex', 'native B')
  io.run.mockImplementation(async (...args: unknown[]) =>
    reply(
      (args[4] as HostInstallContext | undefined)?.nativeHome === b.nativeHome
        ? '[]'
        : '[{"name":"demo","enabled":false}]',
    ),
  )
  expect(await mcp.listCodexMcpServerMetadata(a)).toEqual([{ name: 'demo', enabled: false }])
  expect(await mcp.listCodexMcpServerMetadata(b)).toEqual([])
  mcp.invalidateCodexMcpCache(a)
  expect(await mcp.listCodexMcpServerMetadata(b)).toEqual([])
  await mcp.listCodexMcpServerMetadata(a)
  expect(io.run).toHaveBeenCalledTimes(3)
})
it('plugin installed, disabled and qualified identity remain independent evidence', async () => {
  io.run.mockResolvedValue(reply(pluginJson(false)))
  const c = context('codex')
  expect(await plugins.isCodexPluginInstalled('demo@other', c)).toBe(false)
  expect(await plugins.isCodexPluginInstalled('demo@expected', c)).toBe(true)
  expect(typeof plugins.listCodexPluginMetadata).toBe('function')
  expect(await plugins.listCodexPluginMetadata(c)).toEqual([
    { pluginId: 'demo@expected', installed: true, enabled: false },
  ])
  expect(io.write).not.toHaveBeenCalled()
})
it('unparseable native listings remain unknown without filesystem fallback', async () => {
  io.run.mockResolvedValue(reply('not a listing'))
  expect(await plugins.listInstalledCodexPlugins(context('codex'))).toBeNull()
  expect(await mcp.listCodexMcpServerMetadata(context('codex'))).toBeNull()
  expect(io.read).not.toHaveBeenCalled()
})
it('skill presence uses shared and captured native roots, not ambient Claude', async () => {
  const c = context('codex')
  const skill = join(c.nativeHome, 'skills', 'fixture', 'SKILL.md')
  io.access.mockImplementation(async (p: string) => {
    if (p !== skill) throw new Error('absent')
  })
  expect(await detectSkillPresence('npx skills add owner/fixture', 'fixture', c)).toBe(true)
  expect(io.access.mock.calls.map(([p]) => p)).toEqual([
    join(c.platform.skillsDir, 'fixture', 'SKILL.md'),
    skill,
  ])
})
it('idempotent plugin probes retain the requested marketplace qualification', async () => {
  const c = ctx('demo', context('claude'))
  c.manifest.spec.install = {
    method: 'cc-plugin-marketplace',
    cmd: 'claude plugin install demo@expected',
    git_ref: 'v1.0.0',
    idempotent_check: '',
  }
  io.read.mockResolvedValue('{"plugins":{"demo@other":[{}]}}')
  expect(await isAlreadyInstalled(c)).toBe(false)
  expect(io.shell).not.toHaveBeenCalled()
})
it('skill runtime pins native GSD resources, OS and interpreter home to the snapshot', async () => {
  const c = ctx('gsd')
  io.stat.mockResolvedValue({ isFile: () => true, size: 10 })
  io.access.mockResolvedValue(undefined)
  io.exec.mockImplementation((_bin, _args, _opts, done) => {
    done(null, '{"packageName":"@opengsd/gsd-core","version":"fixture"}', '')
    return { stdin: { end: vi.fn() } }
  })
  expect(await verifySkillRuntime(c)).toBeNull()
  const paths = io.stat.mock.calls.map(([p]) => String(p))
  expect(paths).toContain(join(c.hostContext.nativeHome, 'agents', 'gsd-planner.toml'))
  expect(paths.some((p) => p.includes('ambient'))).toBe(false)
  expect(io.exec.mock.calls[0]?.[2].env).toMatchObject({
    HOME: c.hostContext.userHome,
    USERPROFILE: c.hostContext.userHome,
    CODEX_HOME: c.hostContext.nativeHome,
  })
  expect(io.write).not.toHaveBeenCalled()
})
it('verifyInstalled retains the native gstack blocker and captured root after host drift', async () => {
  const c = ctx('gstack')
  const result = await verifyInstalled(c)
  expect(result).toMatchObject({
    ok: false,
    phase: 'verify',
    error: { keyword: 'upstream-lease-unavailable' },
  })
  expect(io.realpath).toHaveBeenCalledWith(join(c.hostContext.nativeHome, 'skills', 'gstack'))
  expect(io.shell).toHaveBeenCalledWith(
    c,
    'true',
    [],
    5000,
    expect.objectContaining({ envMode: 'verify' }),
  )
  expect(io.write).not.toHaveBeenCalled()
})
it('explicit gstack repair uses context root without replacing existing dependencies', async () => {
  const c = context('codex')
  const sourceDir = resolve('fixture source')
  io.lstat.mockResolvedValue({ isDirectory: () => true, isSymbolicLink: () => false })
  io.stat.mockResolvedValue({ isDirectory: () => true })
  io.read.mockImplementation(async (p: string) =>
    p.endsWith('.source-path') ? sourceDir : '{"name":"gstack"}',
  )
  expect(
    await repairGstackCodexRuntimeAfterConfirm({
      host: 'codex',
      sourceDir,
      confirmed: true,
      hostContext: c,
    }),
  ).toEqual({ status: 'unchanged', runtimeRoot: join(c.nativeHome, 'skills', 'gstack') })
  expect(io.write).not.toHaveBeenCalled()
})
function fakeAppServer(
  hooks: readonly unknown[] = [
    {
      key: 'harnessed-demo@harnessed-local:hooks:0',
      eventName: 'preToolUse',
      trustStatus: 'untrusted',
      currentHash: 'fixture',
    },
  ],
) {
  const stdin = new PassThrough(),
    stdout = new PassThrough()
  const calls: { method: string; params?: unknown }[] = []
  stdin.on('data', (chunk) => {
    const msg = JSON.parse(String(chunk)) as { id?: number; method: string; params?: unknown }
    calls.push(msg)
    if (msg.id === undefined) return
    const result =
      msg.method === 'hooks/list'
        ? {
            data: [
              {
                hooks,
              },
            ],
          }
        : {}
    queueMicrotask(() => stdout.write(`${JSON.stringify({ id: msg.id, result })}\n`))
  })
  return {
    calls,
    proc: Object.assign(new EventEmitter(), {
      stdin,
      stdout,
      stderr: new PassThrough(),
      kill: vi.fn(),
    }),
  }
}
it('app-server spawn pins native/home env and listing preserves untrusted evidence without writes', async () => {
  const c = context('codex')
  const fake = fakeAppServer()
  io.spawn.mockReturnValue(fake.proc)
  spawnCodexAppServer(c)
  expect(io.spawn.mock.calls[0]?.[2].env).toMatchObject({
    HOME: c.userHome,
    USERPROFILE: c.userHome,
    CODEX_HOME: c.nativeHome,
  })
  const spawn = vi.fn(() => fake.proc)
  const result = await listCodexHooks({ hostContext: c, spawn })
  expect(result).toMatchObject({ ok: true, value: [{ trustStatus: 'untrusted' }] })
  expect(spawn).toHaveBeenCalledWith(c)
  expect(fake.calls.map((call) => call.method)).toEqual(['initialize', 'initialized', 'hooks/list'])
  expect(fake.calls.at(-1)?.params).toEqual({ cwds: [c.userHome] })
  expect(io.write).not.toHaveBeenCalled()
})
it('MCP cache does not leak across legacy ambient custom-home changes', async () => {
  io.run
    .mockResolvedValueOnce(reply('[{"name":"first","enabled":true}]'))
    .mockResolvedValueOnce(reply('[]'))
  vi.stubEnv('CODEX_HOME', resolve('legacy A'))
  expect(await mcp.listCodexMcpServers()).toEqual(new Set(['first']))
  vi.stubEnv('CODEX_HOME', resolve('legacy B'))
  expect(await mcp.listCodexMcpServers()).toEqual(new Set())
  expect(io.run).toHaveBeenCalledTimes(2)
})
it('captured native root outranks later manifest env and explicit-empty ambient values', async () => {
  const c = ctx('gsd')
  c.manifest.spec.install.env = { CODEX_HOME: resolve('wrong manifest root') }
  vi.stubEnv('CODEX_HOME', '')
  vi.stubEnv('CLAUDE_CONFIG_DIR', '')
  const result = await verifySkillRuntime(c)
  expect(result).toMatchObject({ ok: false, phase: 'verify' })
  expect(io.stat.mock.calls.map(([p]) => String(p))).toEqual([
    join(c.hostContext.platform.skillsDir, 'gsd-plan-phase', 'SKILL.md'),
    join(c.hostContext.nativeHome, 'skills', 'gsd-plan-phase', 'SKILL.md'),
  ])
  expect(io.write).not.toHaveBeenCalled()
})
it('Claude malformed native registry does not gain a plugin through ambient roots', async () => {
  const c = context('claude')
  io.read.mockImplementation(async (p: string) => (p.startsWith(c.nativeHome) ? '{bad json' : '{}'))
  expect(await isPluginRegistered('demo@expected', c)).toBe(false)
  expect(
    io.read.mock.calls
      .map(([p]) => String(p))
      .every((p) => p.startsWith(c.nativeHome) || p === join(c.userHome, '.claude.json')),
  ).toBe(true)
})
it.each([
  false,
  undefined,
])('installed Claude plugin enablement %s is not readiness', async (enabled) => {
  const c = ctx('demo', context('claude'))
  c.manifest.spec.install = {
    method: 'cc-plugin-marketplace',
    cmd: 'claude plugin install demo@expected',
    git_ref: 'v1.0.0',
    idempotent_check: '',
  }
  io.read.mockImplementation(async (p: string) => {
    if (p === join(c.hostContext.nativeHome, 'plugins', 'installed_plugins.json'))
      return '{"plugins":{"demo@expected":[{}]}}'
    if (p === join(c.hostContext.nativeHome, 'settings.json'))
      return JSON.stringify({
        enabledPlugins: enabled === undefined ? {} : { 'demo@expected': enabled },
      })
    return '{}'
  })
  expect(await isPluginRegistered('demo@expected', c.hostContext)).toBe(true)
  expect(typeof readPluginEnablement).toBe('function')
  expect(await readPluginEnablement('demo@expected', c.hostContext)).toBe(enabled ?? null)
  expect(await verifyInstalled(c)).toMatchObject({
    ok: false,
    phase: 'verify',
    error: {
      keyword: enabled === false ? 'plugin-disabled' : 'plugin-enablement-unknown',
    },
  })
  expect(io.shell).not.toHaveBeenCalled()
  expect(io.write).not.toHaveBeenCalled()
})
it('explicit native disablement outranks legacy sibling enabled state', async () => {
  const c = context('claude')
  io.read.mockImplementation(async (p: string) =>
    p === join(c.nativeHome, 'settings.json')
      ? '{"enabledPlugins":{"demo@expected":false}}'
      : '{"enabledPlugins":{"demo@expected":true}}',
  )
  expect(typeof readPluginEnablement).toBe('function')
  expect(await readPluginEnablement('demo@expected', c)).toBe(false)
})
it('Codex enablement query separates disabled, unknown and qualified IDs', async () => {
  const c = context('codex')
  io.run.mockResolvedValue(reply(pluginJson(false)))
  expect(typeof readPluginEnablement).toBe('function')
  expect(await readPluginEnablement('demo@expected', c)).toBe(false)
  expect(await readPluginEnablement('demo@other', c)).toBeNull()
  expect(await readPluginEnablement('demo', c)).toBeNull()
  expect(io.read).not.toHaveBeenCalled()
})
it('exact enabled native plugin proceeds to read-only verification', async () => {
  const c = ctx('demo')
  c.manifest.spec.install = {
    method: 'cc-plugin-marketplace',
    cmd: 'codex plugin add demo@expected',
    git_ref: 'v1.0.0',
    idempotent_check: '',
  }
  io.run.mockResolvedValue(reply(pluginJson(true)))
  expect(await verifyInstalled(c)).toBeNull()
  expect(io.shell).toHaveBeenCalledOnce()
  expect(io.write).not.toHaveBeenCalled()
})
it('app-server Windows routing uses case-deduplicated home, state and spawn pins', () => {
  const c = {
    ...context('codex'),
    os: 'win32' as const,
    neutralSpawnCwd: resolve('fixture neutral spawn'),
  }
  vi.stubEnv('codex_home', resolve('wrong lower-case home'))
  vi.stubEnv('harnessed_root_override', resolve('wrong state'))
  io.spawn.mockReturnValue(fakeAppServer().proc)
  spawnCodexAppServer(c)
  const env = io.spawn.mock.calls[0]?.[2].env as NodeJS.ProcessEnv
  expect(env).toMatchObject({
    HOME: c.userHome,
    USERPROFILE: c.userHome,
    CODEX_HOME: c.nativeHome,
    HARNESSED_ROOT_OVERRIDE: c.platform.stateRoot,
    HARNESSED_SPAWN_CWD: c.neutralSpawnCwd,
  })
  for (const key of [
    'HOME',
    'USERPROFILE',
    'CODEX_HOME',
    'HARNESSED_ROOT_OVERRIDE',
    'HARNESSED_SPAWN_CWD',
  ])
    expect(Object.keys(env).filter((candidate) => candidate.toUpperCase() === key)).toEqual([key])
})

it.each([
  'mcp-stdio-add',
  'mcp-http-add',
] as const)('retained %s probe requires native enabled MCP evidence', async (method) => {
  const c = ctx('demo')
  c.manifest.spec.install = {
    method,
    cmd: 'claude mcp add demo fixture',
    npm_version: '^1.0.0',
    idempotent_check: '',
  }
  c.manifest.spec.verify.cmd = 'test -f ~/.claude/skills/demo/SKILL.md'
  for (const listing of [
    '[]',
    '[{"name":"demo","enabled":false}]',
    '[{"name":"demo"}]',
    'bad JSON',
  ]) {
    mcp.invalidateCodexMcpCache(c.hostContext)
    io.run.mockResolvedValue(reply(listing))
    const result = await verifyInstalled(c)
    expect.soft(result).toMatchObject({ ok: false, phase: 'verify' })
  }
  expect(io.shell).not.toHaveBeenCalled()
  expect(io.read).not.toHaveBeenCalled()
  expect(io.write).not.toHaveBeenCalled()
  expect(io.spawn).not.toHaveBeenCalled()
  mcp.invalidateCodexMcpCache(c.hostContext)
  io.run.mockResolvedValue(reply('[{"name":"demo","enabled":true}]'))
  io.shell.mockResolvedValue({ exitCode: 127, stdout: '', stderr: 'fixture: Claude absent' })
  expect(await verifyInstalled(c)).toBeNull()
  expect(io.shell).not.toHaveBeenCalled()
  expect(io.run.mock.calls.every((call) => call[4] === c.hostContext)).toBe(true)
})
it.each([
  'untrusted',
  'modified',
  'pending',
  'unknown',
  'missing-hash',
  'absent',
  'foreign',
  'rpc-error',
  'mixed',
])('retained Codex hook probe rejects %s evidence without trusting', async (status) => {
  const c = ctx('demo')
  c.manifest.spec.install = {
    method: 'cc-hook-add',
    cmd: 'fixture hook',
    hook_event: 'PreToolUse',
    hook_command: 'fixture',
    idempotent_check: '',
  }
  c.manifest.spec.verify.cmd = 'test -f ~/.claude/settings.json'
  io.run.mockResolvedValue(
    reply(
      JSON.stringify({
        installed: [{ pluginId: 'harnessed-demo@harnessed-local', installed: true, enabled: true }],
      }),
    ),
  )
  const hooks =
    status === 'absent'
      ? []
      : [
          {
            key:
              status === 'foreign'
                ? 'harnessed-demo@other-market:hooks:0'
                : 'harnessed-demo@harnessed-local:hooks:0',
            eventName: 'preToolUse',
            trustStatus: status === 'missing-hash' || status === 'mixed' ? 'trusted' : status,
            currentHash: status === 'missing-hash' ? '' : 'fixture',
          },
        ]
  if (status === 'mixed')
    hooks.push({
      key: 'harnessed-demo@harnessed-local:hooks:1',
      eventName: 'preToolUse',
      trustStatus: 'modified',
      currentHash: 'fixture',
    })
  const fake = fakeAppServer(hooks)
  io.spawn.mockReturnValue(fake.proc)
  if (status === 'rpc-error')
    io.spawn.mockImplementation(() => {
      throw new Error('fixture RPC unavailable')
    })
  expect(await verifyInstalled(c)).toMatchObject({ ok: false, phase: 'verify' })
  expect(io.shell).not.toHaveBeenCalled()
  expect(fake.calls.every((call) => call.method !== 'config/batchWrite')).toBe(true)
  expect(io.write).not.toHaveBeenCalled()
  expect(io.read).not.toHaveBeenCalled()
})
it.each([
  false,
  null,
])('retained Codex hook probe rejects enabled=%s before any trust RPC', async (enabled) => {
  const c = ctx('demo')
  c.manifest.spec.install = {
    method: 'cc-hook-add',
    cmd: 'fixture hook',
    hook_event: 'PreToolUse',
    hook_command: 'fixture',
    idempotent_check: '',
  }
  io.run.mockResolvedValue(
    reply(
      JSON.stringify({
        installed: [{ pluginId: 'harnessed-demo@harnessed-local', installed: true, enabled }],
      }),
    ),
  )
  expect(await verifyInstalled(c)).toMatchObject({
    ok: false,
    phase: 'verify',
    error: {
      keyword: enabled === false ? 'plugin-disabled' : 'plugin-enablement-unknown',
    },
  })
  expect(io.spawn).not.toHaveBeenCalled()
  expect(io.shell).not.toHaveBeenCalled()
  expect(io.write).not.toHaveBeenCalled()
})
it('retained Codex hook probe requires all exact-plugin hooks trusted with usable hashes', async () => {
  const c = ctx('demo')
  c.manifest.spec.install = {
    method: 'cc-hook-add',
    cmd: 'fixture hook',
    hook_event: 'PreToolUse',
    hook_command: 'fixture',
    idempotent_check: '',
  }
  c.manifest.spec.verify.cmd = 'claude plugin list | grep harnessed-demo'
  io.shell.mockResolvedValue({ exitCode: 127, stdout: '', stderr: 'fixture: Claude absent' })
  io.run.mockResolvedValue(
    reply(
      JSON.stringify({
        installed: [{ pluginId: 'harnessed-demo@harnessed-local', installed: true, enabled: true }],
      }),
    ),
  )
  const fake = fakeAppServer([
    {
      key: 'harnessed-demo@harnessed-local:hooks:0',
      eventName: 'preToolUse',
      trustStatus: 'trusted',
      currentHash: 'fixture',
    },
  ])
  io.spawn.mockReturnValue(fake.proc)
  expect(await verifyInstalled(c)).toBeNull()
  expect(fake.calls.map((call) => call.method)).toEqual(['initialize', 'initialized', 'hooks/list'])
  expect(fake.calls.at(-1)?.params).toEqual({ cwds: [c.cwd] })
  expect(io.shell).not.toHaveBeenCalled()
  expect(io.write).not.toHaveBeenCalled()
})
it.each([
  'mcp-stdio-add',
  'mcp-http-add',
  'cc-hook-add',
] as const)('Codex structural %s still executes explicit override verify', async (method) => {
  const c = ctx('demo')
  c.manifest.spec.install =
    method === 'cc-hook-add'
      ? {
          method,
          cmd: 'fixture hook',
          hook_event: 'PreToolUse',
          hook_command: 'fixture',
          idempotent_check: '',
        }
      : { method, cmd: 'fixture mcp', npm_version: '^1.0.0', idempotent_check: '' }
  c.manifest.spec.verify.cmd = 'claude plugin list | grep demo'
  c.manifest.spec.harness_overrides = {
    codex: {
      install: c.manifest.spec.install,
      verify: { cmd: 'fixture explicit Codex verify', expected_exit_code: 7, timeout_ms: 1234 },
    },
  }
  io.run.mockImplementation(async (_bin, args: string[]) =>
    reply(
      args[0] === 'mcp'
        ? '[{"name":"demo","enabled":true}]'
        : JSON.stringify({
            installed: [
              { pluginId: 'harnessed-demo@harnessed-local', installed: true, enabled: true },
            ],
          }),
    ),
  )
  const fake = fakeAppServer([
    {
      key: 'harnessed-demo@harnessed-local:hooks:0',
      trustStatus: 'trusted',
      currentHash: 'fixture',
    },
  ])
  io.spawn.mockReturnValue(fake.proc)
  io.shell.mockResolvedValue({ exitCode: 7, stdout: '', stderr: '' })
  expect(await verifyInstalled(c)).toBeNull()
  expect(io.shell).toHaveBeenCalledExactlyOnceWith(
    c,
    'fixture explicit Codex verify',
    [],
    1234,
    expect.objectContaining({ envMode: 'verify' }),
  )
  expect(io.write).not.toHaveBeenCalled()
})
it('explicit Codex MCP verification failure is not swallowed by native registration success', async () => {
  const c = ctx('demo')
  c.manifest.spec.install = {
    method: 'mcp-stdio-add',
    cmd: 'fixture mcp',
    npm_version: '^1.0.0',
    idempotent_check: '',
  }
  c.manifest.spec.harness_overrides = {
    codex: { install: c.manifest.spec.install, verify: { cmd: 'fixture explicit verify failure' } },
  }
  io.run.mockResolvedValue(reply('[{"name":"demo","enabled":true}]'))
  io.shell.mockResolvedValue({ exitCode: 1, stdout: '', stderr: 'fixture failure' })
  expect(await verifyInstalled(c)).toMatchObject({ ok: false, phase: 'verify' })
  expect(io.shell.mock.calls[0]?.[1]).toBe('fixture explicit verify failure')
})
it.each([
  'npm-cli',
  'npx-skill-installer',
  'git-clone-with-setup',
] as const)('Codex %s keeps its default verify command', async (method) => {
  const c = ctx('demo')
  c.manifest.spec.install.method = method
  c.manifest.spec.verify.cmd = 'fixture default verify'
  io.shell.mockResolvedValue({ exitCode: 1, stdout: '', stderr: 'fixture failure' })
  expect(await verifyInstalled(c)).toMatchObject({ ok: false, phase: 'verify' })
  expect(io.shell.mock.calls[0]?.[1]).toBe('fixture default verify')
})
it.each([
  'untrusted',
  'modified',
  'pending',
  'trusted',
])('trust request with %s missing hash fails before any batch write', async (status) => {
  const fake = fakeAppServer([
    {
      key: 'harnessed-demo@harnessed-local:hooks:0',
      trustStatus: 'untrusted',
      currentHash: 'valid-fixture',
    },
    { key: 'harnessed-demo@harnessed-local:hooks:1', trustStatus: status, currentHash: '' },
  ])
  const result = await trustCodexHooks(['harnessed-demo@harnessed-local'], {
    hostContext: context('codex'),
    spawn: () => fake.proc,
  })
  expect(result).toMatchObject({ ok: false, failure: 'bad-output' })
  expect(fake.calls.some((call) => call.method === 'config/batchWrite')).toBe(false)
  expect(io.write).not.toHaveBeenCalled()
})
it.each([
  ' ',
  7,
])('trust request with invalid currentHash %s cannot report an empty success', async (currentHash) => {
  const fake = fakeAppServer([
    { key: 'harnessed-demo@harnessed-local:hooks:0', trustStatus: 'untrusted', currentHash },
  ])
  expect(
    await trustCodexHooks(['harnessed-demo@harnessed-local'], { spawn: () => fake.proc }),
  ).toMatchObject({ ok: false, failure: 'bad-output' })
  expect(fake.calls.some((call) => call.method === 'config/batchWrite')).toBe(false)
})
