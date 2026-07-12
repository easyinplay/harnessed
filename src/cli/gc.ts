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
import { basename, dirname, join } from 'node:path'
import type { Command } from 'commander'
import pkg from '../../package.json' with { type: 'json' }
import { t } from '../i18n/index.js'
import { getBackupRoot } from '../installers/lib/backup.js'

// ── 4.27.0 (B3 Slice 1, T5 / D7) — compiled-artifact gc ─────────────────────
// Sweeps three self-update leftovers (CEO plan rev2 issue 5 + rev3 issue 3):
//   assets/<ver>       keep-set = {running version, newly installed version}
//                      (post-update the old process's pkg.version ≠ the new
//                      binary's — both stay; entry.ts re-unpacks on demand so
//                      an over-eager delete self-heals)
//   bin-backup/<ver>   keep newest 1 (E4 rollback net)
//   <execDir>/<base>.bak-*  Windows EPERM leftovers (the running image cannot
//                      delete itself; the NEXT run sweeps it)
// Fail-soft everywhere — gc must never break the command that invoked it.

export interface CompiledGcResult {
  removed: string[]
  kept: string[]
}

export async function gcCompiledArtifacts(opts: {
  keepVersions: string[]
  stateRoot: string
  execPath?: string | null
  dryRun?: boolean
}): Promise<CompiledGcResult> {
  const removed: string[] = []
  const kept: string[] = []
  const keep = new Set(opts.keepVersions)

  // assets/<ver> — remove versions outside the keep-set
  try {
    const assetsDir = join(opts.stateRoot, 'assets')
    for (const e of await readdir(assetsDir, { withFileTypes: true })) {
      if (!e.isDirectory()) continue
      const p = join(assetsDir, e.name)
      if (keep.has(e.name)) {
        kept.push(p)
        continue
      }
      removed.push(p)
      if (!opts.dryRun) await rm(p, { recursive: true, force: true })
    }
  } catch {
    /* no assets dir — npm mode or fresh install */
  }

  // bin-backup/<ver> — keep the newest 1 (name-sorted; versions sort well enough
  // for "newest": ties only matter across a single update boundary)
  try {
    const backupDir = join(opts.stateRoot, 'bin-backup')
    const vers = (await readdir(backupDir, { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort()
    for (const v of vers.slice(0, -1)) {
      const p = join(backupDir, v)
      removed.push(p)
      if (!opts.dryRun) await rm(p, { recursive: true, force: true })
    }
    const newest = vers[vers.length - 1]
    if (newest) kept.push(join(backupDir, newest))
  } catch {
    /* no bin-backup dir */
  }

  // <execDir>/<base>.bak-* — self-update leftovers next to the binary
  if (opts.execPath) {
    try {
      const dir = dirname(opts.execPath)
      const base = basename(opts.execPath)
      for (const e of await readdir(dir, { withFileTypes: true })) {
        if (!e.isFile() || !e.name.startsWith(`${base}.bak-`)) continue
        const p = join(dir, e.name)
        removed.push(p)
        if (!opts.dryRun) await rm(p, { force: true })
      }
    } catch {
      /* unreadable exec dir */
    }
  }

  return { removed, kept }
}

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
      // Most-recent `keepLast` are protected. NOTE: slice(-0) === slice(0) returns
      // the WHOLE array (JS -0===0), so a guard is required or default keepLast=0
      // would protect everything → gc deletes nothing (v4.1.3 fix).
      const kept = new Set(keepLast > 0 ? dirs.slice(-keepLast) : [])
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

      // 4.27.0 (B3 T5) — compiled-artifact pass. Gated on the compiled runtime
      // (assets/bin-backup/.bak-* only ever exist from binary runs; an npm/dev
      // invocation — including vitest — must never sweep the REAL state root).
      try {
        const { isCompiledRuntime } = await import('./lib/assetsRoot.js')
        if (isCompiledRuntime() || process.env.HARNESSED_GC_COMPILED === '1') {
          const { detectPlatform } = await import('../installers/lib/platform.js')
          const r = await gcCompiledArtifacts({
            keepVersions: [pkg.version],
            stateRoot: detectPlatform().stateRoot,
            execPath: isCompiledRuntime() ? process.execPath : null,
            dryRun,
          })
          if (r.removed.length > 0) {
            console.log(
              `  compiled artifacts ${dryRun ? 'to remove' : 'removed'}: ${r.removed.length}`,
            )
            for (const p of r.removed) console.log(`    ${p}`)
          }
        }
      } catch {
        /* advisory — gc never fails the command */
      }
    })
}
