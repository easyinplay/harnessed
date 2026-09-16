// Phase 1.2 unit tests for src/cli/rollback.ts.
//
// Covers (ADR 0004 § 3 + ASSUMPTIONS C3):
//   - registers `rollback <timestamp>` subcommand
//   - missing metadata.json → exit 1 (with hint to run backup list)
//   - happy path: ok files restored → exit 0
//   - sha1 mismatch → exit 1 (corruption detection)
//   - pure-create sentinel (backup === '') → calls unlink not writeFile
//
// Mocks: fs/promises (readFile, writeFile, unlink), node:crypto via createHash
// (let real hash run since cheap/deterministic).

import { createHash } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  unlink: vi.fn(),
  rm: vi.fn(),
  stat: vi.fn(),
}))

import { readFile, rm, stat, unlink, writeFile } from 'node:fs/promises'
import { Command } from 'commander'
import { registerRollback } from '../../src/cli/rollback.js'

const readFileMock = vi.mocked(readFile)
const writeFileMock = vi.mocked(writeFile)
const unlinkMock = vi.mocked(unlink)
const rmMock = vi.mocked(rm)
const statMock = vi.mocked(stat)

class ExitError extends Error {
  constructor(public code: number) {
    super(`process.exit(${code})`)
  }
}

async function runCli(argv: string[]): Promise<number> {
  const exit = vi.spyOn(process, 'exit').mockImplementation((code?: number | string | null) => {
    throw new ExitError(typeof code === 'number' ? code : 0)
  })
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  const err = vi.spyOn(console, 'error').mockImplementation(() => {})
  const program = new Command().exitOverride()
  registerRollback(program)
  try {
    await program.parseAsync(['node', 'harnessed', ...argv])
    return 0
  } catch (e) {
    if (e instanceof ExitError) return e.code
    throw e
  } finally {
    exit.mockRestore()
    log.mockRestore()
    err.mockRestore()
  }
}

