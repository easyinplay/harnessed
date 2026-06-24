// Phase 29 T29.1 — resolveSkillBody helper unit fixtures (locale-aware body pick).
//
// Contract under test (src/cli/lib/resolveSkillBody.ts — NEW):
//   skillBodyFilename(locale)         — pure: zh-Hans → 'SKILL.zh-Hans.md', else 'SKILL.md'.
//   resolveSkillBodyFilename(dir, l?) — locale defaults getLocale(); returns the locale
//                                       sibling name ONLY when it exists on disk, else
//                                       'SKILL.md' (graceful fallback). en → always SKILL.md.
//
// Landmine 1 (findings): must call getLocale() from i18n — NOT re-implement mapToSupported.
// Landmine 4: no real .zh-Hans.md exists in repo yet → test against tmp-dir fixtures.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resolveSkillBodyFilename, skillBodyFilename } from '../../src/cli/lib/resolveSkillBody.js'
import { __resetForTests } from '../../src/i18n/index.js'

let tmpRoot: string
let savedLang: string | undefined
let savedLcAll: string | undefined
let savedLangE: string | undefined
let savedLanguage: string | undefined

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'resolve-body-'))
  // Snapshot every locale-driving env var so detectLocale() is deterministic.
  savedLang = process.env.HARNESSED_LANG
  savedLcAll = process.env.LC_ALL
  savedLangE = process.env.LANG
  savedLanguage = process.env.LANGUAGE
  delete process.env.HARNESSED_LANG
  delete process.env.LC_ALL
  delete process.env.LANG
  delete process.env.LANGUAGE
  __resetForTests()
})

afterEach(() => {
  rmSync(tmpRoot, { recursive: true, force: true })
  const restore = (k: string, v: string | undefined): void => {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
  restore('HARNESSED_LANG', savedLang)
  restore('LC_ALL', savedLcAll)
  restore('LANG', savedLangE)
  restore('LANGUAGE', savedLanguage)
  __resetForTests()
})

function makeSkillDir(opts: { skill?: boolean; zh?: boolean }): string {
  const dir = join(tmpRoot, 'skill')
  mkdirSync(dir, { recursive: true })
  if (opts.skill !== false) writeFileSync(join(dir, 'SKILL.md'), 'en body', 'utf8')
  if (opts.zh) writeFileSync(join(dir, 'SKILL.zh-Hans.md'), 'zh body', 'utf8')
  return dir
}

describe('skillBodyFilename (pure)', () => {
  it('zh-Hans → SKILL.zh-Hans.md', () => {
    expect(skillBodyFilename('zh-Hans')).toBe('SKILL.zh-Hans.md')
  })
  it('en → SKILL.md', () => {
    expect(skillBodyFilename('en')).toBe('SKILL.md')
  })
})

describe('resolveSkillBodyFilename (existence-checked)', () => {
  it('en locale → SKILL.md even if zh sibling exists', () => {
    const dir = makeSkillDir({ zh: true })
    expect(resolveSkillBodyFilename(dir, 'en')).toBe('SKILL.md')
  })

  it('zh-Hans + sibling present → SKILL.zh-Hans.md', () => {
    const dir = makeSkillDir({ zh: true })
    expect(resolveSkillBodyFilename(dir, 'zh-Hans')).toBe('SKILL.zh-Hans.md')
  })

  it('zh-Hans + no sibling → graceful fallback to SKILL.md', () => {
    const dir = makeSkillDir({ zh: false })
    expect(resolveSkillBodyFilename(dir, 'zh-Hans')).toBe('SKILL.md')
  })

  it('default (no explicit locale) reads getLocale() — HARNESSED_LANG=zh + sibling → zh', () => {
    process.env.HARNESSED_LANG = 'zh-CN'
    __resetForTests()
    const dir = makeSkillDir({ zh: true })
    expect(resolveSkillBodyFilename(dir)).toBe('SKILL.zh-Hans.md')
  })

  it('default (no explicit locale) en env → SKILL.md', () => {
    process.env.HARNESSED_LANG = 'en-US'
    __resetForTests()
    const dir = makeSkillDir({ zh: true })
    expect(resolveSkillBodyFilename(dir)).toBe('SKILL.md')
  })
})
