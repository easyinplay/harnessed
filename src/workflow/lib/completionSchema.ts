// v3.4.4 Phase 6 — hoisted from src/routing/completionSchema.ts (sister Phase 2 sdkSpawn + Phase 3 ralphLoop relocation pattern).
//
// Phase 2.2 Wave 2 T2.2 — Unified COMPLETION_SCHEMA (D2.2-1 / RESEARCH § 1.4).
// ADR 0011 errata — dual-signal completion 4-layer (phase 2.2 W2 — F4).
//
// IMPL NOTE — RESEARCH § 1.4 establishes ONE schema shared across the 4-phase
// task chain (01-clarify / 02-code / 03-test / 04-deliver). Karpathy
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
    // v3.5.0 Phase 2 — Option 1-Lite signal-driven Agent Teams escalation.
    // spawned subagent SHOULD set this when any of parallelism-gate.yaml 5
    // upgrade triggers fire. harnessed runtime propagates to stderr hint;
    // user opens team in main Claude Code session (TeamCreate not exposed to
    // spawned subagents via SDK v0.3.142 — see PHASE-2-SPEC.md § Why).
    needs_teams_escalation: { type: 'boolean' },
    escalation_reason: { type: 'string' },
  },
  required: ['status', 'phase'],
} as const

export type CompletionStatus = 'COMPLETE' | 'PARTIAL' | 'BLOCKED'
export type CompletionPhase = '01-clarify' | '02-code' | '03-test' | '04-deliver'

/** SDK result envelope shape consumed by lib/ralphLoop.ts `isComplete` 4-layer
 *  detect. Mirrors `SDKResultMessage` (sdk.d.ts) — only the fields we read. */
export interface SdkResultEnvelope {
  subtype?: string
  structured_output?: {
    status?: CompletionStatus
    // v3.5.0 Phase 2 — Option 1-Lite escalation fields (D1).
    needs_teams_escalation?: boolean
    escalation_reason?: string
  }
  text?: string
  result?: string
}
