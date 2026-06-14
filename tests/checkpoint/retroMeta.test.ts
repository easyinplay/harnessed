// Phase 22 — unit tests for src/checkpoint/retroMeta.ts (retro-reminder counter core).
//
// Covers (CONTEXT D3/D4/D5/D6 + acceptance 3):
//   - retroThreshold: env HARNESSED_RETRO_PHASE_THRESHOLD, default 5, junk → default
//   - incrementPhases: undefined → 1; existing → +1 (preserves last_retro_at)
//   - isRetroDue: true at >= N
//   - resetRetro: zeroes the counter + stamps last_retro_at
//
// Pure module — operates on RetroMetaEntry values; no I/O.

import { describe, expect, it } from 'vitest'
import {
  incrementPhases,
  isRetroDue,
  resetRetro,
  retroThreshold,
} from '../../src/checkpoint/retroMeta.js'

describe('retroThreshold', () => {
  it('defaults to 5 when env is unset', () => {
    expect(retroThreshold({})).toBe(5)
  })
  it('honors a positive integer env override', () => {
    expect(retroThreshold({ HARNESSED_RETRO_PHASE_THRESHOLD: '3' })).toBe(3)
  })
  it('falls back to 5 on junk / zero / negative', () => {
    expect(retroThreshold({ HARNESSED_RETRO_PHASE_THRESHOLD: 'abc' })).toBe(5)
    expect(retroThreshold({ HARNESSED_RETRO_PHASE_THRESHOLD: '0' })).toBe(5)
    expect(retroThreshold({ HARNESSED_RETRO_PHASE_THRESHOLD: '-2' })).toBe(5)
  })
})

describe('incrementPhases', () => {
  it('undefined entry → fresh counter at 1', () => {
    expect(incrementPhases(undefined)).toEqual({ phases_since_retro: 1 })
  })
  it('existing entry → +1, preserving last_retro_at', () => {
    expect(
      incrementPhases({ phases_since_retro: 4, last_retro_at: '2026-06-01T00:00:00.000Z' }),
    ).toEqual({ phases_since_retro: 5, last_retro_at: '2026-06-01T00:00:00.000Z' })
  })
})

describe('isRetroDue', () => {
  it('false below threshold, true at/above', () => {
    expect(isRetroDue(4, 5)).toBe(false)
    expect(isRetroDue(5, 5)).toBe(true)
    expect(isRetroDue(6, 5)).toBe(true)
  })
})

describe('resetRetro', () => {
  it('zeroes the counter and stamps last_retro_at', () => {
    expect(resetRetro('2026-06-14T12:00:00.000Z')).toEqual({
      phases_since_retro: 0,
      last_retro_at: '2026-06-14T12:00:00.000Z',
    })
  })
})
