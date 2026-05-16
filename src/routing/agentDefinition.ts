// Phase 1.4 T3.2 — AgentDefinition factory (1:1 docs/AGENT-DEFINITION-FACTORY-
// CONTRACT.md v1, frozen at phase 1.3 ship).
// Phase 1.5 T5.3 — contract v1.1: 12 → 14 字段 (ADR 0009 § Decision Errata 1 /
// D1.5-4 sub-item 1). Adds `initialPrompt` (Stable) +
// `criticalSystemReminder_EXPERIMENTAL` (Experimental — `_EXPERIMENTAL` suffix
// signals the field name itself may change without a semver bump).
//
// IMPL NOTE — implements docs/AGENT-DEFINITION-FACTORY-CONTRACT.md v1.1 (v1
// frozen at phase 1.3 ship; v1.1 additive errata appended at phase 1.5). ADR
// 0009 § Decision Errata 1 cross-link tracks the 12 → 14 字段 delta. D-14
// throw-error (not Result wrap) — typed error classes propagate to engine.ts
// narrow into EngineResult. D1.4-14 prepends Karpathy 4 心法 always-on baseline
// + COMPLETE_INSTRUCTION (1:1 imported from systemPrompt.ts T3.3). Any enum
// drift across the 14 字段 = ADR 0009+ errata trigger (D-18 enforce — W-5 V1
// BLOCKER drift detector enum extended 12 → 14: see AGENT_DEFINITION_FIELDS +
// routing-engine.test.ts cell 13 / routing-agentDefinition.test.ts cell 1).
//
// IMPL NOTE — F40-2 (executor 2026-05-13): contract § 3 shows
// `import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk'` as
// the ideal anchor. package.json does NOT include the SDK runtime dep; to
// preserve karpathy YAGNI + avoid an architectural surface change mid-execute,
// this file declares the AgentDefinition shape **structurally 1:1** with
// contract § 2 inline. Drift caught by routing-agentDefinition.test.ts cell 1
// (memory + permissionMode enum value assert — B-1/B-2 V1 BLOCKER fix). SDK
// type alias migration deferred to phase 1.5 (D1.4-2 errata window).
// SPIKE-REPORT.md § 3 verbatim COMPLETE round-trip FEASIBLE on Win Git Bash
// claude CLI v2.1.133 — verbatim grep `^COMPLETE$/m` stable.

import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { COMPLETE_INSTRUCTION } from './systemPrompt.js'

/** AgentDefinition — structural mirror of contract § 2 v1.1 (14 fields). Drift
 *  caught by routing-agentDefinition.test.ts cell 1 + routing-engine.test.ts
 *  cell 13 enum value asserts (W-5 V1 BLOCKER drift detector — 14 字段). */
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

/** W-5 V1 BLOCKER drift detector — the canonical 14-field name list (contract
 *  v1.1 § 2). Any add/remove here MUST land with a matching contract.md errata
 *  + test cell (D-18 enforce). Extended 12 → 14 at phase 1.5 T5.3. */
export const AGENT_DEFINITION_FIELDS = [
  'description',
  'prompt',
  'tools',
  'disallowedTools',
  'model',
  'skills',
  'mcpServers',
  'memory',
  'maxTurns',
  'background',
  'effort',
  'permissionMode',
  'initialPrompt',
  'criticalSystemReminder_EXPERIMENTAL',
] as const

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

/** Caller overrides (1:1 contract § 3). */
export interface AgentDefinitionOpts {
  modelOverride?: AgentDefinition['model']
  permissionModeOverride?: AgentDefinition['permissionMode']
  effortOverride?: AgentDefinition['effort']
  maxTurnsOverride?: number
  /** Filesystem root for skills lookup (test injection); defaults to ~/.claude/skills/ */
  skillsRoot?: string
}

// 4 typed error classes (contract § 5.1) — D-14 throw-error path, narrowed in engine.ts.
export class SkillNotInstalledError extends Error {
  constructor(public skill: string) {
    super(`Skill not installed: ${skill}. Run: harnessed install ${skill} --apply`)
    this.name = 'SkillNotInstalledError'
  }
}
export class InvalidDecisionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidDecisionError'
  }
}
export class MissingSkillsError extends Error {
  constructor(public missing: string[]) {
    super(`Required skills missing: ${missing.join(', ')}`)
    this.name = 'MissingSkillsError'
  }
}
export class RestartRequiredError extends Error {
  constructor(public hint: string) {
    super(hint)
    this.name = 'RestartRequiredError'
  }
}

/** Karpathy 4 心法 (D1.4-14) — always-on baseline prepended to every subagent. */
const KARPATHY_BASELINE = `## 心法 (always-on baseline)
- Think Before Coding: read, plan, then write — never write before understanding.
- Simplicity First: minimum effective code; avoid unnecessary abstraction.
- Surgical Changes: small atomic edits; keep history clean.
- Goal-Driven Execution: each step earns its place by satisfying a goal.
`

/** harnessed AgentDefinition factory — pure (no spawn). Throws typed errors
 *  (D-14) for engine.ts narrow into EngineResult three-state union. */
export async function createAgent(
  task: TaskContext,
  decision: ArbitrateResult,
  opts: AgentDefinitionOpts = {},
): Promise<AgentDefinition> {
  if (!decision.primary_expert) {
    throw new InvalidDecisionError('decision.primary_expert is required (got null)')
  }
  const skillsRoot = opts.skillsRoot ?? join(homedir(), '.claude', 'skills')
  const requested =
    decision.required_skills ?? (decision.primary_expert ? [decision.primary_expert] : [])
  const isInstalled = (name: string) => existsSync(join(skillsRoot, name, 'SKILL.md'))
  const missing = requested.filter((s) => !isInstalled(s))
  if (missing.length === requested.length && requested.length > 0) {
    throw new MissingSkillsError(missing)
  }
  if (missing.length > 0) {
    throw new SkillNotInstalledError(missing[0] as string)
  }

  const promptBody = `${KARPATHY_BASELINE}\n## 任务\n${task.task}\n\n${COMPLETE_INSTRUCTION}`

  return {
    description: `Routing-engine spawned subagent (${decision.category}) — primary: ${decision.primary_expert}`,
    prompt: promptBody,
    tools: ['Read', 'Grep', 'Glob', 'Bash', 'Edit', 'Write'],
    disallowedTools: decision.forbidden_skills?.map((s) => `Skill(${s})`),
    model: opts.modelOverride ?? process.env.HARNESSED_AGENT_MODEL ?? 'inherit',
    skills: requested,
    mcpServers: undefined,
    memory: 'project',
    maxTurns: opts.maxTurnsOverride ?? 50,
    background: false,
    effort: opts.effortOverride ?? 'medium',
    permissionMode: opts.permissionModeOverride ?? 'default',
    // v1.1 errata (ADR 0009 § Decision Errata 1) — `initialPrompt` carries the
    // task body for the plugin-main-thread upgrade path;
    // `criticalSystemReminder_EXPERIMENTAL` re-asserts the verbatim
    // <promise>COMPLETE</promise> contract at the system-prompt layer.
    initialPrompt: task.task,
    criticalSystemReminder_EXPERIMENTAL: COMPLETE_INSTRUCTION,
  }
}
