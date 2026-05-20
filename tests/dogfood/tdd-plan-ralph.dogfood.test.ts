// Phase v2.0-2.5 W3 Cycle 3 — tdd-gate + planning-with-files + ralph-loop dogfood
//
// Verifies R20.10 (ralph-loop COMPLETE gate + max-iter fallback) + R20.13
// (tdd-gate auto-invoke 6 fires + 3 skips) + R20.15 (planning-with-files Claude
// Code plugin slash cmd /plan 真接) + Q-AUDIT-5a (planning-with-files impl =
// claude-code-plugin NOT npm-sdk reframe)。
//
// NOT a unit test (mock-based) — this is dogfood:
//   - real fs.readFile workflows/judgments/tdd-gate.yaml + capabilities.yaml +
//     plan-feature/workflow.yaml + execute-task/phases.yaml + defaults.yaml
//   - real parseYaml + real Value.Check + real resolveJudgmentGate + real evalGate
//   - real checkPlanningWithFiles probe — Q-AUDIT-5a Claude Code plugin path
//   - real fs.readFile src/routing/lib/fallbackHandlers.ts + grep export verify
//
// Sister Phase 2.5 W1/W2 dogfood format 沿袭 (parallelism-gate.dogfood +
// verify-work-pattern-c.dogfood)。3 Scenario × ~5 fixture each = ~15 fixture。
//
// Cross-OS perf bar: < 300ms total (Windows fs cold readFile + parse multi-file)。

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Value } from '@sinclair/typebox/value'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { checkPlanningWithFiles } from '../../src/cli/lib/check-planning-with-files.js'
import { evalGate } from '../../src/workflow/exprBuilder.js'
import { _clearJudgmentCache, resolveJudgmentGate } from '../../src/workflow/judgmentResolver.js'
import { Capabilities, type CapabilitiesT } from '../../src/workflow/schema/capabilities.js'
import { WorkflowSchemaV2, type WorkflowSchemaV2T } from '../../src/workflow/schema/workflow.js'

const PACKAGE_ROOT = process.cwd()
const CAPABILITIES_YAML = resolve(PACKAGE_ROOT, 'workflows', 'capabilities.yaml')
const PLAN_FEATURE_YAML = resolve(PACKAGE_ROOT, 'workflows', 'plan-feature', 'workflow.yaml')
const EXECUTE_TASK_YAML = resolve(PACKAGE_ROOT, 'workflows', 'execute-task', 'phases.yaml')
const DEFAULTS_YAML = resolve(PACKAGE_ROOT, 'workflows', 'defaults.yaml')
const FALLBACK_HANDLERS_TS = resolve(PACKAGE_ROOT, 'src', 'routing', 'lib', 'fallbackHandlers.ts')

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

async function loadPlanFeatureWorkflow(): Promise<WorkflowSchemaV2T> {
  const raw = await readFile(PLAN_FEATURE_YAML, 'utf8')
  return parseYaml(raw) as WorkflowSchemaV2T
}

async function loadExecuteTaskPhases(): Promise<WorkflowSchemaV2T> {
  const raw = await readFile(EXECUTE_TASK_YAML, 'utf8')
  return parseYaml(raw) as WorkflowSchemaV2T
}

