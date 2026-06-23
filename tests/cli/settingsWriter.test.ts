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
}))

vi.mock('../../src/installers/lib/harnessedRoot.js', () => ({
  harnessedSubdir: (name: string) => `/fake-home/.claude/harnessed/${name}`,
}))

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'

const readFileMock = vi.mocked(readFile)
const writeFileMock = vi.mocked(writeFile)
const renameMock = vi.mocked(rename)
const mkdirMock = vi.mocked(mkdir)

beforeEach(() => {
  readFileMock.mockReset()
  writeFileMock.mockReset()
  renameMock.mockReset()
  mkdirMock.mockReset()
  mkdirMock.mockResolvedValue(undefined as never)
  writeFileMock.mockResolvedValue(undefined as never)
  renameMock.mockResolvedValue(undefined as never)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('settingsWriter.mergeSettingsEnvKey — D3 shared writer', () => {
  it('1. file missing → create fresh {env:{K:v}} (outcome created)', async () => {
    readFileMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    const { mergeSettingsEnvKey } = await import('../../src/cli/lib/settingsWriter.js')
    const r = await mergeSettingsEnvKey('MY_KEY', 'v1')
    expect(r.outcome).toBe('created')
    expect(writeFileMock).toHaveBeenCalledOnce()
    expect(renameMock).toHaveBeenCalledOnce()
    const tmpContent = writeFileMock.mock.calls[0]?.[1] as string
    expect(tmpContent).toContain('"MY_KEY": "v1"')
    expect(tmpContent).toContain('"env":')
  })

  it('2. skipIfPresent hit → idempotent no-op (outcome already, carries existing)', async () => {
    readFileMock.mockResolvedValue(JSON.stringify({ env: { MY_KEY: 'v1' } }))
    const { mergeSettingsEnvKey } = await import('../../src/cli/lib/settingsWriter.js')
    const r = await mergeSettingsEnvKey('MY_KEY', 'v2', {
      skipIfPresent: (existing) => existing === 'v1',
    })
    expect(r.outcome).toBe('already')
    if (r.outcome === 'already') expect(r.existing).toBe('v1')
    expect(writeFileMock).not.toHaveBeenCalled()
    expect(renameMock).not.toHaveBeenCalled()
  })

  it('3. file exists missing key → backup + merge (outcome merged, non-destructive)', async () => {
    readFileMock.mockResolvedValue(JSON.stringify({ env: { OTHER: 'keep' }, hooks: { h: true } }))
    const { mergeSettingsEnvKey } = await import('../../src/cli/lib/settingsWriter.js')
    const r = await mergeSettingsEnvKey('MY_KEY', 'v1')
    expect(r.outcome).toBe('merged')
    if (r.outcome === 'merged') {
      const p = r.backupPath.replace(/\\/g, '/')
      expect(p).toContain('/backups/settings.json')
    }
    // 2 writes: 1 backup + 1 atomic tmp; 1 rename
    expect(writeFileMock).toHaveBeenCalledTimes(2)
    expect(renameMock).toHaveBeenCalledOnce()
    const finalWrite = writeFileMock.mock.calls.find((c) => String(c[0]).includes('.tmp-'))
    const content = finalWrite?.[1] as string
    expect(content).toContain('"OTHER": "keep"')
    expect(content).toContain('"hooks":')
    expect(content).toContain('"MY_KEY": "v1"')
  })

  it('4. existing key but skipIfPresent returns false → backup + overwrite (merged)', async () => {
    readFileMock.mockResolvedValue(JSON.stringify({ env: { MY_KEY: 'old' } }))
    const { mergeSettingsEnvKey } = await import('../../src/cli/lib/settingsWriter.js')
    const r = await mergeSettingsEnvKey('MY_KEY', 'new', {
      skipIfPresent: () => false,
    })
    expect(r.outcome).toBe('merged')
    const finalWrite = writeFileMock.mock.calls.find((c) => String(c[0]).includes('.tmp-'))
    const content = finalWrite?.[1] as string
    expect(content).toContain('"MY_KEY": "new"')
  })

  it('5. malformed JSON → warn (not throw, no write)', async () => {
    readFileMock.mockResolvedValue('{ invalid [[[')
    const { mergeSettingsEnvKey } = await import('../../src/cli/lib/settingsWriter.js')
    const r = await mergeSettingsEnvKey('MY_KEY', 'v1')
    expect(r.outcome).toBe('warn')
    expect(writeFileMock).not.toHaveBeenCalled()
    if (r.outcome === 'warn') expect(r.message).toMatch(/malformed JSON/i)
  })

  it('6. write fail (permission) → warn (not throw)', async () => {
    readFileMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    writeFileMock.mockRejectedValue(Object.assign(new Error('EPERM'), { code: 'EPERM' }))
    const { mergeSettingsEnvKey } = await import('../../src/cli/lib/settingsWriter.js')
    const r = await mergeSettingsEnvKey('MY_KEY', 'v1')
    expect(r.outcome).toBe('warn')
    if (r.outcome === 'warn') expect(r.message).toMatch(/EPERM|write.*failed/i)
  })

  it('7. non-object JSON (array) → warn', async () => {
    readFileMock.mockResolvedValue('[1,2,3]')
    const { mergeSettingsEnvKey } = await import('../../src/cli/lib/settingsWriter.js')
    const r = await mergeSettingsEnvKey('MY_KEY', 'v1')
    expect(r.outcome).toBe('warn')
    if (r.outcome === 'warn') expect(r.message).toMatch(/not a JSON object/i)
  })
})
