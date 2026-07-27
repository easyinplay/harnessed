// v3.4.4 Phase 6 — hoisted from src/routing/completionSchema.ts (sister Phase 2 sdkSpawn + Phase 3 ralphLoop relocation pattern).
//
// Phase 2.2 Wave 2 T2.2 — Unified COMPLETION_SCHEMA (D2.2-1 / RESEARCH § 1.4).
// ADR 0011 errata — dual-signal completion 4-layer (phase 2.2 W2 — F4).
//
// IMPL NOTE — ONE schema shared by EVERY spawn (sdkSpawn hardcodes it as the
// `outputFormat`). Consumers (`isComplete()` in lib/ralphLoop.ts + run.ts's
// dispatch parse) branch ONLY on `status` (and `subtype`) — nothing reads `phase`.
//
// issue #4 — `phase` used to be `required` AND enum-locked to the 4-phase task
// chain (01-clarify / 02-code / 03-test / 04-deliver). But this schema is applied
// to ALL spawns, including discuss / plan / verify / research / retro subs that
// have no such label, so those subs could not produce a schema-valid
// structured_output — making structured completion detection unreachable for them.
// Since no consumer reads `phase`, only `status` is required now; `phase` stays as
// an OPTIONAL, unconstrained self-label (a task sub may still emit '02-code'; a
// non-task sub omits it or free-labels).
export const COMPLETION_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['COMPLETE', 'PARTIAL', 'BLOCKED'] },
    phase: { type: 'string' },
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
  required: ['status'],
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
