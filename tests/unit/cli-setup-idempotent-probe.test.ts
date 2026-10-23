import { ChildProcess, execFile } from 'node:child_process'
import { access, cp, mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeIdempotentProbe } from '../../src/cli/lib/setup-helpers.js'
import * as installers from '../../src/installers/index.js'
import { isAlreadyInstalled } from '../../src/installers/lib/idempotent.js'
import { spawnCmd } from '../../src/installers/lib/spawn.js'
import type { Manifest } from '../../src/installers/lib/types.js'
import { verifyInstalled } from '../../src/installers/lib/verifyInstalled.js'
import { validateManifestFile } from '../../src/manifest/validate.js'

vi.mock('node:child_process', async (importOriginal) => {
  const original = await importOriginal<typeof import('node:child_process')>()
  return { ...original, execFile: vi.fn(original.execFile) }
})
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  stat: vi.fn(),
  access: vi.fn(),
  cp: vi.fn(),
  mkdir: vi.fn(),
  writeFile: vi.fn(),
}))
vi.mock('../../src/installers/lib/idempotent.js', () => ({ isAlreadyInstalled: vi.fn() }))
vi.mock('../../src/installers/lib/verifyInstalled.js', () => ({ verifyInstalled: vi.fn() }))
vi.mock('../../src/manifest/validate.js', () => ({ validateManifestFile: vi.fn() }))
vi.mock('../../src/installers/lib/spawn.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/installers/lib/spawn.js')>()),
  spawnCmd: vi.fn(),
}))

function manifest(): Manifest {
  return {
    metadata: { name: 'demo' },
    spec: {
      install: { method: 'git-clone-with-setup', cmd: 'git clone repo ~/.claude/skills/demo' },
      verify: { cmd: 'test -f ~/.claude/skills/demo/SKILL.md' },
    },
  } as Manifest
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('HARNESSED_PLATFORM', 'codex')
  vi.mocked(readFile).mockResolvedValue('fixture manifest')
  vi.mocked(validateManifestFile).mockReturnValue({ ok: true, manifest: manifest() })
  vi.mocked(isAlreadyInstalled).mockResolvedValue(true)
  vi.mocked(verifyInstalled).mockResolvedValue(null)
  vi.mocked(stat).mockRejectedValue(new Error('ENOENT'))
  vi.mocked(spawnCmd).mockResolvedValue({ ok: true, exitCode: 0, stdout: '', stderr: '' })
  vi.spyOn(installers, 'runInstall')
})

