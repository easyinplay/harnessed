// Phase 28 W1 — setup --platform <id> (v9.0 Phase C / D5) integration-lite tests.
//
// Asserts: (1) invalid id → error + exit(1) before any work; (2) --platform
// codex sets HARNESSED_PLATFORM for the run, persists the `.platform` pin at the
// chosen host's own stateRoot (ADR 0040: detectPlatform reads the codex stateRoot
// first, then the claude one), and routes the resolver-backed skills/commands dirs to
// codex (~/.agents/skills + ~/.codex/prompts). Sister setup.test.ts mock style.
//
// Env isolation CRITICAL: HARNESSED_PLATFORM is set by the action — save/restore
// it (and HARNESSED_ROOT_OVERRIDE) so it never leaks into the claude-default
// regression proof.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs/promises', () => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
  stat: vi.fn(),
  cp: vi.fn(),
  writeFile: vi.fn(),
  rename: vi.fn(),
  mkdir: vi.fn(),
}))

vi.mock('../../src/installers/index.js', () => ({ runInstall: vi.fn() }))
vi.mock('../../src/manifest/validate.js', () => ({ validateManifestFile: vi.fn() }))
// Keep the run short + side-effect free past the platform-apply step.
vi.mock('../../src/cli/lib/auto-install.js', () => ({ runAutoInstall: vi.fn() }))
// Patch 4.11.1 — stub the version banner (no npm subprocess / no output in test).
vi.mock('../../src/cli/lib/version-banner.js', () => ({ printSetupVersionBanner: vi.fn() }))
vi.mock('../../src/cli/lib/setup-helpers.js', () => ({
  runStepBInstall: vi.fn(async () => ({
    installed: [],
    alreadyInstalled: [],
    skipped: [],
    failed: [],
    componentTypes: {},
    elapsedMs: 0,
  })),
  scanWorkflowsWithSkill: vi.fn(async () => ({ workflows: [] })),
  warnIfAgentTeamsMissing: vi.fn(),
}))

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { Command } from 'commander'
import { registerSetup } from '../../src/cli/setup.js'
import {
  claudeDescriptor,
  codexDescriptor,
  getCommandsDir,
  getSkillsDir,
} from '../../src/platform/platform.js'

const readdirMock = vi.mocked(readdir)
const readFileMock = vi.mocked(readFile)
const mkdirMock = vi.mocked(mkdir)
const writeFileMock = vi.mocked(writeFile)

const PLATFORM_KEY = 'HARNESSED_PLATFORM'
const OVERRIDE_KEY = 'HARNESSED_ROOT_OVERRIDE'

class ExitError extends Error {
  constructor(public code: number) {
    super(`exit(${code})`)
  }
}

async function runCli(argv: string[]): Promise<{ code: number; stderr: string }> {
  let stderr = ''
  vi.spyOn(process, 'exit').mockImplementation((c?: number | string | null) => {
    throw new ExitError(typeof c === 'number' ? c : 0)
  })
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation((...a: unknown[]) => {
    stderr += `${a.map(String).join(' ')}\n`
  })
  vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => {
    stderr += `${a.map(String).join(' ')}\n`
  })
  const program = new Command().exitOverride()
  registerSetup(program)
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
    return { code: 0, stderr }
  } catch (e) {
    if (e instanceof ExitError) return { code: e.code, stderr }
    throw e
  }
}

