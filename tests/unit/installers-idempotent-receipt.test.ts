// Phase 59 — wiring regression: the idempotent early return must record a receipt.
//
// Every installer probes `isAlreadyInstalled(ctx)` and returns early on a hit.
// That return sat BEFORE the `updateInstalled` call at the end of the success
// path in all six installers, so the receipt was only ever written on the path
// that performed a write. A component installed by hand — e.g. the
// upstream-documented `claude plugin install` — or one whose entry was lost could
// never be recorded, and no number of `harnessed install` runs would repair it.
// `harnessed status`, the one consumer of state.json, then reported
// "no installs recorded" on a machine full of installed components (dogfooded).
//
// The unit tests in installers-lib-state.test.ts cover recordObservedInstall's
// own behaviour. This file covers the thing that actually broke: whether the
// early-return path reaches it at all. Mocking `idempotent.js` is what makes the
// hit deterministic — the real probe does native fs/registry detection.
//
// Sister defect: Trellis #575 (`fix(update): repair receipt entries for files
// already identical to a template`).

import { beforeEach, describe, expect, it, vi } from 'vitest'

const runtimeVerifyMock = vi.hoisted(() =>
  vi.fn<(ctx: InstallContext) => Promise<InstallResult | null>>(async () => null),
)
vi.mock('../../src/installers/lib/skillRuntime.js', () => ({
  verifySkillRuntime: runtimeVerifyMock,
}))
vi.mock('../../src/installers/lib/idempotent.js', () => ({
  isAlreadyInstalled: vi.fn(async () => true),
  extractSkillName: vi.fn(() => 'ctx7'),
  detectSkillPresence: vi.fn(async () => true),
}))
vi.mock('node:child_process', () => ({ spawn: vi.fn() }))
vi.mock('../../src/installers/lib/spawn.js', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/installers/lib/spawn.js')>()
  return {
    ...real,
    spawnCmd: vi.fn(async () => ({ ok: true, exitCode: 0, stdout: '', stderr: '' })),
  }
})
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(async () => undefined),
  readFile: vi.fn(async () => {
    const e = new Error('ENOENT') as NodeJS.ErrnoException
    e.code = 'ENOENT'
    throw e
  }),
  writeFile: vi.fn(async () => undefined),
  rename: vi.fn(async () => undefined),
}))
vi.mock('@clack/prompts', () => ({
  confirm: vi.fn(async () => true),
  select: vi.fn(async () => 'abort'),
  note: vi.fn(),
  isCancel: vi.fn(() => false),
}))

import { writeFile } from 'node:fs/promises'
import { installGitCloneWithSetup } from '../../src/installers/gitCloneWithSetup.js'
import { isAlreadyInstalled } from '../../src/installers/lib/idempotent.js'
import { spawnCmd } from '../../src/installers/lib/spawn.js'
import type {
  InstallContext,
  InstallOpts,
  InstallResult,
  Manifest,
} from '../../src/installers/lib/types.js'
import { installNpmCli } from '../../src/installers/npmCli.js'
import { installNpxSkillInstaller } from '../../src/installers/npxSkillInstaller.js'

const writeFileMock = vi.mocked(writeFile)

function manifest(): Manifest {
  return {
    apiVersion: 'harnessed/v1',
    kind: 'Manifest',
    metadata: {
      name: 'ctx7',
      display_name: 'Context7',
      description: 'fixture',
      upstream: {
        source: 'ctx7',
        homepage: 'https://example.com',
        repository: 'https://github.com/example/ctx7.git',
        license: 'MIT',
        notice: 'fixture',
      },
    },
    spec: {
      type: 'cli-npm',
      component_type: 'cli-binary',
      install: {
        method: 'npm-cli',
        cmd: 'npm install -g ctx7',
        npm_version: '^0.5.0',
        idempotent_check: 'which ctx7',
      },
      verify: { cmd: 'ctx7 --version', timeout_ms: 5000, expected_exit_code: 0 },
      uninstall: { cmd: 'npm uninstall -g ctx7' },
      upstream_health: {
        stability: 'stable',
        last_check: '2026-09-10',
        last_known_good_version: '0.5.11',
        fallback_action: 'warn',
      },
      signed_by: 'easyinplay',
      platforms: ['linux', 'darwin', 'win32'],
    },
  } as Manifest
}

function ctx(): InstallContext {
  const opts = { yes: true, system: true, dryRun: false, quiet: true } as unknown as InstallOpts
  return { manifest: manifest(), opts, level: 'L4', cwd: '/tmp/proj' }
}

/** The single state.json payload written during the call, parsed. */
function writtenState(): { installed: Record<string, { version: string }> } | null {
  for (const call of writeFileMock.mock.calls) {
    const body = call[1]
    if (typeof body !== 'string' || !body.includes('"installed"')) continue
    return JSON.parse(body) as { installed: Record<string, { version: string }> }
  }
  return null
}

