// The chrome-devtools availability arm — turning an unenforced sentence into a gate.
//
// workflows/capabilities.yaml said 「两者都缺时本 capability 不可用」 and
// workflows/judgments/web-testing-routing.yaml's chrome-devtools-mcp-diagnostic
// trigger said it too. Neither was evaluated by anything: the trigger's only arm
// was `subtask.test_type == 'perf-diagnostic'`, so on a machine with NO
// chrome-devtools provider (neither the `ecc` plugin nor a self-installed
// chrome-devtools-mcp server — BOTH are optional) verify/qa phase
// `05-perf-a11y-diagnostic` still fired and pointed the model at a tool that does
// not exist. This suite reads the SHIPPED yaml so it tracks the real criterion.
//
// Why the fix is a `fires_when` arm and NOT a phase-level `skip_gate`:
// `skip_gate` exists only on master `delegates_to[]` (src/workflow/schema/
// workflow.ts `DelegationClause`). `WorkflowPhaseV3` is additionalProperties:false
// and has no such field, and src/workflow/run.ts's phase loop evaluates `ph.gate`
// with no veto path at all — a phase-level `skip_gate` would fail
// scripts/check-workflow-schema.mjs and would be dead config even if it passed.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { buildDefaultGateContext, mergeGateContext } from '../../src/cli/lib/gateContext.js'
import {
  chromeDevtoolsFactSource,
  probeChromeDevtools,
} from '../../src/cli/lib/probe-chrome-devtools.js'
import { evalGate } from '../../src/workflow/exprBuilder.js'
import { _clearJudgmentCache, resolveJudgmentGate } from '../../src/workflow/judgmentResolver.js'

const REPO_ROOT = process.cwd()
const GATE_REF = 'judgments.web-testing-routing.chrome-devtools-mcp-diagnostic.fires'

interface Trigger {
  description?: string
  fires_when: string
  skips_when?: string
}

const TRIGGER: Trigger = (() => {
  const parsed = parseYaml(
    readFileSync(join(REPO_ROOT, 'workflows', 'judgments', 'web-testing-routing.yaml'), 'utf8'),
  ) as { triggers: Record<string, Trigger> }
  const t = parsed.triggers['chrome-devtools-mcp-diagnostic']
  if (!t)
    throw new Error('web-testing-routing.yaml lost its chrome-devtools-mcp-diagnostic trigger')
  return t
})()

const QA_PHASES: { id: string; gate?: string }[] = (() => {
  const parsed = parseYaml(
    readFileSync(join(REPO_ROOT, 'workflows', 'verify', 'qa', 'workflow.yaml'), 'utf8'),
  ) as { phases: { id: string; gate?: string }[] }
  return parsed.phases
})()

/** Default context + the diagnostic test_type, with availability pinned. */
function diagnosticCtx(available: boolean): Record<string, unknown> {
  return mergeGateContext(buildDefaultGateContext('audit the LCP regression', 'verify'), {
    subtask: { test_type: 'perf-diagnostic' },
    chrome_devtools_available: available,
  }) as unknown as Record<string, unknown>
}

let prevOverride: string | undefined

beforeEach(() => {
  prevOverride = process.env.HARNESSED_ASSETS_OVERRIDE
  process.env.HARNESSED_ASSETS_OVERRIDE = REPO_ROOT
  _clearJudgmentCache()
})

afterEach(() => {
  if (prevOverride === undefined) delete process.env.HARNESSED_ASSETS_OVERRIDE
  else process.env.HARNESSED_ASSETS_OVERRIDE = prevOverride
})

describe('verify/qa phase 05 is wired to the chrome-devtools-mcp-diagnostic trigger', () => {
  it('the diagnostic phase exists and gates on that exact ref', () => {
    const phase = QA_PHASES.find((p) => p.id === '05-perf-a11y-diagnostic')
    expect(phase, 'verify/qa lost its 05-perf-a11y-diagnostic phase').toBeDefined()
    expect(phase?.gate).toBe(GATE_REF)
  })

  it('the phase carries no `skip_gate` (unsupported on WorkflowPhaseV3 — the arm lives in fires_when)', () => {
    const phase = QA_PHASES.find((p) => p.id === '05-perf-a11y-diagnostic') as Record<
      string,
      unknown
    >
    expect('skip_gate' in phase).toBe(false)
  })
})

describe('chrome-devtools-mcp-diagnostic.fires — the availability arm', () => {
  it('BOTH providers absent → does NOT fire (the declared "capability unavailable" rule, enforced)', () => {
    expect(evalGate(TRIGGER.fires_when, diagnosticCtx(false))).toBe(false)
  })

  it('a provider present → fires exactly as before (no behaviour drift when it IS installed)', () => {
    expect(evalGate(TRIGGER.fires_when, diagnosticCtx(true))).toBe(true)
  })

  it('availability alone never fires it — the test_type arm still rules', () => {
    const ctx = mergeGateContext(buildDefaultGateContext('t', 'verify'), {
      chrome_devtools_available: true,
    }) as unknown as Record<string, unknown>
    expect(evalGate(TRIGGER.fires_when, ctx)).toBe(false)
  })

  it('the 4-level ref resolves and evaluates through the real judgment resolver', async () => {
    expect(await resolveJudgmentGate(GATE_REF, diagnosticCtx(true), REPO_ROOT)).toBe(true)
    expect(await resolveJudgmentGate(GATE_REF, diagnosticCtx(false), REPO_ROOT)).toBe(false)
  })

  it('the default gate context declares the BARE identifier (ADR-0038 fail-closed guard)', () => {
    // A missing bare identifier throws "undefined variable" and ADR-0038 then
    // treats the gate as NOT fired — which would delete the lane on a machine
    // that DOES have a provider. Declared + seeded true (= unknown) instead.
    const ctx = buildDefaultGateContext('t', 'verify')
    expect('chrome_devtools_available' in ctx).toBe(true)
    expect(ctx.chrome_devtools_available).toBe(true)
    expect(() =>
      evalGate(TRIGGER.fires_when, ctx as unknown as Record<string, unknown>),
    ).not.toThrow()
  })

  it('the other three web-testing lanes are untouched by availability', () => {
    const parsed = parseYaml(
      readFileSync(join(REPO_ROOT, 'workflows', 'judgments', 'web-testing-routing.yaml'), 'utf8'),
    ) as { triggers: Record<string, Trigger> }
    for (const [name, t] of Object.entries(parsed.triggers)) {
      if (name === 'chrome-devtools-mcp-diagnostic') continue
      expect(t.fires_when, `${name} must not gate on chrome-devtools`).not.toContain(
        'chrome_devtools_available',
      )
    }
  })
})

describe('the skip is never silent — the reason names both enable paths', () => {
  it('the trigger description spells out both providers and both install commands', () => {
    const d = TRIGGER.description ?? ''
    expect(d).toContain('chrome_devtools_available')
    expect(d).toContain('harnessed install ecc')
    expect(d).toContain('claude mcp add chrome-devtools-mcp')
  })

  it('the machine-readable skip reason (the fact provenance) names both too', async () => {
    const reason = chromeDevtoolsFactSource(
      await probeChromeDevtools({
        pluginRegistered: async () => false,
        mcpServerRegistered: async () => false,
      }),
    )
    expect(reason).toContain('05-perf-a11y-diagnostic')
    expect(reason).toContain('harnessed install ecc')
    expect(reason).toContain('claude mcp add chrome-devtools-mcp')
  })
})
