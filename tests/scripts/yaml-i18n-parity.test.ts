// Phase 33 T33.5 — en↔zh-Hans yaml sync-guard structural-parity checker tests.
// TDD red→green. Sister tests/scripts/skill-i18n-parity.test.ts. Imports the pure
// fn from the .mjs (carries a hand-written .d.mts so tsc --noEmit resolves the type;
// scripts/** is in tsconfig include with allowJs off). Runs AFTER pnpm install in CI
// (uses the `yaml` package — robust structural parse, not regex).
//
// Structural parity (translation-invariant only; values differ by translation):
//   - top-level key set identical
//   - role-prompts: `prompts` role-key set + per-role field-key set identical
//   - disciplines: `rules[].id` set + per-rule field-key set identical
//   - host-primitives: `primitives` 3-level key set (primitive → variant → host)
//   - orphan zh (<base>.zh-Hans.yaml with no <base>.yaml) = violation
// drift-only: a base .yaml with NO zh sibling is OK (no must-exist).

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { checkYamlI18nParity } from '../../scripts/check-yaml-i18n-parity.mjs'

let tmp = ''
let wf = ''

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'yaml-i18n-parity-'))
  wf = join(tmp, 'workflows')
  mkdirSync(join(wf, 'disciplines'), { recursive: true })
})

afterEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true })
})

const ROLE_EN = `schema_version: harnessed.role-prompts.v1
prompts:
  verify-paranoid:
    primary_cap: gstack-review
    specialist: Paranoid Staff Engineer
    responsibility: Review the diff.
    checklist: []
    severity: CRITICAL / INFO
    description: Pre-landing review.
`
const ROLE_ZH = `schema_version: harnessed.role-prompts.v1
prompts:
  verify-paranoid:
    primary_cap: gstack-review
    specialist: 偏执狂资深工程师
    responsibility: 审查 diff。
    checklist: []
    severity: 严重 / 提示
    description: 落地前审查。
`

const DISC_EN = `schema_version: harnessed.discipline.v1
discipline: karpathy
enforcement_layer: code-writing
auto_enforce: true
rules:
  - id: simplicity-first
    description: Pursue the minimal effective code.
    enforcement: warn
    trigger: always-on
    check_method: llm-judge
`
const DISC_ZH = `schema_version: harnessed.discipline.v1
discipline: karpathy
enforcement_layer: code-writing
auto_enforce: true
rules:
  - id: simplicity-first
    description: 追求最小有效代码。
    enforcement: warn
    trigger: always-on
    check_method: llm-judge
`

// host-primitives shape (Phase 65): primitives.<primitive>.<variant>.<host>.
// Exercises the YAML anchor/alias form the real table uses (`default: &t` +
// `attributive: *t`) — aliases are expanded by the parse, so the key-set compare
// sees two distinct variant keys, not one.
const HOST_EN = `version: 1
primitives:
  spawn_subagent:
    default:
      claude: "Task / Agent tool"
      codex: "spawn_agent tool"
    zh_tool:
      claude: "Task / Agent 工具"
      codex: "spawn_agent 工具"
  team:
    default: &t
      claude: "Agent Teams"
      codex: "multi-agent formation"
    attributive: *t
host_map_notes:
  codex:
    - "a codex-only caveat"
    - "another one"
`
// Same 3-level key set, translated values. `host_map_notes` deliberately has a
// DIFFERENT shape (claude side is intentionally empty upstream) — it must not be
// pulled into the deep compare.
const HOST_ZH = `version: 1
primitives:
  spawn_subagent:
    default:
      claude: "Task / Agent 工具"
      codex: "spawn_agent 工具"
    zh_tool:
      claude: "Task / Agent 工具"
      codex: "spawn_agent 工具"
  team:
    default: &t
      claude: "Agent Teams"
      codex: "多 agent 编队"
    attributive: *t
host_map_notes:
  codex:
    - "一条 codex 专属注意事项"
`

const wRole = (name: string, c: string) => writeFileSync(join(wf, name), c, 'utf8')
const wDisc = (name: string, c: string) => writeFileSync(join(wf, 'disciplines', name), c, 'utf8')

