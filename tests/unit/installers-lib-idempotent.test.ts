// v4.13.0 — unit tests for src/installers/lib/idempotent.ts skill-name parsing +
// presence probe (patch 4.13.0 setup UX; findings.md 根因 3).
//
// Covers:
//   - extractSkillName: `--skill <name>` / `-s <name>` flag wins over repo segment
//     (design-taste-frontend regression: repo segment was `taste-skill`, verify
//     looked at the wrong dir forever → "总是检测不到")
//   - extractSkillName: repo-segment fallback unchanged (mattpocock/skills → skills)
//   - detectSkillPresence: INSTALLED_INDICATORS found in EITHER ~/.claude/skills
//     or ~/.agents/skills (pre-4.13.0 only ~/.claude/skills was probed)
//   - detectSkillPresence: --skill name probed across both harness skills dirs
//
// Mocks: platform.js (skills dirs), node:fs/promises access.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let platformHome = '/fake-home'
const accessMock = vi.fn(async (_p: string): Promise<void> => undefined)
const statMock = vi.fn(async (_p: string) => ({ isFile: (): boolean => true }))
const readFileMock = vi.fn(async (_p: string, _encoding?: string): Promise<string> => {
  const e = new Error('ENOENT') as NodeJS.ErrnoException
  e.code = 'ENOENT'
  throw e
})
const isCompiledRuntimeMock = vi.fn(() => false)
vi.mock('node:fs/promises', () => ({
  access: (p: string) => accessMock(p),
  stat: (p: string) => statMock(p),
  readFile: (p: string, encoding?: string) => readFileMock(p, encoding),
}))
vi.mock('../../src/platform/assetsRoot.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/platform/assetsRoot.js')>()),
  isCompiledRuntime: () => isCompiledRuntimeMock(),
}))

// platform.js factory — idempotent.ts consumes getSkillsDir + harnessSkillsDirs;
// its transitive readClaudeConfig.js consumes the 3 config-path getters.
vi.mock('../../src/platform/platform.js', () => ({
  detectPlatform: () => ({
    id: process.env.HARNESSED_PLATFORM ?? 'claude',
    homeDir: join(platformHome, process.env.HARNESSED_PLATFORM === 'codex' ? '.codex' : '.claude'),
  }),
  getSkillsDir: () =>
    join(
      platformHome,
      process.env.HARNESSED_PLATFORM === 'codex' ? '.agents' : '.claude',
      'skills',
    ),
  harnessSkillsDirs: () =>
    ['.claude', '.agents', '.codex'].map((root) => join(platformHome, root, 'skills')),
  getMcpConfigPath: () => '/fake-home/.claude.json',
  getPluginsRegistry: () => '/fake-home/.claude/plugins/installed_plugins.json',
  getSettingsPath: () => '/fake-home/.claude/settings.json',
}))

vi.mock('../../src/installers/lib/readClaudeConfig.js', () => ({
  isMcpServerRegistered: vi.fn(async () => false),
  isPluginRegistered: vi.fn(async () => false),
}))
vi.mock('../../src/installers/lib/codexPlugins.js', () => ({
  isCodexPluginInstalled: vi.fn(async () => false),
}))
vi.mock('../../src/installers/lib/spawn.js', () => ({
  spawnCmd: vi.fn(async () => ({ ok: true, exitCode: 0, stdout: '', stderr: '' })),
}))

// v4.16.1 T1 — binaryProbe factory: real extractVerifyBinary, controllable
// binaryOnPath (the real one spawns where/which — nondeterministic on dev hosts).
const binOnPathMock = vi.fn((_bin: string) => false)
vi.mock('../../src/installers/lib/binaryProbe.js', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/installers/lib/binaryProbe.js')>()
  return { ...real, binaryOnPath: (b: string) => binOnPathMock(b) }
})

