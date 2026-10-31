import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { parse } from 'yaml'
import { resolveComponentPlan } from '../../src/installers/lib/componentPlan.js'
import type { Manifest } from '../../src/installers/lib/types.js'
import { captureHostInstallContext } from '../../src/platform/hostInstallContext.js'
import { runUninstall } from '../../src/uninstallers/index.js'

const boundary = vi.hoisted(() => ({ teardown: vi.fn() }))

vi.mock('../../src/uninstallers/lib/declaredTeardown.js', () => ({
  hasDeclaredUninstall: () => true,
  runDeclaredTeardown: boundary.teardown,
}))

const gsd = parse(
  readFileSync(new URL('../../manifests/skill-packs/gsd.yaml', import.meta.url), 'utf8'),
) as Manifest

function codexContext() {
  return captureHostInstallContext({ hostId: 'codex', os: 'linux', userHome: '/fixture' })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('CODEX_HOME', '/fixture/.codex')
  boundary.teardown.mockResolvedValue({ ok: true, removedPaths: [] })
})

describe('reviewed GSD Codex uninstall command', () => {
  it('plans and dispatches the exact official command', async () => {
    const context = codexContext()
    const plan = resolveComponentPlan(gsd, context, 'uninstall')

    expect(plan).toMatchObject({
      status: 'supported',
      sources: { install: 'host-override', uninstall: 'host-override' },
    })
    expect(plan.manifest.spec.uninstall).toEqual({
      cmd: 'npx --yes @opengsd/gsd-core@latest --codex --global --uninstall',
      cleanup_paths: [],
    })

    await expect(
      runUninstall(gsd, { apply: true, dryRun: false, yes: true }, context),
    ).resolves.toEqual({ ok: true, removedPaths: [] })
    expect(boundary.teardown).toHaveBeenCalledWith(
      expect.objectContaining({
        manifest: expect.objectContaining({
          spec: expect.objectContaining({
            uninstall: {
              cmd: 'npx --yes @opengsd/gsd-core@latest --codex --global --uninstall',
              cleanup_paths: [],
            },
          }),
        }),
      }),
    )
  })

  it.each([
    ['different component', (manifest: Manifest) => (manifest.metadata.name = 'fixture')],
    [
      'different command',
      (manifest: Manifest) => {
        const uninstall = manifest.spec.harness_overrides?.codex?.uninstall
        if (uninstall) uninstall.cmd += ' --force'
      },
    ],
    [
      'declared cleanup',
      (manifest: Manifest) => {
        const uninstall = manifest.spec.harness_overrides?.codex?.uninstall
        if (uninstall) uninstall.cleanup_paths = ['~/.agents/skills/gsd-plan-phase']
      },
    ],
  ])('keeps %s unsupported', (_case, mutate) => {
    const manifest = structuredClone(gsd)
    mutate(manifest)

    expect(resolveComponentPlan(manifest, codexContext(), 'uninstall')).toMatchObject({
      status: 'unsupported',
      reason: 'unsupported-operation',
    })
  })
})