describe('Phase v2.0-2.5 W3 Cycle 3 — Scenario A: TDD-gate auto-invoke (R20.13)', () => {
  // 6 fires_when 触发条件 + 3 skips_when 跳过条件 真接 resolveJudgmentGate
  // (T2.3.W0.4 SHIPPED) → evalGate (T2.3.W0.3 SHIPPED) full path, NOT mock。

  it('F1. is_core_business_logic=true → fires === true', async () => {
    const fires = await resolveJudgmentGate(
      'judgments.tdd-gate.tdd-strongly-suggested.fires',
      { subtask: { is_core_business_logic: true } },
      PACKAGE_ROOT,
    )
    expect(fires).toBe(true)
  })

  it('F2. is_algorithm=true → fires === true', async () => {
    const fires = await resolveJudgmentGate(
      'judgments.tdd-gate.tdd-strongly-suggested.fires',
      { subtask: { is_algorithm: true } },
      PACKAGE_ROOT,
    )
    expect(fires).toBe(true)
  })

  it('F3. is_data_processing=true → fires === true', async () => {
    const fires = await resolveJudgmentGate(
      'judgments.tdd-gate.tdd-strongly-suggested.fires',
      { subtask: { is_data_processing: true } },
      PACKAGE_ROOT,
    )
    expect(fires).toBe(true)
  })

  it('F4. regression_risk=high + reliability_required=true → fires === true (2 trigger)', async () => {
    const fires1 = await resolveJudgmentGate(
      'judgments.tdd-gate.tdd-strongly-suggested.fires',
      { subtask: { regression_risk: 'high' } },
      PACKAGE_ROOT,
    )
    expect(fires1).toBe(true)

    const fires2 = await resolveJudgmentGate(
      'judgments.tdd-gate.tdd-strongly-suggested.fires',
      { subtask: { reliability_required: true } },
      PACKAGE_ROOT,
    )
    expect(fires2).toBe(true)
  })

  it('F5. type in [crud, ui_polish, docs_only] → skips === true (3 skip type)', async () => {
    for (const skipType of ['crud', 'ui_polish', 'docs_only']) {
      const skips = await resolveJudgmentGate(
        'judgments.tdd-gate.tdd-strongly-suggested.skips',
        { subtask: { type: skipType } },
        PACKAGE_ROOT,
      )
      expect(skips, `type=${skipType} should skip`).toBe(true)
    }
  })

  it('F6. capabilities.yaml tdd entry has aliases (sister D-13 — superpowers primary + mattpocock /tdd alias)', async () => {
    const caps = await loadCapabilities()
    const tdd = caps.capabilities.tdd
    expect(tdd, 'tdd entry exists').toBeDefined()
    if (!tdd) throw new Error('tdd entry missing')
    expect(tdd.impl).toBe('superpowers')
    expect(tdd.cmd).toBe('superpowers:test-driven-development')
    expect(tdd.aliases).toBeDefined()
    expect(tdd.aliases?.length).toBeGreaterThanOrEqual(1)
    // D-13 alias: mattpocock /tdd
    const mattpocockAlias = tdd.aliases?.find((a) => a.impl === 'mattpocock-skills')
    expect(mattpocockAlias?.cmd).toBe('/tdd')
  })

  it('F7. execute-task phases.yaml 02-code on[] references tdd-gate.tdd-strongly-suggested.fires + invokes tdd.cmd', async () => {
    const wf = await loadExecuteTaskPhases()
    const phase02 = wf.phases.find((p) => p.id === '02-code')
    expect(phase02?.on).toBeDefined()
    const tddClause = phase02?.on?.find(
      (c) => c.if === 'judgments.tdd-gate.tdd-strongly-suggested.fires',
    )
    expect(tddClause, '02-code has tdd-gate conditional clause').toBeDefined()
    expect(tddClause?.invoke).toBe('{{ capabilities.tdd.cmd }}')
  })
})

