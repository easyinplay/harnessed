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
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { writeSkillOwnershipReceiptMock } = vi.hoisted(() => ({
  writeSkillOwnershipReceiptMock: vi.fn(async () => undefined),
}))

vi.mock('node:child_process', () => ({ spawn: vi.fn() }))
vi.mock('../../src/installers/lib/skillOwnershipReceipt.js', async (importOriginal) => {
  const real =
    await importOriginal<typeof import('../../src/installers/lib/skillOwnershipReceipt.js')>()
  return {
    ...real,
    writeSkillOwnershipReceipt: writeSkillOwnershipReceiptMock,
  }
})
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
  lstat: vi.fn(),
  stat: vi.fn(),
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
import { lstat, readFile, stat, writeFile } from 'node:fs/promises'
import type { InstallContext, InstallOpts, Manifest } from '../../src/installers/lib/types.js'
import { installNpxSkillInstaller } from '../../src/installers/npxSkillInstaller.js'
import { createHostInstallContext } from '../../src/platform/hostInstallContext.js'
import { claudeDescriptor, codexDescriptor } from '../../src/platform/platform.js'

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
function setInstalledSkills(manifest: Manifest, skills: string[]): void {
  const install = manifest.spec.install
  if (install.method !== 'npx-skill-installer') {
    throw new Error(`expected npx-skill-installer, got ${install.method}`)
  }
  install.installs_skills = skills
}
function ctx(over?: Partial<InstallOpts>, modify?: (m: Manifest) => void): InstallContext {
  const manifest = baseManifest()
  modify?.(manifest)
  return { manifest, opts: withOpts(over ?? {}), level: 'L2', cwd: '/tmp/proj' }
}

