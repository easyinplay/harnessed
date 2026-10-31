// issue #8 — orphaned Stop / UserPromptSubmit hooks pointing at deleted
// harnessed bin/*.mjs cause MODULE_NOT_FOUND every prompt. These pure helpers
// identify first-party harnessed hook registrations in ANY shape (npm relative
// or absolute .mjs, compiled `<binary> <id>`, legacy flat, nested) so unified
// uninstall + doctor self-heal can strip them without a manifest in hand.

import { homedir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  countHarnessedHooks,
  harnessedHookIdentity,
  harnessedHookScriptPath,
  harnessedStaleHookPaths,
  stripHarnessedHooks,
} from '../../src/installers/lib/harnessedHookTeardown.js'
import { getAssetsRoot } from '../../src/platform/assetsRoot.js'

const TRUSTED_ASSETS_ROOT = getAssetsRoot().replace(/\\/g, '/').replace(/\/$/, '')
const trustedScriptPath = (id: string) => `${TRUSTED_ASSETS_ROOT}/bin/harnessed-${id}.mjs`
const trustedScriptCommand = (id: string, runtime = 'node') =>
  `${runtime} "${trustedScriptPath(id)}"`
const TRUSTED_WINDOWS_BINARY = join(
  process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local'),
  'harnessed',
  'bin',
  'harnessed.exe',
).replace(/\\/g, '/')
const TRUSTED_UNIX_BINARY = join(homedir(), '.local', 'bin', 'harnessed').replace(/\\/g, '/')

