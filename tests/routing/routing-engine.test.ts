// Phase 2.2 W4 T4.3 — routing-engine integration tests (ADR 0011 W4 / B-04 / R6).
// Covers engine.runRouting() with sdkSpawn wired as defaultSpawn:
//   1. end-to-end: SDK query() mocked → engine returns verbatim COMPLETE
//   2. max-iterations退场: SDK returns PARTIAL → MaxIterationsExceededError → aborted
//   3. opts.spawn injection seam (backward compat — phase 1.4/1.5 cells unchanged)
//
// Pattern J — mock @anthropic-ai/claude-agent-sdk; real fs via tmpdir for the
// decision_rules.yaml + skill stub. Mirrors tests/unit/routing-engine.test.ts
// fixture pattern; phase 2.2 cells assert the NEW sdkSpawn integration.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ---- Mock SDK (must be set up before any module that imports sdkSpawn) ----

type MockMsg = Record<string, unknown> & { type: string; subtype?: string }
let nextMessagesQueue: MockMsg[][] = []
const queryCallsLog: Array<{ prompt: string; options: Record<string, unknown> }> = []

vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: (params: { prompt: string; options: Record<string, unknown> }) => {
    queryCallsLog.push({ prompt: params.prompt, options: params.options })
    const msgs = nextMessagesQueue.shift() ?? []
    return (async function* () {
      for (const m of msgs) yield m
    })()
  },
}))

// Import AFTER vi.mock so the mocked SDK is picked up by sdkSpawn.
import { runRouting } from '../../src/routing/engine.js'

// ---- Fixtures -------------------------------------------------------------

const RULES_YAML = `version: 1
hit_policy: P
rules:
  - id: search-default
    priority: 100
    domain: search
    when:
      task_type: search
    decision:
      primary_expert: tavily-mcp
      required_skills: [tavily-mcp]
fallback_supervisor:
  trigger: no-rule-match
  llm: claude-opus-4-7
`

let workdir: string
let rulesPath: string
let skillsRoot: string

beforeEach(() => {
  workdir = mkdtempSync(join(tmpdir(), 'harnessed-engine-w4-'))
  rulesPath = join(workdir, 'decision_rules.yaml')
  skillsRoot = join(workdir, 'skills')
  writeFileSync(rulesPath, RULES_YAML, 'utf8')
  mkdirSync(skillsRoot, { recursive: true })
  // stub the tavily-mcp skill so ensureSkillsInstalled passes
  mkdirSync(join(skillsRoot, 'tavily-mcp'), { recursive: true })
  writeFileSync(join(skillsRoot, 'tavily-mcp', 'SKILL.md'), '# tavily-mcp\n', 'utf8')
  // reset mock queue
  nextMessagesQueue = []
  queryCallsLog.length = 0
})
afterEach(() => {
  rmSync(workdir, { recursive: true, force: true })
  vi.clearAllMocks()
})

// ---- Cells ---------------------------------------------------------------

describe('runRouting — end-to-end with sdkSpawn (T4.2 wire-up)', () => {
  it('1. happy path — SDK query() mock returns COMPLETE → engine ok=true', async () => {
    nextMessagesQueue = [
      [
        {
          type: 'result',
          subtype: 'success',
          result: '<promise>COMPLETE</promise>',
          structured_output: { status: 'COMPLETE', phase: '04-deliver' },
          session_id: 'sess-1',
        },
      ],
    ]
    const result = await runRouting(
      { task: 'find docs', task_type: 'search' },
      { rulesPath, skillsRoot, maxIterations: 5 },
    )
    expect(result).toMatchObject({ ok: true })
    if ('ok' in result && result.ok === true) {
      expect(result.matchedRule?.id).toBe('search-default')
    }
    // SDK was actually invoked
    expect(queryCallsLog.length).toBeGreaterThan(0)
    const firstCall = queryCallsLog[0]
    if (!firstCall) throw new Error('unreachable — checked above')
    expect(firstCall.options.agents).toMatchObject({ 'tavily-mcp': expect.anything() })
  })

  it('2. max-iter — SDK always returns PARTIAL (no COMPLETE) → aborted', async () => {
    // Queue 3 iterations all PARTIAL (no <promise>COMPLETE</promise> + no
    // structured_output.status=COMPLETE) → ralphLoopWrap hits maxIterations.
    const partialMsg: MockMsg = {
      type: 'result',
      subtype: 'success',
      result: 'still working...',
      structured_output: { status: 'PARTIAL', phase: '02-code' },
      session_id: 's',
    }
    nextMessagesQueue = [[partialMsg], [partialMsg], [partialMsg]]
    const result = await runRouting(
      { task: 'search', task_type: 'search' },
      { rulesPath, skillsRoot, maxIterations: 3 },
    )
    expect(result).toMatchObject({ aborted: true })
    if ('aborted' in result && result.aborted === true) {
      expect(result.reason).toMatch(/max-iterations/i)
    }
    expect(queryCallsLog.length).toBe(3)
  })
})

describe('runRouting — injection seam (backward-compat with phase 1.4)', () => {
  it('3. opts.spawn (1-arg) overrides defaultSpawn — SDK NOT called', async () => {
    let userSpawnCalls = 0
    const result = await runRouting(
      { task: 'search', task_type: 'search' },
      {
        rulesPath,
        skillsRoot,
        spawn: async () => {
          userSpawnCalls++
          return '<promise>COMPLETE</promise>'
        },
      },
    )
    expect(result).toMatchObject({ ok: true })
    expect(userSpawnCalls).toBe(1)
    // Critical: SDK query() was NEVER called when opts.spawn is provided.
    expect(queryCallsLog.length).toBe(0)
  })
})

describe('runRouting — ralphLoopWrap session resume closure (CD-4 ready)', () => {
  it('4. system:init session_id captured across iterations via wrappedSpawn closure', async () => {
    // 1st iter: emits init w/ session_id 'sess-a' + PARTIAL → ralph retries
    // 2nd iter: emits COMPLETE → ralph returns
    // Verify SDK got called twice (closure infrastructure works end-to-end).
    nextMessagesQueue = [
      [
        { type: 'system', subtype: 'init', session_id: 'sess-a' },
        {
          type: 'result',
          subtype: 'success',
          result: 'partial',
          structured_output: { status: 'PARTIAL', phase: '02-code' },
          session_id: 'sess-a',
        },
      ],
      [
        {
          type: 'result',
          subtype: 'success',
          result: '<promise>COMPLETE</promise>',
          structured_output: { status: 'COMPLETE', phase: '04-deliver' },
          session_id: 'sess-a',
        },
      ],
    ]
    const result = await runRouting(
      { task: 'search', task_type: 'search' },
      { rulesPath, skillsRoot, maxIterations: 5 },
    )
    expect(result).toMatchObject({ ok: true })
    expect(queryCallsLog.length).toBe(2)
  })
})
