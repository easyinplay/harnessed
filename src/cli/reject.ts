// `harnessed reject <sub>` — G7-lite. Mark a seeded sub as user-abandoned (terminal,
// distinct from `failed` which is retryable + drives G6). nextPending ignores it.
// Sister: the fail action in src/cli/checkpoint.ts (mutateSubProgress + markSub).

import type { Command } from 'commander'
import { checkPathSafe } from '../manifest/lib/path-guard.js'

export function registerReject(program: Command): void {
  program
    .command('reject <sub>')
    .description('Mark a sub-workflow as user-rejected (terminal; distinct from failed)')
    .action(async (sub: string) => {
      try {
        checkPathSafe(sub)
      } catch {
        console.error('[harnessed] reject: invalid sub name (path traversal rejected)')
        process.exit(1)
        return
      }
      const { mutateSubProgress } = await import('../checkpoint/state.js')
      const { markSub } = await import('../checkpoint/ledger.js')
      let touched = false
      await mutateSubProgress((entries) => {
        if (!entries.some((e) => e.sub === sub)) return entries
        touched = true
        return markSub(entries, sub, 'rejected')
      })
      if (touched) {
        console.log(`[harnessed] rejected: ${sub}`)
        process.exit(0)
      } else {
        console.error(`[harnessed] reject: sub '${sub}' not found in the active ledger`)
        process.exit(1)
      }
    })
}
