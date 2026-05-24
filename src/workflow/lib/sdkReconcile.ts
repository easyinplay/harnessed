// v3.4.4 Phase 6 — hoisted from src/routing/lib/sdkReconcile.ts (sister Phase 2 sdkSpawn + Phase 3 ralphLoop relocation pattern).
//
// Phase 2.2 Wave 2 T2.1 — agentFactory contract v1.2 reconcile (ADR 0011 errata).
//
// IMPL NOTE — splits 2 helper fn out of agentDefinition.ts so the latter holds
// its ≤200L hard limit (B-24 / D-13). Bridges the factory-internal 14-字段
// AgentDefinition (contract v1.1, src/routing/agentDefinition.ts) to the
// `@anthropic-ai/claude-agent-sdk` v0.3.142 input shape.
//
// PATTERNS § 2.3 inline correction (T1.1 resolved 2026-05-15) — research
// baseline said `SDK input = 4 fields, prompt-inject = 10`. The actual
// `.d.ts` (sdk.d.ts:38) carries `disallowedTools?: string[]` as a first-class
// SDK input field, so the lock is:
//   SDK input layer       = 5 fields  (description / tools? / disallowedTools? / prompt / model?)
//   prompt-inject layer   = 9 fields  (skills / mcpServers / memory / maxTurns / background /
//                                       effort / permissionMode / initialPrompt /
//                                       criticalSystemReminder_EXPERIMENTAL)
//   factory-internal total = 14       (5 + 9 — unchanged, ADR 0009 § Errata 1)
// Contract v1.2 reconcile chapter (ADR 0011 § 4) finalizes this at Wave 6 T6.1.

import type { AgentDefinition as SdkAgentDef } from '@anthropic-ai/claude-agent-sdk'
import type { AgentDefinition } from './agentDefinition.js'

/** Unpack factory-internal 14-字段 AgentDefinition → SDK 5-字段 input shape (B-01).
 *  Optional fields are stripped when absent so the SDK call site stays clean. */
export function toSdkAgentDefinition(def: AgentDefinition): SdkAgentDef {
  return {
    description: def.description,
    prompt: def.prompt,
    ...(def.tools ? { tools: def.tools } : {}),
    ...(def.disallowedTools ? { disallowedTools: def.disallowedTools } : {}),
    ...(def.model ? { model: def.model } : {}),
  }
}

/** Belt-and-suspenders prompt augmentation — appends the 9 prompt-inject fields
 *  as a structured suffix to `basePrompt`. Callers use this when running an
 *  AgentDefinition through an SDK-input path that does NOT natively carry the
 *  9 factory-internal fields (e.g. plain `query({ agents })` without subagent
 *  registration). Sections are emitted only when the field is present.
 *  Sourced 1:1 with PATTERNS § 2.3 — prepend pattern, KARPATHY_BASELINE-style. */
export function injectFactoryInternalFields(def: AgentDefinition, basePrompt: string): string {
  const parts: string[] = [basePrompt]
  if (def.skills?.length) parts.push(`## Available skills\n- ${def.skills.join('\n- ')}`)
  if (def.mcpServers && Object.keys(def.mcpServers).length) {
    parts.push(`## MCP servers\n${Object.keys(def.mcpServers).join(', ')}`)
  }
  if (def.memory) parts.push(`## Memory\n${def.memory}`)
  if (def.maxTurns) parts.push(`## Turn budget\n${def.maxTurns} turns max.`)
  if (def.background) parts.push(`## Background\nfire-and-forget`)
  if (def.effort) parts.push(`## Effort\n${def.effort}`)
  if (def.permissionMode) parts.push(`## Permission mode\n${def.permissionMode}`)
  if (def.initialPrompt) parts.push(`## Initial prompt\n${def.initialPrompt}`)
  if (def.criticalSystemReminder_EXPERIMENTAL) {
    parts.push(`## CRITICAL\n${def.criticalSystemReminder_EXPERIMENTAL}`)
  }
  return parts.join('\n\n')
}
