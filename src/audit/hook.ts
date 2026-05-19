// src/audit/hook.ts — Phase 4.3 W1 T1.2 (sister engineHook.ts ≤50L PRIMARY helper extract pattern延袭).
// Extracted thin wrapper keeps engine.ts ≤200L Karpathy hard limit clean (HIGH RISK R-1 mitigation).
// Single responsibility: bridge engine.ts outcome → audit log emit (fail-soft sync NO throw).
// W1 T1.3 follow-up: signature derives routeLayer from `matched` + defaults iterCount=null inside
// hook to keep engine.ts call sites single-line (≤200L budget headroom mitigation).

import type { ArbitrateResult, TaskContext } from '../routing/agentDefinition.js'
import type { Rule } from '../routing/decisionRules.js'
import { buildAuditRecord, emitAuditRecord } from './log.js'

export type AuditOutcome =
  | 'complete'
  | 'max-iter'
  | 'verbatim-fail'
  | 'spawn-err'
  | 'install-err'
  | 'arbitrate-err'

export function emitAudit(
  task: TaskContext,
  decision: ArbitrateResult,
  matched: Rule | null,
  outcome: AuditOutcome,
  sessionId?: string,
): void {
  emitAuditRecord(
    buildAuditRecord(task, decision, matched, {
      outcome,
      routeLayer: matched ? 'L1-keyword' : 'L3-fallback',
      sessionId,
      iterCount: null, // Phase 4.3 YAGNI (ralphLoopWrap returns string only; defer v0.5+ per RESEARCH § 7 Q2)
    }),
  )
}
