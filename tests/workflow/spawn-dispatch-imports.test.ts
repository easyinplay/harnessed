import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AgentDefinition } from '../../src/workflow/lib/agentDefinition.js'

const def: AgentDefinition = { description: 'phase expert', prompt: 'BASE PROMPT' }
let loaded: string[]
let sdkSpawn: ReturnType<typeof vi.fn>
let codexExecSpawn: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.resetModules()
  loaded = []
  sdkSpawn = vi.fn(async () => 'sdk result')
  codexExecSpawn = vi.fn(async () => 'codex result')
  // Record module evaluation, not just whether a spawner was called. Keep the
  // SDK module mock single-export, like the existing workflow mocks.
  vi.doMock('../../src/workflow/lib/sdkSpawn.js', () => {
    loaded.push('claude')
    return { sdkSpawn }
  })
  vi.doMock('../../src/workflow/lib/codexExecSpawn.js', () => {
    loaded.push('codex')
    return { codexExecSpawn }
  })
})

afterEach(() => {
  vi.doUnmock('../../src/workflow/lib/sdkSpawn.js')
  vi.doUnmock('../../src/workflow/lib/codexExecSpawn.js')
  vi.resetModules()
})

describe('dispatchSpawn runtime import boundaries', () => {
  it('imports the dispatcher and resolves metadata without loading either spawner', async () => {
    const { dispatchSpawn, resolveSpawnHost } = await import(
      '../../src/workflow/lib/spawnDispatch.js'
    )

    expect(typeof dispatchSpawn).toBe('function')
    expect(['claude', 'codex']).toContain(resolveSpawnHost())
    expect(loaded).toEqual([])
  })

  it.each([
    'claude',
    'codex',
  ] as const)('uses an injected %s spawner without loading either real module', async (host) => {
    const { dispatchSpawn } = await import('../../src/workflow/lib/spawnDispatch.js')
    const injected = vi.fn(async (_def: AgentDefinition, _opts: object) => 'injected result')
    const opts = {
      expertName: '01-code',
      resumeSessionId: 'session-1',
      onSessionId: vi.fn(),
    }

    const result = await dispatchSpawn(def, opts, {
      hostId: () => host,
      ...(host === 'claude' ? { sdkSpawn: injected } : { codexExecSpawn: injected }),
    })

    expect(result).toBe('injected result')
    expect(injected).toHaveBeenCalledExactlyOnceWith(
      def,
      host === 'claude' ? opts : { expertName: '01-code' },
    )
    if (host === 'claude') expect(injected.mock.calls[0]?.[1]).toBe(opts)
    expect(loaded).toEqual([])
  })

  it('loads only the default Claude spawner and forwards the original opts', async () => {
    const { dispatchSpawn } = await import('../../src/workflow/lib/spawnDispatch.js')
    const opts = {
      expertName: '01-code',
      resumeSessionId: 'session-1',
      onSessionId: vi.fn(),
    }

    expect(loaded).toEqual([])
    const result = await dispatchSpawn(def, opts, { hostId: () => 'claude' })

    expect(result).toBe('sdk result')
    expect(loaded).toEqual(['claude'])
    expect(sdkSpawn).toHaveBeenCalledExactlyOnceWith(def, opts)
    expect(sdkSpawn.mock.calls[0]?.[1]).toBe(opts)
    expect(codexExecSpawn).not.toHaveBeenCalled()
  })

  it('loads only the default Codex spawner and drops the Claude session fields', async () => {
    const { dispatchSpawn } = await import('../../src/workflow/lib/spawnDispatch.js')
    const onSessionId = vi.fn()

    expect(loaded).toEqual([])
    const result = await dispatchSpawn(
      def,
      { expertName: '01-code', resumeSessionId: 'session-1', onSessionId },
      { hostId: () => 'codex' },
    )

    expect(result).toBe('codex result')
    expect(loaded).toEqual(['codex'])
    expect(codexExecSpawn).toHaveBeenCalledExactlyOnceWith(def, { expertName: '01-code' })
    expect(sdkSpawn).not.toHaveBeenCalled()
    expect(onSessionId).not.toHaveBeenCalled()
  })
})
