// Phase 1.3 T3.2 — routing/decision_rules.yaml v1 loader + Priority Hit Policy arbitrate.
// IMPL NOTE (R2 § 1.3 + KICKOFF B1 + D1.3-3): yaml.parseDocument → toJS → Ajv strict
// validate → checkCmdString 二次过滤 (B1 沿袭 phase 1.1.1 H7 pattern). 全局 rule-set,
// 与 manifest.spec.decision_rules (per-manifest hint, ADR 0007) schema 完全独立.
// 仅支持 PRIORITY hit policy (D1.3-3 lock); COLLECT/RULE_ORDER 等推 phase 1.4+.
// Path migrated from .planning/ to routing/ in phase 1.3.1 sister patch M1
// (ADR 0007 references in main body retained as ship-time accurate; ADR 0008
// errata in phase 1.4 will officially document path).

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

export const DecisionRulesFileSchema = ObjStrict({
  version: T.Literal(1),
  hit_policy: HitPolicy,
  rules: T.Array(RuleSchema, { minItems: 1 }),
  fallback_supervisor: T.Optional(ObjStrict({ trigger: Str1, llm: Str1 })),
  deprecated: T.Optional(T.Array(ObjStrict({ id: Str1, reason: Str1, fallback: Str1 }))),
})

export type Rule = Static<typeof RuleSchema>
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

/** Priority Hit Policy arbitrate — R2 § 1.3 sketch. */
export function arbitrate(rules: Rule[], task: TaskContext): Rule | null {
  const matches = rules.filter((r) => matchesWhen(r.when, task))
  const [top, second] = [...matches].sort((a, b) => b.priority - a.priority)
  if (!top) return null
  if (second && second.priority === top.priority) return null
  return top
}

function matchesWhen(when: Record<string, unknown>, task: TaskContext): boolean {
  for (const [k, v] of Object.entries(when)) {
    if (task[k] !== v) return false
  }
  return true
}
