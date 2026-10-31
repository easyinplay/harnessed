// Phase 1.2 unit tests for src/installers/npmCli.ts (Pattern J BASE+modifier).
//
// Covers (ADR 0004 § 4-5 + B3 H3):
//   - dispatch-mismatch guard: receives non-npm-cli method → ok:false / phase:'preflight'
//   - L4 + non-interactive without --system → aborted:'level-flag-missing'
//   - L4 + --system → confirm prompts proceed; dry-run short-circuits to aborted
//   - L1 (npx in cmd) → no --system gate (proceeds in non-interactive)
//   - install spawn exit≠0 → ok:false / phase:'spawn' / keyword:'install-failed'
//   - verify spawn exit≠expected → ok:false / phase:'verify' / keyword:'verify-failed'
//   - happy path: install ok + verify ok → { ok:true, backupId, appliedFiles }
//
// Mocks: child_process / fs/promises / @clack/prompts (C6 mitigation).

import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { writeSkillOwnershipReceiptMock } = vi.hoisted(() => ({
  writeSkillOwnershipReceiptMock: vi.fn(async () => undefined),
}))

vi.mock('node:child_process', () => ({ spawn: vi.fn() }))
vi.mock('../../src/installers/lib/binaryProbe.js', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/installers/lib/binaryProbe.js')>()
  return { ...real, binaryOnPath: vi.fn(() => false) }
})
vi.mock('../../src/installers/lib/skillOwnershipReceipt.js', async (importOriginal) => {
  const real =
    await importOriginal<typeof import('../../src/installers/lib/skillOwnershipReceipt.js')>()
  return {
    ...real,
    writeSkillOwnershipReceipt: writeSkillOwnershipReceiptMock,
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

import { spawn } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { binaryOnPath } from '../../src/installers/lib/binaryProbe.js'
import type { InstallContext, InstallOpts, Manifest } from '../../src/installers/lib/types.js'
import { installNpmCli } from '../../src/installers/npmCli.js'
import { validateManifestFile } from '../../src/manifest/validate.js'

const spawnMock = vi.mocked(spawn)

interface FakeChild extends EventEmitter {
  stdout: EventEmitter & { setEncoding: (e: string) => unknown }
  stderr: EventEmitter & { setEncoding: (e: string) => unknown }
  kill: (sig: NodeJS.Signals) => void
}
function makeChild(opts: { exitCode?: number; stderr?: string }): FakeChild {
  const child = new EventEmitter() as FakeChild
  const stdout = new EventEmitter() as FakeChild['stdout']
  stdout.setEncoding = () => stdout
  const stderr = new EventEmitter() as FakeChild['stderr']
  stderr.setEncoding = () => stderr
  child.stdout = stdout
  child.stderr = stderr
  child.kill = vi.fn() as unknown as FakeChild['kill']
  setImmediate(() => {
    if (opts.stderr) stderr.emit('data', opts.stderr)
    child.emit('close', opts.exitCode ?? 0)
  })
  return child
}
function silence(): { restore: () => void } {
  const orig = process.stdout.write.bind(process.stdout)
  // biome-ignore lint/suspicious/noExplicitAny: stdout.write overload polymorphism
  process.stdout.write = (() => true) as any
  return {
    restore: () => {
      process.stdout.write = orig
    },
  }
}

const BASE_OPTS: InstallOpts = {
  apply: true,
  dryRun: false,
  system: true,
  nonInteractive: true,
  fullDiff: false,
  updateInstalled: true,
  color: false,
}
function withOpts(over: Partial<InstallOpts>): InstallOpts {
  return { ...BASE_OPTS, ...over }
}
function baseManifest(): Manifest {
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
        npm_version: '^1.0.0',
        idempotent_check: 'which ctx7',
      },
      verify: { cmd: 'ctx7 --version', timeout_ms: 5000, expected_exit_code: 0 },
      uninstall: { cmd: 'npm uninstall -g ctx7' },
      upstream_health: {
        stability: 'stable',
        last_check: '2026-05-12',
        last_known_good_version: '1.0.0',
        fallback_action: 'warn',
      },
      signed_by: 'easyinplay',
      platforms: ['linux', 'darwin', 'win32'],
    },
  } as Manifest
}
function ctx(over?: Partial<InstallOpts>, modifyManifest?: (m: Manifest) => void): InstallContext {
  const manifest = baseManifest()
  modifyManifest?.(manifest)
  return { manifest, opts: withOpts(over ?? {}), level: 'L4', cwd: '/tmp/proj' }
}

