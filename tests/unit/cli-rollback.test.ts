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
import { SUBTREE_ENTRY_SHA1 } from '../../src/installers/lib/jsonSubtree.js'

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

  // Phase 88 — json-subtree rollback. Pass1 must verify payload checksum,
  // validate the payload shape, parse the CURRENT target JSON, and compute the
  // restored buffer — all before Pass2 mutates anything.
  describe('json-subtree restore', () => {
    const SECRET = 'sk-fake-NEWSECRET-999'
    const target = '/home/u/.claude/settings.json'
    const backupPath = '/tmp/.harnessed-backup/ts/HOME/.claude/settings.json'

    function subtreeMeta(over: Record<string, unknown> = {}, extraFiles: unknown[] = []) {
      const payload = over.payload ?? {
        version: 1,
        changes: [
          {
            path: ['hooks', 'SessionStart'],
            existed: true,
            value: [{ type: 'command', command: 'old-hook' }],
          },
          { path: ['harnessedManaged'], existed: false },
          { path: ['removedByInstall'], existed: true, value: 'bring-me-back' },
        ],
      }
      const payloadBuf = Buffer.from(JSON.stringify(payload), 'utf8')
      const payloadSha1 = createHash('sha1').update(payloadBuf).digest('hex')
      const file: Record<string, unknown> = {
        target,
        backup: backupPath,
        sha1: SUBTREE_ENTRY_SHA1, // format discriminator; real digest → payloadSha1
        payloadSha1,
        eol: 'lf',
        kind: 'json-subtree',
      }
      return {
        meta: {
          installer: 'foo',
          manifest: 'foo',
          timestamp: '2026-05-12T00-00-00.000Z',
          files: [file, ...extraFiles],
        },
        payloadBuf,
      }
    }

    const currentSettings = () =>
      JSON.stringify(
        {
          env: { API_KEY: SECRET }, // user's NEW secret — must survive
          hooks: {
            SessionStart: [{ type: 'command', command: 'harnessed-hook' }],
            Stop: [{ type: 'command', command: 'user-stop-edit' }], // user's sibling edit — must survive
          },
          harnessedManaged: { junk: true }, // added by install → removed
          userAdded: 'stay', // unrelated user key — must survive
        },
        null,
        2,
      )

    function mockFs(meta: unknown, payload: Buffer | string, current: string | Error) {
      readFileMock.mockImplementation((async (p: unknown) => {
        const path = String(p)
        if (path.endsWith('metadata.json')) return JSON.stringify(meta)
        if (path === backupPath) return payload
        if (path === target) {
          if (current instanceof Error) throw current
          return current
        }
        throw new Error(`unexpected readFile ${path}`)
        // biome-ignore lint/suspicious/noExplicitAny: readFile overloads
      }) as any)
    }

    function writtenJson(): Record<string, unknown> {
      expect(writeFileMock).toHaveBeenCalledTimes(1)
      const [path, data] = writeFileMock.mock.calls[0] as [string, Buffer]
      expect(path).toBe(target)
      return JSON.parse(data.toString('utf8')) as Record<string, unknown>
    }

    function expectNoMutations() {
      expect(writeFileMock).not.toHaveBeenCalled()
      expect(unlinkMock).not.toHaveBeenCalled()
      expect(rmMock).not.toHaveBeenCalled()
    }

    it('restores old hook value, removes added path, restores deleted path, preserves user keys + new secret', async () => {
      const { meta, payloadBuf } = subtreeMeta()
      mockFs(meta, payloadBuf, currentSettings())
      writeFileMock.mockResolvedValue(undefined)
      const code = await runCli(['rollback', '2026-05-12T00-00-00.000Z'])
      expect(code).toBe(0)
      const restored = writtenJson() as {
        env: { API_KEY: string }
        hooks: Record<string, unknown>
        removedByInstall: string
        userAdded: string
      }
      expect(restored.env.API_KEY).toBe(SECRET)
      expect(restored.hooks.SessionStart).toEqual([{ type: 'command', command: 'old-hook' }])
      expect(restored.hooks.Stop).toEqual([{ type: 'command', command: 'user-stop-edit' }])
      expect(restored.removedByInstall).toBe('bring-me-back')
      expect(restored.userAdded).toBe('stay')
      expect('harnessedManaged' in restored).toBe(false)
    })

    it('serializes restored JSON with CRLF when entry.eol is crlf', async () => {
      const { meta, payloadBuf } = subtreeMeta()
      ;(meta.files[0] as Record<string, unknown>).eol = 'crlf'
      mockFs(meta, payloadBuf, currentSettings())
      writeFileMock.mockResolvedValue(undefined)
      const code = await runCli(['rollback', '2026-05-12T00-00-00.000Z'])
      expect(code).toBe(0)
      const data = (writeFileMock.mock.calls[0] as [string, Buffer])[1]
      const text = data.toString('utf8')
      expect(text).toContain('\r\n')
      expect(text).not.toMatch(/[^\r]\n/)
      expect(text.endsWith('\r\n')).toBe(true)
    })

    it('literal __proto__ key restores as own data property, no prototype pollution', async () => {
      const { meta, payloadBuf } = subtreeMeta({
        payload: {
          version: 1,
          changes: [{ path: ['__proto__'], existed: true, value: { polluted: 'yes' } }],
        },
      })
      mockFs(meta, payloadBuf, currentSettings())
      writeFileMock.mockResolvedValue(undefined)
      const code = await runCli(['rollback', '2026-05-12T00-00-00.000Z'])
      expect(code).toBe(0)
      const restored = writtenJson()
      expect(Object.hasOwn(restored, '__proto__')).toBe(true)
      // biome-ignore lint/suspicious/noExplicitAny: probing prototype pollution
      expect(({} as any).polluted).toBeUndefined()
    })

    it('corrupt subtree payload checksum → exit 1, ZERO mutations', async () => {
      const { meta } = subtreeMeta()
      mockFs(meta, Buffer.from('{"tampered":true}'), currentSettings())
      const code = await runCli(['rollback', '2026-05-12T00-00-00.000Z'])
      expect(code).toBe(1)
      expectNoMutations()
    })

    it.each([
      ['unknown version', { version: 2, changes: [] }],
      ['non-array changes', { version: 1, changes: {} }],
      ['empty path', { version: 1, changes: [{ path: [], existed: true, value: 1 }] }],
      [
        'non-string segment',
        { version: 1, changes: [{ path: ['a', 1], existed: true, value: 1 }] },
      ],
      ['existed missing', { version: 1, changes: [{ path: ['a'], value: 1 }] }],
      ['existed:true without value', { version: 1, changes: [{ path: ['a'], existed: true }] }],
      [
        'existed:false with value',
        { version: 1, changes: [{ path: ['a'], existed: false, value: 1 }] },
      ],
      [
        'duplicate paths',
        {
          version: 1,
          changes: [
            { path: ['a'], existed: true, value: 1 },
            { path: ['a'], existed: true, value: 2 },
          ],
        },
      ],
      [
        'ancestor/descendant overlap',
        {
          version: 1,
          changes: [
            { path: ['a'], existed: true, value: {} },
            { path: ['a', 'b'], existed: true, value: 1 },
          ],
        },
      ],
    ])('malformed payload (%s) → exit 1, ZERO mutations', async (_label, payload) => {
      const { meta, payloadBuf } = subtreeMeta({ payload })
      mockFs(meta, payloadBuf, currentSettings())
      const code = await runCli(['rollback', '2026-05-12T00-00-00.000Z'])
      expect(code).toBe(1)
      expectNoMutations()
    })

    it('unknown entry kind → exit 1 before any mutation', async () => {
      const { meta, payloadBuf } = subtreeMeta()
      ;(meta.files[0] as Record<string, unknown>).kind = 'future-kind'
      mockFs(meta, payloadBuf, currentSettings())
      const code = await runCli(['rollback', '2026-05-12T00-00-00.000Z'])
      expect(code).toBe(1)
      expectNoMutations()
    })

    it('non-JSON garbage payload bytes → exit 1, ZERO mutations', async () => {
      const payload = 'this is not json {'
      const payloadSha1 = createHash('sha1').update(payload).digest('hex')
      const meta = {
        installer: 'foo',
        manifest: 'foo',
        timestamp: '2026-05-12T00-00-00.000Z',
        files: [
          {
            target,
            backup: backupPath,
            sha1: SUBTREE_ENTRY_SHA1,
            payloadSha1,
            eol: 'lf',
            kind: 'json-subtree',
          },
        ],
      }
      mockFs(meta, payload, currentSettings())
      const code = await runCli(['rollback', '2026-05-12T00-00-00.000Z'])
      expect(code).toBe(1)
      expectNoMutations()
    })

    it.each([
      ['real sha1 instead of discriminator', { sha1: 'a'.repeat(40) }],
      ['missing payloadSha1', { payloadSha1: undefined }],
      ['non-hex payloadSha1', { payloadSha1: 'not-a-digest' }],
      ['empty backup path', { backup: '' }],
      ['sentinel field set', { sentinel: 'created', backup: '' }],
    ])('inconsistent subtree entry (%s) → exit 1, ZERO mutations', async (_label, over) => {
      const { meta, payloadBuf } = subtreeMeta()
      const file = meta.files[0] as Record<string, unknown>
      for (const [k, v] of Object.entries(over)) {
        if (v === undefined) delete file[k]
        else file[k] = v
      }
      mockFs(meta, payloadBuf, currentSettings())
      const code = await runCli(['rollback', '2026-05-12T00-00-00.000Z'])
      expect(code).toBe(1)
      expectNoMutations()
    })

    it('non-subtree entry carrying payloadSha1 → exit 1, ZERO mutations', async () => {
      const original = Buffer.from('hello\n', 'utf8')
      const sha1 = createHash('sha1').update(original).digest('hex')
      const meta = {
        installer: 'foo',
        manifest: 'foo',
        timestamp: '2026-05-12T00-00-00.000Z',
        files: [
          { target: '/tmp/f.txt', backup: '/tmp/b/f.txt', sha1, payloadSha1: sha1, eol: 'lf' },
        ],
      }
      readFileMock.mockImplementation((async (p: unknown) => {
        const path = String(p)
        if (path.endsWith('metadata.json')) return JSON.stringify(meta)
        return original
        // biome-ignore lint/suspicious/noExplicitAny: readFile overloads
      }) as any)
      const code = await runCli(['rollback', '2026-05-12T00-00-00.000Z'])
      expect(code).toBe(1)
      expectNoMutations()
    })

    it.each([
      ['untouched non-finite in current', '{"env":{"API_KEY":"x"},"big":1e400}'],
      ['untouched unsafe integer in current', '{"env":{"API_KEY":"x"},"big":9007199254740993}'],
    ])('numeric fidelity (%s) → exit 1, ZERO mutations', async (_label, current) => {
      const { meta, payloadBuf } = subtreeMeta()
      mockFs(meta, payloadBuf, current)
      const code = await runCli(['rollback', '2026-05-12T00-00-00.000Z'])
      expect(code).toBe(1)
      expectNoMutations()
    })

    it('unsafe number inside recorded old value → exit 1, ZERO mutations', async () => {
      // Literal payload text: 1e400 parses to Infinity — a payload carrying it
      // could never be faithfully re-serialized, so refuse. (Can't build this
      // via JSON.stringify — it would emit null, masking the defect.)
      const payloadBuf = Buffer.from(
        '{"version":1,"changes":[{"path":["a"],"existed":true,"value":1e400}]}',
        'utf8',
      )
      const meta = {
        installer: 'foo',
        manifest: 'foo',
        timestamp: '2026-05-12T00-00-00.000Z',
        files: [
          {
            target,
            backup: backupPath,
            sha1: SUBTREE_ENTRY_SHA1,
            payloadSha1: createHash('sha1').update(payloadBuf).digest('hex'),
            eol: 'lf',
            kind: 'json-subtree',
          },
        ],
      }
      mockFs(meta, payloadBuf, JSON.stringify({ a: 1 }))
      const code = await runCli(['rollback', '2026-05-12T00-00-00.000Z'])
      expect(code).toBe(1)
      expectNoMutations()
    })

    it('nested constructor/prototype paths are literal data, not prototype manipulation', async () => {
      const { meta, payloadBuf } = subtreeMeta({
        payload: {
          version: 1,
          changes: [
            { path: ['cfg', 'constructor'], existed: true, value: { x: 'old' } },
            { path: ['cfg', 'prototype'], existed: false },
          ],
        },
      })
      const current = JSON.stringify({
        cfg: { constructor: { x: 'new' }, prototype: true, keep: 1 },
      })
      mockFs(meta, payloadBuf, current)
      writeFileMock.mockResolvedValue(undefined)
      const code = await runCli(['rollback', '2026-05-12T00-00-00.000Z'])
      expect(code).toBe(0)
      const restored = writtenJson() as { cfg: Record<string, unknown> }
      expect(restored.cfg.constructor).toEqual({ x: 'old' })
      expect('prototype' in restored.cfg).toBe(false)
      expect(restored.cfg.keep).toBe(1)
      // biome-ignore lint/suspicious/noExplicitAny: probing prototype pollution
      expect(({} as any).x).toBeUndefined()
    })

    it.each([
      ['missing target', Object.assign(new Error('ENOENT'), { code: 'ENOENT' })],
      ['unparseable JSON', 'not json {'],
      ['array root', '[1,2]'],
      ['scalar root', '"str"'],
      ['missing parent', JSON.stringify({ other: {} })],
      ['scalar parent', JSON.stringify({ hooks: 'flat', env: {} })],
    ])('current target unusable (%s) → exit 1, ZERO mutations', async (_label, current) => {
      const { meta, payloadBuf } = subtreeMeta()
      mockFs(meta, payloadBuf, current as string | Error)
      const code = await runCli(['rollback', '2026-05-12T00-00-00.000Z'])
      expect(code).toBe(1)
      expectNoMutations()
    })

    it('duplicate target entries involving a subtree → fail closed in Pass1, ZERO mutations', async () => {
      const { meta, payloadBuf } = subtreeMeta({}, [
        { target, backup: '', sha1: '', eol: 'lf', sentinel: 'created' },
      ])
      mockFs(meta, payloadBuf, currentSettings())
      const code = await runCli(['rollback', '2026-05-12T00-00-00.000Z'])
      expect(code).toBe(1)
      expectNoMutations()
    })

    it('multi-file rollback: subtree processed first, byte corruption second → still ZERO writes', async () => {
      // meta.files order: corrupt byte entry FIRST, subtree LAST — Pass1 walks
      // meta.files in reverse, so the subtree entry is processed first (its
      // current-target read provably happens) before the corrupt byte entry
      // aborts the whole pass. Zero writes either way.
      const { meta, payloadBuf } = subtreeMeta()
      meta.files.unshift({
        target: '/tmp/other.txt',
        backup: '/tmp/.harnessed-backup/ts/PROJECT/other.txt',
        sha1: 'deadbeef'.repeat(5), // corrupt on purpose
        eol: 'lf',
      })
      let targetWasRead = false
      readFileMock.mockImplementation((async (p: unknown) => {
        const path = String(p)
        if (path.endsWith('metadata.json')) return JSON.stringify(meta)
        if (path === backupPath) return payloadBuf
        if (path === target) {
          targetWasRead = true
          return currentSettings()
        }
        return Buffer.from('tampered bytes')
        // biome-ignore lint/suspicious/noExplicitAny: readFile overloads
      }) as any)
      const code = await runCli(['rollback', '2026-05-12T00-00-00.000Z'])
      expect(code).toBe(1)
      expect(targetWasRead).toBe(true) // subtree restore was attempted first
      expectNoMutations()
    })
  })
})
