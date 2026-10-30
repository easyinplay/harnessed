import { describe, expect, it, vi } from 'vitest'
import { executeRegisteredUpdate } from '../../src/cli/lib/updateAdapters/registry.js'
import type {
  GsdRuntimeIdentity,
  UpdateAdapterDependencies,
  UpdateAdapterPlan,
  UpdateInstallResult,
  UpdateObservation,
  UpdateRuntimeVerification,
} from '../../src/cli/lib/updateAdapters/types.js'

const identity = (
  version: string,
  overrides: Partial<GsdRuntimeIdentity> = {},
): GsdRuntimeIdentity => ({
  packageName: '@opengsd/gsd-core',
  version,
  host: 'codex',
  scope: 'global',
  ...overrides,
})

const plan = (overrides: Partial<UpdateAdapterPlan> = {}): UpdateAdapterPlan => ({
  componentId: 'gsd',
  mode: 'apply',
  host: 'codex',
  runtime: 'node',
  scope: 'global',
  cwd: process.cwd(),
  ...overrides,
})

const deps = (
  observations: UpdateObservation[],
  install: UpdateAdapterDependencies['install'] = vi.fn(
    async (): Promise<UpdateInstallResult> => ({ ok: true }),
  ),
  verifyRuntime: UpdateAdapterDependencies['verifyRuntime'] = vi.fn(
    async (): Promise<UpdateRuntimeVerification> => ({ ok: true }),
  ),
): UpdateAdapterDependencies => ({
  observe: vi.fn(
    async (): Promise<UpdateObservation> =>
      observations.shift() ?? { kind: 'unknown', reasonCode: 'missing-fixture' },
  ),
  install,
  verifyRuntime,
})