describe('installer idempotent path — records a receipt (Phase 59)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    runtimeVerifyMock.mockResolvedValue(null)
    vi.mocked(isAlreadyInstalled).mockResolvedValue(true)
    vi.mocked(spawnCmd).mockResolvedValue({ ok: true, exitCode: 0, stdout: '', stderr: '' })
  })

  it('an already-installed component is written to state.json, not silently skipped', async () => {
    writeFileMock.mockClear()
    const r = await installNpmCli(ctx())

    // Still the idempotent no-op it always was …
    expect(r).toMatchObject({ ok: true, alreadyInstalled: true })

    // … but the receipt now exists, so `harnessed status` can see it.
    const state = writtenState()
    expect(state, 'no state.json payload was written on the idempotent path').not.toBeNull()
    expect(state?.installed.ctx7?.version).toBe('^0.5.0')
  })
})

describe.each([
  { method: 'npm-cli', installer: installNpmCli, neutralCwd: true },
  { method: 'npx-skill-installer', installer: installNpxSkillInstaller, neutralCwd: true },
  { method: 'git-clone-with-setup', installer: installGitCloneWithSetup, neutralCwd: false },
])('$method detected presence must pass manifest verify', ({ method, installer, neutralCwd }) => {
  function context(): InstallContext {
    const c = ctx()
    if (method === 'npx-skill-installer') {
      c.manifest.spec.install = {
        method,
        cmd: 'npx --yes skills@1.5.7 add owner/ctx7 --copy --global',
        npm_version: '1.5.7',
        idempotent_check: 'test -f ~/.claude/skills/ctx7/SKILL.md',
      }
    } else if (method === 'git-clone-with-setup') {
      c.manifest.spec.install = {
        method,
        cmd: 'git clone https://github.com/example/ctx7.git /tmp/ctx7',
        git_ref: 'abcdef1234567890abcdef1234567890abcdef12',
        idempotent_check: 'test -d /tmp/ctx7',
      }
    }
    return c
  }

  beforeEach(() => {
    vi.clearAllMocks()
    runtimeVerifyMock.mockResolvedValue(null)
    vi.mocked(isAlreadyInstalled).mockResolvedValue(true)
    vi.mocked(spawnCmd).mockResolvedValue({ ok: true, exitCode: 0, stdout: '', stderr: '' })
  })

  it('runs only verify with fresh-install execution options before recording a receipt', async () => {
    const c = context()
    const options = neutralCwd
      ? { posixShell: true, neutralCwd: true, envMode: 'verify' }
      : { posixShell: true, envMode: 'verify' }

    await expect(installer(c)).resolves.toMatchObject({ ok: true, alreadyInstalled: true })
    expect(spawnCmd).toHaveBeenCalledExactlyOnceWith(c, 'ctx7 --version', [], 5000, options)
    expect(writtenState()?.installed.ctx7).toBeDefined()
    expect(vi.mocked(spawnCmd).mock.invocationCallOrder[0]).toBeLessThan(
      writeFileMock.mock.invocationCallOrder[0] as number,
    )
  })

  it('fails verify without a receipt or automatic repair even without L4 consent', async () => {
    const c = context()
    c.opts.system = false
    c.opts.nonInteractive = true
    vi.mocked(spawnCmd).mockResolvedValue({
      ok: true,
      exitCode: 1,
      stdout: '',
      stderr: 'broken installed component',
    })

    const result = await installer(c)

    expect(result).toMatchObject({
      ok: false,
      phase: 'verify',
      error: {
        path: '/spec/verify/cmd',
        keyword: 'verify-failed',
        message: expect.stringContaining('broken installed component'),
        suggest: expect.stringMatching(/repair|reinstall/i),
      },
    })
    expect(spawnCmd).toHaveBeenCalledTimes(1)
    expect(vi.mocked(spawnCmd).mock.calls[0]?.[1]).toBe(c.manifest.spec.verify.cmd)
    expect(writeFileMock).not.toHaveBeenCalled()
    expect(runtimeVerifyMock).not.toHaveBeenCalled()
    if ('error' in result) {
      expect(result.error.suggest).toContain('harnessed setup --update-installed')
      if (method === 'npm-cli') expect(result.error.suggest).toContain('--system')
    }
  })

  it('does not record presence when shell verification passes but the runtime check fails', async () => {
    const c = context()
    const failure: InstallResult = {
      ok: false,
      phase: 'verify',
      error: {
        file: 'ctx7',
        path: '/spec/verify/cmd',
        line: null,
        column: null,
        keyword: 'verify-failed',
        message: 'required skill runtime is missing',
        suggest: 'repair the runtime explicitly',
      },
    }
    runtimeVerifyMock.mockResolvedValue(failure)

    await expect(installer(c)).resolves.toEqual(failure)
    expect(runtimeVerifyMock).toHaveBeenCalledExactlyOnceWith(c)
    expect(spawnCmd).toHaveBeenCalledTimes(1)
    expect(writeFileMock).not.toHaveBeenCalled()
  })

  it('also rejects a fresh install when shell verify passes but the runtime check fails', async () => {
    const c = context()
    vi.mocked(isAlreadyInstalled).mockResolvedValue(false)
    if (method === 'git-clone-with-setup') c.manifest.spec.install.cmd += ' && rm -rf /tmp/ctx7'
    const failure: InstallResult = {
      ok: false,
      phase: 'verify',
      error: {
        file: 'ctx7',
        path: '/spec/verify/cmd',
        line: null,
        column: null,
        keyword: 'verify-failed',
        message: 'required skill runtime is missing',
        suggest: 'repair the runtime explicitly',
      },
    }
    runtimeVerifyMock.mockResolvedValue(failure)

    await expect(installer(c)).resolves.toMatchObject(failure)
    expect(runtimeVerifyMock).toHaveBeenCalledExactlyOnceWith(c)
    expect(spawnCmd).toHaveBeenCalledTimes(2)
    expect(writtenState()).toBeNull()
  })

  it('adds an executable repair hint when a runtime failure has no specific suggestion', async () => {
    const c = context()
    runtimeVerifyMock.mockResolvedValue({
      ok: false,
      phase: 'verify',
      error: {
        file: 'ctx7',
        path: '/spec/verify/cmd',
        line: null,
        column: null,
        keyword: 'skill-runtime-incomplete',
        message: 'required skill runtime is missing',
      },
    })

    const result = await installer(c)

    expect(result).toMatchObject({
      ok: false,
      phase: 'verify',
      error: { suggest: expect.stringContaining('harnessed setup --update-installed') },
    })
    expect(writeFileMock).not.toHaveBeenCalled()
  })

  it('classifies a verify timeout as verify failure without writing a receipt', async () => {
    const c = context()
    vi.mocked(spawnCmd).mockResolvedValue({
      ok: false,
      phase: 'spawn',
      error: {
        file: 'ctx7',
        path: '/spec/install/cmd',
        line: null,
        column: null,
        keyword: 'spawn-timeout',
        message: 'spawn timed out after 5000ms',
      },
    })

    await expect(installer(c)).resolves.toMatchObject({
      ok: false,
      phase: 'verify',
      error: {
        path: '/spec/verify/cmd',
        message: expect.stringContaining('verify failed'),
        suggest: expect.stringMatching(/repair|reinstall/i),
      },
    })
    expect(writeFileMock).not.toHaveBeenCalled()
    expect(spawnCmd).toHaveBeenCalledTimes(1)
  })

  it('does not let presence bypass preflight', async () => {
    const c = context()
    c.manifest.spec.install.idempotent_check = ''

    await expect(installer(c)).resolves.toMatchObject({ ok: false, phase: 'preflight' })
    expect(isAlreadyInstalled).not.toHaveBeenCalled()
    expect(spawnCmd).not.toHaveBeenCalled()
    expect(writeFileMock).not.toHaveBeenCalled()
  })

  it('honors a nonzero expected verify exit code', async () => {
    const c = context()
    c.manifest.spec.verify.expected_exit_code = 7
    vi.mocked(spawnCmd).mockResolvedValue({ ok: true, exitCode: 7, stdout: '', stderr: '' })

    await expect(installer(c)).resolves.toMatchObject({ ok: true, alreadyInstalled: true })
    expect(writtenState()?.installed.ctx7).toBeDefined()
  })

  it('uses the default verify timeout when the manifest does not override it', async () => {
    const c = context()
    delete c.manifest.spec.verify.timeout_ms

    await expect(installer(c)).resolves.toMatchObject({ ok: true, alreadyInstalled: true })
    expect(vi.mocked(spawnCmd).mock.calls[0]?.[3]).toBe(15_000)
  })

  if (method === 'npx-skill-installer') {
    it('presence cannot bypass the required --copy preflight', async () => {
      const c = context()
      c.manifest.spec.install.cmd = 'npx --yes skills@1.5.7 add owner/ctx7'

      await expect(installer(c)).resolves.toMatchObject({
        ok: false,
        phase: 'preflight',
        error: { keyword: 'skills-flags-required' },
      })
      expect(isAlreadyInstalled).not.toHaveBeenCalled()
      expect(spawnCmd).not.toHaveBeenCalled()
      expect(writeFileMock).not.toHaveBeenCalled()
    })
  }

  if (method === 'git-clone-with-setup') {
    it.each([
      'sha-required',
      'git-clone-shape',
    ])('presence cannot bypass %s preflight', async (keyword) => {
      const c = context()
      const install = c.manifest.spec.install
      if (install.method !== 'git-clone-with-setup') throw new Error('invalid fixture')
      if (keyword === 'sha-required') install.git_ref = 'v1.2.3'
      else install.cmd = 'echo no clone destination'

      await expect(installer(c)).resolves.toMatchObject({
        ok: false,
        phase: 'preflight',
        error: { keyword },
      })
      expect(isAlreadyInstalled).not.toHaveBeenCalled()
      expect(spawnCmd).not.toHaveBeenCalled()
      expect(writeFileMock).not.toHaveBeenCalled()
    })
  }
})
