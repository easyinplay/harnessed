// Phase 1.2 unit tests for src/installers/lib/backup.ts.
//
// Covers (ADR 0004 § 3 + ASSUMPTIONS C3):
//   - backupId is ISO timestamp with `:` replaced (Win-safe filename)
//   - mkdir for .harnessed-backup/<id>/ called with recursive:true
//   - per-file readFile + writeFile to mirror path
//   - sha1 computed for each backed-up file
//   - metadata.json written with per-file eol field ('lf' | 'crlf' from
//     content detection)
//   - ENOENT on pure-create (oldText==='') yields sentinel entry, no abort
//   - mkdir / read / write failures yield InstallResult ok:false (no throw)
//
// Mocks: node:fs/promises (no real disk I/O — C6 mitigation).

import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
}))

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { backup } from '../../src/installers/lib/backup.js'
import { SUBTREE_ENTRY_SHA1 } from '../../src/installers/lib/jsonSubtree.js'
import type {
  DiffPlan,
  InstallContext,
  InstallOpts,
  Manifest,
} from '../../src/installers/lib/types.js'

const mkdirMock = vi.mocked(mkdir)
const readFileMock = vi.mocked(readFile)
const writeFileMock = vi.mocked(writeFile)

const BASE_OPTS: InstallOpts = {
  apply: true,
  dryRun: false,
  system: false,
  nonInteractive: false,
  fullDiff: false,
  updateInstalled: true,
  color: 'auto',
}

function baseManifest(): Manifest {
  return {
    apiVersion: 'harnessed/v1',
    kind: 'Manifest',
    metadata: {
      name: 'bk-test',
      display_name: 'Backup Test',
      description: 'fixture',
      upstream: {
        source: 'bk-test',
        homepage: 'https://example.com',
        repository: 'https://github.com/example/bk-test.git',
        license: 'MIT',
        notice: 'fixture',
      },
    },
    spec: {
      type: 'cli-npm',
      component_type: 'cli-binary',
      install: {
        method: 'npm-cli',
        cmd: 'npm install -g bk-test',
        npm_version: '^1.0.0',
        idempotent_check: 'which bk-test',
      },
      verify: { cmd: 'bk-test --version', timeout_ms: 5000, expected_exit_code: 0 },
      uninstall: { cmd: 'npm uninstall -g bk-test' },
      upstream_health: {
        stability: 'stable',
        last_check: '2026-05-12',
        last_known_good_version: '1.0.0',
        fallback_action: 'warn',
      },
      signed_by: 'easyinplay',
      platforms: ['linux', 'darwin', 'win32'],
    },
  } as Manifest
}

function ctx(): InstallContext {
  return { manifest: baseManifest(), opts: BASE_OPTS, level: 'L2', cwd: '/tmp/proj' }
}

// Find writeFile call whose first arg matches a pattern.
function writeCallMatching(pattern: RegExp): [string, unknown, ...unknown[]] | undefined {
  return writeFileMock.mock.calls.find((c) => pattern.test(String(c[0]))) as
    | [string, unknown, ...unknown[]]
    | undefined
}

