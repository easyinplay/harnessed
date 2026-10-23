import { afterEach, describe, expect, it, vi } from 'vitest'
import { installers, runInstall } from '../../src/installers/index.js'
import type { InstallOpts, Manifest } from '../../src/installers/lib/types.js'
import { createHostInstallContext } from '../../src/platform/hostInstallContext.js'
import * as platform from '../../src/platform/platform.js'

const opts: InstallOpts = {
  apply: false,
  dryRun: true,
  system: false,
  nonInteractive: true,
  fullDiff: false,
  color: false,
}
function fixture(): Manifest {
  return {
    apiVersion: 'harnessed/v1',
    kind: 'Manifest',
    metadata: {
      name: 'fixture',
      description: 'fixture',
      upstream: {
        source: 'fixture',
        homepage: 'https://example.com',
        repository: 'https://github.com/example/fixture.git',
        license: 'MIT',
        notice: 'fixture',
      },
    },
    spec: {
      type: 'cli-npm',
      component_type: 'cli-binary',
      category: 'engineering',
      install_type: 'npm',
      signed_by: 'fixture',
      platforms: ['linux'],
      upstream_health: {
        stability: 'stable',
        last_check: '2026-10-23',
        last_known_good_version: '1.0.0',
        fallback_action: 'warn',
      },
      install: {
        method: 'npm-cli',
        cmd: 'base install',
        npm_version: '^1.0.0',
        idempotent_check: 'true',
      },
      verify: { cmd: 'base verify', timeout_ms: 1000 },
      uninstall: { cmd: 'base uninstall' },
      harness_overrides: {
        codex: {
          install: {
            method: 'npm-cli',
            cmd: 'codex install',
            npm_version: '^1.0.0',
            idempotent_check: 'true',
            env: { CODEX_HOME: '/manifest-native' },
          },
        },
      },
    },
  } as Manifest
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('runInstall host selection boundary', () => {
  it('captures once and dispatches effective context without changing permission opts', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '/state')
    const selection = vi.spyOn(platform, 'detectPlatform')
    const dispatch = vi.spyOn(installers, 'npm-cli').mockResolvedValue({
      ok: true,
      backupId: '',
      appliedFiles: [],
    })
    await runInstall(fixture(), opts)
    expect(selection).toHaveBeenCalledOnce()
    const call = dispatch.mock.calls[0]?.[0]
    expect(call).toBeDefined()
    if (!call) throw new Error('installer did not dispatch')
    expect(call.opts).toBe(opts)
    expect(call.manifest.spec.install.cmd).toBe('codex install')
    expect(call.hostContext).toMatchObject({
      hostId: 'codex',
      nativeHome: '/manifest-native',
      platform: { stateRoot: '/state' },
    })
  })

  it('uses provided context without redetection after ambient host/home drift', async () => {
    const context = createHostInstallContext(platform.codexDescriptor('/fixture'), {
      os: 'linux',
      userHome: '/fixture',
      nativeHome: '/native',
    })
    vi.stubEnv('HARNESSED_PLATFORM', 'claude')
    vi.stubEnv('CODEX_HOME', '/later-native')
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '/later-state')
    const selection = vi.spyOn(platform, 'detectPlatform')
    const dispatch = vi.spyOn(installers, 'npm-cli').mockResolvedValue({
      ok: true,
      backupId: '',
      appliedFiles: [],
    })
    const manifest = fixture()
    const override = manifest.spec.harness_overrides?.codex
    if (!override) throw new Error('fixture requires Codex override')
    delete override.install.env
    await runInstall(manifest, opts, context)
    expect(selection).not.toHaveBeenCalled()
    expect(dispatch.mock.calls[0]?.[0].hostContext).toEqual(context)
    expect(dispatch.mock.calls[0]?.[0].manifest.spec.install.cmd).toBe('codex install')
    expect(manifest.spec.install.cmd).toBe('base install')
  })
})
