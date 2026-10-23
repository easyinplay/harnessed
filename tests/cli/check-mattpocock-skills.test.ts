// v3.6.0 Phase 2 Wave 3 — checkMattpocockSkills helper PRIMARY coverage.
// Sister Phase 3.4 W1 T1.3 check-token-budget.test.ts tmpdir + HOME redirect
// + vi.resetModules per-cell isolation pattern (real fs, NOT global mock).

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const unreadable = vi.hoisted(() => new Set<string>())
vi.mock('node:fs/promises', async (importOriginal) => {
  const real = await importOriginal<typeof import('node:fs/promises')>()
  return {
    ...real,
    readFile: ((path: unknown, ...rest: unknown[]) => {
      if (unreadable.has(String(path))) {
        return Promise.reject(
          Object.assign(new Error('fixture permission denied'), { code: 'EACCES' }),
        )
      }
      return (real.readFile as (...args: unknown[]) => unknown)(path, ...rest)
    }) as typeof real.readFile,
  }
})

let tmpRoot: string
const plugin = '.claude/plugins/cache/mattpocock-skills/mattpocock-skills'

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'check-matt-'))
  vi.stubEnv('HOME', tmpRoot)
  vi.stubEnv('USERPROFILE', tmpRoot)
  vi.stubEnv('CODEX_HOME', '')
  vi.stubEnv('HARNESSED_PLATFORM', 'claude')
  vi.stubEnv('HARNESSED_ROOT_OVERRIDE', '')
  unreadable.clear()
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllEnvs()
  unreadable.clear()
  rmSync(tmpRoot, { recursive: true, force: true })
})

function file(path: string, content = '# Fixture skill\n'): void {
  const target = join(tmpRoot, path)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, content, 'utf8')
}

