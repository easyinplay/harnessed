import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { parse, stringify } from 'yaml'
import type { InstallContext, InstallOpts, Manifest } from '../../src/installers/lib/types.js'
import type { UninstallContext } from '../../src/uninstallers/lib/types.js'

const b = vi.hoisted(() => {
  const events: string[] = []
  const mutation = vi.fn()
  const dispatch = () =>
    vi.fn(async (ctx: InstallContext | UninstallContext) => {
      const name = ctx.manifest.metadata.name
      events.push(`start:${name}`)
      await Promise.resolve()
      events.push(`end:${name}`)
      if (!ctx.opts.dryRun) mutation(ctx)
      return ctx.opts.dryRun
        ? { aborted: true, reason: 'dry-run' }
        : { ok: true, backupId: '', appliedFiles: [], removedPaths: [] }
    })
  return {
    events,
    mutation,
    install: Array.from({ length: 7 }, dispatch),
    uninstall: Array.from({ length: 7 }, dispatch),
    teardown: dispatch(),
    read: vi.fn(),
  }
})
vi.mock('node:os', () => ({ homedir: () => resolve('isolated lifecycle home') }))
vi.mock('node:child_process', () => ({ spawn: b.mutation, exec: b.mutation, execFile: b.mutation }))
vi.mock('node:fs/promises', () => ({
  readFile: b.read,
  writeFile: b.mutation,
  mkdir: b.mutation,
  rm: b.mutation,
  rename: b.mutation,
  cp: b.mutation,
}))
vi.mock('../../src/installers/npmCli.js', () => ({ installNpmCli: b.install[0] }))
vi.mock('../../src/installers/npxSkillInstaller.js', () => ({
  installNpxSkillInstaller: b.install[1],
}))
vi.mock('../../src/installers/ccPluginMarketplace.js', () => ({
  installCcPluginMarketplace: b.install[2],
}))
vi.mock('../../src/installers/mcpStdioAdd.js', () => ({ installMcpStdioAdd: b.install[3] }))
vi.mock('../../src/installers/mcpHttpAdd.js', () => ({ installMcpHttpAdd: b.install[4] }))
vi.mock('../../src/installers/ccHookAdd.js', () => ({ installCcHookAdd: b.install[5] }))
vi.mock('../../src/installers/gitCloneWithSetup.js', () => ({
  installGitCloneWithSetup: b.install[6],
}))
vi.mock('../../src/uninstallers/npmCli.js', () => ({ uninstallNpmCli: b.uninstall[0] }))
vi.mock('../../src/uninstallers/npxSkillInstaller.js', () => ({
  uninstallNpxSkillInstaller: b.uninstall[1],
}))
vi.mock('../../src/uninstallers/ccPluginMarketplace.js', () => ({
  uninstallCcPluginMarketplace: b.uninstall[2],
}))
vi.mock('../../src/uninstallers/mcpStdioAdd.js', () => ({ uninstallMcpStdioAdd: b.uninstall[3] }))
vi.mock('../../src/uninstallers/mcpHttpAdd.js', () => ({ uninstallMcpHttpAdd: b.uninstall[4] }))
vi.mock('../../src/uninstallers/ccHookAdd.js', () => ({ uninstallCcHookAdd: b.uninstall[5] }))
vi.mock('../../src/uninstallers/gitCloneWithSetup.js', () => ({
  uninstallGitCloneWithSetup: b.uninstall[6],
}))
vi.mock('../../src/uninstallers/lib/declaredTeardown.js', () => ({
  hasDeclaredUninstall: (ctx: UninstallContext) => ctx.manifest.spec.uninstall != null,
  runDeclaredTeardown: b.teardown,
}))

import { installGroupOf, runStepBInstall } from '../../src/cli/lib/setup-helpers.js'
import { resolveForHarness, runInstall } from '../../src/installers/index.js'
import { runUninstall } from '../../src/uninstallers/index.js'

