// v16.0 Phase 64 T4/T6/T7 — cc-hook-add on codex: generated local plugin +
// `codex plugin marketplace add` + `codex plugin add` + consented trust, and the
// reverse. The codex CLI and the app-server trust client are stubbed; the plugin
// files are written for real under an isolated CODEX_HOME so the layout and the
// "never touch config.toml / hooks.json" boundary are asserted on disk.

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const codexCalls: string[][] = []
let installedIds = new Set<string>()
let failVerb: string | null = null
vi.mock('../../src/installers/lib/runClaudeArgs.js', () => ({
  runArgs: vi.fn(),
  runHarnessArgs: vi.fn(async (_bin: string, args: string[]) => {
    codexCalls.push(args)
    if (failVerb && args.join(' ').startsWith(failVerb))
      return { exitCode: 1, stdout: '', stderr: `Error: ${failVerb} failed` }
    if (args[0] === 'plugin' && args[1] === 'add') installedIds.add(args[2] ?? '')
    if (args[0] === 'plugin' && args[1] === 'remove') installedIds.delete(args[2] ?? '')
    if (args[0] === 'plugin' && args[1] === 'list')
      return {
        exitCode: 0,
        stdout: JSON.stringify({
          installed: [...installedIds].map((pluginId) => ({
            pluginId,
            installed: true,
            enabled: true,
          })),
        }),
        stderr: '',
      }
    return { exitCode: 0, stdout: '', stderr: '' }
  }),
}))

const trust = vi.fn()
const list = vi.fn()
const untrust = vi.fn()
vi.mock('../../src/installers/lib/codexHookTrust.js', () => ({
  trustCodexHooks: (...a: unknown[]) => trust(...a),
  listCodexHooks: (...a: unknown[]) => list(...a),
  untrustCodexHooks: (...a: unknown[]) => untrust(...a),
}))

const confirm = vi.fn(async () => true)
vi.mock('@clack/prompts', () => ({
  confirm: (...a: unknown[]) => confirm(...(a as [])),
  note: vi.fn(),
  isCancel: vi.fn(() => false),
}))

vi.mock('../../src/platform/assetsRoot.js', async (orig) => ({
  ...(await orig<typeof import('../../src/platform/assetsRoot.js')>()),
  isCompiledRuntime: vi.fn(() => false),
}))

import { installCcHookAdd } from '../../src/installers/ccHookAdd.js'
import { removeCodexHook } from '../../src/installers/codexHookAdd.js'
import { invalidateCodexPluginCache } from '../../src/installers/lib/codexPlugins.js'
import { isAlreadyInstalled } from '../../src/installers/lib/idempotent.js'
import type { InstallOpts, Manifest } from '../../src/installers/lib/types.js'
import { isCompiledRuntime } from '../../src/platform/assetsRoot.js'
import {
  captureHostInstallContext,
  createHostInstallContext,
} from '../../src/platform/hostInstallContext.js'
import { descriptorFor } from '../../src/platform/platform.js'
import { uninstallCcHookAdd } from '../../src/uninstallers/ccHookAdd.js'

const KEY = 'harnessed-perturn-inject@harnessed-local:hooks/hooks.json:user_prompt_submit:0:0'
const REMINDER_KEY = 'harnessed-update-reminder@harnessed-local:hooks/hooks.json:session_start:0:0'

function manifest(name: string, hookCommand: string, event = 'UserPromptSubmit', matcher?: string) {
  return {
    apiVersion: 'harnessed/v1',
    kind: 'Manifest',
    metadata: { name, description: 'x', upstream: { source: name } },
    spec: {
      type: 'cc-hook',
      install: {
        method: 'cc-hook-add',
        cmd: hookCommand,
        hook_event: event,
        ...(matcher ? { hook_matcher: matcher } : {}),
        hook_command: hookCommand,
        idempotent_check: 'true',
      },
      verify: { cmd: 'true' },
      uninstall: { cmd: 'true' },
      platforms: ['linux', 'darwin', 'win32'],
    },
  } as unknown as Manifest
}

