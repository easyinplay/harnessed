// Phase 84 / T6 — the production handover seam (D8 / R17) and the
// version-aware changelog excerpt (R14).
//
// The handover hands the owned-state refresh to the NEW binary. The new
// binary must write the `notice` into the SAME status file the worker used,
// so the ABSOLUTE path travels as an env var (R17) — the new binary is not
// allowed to derive the path itself.
//
// Covered here:
//   - the status path is in the child's environment at spawn time,
//   - `spawnOwnedRefresh`'s signature is untouched,
//   - a failing spawn is fail-soft (`ok: false`, no throw),
//   - `changelogTop(version)` returns that version's section, `changelogTop()`
//     still returns the first one, and both are capped at 1200 characters.

import { EventEmitter } from 'node:events'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  AUTO_UPDATE_STATUS_PATH_ENV,
  handoverAutoUpdate,
} from '../../../src/cli/lib/autoUpdateHandover.js'
import { changelogTop } from '../../../src/cli/update.js'
import {
  createHostInstallContext,
  type HostInstallContext,
} from '../../../src/platform/hostInstallContext.js'
import { descriptorFor } from '../../../src/platform/platform.js'

const userHome = 'C:/fixture/home'
const nativeHome = 'C:/fixture/home/.claude'

const context: HostInstallContext = createHostInstallContext(descriptorFor('claude', userHome), {
  os: 'win32',
  userHome,
  nativeHome,
})

interface SpawnCall {
  command: string
  args: string[]
  options: { env?: NodeJS.ProcessEnv }
}

function fakeSpawner(exitCode: number | null): {
  spawn: typeof import('node:child_process').spawn
  calls: SpawnCall[]
} {
  const calls: SpawnCall[] = []
  const spawn = ((command: string, args: string[], options: SpawnCall['options']) => {
    calls.push({ command, args, options })
    const child = new EventEmitter()
    setTimeout(() => child.emit('close', exitCode), 0)
    return child
  }) as unknown as typeof import('node:child_process').spawn
  return { spawn, calls }
}

