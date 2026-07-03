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

import { detectSkillPresence, extractSkillName } from '../../src/installers/lib/idempotent.js'

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
