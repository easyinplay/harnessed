import { execFile } from 'node:child_process'
import fs from 'node:fs'
import asyncFs, { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { build } from 'esbuild'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const cacheApi = await import('../../src/cli/lib/updateReminderCache.js').catch(() => undefined)
const workerApi = await import('../../src/cli/updateReminderWorkerMain.js').catch(() => undefined)
const now = 1_800_000_000_000
const execute = promisify(execFile)
const identity = {
  host: 'claude' as const,
  runtime: 'node',
  channel: 'npm',
  source: 'npm:harnessed',
  fingerprint: 'installed-1.0.0',
}
let directory: string
let cachePath: string
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
  directory = await mkdtemp(join(tmpdir(), 'reminder-cache-'))
  cachePath = join(directory, 'cache-v1.json')
})
afterEach(async () => {
  vi.restoreAllMocks()
  await rm(directory, { recursive: true, force: true })
})
const save = (extra = {}) => writeFile(cachePath, JSON.stringify(record(extra)))
const read = () => cacheApi?.readReminderCache(cachePath, identity, now)
const refresh = (
  observe = vi.fn(async (): Promise<{ latest: string | null }> => ({ latest: '2.0.0' })),
  time = now,
) =>
  workerApi?.runUpdateReminderWorker({
    cachePath,
    identity,
    installed: '1.0.0',
    observe,
    now: () => time,
  })
describe('bounded advisory cache', () => {
  it('reads a versioned observation without accepting executable authority', async () => {
    await save({ action: { command: 'must-not-run' } })
    expect(read()).toEqual(record())
  })
  const fields = ['host', 'runtime', 'channel', 'source', 'fingerprint'] as const
  it.each(fields)('rejects mismatched identity field %s', async (field) => {
    await save({ identity: { ...identity, [field]: 'other' } })
    expect(read()).toBeNull()
  })
  it.each([
    { schemaVersion: 2 },
    { checkedAt: now + 1 },
    { checkedAt: -1 },
    { retryAfter: 'later' },
    { installed: 'bad\nmessage' },
    { latest: 'invalid' },
    { state: 'updated' },
    { state: 'unknown', latest: '2.0.0' },
    { state: 'unknown', latest: null, retryAfter: now },
  ])('rejects malformed observation %j', async (extra) => {
    await save(extra)
    expect(read()).toBeNull()
  })
  it('rejects absent, corrupt, nonregular and oversized files', async () => {
    expect(read()).toBeNull()
    await writeFile(cachePath, '{')
    expect(read()).toBeNull()
    await writeFile(cachePath, ' '.repeat(16 * 1024 + 1))
    const boundedRead = vi.spyOn(fs, 'readSync')
    expect(read()).toBeNull()
    expect(boundedRead).not.toHaveBeenCalled()
    expect(cacheApi?.readReminderCache(directory, identity, now)).toBeNull()
  })
  it('bounds the actual read even if a file grows after stat', async () => {
    await save()
    const boundedRead = vi.spyOn(fs, 'readSync')
    expect(read()).toEqual(record())
    expect(boundedRead.mock.calls[0]?.[1].byteLength).toBeLessThanOrEqual(16 * 1024 + 1)
  })
})
describe('detached refresh owner', () => {
  it('writes a 24-hour observation atomically and leaves no temporary file or lock', async () => {
    const rename = vi.spyOn(asyncFs, 'rename')
    expect(await refresh()).toBe(0)
    expect(JSON.parse(await readFile(cachePath, 'utf8'))).toEqual(record())
    expect(rename).toHaveBeenCalledTimes(1)
    expect(rename.mock.calls[0]?.[1]).toBe(cachePath)
    expect(rename.mock.calls[0]?.[0]).not.toBe(cachePath)
    expect(await readdir(directory)).toEqual(['cache-v1.json'])
  })
  it('does not observe before 24h, then refreshes exactly at expiry', async () => {
    await save()
    const observe = vi.fn(async () => ({ latest: '3.0.0' }))
    expect(await refresh(observe, now + 86_399_999)).toBe(0)
    expect(observe).not.toHaveBeenCalled()
    expect(await refresh(observe, now + 86_400_000)).toBe(0)
    expect(observe).toHaveBeenCalledTimes(1)
    expect(JSON.parse(await readFile(cachePath, 'utf8')).latest).toBe('3.0.0')
  })
  it('has one cross-process refresh owner while contenders exit before observation', async () => {
    const bundled = await build({
      entryPoints: [resolve('src/cli/updateReminderWorkerMain.ts')],
      bundle: true,
      format: 'cjs',
      platform: 'node',
      write: false,
      logLevel: 'silent',
    })
    const script = join(directory, 'worker.cjs')
    await writeFile(
      script,
      `${bundled.outputFiles[0]?.text}
const fs = require('node:fs')
const options = JSON.parse(process.argv[2])
module.exports.runUpdateReminderWorker({...options, observe: async () => {
  fs.appendFileSync(options.cachePath + '.observations', '1')
  while (!fs.existsSync(options.cachePath + '.gate')) {
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  return {latest: '2.0.0'}
}}).then(code => { process.exitCode = code })
`,
    )
    const launch = () =>
      execute(
        process.execPath,
        [
          script,
          JSON.stringify({
            cachePath,
            identity,
            installed: '1.0.0',
          }),
        ],
        { timeout: 10_000, windowsHide: true },
      )
    const owner = launch()
    try {
      await vi.waitFor(
        async () => {
          expect(await readFile(`${cachePath}.observations`, 'utf8')).toBe('1')
        },
        { timeout: 5000 },
      )
      const before = await readdir(directory)
      expect(await launch()).toMatchObject({ stdout: '', stderr: '' })
      expect(await readFile(`${cachePath}.observations`, 'utf8')).toBe('1')
      expect(await readdir(directory)).toEqual(before)
    } finally {
      await writeFile(`${cachePath}.gate`, '')
      expect(await owner).toMatchObject({ stdout: '', stderr: '' })
    }
  })
  it.each([
    'throws',
    'unknown',
    'invalid',
  ])('records 1h backoff on %s and permits retry exactly at retryAfter', async (failure) => {
    const observe = vi.fn(async (): Promise<{ latest: string | null }> => {
      if (failure === 'throws') throw new Error('offline')
      return { latest: failure === 'unknown' ? null : 'invalid' }
    })
    expect(await refresh(observe)).toBe(0)
    expect(JSON.parse(await readFile(cachePath, 'utf8'))).toEqual(
      record({
        state: 'unknown',
        latest: null,
        retryAfter: now + 3_600_000,
      }),
    )
    const recovered = vi.fn(async () => ({ latest: '3.0.0' }))
    expect(await refresh(recovered, now + 3_599_999)).toBe(0)
    expect(recovered).not.toHaveBeenCalled()
    expect(await refresh(recovered, now + 3_600_000)).toBe(0)
    expect(recovered).toHaveBeenCalledTimes(1)
  })
  it.each([
    ['1.0.0', 'current'],
    ['0.9.0', 'ahead'],
    ['2.0.0', 'behind'],
  ])('derives %s observation as %s without running an update', async (latest, state) => {
    expect(await refresh(vi.fn(async () => ({ latest })))).toBe(0)
    expect(JSON.parse(await readFile(cachePath, 'utf8')).state).toBe(state)
  })
})