describe('Phase v2.0-2.5 W3 Cycle 3 — Scenario B: planning-with-files /plan (R20.15 + Q-AUDIT-5a)', () => {
  // plan-feature workflow.yaml 05-persist 真接 Claude Code plugin slash cmd `/plan`
  // (NOT npm-sdk NOT fs.writeFile self-impl per Q-AUDIT-5a reframe)。

  it('F8. plan-feature 05-persist capability === capabilities.planning-with-files.cmd template + invokes === /plan literal', async () => {
    const wf = await loadPlanFeatureWorkflow()
    const persist = wf.phases.find((p) => p.id === '05-persist')
    expect(persist, '05-persist phase present').toBeDefined()
    expect(persist?.capability).toBe('{{ capabilities.planning-with-files.cmd }}')
    expect(persist?.invokes).toBe('/plan')
  })

  it('F9. 05-persist artifacts_expected === [task_plan.md, progress.md, findings.md] 3 file', async () => {
    const wf = await loadPlanFeatureWorkflow()
    const persist = wf.phases.find((p) => p.id === '05-persist')
    expect(persist?.artifacts_expected).toEqual(['task_plan.md', 'progress.md', 'findings.md'])
  })

  it('F10. capabilities.yaml planning-with-files entry impl=claude-code-plugin (Q-AUDIT-5a NOT npm-sdk) + requires.plugin >= 2.2.0', async () => {
    const caps = await loadCapabilities()
    const pwf = caps.capabilities['planning-with-files']
    expect(pwf, 'planning-with-files entry exists').toBeDefined()
    if (!pwf) throw new Error('planning-with-files entry missing')
    expect(pwf.impl).toBe('claude-code-plugin')
    expect(pwf.impl).not.toBe('npm-sdk') // Q-AUDIT-5a explicit negative
    expect(pwf.cmd).toBe('/plan')
    expect(pwf.requires?.plugin).toMatch(/planning-with-files >=2\.2\.0/)
    expect(pwf.outputs).toEqual(['task_plan.md', 'progress.md', 'findings.md'])
  })

  it('F11. checkPlanningWithFiles real probe — status=pass on dev machine (T2.4.W3.1 SHIPPED 10th doctor check; v2.34.0 ≥ 2.2.0)', async () => {
    const r = await checkPlanningWithFiles()
    // Dev machine 2026-05-20 实证: ~/.claude/plugins/cache/planning-with-files/planning-with-files/2.34.0/
    expect(r.status).toBe('pass')
    expect(r.message).toMatch(/installed/)
    expect(r.message).toMatch(/\d+\.\d+/) // version stamp present
    expect(r.fix).toBeUndefined()
  })

  it('F12. Anti-pattern grep guard — plan-feature workflow.yaml 0 hit npm-sdk + 0 hit fs.writeFile in yaml values', async () => {
    const raw = await readFile(PLAN_FEATURE_YAML, 'utf8')
    // Strip comment lines (yaml `#` prefix) — anti-pattern guard targets yaml values, not doc.
    const valueLines = raw
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('#'))
      .join('\n')
    expect(valueLines).not.toMatch(/npm-sdk/)
    expect(valueLines).not.toMatch(/fs\.writeFile/)
    expect(valueLines).not.toMatch(/writeFile\(/)
  })

  it('F13. plan-feature workflow.yaml — TypeBox WorkflowSchemaV2 Value.Check pass (R20.4 schema invariant)', async () => {
    const raw = await readFile(PLAN_FEATURE_YAML, 'utf8')
    const parsed = parseYaml(raw) as unknown
    expect(Value.Check(WorkflowSchemaV2, parsed)).toBe(true)
    const wf = parsed as WorkflowSchemaV2T
    expect(wf.schema_version).toBe('harnessed.workflow.v2')
    expect(wf.workflow).toBe('plan-feature')
  })
})

