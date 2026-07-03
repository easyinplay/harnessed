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

import { beforeEach, describe, expect, it, vi } from 'vitest'

const accessMock = vi.fn(async (_p: string) => undefined)
vi.mock('node:fs/promises', () => ({
  access: (p: string) => accessMock(p),
  readFile: vi.fn(async () => {
    const e = new Error('ENOENT') as NodeJS.ErrnoException
    e.code = 'ENOENT'
    throw e
  }),
}))

// platform.js factory — idempotent.ts consumes getSkillsDir + harnessSkillsDirs;
// its transitive readClaudeConfig.js consumes the 3 config-path getters.
vi.mock('../../src/installers/lib/platform.js', () => ({
  getSkillsDir: () => '/fake-home/.claude/skills',
  harnessSkillsDirs: () => ['/fake-home/.claude/skills', '/fake-home/.agents/skills'],
  getMcpConfigPath: () => '/fake-home/.claude.json',
  getPluginsRegistry: () => '/fake-home/.claude/plugins/installed_plugins.json',
  getSettingsPath: () => '/fake-home/.claude/settings.json',
}))

// v4.16.1 T1 — binaryProbe factory: real extractVerifyBinary, controllable
// binaryOnPath (the real one spawns where/which — nondeterministic on dev hosts).
const binOnPathMock = vi.fn((_bin: string) => false)
vi.mock('../../src/installers/lib/binaryProbe.js', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/installers/lib/binaryProbe.js')>()
  return { ...real, binaryOnPath: (b: string) => binOnPathMock(b) }
})

import {
  detectSkillPresence,
  extractSkillName,
  isAlreadyInstalled,
} from '../../src/installers/lib/idempotent.js'
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
})