import { isCodexPluginInstalled } from '../../src/installers/lib/codexPlugins.js'
import {
  detectSkillPresence,
  extractSkillName,
  isAlreadyInstalled,
} from '../../src/installers/lib/idempotent.js'
import {
  isMcpServerRegistered,
  isPluginRegistered,
} from '../../src/installers/lib/readClaudeConfig.js'
import { spawnCmd } from '../../src/installers/lib/spawn.js'
import type { InstallContext, Manifest } from '../../src/installers/lib/types.js'

/** access resolves only for paths containing one of `present` fragments. */
function accessPresent(present: string[]): void {
  accessMock.mockImplementation(async (p: string) => {
    const norm = String(p).replace(/\\/g, '/')
    if (present.some((frag) => norm.includes(frag))) return undefined
    const e = new Error('ENOENT') as NodeJS.ErrnoException
    e.code = 'ENOENT'
    throw e
  })
  statMock.mockImplementation(async (p: string) => {
    await accessMock(p)
    return { isFile: () => true }
  })
  readFileMock.mockImplementation(async (p: string) => {
    await accessMock(p)
    return '# Test skill\n'
  })
}

describe('extractSkillName (v4.13.0 --skill flag parsing)', () => {
  it('prefers `--skill <name>` over the repo segment', () => {
    expect(
      extractSkillName(
        'npx --yes skills@latest add Leonxlnx/taste-skill --skill design-taste-frontend --copy',
        'design-taste-frontend',
      ),
    ).toBe('design-taste-frontend')
  })

  it('supports the short `-s <name>` form', () => {
    expect(extractSkillName('npx skills@1.5.7 add owner/repo -s my-skill --copy', 'fb')).toBe(
      'my-skill',
    )
  })

  it("ignores `--skill '*'` wildcard (falls back to repo segment)", () => {
    expect(extractSkillName("npx skills@latest add owner/some-repo --skill '*' --copy", 'fb')).toBe(
      'some-repo',
    )
  })

  it('falls back to repo last segment when no --skill flag (pre-4.13.0 behavior)', () => {
    expect(
      extractSkillName('npx --yes skills@latest add mattpocock/skills --copy --global', 'fb'),
    ).toBe('skills')
  })

  it('returns fallback when cmd has no skills-add shape', () => {
    expect(extractSkillName('npm install -g ctx7', 'ctx7')).toBe('ctx7')
  })
})

describe('detectSkillPresence (v4.13.0 dual-dir probe)', () => {
  beforeEach(() => {
    accessMock.mockReset()
  })

  it('mattpocock indicators found under ~/.agents/skills → true (pre-4.13.0 missed)', async () => {
    accessPresent(['/.agents/skills/diagnose'])
    await expect(
      detectSkillPresence(
        'npx --yes skills@latest add mattpocock/skills --copy --global',
        'mattpocock-skills',
      ),
    ).resolves.toBe(true)
  })

  it('v4.16.0 — mattpocock NEW upstream skill name (diagnosing-bugs) detected', async () => {
    // Upstream mattpocock/skills renamed `diagnose` → `diagnosing-bugs` and
    // dropped `zoom-out` (verified 2026-07-03 via gh api skills/engineering).
    // Fresh installs create the NEW names only; legacy `diagnose` stays in the
    // indicator list so pre-rename machines still detect as installed.
    accessPresent(['/.claude/skills/diagnosing-bugs'])
    await expect(
      detectSkillPresence(
        'npx --yes skills@latest add mattpocock/skills --copy --global',
        'mattpocock-skills',
      ),
    ).resolves.toBe(true)
  })

  it('--skill name found under ~/.agents/skills → true', async () => {
    accessPresent(['/.agents/skills/design-taste-frontend/SKILL.md'])
    await expect(
      detectSkillPresence(
        'npx --yes skills@latest add Leonxlnx/taste-skill --skill design-taste-frontend --copy',
        'design-taste-frontend',
      ),
    ).resolves.toBe(true)
  })

  it('--skill name found under ~/.claude/skills → true', async () => {
    accessPresent(['/.claude/skills/design-taste-frontend/SKILL.md'])
    await expect(
      detectSkillPresence(
        'npx --yes skills@latest add Leonxlnx/taste-skill --skill design-taste-frontend --copy',
        'design-taste-frontend',
      ),
    ).resolves.toBe(true)
  })

  it('nothing on disk → false', async () => {
    accessPresent([])
    await expect(
      detectSkillPresence(
        'npx --yes skills@latest add Leonxlnx/taste-skill --skill design-taste-frontend --copy',
        'design-taste-frontend',
      ),
    ).resolves.toBe(false)
  })
})

