// Phase 1.3 T3.3 — decision_rules loader + arbitrate unit tests (B4 acceptance ≥ 8 cell).
//
// IMPL NOTE (R2 § 1.3 + KICKOFF B4 + R1 风险 4 mitigation):
//   - 覆盖 loadDecisionRules schema validate (3 cell) + arbitrate Priority Hit Policy (4 cell)
//     + security gate yaml 注入 reject (1 cell). 沿袭 marketplace-source.test.ts BASE+modifier 风格.
//   - inline yaml string fixture (karpathy YAGNI — 不入 tests/fixtures/decision-rules/).
//   - tmpdir + writeFileSync 一次性写盘, afterEach rmSync 清理.

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  arbitrate,
  loadDecisionRules,
  type Rule,
  type TaskContext,
} from '../../src/routing/decisionRules.js'

const VALID_YAML = `version: 1
hit_policy: P
rules:
  - id: r1
    priority: 100
    domain: testing
    when:
      task_type: perf
    decision:
      primary_expert: chrome-devtools-mcp
fallback_supervisor:
  trigger: L1 无 rule 命中
  llm: claude-opus-4-7
deprecated:
  - id: brave-search
    reason: deprecated
    fallback: tavily
`

let workdir: string
let yamlPath: string
beforeEach(() => {
  workdir = mkdtempSync(join(tmpdir(), 'harnessed-decision-rules-'))
  yamlPath = join(workdir, 'decision_rules.yaml')
})
afterEach(() => {
  rmSync(workdir, { recursive: true, force: true })
})

function write(src: string) {
  writeFileSync(yamlPath, src, 'utf8')
  return yamlPath
}

function rule(id: string, priority: number, when: TaskContext, domain = 'testing'): Rule {
  return {
    id,
    priority,
    domain: domain as Rule['domain'],
    when,
    decision: { primary_expert: id },
  }
}

describe('loadDecisionRules — schema validate (B4)', () => {
  it('1. valid yaml → returns parsed DecisionRulesFile', () => {
    const file = loadDecisionRules(write(VALID_YAML))
    expect(file.version).toBe(1)
    expect(file.hit_policy).toBe('P')
    expect(file.rules).toHaveLength(1)
    expect(file.rules[0]?.id).toBe('r1')
    expect(file.fallback_supervisor?.llm).toBe('claude-opus-4-7')
  })

  it('2. invalid hit_policy ("X") → throws schema invalid', () => {
    const yaml = VALID_YAML.replace('hit_policy: P', 'hit_policy: X')
    expect(() => loadDecisionRules(write(yaml))).toThrow(/schema invalid/)
  })

  it('3. missing rules array → throws schema invalid', () => {
    const yaml = `version: 1
hit_policy: P
`
    expect(() => loadDecisionRules(write(yaml))).toThrow(/schema invalid/)
  })
})

describe('loadDecisionRules — B1 security gate (R1 风险 4)', () => {
  it('4. yaml with $(...) shell injection in rule decision string → reject', () => {
    const yaml = VALID_YAML.replace(
      'primary_expert: chrome-devtools-mcp',
      'primary_expert: "evil-$(whoami)"',
    )
    expect(() => loadDecisionRules(write(yaml))).toThrow(/security violation/)
  })
})

describe('arbitrate — Priority Hit Policy (R2 § 1.3 sketch)', () => {
  it('5. single rule match → returns that rule', () => {
    const rules = [rule('r1', 50, { task_type: 'search' })]
    const result = arbitrate(rules, { task_type: 'search' })
    expect(result?.id).toBe('r1')
  })

  it('6. multi rule, different priority → returns highest priority', () => {
    const rules = [
      rule('r1', 50, { task_type: 'ui-design' }),
      rule('r2', 100, { task_type: 'ui-design' }),
      rule('r3', 30, { task_type: 'ui-design' }),
    ]
    const result = arbitrate(rules, { task_type: 'ui-design' })
    expect(result?.id).toBe('r2')
  })

  it('7. multi rule, tie at top priority → null (triggers L2 supervisor)', () => {
    const rules = [
      rule('r1', 100, { task_type: 'e2e-test' }),
      rule('r2', 100, { task_type: 'e2e-test' }),
    ]
    const result = arbitrate(rules, { task_type: 'e2e-test' })
    expect(result).toBeNull()
  })

  it('8. zero rules match → null', () => {
    const rules = [rule('r1', 50, { task_type: 'search' })]
    const result = arbitrate(rules, { task_type: 'unknown' })
    expect(result).toBeNull()
  })
})
