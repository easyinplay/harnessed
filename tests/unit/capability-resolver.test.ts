// v3.4.1 hotfix NEW — unit tests for src/cli/lib/capabilityResolver.ts.
//
// Covers:
//   - readInstalledPlugins: real fixture parse → namespace Set
//   - readInstalledPlugins: missing / malformed / empty → empty Set (defensive)
//   - resolveCapabilityCmd: no plugin_namespace → cmd unchanged
//   - resolveCapabilityCmd: installed plugin → /<ns>:<bareCmd>
//   - resolveCapabilityCmd: missing plugin → cmd unchanged + warning
//   - resolveCapabilityCmd: cmd already namespaced (`:` present) → unchanged
//   - resolveCapabilityCmd: bare/sentinel cmd (no `/`) → unchanged
//   - renderSkillBody: multiple placeholders rendered in one body
//   - renderSkillBody: unknown capability name → placeholder preserved + warning
//   - renderSkillBody: warnings deduplicated across multiple references

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  readInstalledPlugins,
  renderSkillBody,
  resolveCapabilityCmd,
} from '../../src/cli/lib/capabilityResolver.js'

// Build a throwaway HOME dir with a fake ~/.claude/plugins/installed_plugins.json
// shaped per real CC structure (verified 2026-05-24 on user's machine).
let fakeHome: string

function writePluginsFile(content: string): void {
  const dir = join(fakeHome, '.claude', 'plugins')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'installed_plugins.json'), content, 'utf8')
}

beforeEach(() => {
  fakeHome = mkdtempSync(join(tmpdir(), 'harnessed-cap-resolver-'))
})

afterEach(() => {
  rmSync(fakeHome, { recursive: true, force: true })
})

describe('readInstalledPlugins — installed_plugins.json parsing', () => {
  it('cell 1 — real-shape fixture → namespace Set derived from "<name>@<marketplace>"', () => {
    writePluginsFile(
      JSON.stringify({
        version: 2,
        plugins: {
          'gstack@gstack-dev/marketplace': [{ version: '1.40.0.0' }],
          'superpowers@claude-plugins-official': [{ version: '5.1.0' }],
          'planning-with-files@planning-with-files': [{ version: '2.34.0' }],
        },
      }),
    )
    const ns = readInstalledPlugins(fakeHome)
    expect(ns.has('gstack')).toBe(true)
    expect(ns.has('superpowers')).toBe(true)
    expect(ns.has('planning-with-files')).toBe(true)
    expect(ns.size).toBe(3)
  })

  it('cell 2 — missing file → empty Set (non-blocking defensive)', () => {
    // fakeHome exists but installed_plugins.json never written.
    const ns = readInstalledPlugins(fakeHome)
    expect(ns.size).toBe(0)
  })

  it('cell 3 — malformed JSON → empty Set (catches parse error)', () => {
    writePluginsFile('{ not valid json ')
    const ns = readInstalledPlugins(fakeHome)
    expect(ns.size).toBe(0)
  })

  it('cell 4 — missing `plugins` key → empty Set', () => {
    writePluginsFile(JSON.stringify({ version: 2 }))
    const ns = readInstalledPlugins(fakeHome)
    expect(ns.size).toBe(0)
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
    const ns = readInstalledPlugins(fakeHome)
    expect(ns.has('real')).toBe(true)
    expect(ns.has('noAtSign')).toBe(false)
    expect(ns.size).toBe(1)
  })
})

