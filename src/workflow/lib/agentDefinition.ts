// v3.4.4 Phase 6 — hoisted from src/routing/agentDefinition.ts (sister Phase 2
// sdkSpawn + Phase 3 ralphLoop relocation pattern). Inline of COMPLETE_INSTRUCTION
// (former systemPrompt.ts:60-66) + zombie trim per Phase 6 D-4 Option B —
// createAgent factory + 4 typed error classes + AGENT_DEFINITION_FIELDS const +
// KARPATHY_BASELINE all retired with the routing-engine.
//
// Phase 1.4 T3.2 — AgentDefinition factory (1:1 docs/AGENT-DEFINITION-FACTORY-
// CONTRACT.md v1, frozen at phase 1.3 ship).
// Phase 1.5 T5.3 — contract v1.1: 12 → 14 字段 (ADR 0009 § Decision Errata 1 /
// D1.5-4 sub-item 1). Adds `initialPrompt` (Stable) +
// `criticalSystemReminder_EXPERIMENTAL` (Experimental — `_EXPERIMENTAL` suffix
// signals the field name itself may change without a semver bump).
//
// IMPL NOTE — F40-2 (executor 2026-05-13): contract § 3 shows
// `import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk'` as
// the ideal anchor. package.json does NOT include the SDK runtime dep; to
// preserve karpathy YAGNI + avoid an architectural surface change mid-execute,
// this file declares the AgentDefinition shape **structurally 1:1** with
// contract § 2 inline. SDK type alias migration deferred (D1.4-2 errata window).
// SPIKE-REPORT.md § 3 verbatim COMPLETE round-trip FEASIBLE on Win Git Bash
// claude CLI v2.1.133 — verbatim grep `<promise>COMPLETE</promise>` stable.

/** AgentDefinition — structural mirror of contract § 2 v1.1 (14 fields). */
export interface AgentDefinition {
  // Required (§ 2.1)
  description: string
  prompt: string
  // Optional (§ 2.2 — 10 fields)
  tools?: string[]
  disallowedTools?: string[]
  model?: 'sonnet' | 'opus' | 'haiku' | 'inherit' | string
  skills?: string[]
  mcpServers?: Record<string, unknown>
  memory?: 'user' | 'project' | 'local'
  maxTurns?: number
  background?: boolean
  effort?: 'low' | 'medium' | 'high' | 'xhigh' | 'max' | number
  permissionMode?: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan'
  // v1.1 errata (§ 2.3 — ADR 0009 § Decision Errata 1, 2026-05-14)
  /** Stable (2026-05): auto-submitted as the first user turn when a plugin
   *  agent runs as the main-thread agent (plugin settings.json `agent: <name>`
   *  upgrade scenario only). */
  initialPrompt?: string
  /** EXPERIMENTAL: critical reminder injected into the system prompt. The
   *  `_EXPERIMENTAL` suffix signals the API may rename this field WITHOUT a
   *  semver bump — monitor code.claude.com/docs/en/agent-sdk/typescript release
   *  notes (ADR 0009 § Consequences 负面 3). */
  criticalSystemReminder_EXPERIMENTAL?: string
}

/** Routing arbitrate output (1:1 contract § 3). */
export interface ArbitrateResult {
  matched_rule_id: string | null
  primary_expert: string | null
  secondary_expert: string | null
  category: 'meta' | 'engineering' | 'design' | 'content' | 'testing' | 'search'
  forbidden_skills?: string[]
  complexity?: 'low' | 'medium' | 'high' | 'xhigh' | 'max'
  required_skills?: string[]
}

/** User task context (1:1 contract § 3). */
export interface TaskContext {
  task: string
  override_keywords?: string[]
  task_type?: string
  cwd?: string
  /** Phase identifier (e.g., "3.1") for checkpoint paths. Falls back to "unknown" if not provided.
   *  Phase 3.1 W1 T1.1 — W-04 fix path (a): eliminates `(matched?.decision as any)?.phase` cast
   *  (Karpathy "Surgical Changes" + type safety). */
  phaseId?: string
}

/** Minimal Rule shape consumed by audit log (Phase 6 — extracted from former
 *  src/routing/decisionRules.ts since the engine that produced full Rules died
 *  with v3.4.4 Phase 6. Audit only reads .id; full schema retired with engine). */
export interface Rule {
  id: string
}

/** Subagent-side CRITICAL RULE — inlined from former src/routing/systemPrompt.ts:60-66
 *  during Phase 6 D-4 Option B trim (single-consumer constant; Karpathy "Simplicity
 *  First"). Instructs subagent to emit `<promise>COMPLETE</promise>` verbatim once
 *  done so the main agent's XML-wrapper extract matches without paraphrase loss
 *  and without think-out-loud false positives. */
export const COMPLETE_INSTRUCTION = `## CRITICAL RULE: COMPLETE marker
When your task is done, emit the exact verbatim XML wrapper
\`<promise>COMPLETE</promise>\` on its own line and nothing else after it. Do
NOT emit any other variant — not "completed", not "DONE", not bare \`COMPLETE\`,
not "✅". The parent agent will verbatim grep \`<promise>COMPLETE</promise>\` —
any deviation fails the round-trip and forces a re-spawn (max 20 iterations).
`
