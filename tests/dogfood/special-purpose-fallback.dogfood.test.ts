// Phase v2.0-2.5 W4 Cycle 4 — mattpocock + special-purpose + fallback 3 铁律 dogfood
//
// Verifies R20.8 (mattpocock auto-invoke in workflow.yaml on[] route) + R20.14
// (special-purpose tools 13+ entry in capabilities.yaml + verify-work/research
// workflow wiring) + R20.16 (fallback.yaml 3 铁律 runtime semantics:
// uncertain-skip-transparently + user-explicit-override + chain-isolation)。
//
// NOT a unit test (mock-based) — this is dogfood:
//   - real fs.readFile workflows/capabilities.yaml + workflows/judgments/fallback.yaml
//     + workflows/execute-task/workflow.yaml + workflows/verify-work/workflow.yaml
//     + workflows/research/workflow.yaml
//     (v3.4.4 Phase 6 Wave 3c — pivoted from v2 phases.yaml to v3 workflow.yaml
//     after v2 SoT deletion; phase content verbatim sister v2 per workflow.yaml
//     header L16 "KEEP phases verbatim from v2 phases.yaml")
//   - real parseYaml + real Value.Check + real evalGate + real resolveJudgmentGate
//   - real TriggerNotFoundError error path for 铁律 1 skip-with-transparency semantics
//
// Sister Phase 2.5 W1/W2/W3 dogfood format 沿袭 (parallelism-gate.dogfood +
// verify-work-pattern-c.dogfood + tdd-plan-ralph.dogfood)。3 Scenario × 5 fixture each = 15。
//
// Cross-OS perf bar: < 300ms total (Windows fs cold readFile + parse multi-file).

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { evalGate } from '../../src/workflow/exprBuilder.js'
import {
  _clearJudgmentCache,
  resolveJudgmentGate,
  TriggerNotFoundError,
} from '../../src/workflow/judgmentResolver.js'
import type { CapabilitiesT } from '../../src/workflow/schema/capabilities.js'
import { JudgmentRulesFile, type JudgmentRulesFileT } from '../../src/workflow/schema/judgment.js'
import {
  WorkflowSchemaV2,
  type WorkflowSchemaV2T,
  WorkflowSchemaV3,
  type WorkflowSchemaV3T,
} from '../../src/workflow/schema/workflow.js'

const PACKAGE_ROOT = process.cwd()
const CAPABILITIES_YAML = resolve(PACKAGE_ROOT, 'workflows', 'capabilities.yaml')
const EXECUTE_TASK_YAML = resolve(PACKAGE_ROOT, 'workflows', 'execute-task', 'workflow.yaml')
const VERIFY_WORK_YAML = resolve(PACKAGE_ROOT, 'workflows', 'verify-work', 'workflow.yaml')
const RESEARCH_YAML = resolve(PACKAGE_ROOT, 'workflows', 'research', 'workflow.yaml')
const FALLBACK_YAML = resolve(PACKAGE_ROOT, 'workflows', 'judgments', 'fallback.yaml')

beforeEach(() => {
  _clearJudgmentCache()
})

afterEach(() => {
  _clearJudgmentCache()
})

async function loadCapabilities(): Promise<CapabilitiesT> {
  const raw = await readFile(CAPABILITIES_YAML, 'utf8')
  return parseYaml(raw) as CapabilitiesT
}

// v3.4.4 Phase 6 Wave 3c — pivoted from v2 phases.yaml (deleted) to v3 workflow.yaml.
// Helper name preserved for blast-radius minimization; return type now WorkflowSchemaV3T.
async function loadExecuteTaskPhases(): Promise<WorkflowSchemaV3T> {
  const raw = await readFile(EXECUTE_TASK_YAML, 'utf8')
  return parseYaml(raw) as WorkflowSchemaV3T
}

async function loadVerifyWorkWorkflow(): Promise<WorkflowSchemaV2T> {
  const raw = await readFile(VERIFY_WORK_YAML, 'utf8')
  return parseYaml(raw) as WorkflowSchemaV2T
}

