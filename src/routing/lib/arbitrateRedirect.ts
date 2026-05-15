// Phase 2.3 W2 T2.2 — CD-3 negative-space + if_rejected_use redirect arbitrate.
// ADR 0012 errata — sister to legacy `arbitrate()` in src/routing/decisionRules.ts
// (B-18 (b) — legacy fn 保留 byte-stable A7 守恒; 新 fn ship 到 lib/ proactive split
// 沿袭 Phase 2.2 sdkReconcile → agentDefinition.ts 先例,decisionRules.ts ~183L
// 主体不动, 仅 re-export — 不留 ~208L 临界 reactive 决策给 executor).
//
// Discriminated union 三态 (matched / rejected / none):
//   - matched   → top-priority eligible rule wins (跟 legacy arbitrate 一致)
//   - rejected  → 所有 candidates 被 do_not_use_when 否决,但有 if_rejected_use
//                 redirect target → surface redirect 给 caller
//   - none      → 无规则命中 OR top tie OR rejected 但无 redirect

import type { Rule, TaskContext } from '../decisionRules.js'

export type ArbitrateResult =
  | { kind: 'matched'; rule: Rule }
  | { kind: 'rejected'; redirectTo: string }
  | { kind: 'none' }

/** Lower-cased substring search across task prompt + signals + nested string values. */
function taskHas(task: TaskContext, keyword: string): boolean {
  const haystack = JSON.stringify(task).toLowerCase()
  return haystack.includes(keyword.toLowerCase())
}

function matchesWhen(when: Record<string, unknown>, task: TaskContext): boolean {
  for (const [k, v] of Object.entries(when)) {
    if (Array.isArray(v)) {
      // Array-valued `when` (e.g. `task_type` arrays, `override_keywords`, `keywords`, `signals`):
      // hit if ANY element is a substring of the task's JSON serialisation. Mirrors legacy
      // F42 array semantic + scalar membership in one pass — sufficient for CD-3 routing
      // (caller already validated via legacy arbitrate path; this is the redirect-aware overlay).
      if (!v.some((kw) => typeof kw === 'string' && taskHas(task, kw))) {
        // Membership fallback (scalar task value in array, legacy task_type case)
        if (!v.includes(task[k])) return false
      }
      continue
    }
    if (task[k] !== v) return false
  }
  return true
}

/** Phase 2.3 D-04 CD-3 — arbitrate + negative-space + if_rejected_use redirect. */
export function arbitrateWithRedirect(rules: Rule[], task: TaskContext): ArbitrateResult {
  const matches = rules.filter((r) => matchesWhen(r.when, task))
  const eligible = matches.filter((r) => {
    const dec = r.decision as { do_not_use_when?: unknown }
    if (!Array.isArray(dec.do_not_use_when)) return true
    return !dec.do_not_use_when.some((k) => typeof k === 'string' && taskHas(task, k))
  })
  const sorted = [...eligible].sort((a, b) => b.priority - a.priority)
  const [top, second] = sorted
  if (!top) {
    // All rules rejected by do_not_use_when → surface redirect from highest-priority rejected rule
    const rejectedSorted = [...matches].sort((a, b) => b.priority - a.priority)
    const rejectedWithRedirect = rejectedSorted.find((r) => {
      const dec = r.decision as { if_rejected_use?: unknown }
      return typeof dec.if_rejected_use === 'string' && dec.if_rejected_use.length > 0
    })
    if (rejectedWithRedirect) {
      const dec = rejectedWithRedirect.decision as { if_rejected_use: string }
      return { kind: 'rejected', redirectTo: dec.if_rejected_use }
    }
    return { kind: 'none' }
  }
  if (second && second.priority === top.priority) return { kind: 'none' }
  return { kind: 'matched', rule: top }
}
