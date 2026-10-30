import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { refreshOwnedUpdate } from '../../src/cli/lib/refreshOwnedUpdate.js'
import { executeRegisteredUpdate } from '../../src/cli/lib/updateAdapters/registry.js'
import {
  createUpdateContinuation,
  encodeUpdateContinuation,
} from '../../src/cli/lib/updateContinuation.js'
import {
  executeUpdate,
  runUpdateCoordinator,
  updateTarget,
  validateUpdateOptions,
} from '../../src/cli/lib/updateCoordinator.js'
import { acquireUpdateLock } from '../../src/cli/lib/updateLock.js'
import {
  buildUpdateResult,
  createUpdateComponent,
  getUpdateExitCode,
} from '../../src/cli/lib/updateResult.js'
import { getLocale, type SupportedLocale, setLocale } from '../../src/i18n/index.js'

vi.mock('../../src/cli/lib/refreshOwnedUpdate.js', () => ({ refreshOwnedUpdate: vi.fn() }))
vi.mock('../../src/cli/lib/updateAdapters/registry.js', () => ({
  executeRegisteredUpdate: vi.fn(),
}))

const current = () => createUpdateComponent({ id: 'harnessed', status: 'current', verified: true })
const dependencies = () => ({
  host: 'codex' as const,
  runtime: 'node' as const,
  selfUpdate: vi.fn(async () => current()),
  continueUpdate: vi.fn(async () => [
    createUpdateComponent({ id: 'gsd', status: 'not-installed' }),
  ]),
  inspect: vi.fn(async () => [createUpdateComponent({ id: 'gsd', status: 'planned' })]),
})

describe('T6 pure coordinator contract', () => {
  it.each([
    [
      { all: true, repair: true, nonInteractive: true },
      '--non-interactive --repair requires explicit --yes authorization',
    ],
    [
      { all: true, repair: true, json: true },
      '--json --repair requires explicit --yes authorization',
    ],
    [{ all: true, yes: true }, '--yes requires --repair'],
    [{ repair: true, yes: true }, '--repair requires --all or --upstreams'],
  ])('requires explicit bounded repair authorization: %j', (options, message) => {
    expect(validateUpdateOptions(options)).toBe(message)
  })

  it('all delegates closure to fresh P2 even when self is current', async () => {
    const deps = dependencies()
    const result = await runUpdateCoordinator({ all: true, json: true, nonInteractive: true }, deps)
    expect(result.status).toBe('complete')
    expect(deps.continueUpdate).toHaveBeenCalledTimes(1)
    expect(result.components.map((entry) => entry.id)).toEqual(['harnessed', 'gsd'])
    expect(getUpdateExitCode(result)).toBe(0)
  })

  it.each([
    'failed',
    'retained',
    'unsupported',
  ] as const)('%s self stops adapters', async (status) => {
    const deps = dependencies()
    deps.selfUpdate.mockResolvedValue(createUpdateComponent({ id: 'harnessed', status }))
    const result = await runUpdateCoordinator({ all: true }, deps)
    expect(getUpdateExitCode(result)).toBe(1)
    expect(deps.continueUpdate).not.toHaveBeenCalled()
    expect(deps.inspect).not.toHaveBeenCalled()
  })

  it.each([
    'unsupported',
    'retained',
    'failed',
  ] as const)('%s upstream is partial exit 1', async (status) => {
    const deps = dependencies()
    deps.continueUpdate.mockResolvedValue([createUpdateComponent({ id: 'gsd', status })])
    const result = await runUpdateCoordinator({ all: true }, deps)
    expect(result.status).toBe('partial')
    expect(getUpdateExitCode(result)).toBe(1)
  })

  it.each([
    'check',
    'dryRun',
  ] as const)('%s only inspects and never applies or starts P2', async (flag) => {
    const deps = dependencies()
    const result = await runUpdateCoordinator({ all: true, [flag]: true }, deps)
    expect(deps.selfUpdate).not.toHaveBeenCalled()
    expect(deps.continueUpdate).not.toHaveBeenCalled()
    expect(deps.inspect).toHaveBeenCalledWith(
      expect.objectContaining({ mode: flag === 'check' ? 'check' : 'dry-run' }),
    )
    expect(getUpdateExitCode(result)).toBe(0)
  })

  it('handoff failure preserves changed self and reports incomplete closure', async () => {
    const deps = dependencies()
    deps.selfUpdate.mockResolvedValue(
      createUpdateComponent({
        id: 'harnessed',
        status: 'updated',
        before: '5.0.4',
        after: '5.0.5',
      }),
    )
    deps.continueUpdate.mockRejectedValue(new Error('spawn failed'))
    const result = await runUpdateCoordinator({ all: true }, deps)
    expect(result.status).toBe('partial')
    expect(result.components[0]).toMatchObject({ status: 'updated', after: '5.0.5' })
    expect(result.components[1]).toMatchObject({ status: 'failed', reasonCode: 'handoff-failed' })
    expect(getUpdateExitCode(result)).toBe(1)
  })

  it('fatal self exception is a JSON-safe failed envelope', async () => {
    const deps = dependencies()
    deps.selfUpdate.mockRejectedValue(new Error('fixture fatal'))
    const result = await runUpdateCoordinator({ all: true }, deps)
    expect(JSON.parse(JSON.stringify(result))).toMatchObject({
      schemaVersion: 1,
      operation: 'update',
      host: 'codex',
      error: { kind: 'fatal', message: 'fixture fatal' },
    })
    expect(getUpdateExitCode(result)).toBe(1)
    expect(deps.continueUpdate).not.toHaveBeenCalled()
  })

  it.each([
    { platform: 'other' },
    { check: true, dryRun: true },
    { all: true, rollback: true },
  ])('invalid options %j are exit 2 without execution', async (options) => {
    const deps = dependencies()
    const result = await runUpdateCoordinator(options, deps)
    expect(result.error?.kind).toBe('arguments')
    expect(getUpdateExitCode(result)).toBe(2)
    expect(deps.selfUpdate).not.toHaveBeenCalled()
  })
})