describe('installNpmCli', () => {
  beforeEach(() => {
    spawnMock.mockReset()
    vi.mocked(binaryOnPath).mockReset().mockReturnValue(false)
    vi.mocked(writeFile).mockClear()
    writeSkillOwnershipReceiptMock.mockReset().mockResolvedValue(undefined)
  })

  it.each([
    false,
    true,
  ])('verify strips credentials and startup hooks for updateInstalled=%s while install retains them', async (updateInstalled) => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'fixture-parent-key')
    vi.stubEnv('BASH_ENV', 'fixture-parent-startup')
    vi.stubEnv('NODE_OPTIONS', '--require=fixture-parent-hook')
    try {
      const c = ctx({ updateInstalled, system: updateInstalled, quiet: true })
      c.manifest.spec.install.env = {
        OPENAI_API_KEY: 'fixture-install-key',
        NPM_TOKEN: 'fixture-install-token',
        PYTHONSTARTUP: 'fixture-install-startup',
        PLAYWRIGHT_AUTH_TOKEN: 'fixture-browser-token',
        GSTACK_AUTH_TOKEN: 'fixture-gstack-token',
        CODEX_HOME: '',
        PLAYWRIGHT_BROWSERS_PATH: '/fixture/browsers',
      }
      vi.mocked(binaryOnPath).mockReturnValue(true)
      spawnMock.mockImplementation(
        () => makeChild({ exitCode: 0 }) as unknown as ReturnType<typeof spawn>,
      )

      await expect(installNpmCli(c)).resolves.toMatchObject({ ok: true })
      expect(spawnMock).toHaveBeenCalledTimes(updateInstalled ? 2 : 1)
      const env = spawnMock.mock.calls.at(-1)?.[2]?.env
      for (const key of [
        'ANTHROPIC_API_KEY',
        'OPENAI_API_KEY',
        'NPM_TOKEN',
        'BASH_ENV',
        'NODE_OPTIONS',
        'PYTHONSTARTUP',
        'PLAYWRIGHT_AUTH_TOKEN',
        'GSTACK_AUTH_TOKEN',
      ]) {
        expect(env?.[key], key).toBeUndefined()
      }
      expect(env?.CODEX_HOME).toBe('')
      expect(env?.PLAYWRIGHT_BROWSERS_PATH).toBe('/fixture/browsers')
      if (updateInstalled) {
        const installEnv = spawnMock.mock.calls[0]?.[2]?.env
        expect(installEnv?.ANTHROPIC_API_KEY).toBe('fixture-parent-key')
        expect(installEnv?.OPENAI_API_KEY).toBe('fixture-install-key')
        expect(installEnv?.NODE_OPTIONS).toBe('--require=fixture-parent-hook')
      }
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('a detected CLI with broken verify fails without installing globally or recording a receipt', async () => {
    vi.mocked(binaryOnPath).mockReturnValue(true)
    spawnMock.mockImplementation(
      () =>
        makeChild({ exitCode: 1, stderr: 'runtime missing' }) as unknown as ReturnType<
          typeof spawn
        >,
    )

    const result = await installNpmCli(ctx({ updateInstalled: false, system: false, quiet: true }))

    expect(result).toMatchObject({
      ok: false,
      phase: 'verify',
      error: { keyword: 'verify-failed' },
    })
    expect(spawnMock).toHaveBeenCalledTimes(1)
    expect(spawnMock.mock.calls[0]?.[1]?.join(' ')).toContain('ctx7 --version')
    expect(spawnMock.mock.calls[0]?.[1]?.join(' ')).not.toContain('npm install')
    expect(writeFile).not.toHaveBeenCalled()
  })

  it('no-update verifies a detected CLI and records it without an L4 install', async () => {
    vi.mocked(binaryOnPath).mockReturnValue(true)
    spawnMock.mockImplementation(
      () => makeChild({ exitCode: 0 }) as unknown as ReturnType<typeof spawn>,
    )

    await expect(
      installNpmCli(ctx({ updateInstalled: false, system: false, quiet: true })),
    ).resolves.toMatchObject({ ok: true, alreadyInstalled: true })
    expect(spawnMock).toHaveBeenCalledTimes(1)
    expect(spawnMock.mock.calls[0]?.[1]?.join(' ')).toContain('ctx7 --version')
    expect(writeFile).toHaveBeenCalledTimes(1)
  })

  it.each([
    0, 1,
  ])('the real Playwright manifest verifies detected PATH presence without reinstalling (exit %i)', async (exitCode) => {
    const fs = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises')
    const path = 'manifests/tools/playwright-cli.yaml'
    const loaded = validateManifestFile(await fs.readFile(path, 'utf8'), path)
    if (!loaded.ok) throw new Error(JSON.stringify(loaded.errors))
    const c = ctx({ updateInstalled: false, system: false, quiet: true })
    c.manifest = loaded.manifest
    const install = c.manifest.spec.install
    if (install.method !== 'npm-cli') throw new Error('expected the real npm-cli manifest')
    const verify = c.manifest.spec.verify.cmd
    expect(verify).toContain('if (run(["--version"]).trim() !== "0.1.22")')
    expect(verify).toContain('run(["install-browser", "chromium", "--dry-run"])')
    expect(verify).toContain('run(["install-browser", "chromium", "--list"])')
    expect(verify).toContain('NO_UPDATE_NOTIFIER: "1"')
    expect(verify).not.toContain(' open ')
    expect(verify).not.toContain('run-code')
    expect(verify).not.toMatch(/\b(?:session|daemon)\b/)
    vi.mocked(binaryOnPath).mockImplementation((bin) => bin === 'playwright-cli')
    spawnMock.mockImplementation(
      () => makeChild({ exitCode }) as unknown as ReturnType<typeof spawn>,
    )

    const result = await installNpmCli(c)

    expect(binaryOnPath).toHaveBeenCalledExactlyOnceWith('playwright-cli')
    expect(spawnMock).toHaveBeenCalledTimes(1)
    expect(spawnMock.mock.calls[0]?.[1]?.at(-1)).toBe(c.manifest.spec.verify.cmd)
    expect(spawnMock.mock.calls[0]?.[1]?.join(' ')).not.toContain('npm install')
    if (exitCode === 0) {
      expect(result).toMatchObject({ ok: true, alreadyInstalled: true })
      expect(writeFile).toHaveBeenCalledTimes(1)
      const state = JSON.parse(String(vi.mocked(writeFile).mock.calls[0]?.[1]))
      expect(state.installed['playwright-cli'].version).toBe(install.npm_version)
    } else {
      expect(result).toMatchObject({
        ok: false,
        phase: 'verify',
        error: { keyword: 'verify-failed' },
      })
      expect(writeFile).not.toHaveBeenCalled()
    }
  })

  it('dry-run does not verify or record a CLI even when its binary is present', async () => {
    vi.mocked(binaryOnPath).mockReturnValue(true)

    await expect(
      installNpmCli(ctx({ updateInstalled: false, apply: false, dryRun: true, quiet: true })),
    ).resolves.toMatchObject({ aborted: true })
    expect(binaryOnPath).not.toHaveBeenCalled()
    expect(spawnMock).not.toHaveBeenCalled()
    expect(writeFile).not.toHaveBeenCalled()
  })

  it('force-update of a detected CLI still requires --system before any global install', async () => {
    vi.mocked(binaryOnPath).mockReturnValue(true)

    await expect(
      installNpmCli(ctx({ updateInstalled: true, system: false, quiet: true })),
    ).resolves.toMatchObject({ aborted: true, reason: 'level-flag-missing' })
    expect(binaryOnPath).not.toHaveBeenCalled()
    expect(spawnMock).not.toHaveBeenCalled()
    expect(writeFile).not.toHaveBeenCalled()
  })

  it('dispatch-mismatch: non-npm-cli method short-circuits to preflight failure', async () => {
    const c = ctx()
    // Forge wrong method (simulates a routing bug upstream).
    ;(c.manifest.spec.install as { method: string }).method = 'mcp-stdio-add'
    const r = await installNpmCli(c)
    expect(r).toMatchObject({ ok: false, phase: 'preflight' })
  })

  it('L4 non-interactive without --system → aborted:level-flag-missing', async () => {
    const s = silence()
    try {
      const r = await installNpmCli(ctx({ system: false }))
      expect(r).toMatchObject({ aborted: true, reason: 'level-flag-missing' })
      expect(spawnMock).not.toHaveBeenCalled()
    } finally {
      s.restore()
    }
  })

  it('L4 + --system + dry-run → aborted (dry-run sentinel, never spawned)', async () => {
    const s = silence()
    try {
      const r = await installNpmCli(ctx({ apply: false, dryRun: true, system: true }))
      expect(r).toMatchObject({ aborted: true })
      expect(spawnMock).not.toHaveBeenCalled()
    } finally {
      s.restore()
    }
  })

  it('install spawn exit=1 → ok:false phase:spawn keyword:install-failed', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(
        () => makeChild({ exitCode: 1, stderr: 'boom' }) as unknown as ReturnType<typeof spawn>,
      )
      const r = await installNpmCli(ctx())
      expect(r).toMatchObject({ ok: false, phase: 'spawn' })
      if ('error' in r && r.error) {
        expect(r.error.keyword).toBe('install-failed')
      }
    } finally {
      s.restore()
    }
  })

  it('happy path: install ok + verify ok → ok:true with backupId + appliedFiles', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(
        () => makeChild({ exitCode: 0 }) as unknown as ReturnType<typeof spawn>,
      )
      const r = await installNpmCli(ctx())
      expect(r).toMatchObject({ ok: true })
      if ('ok' in r && r.ok === true && !('alreadyInstalled' in r)) {
        expect(typeof r.backupId).toBe('string')
        expect(Array.isArray(r.appliedFiles)).toBe(true)
      }
    } finally {
      s.restore()
    }
  })

  it('does not write a receipt for a non-ownership-managed npm CLI', async () => {
    spawnMock.mockImplementation(
      () => makeChild({ exitCode: 0 }) as unknown as ReturnType<typeof spawn>,
    )

    await expect(installNpmCli(ctx({ quiet: true }))).resolves.toMatchObject({ ok: true })

    expect.soft(writeSkillOwnershipReceiptMock).not.toHaveBeenCalled()
  })

  // v4.20.1 — install spawn must run from the NEUTRAL cwd, not the user's shell
  // cwd (dogfood: a bun-generated devEngines package.json in the user's home made
  // every npx-based install die with EBADDEVENGINES — npm exec walks cwd upward).
  // Global test setup pins HARNESSED_SPAWN_CWD, so the neutral value is exact.
  it('install spawn uses neutral cwd (EBADDEVENGINES ambient immunity)', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(
        () => makeChild({ exitCode: 0 }) as unknown as ReturnType<typeof spawn>,
      )
      await installNpmCli(ctx())
      const firstSpawnOpts = spawnMock.mock.calls[0]?.[2] as { cwd?: string }
      expect(firstSpawnOpts.cwd).toBe(process.env.HARNESSED_SPAWN_CWD)
    } finally {
      s.restore()
    }
  })
})

