// Phase 1.2 cli subcommand `status` per ADR 0004 contract 6 + Pattern C.
//
// Reads .harnessed/state.json (lib/state.ts SSOT) and prints installed
// upstreams, their pinned version, and install timestamp. Partial-install
// state (ADR 0004 contract 6) is reported when state.json contains an entry
// without a matching backup snapshot or vice versa — phase 1.2 minimum
// uses the readState() default-on-ENOENT idiom and treats absence as
// "nothing installed yet" (not an error).

import type { Command } from 'commander'
import { readState } from '../installers/lib/state.js'

export function registerStatus(program: Command): void {
  program
    .command('status')
    .description('Show installed upstreams (from .harnessed/state.json)')
    .action(async () => {
      const state = await readState(process.cwd())
      const names = Object.keys(state.installed).sort()
      if (names.length === 0) {
        console.log('no installs recorded (.harnessed/state.json absent or empty)')
        return
      }
      for (const n of names) {
        const e = state.installed[n]
        if (!e) continue
        console.log(`${n} @ ${e.version}  (installed ${e.installedAt})`)
      }
      console.log(`\n${names.length} install${names.length === 1 ? '' : 's'} recorded`)
    })
}
