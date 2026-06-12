// src/checkpoint/recovery.ts — G3 structured recovery actions. Pure mapper from the
// ledger's sub-states to human next-actions (comet `check --recover` analog). Used by
// runResume to translate "where am I" into "what to do next" after a compaction resume.

import type { SubProgressEntryType } from './schema/currentWorkflow.v1.js'

export function recoveryActions(ledger: SubProgressEntryType[]): string[] {
  const actions: string[] = []
  for (const e of ledger) {
    if (e.status === 'pending') actions.push(`run sub ${e.sub}`)
    else if (e.status === 'failed')
      actions.push(`sub ${e.sub} failed ${e.fail_count ?? 1}x — investigate before retry`)
  }
  if (actions.length === 0) return ['all subs resolved — run: harnessed next']
  return actions
}
