import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parse, stringify } from 'yaml'
import { makeIdempotentProbe } from '../../src/cli/lib/setup-helpers.js'
import { isAlreadyInstalled } from '../../src/installers/lib/idempotent.js'
import { runHarnessArgs } from '../../src/installers/lib/runClaudeArgs.js'
import { spawnCmd } from '../../src/installers/lib/spawn.js'
import type { InstallContext, Manifest } from '../../src/installers/lib/types.js'
import { createHostInstallContext } from '../../src/platform/hostInstallContext.js'
import { claudeDescriptor } from '../../src/platform/platform.js'

vi.mock('node:fs/promises', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:fs/promises')>()),
  readFile: vi.fn(),
}))
vi.mock('../../src/installers/lib/runClaudeArgs.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/installers/lib/runClaudeArgs.js')>()),
  runHarnessArgs: vi.fn(),
}))
vi.mock('../../src/installers/lib/spawn.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/installers/lib/spawn.js')>()),
  spawnCmd: vi.fn(),
}))

const context = createHostInstallContext(claudeDescriptor('/selected-home'), {
  os: process.platform,
  userHome: '/selected-home',
  nativeHome: '/selected-claude',
})
const superpowersFixture = {
  name: 'superpowers',
  path: 'manifests/tools/superpowers.yaml',
  id: 'superpowers@superpowers-marketplace',
  manifest: parse(readFileSync('manifests/tools/superpowers.yaml', 'utf8')) as Manifest,
}
const fixtures = [
  superpowersFixture,
  {
    name: 'planning-with-files',
    path: 'manifests/skill-packs/planning-with-files.yaml',
    id: 'planning-with-files@planning-with-files',
    manifest: parse(
      readFileSync('manifests/skill-packs/planning-with-files.yaml', 'utf8'),
    ) as Manifest,
  },
]

function pluginEntry(id = 'superpowers@superpowers-marketplace') {
  return {
    id,
    version: '1.0.0',
    scope: 'user',
    enabled: true,
    installPath: '/selected-claude/plugins/cache/fixture/1.0.0',
    installedAt: '2026-10-01T00:00:00.000Z',
    lastUpdated: '2026-10-01T00:00:00.000Z',
    projectEnabled: false,
  }
}

function serveManifest(fixture = superpowersFixture, present = true): Manifest {
  const manifest = structuredClone(fixture.manifest)
  manifest.spec.install.idempotent_check = 'fixture-presence-shell-fallback'
  manifest.spec.verify.cmd = 'fixture-generic-shell-verification'
  vi.mocked(readFile).mockImplementation(async (path) => {
    if (String(path) === fixture.path) return stringify(manifest)
    if (String(path) === join(context.nativeHome, 'plugins', 'installed_plugins.json')) {
      return JSON.stringify({
        version: 2,
        plugins: present ? { [fixture.id]: [pluginEntry(fixture.id)] } : {},
      })
    }
    if (String(path) === join(context.nativeHome, 'settings.json')) {
      return JSON.stringify({ enabledPlugins: present ? { [fixture.id]: true } : {} })
    }
    if (String(path) === join(context.userHome, '.claude.json')) return '{}'
    throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
  })
  return manifest
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('HARNESSED_PLATFORM', 'claude')
  vi.mocked(spawnCmd).mockResolvedValue({ ok: true, exitCode: 0, stdout: '', stderr: '' })
  vi.mocked(runHarnessArgs).mockResolvedValue({ exitCode: 0, stdout: '[]', stderr: '' })
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('Claude marketplace retained verification through the real setup probe', () => {
  it.each(
    fixtures,
  )('retains the exact qualified ID $id without generic shell verify', async (fixture) => {
    serveManifest(fixture)
    vi.mocked(runHarnessArgs).mockResolvedValue({
      exitCode: 0,
      stdout: JSON.stringify([pluginEntry('unrelated@other-marketplace'), pluginEntry(fixture.id)]),
      stderr: '',
    })
    vi.mocked(spawnCmd).mockResolvedValue({
      ok: true,
      exitCode: 1,
      stdout: '',
      stderr: 'generic shell verification must not run for Claude marketplace plugins',
    })
    const probe = await makeIdempotentProbe([fixture.path], context)

    expect.soft(await probe(fixture.name), fixture.id).toBe(true)
    expect
      .soft(vi.mocked(runHarnessArgs).mock.calls.map(([bin, args]) => [bin, args]))
      .toContainEqual(['claude', ['plugin', 'list', '--json']])
    expect(spawnCmd).not.toHaveBeenCalled()
  })

  it.each([
    {
      reason: 'CLI nonzero despite an exact healthy entry',
      exitCode: 1,
      stdout: JSON.stringify([pluginEntry()]),
    },
    {
      reason: 'malformed JSON',
      exitCode: 0,
      stdout: '[{"id":"superpowers@superpowers-marketplace"}',
    },
    {
      reason: 'wrong JSON envelope',
      exitCode: 0,
      stdout: JSON.stringify({ installed: [pluginEntry()] }),
    },
    { reason: 'null JSON', exitCode: 0, stdout: 'null' },
    { reason: 'missing plugin', exitCode: 0, stdout: '[]' },
    {
      reason: 'similar plugin name',
      exitCode: 0,
      stdout: JSON.stringify([pluginEntry('superpowers-extra@superpowers-marketplace')]),
    },
    {
      reason: 'wrong marketplace',
      exitCode: 0,
      stdout: JSON.stringify([pluginEntry('superpowers@other-marketplace')]),
    },
    {
      reason: 'similar marketplace name',
      exitCode: 0,
      stdout: JSON.stringify([pluginEntry('superpowers@superpowers-marketplace-extra')]),
    },
    {
      reason: 'CLI disabled despite settings enabled',
      exitCode: 0,
      stdout: JSON.stringify([{ ...pluginEntry(), enabled: false }]),
    },
    {
      reason: 'empty installPath',
      exitCode: 0,
      stdout: JSON.stringify([{ ...pluginEntry(), installPath: '' }]),
    },
  ])('fails closed for superpowers@superpowers-marketplace: $reason', async ({
    exitCode,
    stdout,
  }) => {
    serveManifest()
    vi.mocked(runHarnessArgs).mockResolvedValue({ exitCode, stdout, stderr: '' })
    const probe = await makeIdempotentProbe([superpowersFixture.path], context)

    expect.soft(await probe('superpowers'), 'superpowers@superpowers-marketplace').toBe(false)
    expect
      .soft(vi.mocked(runHarnessArgs).mock.calls.map(([bin, args]) => [bin, args]))
      .toContainEqual(['claude', ['plugin', 'list', '--json']])
    expect(spawnCmd).not.toHaveBeenCalled()
  })
})

describe('Claude marketplace authoritative absence through real isAlreadyInstalled', () => {
  it('does not let a successful manifest idempotent_check override missing superpowers@superpowers-marketplace', async () => {
    const manifest = serveManifest(superpowersFixture, false)
    const ctx: InstallContext = {
      manifest,
      opts: {
        apply: false,
        dryRun: false,
        system: false,
        nonInteractive: true,
        fullDiff: false,
        color: 'auto',
        updateInstalled: false,
      },
      level: 'L2',
      cwd: process.cwd(),
      hostContext: context,
    }

    expect.soft(await isAlreadyInstalled(ctx), 'superpowers@superpowers-marketplace').toBe(false)
    expect(spawnCmd).not.toHaveBeenCalled()
  })
})
