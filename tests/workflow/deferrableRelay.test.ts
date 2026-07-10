// 4.23.1 (issue #4) — deferrable relay gate regression guard.
//
// `deferrable` used to be defined only in role-prompts (en/zh) with NO relay
// contract anywhere in workflows/: the plan stage adopted agent-recommended
// defaults the user never saw ("schedule-deferrable" silently promoted to
// "agent decides"). These cells lock the two fixes:
//   D1 relay contract — after locking blocking decisions, the deferrable set
//      is relayed in ONE batched AskUserQuestion (defaults pre-selected);
//   D2 escalation rule — a default that changes the nature of a requirement
//      (testable→structural identity / acceptance method / cross-phase
//      contract shape) or is irreversible must be upgraded to blocking.
//
// Pattern per tests/workflow/rolePromptsMattpocock.test.ts: loadRolePrompts
// for the en yaml, raw readFileSync for the zh mirror + the 4 SKILL.md files.
// zh assertions use toContain (JS \b does not match after CJK — memory rule).

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { loadRolePrompts } from '../../src/cli/lib/generateCommands.js'

const PACKAGE_ROOT = process.cwd()
const WORKFLOWS_DIR = join(PACKAGE_ROOT, 'workflows')

const read = (...segs: string[]) => readFileSync(join(WORKFLOWS_DIR, ...segs), 'utf8')

describe('deferrable relay gate (issue #4, 4.23.1)', () => {
  it('cell 1 — en discuss-phase checklist carries the relay contract', async () => {
    const prompts = await loadRolePrompts(WORKFLOWS_DIR)
    const joined = (prompts['discuss-phase']?.checklist ?? []).join('\n')
    expect(joined).toMatch(/one chance to override/i)
    expect(joined).toMatch(/batched AskUserQuestion/i)
    expect(joined).toMatch(/NOT resolved without the user/i)
  })

  it('cell 2 — en discuss-phase checklist carries the escalation rule', async () => {
    const prompts = await loadRolePrompts(WORKFLOWS_DIR)
    const joined = (prompts['discuss-phase']?.checklist ?? []).join('\n')
    expect(joined).toMatch(/does not change the nature of any requirement/i)
    expect(joined).toMatch(/mark (it )?blocking/i)
    expect(joined).toMatch(/NOT sufficient to defer/i)
    expect(joined).toMatch(/reversible/i)
  })

  it('cell 3 — zh role-prompts mirror carries both rules (toContain, no \\b)', () => {
    const raw = read('role-prompts.zh-Hans.yaml')
    expect(raw).toContain('一次 override 机会')
    expect(raw).toContain('批量 AskUserQuestion')
    expect(raw).toContain('改变任何需求的本质')
    expect(raw).toContain('升格为 blocking')
  })

  it('cell 4 — en/zh discuss-phase checklist item counts stay equal (yaml-i18n-parity)', () => {
    const en = parse(read('role-prompts.yaml'))
    const zh = parse(read('role-prompts.zh-Hans.yaml'))
    const enList = en?.prompts?.['discuss-phase']?.checklist ?? []
    const zhList = zh?.prompts?.['discuss-phase']?.checklist ?? []
    expect(enList.length).toBeGreaterThanOrEqual(9)
    expect(enList.length).toBe(zhList.length)
  })

  it('cell 5 — /auto step 1 relays the deferrable set (en + zh)', () => {
    const en = read('auto', 'SKILL.md')
    expect(en).toMatch(/relay the deferrable set .*single batched AskUserQuestion/i)
    expect(en).toMatch(/defers scheduling, not user authority/i)
    const zh = read('auto', 'SKILL.zh-Hans.md')
    expect(zh).toContain('deferrable 集')
    expect(zh).toContain('单轮批量 AskUserQuestion')
    expect(zh).toContain('推迟的是排期,不是用户决策权')
  })

  it('cell 6 — standalone /discuss hand-off relays the deferrable set (en + zh)', () => {
    const en = read('discuss', 'auto', 'SKILL.md')
    expect(en).toMatch(/relay the deferrable set .*single batched AskUserQuestion/i)
    expect(en).toMatch(/only skip an item if the user explicitly defers it again/i)
    const zh = read('discuss', 'auto', 'SKILL.zh-Hans.md')
    expect(zh).toContain('deferrable 集')
    expect(zh).toContain('单轮批量 AskUserQuestion')
    expect(zh).toContain('用户明确再次推迟')
  })
})
