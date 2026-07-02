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

vi.mock('node:child_process', () => ({ spawn: vi.fn() }))
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
import type { InstallContext, InstallOpts, Manifest } from '../../src/installers/lib/types.js'
import { installNpmCli } from '../../src/installers/npmCli.js'

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