// v4.16.1 T1 — npm-cli installed-state via PATH binary probe (ctx7 dogfood:
// installed by L4 rescue, yet every later setup re-skipped level-flag-missing
// and re-prompted — the skillDir probe is meaningless for global npm CLIs).
describe('isAlreadyInstalled npm-cli binary probe (v4.16.1 T1)', () => {
  const ctx7Ctx = (): InstallContext => ({
    manifest: {
      apiVersion: 'harnessed/v1',
      kind: 'Manifest',
      metadata: {
        name: 'ctx7',
        display_name: 'ctx7 CLI',
        description: 'd',
        upstream: {
          source: 'ctx7',
          homepage: 'https://context7.com',
          repository: 'https://github.com/upstash/context7.git',
          license: 'MIT',
          notice: 'n',
        },
      },
      spec: {
        type: 'cli-npm',
        component_type: 'cli-binary',
        category: 'search',
        install_type: 'npm',
        install: { method: 'npm-cli', cmd: 'npm install -g ctx7', npm_version: '^0.4.0' },
        verify: { cmd: 'ctx7 --version', timeout_ms: 5000 },
        uninstall: { cmd: 'npm uninstall -g ctx7' },
        upstream_health: {
          stability: 'stable',
          last_check: '2026-07-03',
          last_known_good_version: '0.4.x',
          fallback_action: 'warn',
        },
        signed_by: 'easyinplay',
        platforms: ['linux', 'darwin', 'win32'],
      },
    } as unknown as Manifest,
    opts: {
      apply: true,
      dryRun: false,
      system: false,
      nonInteractive: true,
      fullDiff: false,
      color: 'auto',
      updateInstalled: false,
      quiet: true,
    },
    level: 'L4',
    cwd: '/tmp',
  })

  beforeEach(() => {
    accessMock.mockReset()
    accessPresent([])
    binOnPathMock.mockReset()
    binOnPathMock.mockReturnValue(false)
  })

  it('binary on PATH → already-installed (no L4 re-prompt on the next setup)', async () => {
    binOnPathMock.mockReturnValue(true)
    await expect(isAlreadyInstalled(ctx7Ctx())).resolves.toBe(true)
    expect(binOnPathMock).toHaveBeenCalledWith('ctx7')
  })

  it('cli-binary probes the manifest name rather than a verifier helper executable', async () => {
    const c = ctx7Ctx()
    c.manifest.spec.verify.cmd = 'verifier-helper --check ctx7'
    binOnPathMock.mockImplementation((bin) => bin === 'ctx7')

    await expect(isAlreadyInstalled(c)).resolves.toBe(true)
    expect(binOnPathMock).toHaveBeenCalledExactlyOnceWith('ctx7')
  })

  it('binary absent → falls through to the legacy probes → false', async () => {
    await expect(isAlreadyInstalled(ctx7Ctx())).resolves.toBe(false)
  })

  it('updateInstalled=true bypasses the probe entirely (force-update contract)', async () => {
    binOnPathMock.mockReturnValue(true)
    const ctx = ctx7Ctx()
    ctx.opts.updateInstalled = true
    await expect(isAlreadyInstalled(ctx)).resolves.toBe(false)
    expect(binOnPathMock).not.toHaveBeenCalled()
  })

  it.each([
    'ctx7',
    'context7',
  ])('plugin %s cannot substitute for the PATH executable', async (plugin) => {
    vi.mocked(isPluginRegistered).mockImplementation(async (name) => name === plugin)
    try {
      await expect(isAlreadyInstalled(ctx7Ctx())).resolves.toBe(false)
    } finally {
      vi.mocked(isPluginRegistered).mockResolvedValue(false)
    }
  })

  it('a same-name skill directory cannot substitute for the PATH executable', async () => {
    accessPresent(['/.claude/skills/ctx7'])

    await expect(isAlreadyInstalled(ctx7Ctx())).resolves.toBe(false)
  })

  it('a successful plugin/skill shell fallback cannot prove CLI presence', async () => {
    const c = ctx7Ctx()
    c.manifest.spec.install.idempotent_check = 'claude plugin list'
    vi.mocked(spawnCmd).mockClear()
    vi.mocked(spawnCmd).mockResolvedValue({ ok: true, exitCode: 0, stdout: '', stderr: '' })

    await expect(isAlreadyInstalled(c)).resolves.toBe(false)
    expect(spawnCmd).not.toHaveBeenCalled()
  })

  it('dry-run bypasses even a present PATH executable', async () => {
    const c = ctx7Ctx()
    c.opts.dryRun = true
    binOnPathMock.mockReturnValue(true)

    await expect(isAlreadyInstalled(c)).resolves.toBe(false)
    expect(binOnPathMock).not.toHaveBeenCalled()
  })
})

