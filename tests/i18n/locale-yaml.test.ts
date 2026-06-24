// Phase 33 T33.1 — resolveLocaleYaml path-selection unit tests (TDD).
//
// resolveLocaleYaml(dir, baseName, locale=getLocale()) is the single locale-aware
// yaml picker shared by loadRolePrompts (role-prompts.yaml) + buildDisciplinesSection
// (disciplines/<name>.yaml). Policy:
//   - en → ALWAYS the base `<baseName>.yaml` (en is the source-of-truth base; no en sibling)
//   - non-en → `<baseName>.<locale>.yaml` if it exists, else fall back to the base
// Mirrors the Phase 29 SKILL.md sibling pick + messages/{en,zh-Hans}.json pattern.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { __resetForTests } from '../../src/i18n/index.js'
import { resolveLocaleYaml } from '../../src/i18n/localeYaml.js'

let dir: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'harnessed-localeyaml-'))
  mkdirSync(dir, { recursive: true })
  __resetForTests()
})

afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
  delete process.env.HARNESSED_LANG
  __resetForTests()
})

describe('resolveLocaleYaml — explicit locale', () => {
  it('en → base path even when a zh-Hans sibling exists', () => {
    writeFileSync(join(dir, 'role-prompts.yaml'), 'x: base\n', 'utf8')
    writeFileSync(join(dir, 'role-prompts.zh-Hans.yaml'), 'x: zh\n', 'utf8')
    expect(resolveLocaleYaml(dir, 'role-prompts', 'en')).toBe(join(dir, 'role-prompts.yaml'))
  })

  it('zh-Hans + sibling exists → sibling path', () => {
    writeFileSync(join(dir, 'karpathy.yaml'), 'x: base\n', 'utf8')
    writeFileSync(join(dir, 'karpathy.zh-Hans.yaml'), 'x: zh\n', 'utf8')
    expect(resolveLocaleYaml(dir, 'karpathy', 'zh-Hans')).toBe(join(dir, 'karpathy.zh-Hans.yaml'))
  })

  it('zh-Hans + NO sibling → base path (drift-only fallback)', () => {
    writeFileSync(join(dir, 'karpathy.yaml'), 'x: base\n', 'utf8')
    expect(resolveLocaleYaml(dir, 'karpathy', 'zh-Hans')).toBe(join(dir, 'karpathy.yaml'))
  })
})

describe('resolveLocaleYaml — default locale from getLocale()', () => {
  it('HARNESSED_LANG=zh-Hans + sibling present → sibling (no explicit locale arg)', () => {
    writeFileSync(join(dir, 'role-prompts.yaml'), 'x: base\n', 'utf8')
    writeFileSync(join(dir, 'role-prompts.zh-Hans.yaml'), 'x: zh\n', 'utf8')
    process.env.HARNESSED_LANG = 'zh-Hans'
    __resetForTests()
    expect(resolveLocaleYaml(dir, 'role-prompts')).toBe(join(dir, 'role-prompts.zh-Hans.yaml'))
  })

  it('HARNESSED_LANG=en → base (no explicit locale arg)', () => {
    writeFileSync(join(dir, 'role-prompts.yaml'), 'x: base\n', 'utf8')
    writeFileSync(join(dir, 'role-prompts.zh-Hans.yaml'), 'x: zh\n', 'utf8')
    process.env.HARNESSED_LANG = 'en'
    __resetForTests()
    expect(resolveLocaleYaml(dir, 'role-prompts')).toBe(join(dir, 'role-prompts.yaml'))
  })
})
