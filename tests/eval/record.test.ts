// 4.32.0 eval Slice C — record a real checkpoint trajectory into a replayable
// trap scenario. Covers redaction (default vs --include-text), reconstruction
// shape, the round-trip invariant (record → replay → PASS by construction),
// and the missing-envelope error path.

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import type { CurrentWorkflowV1Type } from '../../src/checkpoint/schema/currentWorkflow.v1.js'
import {
  buildScenarioFromEnvelope,
  recordScenario,
  redactText,
  scrubSecretShapes,
} from '../../src/eval/record.js'
import { runEvalSuite } from '../../src/eval/runner.js'

const tmpdirs: string[] = []
function freshDir(label: string): string {
  const d = mkdtempSync(join(tmpdir(), `eval-record-${label}-`))
  tmpdirs.push(d)
  return d
}
afterEach(() => {
  for (const d of tmpdirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

/** A realistic verify-phase envelope: two serial subs both done. */
function verifyEnvelope(): CurrentWorkflowV1Type {
  return {
    schemaVersion: 'harnessed.current-workflow.v1',
    phase: 'verify',
    status: 'complete',
    last_checkpoint_path: '/real/user/path/checkpoints/verify.json',
    started_at: '2026-07-15T00:00:00.000Z',
    sub_progress: [
      {
        sub: 'progress',
        status: 'done',
        gate_fired: true,
        mode: 'serial',
        order: 1,
        evidence_status: 'none_declared',
      },
      {
        sub: 'simplify',
        status: 'done',
        gate_fired: true,
        mode: 'serial',
        order: 99,
        evidence_status: 'none_declared',
      },
    ],
  }
}

describe('scrubSecretShapes', () => {
  it('redacts token shapes and secret-named env assignments', () => {
    expect(scrubSecretShapes('GITHUB_TOKEN=ghp_abcdefghijklmnop1234')).toMatch(
      /\[REDACTED-ghp_\]|\[REDACTED-ENV\]/,
    )
    expect(scrubSecretShapes('MY_API_KEY=supersecretvalue123')).toContain('[REDACTED-ENV]')
    expect(scrubSecretShapes('nothing secret here')).toBe('nothing secret here')
  })
})

describe('redactText (default redact, opt-in keep)', () => {
  it('replaces free text with the placeholder by default', () => {
    expect(redactText('sensitive business requirement', '<X>', false)).toBe('<X>')
  })
  it('keeps original text with includeText, but still scrubs secrets', () => {
    expect(redactText('plain text', '<X>', true)).toBe('plain text')
    expect(redactText('token ghp_abcdefghijklmnop1234 leak', '<X>', true)).toContain(
      '[REDACTED-ghp_]',
    )
  })
  it('undefined stays undefined', () => {
    expect(redactText(undefined, '<X>', false)).toBeUndefined()
  })
})

describe('buildScenarioFromEnvelope', () => {
  it('reconstructs skeleton + start(plan) + serial-ordered resolves', () => {
    const s = buildScenarioFromEnvelope(verifyEnvelope())
    expect(s.name).toBe('recorded-verify')
    // steps: 2 file skeleton + start + 2 completes
    const kinds = s.steps.map((st) =>
      'file' in st ? 'file' : 'checkpoint' in st ? st.checkpoint.action : 'gates',
    )
    expect(kinds).toEqual(['file', 'file', 'start', 'complete', 'complete'])
    // start plan preserves mode/order
    const start = s.steps.find((st) => 'checkpoint' in st && st.checkpoint.action === 'start')
    const plan = (start as { checkpoint: { plan: { fire: unknown[] } } }).checkpoint.plan
    expect(plan.fire).toEqual([
      { sub: 'progress', mode: 'serial', order: 1 },
      { sub: 'simplify', mode: 'serial', order: 99 },
    ])
    // completes emitted in serial-valid order (progress order 1 before simplify 99)
    const completes = s.steps.filter(
      (st) => 'checkpoint' in st && st.checkpoint.action === 'complete',
    )
    expect(completes.map((c) => (c as { checkpoint: { sub: string } }).checkpoint.sub)).toEqual([
      'progress',
      'simplify',
    ])
  })

  it('default redacts summary; --include-text keeps it', () => {
    const wf = verifyEnvelope()
    ;(wf.sub_progress?.[0] as { summary_text?: string }).summary_text = 'shipped the widget API'
    const redacted = buildScenarioFromEnvelope(wf)
    const c0 = redacted.steps.find(
      (st) => 'checkpoint' in st && st.checkpoint.action === 'complete',
    )
    expect((c0 as { checkpoint: { summary: string } }).checkpoint.summary).toBe(
      '<SUMMARY-REDACTED>',
    )
    const kept = buildScenarioFromEnvelope(wf, { includeText: true })
    const k0 = kept.steps.find((st) => 'checkpoint' in st && st.checkpoint.action === 'complete')
    expect((k0 as { checkpoint: { summary: string } }).checkpoint.summary).toBe(
      'shipped the widget API',
    )
  })

  it('overridden evidence posture reconstructs a --force complete', () => {
    const wf = verifyEnvelope()
    ;(wf.sub_progress ?? [])[1] = {
      sub: 'simplify',
      status: 'done',
      gate_fired: true,
      mode: 'serial',
      order: 99,
      evidence_status: 'overridden',
    }
    const s = buildScenarioFromEnvelope(wf)
    const forced = s.steps.find(
      (st) =>
        'checkpoint' in st &&
        st.checkpoint.action === 'complete' &&
        st.checkpoint.sub === 'simplify',
    )
    expect((forced as { checkpoint: { force?: boolean } }).checkpoint.force).toBe(true)
    // and a verified sub anywhere annotates the known boundary
    const wf2 = verifyEnvelope()
    ;(wf2.sub_progress ?? [])[0] = {
      sub: 'progress',
      status: 'done',
      gate_fired: true,
      evidence_status: 'verified',
    }
    expect(buildScenarioFromEnvelope(wf2).description).toMatch(/KNOWN BOUNDARY/)
  })

  it('failed subs reconstruct a fail step; skipped subs go to plan.skip', () => {
    const wf = verifyEnvelope()
    wf.sub_progress = [
      { sub: 'progress', status: 'done', gate_fired: true, mode: 'serial', order: 1 },
      { sub: 'qa', status: 'skipped', gate_fired: false, reason: 'gate false' },
      { sub: 'simplify', status: 'failed', gate_fired: true, mode: 'serial', order: 99 },
    ]
    const s = buildScenarioFromEnvelope(wf)
    const actions = s.steps
      .filter((st) => 'checkpoint' in st)
      .map((st) => (st as { checkpoint: { action: string; sub: string } }).checkpoint)
    expect(actions).toContainEqual(expect.objectContaining({ action: 'fail', sub: 'simplify' }))
    const start = actions.find((a) => a.action === 'start')
    const plan = (start as unknown as { plan: { skip: unknown[] } }).plan
    expect(plan.skip).toEqual([{ sub: 'qa', reason: 'gate false' }])
  })
})

describe('recordScenario (disk + errors)', () => {
  it('throws a clear error when the envelope is absent', () => {
    const d = freshDir('empty')
    expect(() => recordScenario(d)).toThrow(/no current-workflow envelope/)
  })
  it('emits parseable, header-commented yaml from a written envelope', () => {
    const d = freshDir('env')
    writeFileSync(join(d, 'current-workflow.json'), JSON.stringify(verifyEnvelope()), 'utf8')
    const { scenarioYaml, scenario } = recordScenario(d)
    expect(scenarioYaml).toMatch(/^# AUTO-RECORDED trap/)
    const reparsed = parseYaml(scenarioYaml)
    expect(reparsed.name).toBe(scenario.name)
    expect(reparsed.steps.length).toBe(scenario.steps.length)
  })
})

describe('round-trip invariant (record → replay → PASS)', () => {
  it('a recorded scenario replays green against its generated golden', async () => {
    // 1. write a real envelope
    const src = freshDir('rt-src')
    writeFileSync(join(src, 'current-workflow.json'), JSON.stringify(verifyEnvelope()), 'utf8')
    // 2. record → scenario yaml into a suite dir
    const suite = freshDir('rt-suite')
    const { scenario, scenarioYaml } = recordScenario(src)
    const scenarioDir = join(suite, scenario.name)
    mkdtempSyncInto(scenarioDir)
    writeFileSync(join(scenarioDir, 'scenario.yaml'), scenarioYaml, 'utf8')
    // 3. generate golden by replay
    const gen = await runEvalSuite(suite, { updateGolden: true, filter: scenario.name })
    expect(gen.results.find((r) => r.name === scenario.name)?.status).toBe('UPDATED')
    // 4. replay again (no update) → must PASS its own golden
    const check = await runEvalSuite(suite, { filter: scenario.name })
    const r = check.results.find((x) => x.name === scenario.name)
    expect(`${r?.status}: ${(r?.detail ?? []).join(' | ')}`).toBe('PASS: ')
  }, 60_000)
})

// mkdirSync via a tiny helper so the round-trip test reads top-to-bottom.
import { mkdirSync } from 'node:fs'

function mkdtempSyncInto(dir: string): void {
  mkdirSync(dir, { recursive: true })
}
