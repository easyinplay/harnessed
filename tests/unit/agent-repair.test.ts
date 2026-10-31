import { join, resolve } from 'node:path'
import { PassThrough, Readable } from 'node:stream'
import { describe, expect, it, vi } from 'vitest'
import {
  assertRepairRoots,
  createRepairProposal,
  createRepairRequest,
  type RepairRequest,
  repairableComponents,
  validateRepairAuthorization,
} from '../../src/cli/lib/agentRepair.js'
import { runAgentRepair } from '../../src/cli/lib/agentRepairRunner.js'
import { buildUpdateResult, createUpdateComponent } from '../../src/cli/lib/updateResult.js'

const fixtureHome = resolve('fixtures', 'agent-repair-home')
const fixtureParent = resolve(fixtureHome, '..')

function result() {
  return buildUpdateResult({
    mode: 'apply',
    host: 'codex',
    runtime: 'node',
    components: [
      createUpdateComponent({ id: 'gstack', status: 'retained', reasonCode: 'refresh-failed' }),
      createUpdateComponent({ id: 'harnessed', status: 'current', verified: true }),
      createUpdateComponent({ id: 'unknown', status: 'failed' }),
    ],
  })
}

function request(confirmed: boolean): RepairRequest {
  return createRepairRequest(
    result(),
    {
      hostId: 'codex',
      os: process.platform,
      userHome: fixtureHome,
      nativeHome: fixtureHome,
      neutralSpawnCwd: fixtureHome,
      platform: {
        id: 'codex',
        homeDir: fixtureHome,
        stateRoot: join(fixtureHome, '.codex'),
      } as never,
    },
    {
      confirmed,
      mode: confirmed ? 'explicit-yes' : 'none',
      components: confirmed ? ['gstack'] : [],
      grantedAt: confirmed ? new Date().toISOString() : null,
    },
  )
}

describe('agent repair contract', () => {
  it('selects only reviewed failed, unsupported and retained components', () => {
    expect(repairableComponents(result())).toEqual([
      { id: 'gstack', status: 'retained', reasonCode: 'refresh-failed' },
    ])
  })

  it('binds authorization to the exact component scope', () => {
    const r = request(true)
    expect(validateRepairAuthorization(r.authorization, r.components)).toBeNull()
    expect(
      validateRepairAuthorization(
        { ...r.authorization, components: ['gstack', 'gsd'] },
        r.components,
      ),
    ).toBe('repair-component-scope-mismatch')
  })

  it('does not spawn an agent without explicit confirmation', async () => {
    const spawn = vi.fn()
    const repaired = await runAgentRepair(request(false), { spawn: spawn as never })
    expect(repaired.status).toBe('not-authorized')
    expect(spawn).not.toHaveBeenCalled()
  })

  it('uses argv without shell and requires post-repair verification', async () => {
    const stderr = new PassThrough()
    const child = {
      stdout: Readable.from(['ok']),
      stderr,
      kill: vi.fn(),
      once(event: string, handler: (...args: never[]) => void) {
        if (event === 'close')
          queueMicrotask(() =>
            (handler as unknown as (exitCode: number, signal: null) => void)(0, null),
          )
        return child
      },
      on() {
        return child
      },
    }
    const spawn = vi.fn(() => child)
    const repaired = await runAgentRepair(request(true), {
      spawn: spawn as never,
      verify: async () => true,
    })
    expect(repaired).toMatchObject({ status: 'completed', verified: true })
    const call = (spawn.mock.calls as unknown[][])[0]
    expect(String(call?.[0])).toMatch(/codex/i)
    expect(call?.[1]).toEqual(expect.arrayContaining(['exec', '--ephemeral', '--json']))
    expect(call?.[2]).toMatchObject({ shell: false })
    expect(call?.[1]).not.toContainEqual(expect.stringContaining('&'))
  })

  it('returns verification-failed when the deterministic verifier does not pass', async () => {
    const child = {
      stdout: Readable.from(['ok']),
      stderr: Readable.from([]),
      kill: vi.fn(),
      once(event: string, handler: (...args: never[]) => void) {
        if (event === 'close')
          queueMicrotask(() =>
            (handler as unknown as (exitCode: number, signal: null) => void)(0, null),
          )
        return child
      },
      on() {
        return child
      },
    }
    const repaired = await runAgentRepair(request(true), {
      spawn: vi.fn(() => child) as never,
      verify: async () => false,
    })
    expect(repaired.status).toBe('verification-failed')
    expect(repaired.verified).toBe(false)
  })

  it('proposal exposes the bounded command and write roots', () => {
    const r = request(true)
    expect(createRepairProposal(r)).toMatchObject({
      components: ['gstack'],
      executionHost: 'codex',
      commandPreview: expect.arrayContaining(['codex', 'exec']),
    })
  })

  it('rejects a broader parent root even when it contains the host home', () => {
    expect(() => assertRepairRoots(fixtureHome, [fixtureParent])).toThrow(
      'repair host root is outside the allowed roots',
    )
  })
})
