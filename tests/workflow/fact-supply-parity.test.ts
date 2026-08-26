// Phase 54 T5 — 每个 gate 引用的事实,必须有人能供给它。
//
// 这是「声明 ⇄ 消费」这条边的真实方向。先前有个反向的说法(「声明了 46 个事实、
// 只派生 32 个 → 14 个悬空」)是错的:那两个数量的是不同结构 —— PhaseFactContext
// 声明的是 gate 表达式**可用的词汇表**,而 facts.ts 的 `derived` 只是确定性派生的那
// 几个,其余由模型按 collectGatedFactNames 抽出的清单填。未被任何 gate 引用的声明
// 只是没用上的词汇,不是缺陷。
//
// 真正会咬人的是反向:一个 gate 引用了没人供给的事实。裸标识符会抛 undefined-variable
// → ADR-0038 fail-closed → 那条 lane 被静默删掉(4.23.2 issue #5 的原形);
// 对象成员则是静默 false(T2.1 gap-close 记录的 has_ai_phase / requires_coverage_audit
// 两个 verify sub 因此永久不可达)。两种都无声。
//
// 用真机器测,零正则:collectGatedFactNames 走 readDelegates → resolveJudgmentExpression
// → 真解析器抽标识符;供给侧读 buildDefaultGateContext 的真对象。手写正则抓 TS 源码
// 正是本 phase 在治的形态(4.36.0 那道门就是这么失效的)。

import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { collectGatedFactNames } from '../../src/cli/facts.js'
import { buildDefaultGateContext } from '../../src/cli/lib/gateContext.js'
import { _clearJudgmentCache } from '../../src/workflow/judgmentResolver.js'

const ROOT = resolve(process.cwd())

/** Names supplied at RUNTIME rather than by the synchronous default builder —
 *  i.e. the `derived` block `harnessed facts` emits and the orchestrator hands
 *  back via `--context-file`, plus the measured overlays in src/cli/run.ts.
 *
 *  Listed explicitly on purpose: this is the second supply channel, and the only
 *  way a reader (or this test) can tell "legitimately supplied elsewhere" from
 *  "supplied by nobody". Adding a derivation without listing it here is a red
 *  test, not a silent divergence. Verified against `harnessed facts <master>`
 *  output — keep it in step with the `derived` map in src/cli/facts.ts. */
const FACTS_SUPPLIED = [
  'chrome_devtools_available',
  'requires_second_opinion',
  'phase.files_touched', // deriveGitFacts — Type.Optional, absent on a clean tree
  'phase.stage',
  'subtask.lines', // deriveGitFacts — Type.Optional, absent on a clean tree
]

function suppliedNames(): Set<string> {
  const ctx = buildDefaultGateContext('probe task', 'verify') as Record<string, unknown>
  const out = new Set<string>(FACTS_SUPPLIED)
  for (const [k, v] of Object.entries(ctx)) {
    out.add(k)
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const inner of Object.keys(v as Record<string, unknown>)) out.add(`${k}.${inner}`)
    }
  }
  return out
}

// The masters are exactly the dirs carrying an `auto/workflow.yaml` (research /
// retro are single-file workflows, not masters — they have no delegates_to).
const MASTERS = ['task', 'verify', 'plan', 'discuss', 'ship']

describe('every gated fact has a supplier (Phase 54 T5)', () => {
  it('collectGatedFactNames returns a non-empty set for at least one master', async () => {
    _clearJudgmentCache()
    let total = 0
    for (const m of MASTERS) total += (await collectGatedFactNames(m, ROOT)).length
    expect(total).toBeGreaterThan(0)
  })

  it('no master gates on a fact nothing supplies', async () => {
    _clearJudgmentCache()
    const supplied = suppliedNames()
    const orphans: string[] = []
    for (const master of MASTERS) {
      for (const name of await collectGatedFactNames(master, ROOT)) {
        if (!supplied.has(name)) orphans.push(`${master} → ${name}`)
      }
    }
    expect(orphans.sort()).toEqual([])
  })
})