describe('P2 first-party refresh gate', () => {
  let root: string
  const originalArgv = process.argv

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'harnessed-update-json-'))
    const entry = join(root, 'cli.mjs')
    await writeFile(entry, '')
    process.argv = [process.execPath, entry]
    const assets = join(root, 'assets')
    await mkdir(join(assets, 'manifests', 'tools'), { recursive: true })
    await mkdir(join(assets, 'manifests', 'skill-packs'), { recursive: true })
    await copyFile(
      resolve('manifests/skill-packs/gsd.yaml'),
      join(assets, 'manifests', 'skill-packs', 'gsd.yaml'),
    )
    vi.stubEnv('HARNESSED_ASSETS_OVERRIDE', assets)
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', join(root, 'state'))
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    vi.stubEnv('CODEX_HOME', join(root, '.codex'))
  })

  afterEach(async () => {
    setLocale('en')
    process.argv = originalArgv
    vi.resetAllMocks()
    vi.unstubAllEnvs()
    await rm(root, { recursive: true, force: true })
  })

  function continuationFor(lock: { nonce: string; targetKey: string }, lang?: SupportedLocale) {
    return encodeUpdateContinuation(
      createUpdateContinuation({
        nonce: lock.nonce,
        targetKey: lock.targetKey,
        channel: 'package',
        mode: 'apply',
        host: 'codex',
        runtime: 'node',
        scope: 'all',
        nonInteractive: true,
        json: true,
        createdAt: Date.now(),
        ...(lang === undefined ? {} : { lang }),
      }),
    )
  }

  it.each([
    'en',
    'zh-Hans',
  ] as const)('P2 sets verified %s locale before refresh despite ambient locale', async (lang) => {
    vi.stubEnv('HARNESSED_LANG', lang === 'en' ? 'zh-Hans' : 'en')
    setLocale(lang === 'en' ? 'zh-Hans' : 'en')
    const seen: string[] = []
    vi.mocked(refreshOwnedUpdate).mockImplementation(async () => {
      seen.push(getLocale())
      return [createUpdateComponent({ id: 'harnessed-workflows', status: 'failed' })]
    })
    const acquired = await acquireUpdateLock({
      stateRoot: join(root, 'state'),
      target: updateTarget().target,
    })
    if (acquired.status !== 'acquired') throw new Error('fixture lock missing')
    try {
      const result = await executeUpdate({
        updateContinuation: continuationFor(acquired.lock, lang),
        lang,
      })
      expect(result.error).toBeNull()
      expect(seen).toEqual([lang])
    } finally {
      await acquired.lock.release()
    }
  })

  it.each([
    ['en', 'zh-Hans'],
    ['zh-Hans', 'en'],
    ['zh-Hans', 'zh-CN'],
    ['en', undefined],
    [undefined, 'en'],
  ] as const)('P2 rejects locale identity %s/%s before nonce consumption and refresh', async (payloadLang, lang) => {
    setLocale('en')
    vi.mocked(refreshOwnedUpdate).mockResolvedValue([
      createUpdateComponent({ id: 'harnessed-workflows', status: 'failed' }),
    ])
    const acquired = await acquireUpdateLock({
      stateRoot: join(root, 'state'),
      target: updateTarget().target,
    })
    if (acquired.status !== 'acquired') throw new Error('fixture lock missing')
    try {
      const encoded = continuationFor(acquired.lock, payloadLang)
      const rejected = await executeUpdate({
        updateContinuation: encoded,
        ...(lang === undefined ? {} : { lang }),
      })
      expect(rejected.error?.kind).toBe('protocol')
      expect(refreshOwnedUpdate).not.toHaveBeenCalled()
      expect(getLocale()).toBe('en')
      const accepted = await executeUpdate({
        updateContinuation: encoded,
        ...(payloadLang === undefined ? {} : { lang: payloadLang }),
      })
      expect(accepted.error).toBeNull()
      expect(refreshOwnedUpdate).toHaveBeenCalledOnce()
    } finally {
      await acquired.lock.release()
    }
  })

  it.each([
    ['retained', 'current'],
    ['retained', 'updated'],
    ['unsupported', 'current'],
    ['unsupported', 'updated'],
    ['failed', null],
  ] as const)('%s first-party refresh yields GSD %s without hiding partial status', async (ownedStatus, gsdStatus) => {
    const reminder = createUpdateComponent({
      id: 'update-reminder',
      status: ownedStatus,
      reasonCode: ownedStatus === 'retained' ? 'hook-trust-pending' : 'fixture-refresh',
      verified: false,
    })
    vi.mocked(refreshOwnedUpdate).mockResolvedValue([
      createUpdateComponent({ id: 'harnessed-workflows', status: 'updated', verified: true }),
      reminder,
    ])
    if (gsdStatus)
      vi.mocked(executeRegisteredUpdate).mockResolvedValue(
        buildUpdateResult({
          mode: 'apply',
          host: 'codex',
          runtime: 'node',
          components: [createUpdateComponent({ id: 'gsd', status: gsdStatus, verified: true })],
        }),
      )
    const acquired = await acquireUpdateLock({
      stateRoot: join(root, 'state'),
      target: updateTarget().target,
    })
    if (acquired.status !== 'acquired') throw new Error('fixture lock missing')
    try {
      const result = await executeUpdate({
        updateContinuation: encodeUpdateContinuation(
          createUpdateContinuation({
            nonce: acquired.lock.nonce,
            targetKey: acquired.lock.targetKey,
            channel: 'package',
            mode: 'apply',
            host: 'codex',
            runtime: 'node',
            scope: 'all',
            nonInteractive: true,
            json: true,
            createdAt: Date.now(),
          }),
        ),
      })
      expect(result.error).toBeNull()
      expect(result.status).toBe('partial')
      expect(getUpdateExitCode(result)).toBe(1)
      expect(result.components).toContainEqual(reminder)
      if (gsdStatus) {
        expect(result.components).toContainEqual(
          expect.objectContaining({ id: 'gsd', status: gsdStatus, verified: true }),
        )
      } else {
        expect(result.components.some((entry) => entry.id === 'gsd')).toBe(false)
        expect(executeRegisteredUpdate).not.toHaveBeenCalled()
      }
    } finally {
      await acquired.lock.release()
    }
  })
})
