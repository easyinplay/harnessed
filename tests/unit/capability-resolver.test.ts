// v3.4.2 redesign — unit tests for src/cli/lib/capabilityResolver.ts.
//
// Covers the new install_type discriminator (plugin | user-skill) — resolver
// presence-checks the backing capability and emits a warning when declared but
// missing. cmd is NEVER mutated (no namespace prefix rendering).
//
// Cells:
//   1-5  : readInstalledPlugins (file parse, missing/malformed, defensive)
//   6-9  : readInstalledUserSkills (dir scan, missing root, defensive)
//   10-15: resolveCapabilityCmd single-entry behavior (plugin / user-skill /
//          omit / missing lookup field)
//   16-19: renderSkillBody (multi-placeholder, dedup, unknown ref, mixed types)

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  readInstalledPlugins,
  readInstalledUserSkills,
  renderSkillBody,
  resolveCapabilityCmd,
} from '../../src/cli/lib/capabilityResolver.js'

// Throwaway HOME containing a fake ~/.claude/plugins/installed_plugins.json
// and ~/.claude/skills/<x>/ subdirs, shaped per real CC structure
// (verified 2026-05-24 on user's machine).
let fakeHome: string

function writePluginsFile(content: string): void {
  const dir = join(fakeHome, '.claude', 'plugins')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'installed_plugins.json'), content, 'utf8')
}

function mkUserSkill(name: string): void {
  mkdirSync(join(fakeHome, '.claude', 'skills', name), { recursive: true })
}

beforeEach(() => {
  fakeHome = mkdtempSync(join(tmpdir(), 'harnessed-cap-resolver-'))
})

afterEach(() => {
  rmSync(fakeHome, { recursive: true, force: true })
})

describe('readInstalledPlugins — installed_plugins.json parsing', () => {
  it('cell 1 — real-shape fixture → plugin name Set derived from "<name>@<marketplace>"', () => {
    writePluginsFile(
      JSON.stringify({
        version: 2,
        plugins: {
          'code-review@claude-plugins-official': [{ version: '1.0' }],
          'ralph-loop@claude-plugins-official': [{ version: '1.0.0' }],
          'planning-with-files@planning-with-files': [{ version: '2.34.0' }],
        },
      }),
    )
    const plugins = readInstalledPlugins(fakeHome)
    expect(plugins.has('code-review')).toBe(true)
    expect(plugins.has('ralph-loop')).toBe(true)
    expect(plugins.has('planning-with-files')).toBe(true)
    expect(plugins.size).toBe(3)
  })

  it('cell 2 — missing file → empty Set (non-blocking defensive)', () => {
    const plugins = readInstalledPlugins(fakeHome)
    expect(plugins.size).toBe(0)
  })

  it('cell 3 — malformed JSON → empty Set (catches parse error)', () => {
    writePluginsFile('{ not valid json ')
    const plugins = readInstalledPlugins(fakeHome)
    expect(plugins.size).toBe(0)
  })

  it('cell 4 — missing `plugins` key → empty Set', () => {
    writePluginsFile(JSON.stringify({ version: 2 }))
    const plugins = readInstalledPlugins(fakeHome)
    expect(plugins.size).toBe(0)
  })

  it('cell 5 — keys without `@` separator are skipped (forward-compat)', () => {
    writePluginsFile(
      JSON.stringify({
        version: 2,
        plugins: {
          noAtSign: [{ version: '1.0' }],
          'real@valid-marketplace': [{ version: '1.0' }],
        },
      }),
    )
    const plugins = readInstalledPlugins(fakeHome)
    expect(plugins.has('real')).toBe(true)
    expect(plugins.has('noAtSign')).toBe(false)
    expect(plugins.size).toBe(1)
  })
})

describe('readInstalledUserSkills — ~/.claude/skills/ scan', () => {
  it('cell 6 — populated skills dir → Set of subdir names', () => {
    mkUserSkill('gstack')
    mkUserSkill('gsd-review')
    mkUserSkill('diagnose')
    const skills = readInstalledUserSkills(fakeHome)
    expect(skills.has('gstack')).toBe(true)
    expect(skills.has('gsd-review')).toBe(true)
    expect(skills.has('diagnose')).toBe(true)
    expect(skills.size).toBe(3)
  })

  it('cell 7 — missing skills root → empty Set (defensive, non-blocking)', () => {
    // fakeHome exists but ~/.claude/skills/ never created.
    const skills = readInstalledUserSkills(fakeHome)
    expect(skills.size).toBe(0)
  })

  it('cell 8 — empty skills dir → empty Set', () => {
    mkdirSync(join(fakeHome, '.claude', 'skills'), { recursive: true })
    const skills = readInstalledUserSkills(fakeHome)
    expect(skills.size).toBe(0)
  })

  it('cell 9 — files in skills dir ignored (only directories counted)', () => {
    const skillsDir = join(fakeHome, '.claude', 'skills')
    mkdirSync(skillsDir, { recursive: true })
    writeFileSync(join(skillsDir, 'stray-file.txt'), 'noise', 'utf8')
    mkUserSkill('real-skill')
    const skills = readInstalledUserSkills(fakeHome)
    expect(skills.has('real-skill')).toBe(true)
    expect(skills.has('stray-file.txt')).toBe(false)
    expect(skills.size).toBe(1)
  })
})