describe('isAlreadyInstalled cc-hook-add host contract', () => {
  const ctx = (): InstallContext => ({
    manifest: {
      metadata: { name: 'inject-state' },
      spec: {
        install: {
          method: 'cc-hook-add',
          cmd: 'node bin/harnessed-inject-state.mjs',
          hook_event: 'UserPromptSubmit',
          hook_command: 'node bin/harnessed-inject-state.mjs',
        },
      },
    } as unknown as Manifest,
    opts: {
      apply: true,
      dryRun: false,
      system: false,
      nonInteractive: true,
      fullDiff: false,
      color: 'auto',
    },
    level: 'L4',
    cwd: '/tmp',
  })

  beforeEach(() => {
    vi.stubEnv('HARNESSED_PLATFORM', 'claude')
    readFileMock.mockReset()
    isCompiledRuntimeMock.mockReset().mockReturnValue(false)
    vi.mocked(isCodexPluginInstalled).mockReset().mockResolvedValue(false)
  })
  afterEach(() => vi.unstubAllEnvs())

  it('accepts the desired compiled Claude hook entry', async () => {
    isCompiledRuntimeMock.mockReturnValue(true)
    const command = `"${process.execPath.replace(/\\/g, '/')}" inject-state`
    readFileMock.mockResolvedValue(
      JSON.stringify({
        hooks: {
          UserPromptSubmit: [{ hooks: [{ type: 'command', command }] }],
        },
      }),
    )

    await expect(isAlreadyInstalled(ctx())).resolves.toBe(true)
    expect(readFileMock).toHaveBeenCalledOnce()
    expect(isCodexPluginInstalled).not.toHaveBeenCalled()
  })

  it('accepts the desired Node/npm Claude hook entry', async () => {
    const command = `node "${join(process.cwd(), 'bin', 'harnessed-inject-state.mjs').replace(/\\/g, '/')}"`
    readFileMock.mockResolvedValue(
      JSON.stringify({
        hooks: {
          UserPromptSubmit: [{ hooks: [{ type: 'command', command }] }],
        },
      }),
    )

    await expect(isAlreadyInstalled(ctx())).resolves.toBe(true)
  })

  it('uses the Codex plugin probe without reading Claude settings', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    vi.mocked(isCodexPluginInstalled).mockResolvedValue(true)

    await expect(isAlreadyInstalled(ctx())).resolves.toBe(true)
    expect(isCodexPluginInstalled).toHaveBeenCalledExactlyOnceWith(
      'harnessed-inject-state@harnessed-local',
    )
    expect(readFileMock).not.toHaveBeenCalled()
  })
})

