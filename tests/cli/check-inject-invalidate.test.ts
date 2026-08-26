// 4.38.0 — perturn-inject and its SessionStart invalidation half are two
// separate optional manifests (cc-hook-add registers exactly one hook per
// manifest, and the schema has no `requires` field). A user who takes the
// first without the second silently keeps the 4.25.0 blind-timer behaviour;
// this check is the only thing that says so out loud.

import { describe, expect, it } from 'vitest'
import { checkInjectInvalidate } from '../../src/cli/lib/check-inject-invalidate.js'

const deps = (raw: string | null) => ({ settingsPath: '/x/settings.json', readText: () => raw })

const perTurn = (cmd = 'node "C:/p/bin/harnessed-inject-state.mjs"') => ({
  hooks: [{ type: 'command', command: cmd }],
})
const invalidate = (cmd = 'node "C:/p/bin/harnessed-inject-state.mjs" --invalidate') => ({
  hooks: [{ type: 'command', command: cmd }],
})

describe('checkInjectInvalidate', () => {
  it('no settings.json → pass', () => {
    expect(checkInjectInvalidate(deps(null)).status).toBe('pass')
  })

  it('per-turn injection not installed → pass (nothing to pair with)', () => {
    const raw = JSON.stringify({ hooks: { SessionStart: [] } })
    const r = checkInjectInvalidate(deps(raw))
    expect(r.status).toBe('pass')
    expect(r.message).toContain('not installed')
  })

  it('both halves registered → pass', () => {
    const raw = JSON.stringify({
      hooks: { UserPromptSubmit: [perTurn()], SessionStart: [invalidate()] },
    })
    expect(checkInjectInvalidate(deps(raw)).status).toBe('pass')
  })

  it('per-turn without the SessionStart half → warn + fix', () => {
    const raw = JSON.stringify({ hooks: { UserPromptSubmit: [perTurn()] } })
    const r = checkInjectInvalidate(deps(raw))
    expect(r.status).toBe('warn')
    expect(r.fix).toContain('perturn-inject-invalidate')
  })

  it('compiled-binary forms are recognized on both sides', () => {
    const raw = JSON.stringify({
      hooks: {
        UserPromptSubmit: [perTurn('"C:/p/harnessed.exe" inject-state')],
        SessionStart: [invalidate('"C:/p/harnessed.exe" inject-state --invalidate')],
      },
    })
    expect(checkInjectInvalidate(deps(raw)).status).toBe('pass')
  })

  it('a SessionStart entry WITHOUT --invalidate does not count as the pair', () => {
    const raw = JSON.stringify({
      hooks: {
        UserPromptSubmit: [perTurn()],
        SessionStart: [invalidate('node "C:/p/bin/harnessed-inject-state.mjs"')],
      },
    })
    expect(checkInjectInvalidate(deps(raw)).status).toBe('warn')
  })

  it('malformed settings never throws', () => {
    expect(checkInjectInvalidate(deps('{not json')).status).toBe('pass')
    expect(
      checkInjectInvalidate(deps(JSON.stringify({ hooks: { SessionStart: [null] } }))).status,
    ).toBe('pass')
  })
})