// v3.4.4 Cat B: research/workflow.yaml bumped to harnessed.workflow.v3 in Phase v3.0-3.4 W1.
async function loadResearchWorkflow(): Promise<WorkflowSchemaV3T> {
  const raw = await readFile(RESEARCH_YAML, 'utf8')
  return parseYaml(raw) as WorkflowSchemaV3T
}

async function loadFallback(): Promise<JudgmentRulesFileT> {
  const raw = await readFile(FALLBACK_YAML, 'utf8')
  return parseYaml(raw) as JudgmentRulesFileT
}

describe('Phase v2.0-2.5 W4 Cycle 4 — Scenario A: mattpocock auto-invoke (R20.8)', () => {
  // 3 输入触发 → execute-task 02-code / 03-test on[] mattpocock route + capabilities
  // entry alias 完整 verify。real fs.readFile + parseYaml + WorkflowSchemaV2 + Capabilities。

  it('F1. spec_ambiguous=true → execute-task 02-code on[1] route invokes {{ capabilities.grill-with-docs.cmd }}', async () => {
    const wf = await loadExecuteTaskPhases()
    const phase02 = wf.phases?.find((p) => p.id === '02-code')
    expect(phase02?.on).toBeDefined()
    const grillClause = phase02?.on?.find((c) => c.if === 'phase.spec_ambiguous == true')
    expect(grillClause, '02-code has grill-with-docs conditional clause').toBeDefined()
    expect(grillClause?.invoke).toBe('{{ capabilities.grill-with-docs.cmd }}')

    // Runtime evalGate spot-check — phase.spec_ambiguous=true → true
    expect(evalGate('phase.spec_ambiguous == true', { phase: { spec_ambiguous: true } })).toBe(true)
    expect(evalGate('phase.spec_ambiguous == true', { phase: { spec_ambiguous: false } })).toBe(
      false,
    )
  })

  it('F2. unfamiliar_module=true → execute-task 02-code on[2] route invokes {{ capabilities.zoom-out.cmd }}', async () => {
    const wf = await loadExecuteTaskPhases()
    const phase02 = wf.phases?.find((p) => p.id === '02-code')
    const zoomClause = phase02?.on?.find((c) => c.if === 'phase.unfamiliar_module == true')
    expect(zoomClause, '02-code has zoom-out conditional clause').toBeDefined()
    expect(zoomClause?.invoke).toBe('{{ capabilities.zoom-out.cmd }}')

    expect(
      evalGate('phase.unfamiliar_module == true', { phase: { unfamiliar_module: true } }),
    ).toBe(true)
  })

  it('F3. test_fail=true → execute-task 03-test on[] route invokes {{ capabilities.diagnose.cmd }}', async () => {
    const wf = await loadExecuteTaskPhases()
    const phase03 = wf.phases?.find((p) => p.id === '03-test')
    expect(phase03?.on).toBeDefined()
    const diagnoseClause = phase03?.on?.find((c) => c.if === 'test_fail == true')
    expect(diagnoseClause, '03-test has diagnose conditional clause').toBeDefined()
    expect(diagnoseClause?.invoke).toBe('{{ capabilities.diagnose.cmd }}')

    expect(evalGate('test_fail == true', { test_fail: true })).toBe(true)
  })

  it('F4. capabilities.yaml mattpocock 8 高频招式 entry + caveman 独立 (v3.4.2: code-review/code-simplifier reclassified to plugin; caveman dual-install)', async () => {
    const caps = await loadCapabilities()
    // v3.4.2 corrections:
    //   - `code-review` and `code-simplifier` are claude-plugins-official PLUGINS
    //     (not mattpocock) — presence-checked via install_type=plugin.
    //   - `caveman` is an INDEPENDENT capability ("互为补充" dual install) —
    //     ships as both user-skill (~/.claude/skills/caveman/) AND plugin
    //     (caveman@caveman). Its impl=`caveman`, install_type=[user-skill, plugin].
    //   - Kept here only as cmd-literal smoke checks (any-impl OK for outliers).
    const mattpocock8 = [
      { name: 'grill-with-docs', cmd: '/grill-with-docs' },
      { name: 'zoom-out', cmd: '/zoom-out' },
      { name: 'diagnose', cmd: '/diagnose' },
      { name: 'grill-me', cmd: '/grill-me' },
      { name: 'to-prd', cmd: '/to-prd' },
      { name: 'to-issues', cmd: '/to-issues' },
      { name: 'improve-codebase-architecture', cmd: '/improve-codebase-architecture' },
      { name: 'investigate', cmd: '/investigate' },
    ]
    for (const { name, cmd } of mattpocock8) {
      const entry = caps.capabilities[name]
      expect(entry, `capabilities.${name} exists`).toBeDefined()
      if (!entry) throw new Error(`${name} entry missing`)
      expect(entry.impl, `${name}.impl === mattpocock-skills`).toBe('mattpocock-skills')
      expect(entry.cmd, `${name}.cmd === ${cmd}`).toBe(cmd)
      expect(entry.since, `${name}.since === v2.0`).toBe('v2.0')
    }
    // v3.4.2 mapping correction smoke check — code-review / code-simplifier are PLUGINS
    expect(caps.capabilities['code-review']?.cmd).toBe('/code-review')
    expect(caps.capabilities['code-review']?.impl).toBe('plugin')
    expect(caps.capabilities['code-simplifier']?.cmd).toBe('/code-simplifier')
    // v3.4.2 caveman dual-install ("互为补充") — impl=caveman (own identity, not
    // mattpocock), install_type is an array ['user-skill', 'plugin'], both ids set.
    const caveman = caps.capabilities['caveman']
    expect(caveman?.cmd).toBe('/caveman')
    expect(caveman?.impl).toBe('caveman')
    expect(Array.isArray(caveman?.install_type)).toBe(true)
    const cavemanTypes = (caveman?.install_type as unknown as string[]) ?? []
    expect(cavemanTypes).toContain('user-skill')
    expect(cavemanTypes).toContain('plugin')
    expect(caveman?.plugin_id).toBe('caveman')
    expect(caveman?.skill_dir).toBe('caveman')
    expect(caps.capabilities['code-simplifier']?.impl).toBe('plugin')
    expect(mattpocock8.length, 'mattpocock 高频 ≥ 8 招式 (caveman 独立计)').toBeGreaterThanOrEqual(
      8,
    )
  })

  it('F5. capabilities.yaml mattpocock fires_when 句型与 CLAUDE.md verbatim 对齐 (grill-with-docs / zoom-out / diagnose)', async () => {
    const caps = await loadCapabilities()
    // grill-with-docs 句型: phase.spec_ambiguous == true
    const grill = caps.capabilities['grill-with-docs']
    expect(grill?.fires_when).toContain('phase.spec_ambiguous == true')
    // zoom-out 句型: subtask.unfamiliar_module == true
    const zoom = caps.capabilities['zoom-out']
    expect(zoom?.fires_when).toContain('subtask.unfamiliar_module == true')
    // diagnose 句型 (双触发 — test_fail OR debug type)
    const diag = caps.capabilities['diagnose']
    expect(diag?.fires_when).toContain('subtask.test_fail == true')
    expect(diag?.fires_when).toContain("subtask.type == 'debug'")
  })
})

