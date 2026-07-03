// Phase 2.1 unit tests for src/installers/npxSkillInstaller.ts.
//
// Covers (ADR 0004 § 4-5 + D2.1-4/5/6):
//   - dispatch-mismatch: non-npx-skill-installer method → ok:false preflight
//   - D2.1-5 @latest allowed (v3.9.9 removed prohibition per user instruction)
//   - D2.1-5 cmd missing --copy → keyword:'skills-flags-required' (--global optional)
//   - D2.1-5 cmd with --copy but no --global → ok:true (PromptScript packs need this)
//   - L2 + --apply: spawnCmd called with the manifest cmd (skills@<ver> + flags)
//   - D2.1-6 npx exit 0 but SKILL.md missing → keyword:'verify-failed'
//     (real-path verify is NOT npx exit code — fs.access is the authority)
//   - install spawn exit=1 → ok:false phase:'spawn' keyword:'install-failed'
//   - happy path: SKILL.md present + manifest verify ok → ok:true / appliedFiles
//
// Mocks: child_process / fs/promises / @clack/prompts / node:os (homedir).

import { EventEmitter } from 'node:events'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:child_process', () => ({ spawn: vi.fn() }))
// fs/promises: mkdir/writeFile/rename for backup; readFile for state;
// access for D2.1-6 SKILL.md real-path verify (controlled per-test).
const accessMock = vi.fn(async (_p: string) => undefined)
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(async () => undefined),
  readFile: vi.fn(async () => {
    const e = new Error('ENOENT') as NodeJS.ErrnoException
    e.code = 'ENOENT'
    throw e
  }),
  writeFile: vi.fn(async () => undefined),
  rename: vi.fn(async () => undefined),
  access: (p: string) => accessMock(p),
}))
vi.mock('@clack/prompts', () => ({
  confirm: vi.fn(async () => true),
  select: vi.fn(async () => 'abort'),
  note: vi.fn(),
  isCancel: vi.fn(() => false),
}))
vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os')
  return { ...actual, homedir: () => '/tmp/fake-home' }
})

