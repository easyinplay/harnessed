// Phase 1.4 T3.1 — routing barrel re-export (Pattern G + PLAN.md § 4 接口契约 7).
// Phase 1.5 T3.5 — add DAG resolver + Semantic Router L2 stub re-exports.
//
// IMPL NOTE — single import surface for downstream phases (1.5 DAG resolver +
// Semantic Router L2 → phase 2.0 execute-task workflow). Adding new subsystems
// = add export here.

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
export type { DagNode, DagResolveResult, NodeId } from './dag.js'
export { formatCycleError, resolveDag, resolveDagOrThrow } from './dag.js'
export type { DecisionRulesFile, Rule } from './decisionRules.js'
export { arbitrate, loadDecisionRules } from './decisionRules.js'
export type { EngineResult, RoutingOpts } from './engine.js'
export { runRouting } from './engine.js'
export { MaxIterationsExceededError, VerbatimCompleteFailError } from './lib/ralphLoop.js'
export type { SemanticMatchResult } from './semanticRouter.js'
export {
  createSemanticRouter,
  DEFAULT_SEMANTIC_THRESHOLD,
  match as semanticMatch,
} from './semanticRouter.js'
export { COMPLETE_INSTRUCTION, SYSTEM_PROMPT } from './systemPrompt.js'
