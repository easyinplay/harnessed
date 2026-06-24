// Phase 29 T29.2 — renderSkillFile locale-aware body selection + dest single SKILL.md.
//
// Contract added this phase (renderSkillTemplates.ts):
//   renderSkillFile(..., locale?) — picks body via resolveSkillBodyFilename(dir, locale);
//     reads that source, renders {{ capabilities.*.cmd }}, WRITES the rendered result into
//     dest SKILL.md (exact name CC reads), then removes any SKILL.<locale>.md sibling.
//   renderAllSkills(..., locale?) — threads locale to each renderSkillFile.
//
// Landmines under test:
//   2 — zh body written to dest SKILL.md (not back to .zh-Hans.md); sibling removed.
//   3 — en / no-sibling: dest SKILL.md byte-identical, no spurious delete of nonexistent sibling.
//   7 — non-fatal posture: read failure → result.error, no throw.

import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { CapabilityMap } from '../../src/cli/lib/capabilityResolver.js'
import { renderAllSkills, renderSkillFile } from '../../src/cli/lib/renderSkillTemplates.js'
import { __resetForTests } from '../../src/i18n/index.js'

let tmpRoot: string
let savedEnv: Record<string, string | undefined>
const LOCALE_KEYS = ['HARNESSED_LANG', 'LC_ALL', 'LANG', 'LANGUAGE']

const EMPTY_CAPS: CapabilityMap = {}
const NO_PLUGINS = new Set<string>()
const NO_USER_SKILLS = new Set<string>()

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'render-locale-'))
  savedEnv = {}
  for (const k of LOCALE_KEYS) {
    savedEnv[k] = process.env[k]
    delete process.env[k]
  }
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

/** Create skillsBase/<name>/ with optional SKILL.md + SKILL.zh-Hans.md bodies. */
function makeSkill(name: string, bodies: { en?: string; zh?: string }): string {
  const dir = join(tmpRoot, name)
  mkdirSync(dir, { recursive: true })
  if (bodies.en !== undefined) writeFileSync(join(dir, 'SKILL.md'), bodies.en, 'utf8')
  if (bodies.zh !== undefined) writeFileSync(join(dir, 'SKILL.zh-Hans.md'), bodies.zh, 'utf8')
  return dir
}