import { spawn } from 'node:child_process'
import type { InstallContext, InstallOpts, Manifest } from '../../src/installers/lib/types.js'
import { installNpxSkillInstaller } from '../../src/installers/npxSkillInstaller.js'

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
function scriptedSpawn(script: Array<{ exitCode?: number; stderr?: string }>) {
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

const BASE_OPTS: InstallOpts = {
  apply: true,
  dryRun: false,
  system: false,
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
      name: 'mattpocock-skills',
      display_name: 'mattpocock skills',
      description: 'fixture',
      upstream: {
        source: 'mattpocock/skills',
        homepage: 'https://example.com',
        repository: 'https://github.com/mattpocock/skills.git',
        license: 'MIT',
        notice: 'fixture',
      },
    },
    spec: {
      type: 'cc-skill-pack',
      component_type: 'command',
      install: {
        method: 'npx-skill-installer',
        cmd: 'npx --yes skills@1.5.7 add mattpocock/skills --agent claude-code --copy --global --yes',
        npm_version: '^1.5.7',
        idempotent_check: 'grep -q name ~/.claude/skills/skills/SKILL.md',
      },
      verify: {
        cmd: 'grep -q name ~/.claude/skills/skills/SKILL.md',
        timeout_ms: 5000,
        expected_exit_code: 0,
      },
      uninstall: { cmd: 'rm -rf ~/.claude/skills/skills' },
      upstream_health: {
        stability: 'stable',
        last_check: '2026-05-12',
        last_known_good_version: '1.5.7',
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

describe('installNpxSkillInstaller', () => {
  beforeEach(() => {
    spawnMock.mockReset()
    accessMock.mockReset()
    // Default: SKILL.md exists (happy path); individual tests override.
    accessMock.mockResolvedValue(undefined)
  })

  it('dispatch-mismatch: non-npx-skill-installer method → ok:false preflight', async () => {
    const c = ctx()
    ;(c.manifest.spec.install as { method: string }).method = 'npm-cli'
    const r = await installNpxSkillInstaller(c)
    expect(r).toMatchObject({ ok: false, phase: 'preflight' })
  })

  it('D2.1-5 @latest allowed → proceeds past preflight (v3.9.9)', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(scriptedSpawn([{ exitCode: 0 }, { exitCode: 0 }]))
      const c = ctx({}, (m) => {
        ;(m.spec.install as { cmd: string }).cmd =
          'npx --yes skills@latest add mattpocock/skills --copy --global'
      })
      const r = await installNpxSkillInstaller(c)
      expect(r).toMatchObject({ ok: true })
    } finally {
      s.restore()
    }
  })

  it('D2.1-5 missing --copy → keyword:skills-flags-required (fail-loud)', async () => {
    const s = silence()
    try {
      const c = ctx({}, (m) => {
        ;(m.spec.install as { cmd: string }).cmd = 'npx --yes skills@1.5.7 add mattpocock/skills'
      })
      const r = await installNpxSkillInstaller(c)
      expect(r).toMatchObject({ ok: false, phase: 'preflight' })
      if ('error' in r && r.error) {
        expect(r.error.keyword).toBe('skills-flags-required')
      }
      expect(spawnMock).not.toHaveBeenCalled()
    } finally {
      s.restore()
    }
  })

  it('D2.1-5 --copy without --global → ok:true (PromptScript packs, e.g. design-taste-frontend)', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(scriptedSpawn([{ exitCode: 0 }, { exitCode: 0 }]))
      accessMock.mockResolvedValue(undefined) // SKILL.md exists
      const c = ctx({}, (m) => {
        ;(m.spec.install as { cmd: string }).cmd =
          'npx --yes skills@latest add Leonxlnx/taste-skill --skill design-taste-frontend --copy'
      })
      const r = await installNpxSkillInstaller(c)
      expect(r).toMatchObject({ ok: true })
      expect(spawnMock).toHaveBeenCalled()
    } finally {
      s.restore()
    }
  })

  it('D2.1-6 real-path verify: npx exit 0 but SKILL.md missing → keyword:verify-failed', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(scriptedSpawn([{ exitCode: 0 }])) // install ok
      // v4.13.0 — verify probes indicators + SKILL.md across BOTH harness skills
      // dirs; reject ALL access calls to simulate nothing-on-disk.
      accessMock.mockRejectedValue(new Error('ENOENT')) // SKILL.md missing everywhere
      const r = await installNpxSkillInstaller(ctx())
      expect(r).toMatchObject({ ok: false, phase: 'verify' })
      if ('error' in r && r.error) {
        expect(r.error.keyword).toBe('verify-failed')
        expect(r.error.message).toContain('SKILL.md')
      }
    } finally {
      s.restore()
    }
  })

  it('install spawn exit=1 → ok:false phase:spawn keyword:install-failed', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(scriptedSpawn([{ exitCode: 1, stderr: 'npm err' }]))
      const r = await installNpxSkillInstaller(ctx())
      expect(r).toMatchObject({ ok: false, phase: 'spawn' })
      if ('error' in r && r.error) {
        expect(r.error.keyword).toBe('install-failed')
      }
    } finally {
      s.restore()
    }
  })

  it('v4.16.0 T3 — Windows hard-crash exit (0xC0000409) retried once: crash → success → ok:true', async () => {
    // design-taste-frontend dogfood: `npx skills add` died with exit 3221226505
    // (STATUS_STACK_BUFFER_OVERRUN — node hard crash, typically transient).
    // NTSTATUS exits can only occur on win32 (POSIX exit codes are 0-255), so
    // the retry predicate needs no platform gate.
    const s = silence()
    try {
      spawnMock.mockImplementation(
        scriptedSpawn([
          { exitCode: 3221226505 }, // install — hard crash
          { exitCode: 0 }, // install retry — succeeds
          { exitCode: 0 }, // manifest verify cmd
        ]),
      )
      accessMock.mockResolvedValue(undefined) // SKILL.md exists
      const r = await installNpxSkillInstaller(ctx())
      expect(r).toMatchObject({ ok: true })
      expect(spawnMock).toHaveBeenCalledTimes(3)
    } finally {
      s.restore()
    }
  })

  it('v4.16.0 T3 — double hard-crash → ok:false install-failed (single retry only)', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(
        scriptedSpawn([
          { exitCode: 3221226505 }, // install — hard crash
          { exitCode: 3221226505 }, // retry — crashes again
        ]),
      )
      const r = await installNpxSkillInstaller(ctx())
      expect(r).toMatchObject({ ok: false, phase: 'spawn' })
      if ('error' in r && r.error) {
        expect(r.error.keyword).toBe('install-failed')
        expect(r.error.message).toContain('3221226505')
      }
      expect(spawnMock).toHaveBeenCalledTimes(2)
    } finally {
      s.restore()
    }
  })

  it('happy path: install ok + SKILL.md present + verify ok → ok:true with appliedFiles', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(
        scriptedSpawn([
          { exitCode: 0 }, // install
          { exitCode: 0 }, // manifest verify cmd
        ]),
      )
      accessMock.mockResolvedValueOnce(undefined) // SKILL.md exists
      const r = await installNpxSkillInstaller(ctx())
      expect(r).toMatchObject({ ok: true })
      if ('ok' in r && r.ok === true && !('alreadyInstalled' in r)) {
        expect(r.appliedFiles.some((f) => f.endsWith('SKILL.md'))).toBe(true)
      }
    } finally {
      s.restore()
    }
  })
})

