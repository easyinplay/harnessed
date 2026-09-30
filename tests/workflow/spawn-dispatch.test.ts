// v16.0 Phase 66 T3b — the per-host spawn dispatch.
//
// `codexExecSpawn` shipped in T2 with NO caller, so the CI / headless face on a
// codex host still went through `sdkSpawn` (an in-process claude SDK query) and
// could not work at all. This file locks the thin dispatch that fixes it, and
// the two properties that make it safe to add:
//
//   1. on a claude host the call is IDENTICAL to the pre-dispatch one — same
//      def, same opts object, byte for byte. That path carries 13 eval goldens
//      and the tests/workflow/ assertions.
//   2. the codex branch DROPS `resumeSessionId` / `onSessionId`. `codex exec
//      --ephemeral` persists no session (findings F5), so a thread id can never
//      be fed back as a resume token — and ralphLoopWrap would do exactly that
//      if the callback were forwarded.
//
// No child process is ever spawned here: both spawners are injected.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AgentDefinition } from '../../src/workflow/lib/agentDefinition.js'
import {
  dispatchSpawn,
  resolveSpawnHost,
  type SpawnDispatchOpts,
} from '../../src/workflow/lib/spawnDispatch.js'

const def: AgentDefinition = { description: 'phase expert', prompt: 'BASE PROMPT' }

interface Call {
  def: AgentDefinition
  opts: Record<string, unknown>
}

function spies() {
  const sdk: Call[] = []
  const codex: Call[] = []
  return {
    sdk,
    codex,
    deps: {
      sdkSpawn: async (d: AgentDefinition, o: object) => {
        sdk.push({ def: d, opts: o as Record<string, unknown> })
        return '{"subtype":"success","text":"sdk"}'
      },
      codexExecSpawn: async (d: AgentDefinition, o: object) => {
        codex.push({ def: d, opts: o as Record<string, unknown> })
        return '{"subtype":"success","text":"codex"}'
      },
    },
  }
}

let savedPlatform: string | undefined

beforeEach(() => {
  savedPlatform = process.env.HARNESSED_PLATFORM
})
afterEach(() => {
  if (savedPlatform === undefined) delete process.env.HARNESSED_PLATFORM
  else process.env.HARNESSED_PLATFORM = savedPlatform
  vi.restoreAllMocks()
})

describe('dispatchSpawn — host routing', () => {
  it('claude host → sdkSpawn, with the opts object forwarded unchanged', async () => {
    const s = spies()
    const onSessionId = () => {}
    const opts: SpawnDispatchOpts = {
      expertName: '01-code',
      resumeSessionId: 'sess-1',
      onSessionId,
    }
    const out = await dispatchSpawn(def, opts, { ...s.deps, hostId: () => 'claude' })

    expect(out).toBe('{"subtype":"success","text":"sdk"}')
    expect(s.codex).toHaveLength(0)
    expect(s.sdk).toHaveLength(1)
    // byte-for-byte parity with the pre-dispatch call site: same def reference,
    // same opts reference, nothing added and nothing removed.
    expect(s.sdk[0]?.def).toBe(def)
    expect(s.sdk[0]?.opts).toBe(opts)
  })

  it('claude host → an opts object with no session fields stays free of them', async () => {
    const s = spies()
    await dispatchSpawn(def, { expertName: '01-code' }, { ...s.deps, hostId: () => 'claude' })
    expect(Object.keys(s.sdk[0]?.opts ?? {})).toEqual(['expertName'])
  })

  it('codex host → codexExecSpawn, and sdkSpawn is never reached', async () => {
    const s = spies()
    const out = await dispatchSpawn(
      def,
      { expertName: '01-code' },
      { ...s.deps, hostId: () => 'codex' },
    )
    expect(out).toBe('{"subtype":"success","text":"codex"}')
    expect(s.sdk).toHaveLength(0)
    expect(s.codex).toHaveLength(1)
    expect(s.codex[0]?.def).toBe(def)
  })

  it('codex host → resumeSessionId / onSessionId are DROPPED (--ephemeral has no resume)', async () => {
    const s = spies()
    let sessionIdSeen: string | undefined
    await dispatchSpawn(
      def,
      {
        expertName: '01-code',
        resumeSessionId: 'sess-1',
        onSessionId: (id) => {
          sessionIdSeen = id
        },
      },
      { ...s.deps, hostId: () => 'codex' },
    )
    expect(Object.keys(s.codex[0]?.opts ?? {})).toEqual(['expertName'])
    expect(s.codex[0]?.opts.resumeSessionId).toBeUndefined()
    expect(s.codex[0]?.opts.onSessionId).toBeUndefined()
    expect(sessionIdSeen).toBeUndefined()
  })

  it('defaults to the live host resolver when no hostId dep is injected', async () => {
    const s = spies()
    process.env.HARNESSED_PLATFORM = 'codex'
    await dispatchSpawn(def, { expertName: '01-code' }, s.deps)
    expect(s.codex).toHaveLength(1)

    process.env.HARNESSED_PLATFORM = 'claude'
    await dispatchSpawn(def, { expertName: '01-code' }, s.deps)
    expect(s.sdk).toHaveLength(1)
  })
})

describe('resolveSpawnHost', () => {
  // Only the explicit pin is asserted: the rest of detectPlatform's precedence
  // chain (env sniff, `.platform` file, directory probe) depends on the machine
  // and is already locked by tests/installers/platform-golden.test.ts.
  it('honours HARNESSED_PLATFORM for both hosts', () => {
    process.env.HARNESSED_PLATFORM = 'codex'
    expect(resolveSpawnHost()).toBe('codex')
    process.env.HARNESSED_PLATFORM = 'claude'
    expect(resolveSpawnHost()).toBe('claude')
  })
})
