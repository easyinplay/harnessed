// v16.0 Phase 65 T3 — `{{ host.* }}` rendering wired into the install path.
//
// T2 built the mechanism (src/cli/lib/hostPrimitives.ts). This file locks how
// renderSkillTemplates.ts CONSUMES it — the contract the install path depends on:
//
//   1. Substitution ORDER is capabilities → host, never the reverse.
//   2. Consequence of (1): a `{{ capabilities.* }}` string sitting inside a host
//      TABLE VALUE is inert. The host pass is the last pass; nothing re-scans its
//      output. (Guards against an accidental render-until-fixpoint loop.)
//   3. The active host comes from the platform descriptor id, narrowed by
//      `toHostId`. `PlatformDescriptor['id']` is a 6-member union but only
//      claude / codex have descriptors, so every other id renders AS claude.
//   4. The yaml table is loaded ONCE per renderAllSkills run, not once per skill.
//   5. A throwing host render stays non-fatal per-skill (result.error), carries
//      the offending skill + path, and leaves the dest file UNWRITTEN rather than
//      persisting a half-rendered body.
//   6. Locale flows from the already-resolved renderAllSkills locale — the zh-Hans
//      table sibling is picked without re-detecting the locale.

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CapabilityMap } from '../../src/cli/lib/capabilityResolver.js'
import { loadHostPrimitives, toHostId } from '../../src/cli/lib/hostPrimitives.js'
import { renderAllSkills, renderSkillFile } from '../../src/cli/lib/renderSkillTemplates.js'
import { __resetForTests } from '../../src/i18n/index.js'

// Spy WITHOUT replacing behavior: spreading the original keeps every export real
// (a factory that enumerates exports by hand rots the moment T4+ adds one).
vi.mock('../../src/cli/lib/hostPrimitives.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/cli/lib/hostPrimitives.js')>()
  return { ...actual, loadHostPrimitives: vi.fn(actual.loadHostPrimitives) }
})

let tmpRoot: string
let savedEnv: Record<string, string | undefined>
const LOCALE_KEYS = ['HARNESSED_LANG', 'LC_ALL', 'LANG', 'LANGUAGE']

const NO_PLUGINS = new Set<string>()
const NO_USER_SKILLS = new Set<string>()
const CAPS: CapabilityMap = { foo: { cmd: '/foo' } }

/** en table: one plain primitive + one whose VALUE looks like a capability ref. */
const HOST_YAML_EN = [
  'version: 1',
  'primitives:',
  '  spawn:',
  '    default:',
  '      claude: "Task tool"',
  '      codex: "spawn_agent tool"',
  '  nested:',
  '    default:',
  '      claude: "{{ capabilities.foo.cmd }}"',
  '      codex: "{{ capabilities.foo.cmd }}"',
  '',
].join('\n')

const HOST_YAML_ZH = HOST_YAML_EN.replaceAll('Task tool', 'Task 工具').replaceAll(
  'spawn_agent tool',
  'spawn_agent 工具',
)

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'render-host-'))
  savedEnv = {}
  for (const k of LOCALE_KEYS) {
    savedEnv[k] = process.env[k]
    delete process.env[k]
  }
  vi.mocked(loadHostPrimitives).mockClear()
  __resetForTests()
})

afterEach(() => {
  rmSync(tmpRoot, { recursive: true, force: true })
  for (const k of LOCALE_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k]
    else process.env[k] = savedEnv[k]
  }
  __resetForTests()
})

/** Write the workflowsDir surface renderAllSkills reads (tmpRoot doubles as both). */
function writeWorkflowSurface(opts: { zhSibling?: boolean } = {}): void {
  writeFileSync(join(tmpRoot, 'capabilities.yaml'), 'capabilities:\n  foo:\n    cmd: "/foo"\n')
  writeFileSync(join(tmpRoot, 'host-primitives.yaml'), HOST_YAML_EN, 'utf8')
  if (opts.zhSibling) {
    writeFileSync(join(tmpRoot, 'host-primitives.zh-Hans.yaml'), HOST_YAML_ZH, 'utf8')
  }
}

