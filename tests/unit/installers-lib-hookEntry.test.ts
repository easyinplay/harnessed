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
// v4.21.0 dogfood — resolved paths are emitted forward-slash + ALWAYS quoted
// (unquoted backslashes are eaten as shell escapes when CC runs the hook →
// MODULE_NOT_FOUND on every prompt). Expectations mirror that contract.
const INJECT_ABS_CMD = `"${INJECT_ABS.replace(/\\/g, '/')}"`

describe('resolveHookCommand', () => {
  it('resolves an existing package-relative token to a forward-slash quoted absolute path', () => {
    const r = resolveHookCommand(INJECT, deps([INJECT_ABS]))
    expect(r).toBe(`node ${INJECT_ABS_CMD}`)
  })

  it('quotes resolved paths containing spaces (forward-slash form)', () => {
    const root = join('C:', 'fake dir', 'assets')
    const abs = join(root, 'bin', 'x.mjs')
    const r = resolveHookCommand('node bin/x.mjs', {
      assetsRoot: () => root,
      exists: (p) => p === abs,
    })
    expect(r).toBe(`node "${abs.replace(/\\/g, '/')}"`)
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
  // 4.27.0 (B3 T1) — inject-state identity is NORMALIZED to the subcommand
  // token so the npm form (`node .../harnessed-inject-state.mjs`) and the
  // compiled form (`"<binary>" inject-state`) share one registration identity
  // (entryMatchesRegistration uses substring includes → both contain it).
  it('normalizes the inject-state script to the subcommand identity', () => {
    expect(hookScriptMarker(INJECT)).toBe('inject-state')
  })
  it('yields the compiled-form identity for `"<binary>" inject-state`', () => {
    expect(hookScriptMarker('"C:/Users/x/harnessed.exe" inject-state')).toBe('inject-state')
  })
  it('yields the script basename for other package-relative commands', () => {
    expect(hookScriptMarker('node scripts/foo-hook.mjs')).toBe('foo-hook.mjs')
  })
  it('yields null for commands without a relative file token', () => {
    expect(hookScriptMarker('codegraph prompt-hook')).toBeNull()
  })
})

describe('4.27.0 compiled routing (D6 hook self-containment)', () => {
  it('resolveHookCommand routes the inject hook to `"<binary>" inject-state` when compiled', () => {
    const r = resolveHookCommand(INJECT, {
      ...deps([INJECT_ABS]),
      compiledExecPath: () => 'C:\\Users\\x\\bin\\harnessed.exe',
    })
    expect(r).toBe('"C:/Users/x/bin/harnessed.exe" inject-state')
  })

  it('compiledExecPath null (npm mode) → legacy resolution unchanged', () => {
    const r = resolveHookCommand(INJECT, { ...deps([INJECT_ABS]), compiledExecPath: () => null })
    expect(r).toBe(`node ${INJECT_ABS_CMD}`)
  })

  it('compiled routing does NOT hijack non-inject hooks', () => {
    const r = resolveHookCommand('node bin/x.mjs', {
      assetsRoot: () => ROOT,
      exists: () => false,
      compiledExecPath: () => 'C:\\bin\\harnessed.exe',
    })
    expect(r).toBe('node bin/x.mjs')
  })

  it('cross-form identity: npm-form entry matches a compiled-mode registration (and vice versa)', () => {
    const marker = hookScriptMarker(INJECT)
    const compiledCmd = '"C:/bin/harnessed.exe" inject-state'
    // old mjs entry in settings vs new registration
    expect(entryMatchesRegistration({ command: INJECT }, INJECT, compiledCmd, marker)).toBe(true)
    // new compiled entry in settings vs npm registration
    const e = { hooks: [{ type: 'command', command: compiledCmd }] }
    expect(entryMatchesRegistration(e, INJECT, `node ${INJECT_ABS}`, marker)).toBe(true)
  })
})

describe('4.30.0 stop-hook identity (issue #6 — second compiled hook)', () => {
  const STOP = 'node bin/harnessed-stop-hook.mjs'
  const STOP_ABS = join(ROOT, 'bin', 'harnessed-stop-hook.mjs')

  it('normalizes the stop-hook script to the subcommand identity', () => {
    expect(hookScriptMarker(STOP)).toBe('stop-hook')
    expect(hookScriptMarker('"C:/Users/x/harnessed.exe" stop-hook')).toBe('stop-hook')
  })

  it('routes the stop hook to `"<binary>" stop-hook` when compiled', () => {
    const r = resolveHookCommand(STOP, {
      ...deps([STOP_ABS]),
      compiledExecPath: () => 'C:\\Users\\x\\bin\\harnessed.exe',
    })
    expect(r).toBe('"C:/Users/x/bin/harnessed.exe" stop-hook')
  })

  it('npm mode → legacy node+mjs resolution', () => {
    const r = resolveHookCommand(STOP, { ...deps([STOP_ABS]), compiledExecPath: () => null })
    expect(r).toBe(`node "${STOP_ABS.replace(/\\/g, '/')}"`)
  })

  it('stop-hook identity does not collide with inject-state', () => {
    expect(hookScriptMarker(STOP)).not.toBe(hookScriptMarker(INJECT))
  })

  it('cross-form migration for stop-hook (npm ↔ compiled)', () => {
    const marker = hookScriptMarker(STOP)
    const compiledCmd = '"C:/bin/harnessed.exe" stop-hook'
    expect(entryMatchesRegistration({ command: STOP }, STOP, compiledCmd, marker)).toBe(true)
    const e = { hooks: [{ type: 'command', command: compiledCmd }] }
    expect(entryMatchesRegistration(e, STOP, `node ${STOP_ABS}`, marker)).toBe(true)
  })
})

// 4.34.1 (silent-failure fix) — `harnessed check-docs --hook` (doc-discipline-gate,
// 4.34.0) is the first first-party hook whose SEMANTICS live in a trailing flag:
// `--hook` is what makes it a git-commit-only gate; without it the PreToolUse(Bash)
// hook blocks EVERY Bash call. The compiled rewrite only substitutes the TRANSPORT
// (`node <script>` / bare PATH → `"<binary>" <subcommand>`), so every argument after
// the identity token must survive it.
describe('4.34.1 compiled routing preserves args after the identity token', () => {
  const DOCS = 'harnessed check-docs --hook'
  const EXE = 'C:\\Users\\x\\bin\\harnessed.exe'
  const EXE_Q = '"C:/Users/x/bin/harnessed.exe"'
  const compiled = { ...deps([]), compiledExecPath: () => EXE }

  it('check-docs is a first-party identity in the bare-CLI and compiled forms', () => {
    expect(hookScriptMarker(DOCS)).toBe('check-docs')
    expect(hookScriptMarker('"C:/x/harnessed.exe" check-docs --hook')).toBe('check-docs')
  })

  it('routes to the binary AND keeps the trailing --hook flag', () => {
    expect(resolveHookCommand(DOCS, compiled)).toBe(`${EXE_Q} check-docs --hook`)
  })

  it('REGRESSION GUARD (this bug): a compiled rewrite must never drop args after the identity', () => {
    const r = resolveHookCommand(DOCS, compiled)
    // The exact silent failure: `--hook` dropped ⇒ the doc-discipline gate stops
    // being a git-commit check and becomes an unconditional block on every Bash
    // tool call. If anyone breaks tail preservation, this must go red.
    expect(r.startsWith(`${EXE_Q} check-docs`)).toBe(true) // routed to the binary…
    expect(r).not.toBe(`${EXE_Q} check-docs`) // …but NOT stripped to a bare gate
    expect(r.split(/\s+/).slice(2)).toEqual(['--hook'])
    // generic invariant: raw's post-identity tail is preserved verbatim, in order
    const tail = DOCS.split(/\s+/).slice(DOCS.split(/\s+/).indexOf('check-docs') + 1)
    expect(r.split(/\s+/).slice(2)).toEqual(tail)
  })

  it('generalizes to the mjs-script forms (tail after the script token survives)', () => {
    const r = resolveHookCommand('node bin/harnessed-stop-hook.mjs --verbose --cap=2', compiled)
    expect(r).toBe(`${EXE_Q} stop-hook --verbose --cap=2`)
  })

  it('no trailing args → byte-identical to the 4.27.0/4.30.0 form (zero behavior change)', () => {
    expect(resolveHookCommand(INJECT, compiled)).toBe(`${EXE_Q} inject-state`)
    expect(resolveHookCommand('node bin/harnessed-stop-hook.mjs', compiled)).toBe(
      `${EXE_Q} stop-hook`,
    )
  })

  it('npm mode leaves the bare-CLI hook command verbatim (harnessed resolves on PATH)', () => {
    expect(resolveHookCommand(DOCS, { ...deps([]), compiledExecPath: () => null })).toBe(DOCS)
    expect(resolveHookCommand(DOCS, deps([]))).toBe(DOCS)
  })

  it('cross-form identity: bare-CLI entry ↔ compiled registration migrate/dedupe', () => {
    const marker = hookScriptMarker(DOCS)
    const compiledCmd = `${EXE_Q} check-docs --hook`
    expect(entryMatchesRegistration({ command: DOCS }, DOCS, compiledCmd, marker)).toBe(true)
    const e = { hooks: [{ type: 'command', command: compiledCmd }] }
    expect(entryMatchesRegistration(e, DOCS, DOCS, marker)).toBe(true)
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
  const resolved = `node ${INJECT_ABS_CMD}`
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
