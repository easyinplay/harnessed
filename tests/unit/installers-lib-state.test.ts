// Phase 1.2 unit tests for src/installers/lib/state.ts.
//
// Covers:
//   - readState() returns default {version:'1', installed:{}} on ENOENT
//   - readState() falls back to default on malformed JSON
//   - readState() falls back to default on wrong schema version
//   - writeState() goes through atomic .tmp + rename
//   - updateInstalled() adds new entry
//   - updateInstalled() replaces existing entry (idempotent re-install)
//   - mkdir is called with recursive:true to ensure .harnessed/ exists
//
// Mocks: node:fs/promises (no real disk I/O — C6 mitigation).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  rename: vi.fn(),
  mkdir: vi.fn(),
}))

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import {
  type HarnessedState,
  readState,
  updateInstalled,
  writeState,
} from '../../src/installers/lib/state.js'

const readFileMock = vi.mocked(readFile)
const writeFileMock = vi.mocked(writeFile)
const renameMock = vi.mocked(rename)
const mkdirMock = vi.mocked(mkdir)

const CWD = '/tmp/proj'

function enoent(): NodeJS.ErrnoException {
  const e = new Error('ENOENT') as NodeJS.ErrnoException
  e.code = 'ENOENT'
  return e
}

describe('state.readState', () => {
  beforeEach(() => {
    readFileMock.mockReset()
    writeFileMock.mockReset()
    renameMock.mockReset()
    mkdirMock.mockReset()
  })

  it('returns default state on ENOENT (fresh project)', async () => {
    readFileMock.mockRejectedValueOnce(enoent())
    const s = await readState(CWD)
    expect(s).toEqual({ version: '1', installed: {} })
  })

  it('parses valid existing state.json', async () => {
    const persisted: HarnessedState = {
      version: '1',
      installed: {
        ctx7: { version: '1.0.0', installedAt: '2026-05-12T00:00:00Z', manifestSha1: 'abc123' },
      },
    }
    readFileMock.mockResolvedValueOnce(JSON.stringify(persisted))
    const s = await readState(CWD)
    expect(s.installed.ctx7?.version).toBe('1.0.0')
  })

  it('falls back to default on malformed JSON', async () => {
    readFileMock.mockResolvedValueOnce('{ this is not json')
    const s = await readState(CWD)
    expect(s).toEqual({ version: '1', installed: {} })
  })

  it('falls back to default on wrong schema version', async () => {
    readFileMock.mockResolvedValueOnce(JSON.stringify({ version: '99', installed: {} }))
    const s = await readState(CWD)
    expect(s).toEqual({ version: '1', installed: {} })
  })

  it('rethrows non-ENOENT errors (e.g. EACCES)', async () => {
    const eacces = new Error('EACCES') as NodeJS.ErrnoException
    eacces.code = 'EACCES'
    readFileMock.mockRejectedValueOnce(eacces)
    await expect(readState(CWD)).rejects.toThrow('EACCES')
  })
})

describe('state.writeState', () => {
  beforeEach(() => {
    readFileMock.mockReset()
    writeFileMock.mockReset()
    renameMock.mockReset()
    mkdirMock.mockReset()
    mkdirMock.mockResolvedValue(undefined)
    writeFileMock.mockResolvedValue(undefined)
    renameMock.mockResolvedValue(undefined)
  })

  it('writes to .tmp then renames (atomic)', async () => {
    const state: HarnessedState = { version: '1', installed: {} }
    await writeState(CWD, state)

    // First, mkdir for .harnessed/
    expect(mkdirMock).toHaveBeenCalledTimes(1)
    const mkdirArgs = mkdirMock.mock.calls[0]
    expect(mkdirArgs?.[0]).toMatch(/\.harnessed$/)
    expect(mkdirArgs?.[1]).toEqual({ recursive: true })

    // Then writeFile to .tmp
    expect(writeFileMock).toHaveBeenCalledTimes(1)
    const writeArgs = writeFileMock.mock.calls[0]
    expect(writeArgs?.[0]).toMatch(/state\.json\.tmp$/)

    // Then rename .tmp → state.json
    expect(renameMock).toHaveBeenCalledTimes(1)
    const renameArgs = renameMock.mock.calls[0]
    expect(renameArgs?.[0]).toMatch(/state\.json\.tmp$/)
    expect(renameArgs?.[1]).toMatch(/state\.json$/)
  })

  it('serialises with trailing newline (POSIX-friendly)', async () => {
    const state: HarnessedState = { version: '1', installed: {} }
    await writeState(CWD, state)
    const body = writeFileMock.mock.calls[0]?.[1] as string
    expect(body.endsWith('\n')).toBe(true)
    expect(body).toContain('"version": "1"')
  })
})

describe('state.updateInstalled', () => {
  beforeEach(() => {
    readFileMock.mockReset()
    writeFileMock.mockReset()
    renameMock.mockReset()
    mkdirMock.mockReset()
    mkdirMock.mockResolvedValue(undefined)
    writeFileMock.mockResolvedValue(undefined)
    renameMock.mockResolvedValue(undefined)
  })

  it('adds a new entry to a fresh state', async () => {
    readFileMock.mockRejectedValueOnce(enoent())
    await updateInstalled(CWD, 'ctx7', '1.0.0', 'sha1abc')
    const written = JSON.parse(writeFileMock.mock.calls[0]?.[1] as string) as HarnessedState
    expect(written.installed.ctx7?.version).toBe('1.0.0')
    expect(written.installed.ctx7?.manifestSha1).toBe('sha1abc')
    expect(written.installed.ctx7?.installedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('replaces an existing entry (idempotent re-install)', async () => {
    const existing: HarnessedState = {
      version: '1',
      installed: {
        ctx7: { version: '0.9.0', installedAt: '2026-01-01T00:00:00Z', manifestSha1: 'oldsha' },
      },
    }
    readFileMock.mockResolvedValueOnce(JSON.stringify(existing))
    await updateInstalled(CWD, 'ctx7', '1.0.0', 'newsha')
    const written = JSON.parse(writeFileMock.mock.calls[0]?.[1] as string) as HarnessedState
    expect(written.installed.ctx7?.version).toBe('1.0.0')
    expect(written.installed.ctx7?.manifestSha1).toBe('newsha')
  })

  it('preserves other installed entries when adding new one', async () => {
    const existing: HarnessedState = {
      version: '1',
      installed: {
        ctx7: { version: '1.0.0', installedAt: '2026-01-01T00:00:00Z', manifestSha1: 'a' },
      },
    }
    readFileMock.mockResolvedValueOnce(JSON.stringify(existing))
    await updateInstalled(CWD, 'tavily-mcp', '0.2.0', 'b')
    const written = JSON.parse(writeFileMock.mock.calls[0]?.[1] as string) as HarnessedState
    expect(written.installed.ctx7?.version).toBe('1.0.0')
    expect(written.installed['tavily-mcp']?.version).toBe('0.2.0')
  })
})

afterEach(() => {
  vi.clearAllMocks()
})