const OPTS: InstallOpts = {
  apply: true,
  dryRun: false,
  system: false,
  nonInteractive: true,
  fullDiff: false,
  color: false,
  quiet: true,
}

let home: string
let codexHome: string
let cwd: string
const originalBun = Object.getOwnPropertyDescriptor(process.versions, 'bun')
const useBun = () =>
  Object.defineProperty(process.versions, 'bun', { configurable: true, value: '1.4.4' })
const MKT = () => join(codexHome, 'harnessed', 'marketplace')
const DATA = (p: string) => join(codexHome, 'plugins', 'data', `${p}-harnessed-local`)

beforeEach(() => {
  vi.mocked(isCompiledRuntime).mockReturnValue(false)
  home = mkdtempSync(join(tmpdir(), 'harnessed-codexhook-'))
  codexHome = join(home, '.codex')
  cwd = join(home, 'proj')
  mkdirSync(cwd, { recursive: true })
  mkdirSync(codexHome, { recursive: true })
  writeFileSync(join(codexHome, 'config.toml'), '# decoy\n')
  writeFileSync(join(codexHome, 'hooks.json'), '{"hooks":{}}\n')
  vi.stubEnv('HOME', home)
  vi.stubEnv('USERPROFILE', home)
  vi.stubEnv('CODEX_HOME', codexHome)
  vi.stubEnv('HARNESSED_PLATFORM', 'codex')
  vi.stubEnv('HARNESSED_ROOT_OVERRIDE', join(home, 'state'))
  codexCalls.length = 0
  installedIds = new Set()
  failVerb = null
  trust.mockReset()
  list.mockReset()
  untrust.mockReset()
  confirm.mockReset()
  confirm.mockResolvedValue(true)
  invalidateCodexPluginCache()
})
afterEach(() => {
  if (originalBun) Object.defineProperty(process.versions, 'bun', originalBun)
  else Reflect.deleteProperty(process.versions, 'bun')
  vi.unstubAllEnvs()
  rmSync(home, { recursive: true, force: true })
})

const install = (m: Manifest, opts: Partial<InstallOpts> = {}) =>
  installCcHookAdd({ manifest: m, opts: { ...OPTS, ...opts }, level: 'L3', cwd })

const PERTURN = () => manifest('perturn-inject', 'node bin/harnessed-inject-state.mjs')
const REMINDER = () =>
  manifest('update-reminder', 'node bin/harnessed-update-reminder.mjs', 'SessionStart')