const methods = [
  'npm-cli',
  'npx-skill-installer',
  'cc-plugin-marketplace',
  'mcp-stdio-add',
  'mcp-http-add',
  'cc-hook-add',
  'git-clone-with-setup',
] as const
const groups = ['cli-binary', 'command', 'command', 'mcp-tool', 'mcp-tool', 'command', 'command']
const opts: InstallOpts = {
  apply: true,
  dryRun: false,
  system: true,
  nonInteractive: true,
  fullDiff: false,
  color: false,
}
const gsd = parse(
  readFileSync(new URL('../../manifests/skill-packs/gsd.yaml', import.meta.url), 'utf8'),
) as Manifest
function fixture(method: (typeof methods)[number], name: string = method): Manifest {
  return {
    ...gsd,
    metadata: { ...gsd.metadata, name },
    spec: {
      ...gsd.spec,
      type: method === 'cc-plugin-marketplace' ? 'cc-plugin' : gsd.spec.type,
      install_type: method === 'cc-plugin-marketplace' ? 'skill' : gsd.spec.install_type,
      harness_overrides: undefined,
      install: {
        method,
        cmd: 'fixture-install',
        idempotent_check: 'true',
        ...(method === 'cc-plugin-marketplace' ? { git_ref: 'v1.0.0' } : {}),
      },
      verify: { cmd: 'fixture-verify', timeout_ms: 1000 },
      uninstall: { cmd: 'fixture-remove', cleanup_paths: ['~/.claude/skills/fixture'] },
    },
  } as Manifest
}
function cross(name: string): Manifest {
  const m = fixture('cc-plugin-marketplace', name)
  m.spec.harness_overrides = {
    codex: {
      install: {
        method: 'mcp-stdio-add',
        cmd: 'fixture-mcp',
        npm_version: '^1.0.0',
        idempotent_check: 'codex-check',
      },
      verify: { cmd: 'codex-verify', timeout_ms: 2000 },
    },
  }
  return m
}
beforeEach(() => {
  vi.clearAllMocks()
  b.events.length = 0
  for (const [key, value] of Object.entries({
    HOME: resolve('isolated lifecycle home'),
    USERPROFILE: resolve('isolated lifecycle home'),
    CODEX_HOME: resolve('isolated codex config'),
    CLAUDE_CONFIG_DIR: resolve('isolated claude config'),
    HARNESSED_ROOT_OVERRIDE: '',
    HARNESSED_PLATFORM: 'claude',
  }))
    vi.stubEnv(key, value)
  b.read.mockRejectedValue(new Error('fixture-only read boundary'))
})
afterEach(() => vi.unstubAllEnvs())

