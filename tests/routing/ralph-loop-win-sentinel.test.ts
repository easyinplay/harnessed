// Phase 2.4 W4 T4.3 — ralph-loop Win sentinel (B-30 MIN 5 fixture + D2.4-18).
// Win-only via `skipIf(process.platform !== 'win32')` — sister Phase 2.3 W0 T0.6
// Provenance Win pwsh sentinel pattern (.github/workflows/ci.yml L100-103).
// Anti-redo Phase 2.3 30-sample per D2.4-19; B-30 mock subagent per O5
// (real CC SDK 需 ANTHROPIC_API_KEY OOS). Karpathy hard limit ≤120L per W6 RESEARCH.
//
// 5 fixture (per B-30 MIN scope):
//   1. simple-complete       — 1 iter, <promise>COMPLETE</promise>, exit 0
//   2. multi-iter            — 3 iter, COMPLETE on iter 3, exit 0
//   3. max-iter-exceeded     — reach maxIter, MaxIterationsExceededError throw
//   4. subagent-spawn        — mock spawn fn, Win bash fork test (Phase 1.1 finding)
//   5. structured_output     — PRIMARY path (envelope w/ structured_output.status=COMPLETE)

import { describe, expect, it } from 'vitest'
import { MaxIterationsExceededError, ralphLoopWrap } from '../../src/routing/lib/ralphLoop.js'

const skipIfNotWin = process.platform !== 'win32'

describe('ralph-loop Win sentinel (Phase 2.4 W4 T4.3 — 5 fixture per B-30)', () => {
  it.skipIf(skipIfNotWin)(
    'fixture 1: simple-complete — 1 iter <promise>COMPLETE</promise> exit 0',
    async () => {
      let calls = 0
      const spawn = async () => {
        calls++
        return '<promise>COMPLETE</promise>'
      }
      const out = await ralphLoopWrap(spawn, 5)
      expect(out).toBe('<promise>COMPLETE</promise>')
      expect(calls).toBe(1) // single iter — no retry
    },
  )

  it.skipIf(skipIfNotWin)(
    'fixture 2: multi-iter — 3 iter, COMPLETE on iter 3, exit 0',
    async () => {
      let calls = 0
      const spawn = async () => {
        calls++
        return calls < 3 ? 'still working' : '<promise>COMPLETE</promise>'
      }
      const out = await ralphLoopWrap(spawn, 5)
      expect(calls).toBe(3)
      expect(out).toBe('<promise>COMPLETE</promise>')
    },
  )

  it.skipIf(skipIfNotWin)(
    'fixture 3: max-iter-exceeded — never COMPLETE, throws MaxIterationsExceededError',
    async () => {
      let calls = 0
      const spawn = async () => {
        calls++
        return 'never complete'
      }
      await expect(ralphLoopWrap(spawn, 3)).rejects.toBeInstanceOf(MaxIterationsExceededError)
      expect(calls).toBe(3) // hit max iter exactly
    },
  )

  it.skipIf(skipIfNotWin)(
    'fixture 4: subagent-spawn — mock spawn fn returns COMPLETE (Win bash fork sentinel per Phase 1.1 finding)',
    async () => {
      // O5 mock subagent: real CC SDK 需 ANTHROPIC_API_KEY OOS. Here we verify the
      // ralph-loop wrapper handles Win bash fork timing correctly — spawn fn returns
      // synchronously-resolved Promise (the actual Win-fork concern is in sdkSpawn
      // child_process call, not ralph-loop itself; this sentinel verifies the wrapper
      // contract holds under Win event loop scheduling).
      const spawn = async (resumeSessionId?: string) => {
        // resumeSessionId propagation smoke (CD-4 wedge per Phase 2.2 W4 ship)
        return JSON.stringify({
          subtype: 'success',
          text: `iter w/ resume=${resumeSessionId ?? 'none'}\n<promise>COMPLETE</promise>`,
        })
      }
      const out = await ralphLoopWrap(spawn, 5)
      const env = JSON.parse(out) as { subtype: string; text: string }
      expect(env.subtype).toBe('success')
      expect(env.text).toContain('<promise>COMPLETE</promise>')
    },
  )

  it.skipIf(skipIfNotWin)(
    'fixture 5: structured_output — PRIMARY path (envelope w/ structured_output.status=COMPLETE)',
    async () => {
      let calls = 0
      const spawn = async () => {
        calls++
        return JSON.stringify({
          subtype: 'success',
          structured_output: { status: 'COMPLETE', phase: '04-deliver' },
        })
      }
      const out = await ralphLoopWrap(spawn, 5)
      expect(calls).toBe(1) // PRIMARY signal hits on first iter
      const env = JSON.parse(out) as {
        structured_output: { status: string; phase: string }
      }
      expect(env.structured_output.status).toBe('COMPLETE')
      expect(env.structured_output.phase).toBe('04-deliver')
    },
  )
})

// On non-Win CI, the 5 fixtures are skipped (skipIf). The CI Win-only step
// `ralph-loop Win sentinel` (.github/workflows/ci.yml Phase 2.4 W4) invokes
// this test file directly on the Windows matrix runner via shell:bash per
// B-04 (doctor.ts verified Git Bash path; pwsh sister for provenance only).
describe('ralph-loop Win sentinel — sanity (non-Win runs)', () => {
  it.skipIf(!skipIfNotWin)('non-Win platform: 5 fixtures correctly skipped', () => {
    expect(skipIfNotWin).toBe(true)
  })
})
