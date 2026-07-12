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
  // 4.22.0 — a fresh pending intent (caller TTL-filters); surfaces the freestyle
  // signature ("/auto invoked but never engaged") at the top of the recover view.
  intent?: { master: string; ageMs: number } | null,
): Promise<string[]> {
  const lines: string[] = []
  if (intent) {
    const { formatIntentAge } = await import('../checkpoint/injectState.js')
    lines.push(
      `⚠ intent pending: /${intent.master} invoked ${formatIntentAge(intent.ageMs)} ago — ledger not seeded; run \`harnessed gates ${intent.master}\` → \`harnessed checkpoint start ${intent.master} --plan '<gates JSON>'\``,
    )
  }
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
        // 4.22.0 — surface a fresh unabsorbed intent (dynamic import + fail-soft:
        // sibling test files factory-mock workflowStore without readIntent).
        // Ledger-empty gate mirrors the inject bin: a seeded ledger IS engagement,
        // so a re-registered intent on top of it is not worth a warning line.
        let intent: { master: string; ageMs: number } | null = null
        if (ledger.length === 0) {
          try {
            const { readIntent } = await import('../checkpoint/workflowStore.js')
            const { INTENT_TTL_MS } = await import('../checkpoint/injectState.js')
            const raw = await readIntent()
            if (raw) {
              const age = Date.now() - Date.parse(raw.ts)
              if (!Number.isNaN(age) && age >= 0 && age <= INTENT_TTL_MS) {
                intent = { master: raw.master, ageMs: age }
              }
            }
          } catch {
            // no intent surface — recover view degrades to the ledger-only shape
          }
        }
        // 4.23.0 (issue #3 req 1) — a shadowed workflow skill makes the recover
        // view actively misleading ("mid state-machine" while /research runs a
        // foreign skill). Surface the integrity warning FIRST. Fail-soft.
        try {
          const { checkSkillIntegrity } = await import('./lib/check-skill-integrity.js')
          const integ = await checkSkillIntegrity()
          if (integ.status === 'warn') {
            console.warn(`⚠ ${integ.message}`)
            if (integ.fix) console.warn(`    fix: ${integ.fix}`)
          }
        } catch {
          /* advisory only */
        }
        const lines = await buildRecoverLines(wf, ledger, intent)
        for (const l of lines) console.log(l)
        return
      }
      // 4.27.0 (B3 T4 / E2) — discovery loop: surface an available update at the
      // top of `harnessed status`. Shares the 24h cache with doctor (near-zero
      // marginal cost); fail-soft — never blocks or breaks status.
      try {
        const { checkUpdate } = await import('./lib/check-update.js')
        const upd = await checkUpdate()
        if (upd.status === 'warn') console.log(`⚠ ${upd.message} — ${upd.fix ?? ''}`)
      } catch {
        /* advisory only */
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
