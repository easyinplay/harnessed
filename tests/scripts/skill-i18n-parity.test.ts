// Phase 30 T30.1 — en↔zh-Hans SKILL.md sync-guard structural-parity checker tests.
// TDD red→green. Imports the pure fn from the dep-free .mjs; the .mjs carries a
// hand-written .d.mts so tsc --noEmit resolves the type (scripts/** is in tsconfig
// include with allowJs off) — vitest transforms the .mjs at runtime via esbuild.
//
// Structural parity (translation-invariant only, OPEN-1 = structural parity):
//   1. frontmatter KEY-set identical (values translated, keys are not)
//   2. {{ capabilities.X }} placeholder set exact-equal both directions
//   3. heading LEVEL sequence identical (heading text translated, not compared)
//   4. orphan zh (SKILL.zh-Hans.md with no SKILL.md sibling) = violation
// drift-only: a SKILL.md with NO zh sibling is OK (no must-exist).

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { checkSkillI18nParity } from '../../scripts/check-skill-i18n-parity.mjs'

let tmp = ''

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'skill-i18n-parity-'))
})

afterEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true })
})

/** Create workflows/<slug>/<file> with content; returns the workflows dir. */
function writeSkill(slug: string, file: string, content: string): string {
  const dir = join(tmp, 'workflows', slug)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, file), content, 'utf8')
  return join(tmp, 'workflows')
}

const EN_BASE = `---
name: demo
description: hello
trigger_phrases:
  - "demo"
---

# Demo title

## Section A

| 1 | x | \`{{ capabilities.foo.cmd }}\` | gate |

### Sub A
`

// Structurally-identical zh sibling: same frontmatter keys, same placeholder set,
// same heading level sequence [1,2,3]; prose/heading TEXT translated.
const ZH_PARITY = `---
name: 演示
description: 你好
trigger_phrases:
  - "演示"
---

# 演示标题

## 章节 A

| 1 | x | \`{{ capabilities.foo.cmd }}\` | 门 |

### 子节 A
`

describe('checkSkillI18nParity', () => {
  it('in-parity en/zh pair → ok, no violations', () => {
    const wf = writeSkill('demo', 'SKILL.md', EN_BASE)
    writeFileSync(join(wf, 'demo', 'SKILL.zh-Hans.md'), ZH_PARITY, 'utf8')
    const res = checkSkillI18nParity(wf)
    expect(res.ok).toBe(true)
    expect(res.violations).toEqual([])
  })

  it('en-only (no sibling) → ok (drift-only, no must-exist)', () => {
    const wf = writeSkill('demo', 'SKILL.md', EN_BASE)
    const res = checkSkillI18nParity(wf)
    expect(res.ok).toBe(true)
    expect(res.violations).toEqual([])
  })

  it('extra heading in en (level added) → heading-shape violation', () => {
    const wf = writeSkill('demo', 'SKILL.md', `${EN_BASE}\n#### Deeper\n`)
    writeFileSync(join(wf, 'demo', 'SKILL.zh-Hans.md'), ZH_PARITY, 'utf8')
    const res = checkSkillI18nParity(wf)
    expect(res.ok).toBe(false)
    expect(res.violations.map((v) => v.kind)).toContain('heading-shape')
  })

  it('placeholder dropped in zh → placeholder violation', () => {
    const wf = writeSkill('demo', 'SKILL.md', EN_BASE)
    // zh lacks the {{ capabilities.foo.cmd }} placeholder
    const zhNoPh = ZH_PARITY.replace('`{{ capabilities.foo.cmd }}`', '占位缺失')
    writeFileSync(join(wf, 'demo', 'SKILL.zh-Hans.md'), zhNoPh, 'utf8')
    const res = checkSkillI18nParity(wf)
    expect(res.ok).toBe(false)
    expect(res.violations.map((v) => v.kind)).toContain('placeholder')
  })

  it('frontmatter key mismatch → frontmatter violation', () => {
    const wf = writeSkill('demo', 'SKILL.md', EN_BASE)
    // zh adds an extra top-level key `model:` not present in en
    const zhExtraKey = ZH_PARITY.replace('name: 演示', 'name: 演示\nmodel: opus')
    writeFileSync(join(wf, 'demo', 'SKILL.zh-Hans.md'), zhExtraKey, 'utf8')
    const res = checkSkillI18nParity(wf)
    expect(res.ok).toBe(false)
    expect(res.violations.map((v) => v.kind)).toContain('frontmatter')
  })

  it('orphan zh (no en sibling) → orphan violation', () => {
    const wf = writeSkill('demo', 'SKILL.zh-Hans.md', ZH_PARITY)
    const res = checkSkillI18nParity(wf)
    expect(res.ok).toBe(false)
    expect(res.violations.map((v) => v.kind)).toContain('orphan')
  })

  it('placeholder added only in zh → placeholder violation (both-direction)', () => {
    const wf = writeSkill('demo', 'SKILL.md', EN_BASE)
    const zhExtraPh = ZH_PARITY.replace(
      '`{{ capabilities.foo.cmd }}`',
      '`{{ capabilities.foo.cmd }}` `{{ capabilities.bar.cmd }}`',
    )
    writeFileSync(join(wf, 'demo', 'SKILL.zh-Hans.md'), zhExtraPh, 'utf8')
    const res = checkSkillI18nParity(wf)
    expect(res.ok).toBe(false)
    expect(res.violations.map((v) => v.kind)).toContain('placeholder')
  })
})