describe('setup --platform (Phase C / D5)', () => {
  let savedPlatform: string | undefined
  let savedOverride: string | undefined

  beforeEach(() => {
    savedPlatform = process.env[PLATFORM_KEY]
    savedOverride = process.env[OVERRIDE_KEY]
    delete process.env[PLATFORM_KEY]
    delete process.env[OVERRIDE_KEY]
    readdirMock.mockReset()
    readFileMock.mockReset()
    mkdirMock.mockReset()
    writeFileMock.mockReset()
    readdirMock.mockResolvedValue([] as never)
    mkdirMock.mockResolvedValue(undefined as never)
    writeFileMock.mockResolvedValue(undefined as never)
  })

  afterEach(() => {
    if (savedPlatform === undefined) delete process.env[PLATFORM_KEY]
    else process.env[PLATFORM_KEY] = savedPlatform
    if (savedOverride === undefined) delete process.env[OVERRIDE_KEY]
    else process.env[OVERRIDE_KEY] = savedOverride
    vi.restoreAllMocks()
  })

  it('--platform bogus → error + exit(1)', async () => {
    const { code, stderr } = await runCli(['setup', '--platform', 'bogus'])
    expect(code).toBe(1)
    expect(stderr).toMatch(/unknown id 'bogus'/)
    expect(stderr).toContain('claude | codex')
  })

  it('--platform codex → sets HARNESSED_PLATFORM + persists .platform pin where detectPlatform reads it + routes resolvers to codex', async () => {
    // scanWorkflowsWithSkill mocked to return [] → setup exits 2 (nothing to
    // install) AFTER applyPlatformOption runs. We assert the platform side
    // effects, which happen before that exit.
    const { code } = await runCli(['setup', '--platform', 'codex'])
    expect(code).toBe(2) // nothing-to-install exit (empty workflows)

    // env set for the run
    expect(process.env[PLATFORM_KEY]).toBe('codex')

    // Phase 63 T2 — pin written to the codex stateRoot, which detectPlatform()
    // reads FIRST (ADR 0040). A codex-only host must not grow a ~/.claude dir.
    const pinWrites = writeFileMock.mock.calls.filter((c) => String(c[0]).endsWith('.platform'))
    expect(pinWrites).toHaveLength(1)
    expect(String(pinWrites[0]?.[0]).replace(/\\/g, '/')).toBe(
      `${codexDescriptor().stateRoot.replace(/\\/g, '/')}/.platform`,
    )
    expect(pinWrites[0]?.[1]).toBe('codex')
    const claudeHome = claudeDescriptor().homeDir.replace(/\\/g, '/')
    for (const [dir] of mkdirMock.mock.calls) {
      expect(String(dir).replace(/\\/g, '/').startsWith(claudeHome)).toBe(false)
    }

    // resolvers now route to codex paths
    expect(getSkillsDir().replace(/\\/g, '/')).toMatch(/\.agents\/skills$/)
    expect(getCommandsDir().replace(/\\/g, '/')).toMatch(/\.codex\/prompts$/)
  })

  it('--platform claude → pin written to the claude stateRoot', async () => {
    const { code } = await runCli(['setup', '--platform', 'claude'])
    expect(code).toBe(2)
    const pinWrites = writeFileMock.mock.calls.filter((c) => String(c[0]).endsWith('.platform'))
    expect(pinWrites).toHaveLength(1)
    expect(String(pinWrites[0]?.[0]).replace(/\\/g, '/')).toBe(
      `${claudeDescriptor().stateRoot.replace(/\\/g, '/')}/.platform`,
    )
    expect(pinWrites[0]?.[1]).toBe('claude')
  })

  // ADR 0040 amendment — switching hosts: a stale pin at the OTHER host's
  // stateRoot (read first when it is codex) would silently win. Rewrite it when
  // it exists with a different id; never create it (no ~/.claude on codex-only).
  describe('pin switch rewrites the other host pin only when it exists', () => {
    const norm = (x: unknown) => String(x).replace(/\\/g, '/')
    const codexPin = () => `${norm(codexDescriptor().stateRoot)}/.platform`
    const claudePin = () => `${norm(claudeDescriptor().stateRoot)}/.platform`
    function existingPins(pins: Record<string, string>): void {
      readFileMock.mockImplementation((async (p: unknown) => {
        const v = pins[norm(p)]
        if (v !== undefined) return v
        if (norm(p).endsWith('/.platform')) {
          throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
        }
        return undefined
      }) as never)
    }
    const pinWrites = () =>
      writeFileMock.mock.calls
        .filter((c) => norm(c[0]).endsWith('/.platform'))
        .map((c) => [norm(c[0]), c[1]])

    it('codex → claude: stale codex pin rewritten to claude', async () => {
      existingPins({ [codexPin()]: 'codex\n' })
      await runCli(['setup', '--platform', 'claude'])
      expect(pinWrites()).toEqual(
        expect.arrayContaining([
          [claudePin(), 'claude'],
          [codexPin(), 'claude'],
        ]),
      )
      expect(pinWrites()).toHaveLength(2)
    })

    it('claude → codex: stale claude pin rewritten to codex', async () => {
      existingPins({ [claudePin()]: 'claude' })
      await runCli(['setup', '--platform', 'codex'])
      expect(pinWrites()).toEqual(
        expect.arrayContaining([
          [codexPin(), 'codex'],
          [claudePin(), 'codex'],
        ]),
      )
      expect(pinWrites()).toHaveLength(2)
    })

    it('other side has no pin → nothing created there (no ~/.claude on codex-only)', async () => {
      existingPins({})
      await runCli(['setup', '--platform', 'codex'])
      expect(pinWrites()).toEqual([[codexPin(), 'codex']])
      const claudeHome = norm(claudeDescriptor().homeDir)
      for (const [dir] of mkdirMock.mock.calls) expect(norm(dir).startsWith(claudeHome)).toBe(false)
    })

    it('other side already agrees → not rewritten', async () => {
      existingPins({ [claudePin()]: 'codex' })
      await runCli(['setup', '--platform', 'codex'])
      expect(pinWrites()).toEqual([[codexPin(), 'codex']])
    })
  })

  it('L1 — --dry-run --platform codex routes the run but writes no pin (dry-run writes nothing)', async () => {
    const { code } = await runCli(['setup', '--dry-run', '--platform', 'codex'])
    expect(code).toBe(2)
    expect(process.env[PLATFORM_KEY]).toBe('codex')
    expect(writeFileMock.mock.calls.find((c) => String(c[0]).endsWith('.platform'))).toBeUndefined()
    expect(mkdirMock).not.toHaveBeenCalled()
  })

  it('no --platform → HARNESSED_PLATFORM stays unset (claude-default untouched)', async () => {
    const { code } = await runCli(['setup'])
    expect(code).toBe(2)
    expect(process.env[PLATFORM_KEY]).toBeUndefined()
    // no .platform pin write attempted
    const pinWrite = writeFileMock.mock.calls.find((c) => String(c[0]).endsWith('.platform'))
    expect(pinWrite).toBeUndefined()
  })
})
