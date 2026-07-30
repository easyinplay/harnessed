// Phase v3.0-3.3 W0 T3.3.W0.10 — check-workflow-schema.mjs cross-validate tests.
// Per PLAN.md L334-343 acceptance:
//   1. exit 0 在 Phase 3.3 W0 末 (0 workflow yaml 时仅 capabilities + disciplines + judgments validate)
//   2. Negative: tools_available [nonexistent-cap] → exit 1
//   3. Negative: disciplines_applied [bogus] → exit 1
//   4. Negative: judgments invokes [{capability: bogus}] → exit 1 (NEW C.2)
//   5. Negative: master delegates_to serial 无 order → exit 1
//   6. ci.yml wire 不变 — verified by existing CI workflow file unchanged
//
// Tests build minimal yaml dirs in tmpdir, set HARNESSED_CHECK_ROOT env, spawn
// `node scripts/check-workflow-schema.mjs`, assert exit code + stderr content.

import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const SCRIPT = resolve(process.cwd(), 'scripts/check-workflow-schema.mjs')

let tmp = ''

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'check-wf-schema-'))
  mkdirSync(join(tmp, 'workflows'), { recursive: true })
})

afterEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true })
})

/** Write minimal valid capabilities.yaml + return its entry name set. */
function writeCaps(extraEntries: Record<string, unknown> = {}): string[] {
  const caps = {
    schema_version: 'harnessed.capabilities.v1',
    capabilities: {
      'office-hours': {
        impl: 'gstack',
        cmd: '/office-hours',
        since: 'v1.0',
        category: 'tool-slash-cmd',
      },
      'gsd-discuss-phase': {
        impl: 'gsd',
        cmd: '/gsd-discuss-phase',
        since: 'v1.0',
        category: 'tool-slash-cmd',
      },
      ...extraEntries,
    },
  }
  writeFileSync(
    join(tmp, 'workflows', 'capabilities.yaml'),
    JSON.stringify(caps), // YAML parser accepts JSON
    'utf8',
  )
  return Object.keys(caps.capabilities)
}

/** Write 1 minimal valid discipline yaml (basename selectable). */
function writeDiscipline(basename: string, extra: Record<string, unknown> = {}) {
  const dir = join(tmp, 'workflows', 'disciplines')
  mkdirSync(dir, { recursive: true })
  const d = {
    schema_version: 'harnessed.discipline.v1',
    discipline: basename,
    enforcement_layer: 'code-writing',
    auto_enforce: true,
    rules: [],
    ...extra,
  }
  writeFileSync(join(dir, `${basename}.yaml`), JSON.stringify(d), 'utf8')
}

/** Write a judgment file with optional invokes refs. */
function writeJudgment(fileName: string, triggers: Record<string, unknown>) {
  const dir = join(tmp, 'workflows', 'judgments')
  mkdirSync(dir, { recursive: true })
  const j = { schema_version: 'harnessed.judgment.v1', triggers }
  writeFileSync(join(dir, `${fileName}.yaml`), JSON.stringify(j), 'utf8')
}

/** Write a workflow yaml at workflows/<name>/workflow.yaml (flat). */
function writeWorkflow(stage: string, body: Record<string, unknown>) {
  const dir = join(tmp, 'workflows', stage)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'workflow.yaml'), JSON.stringify(body), 'utf8')
}

function runScript(): { code: number; stdout: string; stderr: string } {
  const r = spawnSync('node', [SCRIPT], {
    env: { ...process.env, HARNESSED_CHECK_ROOT: tmp },
    encoding: 'utf8',
  })
  return { code: r.status ?? -1, stdout: r.stdout ?? '', stderr: r.stderr ?? '' }
}

