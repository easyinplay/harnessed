// tests/workflow/schema/discipline.test.ts — Phase v3.0-3.3 W0 T3.3.W0.6.
// Discipline TypeBox fixture coverage:
//   5 positive valid (base shape karpathy + output-style + priority hierarchy + protocols + minimal)
//   5 negative invalid (additionalProperties + wrong enforcement / layer literal + missing rule field
//                        + invalid version)
//   5 edge case (empty rules array + nested protocol rules + trigger as array + empty protocols
//                 Record + enforcement_layer 'tool')

import { Value } from '@sinclair/typebox/value'
import { describe, expect, test } from 'vitest'
import { Discipline } from '../../../src/workflow/schema/discipline.js'

describe('Discipline — 5 positive', () => {
  test('P1: karpathy.yaml shape (code-writing layer, 5 rules)', () => {
    const karpathy = {
      schema_version: 'harnessed.discipline.v1',
      discipline: 'karpathy',
      enforcement_layer: 'code-writing',
      rules: [
        {
          id: 'think-before-coding',
          description: '先思考后写代码,不直接 dump 代码',
          enforcement: 'warn',
          trigger: "subtask.type == 'code-write'",
        },
        {
          id: 'file-length-200-hard-limit',
          description: '单文件 ≤200L 硬限',
          enforcement: 'halt',
          trigger: "phase.type == 'execute' AND file.lines > 200",
        },
      ],
    }
    expect(Value.Check(Discipline, karpathy)).toBe(true)
  })

  test('P2: output-style.yaml shape (output layer, chat-scoped trigger)', () => {
    const outputStyle = {
      schema_version: 'harnessed.discipline.v1',
      discipline: 'output-style',
      enforcement_layer: 'output',
      rules: [
        {
          id: 'no-em-dash',
          description: '禁用 em-dash',
          enforcement: 'warn',
          trigger: "response.target == 'chat'",
        },
      ],
    }
    expect(Value.Check(Discipline, outputStyle)).toBe(true)
  })

  test('P3: priority.yaml shape (workflow layer + priority_hierarchy 7-tier)', () => {
    const priority = {
      schema_version: 'harnessed.discipline.v1',
      discipline: 'priority',
      enforcement_layer: 'workflow',
      rules: [
        {
          id: 'multi-capability-arbitration',
          description: '多 capability 同 fire → 按 priority_hierarchy order 选最高',
          enforcement: 'warn',
          trigger: 'capabilities.fired_count > 1',
        },
      ],
      priority_hierarchy: [
        'gstack',
        'gsd',
        'superpowers',
        'planning-with-files',
        'karpathy',
        'mattpocock',
        'parallel',
      ],
    }
    expect(Value.Check(Discipline, priority)).toBe(true)
  })

  test('P4: protocols.yaml shape (workflow layer + protocols Record with nested rules)', () => {
    const protocols = {
      schema_version: 'harnessed.discipline.v1',
      discipline: 'protocols',
      enforcement_layer: 'workflow',
      rules: [],
      protocols: {
        'file-ownership-strict': {
          description: '跨 CC 写入边界',
          rules: [
            {
              id: 'no-modify-upstream-artifact',
              description: '下游 CC 不修改上游 artifact',
              enforcement: 'halt',
              trigger: "cc.role == 'execute' AND file.target matches 'PLAN.md'",
            },
          ],
        },
      },
    }
    expect(Value.Check(Discipline, protocols)).toBe(true)
  })

  test('P5: minimal discipline (no optional fields)', () => {
    const minimal = {
      schema_version: 'harnessed.discipline.v1',
      discipline: 'language',
      enforcement_layer: 'output',
      rules: [
        {
          id: 'default-language-zh-hans',
          description: '默认输出语言简体中文',
          enforcement: 'warn',
          trigger: 'user.lang_request == null',
        },
      ],
    }
    expect(Value.Check(Discipline, minimal)).toBe(true)
  })
})

