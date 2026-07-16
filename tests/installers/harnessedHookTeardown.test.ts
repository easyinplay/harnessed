// issue #8 — orphaned Stop / UserPromptSubmit hooks pointing at deleted
// harnessed bin/*.mjs cause MODULE_NOT_FOUND every prompt. These pure helpers
// identify first-party harnessed hook registrations in ANY shape (npm relative
// or absolute .mjs, compiled `<binary> <id>`, legacy flat, nested) so unified
// uninstall + doctor self-heal can strip them without a manifest in hand.

import { describe, expect, it } from 'vitest'
import {
  countHarnessedHooks,
  harnessedHookIdentity,
  harnessedHookScriptPath,
  harnessedStaleHookPaths,
  stripHarnessedHooks,
} from '../../src/installers/lib/harnessedHookTeardown.js'

describe('harnessedHookIdentity', () => {
  it('npm relative .mjs → identity', () => {
    expect(harnessedHookIdentity('node bin/harnessed-inject-state.mjs')).toBe('inject-state')
    expect(harnessedHookIdentity('node bin/harnessed-stop-hook.mjs')).toBe('stop-hook')
  })

  it('npm absolute quoted .mjs (issue #8 stale orphan, forward-slash) → identity', () => {
    const raw =
      'node "C:/Users/x/AppData/Roaming/npm/node_modules/harnessed/bin/harnessed-inject-state.mjs"'
    expect(harnessedHookIdentity(raw)).toBe('inject-state')
    const stop =
      'node "/home/u/.local/share/npm/lib/node_modules/harnessed/bin/harnessed-stop-hook.mjs"'
    expect(harnessedHookIdentity(stop)).toBe('stop-hook')
  })

  it('compiled binary form `"<binary>" <id>` → identity', () => {
    expect(
      harnessedHookIdentity('"C:/Users/x/AppData/Local/harnessed/bin/harnessed.exe" inject-state'),
    ).toBe('inject-state')
    expect(harnessedHookIdentity('"/home/u/.local/bin/harnessed" stop-hook')).toBe('stop-hook')
  })

  it('bare PATH form `harnessed <id>` → identity', () => {
    expect(harnessedHookIdentity('harnessed inject-state')).toBe('inject-state')
  })

  it('unrelated commands → null', () => {
    expect(harnessedHookIdentity('node bin/other-tool.mjs')).toBeNull()
    expect(harnessedHookIdentity('npx some-formatter')).toBeNull()
    expect(harnessedHookIdentity('echo harnessed-was-here')).toBeNull()
    expect(harnessedHookIdentity('node harnessed-inject-statement.mjs')).toBeNull()
  })
})

describe('harnessedHookScriptPath', () => {
  it('npm form → the .mjs path', () => {
    const raw =
      'node "C:/Users/x/AppData/Roaming/npm/node_modules/harnessed/bin/harnessed-inject-state.mjs"'
    expect(harnessedHookScriptPath(raw)).toBe(
      'C:/Users/x/AppData/Roaming/npm/node_modules/harnessed/bin/harnessed-inject-state.mjs',
    )
  })

  it('compiled form → the binary path', () => {
    expect(
      harnessedHookScriptPath(
        '"C:/Users/x/AppData/Local/harnessed/bin/harnessed.exe" inject-state',
      ),
    ).toBe('C:/Users/x/AppData/Local/harnessed/bin/harnessed.exe')
  })

  it('bare form → the bare token (unstattable, caller skips)', () => {
    expect(harnessedHookScriptPath('harnessed stop-hook')).toBe('harnessed')
  })

  it('unrelated → null', () => {
    expect(harnessedHookScriptPath('npx some-formatter')).toBeNull()
  })
})

describe('stripHarnessedHooks', () => {
  it('removes harnessed entries across events, keeps others, prunes empty arrays', () => {
    const hooks: Record<string, unknown[]> = {
      UserPromptSubmit: [
        {
          hooks: [
            { type: 'command', command: 'node "/x/harnessed/bin/harnessed-inject-state.mjs"' },
          ],
        },
        { hooks: [{ type: 'command', command: 'node bin/other.mjs' }] },
      ],
      Stop: [
        {
          hooks: [{ type: 'command', command: 'node "/x/harnessed/bin/harnessed-stop-hook.mjs"' }],
        },
      ],
      PreToolUse: [{ hooks: [{ type: 'command', command: 'node bin/guard.mjs' }] }],
    }
    const { removed } = stripHarnessedHooks(hooks as never)
    expect(removed).toBe(2)
    expect(hooks.UserPromptSubmit).toHaveLength(1)
    expect(hooks.Stop).toBeUndefined() // emptied → pruned
    expect(hooks.PreToolUse).toHaveLength(1)
  })

  it('removes legacy flat { command } form', () => {
    const hooks: Record<string, unknown[]> = {
      UserPromptSubmit: [{ command: 'node bin/harnessed-inject-state.mjs' }],
    }
    const { removed } = stripHarnessedHooks(hooks as never)
    expect(removed).toBe(1)
    expect(hooks.UserPromptSubmit).toBeUndefined()
  })

  it('non-mutating counter agrees with strip and does not mutate', () => {
    const hooks = {
      Stop: [
        { hooks: [{ type: 'command', command: '"/home/u/.local/bin/harnessed" stop-hook' }] },
        { hooks: [{ type: 'command', command: 'node bin/keep.mjs' }] },
      ],
    }
    expect(countHarnessedHooks(hooks as never)).toBe(1)
    // counter did not mutate
    expect(hooks.Stop).toHaveLength(2)
  })
})

describe('harnessedStaleHookPaths', () => {
  const hooks = {
    UserPromptSubmit: [
      {
        hooks: [
          { type: 'command', command: 'node "C:/gone/harnessed/bin/harnessed-inject-state.mjs"' },
        ],
      },
    ],
    Stop: [
      {
        hooks: [
          { type: 'command', command: 'node "C:/live/harnessed/bin/harnessed-stop-hook.mjs"' },
        ],
      },
    ],
    PreToolUse: [{ hooks: [{ type: 'command', command: 'harnessed inject-state' }] }],
  }

  it('reports only absolute harnessed paths that do not exist', () => {
    const exists = (p: string) => p.includes('/live/')
    const stale = harnessedStaleHookPaths(hooks as never, exists)
    expect(stale).toEqual([
      { event: 'UserPromptSubmit', path: 'C:/gone/harnessed/bin/harnessed-inject-state.mjs' },
    ])
  })

  it('skips bare PATH tokens (unstattable) and non-harnessed hooks', () => {
    const onlyBare = {
      PreToolUse: [
        { hooks: [{ type: 'command', command: 'harnessed inject-state' }] },
        { hooks: [{ type: 'command', command: 'node bin/other.mjs' }] },
      ],
    }
    expect(harnessedStaleHookPaths(onlyBare as never, () => false)).toEqual([])
  })
})
