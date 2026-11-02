// Issue #35 — after a compiled-binary self-update the owned state (workflow
// skills, harness-owned hooks, stale legacy Claude command files) must be
// re-synced from the NEW version's assets.
//
// The refresh has to run in the NEW binary (it owns the NEW assets), so the OLD
// binary hands the work over by spawning the binary that now sits at execPath
// with the internal `--internal-owned-refresh` flag.
//
// Covered here:
//   - the refresh outcome is derived from the component results,
//   - the handover spawns the new binary with the flag and the pinned host env,
//   - a failed handover is fail-soft (never throws, never an exit-code change),
//   - the flag stays internal — it is not a public command.

import { EventEmitter } from 'node:events'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  refreshOwnedState,
  runOwnedRefreshEntry,
  spawnOwnedRefresh,
} from '../../../src/cli/lib/ownedRefresh.js'
import { OWNED_REFRESH_FLAG } from '../../../src/cli/lib/ownedRefreshFlag.js'
import { createUpdateComponent } from '../../../src/cli/lib/updateResult.js'
import {
  createHostInstallContext,
  type HostInstallContext,
} from '../../../src/platform/hostInstallContext.js'
import { descriptorFor } from '../../../src/platform/platform.js'

const { refreshOwnedUpdate } = vi.hoisted(() => ({ refreshOwnedUpdate: vi.fn() }))
vi.mock('../../../src/cli/lib/refreshOwnedUpdate.js', () => ({ refreshOwnedUpdate }))

const userHome = 'C:/fixture/home'
const nativeHome = 'C:/fixture/home/.claude'

const context: HostInstallContext = createHostInstallContext(descriptorFor('claude', userHome), {
  os: 'win32',
  userHome,
  nativeHome,
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('HARNESSED_PLATFORM', 'claude')
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('refreshOwnedState', () => {
  it('reports the refreshed components and stays ok when none failed', async () => {
    refreshOwnedUpdate.mockResolvedValue([
      createUpdateComponent({ id: 'harnessed-workflows', status: 'updated' }),
      createUpdateComponent({ id: 'stop-hook-recover', status: 'updated' }),
    ])

    const outcome = await refreshOwnedState(context)

    expect(refreshOwnedUpdate).toHaveBeenCalledWith(context)
    expect(outcome.ok).toBe(true)
    expect(outcome.updated).toEqual(['harnessed-workflows', 'stop-hook-recover'])
    expect(outcome.failed).toEqual([])
  })

  it('is not ok when a component failed', async () => {
    refreshOwnedUpdate.mockResolvedValue([
      createUpdateComponent({ id: 'harnessed-workflows', status: 'updated' }),
      createUpdateComponent({ id: 'perturn-inject', status: 'failed' }),
    ])

    const outcome = await refreshOwnedState(context)

    expect(outcome.ok).toBe(false)
    expect(outcome.failed).toEqual(['perturn-inject'])
  })
})

describe('runOwnedRefreshEntry', () => {
  it('exits zero when every owned component refreshed', async () => {
    refreshOwnedUpdate.mockResolvedValue([
      createUpdateComponent({ id: 'harnessed-workflows', status: 'updated' }),
    ])

    await expect(runOwnedRefreshEntry()).resolves.toBe(0)
  })

  it('exits one and names the remedy when a component failed', async () => {
    refreshOwnedUpdate.mockResolvedValue([
      createUpdateComponent({ id: 'harnessed-workflows', status: 'failed' }),
    ])

    await expect(runOwnedRefreshEntry()).resolves.toBe(1)
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('harnessed setup'))
  })
})

interface SpawnCall {
  command: string
  args: string[]
  options: { env?: NodeJS.ProcessEnv; stdio?: unknown }
}

function fakeSpawner(
  exitCode: number | null,
  error?: Error,
): { spawn: typeof import('node:child_process').spawn; calls: SpawnCall[] } {
  const calls: SpawnCall[] = []
  const spawn = ((command: string, args: string[], options: SpawnCall['options']) => {
    calls.push({ command, args, options })
    const child = new EventEmitter()
    setTimeout(() => {
      if (error) child.emit('error', error)
      else child.emit('close', exitCode)
    }, 0)
    return child
  }) as unknown as typeof import('node:child_process').spawn
  return { spawn, calls }
}

describe('spawnOwnedRefresh', () => {
  it('hands the refresh to the binary at execPath with the internal flag', async () => {
    const { spawn, calls } = fakeSpawner(0)

    const result = await spawnOwnedRefresh('C:/fixture/bin/harnessed.exe', context, { spawn })

    expect(result).toEqual({ ok: true, exitCode: 0 })
    expect(calls[0]?.command).toBe('C:/fixture/bin/harnessed.exe')
    expect(calls[0]?.args).toEqual([OWNED_REFRESH_FLAG])
  })

  it('pins the host env so the new binary resolves the same home and state root', async () => {
    const { spawn, calls } = fakeSpawner(0)

    await spawnOwnedRefresh('C:/fixture/bin/harnessed.exe', context, { spawn })

    const env = calls[0]?.options.env ?? {}
    expect(env.HARNESSED_PLATFORM).toBe('claude')
    expect(env.CLAUDE_CONFIG_DIR).toBe(nativeHome)
    expect(env.HARNESSED_ROOT_OVERRIDE).toBe(context.platform.stateRoot)
  })

  it('fails soft when the new binary exits non-zero', async () => {
    const { spawn } = fakeSpawner(1)

    const result = await spawnOwnedRefresh('C:/fixture/bin/harnessed.exe', context, { spawn })

    expect(result.ok).toBe(false)
    expect(result.exitCode).toBe(1)
  })

  it('fails soft when the new binary cannot be spawned', async () => {
    const { spawn } = fakeSpawner(null, new Error('spawn ENOENT'))

    const result = await spawnOwnedRefresh('C:/fixture/bin/harnessed.exe', context, { spawn })

    expect(result.ok).toBe(false)
    expect(result.error).toContain('spawn ENOENT')
  })
})

describe('the refresh flag stays internal', () => {
  it('is not a public command in the CLI entry point', () => {
    const source = readFileSync(
      fileURLToPath(new URL('../../../src/cli.ts', import.meta.url)),
      'utf8',
    )
    // The entry point must consume the shared constant, never a divergent
    // inline literal, and must not register a public subcommand for it.
    expect(source).toContain('OWNED_REFRESH_FLAG')
    expect(source).not.toContain('registerOwnedRefresh')
    expect(source).not.toContain(`'${OWNED_REFRESH_FLAG}'`)
  })
})