describe('backup', () => {
  beforeEach(() => {
    mkdirMock.mockReset()
    readFileMock.mockReset()
    writeFileMock.mockReset()
    mkdirMock.mockResolvedValue(undefined)
    writeFileMock.mockResolvedValue(undefined)
  })

  it('generates ISO timestamp backupId with `:` replaced for Win safety', async () => {
    const plan: DiffPlan = { files: [] } // empty plan → only metadata.json written
    const r = await backup(plan, ctx())
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.backupId).not.toContain(':')
      expect(r.backupId).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/)
    }
  })

  it('creates backup dir with recursive mkdir', async () => {
    const plan: DiffPlan = { files: [] }
    await backup(plan, ctx())
    const firstMkdir = mkdirMock.mock.calls[0]
    // v3.0.3: backup root under ~/.claude/harnessed/backups (was ~/.harnessed/backups in v2.0.1).
    expect(String(firstMkdir?.[0])).toMatch(/\.claude[/\\]harnessed[/\\]backups/)
    expect(firstMkdir?.[1]).toEqual({ recursive: true })
  })

  it('v3.0.3 regression — backup root resolves under ~/.claude/harnessed NOT ctx.cwd (EPERM fix when CWD is read-only like Program Files)', async () => {
    const plan: DiffPlan = { files: [] }
    // ctx.cwd intentionally set to a path that should NOT appear in backup dir
    // (sister user repro: CWD = C:\Program Files\Warp\ → EPERM on mkdir)
    const readOnlyCtx: InstallContext = { ...ctx(), cwd: 'C:\\Program Files\\Warp' }
    await backup(plan, readOnlyCtx)
    const firstMkdir = mkdirMock.mock.calls[0]?.[0] as string
    expect(firstMkdir).toBeTruthy()
    expect(firstMkdir).not.toContain('Program Files')
    expect(firstMkdir).not.toContain('C:\\Program')
    // Path should reference ~/.claude/harnessed/backups (v3.0.3 path migration).
    expect(firstMkdir).toMatch(/\.claude[/\\]harnessed[/\\]backups/)
  })

  it('writes metadata.json with installer name + timestamp + files[]', async () => {
    const plan: DiffPlan = { files: [] }
    const r = await backup(plan, ctx())
    expect(r.ok).toBe(true)
    const metaCall = writeCallMatching(/metadata\.json$/)
    expect(metaCall).toBeDefined()
    if (metaCall) {
      const meta = JSON.parse(metaCall[1] as string)
      expect(meta.installer).toBe('bk-test')
      expect(meta.manifest).toBe('bk-test')
      expect(meta.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      expect(Array.isArray(meta.files)).toBe(true)
      expect(meta.files).toEqual([])
    }
  })

  it('detects LF EOL from buffer (per-file eol field)', async () => {
    readFileMock.mockResolvedValueOnce(Buffer.from('line a\nline b\n'))
    const plan: DiffPlan = {
      files: [{ target: '/tmp/proj/.mcp.json', scope: 'PROJECT', oldText: 'x', newText: 'y' }],
    }
    const r = await backup(plan, ctx())
    expect(r.ok).toBe(true)
    const metaCall = writeCallMatching(/metadata\.json$/)
    const meta = JSON.parse(metaCall?.[1] as string)
    expect(meta.files[0].eol).toBe('lf')
  })

  it('detects CRLF EOL from buffer', async () => {
    readFileMock.mockResolvedValueOnce(Buffer.from('line a\r\nline b\r\n'))
    const plan: DiffPlan = {
      files: [{ target: '/tmp/proj/.mcp.json', scope: 'PROJECT', oldText: 'x', newText: 'y' }],
    }
    const r = await backup(plan, ctx())
    expect(r.ok).toBe(true)
    const metaCall = writeCallMatching(/metadata\.json$/)
    const meta = JSON.parse(metaCall?.[1] as string)
    expect(meta.files[0].eol).toBe('crlf')
  })

  it('computes sha1 hex (40 chars) for each backed-up file', async () => {
    readFileMock.mockResolvedValueOnce(Buffer.from('hello'))
    const plan: DiffPlan = {
      files: [{ target: '/tmp/proj/.mcp.json', scope: 'PROJECT', oldText: 'x', newText: 'y' }],
    }
    const r = await backup(plan, ctx())
    expect(r.ok).toBe(true)
    const metaCall = writeCallMatching(/metadata\.json$/)
    const meta = JSON.parse(metaCall?.[1] as string)
    expect(meta.files[0].sha1).toMatch(/^[a-f0-9]{40}$/)
    // sha1('hello') = aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d
    expect(meta.files[0].sha1).toBe('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d')
  })

  it('records sentinel entry (backup="") on ENOENT for pure-create plans', async () => {
    const enoent = new Error('ENOENT') as NodeJS.ErrnoException
    enoent.code = 'ENOENT'
    readFileMock.mockRejectedValueOnce(enoent)
    const plan: DiffPlan = {
      files: [
        // oldText='' is the pure-create signal
        { target: '/tmp/proj/.mcp.json', scope: 'PROJECT', oldText: '', newText: 'new content' },
      ],
    }
    const r = await backup(plan, ctx())
    expect(r.ok).toBe(true)
    const metaCall = writeCallMatching(/metadata\.json$/)
    const meta = JSON.parse(metaCall?.[1] as string)
    expect(meta.files[0].backup).toBe('')
    expect(meta.files[0].sha1).toBe('')
  })

  it('v23 — records sentinel entry (backup="") on EISDIR (target is a dir, force-update overwrite) without aborting', async () => {
    const eisdir = new Error(
      'EISDIR: illegal operation on a directory, read',
    ) as NodeJS.ErrnoException
    eisdir.code = 'EISDIR'
    readFileMock.mockRejectedValueOnce(eisdir)
    const plan: DiffPlan = {
      files: [
        // git-clone-with-setup pure-create: target skill dir already exists as a dir.
        { target: '/tmp/proj/.claude/skills/foo', scope: 'HOME', oldText: '', newText: 'x' },
      ],
    }
    const r = await backup(plan, ctx())
    expect(r.ok).toBe(true)
    const metaCall = writeCallMatching(/metadata\.json$/)
    const meta = JSON.parse(metaCall?.[1] as string)
    expect(meta.files[0].backup).toBe('')
    expect(meta.files[0].sha1).toBe('')
  })

  it('returns ok=false with backup-mkdir-failed when mkdir throws', async () => {
    mkdirMock.mockRejectedValueOnce(new Error('disk full'))
    const plan: DiffPlan = { files: [] }
    const r = await backup(plan, ctx())
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error.keyword).toBe('backup-mkdir-failed')
    }
  })

  it('returns ok=false with backup-read-failed for non-ENOENT read errors', async () => {
    readFileMock.mockRejectedValueOnce(new Error('EACCES'))
    const plan: DiffPlan = {
      files: [{ target: '/tmp/proj/.mcp.json', scope: 'PROJECT', oldText: 'x', newText: 'y' }],
    }
    const r = await backup(plan, ctx())
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error.keyword).toBe('backup-read-failed')
    }
  })

  it('returns ok=false with backup-write-failed when copy write fails', async () => {
    readFileMock.mockResolvedValueOnce(Buffer.from('content'))
    // First mkdir for backup root succeeds; second mkdir (file dir) succeeds;
    // writeFile for the copy fails (next call after metadata is not reached).
    writeFileMock.mockRejectedValueOnce(new Error('disk full'))
    const plan: DiffPlan = {
      files: [{ target: '/tmp/proj/.mcp.json', scope: 'PROJECT', oldText: 'x', newText: 'y' }],
    }
    const r = await backup(plan, ctx())
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.error.keyword).toBe('backup-write-failed')
    }
  })

  // Phase 88 — scoped JSON backups. When oldText AND newText both parse as
  // JSON objects, backup records a json-subtree diff payload (OLD values only)
  // instead of byte-copying the file — unrelated secrets/keys never leave the
  // user's file.
  describe('json-subtree backups', () => {
    const SECRET = 'sk-fake-TESTSECRET-000'
    const oldSettings = JSON.stringify(
      {
        env: { API_KEY: SECRET, OTHER: 'keep' },
        hooks: {
          SessionStart: [{ matcher: '*', hooks: [{ type: 'command', command: 'old-hook' }] }],
          Stop: [{ matcher: '*', hooks: [{ type: 'command', command: 'stop-hook' }] }],
        },
      },
      null,
      2,
    )
    const newSettings = JSON.stringify(
      {
        env: { API_KEY: SECRET, OTHER: 'keep' },
        hooks: {
          SessionStart: [{ matcher: '*', hooks: [{ type: 'command', command: 'harnessed-hook' }] }],
          Stop: [{ matcher: '*', hooks: [{ type: 'command', command: 'stop-hook' }] }],
        },
      },
      null,
      2,
    )

    function settingsPlan(oldText = oldSettings, newText = newSettings): DiffPlan {
      return {
        files: [
          {
            target: '/home/u/.claude/settings.json',
            scope: 'HOME',
            oldText,
            newText,
          },
        ],
      }
    }

    function metaFiles(): Array<Record<string, unknown>> {
      const metaCall = writeCallMatching(/metadata\.json$/)
      expect(metaCall).toBeDefined()
      return JSON.parse(metaCall?.[1] as string).files
    }

    function subtreePayload(): { version: number; changes: Array<Record<string, unknown>> } {
      const payloadCall = writeFileMock.mock.calls.find(
        (c) => !/metadata\.json$/.test(String(c[0])),
      )
      expect(payloadCall).toBeDefined()
      return JSON.parse(String(payloadCall?.[1]))
    }

    it('emits kind json-subtree recording ONLY the changed leaf — no secret, no unchanged hook', async () => {
      readFileMock.mockResolvedValueOnce(Buffer.from(oldSettings, 'utf8'))
      const r = await backup(settingsPlan(), ctx())
      expect(r.ok).toBe(true)
      const files = metaFiles()
      expect(files).toHaveLength(1)
      expect(files[0]?.kind).toBe('json-subtree')
      // sha1 holds the format discriminator (a released rollback can never
      // checksum-match it → fails closed); the real digest is payloadSha1.
      expect(files[0]?.sha1).toBe(SUBTREE_ENTRY_SHA1)
      expect(files[0]?.payloadSha1).toMatch(/^[a-f0-9]{40}$/)

      const payloadText = JSON.stringify(subtreePayload())
      expect(payloadText).not.toContain(SECRET)
      expect(payloadText).not.toContain('stop-hook')
      expect(payloadText).not.toContain('harnessed-hook') // newText never recorded
      const payload = subtreePayload()
      expect(payload.version).toBe(1)
      expect(payload.changes).toEqual([
        {
          path: ['hooks', 'SessionStart'],
          existed: true,
          value: [{ matcher: '*', hooks: [{ type: 'command', command: 'old-hook' }] }],
        },
      ])
    })

    it('records add (existed:false, no value) + delete + scalar + array changes', async () => {
      const oldT = JSON.stringify({
        keep: 1,
        del: { a: 1 },
        scalar: 'old',
        arr: [1, 2, 3],
        nested: { a: 1, b: 2 },
      })
      const newT = JSON.stringify({
        keep: 1,
        added: 'new',
        scalar: 42,
        arr: [1, 2, 4],
        nested: { a: 1, b: 3, c: 4 },
      })
      readFileMock.mockResolvedValueOnce(Buffer.from(oldT, 'utf8'))
      const r = await backup(settingsPlan(oldT, newT), ctx())
      expect(r.ok).toBe(true)
      expect(subtreePayload().changes).toEqual([
        { path: ['del'], existed: true, value: { a: 1 } },
        { path: ['scalar'], existed: true, value: 'old' },
        { path: ['arr'], existed: true, value: [1, 2, 3] },
        { path: ['nested', 'b'], existed: true, value: 2 },
        { path: ['nested', 'c'], existed: false },
        { path: ['added'], existed: false },
      ])
    })

    it('arrays are atomic: changed element yields one whole-array change', async () => {
      const oldT = JSON.stringify({ a: [1, { x: 1 }] })
      const newT = JSON.stringify({ a: [1, { x: 2 }] })
      readFileMock.mockResolvedValueOnce(Buffer.from(oldT, 'utf8'))
      await backup(settingsPlan(oldT, newT), ctx())
      expect(subtreePayload().changes).toEqual([
        { path: ['a'], existed: true, value: [1, { x: 1 }] },
      ])
    })

    it('type transitions (object → scalar) are atomic, not recursive', async () => {
      const oldT = JSON.stringify({ a: { x: 1 } })
      const newT = JSON.stringify({ a: 'flat' })
      readFileMock.mockResolvedValueOnce(Buffer.from(oldT, 'utf8'))
      await backup(settingsPlan(oldT, newT), ctx())
      expect(subtreePayload().changes).toEqual([{ path: ['a'], existed: true, value: { x: 1 } }])
    })

    it('unchanged objects produce zero changes, not a whole-copy snapshot', async () => {
      readFileMock.mockResolvedValueOnce(Buffer.from(oldSettings, 'utf8'))
      const r = await backup(settingsPlan(oldSettings, oldSettings), ctx())
      expect(r.ok).toBe(true)
      expect(subtreePayload().changes).toEqual([])
      expect(subtreePayload()).not.toHaveProperty('snapshot')
    })

    it('treats __proto__/constructor/prototype as literal data keys without polluting prototypes', async () => {
      // Note: written as literal JSON text — an object literal `{__proto__:v}`
      // would set the prototype, not an own key, and stringify would drop it.
      const oldT = '{"__proto__":{"x":1},"constructor":"safe"}'
      const newT = '{"constructor":"safe","prototype":{}}'
      readFileMock.mockResolvedValueOnce(Buffer.from(oldT, 'utf8'))
      const r = await backup(settingsPlan(oldT, newT), ctx())
      expect(r.ok).toBe(true)
      const changes = subtreePayload().changes
      expect(changes).toContainEqual({ path: ['__proto__'], existed: true, value: { x: 1 } })
      expect(changes).toContainEqual({ path: ['prototype'], existed: false })
      // biome-ignore lint/suspicious/noExplicitAny: probing prototype pollution
      expect(({} as any).x).toBeUndefined()
    })

    it('refuses with backup-stale-plan when on-disk bytes differ from plan oldText (no byte fallback)', async () => {
      readFileMock.mockResolvedValueOnce(Buffer.from('{"drifted":true}', 'utf8'))
      const r = await backup(settingsPlan(), ctx())
      expect(r.ok).toBe(false)
      if (!r.ok) {
        expect(r.error.keyword).toBe('backup-stale-plan')
      }
      // no payload written for that target (only allowed writes: none —
      // backup errors out before even metadata.json)
      const payloadCall = writeFileMock.mock.calls.find(
        (c) => !/metadata\.json$/.test(String(c[0])),
      )
      expect(payloadCall).toBeUndefined()
    })

    it('legacy-compat pin: the sha1 discriminator is never a valid sha1 hex, so old readers always fail closed', () => {
      // Released rollback hashes the stored payload and compares to entry.sha1.
      // A non-hex discriminator can never equal any digest → guaranteed abort
      // in Pass1, before a single write/unlink. This is the format-safety
      // contract (restic-style: old readers must refuse new formats).
      expect(SUBTREE_ENTRY_SHA1).not.toMatch(/^[a-f0-9]{40}$/)
    })

    it('refuses with backup-json-unsafe-number when old JSON contains 1e400 (→ Infinity)', async () => {
      const oldT = '{"a":1,"untouched":1e400}'
      const newT = '{"a":2,"untouched":1e400}'
      readFileMock.mockResolvedValueOnce(Buffer.from(oldT, 'utf8'))
      const r = await backup(settingsPlan(oldT, newT), ctx())
      expect(r.ok).toBe(false)
      if (!r.ok) {
        expect(r.error.keyword).toBe('backup-json-unsafe-number')
      }
      const payloadCall = writeFileMock.mock.calls.find(
        (c) => !/metadata\.json$/.test(String(c[0])),
      )
      expect(payloadCall).toBeUndefined()
    })

    it.each([
      ['old image', '{"big":9007199254740993}', '{"big":1}'],
      ['new image', '{"big":1}', '{"big":9007199254740993}'],
    ])('refuses unsafe integers (> MAX_SAFE_INTEGER) in the %s — no silent precision loss', async (_label, oldT, newT) => {
      readFileMock.mockResolvedValueOnce(Buffer.from(oldT, 'utf8'))
      const r = await backup(settingsPlan(oldT, newT), ctx())
      expect(r.ok).toBe(false)
      if (!r.ok) {
        expect(r.error.keyword).toBe('backup-json-unsafe-number')
      }
    })

    it('non-JSON files keep byte backup with no kind field', async () => {
      readFileMock.mockResolvedValueOnce(Buffer.from('plain text content'))
      const plan: DiffPlan = {
        files: [
          {
            target: '/tmp/proj/readme.txt',
            scope: 'PROJECT',
            oldText: 'plain text content',
            newText: 'changed',
          },
        ],
      }
      const r = await backup(plan, ctx())
      expect(r.ok).toBe(true)
      const files = metaFiles()
      expect(files[0]?.kind).toBeUndefined()
    })

    it('JSON root arrays / scalars are NOT subtree candidates (byte backup)', async () => {
      const arrOld = '[1,2,3]'
      readFileMock.mockResolvedValueOnce(Buffer.from(arrOld))
      const plan: DiffPlan = {
        files: [
          { target: '/tmp/proj/list.json', scope: 'PROJECT', oldText: arrOld, newText: '[4]' },
        ],
      }
      const r = await backup(plan, ctx())
      expect(r.ok).toBe(true)
      const files = metaFiles()
      expect(files[0]?.kind).toBeUndefined()
      const copyCall = writeFileMock.mock.calls.find((c) => !/metadata\.json$/.test(String(c[0])))
      expect(String(copyCall?.[1])).toBe(arrOld)
    })
  })
})
