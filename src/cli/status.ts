// Phase 1.2 cli subcommand `status` per ADR 0004 contract 6 + Pattern C.
//
// Reads <harnessed-root>/state.json (lib/state.ts SSOT) and prints installed
// upstreams, their pinned version, and install timestamp. Partial-install
// state (ADR 0004 contract 6) is reported when state.json contains an entry
// without a matching backup snapshot or vice versa — phase 1.2 minimum
// uses the readState() default-on-ENOENT idiom and treats absence as
// "nothing installed yet" (not an error).
//
// Phase 5.1 W2 T2.5 — D-07 lock holder display: reads <harnessed-root>/.lock
// content (proper-lockfile mtime) + stale auto-detect 10s indicator.
// v3.0.3 — paths routed through harnessedRoot SoT (homedir-rooted).

import { stat } from 'node:fs/promises'
import type { Command } from 'commander'
import lockfile from 'proper-lockfile'
import { detectDrift } from '../checkpoint/evidence.js'
import { nextPending } from '../checkpoint/ledger.js'
import type { SubProgressEntryType } from '../checkpoint/schema/index.js'
import { readCurrentWorkflow } from '../checkpoint/state.js'
import { t } from '../i18n/index.js'
import { getHarnessedRoot, harnessedFile } from '../installers/lib/harnessedRoot.js'
import { readState } from '../installers/lib/state.js'

/** v5.0 Spec 1 (B) — status marker per sub `status` (design §7 sample). */
export function statusMarker(status: SubProgressEntryType['status']): string {
  switch (status) {
    case 'done':
      return '✅ done'
    case 'pending':
      return '⏳ pending'
    case 'failed':
      return '✗ failed'
    case 'skipped':
      return '⬜ skipped'
    case 'rejected':
      return '🚫 rejected'
  }
}

/** v5.0 Spec 1 (D2) — evidence posture, rendered DISTINCTLY. `none_declared`
 *  must never read as a verified pass; an entry with no posture recorded yet
 *  also reads as none_declared (no evidence asserted). */
function evidenceLabel(entry: SubProgressEntryType): string {
  switch (entry.evidence_status) {
    case 'verified':
      return 'evidence: verified'
    case 'overridden':
      return 'evidence: overridden (--force)'
    default:
      return 'evidence: none_declared'
  }
}

/** v5.0 Spec 1 (B + F) — build the `status --recover` output lines from a ledger.
 *  Pure over the supplied ledger except for the drift re-hash (detectDrift does the
 *  fs touch). Empty ledger degrades gracefully (D3). Returns the lines to print so
 *  the formatting is testable without capturing stdout. */
export async function buildRecoverLines(
  workflow: { phase: string; status: string; started_at: string } | null,
  ledger: SubProgressEntryType[],
): Promise<string[]> {
  const lines: string[] = []
  if (!workflow || ledger.length === 0) {
    lines.push('no ledger — run gates + start')
    return lines
  }

  lines.push(`workflow: ${workflow.phase} (${workflow.status})  started ${workflow.started_at}`)

  const next = nextPending(ledger)
  for (const e of ledger) {
    const marker = statusMarker(e.status)
    // P1-4 — evidence posture is only meaningful for a COMPLETED sub. A `pending`
    // or `failed` sub asserts no evidence; rendering `evidence: none_declared`
    // there reads as a misleading "✗ failed … none_declared". `skipped` shows its
    // reason; `done` shows the posture; `pending`/`failed` show neither.
    let suffix = ''
    if (e.status === 'skipped') {
      suffix = e.reason ? `  (skipped: ${e.reason})` : ''
    } else if (e.status === 'done') {
      suffix = `  ${evidenceLabel(e)}`
    }
    const arrow = e.sub === next ? '   ← next' : ''
    lines.push(`  ${e.sub}  ${marker}${suffix}${arrow}`)
  }

  if (next) {
    lines.push(`→ next: harnessed prompt ${next}`)
  } else {
    lines.push('→ all subs resolved (no pending work)')
  }

  // F — re-hash each entry's evidence; emit drift warnings (warn, never block).
  for (const e of ledger) {
    if (!e.evidence || e.evidence.length === 0) continue
    const drift = await detectDrift(e.evidence)
    for (const d of drift) {
      const now = d.now === '' ? 'missing' : `${d.now.slice(0, 7)}…`
      lines.push(`⚠ drift: ${d.path} sha256 changed (was ${d.was.slice(0, 7)}…, now ${now})`)
    }
  }

  return lines
}

export function registerStatus(program: Command): void {
  program
    .command('status')
    .description('Show installed upstreams (from <harnessed-root>/state.json)')
    .option('--recover', 'structured recovery view of the active workflow ledger (v5.0 Spec 1 B)')
    .action(async (opts: { recover?: boolean }) => {
      if (opts.recover) {
        const wf = await readCurrentWorkflow()
        const ledger = wf?.sub_progress ?? []
        const lines = await buildRecoverLines(wf, ledger)
        for (const l of lines) console.log(l)
        return
      }
      const state = await readState(process.cwd())
      const names = Object.keys(state.installed).sort()
      if (names.length === 0) {
        console.log(t('status.no_installs', { path: harnessedFile('state.json') }))
      } else {
        for (const n of names) {
          const e = state.installed[n]
          if (!e) continue
          console.log(`${n} @ ${e.version}  (installed ${e.installedAt})`)
        }
        console.log(t('status.summary_installs', { count: names.length }))
      }

      // D-07 LOCKED — display lock holder pid + mtime + stale indicator
      // proper-lockfile.check() returns true when lock is currently held
      const lockPath = harnessedFile('.lock')
      try {
        const isLocked = await lockfile.check(getHarnessedRoot(), {
          lockfilePath: lockPath,
          stale: 10_000,
        })
        if (isLocked) {
          const s = await stat(lockPath)
          const ageMs = Date.now() - s.mtime.getTime()
          const stale = ageMs > 10_000
          console.log(
            t('status.lock_held', {
              since: s.mtime.toISOString(),
              staleSuffix: stale ? t('status.lock_held.stale_suffix') : '',
            }),
          )
          console.log(t('status.lock_release_hint', { path: lockPath }))
        } else {
          console.log(t('status.lock_free'))
        }
      } catch {
        // harnessed root absent or inaccessible = no lock; silent per D-07
      }
    })
}
