import childProcess from 'node:child_process'
import { EventEmitter } from 'node:events'
import { mkdir, mkdtemp, readdir, readFile, rm, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const hookApi = await import('../../src/cli/updateReminderHookMain.js').catch(() => undefined)
const workerApi = await import('../../src/cli/updateReminderWorkerMain.js').catch(() => undefined)
const now = 1_800_000_000_000
const identity = {
  host: 'claude' as const,
  runtime: 'node',
  channel: 'npm',
  source: 'npm:harnessed',
  fingerprint: 'installed-1.0.0',
}
let directory: string
let cachePath: string
const worker = { executable: 'C:\\Program Files\\node.exe', args: ['C:\\App Data\\worker.mjs'] }
const record = (extra = {}) => ({
  schemaVersion: 1,
  identity,
  installed: '1.0.0',
  latest: '2.0.0',
  state: 'behind',
  checkedAt: now,
  retryAfter: 0,
  ...extra,
})
beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'reminder-hook-'))
  cachePath = join(directory, 'cache-v1.json')
  vi.stubGlobal(
    'fetch',
    vi.fn(() => {
      throw new Error('foreground network forbidden')
    }),
  )
})
afterEach(async () => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  await rm(directory, { recursive: true, force: true })
})
const save = (extra = {}) => writeFile(cachePath, JSON.stringify(record(extra)))
function harness(enabled = true) {
  const write = vi.fn()
  const child = Object.assign(new EventEmitter(), { unref: vi.fn() })
  const spawn = vi.fn(() => child)
  const run = () =>
    hookApi?.runUpdateReminderHook({
      cachePath,
      identity,
      enabled,
      worker,
      now: () => now,
      write,
      spawn,
    })
  return { run, write, spawn, child }
}

describe('cache-only foreground reminder', () => {
  it('worker fails softly for an unwritable parent without observation', async () => {
    await writeFile(cachePath, 'not a directory')
    const observe = vi.fn(async () => ({ latest: '2.0.0' }))
    expect(
      await workerApi?.runUpdateReminderWorker({
        cachePath: join(cachePath, 'cache.json'),
        identity,
        installed: '1.0.0',
        observe,
      }),
    ).toBe(0)
    expect(observe).not.toHaveBeenCalled()
  })
  it('prints only behind evidence, never contacts the network or changes cache', async () => {
    await save({ action: { command: 'must-not-run' } })
    const before = await readFile(cachePath, 'utf8')
    const hook = harness()
    expect(await hook.run()).toBe(0)
    expect(hook.write).toHaveBeenCalledExactlyOnceWith(
      'Harnessed update available: 1.0.0 -> 2.0.0. Run /harnessed-update.\n',
    )
    expect(hook.spawn).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
    expect(await readFile(cachePath, 'utf8')).toBe(before)
    expect(await readdir(directory)).toEqual(['cache-v1.json'])
  })
  it.each([
    { state: 'current', latest: '1.0.0' },
    { state: 'ahead', latest: '0.9.0' },
    { state: 'unknown', latest: null, retryAfter: now + 3_600_000 },
    { schemaVersion: 99 },
    { identity: { ...identity, host: 'codex' } },
  ])('silently exits 0 for non-behind/invalid evidence %j', async (extra) => {
    await save(extra)
    const hook = harness()
    expect(await hook.run()).toBe(0)
    expect(hook.write).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })
  it.each([
    '{',
    ' '.repeat(16 * 1024 + 1),
  ])('silently exits 0 for corrupt/oversized cache', async (text) => {
    await writeFile(cachePath, text)
    const hook = harness()
    expect(await hook.run()).toBe(0)
    expect(hook.write).not.toHaveBeenCalled()
  })
  it('disabled means no output, worker or network', async () => {
    await save()
    const hook = harness(false)
    expect(await hook.run()).toBe(0)
    expect(hook.write).not.toHaveBeenCalled()
    expect(hook.spawn).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })
  it.each([
    'missing',
    'stale',
  ])('spawns at most one detached candidate for %s cache', async (state) => {
    if (state === 'stale') await save({ checkedAt: now - 86_400_000 })
    const hook = harness()
    expect(await hook.run()).toBe(0)
    expect(hook.spawn).toHaveBeenCalledExactlyOnceWith(worker.executable, worker.args, {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
      shell: false,
    })
    expect(hook.child.unref).toHaveBeenCalledTimes(1)
    expect(fetch).not.toHaveBeenCalled()
    expect(await readdir(directory)).toEqual(state === 'missing' ? [] : ['cache-v1.json'])
  })
  it('reads existing ownership to suppress launch without modifying the lock', async () => {
    await mkdir(`${cachePath}.lock`)
    await utimes(`${cachePath}.lock`, now / 1000, now / 1000)
    const hook = harness()
    expect(await hook.run()).toBe(0)
    expect(hook.spawn).not.toHaveBeenCalled()
    expect(await readdir(directory)).toEqual(['cache-v1.json.lock'])
  })
  it('does not repeatedly spawn while offline retryAfter is pending', async () => {
    await save({ state: 'unknown', latest: null, retryAfter: now + 3_600_000 })
    const hook = harness()
    expect(await hook.run()).toBe(0)
    expect(await hook.run()).toBe(0)
    expect(hook.spawn).not.toHaveBeenCalled()
    expect(hook.write).not.toHaveBeenCalled()
  })
  it('absorbs asynchronous spawn errors', async () => {
    const hook = harness()
    expect(await hook.run()).toBe(0)
    expect(() => hook.child.emit('error', new Error('missing runtime'))).not.toThrow()
  })
  it('absorbs synchronous spawn and output failures', async () => {
    const fail = () => {
      throw new Error('unavailable')
    }
    expect(
      await hookApi?.runUpdateReminderHook({
        cachePath,
        identity,
        enabled: true,
        worker,
        spawn: fail,
      }),
    ).toBe(0)
    await save()
    expect(
      await hookApi?.runUpdateReminderHook({
        cachePath,
        identity,
        enabled: true,
        worker,
        write: fail,
        now: () => now,
      }),
    ).toBe(0)
  })
  it('uses the production detached-spawn boundary without awaiting the worker', async () => {
    const child = new childProcess.ChildProcess()
    vi.spyOn(child, 'unref').mockImplementation(() => {})
    const spawn = vi.spyOn(childProcess, 'spawn').mockReturnValue(child)
    expect(
      await hookApi?.runUpdateReminderHook({ cachePath, identity, enabled: true, worker }),
    ).toBe(0)
    expect(spawn).toHaveBeenCalledTimes(1)
    expect(child.unref).toHaveBeenCalledTimes(1)
  })
})