describe('check-workflow-schema — Phase 3.3 W0 末 tolerance + positive baseline', () => {
  it('1. 0 workflow yaml + caps + disciplines + judgments → exit 0', () => {
    writeCaps()
    writeDiscipline('karpathy')
    writeJudgment('strategic-gate', {})
    const r = runScript()
    expect(r.code).toBe(0)
    expect(r.stdout).toContain('validation passed')
    expect(r.stdout).toContain('v2=0 / v3=0')
  })

  it('2. valid v2 workflow yaml + caps + disciplines → exit 0', () => {
    writeCaps()
    writeDiscipline('karpathy')
    writeWorkflow('plan-feature', {
      schema_version: 'harnessed.workflow.v2',
      workflow: 'plan-feature',
      phases: [{ id: 'p1' }],
    })
    const r = runScript()
    expect(r.code).toBe(0)
    expect(r.stdout).toContain('v2=1')
  })
})

describe('check-workflow-schema — Contract 1: tools_available ⊂ capabilities', () => {
  it('3. v2 phase tools_available [nonexistent-cap] → exit 1 with capabilities error', () => {
    writeCaps()
    writeWorkflow('plan-feature', {
      schema_version: 'harnessed.workflow.v2',
      workflow: 'plan-feature',
      phases: [{ id: 'p1', tools_available: ['nonexistent-cap'] }],
    })
    const r = runScript()
    expect(r.code).toBe(1)
    expect(r.stderr).toContain("'nonexistent-cap' not in capabilities.yaml")
  })

  it('4. v3 phase tools_available [bogus] → exit 1', () => {
    writeCaps()
    writeDiscipline('karpathy')
    writeWorkflow('plan-auto', {
      schema_version: 'harnessed.workflow.v3',
      workflow: 'plan',
      phases: [{ id: 'p1', tools_available: ['bogus-cap'] }],
    })
    const r = runScript()
    expect(r.code).toBe(1)
    expect(r.stderr).toContain("'bogus-cap' not in capabilities.yaml")
  })

  it('5. v2 phase tools_available [office-hours] (valid entry) → exit 0', () => {
    writeCaps()
    writeWorkflow('plan-feature', {
      schema_version: 'harnessed.workflow.v2',
      workflow: 'plan-feature',
      phases: [{ id: 'p1', tools_available: ['office-hours'] }],
    })
    const r = runScript()
    expect(r.code).toBe(0)
  })
})

describe('check-workflow-schema — Contract 2: disciplines_applied ⊂ disciplines/', () => {
  it('6. v3 disciplines_applied [bogus] → exit 1 with disciplines error', () => {
    writeCaps()
    writeDiscipline('karpathy')
    writeWorkflow('plan-auto', {
      schema_version: 'harnessed.workflow.v3',
      workflow: 'plan',
      disciplines_applied: ['bogus'],
      phases: [{ id: 'p1' }],
    })
    const r = runScript()
    expect(r.code).toBe(1)
    expect(r.stderr).toContain("'bogus' not in disciplines/")
  })

  it('7. v3 disciplines_applied [karpathy] (valid basename) → exit 0', () => {
    writeCaps()
    writeDiscipline('karpathy')
    writeWorkflow('plan-auto', {
      schema_version: 'harnessed.workflow.v3',
      workflow: 'plan',
      disciplines_applied: ['karpathy'],
      phases: [{ id: 'p1' }],
    })
    const r = runScript()
    expect(r.code).toBe(0)
  })
})

describe('check-workflow-schema — Contract 3 (NEW C.2): judgments invokes ⊂ capabilities', () => {
  it('8. judgments triggers invokes [{capability: bogus}] → exit 1', () => {
    writeCaps()
    writeJudgment('strategic-gate', {
      'some-trigger': {
        fires_when: 'true',
        invokes: [{ capability: 'bogus-cap' }],
      },
    })
    const r = runScript()
    expect(r.code).toBe(1)
    expect(r.stderr).toContain("'bogus-cap' not in capabilities.yaml")
  })

  it('9. judgments invokes [{capability: office-hours}] (valid entry) → exit 0', () => {
    writeCaps()
    writeJudgment('strategic-gate', {
      'office-hours-trigger': {
        fires_when: 'true',
        invokes: [{ capability: 'office-hours' }],
      },
    })
    // T2.3 orphan gate: a trigger must be referenced by some workflow gate.
    writeWorkflow('discuss', {
      schema_version: 'harnessed.workflow.v2',
      workflow: 'discuss',
      phases: [{ id: 'p1', gate: 'judgments.strategic-gate.office-hours-trigger.fires' }],
    })
    const r = runScript()
    expect(r.code).toBe(0)
  })
})