describe('install on codex', () => {
  it('installs update-reminder under the explicit nativeHome without global config or trust writes', async () => {
    const nativeHome = join(home, "portable Codex home's $;&` root")
    mkdirSync(nativeHome, { recursive: true })
    writeFileSync(join(nativeHome, 'config.toml'), '# custom decoy\n')
    writeFileSync(join(nativeHome, 'hooks.json'), '{"hooks":{"user":[]}}\n')
    const hostContext = createHostInstallContext(descriptorFor('codex', home), {
      os: process.platform,
      userHome: home,
      nativeHome,
    })
    list.mockResolvedValue({
      ok: true,
      value: [
        {
          key: REMINDER_KEY,
          trustStatus: 'untrusted',
          currentHash: 'h',
          eventName: 'SessionStart',
        },
      ],
    })
    const context = {
      manifest: REMINDER(),
      opts: OPTS,
      level: 'L3' as const,
      cwd,
      hostContext,
    }
    const result = await installCcHookAdd(context)
    expect(result).toMatchObject({
      ok: true,
      trustPending: expect.stringContaining('--trust-codex-hooks'),
    })
    expect(trust).not.toHaveBeenCalled()
    const pluginRoot = join(
      nativeHome,
      'harnessed',
      'marketplace',
      'plugins',
      'harnessed-update-reminder',
    )
    const hooks = JSON.parse(readFileSync(join(pluginRoot, 'hooks', 'hooks.json'), 'utf8'))
    const stateRoot = join(nativeHome, 'harnessed')
    const commandHead = `node "\${PLUGIN_ROOT}/hook.cjs" update-reminder --state-root `
    expect(hooks.hooks.SessionStart[0].hooks[0]).toMatchObject({
      command: `${commandHead}'${stateRoot.replaceAll("'", "'\\''")}' --platform codex`,
      commandWindows: `${commandHead}'${stateRoot.replaceAll("'", "''")}' --platform codex`,
    })
    const installInfo = readFileSync(join(pluginRoot, 'install.json'), 'utf8')
    expect(JSON.parse(installInfo)).toMatchObject({ reminderStateRoot: stateRoot })
    expect(
      readFileSync(
        join(
          nativeHome,
          'plugins',
          'data',
          'harnessed-update-reminder-harnessed-local',
          'install.json',
        ),
        'utf8',
      ),
    ).toBe(installInfo)
    expect(readFileSync(join(nativeHome, 'config.toml'), 'utf8')).toBe('# custom decoy\n')
    expect(readFileSync(join(nativeHome, 'hooks.json'), 'utf8')).toBe('{"hooks":{"user":[]}}\n')
    expect(existsSync(MKT())).toBe(false)
    invalidateCodexPluginCache(hostContext)
    expect(await installCcHookAdd(context)).toMatchObject({ ok: true, alreadyInstalled: true })
    untrust.mockResolvedValue({ ok: true, value: { removed: [REMINDER_KEY] } })
    expect(await removeCodexHook('update-reminder', 'SessionStart', hostContext)).toMatchObject({
      ok: true,
    })
    expect(existsSync(pluginRoot)).toBe(false)
  })

  it('changing npm to Bun still requires consent for the modified trust literal', async () => {
    list.mockResolvedValue({ ok: true, value: [{ key: KEY, trustStatus: 'trusted' }] })
    await install(PERTURN())
    useBun()
    list.mockResolvedValue({ ok: true, value: [{ key: KEY, trustStatus: 'modified' }] })
    const r = await install(PERTURN())
    expect(r).toMatchObject({
      ok: true,
      trustPending: expect.stringContaining('--trust-codex-hooks'),
    })
    expect(trust).not.toHaveBeenCalled()
  })

  it('Bun installs its shim and mode without implicitly granting trust', async () => {
    useBun()
    list.mockResolvedValue({ ok: true, value: [{ key: KEY, trustStatus: 'untrusted' }] })
    const r = await install(PERTURN())
    expect(r).toMatchObject({
      ok: true,
      trustPending: expect.stringContaining('--trust-codex-hooks'),
    })
    const pdir = join(MKT(), 'plugins', 'harnessed-perturn-inject')
    const hooks = JSON.parse(readFileSync(join(pdir, 'hooks', 'hooks.json'), 'utf8'))
    expect(hooks.hooks.UserPromptSubmit[0].hooks[0]).toEqual({
      type: 'command',
      command: `bun "\${PLUGIN_ROOT}/hook.cjs" inject-state --platform codex`,
      commandWindows: `bun "\${PLUGIN_ROOT}/hook.cjs" inject-state --platform codex`,
    })
    expect(existsSync(join(pdir, 'hook.cjs'))).toBe(true)
    expect(
      JSON.parse(readFileSync(join(DATA('harnessed-perturn-inject'), 'install.json'), 'utf8')),
    ).toMatchObject({ mode: 'bun' })
    expect(trust).not.toHaveBeenCalled()
    invalidateCodexPluginCache()
    expect(await install(PERTURN())).toMatchObject({ ok: true, alreadyInstalled: true })
  })

  it('compiled keeps the original binary literal even with process.versions.bun', async () => {
    useBun()
    vi.mocked(isCompiledRuntime).mockReturnValue(true)
    list.mockResolvedValue({ ok: true, value: [] })
    await install(PERTURN())
    const pdir = join(MKT(), 'plugins', 'harnessed-perturn-inject')
    const hooks = JSON.parse(readFileSync(join(pdir, 'hooks', 'hooks.json'), 'utf8'))
    expect(hooks.hooks.UserPromptSubmit[0].hooks[0].command).toBe(
      'harnessed inject-state --platform codex',
    )
    expect(existsSync(join(pdir, 'hook.cjs'))).toBe(false)
  })

  it('generates the plugin + marketplace, installs via the codex CLI, trusts on grant', async () => {
    trust.mockResolvedValue({ ok: true, value: { trusted: [KEY], already: [], missing: [] } })
    const r = await install(PERTURN(), { codexHookTrust: 'grant' })
    expect(r).toMatchObject({ ok: true })
    expect(r).not.toHaveProperty('trustPending')

    const pdir = join(MKT(), 'plugins', 'harnessed-perturn-inject')
    const hooks = JSON.parse(readFileSync(join(pdir, 'hooks', 'hooks.json'), 'utf8'))
    expect(hooks.hooks.UserPromptSubmit[0].hooks[0].command).toBe(
      'node "${PLUGIN_ROOT}/hook.cjs" inject-state --platform codex',
    )
    expect(existsSync(join(pdir, 'hook.cjs'))).toBe(true)
    const mkt = JSON.parse(
      readFileSync(join(MKT(), '.agents', 'plugins', 'marketplace.json'), 'utf8'),
    )
    expect(mkt.plugins.map((p: { name: string }) => p.name)).toEqual(['harnessed-perturn-inject'])
    const info = JSON.parse(
      readFileSync(join(DATA('harnessed-perturn-inject'), 'install.json'), 'utf8'),
    )
    expect(info).toMatchObject({ mode: 'npm', assetsRoot: expect.any(String) })

    expect(codexCalls).toContainEqual(['plugin', 'marketplace', 'add', MKT()])
    expect(codexCalls).toContainEqual(['plugin', 'add', 'harnessed-perturn-inject@harnessed-local'])
    expect(trust).toHaveBeenCalledWith(['harnessed-perturn-inject@harnessed-local'])
    // boundary: codex-owned config files untouched
    expect(readFileSync(join(codexHome, 'config.toml'), 'utf8')).toBe('# decoy\n')
    expect(readFileSync(join(codexHome, 'hooks.json'), 'utf8')).toBe('{"hooks":{}}\n')
  })

  it('default (non-interactive, no consent) → installed but trust PENDING, no trust write', async () => {
    list.mockResolvedValue({
      ok: true,
      value: [{ key: KEY, trustStatus: 'untrusted', currentHash: 'h', eventName: 'x' }],
    })
    const r = await install(PERTURN())
    expect(r).toMatchObject({
      ok: true,
      trustPending: expect.stringContaining('--trust-codex-hooks'),
    })
    expect(trust).not.toHaveBeenCalled()
  })

  it('ask → prompts; yes → trusts', async () => {
    list.mockResolvedValue({
      ok: true,
      value: [{ key: KEY, trustStatus: 'untrusted', currentHash: 'h', eventName: 'x' }],
    })
    trust.mockResolvedValue({ ok: true, value: { trusted: [KEY], already: [], missing: [] } })
    const r = await install(PERTURN(), { codexHookTrust: 'ask' })
    expect(confirm).toHaveBeenCalled()
    expect(trust).toHaveBeenCalled()
    expect(r).not.toHaveProperty('trustPending')
  })

  it('ask → no → pending', async () => {
    list.mockResolvedValue({
      ok: true,
      value: [{ key: KEY, trustStatus: 'untrusted', currentHash: 'h', eventName: 'x' }],
    })
    confirm.mockResolvedValue(false)
    const r = await install(PERTURN(), { codexHookTrust: 'ask' })
    expect(trust).not.toHaveBeenCalled()
    expect(r).toMatchObject({ ok: true, trustPending: expect.any(String) })
  })

  it('grant but the RPC is missing on this codex → pending with the reason, never reported trusted', async () => {
    trust.mockResolvedValue({ ok: false, failure: 'method-missing', detail: 'unknown variant' })
    const r = await install(PERTURN(), { codexHookTrust: 'grant' })
    expect(r).toMatchObject({ ok: true, trustPending: expect.stringContaining('method-missing') })
  })

  it('already trusted hook → no prompt, nothing pending', async () => {
    list.mockResolvedValue({
      ok: true,
      value: [{ key: KEY, trustStatus: 'trusted', currentHash: 'h', eventName: 'x' }],
    })
    const r = await install(PERTURN(), { codexHookTrust: 'ask' })
    expect(confirm).not.toHaveBeenCalled()
    expect(r).not.toHaveProperty('trustPending')
  })

  it('re-install with nothing changed → alreadyInstalled (no codex add)', async () => {
    list.mockResolvedValue({
      ok: true,
      value: [{ key: KEY, trustStatus: 'trusted', currentHash: 'h', eventName: 'x' }],
    })
    await install(PERTURN())
    codexCalls.length = 0
    invalidateCodexPluginCache()
    const r = await install(PERTURN())
    expect(r).toMatchObject({ ok: true, alreadyInstalled: true })
    expect(codexCalls.filter((c) => c[1] === 'add' || c[2] === 'add')).toEqual([])
  })

  it('a second hook manifest shares the marketplace; marketplace.json lists both', async () => {
    list.mockResolvedValue({ ok: true, value: [] })
    await install(PERTURN())
    await install(
      manifest('doc-discipline-gate', 'harnessed check-docs --hook', 'PreToolUse', 'Bash'),
    )
    const mkt = JSON.parse(
      readFileSync(join(MKT(), '.agents', 'plugins', 'marketplace.json'), 'utf8'),
    )
    expect(mkt.plugins.map((p: { name: string }) => p.name)).toEqual([
      'harnessed-doc-discipline-gate',
      'harnessed-perturn-inject',
    ])
  })

  it('stop-hook-recover has no codex port → harness-mismatch, zero side effects', async () => {
    const r = await install(
      manifest('stop-hook-recover', 'node bin/harnessed-stop-hook.mjs', 'Stop'),
    )
    expect(r).toEqual({ aborted: true, reason: 'harness-mismatch' })
    expect(codexCalls).toEqual([])
    expect(existsSync(MKT())).toBe(false)
  })

  it('`codex plugin add` fails → structured spawn failure', async () => {
    failVerb = 'plugin add'
    const r = await install(PERTURN())
    expect(r).toMatchObject({ ok: false, phase: 'spawn' })
  })

  it('--dry-run → no files, no codex calls', async () => {
    const r = await install(PERTURN(), { dryRun: true, apply: false })
    expect(r).toMatchObject({ aborted: true })
    expect(codexCalls).toEqual([])
    expect(existsSync(MKT())).toBe(false)
  })
})

