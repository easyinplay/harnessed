// Phase 54 T0 — defaults.yaml 与真实 phase 的对齐。
//
// 背景:workflows/**/workflow.yaml 曾把每个 phase 的迭代上限写成
// `max_iterations: '{{ defaults.ralph_max_iterations.<workflow>.<phase> }}'`。
// 这些引用从未被解析过 —— `loadPhases` 只插值 `ph.invokes`,而 `interpolate` 的
// STRICT 正则不认 dot-path 且残留即抛错。21 处全部以字面串抵达
// `resolveMaxIterations`,parseInt 得 NaN,统统落回 RALPH_DEFAULT_MAX_ITER = 20:
// 声明 5 的 phase 实跑 20。其中 5 处连 defaults 里的键都对不上。
//
// 修法不是补一个模板层,而是删掉 yaml 里的字段,让值只走 `defaults.yaml` 查表
// (与 `resolveAttemptBudget` 同一条已知能工作的路径)。字段没了,「引用能不能解析」
// 这个问题也就没了 —— 取而代之的风险是 defaults 里的键与真实 phase 漂移,
// 于是断言反向:表里的每个 <workflow>.<phase> 必须对应一个真实存在的 phase。

import { globSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'

const ROOT = join(__dirname, '..', '..')
const SEP = String.fromCharCode(92) // backslash, written without an escape

interface WorkflowDoc {
  workflow?: string
  phases?: { id?: string }[]
}

/** workflow name (the yaml `workflow:` field, which IS the defaults key) → phase ids. */
function phaseIdsByWorkflow(): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()
  for (const rel of globSync('workflows/**/workflow.yaml', { cwd: ROOT })) {
    const doc = parseYaml(readFileSync(join(ROOT, rel), 'utf8')) as WorkflowDoc | null
    const name = doc?.workflow
    if (!name) continue
    const ids = new Set<string>()
    for (const ph of doc?.phases ?? []) if (ph?.id) ids.add(ph.id)
    map.set(name, ids)
  }
  return map
}

function defaultsRows(): { workflow: string; phase: string }[] {
  const doc = parseYaml(readFileSync(join(ROOT, 'workflows', 'defaults.yaml'), 'utf8')) as {
    ralph_max_iterations?: Record<string, Record<string, unknown>>
  }
  const rows: { workflow: string; phase: string }[] = []
  for (const [workflow, phases] of Object.entries(doc?.ralph_max_iterations ?? {})) {
    if (phases && typeof phases === 'object') {
      for (const phase of Object.keys(phases)) rows.push({ workflow, phase })
    }
  }
  return rows
}

describe('defaults.yaml ralph_max_iterations ⇄ real phases (Phase 54 T0)', () => {
  it('every <workflow>.<phase> key names a phase that actually exists', () => {
    const byWorkflow = phaseIdsByWorkflow()
    const orphans = defaultsRows()
      .filter((r) => !byWorkflow.get(r.workflow)?.has(r.phase))
      .map((r) => r.workflow + '.' + r.phase)
      .sort()
    expect(orphans).toEqual([])
  })

  it('the table is non-empty (guards the check passing on zero rows)', () => {
    expect(defaultsRows().length).toBeGreaterThan(0)
  })

  it('no workflow.yaml carries an unresolvable {{ defaults… }} max_iterations again', () => {
    const offenders: string[] = []
    for (const rel of globSync('workflows/**/workflow.yaml', { cwd: ROOT })) {
      const src = readFileSync(join(ROOT, rel), 'utf8')
      for (const line of src.split(String.fromCharCode(10))) {
        if (/^\s*max_iterations:\s*['"]?\{\{/.test(line)) {
          offenders.push(rel.split(SEP).join('/'))
          break
        }
      }
    }
    expect(offenders).toEqual([])
  })
})