describe.each([
  'mcp-stdio-add',
  'mcp-http-add',
])('isAlreadyInstalled %s host isolation', (method) => {
  const ctx = (): InstallContext => ({
    manifest: {
      metadata: { name: 'tavily-mcp' },
      spec: {
        install: {
          method,
          cmd: 'claude mcp add tavily',
          idempotent_check: 'claude mcp list | grep -q tavily',
        },
      },
    } as unknown as Manifest,
    opts: {
      apply: true,
      dryRun: false,
      system: false,
      nonInteractive: true,
      fullDiff: false,
      color: 'auto',
    },
    level: 'L4',
    cwd: '/tmp',
  })

  beforeEach(() => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    vi.mocked(isMcpServerRegistered).mockReset().mockResolvedValue(false)
    vi.mocked(isPluginRegistered).mockReset().mockResolvedValue(false)
    vi.mocked(spawnCmd)
      .mockReset()
      .mockResolvedValue({ ok: true, exitCode: 0, stdout: '', stderr: '' })
  })
  afterEach(() => vi.unstubAllEnvs())

  it('Codex missing stays false even when the Claude shell fallback would succeed', async () => {
    await expect(isAlreadyInstalled(ctx())).resolves.toBe(false)
    expect(isMcpServerRegistered).toHaveBeenCalledExactlyOnceWith('tavily-mcp')
    expect(isPluginRegistered).not.toHaveBeenCalled()
    expect(spawnCmd).not.toHaveBeenCalled()
  })

  it('Codex missing stays false even when the supplementary plugin probe would succeed', async () => {
    vi.mocked(isPluginRegistered).mockResolvedValue(true)

    await expect(isAlreadyInstalled(ctx())).resolves.toBe(false)
    expect(isMcpServerRegistered).toHaveBeenCalledExactlyOnceWith('tavily-mcp')
    expect(isPluginRegistered).not.toHaveBeenCalled()
    expect(spawnCmd).not.toHaveBeenCalled()
  })

  it('Codex registered returns true without consulting plugins or the shell', async () => {
    vi.mocked(isMcpServerRegistered).mockResolvedValue(true)

    await expect(isAlreadyInstalled(ctx())).resolves.toBe(true)
    expect(isMcpServerRegistered).toHaveBeenCalledExactlyOnceWith('tavily-mcp')
    expect(isPluginRegistered).not.toHaveBeenCalled()
    expect(spawnCmd).not.toHaveBeenCalled()
  })

  it('Codex registration query failure stays false without consulting fallbacks', async () => {
    vi.mocked(isMcpServerRegistered).mockRejectedValue(new Error('codex query failed'))

    await expect(isAlreadyInstalled(ctx())).resolves.toBe(false)
    expect(isPluginRegistered).not.toHaveBeenCalled()
    expect(spawnCmd).not.toHaveBeenCalled()
  })

  it('Claude missing still uses the unchanged successful shell fallback', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'claude')
    const context = ctx()

    await expect(isAlreadyInstalled(context)).resolves.toBe(true)
    expect(isMcpServerRegistered).toHaveBeenCalledExactlyOnceWith('tavily-mcp')
    expect(isPluginRegistered).toHaveBeenCalledExactlyOnceWith('tavily-mcp')
    expect(spawnCmd).toHaveBeenCalledExactlyOnceWith(
      context,
      'claude mcp list | grep -q tavily',
      [],
      10_000,
    )
  })

  it('Claude missing still accepts the supplementary plugin registry without spawning', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'claude')
    vi.mocked(isPluginRegistered).mockResolvedValue(true)

    await expect(isAlreadyInstalled(ctx())).resolves.toBe(true)
    expect(isMcpServerRegistered).toHaveBeenCalledExactlyOnceWith('tavily-mcp')
    expect(isPluginRegistered).toHaveBeenCalledExactlyOnceWith('tavily-mcp')
    expect(spawnCmd).not.toHaveBeenCalled()
  })
})