// v4.15.1 T3 — the "(L4 system install — global PATH change; see cmd above)"
// line leaked into setup's quiet Step B progress stream (no cmd echo above it
// in quiet mode — user dogfood confusion). Now gated by !ctx.opts.quiet.
describe('installNpmCli v4.15.1 quiet gating', () => {
  beforeEach(() => {
    spawnMock.mockReset()
  })

  function captureStdout(): { writes: string[]; restore: () => void } {
    const writes: string[] = []
    const orig = process.stdout.write.bind(process.stdout)
    const writer = (chunk: unknown): boolean => {
      writes.push(String(chunk))
      return true
    }
    // biome-ignore lint/suspicious/noExplicitAny: stdout.write overload polymorphism
    process.stdout.write = writer as any
    return {
      writes,
      restore: () => {
        process.stdout.write = orig
      },
    }
  }

  it('quiet: true → L4 hint line NOT written', async () => {
    spawnMock.mockImplementation(
      () => makeChild({ exitCode: 0 }) as unknown as ReturnType<typeof spawn>,
    )
    const cap = captureStdout()
    try {
      await installNpmCli(ctx({ quiet: true }))
    } finally {
      cap.restore()
    }
    expect(cap.writes.join('')).not.toContain('L4 system install')
  })

  it('quiet: false → L4 hint line IS written (pre-4.15.1 behavior preserved)', async () => {
    spawnMock.mockImplementation(
      () => makeChild({ exitCode: 0 }) as unknown as ReturnType<typeof spawn>,
    )
    const cap = captureStdout()
    try {
      await installNpmCli(ctx({ quiet: false }))
    } finally {
      cap.restore()
    }
    expect(cap.writes.join('')).toContain('L4 system install')
  })
})
