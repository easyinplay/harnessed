// T2.1 D-5 follow-up — `skip_gate` must mean the same thing on BOTH read paths.
//
// The veto shipped wired into `src/cli/gates.ts` only (the path the SKILL /
// slash-command flow drives). `runMasterOrchestrator` — the CI / headless path —
// reads the SAME `workflows/<master>/auto/workflow.yaml`, so the field was
// silently ignored there: one configuration, two behaviours, with no signal that
// the two disagreed. A yaml-level construct that only half the engine honours is
// worse than an unimplemented one, because the operator has evidence (the gates
// plan) that it works.
//
// These tests run BOTH implementations against ONE temp assets root and ONE gate
// context and assert the conclusions are identical across the whole D-5 truth
// table, including the deliberate no-veto-on-fault direction.

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { runGatesPlan } from '../../src/cli/gates.js'
import { buildDefaultGateContext, mergeGateContext } from '../../src/cli/lib/gateContext.js'
import { captureRunDeps, ExitError } from '../../src/platform/runDeps.js'
import { evalGate } from '../../src/workflow/exprBuilder.js'
import { _clearJudgmentCache } from '../../src/workflow/judgmentResolver.js'
import { runMasterOrchestrator, type SpawnDriver } from '../../src/workflow/masterOrchestrator.js'

const MASTER = 'task'

let root: string
let prevOverride: string | undefined
let seq = 0

interface GatesPlanJson {
  fire: { sub: string }[]
  skip: { sub: string; reason: string }[]
}

function nextJudgment(): string {
  seq += 1
  return `t21-parity-${seq}`
}

function writeJudgment(base: string, fires: string, skips: string): void {
  const dir = join(root, 'workflows', 'judgments')
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    join(dir, `${base}.yaml`),
    `schema_version: harnessed.judgment.v1
triggers:
  demo:
    fires_when: "${fires}"
    skips_when: "${skips}"
`,
    'utf8',
  )
}

function writeMaster(judgment: string, withSkipGate: boolean): void {
  const dir = join(root, 'workflows', MASTER, 'auto')
  mkdirSync(dir, { recursive: true })
  const skipLine = withSkipGate ? `    skip_gate: judgments.${judgment}.demo.skips\n` : ''
  writeFileSync(
    join(dir, 'workflow.yaml'),
    `schema_version: harnessed.workflow.v3
workflow: ${MASTER}
delegates_to:
  - sub: code
    gate: judgments.${judgment}.demo.fires
${skipLine}`,
    'utf8',
  )
}

/** Run `harnessed gates` and reduce to {ran, reason} for the single `code` sub.
 *  gates.ts emits the flattened `<master>-<sub>` alias in fire[] but the bare
 *  name in skip[] — normalise so the comparison is about the VERDICT. */
async function gatesVerdict(
  ctxOverrides: Record<string, unknown>,
): Promise<{ ran: boolean; reason: string }> {
  const { deps, stdout } = captureRunDeps()
  try {
    await runGatesPlan(MASTER, { context: JSON.stringify(ctxOverrides) }, deps)
  } catch (e) {
    if (!(e instanceof ExitError)) throw e
  }
  const plan = JSON.parse(stdout.join('\n').trim()) as GatesPlanJson
  const ran = plan.fire.some((f) => f.sub.endsWith('code'))
  return { ran, reason: ran ? '' : (plan.skip[0]?.reason ?? '') }
}

/** Run `runMasterOrchestrator` over the SAME yaml + the SAME merged context. */
async function orchestratorVerdict(
  ctxOverrides: Record<string, unknown>,
): Promise<{ ran: boolean; reason: string }> {
  const ctx = mergeGateContext(
    buildDefaultGateContext('', MASTER),
    ctxOverrides,
  ) as unknown as Record<string, unknown>
  const spawn: SpawnDriver = vi.fn(async () => {})
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  try {
    const r = await runMasterOrchestrator('task', ctx, root, spawn)
    const ran = r.fired.includes('code')
    const reasonLine =
      logSpy.mock.calls.map((c) => String(c[0])).find((l) => l.includes('code')) ?? ''
    return { ran, reason: ran ? '' : reasonLine }
  } finally {
    logSpy.mockRestore()
    warnSpy.mockRestore()
  }
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'harnessed-skipgate-parity-'))
  prevOverride = process.env.HARNESSED_ASSETS_OVERRIDE
  process.env.HARNESSED_ASSETS_OVERRIDE = root
  _clearJudgmentCache()
})