/** Create skillsBase/<name>/ with optional SKILL.md + SKILL.zh-Hans.md bodies. */
function makeSkill(name: string, bodies: { en?: string; zh?: string }): string {
  const dir = join(tmpRoot, name)
  mkdirSync(dir, { recursive: true })
  if (bodies.en !== undefined) writeFileSync(join(dir, 'SKILL.md'), bodies.en, 'utf8')
  if (bodies.zh !== undefined) writeFileSync(join(dir, 'SKILL.zh-Hans.md'), bodies.zh, 'utf8')
  return dir
}

const read = (name: string) => readFileSync(join(tmpRoot, name, 'SKILL.md'), 'utf8')

describe('toHostId — descriptor id → table column', () => {
  it('claude / codex map to themselves', () => {
    expect(toHostId('claude')).toBe('claude')
    expect(toHostId('codex')).toBe('codex')
  })

  it('every id WITHOUT a descriptor implementation falls back to claude', () => {
    // src/platform/platform.ts implements only claudeDescriptor + codexDescriptor,
    // and `setup --platform` accepts only those two. The remaining union members
    // are reserved names; rendering them AS claude matches detectPlatform's own
    // level-5 incumbent fallback rather than inventing a third behavior.
    for (const id of ['agents', 'cursor', 'gemini', 'copilot'] as const) {
      expect(toHostId(id)).toBe('claude')
    }
  })
})

describe('renderSkillFile — host pass runs AFTER the capability pass', () => {
  it('renders both families in one pass over the body', async () => {
    writeWorkflowSurface()
    makeSkill('demo', { en: '{{ capabilities.foo.cmd }} | {{ host.spawn }}' })
    const r = await renderSkillFile('demo', tmpRoot, CAPS, NO_PLUGINS, NO_USER_SKILLS, 'en', {
      host: 'claude',
      table: await loadHostPrimitives({ workflowsDir: tmpRoot, locale: 'en' }),
    })
    expect(r.error).toBeUndefined()
    expect(r.rendered).toBe(true)
    expect(read('demo')).toBe('/foo | Task tool')
  })

  it('a `{{ capabilities.* }}` string INSIDE a host table value is left inert', async () => {
    // Order proof: if host ran first (or the renderer looped to a fixpoint) the
    // injected `{{ capabilities.foo.cmd }}` would come back as `/foo`.
    writeWorkflowSurface()
    makeSkill('demo', { en: '[{{ host.nested }}]' })
    const r = await renderSkillFile('demo', tmpRoot, CAPS, NO_PLUGINS, NO_USER_SKILLS, 'en', {
      host: 'claude',
      table: await loadHostPrimitives({ workflowsDir: tmpRoot, locale: 'en' }),
    })
    expect(r.error).toBeUndefined()
    expect(read('demo')).toBe('[{{ capabilities.foo.cmd }}]')
    expect(read('demo')).not.toContain('/foo')
  })

  it('omitting the host argument keeps the pre-Phase-65 behavior byte-identical', async () => {
    writeWorkflowSurface()
    makeSkill('demo', { en: 'plain {{ host.spawn }} body' })
    const r = await renderSkillFile('demo', tmpRoot, CAPS, NO_PLUGINS, NO_USER_SKILLS, 'en')
    expect(r.error).toBeUndefined()
    expect(read('demo')).toBe('plain {{ host.spawn }} body')
  })
})