describe('resolveCapabilityCmd — single capability rendering', () => {
  it('cell 6 — no plugin_namespace → cmd unchanged', () => {
    const r = resolveCapabilityCmd({ cmd: '/some-bare-cmd' }, new Set())
    expect(r.renderedCmd).toBe('/some-bare-cmd')
    expect(r.warning).toBeUndefined()
  })

  it('cell 7 — plugin_namespace + plugin installed → /<ns>:<bareCmd>', () => {
    const r = resolveCapabilityCmd(
      { cmd: '/review', plugin_namespace: 'gstack' },
      new Set(['gstack']),
    )
    expect(r.renderedCmd).toBe('/gstack:review')
    expect(r.warning).toBeUndefined()
  })

  it('cell 8 — plugin_namespace + plugin NOT installed → cmd unchanged + warning', () => {
    const r = resolveCapabilityCmd(
      { cmd: '/review', plugin_namespace: 'gstack' },
      new Set(), // empty — gstack not installed
    )
    expect(r.renderedCmd).toBe('/review')
    expect(r.warning).toBeDefined()
    expect(r.warning).toContain('gstack')
    expect(r.warning).toContain('not installed')
  })

  it('cell 9 — cmd already namespaced (`:` present) → unchanged regardless of plugin_namespace', () => {
    const r = resolveCapabilityCmd(
      { cmd: 'superpowers:test-driven-development', plugin_namespace: 'superpowers' },
      new Set(['superpowers']),
    )
    // No double-prefix: avoid `/superpowers:superpowers:test-driven-development`.
    expect(r.renderedCmd).toBe('superpowers:test-driven-development')
  })

  it('cell 10 — sentinel non-slash cmd (behavioral) → unchanged', () => {
    const r = resolveCapabilityCmd(
      { cmd: '<not-applicable-behavioral>', plugin_namespace: 'irrelevant' },
      new Set(['irrelevant']),
    )
    expect(r.renderedCmd).toBe('<not-applicable-behavioral>')
  })
})

describe('renderSkillBody — full SKILL.md rendering', () => {
  const caps = {
    'gstack-review': { cmd: '/review', plugin_namespace: 'gstack' },
    'gsd-discuss-phase': { cmd: '/gsd-discuss-phase', plugin_namespace: 'gsd' },
    tdd: { cmd: 'superpowers:test-driven-development', plugin_namespace: 'superpowers' },
  }

  it('cell 11 — single placeholder rendered when plugin installed', () => {
    const body = 'Run `{{ capabilities.gstack-review.cmd }}` to verify.'
    const r = renderSkillBody(body, caps, new Set(['gstack']))
    expect(r.body).toBe('Run `/gstack:review` to verify.')
    expect(r.warnings).toEqual([])
  })

  it('cell 12 — multiple placeholders all rendered in one pass', () => {
    const body = 'First `{{ capabilities.gstack-review.cmd }}` then `{{ capabilities.tdd.cmd }}`.'
    const r = renderSkillBody(body, caps, new Set(['gstack', 'superpowers']))
    expect(r.body).toBe('First `/gstack:review` then `superpowers:test-driven-development`.')
  })

  it('cell 13 — unknown capability name preserved verbatim + warning emitted', () => {
    const body = 'Bogus `{{ capabilities.nonexistent.cmd }}` reference.'
    const r = renderSkillBody(body, caps, new Set())
    expect(r.body).toContain('{{ capabilities.nonexistent.cmd }}') // verbatim preserved
    expect(r.warnings).toHaveLength(1)
    expect(r.warnings[0]).toContain('nonexistent')
  })

  it('cell 14 — missing-plugin warning deduplicated across multiple references', () => {
    const body =
      'First `{{ capabilities.gstack-review.cmd }}` and again `{{ capabilities.gstack-review.cmd }}`.'
    const r = renderSkillBody(body, caps, new Set()) // gstack NOT installed
    // Same warning string emitted twice → deduped to 1 entry.
    expect(r.warnings).toHaveLength(1)
    expect(r.warnings[0]).toContain('gstack')
  })

  it('cell 15 — flexible whitespace inside `{{ ... }}` template (forward-compat)', () => {
    const body =
      '`{{capabilities.gstack-review.cmd}}` and `{{    capabilities.gstack-review.cmd    }}`'
    const r = renderSkillBody(body, caps, new Set(['gstack']))
    expect(r.body).toBe('`/gstack:review` and `/gstack:review`')
  })

  it('cell 16 — body without any placeholders returns identical body + zero warnings', () => {
    const body = '## Overview\n\nThis SKILL.md has no `{{ }}` templates whatsoever.\n'
    const r = renderSkillBody(body, caps, new Set())
    expect(r.body).toBe(body)
    expect(r.warnings).toEqual([])
  })
})
