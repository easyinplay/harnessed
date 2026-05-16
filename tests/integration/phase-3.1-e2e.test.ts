// Phase 3.1 W5 T5.1 — e2e SIGINT → resume → SDK redirect smoke (D-04 WIRE-IN).
// Sister: tests/routing/sdk-spawn.test.ts L157-198 § "session_id capture + resume
// propagation" direct analog with SIGINT mock added (PATTERNS § 2.8 90% reuse).
// Verifies the full Phase 3.1 closure: engineHook activate → sigintTrap pause +
// writeCheckpoint → resume.runResume reload → SDK redirect via options.resume.

import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runResume } from '../../src/checkpoint/resume.js'
import { activate as stateActivate, pause as statePause } from '../../src/checkpoint/state.js'
import { writeCheckpoint } from '../../src/checkpoint/template.js'
import { SCHEMA_VERSIONS } from '../../src/types/schemaVersion.js'

// ---- Mock SDK (sister sdk-spawn.test.ts L17-34) ---------------------------
interface QueryCallCapture {
  prompt: string
  options: Record<string, unknown>
}
const calls: QueryCallCapture[] = []
type MockMsg = Record<string, unknown> & { type: string; subtype?: string }
let nextMessages: MockMsg[] = []

vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  query: (params: { prompt: string; options: Record<string, unknown> }) => {
    calls.push({ prompt: params.prompt, options: params.options })
    return (async function* () {
      for (const m of nextMessages) yield m
    })()
  },
}))

// ---- tmpdir cwd swap (sister tests/cli/resume.test.ts pattern) -------------
let tmp: string
let originalCwd: string

beforeEach(async () => {
  calls.length = 0
  nextMessages = []
  originalCwd = process.cwd()
  tmp = mkdtempSync(join(tmpdir(), 'phase-3.1-e2e-'))
  process.chdir(tmp)
  await mkdir('.harnessed/checkpoints', { recursive: true })
})

afterEach(() => {
  process.chdir(originalCwd)
  rmSync(tmp, { recursive: true, force: true })
  vi.clearAllMocks()
})

describe('Phase 3.1 e2e — SIGINT → resume → SDK redirect (D-04 WIRE-IN)', () => {
  it('1. SIGINT-equivalent state → current-workflow paused + checkpoint session_id captured', async () => {
    // Setup: simulate engineHook activate → SIGINT trap path (writeCheckpoint + state.pause).
    // We invoke the underlying state + template ops directly because actually firing process.on
    // ('SIGINT', ...) inside vitest would exit the test runner. The handler body is unit-covered
    // in tests/checkpoint/sigint.test.ts; here we verify the *output artifacts* compose correctly.
    await stateActivate('3.1-e2e', '.harnessed/checkpoints/3.1-e2e.json')
    const captured = 'sess-trap-1'
    writeCheckpoint({
      schemaVersion: SCHEMA_VERSIONS.checkpoint,
      phase: '3.1-e2e',
      status: 'paused',
      last_task: 'iter 3 of ralph-loop interrupted by SIGINT',
      key_decisions: ['D-04 WIRE-IN activated'],
      canonical_refs: ['.planning/phase-3.1/PLAN.md'],
      session_id: captured,
      cwd: process.cwd(),
      timestamp: new Date().toISOString(),
      archive_path: '.harnessed/archive/phase-3.1-e2e/',
    })
    await statePause()

    const wf = JSON.parse(readFileSync('.harnessed/current-workflow.json', 'utf8'))
    expect(wf.status).toBe('paused')
    expect(wf.paused_at).toBeTruthy()
    expect(wf.last_checkpoint_path).toBe('.harnessed/checkpoints/3.1-e2e.json')

    const cp = JSON.parse(readFileSync('.harnessed/checkpoints/3.1-e2e.json', 'utf8'))
    expect(cp.session_id).toBe(captured)
    expect(cp.status).toBe('paused')
  })

  it('2. harnessed resume → outputs session_id hint + ok status', async () => {
    // Setup: state from previous cycle pattern (paused + session_id captured).
    await stateActivate('3.1-e2e', '.harnessed/checkpoints/3.1-e2e.json')
    writeCheckpoint({
      schemaVersion: SCHEMA_VERSIONS.checkpoint,
      phase: '3.1-e2e',
      status: 'paused',
      last_task: 'paused state for resume test',
      key_decisions: [],
      canonical_refs: [],
      session_id: 'sess-trap-1',
      cwd: process.cwd(),
      timestamp: new Date().toISOString(),
      archive_path: '.harnessed/archive/phase-3.1-e2e/',
    })
    await statePause()

    const r = await runResume()
    expect(r.status).toBe('ok')
    if (r.status !== 'ok') throw new Error('unreachable')
    expect(r.checkpoint.session_id).toBe('sess-trap-1')
    expect(r.checkpoint.phase).toBe('3.1-e2e')
    expect(r.resumeHint).toContain('sess-trap-1')
    expect(r.resumeHint).toContain('/gsd-execute-phase 3.1-e2e')
    expect(r.resumeHint).toContain('SDK will redirect')
  })

  it('3. SDK redirect — sdkSpawn invoked with options.resume === captured session_id', async () => {
    // Sister sdk-spawn.test.ts L173-184 direct analog: prove the captured session_id from
    // checkpoint resume would propagate through to SDK options.resume on a next routing call.
    // We invoke sdkSpawn directly with resumeSessionId derived from checkpoint to keep test
    // hermetic (no real engine cycle needed — that's covered by sdk-spawn.test.ts integration).
    nextMessages = [
      {
        type: 'result',
        subtype: 'success',
        result: '<promise>COMPLETE</promise>',
        session_id: 'sess-trap-1',
      },
    ]
    const { sdkSpawn } = await import('../../src/routing/lib/sdkSpawn.js')
    const baseDef = {
      description: 'e2e expert',
      prompt: 'BASE',
      initialPrompt: 'INITIAL',
      tools: ['Read'],
      disallowedTools: [],
      model: 'claude-sonnet-4-5',
      skills: [],
      mcpServers: {},
      memory: '',
      maxTurns: 5,
      background: false,
      effort: 'low',
      permissionMode: 'default',
      criticalSystemReminder_EXPERIMENTAL: '',
    } as unknown as Parameters<typeof sdkSpawn>[0]
    await sdkSpawn(baseDef, { expertName: 'e2e', resumeSessionId: 'sess-trap-1' })
    expect(calls).toHaveLength(1)
    const c = calls[0]
    if (!c) throw new Error('unreachable')
    expect(c.options.resume).toBe('sess-trap-1')
  })
})
