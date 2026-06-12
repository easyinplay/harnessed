// src/checkpoint/injectState.ts — G4 per-turn breadcrumb. Pure builder: turns the
// current-workflow envelope into a <workflow-state> block for UserPromptSubmit hook
// injection (Trellis inject-workflow-state analog). null -> '' (silent no-op).

import { detectLoop } from './breakLoop.js'
import { nextPending } from './ledger.js'
import type { CurrentWorkflowV1Type } from './schema/currentWorkflow.v1.js'

export function buildWorkflowStateBlock(wf: CurrentWorkflowV1Type | null): string {
  if (!wf) return ''
  const ledger = wf.sub_progress ?? []
  const next = nextPending(ledger)
  const loops = detectLoop(ledger)
  const lines = [
    '<workflow-state>',
    `phase: ${wf.phase}`,
    `status: ${wf.status}`,
    next ? `next: ${next}` : 'next: (none — all subs resolved)',
  ]
  for (const l of loops) {
    lines.push(
      `BREAK-LOOP: sub '${l.sub}' failed ${l.count}x — stop retrying, run break-loop skill`,
    )
  }
  lines.push('</workflow-state>')
  return lines.join('\n')
}