describe('Phase v2.0-2.5 W4 Cycle 4 — Scenario B: special-purpose tools 13+ routing (R20.14)', () => {
  // 13 special-purpose tool entry in capabilities.yaml + verify-work workflow wire
  // 4 gstack 治理关卡 + research workflow wire ctx7/tavily/exa source。

  it('F6. capabilities.yaml special-purpose 13 entry — impl + cmd + since 字段 present', async () => {
    const caps = await loadCapabilities()
    const specialPurpose13 = [
      'ui-ux-pro-max',
      'frontend-design',
      'playwright-cli',
      'playwright-test',
      'webapp-testing',
      'chrome-devtools-mcp',
      'ctx7',
      'tavily-mcp',
      'exa-mcp',
      'gsd-review',
      'gsd-debug',
      'gsd-progress',
      'gsd-verify-work',
    ]
    for (const name of specialPurpose13) {
      const entry = caps.capabilities[name]
      expect(entry, `capabilities.${name} entry exists`).toBeDefined()
      if (!entry) throw new Error(`${name} entry missing`)
      expect(entry.impl, `${name}.impl present`).toBeDefined()
      expect(entry.impl.length, `${name}.impl non-empty`).toBeGreaterThan(0)
      expect(entry.cmd, `${name}.cmd present`).toBeDefined()
      expect(entry.cmd.length, `${name}.cmd non-empty`).toBeGreaterThan(0)
      expect(entry.since, `${name}.since === v2.0`).toBe('v2.0')
    }
    expect(specialPurpose13.length, '13 special-purpose tool ≥ 13').toBe(13)
  })

  it('F7. capabilities.yaml special-purpose impl 分类正确 — plugin/gstack/npm-cli/mcp/cli/gsd 6 bucket (v3.4.2 mapping correction)', async () => {
    const caps = await loadCapabilities()
    // v3.4.2 mapping correction: ui-ux-pro-max + frontend-design are marketplace
    // PLUGINS (not gstack user-skill). webapp-testing stays gstack (gstack subdir).
    expect(caps.capabilities['ui-ux-pro-max']?.impl).toBe('plugin')
    expect(caps.capabilities['frontend-design']?.impl).toBe('plugin')
    expect(caps.capabilities['webapp-testing']?.impl).toBe('gstack')
    // npm-cli: playwright-cli / playwright-test
    expect(caps.capabilities['playwright-cli']?.impl).toBe('npm-cli')
    expect(caps.capabilities['playwright-test']?.impl).toBe('npm-cli')
    // mcp: chrome-devtools-mcp / tavily-mcp / exa-mcp
    expect(caps.capabilities['chrome-devtools-mcp']?.impl).toBe('mcp')
    expect(caps.capabilities['tavily-mcp']?.impl).toBe('mcp')
    expect(caps.capabilities['exa-mcp']?.impl).toBe('mcp')
    // cli: ctx7
    expect(caps.capabilities['ctx7']?.impl).toBe('cli')
    // gsd: gsd-review / gsd-debug / gsd-progress / gsd-verify-work
    expect(caps.capabilities['gsd-review']?.impl).toBe('gsd')
    expect(caps.capabilities['gsd-debug']?.impl).toBe('gsd')
    expect(caps.capabilities['gsd-progress']?.impl).toBe('gsd')
    expect(caps.capabilities['gsd-verify-work']?.impl).toBe('gsd')
  })

  it('F8. verify-work workflow.yaml wire 4 gstack 治理关卡 entry (review/qa/cso/design-review)', async () => {
    const wf = await loadVerifyWorkWorkflow()
    expect(Value.Check(WorkflowSchemaV2, wf)).toBe(true)
    expect(wf.workflow).toBe('verify-work')

    // 04-gstack-review-conditional → gstack-review
    const reviewPhase = wf.phases.find((p) => p.id === '04-gstack-review-conditional')
    expect(reviewPhase?.capability).toBe('{{ capabilities.gstack-review.cmd }}')

    // 05-qa-conditional → gstack-qa
    const qaPhase = wf.phases.find((p) => p.id === '05-qa-conditional')
    expect(qaPhase?.capability).toBe('{{ capabilities.gstack-qa.cmd }}')

    // 06-cso-conditional → gstack-cso
    const csoPhase = wf.phases.find((p) => p.id === '06-cso-conditional')
    expect(csoPhase?.capability).toBe('{{ capabilities.gstack-cso.cmd }}')

    // 07-design-review-conditional → gstack-design-review
    const dsPhase = wf.phases.find((p) => p.id === '07-design-review-conditional')
    expect(dsPhase?.capability).toBe('{{ capabilities.gstack-design-review.cmd }}')
  })

  it('F9. research workflow.yaml 2-phase shape + 02-synth gsd-discuss-phase capability ref', async () => {
    // v3.4.4 Cat B: yaml bumped to harnessed.workflow.v3 — assert against WorkflowSchemaV3.
    const wf = await loadResearchWorkflow()
    expect(Value.Check(WorkflowSchemaV3, wf)).toBe(true)
    expect(wf.workflow).toBe('research')
    expect(wf.phases).toHaveLength(2)

    // 01-fan-out — generic web-search upstream (Tavily/Exa/ctx7 routed via capabilities)
    const fanOut = wf.phases?.find((p) => p.id === '01-fan-out')
    expect(fanOut?.upstream).toBe('web-search')
    // 02-synth — gsd-discuss-phase capability template (GSD discuss synth aggregate)
    const synth = wf.phases?.find((p) => p.id === '02-synth')
    expect(synth?.capability).toBe('{{ capabilities.gsd-discuss-phase.cmd }}')

    // capabilities.yaml 含 3 web 搜索 source entry (Tavily/Exa/ctx7) — research workflow runtime
    // route 实现 fan-out, yaml-level 仅 generic shape (per workflow comment L6)
    const caps = await loadCapabilities()
    expect(caps.capabilities['tavily-mcp']).toBeDefined()
    expect(caps.capabilities['exa-mcp']).toBeDefined()
    expect(caps.capabilities['ctx7']).toBeDefined()
  })
})

