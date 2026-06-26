// issue #1 B3 — non-interactive guard for the readline prompts. These are only
// reachable via the direct runMasterOrchestrator API (pre-flight is inert from
// `harnessed run` — runWorkflow passes no opts), but if ever reached with no
// TTY they would hang forever on rl.question. Guard: no TTY → return the safe
// default immediately (do not open readline). Tight per-cell timeout so the
// pre-fix RED is a fast timeout, not a hung suite.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defaultPauseFn, defaultPrompter } from '../../src/workflow/masterOrchestrator-helpers.js'

let isTTYDescriptor: PropertyDescriptor | undefined

beforeEach(() => {
  isTTYDescriptor = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY')
  Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true })
})
afterEach(() => {
  if (isTTYDescriptor) Object.defineProperty(process.stdin, 'isTTY', isTTYDescriptor)
  else Object.defineProperty(process.stdin, 'isTTY', { value: undefined, configurable: true })
})

describe('issue #1 — readline prompts non-interactive guard', () => {
  it('defaultPauseFn — no TTY → resolves immediately (no hang)', async () => {
    await expect(defaultPauseFn('plan')).resolves.toBeUndefined()
  }, 1500)

  it('defaultPrompter — no TTY → returns "" immediately (safe default)', async () => {
    await expect(defaultPrompter('continue? ')).resolves.toBe('')
  }, 1500)
})
