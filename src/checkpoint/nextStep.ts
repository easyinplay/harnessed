// src/checkpoint/nextStep.ts — G2 deterministic next-step contract. Pure resolver
// (schema-type-only) over the ledger; reuses nextPending (ledger.ts). Mirrors comet
// `comet-state next` output: auto | manual | done. autoTransition precedence is
// resolved by the CLI (env > envelope > default) before calling this.

import { nextPending } from './ledger.js'
import type { SubProgressEntryType } from './schema/currentWorkflow.v1.js'

export interface NextStep {
  next: 'auto' | 'manual' | 'done'
  sub?: string
  hint?: string
}

export function resolveNext(ledger: SubProgressEntryType[], autoTransition: boolean): NextStep {
  const sub = nextPending(ledger)
  if (sub === null) return { next: 'done' }
  if (autoTransition) return { next: 'auto', sub }
  return {
    next: 'manual',
    sub,
    hint: `pending sub '${sub}' — run the next step manually to continue`,
  }
}
