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
//   5. {{ host.* }} PRIMITIVE set exact-equal both directions (v16.0 Phase 65 T12)
// drift-only: a SKILL.md with NO zh sibling is OK (no must-exist).

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { checkSkillI18nParity } from '../../scripts/check-skill-i18n-parity.mjs'
import { collectHostPlaceholders } from '../../src/cli/lib/hostPrimitives.js'

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

Spawn with {{ host.spawn_subagent.default }}, then {{ host.spawn_subagent.plural }}.

### Sub A
`

// Structurally-identical zh sibling: same frontmatter keys, same placeholder set,
// same heading level sequence [1,2,3], same host-primitive SET — note it reaches
// that set through a DIFFERENT variant (`zh_tool`) and a different occurrence
// count, both of which check 5 deliberately ignores; prose/heading TEXT translated.
const ZH_PARITY = `---
name: 演示
description: 你好
trigger_phrases:
  - "演示"
---

# 演示标题

## 章节 A

| 1 | x | \`{{ capabilities.foo.cmd }}\` | 门 |

用 {{ host.spawn_subagent.zh_tool }} spawn。

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

  // ── check 5: {{ host.* }} primitive set (v16.0 Phase 65 T12) ────────────────

  it('a DIFFERENT variant of the same primitive is parity, not drift', () => {
    // EN_BASE uses spawn_subagent.default + .plural; ZH_PARITY uses .zh_tool once.
    // Variant and count both differ; the primitive set does not.
    const wf = writeSkill('demo', 'SKILL.md', EN_BASE)
    writeFileSync(join(wf, 'demo', 'SKILL.zh-Hans.md'), ZH_PARITY, 'utf8')
    expect(checkSkillI18nParity(wf).violations.map((v) => v.kind)).not.toContain('host-primitive')
  })

  it('a primitive dropped in zh → host-primitive violation naming it', () => {
    const wf = writeSkill(
      'demo',
      'SKILL.md',
      EN_BASE.replace('### Sub A', 'Stop every {{ host.teammate }}.\n\n### Sub A'),
    )
    writeFileSync(join(wf, 'demo', 'SKILL.zh-Hans.md'), ZH_PARITY, 'utf8')
    const res = checkSkillI18nParity(wf)
    expect(res.ok).toBe(false)
    const hit = res.violations.find((v) => v.kind === 'host-primitive')
    expect(hit?.detail).toContain('en-only={teammate}')
    expect(hit?.detail).toContain('zh-only={}')
  })

  it('a primitive added only in zh → host-primitive violation (both-direction)', () => {
    const wf = writeSkill('demo', 'SKILL.md', EN_BASE)
    writeFileSync(
      join(wf, 'demo', 'SKILL.zh-Hans.md'),
      ZH_PARITY.replace('### 子节 A', '收尾停掉 {{ host.teammate }}。\n\n### 子节 A'),
      'utf8',
    )
    const res = checkSkillI18nParity(wf)
    expect(res.ok).toBe(false)
    expect(res.violations.find((v) => v.kind === 'host-primitive')?.detail).toContain(
      'zh-only={teammate}',
    )
  })

  it('the bare form and the .default form are the same primitive', () => {
    const wf = writeSkill('demo', 'SKILL.md', EN_BASE)
    writeFileSync(
      join(wf, 'demo', 'SKILL.zh-Hans.md'),
      // `{{ host.spawn_subagent }}` (bare) instead of an explicit variant.
      ZH_PARITY.replace('{{ host.spawn_subagent.zh_tool }}', '{{ host.spawn_subagent }}'),
      'utf8',
    )
    expect(checkSkillI18nParity(wf).violations.map((v) => v.kind)).not.toContain('host-primitive')
  })

  it("the gate's duplicated regex agrees with the renderer's collectHostPlaceholders", () => {
    // The gate is dep-free and cannot import the TypeScript renderer, so the
    // placeholder pattern exists twice. This is the seam that would rot: assert
    // both readers extract the same primitives from the same awkward input.
    const body = [
      '{{host.a}} {{ host.b-c }} {{   host.d_e.f-g   }}',
      '{{ host.h }} and {{ host.h.variant }} are one primitive',
      'not a placeholder: {{ hostile.x }} { host.y } {{ host. }}',
    ].join('\n')
    const wf = writeSkill('demo', 'SKILL.md', `${EN_BASE}\n${body}\n`)
    writeFileSync(join(wf, 'demo', 'SKILL.zh-Hans.md'), ZH_PARITY, 'utf8')
    const detail = checkSkillI18nParity(wf).violations.find(
      (v) => v.kind === 'host-primitive',
    )?.detail
    const fromRenderer = [
      ...new Set([...collectHostPlaceholders(body)].map((k) => k.split('.')[0])),
    ].sort()
    expect(fromRenderer).toEqual(['a', 'b-c', 'd_e', 'h'])
    for (const primitive of fromRenderer) expect(detail).toContain(primitive)
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
