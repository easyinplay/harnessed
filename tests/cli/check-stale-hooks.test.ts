// issue #8 — doctor stale-hook self-heal probe.

import { describe, expect, it } from 'vitest'
import { checkStaleHooks } from '../../src/cli/lib/check-stale-hooks.js'

const P = '/fake/settings.json'

function withSettings(obj: unknown, exists: (p: string) => boolean = () => false) {
  return checkStaleHooks({
    settingsPath: P,
    readText: () => JSON.stringify(obj),
    exists,
  })
}

describe('checkStaleHooks', () => {
  it('no settings.json → pass', () => {
    const r = checkStaleHooks({ settingsPath: P, readText: () => null, exists: () => false })
    expect(r.status).toBe('pass')
  })

  it('unreadable JSON → pass (skipped)', () => {
    const r = checkStaleHooks({ settingsPath: P, readText: () => '{not json', exists: () => false })
    expect(r.status).toBe('pass')
  })

  it('no hooks → pass', () => {
    expect(withSettings({ env: {} }).status).toBe('pass')
  })

  it('harnessed hook pointing at a MISSING absolute script → warn + fix', () => {
    const r = withSettings(
      {
        hooks: {
          UserPromptSubmit: [
            {
              hooks: [
                {
                  type: 'command',
                  command: 'node "C:/gone/harnessed/bin/harnessed-inject-state.mjs"',
                },
              ],
            },
          ],
        },
      },
      () => false,
    )
    expect(r.status).toBe('warn')
    expect(r.message).toContain('MODULE_NOT_FOUND')
    expect(r.fix).toContain('harnessed uninstall')
    expect(r.fix).toContain(P)
  })

  it('harnessed hook whose script EXISTS → pass (healthy install)', () => {
    const r = withSettings(
      {
        hooks: {
          Stop: [
            {
              hooks: [
                {
                  type: 'command',
                  command: 'node "C:/live/harnessed/bin/harnessed-stop-hook.mjs"',
                },
              ],
            },
          ],
        },
      },
      () => true,
    )
    expect(r.status).toBe('pass')
  })

  it('malformed hooks (null array element) → pass, never throws (warn-never-fail contract)', () => {
    const r = withSettings({ hooks: { Stop: [null, { hooks: [null] }] } }, () => false)
    expect(r.status).toBe('pass')
  })

  it('relative-form harnessed hook (pre-4.20.0 orphan) → warn', () => {
    const r = withSettings(
      {
        hooks: {
          UserPromptSubmit: [{ hooks: [{ command: 'node bin/harnessed-inject-state.mjs' }] }],
        },
      },
      () => true, // exists is irrelevant for a cwd-relative script
    )
    expect(r.status).toBe('warn')
    expect(r.fix).toContain('harnessed uninstall')
  })

  it('unrelated hook pointing nowhere → pass (not ours)', () => {
    const r = withSettings(
      {
        hooks: {
          PreToolUse: [{ hooks: [{ type: 'command', command: 'node "/x/gone/other.mjs"' }] }],
        },
      },
      () => false,
    )
    expect(r.status).toBe('pass')
  })
})
