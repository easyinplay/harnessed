import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import * as p from '@clack/prompts'
import { Command } from 'commander'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parse, stringify } from 'yaml'
import { registerUninstall } from '../../src/cli/uninstall.js'
import { resolveComponentPlan } from '../../src/installers/lib/componentPlan.js'
import type { Manifest } from '../../src/manifest/schema/types.js'
import { captureHostInstallContext } from '../../src/platform/hostInstallContext.js'
import { runUninstall } from '../../src/uninstallers/index.js'
import type { UninstallResult } from '../../src/uninstallers/lib/types.js'

const boundary = vi.hoisted(() => ({ read: vi.fn(), mutation: vi.fn() }))
vi.mock('node:os', async (actual) => ({
  ...(await actual<typeof import('node:os')>()),
  homedir: () => resolve('isolated uninstall cli home'),
}))
vi.mock('node:child_process', () => ({ spawn: boundary.mutation }))
vi.mock('node:fs/promises', () => ({
  readFile: boundary.read,
  readdir: vi.fn(async () => []),
  writeFile: boundary.mutation,
  rm: boundary.mutation,
  mkdir: boundary.mutation,
  stat: vi.fn(),
}))
vi.mock('@clack/prompts', () => ({ confirm: vi.fn(async () => true), isCancel: () => false }))
vi.mock('../../src/platform/assetsRoot.js', () => ({
  getAssetsRoot: () => '/fixture',
  isCompiledRuntime: () => false,
}))
vi.mock('../../src/manifest/aliases.js', () => ({ resolveAlias: () => null }))
vi.mock('../../src/platform/hostInstallContext.js', async (actual) => {
  const mod = await actual<typeof import('../../src/platform/hostInstallContext.js')>()
  return { ...mod, captureHostInstallContext: vi.fn(mod.captureHostInstallContext) }
})
vi.mock('../../src/uninstallers/index.js', () => ({
  runUninstall: vi.fn(
    async (..._args: unknown[]): Promise<UninstallResult> => ({ ok: true, removedPaths: [] }),
  ),
}))

const neutral = parse(
  readFileSync(new URL('../../manifests/tools/ctx7.yaml', import.meta.url), 'utf8'),
) as Manifest
const gsd = parse(
  readFileSync(new URL('../../manifests/skill-packs/gsd.yaml', import.meta.url), 'utf8'),
) as Manifest
const plugin = parse(
  readFileSync(new URL('../../manifests/tools/superpowers.yaml', import.meta.url), 'utf8'),
) as Manifest

function crossMethod(method: 'mcp-stdio-add' | 'cc-hook-add'): Manifest {
  const m = structuredClone(plugin)
  m.spec.harness_overrides = {
    codex: {
      install:
        method === 'mcp-stdio-add'
          ? {
              method,
              cmd: 'codex mcp add superpowers -- npx --yes fixture@1',
              npm_version: '^1',
              idempotent_check: 'true',
            }
          : {
              method,
              cmd: 'true',
              idempotent_check: 'true',
              hook_event: 'SessionStart',
              hook_command: 'node bin/harnessed-inject-state.mjs',
            },
    },
  }
  return m
}