describe('Phase v2.0-2.5 W4 Cycle 4 — Scenario C: fallback 3 铁律 runtime (R20.16)', () => {
  // fallback.yaml 3 rule (uncertain-skip-transparently / user-explicit-override / chain-isolation)
  // 真接 fs.readFile + Value.Check(JudgmentRulesFile) + runtime simulate semantic verify。

  it('F10. fallback.yaml schema — rules root key + 3 rule + JudgmentRulesFile Value.Check pass', async () => {
    const raw = await readFile(FALLBACK_YAML, 'utf8')
    const parsed = parseYaml(raw) as unknown
    expect(Value.Check(JudgmentRulesFile, parsed)).toBe(true)
    const fb = parsed as JudgmentRulesFileT
    expect(fb.schema_version).toBe('harnessed.judgment.v1')

    // 3 rule present + 'rules' root key (NOT 'triggers' per dual-schema routing per W0.6)
    expect('rules' in fb).toBe(true)
    expect(Object.keys(fb.rules).sort()).toEqual(
      ['chain-isolation', 'uncertain-skip-transparently', 'user-explicit-override'].sort(),
    )
  })

  it('F11. 铁律 1 uncertain-skip-transparently — fallback_action=skip_with_transparency + message_template 含 {gate_name} + {reason}', async () => {
    const fb = await loadFallback()
    const rule1 = fb.rules['uncertain-skip-transparently']
    expect(rule1, '铁律 1 rule entry exists').toBeDefined()
    if (!rule1) throw new Error('uncertain-skip-transparently rule missing')
    expect(rule1.fallback_action).toBe('skip_with_transparency')
    // message_template 含双 placeholder {gate_name} + {reason} (workflow runtime substitute)
    expect(rule1.message_template).toContain('{gate_name}')
    expect(rule1.message_template).toContain('{reason}')
    // 透明声明语义 — ⚠️ 跳过 ... 因为 ... 如认为需要请明示。
    expect(rule1.message_template).toMatch(/⚠️/)
    expect(rule1.message_template).toMatch(/跳过/)
    expect(rule1.message_template).toMatch(/因为/)
  })

  it('F12. 铁律 1 runtime — invalid gate ref throws Error (skip-with-transparency 错误路径 → workflow engine catch + log)', async () => {
    // judgmentResolver throw TriggerNotFoundError 当 trigger 不存在 →
    // workflow engine catch → 应 emit message_template 给用户 (skip_with_transparency 语义)
    // 此 fixture 验证错误路径触发, message_template substitute logic 由 workflow engine layer 实装
    // (本 Cycle 4 yaml-level 验证 rule 字段语义正确性, 真 substitute logic deferred to v2.x engine wiring)。
    let caughtError: Error | null = null
    try {
      await resolveJudgmentGate(
        'judgments.tdd-gate.nonexistent-trigger.fires',
        { subtask: { is_core_business_logic: true } },
        PACKAGE_ROOT,
      )
    } catch (err) {
      caughtError = err as Error
    }
    expect(caughtError).toBeInstanceOf(TriggerNotFoundError)
    expect(caughtError?.message).toContain('nonexistent-trigger')
    expect(caughtError?.message).toContain('tdd-gate')
    // workflow engine 在 catch 此 error 后, 应 substitute fallback message_template
    // ({gate_name} = 'nonexistent-trigger', {reason} = 'Trigger not found') 并 log ⚠️ 给用户。
  })

  it('F13. 铁律 2 user-explicit-override — override_signal 含 6 CLAUDE.md 词法 verbatim string', async () => {
    const fb = await loadFallback()
    const rule2 = fb.rules['user-explicit-override']
    expect(rule2, '铁律 2 rule entry exists').toBeDefined()
    if (!rule2) throw new Error('user-explicit-override rule missing')
    expect(rule2.override_signal).toBeDefined()
    expect(rule2.override_signal?.length).toBe(6)
    // 6 verbatim signals per CLAUDE.md "用户明示 → 覆盖判据" 节
    const expectedSignals = [
      '先 brainstorm',
      '跑 office-hours',
      '讨论一下',
      'office-hours',
      'brainstorm',
      '深度调研',
    ]
    expect(rule2.override_signal).toEqual(expectedSignals)
  })

  it('F14. 铁律 2 runtime override-match logic — user input 含 signal → match true; 不含 → false', async () => {
    const fb = await loadFallback()
    const signals = fb.rules['user-explicit-override']?.override_signal ?? []

    // Match logic — 词法包含任一 signal → override true (sister CLAUDE.md "runtime 词法匹配 user 输入")
    const matchOverride = (userInput: string): boolean =>
      signals.some((sig) => userInput.includes(sig))

    // Positive cases — 6 signal 各匹配 1 次
    expect(matchOverride('先 brainstorm 一下这个新功能')).toBe(true)
    expect(matchOverride('帮我跑 office-hours')).toBe(true)
    expect(matchOverride('讨论一下这个 plan')).toBe(true)
    expect(matchOverride('我想做 office-hours')).toBe(true)
    expect(matchOverride('brainstorm 几个方案')).toBe(true)
    expect(matchOverride('做 深度调研 这个库')).toBe(true)

    // Negative cases — 普通 user input 不命中
    expect(matchOverride('修一个 bug')).toBe(false)
    expect(matchOverride('discuss this plan')).toBe(false) // 英文 "discuss" 不在 signal list
    expect(matchOverride('add a test')).toBe(false)
  })

  it('F15. 铁律 3 chain-isolation — chain_isolation=true + 战略层 skip ≠ phase 层必 skip (独立 eval)', async () => {
    const fb = await loadFallback()
    const rule3 = fb.rules['chain-isolation']
    expect(rule3, '铁律 3 rule entry exists').toBeDefined()
    if (!rule3) throw new Error('chain-isolation rule missing')
    expect(rule3.chain_isolation).toBe(true)
    expect(rule3.description).toContain('链式互不前置')

    // Runtime chain-isolation simulate — strategic-gate.office-hours skip 不影响 phase-gate.gsd-discuss-phase eval
    // judgmentResolver 每次 call 独立 readFile + evalGate, 无父子继承 (sister judgmentResolver.ts L42-92)。

    // Strategic-gate office-hours fires_when (phase.type in ['new_project', 'new_milestone', 'new_feature'])
    // bug_fix 不在 list → strategic-gate skip
    const strategicFires = await resolveJudgmentGate(
      'judgments.strategic-gate.office-hours.fires',
      { phase: { type: 'bug_fix' } },
      PACKAGE_ROOT,
    )
    expect(strategicFires, 'strategic-gate skip for bug_fix').toBe(false)

    // Phase-gate gsd-discuss-phase 仍独立 eval — open_decisions>=2 触发 (chain-isolation 关键)
    // fires_when: "phase.open_decisions >= 2 or phase.has_cross_phase_data_flow == true or phase.scope_days > 1"
    const phaseFires = await resolveJudgmentGate(
      'judgments.phase-gate.gsd-discuss-phase.fires',
      {
        phase: {
          open_decisions: 3,
          has_cross_phase_data_flow: false,
          scope_days: 0.5,
        },
      },
      PACKAGE_ROOT,
    )
    expect(phaseFires, 'phase-gate independent eval fires despite strategic skip').toBe(true)
  })
})
