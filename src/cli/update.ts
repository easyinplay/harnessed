// Phase 20 — `harnessed update`. GSD `/gsd-update`-style: check the published
// version, self-update (`npm i -g harnessed@latest`), and optionally re-run the
// base manifests to upgrade upstream plugins. Plus `--migration-report` (read-only
// stale-state inventory) and `--check` (report only). Closes the `comet update` gap.
//
// Self-update assumes a global install (the documented `npm install -g harnessed`
// path); the command prints the exact npm invocation, so non-global users see it.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { type Command, Option } from 'commander'
import pkg from '../../package.json' with { type: 'json' }
import { getAssetsRoot, isCompiledRuntime } from '../platform/assetsRoot.js'
import { getHarnessedRoot } from '../platform/harnessedRoot.js'
import { detectPlatform } from '../platform/platform.js'
import { bunExecutable, isBunRuntime } from '../platform/runtime.js'

interface UpdateOpts {
  packageManager?: 'npm' | 'bun'
  check?: boolean
  upstreams?: boolean
  all?: boolean
  migrationReport?: boolean
  dryRun?: boolean
  /** TODOS 3 (4.32.20) — compiled-only: restore a banked binary from
   *  bin-backup/. `true` = newest banked version; a string = that version. */
  rollback?: boolean | string
}

/** 4.27.0 (B3 T2) — compiled-branch flow. Returns true when handled (the npm
 *  flow must not run), false = fall through to npm (safety-valve 'refused').
 *  Exit-code contract: 'error' exits non-zero with the actionable message. */
async function runCompiledFlow(opts: UpdateOpts): Promise<boolean> {
  const hostName = detectPlatform().id === 'codex' ? 'Codex' : 'Claude Code'
  const { realSelfUpdateDeps, runBinaryRollback, runBinarySelfUpdate } = await import(
    './lib/selfUpdateBinary.js'
  )
  // TODOS 3 (4.32.20) — --rollback: restore from bin-backup/ (E4 net) via the
  // same rename dance; the replaced binary is banked first (reversible).
  if (opts.rollback !== undefined && opts.rollback !== false) {
    const r = await runBinaryRollback(realSelfUpdateDeps(), {
      version: typeof opts.rollback === 'string' ? opts.rollback : undefined,
    })
    switch (r.status) {
      case 'refused':
        console.warn(`[harnessed] rollback refused: ${r.reason} — use npm to change versions`)
        process.exit(1)
        return true
      case 'error':
        console.warn(`[harnessed] rollback failed: ${r.message}`)
        process.exit(1)
        return true
      case 'rolled-back':
        console.log(`[harnessed] rolled back ${r.from} → ${r.to} (from ${r.backupUsed}).`)
        console.log(`[harnessed] restart ${hostName} so the restored version takes effect.`)
        process.exit(0)
        return true
    }
  }
  const r = await runBinarySelfUpdate(realSelfUpdateDeps(), {
    dryRun: opts.dryRun === true,
    check: opts.check === true,
  })
  switch (r.status) {
    case 'refused':
      console.warn(`[harnessed] binary self-update refused: ${r.reason} — using the npm flow`)
      return false
    case 'checked':
      console.log(`  installed: ${r.installed}\n  latest:    ${r.latest}\n  status:    ${r.cmp}`)
      process.exit(0)
      return true
    case 'dry-run':
      console.log('[harnessed] update --dry-run (compiled binary) — would run:')
      for (const s of r.steps) console.log(`  - ${s}`)
      process.exit(0)
      return true
    case 'current':
      console.log(`[harnessed] already up to date (${r.version}).`)
      process.exit(0)
      return true
    case 'updated': {
      console.log(`[harnessed] updated ${r.from} → ${r.to}.`)
      if (r.backupDir) console.log(`  previous binary kept at: ${r.backupDir}`)
      if (!r.bakRemoved)
        console.log(
          `  note: ${r.bakPath} left in place (running image / rollback net) — gc sweeps it later`,
        )
      // D7 — opportunistic gc: keep {old, new} asset versions (fail-soft).
      try {
        const { gcCompiledArtifacts } = await import('./gc.js')
        await gcCompiledArtifacts({
          keepVersions: [r.from, r.to],
          stateRoot: detectPlatform().stateRoot,
          execPath: null, // never sweep .bak in the same run that created it
        })
      } catch {
        /* advisory */
      }
      console.log(
        `[harnessed] restart ${hostName} so the new version + hooks take effect. ` +
          `Manual rollback if needed: copy the binary back from the bin-backup dir above.`,
      )
      process.exit(0)
      return true
    }
    case 'error':
      console.warn(`[harnessed] update failed: ${r.message}`)
      process.exit(1)
      return true
  }
}

function npmExecutable(): string {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm'
}

function changelogTop(): string | null {
  try {
    const p = join(getAssetsRoot(), 'CHANGELOG.md')
    if (!existsSync(p)) return null
    const body = readFileSync(p, 'utf8')
    // first "## " section (Keep-a-Changelog entry) bounded for readability
    const start = body.indexOf('\n## ')
    if (start < 0) return null
    const rest = body.slice(start + 1)
    const next = rest.indexOf('\n## ', 1)
    return (next > 0 ? rest.slice(0, next) : rest).trim().slice(0, 1200)
  } catch {
    return null
  }
}

