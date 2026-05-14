// Phase 1.3 T3.2 — routing/decision_rules.yaml v1 loader + Priority Hit Policy arbitrate.
// Phase 1.5 T4.3 — v2 schema (mattpocock_phases + engineering rules) + F42 arbitrate.
// IMPL NOTE (R2 § 1.3 + KICKOFF B1 + D1.3-3): yaml.parseDocument → toJS → Ajv strict
// validate → checkCmdString 二次过滤 (B1 沿袭 phase 1.1.1 H7 pattern). 全局 rule-set,
// 与 manifest.spec.decision_rules (per-manifest hint, ADR 0007) schema 完全独立.
// 仅支持 PRIORITY hit policy (D1.3-3 lock); COLLECT/RULE_ORDER 等推 phase 1.4+.
// Path migrated from .planning/ to routing/ in phase 1.3.1 sister patch M1
// (ADR 0007 references in main body retained as ship-time accurate; ADR 0008
// errata in phase 1.4 will officially document path).
//
// IMPL NOTE — phase 1.5 T4.3 (ADR 0009 § Decision / D1.5-12 / F42): v2 schema
// is additive — `version` accepts 1 OR 2; an optional top-level
// `mattpocock_phases` map (4 phase × skills + triggers) is allowed; RuleSchema
// stays permissive (`when` / `decision` are open records) so engineering rules
// carrying `keywords` / `skills_overlay` / `triggers` validate without a strict
// per-field schema. `arbitrate` gains an F42 array-element substring match for
// the new `keywords` field + `signals` task context — NO regex / embedding
// deps (karpathy YAGNI). v1 scalar `task_type` matching is unchanged so the
// phase 1.4 30-sample baseline + routing-engine tests stay byte-stable.

import { readFileSync } from 'node:fs'
import { type Static, Type as T } from '@sinclair/typebox'
import { Ajv } from 'ajv'
import { parseDocument } from 'yaml'
import { checkCmdString } from '../manifest/security.js'

const Domain = T.Union([
  T.Literal('meta'),
  T.Literal('engineering'),
  T.Literal('design'),
  T.Literal('content'),
  T.Literal('testing'),
  T.Literal('search'),
])
const HitPolicy = T.Union([T.Literal('P'), T.Literal('F'), T.Literal('U')])
const Str1 = T.String({ minLength: 1 })
const ObjStrict = <P extends Parameters<typeof T.Object>[0]>(p: P) =>
  T.Object(p, { additionalProperties: false })

const RuleSchema = ObjStrict({
  id: Str1,
  priority: T.Integer({ minimum: 0 }),
  domain: Domain,
  when: T.Record(T.String(), T.Unknown()),
  decision: T.Record(T.String(), T.Unknown()),
})

/** v2 — mattpocock 23 招式 phase routing (4 phase × skills + triggers). */
const PhaseEntrySchema = ObjStrict({
  skills: T.Array(Str1, { minItems: 1 }),
  triggers: T.Array(Str1, { minItems: 1 }),
})
const MattpocockPhasesSchema = ObjStrict({
  discuss: PhaseEntrySchema,
  plan: PhaseEntrySchema,
  execute: PhaseEntrySchema,
  verify: PhaseEntrySchema,
})

export const DecisionRulesFileSchema = ObjStrict({
  // v2 additive (D1.5-10): accept v1 OR v2 — schema stays backward compatible.
  version: T.Union([T.Literal(1), T.Literal(2)]),
  hit_policy: HitPolicy,
  rules: T.Array(RuleSchema, { minItems: 1 }),
  // v2 — optional mattpocock_phases map; absent in v1 files.
  mattpocock_phases: T.Optional(MattpocockPhasesSchema),
  fallback_supervisor: T.Optional(ObjStrict({ trigger: Str1, llm: Str1 })),
  deprecated: T.Optional(T.Array(ObjStrict({ id: Str1, reason: Str1, fallback: Str1 }))),
})

