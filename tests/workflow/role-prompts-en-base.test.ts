// tests/workflow/role-prompts-en-base.test.ts — en base purity guard for the
// role prompts.
//
// workflows/role-prompts.yaml is the SoT for every subagent's role definition:
// `responsibility` / `specialist` / `checklist` / `description` are consumed by
// buildAgentDef and land VERBATIM in the spawned agent's prompt. Until 4.34.x it
// still carried Chinese inside those bodies ("karpathy 4 心法 + mattpocock
// conditional招式"), so an English-only user got a role definition with Chinese
// spliced into it. The v10.0 i18n milestone fixed the en-default bug for
// disciplines; role-prompts was the file it missed.
//
// Invariant: the en base is English-only; the Chinese wording lives in the
// `.zh-Hans` sibling. The sibling assertions keep this from being satisfiable by
// deletion — the Chinese has to have MOVED, not vanished.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(__dirname, '..', '..')
const CJK = /[一-鿿]/

function readLines(file: string): string[] {
  return readFileSync(join(ROOT, 'workflows', file), 'utf8').split(/\r?\n/)
}

describe('workflows/role-prompts.yaml — en base is English-only', () => {
  it('no line contains CJK', () => {
    const offenders = readLines('role-prompts.yaml')
      .map((line, i) => ({ n: i + 1, line }))
      .filter((x) => CJK.test(x.line))
      .map((x) => `${x.n}: ${x.line.trim()}`)
    expect(offenders, `CJK in en base role-prompts.yaml:\n${offenders.join('\n')}`).toEqual([])
  })

  it('the zh-Hans sibling still carries the Chinese (moved, not deleted)', () => {
    const zh = readLines('role-prompts.zh-Hans.yaml').join('\n')
    expect(zh).toMatch(CJK)
    // the three body/description sites the en base used to hold
    expect(zh).toContain('心法')
  })
})