export function registerUpdate(program: Command): void {
  program
    .command('update')
    .description('Update harnessed to the latest version (and, with --upstreams, the base plugins)')
    .option('--check', 'report installed/latest version without installing')
    .option('--upstreams', 're-run the base manifests to upgrade upstream plugins')
    .option('--all', 'alias for --upstreams (self + upstreams)')
    .option('--migration-report', 'read-only inventory of stale harnessed state (deletes nothing)')
    .option('--dry-run', 'preview what the update would do without writing anything')
    .addOption(
      new Option(
        '--package-manager <npm|bun>',
        'package self-update manager (default: npm; explicit choice, not install-source detection)',
      ).choices(['npm', 'bun']),
    )
    .option(
      '--rollback [version]',
      'compiled binary only — restore a previous version from bin-backup/ (default: newest banked)',
    )
    .action(async (opts: UpdateOpts) => {
      if (opts.packageManager !== undefined && isCompiledRuntime()) {
        console.warn(
          '[harnessed] --package-manager is not applicable to compiled binaries; omit it to keep binary self-update (no channel switch).',
        )
        process.exit(1)
        return
      }
      // --migration-report: read-only, no version check, no install.
      if (opts.migrationReport === true) {
        const { collectMigrationReport } = await import('./lib/migration-report.js')
        const items = collectMigrationReport(process.cwd(), getHarnessedRoot())
        console.log('\n  migration report (read-only — nothing is deleted):\n')
        for (const it of items) {
          console.log(`  ${it.present ? 'present' : 'absent '}  ${it.name}`)
          console.log(`           ${it.path}`)
          if (it.present) console.log(`           hint: ${it.hint}`)
        }
        process.exit(0)
      }

      // 4.27.0 (B3 T2, rev3 issue 4) — mode detection BEFORE any npm touch:
      // the npm-flow preflight below exits 0 when npm is unreachable, and
      // compiled machines usually have no npm — a later check would short-
      // circuit the compiled branch forever. Latest source on this branch is
      // GitHub releases/latest, never `npm view`.
      if (isCompiledRuntime()) {
        const handled = await runCompiledFlow(opts)
        if (handled) return
      } else if (opts.rollback !== undefined && opts.rollback !== false) {
        // npm-managed installs version-switch via npm, not bin-backup.
        console.warn(
          opts.packageManager === 'bun'
            ? '[harnessed] --rollback is compiled-binary only; for Bun use `bun add --global harnessed@<version>`'
            : '[harnessed] --rollback is compiled-binary only — on npm use `npm i -g harnessed@<version>`',
        )
        process.exit(1)
      }

      const manager = opts.packageManager ?? 'npm'
      if (isBunRuntime() && opts.packageManager === undefined) {
        console.warn(
          '[harnessed] Bun runtime does not identify the install manager. Keeping the original npm update default; use --package-manager bun explicitly for a Bun-managed package.',
        )
      }
      const { compareVersions, fetchLatestNpmVersion, fetchLatestBunVersion } = await import(
        './lib/version-check.js'
      )
      const latest =
        manager === 'bun' ? await fetchLatestBunVersion() : await fetchLatestNpmVersion()
      if (!latest) {
        console.warn(
          manager === 'bun'
            ? '[harnessed] could not check the latest version via bun info (unavailable, timed out, or invalid output); no update performed. Try again with the selected package manager.'
            : '[harnessed] could not reach npm to check the latest version — try again later',
        )
        process.exit(0)
      }
      const cmp = compareVersions(pkg.version, latest)

      if (opts.check === true) {
        console.log(`  installed: ${pkg.version}\n  latest:    ${latest}\n  status:    ${cmp}`)
        process.exit(0)
      }

      if (cmp === 'behind') {
        if (opts.dryRun === true) {
          console.log(
            `[harnessed] update --dry-run — would run: ${manager === 'bun' ? 'bun add --global' : 'npm i -g'} harnessed@latest (${pkg.version} → ${latest})`,
          )
          process.exit(0)
        }
        console.log(`[harnessed] updating ${pkg.version} → ${latest} ...`)
        if (manager === 'bun') {
          execFileSync(bunExecutable(), ['add', '--global', 'harnessed@latest'], {
            stdio: 'inherit',
            shell: false,
          })
        } else {
          execFileSync(npmExecutable(), ['i', '-g', 'harnessed@latest'], {
            stdio: 'inherit',
            shell: process.platform === 'win32',
          })
        }
        const cl = changelogTop()
        if (cl) console.log(`\n${cl}\n`)
        const hostName = detectPlatform().id === 'codex' ? 'Codex' : 'Claude Code'
        console.log(
          `[harnessed] updated. Restart ${hostName} so the new version + hooks take effect.`,
        )
      } else {
        console.log(`[harnessed] already up to date (${pkg.version}).`)
      }

      if (opts.dryRun === true) {
        if (opts.upstreams === true || opts.all === true)
          console.log(
            '[harnessed] update --dry-run: would re-run base manifests for upstreams; nothing installed.',
          )
        process.exit(0)
        return
      }

      if (opts.upstreams === true || opts.all === true) {
        console.log('[harnessed] re-running base manifests to upgrade upstream plugins ...')
        const { installBaseProfile } = await import('./install-base.js')
        const r = await installBaseProfile({
          apply: true,
          dryRun: false,
          system: false,
          nonInteractive: true,
          fullDiff: false,
          color: 'auto',
        })
        console.log(
          `  upstreams — installed: ${r.installed.length} / already: ${r.alreadyInstalled.length} / skipped: ${r.skipped.length} / failed: ${r.failed.length}`,
        )
      }
      process.exit(0)
    })
}