export type Rule = Static<typeof RuleSchema>
export type PhaseEntry = Static<typeof PhaseEntrySchema>
export type MattpocockPhases = Static<typeof MattpocockPhasesSchema>
export type DecisionRulesFile = Static<typeof DecisionRulesFileSchema>
export type TaskContext = Record<string, unknown>

const ajv = new Ajv({ strict: true, allErrors: true, allowUnionTypes: false })
let _compiled: ReturnType<typeof ajv.compile<DecisionRulesFile>> | null = null
function getValidator() {
  if (!_compiled) _compiled = ajv.compile<DecisionRulesFile>(DecisionRulesFileSchema)
  return _compiled
}

/** Recursively scan string values for shell metacharacters (B1 gate). */
function scanShellInjection(node: unknown, path = ''): string | null {
  if (typeof node === 'string') {
    const hit = checkCmdString(node)
    return hit ? `${path || '<root>'}: ${hit.label} (${hit.hint})` : null
  }
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      const v = scanShellInjection(node[i], `${path}[${i}]`)
      if (v) return v
    }
    return null
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      const hit = scanShellInjection(v, path ? `${path}.${k}` : k)
      if (hit) return hit
    }
  }
  return null
}

export function loadDecisionRules(yamlPath: string): DecisionRulesFile {
  const doc = parseDocument(readFileSync(yamlPath, 'utf8'))
  if (doc.errors.length > 0) {
    throw new Error(`decision_rules yaml parse error: ${doc.errors[0]?.message}`)
  }
  const data = doc.toJS()
  const validate = getValidator()
  if (!validate(data)) {
    const e = validate.errors?.[0]
    throw new Error(`decision_rules schema invalid: ${e?.instancePath || '/'} ${e?.message}`)
  }
  const inj = scanShellInjection(data)
  if (inj) throw new Error(`decision_rules security violation: ${inj}`)
  return data as DecisionRulesFile
}

/** Priority Hit Policy arbitrate — R2 § 1.3 sketch + F42 array semantic match
 *  (phase 1.5 T4.3 / D1.5-12). Scalar `task_type` matching is unchanged from
 *  v1; the `keywords` field gains array-element substring matching against the
 *  task prompt + signals. NO regex / embedding (karpathy YAGNI). ≤30L. */
export function arbitrate(rules: Rule[], task: TaskContext): Rule | null {
  const matches = rules.filter((r) => matchesWhen(r.when, task))
  const [top, second] = [...matches].sort((a, b) => b.priority - a.priority)
  if (!top) return null
  if (second && second.priority === top.priority) return null
  return top
}

/** Lower-cased substring search across the task's prompt + signals (F42). */
function taskHas(task: TaskContext, needle: string): boolean {
  const n = needle.toLowerCase()
  const prompt = typeof task.prompt === 'string' ? task.prompt.toLowerCase() : ''
  if (prompt.includes(n)) return true
  const signals = Array.isArray(task.signals) ? (task.signals as unknown[]) : []
  return signals.some((s) => typeof s === 'string' && s.toLowerCase().includes(n))
}

/** v1 scalar match (unchanged) + v2 F42 `keywords` array substring match. */
function matchesWhen(when: Record<string, unknown>, task: TaskContext): boolean {
  for (const [k, v] of Object.entries(when)) {
    if (k === 'keywords' && Array.isArray(v)) {
      // F42 — rule hits if ANY keyword is a substring of the task prompt/signals.
      if (!v.some((kw) => typeof kw === 'string' && taskHas(task, kw))) return false
      continue
    }
    // v1 behavior — strict scalar equality (array-valued `when` never matches a
    // scalar task value; phase 1.4 30-sample baseline depends on this).
    if (task[k] !== v) return false
  }
  return true
}

/** Extract the v2 mattpocock_phases map (4 phase × skills + triggers), or null
 *  for a v1 file. Lets engineering `skills_overlay.ref` callers resolve the
 *  cross-linked skill list without re-parsing the yaml. */
export function getMattpocockPhases(file: DecisionRulesFile): MattpocockPhases | null {
  return file.mattpocock_phases ?? null
}
