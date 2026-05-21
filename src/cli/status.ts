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
import { getHarnessedRoot, harnessedFile } from '../installers/lib/harnessedRoot.js'
import { readState } from '../installers/lib/state.js'

export function registerStatus(program: Command): void {
  program
    .command('status')
    .description('Show installed upstreams (from <harnessed-root>/state.json)')
    .action(async () => {
      const state = await readState(process.cwd())
      const names = Object.keys(state.installed).sort()
      if (names.length === 0) {
        console.log(`no installs recorded (${harnessedFile('state.json')} absent or empty)`)
      } else {
        for (const n of names) {
          const e = state.installed[n]
          if (!e) continue
          console.log(`${n} @ ${e.version}  (installed ${e.installedAt})`)
        }
        console.log(`\n${names.length} install${names.length === 1 ? '' : 's'} recorded`)
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
          console.log(`\nlock: held (since ${s.mtime.toISOString()})${stale ? ' — STALE' : ''}`)
          console.log(`  to release: wait for process to finish or delete ${lockPath}`)
        } else {
          console.log('\nlock: free')
        }
      } catch {
        // harnessed root absent or inaccessible = no lock; silent per D-07
      }
    })
}