describe('Discipline — 5 negative', () => {
  test('N1: missing schema_version', () => {
    const bad = {
      discipline: 'karpathy',
      enforcement_layer: 'code-writing',
      rules: [],
    }
    expect(Value.Check(Discipline, bad)).toBe(false)
  })

  test('N2: wrong schema_version literal', () => {
    const bad = {
      schema_version: 'harnessed.discipline.v2',
      discipline: 'karpathy',
      enforcement_layer: 'code-writing',
      rules: [],
    }
    expect(Value.Check(Discipline, bad)).toBe(false)
  })

  test('N3: invalid enforcement_layer literal', () => {
    const bad = {
      schema_version: 'harnessed.discipline.v1',
      discipline: 'karpathy',
      enforcement_layer: 'invalid-layer',
      rules: [],
    }
    expect(Value.Check(Discipline, bad)).toBe(false)
  })

  test('N4: invalid rule enforcement literal', () => {
    const bad = {
      schema_version: 'harnessed.discipline.v1',
      discipline: 'karpathy',
      enforcement_layer: 'code-writing',
      rules: [
        {
          id: 'r1',
          description: 'x',
          enforcement: 'block-and-shout', // invalid
          trigger: 'always-on',
        },
      ],
    }
    expect(Value.Check(Discipline, bad)).toBe(false)
  })

  test('N5: additionalProperties root rejected (STRIDE T-2.2-02)', () => {
    const bad = {
      schema_version: 'harnessed.discipline.v1',
      discipline: 'karpathy',
      enforcement_layer: 'code-writing',
      rules: [],
      unknown_root_key: 42,
    }
    expect(Value.Check(Discipline, bad)).toBe(false)
  })
})

// 4.43.0 — fields that nothing ever evaluated are gone from the schema. Under
// additionalProperties:false, writing one back is a validation error, which is
// what keeps a declaration-without-evaluator from quietly returning.
describe('Discipline — removed never-evaluated fields are rejected', () => {
  const base = {
    schema_version: 'harnessed.discipline.v1',
    discipline: 'karpathy',
    enforcement_layer: 'code-writing',
  }
  const rule = { id: 'r1', description: 'x', enforcement: 'warn', trigger: 'always-on' }

  test('R0: the base shape without them passes', () => {
    expect(Value.Check(Discipline, { ...base, rules: [rule] })).toBe(true)
  })
  // Assert the rejection lands ON the removed key. A bare `Value.Check === false`
  // passes vacuously for any unrelated reason (the first draft of these cells did,
  // against the old schema, because the fixture lacked the then-required auto_enforce).
  const rejectedAt = (value: unknown, path: string) =>
    [...Value.Errors(Discipline, value)].some(
      (e) => e.path === path && /Unexpected property/.test(e.message),
    )

  test('R1: root auto_enforce rejected', () => {
    expect(rejectedAt({ ...base, auto_enforce: true, rules: [] }, '/auto_enforce')).toBe(true)
  })
  test('R2: rule check_method rejected', () => {
    const v = { ...base, rules: [{ ...rule, check_method: 'heuristic' }] }
    expect(rejectedAt(v, '/rules/0/check_method')).toBe(true)
  })
  test('R3: rule auto_fix_cmd rejected', () => {
    const v = { ...base, rules: [{ ...rule, auto_fix_cmd: 'x' }] }
    expect(rejectedAt(v, '/rules/0/auto_fix_cmd')).toBe(true)
  })
  test('R4: enforcement "auto-fix" rejected', () => {
    const v = { ...base, rules: [{ ...rule, enforcement: 'auto-fix' }] }
    expect([...Value.Errors(Discipline, v)].some((e) => e.path === '/rules/0/enforcement')).toBe(
      true,
    )
  })
  test.each([
    ['required_fields', ['a']],
    ['forbidden_phrases', ['a']],
    ['file_ownership', { 'plan-cc': ['PLAN.md'] }],
  ])('R5: protocol %s rejected', (k, value) => {
    const protocols = { p: { description: 'x', [k]: value } }
    expect(rejectedAt({ ...base, rules: [], protocols }, `/protocols/p/${k}`)).toBe(true)
  })
})

