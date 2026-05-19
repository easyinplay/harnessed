// src/audit/hook.ts — Phase 4.3 W1 T1.2 (sister engineHook.ts ≤50L PRIMARY helper extract pattern延袭).
// Extracted thin wrapper keeps engine.ts ≤200L Karpathy hard limit clean (HIGH RISK R-1 mitigation).
// Single responsibility: bridge engine.ts outcome → audit log emit (fail-soft sync NO throw).

import type { ArbitrateResult, TaskContext } from '../routing/agentDefinition.js'
import type { Rule } from '../routing/decisionRules.js'
import { buildAuditRecord, emitAuditRecord } from './log.js'

export interface AuditHookCtx {
  outcome: 'complete' | 'max-iter' | 'verbatim-fail' | 'spawn-err' | 'install-err' | 'arbitrate-err'
  routeLayer: 'L1-keyword' | 'L2-semantic-stub' | 'L3-fallback'
  sessionId?: string
  iterCount: null // Phase 4.3: null (ralphLoopWrap returns string only; defer v0.5+ per RESEARCH § 2.6 + § 7 Q2 YAGNI)
}

export function emitAudit(
  task: TaskContext,
  decision: ArbitrateResult,
  matched: Rule | null,
  ctx: AuditHookCtx,
): void {
  const record = buildAuditRecord(task, decision, matched, ctx)
  emitAuditRecord(record)
}
