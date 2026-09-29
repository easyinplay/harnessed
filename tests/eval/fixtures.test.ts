// 4.31.0 eval Slice A (T8) — vitest thin shell over the SAME engine: every
// shipped scenario under fixtures/eval must PASS against its committed golden.
// This is the local inner loop (src via vitest transform); CI additionally
// runs `harnessed eval` from dist (OV4 — the production artifact).

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runEvalSuite } from '../../src/eval/runner.js'

describe('fixtures/eval trap suite (thin shell)', () => {
  it('all committed scenarios PASS', async () => {
    const suite = await runEvalSuite(join(process.cwd(), 'fixtures', 'eval'), {})
    expect(suite.results.length).toBeGreaterThanOrEqual(2)
    const notPass = suite.results.filter((r) => r.status !== 'PASS')
    expect(notPass.map((r) => `${r.name}: ${r.status}\n${(r.detail ?? []).join('\n')}`)).toEqual([])
  }, 60_000)

  // v16.0 Phase 65 T13 — the host-render pair's whole value is that the two
  // sides DIFFER. Both PASSing is not enough: if the render chain ever stops
  // consulting the host, both goldens re-record to the same bytes and the pair
  // keeps passing forever while covering nothing. Asserting on the committed
  // files (not on a fresh run) makes this a check on what is in the repo.
  it('the host-render pair renders two different artifacts', () => {
    const read = (name: string): string =>
      readFileSync(join(process.cwd(), 'fixtures', 'eval', name, 'golden.json'), 'utf8')
    const claude = read('host-render-claude')
    const codex = read('host-render-codex')
    expect(claude).not.toBe(codex)
    // Spot-check one term from each of the three render layers, so a diff that
    // survives only because of an unrelated field still fails this.
    expect(claude).toContain('SendMessage') // role-prompt {{ host.send_message }}
    expect(codex).toContain('send_input')
    expect(claude).toContain('Agent(name, run_in_background=true)') // capability cmd
    expect(codex).toContain('spawn_agent(agent_type, message)')
    expect(claude).toContain('Claude Code') // language-section preserve categories
    expect(codex).not.toContain('Claude Code')
  })
})