describe('mattpocock requires readable indicator content, not directory presence', () => {
  it.each([
    ['empty individual indicator', '.claude/skills/tdd', 'dir'],
    ['individual indicator is a file', '.claude/skills/diagnosing-bugs', 'file'],
    ['empty package directory', '.claude/skills/mattpocock-skills', 'dir'],
    ['package name is a file', '.claude/skills/mattpocock-skills', 'file'],
    ['empty plugin version', `${plugin}/1.2.0`, 'dir'],
    ['plugin version is a file', `${plugin}/1.2.0`, 'file'],
    ['empty nested package indicator', '.claude/skills/mattpocock-skills/tdd', 'dir'],
    ['SKILL.md is a directory', '.claude/skills/grill-with-docs/SKILL.md', 'dir'],
  ])('%s stays WARN', async (_label, path, kind) => {
    if (kind === 'dir') mkdirSync(join(tmpRoot, path), { recursive: true })
    else file(path)
    const { checkMattpocockSkills } = await import('../../src/cli/lib/check-mattpocock-skills.js')
    const r = await checkMattpocockSkills()
    expect(r.status).toBe('warn')
    expect(r.install_commands?.[0]).toContain('--agent claude-code')
  })

  it.each(['', ' \n\t '])('blank indicator SKILL.md (%j) stays WARN', async (content) => {
    file('.claude/skills/tdd/SKILL.md', content)
    const { checkMattpocockSkills } = await import('../../src/cli/lib/check-mattpocock-skills.js')
    const r = await checkMattpocockSkills()
    expect(r.status).toBe('warn')
  })

  it('unreadable SKILL.md stays WARN even when indicator directory exists', async () => {
    const path = '.claude/skills/diagnose/SKILL.md'
    file(path)
    unreadable.add(join(tmpRoot, path))
    const { checkMattpocockSkills } = await import('../../src/cli/lib/check-mattpocock-skills.js')
    expect((await checkMattpocockSkills()).status).toBe('warn')
  })

  it.each([
    '',
    ' \n\t ',
    '# Fixture package',
  ])('package SKILL.md (%j) cannot prove a known indicator', async (content) => {
    file('.claude/skills/mattpocock-skills/SKILL.md', content)
    const { checkMattpocockSkills } = await import('../../src/cli/lib/check-mattpocock-skills.js')
    const r = await checkMattpocockSkills()
    expect(r.status).toBe('warn')
    expect(r.install_commands?.[0]).toContain('--agent claude-code')
    if (content.trim()) {
      expect(r.message).toMatch(/package SKILL.md content detected/)
      expect(r.message).toMatch(/no readable known indicator/)
      expect(r.message).toMatch(/runtime not verified/)
    }
  })

  it.each([
    '.claude/skills/mattpocock-skills/tdd/SKILL.md',
    '.claude/skills/mattpocock-skills/skills/tdd/SKILL.md',
    `${plugin}/1.2.0/skills/tdd/SKILL.md`,
    '.agents/skills/diagnosing-bugs/SKILL.md',
    '.codex/skills/tdd/SKILL.md',
  ])('blank SKILL content at %s cannot be rescued by its parent names', async (path) => {
    vi.stubEnv('HARNESSED_PLATFORM', path.startsWith('.claude') ? 'claude' : 'codex')
    file(path, ' \n\t ')
    const { checkMattpocockSkills } = await import('../../src/cli/lib/check-mattpocock-skills.js')
    expect((await checkMattpocockSkills()).status).toBe('warn')
  })

  it.each([
    ['tdd', '.claude/skills/tdd/SKILL.md'],
    ['diagnosing-bugs', '.claude/skills/diagnosing-bugs/SKILL.md'],
    ['grill-with-docs', '.claude/skills/grill-with-docs/SKILL.md'],
    ['diagnose', '.claude/skills/diagnose/SKILL.md'],
    ['pack tdd', '.claude/skills/mattpocock-skills/tdd/SKILL.md'],
    ['pack skills tdd', '.claude/skills/mattpocock-skills/skills/tdd/SKILL.md'],
    ['plugin tdd', `${plugin}/1.2.0/skills/tdd/SKILL.md`],
  ])('one valid %s is sufficient but only proves partial local content', async (_label, path) => {
    file(path)
    const { checkMattpocockSkills } = await import('../../src/cli/lib/check-mattpocock-skills.js')
    const r = await checkMattpocockSkills()
    expect(r.status).toBe('pass')
    expect.soft(r.message).toMatch(/partial|at least one|one indicator/i)
    expect.soft(r.message).toMatch(/content/i)
    expect.soft(r.message).toMatch(/runtime[^;.]*(?:not verified|unverified)/i)
    expect(r.install_commands).toBeUndefined()
  })

  it.each([
    'plugin',
    'pack',
  ])('broken %s falls back to an actual individual indicator', async (kind) => {
    if (kind === 'plugin') mkdirSync(join(tmpRoot, plugin, '9.9.0'), { recursive: true })
    else file('.claude/skills/mattpocock-skills/tdd/SKILL.md', ' \n')
    file('.claude/skills/grill-with-docs/SKILL.md')
    const { checkMattpocockSkills } = await import('../../src/cli/lib/check-mattpocock-skills.js')
    const r = await checkMattpocockSkills()
    expect(r.status).toBe('pass')
    expect(r.message).toContain('grill-with-docs')
    expect(r.message).toMatch(/content/i)
  })

  it.each([
    '.agents',
    '.codex',
  ])('Codex accepts one real skill in %s without implying completeness', async (dir) => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    file(`${dir}/skills/diagnosing-bugs/SKILL.md`)
    const { checkMattpocockSkills } = await import('../../src/cli/lib/check-mattpocock-skills.js')
    const r = await checkMattpocockSkills()
    expect(r.status).toBe('pass')
    expect(r.message).toMatch(/partial|at least one|one indicator/i)
    expect(r.message).toMatch(/content/i)
    expect(r.message).toContain(join(tmpRoot, dir, 'skills'))
    expect(r.message).toMatch(/complete package and runtime not verified/)
    expect(r.install_commands).toBeUndefined()
  })

  it.each([
    '.claude/skills/tdd/SKILL.md',
    '.claude/skills/mattpocock-skills/tdd/SKILL.md',
    '.claude/skills/mattpocock-skills/skills/tdd/SKILL.md',
    `${plugin}/1.2.0/skills/tdd/SKILL.md`,
  ])('Codex does not borrow a readable Claude indicator at %s', async (path) => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    file(path)
    const { checkMattpocockSkills } = await import('../../src/cli/lib/check-mattpocock-skills.js')
    const r = await checkMattpocockSkills()
    expect.soft(r.status).toBe('warn')
    expect.soft(r.message).not.toContain('.claude')
    expect.soft(r.message).not.toContain('partial local content detected')
    expect(r.install_commands).toEqual([
      'npx skills@latest add mattpocock/skills --copy -y --agent codex',
    ])
  })

  it('Codex does not borrow Claude package-only content as provenance', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    file('.claude/skills/mattpocock-skills/SKILL.md')
    const { checkMattpocockSkills } = await import('../../src/cli/lib/check-mattpocock-skills.js')
    const r = await checkMattpocockSkills()
    expect(r.status).toBe('warn')
    expect(r.message).toMatch(/no readable nonempty known indicator/)
    expect(r.message).not.toContain('package SKILL.md content detected')
  })

  it('resolves the active platform at check time instead of import time', async () => {
    file('.claude/skills/tdd/SKILL.md')
    const { checkMattpocockSkills } = await import('../../src/cli/lib/check-mattpocock-skills.js')
    expect((await checkMattpocockSkills()).status).toBe('pass')
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    const r = await checkMattpocockSkills()
    expect(r.status).toBe('warn')
    expect(r.message).not.toContain('.claude')
  })

  it('Codex accepts partial local content in a custom CODEX_HOME', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    vi.stubEnv('CODEX_HOME', join(tmpRoot, 'custom-codex'))
    file('custom-codex/skills/diagnosing-bugs/SKILL.md')
    const { checkMattpocockSkills } = await import('../../src/cli/lib/check-mattpocock-skills.js')
    const r = await checkMattpocockSkills()
    expect(r.status).toBe('pass')
    expect(r.message).toContain(join(tmpRoot, 'custom-codex', 'skills'))
    expect(r.message).toContain('partial local content detected')
    expect(r.message).toContain('complete package and runtime not verified')
    expect(r.install_commands).toBeUndefined()
  })

  it.each([
    '.codex/skills/tdd/SKILL.md',
    '.claude/skills/tdd/SKILL.md',
    `${plugin}/1.2.0/skills/tdd/SKILL.md`,
  ])('empty custom CODEX_HOME does not borrow %s', async (path) => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    vi.stubEnv('CODEX_HOME', join(tmpRoot, 'custom-codex'))
    mkdirSync(join(tmpRoot, 'custom-codex', 'skills'), { recursive: true })
    file(path)
    const { checkMattpocockSkills } = await import('../../src/cli/lib/check-mattpocock-skills.js')
    const r = await checkMattpocockSkills()
    expect(r.status).toBe('warn')
    expect(r.message).not.toContain('.claude')
    expect(r.message).not.toContain('partial local content detected')
  })

  it.each([
    '.agents',
    '.codex',
  ])('Claude retains readable indicator compatibility in %s', async (dir) => {
    file(`${dir}/skills/tdd/SKILL.md`)
    const { checkMattpocockSkills } = await import('../../src/cli/lib/check-mattpocock-skills.js')
    const r = await checkMattpocockSkills()
    expect(r.status).toBe('pass')
    expect(r.message).toContain(join(tmpRoot, dir, 'skills'))
    expect(r.message).toContain('partial local content detected')
    expect(r.message).toContain('complete package and runtime not verified')
  })

  it('Codex ignores Claude plugin-version presence and rejects its own empty indicator', async () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    mkdirSync(join(tmpRoot, plugin, '1.2.0'), { recursive: true })
    mkdirSync(join(tmpRoot, '.codex/skills/tdd'), { recursive: true })
    const { checkMattpocockSkills } = await import('../../src/cli/lib/check-mattpocock-skills.js')
    const r = await checkMattpocockSkills()
    expect(r.status).toBe('warn')
    expect(r.install_commands).toEqual([
      'npx skills@latest add mattpocock/skills --copy -y --agent codex',
    ])
  })

  it.each([
    ['claude', 'claude-code'],
    ['codex', 'codex'],
  ])('missing content on %s preserves platform remediation', async (platform, agent) => {
    vi.stubEnv('HARNESSED_PLATFORM', platform)
    const { checkMattpocockSkills } = await import('../../src/cli/lib/check-mattpocock-skills.js')
    const r = await checkMattpocockSkills()
    expect(r.status).toBe('warn')
    expect(r.fix).toMatch(/npx skills@latest add mattpocock\/skills/)
    expect(r.fix).toMatch(/role-prompts\.yaml/)
    expect(r.install_commands).toEqual([
      `npx skills@latest add mattpocock/skills --copy -y --agent ${agent}`,
    ])
  })
})
