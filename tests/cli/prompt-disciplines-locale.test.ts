// Phase 33 T33.1 — buildDisciplinesSection locale-awareness (TDD).
//
// buildDisciplinesSection(sub, packageRoot, locale=getLocale()) reads each applied
// discipline's rule.description. Phase 33 makes the per-discipline file read
// locale-aware via resolveLocaleYaml: zh-Hans serves `<name>.zh-Hans.yaml` when it
// exists, en (and zh-without-sibling) serve the English base. Fixture packageRoot so
// the test is deterministic and independent of the real bundled workflows/.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildDisciplinesSection } from '../../src/cli/prompt.js'
import { __resetForTests } from '../../src/i18n/index.js'

let root: string

const EN_KARPATHY = `schema_version: harnessed.discipline.v1
discipline: karpathy
enforcement_layer: substrate
auto_enforce: true
rules:
  - id: surgical-changes
    description: Make surgical, minimal-diff changes.
    enforcement: info
    trigger: always-on
    check_method: heuristic
`

const ZH_KARPATHY = `schema_version: harnessed.discipline.v1
discipline: karpathy
enforcement_layer: substrate
auto_enforce: true
rules:
  - id: surgical-changes
    description: 做外科手术式的最小 diff 修改。
    enforcement: info
    trigger: always-on
    check_method: heuristic
`

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'harnessed-disc-locale-'))
  mkdirSync(join(root, 'workflows', 'mytool'), { recursive: true })
  mkdirSync(join(root, 'workflows', 'disciplines'), { recursive: true })
  writeFileSync(
    join(root, 'workflows', 'mytool', 'workflow.yaml'),
    'name: mytool\ndisciplines_applied:\n  - karpathy\n',
    'utf8',
  )
  __resetForTests()
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
  __resetForTests()
})

describe('buildDisciplinesSection — locale-aware discipline file read', () => {
  it('zh-Hans + sibling present → Chinese description surfaced', async () => {
    writeFileSync(join(root, 'workflows', 'disciplines', 'karpathy.yaml'), EN_KARPATHY, 'utf8')
    writeFileSync(
      join(root, 'workflows', 'disciplines', 'karpathy.zh-Hans.yaml'),
      ZH_KARPATHY,
      'utf8',
    )
    const out = await buildDisciplinesSection('mytool', root, 'zh-Hans')
    expect(out).toContain('## Disciplines')
    expect(out).toContain('**karpathy**')
    expect(out).toContain('最小 diff')
    expect(out).not.toContain('surgical, minimal-diff')
  })

  it('en → English base description, never the Chinese sibling', async () => {
    writeFileSync(join(root, 'workflows', 'disciplines', 'karpathy.yaml'), EN_KARPATHY, 'utf8')
    writeFileSync(
      join(root, 'workflows', 'disciplines', 'karpathy.zh-Hans.yaml'),
      ZH_KARPATHY,
      'utf8',
    )
    const out = await buildDisciplinesSection('mytool', root, 'en')
    expect(out).toContain('surgical, minimal-diff')
    expect(out).not.toContain('最小 diff')
  })

  it('zh-Hans + NO sibling → falls back to English base', async () => {
    writeFileSync(join(root, 'workflows', 'disciplines', 'karpathy.yaml'), EN_KARPATHY, 'utf8')
    const out = await buildDisciplinesSection('mytool', root, 'zh-Hans')
    expect(out).toContain('surgical, minimal-diff')
  })
})

// Fix 1 — rules whose `trigger` names `response.target == 'chat'` constrain only the
// conversational reply, never the project files the subagent authors. The renderer
// used to drop `trigger` and present every rule as unconditional. Pure string match
// (no expr-eval): unknown / missing trigger → always-on (fail-soft).
const MIXED_TRIGGERS = `schema_version: harnessed.discipline.v1
discipline: karpathy
enforcement_layer: output
auto_enforce: true
rules:
  - id: always-rule
    description: ALWAYS-MARKER applies everywhere.
    enforcement: info
    trigger: always-on
    check_method: heuristic
  - id: chat-rule
    description: CHAT-MARKER constrains the reply.
    enforcement: info
    trigger: response.target == 'chat'
    check_method: regex
  - id: chat-compound-rule
    description: COMPOUND-MARKER constrains the reply too.
    enforcement: info
    trigger: response.target == 'chat' AND user.requested_emoji == false
    check_method: regex
  - id: opaque-trigger-rule
    description: UNKNOWN-MARKER carries an unrecognised trigger.
    enforcement: info
    trigger: humor_or_idiom_present
    check_method: heuristic
`

describe('buildDisciplinesSection — chat-scope grouping', () => {
  it('chat-scoped rules move under an explicit "chat replies ONLY" sub-block', async () => {
    writeFileSync(join(root, 'workflows', 'disciplines', 'karpathy.yaml'), MIXED_TRIGGERS, 'utf8')
    const out = await buildDisciplinesSection('mytool', root, 'en')
    const marker = out.search(/chat replies ONLY/i)
    expect(marker).toBeGreaterThan(-1)
    expect(out).toMatch(/do NOT constrain the files you write/i)
    expect(out.indexOf('CHAT-MARKER')).toBeGreaterThan(marker)
    expect(out.indexOf('COMPOUND-MARKER')).toBeGreaterThan(marker)
    // always-on + opaque triggers stay in the unscoped block, above the marker
    expect(out.indexOf('ALWAYS-MARKER')).toBeGreaterThan(-1)
    expect(out.indexOf('ALWAYS-MARKER')).toBeLessThan(marker)
    expect(out.indexOf('UNKNOWN-MARKER')).toBeGreaterThan(-1)
    expect(out.indexOf('UNKNOWN-MARKER')).toBeLessThan(marker)
  })

  it('discipline with no chat-scoped rule → no chat sub-block emitted', async () => {
    writeFileSync(join(root, 'workflows', 'disciplines', 'karpathy.yaml'), EN_KARPATHY, 'utf8')
    const out = await buildDisciplinesSection('mytool', root, 'en')
    expect(out).toContain('surgical, minimal-diff')
    expect(out).not.toMatch(/chat replies ONLY/i)
  })
})