describe('checkYamlI18nParity', () => {
  it('in-parity role-prompts pair → ok', () => {
    wRole('role-prompts.yaml', ROLE_EN)
    wRole('role-prompts.zh-Hans.yaml', ROLE_ZH)
    const res = checkYamlI18nParity(wf)
    expect(res.ok).toBe(true)
    expect(res.violations).toEqual([])
  })

  it('in-parity disciplines pair → ok', () => {
    wDisc('karpathy.yaml', DISC_EN)
    wDisc('karpathy.zh-Hans.yaml', DISC_ZH)
    const res = checkYamlI18nParity(wf)
    expect(res.ok).toBe(true)
    expect(res.violations).toEqual([])
  })

  it('base with NO sibling → ok (drift-only)', () => {
    wRole('role-prompts.yaml', ROLE_EN)
    wDisc('karpathy.yaml', DISC_EN)
    const res = checkYamlI18nParity(wf)
    expect(res.ok).toBe(true)
  })

  it('orphan zh (no base) → orphan violation', () => {
    wDisc('karpathy.zh-Hans.yaml', DISC_ZH)
    const res = checkYamlI18nParity(wf)
    expect(res.ok).toBe(false)
    expect(res.violations.map((v) => v.kind)).toContain('orphan')
  })

  it('role key missing in zh → role-keys violation', () => {
    wRole('role-prompts.yaml', `${ROLE_EN}  extra-role:\n    primary_cap: x\n    description: y\n`)
    wRole('role-prompts.zh-Hans.yaml', ROLE_ZH)
    const res = checkYamlI18nParity(wf)
    expect(res.ok).toBe(false)
    expect(res.violations.map((v) => v.kind)).toContain('role-keys')
  })

  it('per-role field missing in zh → role-fields violation', () => {
    wRole('role-prompts.yaml', ROLE_EN)
    // zh drops the `severity` field
    wRole('role-prompts.zh-Hans.yaml', ROLE_ZH.replace('    severity: 严重 / 提示\n', ''))
    const res = checkYamlI18nParity(wf)
    expect(res.ok).toBe(false)
    expect(res.violations.map((v) => v.kind)).toContain('role-fields')
  })

  it('rule id missing in zh → rule-ids violation', () => {
    wDisc(
      'karpathy.yaml',
      `${DISC_EN}  - id: surgical-changes\n    description: Small atomic changes.\n    enforcement: warn\n    trigger: always-on\n    check_method: heuristic\n`,
    )
    wDisc('karpathy.zh-Hans.yaml', DISC_ZH)
    const res = checkYamlI18nParity(wf)
    expect(res.ok).toBe(false)
    expect(res.violations.map((v) => v.kind)).toContain('rule-ids')
  })

  it('per-rule field missing in zh → rule-fields violation', () => {
    wDisc('karpathy.yaml', DISC_EN)
    // zh drops the `check_method` field
    wDisc('karpathy.zh-Hans.yaml', DISC_ZH.replace('    check_method: llm-judge\n', ''))
    const res = checkYamlI18nParity(wf)
    expect(res.ok).toBe(false)
    expect(res.violations.map((v) => v.kind)).toContain('rule-fields')
  })

  it('in-parity host-primitives pair → ok (host_map_notes asymmetry is not a drift)', () => {
    wRole('host-primitives.yaml', HOST_EN)
    wRole('host-primitives.zh-Hans.yaml', HOST_ZH)
    const res = checkYamlI18nParity(wf)
    expect(res.ok).toBe(true)
    expect(res.violations).toEqual([])
  })

  it('primitive missing in zh → primitive-keys violation naming the key', () => {
    wRole('host-primitives.yaml', HOST_EN)
    // zh drops the whole `team:` primitive
    wRole(
      'host-primitives.zh-Hans.yaml',
      HOST_ZH.replace(/ {2}team:\n(?:.*\n)*? {4}attributive: \*t\n/, ''),
    )
    const res = checkYamlI18nParity(wf)
    expect(res.ok).toBe(false)
    const v = res.violations.find((x) => x.kind === 'primitive-keys')
    expect(v).toBeDefined()
    expect(v?.detail).toContain('team')
  })

  it('variant missing in zh → primitive-variants violation naming primitive + key', () => {
    wRole('host-primitives.yaml', HOST_EN)
    // zh drops the `zh_tool` variant of spawn_subagent
    wRole(
      'host-primitives.zh-Hans.yaml',
      HOST_ZH.replace(
        '    zh_tool:\n      claude: "Task / Agent 工具"\n      codex: "spawn_agent 工具"\n',
        '',
      ),
    )
    const res = checkYamlI18nParity(wf)
    expect(res.ok).toBe(false)
    const v = res.violations.find((x) => x.kind === 'primitive-variants')
    expect(v).toBeDefined()
    expect(v?.detail).toContain('spawn_subagent')
    expect(v?.detail).toContain('zh_tool')
  })

  it('host column missing in zh → primitive-hosts violation naming primitive + variant + key', () => {
    wRole('host-primitives.yaml', HOST_EN)
    // zh drops the `codex` column of spawn_subagent.default
    wRole(
      'host-primitives.zh-Hans.yaml',
      HOST_ZH.replace(
        '    default:\n      claude: "Task / Agent 工具"\n      codex: "spawn_agent 工具"\n',
        '    default:\n      claude: "Task / Agent 工具"\n',
      ),
    )
    const res = checkYamlI18nParity(wf)
    expect(res.ok).toBe(false)
    const v = res.violations.find((x) => x.kind === 'primitive-hosts')
    expect(v).toBeDefined()
    expect(v?.detail).toContain('spawn_subagent')
    expect(v?.detail).toContain('default')
    expect(v?.detail).toContain('codex')
  })

  it('top-level key mismatch → top-keys violation', () => {
    wDisc('karpathy.yaml', DISC_EN)
    wDisc('karpathy.zh-Hans.yaml', `${DISC_ZH}extra_top: 1\n`)
    const res = checkYamlI18nParity(wf)
    expect(res.ok).toBe(false)
    expect(res.violations.map((v) => v.kind)).toContain('top-keys')
  })
})
