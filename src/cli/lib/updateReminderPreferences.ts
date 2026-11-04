// Phase 84 T1 (R3) — the ONE reader for `update-reminder-preferences.json`.
//
// The file used to have three readers with three different semantics (the
// compiled reminder entrypoint, the owned-state refresh, and setup's writer).
// They disagreed about what a missing file means and about how a broken file
// is treated. Every read now goes through this module, so the consent
// semantics live in exactly one place.
//
// Two consents, deliberately INDEPENDENT of each other:
//   - `enabled`    → the "a new version is available" reminder may run.
//   - `autoUpdate` → the background worker may replace the binary itself.
// A user who silenced the reminder must not silently lose an auto-update
// consent they already granted (and vice versa) — gating `autoUpdate` on
// `enabled` is what made "auto-update on" a switch that never fires.

import { closeSync, constants, fstatSync, openSync, readSync } from 'node:fs'

export interface UpdateReminderPreferences {
  /** Reminder consent — may the "a new version is available" notice run? */
  enabled: boolean
  /** Auto-update consent — may the background worker replace the binary? */
  autoUpdate: boolean
  /** The file exists but could not be parsed (corrupt / not a plain file). */
  unreadable: boolean
}

/** The raw read result, before the consent view is derived from it. */
type RawPreferences =
  | { kind: 'missing' }
  | { kind: 'unreadable' }
  | { kind: 'parsed'; value: unknown }

export interface UpdateReminderPreferencesFile {
  /** The canonical consent view (see {@link readUpdateReminderPreferences}). */
  preferences: UpdateReminderPreferences
  /** True when the preferences file does not exist at all (ENOENT). */
  missing: boolean
  /** The parsed file content when it is a JSON object; null otherwise. */
  document: Record<string, unknown> | null
}

// The file holds a handful of fields; anything bigger is not one of ours and
// must not be pulled into memory wholesale.
const MAX_PREFERENCES_BYTES = 64 * 1024

function readRaw(path: string): RawPreferences {
  let descriptor: number | undefined
  try {
    // O_NONBLOCK + the isFile() guard keep a FIFO/device parked on this path
    // from blocking the caller (the compiled entrypoint runs on every
    // session start).
    descriptor = openSync(path, constants.O_RDONLY | constants.O_NONBLOCK)
    const info = fstatSync(descriptor)
    if (!info.isFile() || info.size > MAX_PREFERENCES_BYTES) return { kind: 'unreadable' }
    const buffer = Buffer.alloc(info.size)
    const bytes = readSync(descriptor, buffer, 0, buffer.length, 0)
    return { kind: 'parsed', value: JSON.parse(buffer.toString('utf8', 0, bytes)) }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { kind: 'missing' }
    return { kind: 'unreadable' }
  } finally {
    if (descriptor !== undefined) {
      try {
        closeSync(descriptor)
      } catch {}
    }
  }
}

/**
 * Reads the preferences file and returns both the canonical consent view and
 * the raw document.
 *
 * The raw document is exposed because two callers need more than the consent
 * view: the reminder readers still gate on the on-disk `schemaVersion`, and
 * setup's writer must preserve every key it does not own (a full overwrite
 * would revoke an `autoUpdate` consent the user granted).
 *
 * Never throws; the file is opened and read at most once.
 */
export function readUpdateReminderPreferencesFile(path: string): UpdateReminderPreferencesFile {
  const raw = readRaw(path)
  if (raw.kind === 'missing') {
    // A missing preferences file means the reminder is ON — the reminder is
    // opt-out, not opt-in. This is the semantics every reader had before
    // this module existed, so it must not drift here.
    return {
      preferences: { enabled: true, autoUpdate: false, unreadable: false },
      missing: true,
      document: null,
    }
  }
  if (raw.kind === 'unreadable') {
    // Corrupt or unreadable → fail closed on BOTH consents: a broken file
    // must not leave a machine auto-updating itself.
    return {
      preferences: { enabled: false, autoUpdate: false, unreadable: true },
      missing: false,
      document: null,
    }
  }
  const value = raw.value
  const record =
    typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
  return {
    preferences: {
      enabled: record.enabled === true,
      // `autoUpdate` is INDEPENDENT of `enabled` — two separate consents.
      // Only a strict `true` counts; anything else is off.
      autoUpdate: record.autoUpdate === true,
      unreadable: false,
    },
    missing: false,
    document: typeof value === 'object' && value !== null ? record : null,
  }
}

/**
 * The canonical reader for `update-reminder-preferences.json`.
 *
 * - file missing → `{ enabled: true, autoUpdate: false, unreadable: false }`
 * - file unparseable → `{ enabled: false, autoUpdate: false, unreadable: true }`
 * - otherwise `enabled` / `autoUpdate` are true only when the field is
 *   strictly `true`; `autoUpdate` does not depend on `enabled`.
 */
export function readUpdateReminderPreferences(path: string): UpdateReminderPreferences {
  return readUpdateReminderPreferencesFile(path).preferences
}