afterEach(() => {
  expect(installers.runInstall).not.toHaveBeenCalled()
  expect(cp).not.toHaveBeenCalled()
  expect(mkdir).not.toHaveBeenCalled()
  expect(writeFile).not.toHaveBeenCalled()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('setup retained-version probe', () => {
  it('presence plus failed verify is not a working retained version', async () => {
    vi.mocked(verifyInstalled).mockResolvedValue({
      ok: false,
      phase: 'verify',
      error: { message: 'runtime helper missing' },
    } as never)
    const probe = await makeIdempotentProbe(['demo.yaml'])
    expect(await probe('demo')).toBe(false)
    expect(verifyInstalled).toHaveBeenCalledOnce()
  })

  it('requires both presence and successful read-only verification', async () => {
    const probe = await makeIdempotentProbe(['demo.yaml'])
    expect(await probe('demo')).toBe(true)
    expect(verifyInstalled).toHaveBeenCalledWith(
      expect.objectContaining({
        opts: expect.objectContaining({ apply: false, system: false, updateInstalled: false }),
      }),
    )
  })

  it('does not verify an absent component', async () => {
    vi.mocked(isAlreadyInstalled).mockResolvedValue(false)
    const probe = await makeIdempotentProbe(['demo.yaml'])
    expect(await probe('demo')).toBe(false)
    expect(verifyInstalled).not.toHaveBeenCalled()
  })

  it('verify exceptions fail closed', async () => {
    vi.mocked(verifyInstalled).mockRejectedValue(new Error('EACCES'))
    const probe = await makeIdempotentProbe(['demo.yaml'])
    expect(await probe('demo')).toBe(false)
  })

  it('resolves Codex override method and paths before both checks without mutating the manifest', async () => {
    const raw = manifest()
    raw.spec.install.method = 'cc-plugin-marketplace'
    raw.spec.harness_overrides = {
      codex: {
        install: {
          method: 'npx-skill-installer',
          cmd: 'npx skills add example/demo --copy -y',
          npm_version: '^1.0.0',
          idempotent_check: 'test -f ~/.agents/skills/demo/SKILL.md',
        },
        verify: { cmd: 'test -f ~/.agents/skills/demo/SKILL.md', timeout_ms: 1000 },
      },
    }
    vi.mocked(validateManifestFile).mockReturnValue({ ok: true, manifest: raw })
    const probe = await makeIdempotentProbe(['demo.yaml'])

    expect(await probe('demo')).toBe(true)

    const context = vi.mocked(isAlreadyInstalled).mock.calls[0]?.[0]
    expect(context?.manifest.spec.install.method).toBe('npx-skill-installer')
    expect(context?.manifest.spec.install.idempotent_check).toBe(
      'test -f ~/.agents/skills/demo/SKILL.md',
    )
    expect(context?.manifest.spec.verify.cmd).toBe('test -f ~/.agents/skills/demo/SKILL.md')
    expect(verifyInstalled).toHaveBeenCalledWith(context)
    expect(raw.spec.install.method).toBe('cc-plugin-marketplace')
    expect(raw.spec.verify.cmd).toBe('test -f ~/.claude/skills/demo/SKILL.md')
  })

  it('does not probe a manifest rejected by the active harness gate', async () => {
    const raw = manifest()
    raw.spec.install.method = 'cc-plugin-marketplace'
    vi.mocked(validateManifestFile).mockReturnValue({ ok: true, manifest: raw })
    const probe = await makeIdempotentProbe(['demo.yaml'])
    expect(await probe('demo')).toBe(false)
    expect(isAlreadyInstalled).not.toHaveBeenCalled()
    expect(verifyInstalled).not.toHaveBeenCalled()
  })

  it('unknown names fail closed without checking or repairing anything', async () => {
    const probe = await makeIdempotentProbe(['demo.yaml'])
    expect(await probe('unknown')).toBe(false)
    expect(isAlreadyInstalled).not.toHaveBeenCalled()
    expect(verifyInstalled).not.toHaveBeenCalled()
  })

  it('the real verifier rejects broken runtime resources even in a read-only probe', async () => {
    const { verifyInstalled: realVerify } = await vi.importActual<
      typeof import('../../src/installers/lib/verifyInstalled.js')
    >('../../src/installers/lib/verifyInstalled.js')
    vi.mocked(verifyInstalled).mockImplementation(realVerify)
    const raw = manifest()
    raw.metadata.name = 'gsd'
    vi.mocked(validateManifestFile).mockReturnValue({ ok: true, manifest: raw })
    const probe = await makeIdempotentProbe(['gsd.yaml'])

    expect(await probe('gsd')).toBe(false)
    expect(stat).toHaveBeenCalled()
    expect(execFile).not.toHaveBeenCalled()
    expect(spawnCmd).toHaveBeenCalledOnce()
    expect(vi.mocked(spawnCmd).mock.calls[0]?.[0].opts.apply).toBe(false)
  })

  it('the real verifier rejects a failed command without attempting an install', async () => {
    const { verifyInstalled: realVerify } = await vi.importActual<
      typeof import('../../src/installers/lib/verifyInstalled.js')
    >('../../src/installers/lib/verifyInstalled.js')
    vi.mocked(verifyInstalled).mockImplementation(realVerify)
    vi.mocked(spawnCmd).mockResolvedValue({ ok: true, exitCode: 1, stdout: '', stderr: 'broken' })
    const probe = await makeIdempotentProbe(['demo.yaml'])

    expect(await probe('demo')).toBe(false)
    expect(spawnCmd).toHaveBeenCalledOnce()
    expect(vi.mocked(spawnCmd).mock.calls[0]?.[1]).toBe('test -f ~/.claude/skills/demo/SKILL.md')
  })

  it('the real verifier accepts healthy resources without enabling writes', async () => {
    const { verifyInstalled: realVerify } = await vi.importActual<
      typeof import('../../src/installers/lib/verifyInstalled.js')
    >('../../src/installers/lib/verifyInstalled.js')
    vi.mocked(verifyInstalled).mockImplementation(realVerify)
    vi.mocked(stat).mockResolvedValue({ isFile: () => true, size: 1 } as never)
    vi.mocked(access).mockResolvedValue(undefined)
    vi.mocked(execFile).mockImplementation((...args) => {
      const callback = args.at(-1) as (error: Error | null, stdout: string, stderr: string) => void
      queueMicrotask(() =>
        callback(null, '{"packageName":"@opengsd/gsd-core","version":"1.18.0"}', ''),
      )
      return new ChildProcess()
    })
    const raw = manifest()
    raw.metadata.name = 'gsd'
    vi.mocked(validateManifestFile).mockReturnValue({ ok: true, manifest: raw })
    const probe = await makeIdempotentProbe(['gsd.yaml'])

    expect(await probe('gsd')).toBe(true)
    expect(stat).toHaveBeenCalledWith(expect.stringContaining('gsd-core'))
    expect(execFile).toHaveBeenCalledOnce()
    expect(execFile).toHaveBeenCalledWith(
      'node',
      [expect.stringMatching(/[\\/]gsd-core[\\/]bin[\\/]gsd-tools\.cjs$/), 'runtime-identity'],
      expect.objectContaining({ shell: false, windowsHide: true }),
      expect.any(Function),
    )
    expect(vi.mocked(spawnCmd).mock.calls[0]?.[0].opts).toMatchObject({
      apply: false,
      dryRun: false,
    })
  })
})
