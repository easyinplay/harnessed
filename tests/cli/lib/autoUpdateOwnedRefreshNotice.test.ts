// Phase 84 / T6 (R14 / R16 / R17) — the NEW binary writes the update
// notice.
//
// Only the new binary can do this: it owns the NEW assets, so it is the only
// process that can excerpt the CHANGELOG section of the version it just
// installed. The status file's path travels in the environment (R17) — the
// new binary must not derive it, or the notice lands in another root and
// silently disappears.

import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import pkg from '../../../package.json' with { type: 'json' }
import { AUTO_UPDATE_STATUS_PATH_ENV } from '../../../src/cli/lib/autoUpdateStatus.js'
import { writeAutoUpdateNoticeForNewBinary } from '../../../src/cli/lib/ownedRefresh.js'
import { captureHostInstallContext } from '../../../src/platform/hostInstallContext.js'

let directory: string
let statusPath: string

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'auto-update-new-binary-'))
  statusPath = join(directory, 'auto-update-status.json')
  vi.stubEnv('HARNESSED_ASSETS_OVERRIDE', directory)
  await writeFile(
    join(directory, 'CHANGELOG.md'),
    `# Changelog\n\n## [${pkg.version}]\n\n- a brand new thing\n\n## [1.0.0]\n\n- old\n`,
  )
})

afterEach(async () => {
  vi.unstubAllEnvs()
  await rm(directory, { recursive: true, force: true })
})

async function seedStatus(notice: Record<string, unknown> | null): Promise<void> {
  await writeFile(
    statusPath,
    JSON.stringify({
      schemaVersion: 1,
      consent: { autoUpdate: true, enabled: false },
      channel: 'binary',
      installed: '1.0.0',
      latest: '9.9.9',
      state: 'handover',
      progress: { received: 0, total: 0, updatedAt: Date.now() },
      lastResult: null,
      history: [],
      notice,
    }),
  )
}

async function readNotice(): Promise<Record<string, unknown> | null> {
  const parsed = JSON.parse(await readFile(statusPath, 'utf8')) as {
    notice: Record<string, unknown> | null
  }
  return parsed.notice
}

describe('the new binary writes the update notice', () => {
  it('fills the notice in and keeps the `from` version the old binary recorded', async () => {
    await seedStatus({
      from: '1.0.0',
      to: '',
      changelog: '',
      restart: '',
      at: Date.now(),
      consumedAt: 0,
    })
    vi.stubEnv(AUTO_UPDATE_STATUS_PATH_ENV, statusPath)
    const context = captureHostInstallContext({ hostId: 'claude' })
    await writeAutoUpdateNoticeForNewBinary(context)
    const notice = await readNotice()
    expect(notice?.from).toBe('1.0.0')
    expect(notice?.to).toBe(pkg.version)
    expect(notice?.restart).toBe('Claude Code')
    expect(notice?.consumedAt).toBe(0)
    expect(String(notice?.changelog)).toContain(`## [${pkg.version}]`)
  })

  it('names the codex host in the restart hint', async () => {
    await seedStatus(null)
    vi.stubEnv(AUTO_UPDATE_STATUS_PATH_ENV, statusPath)
    const context = captureHostInstallContext({ hostId: 'codex' })
    await writeAutoUpdateNoticeForNewBinary(context)
    expect((await readNotice())?.restart).toBe('Codex')
  })

  it('does nothing without the handover env var', async () => {
    await seedStatus(null)
    vi.stubEnv(AUTO_UPDATE_STATUS_PATH_ENV, '')
    const context = captureHostInstallContext({ hostId: 'claude' })
    await writeAutoUpdateNoticeForNewBinary(context)
    expect(await readNotice()).toBeNull()
  })

  it('survives a status file it cannot read', async () => {
    await writeFile(statusPath, '{ not json')
    vi.stubEnv(AUTO_UPDATE_STATUS_PATH_ENV, statusPath)
    const context = captureHostInstallContext({ hostId: 'claude' })
    await expect(writeAutoUpdateNoticeForNewBinary(context)).resolves.toBeUndefined()
  })
})
