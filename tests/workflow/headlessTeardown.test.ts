// 4.31.2 (issue #7) — SKILL contract assertions for the headless / Agent-Teams
// teardown hardening. The real enforcement is `harnessed gates` suppressing
// escalate_to_teams in headless (tests/cli/gates.test.ts cell 7b); this guards
// the SKILL text that the model reads so the teardown contract + headless note
// are not silently dropped by a future edit. Sister pattern:
// tests/workflow/deferrableRelay.test.ts / severityDiscipline.test.ts.
//
// T2.4 — the teardown contract was re-anchored on the CC v2.1.178+ API (`TeamDelete` was
// deleted upstream; teardown is now a BY-NAME shutdown request + automatic session-exit
// cleanup). The dead-tool literal is pinned absent by tests/workflow/agentTeamsApiMigration.test.ts;
// this file keeps asserting that the contract itself stayed unconditional.

import { describe, expect, it } from 'vitest'
import { readRenderedSkill } from '../helpers/renderedSkill.js'

// v16.0 Phase 65 — step 4 and its teardown bullets now live in
// `workflows/host-primitives.yaml` behind `{{ host.teams_step_note.skill }}` /
// `{{ host.teams_teardown_note }}`. Assert the CLAUDE-RENDERED body (what the
// model receives) rather than the raw source: same contract, one indirection
// later, and the render itself becomes part of what is guarded.
const read = (p: string) => readRenderedSkill(p.split('/'))

describe('auto SKILL — Agent Teams teardown contract + headless note (issue #7)', () => {
  it('en step 4 carries a MUST teardown-in-finally contract', () => {
    const s = read('auto/SKILL.md')
    // teardown must be unconditional (finally), not best-effort
    expect(s).toMatch(/shut down/i)
    expect(s).toMatch(/by name/i)
    expect(s).not.toMatch(/TeamDelete/)
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
    expect(s).toMatch(/按名/)
    expect(s).not.toContain('TeamDelete')
    expect(s).toMatch(/收尾前|无论|即使/)
    expect(s).toMatch(/孤儿|挂起|泄漏/)
    expect(s).toContain('headless')
  })
})