describe('cli/rollback', () => {
  beforeEach(() => {
    readFileMock.mockReset()
    writeFileMock.mockReset()
    unlinkMock.mockReset()
    rmMock.mockReset()
    statMock.mockReset()
  })

  it('registers `rollback` subcommand', () => {
    const program = new Command()
    registerRollback(program)
    const cmd = program.commands.find((c) => c.name() === 'rollback')
    expect(cmd).toBeDefined()
  })

  it('missing metadata.json → exit 1', async () => {
    readFileMock.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    const code = await runCli(['rollback', '2026-05-12T00-00-00.000Z'])
    expect(code).toBe(1)
  })

  it('happy path: file restored → exit 0', async () => {
    const original = Buffer.from('hello\n', 'utf8')
    const sha1 = createHash('sha1').update(original).digest('hex')
    const meta = {
      installer: 'foo',
      manifest: 'foo',
      timestamp: '2026-05-12T00-00-00.000Z',
      files: [
        {
          target: '/tmp/foo.txt',
          backup: '/tmp/.harnessed-backup/2026-05-12T00-00-00.000Z/PROJECT/foo.txt',
          sha1,
          eol: 'lf' as const,
        },
      ],
    }
    readFileMock.mockImplementation((async (p: unknown) => {
      const path = typeof p === 'string' ? p : String(p)
      if (path.endsWith('metadata.json')) return JSON.stringify(meta)
      return original
      // biome-ignore lint/suspicious/noExplicitAny: readFile has many overloads
    }) as any)
    writeFileMock.mockResolvedValue(undefined)
    const code = await runCli(['rollback', '2026-05-12T00-00-00.000Z'])
    expect(code).toBe(0)
    expect(writeFileMock).toHaveBeenCalledTimes(1)
  })

  it('sha1 mismatch → exit 1', async () => {
    const meta = {
      installer: 'foo',
      manifest: 'foo',
      timestamp: '2026-05-12T00-00-00.000Z',
      files: [
        {
          target: '/tmp/foo.txt',
          backup: '/tmp/.harnessed-backup/x/PROJECT/foo.txt',
          sha1: 'deadbeef'.repeat(5),
          eol: 'lf' as const,
        },
      ],
    }
    readFileMock.mockImplementation((async (p: unknown) => {
      const path = typeof p === 'string' ? p : String(p)
      if (path.endsWith('metadata.json')) return JSON.stringify(meta)
      return Buffer.from('tampered', 'utf8')
      // biome-ignore lint/suspicious/noExplicitAny: readFile has many overloads
    }) as any)
    const code = await runCli(['rollback', '2026-05-12T00-00-00.000Z'])
    expect(code).toBe(1)
    expect(writeFileMock).not.toHaveBeenCalled()
  })

  it('pure-create sentinel (backup==="") → calls unlink, not writeFile', async () => {
    const meta = {
      installer: 'foo',
      manifest: 'foo',
      timestamp: '2026-05-12T00-00-00.000Z',
      files: [
        {
          target: '/tmp/created-by-install.txt',
          backup: '',
          sha1: '',
          eol: 'lf' as const,
        },
      ],
    }
    readFileMock.mockResolvedValue(JSON.stringify(meta))
    unlinkMock.mockResolvedValue(undefined)
    const code = await runCli(['rollback', '2026-05-12T00-00-00.000Z'])
    expect(code).toBe(0)
    expect(unlinkMock).toHaveBeenCalledTimes(1)
    expect(writeFileMock).not.toHaveBeenCalled()
  })

  // git-clone-with-setup's DiffPlan target is the clone DIRECTORY. Every sentinel
  // entry used to get a single-file unlink(), which on a directory fails (EPERM on
  // Windows, EISDIR on POSIX) — so rolling back any git-clone install exited 1.
  // unlink is made to reject the way the real one does on a directory; a mock that
  // happily "unlinks" a directory would hide the bug.
  const metaWith = (sentinel: 'created' | 'preexisting-dir' | undefined, target: string) => ({
    installer: 'gstack',
    manifest: 'gstack',
    timestamp: '2026-05-12T00-00-00.000Z',
    files: [
      { target, backup: '', sha1: '', eol: 'lf' as const, ...(sentinel ? { sentinel } : {}) },
    ],
  })
  const dirUnlinkFails = () => {
    const e = new Error('EPERM: operation not permitted, unlink') as NodeJS.ErrnoException
    e.code = 'EPERM'
    unlinkMock.mockRejectedValue(e)
  }

  it("sentinel 'created' on a cloned directory → removed recursively, exit 0", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify(metaWith('created', '/home/u/.claude/skills/gstack')),
    )
    dirUnlinkFails()
    rmMock.mockResolvedValue(undefined)
    const code = await runCli(['rollback', '2026-05-12T00-00-00.000Z'])
    expect(code).toBe(0)
    expect(rmMock).toHaveBeenCalledWith('/home/u/.claude/skills/gstack', {
      recursive: true,
      force: true,
    })
    expect(unlinkMock).not.toHaveBeenCalled()
  })

  it("sentinel 'preexisting-dir' → left untouched (no byte backup; deleting would destroy user data)", async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify(metaWith('preexisting-dir', '/home/u/.claude/skills/gstack')),
    )
    const code = await runCli(['rollback', '2026-05-12T00-00-00.000Z'])
    expect(code).toBe(0)
    expect(rmMock).not.toHaveBeenCalled()
    expect(unlinkMock).not.toHaveBeenCalled()
  })

  it('legacy metadata (no sentinel) on a directory → kept, never deleted on a guess', async () => {
    readFileMock.mockResolvedValue(
      JSON.stringify(metaWith(undefined, '/home/u/.claude/skills/gstack')),
    )
    // biome-ignore lint/suspicious/noExplicitAny: minimal Stats double
    statMock.mockResolvedValue({ isDirectory: () => true } as any)
    dirUnlinkFails()
    const code = await runCli(['rollback', '2026-05-12T00-00-00.000Z'])
    expect(code).toBe(0)
    expect(rmMock).not.toHaveBeenCalled()
    expect(unlinkMock).not.toHaveBeenCalled()
  })
})
