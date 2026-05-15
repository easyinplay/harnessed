// Phase 2.2 T1.4 — SDK smoke import test.
//
// Verifies @anthropic-ai/claude-agent-sdk 0.3.142 resolves + `query` symbol
// exported on all 3 OS (ubuntu / macos / windows via CI matrix).
//
// Acceptance: B-04 SDK pin + B-31 Win 兼容 verify.

import { describe, expect, it } from 'vitest'
import { query } from '@anthropic-ai/claude-agent-sdk'

describe('SDK smoke import', () => {
  it('query is a function', () => {
    expect(typeof query).toBe('function')
  })

  it('SDK module resolves on this OS', () => {
    expect(query).toBeDefined()
  })
})