describe('Phase v2.0-2.5 W3 Cycle 3 — Scenario C: ralph-loop COMPLETE (R20.10)', () => {
  // execute-task phases.yaml 04-deliver capability + completion_promise + max_iterations +
  // fallback schema + sdk_ref reuse (sister Phase 2.2 v0.2.0 SHIPPED NOT 重写)。

  it('F14. execute-task 04-deliver capability === ralph-loop.cmd template + args.completion_promise === COMPLETE literal', async () => {
    const wf = await loadExecuteTaskPhases()
    const deliver = wf.phases.find((p) => p.id === '04-deliver')
    expect(deliver, '04-deliver phase present').toBeDefined()
    expect(deliver?.capability).toBe('{{ capabilities.ralph-loop.cmd }}')
    expect(deliver?.args?.completion_promise).toBe('COMPLETE')
    expect(deliver?.args?.max_iterations).toBe(
      '{{ defaults.ralph_max_iterations.execute-task.04-deliver }}',
    )
  })

  it('F15. defaults.yaml ralph_max_iterations.execute-task.04-deliver === 20 (within 1-100 hard_upper_limit)', async () => {
    const raw = await readFile(DEFAULTS_YAML, 'utf8')
    const parsed = parseYaml(raw) as {
      schema_version: string
      ralph_max_iterations: {
        'execute-task': Record<string, number>
        [k: string]: Record<string, number>
      }
      hard_upper_limit: number
    }
    expect(parsed.schema_version).toBe('harnessed.defaults.v1')
    const val = parsed.ralph_max_iterations['execute-task']['04-deliver']
    expect(val).toBe(20)
    expect(val).toBeGreaterThanOrEqual(1)
    expect(val).toBeLessThanOrEqual(parsed.hard_upper_limit)
    expect(parsed.hard_upper_limit).toBe(100)
  })

  it('F16. 04-deliver fallback.max_iterations_exceeded schema — action + message placeholder + exit_code (R20.10 explicit NOT silent)', async () => {
    const wf = await loadExecuteTaskPhases()
    const deliver = wf.phases.find((p) => p.id === '04-deliver')
    const fb = deliver?.fallback?.max_iterations_exceeded
    expect(fb, '04-deliver fallback.max_iterations_exceeded present').toBeDefined()
    expect(fb?.action).toBe('emit_warning_and_halt')
    // message MUST contain '{{ args.max_iterations }}' placeholder (sister handleMaxIterationsExceeded substitute regex)
    expect(fb?.message).toMatch(/\{\{\s*args\.max_iterations\s*\}\}/)
    expect(fb?.exit_code).toBe(1)
  })

  it('F17. capabilities.yaml ralph-loop entry sdk_ref === src/routing/lib/ralphLoop.ts (Phase 2.2 sister 复用 NOT 重写)', async () => {
    const caps = await loadCapabilities()
    const rl = caps.capabilities['ralph-loop']
    expect(rl, 'ralph-loop entry exists').toBeDefined()
    if (!rl) throw new Error('ralph-loop entry missing')
    expect(rl.impl).toBe('bundled-skill')
    expect(rl.cmd).toBe('ralph-loop')
    expect(rl.sdk_ref).toBe('src/routing/lib/ralphLoop.ts')
  })

  it('F18. fallbackHandlers.ts (Phase 2.4 W1.2 SHIPPED) exports handleMaxIterationsExceeded + handleVerbatimCompleteFail', async () => {
    const raw = await readFile(FALLBACK_HANDLERS_TS, 'utf8')
    // Real fs.readFile + grep export keyword — verify both handler symbols ship。
    expect(raw).toMatch(/export\s+function\s+handleMaxIterationsExceeded\b/)
    expect(raw).toMatch(/export\s+function\s+handleVerbatimCompleteFail\b/)
    // R20.10 acceptance c — process.exit(fallback.exit_code) explicit halt path
    expect(raw).toMatch(/process\.exit\(fallback\.exit_code\)/)
  })

  it('F19. 04-deliver on[] dual branch — ralph-loop wrapper (lines>=20) + skip (lines<20) per parallelism-gate orthogonal wrapper', async () => {
    const wf = await loadExecuteTaskPhases()
    const deliver = wf.phases.find((p) => p.id === '04-deliver')
    expect(deliver?.on).toHaveLength(2)

    // Branch 1 — invoke ralph-loop wrapper
    const invokeClause = deliver?.on?.[0]
    expect(invokeClause?.if).toBe('subtask.lines >= 20 and subtask.type != "single_command_query"')
    expect(invokeClause?.invoke).toBe('{{ capabilities.ralph-loop.cmd }}')

    // Branch 2 — skip (main-session-fallback per R20.11)
    const skipClause = deliver?.on?.[1]
    expect(skipClause?.if).toBe('subtask.lines < 20 or subtask.type == "single_command_query"')
    expect(skipClause?.action).toBe('skip')

    // Runtime evalGate spot-check both branches
    expect(
      evalGate('subtask.lines >= 20 and subtask.type != "single_command_query"', {
        subtask: { lines: 50, type: 'algorithm' },
      }),
    ).toBe(true)
    expect(
      evalGate('subtask.lines < 20 or subtask.type == "single_command_query"', {
        subtask: { lines: 15, type: 'single_command_query' },
      }),
    ).toBe(true)
  })

  it('F20. execute-task phases.yaml — TypeBox WorkflowSchemaV2 Value.Check pass + capabilities.yaml Capabilities Value.Check pass', async () => {
    const rawExec = await readFile(EXECUTE_TASK_YAML, 'utf8')
    const parsedExec = parseYaml(rawExec) as unknown
    expect(Value.Check(WorkflowSchemaV2, parsedExec)).toBe(true)

    const rawCaps = await readFile(CAPABILITIES_YAML, 'utf8')
    const parsedCaps = parseYaml(rawCaps) as unknown
    expect(Value.Check(Capabilities, parsedCaps)).toBe(true)
  })
})
