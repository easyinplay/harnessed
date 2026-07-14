// 4.31.2 (issue #7) — SKILL contract assertions for the headless / Agent-Teams
// teardown hardening. The real enforcement is `harnessed gates` suppressing
// escalate_to_teams in headless (tests/cli/gates.test.ts cell 7b); this guards
// the SKILL text that the model reads so the teardown contract + headless note
// are not silently dropped by a future edit. Sister pattern:
// tests/workflow/deferrableRelay.test.ts / severityDiscipline.test.ts.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const WF = join(process.cwd(), 'workflows')
const read = (p: string) => readFileSync(join(WF, p), 'utf8')

describe('auto SKILL — Agent Teams teardown contract + headless note (issue #7)', () => {
  it('en step 4 carries a MUST teardown-in-finally contract', () => {
    const s = read('auto/SKILL.md')
    // teardown must be unconditional (finally), not best-effort
    expect(s).toMatch(/TeamDelete/)
    expect(s).toMatch(/finally|regardless|even if.*max|whether or not/i)
    expect(s).toMatch(/orphan|leak|hang/i)
  })

  it('en step 4 states headless must not spawn teams', () => {
    const s = read('auto/SKILL.md')
    expect(s).toMatch(/headless/i)
    expect(s).toMatch(/session-scoped|-p\b/)
  })

  it('zh mirror carries the same teardown contract + headless note', () => {
    const s = read('auto/SKILL.zh-Hans.md')
    expect(s).toContain('TeamDelete')
    expect(s).toMatch(/收尾前|无论|即使/)
    expect(s).toMatch(/孤儿|挂起|泄漏/)
    expect(s).toContain('headless')
  })
})