describe('installed probe on codex (T5 / R6)', () => {
  it('isAlreadyInstalled follows `codex plugin list`, not settings.json / config.toml', async () => {
    const ctx = { manifest: PERTURN(), opts: OPTS, level: 'L3' as const, cwd }
    expect(await isAlreadyInstalled(ctx)).toBe(false)
    installedIds.add('harnessed-perturn-inject@harnessed-local')
    invalidateCodexPluginCache()
    expect(await isAlreadyInstalled(ctx)).toBe(true)
  })
})

describe('uninstall on codex (T7)', () => {
  it('Bun mode does not widen removal authority for a mismatched command host', async () => {
    useBun()
    list.mockResolvedValue({ ok: true, value: [] })
    await install(PERTURN())
    const hooksPath = join(MKT(), 'plugins', 'harnessed-perturn-inject', 'hooks', 'hooks.json')
    writeFileSync(hooksPath, readFileSync(hooksPath, 'utf8').replaceAll('bun ', 'node '))
    codexCalls.length = 0
    const r = await removeCodexHook('perturn-inject', 'UserPromptSubmit')
    expect(r).toMatchObject({
      ok: false,
      phase: 'preflight',
      error: expect.stringContaining('Unrecognized first-party hook command'),
    })
    expect(codexCalls).toEqual([])
    expect(untrust).not.toHaveBeenCalled()
    expect(existsSync(hooksPath)).toBe(true)
  })

  it('validates and removes Bun-generated files through the existing teardown and consent path', async () => {
    useBun()
    list.mockResolvedValue({ ok: true, value: [{ key: KEY, trustStatus: 'trusted' }] })
    untrust.mockResolvedValue({ ok: true, value: { removed: [KEY] } })
    await install(PERTURN())
    // Exercise Bun install-info/head validation independently of the installing runtime.
    expect(
      JSON.parse(readFileSync(join(DATA('harnessed-perturn-inject'), 'install.json'), 'utf8')).mode,
    ).toBe('bun')
    Reflect.deleteProperty(process.versions, 'bun')
    const r = await uninstallCcHookAdd({
      manifest: PERTURN(),
      opts: { apply: true, dryRun: false, yes: true },
      cwd,
    })
    expect(r).toMatchObject({ ok: true })
    expect(codexCalls).toContainEqual([
      'plugin',
      'remove',
      'harnessed-perturn-inject@harnessed-local',
    ])
    expect(existsSync(MKT())).toBe(false)
    expect(existsSync(DATA('harnessed-perturn-inject'))).toBe(false)
    expect(untrust).toHaveBeenCalledTimes(1)
  })

  it('plugin remove → empty cache dir removed → trust entry deleted → plugin + data dirs gone; last one removes the marketplace', async () => {
    list.mockResolvedValue({
      ok: true,
      value: [{ key: KEY, trustStatus: 'trusted', currentHash: 'h', eventName: 'x' }],
    })
    untrust.mockResolvedValue({ ok: true, value: { removed: [KEY] } })
    await install(PERTURN())
    // codex leaves an empty cache/<mkt> dir behind after `plugin remove` (measured)
    const cacheMkt = join(codexHome, 'plugins', 'cache', 'harnessed-local')
    mkdirSync(cacheMkt, { recursive: true })
    codexCalls.length = 0

    const r = await uninstallCcHookAdd({
      manifest: PERTURN(),
      opts: { apply: true, dryRun: false, yes: true },
      cwd,
    })
    expect(r).toMatchObject({ ok: true })
    expect(codexCalls).toContainEqual([
      'plugin',
      'remove',
      'harnessed-perturn-inject@harnessed-local',
    ])
    expect(codexCalls).toContainEqual(['plugin', 'marketplace', 'remove', 'harnessed-local'])
    expect(untrust).toHaveBeenCalledWith([KEY], {
      hostContext: captureHostInstallContext({ hostId: 'codex', userHome: home }),
      cwd: home,
    })
    expect(existsSync(cacheMkt)).toBe(false)
    expect(existsSync(DATA('harnessed-perturn-inject'))).toBe(false)
    expect(existsSync(MKT())).toBe(false)
    expect(readFileSync(join(codexHome, 'config.toml'), 'utf8')).toBe('# decoy\n')
  })

  it('removing one of two keeps the marketplace and rewrites marketplace.json', async () => {
    list.mockResolvedValue({ ok: true, value: [] })
    untrust.mockResolvedValue({ ok: true, value: { removed: [] } })
    await install(PERTURN())
    await install(
      manifest('doc-discipline-gate', 'harnessed check-docs --hook', 'PreToolUse', 'Bash'),
    )
    codexCalls.length = 0
    await uninstallCcHookAdd({
      manifest: PERTURN(),
      opts: { apply: true, dryRun: false, yes: true },
      cwd,
    })
    expect(codexCalls).not.toContainEqual(['plugin', 'marketplace', 'remove', 'harnessed-local'])
    const mkt = JSON.parse(
      readFileSync(join(MKT(), '.agents', 'plugins', 'marketplace.json'), 'utf8'),
    )
    expect(mkt.plugins.map((p: { name: string }) => p.name)).toEqual([
      'harnessed-doc-discipline-gate',
    ])
  })

  it('never installed → idempotent ok without claiming trust cleanup authority', async () => {
    list.mockResolvedValue({ ok: true, value: [] })
    untrust.mockResolvedValue({ ok: true, value: { removed: [] } })
    const r = await uninstallCcHookAdd({
      manifest: PERTURN(),
      opts: { apply: true, dryRun: false, yes: true },
      cwd,
    })
    expect(r).toMatchObject({ ok: true })
    expect(untrust).not.toHaveBeenCalled()
    expect(list).not.toHaveBeenCalled()
    expect(codexCalls).toEqual([['plugin', 'list', '--json']])
  })
})
