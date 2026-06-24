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