function statusFile(): string {
  const dir = mkdtempSync(join(tmpdir(), 'auto-update-handover-'))
  const path = join(dir, 'auto-update-status.json')
  writeFileSync(
    path,
    `${JSON.stringify({
      schemaVersion: 1,
      consent: { autoUpdate: true, enabled: true },
      channel: 'binary',
      installed: '5.0.12',
      latest: '5.0.13',
      state: 'updated',
      progress: { received: 0, total: 0, updatedAt: 1 },
      lastResult: { version: '5.0.13', status: 'updated', at: 1 },
      history: [],
      notice: { from: '5.0.12', to: '', changelog: '', restart: '', at: 1, consumedAt: 0 },
    })}\n`,
    'utf8',
  )
  return path
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('handoverAutoUpdate', () => {
  it('puts the status file path into the child environment at spawn time', async () => {
    const path = statusFile()
    const { spawn, calls } = fakeSpawner(0)

    const result = await handoverAutoUpdate(
      { from: '5.0.12', to: '5.0.13', statusPath: path },
      { context, execPath: 'C:/fixture/bin/harnessed.exe', spawn },
    )

    expect(result.ok).toBe(true)
    expect(calls).toHaveLength(1)
    expect(calls[0]?.options.env?.[AUTO_UPDATE_STATUS_PATH_ENV]).toBe(path)
    // The env var must not leak into the parent after the handover.
    expect(process.env[AUTO_UPDATE_STATUS_PATH_ENV]).toBeUndefined()
  })

  it('records the `from` version in the status file before the spawn (R17)', async () => {
    const path = statusFile()
    const { spawn } = fakeSpawner(0)

    await handoverAutoUpdate(
      { from: '5.0.12', to: '5.0.13', statusPath: path },
      { context, execPath: 'C:/fixture/bin/harnessed.exe', spawn },
    )

    const notice = (JSON.parse(readFileSync(path, 'utf8')) as { notice: { from: string } }).notice
    expect(notice.from).toBe('5.0.12')
  })

  it("does not change spawnOwnedRefresh's signature", () => {
    const source = readFileSync(
      fileURLToPath(new URL('../../../src/cli/lib/ownedRefresh.ts', import.meta.url)),
      'utf8',
    )
    expect(source).toContain('export async function spawnOwnedRefresh(')
    expect(source).toContain('deps: OwnedRefreshSpawnDeps = {}')
    expect(source).toContain('timeoutMs: number = OWNED_REFRESH_TIMEOUT_MS')
    // The handover calls it with (execPath, context) only — the seam stays.
    const handover = readFileSync(
      fileURLToPath(new URL('../../../src/cli/lib/autoUpdateHandover.ts', import.meta.url)),
      'utf8',
    )
    expect(handover).toContain('spawnImpl(execPath, context')
  })

  it('fails soft when the new binary cannot be spawned', async () => {
    const path = statusFile()
    const spawn = (() => {
      throw new Error('spawn ENOENT')
    }) as unknown as typeof import('node:child_process').spawn

    const result = await handoverAutoUpdate(
      { from: '5.0.12', to: '5.0.13', statusPath: path },
      { context, execPath: 'C:/fixture/bin/harnessed.exe', spawn },
    )

    expect(result.ok).toBe(false)
    expect(result.error).toContain('spawn ENOENT')
  })

  it('fails soft when the new binary exits non-zero', async () => {
    const path = statusFile()
    const { spawn } = fakeSpawner(1)

    const result = await handoverAutoUpdate(
      { from: '5.0.12', to: '5.0.13', statusPath: path },
      { context, execPath: 'C:/fixture/bin/harnessed.exe', spawn },
    )

    expect(result.ok).toBe(false)
  })

  it('never throws when the status file cannot be read', async () => {
    const { spawn } = fakeSpawner(0)

    const result = await handoverAutoUpdate(
      {
        from: '5.0.12',
        to: '5.0.13',
        statusPath: join(tmpdir(), 'auto-update-missing-status.json'),
      },
      { context, execPath: 'C:/fixture/bin/harnessed.exe', spawn },
    )

    expect(result.ok).toBe(true)
  })
})

describe('changelogTop', () => {
  const changelog = [
    '# Changelog',
    '',
    'All notable changes to this project will be documented in this file.',
    '',
    '## [Unreleased]',
    '',
    '## [5.0.13] - 2026-11-04',
    '',
    '### Added',
    '',
    '- the auto-update notice.',
    '',
    '## [5.0.12] - 2026-11-03',
    '',
    '### Fixed',
    '',
    '- the slow-link self-update.',
    '',
  ].join('\n')

  function assetsRoot(body: string): string {
    const dir = mkdtempSync(join(tmpdir(), 'auto-update-assets-'))
    writeFileSync(join(dir, 'CHANGELOG.md'), body, 'utf8')
    return dir
  }

  it("returns the requested version's section", () => {
    vi.stubEnv('HARNESSED_ASSETS_OVERRIDE', assetsRoot(changelog))
    const section = changelogTop('5.0.13')
    expect(section).toContain('## [5.0.13] - 2026-11-04')
    expect(section).toContain('the auto-update notice.')
    expect(section).not.toContain('5.0.12')
  })

  it('still returns the first section without a version', () => {
    vi.stubEnv('HARNESSED_ASSETS_OVERRIDE', assetsRoot(changelog))
    expect(changelogTop()).toContain('## [Unreleased]')
  })

  it('returns null for a version that is not in the changelog', () => {
    vi.stubEnv('HARNESSED_ASSETS_OVERRIDE', assetsRoot(changelog))
    expect(changelogTop('9.9.9')).toBeNull()
  })

  it('caps the excerpt at 1200 characters', () => {
    const long = [
      '# Changelog',
      '',
      '## [5.0.13] - 2026-11-04',
      '',
      `- ${'x'.repeat(3000)}`,
      '',
    ].join('\n')
    vi.stubEnv('HARNESSED_ASSETS_OVERRIDE', assetsRoot(long))
    expect(changelogTop('5.0.13')?.length).toBe(1200)
    expect(changelogTop()?.length).toBe(1200)
  })
})