describe('resolveCapabilityCmd — single capability presence check', () => {
  it('cell 10 — install_type omitted → cmd unchanged, no warning, no check', () => {
    const r = resolveCapabilityCmd({ cmd: '/some-bare-cmd' }, new Set(), new Set())
    expect(r.renderedCmd).toBe('/some-bare-cmd')
    expect(r.warning).toBeUndefined()
  })

  it('cell 11 — install_type=plugin + plugin installed → cmd unchanged, no warning', () => {
    const r = resolveCapabilityCmd(
      { cmd: '/code-review', install_type: 'plugin', plugin_id: 'code-review' },
      new Set(['code-review']),
      new Set(),
    )
    expect(r.renderedCmd).toBe('/code-review') // never mutated
    expect(r.warning).toBeUndefined()
  })

  it('cell 12 — install_type=plugin + plugin NOT installed → cmd unchanged + plugin warning', () => {
    const r = resolveCapabilityCmd(
      { cmd: '/code-review', install_type: 'plugin', plugin_id: 'code-review' },
      new Set(), // not installed
      new Set(),
    )
    expect(r.renderedCmd).toBe('/code-review')
    expect(r.warning).toBeDefined()
    expect(r.warning).toContain('[plugin]')
    expect(r.warning).toContain('code-review')
    expect(r.warning).toContain('claude plugin install')
  })

  it('cell 13 — install_type=user-skill + skill dir exists → cmd unchanged, no warning', () => {
    const r = resolveCapabilityCmd(
      { cmd: '/review', install_type: 'user-skill', skill_dir: 'gstack' },
      new Set(),
      new Set(['gstack']),
    )
    expect(r.renderedCmd).toBe('/review') // bare cmd untouched
    expect(r.warning).toBeUndefined()
  })

  it('cell 14 — install_type=user-skill + skill dir missing → cmd unchanged + user-skill warning with skill_dir hint', () => {
    const r = resolveCapabilityCmd(
      { cmd: '/review', install_type: 'user-skill', skill_dir: 'gstack' },
      new Set(),
      new Set(), // gstack not installed
    )
    expect(r.renderedCmd).toBe('/review')
    expect(r.warning).toBeDefined()
    expect(r.warning).toContain('[user-skill]')
    expect(r.warning).toContain('gstack')
    expect(r.warning).toContain('~/.claude/skills/')
    expect(r.warning).toContain('git clone') // install hint example
  })

  it('cell 15 — install_type=plugin without plugin_id → schema-bug warning', () => {
    const r = resolveCapabilityCmd(
      { cmd: '/somecmd', install_type: 'plugin' }, // plugin_id missing
      new Set(),
      new Set(),
    )
    expect(r.renderedCmd).toBe('/somecmd')
    expect(r.warning).toBeDefined()
    expect(r.warning).toContain('schema bug')
  })
})

