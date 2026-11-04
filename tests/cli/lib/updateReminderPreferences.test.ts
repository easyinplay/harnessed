// Phase 84 T1 (R3) — the canonical reader for `update-reminder-preferences.json`.
//
// Before this module the file had three readers with three different
// semantics (compiled reminder entrypoint, owned-state refresh, setup's
// writer). The reader is now the single place where the two consents are
// interpreted:
//
//   - `enabled`    → the "a new version is available" reminder may run.
//   - `autoUpdate` → the background worker may replace the binary itself.
//
// The two consents are INDEPENDENT: silencing the reminder must not silently
// revoke an auto-update consent the user already granted (and vice versa).

import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { readUpdateReminderPreferences } from '../../../src/cli/lib/updateReminderPreferences.js'

function preferencesPath(name = 'update-reminder-preferences.json'): string {
  const dir = mkdtempSync(join(tmpdir(), 'updreminder-'))
  return join(dir, name)
}

function writePreferences(content: string): string {
  const path = preferencesPath()
  writeFileSync(path, content, 'utf8')
  return path
}

describe('readUpdateReminderPreferences', () => {
  it('missing file → reminder on (opt-out), auto-update off', () => {
    expect(readUpdateReminderPreferences(preferencesPath())).toEqual({
      enabled: true,
      autoUpdate: false,
      unreadable: false,
    })
  })

  it('corrupt JSON → unreadable, both consents off (fail-closed)', () => {
    const path = writePreferences('{not json')
    expect(readUpdateReminderPreferences(path)).toEqual({
      enabled: false,
      autoUpdate: false,
      unreadable: true,
    })
  })

  it('enabled:true without autoUpdate → reminder on, auto-update off', () => {
    const path = writePreferences(JSON.stringify({ schemaVersion: 1, enabled: true }))
    expect(readUpdateReminderPreferences(path)).toEqual({
      enabled: true,
      autoUpdate: false,
      unreadable: false,
    })
  })

  it('enabled:true + autoUpdate:true → both consents on', () => {
    const path = writePreferences(
      JSON.stringify({ schemaVersion: 1, enabled: true, autoUpdate: true }),
    )
    expect(readUpdateReminderPreferences(path)).toEqual({
      enabled: true,
      autoUpdate: true,
      unreadable: false,
    })
  })

  it('enabled:false + autoUpdate:true → auto-update stays on (independent consents)', () => {
    const path = writePreferences(
      JSON.stringify({ schemaVersion: 1, enabled: false, autoUpdate: true }),
    )
    expect(readUpdateReminderPreferences(path)).toEqual({
      enabled: false,
      autoUpdate: true,
      unreadable: false,
    })
  })

  it('autoUpdate as a string → treated as false (strict boolean only)', () => {
    const path = writePreferences(
      JSON.stringify({ schemaVersion: 1, enabled: true, autoUpdate: 'true' }),
    )
    expect(readUpdateReminderPreferences(path)).toEqual({
      enabled: true,
      autoUpdate: false,
      unreadable: false,
    })
  })

  it('autoUpdate as a number → treated as false (strict boolean only)', () => {
    const path = writePreferences(
      JSON.stringify({ schemaVersion: 1, enabled: true, autoUpdate: 1 }),
    )
    expect(readUpdateReminderPreferences(path)).toEqual({
      enabled: true,
      autoUpdate: false,
      unreadable: false,
    })
  })

  it('a directory path → does not throw, reported as unreadable', () => {
    const path = preferencesPath()
    mkdirSync(path)
    expect(readUpdateReminderPreferences(path)).toEqual({
      enabled: false,
      autoUpdate: false,
      unreadable: true,
    })
  })
})
