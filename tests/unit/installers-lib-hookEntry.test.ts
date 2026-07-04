// v4.20.0 hotfix — hookEntry helpers (CC hook shape + resolution + migration
// matching). Dogfood: perturn-inject wrote flat `{command}` + relative path.

import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  desiredHookEntry,
  detectCcHookInstalled,
  entryMatchesRegistration,
  hookScriptMarker,
  isDesiredHookEntry,
  resolveHookCommand,
} from '../../src/installers/lib/hookEntry.js'

const ROOT = join('C:', 'fake', 'assets')
const deps = (existing: string[]) => ({
  assetsRoot: () => ROOT,
  exists: (p: string) => existing.includes(p),
})

const INJECT = 'node bin/harnessed-inject-state.mjs'
const INJECT_ABS = join(ROOT, 'bin', 'harnessed-inject-state.mjs')

describe('resolveHookCommand', () => {
  it('resolves an existing package-relative token to an absolute path', () => {
    const r = resolveHookCommand(INJECT, deps([INJECT_ABS]))
    expect(r).toBe(`node ${INJECT_ABS}`)
  })

  it('quotes resolved paths containing spaces', () => {
    const root = join('C:', 'fake dir', 'assets')
    const abs = join(root, 'bin', 'x.mjs')
    const r = resolveHookCommand('node bin/x.mjs', {
      assetsRoot: () => root,
      exists: (p) => p === abs,
    })
    expect(r).toBe(`node "${abs}"`)
  })

  it('leaves non-existing relative tokens and flags verbatim', () => {
    expect(resolveHookCommand('node bin/x.mjs --flag', deps([]))).toBe('node bin/x.mjs --flag')
  })

  it('leaves absolute tokens untouched', () => {
    const cmd = `node ${INJECT_ABS}`
    expect(resolveHookCommand(cmd, deps([INJECT_ABS]))).toBe(cmd)
  })
})

describe('hookScriptMarker', () => {
  it('yields the script basename for package-relative commands', () => {
    expect(hookScriptMarker(INJECT)).toBe('harnessed-inject-state.mjs')
  })
  it('yields null for commands without a relative file token', () => {
    expect(hookScriptMarker('codegraph prompt-hook')).toBeNull()
  })
})

describe('entryMatchesRegistration + isDesiredHookEntry', () => {
  const marker = hookScriptMarker(INJECT)
  const resolved = `node ${INJECT_ABS}`

  it('matches the legacy flat form the broken installer wrote', () => {
    expect(entryMatchesRegistration({ command: INJECT }, INJECT, resolved, marker)).toBe(true)
  })

  it('matches a hand-fixed nested entry that still has the relative path', () => {
    const e = { hooks: [{ type: 'command', command: INJECT }] }
    expect(entryMatchesRegistration(e, INJECT, resolved, marker)).toBe(true)
    expect(isDesiredHookEntry(e, undefined, resolved)).toBe(false)
  })

  it('does not match unrelated entries', () => {
    const e = { hooks: [{ type: 'command', command: 'codegraph prompt-hook' }] }
    expect(entryMatchesRegistration(e, INJECT, resolved, marker)).toBe(false)
  })

  it('desiredHookEntry omits matcher when undefined and isDesired agrees', () => {
    const d = desiredHookEntry(undefined, resolved)
    expect(Object.keys(d)).toEqual(['hooks'])
    expect(isDesiredHookEntry(d, undefined, resolved)).toBe(true)
    expect(isDesiredHookEntry(d, 'startup', resolved)).toBe(false)
  })
})

describe('detectCcHookInstalled (authoritative probe)', () => {
  const d = deps([INJECT_ABS])
  const resolved = `node ${INJECT_ABS}`
  const ev = 'UserPromptSubmit'

  it('true only for the exact corrected entry', () => {
    const good = JSON.stringify({
      hooks: { [ev]: [{ hooks: [{ type: 'command', command: resolved }] }] },
    })
    expect(detectCcHookInstalled(good, ev, INJECT, undefined, d)).toBe(true)
  })

  it('false for legacy flat / relative-path / absent / malformed', () => {
    const flat = JSON.stringify({ hooks: { [ev]: [{ command: INJECT }] } })
    const rel = JSON.stringify({
      hooks: { [ev]: [{ hooks: [{ type: 'command', command: INJECT }] }] },
    })
    expect(detectCcHookInstalled(flat, ev, INJECT, undefined, d)).toBe(false)
    expect(detectCcHookInstalled(rel, ev, INJECT, undefined, d)).toBe(false)
    expect(detectCcHookInstalled(null, ev, INJECT, undefined, d)).toBe(false)
    expect(detectCcHookInstalled('{not json', ev, INJECT, undefined, d)).toBe(false)
    expect(detectCcHookInstalled('{}', ev, INJECT, undefined, d)).toBe(false)
  })
})
