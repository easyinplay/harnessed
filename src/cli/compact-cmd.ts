// harnessed compact — evict resolved sub-progress ledger entries to reduce context size.
// Phase 14.
import type { Command } from 'commander'
import { compactWorkflow } from '../checkpoint/compact.js'

export function registerCompact(program: Command): void {
  program
    .command('compact')
    .description('Evict resolved checkpoint ledger entries to reduce context size')
    .action(async () => {
      const result = await compactWorkflow()
      if (result.evicted === 0) {
        console.log('[compact] nothing to evict (all pending or empty ledger)')
        return
      }
      console.log(
        `[compact] phase=${result.phase} evicted=${result.evicted} pct_saved=${result.pct_saved}% kept=${result.kept.length}`,
      )
    })
}
