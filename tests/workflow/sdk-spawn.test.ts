// Phase 2.2 W4 T4.3 — sdkSpawn unit tests (ADR 0011 errata / B-04 + B-31 + R6).
// Covers:
//   1. 5-字段 SDK input shape passed to query() (toSdkAgentDefinition unpack)
//   2. PRIMARY structured_output path → envelope.structured_output.status='COMPLETE'
//   3. FALLBACK <promise>COMPLETE</promise> extract path (text-only result)
//   4. session_id capture via onSessionId callback (CD-4 closure-ready)
//   5. resumeSessionId → options.resume propagation (T2.4 closure wiring)
//   6. SpawnFailError when SDK never emits a result message
//
// Pattern J — mock only @anthropic-ai/claude-agent-sdk; no fs mock needed.
// `query()` is mocked to return an async iterable of typed SDKMessage shapes
// (sdk.d.ts:3172) — covers both PRIMARY (structured_output populated) and
// FALLBACK (only `result` text with <promise>COMPLETE</promise>) per B-07.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ---- Mock SDK -------------------------------------------------------------

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

import type { AgentDefinition } from '../../src/workflow/lib/agentDefinition.js'
// Import AFTER vi.mock so the mocked symbol is picked up.
import { SpawnFailError, sdkSpawn } from '../../src/workflow/lib/sdkSpawn.js'

// ---- Fixtures -------------------------------------------------------------

const baseDef: AgentDefinition = {
  description: 'test expert',
  prompt: 'BASE PROMPT',
  initialPrompt: 'INITIAL PROMPT',
  tools: ['Read', 'Edit'],
  disallowedTools: ['Bash'],
  model: 'claude-sonnet-4-5',
  skills: ['tavily-mcp'],
  mcpServers: {},
  memory: '',
  maxTurns: 10,
  background: false,
  effort: 'medium',
  permissionMode: 'default',
  criticalSystemReminder_EXPERIMENTAL: '',
} as unknown as AgentDefinition

beforeEach(() => {
  calls.length = 0
  nextMessages = []
})
afterEach(() => {
  vi.clearAllMocks()
})

/** Tiny helper — asserts at least one call recorded and returns it (avoids
 *  biome lint/style/noNonNullAssertion). */
function firstCall(): QueryCallCapture {
  const c = calls[0]
  if (!c) throw new Error('expected query() to have been called at least once')
  return c
}

// ---- Cells ----------------------------------------------------------------

describe('sdkSpawn — SDK input shape (5-字段 toSdkAgentDefinition unpack)', () => {
  it('1. query() receives 5-key SDK AgentDefinition under agents[expertName]', async () => {
    nextMessages = [
      {
        type: 'result',
        subtype: 'success',
        result: '<promise>COMPLETE</promise>',
        structured_output: { status: 'COMPLETE', phase: '04-deliver' },
        session_id: 'sess-1',
      },
    ]
    await sdkSpawn(baseDef, { expertName: 'tavily-mcp' })
    expect(calls).toHaveLength(1)
    const firstCall = calls[0]
    expect(firstCall).toBeDefined()
    if (!firstCall) throw new Error('unreachable')
    const sdkAgent = (firstCall.options.agents as Record<string, Record<string, unknown>>)[
      'tavily-mcp'
    ] as Record<string, unknown>
    expect(sdkAgent).toBeDefined()
    expect(Object.keys(sdkAgent).sort()).toEqual(
      ['description', 'disallowedTools', 'model', 'prompt', 'tools'].sort(),
    )
  })

  it('2. query() options carry outputFormat:{type:json_schema,schema:COMPLETION_SCHEMA}', async () => {
    nextMessages = [
      {
        type: 'result',
        subtype: 'success',
        result: '<promise>COMPLETE</promise>',
        session_id: 'x',
      },
    ]
    await sdkSpawn(baseDef, { expertName: 'e' })
    const of = firstCall().options.outputFormat as {
      type: string
      schema: { properties: unknown }
    }
    expect(of.type).toBe('json_schema')
    expect(of.schema.properties).toBeDefined()
  })
})

describe('sdkSpawn — PRIMARY path (structured_output)', () => {
  it('3. PRIMARY — structured_output.status COMPLETE → envelope carries it', async () => {
    nextMessages = [
      {
        type: 'result',
        subtype: 'success',
        result: 'human-readable summary text',
        structured_output: { status: 'COMPLETE', phase: '04-deliver', summary: 'done' },
        session_id: 'sess-2',
      },
    ]
    const out = await sdkSpawn(baseDef, { expertName: 'e' })
    const env = JSON.parse(out)
    expect(env.subtype).toBe('success')
    expect(env.structured_output.status).toBe('COMPLETE')
    expect(env.text).toBe('human-readable summary text')
  })
})

describe('sdkSpawn — FALLBACK path (<promise>COMPLETE</promise>)', () => {
  it('4. FALLBACK — no structured_output, text contains promise wrapper', async () => {
    nextMessages = [
      {
        type: 'result',
        subtype: 'success',
        result: 'did work\n<promise>COMPLETE</promise>',
        session_id: 'sess-3',
      },
    ]
    const out = await sdkSpawn(baseDef, { expertName: 'e' })
    const env = JSON.parse(out)
    expect(env.structured_output).toBeUndefined()
    expect(env.text).toContain('<promise>COMPLETE</promise>')
  })
})

describe('sdkSpawn — session_id capture + resume propagation', () => {
  it('5. system:init session_id → onSessionId callback fires', async () => {
    nextMessages = [
      { type: 'system', subtype: 'init', session_id: 'sess-init-1' },
      {
        type: 'result',
        subtype: 'success',
        result: '<promise>COMPLETE</promise>',
        session_id: 'sess-init-1',
      },
    ]
    const captured: string[] = []
    await sdkSpawn(baseDef, { expertName: 'e', onSessionId: (id) => captured.push(id) })
    expect(captured).toEqual(['sess-init-1'])
  })

  it('6. resumeSessionId → options.resume passed to query()', async () => {
    nextMessages = [
      {
        type: 'result',
        subtype: 'success',
        result: '<promise>COMPLETE</promise>',
        session_id: 's',
      },
    ]
    await sdkSpawn(baseDef, { expertName: 'e', resumeSessionId: 'resume-me' })
    expect(firstCall().options.resume).toBe('resume-me')
  })

  it('7. resumeSessionId absent → options.resume NOT set', async () => {
    nextMessages = [
      {
        type: 'result',
        subtype: 'success',
        result: '<promise>COMPLETE</promise>',
        session_id: 's',
      },
    ]
    await sdkSpawn(baseDef, { expertName: 'e' })
    expect('resume' in firstCall().options).toBe(false)
  })
})

describe('sdkSpawn — failure modes', () => {
  it('8. SDK never emits result → SpawnFailError thrown', async () => {
    nextMessages = [{ type: 'system', subtype: 'init', session_id: 's' }]
    await expect(sdkSpawn(baseDef, { expertName: 'e' })).rejects.toBeInstanceOf(SpawnFailError)
  })
})