describe.each([
  {
    name: 'gsd',
    method: 'npm-cli',
    cmd: 'npx --yes @opengsd/gsd-core@latest --codex --global',
    indicators: ['gsd-plan-phase', 'gsd-progress'],
  },
  {
    name: 'mattpocock-skills',
    method: 'npx-skill-installer',
    cmd: 'npx --yes skills@latest add mattpocock/skills --copy --global',
    indicators: ['tdd', 'diagnosing-bugs'],
  },
])('$name indicator skill integrity', ({ name, method, cmd, indicators }) => {
  const ctx = (): InstallContext => ({
    manifest: {
      metadata: { name },
      spec: {
        install: {
          method,
          cmd,
          idempotent_check: `test -f ~/.agents/skills/${indicators[0]}/SKILL.md`,
        },
        verify: { cmd: `test -f ~/.agents/skills/${indicators[0]}/SKILL.md` },
      },
    } as unknown as Manifest,
    opts: {
      apply: true,
      dryRun: false,
      system: false,
      nonInteractive: true,
      fullDiff: false,
      color: 'auto',
    },
    level: 'L4',
    cwd: '/tmp',
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    accessPresent(indicators.map((ind) => `/.agents/skills/${ind}`))
    binOnPathMock.mockReturnValue(false)
    vi.mocked(isPluginRegistered).mockResolvedValue(false)
    vi.mocked(spawnCmd).mockResolvedValue({ ok: true, exitCode: 1, stdout: '', stderr: '' })
  })
  afterEach(() => vi.unstubAllEnvs())

  it('empty indicator directories do not prove installation or short-circuit fallback probes', async () => {
    statMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))

    await expect(detectSkillPresence(cmd, name)).resolves.toBe(false)
    await expect(isAlreadyInstalled(ctx())).resolves.toBe(false)
    expect(isPluginRegistered).toHaveBeenCalledExactlyOnceWith(name)
    expect(spawnCmd).toHaveBeenCalledTimes(1)
    expect(readFileMock).not.toHaveBeenCalled()
  })

  it('a readable regular SKILL.md proves installation without fallback probes', async () => {
    await expect(detectSkillPresence(cmd, name)).resolves.toBe(true)
    await expect(isAlreadyInstalled(ctx())).resolves.toBe(true)
    expect(readFileMock).toHaveBeenCalledWith(expect.stringContaining('SKILL.md'), 'utf8')
    expect(isPluginRegistered).not.toHaveBeenCalled()
    expect(spawnCmd).not.toHaveBeenCalled()
  })

  it('a directory named SKILL.md does not prove installation', async () => {
    statMock.mockResolvedValue({ isFile: () => false })

    await expect(detectSkillPresence(cmd, name)).resolves.toBe(false)
    await expect(isAlreadyInstalled(ctx())).resolves.toBe(false)
    expect(readFileMock).not.toHaveBeenCalled()
  })

  it('an unreadable SKILL.md does not prove installation', async () => {
    readFileMock.mockRejectedValue(Object.assign(new Error('EACCES'), { code: 'EACCES' }))

    await expect(detectSkillPresence(cmd, name)).resolves.toBe(false)
    await expect(isAlreadyInstalled(ctx())).resolves.toBe(false)
  })
})