describe('harnessedHookIdentity', () => {
  it('npm relative .mjs → identity', () => {
    expect(harnessedHookIdentity('node bin/harnessed-inject-state.mjs')).toBe('inject-state')
    expect(harnessedHookIdentity('node bin/harnessed-stop-hook.mjs')).toBe('stop-hook')
  })

  it('captured assetsRoot absolute quoted .mjs → identity', () => {
    const raw = trustedScriptCommand('inject-state')
    expect(harnessedHookIdentity(raw)).toBe('inject-state')
    const stop = trustedScriptCommand('stop-hook')
    expect(harnessedHookIdentity(stop)).toBe('stop-hook')
    const assets = trustedScriptCommand('inject-state', 'bun')
    expect(harnessedHookIdentity(assets)).toBe('inject-state')
  })

  it('compiled binary form `"<binary>" <id>` → identity', () => {
    expect(harnessedHookIdentity(`"${TRUSTED_WINDOWS_BINARY}" inject-state`)).toBe('inject-state')
    expect(harnessedHookIdentity(`"${TRUSTED_UNIX_BINARY}" stop-hook`)).toBe('stop-hook')
  })

  it('bare PATH form `harnessed <id>` → identity', () => {
    expect(harnessedHookIdentity('harnessed inject-state')).toBe('inject-state')
  })

  // 4.34.1 — doc-discipline-gate (4.34.0) registers `harnessed check-docs --hook`
  // as PreToolUse(Bash). Its identity was MISSING from the shared id set, so
  // unified `harnessed uninstall` + doctor self-heal did not see it at all.
  it('doc-discipline-gate forms (bare CLI / compiled, WITH a trailing flag) → identity', () => {
    expect(harnessedHookIdentity('harnessed check-docs --hook')).toBe('check-docs')
    expect(harnessedHookIdentity(`"${TRUSTED_WINDOWS_BINARY}" check-docs --hook`)).toBe(
      'check-docs',
    )
    expect(harnessedHookIdentity(`"${TRUSTED_UNIX_BINARY}" check-docs --hook`)).toBe('check-docs')
    // A user's own lookalike is not owned.
    expect(harnessedHookIdentity('"C:/tools/myharnessed.exe" check-docs --hook')).toBeNull()
  })

  it('unrelated commands → null', () => {
    expect(harnessedHookIdentity('node bin/other-tool.mjs')).toBeNull()
    expect(harnessedHookIdentity('npx some-formatter')).toBeNull()
    expect(harnessedHookIdentity('echo harnessed-was-here')).toBeNull()
    expect(harnessedHookIdentity('node harnessed-inject-statement.mjs')).toBeNull()
  })

  it('third-party exact-basename scripts and vendor binaries are NOT owned', () => {
    expect(harnessedHookIdentity('node "C:/vendor/harnessed-inject-state.mjs"')).toBeNull()
    expect(harnessedHookIdentity('bun /opt/vendor/harnessed-stop-hook.mjs')).toBeNull()
    expect(harnessedHookIdentity('"C:/vendor/harnessed.exe" inject-state')).toBeNull()
  })

  it('requires a trusted path — a user script merely ENDING in the name is NOT owned', () => {
    // A matching suffix alone must never trigger silent deletion of a user's hook.
    expect(harnessedHookIdentity('node ./scripts/team-harnessed-stop-hook.mjs')).toBeNull()
    expect(harnessedHookIdentity('node my-harnessed-inject-state.mjs')).toBeNull()
    expect(harnessedHookIdentity('"C:/tools/myharnessed.exe" inject-state')).toBeNull()
    // but the captured first-party assets path still matches
    expect(harnessedHookIdentity(trustedScriptCommand('stop-hook'))).toBe('stop-hook')
    expect(harnessedHookIdentity(`"${TRUSTED_WINDOWS_BINARY}" inject-state`)).toBe('inject-state')
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
    expect(harnessedHookScriptPath(`"${TRUSTED_WINDOWS_BINARY}" inject-state`)).toBe(
      TRUSTED_WINDOWS_BINARY,
    )
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

  it('doc-discipline-gate: compiled → binary path, bare → bare token (flag ignored)', () => {
    expect(harnessedHookScriptPath('"C:/live/harnessed/bin/harnessed.exe" check-docs --hook')).toBe(
      'C:/live/harnessed/bin/harnessed.exe',
    )
    expect(harnessedHookScriptPath('harnessed check-docs --hook')).toBe('harnessed')
  })

  it('unrelated → null', () => {
    expect(harnessedHookScriptPath('npx some-formatter')).toBeNull()
  })
})

describe('stripHarnessedHooks', () => {
  it('Bun first-party commands are removed without owning a lookalike or sibling', () => {
    const commands = [
      trustedScriptCommand('inject-state', 'bun'),
      `${trustedScriptCommand('stop-hook', 'bun')} --verbose`,
      `${trustedScriptCommand('check-docs', 'bun')} --hook`,
    ]
    const sibling = { type: 'command', command: 'bun scripts/team-harnessed-stop-hook.mjs' }
    const hooks = {
      UserPromptSubmit: [
        { hooks: commands.map((command) => ({ type: 'command', command })).concat([sibling]) },
      ],
    }
    for (const command of commands) {
      expect(harnessedHookIdentity(command)).not.toBeNull()
      expect(harnessedHookScriptPath(command)).toMatch(`${TRUSTED_ASSETS_ROOT}/bin/`)
    }
    expect(countHarnessedHooks(hooks)).toBe(3)
    expect(stripHarnessedHooks(hooks)).toEqual({ removed: 3 })
    expect(hooks.UserPromptSubmit).toEqual([{ hooks: [sibling] }])
    expect(countHarnessedHooks(hooks)).toBe(0)
  })

  it('removes harnessed entries across events, keeps others, prunes empty arrays', () => {
    const hooks: Record<string, unknown[]> = {
      UserPromptSubmit: [
        {
          hooks: [{ type: 'command', command: trustedScriptCommand('inject-state') }],
        },
        { hooks: [{ type: 'command', command: 'node bin/other.mjs' }] },
      ],
      Stop: [
        {
          hooks: [{ type: 'command', command: trustedScriptCommand('stop-hook') }],
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
            { type: 'command', command: trustedScriptCommand('inject-state') },
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
              { command: trustedScriptCommand('inject-state') },
              { command: trustedScriptCommand('stop-hook') },
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

  it('removes the doc-discipline-gate PreToolUse hook, keeps a user Bash hook (4.34.1)', () => {
    const hooks: Record<string, unknown[]> = {
      PreToolUse: [
        {
          matcher: 'Bash',
          hooks: [{ type: 'command', command: 'harnessed check-docs --hook' }],
        },
        { matcher: 'Bash', hooks: [{ type: 'command', command: 'node bin/guard.mjs' }] },
      ],
    }
    expect(countHarnessedHooks(hooks as never)).toBe(1)
    const { removed } = stripHarnessedHooks(hooks as never)
    expect(removed).toBe(1)
    expect(hooks.PreToolUse).toHaveLength(1)
    const kept = hooks.PreToolUse?.[0] as { hooks: { command: string }[] }
    expect(kept.hooks[0]?.command).toContain('guard.mjs')
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
        { hooks: [{ type: 'command', command: `"${TRUSTED_UNIX_BINARY}" stop-hook` }] },
        { hooks: [{ type: 'command', command: 'node bin/keep.mjs' }] },
      ],
    }
    expect(countHarnessedHooks(hooks as never)).toBe(1)
    // counter did not mutate
    expect(hooks.Stop).toHaveLength(2)
  })

  it('preserves third-party exact-basename scripts and vendor binaries', () => {
    const hooks = {
      UserPromptSubmit: [
        { hooks: [{ type: 'command', command: 'node "C:/vendor/harnessed-inject-state.mjs"' }] },
      ],
      Stop: [{ hooks: [{ type: 'command', command: '"C:/vendor/harnessed.exe" stop-hook' }] }],
    }
    expect(countHarnessedHooks(hooks as never)).toBe(0)
    expect(stripHarnessedHooks(hooks as never)).toEqual({ removed: 0 })
    expect(hooks.UserPromptSubmit).toHaveLength(1)
    expect(hooks.Stop).toHaveLength(1)
  })
})

describe('harnessedStaleHookPaths', () => {
  const hooks = {
    UserPromptSubmit: [
      {
        hooks: [{ type: 'command', command: trustedScriptCommand('inject-state') }],
      },
    ],
    Stop: [
      {
        hooks: [{ type: 'command', command: trustedScriptCommand('stop-hook') }],
      },
    ],
    PreToolUse: [{ hooks: [{ type: 'command', command: 'harnessed inject-state' }] }],
  }

  it('reports only absolute harnessed paths that do not exist', () => {
    const exists = (p: string) => p.endsWith('harnessed-stop-hook.mjs')
    const stale = harnessedStaleHookPaths(hooks as never, exists)
    expect(stale).toEqual([{ event: 'UserPromptSubmit', path: trustedScriptPath('inject-state') }])
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

  it('does not report third-party exact-basename scripts or vendor binaries', () => {
    const thirdParty = {
      UserPromptSubmit: [{ hooks: [{ command: 'node "C:/vendor/harnessed-inject-state.mjs"' }] }],
      Stop: [{ hooks: [{ command: '"C:/vendor/harnessed.exe" stop-hook' }] }],
    }
    expect(harnessedStaleHookPaths(thirdParty as never, () => false)).toEqual([])
  })

  it('reports a RELATIVE harnessed .mjs (pre-4.20.0 broken shape) regardless of exists', () => {
    // review finding: relative orphan errors every prompt but was reported pass.
    const rel = {
      UserPromptSubmit: [{ hooks: [{ command: 'node bin/harnessed-inject-state.mjs' }] }],
    }
    const stale = harnessedStaleHookPaths(rel as never, () => true) // exists ignored for relative
    expect(stale).toEqual([{ event: 'UserPromptSubmit', path: 'bin/harnessed-inject-state.mjs' }])
  })

  it('does not report an untrusted absolute path WITH SPACES', () => {
    const path = 'C:/Program Files/npm/node_modules/harnessed/bin/harnessed-stop-hook.mjs'
    const spaced = {
      Stop: [{ hooks: [{ command: `node "${path}"` }] }],
    }
    const stale = harnessedStaleHookPaths(spaced as never, () => false)
    expect(stale).toEqual([])
  })

  it('doc-discipline-gate: missing compiled binary → stale; bare PATH form → skipped (4.34.1)', () => {
    const compiled = {
      PreToolUse: [
        {
          hooks: [{ type: 'command', command: `"${TRUSTED_WINDOWS_BINARY}" check-docs --hook` }],
        },
      ],
    }
    expect(harnessedStaleHookPaths(compiled as never, () => false)).toEqual([
      { event: 'PreToolUse', path: TRUSTED_WINDOWS_BINARY },
    ])
    const bare = {
      PreToolUse: [{ hooks: [{ type: 'command', command: 'harnessed check-docs --hook' }] }],
    }
    expect(harnessedStaleHookPaths(bare as never, () => false)).toEqual([])
  })

  it('null / primitive array elements do not throw', () => {
    const bad = { Stop: [null, 42, { hooks: [null] }] }
    expect(() => harnessedStaleHookPaths(bad as never, () => false)).not.toThrow()
    expect(harnessedStaleHookPaths(bad as never, () => false)).toEqual([])
  })
})