describe('installNpxSkillInstaller', () => {
  beforeEach(() => {
    spawnMock.mockReset()
    vi.mocked(writeFile).mockClear()
    vi.mocked(readFile)
      .mockReset()
      .mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    vi.mocked(stat)
      .mockReset()
      .mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    accessMock.mockReset()
    // Default: SKILL.md exists (happy path); individual tests override.
    accessMock.mockResolvedValue(undefined)
    writeSkillOwnershipReceiptMock.mockReset().mockResolvedValue(undefined)
  })

  it('an existing skill must pass verify without automatically invoking npx to repair it', async () => {
    vi.mocked(stat).mockResolvedValue({ isFile: () => true } as Awaited<ReturnType<typeof stat>>)
    vi.mocked(readFile).mockResolvedValue('# skill')
    spawnMock.mockImplementation(scriptedSpawn([{ exitCode: 1, stderr: 'runtime missing' }]))

    const result = await installNpxSkillInstaller(ctx({ updateInstalled: false, quiet: true }))

    expect(result).toMatchObject({
      ok: false,
      phase: 'verify',
      error: { keyword: 'verify-failed' },
    })
    expect(spawnMock).toHaveBeenCalledTimes(1)
    expect(spawnMock.mock.calls[0]?.[1]?.join(' ')).toContain('grep -q name')
    expect(spawnMock.mock.calls[0]?.[1]?.join(' ')).not.toContain('skills@1.5.7 add')
    expect(writeFile).not.toHaveBeenCalled()
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

  // v4.20.1 — npx install spawn must use the NEUTRAL cwd (EBADDEVENGINES ambient
  // package.json immunity; sister installers-npmCli cell). Setup pins
  // HARNESSED_SPAWN_CWD globally so the neutral value is exact.
  it('install spawn uses neutral cwd (EBADDEVENGINES ambient immunity)', async () => {
    const s = silence()
    try {
      spawnMock.mockImplementation(scriptedSpawn([{ exitCode: 0 }, { exitCode: 0 }]))
      accessMock.mockResolvedValueOnce(undefined)
      await installNpxSkillInstaller(ctx())
      const firstSpawnOpts = spawnMock.mock.calls[0]?.[2] as { cwd?: string }
      expect(firstSpawnOpts.cwd).toBe(process.env.HARNESSED_SPAWN_CWD)
    } finally {
      s.restore()
    }
  })
})

describe('installNpxSkillInstaller — active target materialization', () => {
  const userHome = '/tmp/fake-home'
  const sharedSkill = join(userHome, '.agents', 'skills', 'webapp-testing')

  function webappContext(nativeHome = join(userHome, '.claude')): InstallContext {
    const context = ctx({ updateInstalled: false, quiet: true }, (manifest) => {
      manifest.metadata.name = 'webapp-testing'
      manifest.spec.install.cmd =
        'npx --yes skills@latest add anthropics/skills --skill webapp-testing --copy --global -y'
      setInstalledSkills(manifest, ['webapp-testing'])
    })
    context.hostContext = createHostInstallContext(claudeDescriptor(userHome), {
      os: process.platform,
      userHome,
      nativeHome,
    })
    return context
  }

  function codexContext(nativeHome = join(userHome, '.codex')): InstallContext {
    const context = webappContext()
    context.hostContext = createHostInstallContext(codexDescriptor(userHome), {
      os: process.platform,
      userHome,
      nativeHome,
    })
    return context
  }

  function missing(): NodeJS.ErrnoException {
    return Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
  }

  beforeEach(() => {
    spawnMock.mockReset()
    vi.mocked(writeFile).mockClear()
    vi.mocked(lstat).mockReset()
    vi.mocked(lstat).mockImplementation(async (path) => {
      if (String(path) === sharedSkill) return {} as Awaited<ReturnType<typeof lstat>>
      throw missing()
    })
    accessMock.mockReset()
  })

  it.each([
    '.claude',
    'custom claude home',
  ])('materializes a shared-only skill into the active %s root', async (directory) => {
    const nativeHome = join(userHome, directory)
    const activeSkill = join(nativeHome, 'skills', 'webapp-testing', 'SKILL.md')
    let materialized = false
    accessMock.mockImplementation(async (path) => {
      if (path === join(sharedSkill, 'SKILL.md') || (path === activeSkill && materialized)) return
      throw missing()
    })
    spawnMock.mockImplementation((_command, args) => {
      if (args?.join(' ').includes('skills@latest add')) materialized = true
      return makeChild({ exitCode: 0 }) as unknown as ReturnType<typeof spawn>
    })

    const result = await installNpxSkillInstaller(webappContext(nativeHome))

    expect(result).toMatchObject({ ok: true, appliedFiles: [activeSkill] })
    expect(materialized).toBe(true)
    expect(spawnMock.mock.calls[0]?.[1]?.join(' ')).toContain('--agent claude-code')
    expect(
      vi.mocked(writeFile).mock.calls.some(([path]) => String(path).startsWith(sharedSkill)),
    ).toBe(false)
  })

  it('keeps an existing active target idempotent during a normal install', async () => {
    vi.mocked(lstat).mockResolvedValue({} as Awaited<ReturnType<typeof lstat>>)
    accessMock.mockResolvedValue(undefined)
    spawnMock.mockImplementation(scriptedSpawn([{ exitCode: 0 }]))

    const context = webappContext()
    const result = await installNpxSkillInstaller(context)

    expect(result).toMatchObject({ ok: true, alreadyInstalled: true })
    expect(spawnMock).toHaveBeenCalledTimes(1)
    expect(spawnMock.mock.calls[0]?.[1]?.join(' ')).not.toContain('skills@latest add')
  })

  it('keeps dryRun on the preview path without verify or state receipt writes', async () => {
    vi.mocked(lstat).mockResolvedValue({} as Awaited<ReturnType<typeof lstat>>)
    accessMock.mockResolvedValue(undefined)
    const context = webappContext()
    context.opts.dryRun = true

    const result = await installNpxSkillInstaller(context)

    expect(result).toEqual({ aborted: true, reason: 'user-cancel' })
    expect(spawnMock).not.toHaveBeenCalled()
    expect(writeFile).not.toHaveBeenCalled()
  })

  it('rejects an unbounded host install without declared targets or ownership', async () => {
    const context = webappContext()
    const install = context.manifest.spec.install
    if (install.method !== 'npx-skill-installer') {
      throw new Error(`expected npx-skill-installer, got ${install.method}`)
    }
    install.cmd = 'npx --yes skills@latest add anthropics/skills --copy --global -y'
    delete install.installs_skills

    const result = await installNpxSkillInstaller(context)

    expect(result).toMatchObject({
      ok: false,
      phase: 'preflight',
      error: { keyword: 'update-unsupported' },
    })
    expect(spawnMock).not.toHaveBeenCalled()
    expect(writeFile).not.toHaveBeenCalled()
  })

  it('rejects an active target directory that exists without SKILL.md', async () => {
    const activeSkillDir = join(userHome, '.claude', 'skills', 'webapp-testing')
    vi.mocked(lstat).mockImplementation(async (path) => {
      if (String(path) === activeSkillDir || String(path) === sharedSkill)
        return {} as Awaited<ReturnType<typeof lstat>>
      throw missing()
    })
    accessMock.mockImplementation(async (path) => {
      if (path === join(sharedSkill, 'SKILL.md')) return
      throw missing()
    })

    const result = await installNpxSkillInstaller(webappContext())

    expect(result).toMatchObject({
      ok: false,
      phase: 'preflight',
      error: { keyword: 'update-unsupported' },
    })
    expect(spawnMock).not.toHaveBeenCalled()
    expect(writeFile).not.toHaveBeenCalled()
  })

  it.each([
    'shared',
    'legacy',
  ] as const)('recognizes an existing Codex active target in the %s root', async (rootKind) => {
    const nativeHome = join(userHome, 'custom codex home')
    const activeRoot =
      rootKind === 'shared' ? join(userHome, '.agents', 'skills') : join(nativeHome, 'skills')
    const activeSkillDir = join(activeRoot, 'webapp-testing')
    vi.mocked(lstat).mockImplementation(async (path) => {
      if (String(path) === activeSkillDir) return {} as Awaited<ReturnType<typeof lstat>>
      throw missing()
    })
    accessMock.mockImplementation(async (path) => {
      if (path === join(activeSkillDir, 'SKILL.md')) return
      throw missing()
    })
    spawnMock.mockImplementation(scriptedSpawn([{ exitCode: 0 }]))

    const result = await installNpxSkillInstaller(codexContext(nativeHome))

    expect(result).toMatchObject({ ok: true, alreadyInstalled: true })
    expect(spawnMock).toHaveBeenCalledTimes(1)
    expect(spawnMock.mock.calls[0]?.[1]?.join(' ')).not.toContain('skills@latest add')
  })

  it.each([
    'shared',
    'legacy',
  ] as const)('accepts Codex postinstall materialization in the %s root', async (rootKind) => {
    const nativeHome = join(userHome, 'custom codex home')
    const activeRoot =
      rootKind === 'shared' ? join(userHome, '.agents', 'skills') : join(nativeHome, 'skills')
    const activeSkill = join(activeRoot, 'webapp-testing', 'SKILL.md')
    let materialized = false
    vi.mocked(lstat).mockRejectedValue(missing())
    accessMock.mockImplementation(async (path) => {
      if (materialized && path === activeSkill) return
      throw missing()
    })
    spawnMock.mockImplementation((_command, args) => {
      if (args?.join(' ').includes('skills@latest add')) materialized = true
      return makeChild({ exitCode: 0 }) as unknown as ReturnType<typeof spawn>
    })

    const result = await installNpxSkillInstaller(codexContext(nativeHome))

    expect(result).toMatchObject({ ok: true })
    expect(result).not.toHaveProperty('alreadyInstalled')
    expect(materialized).toBe(true)
    expect(spawnMock).toHaveBeenCalledTimes(2)
  })

  it.each([
    'tdd',
    'diagnosing-bugs',
  ])('verifies a multi-skill pack when indicator %s is materialized in the active root', async (skillName) => {
    const context = webappContext()
    context.manifest = baseManifest()
    setInstalledSkills(context.manifest, ['research', 'tdd', 'diagnosing-bugs'])
    const activeSkill = join(userHome, '.claude', 'skills', skillName, 'SKILL.md')
    let materialized = false
    accessMock.mockImplementation(async (path) => {
      if (materialized && path === activeSkill) return
      throw missing()
    })
    spawnMock.mockImplementation((_command, args) => {
      if (args?.join(' ').includes('skills@1.5.7 add')) materialized = true
      return makeChild({ exitCode: 0 }) as unknown as ReturnType<typeof spawn>
    })

    const result = await installNpxSkillInstaller(context)

    expect(result).toMatchObject({ ok: true })
    expect(result).not.toHaveProperty('alreadyInstalled')
    expect(materialized).toBe(true)
    expect(spawnMock).toHaveBeenCalledTimes(2)
  })

  it.each([
    'tdd',
    'diagnosing-bugs',
  ])('recognizes pack indicator %s without requiring the repo segment', async (skillName) => {
    const context = webappContext()
    context.manifest = baseManifest()
    setInstalledSkills(context.manifest, ['research', 'tdd', 'diagnosing-bugs'])
    accessMock.mockImplementation(async (path) => {
      if (path === join(userHome, '.claude', 'skills', skillName, 'SKILL.md')) return
      throw missing()
    })
    vi.mocked(lstat).mockImplementation(async (path) => {
      if (String(path) === join(userHome, '.claude', 'skills', skillName))
        return {} as Awaited<ReturnType<typeof lstat>>
      throw missing()
    })
    spawnMock.mockImplementation(scriptedSpawn([{ exitCode: 0 }]))

    const result = await installNpxSkillInstaller(context)

    expect(result).toMatchObject({ ok: true, alreadyInstalled: true })
    expect(spawnMock).toHaveBeenCalledTimes(1)
    expect(spawnMock.mock.calls[0]?.[1]?.join(' ')).not.toContain('skills@1.5.7 add')
  })

  it('materializes when only colliding research is active and shared tdd exists', async () => {
    const context = webappContext()
    context.manifest = baseManifest()
    setInstalledSkills(context.manifest, ['research', 'tdd', 'diagnosing-bugs'])
    const activeRoot = join(userHome, '.claude', 'skills')
    const sharedRoot = join(userHome, '.agents', 'skills')
    let materialized = false
    vi.mocked(lstat).mockImplementation(async (path) => {
      if (String(path) === join(activeRoot, 'research') || String(path) === join(sharedRoot, 'tdd'))
        return {} as Awaited<ReturnType<typeof lstat>>
      throw missing()
    })
    accessMock.mockImplementation(async (path) => {
      if (
        path === join(activeRoot, 'research', 'SKILL.md') ||
        path === join(sharedRoot, 'tdd', 'SKILL.md') ||
        (materialized && path === join(activeRoot, 'tdd', 'SKILL.md'))
      )
        return
      throw missing()
    })
    spawnMock.mockImplementation((_command, args) => {
      if (args?.join(' ').includes('skills@1.5.7 add')) materialized = true
      return makeChild({ exitCode: 0 }) as unknown as ReturnType<typeof spawn>
    })

    const result = await installNpxSkillInstaller(context)

    expect(result).toMatchObject({ ok: true })
    expect(result).not.toHaveProperty('alreadyInstalled')
    expect(materialized).toBe(true)
    expect(spawnMock).toHaveBeenCalledTimes(2)
  })

  it('materializes the explicit selected skill even when another declared active target exists', async () => {
    const context = webappContext()
    setInstalledSkills(context.manifest, ['other-skill', 'webapp-testing'])
    const activeRoot = join(userHome, '.claude', 'skills')
    vi.mocked(lstat).mockImplementation(async (path) => {
      if (String(path) === join(activeRoot, 'other-skill'))
        return {} as Awaited<ReturnType<typeof lstat>>
      throw missing()
    })
    let materialized = false
    accessMock.mockImplementation(async (path) => {
      if (
        path === join(activeRoot, 'other-skill', 'SKILL.md') ||
        (materialized && path === join(activeRoot, 'webapp-testing', 'SKILL.md'))
      )
        return
      throw missing()
    })
    spawnMock.mockImplementation((_command, args) => {
      if (args?.join(' ').includes('skills@latest add')) materialized = true
      return makeChild({ exitCode: 0 }) as unknown as ReturnType<typeof spawn>
    })

    const result = await installNpxSkillInstaller(context)

    expect(result).toMatchObject({ ok: true })
    expect(result).not.toHaveProperty('alreadyInstalled')
    expect(materialized).toBe(true)
  })

  it('does not verify the selected skill using another declared active SKILL.md', async () => {
    const context = webappContext()
    setInstalledSkills(context.manifest, ['other-skill', 'webapp-testing'])
    accessMock.mockImplementation(async (path) => {
      if (path === join(userHome, '.claude', 'skills', 'other-skill', 'SKILL.md')) return
      throw missing()
    })
    spawnMock.mockImplementation(scriptedSpawn([{ exitCode: 0 }]))

    const result = await installNpxSkillInstaller(context)

    expect(result).toMatchObject({
      ok: false,
      phase: 'verify',
      error: { keyword: 'verify-failed' },
    })
    expect(spawnMock).toHaveBeenCalledTimes(1)
  })

  it.each([
    'shared',
    'active',
  ])('rejects updateInstalled with an existing %s target', async (target) => {
    if (target === 'active')
      vi.mocked(lstat).mockResolvedValue({} as Awaited<ReturnType<typeof lstat>>)
    const context = webappContext()
    context.opts.updateInstalled = true

    const result = await installNpxSkillInstaller(context)

    expect(result).toMatchObject({
      ok: false,
      phase: 'preflight',
      error: { keyword: 'update-unsupported' },
    })
    expect(spawnMock).not.toHaveBeenCalled()
    expect(writeFile).not.toHaveBeenCalled()
  })

  it('rejects updateInstalled when only an unselected declared shared target exists', async () => {
    const context = webappContext()
    context.opts.updateInstalled = true
    setInstalledSkills(context.manifest, ['other-skill', 'webapp-testing'])
    vi.mocked(lstat).mockImplementation(async (path) => {
      if (String(path) === join(userHome, '.agents', 'skills', 'other-skill'))
        return {} as Awaited<ReturnType<typeof lstat>>
      throw missing()
    })
    accessMock.mockRejectedValue(missing())

    const result = await installNpxSkillInstaller(context)

    expect(result).toMatchObject({
      ok: false,
      phase: 'preflight',
      error: { keyword: 'update-unsupported' },
    })
    expect(spawnMock).not.toHaveBeenCalled()
    expect(writeFile).not.toHaveBeenCalled()
  })

  it('rejects a successful spawn that leaves only the shared target present', async () => {
    accessMock.mockImplementation(async (path) => {
      if (path === join(sharedSkill, 'SKILL.md')) return
      throw missing()
    })
    spawnMock.mockImplementation(scriptedSpawn([{ exitCode: 0 }]))

    const result = await installNpxSkillInstaller(webappContext())

    expect(result).toMatchObject({
      ok: false,
      phase: 'verify',
      error: { keyword: 'verify-failed' },
    })
    expect(spawnMock.mock.calls[0]?.[1]?.join(' ')).toContain('skills@latest add')
    expect(spawnMock).toHaveBeenCalledTimes(1)
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
