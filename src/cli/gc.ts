// Phase 1.2 cli subcommand `gc` per ADR 0004 § Consequences Negative #3 +
// sister review M1 mitigation.
//
// IMPL NOTE (Rule 1 / ADR 0004 § Consequences Negative #3): backup snapshots
// accumulate without bound; users will eventually fill disk. The M1 sister
// review fix promotes `harnessed gc --older-than 30d` from "phase 2.4
// deferred" to "phase 1.2 ship" because the failure mode is silent (users
// only notice when df -h is red), and ADR 0004 § Consequences explicitly
// names this as the chosen mitigation.
//
// IMPL NOTE (v3.0.1 UX flip — apply-immediate default + --dry-run opt-in):
// gc follows the unified apply-immediate default convention (sister
// install.ts pattern verbatim). Without flags → delete candidates。
// `--dry-run` opt-in 列出 candidates 但不真删 (高级用户预览)。
// v3.3.0 cleanup — `--apply` backward-compat alias removed (was no-op since v3.0.1)。
// keepLast + olderThan filter 仍 protect 误删近期 snapshot (safety contract)。

import { readdir, readFile, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
import type { Command } from 'commander'
import { t } from '../i18n/index.js'
import { getBackupRoot } from '../installers/lib/backup.js'

interface BackupMetadata {
  installer: string
  manifest: string
  timestamp: string
  files: unknown[]
}

interface GcOpts {
  olderThan?: string
  keepLast?: string
  dryRun?: boolean
}

const DURATION_RE = /^(\d+)([dhmw])$/
function parseDuration(s: string): number | null {
  const m = DURATION_RE.exec(s)
  if (!m) return null
  const n = Number.parseInt(m[1] ?? '0', 10)
  const unit = m[2]
  const ms =
    unit === 'd' ? 86_400_000 : unit === 'h' ? 3_600_000 : unit === 'm' ? 60_000 : 604_800_000
  return n * ms
}

async function dirSizeKb(dir: string): Promise<number> {
  let total = 0
  const stack: string[] = [dir]
  while (stack.length > 0) {
    const cur = stack.pop()
    if (!cur) break
    const entries = await readdir(cur, { withFileTypes: true })
    for (const e of entries) {
      const p = join(cur, e.name)
      if (e.isDirectory()) stack.push(p)
      else if (e.isFile()) {
        const st = await stat(p)
        total += st.size
      }
    }
  }
  return Math.round(total / 1024)
}

export function registerGc(program: Command): void {
  program
    .command('gc')
    .description(
      'Garbage-collect old backup snapshots (immediate by default — use --dry-run for preview)',
    )
    .option('--older-than <duration>', 'delete snapshots older than (e.g. 30d / 24h / 4w)', '30d')
    .option('--keep-last <N>', 'always keep the most recent N snapshots', '0')
    .option('--dry-run', 'preview only — do not delete (opt-in for advanced users)')
    .action(async (opts: GcOpts) => {
      // v3.0.1 UX flip — apply-immediate default + --dry-run opt-in。
      const dryRun = opts.dryRun === true
      const olderMs = parseDuration(opts.olderThan ?? '30d')
      if (olderMs == null) {
        console.error(
          `${t('gc.invalid_duration', { value: opts.olderThan ?? '' })}\n${t('gc.invalid_duration.fix')}`,
        )
        process.exit(1)
        return
      }
      const keepLast = Number.parseInt(opts.keepLast ?? '0', 10)
      const root = getBackupRoot()
      let dirs: string[]
      try {
        dirs = (await readdir(root, { withFileTypes: true }))
          .filter((e) => e.isDirectory())
          .map((e) => e.name)
          .sort()
      } catch {
        console.log(t('gc.no_backups', { root }))
        return
      }
      const cutoff = Date.now() - olderMs
      // Reverse so most-recent come first; first `keepLast` are protected.
      const kept = new Set(dirs.slice(-keepLast))
      const candidates: Array<{ ts: string; path: string; manifest: string; sizeKb: number }> = []
      for (const ts of dirs) {
        if (kept.has(ts)) continue
        const path = join(root, ts)
        // Backup ID is ISO timestamp with `:` → `-`; reverse to parse.
        const iso = ts.replace(/T(\d{2})-(\d{2})-(\d{2})/, 'T$1:$2:$3')
        const t = Date.parse(iso)
        if (Number.isNaN(t) || t > cutoff) continue
        let manifest = '(unknown)'
        try {
          const meta = JSON.parse(
            await readFile(join(path, 'metadata.json'), 'utf8'),
          ) as BackupMetadata
          manifest = meta.manifest
        } catch {
          // metadata missing — still gc by age
        }
        const sizeKb = await dirSizeKb(path)
        candidates.push({ ts, path, manifest, sizeKb })
      }
      if (candidates.length === 0) {
        console.log(
          t('gc.no_old_snapshots', { cutoff: opts.olderThan ?? '', keptCount: kept.size }),
        )
        return
      }
      const totalKb = candidates.reduce((a, c) => a + c.sizeKb, 0)
      const key = dryRun ? 'gc.summary_will_delete' : 'gc.summary_deleting'
      console.log(t(key, { count: candidates.length, sizeKb: totalKb }))
      for (const c of candidates) {
        console.log(`  ${c.ts}  ${c.manifest}  (${c.sizeKb} KB)`)
        if (!dryRun) await rm(c.path, { recursive: true, force: true })
      }
      if (dryRun) console.log(t('gc.dry_run_rerun_hint'))
    })
}
