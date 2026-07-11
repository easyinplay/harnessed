// 4.25.0 (intel B3 — comet 0.3.5 uncertainty-downgrade principle, adopted):
// verify-family role prompts must carry the severity discipline — only
// reproducible build failures, test failures, and exploitable security
// vulnerabilities may take the entry's TOP severity; ambiguous or
// judgment-call findings are downgraded, never rounded up. Without this an
// eager reviewer promotes fuzzy findings to blockers (comet shipped the same
// fix after real-world over-blocking).
//
// Pattern per deferrableRelay.test.ts: loadRolePrompts for en, raw+parse for
// the zh mirror; zh assertions via toContain (JS \b breaks after CJK).

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { loadRolePrompts } from '../../src/cli/lib/generateCommands.js'

const PACKAGE_ROOT = process.cwd()
const WORKFLOWS_DIR = join(PACKAGE_ROOT, 'workflows')
const read = (f: string) => readFileSync(join(WORKFLOWS_DIR, f), 'utf8')

const VERIFY_ENTRIES = ['verify-code-review', 'verify-paranoid', 'verify-qa', 'verify-security']

describe('verify-family severity discipline (intel B3, 4.25.0)', () => {
  it('cell 1 — every en verify entry checklist carries the downgrade principle', async () => {
    const prompts = await loadRolePrompts(WORKFLOWS_DIR)
    for (const name of VERIFY_ENTRIES) {
      const joined = (prompts[name]?.checklist ?? []).join('\n')
      expect(joined, name).toMatch(/severity discipline/i)
      expect(joined, name).toMatch(/only reproducible build failures, test failures/i)
      expect(joined, name).toMatch(/never rounded up/i)
    }
  })

  it('cell 2 — zh mirror carries the discipline for all four entries (toContain)', () => {
    const raw = read('role-prompts.zh-Hans.yaml')
    // One shared wording, appended to each of the 4 entries → 4 occurrences.
    const marker = 'Severity 纪律'
    const count = raw.split(marker).length - 1
    expect(count).toBe(4)
    expect(raw).toContain('绝不就高')
    expect(raw).toContain('可复现的 build 失败')
  })

  it('cell 3 — en/zh checklist counts stay equal for each verify entry', () => {
    const en = parse(read('role-prompts.yaml'))
    const zh = parse(read('role-prompts.zh-Hans.yaml'))
    for (const name of VERIFY_ENTRIES) {
      const enList = en?.prompts?.[name]?.checklist ?? []
      const zhList = zh?.prompts?.[name]?.checklist ?? []
      expect(enList.length, name).toBeGreaterThanOrEqual(8)
      expect(enList.length, name).toBe(zhList.length)
    }
  })
})
