// Phase v2.0-2.4 W1 T2.4.W1.2 — ralph-loop fallback UX handlers (R20.10 acceptance c).
// Sister Phase 2.2 sdkReconcile.ts split pattern (≤80L helper from engine.ts ≤200L
// Karpathy hard limit). PLAN.md L339-368 verbatim UX text per RESEARCH § 7.2.
//
// CONTRACT — fallback config 来自 phases.yaml v2 phase.fallback.max_iterations_exceeded
// (TypeBox schema src/workflow/schema/workflow.ts L38-45 ship by T2.4.W0.1). engine.ts
// catch block delegates here — handler emits full UX text to stderr (PLAN L342-358)
// then process.exit(exit_code). Return type `never` — process.exit unreachable after.

import type { MaxIterationsExceededError, VerbatimCompleteFailError } from '../../workflow/lib/ralphLoop.js'

export interface FallbackMaxIterationsExceededConfig {
  action: 'emit_warning_and_halt'
  message: string
  exit_code: number
}

export interface MaxIterFallbackCtx {
  subtaskSummary: string
  workflowName: string
  phaseId: string
  lastMessage?: string
  maxIterations: number
}

export interface VerbatimFallbackCtx {
  subtaskSummary: string
  workflowName: string
  phaseId: string
}

/** Emit RESEARCH § 7.2 verbatim UX text + process.exit. Yaml `message` placeholder
 *  `{{ args.max_iterations }}` is substituted with actual iter (sister Phase 3.2 W1
 *  T1.6 interpolate.ts STRICT regex 不支持 dot-path — inline minimal substitution). */
export function handleMaxIterationsExceeded(
  err: MaxIterationsExceededError,
  fallback: FallbackMaxIterationsExceededConfig,
  ctx: MaxIterFallbackCtx,
): never {
  const yamlShort = fallback.message.replace(
    /\{\{\s*args\.max_iterations\s*\}\}/g,
    String(ctx.maxIterations),
  )
  const truncated = (ctx.lastMessage ?? '<empty>').slice(0, 500)
  // RESEARCH § 7.2 verbatim UX text (PLAN L342-358).
  const uxText = `❌ ralph-loop max-iterations exceeded (${err.iterations}/${ctx.maxIterations}).
Sub-task: ${ctx.subtaskSummary}
Workflow: ${ctx.workflowName} / phase ${ctx.phaseId}
Last subagent output (truncated): ${truncated}
The subagent attempted ${err.iterations} iterations without emitting verbatim "<promise>COMPLETE</promise>".
This indicates one of:
  1. Sub-task is genuinely incomplete (escalate to user / re-scope)
  2. Subagent is stuck in a loop (review prompt / system instructions)
  3. max-iterations too low (override via --max-iterations <N>, hard upper limit 100)
Manual options:
  A) Continue with current state: \`harnessed workflow resume --skip-completion-gate\`
  B) Re-run from last checkpoint: \`harnessed workflow resume --from-checkpoint\`
  C) Abort cleanly: exit 1
Exit code: ${fallback.exit_code}
${yamlShort}`
  console.error(uxText)
  process.exit(fallback.exit_code)
  throw new Error('unreachable') // satisfies `never` return type for type-checker
}

/** Symmetric handler for VerbatimCompleteFailError (sister ralphLoop.ts L29-34
 *  Phase 2.2 ship). Same fallback config reused; UX text mentions verbatim signal. */
export function handleVerbatimCompleteFail(
  err: VerbatimCompleteFailError,
  fallback: FallbackMaxIterationsExceededConfig,
  ctx: VerbatimFallbackCtx,
): never {
  const truncated = err.lastMessage.slice(0, 500)
  const uxText = `❌ ralph-loop verbatim COMPLETE signal missing (F33 P1).
Sub-task: ${ctx.subtaskSummary}
Workflow: ${ctx.workflowName} / phase ${ctx.phaseId}
Last subagent output (truncated): ${truncated}
The subagent's final message lacked verbatim "<promise>COMPLETE</promise>" tag.
This indicates one of:
  1. Subagent skipped the completion-promise contract (review system prompt)
  2. Output format misconfigured (check outputFormat schema)
Manual options:
  A) Re-run with explicit COMPLETE instruction in subagent prompt
  B) Abort cleanly: exit ${fallback.exit_code}
Exit code: ${fallback.exit_code}`
  console.error(uxText)
  process.exit(fallback.exit_code)
  throw new Error('unreachable')
}
