// Phase 1.2 unit tests for src/installers/lib/state.ts.
//
// Covers:
//   - readState() returns default {version:'1', installed:{}} on ENOENT
//   - readState() falls back to default on malformed JSON
//   - readState() falls back to default on wrong schema version
//   - writeState() goes through atomic .tmp + rename
//   - updateInstalled() adds new entry
//   - updateInstalled() replaces existing entry (idempotent re-install)
//   - recordObservedInstall() repairs an absent entry (Phase 59 — the receipt
//     was unreachable whenever idempotent_check hit, so `harnessed status`
//     under-reported forever and re-running install could not fix it)
//   - recordObservedInstall() leaves a matching entry completely alone
//   - recordObservedInstall() preserves installedAt when repairing a stale one
//   - recordObservedInstall() swallows I/O failure (receipts are bookkeeping)
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
  recordObservedInstall,
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

    // v3.0.3: mkdir parent of state.json — path is the harness root
    // (`~/.claude/harnessed`), not the legacy cwd-rooted `.harnessed`.
    expect(mkdirMock).toHaveBeenCalledTimes(1)
    const mkdirArgs = mkdirMock.mock.calls[0]
    expect(String(mkdirArgs?.[0])).toMatch(/[\\/]\.claude[\\/]harnessed$/)
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

  // v3.0.3 regression — state path resolves under homedir/.claude/harnessed,
  // NOT under ctx.cwd (which may be read-only, like Warp default
  // `C:\Program Files\Warp\`). Sister v2.0.1 backup-root fixture.
  it('v3.0.3 regression — state path under ~/.claude/harnessed NOT ctx.cwd (EPERM-fix when CWD is read-only)', async () => {
    const state: HarnessedState = { version: '1', installed: {} }
    await writeState('C:\\Program Files\\Warp', state)
    const mkdirArgs = mkdirMock.mock.calls[0]
    const p = String(mkdirArgs?.[0])
    expect(p).not.toContain('Program Files')
    expect(p).toMatch(/[\\/]\.claude[\\/]harnessed$/)
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

// Phase 59 — every installer's `isAlreadyInstalled` early return sits BEFORE its
// `updateInstalled` call, so a component present without a receipt (installed by
// hand, or entry lost) could never be recorded, and re-running `harnessed
// install` could not repair it. `harnessed status` is the one consumer of
// state.json and reported "no installs recorded" on a machine full of them.
// Sister defect: Trellis #575 (receipt entries for files already identical to a
// template were never written back, making the drift signal useless).
describe('state.recordObservedInstall', () => {
  beforeEach(() => {
    readFileMock.mockReset()
    writeFileMock.mockReset()
    renameMock.mockReset()
    mkdirMock.mockReset()
  })

  it('repairs an absent entry', async () => {
    readFileMock.mockRejectedValueOnce(enoent())
    await recordObservedInstall(CWD, 'superpowers', '6.3.0', '')
    const written = JSON.parse(writeFileMock.mock.calls[0]?.[1] as string) as HarnessedState
    expect(written.installed.superpowers?.version).toBe('6.3.0')
    expect(written.installed.superpowers?.installedAt).toBeTruthy()
  })

  it('writes NOTHING when the entry already matches', async () => {
    const existing: HarnessedState = {
      version: '1',
      installed: {
        superpowers: { version: '6.3.0', installedAt: '2026-05-27T00:00:00Z', manifestSha1: '' },
      },
    }
    readFileMock.mockResolvedValueOnce(JSON.stringify(existing))
    await recordObservedInstall(CWD, 'superpowers', '6.3.0', '')
    expect(writeFileMock).not.toHaveBeenCalled()
  })

  it('repairs a stale version but PRESERVES the original installedAt', async () => {
    // We did not install it now and cannot know when it happened; restamping the
    // date would make the field a fresh lie rather than a stale truth.
    const existing: HarnessedState = {
      version: '1',
      installed: {
        superpowers: { version: '5.1.0', installedAt: '2026-05-27T00:00:00Z', manifestSha1: '' },
      },
    }
    readFileMock.mockResolvedValueOnce(JSON.stringify(existing))
    await recordObservedInstall(CWD, 'superpowers', '6.3.0', '')
    const written = JSON.parse(writeFileMock.mock.calls[0]?.[1] as string) as HarnessedState
    expect(written.installed.superpowers?.version).toBe('6.3.0')
    expect(written.installed.superpowers?.installedAt).toBe('2026-05-27T00:00:00Z')
  })

  it('preserves unrelated entries while repairing one', async () => {
    const existing: HarnessedState = {
      version: '1',
      installed: {
        ctx7: { version: '0.5.11', installedAt: '2026-01-01T00:00:00Z', manifestSha1: 'a' },
      },
    }
    readFileMock.mockResolvedValueOnce(JSON.stringify(existing))
    await recordObservedInstall(CWD, 'ecc', '2.2.1', '')
    const written = JSON.parse(writeFileMock.mock.calls[0]?.[1] as string) as HarnessedState
    expect(written.installed.ctx7?.version).toBe('0.5.11')
    expect(written.installed.ecc?.version).toBe('2.2.1')
  })

  it('swallows a write failure — a receipt must not fail an install', async () => {
    readFileMock.mockRejectedValueOnce(enoent())
    writeFileMock.mockRejectedValueOnce(new Error('EACCES'))
    await expect(recordObservedInstall(CWD, 'ecc', '2.2.1', '')).resolves.toBeUndefined()
  })
})

afterEach(() => {
  vi.clearAllMocks()
})