describe('reviewed GSD update adapter', () => {
  it.each([
    ['current', '1.18.0', true],
    ['updated', '1.19.0', true],
    ['retained', '1.18.0', false],
  ] as const)('does not report a verified %s from an identity shim when assets are missing', async (_status, after, installed) => {
    const result = await executeRegisteredUpdate(
      plan(),
      deps(
        [
          { kind: 'known', identity: identity('1.18.0'), evidence: 'before' },
          { kind: 'known', identity: identity(after), evidence: 'after' },
        ],
        vi.fn(
          async (): Promise<UpdateInstallResult> =>
            installed ? { ok: true } : { ok: false, message: 'upstream failed' },
        ),
        vi.fn(async () => ({ ok: false, reasonCode: 'skill-runtime-incomplete' })),
      ),
    )

    expect(result.status).toBe('failed')
    expect(result.components[0]).toMatchObject({
      status: 'failed',
      before: '1.18.0',
      after,
      verified: false,
      reasonCode: 'skill-runtime-incomplete',
    })
  })

  it('fails closed when complete runtime verification throws', async () => {
    const result = await executeRegisteredUpdate(
      plan(),
      deps(
        [
          { kind: 'known', identity: identity('1.18.0'), evidence: 'before' },
          { kind: 'known', identity: identity('1.19.0'), evidence: 'after' },
        ],
        undefined,
        vi.fn(async () => {
          throw new Error('access denied')
        }),
      ),
    )

    expect(result.components[0]).toMatchObject({
      status: 'failed',
      verified: false,
      reasonCode: 'runtime-verification-failed',
    })
  })

  it('does not claim a verified dry-run for an incomplete installed runtime', async () => {
    const install = vi.fn()
    const result = await executeRegisteredUpdate(
      plan({ mode: 'dry-run' }),
      deps(
        [{ kind: 'known', identity: identity('1.18.0'), evidence: 'before' }],
        install,
        vi.fn(async () => ({ ok: false, reasonCode: 'skill-runtime-incomplete' })),
      ),
    )

    expect(result.components[0]).toMatchObject({
      status: 'failed',
      verified: false,
      reasonCode: 'skill-runtime-incomplete',
    })
    expect(install).not.toHaveBeenCalled()
  })

  it('reports current when a successful installer leaves the valid version unchanged', async () => {
    const result = await executeRegisteredUpdate(
      plan(),
      deps([
        { kind: 'known', identity: identity('1.18.0'), evidence: 'before' },
        { kind: 'known', identity: identity('1.18.0'), evidence: 'after' },
      ]),
    )

    expect(result.status).toBe('complete')
    expect(result.components[0]).toMatchObject({
      status: 'current',
      before: '1.18.0',
      after: '1.18.0',
      verified: true,
      reasonCode: null,
    })
  })

  it.each([
    ['1.18.0', '1.17.9'],
    ['1.10.0', '1.9.0'],
    ['1.18.0', '1.18.0-rc.1'],
    ['1.18.0-rc.10', '1.18.0-rc.2'],
    ['1.18.0', 'not-a-version'],
  ])('fails closed for a successful but invalid update direction %s -> %s', async (before, after) => {
    const result = await executeRegisteredUpdate(
      plan(),
      deps([
        { kind: 'known', identity: identity(before), evidence: 'before' },
        { kind: 'known', identity: identity(after), evidence: 'after' },
      ]),
    )

    expect(result.status).toBe('failed')
    expect(result.components[0]).toMatchObject({ status: 'failed', before, verified: false })
  })

  it.each([
    ['1.9.0', '1.10.0'],
    ['1.18.0-rc.2', '1.18.0-rc.10'],
    ['1.18.0-rc.10', '1.18.0'],
    ['1.18.0+old', '1.18.1+new'],
  ])('verifies a semver increase %s -> %s', async (before, after) => {
    const result = await executeRegisteredUpdate(
      plan(),
      deps([
        { kind: 'known', identity: identity(before), evidence: 'before' },
        { kind: 'known', identity: identity(after), evidence: 'after' },
      ]),
    )

    expect(result.components[0]).toMatchObject({ status: 'updated', before, after, verified: true })
  })

  it.each([
    'not-a-version',
    '1.18',
    '01.18.0',
    '1.18.0-01',
    '1.18.0-rc..1',
    '1.18.0 ',
  ])('rejects invalid before version %s before mutation', async (version) => {
    const install = vi.fn(async () => ({ ok: true as const }))
    const result = await executeRegisteredUpdate(
      plan(),
      deps([{ kind: 'known', identity: identity(version), evidence: 'before' }], install),
    )

    expect(result.components[0]).toMatchObject({
      status: 'unsupported',
      reasonCode: 'invalid-version',
      verified: false,
    })
    expect(install).not.toHaveBeenCalled()
  })

  it('does not verify a build-metadata-only change as an upgrade', async () => {
    const result = await executeRegisteredUpdate(
      plan(),
      deps([
        { kind: 'known', identity: identity('1.18.0+old'), evidence: 'before' },
        { kind: 'known', identity: identity('1.18.0+new'), evidence: 'after' },
      ]),
    )

    expect(result.components[0]).toMatchObject({ status: 'failed', verified: false })
  })

  it.each([
    '1.17.0',
    '1.19.0',
    'invalid',
  ])('does not report retained after installer failure changes the version to %s', async (version) => {
    const result = await executeRegisteredUpdate(
      plan(),
      deps(
        [
          { kind: 'known', identity: identity('1.18.0'), evidence: 'before' },
          { kind: 'known', identity: identity(version), evidence: 'after' },
        ],
        vi.fn(async () => ({ ok: false as const, message: 'upstream failed' })),
      ),
    )

    expect(result.components[0]).toMatchObject({ status: 'failed', verified: false })
  })

  it.each([
    ['wrong package', identity('1.0.0', { packageName: 'other-package' }), 'wrong-package'],
    ['wrong host', identity('1.0.0', { host: 'claude' }), 'wrong-host'],
  ])('rejects %s identity before mutation', async (_name, value, reasonCode) => {
    const install = vi.fn()
    const result = await executeRegisteredUpdate(
      plan(),
      deps([{ kind: 'known', identity: value, evidence: 'fixture' }], install),
    )

    expect(result.components[0]).toMatchObject({ status: 'unsupported', reasonCode })
    expect(install).not.toHaveBeenCalled()
  })

  it('rejects unknown host and unproven scope before mutation', async () => {
    const install = vi.fn()
    const unknownHost = await executeRegisteredUpdate(
      plan({ host: null }),
      deps([{ kind: 'unknown', reasonCode: 'unknown-host' }], install),
    )
    const unprovenScope = await executeRegisteredUpdate(
      plan({ scope: 'unknown' }),
      deps([{ kind: 'known', identity: identity('1.0.0'), evidence: 'fixture' }], install),
    )

    expect(unknownHost.components[0]).toMatchObject({
      status: 'unsupported',
      reasonCode: 'unknown-host',
    })
    expect(unprovenScope.components[0]).toMatchObject({
      status: 'unsupported',
      reasonCode: 'unproven-scope',
    })
    expect(install).not.toHaveBeenCalled()
  })

  it('reports missing runtime without installing it', async () => {
    const install = vi.fn()
    const verifyRuntime = vi.fn()
    const result = await executeRegisteredUpdate(
      plan(),
      deps([{ kind: 'not-installed', reasonCode: 'runtime-missing' }], install, verifyRuntime),
    )

    expect(result.components[0]).toMatchObject({
      status: 'not-installed',
      reasonCode: 'runtime-missing',
    })
    expect(install).not.toHaveBeenCalled()
    expect(verifyRuntime).not.toHaveBeenCalled()
  })

  it.each([
    ['claude', ['npx', '--yes', '@opengsd/gsd-core@latest', '--claude', '--global']],
    ['codex', ['npx', '--yes', '@opengsd/gsd-core@latest', '--codex', '--global']],
  ] as const)('uses the explicit %s upstream installer', async (host, expectedCommand) => {
    const install = vi.fn(async (action: { command: string; args: string[] }) => {
      expect([action.command, ...action.args]).toEqual(expectedCommand)
      return { ok: true as const }
    })
    const result = await executeRegisteredUpdate(
      plan({ host }),
      deps(
        [
          { kind: 'known', identity: identity('1.0.0', { host }), evidence: 'before' },
          { kind: 'known', identity: identity('1.1.0', { host }), evidence: 'after' },
        ],
        install,
      ),
    )

    expect(result.components[0]).toMatchObject({
      status: 'updated',
      before: '1.0.0',
      target: 'latest',
      after: '1.1.0',
      verified: true,
    })
  })

  it('returns a reviewed planned action without mutation in dry-run', async () => {
    const install = vi.fn()
    const result = await executeRegisteredUpdate(
      plan({ mode: 'dry-run' }),
      deps([{ kind: 'known', identity: identity('1.0.0'), evidence: 'before' }], install),
    )

    expect(result.components[0]).toMatchObject({
      status: 'planned',
      before: '1.0.0',
      target: 'latest',
      reasonCode: 'reviewed-upstream-action',
      verified: true,
    })
    expect(install).not.toHaveBeenCalled()
  })

  it('retains the old runtime when apply fails but post-verification still passes', async () => {
    const result = await executeRegisteredUpdate(
      plan(),
      deps(
        [
          { kind: 'known', identity: identity('1.0.0'), evidence: 'before' },
          { kind: 'known', identity: identity('1.0.0'), evidence: 'after-failure' },
        ],
        vi.fn(async () => ({ ok: false as const, message: 'upstream failed' })),
      ),
    )

    expect(result.components[0]).toMatchObject({
      status: 'retained',
      before: '1.0.0',
      after: '1.0.0',
      verified: true,
      reasonCode: 'update-failed-retained',
    })
  })
})