// T2.3 — orphan judgment trigger gate. Before this gate the 3 bundled routing
// judgments (web-search / web-testing / web-design, 12 triggers) had zero `gate:`
// reference: resolveJudgmentGate is purely ref-driven, so nothing ever loaded or
// evaluated them and no test could tell. This is the missing static invariant.
describe('check-workflow-schema — T2.3 orphan judgment trigger gate', () => {
  it('15. trigger referenced by no workflow gate → exit 1 naming the orphan', () => {
    writeCaps()
    writeJudgment('web-search-routing', {
      'tavily-mcp-default': { fires_when: 'subtask.needs_web_search == true' },
    })
    const r = runScript()
    expect(r.code).toBe(1)
    expect(r.stderr).toContain('judgments.web-search-routing.tavily-mcp-default')
    expect(r.stderr).toContain('never referenced')
  })

  it('16. trigger referenced via phases[].gate → exit 0', () => {
    writeCaps()
    writeJudgment('web-search-routing', { 'tavily-mcp-default': { fires_when: 'true' } })
    writeWorkflow('research', {
      schema_version: 'harnessed.workflow.v3',
      workflow: 'research',
      phases: [{ id: '01-a', gate: 'judgments.web-search-routing.tavily-mcp-default.fires' }],
    })
    const r = runScript()
    expect(r.code).toBe(0)
  })

  it('17. trigger referenced via delegates_to[].gate → exit 0', () => {
    writeCaps()
    writeJudgment('stage-routing', { 'verify-qa-ui': { fires_when: 'true' } })
    writeWorkflow('verify', {
      schema_version: 'harnessed.workflow.v3',
      workflow: 'verify',
      delegates_to: [
        { sub: 'qa', gate: 'judgments.stage-routing.verify-qa-ui.fires', mode: 'parallel' },
      ],
    })
    const r = runScript()
    expect(r.code).toBe(0)
  })

  it('18. trigger referenced via phases[].parallelism → exit 0', () => {
    writeCaps()
    writeJudgment('parallelism-gate', { 'subagent-default': { fires_when: 'true' } })
    writeWorkflow('research', {
      schema_version: 'harnessed.workflow.v3',
      workflow: 'research',
      phases: [{ id: '01-a', parallelism: 'judgments.parallelism-gate.subagent-default.fires' }],
    })
    const r = runScript()
    expect(r.code).toBe(0)
  })

  it('19. trigger referenced via phases[].skip_gate (forward-compat field) → exit 0', () => {
    writeCaps()
    writeJudgment('tdd-gate', { 'tdd-strongly-suggested': { fires_when: 'true' } })
    writeWorkflow('task', {
      schema_version: 'harnessed.workflow.v3',
      workflow: 'task',
      phases: [{ id: '01-a', skip_gate: 'judgments.tdd-gate.tdd-strongly-suggested.skips' }],
    })
    const r = runScript()
    expect(r.code).toBe(0)
  })

  // T2.1 D-5 — `delegates_to[].skip_gate` is the field that actually ships (the
  // phases[] read above was written forward-compatibly before it existed). A
  // trigger reachable ONLY through a skip_gate must count as referenced,
  // otherwise wiring the ❌ half of a judgment would trip the orphan gate.
  it('19b. trigger referenced ONLY via delegates_to[].skip_gate → exit 0', () => {
    writeCaps()
    writeJudgment('subtask-gate', {
      brainstorming: { skips_when: "subtask.type in ['crud']" },
    })
    writeWorkflow('task', {
      schema_version: 'harnessed.workflow.v3',
      workflow: 'task',
      delegates_to: [
        {
          sub: 'clarify',
          skip_gate: 'judgments.subtask-gate.brainstorming.skips',
          mode: 'serial',
          order: 1,
        },
      ],
    })
    const r = runScript()
    expect(r.code).toBe(0)
  })

  it('20. fallback.yaml rules + user-overrides.yaml are exempt (not triggers-shaped)', () => {
    writeCaps()
    const dir = join(tmp, 'workflows', 'judgments')
    mkdirSync(dir, { recursive: true })
    writeFileSync(
      join(dir, 'fallback.yaml'),
      JSON.stringify({
        schema_version: 'harnessed.judgment.v1',
        rules: { 'uncertain-skip-transparently': { description: 'x' } },
      }),
      'utf8',
    )
    writeFileSync(
      join(dir, 'user-overrides.yaml'),
      JSON.stringify({
        schema_version: 'harnessed.user-overrides.v1',
        overrides: [
          { id: 'o1', keywords: ['k'], triggers: ['judgments.subtask-gate.brainstorming.fires'] },
        ],
      }),
      'utf8',
    )
    const r = runScript()
    expect(r.code).toBe(0)
  })

  it('21. allowlisted exemption (stage-phase-gate.gsd-ui-phase) is not reported', () => {
    writeCaps()
    writeJudgment('stage-phase-gate', {
      'gsd-ui-phase': { fires_when: 'phase.has_ui_changes == true' },
    })
    const r = runScript()
    expect(r.code).toBe(0)
  })
})

