import { describe, expect, it } from 'vitest'
import {
  countHarnessedHooks,
  harnessedHookIdentity,
  harnessedStaleHookPaths,
  stripHarnessedHooks,
} from '../../src/installers/lib/harnessedHookTeardown.js'

const VENDOR_COMMAND = 'node "C:/vendor/harnessed/bin/harnessed-inject-state.mjs"'

describe('harnessed hook teardown vendor paths', () => {
  it('preserves third-party paths nested under a harnessed directory', () => {
    const hooks = {
      UserPromptSubmit: [{ hooks: [{ type: 'command', command: VENDOR_COMMAND }] }],
    }

    expect(harnessedHookIdentity(VENDOR_COMMAND)).toBeNull()
    expect(countHarnessedHooks(hooks)).toBe(0)
    expect(stripHarnessedHooks(hooks)).toEqual({ removed: 0 })
    expect(harnessedStaleHookPaths(hooks, () => false)).toEqual([])
    expect(hooks.UserPromptSubmit).toHaveLength(1)
  })
})
