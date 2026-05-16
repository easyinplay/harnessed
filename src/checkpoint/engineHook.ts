// src/checkpoint/engineHook.ts — Phase 3.1 W3 T3.2 (W-01 orchestrator promote PRIMARY).
// Extracted from engine.ts to keep engine.ts ≤200L Karpathy hard limit clean.
// Single responsibility: bridge engine.ts events → current-workflow.json +
// checkpoint.json double-write. Analog: src/routing/lib/sdkReconcile.ts ≤56L
// (Phase 2.2 helper extract pattern for testability).
// D-04 WIRE-IN LOCKED + W-04 mitigation (phaseId="unknown" warn-only fail-loud).

import { SCHEMA_VERSIONS } from '../types/schemaVersion.js'
import { activate as stateActivate, complete as stateComplete } from './state.js'
import { writeCheckpoint } from './template.js'

export interface EngineCheckpointHookCtx {
  phaseId: string
  sessionId?: string
  status: 'active' | 'complete' // 'paused' goes through sigintTrap.ts (W4), not this hook
  lastTask?: string
  keyDecisions?: string[]
  canonicalRefs?: string[]
}

/** Activate workflow + return projected checkpoint path on phase start. */
export async function activatePhase(phaseId: string): Promise<{ checkpointPath: string }> {
  const checkpointPath = `.harnessed/checkpoints/${phaseId}.json`
  await stateActivate(phaseId, checkpointPath)
  return { checkpointPath }
}

/** Write final checkpoint envelope + transition workflow status='complete' on success. */
export async function completePhase(ctx: EngineCheckpointHookCtx): Promise<void> {
  if (ctx.phaseId === 'unknown') {
    console.error(
      '[harnessed] WARN engineHook: phaseId="unknown" — checkpoint paths fall back to .harnessed/checkpoints/unknown.json (Karpathy fail-loud non-blocking; W-04 mitigation)',
    )
  }
  writeCheckpoint({
    schemaVersion: SCHEMA_VERSIONS.checkpoint,
    phase: ctx.phaseId,
    status: 'complete',
    last_task: ctx.lastTask ?? 'engine.runRouting complete',
    key_decisions: ctx.keyDecisions ?? [],
    canonical_refs: ctx.canonicalRefs ?? [],
    ...(ctx.sessionId ? { session_id: ctx.sessionId } : {}),
    cwd: process.cwd(),
    timestamp: new Date().toISOString(),
    archive_path: `.harnessed/archive/phase-${ctx.phaseId}/`,
  })
  await stateComplete()
}
