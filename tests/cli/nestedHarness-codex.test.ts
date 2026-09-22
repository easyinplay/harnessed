// v16.0 Phase 63 T7 — isNestedHarnessContext() under codex. Before Phase 63 the
// codex descriptor had sessionIdEnv: null, so `harnessed run` / `research` were
// never guarded inside a codex session (the nested SDK spawn hang, issue #1).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isNestedHarnessContext } from '../../src/cli/lib/nestedHarness.js'

let isTTYDescriptor: PropertyDescriptor | undefined

beforeEach(() => {
  isTTYDescriptor = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY')
  for (const k of [
    'CODEX_SESSION_ID',
    'CLAUDE_CODE_SESSION_ID',
    'HARNESSED_PLATFORM',
    'HARNESSED_ALLOW_NESTED',
  ]) {
    vi.stubEnv(k, undefined)
  }
  Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true })
})
afterEach(() => {
  vi.unstubAllEnvs()
  if (isTTYDescriptor) Object.defineProperty(process.stdin, 'isTTY', isTTYDescriptor)
  else Object.defineProperty(process.stdin, 'isTTY', { value: undefined, configurable: true })
})

describe('isNestedHarnessContext — codex session (Phase 63)', () => {
  it('CODEX_SESSION_ID + non-TTY → nested', () => {
    vi.stubEnv('CODEX_SESSION_ID', 'sess-1')
    expect(isNestedHarnessContext()).toBe(true)
  })

  it('HARNESSED_PLATFORM=codex + CODEX_SESSION_ID → nested', () => {
    vi.stubEnv('HARNESSED_PLATFORM', 'codex')
    vi.stubEnv('CODEX_SESSION_ID', 'sess-1')
    expect(isNestedHarnessContext()).toBe(true)
  })

  it('CODEX_SESSION_ID at a real terminal (TTY) → not nested', () => {
    vi.stubEnv('CODEX_SESSION_ID', 'sess-1')
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true })
    expect(isNestedHarnessContext()).toBe(false)
  })

  it('HARNESSED_ALLOW_NESTED=1 → not nested', () => {
    vi.stubEnv('CODEX_SESSION_ID', 'sess-1')
    vi.stubEnv('HARNESSED_ALLOW_NESTED', '1')
    expect(isNestedHarnessContext()).toBe(false)
  })

  it('no host session env (CI) → not nested', () => {
    expect(isNestedHarnessContext()).toBe(false)
  })
})
