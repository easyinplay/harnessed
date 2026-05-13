// Phase 1.4 T3.2 — AgentDefinition factory (1:1 docs/AGENT-DEFINITION-FACTORY-
// CONTRACT.md v1, frozen at phase 1.3 ship).
//
// IMPL NOTE — implements docs/AGENT-DEFINITION-FACTORY-CONTRACT.md v1 (frozen
// at phase 1.3 ship). ADR 0008 § Decision 4 cross-link tracks routing engine
// v1 接口契约升级. D-14 throw-error (not Result wrap) — typed error classes
// propagate to engine.ts narrow into EngineResult. D1.4-14 prepends Karpathy
// 4 心法 always-on baseline + COMPLETE_INSTRUCTION (1:1 imported from
// systemPrompt.ts T3.3). Any enum drift across the 12 字段 = ADR 0008+ errata
// trigger (D-18 enforce — W-5 V1 BLOCKER cell 1 enum value asserts).
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

/** AgentDefinition — structural mirror of contract § 2 (12 fields). Drift
 *  caught by routing-agentDefinition.test.ts cell 1 enum value asserts. */
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
  }
}
