// Phase 2.2 Wave 2 T2.2 — Unified COMPLETION_SCHEMA (D2.2-1 / RESEARCH § 1.4).
// ADR 0011 errata — dual-signal completion 4-layer (phase 2.2 W2 — F4).
//
// IMPL NOTE — RESEARCH § 1.4 establishes ONE schema shared across the 4-phase
// execute-task chain (01-clarify / 02-code / 03-test / 04-deliver). Karpathy
// YAGNI: per-phase schema variants are NOT needed — a single status/phase
// discriminator + free-form summary + optional blockers covers every phase's
// completion semantics. Consumer at `isComplete()` (lib/ralphLoop.ts) branches
// on `status === 'COMPLETE'`. PRIMARY signal — see SC3 plan-fork
// (`outputFormat: { type: 'json_schema', schema: COMPLETION_SCHEMA }`).

export const COMPLETION_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['COMPLETE', 'PARTIAL', 'BLOCKED'] },
    phase: { type: 'string', enum: ['01-clarify', '02-code', '03-test', '04-deliver'] },
    summary: { type: 'string' },
    blockers: { type: 'array', items: { type: 'string' } },
  },
  required: ['status', 'phase'],
} as const

export type CompletionStatus = 'COMPLETE' | 'PARTIAL' | 'BLOCKED'
export type CompletionPhase = '01-clarify' | '02-code' | '03-test' | '04-deliver'

/** SDK result envelope shape consumed by lib/ralphLoop.ts `isComplete` 4-layer
 *  detect. Mirrors `SDKResultMessage` (sdk.d.ts) — only the fields we read. */
export interface SdkResultEnvelope {
  subtype?: string
  structured_output?: { status?: CompletionStatus }
  text?: string
  result?: string
}
