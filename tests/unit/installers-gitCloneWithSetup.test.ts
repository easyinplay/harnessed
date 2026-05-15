// Phase 2.1 unit tests for src/installers/gitCloneWithSetup.ts.
//
// Covers (ADR 0004 § 4-5 + D-15 + ADR 0007 install_type=git):
//   - dispatch-mismatch: receives non-git-clone-with-setup method → preflight err
//   - SemVer git_ref (e.g. v1.2.3) rejected by installer-layer SHA-only invariant
//     → ok:false / keyword:'sha-required' (schema allows SemVer; this installer doesn't)
//   - cmd missing `git clone <url> <dest>` → ok:false / keyword:'git-clone-shape'
//   - L2 + --apply: spawnCmd called with install.cmd; verify spawnCmd called too
//   - D-15 SHA-mismatch: rev-parse HEAD differs from git_ref → keyword:'sha-mismatch'
//   - install spawn exit=1 → ok:false phase:'spawn' keyword:'install-failed'
//   - happy path: install ok + rev-parse match + verify ok → ok:true / appliedFiles
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
import { installGitCloneWithSetup } from '../../src/installers/gitCloneWithSetup.js'
import type { InstallContext, InstallOpts, Manifest } from '../../src/installers/lib/types.js'

const spawnMock = vi.mocked(spawn)

interface FakeChild extends EventEmitter {
  stdout: EventEmitter & { setEncoding: (e: string) => unknown }
  stderr: EventEmitter & { setEncoding: (e: string) => unknown }
  kill: (sig: NodeJS.Signals) => void
}
// Returns a child that emits both stdout (for rev-parse) and exit code.
function makeChild(opts: { exitCode?: number; stderr?: string; stdout?: string }): FakeChild {
  const child = new EventEmitter() as FakeChild
  const stdout = new EventEmitter() as FakeChild['stdout']
  stdout.setEncoding = () => stdout
  const stderr = new EventEmitter() as FakeChild['stderr']
  stderr.setEncoding = () => stderr
  child.stdout = stdout
  child.stderr = stderr
  child.kill = vi.fn() as unknown as FakeChild['kill']
  setImmediate(() => {
    if (opts.stdout) stdout.emit('data', opts.stdout)
    if (opts.stderr) stderr.emit('data', opts.stderr)
    child.emit('close', opts.exitCode ?? 0)
  })
  return child
}