it.each(methods)('Claude preserves %s install, verify, display and teardown', async (method) => {
  const m = fixture(method)
  expect(resolveForHarness(m)).toEqual({ manifest: m, gate: null })
  expect(resolveForHarness(m).manifest).toBe(m)
  expect(installGroupOf(m)).toBe(groups[methods.indexOf(method)])
  await runInstall(m, opts)
  expect(b.install[methods.indexOf(method)]).toHaveBeenCalledWith(
    expect.objectContaining({ manifest: m }),
  )
  await runUninstall(m, { apply: true, dryRun: false, yes: true })
  const target = [0, 1, 6].includes(methods.indexOf(method))
    ? b.teardown
    : b.uninstall[methods.indexOf(method)]
  expect(target).toHaveBeenCalledWith(expect.objectContaining({ manifest: m }))
})
it('Codex replaces install and verify wholesale without mutating the base', async () => {
  vi.stubEnv('HARNESSED_PLATFORM', 'codex')
  const m = cross('replacement')
  const before = structuredClone(m)
  const r = resolveForHarness(m)
  expect(r.gate).toBeNull()
  expect(r.manifest.spec.install).toEqual(m.spec.harness_overrides?.codex?.install)
  expect(r.manifest.spec.verify).toEqual(m.spec.harness_overrides?.codex?.verify)
  await runInstall(m, opts)
  expect(b.install[3]).toHaveBeenCalledWith(
    expect.objectContaining({ manifest: r.manifest, level: 'L3' }),
  )
  expect(m).toEqual(before)
})
it('Codex plugin-to-MCP displays and executes the effective channel serially', async () => {
  vi.stubEnv('HARNESSED_PLATFORM', 'codex')
  const fixtures = [cross('first'), cross('second')]
  b.read.mockImplementation(async (path: string) => stringify(fixtures[Number(path)]))
  const result = await runStepBInstall(['0', '1'])
  expect(result.failed).toEqual([])
  expect(result.installed).toEqual(['first', 'second'])
  expect(result.componentTypes).toEqual({ first: 'mcp-tool', second: 'mcp-tool' })
  expect(b.events).toEqual(['start:first', 'end:first', 'start:second', 'end:second'])
  expect(b.install[2]).not.toHaveBeenCalled()
})
it('Codex missing plugin override refuses installation before dispatch', async () => {
  vi.stubEnv('HARNESSED_PLATFORM', 'codex')
  expect(await runInstall(fixture('cc-plugin-marketplace'), opts)).toMatchObject({
    aborted: true,
    reason: 'harness-mismatch',
  })
  for (const spy of b.install) expect(spy).not.toHaveBeenCalled()
})
it('Codex shared-skill override selects the skill dispatcher and retains default verify', async () => {
  vi.stubEnv('HARNESSED_PLATFORM', 'codex')
  const m = fixture('cc-plugin-marketplace')
  m.spec.harness_overrides = {
    codex: {
      install: {
        method: 'npx-skill-installer',
        cmd: 'fixture-skills',
        npm_version: '^1.0.0',
        idempotent_check: 'true',
      },
    },
  }
  await runInstall(m, opts)
  expect(installGroupOf(m)).toBe('command')
  expect(b.install[1]).toHaveBeenCalledWith(
    expect.objectContaining({
      manifest: expect.objectContaining({
        spec: expect.objectContaining({ verify: m.spec.verify }),
      }),
    }),
  )
  expect(b.install[2]).not.toHaveBeenCalled()
})
it('real GSD Codex install dispatches only the Codex CLI and verify contract', async () => {
  vi.stubEnv('HARNESSED_PLATFORM', 'codex')
  await runInstall(gsd, opts)
  expect(installGroupOf(gsd)).toBe('cli-binary')
  const ctx = b.install[0]?.mock.calls[0]?.[0]
  expect(ctx?.manifest.spec.install.cmd).toContain('--codex')
  expect(ctx?.manifest.spec.install.cmd).not.toContain('--claude')
  expect(ctx?.manifest.spec.verify).toEqual(gsd.spec.harness_overrides?.codex?.verify)
})
it('Codex cross-method uninstall never dispatches the base Claude plugin channel (Task3)', async () => {
  vi.stubEnv('HARNESSED_PLATFORM', 'codex')
  await runUninstall(cross('channel'), { apply: true, dryRun: false, yes: true })
  expect(b.uninstall[2]).not.toHaveBeenCalled()
  expect(b.teardown).not.toHaveBeenCalled()
})
it('real GSD Codex uninstall never dispatches --claude or .claude cleanup (Task3)', async () => {
  vi.stubEnv('HARNESSED_PLATFORM', 'codex')
  expect(resolveForHarness(gsd).manifest.spec.install.cmd).toContain('--codex')
  const result = await runUninstall(gsd, { apply: true, dryRun: false, yes: true })
  const calls = [...b.teardown.mock.calls, ...b.uninstall.flatMap((spy) => spy.mock.calls)]
  if (calls.length === 0) expect(result).not.toMatchObject({ ok: true })
  for (const [ctx] of calls) {
    expect.soft(ctx.manifest.spec.uninstall.cmd).not.toContain('--claude')
    expect.soft(ctx.manifest.spec.uninstall.cleanup_paths?.join(' ') ?? '').not.toContain('.claude')
  }
})
it.each(methods)('dry-run %s has zero mutation across both hosts', async (method) => {
  for (const host of ['claude', 'codex']) {
    vi.stubEnv('HARNESSED_PLATFORM', host)
    const m = fixture(method)
    const installed = await runInstall(m, { ...opts, apply: false, dryRun: true })
    expect(installed).toMatchObject({
      aborted: true,
      reason:
        host === 'codex' && method === 'cc-plugin-marketplace' ? 'harness-mismatch' : 'dry-run',
    })
    const removed = await runUninstall(m, { apply: false, dryRun: true, yes: true })
    expect(removed).not.toMatchObject({ ok: true })
  }
  expect(b.mutation).not.toHaveBeenCalled()
})
