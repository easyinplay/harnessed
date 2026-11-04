// src/cli/lib/autoUpdateNotice.ts — Phase 84 / T6: the "you were updated"
// notice (D11 / R14 / R16 / R25).
//
// The notice is the user-facing half of the automatic update:
//
//   1. the NEW binary writes it into the status file during the handover.
//      Only the new binary can do this: it owns the NEW assets, so it is the
//      only process that can excerpt the new CHANGELOG section (R14).
//   2. the SessionStart hook of the NEXT session prints it — exactly once.
//      `consumedAt` is stamped right after the print, so the session after
//      that stays quiet (R16). The hook runs on EVERY session start, so a
//      notice that is not consumed would re-print the whole changelog excerpt
//      forever.
//
// A notice whose `to` is empty is HALF-WRITTEN: the worker pre-wrote `from`
// and the handover never finished filling the rest in. Such a notice is never
// printed and never marked consumed — it stays in the status file as a
// diagnostic (R25).

import { t } from '../../i18n/index.js'
import {
  type AutoUpdateNotice,
  readAutoUpdateStatus,
  writeAutoUpdateStatus,
} from './autoUpdateStatus.js'

/** The notice of the status file, or null when there is none. */
export function readAutoUpdateNotice(statusPath: string): AutoUpdateNotice | null {
  return readAutoUpdateStatus(statusPath)?.notice ?? null
}

/**
 * A notice may be printed ONLY when it is complete (`to` non-empty) and
 * unconsumed (`consumedAt === 0`).
 *
 * The empty-`to` rule is the half-written-notice rule (R25): the handover
 * fills `to` in as its last step, so an empty `to` means "not ready yet" —
 * printing it would show a version change that never happened.
 */
export function isPrintableAutoUpdateNotice(notice: AutoUpdateNotice | null): boolean {
  if (!notice) return false
  if (notice.to.trim() === '') return false
  return (notice.consumedAt ?? 0) === 0
}

/**
 * The human text of the notice: the version change, the changelog excerpt and
 * the restart hint (D11).
 */
export function formatAutoUpdateNotice(notice: AutoUpdateNotice): string {
  const host = notice.restart.trim() || 'Claude Code'
  const from = notice.from.trim()
  const lines: string[] = []
  lines.push(
    from
      ? t('auto_update.notice.updated_from', { from, to: notice.to })
      : t('auto_update.notice.updated_to', { to: notice.to }),
  )
  const changelog = notice.changelog.trim()
  // An empty excerpt is not a paragraph of nothing — it is simply omitted.
  if (changelog) lines.push('', changelog)
  lines.push('', t('auto_update.notice.restart', { host }))
  // R8 — on codex the hook re-registration is never applied automatically
  // (`refreshOwnedUpdate.ts` pins `codexHookTrust: 'deny'`), so the hooks stay
  // stale until the user confirms the trust. The notice has to say so, or the
  // user has no idea why the hooks did not change.
  if (host === 'Codex') {
    lines.push(t('auto_update.notice.codex_trust'))
  }
  return lines.join('\n')
}

/**
 * Merge a notice into the status file, keeping every other field.
 *
 * The worker owns `progress` / `lastResult` / `history` and the new binary
 * owns `notice` (R16) — so the merge is read → replace the notice → atomic
 * write, never a full overwrite.
 */
export function writeAutoUpdateNotice(statusPath: string, notice: AutoUpdateNotice): boolean {
  const status = readAutoUpdateStatus(statusPath)
  if (!status) return false
  try {
    writeAutoUpdateStatus(statusPath, { ...status, notice })
    return true
  } catch {
    return false
  }
}

/**
 * Mark the notice as consumed. Returns true when a notice was consumed.
 *
 * A half-written notice is NOT consumed (R25): the handover may still fill it
 * in, and marking it consumed would silently drop the announcement.
 */
export function consumeAutoUpdateNotice(statusPath: string, now: number): boolean {
  const status = readAutoUpdateStatus(statusPath)
  const notice = status?.notice
  if (!status || !notice) return false
  if ((notice.consumedAt ?? 0) !== 0) return false
  if (notice.to.trim() === '') return false
  try {
    writeAutoUpdateStatus(statusPath, { ...status, notice: { ...notice, consumedAt: now } })
    return true
  } catch {
    return false
  }
}