// Sequential spawn mock: returns the next child per spawn() call. Caller
// supplies the script of (exitCode, stdout) pairs corresponding to:
//   1) install cmd (single spawnCmd)
//   2) rev-parse HEAD (D-15)
//   3) verify cmd (single spawnCmd)
function scriptedSpawn(script: Array<{ exitCode?: number; stdout?: string; stderr?: string }>) {
  let i = 0
  return () => {
    const step = script[Math.min(i, script.length - 1)] ?? { exitCode: 0 }
    i += 1
    return makeChild(step) as unknown as ReturnType<typeof spawn>
  }
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

const PINNED_SHA = 'e89d70e4bcd0ae04709a773db549cf61fcf813ac'

const BASE_OPTS: InstallOpts = {
  apply: true,
  dryRun: false,
  system: false,
  nonInteractive: true,
  fullDiff: false,
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
      name: 'ui-ux-pro-max',
      display_name: 'ui-ux-pro-max',
      description: 'fixture',
      upstream: {
        source: 'midwayjs/midway',
        homepage: 'https://example.com',
        repository: 'https://github.com/midwayjs/midway.git',
        license: 'MIT',
        notice: 'fixture',
      },
    },
    spec: {
      type: 'cc-skill-pack',
      component_type: 'command',
      install: {
        method: 'git-clone-with-setup',
        cmd: 'git clone https://github.com/midwayjs/midway.git /tmp/fixture-clone',
        git_ref: PINNED_SHA,
        idempotent_check: 'test -f /tmp/fixture-clone/SKILL.md',
      },
      verify: {
        cmd: 'test -f /tmp/fixture-clone/SKILL.md',
        timeout_ms: 5000,
        expected_exit_code: 0,
      },
      uninstall: { cmd: 'rm -rf /tmp/fixture-clone' },
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
function ctx(over?: Partial<InstallOpts>, modify?: (m: Manifest) => void): InstallContext {
  const manifest = baseManifest()
  modify?.(manifest)
  return { manifest, opts: withOpts(over ?? {}), level: 'L2', cwd: '/tmp/proj' }
}

describe('installGitCloneWithSetup', () => {
  beforeEach(() => {
    spawnMock.mockReset()
  })

  it('dispatch-mismatch: non-git-clone-with-setup method → ok:false preflight', async () => {
    const c = ctx()
    ;(c.manifest.spec.install as { method: string }).method = 'npm-cli'
    const r = await installGitCloneWithSetup(c)
    expect(r).toMatchObject({ ok: false, phase: 'preflight' })
  })

  it('SemVer git_ref rejected: installer enforces SHA-only invariant → keyword:sha-required', async () => {
    const s = silence()
    try {
      const c = ctx({}, (m) => {
        ;(m.spec.install as { git_ref: string }).git_ref = 'v1.2.3'
      })
      const r = await installGitCloneWithSetup(c)
      expect(r).toMatchObject({ ok: false, phase: 'preflight' })
      if ('error' in r && r.error) {
        expect(r.error.keyword).toBe('sha-required')
      }
      expect(spawnMock).not.toHaveBeenCalled()
    } finally {
      s.restore()
    }
  })

  it('cmd missing `git clone <url> <dest>` → keyword:git-clone-shape', async () => {
    const s = silence()
    try {
      const c = ctx({}, (m) => {
        ;(m.spec.install as { cmd: string }).cmd = 'echo no clone here'
      })
      const r = await installGitCloneWithSetup(c)
      expect(r).toMatchObject({ ok: false, phase: 'preflight' })
      if ('error' in r && r.error) {
        expect(r.error.keyword).toBe('git-clone-shape')
      }
      expect(spawnMock).not.toHaveBeenCalled()
    } finally {
      s.restore()
    }
  })

  it('D-15 SHA-mismatch: rev-parse returns different SHA → keyword:sha-mismatch', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(
        scriptedSpawn([
          { exitCode: 0 }, // install cmd
          { exitCode: 0, stdout: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef\n' }, // rev-parse mismatch
        ]),
      )
      const r = await installGitCloneWithSetup(ctx())
      expect(r).toMatchObject({ ok: false, phase: 'verify' })
      if ('error' in r && r.error) {
        expect(r.error.keyword).toBe('sha-mismatch')
      }
    } finally {
      s.restore()
    }
  })

  it('install spawn exit=1 → ok:false phase:spawn keyword:install-failed', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(scriptedSpawn([{ exitCode: 1, stderr: 'git auth failed' }]))
      const r = await installGitCloneWithSetup(ctx())
      expect(r).toMatchObject({ ok: false, phase: 'spawn' })
      if ('error' in r && r.error) {
        expect(r.error.keyword).toBe('install-failed')
      }
    } finally {
      s.restore()
    }
  })

  it('happy path: install ok + rev-parse match + verify ok → ok:true with appliedFiles', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(
        scriptedSpawn([
          { exitCode: 0 }, // install
          { exitCode: 0, stdout: `${PINNED_SHA}\n` }, // rev-parse match
          { exitCode: 0 }, // verify
        ]),
      )
      const r = await installGitCloneWithSetup(ctx())
      expect(r).toMatchObject({ ok: true })
      if ('ok' in r && r.ok === true) {
        expect(typeof r.backupId).toBe('string')
        expect(Array.isArray(r.appliedFiles)).toBe(true)
        expect(r.appliedFiles[0]).toContain('fixture-clone')
      }
    } finally {
      s.restore()
    }
  })
})
