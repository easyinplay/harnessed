// Phase 27 W1 T2 — settingsWriter.mergeSettingsEnvKey shared writer (D3 fold).
//
// TDD red-first. The two near-duplicate settings env-key writers
// (enableAgentTeamsInSettings / enableUserLangInSettings) are folded behind this
// shared `mergeSettingsEnvKey(key, value, opts?)`. It reproduces the 3-case
// behavior byte-for-byte: (a) file missing → create fresh, (b) skipIfPresent hit
// → idempotent no-op, (c) missing/stale key → backup original + non-destructive
// merge via atomicWrite (tmp + rename), backup under harnessedSubdir('backups').
//
// fs is mocked (sister enable*-test pattern) so writes are asserted by call
// count + content, with no real disk touch. harnessedSubdir is faked to a stable
// path so the backup target is deterministic + cross-platform.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  rename: vi.fn(),
  mkdir: vi.fn(),
  rm: vi.fn(),
  stat: vi.fn(),
}))

vi.mock('../../src/platform/harnessedRoot.js', () => ({
  harnessedFile: (name: string) => `/fake-home/.claude/harnessed/${name}`,
  harnessedSubdir: (name: string) => `/fake-home/.claude/harnessed/${name}`,
}))

vi.mock('proper-lockfile', () => ({
  default: {
    lock: vi.fn(async () => vi.fn(async () => undefined)),
  },
}))

import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import lockfile from 'proper-lockfile'

const readFileMock = vi.mocked(readFile)
const writeFileMock = vi.mocked(writeFile)
const renameMock = vi.mocked(rename)
const mkdirMock = vi.mocked(mkdir)
const statMock = vi.mocked(stat)

