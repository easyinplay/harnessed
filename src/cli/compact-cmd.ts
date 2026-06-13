// `harnessed compact` — manually evict resolved sub-progress ledger entries to
// shrink the checkpoint state (and the per-turn injected state block). Phase 14.
// The other trigger is auto: `checkpoint complete --tokens <n>` (see checkpoint.ts).
import type { Command } from 'commander'

export function registerCompact(program: Command): void {
  program
    .command('compact')
    .description(
      'Evict resolved (done/skipped/rejected, no fail_count) ledger entries; reports token reduction',
    )
    .action(async () => {
      const { compactWorkflow } = await import('../checkpoint/compact.js')
      const r = await compactWorkflow()
      if (r.evicted === 0) {
        console.log('[harnessed] compact: nothing to evict (all pending/failed or empty ledger)')
        process.exit(0)
        return
      }
      console.log(
        `[harnessed] compact: phase=${r.phase} evicted=${r.evicted} ` +
          `tokens ${r.before_tokens}->${r.after_tokens} (-${r.pct_saved}%) — ${r.digest}`,
      )
      process.exit(0)
    })
}