describe('renderSkillFile — host render failure is non-fatal and located', () => {
  it('unknown primitive → result.error names the skill and the source path; no throw', async () => {
    writeWorkflowSurface()
    makeSkill('demo', { en: 'x\ny {{ host.nope }}' })
    const table = await loadHostPrimitives({ workflowsDir: tmpRoot, locale: 'en' })
    const r = await renderSkillFile('demo', tmpRoot, CAPS, NO_PLUGINS, NO_USER_SKILLS, 'en', {
      host: 'claude',
      table,
    })
    expect(r.error).toBeDefined()
    expect(r.error).toContain('demo')
    expect(r.error).toContain('SKILL.md')
    expect(r.error).toContain('host.nope')
    expect(r.rendered).toBe(false)
  })

  it('a failed host render does NOT persist a half-rendered body', async () => {
    writeWorkflowSurface()
    // Both families present: the capability pass succeeds, the host pass throws.
    // The capability substitution must NOT reach disk on its own.
    makeSkill('demo', { en: '{{ capabilities.foo.cmd }} {{ host.nope }}' })
    const table = await loadHostPrimitives({ workflowsDir: tmpRoot, locale: 'en' })
    await renderSkillFile('demo', tmpRoot, CAPS, NO_PLUGINS, NO_USER_SKILLS, 'en', {
      host: 'claude',
      table,
    })
    expect(read('demo')).toBe('{{ capabilities.foo.cmd }} {{ host.nope }}')
  })

  it('renderAllSkills surfaces the failure as an aggregated warning, other skills still render', async () => {
    writeWorkflowSurface()
    makeSkill('bad', { en: '{{ host.nope }}' })
    makeSkill('good', { en: '{{ host.spawn }}' })
    const { results, aggregatedWarnings } = await renderAllSkills(
      ['bad', 'good'],
      tmpRoot,
      tmpRoot,
      tmpRoot,
      'en',
      'claude',
    )
    expect(results.find((r) => r.name === 'bad')?.error).toContain('host.nope')
    expect(aggregatedWarnings.some((w) => w.includes('bad') && w.includes('host.nope'))).toBe(true)
    expect(read('good')).toBe('Task tool')
  })
})

describe('renderAllSkills — host selection + single table load', () => {
  it('host=claude and host=codex render different columns from one source body', async () => {
    writeWorkflowSurface()
    makeSkill('a', { en: '{{ host.spawn }}' })
    await renderAllSkills(['a'], tmpRoot, tmpRoot, tmpRoot, 'en', 'claude')
    expect(read('a')).toBe('Task tool')

    makeSkill('a', { en: '{{ host.spawn }}' }) // reset the source body
    await renderAllSkills(['a'], tmpRoot, tmpRoot, tmpRoot, 'en', 'codex')
    expect(read('a')).toBe('spawn_agent tool')
  })

  it('a descriptor id with no implementation renders the claude column', async () => {
    writeWorkflowSurface()
    makeSkill('a', { en: '{{ host.spawn }}' })
    await renderAllSkills(['a'], tmpRoot, tmpRoot, tmpRoot, 'en', 'gemini')
    expect(read('a')).toBe('Task tool')
  })

  it('loads host-primitives.yaml ONCE for the whole run, not once per skill', async () => {
    writeWorkflowSurface()
    for (const n of ['a', 'b', 'c']) makeSkill(n, { en: '{{ host.spawn }}' })
    await renderAllSkills(['a', 'b', 'c'], tmpRoot, tmpRoot, tmpRoot, 'en', 'claude')
    expect(vi.mocked(loadHostPrimitives)).toHaveBeenCalledTimes(1)
  })

  it('uses the run locale for the table (zh-Hans sibling), without re-detecting it', async () => {
    writeWorkflowSurface({ zhSibling: true })
    makeSkill('a', { en: 'en {{ host.spawn }}', zh: 'zh {{ host.spawn }}' })
    await renderAllSkills(['a'], tmpRoot, tmpRoot, tmpRoot, 'zh-Hans', 'claude')
    expect(read('a')).toBe('zh Task 工具')
    expect(vi.mocked(loadHostPrimitives).mock.calls[0]?.[0]?.locale).toBe('zh-Hans')
  })

  it('a body with no host placeholders is untouched by the host pass', async () => {
    writeWorkflowSurface()
    makeSkill('a', { en: 'EN-A' })
    await renderAllSkills(['a'], tmpRoot, tmpRoot, tmpRoot, 'en', 'claude')
    expect(read('a')).toBe('EN-A')
  })
})
