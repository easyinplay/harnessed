// Phase 1.4 T3.1 — routing barrel re-export (Pattern G + PLAN.md § 4 接口契约 7).
//
// IMPL NOTE — single import surface for downstream phases (1.5 DAG resolver +
// Semantic Router L2). Adding new subsystems = add export here.

export type {
  AgentDefinition,
  AgentDefinitionOpts,
  ArbitrateResult,
  TaskContext,
} from './agentDefinition.js'
export {
  createAgent,
  InvalidDecisionError,
  MissingSkillsError,
  RestartRequiredError,
  SkillNotInstalledError,
} from './agentDefinition.js'
export type { DecisionRulesFile, Rule } from './decisionRules.js'
export { arbitrate, loadDecisionRules } from './decisionRules.js'
export type { EngineResult, RoutingOpts } from './engine.js'
export { runRouting } from './engine.js'
export { MaxIterationsExceededError, VerbatimCompleteFailError } from './lib/ralphLoop.js'
export { COMPLETE_INSTRUCTION, SYSTEM_PROMPT } from './systemPrompt.js'