describe('renderSkillBody — full SKILL.md rendering', () => {
  const caps = {
    'gstack-review': {
      cmd: '/review',
      install_type: 'user-skill' as const,
      skill_dir: 'gstack',
    },
    'code-review': {
      cmd: '/code-review',
      install_type: 'plugin' as const,
      plugin_id: 'code-review',
    },
    tdd: { cmd: 'superpowers:test-driven-development' }, // omitted install_type
  }

  it('cell 16 — single user-skill placeholder rendered cmd-unchanged when skill installed', () => {
    const body = 'Run `{{ capabilities.gstack-review.cmd }}` to verify.'
    const r = renderSkillBody(body, caps, new Set(), new Set(['gstack']))
    expect(r.body).toBe('Run `/review` to verify.') // bare cmd, no prefix
    expect(r.warnings).toEqual([])
  })

  it('cell 17 — mixed plugin + user-skill + no-check placeholders all render cmd-unchanged', () => {
    const body =
      'Plugin `{{ capabilities.code-review.cmd }}` + user-skill `{{ capabilities.gstack-review.cmd }}` + bare `{{ capabilities.tdd.cmd }}`.'
    const r = renderSkillBody(body, caps, new Set(['code-review']), new Set(['gstack']))
    expect(r.body).toBe(
      'Plugin `/code-review` + user-skill `/review` + bare `superpowers:test-driven-development`.',
    )
    expect(r.warnings).toEqual([])
  })

  it('cell 18 — unknown capability ref preserved verbatim + warning emitted', () => {
    const body = 'Bogus `{{ capabilities.nonexistent.cmd }}` reference.'
    const r = renderSkillBody(body, caps, new Set(), new Set())
    expect(r.body).toContain('{{ capabilities.nonexistent.cmd }}')
    expect(r.warnings).toHaveLength(1)
    expect(r.warnings[0]).toContain('nonexistent')
  })

  it('cell 19 — duplicate missing-capability warnings deduplicated across references', () => {
    const body =
      'A `{{ capabilities.gstack-review.cmd }}` and B `{{ capabilities.gstack-review.cmd }}`.'
    // gstack user-skill not installed → same warning emitted twice → deduped to 1.
    const r = renderSkillBody(body, caps, new Set(), new Set())
    expect(r.body).toBe('A `/review` and B `/review`.') // cmd still rendered bare
    expect(r.warnings).toHaveLength(1)
    expect(r.warnings[0]).toContain('[user-skill]')
    expect(r.warnings[0]).toContain('gstack')
  })

  it('cell 20 — flexible whitespace inside `{{ ... }}` template (forward-compat)', () => {
    const body =
      '`{{capabilities.gstack-review.cmd}}` and `{{    capabilities.gstack-review.cmd    }}`'
    const r = renderSkillBody(body, caps, new Set(), new Set(['gstack']))
    expect(r.body).toBe('`/review` and `/review`')
  })

  it('cell 21 — body without any placeholders returns identical body + zero warnings', () => {
    const body = '## Overview\n\nThis SKILL.md has no `{{ }}` templates whatsoever.\n'
    const r = renderSkillBody(body, caps, new Set(), new Set())
    expect(r.body).toBe(body)
    expect(r.warnings).toEqual([])
  })
})

describe('resolveCapabilityCmd — install_type array (互为补充 dual-install)', () => {
  const dualCaveman = {
    cmd: '/caveman',
    install_type: ['user-skill', 'plugin'] as const,
    plugin_id: 'caveman',
    skill_dir: 'caveman',
  }

  it('cell 22 — array form, plugin detected → cmd unchanged, no warning', () => {
    const r = resolveCapabilityCmd(dualCaveman, new Set(['caveman']), new Set())
    expect(r.renderedCmd).toBe('/caveman')
    expect(r.warning).toBeUndefined()
  })

  it('cell 23 — array form, user-skill detected → cmd unchanged, no warning', () => {
    const r = resolveCapabilityCmd(dualCaveman, new Set(), new Set(['caveman']))
    expect(r.renderedCmd).toBe('/caveman')
    expect(r.warning).toBeUndefined()
  })

  it('cell 24 — array form, BOTH missing → combined [multi] warning listing both install paths joined with OR', () => {
    const r = resolveCapabilityCmd(dualCaveman, new Set(), new Set())
    expect(r.renderedCmd).toBe('/caveman')
    expect(r.warning).toMatch(/^\[multi\]/)
    expect(r.warning).toContain(' OR ')
    expect(r.warning).toContain('plugin')
    expect(r.warning).toContain('user-skill')
    expect(r.warning).toContain('caveman')
  })

  it('cell 25 — array of length 1 behaves equivalent to single string form (single-type prefix label)', () => {
    const r = resolveCapabilityCmd(
      { cmd: '/foo', install_type: ['plugin'], plugin_id: 'foo-plugin' },
      new Set(),
      new Set(),
    )
    expect(r.renderedCmd).toBe('/foo')
    expect(r.warning).toMatch(/^\[plugin\]/)
    expect(r.warning).not.toContain(' OR ')
  })

  it('cell 26 — array with duplicate type values deduped (no double warning fragments)', () => {
    const r = resolveCapabilityCmd(
      {
        cmd: '/foo',
        install_type: ['plugin', 'plugin', 'plugin'],
        plugin_id: 'foo-plugin',
      },
      new Set(),
      new Set(),
    )
    expect(r.warning).toMatch(/^\[plugin\]/)
    // Single hint fragment after dedup — no `OR` chaining 3 copies.
    expect(r.warning).not.toContain(' OR ')
  })
})