class ExitError extends Error {
  constructor(readonly code: number) {
    super(`exit:${code}`)
  }
}
async function runCli(manifest: Manifest, dryRun = false) {
  boundary.read.mockResolvedValue(stringify(manifest))
  const logs: string[] = []
  const errors: string[] = []
  vi.spyOn(console, 'log').mockImplementation((...args) => {
    logs.push(args.join(' '))
  })
  vi.spyOn(console, 'error').mockImplementation((...args) => {
    errors.push(args.join(' '))
  })
  vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new ExitError(Number(code ?? 0))
  })
  const program = new Command().exitOverride()
  registerUninstall(program)
  try {
    await program.parseAsync([
      'node',
      'harnessed',
      'uninstall',
      manifest.metadata.name,
      ...(dryRun ? ['--dry-run'] : []),
    ])
  } catch (error) {
    if (!(error instanceof ExitError)) throw error
    return { code: error.code, stdout: logs.join('\n'), stderr: errors.join('\n') }
  }
  throw new Error('CLI did not exit')
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('HARNESSED_PLATFORM', 'codex')
  vi.stubEnv('CODEX_HOME', '/selected-codex')
  vi.stubEnv('CLAUDE_CONFIG_DIR', '/selected-claude')
  vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '/selected-state')
  vi.mocked(p.confirm).mockResolvedValue(true)
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('per-manifest uninstall preview/confirm contract', () => {
  it.each([
    [false, 0],
    [true, 2],
  ])('allows reviewed Codex GSD uninstall (dryRun=%s)', async (dryRun, exitCode) => {
    const result = await runCli(gsd, dryRun)
    expect(result.code).toBe(exitCode)
    expect(result.stderr).not.toContain('unsupported-operation')
    expect(p.confirm).toHaveBeenCalledTimes(dryRun ? 0 : 1)
    expect(runUninstall).toHaveBeenCalledTimes(dryRun ? 0 : 1)
    expect(boundary.mutation).not.toHaveBeenCalled()
  })

  it.each([
    false,
    true,
  ])('reports cross-method MCP source/gate consistently before confirm (dryRun=%s)', async (dryRun) => {
    const m = crossMethod('mcp-stdio-add')
    const result = await runCli(m, dryRun)
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('unsupported-operation')
    expect(result.stderr).toContain('source identity')
    const context = vi.mocked(captureHostInstallContext).mock.results[0]?.value
    const plan = resolveComponentPlan(m, context, 'uninstall')
    expect(plan).toMatchObject({
      status: 'unsupported',
      reason: 'unsupported-operation',
      sources: { install: 'host-override', uninstall: 'native-adapter' },
    })
    expect(plan.manifest.spec.install.method).toBe('mcp-stdio-add')
    expect(p.confirm).not.toHaveBeenCalled()
    expect(runUninstall).not.toHaveBeenCalled()
  })

  it('refuses unknown explicit shell teardown at the pure plan and CLI boundary', async () => {
    const m = structuredClone(neutral)
    m.spec.harness_overrides = {
      codex: {
        install: structuredClone(m.spec.install),
        uninstall: { cmd: 'rm -rf ~/.agents/skills/user' },
      },
    }
    const result = await runCli(m, true)
    expect(captureHostInstallContext).toHaveBeenCalledTimes(1)
    const context = vi.mocked(captureHostInstallContext).mock.results[0]?.value
    expect(resolveComponentPlan(m, context, 'uninstall')).toMatchObject({
      status: 'unsupported',
      sources: { uninstall: 'host-override' },
    })
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('unsupported-operation')
    expect(p.confirm).not.toHaveBeenCalled()
    expect(runUninstall).not.toHaveBeenCalled()
  })

  it('previews the effective portable hook method, not the base plugin channel', async () => {
    const result = await runCli(crossMethod('cc-hook-add'), true)
    expect(result.code).toBe(2)
    expect(result.stdout).toContain('cc-hook-add')
    expect(result.stdout).not.toContain('cc-plugin-marketplace')
    expect(p.confirm).not.toHaveBeenCalled()
    expect(runUninstall).not.toHaveBeenCalled()
  })

  it('previews a valid Codex neutral declaration with the existing exit 2 policy', async () => {
    const result = await runCli(neutral, true)
    expect(result.code).toBe(2)
    expect(result.stdout).toContain('npm-cli')
    expect(p.confirm).not.toHaveBeenCalled()
    expect(runUninstall).not.toHaveBeenCalled()
  })

  it.each([
    'codex',
    'claude',
  ])('passes the same captured %s context across async confirm env drift', async (host) => {
    vi.stubEnv('HARNESSED_PLATFORM', host)
    vi.mocked(p.confirm).mockImplementationOnce(async () => {
      await Promise.resolve()
      vi.stubEnv('HARNESSED_PLATFORM', host === 'codex' ? 'claude' : 'codex')
      vi.stubEnv('CODEX_HOME', '/drift-codex')
      vi.stubEnv('CLAUDE_CONFIG_DIR', '/drift-claude')
      vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '/drift-state')
      return true
    })
    const result = await runCli(neutral)
    expect(result.code).toBe(0)
    expect(captureHostInstallContext).toHaveBeenCalledTimes(1)
    const context = vi.mocked(captureHostInstallContext).mock.results[0]?.value
    expect(context).toMatchObject({
      hostId: host,
      nativeHome: host === 'codex' ? '/selected-codex' : '/selected-claude',
      platform: {
        stateRoot: join(host === 'codex' ? '/selected-codex' : '/selected-claude', 'harnessed'),
      },
    })
    expect(runUninstall).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: expect.objectContaining({ name: 'ctx7' }) }),
      { apply: true, dryRun: false, yes: true },
      context,
    )
  })

  it('keeps valid Claude preview and declined confirmation at exit 2', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'claude')
    expect((await runCli(gsd, true)).code).toBe(2)
    vi.mocked(p.confirm).mockResolvedValueOnce(false)
    expect((await runCli(gsd)).code).toBe(2)
    expect(runUninstall).not.toHaveBeenCalled()
  })
})
