// Phase 24 Wave 1 (TDD) — zero-arg `harnessed` you-are-here entry (comet `/comet`
// analog). Unit-covers the pure aggregation surface in src/cli/lib/here.ts:
//   - parseBareInvocation (7 argv shapes — D3 explicit detection, no misfire)
//   - buildHereView (null → onboarding {active:false}; populated → phase + markers
//     + NEXT line; allDone → NEXT: done)
// buildHereView is pure over injected wf/ledger; a no-evidence ledger never touches
// fs (buildRecoverLines.detectDrift only fires when an entry carries evidence).

import { describe, expect, it } from 'vitest'
import type { SubProgressEntryType } from '../../src/checkpoint/schema/currentWorkflow.v1.js'
import { buildHereView, parseBareInvocation } from '../../src/cli/lib/here.js'

const wf = {
  phase: 'phase-24',
  status: 'active',
  started_at: '2026-06-23T10:00:00.000Z',
}

const pendingLedger: SubProgressEntryType[] = [
  { sub: 'discuss', status: 'done', gate_fired: true },
  { sub: 'plan', status: 'pending', gate_fired: true },
]
const allDoneLedger: SubProgressEntryType[] = [{ sub: 'discuss', status: 'done', gate_fired: true }]

describe('parseBareInvocation (D3 explicit bare-invocation detection)', () => {
  it('[] → here human', () => {
    expect(parseBareInvocation([])).toEqual({ here: true, json: false })
  })
  it("['--json'] → here json", () => {
    expect(parseBareInvocation(['--json'])).toEqual({ here: true, json: true })
  })
  it('strips --lang <code> / --lang=<code> before deciding', () => {
    expect(parseBareInvocation(['--lang', 'zh'])).toEqual({ here: true, json: false })
    expect(parseBareInvocation(['--lang=zh'])).toEqual({ here: true, json: false })
    expect(parseBareInvocation(['--lang', 'zh', '--json'])).toEqual({ here: true, json: true })
  })
  it('subcommand / --help / --version / unknown → not here (falls to program.parse)', () => {
    expect(parseBareInvocation(['status'])).toEqual({ here: false, json: false })
    expect(parseBareInvocation(['bogus'])).toEqual({ here: false, json: false })
    expect(parseBareInvocation(['--help'])).toEqual({ here: false, json: false })
    expect(parseBareInvocation(['--version'])).toEqual({ here: false, json: false })
  })
  it("['--json','extra'] → not here (multi-token is not bare)", () => {
    expect(parseBareInvocation(['--json', 'extra'])).toEqual({ here: false, json: false })
  })
})

describe('buildHereView', () => {
  it('null wf → onboarding lines + json {active:false}', async () => {
    const view = await buildHereView(null, [], true)
    expect(view.lines.length).toBeGreaterThan(0)
    expect(view.lines.join('\n')).not.toBe('')
    expect(view.json.active).toBe(false)
  })

  it('populated wf+ledger → phase + ← next marker + NEXT line; json carries phase/status/next/sub', async () => {
    const view = await buildHereView(wf, pendingLedger, false)
    const joined = view.lines.join('\n')
    expect(joined).toContain('phase-24')
    expect(joined).toContain('← next')
    const nextLine = view.lines.find((l) => l.startsWith('NEXT:'))
    expect(nextLine).toBeDefined()
    expect(['NEXT: auto', 'NEXT: manual', 'NEXT: done']).toContain(nextLine)
    expect(view.json.active).toBe(true)
    expect(view.json.phase).toBe('phase-24')
    expect(view.json.status).toBe('active')
    expect(view.json.next).toBeDefined()
    expect(view.json.sub).toBeDefined()
  })

  it('all-done ledger → NEXT: done; json.next === done', async () => {
    const view = await buildHereView(wf, allDoneLedger, true)
    expect(view.lines.some((l) => l === 'NEXT: done')).toBe(true)
    expect(view.json.next).toBe('done')
  })
})
