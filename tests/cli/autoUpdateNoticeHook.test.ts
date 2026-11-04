// Phase 84 / T6 (R16 / R25 / AC14) — the update notice is printed by the
// SessionStart hook EXACTLY once.
//
// The notice is written by the NEW binary during the handover; the hook of the
// NEXT session prints it and stamps it as consumed. The hook runs on every
// session start, so an unconsumed notice would re-print the whole changelog
// excerpt forever — and a half-written notice (empty `to`) must never be
// printed at all: it would claim a version change that never happened.

import { EventEmitter } from 'node:events'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runUpdateReminderHook } from '../../src/cli/updateReminderHookMain.js'

const now = 1_800_000_000_000
const identity = {
  host: 'claude' as const,
  runtime: 'node',
  channel: 'npm',
  source: 'npm:harnessed',
  fingerprint: 'installed-1.0.0',
}
const worker = { executable: 'node', args: ['worker.mjs'] }

let directory: string
let statusPath: string

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'auto-update-notice-'))
  statusPath = join(directory, 'auto-update-status.json')
})

afterEach(async () => {
  await rm(directory, { recursive: true, force: true })
})

function statusDocument(notice: Record<string, unknown> | null): string {
  return JSON.stringify({
    schemaVersion: 1,
    consent: { autoUpdate: true, enabled: false },
    channel: 'binary',
    installed: '5.0.12',
    latest: '5.0.13',
    state: 'updated',
    progress: { received: 0, total: 0, updatedAt: now },
    lastResult: null,
    history: [],
    notice,
  })
}

/** A status file whose last round stalled with bytes on disk (resumable). */
function resumableStatusDocument(): string {
  return JSON.stringify({
    schemaVersion: 1,
    consent: { autoUpdate: true, enabled: false },
    channel: 'binary',
    installed: '5.0.12',
    latest: '5.0.13',
    state: 'failed',
    progress: { received: 4096, total: 103_809_024, updatedAt: now },
    lastResult: {
      version: '5.0.13',
      status: 'failed',
      reason: 'network',
      message: '[resumable] transfer stalled after 120s',
      at: now,
    },
    history: [],
    notice: null,
  })
}

async function writeStatus(notice: Record<string, unknown> | null): Promise<void> {
  await writeFile(statusPath, statusDocument(notice))
}

async function readNotice(): Promise<{ consumedAt: number } | null> {
  const parsed = JSON.parse(await readFile(statusPath, 'utf8')) as {
    notice: { consumedAt: number } | null
  }
  return parsed.notice
}

function harness() {
  const write = vi.fn()
  const child = Object.assign(new EventEmitter(), { unref: vi.fn() })
  const spawn = vi.fn(() => child)
  const run = () =>
    runUpdateReminderHook({
      cachePath: join(directory, 'update-reminder-claude.json'),
      identity,
      enabled: false,
      autoUpdate: true,
      statusPath,
      worker,
      now: () => now,
      write,
      spawn,
    })
  return { run, write, spawn }
}

describe('the update notice in the SessionStart hook', () => {
  it('prints a pending notice and stamps it as consumed', async () => {
    await writeStatus({
      from: '5.0.12',
      to: '5.0.13',
      changelog: '## [5.0.13]\n- something new',
      restart: 'Claude Code',
      at: now,
      consumedAt: 0,
    })
    const hook = harness()
    expect(await hook.run()).toBe(0)
    expect(hook.write).toHaveBeenCalledTimes(1)
    const text = hook.write.mock.calls[0]?.[0] as string
    expect(text).toContain('harnessed updated 5.0.12 -> 5.0.13.')
    expect(text).toContain('## [5.0.13]')
    expect(text).toContain('Restart Claude Code')
    expect((await readNotice())?.consumedAt).toBe(now)
  })

  it('prints the notice only once', async () => {
    await writeStatus({
      from: '5.0.12',
      to: '5.0.13',
      changelog: '## [5.0.13]',
      restart: 'Claude Code',
      at: now,
      consumedAt: 0,
    })
    const hook = harness()
    expect(await hook.run()).toBe(0)
    expect(await hook.run()).toBe(0)
    expect(hook.write).toHaveBeenCalledTimes(1)
  })

  it('never prints a half-written notice and never consumes it', async () => {
    await writeStatus({
      from: '5.0.12',
      to: '',
      changelog: '',
      restart: '',
      at: now,
      consumedAt: 0,
    })
    const hook = harness()
    expect(await hook.run()).toBe(0)
    expect(hook.write).not.toHaveBeenCalled()
    expect((await readNotice())?.consumedAt).toBe(0)
  })

  it('survives a missing or broken status file', async () => {
    const hook = harness()
    expect(await hook.run()).toBe(0)
    expect(hook.write).not.toHaveBeenCalled()
    await writeFile(statusPath, '{ not json')
    expect(await hook.run()).toBe(0)
    expect(hook.write).not.toHaveBeenCalled()
  })

  it('runs the worker when only the auto-update consent is on', async () => {
    const hook = harness()
    expect(await hook.run()).toBe(0)
    expect(hook.spawn).toHaveBeenCalledTimes(1)
  })

  it('wakes the worker for a RESUME even when the reminder cache is fresh (D2)', async () => {
    // The reminder cache is missing → `shouldRefreshReminder` would be true
    // anyway, so this test pins the resume path: a cache that says "nothing to
    // refresh" must NOT stop a stalled download from being continued.
    await writeFile(
      join(directory, 'update-reminder-claude.json'),
      JSON.stringify({
        schemaVersion: 1,
        identity,
        installed: '5.0.12',
        latest: '5.0.13',
        state: 'behind',
        checkedAt: now,
        retryAfter: 0,
      }),
    )
    await writeFile(statusPath, resumableStatusDocument())
    const hook = harness()
    expect(await hook.run()).toBe(0)
    expect(hook.spawn).toHaveBeenCalledTimes(1)
  })

  it('does not wake the worker for a COMPLETE failure', async () => {
    await writeFile(
      join(directory, 'update-reminder-claude.json'),
      JSON.stringify({
        schemaVersion: 1,
        identity,
        installed: '5.0.12',
        latest: '5.0.13',
        state: 'behind',
        checkedAt: now,
        retryAfter: 0,
      }),
    )
    await writeStatus(null)
    const hook = harness()
    expect(await hook.run()).toBe(0)
    expect(hook.spawn).not.toHaveBeenCalled()
  })
})