// v4.14.0 T4 — per-platform --agent injection: manifests no longer hardcode
// --agent; the installer appends '--agent <claude-code|codex>' from the active
// PlatformDescriptor. Explicit manifest --agent wins (no double injection).
describe('installNpxSkillInstaller — --agent injection (v4.14.0)', () => {
  const CMD_NO_AGENT = 'npx --yes skills@latest add mattpocock/skills --copy --global -y'
  beforeEach(() => {
    vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '')
    spawnMock.mockReset()
    accessMock.mockReset()
    accessMock.mockResolvedValue(undefined)
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  function spawnedFlat(): string {
    return spawnMock.mock.calls
      .map((c) => `${String(c[0])} ${((c[1] ?? []) as string[]).join(' ')}`)
      .join('\n')
  }

  it('claude platform → appends --agent claude-code', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'claude')
    const s = silence()
    try {
      spawnMock.mockImplementation(scriptedSpawn([{ exitCode: 0 }, { exitCode: 0 }]))
      const c = ctx({}, (m) => {
        ;(m.spec.install as { cmd: string }).cmd = CMD_NO_AGENT
      })
      const r = await installNpxSkillInstaller(c)
      expect(r).toMatchObject({ ok: true })
      expect(spawnedFlat()).toContain('--agent claude-code')
    } finally {
      s.restore()
    }
  })

  it('codex platform → appends --agent codex', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    const s = silence()
    try {
      spawnMock.mockImplementation(scriptedSpawn([{ exitCode: 0 }, { exitCode: 0 }]))
      const c = ctx({}, (m) => {
        ;(m.spec.install as { cmd: string }).cmd = CMD_NO_AGENT
      })
      const r = await installNpxSkillInstaller(c)
      expect(r).toMatchObject({ ok: true })
      expect(spawnedFlat()).toContain('--agent codex')
      expect(spawnedFlat()).not.toContain('--agent claude-code')
    } finally {
      s.restore()
    }
  })

  it('manifest already carries --agent → respected verbatim, no double injection', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'claude')
    const s = silence()
    try {
      spawnMock.mockImplementation(scriptedSpawn([{ exitCode: 0 }, { exitCode: 0 }]))
      const c = ctx({}, (m) => {
        ;(m.spec.install as { cmd: string }).cmd = `${CMD_NO_AGENT} --agent cursor`
      })
      const r = await installNpxSkillInstaller(c)
      expect(r).toMatchObject({ ok: true })
      const flat = spawnedFlat()
      expect(flat).toContain('--agent cursor')
      expect(flat).not.toContain('--agent claude-code')
    } finally {
      s.restore()
    }
  })
})
