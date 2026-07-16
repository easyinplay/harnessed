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

  it('requires a LEFT boundary — a user script merely ENDING in the name is NOT owned', () => {
    // review finding: no left boundary → silent deletion of a user's own hook.
    expect(harnessedHookIdentity('node ./scripts/team-harnessed-stop-hook.mjs')).toBeNull()
    expect(harnessedHookIdentity('node my-harnessed-inject-state.mjs')).toBeNull()
    expect(harnessedHookIdentity('"C:/tools/myharnessed.exe" inject-state')).toBeNull()
    // but a genuine harnessed path (separator/quote/start boundary) still matches
    expect(harnessedHookIdentity('node "C:/x/harnessed/bin/harnessed-stop-hook.mjs"')).toBe(
      'stop-hook',
    )
    expect(harnessedHookIdentity('"C:/x/harnessed.exe" inject-state')).toBe('inject-state')
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

  it('quoted path WITH SPACES → the whole path (review finding: not truncated at space)', () => {
    expect(harnessedHookScriptPath('node "C:/Program Files/npm/harnessed-inject-state.mjs"')).toBe(
      'C:/Program Files/npm/harnessed-inject-state.mjs',
    )
    expect(harnessedHookScriptPath('"C:/Program Files/harnessed/harnessed.exe" stop-hook')).toBe(
      'C:/Program Files/harnessed/harnessed.exe',
    )
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

  it('preserves a SIBLING non-harnessed hook in the same group (review finding: no data loss)', () => {
    const hooks: Record<string, unknown[]> = {
      UserPromptSubmit: [
        {
          matcher: '',
          hooks: [
            { type: 'command', command: 'node "/x/harnessed/bin/harnessed-inject-state.mjs"' },
            { type: 'command', command: 'node /x/my-tool.mjs' },
          ],
        },
      ],
    }
    const { removed } = stripHarnessedHooks(hooks as never)
    expect(removed).toBe(1)
    // group survives with the user's sibling hook intact
    expect(hooks.UserPromptSubmit).toHaveLength(1)
    const grp = hooks.UserPromptSubmit?.[0] as { hooks: { command: string }[] }
    expect(grp.hooks).toHaveLength(1)
    expect(grp.hooks[0]?.command).toContain('my-tool.mjs')
  })

  it('tolerates null / primitive array elements (malformed settings.json — no throw)', () => {
    const hooks: Record<string, unknown[]> = {
      Stop: [null, 'garbage', { hooks: [{ command: 'node /x/harnessed-stop-hook.mjs' }] }],
    }
    expect(() => stripHarnessedHooks(hooks as never)).not.toThrow()
    expect(countHarnessedHooks(hooks as never)).toBe(0) // the harnessed one already stripped
  })

  it('count granularity matches removed (per-command, not per-group)', () => {
    const mk = () =>
      ({
        UserPromptSubmit: [
          {
            hooks: [
              { command: 'node /x/harnessed-inject-state.mjs' },
              { command: 'node /x/harnessed-stop-hook.mjs' },
              { command: 'node /x/keep.mjs' },
            ],
          },
        ],
      }) as Record<string, unknown[]>
    const counted = countHarnessedHooks(mk() as never)
    const { removed } = stripHarnessedHooks(mk() as never)
    expect(counted).toBe(2)
    expect(removed).toBe(counted)
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

  it('reports a RELATIVE harnessed .mjs (pre-4.20.0 broken shape) regardless of exists', () => {
    // review finding: relative orphan errors every prompt but was reported pass.
    const rel = {
      UserPromptSubmit: [{ hooks: [{ command: 'node bin/harnessed-inject-state.mjs' }] }],
    }
    const stale = harnessedStaleHookPaths(rel as never, () => true) // exists ignored for relative
    expect(stale).toEqual([{ event: 'UserPromptSubmit', path: 'bin/harnessed-inject-state.mjs' }])
  })

  it('reports an absolute path WITH SPACES that is missing (review finding: not skipped)', () => {
    const spaced = {
      Stop: [{ hooks: [{ command: 'node "C:/Program Files/npm/harnessed-stop-hook.mjs"' }] }],
    }
    const stale = harnessedStaleHookPaths(spaced as never, () => false)
    expect(stale).toEqual([{ event: 'Stop', path: 'C:/Program Files/npm/harnessed-stop-hook.mjs' }])
  })

  it('null / primitive array elements do not throw', () => {
    const bad = { Stop: [null, 42, { hooks: [null] }] }
    expect(() => harnessedStaleHookPaths(bad as never, () => false)).not.toThrow()
    expect(harnessedStaleHookPaths(bad as never, () => false)).toEqual([])
  })
})
