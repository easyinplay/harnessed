// T2.7 D-3 — no-progress (plateau) damping. Pure unit tests, RED first.
//
// ECC论据 B (`skills/loop-design-check/SKILL.md:87-89`): "Negative feedback with no
// damping oscillates (the Ralph-Wiggum loop: spinning in place, burning tokens)".
// harnessed had ONE stopping reason on the live path (BREAK-LOOP at fail_count >= 3,
// advisory). This adds the plateau reason.
//
// OQ2 裁决 = two metrics, NO self-reported progress field:
//   (ii) failing-test count (preferred, semantically exact — needs a measurement)
//   (i)  evidence-artifact digest (fallback, works with zero extra input)
// (iii) "let the subagent report a progress field" is explicitly NOT adopted — that is
// self-assessment, the exact trap ECC names at gan-style-harness/SKILL.md:15-17.

import { describe, expect, it } from 'vitest'
import {
  evidenceDigest,
  isPlateaued,
  PLATEAU_THRESHOLD,
  type ProgressMark,
  sampleProgress,
} from '../../src/checkpoint/progress.js'

const ref = (sha: string, path = 'tdd-evidence.md') => ({ path, sha256: sha })

describe('evidenceDigest', () => {
  it('is empty for no evidence (metric unavailable → no damping)', () => {
    expect(evidenceDigest([])).toBe('')
  })

  it('is stable under ordering (the guard hashes a set, not a sequence)', () => {
    const a = evidenceDigest([ref('aaaaaaaaaaaaaaaa'), ref('bbbbbbbbbbbbbbbb', 'x.md')])
    const b = evidenceDigest([ref('bbbbbbbbbbbbbbbb', 'x.md'), ref('aaaaaaaaaaaaaaaa')])
    expect(a).toBe(b)
    expect(a).not.toBe('')
  })

  it('changes when any artifact content changes', () => {
    const before = evidenceDigest([ref('aaaaaaaaaaaaaaaa')])
    const after = evidenceDigest([ref('cccccccccccccccc')])
    expect(after).not.toBe(before)
  })
})

describe('sampleProgress — metric (ii) failing-test count', () => {
  it('first sample records the metric with stale_count 0 (nothing to compare against)', () => {
    expect(sampleProgress(undefined, { failing_tests: 7 })).toEqual({
      metric: 'failing_tests',
      failing_tests: 7,
      stale_count: 0,
    })
  })

  it('a decrease is progress → stale_count resets to 0', () => {
    const prev: ProgressMark = { metric: 'failing_tests', failing_tests: 7, stale_count: 1 }
    expect(sampleProgress(prev, { failing_tests: 3 })).toEqual({
      metric: 'failing_tests',
      failing_tests: 3,
      stale_count: 0,
    })
  })

  it('no decrease is no progress → stale_count increments', () => {
    const prev: ProgressMark = { metric: 'failing_tests', failing_tests: 7, stale_count: 0 }
    expect(sampleProgress(prev, { failing_tests: 7 })?.stale_count).toBe(1)
  })

  it('an INCREASE is also no progress (regressing counts as spinning)', () => {
    const prev: ProgressMark = { metric: 'failing_tests', failing_tests: 7, stale_count: 0 }
    expect(sampleProgress(prev, { failing_tests: 9 })?.stale_count).toBe(1)
  })

  it('failing_tests wins over the digest when both are present', () => {
    const prev: ProgressMark = { metric: 'failing_tests', failing_tests: 4, stale_count: 0 }
    const next = sampleProgress(prev, { failing_tests: 2, evidence_digest: 'zz' })
    expect(next?.metric).toBe('failing_tests')
    expect(next?.stale_count).toBe(0)
  })
})

describe('sampleProgress — metric (i) evidence digest fallback', () => {
  it('unchanged evidence across attempts → stale_count increments', () => {
    const prev: ProgressMark = { metric: 'evidence_digest', evidence_digest: 'd1', stale_count: 0 }
    expect(sampleProgress(prev, { evidence_digest: 'd1' })?.stale_count).toBe(1)
  })

  it('changed evidence → stale_count resets (the known "改一个字" weakness, OQ2 accepted)', () => {
    const prev: ProgressMark = { metric: 'evidence_digest', evidence_digest: 'd1', stale_count: 1 }
    expect(sampleProgress(prev, { evidence_digest: 'd2' })?.stale_count).toBe(0)
  })
})

describe('sampleProgress — degradation (fail-open, never a false circuit break)', () => {
  it('nothing measurable → null (no mark written, no damping)', () => {
    expect(sampleProgress(undefined, {})).toBeNull()
    expect(sampleProgress(undefined, { evidence_digest: '' })).toBeNull()
  })

  it('switching metric resets the counter (samples are not comparable across metrics)', () => {
    const prev: ProgressMark = { metric: 'failing_tests', failing_tests: 7, stale_count: 1 }
    const next = sampleProgress(prev, { evidence_digest: 'd1' })
    expect(next).toEqual({ metric: 'evidence_digest', evidence_digest: 'd1', stale_count: 0 })
  })

  it('a negative / non-integer failing count is ignored, falling back to the digest', () => {
    const next = sampleProgress(undefined, { failing_tests: -1, evidence_digest: 'd1' })
    expect(next?.metric).toBe('evidence_digest')
  })
})

describe('isPlateaued', () => {
  it('needs PLATEAU_THRESHOLD consecutive no-progress attempts (ECC gan-harness :224-235 parity)', () => {
    expect(PLATEAU_THRESHOLD).toBe(2)
    expect(isPlateaued(undefined)).toBe(false)
    expect(isPlateaued({ metric: 'failing_tests', failing_tests: 1, stale_count: 1 })).toBe(false)
    expect(isPlateaued({ metric: 'failing_tests', failing_tests: 1, stale_count: 2 })).toBe(true)
    expect(isPlateaued({ metric: 'evidence_digest', evidence_digest: 'd', stale_count: 5 })).toBe(
      true,
    )
  })
})