describe.each([
  {
    name: 'gsd',
    method: 'npm-cli',
    cmd: 'npx --yes @opengsd/gsd-core@latest --codex --global',
    skill: 'gsd-plan-phase',
  },
  {
    name: 'mattpocock-skills',
    method: 'npx-skill-installer',
    cmd: 'npx --yes skills@latest add mattpocock/skills --copy --global',
    skill: 'tdd',
  },
  {
    name: 'custom-skill',
    method: 'npx-skill-installer',
    cmd: 'npx --yes skills@latest add owner/custom-skill --copy --global',
    skill: 'custom-skill',
  },
])('$name real skill-root isolation', ({ name, method, cmd, skill }) => {
  let home: string

  function ctx(idempotentCheck?: string): InstallContext {
    return {
      manifest: {
        metadata: { name },
        spec: {
          install: { method, cmd, idempotent_check: idempotentCheck },
          verify: { cmd: `test -f ~/.agents/skills/${skill}/SKILL.md` },
        },
      } as unknown as Manifest,
      opts: {
        apply: true,
        dryRun: false,
        system: false,
        nonInteractive: true,
        fullDiff: false,
        color: 'auto',
      },
      level: 'L4',
      cwd: home,
    }
  }

  function writeSkill(root: string): void {
    const dir = join(home, root, 'skills', skill)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'SKILL.md'), '# Test skill\n')
  }

  beforeEach(async () => {
    home = mkdtempSync(join(tmpdir(), 'harnessed-skill-host-'))
    platformHome = home
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    vi.clearAllMocks()
    const fs = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises')
    accessMock.mockImplementation((path) => fs.access(path))
    statMock.mockImplementation((path) => fs.stat(path))
    readFileMock.mockImplementation((path) => fs.readFile(path, 'utf8'))
    binOnPathMock.mockReturnValue(false)
    vi.mocked(isPluginRegistered).mockResolvedValue(false)
    vi.mocked(spawnCmd).mockResolvedValue({ ok: true, exitCode: 0, stdout: '', stderr: '' })
  })
  afterEach(() => {
    platformHome = '/fake-home'
    accessPresent([])
    vi.unstubAllEnvs()
    rmSync(home, { recursive: true, force: true })
  })

  it('Codex rejects a Claude-only skill even when its own indicator directories exist', async () => {
    writeSkill('.claude')
    for (const root of ['.agents', '.codex']) {
      mkdirSync(join(home, root, 'skills', skill), { recursive: true })
    }

    await expect(detectSkillPresence(cmd, name)).resolves.toBe(false)
    await expect(isAlreadyInstalled(ctx())).resolves.toBe(false)
    expect(spawnCmd).not.toHaveBeenCalled()
  })

  it.each(['.agents', '.codex'])('Codex accepts a real skill under %s/skills', async (root) => {
    writeSkill(root)

    await expect(detectSkillPresence(cmd, name)).resolves.toBe(true)
    await expect(isAlreadyInstalled(ctx())).resolves.toBe(true)
    expect(spawnCmd).not.toHaveBeenCalled()
  })

  it.each([
    `test -f ~/.claude/skills/${skill}/SKILL.md`,
    `test -f ~/.claude/skills/${skill}/SKILL.md || test -f ~/.agents/skills/${skill}/SKILL.md`,
    'claude plugin list',
  ])('Codex never runs a Claude-bearing fallback: %s', async (fallback) => {
    await expect(isAlreadyInstalled(ctx(fallback))).resolves.toBe(false)
    expect(spawnCmd).not.toHaveBeenCalled()
  })

  it.each(['.agents', '.codex'])('Codex retains an explicit %s fallback', async (root) => {
    const fallback = `test -f ~/${root}/skills/${skill}/SKILL.md`
    const context = ctx(fallback)

    await expect(isAlreadyInstalled(context)).resolves.toBe(true)
    expect(spawnCmd).toHaveBeenCalledExactlyOnceWith(context, fallback, [], 10_000)
  })

  it('Codex still accepts its registered supplementary plugin', async () => {
    vi.mocked(isPluginRegistered).mockResolvedValue(true)

    await expect(isAlreadyInstalled(ctx('claude plugin list'))).resolves.toBe(true)
    expect(isPluginRegistered).toHaveBeenCalledExactlyOnceWith(name)
    expect(spawnCmd).not.toHaveBeenCalled()
  })

  it.each([
    '.claude',
    '.agents',
    '.codex',
  ])('Claude keeps skill compatibility with %s', async (root) => {
    vi.stubEnv('HARNESSED_PLATFORM', 'claude')
    writeSkill(root)

    await expect(detectSkillPresence(cmd, name)).resolves.toBe(true)
    await expect(isAlreadyInstalled(ctx())).resolves.toBe(true)
  })

  it('Claude retains its existing shell fallback', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'claude')
    const fallback = `test -f ~/.claude/skills/${skill}/SKILL.md`
    const context = ctx(fallback)

    await expect(isAlreadyInstalled(context)).resolves.toBe(true)
    expect(spawnCmd).toHaveBeenCalledExactlyOnceWith(context, fallback, [], 10_000)
  })
})
