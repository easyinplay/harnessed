// `harnessed status` — statusMarker unit tests (G7-lite consumer).
// Tests the pure helper that maps SubProgressEntry.status → display string.
// Sister pattern: tests/cli/checkpoint.test.ts

import { describe, expect, it } from 'vitest'
import { statusMarker } from '../../src/cli/status.js'

describe('statusMarker', () => {
  it('done → checkmark', () => {
    expect(statusMarker('done')).toBe('✅ done')
  })

  it('pending → hourglass', () => {
    expect(statusMarker('pending')).toBe('⏳ pending')
  })

  it('failed → cross', () => {
    expect(statusMarker('failed')).toBe('✗ failed')
  })

  it('skipped → white square', () => {
    expect(statusMarker('skipped')).toBe('⬜ skipped')
  })

  it('rejected → no-entry (G7-lite)', () => {
    expect(statusMarker('rejected')).toBe('🚫 rejected')
  })
})