afterEach(() => {
  if (prevOverride === undefined) delete process.env.HARNESSED_ASSETS_OVERRIDE
  else process.env.HARNESSED_ASSETS_OVERRIDE = prevOverride
  rmSync(root, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe('skip_gate — `harnessed gates` and `runMasterOrchestrator` agree', () => {
  const FIRES = 'subtask.approaches >= 2'
  const SKIPS = 'subtask.lines < 20'

  it('1. gate fires + NO skip_gate → both run it', async () => {
    const j = nextJudgment()
    writeJudgment(j, FIRES, SKIPS)
    writeMaster(j, false)
    const ctx = { subtask: { approaches: 4, lines: 5 } }
    expect((await gatesVerdict(ctx)).ran).toBe(true)
    expect((await orchestratorVerdict(ctx)).ran).toBe(true)
  })

  it('2. gate fires + skip_gate TRUE → both veto, both name the skip ref', async () => {
    const j = nextJudgment()
    writeJudgment(j, FIRES, SKIPS)
    writeMaster(j, true)
    const ctx = { subtask: { approaches: 4, lines: 5 } }
    const gates = await gatesVerdict(ctx)
    const orch = await orchestratorVerdict(ctx)
    expect(gates.ran).toBe(false)
    expect(orch.ran).toBe(false)
    expect(gates.reason).toContain(`judgments.${j}.demo.skips`)
    expect(orch.reason).toContain(`judgments.${j}.demo.skips`)
  })

  it('3. gate does NOT fire → both skip for the GATE reason, neither consults skip_gate', async () => {
    const j = nextJudgment()
    writeJudgment(j, FIRES, SKIPS)
    writeMaster(j, true)
    const ctx = { subtask: { approaches: 1, lines: 5 } }
    const gates = await gatesVerdict(ctx)
    const orch = await orchestratorVerdict(ctx)
    expect(gates.ran).toBe(false)
    expect(orch.ran).toBe(false)
    expect(gates.reason).not.toContain('.skips')
    expect(orch.reason).not.toContain('.skips')
  })

  it('4. skip_gate faults (undefined variable) → NEITHER vetoes (no silent gate deletion)', async () => {
    const j = nextJudgment()
    writeJudgment(j, FIRES, 'never_declared_flag == true')
    writeMaster(j, true)
    const ctx = { subtask: { approaches: 4, lines: 5 } }
    expect((await gatesVerdict(ctx)).ran).toBe(true)
    expect((await orchestratorVerdict(ctx)).ran).toBe(true)
  })

  it('5. skip_gate FALSE → both run it (the veto is not a second gate)', async () => {
    const j = nextJudgment()
    writeJudgment(j, FIRES, SKIPS)
    writeMaster(j, true)
    const ctx = { subtask: { approaches: 4, lines: 500 } }
    expect((await gatesVerdict(ctx)).ran).toBe(true)
    expect((await orchestratorVerdict(ctx)).ran).toBe(true)
  })
})

// ── The ✅ / ❌ collision ──────────────────────────────────────────────────────
//
// The truth table above says what happens when the skip gate is true; it does not
// say that this was CHOSEN. It has to be, because the two halves of a judgment are
// not mutually exclusive: they are independent criteria over the same facts, and a
// context can satisfy both. The shipped phase-tier criterion is the live proof —
// `phase.open_decisions >= 2` (✅) and `phase.scope_days < 1` (❌) are both true for
// a three-decision half-day phase, which is an ordinary Tuesday, not a config bug.
//
// ❌ wins. The rule comes from the methodology the judgments encode: its fallback
// 铁律 is 「拿不准 → 倾向跳过」 — an ambiguous signal resolves toward NOT running the
// governance step, and then saying so. ✅-wins would invert that, turning every
// overlapping context into a mandatory gate the operator explicitly scoped out.
//
// Asserted on both engines so the precedence cannot drift into a path difference.
describe('skip_gate precedence — a true skips_when OVERRIDES a true fires_when', () => {
  /** The real phase-tier expressions, so this test tracks the shipped criterion. */
  const PHASE_GATE = (() => {
    const parsed = parseYaml(
      readFileSync(join(process.cwd(), 'workflows', 'judgments', 'phase-gate.yaml'), 'utf8'),
    ) as { triggers: Record<string, { fires_when: string; skips_when: string }> }
    const t = parsed.triggers['gsd-discuss-phase']
    if (!t) throw new Error('phase-gate.yaml lost its gsd-discuss-phase trigger')
    return t
  })()

  /** 3 open decisions (✅ fires) in a half-day phase (❌ skips) — both halves true. */
  const COLLIDING_CTX = {
    phase: {
      open_decisions: 3,
      has_cross_phase_data_flow: false,
      scope_days: 0.5,
      single_task: false,
    },
  }

  it('the shipped phase-tier criterion really can satisfy both halves at once', () => {
    // If this ever goes false the precedence question became hypothetical and the
    // test below stops proving anything — that is worth knowing loudly.
    expect(evalGate(PHASE_GATE.fires_when, COLLIDING_CTX)).toBe(true)
    expect(evalGate(PHASE_GATE.skips_when, COLLIDING_CTX)).toBe(true)
  })

  it('both engines SKIP, and both name the skip gate as the reason', async () => {
    const j = nextJudgment()
    writeJudgment(j, PHASE_GATE.fires_when, PHASE_GATE.skips_when)
    writeMaster(j, true)
    const gates = await gatesVerdict(COLLIDING_CTX)
    const orch = await orchestratorVerdict(COLLIDING_CTX)
    expect(gates.ran).toBe(false)
    expect(orch.ran).toBe(false)
    // Not merely skipped — skipped BECAUSE of the veto. A skip attributed to the
    // gate not firing would mean fires_when had quietly stopped matching.
    expect(gates.reason).toContain(`judgments.${j}.demo.skips`)
    expect(orch.reason).toContain(`judgments.${j}.demo.skips`)
  })
})
