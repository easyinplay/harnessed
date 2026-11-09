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
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import pkg from '../../../package.json' with { type: 'json' }
import { AUTO_UPDATE_STATUS_PATH_ENV } from '../../../src/cli/lib/autoUpdateStatus.js'
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
// The notice write's only `await` is the dynamic `import()` — a slow module
// factory stretches that gap so a floating (un-awaited) write provably has
// not settled by the time the entry resolves.
vi.mock('../../../src/cli/lib/changelogSection.js', async () => {
  await new Promise((resolve) => setTimeout(resolve, 30))
  return { changelogSection: () => '## excerpt' }
})

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
      createUpdateComponent({ id: 'doc-discipline-gate', status: 'updated' }),
    ])

    const outcome = await refreshOwnedState(context)

    expect(refreshOwnedUpdate).toHaveBeenCalledWith(context)
    expect(outcome.ok).toBe(true)
    expect(outcome.updated).toEqual(['harnessed-workflows', 'doc-discipline-gate'])
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

  // The caller is `process.exit(await runOwnedRefreshEntry())` — a floating
  // notice write is killed by the hard exit on the real path, so the entry
  // must not resolve before the notice is fully written (real-machine AC13:
  // the shipped 5.0.13–5.0.15 binaries refreshed the owned state but always
  // left the notice half-written).
  it('resolves only after the update notice is fully written', async () => {
    refreshOwnedUpdate.mockResolvedValue([
      createUpdateComponent({ id: 'harnessed-workflows', status: 'updated' }),
    ])
    const directory = await mkdtemp(join(tmpdir(), 'owned-refresh-entry-'))
    const statusPath = join(directory, 'auto-update-status.json')
    try {
      await writeFile(
        statusPath,
        JSON.stringify({
          schemaVersion: 1,
          consent: { autoUpdate: true, enabled: true },
          channel: 'binary',
          installed: '5.0.14',
          latest: '9.9.9',
          state: 'updated',
          progress: { received: 0, total: 0, updatedAt: Date.now() },
          lastResult: null,
          history: [],
          notice: { from: '5.0.14', to: '', changelog: '', restart: '', at: 1, consumedAt: 0 },
        }),
      )
      vi.stubEnv(AUTO_UPDATE_STATUS_PATH_ENV, statusPath)

      await expect(runOwnedRefreshEntry()).resolves.toBe(0)

      const status = JSON.parse(await readFile(statusPath, 'utf8')) as {
        notice: { from: string; to: string; changelog: string; restart: string }
      }
      expect(status.notice.from).toBe('5.0.14')
      expect(status.notice.to).toBe(pkg.version)
      expect(status.notice.changelog).toBe('## excerpt')
      expect(status.notice.restart).toBe('Claude Code')
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
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