describe('renderSkillFile — locale body selection', () => {
  it('zh-Hans + sibling → dest SKILL.md == zh body; .zh-Hans.md removed', async () => {
    const dir = makeSkill('demo', { en: 'EN BODY', zh: 'ZH BODY' })
    const r = await renderSkillFile(
      'demo',
      tmpRoot,
      EMPTY_CAPS,
      NO_PLUGINS,
      NO_USER_SKILLS,
      'zh-Hans',
    )
    expect(r.error).toBeUndefined()
    expect(readFileSync(join(dir, 'SKILL.md'), 'utf8')).toBe('ZH BODY')
    expect(existsSync(join(dir, 'SKILL.zh-Hans.md'))).toBe(false)
    expect(r.skillPath).toBe(join(dir, 'SKILL.md'))
  })

  it('en + sibling present → dest SKILL.md byte-identical en body; sibling left untouched', async () => {
    // en MUST NOT consume the zh sibling. (Sibling removal is only for the SELECTED
    // locale path; en path = today's behavior, no zh awareness.)
    const dir = makeSkill('demo', { en: 'EN BODY', zh: 'ZH BODY' })
    const before = readFileSync(join(dir, 'SKILL.md'), 'utf8')
    const r = await renderSkillFile('demo', tmpRoot, EMPTY_CAPS, NO_PLUGINS, NO_USER_SKILLS, 'en')
    expect(r.error).toBeUndefined()
    expect(readFileSync(join(dir, 'SKILL.md'), 'utf8')).toBe(before)
    expect(readFileSync(join(dir, 'SKILL.md'), 'utf8')).toBe('EN BODY')
  })

  it('zh-Hans + NO sibling → falls back to SKILL.md byte-identical; no spurious delete', async () => {
    const dir = makeSkill('demo', { en: 'EN BODY' })
    const before = readFileSync(join(dir, 'SKILL.md'), 'utf8')
    const r = await renderSkillFile(
      'demo',
      tmpRoot,
      EMPTY_CAPS,
      NO_PLUGINS,
      NO_USER_SKILLS,
      'zh-Hans',
    )
    expect(r.error).toBeUndefined()
    expect(readFileSync(join(dir, 'SKILL.md'), 'utf8')).toBe(before)
    expect(existsSync(join(dir, 'SKILL.zh-Hans.md'))).toBe(false)
  })

  it('placeholder render still applied to the SELECTED (zh) body', async () => {
    const caps: CapabilityMap = { foo: { cmd: '/foo' } }
    const dir = makeSkill('demo', {
      en: 'en {{ capabilities.foo.cmd }}',
      zh: 'zh {{ capabilities.foo.cmd }}',
    })
    const r = await renderSkillFile('demo', tmpRoot, caps, NO_PLUGINS, NO_USER_SKILLS, 'zh-Hans')
    expect(r.error).toBeUndefined()
    expect(readFileSync(join(dir, 'SKILL.md'), 'utf8')).toBe('zh /foo')
    expect(existsSync(join(dir, 'SKILL.zh-Hans.md'))).toBe(false)
  })

  it('non-fatal: missing SKILL.md and no sibling → result.error set, no throw', async () => {
    mkdirSync(join(tmpRoot, 'empty'), { recursive: true })
    const r = await renderSkillFile('empty', tmpRoot, EMPTY_CAPS, NO_PLUGINS, NO_USER_SKILLS, 'en')
    expect(r.error).toBeDefined()
    expect(r.rendered).toBe(false)
  })

  it('default locale (no arg) reads getLocale() — HARNESSED_LANG=zh + sibling → zh body', async () => {
    process.env.HARNESSED_LANG = 'zh-CN'
    __resetForTests()
    const dir = makeSkill('demo', { en: 'EN BODY', zh: 'ZH BODY' })
    const r = await renderSkillFile('demo', tmpRoot, EMPTY_CAPS, NO_PLUGINS, NO_USER_SKILLS)
    expect(r.error).toBeUndefined()
    expect(readFileSync(join(dir, 'SKILL.md'), 'utf8')).toBe('ZH BODY')
  })
})

describe('renderAllSkills — threads locale', () => {
  // renderAllSkills loads <workflowsDir>/capabilities.yaml first; without it the
  // function short-circuits to all-skipped. Provide a minimal one so the loop runs.
  function writeCapabilitiesYaml(): void {
    writeFileSync(join(tmpRoot, 'capabilities.yaml'), 'capabilities: {}\n', 'utf8')
  }

  it('zh-Hans threads to each skill → dest SKILL.md carries zh body', async () => {
    writeCapabilitiesYaml()
    makeSkill('a', { en: 'EN-A', zh: 'ZH-A' })
    makeSkill('b', { en: 'EN-B', zh: 'ZH-B' })
    const { results } = await renderAllSkills(['a', 'b'], tmpRoot, tmpRoot, undefined, 'zh-Hans')
    expect(results).toHaveLength(2)
    expect(readFileSync(join(tmpRoot, 'a', 'SKILL.md'), 'utf8')).toBe('ZH-A')
    expect(readFileSync(join(tmpRoot, 'b', 'SKILL.md'), 'utf8')).toBe('ZH-B')
    expect(existsSync(join(tmpRoot, 'a', 'SKILL.zh-Hans.md'))).toBe(false)
  })

  it('en → dest SKILL.md byte-identical en body, zh siblings untouched', async () => {
    writeCapabilitiesYaml()
    makeSkill('a', { en: 'EN-A', zh: 'ZH-A' })
    await renderAllSkills(['a'], tmpRoot, tmpRoot, undefined, 'en')
    expect(readFileSync(join(tmpRoot, 'a', 'SKILL.md'), 'utf8')).toBe('EN-A')
  })
})