beforeEach(() => {
  readFileMock.mockReset()
  writeFileMock.mockReset()
  renameMock.mockReset()
  mkdirMock.mockReset()
  statMock.mockReset()
  vi.mocked(lockfile.lock).mockClear()
  mkdirMock.mockResolvedValue(undefined as never)
  writeFileMock.mockResolvedValue(undefined as never)
  renameMock.mockResolvedValue(undefined as never)
  statMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('settingsWriter.mergeSettingsEnvKey — D3 shared writer', () => {
  it('1. file missing → create fresh {env:{K:v}} (outcome created)', async () => {
    readFileMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    const { mergeSettingsEnvKey } = await import('../../src/cli/lib/settingsWriter.js')
    const r = await mergeSettingsEnvKey('HARNESSED_USER_LANG', 'v1')
    expect(r.outcome).toBe('created')
    const receiptWrite = writeFileMock.mock.calls.find((c) =>
      String(c[0]).includes('settings-env-ownership.json.tmp-'),
    )
    expect(receiptWrite?.[1]).toContain('"installedValue": "v1"')
    expect(receiptWrite?.[1]).toContain('"present": false')
    const settingsWrite = writeFileMock.mock.calls.find(
      (c) => String(c[0]).includes('settings.json.tmp-') && !String(c[0]).includes('ownership'),
    )
    const tmpContent = settingsWrite?.[1] as string
    expect(tmpContent).toContain('"HARNESSED_USER_LANG": "v1"')
    expect(tmpContent).toContain('"env":')
  })

  it('2. skipIfPresent hit → idempotent no-op (outcome already, carries existing)', async () => {
    readFileMock.mockResolvedValue(JSON.stringify({ env: { HARNESSED_USER_LANG: 'v1' } }))
    const { mergeSettingsEnvKey } = await import('../../src/cli/lib/settingsWriter.js')
    const r = await mergeSettingsEnvKey('HARNESSED_USER_LANG', 'v2', {
      skipIfPresent: (existing) => existing === 'v1',
    })
    expect(r.outcome).toBe('already')
    if (r.outcome === 'already') expect(r.existing).toBe('v1')
    expect(writeFileMock).not.toHaveBeenCalled()
    expect(renameMock).not.toHaveBeenCalled()
  })

  it('3. file exists missing key → backup + merge (outcome merged, non-destructive)', async () => {
    readFileMock.mockImplementation(async (path) => {
      if (String(path).includes('settings-env-ownership.json')) {
        throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
      }
      return JSON.stringify({ env: { OTHER: 'keep' }, hooks: { h: true } })
    })
    const { mergeSettingsEnvKey } = await import('../../src/cli/lib/settingsWriter.js')
    const r = await mergeSettingsEnvKey('HARNESSED_USER_LANG', 'v1')
    expect(r.outcome).toBe('merged')
    if (r.outcome === 'merged') {
      const p = r.backupPath.replace(/\\/g, '/')
      expect(p).toContain('/backups/settings.json')
    }
    const receiptWrite = writeFileMock.mock.calls.find((c) =>
      String(c[0]).includes('settings-env-ownership.json.tmp-'),
    )
    expect(receiptWrite?.[1]).toContain('"present": false')
    const content = writeFileMock.mock.calls.find(
      (c) => String(c[0]).includes('settings.json.tmp-') && !String(c[0]).includes('ownership'),
    )?.[1] as string
    expect(content).toContain('"OTHER": "keep"')
    expect(content).toContain('"hooks":')
    expect(content).toContain('"HARNESSED_USER_LANG": "v1"')
  })

  it('4. existing key but skipIfPresent returns false → backup + overwrite (merged)', async () => {
    readFileMock.mockImplementation(async (path) => {
      if (String(path).includes('settings-env-ownership.json')) {
        throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
      }
      return JSON.stringify({ env: { HARNESSED_USER_LANG: 'old' } })
    })
    const { mergeSettingsEnvKey } = await import('../../src/cli/lib/settingsWriter.js')
    const r = await mergeSettingsEnvKey('HARNESSED_USER_LANG', 'new', {
      skipIfPresent: () => false,
    })
    expect(r.outcome).toBe('merged')
    const receiptWrite = writeFileMock.mock.calls.find((c) =>
      String(c[0]).includes('settings-env-ownership.json.tmp-'),
    )
    expect(receiptWrite?.[1]).toContain('"value": "old"')
    const content = writeFileMock.mock.calls.find(
      (c) => String(c[0]).includes('settings.json.tmp-') && !String(c[0]).includes('ownership'),
    )?.[1] as string
    expect(content).toContain('"HARNESSED_USER_LANG": "new"')
  })

  it('5. malformed JSON → warn (not throw, no write)', async () => {
    readFileMock.mockResolvedValue('{ invalid [[[')
    const { mergeSettingsEnvKey } = await import('../../src/cli/lib/settingsWriter.js')
    const r = await mergeSettingsEnvKey('HARNESSED_USER_LANG', 'v1')
    expect(r.outcome).toBe('warn')
    expect(writeFileMock).not.toHaveBeenCalled()
    if (r.outcome === 'warn') expect(r.message).toMatch(/malformed JSON/i)
  })

  it('6. write fail (permission) → warn (not throw)', async () => {
    readFileMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    writeFileMock.mockRejectedValue(Object.assign(new Error('EPERM'), { code: 'EPERM' }))
    const { mergeSettingsEnvKey } = await import('../../src/cli/lib/settingsWriter.js')
    const r = await mergeSettingsEnvKey('HARNESSED_USER_LANG', 'v1')
    expect(r.outcome).toBe('warn')
    if (r.outcome === 'warn') expect(r.message).toMatch(/EPERM|write.*failed/i)
    expect(
      writeFileMock.mock.calls.some((call) =>
        String(call[0]).includes('settings-env-ownership.json'),
      ),
    ).toBe(false)
  })

  it('7. non-object JSON (array) → warn', async () => {
    readFileMock.mockResolvedValue('[1,2,3]')
    const { mergeSettingsEnvKey } = await import('../../src/cli/lib/settingsWriter.js')
    const r = await mergeSettingsEnvKey('HARNESSED_USER_LANG', 'v1')
    expect(r.outcome).toBe('warn')
    if (r.outcome === 'warn') expect(r.message).toMatch(/not a JSON object/i)
  })

  it('8. receipt write failure removes newly created settings', async () => {
    readFileMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    writeFileMock.mockImplementation(async (path) => {
      if (String(path).includes('settings-env-ownership.json')) {
        throw Object.assign(new Error('EPERM receipt'), { code: 'EPERM' })
      }
    })
    const { rm } = await import('node:fs/promises')
    const { mergeSettingsEnvKey } = await import('../../src/cli/lib/settingsWriter.js')
    const r = await mergeSettingsEnvKey('HARNESSED_USER_LANG', 'v1')
    expect(r).toMatchObject({ outcome: 'warn' })
    expect(vi.mocked(rm)).toHaveBeenCalledWith(expect.stringContaining('settings.json'), {
      force: true,
    })
    expect(vi.mocked(rm)).toHaveBeenCalledWith(
      expect.stringContaining('settings-env-ownership.json.tmp-'),
      { force: true },
    )
  })

  it('9. receipt write failure restores existing settings byte-for-byte', async () => {
    const original = '{\r\n  "env": {"OTHER": "keep"}\r\n}\r\n'
    readFileMock.mockImplementation(async (path) => {
      if (String(path).includes('settings-env-ownership.json'))
        throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
      return original
    })
    writeFileMock.mockImplementation(async (path) => {
      if (String(path).includes('settings-env-ownership.json'))
        throw Object.assign(new Error('EPERM receipt'), { code: 'EPERM' })
    })

    const { mergeSettingsEnvKey } = await import('../../src/cli/lib/settingsWriter.js')
    const result = await mergeSettingsEnvKey('HARNESSED_USER_LANG', 'v1')
    const settingsWrites = writeFileMock.mock.calls.filter(([path]) =>
      String(path).includes('settings.json.tmp-'),
    )

    expect(result).toMatchObject({ outcome: 'warn' })
    expect(settingsWrites.at(-1)?.[1]).toBe(original)
  })

  it('10. rename failure removes the temporary settings file', async () => {
    readFileMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    renameMock.mockRejectedValue(Object.assign(new Error('EPERM'), { code: 'EPERM' }))
    const { mergeSettingsEnvKey } = await import('../../src/cli/lib/settingsWriter.js')
    const result = await mergeSettingsEnvKey('HARNESSED_USER_LANG', 'v1')
    expect(result).toMatchObject({ outcome: 'warn' })
    expect(vi.mocked(rm)).toHaveBeenCalledWith(expect.stringContaining('settings.json.tmp-'), {
      force: true,
    })
  })

  it('11. settings and ownership receipt update share one transaction lock', async () => {
    readFileMock.mockImplementation(async (path) => {
      if (String(path).includes('settings-env-ownership.json')) {
        throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
      }
      return JSON.stringify({ env: { OTHER: 'keep' } })
    })
    const { mergeSettingsEnvKey } = await import('../../src/cli/lib/settingsWriter.js')

    await expect(mergeSettingsEnvKey('HARNESSED_USER_LANG', 'v1')).resolves.toMatchObject({
      outcome: 'merged',
    })

    expect(lockfile.lock).toHaveBeenCalledTimes(1)
    const lockOptions = vi.mocked(lockfile.lock).mock.calls[0]?.[1]
    expect(lockOptions?.stale).toBeGreaterThanOrEqual(60_000)
    expect(lockOptions?.retries).toMatchObject({ retries: 20, maxTimeout: 250 })
    const release = await vi.mocked(lockfile.lock).mock.results[0]?.value
    expect(release).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['array', []],
    ['string', 'bad'],
    ['null', null],
  ])('12. env %s is rejected without settings, backup, or receipt writes', async (_label, env) => {
    readFileMock.mockResolvedValue(JSON.stringify({ env }))
    const { mergeSettingsEnvKey } = await import('../../src/cli/lib/settingsWriter.js')

    const result = await mergeSettingsEnvKey('HARNESSED_USER_LANG', 'v1')

    expect(result).toMatchObject({ outcome: 'warn' })
    if (result.outcome === 'warn') expect(result.message).toMatch(/env.*JSON object/i)
    expect(writeFileMock).not.toHaveBeenCalled()
    expect(renameMock).not.toHaveBeenCalled()
  })
})