describe('check-workflow-schema — K9 invariant: master serial mode requires order', () => {
  it('10. v3 master delegates_to[] serial w/o order → exit 1', () => {
    writeCaps()
    writeDiscipline('karpathy')
    writeWorkflow('plan-auto', {
      schema_version: 'harnessed.workflow.v3',
      workflow: 'plan',
      phases: [{ id: 'p1' }],
      delegates_to: [{ stage: 'architecture', mode: 'serial' }],
    })
    const r = runScript()
    expect(r.code).toBe(1)
    expect(r.stderr).toContain('serial mode requires explicit order')
  })

  it('11. v3 master delegates_to[] serial w/ order → exit 0', () => {
    writeCaps()
    writeDiscipline('karpathy')
    writeWorkflow('plan-auto', {
      schema_version: 'harnessed.workflow.v3',
      workflow: 'plan',
      phases: [{ id: 'p1' }],
      delegates_to: [{ stage: 'architecture', mode: 'serial', order: 1 }],
    })
    const r = runScript()
    expect(r.code).toBe(0)
  })

  it('12. v3 master delegates_to[] parallel mode (no order needed) → exit 0', () => {
    writeCaps()
    writeDiscipline('karpathy')
    writeWorkflow('plan-auto', {
      schema_version: 'harnessed.workflow.v3',
      workflow: 'plan',
      phases: [{ id: 'p1' }],
      delegates_to: [
        { stage: 'a', mode: 'parallel' },
        { stage: 'b', mode: 'parallel' },
      ],
    })
    const r = runScript()
    expect(r.code).toBe(0)
  })
})

describe('check-workflow-schema — Discipline schema validate + non-workflow dirs skip', () => {
  it('13. invalid discipline yaml (wrong schema_version) → exit 1', () => {
    writeCaps()
    const dir = join(tmp, 'workflows', 'disciplines')
    mkdirSync(dir, { recursive: true })
    writeFileSync(
      join(dir, 'broken.yaml'),
      JSON.stringify({
        schema_version: 'wrong-surface',
        discipline: 'broken',
        enforcement_layer: 'code-writing',
        auto_enforce: true,
        rules: [],
      }),
      'utf8',
    )
    const r = runScript()
    expect(r.code).toBe(1)
    expect(r.stderr).toContain('disciplines/broken.yaml')
  })

  it('14. disciplines/ + judgments/ dirs NOT treated as workflow dirs (no spurious scan)', () => {
    writeCaps()
    writeDiscipline('karpathy')
    writeJudgment('strategic-gate', {})
    // disciplines/ has no workflow.yaml — must NOT trigger workflow scan errors
    const r = runScript()
    expect(r.code).toBe(0)
    expect(r.stdout).toContain('v2=0 / v3=0')
  })
})