describe('Discipline — doc-discipline yaml shape', () => {
  const docDiscipline = {
    schema_version: 'harnessed.discipline.v1',
    discipline: 'doc',
    enforcement_layer: 'commit',
    rules: [
      {
        id: 'state-digest-line-limit',
        description: 'STATE.md >100 lines triggers halt; override via HARNESSED_ALLOW_LONG_STATE=1',
        enforcement: 'halt',
        trigger: "phase.type == 'commit' AND changed_files contains '.planning/STATE.md'",
      },
      {
        id: 'one-fact-per-file',
        description:
          'Decision docs must be single-topic; duplicate fact spread across files violates one-fact-per-file',
        enforcement: 'warn',
        trigger: "phase.type == 'commit' AND changed_files matches '\\.planning/'",
      },
      {
        id: 'overview-pointer-no-inline-narrative',
        description:
          'ROADMAP/overview docs must not inline closing narrative (叙事进 SUMMARY, not ROADMAP)',
        enforcement: 'warn',
        trigger: "phase.type == 'commit' AND changed_files matches 'ROADMAP\\.md|STATE\\.md'",
      },
      {
        id: 'transient-consume-then-archive',
        description:
          'HANDOFF and other transient artifacts must be archived after consumption, not accumulated at .planning/ root',
        enforcement: 'warn',
        trigger: "phase.type == 'commit' AND changed_files matches 'HANDOFF'",
      },
      {
        id: 'status-derived-from-artifacts',
        description:
          'Phase status must derive from VERIFICATION artifacts + test results, not hand-maintained booleans in STATE/ROADMAP',
        enforcement: 'warn',
        trigger: "phase.type == 'commit' AND changed_files contains '.planning/STATE.md'",
      },
      {
        id: 'responsibility-matrix-one-home',
        description:
          'Each fact has exactly one home per responsibility matrix (decision→ADR, requirement→REQUIREMENTS, etc.); cross-file duplication is a violation',
        enforcement: 'info',
        trigger: "phase.type == 'commit' AND changed_files matches '\\.planning/'",
      },
    ],
  }

  test('D1: doc-discipline inline shape (all 6 rules, correct enforcement literals) passes Value.Check', () => {
    expect(Value.Check(Discipline, docDiscipline)).toBe(true)
  })

  test('D2: state-digest-line-limit has enforcement=halt', () => {
    const rule = docDiscipline.rules.find((r) => r.id === 'state-digest-line-limit')
    expect(rule).toBeDefined()
    // biome-ignore lint/style/noNonNullAssertion: guarded by toBeDefined above
    expect(rule!.enforcement).toBe('halt')
  })

  test('D3: responsibility-matrix-one-home has enforcement=info (accepted by schema)', () => {
    const shape = {
      ...docDiscipline,
      rules: [
        {
          id: 'responsibility-matrix-one-home',
          description: 'Each fact has exactly one home per responsibility matrix',
          enforcement: 'info',
          trigger: "phase.type == 'commit' AND changed_files matches '\\.planning/'",
        },
      ],
    }
    expect(Value.Check(Discipline, shape)).toBe(true)
    // biome-ignore lint/style/noNonNullAssertion: rules array is non-empty (1 element defined above)
    expect(shape.rules[0]!.enforcement).toBe('info')
  })

  test('D4: extra root key on doc-discipline shape → Value.Check returns false (additionalProperties guard)', () => {
    const bad = { ...docDiscipline, unexpected_extra_key: 'leak' }
    expect(Value.Check(Discipline, bad)).toBe(false)
  })
})

describe('Discipline — 5 edge', () => {
  test('E1: empty rules array passes', () => {
    const ok = {
      schema_version: 'harnessed.discipline.v1',
      discipline: 'protocols',
      enforcement_layer: 'workflow',
      rules: [],
    }
    expect(Value.Check(Discipline, ok)).toBe(true)
  })

  test('E2: trigger as Array of String (always-on list form)', () => {
    const ok = {
      schema_version: 'harnessed.discipline.v1',
      discipline: 'karpathy',
      enforcement_layer: 'code-writing',
      rules: [
        {
          id: 'simplicity-first',
          description: '追求最小有效代码',
          enforcement: 'warn',
          trigger: ['always-on', 'subtask.type == crud'],
        },
      ],
    }
    expect(Value.Check(Discipline, ok)).toBe(true)
  })

  test('E3: enforcement_layer "tool" passes (v3.x extension reserved)', () => {
    const ok = {
      schema_version: 'harnessed.discipline.v1',
      discipline: 'reserved',
      enforcement_layer: 'tool',
      rules: [],
    }
    expect(Value.Check(Discipline, ok)).toBe(true)
  })

  test('E4: empty protocols Record passes', () => {
    const ok = {
      schema_version: 'harnessed.discipline.v1',
      discipline: 'protocols',
      enforcement_layer: 'workflow',
      rules: [],
      protocols: {},
    }
    expect(Value.Check(Discipline, ok)).toBe(true)
  })

  test('E5: ProtocolShape additionalProperties on nested rules rejected', () => {
    const bad = {
      schema_version: 'harnessed.discipline.v1',
      discipline: 'protocols',
      enforcement_layer: 'workflow',
      rules: [],
      protocols: {
        'bad-proto': {
          description: 'x',
          unknown_proto_key: 'leak',
        },
      },
    }
    expect(Value.Check(Discipline, bad)).toBe(false)
  })
})
